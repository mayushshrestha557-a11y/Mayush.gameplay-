
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import * as SkeletonUtils from "three/addons/utils/SkeletonUtils.js";

/* =====================================================
   MAYUSH GAMEPLAY — NAYABASTI TERAI
   Existing village layout + real external 3D assets
   Mobile / iPhone Safari
===================================================== */

document.documentElement.style.cssText =
  "margin:0;width:100%;height:100%;overflow:hidden";

document.body.style.cssText =
  "margin:0;width:100%;height:100%;overflow:hidden;background:#9ba9a8;touch-action:none;user-select:none";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9ba9a8);
scene.fog = new THREE.Fog(0x9ba9a8, 100, 390);

const camera = new THREE.PerspectiveCamera(
  65, innerWidth / innerHeight, 0.1, 700
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

/* LOADING / ERROR SCREEN */

const loading = document.createElement("div");
loading.style.cssText = `
position:fixed;inset:0;z-index:1000;background:#142019;
color:white;display:flex;align-items:center;justify-content:center;
flex-direction:column;font:14px Arial;gap:14px;padding:25px;text-align:center
`;

loading.innerHTML = `
<div style="font-size:30px;font-weight:900;letter-spacing:4px">MAYUSH</div>
<div id="loadtext">LOADING REAL 3D ASSETS...</div>
<div style="width:220px;height:6px;background:#4b554e;border-radius:8px;overflow:hidden">
<div id="loadbar" style="width:3%;height:6px;background:#d8b46d"></div>
</div>
<div id="loaderror" style="max-width:300px;line-height:1.5;color:#ffb6a7"></div>
<button id="retry" style="display:none;padding:12px 28px;border:0;border-radius:8px;background:#d8b46d;color:#171717;font-weight:bold">
RETRY ASSET DOWNLOAD
</button>
`;

document.body.appendChild(loading);

const loadText = document.getElementById("loadtext");
const loadBar = document.getElementById("loadbar");
const loadError = document.getElementById("loaderror");
const retryButton = document.getElementById("retry");

function status(text, progress) {
  loadText.textContent = text;
  loadBar.style.width = progress + "%";
}

function showAssetError(error) {
  loadText.textContent = "3D ASSET DOWNLOAD FAILED";
  loadError.textContent =
    "Internet connection or model server problem. Cartoon fallback is disabled. " +
    String(error?.message || error);
  loadBar.style.width = "0%";
  retryButton.style.display = "block";
}

let gameStarted = false;

/* LIGHTING */

scene.add(new THREE.HemisphereLight(0xe3edff, 0x62533c, 1.5));

const sun = new THREE.DirectionalLight(0xffe4bd, 2.5);
sun.position.set(-55, 95, 45);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
Object.assign(sun.shadow.camera, {
  left: -110, right: 110,
  top: 110, bottom: -110,
  near: 1, far: 250
});
sun.shadow.bias = -0.0002;
scene.add(sun);

const fillLight = new THREE.DirectionalLight(0xb8d5ff, 0.42);
fillLight.position.set(50, 35, -60);
scene.add(fillLight);

/* MATERIALS */

function mat(color, roughness = 0.9, metalness = 0) {
  return new THREE.MeshStandardMaterial({
    color, roughness, metalness
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
  const o = new THREE.Mesh(geometry, material);
  o.position.set(x, y, z);
  o.castShadow = true;
  o.receiveShadow = true;
  parent.add(o);
  return o;
}

function addBox(parent, x, y, z, sx, sy, sz, material) {
  return addMesh(
    parent,
    new THREE.BoxGeometry(sx, sy, sz),
    material, x, y, z
  );
}

/* TEXTURES */

function makeNoiseTexture(base, colors, amount = 7000) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 512;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < amount; i++) {
    ctx.globalAlpha = 0.08 + Math.random() * 0.25;
    ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const r = 0.4 + Math.random() * 2.4;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 1;
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

const grassTex = makeNoiseTexture("#617b42", [
  "#a1a65e", "#405c30", "#788b49", "#b1a36a"
]);
grassTex.repeat.set(35, 35);
M.grass.map = grassTex;
M.grass.needsUpdate = true;

const dirtTex = makeNoiseTexture("#826044", [
  "#b18b5d", "#65452e", "#9c7953", "#c1a078"
]);
dirtTex.repeat.set(2, 42);
M.road.map = dirtTex;
M.road.color.set(0xffffff);
M.road.needsUpdate = true;

/* GROUND */

const ground = addMesh(
  scene, new THREE.PlaneGeometry(600, 600), M.grass,
  0, -0.12, 0
);
ground.rotation.x = -Math.PI / 2;

/* GRASS */

{
  const geo = new THREE.PlaneGeometry(0.13, 0.58);
  geo.translate(0, 0.28, 0);

  const grassMat = new THREE.MeshStandardMaterial({
    color: 0x91a65c,
    side: THREE.DoubleSide,
    roughness: 1
  });

  const grass = new THREE.InstancedMesh(geo, grassMat, 2600);
  const dummy = new THREE.Object3D();
  let count = 0;

  for (let i = 0; i < 3600 && count < 2600; i++) {
    const x = (Math.random() - 0.5) * 500;
    const z = (Math.random() - 0.5) * 500;
    if (Math.abs(x) < 7) continue;

    dummy.position.set(x, 0.01, z);
    dummy.rotation.y = Math.random() * Math.PI;
    dummy.scale.set(0.5 + Math.random(), 0.5 + Math.random(), 1);
    dummy.updateMatrix();
    grass.setMatrixAt(count++, dummy.matrix);
  }

  grass.count = count;
  grass.instanceMatrix.needsUpdate = true;
  scene.add(grass);
}

/* MAIN DIRT ROAD */

addBox(scene, 0, 0.005, 0, 12, 0.09, 440, M.road);

for (const x of [-2.65, 2.65]) {
  const rut = addMesh(
    scene, new THREE.PlaneGeometry(0.48, 440),
    M.rut, x, 0.055, 0
  );
  rut.rotation.x = -Math.PI / 2;
}

addBox(scene, -6.5, -0.005, 0, 1.2, 0.1, 440, M.dirt);
addBox(scene, 6.5, -0.005, 0, 1.2, 0.1, 440, M.dirt);

/* ROAD STONES */

{
  const geo = new THREE.DodecahedronGeometry(0.13, 0);
  const stones = new THREE.InstancedMesh(
    geo, M.stone, 380
  );
  const d = new THREE.Object3D();

  for (let i = 0; i < 380; i++) {
    d.position.set(
      (Math.random() - 0.5) * 10,
      0.12,
      (Math.random() - 0.5) * 420
    );
    d.scale.set(
      0.3 + Math.random(),
      0.2 + Math.random() * 0.5,
      0.3 + Math.random()
    );
    d.rotation.set(Math.random(), Math.random(), Math.random());
    d.updateMatrix();
    stones.setMatrixAt(i, d.matrix);
  }
  scene.add(stones);
}

/* CONNECTING ROADS */

addBox(scene, -10, 0.005, -35, 90, 0.09, 6, M.road);
addBox(scene, 40, 0.005, 60, 90, 0.09, 6, M.road);
addBox(scene, -45, 0.005, 125, 75, 0.09, 6, M.road);
addBox(scene, 38, 0.005, -125, 75, 0.09, 6, M.road);

/* FIELDS */

function makeField(x, z, width, depth) {
  addBox(scene, x, 0.005, z, width, 0.08, depth, M.field);

  const cropMat = mat(0x92954a);
  const cropGeo = new THREE.ConeGeometry(0.12, 0.75, 5);
  const total = Math.floor(width / 3) * Math.floor(depth / 4);
  const crops = new THREE.InstancedMesh(cropGeo, cropMat, total);
  const d = new THREE.Object3D();
  let index = 0;

  for (let px = -width / 2 + 2; px < width / 2 - 1; px += 3) {
    for (let pz = -depth / 2 + 2; pz < depth / 2 - 1; pz += 4) {
      d.position.set(x + px, 0.38, z + pz);
      d.rotation.y = Math.random();
      d.updateMatrix();
      crops.setMatrixAt(index++, d.matrix);
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

/* CANALS AND PONDS */

function canal(x, z, width, length, rotation = 0) {
  const group = new THREE.Group();

  addBox(group, 0, 0.02, 0, width, 0.12, length, M.water);

  for (const side of [-1, 1]) {
    addBox(
      group, side * (width / 2 + 0.3), 0.02, 0,
      0.55, 0.32, length, M.dirt
    );
  }

  group.position.set(x, 0, z);
  group.rotation.y = rotation;
  scene.add(group);
}

canal(-125, 0, 2.5, 360);
canal(130, 20, 2.5, 350);
canal(0, -165, 2.2, 250, Math.PI / 2);

function pond(x, z, rx, rz) {
  const p = addMesh(
    scene, new THREE.CircleGeometry(1, 48),
    M.water, x, 0.03, z
  );
  p.rotation.x = -Math.PI / 2;
  p.scale.set(rx, rz, 1);
}

pond(-48, -20, 12, 8);
pond(55, 145, 15, 10);

/* HOUSES */

const plasterMat = mat(0xbca989);
const plasterDark = mat(0x927d62);
const roofMat = mat(0x554238);
const woodMat = mat(0x493528);
const glassMat = new THREE.MeshPhysicalMaterial({
  color: 0x536c70,
  roughness: 0.18,
  metalness: 0.1,
  transmission: 0.1
});

function makeHouse(x, z, variant = 0) {
  const h = new THREE.Group();
  const wall = variant ? plasterDark : plasterMat;

  // Main building
  addBox(h, 0, 2, 0, 10, 4, 8, wall);

  // Roof panels
  const roofLeft = addMesh(
    h, new THREE.BoxGeometry(5.8, 0.22, 9),
    roofMat, -2.55, 4.25, 0
  );
  roofLeft.rotation.z = -0.35;

  const roofRight = addMesh(
    h, new THREE.BoxGeometry(5.8, 0.22, 9),
    roofMat, 2.55, 4.25, 0
  );
  roofRight.rotation.z = 0.35;

  // Roof edges
  addBox(h, 0, 4.22, 4.52, 11, 0.18, 0.16, woodMat);
  addBox(h, 0, 4.22, -4.52, 11, 0.18, 0.16, woodMat);

  // Door and frame
  addBox(h, 0, 1.05, 4.06, 1.45, 2.1, 0.13, woodMat);
  addBox(h, 0.82, 1.05, 4.08, 0.08, 2.2, 0.16, plasterDark);

  // Windows
  for (const side of [-1, 1]) {
    addBox(h, side * 2.7, 2.55, 4.1, 1.35, 1.1, 0.12, glassMat);
    addBox(h, side * 2.7, 2.55, 4.18, 0.07, 1.2, 0.08, woodMat);
    addBox(h, side * 2.7, 2.55, 4.18, 1.45, 0.07, 0.08, woodMat);
  }

  // Veranda
  addBox(h, 0, 0.18, 5.2, 12, 0.25, 2.8, plasterDark);

  for (const side of [-1, 1]) {
    addMesh(
      h, new THREE.CylinderGeometry(0.12, 0.15, 3.5, 12),
      woodMat, side * 5, 1.85, 5.7
    );
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

const barkMat = mat(0x49382b);
const leafMaterials = [
  mat(0x304b2c),
  mat(0x3c5b32),
  mat(0x526b39),
  mat(0x637542)
];

function makeTree(x, z, scale = 1) {
  const tree = new THREE.Group();

  addMesh(
    tree,
    new THREE.CylinderGeometry(0.2, 0.38, 4.5, 12),
    barkMat, 0, 2.25, 0
  );

  for (let i = 0; i < 28; i++) {
    const angle = i * 2.399;
    const radius = 0.5 + Math.random() * 1.3;
    const size = 0.7 + Math.random() * 0.85;

    const crown = addMesh(
      tree,
      new THREE.SphereGeometry(size, 12, 10),
      leafMaterials[i % leafMaterials.length],
      Math.cos(angle) * radius,
      3.5 + Math.random() * 2.0,
      Math.sin(angle) * radius
    );

    crown.scale.set(
      1.15 + Math.random() * 0.3,
      0.8 + Math.random() * 0.35,
      1.1 + Math.random() * 0.3
    );
  }

  tree.scale.setScalar(scale);
  tree.position.set(x, 0, z);
  scene.add(tree);
}

for (let i = 0; i < 85; i++) {
  const x = (Math.random() - 0.5) * 210;
  const z = (Math.random() - 0.5) * 270;
  if (Math.abs(x) > 10) makeTree(x, z, 0.8 + Math.random() * 0.8);
}

/* BANANA PLANTS */

function bananaTree(x, z) {
  const group = new THREE.Group();
  const stem = mat(0x79603b);

  addMesh(
    group, new THREE.CylinderGeometry(0.15, 0.22, 2.5, 12),
    stem, 0, 1.25, 0
  );

  for (let i = 0; i < 8; i++) {
    const leaf = addMesh(
      group,
      new THREE.SphereGeometry(1, 14, 10),
      leafMaterials[i % leafMaterials.length],
      0, 2.55, 0
    );
    leaf.scale.set(0.35, 0.12, 1.9);
    leaf.rotation.y = i * 0.8;
    leaf.rotation.x = 0.25;
  }

  group.position.set(x, 0, z);
  scene.add(group);
}

for (let i = 0; i < 20; i++) {
  bananaTree(
    (Math.random() - 0.5) * 100,
    (Math.random() - 0.5) * 260
  );
}

/* EXTERNAL REAL 3D ASSETS */

const loader = new GLTFLoader();

const ASSETS = {
  person: "https://models.vinish.dev/people/casual-man.glb",
  cow: "https://vinish-models.pages.dev/farm-animals/dairy-cow.glb",
  bull: "https://vinish-models.pages.dev/farm-animals/bull.glb",
  goat: "https://vinish-models.pages.dev/farm-animals/goat.glb",
  tractor: "https://tevy.dev/models/farm-tractor/v1/lod0.glb",
  car: "https://models.vinish.dev/realistic-cars/executive-sedan.glb",
  motorcycle: "https://models.vinish.dev/motorcycles/street-motorcycle.glb"
};

let assetLibrary = {};

async function loadAssets() {
  const entries = Object.entries(ASSETS);
  const loaded = {};

  for (let i = 0; i < entries.length; i++) {
    const [name, url] = entries[i];

    status("DOWNLOADING " + name.toUpperCase() + "...", 5 + i * 12);

    const gltf = await loader.loadAsync(url);

    if (!gltf || !gltf.scene) {
      throw new Error("Model file is empty: " + name);
    }

    gltf.scene.traverse(object => {
      if (object.isMesh) {
        object.castShadow = true;
        object.receiveShadow = true;

        if (object.material) {
          const materials = Array.isArray(object.material)
            ? object.material : [object.material];

          for (const m of materials) {
            if (m.map) m.map.colorSpace = THREE.SRGBColorSpace;
          }
        }
      }
    });

    loaded[name] = gltf;
  }

  assetLibrary = loaded;
}

/* MODEL HELPERS */

function cloneModel(name) {
  const original = assetLibrary[name];
  if (!original) throw new Error("Missing loaded model: " + name);

  return SkeletonUtils.clone(original.scene);
}

function fitModel(model, targetHeight) {
  model.updateMatrixWorld(true);

  const box = new THREE.Box3().setFromObject(model);
  const size = new THREE.Vector3();
  box.getSize(size);

  if (!Number.isFinite(size.y) || size.y <= 0) {
    throw new Error("Invalid model dimensions");
  }

  model.scale.multiplyScalar(targetHeight / size.y);
  model.updateMatrixWorld(true);

  const fittedBox = new THREE.Box3().setFromObject(model);
  model.position.y -= fittedBox.min.y;

  return model;
}

function makeAnimatedActor(name, targetHeight, position, rotation = 0) {
  const model = cloneModel(name);
  fitModel(model, targetHeight);

  const root = new THREE.Group();
  root.add(model);
  root.position.set(position.x, position.y || 0, position.z);
  root.rotation.y = rotation;
  scene.add(root);

  const clips = assetLibrary[name].animations || [];
  const mixer = new THREE.AnimationMixer(model);

  const findClip = wanted => clips.find(
    clip => clip.name.toLowerCase() === wanted.toLowerCase()
  );

  const actions = {};

  for (const wanted of ["Idle", "Walk", "Run", "Trot", "Graze"]) {
    const clip = findClip(wanted);
    if (clip) actions[wanted] = mixer.clipAction(clip);
  }

  const initial = actions.Idle || actions.Walk || Object.values(actions)[0];
  if (initial) initial.play();

  return {
    root,
    model,
    mixer,
    actions,
    current: initial || null,
    changeAnimation(name) {
      const next = actions[name] || actions.Idle || actions.Walk;
      if (!next || next === this.current) return;

      next.reset();
      next.enabled = true;
      next.setEffectiveWeight(1);
      next.play();

      if (this.current) this.current.crossFadeTo(next, 0.25, true);
      this.current = next;
    }
  };
}

function makeStaticVehicle(name, targetLength, position, rotation = 0) {
  const model = cloneModel(name);
  model.updateMatrixWorld(true);

  const bounds = new THREE.Box3().setFromObject(model);
  const size = new THREE.Vector3();
  bounds.getSize(size);

  const longest = Math.max(size.x, size.z);
  if (!Number.isFinite(longest) || longest <= 0) {
    throw new Error("Invalid vehicle model: " + name);
  }

  model.scale.multiplyScalar(targetLength / longest);
  model.updateMatrixWorld(true);

  const fitted = new THREE.Box3().setFromObject(model);
  model.position.y -= fitted.min.y;

  const root = new THREE.Group();
  root.add(model);
  root.position.set(position.x, 0, position.z);
  root.rotation.y = rotation;
  scene.add(root);

  return root;
}

/* PLAYER AND VILLAGERS */

let playerActor;
const villagers = [];

function createPeople() {
  playerActor = makeAnimatedActor(
    "person", 1.75,
    { x: 0, y: 0, z: 0 }
  );

  const positions = [
    [8,15], [-12,30], [30,-20], [-30,-25],
    [45,65], [-42,12], [18,92], [-18,-115]
  ];

  for (const [x, z] of positions) {
    const actor = makeAnimatedActor(
      "person", 1.68,
      { x, y: 0, z }
    );
    villagers.push({
      actor,
      phase: Math.random() * 10
    });
  }
}

/* TRAFFIC */

const traffic = [];

function createVehicles() {
  const tractor = makeStaticVehicle(
    "tractor", 4.4, { x: -2.5, z: -155 }, Math.PI
  );
  traffic.push({ mesh: tractor, speed: 3.2 });

  const car = makeStaticVehicle(
    "car", 5.0, { x: 2.5, z: -105 }, 0
  );
  traffic.push({ mesh: car, speed: -7 });

  const bike1 = makeStaticVehicle(
    "motorcycle", 2.1, { x: 2.5, z: 145 }, 0
  );
  traffic.push({ mesh: bike1, speed: -5.5 });

  const bike2 = makeStaticVehicle(
    "motorcycle", 2.1, { x: -2.5, z: -65 }, Math.PI
  );
  traffic.push({ mesh: bike2, speed: 5.5 });
}

/* FARM ANIMALS */

const animals = [];

function createAnimal(type, x, z, height) {
  const actor = makeAnimatedActor(
    type, height, { x, y: 0, z }
  );

  animals.push({
    actor,
    phase: Math.random() * 8
  });
}

function createAnimals() {
  createAnimal("cow", -17, -77, 1.45);
  createAnimal("cow", 31, -94, 1.4);

  // Bull model is used as the large cattle animal.
  createAnimal("bull", -33, -39, 1.5);
  createAnimal("bull", 34, 68, 1.5);

  createAnimal("goat", -18, 42, 0.75);
  createAnimal("goat", 30, 132, 0.75);
  createAnimal("goat", -39, 100, 0.75);
}

/* HAYSTACKS */

function makeHaystack(x, z, scale = 1) {
  const group = new THREE.Group();
  const hay = mat(0xa88a4d);

  const base = addMesh(
    group,
    new THREE.CylinderGeometry(0.9 * scale, 1.1 * scale, 1.1 * scale, 24),
    hay, 0, 0.55 * scale, 0
  );

  const top = addMesh(
    group,
    new THREE.ConeGeometry(1.05 * scale, 1.15 * scale, 24),
    hay, 0, 1.6 * scale, 0
  );

  group.position.set(x, 0, z);
  scene.add(group);
}

makeHaystack(-34, -91, 1.1);
makeHaystack(36, -42, 0.9);
makeHaystack(-39, 78, 1);
makeHaystack(38, 155, 1.1);

/* FENCES */

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

/* ELECTRIC POLES */

const poleMat = mat(0x777b78);
const wireMat = mat(0x252b2c);

function makePole(x, z) {
  const group = new THREE.Group();

  addMesh(
    group,
    new THREE.CylinderGeometry(0.13, 0.2, 10, 12),
    poleMat, 0, 5, 0
  );

  addBox(group, 0, 9.2, 0, 3.2, 0.16, 0.18, M.wood);

  for (const side of [-1, 0, 1]) {
    addMesh(
      group,
      new THREE.CylinderGeometry(0.08, 0.08, 0.4, 8),
      mat(0xe0ded5), side * 1.15, 9.48, 0
    );
  }

  group.position.set(x, 0, z);
  scene.add(group);
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

  addMesh(
    scene,
    new THREE.TubeGeometry(curve, 20, 0.025, 5, false),
    wireMat
  );
}

for (let z = -190; z < 190; z += 38) {
  makeWire(-10, z, -10, z + 38);
  makeWire(10, z, 10, z + 38);
}

/* WATER POTS */

function makeWaterPot(x, z) {
  const group = new THREE.Group();
  const clay = mat(0x92543c);

  const body = addMesh(
    group, new THREE.SphereGeometry(0.38, 20, 16),
    clay, 0, 0.4, 0
  );
  body.scale.set(1, 1.15, 1);

  addMesh(
    group,
    new THREE.CylinderGeometry(0.19, 0.23, 0.12, 18),
    clay, 0, 0.82, 0
  );

  const water = addMesh(
    group, new THREE.CircleGeometry(0.16, 18),
    M.water, 0, 0.89, 0
  );
  water.rotation.x = -Math.PI / 2;

  group.position.set(x, 0, z);
  scene.add(group);
}

makeWaterPot(-18, -88);
makeWaterPot(30, -12);
makeWaterPot(-32, 55);
makeWaterPot(28, 108);

/* BIRDS */

const birds = [];

function createBirds() {
  const birdMat = mat(0x373a35);

  for (let i = 0; i < 10; i++) {
    const bird = new THREE.Group();

    const body = addMesh(
      bird, new THREE.SphereGeometry(0.2, 12, 10),
      birdMat
    );
    body.scale.set(0.8, 0.7, 1.3);

    const wings = [];

    for (const side of [-1, 1]) {
      const pivot = new THREE.Group();
      pivot.position.set(side * 0.12, 0.05, 0);
      bird.add(pivot);

      const wing = addMesh(
        pivot, new THREE.SphereGeometry(0.3, 10, 8),
        birdMat, side * 0.3, 0, 0
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

/* MOBILE CONTROLS */

const controls = document.createElement("div");
controls.style.cssText =
  "position:fixed;inset:0;z-index:20;pointer-events:none";
document.body.appendChild(controls);

/* JOYSTICK */

const joystick = document.createElement("div");
joystick.id = "joystick";
joystick.style.cssText = `
position:absolute;left:25px;bottom:35px;width:125px;height:125px;
border-radius:50%;background:rgba(20,25,25,.32);
border:2px solid rgba(255,255,255,.55);
pointer-events:auto;touch-action:none
`;

const stick = document.createElement("div");
stick.style.cssText = `
position:absolute;width:52px;height:52px;left:35px;top:35px;
border-radius:50%;background:rgba(255,255,255,.75);
border:2px solid white
`;

joystick.appendChild(stick);
controls.appendChild(joystick);

let moveX = 0;
let moveY = 0;
let joyPointer = null;

function updateJoystick(e) {
  const rect = joystick.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;

  let dx = e.clientX - cx;
  let dy = e.clientY - cy;
  const max = 43;
  const distance = Math.hypot(dx, dy);

  if (distance > max) {
    dx = dx / distance * max;
    dy = dy / distance * max;
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
  moveX = 0;
  moveY = 0;
  stick.style.left = "35px";
  stick.style.top = "35px";
}

joystick.addEventListener("pointerup", releaseJoy);
joystick.addEventListener("pointercancel", releaseJoy);

/* JUMP */

const jumpButton = document.createElement("button");
jumpButton.id = "jump";
jumpButton.textContent = "JUMP";
jumpButton.style.cssText = `
position:absolute;right:28px;bottom:48px;width:75px;height:75px;
border-radius:50%;border:2px solid white;
background:rgba(220,170,60,.78);color:white;
font-weight:bold;font-size:15px;
pointer-events:auto;touch-action:none
`;
controls.appendChild(jumpButton);

let jumpVelocity = 0;
let isJumping = false;

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

/* CAMERA TOUCH LOOK */

let cameraYaw = 0;
let cameraPitch = 0.68;
const cameraDistance = 9.5;

let lookTouchId = null;
let lastTouchX = 0;
let lastTouchY = 0;

window.addEventListener("touchstart", e => {
  if (lookTouchId !== null) return;

  const touch = Array.from(e.changedTouches).find(t => {
    const element = document.elementFromPoint(t.clientX, t.clientY);
    return element && !element.closest("#joystick,#jump");
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
    cameraPitch + dy * 0.005, 0.18, 1.25
  );

  e.preventDefault();
}, { capture: true, passive: false });

function endLook(e) {
  if (Array.from(e.changedTouches).some(
    t => t.identifier === lookTouchId
  )) {
    lookTouchId = null;
  }
}

window.addEventListener("touchend", endLook);
window.addEventListener("touchcancel", endLook);

/* GAME LOOP */

const clock = new THREE.Clock();
let elapsed = 0;

function animate() {
  requestAnimationFrame(animate);

  if (!gameStarted) return;

  const dt = Math.min(clock.getDelta(), 0.04);
  elapsed += dt;

  // Player movement relative to camera direction
  const forward = -moveY;
  const side = moveX;
  const moving = Math.hypot(forward, side) > 0.08;

  if (moving) {
    const dx = side * Math.cos(cameraYaw) - forward * Math.sin(cameraYaw);
    const dz = -side * Math.sin(cameraYaw) - forward * Math.cos(cameraYaw);
    const length = Math.hypot(dx, dz) || 1;

    playerActor.root.position.x += dx / length * 5 * dt;
    playerActor.root.position.z += dz / length * 5 * dt;

    playerActor.root.rotation.y = Math.atan2(dx / length, dz / length);

    const speed = Math.hypot(moveX, moveY);
    playerActor.changeAnimation(speed > 0.75 ? "Run" : "Walk");
  } else {
    playerActor.changeAnimation("Idle");
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

  // Player animation mixer
  playerActor.mixer.update(dt);

  // Villagers
  for (const v of villagers) {
    v.actor.mixer.update(dt);
    v.actor.changeAnimation("Idle");
  }

  // Traffic movement
  for (const vehicle of traffic) {
    vehicle.mesh.position.z += vehicle.speed * dt;

    if (vehicle.mesh.position.z > 220) {
      vehicle.mesh.position.z = -220;
    }
    if (vehicle.mesh.position.z < -220) {
      vehicle.mesh.position.z = 220;
    }
  }

  // Animal animations
  for (const animal of animals) {
    animal.actor.mixer.update(dt);

    if (animal.actor.actions.Graze && Math.sin(elapsed * 0.15 + animal.phase) > 0.7) {
      animal.actor.changeAnimation("Graze");
    } else {
      animal.actor.changeAnimation("Idle");
    }
  }

  // Birds
  for (const bird of birds) {
    bird.mesh.position.x += bird.speed * dt;
    bird.mesh.position.y += Math.sin(elapsed * 2 + bird.phase) * dt * 0.25;
    bird.mesh.position.z += Math.cos(elapsed + bird.phase) * dt * 0.35;

    if (bird.mesh.position.x > 100) {
      bird.mesh.position.x = -100;
    }

    for (const wing of bird.wings) {
      wing.pivot.rotation.z =
        wing.side * Math.sin(elapsed * 9 + bird.phase) * 0.72;
    }
  }

  // Third-person camera
  const h = cameraDistance * Math.cos(cameraPitch);

  const target = new THREE.Vector3(
    playerActor.root.position.x + Math.sin(cameraYaw) * h,
    playerActor.root.position.y + cameraDistance * Math.sin(cameraPitch),
    playerActor.root.position.z + Math.cos(cameraYaw) * h
  );

  camera.position.lerp(target, 1 - Math.exp(-7 * dt));

  camera.lookAt(
    playerActor.root.position.x,
    playerActor.root.position.y + 1.2,
    playerActor.root.position.z
  );

  renderer.render(scene, camera);
}

/* BUILD AND START */

async function startGame() {
  gameStarted = false;
  retryButton.style.display = "none";
  loadError.textContent = "";

  try {
    status("DOWNLOADING REAL 3D MODELS...", 3);

    await loadAssets();

    status("BUILDING NAYABASTI...", 82);

    createPeople();
    createVehicles();
    createAnimals();
    createBirds();

    status("STARTING GAME...", 96);

    gameStarted = true;
    loading.remove();

    animate();

    console.log("MAYUSH GAMEPLAY — REAL 3D ASSETS READY");
  } catch (error) {
    gameStarted = false;
    showAssetError(error);
    console.error("MAYUSH ASSET ERROR:", error);
  }
}

retryButton.addEventListener("click", () => {
  startGame();
});

startGame();

/* RESIZE */

window.addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.25));
});
