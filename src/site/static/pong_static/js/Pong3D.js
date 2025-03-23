import SceneManager from '../../common_static/js/SceneManager.js';
import * as THREE from "https://cdn.jsdelivr.net/npm/three@latest/build/three.module.js";
import Game from './Game.js';
import PongPlayer from './utils/PongPlayer.js';

/**
 * Camera configuration settings for the scene.
 *
 * @constant
 * @type {Object}
 * @property {number} FOV - Field of view for the camera, set to 75 degrees.
 * @property {number} NEAR_PLANE - The near clipping plane distance, set to 0.1.
 * @property {number} FAR_PLANE - The far clipping plane distance, set to 1500.
 * @property {THREE.Vector3} POSITION - The initial position of the camera in the scene.
 * @property {number} ROTATION_X - The rotation angle of the camera around the X-axis, set to π/6 (30 degrees).
 */
const CAMERA_SETTINGS = {
	FOV: 75,
	NEAR_PLANE: 0.1,
	FAR_PLANE: 1500,
	POSITION: new THREE.Vector3(0, -20, 40),
	ROTATION_X: Math.PI / 6,
};

export default class Pong3D extends Game
{
	constructor()
	{
		super();

		this.style = null;
		this.sceneManager = null;
		this.ambientLight = null;
		this.pointLightMagenta = null;
		this.pointLightBlue = null;
		this.lightHelper = null;
		this.screenLight = null;
	}

	async init(player_id)
	{
		
		this.sceneManager = new SceneManager(true);
		
		Object.assign(this.sceneManager, CAMERA_SETTINGS);
		this.sceneManager.initialize(true, true);
		if (this.sceneManager.is42BadPc)
			this.style = "2.5D";
		else
			this.style = "3D";
		
		//load model
		await this.sceneManager.modelManager.loadModel({ '/static/pong_static/assets/models/Scene.glb': 'Scene' });

		//init camera setting
		this.sceneManager.camera.position.copy(CAMERA_SETTINGS.POSITION);
		this.sceneManager.camera.rotation.x = CAMERA_SETTINGS.ROTATION_X;

		//init light
		this.ambientLight = new THREE.AmbientLight(0xA2C2E9, 3.2);
		this.sceneManager.scene.add(this.ambientLight);

		super.init(player_id);
	}

	initScene(data)
	{
		super.initScene(data);

		this.ball.init(this.style);
		this.sceneManager.scene.add(this.ball.mesh);

		const room = this.sceneManager.modelManager.getModel('Scene', true);

		room.scene.scale.set(10, 10, 10);
		room.scene.position.set(800, -134, 191);
		room.scene.rotation.y = -Math.PI / 2;

		this.sceneManager.scene.add(room.scene);
		this.handleScoreSprites(this.lastScore);
	}

	AddUserToLobby(newPlayer_id, playerData, socket)
	{
		if (newPlayer_id == this.player_id && this.pongPlayer == null)
		{
			this.pongPlayer = new PongPlayer(socket, this.player_id, playerData, this.style);
			this.sceneManager.scene.add(this.pongPlayer.paddle.mesh);
		}
		else if (this.pongOpponent == null)
		{
			this.pongOpponent = new PongPlayer(null, newPlayer_id, playerData, this.style);
			this.sceneManager.scene.add(this.pongOpponent.paddle.mesh);
		}
	}

	addPlayersToScene()
	{
		if (this.pongPlayer != null)
			this.sceneManager.scene.add(this.pongPlayer.paddle.mesh);
		if (this.pongOpponent != null)
			this.sceneManager.scene.add(this.pongOpponent.paddle.mesh);
	}

	handleScoreSprites(scores) 
	{
		try 
		{
			if (!this.scoreSpritesInitialized) 
			{
				this.createTextSprite(`${scores.player1}`).then((sprite) => {
					this.player1ScoreSprite = sprite;
					this.player1ScoreSprite.position.set(-10, 18, 0);
					this.sceneManager.scene.add(this.player1ScoreSprite);
				}).catch((error) => console.error("Failed to create Player 1 sprite:", error));

				this.createTextSprite(`${scores.player2}`).then((sprite) => {
					this.player2ScoreSprite = sprite;
					this.player2ScoreSprite.position.set(10, 18, 0);
					this.sceneManager.scene.add(this.player2ScoreSprite);
				}).catch((error) => console.error("Failed to create Player 2 sprite:", error));

				this.scoreSpritesInitialized = true;
		  	} 
			else 
			{
				if (this.player1ScoreSprite)
					this.updateSpriteTexture(this.player1ScoreSprite, `${scores.player1}`);
				else 
					console.warn("Player 1 score sprite is not ready yet");

				if (this.player2ScoreSprite)
			  		this.updateSpriteTexture(this.player2ScoreSprite, `${scores.player2}`);
				else 
			  		console.warn("Player 2 score sprite is not ready yet");
			}
		}
		catch (error) {
		  console.error("An error occurred while handling score sprites:", error);
		}
	}

	createTextSprite(text) 
	{
		return new Promise((resolve, reject) => {
			const canvas = document.createElement('canvas');
			const context = canvas.getContext('2d');

			canvas.width = 256;
			canvas.height = 150;

			document.fonts.load('150px "Press Start 2P"').then(() => {
				context.font = '150px "Press Start 2P"';
				context.fillStyle = 'white';
				context.textAlign = 'center';
				context.textBaseline = 'middle';
				context.fillText(text, canvas.width / 2, canvas.height / 2);

				const texture = new THREE.CanvasTexture(canvas);
				const material = new THREE.SpriteMaterial({ map: texture });
				const sprite = new THREE.Sprite(material);
				sprite.scale.set(5, 2.5, 1);

				resolve(sprite);
		  	}).catch((error) => {
				console.error('Failed to load font:', error);
				reject(error);
		  	});
		});
	}

	updateSpriteTexture(sprite, text)
	{
		if (!sprite || !sprite.material || !sprite.material.map) 
		{
			console.warn("Sprite or texture is not defined yet.");
			return;
		}

		const texture = sprite.material.map;
		const canvas = texture.image;
		const context = canvas.getContext('2d');

		if (!context) 
		{
			console.error("Failed to get 2D context from canvas.");
			return;
		}

		context.clearRect(0, 0, canvas.width, canvas.height);

		if (document.fonts.check('150px "Press Start 2P"'))
			this.drawTextOnCanvas(context, canvas, text, texture);
		else
		{
			document.fonts.load('150px "Press Start 2P"').then(() => {
				this.drawTextOnCanvas(context, canvas, text, texture);
			}).catch((error) => {
				console.error('Failed to load font:', error);
			});
		} 
	}

	drawTextOnCanvas(context, canvas, text, texture)
	{
		context.font = '150px "Press Start 2P"';
		context.fillStyle = 'white';
		context.textAlign = 'center';
		context.textBaseline = 'middle';
		context.fillText(text, canvas.width / 2, canvas.height / 2);

		texture.needsUpdate = true;
	}

	animate()
	{
		this.sceneManager.animate();
	}

	reset()
	{
		super.reset();

		if (this.sceneManager != null)
		{
			if (this.pongPlayer != null)
			{
			this.pongPlayer.deletePaddle(this.sceneManager.scene);
			delete this.pongPlayer;
			this.pongPlayer = null;
			}
			if (this.pongOpponent != null)
			{
			this.pongOpponent.deletePaddle(this.sceneManager.scene);
			delete this.pongOpponent;
			this.pongOpponent = null;
			}
		}

		this.handleScoreSprites({"player1": 0, "player2": 0});
	}

	game_ended(isGamefinished, pathToRedirect)
	{
		super.game_ended(isGamefinished, pathToRedirect);

		if (this.sceneManager) 
		{
			this.sceneManager.dispose();
			this.sceneManager = null;
		}
	}
}