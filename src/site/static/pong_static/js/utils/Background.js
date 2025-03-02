import * as THREE from "https://cdn.jsdelivr.net/npm/three@latest/build/three.module.js";

/**
 * Class that creates a background with a dotted center line in a Three.js scene.
 * @class
 */
export default class Background {
    /**
     * @param {THREE.Scene} scene - The scene to add the background to.
     * @param {number} [width=10] - The width of the background.
     * @param {number} [height=6] - The height of the background.
     */
    constructor(scene, width = 10, height = 6) 
	{
        if (!(scene instanceof THREE.Scene)) 
		{
            console.error("Invalid THREE.Scene instance.");
            return;
        }

        this.scene = scene;
        this.width = width;
        this.height = height;

        this.createDottedCenterLine();
    }

    /**
     * Creates and adds a vertical dotted center line to the scene.
     * @private
     */
    createDottedCenterLine() 
    {
        // const points = [];
        // const spacing = 0.5;

        // for (let y = -this.height / 2; y <= this.height; y += spacing) 
        //     points.push(0, y, 0, 0, y + spacing / 2, 0);

        // const geometry = new THREE.BufferGeometry().setAttribute(
        //     'position', new THREE.Float32BufferAttribute(points, 3)
        // );

        // const material = new THREE.LineBasicMaterial({ color: 0xffffff });
        // const line = new THREE.LineSegments(geometry, material);
        // this.scene.add(line);
    }
}
