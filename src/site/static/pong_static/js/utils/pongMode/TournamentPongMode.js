import PongMode from './PongMode.js';

export default class TournamentPongMode extends PongMode {

    constructor(game) {
		super(game);
	}

	/**
	 * Retrieves or generates a room name for the lobby.
	 */
	getRoomName() 
	{
		if (window.location.pathname.includes("guest")) 
			this.room_name = window.localStorage.getItem('room_name');
		else 
		{
			this.room_name = crypto.randomUUID();
			window.localStorage.setItem('room_name', this.room_name);
		}

		if (!this.room_name)
			console.error("Error: Room name is empty or undefined.");
	}

	/**
	 * Initializes the private lobby mode.
	 */
	init() 
	{
		this.getRoomName();
	
		this.socket.initGameWebSocket(
			'pong',
			this.handleSocketMessage.bind(this),
			this.room_name,
			this.onSocketOpen.bind(this)
		);
	}
	
	/**
	 * Sends a start signal to the server to confirm lobby setup.
	 */
	sendStart() 
	{
		this.socket.send(JSON.stringify({ 
			type: 'client_ready',
			player_id: this.game.player_id
		 }));
	}

}