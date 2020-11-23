var zoom = 1;
var rotate = false;
var dbx;
var dbxInit = false;
const ACCESS_TOKEN = 'avYzUpeLr90AAAAAAAAAAbN8Gbq0dYfZ9zrM9GT5Wz1QIbbtYz3KgBEoAQ6dIxZo';

AFRAME.registerComponent('animation-control', {
	schema: {default: ''},
	init() {
		var rotate_button 	 = document.querySelector('#rotate');
		var zoom_in_button 	 = document.querySelector('#zoom_in');
		var zoom_out_button  = document.querySelector('#zoom_out');
		var load_file_button = document.querySelector('#load_file');

		this.el.addEventListener('click', () => {
			var scene_lego = document.querySelector("#scene_lego");

			if(this.el == load_file_button){
				clear_scene();
				load_scene();
			}
			else if(scene_lego){
				if(this.el == rotate_button){
					rotate = !rotate;
					var rotation = scene_lego.getAttribute("rotation");
					if(rotate){
						var value = `property: rotation;
									 loop: true; 
									 from: `+rotation.x+" "+rotation.y+" "+rotation.z+`;
									 to: `+rotation.x+" "+(rotation.y+360)+" "+rotation.z+`;
									 easing: linear;
									 dur: 20000;`
						scene_lego.setAttribute("animation", value);
					}
					else{
						var value = `property: rotation;
									 loop: true; 
									 from: `+rotation.x+" "+rotation.y+" "+rotation.z+`;
									 to: `+rotation.x+" "+(rotation.y)+" "+rotation.z+`;
									 easing: linear;
									 dur: 20000;`
						scene_lego.setAttribute("animation", value);
					}
				}
				else if(this.el == zoom_in_button || this.el == zoom_out_button){
					if(this.el == zoom_in_button){
						zoom = zoom + 1;
					}
					else{
						zoom = zoom - 1;
					}
					zoom = (zoom+3) % 3;

					scale = 0.5 * (zoom + 1);

					scene_lego.setAttribute("scale", scale+" "+scale+" "+scale);
				}
			}

		});
	}
});

function clear_scene(){
	var scene_lego = document.getElementById("scene_lego");
	if(scene_lego){
		scene_lego.remove();
	}
}


function load_scene(){
	if(!dbxInit){
		dbx = new Dropbox.Dropbox({ accessToken: ACCESS_TOKEN });
		dbxInit = false;
	}
	content = null;
	dbx.filesDownload( {path: '/avr.json'} )
		.then(function(response) {
			response.result.fileBlob.arrayBuffer().then(buffer => {
				//console.log(buffer.byteLength);
				var data   = new Int8Array(buffer);
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
function parse_from_json(content){
	var fileT = new File([content], 'file_name', {type: "application/json"});
	const fr = new FileReader();

	var scene_json, mesh;

	var scene = document.getElementById("scene");

	var scene_lego = document.createElement("a-entity");
	scene_lego.setAttribute("id", "scene_lego");
	scene_lego.setAttribute("scale", "1.0 1.0 1.0");
	scene_lego.setAttribute("animation", `property: rotation;
							  			  loop: true;
							  			  from: 0 0 0;
							  			  to: 0 0 0;
							  			  easing: linear;
							  			  dur: 20000;`);

	fr.addEventListener("load", e => {
		scene_json = JSON.parse(fr.result);
		for(var i = 0; i < scene_json.object.children.length; i++){
			if(scene_json.object.children[i].name){
				if(scene_json.object.children[i].name.includes("block_")){
					var geometry, material;
					for(var j = 0; j < scene_json.geometries.length; j++){
						if(scene_json.geometries[j] && scene_json.geometries[j].uuid == scene_json.object.children[i].geometry){
							geometry = scene_json.geometries[j];
							break;
						}
					}
					for(var j = 0; j < scene_json.materials.length; j++){
						if(scene_json.materials[j] && scene_json.materials[j].uuid == scene_json.object.children[i].material){
							material = scene_json.materials[j];
							break;
						}
					}
					var mesh;
					switch(scene_json.object.children[i].name){
						case "block_3001":
						case "block_3003":
						case "block_3006":
						case "block_43802":
						case "block_44042":
							mesh = document.createElement("a-box");
							mesh.setAttribute("width",	geometry.width);
							mesh.setAttribute("height", geometry.height);
							mesh.setAttribute("depth",	geometry.depth);
						break;
						case "block_22388_1":
						case "block_22388_4":
							mesh = document.createElement("a-cone");
							mesh.setAttribute("radius-bottom", geometry.radius);
							mesh.setAttribute("height", geometry.height);
							mesh.setAttribute("segments-radial", geometry.radialSegments);
							mesh.setAttribute("segments-height", geometry.heightSegments);
						break;
						case "block_71075":
							mesh = document.createElement("a-cone");
							mesh.setAttribute("height", geometry.height);
							mesh.setAttribute("radius-top", geometry.radiusTop);
							mesh.setAttribute("radius-bottom", geometry.radiusBottom);
							mesh.setAttribute("segments-radial", geometry.radialSegments);
						break;
					}

					var color = new THREE.Color();
					color.setHex(material.color)

					mesh.setAttribute("color", "#"+color.getHexString());

					// -------------------------------------------------------------- //

					var matrix = new THREE.Matrix4();
					var aux_matrix = scene_json.object.children[i].matrix;
					matrix.set(aux_matrix[0], aux_matrix[4], aux_matrix[8],	 aux_matrix[12],
							   aux_matrix[1], aux_matrix[5], aux_matrix[9],	 aux_matrix[13],
							   aux_matrix[2], aux_matrix[6], aux_matrix[10], aux_matrix[14],
							   aux_matrix[3], aux_matrix[7], aux_matrix[11], aux_matrix[15]);

					var rotation_rad = new THREE.Euler();
					rotation_rad.setFromRotationMatrix(matrix);

					var rotation_deg = new THREE.Vector3(
						THREE.Math.radToDeg(rotation_rad.x),
						THREE.Math.radToDeg(rotation_rad.y),
						THREE.Math.radToDeg(rotation_rad.z)
					);

					mesh.setAttribute("rotation", rotation_deg);

					// -------------------------------------------------------------- //

					var position = new THREE.Vector3();
					position.setFromMatrixPosition(matrix);

					mesh.setAttribute("position", position);

					// -------------------------------------------------------------- //

					mesh.setAttribute("shadow", "cast: true");
					mesh.setAttribute("shadow", "receive: true");
					scene_lego.appendChild(mesh);
				}
			}
		}
	});
	fr.readAsText(fileT);

	scene.appendChild(scene_lego);
}
function create_menu(){
	var scene = document.getElementById("scene");

	var menu_options = document.createElement("a-entity");
	menu_options.setAttribute("id", "menu_options");
	menu_options.setAttribute("position", "10 5 5");
	menu_options.setAttribute("rotation", "0 -45 0");

	pos_y = 1.5;
	array_id 	= ["load_file", "zoom_out", "zoom_in", "rotate"];
	array_value = ["Load File", "Zoom-Out", "Zoom-In", "Rotate"];

	var button;

	for(var i=0; i<array_id.length; i++){
		button = document.createElement("a-text");
		button.setAttribute("id", array_id[i]);
		button.setAttribute("value", array_value[i]);
		button.setAttribute("class", "clickable");

		button.setAttribute("color", "#555555");
		button.setAttribute("width", "15px");
		button.setAttribute("align", "center");
		button.setAttribute("position", "0 "+pos_y*i+" 0");

		button.setAttribute("animation-control", "");
		//button.setAttribute("geometry", "primitive:plane; width: 3.25;");
		button.setAttribute("geometry", "primitive:plane; width: 3.25;");
		button.setAttribute("material", "side: double; color: #aaaaaa");

		menu_options.appendChild(button);
	}

	scene.appendChild(menu_options);
}