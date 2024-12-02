import * as THREE from '../../../../lib/threejs/src/Three.js';

export default class Background {
    constructor(scene, width = 10, height = 6) {
        
        this.scene = scene;
        
        if (!(this.scene instanceof THREE.Scene)) {
            console.error("this.scene is not a valid THREE.Scene instance.");
        }

        this.width = width;  // Larghezza del campo
        this.height = height; // Altezza del campo
        this.createBorders();
        this.createDottedCenterLine();

/*         // Crea la geometria per il pavimento (larghezza, altezza, segmentiX, segmentiY)
        const planeGeometry = new THREE.PlaneGeometry(width, height);

        // Crea un materiale per il pavimento
        const planeMaterial = new THREE.MeshStandardMaterial({ color: 0x006400 }); // Grigio

        // Crea il Mesh combinando geometria e materiale
        const plane = new THREE.Mesh(planeGeometry, planeMaterial); 

        // Ruota il piano affinché sia parallelo al terreno (asse X)

        // Posiziona il piano in basso (se necessario)
        plane.position.y = 0;  // Regola l'altezza del piano se necessario

        // Aggiungi il pavimento alla scena
        scene.add(plane); */

    }

    // Metodo per creare il contorno dei limiti di gioco
    createBorders() {
        // const points = [];

        // // Definisci i punti per il contorno (i vertici)
        // points.push(
        //     -this.width / 2, -this.height / 2, 0,  // Punti del rettangolo
        //     -this.width / 2, this.height / 2, 0,
        //     this.width / 2, this.height / 2, 0,
        //     this.width / 2, -this.height / 2, 0,
        //     -this.width / 2, -this.height / 2, 0  // Chiudi il contorno
        // );

        // const geometry = new THREE.BufferGeometry();
        // geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));

        // const material = new THREE.LineBasicMaterial({ color: 0xffffff });

        // // Crea la linea di contorno
        // const borderLine = new THREE.LineLoop(geometry, material);
        // this.scene.add(borderLine);     
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
