import PongMode from './PongMode.js';
import router from '../../../../site_static/js/router.js';

export default class TournamentPongMode extends PongMode {

    constructor(game) {
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

	handleSocketMessage(event) 
	{
		let parsedData;
		try {
			parsedData = JSON.parse(event.data);
		} catch (error) {
			console.error("Error parsing WebSocket message:", error);
			console.log("Raw received data:", event.data);
			return;
		}

		const { lobby_info, event_info } = parsedData;
		if (!lobby_info || !event_info) 
		{
			console.error("Invalid data structure received:", parsedData);
			return;
		}

		switch (lobby_info.current_lobby_status) 
		{
			case 'TO_SETUP':
				break;
			case 'PLAYING':
				break;
			case 'ENDED':
				break;
			case 'WAITING_PLAYER_RECONNECTION':
				break;
			default:
				console.warn("Unhandled lobby status:", lobby_info.current_lobby_status);
		}
	}

	setUpLobby(data) 
  	{
		const { event_info, lobby_info } = data;

		if (event_info.event_name === "host_started_game") 
		{
			return;
		}
		
		this.managePlayerSetup(data);
	}
}