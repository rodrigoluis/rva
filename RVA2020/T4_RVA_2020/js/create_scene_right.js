import * as THREE from './libs/three.module.js';

var SCREEN_WIDTH = 640;
var SCREEN_HEIGHT = 480;
var aspect = SCREEN_WIDTH / SCREEN_HEIGHT;
var earthMesh, venusMesh, mercuryMesh;

export default function create_scene_right(){
	var scene = new THREE.Scene();
	
	// --------------------------------------------- //

	var mesh_cube = new THREE.Mesh(
		new THREE.BoxGeometry(2, 0.5, 2),
		new THREE.MeshLambertMaterial({color: 0x1ABAE1})
	);
	mesh_cube.position.y += 0.2501;
	mesh_cube.receiveShadow = true;
	mesh_cube.castShadow = true;
	scene.add(mesh_cube);
	
	// --------------------------------------------- //

	var mesh_plane = new THREE.Mesh(
		new THREE.PlaneGeometry(20, 20, 1),
		new THREE.MeshPhongMaterial({color: 0xF19F30})
	);
	mesh_plane.material.side = THREE.DoubleSide;
	mesh_plane.rotation.x = -Math.PI / 2;
	mesh_plane.receiveShadow = true;
	scene.add( mesh_plane );
	
	// --------------------------------------------- //

	var camera = new THREE.PerspectiveCamera(50, aspect, 1, 5000);
	scene.add(camera);

	camera.position.x = 24;
	camera.position.y = 20;
	camera.position.z = 8;
	camera.lookAt(mesh_plane.position);
	
	// --------------------------------------------- //

	var ambient_light = new THREE.AmbientLight(0xffffff, 0.2);
	scene.add(ambient_light);

	var directional_light = new THREE.DirectionalLight(0xffffff, 0.8, 18);
	directional_light.position.set(10, 10, -8);
	directional_light.castShadow = true;

	directional_light.shadow.camera.near = 0.1;
	directional_light.shadow.camera.far = 100;
	directional_light.shadow.mapSize.width = 1024;  // default
	directional_light.shadow.mapSize.height = 1024;
	scene.add(directional_light);
	
	// --------------------------------------------- //

	var loader = new THREE.TextureLoader();
	var matEarth, matVenus, matMercury;

	loader.load( 'texture/earth.jpg', function ( texture ) {
		var geometry = new THREE.SphereGeometry( 1, 32, 32 );
		matEarth = new THREE.MeshPhongMaterial( { map: texture} );
		earthMesh = new THREE.Mesh( geometry, matEarth );
		earthMesh.position.y += 1;
		earthMesh.position.x += 9;
		earthMesh.position.z += 9;
		earthMesh.name = 'earth';
		earthMesh.castShadow = true;
		scene.add( earthMesh );
	} );

	loader.load( 'texture/venus.jpg', function ( texture ) {
		var geometry = new THREE.SphereGeometry( 1, 32, 32 );
		matVenus = new THREE.MeshPhongMaterial( { map: texture } );
		venusMesh = new THREE.Mesh( geometry, matVenus );
		venusMesh.position.y += 1;
		venusMesh.position.x += 9;
		venusMesh.position.z += 6.5;
		venusMesh.name = 'venus';
		venusMesh.castShadow = true;
		scene.add( venusMesh );
	} );

	loader.load( 'texture/mercury.jpg', function ( texture ) {
		var geometry = new THREE.SphereGeometry( 1, 32, 32 );
		matMercury = new THREE.MeshPhongMaterial( { map: texture} );
		mercuryMesh = new THREE.Mesh( geometry, matMercury );
		mercuryMesh.position.y += 1;
		mercuryMesh.position.x += 9;
		mercuryMesh.position.z += 4;
		mercuryMesh.name = 'mercury';
		mercuryMesh.castShadow = true;
		scene.add( mercuryMesh );
	} );
	
	// --------------------------------------------- //

	var axesHelper = new THREE.AxesHelper( 5 );
	scene.add( axesHelper );

	return [scene, camera];
}