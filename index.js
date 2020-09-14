const express = require('express');
const app = express();
const serv = require('http').Server(app);

app.get('/', function(req, res) {
	res.sendFile(__dirname + '/client/index.html');
});
app.use('/client', express.static(__dirname + '/client'));

const port = process.env.PORT || 6969;
serv.listen(port);
console.log(`Listening on port ${port}`);

const io = require('socket.io')(serv,{});

var rooms = {};
var sockets = {};

var Room = () => {
	self = {
		players: {}
	}
	return self;
};

var Player = name => {
	self = {
		name: name,
		controls: {
			'up': false,
			'left': false,
			'down': false,
			'right': false
		}
	};
	return self;
}

function join_room(socket, code, id, name) {
	socket.join(code);
	rooms[code].players[id] = Player(name);

	socket.code = code;
	socket.emit('joined_room_success', {
		code: code,
		players: rooms[code].players,
		id: id
	});
	io.to(code).emit('player_joined', {
		id: id,
		data: rooms[code].players[id]
	});
}

io.sockets.on('connection', socket => {

	let id = Math.random();
	sockets[id] = socket;

	socket.on('create', name => {
		let code = '';
		for (let i = 0; i < 4; i++) {
			code += String.fromCharCode(Math.floor(65 + Math.random() * 26));
		}

		rooms[code] = Room();
		join_room(socket, code, id, name);
	});

	socket.on('join', data => {
		if (data.code in rooms && Object.keys(rooms[data.code]).length < 8) {
			join_room(socket, data.code, id, data.name);
		}
	});

	socket.on('control', control => {
		for (playerId in rooms[socket.code].players)
			if (rooms[socket.code].players[playerId].controls[control] && playerId != id)
				return;

		rooms[socket.code].players[id].controls[control] = !rooms[socket.code].players[id].controls[control];

		io.to(socket.code).emit('update_controls', {
			id: id,
			controls: rooms[socket.code].players[id].controls
		});
	});

	socket.on('disconnect', () => {
		delete sockets[socket];

		if (rooms[socket.code]) {
			io.to(socket.code).emit('player_left', id);

			if (Object.keys(rooms[socket.code].players).length == 1)
				delete rooms[socket.code];
			else
				delete rooms[socket.code].players[id];
		}
	});
});