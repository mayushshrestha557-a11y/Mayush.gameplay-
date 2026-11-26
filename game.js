
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { KTX2Loader } from "three/addons/loaders/KTX2Loader.js";
import * as SkeletonUtils from "three/addons/utils/SkeletonUtils.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";

/* =====================================================
   HAMRO BASTI
   Founder & Creator: Mayush Shrestha
   Real 3D Nepali Village Game
===================================================== */

document.documentElement.style.cssText =
  "margin:0;width:100%;height:100%;overflow:hidden";

document.body.style.cssText =
  "margin:0;width:100%;height:100%;overflow:hidden;background:#101b19;touch-action:none;user-select:none";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9ba9a8);
scene.fog = new THREE.Fog(0x9ba9a8, 120, 430);

const camera = new THREE.PerspectiveCamera(
  65, innerWidth / innerHeight, 0.1, 800
);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: "high-performance"
});

renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.domElement.style.cssText =
  "position:fixed;inset:0;width:100%;height:100%;display:block;touch-action:none";
document.body.appendChild(renderer.domElement);

/* =====================================================
   GAME STATE
===================================================== */

let gameStarted = false;
let loadingPromise = null;
let elapsed = 0;

let joystickSensitivity = 1;
let cameraSensitivity = 1;
let cameraYaw = 0;
let cameraPitch = 0.48;
let cameraDistance = 5.8;
let graphicsQuality = "high";

let moveX = 0;
let moveY = 0;
let jumpVelocity = 0;
let isJumping = false;

const clock = new THREE.Clock();
const roadNetwork = [];
const traffic = [];
const villagers = [];
const animals = [];
const birds = [];

let playerActor = null;
let dogActor = null;

/* =====================================================
   MATERIALS
===================================================== */

function mat(color, roughness = 0.9, metalness = 0) {
  return new THREE.MeshStandardMaterial({
    color, roughness, metalness
  });
}

const M = {
  grass: mat(0x647c43),
  field: mat(0x7e8845),
  dirt: mat(0x806044),
  road: mat(0x343638),
  rut: mat(0x59432f),
  water: mat(0x477f8c, 0.2),
  wood: mat(0x60442e),
  wall: mat(0xb9a17e),
  roof: mat(0x594234),
  stone: mat(0x777568)
};

function addMesh(parent, geometry, material, x = 0, y = 0, z = 0) {
  const object = new THREE.Mesh(geometry, material);
  object.position.set(x, y, z);
  object.castShadow = true;
  object.receiveShadow = true;
  parent.add(object);
  return object;
}

function addBox(parent, x, y, z, sx, sy, sz, material) {
  return addMesh(
    parent, new THREE.BoxGeometry(sx, sy, sz),
    material, x, y, z
  );
}

/* =====================================================
   LIGHTING
===================================================== */

scene.add(new THREE.HemisphereLight(0xe3edff, 0x62533c, 1.6));

const sun = new THREE.DirectionalLight(0xffe4bd, 2.5);
sun.position.set(-55, 95, 45);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);

Object.assign(sun.shadow.camera, {
  left: -150, right: 150,
  top: 150, bottom: -150,
  near: 1, far: 300
});

scene.add(sun);

const fillLight = new THREE.DirectionalLight(0xb8d5ff, 0.42);
fillLight.position.set(50, 35, -60);
scene.add(fillLight);

/* =====================================================
   TEXTURE GENERATOR
===================================================== */

function makeNoiseTexture(base, colors, amount = 7000) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;

  const ctx = canvas.getContext("2d");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < amount; i++) {
    ctx.globalAlpha = 0.08 + Math.random() * 0.25;
    ctx.fillStyle = colors[
      Math.floor(Math.random() * colors.length)
    ];
    ctx.beginPath();
    ctx.arc(
      Math.random() * 512,
      Math.random() * 512,
      0.4 + Math.random() * 2.4,
      0, Math.PI * 2
    );
    ctx.fill();
  }

  ctx.globalAlpha = 1;

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

const grassTexture = makeNoiseTexture("#617b42", [
  "#a1a65e", "#405c30", "#788b49", "#b1a36a"
]);

grassTexture.repeat.set(35, 35);
M.grass.map = grassTexture;
M.grass.needsUpdate = true;

const dirtTexture = makeNoiseTexture("#806044", [
  "#b18b5d", "#65452e", "#9c7953",
  "#c1a078", "#715137"
], 10000);

dirtTexture.repeat.set(2, 40);
M.dirt.map = dirtTexture;
M.dirt.needsUpdate = true;

const asphaltTexture = makeNoiseTexture("#343638", [
  "#454749", "#292b2d", "#555657", "#383a3c"
], 11000);

asphaltTexture.repeat.set(3, 35);

const asphaltMaterial = new THREE.MeshStandardMaterial({
  map: asphaltTexture,
  roughness: 0.94
});

const dirtRoadMaterial = new THREE.MeshStandardMaterial({
  map: dirtTexture,
  roughness: 1
});

/* =====================================================
   TERRAIN
===================================================== */

const ground = addMesh(
  scene,
  new THREE.PlaneGeometry(600, 600),
  M.grass,
  0, -0.12, 0
);
ground.rotation.x = -Math.PI / 2;

/* =====================================================
   ROAD SYSTEM
   4 DEVELOPED HIGHWAYS
   MANY INNER ROADS
   REALISTIC DIRT ROADS
===================================================== */

const roadLine = mat(0xe8dfbd);
const yellowLine = mat(0xe6c64e);
const curbMaterial = mat(0x777873);
const sidewalkMaterial = mat(0xaaa69a);
const drainMaterial = mat(0x393b38);
const gravelMaterial = mat(0x777064);

function roadPlane(x, z, width, length, material, rotation = 0, y = 0.04) {
  const road = addMesh(
    scene,
    new THREE.PlaneGeometry(width, length),
    material, x, y, z
  );
  road.rotation.x = -Math.PI / 2;
  road.rotation.z = rotation;
  return road;
}

function makeHighway(x, z, width, length, direction = "z") {
  const horizontal = direction === "x";
  const rotation = horizontal ? -Math.PI / 2 : 0;

  roadPlane(x, z, width, length, asphaltMaterial, rotation, 0.055);

  roadNetwork.push({
    type: "highway", x, z, width, length, direction
  });

  for (const side of [-1, 1]) {
    if (!horizontal) {
      addBox(scene, x + side * (width / 2 + 0.5), 0.015, z,
        1, 0.14, length, curbMaterial);

      addBox(scene, x + side * (width / 2 + 1.5), 0.02, z,
        1, 0.12, length, sidewalkMaterial);

      addBox(scene, x + side * (width / 2 + 2.2), 0.015, z,
        0.25, 0.1, length, drainMaterial);
    } else {
      addBox(scene, x, 0.015, z + side * (width / 2 + 0.5),
        length, 0.14, 1, curbMaterial);

      addBox(scene, x, 0.02, z + side * (width / 2 + 1.5),
        length, 0.12, 1, sidewalkMaterial);

      addBox(scene, x, 0.015, z + side * (width / 2 + 2.2),
        length, 0.1, 0.25, drainMaterial);
    }
  }

  if (!horizontal) {
    for (const side of [-1, 1]) {
      addBox(scene, x + side * (width / 2 - 0.35), 0.065, z,
        0.13, 0.018, length, roadLine);
    }

    for (let p = -length / 2 + 3; p < length / 2; p += 9) {
      addBox(scene, x, 0.067, z + p,
        0.18, 0.02, 4.5, yellowLine);
    }
  } else {
    for (const side of [-1, 1]) {
      addBox(scene, x, 0.065, z + side * (width / 2 - 0.35),
        length, 0.018, 0.13, roadLine);
    }

    for (let p = -length / 2 + 3; p < length / 2; p += 9) {
      addBox(scene, x + p, 0.067, z,
        4.5, 0.02, 0.18, yellowLine);
    }
  }
}

function makeVillageRoad(x, z, width, length, direction = "z") {
  const horizontal = direction === "x";
  const rotation = horizontal ? -Math.PI / 2 : 0;

  roadPlane(x, z, width, length, asphaltMaterial, rotation, 0.035);

  roadNetwork.push({
    type: "village", x, z, width, length, direction
  });
}

function makeDirtRoad(x, z, width, length, direction = "z") {
  const horizontal = direction === "x";
  const rotation = horizontal ? -Math.PI / 2 : 0;

  roadPlane(x, z, width, length, dirtRoadMaterial, rotation, 0.025);

  roadNetwork.push({
    type: "dirt", x, z, width, length, direction
  });

  for (const side of [-1, 1]) {
    if (!horizontal) {
      roadPlane(
        x + side * width * 0.23, z,
        0.48, length, M.rut, 0, 0.034
      );
    } else {
      roadPlane(
        x, z + side * width * 0.23,
        length, 0.48, M.rut, -Math.PI / 2, 0.034
      );
    }
  }

  const count = Math.floor(length * 0.5);

  for (let i = 0; i < count; i++) {
    const along = (Math.random() - 0.5) * length;
    const side = (Math.random() > 0.5 ? 1 : -1) *
      (width / 2 + Math.random() * 1.1);

    const px = horizontal ? x + along : x + side;
    const pz = horizontal ? z + side : z + along;

    const stone = addMesh(
      scene,
      new THREE.DodecahedronGeometry(
        0.06 + Math.random() * 0.12, 0
      ),
      gravelMaterial,
      px, 0.06, pz
    );
    stone.scale.y = 0.35;
  }
}

// Four main highways
makeHighway(-105, 0, 12, 440, "z");
makeHighway(-55, 0, 12, 440, "z");
makeHighway(55, 0, 12, 440, "z");
makeHighway(105, 0, 12, 440, "z");

// Main cross highways
makeHighway(0, -150, 11, 420, "x");
makeHighway(0, 150, 11, 420, "x");

// Inner streets
for (const x of [-135, -125, -85, -75, -35, -25, 0, 25, 35, 75, 85, 125, 135]) {
  makeVillageRoad(x, 0, 5.5, 390, "z");
}

for (const z of [-190, -170, -130, -110, -90, -65, -40, -15, 15, 40, 65, 90, 110, 130, 170, 190]) {
  makeVillageRoad(0, z, 5.5, 280, "x");
}

// More connecting streets
const connectingRoads = [
  [-155, -145, 100, 4.2, "x"],
  [-150, -95, 115, 4.2, "x"],
  [-145, -45, 110, 4.2, "x"],
  [-150, 45, 110, 4.2, "x"],
  [-145, 95, 110, 4.2, "x"],
  [-145, 145, 110, 4.2, "x"],
  [150, -145, 110, 4.2, "x"],
  [145, -95, 110, 4.2, "x"],
  [150, -45, 110, 4.2, "x"],
  [145, 45, 110, 4.2, "x"],
  [150, 95, 110, 4.2, "x"],
  [145, 145, 110, 4.2, "x"],
  [-100, -200, 4.2, 100, "z"],
  [-65, -200, 4.2, 100, "z"],
  [-15, -200, 4.2, 100, "z"],
  [15, 200, 4.2, 100, "z"],
  [65, 200, 4.2, 100, "z"],
  [100, 200, 4.2, 100, "z"]
];

for (const [x, z, width, length, direction] of connectingRoads) {
  makeVillageRoad(x, z, width, length, direction);
}

// Rural dirt roads
const dirtRoads = [
  [-180, -120, 5.2, 110, "z"],
  [-165, -30, 4.5, 90, "z"],
  [-175, 80, 5, 100, "z"],
  [-150, 180, 4.5, 90, "z"],
  [175, -130, 5, 110, "z"],
  [165, -30, 4.5, 100, "z"],
  [180, 75, 5, 100, "z"],
  [160, 175, 4.5, 90, "z"],
  [-190, -155, 4.5, 90, "x"],
  [-180, -75, 4.5, 100, "x"],
  [-175, 25, 4.5, 100, "x"],
  [-180, 125, 4.5, 100, "x"],
  [180, -155, 4.5, 90, "x"],
  [180, -75, 4.5, 100, "x"],
  [175, 25, 4.5, 100, "x"],
  [180, 125, 4.5, 100, "x"],
  [-45, -210, 4, 70, "z"],
  [45, -210, 4, 70, "z"],
  [-45, 210, 4, 70, "z"],
  [45, 210, 4, 70, "z"]
];

for (const road of dirtRoads) makeDirtRoad(...road);

/* =====================================================
   FIELDS, CANALS AND PONDS
===================================================== */

function makeField(x, z, width, depth) {
  addBox(scene, x, 0.005, z, width, 0.08, depth, M.field);

  const cropMaterial = mat(0x92954a);
  const geometry = new THREE.ConeGeometry(0.12, 0.75, 5);
  const total = Math.floor(width / 3) * Math.floor(depth / 4);

  const crops = new THREE.InstancedMesh(
    geometry, cropMaterial, total
  );

  const dummy = new THREE.Object3D();
  let index = 0;

  for (let px = -width / 2 + 2; px < width / 2 - 1; px += 3) {
    for (let pz = -depth / 2 + 2; pz < depth / 2 - 1; pz += 4) {
      dummy.position.set(x + px, 0.38, z + pz);
      dummy.rotation.y = Math.random();
      dummy.updateMatrix();
      crops.setMatrixAt(index++, dummy.matrix);
    }
  }

  crops.count = index;
  crops.instanceMatrix.needsUpdate = true;
  scene.add(crops);
}

makeField(-75, -95, 90, 90);
makeField(82, -80, 100, 100);
makeField(-82, 65, 95, 100);
makeField(83, 100, 100, 90);
makeField(-75, 180, 90, 45);

function makeCanal(x, z, width, length, rotation = 0) {
  const group = new THREE.Group();

  addBox(group, 0, 0.02, 0, width, 0.12, length, M.water);

  for (const side of [-1, 1]) {
    addBox(group, side * (width / 2 + 0.3), 0.02, 0,
      0.55, 0.32, length, M.dirt);
  }

  group.position.set(x, 0, z);
  group.rotation.y = rotation;
  scene.add(group);
}

makeCanal(-125, 0, 2.5, 360);
makeCanal(130, 20, 2.5, 350);
makeCanal(0, -165, 2.2, 250, Math.PI / 2);

function makePond(x, z, rx, rz) {
  const pond = addMesh(
    scene, new THREE.CircleGeometry(1, 48),
    M.water, x, 0.03, z
  );
  pond.rotation.x = -Math.PI / 2;
  pond.scale.set(rx, rz, 1);
}

makePond(-48, -20, 12, 8);
makePond(55, 145, 15, 10);

/* =====================================================
   HOUSES
===================================================== */

const plaster = mat(0xbca989);
const darkPlaster = mat(0x927d62);
const roofMaterial = mat(0x554238);
const wood = mat(0x493528);

function makeHouse(x, z, variant = 0) {
  const house = new THREE.Group();
  const wall = variant ? darkPlaster : plaster;

  addBox(house, 0, 2, 0, 10, 4, 8, wall);

  const leftRoof = addMesh(
    house, new THREE.BoxGeometry(5.8, 0.22, 9),
    roofMaterial, -2.55, 4.25, 0
  );
  leftRoof.rotation.z = -0.35;

  const rightRoof = addMesh(
    house, new THREE.BoxGeometry(5.8, 0.22, 9),
    roofMaterial, 2.55, 4.25, 0
  );
  rightRoof.rotation.z = 0.35;

  addBox(house, 0, 4.22, 4.52, 11, 0.18, 0.16, wood);
  addBox(house, 0, 1.05, 4.06, 1.45, 2.1, 0.13, wood);
  addBox(house, 0, 0.18, 5.2, 12, 0.25, 2.8, darkPlaster);

  for (const side of [-1, 1]) {
    addBox(house, side * 2.7, 2.55, 4.1,
      1.35, 1.1, 0.12, M.stone);

    addMesh(
      house, new THREE.CylinderGeometry(0.12, 0.15, 3.5, 12),
      wood, side * 5, 1.85, 5.7
    );
  }

  house.position.set(x, 0, z);
  scene.add(house);
}

const housePositions = [
  [-23, -85, 0], [24, -105, 1],
  [-25, -45, 1], [25, -15, 0],
  [-26, 35, 1], [25, 75, 0],
  [-25, 105, 1], [25, 145, 0],
  [-25, 175, 1], [-42, -100, 0],
  [43, -65, 1], [-45, 55, 0],
  [45, 110, 1],
  [-15, -125, 0], [15, -130, 1],
  [-40, -5, 0], [40, 15, 1],
  [-15, 55, 0], [15, 95, 1],
  [-40, 135, 0], [40, 175, 1]
];

for (const position of housePositions) makeHouse(...position);

/* =====================================================
   FENCES AND HAYSTACKS
===================================================== */

function makeFence(x, z, length, rotation = 0) {
  const group = new THREE.Group();
  const sections = Math.max(2, Math.floor(length / 2));

  for (let i = 0; i <= sections; i++) {
    const px = -length / 2 + length / sections * i;
    addBox(group, px, 0.6, 0, 0.14, 1.2, 0.14, M.wood);
  }

  for (const y of [0.38, 0.9]) {
    addBox(group, 0, y, 0, length, 0.12, 0.12, M.wood);
  }

  group.position.set(x, 0, z);
  group.rotation.y = rotation;
  scene.add(group);
}

makeFence(-39, -72, 16);
makeFence(-39, -72, 12, Math.PI / 2);
makeFence(38, -82, 17);
makeFence(38, -82, 12, Math.PI / 2);
makeFence(-42, 91, 18);
makeFence(39, 143, 16);

function makeHaystack(x, z, scale = 1) {
  const group = new THREE.Group();
  const hay = mat(0xa88a4d);

  addMesh(group,
    new THREE.CylinderGeometry(0.9 * scale, 1.1 * scale, 1.1 * scale, 24),
    hay, 0, 0.55 * scale, 0);

  addMesh(group,
    new THREE.ConeGeometry(1.05 * scale, 1.15 * scale, 24),
    hay, 0, 1.6 * scale, 0);

  group.position.set(x, 0, z);
  scene.add(group);
}

makeHaystack(-34, -91, 1.1);
makeHaystack(36, -42, 0.9);
makeHaystack(-39, 78, 1);
makeHaystack(38, 155, 1.1);

/* =====================================================
   ELECTRIC POLES
===================================================== */

const poleMaterial = mat(0x777b78);
const wireMaterial = mat(0x252b2c);

function makePole(x, z) {
  const pole = new THREE.Group();

  addMesh(pole,
    new THREE.CylinderGeometry(0.13, 0.2, 10, 12),
    poleMaterial, 0, 5, 0);

  addBox(pole, 0, 9.2, 0, 3.2, 0.16, 0.18, M.wood);
  pole.position.set(x, 0, z);
  scene.add(pole);
}

for (let z = -190; z <= 190; z += 38) {
  makePole(-10, z);
  makePole(10, z);
}

/* =====================================================
   GLB ASSETS
===================================================== */

const ASSET_PATH = "./assets/";

const ASSETS = {
  player: "man-base-character-rigged.glb",
  man: "casual-man.glb",
  childGirl: "Female_Child_01.glb",
  childBoy: "Male_Child_01.glb",
  elderlyWoman: "elderly-woman-rigged.glb",
  grandfather: "grandfather-with-cane.glb",
  cow: "dairy-cow.glb",
  bull: "bull.glb",
  goat: "goat.glb",
  dog: "german-shepherd.glb",
  tractor: "tractor.glb",
  car: "executive-sedan.glb",
  motorcycle: "street-motorcycle.glb",
  electricBike: "electric-bike.glb",
  mountainBike: "mountain-bike.glb",
  bmxBike: "bmx-bike.glb",
  tree: "village-elm-310fe2.glb",
  shop: "village-shopfront-d3088e.glb",
  well: "village-well-v1-lod0.glb",
  villageTile: "hex-tile-village.glb",
  guitar: "acoustic-guitar-v1-lod0.glb"
};

const loader = new GLTFLoader();
loader.setMeshoptDecoder(MeshoptDecoder);

const ktx2Loader = new KTX2Loader();
ktx2Loader.setTranscoderPath(
  "https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/libs/basis/"
);
ktx2Loader.detectSupport(renderer);
loader.setKTX2Loader(ktx2Loader);

const assetLibrary = {};

const REQUIRED_ASSETS = [
  "player", "man", "cow", "bull", "goat",
  "dog", "tractor", "car", "motorcycle",
  "tree", "shop", "well"
];

const OPTIONAL_ASSETS = [
  "childGirl", "childBoy", "elderlyWoman",
  "grandfather", "electricBike", "mountainBike",
  "bmxBike", "villageTile", "guitar"
];

async function loadOneAsset(name) {
  if (assetLibrary[name]) return assetLibrary[name];

  const file = ASSETS[name];
  if (!file) throw new Error("Asset mapping missing: " + name);

  const url = new URL(
    ASSET_PATH + encodeURIComponent(file),
    document.baseURI
  ).href;

  let gltf;

  try {
    gltf = await loader.loadAsync(url);
  } catch (error) {
    throw new Error(`${file} failed: ${error?.message || error}`);
  }

  if (!gltf?.scene) throw new Error("Empty GLB: " + file);

  gltf.scene.traverse(object => {
    if (!object.isMesh) return;
    object.castShadow = true;
    object.receiveShadow = true;

    const materials = Array.isArray(object.material)
      ? object.material : [object.material];

    for (const material of materials) {
      if (material?.map) {
        material.map.colorSpace = THREE.SRGBColorSpace;
      }
    }
  });

  assetLibrary[name] = gltf;
  return gltf;
}

/* =====================================================
   MODEL HELPERS
===================================================== */

function cloneModel(name) {
  const gltf = assetLibrary[name];
  if (!gltf?.scene) throw new Error("Model not loaded: " + name);
  return SkeletonUtils.clone(gltf.scene);
}

function fitModel(model, targetHeight) {
  model.updateMatrixWorld(true);

  const bounds = new THREE.Box3().setFromObject(model);
  const size = new THREE.Vector3();
  bounds.getSize(size);

  if (!Number.isFinite(size.y) || size.y <= 0) {
    throw new Error("Invalid model height: " + targetHeight);
  }

  model.scale.multiplyScalar(targetHeight / size.y);
  model.updateMatrixWorld(true);

  const fitted = new THREE.Box3().setFromObject(model);
  model.position.y -= fitted.min.y;
  return model;
}

function fitVehicle(model, targetLength) {
  model.updateMatrixWorld(true);

  const bounds = new THREE.Box3().setFromObject(model);
  const size = new THREE.Vector3();
  bounds.getSize(size);

  const longest = Math.max(size.x, size.z);
  if (!Number.isFinite(longest) || longest <= 0) {
    throw new Error("Invalid vehicle dimensions");
  }

  model.scale.multiplyScalar(targetLength / longest);
  model.updateMatrixWorld(true);

  const fitted = new THREE.Box3().setFromObject(model);
  model.position.y -= fitted.min.y;
  return model;
}

/* =====================================================
   ACTORS AND ANIMATIONS
===================================================== */

function makeActor(name, height, position, rotation = 0) {
  const model = fitModel(cloneModel(name), height);
  const root = new THREE.Group();
  root.add(model);

  root.position.set(position.x, position.y || 0, position.z);
  root.rotation.y = rotation;
  scene.add(root);

  const clips = assetLibrary[name].animations || [];
  const mixer = new THREE.AnimationMixer(model);
  const actions = {};

  function findAnimation(patterns) {
    return clips.find(clip =>
      patterns.some(pattern =>
        clip.name.toLowerCase().includes(pattern)
      )
    );
  }

  const animationMap = {
    idle: ["idle", "stand"],
    walk: ["walk"],
    run: ["run", "jog"],
    graze: ["graze", "eat"]
  };

  for (const [key, patterns] of Object.entries(animationMap)) {
    const clip = findAnimation(patterns);
    if (clip) actions[key] = mixer.clipAction(clip);
  }

  const first = actions.idle || actions.walk ||
    Object.values(actions)[0] || null;

  if (first) first.play();

  return {
    root, model, mixer, actions, current: first,

    changeAnimation(key) {
      const next = actions[key] || actions.idle || actions.walk;
      if (!next || next === this.current) return;

      next.reset();
      next.enabled = true;
      next.setEffectiveWeight(1);
      next.play();

      if (this.current) this.current.crossFadeTo(next, 0.2, true);
      this.current = next;
    }
  };
}

/* =====================================================
   VEHICLES
===================================================== */

function makeVehicle(name, length, position, rotation = 0) {
  const model = fitVehicle(cloneModel(name), length);
  const root = new THREE.Group();
  root.add(model);
  root.position.set(position.x, 0, position.z);
  root.rotation.y = rotation;
  scene.add(root);
  return root;
}

function createVehicles() {
  const tractor = makeVehicle(
    "tractor", 4.4, { x: -2.5, z: -155 }, Math.PI
  );
  traffic.push({ mesh: tractor, speed: 3.2 });

  const car = makeVehicle(
    "car", 5, { x: 2.5, z: -105 }, 0
  );
  traffic.push({ mesh: car, speed: -7 });

  const motorcycle = makeVehicle(
    "motorcycle", 2.1, { x: 2.5, z: 145 }, 0
  );
  traffic.push({ mesh: motorcycle, speed: -5.5 });

  const secondBike = makeVehicle(
    "motorcycle", 2.1, { x: -2.5, z: -65 }, Math.PI
  );
  traffic.push({ mesh: secondBike, speed: 5.5 });
}

/* =====================================================
   IMPORTED VILLAGE ASSETS
===================================================== */

function addImportedProp(name, position, height, rotation = 0) {
  if (!assetLibrary[name]) return null;

  const model = fitModel(cloneModel(name), height);
  model.position.x += position.x;
  model.position.z += position.z;
  model.rotation.y = rotation;
  scene.add(model);
  return model;
}

function createVillageAssets() {
  const trees = [
    [-17, -28], [18, 28], [-45, 95], [48, -90],
    [-75, -35], [72, 35], [-80, 145], [85, -150],
    [15, 180], [-15, -180]
  ];

  for (const [x, z] of trees) {
    addImportedProp("tree", { x, z }, 8 + Math.random() * 2);
  }

  addImportedProp("shop", { x: 13, z: -9 }, 5, Math.PI);
  addImportedProp("shop", { x: -13, z: 78 }, 5);
  addImportedProp("well", { x: -31, z: -55 }, 2.2);
  addImportedProp("well", { x: 34, z: 116 }, 2.2);
}

/* =====================================================
   PLAYER, VILLAGERS AND ANIMALS
===================================================== */

function createPeople() {
  playerActor = makeActor(
    "player", 1.75, { x: 0, y: 0, z: 0 }
  );

  const people = [
    ["man", 8, 15, 1.7],
    ["man", -12, 30, 1.7],
    ["man", 30, -20, 1.7],
    ["man", -30, -25, 1.7],
    ["childGirl", 45, 65, 1.25],
    ["childBoy", -42, 12, 1.25],
    ["elderlyWoman", 18, 92, 1.6],
    ["grandfather", -18, -115, 1.65]
  ];

  for (const [name, x, z, height] of people) {
    if (!assetLibrary[name]) continue;

    const actor = makeActor(name, height, { x, y: 0, z });
    villagers.push({ actor });
  }
}

function createAnimal(name, x, z, height) {
  const actor = makeActor(name, height, { x, y: 0, z });
  animals.push({ actor, phase: Math.random() * 8 });
}

function createAnimals() {
  createAnimal("cow", -17, -77, 1.45);
  createAnimal("cow", 31, -94, 1.4);
  createAnimal("bull", -33, -39, 1.5);
  createAnimal("bull", 34, 68, 1.5);
  createAnimal("goat", -18, 42, 0.75);
  createAnimal("goat", 30, 132, 0.75);
  createAnimal("goat", -39, 100, 0.75);

  dogActor = makeActor(
    "dog", 0.85, { x: 5, y: 0, z: 8 }
  );
}

/* =====================================================
   BIRDS
===================================================== */

function createBirds() {
  const birdMaterial = mat(0x373a35);

  for (let i = 0; i < 10; i++) {
    const bird = new THREE.Group();

    const body = addMesh(
      bird, new THREE.SphereGeometry(0.2, 12, 10),
      birdMaterial
    );
    body.scale.set(0.8, 0.7, 1.3);

    const wings = [];

    for (const side of [-1, 1]) {
      const pivot = new THREE.Group();
      pivot.position.set(side * 0.12, 0.05, 0);
      bird.add(pivot);

      const wing = addMesh(
        pivot, new THREE.SphereGeometry(0.3, 10, 8),
        birdMaterial, side * 0.3, 0, 0
      );
      wing.scale.set(1.6, 0.12, 0.55);
      wings.push({ pivot, side });
    }

    bird.position.set(
      (Math.random() - 0.5) * 85,
      13 + Math.random() * 9,
      (Math.random() - 0.5) * 110
    );

    scene.add(bird);
    birds.push({
      mesh: bird, wings,
      phase: Math.random() * 10,
      speed: 1.2 + Math.random() * 1.4
    });
  }
}

/* =====================================================
   GAME INTRO / MAIN MENU
===================================================== */

const menu = document.createElement("div");
menu.id = "mainMenu";

menu.style.cssText = `
position:fixed;inset:0;z-index:2000;
display:flex;align-items:center;justify-content:center;
flex-direction:column;text-align:center;
font-family:Arial,sans-serif;color:white;
background:
linear-gradient(180deg,rgba(8,20,15,.35),rgba(5,13,10,.95)),
url('https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1800&q=85')
center/cover no-repeat;
padding:20px;box-sizing:border-box;
`;

menu.innerHTML = `
<div style="
font-size:clamp(38px,8vw,76px);
font-weight:1000;letter-spacing:5px;
text-shadow:0 5px 22px #000;
color:#f4d58b;">
HAMRO BASTI
</div>

<div style="
font-size:13px;letter-spacing:5px;
margin-top:8px;color:#fff;">
A NEPALI VILLAGE OPEN WORLD
</div>

<div style="
width:min(430px,90vw);
margin-top:25px;padding:18px;
background:rgba(0,0,0,.55);
border:1px solid rgba(255,255,255,.25);
border-radius:14px;line-height:1.7;">
<div style="font-size:16px;font-weight:bold;color:#f4d58b">
CREATED & FOUNDED BY
</div>
<div style="font-size:23px;font-weight:900">
MAYUSH SHRESTHA
</div>
<div style="font-size:12px;color:#ddd;margin-top:8px">
Original game creator. Creator's rights and royalties
belong to Mayush Shrestha, subject to applicable
agreements and law.
</div>
</div>

<button id="startGameButton" style="
margin-top:25px;padding:16px 55px;
border:2px solid #f5d58b;border-radius:8px;
background:linear-gradient(135deg,#e9bd69,#a66d29);
color:#17120b;font-size:19px;font-weight:900;
letter-spacing:2px;">
START GAME
</button>

<button id="openSettingsButton" style="
margin-top:12px;padding:12px 38px;
border:1px solid white;border-radius:8px;
background:rgba(0,0,0,.55);color:white;
font-size:15px;font-weight:bold;">
SETTINGS
</button>

<div id="menuStatus" style="
margin-top:15px;font-size:12px;color:#eee;">
HAMRO BASTI • DEVELOPMENT BUILD
</div>
`;

document.body.appendChild(menu);

/* =====================================================
   SETTINGS PANEL
===================================================== */

const settings = document.createElement("div");
settings.style.cssText = `
position:fixed;inset:0;z-index:2500;
display:none;align-items:center;justify-content:center;
background:rgba(0,0,0,.78);
font-family:Arial,sans-serif;color:white;padding:18px;
`;

settings.innerHTML = `
<div style="
width:min(420px,95vw);max-height:90vh;overflow:auto;
padding:22px;background:#17231e;
border:1px solid #b99a61;border-radius:15px;
box-sizing:border-box;">
<h2 style="margin:0 0 20px;color:#f1ce85">
GAME SETTINGS
</h2>

<label>Joystick sensitivity</label>
<input id="joySensitivity" type="range" min="0.5" max="2"
step="0.1" value="1" style="width:100%;margin:12px 0 22px">

<label>Camera sensitivity</label>
<input id="camSensitivity" type="range" min="0.3" max="2.5"
step="0.1" value="1" style="width:100%;margin:12px 0 22px">

<label>Camera angle</label>
<select id="cameraAngle" style="
width:100%;padding:12px;margin:12px 0 22px;
background:#293a31;color:white;border:1px solid #9caa9f;">
<option value="close">Close third person</option>
<option value="normal" selected>Normal third person</option>
<option value="far">Far third person</option>
<option value="high">High angle</option>
</select>

<label>Graphics quality</label>
<select id="graphicsQuality" style="
width:100%;padding:12px;margin:12px 0 22px;
background:#293a31;color:white;border:1px solid #9caa9f;">
<option value="high">High</option>
<option value="medium">Medium</option>
<option value="low">Low — better performance</option>
</select>

<button id="saveSettingsButton" style="
width:100%;padding:13px;border:0;border-radius:8px;
background:#d9b46c;color:#17130b;font-weight:bold;">
SAVE SETTINGS
</button>

<button id="closeSettingsButton" style="
width:100%;padding:12px;margin-top:10px;
border:1px solid #aaa;border-radius:8px;
background:transparent;color:white;">
BACK
</button>
</div>
`;

document.body.appendChild(settings);

const startButton = document.getElementById("startGameButton");
const openSettingsButton = document.getElementById("openSettingsButton");
const closeSettingsButton = document.getElementById("closeSettingsButton");
const saveSettingsButton = document.getElementById("saveSettingsButton");

openSettingsButton.addEventListener("click", () => {
  settings.style.display = "flex";
});

closeSettingsButton.addEventListener("click", () => {
  settings.style.display = "none";
});

saveSettingsButton.addEventListener("click", () => {
  joystickSensitivity = Number(
    document.getElementById("joySensitivity").value
  );

  cameraSensitivity = Number(
    document.getElementById("camSensitivity").value
  );

  const angle = document.getElementById("cameraAngle").value;

  if (angle === "close") {
    cameraDistance = 4.3;
    cameraPitch = 0.42;
  } else if (angle === "normal") {
    cameraDistance = 5.8;
    cameraPitch = 0.48;
  } else if (angle === "far") {
    cameraDistance = 8;
    cameraPitch = 0.55;
  } else if (angle === "high") {
    cameraDistance = 7;
    cameraPitch = 0.85;
  }

  graphicsQuality = document.getElementById("graphicsQuality").value;

  if (graphicsQuality === "low") {
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 0.8));
    sun.castShadow = false;
  } else if (graphicsQuality === "medium") {
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1));
    sun.castShadow = false;
  } else {
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
    sun.castShadow = true;
  }

  settings.style.display = "none";
});

/* =====================================================
   IN-GAME HUD
===================================================== */

const hud = document.createElement("div");
hud.style.cssText = `
position:fixed;inset:0;z-index:100;
pointer-events:none;font-family:Arial,sans-serif;
display:none;
`;

hud.innerHTML = `
<div style="
position:absolute;top:14px;left:15px;
font-size:clamp(16px,3vw,24px);
font-weight:1000;letter-spacing:2px;
color:#f4d58b;text-shadow:0 2px 8px #000;">
HAMRO BASTI
<div style="font-size:8px;letter-spacing:3px;color:white">
NEPAL OPEN WORLD
</div>
</div>

<div id="miniMapFrame" style="
position:absolute;top:12px;right:12px;
width:150px;height:150px;
border:3px solid rgba(255,255,255,.9);
border-radius:12px;overflow:hidden;
background:rgba(17,30,23,.9);
box-shadow:0 3px 14px #000;">
<canvas id="miniMap" width="300" height="300"
style="width:100%;height:100%;display:block"></canvas>
<div style="
position:absolute;bottom:4px;left:0;right:0;
text-align:center;font-size:9px;color:white;
text-shadow:0 1px 4px #000;">
HAMRO BASTI MAP
</div>
</div>

<div style="
position:absolute;top:175px;right:18px;
font-size:10px;color:white;text-shadow:0 2px 5px black;">
N • VILLAGE
</div>
`;

document.body.appendChild(hud);

const mapCanvas = document.getElementById("miniMap");
const mapCtx = mapCanvas.getContext("2d");

/* =====================================================
   MINI MAP — GTA STYLE VILLAGE MAP
===================================================== */

function drawMiniMap() {
  if (!playerActor) return;

  const ctx = mapCtx;
  const w = mapCanvas.width;
  const h = mapCanvas.height;

  const player = playerActor.root.position;
  const scale = 0.72;

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#526b42";
  ctx.fillRect(0, 0, w, h);

  // Map follows player position
  function mapX(x) {
    return w / 2 + (x - player.x) * scale;
  }

  function mapY(z) {
    return h / 2 + (z - player.z) * scale;
  }

  // Fields
  ctx.fillStyle = "#788448";
  for (const [x, z, width, depth] of [
    [-75, -95, 90, 90],
    [82, -80, 100, 100],
    [-82, 65, 95, 100],
    [83, 100, 100, 90],
    [-75, 180, 90, 45]
  ]) {
    ctx.fillRect(
      mapX(x - width / 2),
      mapY(z - depth / 2),
      width * scale,
      depth * scale
    );
  }

  // Road network
  for (const road of roadNetwork) {
    const horizontal = road.direction === "x";

    ctx.beginPath();
    ctx.lineCap = "butt";
    ctx.lineWidth =
      road.type === "highway" ? road.width * scale :
      road.type === "village" ? road.width * scale :
      road.width * scale;

    ctx.strokeStyle =
      road.type === "highway" ? "#e1d7b8" :
      road.type === "village" ? "#a9a79a" :
      "#a47a50";

    if (horizontal) {
      ctx.moveTo(mapX(road.x - road.length / 2), mapY(road.z));
      ctx.lineTo(mapX(road.x + road.length / 2), mapY(road.z));
    } else {
      ctx.moveTo(mapX(road.x), mapY(road.z - road.length / 2));
      ctx.lineTo(mapX(road.x), mapY(road.z + road.length / 2));
    }

    ctx.stroke();
  }

  // Houses
  ctx.fillStyle = "#b68b62";
  for (const [x, z] of housePositions) {
    ctx.fillRect(mapX(x) - 3, mapY(z) - 3, 6, 6);
  }

  // Shops
  ctx.fillStyle = "#e6c96e";
  ctx.fillRect(mapX(13) - 4, mapY(-9) - 4, 8, 8);
  ctx.fillRect(mapX(-13) - 4, mapY(78) - 4, 8, 8);

  // Player arrow
  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.rotate(playerActor.root.rotation.y);

  ctx.beginPath();
  ctx.moveTo(0, -12);
  ctx.lineTo(8, 10);
  ctx.lineTo(0, 6);
  ctx.lineTo(-8, 10);
  ctx.closePath();

  ctx.fillStyle = "#ffdf56";
  ctx.strokeStyle = "#171717";
  ctx.lineWidth = 2;
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Map border glow
  ctx.strokeStyle = "rgba(255,255,255,.3)";
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, w - 2, h - 2);
}

/* =====================================================
   MOBILE CONTROLS
===================================================== */

const controls = document.createElement("div");
controls.style.cssText =
  "position:fixed;inset:0;z-index:120;pointer-events:none;display:none";
document.body.appendChild(controls);

// Joystick
const joystick = document.createElement("div");
joystick.style.cssText = `
position:absolute;left:25px;bottom:35px;
width:125px;height:125px;border-radius:50%;
background:rgba(20,25,25,.32);
border:2px solid rgba(255,255,255,.55);
pointer-events:auto;touch-action:none;
`;

const stick = document.createElement("div");
stick.style.cssText = `
position:absolute;width:52px;height:52px;
left:35px;top:35px;border-radius:50%;
background:rgba(255,255,255,.75);
border:2px solid white;
`;

joystick.appendChild(stick);
controls.appendChild(joystick);

let joyPointer = null;

function updateJoystick(event) {
  const rect = joystick.getBoundingClientRect();
  let dx = event.clientX - (rect.left + rect.width / 2);
  let dy = event.clientY - (rect.top + rect.height / 2);

  const max = 43;
  const distance = Math.hypot(dx, dy);

  if (distance > max) {
    dx = dx / distance * max;
    dy = dy / distance * max;
  }

  stick.style.left = `${35 + dx}px`;
  stick.style.top = `${35 + dy}px`;

  moveX = dx / max * joystickSensitivity;
  moveY = dy / max * joystickSensitivity;
}

joystick.addEventListener("pointerdown", event => {
  joyPointer = event.pointerId;
  joystick.setPointerCapture(event.pointerId);
  updateJoystick(event);
});

joystick.addEventListener("pointermove", event => {
  if (event.pointerId === joyPointer) updateJoystick(event);
});

function releaseJoystick(event) {
  if (event.pointerId !== joyPointer) return;

  joyPointer = null;
  moveX = 0;
  moveY = 0;
  stick.style.left = "35px";
  stick.style.top = "35px";
}

joystick.addEventListener("pointerup", releaseJoystick);
joystick.addEventListener("pointercancel", releaseJoystick);

// Jump button
const jumpButton = document.createElement("button");
jumpButton.textContent = "JUMP";
jumpButton.style.cssText = `
position:absolute;right:28px;bottom:48px;
width:75px;height:75px;border-radius:50%;
border:2px solid white;background:rgba(220,170,60,.78);
color:white;font-weight:bold;font-size:15px;
pointer-events:auto;touch-action:none;
`;

controls.appendChild(jumpButton);

function jump() {
  if (gameStarted && !isJumping) {
    jumpVelocity = 7.5;
    isJumping = true;
  }
}

jumpButton.addEventListener("pointerdown", event => {
  event.preventDefault();
  jump();
});

/* =====================================================
   CAMERA TOUCH CONTROL
===================================================== */

let lookTouchId = null;
let lastTouchX = 0;
let lastTouchY = 0;

window.addEventListener("touchstart", event => {
  if (!gameStarted || lookTouchId !== null) return;

  const touch = Array.from(event.changedTouches).find(item => {
    const element = document.elementFromPoint(
      item.clientX, item.clientY
    );
    return element && !element.closest(
      "#mainMenu,#miniMapFrame,button,#joystick"
    );
  });

  if (!touch) return;

  lookTouchId = touch.identifier;
  lastTouchX = touch.clientX;
  lastTouchY = touch.clientY;
}, { capture: true, passive: false });

window.addEventListener("touchmove", event => {
  if (!gameStarted || lookTouchId === null) return;

  const touch = Array.from(event.touches).find(
    item => item.identifier === lookTouchId
  );

  if (!touch) return;

  const dx = touch.clientX - lastTouchX;
  const dy = touch.clientY - lastTouchY;

  lastTouchX = touch.clientX;
  lastTouchY = touch.clientY;

  cameraYaw -= dx * 0.006 * cameraSensitivity;

  cameraPitch = THREE.MathUtils.clamp(
    cameraPitch + dy * 0.005 * cameraSensitivity,
    0.15, 1.25
  );

  event.preventDefault();
}, { capture: true, passive: false });

function endCameraLook(event) {
  if (
    Array.from(event.changedTouches).some(
      touch => touch.identifier === lookTouchId
    )
  ) {
    lookTouchId = null;
  }
}

window.addEventListener("touchend", endCameraLook);
window.addEventListener("touchcancel", endCameraLook);

/* =====================================================
   LOADING SCREEN
===================================================== */

const loading = document.createElement("div");
loading.style.cssText = `
position:fixed;inset:0;z-index:3000;
background:#142019;color:white;
display:none;align-items:center;justify-content:center;
flex-direction:column;font:14px Arial;gap:14px;
padding:25px;text-align:center;
`;

loading.innerHTML = `
<div style="font-size:30px;font-weight:900;letter-spacing:4px">
HAMRO BASTI
</div>
<div id="loadText">LOADING REAL 3D ASSETS...</div>
<div style="width:230px;height:7px;background:#4b554e;border-radius:8px;overflow:hidden">
<div id="loadBar" style="width:2%;height:7px;background:#d8b46d"></div>
</div>
<div id="loadError" style="max-width:310px;line-height:1.5;color:#ffb6a7"></div>
<button id="retryButton" style="
display:none;padding:12px 28px;border:0;border-radius:8px;
background:#d8b46d;color:#171717;font-weight:bold">
RETRY DOWNLOAD
</button>
`;

document.body.appendChild(loading);

const loadText = document.getElementById("loadText");
const loadBar = document.getElementById("loadBar");
const loadError = document.getElementById("loadError");
const retryButton = document.getElementById("retryButton");

function status(message, progress) {
  loadText.textContent = message;
  loadBar.style.width = `${progress}%`;
}

function showAssetError(error) {
  loadText.textContent = "REAL 3D ASSET LOAD FAILED";
  loadError.textContent = String(error?.message || error);
  loadBar.style.width = "0%";
  retryButton.style.display = "block";
}

/* =====================================================
   LOAD ALL ASSETS
===================================================== */

async function loadAssets() {
  let loaded = 0;

  for (const name of REQUIRED_ASSETS) {
    status(`LOADING ${name.toUpperCase()}...`,
      5 + loaded / REQUIRED_ASSETS.length * 68);

    await loadOneAsset(name);
    loaded++;
  }

  status("LOADING OPTIONAL VILLAGE ASSETS...", 76);

  for (const name of OPTIONAL_ASSETS) {
    try {
      await loadOneAsset(name);
    } catch (error) {
      console.warn("Optional asset skipped:", name, error);
    }
  }
}

/* =====================================================
   GAME LOOP
===================================================== */

function animate() {
  requestAnimationFrame(animate);

  if (!gameStarted || !playerActor) return;

  const dt = Math.min(clock.getDelta(), 0.04);
  elapsed += dt;

  // Player movement
  const forward = -moveY;
  const side = moveX;

  const moving = Math.hypot(forward, side) > 0.08;

  if (moving) {
    const dx =
      side * Math.cos(cameraYaw) -
      forward * Math.sin(cameraYaw);

    const dz =
      -side * Math.sin(cameraYaw) -
      forward * Math.cos(cameraYaw);

    const length = Math.hypot(dx, dz) || 1;

    playerActor.root.position.x += dx / length * 5 * dt;
    playerActor.root.position.z += dz / length * 5 * dt;

    playerActor.root.rotation.y = Math.atan2(
      dx / length, dz / length
    );

    playerActor.changeAnimation(
      Math.hypot(moveX, moveY) > 0.75 ? "run" : "walk"
    );
  } else {
    playerActor.changeAnimation("idle");
  }

  // Jump physics
  if (isJumping) {
    playerActor.root.position.y += jumpVelocity * dt;
    jumpVelocity -= 18 * dt;

    if (playerActor.root.position.y <= 0) {
      playerActor.root.position.y = 0;
      jumpVelocity = 0;
      isJumping = false;
    }
  }

  playerActor.mixer.update(dt);

  // Villagers
  for (const villager of villagers) {
    villager.actor.mixer.update(dt);
    villager.actor.changeAnimation("idle");
  }

  // Vehicle traffic
  for (const vehicle of traffic) {
    vehicle.mesh.position.z += vehicle.speed * dt;

    if (vehicle.mesh.position.z > 220) {
      vehicle.mesh.position.z = -220;
    }

    if (vehicle.mesh.position.z < -220) {
      vehicle.mesh.position.z = 220;
    }
  }

  // Animals
  for (const animal of animals) {
    animal.actor.mixer.update(dt);

    if (
      animal.actor.actions.graze &&
      Math.sin(elapsed * 0.15 + animal.phase) > 0.7
    ) {
      animal.actor.changeAnimation("graze");
    } else {
      animal.actor.changeAnimation("idle");
    }
  }

  // Dog follows player
  if (dogActor) {
    dogActor.mixer.update(dt);

    const playerPosition = playerActor.root.position;
    const dogPosition = dogActor.root.position;
    const distance = dogPosition.distanceTo(playerPosition);

    if (distance > 3.5) {
      const direction = new THREE.Vector3()
        .subVectors(playerPosition, dogPosition)
        .normalize();

      dogPosition.x += direction.x * 2.2 * dt;
      dogPosition.z += direction.z * 2.2 * dt;

      dogActor.root.rotation.y = Math.atan2(
        direction.x, direction.z
      );

      dogActor.changeAnimation("walk");
    } else {
      dogActor.changeAnimation("idle");
    }
  }

  // Birds
  for (const bird of birds) {
    bird.mesh.position.x += bird.speed * dt;
    bird.mesh.position.y +=
      Math.sin(elapsed * 2 + bird.phase) * dt * 0.25;
    bird.mesh.position.z +=
      Math.cos(elapsed + bird.phase) * dt * 0.35;

    if (bird.mesh.position.x > 100) {
      bird.mesh.position.x = -100;
    }

    for (const wing of bird.wings) {
      wing.pivot.rotation.z =
        wing.side *
        Math.sin(elapsed * 9 + bird.phase) * 0.72;
    }
  }

  // Third-person camera
  const horizontalDistance =
    cameraDistance * Math.cos(cameraPitch);

  const cameraTarget = new THREE.Vector3(
    playerActor.root.position.x +
      Math.sin(cameraYaw) * horizontalDistance,

    playerActor.root.position.y +
      cameraDistance * Math.sin(cameraPitch),

    playerActor.root.position.z +
      Math.cos(cameraYaw) * horizontalDistance
  );

  camera.position.lerp(
    cameraTarget,
    1 - Math.exp(-7 * dt)
  );

  camera.lookAt(
    playerActor.root.position.x,
    playerActor.root.position.y + 1.2,
    playerActor.root.position.z
  );

  drawMiniMap();
  renderer.render(scene, camera);
}

/* =====================================================
   START GAME
===================================================== */

async function startGame() {
  if (loadingPromise || gameStarted) return;

  loadingPromise = (async () => {
    loading.style.display = "flex";
    retryButton.style.display = "none";
    loadError.textContent = "";

    try {
      status("LOADING HAMRO BASTI...", 3);

      await loadAssets();

      status("BUILDING VILLAGE...", 82);

      createVillageAssets();
      createPeople();
      createVehicles();
      createAnimals();
      createBirds();

      status("PREPARING GAME...", 96);

      camera.position.set(0, 7, 12);
      camera.lookAt(0, 1, 0);

      menu.style.display = "none";
      loading.style.display = "none";
      hud.style.display = "block";
      controls.style.display = "block";

      gameStarted = true;
      clock.start();
      animate();

      console.log("HAMRO BASTI — GAME STARTED");
      console.log("Founder & Creator: Mayush Shrestha");

    } catch (error) {
      gameStarted = false;
      showAssetError(error);
      console.error("HAMRO BASTI ASSET ERROR:", error);
    } finally {
      loadingPromise = null;
    }
  })();

  return loadingPromise;
}

startButton.addEventListener("click", startGame);
retryButton.addEventListener("click", startGame);

/* =====================================================
   RESIZE
===================================================== */

window.addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(innerWidth, innerHeight);

  renderer.setPixelRatio(
    Math.min(
      devicePixelRatio || 1,
      graphicsQuality === "low" ? 0.8 :
      graphicsQuality === "medium" ? 1 : 1.5
    )
  );
});
