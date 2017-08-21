  let canvas = document.getElementById("canvas");

  let engine = new BABYLON.Engine(canvas, true);
  
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
	
	//creating the player
	let players = [];
	
	for(let ii = 0; ii < 1; ii++){
		players.push(BABYLON.Mesh.CreateBox("player", 1, scene));
		let player = players[ii];
		initlifeform(player);
	
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
	}
	
	let player = players[0];
	//done creating the player
	
	//creating the enemy
	let enemies = [];
	
	for(let ii = 0; ii < 10; ii++){
		enemies.push(new BABYLON.Mesh.CreateBox("enemy", 1, scene));
		let enemy = enemies[ii];
		initlifeform(enemy);
		
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
		
		enemy.position.x = Math.floor(Math.random() * 101)-50;
		enemy.position.z = Math.floor(Math.random() * 101)-50;
		
	}
	//done creating the enemy
	
	//creating other players
	let otherplayers = [];
	
	for(let ii = 0; ii < 4; ii++){
		otherplayers.push(BABYLON.Mesh.CreateBox("otherplayer", 1, scene));
		let otherplayer = otherplayers[ii];
		initlifeform(otherplayer);
	
		otherplayer.body = BABYLON.Mesh.CreateBox("body", 1, scene);
		otherplayer.leftfoot = BABYLON.Mesh.CreateBox("leftfoot", 0.5, scene);
		otherplayer.rightfoot = BABYLON.Mesh.CreateBox("rightfoot", 0.5, scene);
		otherplayer.leftarm = BABYLON.Mesh.CreateBox("leftarm", 0.5, scene);
		otherplayer.rightarm = BABYLON.Mesh.CreateBox("rightarm", 0.5, scene);
		addbodyparts(otherplayer);
	
		for(let ii = 0; ii < otherplayer.bodyparts.length; ii++){
			let part = otherplayer.bodyparts[ii];
			part.material = new BABYLON.StandardMaterial("color", scene); //needed for color
			initbodyparts(part, otherplayer, part.pos[0], part.pos[1], part.pos[2]); //Params: obj, parent, x, y, z, color
		}
		
		otherplayer.position.z = 10+ii+ii;
	}
	
	otherplayers[0].position.x = -10
	otherplayers[1].position.x = -10
	otherplayers[2].position.x = 10
	otherplayers[3].position.x = 10
	
	otherplayers[0].position.z = 10
	otherplayers[1].position.z = -10
	otherplayers[2].position.z = 10
	otherplayers[3].position.z = -10
	
	//done creating other players
	
	initcamera(camera, player, scene);
	
	let battlecontainer = [];
	
	
	
	
	
	
	const socket = new WebSocket('wss://twofist-chat-server.herokuapp.com');
    const username = window.location.search.split("=")[1] || prompt("Please enter your name", "");
    if (window.location.search.split("=")[1] !== username) {
        window.location.replace("?user=" + username);
    }
	
    const MSG_USERNAME = 0;
    const MSG_CONNECTED = 1;
    const MSG_DISCONNECTED = 2;
    const MSG_ONLINE_USERS = 3;
    const ENEMY_DATA = 4;
	const PLAYER_DATA = 5;
	
	socket.addEventListener('open', function(event) {
        socket.send(MSG_USERNAME + ":" + username);
    });
    socket.addEventListener('close', function(event) {
        console.log("disconnected...");
    });
    socket.addEventListener('error', function(event) {
        console.log("an error has occured!");
    });
	
	socket.addEventListener('message', function(event) {
        const data = event.data;
        const type = parseInt(data[0]);
        const msg = data.split(":")[1];
        switch (type) {
            case MSG_CONNECTED:
                if (username === msg) return;
                console.log("User connected:", msg);
                adduser(msg);
                break;
            case MSG_DISCONNECTED:
                console.log("User disconnected:", msg);
                removeuser(msg);
                break;
            case MSG_ONLINE_USERS:
                console.log("Online users:", msg);
                let users = msg.split(",");
                users.map((name) => {
                    adduser(name);
                });
                break;
            default:
                console.log("Unknown message:", data);
                break;
        };
    });
	
	
	
	
	
	
	
	scene.registerBeforeRender(function() {
		
		const NORMAL = 0;
		const INBATTLE = 1;
		const AFK = 3;
		const TRADING = 4;
		const DEAD = 5;
		
		player.moveWithCollisions(new BABYLON.Vector3(0, player.gravity, 0)); //gravity
			
		for(let ii = 0; ii < enemies.length; ii++){
			const enemy = enemies[ii];
			
			enemy.rotate();
			if(enemy.state === 0)
				enemy.walk();
			
			enemy.moveWithCollisions(new BABYLON.Vector3(0, enemy.gravity, 0));
			
			if(enemy.position.y < 0)
				console.log("fell")
		
		}
		
		for(let ii = 0; ii < otherplayers.length; ii++){
			let otherplayer = otherplayers[ii];
			otherplayer.moveWithCollisions(new BABYLON.Vector3(0, otherplayer.gravity, 0));
		}
		
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
		
		if(player.state === NORMAL){
			player.hideui();
			player.walk();
		}
		if(player.state === INBATTLE){
			player.showui();
			player.rotate();
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
  
  //initialize the lifeform
  let initlifeform = (obj) =>{
	obj.stats = {health: 1, attack: 1, magic: 1, accuracy: 1, dodge: 1, stunchance: 1, stamina: 1, armor: 1, speed: 1};
	obj.gear = {head: 0, necklace: 0, body: 0, righthand: 0, lefthand: 0, rings: 0, shoes: 0};
	obj.bodyparts = [];
	obj.state = 0;
	obj.position.y = 5;
	if(obj.id !== "otherplayer")
		obj.checkCollisions = true;
	obj.tx = Math.floor(Math.random() * 101)-50;
	obj.tz = Math.floor(Math.random() * 101)-50;
	obj.ellipsoid = new BABYLON.Vector3(1, 1, 1);
	obj.ellipsoidOffset = new BABYLON.Vector3(0, 1, 0);
	obj.isVisible = false;
	obj.walkspd = 0.05;
	obj.rotatespd = 0.02;
	obj.gravity = -0.9;
	if(obj.id === "enemy"){
		obj.walk = function() {
			let curposx = obj.position.x;
			let curposz = obj.position.z;
			
			let tposx = obj.tx;
			let tposz = obj.tz;
			
			let posX = obj.walkspd * Math.sin(obj.rotation.y);
			let posZ = obj.walkspd * Math.cos(obj.rotation.y);
			
			obj.moveWithCollisions(new BABYLON.Vector3(posX, 0, posZ));
			
			if(tposx.toFixed(0) === curposx.toFixed(0) && tposz.toFixed(0) === curposz.toFixed(0)){
				obj.tx = Math.floor(Math.random() * 101)-50;
				obj.tz = Math.floor(Math.random() * 101)-50;
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
	if(obj.id === "player"){
		obj.inventory = [];
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
	if(Parent.id === "player")
		color = [1.0, 0.2, 0.7];
	else if(Parent.id === "enemy")
		color = [0.5, 1, 0.5];
	else if(Parent.id === "otherplayer")
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
  
  
  
  
 
