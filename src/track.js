import * as THREE from 'three';
import { GAME_CONFIG } from './config.js';

export class Track {
    constructor(textureManager) {
        this.textureManager = textureManager;
        this.trackPoints = [];
        this.innerTrackPoints = [];
        this.outerTrackPoints = [];
        this.trackMesh = null;
        this.borderMesh = null;
    }

    createTrack() {
        const { TRACK } = GAME_CONFIG;

        // Create track points
        for (let i = 0; i <= 360; i += 5) {
            const angle = (i * Math.PI) / 180;
            let radius;

            // Determine track section
            if (angle < 0.5 || angle > 5.8) {
                radius = TRACK.INNER_RADIUS + TRACK.SECTIONS.STRAIGHT.RADIUS_OFFSET;
            } else if (angle > 1.5 && angle < 2.5) {
                radius = TRACK.INNER_RADIUS + TRACK.SECTIONS.HAIRPIN.RADIUS_OFFSET;
            } else if (angle > 3.5 && angle < 4.5) {
                radius = TRACK.INNER_RADIUS + TRACK.SECTIONS.S_CURVE.RADIUS_OFFSET;
            } else {
                radius = TRACK.INNER_RADIUS + TRACK.SECTIONS.GENTLE.RADIUS_OFFSET;
            }

            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            this.trackPoints.push(new THREE.Vector3(x, TRACK.HEIGHT_OFFSET, z));

            // Create track borders
            const nextAngle = ((i + 5) * Math.PI) / 180;
            const nextX = Math.cos(nextAngle) * radius;
            const nextZ = Math.sin(nextAngle) * radius;

            const direction = new THREE.Vector3(nextX - x, 0, nextZ - z).normalize();
            const perpendicular = new THREE.Vector3(-direction.z, 0, direction.x);

            const innerPoint = new THREE.Vector3(
                x - perpendicular.x * (TRACK.WIDTH / 2),
                TRACK.HEIGHT_OFFSET,
                z - perpendicular.z * (TRACK.WIDTH / 2)
            );

            const outerPoint = new THREE.Vector3(
                x + perpendicular.x * (TRACK.WIDTH / 2),
                TRACK.HEIGHT_OFFSET,
                z + perpendicular.z * (TRACK.WIDTH / 2)
            );

            this.innerTrackPoints.push(innerPoint);
            this.outerTrackPoints.push(outerPoint);
        }

        // Create track shape
        const trackShape = new THREE.Shape();
        trackShape.moveTo(this.outerTrackPoints[0].x, this.outerTrackPoints[0].z);

        // Add outer points
        for (let i = 1; i < this.outerTrackPoints.length; i++) {
            trackShape.lineTo(this.outerTrackPoints[i].x, this.outerTrackPoints[i].z);
        }

        // Add inner points in reverse
        for (let i = this.innerTrackPoints.length - 1; i >= 0; i--) {
            trackShape.lineTo(this.innerTrackPoints[i].x, this.innerTrackPoints[i].z);
        }

        trackShape.closePath();

        // Create track geometry
        const trackGeometry = new THREE.ExtrudeGeometry(trackShape, {
            steps: 1,
            depth: TRACK.HEIGHT_OFFSET,
            bevelEnabled: false
        });

        // Create track mesh with asphalt material
        this.trackMesh = new THREE.Mesh(trackGeometry, this.textureManager.getAsphaltMaterial());
        this.trackMesh.rotation.x = -Math.PI / 2;
        this.trackMesh.receiveShadow = true;

        // Create border mesh
        const borderGeometry = new THREE.ExtrudeGeometry(trackShape, {
            steps: 1,
            depth: TRACK.HEIGHT_OFFSET + 0.01,
            bevelEnabled: false
        });

        const borderMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.7,
            metalness: 0.1
        });

        this.borderMesh = new THREE.Mesh(borderGeometry, borderMaterial);
        this.borderMesh.rotation.x = -Math.PI / 2;
        this.borderMesh.receiveShadow = true;

        return {
            trackMesh: this.trackMesh,
            borderMesh: this.borderMesh
        };
    }
} 