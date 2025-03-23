import * as THREE from "https://cdn.jsdelivr.net/npm/three@latest/build/three.module.js";

export default class Ball 
{
	/**
	 * Creates a new Ball instance.
	 *
	 * @constructor
	 * @param {number} [radius=1] - The radius of the ball.
	 * @param {string} [style='2D'] - The rendering style: '2D', '2.5D', or '3D'.
	 */
	constructor(radius = 1) {
		this.radius = radius;
		this.position = { x: 0, y: 0 };
		this.mesh = null;
	}

	init(style)
	{
		this.style = style.toUpperCase();

		switch (this.style) 
		{
			case '3D':
			  this.geometry = new THREE.IcosahedronGeometry(this.radius, 1);
			  this.material = new THREE.MeshBasicMaterial({ color: 'white' });
			  this.mesh = new THREE.Mesh(this.geometry, this.material);
			  this.mesh.position.set(0, 0, 0);
			  break;
			case '2.5D':
			  this.geometry = new THREE.PlaneGeometry(this.radius * 2, this.radius * 2);
			  this.material = new THREE.MeshBasicMaterial({ color: 'white', side: THREE.DoubleSide });
			  this.mesh = new THREE.Mesh(this.geometry, this.material);
			  this.mesh.position.set(0, 0, 0);
			  break;
			case '2D':
				let newX = (this.position.x + 20) * 20;
				let newY = 600 - ((this.position.y + 15) * 20);
				this.position = { x: newX, y: newY};
				break;
			default:
			  console.warn("Unhandled style:", this.style);
		}
	}

	/**
	 * Updates the new position of the ball (does not immediately apply it to the mesh).
	 * 
	 * @param {{x: number, y: number}} newPos - The new position coordinates.
	 */
	updatePosition(newPos) 
	{
		if (this.style === '2D')
		{
			let x = (newPos.x + 20) * 20;
			let y = 600 - ((newPos.y + 15) * 20);
			this.position = { x: x, y: y };
		}
		else
			this.position = { x: newPos.x, y: newPos.y};
		
		if (this.mesh)
			this.mesh.position.set(newPos.x, newPos.y, 0);
	}

	render2D(ctx) 
	{
		ctx.fillStyle = "#fff";
		ctx.beginPath();
		ctx.arc(this.position.x, this.position.y, this.radius * 20, 0, Math.PI * 2);
		ctx.fill();
	}
}