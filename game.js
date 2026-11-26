
import { startStory } from "./story.js";
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js";

// SCENE
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 40, 220);

const camera = new THREE.PerspectiveCamera(
  65, window.innerWidth / window.innerHeight, 0.1, 600
);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.shadowMap.enabled = true;
document.body.style.margin = "0";
document.body.style.overflow = "hidden";
document.body.appendChild(renderer.domElement);

// LIGHT
scene.add(new THREE.HemisphereLight(0xffffff, 0x52633d, 2));

const sun = new THREE.DirectionalLight(0xffffff, 2);
sun.position.set(20, 30, 10);
sun.castShadow = true;
scene.add(sun);

// GROUND
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(300, 300),
  new THREE.MeshStandardMaterial({ color: 0x557c38 })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// ROAD
const road = new THREE.Mesh(
  new THREE.PlaneGeometry(9, 300),
  new THREE.MeshStandardMaterial({ color: 0x77736b })
);
road.rotation.x = -Math.PI / 2;
road.position.y = 0.02;
scene.add(road);

// CHARACTER
const player = new THREE.Group();
scene.add(player);

function part(parent, geometry, color, x, y, z) {
  const mesh = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({ color })
  );
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  parent.add(mesh);
  return mesh;
}

// BODY
part(player, new THREE.BoxGeometry(0.85, 1.05, 0.42),
  0x263f75, 0, 1.55, 0);

// HEAD
part(player, new THREE.SphereGeometry(0.34, 20, 20),
  0xe8b995, 0, 2.32, 0);

// HAIR
part(player, new THREE.SphereGeometry(0.35, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2),
  0x171313, 0, 2.42, 0);

// ARMS
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

// LEGS
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

// CAMERA
camera.position.set(0, 5, 9);
camera.lookAt(player.position);

// MOBILE CONTROLS
const style = document.createElement("style");
style.textContent = `
.controls {
  position:fixed; bottom:25px; left:20px;
  display:grid; grid-template-columns:55px 55px 55px;
  gap:7px; z-index:10;
}
.game-btn {
  width:55px; height:55px; border-radius:50%;
  background:rgba(255,255,255,.20);
  border:2px solid rgba(255,255,255,.65);
  color:white; font-size:25px;
  touch-action:none;
}
.jump-btn {
  position:fixed; right:28px; bottom:45px;
  width:75px; height:75px; border-radius:50%;
  background:rgba(40,180,100,.35);
  border:2px solid white; color:white;
  font-weight:bold; z-index:10;
  touch-action:none;
}
`;
document.head.appendChild(style);

const controls = document.createElement("div");
controls.className = "controls";
controls.innerHTML = `
<div></div><button class="game-btn" data-key="forward">↑</button><div></div>
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
  w: "forward", arrowup: "forward",
  s: "back", arrowdown: "back",
  a: "left", arrowleft: "left",
  d: "right", arrowright: "right"
};

window.addEventListener("keydown", e => {
  const key = keyMap[e.key.toLowerCase()];
  if (key) keys[key] = true;
  if (e.code === "Space") jump();
});

window.addEventListener("keyup", e => {
  const key = keyMap[e.key.toLowerCase()];
  if (key) keys[key] = false;
});

document.querySelectorAll("[data-key]").forEach(btn => {
  const key = btn.dataset.key;
  btn.addEventListener("pointerdown", e => {
    e.preventDefault();
    keys[key] = true;
    btn.setPointerCapture(e.pointerId);
  });
  ["pointerup", "pointercancel", "lostpointercapture"].forEach(event => {
    btn.addEventListener(event, () => keys[key] = false);
  });
});

// JUMP PHYSICS
let velocityY = 0;
let onGround = true;

function jump() {
  if (!onGround) return;
  velocityY = 0.22;
  onGround = false;
}

jumpButton.addEventListener("pointerdown", e => {
  e.preventDefault();
  jump();
});

// ANIMATION
const clock = new THREE.Clock();
let walkTime = 0;

function animate() {
  requestAnimationFrame(animate);

  const delta = Math.min(clock.getDelta(), 0.05);
  const moving = keys.forward || keys.back || keys.left || keys.right;

  const speed = 7 * delta;

  if (keys.forward) player.position.z -= speed;
  if (keys.back) player.position.z += speed;
  if (keys.left) player.position.x -= speed;
  if (keys.right) player.position.x += speed;

  if (moving) {
    walkTime += delta * 10;
    leftArm.rotation.x = Math.sin(walkTime) * 0.7;
    rightArm.rotation.x = -Math.sin(walkTime) * 0.7;
    leftLeg.rotation.x = -Math.sin(walkTime) * 0.65;
    rightLeg.rotation.x = Math.sin(walkTime) * 0.65;
  } else {
    leftArm.rotation.x = 0;
    rightArm.rotation.x = 0;
    leftLeg.rotation.x = 0;
    rightLeg.rotation.x = 0;
  }

  // JUMP
  if (!onGround) {
    velocityY -= 0.65 * delta;
    player.position.y += velocityY;
    if (player.position.y <= 0) {
      player.position.y = 0;
      velocityY = 0;
      onGround = true;
    }
  }

  // CAMERA FOLLOW
  const target = new THREE.Vector3(
    player.position.x,
    player.position.y + 5,
    player.position.z + 9
  );

  camera.position.lerp(target, 0.08);
  camera.lookAt(
    player.position.x,
    player.position.y + 1.2,
    player.position.z
  );

  renderer.render(scene, camera);
}

window.addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

animate();

startStory(() => {
  console.log("MAYUSH ADVENTURE STARTED");
});


/* =================================
   NAYABASTI 3D WORLD
================================= */

// OBJECT HELPER
function makeBox(w, h, d, color, x, y, z) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshStandardMaterial({ color })
  );
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}

// TREE
function makeTree(x, z, scale = 1) {
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(
      0.25 * scale, 0.4 * scale,
      3 * scale, 10
    ),
    new THREE.MeshStandardMaterial({ color: 0x704323 })
  );

  trunk.position.set(x, 1.5 * scale, z);
  trunk.castShadow = true;
  scene.add(trunk);

  const leaves = new THREE.Mesh(
    new THREE.SphereGeometry(1.8 * scale, 12, 10),
    new THREE.MeshStandardMaterial({ color: 0x267d32 })
  );

  leaves.position.set(x, 3.8 * scale, z);
  leaves.castShadow = true;
  scene.add(leaves);
}

// NEPALI VILLAGE HOUSE
function makeHouse(x, z, wallColor) {
  // Walls
  makeBox(5, 3, 4.5, wallColor, x, 1.5, z);

  // Roof
  const roof1 = makeBox(
    3, 0.25, 5.1, 0x8b3026,
    x - 1.05, 3.45, z
  );
  roof1.rotation.z = -0.55;

  const roof2 = makeBox(
    3, 0.25, 5.1, 0x8b3026,
    x + 1.05, 3.45, z
  );
  roof2.rotation.z = 0.55;

  // Door
  makeBox(0.9, 2, 0.12, 0x58331e,
    x, 1, z - 2.31);

  // Windows
  makeBox(0.85, 0.8, 0.13, 0x8bd5e8,
    x - 1.5, 2, z - 2.32);

  makeBox(0.85, 0.8, 0.13, 0x8bd5e8,
    x + 1.5, 2, z - 2.32);
}

// VILLAGE HOUSES
makeHouse(-13, -8, 0xe5c69a);
makeHouse(13, -12, 0xd9b58b);
makeHouse(-15, -35, 0xd4d0b4);
makeHouse(14, -43, 0xe0c49b);
makeHouse(-13, 28, 0xe7d3a8);
makeHouse(13, 32, 0xcbb18b);

// TREES AROUND VILLAGE
for (let i = 0; i < 35; i++) {
  const x = (Math.random() - 0.5) * 65;
  const z = (Math.random() - 0.5) * 150;

  if (Math.abs(x) > 6) {
    makeTree(x, z, 0.7 + Math.random() * 0.5);
  }
}

// SIDE ROAD
const sideRoad = new THREE.Mesh(
  new THREE.PlaneGeometry(60, 8),
  new THREE.MeshStandardMaterial({ color: 0x77736b })
);
sideRoad.rotation.x = -Math.PI / 2;
sideRoad.position.set(0, 0.04, -18);
scene.add(sideRoad);

// ZEBRA CROSSING
for (let i = 0; i < 7; i++) {
  const stripe = new THREE.Mesh(
    new THREE.PlaneGeometry(7, 0.45),
    new THREE.MeshStandardMaterial({ color: 0xffffff })
  );

  stripe.rotation.x = -Math.PI / 2;
  stripe.position.set(0, 0.07, -21 + i * 0.9);
  scene.add(stripe);
}

// TRAFFIC LIGHT
function makeTrafficLight(x, z) {
  makeBox(0.18, 5, 0.18, 0x333333, x, 2.5, z);
  makeBox(0.9, 2.2, 0.6, 0x202020, x, 5.5, z);

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
  });
}

makeTrafficLight(-5.5, -18);
makeTrafficLight(5.5, -18);

// CHAUTARI
function makeChautari(x, z) {
  const platform = new THREE.Mesh(
    new THREE.CylinderGeometry(3, 3, 0.5, 12),
    new THREE.MeshStandardMaterial({ color: 0xb5a18a })
  );
  platform.position.set(x, 0.25, z);
  platform.receiveShadow = true;
  scene.add(platform);

  makeTree(x, z, 1.8);

  // Stone seating
  for (let i = 0; i < 6; i++) {
    const angle = i * Math.PI / 3;
    makeBox(
      1.5, 0.45, 0.7, 0x888078,
      x + Math.cos(angle) * 2.2,
      0.65,
      z + Math.sin(angle) * 2.2
    );
  }
}

makeChautari(-20, -22);

// SCHOOL
function makeSchool(x, z) {
  makeBox(13, 5, 9, 0xe9d8b7, x, 2.5, z);

  // School roof
  makeBox(14, 0.5, 10, 0x9b3028, x, 5.2, z);

  // Entrance
  makeBox(1.5, 2.7, 0.2, 0x57351f,
    x, 1.35, z - 4.6);

  // Windows
  for (let i = -2; i <= 2; i++) {
    makeBox(
      1.3, 1.3, 0.15, 0x79c8e6,
      x + i * 2.3, 3, z - 4.65
    );
  }

  // School sign
  makeBox(5, 0.8, 0.2, 0x24613b,
    x, 5.9, z - 4.8);
}

makeSchool(24, -35);

// PLAYGROUND
function makePlayground(x, z) {
  // Green playground
  const field = new THREE.Mesh(
    new THREE.PlaneGeometry(24, 20),
    new THREE.MeshStandardMaterial({ color: 0x65a947 })
  );
  field.rotation.x = -Math.PI / 2;
  field.position.set(x, 0.05, z);
  scene.add(field);

  // Goal posts
  makeBox(0.2, 2.5, 0.2, 0xffffff, x - 9, 1.25, z);
  makeBox(0.2, 2.5, 0.2, 0xffffff, x + 9, 1.25, z);
  makeBox(18, 0.2, 0.2, 0xffffff, x, 2.5, z);

  // Swing
  makeBox(0.15, 3.5, 0.15, 0x333333, x + 12, 1.75, z);
  makeBox(0.15, 3.5, 0.15, 0x333333, x + 15, 1.75, z);
  makeBox(3.2, 0.15, 0.15, 0x333333, x + 13.5, 3.5, z);

  makeBox(2, 0.15, 0.5, 0xe7b52c,
    x + 13.5, 1.1, z);
}

makePlayground(27, -10);

console.log("NAYABASTI 3D WORLD LOADED");

