import * as THREE from '../libs/three.module.js';

export function get_mesh(mesh_name, color, BLOCK_SIZE, height_matrix, size_matrix, PLANE_SIZE){
	var mesh;
	var material = new THREE.MeshPhongMaterial({color: color});

	switch(mesh_name){
		case '3003':
			mesh = new THREE.Mesh(
				new THREE.BoxGeometry(BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE),
				material
			);
			break;
		case '3001':
			mesh = new THREE.Mesh(
				new THREE.BoxGeometry(BLOCK_SIZE*2, BLOCK_SIZE, BLOCK_SIZE),
				material
			);
			break;
		case '3006':
			mesh = new THREE.Mesh(
				new THREE.BoxGeometry(BLOCK_SIZE*5, BLOCK_SIZE, BLOCK_SIZE),
				material
			);
			break;
		case '44042':
			mesh = new THREE.Mesh(
				new THREE.BoxGeometry(BLOCK_SIZE*3, BLOCK_SIZE, BLOCK_SIZE*2),
				material
			);
			break;
		case '43802':
			mesh = new THREE.Mesh(
				new THREE.BoxGeometry(BLOCK_SIZE*4, BLOCK_SIZE, BLOCK_SIZE*4),
				material
			);
			break;
		case '22388_1':
			mesh = new THREE.Mesh(
				new THREE.ConeGeometry(BLOCK_SIZE/3, BLOCK_SIZE/4, 4, 1000),
				material
			);
			mesh.rotation.y += Math.PI/4;
			break;
		case '22388_4':
			mesh = new THREE.Mesh(
				new THREE.ConeGeometry(BLOCK_SIZE/1.42, BLOCK_SIZE/2, 4, 100),
				material
			);
			mesh.rotation.y += Math.PI/4;
			break;
		case '71075':
			mesh = new THREE.Mesh(
				new THREE.CylinderGeometry(BLOCK_SIZE/3, BLOCK_SIZE/3, BLOCK_SIZE*1.5, 100),
				material				
			);
			break;
	}
	mesh.castShadow = true;
	mesh.receiveShadow = true;
	mesh.name = 'block_' + mesh_name;

	var results = update_height(true, mesh, BLOCK_SIZE, height_matrix, size_matrix,  PLANE_SIZE);	// TODO: FIX
	mesh = results[0];
	height_matrix = results[1];

	return [mesh, height_matrix];
}

export function update_height(increase_height, mesh, BLOCK_SIZE, height_matrix, size_matrix, PLANE_SIZE){
	var start_i, finish_i;
	var start_j, finish_j;
	var size, max_height = 0, size_max_height = 0;
	var x = mesh.position.x + PLANE_SIZE/2;
	var z = mesh.position.z + PLANE_SIZE/2;
	switch(mesh.name){
		case 'block_3003':
			start_i = Math.floor(-(BLOCK_SIZE*1) / 2); finish_i = Math.ceil((BLOCK_SIZE*1) / 2);
			start_j = Math.floor(-(BLOCK_SIZE*1) / 2); finish_j = Math.ceil((BLOCK_SIZE*1) / 2);
			size = BLOCK_SIZE;
			break;
		case 'block_3001':
			start_i = Math.floor(-(BLOCK_SIZE*2) / 2); finish_i = Math.ceil((BLOCK_SIZE*2) / 2);
			start_j = Math.floor(-(BLOCK_SIZE*1) / 2); finish_j = Math.ceil((BLOCK_SIZE*1) / 2);
			size = BLOCK_SIZE;
			break;
		case 'block_3006':
			start_i = Math.floor(-(BLOCK_SIZE*5) / 2); finish_i = Math.ceil((BLOCK_SIZE*5) / 2);
			start_j = Math.floor(-(BLOCK_SIZE*1) / 2); finish_j = Math.ceil((BLOCK_SIZE*1) / 2);
			size = BLOCK_SIZE;
			break;
		case 'block_44042':
			start_i = Math.floor(-(BLOCK_SIZE*3) / 2); finish_i = Math.ceil((BLOCK_SIZE*3) / 2);
			start_j = Math.floor(-(BLOCK_SIZE*2) / 2); finish_j = Math.ceil((BLOCK_SIZE*2) / 2);
			size = BLOCK_SIZE;
			break;
		case 'block_43802':
			start_i = Math.floor(-(BLOCK_SIZE*4) / 2); finish_i = Math.ceil((BLOCK_SIZE*4) / 2);
			start_j = Math.floor(-(BLOCK_SIZE*4) / 2); finish_j = Math.ceil((BLOCK_SIZE*4) / 2);
			size = BLOCK_SIZE;
			break;
		case 'block_22388_1':
			start_i = Math.floor(-(BLOCK_SIZE/3) / 2); finish_i = Math.ceil((BLOCK_SIZE/3) / 2);
			start_j = Math.floor(-(BLOCK_SIZE/3) / 2); finish_j = Math.ceil((BLOCK_SIZE/3) / 2);
			size = BLOCK_SIZE/4;
			break;
		case 'block_22388_4':
			start_i = Math.floor(-(BLOCK_SIZE/1.42) / 2); finish_i = Math.ceil((BLOCK_SIZE/1.42) / 2);
			start_j = Math.floor(-(BLOCK_SIZE/1.42) / 2); finish_j = Math.ceil((BLOCK_SIZE/1.42) / 2);
			size = BLOCK_SIZE/2;
			break;
		case 'block_71075':
			start_i = Math.floor(-(BLOCK_SIZE/3) / 2); finish_i = Math.ceil((BLOCK_SIZE/3) / 2);
			start_j = Math.floor(-(BLOCK_SIZE/3) / 2); finish_j = Math.ceil((BLOCK_SIZE/3) / 2);
			size = BLOCK_SIZE*1.5;
			break;
	}

	// --------------------------------------------- //

	for(var i=start_i+x; i<finish_i+x; i++){
		for(var j=start_j+z; j<finish_j+z; j++){
			if(max_height < height_matrix[i][j]){
				max_height = height_matrix[i][j];
				size_max_height = size_matrix[i][j];
			}
		}
	}

	// --------------------------------------------- //

	//console.log('start_i', start_i, 'start_j', start_j, 'finish_i', finish_i, 'finish_j', finish_j);
	//console.log('a', mesh.position.y, 'b', max_height);

	if((max_height == mesh.position.y)){
		console.log("IGUAL");
		/*if(max_height == 0){
			size /= 2;
		}*/
		var new_height = max_height + size/2.0 + size_max_height/2.0 + 0.01;
		if(increase_height){
			for(var i=start_i+x; i<finish_i+x; i++){
				for(var j=start_j+z; j<finish_j+z; j++){
					height_matrix[i][j] = new_height;
					size_matrix[i][j] = size;
				}
			}
		}
		console.log("new_height ", new_height);
		mesh.position.y = new_height;
	}
	else if(max_height < mesh.position.y){
		console.log("MENOR");
		/*if(max_height == 0){
			size /= 2;
		}*/
		var new_height = max_height + size/2.0 + size_max_height/2.0 + 0.01;
		if(increase_height){
			for(var i=start_i+x; i<finish_i+x; i++){
				for(var j=start_j+z; j<finish_j+z; j++){
					height_matrix[i][j] = new_height;
					size_matrix[i][j] = size;
				}
			}
		}
		console.log("new_height ", new_height);
		mesh.position.y = new_height;
	}
	else if(max_height > mesh.position.y){ // max_height > mesh.position.y
		console.log("MAIOR");
		/*if(max_height == 0){
			size /= 2;
		}*/
		var new_height = max_height + size/2.0 + size_max_height/2.0 + 0.01;
		if(increase_height){
			for(var i=start_i+x; i<finish_i+x; i++){
				for(var j=start_j+z; j<finish_j+z; j++){
					height_matrix[i][j] = new_height;
					size_matrix[i][j] = size;
				}
			}
		}
		console.log("new_height ", new_height);
		mesh.position.y = new_height;
	}
	//console.log("increase_height ", increase_height);
	return [mesh, height_matrix];
}

export function update_height_move(mesh, scene, BLOCK_SIZE, height_matrix, size_matrix, PLANE_SIZE){
	for(var i = 0; i < PLANE_SIZE; i++){
		for(var j = 0; j < PLANE_SIZE; j++){
			height_matrix[i][j] = 0;
			size_matrix[i][j] = 0;
		}
	}
	for(var i = 0; i < scene.children.length; i++){
		if(scene.children[i].id != mesh.id && scene.children[i].name.includes('block_')){
			update_height(true, scene.children[i], BLOCK_SIZE, height_matrix, size_matrix, PLANE_SIZE);
		}
	}
}

export function restore_height_matrix(scene, BLOCK_SIZE, height_matrix, size_matrix, PLANE_SIZE){
	for(var i = 0; i < PLANE_SIZE; i++){
		for(var j = 0; j < PLANE_SIZE; j++){
			height_matrix[i][j] = 0;
			size_matrix[i][j] = 0;
		}
	}
	for(var i = 0; i < scene.children.length; i++){
		if(scene.children[i].name.includes('block_')){
			update_height(true, scene.children[i], BLOCK_SIZE, height_matrix, size_matrix, PLANE_SIZE);
		}
	}
}
export function check_mesh(mesh, BLOCK_SIZE, height_matrix, size_matrix, PLANE_SIZE){
	var start_i, finish_i;
	var start_j, finish_j;
	var size, max_height = 0, size_max_height;
	var x = mesh.position.x + PLANE_SIZE/2;
	var z = mesh.position.z + PLANE_SIZE/2;
	switch(mesh.name){
		case 'block_3003':
			start_i = Math.floor(-(BLOCK_SIZE*1) / 2); finish_i = Math.ceil((BLOCK_SIZE*1) / 2);
			start_j = Math.floor(-(BLOCK_SIZE*1) / 2); finish_j = Math.ceil((BLOCK_SIZE*1) / 2);
			size = BLOCK_SIZE;
			break;
		case 'block_3001':
			start_i = Math.floor(-(BLOCK_SIZE*2) / 2); finish_i = Math.ceil((BLOCK_SIZE*2) / 2);
			start_j = Math.floor(-(BLOCK_SIZE*1) / 2); finish_j = Math.ceil((BLOCK_SIZE*1) / 2);
			size = BLOCK_SIZE;
			break;
		case 'block_3006':
			start_i = Math.floor(-(BLOCK_SIZE*5) / 2); finish_i = Math.ceil((BLOCK_SIZE*5) / 2);
			start_j = Math.floor(-(BLOCK_SIZE*1) / 2); finish_j = Math.ceil((BLOCK_SIZE*1) / 2);
			size = BLOCK_SIZE;
			break;
		case 'block_44042':
			start_i = Math.floor(-(BLOCK_SIZE*3) / 2); finish_i = Math.ceil((BLOCK_SIZE*3) / 2);
			start_j = Math.floor(-(BLOCK_SIZE*2) / 2); finish_j = Math.ceil((BLOCK_SIZE*2) / 2);
			size = BLOCK_SIZE;
			break;
		case 'block_43802':
			start_i = Math.floor(-(BLOCK_SIZE*4) / 2); finish_i = Math.ceil((BLOCK_SIZE*4) / 2);
			start_j = Math.floor(-(BLOCK_SIZE*4) / 2); finish_j = Math.ceil((BLOCK_SIZE*4) / 2);
			size = BLOCK_SIZE;
			break;
		case 'block_22388_1':
			start_i = Math.floor(-(BLOCK_SIZE/3) / 2); finish_i = Math.ceil((BLOCK_SIZE/3) / 2);
			start_j = Math.floor(-(BLOCK_SIZE/3) / 2); finish_j = Math.ceil((BLOCK_SIZE/3) / 2);
			size = BLOCK_SIZE/4;
			break;
		case 'block_22388_4':
			start_i = Math.floor(-(BLOCK_SIZE/1.42) / 2); finish_i = Math.ceil((BLOCK_SIZE/1.42) / 2);
			start_j = Math.floor(-(BLOCK_SIZE/1.42) / 2); finish_j = Math.ceil((BLOCK_SIZE/1.42) / 2);
			size = BLOCK_SIZE/2;
			break;
		case 'block_71075':
			start_i = Math.floor(-(BLOCK_SIZE/3) / 2); finish_i = Math.ceil((BLOCK_SIZE/3) / 2);
			start_j = Math.floor(-(BLOCK_SIZE/3) / 2); finish_j = Math.ceil((BLOCK_SIZE/3) / 2);
			size = BLOCK_SIZE*1.5;
			break;
	}

	// --------------------------------------------- //

	for(var i=start_i+x; i<finish_i+x; i++){
		for(var j=start_j+z; j<finish_j+z; j++){
			if(max_height < height_matrix[i][j]){
				max_height = height_matrix[i][j];
				size_max_height = size_matrix[i][j];
			}
		}
	}
	if(mesh.position.y == max_height){
		if(max_height == 0){
			size /= 2;
		}
		var new_height = max_height - size/2.0 - size_max_height/2.0 - 0.01;
		for(var i=start_i+x; i<finish_i+x; i++){
			for(var j=start_j+z; j<finish_j+z; j++){
				height_matrix[i][j] = new_height;
				size_matrix[i][j] = size;
			}
		}
	}
}