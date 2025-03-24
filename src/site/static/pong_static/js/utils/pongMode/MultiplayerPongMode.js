// MultiplayerPongMode.js
import PongMode from './PongMode.js';
import MatchmakingManager from '../../../../common_static/js/MatchmakingManager.js';
import Sound from '../../../../site_static/js/Sound.js';

/**
 * Represents the multiplayer mode for the Pong game, handling matchmaking and socket communication for multiplayer games.
 * @class
 * @extends PongMode
 */
export default class MultiplayerPongMode extends PongMode 
{
	/**
	 * Constructor for MultiplayerPongMode.
	 * Initializes the matchmaking manager and prepares for multiplayer setup.
	 * @param {Game} game - Reference to the main Game instance.
	 */
	constructor(game) 
	{
		super(game);
		this.matchmakingManager = null;
	}

	/**
	 * Initializes the multiplayer mode by setting up the matchmaking manager.
	 * @returns {void}
	 */
	init() 
	{
		this.matchmakingManager = new MatchmakingManager("pong", this.setupGameSocket.bind(this));
	}

	/**
	 * Sets up the game WebSocket connection after the matchmaking process completes.
	 * This method is called when matchmaking successfully returns data for room setup.
	 * @param {Object} data - The data containing the room name and other matchmaking details.
	 * @returns {void}
	 */
	setupGameSocket(data)
	{
		// Sound.play('startGameSound');

		this.socket.initGameWebSocket(
			'pong',
			this.handleSocketMessage.bind(this),
			data.room_name,
			this.onSocketOpen.bind(this),
			this.onSocketClose.bind(this)
		);
	}

	/**
	 * Disposes of the multiplayer mode, cleaning up resources and notifying the server of the player's exit.
	 * @param {boolean} isGamefinished - Whether the game has finished or the player quit unexpectedly.
	 * @param {number} player_id - The unique identifier of the player quitting.
	 * @returns {void}
	 */
	dispose(isGamefinished, player_id)
	{
		// Dispose the matchmaking manager
		this.matchmakingManager.dispose();

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
}
