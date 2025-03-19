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
				this.game.game_ended(false, '/');
				break;
			default:
				console.warn("Unhandled lobby status:", lobby_info.current_tournament_status);
		}
	}

	setUpLobby(data)
  	{
		console.log("setup lllllll", data);

		this.game.initGameEnvironment(data);

		const { event_info, lobby_info } = data;

		if (event_info.event_name === "player_to_setup")
		{
			const players = data.lobby_info?.players;

			console.log("playersssssss", players);
			
			if (players && String(this.game.player_id) in players) 
			{
				document.getElementById('pongOverlay').classList.add('d-none');
				console.log("player", this.game.player_id, "is playing");
				this.isPlaying = true;
			
				for (const [key, value] of Object.entries(players))
					this.game.AddUserToLobby(key, value, this.socket);
			}
			else
				console.log("player", this.game.player_id, "is not playing");
		}
	}

	manageMatch(data)
	{
		if (this.isPlaying == true)
		{
			const { event_info, lobby_info } = data;
			console.log("player", this.game.player_id, "is playing in play iiiiiiii");
			console.log("player lobby_info ", lobby_info);
			console.log("player event_info ", event_info);
			if (event_info.event_name === "match_start")
			{
				router.navigateTo('/tournament/playing');
				console.log("player", this.game.player_id, "go to match");
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
			this.game.game_ended(true, '/tournament-result');
		}
		else if(this.isPlaying == true)
		{
			this.isPlaying = false;
			
			console.log("match finito");
			if(event_info.loser_id != this.game.player_id)
			{
				document.getElementById('pongOverlay').classList.remove('d-none');
				console.log("player", this.game.player_id, "is not loser");
				this.socket.send(JSON.stringify({
					type: 'waiting_next_match',
				}));
				this.game.reset();
			}
			else
			{
				console.log("player", this.game.player_id, "is loser");
				this.game.game_ended(true, '/match-result');
			}
		}
	}
}