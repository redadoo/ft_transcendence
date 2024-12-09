import * as THREE from '../../../../lib/threejs/src/Three.js';

export default class Paddle {
  constructor(width = 10, height = 50, depth = 0.1, color = 0x00ff00) {
	// Creiamo la geometria della racchetta (un box rettangolare)
	const geometry = new THREE.BoxGeometry(width, height, depth);
	
	// Applichiamo un materiale base (può essere personalizzato)
	const material = new THREE.MeshStandardMaterial({ color: color });
	
	// Creiamo il mesh della racchetta
	this.mesh = new THREE.Mesh(geometry, material);
	
	// Posizione iniziale della racchetta (es. si trova sul piano XY, a una certa distanza)
	this.mesh.position.set(0, 0, 0);
  }

  // Metodo per aggiornare la posizione della racchetta
  move(speed, dt) {
	this.mesh.position.y += speed * dt; // Muovi la racchetta in base alla velocità
  }

  // Metodo per limitare il movimento della racchetta all'interno dei bounds (facoltativo)
  constrainMovement(bounds) {
	// Mantiene la racchetta entro i limiti definiti da "bounds"
	if (this.mesh.position.x - this.mesh.geometry.parameters.width / 2 < bounds.xMin) {
	  this.mesh.position.x = bounds.xMin + this.mesh.geometry.parameters.width / 2;
	}

	if (this.mesh.position.x + this.mesh.geometry.parameters.width / 2 > bounds.xMax) {
	  this.mesh.position.x = bounds.xMax - this.mesh.geometry.parameters.width / 2;   
	}

	if (this.mesh.position.y - this.mesh.geometry.parameters.height / 2 < bounds.yMin) {
	  this.mesh.position.y = bounds.yMin + this.mesh.geometry.parameters.height / 2;
	}

	if (this.mesh.position.y + this.mesh.geometry.parameters.height / 2 > bounds.yMax) {
	  this.mesh.position.y = bounds.yMax - this.mesh.geometry.parameters.height / 2;
	}
  }
  
  updatePosition(newY)
  {
	this.newY = newY;
  }

  syncPosition()
  {
	this.mesh.position.y = this.pongPlayer.newY;
  }
}
