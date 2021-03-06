import { BlendFunction } from "./blending/BlendFunction.js";
import { Effect, EffectAttribute } from "./Effect.js";

const fragment = "void mainImage(const in vec4 inputColor, const in vec2 uv, const in float depth, out vec4 outputColor) {\r\n\r\n\t#ifdef INVERTED\r\n\r\n\t\tvec3 color = vec3(1.0 - depth);\r\n\r\n\t#else\r\n\r\n\t\tvec3 color = vec3(depth);\r\n\r\n\t#endif\r\n\r\n\toutputColor = vec4(color, inputColor.a);\r\n\r\n}\r\n";

/**
 * A depth visualization effect.
 *
 * Useful for debugging.
 */

export class DepthEffect extends Effect {

	/**
	 * Constructs a new depth effect.
	 *
	 * @param {Object} [options] - The options.
	 * @param {BlendFunction} [options.blendFunction=BlendFunction.NORMAL] - The blend function of this effect.
	 * @param {Boolean} [options.inverted=false] - Whether the depth values should be inverted.
	 */

	constructor(options = {}) {

		const settings = Object.assign({
			blendFunction: BlendFunction.NORMAL,
			inverted: false
		}, options);

		super("DepthEffect", fragment, {

			attributes: EffectAttribute.DEPTH,
			blendFunction: settings.blendFunction

		});

		this.inverted = settings.inverted;

	}

	/**
	 * Indicates whether depth will be inverted.
	 *
	 * @type {Boolean}
	 */

	get inverted() {

		return this.defines.has("INVERTED");

	}

	/**
	 * Enables or disables depth inversion.
	 *
	 * You'll need to call {@link EffectPass#recompile} after changing this value.
	 *
	 * @type {Boolean}
	 */

	set inverted(value) {

		value ? this.defines.set("INVERTED", "1") : this.defines.delete("INVERTED");

	}

}
