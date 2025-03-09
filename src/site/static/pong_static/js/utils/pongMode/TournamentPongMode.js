import PongMode from './PongMode.js';
import router from '../../../../site_static/js/router.js';

export default class TournamentPongMode extends PongMode {

    constructor(game) {
		super(game);
		this.room_name = null;
		this.isPlaying = false;
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
			type: 'host_start_tournament',
			player_id: this.game.player_id
		 }));
	}

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
				this.game.game_ended(false);
				break;
			default:
				console.warn("Unhandled lobby status:", lobby_info.current_tournament_status);
		}
	}

	setUpLobby(data)
  	{
		this.game.initGameEnvironment(data);

		const { event_info, lobby_info } = data;

		if (event_info.event_name === "player_to_setup")
		{
			const players = data.lobby_info.players;
			if (Object.hasOwn(players, this.game.player_id)) 
			{
				document.getElementById('pongOverlay').classList.add('d-none');
				this.isPlaying = true;
			
				for (const [key, value] of Object.entries(players))
					this.game.AddUserToLobby(key,value, this.socket);
			}
		}
	}

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

	manageEndMatch(data)
	{
		const { event_info, lobby_info } = data;

		if (event_info.event === "tournament_finished")
		{
			this.game.game_ended(true);
			return;
		}

		if (this.isPlaying == true)
		{
			this.isPlaying = false;
			if(event_info.loser_id == this.game.player_id)
			{
				this.game.game_ended(true);
				return;
			}
			else
			{
				document.getElementById('pongOverlay').classList.remove('d-none');
				this.socket.send(JSON.stringify({
					type: 'waiting_next_match',
				}));
			}
			this.game.reset();
		}
	}
}