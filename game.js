import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { KTX2Loader } from "three/addons/loaders/KTX2Loader.js";
import * as SkeletonUtils from "three/addons/utils/SkeletonUtils.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";

/* ==========================================
   MAYUSH GAMEPLAY — NAYABASTI
   REAL GLB ASSETS — NO CARTOON FALLBACK
========================================== */

document.documentElement.style.cssText =
  "margin:0;width:100%;height:100%;overflow:hidden";

document.body.style.cssText =
  "margin:0;width:100%;height:100%;overflow:hidden;background:#9ba9a8;touch-action:none;user-select:none";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9ba9a8);
scene.fog = new THREE.Fog(0x9ba9a8, 100, 390);

const camera = new THREE.PerspectiveCamera(
  65,
  innerWidth / innerHeight,
  0.1,
  700
);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: "high-performance"
});

renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.25));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

renderer.domElement.style.cssText =
  "position:fixed;inset:0;width:100%;height:100%;display:block;touch-action:none";

document.body.appendChild(renderer.domElement);

/* ==========================================
   LOADING SCREEN
========================================== */

const loading = document.createElement("div");

loading.style.cssText = `
position:fixed;
inset:0;
z-index:1000;
background:#142019;
color:white;
display:flex;
align-items:center;
justify-content:center;
flex-direction:column;
font:14px Arial;
gap:14px;
padding:25px;
text-align:center;
`;

loading.innerHTML = `
<div style="font-size:30px;font-weight:900;letter-spacing:4px">MAYUSH</div>
<div id="loadtext">LOADING REAL 3D ASSETS...</div>
<div style="width:230px;height:7px;background:#4b554e;border-radius:8px;overflow:hidden">
  <div id="loadbar" style="width:2%;height:7px;background:#d8b46d"></div>
</div>
<div id="loaderror" style="max-width:310px;line-height:1.5;color:#ffb6a7"></div>
<button id="retry" style="
display:none;padding:12px 28px;border:0;border-radius:8px;
background:#d8b46d;color:#171717;font-weight:bold">
RETRY DOWNLOAD
</button>
`;

document.body.appendChild(loading);

const loadText = document.getElementById("loadtext");
const loadBar = document.getElementById("loadbar");
const loadError = document.getElementById("loaderror");
const retryButton = document.getElementById("retry");

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

let gameStarted = false;

/* ==========================================
   LIGHTING
========================================== */

scene.add(
  new THREE.HemisphereLight(0xe3edff, 0x62533c, 1.5)
);

const sun = new THREE.DirectionalLight(0xffe4bd, 2.5);

sun.position.set(-55, 95, 45);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);

Object.assign(sun.shadow.camera, {
  left: -110,
  right: 110,
  top: 110,
  bottom: -110,
  near: 1,
  far: 250
});

sun.shadow.bias = -0.0002;
scene.add(sun);

const fillLight = new THREE.DirectionalLight(0xb8d5ff, 0.42);
fillLight.position.set(50, 35, -60);
scene.add(fillLight);

/* ==========================================
   MATERIALS
========================================== */

function mat(color, roughness = 0.9, metalness = 0) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness
  });
}

const M = {
  grass: mat(0x647c43),
  field: mat(0x7e8845),
  dirt: mat(0x806044),
  road: mat(0x8c6b4d),
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
    parent,
    new THREE.BoxGeometry(sx, sy, sz),
    material,
    x, y, z
  );
}

/* ==========================================
   GROUND TEXTURES
========================================== */

function makeNoiseTexture(base, colors, amount = 6500) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;

  const ctx = canvas.getContext("2d");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < amount; i++) {
    ctx.globalAlpha = 0.08 + Math.random() * 0.25;
    ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];

    ctx.beginPath();
    ctx.arc(
      Math.random() * 512,
      Math.random() * 512,
      0.4 + Math.random() * 2.4,
      0,
      Math.PI * 2
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

const dirtTexture = makeNoiseTexture("#826044", [
  "#b18b5d", "#65452e", "#9c7953", "#c1a078"
]);

dirtTexture.repeat.set(2, 42);
M.road.map = dirtTexture;
M.road.color.set(0xffffff);
M.road.needsUpdate = true;

/* ==========================================
   TERRAIN AND ROADS
========================================== */

const ground = addMesh(
  scene,
  new THREE.PlaneGeometry(600, 600),
  M.grass,
  0, -0.12, 0
);

ground.rotation.x = -Math.PI / 2;

addBox(scene, 0, 0.005, 0, 12, 0.09, 440, M.road);

for (const x of [-2.65, 2.65]) {
  const rut = addMesh(
    scene,
    new THREE.PlaneGeometry(0.48, 440),
    M.rut,
    x, 0.055, 0
  );
  rut.rotation.x = -Math.PI / 2;
}

addBox(scene, -10, 0.005, -35, 90, 0.09, 6, M.road);
addBox(scene, 40, 0.005, 60, 90, 0.09, 6, M.road);
addBox(scene, -45, 0.005, 125, 75, 0.09, 6, M.road);
addBox(scene, 38, 0.005, -125, 75, 0.09, 6, M.road);

/* ==========================================
   FARM FIELDS
========================================== */

function makeField(x, z, width, depth) {
  addBox(scene, x, 0.005, z, width, 0.08, depth, M.field);

  const cropMaterial = mat(0x92954a);
  const cropGeometry = new THREE.ConeGeometry(0.12, 0.75, 5);

  const total =
    Math.floor(width / 3) * Math.floor(depth / 4);

  const crops = new THREE.InstancedMesh(
    cropGeometry,
    cropMaterial,
    total
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

/* ==========================================
   CANALS AND PONDS
========================================== */

function makeCanal(x, z, width, length, rotation = 0) {
  const group = new THREE.Group();

  addBox(group, 0, 0.02, 0, width, 0.12, length, M.water);

  for (const side of [-1, 1]) {
    addBox(
      group,
      side * (width / 2 + 0.3),
      0.02,
      0,
      0.55, 0.32, length,
      M.dirt
    );
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
    scene,
    new THREE.CircleGeometry(1, 48),
    M.water,
    x, 0.03, z
  );

  pond.rotation.x = -Math.PI / 2;
  pond.scale.set(rx, rz, 1);
}

makePond(-48, -20, 12, 8);
makePond(55, 145, 15, 10);

/* ==========================================
   NEPALI VILLAGE HOUSES
========================================== */

const plaster = mat(0xbca989);
const darkPlaster = mat(0x927d62);
const roofMaterial = mat(0x554238);
const wood = mat(0x493528);

function makeHouse(x, z, variant = 0) {
  const house = new THREE.Group();
  const wall = variant ? darkPlaster : plaster;

  addBox(house, 0, 2, 0, 10, 4, 8, wall);

  const leftRoof = addMesh(
    house,
    new THREE.BoxGeometry(5.8, 0.22, 9),
    roofMaterial,
    -2.55, 4.25, 0
  );
  leftRoof.rotation.z = -0.35;

  const rightRoof = addMesh(
    house,
    new THREE.BoxGeometry(5.8, 0.22, 9),
    roofMaterial,
    2.55, 4.25, 0
  );
  rightRoof.rotation.z = 0.35;

  addBox(house, 0, 4.22, 4.52, 11, 0.18, 0.16, wood);
  addBox(house, 0, 4.22, -4.52, 11, 0.18, 0.16, wood);
  addBox(house, 0, 1.05, 4.06, 1.45, 2.1, 0.13, wood);

  for (const side of [-1, 1]) {
    addBox(house, side * 2.7, 2.55, 4.1, 1.35, 1.1, 0.12, M.stone);
    addBox(house, side * 2.7, 2.55, 4.18, 0.07, 1.2, 0.08, wood);
    addBox(house, side * 2.7, 2.55, 4.18, 1.45, 0.07, 0.08, wood);
  }

  addBox(house, 0, 0.18, 5.2, 12, 0.25, 2.8, darkPlaster);

  for (const side of [-1, 1]) {
    addMesh(
      house,
      new THREE.CylinderGeometry(0.12, 0.15, 3.5, 12),
      wood,
      side * 5, 1.85, 5.7
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
  [45, 110, 1]
];

for (const position of housePositions) {
  makeHouse(...position);
}

/* ==========================================
   HAYSTACKS
========================================== */

function makeHaystack(x, z, scale = 1) {
  const group = new THREE.Group();
  const hay = mat(0xa88a4d);

  addMesh(
    group,
    new THREE.CylinderGeometry(
      0.9 * scale, 1.1 * scale, 1.1 * scale, 24
    ),
    hay,
    0, 0.55 * scale, 0
  );

  addMesh(
    group,
    new THREE.ConeGeometry(1.05 * scale, 1.15 * scale, 24),
    hay,
    0, 1.6 * scale, 0
  );

  group.position.set(x, 0, z);
  scene.add(group);
}

makeHaystack(-34, -91, 1.1);
makeHaystack(36, -42, 0.9);
makeHaystack(-39, 78, 1);
makeHaystack(38, 155, 1.1);

/* ==========================================
   FENCES
========================================== */

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

/* ==========================================
   ELECTRIC POLES AND WIRES
========================================== */

const poleMaterial = mat(0x777b78);
const wireMaterial = mat(0x252b2c);

function makePole(x, z) {
  const pole = new THREE.Group();

  addMesh(
    pole,
    new THREE.CylinderGeometry(0.13, 0.2, 10, 12),
    poleMaterial,
    0, 5, 0
  );

  addBox(pole, 0, 9.2, 0, 3.2, 0.16, 0.18, M.wood);

  for (const side of [-1, 0, 1]) {
    addMesh(
      pole,
      new THREE.CylinderGeometry(0.08, 0.08, 0.4, 8),
      mat(0xe0ded5),
      side * 1.15, 9.48, 0
    );
  }

  pole.position.set(x, 0, z);
  scene.add(pole);
}

for (let z = -190; z <= 190; z += 38) {
  makePole(-10, z);
  makePole(10, z);
}

function makeWire(x1, z1, x2, z2) {
  const curve = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(x1, 9.5, z1),
    new THREE.Vector3(
      (x1 + x2) / 2,
      8.5,
      (z1 + z2) / 2
    ),
    new THREE.Vector3(x2, 9.5, z2)
  );

  addMesh(
    scene,
    new THREE.TubeGeometry(curve, 20, 0.025, 5, false),
    wireMaterial
  );
}

for (let z = -190; z < 190; z += 38) {
  makeWire(-10, z, -10, z + 38);
  makeWire(10, z, 10, z + 38);
}

/* ==========================================
   GLB ASSETS
========================================== */

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

/* ==========================================
   LOADERS — MESHOPT + KTX2
========================================== */

const loader = new GLTFLoader();

/* Meshopt compressed GLB support */
loader.setMeshoptDecoder(MeshoptDecoder);

/* KTX2 / Basis compressed texture support */
const ktx2Loader = new KTX2Loader();

ktx2Loader.setTranscoderPath(
  "https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/libs/basis/"
);

/* Detect iPhone GPU texture support */
ktx2Loader.detectSupport(renderer);

/* Register KTX2 before loading ANY GLB */
loader.setKTX2Loader(ktx2Loader);

/* ==========================================
   ASSET LIBRARY
========================================== */

const assetLibrary = {};

const REQUIRED_ASSETS = [
  "player",
  "man",
  "cow",
  "bull",
  "goat",
  "dog",
  "tractor",
  "car",
  "motorcycle",
  "tree",
  "shop",
  "well"
];

const OPTIONAL_ASSETS = [
  "childGirl",
  "childBoy",
  "elderlyWoman",
  "grandfather",
  "electricBike",
  "mountainBike",
  "bmxBike",
  "villageTile",
  "guitar"
];

/* ==========================================
   ASSET LOADER
========================================== */

async function loadOneAsset(name) {
  if (assetLibrary[name]) {
    return assetLibrary[name];
  }

  const file = ASSETS[name];

  if (!file) {
    throw new Error("Asset mapping missing: " + name);
  }

  const url = new URL(
    ASSET_PATH + encodeURIComponent(file),
    document.baseURI
  ).href;

  let gltf;

  try {
    gltf = await loader.loadAsync(url);
  } catch (error) {
    throw new Error(
      `${file} failed: ${error?.message || error}`
    );
  }

  if (!gltf?.scene) {
    throw new Error("GLB model empty: " + file);
  }

  gltf.scene.traverse(object => {
    if (!object.isMesh) return;

    object.castShadow = true;
    object.receiveShadow = true;

    const materials = Array.isArray(object.material)
      ? object.material
      : [object.material];

    for (const material of materials) {
      if (material?.map) {
        material.map.colorSpace = THREE.SRGBColorSpace;
      }
    }
  });

  assetLibrary[name] = gltf;
  return gltf;
}

async function loadAssets() {
  let loaded = 0;

  for (const name of REQUIRED_ASSETS) {
    status(
      `LOADING ${name.toUpperCase()}...`,
      5 + loaded / REQUIRED_ASSETS.length * 68
    );

    await loadOneAsset(name);
    loaded++;
  }

  status("LOADING OPTIONAL VILLAGE PEOPLE...", 76);

  for (const name of OPTIONAL_ASSETS) {
    try {
      await loadOneAsset(name);
    } catch (error) {
      console.warn("Optional asset skipped:", name, error);
    }
  }
}

/* ==========================================
   MODEL HELPERS
========================================== */

function cloneModel(name) {
  const gltf = assetLibrary[name];

  if (!gltf?.scene) {
    throw new Error("Required model not loaded: " + name);
  }

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

/* ==========================================
   CHARACTER ANIMATIONS
========================================== */

function makeActor(name, height, position, rotation = 0) {
  const model = fitModel(cloneModel(name), height);

  const root = new THREE.Group();
  root.add(model);

  root.position.set(
    position.x,
    position.y || 0,
    position.z
  );

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

    if (clip) {
      actions[key] = mixer.clipAction(clip);
    }
  }

  const firstAction =
    actions.idle ||
    actions.walk ||
    Object.values(actions)[0] ||
    null;

  if (firstAction) {
    firstAction.play();
  }

  return {
    root,
    model,
    mixer,
    actions,
    current: firstAction,

    changeAnimation(key) {
      const next =
        actions[key] ||
        actions.idle ||
        actions.walk;

      if (!next || next === this.current) return;

      next.reset();
      next.enabled = true;
      next.setEffectiveWeight(1);
      next.play();

      if (this.current) {
        this.current.crossFadeTo(next, 0.22, true);
      }

      this.current = next;
    }
  };
}

/* ==========================================
   VEHICLES
========================================== */

function makeVehicle(name, length, position, rotation = 0) {
  const model = fitVehicle(cloneModel(name), length);
  const root = new THREE.Group();

  root.add(model);

  root.position.set(position.x, 0, position.z);
  root.rotation.y = rotation;

  scene.add(root);

  return root;
}

/* ==========================================
   IMPORTED VILLAGE PROPS
========================================== */

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
  addImportedProp("tree", { x: -17, z: -28 }, 8);
  addImportedProp("tree", { x: 18, z: 28 }, 8);
  addImportedProp("tree", { x: -45, z: 95 }, 9);
  addImportedProp("tree", { x: 48, z: -90 }, 9);

  addImportedProp("shop", { x: 13, z: -9 }, 5, Math.PI);
  addImportedProp("shop", { x: -13, z: 78 }, 5);

  addImportedProp("well", { x: -31, z: -55 }, 2.2);
  addImportedProp("well", { x: 34, z: 116 }, 2.2);
}

/* ==========================================
   PLAYER AND VILLAGERS
========================================== */

let playerActor = null;
const villagers = [];

function createPeople() {
  playerActor = makeActor(
    "player",
    1.75,
    { x: 0, y: 0, z: 0 }
  );

  const people = [
    { name: "man", x: 8, z: 15, height: 1.7 },
    { name: "man", x: -12, z: 30, height: 1.7 },
    { name: "man", x: 30, z: -20, height: 1.7 },
    { name: "man", x: -30, z: -25, height: 1.7 },
    { name: "childGirl", x: 45, z: 65, height: 1.25 },
    { name: "childBoy", x: -42, z: 12, height: 1.25 },
    { name: "elderlyWoman", x: 18, z: 92, height: 1.6 },
    { name: "grandfather", x: -18, z: -115, height: 1.65 }
  ];

  for (const person of people) {
    if (!assetLibrary[person.name]) continue;

    const actor = makeActor(
      person.name,
      person.height,
      { x: person.x, y: 0, z: person.z }
    );

    villagers.push({
      actor,
      phase: Math.random() * 10,
      originX: person.x,
      originZ: person.z
    });
  }
}

/* ==========================================
   VEHICLE TRAFFIC
========================================== */

const traffic = [];

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

/* ==========================================
   FARM ANIMALS AND DOG
========================================== */

const animals = [];
let dogActor = null;

function createAnimal(name, x, z, height) {
  const actor = makeActor(
    name,
    height,
    { x, y: 0, z }
  );

  animals.push({
    actor,
    phase: Math.random() * 8
  });
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
    "dog",
    0.85,
    { x: 5, y: 0, z: 8 }
  );
}

/* ==========================================
   BIRDS
========================================== */

const birds = [];

function createBirds() {
  const birdMaterial = mat(0x373a35);

  for (let i = 0; i < 10; i++) {
    const bird = new THREE.Group();

    const body = addMesh(
      bird,
      new THREE.SphereGeometry(0.2, 12, 10),
      birdMaterial
    );

    body.scale.set(0.8, 0.7, 1.3);

    const wings = [];

    for (const side of [-1, 1]) {
      const pivot = new THREE.Group();
      pivot.position.set(side * 0.12, 0.05, 0);
      bird.add(pivot);

      const wing = addMesh(
        pivot,
        new THREE.SphereGeometry(0.3, 10, 8),
        birdMaterial,
        side * 0.3, 0, 0
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
      mesh: bird,
      wings,
      phase: Math.random() * 10,
      speed: 1.2 + Math.random() * 1.4
    });
  }
}

/* ==========================================
   MOBILE CONTROLS
========================================== */

const controls = document.createElement("div");

controls.style.cssText =
  "position:fixed;inset:0;z-index:20;pointer-events:none";

document.body.appendChild(controls);

/* JOYSTICK */

const joystick = document.createElement("div");

joystick.id = "joystick";

joystick.style.cssText = `
position:absolute;
left:25px;
bottom:35px;
width:125px;
height:125px;
border-radius:50%;
background:rgba(20,25,25,.32);
border:2px solid rgba(255,255,255,.55);
pointer-events:auto;
touch-action:none;
`;

const stick = document.createElement("div");

stick.style.cssText = `
position:absolute;
width:52px;
height:52px;
left:35px;
top:35px;
border-radius:50%;
background:rgba(255,255,255,.75);
border:2px solid white;
`;

joystick.appendChild(stick);
controls.appendChild(joystick);

let moveX = 0;
let moveY = 0;
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

  moveX = dx / max;
  moveY = dy / max;
}

joystick.addEventListener("pointerdown", event => {
  joyPointer = event.pointerId;
  joystick.setPointerCapture(event.pointerId);
  updateJoystick(event);
});

joystick.addEventListener("pointermove", event => {
  if (event.pointerId === joyPointer) {
    updateJoystick(event);
  }
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

/* ==========================================
   JUMP BUTTON
========================================== */

const jumpButton = document.createElement("button");

jumpButton.id = "jump";
jumpButton.textContent = "JUMP";

jumpButton.style.cssText = `
position:absolute;
right:28px;
bottom:48px;
width:75px;
height:75px;
border-radius:50%;
border:2px solid white;
background:rgba(220,170,60,.78);
color:white;
font-weight:bold;
font-size:15px;
pointer-events:auto;
touch-action:none;
`;

controls.appendChild(jumpButton);

let jumpVelocity = 0;
let isJumping = false;

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

/* ==========================================
   CAMERA TOUCH CONTROL
========================================== */

let cameraYaw = 0;
let cameraPitch = 0.68;
const cameraDistance = 9.5;

let lookTouchId = null;
let lastTouchX = 0;
let lastTouchY = 0;

window.addEventListener("touchstart", event => {
  if (lookTouchId !== null) return;

  const touch = Array.from(event.changedTouches).find(item => {
    const element = document.elementFromPoint(
      item.clientX,
      item.clientY
    );

    return element &&
      !element.closest("#joystick,#jump");
  });

  if (!touch) return;

  lookTouchId = touch.identifier;
  lastTouchX = touch.clientX;
  lastTouchY = touch.clientY;
}, {
  capture: true,
  passive: false
});

window.addEventListener("touchmove", event => {
  if (lookTouchId === null) return;

  const touch = Array.from(event.touches).find(
    item => item.identifier === lookTouchId
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

  event.preventDefault();
}, {
  capture: true,
  passive: false
});

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

/* ==========================================
   GAME LOOP
========================================== */

const clock = new THREE.Clock();
let elapsed = 0;

function animate() {
  requestAnimationFrame(animate);

  if (!gameStarted || !playerActor) return;

  const dt = Math.min(clock.getDelta(), 0.04);
  elapsed += dt;

  /* PLAYER MOVEMENT */

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
      dx / length,
      dz / length
    );

    const speed = Math.hypot(moveX, moveY);

    playerActor.changeAnimation(
      speed > 0.75 ? "run" : "walk"
    );
  } else {
    playerActor.changeAnimation("idle");
  }

  /* JUMP PHYSICS */

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

  /* VILLAGERS */

  for (const villager of villagers) {
    villager.actor.mixer.update(dt);
    villager.actor.changeAnimation("idle");
  }

  /* TRAFFIC */

  for (const vehicle of traffic) {
    vehicle.mesh.position.z += vehicle.speed * dt;

    if (vehicle.mesh.position.z > 220) {
      vehicle.mesh.position.z = -220;
    }

    if (vehicle.mesh.position.z < -220) {
      vehicle.mesh.position.z = 220;
    }
  }

  /* FARM ANIMALS */

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

  /* GERMAN SHEPHERD */

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
        direction.x,
        direction.z
      );

      dogActor.changeAnimation("walk");
    } else {
      dogActor.changeAnimation("idle");
    }
  }

  /* BIRDS */

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
        Math.sin(elapsed * 9 + bird.phase) *
        0.72;
    }
  }

  /* THIRD-PERSON CAMERA */

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

  renderer.render(scene, camera);
}

/* ==========================================
   START GAME AND RETRY
========================================== */

let loadingPromise = null;

async function startGame() {
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    gameStarted = false;

    retryButton.style.display = "none";
    loadError.textContent = "";
    loading.style.display = "flex";

    try {
      status("LOADING REAL LOCAL 3D MODELS...", 3);

      await loadAssets();

      status("BUILDING NAYABASTI...", 82);

      createVillageAssets();
      createPeople();
      createVehicles();
      createAnimals();
      createBirds();

      status("STARTING GAME...", 96);

      camera.position.set(0, 7, 12);
      camera.lookAt(0, 1, 0);

      gameStarted = true;
      loading.remove();

      clock.start();
      animate();

      console.log(
        "NAYABASTI — REAL LOCAL GLB ASSETS LOADED"
      );

    } catch (error) {
      gameStarted = false;
      showAssetError(error);

      console.error("NAYABASTI ASSET ERROR:", error);

    } finally {
      loadingPromise = null;
    }
  })();

  return loadingPromise;
}

retryButton.addEventListener("click", startGame);

startGame();

/* ==========================================
   RESIZE
========================================== */

window.addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(innerWidth, innerHeight);

  renderer.setPixelRatio(
    Math.min(devicePixelRatio || 1, 1.25)
  );
});
