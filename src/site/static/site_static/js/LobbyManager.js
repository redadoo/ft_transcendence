class LobbyManager {
	constructor() {
	this.socket = null;
	this.lobbyCode = null;
	this.players = [];
	}

	async createLobby() {
	this.lobbyCode = Math.random().toString(36).substring(2, 8).toUpperCase();
	document.getElementById('lobbyCode').textContent = this.lobbyCode;

	// Connect to WebSocket
	this.socket = new WebSocket(`ws://${window.location.host}/ws/pong/lobby/${this.lobbyCode}`);
	this.setupSocketHandlers();
	}

	setupSocketHandlers() {
	this.socket.onmessage = (event) => {
		const data = JSON.parse(event.data);
		switch(data.type) {
		case 'player_joined':
			this.updatePlayers(data.players);
			break;
		case 'game_ready':
			this.enableStartGame();
			break;
		}
	};
	}

	updatePlayers(players) {
	this.players = players;
	document.getElementById('player1').textContent = players[0] || 'Waiting...';
	document.getElementById('player2').textContent = players[1] || 'Waiting...';
	}

	enableStartGame() {
	const startBtn = document.getElementById('startGame');
	startBtn.disabled = false;
	startBtn.addEventListener('click', () => {
		this.socket.send(JSON.stringify({
		type: 'start_game'
		}));
	});
	}

	setupCopyButton() {
	document.getElementById('copyCode').addEventListener('click', () => {
		navigator.clipboard.writeText(this.lobbyCode);
	});
	}
}

export default LobbyManager;