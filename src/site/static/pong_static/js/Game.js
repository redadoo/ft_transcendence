import SinglePlayerPongMode from './utils/pongMode/SinglePlayerPongMode.js';
import MultiplayerPongMode from './utils/pongMode/MultiplayerPongMode.js';
import PrivateLobbyPongMode from './utils/pongMode/PrivateLobbyPongMode.js';
import TournamentPongMode from './utils/pongMode/TournamentPongMode.js';

import * as THREE from "https://cdn.jsdelivr.net/npm/three@latest/build/three.module.js";
import SceneManager from '../../common_static/js/SceneManager.js';
import Bounds from './utils/Bounds.js';
import Ball from './utils/Ball.js';
import PongPlayer from './utils/PongPlayer.js';
import Background from './utils/Background.js';
import SocketManager from '../../common_static/js/SocketManager.js';
import router from '../../site_static/js/router.js';

/**
 * Camera configuration settings for the scene.
 *
 * @constant
 * @type {Object}
 * @property {number} FOV - Field of view for the camera, set to 75 degrees.
 * @property {number} NEAR_PLANE - The near clipping plane distance, set to 0.1.
 * @property {number} FAR_PLANE - The far clipping plane distance, set to 1500.
 * @property {THREE.Vector3} POSITION - The initial position of the camera in the scene.
 * @property {number} ROTATION_X - The rotation angle of the camera around the X-axis, set to π/6 (30 degrees).
 */
const CAMERA_SETTINGS = {
	FOV: 75,
	NEAR_PLANE: 0.1,
	FAR_PLANE: 1500,
	POSITION: new THREE.Vector3(0, -20, 40),
	ROTATION_X: Math.PI / 6,
};

/**
 * Game class handles the setup and execution of a Pong-style game.
 * It manages the scene, players, ball, lighting, and game modes.
 */
export default class Game
{
	/**
	 * Constructs a new Game instance, initializing properties.
	*/
	constructor()
	{
		this.sceneManager = null;
		this.mode = null;
		this.player_id = null;

		this.close_window_event_beforeunload = null;
		this.close_window_event_popstate = null;
		this.close_window_event_unload = null;
		this.shouldCleanupOnExit = false;

		this.ambientLight = null;
		this.pointLightMagenta = null;
		this.pointLightBlue = null;
		this.lightHelper = null;
		this.screenLight = null;

		this.bounds = null;
		this.pongPlayer = null;
		this.pongOpponent = null;
		this.ball = null;
		this.background = null;
		this.lastScore = null;
		this.isClockVisible = false;
		this.lastCountValue = 6;

		this.isSceneCreated = false;
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

	/**
     * Initializes the game scene, mode, and environment.
     */
	async init(player_id)
	{
		router.removeEventListeners();
		this.player_id = player_id;

		//init scene
		this.sceneManager = new SceneManager(true);

		Object.assign(this.sceneManager, CAMERA_SETTINGS);
		this.sceneManager.initialize(true, true);

		//load model
		await this.sceneManager.modelManager.loadModel({ '/static/pong_static/assets/models/Scene.glb': 'Scene' });

		//init camera setting
		this.sceneManager.camera.position.copy(CAMERA_SETTINGS.POSITION);
		this.sceneManager.camera.rotation.x = CAMERA_SETTINGS.ROTATION_X;

		//init light
		this.ambientLight = new THREE.AmbientLight(0xA2C2E9, 3.2);
		this.sceneManager.scene.add(this.ambientLight);

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

		this.sceneManager.setExternalFunction(() => this.fixedUpdate());
	}

	/**
     * Initializes the game environment with given data.
     * @param {Object} data - The data used to set up the game environment.
     */
	initGameEnvironment(data)
	{
		if (this.isSceneCreated == false)
		{
			try {
				this.setupScene();
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
				this.background = new Background(this.sceneManager.scene, this.bounds.xMax * 2, this.bounds.yMax * 2);
				this.handleScoreSprites(scores_data);
				this.lastScore = scores_data;

				this.sceneManager.scene.add(this.ball.mesh);

				this.isSceneCreated = true;
			} catch (error) {
				console.error("An error occurred during game initialization:", error);
			}
		}
	}

	/**
     * Initializes the score system for the game scene.
     */
	handleScoreSprites(scores) {
		try {
		  if (!this.scoreSpritesInitialized) {
			this.createTextSprite(`${scores.player1}`).then((sprite) => {
			  this.player1ScoreSprite = sprite;
			  this.player1ScoreSprite.position.set(-10, 18, 0);
			  this.sceneManager.scene.add(this.player1ScoreSprite);
			}).catch((error) => console.error("Failed to create Player 1 sprite:", error));

			this.createTextSprite(`${scores.player2}`).then((sprite) => {
			  this.player2ScoreSprite = sprite;
			  this.player2ScoreSprite.position.set(10, 18, 0);
			  this.sceneManager.scene.add(this.player2ScoreSprite);
			}).catch((error) => console.error("Failed to create Player 2 sprite:", error));

			this.scoreSpritesInitialized = true;
		  } else {
			if (this.player1ScoreSprite) {
			  this.updateSpriteTexture(this.player1ScoreSprite, `${scores.player1}`);
			} else {
			  console.warn("Player 1 score sprite is not ready yet");
			}

			if (this.player2ScoreSprite) {
			  this.updateSpriteTexture(this.player2ScoreSprite, `${scores.player2}`);
			} else {
			  console.warn("Player 2 score sprite is not ready yet");
			}
		  }
		} catch (error) {
		  console.error("An error occurred while handling score sprites:", error);
		}
	}

	  /**
     * Initializes the sprites for the score
	 * * @param {string} text - The value of the score
     */
	createTextSprite(text) {
		return new Promise((resolve, reject) => {
		  const canvas = document.createElement('canvas');
		  const context = canvas.getContext('2d');

		  canvas.width = 256;
		  canvas.height = 150;

		  document.fonts.load('150px "Press Start 2P"').then(() => {
			context.font = '150px "Press Start 2P"';
			context.fillStyle = 'white';
			context.textAlign = 'center';
			context.textBaseline = 'middle';
			context.fillText(text, canvas.width / 2, canvas.height / 2);

			const texture = new THREE.CanvasTexture(canvas);
			const material = new THREE.SpriteMaterial({ map: texture });
			const sprite = new THREE.Sprite(material);
			sprite.scale.set(5, 2.5, 1);

			resolve(sprite);
		  }).catch((error) => {
			console.error('Failed to load font:', error);
			reject(error);
		  });
		});
	}

	/**
     * Sets up the game scene with the loaded room model.
     */
	setupScene()
	{
		if (this.sceneManager.is42BadPc === false)
		{
			const room = this.sceneManager.modelManager.getModel('Scene', true);

			room.scene.scale.set(10, 10, 10);
			room.scene.position.set(800, -134, 191);
			room.scene.rotation.y = -Math.PI / 2;

			this.sceneManager.scene.add(room.scene);
		}
	}

	/**
	 * Aggiorna il contenuto dell'elemento DOM del timer.
	 * @param {number} timeLeft - Il tempo rimanente (in secondi) da mostrare.
	 */
	updateClockDisplay(timeLeft)
	{
		const clockText = document.getElementById('PongClockText');

		if (clockText)
		{
			clockText.textContent = timeLeft;
		}
	}

	/**
     * Updates the game state with new data.
     * @param {Object} data - The game state data.
     */
	updateGameState(data)
	{
		try
		{
			if (this.isClockVisible == false)
			{
				document.getElementById('pongCountDown').classList.remove('d-none');
				this.isClockVisible = true;
			}

			if(data.count_down < this.lastCountValue)
			{
				this.lastCountValue = data.count_down;
				this.updateClockDisplay(data.count_down);

				if (data.count_down == 0)
					document.getElementById('pongCountDown').classList.add('d-none');
			}

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
				this.handleScoreSprites(data.scores);
			}
		}
		catch (error) {
			console.error("An error occurred during game update state:", error);
			console.error("data:", data);
		}
	}

	 /**
     * Updates the sprites for the score
	 * * @param {string} text - The value of the score
     */
	updateSpriteTexture(sprite, text)
	{
		if (!sprite || !sprite.material || !sprite.material.map) {
		  console.warn("Sprite or texture is not defined yet.");
		  return;
		}

		const texture = sprite.material.map;
		const canvas = texture.image;
		const context = canvas.getContext('2d');

		if (!context) {
		  console.error("Failed to get 2D context from canvas.");
		  return;
		}

		context.clearRect(0, 0, canvas.width, canvas.height);

		if (document.fonts.check('150px "Press Start 2P"')) {
		  this.drawTextOnCanvas(context, canvas, text, texture);
		} else {
		  document.fonts.load('150px "Press Start 2P"').then(() => {
			this.drawTextOnCanvas(context, canvas, text, texture);
		  }).catch((error) => {
			console.error('Failed to load font:', error);
		  });
		}
	}

	drawTextOnCanvas(context, canvas, text, texture)
	{
		context.font = '150px "Press Start 2P"';
		context.fillStyle = 'white';
		context.textAlign = 'center';
		context.textBaseline = 'middle';
		context.fillText(text, canvas.width / 2, canvas.height / 2);

		texture.needsUpdate = true;
	}

	/**
	 * Adds a new player to the lobby, initializing either the client player or the opponent.
	 *
	 * @param {string} newPlayer_id - The unique identifier of the new player joining the lobby.
	 * @param {Object} playerData - The data associated with the player, including attributes and settings.
	 * @param {Object} socket - The socket connection for the player (only used for the client player).
	 *
	 */
	AddUserToLobby(newPlayer_id, playerData, socket)
	{
		if (newPlayer_id == this.player_id && this.pongPlayer == null)
		{
			this.pongPlayer = new PongPlayer(socket, this.player_id, playerData);
			this.sceneManager.scene.add(this.pongPlayer.paddle.mesh);
		}
		else if (this.pongOpponent == null)
		{
			this.pongOpponent = new PongPlayer(null, newPlayer_id, playerData);
			this.sceneManager.scene.add(this.pongOpponent.paddle.mesh);
		}
	}

	/**
     * Fixed update loop for synchronizing game objects.
     */
	fixedUpdate()
	{
		if (this.pongPlayer == null || this.pongOpponent == null || this.ball == null)
			return;

		this.pongPlayer.syncPosition();
		this.pongOpponent.syncPosition();
		this.ball.syncPosition();
	}

	game_ended(isGamefinished, pathToRedirect)
	{
		this.mode.dispose(isGamefinished, this.player_id);

		document.getElementById('pongCountDown').classList.add('d-none');
		router.setupEventListeners();
		
		if (this.sceneManager) 
		{
			this.sceneManager.dispose();
			this.sceneManager = null;
		}

		this.ball = null;
		this.pongPlayer = null;
		this.pongOpponent = null;

		this.cleanupWindowClose();

		router.navigateTo(pathToRedirect);
	}

	reset()
	{
		if (this.ball != null)
			this.ball.setPosition(0,0);
		if (this.sceneManager != null)
		{
			if (this.pongPlayer != null)
			{
				this.pongPlayer.deletePaddle(this.sceneManager.scene);
				delete this.pongPlayer;
				this.pongPlayer = null;
			}
			if (this.pongOpponent != null)
			{
				this.pongOpponent.deletePaddle(this.sceneManager.scene);
				delete this.pongOpponent;
				this.pongOpponent = null;
			}
		}
		document.getElementById('pongCountDown').classList.add('d-none');
		this.lastCountValue = 6;
		this.isClockVisible = false;
		this.handleScoreSprites({"player1": 0, "player2": 0});
	}
}