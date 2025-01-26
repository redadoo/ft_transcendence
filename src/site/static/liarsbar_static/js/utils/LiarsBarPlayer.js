export default class LiarsBarPlayer
{
	constructor(player_id)
	{

		this.movingUp = false;
		this.movingDown = false;

		this.controlKeys = {
			up: upKey,
			down: downKey,
		};
		
		this.player_id = player_id;
		this.hand = []
	}
}