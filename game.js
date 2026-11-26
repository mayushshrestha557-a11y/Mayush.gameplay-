
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import * as SkeletonUtils from "three/addons/utils/SkeletonUtils.js";


/* ==========================================
   MAYUSH.GAMEPLAY
   NAYABASTI — REALISTIC VILLAGE UPGRADE
   MOBILE OPTIMIZED
========================================== */

document.documentElement.style.cssText =
  "margin:0;width:100%;height:100%;overflow:hidden;";

document.body.style.cssText =
  "margin:0;width:100%;height:100%;overflow:hidden;background:#91a9ad;touch-action:none;user-select:none;";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9bb8c2);
scene.fog = new THREE.Fog(0x9bb8c2, 100, 330);

const camera = new THREE.PerspectiveCamera(
  62,
  innerWidth / innerHeight,
  0.1,
  450
);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: "high-performance"
});

renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.25));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

renderer.domElement.style.cssText =
  "position:fixed;inset:0;width:100%;height:100%;display:block;touch-action:none;";

document.body.appendChild(renderer.domElement);

/* LOADING SCREEN */

const loading = document.createElement("div");
loading.style.cssText = `
position:fixed;inset:0;z-index:100;
display:flex;align-items:center;justify-content:center;
flex-direction:column;gap:12px;
background:#182a25;color:white;
font-family:Arial,sans-serif;
`;
loading.innerHTML = `
<div style="font-size:28px;font-weight:900;letter-spacing:3px">MAYUSH</div>
<div style="font-size:13px;letter-spacing:2px">LOADING NAYABASTI...</div>
<div style="width:180px;height:4px;background:#ffffff35;border-radius:5px;overflow:hidden">
<div id="loadbar" style="width:5%;height:100%;background:#e5c16c"></div>
</div>
<div id="loadtext" style="font-size:11px;color:#cbd8d0">Preparing 3D world</div>
`;
document.body.appendChild(loading);

function loadingStatus(message, progress) {
  const t = document.getElementById("loadtext");
  const b = document.getElementById("loadbar");
  if (t) t.textContent = message;
  if (b) b.style.width = progress + "%";
}

/* LIGHTING */

const hemi = new THREE.HemisphereLight(
  0xdcecff,
  0x596047,
  1.6
);
scene.add(hemi);

const sun = new THREE.DirectionalLight(0xffe5bd, 2.5);
sun.position.set(-45, 85, 45);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.left = -100;
sun.shadow.camera.right = 100;
sun.shadow.camera.top = 100;
sun.shadow.camera.bottom = -100;
sun.shadow.camera.far = 220;
scene.add(sun);

/* MATERIALS */

function material(color, roughness = 1, metalness = 0) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness
  });
}

const MAT = {
  grass: material(0x627d43),
  grassLight: material(0x829653),
  dirt: material(0x98764e),
  sand: material(0xb69b70),
  road: material(0x353b3d, 0.95),
  asphalt: material(0x484b4a),
  concrete: material(0x858782),
  water: material(0x477f8d, 0.25),
  tree: material(0x59432c),
  leaves: material(0x315c32),
  leaves2: material(0x486d37),
  metal: material(0x60686a, 0.45, 0.4),
  white: material(0xe5e1d5),
  yellow: material(0xd5ad4c),
  red: material(0x9e3829),
  black: material(0x191a19)
};

/* BASIC OBJECTS */

function box(parent, x, y, z, sx, sy, sz, mat, shadow = true) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(sx, sy, sz),
    mat
  );

  mesh.position.set(x, y, z);
  mesh.castShadow = shadow;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function cylinder(parent, x, y, z, radiusTop, radiusBottom, height, mat, segments = 12) {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(
      radiusTop,
      radiusBottom,
      height,
      segments
    ),
    mat
  );

  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  parent.add(mesh);
  return mesh;
}

/* TERRAIN */

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(500, 500, 1, 1),
  MAT.grass
);

ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.08;
ground.receiveShadow = true;
scene.add(ground);

/* MAIN ASPHALT ROAD */

box(scene, 0, 0, 0, 12, 0.16, 420, MAT.road, false);

box(scene, -6.5, 0.02, 0, 1, 0.12, 420, MAT.sand, false);
box(scene, 6.5, 0.02, 0, 1, 0.12, 420, MAT.sand, false);

for (let z = -200; z < 210; z += 14) {
  box(scene, 0, 0.09, z, 0.14, 0.025, 4.2, MAT.yellow, false);
}

/* SIDEWALKS AND VILLAGE ROADS */

box(scene, -11, 0, -35, 85, 0.13, 6, MAT.dirt, false);
box(scene, 40, 0, 60, 85, 0.13, 6, MAT.dirt, false);
box(scene, -45, 0, 125, 70, 0.13, 6, MAT.dirt, false);
box(scene, 38, 0, -125, 75, 0.13, 6, MAT.dirt, false);

/* DRAINAGE */

for (const side of [-1, 1]) {
  box(scene, side * 8.2, -0.01, 0, 0.5, 0.28, 420, MAT.concrete, false);
  box(scene, side * 8.2, 0.08, 0, 0.3, 0.08, 420, MAT.water, false);
}

/* FIELDS */

function makeField(x, z, width, depth) {
  box(
    scene,
    x,
    0.005,
    z,
    width,
    0.08,
    depth,
    MAT.grassLight,
    false
  );

  const rows = new THREE.Group();

  const cropMaterial = material(0x8d9c43);

  const cropGeometry = new THREE.ConeGeometry(0.13, 0.8, 5);
  const count = Math.floor(width / 3) * Math.floor(depth / 4);

  const crops = new THREE.InstancedMesh(
    cropGeometry,
    cropMaterial,
    count
  );

  const dummy = new THREE.Object3D();
  let index = 0;

  for (let px = -width / 2 + 2; px < width / 2 - 1; px += 3) {
    for (let pz = -depth / 2 + 2; pz < depth / 2 - 1; pz += 4) {
      dummy.position.set(
        x + px,
        0.4,
        z + pz
      );

      dummy.rotation.y = Math.random() * 0.5;
      dummy.scale.set(
        0.7 + Math.random() * 0.4,
        0.7 + Math.random() * 0.7,
        0.7 + Math.random() * 0.4
      );

      dummy.updateMatrix();
      crops.setMatrixAt(index++, dummy.matrix);
    }
  }

  crops.instanceMatrix.needsUpdate = true;
  crops.castShadow = false;
  rows.add(crops);
  scene.add(rows);

  for (const side of [-1, 1]) {
    box(
      scene,
      x + side * width / 2,
      0.12,
      z,
      0.45,
      0.25,
      depth,
      MAT.dirt,
      false
    );

    box(
      scene,
      x,
      0.12,
      z + side * depth / 2,
      width,
      0.25,
      0.45,
      MAT.dirt,
      false
    );
  }
}

makeField(-75, -95, 90, 90);
makeField(82, -80, 100, 100);
makeField(-82, 65, 95, 100);
makeField(83, 100, 100, 90);
makeField(-75, 180, 90, 45);

/* IRRIGATION CANALS */

function canal(x, z, width, length, rotation = 0) {
  const group = new THREE.Group();

  box(group, 0, 0.02, 0, width, 0.12, length, MAT.water, false);

  for (const side of [-1, 1]) {
    box(
      group,
      side * (width / 2 + 0.3),
      0.03,
      0,
      0.55,
      0.32,
      length,
      MAT.dirt,
      false
    );
  }

  group.position.set(x, 0, z);
  group.rotation.y = rotation;
  scene.add(group);
}

canal(-125, 0, 2.5, 360);
canal(130, 20, 2.5, 350);
canal(0, -165, 2.2, 250, Math.PI / 2);

/* PONDS */

function pond(x, z, rx, rz) {
  const water = new THREE.Mesh(
    new THREE.CircleGeometry(1, 48),
    MAT.water
  );

  water.rotation.x = -Math.PI / 2;
  water.scale.set(rx, rz, 1);
  water.position.set(x, 0.04, z);
  scene.add(water);

  const edge = new THREE.Mesh(
    new THREE.RingGeometry(0.94, 1.12, 48),
    MAT.sand
  );

  edge.rotation.x = -Math.PI / 2;
  edge.scale.set(rx, rz, 1);
  edge.position.set(x, 0.025, z);
  scene.add(edge);
}

pond(-48, -20, 12, 8);
pond(55, 145, 15, 10);

/* EXTERNAL 3D ASSETS */

const BASE =
  "https://raw.githubusercontent.com/trebeljahr/quaternius-showcase/main/public/glb/";

const ASSETS = {
  farmer: BASE + "modular_men/Farmer.glb",
  casual: BASE + "modular_men/Casual.glb",
  worker: BASE + "modular_men/Worker.glb",
  house1: BASE + "buildings_pack_2/House1.glb",
  house2: BASE + "buildings_pack_2/House2.glb",
  building: BASE + "buildings_pack_2/Building2_Small.glb"
};

const loader = new GLTFLoader();
const assetCache = {};

function loadModel(url) {
  return new Promise((resolve, reject) => {
    loader.load(
      url,
      gltf => resolve(gltf),
      undefined,
      error => reject(error)
    );
  });
}

async function prepareAssets() {
  const names = Object.keys(ASSETS);

  for (let i = 0; i < names.length; i++) {
    const name = names[i];

    loadingStatus(
      "Loading " + name + " 3D model",
      10 + Math.round((i / names.length) * 75)
    );

    try {
      assetCache[name] = await loadModel(ASSETS[name]);
    } catch (error) {
      console.warn("3D model could not load:", name, error);
      assetCache[name] = null;
    }
  }
}

/* NORMALIZE 3D MODEL */

function makeAsset(name, targetHeight, targetWidth = null) {
  const source = assetCache[name];
  if (!source) return null;

  const model = SkeletonUtils.clone(source.scene);

  model.traverse(object => {
    if (object.isMesh) {
      object.castShadow = true;
      object.receiveShadow = true;

      if (object.material) {
        object.material.side = THREE.FrontSide;
      }
    }
  });

  let bounds = new THREE.Box3().setFromObject(model);
  const size = new THREE.Vector3();
  bounds.getSize(size);

  if (size.y <= 0) return null;

  let scale = targetHeight / size.y;

  if (targetWidth && size.x > 0) {
    scale = Math.min(scale, targetWidth / size.x);
  }

  model.scale.setScalar(scale);

  bounds = new THREE.Box3().setFromObject(model);

  const center = new THREE.Vector3();
  bounds.getCenter(center);

  model.position.x -= center.x;
  model.position.z -= center.z;
  model.position.y -= bounds.min.y;

  return model;
}

/* REAL 3D HOUSES */

function placeHouse(name, x, z, height, width, rotation = 0) {
  const model = makeAsset(name, height, width);

  if (!model) {
    console.warn("House model unavailable:", name);
    return;
  }

  model.position.x += x;
  model.position.z += z;
  model.rotation.y = rotation;
  scene.add(model);
}

function createVillageBuildings() {
  const houses = [
    ["house1", -23, -85, 9, 15],
    ["house2", 24, -105, 8, 14],
    ["house1", -25, -45, 8, 13],
    ["house2", 25, -15, 8, 14],
    ["house1", -26, 35, 8, 13],
    ["house2", 25, 75, 8, 14],
    ["house1", -25, 105, 8, 13],
    ["house2", 25, 145, 8, 14],
    ["house1", -25, 175, 8, 13],
    ["building", -42, -100, 7, 12],
    ["building", 43, -65, 7, 12],
    ["building", -45, 55, 7, 12],
    ["building", 45, 110, 7, 12]
  ];

  for (const h of houses) {
    placeHouse(h[0], h[1], h[2], h[3], h[4]);
  }
}

/* TREES */

function makeTree(x, z, scale = 1) {
  const group = new THREE.Group();

  cylinder(
    group,
    0,
    1.5 * scale,
    0,
    0.3 * scale,
    0.4 * scale,
    3 * scale,
    MAT.tree
  );

  const crownPositions = [
    [0, 3.4, 0],
    [-0.9, 3.1, 0.3],
    [0.8, 3.2, -0.3],
    [0.3, 4.1, 0.2],
    [-0.5, 4, -0.4]
  ];

  crownPositions.forEach((p, i) => {
    const crown = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.1 * scale, 2),
      i % 2 ? MAT.leaves : MAT.leaves2
    );

    crown.position.set(
      p[0] * scale,
      p[1] * scale,
      p[2] * scale
    );

    crown.scale.set(1.1, 0.8, 1);
    crown.castShadow = true;
    group.add(crown);
  });

  group.position.set(x, 0, z);
  scene.add(group);
}

for (let i = 0; i < 65; i++) {
  const x = (Math.random() - 0.5) * 180;
  const z = (Math.random() - 0.5) * 230;

  if (Math.abs(x) > 10) {
    makeTree(x, z, 0.8 + Math.random() * 0.8);
  }
}

/* BANANA TREES */

function bananaTree(x, z) {
  const group = new THREE.Group();

  cylinder(group, 0, 1.3, 0, 0.16, 0.2, 2.6, MAT.tree);

  for (let i = 0; i < 7; i++) {
    const leaf = new THREE.Mesh(
      new THREE.ConeGeometry(0.35, 3.6, 7),
      MAT.leaves
    );

    leaf.position.y = 2.6;
    leaf.rotation.z = Math.PI / 2.4;
    leaf.rotation.y = i * 0.9;
    leaf.scale.set(0.55, 1, 0.25);
    group.add(leaf);
  }

  group.position.set(x, 0, z);
  scene.add(group);
}

for (let i = 0; i < 15; i++) {
  bananaTree(
    15 + Math.random() * 45,
    -90 + Math.random() * 180
  );
}

/* ELECTRIC POLES */

function electricPole(x, z) {
  cylinder(scene, x, 4, z, 0.13, 0.18, 8, MAT.concrete);

  box(scene, x, 7.5, z, 2.8, 0.15, 0.15, MAT.tree);

  for (let i = -1; i <= 1; i++) {
    cylinder(
      scene,
      x + i * 1.1,
      7.8,
      z,
      0.07,
      0.07,
      0.4,
      MAT.metal
    );
  }
}

for (let z = -100; z <= 110; z += 35) {
  electricPole(-7, z);
  electricPole(7, z);
}

function wire(x1, z1, x2, z2) {
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(x1, 7.7, z1),
    new THREE.Vector3((x1 + x2) / 2, 7.1, (z1 + z2) / 2),
    new THREE.Vector3(x2, 7.7, z2)
  ]);

  const cable = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 16, 0.025, 5, false),
    MAT.black
  );

  scene.add(cable);
}

for (let z = -100; z < 110; z += 35) {
  wire(-7, z, -7, z + 35);
  wire(7, z, 7, z + 35);
}

/* TEA SHOP */

function teaShop(x, z) {
  const g = new THREE.Group();

  box(g, 0, 1.5, 0, 8, 3, material(0x9c6342));
  box(g, 0, 3.1, 0, 8.7, 0.25, material(0x5a3024));
  box(g, 0, 1.8, -3.05, 3.2, 1.3, MAT.tree);
  box(g, 0, 1.15, -3.5, 2.2, 0.15, MAT.tree);
  box(g, -2.7, 0.9, -3.05, 1.2, 1.8, MAT.black);

  g.position.set(x, 0, z);
  scene.add(g);
}

teaShop(-17, 18);

/* SCHOOL */

function school(x, z) {
  const g = new THREE.Group();

  box(g, 0, 2.2, 0, 18, 4.4, 10, MAT.white);
  box(g, 0, 4.5, 0, 19, 0.35, 11, MAT.red);

  for (let i = -2; i <= 2; i++) {
    box(g, i * 3.2, 2.6, -5.1, 2, 1.5, 0.15, material(0x4a849c));
  }

  box(g, 0, 1.2, -5.1, 3, 2.4, 0.15, MAT.tree);

  g.position.set(x, 0, z);
  scene.add(g);
}

school(35, -30);

/* HAYSTACKS */

function haystack(x, z) {
  const hay = new THREE.Mesh(
    new THREE.ConeGeometry(1.1, 1.7, 12),
    material(0xb69a55)
  );

  hay.position.set(x, 0.85, z);
  hay.castShadow = true;
  scene.add(hay);
}

haystack(-34, -78);
haystack(37, 82);
haystack(-38, 115);

/* CLAY POTS */

function clayPot(x, z) {
  const pot = new THREE.Mesh(
    new THREE.SphereGeometry(0.35, 16, 12),
    material(0x985536)
  );

  pot.position.set(x, 0.34, z);
  pot.scale.set(1, 1.1, 1);
  pot.castShadow = true;
  scene.add(pot);
}

clayPot(-17, -79);
clayPot(30, -99);
clayPot(-18, 41);
clayPot(31, 71);

/* PLAYER */

const player = new THREE.Group();
scene.add(player);

let playerModelReady = false;

function addCharacterModel(name, root, height) {
  const model = makeAsset(name, height);

  if (!model) return false;

  root.add(model);
  return true;
}

/* VILLAGERS */

const villagers = [];

function addVillager(name, x, z, height = 1.9) {
  const npc = new THREE.Group();

  const loaded = addCharacterModel(name, npc, height);

  if (!loaded) return;

  npc.position.set(x, 0, z);
  scene.add(npc);

  villagers.push({
    mesh: npc,
    x,
    z,
    phase: Math.random() * 10
  });
}

/* VEHICLE WHEELS */

function makeWheel(parent, x, y, z, radius) {
  const wheel = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, 0.22, 18),
    MAT.black
  );

  wheel.rotation.z = Math.PI / 2;
  wheel.position.set(x, y, z);
  wheel.castShadow = true;
  parent.add(wheel);

  const hub = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.35, radius * 0.35, 0.24, 12),
    MAT.metal
  );

  hub.rotation.z = Math.PI / 2;
  hub.position.copy(wheel.position);
  parent.add(hub);

  return wheel;
}

/* TRACTOR */

const traffic = [];

function makeTractor(x, z, direction = 1) {
  const g = new THREE.Group();
  const wheels = [];

  box(g, 0, 0.8, 0, 1.3, 0.35, 2.5, MAT.tree);
  box(g, 0, 1.25, 0.65, 1.2, 0.7, 1.1, material(0x347744));
  box(g, 0, 1.35, -0.55, 0.6, 0.2, 0.55, MAT.black);

  cylinder(g, -0.35, 1.9, 0.8, 0.06, 0.07, 0.8, MAT.metal);

  for (const side of [-1, 1]) {
    wheels.push(makeWheel(g, side * 0.75, 0.55, -0.75, 0.55));
    wheels.push(makeWheel(g, side * 0.75, 0.4, 0.95, 0.37));
  }

  const trailer = new THREE.Group();

  box(trailer, 0, 0.9, 0, 1.8, 0.25, 2.5, MAT.red);

  for (const side of [-1, 1]) {
    box(trailer, side * 0.85, 1.4, 0, 0.12, 0.8, 2.5, MAT.red);
    wheels.push(makeWheel(trailer, side * 0.95, 0.45, 0, 0.34));
  }

  trailer.position.z = -2.4;
  g.add(trailer);

  g.position.set(x, 0, z);
  g.rotation.y = direction > 0 ? 0 : Math.PI;
  scene.add(g);

  traffic.push({
    mesh: g,
    wheels,
    speed: direction * 3.2
  });
}

/* MOTORCYCLE */

function makeMotorcycle(x, z, direction = 1) {
  const g = new THREE.Group();
  const wheels = [];

  box(g, 0, 0.8, 0, 0.25, 0.25, 1.5, MAT.metal);
  box(g, 0, 1.1, 0.2, 0.7, 0.4, 0.65, MAT.red);
  box(g, 0, 1.15, -0.45, 0.5, 0.14, 0.7, MAT.black);

  wheels.push(makeWheel(g, 0, 0.42, 0.8, 0.4));
  wheels.push(makeWheel(g, 0, 0.42, -0.8, 0.4));

  box(g, 0, 1.45, 0.75, 1, 0.08, 0.08, MAT.metal);

  g.position.set(x, 0, z);
  g.rotation.y = direction > 0 ? 0 : Math.PI;
  scene.add(g);

  traffic.push({
    mesh: g,
    wheels,
    speed: direction * 6
  });
}

makeTractor(-2.5, -155, 1);
makeMotorcycle(2.5, 145, -1);
makeMotorcycle(-2.5, -65, 1);

/* BIRDS */

const birds = [];

for (let i = 0; i < 8; i++) {
  const bird = new THREE.Group();

  for (const side of [-1, 1]) {
    const wing = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 0.05, 0.25),
      MAT.black
    );

    wing.position.x = side * 0.4;
    bird.add(wing);
  }

  bird.position.set(
    (Math.random() - 0.5) * 80,
    14 + Math.random() * 7,
    (Math.random() - 0.5) * 100
  );

  scene.add(bird);

  birds.push({
    mesh: bird,
    phase: Math.random() * 10,
    speed: 1.5 + Math.random()
  });
}

/* MOBILE UI */

const css = document.createElement("style");

css.textContent = `
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
#clock {
  position:absolute;
  top:15px;
  right:15px;
  color:white;
  font:bold 13px Arial;
  background:#0007;
  padding:8px 11px;
  border-radius:12px;
}
`;

document.head.appendChild(css);

const controls = document.createElement("div");
controls.id = "mobile-controls";

controls.innerHTML = `
<div id="game-label">NAYABASTI • TERAI VILLAGE</div>
<div id="clock">08:00</div>
<div id="joystick"><div id="stick"></div></div>
<button id="jump">JUMP</button>
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
    dx = dx / distance * max;
    dy = dy / distance * max;
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

let cameraYaw = 0;
let cameraPitch = 0.68;
const cameraDistance = 9.5;

let lookTouchId = null;
let lastTouchX = 0;
let lastTouchY = 0;

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

camera.position.set(0, 6, cameraDistance);
camera.lookAt(0, 1.2, 0);

/* NATIVE IPHONE CAMERA TOUCH */

window.addEventListener("touchstart", e => {
  if (lookTouchId !== null) return;

  const touch = Array.from(e.changedTouches).find(t => {
    const element = document.elementFromPoint(
      t.clientX,
      t.clientY
    );

    return element && !element.closest("#joystick, #jump");
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

/* DAY / NIGHT */

let worldTime = 0.34;
const dayDuration = 300;

function updateLighting(delta) {
  worldTime = (worldTime + delta / dayDuration) % 1;

  const hour = worldTime * 24;
  const angle = worldTime * Math.PI * 2 - Math.PI / 2;

  const daylight = THREE.MathUtils.clamp(
    Math.sin(angle) * 1.3 + 0.2,
    0.08,
    1
  );

  const sky = new THREE.Color(0x17263b).lerp(
    new THREE.Color(0x9bb8c2),
    daylight
  );

  scene.background.copy(sky);
  scene.fog.color.copy(sky);

  sun.position.set(
    Math.cos(angle) * 85,
    Math.max(8, Math.sin(angle) * 100),
    45
  );

  sun.intensity = 0.2 + daylight * 2.4;
  hemi.intensity = 0.35 + daylight * 1.35;

  const h = Math.floor(hour);
  const m = Math.floor((hour - h) * 60);

  document.getElementById("clock").textContent =
    String(h).padStart(2, "0") + ":" +
    String(m).padStart(2, "0");
}

/* ANIMATION LOOP */

let walkTime = 0;

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

    const direction = new THREE.Vector3()
      .addScaledVector(getCameraRight(), horizontal)
      .addScaledVector(getCameraForward(), -vertical)
      .normalize();

    player.position.addScaledVector(direction, 5.8 * delta);

    player.rotation.y = Math.atan2(
      direction.x,
      direction.z
    );

    walkTime += delta * 8;
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

  const horizontalDistance =
    cameraDistance * Math.cos(cameraPitch);

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
    player.position.y + 1.2,
    player.position.z
  );

  /* WORLD LIMIT */

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

  /* VILLAGER MOVEMENT */

  villagers.forEach(v => {
    v.mesh.position.y = Math.sin(
      elapsed * 2 + v.phase
    ) * 0.02;

    v.mesh.rotation.y = Math.sin(
      elapsed * 0.5 + v.phase
    ) * 0.15;
  });

  /* TRAFFIC */

  traffic.forEach(vehicle => {
    vehicle.mesh.position.z += vehicle.speed * delta;

    if (vehicle.mesh.position.z > 215) {
      vehicle.mesh.position.z = -215;
    }

    if (vehicle.mesh.position.z < -215) {
      vehicle.mesh.position.z = 215;
    }

    vehicle.wheels.forEach(wheel => {
      wheel.rotation.x += vehicle.speed * delta * 1.7;
    });
  });

  /* BIRDS */

  birds.forEach(bird => {
    bird.mesh.position.x += bird.speed * delta;

    bird.mesh.position.y +=
      Math.sin(elapsed * 2 + bird.phase) * delta * 0.3;

    if (bird.mesh.position.x > 100) {
      bird.mesh.position.x = -100;
    }

    bird.mesh.children.forEach((wing, index) => {
      wing.rotation.z =
        (index === 0 ? -1 : 1) *
        Math.sin(elapsed * 8 + bird.phase) * 0.45;
    });
  });

  updateLighting(delta);

  renderer.render(scene, camera);
}

/* RESIZE */

window.addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.25));
});

/* START AFTER ASSET LOADING */

async function startGame() {
  await prepareAssets();

  loadingStatus("Building Nayabasti village", 90);

  createVillageBuildings();

  addCharacterModel("farmer", player, 2.05);
  player.position.set(0, 0, 0);
  player.rotation.y = Math.PI;
  playerModelReady = true;

  addVillager("casual", 8, 15);
  addVillager("worker", -12, 30);
  addVillager("casual", 30, -20);
  addVillager("worker", -30, -25);
  addVillager("casual", 45, 65);

  loadingStatus("Starting game", 100);

  setTimeout(() => {
    loading.remove();
  }, 500);

  animate();
}

startGame().catch(error => {
  console.error("Game start error:", error);
  loadingStatus("Some 3D assets could not load. Check internet connection.", 100);
});
