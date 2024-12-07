import * as THREE from '../../lib/threejs/src/Three.js';

import SceneManager from '../../common_static/js/SceneManager.js';
import Bounds from './Scritps/Bounds.js';
import Ball from './Scritps/Class/Ball.js';
import PongPlayer from './Scritps/Class/PongPlayer.js';
import PongEnemy from './Scritps/Class/PongAI.js';
import Paddle from './Scritps/Class/Paddle.js';
import Background from './Scritps/Class/Background.js';
import GameSocketManager from '../../common_static/js/GameSocketManager.js';

const CAMERA_SETTINGS = {
    FOV: 75,
    NEAR_PLANE: 0.1,
    FAR_PLANE: 1500,
	POSITION : new THREE.Vector3(0, -20, 40),
    ROTATION_X: Math.PI / 6,
};

class Game {
	constructor() {

		//light 
		this.ambientLight = undefined;
		this.directionalLight = undefined;
		
		//game var
		this.bounds = undefined;
		this.pongPlayer = undefined;
		this.ball = undefined;
		this.pongAi = undefined;
		
		this.gameSocket = undefined;

		this.initGameEnviroment();
	}

	initGameEnviroment()
	{
		//init Threejs
		this.sceneManager = new SceneManager(true);

		//Camera setting
		this.sceneManager.fov = CAMERA_SETTINGS.FOV;
		this.sceneManager.nearPlane = CAMERA_SETTINGS.NEAR_PLANE;
		this.sceneManager.farPlane = CAMERA_SETTINGS.FAR_PLANE;
		
		this.sceneManager.initialize();

		//Camera trasform
		this.sceneManager.camera.position.copy(CAMERA_SETTINGS.POSITION);
		this.sceneManager.camera.rotation.x = CAMERA_SETTINGS.ROTATION_X;

		//init WebSocket
		this.gameSocket = new GameSocketManager();
		this.gameSocket.initGameWebSocket(
			'pong',
			'/api/singleplayer/pong',
			this.handleSocketMessage.bind(this));
		
		//init scene element
		this.sceneManager.initModelLoader();
		this.sceneManager.initAudioVar();
		this.sceneManager.playAudio("/static/pong_static/assets/audio/SceneAudio.mp3");
		this.initializeLights();
		this.initPaddles();

		//load 3d model
		this.sceneManager.loadModel({
			'/static/pong_static/assets/models/Scene.glb': 'room'
				}).then(() => {
					this.initScene();
				});

		this.sceneManager.setExternalFunction(() => this.fixedUpdate());
	}

	initScene()
	{
		//init and add to scene cabinet room
		const room = this.sceneManager.modelsLoaded["room"];
		room.scene.scale.set(10,10,10);
		room.scene.position.set(800, -134, 191);
		room.scene.rotation.y = Math.PI / -2;
		this.sceneManager.scene.add(room.scene);
	}

	initPaddles()
	{
		if (this.mode == "singleplayer")
			this.pongEnemy = new pongEnemy(this.gameSocket);
		else
			this.pongEnemy = new Paddle(0.7, 4, 1.2, 0xffffff);
	}

	initializeLights() 
	{
		this.ambientLight = new THREE.AmbientLight(0xb0e0e6, 0.9);

		this.directionalLight = new THREE.DirectionalLight(0xffffff, 2);
		this.directionalLight.position.set(0, 32, 64);

		this.sceneManager.scene.add(this.ambientLight);
		this.sceneManager.scene.add(this.directionalLight);
	}

	initLobby(data) {
		this.bounds = new Bounds(data.bounds["xMin"], data.bounds["xMax"], data.bounds["yMin"], data.bounds["yMax"]);
	
		// Configura il giocatore locale
		const playerData = Object.values(data.players).find(player => player.id === data.playerId);
		this.pongPlayer = new PongPlayer('KeyW', 'KeyS', this.gameSocket, data.playerId, playerData);
		// Configura l'avversario
		const opponentId = Object.keys(data.players).find(id => id !== data.playerId);
		const opponentData = data.players[opponentId];
		this.pongOpponent = new PongPlayer(null, null, this.gameSocket, opponentId, opponentData);
	
		this.ball = new Ball(data.ball.radius);
		this.background = new Background(this.sceneManager.scene, this.bounds.xMax * 2, this.bounds.yMax * 2);
	
		// Aggiungi gli elementi alla scena
		this.sceneManager.scene.add(this.ball.mesh);
		this.sceneManager.scene.add(this.pongPlayer.paddle.mesh);
		this.sceneManager.scene.add(this.pongOpponent.paddle.mesh);
	
		// Notifica al server che il giocatore è pronto
		this.gameSocket.send(
			JSON.stringify({
				type: "ready",
				playerId: this.pongPlayer.playerId,
			})
		);
	}
	
    updateGameState(data) {
		if (data.ball) {
			this.ball.newPosX = data.ball.x;
			this.ball.newPosY = data.ball.y;
		}
	
		if (data.players) {
			Object.values(data.players).forEach(player => {
				if (player.id === this.pongPlayer.playerId) {
					this.pongPlayer.newY = player.y;
				} else if (player.id === this.pongOpponent.playerId) {
					this.pongOpponent.newY = player.y;
				}
			});
		}
	}

	fixedUpdate() {
		if (!this.pongPlayer || !this.pongOpponent) return;
	
		// Aggiorna la posizione del giocatore locale
		this.pongPlayer.paddle.mesh.position.y = this.pongPlayer.newY;
	
		// Aggiorna la posizione dell'avversario
		this.pongOpponent.paddle.mesh.position.y = this.pongOpponent.newY;
	
		// Aggiorna la posizione della pallina
		this.ball.mesh.position.x = this.ball.newPosX;
		this.ball.mesh.position.y = this.ball.newPosY;
	}

	handleSocketMessage(event) 
	{
		try 
		{
			const data = JSON.parse(event.data);
			switch (data.type) {
				case 'initLobby':
					this.initLobby(data);
				  	break;
				case 'addPlayerToLobby':
					this.addPlayerToLobby();
					break;
				case 'initGame':
					this.initGame();
				  	break;
				case 'stateUpdate':
					this.updateGameState(data);
					break;
				case 'playerDisconnect':
					this.playerDisconnect();
					break;
				case 'lobbyClosed':
					this.cleanUp();
					break;
				default:
				  console.log(`This type of event is not managed.`);
			}
		}
		catch (error) {
			console.error("Error processing WebSocket message:", error);
		}
	}
}

const game = new Game();
game.sceneManager.animate();