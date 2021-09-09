//-- Imports -------------------------------------------------------------------------------------
import * as THREE from '../build/three.module.js';
import {PlaneBufferGeometry, RepeatWrapping} from '../build/three.module.js';
import { VRButton } from '../build/jsm/webxr/VRButton.js';
import {degreesToRadians, onWindowResize, radiansToDegrees} from "../libs/util/util.js";

import Stats from '../build/jsm/libs/stats.module.js';
import {GUI} from       '../build/jsm/libs/dat.gui.module.js';
import { Sky } from './assets/objects/Sky/Sky.js';
import { Water as DefaultWater} from './assets/objects/Water/default_water.js';
import { Waves as CustomWater} from './assets/objects/Water/custom_water.js';
import { Ground } from './assets/objects/Ground/Ground.js';

//-----------------------------------------------------------------------------------------------
//-- MAIN SCRIPT --------------------------------------------------------------------------------
//-----------------------------------------------------------------------------------------------

//--  General globals ---------------------------------------------------------------------------
window.addEventListener( 'resize', onWindowResize );

//-- Renderer settings ---------------------------------------------------------------------------
let renderer = new THREE.WebGLRenderer();
	renderer.setClearColor(new THREE.Color("rgb(70, 150, 240)"));
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.xr.enabled = true;
	renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.5;
	renderer.shadowMap.enabled = true;

//-- Setting scene and camera -------------------------------------------------------------------
let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, .1, 10000 );
let moveCamera; // Move when a button is pressed 

//-- 'Camera Holder' to help moving the camera
const cameraHolder = new THREE.Object3D();
cameraHolder.add(camera);
cameraHolder.position.set(0, 500, 20);
cameraHolder.rotation.set(degreesToRadians(-30), degreesToRadians(0), degreesToRadians(0));
scene.add( cameraHolder );

// create an AudioListener and add it to the camera
const listener = new THREE.AudioListener();
cameraHolder.add( listener );

// create a global audio source
const oceanSound = new THREE.Audio( listener );

// load a sound and set it as the Audio object's buffer
const audioLoader = new THREE.AudioLoader();
audioLoader.load( './assets/objects/Water/sounds/sea.wav', function( buffer ) {
	oceanSound.setBuffer( buffer );
	oceanSound.setLoop( true );
	oceanSound.setVolume( 0.5 );
	oceanSound.play();
});


//-- Create VR button and settings ---------------------------------------------------------------
document.body.appendChild( VRButton.createButton( renderer ) );

// controllers
var controller1 = renderer.xr.getController( 0 );
	controller1.addEventListener( 'selectstart', onSelectStart );
	controller1.addEventListener( 'selectend', onSelectEnd );
camera.add( controller1 );

let container = document.getElementById( 'container' );
container.appendChild( renderer.domElement );

let sky, sun, water, ground;

const effectController = {
    turbidity: 2,
    rayleigh: 1,
    mieCoefficient: 0.1,
    mieDirectionalG: 0.995,
    elevation: 30,//20,
    azimuth: 50,//180,
    exposure: renderer.toneMappingExposure
};

const terrainController =
{
	size:       5000.0,
	height:      650.0,
	segments:    500.0,
	brightness:    1.0,
	sunDirX:       1.0,
	sunDirY:       5.0,
	sunDirZ:      -1.0,
	pos:           0.0,
//	autoSun:     false
};

const stats = Stats();
document.body.appendChild(stats.dom);

let gui = new GUI();
var speed = 0.15;
var animationOn = false;
const pos = -225; // altura inicial da ilha

//-- Creating Scene and calling the main loop ----------------------------------------------------
createScene();
animate();

//------------------------------------------------------------------------------------------------
//-- FUNCTIONS -----------------------------------------------------------------------------------
//------------------------------------------------------------------------------------------------

function move()
{
	if(moveCamera)
	{
		// Get Camera Rotation
		let quaternion = new THREE.Quaternion();
		quaternion = camera.quaternion;

		// Get direction to translate from quaternion
		var moveTo = new THREE.Vector3(0, 0, -1.0);
		moveTo.applyQuaternion(quaternion);

		// Move the camera Holder to the computed direction
		cameraHolder.translateX(moveTo.x);
		cameraHolder.translateY(moveTo.y);
		cameraHolder.translateZ(moveTo.z);	
	}
}

function onSelectStart( ) 
{
	moveCamera = true;
}

function onSelectEnd( ) 
{
	moveCamera = false;
}

function sunrise_to_sunset(){

    //Amanhecer
    if(effectController.elevation < 10 ){
        effectController.rayleigh = 1;
    }

    //Ao longo do dia
    else if(effectController.elevation > 10 && effectController.elevation < 178){
        effectController.mieCoefficient = 0.1;
        effectController.mieDirectionalG = 0.995;
    }
       
    //Por do sol
    else if(effectController.elevation > 178){
        effectController.rayleigh = 4;
        effectController.mieCoefficient = 0.05;
        effectController.mieDirectionalG = 0.950;
    }
    
    if(effectController.elevation < 180){
        effectController.elevation += speed;
    }else{
        effectController.elevation = 0.7;
    }    
        
    const phi = THREE.MathUtils.degToRad( 180 - effectController.elevation );
    const theta = THREE.MathUtils.degToRad( effectController.azimuth );

    sun.setFromSphericalCoords( 1, phi, theta );

    sky.material.uniforms[ 'sunPosition' ].value.copy( sun );

    guiChanged();
}

//-- Main loop -----------------------------------------------------------------------------------
function animate() 
{
	renderer.setAnimationLoop( render );
}

function render() {
    stats.update();
	water.material.uniforms[ 'time' ].value += 1.0 / 60.0;

    if(animationOn){
        sunrise_to_sunset();
   }

    move();
	renderer.render( scene, camera );
}

//------------------------------------------------------------------------------------------------
//-- Scene and auxiliary functions ---------------------------------------------------------------
//------------------------------------------------------------------------------------------------

//-- Create Scene --------------------------------------------------------------------------------
function createScene()
{
    // initDefaultOcean();
    initCustomOcean();
	initGround();
	initSky();
}

function guiChanged() {

    const uniforms = sky.material.uniforms;
    uniforms[ 'turbidity' ].value = effectController.turbidity;
    uniforms[ 'rayleigh' ].value = effectController.rayleigh;
    uniforms[ 'mieCoefficient' ].value = effectController.mieCoefficient;
    uniforms[ 'mieDirectionalG' ].value = effectController.mieDirectionalG;

    const phi = THREE.MathUtils.degToRad( 90 - effectController.elevation );
    const theta = THREE.MathUtils.degToRad( effectController.azimuth );

    sun.setFromSphericalCoords( 1, phi, theta );

    uniforms[ 'sunPosition' ].value.copy( sun );
    water.material.uniforms[ 'sunDirection' ].value.copy( sun ).normalize();

    renderer.toneMappingExposure = effectController.exposure;
    //renderer.render( scene, camera );

	terrainChanged();
}

function terrainChanged()
{
	ground.material.uniforms["bumpScale"].value  = terrainController.height;
	ground.material.uniforms["brightness"].value = terrainController.brightness * effectController.exposure;
	ground.position.y = pos + terrainController.pos;
/*	if (!terrainController.autoSun)
	{
		const x = terrainController.sunDirX;
		const y = terrainController.sunDirY;
		const z = terrainController.sunDirZ;
		ground.material.uniforms["lightDirection"].value = new THREE.Vector3(x, y, z).normalize();
	}
	else*/
	const light = new THREE.Vector3().copy(sun).normalize();
	light.z *= -1;
	ground.material.uniforms["lightDirection"].value = light;
}

function rebuildTerrain()
{
	ground.geometry.dispose();
	const a = terrainController.size;
	const b = terrainController.segments;
	ground.geometry = new THREE.PlaneGeometry(a, a, b, b);
}

function initGround()
{
	const b = terrainController.size;
	const h = terrainController.height;
	const s = terrainController.segments;
	const d = terrainController.brightness;
	const x = terrainController.sunDirX;
	const y = terrainController.sunDirY;
	const z = terrainController.sunDirZ;
	const v = new THREE.Vector3(x, y, z);
	ground = new Ground(b, h, s, s, v, d, 50, pos);
	scene.add(ground);
/*	var controls = new function()
	{
		this.autoSun = false;
		this.onAutoSun = function()
		{
			terrainController.autoSun = this.autoSun;
			terrainChanged();
		};
	};*/
	const folder = gui.addFolder("Terrain");
	folder.add(terrainController, "height",        0.0, 1000.0,  10.00).onChange(terrainChanged);
	folder.add(terrainController, "size",       1000.0, 9000.0, 100.00).onChange(rebuildTerrain);
	folder.add(terrainController, "segments",      1.0,  816.0,   1.00).onChange(rebuildTerrain);
	folder.add(terrainController, "brightness",    0.0,    5.0,   0.01).onChange(terrainChanged);
	folder.add(terrainController, "pos",           0.0,  500.0,  10.00).onChange(terrainChanged).name("position z");
/*	folder.add(controls, "autoSun", false).name("automatic sun direction").onChange(function(e) { controls.onAutoSun() });
	folder.add(terrainController, "sunDirX", -10.0, 10.0, 0.1).onChange(terrainChanged).name("sun direction x");
	folder.add(terrainController, "sunDirY", -10.0, 10.0, 0.1).onChange(terrainChanged).name("sun direction y");
	folder.add(terrainController, "sunDirZ", -10.0, 10.0, 0.1).onChange(terrainChanged).name("sun direction z");*/
}

function initSky() {

    // Add Sky
    sky = new Sky();
    sky.scale.setScalar( 10000 );
    scene.add( sky );

    sun = new THREE.Vector3();

    var controls = new function ()
    {
      this.onChangeAnimation = function(){
        animationOn = !animationOn;
      };
      this.speed = 0.03;
  
      this.changeSpeed = function(){
        speed = this.speed;
      };
    };
    
    const folderSky = gui.addFolder('Sky');
    folderSky.add( effectController, 'turbidity', 0.0, 20.0, 0.1 ).onChange( guiChanged );
    folderSky.add( effectController, 'rayleigh', 0.0, 4, 0.001 ).onChange( guiChanged );
    folderSky.add( effectController, 'mieCoefficient', 0.0, 0.1, 0.001 ).onChange( guiChanged );
    folderSky.add( effectController, 'mieDirectionalG', 0.0, 1, 0.001 ).onChange( guiChanged );
    folderSky.add( effectController, 'elevation', 0, 90, 0.1 ).onChange( guiChanged );
    folderSky.add( effectController, 'azimuth', - 180, 180, 0.1 ).onChange( guiChanged );
    folderSky.add( effectController, 'exposure', 0, 1, 0.0001 ).onChange( guiChanged );
    folderSky.add(controls, 'onChangeAnimation',true).name("Sun Animation On/Off");
    folderSky.add(controls, 'speed', 0.03, 0.5)
        .onChange(function(e) { controls.changeSpeed() })
        .name("Change Speed");

    guiChanged();

}

function initDefaultOcean()
{
    const waterGeometry = new THREE.PlaneGeometry( 50000, 50000 );
    water = new Water(
        waterGeometry,
        {
            textureWidth: 512,
            textureHeight: 512,
            waterNormals: new THREE.TextureLoader().load( '../assets/textures/waternormals.jpg', function ( texture ) {
                texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            } ),
            sunDirection: new THREE.Vector3(),
            sunColor: 0xffffff,
            waterColor: 0x00eeff,
            distortionScale: 3.7,
            fog: scene.fog !== undefined
        }
    );
    water.rotation.x = - Math.PI / 2;
    scene.add( water );

    // const waterUniforms = water.material.uniforms;

    // const folderWater = gui.addFolder( 'Water' );
    // folderWater.add( waterUniforms.distortionScale, 'value', 0, 8, 0.1 ).name( 'distortionScale' );
    // folderWater.add( waterUniforms.size, 'value', 0.1, 10, 0.1 ).name( 'size' );
    // folderWater.open();
}

function initCustomOcean()
{
     // Water
    let waterGeometry = new PlaneBufferGeometry(10000, 10000, 512, 512);

    water = new CustomWater(
        waterGeometry,
        {
        textureWidth: 512,
        textureHeight: 512,
        waterNormals: new THREE.TextureLoader().load('./assets/textures/waternormals.jpg', function(texture) { 
            texture.wrapS = texture.wrapT = RepeatWrapping; 
        }),

        alpha:         1.0,
        sunDirection:  new THREE.Vector3(),
        sunColor:      0xffffff,
        waterColor:    0x00eeff,
        direction:     1.35,
        frequency:     0.02,
        amplitude:     10.0,
        steepness:     0.2,
        speed:         1.25,
        manyWaves:     0,
        side: THREE.DoubleSide
        }
    );
    water.rotation.x = -Math.PI / 2;
    scene.add(water);

    const waterUniforms = water.material.uniforms;

    const folder = gui.addFolder('Water');
    folder.add(waterUniforms.direction,     'value',    0,      2 * Math.PI,    0.01).name('wave angle');
    folder.add(waterUniforms.frequency,     'value',    0.01,   0.1,           0.001).name('frequency');
    folder.add(waterUniforms.amplitude,     'value',    0.0,    40.0,           0.5).name('amplitude');
    folder.add(waterUniforms.steepness,     'value',    0,      1.0,            0.01).name('steepness');
    folder.add(waterUniforms.speed,         'value',    0.0,    5.0,            0.01).name('speed');
    folder.add(waterUniforms.wavesToAdd,    'value',    0,      16,             1).name('add waves');
    //folder.open();
}
