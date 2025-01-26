import Paddle from './Paddle.js';
import PongInput from './PongInput.js';

export default class PongPlayer {
	constructor(socket, playerId, data) 
	{
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
		//if is not a bot
		if (this.playerId != '-1')
		{
			this.input = new PongInput('KeyW', 'KeyS');
			this.input.addEvent('keydown', this.handleKeyDown.bind(this));
			this.input.addEvent('keyup', this.handleKeyUp.bind(this));
		}
	}

	handleKeyDown(event) 
	{
		if(this.socket != null)
		{
			if (event.code === this.input.controlKeys.up) 
				{
					this.socket.send
					(
						JSON.stringify
						(
							{ 
								type: 'update_player',
								action_type: 'key_down',
								key: this.input.controlKeys.up,
								playerId : this.playerId
							}
						)
					);
				}
				
			if (event.code === this.input.controlKeys.down) 
			{
				this.socket.send
				(
					JSON.stringify
					(
						{ 
							type: 'update_player',
							action_type: 'key_down',
							key: this.input.controlKeys.down,
							playerId : this.playerId
						}
					)
				);
			}
		}
	}

	handleKeyUp(event) 
	{
		if(this.socket != null)
		{
			if (event.code === this.input.controlKeys.up) 
				{
					this.socket.send
					(
						JSON.stringify
						(
							{ 
								type: 'update_player',
								action_type: 'key_up',
								key: this.input.controlKeys.up,
								playerId : this.playerId
							}
						)
					);
				}
			if (event.code === this.input.controlKeys.down) 
			{
				this.socket.send
				(
					JSON.stringify
					(
						{ 
							type: 'update_player',
							action_type: 'key_up',
							key: this.input.controlKeys.down,
							playerId : this.playerId
						}
					)
				);
			}
		}
	}

}