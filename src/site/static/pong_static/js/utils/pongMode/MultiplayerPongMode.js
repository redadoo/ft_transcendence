// MultiplayerPongMode.js
import PongMode from './PongMode.js';
import MatchmakingManager from '../../../../common_static/js/MatchmakingManager.js';

export default class MultiplayerPongMode extends PongMode 
{
	/**
	 * Constructor for MultiplayerPongMode.
	 * @param {Game} game - Reference to the main Game instance.
	 */
	constructor(game) 
	{
		super(game);
		this.matchmakingManager = null;
	}

	init() 
	{
		this.matchmakingManager = new MatchmakingManager("pong", this.setupGameSocket.bind(this));
	}

	setupGameSocket(data)
	{
		this.socket.initGameWebSocket(
			'pong',
			this.handleSocketMessage.bind(this),
			data.room_name,
			this.onSocketOpen.bind(this),
			this.onSocketClose.bind(this)
		);
	}
}
