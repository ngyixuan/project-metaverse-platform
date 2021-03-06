import { Uniform, Vector3 } from "three";
import { BlendFunction } from "./blending/BlendFunction.js";
import { Effect } from "./Effect.js";

const fragment = "uniform vec3 hue;\r\nuniform float saturation;\r\n\r\nvoid mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {\r\n\r\n\t// Hue.\r\n\tvec3 color = vec3(\r\n\t\tdot(inputColor.rgb, hue.xyz),\r\n\t\tdot(inputColor.rgb, hue.zxy),\r\n\t\tdot(inputColor.rgb, hue.yzx)\r\n\t);\r\n\r\n\t// Saturation.\r\n\tfloat average = (color.r + color.g + color.b) / 3.0;\r\n\tvec3 diff = average - color;\r\n\r\n\tif(saturation > 0.0) {\r\n\r\n\t\tcolor += diff * (1.0 - 1.0 / (1.001 - saturation));\r\n\r\n\t} else {\r\n\r\n\t\tcolor += diff * -saturation;\r\n\r\n\t}\r\n\r\n\toutputColor = vec4(min(color, 1.0), inputColor.a);\r\n\r\n}\r\n";

/**
 * A hue/saturation effect.
 *
 * Reference: https://github.com/evanw/glfx.js
 */

export class HueSaturationEffect extends Effect {

	/**
	 * Constructs a new hue/saturation effect.
	 *
	 * @param {Object} [options] - The options.
	 * @param {BlendFunction} [options.blendFunction=BlendFunction.NORMAL] - The blend function of this effect.
	 * @param {Number} [options.hue=0.0] - The hue in radians.
	 * @param {Number} [options.saturation=0.0] - The saturation factor, ranging from -1 to 1, where 0 means no change.
	 */

	constructor(options = {}) {

		const settings = Object.assign({
			blendFunction: BlendFunction.NORMAL,
			hue: 0.0,
			saturation: 0.0
		}, options);

		super("HueSaturationEffect", fragment, {

			blendFunction: settings.blendFunction,

			uniforms: new Map([
				["hue", new Uniform(new Vector3())],
				["saturation", new Uniform(settings.saturation)]
			])

		});

		this.setHue(settings.hue);

	}

	/**
	 * Sets the hue.
	 *
	 * @param {Number} hue - The hue in radians.
	 */

	setHue(hue) {

		const s = Math.sin(hue), c = Math.cos(hue);

		this.uniforms.get("hue").value.set(
			2.0 * c, -Math.sqrt(3.0) * s - c, Math.sqrt(3.0) * s - c
		).addScalar(1.0).divideScalar(3.0);

	}

}
