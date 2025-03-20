import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GAME_CONFIG } from './config.js';
import { TextureManager } from './textures.js';
import { Track } from './track.js';
import { Ground } from './ground.js';
import { Environment } from './environment.js';
import { Car } from './car.js';

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
const car = new Car();

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
        case 'w':
            input.forward = true;
            break;
        case 's':
            input.backward = true;
            break;
        case 'a':
            input.left = true;
            break;
        case 'd':
            input.right = true;
            break;
    }
});

document.addEventListener('keyup', (event) => {
    switch (event.key.toLowerCase()) {
        case 'w':
            input.forward = false;
            break;
        case 's':
            input.backward = false;
            break;
        case 'a':
            input.left = false;
            break;
        case 'd':
            input.right = false;
            break;
    }
});

// Initialize game
let time = 0; // Add time variable for animation

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

        // Add car to scene and world
        car.addToScene(scene);
        car.addToWorld(world);

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

            // Update car
            car.update(input);

            // Update physics world
            world.step(GAME_CONFIG.PHYSICS.FIXED_TIME_STEP);

            // Update cones
            cones.forEach(cone => {
                cone.mesh.position.copy(cone.body.position);
                cone.mesh.quaternion.copy(cone.body.quaternion);
            });

            // Check for collisions with cones
            const carPosition = new THREE.Vector3(car.carBodyBody.position.x, car.carBodyBody.position.y, car.carBodyBody.position.z);
            cones.forEach(cone => {
                const conePosition = new THREE.Vector3(cone.body.position.x, cone.body.position.y, cone.body.position.z);
                const distance = carPosition.distanceTo(conePosition);
                if (distance < 3) {
                    const direction = conePosition.clone().sub(carPosition).normalize();
                    cone.body.applyImpulse(
                        new CANNON.Vec3(direction.x * car.speed * 10, 5, direction.z * car.speed * 10),
                        new CANNON.Vec3(0, 0, 0)
                    );
                }
            });

            // Update camera to follow car
            const cameraOffset = new THREE.Vector3(
                Math.sin(car.angle) * GAME_CONFIG.CAMERA.DISTANCE,
                GAME_CONFIG.CAMERA.HEIGHT,
                Math.cos(car.angle) * GAME_CONFIG.CAMERA.DISTANCE
            );
            camera.position.copy(car.group.position).add(cameraOffset);
            camera.lookAt(car.group.position);

            renderer.render(scene, camera);
        }

        animate();
    } catch (error) {
        console.error('Error initializing game:', error);
        // Add a more detailed error message to the screen
        const errorDiv = document.createElement('div');
        errorDiv.style.position = 'fixed';
        errorDiv.style.top = '50%';
        errorDiv.style.left = '50%';
        errorDiv.style.transform = 'translate(-50%, -50%)';
        errorDiv.style.color = 'red';
        errorDiv.style.fontSize = '24px';
        errorDiv.style.textAlign = 'center';
        errorDiv.style.padding = '20px';
        errorDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        errorDiv.style.borderRadius = '10px';
        errorDiv.innerHTML = `
            <div style="margin-bottom: 10px;">Error loading game</div>
            <div style="font-size: 16px; color: #ff9999;">${error.message}</div>
            <div style="font-size: 14px; margin-top: 10px;">Please check the console for details and refresh the page.</div>
        `;
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