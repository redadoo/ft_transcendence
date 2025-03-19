// MultiplayerPongMode.js
import PongMode from './PongMode.js';
import MatchmakingManager from '../../../../common_static/js/MatchmakingManager.js';
import Sound from '../../../../site_static/js/Sound.js';

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
		Sound.play('startGameSound');

		this.socket.initGameWebSocket(
			'pong',
			this.handleSocketMessage.bind(this),
			data.room_name,
			this.onSocketOpen.bind(this),
			this.onSocketClose.bind(this)
		);
	}

	dispose(isGamefinished, player_id)
	{
		this.matchmakingManager.dispose();

		let event_name = isGamefinished === true ? "quit_game" : "unexpected_quit";

		if (this.socket) 
		{
			this.socket.send(JSON.stringify({
				type: event_name,
				player_id: player_id
			}));
			this.socket.close();
		}
	}
}
