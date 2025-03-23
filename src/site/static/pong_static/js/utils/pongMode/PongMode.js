import SocketManager from '../../../../common_static/js/SocketManager.js';

/**
 * Represents the base class for Pong game modes, handling socket communication and game state updates.
 * This class manages the connection to the server, sending and receiving messages, and updating the game state accordingly.
 * @class
 */
export default class PongMode {
	/**
	 * Creates an instance of the PongMode class.
	 * @param {Object} game - The game object that contains the game-related data and configuration.
	 * @param {number} game.player_id - The unique identifier for the player in the game.
	 */
	constructor(game) 
	{
		this.game = game;
		this.socket = new SocketManager(true);
		this.socket.onSlowConnection = this.handleSlowConnection.bind(this);
		this.socket.onNormalConnection = this.handleNormalConnection.bind(this);
	}

	/**
	 * Initializes the game mode. This method must be implemented by subclasses.
	 * @throws {Error} Will throw an error if called directly from this class.
	 */
	init() 
	{
		throw new Error("Method 'init()' must be implemented.");
	}

	/**
	 * Disposes of the game mode by sending a quit message and closing the socket.
	 * @param {boolean} isGamefinished - Whether the game has finished or was unexpectedly quit.
	 * @param {number} player_id - The unique identifier of the player quitting.
	 */
	dispose(isGamefinished, player_id)
	{
		let event_name = isGamefinished === true ? "quit_game" : "unexpected_quit";

		if (this.socket) 
		{
			this.socket.send(JSON.stringify({
				type: event_name,
				player_id: player_id
			}));
			this.socket.close();
		}
	}

	/**
	 * Handles the opening of a socket connection and sends an initialization message for the player.
	 */
	onSocketOpen() 
	{
		this.socket.send(JSON.stringify({
			type: 'init_player',
			player_id: this.game.player_id
		}));
	}

	/**
	 * Handles the closure of the socket connection.
	 * Alerts the player that the server is temporarily down and ends the game.
	 */
	onSocketClose() 
	{
		if(this.game.pongPlayer != null)
		{
			alert("the server is temporarily down");
			this.game.game_ended(false, '/');
		}
	}

	/**
	 * Handles incoming socket messages.
	 * Updates the game state or performs actions based on the server's response.
	 * @param {Object} parsedData - The incoming data from the socket.
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
	 * Initializes the scene and notifies the server if both players are ready.
	 * @param {Object} data - The data received from the WebSocket containing lobby info and event info.
	 */
	setUpLobby(data)
	{
		this.game.initScene(data);

		if (this.game.pongOpponent != null && this.game.pongPlayer != null)
		{
			this.socket.send(JSON.stringify({ 
				type: 'client_ready',
				player_id: this.game.player_id
			 }));
		}
		else
			this.managePlayerSetup(data);
	}

	/**
	 * Manages the player setup by adding users to the lobby based on the received event data.
	 * @param {Object} data - The data received from the WebSocket containing event info and player data.
	 */
	managePlayerSetup(data)
	{
		if (data.event_info.event_name === "recover_player_data")
		{
			const players = data.lobby_info.players;

			for (const [key, value] of Object.entries(players))
			{
				if (this.game.pongPlayer != null && this.game.pongPlayer.playerId == parseInt(key))
					continue;
				this.game.AddUserToLobby(key, value, this.socket);
			}
		}

		if (data.event_info.event_name === "player_join")
		{
			const newPlayerId = data.event_info.player_id;
			const playerData = data.lobby_info.players[data.event_info.player_id];
			this.game.AddUserToLobby(newPlayerId, playerData, this.socket);
		}
	}

	/**
	 * Handles the scenario where a slow connection is detected.
	 * @param {number} ping - The ping value (latency) in milliseconds.
	 */
	handleSlowConnection(ping) 
	{
		console.warn(`High ping detected: ${ping} ms. Disabling player actions.`);
	}

	/**
	 * Handles the scenario where the connection returns to normal.
	 * @param {number} ping - The ping value (latency) in milliseconds.
	 */
	handleNormalConnection(ping) 
	{
		console.log(`Ping back to normal: ${ping} ms. Enabling player actions.`);
	}
}
