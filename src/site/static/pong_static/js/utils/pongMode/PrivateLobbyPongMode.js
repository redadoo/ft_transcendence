import PongMode from './PongMode.js';
import router from '../../../../site_static/js/router.js';

export default class PrivateLobbyPongMode extends PongMode {
	/**
	 * Constructor for PrivateLobbyPongMode.
	 * @param {Game} game - Reference to the main Game instance.
	 */
	constructor(game) 
	{
		super(game);
		this.room_name = null;
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
			this.onSocketOpen.bind(this),
			this.onSocketClose.bind(this)
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

	/**
	 * Configures the lobby based on the received server data.
	 * @param {Object} data - The data received from the WebSocket.
	 */
	setUpLobby(data) 
  	{
		this.game.initGameEnvironment(data);
		  
		const { event_info, lobby_info } = data;
		  
		if (event_info.event_name === "host_started_game") 
		{
			this.sendStart();
			router.navigateTo('/lobby/playing');
			return;
		}

		this.managePlayerSetup(data);
	}
}
