import PongMode from './PongMode.js';

export default class SinglePlayerPongMode extends PongMode {
    
    constructor(game) {
		super(game);
	}

	/**
	 * Initializes the single player mode.
	 */
	init() 
	{
        this.socket.initWebSocket(
			'singleplayer/pong/',
			this.handleSocketMessage.bind(this),
			this.onSocketOpen.bind(this)
		);
	}
}