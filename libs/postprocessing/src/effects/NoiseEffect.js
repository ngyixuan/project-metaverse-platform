import { BlendFunction } from "./blending/BlendFunction.js";
import { Effect } from "./Effect.js";

const fragment = "void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {\r\n\r\n\tvec3 noise = vec3(rand(uv * time));\r\n\r\n\t#ifdef PREMULTIPLY\r\n\r\n\t\toutputColor = vec4(inputColor.rgb * noise, inputColor.a);\r\n\r\n\t#else\r\n\r\n\t\toutputColor = vec4(noise, inputColor.a);\r\n\r\n\t#endif\r\n\r\n}\r\n";

/**
 * A noise effect.
 */

export class NoiseEffect extends Effect {

	/**
	 * Constructs a new noise effect.
	 *
	 * @param {Object} [options] - The options.
	 * @param {BlendFunction} [options.blendFunction=BlendFunction.SCREEN] - The blend function of this effect.
	 * @param {Boolean} [options.premultiply=false] - Whether the noise should be multiplied with the input color.
	 */

	constructor(options = {}) {

		const settings = Object.assign({
			blendFunction: BlendFunction.SCREEN,
			premultiply: false
		}, options);

		super("NoiseEffect", fragment, { blendFunction: settings.blendFunction });

		this.premultiply = settings.premultiply;

	}

	/**
	 * Indicates whether the noise should be multiplied with the input color.
	 *
	 * @type {Boolean}
	 */

	get premultiply() {

		return this.defines.has("PREMULTIPLY");

	}

	/**
	 * Enables or disables noise premultiplication.
	 *
	 * You'll need to call {@link EffectPass#recompile} after changing this value.
	 *
	 * @type {Boolean}
	 */

	set premultiply(value) {

		value ? this.defines.set("PREMULTIPLY", "1") : this.defines.delete("PREMULTIPLY");

	}

}
