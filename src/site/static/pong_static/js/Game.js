import router from '../../site_static/js/router.js';
import SocketManager from '../../common_static/js/SocketManager.js';
import TournamentPongMode from './utils/pongMode/TournamentPongMode.js';
import MultiplayerPongMode from './utils/pongMode/MultiplayerPongMode.js';
import SinglePlayerPongMode from './utils/pongMode/SinglePlayerPongMode.js';
import PrivateLobbyPongMode from './utils/pongMode/PrivateLobbyPongMode.js';
import Bounds from './utils/Bounds.js';
import Ball from './utils/Ball.js';


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

    initScene(data)
    {
        if(this.isSceneCreated == false)
        {
            const bounds_data = data?.lobby_info?.bounds;
            const ball_data = data?.lobby_info?.ball;
            const scores_data = data?.lobby_info?.scores;

            if (!bounds_data || !ball_data || !scores_data)
            {
                console.error("Game data is missing or incomplete:", { bounds_data, ball_data, scores_data });
                return;
            }

            this.bounds = new Bounds(bounds_data.xMin, bounds_data.xMax, bounds_data.yMin, bounds_data.yMax);
            this.ball = new Ball(ball_data.radius);
            this.lastScore = scores_data;

            this.isSceneCreated = true;
        }
    }

    AddUserToLobby(newPlayer_id, playerData, socket)
	{
        throw new Error("Method 'AddUserToLobby()' must be implemented.");
	}

    addPlayersToScene()
    {
        throw new Error("Method 'addPlayersToScene()' must be implemented.");
    }

    handleScoreSprites(score)
    {
        throw new Error("Method 'handleScoreSprites()' must be implemented.");
    }

    updateClockDisplay(data)
	{
        if (this.isClockVisible == false)
        {
            document.getElementById('pongCountDown').classList.remove('d-none');
            this.isClockVisible = true;
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
    
    animate()
    {
        throw new Error("Method 'animate()' must be implemented.");
    }

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

    reset()
	{
		if (this.ball != null)
			this.ball.updatePosition(0,0);
        
        document.getElementById('pongCountDown').classList.add('d-none');
        this.lastCountValue = 6;
        this.isClockVisible = false;
	}
}