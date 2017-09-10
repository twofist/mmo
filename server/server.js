const WebSocket = require('ws');
const PORT = 8080;//process.env.PORT || 27689;
const wss = new WebSocket.Server({
    port: PORT
});
	const USERNAME = 0;
    const CONNECTED = 1;
    const DISCONNECTED = 2;
    const ONLINE_USERS = 3;
	const ONLINE_ENEMIES = 4;
    const UPDATE_ENEMY_TARGETPOSITION = 5;
	const UPDATE_PLAYER_POSITION = 6;
	const UPDATE_PLAYER_INVENTORY = 7;
	const UPDATE_PLAYER_ANIMATION = 8;
	const UPDATE_PLAYER_STATS = 9;
	const UPDATE_ENEMY_POSITION = 10;

let uid = 0;

console.log("Listening on", PORT);

//user class
class User {
    constructor(obj) {
        this.id = uid++;
        this.ip = obj.ip !== void 0 ? obj.ip : "";
        this.socket = obj.socket;
		this.data = {
			servertype: 0,
			username: obj.username !== void 0 ? obj.username : "",
			idn: uid,
			tx: 0,
			tz: 0,
			x: 0,
			z: 0,
			y: 1,
			state: 0,
			gear: {head: 0, necklace: 0, body: 0, righthand: 0, lefthand: 0, rings: 0, shoes: 0},
			stats: {health: 1, attack: 1, magic: 1, accuracy: 1, dodge: 1, stunchance: 1, stamina: 1, armor: 1, speed: 1},
			inventory: [],
			gravity: -0.9,
			walkspd: 0.05,
			rotatespd: 0.02
		};
		
        if (!this.socket) {
            throw new Error("Fatal error, user", this.id, "got no socket!");
        }
    }
	//send a message
    send(msg) {
        this.socket.send(msg);
    }
	//valid username
    isValid() {
        return (this.data.username !== "");
    }
};

//enemy class
class Enemy {
	constructor(obj){
		this.servertype = 0;
		this.idn = uid++;
		this.username = "slime";
		this.stats = {health: 1, attack: 1, magic: 1, accuracy: 1, dodge: 1, stunchance: 1, stamina: 1, armor: 1, speed: 1};
		this.gear = {head: 0, necklace: 0, body: 0, righthand: 0, lefthand: 0, rings: 0, shoes: 0};
		this.x = Math.random();
		this.z = Math.random();
		this.y = 5;
		this.state = 0;
		this.tx = Math.floor(Math.random() * 101)-50;
		this.tz = Math.floor(Math.random() * 101)-50;
		this.gravity = -0.9;
		this.walkspd = 0.05;
		this.rotatespd = 0.02;
	}
};

let users = [];
let enemies = [];

//enemies.push(new Enemy())
enemies.push(new Enemy())

//removes the users from the array
let deleteUserFromUsers = (user) => {
    users.map((us, index) => {
        if (us === user || us === user) {
            users.splice(index, 1);
        }
    });
};

//gets all the online users
let getOnlineUsers = () => {
    let str = "";
    users.map((user, index) => {
		user.data.servertype = ONLINE_USERS;
        str += JSON.stringify(user.data);
        if (index < users.length - 1) str += "!!!";
    });
    return (str);
};

let getOnlineEnemies = () =>{
	let str = "";
	enemies.map((enemy, index) => {
		enemy.servertype = ONLINE_ENEMIES;
		str += JSON.stringify(enemy);
		if(index < enemies.length -1) str += "!!!";
	});
	return (str);
};

//send message to given user
let broadcastMessage = (type, msg) => {
    users.map((user) => {
		user.data.servertype = type;
        user.send(JSON.stringify(msg));
    });
};

let userAlreadyConnected = (user) => {
    for (let ii = 0; ii < users.length; ++ii) {
        const us = users[ii];
        if (us.ip === user.ip) return (true);
    };
    return (false);
};

let adduser = (user, data) =>{
	user.data.username = data.split('"servertype":' + USERNAME + " ")[1];
    console.log(user.ip + ":" + user.data.username, "connected!");
    broadcastMessage(CONNECTED, user.data);
    user.send(getOnlineUsers());
	user.send(getOnlineEnemies());
};

//when someone connects
wss.on('connection', function connection(ws, req) {
    console.log("someone connected");
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const user = new User({
        ip: ip,
        socket: ws
    });
	/*if (userAlreadyConnected(user)) {
        console.log("Already connected, skipping!");
        return;
    }*/
    users.push(user);
    console.log(users.length, "connected users!");
	//remove user from array
    ws.on('close', () => {
        deleteUserFromUsers(user);
        console.log(user.ip + ":" + user.data.username, "disconnected!");
        broadcastMessage(DISCONNECTED, user.data);
    });
	//when a message is received
    ws.on('message', function(data) {
		const servertype = data.split('"servertype":')[1];
        const type = parseInt(servertype);
		let obj;
		if(type !== USERNAME)
			obj = JSON.parse(data);
		//on received message do...
        switch (type) {
			case UPDATE_ENEMY_TARGETPOSITION:
					updateenemytargetposition(obj, type);
				break;
			case UPDATE_PLAYER_ANIMATION:
				break;
			case UPDATE_PLAYER_POSITION:
					updateplayerposition(user, obj, type);
				break;
			case UPDATE_PLAYER_INVENTORY:
					updateplayerinventory(user, obj, type);
				break;
			case UPDATE_PLAYER_STATS:
				break;
			case UPDATE_ENEMY_POSITION:
				break;
			case USERNAME:
				adduser(user, data);
            default:
                console.log("Unknown message of type", type, "from", ip, "data:", data);
                break;
        };

    });
});




let updateplayerposition = (user, obj, type) =>{
	
	user.data.x = obj.x;
	user.data.z = obj.z;
	user.data.y = obj.y;
	
	broadcastMessage(type, user.data);
	
}

let updateplayerinventory = (user, obj, type) =>{
	
	user.data.inventory = obj.inventory;
	user.data.gear = obj.gear;
	
	broadcastMessage(type, user.data);
	
}

let updateenemytargetposition = (obj, type) =>{
	
	enemy.tx = Math.floor(Math.random() * 101)-50;
	enemy.tz = Math.floor(Math.random() * 101)-50;
	
	broadcastMessage(type, enemy);
	
}

