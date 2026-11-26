
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/loaders/GLTFLoader.js";
import { clone } from "https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/utils/SkeletonUtils.js";

/* =====================================
   MAYUSH.GAMEPLAY
   NAYABASTI 3D OPEN WORLD
===================================== */

// BASIC SETTINGS
document.body.style.margin = "0";
document.body.style.overflow = "hidden";
document.body.style.background = "#87ceeb";

// SCENE
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 90, 320);

// CAMERA
const camera = new THREE.PerspectiveCamera(
  65,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

let targetYaw = 0;
let targetPitch = 0.25;
let cameraDistance = 12;

const MIN_ZOOM = 5;
const MAX_ZOOM = 30;

// RENDERER
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: "high-performance"
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;

renderer.domElement.style.cssText = `
  position:fixed;
  inset:0;
  width:100%;
  height:100%;
  z-index:1;
  touch-action:none;
`;

document.body.appendChild(renderer.domElement);

// LIGHTS
scene.add(
  new THREE.HemisphereLight(0xffffff, 0x536b43, 2)
);

const sun = new THREE.DirectionalLight(0xffffff, 2);
sun.position.set(60, 100, 50);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
scene.add(sun);

// MATERIALS
const mat = {
  grass: new THREE.MeshStandardMaterial({ color: 0x578b42 }),
  road: new THREE.MeshStandardMaterial({ color: 0x454545 }),
  line: new THREE.MeshStandardMaterial({ color: 0xffffff }),
  wall: new THREE.MeshStandardMaterial({ color: 0xe6c69a }),
  roof: new THREE.MeshStandardMaterial({ color: 0x984d32 }),
  wood: new THREE.MeshStandardMaterial({ color: 0x795438 }),
  leaves: new THREE.MeshStandardMaterial({ color: 0x277b35 }),
  glass: new THREE.MeshStandardMaterial({
    color: 0x83c8e8,
    roughness: 0.3
  })
};

// OBJECT HELPER
function addBox(x, y, z, sx, sy, sz, material) {
  const object = new THREE.Mesh(
    new THREE.BoxGeometry(sx, sy, sz),
    material
  );

  object.position.set(x, y, z);
  object.castShadow = true;
  object.receiveShadow = true;

  scene.add(object);
  return object;
}

// GROUND
addBox(0, -0.55, 0, 500, 1, 500, mat.grass);

// MAIN ROAD
addBox(0, -0.01, 0, 12, 0.15, 400, mat.road);

// ROAD MARKINGS
for (let z = -190; z < 200; z += 12) {
  addBox(0, 0.08, z, 0.22, 0.02, 5, mat.line);
}

// SIDE ROADS
addBox(35, 0, -30, 100, 0.15, 8, mat.road);
addBox(-35, 0, 45, 100, 0.15, 8, mat.road);

// HOUSE
function createHouse(x, z, wallColor = 0xe6c69a) {
  const wall = new THREE.MeshStandardMaterial({
    color: wallColor
  });

  addBox(x, 2, z, 12, 4, 10, wall);

  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(8.5, 4, 4),
    mat.roof
  );

  roof.position.set(x, 6, z);
  roof.rotation.y = Math.PI / 4;
  roof.scale.set(1, 0.7, 0.8);
  roof.castShadow = true;
  scene.add(roof);

  addBox(x, 1.1, z + 5.08, 1.6, 2.2, 0.15, mat.wood);

  addBox(x - 3.5, 2.5, z + 5.12, 1.8, 1.3, mat.glass);
  addBox(x + 3.5, 2.5, z + 5.12, 1.8, 1.3, mat.glass);
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
    new THREE.CylinderGeometry(0.35, 0.55, 4, 8),
    mat.wood
  );

  trunk.position.set(x, 2, z);
  trunk.castShadow = true;
  scene.add(trunk);

  const leaves = new THREE.Mesh(
    new THREE.SphereGeometry(3.2, 12, 12),
    mat.leaves
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

// TEA SHOP
addBox(-16, 1.7, -12, 10, 3.4, 8, mat.wall);
addBox(-16, 3.8, -12, 12, 0.5, 10, mat.roof);
addBox(-16, 1, -7.8, 5, 1, 1, mat.wood);

// SCHOOL
createHouse(42, -65, 0xf1d8a8);
addBox(42, 4, -58, 12, 1, 0.4, mat.wood);

// CHAUTARI
const chautari = new THREE.Mesh(
  new THREE.CylinderGeometry(4, 4, 0.7, 16),
  mat.wood
);

chautari.position.set(-25, 0.35, -30);
scene.add(chautari);

// =====================================
// PLAYER
// =====================================

const loader = new GLTFLoader();

let player;
let playerMixer = null;
let playerActions = {};
let currentAction = null;

const mixers = [];

const playerPosition = new THREE.Vector3(0, 0, 5);

// FALLBACK PLAYER
function createFallbackPlayer() {
  const group = new THREE.Group();

  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.5, 1, 4, 8),
    new THREE.MeshStandardMaterial({ color: 0x2255cc })
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

// ANIMATION
function playAnimation(name) {
  const next = playerActions[name];

  if (!next || currentAction === next) return;

  if (currentAction) {
    currentAction.fadeOut(0.2);
  }

  next.reset();
  next.fadeIn(0.2);
  next.play();

  currentAction = next;
}

// LOAD PLAYER MODEL
const CHARACTER_URL =
  "https://threejs.org/examples/models/gltf/Soldier.glb";

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
      playerActions[animation.name] =
        playerMixer.clipAction(animation);
    });

    if (playerActions.Idle) {
      playAnimation("Idle");
    } else if (gltf.animations.length > 0) {
      currentAction = playerMixer.clipAction(gltf.animations[0]);
      currentAction.play();
    }

    console.log("Player model loaded");
  },

  undefined,

  (error) => {
    console.error("Player model failed to load:", error);
  }
);

// =====================================
// VILLAGE PEOPLE / NPC
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
        if (!child.isMesh) return;

        child.castShadow = true;
        child.receiveShadow = true;

        child.material = child.material.clone();

        const colors = [
          0x9b4b32,
          0x315d9b,
          0x34734b,
          0x9b8732
        ];

        child.material.color.set(
          colors[index % colors.length]
        );
      });

      scene.add(npc);

      if (gltf.animations.length > 0) {
        const mixer = new THREE.AnimationMixer(npc);
        mixers.push(mixer);

        const idle =
          gltf.animations.find(a => a.name === "Idle") ||
          gltf.animations[0];

        mixer.clipAction(idle).play();
      }
    });

    console.log("Village people loaded");
  },

  undefined,

  (error) => {
    console.error("NPC models failed:", error);
  }
);

// =====================================
// MOBILE CONTROL UI
// =====================================

const controlStyle = document.createElement("style");

controlStyle.textContent = `
  #mayush-controls {
    position:fixed;
    inset:0;
    z-index:5;
    pointer-events:none;
  }

  #joystick {
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
  }

  #joystick-knob {
    position:absolute;
    width:48px;
    height:48px;
    left:36px;
    top:36px;
    border-radius:50%;
    background:rgba(255,255,255,0.85);
  }

  #jump-button {
    position:absolute;
    right:30px;
    bottom:50px;
    width:85px;
    height:85px;
    border-radius:50%;
    background:rgba(255,170,0,0.85);
    color:white;
    border:2px solid white;
    font-weight:bold;
    pointer-events:auto;
    touch-action:none;
  }
`;

document.head.appendChild(controlStyle);

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

  const max = 38;
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
  e.stopPropagation();

  joystickPointer = e.pointerId;
  joystick.setPointerCapture(e.pointerId);

  updateJoystick(e);
});

joystick.addEventListener("pointermove", (e) => {
  if (joystickPointer !== e.pointerId) return;
  updateJoystick(e);
});

function resetJoystick(e) {
  if (joystickPointer !== e.pointerId) return;

  joystickPointer = null;
  joystickX = 0;
  joystickY = 0;

  knob.style.transform = "translate(0px, 0px)";
}

joystick.addEventListener("pointerup", resetJoystick);
joystick.addEventListener("pointercancel", resetJoystick);

// =====================================
// JUMP
// =====================================

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
// GTA STYLE CAMERA
// =====================================

const activePointers = new Map();

let pinchDistance = 0;
let pinchZoom = cameraDistance;

function getPinchDistance() {
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

  if (activePointers.size === 2) {
    pinchDistance = getPinchDistance();
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
    const currentDistance = getPinchDistance();

    cameraDistance = THREE.MathUtils.clamp(
      pinchZoom + (pinchDistance - currentDistance) * 0.035,
      MIN_ZOOM,
      MAX_ZOOM
    );
  }
});

function stopCamera(e) {
  activePointers.delete(e.pointerId);

  if (activePointers.size < 2) {
    pinchDistance = 0;
  }
}

renderer.domElement.addEventListener("pointerup", stopCamera);
renderer.domElement.addEventListener("pointercancel", stopCamera);

// =====================================
// KEYBOARD
// =====================================

const keys = {};

window.addEventListener("keydown", (e) => {
  keys[e.key.toLowerCase()] = true;
});

window.addEventListener("keyup", (e) => {
  keys[e.key.toLowerCase()] = false;
});

// =====================================
// STORY AND GAME START
// =====================================

let gameStarted = false;

function startGame() {
  if (gameStarted) return;

  gameStarted = true;

  document.getElementById("loading")?.remove();

  console.log("NAYABASTI GAME STARTED!");
}

// Load story safely
import("./story.js")
  .then((story) => {
    if (typeof story.startStory === "function") {
      story.startStory(startGame);
    } else {
      startGame();
    }
  })
  .catch((error) => {
    console.error("Story could not load:", error);
    startGame();
  });

// =====================================
// GAME LOOP
// =====================================

const clock = new THREE.Clock();

const forward = new THREE.Vector3();
const right = new THREE.Vector3();
const movement = new THREE.Vector3();
const direction = new THREE.Vector3();

const cameraTarget = new THREE.Vector3();

function animate() {
  requestAnimationFrame(animate);

  const delta = Math.min(clock.getDelta(), 0.05);

  mixers.forEach((mixer) => mixer.update(delta));

  if (gameStarted && player) {
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

    // CAMERA RELATIVE MOVEMENT
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

    direction.set(0, 0, 0);

    direction.addScaledVector(forward, movement.z);
    direction.addScaledVector(right, movement.x);

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
        playAnimation("Run");
      } else if (playerActions.Walk) {
        playAnimation("Walk");
      }
    } else if (playerActions.Idle) {
      playAnimation("Idle");
    }

    // JUMP PHYSICS
    velocityY -= 22 * delta;
    player.position.y += velocityY * delta;

    if (player.position.y <= 0) {
      player.position.y = 0;
      velocityY = 0;
      isJumping = false;
    }

    // WORLD BOUNDARIES
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
    const horizontal =
      cameraDistance * Math.cos(targetPitch);

    const height =
      cameraDistance * Math.sin(targetPitch);

    const cameraX =
      player.position.x +
      Math.sin(targetYaw) * horizontal;

    const cameraZ =
      player.position.z +
      Math.cos(targetYaw) * horizontal;

    const cameraY =
      player.position.y + 1.5 + height;

    cameraTarget.set(
      cameraX,
      cameraY,
      cameraZ
    );

    camera.position.lerp(cameraTarget, 0.15);

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
// RESIZE
// =====================================

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(
    window.innerWidth,
    window.innerHeight
  );
});

console.log("MAYUSH.GAMEPLAY READY");
