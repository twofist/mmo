  let canvas = document.getElementById("canvas");

  let engine = new BABYLON.Engine(canvas, true);
  
  const username = window.location.search.split("=")[1] || prompt("Please enter your name", "");
  if (window.location.search.split("=")[1] !== username) {
    window.location.replace("?user=" + username);
  }
  
  
  let createScene = function () {

    let scene = new BABYLON.Scene(engine);
	
	initscene(scene);
	
	let camera = new BABYLON.FollowCamera("camera1", new BABYLON.Vector3(0, 5, -10), scene);
	
    // This creates a light, aiming 0,1,0 - to the sky.
    let light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);
	initlight(light);
	
    //Params: name, subdivisions, size, scene
    let sphere = BABYLON.Mesh.CreateSphere("sphere1", 16, 2, scene);
	initsphere(sphere);
	
    //Params: name, width, depth, subdivisions, scene
    let ground = BABYLON.Mesh.CreateGround("ground1", 100, 100, 2, scene);
	initground(ground);
	

	let players = [];
	let enemies = [];
	let otherplayers = [];
	
	//let battlecontainer = [];	

	const socket = new WebSocket('ws://127.0.0.1:8080');
	//const socket = new WebSocket('wss://twofist-chat-server.herokuapp.com');
	
    const USERNAME = 0;
    const CONNECTED = 1;
    const DISCONNECTED = 2;
    const ONLINE_USERS = 3;
	const ONLINE_ENEMIES = 4;
    const UPDATE_ENEMY_DATA = 5;
	const UPDATE_PLAYER_DATA = 6;
	
	//send server the username on connect
	socket.addEventListener('open', function(event) {
        socket.send('"servertype":' + USERNAME + " " + username);
    });
    socket.addEventListener('close', function(event) {
        console.log("disconnected...");
    });
    socket.addEventListener('error', function(event) {
        console.log("an error has occured!");
    });
	
	//listen for enemy/player changes
	socket.addEventListener('message', function(event) {
        const data = event.data;
		const servertype = data.split('"servertype":')[1];
        const type = parseInt(servertype);
		let obj;
		if(type === ONLINE_USERS || type === ONLINE_ENEMIES){
			obj = data;
		}else{
			obj = JSON.parse(data);
		}
        switch (type) {
            case CONNECTED:
                if (username === obj.username) return;
                console.log("User connected:", obj.username);
                addplayer(obj, players, otherplayers);
                break;
            case DISCONNECTED:
                console.log("User disconnected:", obj.username);
                removeplayer(obj);
                break;
            case ONLINE_USERS:
				let users = obj.split("!!!");
                users.map((obj) => {
					obj = JSON.parse(obj);
                    addplayer(obj, players, otherplayers);
                });
                break;
			case ONLINE_ENEMIES:
				let opponents = obj.split("!!!");
				opponents.map((obj) => {
					obj = JSON.parse(obj);
					addenemy(obj, enemies);
				});
				break;
			case UPDATE_ENEMY_DATA:
				break;
			case UPDATE_PLAYER_DATA:
				break;
            default:
                console.log("Unknown message:", data);
                break;
        };
		initcamera(camera, players[0], scene);
    });
	
	
	
	scene.registerBeforeRender(function() {
	if(players[0]){
			//console.log(enemies)
		let player = players[0];
		const NORMAL = 0;
		const INBATTLE = 1;
		const AFK = 3;
		const TRADING = 4;
		const DEAD = 5;
		
		player.moveWithCollisions(new BABYLON.Vector3(0, player.gravity, 0)); //gravity
		
		for(let ii = 0; ii < enemies.length; ii++){
			const enemy = enemies[ii];
			
			enemy.rotate();
			if(enemy.state === NORMAL)
				enemy.walk();
			
			enemy.moveWithCollisions(new BABYLON.Vector3(0, enemy.gravity, 0));
			
			if(enemy.position.y < 0)
				console.log("fell")
		
		}
		
		/*
		if(checkforbattle(player, enemies)){
			let enemy = checkforbattle(player, enemies);

			if(player.state === NORMAL){
				let id = 0;
				for(let ii = 0; ii < battlecontainer.length; ii++){
					if(battlecontainer[ii].id > id)
						id = battlecontainer[ii].id+1;
				}
				let container = {id: id, p: [], e: []};
				container.p.push(player);
				container.e.push(enemy);
				battlecontainer.push(container)
				startbattle(container);
			}else if(player.state === INBATTLE){
				joinbattle(battlecontainer, enemy, player);
			}
		}
		*/
		if(player.state === NORMAL){
			player.hideui();
			player.walk();
		}
		if(player.state === INBATTLE){
			player.showui();
			player.rotate();
		}
	}	
	});
	
    return scene;

  };

  
  //initialize the scene
  let initscene = (scene) =>{
    scene.clearColor = new BABYLON.Color3(0, 1, 0);
    scene.collisionsEnabled = true;
  }
  
  //initialize the camera
  let initcamera = (camera, player, scene) =>{
    camera.attachControl(canvas, false);
    camera.checkCollisions = true;
    camera.ellipsoid = new BABYLON.Vector3(1, 1, 1); //Set the ellipsoid around the camera (e.g. your player's size)
	camera.radius = 10; // how far from the object to follow
	camera.heightOffset = 6; // how high above the object to place the camera
	camera.rotationOffset = 180; // the viewing angle
	camera.cameraAcceleration = 0.05 // how fast to move
	camera.maxCameraSpeed = 20 // speed limit
	camera.lockedTarget = player;
	scene.activeCamera = camera;
  }
  
  //add parts to body
  let addbodyparts= (obj)=>{
	obj.body.pos = [0, 0, 0];
	obj.bodyparts.push(obj.body);
	
	obj.leftfoot.pos = [-0.4, -0.9, 0];
	obj.bodyparts.push(obj.leftfoot);
	
	obj.rightfoot.pos = [0.4, -0.9, 0];
	obj.bodyparts.push(obj.rightfoot);

	obj.leftarm.pos = [-1, -0.3, 0];
	obj.bodyparts.push(obj.leftarm);
	
	obj.rightarm.pos = [1, -0.3, 0];
	obj.bodyparts.push(obj.rightarm);	
  }
  
  //give parts a position and colour
  let initbodyparts = (obj, Parent, posx, posy, posz) =>{
	obj.parent = Parent;
	obj.position.x = posx;
	obj.position.y = posy;
	obj.position.z = posz;
	let color = [];
	if(Parent.id === username)
		color = [1.0, 0.2, 0.7];
	else if(Parent.id === "slime")
		color = [0.5, 1, 0.5];
	else if(Parent.id !== username && Parent.id !== "slime")
		color = [0.7, 0.3, 0.2];
	else
		console.log("not a player, enemy or otherplayer")
	obj.material.diffuseColor = new BABYLON.Color3(color[0], color[1], color[2]);
  }
  
  //initialize a sphere
  let initsphere = (sphere) => {
    sphere.position.y = 1;
	sphere.position.x = 3;
	sphere.position.z = 3;
	sphere.checkCollisions = true;
  }
  
  //initialize the ground
  let initground = (ground) =>{
	ground.checkCollisions = true;
  }
  
  //initialize the light
  let initlight = (light) =>{
    light.intensity = .5; // Dim the light a small amount
  }
  
  //add the battle ui
  let addbattleui = (battleui, uibg) =>{
	
	battleui.idealWidth = 600;
	battleui.idealHeight = 400;
	
	uibg.width = 0.3;
	uibg.height = "50px";
	uibg.cornerRadius = 10;
	uibg.color = "Orange";
	uibg.thickness = 2;
	uibg.background = "blue";
	uibg.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
	battleui.addControl(uibg);
	
	let createbutton = function(left, top, name, attack){
		
		let button = new BABYLON.GUI.Button.CreateSimpleButton(name, attack);
		button.width = "50px";
		button.height = "15px";
		button.color = "white";
		button.background = "green";
		button.onPointerDownObservable.add(function() {
			console.log("down");
		});
		button.left = left;
		button.top = top;
		uibg.addControl(button);
		
		return button;
	}
	
	createbutton("-30%", "-17.5%", "btn1", "attack1");
	createbutton("0%","-17.5%", "btn2", "attack2");
	createbutton("-30%%","17.5%", "btn4", "attack3");
	createbutton("0%","17.5%", "btn3", "attack4");
	
	createbutton("30%","-17.5%", "btn5", "items");
	createbutton("30%","17.5%", "btn6", "escape");
	
	uibg.isVisible = false;
	
  }
  
  //check if a battle is possible
  let checkforbattle = (player, enemies) =>{
	
	for(let ii = 0; ii < enemies.length; ii++){
	
		let enemy = enemies[ii];
		
		if(enemy.state !== 1){
			
			let ex = enemy.position.x;
			let ey = enemy.position.y;
			let ez = enemy.position.z;
		
			let px = player.position.x;
			let py = player.position.y;
			let pz = player.position.z;
		
			if(Math.sqrt(((ex-px)*(ex-px))+((ey-py)*(ey-py))+((ez-pz)*(ez-pz)))< 5 && (player.state === 0 || player.state === 1))
				return enemy;
		}
		
	}
	
	return false;
	
  }
  
  //start the battle
  let startbattle = (container) =>{
	let player = container.p[0];
	let enemy = container.e[0];
	player.state = 1;
	enemy.state = 1;
	enemy.tx = player.position.x;
	enemy.tz = player.position.z;
	player.tx = enemy.position.x;
	player.tz = enemy.position.z;
  }
  
  //join a battle
  let joinbattle = (battlecontainer, enemy, player) =>{
	
	let container = null;
	let enemybefore = null;
	
	for(let ii = 0; ii < battlecontainer.length; ii++){
		for(let yy = 0; yy < battlecontainer[ii].e.length; yy++){
			if(battlecontainer[ii].p[yy] === player){
				container = battlecontainer[ii];
				enemybefore = container.e[container.e.length-1];
			}
		}		
	}
	
	enemy.state = 1;
	enemy.tx = player.position.x;
	enemy.tz = player.position.z;
	enemy.position.x = enemybefore.position.x + 2;
	enemy.position.z = enemybefore.position.z;
	  
  }
  

  
  let addenemy = (serverobj, enemies) =>{
	  
	let enemy = BABYLON.Mesh.CreateBox(serverobj.username, 1, scene);
	enemies.push(enemy);
	initenemy(enemy, serverobj);
		
	enemy.body = BABYLON.Mesh.CreateBox("body", 1, scene);
	enemy.leftfoot = BABYLON.Mesh.CreateBox("leftfoot", 0.5, scene);
	enemy.rightfoot = BABYLON.Mesh.CreateBox("rightfoot", 0.5, scene);
	enemy.leftarm = BABYLON.Mesh.CreateBox("leftarm", 0.5, scene);
	enemy.rightarm = BABYLON.Mesh.CreateBox("rightarm", 0.5, scene);
	addbodyparts(enemy);

	for(let ii = 0; ii < enemy.bodyparts.length; ii++){
		let part = enemy.bodyparts[ii];
		part.material = new BABYLON.StandardMaterial("color", scene); //needed for color
		initbodyparts(part, enemy, part.pos[0], part.pos[1], part.pos[2]); //Params: obj, parent, x, y, z, color
	}
		
	enemy.position.x = serverobj.x;
	enemy.position.z = serverobj.z;
	enemy.position.y = serverobj.y;
  }
  
  let initenemy = (obj, serverobj) =>{
	
	obj.stats = serverobj.stats;
	obj.gear = serverobj.gear;
	obj.bodyparts = [];
	obj.state = serverobj.state;
	obj.checkCollisions = true;
	obj.tx = serverobj.tx;
	obj.tz = serverobj.tz;
	obj.ellipsoid = new BABYLON.Vector3(1, 1, 1);
	obj.ellipsoidOffset = new BABYLON.Vector3(0, 1, 0);
	obj.isVisible = false;
	obj.walkspd = 0.05;
	obj.rotatespd = 0.02;
	obj.gravity = -0.9;
	obj.walk = function() {
		let curposx = obj.position.x;
		let curposz = obj.position.z;
		
		let tposx = obj.tx;
		let tposz = obj.tz;
		
		let posX = obj.walkspd * Math.sin(obj.rotation.y);
		let posZ = obj.walkspd * Math.cos(obj.rotation.y);
		
		obj.moveWithCollisions(new BABYLON.Vector3(posX, 0, posZ));
		
		if(tposx.toFixed(0) === curposx.toFixed(0) && tposz.toFixed(0) === curposz.toFixed(0)){
			//obj.tx = Math.floor(Math.random() * 101)-50;
			//obj.tz = Math.floor(Math.random() * 101)-50;
		}
	}
		
	obj.rotate = function(){
		let curposx = obj.position.x;
		let curposz = obj.position.z;
		
		let x = obj.tx - curposx;
		let z = obj.tz - curposz;		

		obj.rotation = new BABYLON.Vector3(0, Math.atan2(x,z), 0);
	}
  }
  
  let addplayer = (serverobj, players, otherplayers) =>{
	 
	let player = BABYLON.Mesh.CreateBox(serverobj.username, 1, scene);

	if(username === serverobj.username){
		players.push(player);
		initplayer(player, serverobj);
	}else{
		otherplayers.push(player);
		initotherplayers(player, serverobj)
	}
	
	player.body = BABYLON.Mesh.CreateBox("body", 1, scene);
	player.leftfoot = BABYLON.Mesh.CreateBox("leftfoot", 0.5, scene);
	player.rightfoot = BABYLON.Mesh.CreateBox("rightfoot", 0.5, scene);
	player.leftarm = BABYLON.Mesh.CreateBox("leftarm", 0.5, scene);
	player.rightarm = BABYLON.Mesh.CreateBox("rightarm", 0.5, scene);
	addbodyparts(player);
	
	for(let ii = 0; ii < player.bodyparts.length; ii++){
		let part = player.bodyparts[ii];
		part.material = new BABYLON.StandardMaterial("color", scene); //needed for color
		initbodyparts(part, player, part.pos[0], part.pos[1], part.pos[2]); //Params: obj, parent, x, y, z, color
	}
	
	player.position.x = serverobj.x;
	player.position.z = serverobj.z;
	player.position.y = serverobj.y;
  }
  
  let initplayer = (obj, serverobj) =>{
	
	obj.stats = serverobj.stats;
	obj.gear = serverobj.gear;
	obj.bodyparts = [];
	obj.state = serverobj.state;
	obj.checkCollisions = true;
	obj.tx = serverobj.tx;
	obj.tz = serverobj.tz;
	obj.ellipsoid = new BABYLON.Vector3(1, 1, 1);
	obj.ellipsoidOffset = new BABYLON.Vector3(0, 1, 0);
	obj.isVisible = false;
	obj.walkspd = 0.05;
	obj.rotatespd = 0.02;
	obj.gravity = -0.9;
	obj.inventory = serverobj.inventory;
	obj.forward = false;
	obj.backward = false;
	obj.right = false;
	obj.left = false;
		
	let battleui = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("battleUI");
	obj.uibg = new BABYLON.GUI.Rectangle();
	addbattleui(battleui, obj.uibg);
		
	obj.showui = function() {
		obj.uibg.isVisible = true;
	}
	
	obj.hideui = function() {
		obj.uibg.isVisible = false;
	}

	obj.walk = function() {
		
		if (obj.forward) {
			let posX = obj.walkspd * Math.sin(obj.rotation.y);
			let posZ = obj.walkspd * Math.cos(obj.rotation.y);
			obj.moveWithCollisions(new BABYLON.Vector3(posX, 0, posZ));
		} else if (obj.backward) {
			let posX = obj.walkspd * Math.sin(obj.rotation.y);
			let posZ = obj.walkspd * Math.cos(obj.rotation.y);
			obj.moveWithCollisions(new BABYLON.Vector3(-posX, 0,-posZ));	
		}
	
		if(obj.right){
			obj.rotation.y += obj.rotatespd;
		}else if(obj.left){
			obj.rotation.y -= obj.rotatespd;
		}
		
	}
		
	window.addEventListener("keydown", function(e) {
		switch(e.keyCode){
			case 87: obj.forward = true;
				break;
			case 83: obj.backward = true;
				break;
			case 68: obj.right = true;
				break;
			case 65: obj.left = true;
				break;
			default:
		}
	});
	
	window.addEventListener("keyup", function(e) {
		switch(e.keyCode){
			case 87: obj.forward = false;
				break;
			case 83: obj.backward = false;
				break;
			case 68: obj.right = false;
				break;
			case 65: obj.left = false;
				break;
			default:
		}
	});
		
	obj.rotate = function(){
		let curposx = obj.position.x;
		let curposz = obj.position.z;
		
		let x = obj.tx - curposx;
		let z = obj.tz - curposz;		

		obj.rotation = new BABYLON.Vector3(0, Math.atan2(x,z), 0);
	}
  }
  
  let initotherplayers = (obj, serverobj) =>{
	obj.stats = serverobj.stats;
	obj.gear = serverobj.gear
	obj.bodyparts = [];
	obj.state = serverobj.state;
	obj.ellipsoid = new BABYLON.Vector3(1, 1, 1);
	obj.ellipsoidOffset = new BABYLON.Vector3(0, 1, 0);
	obj.isVisible = false;
  }
  
  
  
  
  
  
  
    // Now, call the createScene function that you just finished creating
  let scene = createScene();
  
    // Register a render loop to repeatedly render the scene
  engine.runRenderLoop(function () {
    scene.render();
  });
  
    // Watch for browser/canvas resize events
  window.addEventListener("resize", function () {
    engine.resize();
  });
  
  
  
  
 
