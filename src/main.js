import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GAME_CONFIG } from './config.js';
import { TextureManager } from './textures.js';
import { Track } from './track.js';
import { Ground } from './ground.js';

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB); // Sky blue background
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Physics world setup
const world = new CANNON.World({
    gravity: new CANNON.Vec3(0, GAME_CONFIG.PHYSICS.GRAVITY, 0)
});

// Initialize managers
const textureManager = new TextureManager();
const track = new Track(textureManager);
const ground = new Ground(textureManager);

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

// Initialize game
async function init() {
    try {
        // Load textures
        await textureManager.loadTextures();

        // Create track and ground
        const { trackMesh, borderMesh } = track.createTrack();
        const groundResult = ground.createGround();

        // Add meshes to scene
        scene.add(trackMesh);
        scene.add(borderMesh);
        scene.add(groundResult.mesh);

        // Add ground physics body to world
        world.addBody(groundResult.body);

        // Create car
        const carBodyGeometry = new THREE.BoxGeometry(2, 0.5, 4);
        const carBodyMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 });
        const carBody = new THREE.Mesh(carBodyGeometry, carBodyMaterial);
        carBody.castShadow = true;
        carBody.receiveShadow = true;
        scene.add(carBody);

        // Create car physics body
        const carBodyShape = new CANNON.Box(new CANNON.Vec3(1, 0.25, 2));
        const carBodyBody = new CANNON.Body({ mass: CAR.MASS });
        carBodyBody.addShape(carBodyShape);
        carBodyBody.position.set(0, 0.5, 0);
        world.addBody(carBodyBody);

        // Create wheels
        const wheelGeometry = new THREE.CylinderGeometry(CAR.WHEEL_RADIUS, CAR.WHEEL_RADIUS, CAR.WHEEL_WIDTH, 32);
        const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
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
            carBody.add(wheel);
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

        // Create cones along the track
        const cones = [];
        const coneGeometry = new THREE.ConeGeometry(0.5, 2, 32);
        const coneMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
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

            carBody.position.copy(carBodyBody.position);
            carBody.quaternion.copy(carBodyBody.quaternion);

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
            camera.position.copy(carBody.position).add(cameraOffset);
            camera.lookAt(carBody.position);

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