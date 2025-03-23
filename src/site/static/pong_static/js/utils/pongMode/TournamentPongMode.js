import PongMode from './PongMode.js';
import router from '../../../../site_static/js/router.js';

/**
 * Represents the tournament mode for the Pong game, where players compete in a series of matches.
 * @class
 * @extends PongMode
 */
export default class TournamentPongMode extends PongMode {

    /**
     * Constructor for TournamentPongMode.
     * @param {Game} game - Reference to the main Game instance.
     */
    constructor(game) {
		super(game);
		this.room_name = null;
		this.isPlaying = false;
	}

	/**
	 * Retrieves or generates a room name for the lobby.
	 * If the player is in a guest mode, it retrieves the room name from localStorage.
	 * Otherwise, it generates a new UUID and stores it in localStorage.
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
	 * Initializes the private lobby mode by setting up the WebSocket connection and preparing the game.
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
	 * Sends a start signal to the server to confirm the lobby setup and start the tournament.
	 */
	sendStart()
	{
		this.socket.send(JSON.stringify({
			type: 'host_start_tournament',
			player_id: this.game.player_id
		}));
	}

	/**
	 * Handles incoming socket messages and updates the game state accordingly.
	 * @param {Object} parsedData - The data received from the WebSocket, containing lobby and event information.
	 */
	handleSocketMessage(parsedData)
	{
		const {lobby_info, event_info } = parsedData;
		if (!lobby_info || !event_info)
		{
			console.error("Invalid data structure received:", parsedData);
			return;
		}

		switch (lobby_info.current_tournament_status)
		{
			case 'TO_SETUP':
				this.setUpLobby(parsedData);
				break;
			case 'PLAYING':
				this.manageMatch(parsedData);
				break;
			case 'ENDED':
				this.manageEndMatch(parsedData);
				break;
			case 'PLAYER_DISCONNECTED':
				this.game.game_ended(false, '/');
				break;
			default:
				console.warn("Unhandled lobby status:", lobby_info.current_tournament_status);
		}
	}

	/**
	 * Sets up the lobby based on the incoming data for the tournament mode.
	 * This includes adding players to the lobby and displaying the game scene.
	 * @param {Object} data - The data received from the WebSocket, containing lobby and event information.
	 */
	setUpLobby(data)
  	{
		this.game.initScene(data);

		const { event_info, lobby_info } = data;

		if (event_info.event_name === "player_to_setup")
		{
			const players = data.lobby_info?.players;
			
			if (players && String(this.game.player_id) in players) 
			{
				document.getElementById('pongOverlay').classList.add('d-none');
				this.isPlaying = true;
			
				for (const [key, value] of Object.entries(players))
					this.game.AddUserToLobby(key, value, this.socket);
			}
		}
	}

	/**
	 * Manages the match state once the tournament is in progress.
	 * Updates the game state or navigates to the match page based on the event received.
	 * @param {Object} data - The data received from the WebSocket, containing event and lobby information.
	 */
	manageMatch(data)
	{
		if (this.isPlaying == true)
		{
			const { event_info, lobby_info } = data;
			if (event_info.event_name === "match_start")
			{
				router.navigateTo('/tournament/playing');
				return;
			}
			this.game.updateGameState(lobby_info);
		}
	}

	/**
	 * Manages the end of the match and processes the outcome.
	 * @param {Object} data - The data received from the WebSocket, containing event and lobby information.
	 */
	manageEndMatch(data)
	{
		const { event_info, lobby_info } = data;

		if (event_info.event === "tournament_finished")
			this.game.game_ended(true, '/tournament-result');
		else if(this.isPlaying == true)
		{
			this.isPlaying = false;
			if(event_info.loser_id != this.game.player_id)
			{
				document.getElementById('pongOverlay').classList.remove('d-none');
				this.socket.send(JSON.stringify({
					type: 'waiting_next_match',
				}));
				this.game.reset();
			}
			else
			{
				this.game.game_ended(true, '/match-result');
			}
		}
	}
}
