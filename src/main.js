import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GAME_CONFIG } from './config.js';
import { TextureManager } from './textures.js';
import { Track } from './track.js';
import { Ground } from './ground.js';
import { Environment } from './environment.js';

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: "high-performance"
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
document.body.appendChild(renderer.domElement);

// Physics world setup
const world = new CANNON.World({
    gravity: new CANNON.Vec3(0, GAME_CONFIG.PHYSICS.GRAVITY, 0)
});

// Initialize managers
const textureManager = new TextureManager();
const track = new Track(textureManager);
const ground = new Ground(textureManager);
const environment = new Environment();

// Lighting setup
const ambientLight = new THREE.AmbientLight(0xffffff, GAME_CONFIG.LIGHTING.AMBIENT_INTENSITY);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, GAME_CONFIG.LIGHTING.DIRECTIONAL_INTENSITY);
directionalLight.position.set(5, 5, 5);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = GAME_CONFIG.LIGHTING.SHADOW_MAP_SIZE;
directionalLight.shadow.mapSize.height = GAME_CONFIG.LIGHTING.SHADOW_MAP_SIZE;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 500;
directionalLight.shadow.camera.left = -100;
directionalLight.shadow.camera.right = 100;
directionalLight.shadow.camera.top = 100;
directionalLight.shadow.camera.bottom = -100;
scene.add(directionalLight);

// Add hemisphere light for better ambient lighting
const hemisphereLight = new THREE.HemisphereLight(0x87CEEB, 0x3a7e3a, 0.5);
scene.add(hemisphereLight);

// Camera setup
camera.position.set(0, GAME_CONFIG.CAMERA.HEIGHT, -GAME_CONFIG.CAMERA.DISTANCE);
camera.lookAt(0, 0, 0);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 30;
controls.maxDistance = 50;
controls.minPolarAngle = 0.3;
controls.maxPolarAngle = 0.7;
controls.target.set(0, 0, 0);
controls.enablePan = false;
controls.enableZoom = false;

// Input handling
const input = {
    forward: false,
    backward: false,
    left: false,
    right: false
};

document.addEventListener('keydown', (event) => {
    switch (event.key.toLowerCase()) {
        case 'w': input.forward = true; break;
        case 's': input.backward = true; break;
        case 'a': input.left = true; break;
        case 'd': input.right = true; break;
    }
});

document.addEventListener('keyup', (event) => {
    switch (event.key.toLowerCase()) {
        case 'w': input.forward = false; break;
        case 's': input.backward = false; break;
        case 'a': input.left = false; break;
        case 'd': input.right = false; break;
    }
});

// Car movement variables
const { CAR } = GAME_CONFIG;
let speed = 0;
let angle = 0;
let time = 0;

// Initialize game
async function init() {
    try {
        // Load textures
        await textureManager.loadTextures();

        // Create environment
        const { sky, sun, clouds } = environment.createEnvironment();
        scene.add(sky);
        scene.add(sun);
        clouds.forEach(cloud => scene.add(cloud));

        // Create track and ground
        const { trackMesh, borderMesh } = track.createTrack();
        const groundResult = ground.createGround();

        // Add meshes to scene
        scene.add(trackMesh);
        scene.add(borderMesh);
        scene.add(groundResult.mesh);

        // Add ground physics body to world
        world.addBody(groundResult.body);

        // Create car with enhanced materials
        const carGroup = new THREE.Group();
        scene.add(carGroup);

        // Main body
        const carBodyGeometry = new THREE.BoxGeometry(2, 0.5, 4);
        const carBodyMaterial = new THREE.MeshPhysicalMaterial({
            color: 0xff0000,
            roughness: 0.3,
            metalness: 0.8,
            clearcoat: 0.8,
            clearcoatRoughness: 0.2,
            envMapIntensity: 1.0
        });
        const carBody = new THREE.Mesh(carBodyGeometry, carBodyMaterial);
        carBody.castShadow = true;
        carBody.receiveShadow = true;
        carGroup.add(carBody);

        // Hood
        const hoodGeometry = new THREE.BoxGeometry(1.8, 0.1, 1.5);
        const hood = new THREE.Mesh(hoodGeometry, carBodyMaterial);
        hood.position.set(0, 0.3, 1.2);
        hood.castShadow = true;
        hood.receiveShadow = true;
        carGroup.add(hood);

        // Roof
        const roofGeometry = new THREE.BoxGeometry(1.6, 0.8, 1.2);
        const roof = new THREE.Mesh(roofGeometry, carBodyMaterial);
        roof.position.set(0, 0.8, 0.2);
        roof.castShadow = true;
        roof.receiveShadow = true;
        carGroup.add(roof);

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
        const frontWindshieldGeometry = new THREE.BoxGeometry(1.4, 0.6, 0.1);
        const frontWindshield = new THREE.Mesh(frontWindshieldGeometry, windowMaterial);
        frontWindshield.position.set(0, 0.6, 1.3);
        frontWindshield.rotation.x = -Math.PI / 6;
        frontWindshield.castShadow = true;
        frontWindshield.receiveShadow = true;
        carGroup.add(frontWindshield);

        // Rear windshield
        const rearWindshieldGeometry = new THREE.BoxGeometry(1.4, 0.6, 0.1);
        const rearWindshield = new THREE.Mesh(rearWindshieldGeometry, windowMaterial);
        rearWindshield.position.set(0, 0.6, -0.8);
        rearWindshield.rotation.x = Math.PI / 6;
        rearWindshield.castShadow = true;
        rearWindshield.receiveShadow = true;
        carGroup.add(rearWindshield);

        // Side windows
        const sideWindowGeometry = new THREE.BoxGeometry(0.1, 0.4, 0.8);
        const leftWindow = new THREE.Mesh(sideWindowGeometry, windowMaterial);
        leftWindow.position.set(-0.8, 0.8, 0);
        leftWindow.castShadow = true;
        leftWindow.receiveShadow = true;
        carGroup.add(leftWindow);

        const rightWindow = new THREE.Mesh(sideWindowGeometry, windowMaterial);
        rightWindow.position.set(0.8, 0.8, 0);
        rightWindow.castShadow = true;
        rightWindow.receiveShadow = true;
        carGroup.add(rightWindow);

        // Front bumper
        const frontBumperGeometry = new THREE.BoxGeometry(2.2, 0.3, 0.5);
        const frontBumper = new THREE.Mesh(frontBumperGeometry, carBodyMaterial);
        frontBumper.position.set(0, 0.1, 2.2);
        frontBumper.castShadow = true;
        frontBumper.receiveShadow = true;
        carGroup.add(frontBumper);

        // Rear bumper
        const rearBumperGeometry = new THREE.BoxGeometry(2.2, 0.3, 0.5);
        const rearBumper = new THREE.Mesh(rearBumperGeometry, carBodyMaterial);
        rearBumper.position.set(0, 0.1, -2.2);
        rearBumper.castShadow = true;
        rearBumper.receiveShadow = true;
        carGroup.add(rearBumper);

        // Spoiler
        const spoilerGeometry = new THREE.BoxGeometry(2, 0.3, 0.2);
        const spoiler = new THREE.Mesh(spoilerGeometry, carBodyMaterial);
        spoiler.position.set(0, 0.8, -2.1);
        spoiler.castShadow = true;
        spoiler.receiveShadow = true;
        carGroup.add(spoiler);

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

        const headlightGeometry = new THREE.CircleGeometry(0.2, 16);
        const leftHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
        leftHeadlight.position.set(-0.8, 0.2, 2.1);
        leftHeadlight.rotation.y = Math.PI;
        leftHeadlight.castShadow = true;
        leftHeadlight.receiveShadow = true;
        carGroup.add(leftHeadlight);

        const rightHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
        rightHeadlight.position.set(0.8, 0.2, 2.1);
        rightHeadlight.rotation.y = Math.PI;
        rightHeadlight.castShadow = true;
        rightHeadlight.receiveShadow = true;
        carGroup.add(rightHeadlight);

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

        const taillightGeometry = new THREE.CircleGeometry(0.2, 16);
        const leftTaillight = new THREE.Mesh(taillightGeometry, taillightMaterial);
        leftTaillight.position.set(-0.8, 0.2, -2.1);
        leftTaillight.castShadow = true;
        leftTaillight.receiveShadow = true;
        carGroup.add(leftTaillight);

        const rightTaillight = new THREE.Mesh(taillightGeometry, taillightMaterial);
        rightTaillight.position.set(0.8, 0.2, -2.1);
        rightTaillight.castShadow = true;
        rightTaillight.receiveShadow = true;
        carGroup.add(rightTaillight);

        // Create car physics body
        const carBodyShape = new CANNON.Box(new CANNON.Vec3(1, 0.5, 2));
        const carBodyBody = new CANNON.Body({ mass: CAR.MASS });
        carBodyBody.addShape(carBodyShape);
        carBodyBody.position.set(0, 0.5, 0);
        world.addBody(carBodyBody);

        // Create wheels with enhanced materials
        const wheelGeometry = new THREE.CylinderGeometry(CAR.WHEEL_RADIUS, CAR.WHEEL_RADIUS, CAR.WHEEL_WIDTH, 32);
        const wheelMaterial = new THREE.MeshPhysicalMaterial({
            color: 0x000000,
            roughness: 0.3,
            metalness: 0.9,
            clearcoat: 0.8,
            clearcoatRoughness: 0.2,
            envMapIntensity: 1.0
        });
        const wheels = [];

        const wheelBodies = [];
        const wheelConstraints = [];

        const wheelPositions = [
            { x: -1.2, y: 0.4, z: -1.2 },
            { x: 1.2, y: 0.4, z: -1.2 },
            { x: -1.2, y: 0.4, z: 1.2 },
            { x: 1.2, y: 0.4, z: 1.2 }
        ];

        wheelPositions.forEach(position => {
            const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
            wheel.rotation.z = Math.PI / 2;
            wheel.position.set(position.x, position.y, position.z);
            wheel.castShadow = true;
            wheel.receiveShadow = true;
            carGroup.add(wheel);
            wheels.push(wheel);

            const wheelBody = new CANNON.Body({ mass: CAR.WHEEL_MASS });
            const wheelShape = new CANNON.Sphere(CAR.WHEEL_RADIUS);
            wheelBody.addShape(wheelShape);
            wheelBody.position.set(position.x, position.y, position.z);
            world.addBody(wheelBody);
            wheelBodies.push(wheelBody);

            const constraint = new CANNON.HingeConstraint(carBodyBody, wheelBody, {
                pivotA: new CANNON.Vec3(position.x, position.y, position.z),
                axisA: new CANNON.Vec3(0, 0, 1),
                maxForce: 1e6
            });
            world.addConstraint(constraint);
            wheelConstraints.push(constraint);
        });

        // Create cones with enhanced materials
        const cones = [];
        const coneGeometry = new THREE.ConeGeometry(0.5, 2, 32);
        const coneMaterial = new THREE.MeshPhysicalMaterial({
            color: 0xff0000,
            roughness: 0.4,
            metalness: 0.2,
            clearcoat: 0.3,
            clearcoatRoughness: 0.5,
            envMapIntensity: 0.8
        });
        const coneShape = new CANNON.Sphere(0.5);

        track.trackPoints.forEach((point, index) => {
            if (index % 20 === 0) {
                const cone = new THREE.Mesh(coneGeometry, coneMaterial);
                cone.position.copy(point);
                cone.position.y += 1;
                cone.castShadow = true;
                cone.receiveShadow = true;
                scene.add(cone);

                const coneBody = new CANNON.Body({ mass: 1 });
                coneBody.addShape(coneShape);
                coneBody.position.copy(point);
                coneBody.position.y += 1;
                world.addBody(coneBody);

                cones.push({ mesh: cone, body: coneBody });
            }
        });

        // Animation loop
        function animate() {
            requestAnimationFrame(animate);
            time += 0.016; // Approximately 60fps

            // Update environment
            environment.update(time);

            // Car movement
            if (input.forward) {
                speed = Math.max(speed - CAR.ACCELERATION, -CAR.MAX_FORWARD_SPEED);
            } else if (input.backward) {
                speed = Math.min(speed + CAR.ACCELERATION, CAR.MAX_REVERSE_SPEED);
            } else {
                speed *= CAR.DECELERATION;
                if (Math.abs(speed) < 0.1) speed = 0;
            }

            // Turn the car
            if (Math.abs(speed) > 0.1) {
                if (input.left) {
                    angle -= CAR.TURN_SPEED * Math.sign(speed);
                }
                if (input.right) {
                    angle += CAR.TURN_SPEED * Math.sign(speed);
                }
            }

            // Calculate movement based on car direction
            const xMovement = Math.sin(angle) * speed;
            const zMovement = Math.cos(angle) * speed;

            // Update car position and rotation
            carBodyBody.position.x += xMovement;
            carBodyBody.position.z += zMovement;
            carBodyBody.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), angle);

            carGroup.position.copy(carBodyBody.position);
            carGroup.quaternion.copy(carBodyBody.quaternion);

            // Update physics world
            world.step(GAME_CONFIG.PHYSICS.FIXED_TIME_STEP);

            // Update cones
            cones.forEach(cone => {
                cone.mesh.position.copy(cone.body.position);
                cone.mesh.quaternion.copy(cone.body.quaternion);
            });

            // Check for collisions with cones
            const carPosition = new THREE.Vector3(carBodyBody.position.x, carBodyBody.position.y, carBodyBody.position.z);
            cones.forEach(cone => {
                const conePosition = new THREE.Vector3(cone.body.position.x, cone.body.position.y, cone.body.position.z);
                const distance = carPosition.distanceTo(conePosition);
                if (distance < 3) {
                    const direction = conePosition.clone().sub(carPosition).normalize();
                    cone.body.applyImpulse(
                        new CANNON.Vec3(direction.x * speed * 10, 5, direction.z * speed * 10),
                        new CANNON.Vec3(0, 0, 0)
                    );
                }
            });

            // Update camera to follow car
            const cameraOffset = new THREE.Vector3(
                Math.sin(angle) * GAME_CONFIG.CAMERA.DISTANCE,
                GAME_CONFIG.CAMERA.HEIGHT,
                Math.cos(angle) * GAME_CONFIG.CAMERA.DISTANCE
            );
            camera.position.copy(carGroup.position).add(cameraOffset);
            camera.lookAt(carGroup.position);

            renderer.render(scene, camera);
        }

        animate();
    } catch (error) {
        console.error('Error initializing game:', error);
        // Add a basic error message to the screen
        const errorDiv = document.createElement('div');
        errorDiv.style.position = 'fixed';
        errorDiv.style.top = '50%';
        errorDiv.style.left = '50%';
        errorDiv.style.transform = 'translate(-50%, -50%)';
        errorDiv.style.color = 'red';
        errorDiv.style.fontSize = '24px';
        errorDiv.textContent = 'Error loading game. Please refresh the page.';
        document.body.appendChild(errorDiv);
    }
}

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Start the game
init(); 