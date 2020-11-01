import * as THREE from './libs/three.module.js';

var SCREEN_WIDTH = 640;
var SCREEN_HEIGHT = 480;
var aspect = SCREEN_WIDTH / SCREEN_HEIGHT;

export default function create_scene_left(){
	var scene = new THREE.Scene();

	var ambientLight = new THREE.AmbientLight( 0xcccccc, 1.0 );
	scene.add( ambientLight );

	var camera = new THREE.Camera(50, aspect, 1, 10000);
	scene.add(camera);

	return [scene, camera];
}