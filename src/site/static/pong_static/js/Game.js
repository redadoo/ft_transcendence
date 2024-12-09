import * as THREE from '../../lib/threejs/src/Three.js';
import SceneManager from '../../common_static/js/SceneManager.js';
import Bounds from './Scritps/Bounds.js';
import Ball from './Scritps/Class/Ball.js';
import PongPlayer from './Scritps/Class/PongPlayer.js';
import Paddle from './Scritps/Class/Paddle.js';
import Background from './Scritps/Class/Background.js';
import GameSocketManager from '../../common_static/js/GameSocketManager.js';

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

        // Networking
        this.gameSocket = null;
    }

    init() {
        this.initializeSceneManager();
        const isSinglePlayer = GameSocketManager.getModeFromPath() === 'singleplayer';
        isSinglePlayer ? this.initSinglePlayer() : this.setupMultiplayerUI();
    }

    initializeSceneManager() {
        this.sceneManager = new SceneManager(true);
        Object.assign(this.sceneManager, CAMERA_SETTINGS);
        this.sceneManager.initialize();
    }

    setupMultiplayerUI() {
        const matchmakingButton = document.getElementById('startMatchmaking');
        if (matchmakingButton) {
            matchmakingButton.addEventListener('click', () => this.startMatchmaking());
        }
    }

    startMatchmaking() {
        if (!this.gameSocket) {
            this.gameSocket = new GameSocketManager();
            this.gameSocket.initWebSocket(
                'multiplayer/pong/matchmaking',
                this.handleMatchmakingSocketMessage.bind(this)
            );
            this.gameSocket.socket.onopen = () => {
                this.gameSocket.send(JSON.stringify({ action: 'join_matchmaking' }));
            };
        }
    }

    handleMatchmakingSocketMessage(event) {
        try {
            const data = JSON.parse(event.data);
            if (data.type === 'setup_pong_lobby') {
                this.setupMultiplayerPongSocket(data);
            } else {
                console.log('Unhandled matchmaking event type.');
            }
        } catch (error) {
            console.error('Error processing matchmaking WebSocket message:', error);
        }
    }

    setupMultiplayerPongSocket(data) {
        document.getElementById('pong-container')?.remove();
        this.gameSocket.close();
        this.gameSocket.initGameWebSocket(
            'pong',
            this.handleGameSocketMessage.bind(this),
            data.room_name
        );
        this.initGameEnvironment();
    }

    initSinglePlayer() {
        this.gameSocket = new GameSocketManager();
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
        this.sceneManager.initAudioVar();
        this.sceneManager.playAudio('/static/pong_static/assets/audio/SceneAudio.mp3');
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
        this.bounds = new Bounds(data.bounds.xMin, data.bounds.xMax, data.bounds.yMin, data.bounds.yMax);

        // Player setup
        const playerData = Object.values(data.players).find(p => p.id === data.playerId);
        this.pongPlayer = new PongPlayer('KeyW', 'KeyS', this.gameSocket, data.playerId, playerData);

        // Opponent setup
        const opponentId = Object.keys(data.players).find(id => id !== data.playerId);
        const opponentData = data.players[opponentId];
        this.pongOpponent = new PongPlayer(null, null, this.gameSocket, opponentId, opponentData);

        this.ball = new Ball(data.ball.radius);
        this.background = new Background(this.sceneManager.scene, this.bounds.xMax * 2, this.bounds.yMax * 2);

        // Add elements to the scene
        this.sceneManager.scene.add(this.ball.mesh);
        this.sceneManager.scene.add(this.pongPlayer.paddle.mesh);
        this.sceneManager.scene.add(this.pongOpponent.paddle.mesh);

        // Notify server
        this.gameSocket.send(JSON.stringify({ type: 'ready', playerId: this.pongPlayer.playerId }));
    }

    updateGameState(data) {
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
            switch (data.type) {
                case 'initGame':
                    this.initGame(data);
                    break;
                case 'stateUpdate':
                    this.updateGameState(data);
                    break;
                case 'lobbyClosed':
                    this.cleanUp();
                    break;
                default:
                    console.log('Unhandled game socket event type.');
            }
        } catch (error) {
            console.error('Error processing game WebSocket message:', error);
        }
    }
}

const game = new Game();
game.init();
game.sceneManager.animate();
