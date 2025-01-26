
import BaseInput from '../../../common_static/js/BaseInput';

export default class LiarsBarInput extends BaseInput {
    
    constructor(upKey, downKey) {

        super();

        this.controlKeys = {
            up: upKey,
            down: downKey,
        };
    }
}
