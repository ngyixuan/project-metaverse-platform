import {
	Color,
	LinearFilter,
	NearestFilter,
	RGBAFormat,
	RGBFormat,
	Texture,
	Uniform,
	WebGLRenderTarget
} from "three";

import { ColorEdgesMaterial, SMAAWeightsMaterial } from "../materials";
import { ClearPass, ShaderPass } from "../passes";
import { BlendFunction } from "./blending/BlendFunction.js";
import { Effect, EffectAttribute } from "./Effect.js";

import searchImageDataURL from "../images/smaa/searchImageDataURL.js";
import areaImageDataURL from "../images/smaa/areaImageDataURL.js";

const fragment = "uniform sampler2D weightMap;\r\n\r\nvarying vec2 vOffset0;\r\nvarying vec2 vOffset1;\r\n\r\nvoid mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {\r\n\r\n\t// Fetch the blending weights for the current pixel.\r\n\tvec4 a;\r\n\ta.rb = texture2D(weightMap, uv).rb;\r\n\ta.g = texture2D(weightMap, vOffset1).g;\r\n\ta.a = texture2D(weightMap, vOffset0).a;\r\n\r\n\tvec4 color = inputColor;\r\n\r\n\t// Ignore tiny blending weights.\r\n\tif(dot(a, vec4(1.0)) >= 1e-5) {\r\n\r\n\t\t/* Up to four lines can be crossing a pixel (one through each edge).\r\n\t\t * The line with the maximum weight for each direction is favoured.\r\n\t\t */\r\n\r\n\t\tvec2 offset = vec2(\r\n\t\t\ta.a > a.b ? a.a : -a.b,\t// Left vs. right.\r\n\t\t\ta.g > a.r ? -a.g : a.r\t// Top vs. bottom (changed signs).\r\n\t\t);\r\n\r\n\t\t// Go in the direction with the maximum weight (horizontal vs. vertical).\r\n\t\tif(abs(offset.x) > abs(offset.y)) {\r\n\r\n\t\t\toffset.y = 0.0;\r\n\r\n\t\t} else {\r\n\r\n\t\t\toffset.x = 0.0;\r\n\r\n\t\t}\r\n\r\n\t\t// Fetch the opposite color and lerp by hand.\r\n\t\tvec4 oppositeColor = texture2D(inputBuffer, uv + sign(offset) * texelSize);\r\n\t\tfloat s = abs(offset.x) > abs(offset.y) ? abs(offset.x) : abs(offset.y);\r\n\r\n\t\t// Gamma correction.\r\n\t\tcolor.rgb = pow(abs(color.rgb), vec3(2.2));\r\n\t\toppositeColor.rgb = pow(abs(oppositeColor.rgb), vec3(2.2));\r\n\t\tcolor = mix(color, oppositeColor, s);\r\n\t\tcolor.rgb = pow(abs(color.rgb), vec3(1.0 / 2.2));\r\n\r\n\t}\r\n\r\n\toutputColor = color;\r\n\r\n}\r\n";
const vertex = "varying vec2 vOffset0;\r\nvarying vec2 vOffset1;\r\n\r\nvoid mainSupport() {\r\n\r\n\tvOffset0 = uv + texelSize * vec2(1.0, 0.0);\r\n\tvOffset1 = uv + texelSize * vec2(0.0, -1.0); // Changed sign in Y component.\r\n\r\n}\r\n";

/**
 * Subpixel Morphological Antialiasing (SMAA) v2.8.
 *
 * Preset: SMAA 1x Medium (with color edge detection).
 *  https://github.com/iryoku/smaa/releases/tag/v2.8
 */

export class SMAAEffect extends Effect {

	/**
	 * Constructs a new SMAA effect.
	 *
	 * @param {Image} searchImage - The SMAA search image. Preload this image using the {@link searchImageDataURL}.
	 * @param {Image} areaImage - The SMAA area image. Preload this image using the {@link areaImageDataURL}.
	 */

	constructor(searchImage, areaImage) {

		super("SMAAEffect", fragment, {

			attributes: EffectAttribute.CONVOLUTION,
			blendFunction: BlendFunction.NORMAL,

			uniforms: new Map([
				["weightMap", new Uniform(null)]
			]),

			vertexShader: vertex

		});

		/**
		 * A render target for the color edge detection.
		 *
		 * @type {WebGLRenderTarget}
		 * @private
		 */

		this.renderTargetColorEdges = new WebGLRenderTarget(1, 1, {
			minFilter: LinearFilter,
			format: RGBFormat,
			stencilBuffer: false,
			depthBuffer: false
		});

		this.renderTargetColorEdges.texture.name = "SMAA.ColorEdges";
		this.renderTargetColorEdges.texture.generateMipmaps = false;

		/**
		 * A render target for the SMAA weights.
		 *
		 * @type {WebGLRenderTarget}
		 * @private
		 */

		this.renderTargetWeights = this.renderTargetColorEdges.clone();

		this.renderTargetWeights.texture.name = "SMAA.Weights";
		this.renderTargetWeights.texture.format = RGBAFormat;

		this.uniforms.get("weightMap").value = this.renderTargetWeights.texture;

		/**
		 * A clear pass for the color edges buffer.
		 *
		 * @type {ClearPass}
		 * @private
		 */

		this.clearPass = new ClearPass({
			clearColor: new Color(0x000000),
			clearAlpha: 1.0
		});

		/**
		 * A color edge detection pass.
		 *
		 * @type {ShaderPass}
		 * @private
		 */

		this.colorEdgesPass = new ShaderPass(new ColorEdgesMaterial());

		/**
		 * An SMAA weights pass.
		 *
		 * @type {ShaderPass}
		 * @private
		 */

		this.weightsPass = new ShaderPass(new SMAAWeightsMaterial());

		this.weightsPass.getFullscreenMaterial().uniforms.searchTexture.value = (() => {

			const searchTexture = new Texture(searchImage);
			searchTexture.name = "SMAA.Search";
			searchTexture.magFilter = NearestFilter;
			searchTexture.minFilter = NearestFilter;
			searchTexture.format = RGBAFormat;
			searchTexture.generateMipmaps = false;
			searchTexture.needsUpdate = true;
			searchTexture.flipY = false;

			return searchTexture;

		})();

		this.weightsPass.getFullscreenMaterial().uniforms.areaTexture.value = (() => {

			const areaTexture = new Texture(areaImage);

			areaTexture.name = "SMAA.Area";
			areaTexture.minFilter = LinearFilter;
			areaTexture.format = RGBAFormat;
			areaTexture.generateMipmaps = false;
			areaTexture.needsUpdate = true;
			areaTexture.flipY = false;

			return areaTexture;

		})();

	}

	/**
	 * Sets the edge detection sensitivity.
	 *
	 * See {@link ColorEdgesMaterial#setEdgeDetectionThreshold} for more details.
	 *
	 * @param {Number} threshold - The edge detection sensitivity. Range: [0.05, 0.5].
	 */

	setEdgeDetectionThreshold(threshold) {

		this.colorEdgesPass.getFullscreenMaterial().setEdgeDetectionThreshold(threshold);

	}

	/**
	 * Sets the maximum amount of horizontal/vertical search steps.
	 *
	 * See {@link SMAAWeightsMaterial#setOrthogonalSearchSteps} for more details.
	 *
	 * @param {Number} steps - The search steps. Range: [0, 112].
	 */

	setOrthogonalSearchSteps(steps) {

		this.weightsPass.getFullscreenMaterial().setOrthogonalSearchSteps(steps);

	}

	/**
	 * Updates this effect.
	 *
	 * @param {WebGLRenderer} renderer - The renderer.
	 * @param {WebGLRenderTarget} inputBuffer - A frame buffer that contains the result of the previous pass.
	 * @param {Number} [delta] - The time between the last frame and the current one in seconds.
	 */

	update(renderer, inputBuffer, delta) {

		this.clearPass.render(renderer, this.renderTargetColorEdges);
		this.colorEdgesPass.render(renderer, inputBuffer, this.renderTargetColorEdges);
		this.weightsPass.render(renderer, this.renderTargetColorEdges, this.renderTargetWeights);

	}

	/**
	 * Updates the size of internal render targets.
	 *
	 * @param {Number} width - The width.
	 * @param {Number} height - The height.
	 */

	setSize(width, height) {

		this.renderTargetColorEdges.setSize(width, height);
		this.renderTargetWeights.setSize(width, height);

		this.colorEdgesPass.getFullscreenMaterial().uniforms.texelSize.value.copy(
			this.weightsPass.getFullscreenMaterial().uniforms.texelSize.value.set(
				1.0 / width, 1.0 / height));

	}

	/**
	 * The SMAA search image, encoded as a base64 data URL.
	 *
	 * Use this image data to create an Image instance and use it together with
	 * the area image to create an {@link SMAAEffect}.
	 *
	 * @type {String}
	 * @example
	 * const searchImage = new Image();
	 * searchImage.addEventListener("load", progress);
	 * searchImage.src = SMAAEffect.searchImageDataURL;
	 */

	static get searchImageDataURL() {

		return searchImageDataURL;

	}

	/**
	 * The SMAA area image, encoded as a base64 data URL.
	 *
	 * Use this image data to create an Image instance and use it together with
	 * the search image to create an {@link SMAAEffect}.
	 *
	 * @type {String}
	 * @example
	 * const areaImage = new Image();
	 * areaImage.addEventListener("load", progress);
	 * areaImage.src = SMAAEffect.areaImageDataURL;
	 */

	static get areaImageDataURL() {

		return areaImageDataURL;

	}

}
