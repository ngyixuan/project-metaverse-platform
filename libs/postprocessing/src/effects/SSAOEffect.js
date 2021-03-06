import { Matrix4, Uniform, Vector2 } from "three";
import { BlendFunction } from "./blending/BlendFunction.js";
import { Effect, EffectAttribute } from "./Effect.js";

const fragment = "uniform sampler2D normalBuffer;\r\n\r\nuniform mat4 cameraProjectionMatrix;\r\nuniform mat4 cameraInverseProjectionMatrix;\r\n\r\nuniform vec2 radiusStep;\r\nuniform vec2 distanceCutoff;\r\nuniform vec2 proximityCutoff;\r\nuniform float seed;\r\nuniform float luminanceInfluence;\r\nuniform float scale;\r\nuniform float bias;\r\n\r\nfloat getViewZ(const in float depth) {\r\n\r\n\t#ifdef PERSPECTIVE_CAMERA\r\n\r\n\t\treturn perspectiveDepthToViewZ(depth, cameraNear, cameraFar);\r\n\r\n\t#else\r\n\r\n\t\treturn orthographicDepthToViewZ(depth, cameraNear, cameraFar);\r\n\r\n\t#endif\r\n\r\n}\r\n\r\nvec3 getViewPosition(const in vec2 screenPosition, const in float depth, const in float viewZ) {\r\n\r\n\tfloat clipW = cameraProjectionMatrix[2][3] * viewZ + cameraProjectionMatrix[3][3];\r\n\tvec4 clipPosition = vec4((vec3(screenPosition, depth) - 0.5) * 2.0, 1.0);\r\n\tclipPosition *= clipW; // Unproject.\r\n\r\n\treturn (cameraInverseProjectionMatrix * clipPosition).xyz;\r\n\r\n}\r\n\r\nfloat getOcclusion(const in vec3 p, const in vec3 n, const in vec3 sampleViewPosition) {\r\n\r\n\tvec3 viewDelta = sampleViewPosition - p;\r\n\tfloat d = length(viewDelta) * scale;\r\n\r\n\treturn max(0.0, dot(n, viewDelta) / d - bias) / (1.0 + pow2(d));\r\n\r\n}\r\n\r\nfloat getAmbientOcclusion(const in vec3 p, const in vec3 n, const in float depth, const in vec2 uv) {\r\n\r\n\tvec2 radius = radiusStep;\r\n\tfloat angle = rand(uv + seed) * PI2;\r\n\tfloat occlusionSum = 0.0;\r\n\r\n\t// Collect samples along a discrete spiral pattern.\r\n\tfor(int i = 0; i < SAMPLES_INT; ++i) {\r\n\r\n\t\tvec2 coord = uv + vec2(cos(angle), sin(angle)) * radius;\r\n\t\tradius += radiusStep;\r\n\t\tangle += ANGLE_STEP;\r\n\r\n\t\tfloat sampleDepth = readDepth(coord);\r\n\t\tfloat proximity = abs(depth - sampleDepth);\r\n\r\n\t\tif(sampleDepth < distanceCutoff.y && proximity < proximityCutoff.y) {\r\n\r\n\t\t\tfloat falloff = 1.0 - smoothstep(proximityCutoff.x, proximityCutoff.y, proximity);\r\n\t\t\tvec3 sampleViewPosition = getViewPosition(coord, sampleDepth, getViewZ(sampleDepth));\r\n\t\t\tocclusionSum += getOcclusion(p, n, sampleViewPosition) * falloff;\r\n\r\n\t\t}\r\n\r\n\t}\r\n\r\n\treturn occlusionSum / SAMPLES_FLOAT;\r\n\r\n}\r\n\r\nvoid mainImage(const in vec4 inputColor, const in vec2 uv, const in float depth, out vec4 outputColor) {\r\n\r\n\tfloat ao = 1.0;\r\n\r\n\t// Skip fragments of objects that are too far away.\r\n\tif(depth < distanceCutoff.y) {\r\n\r\n\t\tvec3 viewPosition = getViewPosition(uv, depth, getViewZ(depth));\r\n\t\tvec3 viewNormal = unpackRGBToNormal(texture2D(normalBuffer, uv).xyz);\r\n\t\tao -= getAmbientOcclusion(viewPosition, viewNormal, depth, uv);\r\n\r\n\t\t// Fade AO based on luminance and depth.\r\n\t\tfloat l = linearToRelativeLuminance(inputColor.rgb);\r\n\t\tao = mix(ao, 1.0, max(l * luminanceInfluence, smoothstep(distanceCutoff.x, distanceCutoff.y, depth)));\r\n\r\n\t}\r\n\r\n\toutputColor = vec4(vec3(ao), inputColor.a);\r\n\r\n}\r\n";

/**
 * A Screen Space Ambient Occlusion (SSAO) effect.
 *
 * SSAO is a method to approximate ambient occlusion in screen space.
 *
 * For high quality visuals use two SSAO effect instances in a row with
 * different radii, one for rough AO and one for fine details.
 *
 * This implementation uses a discrete spiral sampling pattern:
 *  https://jsfiddle.net/a16ff1p7
 */

export class SSAOEffect extends Effect {

	/**
	 * Constructs a new SSAO effect.
	 *
	 * @param {Camera} camera - The main camera.
	 * @param {Texture} normalBuffer - A texture that contains the scene normals. See {@link NormalPass}.
	 * @param {Object} [options] - The options.
	 * @param {BlendFunction} [options.blendFunction=BlendFunction.MULTIPLY] - The blend function of this effect.
	 * @param {Number} [options.samples=11] - The amount of samples per pixel. Should not be a multiple of the ring count.
	 * @param {Number} [options.rings=4] - The amount of rings in the occlusion sampling pattern.
	 * @param {Number} [options.distanceThreshold=0.65] - A global distance threshold at which the occlusion effect starts to fade out. Range [0.0, 1.0].
	 * @param {Number} [options.distanceFalloff=0.1] - The distance falloff. Influences the smoothness of the overall occlusion cutoff. Range [0.0, 1.0].
	 * @param {Number} [options.rangeThreshold=0.0015] - A local occlusion range threshold at which the occlusion starts to fade out. Range [0.0, 1.0].
	 * @param {Number} [options.rangeFalloff=0.01] - The occlusion range falloff. Influences the smoothness of the proximity cutoff. Range [0.0, 1.0].
	 * @param {Number} [options.luminanceInfluence=0.7] - Determines how much the luminance of the scene influences the ambient occlusion.
	 * @param {Number} [options.radius=18.25] - The occlusion sampling radius.
	 * @param {Number} [options.scale=1.0] - The scale of the ambient occlusion.
	 * @param {Number} [options.bias=0.5] - An occlusion bias.
	 */

	constructor(camera, normalBuffer, options = {}) {

		const settings = Object.assign({
			blendFunction: BlendFunction.MULTIPLY,
			samples: 11,
			rings: 4,
			distanceThreshold: 0.65,
			distanceFalloff: 0.1,
			rangeThreshold: 0.0015,
			rangeFalloff: 0.01,
			luminanceInfluence: 0.7,
			radius: 18.25,
			scale: 1.0,
			bias: 0.5
		}, options);

		super("SSAOEffect", fragment, {

			attributes: EffectAttribute.DEPTH,
			blendFunction: settings.blendFunction,

			defines: new Map([
				["RINGS_INT", "0"],
				["SAMPLES_INT", "0"],
				["SAMPLES_FLOAT", "0.0"]
			]),

			uniforms: new Map([
				["normalBuffer", new Uniform(normalBuffer)],
				["cameraInverseProjectionMatrix", new Uniform(new Matrix4())],
				["cameraProjectionMatrix", new Uniform(new Matrix4())],
				["radiusStep", new Uniform(new Vector2())],
				["distanceCutoff", new Uniform(new Vector2())],
				["proximityCutoff", new Uniform(new Vector2())],
				["seed", new Uniform(Math.random())],
				["luminanceInfluence", new Uniform(settings.luminanceInfluence)],
				["scale", new Uniform(settings.scale)],
				["bias", new Uniform(settings.bias)]
			])

		});

		/**
		 * The current sampling radius.
		 *
		 * @type {Number}
		 * @private
		 */

		this.r = 0.0;

		/**
		 * The current resolution.
		 *
		 * @type {Vector2}
		 * @private
		 */

		this.resolution = new Vector2(1, 1);

		/**
		 * The main camera.
		 *
		 * @type {Camera}
		 * @private
		 */

		this.camera = camera;

		this.samples = settings.samples;
		this.rings = settings.rings;
		this.radius = settings.radius;

		this.setDistanceCutoff(settings.distanceThreshold, settings.distanceFalloff);
		this.setProximityCutoff(settings.rangeThreshold, settings.rangeFalloff);

	}

	/**
	 * Updates the angle step constant.
	 *
	 * @private
	 */

	updateAngleStep() {

		this.defines.set("ANGLE_STEP", (Math.PI * 2.0 * this.rings / this.samples).toFixed(11));

	}

	/**
	 * Updates the radius step uniform.
	 *
	 * Note: The radius step is a uniform because it changes with the screen size.
	 *
	 * @private
	 */

	updateRadiusStep() {

		const r = this.r / this.samples;
		this.uniforms.get("radiusStep").value.set(r, r).divide(this.resolution);

	}

	/**
	 * The amount of occlusion samples per pixel.
	 *
	 * @type {Number}
	 */

	get samples() {

		return Number.parseInt(this.defines.get("SAMPLES_INT"));

	}

	/**
	 * Sets the amount of occlusion samples per pixel.
	 *
	 * You'll need to call {@link EffectPass#recompile} after changing this value.
	 *
	 * @type {Number}
	 */

	set samples(value) {

		value = Math.floor(value);

		this.defines.set("SAMPLES_INT", value.toFixed(0));
		this.defines.set("SAMPLES_FLOAT", value.toFixed(1));
		this.updateAngleStep();
		this.updateRadiusStep();

	}

	/**
	 * The amount of rings in the occlusion sampling spiral pattern.
	 *
	 * @type {Number}
	 */

	get rings() {

		return Number.parseInt(this.defines.get("RINGS_INT"));

	}

	/**
	 * Sets the amount of rings in the occlusion sampling spiral pattern.
	 *
	 * You'll need to call {@link EffectPass#recompile} after changing this value.
	 *
	 * @type {Number}
	 */

	set rings(value) {

		value = Math.floor(value);

		this.defines.set("RINGS_INT", value.toFixed(0));
		this.updateAngleStep();

	}

	/**
	 * The occlusion sampling radius.
	 *
	 * @type {Number}
	 */

	get radius() {

		return this.r;

	}

	/**
	 * Sets the occlusion sampling radius.
	 *
	 * @type {Number}
	 */

	set radius(value) {

		this.r = value;
		this.updateRadiusStep();

	}

	/**
	 * Sets the occlusion distance cutoff.
	 *
	 * @param {Number} threshold - The distance threshold. Range [0.0, 1.0].
	 * @param {Number} falloff - The falloff. Range [0.0, 1.0].
	 */

	setDistanceCutoff(threshold, falloff) {

		this.uniforms.get("distanceCutoff").value.set(threshold, Math.min(threshold + falloff, 1.0 - 1e-6));

	}

	/**
	 * Sets the occlusion proximity cutoff.
	 *
	 * @param {Number} threshold - The range threshold. Range [0.0, 1.0].
	 * @param {Number} falloff - The falloff. Range [0.0, 1.0].
	 */

	setProximityCutoff(threshold, falloff) {

		this.uniforms.get("proximityCutoff").value.set(threshold, Math.min(threshold + falloff, 1.0 - 1e-6));

	}

	/**
	 * Updates the camera projection matrix uniforms.
	 *
	 * @param {Number} width - The width.
	 * @param {Number} height - The height.
	 */

	setSize(width, height) {

		this.resolution.set(width, height);
		this.updateRadiusStep();

		this.uniforms.get("cameraInverseProjectionMatrix").value.getInverse(this.camera.projectionMatrix);
		this.uniforms.get("cameraProjectionMatrix").value.copy(this.camera.projectionMatrix);

	}

}
