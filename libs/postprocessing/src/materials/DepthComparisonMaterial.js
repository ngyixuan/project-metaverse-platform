import { PerspectiveCamera, ShaderMaterial, Uniform } from "three";

const fragment = "#include <packing>\r\n#include <clipping_planes_pars_fragment>\r\n\r\nuniform sampler2D depthBuffer;\r\nuniform float cameraNear;\r\nuniform float cameraFar;\r\n\r\nvarying float vViewZ;\r\nvarying vec4 vProjTexCoord;\r\n\r\nvoid main() {\r\n\r\n\t#include <clipping_planes_fragment>\r\n\r\n\t// Transform into Cartesian coordinate (not mirrored).\r\n\tvec2 projTexCoord = (vProjTexCoord.xy / vProjTexCoord.w) * 0.5 + 0.5;\r\n\tprojTexCoord = clamp(projTexCoord, 0.002, 0.998);\r\n\r\n\tfloat fragCoordZ = unpackRGBAToDepth(texture2D(depthBuffer, projTexCoord));\r\n\r\n\t#ifdef PERSPECTIVE_CAMERA\r\n\r\n\t\tfloat viewZ = perspectiveDepthToViewZ(fragCoordZ, cameraNear, cameraFar);\r\n\r\n\t#else\r\n\r\n\t\tfloat viewZ = orthographicDepthToViewZ(fragCoordZ, cameraNear, cameraFar);\r\n\r\n\t#endif\r\n\r\n\tfloat depthTest = (-vViewZ > -viewZ) ? 1.0 : 0.0;\r\n\r\n\tgl_FragColor.rg = vec2(0.0, depthTest);\r\n\r\n}\r\n";
const vertex = "#include <common>\r\n#include <morphtarget_pars_vertex>\r\n#include <skinning_pars_vertex>\r\n#include <clipping_planes_pars_vertex>\r\n\r\nvarying float vViewZ;\r\nvarying vec4 vProjTexCoord;\r\n\r\nvoid main() {\r\n\r\n\t#include <skinbase_vertex>\r\n\r\n\t#include <begin_vertex>\r\n\t#include <morphtarget_vertex>\r\n\t#include <skinning_vertex>\r\n\t#include <project_vertex>\r\n\r\n\tvViewZ = mvPosition.z;\r\n\tvProjTexCoord = gl_Position;\r\n\r\n\t#include <clipping_planes_vertex>\r\n\r\n}\r\n";

/**
 * A depth comparison shader material.
 */

export class DepthComparisonMaterial extends ShaderMaterial {

	/**
	 * Constructs a new depth comparison material.
	 *
	 * @param {Texture} [depthTexture=null] - A depth texture.
	 * @param {PerspectiveCamera} [camera] - A camera.
	 */

	constructor(depthTexture = null, camera) {

		super({

			type: "DepthComparisonMaterial",

			uniforms: {

				depthBuffer: new Uniform(depthTexture),
				cameraNear: new Uniform(0.3),
				cameraFar: new Uniform(1000)

			},

			fragmentShader: fragment,
			vertexShader: vertex,

			depthWrite: false,
			depthTest: false,

			morphTargets: true,
			skinning: true

		});

		this.adoptCameraSettings(camera);

	}

	/**
	 * Adopts the settings of the given camera.
	 *
	 * @param {Camera} [camera=null] - A camera.
	 */

	adoptCameraSettings(camera = null) {

		if(camera !== null) {

			this.uniforms.cameraNear.value = camera.near;
			this.uniforms.cameraFar.value = camera.far;

			if(camera instanceof PerspectiveCamera) {

				this.defines.PERSPECTIVE_CAMERA = "1";

			} else {

				delete this.defines.PERSPECTIVE_CAMERA;

			}

		}

	}

}
