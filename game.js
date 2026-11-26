
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/loaders/GLTFLoader.js";
import { clone } from "https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/utils/SkeletonUtils.js";
import { startStory } from "./story.js";

/* =====================================
   MAYUSH.GAMEPLAY - NAYABASTI
===================================== */

// SCENE
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 80, 300);

// CAMERA
const camera = new THREE.PerspectiveCamera(
  65,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

let targetYaw = 0;
let targetPitch = 0.28;
let cameraDistance = 12;

const MIN_ZOOM = 5;
const MAX_ZOOM = 28;

// RENDERER
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: "high-performance"
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;

renderer.domElement.style.position = "fixed";
renderer.domElement.style.inset = "0";
renderer.domElement.style.width = "100%";
renderer.domElement.style.height = "100%";
renderer.domElement.style.zIndex = "1";
renderer.domElement.style.touchAction = "none";

document.body.appendChild(renderer.domElement);

// LIGHT
scene.add(new THREE.HemisphereLight(0xffffff, 0x61734b, 2));

const sunlight = new THREE.DirectionalLight(0xffffff, 2.2);
sunlight.position.set(60, 100, 40);
sunlight.castShadow = true;
sunlight.shadow.mapSize.set(1024, 1024);
scene.add(sunlight);

// MATERIALS
const materials = {
  grass: new THREE.MeshStandardMaterial({ color: 0x558b42 }),
  road: new THREE.MeshStandardMaterial({ color: 0x454545 }),
  white: new THREE.MeshStandardMaterial({ color: 0xffffff }),
  wall: new THREE.MeshStandardMaterial({ color: 0xe8c99b }),
  roof: new THREE.MeshStandardMaterial({ color: 0x934a32 }),
  wood: new THREE.MeshStandardMaterial({ color: 0x795438 }),
  leaves: new THREE.MeshStandardMaterial({ color: 0x277b35 })
};

// BASIC OBJECT
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

// GROUND
box(0, -0.6, 0, 500, 1, 500, materials.grass);

// MAIN ROAD
box(0, -0.02, 0, 12, 0.15, 400, materials.road);

// ROAD LINES
for (let z = -190; z < 200; z += 12) {
  box(0, 0.07, z, 0.25, 0.02, 6, materials.white);
}

// SIDE ROADS
box(35, 0, -30, 100, 0.15, 8, materials.road);
box(-35, 0, 45, 100, 0.15, 8, materials.road);

// HOUSES
function createHouse(x, z, color = 0xe8c99b) {
  const wallMaterial = new THREE.MeshStandardMaterial({ color });

  box(x, 2, z, 12, 4, 10, wallMaterial);

  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(8.5, 4, 4),
    materials.roof
  );

  roof.position.set(x, 6, z);
  roof.rotation.y = Math.PI / 4;
  roof.scale.set(1, 0.7, 0.8);
  roof.castShadow = true;
  scene.add(roof);

  // Door
  box(x, 1.1, z + 5.05, 1.6, 2.2, 0.12, materials.wood);

  // Windows
  const windowMaterial = new THREE.MeshStandardMaterial({
    color: 0x83c8e8
  });

  box(x - 3.5, 2.5, z + 5.1, 1.8, 1.3, 0.1, windowMaterial);
  box(x + 3.5, 2.5, z + 5.1, 1.8, 1.3, 0.1, windowMaterial);
}

// VILLAGE HOUSES
for (let i = 0; i < 9; i++) {
  const z = -100 + i * 24;

  createHouse(-25, z, 0xe6c69a);
  createHouse(25, z + 10, 0xd8b58c);
}

// TREES
function createTree(x, z) {
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.4, 0.6, 4, 8),
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

for (let i = 0; i < 65; i++) {
  const x = (Math.random() - 0.5) * 130;
  const z = (Math.random() - 0.5) * 350;

  if (Math.abs(x) > 10) createTree(x, z);
}

// TEA SHOP
box(-16, 1.7, -12, 10, 3.4, 8, materials.wall);
box(-16, 3.8, -12, 12, 0.5, 10, materials.roof);
box(-16, 1, -7.8, 5, 1, 1, materials.wood);

// SCHOOL
createHouse(42, -65, 0xf1d8a8);

// SCHOOL SIGN
box(42, 4, -58, 12, 1, 0.4, materials.wood);

// CHAUTARI
const chautari = new THREE.Mesh(
  new THREE.CylinderGeometry(4, 4, 0.7, 16),
  materials.wood
);
chautari.position.set(-25, 0.35, -30);
scene.add(chautari);

// PLAYGROUND
box(35, 0.05, -15, 35, 0.12, 25, materials.grass);

// =====================================
// PLAYER AND ONLINE CHARACTERS
// =====================================

const loader = new GLTFLoader();

const CHARACTER_URL =
  "https://threejs.org/examples/models/gltf/Soldier.glb";

let player;
let playerMixer;
let playerActions = {};
let currentAction;
let mixers = [];

const playerPosition = new THREE.Vector3(0, 0, 5);

const fallbackMaterial = new THREE.MeshStandardMaterial({
  color: 0x2255cc
});

// Temporary character while model loads
function createFallbackPlayer() {
  const group = new THREE.Group();

  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.55, 1.1, 4, 8),
    fallbackMaterial
  );

  body.position.y = 1.2;
  group.add(body);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.38, 16, 16),
    new THREE.MeshStandardMaterial({ color: 0xe5b58c })
  );

  head.position.y = 2.2;
  group.add(head);

  scene.add(group);
  return group;
}

player = createFallbackPlayer();
player.position.copy(playerPosition);

function setAction(name) {
  if (!playerActions[name]) return;

  const next = playerActions[name];

  if (currentAction === next) return;

  if (currentAction) currentAction.fadeOut(0.2);

  next.reset().fadeIn(0.2).play();
  currentAction = next;
}

// LOAD ONLINE CHARACTER
loader.load(
  CHARACTER_URL,
  (gltf) => {
    const model = gltf.scene;

    model.scale.setScalar(1);
    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    scene.remove(player);

    player = model;
    player.position.copy(playerPosition);
    scene.add(player);

    playerMixer = new THREE.AnimationMixer(player);
    mixers.push(playerMixer);

    gltf.animations.forEach((animation) => {
      const action = playerMixer.clipAction(animation);
      playerActions[animation.name] = action;
    });

    if (playerActions.Idle) {
      setAction("Idle");
    } else if (gltf.animations.length) {
      currentAction = playerMixer.clipAction(gltf.animations[0]);
      currentAction.play();
    }

    console.log("Mayush character loaded!");
  },
  undefined,
  (error) => {
    console.error("Character loading failed:", error);
    console.log("Using temporary character instead.");
  }
);

// =====================================
// VILLAGERS / NPC CHARACTERS
// =====================================

const npcPositions = [
  [-18, -12],
  [18, -25],
  [-20, -50],
  [20, -75],
  [-15, 25],
  [15, 55],
  [-30, 80],
  [30, 100]
];

loader.load(
  CHARACTER_URL,
  (gltf) => {
    npcPositions.forEach((position, index) => {
      const npc = clone(gltf.scene);

      npc.scale.setScalar(0.9);
      npc.position.set(position[0], 0, position[1]);

      npc.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;

          child.material = child.material.clone();

          if (index % 3 === 0) {
            child.material.color.set(0x9b4b32);
          } else if (index % 3 === 1) {
            child.material.color.set(0x315d9b);
          } else {
            child.material.color.set(0x34734b);
          }
        }
      });

      scene.add(npc);

      if (gltf.animations.length) {
        const mixer = new THREE.AnimationMixer(npc);
        mixers.push(mixer);

        const idle =
          gltf.animations.find((a) => a.name === "Idle") ||
          gltf.animations[0];

        mixer.clipAction(idle).play();
      }
    });

    console.log("Village characters loaded!");
  },
  undefined,
  (error) => {
    console.error("NPC loading failed:", error);
  }
);

// =====================================
// MOBILE CONTROLS
// =====================================

const controls = document.createElement("div");

controls.innerHTML = `
  <div id="joystick">
    <div id="joystick-knob"></div>
  </div>

  <button id="jump-button">JUMP</button>
`;

controls.style.cssText = `
  position:fixed;
  inset:0;
  z-index:5;
  pointer-events:none;
`;

document.body.appendChild(controls);

const joystick = document.getElementById("joystick");
const knob = document.getElementById("joystick-knob");
const jumpButton = document.getElementById("jump-button");

joystick.style.cssText = `
  position:absolute;
  left:25px;
  bottom:35px;
  width:125px;
  height:125px;
  border-radius:50%;
  background:rgba(255,255,255,0.15);
  border:2px solid rgba(255,255,255,0.5);
  pointer-events:auto;
  touch-action:none;
`;

knob.style.cssText = `
  position:absolute;
  width:48px;
  height:48px;
  left:36px;
  top:36px;
  border-radius:50%;
  background:rgba(255,255,255,0.8);
`;

jumpButton.style.cssText = `
  position:absolute;
  right:30px;
  bottom:50px;
  width:85px;
  height:85px;
  border-radius:50%;
  background:rgba(255,170,0,0.8);
  color:white;
  border:2px solid white;
  font-weight:bold;
  pointer-events:auto;
  touch-action:none;
`;

let joystickX = 0;
let joystickY = 0;
let joystickPointer = null;

joystick.addEventListener("pointerdown", (e) => {
  e.stopPropagation();
  joystickPointer = e.pointerId;
  joystick.setPointerCapture(e.pointerId);
  moveJoystick(e);
});

joystick.addEventListener("pointermove", (e) => {
  if (joystickPointer !== e.pointerId) return;
  moveJoystick(e);
});

function moveJoystick(e) {
  const rect = joystick.getBoundingClientRect();

  let dx = e.clientX - (rect.left + rect.width / 2);
  let dy = e.clientY - (rect.top + rect.height / 2);

  const max = 38;
  const length = Math.sqrt(dx * dx + dy * dy);

  if (length > max) {
    dx = (dx / length) * max;
    dy = (dy / length) * max;
  }

  joystickX = dx / max;
  joystickY = dy / max;

  knob.style.transform = `translate(${dx}px, ${dy}px)`;
}

function releaseJoystick(e) {
  if (joystickPointer !== e.pointerId) return;

  joystickPointer = null;
  joystickX = 0;
  joystickY = 0;
  knob.style.transform = "translate(0px, 0px)";
}

joystick.addEventListener("pointerup", releaseJoystick);
joystick.addEventListener("pointercancel", releaseJoystick);

// JUMP
let velocityY = 0;
let isJumping = false;

jumpButton.addEventListener("pointerdown", (e) => {
  e.stopPropagation();

  if (!isJumping) {
    velocityY = 9;
    isJumping = true;
  }
});

// =====================================
// CAMERA TOUCH CONTROLS
// =====================================

let activePointers = new Map();
let previousX = 0;
let previousY = 0;
let pinchDistance = 0;
let pinchZoom = cameraDistance;

function distanceBetweenTouches() {
  const points = [...activePointers.values()];

  if (points.length < 2) return 0;

  return Math.hypot(
    points[0].x - points[1].x,
    points[0].y - points[1].y
  );
}

renderer.domElement.addEventListener("pointerdown", (e) => {
  activePointers.set(e.pointerId, {
    x: e.clientX,
    y: e.clientY
  });

  renderer.domElement.setPointerCapture(e.pointerId);

  if (activePointers.size === 1) {
    previousX = e.clientX;
    previousY = e.clientY;
  }

  if (activePointers.size === 2) {
    pinchDistance = distanceBetweenTouches();
    pinchZoom = cameraDistance;
  }
});

renderer.domElement.addEventListener("pointermove", (e) => {
  if (!activePointers.has(e.pointerId)) return;

  const old = activePointers.get(e.pointerId);

  activePointers.set(e.pointerId, {
    x: e.clientX,
    y: e.clientY
  });

  if (activePointers.size === 1) {
    const dx = e.clientX - old.x;
    const dy = e.clientY - old.y;

    targetYaw -= dx * 0.012;
    targetPitch += dy * 0.009;

    targetPitch = THREE.MathUtils.clamp(
      targetPitch,
      -0.7,
      1.15
    );
  }

  if (activePointers.size === 2 && pinchDistance > 0) {
    const currentDistance = distanceBetweenTouches();

    cameraDistance = THREE.MathUtils.clamp(
      pinchZoom + (pinchDistance - currentDistance) * 0.035,
      MIN_ZOOM,
      MAX_ZOOM
    );
  }
});

function removePointer(e) {
  activePointers.delete(e.pointerId);

  if (activePointers.size === 1) {
    const remaining = [...activePointers.values()][0];
    previousX = remaining.x;
    previousY = remaining.y;
  }

  if (activePointers.size < 2) {
    pinchDistance = 0;
  }
}

renderer.domElement.addEventListener("pointerup", removePointer);
renderer.domElement.addEventListener("pointercancel", removePointer);

// =====================================
// KEYBOARD CONTROLS
// =====================================

const keys = {};

window.addEventListener("keydown", (e) => {
  keys[e.key.toLowerCase()] = true;
});

window.addEventListener("keyup", (e) => {
  keys[e.key.toLowerCase()] = false;
});

// =====================================
// GAME START
// =====================================

let gameStarted = false;

function startGame() {
  gameStarted = true;

  const loading = document.getElementById("loading");
  if (loading) loading.remove();

  console.log("NAYABASTI GAME STARTED!");
}

// STORY INTRO
if (typeof startStory === "function") {
  startStory(startGame);
} else {
  startGame();
}

// =====================================
// GAME LOOP
// =====================================

const clock = new THREE.Clock();

const forward = new THREE.Vector3();
const right = new THREE.Vector3();
const movement = new THREE.Vector3();

function animate() {
  requestAnimationFrame(animate);

  const delta = Math.min(clock.getDelta(), 0.05);

  mixers.forEach((mixer) => mixer.update(delta));

  if (gameStarted && player) {
    // Keyboard + Joystick
    let moveX = joystickX;
    let moveZ = -joystickY;

    if (keys.w || keys.arrowup) moveZ += 1;
    if (keys.s || keys.arrowdown) moveZ -= 1;
    if (keys.a || keys.arrowleft) moveX -= 1;
    if (keys.d || keys.arrowright) moveX += 1;

    movement.set(moveX, 0, moveZ);

    if (movement.length() > 1) {
      movement.normalize();
    }

    // Camera-relative movement
    forward.set(
      -Math.sin(targetYaw),
      0,
      -Math.cos(targetYaw)
    );

    right.set(
      Math.cos(targetYaw),
      0,
      -Math.sin(targetYaw)
    );

    const direction = new THREE.Vector3()
      .addScaledVector(forward, movement.z)
      .addScaledVector(right, movement.x);

    const moving = direction.length() > 0.05;

    if (moving) {
      direction.normalize();

      player.position.addScaledVector(
        direction,
        7 * delta
      );

      player.rotation.y = Math.atan2(
        direction.x,
        direction.z
      );

      if (playerActions.Run) {
        setAction("Run");
      } else if (playerActions.Walk) {
        setAction("Walk");
      }
    } else {
      if (playerActions.Idle) {
        setAction("Idle");
      }
    }

    // Jump physics
    velocityY -= 22 * delta;
    player.position.y += velocityY * delta;

    if (player.position.y <= 0) {
      player.position.y = 0;
      velocityY = 0;
      isJumping = false;
    }

    // Keep player inside village
    player.position.x = THREE.MathUtils.clamp(
      player.position.x,
      -90,
      90
    );

    player.position.z = THREE.MathUtils.clamp(
      player.position.z,
      -190,
      190
    );

    // CAMERA FOLLOW
    const horizontalDistance =
      cameraDistance * Math.cos(targetPitch);

    const cameraHeight =
      cameraDistance * Math.sin(targetPitch);

    const cameraX =
      player.position.x +
      Math.sin(targetYaw) * horizontalDistance;

    const cameraZ =
      player.position.z +
      Math.cos(targetYaw) * horizontalDistance;

    const cameraY =
      player.position.y + 1.5 + cameraHeight;

    camera.position.lerp(
      new THREE.Vector3(cameraX, cameraY, cameraZ),
      0.12
    );

    camera.lookAt(
      player.position.x,
      player.position.y + 1.3,
      player.position.z
    );
  }

  renderer.render(scene, camera);
}

animate();

// =====================================
// SCREEN RESIZE
// =====================================

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(
    window.innerWidth,
    window.innerHeight
  );
});
