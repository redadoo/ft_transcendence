import * as THREE from "https://cdn.jsdelivr.net/npm/three@latest/build/three.module.js";

export default class Ball 
{
	/**
	 * Creates a new Ball instance.
	 * 
	 * @constructor
	 * @param {number} [radius=1] - The radius of the ball.
	 */
	constructor(radius = 1, is3D = false) 
	{
		this.is3D = is3D;
		this.newPosition = new THREE.Vector3(0, 0, 0);
		if (this.is3D) {
            const geometry = new THREE.IcosahedronGeometry(radius, 1);
            const material = new THREE.MeshBasicMaterial({ color: 'white' });
            this.mesh = new THREE.Mesh(geometry, material);
        } else {
            const geometry = new THREE.PlaneGeometry(radius * 2, radius * 2);
            const material = new THREE.MeshBasicMaterial({ color: 'white', side: THREE.DoubleSide });
            this.mesh = new THREE.Mesh(geometry, material);
        }
		this.mesh.position.set(0, 0, 0);
	}

	/**
	 * Updates the new position of the ball (does not immediately apply it to the mesh).
	 * 
	 * @param {{x: number, y: number}} newPos - The new position coordinates.
	 */
	updatePosition(newPos) 
	{
		this.newPosition.set(newPos.x, newPos.y, 0);
	}

	/**
	 * Syncs the ball's mesh position with the updated coordinates.
	 */
	syncPosition() 
	{
		this.mesh.position.copy(this.newPosition);
	}

	setPosition(x, y) 
	{
		this.mesh.position.set(x, y, 0);
	}
}
