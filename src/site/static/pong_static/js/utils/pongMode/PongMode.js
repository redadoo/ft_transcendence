import SocketManager from '../../../../common_static/js/SocketManager.js';

/**
 * Represents the base class for Pong game modes, handling socket communication and game state updates.
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
		this.socket = new SocketManager();
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
	 * Handles incoming socket messages.
	 * @param {Object} data - The incoming data from the socket.
	 */
	handleSocketMessage(event) 
	{
		let parsedData;
		try {
			parsedData = JSON.parse(event.data);
		} catch (error) {
			console.error("Error parsing WebSocket message:", error);
			console.log("Raw received data:", event.data);
			return;
		}

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
				this.game.initGameEnvironment(parsedData);
				break;
			case 'PLAYING':
				this.game.updateGameState(lobby_info);
				break;
			case 'ENDED':
				break;
			case 'WAITING_PLAYER_RECONNECTION':
				break;
			default:
				console.warn("Unhandled lobby status:", lobby_info.current_lobby_status);
		}
	}

	/**
	 * Configures the lobby based on the received server data.
	 * @param {Object} data - The data received from the WebSocket.
	 */
	setUpLobby(data)
	{
		if (this.game.pongOpponent != null && this.game.pongPlayer != null)
		{
			this.socket.send(JSON.stringify({ 
				type: 'client_ready',
				player_id: this.game.player_id
			 }));
		}
		else
		{
			if (data.event_info.event_name === "recover_player_data")
			{
				const players = data.lobby_info.players;

				for (const [key, value] of Object.entries(players))
				{
					if (this.game.pongPlayer != null && this.game.pongPlayer.playerId == parseInt(key))
						continue;
					this.game.AddUserToLobby(key,value, this.socket);
				}
			}

			if (data.event_info.event_name === "player_join")
			{
				const newPlayerId = data.event_info.player_id;
				const playerData = data.lobby_info.players[data.event_info.player_id];
				this.game.AddUserToLobby(newPlayerId, playerData, this.socket);
			}
		}
	}
}
