
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js";
import { startStory } from "./story.js";

/* =====================================
   MAYUSH.GAMEPLAY - NAYABASTI TERAI
===================================== */

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9bc9e8);
scene.fog = new THREE.Fog(0x9bc9e8, 150, 430);

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
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

/* LIGHTING */

scene.add(new THREE.HemisphereLight(0xe5f4ff, 0x596b37, 2));

const sun = new THREE.DirectionalLight(0xfff0d5, 2.2);
sun.position.set(-70, 110, 50);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.left = -130;
sun.shadow.camera.right = 130;
sun.shadow.camera.top = 130;
sun.shadow.camera.bottom = -130;
scene.add(sun);

/* MATERIALS */

const mat = {
  grass: new THREE.MeshStandardMaterial({ color: 0x658d3f }),
  grassDark: new THREE.MeshStandardMaterial({ color: 0x426d30 }),
  road: new THREE.MeshStandardMaterial({ color: 0x555653, roughness: 1 }),
  dirt: new THREE.MeshStandardMaterial({ color: 0xa58a60 }),
  concrete: new THREE.MeshStandardMaterial({ color: 0xaaa99d }),
  brick: new THREE.MeshStandardMaterial({ color: 0xa95638 }),
  brickDark: new THREE.MeshStandardMaterial({ color: 0x743c2d }),
  wall: new THREE.MeshStandardMaterial({ color: 0xe2d0a9 }),
  cream: new THREE.MeshStandardMaterial({ color: 0xf0dfbd }),
  white: new THREE.MeshStandardMaterial({ color: 0xe9e8dc }),
  roof: new THREE.MeshStandardMaterial({ color: 0x9b4932 }),
  tin: new THREE.MeshStandardMaterial({
    color: 0x777e80,
    metalness: 0.65,
    roughness: 0.5
  }),
  wood: new THREE.MeshStandardMaterial({ color: 0x69452b }),
  darkWood: new THREE.MeshStandardMaterial({ color: 0x39291d }),
  glass: new THREE.MeshStandardMaterial({
    color: 0x82b9ce,
    roughness: 0.25,
    metalness: 0.15
  }),
  leaves: new THREE.MeshStandardMaterial({ color: 0x367b32 }),
  leavesLight: new THREE.MeshStandardMaterial({ color: 0x609b3d }),
  water: new THREE.MeshStandardMaterial({
    color: 0x397f91,
    roughness: 0.2,
    metalness: 0.25
  }),
  crop: new THREE.MeshStandardMaterial({ color: 0x82a83c }),
  cropLight: new THREE.MeshStandardMaterial({ color: 0xa5b94a }),
  pole: new THREE.MeshStandardMaterial({ color: 0x55534c })
};

/* BASIC HELPERS */

function box(x, y, z, sx, sy, sz, material, cast = true) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(sx, sy, sz),
    material
  );

  mesh.position.set(x, y, z);
  mesh.castShadow = cast;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}

function cylinder(x, y, z, rt, rb, h, material, segments = 10) {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(rt, rb, h, segments),
    material
  );

  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}

/* =====================================
   TERAI LANDSCAPE - FLAT GROUND
===================================== */

box(0, -0.55, 0, 500, 1, 500, mat.grass, false);

/* Main village road */

box(0, -0.01, 0, 12, 0.16, 420, mat.road, false);

/* Road edges */

box(-6.5, 0.02, 0, 1, 0.12, 420, mat.dirt, false);
box(6.5, 0.02, 0, 1, 0.12, 420, mat.dirt, false);

/* Road markings */

for (let z = -200; z < 210; z += 14) {
  box(0, 0.09, z, 0.18, 0.025, 5, mat.white, false);
}

/* Side roads */

box(-38, 0, -35, 75, 0.15, 7, mat.dirt, false);
box(40, 0, 60, 75, 0.15, 7, mat.dirt, false);
box(-45, 0, 125, 65, 0.15, 6, mat.dirt, false);
box(38, 0, -125, 70, 0.15, 6, mat.dirt, false);

/* Small paths */

box(-24, 0.01, 20, 3, 0.12, 95, mat.dirt, false);
box(26, 0.01, -45, 3, 0.12, 90, mat.dirt, false);

/* =====================================
   RICE AND FARM FIELDS
===================================== */

function createField(x, z, width, depth, color = 0x658d3f) {
  const fieldMat = new THREE.MeshStandardMaterial({
    color,
    roughness: 1
  });

  box(x, -0.02, z, width, 0.12, depth, fieldMat, false);

  /* Field boundary banks */

  box(x, 0.12, z - depth / 2, width, 0.25, 0.7, mat.dirt, false);
  box(x, 0.12, z + depth / 2, width, 0.25, 0.7, mat.dirt, false);
  box(x - width / 2, 0.12, z, 0.7, 0.25, depth, mat.dirt, false);
  box(x + width / 2, 0.12, z, 0.7, 0.25, depth, mat.dirt, false);

  /* Crop rows using instanced meshes */

  const count = Math.floor(width / 1.5) * Math.floor(depth / 2.5);
  if (count < 1) return;

  const geometry = new THREE.BoxGeometry(0.12, 0.65, 0.12);
  const crops = new THREE.InstancedMesh(
    geometry,
    mat.crop,
    count
  );

  const dummy = new THREE.Object3D();
  let index = 0;

  for (let px = -width / 2 + 1; px < width / 2 - 1; px += 1.5) {
    for (let pz = -depth / 2 + 1; pz < depth / 2 - 1; pz += 2.5) {
      dummy.position.set(x + px, 0.35, z + pz);
      dummy.rotation.y = Math.random() * 0.2;
      dummy.scale.set(
        0.8 + Math.random() * 0.5,
        0.7 + Math.random() * 0.6,
        1
      );
      dummy.updateMatrix();
      crops.setMatrixAt(index++, dummy.matrix);
    }
  }

  crops.count = index;
  crops.castShadow = true;
  crops.receiveShadow = true;
  scene.add(crops);
}

/* Open agricultural areas */

createField(-75, -95, 90, 90, 0x638b3b);
createField(82, -80, 100, 100, 0x779743);
createField(-82, 65, 95, 100, 0x719143);
createField(83, 100, 100, 90, 0x5d8438);
createField(-75, 180, 90, 45, 0x809d48);
createField(85, -185, 100, 40, 0x799445);

/* =====================================
   IRRIGATION CANALS
===================================== */

function createCanal(x, z, width, length, rotation = 0) {
  const group = new THREE.Group();

  const water = new THREE.Mesh(
    new THREE.BoxGeometry(width, 0.12, length),
    mat.water
  );

  water.position.y = 0.04;
  group.add(water);

  const bank1 = new THREE.Mesh(
    new THREE.BoxGeometry(width + 1.2, 0.3, length),
    mat.dirt
  );
  bank1.position.set(-width / 2 - 0.35, 0, 0);
  group.add(bank1);

  const bank2 = bank1.clone();
  bank2.position.x = width / 2 + 0.35;
  group.add(bank2);

  group.position.set(x, 0, z);
  group.rotation.y = rotation;
  scene.add(group);
}

createCanal(-125, 0, 2.2, 370, 0);
createCanal(130, 20, 2.2, 350, 0);
createCanal(0, -165, 2, 250, Math.PI / 2);

/* =====================================
   VILLAGE POND
===================================== */

function createPond(x, z, rx, rz) {
  const water = new THREE.Mesh(
    new THREE.CircleGeometry(1, 32),
    mat.water
  );

  water.rotation.x = -Math.PI / 2;
  water.scale.set(rx, rz, 1);
  water.position.set(x, 0.04, z);
  scene.add(water);

  const bank = new THREE.Mesh(
    new THREE.RingGeometry(0.92, 1.12, 32),
    mat.dirt
  );

  bank.rotation.x = -Math.PI / 2;
  bank.scale.set(rx, rz, 1);
  bank.position.set(x, 0.02, z);
  scene.add(bank);
}

createPond(-48, -20, 12, 8);
createPond(55, 145, 15, 10);

/* =====================================
   TERAI HOUSES
===================================== */

function createHouse(x, z, options = {}) {
  const width = options.width || 10;
  const depth = options.depth || 9;
  const height = options.height || 4;
  const wallMaterial = options.wall || mat.cream;
  const roofMaterial = options.roof || mat.tin;

  const group = new THREE.Group();

  /* Main building */

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    wallMaterial
  );
  body.position.y = height / 2 + 0.15;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  /* Flat concrete roof */

  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(width + 0.5, 0.35, depth + 0.5),
    roofMaterial
  );
  roof.position.y = height + 0.35;
  roof.castShadow = true;
  group.add(roof);

  /* Roof edge */

  const edge = new THREE.Mesh(
    new THREE.BoxGeometry(width + 0.7, 0.15, 0.2),
    mat.concrete
  );
  edge.position.set(0, height + 0.58, depth / 2);
  group.add(edge);

  /* Front door */

  const door = new THREE.Mesh(
    new THREE.BoxGeometry(1.25, 2.5, 0.12),
    mat.wood
  );
  door.position.set(0, 1.4, depth / 2 + 0.07);
  group.add(door);

  /* Door frame */

  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 2.7, 0.12),
    mat.white
  );
  frame.position.set(0, 1.45, depth / 2 + 0.01);
  frame.scale.z = 0.3;
  group.add(frame);

  /* Windows */

  [-width * 0.3, width * 0.3].forEach((wx) => {
    const windowMesh = new THREE.Mesh(
      new THREE.BoxGeometry(1.65, 1.2, 0.12),
      mat.glass
    );
    windowMesh.position.set(wx, 2.5, depth / 2 + 0.08);
    group.add(windowMesh);

    const windowFrame = new THREE.Mesh(
      new THREE.BoxGeometry(1.9, 1.45, 0.15),
      mat.white
    );
    windowFrame.position.set(wx, 2.5, depth / 2 + 0.03);
    windowFrame.scale.z = 0.3;
    group.add(windowFrame);
  });

  /* Veranda roof */

  const veranda = new THREE.Mesh(
    new THREE.BoxGeometry(width + 2, 0.22, 2.5),
    mat.tin
  );
  veranda.position.set(0, 3.25, depth / 2 + 1.1);
  group.add(veranda);

  /* Veranda support columns */

  [-width / 2 + 0.5, width / 2 - 0.5].forEach((px) => {
    const post = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 3.1, 0.2),
      mat.concrete
    );
    post.position.set(px, 1.65, depth / 2 + 2);
    group.add(post);
  });

  /* Front steps */

  const step = new THREE.Mesh(
    new THREE.BoxGeometry(2.3, 0.2, 1),
    mat.concrete
  );
  step.position.set(0, 0.12, depth / 2 + 1.1);
  group.add(step);

  /* Water tank on some roofs */

  if (options.tank) {
    const tank = new THREE.Mesh(
      new THREE.CylinderGeometry(0.9, 0.9, 1.5, 12),
      mat.pole
    );
    tank.position.set(width / 3, height + 1.2, -depth / 4);
    group.add(tank);
  }

  group.position.set(x, 0, z);
  scene.add(group);

  return group;
}

/* Village house clusters */

createHouse(-23, -85, { wall: mat.cream, tank: true });
createHouse(24, -105, { wall: mat.wall, width: 11 });
createHouse(-25, -45, { wall: mat.white, roof: mat.roof });
createHouse(25, -15, { wall: mat.cream, width: 11, tank: true });
createHouse(-26, 35, { wall: mat.wall, roof: mat.tin });
createHouse(25, 75, { wall: mat.cream, width: 12 });
createHouse(-25, 105, { wall: mat.white, tank: true });
createHouse(25, 145, { wall: mat.wall, roof: mat.roof });
createHouse(-25, 175, { wall: mat.cream });

/* Smaller brick homes */

function createBrickHouse(x, z) {
  createHouse(x, z, {
    width: 8,
    depth: 7,
    height: 3.2,
    wall: mat.brick,
    roof: mat.tin
  });
}

createBrickHouse(-42, -100);
createBrickHouse(43, -65);
createBrickHouse(-45, 55);
createBrickHouse(45, 110);

/* =====================================
   TREES - TERAI VEGETATION
===================================== */

function createTree(x, z, type = "broad") {
  const group = new THREE.Group();

  const trunkHeight = type === "palm" ? 7 : 3.5;

  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3, 0.5, trunkHeight, 8),
    mat.wood
  );
  trunk.position.y = trunkHeight / 2;
  trunk.castShadow = true;
  group.add(trunk);

  if (type === "palm") {
    for (let i = 0; i < 7; i++) {
      const leaf = new THREE.Mesh(
        new THREE.ConeGeometry(0.45, 5, 5),
        mat.leaves
      );
      leaf.position.y = trunkHeight + 0.6;
      leaf.rotation.z = Math.PI / 2.5;
      leaf.rotation.y = i * Math.PI * 2 / 7;
      leaf.scale.set(0.7, 1, 0.25);
      group.add(leaf);
    }
  } else {
    const crown = new THREE.Mesh(
      new THREE.SphereGeometry(type === "mango" ? 3.8 : 2.8, 12, 10),
      mat.leaves
    );
    crown.position.y = trunkHeight + 1.2;
    crown.scale.set(1.2, 0.8, 1);
    crown.castShadow = true;
    group.add(crown);

    const crown2 = new THREE.Mesh(
      new THREE.SphereGeometry(2, 10, 8),
      mat.leavesLight
    );
    crown2.position.set(1.3, trunkHeight + 1.5, 0.4);
    group.add(crown2);
  }

  group.position.set(x, 0, z);
  scene.add(group);
}

/* Roadside and field trees */

[
  [-12, -90, "mango"], [12, -50, "broad"],
  [-13, 10, "mango"], [13, 55, "broad"],
  [-13, 115, "mango"], [13, 165, "broad"],
  [-48, -10, "mango"], [48, 25, "broad"],
  [-55, 85, "palm"], [55, 180, "palm"],
  [-100, -140, "broad"], [100, -135, "mango"],
  [-105, 80, "palm"], [105, 80, "broad"],
  [-95, 190, "mango"], [95, 190, "palm"]
].forEach(([x, z, type]) => createTree(x, z, type));

/* Extra scattered trees */

for (let i = 0; i < 28; i++) {
  const x = (Math.random() - 0.5) * 230;
  const z = (Math.random() - 0.5) * 360;

  if (Math.abs(x) > 48 && Math.abs(x) < 118) {
    createTree(x, z, Math.random() > 0.65 ? "palm" : "broad");
  }
}

/* =====================================
   ELECTRICITY POLES AND WIRES
===================================== */

function createElectricPole(x, z) {
  cylinder(x, 5, z, 0.13, 0.18, 10, mat.pole, 8);

  box(x, 9.6, z, 3, 0.16, 0.16, mat.wood);
  box(x, 9.2, z, 0.18, 0.7, 0.18, mat.pole);

  [-1, 0, 1].forEach((offset) => {
    cylinder(x + offset, 10, z, 0.07, 0.07, 0.35, mat.pole, 6);
  });
}

for (let z = -180; z <= 180; z += 45) {
  createElectricPole(-9, z);
  createElectricPole(9, z);
}

/* Wires */

function createWire(x1, z1, x2, z2) {
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(x1, 10, z1),
    new THREE.Vector3((x1 + x2) / 2, 9.2, (z1 + z2) / 2),
    new THREE.Vector3(x2, 10, z2)
  ]);

  const wire = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 12, 0.035, 5, false),
    mat.pole
  );
  scene.add(wire);
}

for (let z = -180; z < 180; z += 45) {
  createWire(-9, z, -9, z + 45);
  createWire(9, z, 9, z + 45);
}

/* =====================================
   TEA SHOP
===================================== */

function createTeaShop() {
  const x = -16;
  const z = -12;

  box(x, 1.7, z, 10, 3.4, 8, mat.brick);
  box(x, 3.55, z, 12, 0.35, 10, mat.tin);

  /* Open serving counter */

  box(x, 1.2, z + 4.1, 7, 1.1, 0.6, mat.wood);

  /* Shop front awning */

  box(x, 3.1, z + 5, 10, 0.2, 2.5, mat.roof);

  /* Tables */

  box(x - 3, 0.8, z + 7, 1.5, 0.15, 1.5, mat.wood);
  box(x + 2.5, 0.8, z + 7, 1.5, 0.15, 1.5, mat.wood);

  /* Benches */

  box(x - 3, 0.45, z + 8.1, 2.5, 0.25, 0.5, mat.wood);
  box(x + 2.5, 0.45, z + 8.1, 2.5, 0.25, 0.5, mat.wood);
}

createTeaShop();

/* =====================================
   SCHOOL
===================================== */

createHouse(42, -65, {
  width: 16,
  depth: 11,
  height: 4,
  wall: mat.cream,
  roof: mat.roof
});

/* School signboard */

box(42, 4.2, -58.8, 12, 1.1, 0.35, mat.wood);

/* School yard */

box(42, 0.02, -48, 30, 0.12, 17, mat.dirt, false);

/* Playground poles */

box(34, 2, -43, 0.2, 4, 0.2, mat.brickDark);
box(50, 2, -43, 0.2, 4, 0.2, mat.brickDark);
box(42, 3.8, -43, 16, 0.2, 0.2, mat.brickDark);

/* =====================================
   CHAUTARI
===================================== */

const chautari = new THREE.Mesh(
  new THREE.CylinderGeometry(4, 4.3, 0.65, 20),
  mat.concrete
);
chautari.position.set(-25, 0.33, -30);
scene.add(chautari);

createTree(-25, -30, "broad");

/* =====================================
   PLAYER CHARACTER
===================================== */

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

/* =====================================
   NPC VILLAGERS
===================================== */

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

/* =====================================
   MOBILE CONTROLS
===================================== */

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

/* =====================================
   CAMERA
===================================== */

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
    pinchStart = Math.hypot(
      p[0].x - p[1].x,
      p[0].y - p[1].y
    );
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
    const current = Math.hypot(
      p[0].x - p[1].x,
      p[0].y - p[1].y
    );

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

/* =====================================
   KEYBOARD
===================================== */

const keys = {};

window.addEventListener("keydown", (e) => {
  keys[e.key.toLowerCase()] = true;
});

window.addEventListener("keyup", (e) => {
  keys[e.key.toLowerCase()] = false;
});

/* =====================================
   STORY
===================================== */

let gameStarted = false;

function startGame() {
  gameStarted = true;
  document.getElementById("loading")?.remove();
}

startStory(startGame);

/* INITIAL CAMERA */

camera.position.set(0, 6, 17);
camera.lookAt(0, 1, 5);

/* =====================================
   GAME LOOP
===================================== */

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

    player.position.x = THREE.MathUtils.clamp(
      player.position.x, -90, 90
    );
    player.position.z = THREE.MathUtils.clamp(
      player.position.z, -190, 190
    );

    const horizontal = cameraDistance * Math.cos(targetPitch);
    const height = cameraDistance * Math.sin(targetPitch);

    cameraTarget.set(
      player.position.x + Math.sin(targetYaw) * horizontal,
      player.position.y + 1.5 + height,
      player.position.z + Math.cos(targetYaw) * horizontal
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

/* RESIZE */

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

document.getElementById("loading")?.remove();
console.log("MAYUSH.GAMEPLAY - NAYABASTI TERAI is running");
