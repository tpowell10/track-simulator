import * as THREE from 'three';

export class TextureManager {
    constructor() {
        this.textureLoader = new THREE.TextureLoader();
        this.textures = {};
    }

    async loadTextures() {
        try {
            // Asphalt textures - using more reliable textures
            const asphaltDiffuse = await this.loadTexture('https://threejs.org/examples/textures/terrain/grasslight-big.jpg');
            const asphaltNormal = await this.loadTexture('https://threejs.org/examples/textures/terrain/grasslight-normal.jpg');
            const asphaltRoughness = await this.loadTexture('https://threejs.org/examples/textures/terrain/grasslight-rough.jpg');
            const asphaltAO = await this.loadTexture('https://threejs.org/examples/textures/terrain/grasslight-ao.jpg');

            // Grass textures
            const grassDiffuse = await this.loadTexture('https://threejs.org/examples/textures/terrain/grasslight-big.jpg');
            const grassNormal = await this.loadTexture('https://threejs.org/examples/textures/terrain/grasslight-normal.jpg');
            const grassRoughness = await this.loadTexture('https://threejs.org/examples/textures/terrain/grasslight-rough.jpg');
            const grassAO = await this.loadTexture('https://threejs.org/examples/textures/terrain/grasslight-ao.jpg');

            // Configure asphalt textures
            this.textures.asphalt = {
                diffuse: this.configureTexture(asphaltDiffuse, 0.1),
                normal: this.configureTexture(asphaltNormal, 0.1),
                roughness: this.configureTexture(asphaltRoughness, 0.1),
                ao: this.configureTexture(asphaltAO, 0.1)
            };

            // Configure grass textures
            this.textures.grass = {
                diffuse: this.configureTexture(grassDiffuse, 0.5),
                normal: this.configureTexture(grassNormal, 0.5),
                roughness: this.configureTexture(grassRoughness, 0.5),
                ao: this.configureTexture(grassAO, 0.5)
            };
        } catch (error) {
            console.error('Error loading textures:', error);
            // Fallback to basic materials if texture loading fails
            this.textures.asphalt = {
                diffuse: null,
                normal: null,
                roughness: null,
                ao: null
            };
            this.textures.grass = {
                diffuse: null,
                normal: null,
                roughness: null,
                ao: null
            };
        }
    }

    configureTexture(texture, repeat) {
        if (!texture) return null;
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(repeat, repeat);
        return texture;
    }

    loadTexture(url) {
        return new Promise((resolve, reject) => {
            this.textureLoader.load(
                url,
                (texture) => resolve(texture),
                undefined,
                (error) => {
                    console.error(`Error loading texture from ${url}:`, error);
                    reject(error);
                }
            );
        });
    }

    getAsphaltMaterial() {
        return new THREE.MeshStandardMaterial({
            color: 0x555555,
            roughness: 0.7,
            metalness: 0.1,
            map: this.textures.asphalt?.diffuse || null,
            normalMap: this.textures.asphalt?.normal || null,
            roughnessMap: this.textures.asphalt?.roughness || null,
            aoMap: this.textures.asphalt?.ao || null
        });
    }

    getGrassMaterial() {
        return new THREE.MeshStandardMaterial({
            color: 0x3a7e3a,
            roughness: 0.8,
            metalness: 0.1,
            map: this.textures.grass?.diffuse || null,
            normalMap: this.textures.grass?.normal || null,
            roughnessMap: this.textures.grass?.roughness || null,
            aoMap: this.textures.grass?.ao || null
        });
    }
} 