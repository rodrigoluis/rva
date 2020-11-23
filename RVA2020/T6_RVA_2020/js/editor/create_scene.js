import * as THREE from '../libs/three.module.js';

export default function create_scene(aspect, PLANE_SIZE){
	var scene = new THREE.Scene();
	scene.background = new THREE.Color(0x26292b);

	var mesh_plane = new THREE.Mesh(
		new THREE.PlaneGeometry(PLANE_SIZE, PLANE_SIZE, PLANE_SIZE, PLANE_SIZE),
		new THREE.MeshPhongMaterial({
			color: 0x3d4041, 
			side: THREE.DoubleSide, 
			wireframe: true
		})
	);
	mesh_plane.rotation.x = -Math.PI / 2;
	mesh_plane.receiveShadow = true;
	scene.add( mesh_plane );
	
	// --------------------------------------------- //

	var line = new THREE.Line(
		new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-PLANE_SIZE/2, 0.01, 0), new THREE.Vector3(PLANE_SIZE/2, 0.01, 0)]),
		new THREE.LineBasicMaterial({color: 0xe8385a})
	);
	scene.add(line);

	line = new THREE.Line(
		new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0.01, -PLANE_SIZE/2), new THREE.Vector3(0, 0.01, PLANE_SIZE/2)]),
		new THREE.LineBasicMaterial({color: 0x2b99e8, side: THREE.DoubleSide})
	);
	scene.add(line);
	
	// --------------------------------------------- //

	var camera = new THREE.PerspectiveCamera(75, aspect, 0.01, 5000);
	scene.add(camera);

	camera.position.x = 24;
	camera.position.y = 20;
	camera.position.z = 8;
	camera.lookAt(mesh_plane.position);
	
	// --------------------------------------------- //

	var ambient_light = new THREE.AmbientLight(0xffffff, 0.5);
	scene.add(ambient_light);

	var spot_light = new THREE.DirectionalLight(0xffffff, 0.8);
	spot_light.position.set(50, 50, -50);
	spot_light.castShadow = true;

	spot_light.shadow.camera.near = 0.1;
	spot_light.shadow.camera.far = 200;
	spot_light.shadow.camera.left = -50;
	spot_light.shadow.camera.right = 50;
	spot_light.shadow.camera.bottom = -50;
	spot_light.shadow.camera.top = 50;
	spot_light.shadow.mapSize.width = 4096;
	spot_light.shadow.mapSize.height = 4096;

	scene.add(spot_light);
	// --------------------------------------------- //

	return [scene, camera];
}