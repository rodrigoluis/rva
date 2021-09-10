//=========================================================================================================
//  SHADER ISLAND II
//=========================================================================================================
//  Aleksander Yacovenco
//  Mestrado em Computação Gráfica UFJF
//  Realidade Virtual e Aumentada 2021/2
//  Prof. Rodrigo Luis
//---------------------------------------------------------------------------------------------------------
//  Feito com base no exemplo disponível em:
//  https://github.com/stemkoski/stemkoski.github.com/blob/master/Three.js/Shader-Heightmap-Textures.html
//=========================================================================================================

// MODULES
import * as THREE   from "../build/three.module.js";
import { FlyControls } from '../build/jsm/controls/FlyControls.js';
import { VRButton } from "../build/jsm/webxr/VRButton.js";
import { GUI }      from "../build/jsm/libs/dat.gui.module.js";
import Stats        from "../build/jsm/libs/stats.module.js";

import {initDefaultBasicLight} from "../libs/util/util.js";

// SHADERS (AS MODULES)
import vshader from "./shaders/vertex.glsl.js";
import fshader from "./shaders/fragment.glsl.js";

// GLOBAL VARIABLES
var container, scene, camera, renderer, controls, stats, cameraHolder, ground;
var gui = new GUI();
var clock = new THREE.Clock();
var loader = new THREE.TextureLoader();
var moveCamera = false;
var flyCamera;

// CUSTOM VALUES
const base   = 5000.0;
const height =  650.0;
const speed  =    6.0;
const dist   =   10.0;

// CONTROLLER
const terrainController =
{
	size:       5000.0,
	height:      650.0,
	segments:    500.0,
	brightness:    1.0,
	sunDirX:       0.0,
	sunDirY:       0.0,
	sunDirZ:      -1.0
};

// START
init();
animate();

function init()
{
	// SCENE
	scene = new THREE.Scene();

	// CAMERA
	var SCREEN_WIDTH = window.innerWidth, SCREEN_HEIGHT = window.innerHeight;
	var VIEW_ANGLE = 90, ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT, NEAR = 0.1, FAR = 90000;
	camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);

	initDefaultBasicLight(scene, true, new THREE.Vector3(100, 1000, -5000));

	// RENDER
	renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
	renderer.outputEncoding = THREE.sRGBEncoding;
	renderer.shadowMap.enabled = true;
	renderer.xr.enabled = true;
	container = document.getElementById("container");
	container.appendChild(renderer.domElement);
	container.appendChild(VRButton.createButton(renderer));

    renderer.shadowMapSoft = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

	// To be used outside a VR environment
	flyCamera = new FlyControls( camera, renderer.domElement );
		flyCamera.movementSpeed = 80;
		flyCamera.domElement = renderer.domElement;
		flyCamera.rollSpeed = 0.20;
		flyCamera.autoForward = false;
		flyCamera.dragToLook = true;

	// CAMERA OBJECT
	cameraHolder = new THREE.Object3D();
	cameraHolder.add(camera);
	scene.add(cameraHolder);

	// CONTROLS
	controls = renderer.xr.getController(0);
	controls.addEventListener("selectstart", onSelectStart);
	controls.addEventListener("selectend", onSelectEnd);
	cameraHolder.add(controls);

	// STATS
	stats = new Stats();
	stats.domElement.style.position = "absolute";
	stats.domElement.style.bottom = "0px";
	stats.domElement.style.zIndex = 100;
	container.appendChild(stats.domElement);

	// ADD ISLAND
	const x = terrainController.sunDirX;
	const y = terrainController.sunDirY;
	const z = terrainController.sunDirZ;
	const v = new THREE.Vector3(x, y, z).normalize();
	ground = island(base, height, 600, 600, v, 1, 50);
	scene.add(ground);

	// INTERFACE
	gui.add(terrainController, "height",        0.0, 1000.0,  10.00).onChange(terrainChanged);
	gui.add(terrainController, "size",       1000.0, 9000.0, 100.00).onChange(rebuildTerrain);
	gui.add(terrainController, "segments",      1.0,  816.0,   1.00).onChange(rebuildTerrain);
	gui.add(terrainController, "brightness",    0.0,    5.0,   0.01).onChange(terrainChanged);
	gui.add(terrainController, "sunDirX", -10.0, 10.0, 0.1).onChange(terrainChanged).name("sun direction x");
	gui.add(terrainController, "sunDirY", -10.0, 10.0, 0.1).onChange(terrainChanged).name("sun direction y");
	gui.add(terrainController, "sunDirZ", -10.0, 10.0, 0.1).onChange(terrainChanged).name("sun direction z");

	// BASIC SKYBOX
	var skyBoxGeometry = new THREE.BoxGeometry(base * dist, base * dist, base * dist);
	const skyMat = [
		new THREE.MeshBasicMaterial({ map: loader.load("images/skybox_right.png" ), side: THREE.BackSide }),
		new THREE.MeshBasicMaterial({ map: loader.load("images/skybox_left.png"  ), side: THREE.BackSide }),
		new THREE.MeshBasicMaterial({ map: loader.load("images/skybox_top.png"   ), side: THREE.BackSide }),
		new THREE.MeshBasicMaterial({ map: loader.load("images/skybox_bottom.png"), side: THREE.BackSide }),
		new THREE.MeshBasicMaterial({ map: loader.load("images/skybox_front.png" ), side: THREE.BackSide }),
		new THREE.MeshBasicMaterial({ map: loader.load("images/skybox_back.png"  ), side: THREE.BackSide }),
	];
	var skyBox = new THREE.Mesh(skyBoxGeometry, skyMat);
	skyBox.position.set(0, (base * dist / 2) * -0.025, 0);
	scene.add(skyBox);

	// BASIC WATER
	var waterGeo = new THREE.PlaneGeometry(base * dist, base * dist, 1, 1);
	var waterTex = loader.load("images/water512.jpg");
	waterTex.wrapS = waterTex.wrapT = THREE.RepeatWrapping;
	waterTex.repeat.set(5, 5);
	var waterMat = new THREE.MeshBasicMaterial({ map: waterTex, transparent: true, opacity: 0.40 });
	var water = new THREE.Mesh(waterGeo, waterMat);
	water.rotation.x = -Math.PI / 2;
	water.position.y = -height / 4; // em função da altura da ilha
	scene.add(water);

	// FLOOR PLANE
	var oceanBottom = new THREE.Mesh(new THREE.PlaneGeometry(base * dist, base * dist), new THREE.MeshBasicMaterial({ color: 0x000000 }));
	oceanBottom.position.set(0, -height / 2 + 50, 0);
	oceanBottom.rotation.set(-Math.PI / 2, 0, 0);
	scene.add(oceanBottom);

	// STARTING POSITION
	cameraHolder.position.set(0, height, base / 2); // em função do tamanho da ilha
}

// SHADER UNIFORM VALUES CHANGED
function terrainChanged()
{
	ground.material.uniforms["bumpScale"].value  = terrainController.height;
	ground.material.uniforms["brightness"].value = terrainController.brightness;
	const x = terrainController.sunDirX;
	const y = terrainController.sunDirY;
	const z = terrainController.sunDirZ;
	ground.material.uniforms["lightDirection"].value = new THREE.Vector3(x, y, z).normalize();
}

// GEOMETRY CHANGED
function rebuildTerrain()
{
	ground.geometry.dispose();
	const a = terrainController.size;
	const b = terrainController.segments;
	ground.geometry = new THREE.PlaneGeometry(a, a, b, b);
}

// size, height, hor segments, ver segments, vec3, brightness, tex mult
function island(b, h, u, v, t, d, s)
{
	// TEXTURES
	var tex = [];
	var bumpTexture = loader.load("images/map1_height.png");
	var normalTexture = loader.load("images/map1_normal.png");
	for (var i = 0; i < 5; i++)
	{
		tex.push(loader.load("images/tex" + i.toString() + ".jpg"));
		tex[i].wrapS = tex[i].wrapT = THREE.RepeatWrapping;
	}

	// GLSL UNIFORMS
	var customUniforms =
	{
		bumpTexture:    { type: "t", value: bumpTexture   },
		normalTexture:  { type: "t", value: normalTexture },
		bumpScale:      { type: "f", value: h             },
		mapScale:       { type: "f", value: s             },
		brightness:     { type: "f", value: d             },
		tex1:           { type: "t", value: tex[0]        },
		tex2:           { type: "t", value: tex[1]        },
		tex3:           { type: "t", value: tex[2]        },
		tex4:           { type: "t", value: tex[3]        },
		tex5:           { type: "t", value: tex[4]        },
		lightDirection: {            value: t.normalize() }
	};

	// SHADER MATERIAL
	var customMaterial = new THREE.ShaderMaterial(
	{
	    uniforms: customUniforms,
		vertexShader: vshader,
		fragmentShader: fshader
	});

	// SHADER ISLAND
	var planeGeo = new THREE.PlaneGeometry(b, b, u, v);
	var plane = new THREE.Mesh(planeGeo, customMaterial);
    plane.castShadow = true;	
    plane.receiveShadow = true;		

	plane.rotation.x = -Math.PI / 2;
	plane.position.y = -h / 2; // em função da altura da ilha

	return plane;
}

// BASIC FREE NAVIGATION
function move()
{
	if (moveCamera)
	{
		var quaternion = new THREE.Quaternion();
		quaternion = camera.quaternion;
		var moveTo = new THREE.Vector3(0, 0, -1);
		moveTo.applyQuaternion(quaternion);
		cameraHolder.translateOnAxis(moveTo, speed);
	}
}

function onSelectStart()
{
	moveCamera = true;
}

function onSelectEnd()
{
	moveCamera = false;
}

// DEFAULT ANIMATION AND RENDERING PROCESS
function animate()
{
	renderer.setAnimationLoop(render);
}

function render()
{
    const delta = clock.getDelta();    
    flyCamera.update(delta);	
	move();
	stats.update();
	renderer.render(scene, camera);
}
