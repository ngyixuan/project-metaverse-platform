import { Uniform } from "three";
import { BlendFunction } from "./BlendFunction.js";

const addBlendFunction = "vec3 blend(const in vec3 x, const in vec3 y, const in float opacity) {\r\n\r\n\treturn min(x + y, 1.0) * opacity + x * (1.0 - opacity);\r\n\r\n}\r\n\r\nvec4 blend(const in vec4 x, const in vec4 y, const in float opacity) {\r\n\r\n\treturn vec4(blend(x.rgb, y.rgb, opacity), y.a);\r\n\r\n}\r\n";
const alphaBlendFunction = "vec3 blend(const in vec3 x, const in vec3 y, const in float opacity) {\r\n\r\n\treturn y * opacity + x * (1.0 - opacity);\r\n\r\n}\r\n\r\nvec4 blend(const in vec4 x, const in vec4 y, const in float opacity) {\r\n\r\n\treturn vec4(blend(x.rgb, y.rgb, y.a), x.a);\r\n\r\n}\r\n";
const averageBlendFunction = "vec3 blend(const in vec3 x, const in vec3 y, const in float opacity) {\r\n\r\n\treturn (x + y) * 0.5 * opacity + x * (1.0 - opacity);\r\n\r\n}\r\n\r\nvec4 blend(const in vec4 x, const in vec4 y, const in float opacity) {\r\n\r\n\treturn vec4(blend(x.rgb, y.rgb, opacity), y.a);\r\n\r\n}\r\n";
const colorBurnBlendFunction = "float blend(const in float x, const in float y) {\r\n\r\n\treturn (y == 0.0) ? y : max(1.0 - (1.0 - x) / y, 0.0);\r\n\r\n}\r\n\r\nvec3 blend(const in vec3 x, const in vec3 y, const in float opacity) {\r\n\r\n\tvec3 z = vec3(blend(x.r, y.r), blend(x.g, y.g), blend(x.b, y.b));\r\n\r\n\treturn z * opacity + x * (1.0 - opacity);\r\n\r\n}\r\n\r\nvec4 blend(const in vec4 x, const in vec4 y, const in float opacity) {\r\n\r\n\treturn vec4(blend(x.rgb, y.rgb, opacity), y.a);\r\n\r\n}\r\n";
const colorDodgeBlendFunction = "float blend(const in float x, const in float y) {\r\n\r\n\treturn (y == 1.0) ? y : min(x / (1.0 - y), 1.0);\r\n\r\n}\r\n\r\nvec3 blend(const in vec3 x, const in vec3 y, const in float opacity) {\r\n\r\n\tvec3 z = vec3(blend(x.r, y.r), blend(x.g, y.g), blend(x.b, y.b));\r\n\r\n\treturn z * opacity + x * (1.0 - opacity);\r\n\r\n}\r\n\r\nvec4 blend(const in vec4 x, const in vec4 y, const in float opacity) {\r\n\r\n\treturn vec4(blend(x.rgb, y.rgb, opacity), y.a);\r\n\r\n}\r\n";
const darkenBlendFunction = "vec3 blend(const in vec3 x, const in vec3 y, const in float opacity) {\r\n\r\n\treturn min(x, y) * opacity + x * (1.0 - opacity);\r\n\r\n}\r\n\r\nvec4 blend(const in vec4 x, const in vec4 y, const in float opacity) {\r\n\r\n\treturn vec4(blend(x.rgb, y.rgb, opacity), y.a);\r\n\r\n}\r\n";
const differenceBlendFunction = "vec3 blend(const in vec3 x, const in vec3 y, const in float opacity) {\r\n\r\n\treturn abs(x - y) * opacity + x * (1.0 - opacity);\r\n\r\n}\r\n\r\nvec4 blend(const in vec4 x, const in vec4 y, const in float opacity) {\r\n\r\n\treturn vec4(blend(x.rgb, y.rgb, opacity), y.a);\r\n\r\n}\r\n";
const exclusionBlendFunction = "vec3 blend(const in vec3 x, const in vec3 y, const in float opacity) {\r\n\r\n\treturn (x + y - 2.0 * x * y) * opacity + x * (1.0 - opacity);\r\n\r\n}\r\n\r\nvec4 blend(const in vec4 x, const in vec4 y, const in float opacity) {\r\n\r\n\treturn vec4(blend(x.rgb, y.rgb, opacity), y.a);\r\n\r\n}\r\n";
const lightenBlendFunction = "vec3 blend(const in vec3 x, const in vec3 y, const in float opacity) {\r\n\r\n\treturn max(x, y) * opacity + x * (1.0 - opacity);\r\n\r\n}\r\n\r\nvec4 blend(const in vec4 x, const in vec4 y, const in float opacity) {\r\n\r\n\treturn vec4(blend(x.rgb, y.rgb, opacity), y.a);\r\n\r\n}\r\n";
const multiplyBlendFunction = "vec3 blend(const in vec3 x, const in vec3 y, const in float opacity) {\r\n\r\n\treturn x * y * opacity + x * (1.0 - opacity);\r\n\r\n}\r\n\r\nvec4 blend(const in vec4 x, const in vec4 y, const in float opacity) {\r\n\r\n\treturn vec4(blend(x.rgb, y.rgb, opacity), y.a);\r\n\r\n}\r\n";
const negationBlendFunction = "vec3 blend(const in vec3 x, const in vec3 y, const in float opacity) {\r\n\r\n\treturn (1.0 - abs(1.0 - x - y)) * opacity + x * (1.0 - opacity);\r\n\r\n}\r\n\r\nvec4 blend(const in vec4 x, const in vec4 y, const in float opacity) {\r\n\r\n\treturn vec4(blend(x.rgb, y.rgb, opacity), y.a);\r\n\r\n}\r\n";
const normalBlendFunction = "vec3 blend(const in vec3 x, const in vec3 y, const in float opacity) {\r\n\r\n\treturn y * opacity + x * (1.0 - opacity);\r\n\r\n}\r\n\r\nvec4 blend(const in vec4 x, const in vec4 y, const in float opacity) {\r\n\r\n\treturn vec4(blend(x.rgb, y.rgb, opacity), y.a);\r\n\r\n}\r\n";
const overlayBlendFunction = "float blend(const in float x, const in float y) {\r\n\r\n\treturn (x < 0.5) ? (2.0 * x * y) : (1.0 - 2.0 * (1.0 - x) * (1.0 - y));\r\n\r\n}\r\n\r\nvec3 blend(const in vec3 x, const in vec3 y, const in float opacity) {\r\n\r\n\tvec3 z = vec3(blend(x.r, y.r), blend(x.g, y.g), blend(x.b, y.b));\r\n\r\n\treturn z * opacity + x * (1.0 - opacity);\r\n\r\n}\r\n\r\nvec4 blend(const in vec4 x, const in vec4 y, const in float opacity) {\r\n\r\n\treturn vec4(blend(x.rgb, y.rgb, opacity), y.a);\r\n\r\n}\r\n";
const reflectBlendFunction = "float blend(const in float x, const in float y) {\r\n\r\n\treturn (y == 1.0) ? y : min(x * x / (1.0 - y), 1.0);\r\n\r\n}\r\n\r\nvec3 blend(const in vec3 x, const in vec3 y, const in float opacity) {\r\n\r\n\tvec3 z = vec3(blend(x.r, y.r), blend(x.g, y.g), blend(x.b, y.b));\r\n\r\n\treturn z * opacity + x * (1.0 - opacity);\r\n\r\n}\r\n\r\nvec4 blend(const in vec4 x, const in vec4 y, const in float opacity) {\r\n\r\n\treturn vec4(blend(x.rgb, y.rgb, opacity), y.a);\r\n\r\n}\r\n";
const screenBlendFunction = "vec3 blend(const in vec3 x, const in vec3 y, const in float opacity) {\r\n\r\n\treturn (1.0 - (1.0 - x) * (1.0 - y)) * opacity + x * (1.0 - opacity);\r\n\r\n}\r\n\r\nvec4 blend(const in vec4 x, const in vec4 y, const in float opacity) {\r\n\r\n\treturn vec4(blend(x.rgb, y.rgb, opacity), y.a);\r\n\r\n}\r\n";
const softLightBlendFunction = "float blend(const in float x, const in float y) {\r\n\r\n\treturn (y < 0.5) ?\r\n\t\t(2.0 * x * y + x * x * (1.0 - 2.0 * y)) :\r\n\t\t(sqrt(x) * (2.0 * y - 1.0) + 2.0 * x * (1.0 - y));\r\n\r\n}\r\n\r\nvec3 blend(const in vec3 x, const in vec3 y, const in float opacity) {\r\n\r\n\tvec3 z = vec3(blend(x.r, y.r), blend(x.g, y.g), blend(x.b, y.b));\r\n\r\n\treturn z * opacity + x * (1.0 - opacity);\r\n\r\n}\r\n\r\nvec4 blend(const in vec4 x, const in vec4 y, const in float opacity) {\r\n\r\n\treturn vec4(blend(x.rgb, y.rgb, opacity), y.a);\r\n\r\n}\r\n";
const subtractBlendFunction = "vec3 blend(const in vec3 x, const in vec3 y, const in float opacity) {\r\n\r\n\treturn max(x + y - 1.0, 0.0) * opacity + x * (1.0 - opacity);\r\n\r\n}\r\n\r\nvec4 blend(const in vec4 x, const in vec4 y, const in float opacity) {\r\n\r\n\treturn vec4(blend(x.rgb, y.rgb, opacity), y.a);\r\n\r\n}\r\n";

/**
 * A blend function shader code catalogue.
 *
 * @type {Map<BlendFunction, String>}
 * @private
 */

const blendFunctions = new Map([
	[BlendFunction.SKIP, null],
	[BlendFunction.ADD, addBlendFunction],
	[BlendFunction.ALPHA, alphaBlendFunction],
	[BlendFunction.AVERAGE, averageBlendFunction],
	[BlendFunction.COLOR_BURN, colorBurnBlendFunction],
	[BlendFunction.COLOR_DODGE, colorDodgeBlendFunction],
	[BlendFunction.DARKEN, darkenBlendFunction],
	[BlendFunction.DIFFERENCE, differenceBlendFunction],
	[BlendFunction.EXCLUSION, exclusionBlendFunction],
	[BlendFunction.LIGHTEN, lightenBlendFunction],
	[BlendFunction.MULTIPLY, multiplyBlendFunction],
	[BlendFunction.NEGATION, negationBlendFunction],
	[BlendFunction.NORMAL, normalBlendFunction],
	[BlendFunction.OVERLAY, overlayBlendFunction],
	[BlendFunction.REFLECT, reflectBlendFunction],
	[BlendFunction.SCREEN, screenBlendFunction],
	[BlendFunction.SOFT_LIGHT, softLightBlendFunction],
	[BlendFunction.SUBTRACT, subtractBlendFunction]
]);

/**
 * A blend mode.
 */

export class BlendMode {

	/**
	 * Constructs a new blend mode.
	 *
	 * @param {BlendFunction} blendFunction - The blend function to use.
	 * @param {Number} opacity - The opacity of the color that will be blended with the base color.
	 */

	constructor(blendFunction, opacity = 1.0) {

		/**
		 * The blend function.
		 *
		 * @type {BlendFunction}
		 */

		this.blendFunction = blendFunction;

		/**
		 * The opacity of the color that will be blended with the base color.
		 *
		 * @type {Uniform}
		 */

		this.opacity = new Uniform(opacity);

	}

	/**
	 * Returns the blend function shader code.
	 *
	 * @return {String} The blend function shader code.
	 */

	getShaderCode() {

		return blendFunctions.get(this.blendFunction);

	}

}
