import * as THREE from '../../lib/threejs/src/Three.js';
import SceneManager from '../../common_static/js/SceneManager.js';
import Bounds from './Scritps/Bounds.js';
import Ball from './Scritps/Class/Ball.js';
import PongPlayer from './Scritps/Class/PongPlayer.js';
import Paddle from './Scritps/Class/Paddle.js';
import Background from './Scritps/Class/Background.js';
import SocketManager from '../../common_static/js/SocketManager.js';
import MatchmakingManager from  '../../common_static/js/MatchmakingManager.js';

const CAMERA_SETTINGS = {
	FOV: 75,
	NEAR_PLANE: 0.1,
	FAR_PLANE: 1500,
	POSITION: new THREE.Vector3(0, -20, 40),
	ROTATION_X: Math.PI / 6,
};

class Game 
{
	constructor() {

		//manager
		this.sceneManager = null;
		this.matchmakingManager = null;

		// Lights
		this.ambientLight = null;
		this.pointLightMagenta = null;
		this.pointLightBlue = undefined;
		this.lightHelper = undefined;
		this.screenLight = null;

		// Game entities
		this.bounds = null;
		this.pongPlayer = null;
		this.pongOpponent = null;
		this.ball = null;
		this.background = null;
		this.player_id = null;

		// socket
		this.gameSocket = null;
		
		window.onbeforeunload = function(){
			this.onGameExit();
			return 'Are you sure you want to leave?';
		};

		history.pushState(null, document.title, location.href);
		window.addEventListener('popstate', function (event)
		{
			const leavePage = confirm("you want to go ahead ?");
			if (leavePage) 
			{
				this.onGameExit();
				history.back(); 
			} 
			else 
			{
				history.pushState(null, document.title, location.href);
			}  
		});
	}
	
	onGameExit()
	{
		if (this.gameSocket != null)
		{
			this.gameSocket.send(JSON.stringify({
				type: 'quitting lobby',
				player_id: this.player_id
			}))
		}
	}

	onSocketOpen() 
	{
		this.gameSocket.send(JSON.stringify({ 
			type: 'init_player', 
			player_id: this.player_id
		}));
	}

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

	async init() 
	{
		this.sceneManager = new SceneManager(true);
		Object.assign(this.sceneManager, CAMERA_SETTINGS);
		this.sceneManager.initialize(true, true);
		
		await this.setPlayerId();
		await this.sceneManager.modelManager.loadModel({ '/static/pong_static/assets/models/Scene.glb': 'Scene' });
		
		this.configureCamera();
		this.initializeLights();

		if (SocketManager.getModeFromPath() === 'singleplayer')
			this.setupSinglePlayerSocket();
		else
			this.matchmakingManager = new MatchmakingManager("pong", this.setupMultiplayerPongSocket.bind(this));

		this.sceneManager.setExternalFunction(() => this.fixedUpdate());
	}

	setupMultiplayerPongSocket(data) 
	{
		this.gameSocket = new SocketManager();
		
		this.gameSocket.initGameWebSocket(
			'pong',
			this.handleGameSocketMessage.bind(this),
			data.room_name,
			this.onSocketOpen.bind(this)
		);
	}

	setupSinglePlayerSocket() 
	{
		this.gameSocket = new SocketManager();

		this.gameSocket.initWebSocket(
			'singleplayer/pong/',
			this.handleGameSocketMessage.bind(this),
			this.onSocketOpen.bind(this)
		);
	}

	configureCamera() 
	{
		this.sceneManager.camera.position.copy(CAMERA_SETTINGS.POSITION);
		this.sceneManager.camera.rotation.x = CAMERA_SETTINGS.ROTATION_X;
	}

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

	setupScene() 
	{
		const room = this.sceneManager.modelManager.getModel('Scene');

		room.scene.scale.set(10, 10, 10);
		room.scene.position.set(800, -134, 191);
		room.scene.rotation.y = -Math.PI / 2;

		this.sceneManager.scene.add(room.scene);
	}
	
	updateGameState(data) 
	{
		if (data.ball) 
			this.ball.updatePosition(data.ball);
		
		if (data.players) 
		{
			this.pongPlayer.updatePosition(data.players[this.pongPlayer.playerId].y);
			this.pongOpponent.updatePosition(data.players[this.pongOpponent.playerId].y);
		}
	}
	
	fixedUpdate() 
	{
		if (this.pongPlayer == null || this.pongOpponent == null) return;
		
		this.pongPlayer.syncPosition();
		this.pongOpponent.syncPosition();
		this.ball.syncPosition();
	}
	
	/**
	 * Adds a user to the lobby by cloning the human model and updating the scene.
	 * @param {Object} data - Data about the joining player.
	*/
	AddUserToLobby(newPlayer_id, playerData) 
	{
		if (newPlayer_id == this.player_id)
		{
			if (this.pongPlayer != null)
			{
				console.log("client player already init");
				return;
			}
			this.pongPlayer = new PongPlayer('KeyW', 'KeyS', this.gameSocket, this.player_id, playerData);
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
			this.pongOpponent = new PongPlayer(null, null, null, newPlayer_id, playerData);
			this.sceneManager.scene.add(this.pongOpponent.paddle.mesh);
			console.log("new player initialized:", this.pongOpponent);
		}
	}

	initGameEnvironment(data)
	{
		try {
			this.setupScene();
			
			const bounds_data = data?.lobby_info?.bounds;
			const ball_data = data?.lobby_info?.ball;
	
			if (!bounds_data || !ball_data) {
				console.error("Game data is missing or incomplete:");
				return;
			}
	
			this.bounds = new Bounds(bounds_data.xMin, bounds_data.xMax, bounds_data.yMin, bounds_data.yMax);
			this.ball = new Ball(ball_data.radius);
			this.background = new Background(this.sceneManager.scene, this.bounds.xMax * 2, this.bounds.yMax * 2);
			
			this.sceneManager.scene.add(this.ball.mesh);
			console.log("bound, ball and dbackground are initialized");
		} catch (error) {
			console.error("An error occurred during game initialization:", error);
		}
	}

	/**
	 * Sets up the lobby based on socket data.
	 * @param {Object} data - Socket data about the lobby event.
	 */
	setUpLobby(data) 
	{
		if (this.bounds == null) this.initGameEnvironment(data);

		if (this.pongOpponent != null && this.pongPlayer != null)
			this.gameSocket.send(JSON.stringify({ type: 'lobby setuped' }));
		else
		{
			if (data.event_info.event_name === "recover_player_data")
			{
				const players = data.lobby_info.players;
	
				for (const [key, value] of Object.entries(players)) 
				{
					if (this.pongPlayer != null && this.pongPlayer.playerId == parseInt(key))
						continue;
					this.AddUserToLobby(key,value);
				}
			}
			
			if (data.event_info.event_name === "player_join")
			{
				const newPlayerId = data.event_info.player_id;
				const playerData = data.lobby_info.players[data.event_info.player_id];
				this.AddUserToLobby(newPlayerId, playerData);
			}
		}
	}

	handleGameSocketMessage(event) 
	{
		try {
			const data = JSON.parse(event.data);
			// console.log("data:", data);
			switch (data.lobby_info.current_lobby_status) 
			{
				case 'TO_SETUP':
					this.setUpLobby(data);
					break;
				case 'PLAYING':
					this.updateGameState(data.lobby_info)
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
			console.log("error data: ", data);
		}
	}
}

const game = new Game();
await game.init();
game.sceneManager.animate();
