import { Uniform, Vector4 } from "three";
import { BlendFunction } from "./blending/BlendFunction.js";
import { Effect, EffectAttribute } from "./Effect.js";

const fragment = "uniform float focus;\r\nuniform float focalLength;\r\nuniform float maxBlur;\r\nuniform float luminanceThreshold;\r\nuniform float luminanceGain;\r\nuniform float bias;\r\nuniform float fringe;\r\n\r\n#ifdef MANUAL_DOF\r\n\r\n\tuniform vec4 dof;\r\n\r\n#endif\r\n\r\n#ifdef PENTAGON\r\n\r\n\tfloat pentagon(const in vec2 coords) {\r\n\r\n\t\tconst vec4 HS0 = vec4( 1.0,          0.0,         0.0, 1.0);\r\n\t\tconst vec4 HS1 = vec4( 0.309016994,  0.951056516, 0.0, 1.0);\r\n\t\tconst vec4 HS2 = vec4(-0.809016994,  0.587785252, 0.0, 1.0);\r\n\t\tconst vec4 HS3 = vec4(-0.809016994, -0.587785252, 0.0, 1.0);\r\n\t\tconst vec4 HS4 = vec4( 0.309016994, -0.951056516, 0.0, 1.0);\r\n\t\tconst vec4 HS5 = vec4( 0.0,          0.0,         1.0, 1.0);\r\n\r\n\t\tconst vec4 ONE = vec4(1.0);\r\n\r\n\t\tconst float P_FEATHER = 0.4;\r\n\t\tconst float N_FEATHER = -P_FEATHER;\r\n\r\n\t\tfloat inOrOut = -4.0;\r\n\r\n\t\tvec4 P = vec4(coords, vec2(RINGS_FLOAT - 1.3));\r\n\r\n\t\tvec4 dist = vec4(\r\n\t\t\tdot(P, HS0),\r\n\t\t\tdot(P, HS1),\r\n\t\t\tdot(P, HS2),\r\n\t\t\tdot(P, HS3)\r\n\t\t);\r\n\r\n\t\tdist = smoothstep(N_FEATHER, P_FEATHER, dist);\r\n\r\n\t\tinOrOut += dot(dist, ONE);\r\n\r\n\t\tdist.x = dot(P, HS4);\r\n\t\tdist.y = HS5.w - abs(P.z);\r\n\r\n\t\tdist = smoothstep(N_FEATHER, P_FEATHER, dist);\r\n\t\tinOrOut += dist.x;\r\n\r\n\t\treturn clamp(inOrOut, 0.0, 1.0);\r\n\r\n\t}\r\n\r\n#endif\r\n\r\nvec3 processTexel(const in vec2 coords, const in float blur) {\r\n\r\n\tvec3 c = vec3(\r\n\t\ttexture2D(inputBuffer, coords + vec2(0.0, 1.0) * texelSize * fringe * blur).r,\r\n\t\ttexture2D(inputBuffer, coords + vec2(-0.866, -0.5) * texelSize * fringe * blur).g,\r\n\t\ttexture2D(inputBuffer, coords + vec2(0.866, -0.5) * texelSize * fringe * blur).b\r\n\t);\r\n\r\n\t// Calculate the luminance of the constructed color.\r\n\tfloat luminance = linearToRelativeLuminance(c);\r\n\tfloat threshold = max((luminance - luminanceThreshold) * luminanceGain, 0.0);\r\n\r\n\treturn c + mix(vec3(0.0), c, threshold * blur);\r\n\r\n}\r\n\r\nfloat gather(const in float i, const in float j, const in float ringSamples,\r\n\tconst in vec2 uv, const in vec2 blurFactor, const in float blur, inout vec3 color) {\r\n\r\n\tfloat step = PI2 / ringSamples;\r\n\tvec2 wh = vec2(cos(j * step) * i, sin(j * step) * i);\r\n\r\n\t#ifdef PENTAGON\r\n\r\n\t\tfloat p = pentagon(wh);\r\n\r\n\t#else\r\n\r\n\t\tfloat p = 1.0;\r\n\r\n\t#endif\r\n\r\n\tcolor += processTexel(wh * blurFactor + uv, blur) * mix(1.0, i / RINGS_FLOAT, bias) * p;\r\n\r\n\treturn mix(1.0, i / RINGS_FLOAT, bias) * p;\r\n\r\n}\r\n\r\nvoid mainImage(const in vec4 inputColor, const in vec2 uv, const in float depth, out vec4 outputColor) {\r\n\r\n\t// Translate depth into world space units.\r\n\tfloat linearDepth = (-cameraFar * cameraNear / (depth * (cameraFar - cameraNear) - cameraFar));\r\n\r\n\t#ifdef MANUAL_DOF\r\n\r\n\t\tfloat focalPlane = linearDepth - focus;\r\n\t\tfloat farDoF = (focalPlane - dof.z) / dof.w;\r\n\t\tfloat nearDoF = (-focalPlane - dof.x) / dof.y;\r\n\r\n\t\tfloat blur = (focalPlane > 0.0) ? farDoF : nearDoF;\r\n\r\n\t#else\r\n\r\n\t\tconst float CIRCLE_OF_CONFUSION = 0.03; // 35mm film = 0.03mm CoC.\r\n\r\n\t\tfloat focalPlaneMM = focus * 1000.0;\r\n\t\tfloat depthMM = linearDepth * 1000.0;\r\n\r\n\t\tfloat focalPlane = (depthMM * focalLength) / (depthMM - focalLength);\r\n\t\tfloat farDoF = (focalPlaneMM * focalLength) / (focalPlaneMM - focalLength);\r\n\t\tfloat nearDoF = (focalPlaneMM - focalLength) / (focalPlaneMM * focus * CIRCLE_OF_CONFUSION);\r\n\r\n\t\tfloat blur = abs(focalPlane - farDoF) * nearDoF;\r\n\r\n\t#endif\r\n\r\n\tblur = clamp(blur, 0.0, 1.0);\r\n\r\n\tvec2 blurFactor = vec2(\r\n\t\ttexelSize.x * blur * maxBlur,\r\n\t\ttexelSize.y * blur * maxBlur\r\n\t);\r\n\r\n\tconst int MAX_RING_SAMPLES = RINGS_INT * SAMPLES_INT;\r\n\r\n\tvec3 color = inputColor.rgb;\r\n\r\n\tif(blur >= 0.05) {\r\n\r\n\t\tfloat s = 1.0;\r\n\t\tint ringSamples;\r\n\r\n\t\tfor(int i = 1; i <= RINGS_INT; i++) {\r\n\r\n\t\t\tringSamples = i * SAMPLES_INT;\r\n\r\n\t\t\tfor(int j = 0; j < MAX_RING_SAMPLES; j++) {\r\n\r\n\t\t\t\tif(j >= ringSamples) {\r\n\r\n\t\t\t\t\tbreak;\r\n\r\n\t\t\t\t}\r\n\r\n\t\t\t\ts += gather(float(i), float(j), float(ringSamples), uv, blurFactor, blur, color);\r\n\r\n\t\t\t}\r\n\r\n\t\t}\r\n\r\n\t\tcolor /= s;\r\n\r\n\t}\r\n\r\n\t#ifdef SHOW_FOCUS\r\n\r\n\t\tfloat edge = 0.002 * linearDepth;\r\n\t\tfloat m = clamp(smoothstep(0.0, edge, blur), 0.0, 1.0);\r\n\t\tfloat e = clamp(smoothstep(1.0 - edge, 1.0, blur), 0.0, 1.0);\r\n\r\n\t\tcolor = mix(color, vec3(1.0, 0.5, 0.0), (1.0 - m) * 0.6);\r\n\t\tcolor = mix(color, vec3(0.0, 0.5, 1.0), ((1.0 - e) - (1.0 - m)) * 0.2);\r\n\r\n\t#endif\r\n\r\n\toutputColor = vec4(color, inputColor.a);\r\n\r\n}\r\n";

/**
 * Depth of Field shader v2.4.
 *
 * Yields more realistic results but is also more demanding.
 *
 * Original shader code by Martins Upitis:
 *  http://blenderartists.org/forum/showthread.php?237488-GLSL-depth-of-field-with-bokeh-v2-4-(update)
 */

export class RealisticBokehEffect extends Effect {

	/**
	 * Constructs a new bokeh effect.
	 *
	 * @param {Object} [options] - The options.
	 * @param {BlendFunction} [options.blendFunction=BlendFunction.NORMAL] - The blend function of this effect.
	 * @param {Number} [options.focus=0.5] - The focus distance ratio, ranging from 0.0 to 1.0.
	 * @param {Number} [options.focalLength=24.0] - The focal length of the main camera.
	 * @param {Number} [options.luminanceThreshold=0.5] - A luminance threshold.
	 * @param {Number} [options.luminanceGain=2.0] - A luminance gain factor.
	 * @param {Number} [options.bias=0.5] - A blur bias.
	 * @param {Number} [options.fringe=0.7] - A blur offset.
	 * @param {Number} [options.maxBlur=1.0] - The maximum blur strength.
	 * @param {Boolean} [options.rings=3] - The number of blur iterations.
	 * @param {Boolean} [options.samples=2] - The amount of samples taken per ring.
	 * @param {Boolean} [options.showFocus=false] - Whether the focal point should be highlighted. Useful for debugging.
	 * @param {Boolean} [options.manualDoF=false] - Enables manual control over the depth of field.
	 * @param {Boolean} [options.pentagon=false] - Enables pentagonal blur shapes. Requires a high number of rings and samples.
	 */

	constructor(options = {}) {

		const settings = Object.assign({
			blendFunction: BlendFunction.NORMAL,
			focus: 0.5,
			focalLength: 24.0,
			luminanceThreshold: 0.5,
			luminanceGain: 2.0,
			bias: 0.5,
			fringe: 0.7,
			maxBlur: 1.0,
			rings: 3,
			samples: 2,
			showFocus: false,
			manualDoF: false,
			pentagon: false
		}, options);

		super("RealisticBokehEffect", fragment, {

			attributes: EffectAttribute.CONVOLUTION | EffectAttribute.DEPTH,
			blendFunction: settings.blendFunction,

			uniforms: new Map([
				["focus", new Uniform(settings.focus)],
				["focalLength", new Uniform(settings.focalLength)],
				["luminanceThreshold", new Uniform(settings.luminanceThreshold)],
				["luminanceGain", new Uniform(settings.luminanceGain)],
				["bias", new Uniform(settings.bias)],
				["fringe", new Uniform(settings.fringe)],
				["maxBlur", new Uniform(settings.maxBlur)]
			])

		});

		this.rings = settings.rings;
		this.samples = settings.samples;
		this.showFocus = settings.showFocus;
		this.manualDoF = settings.manualDoF;
		this.pentagon = settings.pentagon;

	}

	/**
	 * The amount of blur iterations.
	 *
	 * @type {Number}
	 */

	get rings() {

		return Number.parseInt(this.defines.get("RINGS_INT"));

	}

	/**
	 * Sets the amount of blur iterations.
	 *
	 * You'll need to call {@link EffectPass#recompile} after changing this value.
	 *
	 * @type {Number}
	 */

	set rings(value) {

		value = Math.floor(value);

		this.defines.set("RINGS_INT", value.toFixed(0));
		this.defines.set("RINGS_FLOAT", value.toFixed(1));

	}

	/**
	 * The amount of blur samples per ring.
	 *
	 * @type {Number}
	 */

	get samples() {

		return Number.parseInt(this.defines.get("SAMPLES_INT"));

	}

	/**
	 * Sets the amount of blur samples per ring.
	 *
	 * You'll need to call {@link EffectPass#recompile} after changing this value.
	 *
	 * @type {Number}
	 */

	set samples(value) {

		value = Math.floor(value);

		this.defines.set("SAMPLES_INT", value.toFixed(0));
		this.defines.set("SAMPLES_FLOAT", value.toFixed(1));

	}

	/**
	 * Indicates whether the focal point will be highlighted.
	 *
	 * @type {Boolean}
	 */

	get showFocus() {

		return this.defines.has("SHOW_FOCUS");

	}

	/**
	 * Enables or disables focal point highlighting.
	 *
	 * You'll need to call {@link EffectPass#recompile} after changing this value.
	 *
	 * @type {Boolean}
	 */

	set showFocus(value) {

		value ? this.defines.set("SHOW_FOCUS", "1") : this.defines.delete("SHOW_FOCUS");

	}

	/**
	 * Indicates whether the Depth of Field should be calculated manually.
	 *
	 * If enabled, the Depth of Field can be adjusted via the `dof` uniform.
	 *
	 * @type {Boolean}
	 */

	get manualDoF() {

		return this.defines.has("MANUAL_DOF");

	}

	/**
	 * Enables or disables manual Depth of Field.
	 *
	 * You'll need to call {@link EffectPass#recompile} after changing this value.
	 *
	 * @type {Boolean}
	 */

	set manualDoF(value) {

		if(value) {

			this.defines.set("MANUAL_DOF", "1");
			this.uniforms.set("dof", new Uniform(new Vector4(0.2, 1.0, 0.2, 2.0)));

		} else {

			this.defines.delete("MANUAL_DOF");
			this.uniforms.delete("dof");

		}

	}

	/**
	 * Indicates whether the blur shape should be pentagonal.
	 *
	 * @type {Boolean}
	 */

	get pentagon() {

		return this.defines.has("PENTAGON");

	}

	/**
	 * Enables or disables pentagonal blur.
	 *
	 * You'll need to call {@link EffectPass#recompile} after changing this value.
	 *
	 * @type {Boolean}
	 */

	set pentagon(value) {

		value ? this.defines.set("PENTAGON", "1") : this.defines.delete("PENTAGON");

	}

}
