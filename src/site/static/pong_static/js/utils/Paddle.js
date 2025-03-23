	import * as THREE from "https://cdn.jsdelivr.net/npm/three@latest/build/three.module.js";

	export default class Paddle {
	/**
	 * Creates an instance of the Paddle class.
	 * 
	 * @param {number} [width=10] - The width of the paddle.
	 * @param {number} [height=50] - The height of the paddle.
	 * @param {number} [depth=0.1] - The depth of the paddle (used in 3D).
	 * @param {number} [color=0x00ff00] - The color of the paddle (hex).
	 * @param {string} [style='2D'] - The rendering style: '3D', '2.5D', or '2D'.
	 */
	constructor(width = 10, height = 50, depth = 0.1, color = 0x00ff00, style) {
		this.mesh = null;
		this.width = width;
		this.height = height;
		this.depth = depth;
		this.color = color;
		this.style = style.toUpperCase();
		this.position = { x: 0, y: 0 };
		
		this.init();
	}

	init() 
	{
		switch (this.style) 
		{
			case '3D':
				this.geometry = new THREE.BoxGeometry(this.width, this.height, this.depth);
				this.material = new THREE.MeshStandardMaterial({ color: this.color });
				this.mesh = new THREE.Mesh(this.geometry, this.material);
				this.mesh.position.set(0, 0, 0);
				break;
			case '2.5D':
				this.geometry = new THREE.PlaneGeometry(this.width, this.height);
				this.material = new THREE.MeshStandardMaterial({ color: this.color, side: THREE.DoubleSide });
				this.mesh = new THREE.Mesh(this.geometry, this.material);
				this.mesh.position.set(0, 0, 0);
				break;
			case '2D':
				break;
			default:
				console.warn("Unhandled style:", this.style);
		}
	}

	/**
	 * Renders the paddle on a 2D canvas context.
	 * This method is only used when the style is '2D'.
	 * 
	 * @param {CanvasRenderingContext2D} ctx - The 2D rendering context.
	 */
	render2D(ctx) 
	{
		let colorHex = '#' + this.color.toString(16).padStart(6, '0');
		ctx.fillStyle = colorHex;

		let wi =  this.width * 20;
		let ge =  this.height * 20;

		ctx.fillRect(
			this.position.x - wi / 2,
			this.position.y - ge / 2,
			wi,
			ge
		);
	}

	/**
	 * Cleans up the Three.js mesh resources.
	 * @param {THREE.Scene} scene - The Three.js scene from which to remove the mesh.
	 */
	deleteMesh(scene) 
	{
		if (this.style !== '2D' && this.mesh) 
		{
			if (scene) 
				scene.remove(this.mesh);
		
			this.mesh.geometry.dispose();
			this.mesh.material.dispose();
			this.mesh = null;
		}
	}
}
