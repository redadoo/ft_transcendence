
import BaseInput from '../../../common_static/js/BaseInput';

export default class LiarsBarInput extends BaseInput {
    
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
