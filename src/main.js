import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB); // Sky blue background
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(10, 20, 10);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
scene.add(directionalLight);

// Physics world
const world = new CANNON.World({
    gravity: new CANNON.Vec3(0, -9.82, 0)
});

// Ground (grass)
const groundGeometry = new THREE.PlaneGeometry(1000, 1000);
const groundMaterial = new THREE.MeshStandardMaterial({
    color: 0x1a7b1e, // Brighter grass green
    roughness: 0.8,
    metalness: 0.2
});
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const groundBody = new CANNON.Body({
    type: CANNON.Body.STATIC,
    shape: new CANNON.Plane()
});
groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
world.addBody(groundBody);

// Track creation
const trackWidth = 20;
const trackHeightOffset = 0.1; // Slight height above ground
const innerTrackRadius = 40;
const trackPoints = [];
const innerTrackPoints = [];
const outerTrackPoints = [];

// Create a more complex track path
for (let i = 0; i <= 360; i += 5) {
    const angle = (i * Math.PI) / 180;
    // More interesting track with varying radius
    const radius = innerTrackRadius + 15 * Math.sin(angle * 3) + 10 * Math.cos(angle * 2);
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    trackPoints.push(new THREE.Vector3(x, trackHeightOffset, z));

    // Create inner and outer track borders
    const nextAngle = ((i + 5) * Math.PI) / 180;
    const nextX = Math.cos(nextAngle) * radius;
    const nextZ = Math.sin(nextAngle) * radius;

    const direction = new THREE.Vector3(nextX - x, 0, nextZ - z).normalize();
    const perpendicular = new THREE.Vector3(-direction.z, 0, direction.x);

    const innerPoint = new THREE.Vector3(
        x - perpendicular.x * (trackWidth / 2),
        trackHeightOffset,
        z - perpendicular.z * (trackWidth / 2)
    );

    const outerPoint = new THREE.Vector3(
        x + perpendicular.x * (trackWidth / 2),
        trackHeightOffset,
        z + perpendicular.z * (trackWidth / 2)
    );

    innerTrackPoints.push(innerPoint);
    outerTrackPoints.push(outerPoint);
}

// Create track paved surface using shape and extrusion
const trackShape = new THREE.Shape();
trackShape.moveTo(outerTrackPoints[0].x, outerTrackPoints[0].z);

// Add outer points
for (let i = 1; i < outerTrackPoints.length; i++) {
    trackShape.lineTo(outerTrackPoints[i].x, outerTrackPoints[i].z);
}

// Add inner points in reverse
for (let i = innerTrackPoints.length - 1; i >= 0; i--) {
    trackShape.lineTo(innerTrackPoints[i].x, innerTrackPoints[i].z);
}

trackShape.closePath();

const extrudeSettings = {
    steps: 1,
    depth: trackHeightOffset,
    bevelEnabled: false
};

const trackGeometry = new THREE.ExtrudeGeometry(trackShape, extrudeSettings);
const trackMaterial = new THREE.MeshStandardMaterial({
    color: 0x555555, // Dark gray asphalt
    roughness: 0.7,
    metalness: 0.1
});

const trackMesh = new THREE.Mesh(trackGeometry, trackMaterial);
trackMesh.rotation.x = -Math.PI / 2;
trackMesh.receiveShadow = true;
scene.add(trackMesh);

// Track borders (white lines)
const innerTrackLine = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(innerTrackPoints),
    new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 3 })
);
innerTrackLine.position.y = trackHeightOffset + 0.01;
scene.add(innerTrackLine);

const outerTrackLine = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(outerTrackPoints),
    new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 3 })
);
outerTrackLine.position.y = trackHeightOffset + 0.01;
scene.add(outerTrackLine);

// Create cones along the track
const cones = [];
const coneGeometry = new THREE.ConeGeometry(0.5, 1.5, 32);
const coneMaterial = new THREE.MeshStandardMaterial({ color: 0xff4500 }); // Brighter orange
const coneShape = new CANNON.Cylinder(0.5, 0.2, 1.5, 8);

// Add cones along the track
for (let i = 0; i < trackPoints.length; i += 10) {
    const point = trackPoints[i];
    const nextPoint = trackPoints[(i + 1) % trackPoints.length];
    const direction = nextPoint.clone().sub(point).normalize();
    const perpendicular = new THREE.Vector3(-direction.z, 0, direction.x);

    // Add cones on both sides of the track
    [-1, 1].forEach(side => {
        // Place cones closer to the track edge
        const coneOffset = side * (trackWidth / 2 - 1);
        const conePosition = point.clone().add(perpendicular.multiplyScalar(coneOffset));

        const cone = new THREE.Mesh(coneGeometry, coneMaterial);
        cone.position.copy(conePosition);
        cone.position.y = 0.75; // Half height of cone
        cone.castShadow = true;
        scene.add(cone);

        const coneBody = new CANNON.Body({
            mass: 0.5, // Lighter cones are easier to knock over
            material: new CANNON.Material()
        });
        coneBody.addShape(coneShape);
        coneBody.position.copy(conePosition);
        coneBody.position.y = 0.75;
        world.addBody(coneBody);

        cones.push({ mesh: cone, body: coneBody });
    });
}

// Car body (Subaru WRX)
const carBody = new THREE.Group();

// Main body
const mainBody = new THREE.Mesh(
    new THREE.BoxGeometry(2.5, 0.8, 4.5),
    new THREE.MeshStandardMaterial({ color: 0x808080 })
);
mainBody.position.y = 0.4;
mainBody.castShadow = true;
carBody.add(mainBody);

// Hood
const hood = new THREE.Mesh(
    new THREE.BoxGeometry(2.2, 0.1, 1.5),
    new THREE.MeshStandardMaterial({ color: 0x808080 })
);
hood.position.set(0, 0.8, 1);
hood.castShadow = true;
carBody.add(hood);

// Roof
const roof = new THREE.Mesh(
    new THREE.BoxGeometry(2, 0.1, 1.5),
    new THREE.MeshStandardMaterial({ color: 0x808080 })
);
roof.position.set(0, 1.2, 0);
roof.castShadow = true;
carBody.add(roof);

// Wheels
const wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.4, 32);
const wheelMaterial = new THREE.MeshStandardMaterial({
    color: 0x333333,
    roughness: 0.7,
    metalness: 0.3
});

const wheelPositions = [
    { x: -1.5, y: 0.4, z: -1.5 },
    { x: 1.5, y: 0.4, z: -1.5 },
    { x: -1.5, y: 0.4, z: 1.5 },
    { x: 1.5, y: 0.4, z: 1.5 }
];

wheelPositions.forEach(pos => {
    const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheel.position.set(pos.x, pos.y, pos.z);
    wheel.rotation.z = Math.PI / 2;
    wheel.castShadow = true;
    carBody.add(wheel);
});

scene.add(carBody);

// Car physics
const carBodyShape = new CANNON.Box(new CANNON.Vec3(1.25, 0.4, 2.25));
const carBodyBody = new CANNON.Body({
    mass: 1500,
    material: new CANNON.Material()
});
carBodyBody.addShape(carBodyShape);
carBodyBody.position.set(0, 1, 0);
carBodyBody.angularDamping = 0.3;
carBodyBody.linearDamping = 0.3;
world.addBody(carBodyBody);

// Wheels physics
const wheelShape = new CANNON.Sphere(0.4);
const wheelBodies = [];
const wheelConstraints = [];

wheelPositions.forEach(pos => {
    const wheelBody = new CANNON.Body({
        mass: 1,
        material: new CANNON.Material()
    });
    wheelBody.addShape(wheelShape);
    wheelBody.position.set(pos.x, pos.y + 1, pos.z);
    wheelBody.angularDamping = 0.4;
    world.addBody(wheelBody);

    const constraint = new CANNON.HingeConstraint(carBodyBody, wheelBody, {
        pivotA: new CANNON.Vec3(pos.x, pos.y, pos.z),
        axisA: new CANNON.Vec3(0, 0, 1),
        maxForce: 1e6
    });
    world.addConstraint(constraint);

    wheelBodies.push(wheelBody);
    wheelConstraints.push(constraint);
});

// Car movement variables
const maxForwardSpeed = 25;
const maxReverseSpeed = 15;
const acceleration = 0.1; // Reduced acceleration 
const deceleration = 0.97; // Smoother deceleration
const turnSpeed = 0.03; // Reduced turn speed
let speed = 0;
let angle = 0;

// Camera setup
camera.position.set(0, 15, -30);
camera.lookAt(carBody.position);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 10;
controls.maxDistance = 100;
controls.minPolarAngle = 0.1; // Prevent going under the ground

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

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    // Simple car movement without complex physics
    if (input.forward) {
        speed = Math.min(speed + acceleration, maxForwardSpeed);
    } else if (input.backward) {
        speed = Math.max(speed - acceleration, -maxReverseSpeed);
    } else {
        speed *= deceleration;
        if (Math.abs(speed) < 0.1) speed = 0;
    }

    // Turn the car
    if (Math.abs(speed) > 0.1) {
        if (input.left) {
            angle += turnSpeed * Math.sign(speed);
        }
        if (input.right) {
            angle -= turnSpeed * Math.sign(speed);
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
    world.step(1 / 60);

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
            // Apply force to knock over the cone
            const direction = conePosition.clone().sub(carPosition).normalize();
            cone.body.applyImpulse(
                new CANNON.Vec3(direction.x * speed * 10, 5, direction.z * speed * 10),
                new CANNON.Vec3(0, 0, 0)
            );
        }
    });

    // Update camera
    controls.target.copy(carBody.position);
    controls.update();

    renderer.render(scene, camera);
}

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Start the game
animate(); 