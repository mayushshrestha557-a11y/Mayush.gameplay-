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