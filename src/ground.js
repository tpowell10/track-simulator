import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { GAME_CONFIG } from './config.js';

export class Ground {
    constructor(textureManager) {
        this.textureManager = textureManager;
        this.groundMesh = null;
        this.groundBody = null;
    }

    createGround() {
        // Create a large ground plane
        const groundGeometry = new THREE.PlaneGeometry(1000, 1000);
        this.groundMesh = new THREE.Mesh(groundGeometry, this.textureManager.getGrassMaterial());
        this.groundMesh.rotation.x = -Math.PI / 2;
        this.groundMesh.receiveShadow = true;
        this.groundMesh.position.y = -0.1; // Slightly below track to prevent z-fighting

        // Create ground physics body
        this.groundBody = new CANNON.Body({
            type: CANNON.Body.STATIC,
            shape: new CANNON.Plane()
        });
        this.groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
        this.groundBody.position.set(0, -0.1, 0);

        return {
            mesh: this.groundMesh,
            body: this.groundBody
        };
    }
} 