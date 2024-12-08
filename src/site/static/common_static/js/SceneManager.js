const ThreejsPath = "../../lib/threejs";

import * as THREE from '../../lib/threejs/src/Three.js';
import { OrbitControls } from '../../lib/threejs/examples/jsm/controls/OrbitControls.js';
import Stats from '../../lib/threejs/examples/jsm/libs/stats.module.js';
import { TextGeometry } from '../../lib/threejs/examples/jsm/geometries/TextGeometry.js';
import { FontLoader } from '../../lib/threejs/examples/jsm/loaders/FontLoader.js';
import { GLTFLoader } from '../../lib/threejs/examples/jsm/loaders/GLTFLoader.js';

export default class SceneManager {
  
  constructor(needOrbital = true) {
	
	//font variable
	this.fontPath = "/static/lib/threejs/examples/fonts/";
	this.fontName = 'optimer', 
	this.fontWeight = 'bold';

	this.group = undefined; 
	this.textMesh1 = undefined; 
	this.materials = undefined;

	this.bevelEnabled = true,
	this.font = undefined,

	this.depth = 20,
	this.size = 70,
	this.hover = 30,
	this.curveSegments = 4,
	this.bevelThickness = 2,
	this.bevelSize = 1.5;


	this.fontMap = {
	  'helvetiker': 0,
	  'optimer': 1,
	  'gentilis': 2,
	  'droid/droid_sans': 3,
	  'droid/droid_serif': 4

	};

	this.weightMap = {

	  'regular': 0,
	  'bold': 1

	};

	this.reverseFontMap = [];
	this.reverseWeightMap = [];
	this.fontIndex = 1;

	//
	this.gltfLoader = undefined;
	this.loadingPromises = [];
	this.modelsLoaded = {};

	this.scene = undefined;
	this.camera = undefined;
	this.renderer = undefined;

	this.clock = undefined;
	this.stats = undefined;
	this.controls = undefined;

	this.ambientLight = undefined;
	this.pointLight = undefined;
	this.directionalLight = undefined;

	this.externalFunction = null;
	this.lightHelper = undefined;
	this.needOrbital = needOrbital;

	this.fov = 45;
	this.nearPlane = 1;
	this.farPlane = 1000;

	this.accumulatedTime = 0;
	this.fixedTimeStep = 1 / 60;

	//audio
	this.audio = undefined;
	this.listener = undefined;
	this.audioLoader = undefined;
	this.audioContext = undefined;

  }

	setCameraValue(fov, nearPlane, farPlane)
	{
		this.fov = fov;
		this.nearPlane = nearPlane;
		this.farPlane = farPlane;
	}

	setCameraTransform(position, rotation, target) 
	{
	if (this.needOrbital && target) 
		this.controls.target.copy(target);
	else if (!this.needOrbital && target) 
		throw new Error("An orbital camera is required to set a target.");

	this.camera.position.copy(position);
	this.camera.rotation.set(rotation.x, rotation.y, rotation.z);
	}

	setCameraState(position, quaternion, target) 
	{
	if (!this.camera)
		throw new Error("Camera must be initialized before setting its state.");

	this.camera.position.copy(position);
	this.camera.quaternion.copy(quaternion);

	if (this.controls && target) 
		this.controls.target.copy(target);
	}

	setExternalFunction(func) 
	{
	if (typeof func === "function") 
		this.externalFunction = func;
	else 
		console.warn("setExternalFunction expects a valid function.");
	}

	initialize() 
	{
		this.scene = new THREE.Scene();
		this.clock = new THREE.Clock();

		this.renderer = new THREE.WebGLRenderer({ antialias: true });
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		this.renderer.shadowMap.enabled = true;
			this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

		this.camera = new THREE.PerspectiveCamera(
			this.fov,
			window.innerWidth / window.innerHeight,
			this.nearPlane,
			this.farPlane
		);

		this.camera.position.z = 48;
		this.stats = Stats();

		document.body.appendChild(this.stats.dom);
		document.body.appendChild(this.renderer.domElement);

		if (this.needOrbital)
			this.controls = new OrbitControls(this.camera, this.renderer.domElement);

		window.addEventListener("resize", () => this.onWindowResize(), false);
	}

	animate() {
	window.requestAnimationFrame(this.animate.bind(this));

	const deltaTime = this.clock.getDelta();
	this.accumulatedTime += deltaTime;

	while (this.accumulatedTime >= this.fixedTimeStep) 
	{
		if (this.externalFunction) 
		this.externalFunction(this.fixedTimeStep);
		this.accumulatedTime -= this.fixedTimeStep;
	}

	this.render();
	this.stats.update();

	if (this.needOrbital)
		this.controls.update();
	}

	render() 
	{
	this.renderer.render(this.scene, this.camera);
	}

	onWindowResize() {
	this.renderer.setSize(window.innerWidth, window.innerHeight);
	this.camera.updateProjectionMatrix();
	this.camera.aspect = window.innerWidth / window.innerHeight;
	}

	initTextVar()
	{
	if (this.scene == undefined || this.scene == null)
		throw new Error("scene need to be initialized");

	this.materials = [
		new THREE.MeshPhongMaterial( { color: 0xffffff, flatShading: true } ), // front
		new THREE.MeshPhongMaterial( { color: 0xffffff } ) // side
	];

	this.group = new THREE.Group();
	this.group.position.y = 100;

	this.scene.add( this.group );

	this.loadFont()
	}

	loadFont() {
	this.fontLoader = new FontLoader();
	this.fontLoader.load(
		this.fontPath + this.fontName + "_" + this.fontWeight + ".typeface.json",
		(response) => {
		this.font = response;
		this.refreshText();
		},
		undefined,
		(error) => {
		console.error("Error loading font:", error);
		}
	);
	}


	refreshText() {
	this.group.remove(this.textMesh1);

	if (!this.text) return;

	this.createText();
	}

	createText(text, position, rotation) 
	{
	textGeo = new TextGeometry( text, {

		font: this.font,

		size: this.size,
		depth: this.depth,
		curveSegments: this.curveSegments,

		bevelThickness: this.bevelThickness,
		bevelSize: this.bevelSize,
		bevelEnabled: this.bevelEnabled

	});

	textGeo.computeBoundingBox();

	const centerOffset = - 0.5 * ( textGeo.boundingBox.max.x - textGeo.boundingBox.min.x );

	textMesh1 = new THREE.Mesh( textGeo, this.materials );

	textMesh1.position.copy(position);
	textMesh1.position.copy(rotation);

	this.group.add( textMesh1 );
	}

	initModelLoader()
	{
	this.gltfLoader = new GLTFLoader();
	}

	loadModel(models)
	{
		for (const [key, value] of Object.entries(models)) {
			this.loadingPromises.push(this._loadModel(key, value)
			);
		}
		return Promise.all(this.loadingPromises);
	}

	_loadModel(path, modelName) 
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

	initAudioVar()
	{
		this.audioLoader = new THREE.AudioLoader();
		this.listener = new THREE.AudioListener();
		this.audioContext = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: 'interactive' });
		THREE.AudioContext.setContext(this.audioContext);
		this.audio = new THREE.Audio(this.listener);
		this.camera.add(this.listener);
	}

	playAudio(audioPath) 
	{
		const loadAndPlayAudio = () => {
			this.audioLoader.load(audioPath, (buffer) => {
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

		// Loading and playing the audio
		this.audioLoader.load(audioPath, (buffer) => {
			if (buffer) {
				this.audio.setBuffer(buffer);
				this.audio.setLoop(true);
				this.audio.setVolume(0);
				this.audio.play();
				console.log("Audio autoplay (muted) started.");
				setTimeout(() => this.audio.setVolume(1.0), 1);
			}
			else {
				console.error("Audio buffer not loaded.");
			}
		});
	}

}
