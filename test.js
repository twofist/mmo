const WebSocket = require('ws');
const PORT = process.env.PORT || 27689;
const wss = new WebSocket.Server({
    port: PORT
});
const USERNAME = 0;
const CONNECTED = 1;
const DISCONNECTED = 2;
const ONLINE_USERS = 3;
const ENEMY_DATA = 4;
const PLAYER_DATA = 5;
const 

//const MSG_PRIVATE_MESSAGE = 1;
//const MSG_GLOBAL_MESSAGE = 2;

//const MSG_MESSAGE = 6;
//const MSG_EVIL = 7;

let uid = 0;
let eid = 0;

console.log("Listening on", PORT);

const getRandomRgbColor = () => {
    const r = (Math.random() * 256) | 0;
    const g = (Math.random() * 256) | 0;
    const b = (Math.random() * 256) | 0;
    return (`rgb(${r},${g},${b})`);
};

class User {
    constructor(obj) {
        this.id = uid++;
        this.ip = obj.ip !== void 0 ? obj.ip : "";
        //this.ontime = 0;
        this.username = obj.username !== void 0 ? obj.username : "";
        this.socket = obj.socket;
		this.stats = {health: 1, attack: 1, magic: 1, accuracy: 1, dodge: 1, stunchance: 1, stamina: 1, armor: 1, speed: 1};
		this.gear = {head: 0, necklace: 0, body: 0, righthand: 0, lefthand: 0, rings: 0, shoes: 0};
		this.tx = 0;
		this.tz = 0;
		this.inventory = [];
		this.state = 0;
        //this.globalmsg = [];
        //this.privatemsg = [];
        //this.color = getRandomRgbColor();
        if (!this.socket) {
            throw new Error("Fatal error, user", this.id, "got no socket!");
        }
    }
    send(msg) {
        this.socket.send(msg);
    }
    isValid() {
        return (this.username !== "");
    }
};

class Enemy {
	constructor(obj){
		this.id = eid++;
		this.stats = {health: 1, attack: 1, magic: 1, accuracy: 1, dodge: 1, stunchance: 1, stamina: 1, armor: 1, speed: 1};
		this.gear = {head: 0, necklace: 0, body: 0, righthand: 0, lefthand: 0, rings: 0, shoes: 0};
		this.x = Math.random();
		this.z = Math.random();
		this.y = 1;
		this.state = 0;
		this.tx = Math.floor(Math.random() * 101)-50;
		this.tz = Math.floor(Math.random() * 101)-50;
	}
};

let users = [];
let enemies = [];

let userAlreadyConnected = (user) => {
    for (let ii = 0; ii < users.length; ++ii) {
        const us = users[ii];
        if (us.ip === user.ip) return (true);
    };
    return (false);
};

let deleteUserFromUsers = (user) => {
    users.map((us, index) => {
        if (us.username === user.username || us.id === user.id) {
            users.splice(index, 1);
        }
    });
};

let getOnlineUsers = () => {
    let str = "";
    users.map((user, index) => {
        str += user.username;
        if (index < users.length - 1) str += ",";
    });
    return (str);
};

let broadcastMessage = (type, msg) => {
    users.map((user) => {
        user.send(type + ":" + msg);
    });
};

let getUserByUsername = (username) => {
    for (let ii = 0; ii < users.length; ++ii) {
        const us = users[ii];
        if (us.username === username) return (us);
    };
    return null;
};

let validUsername = (str) => {
    return (
        str !== "undefined" &&
        str !== "__proto__" &&
        str.length >= 1 && str.length <= 15
    );
};

wss.on('connection', function connection(ws, req) {
    console.log("someone connected");
    const ip = req.headers['x-forwarded-for'] || ws.upgradeReq.connection.remoteAddress;
    const user = new User({
        ip: ip,
        socket: ws
    });
	/*
    if (userAlreadyConnected(user)) {
        console.log("Already connected, skipping!");
        return;
    }
	*/
    users.push(user);
    console.log(users.length, "connected users!");
    ws.on('close', () => {
        deleteUserFromUsers(user);
        console.log(user.ip + ":" + user.username, "disconnected!");
        broadcastMessage(DISCONNECTED, user.username);
    });

    ws.on('message', function(data) {
        const type = parseInt(data[0]);
        data = data.substring(2, data.length);
        if (!user.isValid()) {
            if (type === USERNAME) {
                if (!validUsername(data)) {
                    console.log(user.ip, "invalid username");
                    return;
                }
                user.username = data;
                console.log(user.ip + ":" + data, "connected!");
                broadcastMessage(CONNECTED, data);
                user.send(ONLINE_USERS + ":" + getOnlineUsers());
            }
            return;
        }

        switch (type) {
            case :
                break;
            default:
                console.log("Unknown message of type", type, "from", ip);
                break;
        };

    });
});
