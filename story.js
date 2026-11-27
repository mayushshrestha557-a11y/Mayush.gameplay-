import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { KTX2Loader } from "three/addons/loaders/KTX2Loader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import * as SkeletonUtils from "three/addons/utils/SkeletonUtils.js";

/* =====================================================
   HAMRO BASTI
   CREATED & FOUNDED BY MAYUSH SHRESTHA
===================================================== */

document.documentElement.style.cssText =
  "margin:0;width:100%;height:100%;overflow:hidden";

document.body.style.cssText =
  "margin:0;width:100%;height:100%;overflow:hidden;background:#101b19;touch-action:none;user-select:none";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9ba9a8);
scene.fog = new THREE.Fog(0x9ba9a8, 260, 2850);

const camera = new THREE.PerspectiveCamera(
  68,
  window.innerWidth / window.innerHeight,
  0.1,
  3400
);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: "high-performance"
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
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
let cameraPitch = 0.38;
let cameraDistance = 5.2;
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
    color,
    roughness,
    metalness
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

function addMesh(
  parent,
  geometry,
  material,
  x = 0,
  y = 0,
  z = 0
) {
  const object = new THREE.Mesh(geometry, material);

  object.position.set(x, y, z);
  object.castShadow = true;
  object.receiveShadow = true;

  parent.add(object);
  return object;
}

function addBox(
  parent,
  x, y, z,
  sx, sy, sz,
  material
) {
  return addMesh(
    parent,
    new THREE.BoxGeometry(sx, sy, sz),
    material,
    x, y, z
  );
}

/* =====================================================
   LIGHTING
===================================================== */

scene.add(
  new THREE.HemisphereLight(
    0xe3edff,
    0x62533c,
    1.6
  )
);

const sun = new THREE.DirectionalLight(0xffe4bd, 2.5);

sun.position.set(-55, 95, 45);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);

Object.assign(sun.shadow.camera, {
  left: -160,
  right: 160,
  top: 160,
  bottom: -160,
  near: 1,
  far: 350
});

scene.add(sun);

const fillLight = new THREE.DirectionalLight(
  0xb8d5ff,
  0.42
);

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
  "#a1a65e",
  "#405c30",
  "#788b49",
  "#b1a36a"
]);

grassTexture.repeat.set(35, 35);
M.grass.map = grassTexture;
M.grass.needsUpdate = true;

const dirtTexture = makeNoiseTexture("#806044", [
  "#b18b5d",
  "#65452e",
  "#9c7953",
  "#c1a078",
  "#715137"
], 10000);

dirtTexture.repeat.set(2, 40);
M.dirt.map = dirtTexture;
M.dirt.needsUpdate = true;

const asphaltTexture = makeNoiseTexture("#343638", [
  "#454749",
  "#292b2d",
  "#555657",
  "#383a3c"
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
  new THREE.PlaneGeometry(800, 3000),
  M.grass,
  0, -0.12, 1100
);

ground.rotation.x = -Math.PI / 2;

/* =====================================================
   ROAD SYSTEM
===================================================== */

const roadLine = mat(0xe8dfbd);
const yellowLine = mat(0xe6c64e);
const curbMaterial = mat(0x777873);
const sidewalkMaterial = mat(0xaaa69a);
const drainMaterial = mat(0x393b38);
const gravelMaterial = mat(0x777064);

function roadPlane(
  x, z, width, length,
  material,
  rotation = 0,
  y = 0.04
) {
  const road = addMesh(
    scene,
    new THREE.PlaneGeometry(width, length),
    material,
    x, y, z
  );

  road.rotation.x = -Math.PI / 2;
  road.rotation.z = rotation;

  return road;
}

function makeHighway(
  x, z, width, length,
  direction = "z"
) {
  const horizontal = direction === "x";
  const rotation = horizontal ? -Math.PI / 2 : 0;

  roadPlane(
    x, z, width, length,
    asphaltMaterial,
    rotation,
    0.055
  );

  roadNetwork.push({
    type: "highway",
    x, z, width, length, direction
  });

  for (const side of [-1, 1]) {
    if (!horizontal) {
      addBox(
        scene,
        x + side * (width / 2 + 0.5),
        0.015, z,
        1, 0.14, length,
        curbMaterial
      );

      addBox(
        scene,
        x + side * (width / 2 + 1.5),
        0.02, z,
        1, 0.12, length,
        sidewalkMaterial
      );

      addBox(
        scene,
        x + side * (width / 2 + 2.2),
        0.015, z,
        0.25, 0.1, length,
        drainMaterial
      );
    } else {
      addBox(
        scene,
        x, 0.015,
        z + side * (width / 2 + 0.5),
        length, 0.14, 1,
        curbMaterial
      );

      addBox(
        scene,
        x, 0.02,
        z + side * (width / 2 + 1.5),
        length, 0.12, 1,
        sidewalkMaterial
      );

      addBox(
        scene,
        x, 0.015,
        z + side * (width / 2 + 2.2),
        length, 0.1, 0.25,
        drainMaterial
      );
    }
  }

  if (!horizontal) {
    for (const side of [-1, 1]) {
      addBox(
        scene,
        x + side * (width / 2 - 0.35),
        0.065, z,
        0.13, 0.018, length,
        roadLine
      );
    }

    for (
      let p = -length / 2 + 3;
      p < length / 2;
      p += 9
    ) {
      addBox(
        scene,
        x, 0.067, z + p,
        0.18, 0.02, 4.5,
        yellowLine
      );
    }
  } else {
    for (const side of [-1, 1]) {
      addBox(
        scene,
        x, 0.065,
        z + side * (width / 2 - 0.35),
        length, 0.018, 0.13,
        roadLine
      );
    }

    for (
      let p = -length / 2 + 3;
      p < length / 2;
      p += 9
    ) {
      addBox(
        scene,
        x + p, 0.067, z,
        4.5, 0.02, 0.18,
        yellowLine
      );
    }
  }
}

function makeVillageRoad(
  x, z, width, length,
  direction = "z"
) {
  const horizontal = direction === "x";
  const rotation = horizontal ? -Math.PI / 2 : 0;

  roadPlane(
    x, z, width, length,
    asphaltMaterial,
    rotation,
    0.035
  );

  roadNetwork.push({
    type: "village",
    x, z, width, length, direction
  });
}

function makeDirtRoad(
  x, z, width, length,
  direction = "z"
) {
  const horizontal = direction === "x";
  const rotation = horizontal ? -Math.PI / 2 : 0;

  roadPlane(
    x, z, width, length,
    dirtRoadMaterial,
    rotation,
    0.025
  );

  roadNetwork.push({
    type: "dirt",
    x, z, width, length, direction
  });

  for (const side of [-1, 1]) {
    if (!horizontal) {
      roadPlane(
        x + side * width * 0.23,
        z,
        0.48,
        length,
        M.rut,
        0,
        0.034
      );
    } else {
      roadPlane(
        x,
        z + side * width * 0.23,
        length,
        0.48,
        M.rut,
        -Math.PI / 2,
        0.034
      );
    }
  }

  const count = Math.floor(length * 0.5);

  for (let i = 0; i < count; i++) {
    const along = (Math.random() - 0.5) * length;

    const side =
      (Math.random() > 0.5 ? 1 : -1) *
      (width / 2 + Math.random() * 1.1);

    const px = horizontal ? x + along : x + side;
    const pz = horizontal ? z + side : z + along;

    const stone = addMesh(
      scene,
      new THREE.DodecahedronGeometry(
        0.06 + Math.random() * 0.12,
        0
      ),
      gravelMaterial,
      px, 0.06, pz
    );

    stone.scale.y = 0.35;
  }
}

/* Four main highways */

makeHighway(-105, 0, 12, 440, "z");
makeHighway(-55, 0, 12, 440, "z");
makeHighway(55, 0, 12, 440, "z");
makeHighway(105, 0, 12, 440, "z");

/* Main cross highways */

makeHighway(0, -150, 11, 420, "x");
makeHighway(0, 150, 11, 420, "x");

/* Inner streets */

for (const x of [
  -135, -125, -85, -75, -35, -25,
  0, 25, 35, 75, 85, 125, 135
]) {
  makeVillageRoad(x, 0, 5.5, 390, "z");
}

for (const z of [
  -190, -170, -130, -110, -90, -65,
  -40, -15, 15, 40, 65, 90, 110,
  130, 170, 190
]) {
  makeVillageRoad(0, z, 5.5, 280, "x");
}

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
  [145, 95, 110, 4.2, "x"],
  [145, 145, 110, 4.2, "x"],
  [-100, -200, 4.2, 100, "z"],
  [-65, -200, 4.2, 100, "z"],
  [-15, -200, 4.2, 100, "z"],
  [15, 200, 4.2, 100, "z"],
  [65, 200, 4.2, 100, "z"],
  [100, 200, 4.2, 100, "z"]
];

for (const road of connectingRoads) {
  makeVillageRoad(...road);
}

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

for (const road of dirtRoads) {
  makeDirtRoad(...road);
}

/* =====================================================
   FIELDS, CANALS AND PONDS
===================================================== */

function makeField(x, z, width, depth) {
  addBox(
    scene,
    x, 0.005, z,
    width, 0.08, depth,
    M.field
  );

  const cropMaterial = mat(0x92954a);
  const geometry = new THREE.ConeGeometry(0.12, 0.75, 5);

  const total =
    Math.floor(width / 3) *
    Math.floor(depth / 4);

  const crops = new THREE.InstancedMesh(
    geometry,
    cropMaterial,
    total
  );

  const dummy = new THREE.Object3D();
  let index = 0;

  for (
    let px = -width / 2 + 2;
    px < width / 2 - 1;
    px += 3
  ) {
    for (
      let pz = -depth / 2 + 2;
      pz < depth / 2 - 1;
      pz += 4
    ) {
      dummy.position.set(
        x + px,
        0.38,
        z + pz
      );

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

makeField(83, 100, 100, 90);

function makeCanal(x, z, width, length, rotation = 0) {
  const group = new THREE.Group();

  addBox(
    group,
    0, 0.02, 0,
    width, 0.12, length,
    M.water
  );

  for (const side of [-1, 1]) {
    addBox(
      group,
      side * (width / 2 + 0.3),
      0.02, 0,
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

  addBox(
    house,
    0, 2, 0,
    10, 4, 8,
    wall
  );

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

  addBox(
    house,
    0, 4.22, 4.52,
    11, 0.18, 0.16,
    wood
  );

  addBox(
    house,
    0, 1.05, 4.06,
    1.45, 2.1, 0.13,
    wood
  );

  addBox(
    house,
    0, 0.18, 5.2,
    12, 0.25, 2.8,
    darkPlaster
  );

  for (const side of [-1, 1]) {
    addBox(
      house,
      side * 2.7, 2.55, 4.1,
      1.35, 1.1, 0.12,
      M.stone
    );

    addMesh(
      house,
      new THREE.CylinderGeometry(
        0.12, 0.15, 3.5, 12
      ),
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
  [45, 110, 1], [-15, -125, 0],
  [15, -130, 1], [-40, -5, 0],
  [40, 15, 1], [-15, 55, 0],
  [15, 95, 1], [-40, 135, 0],
  [40, 175, 1]
];

for (const position of housePositions) {
  makeHouse(...position);
}

/* =====================================================
   FENCES AND HAYSTACKS
===================================================== */

function makeFence(x, z, length, rotation = 0) {
  const group = new THREE.Group();
  const sections = Math.max(2, Math.floor(length / 2));

  for (let i = 0; i <= sections; i++) {
    const px = -length / 2 + length / sections * i;

    addBox(
      group,
      px, 0.6, 0,
      0.14, 1.2, 0.14,
      M.wood
    );
  }

  for (const y of [0.38, 0.9]) {
    addBox(
      group,
      0, y, 0,
      length, 0.12, 0.12,
      M.wood
    );
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

  addMesh(
    group,
    new THREE.CylinderGeometry(
      0.9 * scale,
      1.1 * scale,
      1.1 * scale,
      24
    ),
    hay,
    0, 0.55 * scale, 0
  );

  addMesh(
    group,
    new THREE.ConeGeometry(
      1.05 * scale,
      1.15 * scale,
      24
    ),
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

/* =====================================================
   ELECTRIC POLES
===================================================== */

const poleMaterial = mat(0x777b78);

function makePole(x, z) {
  const pole = new THREE.Group();

  addMesh(
    pole,
    new THREE.CylinderGeometry(
      0.13, 0.2, 10, 12
    ),
    poleMaterial,
    0, 5, 0
  );

  addBox(
    pole,
    0, 9.2, 0,
    3.2, 0.16, 0.18,
    M.wood
  );

  pole.position.set(x, 0, z);
  scene.add(pole);
}

for (let z = -190; z <= 190; z += 38) {
  makePole(-10, z);
  makePole(10, z);
}

/* =====================================================
   GLB ASSETS AND LOADERS
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
  guitar: "acoustic-guitar-v1-lod0.glb",

  cityBuildingA: "building-a.glb",
  cityBuildingB: "building-c.glb",
  cityBuildingC: "building-f.glb",
  cityBuildingD: "building-h.glb",

  cityTowerA: "building-skyscraper-a.glb",
  cityTowerB: "building-skyscraper-c.glb",

  cityMan: "Business_Male_01.glb",
  cityWoman: "Business_Female_01.glb",
  cityAdult: "Female_Adult_01.glb",

  cityTruck: "kei-truck.glb",
  citySign: "sign-highway-detailed.glb"
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
  "guitar",

  "cityBuildingA",
  "cityBuildingB",
  "cityBuildingC",
  "cityBuildingD",

  "cityTowerA",
  "cityTowerB",

  "cityMan",
  "cityWoman",
  "cityAdult",

  "cityTruck",
  "citySign"
];

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

  if (!gltf || !gltf.scene) {
    throw new Error("Empty GLB asset: " + file);
  }

  gltf.scene.traverse(object => {
    if (!object.isMesh) return;

    object.castShadow = true;
    object.receiveShadow = true;

    const materials = Array.isArray(object.material)
      ? object.material
      : [object.material];

    for (const material of materials) {
      if (material && material.map) {
        material.map.colorSpace = THREE.SRGBColorSpace;
      }
    }
  });

  assetLibrary[name] = gltf;

  return gltf;
}

function cloneModel(name) {
  const gltf = assetLibrary[name];

  if (!gltf || !gltf.scene) {
    throw new Error("Model not loaded: " + name);
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

/* =====================================================
   ACTOR SYSTEM
===================================================== */

function makeActor(
  assetName,
  targetHeight,
  position = { x: 0, y: 0, z: 0 },
  options = {}
) {
  const model = cloneModel(assetName);

  fitModel(model, targetHeight);

  const root = new THREE.Group();
  root.add(model);

  root.position.set(
    position.x || 0,
    position.y || 0,
    position.z || 0
  );

  scene.add(root);

  const clips = assetLibrary[assetName]?.animations || [];
  const mixer = new THREE.AnimationMixer(model);

  const animationMap = {};

  for (const clip of clips) {
    const name = clip.name.toLowerCase();

    if (
      name.includes("idle") ||
      name.includes("stand") ||
      name.includes("breath")
    ) {
      animationMap.idle ||= clip;
    }

    if (
      name.includes("walk") ||
      name.includes("walking")
    ) {
      animationMap.walk ||= clip;
    }

    if (
      name.includes("run") ||
      name.includes("running")
    ) {
      animationMap.run ||= clip;
    }

    if (
      name.includes("jump") ||
      name.includes("leap")
    ) {
      animationMap.jump ||= clip;
    }

    if (
      name.includes("graze") ||
      name.includes("eat")
    ) {
      animationMap.graze ||= clip;
    }
  }

  let currentAction = null;
  let currentAnimation = "";

  function changeAnimation(animationName) {
    let clip = animationMap[animationName];

    if (!clip && animationName === "run") {
      clip = animationMap.walk || animationMap.idle;
    }

    if (!clip && animationName === "jump") {
      clip = animationMap.idle;
    }

    if (!clip) {
      clip = animationMap.idle;
    }

    if (!clip) return;

    if (currentAnimation === animationName && currentAction) {
      return;
    }

    const nextAction = mixer.clipAction(clip);

    nextAction.reset();
    nextAction.enabled = true;
    nextAction.setEffectiveWeight(1);
    nextAction.setEffectiveTimeScale(
      animationName === "run" ? 1.2 : 1
    );

    nextAction.fadeIn(0.18);

    if (currentAction && currentAction !== nextAction) {
      currentAction.fadeOut(0.18);
    }

    nextAction.play();

    currentAction = nextAction;
    currentAnimation = animationName;
  }

  const actor = {
    root,
    model,
    mixer,
    animationMap,
    changeAnimation,

    currentAnimation: () => currentAnimation,

    phase: Math.random() * Math.PI * 2,
    breathingAmount: options.breathingAmount ?? 0.006,
    baseModelY: model.position.y,
    baseScale: model.scale.clone(),

    active: true,
    isMoving: false,
    type: options.type || "person"
  };

  changeAnimation("idle");

  return actor;
}

/* =====================================================
   NATURAL BREATHING AND IDLE MOVEMENT
===================================================== */

function updateActorBreathing(actor, dt, intensity = 1) {
  if (!actor || !actor.active) return;

  actor.phase += dt;

  const wave = Math.sin(actor.phase * 2.1);

  const amount = actor.breathingAmount * intensity;

  actor.model.scale.y =
    actor.baseScale.y * (1 + wave * amount);

  actor.model.position.y =
    actor.baseModelY +
    Math.abs(wave) * amount * 0.12;

  if (!actor.isMoving) {
    actor.root.rotation.z =
      Math.sin(actor.phase * 0.65) * 0.006 * intensity;

    actor.root.rotation.x =
      Math.sin(actor.phase * 0.45) * 0.004 * intensity;
  }

  if (actor.type === "animal") {
    actor.root.rotation.y +=
      Math.sin(actor.phase * 0.35) * 0.0008;
  }

  if (actor.type === "person" && !actor.isMoving) {
    actor.root.rotation.y +=
      Math.sin(actor.phase * 0.25) * 0.00035;
  }

  actor.mixer.update(dt);
}

/* =====================================================
   TREE, SHOP AND WELL ASSETS
===================================================== */

/* =====================================================
   TREE, SHOP AND WELL ASSETS
===================================================== */

const worldObjects = [];

function addImportedObject(
  assetName,
  position,
  targetSize,
  rotation = 0
) {
  if (!assetLibrary[assetName]) {
    console.warn("Asset unavailable:", assetName);
    return null;
  }

  const model = cloneModel(assetName);
  fitModel(model, targetSize);

  model.position.set(
    position.x,
    position.y || 0,
    position.z
  );

  model.rotation.y = rotation;

  scene.add(model);
  worldObjects.push(model);

  return model;
}

function createVillageTrees() {
  const treePositions = [
    [-145, -170], [-155, -110], [-145, -55],
    [-155, 20], [-145, 80], [-150, 145],
    [145, -165], [155, -105], [150, -45],
    [155, 20], [145, 85], [150, 155],
    [-45, -150], [45, -155],
    [-48, 150], [48, 155],
    [-185, -180], [-185, 180],
    [185, -180], [185, 180],
    [-70, 15], [75, 30],
    [-70, 120], [75, -120]
  ];

  for (const [x, z] of treePositions) {
    addImportedObject(
      "tree",
      { x, y: 0, z },
      7 + Math.random() * 2,
      Math.random() * Math.PI * 2
    );
  }
}

function createVillageShop() {
  addImportedObject(
    "shop",
    { x: 12, y: 0, z: 8 },
    6,
    Math.PI
  );
}

function createVillageWell() {
  addImportedObject(
    "well",
    { x: -13, y: 0, z: 12 },
    2.5,
    0
  );
}

function createVillageTileDecorations() {
  if (!assetLibrary.villageTile) return;

  const positions = [
    [-35, -150],
    [35, -150],
    [-35, 150],
    [35, 150]
  ];

  for (const [x, z] of positions) {
    addImportedObject(
      "villageTile",
      { x, y: 0, z },
      3,
      Math.random() * Math.PI * 2
    );
  }
}

/* =====================================================
   PEOPLE AND NPCs
===================================================== */

function createPeople() {
  const people = [
    {
      asset: "man",
      height: 1.75,
      x: -8,
      z: -12
    },
    {
      asset: "man",
      height: 1.72,
      x: 18,
      z: -20
    },
    {
      asset: "man",
      height: 1.75,
      x: -28,
      z: 20
    },
    {
      asset: "childGirl",
      height: 1.15,
      x: 8,
      z: 18
    },
    {
      asset: "childBoy",
      height: 1.2,
      x: 15,
      z: 22
    },
    {
      asset: "elderlyWoman",
      height: 1.55,
      x: -18,
      z: 28
    },
    {
      asset: "grandfather",
      height: 1.65,
      x: 27,
      z: 28
    }
  ];

  for (const person of people) {
    if (!assetLibrary[person.asset]) continue;

    const actor = makeActor(
      person.asset,
      person.height,
      {
        x: person.x,
        y: 0,
        z: person.z
      },
      {
        type: "person",
        breathingAmount: 0.008
      }
    );

    actor.root.rotation.y =
      Math.random() * Math.PI * 2;

    villagers.push({
      actor,
      homeX: person.x,
      homeZ: person.z,
      phase: Math.random() * Math.PI * 2,
      turnSpeed: 0.12 + Math.random() * 0.18,
      nextLook: 2 + Math.random() * 5
    });
  }
}

/* =====================================================
   ANIMAL SYSTEM
===================================================== */

function createAnimal(
  assetName,
  height,
  x,
  z,
  scaleVariation = 1
) {
  if (!assetLibrary[assetName]) return null;

  const actor = makeActor(
    assetName,
    height * scaleVariation,
    { x, y: 0, z },
    {
      type: "animal",
      breathingAmount: 0.012
    }
  );

  actor.root.rotation.y =
    Math.random() * Math.PI * 2;

  animals.push({
    actor,
    homeX: x,
    homeZ: z,
    phase: Math.random() * Math.PI * 2,
    wanderTimer: 3 + Math.random() * 6,
    targetX: x,
    targetZ: z,
    speed: 0.35 + Math.random() * 0.25
  });

  return actor;
}

function createFarmAnimals() {
  createAnimal("cow", 1.55, -34, -105, 1);
  createAnimal("cow", 1.55, -38, -110, 0.95);
  createAnimal("cow", 1.55, 38, -75, 1);

  createAnimal("bull", 1.7, 42, -80, 1);
  createAnimal("bull", 1.7, -42, 85, 0.95);

  createAnimal("goat", 0.9, -35, 82, 1);
  createAnimal("goat", 0.9, -30, 87, 0.95);
  createAnimal("goat", 0.9, 42, 150, 1);
}

/* =====================================================
   GERMAN SHEPHERD
===================================================== */

function createDog() {
  dogActor = makeActor(
    "dog",
    0.9,
    { x: 4, y: 0, z: -5 },
    {
      type: "animal",
      breathingAmount: 0.014
    }
  );

  dogActor.changeAnimation("idle");
}

/* =====================================================
   ANIMAL WANDERING
===================================================== */

function updateAnimals(dt) {
  for (const animal of animals) {
    const actor = animal.actor;

    animal.phase += dt;
    animal.wanderTimer -= dt;

    if (animal.wanderTimer <= 0) {
      animal.wanderTimer =
        4 + Math.random() * 7;

      animal.targetX =
        animal.homeX + (Math.random() - 0.5) * 8;

      animal.targetZ =
        animal.homeZ + (Math.random() - 0.5) * 8;
    }

    const dx =
      animal.targetX - actor.root.position.x;

    const dz =
      animal.targetZ - actor.root.position.z;

    const distance = Math.hypot(dx, dz);

    if (distance > 0.4) {
      const nx = dx / distance;
      const nz = dz / distance;

      actor.root.position.x +=
        nx * animal.speed * dt;

      actor.root.position.z +=
        nz * animal.speed * dt;

      actor.root.rotation.y =
        Math.atan2(nx, nz);

      actor.isMoving = true;
      actor.changeAnimation("walk");
    } else {
      actor.isMoving = false;

      actor.changeAnimation(
        actor.animationMap.graze
          ? "graze"
          : "idle"
      );
    }

    updateActorBreathing(actor, dt, 1);
  }
}

/* =====================================================
   DOG FOLLOW BEHAVIOUR
===================================================== */

function updateDog(dt) {
  if (!dogActor || !playerActor) return;

  const dog = dogActor.root;
  const player = playerActor.root;

  const dx = player.position.x - dog.position.x;
  const dz = player.position.z - dog.position.z;

  const distance = Math.hypot(dx, dz);

  if (distance > 3.2) {
    const nx = dx / distance;
    const nz = dz / distance;

    const speed = distance > 8 ? 4.2 : 2.1;

    dog.position.x += nx * speed * dt;
    dog.position.z += nz * speed * dt;

    dog.rotation.y = Math.atan2(nx, nz);

    dogActor.isMoving = true;

    dogActor.changeAnimation(
      distance > 8 ? "run" : "walk"
    );
  } else {
    dogActor.isMoving = false;
    dogActor.changeAnimation("idle");
  }

  updateActorBreathing(dogActor, dt, 1);
}

/* =====================================================
   VEHICLE SYSTEM — PARKED VEHICLES
===================================================== */

function createVehicle(
  assetName,
  targetLength,
  x,
  z,
  rotation = 0
) {
  if (!assetLibrary[assetName]) return null;

  const model = cloneModel(assetName);

  fitVehicle(model, targetLength);

  model.position.set(x, 0, z);
  model.rotation.y = rotation;

  scene.add(model);

  traffic.push({
    model,
    assetName,
    startX: x,
    startZ: z,
    direction: rotation,
    speed: 0,
    phase: Math.random() * Math.PI * 2
  });

  return model;
}

function createVehicles() {
  createVehicle(
    "tractor",
    4.8,
    -32, -95,
    Math.PI / 2
  );

  createVehicle(
    "car",
    4.5,
    60, -140,
    Math.PI
  );

  createVehicle(
    "motorcycle",
    2.2,
    -60, 145,
    Math.PI / 2
  );
}

/* =====================================================
   BICYCLES
===================================================== */

const bicycles = [];

function createBicycle(
  assetName,
  x,
  z,
  rotation = 0
) {
  if (!assetLibrary[assetName]) return;

  const model = cloneModel(assetName);

  fitVehicle(model, 1.9);

  model.position.set(x, 0, z);
  model.rotation.y = rotation;

  scene.add(model);

  bicycles.push({
    model,
    x,
    z,
    rotation
  });
}

function createBicycles() {
  createBicycle("electricBike", 20, 5, Math.PI);
  createBicycle("mountainBike", -20, 8, 0);
  createBicycle("bmxBike", 20, 25, Math.PI / 2);
}

/* =====================================================
   GUITAR PROP
===================================================== */

function createGuitarProp() {
  if (!assetLibrary.guitar) return;

  const guitar = cloneModel("guitar");

  fitModel(guitar, 0.9);

  guitar.position.set(3, 0.1, 8);
  guitar.rotation.y = Math.PI / 2;

  scene.add(guitar);
}

/* =====================================================
   BIRD SYSTEM
===================================================== */

function createBird(x, y, z) {
  const bird = new THREE.Group();

  const bodyMaterial = mat(0x34312c);
  const wingMaterial = mat(0x4a453d);

  const body = addMesh(
    bird,
    new THREE.SphereGeometry(0.15, 10, 8),
    bodyMaterial
  );

  body.scale.set(1.5, 0.75, 0.8);

  const leftWing = addMesh(
    bird,
    new THREE.BoxGeometry(0.55, 0.035, 0.16),
    wingMaterial,
    -0.32, 0, 0
  );

  const rightWing = addMesh(
    bird,
    new THREE.BoxGeometry(0.55, 0.035, 0.16),
    wingMaterial,
    0.32, 0, 0
  );

  bird.position.set(x, y, z);

  scene.add(bird);

  birds.push({
    bird,
    leftWing,
    rightWing,
    originX: x,
    originY: y,
    originZ: z,
    phase: Math.random() * Math.PI * 2,
    speed: 1.5 + Math.random() * 1.5,
    radius: 5 + Math.random() * 8
  });
}

function createBirds() {
  createBird(-35, 16, -35);
  createBird(35, 20, 45);
  createBird(-65, 18, 80);
  createBird(75, 22, -95);
  createBird(0, 25, 110);
}

function updateBirds(dt) {
  for (const bird of birds) {
    bird.phase += dt * bird.speed;

    const angle = bird.phase * 0.2;

    bird.bird.position.x =
      bird.originX +
      Math.cos(angle) * bird.radius;

    bird.bird.position.z =
      bird.originZ +
      Math.sin(angle) * bird.radius;

    bird.bird.position.y =
      bird.originY +
      Math.sin(bird.phase * 2) * 0.45;

    const flap = Math.sin(bird.phase * 8) * 0.5;

    bird.leftWing.rotation.z = flap;
    bird.rightWing.rotation.z = -flap;

    bird.bird.rotation.y = -angle;
  }
}

/* =====================================================
   NPC IDLE LOOKING
===================================================== */

function updateVillagers(dt) {
  for (const person of villagers) {
    const actor = person.actor;

    person.phase += dt;
    person.nextLook -= dt;

    if (person.nextLook <= 0) {
      person.nextLook =
        3 + Math.random() * 6;

      person.turnSpeed =
        (Math.random() - 0.5) * 0.7;
    }

    actor.root.rotation.y +=
      person.turnSpeed * dt * 0.12;

    updateActorBreathing(actor, dt, 1);
  }
}

/* =====================================================
   HAMRO BASTI — MOBILE GAME UI
===================================================== */

const hbInput = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  run: false,
  jump: false,
  interact: false
};

let hbGamePaused = false;
let hbMenuOpen = true;

/* =====================================================
   UI STYLE
===================================================== */

function createGameUI() {
  const style = document.createElement("style");

  style.textContent = `
    #hbGameUI {
      position: fixed;
      inset: 0;
      z-index: 1000;
      pointer-events: none;
      font-family: Arial, sans-serif;
      color: white;
      user-select: none;
      -webkit-user-select: none;
    }

    #hbLocation {
      position: absolute;
      top: 18px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0,0,0,.55);
      padding: 9px 16px;
      border-radius: 20px;
      font-size: 12px;
      letter-spacing: 2px;
      white-space: nowrap;
    }

    #hbStatus {
      position: absolute;
      top: 18px;
      left: 15px;
      background: rgba(0,0,0,.55);
      padding: 9px 12px;
      border-radius: 10px;
      font-size: 11px;
    }

    #hbControls {
      position: absolute;
      inset: 0;
      pointer-events: none;
    }

    .hb-btn {
      pointer-events: auto;
      border: 1px solid rgba(255,255,255,.35);
      background: rgba(15,20,24,.62);
      color: white;
      border-radius: 50%;
      width: 58px;
      height: 58px;
      font-size: 13px;
      font-weight: bold;
      touch-action: none;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 3px 12px rgba(0,0,0,.3);
    }

    .hb-btn:active {
      background: rgba(70,130,90,.85);
      transform: scale(.94);
    }

    #hbJoystick {
      position: absolute;
      left: 24px;
      bottom: 30px;
      width: 150px;
      height: 150px;
      pointer-events: auto;
      touch-action: none;
      border-radius: 50%;
      background: rgba(255,255,255,.09);
      border: 2px solid rgba(255,255,255,.25);
    }

    #hbJoystickKnob {
      position: absolute;
      left: 50%;
      top: 50%;
      width: 58px;
      height: 58px;
      transform: translate(-50%,-50%);
      border-radius: 50%;
      background: rgba(255,255,255,.35);
      border: 2px solid rgba(255,255,255,.7);
    }

    #hbActionButtons {
      position: absolute;
      right: 20px;
      bottom: 28px;
      width: 180px;
      height: 160px;
      pointer-events: none;
    }

    #hbJump {
      position: absolute;
      right: 5px;
      bottom: 0;
    }

    #hbRun {
      position: absolute;
      right: 82px;
      bottom: 18px;
      width: 52px;
      height: 52px;
    }

    #hbInteract {
      position: absolute;
      right: 78px;
      bottom: 92px;
      width: 48px;
      height: 48px;
      font-size: 11px;
    }

    #hbPause {
      position: absolute;
      right: 15px;
      top: 15px;
      width: 42px;
      height: 42px;
      border-radius: 12px;
      pointer-events: auto;
    }

    #hbGameMenu {
      position: absolute;
      inset: 0;
      background: rgba(0,0,0,.82);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 15px;
      pointer-events: auto;
      text-align: center;
    }

    #hbGameMenu h1 {
      font-size: 34px;
      letter-spacing: 5px;
      margin: 0;
      text-shadow: 0 4px 18px rgba(0,0,0,.8);
    }

    #hbGameMenu p {
      color: #ccc;
      font-size: 13px;
      margin: 0 20px 15px;
      line-height: 1.6;
    }

    .hb-menu-btn {
      width: 220px;
      padding: 14px;
      border: 1px solid rgba(255,255,255,.35);
      border-radius: 9px;
      background: #315b42;
      color: white;
      font-size: 15px;
      font-weight: bold;
    }

    #hbPauseMenu {
      position: absolute;
      inset: 0;
      display: none;
      background: rgba(0,0,0,.75);
      align-items: center;
      justify-content: center;
      flex-direction: column;
      gap: 12px;
      pointer-events: auto;
    }

    #hbPauseMenu h2 {
      letter-spacing: 3px;
    }

    @media (max-width: 600px) {
      #hbLocation {
        top: 12px;
        font-size: 10px;
      }

      #hbStatus {
        top: 12px;
        left: 10px;
        font-size: 9px;
      }

      #hbJoystick {
        left: 14px;
        bottom: 18px;
        width: 125px;
        height: 125px;
      }

      #hbJoystickKnob {
        width: 50px;
        height: 50px;
      }

      #hbActionButtons {
        right: 8px;
        bottom: 14px;
        transform: scale(.9);
        transform-origin: bottom right;
      }
    }
  `;

  document.head.appendChild(style);

  const ui = document.createElement("div");
  ui.id = "hbGameUI";

  ui.innerHTML = `
    <div id="hbLocation">NAYABASTI VILLAGE</div>

    <div id="hbStatus">
      HAMRO BASTI<br>
      <span id="hbGameState">READY</span>
    </div>

    <button class="hb-btn" id="hbPause">Ⅱ</button>

    <div id="hbControls">
      <div id="hbJoystick">
        <div id="hbJoystickKnob"></div>
      </div>

      <div id="hbActionButtons">
        <button class="hb-btn" id="hbJump">JUMP</button>
        <button class="hb-btn" id="hbRun">RUN</button>
        <button class="hb-btn" id="hbInteract">USE</button>
      </div>
    </div>

    <div id="hbGameMenu">
      <h1>HAMRO BASTI</h1>
      <p>
        Explore Nayabasti village and travel towards Narayangadh city.
        Your journey starts here.
      </p>
      <button class="hb-menu-btn" id="hbStart">START GAME</button>
      <button class="hb-menu-btn" id="hbMenuHelp">HOW TO PLAY</button>
    </div>

    <div id="hbPauseMenu">
      <h2>GAME PAUSED</h2>
      <button class="hb-menu-btn" id="hbResume">RESUME</button>
      <button class="hb-menu-btn" id="hbRestart">RESTART</button>
    </div>
  `;

  document.body.appendChild(ui);

  setupJoystick();
  setupActionButtons();
  setupGameMenu();
}

/* =====================================================
   MOBILE JOYSTICK
===================================================== */

function setupJoystick() {
  const joystick =
    document.getElementById("hbJoystick");

  const knob =
    document.getElementById("hbJoystickKnob");

  if (!joystick || !knob) return;

  let activePointer = null;

  function moveJoystick(event) {
    const rect = joystick.getBoundingClientRect();

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let dx = event.clientX - centerX;
    let dy = event.clientY - centerY;

    const maxDistance = rect.width * 0.34;
    const distance = Math.hypot(dx, dy);

    if (distance > maxDistance) {
      dx = dx / distance * maxDistance;
      dy = dy / distance * maxDistance;
    }

    knob.style.left =
      `calc(50% + ${dx}px)`;

    knob.style.top =
      `calc(50% + ${dy}px)`;

    const normalizedX = dx / maxDistance;
    const normalizedY = dy / maxDistance;

    hbInput.left = normalizedX < -0.22;
    hbInput.right = normalizedX > 0.22;

    hbInput.forward = normalizedY < -0.22;
    hbInput.backward = normalizedY > 0.22;
  }

  function resetJoystick() {
    knob.style.left = "50%";
    knob.style.top = "50%";

    hbInput.forward = false;
    hbInput.backward = false;
    hbInput.left = false;
    hbInput.right = false;

    activePointer = null;
  }

  joystick.addEventListener("pointerdown", event => {
    if (hbGamePaused || hbMenuOpen) return;

    activePointer = event.pointerId;
    joystick.setPointerCapture(event.pointerId);

    moveJoystick(event);
  });

  joystick.addEventListener("pointermove", event => {
    if (event.pointerId !== activePointer) return;

    moveJoystick(event);
  });

  joystick.addEventListener("pointerup", event => {
    if (event.pointerId === activePointer) {
      resetJoystick();
    }
  });

  joystick.addEventListener("pointercancel", resetJoystick);
  joystick.addEventListener("lostpointercapture", resetJoystick);
}

/* =====================================================
   ACTION BUTTONS
===================================================== */

function bindHoldButton(id, inputName) {
  const button = document.getElementById(id);

  if (!button) return;

  button.addEventListener("pointerdown", event => {
    event.preventDefault();

    if (hbGamePaused || hbMenuOpen) return;

    hbInput[inputName] = true;

    button.setPointerCapture(event.pointerId);
  });

  const release = () => {
    hbInput[inputName] = false;
  };

  button.addEventListener("pointerup", release);
  button.addEventListener("pointercancel", release);
  button.addEventListener("lostpointercapture", release);
}

function setupActionButtons() {
  bindHoldButton("hbRun", "run");

  const jumpButton =
    document.getElementById("hbJump");

  if (jumpButton) {
    jumpButton.addEventListener("pointerdown", event => {
      event.preventDefault();

      if (hbGamePaused || hbMenuOpen) return;

      hbInput.jump = true;
    });

    jumpButton.addEventListener("pointerup", () => {
      hbInput.jump = false;
    });

    jumpButton.addEventListener("pointercancel", () => {
      hbInput.jump = false;
    });
  }

  const interactButton =
    document.getElementById("hbInteract");

  if (interactButton) {
    interactButton.addEventListener("pointerdown", event => {
      event.preventDefault();

      if (hbGamePaused || hbMenuOpen) return;

      hbInput.interact = true;
    });

    interactButton.addEventListener("pointerup", () => {
      hbInput.interact = false;
    });

    interactButton.addEventListener("pointercancel", () => {
      hbInput.interact = false;
    });
  }
}

/* =====================================================
   KEYBOARD CONTROLS
===================================================== */

window.addEventListener("keydown", event => {
  if (hbGamePaused || hbMenuOpen) return;

  switch (event.code) {
    case "KeyW":
    case "ArrowUp":
      hbInput.forward = true;
      break;

    case "KeyS":
    case "ArrowDown":
      hbInput.backward = true;
      break;

    case "KeyA":
    case "ArrowLeft":
      hbInput.left = true;
      break;

    case "KeyD":
    case "ArrowRight":
      hbInput.right = true;
      break;

    case "ShiftLeft":
    case "ShiftRight":
      hbInput.run = true;
      break;

    case "Space":
      hbInput.jump = true;
      event.preventDefault();
      break;

    case "KeyE":
      hbInput.interact = true;
      break;

    case "Escape":
      togglePauseMenu();
      break;
  }
});

window.addEventListener("keyup", event => {
  switch (event.code) {
    case "KeyW":
    case "ArrowUp":
      hbInput.forward = false;
      break;

    case "KeyS":
    case "ArrowDown":
      hbInput.backward = false;
      break;

    case "KeyA":
    case "ArrowLeft":
      hbInput.left = false;
      break;

    case "KeyD":
    case "ArrowRight":
      hbInput.right = false;
      break;

    case "ShiftLeft":
    case "ShiftRight":
      hbInput.run = false;
      break;

    case "Space":
      hbInput.jump = false;
      break;

    case "KeyE":
      hbInput.interact = false;
      break;
  }
});

/* =====================================================
   GAME MENU
===================================================== */

function setupGameMenu() {
  const startButton =
    document.getElementById("hbStart");

  const helpButton =
    document.getElementById("hbMenuHelp");

  const pauseButton =
    document.getElementById("hbPause");

  const resumeButton =
    document.getElementById("hbResume");

  const restartButton =
    document.getElementById("hbRestart");

  if (startButton) {
    startButton.addEventListener("click", () => {
      hbMenuOpen = false;

      document.getElementById("hbGameMenu").style.display =
        "none";

      document.getElementById("hbGameState").textContent =
        "PLAYING";
    });
  }

  if (helpButton) {
    helpButton.addEventListener("click", () => {
      alert(
        "W / ↑ = Move forward\n" +
        "S / ↓ = Move backward\n" +
        "A / ← = Move left\n" +
        "D / → = Move right\n" +
        "SHIFT = Run\n" +
        "SPACE = Jump\n" +
        "E = Interact\n\n" +
        "Mobile: Use joystick and action buttons."
      );
    });
  }

  if (pauseButton) {
    pauseButton.addEventListener("click", togglePauseMenu);
  }

  if (resumeButton) {
    resumeButton.addEventListener("click", () => {
      hbGamePaused = false;

      document.getElementById("hbPauseMenu").style.display =
        "none";

      document.getElementById("hbGameState").textContent =
        "PLAYING";
    });
  }

  if (restartButton) {
    restartButton.addEventListener("click", () => {
      location.reload();
    });
  }
}

/* =====================================================
   PAUSE SYSTEM
===================================================== */

function togglePauseMenu() {
  if (hbMenuOpen) return;

  hbGamePaused = !hbGamePaused;

  const pauseMenu =
    document.getElementById("hbPauseMenu");

  if (pauseMenu) {
    pauseMenu.style.display =
      hbGamePaused ? "flex" : "none";
  }

  const state =
    document.getElementById("hbGameState");

  if (state) {
    state.textContent =
      hbGamePaused ? "PAUSED" : "PLAYING";
  }

  if (hbGamePaused) {
    hbInput.forward = false;
    hbInput.backward = false;
    hbInput.left = false;
    hbInput.right = false;
    hbInput.run = false;
    hbInput.jump = false;
    hbInput.interact = false;
  }
}

/* =====================================================
   LOCATION LABEL
===================================================== */

function updateLocationLabel() {
  if (!playerActor) return;

  const z = playerActor.root.position.z;

  const label =
    document.getElementById("hbLocation");

  if (!label) return;

  if (z < 230) {
    label.textContent = "NAYABASTI VILLAGE";
  } else if (z < 850) {
    label.textContent = "RURAL HIGHWAY";
  } else if (z < 1120) {
    label.textContent = "RIVER BRIDGE";
  } else if (z < 1530) {
    label.textContent = "CITY OUTSKIRTS";
  } else {
    label.textContent = "NARAYANGADH CITY";
  }
}

/* =====================================================
   UI INITIALIZATION
===================================================== */

createGameUI();

/* =====================================================
   PLAYER MOVEMENT SYSTEM
===================================================== */

const playerPhysics = {
  velocityY: 0,
  gravity: 22,
  jumpPower: 8.5,
  grounded: true,
  walkSpeed: 2.1,
  runSpeed: 5.2,
  rotationSpeed: 10,
  isMoving: false,
  jumpPressed: false
};

/* =====================================================
   PLAYER CREATION
===================================================== */

function createPlayer() {
  if (!assetLibrary.player) {
    console.error("Player model missing");
    return;
  }

  playerActor = makeActor(
    "player",
    1.8,
    { x: 0, y: 0, z: 0 },
    {
      type: "player",
      breathingAmount: 0.012
    }
  );

  playerActor.root.position.set(0, 0, 0);

  playerActor.root.rotation.y = Math.PI;

  playerActor.isMoving = false;

  scene.add(playerActor.root);
}

/* =====================================================
   CAMERA TARGET
===================================================== */

const cameraSettings = {
  distance: 5.2,
  height: 2.8,
  lookHeight: 1.45,
  smoothness: 7,
  rotation: 0,
  pitch: 0.12
};

const cameraTarget = new THREE.Vector3();
const cameraDesired = new THREE.Vector3();
const cameraLookTarget = new THREE.Vector3();

function updateCamera(dt) {
  if (!playerActor) return;

  const player = playerActor.root;

  const forwardX = Math.sin(cameraSettings.rotation);
  const forwardZ = Math.cos(cameraSettings.rotation);

  cameraDesired.set(
    player.position.x -
      forwardX * cameraSettings.distance,

    player.position.y +
      cameraSettings.height,

    player.position.z -
      forwardZ * cameraSettings.distance
  );

  const alpha = 1 -
    Math.exp(-cameraSettings.smoothness * dt);

  cameraTarget.lerp(cameraDesired, alpha);

  camera.position.copy(cameraTarget);

  cameraLookTarget.set(
    player.position.x,
    player.position.y + cameraSettings.lookHeight,
    player.position.z
  );

  camera.lookAt(cameraLookTarget);
}

/* =====================================================
   PLAYER ROTATION
===================================================== */

function rotatePlayerToward(x, z, dt) {
  if (!playerActor) return;

  const targetAngle = Math.atan2(x, z);

  let currentAngle = playerActor.root.rotation.y;

  let difference =
    targetAngle - currentAngle;

  difference = Math.atan2(
    Math.sin(difference),
    Math.cos(difference)
  );

  playerActor.root.rotation.y +=
    difference *
    Math.min(1, playerPhysics.rotationSpeed * dt);
}

/* =====================================================
   PLAYER JUMP
===================================================== */

function updatePlayerJump(dt) {
  if (!playerActor) return;

  const player = playerActor.root;

  if (hbInput.jump && !playerPhysics.jumpPressed) {
    playerPhysics.jumpPressed = true;

    if (playerPhysics.grounded) {
      playerPhysics.velocityY =
        playerPhysics.jumpPower;

      playerPhysics.grounded = false;

      playerActor.changeAnimation("jump");
    }
  }

  if (!hbInput.jump) {
    playerPhysics.jumpPressed = false;
  }

  if (!playerPhysics.grounded) {
    playerPhysics.velocityY -=
      playerPhysics.gravity * dt;

    player.position.y +=
      playerPhysics.velocityY * dt;

    if (player.position.y <= 0) {
      player.position.y = 0;

      playerPhysics.velocityY = 0;
      playerPhysics.grounded = true;
    }
  }
}

/* =====================================================
   PLAYER MOVEMENT
===================================================== */

function updatePlayer(dt) {
  if (!playerActor || hbGamePaused || hbMenuOpen) return;

  const player = playerActor.root;

  let moveX = 0;
  let moveZ = 0;

  if (hbInput.forward) moveZ += 1;
  if (hbInput.backward) moveZ -= 1;
  if (hbInput.left) moveX -= 1;
  if (hbInput.right) moveX += 1;

  const inputLength =
    Math.hypot(moveX, moveZ);

  if (inputLength > 0) {
    moveX /= inputLength;
    moveZ /= inputLength;

    const cameraAngle =
      cameraSettings.rotation;

    const worldX =
      moveX * Math.cos(cameraAngle) +
      moveZ * Math.sin(cameraAngle);

    const worldZ =
      moveZ * Math.cos(cameraAngle) -
      moveX * Math.sin(cameraAngle);

    const speed = hbInput.run
      ? playerPhysics.runSpeed
      : playerPhysics.walkSpeed;

    player.position.x +=
      worldX * speed * dt;

    player.position.z +=
      worldZ * speed * dt;

    rotatePlayerToward(worldX, worldZ, dt);

    playerPhysics.isMoving = true;
    playerActor.isMoving = true;

    if (playerPhysics.grounded) {
      playerActor.changeAnimation(
        hbInput.run ? "run" : "walk"
      );
    }
  } else {
    playerPhysics.isMoving = false;
    playerActor.isMoving = false;

    if (playerPhysics.grounded) {
      playerActor.changeAnimation("idle");
    }
  }

  /* WORLD BOUNDARY */

  player.position.x = THREE.MathUtils.clamp(
    player.position.x,
    -350,
    350
  );

  player.position.z = THREE.MathUtils.clamp(
    player.position.z,
    -235,
    2450
  );

  /* JUMP PHYSICS */

  updatePlayerJump(dt);

  /* BREATHING */

  updateActorBreathing(
    playerActor,
    dt,
    playerPhysics.isMoving ? 0.55 : 1
  );
}

/* =====================================================
   CAMERA ROTATION INPUT
===================================================== */

let cameraTouchStartX = null;
let cameraTouchStartY = null;

let cameraTouchActive = false;

renderer.domElement.addEventListener(
  "touchstart",
  event => {
    if (event.touches.length !== 1) return;

    const touch = event.touches[0];

    if (touch.clientX < window.innerWidth * 0.35) {
      return;
    }

    cameraTouchStartX = touch.clientX;
    cameraTouchStartY = touch.clientY;

    cameraTouchActive = true;
  },
  { passive: true }
);

renderer.domElement.addEventListener(
  "touchmove",
  event => {
    if (!cameraTouchActive || event.touches.length !== 1) {
      return;
    }

    const touch = event.touches[0];

    const deltaX =
      touch.clientX - cameraTouchStartX;

    const deltaY =
      touch.clientY - cameraTouchStartY;

    cameraSettings.rotation -= deltaX * 0.004;

    cameraSettings.pitch = THREE.MathUtils.clamp(
      cameraSettings.pitch + deltaY * 0.002,
      -0.25,
      0.45
    );

    cameraTouchStartX = touch.clientX;
    cameraTouchStartY = touch.clientY;
  },
  { passive: true }
);

renderer.domElement.addEventListener(
  "touchend",
  () => {
    cameraTouchActive = false;
  }
);

/* =====================================================
   CAMERA PITCH
===================================================== */

function updateCameraPitch() {
  if (!playerActor) return;

  const player = playerActor.root;

  const forwardX =
    Math.sin(cameraSettings.rotation);

  const forwardZ =
    Math.cos(cameraSettings.rotation);

  cameraDesired.set(
    player.position.x -
      forwardX * cameraSettings.distance,

    player.position.y +
      cameraSettings.height +
      cameraSettings.pitch * 3,

    player.position.z -
      forwardZ * cameraSettings.distance
  );
}

/* =====================================================
   INTERACTION DETECTION
===================================================== */

let nearbyInteractable = null;

function findNearbyInteractable() {
  if (!playerActor) return null;

  const player = playerActor.root.position;

  let nearest = null;
  let nearestDistance = 3.5;

  for (const vehicle of traffic) {
    if (!vehicle.model) continue;

    const distance = player.distanceTo(
      vehicle.model.position
    );

    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearest = {
        type: "vehicle",
        object: vehicle
      };
    }
  }

  for (const bicycle of bicycles) {
    if (!bicycle.model) continue;

    const distance = player.distanceTo(
      bicycle.model.position
    );

    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearest = {
        type: "bicycle",
        object: bicycle
      };
    }
  }

  return nearest;
}

function updateInteraction() {
  nearbyInteractable =
    findNearbyInteractable();

  const button =
    document.getElementById("hbInteract");

  if (!button) return;

  button.textContent =
    nearbyInteractable
      ? nearbyInteractable.type === "vehicle"
        ? "CAR"
        : "BIKE"
      : "USE";
}

/* =====================================================
   PLAYER INTERACTION
===================================================== */

function handlePlayerInteraction() {
  if (!hbInput.interact) return;

  hbInput.interact = false;

  if (!nearbyInteractable) return;

  console.log(
    "Nearby:",
    nearbyInteractable.type
  );

  // Vehicle riding system will be connected in Part 6.
}

/* =====================================================
   CAMERA UPDATE
===================================================== */

function updateCameraSystem(dt) {
  updateCameraPitch();
  updateCamera(dt);
}

/* =====================================================
   VEHICLE RIDING SYSTEM
===================================================== */

const ridingState = {
  active: false,
  type: null,
  vehicle: null,
  speed: 0,
  maxSpeed: 0,
  acceleration: 0,
  turnSpeed: 0,
  originalPosition: null
};

function getVehicleSettings(type) {
  if (type === "bicycle") {
    return {
      maxSpeed: 7,
      acceleration: 3,
      turnSpeed: 2.2
    };
  }

  if (type === "motorcycle") {
    return {
      maxSpeed: 19,
      acceleration: 7,
      turnSpeed: 1.7
    };
  }

  if (type === "tractor") {
    return {
      maxSpeed: 8,
      acceleration: 2.5,
      turnSpeed: 1.1
    };
  }

  return {
    maxSpeed: 15,
    acceleration: 5,
    turnSpeed: 1.4
  };
}

/* =====================================================
   ENTER VEHICLE
===================================================== */

function enterVehicle(target) {
  if (!target || !playerActor) return;
  if (ridingState.active) return;

  const vehicle = target.object;

  if (!vehicle || !vehicle.model) return;

  const vehicleType =
    target.type === "bicycle"
      ? "bicycle"
      : vehicle.assetName;

  const settings = getVehicleSettings(vehicleType);

  ridingState.active = true;
  ridingState.type = vehicleType;
  ridingState.vehicle = vehicle;
  ridingState.speed = 0;
  ridingState.maxSpeed = settings.maxSpeed;
  ridingState.acceleration = settings.acceleration;
  ridingState.turnSpeed = settings.turnSpeed;

  ridingState.originalPosition =
    playerActor.root.position.clone();

  playerActor.root.visible = false;

  const button =
    document.getElementById("hbInteract");

  if (button) button.textContent = "EXIT";

  cameraSettings.distance =
    vehicleType === "bicycle" ? 4.5 : 7;

  cameraSettings.height =
    vehicleType === "bicycle" ? 2.2 : 3.1;

  console.log("Entered:", vehicleType);
}

/* =====================================================
   EXIT VEHICLE
===================================================== */

function exitVehicle() {
  if (!ridingState.active || !playerActor) return;

  const vehicle = ridingState.vehicle;

  if (vehicle && vehicle.model) {
    const model = vehicle.model;

    const angle = model.rotation.y;

    playerActor.root.position.set(
      model.position.x + Math.sin(angle + Math.PI / 2) * 2,
      0,
      model.position.z + Math.cos(angle + Math.PI / 2) * 2
    );

    if (ridingState.type === "bicycle") {
      vehicle.model.position.y = 0;
    }
  }

  playerActor.root.visible = true;

  ridingState.active = false;
  ridingState.type = null;
  ridingState.vehicle = null;
  ridingState.speed = 0;

  cameraSettings.distance = 5.2;
  cameraSettings.height = 2.8;

  const button =
    document.getElementById("hbInteract");

  if (button) button.textContent = "USE";
}

/* =====================================================
   VEHICLE INTERACTION
===================================================== */

function handlePlayerInteraction() {
  if (!hbInput.interact) return;

  hbInput.interact = false;

  if (ridingState.active) {
    exitVehicle();
    return;
  }

  nearbyInteractable =
    findNearbyInteractable();

  if (nearbyInteractable) {
    enterVehicle(nearbyInteractable);
  }
}

/* =====================================================
   VEHICLE CONTROL
===================================================== */

function updateVehicleDriving(dt) {
  if (!ridingState.active) return;

  const vehicle = ridingState.vehicle;

  if (!vehicle || !vehicle.model) {
    exitVehicle();
    return;
  }

  const model = vehicle.model;

  const forward =
    hbInput.forward ? 1 :
    hbInput.backward ? -1 : 0;

  const acceleration =
    ridingState.acceleration;

  if (forward !== 0) {
    ridingState.speed +=
      forward * acceleration * dt;
  } else {
    ridingState.speed *=
      Math.pow(0.15, dt);
  }

  ridingState.speed = THREE.MathUtils.clamp(
    ridingState.speed,
    -ridingState.maxSpeed * 0.45,
    ridingState.maxSpeed
  );

  const speedRatio =
    Math.min(
      1,
      Math.abs(ridingState.speed) /
      ridingState.maxSpeed
    );

  let steering = 0;

  if (hbInput.left) steering = 1;
  if (hbInput.right) steering = -1;

  model.rotation.y +=
    steering *
    ridingState.turnSpeed *
    speedRatio *
    dt *
    (ridingState.speed >= 0 ? 1 : -1);

  const directionX =
    Math.sin(model.rotation.y);

  const directionZ =
    Math.cos(model.rotation.y);

  model.position.x +=
    directionX * ridingState.speed * dt;

  model.position.z +=
    directionZ * ridingState.speed * dt;

  model.position.x = THREE.MathUtils.clamp(
    model.position.x,
    -350,
    350
  );

  model.position.z = THREE.MathUtils.clamp(
    model.position.z,
    -235,
    2450
  );

  if (ridingState.type === "bicycle") {
    model.rotation.z =
      -steering * speedRatio * 0.12;
  }

  playerActor.root.position.copy(
    model.position
  );

  playerActor.root.rotation.copy(
    model.rotation
  );

  cameraSettings.rotation =
    model.rotation.y + Math.PI;

  updateVehicleCameraTarget();
}

/* =====================================================
   VEHICLE CAMERA
===================================================== */

function updateVehicleCameraTarget() {
  if (!ridingState.active) return;

  const vehicle = ridingState.vehicle;

  if (!vehicle || !vehicle.model) return;

  cameraSettings.distance =
    ridingState.type === "bicycle" ? 4.5 : 7;

  cameraSettings.height =
    ridingState.type === "bicycle" ? 2.2 : 3.1;
}

/* =====================================================
   VEHICLE COLLISION
===================================================== */

function vehicleCollisionCheck() {
  if (!ridingState.active) return false;

  const current = ridingState.vehicle;

  if (!current || !current.model) return false;

  const position = current.model.position;

  for (const other of traffic) {
    if (other === current || !other.model) continue;

    const distance =
      position.distanceTo(other.model.position);

    if (distance < 3) {
      return true;
    }
  }

  return false;
}

/* =====================================================
   TRAFFIC SYSTEM
===================================================== */

const movingTraffic = [];

function createMovingTraffic(
  assetName,
  x,
  z,
  direction,
  speed
) {
  if (!assetLibrary[assetName]) return;

  const model = cloneModel(assetName);

  fitVehicle(model, 4.5);

  model.position.set(x, 0, z);
  model.rotation.y = direction;

  scene.add(model);

  movingTraffic.push({
    model,
    direction,
    speed,
    startX: x,
    startZ: z,
    phase: Math.random() * Math.PI * 2
  });
}

function createRoadTraffic() {
  createMovingTraffic(
    "car",
    -5,
    400,
    0,
    5
  );

  createMovingTraffic(
    "car",
    5,
    650,
    Math.PI,
    4
  );

  createMovingTraffic(
    "cityTruck",
    -5,
    1200,
    0,
    4
  );

  createMovingTraffic(
    "cityTruck",
    5,
    1400,
    Math.PI,
    3.5
  );
}

/* =====================================================
   UPDATE MOVING TRAFFIC
===================================================== */

function updateMovingTraffic(dt) {
  for (const vehicle of movingTraffic) {
    const model = vehicle.model;

    model.position.x +=
      Math.sin(vehicle.direction) *
      vehicle.speed * dt;

    model.position.z +=
      Math.cos(vehicle.direction) *
      vehicle.speed * dt;

    if (model.position.z > 2400) {
      model.position.z = 250;
    }

    if (model.position.z < 200) {
      model.position.z = 2400;
    }
  }
}

/* =====================================================
   VEHICLE SPEED DISPLAY
===================================================== */

function updateVehicleHUD() {
  const status =
    document.getElementById("hbGameState");

  if (!status) return;

  if (ridingState.active) {
    const speed = Math.round(
      Math.abs(ridingState.speed) * 3.6
    );

    status.textContent =
      ridingState.type.toUpperCase() +
      " • " + speed + " KM/H";
  } else if (!hbGamePaused && !hbMenuOpen) {
    status.textContent = "PLAYING";
  }
}

/* =====================================================
   INTERACTION UPDATE
===================================================== */

function updateVehicleInteraction() {
  if (ridingState.active) {
    const button =
      document.getElementById("hbInteract");

    if (button) button.textContent = "EXIT";

    return;
  }

  updateInteraction();
}

/* =====================================================
   VEHICLE UPDATE MASTER
===================================================== */

function updateVehicleSystem(dt) {
  if (hbGamePaused || hbMenuOpen) return;

  if (ridingState.active) {
    updateVehicleDriving(dt);
  }

  updateMovingTraffic(dt);

  updateVehicleInteraction();
  updateVehicleHUD();
}

/* =====================================================
   NARAYANGADH CITY WORLD
===================================================== */

function createNarayangadhWorld() {
  makeHighway(0, 1290, 15, 2240, "z");

  for (const z of [330, 520, 710, 1260, 1390, 1520]) {
    makeVillageRoad(0, z, 7, 210, "x");
  }

  // River
  const river = addMesh(
    scene,
    new THREE.PlaneGeometry(900, 76),
    M.water,
    0, -0.025, 1000
  );

  river.rotation.x = -Math.PI / 2;

  // River banks
  addBox(scene, 0, 0.02, 958, 900, 0.3, 3, M.dirt);
  addBox(scene, 0, 0.02, 1042, 900, 0.3, 3, M.dirt);

  // Bridge
  roadPlane(
    0, 1000, 18, 112,
    asphaltMaterial, 0, 0.22
  );

  for (const side of [-1, 1]) {
    addBox(
      scene,
      side * 9.2, 1.05, 1000,
      0.35, 1.55, 112,
      curbMaterial
    );

    for (const z of [970, 1000, 1030]) {
      addBox(
        scene,
        side * 6.8, -1.15, z,
        1.25, 2.7, 1.25,
        M.stone
      );
    }
  }

  roadNetwork.push({
    type: "highway",
    x: 0,
    z: 1000,
    width: 18,
    length: 112,
    direction: "z"
  });

  // Trees along the highway
  for (const z of [
    300, 390, 485, 585, 690,
    790, 870, 1140, 1210
  ]) {
    for (const side of [-1, 1]) {
      addImportedObject(
        "tree",
        {
          x: side * (36 + Math.random() * 12),
          y: 0,
          z
        },
        6.5 + Math.random() * 2,
        Math.random() * Math.PI * 2
      );
    }
  }

  // City roads
  for (const z of [1260, 1370, 1480]) {
    makeVillageRoad(-55, z, 6, 120, "x");
    makeVillageRoad(55, z, 6, 120, "x");
  }

  for (const z of [
    1580, 1730, 1880, 2030, 2180, 2330
  ]) {
    makeVillageRoad(0, z, 8, 250, "x");
  }

  makeVillageRoad(-65, 1940, 6, 650, "z");
  makeVillageRoad(65, 1940, 6, 650, "z");

  // City buildings
  const buildingKeys = [
    "cityBuildingA",
    "cityBuildingB",
    "cityBuildingC",
    "cityBuildingD"
  ];

  const blocks = [
    [-48, 1600], [48, 1600],
    [-105, 1690], [105, 1690],
    [-48, 1790], [48, 1790],
    [-105, 1880], [105, 1880],
    [-48, 1980], [48, 1980],
    [-105, 2070], [105, 2070],
    [-48, 2170], [48, 2170],
    [-105, 2260], [105, 2260]
  ];

  blocks.forEach(([x, z], i) => {
    const key = buildingKeys[i % buildingKeys.length];

    if (!assetLibrary[key]) return;

    addImportedObject(
      key,
      { x, y: 0, z },
      13 + (i % 3) * 2,
      (i % 2) * Math.PI
    );
  });

  // Skyscrapers
  const towers = [
    ["cityTowerA", -125, 2240, 32],
    ["cityTowerB", 125, 2240, 34]
  ];

  for (const [key, x, z, height] of towers) {
    if (assetLibrary[key]) {
      addImportedObject(
        key,
        { x, y: 0, z },
        height,
        0
      );
    }
  }

  // City sign and truck
  if (assetLibrary.citySign) {
    addImportedObject(
      "citySign",
      { x: 15, y: 0, z: 830 },
      4.2,
      Math.PI
    );
  }

  if (assetLibrary.cityTruck) {
    addImportedObject(
      "cityTruck",
      { x: 23, y: 0, z: 1435 },
      3.2,
      Math.PI / 2
    );
  }

  // City pedestrians
  const cityPeople = [
    ["cityMan", 1.75, -9, 1585],
    ["cityWoman", 1.68, 9, 1595],
    ["cityAdult", 1.65, -15, 1760],
    ["cityMan", 1.75, 15, 1770],
    ["cityWoman", 1.68, -12, 1950],
    ["cityMan", 1.75, 12, 1960],
    ["cityAdult", 1.65, -17, 2150],
    ["cityMan", 1.75, 17, 2160]
  ];

  for (const [key, height, x, z] of cityPeople) {
    if (!assetLibrary[key]) continue;

    const actor = makeActor(
      key,
      height,
      { x, y: 0, z },
      {
        type: "person",
        breathingAmount: 0.008
      }
    );

    actor.root.rotation.y =
      Math.random() * Math.PI * 2;

    villagers.push({
      actor,
      homeX: x,
      homeZ: z,
      phase: Math.random() * Math.PI * 2,
      turnSpeed: 0.1 + Math.random() * 0.2,
      nextLook: 2 + Math.random() * 5
    });
  }
}