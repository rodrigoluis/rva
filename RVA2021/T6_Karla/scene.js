//-- Imports -------------------------------------------------------------------------------------
import * as THREE from '../build/three.module.js';
import { VRButton } from '../build/jsm/webxr/VRButton.js';
import {onWindowResize,
		degreesToRadians} from "../libs/util/util.js";

import {GUI} from       '../build/jsm/libs/dat.gui.module.js';
import Stats from '../build/jsm/libs/stats.module.js';
import { Sky } from './assets/objects/Sky/Sky.js';

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
    renderer.toneMappingExposure = 0.7;
	renderer.shadowMap.enabled = true;

//-- Setting scene and camera -------------------------------------------------------------------
let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, .1, 1000 );
let moveCamera; // Move when a button is pressed 

//-- 'Camera Holder' to help moving the camera
const cameraHolder = new THREE.Object3D();
cameraHolder.add(camera);
cameraHolder.position.set(0,6,20);
scene.add( cameraHolder );
//-- Create VR button and settings ---------------------------------------------------------------
document.body.appendChild( VRButton.createButton( renderer ) );

// controllers
var controller1 = renderer.xr.getController( 0 );
	controller1.addEventListener( 'selectstart', onSelectStart );
	controller1.addEventListener( 'selectend', onSelectEnd );
camera.add( controller1 );

let container = document.getElementById( 'container' );
container.appendChild( renderer.domElement );

let sky, sun;

//Amanhecer
const effectController = {
    turbidity: 2,
    rayleigh: 1,
    mieCoefficient: 0.005,
    mieDirectionalG: 0.950,
    elevation: 0,
    azimuth: 180,
    exposure: renderer.toneMappingExposure
};

const stats = Stats();
document.body.appendChild(stats.dom);

let gui = new GUI();
var speed = 0.03;
var animationOn = true;

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
		var moveTo = new THREE.Vector3(0, 0, -0.1);
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
function animate() {
	renderer.setAnimationLoop( render );
}

function render() {
    stats.update();

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
function createScene(){
    // Load all textures 

    var width = 100;
    var length = 100;
    
    var textureLoader = new THREE.TextureLoader();
    var texture = textureLoader.load('../assets/textures/sand.jpg', function(tx) {
        var planeGeometry = new THREE.PlaneGeometry(1000, 1000);
        planeGeometry.translate(0.0, 0.0, 5); // To avoid conflict with the axeshelper
          
        var planeMaterial = new THREE.MeshBasicMaterial({
            map: tx,
            side: THREE.DoubleSide,
            wireframe: false
        });
        
        var plane = new THREE.Mesh(planeGeometry, planeMaterial);
        plane.rotateX(degreesToRadians(-90));
        scene.add( plane );
    });
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set( width, length );
    
	initSky();
}

function guiChanged(){

    const uniforms = sky.material.uniforms;
    uniforms[ 'turbidity' ].value = effectController.turbidity;
    uniforms[ 'rayleigh' ].value = effectController.rayleigh;
    uniforms[ 'mieCoefficient' ].value = effectController.mieCoefficient;
    uniforms[ 'mieDirectionalG' ].value = effectController.mieDirectionalG;

    const phi = THREE.MathUtils.degToRad( 90 - effectController.elevation );
    const theta = THREE.MathUtils.degToRad( effectController.azimuth );

    sun.setFromSphericalCoords( 1, phi, theta );

    uniforms[ 'sunPosition' ].value.copy( sun );

    renderer.toneMappingExposure = effectController.exposure;
    renderer.render( scene, camera );

}

function initSky(){

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

