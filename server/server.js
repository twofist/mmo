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
const UPDATE_ENEMY_DATA = 5;
const UPDATE_PLAYER_DATA = 6;

let uid = 0;
let eid = 0;

console.log("Listening on", PORT);

//user class
class User {
    constructor(obj) {
        this.id = uid++;
        this.ip = obj.ip !== void 0 ? obj.ip : "";
        this.socket = obj.socket;
		/*
		this.stats = {health: 1, attack: 1, magic: 1, accuracy: 1, dodge: 1, stunchance: 1, stamina: 1, armor: 1, speed: 1};
		this.gear = {head: 0, necklace: 0, body: 0, righthand: 0, lefthand: 0, rings: 0, shoes: 0};
		this.tx = 0;
		this.tz = 0;
		this.x = 0;
		this.z = 0;
		this.y = 5;
		this.inventory = [];
		this.state = 0;
		*/
		this.data = {
			servertype: 0,
			username: obj.username !== void 0 ? obj.username : "",
			id: uid,
			tx: 0,
			tz: 0,
			x: 0,
			z: 0,
			y: 1,
			state: 0,
			gear: {head: 0, necklace: 0, body: 0, righthand: 0, lefthand: 0, rings: 0, shoes: 0},
			stats: {health: 1, attack: 1, magic: 1, accuracy: 1, dodge: 1, stunchance: 1, stamina: 1, armor: 1, speed: 1},
			inventory: [],
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
		this.id = eid++;
		this.username = "slime";
		this.stats = {health: 1, attack: 1, magic: 1, accuracy: 1, dodge: 1, stunchance: 1, stamina: 1, armor: 1, speed: 1};
		this.gear = {head: 0, necklace: 0, body: 0, righthand: 0, lefthand: 0, rings: 0, shoes: 0};
		this.x = Math.random();
		this.z = Math.random();
		this.y = 5;
		this.state = 0;
		this.tx = Math.floor(Math.random() * 101)-50;
		this.tz = Math.floor(Math.random() * 101)-50;
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

//when someone connects
wss.on('connection', function connection(ws, req) {
    console.log("someone connected");
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const user = new User({
        ip: ip,
        socket: ws
    });
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
            if (type === USERNAME) {
                user.data.username = data.split('"servertype":' + USERNAME + " ")[1];
                console.log(user.ip + ":" + user.data.username, "connected!");
                broadcastMessage(CONNECTED, user.data);
                user.send(getOnlineUsers());
				user.send(getOnlineEnemies());
				return;
            }
		//on received message do...
        switch (type) {
            default:
                console.log("Unknown message of type", type, "from", ip);
                break;
        };

    });
});
