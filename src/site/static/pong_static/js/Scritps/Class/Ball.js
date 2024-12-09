import * as THREE from '../../../../lib/threejs/src/Three.js';

export default class Ball 
{
	constructor(radius = 1) 
	{
	this.newPosX = 0;
	this.newPosY = 0;

	const geometry = new THREE.SphereGeometry(radius, 32, 32);
	const material = new THREE.MeshStandardMaterial({ color: 'white' });

	this.mesh = new THREE.Mesh(geometry, material);
	this.mesh.position.set(0, 0, 0);
	}

	updatePosition(newPos)
	{
		this.newPosX = newPos.x;
		this.newPosY = newPos.y;
	}

  	syncPosition()
	{
		this.mesh.position.x = this.ball.newPosX;
		this.mesh.position.y = this.ball.newPosY;
	}
}
