
import { startStory } from "./story.js";
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js";

// =====================================
// MAYUSH GAMEPLAY - DUAL CAMERA SYSTEM
// =====================================

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 35, 220);

const camera = new THREE.PerspectiveCamera(
  65,
  window.innerWidth / window.innerHeight,
  0.1,
  600
);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: "high-performance"
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.domElement.style.position = "fixed";
renderer.domElement.style.inset = "0";
renderer.domElement.style.zIndex = "0";
document.body.appendChild(renderer.domElement);

// =====================================
// LIGHTS
// =====================================

const sunlight = new THREE.DirectionalLight(0xffffff, 2);
sunlight.position.set(30, 50, 20);
sunlight.castShadow = true;
scene.add(sunlight);

scene.add(new THREE.HemisphereLight(0xffffff, 0x52633d, 2));

// =====================================
// WORLD
// =====================================

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(400, 400),
  new THREE.MeshStandardMaterial({ color: 0x557c38 })
);

ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

function makeRoad(x, z, width, length) {
  const road = new THREE.Mesh(
    new THREE.PlaneGeometry(width, length),
    new THREE.MeshStandardMaterial({ color: 0x77736b })
  );

  road.rotation.x = -Math.PI / 2;
  road.position.set(x, 0.04, z);
  road.receiveShadow = true;
  scene.add(road);
}

makeRoad(0, 0, 9, 350);
makeRoad(0, -35, 80, 8);

// Road markings
for (let z = -170; z < 170; z += 12) {
  const line = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.04, 5),
    new THREE.MeshStandardMaterial({ color: 0xffffff })
  );

  line.position.set(0, 0.09, z);
  scene.add(line);
}

// =====================================
// SIMPLE VILLAGE BUILDINGS
// =====================================

function makeHouse(x, z, color = 0xd8b48c) {
  const house = new THREE.Group();

  const walls = new THREE.Mesh(
    new THREE.BoxGeometry(8, 5, 7),
    new THREE.MeshStandardMaterial({ color })
  );
  walls.position.y = 2.5;
  walls.castShadow = true;
  house.add(walls);

  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(6.3, 3, 4),
    new THREE.MeshStandardMaterial({ color: 0x8b3e2f })
  );
  roof.position.y = 6.4;
  roof.rotation.y = Math.PI / 4;
  roof.castShadow = true;
  house.add(roof);

  house.position.set(x, 0, z);
  scene.add(house);
}

makeHouse(-14, -12, 0xd9b58c);
makeHouse(15, -28, 0xe0c39a);
makeHouse(-17, -48, 0xc9a77b);
makeHouse(18, -65, 0xd8b48c);
makeHouse(-15, -85, 0xe0c39a);

// School
const school = new THREE.Mesh(
  new THREE.BoxGeometry(18, 7, 10),
  new THREE.MeshStandardMaterial({ color: 0xe8d4a5 })
);
school.position.set(27, 3.5, -70);
scene.add(school);

// School roof
const schoolRoof = new THREE.Mesh(
  new THREE.BoxGeometry(19, 0.7, 11),
  new THREE.MeshStandardMaterial({ color: 0x9b3328 })
);
schoolRoof.position.set(27, 7.3, -70);
scene.add(schoolRoof);

// Playground
const playground = new THREE.Mesh(
  new THREE.PlaneGeometry(25, 20),
  new THREE.MeshStandardMaterial({ color: 0x6c9848 })
);
playground.rotation.x = -Math.PI / 2;
playground.position.set(28, 0.06, -25);
scene.add(playground);

// Trees
function makeTree(x, z) {
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.35, 0.5, 3, 8),
    new THREE.MeshStandardMaterial({ color: 0x704326 })
  );

  trunk.position.set(x, 1.5, z);
  scene.add(trunk);

  const leaves = new THREE.Mesh(
    new THREE.SphereGeometry(2.2, 10, 10),
    new THREE.MeshStandardMaterial({ color: 0x286b32 })
  );

  leaves.position.set(x, 4, z);
  leaves.castShadow = true;
  scene.add(leaves);
}

for (let i = 0; i < 35; i++) {
  const z = -150 + i * 9;
  makeTree(-13 - Math.random() * 8, z);
  makeTree(13 + Math.random() * 8, z);
}

// =====================================
// PLAYER
// =====================================

const player = new THREE.Group();

const body = new THREE.Mesh(
  new THREE.CapsuleGeometry(0.45, 1, 4, 8),
  new THREE.MeshStandardMaterial({ color: 0x263f75 })
);
body.position.y = 1.1;
body.castShadow = true;
player.add(body);

const head = new THREE.Mesh(
  new THREE.SphereGeometry(0.38, 16, 16),
  new THREE.MeshStandardMaterial({ color: 0xd5a078 })
);
head.position.y = 2.05;
player.add(head);

player.position.set(0, 0, 0);
scene.add(player);

// =====================================
// CAMERA SETTINGS
// =====================================

let cameraYaw = 0;
let cameraPitch = 0.28;
let cameraDistance = 8;
let cameraHeight = 2.2;

let cameraMode = "FREE";

const cameraTarget = new THREE.Vector3();
const desiredCameraPosition = new THREE.Vector3();

function updateCamera() {
  cameraTarget.set(
    player.position.x,
    player.position.y + 1.5,
    player.position.z
  );

  const horizontal = Math.cos(cameraPitch) * cameraDistance;

  desiredCameraPosition.set(
    player.position.x + Math.sin(cameraYaw) * horizontal,
    player.position.y + cameraHeight +
      Math.sin(cameraPitch) * cameraDistance,
    player.position.z + Math.cos(cameraYaw) * horizontal
  );

  camera.position.lerp(desiredCameraPosition, 0.14);
  camera.lookAt(cameraTarget);
}

// =====================================
// CAMERA MODE BUTTON
// =====================================

const modeButton = document.createElement("button");
modeButton.textContent = "CAM: FREE";

Object.assign(modeButton.style, {
  position: "fixed",
  top: "15px",
  right: "15px",
  zIndex: "10",
  padding: "12px 17px",
  border: "1px solid white",
  borderRadius: "12px",
  background: "rgba(0,0,0,0.65)",
  color: "white",
  fontWeight: "bold",
  fontSize: "13px"
});

document.body.appendChild(modeButton);

modeButton.addEventListener("click", () => {
  cameraMode = cameraMode === "FREE" ? "FACE" : "FREE";
  modeButton.textContent = "CAM: " + cameraMode;
});

// =====================================
// MOBILE CAMERA SWIPE
// =====================================

const cameraArea = document.createElement("div");

Object.assign(cameraArea.style, {
  position: "fixed",
  top: "65px",
  right: "0",
  width: "55%",
  height: "65%",
  zIndex: "2",
  touchAction: "none",
  background: "transparent"
});

document.body.appendChild(cameraArea);

let cameraPointer = null;
let lastX = 0;
let lastY = 0;

cameraArea.addEventListener("pointerdown", e => {
  cameraPointer = e.pointerId;
  lastX = e.clientX;
  lastY = e.clientY;
  cameraArea.setPointerCapture(e.pointerId);
});

cameraArea.addEventListener("pointermove", e => {
  if (cameraPointer !== e.pointerId) return;

  const dx = e.clientX - lastX;
  const dy = e.clientY - lastY;

  cameraYaw -= dx * 0.008;
  cameraPitch += dy * 0.006;

  cameraPitch = THREE.MathUtils.clamp(
    cameraPitch,
    -0.25,
    0.85
  );

  lastX = e.clientX;
  lastY = e.clientY;
});

cameraArea.addEventListener("pointerup", () => {
  cameraPointer = null;
});

cameraArea.addEventListener("pointercancel", () => {
  cameraPointer = null;
});

// =====================================
// MOBILE JOYSTICK
// =====================================

const joystick = document.createElement("div");

Object.assign(joystick.style, {
  position: "fixed",
  bottom: "35px",
  left: "25px",
  width: "125px",
  height: "125px",
  borderRadius: "50%",
  border: "2px solid rgba(255,255,255,0.6)",
  background: "rgba(0,0,0,0.25)",
  zIndex: "8",
  touchAction: "none"
});

document.body.appendChild(joystick);

const stick = document.createElement("div");

Object.assign(stick.style, {
  position: "absolute",
  width: "48px",
  height: "48px",
  left: "36px",
  top: "36px",
  borderRadius: "50%",
  background: "rgba(255,255,255,0.75)",
  boxShadow: "0 2px 8px #000"
});

joystick.appendChild(stick);

let moveX = 0;
let moveY = 0;
let joystickPointer = null;

function resetJoystick() {
  moveX = 0;
  moveY = 0;
  stick.style.left = "36px";
  stick.style.top = "36px";
}

joystick.addEventListener("pointerdown", e => {
  joystickPointer = e.pointerId;
  joystick.setPointerCapture(e.pointerId);
  moveJoystick(e);
});

joystick.addEventListener("pointermove", e => {
  if (joystickPointer !== e.pointerId) return;
  moveJoystick(e);
});

function moveJoystick(e) {
  const rect = joystick.getBoundingClientRect();

  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  let dx = e.clientX - centerX;
  let dy = e.clientY - centerY;

  const max = 38;
  const length = Math.hypot(dx, dy);

  if (length > max) {
    dx = dx / length * max;
    dy = dy / length * max;
  }

  moveX = dx / max;
  moveY = dy / max;

  stick.style.left = 36 + dx + "px";
  stick.style.top = 36 + dy + "px";
}

joystick.addEventListener("pointerup", () => {
  joystickPointer = null;
  resetJoystick();
});

joystick.addEventListener("pointercancel", () => {
  joystickPointer = null;
  resetJoystick();
});

// =====================================
// JUMP BUTTON
// =====================================

const jumpButton = document.createElement("button");
jumpButton.textContent = "JUMP";

Object.assign(jumpButton.style, {
  position: "fixed",
  bottom: "48px",
  right: "35px",
  width: "75px",
  height: "75px",
  borderRadius: "50%",
  border: "2px solid white",
  background: "rgba(20,80,180,0.7)",
  color: "white",
  fontWeight: "bold",
  zIndex: "10",
  touchAction: "none"
});

document.body.appendChild(jumpButton);

let jumpVelocity = 0;
let isJumping = false;

function jump() {
  if (!isJumping) {
    jumpVelocity = 0.22;
    isJumping = true;
  }
}

jumpButton.addEventListener("pointerdown", jump);

// =====================================
// KEYBOARD CONTROLS
// =====================================

const keys = {};

window.addEventListener("keydown", e => {
  keys[e.key.toLowerCase()] = true;

  if (e.code === "Space") jump();

  if (e.key.toLowerCase() === "c") {
    modeButton.click();
  }
});

window.addEventListener("keyup", e => {
  keys[e.key.toLowerCase()] = false;
});

// =====================================
// PLAYER MOVEMENT
// =====================================

const clock = new THREE.Clock();

function updatePlayer(delta) {
  let forward = -moveY;
  let sideways = moveX;

  if (keys["w"] || keys["arrowup"]) forward = 1;
  if (keys["s"] || keys["arrowdown"]) forward = -1;
  if (keys["a"] || keys["arrowleft"]) sideways = -1;
  if (keys["d"] || keys["arrowright"]) sideways = 1;

  const inputLength = Math.hypot(forward, sideways);

  if (inputLength > 1) {
    forward /= inputLength;
    sideways /= inputLength;
  }

  const speed = 7 * delta;

  const forwardX = -Math.sin(cameraYaw);
  const forwardZ = -Math.cos(cameraYaw);

  const rightX = Math.cos(cameraYaw);
  const rightZ = -Math.sin(cameraYaw);

  const dx = (forwardX * forward + rightX * sideways) * speed;
  const dz = (forwardZ * forward + rightZ * sideways) * speed;

  player.position.x += dx;
  player.position.z += dz;

  if (cameraMode === "FACE") {
    player.rotation.y = cameraYaw;
  } else if (inputLength > 0.08) {
    player.rotation.y = Math.atan2(dx, dz);
  }

  // Jump physics
  if (isJumping) {
    player.position.y += jumpVelocity;
    jumpVelocity -= 0.012;

    if (player.position.y <= 0) {
      player.position.y = 0;
      jumpVelocity = 0;
      isJumping = false;
    }
  }
}

// =====================================
// RESIZE
// =====================================

function resizeGame() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
}

window.addEventListener("resize", resizeGame);

// =====================================
// FULLSCREEN SUPPORT
// =====================================

async function enterFullscreen() {
  try {
    if (document.documentElement.requestFullscreen &&
        !document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
    }
  } catch (error) {
    console.log("Fullscreen requires user permission.");
  }

  try {
    if (screen.orientation?.lock) {
      await screen.orientation.lock("landscape");
    }
  } catch (error) {
    console.log("Rotate phone to landscape manually.");
  }
}

modeButton.addEventListener("dblclick", enterFullscreen);

// =====================================
// GAME LOOP
// =====================================

function animate() {
  requestAnimationFrame(animate);

  const delta = Math.min(clock.getDelta(), 0.05);

  updatePlayer(delta);
  updateCamera();

  renderer.render(scene, camera);
}

updateCamera();
animate();

startStory(() => {
  console.log("MAYUSH ADVENTURE STARTED");
});
