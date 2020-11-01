import * as THREE from './libs/three.module.js';
import Stats from './libs/stats.module.js';
import create_scene_left from './create_scene_left.js';
import create_scene_right from './create_scene_right.js';

var container, stats;
var renderer, mesh_camera;

var raycaster, rayMouse, mouse, theta, phi, radius, mousedown, speed;
var text;
var planetMesh, click;

var box, pivot;

var camera_left, scene_left;
var arToolkitSource, arToolkitContext;
var marker_kanji;

var camera_right, scene_right;
const loader = new THREE.TextureLoader()

init();
animate();

function init() {
	container = document.createElement('div');
	document.body.appendChild(container);

	renderer = new THREE.WebGLRenderer({
		antialias: true,
		alpha: true
	});
	renderer.setClearColor( 0x00fff0, 0);
	renderer.setSize(1280, 720);
	renderer.domElement.style.position = 'absolute'
	renderer.domElement.style.top = '0px'
	renderer.domElement.style.left = '0px'
	renderer.autoClear = false;

	container.appendChild(renderer.domElement);

	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFShadowMap;

	// --------------------------------------------- //

	stats = new Stats();
	container.appendChild( stats.dom );

	// --------------------------------------------- //

	var aux = create_scene_left();
	scene_left 	= aux[0];
	camera_left = aux[1];

	aux = create_scene_right();
	scene_right = aux[0];
	camera_right = aux[1];

	// --------------------------------------------- //

	init_artoolkit();
	init_marker();
	add_mesh_camera();
	add_text_camera();
	init_mouse_control();

	// --------------------------------------------- //
}

function init_artoolkit(){
	arToolkitSource = new THREEx.ArToolkitSource({
		sourceType : 'webcam',
	});

	arToolkitSource.init(function onReady(){
		
	});
	
	// handle resize event
	window.addEventListener('resize', function(){
		onWindowResize()
	});

	// create atToolkitContext
	arToolkitContext = new THREEx.ArToolkitContext({
		cameraParametersUrl: './data/camera_para.dat',
		detectionMode: 'mono'
	});
	
	// copy projection matrix to camera when initialization complete
	arToolkitContext.init( function onCompleted(){
		camera_left.projectionMatrix.copy(arToolkitContext.getProjectionMatrix());
	});
}

function init_marker(){
	marker_kanji = new THREE.Group();
	scene_left.add(marker_kanji);
	let marker_controls = new THREEx.ArMarkerControls(arToolkitContext, marker_kanji, {
		type: 'pattern', patternUrl: "./data/kanji.patt",
	})

	planetMesh = new THREE.Mesh(
		new THREE.SphereGeometry(0.5, 32, 32),	
		new THREE.MeshBasicMaterial({
			map: loader.load('./texture/earth.jpg'),
		})
	);
	planetMesh.position.y += 0.5;	
	marker_kanji.add(planetMesh);
}

function add_mesh_camera(){
	mesh_camera = new THREE.Group();

	var mesh_cube = new THREE.Mesh(
		new THREE.BoxGeometry(1, 1, 1),
		new THREE.MeshLambertMaterial({color: 0x00cba3})
	);
	var mesh_cone = new THREE.Mesh(
		new THREE.ConeGeometry(0.5, 1.5, 20),
		new THREE.MeshLambertMaterial({color: 0x00FF00})
	);

	mesh_cube.receiveShadow = true;
	mesh_cube.castShadow = true;

	mesh_cone.position.y -= 0.5;
	mesh_cone.receiveShadow = true;
	mesh_cone.castShadow = true;

	mesh_camera.add(mesh_cube);
	mesh_camera.add(mesh_cone);

	box = new THREE.Box3().setFromObject(mesh_camera);
	box.getCenter(new THREE.Vector3(0,0,0));
	mesh_camera.position.multiplyScalar(-1);

	pivot = new THREE.Group();
	scene_right.add(pivot);
	pivot.add(mesh_camera);
}

function add_text_camera(){
	text = document.createElement('div');

	text.style.position  = 'absolute';
	text.style.color 	 = 'black';
	text.style.top 		 = '400px';
	text.style.left		 = '820px';
	text.style.fontSize  = "1.4em";
	text.style.textAlign = 'left';

	container.appendChild(text);
}


function animate(){
	requestAnimationFrame(animate);

	if(marker_kanji.visible){
		var position = new THREE.Vector3();
		marker_kanji.getWorldPosition(position);

		var quaternion = new THREE.Quaternion();
		marker_kanji.getWorldQuaternion(quaternion);

		var rotation = new THREE.Euler();
		rotation.setFromQuaternion(quaternion);
		
		mesh_camera.position.x = position.y
		mesh_camera.position.y = -position.z
		mesh_camera.position.z = position.x

		pivot.rotation.x = -rotation.z;
		pivot.rotation.y = -rotation.y;
		pivot.rotation.z = rotation.x - Math.PI/2;

		text.innerHTML = '<div id="text"><p><PRE>camera_position: ('
						  +mesh_camera.position.x.toFixed(2)+', '
						  +mesh_camera.position.y.toFixed(2)+', '
						  +mesh_camera.position.z.toFixed(2)+')</br>'+
						 'camera_rotation: ('+
						  +mesh_camera.rotation.x.toFixed(2)+', '
						  +mesh_camera.rotation.y.toFixed(2)+', '
						  +mesh_camera.rotation.z.toFixed(2)+')</p></div>';
	}
	else{
		mesh_camera.position.x = 0;
		mesh_camera.position.y = 100000;
		mesh_camera.position.z = 0;

		text.innerHTML = '<div id="text"><p><PRE>camera_position: (?, ?, ?)'+
						 				   '</br>camera_rotation: (?, ?, ?)</p></div>';
	}

	if(arToolkitSource.ready !== false)
		arToolkitContext.update( arToolkitSource.domElement );

	render();
	stats.update();
}


function render(){
	if(click){
		raycaster.setFromCamera( rayMouse, camera_right );
		var intersects = raycaster.intersectObjects( scene_right.children );

		for ( var i = 0; i < intersects.length; i++ ) {
			switch(intersects[ i ].object.name){
				case "earth":{
					planetMesh.material = new THREE.MeshBasicMaterial({map: loader.load('./texture/earth.jpg')});
					break;
				}
				case "venus":{
					planetMesh.material = new THREE.MeshBasicMaterial({map: loader.load('./texture/venus.jpg')});
					break;
				}
				case "mercury":{
					planetMesh.material = new THREE.MeshBasicMaterial({map: loader.load('./texture/mercury.jpg')});
					break;
				}
			}
		}
		click = false;
	}

	renderer.clear();
	renderer.setViewport(0, 240, 640, 480);
	renderer.render(scene_left, camera_left);

	renderer.setViewport(640, 240, 640, 480);
	renderer.render(scene_right, camera_right);
}

function init_mouse_control(){
	raycaster = new THREE.Raycaster();
	mouse = new THREE.Vector2();
	rayMouse = new THREE.Vector2();
	mousedown = false;
	theta = Math.PI/4.0;
	phi = Math.PI/3.0;
	radius = 30;
	speed = 0.01;
	click = false;

	document.addEventListener( 'mousedown', onMouseDown, false );
	document.addEventListener( 'mousemove', onMouseMove, false );
	document.addEventListener( 'mousedown', onMouseDown, false );
	document.addEventListener( 'mouseup', onMouseUp, false );
	document.addEventListener( 'mousewheel', onMouseWheel, { passive: false} );

	update_camera();
}

function onMouseDown( event ) {
	mousedown = true;
	click = true;

	mouse.x = event.clientX;
	mouse.y = event.clientY;

	rayMouse.x = ( (event.clientX - 640) / 640 )*2 - 1;
	rayMouse.y = -( (event.clientY - 480) / 480 )*2 - 1;
	console.log(rayMouse);
}

function onMouseUp( event ) {
	mousedown = false;
}

function onMouseWheel(event){
	radius += event.deltaY/50;
	radius = radius < 0.1 ? 0.1 : radius;
	event.preventDefault();
	event.stopPropagation();
	update_camera();
}

function onMouseMove( event ) {
	if(mousedown){
		theta += (event.clientX - mouse.x)*speed;
		phi += (mouse.y - event.clientY)*speed;
		phi = phi > Math.PI/2.0 ? Math.PI/2.0 : phi;
		phi = phi < 0.01 ? 0.01 : phi;

		update_camera();

		mouse.x = event.clientX;
		mouse.y = event.clientY;
	}
}

function update_camera(){
	camera_right.position.x = radius*Math.cos(theta)*Math.sin(phi);
	camera_right.position.z = radius*Math.sin(theta)*Math.sin(phi);
	camera_right.position.y = radius*Math.cos(phi);
	camera_right.lookAt(0, 0, 0);
}