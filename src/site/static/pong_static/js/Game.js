import Ball from './utils/Ball.js';
import router from '../../site_static/js/router.js';
import SocketManager from '../../common_static/js/SocketManager.js';
import TournamentPongMode from './utils/pongMode/TournamentPongMode.js';
import MultiplayerPongMode from './utils/pongMode/MultiplayerPongMode.js';
import SinglePlayerPongMode from './utils/pongMode/SinglePlayerPongMode.js';
import PrivateLobbyPongMode from './utils/pongMode/PrivateLobbyPongMode.js';

/**
 * Represents the Pong game, managing game modes, player data, ball, score, and game state.
 * Handles initialization, window events, game state updates, and cleanup.
 * @class
 */
export default class Game
{
	constructor()
	{
		this.ball = null;
		this.bounds = null;
		this.player_id = null;
		this.background = null;
		this.pongPlayer = null;
		this.lastCountValue = 6;
		this.pongOpponent = null;
		this.isClockVisible = false;
		this.isSceneCreated = false; 
		this.shouldCleanupOnExit = false;
		this.close_window_event_unload = null;
		this.close_window_event_popstate = null;
		this.close_window_event_beforeunload = null;
		this.lastScore = { player1: 0, player2: 0 };

		this.manageWindowClose();
	}

	/**
	 * Handles the event of closing or navigating away from the game window.
	 * Ensures that the game socket is closed properly before leaving.
	 * @param {Event} event - The event triggered when attempting to leave the page.
	 */
	handleExit(event)
	{
		const leavePage = window.confirm("Do you want to leave?");
		if (leavePage)
			this.game_ended(false, '/');
		else
			history.pushState(null, document.title, location.href);
	}

	/**
	 * Handles the event of closing or navigating away from the game window.
	 * Ensures that the game socket is closed properly before leaving.
	 */
	manageWindowClose()
	{
		history.pushState(null, document.title, location.href);

		this.close_window_event_popstate = this.handleExit.bind(this);
		this.close_window_event_beforeunload = (event) => {
			event.preventDefault();
			event.returnValue = "Are you sure you want to leave?";

			this.shouldCleanupOnExit = true;
		};

		this.close_window_event_unload = () => {
			if (this.shouldCleanupOnExit)
				this.game_ended(false, '/');
		};

		window.addEventListener("beforeunload", this.close_window_event_beforeunload);
		window.addEventListener("unload", this.close_window_event_unload);
		window.addEventListener('popstate', this.close_window_event_popstate, false);
	}

	/**
	 * Cleanup event listeners to prevent memory leaks.
	 */
	cleanupWindowClose()
	{
		window.removeEventListener('beforeunload', this.close_window_event_beforeunload);
		window.removeEventListener('unload', this.close_window_event_unload);
		window.removeEventListener('popstate', this.close_window_event_popstate);
	}

   	/**
	 * Initializes the game with the provided player ID and sets up the corresponding game mode.
	 * @param {string} player_id - The unique identifier for the player.
	 */
	init(player_id)
	{
		router.removeEventListeners();
		this.player_id = player_id;

		switch (SocketManager.getModeFromPath())
		{
			case 'singleplayer':
				this.mode = new SinglePlayerPongMode(this);
				break;
			case 'multiplayer':
				this.mode = new MultiplayerPongMode(this);
				break;
			case 'lobby':
				this.mode = new PrivateLobbyPongMode(this);
				break;
			case 'tournament':
				this.mode = new TournamentPongMode(this);
				break;
			default:
				console.error("Modalità di gioco non valida.");
		}
		
		if (this.mode)
			this.mode.init();
	}

	/**
	 * Initializes the game scene with the provided data, creating the ball and setting up the score.
	 * @param {Object} data - The data used to initialize the game scene (e.g., ball info and scores).
	 */
	initScene(data)
	{
		if(this.isSceneCreated == false)
		{
			const ball_data = data?.lobby_info?.ball;
			const scores_data = data?.lobby_info?.scores;

			if (!ball_data || !scores_data)
			{
				console.error("Game data is missing or incomplete:", {ball_data, scores_data });
				return;
			}

			this.ball = new Ball(ball_data.radius);
			this.lastScore = scores_data;

			this.isSceneCreated = true;
		}
	}

	/**
	 * Updates the game clock display based on the count-down data received from the server.
	 * @param {Object} data - The data containing the count-down value.
	 */
	updateClockDisplay(data)
	{
		if (this.isClockVisible == false)
		{
			document.getElementById('pongCountDown').classList.remove('d-none');
			this.isClockVisible = true;

			const player1Element = document.getElementById('player1');
			const player2Element = document.getElementById('player2');

			if (player1Element && player2Element)
			{
				player1Element.textContent = this.pongPlayer.username || "Player 1";
				player2Element.textContent = this.pongOpponent.username || "Player 2";
			}
		}

		if(data.count_down < this.lastCountValue)
		{
			this.lastCountValue = data.count_down;
			const clockText = document.getElementById('PongClockText');

			if (clockText)
			{
				clockText.textContent = this.lastCountValue;
			}

			if (data.count_down == 0)
				document.getElementById('pongCountDown').classList.add('d-none');
		}
	}


	/**
	 * Updates the game state with new data, including ball position, player positions, and score.
	 * @param {Object} data - The data containing the updated game state.
	 */
	updateGameState(data)
	{
		try
		{
			this.updateClockDisplay(data);
			if (data.ball)
				this.ball.updatePosition(data.ball);

			if (data.players)
			{
				if (data.players[this.pongPlayer.playerId] != undefined)
					this.pongPlayer.updatePosition(data.players[this.pongPlayer.playerId].y);
				if (data.players[this.pongOpponent.playerId] != undefined)
					this.pongOpponent.updatePosition(data.players[this.pongOpponent.playerId].y);
			}

			if(this.lastScore != data.scores)
			{
				this.lastScore = data.scores;
				this.handleScoreSprites(this.lastScore);
			}
		}
		catch (error) {
			console.error("An error occurred during game update state:", error);
			console.error("data:", data);
		}
	}

	/**
	 * Ends the game and cleans up resources, then redirects to a specified path.
	 * @param {boolean} isGamefinished - Whether the game has finished.
	 * @param {string} pathToRedirect - The path to redirect the player to after the game ends.
	 */
	game_ended(isGamefinished, pathToRedirect)
	{
		this.mode.dispose(isGamefinished, this.player_id);

		document.getElementById('pongCountDown').classList.add('d-none');
		router.setupEventListeners();

		this.ball = null;
		this.pongPlayer = null;
		this.pongOpponent = null;

		this.cleanupWindowClose();

		router.navigateTo(pathToRedirect);
	}

	/**
	 * Resets the game state, including resetting the ball and hiding the countdown.
	 */
	reset()
	{
		if (this.ball != null)
			this.ball.updatePosition(0,0);
		
		document.getElementById('pongCountDown').classList.add('d-none');
		this.lastCountValue = 6;
		this.isClockVisible = false;
	}

	/**
	 * Abstract method to animate the game. Must be implemented in subclasses.
	 */
	animate()
	{
		throw new Error("Method 'animate()' must be implemented.");
	}

	/**
	 * Abstract method to add a user to the game lobby. Must be implemented in subclasses.
	 * @param {string} newPlayer_id - The ID of the new player.
	 * @param {Object} playerData - The data associated with the new player.
	 * @param {Object} socket - The socket object associated with the new player.
	 */
	AddUserToLobby(newPlayer_id, playerData, socket)
	{
		throw new Error("Method 'AddUserToLobby()' must be implemented.");
	}

	/**
	 * Abstract method to add players to the game scene. Must be implemented in subclasses.
	 */
	addPlayersToScene()
	{
		throw new Error("Method 'addPlayersToScene()' must be implemented.");
	}

   	/**
	 * Abstract method to handle the display of score sprites. Must be implemented in subclasses.
	 * @param {Object} score - The current game score to display.
	 */
	handleScoreSprites(score)
	{
		throw new Error("Method 'handleScoreSprites()' must be implemented.");
	}

}