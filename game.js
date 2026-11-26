
import * as THREE from "three";

/* =====================================================
   MAYUSH GAMEPLAY — NAYABASTI TERAI
   Realistic-style Nepali village open world
   Mobile optimized | Third-person | Touch controls
===================================================== */

document.documentElement.style.cssText =
  "margin:0;width:100%;height:100%;overflow:hidden";

document.body.style.cssText =
  "margin:0;width:100%;height:100%;overflow:hidden;background:#9cabb0;touch-action:none;user-select:none";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9cabb0);
scene.fog = new THREE.Fog(0x9cabb0, 90, 330);

const camera = new THREE.PerspectiveCamera(
  65, innerWidth / innerHeight, .1, 600
);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: "high-performance"
});

renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.35));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.domElement.style.cssText =
  "position:fixed;inset:0;width:100%;height:100%;display:block;touch-action:none";

document.body.appendChild(renderer.domElement);

/* LOADING SCREEN */

const loading = document.createElement("div");
loading.style.cssText =
  "position:fixed;inset:0;z-index:100;background:#17251e;color:white;display:flex;align-items:center;justify-content:center;flex-direction:column;font:14px Arial;gap:12px";

loading.innerHTML =
  '<div style="font-size:30px;font-weight:900;letter-spacing:4px">MAYUSH</div>' +
  '<div id="loadtext">LOADING NAYABASTI...</div>' +
  '<div style="width:190px;height:5px;background:#555;border-radius:8px;overflow:hidden">' +
  '<div id="loadbar" style="width:5%;height:5px;background:#d7b46c"></div></div>';

document.body.appendChild(loading);

function status(t, p) {
  const a = document.getElementById("loadtext");
  const b = document.getElementById("loadbar");
  if (a) a.textContent = t;
  if (b) b.style.width = p + "%";
}

/* LIGHTING */

scene.add(new THREE.HemisphereLight(0xddeaff, 0x51452e, 1.55));

const sun = new THREE.DirectionalLight(0xffe5bd, 2.6);
sun.position.set(-55, 90, 45);
sun.castShadow = true;
sun.shadow.mapSize.set(1536, 1536);
Object.assign(sun.shadow.camera, {
  left: -100, right: 100,
  top: 100, bottom: -100,
  near: 1, far: 230
});
sun.shadow.bias = -.00015;
scene.add(sun);

const fillLight = new THREE.DirectionalLight(0xb5d4ff, .45);
fillLight.position.set(50, 35, -60);
scene.add(fillLight);

/* MATERIALS */

function material(color, roughness = .9, metalness = 0) {
  return new THREE.MeshStandardMaterial({
    color, roughness, metalness
  });
}

const M = {
  grass: material(0x657d43),
  field: material(0x89964a),
  dirt: material(0x92704c),
  road: material(0x8b6748),
  rut: material(0x5e422e),
  water: material(0x477f8c, .22),
  tree: material(0x493421),
  leaf: material(0x315532),
  leaf2: material(0x54733a),
  wood: material(0x68472e),
  roof: material(0x71412e),
  wall: material(0xc9ae88),
  black: material(0x171817),
  metal: material(0x858d8c, .4, .45),
  white: material(0xe4dfd1)
};

function mesh(parent, geometry, mat, x = 0, y = 0, z = 0) {
  const o = new THREE.Mesh(geometry, mat);
  o.position.set(x, y, z);
  o.castShadow = true;
  o.receiveShadow = true;
  parent.add(o);
  return o;
}

function box(parent, x, y, z, sx, sy, sz, mat) {
  return mesh(parent, new THREE.BoxGeometry(sx, sy, sz), mat, x, y, z);
}

/* PROCEDURAL DIRT TEXTURE */

function makeTexture(base, speckles, count = 9000) {
  const c = document.createElement("canvas");
  c.width = c.height = 512;
  const ctx = c.getContext("2d");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < count; i++) {
    const color = speckles[Math.floor(Math.random() * speckles.length)];
    const r = Math.random() * 2.4 + .35;
    ctx.fillStyle = color;
    ctx.globalAlpha = .12 + Math.random() * .28;
    ctx.beginPath();
    ctx.arc(Math.random() * 512, Math.random() * 512, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const grassTexture = makeTexture("#657d43", [
  "#9eaa5b", "#3f6135", "#788b48", "#b0a56a"
]);

grassTexture.repeat.set(30, 30);
M.grass.map = grassTexture;
M.grass.needsUpdate = true;

const dirtTexture = makeTexture("#866044", [
  "#b08a5d", "#64452f", "#9b7953", "#c0a078", "#57402e"
]);

dirtTexture.repeat.set(2, 42);
M.road.map = dirtTexture;
M.road.color.set(0xffffff);
M.road.needsUpdate = true;

/* GROUND */

const ground = mesh(
  scene,
  new THREE.PlaneGeometry(600, 600),
  M.grass,
  0, -.12, 0
);
ground.rotation.x = -Math.PI / 2;

/* GRASS INSTANCES */

{
  const geo = new THREE.PlaneGeometry(.12, .55);
  geo.translate(0, .27, 0);

  const gm = new THREE.MeshStandardMaterial({
    color: 0x91a65c,
    side: THREE.DoubleSide,
    roughness: 1
  });

  const grass = new THREE.InstancedMesh(geo, gm, 2200);
  const d = new THREE.Object3D();
  let count = 0;

  for (let i = 0; i < 3000 && count < 2200; i++) {
    const x = (Math.random() - .5) * 500;
    const z = (Math.random() - .5) * 500;
    if (Math.abs(x) < 7) continue;

    d.position.set(x, .01, z);
    d.rotation.y = Math.random() * Math.PI;
    d.scale.set(.6 + Math.random(), .5 + Math.random(), 1);
    d.updateMatrix();
    grass.setMatrixAt(count++, d.matrix);
  }

  grass.count = count;
  grass.instanceMatrix.needsUpdate = true;
  scene.add(grass);
}

/* KACCHI ROAD */

box(scene, 0, .005, 0, 12, .09, 440, M.road);

// Deep wheel tracks
for (const x of [-2.65, 2.65]) {
  const rut = mesh(
    scene,
    new THREE.PlaneGeometry(.48, 440),
    M.rut,
    x, .055, 0
  );
  rut.rotation.x = -Math.PI / 2;
}

// Muddy side shoulders
box(scene, -6.5, -.005, 0, 1.2, .1, 440, M.dirt);
box(scene, 6.5, -.005, 0, 1.2, .1, 440, M.dirt);

// Small stones along the road
{
  const stoneGeo = new THREE.DodecahedronGeometry(.13, 0);
  const stoneMat = material(0x827b6c);
  const stones = new THREE.InstancedMesh(stoneGeo, stoneMat, 420);
  const d = new THREE.Object3D();

  for (let i = 0; i < 420; i++) {
    d.position.set(
      (Math.random() - .5) * 10,
      .13,
      (Math.random() - .5) * 420
    );
    d.scale.set(
      .3 + Math.random(),
      .2 + Math.random() * .5,
      .3 + Math.random()
    );
    d.rotation.set(Math.random(), Math.random(), Math.random());
    d.updateMatrix();
    stones.setMatrixAt(i, d.matrix);
  }
  scene.add(stones);
}

// Village connecting dirt roads
box(scene, -10, .005, -35, 90, .09, 6, M.road);
box(scene, 40, .005, 60, 90, .09, 6, M.road);
box(scene, -45, .005, 125, 75, .09, 6, M.road);
box(scene, 38, .005, -125, 75, .09, 6, M.road);

/* FIELDS */

function makeField(x, z, w, depth) {
  box(scene, x, .005, z, w, .08, depth, M.field);

  const cropMaterial = material(0x9b9c4d);
  const cropGeo = new THREE.ConeGeometry(.13, .75, 5);
  const total = Math.floor(w / 3) * Math.floor(depth / 4);
  const crops = new THREE.InstancedMesh(cropGeo, cropMaterial, total);
  const d = new THREE.Object3D();
  let i = 0;

  for (let px = -w / 2 + 2; px < w / 2 - 1; px += 3) {
    for (let pz = -depth / 2 + 2; pz < depth / 2 - 1; pz += 4) {
      d.position.set(x + px, .38, z + pz);
      d.rotation.y = Math.random();
      d.updateMatrix();
      crops.setMatrixAt(i++, d.matrix);
    }
  }

  crops.count = i;
  crops.instanceMatrix.needsUpdate = true;
  scene.add(crops);
}

makeField(-75, -95, 90, 90);
makeField(82, -80, 100, 100);
makeField(-82, 65, 95, 100);
makeField(83, 100, 100, 90);
makeField(-75, 180, 90, 45);

/* CANALS AND PONDS */

function canal(x, z, width, length, rotation = 0) {
  const g = new THREE.Group();
  box(g, 0, .02, 0, width, .12, length, M.water);

  for (const s of [-1, 1]) {
    box(g, s * (width / 2 + .3), .02, 0, .55, .32, length, M.dirt);
  }

  g.position.set(x, 0, z);
  g.rotation.y = rotation;
  scene.add(g);
}

canal(-125, 0, 2.5, 360);
canal(130, 20, 2.5, 350);
canal(0, -165, 2.2, 250, Math.PI / 2);

function pond(x, z, rx, rz) {
  const p = mesh(scene, new THREE.CircleGeometry(1, 48), M.water, x, .03, z);
  p.rotation.x = -Math.PI / 2;
  p.scale.set(rx, rz, 1);
}
pond(-48, -20, 12, 8);
pond(55, 145, 15, 10);

/* NEPALI HOUSES */

function makeHouse(x, z, variant = 0) {
  const h = new THREE.Group();
  const wall = material(variant ? 0xc3a37b : 0xd1b992);
  const roof = material(variant ? 0x70422e : 0x8b4c31);
  const door = material(0x493025);
  const windowMat = material(0x456b70, .3);

  box(h, 0, 2, 0, 10, 4, 8, wall);

  // Sloped roof
  const roofL = mesh(h, new THREE.BoxGeometry(5.7, .22, 9), roof, -2.6, 4.25, 0);
  roofL.rotation.z = -.35;
  const roofR = mesh(h, new THREE.BoxGeometry(5.7, .22, 9), roof, 2.6, 4.25, 0);
  roofR.rotation.z = .35;

  box(h, 0, 1.05, 4.06, 1.45, 2.1, .12, door);

  for (const s of [-1, 1]) {
    box(h, s * 2.7, 2.55, 4.1, 1.35, 1.1, .12, windowMat);
    box(h, s * 2.7, 2.55, 4.18, .07, 1.2, .08, door);
    box(h, s * 2.7, 2.55, 4.18, 1.45, .07, .08, door);
  }

  // Veranda
  box(h, 0, .18, 5.2, 12, .25, 2.8, material(0x92785c));

  for (const s of [-1, 1]) {
    const pillar = mesh(h, new THREE.CylinderGeometry(.12, .15, 3.5, 8),
      material(0x73583d), s * 5, 1.85, 5.7);
  }

  h.position.set(x, 0, z);
  scene.add(h);
}

const housePositions = [
  [-23,-85,0], [24,-105,1], [-25,-45,1], [25,-15,0],
  [-26,35,1], [25,75,0], [-25,105,1], [25,145,0],
  [-25,175,1], [-42,-100,0], [43,-65,1], [-45,55,0],
  [45,110,1]
];

for (const p of housePositions) makeHouse(...p);

/* TREES */

function makeTree(x, z, scale = 1) {
  const t = new THREE.Group();

  mesh(t, new THREE.CylinderGeometry(.18, .36, 4, 10),
    M.tree, 0, 2, 0);

  for (let i = 0; i < 18; i++) {
    const a = i * 2.399;
    const crown = mesh(
      t,
      new THREE.IcosahedronGeometry(.9 + Math.random() * .65, 1),
      i % 2 ? M.leaf : M.leaf2,
      Math.cos(a) * (Math.random() * 1.2),
      3.5 + Math.random() * 2,
      Math.sin(a) * (Math.random() * 1.2)
    );
    crown.scale.set(1.1, .9, 1.1);
  }

  t.scale.setScalar(scale);
  t.position.set(x, 0, z);
  scene.add(t);
}

for (let i = 0; i < 85; i++) {
  const x = (Math.random() - .5) * 210;
  const z = (Math.random() - .5) * 270;
  if (Math.abs(x) > 10) makeTree(x, z, .8 + Math.random() * .8);
}

/* BANANA PLANTS */

function bananaTree(x, z) {
  const g = new THREE.Group();
  mesh(g, new THREE.CylinderGeometry(.15, .22, 2.5, 10),
    material(0x79603b), 0, 1.25, 0);

  for (let i = 0; i < 8; i++) {
    const leaf = mesh(
      g, new THREE.ConeGeometry(.35, 3.8, 7),
      material(i % 2 ? 0x3d7139 : 0x58843d),
      0, 2.55, 0
    );
    leaf.rotation.z = Math.PI / 2.5;
    leaf.rotation.y = i * .8;
    leaf.scale.set(.6, 1, .24);
  }
  g.position.set(x, 0, z);
  scene.add(g);
}

for (let i = 0; i < 20; i++) {
  bananaTree(
    (Math.random() - .5) * 100,
    (Math.random() - .5) * 260
  );
}

/* HUMAN CHARACTERS
   Detailed anatomical procedural model.
   External high-detail models can replace these later.
===================================================== */

const skinTones = [
  0x9c6548, 0xb47b59, 0x86533d, 0xc08a68
];

const shirtColors = [
  0x456b45, 0x42658a, 0x9a4936,
  0x8b793e, 0xddd0b6, 0x473e61
];

function makeHuman(options = {}) {
  const {
    seated = false,
    shirtColor = shirtColors[Math.floor(Math.random() * shirtColors.length)],
    skinColor = skinTones[Math.floor(Math.random() * skinTones.length)],
    scale = 1
  } = options;

  const root = new THREE.Group();

  const skin = material(skinColor);
  const shirt = material(shirtColor);
  const pants = material(0x343a43);
  const shoes = material(0x211e1b);
  const hair = material(0x171411);
  const eye = material(0x17120f);
  const white = material(0xf0e8dc);

  const body = new THREE.Group();
  root.add(body);

  // Pelvis
  mesh(body, new THREE.CapsuleGeometry(.22, .22, 5, 10),
    pants, 0, .93, 0);

  // Torso
  const torso = mesh(body, new THREE.CapsuleGeometry(.29, .55, 6, 12),
    shirt, 0, 1.38, 0);
  torso.scale.set(1, 1.08, .78);

  // Neck and head
  mesh(body, new THREE.CylinderGeometry(.085, .095, .18, 12),
    skin, 0, 1.86, 0);

  const head = new THREE.Group();
  head.position.set(0, 2.1, .02);
  body.add(head);

  mesh(head, new THREE.SphereGeometry(.205, 20, 16),
    skin, 0, 0, 0);

  // Hair cap
  const hairCap = mesh(head,
    new THREE.SphereGeometry(.21, 18, 12, 0, Math.PI * 2, 0, Math.PI * .53),
    hair, 0, .065, -.005);
  hairCap.scale.set(1.03, 1, 1);

  // Ears
  for (const s of [-1, 1]) {
    mesh(head, new THREE.SphereGeometry(.045, 10, 8),
      skin, s * .205, -.005, 0);
  }

  // Eyes and brows
  for (const s of [-1, 1]) {
    mesh(head, new THREE.SphereGeometry(.027, 10, 8),
      white, s * .075, .025, .177);
    mesh(head, new THREE.SphereGeometry(.014, 8, 8),
      eye, s * .075, .025, .198);

    const brow = mesh(head, new THREE.BoxGeometry(.07, .018, .025),
      hair, s * .075, .075, .175);
    brow.rotation.z = s * -.08;
  }

  // Nose
  mesh(head, new THREE.ConeGeometry(.045, .13, 8),
    skin, 0, -.025, .205).rotation.x = -.3;

  // Mouth
  mesh(head, new THREE.BoxGeometry(.07, .012, .018),
    material(0x603a31), 0, -.095, .185);

  // Arms
  const arms = [];
  for (const side of [-1, 1]) {
    const arm = new THREE.Group();
    arm.position.set(side * .32, 1.65, 0);
    body.add(arm);

    mesh(arm, new THREE.CapsuleGeometry(.105, .36, 5, 9),
      shirt, 0, -.22, 0);

    const forearm = new THREE.Group();
    forearm.position.set(0, -.43, 0);
    arm.add(forearm);

    mesh(forearm, new THREE.CapsuleGeometry(.075, .31, 5, 9),
      skin, 0, -.17, 0);

    mesh(forearm, new THREE.SphereGeometry(.085, 10, 8),
      skin, 0, -.36, 0);

    arms.push({ arm, forearm });
  }

  // Legs: separate upper and lower joints
  const legs = [];
  for (const side of [-1, 1]) {
    const upper = new THREE.Group();
    upper.position.set(side * .14, .92, 0);
    body.add(upper);

    mesh(upper, new THREE.CapsuleGeometry(.12, .38, 5, 9),
      pants, 0, -.25, 0);

    const lower = new THREE.Group();
    lower.position.set(0, -.48, 0);
    upper.add(lower);

    mesh(lower, new THREE.CapsuleGeometry(.09, .39, 5, 9),
      pants, 0, -.22, 0);

    const foot = mesh(lower,
      new THREE.BoxGeometry(.17, .12, .29),
      shoes, 0, -.44, .09);

    legs.push({ upper, lower });
  }

  // Sitting pose for vehicle occupants
  if (seated) {
    for (const leg of legs) {
      leg.upper.rotation.x = -1.28;
      leg.lower.rotation.x = 1.05;
    }
    for (const a of arms) {
      a.arm.rotation.x = -.55;
      a.arm.rotation.z = a.arm.position.x > 0 ? -.25 : .25;
      a.forearm.rotation.x = -.65;
    }
    body.rotation.x = -.12;
    body.position.y = -.32;
  }

  root.scale.setScalar(scale);
  root.userData.limbs = { legs, arms, seated };
  return root;
}

function animateHuman(root, phase, amount = 1) {
  const limbs = root.userData.limbs;
  if (!limbs || limbs.seated) return;

  const swing = Math.sin(phase) * .58 * amount;

  limbs.legs[0].upper.rotation.x = swing;
  limbs.legs[1].upper.rotation.x = -swing;
  limbs.legs[0].lower.rotation.x = Math.max(0, -swing) * .6;
  limbs.legs[1].lower.rotation.x = Math.max(0, swing) * .6;

  limbs.arms[0].arm.rotation.x = -swing * .7;
  limbs.arms[1].arm.rotation.x = swing * .7;
}

/* PLAYER */

const player = new THREE.Group();
scene.add(player);

const playerHuman = makeHuman({
  shirtColor: 0x416b47,
  skinColor: 0xa96f50,
  scale: .9
});
player.add(playerHuman);
player.position.set(0, 0, 0);

let jumpVelocity = 0;
let isJumping = false;

/* VILLAGERS */

const villagers = [];

function addVillager(x, z, shirtColor) {
  const g = new THREE.Group();
  const human = makeHuman({ shirtColor, scale: .85 });
  g.add(human);
  g.position.set(x, 0, z);
  scene.add(g);

  villagers.push({
    mesh: g,
    human,
    phase: Math.random() * 10,
    speed: .3 + Math.random() * .3
  });
}

addVillager(8, 15, 0x456b45);
addVillager(-12, 30, 0x9b4938);
addVillager(30, -20, 0x405f87);
addVillager(-30, -25, 0x98804c);
addVillager(45, 65, 0xddd0b6);
addVillager(-42, 12, 0x4e7548);
addVillager(18, 92, 0x9b4938);
addVillager(-18, -115, 0x3e5d82);

/* VEHICLE WHEELS */

function makeWheel(parent, x, y, z, radius) {
  const tire = mesh(parent,
    new THREE.CylinderGeometry(radius, radius, .22, 28),
    M.black, x, y, z);
  tire.rotation.z = Math.PI / 2;

  const rim = mesh(parent,
    new THREE.CylinderGeometry(radius * .56, radius * .56, .24, 22),
    M.metal, x, y, z);
  rim.rotation.z = Math.PI / 2;

  const hub = mesh(parent,
    new THREE.CylinderGeometry(radius * .18, radius * .18, .26, 16),
    material(0xb9b9ae, .35, .6), x, y, z);
  hub.rotation.z = Math.PI / 2;

  return tire;
}

const traffic = [];

/* TRACTOR */

function makeTractor(x, z, direction = 1) {
  const g = new THREE.Group();
  const wheels = [];
  const green = material(0x28723b, .65);
  const darkGreen = material(0x174b2a);
  const chrome = M.metal;

  box(g, 0, .82, 0, 1.25, .35, 2.3, darkGreen);
  box(g, 0, 1.1, .85, 1.05, .75, 1.2, green);

  // Bonnet grille
  box(g, 0, 1.12, 1.48, .82, .55, .08, darkGreen);
  for (let i = -3; i <= 3; i++) {
    box(g, i * .11, 1.12, 1.53, .025, .42, .03, chrome);
  }

  for (const s of [-1, 1]) {
    const lamp = mesh(g, new THREE.SphereGeometry(.105, 12, 8),
      material(0xffe8b1), s * .39, 1.42, 1.46);

    const fender = mesh(g,
      new THREE.TorusGeometry(.63, .07, 8, 28, Math.PI),
      green, s * .72, .6, -.65);
    fender.rotation.z = Math.PI;

    wheels.push(
      makeWheel(g, s * .76, .59, -.68, .57),
      makeWheel(g, s * .68, .39, 1.0, .38)
    );
  }

  // Driver seat and steering
  box(g, 0, 1.38, -.55, .48, .14, .48, M.black);
  const steering = mesh(g, new THREE.TorusGeometry(.22, .025, 8, 20),
    chrome, 0, 1.55, .02);
  steering.rotation.x = .6;

  const driver = makeHuman({
    seated: true, shirtColor: 0x426a3c,
    skinColor: 0x9c6548, scale: .72
  });
  driver.position.set(0, .55, -.65);
  g.add(driver);

  // Exhaust
  mesh(g, new THREE.CylinderGeometry(.045, .055, .9, 10),
    chrome, -.36, 1.7, .8);

  // Trailer
  const trailer = new THREE.Group();
  box(trailer, 0, .95, 0, 1.9, .18, 2.7, material(0x8c3427));
  for (const s of [-1, 1]) {
    box(trailer, s * .9, 1.28, 0, .1, .65, 2.7, material(0x8c3427));
    wheels.push(makeWheel(trailer, s * 1, .45, 0, .34));
  }
  for (let i = 0; i < 6; i++) {
    const sack = mesh(trailer,
      new THREE.SphereGeometry(.25, 12, 10),
      material(0xb59a60),
      -.55 + (i % 3) * .55,
      1.3,
      -.65 + Math.floor(i / 3) * .75
    );
    sack.scale.set(1, .8, 1.3);
  }
  trailer.position.z = -2.6;
  g.add(trailer);

  g.position.set(x, 0, z);
  g.rotation.y = direction > 0 ? 0 : Math.PI;
  scene.add(g);
  traffic.push({ mesh: g, wheels, speed: direction * 3.2 });
}

/* MOTORBIKE */

function makeMotorcycle(x, z, direction = 1) {
  const g = new THREE.Group();
  const wheels = [];
  const red = material(0xa52e25, .55);
  const chrome = M.metal;

  wheels.push(
    makeWheel(g, 0, .43, .86, .39),
    makeWheel(g, 0, .43, -.86, .39)
  );

  const tank = mesh(g, new THREE.SphereGeometry(.42, 18, 14),
    red, 0, 1.02, .05);
  tank.scale.set(.72, .65, 1.05);

  const seat = mesh(g, new THREE.CapsuleGeometry(.16, .58, 5, 10),
    M.black, 0, 1.12, -.55);
  seat.rotation.x = Math.PI / 2;

  mesh(g, new THREE.CylinderGeometry(.24, .24, .42, 14),
    chrome, 0, .72, -.12).rotation.z = Math.PI / 2;

  for (const s of [-1, 1]) {
    const fork = mesh(g,
      new THREE.CylinderGeometry(.035, .045, .83, 9),
      chrome, s * .09, .87, .65);
    fork.rotation.x = -.18;
  }

  const handle = mesh(g,
    new THREE.CylinderGeometry(.035, .035, .78, 9),
    chrome, 0, 1.35, .68);
  handle.rotation.z = Math.PI / 2;

  mesh(g, new THREE.SphereGeometry(.15, 12, 10),
    material(0xffe8b4), 0, 1.25, .89);

  const rider = makeHuman({
    seated: true, shirtColor: 0x42658a,
    skinColor: 0xa96f50, scale: .68
  });
  rider.position.set(0, .57, -.48);
  g.add(rider);

  g.position.set(x, 0, z);
  g.rotation.y = direction > 0 ? 0 : Math.PI;
  scene.add(g);
  traffic.push({ mesh: g, wheels, speed: direction * 5.5 });
}

/* CAR */

function makeCar(x, z, direction = 1) {
  const g = new THREE.Group();
  const wheels = [];
  const bodyMat = material(0x315d86, .48, .15);
  const glass = new THREE.MeshStandardMaterial({
    color: 0x91b9c6,
    roughness: .2,
    metalness: .18,
    transparent: true,
    opacity: .55
  });

  box(g, 0, .75, 0, 1.35, .58, 2.9, bodyMat);

  const cabin = mesh(g, new THREE.BoxGeometry(1.12, .8, 1.55),
    glass, 0, 1.35, -.12);

  box(g, 0, 1.75, -.12, 1.08, .08, 1.52, bodyMat);

  for (const s of [-1, 1]) {
    wheels.push(
      makeWheel(g, s * .68, .45, .95, .32),
      makeWheel(g, s * .68, .45, -.95, .32)
    );
    mesh(g, new THREE.SphereGeometry(.1, 12, 8),
      material(0xffe7b0), s * .42, .83, 1.47);
    mesh(g, new THREE.SphereGeometry(.09, 12, 8),
      material(0xb52b21), s * .42, .83, -1.47);
  }

  // Seated driver inside cabin
  const driver = makeHuman({
    seated: true, shirtColor: 0x9b4938,
    skinColor: 0xa96f50, scale: .65
  });
  driver.position.set(-.25, .3, -.25);
  g.add(driver);

  const steering = mesh(g,
    new THREE.TorusGeometry(.16, .018, 8, 16),
    M.black, -.25, 1.18, .4);
  steering.rotation.x = .5;

  g.position.set(x, 0, z);
  g.rotation.y = direction > 0 ? 0 : Math.PI;
  scene.add(g);
  traffic.push({ mesh: g, wheels, speed: direction * 7 });
}

makeTractor(-2.5, -155, 1);
makeCar(2.5, -105, -1);
makeMotorcycle(2.5, 145, -1);
makeMotorcycle(-2.5, -65, 1);

/* FARM ANIMALS */

const animals = [];

const animalMaterials = {
  cow: material(0xe5dfcf),
  black: material(0x302b27),
  buffalo: material(0x302d2a),
  goat: material(0xb8a38a),
  dog: material(0x98704d),
  hoof: material(0x30251d),
  horn: material(0xd4c6a6)
};

function makeAnimal(type, x, z, scale = 1) {
  const g = new THREE.Group();
  const fur = animalMaterials[type] || animalMaterials.cow;
  const legGroups = [];

  const body = mesh(g,
    new THREE.SphereGeometry(.65, 24, 18),
    fur, 0, .98, 0);
  body.scale.set(1.35, .8, .78);

  const shoulder = mesh(g,
    new THREE.SphereGeometry(.43, 18, 14),
    fur, 0, 1.05, .42);
  shoulder.scale.set(1, 1.1, .9);

  const neck = mesh(g,
    new THREE.CylinderGeometry(.22, .3, .65, 16),
    fur, 0, 1.25, .52);
  neck.rotation.x = -.38;

  const head = new THREE.Group();
  head.position.set(0, 1.42, .85);
  g.add(head);

  const headSize = type === "dog" ? .22 : .27;
  mesh(head, new THREE.SphereGeometry(headSize, 20, 16),
    fur, 0, 0, .05);

  const muzzle = mesh(head,
    new THREE.SphereGeometry(type === "dog" ? .14 : .17, 14, 12),
    type === "cow" ? animalMaterials.cow : animalMaterials.black,
    0, -.1, .25);
  muzzle.scale.set(1, .72, 1);

  // Eyes
  for (const s of [-1, 1]) {
    mesh(head, new THREE.SphereGeometry(.035, 10, 8),
      material(0x17120e), s * .16, .045, .22);
  }

  // Ears
  for (const s of [-1, 1]) {
    const ear = mesh(head,
      new THREE.SphereGeometry(.14, 12, 10),
      fur, s * .29, .1, -.02);
    ear.scale.set(1.4, .45, .65);
    ear.rotation.z = s * -.25;
  }

  // Horns for cattle and goats
  if (type === "cow" || type === "buffalo" || type === "goat") {
    for (const s of [-1, 1]) {
      const horn = mesh(head,
        new THREE.ConeGeometry(.07, type === "buffalo" ? .48 : .35, 10),
        animalMaterials.horn, s * .19, .3, -.02);
      horn.rotation.z = s * -.42;
      horn.rotation.x = -.15;
    }
  }

  // Cow patches
  if (type === "cow") {
    for (let i = 0; i < 4; i++) {
      const patch = mesh(g,
        new THREE.SphereGeometry(.2, 12, 10),
        animalMaterials.black,
        (i % 2 ? .45 : -.45),
        1.25 + (i % 3) * .12,
        i < 2 ? .15 : -.4);
      patch.scale.set(1.2, .65, .2);
    }
  }

  // Four articulated legs
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const leg = new THREE.Group();
      leg.position.set(sx * .43, .78, sz * .43);
      g.add(leg);

      mesh(leg,
        new THREE.CylinderGeometry(.09, .075, .48, 12),
        fur, 0, -.24, 0);

      mesh(leg,
        new THREE.CylinderGeometry(.065, .07, .25, 10),
        fur, 0, -.58, 0);

      mesh(leg,
        new THREE.BoxGeometry(.16, .12, .2),
        animalMaterials.hoof, 0, -.73, .045);

      legGroups.push(leg);
    }
  }

  // Tail
  const tail = mesh(g,
    new THREE.CylinderGeometry(.025, .045, .7, 8),
    fur, 0, 1.1, -.78);
  tail.rotation.x = -.55;

  if (type === "buffalo") {
    body.scale.set(1.5, .85, .85);
  }

  if (type === "goat") {
    body.scale.set(.9, .72, .65);
    g.scale.setScalar(scale * .72);
  } else if (type === "dog") {
    body.scale.set(1, .65, .65);
    g.scale.setScalar(scale * .7);
  } else {
    g.scale.setScalar(scale);
  }

  g.position.set(x, 0, z);
  scene.add(g);

  animals.push({
    mesh: g, head, legs: legGroups, tail,
    phase: Math.random() * 8, type
  });
}

makeAnimal("cow", -17, -77, 1.05);
makeAnimal("cow", 31, -94, 1.0);
makeAnimal("buffalo", -33, -39, 1.12);
makeAnimal("buffalo", 34, 68, 1.08);
makeAnimal("goat", -18, 42, .8);
makeAnimal("goat", 30, 132, .8);
makeAnimal("goat", -39, 100, .8);
makeAnimal("dog", 8, -22, .8);
makeAnimal("dog", -12, 112, .8);

/* HAYSTACKS */

function makeHaystack(x, z, scale = 1) {
  const h = new THREE.Group();
  const hay = material(0xb9954f);

  mesh(h, new THREE.CylinderGeometry(.9 * scale, 1.1 * scale,
    1.1 * scale, 18), hay, 0, .55 * scale, 0);

  mesh(h, new THREE.ConeGeometry(1.05 * scale, 1.15 * scale, 18),
    hay, 0, 1.6 * scale, 0);

  h.position.set(x, 0, z);
  scene.add(h);
}

makeHaystack(-34, -91, 1.1);
makeHaystack(36, -42, .9);
makeHaystack(-39, 78, 1);
makeHaystack(38, 155, 1.1);

/* WOODEN FENCES */

function makeFence(x, z, length, rotation = 0) {
  const f = new THREE.Group();
  const sections = Math.max(2, Math.floor(length / 2));

  for (let i = 0; i <= sections; i++) {
    const px = -length / 2 + length / sections * i;
    box(f, px, .6, 0, .14, 1.2, .14, M.wood);
  }

  for (const y of [.38, .9]) {
    box(f, 0, y, 0, length, .12, .12, M.wood);
  }

  f.position.set(x, 0, z);
  f.rotation.y = rotation;
  scene.add(f);
}

makeFence(-39, -72, 16);
makeFence(-39, -72, 12, Math.PI / 2);
makeFence(38, -82, 17);
makeFence(38, -82, 12, Math.PI / 2);
makeFence(-42, 91, 18);
makeFence(39, 143, 16);

/* ELECTRIC POLES */

const poleMat = material(0x777b78);
const wireMat = material(0x252b2c);

function makePole(x, z) {
  const p = new THREE.Group();

  mesh(p, new THREE.CylinderGeometry(.13, .2, 10, 10),
    poleMat, 0, 5, 0);

  box(p, 0, 9.2, 0, 3.2, .16, .18, M.wood);

  for (const s of [-1, 0, 1]) {
    mesh(p, new THREE.CylinderGeometry(.08, .08, .4, 8),
      M.white, s * 1.15, 9.48, 0);
  }

  p.position.set(x, 0, z);
  scene.add(p);
}

for (let z = -190; z <= 190; z += 38) {
  makePole(-10, z);
  makePole(10, z);
}

function makeWire(x1, z1, x2, z2) {
  const curve = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(x1, 9.5, z1),
    new THREE.Vector3((x1 + x2) / 2, 8.5, (z1 + z2) / 2),
    new THREE.Vector3(x2, 9.5, z2)
  );

  mesh(scene,
    new THREE.TubeGeometry(curve, 20, .025, 5, false),
    wireMat);
}

for (let z = -190; z < 190; z += 38) {
  makeWire(-10, z, -10, z + 38);
  makeWire(10, z, 10, z + 38);
}

/* WATER POTS */

function makeWaterPot(x, z) {
  const g = new THREE.Group();
  const clay = material(0x9b5940);

  const body = mesh(g, new THREE.SphereGeometry(.38, 18, 14),
    clay, 0, .4, 0);
  body.scale.set(1, 1.15, 1);

  mesh(g, new THREE.CylinderGeometry(.19, .23, .12, 16),
    clay, 0, .82, 0);

  const water = mesh(g, new THREE.CircleGeometry(.16, 16),
    M.water, 0, .89, 0);
  water.rotation.x = -Math.PI / 2;

  g.position.set(x, 0, z);
  scene.add(g);
}

makeWaterPot(-18, -88);
makeWaterPot(30, -12);
makeWaterPot(-32, 55);
makeWaterPot(28, 108);

/* BIRDS */

const birds = [];

for (let i = 0; i < 10; i++) {
  const bird = new THREE.Group();
  const feather = material(0x303432);
  const belly = material(0x77766d);

  const body = mesh(bird, new THREE.SphereGeometry(.2, 12, 9),
    feather, 0, 0, 0);
  body.scale.set(.8, .7, 1.3);

  mesh(bird, new THREE.SphereGeometry(.12, 12, 9),
    belly, 0, .08, .28);

  mesh(bird, new THREE.ConeGeometry(.05, .2, 7),
    material(0xc58c35), 0, .04, .45).rotation.x = -Math.PI / 2;

  const wings = [];
  for (const s of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.position.set(s * .12, .05, 0);
    bird.add(pivot);

    const w = mesh(pivot, new THREE.SphereGeometry(.3, 10, 8),
      feather, s * .3, 0, 0);
    w.scale.set(1.6, .12, .55);
    wings.push({ pivot, side: s });
  }

  bird.position.set(
    (Math.random() - .5) * 85,
    13 + Math.random() * 9,
    (Math.random() - .5) * 110
  );

  scene.add(bird);
  birds.push({
    mesh: bird, wings,
    phase: Math.random() * 10,
    speed: 1.2 + Math.random() * 1.4
  });
}

/* MOBILE CONTROLS */

const controls = document.createElement("div");
controls.style.cssText =
  "position:fixed;inset:0;z-index:20;pointer-events:none";
document.body.appendChild(controls);

/* JOYSTICK */

const joystick = document.createElement("div");
joystick.id = "joystick";
joystick.style.cssText =
  "position:absolute;left:25px;bottom:35px;width:125px;height:125px;border-radius:50%;background:rgba(20,25,25,.32);border:2px solid rgba(255,255,255,.55);pointer-events:auto;touch-action:none";

const stick = document.createElement("div");
stick.style.cssText =
  "position:absolute;width:52px;height:52px;left:35px;top:35px;border-radius:50%;background:rgba(255,255,255,.75);border:2px solid white";

joystick.appendChild(stick);
controls.appendChild(joystick);

let moveX = 0;
let moveY = 0;
let joyPointer = null;

function updateJoystick(e) {
  const r = joystick.getBoundingClientRect();
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;

  let dx = e.clientX - cx;
  let dy = e.clientY - cy;
  const max = 43;
  const d = Math.hypot(dx, dy);

  if (d > max) {
    dx = dx / d * max;
    dy = dy / d * max;
  }

  stick.style.left = (35 + dx) + "px";
  stick.style.top = (35 + dy) + "px";
  moveX = dx / max;
  moveY = dy / max;
}

joystick.addEventListener("pointerdown", e => {
  joyPointer = e.pointerId;
  joystick.setPointerCapture(e.pointerId);
  updateJoystick(e);
});

joystick.addEventListener("pointermove", e => {
  if (e.pointerId === joyPointer) updateJoystick(e);
});

function releaseJoy(e) {
  if (e.pointerId !== joyPointer) return;
  joyPointer = null;
  moveX = moveY = 0;
  stick.style.left = "35px";
  stick.style.top = "35px";
}

joystick.addEventListener("pointerup", releaseJoy);
joystick.addEventListener("pointercancel", releaseJoy);

/* JUMP BUTTON */

const jumpButton = document.createElement("button");
jumpButton.id = "jump";
jumpButton.textContent = "JUMP";
jumpButton.style.cssText =
  "position:absolute;right:28px;bottom:48px;width:75px;height:75px;border-radius:50%;border:2px solid white;background:rgba(220,170,60,.78);color:white;font-weight:bold;font-size:15px;pointer-events:auto;touch-action:none";
controls.appendChild(jumpButton);

function jump() {
  if (!isJumping) {
    jumpVelocity = 7.5;
    isJumping = true;
  }
}

jumpButton.addEventListener("pointerdown", e => {
  e.preventDefault();
  jump();
});

/* CAMERA LOOK — TOUCH DRAG */

let cameraYaw = 0;
let cameraPitch = .68;
const cameraDistance = 9.5;

let lookTouchId = null;
let lastTouchX = 0;
let lastTouchY = 0;

window.addEventListener("touchstart", e => {
  if (lookTouchId !== null) return;

  const t = Array.from(e.changedTouches).find(t => {
    const el = document.elementFromPoint(t.clientX, t.clientY);
    return el && !el.closest("#joystick,#jump");
  });

  if (!t) return;
  lookTouchId = t.identifier;
  lastTouchX = t.clientX;
  lastTouchY = t.clientY;
}, { capture: true, passive: false });

window.addEventListener("touchmove", e => {
  if (lookTouchId === null) return;

  const t = Array.from(e.touches).find(
    t => t.identifier === lookTouchId
  );
  if (!t) return;

  const dx = t.clientX - lastTouchX;
  const dy = t.clientY - lastTouchY;

  lastTouchX = t.clientX;
  lastTouchY = t.clientY;

  cameraYaw -= dx * .006;
  cameraPitch = THREE.MathUtils.clamp(
    cameraPitch + dy * .005, .18, 1.25
  );

  e.preventDefault();
}, { capture: true, passive: false });

function endLook(e) {
  if (Array.from(e.changedTouches).some(
    t => t.identifier === lookTouchId
  )) lookTouchId = null;
}

window.addEventListener("touchend", endLook);
window.addEventListener("touchcancel", endLook);

/* GAME LOOP */

const clock = new THREE.Clock();
let elapsed = 0;

function animate() {
  requestAnimationFrame(animate);

  const dt = Math.min(clock.getDelta(), .04);
  elapsed += dt;

  // Player movement relative to camera
  const forward = -moveY;
  const side = moveX;
  const moving = Math.hypot(forward, side) > .08;

  if (moving) {
    const dx = side * Math.cos(cameraYaw) - forward * Math.sin(cameraYaw);
    const dz = -side * Math.sin(cameraYaw) - forward * Math.cos(cameraYaw);
    const len = Math.hypot(dx, dz) || 1;

    player.position.x += dx / len * 5 * dt;
    player.position.z += dz / len * 5 * dt;

    player.rotation.y = Math.atan2(dx / len, dz / len);
    animateHuman(playerHuman, elapsed * 12, 1);
  } else {
    animateHuman(playerHuman, 0, 0);
  }

  // Jump physics
  if (isJumping) {
    player.position.y += jumpVelocity * dt;
    jumpVelocity -= 18 * dt;

    if (player.position.y <= 0) {
      player.position.y = 0;
      jumpVelocity = 0;
      isJumping = false;
    }
  }

  // Villagers idle movement
  for (const v of villagers) {
    animateHuman(v.human, elapsed * 2.5 + v.phase, .25);
  }

  // Vehicles move along road
  for (const v of traffic) {
    v.mesh.position.z += v.speed * dt;

    if (v.mesh.position.z > 220) v.mesh.position.z = -220;
    if (v.mesh.position.z < -220) v.mesh.position.z = 220;

    for (const w of v.wheels) {
      w.rotation.x += v.speed * dt * 1.8;
    }
  }

  // Animal idle / leg motion
  for (const a of animals) {
    const phase = elapsed * 1.8 + a.phase;

    a.head.rotation.x = Math.sin(phase * .5) * .07;
    a.tail.rotation.x = -.55 + Math.sin(phase * 2) * .3;
    a.tail.rotation.z = Math.sin(phase * 1.4) * .22;

    for (let i = 0; i < a.legs.length; i++) {
      a.legs[i].rotation.x =
        Math.sin(phase + i * Math.PI / 2) * .025;
    }
  }

  // Birds
  for (const b of birds) {
    b.mesh.position.x += b.speed * dt;
    b.mesh.position.y += Math.sin(elapsed * 2 + b.phase) * dt * .25;
    b.mesh.position.z += Math.cos(elapsed + b.phase) * dt * .35;

    if (b.mesh.position.x > 100) b.mesh.position.x = -100;

    for (const w of b.wings) {
      w.pivot.rotation.z =
        w.side * Math.sin(elapsed * 9 + b.phase) * .72;
    }
  }

  // Third-person camera
  const h = cameraDistance * Math.cos(cameraPitch);

  const target = new THREE.Vector3(
    player.position.x + Math.sin(cameraYaw) * h,
    player.position.y + cameraDistance * Math.sin(cameraPitch),
    player.position.z + Math.cos(cameraYaw) * h
  );

  camera.position.lerp(target, 1 - Math.exp(-7 * dt));
  camera.lookAt(
    player.position.x,
    player.position.y + 1.2,
    player.position.z
  );

  renderer.render(scene, camera);
}

/* START */

function startGame() {
  status("BUILDING NEPALI VILLAGE...", 70);

  setTimeout(() => {
    if (loading.isConnected) loading.remove();
  }, 700);

  animate();
}

startGame();

/* RESIZE */

window.addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.35));
});

console.log("MAYUSH GAMEPLAY — NAYABASTI READY");
