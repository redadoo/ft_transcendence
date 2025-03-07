import PongMode from './PongMode.js';
import PongPlayer from '../../utils/PongPlayer.js';

const FIRST_PLAYER_DATA = {
	"x": 19,
	"y": 0,
	"height": 4,
	"width": 0.7,
	"depth": 1.2,
	"speed": 0.9,
	"color": 16777215
};

const SECOND_PLAYER_DATA = {
	"x": -19,
	"y": 0,
	"height": 4,
	"width": 0.7,
	"depth": 1.2,
	"speed": 0.9,
	"color": 16777215
};

export default class SinglePlayerPongMode extends PongMode {
    
    constructor(game) {
		super(game);

		const pathSegments = window.location.pathname.split('/').filter(Boolean);

		this.mode = pathSegments[3] || 'default';
		this.isVersusBot = this.mode == "vs_bot";
		console.log("mode : ",this.mode);
		console.log("this.isVersusBot : ",this.isVersusBot);
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
				this.game.game_ended(true);
				break;
			case 'PLAYER_DISCONNECTED':
				this.game.game_ended(false);
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
			console.log("pip");
			
			this.socket.send(JSON.stringify({ 
				type: 'client_ready',
				player_id: this.game.player_id
			}));
			
			this.game.pongPlayer = new PongPlayer(this.socket, this.game.player_id, FIRST_PLAYER_DATA);
			this.game.sceneManager.scene.add(this.game.pongPlayer.paddle.mesh);

			this.game.pongOpponent = new PongPlayer(this.socket, -1, SECOND_PLAYER_DATA, true);
			this.game.sceneManager.scene.add(this.game.pongOpponent.paddle.mesh);
		}
	}
}