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
			console.log("Generating new room name...");
			this.room_name = "test-room"//crypto.randomUUID();
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
			type: 'host_start_tournament',
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
		const { event_info, lobby_info } = data;

		if (event_info.event_name === "player_to_setup")
		{
			const players = data.lobby_info.players;

			for (const [key, value] of Object.entries(players))
			{
				if (this.game.player_id == key)
					this.isPlaying = true;

				this.game.AddUserToLobby(key,value, this.socket);
			}
		}

	}

	manageMatch(data)
	{
		const { event_info, lobby_info } = data;

		
		if (event_info.event_name === "match_start")
		{
			if (this.isPlaying == true)
			{
				this.game.initGameEnvironment(data);
				router.navigateTo('/tournament/playing');
			}
		}
		else
		{
			this.game.updateGameState(lobby_info);
		}
	}

	manageEndMatch(data)
	{
		const { event_info, lobby_info } = data;

		if (this.isPlaying == true)
		{
			if(event_info.loser_id == this.game.player_id)
				this.game.game_ended(true);

			this.isPlaying = false;
		}
	}
}