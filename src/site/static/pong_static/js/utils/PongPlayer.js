import BaseInput from '../../../common_static/js/BaseInput.js';
import Paddle from './Paddle.js';

/**
 * Represents a Pong player, handling input and paddle synchronization.
 * @class
 */
export default class PongPlayer {
	/**
	 * Creates an instance of the PongPlayer class.
	 * @param {Object} socket - The socket associated with the player.
	 * @param {number} playerId - The unique identifier for the player.
	 * @param {Object} data - The initial data for the player (including paddle attributes).
	 */
	constructor(socket, playerId, data) {
		this.BaseBotId = '-1';

		this.playerId = parseInt(playerId);
		this.socket = socket;
		this.paddle = new Paddle(data.width, data.height, data.depth, data.color);

		this.input = null;

		this.newY = data.y;
		this.paddle.mesh.position.y = data.y;
		this.paddle.mesh.position.x = data.x;

		this.setUpKeys();
	}

	/**
	 * Updates the y-position of the paddle for the player.
	 * @param {number} newY - The new y-position of the player's paddle.
	 */
	updatePosition(newY) 
	{
		this.newY = newY;
	}

	/**
	 * Synchronizes the paddle's position to match the updated y-position.
	 */
	syncPosition() 
	{
		this.paddle.mesh.position.y = this.newY;
	}

	/**
	 * Sets up key bindings for player control and event listeners for key actions.
	 */
	setUpKeys()
	{
		if (this.playerId !== this.BaseBotId) 
		{
			this.controlKeys = {
				up: 'KeyW',
				down: 'KeyS',
			};

			this.input = new BaseInput();
			this.input.addEvent('keydown', this.handleKey.bind(this, 'key_down'));
			this.input.addEvent('keyup', this.handleKey.bind(this, 'key_up'));
		}
	}

	/**
	 * Handles key events (key down and key up) and sends the corresponding action to the server.
	 * @param {string} actionType - The type of action ('key_down' or 'key_up').
	 * @param {KeyboardEvent} event - The keyboard event triggered by the player.
	 */
	handleKey(actionType, event) 
	{
		if (this.socket) 
		{
			const key = Object.keys(this.controlKeys).find(
				(k) => this.controlKeys[k] === event.code
			);

			if (key) {
				this.socket.send(
					JSON.stringify({
						type: 'update_player',
						action_type: actionType,
						key: this.controlKeys[key],
						playerId: this.playerId,
					})
				);
			}
		}
	}
}
