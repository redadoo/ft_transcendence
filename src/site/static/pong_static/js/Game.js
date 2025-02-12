import SinglePlayerPongMode from './utils/pongMode/SinglePlayerPongMode.js';
import MultiplayerPongMode from './utils/pongMode/MultiplayerPongMode.js';
import PrivateLobbyPongMode from './utils/pongMode/PrivateLobbyPongMode.js';
import TournamentPongMode from './utils/pongMode/TournamentPongMode.js';

import * as THREE from '../../lib/threejs/src/Three.js';
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

		this.ambientLight = null;
		this.pointLightMagenta = null;
		this.pointLightBlue = null;
		this.lightHelper = null;
		this.screenLight = null;

		// Game entities
		this.bounds = null;
		this.pongPlayer = null;
		this.pongOpponent = null;
		this.ball = null;
		this.background = null;

		this.isSceneCreated = false;

		this.manageWindowClose();
	}

	/**
     * Handles the event of closing or navigating away from the game window.
     * Ensures that the game socket is closed properly before leaving.
     */
	manageWindowClose()
	{
		history.pushState(null, document.title, location.href);
		window.addEventListener('popstate', (event) => {
			const leavePage = confirm("Do you want to leave?");
			if (leavePage)
			{
				if (this.mode.socket != null)
				{
					this.mode.socket.send(JSON.stringify({
						type: 'quit_game',
						player_id: this.player_id
					}))
					this.mode.socket.close();
				}
				this.sceneManager.dispose();
				window.location.href = "/";
				console.log("Leaving the game...");
			}
			else
			{
				history.pushState(null, document.title, location.href);
			}
		});
	}

    /**
     * Fetches and sets the player's ID from the server.
     */
	async setPlayerId()
	{
		try
		{
			const response = await fetch("/api/profile?include=id");
			const json_response = await response.json();
			this.player_id = json_response["id"];
		} catch (error){
			console.error("An error occurred when call profile api: ", error);
		}
	}

	/**
     * Initializes the game scene, mode, and environment.
     */
	async init()
	{
		await this.setPlayerId();

		//init scene
		this.sceneManager = new SceneManager(true);
		Object.assign(this.sceneManager, CAMERA_SETTINGS);
		this.sceneManager.initialize(true, true);

		await this.sceneManager.modelManager.loadModel({ '/static/pong_static/assets/models/Scene.glb': 'Scene' });

		this.sceneManager.camera.position.copy(CAMERA_SETTINGS.POSITION);
		this.sceneManager.camera.rotation.x = CAMERA_SETTINGS.ROTATION_X;

		this.initializeLights();

		if (!this.player_id)
		{
			console.error("Failed to set player ID. Aborting initialization.");
			return;
		}

		const modeFromPath = SocketManager.getModeFromPath();
		switch (modeFromPath)
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

				if (!bounds_data || !ball_data)
				{
					console.error("Game data is missing or incomplete:", { bounds_data, ball_data });
					return;
				}

				this.bounds = new Bounds(bounds_data.xMin, bounds_data.xMax, bounds_data.yMin, bounds_data.yMax);
				this.ball = new Ball(ball_data.radius);
				this.background = new Background(this.sceneManager.scene, this.bounds.xMax * 2, this.bounds.yMax * 2);

				this.sceneManager.scene.add(this.ball.mesh);
				console.log("bound, ball and dbackground are initialized");
				this.isSceneCreated = true;
			} catch (error) {
				console.error("An error occurred during game initialization:", error);
			}
		}
	}

	/**
     * Initializes the lighting system for the game scene.
     */
	initializeLights()
	{
		this.ambientLight = new THREE.AmbientLight(0xA2C2E9, 0.2);
		this.pointLightMagenta = new THREE.SpotLight(0xD56BE3, 600000, 600);
		this.pointLightMagenta.position.set(100, 300, 300);
		this.pointLightMagenta.target.position.set(0, -1000, 0);

		this.pointLightMagenta.castShadow = true;
		this.pointLightMagenta.shadow.camera.near = 1;
		this.pointLightMagenta.shadow.camera.far = 500;
		this.pointLightMagenta.shadow.camera.left = -200;
		this.pointLightMagenta.shadow.camera.right = 200;
		this.pointLightMagenta.shadow.camera.top = 200;
		this.pointLightMagenta.shadow.camera.bottom = -200;
		this.pointLightMagenta.shadow.mapSize.width = 2048;
		this.pointLightMagenta.shadow.mapSize.height = 2048;

		this.pointLightMagenta.shadow.mapSize.set(512 * 2, 512 * 2);
		this.pointLightMagenta.shadow.normalBias = 0.1;
		this.pointLightMagenta.shadow.bias = -0.0001;

		this.pointLightBlue = new THREE.SpotLight(0x3D84FF, 600000, 600);
		this.pointLightBlue.position.set(-100, 300, 300);
		this.pointLightBlue.target.position.set(0, -1000, 0);

		this.pointLightBlue.castShadow = true;
		this.pointLightBlue.shadow.camera.near = 1;
		this.pointLightBlue.shadow.camera.far = 500;
		this.pointLightBlue.shadow.camera.left = -200;
		this.pointLightBlue.shadow.camera.right = 200;
		this.pointLightBlue.shadow.camera.top = 200;
		this.pointLightBlue.shadow.camera.bottom = -200;
		this.pointLightBlue.shadow.mapSize.width = 2048;
		this.pointLightBlue.shadow.mapSize.height = 2048;

		this.pointLightBlue.shadow.mapSize.set(512 * 2, 512 * 2);
		this.pointLightBlue.shadow.normalBias = 0.1;
		this.pointLightBlue.shadow.bias = -0.0001;


		this.screenLight = new THREE.PointLight(0xffffff, 1000, 500);
		this.screenLight.position.set(0, 28, 1);

		this.sceneManager.scene.add(this.ambientLight);
		this.sceneManager.scene.add(this.pointLightMagenta);
		this.sceneManager.scene.add(this.pointLightBlue);
		this.sceneManager.scene.add(this.screenLight);

		// this.lightHelperMagenta = new THREE.SpotLightHelper(this.pointLightMagenta, 1);
		// this.lightHelperBlue = new THREE.SpotLightHelper(this.pointLightBlue, 1);
		this.lightHelper = new THREE.PointLightHelper(this.screenLight, 5);

		// this.sceneManager.scene.add(this.lightHelperMagenta);
		// this.sceneManager.scene.add(this.lightHelperBlue);
		this.sceneManager.scene.add(this.lightHelper);
	}

	/**
     * Sets up the game scene with the loaded room model.
     */
	setupScene()
	{
		const room = this.sceneManager.modelManager.getModel('Scene');

		room.scene.scale.set(10, 10, 10);
		room.scene.position.set(800, -134, 191);
		room.scene.rotation.y = -Math.PI / 2;

		this.sceneManager.scene.add(room.scene);
	}

	/**
     * Updates the game state with new data.
     * @param {Object} data - The game state data.
     */
	updateGameState(data)
	{
		try
		{
			if (data.ball)
				this.ball.updatePosition(data.ball);

			if (data.players)
			{
				this.pongPlayer.updatePosition(data.players[this.pongPlayer.playerId].y);
				this.pongOpponent.updatePosition(data.players[this.pongOpponent.playerId].y);
			}
		}
		catch (error) {
			console.error("An error occurred during game update state:", error);
			console.error("data:", data);
		}
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
		if (newPlayer_id == this.player_id)
		{
			if (this.pongPlayer != null)
			{
				console.log("client player already init");
				return;
			}
			this.pongPlayer = new PongPlayer(socket, this.player_id, playerData);
			this.sceneManager.scene.add(this.pongPlayer.paddle.mesh);
			console.log("player initialized:", this.pongPlayer);
		}
		else
		{
			if (this.pongOpponent != null)
			{
				console.log("opponent player already init");
				return;
			}
			this.pongOpponent = new PongPlayer(null, newPlayer_id, playerData);
			this.sceneManager.scene.add(this.pongOpponent.paddle.mesh);
			console.log("new player initialized:", this.pongOpponent);
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

	game_ended()
	{
		this.mode.socket.send(JSON.stringify({
			type: 'quit_game',
			player_id: this.player_id
		}));
		
		this.mode.socket.close();
		this.sceneManager.dispose();
		
		delete this.sceneManager;
		delete this.pongPlayer;
		delete this.pongOpponent;
		delete this.ball;

		this.ball = null;
		this.pongPlayer = null;
		this.pongOpponent = null;
		
		router.navigateTo('/match-result');
	}
}