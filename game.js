
import { startStory } from "./story.js";
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js";

/* =====================================
   MAYUSH ADVENTURE
   NAYABASTI 3D OPEN WORLD
===================================== */

// SCENE
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 65, 260);

const camera = new THREE.PerspectiveCamera(
  65, innerWidth / innerHeight, 0.1, 700
);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: "high-performance"
});

renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;

document.body.style.margin = "0";
document.body.style.overflow = "hidden";
document.body.style.background = "#87ceeb";
document.body.appendChild(renderer.domElement);

// LIGHTING
scene.add(
  new THREE.HemisphereLight(0xffffff, 0x53633b, 2)
);

const sunlight = new THREE.DirectionalLight(0xffffff, 2.2);
sunlight.position.set(35, 60, 25);
sunlight.castShadow = true;
sunlight.shadow.mapSize.set(1024, 1024);
scene.add(sunlight);

// MATERIAL HELPER
function material(color) {
  return new THREE.MeshStandardMaterial({ color });
}

// BOX HELPER
function makeBox(w, h, d, color, x, y, z, parent = scene) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    material(color)
  );

  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

// GROUND
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(500, 500),
  material(0x557c38)
);

ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// MAIN ROAD
const road = new THREE.Mesh(
  new THREE.PlaneGeometry(10, 350),
  material(0x555653)
);

road.rotation.x = -Math.PI / 2;
road.position.y = 0.035;
scene.add(road);

// ROAD EDGES
for (const x of [-5.1, 5.1]) {
  const edge = makeBox(0.15, 0.04, 350, 0xd9d4bd, x, 0.06, 0);
}

// ROAD CENTER LINES
for (let z = -165; z < 170; z += 10) {
  const line = makeBox(0.16, 0.045, 4, 0xffffff, 0, 0.07, z);
}

// CROSS ROAD
const crossRoad = new THREE.Mesh(
  new THREE.PlaneGeometry(90, 9),
  material(0x555653)
);

crossRoad.rotation.x = -Math.PI / 2;
crossRoad.position.set(0, 0.045, -35);
scene.add(crossRoad);

// ZEBRA CROSSING
for (let i = 0; i < 8; i++) {
  const stripe = new THREE.Mesh(
    new THREE.PlaneGeometry(7, 0.65),
    material(0xffffff)
  );

  stripe.rotation.x = -Math.PI / 2;
  stripe.position.set(0, 0.09, -42 + i * 0.95);
  scene.add(stripe);
}

// TREE
function makeTree(x, z, scale = 1) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.scale.setScalar(scale);

  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.38, 3, 10),
    material(0x704323)
  );

  trunk.position.y = 1.5;
  trunk.castShadow = true;
  group.add(trunk);

  const leaves = new THREE.Mesh(
    new THREE.SphereGeometry(1.8, 12, 10),
    material(0x267d32)
  );

  leaves.position.y = 3.8;
  leaves.scale.set(1, 1.1, 1);
  leaves.castShadow = true;
  group.add(leaves);

  scene.add(group);
  return group;
}

// BUSH
function makeBush(x, z) {
  const bush = new THREE.Mesh(
    new THREE.SphereGeometry(0.8, 10, 8),
    material(0x347b29)
  );

  bush.position.set(x, 0.65, z);
  bush.scale.set(1.3, 0.8, 1);
  scene.add(bush);
}

// NEPALI HOUSE
function makeHouse(x, z, wallColor) {
  const house = new THREE.Group();
  house.position.set(x, 0, z);
  scene.add(house);

  // Main walls
  makeBox(6, 3.5, 5, wallColor, 0, 1.75, 0, house);

  // Roof
  const roofLeft = makeBox(
    3.5, 0.3, 5.8, 0x8b3026,
    -1.4, 3.7, 0, house
  );

  roofLeft.rotation.z = -0.45;

  const roofRight = makeBox(
    3.5, 0.3, 5.8, 0x8b3026,
    1.4, 3.7, 0, house
  );

  roofRight.rotation.z = 0.45;

  // Door
  makeBox(1.1, 2.2, 0.16, 0x58331e,
    0, 1.1, -2.56, house);

  // Windows
  for (const xPos of [-2, 2]) {
    makeBox(0.9, 0.9, 0.15, 0x75c7e5,
      xPos, 2.2, -2.57, house);

    makeBox(0.1, 1, 0.2, 0xffffff,
      xPos, 2.2, -2.68, house);
  }

  // Courtyard
  makeBox(8, 0.12, 7, 0xbca68a,
    0, 0.02, -6, house);
}

// VILLAGE HOUSES
makeHouse(-14, -8, 0xe5c69a);
makeHouse(15, -12, 0xd9b58b);
makeHouse(-17, -45, 0xd4d0b4);
makeHouse(17, -58, 0xe0c49b);
makeHouse(-14, 35, 0xe7d3a8);
makeHouse(15, 45, 0xcbb18b);
makeHouse(-27, -80, 0xe2c6a1);
makeHouse(26, -95, 0xe6d3b0);

// TREES
for (let i = 0; i < 55; i++) {
  const side = Math.random() > 0.5 ? 1 : -1;
  const x = side * (9 + Math.random() * 35);
  const z = -150 + Math.random() * 300;

  makeTree(x, z, 0.7 + Math.random() * 0.7);
}

// BUSHES
for (let i = 0; i < 25; i++) {
  const x = (Math.random() - 0.5) * 65;
  const z = (Math.random() - 0.5) * 150;

  if (Math.abs(x) > 7) makeBush(x, z);
}

// CHAUTARI
function makeChautari(x, z) {
  const platform = new THREE.Mesh(
    new THREE.CylinderGeometry(3.5, 3.5, 0.5, 16),
    material(0xb5a18a)
  );

  platform.position.set(x, 0.25, z);
  platform.receiveShadow = true;
  scene.add(platform);

  makeTree(x, z, 1.8);

  for (let i = 0; i < 6; i++) {
    const angle = i * Math.PI / 3;

    makeBox(
      1.7, 0.5, 0.7, 0x888078,
      x + Math.cos(angle) * 2.3,
      0.7,
      z + Math.sin(angle) * 2.3
    );
  }
}

makeChautari(-23, -25);

// SCHOOL
function makeSchool(x, z) {
  const school = new THREE.Group();
  school.position.set(x, 0, z);
  scene.add(school);

  makeBox(15, 5, 9, 0xe9d8b7, 0, 2.5, 0, school);
  makeBox(16, 0.5, 10, 0x9b3028, 0, 5.2, 0, school);

  // School entrance
  makeBox(1.6, 2.6, 0.2, 0x57351f,
    0, 1.3, -4.65, school);

  // Windows
  for (let i = -2; i <= 2; i++) {
    makeBox(
      1.5, 1.3, 0.15, 0x79c8e6,
      i * 2.5, 3, -4.65, school
    );
  }

  // School sign
  makeBox(6, 0.9, 0.25, 0x24613b,
    0, 5.9, -4.8, school);
}

makeSchool(26, -65);

// PLAYGROUND
function makePlayground(x, z) {
  const field = new THREE.Mesh(
    new THREE.PlaneGeometry(28, 23),
    material(0x65a947)
  );

  field.rotation.x = -Math.PI / 2;
  field.position.set(x, 0.06, z);
  scene.add(field);

  // Field boundary
  makeBox(28, 0.12, 0.15, 0xffffff, x, 0.12, z - 11.5);
  makeBox(28, 0.12, 0.15, 0xffffff, x, 0.12, z + 11.5);

  // Football goal
  makeBox(0.2, 2.8, 0.2, 0xffffff, x - 9, 1.4, z);
  makeBox(0.2, 2.8, 0.2, 0xffffff, x + 9, 1.4, z);
  makeBox(18, 0.2, 0.2, 0xffffff, x, 2.8, z);

  // Swing frame
  makeBox(0.2, 3.5, 0.2, 0x333333, x + 13, 1.75, z);
  makeBox(0.2, 3.5, 0.2, 0x333333, x + 16, 1.75, z);
  makeBox(3.4, 0.2, 0.2, 0x333333, x + 14.5, 3.5, z);

  // Swing seat
  makeBox(1.5, 0.2, 0.6, 0xe7b52c,
    x + 14.5, 1.3, z);
}

makePlayground(27, -15);

// TRAFFIC LIGHT
function makeTrafficLight(x, z) {
  makeBox(0.18, 5, 0.18, 0x333333, x, 2.5, z);
  makeBox(0.9, 2.2, 0.6, 0x202020, x, 5.5, z);

  const lights = [];

  const colors = [0xff0000, 0xffcc00, 0x00dd44];

  colors.forEach((color, i) => {
    const light = new THREE.Mesh(
      new THREE.SphereGeometry(0.25, 16, 12),
      new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.5
      })
    );

    light.position.set(x, 6.2 - i * 0.65, z - 0.32);
    scene.add(light);
    lights.push(light);
  });

  return lights;
}

const trafficLights = [
  makeTrafficLight(-6.5, -35),
  makeTrafficLight(6.5, -35)
];

// CHARACTER
const player = new THREE.Group();
scene.add(player);

function part(parent, geometry, color, x, y, z) {
  const mesh = new THREE.Mesh(
    geometry,
    material(color)
  );

  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  parent.add(mesh);
  return mesh;
}

// Body
part(player, new THREE.BoxGeometry(0.85, 1.05, 0.42),
  0x263f75, 0, 1.55, 0);

// Head
part(player, new THREE.SphereGeometry(0.34, 20, 20),
  0xe8b995, 0, 2.32, 0);

// Hair
part(player, new THREE.SphereGeometry(
  0.35, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2
), 0x171313, 0, 2.42, 0);

// Eyes
part(player, new THREE.SphereGeometry(0.045, 10, 10),
  0x111111, -0.12, 2.35, -0.29);

part(player, new THREE.SphereGeometry(0.045, 10, 10),
  0x111111, 0.12, 2.35, -0.29);

// Arms
const leftArm = new THREE.Group();
leftArm.position.set(-0.52, 1.95, 0);
player.add(leftArm);

part(leftArm, new THREE.BoxGeometry(0.22, 0.85, 0.23),
  0xe8b995, 0, -0.4, 0);

const rightArm = new THREE.Group();
rightArm.position.set(0.52, 1.95, 0);
player.add(rightArm);

part(rightArm, new THREE.BoxGeometry(0.22, 0.85, 0.23),
  0xe8b995, 0, -0.4, 0);

// Legs
const leftLeg = new THREE.Group();
leftLeg.position.set(-0.23, 1.05, 0);
player.add(leftLeg);

part(leftLeg, new THREE.BoxGeometry(0.3, 0.9, 0.32),
  0x20232b, 0, -0.4, 0);

const rightLeg = new THREE.Group();
rightLeg.position.set(0.23, 1.05, 0);
player.add(rightLeg);

part(rightLeg, new THREE.BoxGeometry(0.3, 0.9, 0.32),
  0x20232b, 0, -0.4, 0);

// PLAYER START
player.position.set(0, 0, 8);

// CAMERA
camera.position.set(0, 5, 18);
camera.lookAt(0, 1, 8);

// MOBILE CONTROLS
const style = document.createElement("style");

style.textContent = `
.controls {
  position:fixed;
  bottom:calc(25px + env(safe-area-inset-bottom));
  left:18px;
  display:grid;
  grid-template-columns:58px 58px 58px;
  gap:7px;
  z-index:20;
}
.game-btn {
  width:58px;
  height:58px;
  border-radius:50%;
  background:rgba(255,255,255,.19);
  border:2px solid rgba(255,255,255,.65);
  color:white;
  font-size:25px;
  font-weight:bold;
  touch-action:none;
  -webkit-user-select:none;
  user-select:none;
}
.game-btn:active {
  background:rgba(255,255,255,.45);
}
.jump-btn {
  position:fixed;
  right:25px;
  bottom:calc(45px + env(safe-area-inset-bottom));
  width:78px;
  height:78px;
  border-radius:50%;
  background:rgba(40,180,100,.30);
  border:2px solid rgba(255,255,255,.8);
  color:white;
  font-weight:bold;
  font-size:15px;
  z-index:20;
  touch-action:none;
}
`;
document.head.appendChild(style);

const controls = document.createElement("div");
controls.className = "controls";

controls.innerHTML = `
<div></div>
<button class="game-btn" data-key="forward">↑</button>
<div></div>
<button class="game-btn" data-key="left">←</button>
<button class="game-btn" data-key="back">↓</button>
<button class="game-btn" data-key="right">→</button>
`;

document.body.appendChild(controls);

const jumpButton = document.createElement("button");
jumpButton.className = "jump-btn";
jumpButton.textContent = "JUMP";
document.body.appendChild(jumpButton);

// INPUT
const keys = {};

const keyMap = {
  w: "forward",
  arrowup: "forward",
  s: "back",
  arrowdown: "back",
  a: "left",
  arrowleft: "left",
  d: "right",
  arrowright: "right"
};

window.addEventListener("keydown", e => {
  const key = keyMap[e.key.toLowerCase()];
  if (key) {
    keys[key] = true;
    e.preventDefault();
  }

  if (e.code === "Space") {
    jump();
    e.preventDefault();
  }
});

window.addEventListener("keyup", e => {
  const key = keyMap[e.key.toLowerCase()];
  if (key) keys[key] = false;
});

window.addEventListener("blur", () => {
  Object.keys(keys).forEach(key => keys[key] = false);
});

// TOUCH MOVEMENT
document.querySelectorAll("[data-key]").forEach(btn => {
  const key = btn.dataset.key;

  btn.addEventListener("pointerdown", e => {
    e.preventDefault();
    keys[key] = true;
    btn.setPointerCapture(e.pointerId);
  });

  ["pointerup", "pointercancel", "lostpointercapture"].forEach(event => {
    btn.addEventListener(event, () => {
      keys[key] = false;
    });
  });
});

// JUMP PHYSICS
let velocityY = 0;
let onGround = true;

function jump() {
  if (!onGround) return;

  velocityY = 5.5;
  onGround = false;
}

jumpButton.addEventListener("pointerdown", e => {
  e.preventDefault();
  jump();
});

// GAME ANIMATION
const clock = new THREE.Clock();
let walkTime = 0;
let trafficTime = 0;

function animate() {
  requestAnimationFrame(animate);

  const delta = Math.min(clock.getDelta(), 0.05);
  const moving =
    keys.forward || keys.back || keys.left || keys.right;

  const speed = 7 * delta;

  if (keys.forward) player.position.z -= speed;
  if (keys.back) player.position.z += speed;
  if (keys.left) player.position.x -= speed;
  if (keys.right) player.position.x += speed;

  // LIMIT WORLD
  player.position.x = THREE.MathUtils.clamp(
    player.position.x, -120, 120
  );

  player.position.z = THREE.MathUtils.clamp(
    player.position.z, -165, 165
  );

  // CHARACTER DIRECTION
  if (keys.forward) player.rotation.y = 0;
  else if (keys.back) player.rotation.y = Math.PI;
  else if (keys.left) player.rotation.y = Math.PI / 2;
  else if (keys.right) player.rotation.y = -Math.PI / 2;

  // WALK ANIMATION
  if (moving && onGround) {
    walkTime += delta * 10;

    leftArm.rotation.x = Math.sin(walkTime) * 0.7;
    rightArm.rotation.x = -Math.sin(walkTime) * 0.7;

    leftLeg.rotation.x = -Math.sin(walkTime) * 0.65;
    rightLeg.rotation.x = Math.sin(walkTime) * 0.65;
  } else if (onGround) {
    leftArm.rotation.x = 0;
    rightArm.rotation.x = 0;
    leftLeg.rotation.x = 0;
    rightLeg.rotation.x = 0;
  }

  // JUMP
  if (!onGround) {
    velocityY -= 14 * delta;
    player.position.y += velocityY * delta;

    if (player.position.y <= 0) {
      player.position.y = 0;
      velocityY = 0;
      onGround = true;
    }
  }

  // TRAFFIC LIGHT ANIMATION
  trafficTime += delta;

  const active = Math.floor(trafficTime / 3) % 3;

  trafficLights.forEach(lights => {
    lights.forEach((light, i) => {
      light.material.emissiveIntensity =
        i === active ? 2 : 0.1;
    });
  });

  // CAMERA FOLLOW
  const cameraTarget = new THREE.Vector3(
    player.position.x,
    player.position.y + 5,
    player.position.z + 10
  );

  camera.position.lerp(cameraTarget, 0.09);

  camera.lookAt(
    player.position.x,
    player.position.y + 1.2,
    player.position.z
  );

  renderer.render(scene, camera);
}

// RESIZE
window.addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

// START GAME
startStory(() => {
  console.log("MAYUSH ADVENTURE STARTED");
});

animate();

console.log("NAYABASTI OPEN WORLD READY");
