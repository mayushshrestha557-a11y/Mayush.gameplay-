
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js";

/* =========================================
   MAYUSH.GAMEPLAY — NAYABASTI TERAI
   COMPLETE MOBILE THIRD-PERSON GAME
========================================= */

document.documentElement.style.cssText =
  "margin:0;width:100%;height:100%;overflow:hidden;";

document.body.style.cssText =
  "margin:0;width:100%;height:100%;overflow:hidden;background:#a9cde0;touch-action:none;user-select:none;";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xa9cde0);
scene.fog = new THREE.Fog(0xa9cde0, 90, 270);

const camera = new THREE.PerspectiveCamera(
  60,
  innerWidth / innerHeight,
  0.1,
  500
);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: "high-performance"
});

renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;

renderer.domElement.style.cssText =
  "position:fixed;inset:0;width:100%;height:100%;display:block;touch-action:none;";

document.body.appendChild(renderer.domElement);

/* LIGHTING */

scene.add(
  new THREE.HemisphereLight(0xe5f5ff, 0x596b3b, 2)
);

const sun = new THREE.DirectionalLight(0xffe7bd, 2.2);
sun.position.set(-50, 90, 50);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.left = -110;
sun.shadow.camera.right = 110;
sun.shadow.camera.top = 110;
sun.shadow.camera.bottom = -110;
sun.shadow.camera.far = 250;
scene.add(sun);

/* MATERIALS */

function mat(color, roughness = 1, metalness = 0) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness
  });
}

const M = {
  grass: mat(0x668d43),
  grass2: mat(0x77974d),
  field: mat(0x829b48),
  crop: mat(0x9cae4b),
  road: mat(0x50504c),
  dirt: mat(0xa78b60),
  concrete: mat(0xaaa99e),
  brick: mat(0xa95638),
  cream: mat(0xe2d0a9),
  white: mat(0xe9e8dc),
  roof: mat(0x777e80, 0.75, 0.2),
  redRoof: mat(0x984a34),
  wood: mat(0x69452b),
  darkWood: mat(0x39291d),
  glass: mat(0x75adbf, 0.25, 0.1),
  leaves: mat(0x397b35),
  leaves2: mat(0x629744),
  water: mat(0x397f91, 0.25, 0.1),
  blue: mat(0x287f9d),
  green: mat(0x367a39),
  sand: mat(0xc4a878),
  metal: mat(0x60666a, 0.45, 0.45),
  door: mat(0x583923),
  black: mat(0x252525)
};

/* OBJECT HELPERS */

function addBox(
  x, y, z,
  sx, sy, sz,
  material,
  shadow = true
) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(sx, sy, sz),
    material
  );

  mesh.position.set(x, y, z);
  mesh.castShadow = shadow;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}

function addCylinder(
  x, y, z,
  rt, rb, h,
  material,
  segments = 10
) {
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

/* TERRAIN */

addBox(0, -0.55, 0, 500, 1, 500, M.grass, false);

/* MAIN ROAD */

addBox(0, 0, 0, 12, 0.14, 420, M.road, false);
addBox(-6.5, 0.01, 0, 1, 0.12, 420, M.dirt, false);
addBox(6.5, 0.01, 0, 1, 0.12, 420, M.dirt, false);

for (let z = -200; z < 210; z += 14) {
  addBox(0, 0.085, z, 0.15, 0.02, 4, M.white, false);
}

/* VILLAGE ROADS */

addBox(-38, 0, -35, 75, 0.13, 7, M.dirt, false);
addBox(40, 0, 60, 75, 0.13, 7, M.dirt, false);
addBox(-45, 0, 125, 65, 0.13, 6, M.dirt, false);
addBox(38, 0, -125, 70, 0.13, 6, M.dirt, false);

/* FARM FIELDS — OPTIMIZED */

function field(x, z, w, d, material) {
  addBox(x, 0, z, w, 0.12, d, material, false);

  const columns = Math.floor((w - 4) / 4);
  const rows = Math.floor((d - 4) / 5);
  const count = columns * rows;

  const cropGeometry = new THREE.BoxGeometry(
    0.16, 0.65, 0.16
  );

  const crops = new THREE.InstancedMesh(
    cropGeometry,
    M.crop,
    count
  );

  const dummy = new THREE.Object3D();
  let index = 0;

  for (let px = -w / 2 + 2; px < w / 2 - 1; px += 4) {
    for (let pz = -d / 2 + 2; pz < d / 2 - 1; pz += 5) {
      dummy.position.set(x + px, 0.38, z + pz);
      dummy.rotation.z = (Math.random() - 0.5) * 0.15;
      dummy.updateMatrix();
      crops.setMatrixAt(index++, dummy.matrix);
    }
  }

  crops.count = index;
  crops.instanceMatrix.needsUpdate = true;
  crops.castShadow = false;
  crops.receiveShadow = false;
  scene.add(crops);

  addBox(x, 0.1, z - d / 2, w, 0.2, 0.5, M.dirt, false);
  addBox(x, 0.1, z + d / 2, w, 0.2, 0.5, M.dirt, false);
  addBox(x - w / 2, 0.1, z, 0.5, 0.2, d, M.dirt, false);
  addBox(x + w / 2, 0.1, z, 0.5, 0.2, d, M.dirt, false);
}

field(-75, -95, 90, 90, M.grass2);
field(82, -80, 100, 100, M.field);
field(-82, 65, 95, 100, M.field);
field(83, 100, 100, 90, M.grass2);
field(-75, 180, 90, 45, M.field);
field(85, -185, 100, 40, M.grass2);

/* IRRIGATION CANALS */

function canal(x, z, width, length, rotation = 0) {
  const group = new THREE.Group();

  const water = new THREE.Mesh(
    new THREE.BoxGeometry(width, 0.1, length),
    M.water
  );

  water.position.y = 0.04;
  group.add(water);

  for (const side of [-1, 1]) {
    const bank = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.3, length),
      M.dirt
    );

    bank.position.set(side * (width / 2 + 0.25), 0, 0);
    group.add(bank);
  }

  group.position.set(x, 0, z);
  group.rotation.y = rotation;
  scene.add(group);
}

canal(-125, 0, 2.2, 370);
canal(130, 20, 2.2, 350);
canal(0, -165, 2, 250, Math.PI / 2);

/* PONDS */

function pond(x, z, rx, rz) {
  const water = new THREE.Mesh(
    new THREE.CircleGeometry(1, 40),
    M.water
  );

  water.rotation.x = -Math.PI / 2;
  water.scale.set(rx, rz, 1);
  water.position.set(x, 0.035, z);
  scene.add(water);

  const bank = new THREE.Mesh(
    new THREE.RingGeometry(0.94, 1.12, 40),
    M.dirt
  );

  bank.rotation.x = -Math.PI / 2;
  bank.scale.set(rx, rz, 1);
  bank.position.set(x, 0.02, z);
  scene.add(bank);
}

pond(-48, -20, 12, 8);
pond(55, 145, 15, 10);

/* HOUSES */

function house(x, z, options = {}) {
  const w = options.w || 10;
  const d = options.d || 9;
  const h = options.h || 4;
  const wall = options.wall || M.cream;
  const roofMat = options.roof || M.roof;

  const group = new THREE.Group();

  function box(sx, sy, sz, material, px, py, pz) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(sx, sy, sz),
      material
    );

    mesh.position.set(px, py, pz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  }

  box(w, h, d, wall, 0, h / 2 + 0.15, 0);
  box(w + 0.8, 0.3, d + 0.8, roofMat, 0, h + 0.3, 0);
  box(1.25, 2.4, 0.14, M.door, 0, 1.35, d / 2 + 0.08);

  for (const wx of [-w * 0.3, w * 0.3]) {
    box(1.5, 1.1, 0.12, M.glass, wx, 2.5, d / 2 + 0.09);
    box(0.09, 1.2, 0.15, M.white, wx - 0.8, 2.5, d / 2 + 0.16);
    box(0.09, 1.2, 0.15, M.white, wx + 0.8, 2.5, d / 2 + 0.16);
    box(1.7, 0.1, 0.15, M.white, wx, 1.95, d / 2 + 0.16);
    box(1.7, 0.1, 0.15, M.white, wx, 3.05, d / 2 + 0.16);
    box(0.06, 1.05, 0.16, M.wood, wx, 2.5, d / 2 + 0.2);
  }

  box(w + 1.5, 0.2, 2.5, M.roof, 0, 3.2, d / 2 + 1.05);

  for (const px of [-w / 2 + 0.5, w / 2 - 0.5]) {
    box(0.18, 3, 0.18, M.white, px, 1.55, d / 2 + 2);
  }

  box(2.2, 0.18, 0.9, M.concrete, 0, 0.12, d / 2 + 1.15);

  if (options.tank) {
    const tank = new THREE.Mesh(
      new THREE.CylinderGeometry(0.75, 0.75, 1.3, 14),
      M.blue
    );

    tank.position.set(w / 3, h + 1, -d / 4);
    group.add(tank);
  }

  group.position.set(x, 0, z);
  scene.add(group);
}

house(-23, -85, { tank: true });
house(24, -105, { w: 11 });
house(-25, -45, { wall: M.white, roof: M.redRoof });
house(25, -15, { w: 11, tank: true });
house(-26, 35);
house(25, 75, { w: 12 });
house(-25, 105, { wall: M.white, tank: true });
house(25, 145, { roof: M.redRoof });
house(-25, 175);
house(-42, -100, { w: 8, d: 7, h: 3.2, wall: M.brick });
house(43, -65, { w: 8, d: 7, h: 3.2, wall: M.brick });
house(-45, 55, { w: 8, d: 7, h: 3.2, wall: M.brick });
house(45, 110, { w: 8, d: 7, h: 3.2, wall: M.brick });

/* TREES */

function tree(x, z, scale = 1) {
  addCylinder(
    x, 1.1 * scale, z,
    0.23 * scale, 0.18 * scale,
    2.2 * scale, M.wood
  );

  const group = new THREE.Group();
  group.position.set(x, 2.5 * scale, z);

  for (let i = 0; i < 4; i++) {
    const crown = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.9 * scale, 1),
      i % 2 ? M.leaves : M.leaves2
    );

    crown.position.set(
      (Math.random() - 0.5) * 1.5 * scale,
      Math.random() * 1.2 * scale,
      (Math.random() - 0.5) * 1.5 * scale
    );

    crown.castShadow = true;
    group.add(crown);
  }

  scene.add(group);
}

for (let i = 0; i < 65; i++) {
  const x = (Math.random() - 0.5) * 180;
  const z = (Math.random() - 0.5) * 220;

  if (Math.abs(x) > 9) {
    tree(x, z, 0.7 + Math.random() * 0.7);
  }
}

/* BANANA TREES */

function bananaTree(x, z) {
  addCylinder(x, 1.5, z, 0.16, 0.13, 3, M.green);

  for (let i = 0; i < 5; i++) {
    const leaf = new THREE.Mesh(
      new THREE.ConeGeometry(0.35, 3.5, 5),
      M.leaves
    );

    leaf.position.set(x, 3.2, z);
    leaf.rotation.z = Math.PI / 2;
    leaf.rotation.y = i * 1.05;
    leaf.scale.set(0.55, 1, 0.25);
    scene.add(leaf);
  }
}

for (let i = 0; i < 15; i++) {
  bananaTree(
    15 + Math.random() * 45,
    -90 + Math.random() * 180
  );
}

/* ELECTRIC POLES */

function electricPole(x, z) {
  addCylinder(x, 4, z, 0.17, 0.13, 8, M.concrete);
  addBox(x, 7.2, z, 2.8, 0.14, 0.14, M.wood);

  for (let i = -1; i <= 1; i++) {
    addCylinder(
      x + i * 1.1, 7.5, z,
      0.08, 0.08, 0.35, M.metal
    );
  }
}

for (let z = -100; z <= 110; z += 35) {
  electricPole(-7, z);
  electricPole(7, z);
}

function wire(x1, z1, x2, z2) {
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(x1, 7.3, z1),
    new THREE.Vector3((x1 + x2) / 2, 6.8, (z1 + z2) / 2),
    new THREE.Vector3(x2, 7.3, z2)
  ]);

  const mesh = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 16, 0.025, 5, false),
    M.black
  );

  scene.add(mesh);
}

for (let z = -100; z < 110; z += 35) {
  wire(-7, z, -7, z + 35);
  wire(7, z, 7, z + 35);
}

/* TEA SHOP */

function teaShop(x, z) {
  addBox(x, 1.6, z, 8, 3.2, 6, M.brick);
  addBox(x, 3.3, z, 8.6, 0.25, 6.6, M.redRoof);
  addBox(x, 1.8, z - 3.08, 3.2, 1.3, 0.15, M.wood);
  addBox(x, 1.2, z - 3.5, 2.2, 0.15, 1.1, M.wood);
  addBox(x - 2.7, 0.9, z - 3.05, 1.2, 1.8, 0.12, M.door);
  addBox(x, 3.9, z - 3.2, 2.5, 0.45, 0.15, M.white);
}

teaShop(-17, 18);

/* SCHOOL */

function school(x, z) {
  addBox(x, 2.25, z, 18, 4.5, 10, M.white);
  addBox(x, 4.6, z, 18.8, 0.35, 10.8, M.redRoof);

  for (let i = -2; i <= 2; i++) {
    addBox(x + i * 3.2, 2.7, z - 5.1, 2, 1.6, 0.15, M.blue);
  }

  addBox(x, 1.2, z - 5.1, 3, 2.4, 0.15, M.door);
  addBox(x, 5.5, z - 5.5, 8, 1.5, 0.2, M.green);
}

school(35, -30);

/* CHAUTARI */

function chautari(x, z) {
  addCylinder(x, 0.25, z, 1.7, 1.7, 0.45, M.concrete);
  tree(x, z, 1.4);
  addBox(x, 0.8, z + 2, 3.8, 0.25, 0.6, M.wood);
  addBox(x, 0.8, z - 2, 3.8, 0.25, 0.6, M.wood);
}

chautari(-27, -15);

/* HAND PUMPS */

function handPump(x, z) {
  addBox(x, 0.8, z, 0.25, 1.6, 0.25, M.metal);
  addBox(x + 0.5, 1.5, z, 1.3, 0.12, 0.12, M.metal);
  addCylinder(x, 1.7, z, 0.08, 0.08, 0.4, M.metal);
}

handPump(12, 15);
handPump(-35, 35);
handPump(40, 60);

/* YARDS */

function yard(x, z) {
  addBox(x, 0.05, z, 6, 0.08, 5, M.sand, false);
  addBox(x - 3, 0.4, z, 0.12, 0.8, 5, M.wood);
  addBox(x + 3, 0.4, z, 0.12, 0.8, 5, M.wood);
  addBox(x, 0.4, z - 2.5, 6, 0.8, 0.12, M.wood);
}

yard(45, 110);
yard(-40, -65);
yard(25, 45);

/* PLAYER */

const player = new THREE.Group();
scene.add(player);

const skin = mat(0xc58d65);
const shirt = mat(0x2466a6);
const pants = mat(0x292c35);
const eyeMaterial = mat(0x17120e);
const whiteEye = mat(0xffffff);

const body = new THREE.Mesh(
  new THREE.CapsuleGeometry(0.38, 0.85, 5, 8),
  shirt
);

body.position.y = 1.25;
player.add(body);

const head = new THREE.Mesh(
  new THREE.SphereGeometry(0.3, 20, 16),
  skin
);

head.position.y = 2.15;
player.add(head);

const hair = new THREE.Mesh(
  new THREE.SphereGeometry(
    0.31, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2
  ),
  M.black
);

hair.position.y = 2.3;
player.add(hair);

/* FACE — FRONT IS LOCAL +Z */

for (const eyeX of [-0.105, 0.105]) {
  const eyeWhite = new THREE.Mesh(
    new THREE.SphereGeometry(0.055, 10, 10),
    whiteEye
  );

  eyeWhite.position.set(eyeX, 2.2, 0.265);
  player.add(eyeWhite);

  const pupil = new THREE.Mesh(
    new THREE.SphereGeometry(0.027, 8, 8),
    eyeMaterial
  );

  pupil.position.set(eyeX, 2.2, 0.31);
  player.add(pupil);
}

const nose = new THREE.Mesh(
  new THREE.SphereGeometry(0.045, 8, 8),
  skin
);

nose.position.set(0, 2.12, 0.31);
player.add(nose);

/* LIMBS */

function createLimb(x, y, material, width, height, depth) {
  const pivot = new THREE.Group();
  pivot.position.set(x, y, 0);

  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    material
  );

  mesh.position.y = -height / 2;
  pivot.add(mesh);
  player.add(pivot);

  return pivot;
}

const leftLeg = createLimb(-0.17, 0.68, pants, 0.23, 0.65, 0.25);
const rightLeg = createLimb(0.17, 0.68, pants, 0.23, 0.65, 0.25);

const leftArm = createLimb(-0.48, 1.6, shirt, 0.2, 0.75, 0.22);
const rightArm = createLimb(0.48, 1.6, shirt, 0.2, 0.75, 0.22);

/*
  THREE CHARACTER DIRECTION RULE:

  Local +Z = character front.
  Initial heading PI = world -Z.
  Camera stays behind the character.
*/

player.position.set(0, 0, 0);

let playerRotation = Math.PI;
player.rotation.y = playerRotation;

/* VILLAGERS */

const villagers = [];

function createVillager(x, z, color) {
  const npc = new THREE.Group();

  const torso = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.32, 0.75, 4, 8),
    mat(color)
  );

  torso.position.y = 1.2;
  npc.add(torso);

  const face = new THREE.Mesh(
    new THREE.SphereGeometry(0.25, 12, 12),
    skin
  );

  face.position.y = 2;
  npc.add(face);

  const leg = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 0.65, 0.2),
    pants
  );

  leg.position.set(-0.13, 0.35, 0);
  npc.add(leg);

  const leg2 = leg.clone();
  leg2.position.x = 0.13;
  npc.add(leg2);

  npc.position.set(x, 0, z);
  scene.add(npc);

  villagers.push({
    mesh: npc,
    phase: Math.random() * 10
  });
}

createVillager(8, 15, 0xc44c34);
createVillager(-12, 30, 0x367d50);
createVillager(30, -20, 0xd4a23d);
createVillager(-30, -25, 0x7d4aa0);
createVillager(45, 65, 0x3b8295);

/* SHRUBS */

for (let i = 0; i < 65; i++) {
  const shrub = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.5, 1),
    M.leaves
  );

  shrub.position.set(
    (Math.random() - 0.5) * 140,
    0.35,
    (Math.random() - 0.5) * 200
  );

  shrub.scale.set(1.3, 0.8, 1);
  scene.add(shrub);
}

/* MOBILE CONTROLS */

const style = document.createElement("style");

style.textContent = `
#mobile-controls {
  position:fixed;
  inset:0;
  z-index:20;
  pointer-events:none;
  font-family:Arial,sans-serif;
}
#joystick {
  position:absolute;
  left:25px;
  bottom:25px;
  width:125px;
  height:125px;
  border-radius:50%;
  background:#ffffff30;
  border:2px solid #ffffff99;
  pointer-events:auto;
  touch-action:none;
}
#stick {
  position:absolute;
  left:35px;
  top:35px;
  width:52px;
  height:52px;
  border-radius:50%;
  background:#ffffffed;
  box-shadow:0 3px 12px #3338;
  pointer-events:none;
}
#jump {
  position:absolute;
  right:28px;
  bottom:38px;
  width:78px;
  height:78px;
  border-radius:50%;
  border:2px solid white;
  background:#246dcc;
  color:white;
  font-size:15px;
  font-weight:bold;
  pointer-events:auto;
  touch-action:none;
}
#game-label {
  position:absolute;
  top:15px;
  left:15px;
  color:white;
  font:bold 14px Arial;
  text-shadow:0 2px 5px black;
}
`;

document.head.appendChild(style);

const controls = document.createElement("div");
controls.id = "mobile-controls";

controls.innerHTML = `
  <div id="game-label">NAYABASTI • FREE ROAM</div>
  <div id="joystick"><div id="stick"></div></div>
  <button id="jump" type="button">JUMP</button>
`;

document.body.appendChild(controls);

const joystick = document.getElementById("joystick");
const stick = document.getElementById("stick");
const jumpButton = document.getElementById("jump");

let moveX = 0;
let moveY = 0;
let pointerId = null;

let playerHeight = 0;
let jumpVelocity = 0;
let jumping = false;

function updateJoystick(e) {
  const rect = joystick.getBoundingClientRect();

  let dx = e.clientX - (rect.left + rect.width / 2);
  let dy = e.clientY - (rect.top + rect.height / 2);

  const max = 38;
  const distance = Math.hypot(dx, dy);

  if (distance > max) {
    dx = (dx / distance) * max;
    dy = (dy / distance) * max;
  }

  stick.style.transform = `translate(${dx}px, ${dy}px)`;

  moveX = dx / max;
  moveY = dy / max;
}

joystick.addEventListener("pointerdown", e => {
  e.preventDefault();

  pointerId = e.pointerId;
  joystick.setPointerCapture(pointerId);
  updateJoystick(e);
});

joystick.addEventListener("pointermove", e => {
  if (e.pointerId === pointerId) {
    e.preventDefault();
    updateJoystick(e);
  }
});

function releaseJoystick(e) {
  if (e.pointerId !== pointerId) return;

  pointerId = null;
  moveX = 0;
  moveY = 0;
  stick.style.transform = "translate(0,0)";
}

joystick.addEventListener("pointerup", releaseJoystick);
joystick.addEventListener("pointercancel", releaseJoystick);
joystick.addEventListener("lostpointercapture", () => {
  pointerId = null;
  moveX = 0;
  moveY = 0;
  stick.style.transform = "translate(0,0)";
});

/* JUMP */

jumpButton.addEventListener("pointerdown", e => {
  e.preventDefault();

  if (!jumping && playerHeight === 0) {
    jumping = true;
    jumpVelocity = 6.5;
  }
});

/* KEYBOARD */

const keys = {};

window.addEventListener("keydown", e => {
  keys[e.key.toLowerCase()] = true;
});

window.addEventListener("keyup", e => {
  keys[e.key.toLowerCase()] = false;
});

/* CAMERA */

const clock = new THREE.Clock();

let walkTime = 0;

const UP = new THREE.Vector3(0, 1, 0);

function getForward(rotation) {
  return new THREE.Vector3(0, 0, 1)
    .applyAxisAngle(UP, rotation)
    .normalize();
}

function getRight(rotation) {
  return new THREE.Vector3(1, 0, 0)
    .applyAxisAngle(UP, rotation)
    .normalize();
}

const initialForward = getForward(playerRotation);

camera.position.set(
  -initialForward.x * 8.5,
  7,
  -initialForward.z * 8.5
);

camera.lookAt(0, 1.2, 0);

/* REMOVE LOADING */

const loading = document.getElementById("loading");

if (loading) {
  loading.remove();
}

/* GAME LOOP */

function animate() {
  requestAnimationFrame(animate);

  const delta = Math.min(clock.getDelta(), 0.04);
  const elapsed = clock.elapsedTime;

  let horizontal = moveX;
  let vertical = moveY;

  /* KEYBOARD INPUT */

  if (keys["w"] || keys["arrowup"]) vertical = -1;
  if (keys["s"] || keys["arrowdown"]) vertical = 1;
  if (keys["a"] || keys["arrowleft"]) horizontal = -1;
  if (keys["d"] || keys["arrowright"]) horizontal = 1;

  const inputLength = Math.hypot(horizontal, vertical);

  if (inputLength > 0.08) {
    horizontal /= Math.max(1, inputLength);
    vertical /= Math.max(1, inputLength);

    /*
      JOYSTICK DIRECTION:

      moveY < 0 = joystick UP
      moveY > 0 = joystick DOWN

      Character local +Z = forward.
      Therefore forward movement = -vertical.
    */

    const forward = getForward(playerRotation);
    const right = getRight(playerRotation);

    const direction = new THREE.Vector3();

    direction.addScaledVector(right, horizontal);
    direction.addScaledVector(forward, -vertical);

    direction.normalize();

    /* MOVEMENT */

    const speed = 6.5;

    player.position.addScaledVector(
      direction,
      speed * delta
    );

    /* FACE THE MOVEMENT DIRECTION */

    playerRotation = Math.atan2(
      direction.x,
      direction.z
    );

    player.rotation.y = playerRotation;

    /* WALK ANIMATION */

    walkTime += delta * 10;

    leftLeg.rotation.x = Math.sin(walkTime) * 0.55;
    rightLeg.rotation.x = -Math.sin(walkTime) * 0.55;

    leftArm.rotation.x = -Math.sin(walkTime) * 0.4;
    rightArm.rotation.x = Math.sin(walkTime) * 0.4;

  } else {
    leftLeg.rotation.x *= 0.8;
    rightLeg.rotation.x *= 0.8;
    leftArm.rotation.x *= 0.8;
    rightArm.rotation.x *= 0.8;
  }

  /* JUMP PHYSICS */

  if (jumping) {
    playerHeight += jumpVelocity * delta;
    jumpVelocity -= 16 * delta;

    if (playerHeight <= 0) {
      playerHeight = 0;
      jumpVelocity = 0;
      jumping = false;
    }
  }

  player.position.y = playerHeight;

  /* CAMERA FOLLOW — LOWER VIEW, LESS SKY */

  const forward = getForward(playerRotation);

  const desiredCamera = new THREE.Vector3(
    player.position.x - forward.x * 8.5,
    player.position.y + 7,
    player.position.z - forward.z * 8.5
  );

  camera.position.lerp(
    desiredCamera,
    1 - Math.exp(-6 * delta)
  );

  camera.lookAt(
    player.position.x,
    player.position.y + 1.2,
    player.position.z
  );

  /* WORLD BOUNDARY */

  player.position.x = THREE.MathUtils.clamp(
    player.position.x,
    -85,
    85
  );

  player.position.z = THREE.MathUtils.clamp(
    player.position.z,
    -115,
    115
  );

  /* NPC ANIMATION */

  villagers.forEach(v => {
    v.mesh.position.y =
      Math.sin(elapsed * 2 + v.phase) * 0.025;

    v.mesh.rotation.y =
      Math.sin(elapsed * 0.5 + v.phase) * 0.15;
  });

  renderer.render(scene, camera);
}

/* RESIZE */

window.addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
});

/* START GAME */

animate();
