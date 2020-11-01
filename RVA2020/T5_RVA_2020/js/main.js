import * as THREE from './libs/three.module.js';
import create_scene from './create_scene.js';
import {get_mesh, update_height, update_height_move, restore_height_matrix, check_mesh} from './meshes_lego.js';
import {GUI} from './libs/dat.gui.module.js';
import {OrbitControls} from 'https://threejsfundamentals.org/threejs/resources/threejs/r119/examples/jsm/controls/OrbitControls.js';

const BLOCK_SIZE = 2;
const PLANE_SIZE = 100;
const BLOCK_SELECTED_COLOR = 0x555555;

var container, renderer, gui;
var raycaster, mouse;
var camera, scene, controls;

var link;

var gui_material = new THREE.MeshBasicMaterial({color: 0xffffff});
var selected_block;
var moving = false, startPosition = new THREE.Vector3();

var height_matrix = [];
var size_matrix = new Array(PLANE_SIZE);

var block_types = {
	'2x2'   : '3003',
	'2x4'   : '3001',
	'2x10'  : '3006',
	'6x4'   : '44042',
	'8x8'   : '43802',
	'top_1' : '22388_1',
	'top_4' : '22388_4',
	'bar'   : '71075'
};

var options = {
	block_type: 'none',
	color: 0x010101,
	add: function(){
		if(options.block_type != 'none'){
			var aux = get_mesh(options.block_type, options.color, BLOCK_SIZE, height_matrix, size_matrix, PLANE_SIZE);
			var mesh = aux[0];
			height_matrix = aux[1];

			scene.add(mesh);
			//select_block(mesh);
		}
	},
	reset: function(){
		init_scene();
		init_mouse_control();
	},	
	save: function(){
		save_scene();
	},
	open: function(){
		open_scene();
	}
};

init();
animate();

function init() {
	container = document.createElement('div');
	document.body.appendChild(container);

	renderer = new THREE.WebGLRenderer({
		antialias: true
	});
	renderer.setClearColor( 0x00fff0, 0);
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.domElement.style.position = 'absolute'
	renderer.domElement.style.top = '0px'
	renderer.domElement.style.left = '0px'
	renderer.autoClear = false;

	container.appendChild(renderer.domElement);

	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFShadowMap;

	// --------------------------------------------- //

	init_scene();
	init_mouse_control();
	init_gui();

	// --------------------------------------------- //

	link = document.createElement('a');
}

function animate(){
	requestAnimationFrame(animate);
	controls.update();
	render();
}

function render(){
	renderer.render(scene, camera);
}

// --------------------------------------------- //

function init_scene(){
	const aspect = window.innerWidth/window.innerHeight
	var aux = create_scene(aspect, PLANE_SIZE);
	scene = aux[0];
	camera = aux[1];

	for(var i=0; i<PLANE_SIZE; i++) {
		height_matrix[i] = new Array(PLANE_SIZE);
		size_matrix[i] = new Array(PLANE_SIZE);
		for(var j=0; j<PLANE_SIZE; j++) {
			height_matrix[i][j] = 0;
			size_matrix[i][j] = 0;
		}
	}
}

function init_mouse_control(){
	controls = new OrbitControls(camera, renderer.domElement);
	controls.enableKeys = false;
	controls.update();

	raycaster = new THREE.Raycaster();
	mouse = new THREE.Vector2();
}

function init_gui(){
	gui = new GUI();

	var block_section = gui.addFolder('Block');
	block_section.add(options, 'block_type', block_types);
	block_section.addColor(gui_material, 'color').name('color').onChange(get_color);

	var scene_section = gui.addFolder('Controls');
	scene_section.add(options, 'add');
	scene_section.add(options, 'reset');

	var file_section = gui.addFolder('File');
	file_section.add(options, 'open');
	file_section.add(options, 'save');

}

// --------------------------------------------- //

function get_color(){
	var color = new THREE.Color(
		gui_material.color.r/255,
		gui_material.color.g/255,
		gui_material.color.b/255
	);
	options.color = color;
}

// --------------------------------------------- //

function select_block(object) {
	if(selected_block) selected_block.material.emissive.setHex(selected_block.currentHex);

	if(moving){
		selected_block.position.copy(startPosition);
		moving = false;
		restore_height_matrix(scene, BLOCK_SIZE, height_matrix, size_matrix, PLANE_SIZE);
	}

	selected_block = object;
	selected_block.currentHex = selected_block.material.emissive.getHex();
	selected_block.material.emissive.setHex(BLOCK_SELECTED_COLOR);
}

// --------------------------------------------- //

function onMouseDown(event){
	mouse.x =  (event.clientX / window.innerWidth) *2 - 1;
	mouse.y = -(event.clientY / window.innerHeight)*2 + 1;
	raycaster.setFromCamera(mouse, camera);

	var intersects = raycaster.intersectObjects(scene.children);

	if(intersects.length > 0){
		if(intersects[0].object.name.includes('block_')){
			select_block(intersects[0].object);
		}
		else if(selected_block){
			selected_block.material.emissive.setHex(selected_block.currentHex);
			if(moving){
				selected_block.position.copy(startPosition);
				moving = false;
				restore_height_matrix(scene, BLOCK_SIZE, height_matrix, size_matrix, PLANE_SIZE);
			}
			selected_block = 0;
			
		}
	}
	else if(selected_block){
		selected_block.material.emissive.setHex(selected_block.currentHex);
		if(moving){
			selected_block.position.copy(startPosition);
			moving = false;
			restore_height_matrix(scene, BLOCK_SIZE, height_matrix, size_matrix, PLANE_SIZE);
		}
		selected_block = 0;
	}
}

function onKeyDown(event){
	var keyCode = event.which;
	var valid_key = false;

	if(selected_block){
		switch(keyCode){
			case 87:	// W
			case 38:	// Up arrow
				if(!moving){
					startPosition.copy(selected_block.position);
					check_mesh(selected_block, BLOCK_SIZE, height_matrix, size_matrix, PLANE_SIZE);
				}
				selected_block.position.x -= 1;
				valid_key = true;
			break;
			case 65:	// A
			case 37:	// Left arrow
				if(!moving){
					startPosition.copy(selected_block.position);
					check_mesh(selected_block, BLOCK_SIZE, height_matrix, size_matrix, PLANE_SIZE);
				}
				selected_block.position.z += 1;
				valid_key = true;
			break;
			case 83:	// S
			case 40:	// Down arrow
				if(!moving){
					startPosition.copy(selected_block.position);
					check_mesh(selected_block, BLOCK_SIZE, height_matrix, size_matrix, PLANE_SIZE);
				}
				selected_block.position.x += 1;
				valid_key = true;
			break;
			case 68:	// D
			case 39:	// Right arrow
				if(!moving){
					startPosition.copy(selected_block.position);
					check_mesh(selected_block, BLOCK_SIZE, height_matrix, size_matrix, PLANE_SIZE);
				}
				selected_block.position.z -= 1;
				valid_key = true;
			break;
			case 82:	// R
				if(!moving){
					selected_block.rotation.y += Math.PI/2;
					valid_key = true;
				}
			break;
			case 32:	// Spacebar
				moving = false;
				update_height_move(selected_block, scene, BLOCK_SIZE, height_matrix, size_matrix, PLANE_SIZE);
				update_height(true, selected_block, BLOCK_SIZE, height_matrix, size_matrix, PLANE_SIZE);
				selected_block.material.emissive.setHex(selected_block.currentHex);
				selected_block = 0;
			break;
			case 46:
				if(selected_block){
					scene.remove(selected_block);
					selected_block = 0;
					restore_height_matrix(scene,BLOCK_SIZE, height_matrix, size_matrix, PLANE_SIZE);
				}
			break;
			default:
				console.log("KeyCode ", keyCode);
		}
		if(valid_key){
			if(!moving){
				moving = true;
				scene.remove(selected_block);
				scene.add(selected_block);
			}
			var results = update_height(false, selected_block, BLOCK_SIZE, height_matrix, size_matrix, PLANE_SIZE);
			selected_block = results[0];
			height_matrix = results[1];
		}
		render();
	}
}

function save_scene(){
	var result=scene.toJSON();
	var output =JSON.stringify(result);
	var blob = new Blob( [ output ], {type: 'application/json'});
	link.href = URL.createObjectURL(blob);
    link.download = "scene.json";
	link.click();
}

function convert_json_matrix4(json){
	var matrix = new THREE.Matrix4();
	matrix.set(json[0],json[4],json[8],json[12],
			   json[1],json[5],json[9],json[13],
			   json[2],json[6],json[10],json[14],
			   json[3],json[7],json[11],json[15]);
	return matrix;
}

function open_json(file){
	var fileT = file.target.files[0];
	if (!fileT) {
	  return;
	}
	init_scene();
	init_mouse_control();
	const fr = new FileReader();
	var sceneJson;
	fr.addEventListener("load", e => {
		sceneJson = JSON.parse(fr.result);
		for(var i = 0; i < sceneJson.object.children.length; i++){
			if(sceneJson.object.children[i].name){
				if(sceneJson.object.children[i].name.includes("block_")){
					var geometry, material;
					for(var j = 0; j < sceneJson.geometries.length; j++){
						if(sceneJson.geometries[j] && sceneJson.geometries[j].uuid == sceneJson.object.children[i].geometry){
							geometry = sceneJson.geometries[j];
							break;
						}
					}
					for(var j = 0; j < sceneJson.materials.length; j++){
						if(sceneJson.materials[j] && sceneJson.materials[j].uuid == sceneJson.object.children[i].material){
							material = sceneJson.materials[j];
							break;
						}
					}
					var mesh;
					switch(sceneJson.object.children[i].name){
						case "block_3001":
						case "block_3003":
						case "block_3006":
						case "block_43802":
						case "block_44042":
							mesh = new THREE.Mesh(
								new THREE.BoxGeometry(geometry.width, geometry.height, geometry.depth),
								new THREE.MeshPhongMaterial({color: material.color})
							);
							
						break;
						case "block_22388_1":
						case "block_22388_4":
							mesh = new THREE.Mesh(
								new THREE.ConeGeometry(geometry.radius,geometry.height,geometry.radialSegments,geometry.heightSegments),
								new THREE.MeshPhongMaterial({color: material.color})
							);
						break;
						case "block_71075":
							mesh = new THREE.Mesh(
								new THREE.CylinderGeometry(geometry.radiusTop, geometry.radiusBottom,geometry.height,geometry.radialSegments),
								new THREE.MeshPhongMaterial({color: material.color})				
							);
						break;
						default:
							console.log(sceneJson.object.children[i].name);
					}
					mesh.name = sceneJson.object.children[i].name;
					var matrix = convert_json_matrix4(sceneJson.object.children[i].matrix);
					var rotation = new THREE.Euler();
					rotation.setFromRotationMatrix(matrix);
					mesh.position.setFromMatrixPosition(matrix);
					mesh.rotation.x = rotation.x;
					mesh.rotation.y = rotation.y;
					mesh.rotation.z = rotation.z;
					mesh.receiveShadow = true;
					mesh.castShadow = true;
					scene.add(mesh);
					update_height(true, mesh, BLOCK_SIZE, height_matrix, size_matrix, PLANE_SIZE);
				}
				
			}
		}
	});
	fr.readAsText(fileT);
}
function open_scene(){
	var openObj = document.getElementById("openFileDialog");
	openObj.click();
}
// --------------------------------------------- //

window.addEventListener('mousedown', onMouseDown, false);
window.addEventListener('keydown',   onKeyDown,   false);
document.getElementById('openFileDialog').addEventListener('change', open_json, false);