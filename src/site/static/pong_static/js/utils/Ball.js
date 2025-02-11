import * as THREE from '../../../lib/threejs/src/Three.js';

export default class Ball 
{
	/**
	 * Creates a new Ball instance.
	 * 
	 * @constructor
	 * @param {number} [radius=1] - The radius of the ball.
	 */
	constructor(radius = 1) 
	{
		this.newPosX = 0;
		this.newPosY = 0;

		const geometry = new THREE.SphereGeometry(radius, 32, 32);
		
		const material = new THREE.MeshStandardMaterial({ 
			color: 'white', 
			
		});

		this.mesh = new THREE.Mesh(geometry, material);
		this.mesh.position.set(0, 0, 0);
		
	}

	/**
	 * Updates the new position of the ball (does not immediately apply it to the mesh).
	 * 
	 * @param {{x: number, y: number}} newPos - The new position coordinates.
	 */
	updatePosition(newPos)
	{
		this.newPosX = newPos.x;
		this.newPosY = newPos.y;
	}

	/**
	 * Syncs the ball's mesh position with the updated coordinates.
	 */
  	syncPosition()
	{
		this.mesh.position.x = this.newPosX;
		this.mesh.position.y = this.newPosY;
	}
}
