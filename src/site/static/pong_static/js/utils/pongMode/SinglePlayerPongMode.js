import PongMode from './PongMode.js';
import PongPlayer from '../../utils/PongPlayer.js';

/**
 * Represents the single player mode for the Pong game, including support for playing against a bot.
 * @class
 * @extends PongMode
 */
export default class SinglePlayerPongMode extends PongMode {
    
    /**
     * Constructor for SinglePlayerPongMode.
     * Initializes the game mode, including whether the player is facing a bot or not.
     * @param {Game} game - Reference to the main Game instance.
     */
    constructor(game) {
		super(game);

		const pathSegments = window.location.pathname.split('/').filter(Boolean);

		this.mode = pathSegments[3] || 'default';
		this.isVersusBot = this.mode == "vs_bot";
	}

	/**
	 * Handles the opening of a socket connection and sends an initialization message for the player.
	 * This sends the player's ID and the mode (whether it's versus bot or not) to the server.
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
	 * Initializes the single player mode by setting up the WebSocket connection.
	 * This method is called when the mode is initialized.
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
	 * Handles incoming socket messages by processing the data and updating the game state accordingly.
	 * @param {Object} parsedData - The data received from the socket, which includes lobby and event information.
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
	 * Configures the lobby based on the received server data for the "vs bot" mode.
	 * Sets up the game scene, initializes player objects, and sends a ready signal to the server.
	 * @param {Object} data - The data received from the WebSocket containing lobby and player information.
	 * @returns {void}
	 */
	CustomsetUpLobby(data)
	{
		this.game.initScene(data);

		if (this.game.pongOpponent == null && this.game.pongPlayer == null)
		{
			const playerData = Object.values(data.lobby_info.players)[0];
			const secondPlayerData = Object.values(data.lobby_info.players)[1];

			if (this.game.pongOpponent == null)
			{
				this.game.isOpponentFirst = true;
			}
			
			this.game.pongPlayer = new PongPlayer(this.socket, this.game.player_id, playerData, false, this.game.style);
			this.game.pongOpponent = new PongPlayer(this.socket, -1, secondPlayerData, true, this.game.style);
			
			console.log("this.isOpponentFirst", this.game.isOpponentFirst);


			this.game.addPlayersToScene();

			this.socket.send(JSON.stringify({ 
				type: 'client_ready',
				player_id: this.game.player_id
			}));
		}
	}
}
