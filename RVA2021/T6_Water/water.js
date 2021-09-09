//-- Imports -------------------------------------------------------------------------------------
import * as THREE from '../build/three.module.js';
import { FlyControls } from '../build/jsm/controls/FlyControls.js';
import {PlaneBufferGeometry,
    RepeatWrapping} from '../build/three.module.js';
import { VRButton } from '../build/jsm/webxr/VRButton.js';
import {onWindowResize,
		degreesToRadians,
        getMaxSize} from "../libs/util/util.js";
import Stats from '../build/jsm/libs/stats.module.js';
import { GUI } from '../build/jsm/libs/dat.gui.module.js';
import { Sky } from '../build/jsm/objects/Sky.js';
import {GLTFLoader} from '../build/jsm/loaders/GLTFLoader.js'
import {DRACOLoader} from '../build/jsm/loaders/DRACOLoader.js'
import { Water as DefaultWater} from './water/default_water.js';
import { Waves as CustomWater } from './water/custom_water.js';




//-----------------------------------------------------------------------------------------------
//-- MAIN SCRIPT --------------------------------------------------------------------------------
//-----------------------------------------------------------------------------------------------
//--  General globals ---------------------------------------------------------------------------
window.addEventListener( 'resize', onWindowResize );

//-- Renderer settings ---------------------------------------------------------------------------
let renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.setClearColor(new THREE.Color("rgb(70, 150, 240)"));
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.xr.enabled = true;
	renderer.outputEncoding = THREE.sRGBEncoding;
	renderer.shadowMap.enabled = true;

//-- Setting scene and camera -------------------------------------------------------------------
let scene = new THREE.Scene();
const clock = new THREE.Clock();
let camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, .1, 5000);
let moveCamera; // Move when a button is pressed 

// To be used outside a VR environment
var flyCamera = new FlyControls( camera, renderer.domElement );
  flyCamera.movementSpeed = 50;
  flyCamera.domElement = renderer.domElement;
  flyCamera.rollSpeed = 0.20;
  flyCamera.autoForward = false;
  flyCamera.dragToLook = false;

//-- 'Camera Holder' to help moving the camera
const cameraHolder = new THREE.Object3D();
cameraHolder.position.set( 0, 200, 0 );
cameraHolder.rotation.set( 0, degreesToRadians(5), 0 );
cameraHolder.add(camera);

scene.add( cameraHolder );

// create an AudioListener and add it to the camera
const listener = new THREE.AudioListener();
cameraHolder.add( listener );

// create a global audio source
const oceanSound = new THREE.Audio( listener );

// load a sound and set it as the Audio object's buffer
const audioLoader = new THREE.AudioLoader();
audioLoader.load( './water/sounds/sea.wav', function( buffer ) {
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

let sky, sun, water, cube;

const stats = Stats();
document.body.appendChild(stats.dom);

let gui = new GUI();

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
		var moveTo = new THREE.Vector3(0, 0, -1);
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

//-- Main loop -----------------------------------------------------------------------------------
function animate() 
{
	renderer.setAnimationLoop( render );
}

function render() 
{
    const delta = clock.getDelta();    
    flyCamera.update(delta);
    stats.update();

	water.material.uniforms[ 'time' ].value += 1.0 / 60.0;
    move();
	renderer.render( scene, camera );
}

//------------------------------------------------------------------------------------------------
//-- Scene and auxiliary functions ---------------------------------------------------------------
//------------------------------------------------------------------------------------------------

//-- Create Scene --------------------------------------------------------------------------------
function createScene()
{
    initCustomOcean();
	initSky();
    initShip();
}

function initShip()
{
    var modelPath = "./assets/gltf/"
    var modelName = "low_poly_titanic/scene.gltf";
    var initialScale = 1500;
    var initialPosition = new THREE.Vector3(0, 0, -750);
    var initialRotation = new THREE.Vector3(0, 0, 0);
    importGLTF(modelPath, modelName, initialPosition, initialRotation, initialScale);
}



function initSky() 
{
    sun = new THREE.Vector3();
    const sky = new Sky();
    sky.scale.setScalar( 10000 );
    scene.add( sky );

    const skyUniforms = sky.material.uniforms;

    skyUniforms[ 'turbidity' ].value = 0.1;
    skyUniforms[ 'rayleigh' ].value = 0.1;
    skyUniforms[ 'mieCoefficient' ].value = 0.005;
    skyUniforms[ 'mieDirectionalG' ].value = 0.7;

    const parameters = {
        elevation: 25,
        azimuth: 180
    };

    const pmremGenerator = new THREE.PMREMGenerator( renderer );
    
    function updateSun() {
        const phi = THREE.MathUtils.degToRad( 90 - parameters.elevation );
        const theta = THREE.MathUtils.degToRad( parameters.azimuth );

        sun.setFromSphericalCoords( 1, phi, theta );

        sky.material.uniforms[ 'sunPosition' ].value.copy( sun );
        water.material.uniforms.sunDirection.value.copy( sun ).normalize();

        scene.environment = pmremGenerator.fromScene( sky ).texture;
    }

    updateSun();

    // UI
    const folderSky = gui.addFolder( 'Sky' );
    folderSky.add( parameters, 'elevation', 0, 90, 0.1 ).onChange( updateSun );
    folderSky.add( parameters, 'azimuth', -180, 180, 0.1 ).onChange( updateSun );
    folderSky.open();
}


function initDefaultOcean()
{
    const waterGeometry = new THREE.PlaneGeometry( 10000, 10000 );
    water = new DefaultWater(
        waterGeometry,
        {
            textureWidth: 512,
            textureHeight: 512,
            waterNormals: new THREE.TextureLoader().load( './assets/textures/waternormals.jpg', function ( texture ) {
                texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            } ),
            sunDirection: new THREE.Vector3(),
            sunColor: 0xffffff,
            waterColor: 0x001e0f,
            distortionScale: 3.7,
            fog: scene.fog !== undefined
        }
    );
    water.rotation.x = - Math.PI / 2;
    scene.add( water );

    const waterUniforms = water.material.uniforms;
    const folderWater = gui.addFolder( 'Water' );
    folderWater.add( waterUniforms.distortionScale, 'value', 0, 8, 0.1 ).name( 'distortionScale' );
    folderWater.add( waterUniforms.size, 'value', 0.1, 10, 0.1 ).name( 'size' );
    
    folderWater.open();
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
    folder.open();
}

function importGLTF(modelPath, modelName, initialPosition, initialRotation, initialScale)
{
    var loader = new GLTFLoader( );
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath( '/examples/js/libs/draco/' );
    loader.setDRACOLoader( dracoLoader )

    loader.load( modelPath + modelName, function ( gltf ) {
        var obj = gltf.scene;

        obj.traverse( function ( child ) {
            if ( child ) { 
                child.castShadow = true; 
                child.receiveShadow = true;
            }
        });

        obj = normalizeAndRescale(obj, initialScale);
        obj.translateX(initialPosition.x);
        obj.translateY(initialPosition.y);
        obj.translateZ(initialPosition.z);
        obj.rotateX(degreesToRadians(initialRotation.x));
        obj.rotateY(degreesToRadians(initialRotation.y));
        obj.rotateZ(degreesToRadians(initialRotation.z));
        scene.add(obj);
        return obj;
    }, function ( xhr ) {

		console.log( "GLTF "+( xhr.loaded / xhr.total * 100 ) + '% loaded' );

	}, function ( error ) {

		console.log( 'An error happened' );

	});
}

function normalizeAndRescale(obj, newScale)
{
  var scale = getMaxSize(obj); // Available in 'utils.js'
  obj.scale.set(newScale * (1.0/scale),
                newScale * (1.0/scale),
                newScale * (1.0/scale));
  return obj;
}