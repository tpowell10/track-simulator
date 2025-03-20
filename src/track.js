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
        this.barriers = [];
        this.startLine = null;
        this.finishLine = null;
    }

    createTrack() {
        const { TRACK } = GAME_CONFIG;

        // Create track points with more complex sections
        for (let i = 0; i <= 720; i += 5) { // Increased to 720 for more complex track
            const angle = (i * Math.PI) / 360;
            let radius;

            // Determine track section with more variety
            if (angle < 0.5 || angle > 5.8) {
                radius = TRACK.INNER_RADIUS + TRACK.SECTIONS.STRAIGHT.RADIUS_OFFSET;
            } else if (angle > 1.5 && angle < 2.5) {
                radius = TRACK.INNER_RADIUS + TRACK.SECTIONS.HAIRPIN.RADIUS_OFFSET;
            } else if (angle > 3.5 && angle < 4.5) {
                radius = TRACK.INNER_RADIUS + TRACK.SECTIONS.S_CURVE.RADIUS_OFFSET;
            } else if (angle > 5.0 && angle < 5.5) {
                radius = TRACK.INNER_RADIUS + TRACK.SECTIONS.CHICANE.RADIUS_OFFSET;
            } else {
                radius = TRACK.INNER_RADIUS + TRACK.SECTIONS.GENTLE.RADIUS_OFFSET;
            }

            // Add some variation to make it more interesting
            radius += Math.sin(angle * 3) * 5;

            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            this.trackPoints.push(new THREE.Vector3(x, TRACK.HEIGHT_OFFSET, z));

            // Create track borders
            const nextAngle = ((i + 5) * Math.PI) / 360;
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

        // Create track geometry with more detail
        const trackGeometry = new THREE.ExtrudeGeometry(trackShape, {
            steps: 1,
            depth: TRACK.HEIGHT_OFFSET,
            bevelEnabled: false
        });

        // Create track mesh with enhanced asphalt material
        this.trackMesh = new THREE.Mesh(trackGeometry, this.textureManager.getAsphaltMaterial());
        this.trackMesh.rotation.x = -Math.PI / 2;
        this.trackMesh.receiveShadow = true;

        // Create border mesh with smooth edges
        const borderGeometry = new THREE.ExtrudeGeometry(trackShape, {
            steps: 1,
            depth: TRACK.HEIGHT_OFFSET + 0.01,
            bevelEnabled: true,
            bevelThickness: 0.5,
            bevelSize: 0.5,
            bevelSegments: 3
        });

        const borderMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.7,
            metalness: 0.1
        });

        this.borderMesh = new THREE.Mesh(borderGeometry, borderMaterial);
        this.borderMesh.rotation.x = -Math.PI / 2;
        this.borderMesh.receiveShadow = true;

        // Create barriers along the track
        this.createBarriers();

        // Create finish line
        this.createFinishLine();

        return {
            trackMesh: this.trackMesh,
            borderMesh: this.borderMesh,
            barriers: this.barriers,
            finishLine: this.finishLine,
            startPosition: this.getStartPosition()
        };
    }

    createBarriers() {
        const { TRACK } = GAME_CONFIG;

        // Create barriers along the track edges
        for (let i = 0; i < this.trackPoints.length; i += 5) { // Reduced spacing for smoother barriers
            const currentPoint = this.trackPoints[i];
            const nextPoint = this.trackPoints[(i + 5) % this.trackPoints.length];

            const direction = nextPoint.clone().sub(currentPoint).normalize();
            const perpendicular = new THREE.Vector3(-direction.z, 0, direction.x);

            // Create inner barrier
            const innerBarrier = this.createBarrierSegment(
                currentPoint.clone().add(perpendicular.clone().multiplyScalar(TRACK.WIDTH / 2)),
                nextPoint.clone().add(perpendicular.clone().multiplyScalar(TRACK.WIDTH / 2))
            );
            this.barriers.push(innerBarrier);

            // Create outer barrier
            const outerBarrier = this.createBarrierSegment(
                currentPoint.clone().sub(perpendicular.clone().multiplyScalar(TRACK.WIDTH / 2)),
                nextPoint.clone().sub(perpendicular.clone().multiplyScalar(TRACK.WIDTH / 2))
            );
            this.barriers.push(outerBarrier);
        }
    }

    createBarrierSegment(start, end) {
        const { TRACK } = GAME_CONFIG;
        const length = start.distanceTo(end);
        const direction = end.clone().sub(start).normalize();
        const angle = Math.atan2(direction.z, direction.x);

        const barrierGeometry = new THREE.BoxGeometry(length, TRACK.BARRIER_HEIGHT, TRACK.BARRIER_THICKNESS);
        const barrierMaterial = new THREE.MeshStandardMaterial({
            color: 0xff0000,
            roughness: 0.8,
            metalness: 0.2
        });

        const barrier = new THREE.Mesh(barrierGeometry, barrierMaterial);
        barrier.position.copy(start.clone().add(end).multiplyScalar(0.5));
        barrier.position.y = TRACK.BARRIER_HEIGHT / 2;
        barrier.rotation.y = angle;
        barrier.castShadow = true;
        barrier.receiveShadow = true;

        return barrier;
    }

    createFinishLine() {
        const { TRACK } = GAME_CONFIG;
        const finishPoint = this.trackPoints[this.trackPoints.length - 1];
        const prevPoint = this.trackPoints[this.trackPoints.length - 2];
        const finishDirection = finishPoint.clone().sub(prevPoint).normalize();
        const finishPerpendicular = new THREE.Vector3(-finishDirection.z, 0, finishDirection.x);

        // Create a wider finish line with checkered pattern
        const finishLineGeometry = new THREE.PlaneGeometry(TRACK.WIDTH, 4);
        const finishLineMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            emissive: 0xffffff,
            emissiveIntensity: 0.3
        });
        this.finishLine = new THREE.Mesh(finishLineGeometry, finishLineMaterial);
        this.finishLine.position.copy(finishPoint);
        this.finishLine.position.y = TRACK.HEIGHT_OFFSET + 0.01;
        this.finishLine.rotation.x = -Math.PI / 2;
        this.finishLine.rotation.z = Math.atan2(finishDirection.z, finishDirection.x);

        // Add checkered pattern to finish line
        const checkeredPattern = new THREE.PlaneGeometry(TRACK.WIDTH / 2, 2);
        const blackMaterial = new THREE.MeshStandardMaterial({
            color: 0x000000,
            emissive: 0x000000,
            emissiveIntensity: 0.1
        });

        // Add black squares to create checkered pattern
        for (let i = 0; i < 2; i++) {
            for (let j = 0; j < 2; j++) {
                const blackSquare = new THREE.Mesh(checkeredPattern, blackMaterial);
                blackSquare.position.copy(finishPoint);
                blackSquare.position.y = TRACK.HEIGHT_OFFSET + 0.02;
                blackSquare.position.x += (i - 0.5) * (TRACK.WIDTH / 2);
                blackSquare.position.z += (j - 0.5) * 2;
                blackSquare.rotation.x = -Math.PI / 2;
                blackSquare.rotation.z = Math.atan2(finishDirection.z, finishDirection.x);
                this.finishLine.add(blackSquare);
            }
        }
    }

    getStartPosition() {
        // Find a point about 100 units before the finish line
        const finishPoint = this.trackPoints[this.trackPoints.length - 1];
        const prevPoint = this.trackPoints[this.trackPoints.length - 2];
        const direction = prevPoint.clone().sub(finishPoint).normalize();

        // Calculate start position 100 units before finish line
        const startPosition = finishPoint.clone().add(direction.multiplyScalar(100));
        const angle = Math.atan2(direction.x, direction.z);

        return {
            position: new THREE.Vector3(startPosition.x, startPosition.y + 0.5, startPosition.z),
            angle: angle
        };
    }
} 