import { Uniform, Vector2 } from "three";
import { BlendFunction } from "./blending/BlendFunction.js";
import { Effect } from "./Effect.js";

const fragment = "uniform vec2 scale;\r\nuniform float lineWidth;\r\n\r\nvoid mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {\r\n\r\n\tfloat grid = 0.5 - max(abs(mod(uv.x * scale.x, 1.0) - 0.5), abs(mod(uv.y * scale.y, 1.0) - 0.5));\r\n\toutputColor = vec4(vec3(smoothstep(0.0, lineWidth, grid)), inputColor.a);\r\n\r\n}\r\n";

/**
 * A grid effect.
 */

export class GridEffect extends Effect {

	/**
	 * Constructs a new grid effect.
	 *
	 * @param {Object} [options] - The options.
	 * @param {BlendFunction} [options.blendFunction=BlendFunction.OVERLAY] - The blend function of this effect.
	 * @param {Number} [options.scale=1.0] - The scale of the grid pattern.
	 * @param {Number} [options.lineWidth=0.0] - The line width of the grid pattern.
	 */

	constructor(options = {}) {

		const settings = Object.assign({
			blendFunction: BlendFunction.OVERLAY,
			scale: 1.0,
			lineWidth: 0.0
		}, options);

		super("GridEffect", fragment, {

			blendFunction: settings.blendFunction,

			uniforms: new Map([
				["scale", new Uniform(new Vector2())],
				["lineWidth", new Uniform(settings.lineWidth)]
			])

		});

		/**
		 * The original resolution.
		 *
		 * @type {Vector2}
		 * @private
		 */

		this.resolution = new Vector2();

		/**
		 * The grid scale, relative to the screen height.
		 *
		 * @type {Number}
		 * @private
		 */

		this.scale = Math.max(settings.scale, 1e-6);

		/**
		 * The grid line width.
		 *
		 * @type {Number}
		 * @private
		 */

		this.lineWidth = Math.max(settings.lineWidth, 0.0);

	}

	/**
	 * Returns the current grid scale.
	 *
	 * @return {Number} The grid scale.
	 */

	getScale() {

		return this.scale;

	}

	/**
	 * Sets the grid scale.
	 *
	 * @param {Number} scale - The new grid scale.
	 */

	setScale(scale) {

		this.scale = scale;
		this.setSize(this.resolution.x, this.resolution.y);

	}

	/**
	 * Returns the current grid line width.
	 *
	 * @return {Number} The grid line width.
	 */

	getLineWidth() {

		return this.lineWidth;

	}

	/**
	 * Sets the grid line width.
	 *
	 * @param {Number} lineWidth - The new grid line width.
	 */

	setLineWidth(lineWidth) {

		this.lineWidth = lineWidth;
		this.setSize(this.resolution.x, this.resolution.y);

	}

	/**
	 * Updates the size of this pass.
	 *
	 * @param {Number} width - The width.
	 * @param {Number} height - The height.
	 */

	setSize(width, height) {

		this.resolution.set(width, height);

		const aspect = width / height;
		const scale = this.scale * (height * 0.125);

		this.uniforms.get("scale").value.set(aspect * scale, scale);
		this.uniforms.get("lineWidth").value = (scale / height) + this.lineWidth;

	}

}
