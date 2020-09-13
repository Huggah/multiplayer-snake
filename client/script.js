const socket = io();

const name = document.getElementById('name');
const code = document.getElementById('code');
const join = document.getElementById('join');
const create = document.getElementById('create');

var players;
var room_code;

join.addEventListener('click', () => {
	socket.emit('join', {
		name: name.value,
		code: code.value
	});
});

create.addEventListener('click', () => {
	socket.emit('create', name.value);
});

socket.on('joined_room_success', data => {
	room_code = data.code;
	players = data.players;

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
})

function updatePlayersList() {
	let str = '';
	for (id in players) {
		str += `${players[id].name}<br>`;
	}
	document.getElementById('players_list').innerHTML = str;
}