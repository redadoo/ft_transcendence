import { GLTFLoader } from '../../lib/threejs/examples/jsm/loaders/GLTFLoader.js';
import SceneManager from '../../common_static/js/SceneManager.js';
import * as THREE from '../../lib/threejs/src/Three.js';

class Game {
	constructor() {
		
		window.location.hash = "#deleted_something";

		this.ambientLight = undefined;
		this.pointLight = undefined;
		this.lightHelper = undefined;
		this.gameSocket = undefined;
		
		this.sceneManager = new SceneManager(true);
		
		this.sceneManager.fov = 75;
		this.sceneManager.nearPlane = 0.1;
		this.sceneManager.farPlane = 1500;
		
		this.sceneManager.initialize();
		
		this.initCamera();
		this.initLights();

		this.initWebSocket();


		this.modelsLoaded = {};
		this.loadingPromises = [];

		this.aceCardsModel = [];
		this.kingCardsModel = [];
		this.queenCardsModel = [];
		this.AllCardsModel = [];

		this.gltfLoader = new GLTFLoader();

		this.preload3DModels().then(() => {
			this.initScene();
		});

		this.sceneManager.setExternalFunction(() => this.fixedUpdate());

		this.setupHashChangeDetection();
	}

	async initWebSocket() {
		try {
			const roomName = await this.getRoomInfo();
			this.connectionString = `ws://${window.location.host}/ws/multiplayer/liarsbar/${roomName}`;
			this.gameSocket = new WebSocket(this.connectionString);

			this.gameSocket.onmessage = this.handleSocketMessage.bind(this);
		} catch (error) {
			console.error('Failed to fetch room info:', error);
		}
	}

	async getRoomInfo() {
		const response = await fetch('/api/multiplayer/liarsbar', {
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

	handleSocketMessage(event) 
	{
		try 
		{
			const data = JSON.parse(event.data);
		} 
		catch (error) {
			console.error("Error processing WebSocket message:", error);
		}
	}

	loadManager(){	
		const loadingManager = new THREE.LoadingManager( () => {
	
			const loadingScreen = document.getElementById( 'loading-screen' );
			loadingScreen.classList.add( 'fade-out' );
			
			// optional: remove loader from DOM via event listener
			loadingScreen.addEventListener( 'transitionend', onTransitionEnd );
			
		} );
	}


	initLights()
	{
		this.ambientLight = new THREE.AmbientLight(0xb0e0e6,10.1); //0.1

		this.pointLight = new THREE.SpotLight(0xFFB84D, 850000, 500);
		this.pointLight.position.set(0, 200, -250);
		this.pointLight.target.position.set(0, -1000, 0);

		this.pointLight.castShadow = true;
		this.pointLight.shadow.camera.near = 1;
		this.pointLight.shadow.camera.far = 500;
		this.pointLight.shadow.camera.left = -200;
		this.pointLight.shadow.camera.right = 200;
		this.pointLight.shadow.camera.top = 200;
		this.pointLight.shadow.camera.bottom = -200;
		this.pointLight.shadow.mapSize.width = 2048;
		this.pointLight.shadow.mapSize.height = 2048;

		this.pointLight.shadow.mapSize.set(512 * 2, 512 * 2);
		this.pointLight.shadow.normalBias = 0.1;
		this.pointLight.shadow.bias = -0.0001;

		this.lightHelper = new THREE.SpotLightHelper(this.pointLight, 5, 0xFFD580 );

		this.sceneManager.scene.add(this.ambientLight);
		this.sceneManager.scene.add(this.pointLight);
		this.sceneManager.scene.add(this.lightHelper);
	}


	initCamera() 
	{
		this.sceneManager.camera.position.z = 40;
		this.sceneManager.camera.position.y = 114;
		this.sceneManager.camera.rotation.x = 13;
		
		this.sceneManager.controls.target = new THREE.Vector3(-40,70,-80);
	}

	preload3DModels() 
	{
		this.loadingPromises.push(
			this.loadModel('/static/liarsbar_static/assets/liarsbar/LiarsBarScene.glb', 'scene')
		);

		// this.loadingPromises.push(
		// 	this.loadModel('/static/liarsbar_static/assets/ace.glb', 'ace')
		// );
		// this.loadingPromises.push(
		// 	this.loadModel('/static/liarsbar_static/assets/king.glb', 'king')
		// );
		// this.loadingPromises.push(
		// 	this.loadModel('/static/liarsbar_static/assets/queen.glb', 'queen')
		// );

		return Promise.all(this.loadingPromises);
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

	initScene()
	{
		const table = this.modelsLoaded["scene"];
		table.scene.rotation.y = Math.PI / 8;
		table.scene.position.x = 0;
		table.scene.position.y = 80;
		table.scene.position.z = 50;
		table.scene.scale.set(10, 10, 10);
		this.sceneManager.scene.add(table.scene);

		table.scene.traverse((child) => {
			if (child.isMesh) {
				child.geometry.computeVertexNormals();
			  	child.castShadow = true;
			  	child.receiveShadow = true;
			}
		  });

		this.addCards("ace", 5, { x: 0, y: 0, z: 0 });
		this.addCards("king", 5, { x: 0, y: 0, z: 0 });
		this.addCards("queen", 5, { x: 0, y: 0, z: 0 });
	}

	addCards(modelName, count, basePosition) 
	{
		if (!this.modelsLoaded[modelName]) 
			return;

		const offsetY = 0.1;

		for (let i = 0; i < count; i++) {
			const card = this.modelsLoaded[modelName].scene.clone();

			if (modelName === "ace") this.aceCardsModel.push(card);
			else if (modelName === "queen") this.queenCardsModel.push(card);
			else if (modelName === "king") this.kingCardsModel.push(card);
			card.rotation.x = Math.PI;

			card.position.set(
				basePosition.x,
				basePosition.y,
				basePosition.z
			);

			card.scale.set(1, 1, 1);
			this.sceneManager.scene.add(card);
		}
	}

	showCardsAnimation() {}

	fixedUpdate() {}

	setupHashChangeDetection() {
		let currentHash = window.location.hash;

		setInterval(() => {
			if (window.location.hash !== currentHash) {
				currentHash = window.location.hash;
				console.log("User navigated to: " + currentHash);
				this.handleStateChange(currentHash);
			}
		}, 100);
	}

	handleStateChange(hash) {
		if (confirm("want to leave ?")) {
			close();
		}
	}

}

const game = new Game();
game.sceneManager.animate();
