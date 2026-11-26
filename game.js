import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js";
import { startStory } from "./story.js";

/* =========================================
   MAYUSH.GAMEPLAY — NAYABASTI TERAI
========================================= */

const scene = new THREE.Scene();

scene.background = new THREE.Color(0xb8d3df);
scene.fog = new THREE.Fog(0xc5d4c9, 105, 360);

const camera = new THREE.PerspectiveCamera(
  62,
  innerWidth / innerHeight,
  0.1,
  900
);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: "high-performance"
});

const cores = navigator.hardwareConcurrency || 4;
const pixelQuality = cores >= 6 ? 1.6 : 1.2;

renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, pixelQuality));

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

document.body.appendChild(renderer.domElement);

/* LIGHTING */

scene.add(
  new THREE.HemisphereLight(
    0xeaf5ff,
    0x667447,
    1.8
  )
);

const sun = new THREE.DirectionalLight(
  0xffe8c5,
  2.25
);

sun.position.set(-65, 100, 55);
sun.castShadow = true;

sun.shadow.mapSize.set(
  cores >= 6 ? 2048 : 1024,
  cores >= 6 ? 2048 : 1024
);

sun.shadow.camera.left = -115;
sun.shadow.camera.right = 115;
sun.shadow.camera.top = 115;
sun.shadow.camera.bottom = -115;
sun.shadow.camera.far = 260;
sun.shadow.bias = -0.00025;

scene.add(sun);

/* MATERIALS */

function material(color, roughness = 1, metalness = 0) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness
  });
}

const M = {
  grass: material(0x668a43),
  field1: material(0x779348),
  field2: material(0x63813b),

  road: material(0x555653),
  dirt: material(0xa88c60),
  concrete: material(0xaaa99d),

  brick: material(0xa95638),
  brickDark: material(0x743c2d),
  cream: material(0xe2d0a9),
  white: material(0xe9e8dc),

  redRoof: material(0x934a34),
  tin: material(0x777e80, 0.7, 0.35),

  wood: material(0x69452b),
  darkWood: material(0x39291d),

  glass: material(0x75adbf, 0.25, 0.12),

  leaves: material(0x367b32),
  leaves2: material(0x609b3d),

  water: material(0x397f91, 0.22, 0.2),

  crop: material(0x8ba849),
  crop2: material(0xa5b94a),

  pole: material(0x55534c),

  blue: material(0x287f9d, 0.55),
  rust: material(0x725c45, 0.8, 0.3)
};

/* BASIC OBJECT FUNCTIONS */

function addBox(
  x, y, z,
  sx, sy, sz,
  mat,
  shadow = true
) {
  const o = new THREE.Mesh(
    new THREE.BoxGeometry(sx, sy, sz),
    mat
  );

  o.position.set(x, y, z);
  o.castShadow = shadow;
  o.receiveShadow = true;

  scene.add(o);

  return o;
}

function addCylinder(
  x, y, z,
  rt, rb, h,
  mat,
  segments = 10
) {
  const o = new THREE.Mesh(
    new THREE.CylinderGeometry(
      rt, rb, h, segments
    ),
    mat
  );

  o.position.set(x, y, z);
  o.castShadow = true;
  o.receiveShadow = true;

  scene.add(o);

  return o;
}

/* =========================================
   TERAI LANDSCAPE
========================================= */

addBox(
  0, -0.55, 0,
  500, 1, 500,
  M.grass,
  false
);

/* MAIN ROAD */

addBox(
  0, -0.005, 0,
  12, 0.16, 420,
  M.road,
  false
);

/* ROAD SIDES */

addBox(
  -6.5, 0.015, 0,
  1, 0.12, 420,
  M.dirt,
  false
);

addBox(
  6.5, 0.015, 0,
  1, 0.12, 420,
  M.dirt,
  false
);

/* ROAD MARKINGS */

for (let z = -200; z < 210; z += 14) {
  addBox(
    0, 0.085, z,
    0.16, 0.025, 4.5,
    M.white,
    false
  );
}

/* SMALL VILLAGE ROADS */

[
  [-38, -35, 75, 7],
  [40, 60, 75, 7],
  [-45, 125, 65, 6],
  [38, -125, 70, 6]
].forEach(a => {
  addBox(
    a[0], 0, a[1],
    a[2], 0.14, a[3],
    M.dirt,
    false
  );
});

/* =========================================
   FARM FIELDS
========================================= */

function field(x, z, w, d, mat) {

  addBox(
    x, -0.015, z,
    w, 0.12, d,
    mat,
    false
  );

  addBox(
    x, 0.1, z - d / 2,
    w, 0.22, 0.65,
    M.dirt,
    false
  );

  addBox(
    x, 0.1, z + d / 2,
    w, 0.22, 0.65,
    M.dirt,
    false
  );

  addBox(
    x - w / 2, 0.1, z,
    0.65, 0.22, d,
    M.dirt,
    false
  );

  addBox(
    x + w / 2, 0.1, z,
    0.65, 0.22, d,
    M.dirt,
    false
  );

  const n =
    Math.floor(w / 1.6) *
    Math.floor(d / 2.7);

  const inst = new THREE.InstancedMesh(
    new THREE.BoxGeometry(
      0.13, 0.65, 0.13
    ),
    M.crop,
    n
  );

  const dummy = new THREE.Object3D();

  let k = 0;

  for (
    let px = -w / 2 + 1;
    px < w / 2 - 1;
    px += 1.6
  ) {
    for (
      let pz = -d / 2 + 1;
      pz < d / 2 - 1;
      pz += 2.7
    ) {

      dummy.position.set(
        x + px,
        0.34,
        z + pz
      );

      dummy.rotation.y = Math.random() * 0.3;

      dummy.scale.set(
        0.8 + Math.random() * 0.45,
        0.7 + Math.random() * 0.6,
        1
      );

      dummy.updateMatrix();

      inst.setMatrixAt(k++, dummy.matrix);
    }
  }

  inst.count = k;
  inst.castShadow = true;

  scene.add(inst);
}

field(-75, -95, 90, 90, M.field1);
field(82, -80, 100, 100, M.field2);

field(-82, 65, 95, 100, M.field1);
field(83, 100, 100, 90, M.field2);

field(-75, 180, 90, 45, M.field1);
field(85, -185, 100, 40, M.field2);

/* =========================================
   IRRIGATION CANALS
========================================= */

function canal(x, z, w, len, rot = 0) {

  const g = new THREE.Group();

  const water = new THREE.Mesh(
    new THREE.BoxGeometry(w, 0.1, len),
    M.water
  );

  water.position.y = 0.04;

  g.add(water);

  [-1, 1].forEach(s => {

    const bank = new THREE.Mesh(
      new THREE.BoxGeometry(
        0.55, 0.28, len
      ),
      M.dirt
    );

    bank.position.set(
      s * (w / 2 + 0.28),
      0,
      0
    );

    g.add(bank);
  });

  g.position.set(x, 0, z);
  g.rotation.y = rot;

  scene.add(g);
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

/* =========================================
   REALISTIC STYLE TERAI HOUSES
========================================= */

function house(x, z, opt = {}) {

  const w = opt.w || 10;
  const d = opt.d || 9;
  const h = opt.h || 4;

  const wall = opt.wall || M.cream;
  const roofMat = opt.roof || M.tin;

  const g = new THREE.Group();

  /* MAIN WALL */

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    wall
  );

  body.position.y = h / 2 + 0.15;
  body.castShadow = true;
  body.receiveShadow = true;

  g.add(body);

  /* ROOF */

  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(
      w + 0.55,
      0.32,
      d + 0.55
    ),
    roofMat
  );

  roof.position.y = h + 0.34;
  roof.castShadow = true;

  g.add(roof);

  /* FRONT DOOR */

  const door = new THREE.Mesh(
    new THREE.BoxGeometry(
      1.22, 2.45, 0.13
    ),
    M.wood
  );

  door.position.set(
    0, 1.4, d / 2 + 0.1
  );

  g.add(door);

  /* DOOR FRAME */

  [-0.69, 0.69].forEach(px => {

    const p = new THREE.Mesh(
      new THREE.BoxGeometry(
        0.13, 2.65, 0.17
      ),
      M.white
    );

    p.position.set(
      px, 1.43, d / 2 + 0.17
    );

    g.add(p);
  });

  const lintel = new THREE.Mesh(
    new THREE.BoxGeometry(
      1.5, 0.14, 0.17
    ),
    M.white
  );

  lintel.position.set(
    0, 2.72, d / 2 + 0.17
  );

  g.add(lintel);

  /* DOOR HANDLE */

  const knob = new THREE.Mesh(
    new THREE.SphereGeometry(
      0.065, 8, 8
    ),
    M.tin
  );

  knob.position.set(
    0.4, 1.35, d / 2 + 0.19
  );

  g.add(knob);

  /* WINDOWS */

  [-w * 0.3, w * 0.3].forEach(wx => {

    const glass = new THREE.Mesh(
      new THREE.BoxGeometry(
        1.55, 1.08, 0.09
      ),
      M.glass
    );

    glass.position.set(
      wx, 2.5, d / 2 + 0.1
    );

    g.add(glass);

    [-0.83, 0.83].forEach(dx => {

      const s = new THREE.Mesh(
        new THREE.BoxGeometry(
          0.1, 1.3, 0.15
        ),
        M.white
      );

      s.position.set(
        wx + dx,
        2.5,
        d / 2 + 0.17
      );

      g.add(s);
    });

    [-0.61, 0.61].forEach(dy => {

      const s = new THREE.Mesh(
        new THREE.BoxGeometry(
          1.75, 0.1, 0.15
        ),
        M.white
      );

      s.position.set(
        wx,
        2.5 + dy,
        d / 2 + 0.17
      );

      g.add(s);
    });

    const bar = new THREE.Mesh(
      new THREE.BoxGeometry(
        0.06, 1.05, 0.16
      ),
      M.wood
    );

    bar.position.set(
      wx, 2.5, d / 2 + 0.19
    );

    g.add(bar);
  });

  /* VERANDA */

  const veranda = new THREE.Mesh(
    new THREE.BoxGeometry(
      w + 1.5, 0.2, 2.5
    ),
    M.tin
  );

  veranda.position.set(
    0, 3.2, d / 2 + 1.05
  );

  g.add(veranda);

  [-w / 2 + 0.5, w / 2 - 0.5].forEach(px => {

    const p = new THREE.Mesh(
      new THREE.BoxGeometry(
        0.18, 3, 0.18
      ),
      M.white
    );

    p.position.set(
      px, 1.55, d / 2 + 2
    );

    g.add(p);
  });

  /* FRONT STEP */

  const step = new THREE.Mesh(
    new THREE.BoxGeometry(
      2.2, 0.18, 0.9
    ),
    M.concrete
  );

  step.position.set(
    0, 0.12, d / 2 + 1.15
  );

  g.add(step);

  /* WATER TANK */

  if (opt.tank) {

    const t = new THREE.Mesh(
      new THREE.CylinderGeometry(
        0.75, 0.75, 1.3, 14
      ),
      M.blue
    );

    t.position.set(
      w / 3, h + 1, -d / 4
    );

    g.add(t);
  }

  g.position.set(x, 0, z);

  g.traverse(o => {
    if (o.isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });

  scene.add(g);

  return g;
}

/* VILLAGE HOUSE LOCATIONS */

house(-23, -85, { tank: true });
house(24, -105, { w: 11 });
house(-25, -45, { wall: M.white, roof: M.redRoof });
house(25, -15, { w: 11, tank: true });

house(-26, 35);
house(25, 75, { w: 12 });

house(-25, 105, { wall: M.white, tank: true });
house(25, 145, { roof: M.redRoof });

house(-25, 175);
house(-42, -100, {
  w: 8, d: 7, h: 3.2, wall: M.brick
});

house(43, -65, {
  w: 8, d: 7, h: 3.2, wall: M.brick
});

house(-45, 55, {
  w: 8, d: 7, h: 3.2, wall: M.brick
});

house(45, 110, {
  w: 8, d: 7, h: 3.2, wall: M.brick
});

// ==========================================
// PART 2/2 — NAYABASTI REALISTIC VILLAGE
// ==========================================

// ---------- PAGE STYLE ----------
document.body.style.margin = "0";
document.body.style.padding = "0";
document.body.style.overflow = "hidden";
document.body.style.background = "#87b9d5";
document.body.style.touchAction = "none";
document.body.style.userSelect = "none";

renderer.domElement.style.position = "fixed";
renderer.domElement.style.inset = "0";
renderer.domElement.style.width = "100%";
renderer.domElement.style.height = "100%";
renderer.domElement.style.display = "block";
renderer.domElement.style.touchAction = "none";
renderer.domElement.style.userSelect = "none";

// ---------- VILLAGE TREES ----------
function tree(x, z, scale = 1) {
  const trunk = addCylinder(
    0.18 * scale,
    0.25 * scale,
    2.2 * scale,
    M.wood,
    x,
    1.1 * scale,
    z
  );

  const leaves = new THREE.Group();
  leaves.position.set(x, 2.5 * scale, z);

  const leafMat = new THREE.MeshStandardMaterial({
    color: [0x397b35, 0x4d913e, 0x629d45][Math.floor(Math.random() * 3)],
    roughness: 1
  });

  for (let i = 0; i < 7; i++) {
    const ball = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.9 * scale, 1),
      leafMat
    );

    ball.position.set(
      (Math.random() - 0.5) * 1.5 * scale,
      Math.random() * 1.2 * scale,
      (Math.random() - 0.5) * 1.5 * scale
    );

    ball.scale.set(1.1, 0.9, 1);
    ball.castShadow = true;
    leaves.add(ball);
  }

  scene.add(leaves);
}

for (let i = 0; i < 90; i++) {
  const x = (Math.random() - 0.5) * 180;
  const z = (Math.random() - 0.5) * 220;

  if (Math.abs(x) > 8 && Math.random() > 0.25) {
    tree(x, z, 0.7 + Math.random() * 0.8);
  }
}

// ---------- BANANA TREES ----------
function bananaTree(x, z) {
  addCylinder(0.12, 0.16, 3.2, M.wood, x, 1.6, z);

  for (let i = 0; i < 7; i++) {
    const leaf = new THREE.Mesh(
      new THREE.ConeGeometry(0.35, 3.5, 5),
      new THREE.MeshStandardMaterial({
        color: 0x398b35,
        roughness: 1
      })
    );

    leaf.position.set(x, 3.2, z);
    leaf.rotation.z = Math.PI / 2 + (Math.random() - 0.5) * 0.8;
    leaf.rotation.y = i * 0.9;
    leaf.scale.set(0.55, 1, 0.25);
    scene.add(leaf);
  }
}

for (let i = 0; i < 22; i++) {
  bananaTree(
    15 + Math.random() * 45,
    -90 + Math.random() * 180
  );
}

// ---------- ELECTRIC POLES ----------
function electricPole(x, z) {
  addCylinder(0.13, 0.17, 8, M.concrete, x, 4, z);

  addBox(2.8, 0.14, 0.14, M.wood, x, 7.2, z);

  for (let i = -1; i <= 1; i++) {
    addCylinder(
      0.08,
      0.08,
      0.35,
      M.concrete,
      x + i * 1.1,
      7.5,
      z
    );
  }
}

for (let z = -100; z <= 110; z += 35) {
  electricPole(-7, z);
  electricPole(7, z);
}

// Electric wires
function wire(x1, z1, x2, z2, y = 7.3) {
  const points = [
    new THREE.Vector3(x1, y, z1),
    new THREE.Vector3((x1 + x2) / 2, y - 0.5, (z1 + z2) / 2),
    new THREE.Vector3(x2, y, z2)
  ];

  const curve = new THREE.CatmullRomCurve3(points);

  const mesh = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 16, 0.025, 5, false),
    new THREE.MeshStandardMaterial({
      color: 0x252525,
      roughness: 0.8
    })
  );

  scene.add(mesh);
}

for (let z = -100; z < 110; z += 35) {
  wire(-7, z, -7, z + 35);
  wire(7, z, 7, z + 35);
}

// ---------- TEA SHOP ----------
function teaShop(x, z) {
  addBox(8, 3.2, 6, M.brick, x, 1.6, z);

  addBox(8.6, 0.25, 6.6, M.roof, x, 3.3, z);

  addBox(3.2, 1.3, 0.15, M.wood, x, 1.8, z - 3.08);

  addBox(2.2, 0.15, 1.1, M.wood, x, 1.2, z - 3.5);

  addBox(1.2, 1.8, 0.12, M.door, x - 2.7, 0.9, z - 3.05);

  addBox(2.5, 0.45, 0.15, M.white, x, 3.9, z - 3.2);

  const sign = document.createElement("div");
  sign.textContent = "NAYABASTI TEA SHOP";
  sign.style.cssText = `
    position:fixed;
    left:50%;
    top:15%;
    transform:translateX(-50%);
    color:white;
    font-size:12px;
    font-weight:bold;
    background:#8b3e1e;
    padding:5px 12px;
    border-radius:3px;
    pointer-events:none;
    display:none;
  `;

  document.body.appendChild(sign);
}

teaShop(-17, 18);

// ---------- VILLAGE SCHOOL ----------
function school(x, z) {
  addBox(18, 4.5, 10, M.white, x, 2.25, z);

  addBox(18.8, 0.35, 10.8, M.roof, x, 4.6, z);

  for (let i = -2; i <= 2; i++) {
    addBox(2, 1.6, 0.15, M.blue, x + i * 3.2, 2.7, z - 5.1);
  }

  addBox(3, 2.4, 0.15, M.door, x, 1.2, z - 5.1);

  addBox(8, 1.5, 0.2, M.green, x, 5.5, z - 5.5);
}

school(35, -30);

// ---------- CHAUTARI ----------
function chautari(x, z) {
  addCylinder(1.7, 1.7, 0.45, M.concrete, x, 0.25, z);

  addCylinder(0.18, 0.22, 2.8, M.wood, x, 1.6, z);

  tree(x, z, 1.5);

  addBox(3.8, 0.25, 0.6, M.wood, x, 0.8, z + 2);
  addBox(3.8, 0.25, 0.6, M.wood, x, 0.8, z - 2);
}

chautari(-27, -15);

// ---------- HAND PUMPS ----------
function handPump(x, z) {
  addBox(0.25, 1.6, 0.25, M.metal, x, 0.8, z);
  addBox(1.3, 0.12, 0.12, M.metal, x + 0.5, 1.5, z);
  addCylinder(0.08, 0.08, 0.4, M.metal, x, 1.7, z);
}

handPump(12, 15);
handPump(-35, 35);
handPump(40, 60);

// ---------- YARD DETAILS ----------
function yard(x, z) {
  addBox(6, 0.08, 5, M.sand, x, 0.05, z);

  addBox(0.12, 0.8, 5, M.wood, x - 3, 0.4, z);
  addBox(0.12, 0.8, 5, M.wood, x + 3, 0.4, z);
  addBox(6, 0.8, 0.12, M.wood, x, 0.4, z - 2.5);
}

yard(45, 110);
yard(-40, -65);
yard(25, 45);

// ---------- CLOTHESLINE ----------
function clothesline(x, z) {
  addCylinder(0.06, 0.06, 2.5, M.wood, x, 1.25, z);
  addCylinder(0.06, 0.06, 2.5, M.wood, x + 5, 1.25, z);

  const line = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.025, 5, 5),
    M.metal
  );

  line.position.set(x + 2.5, 2.3, z);
  line.rotation.z = Math.PI / 2;
  scene.add(line);

  const clothColors = [0xe84b4b, 0x3978d8, 0xe8d64b, 0xffffff];

  for (let i = 0; i < 4; i++) {
    addBox(
      0.8,
      1,
      0.08,
      new THREE.MeshStandardMaterial({
        color: clothColors[i]
      }),
      x + 0.6 + i * 1.1,
      1.7,
      z
    );
  }
}

clothesline(48, 105);
clothesline(-42, -60);

// ---------- SMALL SHRUBS ----------
function shrub(x, z) {
  const mesh = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.55, 1),
    new THREE.MeshStandardMaterial({
      color: 0x427d32,
      roughness: 1
    })
  );

  mesh.position.set(x, 0.4, z);
  mesh.scale.set(1.3, 0.8, 1);
  scene.add(mesh);
}

for (let i = 0; i < 100; i++) {
  shrub(
    (Math.random() - 0.5) * 140,
    (Math.random() - 0.5) * 200
  );
}

// ---------- PLAYER ----------
const player = new THREE.Group();
scene.add(player);

const skinMat = new THREE.MeshStandardMaterial({
  color: 0xc58d65,
  roughness: 0.9
});

const shirtMat = new THREE.MeshStandardMaterial({
  color: 0x2466a6,
  roughness: 0.9
});

const pantsMat = new THREE.MeshStandardMaterial({
  color: 0x292c35,
  roughness: 1
});

const body = new THREE.Mesh(
  new THREE.CapsuleGeometry(0.38, 0.85, 5, 8),
  shirtMat
);
body.position.y = 1.25;
player.add(body);

const head = new THREE.Mesh(
  new THREE.SphereGeometry(0.3, 16, 16),
  skinMat
);
head.position.y = 2.15;
player.add(head);

const hair = new THREE.Mesh(
  new THREE.SphereGeometry(0.31, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2),
  new THREE.MeshStandardMaterial({ color: 0x17130f })
);
hair.position.y = 2.3;
player.add(hair);

const leftLeg = new THREE.Mesh(
  new THREE.BoxGeometry(0.23, 0.65, 0.25),
  pantsMat
);
leftLeg.position.set(-0.17, 0.35, 0);
player.add(leftLeg);

const rightLeg = leftLeg.clone();
rightLeg.position.x = 0.17;
player.add(rightLeg);

const leftArm = new THREE.Mesh(
  new THREE.BoxGeometry(0.2, 0.75, 0.22),
  shirtMat
);
leftArm.position.set(-0.48, 1.25, 0);
player.add(leftArm);

const rightArm = leftArm.clone();
rightArm.position.x = 0.48;
player.add(rightArm);

player.position.set(0, 0, 0);

// ---------- NPC VILLAGERS ----------
const villagers = [];

function createVillager(x, z, color) {
  const npc = new THREE.Group();

  const shirt = new THREE.MeshStandardMaterial({ color });
  const pants = new THREE.MeshStandardMaterial({ color: 0x353535 });

  const torso = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.32, 0.75, 4, 8),
    shirt
  );
  torso.position.y = 1.2;
  npc.add(torso);

  const face = new THREE.Mesh(
    new THREE.SphereGeometry(0.25, 12, 12),
    skinMat
  );
  face.position.y = 2;
  npc.add(face);

  const leg1 = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 0.65, 0.2),
    pants
  );
  leg1.position.set(-0.13, 0.35, 0);
  npc.add(leg1);

  const leg2 = leg1.clone();
  leg2.position.x = 0.13;
  npc.add(leg2);

  npc.position.set(x, 0, z);
  scene.add(npc);

  villagers.push({
    mesh: npc,
    originX: x,
    originZ: z,
    phase: Math.random() * 10
  });
}

createVillager(8, 15, 0xc44c34);
createVillager(-12, 30, 0x367d50);
createVillager(30, -20, 0xd4a23d);
createVillager(-30, -25, 0x7d4aa0);
createVillager(45, 65, 0x3b8295);

// ---------- TOUCH CONTROLS ----------
const controlStyle = document.createElement("style");

controlStyle.textContent = `
#mobile-controls {
  position:fixed;
  inset:0;
  z-index:10;
  pointer-events:none;
}
#joystick {
  position:absolute;
  left:25px;
  bottom:35px;
  width:125px;
  height:125px;
  border-radius:50%;
  background:rgba(255,255,255,.18);
  border:2px solid rgba(255,255,255,.55);
  pointer-events:auto;
  touch-action:none;
}
#stick {
  position:absolute;
  width:52px;
  height:52px;
  left:35px;
  top:35px;
  border-radius:50%;
  background:rgba(255,255,255,.8);
  box-shadow:0 3px 12px #3338;
}
#jump {
  position:absolute;
  right:30px;
  bottom:50px;
  width:75px;
  height:75px;
  border-radius:50%;
  border:2px solid white;
  background:rgba(30,110,220,.7);
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
  pointer-events:none;
}
`;

document.head.appendChild(controlStyle);

const controls = document.createElement("div");
controls.id = "mobile-controls";

controls.innerHTML = `
  <div id="game-label">NAYABASTI • FREE ROAM</div>
  <div id="joystick"><div id="stick"></div></div>
  <button id="jump">JUMP</button>
`;

document.body.appendChild(controls);

const joystick = document.getElementById("joystick");
const stick = document.getElementById("stick");
const jumpButton = document.getElementById("jump");

let moveX = 0;
let moveY = 0;
let joystickPointer = null;
let jumping = false;
let jumpVelocity = 0;
let playerHeight = 0;

function updateJoystick(e) {
  const rect = joystick.getBoundingClientRect();

  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  let dx = e.clientX - centerX;
  let dy = e.clientY - centerY;

  const max = 38;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance > max) {
    dx = dx / distance * max;
    dy = dy / distance * max;
  }

  stick.style.transform = `translate(${dx}px, ${dy}px)`;

  moveX = dx / max;
  moveY = dy / max;
}

joystick.addEventListener("pointerdown", e => {
  joystickPointer = e.pointerId;
  joystick.setPointerCapture(e.pointerId);
  updateJoystick(e);
});

joystick.addEventListener("pointermove", e => {
  if (e.pointerId === joystickPointer) updateJoystick(e);
});

function stopJoystick(e) {
  if (e.pointerId !== joystickPointer) return;

  joystickPointer = null;
  moveX = 0;
  moveY = 0;
  stick.style.transform = "translate(0px,0px)";
}

joystick.addEventListener("pointerup", stopJoystick);
joystick.addEventListener("pointercancel", stopJoystick);

jumpButton.addEventListener("pointerdown", e => {
  e.preventDefault();

  if (playerHeight <= 0.01) {
    jumping = true;
    jumpVelocity = 6.5;
  }
});

// ---------- KEYBOARD CONTROLS ----------
const keys = {};

window.addEventListener("keydown", e => {
  keys[e.key.toLowerCase()] = true;
});

window.addEventListener("keyup", e => {
  keys[e.key.toLowerCase()] = false;
});

// ---------- CAMERA ----------
const cameraOffset = new THREE.Vector3(0, 6, 10);

camera.position.set(0, 6, 10);
camera.lookAt(player.position);

// ---------- STORY START ----------
let gameStarted = false;

function startGame() {
  gameStarted = true;

  const loading = document.getElementById("loading");
  if (loading) loading.style.display = "none";
}

if (typeof startStory === "function") {
  startStory(startGame);
} else {
  startGame();
}

// ---------- DUST PARTICLES ----------
const dustParticles = [];

for (let i = 0; i < 35; i++) {
  const dust = new THREE.Mesh(
    new THREE.SphereGeometry(0.035, 5, 5),
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.4
    })
  );

  dust.position.set(
    (Math.random() - 0.5) * 30,
    Math.random() * 3,
    (Math.random() - 0.5) * 30
  );

  scene.add(dust);
  dustParticles.push(dust);
}

// ---------- MOVEMENT ----------
const clock = new THREE.Clock();

let playerRotation = 0;
let walkTime = 0;

function animate() {
  requestAnimationFrame(animate);

  const delta = Math.min(clock.getDelta(), 0.04);
  const elapsed = clock.elapsedTime;

  if (gameStarted) {
    let horizontal = moveX;
    let vertical = moveY;

    if (keys["w"] || keys["arrowup"]) vertical = -1;
    if (keys["s"] || keys["arrowdown"]) vertical = 1;
    if (keys["a"] || keys["arrowleft"]) horizontal = -1;
    if (keys["d"] || keys["arrowright"]) horizontal = 1;

    const length = Math.sqrt(horizontal * horizontal + vertical * vertical);

    if (length > 1) {
      horizontal /= length;
      vertical /= length;
    }

    const speed = 7;

    const moving = Math.abs(horizontal) + Math.abs(vertical) > 0.05;

    if (moving) {
      const angle = Math.atan2(horizontal, vertical);

      playerRotation = angle;
      player.rotation.y = playerRotation;

      player.position.x += Math.sin(angle) * speed * delta;
      player.position.z += Math.cos(angle) * speed * delta;

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

    // Jump physics
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

    // Follow camera
    const desiredCamera = new THREE.Vector3(
      player.position.x - Math.sin(playerRotation) * cameraOffset.z,
      player.position.y + cameraOffset.y,
      player.position.z - Math.cos(playerRotation) * cameraOffset.z
    );

    camera.position.lerp(desiredCamera, 1 - Math.pow(0.001, delta));

    const lookTarget = new THREE.Vector3(
      player.position.x,
      player.position.y + 1.3,
      player.position.z
    );

    camera.lookAt(lookTarget);

    // Keep player inside village
    player.position.x = THREE.MathUtils.clamp(player.position.x, -85, 85);
    player.position.z = THREE.MathUtils.clamp(player.position.z, -115, 115);
  }

  // Villager idle movement
  villagers.forEach(v => {
    v.mesh.position.y = Math.sin(elapsed * 2 + v.phase) * 0.025;
    v.mesh.rotation.y = Math.sin(elapsed * 0.5 + v.phase) * 0.15;
  });

  // Moving dust
  dustParticles.forEach((dust, i) => {
    dust.position.y += delta * 0.15;

    if (dust.position.y > 4) {
      dust.position.y = 0;
    }

    dust.position.x += Math.sin(elapsed + i) * delta * 0.05;
  });

  renderer.render(scene, camera);
}

// ---------- RESIZE ----------
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ---------- START ----------
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
renderer.setSize(window.innerWidth, window.innerHeight);

animate();