import * as THREE from '../../lib/threejs/src/Three.js';
import SceneManager from '../../common_static/js/SceneManager.js';

class Game {
	constructor() {

		//light
		this.ambientLight = undefined;
		this.pointLight = undefined;
		this.lightHelper = undefined;
		
		//socket
		this.gameSocket = undefined;

		this.initGame();
	}

	initGame()
	{
		this.sceneManager = new SceneManager(true);
		
		this.sceneManager.initialize();
		this.sceneManager.setCameraState(
			new THREE.Vector3(-34.619, 96.642, 233.726),
			new THREE.Quaternion(-0.188, 0.223, 0, 0.95),
			new THREE.Vector3(-173.113, -31.705, -47.019)
		  );
		
		this.initLights();
		this.initWebSocket();
		this.sceneManager.initModelLoader();
		
		this.sceneManager.loadModel({
			'/static/liarsbar_static/assets/liarsbar/LobbyScene2.glb' : 'LobbyScene',
			'/static/liarsbar_static/assets/liarsbar/human.glb' : 'human'
		}).then(() => {this.setupModels();})
		

		this.sceneManager.setExternalFunction(() => this.fixedUpdate());

		this.sceneManager.initTextVar();
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

			if (data.type == "init_lobby")
			{

			}
			else if (data.type == "add_player_to_lobby")
			{

			}
			else if (data.type == "init_game")
			{

			}
			else if (data.type == "state_update")
			{

			}
		} 
		catch (error) {
			console.error("Error processing WebSocket message:", error);
		}
	}

	initLights()
	{
		this.ambientLight = new THREE.AmbientLight(0xb0e0e6,10.1); //0.1

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
		this.pointLight.shadow.mapSize.width = 2048;
		this.pointLight.shadow.mapSize.height = 2048;

		this.pointLight.shadow.mapSize.set(512 * 2, 512 * 2);
		this.pointLight.shadow.normalBias = 0.1;
		this.pointLight.shadow.bias = -0.0001;

		this.sceneManager.scene.add(this.ambientLight);
		this.sceneManager.scene.add(this.pointLight);
	}


	setupModels()
	{
		const LobbyScene = this.sceneManager.modelsLoaded["LobbyScene"];
		LobbyScene.scene.scale.set(10, 10, 10);
		this.sceneManager.scene.add(LobbyScene.scene);
		LobbyScene.scene.rotation.y = 90;

		const human = this.sceneManager.modelsLoaded["human"];
		human.scene.scale.set(0.3, 0.3, 0.3);
		human.scene.position.x = -280;
		human.scene.position.z = 100;
		human.scene.rotation.y = Math.PI / 8;
		this.sceneManager.scene.add(human.scene);
	}

	fixedUpdate() {}

}

const game = new Game();
game.sceneManager.animate();
