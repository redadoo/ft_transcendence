import PongMode from './PongMode.js';
import router from '../../../../site_static/js/router.js';

/**
 * Represents the private lobby mode for the Pong game, handling room creation, lobby setup, and socket communication.
 * @class
 * @extends PongMode
 */
export default class PrivateLobbyPongMode extends PongMode {
	/**
	 * Constructor for PrivateLobbyPongMode.
	 * Initializes the private lobby mode and prepares the room name.
	 * @param {Game} game - Reference to the main Game instance.
	 */
	constructor(game) 
	{
		super(game);
		this.room_name = null;
	}

	/**
	 * Retrieves or generates a room name for the private lobby.
	 * The room name is either fetched from local storage (for guest users) or generated randomly.
	 * @returns {void}
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
	 * Initializes the private lobby mode by fetching the room name and setting up the WebSocket connection.
	 * @returns {void}
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
	 * Sends a start signal to the server to confirm that the lobby setup is complete and the client is ready.
	 * @returns {void}
	 */
	sendStart() 
	{
		this.socket.send(JSON.stringify({ 
			type: 'client_ready',
			player_id: this.game.player_id
		}));
	}

	/**
	 * Configures the lobby based on the data received from the server.
	 * This includes initializing the game scene, managing player setup, and handling game start events.
	 * @param {Object} data - The data received from the WebSocket containing event and lobby information.
	 * @returns {void}
	 */
	setUpLobby(data) 
	{		  
		const { event_info, lobby_info } = data;
		  
		if (event_info.event_name === "host_started_game") 
		{
			this.game.initScene(data);
			this.sendStart();
			router.navigateTo('/lobby/playing');
			return;
		}

		this.managePlayerSetup(data);
	}
}
