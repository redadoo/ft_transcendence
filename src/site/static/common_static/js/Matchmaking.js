import GameSocketManager from '../../common_static/js/GameSocketManager.js';

class Matchking {

	constructor() {
		this.socketManager = new GameSocketManager();

		const button = document.getElementById('startMatchmaking');
		if (button) {
			button.addEventListener('click', () => {
				this.startMatchmaking();
			});
		} else {
			console.error("Button with id 'startMatchmaking' not found.");
		}
	}

	async startMatchmaking() {
		// Initialize WebSocket connection
		await this.socketManager.initWebSocket(
			'multiplayer/pong/matchmaking',
			this.handleSocketMessage.bind(this)
		);
		
		const response = await fetch("/api/profile");
		const json_response = await response.json(); 

		this.socketManager.send(JSON.stringify({
			action: 'join_matchmaking'
		}));
	}
	

	handleSocketMessage(event) {
		try {
			const data = JSON.parse(event.data);
			switch (data.type) {
				case 'init_lobby':
					this.initLobby(data.room_name);
					break;
				default:
					console.log(`This type of event is not managed.`);
			}
		} catch (error) {
			console.error("Error processing WebSocket message:", error);
		}
	}

	initLobby(roomName) {
		console.log(`Joined room: ${roomName}`);
		window.location.href = `/multiplayer/pong/${roomName}`;
		this.socketManager.close();
	}
}

const matchking = new Matchking();
