import * as THREE from '../../lib/threejs/src/Three.js';
import LiarsBarPlayer from './utils/LiarsBarPlayer.js';
import SceneManager from '../../common_static/js/SceneManager.js';
import SocketManager from '../../common_static/js/SocketManager.js';

import router from '../../site_static/js/router.js';

const cardTextures = {
    'ACE': 'http://127.0.0.1:8000/media/png/pox.png',
    'QUEEN': 'http://127.0.0.1:8000/media/png/momo.png',
    'KING': 'http://127.0.0.1:8000/media/png/glim.png',
    'JOLLY': 'http://127.0.0.1:8000/media/png/master.png'
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
		this.currentPlayer = null;
		this.lastHand = null;
		this.lastRequiredCard = null;

		this.previousPlayerState = {
			selected_cards: [],
            selection_index: -1,
            doubting: false,
            card_sent: false,
            status: ''
        };
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
		this.ambientLight = new THREE.AmbientLight(0xb0e0e6, 1.1);

		// PointLight che si propaga in tutte le direzioni
		this.pointLight = new THREE.PointLight(0xFFB84D, 500000, 1500); // (Colore, Intensità, Distanza massima)
		this.pointLight.position.set(-300, 250, -40);

		// Abilita le ombre
		this.pointLight.castShadow = true;
		this.pointLight.shadow.camera.near = 1;
		this.pointLight.shadow.camera.far = 2000;
		this.pointLight.shadow.mapSize.set(512, 512);
		this.pointLight.shadow.bias = -0.0001;

		// Helper per visualizzare la PointLight
		const pointLightHelper = new THREE.PointLightHelper(this.pointLight, 50);

		this.sceneManager.scene.add(this.pointLight);
		this.sceneManager.scene.add(pointLightHelper);

		// Seconda PointLight (gialla)
		this.yellowLight = new THREE.PointLight(0xFFD700, 700000, 1500); // Giallo dorato
		this.yellowLight.position.set(0, 400, 500);
		this.yellowLight.castShadow = true;
		this.yellowLight.shadow.camera.near = 1;
		this.yellowLight.shadow.camera.far = 2000;
		this.yellowLight.shadow.mapSize.set(512, 512);
		this.yellowLight.shadow.bias = -0.0001;
		this.yellowLight.shadow.filter = THREE.PCFSoftShadowFilter;
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
		slimegun.scene.scale.set(40, 40, 40);
		slimegun.scene.rotation.y = 1.571;
		slimegun.scene.position.set(-20, 96, 730);

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

		
		const joinedPlayerId = data.event_info.player_id;
		if (this.player_id == joinedPlayerId)
			this.players[joinedPlayerId] = new LiarsBarPlayer(this.gameSocket, joinedPlayerId);
		else
			this.players[joinedPlayerId] = new LiarsBarPlayer(null, joinedPlayerId);
		if (Object.keys(this.players).length === 4) 
		{
			this.gameSocket.send(JSON.stringify({ type: 'client_ready' }));
			this.setCameraForPlayer(data);
			document.getElementById('liarsbarOverlay').classList.remove('d-none');
		}
	}


	setCameraForPlayer(data) {
		// Ottieni l'array dei giocatori
		const playersArray = Object.values(data.lobby_info.players);
	
		// Trova l'indice del giocatore locale (quello con player_id)
		const playerIndex = playersArray.findIndex(player => player.player_id === this.player_id);
		console.log(playerIndex);
		if (playerIndex === -1) {
			console.warn("Player ID non trovato nella lista dei giocatori!");
			return;
		}
		// Definiamo le posizioni della camera per ciascun giocatore
		const cameraPositions = [
			new THREE.Vector3(107.80899420126953, 261.37028568763486, 1040.2530466184585), //rimuru
			new THREE.Vector3(358.8226249419454, 278.7692367678665, 743.608735250403), // kuriboh
			new THREE.Vector3( -149.23606980454502, 260.49133716451746, 744.2613518306547), //slimegun
			new THREE.Vector3( 117.94440132977272, 255.2631934316667, 440.5598941686234), //king boh
		];
	
		// Definiamo i target per ciascun giocatore (4 target distinti)
		const targets = [
			new THREE.Vector3(118, 10, 467),      // rimuru
			new THREE.Vector3(-149, 100, 744), // kuriboh
			new THREE.Vector3(358, 80, 744),    //slimegun
			new THREE.Vector3(108, 100, 1040),    //king boh
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

			if (playerId === this.player_id) {
				this.currentPlayer = playerData;
			}
		});
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
	updatePlayerCards(playerHand) {
		const cardSlots = document.querySelectorAll('.col-1 .card'); // Seleziona tutte le carte esistenti
		
		cardSlots.forEach((slot, index) => {
			const shouldBeVisible = index < playerHand.length;
			if(shouldBeVisible && slot.style.visibility !== 'visible') {
				slot.style.visibility = 'visible';
				slot.style.opacity = '1';
			}
		});

		playerHand.forEach((card, index) => {
			if(cardSlots[index]) { 
				const cardType = card.card;
				const img = cardSlots[index].querySelector('img');
				
				if(img.src !== cardTextures[cardType]) {
					img.src = cardTextures[cardType] || 'http://127.0.0.1:8000/media/png/pox.png';
					img.alt = cardType;
					cardSlots[index].dataset.cardType = cardType;
				}
			}
		});
	

		for(let i = playerHand.length; i < cardSlots.length; i++) {
			cardSlots[i].style.visibility = 'hidden'; 
		}
	}

	selected_card(player) {
        const cardSlots = document.querySelectorAll('.col-1 .card');
        const selectedIndex = player.selection_index;

        const selectionChanged = this.previousPlayerState.selection_index !== selectedIndex;
        const doubtingChanged = this.previousPlayerState.doubting !== player.doubting;
        const statusChanged = this.previousPlayerState.status !== player.status;
        const cardSentChanged = this.previousPlayerState.card_sent !== player.card_sent;
		const selectedCardsChanged = JSON.stringify(this.previousPlayerState.selected_cards) !== JSON.stringify(player.selected_index);

		if (selectionChanged || doubtingChanged || cardSentChanged || statusChanged || selectedCardsChanged) {
			cardSlots.forEach((slot, index) => {
				if (selectionChanged && slot.classList.contains('selected')) {
					slot.classList.remove('selected');
				}
				if ((doubtingChanged || selectionChanged) && slot.classList.contains('pulsate')) {
					slot.classList.remove('pulsate');
				}
				if ((cardSentChanged || selectionChanged) && slot.classList.contains('glow')) {
					slot.classList.remove('glow');
				}
				if (selectedCardsChanged && slot.classList.contains('selected-active')) {
					slot.classList.remove('selected-active');
				}
				if (statusChanged) {
					slot.classList.toggle('grayscale', player.status === 'DIED');
					slot.classList.toggle('disabled', player.status === 'DIED');
				}
			});
		}
	
		// Applica l'effetto di selezione in base a selection_index
		if (selectedIndex >= 0 && selectedIndex < cardSlots.length) {
			const selectedSlot = cardSlots[selectedIndex];
	
			if (!selectedSlot.classList.contains('selected')) {
				selectedSlot.classList.add('selected');
			}
			if (player.doubting && !selectedSlot.classList.contains('pulsate')) {
				selectedSlot.classList.add('pulsate');
			} else if (!player.doubting) {
				selectedSlot.classList.remove('pulsate');
			}
			if (!player.card_sent && !selectedSlot.classList.contains('glow')) {
				selectedSlot.classList.add('glow');
			} else if (player.card_sent) {
				selectedSlot.classList.remove('glow');
			}
			if (statusChanged) {
				selectedSlot.classList.toggle('ghost', player.status === 'DIED');
			}
		}

		if (selectedCardsChanged && player.selected_index && player.selected_index.length > 0) {
			player.selected_index.forEach((cardIndex) => {
				if (cardIndex >= 0 && cardIndex < cardSlots.length) {
					const slot = cardSlots[cardIndex];
					if (!slot.classList.contains('selected-active')) {
						slot.classList.add('selected-active');
					}
				}
			});
		}

		if (selectionChanged || doubtingChanged || cardSentChanged || statusChanged || selectedCardsChanged) {
			this.previousPlayerState = {
				selected_cards: [...player.selected_index],
				selection_index: selectedIndex,
				doubting: player.doubting,
				card_sent: player.card_sent,
				status: player.status
			};
		}	
    }

	cleanupWindowClose()
	{
		window.removeEventListener('beforeunload', this.close_window_event_beforeunload);
		window.removeEventListener('unload', this.close_window_event_unload);
		window.removeEventListener('popstate', this.close_window_event_popstate);
	}

	game_ended(isGamefinished)
	{
		router.setupEventListeners();
		if (this.sceneManager) {
			this.sceneManager.dispose();
			this.sceneManager = null;
		}

		this.players = null;

		let event_name = isGamefinished === true ? "quit_game" : "unexpected_quit";
		if (this.gameSocket && this.gameSocketsocket) {
			this.gameSocket.send(JSON.stringify({
				type: event_name,
				player_id: this.player_id
			}));
			this.gameSocket.close();
		}
		this.cleanupWindowClose();
		router.navigateTo('/multiplayer');
	}

	/**
	 * Handles incoming WebSocket messages.
	 * @param {MessageEvent} event - The WebSocket message event.
	 */
	handleSocketMessage(event) 
	{
		try {
			const data = JSON.parse(event.data);
			console.log("xxhahds", data);
			switch (data.lobby_info.current_lobby_status) 
			{
				case 'TO_SETUP':
					this.setUpLobby(data);
					break;
					case 'PLAYING':
					this.updateGameState(data);
					if (this.currentPlayer.hand) {
						const hasHandChanged = JSON.stringify(this.currentPlayer.hand) !== JSON.stringify(this.lastHand);
						if (hasHandChanged) {
							this.updatePlayerCards(this.currentPlayer.hand);
							this.lastHand = this.currentPlayer.hand;
						}
					}
					this.selected_card(this.currentPlayer);
					break;
				case 'ENDED':
					this.game_ended(true);
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
