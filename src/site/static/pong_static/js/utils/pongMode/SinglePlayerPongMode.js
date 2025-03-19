import PongMode from './PongMode.js';
import PongPlayer from '../../utils/PongPlayer.js';

export default class SinglePlayerPongMode extends PongMode {
    
    constructor(game) {
		super(game);

		const pathSegments = window.location.pathname.split('/').filter(Boolean);

		this.mode = pathSegments[3] || 'default';
		this.isVersusBot = this.mode == "vs_bot";
	}

	/**
	 * Handles the opening of a socket connection and sends an initialization message for the player.
	 */
	onSocketOpen() 
	{
		this.socket.send(JSON.stringify({
			type: 'init_player',
			player_id: this.game.player_id,
			mode: this.mode
		}));
	}

	/**
	 * Initializes the single player mode.
	 */
	init() 
	{
        this.socket.initWebSocket(
			'singleplayer/pong/',
			this.handleSocketMessage.bind(this),
			this.onSocketOpen.bind(this),
			this.onSocketClose.bind(this)
		);
	}

	/**
	 * Handles incoming socket messages.
	 * @param {Object} data - The incoming data from the socket.
	 */
	handleSocketMessage(parsedData) 
	{
		const { lobby_info, event_info } = parsedData;
		if (!lobby_info || !event_info) 
		{
			console.error("Invalid data structure received:", parsedData);
			return;
		}

		switch (lobby_info.current_lobby_status) 
		{
			case 'TO_SETUP':
				if (!this.isVersusBot)
					this.CustomsetUpLobby(parsedData);
				else
					this.setUpLobby(parsedData);
				break;
			case 'PLAYING':
				this.game.updateGameState(lobby_info);
				break;
			case 'ENDED':
				this.game.game_ended(true, '/match-result');
				break;
			case 'PLAYER_DISCONNECTED':
				this.game.game_ended(false, '/');
				break;
			default:
				console.warn("Unhandled lobby status:", lobby_info.current_lobby_status);
		}
	}

	/**
	 * Configures the lobby based on the received server data.
	 * @param {Object} data - The data received from the WebSocket.
	 */
	CustomsetUpLobby(data)
	{
		this.game.initGameEnvironment(data);

		if (this.game.pongOpponent == null && this.game.pongPlayer == null)
		{
			const playerData = Object.values(data.lobby_info.players)[0];
			const secondPlayerData = Object.values(data.lobby_info.players)[1];

			this.game.pongPlayer = new PongPlayer(this.socket, this.game.player_id, playerData);
			this.game.sceneManager.scene.add(this.game.pongPlayer.paddle.mesh);
			
			this.game.pongOpponent = new PongPlayer(this.socket, -1, secondPlayerData, true);
			this.game.sceneManager.scene.add(this.game.pongOpponent.paddle.mesh);

			this.socket.send(JSON.stringify({ 
				type: 'client_ready',
				player_id: this.game.player_id
			}));
		}
	}
}