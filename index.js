const express = require('express');
const app = express();
const serv = require('http').Server(app);

app.get('/', function(req, res) {
	res.sendFile(__dirname + '/client/index.html');
});
app.use('/client', express.static(__dirname + '/client'));

serv.listen(process.env.PORT || 5000);

const io = require('socket.io')(serv,{});

var rooms = {}
var sockets = {}

function join_room(socket, code, id, name) {
	socket.join(code);
	rooms[code][id] = {
		name: name
	};
	socket.code = code;
	socket.emit('joined_room_success', {
		code: code,
		players: rooms[code]
	});
	io.to(code).emit('player_joined', {
		id: id,
		data: rooms[code][id]
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

		rooms[code] = {};
		join_room(socket, code, id, name);
	});

	socket.on('join', data => {
		if (data.code in rooms && Object.keys(rooms).length < 4) {
			join_room(socket, data.code, id, data.name);
		}
	});

	socket.on('disconnect', () => {
		delete sockets[socket];

		if (rooms[socket.code]) {
			io.to(socket.code).emit('player_left', id);

			if (Object.keys(rooms[socket.code]).length == 1)
				delete rooms[socket.code];
			else
				delete rooms[socket.code][id];
		}
	});
});