import * as THREE from '../../lib/threejs/src/Three.js';
import LiarsBarPlayer from './utils/LiarsBarPlayer.js';
import SceneManager from '../../common_static/js/SceneManager.js';
import SocketManager from '../../common_static/js/SocketManager.js';


/**
 * Game class for managing the Liar's Bar multiplayer game environment.
 * Handles player setup, scene management, lighting, and WebSocket communication.
 */
class Game 
{
	constructor() {
		this.ambientLight = null;
		this.pointLight = null;
		this.lightHelper = null;
		this.gameSocket = null;
		this.players = {};
	}

	/**
	 * Fetches the player's ID by calling the profile API.
	 * @todo Move this API call to `view.js` for better separation of concerns.
	 * @returns {Promise<void>}
	 */
	async setPlayerId() 
	{
		try
		{
			const response = await fetch("/api/profile?include=id");
			const json_response = await response.json();
			this.player_id = json_response["id"];
		}
		catch (error) {
			console.error("Error when call profile api :", error);
		}
	}

	/**
	 * Sets up the WebSocket connection for the multiplayer Liar's Bar game.
	 * @todo Implement matchmaking to dynamically assign room names.
	 * @returns {Promise<void>}
	 */
	async setupMultiplayerLiarsBarSocket() 
	{
		this.gameSocket = new SocketManager();

		const onOpen = () => {
			this.gameSocket.send(JSON.stringify({ 
				type: 'init_player', 
				player_id: this.player_id
			}));
		}

		this.gameSocket.initGameWebSocket(
			'liarsbar',
			this.handleSocketMessage.bind(this),
			'test',
			onOpen
		);
	}

	/**
	 * Initializes the game environment, including the scene, lighting, and models.
	 * @returns {Promise<void>}
	 */
	async initGameEnviroment() 
	{
		this.sceneManager = new SceneManager(true);
		this.sceneManager.initialize(true, true);

		this.sceneManager.setCameraState(
			new THREE.Vector3(-34.619, 96.642, 233.726),
			new THREE.Quaternion(-0.188, 0.223, 0, 0.95),
			new THREE.Vector3(-173.113, -31.705, -47.019)
		);

		this.initLights();

		await this.sceneManager.modelManager.loadModel({
			'/static/liarsbar_static/assets/liarsbar/LobbyScene2.glb': 'LobbyScene',
			'/static/liarsbar_static/assets/liarsbar/human.glb': 'human'
		});

		this.initLobbyScene();

		this.sceneManager.setExternalFunction(() => this.fixedUpdate());
	}

	/**
	 * Initializes the game by setting up the player, environment, and multiplayer socket.
	 * @returns {Promise<void>}
	 */
	async init() 
	{
		await this.setPlayerId();
		await this.initGameEnviroment();
		await this.setupMultiplayerLiarsBarSocket();
	}

	/**
	 * Sets up the lighting in the game scene.
	 */
	initLights() 
	{
		this.ambientLight = new THREE.AmbientLight(0xb0e0e6, 10.1);

		this.pointLight = new THREE.SpotLight(0xFFB84D, 850000, 500);
		this.pointLight.position.set(0, 300, -250);
		this.pointLight.target.position.set(0, -1000, 0);

		this.pointLight.castShadow = true;
		this.pointLight.shadow.camera.near = 1;
		this.pointLight.shadow.camera.far = 500;
		this.pointLight.shadow.camera.left = -200;
		this.pointLight.shadow.camera.right = 200;
		this.pointLight.shadow.camera.top = 200;
		this.pointLight.shadow.camera.bottom = -200;
		this.pointLight.shadow.mapSize.set(1024, 1024);
		this.pointLight.shadow.normalBias = 0.1;
		this.pointLight.shadow.bias = -0.0001;

		this.sceneManager.scene.add(this.ambientLight);
		this.sceneManager.scene.add(this.pointLight);
	}

	/**
	 * Initializes the lobby scene by adding the LobbyScene model to the game.
	 */
	initLobbyScene() 
	{
		const LobbyScene = this.sceneManager.modelManager.getModel("LobbyScene");
		LobbyScene.scene.scale.set(9, 9, 9);
		LobbyScene.scene.rotation.y = 90;
		LobbyScene.scene.position.set(230, 0, 0);

		this.sceneManager.scene.add(LobbyScene.scene);
	}

	/**
	 * Adds a user to the lobby by cloning the human model and updating the scene.
	 * @param {Object} data - Data about the joining player.
	 */
	AddUserToLobby(data) 
	{
		const userLobbyModel = this.sceneManager.modelManager.getClone("human");
		userLobbyModel.scale.set(0.2, 0.2, 0.2);
		userLobbyModel.rotation.y = Math.PI / 8;
		userLobbyModel.position.set((Object.keys(this.players).length + 1) * 50, -20, 10);
		
		this.sceneManager.scene.add(userLobbyModel);
		
		const joinedPlayerId = data.event_info.player_id;
		this.players[joinedPlayerId] = new LiarsBarPlayer(joinedPlayerId);
		if (Object.keys(this.players).length === 4) 
			this.gameSocket.send(JSON.stringify({ type: 'lobby setuped' }));
	}

	/**
	 * Updates the game state at fixed intervals.
	 */
	fixedUpdate() {}

	/**
	 * Sets up the lobby based on socket data.
	 * @param {Object} data - Socket data about the lobby event.
	 */
	setUpLobby(data) 
	{
		if (data.event_info.event_name === "player_join") 
			this.AddUserToLobby(data);
	}

	/**
	 * Handles incoming WebSocket messages.
	 * @param {MessageEvent} event - The WebSocket message event.
	 */
	handleSocketMessage(event) 
	{
		try {
			const data = JSON.parse(event.data);
			switch (data.lobby_info.current_lobby_status) 
			{
				case 'TO_SETUP':
					this.setUpLobby(data);
					break;
				case 'PLAYING':
					break;
				case 'ENDED':
					break;
				case 'WAITING_PLAYER_RECONNECTION':
					break;
				default:
					console.log('Unhandled game socket event type ' + data.lobby.current_lobby_status);
			}
		} catch (error) {
			console.error("Error processing WebSocket message:", error);
		}
	}
}

// Initialize and start the game
const game = new Game();
await game.init();
game.sceneManager.animate();
