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

// Game state
let gameState = 'menu'; // menu, countdown, playing, finished
let countdown = 3;
let score = GAME_CONFIG.TRACK.INITIAL_SCORE;
let gameStartTime = 0;
let gameEndTime = 0;

// Create UI elements
const menuElement = document.createElement('div');
menuElement.style.position = 'absolute';
menuElement.style.top = '50%';
menuElement.style.left = '50%';
menuElement.style.transform = 'translate(-50%, -50%)';
menuElement.style.color = 'white';
menuElement.style.fontSize = '32px';
menuElement.style.fontFamily = 'Arial, sans-serif';
menuElement.style.textAlign = 'center';
menuElement.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)';
menuElement.innerHTML = `
    <div style="margin-bottom: 20px;">Racing Game</div>
    <button id="startButton" style="
        padding: 10px 20px;
        font-size: 24px;
        background-color: #4CAF50;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        transition: background-color 0.3s;
    ">Start Game</button>
`;
document.body.appendChild(menuElement);

const countdownElement = document.createElement('div');
countdownElement.style.position = 'absolute';
countdownElement.style.top = '50%';
countdownElement.style.left = '50%';
countdownElement.style.transform = 'translate(-50%, -50%)';
countdownElement.style.color = 'white';
countdownElement.style.fontSize = '72px';
countdownElement.style.fontFamily = 'Arial, sans-serif';
countdownElement.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)';
countdownElement.style.display = 'none';
document.body.appendChild(countdownElement);

const scoreElement = document.createElement('div');
scoreElement.style.position = 'absolute';
scoreElement.style.top = '20px';
scoreElement.style.right = '20px';
scoreElement.style.color = 'white';
scoreElement.style.fontSize = '24px';
scoreElement.style.fontFamily = 'Arial, sans-serif';
scoreElement.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)';
scoreElement.style.display = 'none';
document.body.appendChild(scoreElement);

const gameOverElement = document.createElement('div');
gameOverElement.style.position = 'absolute';
gameOverElement.style.top = '50%';
gameOverElement.style.left = '50%';
gameOverElement.style.transform = 'translate(-50%, -50%)';
gameOverElement.style.color = 'white';
gameOverElement.style.fontSize = '32px';
gameOverElement.style.fontFamily = 'Arial, sans-serif';
gameOverElement.style.textAlign = 'center';
gameOverElement.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)';
gameOverElement.style.display = 'none';
document.body.appendChild(gameOverElement);

// Event listeners
document.getElementById('startButton').addEventListener('click', startGame);

function startGame() {
    gameState = 'countdown';
    menuElement.style.display = 'none';
    countdownElement.style.display = 'block';
    countdown = 3;
    score = GAME_CONFIG.TRACK.INITIAL_SCORE;

    // Reset car position to start line
    const startPos = track.getStartPosition();
    car.carBodyBody.position.copy(startPos.position);
    car.carBodyBody.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), startPos.angle);
    car.group.position.copy(startPos.position);
    car.group.quaternion.copy(car.carBodyBody.quaternion);
    car.angle = startPos.angle;
    car.speed = 0;

    startCountdown();
}

function startCountdown() {
    if (countdown > 0) {
        countdownElement.textContent = countdown;
        countdown--;
        setTimeout(startCountdown, 1000);
    } else {
        gameState = 'playing';
        countdownElement.style.display = 'none';
        scoreElement.style.display = 'block';
        gameStartTime = time;
        // Enable car controls
        input.forward = false;
        input.backward = false;
        input.left = false;
        input.right = false;
    }
}

// Initialize game
let time = 0;
let lapStarted = false;
let lapCompleted = false;
let startLineCrossed = false;
let lastConeHit = 0;
let cones = [];

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
        const { trackMesh, borderMesh, barriers, startLine, finishLine, startPosition } = track.createTrack();
        const groundResult = ground.createGround();

        // Add meshes to scene
        scene.add(trackMesh);
        scene.add(borderMesh);
        barriers.forEach(barrier => scene.add(barrier));
        scene.add(startLine);
        scene.add(finishLine);
        scene.add(groundResult.mesh);

        // Add ground physics body to world
        world.addBody(groundResult.body);

        // Add car to scene and world
        car.addToScene(scene);
        car.addToWorld(world);

        // Position car at start line
        car.carBodyBody.position.copy(startPosition.position);
        car.carBodyBody.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), startPosition.angle);
        car.group.position.copy(startPosition.position);
        car.group.quaternion.copy(car.carBodyBody.quaternion);
        car.angle = startPosition.angle;

        // Create cones with enhanced materials
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

        // Place cones along the track
        track.trackPoints.forEach((point, index) => {
            if (index % GAME_CONFIG.TRACK.CONE_SPACING === 0) {
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

            // Update car only if game is playing
            if (gameState === 'playing') {
                car.update(input);
            }

            // Update physics world
            world.step(GAME_CONFIG.PHYSICS.FIXED_TIME_STEP);

            // Update cones
            cones.forEach(cone => {
                cone.mesh.position.copy(cone.body.position);
                cone.mesh.quaternion.copy(cone.body.quaternion);
            });

            // Check for collisions with cones
            if (gameState === 'playing') {
                const carPosition = new THREE.Vector3(car.carBodyBody.position.x, car.carBodyBody.position.y, car.carBodyBody.position.z);
                const currentTime = time;

                cones.forEach(cone => {
                    const conePosition = new THREE.Vector3(cone.body.position.x, cone.body.position.y, cone.body.position.z);
                    const distance = carPosition.distanceTo(conePosition);
                    if (distance < 3 && currentTime - lastConeHit > 1) {
                        const direction = conePosition.clone().sub(carPosition).normalize();
                        cone.body.applyImpulse(
                            new CANNON.Vec3(direction.x * car.speed * 10, 5, direction.z * car.speed * 10),
                            new CANNON.Vec3(0, 0, 0)
                        );
                        lastConeHit = currentTime;
                        score = Math.max(0, score - GAME_CONFIG.TRACK.CONE_PENALTY);
                    }
                });

                // Check for finish line
                const finishLinePosition = new THREE.Vector3(finishLine.position.x, finishLine.position.y, finishLine.position.z);
                const distanceToFinish = carPosition.distanceTo(finishLinePosition);
                if (distanceToFinish < 5) {
                    gameState = 'finished';
                    gameEndTime = time;
                    scoreElement.style.display = 'none';
                    gameOverElement.innerHTML = `
                        <div style="margin-bottom: 20px;">Game Over!</div>
                        <div style="font-size: 24px;">Final Score: ${Math.round(score)}</div>
                        <div style="font-size: 24px;">Time: ${((gameEndTime - gameStartTime) / 1000).toFixed(2)}s</div>
                        <button id="restartButton" style="
                            margin-top: 20px;
                            padding: 10px 20px;
                            font-size: 24px;
                            background-color: #4CAF50;
                            color: white;
                            border: none;
                            border-radius: 5px;
                            cursor: pointer;
                            transition: background-color 0.3s;
                        ">Play Again</button>
                    `;
                    gameOverElement.style.display = 'block';
                    document.getElementById('restartButton').addEventListener('click', () => {
                        gameOverElement.style.display = 'none';
                        menuElement.style.display = 'block';
                        gameState = 'menu';
                    });
                }

                // Update score based on time
                score = Math.max(0, score - GAME_CONFIG.TRACK.SCORE_DECAY_RATE * 0.016);
                scoreElement.textContent = `Score: ${Math.round(score)}`;
            }

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