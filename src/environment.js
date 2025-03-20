import * as THREE from 'three';
import { GAME_CONFIG } from './config.js';

export class Environment {
    constructor() {
        this.sun = null;
        this.clouds = [];
        this.sky = null;
    }

    createEnvironment() {
        // Create sky dome
        const skyGeometry = new THREE.SphereGeometry(500, 32, 32);
        const skyMaterial = new THREE.MeshBasicMaterial({
            color: 0x87CEEB,
            side: THREE.BackSide
        });
        this.sky = new THREE.Mesh(skyGeometry, skyMaterial);
        this.sky.name = 'sky';

        // Create sun
        const sunGeometry = new THREE.SphereGeometry(10, 32, 32);
        const sunMaterial = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            transparent: true,
            opacity: 0.9
        });
        this.sun = new THREE.Mesh(sunGeometry, sunMaterial);
        this.sun.position.set(100, 100, 100);
        this.sun.name = 'sun';

        // Create sun glow
        const sunGlowGeometry = new THREE.SphereGeometry(15, 32, 32);
        const sunGlowMaterial = new THREE.ShaderMaterial({
            uniforms: {
                color: { value: new THREE.Color(0xffff00) }
            },
            vertexShader: `
                varying vec3 vNormal;
                void main() {
                    vNormal = normalize(normalMatrix * normal);
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 color;
                varying vec3 vNormal;
                void main() {
                    float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
                    gl_FragColor = vec4(color, intensity);
                }
            `,
            blending: THREE.AdditiveBlending,
            side: THREE.BackSide
        });
        const sunGlow = new THREE.Mesh(sunGlowGeometry, sunGlowMaterial);
        this.sun.add(sunGlow);

        // Create clouds
        const cloudGeometry = new THREE.SphereGeometry(5, 8, 8);
        const cloudMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.8,
            roughness: 0.2,
            metalness: 0.1
        });

        // Create multiple clouds in different positions
        for (let i = 0; i < 20; i++) {
            const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);
            cloud.position.set(
                Math.random() * 400 - 200,
                Math.random() * 100 + 50,
                Math.random() * 400 - 200
            );
            cloud.scale.set(
                Math.random() * 2 + 1,
                Math.random() * 0.5 + 0.5,
                Math.random() * 2 + 1
            );
            this.clouds.push(cloud);
        }

        return {
            sky: this.sky,
            sun: this.sun,
            clouds: this.clouds
        };
    }

    update(time) {
        // Animate clouds
        this.clouds.forEach(cloud => {
            cloud.position.x += Math.sin(time * 0.1) * 0.1;
            cloud.position.z += Math.cos(time * 0.1) * 0.1;
        });

        // Animate sun glow
        if (this.sun) {
            const glow = this.sun.children[0];
            glow.material.uniforms.color.value.setHSL(0.15, 1, 0.5 + Math.sin(time * 0.1) * 0.1);
        }
    }
} 