const ThreejsPath = "../../lib/threejs";

import * as THREE from '../../lib/threejs/src/Three.js';
import { OrbitControls } from '../../lib/threejs/examples/jsm/controls/OrbitControls.js';
import Stats from '../../lib/threejs/examples/jsm/libs/stats.module.js';

export default class SceneManager {
  
  constructor(needOrbital = true) {
    
		this.gltfLoader = undefined;

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
    if (!this.camera) {
      throw new Error("Camera must be initialized before setting its state.");
    }
    this.camera.position.copy(position);
    this.camera.quaternion.copy(quaternion);

    if (this.controls && target) {
      this.controls.target.copy(target);
    }
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
}
