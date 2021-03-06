import { ShaderMaterial, Uniform, Vector2 } from "three";

const fragment = "uniform sampler2D inputBuffer;\r\n\r\nvarying vec2 vUv;\r\n\r\nvarying vec2 vUv0;\r\nvarying vec2 vUv1;\r\nvarying vec2 vUv2;\r\nvarying vec2 vUv3;\r\nvarying vec2 vUv4;\r\nvarying vec2 vUv5;\r\n\r\nvoid main() {\r\n\r\n\tconst vec2 threshold = vec2(EDGE_THRESHOLD);\r\n\r\n\t// Calculate color deltas.\r\n\tvec4 delta;\r\n\tvec3 c = texture2D(inputBuffer, vUv).rgb;\r\n\r\n\tvec3 cLeft = texture2D(inputBuffer, vUv0).rgb;\r\n\tvec3 t = abs(c - cLeft);\r\n\tdelta.x = max(max(t.r, t.g), t.b);\r\n\r\n\tvec3 cTop = texture2D(inputBuffer, vUv1).rgb;\r\n\tt = abs(c - cTop);\r\n\tdelta.y = max(max(t.r, t.g), t.b);\r\n\r\n\t// Use a threshold to detect significant color edges.\r\n\tvec2 edges = step(threshold, delta.xy);\r\n\r\n\t// Discard if there is no edge.\r\n\tif(dot(edges, vec2(1.0)) == 0.0) {\r\n\r\n\t\tdiscard;\r\n\r\n\t}\r\n\r\n\t// Calculate right and bottom deltas.\r\n\tvec3 cRight = texture2D(inputBuffer, vUv2).rgb;\r\n\tt = abs(c - cRight);\r\n\tdelta.z = max(max(t.r, t.g), t.b);\r\n\r\n\tvec3 cBottom = texture2D(inputBuffer, vUv3).rgb;\r\n\tt = abs(c - cBottom);\r\n\tdelta.w = max(max(t.r, t.g), t.b);\r\n\r\n\t// Calculate the maximum delta in the direct neighborhood.\r\n\tfloat maxDelta = max(max(max(delta.x, delta.y), delta.z), delta.w);\r\n\r\n\t// Calculate left-left and top-top deltas.\r\n\tvec3 cLeftLeft = texture2D(inputBuffer, vUv4).rgb;\r\n\tt = abs(c - cLeftLeft);\r\n\tdelta.z = max(max(t.r, t.g), t.b);\r\n\r\n\tvec3 cTopTop = texture2D(inputBuffer, vUv5).rgb;\r\n\tt = abs(c - cTopTop);\r\n\tdelta.w = max(max(t.r, t.g), t.b);\r\n\r\n\t// Calculate the final maximum delta.\r\n\tmaxDelta = max(max(maxDelta, delta.z), delta.w);\r\n\r\n\t// Local contrast adaptation.\r\n\tedges *= step(0.5 * maxDelta, delta.xy);\r\n\r\n\tgl_FragColor = vec4(edges, 0.0, 0.0);\r\n\r\n}\r\n";
const vertex = "uniform vec2 texelSize;\r\n\r\nvarying vec2 vUv;\r\n\r\nvarying vec2 vUv0;\r\nvarying vec2 vUv1;\r\nvarying vec2 vUv2;\r\nvarying vec2 vUv3;\r\nvarying vec2 vUv4;\r\nvarying vec2 vUv5;\r\n\r\nvoid main() {\r\n\r\n\tvUv = uv;\r\n\r\n\t// Left and top texel coordinates.\r\n\tvUv0 = uv + texelSize * vec2(-1.0, 0.0);\r\n\tvUv1 = uv + texelSize * vec2(0.0, 1.0);\r\n\r\n\t// Right and bottom texel coordinates.\r\n\tvUv2 = uv + texelSize * vec2(1.0, 0.0);\r\n\tvUv3 = uv + texelSize * vec2(0.0, -1.0);\r\n\r\n\t// Left-left and top-top texel coordinates.\r\n\tvUv4 = uv + texelSize * vec2(-2.0, 0.0);\r\n\tvUv5 = uv + texelSize * vec2(0.0, 2.0);\r\n\r\n\tgl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\r\n\r\n}\r\n";

/**
 * A material that detects edges in a color texture.
 *
 * Mainly used for Subpixel Morphological Antialiasing.
 */

export class ColorEdgesMaterial extends ShaderMaterial {

	/**
	 * Constructs a new color edges material.
	 *
	 * @param {Vector2} [texelSize] - The absolute screen texel size.
	 */

	constructor(texelSize = new Vector2()) {

		super({

			type: "ColorEdgesMaterial",

			defines: {

				EDGE_THRESHOLD: "0.1"

			},

			uniforms: {

				inputBuffer: new Uniform(null),
				texelSize: new Uniform(texelSize)

			},

			fragmentShader: fragment,
			vertexShader: vertex,

			depthWrite: false,
			depthTest: false

		});

	}

	/**
	 * Sets the edge detection sensitivity.
	 *
	 * A lower value results in more edges being detected at the expense of
	 * performance.
	 *
	 * 0.1 is a reasonable value, and allows to catch most visible edges.
	 * 0.05 is a rather overkill value, that allows to catch 'em all.
	 *
	 * If temporal supersampling is used, 0.2 could be a reasonable value,
	 * as low contrast edges are properly filtered by just 2x.
	 *
	 * @param {Number} threshold - The edge detection sensitivity. Range: [0.05, 0.5].
	 */

	setEdgeDetectionThreshold(threshold) {

		this.defines.EDGE_THRESHOLD = threshold.toFixed("2");
		this.needsUpdate = true;

	}

}
