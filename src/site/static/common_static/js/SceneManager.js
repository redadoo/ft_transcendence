import * as THREE from '../../lib/threejs/src/Three.js';
import { OrbitControls } from '../../lib/threejs/examples/jsm/controls/OrbitControls.js';
import Stats from '../../lib/threejs/examples/jsm/libs/stats.module.js';
import ModelManager from './ModelManager.js';
import AudioManager from './AudioManager.js';

/**
 * SceneManager is a class to manage a 3D scene using Three.js. It handles
 * initialization of the scene, camera, renderer, and controls, as well as
 * managing animations and interactions.
 *
 * @export
 * @class SceneManager
 */
export default class SceneManager 
{
	/**
	 * Creates an instance of SceneManager.
	 * @param {boolean} needOrbital - Whether to use orbital controls for the scene.
	 */
	constructor(needOrbital) {
		this.scene = null;
		this.camera = null;
		this.renderer = null;
		this.clock = null;
		this.stats = null;
		this.controls = null;

		this.ambientLight = null;
		this.pointLight = null;
		this.directionalLight = null;

		this.modelManager = null;
		this.audioManager = null;

		this.fov = 45;
		this.nearPlane = 1;
		this.farPlane = 10000;

		this.needOrbital = needOrbital;
		this.accumulatedTime = 0;
		this.fixedTimeStep = 1 / 60;

		this.externalFunction = null;
	}

	/**
	 * Sets an external function to be called during the animation loop.
	 * @param {Function} func - The function to set.
	 */
	setExternalFunction(func) 
	{
		if (typeof func === "function")
			this.externalFunction = func;
		else
			console.warn("setExternalFunction expects a valid function.");
	}

	/**
	 * Configures the camera properties.
	 * @param {Object} config - The camera configuration.
	 * @param {number} [config.fov] - The field of view.
	 * @param {number} [config.nearPlane] - The near clipping plane.
	 * @param {number} [config.farPlane] - The far clipping plane.
	 */
	setCameraConfig({ fov, nearPlane, farPlane }) 
	{
		this.fov = fov || this.fov;
		this.nearPlane = nearPlane || this.nearPlane;
		this.farPlane = farPlane || this.farPlane;
	}

	/**
	 * Sets the state of the camera.
	 * @param {Object} state - The camera state.
	 * @param {THREE.Vector3} state.position - The camera position.
	 * @param {THREE.Quaternion} state.quaternion - The camera rotation.
	 * @param {THREE.Vector3} [state.target] - The target position for controls.
	 * @throws {Error} If the camera is not initialized.
	 */
	setCameraState(position, quaternion, target ) 
	{
		if (!this.camera) throw new Error("Camera must be initialized.");

		this.camera.position.copy(position);
		this.camera.quaternion.copy(quaternion);

		if (this.controls && target) this.controls.target.copy(target);
	}

	/**
	 * Initializes the scene manager components.
	 * @param {boolean} [needModelManager=false] - Whether to initialize a model manager.
	 * @param {boolean} [needAudioManager=false] - Whether to initialize an audio manager.
	 */
	initialize(needModelManager = false, needAudioManager = false) 
	{
		this.initializeScene();
		this.initializeRenderer(THREE.PCFSoftShadowMap);
		this.initializeCamera();
		this.initializeStats();

		if (this.needOrbital) this.controls = new OrbitControls(this.camera, this.renderer.domElement);
		if (needModelManager) this.modelManager = new ModelManager();
		if (needAudioManager) this.audioManager = new AudioManager(this.camera);

		window.addEventListener("resize", this.onWindowResize.bind(this));
	}

	/**
	 * Initializes the scene and clock.
	 */
	initializeScene() 
	{
		this.scene = new THREE.Scene();
		this.clock = new THREE.Clock();
	}

	/**
	 * Initializes the renderer with shadow mapping.
	 * @param {Object} options - Renderer options.
	 * @param {number} options.shadowMapType - Shadow map type.
	 */
	initializeRenderer(shadowMapType) 
	{
		this.renderer = new THREE.WebGLRenderer({ antialias: true });
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		this.renderer.shadowMap.enabled = true;
		this.renderer.shadowMap.type = shadowMapType;
		document.body.appendChild(this.renderer.domElement);
	}

	/**
	 * Initializes the camera with perspective settings.
	 */
	initializeCamera() 
	{
		this.camera = new THREE.PerspectiveCamera(
			this.fov,
			window.innerWidth / window.innerHeight,
			this.nearPlane,
			this.farPlane
		);
		this.camera.position.z = 48;
	}

	/**
	 * Initializes performance stats for the scene.
	 */
	initializeStats() 
	{
		this.stats = Stats();
		document.body.appendChild(this.stats.dom);
	}

	/**
	 * Starts the animation loop.
	 */
	animate() 
	{
		const animateLoop = () => {
			const deltaTime = this.clock.getDelta();
			this.accumulatedTime += deltaTime;

			while (this.accumulatedTime >= this.fixedTimeStep) 
			{
				if (this.externalFunction) this.externalFunction(this.fixedTimeStep);
				this.accumulatedTime -= this.fixedTimeStep;
			}
			
			if(this.renderer == null)
				return;

			this.render();
			this.stats.update();
			if (this.needOrbital) this.controls.update();

			window.requestAnimationFrame(animateLoop);
		};

		animateLoop();
	}

	/**
	 * Renders the scene using the camera.
	 */
	render() 
	{
		this.renderer.render(this.scene, this.camera);
	}

	/**
	 * Adjusts the camera and renderer on window resize.
	 */
	onWindowResize() 
	{
		if (!this.camera || !this.renderer) return;

		this.camera.aspect = window.innerWidth / window.innerHeight;
		this.camera.updateProjectionMatrix();
		this.renderer.setSize(window.innerWidth, window.innerHeight);
	}

	/**
	 * Disposes resources and removes event listeners.
	 */
	dispose() 
	{
		this.scene = null;
		this.camera = null;
		if (this.renderer) 
		{
			this.renderer.dispose();
			this.renderer = null;
		}
		if (this.controls)
		{
			this.controls.dispose();
			this.controls = null;
		} 
		if (this.stats)
		{
			document.body.removeChild(this.stats.dom);
			this.stats = null;
		}
		window.removeEventListener("resize", this.onWindowResize);
	}
}
