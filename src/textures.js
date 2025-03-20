import * as THREE from 'three';
import { GAME_CONFIG } from './config.js';

export class TextureManager {
    constructor() {
        this.textureLoader = new THREE.TextureLoader();
        this.asphaltTexture = null;
        this.asphaltNormalMap = null;
        this.asphaltRoughnessMap = null;
        this.asphaltAOMap = null;
        this.grassTexture = null;
        this.grassNormalMap = null;
        this.grassRoughnessMap = null;
        this.grassAOMap = null;
    }

    async loadTextures() {
        try {
            // Load asphalt textures
            this.asphaltTexture = await this.loadTexture('https://threejs.org/examples/textures/hardwood2_diffuse.jpg');
            this.asphaltNormalMap = await this.loadTexture('https://threejs.org/examples/textures/hardwood2_normal.jpg');
            this.asphaltRoughnessMap = await this.loadTexture('https://threejs.org/examples/textures/hardwood2_roughness.jpg');
            this.asphaltAOMap = await this.loadTexture('https://threejs.org/examples/textures/hardwood2_ao.jpg');

            // Load grass textures
            this.grassTexture = await this.loadTexture('https://threejs.org/examples/textures/terrain/grasslight-big.jpg');
            this.grassNormalMap = await this.loadTexture('https://threejs.org/examples/textures/terrain/grasslight-normal.jpg');
            this.grassRoughnessMap = await this.loadTexture('https://threejs.org/examples/textures/terrain/grasslight-rough.jpg');
            this.grassAOMap = await this.loadTexture('https://threejs.org/examples/textures/terrain/grasslight-ao.jpg');

            // Configure textures
            this.configureTexture(this.asphaltTexture, 0.1);
            this.configureTexture(this.asphaltNormalMap, 0.1);
            this.configureTexture(this.asphaltRoughnessMap, 0.1);
            this.configureTexture(this.asphaltAOMap, 0.1);

            this.configureTexture(this.grassTexture, 0.5);
            this.configureTexture(this.grassNormalMap, 0.5);
            this.configureTexture(this.grassRoughnessMap, 0.5);
            this.configureTexture(this.grassAOMap, 0.5);

        } catch (error) {
            console.error('Error loading textures:', error);
            // Fallback to basic materials if textures fail to load
            this.asphaltTexture = null;
            this.grassTexture = null;
        }
    }

    loadTexture(url) {
        return new Promise((resolve, reject) => {
            this.textureLoader.load(
                url,
                (texture) => resolve(texture),
                undefined,
                (error) => reject(error)
            );
        });
    }

    configureTexture(texture, repeat) {
        if (texture) {
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(repeat, repeat);
            texture.encoding = THREE.sRGBEncoding;
        }
    }

    getAsphaltMaterial() {
        if (!this.asphaltTexture) {
            return new THREE.MeshStandardMaterial({
                color: 0x333333,
                roughness: 0.7,
                metalness: 0.1
            });
        }

        return new THREE.MeshPhysicalMaterial({
            map: this.asphaltTexture,
            normalMap: this.asphaltNormalMap,
            roughnessMap: this.asphaltRoughnessMap,
            aoMap: this.asphaltAOMap,
            roughness: 0.7,
            metalness: 0.1,
            envMapIntensity: 0.5,
            clearcoat: 0.1,
            clearcoatRoughness: 0.3
        });
    }

    getGrassMaterial() {
        if (!this.grassTexture) {
            return new THREE.MeshStandardMaterial({
                color: 0x3a7e3a,
                roughness: 0.8,
                metalness: 0.1
            });
        }

        return new THREE.MeshPhysicalMaterial({
            map: this.grassTexture,
            normalMap: this.grassNormalMap,
            roughnessMap: this.grassRoughnessMap,
            aoMap: this.grassAOMap,
            roughness: 0.8,
            metalness: 0.1,
            envMapIntensity: 0.5,
            clearcoat: 0.2,
            clearcoatRoughness: 0.4
        });
    }
} 