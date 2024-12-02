import * as THREE from '../../lib/threejs/src/Three.js';
import { FontLoader } from '../../lib/threejs/examples/jsm/loaders/FontLoader.js';
import { GLTFLoader } from '../../lib/threejs/examples/jsm/loaders/GLTFLoader.js';

import SceneManager from '../../common_static/js/SceneManager.js';
import Bounds from './Scritps/Bounds.js';
import Ball from './Scritps/Class/Ball.js';
import PongPlayer from './Scritps/Class/PongPlayer.js';
import PongEnemy from './Scritps/Class/PongAI.js';
import Paddle from './Scritps/Class/Paddle.js';
import Background from './Scritps/Class/Background.js';

const CAMERA_SETTINGS = {
    FOV: 75,
    NEAR_PLANE: 0.1,
    FAR_PLANE: 1500,
    POSITION: { x: 0, y: -20, z: 40 },
    ROTATION_X: Math.PI / 6,
};

class Game {
	constructor() {

		//init var 
		this.ambientLight = undefined;
		this.directionalLight = undefined;
		this.bounds = undefined;
		this.pongPlayer = undefined;
		this.ball = undefined;
		this.pongAi = undefined;
		this.gameSocket = undefined;

		this.loadingPromises = [];
		this.modelsLoaded = {};

		//init Threejs
		this.sceneManager = new SceneManager(true);
		this.gltfLoader = new GLTFLoader();
		this.audioLoader = new THREE.AudioLoader();
		this.listener = new THREE.AudioListener();

		//Camera setting
		this.sceneManager.fov = CAMERA_SETTINGS.FOV;
		this.sceneManager.nearPlane = CAMERA_SETTINGS.nearPlane;
		this.sceneManager.farPlane = CAMERA_SETTINGS.farPlane;
		
		this.sceneManager.initialize();

		//Camera trasform
		this.sceneManager.camera.position.set(
			CAMERA_SETTINGS.POSITION.x,
			CAMERA_SETTINGS.POSITION.y,
			CAMERA_SETTINGS.POSITION.z);
		this.sceneManager.camera.rotation.x = CAMERA_SETTINGS.ROTATION_X;

		//init WebSocket
		this.initWebSocket();
		
		//init scene
		this.initScoreFont();
		this.initializeLights();
		this.initPaddles();
		this.initAudio();
		
		this.preload3DModels().then(() => {
			this.initScene();
		});

		this.sceneManager.setExternalFunction(() => this.fixedUpdate());
	}
	
	async initWebSocket() {
		const pathSegments = window.location.pathname.split('/').filter(Boolean);
		const mode = pathSegments[0];
		
		try {
			const roomName = await this.getRoomInfo();
			this.connectionString = `ws://${window.location.host}/ws/${mode}/pong/${roomName}`;
			this.gameSocket = new WebSocket(this.connectionString);

			this.gameSocket.onmessage = this.handleSocketMessage.bind(this);
		} catch (error) {
			console.error('Failed to fetch room info:', error);
		}
	}

	async getRoomInfo() {
		const response = await fetch('/api/singleplayer/pong', {
			method: 'GET',
			headers: {
				'Accept': 'application/json',
				'X-Requested-With': 'XMLHttpRequest'
			},
			credentials: 'include'
		});
		
		console.log(response);
		if (!response.ok) {
			throw new Error(`HTTP error! Status: ${response.status}`);
		}

		const data = await response.json();
		return data.room_name;
	}

	preload3DModels() 
	{
		this.loadingPromises.push(
			this.loadModel('/static/pong_static/assets/models/Scene.glb', 'room')
		);

		return Promise.all(this.loadingPromises);
	}

	initScene()
	{
		//init and add to scene cabinet room
		const room = this.modelsLoaded["room"];
		room.scene.scale.set(10,10,10);
		room.scene.position.set(800, -134, 191);
		room.scene.rotation.y = Math.PI / -2;
		this.sceneManager.scene.add(room.scene);
	}

	loadModel(path, modelName) 
	{
		return new Promise((resolve, reject) => {
			this.gltfLoader.load(
				path,
				(gltfScene) => {
					this.modelsLoaded[modelName] = gltfScene;
					resolve();
				},
				undefined,
				(error) => {
					console.error(`Error loading model ${modelName}:`, error);
					reject(error);
				}
			);
		});
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

	initAudio() {
		this.audioContext = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: 'interactive' });
		THREE.AudioContext.setContext(this.audioContext);
	
		this.audio = new THREE.Audio(this.listener);
		this.sceneManager.camera.add(this.listener);
	
		const loadAndPlayAudio = () => {
			this.audioLoader.load("/static/pong_static/assets/audio/SceneAudio.mp3", (buffer) => {
				if (buffer) {
					this.audio.setBuffer(buffer);
					this.audio.setLoop(true);
					this.audio.setVolume(1.0);
					this.audio.play();
					console.log("Audio playback started.");
				} else {
					console.error("Audio buffer not loaded.");
				}
			});
		};
	
		const resumeAudioContext = () => {
			if (this.audioContext.state === 'suspended') {
				this.audioContext.resume().then(() => {
					console.log("AudioContext resumed.");
					loadAndPlayAudio(); 
				}).catch((error) => {
					console.error("Error resuming AudioContext:", error);
				});
			} else {
				loadAndPlayAudio(); 
			}
		};
	
		document.addEventListener('click', resumeAudioContext, { once: true });
	
		this.audioLoader.load("/static/pong_static/assets/audio/SceneAudio.mp3", (buffer) => {
			if (buffer) {
				this.audio.setBuffer(buffer);
				this.audio.setLoop(true);
				this.audio.setVolume(0);
				this.audio.play().then(() => {
					console.log("Audio autoplay (muted) started.");
					setTimeout(() => this.audio.setVolume(1.0), 10);
				}).catch((error) => {
					console.warn("Autoplay blocked, waiting for user interaction.");
				});
			}
		});
	}
	
	initScoreFont() 
	{
		this.fontLoader = new FontLoader();
		this.loadedFont = null;
	}

	handleSocketMessage(event) 
	{
		try 
		{
			const data = JSON.parse(event.data);
			if (data.type === "playerId") 
				this.setupGameEntities(data);
			else if (data.type === "stateUpdate") 
				this.updateGameState(data);
		} 
		catch (error) {
			console.error("Error processing WebSocket message:", error);
		}
	}

	setupGameEntities(data) {
		this.bounds = new Bounds(data.bounds["xMin"], data.bounds["xMax"], data.bounds["yMin"], data.bounds["yMax"]);
	
		// Configura il giocatore locale
		const playerData = Object.values(data.players).find(player => player.id === data.playerId);
		console.log("Dati ricevuti dal server:", data);
		console.log("Dati ricevuti dal server:", playerData);
		console.log("Giocatore locale:", data.players[data.playerId]);
		console.log("Avversario:", Object.keys(data.players).find(id => id !== data.playerId));
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
}

const game = new Game();
game.sceneManager.animate();