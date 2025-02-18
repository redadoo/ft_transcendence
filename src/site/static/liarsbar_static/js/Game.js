import * as THREE from '../../lib/threejs/src/Three.js';
import LiarsBarPlayer from './utils/LiarsBarPlayer.js';
import SceneManager from '../../common_static/js/SceneManager.js';
import SocketManager from '../../common_static/js/SocketManager.js';



const cardTextures = {
    'ACE': 'images/ace.png',
    'QUEEN': 'images/queen.png',
    'KING': 'images/king.png',
    'JOLLY': 'images/jolly.png'
};
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

	/* 	this.sceneManager.setCameraState(
			new THREE.Vector3(-34.619, 96.642, 233.726),
			new THREE.Quaternion(-0.188, 0.223, 0, 0.95),
			new THREE.Vector3(-173.113, -31.705, -47.019)
		); */

		this.initLights();

		await this.sceneManager.modelManager.loadModel({
			'/static/liarsbar_static/assets/liarsbar/liars_room.glb': 'LobbyScene',
			'/static/liarsbar_static/assets/liarsbar/human.glb': 'human',
			'/static/liarsbar_static/assets/liarsbar/king_boo.glb': 'kingboo',
			'/static/liarsbar_static/assets/liarsbar/rimuru_slime.glb': 'rimuru',
			'/static/liarsbar_static/assets/liarsbar/winged_kuriboh.glb': 'kuriboh',
			'/static/liarsbar_static/assets/liarsbar/slime_gun.glb': 'slimegun'
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

		// PointLight che si propaga in tutte le direzioni
		this.pointLight = new THREE.PointLight(0xFFB84D, 500000, 1500); // (Colore, Intensità, Distanza massima)
		this.pointLight.position.set(-300, 250, -40);

		// Abilita le ombre
		this.pointLight.castShadow = true;
		this.pointLight.shadow.camera.near = 1;
		this.pointLight.shadow.camera.far = 2000;
		this.pointLight.shadow.mapSize.set(2048, 2048);
		this.pointLight.shadow.bias = -0.0001;

		// Helper per visualizzare la PointLight
		const pointLightHelper = new THREE.PointLightHelper(this.pointLight, 50);

		this.sceneManager.scene.add(this.pointLight);
		this.sceneManager.scene.add(pointLightHelper);

		// Seconda PointLight (gialla)
		this.yellowLight = new THREE.PointLight(0xFFD700, 1500000, 1500); // Giallo dorato
		this.yellowLight.position.set(0, 400, 500);
		this.yellowLight.castShadow = true;
		this.yellowLight.shadow.camera.near = 1;
		this.yellowLight.shadow.camera.far = 2000;
		this.yellowLight.shadow.mapSize.set(2048, 2048);
		this.yellowLight.shadow.bias = -0.0001;
		const yellowLightHelper = new THREE.PointLightHelper(this.yellowLight, 50);
		this.sceneManager.scene.add(this.yellowLight);
		this.sceneManager.scene.add(yellowLightHelper);


		this.sceneManager.scene.add(this.ambientLight);
	}

	/**
	 * Initializes the lobby scene by adding the LobbyScene model to the game.
	 */
	initLobbyScene() 
	{
		const LobbyScene = this.sceneManager.modelManager.getModel("LobbyScene");
		LobbyScene.scene.scale.set(10000, 10000, 10000);
		LobbyScene.scene.rotation.y = 0;
		LobbyScene.scene.position.set(0, 0, 0);

		this.sceneManager.scene.add(LobbyScene.scene);

		const bo = this.sceneManager.modelManager.getModel("kingboo");
		bo.scene.scale.set(170, 170, 170);
		bo.scene.rotation.y = 0;
		bo.scene.position.set(120, 150, 620);

		const slimegun = this.sceneManager.modelManager.getModel("slimegun");
		slimegun.scene.scale.set(4000, 4000, 4000);
		slimegun.scene.rotation.y = 1.571;
		slimegun.scene.position.set(0, 160, 740);

		const bo3 = this.sceneManager.modelManager.getModel("rimuru");
		bo3.scene.scale.set(30, 30, 30);
		bo3.scene.rotation.y =  200;
		bo3.scene.position.set(120, 96, 840);

		const bo4 = this.sceneManager.modelManager.getModel("kuriboh");
		bo4.scene.scale.set(3, 3, 3);
		bo4.scene.rotation.y = -1.571;
		bo4.scene.position.set(240, 150, 750);

		const axesHelper = new THREE.AxesHelper(500); // La dimensione determina la lunghezza degli assi
		this.sceneManager.scene.add(axesHelper);
		const gridHelper = new THREE.GridHelper(10000, 10); // (Dimensione, Divisioni)
		this.sceneManager.scene.add(gridHelper);

		this.sceneManager.scene.add(bo.scene);
		this.sceneManager.scene.add(slimegun.scene);
		this.sceneManager.scene.add(bo3.scene);
		this.sceneManager.scene.add(bo4.scene);
	
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
		if (this.player_id == joinedPlayerId)
			this.players[joinedPlayerId] = new LiarsBarPlayer(this.gameSocket, joinedPlayerId);
		else
			this.players[joinedPlayerId] = new LiarsBarPlayer(null, joinedPlayerId);
		if (Object.keys(this.players).length === 4) 
			this.gameSocket.send(JSON.stringify({ type: 'client_ready' }));
	}

	setCameraForPlayer(data) {
		// Ottieni l'array dei giocatori
		const playersArray = Object.values(data.lobby_info.players);
	
		// Trova l'indice del giocatore locale (quello con player_id)
		const playerIndex = playersArray.findIndex(player => player.player_id === this.player_id);
		if (playerIndex === -1) {
			console.warn("Player ID non trovato nella lista dei giocatori!");
			return;
		}
	
		// Definiamo le posizioni della camera per ciascun giocatore
		const cameraPositions = [
			new THREE.Vector3(315.57587851518224, 195.70035909390145, 994.4429210866258), //rimuru
			new THREE.Vector3(325.4030018545432, 243.79773664778745, 615.7566110039751), // kuriboh
			new THREE.Vector3(-36.235102977326164, 239.9165631088926, 524.2427525269686), //king boh
			new THREE.Vector3(-114.35623802611076, 202.76800820190383, 918.8519282059492), //slimegun
		];
	
		// Definiamo i target per ciascun giocatore (4 target distinti)
		const targets = [
			new THREE.Vector3(-200, 0, 0),      // rimuru
			new THREE.Vector3(0, 100, 800), // kuriboh
			new THREE.Vector3(200, 100, 900),    //king boh
			new THREE.Vector3(300, 150, 600),    //slimegun
		];
	
		// Prendi la posizione della camera e il target in base all'indice del giocatore
		const cameraPos = cameraPositions[playerIndex];
		const target = targets[playerIndex];
	
		// Calcoliamo la direzione verso il target
		const direction = target.clone().sub(cameraPos).normalize();  // Cambia la direzione verso il target specificato
	
		// Creiamo un quaternion per la rotazione della camera affinché guardi al target
		const cameraRot = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), direction);
	
		// Disabilita temporaneamente i controlli orbitali se sono attivi
		if (this.sceneManager.controls) {
			this.sceneManager.controls.enabled = false;
		}
	
		// Impostiamo la camera nella scena
		this.sceneManager.setCameraState(cameraPos, cameraRot, target);
	
		// Riabilita i controlli orbitali
		if (this.sceneManager.controls) {
			this.sceneManager.controls.enabled = true;
		}
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
		this.setCameraForPlayer(data);
	}

	/**
	 * Updates the state of existing players based on socket data.
	 * @param {Object} data - Socket data about the lobby event.
	 */
	updatePlayers(data) 
	{
		// Verifica che i dati contengano informazioni sui giocatori
		if (!data) 
		{
			console.error('1Dati non validi o mancanti per aggiornare i giocatori.');
			return;
		}
		if (!data.lobby_info) 
		{
			console.error('2Dati non validi o mancanti per aggiornare i giocatori.');
			return;
		}
		if (!data.lobby_info.players || typeof data.lobby_info.players !== 'object') 
		{
			console.error('3Dati non validi o mancanti per aggiornare i giocatori.', data.lobby_info);
			return;
		}
		console.log('Eccomi', data.lobby_info);

		// Converti l'oggetto players in un array
		const playersArray = Object.values(data.lobby_info.players);

		// Itera sui giocatori nei dati ricevuti
		playersArray.forEach(playerData => 
		{
			const playerId = playerData.player_id;

			// Verifica se il giocatore esiste già
			if (this.players[playerId]) 
			{
				// Aggiorna lo stato del giocatore esistente
				this.players[playerId].updateState(data.lobby_info);
			} 
			else 
			{
				console.warn(`Giocatore con ID ${playerId} non trovato.`);
			}
		});

		console.log('Stato dei giocatori aggiornato:', this.players);
	}

	
	updateGameState(data)
	{
		try
		{
			if (data)
				this.updatePlayers(data);


			if(data)
			{
				//update UI overlay
			}
		}
		catch (error) {
			console.error("An error occurred during game update state:", error);
			console.error("data:", data);
		}
	}

	/**
	 * Handles incoming WebSocket messages.
	 * @param {MessageEvent} event - The WebSocket message event.
	 */
	handleSocketMessage(event) 
	{
		console.log(this.sceneManager.camera);
		try {
			const data = JSON.parse(event.data);
			switch (data.lobby_info.current_lobby_status) 
			{
				case 'TO_SETUP':
					console.log("to setup");	
					this.setUpLobby(data);
					break;
					case 'PLAYING':
					console.log("playing");	

					//this.updateGameState(data);
					break;
				case 'ENDED':
					break;
				case 'PLAYER_DISCONNECTED':
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
