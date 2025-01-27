import BaseInput from '../../../common_static/js/BaseInput.js';

export default class LiarsBarPlayer
{
	constructor(socket, playerId)
	{
		this.socket = socket;
		this.playerId = playerId;
		this.hand = []

		this.setUpKeys();
	}


	setUpKeys()
	{
		this.controlKeys = {
			leftSwitch: 'KeyA',
			rightSwitch: 'KeyD',
			selectAction: 'KeyE',
			doubtAction: 'Space',
			confirmAction:'Enter'
		};

		this.input = new BaseInput();
		this.input.addEvent('keydown', this.handleKey.bind(this, 'key_down'));
		this.input.addEvent('keyup', this.handleKey.bind(this, 'key_up'));
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