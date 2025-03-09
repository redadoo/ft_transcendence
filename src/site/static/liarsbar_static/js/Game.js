import * as THREE from "https://cdn.jsdelivr.net/npm/three@latest/build/three.module.js";
import LiarsBarPlayer from './utils/LiarsBarPlayer.js';
import SceneManager from '../../common_static/js/SceneManager.js';
import SocketManager from '../../common_static/js/SocketManager.js';

import router from '../../site_static/js/router.js';
import MatchmakingManager from '../../common_static/js/MatchmakingManager.js';

const cardTextures = {
    'ACE': '/media/png/pox.png',
    'QUEEN': '/media/png/momo.png',
    'KING': '/media/png/glim.png',
    'JOLLY': '/media/png/master.png'
};

/**
 * Game class for managing the Liar's Bar multiplayer game environment.
 * Handles player setup, scene management, lighting, and WebSocket communication.
 */
export default class Game 
{
	constructor() {
		this.ambientLight = null;
		this.pointLight = null;
		this.lightHelper = null;
		this.gameSocket = null;
		this.players = {};
		this.playersOrder = [];
		this.currentPlayer = null;
		this.lastHand = null;
		this.lastRequiredCard = null;
		this.lastElapsedTime = null;
		this.matchmakingManager = null;

		this.close_window_event_beforeunload = null;
		this.close_window_event_popstate = null;
		this.close_window_event_unload = null;
		this.shouldCleanupOnExit = false;
		this.isSceneCreated = false;
		this.isFirstRender = true;

		this.previousPlayerState = {
			selected_cards: [],
            selection_index: -1,
            doubting: false,
            card_sent: false,
            status: ''
        };

		this.manageWindowClose();
	}

	handleExit(event)
	{
		const leavePage = window.confirm("Do you want to leave?");
		if (leavePage)
			this.game_ended(false);
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
				this.game_ended(false);
		};

		window.addEventListener("beforeunload", this.close_window_event_beforeunload);
		window.addEventListener("unload", this.close_window_event_unload);
		window.addEventListener('popstate', this.close_window_event_popstate, false);
	}

	/**
     * Initializes the game scene, mode, and environment.
     */
	async init(player_id) 
	{
		router.removeEventListeners();
		
		this.player_id = player_id

		await this.initGameEnviroment();

		this.setupGameSocket();
		// this.matchmakingManager = new MatchmakingManager("liarsbar", this.setupGameSocket.bind(this));
	}

	/**
	 * Initializes the game environment, including the scene, lighting, and models.
	 * @returns {Promise<void>}
	 */
	async initGameEnviroment() 
	{
		this.sceneManager = new SceneManager(true);
		this.sceneManager.initialize(true, true);
		this.sceneManager.staticMode = true;
		
	/* 	this.sceneManager.setCameraState(
			new THREE.Vector3(-34.619, 96.642, 233.726),
			new THREE.Quaternion(-0.188, 0.223, 0, 0.95),
			new THREE.Vector3(-173.113, -31.705, -47.019)
		); */

		this.initLights();

		await this.sceneManager.modelManager.loadModel({
			'/static/liarsbar_static/assets/liarsbar/Island.glb': 'LobbyScene',
			'/static/liarsbar_static/assets/liarsbar/Porygon.glb': 'Porygon',
			'/static/liarsbar_static/assets/liarsbar/Mew.glb': 'Mew',
			'/static/liarsbar_static/assets/liarsbar/Cubone.glb': 'Cubone',
			'/static/liarsbar_static/assets/liarsbar/Magikarp.glb': 'Magikarp',
			//--------------------------------OLD MODELS------------------------
			// '/static/liarsbar_static/assets/liarsbar/liars_room.glb': 'LobbyScene',
			// '/static/liarsbar_static/assets/liarsbar/human.glb': 'human',
			// '/static/liarsbar_static/assets/liarsbar/king_boo.glb': 'kingboo',
			// '/static/liarsbar_static/assets/liarsbar/rimuru_slime.glb': 'rimuru',
			// '/static/liarsbar_static/assets/liarsbar/winged_kuriboh.glb': 'kuriboh',
			// '/static/liarsbar_static/assets/liarsbar/slime_gun.glb': 'slimegun'
		});

		this.initLobbyScene();
	}


	/**
	 * Handles the opening of a socket connection and sends an initialization message for the player.
	 */
	onSocketOpen() 
	{
		this.gameSocket.send(JSON.stringify({
			type: 'init_player',
			player_id: this.player_id
		}));
	}

	/**
	 * Handles
	 */
	onSocketClose() 
	{
		// if(this.game.pongPlayer != null)
		// {
		// 	alert("the server is temporarily down");
		// 	this.game.game_ended(false);
		// }
	}

	/**
	 * Sets up the WebSocket connection for the multiplayer Liar's Bar game.
	 * @todo Implement matchmaking to dynamically assign room names.
	 * @returns {Promise<void>}
	 */
	setupGameSocket(data) 
	{
		this.gameSocket = new SocketManager(true);
		this.gameSocket.initGameWebSocket(
			'liarsbar',
			this.handleSocketMessage.bind(this),
			"test",
			this.onSocketOpen.bind(this),
			this.onSocketClose.bind(this)
		);
	}

	/**
	 * Sets up the lighting in the game scene.
	 */
	initLights() 
	{
		// Luce ambientale blu scuro (notturna)
		this.ambientLight = new THREE.AmbientLight(0x0d1b2a, 0.4);

		// Luce lunare (PointLight azzurra)
		this.moonLight = new THREE.PointLight(0xADD8E6, 1.2, 10); 
		this.moonLight.position.set(2, 3, -1);
		this.moonLight.castShadow = true;
		this.moonLight.shadow.camera.near = 1;
		this.moonLight.shadow.camera.far = 100;
		this.moonLight.shadow.mapSize.set(256, 256);
		this.moonLight.shadow.bias = -0.0002;
		this.moonLight.shadow.filter = THREE.PCFSoftShadowFilter;

		const moonLightHelper = new THREE.PointLightHelper(this.moonLight, 30);
		this.sceneManager.scene.add(this.moonLight);
		this.sceneManager.scene.add(moonLightHelper);

		// Aggiunta della luce ambientale
		this.sceneManager.scene.add(this.ambientLight);
		//-----------------------------------------heavy graphics-------------------------
		/* this.ambientLight = new THREE.AmbientLight(0xb0e0e6, 1.1);

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
		this.sceneManager.scene.add(yellowLightHelper); */


		this.sceneManager.scene.add(this.ambientLight);
	}

	/**
	 * Initializes the lobby scene by adding the LobbyScene model to the game.
	 */
	initLobbyScene() 
	{
		const LobbyScene = this.sceneManager.modelManager.getModel("LobbyScene", true);
		LobbyScene.scene.scale.setScalar(3);
		LobbyScene.scene.rotation.y = 0;
		LobbyScene.scene.position.set(0, -2.3, 0);

		this.sceneManager.scene.add(LobbyScene.scene);

		const bo = this.sceneManager.modelManager.getModel("Mew", true);
		bo.scene.scale.setScalar(0.5);
		bo.scene.rotation.y = 0;
		bo.scene.position.set(0, 0.2, 0.5);

		const slimegun = this.sceneManager.modelManager.getModel("Porygon", true);
		slimegun.scene.scale.setScalar(0.002);
		slimegun.scene.rotation.y = 1.571;
		slimegun.scene.position.set(-0.5, 0.03, 0);

		const bo3 = this.sceneManager.modelManager.getModel("Magikarp", true);
		bo3.scene.scale.setScalar(0.5);
		bo3.scene.rotation.y = -1.571;
		bo3.scene.position.set(0.5, 0.05, 0)

		const bo4 = this.sceneManager.modelManager.getModel("Cubone", true);
		bo4.scene.scale.setScalar(0.5);
		bo4.scene.rotation.y =  3.142;
		bo4.scene.position.set(0, 0.15, -0.5);
		//------------------------------OLD MODELS----------------------------------
	/* 	const LobbyScene = this.sceneManager.modelManager.getModel("LobbyScene");
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
		bo4.scene.position.set(240, 150, 750); */
		
		this.sceneManager.scene.add(bo.scene);
		this.sceneManager.scene.add(slimegun.scene);
		this.sceneManager.scene.add(bo3.scene);
		this.sceneManager.scene.add(bo4.scene);

		const axesHelper = new THREE.AxesHelper(500); // La dimensione determina la lunghezza degli assi
		this.sceneManager.scene.add(axesHelper);
		const gridHelper = new THREE.GridHelper(10000, 10); // (Dimensione, Divisioni)
		this.sceneManager.scene.add(gridHelper);

	
	}

	AddUsersToLobby(data)
	{
		const players = data.lobby_info.players;

		for (const key in players) 
		{
			const player = players[key];
			console.log(`Player ID: ${player.player_id}`);

			if (!this.playersOrder.includes(player.player_id)) 
			{
				this.playersOrder.push(player.player_id);
				this.players[player.player_id] = new LiarsBarPlayer(null, player.player_id);
			}
		}

		// Se la lobby è completa, avviamo il gioco
		if (this.playersOrder.length === 4) 
		{
			this.gameSocket.send(JSON.stringify({ type: 'client_ready' }));
			this.setCameraForPlayer(data);
			console.log("sfogo", this.playersOrder);
			console.log("sfogo 2", this.players);
			document.getElementById('liarsbarOverlay').classList.remove('d-none');
		}
	}

	/**
	 * Adds a user to the lobby by cloning the human model and updating the scene.
	 * @param {Object} data - Data about the joining player.
	 */
	AddUserToLobby(data) {
		const joinedPlayerId = data.event_info.player_id;
	
		// Se il player non è già nell'array di ordine, lo aggiungiamo
		if (!this.playersOrder.includes(joinedPlayerId)) 
		{
			this.playersOrder.push(joinedPlayerId);
		}

		// Creiamo il nuovo giocatore
		if (this.player_id == joinedPlayerId)
			this.players[joinedPlayerId] = new LiarsBarPlayer(this.gameSocket, joinedPlayerId);
		else
			this.players[joinedPlayerId] = new LiarsBarPlayer(null, joinedPlayerId);
	
		// Se la lobby è completa, avviamo il gioco
		if (this.playersOrder.length === 4) 
		{
			this.gameSocket.send(JSON.stringify({ type: 'client_ready' }));
			this.setCameraForPlayer(data);
			console.log("sfogo", this.playersOrder);
			console.log("sfogo 2", this.players);
			document.getElementById('liarsbarOverlay').classList.remove('d-none');
		}
	}

	setCameraForPlayer(data) {
		// Trova l'indice del giocatore locale (quello con player_id)
		const playerIndex = this.playersOrder.indexOf(this.player_id);
		console.log(playerIndex);
		if (playerIndex === -1) {
			console.warn("Player ID non trovato nella lista dei giocatori!");
			return;
		}
		const cameraPositions = [
			new THREE.Vector3(-2.5, 1.7, 0.5), //rimuru
				new THREE.Vector3(0.5, 1.7, 2.5), // kuriboh
				new THREE.Vector3(2.5, 1.7, -2.5), //slimegun
				new THREE.Vector3(2.5, 1.7, 0.5), //Magikarp
			];
		
			// Definiamo i target per ciascun giocatore (4 target distinti)
			const targets = [
				new THREE.Vector3(0, 0, 0),      // rimuru
				new THREE.Vector3(0, 0, 0), // kuriboh
				new THREE.Vector3(0, 0, 0),    //slimegun
				new THREE.Vector3(0, 0, 0),    //Magikarp
			];
		// ---------------------OLD CAMERA---------------------------
		/* const cameraPositions = [
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
		]; */
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
	 * Sets up the lobby based on socket data.
	 * @param {Object} data - Socket data about the lobby event.
	 */
	setUpLobby(data) 
	{
		if (data.event_info.event_name === "player_join") 
			this.AddUserToLobby(data);
		if (data.event_info.event_name === "recover_player_data")
			this.AddUsersToLobby(data);
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
			if (this.players && this.players[playerId]) 
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

	  /**
   * Aggiorna il contenuto dell'elemento DOM del timer.
   * @param {number} timeLeft - Il tempo rimanente (in secondi) da mostrare.
   */
	updateClockDisplay(timeLeft) 
	{
		const clockContainer = document.getElementById('clockContainer');
		const clockText = document.getElementById('clockText');
	
		if (clockContainer && clockText) {
			clockText.textContent = timeLeft;
	
			// Controlla se mancano 5 secondi o meno
			if (timeLeft <= 5) {
				// Aggiungi la classe per far pulsare il contenitore e cambiare il colore del testo
				clockContainer.classList.add('pulsatered');
				clockText.classList.add('red');
			} else {
				// Rimuovi le classi se il tempo è superiore a 5 secondi
				clockContainer.classList.remove('pulsatered');
				clockText.classList.remove('red');
			}
		}
	}
	/**
	 * Funzione dedicata all'aggiornamento del timer del turno.
	 * Controlla se il tempo trascorso è cambiato e, in tal caso, aggiorna il display.
	 * @param {Object} lobbyInfo - L'oggetto contenente le informazioni sulla lobby, inclusi time e turn_duration.
	 */
	updateTurnTimer(lobbyInfo) 
	{
		if (lobbyInfo.turn_duration !== undefined && lobbyInfo.time !== undefined) 
		{
			const totalTurnTime = lobbyInfo.turn_duration;
			const elapsedTime = lobbyInfo.time;
			
			if (this.lastElapsedTime !== elapsedTime) 
			{
				this.lastElapsedTime = elapsedTime;
				const remainingTime = totalTurnTime - elapsedTime;
				this.updateClockDisplay(remainingTime);
			}
		}
	}
	
	updateIcons(data) 
	{
		const icons = document.querySelectorAll("#verticalIcons .icon");
		const iconTexts = document.querySelectorAll("#verticalIcons .icon-text");
		const yourTurnText = document.querySelector(".your-turn-text"); 

		if (!data || !data.lobby_info) 
		{
			console.error("Errore: lobby_info non definito o mancante.");
			return;
		}
	
		const cardRequired = data.lobby_info.card_required;
		let isMyTurn = false;
		
		// Iteriamo usando l'ordine fisso salvato in playersOrder
		this.playersOrder.forEach((playerId, index) => {
			const player = this.players[playerId];
	
			if (!player || !icons[index] || !iconTexts[index]) 
				return;
	
			const icon = icons[index];
			const iconText = iconTexts[index];
	
			// Stato attivo (turno attuale)
			const isActive = player.playerTurn;
			if (icon.classList.contains("active") !== isActive) 
				icon.classList.toggle("active", isActive);
	
			// Stato morto
			const isDead = player.status === "DIED";
			if (icon.classList.contains("died") !== isDead) 
				icon.classList.toggle("died", isDead);

			if (isActive && player.playerId === this.player_id) 
				isMyTurn = true;

			if (yourTurnText) 
			{
				const shouldBeVisible = isMyTurn ? "visible" : "hidden";
				if (yourTurnText.style.visibility !== shouldBeVisible) 
					yourTurnText.style.visibility = shouldBeVisible;
			}

			// Aggiornamento testo solo se cambia
			const newText = player.selectedCards.length > 0 
				? `Claims <span class="number">${player.selectedCards.length}</span> <span class="card-name">${cardRequired}</span>` 
				: "";
	
			if (iconText.innerHTML !== newText) 
			{
				iconText.innerHTML = newText;
				iconText.style.visibility = newText ? "visible" : "hidden";
			}
		});
	}
		
	updateGameState(data)
	{
		try
		{
			if (data)
				this.updatePlayers(data);
			
			this.updateIcons(data);
			if (data.lobby_info) 
				this.updateTurnTimer(data.lobby_info);
		}
		catch (error) {
			console.error("An error occurred during game update state:", error);
			console.error("data:", data);
		}
	}

	updatePlayerCards(playerHand) 
	{
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
					img.src = cardTextures[cardType] || '/media/png/pox.png';
					img.alt = cardType;
					cardSlots[index].dataset.cardType = cardType;
				}
			}
		});
	

		for(let i = playerHand.length; i < cardSlots.length; i++) {
			cardSlots[i].style.visibility = 'hidden'; 
		}
	}

	selected_card(player) 
	{
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
		document.getElementById('liarsbarOverlay').classList.add('d-none');
		router.setupEventListeners();

		if (this.sceneManager) 
		{
			this.sceneManager.dispose();
			this.sceneManager = null;
		}

		this.players = null;
		let event_name = isGamefinished === true ? "quit_game" : "unexpected_quit";

		if (this.gameSocket) 
		{
			this.gameSocket.send(JSON.stringify({
				type: event_name,
				player_id: this.player_id
			}));
			this.gameSocket.close();
		}

		this.cleanupWindowClose();
		
		if (isGamefinished === true)
			router.navigateTo('/match-result');
		else
			router.navigateTo('/multiplayer');
	}

	/**
	 * Handles incoming WebSocket messages.
	 * @param {MessageEvent} event - The WebSocket message event.
	 */
	handleSocketMessage(data) 
	{
		try {
			switch (data.lobby_info.current_lobby_status) 
			{
				case 'TO_SETUP':
					this.setUpLobby(data);
					console.log(data);
					break;
				case 'PLAYING':
					console.log(data);
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