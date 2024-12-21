import * as THREE from '../../lib/threejs/src/Three.js';
import SceneManager from '../../common_static/js/SceneManager.js';
import Bounds from './Scritps/Bounds.js';
import Ball from './Scritps/Class/Ball.js';
import PongPlayer from './Scritps/Class/PongPlayer.js';
import Paddle from './Scritps/Class/Paddle.js';
import Background from './Scritps/Class/Background.js';
import SocketManager from '../../common_static/js/SocketManager.js';

const CAMERA_SETTINGS = {
	FOV: 75,
	NEAR_PLANE: 0.1,
	FAR_PLANE: 1500,
	POSITION: new THREE.Vector3(0, -20, 40),
	ROTATION_X: Math.PI / 6,
};

class Game {
	constructor() {
		this.sceneManager = null;

		// Lights
		this.ambientLight = null;
		this.directionalLight = null;

		// Game entities
		this.bounds = null;
		this.pongPlayer = null;
		this.pongOpponent = null;
		this.ball = null;
		this.background = null;
		this.player_id = null;

		// Networking
		this.gameSocket = null;
	}

	init() 
	{
		this.initializeSceneManager();
		const isSinglePlayer = SocketManager.getModeFromPath() === 'singleplayer';
		isSinglePlayer ? this.initSinglePlayer() : this.setupMultiplayerUI();
	}

	initializeSceneManager() {
		this.sceneManager = new SceneManager(true);
		Object.assign(this.sceneManager, CAMERA_SETTINGS);
		this.sceneManager.initialize();
	}

	setupMultiplayerUI() {
		const matchmakingButton = document.getElementById('startMatchmaking');
		if (matchmakingButton) 
			matchmakingButton.addEventListener('click', () => this.startMatchmaking());
	}

	startMatchmaking() 
	{
		this.gameSocket = new SocketManager();
		this.gameSocket.initWebSocket(
			'multiplayer/pong/matchmaking',
			this.handleMatchmakingSocketMessage.bind(this)
		);
		this.gameSocket.socket.onopen = () => {
			this.gameSocket.send(JSON.stringify({ action: 'join_matchmaking' }));
		};
	}

	handleMatchmakingSocketMessage(event) 
	{
		try 
		{
			const data = JSON.parse(event.data);
			if (data.type === 'setup_pong_lobby')
				this.setupMultiplayerPongSocket(data);
			else 
				console.log('Unhandled matchmaking event type.' + data.type);
		} 
		catch (error) {
			console.error('Error processing matchmaking WebSocket message:', error);
		}
	}

	async setupMultiplayerPongSocket(data) 
	{
		document.getElementById('pong-container')?.remove();
		
		const response = await fetch("/api/profile?include=id");
		const json_response = await response.json();
		this.player_id = json_response["id"];

		this.gameSocket.close();
		delete this.gameSocket;
		this.gameSocket = new SocketManager();
		this.gameSocket.initGameWebSocket(
			'pong',
			this.handleGameSocketMessage.bind(this),
			data.room_name
		);


		this.gameSocket.socket.onopen = () => {
			this.gameSocket.send(JSON.stringify({ 
				type: 'init_player', 
				player_id: this.player_id
			}));
		};
		
		this.initGameEnvironment();
	}

	initSinglePlayer() {
		this.gameSocket = new SocketManager();
		this.gameSocket.initGameWebSocket(
			'pong',
			this.handleGameSocketMessage.bind(this),
			''
		);
		this.initGameEnvironment();
	}

	initGameEnvironment() {
		this.configureCamera();
		this.initializeScene();
		this.sceneManager.setExternalFunction(() => this.fixedUpdate());
	}

	configureCamera() {
		this.sceneManager.camera.position.copy(CAMERA_SETTINGS.POSITION);
		this.sceneManager.camera.rotation.x = CAMERA_SETTINGS.ROTATION_X;
	}

	initializeScene() {
		this.sceneManager.initModelLoader();
		// this.sceneManager.initAudioVar();
		// this.sceneManager.playAudio('/static/pong_static/assets/audio/SceneAudio.mp3');
		this.initializeLights();
		this.initPaddles();
		this.loadModels();
	}

	initializeLights() {
		this.ambientLight = new THREE.AmbientLight(0xb0e0e6, 0.9);
		this.directionalLight = new THREE.DirectionalLight(0xffffff, 2);
		this.directionalLight.position.set(0, 32, 64);

		this.sceneManager.scene.add(this.ambientLight);
		this.sceneManager.scene.add(this.directionalLight);
	}

	initPaddles() {
		this.pongOpponent = new Paddle(0.7, 4, 1.2, 0xffffff);
	}

	loadModels() {
		this.sceneManager.loadModel({ '/static/pong_static/assets/models/Scene.glb': 'room' })
			.then(() => this.setupScene());
	}

	setupScene() {
		const room = this.sceneManager.modelsLoaded['room'];
		room.scene.scale.set(10, 10, 10);
		room.scene.position.set(800, -134, 191);
		room.scene.rotation.y = -Math.PI / 2;
		this.sceneManager.scene.add(room.scene);
	}

	initGame(data) {
		try {
			const bounds_data = data?.bounds;
			const ball_data = data?.ball;
			const players = data?.players;
	
			if (!bounds_data || !ball_data || !players) {
				console.error("Game data is missing or incomplete:", data);
				return;
			}
	
			this.bounds = new Bounds(bounds_data.xMin, bounds_data.xMax, bounds_data.yMin, bounds_data.yMax);
	
			const playerData = players[this.player_id];
			if (!playerData) {
				console.error(`Player data not found for player ID: ${this.player_id}`);
				return;
			}
			this.pongPlayer = new PongPlayer('KeyW', 'KeyS', this.gameSocket, this.player_id, playerData);
	
			const opponentId = Object.keys(players).find(id => id != this.player_id);
			if (!opponentId) {
				console.error("No opponent found in players data:", players);
				return;
			}

			console.log(`opponent player id is ${opponentId} my id is ${this.player_id}`);

			const opponentData = players[opponentId];
			this.pongOpponent = new PongPlayer(null, null, this.gameSocket, opponentId, opponentData);
	
			this.ball = new Ball(ball_data.radius);
	
			this.background = new Background(this.sceneManager.scene, this.bounds.xMax * 2, this.bounds.yMax * 2);
	
			this.sceneManager.scene.add(this.ball.mesh);
			this.sceneManager.scene.add(this.pongPlayer.paddle.mesh);
			this.sceneManager.scene.add(this.pongOpponent.paddle.mesh);
	
			console.log("Player initialized:", this.pongPlayer);
			console.log("Opponent initialized:", this.pongOpponent);
	
		} catch (error) {
			console.error("An error occurred during game initialization:", error);
		}
	}
	
	updateGameState(data) 
	{
		if (data.ball) 
			this.ball.updatePosition(data.ball);

		if (data.players) {
			Object.values(data.players).forEach(player => {
				if (player.id === this.pongPlayer.playerId) {
					this.pongPlayer.updatePosition(player.y);
				} else if (player.id === this.pongOpponent.playerId) {
					this.pongOpponent.updatePosition(player.y);
				}
			});
		}
	}

	fixedUpdate() {
		if (!this.pongPlayer || !this.pongOpponent) return;

		this.pongPlayer.syncPosition();
		this.pongOpponent.syncPosition();
		this.ball.syncPosition();
	}

	handleGameSocketMessage(event) {
		try {
			const data = JSON.parse(event.data);
			console.log(data);
			switch (data.lobby.current_lobby_status) 
			{
				case 'READY':
					this.initGame(data.lobby);
					break;
				case 'PLAYING':
					this.updateGameState(data.lobby);
					break;
				default:
					console.log('Unhandled game socket event type' + data.lobby.current_lobby_status);
			}
		} catch (error) {
			console.error('Error processing game WebSocket message:', error);
		}
	}
}

const game = new Game();
game.init();
game.sceneManager.animate();
