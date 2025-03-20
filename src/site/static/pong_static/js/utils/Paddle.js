import * as THREE from "https://cdn.jsdelivr.net/npm/three@latest/build/three.module.js";

/**
 * Represents a paddle object in a 3D scene.
 * @class
 */
export default class Paddle {
	/**
	 * Creates an instance of the Paddle class.
	 * @param {number} [width=10] - The width of the paddle.
	 * @param {number} [height=50] - The height of the paddle.
	 * @param {number} [depth=0.1] - The depth of the paddle.
	 * @param {number} [color=0x00ff00] - The color of the paddle.
	 */
	constructor(width = 10, height = 50, depth = 0.1, color = 0x00ff00,  is3D = false) {
		this.is3D = is3D;
		if (this.is3D) {
            this.geometry = new THREE.BoxGeometry(width, height, depth);
        } else {
            this.geometry = new THREE.PlaneGeometry(width, height);
        }
		this.material = new THREE.MeshStandardMaterial({ color: color });

		this.mesh = new THREE.Mesh(this.geometry, this.material);
		this.mesh.position.set(0, 0, 0);
	}

	/**
	 * Updates the position of the paddle.
	 * @param {number} speed - The speed at which the paddle moves.
	 * @param {number} dt - The delta time to ensure smooth movement.
	 */
	move(speed, dt) 
	{
		this.mesh.position.y += speed * dt;
	}

	/**
	 * Constrains the paddle's movement within the defined bounds.
	 * @param {Object} bounds - The bounds object defining the limits for movement.
	 * @param {number} bounds.xMin - The minimum x-coordinate for the paddle.
	 * @param {number} bounds.xMax - The maximum x-coordinate for the paddle.
	 * @param {number} bounds.yMin - The minimum y-coordinate for the paddle.
	 * @param {number} bounds.yMax - The maximum y-coordinate for the paddle.
	 */

	constrainMovement(bounds) 
	{
		const halfWidth = this.mesh.geometry.parameters.width / 2;
		const halfHeight = this.mesh.geometry.parameters.height / 2;
		const pos = this.mesh.position;
		
		if (pos.x - halfWidth < bounds.xMin)
			pos.x = bounds.xMin + halfWidth;
		if (pos.x + halfWidth > bounds.xMax)
			pos.x = bounds.xMax - halfWidth;
		if (pos.y - halfHeight < bounds.yMin)
			pos.y = bounds.yMin + halfHeight;
		if (pos.y + halfHeight > bounds.yMax) 
			pos.y = bounds.yMax - halfHeight;
	}

	deleteMesh(scene) 
	{
		if (this.mesh) 
		{
			if (scene) scene.remove(this.mesh);
			this.mesh.geometry.dispose();
			this.mesh.material.dispose();
			this.mesh = null;
		}
	}
	
}
