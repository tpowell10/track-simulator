import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { GAME_CONFIG } from './config.js';

export class Car {
    constructor() {
        this.group = new THREE.Group();
        this.speed = 0;
        this.angle = 0;
        this.wheels = [];
        this.wheelBodies = [];
        this.wheelConstraints = [];
        this.createCar();
    }

    createCar() {
        const { CAR } = GAME_CONFIG;

        // Main body
        const carBodyGeometry = new THREE.BoxGeometry(2.5, 0.6, 5); // Increased size
        const carBodyMaterial = new THREE.MeshPhysicalMaterial({
            color: 0x0000ff, // Blue color
            roughness: 0.3,
            metalness: 0.8,
            clearcoat: 0.8,
            clearcoatRoughness: 0.2,
            envMapIntensity: 1.0
        });
        const carBody = new THREE.Mesh(carBodyGeometry, carBodyMaterial);
        carBody.castShadow = true;
        carBody.receiveShadow = true;
        this.group.add(carBody);

        // Hood
        const hoodGeometry = new THREE.BoxGeometry(2.3, 0.1, 1.8);
        const hood = new THREE.Mesh(hoodGeometry, carBodyMaterial);
        hood.position.set(0, 0.35, 1.5);
        hood.castShadow = true;
        hood.receiveShadow = true;
        this.group.add(hood);

        // Roof
        const roofGeometry = new THREE.BoxGeometry(2, 0.9, 1.4);
        const roof = new THREE.Mesh(roofGeometry, carBodyMaterial);
        roof.position.set(0, 0.9, 0.2);
        roof.castShadow = true;
        roof.receiveShadow = true;
        this.group.add(roof);

        // Windows
        const windowMaterial = new THREE.MeshPhysicalMaterial({
            color: 0x000000,
            transparent: true,
            opacity: 0.7,
            roughness: 0.1,
            metalness: 0.9,
            clearcoat: 0.9,
            clearcoatRoughness: 0.1
        });

        // Front windshield
        const frontWindshieldGeometry = new THREE.BoxGeometry(1.8, 0.7, 0.1);
        const frontWindshield = new THREE.Mesh(frontWindshieldGeometry, windowMaterial);
        frontWindshield.position.set(0, 0.7, 1.6);
        frontWindshield.rotation.x = -Math.PI / 6;
        frontWindshield.castShadow = true;
        frontWindshield.receiveShadow = true;
        this.group.add(frontWindshield);

        // Rear windshield
        const rearWindshieldGeometry = new THREE.BoxGeometry(1.8, 0.7, 0.1);
        const rearWindshield = new THREE.Mesh(rearWindshieldGeometry, windowMaterial);
        rearWindshield.position.set(0, 0.7, -1.1);
        rearWindshield.rotation.x = Math.PI / 6;
        rearWindshield.castShadow = true;
        rearWindshield.receiveShadow = true;
        this.group.add(rearWindshield);

        // Side windows
        const sideWindowGeometry = new THREE.BoxGeometry(0.1, 0.5, 1);
        const leftWindow = new THREE.Mesh(sideWindowGeometry, windowMaterial);
        leftWindow.position.set(-1, 0.9, 0);
        leftWindow.castShadow = true;
        leftWindow.receiveShadow = true;
        this.group.add(leftWindow);

        const rightWindow = new THREE.Mesh(sideWindowGeometry, windowMaterial);
        rightWindow.position.set(1, 0.9, 0);
        rightWindow.castShadow = true;
        rightWindow.receiveShadow = true;
        this.group.add(rightWindow);

        // Front bumper
        const frontBumperGeometry = new THREE.BoxGeometry(2.7, 0.4, 0.6);
        const frontBumper = new THREE.Mesh(frontBumperGeometry, carBodyMaterial);
        frontBumper.position.set(0, 0.1, 2.8);
        frontBumper.castShadow = true;
        frontBumper.receiveShadow = true;
        this.group.add(frontBumper);

        // Rear bumper
        const rearBumperGeometry = new THREE.BoxGeometry(2.7, 0.4, 0.6);
        const rearBumper = new THREE.Mesh(rearBumperGeometry, carBodyMaterial);
        rearBumper.position.set(0, 0.1, -2.8);
        rearBumper.castShadow = true;
        rearBumper.receiveShadow = true;
        this.group.add(rearBumper);

        // Spoiler
        const spoilerGeometry = new THREE.BoxGeometry(2.5, 0.4, 0.3);
        const spoiler = new THREE.Mesh(spoilerGeometry, carBodyMaterial);
        spoiler.position.set(0, 0.9, -2.7);
        spoiler.castShadow = true;
        spoiler.receiveShadow = true;
        this.group.add(spoiler);

        // Headlights
        const headlightMaterial = new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            emissive: 0xffffff,
            emissiveIntensity: 0.5,
            roughness: 0.1,
            metalness: 0.9,
            clearcoat: 0.9,
            clearcoatRoughness: 0.1
        });

        const headlightGeometry = new THREE.CircleGeometry(0.25, 16);
        const leftHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
        leftHeadlight.position.set(-1, 0.2, 2.7);
        leftHeadlight.rotation.y = Math.PI;
        leftHeadlight.castShadow = true;
        leftHeadlight.receiveShadow = true;
        this.group.add(leftHeadlight);

        const rightHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
        rightHeadlight.position.set(1, 0.2, 2.7);
        rightHeadlight.rotation.y = Math.PI;
        rightHeadlight.castShadow = true;
        rightHeadlight.receiveShadow = true;
        this.group.add(rightHeadlight);

        // Taillights
        const taillightMaterial = new THREE.MeshPhysicalMaterial({
            color: 0xff0000,
            emissive: 0xff0000,
            emissiveIntensity: 0.5,
            roughness: 0.1,
            metalness: 0.9,
            clearcoat: 0.9,
            clearcoatRoughness: 0.1
        });

        const taillightGeometry = new THREE.CircleGeometry(0.25, 16);
        const leftTaillight = new THREE.Mesh(taillightGeometry, taillightMaterial);
        leftTaillight.position.set(-1, 0.2, -2.7);
        leftTaillight.castShadow = true;
        leftTaillight.receiveShadow = true;
        this.group.add(leftTaillight);

        const rightTaillight = new THREE.Mesh(taillightGeometry, taillightMaterial);
        rightTaillight.position.set(1, 0.2, -2.7);
        rightTaillight.castShadow = true;
        rightTaillight.receiveShadow = true;
        this.group.add(rightTaillight);

        // Create car physics body
        const carBodyShape = new CANNON.Box(new CANNON.Vec3(1.25, 0.3, 2.5));
        this.carBodyBody = new CANNON.Body({ mass: CAR.MASS });
        this.carBodyBody.addShape(carBodyShape);
        this.carBodyBody.position.set(0, 0.5, 0);

        // Create wheels
        const wheelGeometry = new THREE.CylinderGeometry(CAR.WHEEL_RADIUS, CAR.WHEEL_RADIUS, CAR.WHEEL_WIDTH, 32);
        const wheelMaterial = new THREE.MeshPhysicalMaterial({
            color: 0x000000,
            roughness: 0.3,
            metalness: 0.9,
            clearcoat: 0.8,
            clearcoatRoughness: 0.2,
            envMapIntensity: 1.0
        });

        const wheelPositions = [
            { x: -1.5, y: 0.4, z: -1.5 },
            { x: 1.5, y: 0.4, z: -1.5 },
            { x: -1.5, y: 0.4, z: 1.5 },
            { x: 1.5, y: 0.4, z: 1.5 }
        ];

        wheelPositions.forEach(position => {
            const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
            wheel.rotation.z = Math.PI / 2;
            wheel.position.set(position.x, position.y, position.z);
            wheel.castShadow = true;
            wheel.receiveShadow = true;
            this.group.add(wheel);
            this.wheels.push(wheel);

            const wheelBody = new CANNON.Body({ mass: CAR.WHEEL_MASS });
            const wheelShape = new CANNON.Sphere(CAR.WHEEL_RADIUS);
            wheelBody.addShape(wheelShape);
            wheelBody.position.set(position.x, position.y, position.z);
            this.wheelBodies.push(wheelBody);

            const constraint = new CANNON.HingeConstraint(this.carBodyBody, wheelBody, {
                pivotA: new CANNON.Vec3(position.x, position.y, position.z),
                axisA: new CANNON.Vec3(0, 0, 1),
                maxForce: 1e6
            });
            this.wheelConstraints.push(constraint);
        });

        // Rotate the entire car group to fix orientation
        this.group.rotation.y = Math.PI;
    }

    update(input) {
        const { CAR } = GAME_CONFIG;

        // Car movement
        if (input.forward) {
            this.speed = Math.max(this.speed - CAR.ACCELERATION, -CAR.MAX_FORWARD_SPEED);
        } else if (input.backward) {
            this.speed = Math.min(this.speed + CAR.ACCELERATION, CAR.MAX_REVERSE_SPEED);
        } else {
            this.speed *= CAR.DECELERATION;
            if (Math.abs(this.speed) < 0.1) this.speed = 0;
        }

        // Turn the car
        if (Math.abs(this.speed) > 0.1) {
            if (input.left) {
                this.angle -= CAR.TURN_SPEED * Math.sign(this.speed);
            }
            if (input.right) {
                this.angle += CAR.TURN_SPEED * Math.sign(this.speed);
            }
        }

        // Calculate movement based on car direction
        const xMovement = Math.sin(this.angle) * this.speed;
        const zMovement = Math.cos(this.angle) * this.speed;

        // Update car position and rotation
        this.carBodyBody.position.x += xMovement;
        this.carBodyBody.position.z += zMovement;
        this.carBodyBody.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), this.angle);

        this.group.position.copy(this.carBodyBody.position);
        this.group.quaternion.copy(this.carBodyBody.quaternion);
    }

    addToScene(scene) {
        scene.add(this.group);
    }

    addToWorld(world) {
        world.addBody(this.carBodyBody);
        this.wheelBodies.forEach(wheelBody => world.addBody(wheelBody));
        this.wheelConstraints.forEach(constraint => world.addConstraint(constraint));
    }
} 