var scene, camera, renderer, clock, deltaTime, totalTime, light;

var arToolkitSource, arToolkitContext;

var markerHiro;
var markerKanji;

var lastUpdate = Date.now();

var dbx;

const ACCESS_TOKEN = 'avYzUpeLr90AAAAAAAAAAbN8Gbq0dYfZ9zrM9GT5Wz1QIbbtYz3KgBEoAQ6dIxZo';

initialize();
animate();

function initialize(){
	scene = new THREE.Scene();

	let ambientLight = new THREE.AmbientLight( 0xcccccc, 1.0 );
	scene.add( ambientLight );

	light = new THREE.DirectionalLight(0xffffff, 0.8);
	light.position.set(10, 10, 10);

	scene.add(light);
				
	camera = new THREE.Camera();
	scene.add(camera);

	renderer = new THREE.WebGLRenderer({
		antialias : true,
		alpha: true
	});
	renderer.setClearColor(new THREE.Color('lightgrey'), 0)
	renderer.setSize( 1920, 1080);
	renderer.domElement.style.position = 'absolute'
	renderer.domElement.style.top = '0px'
	renderer.domElement.style.left = '0px'
	document.body.appendChild( renderer.domElement );

	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFSoftShadowMap;

	clock = new THREE.Clock();
	deltaTime = 0;
	totalTime = 0;
	
	////////////////////////////////////////////////////////////
	// setup arToolkitSource
	////////////////////////////////////////////////////////////

	arToolkitSource = new THREEx.ArToolkitSource({
		sourceType : 'webcam',
	});

	function onResize()
	{
		arToolkitSource.onResize()	
		arToolkitSource.copySizeTo(renderer.domElement)	
		if ( arToolkitContext.arController !== null )
		{
			arToolkitSource.copySizeTo(arToolkitContext.arController.canvas)	
		}	
	}

	arToolkitSource.init(function onReady(){
		onResize()
	});
	
	// handle resize event
	window.addEventListener('resize', function(){
		onResize()
	});
	
	////////////////////////////////////////////////////////////
	// setup arToolkitContext
	////////////////////////////////////////////////////////////	

	// create atToolkitContext
	arToolkitContext = new THREEx.ArToolkitContext({
		cameraParametersUrl: 'data/camera_para.dat',
		detectionMode: 'mono'
	});
	
	// copy projection matrix to camera when initialization complete
	arToolkitContext.init( function onCompleted(){
		camera.projectionMatrix.copy( arToolkitContext.getProjectionMatrix() );
	});

	////////////////////////////////////////////////////////////
	// setup markerRoots
	////////////////////////////////////////////////////////////

	// build markerControls
	markerHiro = new THREE.Group();
	scene.add(markerHiro);
	light.target = markerHiro;
	new THREEx.ArMarkerControls(arToolkitContext, markerHiro, {
		type: 'pattern', patternUrl: "data/hiro.patt",
	})
	
	let floorGeometry = new THREE.PlaneGeometry( 20,20 );
	let floorMaterial = new THREE.ShadowMaterial();
	floorMaterial.opacity = 0.3;
	let floorMesh = new THREE.Mesh( floorGeometry, floorMaterial );
	floorMesh.rotation.x = -Math.PI/2;
	floorMesh.receiveShadow = true;
	markerHiro.add( floorMesh );

	markerKanji = new THREE.Group();
	scene.add(markerKanji);
	new THREEx.ArMarkerControls(arToolkitContext, markerKanji, {
		type: 'pattern', patternUrl: "data/kanji.patt",
	})
	dbx = new Dropbox.Dropbox({ accessToken: ACCESS_TOKEN });
	update_scene();
}
function update(){
	// update artoolkit on every frame
	if ( arToolkitSource.ready !== false )
		arToolkitContext.update( arToolkitSource.domElement );
}
function render(){
	if(markerKanji.visible && (Date.now() - lastUpdate > 3000)){
		update_scene();
		lastUpdate = Date.now();
	}
	renderer.render( scene, camera );
}
function animate(){
	requestAnimationFrame(animate);
	deltaTime = clock.getDelta();
	totalTime += deltaTime;
	update();
	render();
}
function clear_scene(){
	for (var i = markerHiro.children.length - 1; i >= 0; i--){
		markerHiro.remove(markerHiro.children[i]);
	}
}
function convert_json_matrix4(json){
	var matrix = new THREE.Matrix4();
	matrix.set(json[0],json[4],json[8],json[12],
			   json[1],json[5],json[9],json[13],
			   json[2],json[6],json[10],json[14],
			   json[3],json[7],json[11],json[15]);
	return matrix;
}
function update_scene(){
	dbx.filesDownload( {path: '/avr.json'} )
	.then(function(response) {
		response.result.fileBlob.arrayBuffer().then(buffer => {
			var data = new Int8Array(buffer);
			var data_str = "";
			for(var i = 0; i < data.length; i++){
				data_str += String.fromCharCode(data[i]);
			}
			clear_scene();
			parse_from_json(data_str);
		});
	})
	.catch(function(error) {
		console.log(err);
	});
}
function parse_from_json(string){
	var sceneJson = JSON.parse(string);
	var partial = new THREE.Group();
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
				partial.add(mesh);
			}
			
		}
	}
	partial.scale.set( 0.1, 0.1, 0.1 );
	markerHiro.add(partial);
}