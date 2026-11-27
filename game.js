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
scene.fog = new THREE.Fog(0x9ba9a8, 150, 520);

const camera = new THREE.PerspectiveCamera(
  68,
  window.innerWidth / window.innerHeight,
  0.1,
  900
);

const renderer = new THREE.WebGLRenderer({
  antialias: false,
  powerPreference: "low-power"
});

renderer.setPixelRatio(
  Math.min(window.devicePixelRatio || 1, 0.65)
);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
renderer.shadowMap.enabled = false;
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
let cameraDistance = 3.4;
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
  new THREE.PlaneGeometry(600, 600),
  M.grass,
  0, -0.12, 0
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
makeField(-82, 65, 95, 100);
makeField(83, 100, 100, 90);
makeField(-75, 180, 90, 45);

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

  // NARAYANGADH CITY
  cityBuildingA: "building-a.glb",
  cityBuildingB: "building-b.glb",
  cityBuildingC: "building-c.glb",
  cityBuildingD: "building-d.glb",
  cityBuildingE: "building-e.glb",
  cityBuildingF: "building-f.glb",
  cityBuildingG: "building-g.glb",
  cityBuildingH: "building-h.glb",
  cityBridge: "road-bridge.glb",
  cityHighway: "highway-straight-section.glb",
  citySign: "sign-highway-detailed.glb",
  cityMan: "Business_Male_01.glb",
  cityWoman: "Business_Female_01.glb",
  cityPedestrian: "Female_Adult_01.glb"
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
  "cityBuildingE",
  "cityBuildingF",
  "cityBuildingG",
  "cityBuildingH",
  "cityBridge",
  "cityHighway",
  "citySign",
  "cityMan",
  "cityWoman",
  "cityPedestrian"
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
   PART 1 END
   NEXT: ACTORS, ANIMATIONS, NPCs, ANIMALS,
   VEHICLES, MENU, HUD AND GAME CONTROLS
===================================================== */

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
  const slowWave = Math.sin(actor.phase * 0.8);

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

const worldObjects = [];
const worldColliders = [];

function addImportedObject(
  assetName,
  position,
  targetSize,
  rotation = 0
) {
  const gltf = assetLibrary[assetName];

  if (!gltf || !gltf.scene) {
    console.warn("Optional world object skipped:", assetName);
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

if (
  assetName === "tree" ||
  assetName === "shop" ||
  assetName === "well" ||
  assetName.startsWith("cityBuilding")
) {
  model.updateMatrixWorld(true);

  const bounds = new THREE.Box3().setFromObject(model);

  worldColliders.push({
    minX: bounds.min.x,
    maxX: bounds.max.x,
    minZ: bounds.min.z,
    maxZ: bounds.max.z,
    assetName
  });
}

return model;
}

function isPositionBlocked(x, z, radius = 0.65) {
  for (const collider of worldColliders) {
    if (
      x + radius > collider.minX &&
      x - radius < collider.maxX &&
      z + radius > collider.minZ &&
      z - radius < collider.maxZ
    ) {
      return true;
    }
  }

  return false;
}
  
/* =====================================================
   NARAYANGADH CITY DISTRICT
===================================================== */

function createNarayangadhCity() {
  // CITY BUILDINGS - WEST SIDE
  addImportedObject(
    "cityBuildingA",
    { x: 160, y: 0, z: -160 },
    18,
    0
  );

  addImportedObject(
    "cityBuildingB",
    { x: 205, y: 0, z: -160 },
    15,
    Math.PI / 2
  );

  addImportedObject(
    "cityBuildingC",
    { x: 160, y: 0, z: -75 },
    20,
    0
  );

  addImportedObject(
    "cityBuildingD",
    { x: 205, y: 0, z: -75 },
    16,
    Math.PI / 2
  );

  // CITY BUILDINGS - EAST SIDE
  addImportedObject(
    "cityBuildingE",
    { x: 160, y: 0, z: 15 },
    22,
    0
  );

  addImportedObject(
    "cityBuildingF",
    { x: 205, y: 0, z: 15 },
    17,
    Math.PI / 2
  );

  addImportedObject(
    "cityBuildingG",
    { x: 160, y: 0, z: 175 },
    19,
    0
  );

  addImportedObject(
    "cityBuildingH",
    { x: 205, y: 0, z: 175 },
    16,
    Math.PI / 2
  );

  // CITY HIGHWAY SIGN
  addImportedObject(
    "citySign",
    { x: 112, y: 0, z: -190 },
    5,
    Math.PI / 2
  );

  // CITY BRIDGE
  addImportedObject(
    "cityBridge",
    { x: 175, y: 0, z: 110 },
    4,
    0
  );

  // CITY PEDESTRIANS
  addImportedObject(
    "cityMan",
    { x: 150, y: 0, z: -45 },
    1.75,
    Math.PI
  );

  addImportedObject(
    "cityWoman",
    { x: 190, y: 0, z: -45 },
    1.7,
    0
  );

  addImportedObject(
    "cityPedestrian",
    { x: 150, y: 0, z: 65 },
    1.7,
    Math.PI
  );

  console.log("NARAYANGADH CITY CREATED");
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

    actor.root.rotation.y = Math.random() * Math.PI * 2;

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
  const actor = makeActor(
    assetName,
    height * scaleVariation,
    { x, y: 0, z },
    {
      type: "animal",
      breathingAmount: 0.012
    }
  );

  actor.root.rotation.y = Math.random() * Math.PI * 2;

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
        animal.actor.animationMap.graze
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
   VEHICLE SYSTEM
===================================================== */

function createVehicle(
  assetName,
  targetLength,
  x,
  z,
  rotation = 0
) {
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
    speed: assetName === "tractor" ? 1.2 : 2.2,
    travel: 0,
    travelDirection: 1
  });

  return model;
}

/* =====================================================
   MOVING ROAD TRAFFIC
===================================================== */

function updateTraffic(dt) {
  for (const vehicle of traffic) {
    vehicle.travel +=
      vehicle.speed *
      dt *
      vehicle.travelDirection;

    if (vehicle.travel >= 18) {
      vehicle.travel = 18;
      vehicle.travelDirection = -1;
    }

    if (vehicle.travel <= -18) {
      vehicle.travel = -18;
      vehicle.travelDirection = 1;
    }

    const forwardX = Math.sin(vehicle.direction);
    const forwardZ = Math.cos(vehicle.direction);

    vehicle.model.position.x =
      vehicle.startX +
      forwardX * vehicle.travel;

    vehicle.model.position.z =
      vehicle.startZ +
      forwardZ * vehicle.travel;
  }
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
   ACTOR CLEANUP
===================================================== */

function disposeActor(actor) {
  if (!actor) return;

  actor.active = false;

  actor.mixer.stopAllAction();

  scene.remove(actor.root);
}

/* =====================================================
   LOADING SCREEN
===================================================== */

const loadingScreen = document.getElementById("hbLoading");

function setLoadingProgress(value, message) {
  const bar = document.getElementById("hbProgressBar");
  const status = document.getElementById("hbLoadingStatus");

  if (bar) {
    bar.style.width =
      Math.max(0, Math.min(100, value)) + "%";
  }

  if (status) {
    status.textContent = message;
  }
}

/* =====================================================
   ERROR SCREEN — NO CARTOON FALLBACK
===================================================== */

function showAssetError(errors) {
  loadingScreen.style.display = "none";

  const errorScreen = document.getElementById("hbError");
errorScreen.style.display = "flex";

  const details = document.getElementById("hbErrorDetails");

  details.textContent = errors
    .map(error => error.message || String(error))
    .join("\n\n");

  document.getElementById("hbRetry").onclick = () => {
    errorScreen.style.display = "none";
    loadingScreen.style.display = "flex";
    startAssetLoading();
  };
}

/* =====================================================
   INTRO MENU
===================================================== */

/* =====================================================
   HAMRO BASTI CINEMATIC INTRO
===================================================== */

const intro = document.getElementById("hbCinematicIntro");

intro.style.cssText = `
  position:fixed;
  inset:0;
  z-index:99999;
  background:#000;
  display:none;
  align-items:center;
  justify-content:center;
  color:white;
  text-align:center;
  opacity:1;
  transition:opacity 2s ease;
`;


const introStyle = document.createElement("style");
introStyle.textContent = `
  @keyframes hbIntroReveal {
    0% { opacity:0; transform:scale(.85); filter:blur(12px); }
    65% { opacity:1; transform:scale(1.04); filter:blur(0); }
    100% { opacity:1; transform:scale(1); }
  }

  #hbCinematicIntro h1 {
    font-size:clamp(38px, 9vw, 76px);
    letter-spacing:8px;
    text-shadow:0 0 25px #d6a45b;
    margin:18px 0;
  }

  #hbCinematicIntro p {
    letter-spacing:4px;
    color:#c9b58b;
    font-size:12px;
  }

  .hbIntroStudio {
    font-size:12px;
    letter-spacing:5px;
    color:#d6a45b;
  }
  
  .hbIntroContent {
  opacity:1;
}

#hbIntroBegin {
  display:block;
  margin:35px auto 0;
  padding:14px 28px;
  background:transparent;
  color:#d6a45b;
  border:1px solid #d6a45b;
  border-radius:5px;
  letter-spacing:3px;
  font-size:13px;
  cursor:pointer;
}
`;
document.head.appendChild(introStyle);

document.getElementById("hbIntroBegin").addEventListener("click", () => {
  const button = document.getElementById("hbIntroBegin");
  button.disabled = true;

  const content = intro.querySelector(".hbIntroContent");
  content.style.animation = "hbIntroReveal 3s ease forwards";

  const AudioContextClass =
    window.AudioContext || window.webkitAudioContext;

  const audio = new AudioContextClass();

  audio.resume();

  const notes = [
    392, 440, 523, 440,
    392, 330, 392, 440,
    523, 587, 523, 440,
    392
  ];

  notes.forEach((frequency, index) => {
    const start = audio.currentTime + index * 0.58;

    const oscillator = audio.createOscillator();
    const volume = audio.createGain();

    oscillator.type = "sine";
    oscillator.frequency.value = frequency;

    volume.gain.setValueAtTime(0, start);
    volume.gain.linearRampToValueAtTime(0.12, start + 0.08);
    volume.gain.linearRampToValueAtTime(0, start + 0.52);

    oscillator.connect(volume);
    volume.connect(audio.destination);

    oscillator.start(start);
    oscillator.stop(start + 0.55);
  });

  setTimeout(() => {
    intro.style.opacity = "0";

    setTimeout(() => {
      intro.remove();
      audio.close();
    }, 2100);
  }, 8500);
});
const menu = document.getElementById("hbMenu");

/* =====================================================
   HAMRO BASTI - NATURAL AMBIENT SOUND
===================================================== */

let hbAudioContext = null;
let hbAmbientOn = true;
let hbAmbientNodes = [];
let hbBirdTimer = null;

const hbSoundButton = document.getElementById("hbSoundToggle");

function hbStartAmbientSound() {
  if (!hbAmbientOn || hbAudioContext) return;

  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;

  hbAudioContext = new AudioCtx();
  const ctx = hbAudioContext;

  ctx.resume();

  // Soft natural wind
  const buffer = ctx.createBuffer(
    1, ctx.sampleRate * 4, ctx.sampleRate
  );
  const data = buffer.getChannelData(0);

  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.35;
  }

  const wind = ctx.createBufferSource();
  wind.buffer = buffer;
  wind.loop = true;

  const windFilter = ctx.createBiquadFilter();
  windFilter.type = "lowpass";
  windFilter.frequency.value = 350;

  const windGain = ctx.createGain();
  windGain.gain.value = 0.10;

  wind.connect(windFilter);
  windFilter.connect(windGain);
  windGain.connect(ctx.destination);
  wind.start();

  hbAmbientNodes.push(wind);

  // Gentle bamboo and leaf rustling
  const leaves = ctx.createBufferSource();
  leaves.buffer = buffer;
  leaves.loop = true;

  const leafFilter = ctx.createBiquadFilter();
  leafFilter.type = "bandpass";
  leafFilter.frequency.value = 1100;

  const leafGain = ctx.createGain();
  leafGain.gain.value = 0.025;

  const leafLfo = ctx.createOscillator();
  const leafLfoGain = ctx.createGain();
  leafLfo.frequency.value = 0.18;
  leafLfoGain.gain.value = 0.018;

  leafLfo.connect(leafLfoGain);
  leafLfoGain.connect(leafGain.gain);

  leaves.connect(leafFilter);
  leafFilter.connect(leafGain);
  leafGain.connect(ctx.destination);

  leaves.start();
  leafLfo.start();

  hbAmbientNodes.push(leaves, leafLfo);

  // Small bird chirps
  function hbBirdChirp() {
    if (!hbAudioContext || !hbAmbientOn) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    const now = ctx.currentTime;
    const frequency = 1800 + Math.random() * 1300;

    osc.type = "sine";
    osc.frequency.setValueAtTime(frequency, now);
    osc.frequency.exponentialRampToValueAtTime(
      frequency * 1.35, now + 0.10
    );
    osc.frequency.exponentialRampToValueAtTime(
      frequency * 0.8, now + 0.20
    );

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.035, now + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.23);
  }

  hbBirdTimer = setInterval(() => {
    hbBirdChirp();
    if (Math.random() > 0.5) {
      setTimeout(hbBirdChirp, 250);
    }
  }, 2200 + Math.random() * 1800);
}

function hbStopAmbientSound() {
  if (hbBirdTimer) {
    clearInterval(hbBirdTimer);
    hbBirdTimer = null;
  }

  if (hbAudioContext) {
    hbAudioContext.close();
    hbAudioContext = null;
  }

  hbAmbientNodes = [];
}

hbSoundButton.onclick = () => {
  hbAmbientOn = !hbAmbientOn;

  hbSoundButton.textContent =
    hbAmbientOn ? "AMBIENT SOUND: ON" : "AMBIENT SOUND: OFF";

  if (hbAmbientOn && gameStarted) {
    hbStartAmbientSound();
  } else {
    hbStopAmbientSound();
  }
};

menu.addEventListener("click", (event) => {
  if (event.target.closest("#hbStart")) {
    hbStartAmbientSound();
  }
});

/* =====================================================
   SETTINGS PANEL
===================================================== */

const settings = document.getElementById("hbSettings");

document.getElementById("hbOpenSettings").onclick = () => {
  settings.style.display = "flex";
};

document.getElementById("hbCloseSettings").onclick = () => {
  settings.style.display = "none";
};

document.getElementById("hbSaveSettings").onclick = () => {
  joystickSensitivity = Number(
    document.getElementById("hbJoySensitivity").value
  );

  cameraSensitivity = Number(
    document.getElementById("hbCamSensitivity").value
  );

  cameraDistance = Number(
    document.getElementById("hbCameraDistance").value
  );

  graphicsQuality =
    document.getElementById("hbGraphics").value;

  if (graphicsQuality === "low") {
    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio || 1, 0.8)
    );
    renderer.shadowMap.enabled = false;
  } else if (graphicsQuality === "medium") {
    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio || 1, 1)
    );
    renderer.shadowMap.enabled = true;
  } else {
    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio || 1, 1.5)
    );
    renderer.shadowMap.enabled = true;
  }

  renderer.setSize(
    window.innerWidth,
    window.innerHeight
  );

  settings.style.display = "none";
};

/* =====================================================
   HUD
===================================================== */

const hud = document.getElementById("hbHUD");

/* =====================================================
   MINIMAP
===================================================== */

const miniMapCanvas = document.getElementById("miniMap");
const miniMapContext = miniMapCanvas.getContext("2d");

function drawMiniMap() {
  const ctx = miniMapContext;
  const size = 256;

  ctx.clearRect(0, 0, size, size);

  ctx.fillStyle = "#657b4a";
  ctx.fillRect(0, 0, size, size);

  const scale = 0.52;

  function mapX(x) {
    return size / 2 + x * scale;
  }

  function mapZ(z) {
    return size / 2 + z * scale;
  }

  for (const road of roadNetwork) {
    ctx.save();

    ctx.strokeStyle =
      road.type === "highway"
        ? "#34383a"
        : road.type === "dirt"
        ? "#aa895c"
        : "#c2c0ad";

    ctx.lineWidth =
      road.type === "highway" ? 7 :
      road.type === "dirt" ? 2.5 : 3.5;

    ctx.beginPath();

    if (road.direction === "z") {
      ctx.moveTo(mapX(road.x), mapZ(road.z - road.length / 2));
      ctx.lineTo(mapX(road.x), mapZ(road.z + road.length / 2));
    } else {
      ctx.moveTo(mapX(road.x - road.length / 2), mapZ(road.z));
      ctx.lineTo(mapX(road.x + road.length / 2), mapZ(road.z));
    }

    ctx.stroke();
    ctx.restore();
  }

  ctx.fillStyle = "#b7a27d";

  for (const [x, z] of housePositions) {
    ctx.fillRect(
      mapX(x) - 2,
      mapZ(z) - 2,
      4,
      4
    );
  }

  if (playerActor) {
    const px = mapX(playerActor.root.position.x);
    const pz = mapZ(playerActor.root.position.z);

    ctx.save();

    ctx.translate(px, pz);
    ctx.rotate(-playerActor.root.rotation.y);

    ctx.fillStyle = "#ff4a35";

    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.lineTo(5, 6);
    ctx.lineTo(-5, 6);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  ctx.strokeStyle = "rgba(255,255,255,.7)";
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, size - 2, size - 2);
}

/* =====================================================
   JOYSTICK
===================================================== */

const joystick = document.getElementById("joystick");
joystick.id = "joystick";

const joystickKnob = document.getElementById("joystickKnob");

let joystickPointer = null;
let joystickCenter = { x: 0, y: 0 };

function resetJoystick() {
  moveX = 0;
  moveY = 0;

  joystickPointer = null;

  joystickKnob.style.transform =
    "translate(0px, 0px)";
}

function updateJoystick(event) {
  const rect = joystick.getBoundingClientRect();

  joystickCenter.x = rect.left + rect.width / 2;
  joystickCenter.y = rect.top + rect.height / 2;

  const dx = event.clientX - joystickCenter.x;
  const dy = event.clientY - joystickCenter.y;

  const maxDistance = rect.width * 0.32;

  const distance = Math.hypot(dx, dy);
  const factor =
    distance > maxDistance
      ? maxDistance / distance
      : 1;

  const limitedX = dx * factor;
  const limitedY = dy * factor;

  moveX = limitedX / maxDistance;
  moveY = limitedY / maxDistance;

  joystickKnob.style.transform =
    `translate(${limitedX}px, ${limitedY}px)`;
}

joystick.addEventListener("pointerdown", event => {
  event.preventDefault();
  event.stopPropagation();

  joystickPointer = event.pointerId;

  joystick.setPointerCapture(event.pointerId);

  updateJoystick(event);
});

joystick.addEventListener("pointermove", event => {
  if (event.pointerId !== joystickPointer) return;

  event.preventDefault();
  updateJoystick(event);
});

joystick.addEventListener("pointerup", event => {
  if (event.pointerId === joystickPointer) {
    resetJoystick();
  }
});

joystick.addEventListener("pointercancel", resetJoystick);

/* =====================================================
   RUN BUTTON
===================================================== */

let forceRun = false;

const runButton = document.getElementById("hbRun");

runButton.addEventListener("pointerdown", event => {
  event.preventDefault();
  forceRun = true;
});

function stopRun() {
  forceRun = false;
}

runButton.addEventListener("pointerup", stopRun);
runButton.addEventListener("pointercancel", stopRun);
runButton.addEventListener("lostpointercapture", stopRun);

/* =====================================================
   JUMP CONTROL
===================================================== */

function jump() {
  if (!gameStarted || !playerActor || isJumping) return;

  isJumping = true;
  jumpVelocity = 8.2;

  playerActor.changeAnimation("jump");
}

document.getElementById("hbJump").addEventListener(
  "pointerdown",
  event => {
    event.preventDefault();
    event.stopPropagation();
    jump();
  }
);

/* =====================================================
   KEYBOARD CONTROLS
===================================================== */

const keys = {};

window.addEventListener("keydown", event => {
  keys[event.key.toLowerCase()] = true;

  if (
    event.code === "Space" &&
    !event.repeat
  ) {
    jump();
  }

  if (event.key === "Shift") {
    forceRun = true;
  }
});

window.addEventListener("keyup", event => {
  keys[event.key.toLowerCase()] = false;

  if (event.key === "Shift") {
    forceRun = false;
  }
});

/* =====================================================
   CAMERA TOUCH AND MOUSE CONTROL
===================================================== */

let cameraPointer = null;
let lastPointerX = 0;
let lastPointerY = 0;
let cameraDragging = false;

renderer.domElement.addEventListener("pointerdown", event => {
  if (!gameStarted) return;

  cameraPointer = event.pointerId;
  lastPointerX = event.clientX;
  lastPointerY = event.clientY;

  cameraDragging = true;
});

renderer.domElement.addEventListener("pointermove", event => {
  if (!cameraDragging || event.pointerId !== cameraPointer) {
    return;
  }

  const dx = event.clientX - lastPointerX;
  const dy = event.clientY - lastPointerY;

  lastPointerX = event.clientX;
  lastPointerY = event.clientY;

  cameraYaw -= dx * 0.005 * cameraSensitivity;

  cameraPitch +=
    dy * 0.003 * cameraSensitivity;

  cameraPitch = THREE.MathUtils.clamp(
    cameraPitch,
    0.12,
    0.85
  );
});

function stopCameraDrag(event) {
  if (
    cameraPointer !== null &&
    event.pointerId === cameraPointer
  ) {
    cameraPointer = null;
    cameraDragging = false;
  }
}

renderer.domElement.addEventListener(
  "pointerup",
  stopCameraDrag
);

renderer.domElement.addEventListener(
  "pointercancel",
  stopCameraDrag
);

/* =====================================================
   CAMERA FOLLOW
===================================================== */

const cameraTarget = new THREE.Vector3();
const cameraDesired = new THREE.Vector3();

function updateCamera(dt) {
  if (!playerActor) return;

  const player = playerActor.root.position;

  const horizontalDistance =
    cameraDistance * Math.cos(cameraPitch);

  const verticalDistance =
    cameraDistance * Math.sin(cameraPitch);

  cameraDesired.set(
    player.x +
      Math.sin(cameraYaw) * horizontalDistance,

    player.y + 1.55 + verticalDistance,

    player.z +
      Math.cos(cameraYaw) * horizontalDistance
  );

  const smooth = 1 - Math.exp(-7.5 * dt);

  camera.position.lerp(cameraDesired, smooth);

  cameraTarget.set(
    player.x,
    player.y + 1.25,
    player.z
  );

  camera.lookAt(cameraTarget);
}

/* =====================================================
   PLAYER MOVEMENT
===================================================== */

const playerVelocity = new THREE.Vector3();

const movementForward = new THREE.Vector3();
const movementSide = new THREE.Vector3();

function updatePlayer(dt) {
  if (!playerActor) return;

  let horizontal = moveX;
  let vertical = -moveY;

  if (keys["a"] || keys["arrowleft"]) horizontal -= 1;
  if (keys["d"] || keys["arrowright"]) horizontal += 1;
  if (keys["w"] || keys["arrowup"]) vertical += 1;
  if (keys["s"] || keys["arrowdown"]) vertical -= 1;

  horizontal *= joystickSensitivity;
  vertical *= joystickSensitivity;

  const inputLength = Math.hypot(horizontal, vertical);

  const moving = inputLength > 0.08;

  if (moving) {
    horizontal /= Math.max(1, inputLength);
    vertical /= Math.max(1, inputLength);

    const dx =
      horizontal * Math.cos(cameraYaw) -
      vertical * Math.sin(cameraYaw);

    const dz =
      -horizontal * Math.sin(cameraYaw) -
      vertical * Math.cos(cameraYaw);

    const directionLength = Math.hypot(dx, dz) || 1;

    const nx = dx / directionLength;
    const nz = dz / directionLength;

    const running =
      forceRun ||
      inputLength > 0.82 ||
      keys["shift"];

    const speed = running ? 6.4 : 2.3;

    const currentPosition = playerActor.root.position;

const nextX =
  currentPosition.x + nx * speed * dt;

const nextZ =
  currentPosition.z + nz * speed * dt;

// X AXIS COLLISION
if (!isPositionBlocked(nextX, currentPosition.z)) {
  currentPosition.x = nextX;
}

// Z AXIS COLLISION
if (!isPositionBlocked(currentPosition.x, nextZ)) {
  currentPosition.z = nextZ;
}

    const targetRotation = Math.atan2(nx, nz);

    let rotationDifference =
      targetRotation - playerActor.root.rotation.y;

    rotationDifference = Math.atan2(
      Math.sin(rotationDifference),
      Math.cos(rotationDifference)
    );

    playerActor.root.rotation.y +=
      rotationDifference *
      (1 - Math.exp(-12 * dt));

    playerActor.isMoving = true;

    if (isJumping) {
      playerActor.changeAnimation("jump");
    } else {
      playerActor.changeAnimation(
        running ? "run" : "walk"
      );
    }
  } else {
    playerActor.isMoving = false;

    if (isJumping) {
      playerActor.changeAnimation("jump");
    } else {
      playerActor.changeAnimation("idle");
    }
  }

  /* Jump arc and gravity */

  if (isJumping) {
    playerActor.root.position.y +=
      jumpVelocity * dt;

    jumpVelocity -= 20 * dt;

    if (playerActor.root.position.y <= 0) {
      playerActor.root.position.y = 0;

      jumpVelocity = 0;
      isJumping = false;

      playerActor.changeAnimation(
        moving
          ? (forceRun ? "run" : "walk")
          : "idle"
      );
    }
  }

  /* Prevent leaving the village world */

  playerActor.root.position.x =
    THREE.MathUtils.clamp(
      playerActor.root.position.x,
      -235,
      235
    );

  playerActor.root.position.z =
    THREE.MathUtils.clamp(
      playerActor.root.position.z,
      -235,
      235
    );

  /* Subtle breathing while standing */

  const wave = Math.sin(elapsed * 2.1);

  const breathing =
    playerActor.breathingAmount * wave;

  playerActor.model.scale.y =
    playerActor.baseScale.y * (1 + breathing);

  playerActor.model.position.y =
    playerActor.baseModelY +
    Math.abs(wave) * 0.001;

  playerActor.mixer.update(dt);
}

/* =====================================================
   GAME PAUSE
===================================================== */

let gamePaused = false;

function pauseGame() {
  gamePaused = !gamePaused;

  if (gamePaused) {
    menu.style.display = "flex";
    document.getElementById("hbStart").textContent =
      "RESUME GAME";

    document.getElementById("hbOpenSettings").style.display =
      "block";
  } else {
    menu.style.display = "none";
  }
}

document.getElementById("hbPause").onclick = pauseGame;

/* =====================================================
   ASSET LOADING AND WORLD CREATION
===================================================== */

let assetsLoaded = false;
let worldCreated = false;

async function loadAssetsSequentially(
  assetNames,
  progressStart,
  progressEnd,
  statusText
) {
  const results = [];

  for (let i = 0; i < assetNames.length; i++) {
    const name = assetNames[i];

    try {
      await loadOneAsset(name);

      results.push({
        status: "fulfilled",
        value: assetLibrary[name]
      });

    } catch (error) {
      results.push({
        status: "rejected",
        reason: error
      });
    }

    const progress =
      progressStart +
      ((i + 1) / assetNames.length) *
      (progressEnd - progressStart);

    setLoadingProgress(
      progress,
      `${statusText} (${i + 1}/${assetNames.length})`
    );
  }

  return results;
}

async function startAssetLoading() {
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    try {
      setLoadingProgress(
        3,
        "Loading required real 3D models..."
      );

      // LOAD REQUIRED ASSETS ONE BY ONE
      const requiredResults = await loadAssetsSequentially(
        REQUIRED_ASSETS,
        3,
        48,
        "Loading required models"
      );

      const failures = requiredResults
        .map((result, index) => ({
          result,
          name: REQUIRED_ASSETS[index]
        }))
        .filter(item => item.result.status === "rejected")
        .map(item => {
          const error = item.result.reason;

          return new Error(
            `${ASSETS[item.name]} failed: ${
              error?.message || error
            }`
          );
        });

      if (failures.length > 0) {
        showAssetError(failures);
        loadingPromise = null;
        return;
      }

      // LOAD OPTIONAL ASSETS ONE BY ONE
      const optionalResults = await loadAssetsSequentially(
        OPTIONAL_ASSETS,
        48,
        75,
        "Loading optional models"
      );

      const optionalFailures = optionalResults
        .map((result, index) => ({
          result,
          name: OPTIONAL_ASSETS[index]
        }))
        .filter(item => item.result.status === "rejected");

      if (optionalFailures.length > 0) {
        console.warn(
          "Optional assets not loaded:",
          optionalFailures.map(item => item.name)
        );
      }

      setLoadingProgress(75, "Building the village...");

      if (!worldCreated) {
        createVillageTrees();
        createVillageShop();
        createVillageWell();
        createVillageTileDecorations();
        createNarayangadhCity();

        createPeople();
        createFarmAnimals();
        createDog();
        createVehicles();
        createBicycles();
        createGuitarProp();
        createBirds();

        playerActor = makeActor(
          "player",
          1.75,
          { x: 0, y: 0, z: 0 },
          {
            type: "person",
            breathingAmount: 0.006
          }
        );

        playerActor.root.rotation.y = Math.PI;

        worldCreated = true;
      }

      setLoadingProgress(100, "Village ready!");

      assetsLoaded = true;

      loadingScreen.style.display = "none";
      menu.style.display = "flex";

    } catch (error) {
      console.error("Asset loading error:", error);

      showAssetError([error]);

      loadingPromise = null;
    }
  })();

  return loadingPromise;
}

/* =====================================================
   START AND RESUME GAME
===================================================== */

document.getElementById("hbStart").onclick = () => {
  if (!assetsLoaded || !playerActor) return;

  if (gameStarted && gamePaused) {
    gamePaused = false;
    menu.style.display = "none";
    document.getElementById("hbStart").textContent =
      "START GAME";
    return;
  }

  gameStarted = true;
  gamePaused = false;

  menu.style.display = "none";
  settings.style.display = "none";
  hud.style.display = "block";

  cameraYaw = playerActor.root.rotation.y;

  updateCamera(1 / 60);
};

/* =====================================================
   MAIN GAME LOOP
===================================================== */

let lastFrameTime = 0;

function animate(timestamp = 0) {
  requestAnimationFrame(animate);

  // Limit game updates and rendering to 30 FPS.
  if (timestamp - lastFrameTime < 1000 / 30) return;
  lastFrameTime = timestamp;

  const dt = Math.min(clock.getDelta(), 0.04);


  elapsed += dt;

  if (!gameStarted || gamePaused || !assetsLoaded) {
    renderer.render(scene, camera);
    return;
  }

  updatePlayer(dt);
  updateTraffic(dt);
  updateVillagers(dt);
  updateAnimals(dt);
  updateDog(dt);
  updateBirds(dt);

  updateCamera(dt);

  drawMiniMap();

  renderer.render(scene, camera);
}

/* =====================================================
   WINDOW RESIZE
===================================================== */

window.addEventListener("resize", () => {
  camera.aspect =
    window.innerWidth / window.innerHeight;

  camera.updateProjectionMatrix();

  renderer.setSize(
    window.innerWidth,
    window.innerHeight
  );
});

/* =====================================================
   START APPLICATION
===================================================== */

startAssetLoading();

animate();

/* =====================================================
   HAMRO BASTI — END OF GAME.JS
===================================================== */