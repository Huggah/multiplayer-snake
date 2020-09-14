const socket = io();

const arrows = {
	up: document.getElementById('arrow_up'),
	down: document.getElementById('arrow_down'),
	left: document.getElementById('arrow_left'),
	right: document.getElementById('arrow_right'),
};

var players;
var room_code;
var myId;

document.getElementById('join').addEventListener('click', () => {
	socket.emit('join', {
		name: document.getElementById('name').value,
		code: document.getElementById('code').value.toUpperCase()
	});
});

document.getElementById('create').addEventListener('click', () => {
	socket.emit('create', document.getElementById('name').value);
});

socket.on('joined_room_success', data => {
	room_code = data.code;
	players = data.players;
	myId = data.id;

	document.getElementById('join_room').style.display = 'none';
	document.getElementById('game').style.display = 'block';

	document.getElementById('room_code_display').innerHTML = `Room Code: ${room_code}`;

	updatePlayersList();
});

socket.on('player_joined', data => {
	players[data.id] = data.data;
	updatePlayersList();
});

socket.on('player_left', id => {
	delete players[id];
	updatePlayersList();
});

function updatePlayersList() {
	let str = '';
	let i = 0;
	for (id in players) {
		str += `<div id='row${i % 2}'><p id='name:${id}'>${players[id].name}</p></div>`;
		i++;
	}
	document.getElementById('players_list').innerHTML = str;

	updateControlsList();
};

let controls = ['up', 'down', 'left', 'right'];
for (let i = 0; i < controls.length; i++) {
	document.getElementById(`arrow_${controls[i]}`).addEventListener('click', () => {
		socket.emit('control', controls[i]);
	});
};

socket.on('update_controls', data => {
	players[data.id].controls = data.controls;
	updateControlsList();
});

function updateControlsList() {
	let icons = {'up': '🡡', 'down': '🡣', 'left': '🡠', 'right': '🡢'};

	for (direction in arrows)
		arrows[direction].src = '/client/img/arrow.png';

	for (id in players) {
		let str = players[id].name;

		for (direction in icons) {
			if (players[id].controls[direction]) {
				str += icons[direction];
				if (id == myId)
					arrows[direction].src = '/client/img/arrow_active.png';
				else
					arrows[direction].src = '/client/img/arrow_disabled.png';
			}
		}

		document.getElementById(`name:${id}`).innerHTML = str;
	}
}