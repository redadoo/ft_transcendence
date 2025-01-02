import { GLTFLoader } from '../../lib/threejs/examples/jsm/loaders/GLTFLoader.js';

/**
 * Manages the loading, retrieval, and unloading of 3D models using a GLTF loader.
 */
export default class ModelManager 
{
    /**
     * Initializes the `ModelManager`.
     * Contains a GLTF loader and caches loaded models.
     */
    constructor() {
        this.gltfLoader = null;
        this.loadingPromises = [];
        this.modelsLoaded = {};
    }

    /**
     * Ensures the GLTF loader is initialized before loading models.
     * @private
     */
    _ensureLoaderInitialized() 
	{
        if (!this.gltfLoader) this.gltfLoader = new GLTFLoader();
    }

    /**
     * Retrieves a loaded model by name.
     * @param {string} name - The name of the model to retrieve.
     * @returns {Object|null} The loaded model or null if not found.
     */
    getModel(name) 
	{
        const model = this.modelsLoaded[name];
        if (!model)
		{
            console.error(`Model "${name}" is not loaded! Available models:`, Object.keys(this.modelsLoaded));
            throw new Error('Model not found');
        }
        return model;
    }

    /**
     * Creates a clone of a loaded model.
     * @param {string} name - The name of the model to clone.
     * @returns {Object|null} A clone of the model or null if not found.
     */
    getClone(name) 
	{
        const model = this.getModel(name);
        return model ? model.scene.clone() : null;
    }

    /**
     * Loads multiple models asynchronously.
     * @param {Object} models - A dictionary where keys are file paths and values are model names.
     * @param {Function} [onProgress] - Optional callback for tracking loading progress.
     * @param {Function} [onCustomProcess] - Optional callback for custom processing of each loaded model.
     * @returns {Promise<void[]>} Resolves when all models are loaded.
     */
    loadModel(models, onProgress, onCustomProcess) 
	{
        this._ensureLoaderInitialized();
        this.loadingPromises = [];

        let loadedCount = 0;
        const totalCount = Object.keys(models).length;

        for (const [path, modelName] of Object.entries(models)) 
		{
            this.loadingPromises.push(
                this._loadModel(path, modelName).then((gltfScene) => {
                    loadedCount++;
                    if (onProgress) 
                        onProgress(loadedCount / totalCount);
                    if (onCustomProcess) 
                        onCustomProcess(gltfScene, modelName);
                })
            );
        }

        return Promise.all(this.loadingPromises);
    }

    /**
     * Loads a single model and caches it by name.
     * @private
     * @param {string} path - Path to the model file.
     * @param {string} modelName - Name to use for caching the model.
     * @returns {Promise<Object>} Resolves with the loaded model.
     */
    _loadModel(path, modelName) 
	{
        if (!path || !modelName) 
            return Promise.reject(new Error(`Invalid path or modelName: ${path}, ${modelName}`));

        if (this.modelsLoaded[modelName]) 
		{
            console.warn(`Model "${modelName}" is already loaded.`);
            return Promise.resolve(this.modelsLoaded[modelName]);
        }

        return new Promise((resolve, reject) => {
            this.gltfLoader.load(
                path,
                (gltfScene) => {
                    this.modelsLoaded[modelName] = gltfScene;
                    this._applyShadows(gltfScene.scene);
                    console.log(`Model "${modelName}" successfully loaded.`);
                    resolve(gltfScene);
                },
                undefined,
                (error) => {
                    console.error(`Error loading model "${modelName}":`, error);
                    reject(error);
                }
            );
        });
    }

    /**
     * Applies shadow settings to all meshes in a scene.
     * @private
     * @param {Object} scene - The scene to traverse and apply shadow settings.
     */
    _applyShadows(scene) 
	{
        scene.traverse((child) => {
            if (child.isMesh) 
			{
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
    }

    /**
     * Unloads a model from memory.
     * @param {string} name - The name of the model to unload.
     */
    unloadModel(name) 
	{
        if (this.modelsLoaded[name]) 
		{
            delete this.modelsLoaded[name];
        } 
		else 
            console.warn(`Model "${name}" is not loaded and cannot be unloaded.`);
    }
}
