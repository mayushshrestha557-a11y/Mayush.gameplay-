
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
