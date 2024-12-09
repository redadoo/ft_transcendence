import * as THREE from '../../../../lib/threejs/src/Three.js';

export default class Background {
    constructor(scene, width = 10, height = 6) {
        
        this.scene = scene;
        
        if (!(this.scene instanceof THREE.Scene)) {
            console.error("this.scene is not a valid THREE.Scene instance.");
        }

        this.width = width;  // Larghezza del campo
        this.height = height; // Altezza del campo
        this.createDottedCenterLine();
    }

    // Metodo per creare le linee tratteggiate al centro del campo
    createDottedCenterLine() {
        const points = [];
        const spacing = 0.5; // Spaziatura tra le linee

        // Crea una serie di punti verticali per la linea centrale
        for (let y = -this.height / 2; y <= this.height; y += spacing) {
            points.push(0, y, 0); // Punto iniziale
            points.push(0, y + spacing / 2, 0); // Punto tratteggiato
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));

        // Creiamo un materiale per le linee (bianco, ad esempio)
        const material = new THREE.LineBasicMaterial({ color: 0xffffff });

        // Creiamo la linea e aggiungiamola alla scena
        const line = new THREE.LineSegments(geometry, material);
        this.scene.add(line);
    }
}
