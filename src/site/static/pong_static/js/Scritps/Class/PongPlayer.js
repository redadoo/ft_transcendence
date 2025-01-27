import BaseInput from '../../../../common_static/js/BaseInput.js';
import Paddle from './Paddle.js';

export default class PongPlayer 
{
	constructor(socket, playerId, data) 
	{
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

	updatePosition(newY)
	{
		this.newY = newY;
	}
  
	syncPosition()
	{
	  	this.paddle.mesh.position.y = this.newY;
	}

	setUpKeys()
	{
		if (this.playerId != this.BaseBotId)
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

	handleKey(actionType, event) 
	{
		if (this.socket) 
		{
			const key = Object.keys(this.controlKeys).find(
				(k) => this.controlKeys[k] === event.code
			);

			if (key) 
			{
				this.socket.send
				(
					JSON.stringify
					(
						{
							type: 'update_player',
							action_type: actionType,
							key: this.controlKeys[key],
							playerId: this.playerId,
						}
					)
				);
			}
		}
	}
}