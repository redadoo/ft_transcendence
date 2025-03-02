import * as THREE from "https://cdn.jsdelivr.net/npm/three@latest/build/three.module.js";
import { TextGeometry } from "https://cdn.jsdelivr.net/npm/three@latest/examples/jsm/geometries/TextGeometry.js";
import { FontLoader } from "https://cdn.jsdelivr.net/npm/three@latest/examples/jsm/loaders/FontLoader.js";


export default class TextManager {
	/**
	 * Initializes the TextManager with default or provided settings.
	 * @param {THREE.Scene} scene - The scene to which text objects will be added.
	 * @param {Object} [options={}] - Configuration options for the text.
	 */
	constructor(scene, options = {}) 
	{
		if (!scene) throw new Error("A THREE.Scene instance is required.");

		this.scene = scene;

		// Font configuration
		this.fontPath = options.fontPath || "/static/lib/threejs/examples/fonts/";
		this.fontName = options.fontName || 'optimer';
		this.fontWeight = options.fontWeight || 'bold';
		this.font = null;

		// Text appearance settings
		this.depth = options.depth || 20;
		this.size = options.size || 70;
		this.curveSegments = options.curveSegments || 4;
		this.bevelEnabled = options.bevelEnabled ?? true;
		this.bevelThickness = options.bevelThickness || 2;
		this.bevelSize = options.bevelSize || 1.5;

		// Group and materials
		this.group = null;
		this.materials = [
			new THREE.MeshPhongMaterial({ color: 0xffffff, flatShading: true }), // Front
			new THREE.MeshPhongMaterial({ color: 0xffffff }) // Side
		];
	}

	/**
	 * Initializes the text manager by creating a group and loading the font.
	 */
	initTextVar() 
	{
		this.group = new THREE.Group();
		this.group.position.y = 100;

		this.scene.add(this.group);
		this.loadFont();
	}

	/**
	 * Loads the font using the FontLoader and refreshes the text.
	 */
	loadFont() 
	{
		const fontLoader = new FontLoader();
		const fontURL = `${this.fontPath}${this.fontName}_${this.fontWeight}.typeface.json`;

		fontLoader.load(
			fontURL,
			(font) => {
				this.font = font;
			},
			undefined,
			(error) => {
				console.error("Error loading font:", error);
			}
		);
	}

	/**
	 * Creates a new text mesh and adds it to the group.
	 * @param {string} text - The text to display.
	 * @param {THREE.Vector3} position - The position of the text.
	 * @param {THREE.Vector3} rotation - The rotation of the text.
	 */
	createText(text, position = new THREE.Vector3(), rotation = new THREE.Vector3()) 
	{
		if (!this.font) 
		{
			console.error("Font is not loaded. Call `loadFont` before creating text.");
			return;
		}

		const textGeo = new TextGeometry(text, {
			font: this.font,
			size: this.size,
			depth: this.depth,
			curveSegments: this.curveSegments,
			bevelThickness: this.bevelThickness,
			bevelSize: this.bevelSize,
			bevelEnabled: this.bevelEnabled
		});

		textGeo.computeBoundingBox();
		const centerOffset = -0.5 * (textGeo.boundingBox.max.x - textGeo.boundingBox.min.x);

		const textMesh = new THREE.Mesh(textGeo, this.materials);
		textMesh.position.copy(position);
		textMesh.rotation.copy(rotation);

		this.group.add(textMesh);
	}

	/**
	 * Clears the current text mesh from the group.
	 */
	clearText() 
	{
		while (this.group.children.length > 0) 
		{
			const child = this.group.children[0];
			this.group.remove(child);
			child.geometry.dispose();
			child.material.dispose();
		}
	}

	/**
	 * Updates the text with new content, position, and rotation.
	 * @param {string} text - The new text content.
	 * @param {THREE.Vector3} position - The new position of the text.
	 * @param {THREE.Vector3} rotation - The new rotation of the text.
	 */
	updateText(text, position = new THREE.Vector3(), rotation = new THREE.Vector3()) 
	{
		this.clearText();
		this.createText(text, position, rotation);
	}
}
