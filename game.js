
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js";

/* =========================================
   MAYUSH.GAMEPLAY — NAYABASTI TERAI
   UPGRADE 3 — LIVING VILLAGE
   IPHONE CAMERA + JOYSTICK + JUMP
========================================= */

document.documentElement.style.cssText =
  "margin:0;width:100%;height:100%;overflow:hidden;";

document.body.style.cssText =
  "margin:0;width:100%;height:100%;overflow:hidden;background:#c4d8d1;touch-action:none;user-select:none;";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xc4d8d1);
scene.fog = new THREE.Fog(0xc4d8d1, 125, 390);

const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 500);

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

const hemiLight = new THREE.HemisphereLight(0xeaf5ff, 0x53633a, 1.8);
scene.add(hemiLight);

const sun = new THREE.DirectionalLight(0xffedcf, 2.7);
sun.position.set(-50, 90, 50);
sun.castShadow = true;
sun.shadow.mapSize.set(1536, 1536);
sun.shadow.camera.left = -110;
sun.shadow.camera.right = 110;
sun.shadow.camera.top = 110;
sun.shadow.camera.bottom = -110;
sun.shadow.camera.far = 250;
scene.add(sun);

/* MATERIALS */

function mat(color, roughness = 1, metalness = 0) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}

const M = {
  grass: mat(0x668d43),
  grass2: mat(0x77974d),
  grassTuft: mat(0x91a85b),
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

function addBox(x, y, z, sx, sy, sz, material, shadow = true) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = shadow;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}

function addCylinder(x, y, z, rt, rb, h, material, segments = 10) {
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

/* FARM FIELDS */

function field(x, z, w, d, material) {
  addBox(x, 0, z, w, 0.12, d, material, false);

  const cropPositions = [];

  for (let px = -w / 2 + 2; px < w / 2 - 1; px += 4) {
    for (let pz = -d / 2 + 2; pz < d / 2 - 1; pz += 5) {
      cropPositions.push([x + px, z + pz]);
    }
  }

  const crops = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.16, 0.65, 0.16),
    M.crop,
    cropPositions.length
  );

  const dummy = new THREE.Object3D();

  cropPositions.forEach((position, index) => {
    dummy.position.set(position[0], 0.38, position[1]);
    dummy.rotation.z = (Math.random() - 0.5) * 0.15;
    dummy.updateMatrix();
    crops.setMatrixAt(index, dummy.matrix);
  });

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

  const roofPanelGeometry = new THREE.BoxGeometry(w / 2 + 0.9, 0.22, d + 1.0);

  const leftRoof = new THREE.Mesh(roofPanelGeometry, roofMat);
  leftRoof.position.set(-w / 4, h + 0.72, 0);
  leftRoof.rotation.z = 0.30;
  leftRoof.castShadow = true;
  leftRoof.receiveShadow = true;
  group.add(leftRoof);

  const rightRoof = new THREE.Mesh(roofPanelGeometry, roofMat);
  rightRoof.position.set(w / 4, h + 0.72, 0);
  rightRoof.rotation.z = -0.30;
  rightRoof.castShadow = true;
  rightRoof.receiveShadow = true;
  group.add(rightRoof);

  const ridge = new THREE.Mesh(
    new THREE.BoxGeometry(0.22, 0.22, d + 1.15),
    M.darkWood
  );
  ridge.position.set(0, h + 1.12, 0);
  ridge.castShadow = true;
  group.add(ridge);

  for (const sideZ of [-1, 1]) {
    const fascia = new THREE.Mesh(
      new THREE.BoxGeometry(w + 1.1, 0.18, 0.16),
      M.darkWood
    );
    fascia.position.set(0, h + 0.42, sideZ * (d / 2 + 0.48));
    group.add(fascia);
  }

  box(1.25, 2.4, 0.14, M.door, 0, 1.35, d / 2 + 0.08);

  for (const wx of [-w * 0.3, w * 0.3]) {
    box(1.5, 1.1, 0.12, M.glass, wx, 2.5, d / 2 + 0.09);
    box(0.09, 1.2, 0.15, M.white, wx - 0.8, 2.5, d / 2 + 0.16);
    box(0.09, 1.2, 0.15, M.white, wx + 0.8, 2.5, d / 2 + 0.16);
    box(1.7, 0.1, 0.15, M.white, wx, 1.95, d / 2 + 0.16);
    box(1.7, 0.1, 0.15, M.white, wx, 3.05, d / 2 + 0.16);
    box(0.06, 1.05, 0.16, M.wood, wx, 2.5, d / 2 + 0.2);
  }

  box(w + 1.5, 0.2, 2.5, roofMat, 0, 3.2, d / 2 + 1.05);

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
  addCylinder(x, 1.1 * scale, z, 0.23 * scale, 0.18 * scale, 2.2 * scale, M.wood);

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
  if (Math.abs(x) > 9) tree(x, z, 0.7 + Math.random() * 0.7);
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
  bananaTree(15 + Math.random() * 45, -90 + Math.random() * 180);
}

/* ELECTRIC POLES */

function electricPole(x, z) {
  addCylinder(x, 4, z, 0.17, 0.13, 8, M.concrete);
  addBox(x, 7.2, z, 2.8, 0.14, 0.14, M.wood);

  for (let i = -1; i <= 1; i++) {
    addCylinder(x + i * 1.1, 7.5, z, 0.08, 0.08, 0.35, M.metal);
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

  scene.add(new THREE.Mesh(
    new THREE.TubeGeometry(curve, 16, 0.025, 5, false),
    M.black
  ));
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

/* REALISTIC TERAI VILLAGE DETAILS */

// Drainage channels.
for (const side of [-1, 1]) {
  addBox(side * 8.0, -0.02, 0, 0.32, 0.38, 420, M.dirt, false);
  addBox(side * 8.0, 0.18, 0, 0.18, 0.08, 420, M.concrete, false);
}

// Dusty tyre tracks.
for (const side of [-1, 1]) {
  for (let z = -195; z < 205; z += 8) {
    addBox(side * 4.0, 0.078, z, 0.16, 0.018, 3.2, M.sand, false);
    addBox(side * 4.75, 0.078, z + 1.5, 0.10, 0.018, 2.4, M.dirt, false);
  }
}

// Culvert crossings.
for (const z of [-35, 60, 125, -125]) {
  addBox(0, 0.19, z, 18, 0.24, 5.5, M.concrete, false);
  for (const side of [-1, 1]) {
    addBox(side * 7.0, 0.02, z, 0.5, 0.28, 5.5, M.dirt, false);
  }
}

// Paddy-field bunds.
for (const [x, z, w, d] of [
  [-75, -95, 90, 90],
  [82, -80, 100, 100],
  [-82, 65, 95, 100],
  [83, 100, 100, 90]
]) {
  for (let k = -1; k <= 1; k++) {
    addBox(x + k * w / 3, 0.16, z, 0.34, 0.30, d, M.sand, false);
  }
  addBox(x, 0.16, z - d / 3, w, 0.30, 0.34, M.sand, false);
  addBox(x, 0.16, z + d / 3, w, 0.30, 0.34, M.sand, false);
}

// Grass tufts.
const tuftGeometry = new THREE.ConeGeometry(0.11, 0.48, 4);
const tuftPositions = [];

for (let i = 0; i < 420; i++) {
  const x = (Math.random() - 0.5) * 190;
  const z = (Math.random() - 0.5) * 230;
  if (Math.abs(x) > 10) tuftPositions.push([x, z]);
}

const tuftMesh = new THREE.InstancedMesh(
  tuftGeometry, M.grassTuft, tuftPositions.length
);
const tuftDummy = new THREE.Object3D();

tuftPositions.forEach((p, i) => {
  tuftDummy.position.set(p[0], 0.22, p[1]);
  tuftDummy.rotation.y = Math.random() * Math.PI;
  tuftDummy.scale.set(
    0.7 + Math.random() * 0.8,
    0.6 + Math.random() * 0.9,
    0.7 + Math.random() * 0.8
  );
  tuftDummy.updateMatrix();
  tuftMesh.setMatrixAt(i, tuftDummy.matrix);
});

tuftMesh.instanceMatrix.needsUpdate = true;
tuftMesh.castShadow = false;
tuftMesh.receiveShadow = false;
scene.add(tuftMesh);

/* HAYSTACKS */

function haystack(x, z, scale = 1) {
  const hay = new THREE.Mesh(
    new THREE.ConeGeometry(1.15 * scale, 1.8 * scale, 9),
    mat(0xb99a55)
  );
  hay.position.set(x, 0.9 * scale, z);
  hay.castShadow = true;
  scene.add(hay);

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(1.05 * scale, 1.15 * scale, 0.35 * scale, 10),
    mat(0x92743d)
  );
  base.position.set(x, 0.18 * scale, z);
  scene.add(base);
}

haystack(-34, -78, 0.9);
haystack(37, 82, 0.8);
haystack(-38, 115, 0.75);

/* CLAY POTS */

function clayPot(x, z) {
  const pot = new THREE.Mesh(
    new THREE.SphereGeometry(0.34, 12, 10),
    mat(0x9b5738)
  );
  pot.position.set(x, 0.34, z);
  pot.scale.set(1, 1.1, 1);
  pot.castShadow = true;
  scene.add(pot);

  const mouth = new THREE.Mesh(
    new THREE.TorusGeometry(0.13, 0.055, 6, 12),
    mat(0x75402d)
  );
  mouth.position.set(x, 0.69, z);
  mouth.rotation.x = Math.PI / 2;
  scene.add(mouth);
}

clayPot(-17, -79);
clayPot(30, -99);
clayPot(-18, 41);
clayPot(31, 71);

/* DISTANT FLAT TERAI TREE LINE */

for (let i = 0; i < 54; i++) {
  const side = i % 2 === 0 ? -1 : 1;
  const x = side * (155 + Math.random() * 55);
  const z = -230 + Math.random() * 460;

  const crown = new THREE.Mesh(
    new THREE.IcosahedronGeometry(3.2 + Math.random() * 2.2, 1),
    i % 3 === 0 ? M.leaves2 : M.leaves
  );
  crown.position.set(x, 3.5 + Math.random() * 2, z);
  crown.scale.set(1.5, 0.85, 1.1);
  crown.castShadow = true;
  scene.add(crown);

  addCylinder(x, 1.7, z, 0.45, 0.35, 3.4, M.wood, 8);
}

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
  new THREE.SphereGeometry(0.31, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2),
  M.black
);
hair.position.y = 2.3;
player.add(hair);

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

/* PLAYER LIMBS */

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

  villagers.push({ mesh: npc, phase: Math.random() * 10 });
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

/* =========================================
   UPGRADE 3 — LIVING VILLAGE
   ANIMALS + TRAFFIC + DAY/NIGHT
========================================= */

const livingAnimals = [];
const trafficVehicles = [];
const daySky = new THREE.Color(0xc4d8d1);
const nightSky = new THREE.Color(0x101d35);
const duskSky = new THREE.Color(0xd58c62);
const worldSky = new THREE.Color();

/* ANIMALS */

function makeAnimal(x, z, type, color) {
  const group = new THREE.Group();
  const bodyMaterial = mat(color);
  const legMaterial = mat(0x40352a);
  const legs = [];

  const body = new THREE.Mesh(
    new THREE.SphereGeometry(
      type === "cow" ? 0.72 : type === "buffalo" ? 0.78 : 0.43,
      16, 12
    ),
    bodyMaterial
  );
  body.scale.set(type === "cow" ? 1.35 : 1.15, 0.9, 0.85);
  body.position.y = type === "chicken" ? 0.48 : 0.95;
  group.add(body);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(type === "chicken" ? 0.22 : 0.34, 12, 10),
    bodyMaterial
  );
  head.position.set(0, type === "chicken" ? 0.72 : 1.18, 0.72);
  group.add(head);

  if (type === "cow" || type === "buffalo") {
    const muzzle = new THREE.Mesh(
      new THREE.SphereGeometry(0.19, 10, 8),
      mat(type === "cow" ? 0xd39a8d : 0x393735)
    );
    muzzle.position.set(0, 1.08, 1.0);
    group.add(muzzle);

    for (const side of [-1, 1]) {
      const horn = new THREE.Mesh(
        new THREE.ConeGeometry(0.09, 0.42, 7),
        mat(0xe1d7bb)
      );
      horn.position.set(side * 0.25, 1.55, 0.65);
      horn.rotation.z = side * -0.55;
      group.add(horn);
    }
  } else if (type === "goat") {
    for (const side of [-1, 1]) {
      const horn = new THREE.Mesh(
        new THREE.ConeGeometry(0.07, 0.36, 7),
        mat(0x554536)
      );
      horn.position.set(side * 0.19, 1.53, 0.68);
      horn.rotation.z = side * -0.35;
      group.add(horn);
    }

    const beard = new THREE.Mesh(
      new THREE.ConeGeometry(0.09, 0.28, 7),
      legMaterial
    );
    beard.position.set(0, 0.88, 0.91);
    group.add(beard);
  } else {
    const beak = new THREE.Mesh(
      new THREE.ConeGeometry(0.11, 0.25, 6),
      mat(0xe5a52b)
    );
    beak.rotation.x = Math.PI / 2;
    beak.position.set(0, 0.68, 0.96);
    group.add(beak);

    const comb = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 8, 8),
      mat(0xb62f25)
    );
    comb.position.set(0, 0.94, 0.68);
    group.add(comb);
  }

  const legCount = type === "chicken" ? 2 : 4;

  for (let i = 0; i < legCount; i++) {
    const px = legCount === 2
      ? (i === 0 ? -0.16 : 0.16)
      : (i % 2 ? 0.42 : -0.42);

    const pz = legCount === 2 ? 0 : (i < 2 ? 0.42 : -0.42);

    const leg = new THREE.Mesh(
      new THREE.CylinderGeometry(
        0.07, 0.055,
        type === "chicken" ? 0.38 : 0.62,
        7
      ),
      legMaterial
    );

    leg.position.set(px, type === "chicken" ? 0.2 : 0.42, pz);
    group.add(leg);
    legs.push(leg);
  }

  if (type === "cow") {
    for (let i = 0; i < 3; i++) {
      const patch = new THREE.Mesh(
        new THREE.SphereGeometry(0.22, 8, 7),
        mat(0x332b26)
      );
      patch.scale.set(0.2, 0.55, 0.8);
      patch.position.set(
        i === 1 ? 0.45 : -0.45,
        1.05,
        i * 0.28 - 0.2
      );
      group.add(patch);
    }
  }

  group.position.set(x, 0, z);
  scene.add(group);

  livingAnimals.push({
    mesh: group,
    legs,
    homeX: x,
    homeZ: z,
    phase: Math.random() * Math.PI * 2,
    pace: 0.25 + Math.random() * 0.35,
    radius: type === "chicken" ? 2.2 : 3.5,
    type
  });
}

makeAnimal(-36, -68, "cow", 0xe9e1d2);
makeAnimal(-40, -70, "cow", 0x9b8a75);
makeAnimal(42, 88, "buffalo", 0x343331);
makeAnimal(39, 91, "goat", 0xc7b69b);
makeAnimal(46, 90, "goat", 0xeee0c7);
makeAnimal(-30, 112, "chicken", 0xc88a3b);
makeAnimal(-33, 114, "chicken", 0xe9e0c8);
makeAnimal(-27, 115, "chicken", 0x9b4935);
makeAnimal(32, 68, "chicken", 0xe2c35e);

/* VEHICLE WHEELS */

function makeWheel(parent, x, y, z, radius = 0.42) {
  const wheel = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, 0.22, 16),
    mat(0x202020)
  );
  wheel.rotation.z = Math.PI / 2;
  wheel.position.set(x, y, z);
  wheel.castShadow = true;
  parent.add(wheel);

  const hub = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.35, radius * 0.35, 0.24, 12),
    M.metal
  );
  hub.rotation.z = Math.PI / 2;
  hub.position.copy(wheel.position);
  parent.add(hub);

  return wheel;
}

/* TRACTOR */

function makeTractor(x, z, direction = 1) {
  const group = new THREE.Group();
  const greenPaint = mat(0x28733b, 0.65);
  const wheels = [];

  const chassis = new THREE.Mesh(
    new THREE.BoxGeometry(1.25, 0.38, 2.5),
    M.darkWood
  );
  chassis.position.y = 0.8;
  group.add(chassis);

  const hood = new THREE.Mesh(
    new THREE.BoxGeometry(1.15, 0.72, 1.0),
    greenPaint
  );
  hood.position.set(0, 1.25, 0.62);
  hood.castShadow = true;
  group.add(hood);

  const seat = new THREE.Mesh(
    new THREE.BoxGeometry(0.55, 0.18, 0.5),
    M.darkWood
  );
  seat.position.set(0, 1.38, -0.55);
  group.add(seat);

  const exhaust = new THREE.Mesh(
    new THREE.CylinderGeometry(0.055, 0.07, 0.85, 8),
    M.metal
  );
  exhaust.position.set(-0.34, 1.95, 0.75);
  group.add(exhaust);

  for (const side of [-1, 1]) {
    wheels.push(makeWheel(group, side * 0.72, 0.55, -0.75, 0.57));
    wheels.push(makeWheel(group, side * 0.72, 0.42, 0.92, 0.39));

    const lamp = new THREE.Mesh(
      new THREE.SphereGeometry(0.13, 8, 8),
      mat(0xffe7a1, 0.3)
    );
    lamp.position.set(side * 0.38, 1.42, 1.14);
    group.add(lamp);
  }

  const trailer = new THREE.Group();

  const trailerBed = new THREE.Mesh(
    new THREE.BoxGeometry(1.8, 0.28, 2.5),
    mat(0x9b4935)
  );
  trailerBed.position.y = 0.95;
  trailer.add(trailerBed);

  for (const side of [-1, 1]) {
    const rail = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.85, 2.5),
      mat(0x9b4935)
    );
    rail.position.set(side * 0.84, 1.45, 0);
    trailer.add(rail);

    wheels.push(makeWheel(trailer, side * 0.98, 0.45, 0, 0.36));
  }

  trailer.position.z = -2.35;
  group.add(trailer);

  group.position.set(x, 0, z);
  group.rotation.y = direction > 0 ? 0 : Math.PI;
  scene.add(group);

  trafficVehicles.push({
    mesh: group,
    wheels,
    speed: direction * 3.2
  });
}

/* MOTORCYCLE */

function makeMotorcycle(x, z, direction = -1) {
  const group = new THREE.Group();
  const wheels = [];

  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(0.25, 0.28, 1.25),
    M.metal
  );
  frame.position.y = 0.78;
  group.add(frame);

  const tank = new THREE.Mesh(
    new THREE.SphereGeometry(0.38, 12, 10),
    mat(0xc72e27, 0.55)
  );
  tank.scale.set(0.8, 0.65, 1.1);
  tank.position.set(0, 1.15, 0.15);
  group.add(tank);

  const seat = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 0.14, 0.7),
    M.black
  );
  seat.position.set(0, 1.12, -0.48);
  group.add(seat);

  wheels.push(makeWheel(group, 0, 0.43, 0.82, 0.4));
  wheels.push(makeWheel(group, 0, 0.43, -0.82, 0.4));

  const handle = new THREE.Mesh(
    new THREE.BoxGeometry(1.0, 0.08, 0.08),
    M.metal
  );
  handle.position.set(0, 1.42, 0.72);
  group.add(handle);

  const lamp = new THREE.Mesh(
    new THREE.SphereGeometry(0.17, 10, 8),
    mat(0xffefbd, 0.25)
  );
  lamp.position.set(0, 1.18, 0.82);
  group.add(lamp);

  group.position.set(x, 0, z);
  group.rotation.y = direction > 0 ? 0 : Math.PI;
  scene.add(group);

  trafficVehicles.push({
    mesh: group,
    wheels,
    speed: direction * 7
  });
}

makeTractor(-2.5, -155, 1);
makeMotorcycle(2.5, 145, -1);
makeMotorcycle(-2.5, -65, 1);

/* FLYING BIRDS */

const flyingBirds = [];

for (let i = 0; i < 9; i++) {
  const bird = new THREE.Group();
  const wingMaterial = mat(0x343b3a);

  for (const side of [-1, 1]) {
    const wing = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 0.06, 0.28),
      wingMaterial
    );
    wing.position.x = side * 0.42;
    wing.rotation.z = side * -0.18;
    bird.add(wing);
  }

  bird.position.set(
    (Math.random() - 0.5) * 80,
    12 + Math.random() * 9,
    (Math.random() - 0.5) * 100
  );

  scene.add(bird);
  flyingBirds.push({
    mesh: bird,
    phase: Math.random() * 10,
    speed: 1.5 + Math.random() * 1.2
  });
}

/* DAY / NIGHT CYCLE */

let worldTime = 0.32;
const dayDuration = 240;

const clockReadout = document.createElement("div");
clockReadout.style.cssText =
  "position:fixed;top:15px;right:16px;z-index:21;color:white;font:bold 13px Arial;text-shadow:0 2px 5px #000;background:#0005;padding:7px 10px;border-radius:12px;pointer-events:none;";
document.body.appendChild(clockReadout);

function updateWorldLighting(delta) {
  worldTime = (worldTime + delta / dayDuration) % 1;

  const hour = worldTime * 24;
  const sunAngle = (worldTime * Math.PI * 2) - Math.PI / 2;

  const daylight = THREE.MathUtils.clamp(
    Math.sin(sunAngle) * 1.35 + 0.15,
    0.08,
    1
  );

  const isDusk = hour > 17 || hour < 7;
  const skyTarget = isDusk ? duskSky : daySky;

  worldSky.copy(nightSky).lerp(skyTarget, daylight);
  scene.background.copy(worldSky);
  scene.fog.color.copy(worldSky);

  sun.position.set(
    Math.cos(sunAngle) * 85,
    Math.max(8, Math.sin(sunAngle) * 100),
    45
  );

  sun.intensity = 0.18 + daylight * 2.55;
  hemiLight.intensity = 0.35 + daylight * 1.45;

  const h = Math.floor(hour);
  const m = Math.floor((hour - h) * 60);
  const label = h < 5 ? "रात" : h < 11 ? "बिहान" : h < 16 ? "दिउँसो" : h < 19 ? "साँझ" : "रात";

  clockReadout.textContent =
    label + " • " +
    String(h).padStart(2, "0") + ":" +
    String(m).padStart(2, "0");
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
  <div id="game-label">NAYABASTI • DRAG SCREEN TO LOOK</div>
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

/* IPHONE CAMERA TOUCH CONTROL */

const clock = new THREE.Clock();
let walkTime = 0;

let cameraYaw = 0;
let cameraPitch = 0.68;
const cameraDistance = 9.5;

let lookTouchId = null;
let lastTouchX = 0;
let lastTouchY = 0;

const UP = new THREE.Vector3(0, 1, 0);

function getCameraForward() {
  return new THREE.Vector3(
    -Math.sin(cameraYaw),
    0,
    -Math.cos(cameraYaw)
  ).normalize();
}

function getCameraRight() {
  return new THREE.Vector3(
    Math.cos(cameraYaw),
    0,
    -Math.sin(cameraYaw)
  ).normalize();
}

/* INITIAL CAMERA */

camera.position.set(0, 6, cameraDistance);
camera.lookAt(0, 1.2, 0);

/* NATIVE IPHONE TOUCH CAMERA */

window.addEventListener("touchstart", e => {
  if (lookTouchId !== null) return;

  const touch = Array.from(e.changedTouches).find(t => {
    const element = document.elementFromPoint(t.clientX, t.clientY);
    if (!element) return false;
    return !element.closest("#joystick, #jump");
  });

  if (!touch) return;

  lookTouchId = touch.identifier;
  lastTouchX = touch.clientX;
  lastTouchY = touch.clientY;
}, { capture: true, passive: false });

window.addEventListener("touchmove", e => {
  if (lookTouchId === null) return;

  const touch = Array.from(e.touches).find(
    t => t.identifier === lookTouchId
  );
  if (!touch) return;

  const dx = touch.clientX - lastTouchX;
  const dy = touch.clientY - lastTouchY;

  lastTouchX = touch.clientX;
  lastTouchY = touch.clientY;

  cameraYaw -= dx * 0.006;

  cameraPitch = THREE.MathUtils.clamp(
    cameraPitch + dy * 0.005,
    0.18,
    1.25
  );

  e.preventDefault();
}, { capture: true, passive: false });

function finishCameraTouch(e) {
  if (lookTouchId === null) return;

  const ended = Array.from(e.changedTouches).some(
    t => t.identifier === lookTouchId
  );

  if (ended) lookTouchId = null;
}

window.addEventListener("touchend", finishCameraTouch, {
  capture: true,
  passive: false
});

window.addEventListener("touchcancel", finishCameraTouch, {
  capture: true,
  passive: false
});

/* REMOVE LOADING */

const loading = document.getElementById("loading");
if (loading) loading.remove();

/* GAME LOOP */

function animate() {
  requestAnimationFrame(animate);

  const delta = Math.min(clock.getDelta(), 0.04);
  const elapsed = clock.elapsedTime;

  let horizontal = moveX;
  let vertical = moveY;

  if (keys["w"] || keys["arrowup"]) vertical = -1;
  if (keys["s"] || keys["arrowdown"]) vertical = 1;
  if (keys["a"] || keys["arrowleft"]) horizontal = -1;
  if (keys["d"] || keys["arrowright"]) horizontal = 1;

  const inputLength = Math.hypot(horizontal, vertical);

  if (inputLength > 0.08) {
    horizontal /= Math.max(1, inputLength);
    vertical /= Math.max(1, inputLength);

    const forward = getCameraForward();
    const right = getCameraRight();

    const direction = new THREE.Vector3()
      .addScaledVector(right, horizontal)
      .addScaledVector(forward, -vertical)
      .normalize();

    player.position.addScaledVector(direction, 6.5 * delta);

    playerRotation = Math.atan2(direction.x, direction.z);
    player.rotation.y = playerRotation;

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

  /* CAMERA FOLLOW */

  const horizontalDistance = cameraDistance * Math.cos(cameraPitch);

  const desiredCamera = new THREE.Vector3(
    player.position.x + Math.sin(cameraYaw) * horizontalDistance,
    player.position.y + cameraDistance * Math.sin(cameraPitch),
    player.position.z + Math.cos(cameraYaw) * horizontalDistance
  );

  camera.position.lerp(
    desiredCamera,
    1 - Math.exp(-7 * delta)
  );

  camera.lookAt(
    player.position.x,
    player.position.y + 1.25,
    player.position.z
  );

  /* WORLD BOUNDARY */

  player.position.x = THREE.MathUtils.clamp(player.position.x, -85, 85);
  player.position.z = THREE.MathUtils.clamp(player.position.z, -115, 115);

  /* FARM ANIMALS */

  livingAnimals.forEach(animal => {
    const t = elapsed * animal.pace + animal.phase;

    animal.mesh.position.x =
      animal.homeX + Math.sin(t * 0.55) * animal.radius;

    animal.mesh.position.z =
      animal.homeZ + Math.cos(t * 0.42) * animal.radius * 0.65;

    animal.mesh.rotation.y =
      Math.sin(t * 0.55 + 0.5) * 0.45;

    animal.legs.forEach((leg, index) => {
      leg.rotation.x = Math.sin(t * 3.2 + index * Math.PI) * 0.2;
    });

    if (animal.type === "chicken") {
      animal.mesh.position.y =
        0.025 + Math.abs(Math.sin(t * 3)) * 0.04;
    }
  });

  /* MOVING TRAFFIC */

  trafficVehicles.forEach(vehicle => {
    vehicle.mesh.position.z += vehicle.speed * delta;

    if (vehicle.mesh.position.z > 215) {
      vehicle.mesh.position.z = -215;
    } else if (vehicle.mesh.position.z < -215) {
      vehicle.mesh.position.z = 215;
    }

    vehicle.wheels.forEach(wheel => {
      wheel.rotation.x += vehicle.speed * delta * 1.8;
    });
  });

  /* FLYING BIRDS */

  flyingBirds.forEach(bird => {
    bird.mesh.position.x += bird.speed * delta;
    bird.mesh.position.z += Math.sin(elapsed * 0.6 + bird.phase) * delta;
    bird.mesh.position.y += Math.sin(elapsed * 2 + bird.phase) * delta * 0.25;

    if (bird.mesh.position.x > 100) {
      bird.mesh.position.x = -100;
    }

    bird.mesh.children.forEach((wing, index) => {
      wing.rotation.z =
        (index === 0 ? -1 : 1) *
        Math.sin(elapsed * 8 + bird.phase) * 0.45;
    });
  });

  /* DAY AND NIGHT */

  updateWorldLighting(delta);

  /* VILLAGERS */

  villagers.forEach(v => {
    v.mesh.position.y = Math.sin(elapsed * 2 + v.phase) * 0.025;
    v.mesh.rotation.y = Math.sin(elapsed * 0.5 + v.phase) * 0.15;
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
