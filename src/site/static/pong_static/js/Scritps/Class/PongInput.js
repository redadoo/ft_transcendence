
import BaseInput from '../../../../common_static/js/BaseInput.js'

export default class PongInput extends BaseInput {
	
	constructor(upKey, downKey) {

		super();

        this.movingUp = false;
        this.movingDown = false;

		this.controlKeys = {
			up: upKey,
			down: downKey,
		};
	}
}
