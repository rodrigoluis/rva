/**
 * TRABALHO ORIGINAL: https://github.com/mrdoob/three.js/blob/master/examples/webgl_shaders_sky.html
*/



import {
	BackSide,
	BoxGeometry,
	Mesh,
	ShaderMaterial,
	UniformsUtils,
	Vector3
} from '../../../../build/three.module.js';


import vertex from "./shaders/vertex_shader.glsl.js";
import fragment from "./shaders/fragment_shader.glsl.js";


/**
 * Based on "A Practical Analytic Model for Daylight"
 * aka The Preetham Model, the de facto standard analytic skydome model
 * https://www.researchgate.net/publication/220720443_A_Practical_Analytic_Model_for_Daylight
 *
 * First implemented by Simon Wallner
 * http://www.simonwallner.at/projects/atmospheric-scattering
 *
 * Improved by Martin Upitis
 * http://blenderartists.org/forum/showthread.php?245954-preethams-sky-impementation-HDR
 *
 * Three.js integration by zz85 http://twitter.com/blurspline
*/

class Sky extends Mesh {

	constructor() {

		const shader = Sky.SkyShader;

		const material = new ShaderMaterial( {
			name: 'SkyShader',
			fragmentShader: shader.fragmentShader,
			vertexShader: shader.vertexShader,
			uniforms: UniformsUtils.clone( shader.uniforms ),
			side: BackSide,
			depthWrite: false
		} );

		super( new BoxGeometry( 1, 1, 1 ), material );

	}

}

Sky.prototype.isSky = true;

Sky.SkyShader = {

	uniforms: {
		'turbidity': { value: 2 },
		'rayleigh': { value: 1 },
		'mieCoefficient': { value: 0.005 },
		'mieDirectionalG': { value: 0.8 },
		'sunPosition': { value: new Vector3() },
		'up': { value: new Vector3( 0, 1, 0 ) }
	},

	vertexShader: vertex,

	fragmentShader: fragment

};

export { Sky };