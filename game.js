
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js";
import { startStory } from "./story.js";

/* MAYUSH.GAMEPLAY - NAYABASTI */

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 100, 350);

const camera = new THREE.PerspectiveCamera(
  65,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: "high-performance"
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.shadowMap.enabled = true;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

/* LIGHTS */

scene.add(new THREE.HemisphereLight(0xffffff, 0x526b43, 2));

const sun = new THREE.DirectionalLight(0xffffff, 2);
sun.position.set(50, 100, 40);
sun.castShadow = true;
scene.add(sun);

/* MATERIALS */

const materials = {
  grass: new THREE.MeshStandardMaterial({ color: 0x568b3d }),
  road: new THREE.MeshStandardMaterial({ color: 0x444444 }),
  white: new THREE.MeshStandardMaterial({ color: 0xffffff }),
  wall: new THREE.MeshStandardMaterial({ color: 0xe5c49a }),
  roof: new THREE.MeshStandardMaterial({ color: 0x914b32 }),
  wood: new THREE.MeshStandardMaterial({ color: 0x70472c }),
  leaves: new THREE.MeshStandardMaterial({ color: 0x267535 }),
  glass: new THREE.MeshStandardMaterial({ color: 0x83c8e8 })
};

/* HELPERS */

function box(x, y, z, sx, sy, sz, material) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(sx, sy, sz),
    material
  );

  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}

/* WORLD */

box(0, -0.55, 0, 500, 1, 500, materials.grass);
box(0, -0.01, 0, 12, 0.15, 400, materials.road);

for (let z = -190; z < 200; z += 12) {
  box(0, 0.08, z, 0.2, 0.02, 5, materials.white);
}

box(35, 0, -30, 100, 0.15, 8, materials.road);
box(-35, 0, 45, 100, 0.15, 8, materials.road);

/* HOUSES */

function createHouse(x, z, color = 0xe5c49a) {
  const wall = new THREE.MeshStandardMaterial({ color });

  box(x, 2, z, 12, 4, 10, wall);

  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(8.5, 4, 4),
    materials.roof
  );

  roof.position.set(x, 6, z);
  roof.rotation.y = Math.PI / 4;
  roof.castShadow = true;
  scene.add(roof);

  box(x, 1.1, z + 5.08, 1.6, 2.2, 0.15, materials.wood);
  box(x - 3.5, 2.5, z + 5.12, 1.8, 1.3, materials.glass);
  box(x + 3.5, 2.5, z + 5.12, 1.8, 1.3, materials.glass);
}

for (let i = 0; i < 9; i++) {
  const z = -100 + i * 24;
  createHouse(-25, z);
  createHouse(25, z + 10, 0xd8b58c);
}

/* TREES */

function createTree(x, z) {
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.35, 0.55, 4, 8),
    materials.wood
  );

  trunk.position.set(x, 2, z);
  trunk.castShadow = true;
  scene.add(trunk);

  const leaves = new THREE.Mesh(
    new THREE.SphereGeometry(3.2, 12, 12),
    materials.leaves
  );

  leaves.position.set(x, 5, z);
  leaves.castShadow = true;
  scene.add(leaves);
}

for (let i = 0; i < 60; i++) {
  const x = (Math.random() - 0.5) * 130;
  const z = (Math.random() - 0.5) * 350;

  if (Math.abs(x) > 10) createTree(x, z);
}

/* TEA SHOP */

box(-16, 1.7, -12, 10, 3.4, 8, materials.wall);
box(-16, 3.8, -12, 12, 0.5, 10, materials.roof);
box(-16, 1, -7.8, 5, 1, 1, materials.wood);

/* SCHOOL */

createHouse(42, -65, 0xf1d8a8);
box(42, 4, -58, 12, 1, 0.4, materials.wood);

/* CHAUTARI */

const chautari = new THREE.Mesh(
  new THREE.CylinderGeometry(4, 4, 0.7, 16),
  materials.wood
);
chautari.position.set(-25, 0.35, -30);
scene.add(chautari);

/* PLAYER CHARACTER */

function createPerson(shirtColor = 0x2255cc) {
  const person = new THREE.Group();

  const shirt = new THREE.MeshStandardMaterial({ color: shirtColor });
  const skin = new THREE.MeshStandardMaterial({ color: 0xd9a77d });
  const pants = new THREE.MeshStandardMaterial({ color: 0x202b42 });
  const black = new THREE.MeshStandardMaterial({ color: 0x171717 });

  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.42, 0.75, 4, 8),
    shirt
  );
  body.position.y = 1.35;
  person.add(body);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.32, 16, 16),
    skin
  );
  head.position.y = 2.15;
  person.add(head);

  const legGeometry = new THREE.BoxGeometry(0.22, 0.7, 0.25);

  const leftLeg = new THREE.Mesh(legGeometry, pants);
  leftLeg.position.set(-0.17, 0.48, 0);
  person.add(leftLeg);

  const rightLeg = new THREE.Mesh(legGeometry, pants);
  rightLeg.position.set(0.17, 0.48, 0);
  person.add(rightLeg);

  const leftArm = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 0.75, 0.22),
    shirt
  );
  leftArm.position.set(-0.52, 1.35, 0);
  person.add(leftArm);

  const rightArm = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 0.75, 0.22),
    shirt
  );
  rightArm.position.set(0.52, 1.35, 0);
  person.add(rightArm);

  const hair = new THREE.Mesh(
    new THREE.SphereGeometry(0.33, 16, 12),
    black
  );
  hair.scale.y = 0.45;
  hair.position.y = 2.36;
  person.add(hair);

  person.userData.legs = [leftLeg, rightLeg];
  person.userData.arms = [leftArm, rightArm];

  person.traverse((obj) => {
    if (obj.isMesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });

  return person;
}

const player = createPerson(0x2255cc);
player.position.set(0, 0, 5);
scene.add(player);

/* NPC VILLAGERS */

const npcPositions = [
  [-18, -12], [18, -25], [-20, -50], [20, -75],
  [-15, 25], [15, 55], [-30, 80], [30, 100]
];

const npcColors = [
  0x9b4b32, 0x315d9b, 0x34734b, 0x9b8732
];

npcPositions.forEach((pos, i) => {
  const npc = createPerson(npcColors[i % npcColors.length]);
  npc.scale.setScalar(0.9);
  npc.position.set(pos[0], 0, pos[1]);
  scene.add(npc);
});

/* MOBILE CONTROLS */

const controls = document.createElement("div");
controls.id = "mayush-controls";
controls.innerHTML = `
  <div id="joystick">
    <div id="joystick-knob"></div>
  </div>
  <button id="jump-button">JUMP</button>
`;
document.body.appendChild(controls);

const joystick = document.getElementById("joystick");
const knob = document.getElementById("joystick-knob");
const jumpButton = document.getElementById("jump-button");

let joystickX = 0;
let joystickY = 0;
let joystickPointer = null;

function updateJoystick(e) {
  const rect = joystick.getBoundingClientRect();

  let dx = e.clientX - (rect.left + rect.width / 2);
  let dy = e.clientY - (rect.top + rect.height / 2);

  const max = 36;
  const distance = Math.hypot(dx, dy);

  if (distance > max) {
    dx = dx / distance * max;
    dy = dy / distance * max;
  }

  joystickX = dx / max;
  joystickY = dy / max;
  knob.style.transform = `translate(${dx}px, ${dy}px)`;
}

joystick.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  e.stopPropagation();
  joystickPointer = e.pointerId;
  joystick.setPointerCapture(e.pointerId);
  updateJoystick(e);
});

joystick.addEventListener("pointermove", (e) => {
  if (joystickPointer === e.pointerId) updateJoystick(e);
});

function resetJoystick(e) {
  if (joystickPointer !== e.pointerId) return;

  joystickPointer = null;
  joystickX = 0;
  joystickY = 0;
  knob.style.transform = "translate(0, 0)";
}

joystick.addEventListener("pointerup", resetJoystick);
joystick.addEventListener("pointercancel", resetJoystick);

/* JUMP */

let velocityY = 0;
let isJumping = false;

jumpButton.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  e.stopPropagation();

  if (!isJumping) {
    velocityY = 9;
    isJumping = true;
  }
});

/* CAMERA */

let targetYaw = 0;
let targetPitch = 0.22;
let cameraDistance = 12;

const pointers = new Map();
let pinchStart = 0;
let pinchZoom = cameraDistance;

renderer.domElement.addEventListener("pointerdown", (e) => {
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

  if (renderer.domElement.setPointerCapture) {
    renderer.domElement.setPointerCapture(e.pointerId);
  }

  if (pointers.size === 2) {
    const p = [...pointers.values()];
    pinchStart = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y);
    pinchZoom = cameraDistance;
  }
});

renderer.domElement.addEventListener("pointermove", (e) => {
  if (!pointers.has(e.pointerId)) return;

  const old = pointers.get(e.pointerId);
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

  if (pointers.size === 1) {
    targetYaw -= (e.clientX - old.x) * 0.012;
    targetPitch += (e.clientY - old.y) * 0.009;
    targetPitch = THREE.MathUtils.clamp(targetPitch, -0.5, 1.1);
  }

  if (pointers.size === 2 && pinchStart > 0) {
    const p = [...pointers.values()];
    const current = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y);

    cameraDistance = THREE.MathUtils.clamp(
      pinchZoom + (pinchStart - current) * 0.035,
      5,
      30
    );
  }
});

function stopCamera(e) {
  pointers.delete(e.pointerId);
  if (pointers.size < 2) pinchStart = 0;
}

renderer.domElement.addEventListener("pointerup", stopCamera);
renderer.domElement.addEventListener("pointercancel", stopCamera);

/* KEYBOARD */

const keys = {};

window.addEventListener("keydown", (e) => {
  keys[e.key.toLowerCase()] = true;
});

window.addEventListener("keyup", (e) => {
  keys[e.key.toLowerCase()] = false;
});

/* STORY */

let gameStarted = false;

function startGame() {
  gameStarted = true;
  document.getElementById("loading")?.remove();
}

startStory(startGame);

/* CAMERA INITIAL POSITION */

camera.position.set(0, 6, 17);
camera.lookAt(0, 1, 5);

/* GAME LOOP */

const clock = new THREE.Clock();
const cameraTarget = new THREE.Vector3();
const movement = new THREE.Vector3();
const forward = new THREE.Vector3();
const right = new THREE.Vector3();
const direction = new THREE.Vector3();

function animate() {
  requestAnimationFrame(animate);

  const delta = Math.min(clock.getDelta(), 0.05);

  if (gameStarted) {
    let moveX = joystickX;
    let moveZ = -joystickY;

    if (keys.w || keys.arrowup) moveZ += 1;
    if (keys.s || keys.arrowdown) moveZ -= 1;
    if (keys.a || keys.arrowleft) moveX -= 1;
    if (keys.d || keys.arrowright) moveX += 1;

    movement.set(moveX, 0, moveZ);

    if (movement.length() > 1) movement.normalize();

    forward.set(-Math.sin(targetYaw), 0, -Math.cos(targetYaw));
    right.set(Math.cos(targetYaw), 0, -Math.sin(targetYaw));

    direction.set(0, 0, 0);
    direction.addScaledVector(forward, movement.z);
    direction.addScaledVector(right, movement.x);

    const moving = direction.length() > 0.05;

    if (moving) {
      direction.normalize();
      player.position.addScaledVector(direction, 7 * delta);

      player.rotation.y = Math.atan2(direction.x, direction.z);

      const swing = Math.sin(performance.now() * 0.012) * 0.55;
      player.userData.legs[0].rotation.x = swing;
      player.userData.legs[1].rotation.x = -swing;
      player.userData.arms[0].rotation.x = -swing;
      player.userData.arms[1].rotation.x = swing;
    } else {
      player.userData.legs.forEach((leg) => leg.rotation.x = 0);
      player.userData.arms.forEach((arm) => arm.rotation.x = 0);
    }

    velocityY -= 22 * delta;
    player.position.y += velocityY * delta;

    if (player.position.y <= 0) {
      player.position.y = 0;
      velocityY = 0;
      isJumping = false;
    }

    player.position.x = THREE.MathUtils.clamp(player.position.x, -90, 90);
    player.position.z = THREE.MathUtils.clamp(player.position.z, -190, 190);

    const horizontal = cameraDistance * Math.cos(targetPitch);
    const height = cameraDistance * Math.sin(targetPitch);

    cameraTarget.set(
      player.position.x + Math.sin(targetYaw) * horizontal,
      player.position.y + 1.5 + height,
      player.position.z + Math.cos(targetYaw) * horizontal
    );

    camera.position.lerp(cameraTarget, 0.15);
    camera.lookAt(player.position.x, player.position.y + 1.3, player.position.z);
  }

  renderer.render(scene, camera);
}

animate();

/* RESIZE */

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

document.getElementById("loading")?.remove();
console.log("MAYUSH.GAMEPLAY is running");
