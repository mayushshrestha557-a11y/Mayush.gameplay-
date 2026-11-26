import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import * as SkeletonUtils from "three/addons/utils/SkeletonUtils.js";

/* MAYUSH GAMEPLAY — NAYABASTI TERAI
   Mobile 3D village game
   Fixed joystick + running animation + vehicle drivers
*/

document.documentElement.style.cssText = "margin:0;width:100%;height:100%;overflow:hidden";
document.body.style.cssText = "margin:0;width:100%;height:100%;overflow:hidden;background:#9bb8c2;touch-action:none;user-select:none";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9bb8c2);
scene.fog = new THREE.Fog(0x9bb8c2, 100, 340);

const camera = new THREE.PerspectiveCamera(62, innerWidth / innerHeight, .1, 500);

const renderer = new THREE.WebGLRenderer({
  antialias:true,
  powerPreference:"high-performance"
});

renderer.setSize(innerWidth,innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.25));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.domElement.style.cssText =
  "position:fixed;inset:0;width:100%;height:100%;display:block;touch-action:none";

document.body.appendChild(renderer.domElement);

/* LOADING */

const loading=document.createElement("div");

loading.style.cssText=
  "position:fixed;inset:0;z-index:100;background:#182a25;color:white;display:flex;align-items:center;justify-content:center;flex-direction:column;font:14px Arial;gap:12px";

loading.innerHTML=
  '<div style="font-size:28px;font-weight:900">MAYUSH</div><div id="loadtext">BUILDING NAYABASTI...</div><div style="width:190px;height:5px;background:#555;border-radius:8px"><div id="loadbar" style="width:5%;height:5px;background:#e5c16c"></div></div>';

document.body.appendChild(loading);

function status(t,p){
  const a=document.getElementById("loadtext");
  const b=document.getElementById("loadbar");
  if(a)a.textContent=t;
  if(b)b.style.width=p+"%";
}

/* LIGHTS */

scene.add(new THREE.HemisphereLight(0xdcecff,0x596047,1.6));

const sun=new THREE.DirectionalLight(0xffe5bd,2.5);
sun.position.set(-45,85,45);
sun.castShadow=true;
sun.shadow.mapSize.set(1024,1024);

Object.assign(sun.shadow.camera,{
  left:-100,
  right:100,
  top:100,
  bottom:-100,
  far:220
});

scene.add(sun);

/* MATERIALS */

function mat(c,r=1,m=0){
  return new THREE.MeshStandardMaterial({
    color:c,
    roughness:r,
    metalness:m
  });
}

const M={
  grass:mat(0x71864b),
  crop:mat(0x89994c),
  dirt:mat(0x98764e),
  road:mat(0x353b3d),
  water:mat(0x477f8d,.25),
  tree:mat(0x59432c),
  leaf:mat(0x315c32),
  leaf2:mat(0x486d37),
  metal:mat(0x858d8a,.45,.4),
  black:mat(0x191a19),
  red:mat(0x9e3829),
  white:mat(0xe5e1d5)
};

function box(parent,x,y,z,sx,sy,sz,material){
  const o=new THREE.Mesh(
    new THREE.BoxGeometry(sx,sy,sz),
    material
  );

  o.position.set(x,y,z);
  o.castShadow=true;
  o.receiveShadow=true;
  parent.add(o);

  return o;
}

/* GROUND */

const canvas=document.createElement("canvas");
canvas.width=canvas.height=256;

const ctx=canvas.getContext("2d");
ctx.fillStyle="#71864b";
ctx.fillRect(0,0,256,256);

for(let i=0;i<4500;i++){
  const n=50+Math.random()*70;
  ctx.fillStyle=`rgba(${n*.7},${n+35},${n*.45},.22)`;
  ctx.fillRect(Math.random()*256,Math.random()*256,2,2);
}

const groundTexture=new THREE.CanvasTexture(canvas);
groundTexture.wrapS=groundTexture.wrapT=THREE.RepeatWrapping;
groundTexture.repeat.set(32,32);
groundTexture.colorSpace=THREE.SRGBColorSpace;

M.grass.map=groundTexture;
M.grass.needsUpdate=true;

const ground=new THREE.Mesh(
  new THREE.PlaneGeometry(500,500),
  M.grass
);

ground.rotation.x=-Math.PI/2;
ground.position.y=-.08;
ground.receiveShadow=true;
scene.add(ground);

/* GRASS */

{
  const geo=new THREE.PlaneGeometry(.14,.68,1,2);
  geo.translate(0,.34,0);

  const material=new THREE.MeshStandardMaterial({
    color:0x91a95b,
    roughness:1,
    side:THREE.DoubleSide
  });

  const count=1800;
  const grass=new THREE.InstancedMesh(
    geo,material,count
  );

  const dummy=new THREE.Object3D();
  let n=0;

  for(let i=0;i<count*2&&n<count;i++){
    const x=(Math.random()-.5)*470;
    const z=(Math.random()-.5)*470;

    if(Math.abs(x)<7.5)continue;

    dummy.position.set(x,.02,z);
    dummy.rotation.y=Math.random()*Math.PI;
    dummy.scale.set(
      .65+Math.random()*.65,
      .55+Math.random()*.8,
      1
    );

    dummy.updateMatrix();
    grass.setMatrixAt(n++,dummy.matrix);
  }

  grass.count=n;
  grass.instanceMatrix.needsUpdate=true;
  scene.add(grass);
}

/* ROADS */

box(scene,0,0,0,12,.16,420,M.road);
box(scene,-6.5,.02,0,1,.12,420,M.dirt);
box(scene,6.5,.02,0,1,.12,420,M.dirt);

for(let z=-200;z<210;z+=14){
  box(scene,0,.09,z,.14,.025,4.2,mat(0xd5ad4c));
}

box(scene,-11,0,-35,85,.13,6,M.dirt);
box(scene,40,0,60,85,.13,6,M.dirt);
box(scene,-45,0,125,70,.13,6,M.dirt);
box(scene,38,0,-125,75,.13,6,M.dirt);

for(const side of [-1,1]){
  box(scene,side*8.2,-.01,0,.5,.28,420,mat(0x858782));
  box(scene,side*8.2,.08,0,.3,.08,420,M.water);
}

/* FIELDS */

function makeField(x,z,w,d){
  box(scene,x,.005,z,w,.08,d,M.crop);

  const geo=new THREE.ConeGeometry(.13,.8,5);
  const cropMat=mat(0x8d9c43);

  const count=Math.floor(w/3)*Math.floor(d/4);
  const crops=new THREE.InstancedMesh(geo,cropMat,count);
  const dummy=new THREE.Object3D();

  let i=0;

  for(let px=-w/2+2;px<w/2-1;px+=3){
    for(let pz=-d/2+2;pz<d/2-1;pz+=4){
      dummy.position.set(x+px,.4,z+pz);
      dummy.rotation.y=Math.random()*.5;
      dummy.updateMatrix();
      crops.setMatrixAt(i++,dummy.matrix);
    }
  }

  crops.count=i;
  crops.instanceMatrix.needsUpdate=true;
  scene.add(crops);
}

makeField(-75,-95,90,90);
makeField(82,-80,100,100);
makeField(-82,65,95,100);
makeField(83,100,100,90);
makeField(-75,180,90,45);

function canal(x,z,w,len,rotation=0){
  const g=new THREE.Group();

  box(g,0,.02,0,w,.12,len,M.water);

  for(const s of [-1,1]){
    box(g,s*(w/2+.3),.03,0,.55,.32,len,M.dirt);
  }

  g.position.set(x,0,z);
  g.rotation.y=rotation;
  scene.add(g);
}

canal(-125,0,2.5,360);
canal(130,20,2.5,350);
canal(0,-165,2.2,250,Math.PI/2);

function pond(x,z,rx,rz){
  const w=new THREE.Mesh(
    new THREE.CircleGeometry(1,48),
    M.water
  );

  w.rotation.x=-Math.PI/2;
  w.scale.set(rx,rz,1);
  w.position.set(x,.04,z);
  scene.add(w);
}

pond(-48,-20,12,8);
pond(55,145,15,10);

/* OPTIONAL EXTERNAL MODELS */

const BASE="https://raw.githubusercontent.com/trebeljahr/quaternius-showcase/main/public/glb/";

const ASSETS={
  farmer:BASE+"modular_men/Farmer.glb",
  casual:BASE+"modular_men/Casual.glb",
  worker:BASE+"modular_men/Worker.glb",
  house1:BASE+"buildings_pack_2/House1.glb",
  house2:BASE+"buildings_pack_2/House2.glb",
  treeA:BASE+"nature_pack/CommonTree_1.glb",
  treeB:BASE+"nature_pack/Willow_1.glb"
};

const loader=new GLTFLoader();
const cache={};

function loadModel(url){
  return new Promise((resolve,reject)=>{
    loader.load(url,resolve,undefined,reject);
  });
}

async function prepareAssets(){
  const names=Object.keys(ASSETS);
  let done=0;

  await Promise.all(names.map(async name=>{
    try{
      const result=await Promise.race([
        loadModel(ASSETS[name]),
        new Promise((_,reject)=>
          setTimeout(()=>reject(Error("timeout")),6500)
        )
      ]);

      cache[name]=result;
    }catch(e){
      console.warn("Fallback model:",name,e);
      cache[name]=null;
    }

    done++;
    status(
      "Loading 3D assets "+done+"/"+names.length,
      10+Math.round(done/names.length*75)
    );
  }));
}

function makeAsset(name,height){
  const source=cache[name];
  if(!source)return null;

  const model=SkeletonUtils.clone(source.scene);

  model.traverse(o=>{
    if(o.isMesh){
      o.castShadow=true;
      o.receiveShadow=true;
    }
  });

  const bounds=new THREE.Box3().setFromObject(model);
  const size=new THREE.Vector3();
  bounds.getSize(size);

  if(size.y<=0)return null;

  model.scale.setScalar(height/size.y);

  const b=new THREE.Box3().setFromObject(model);
  const c=new THREE.Vector3();
  b.getCenter(c);

  model.position.x-=c.x;
  model.position.z-=c.z;
  model.position.y-=b.min.y;

  return model;
}

/* HOUSES */

function makeHouse(name,x,z){
  let h=makeAsset(name,8);

  if(!h){
    h=new THREE.Group();

    const wall=mat(0xc9b18c);
    const roof=mat(0x704333);
    const door=mat(0x493126);
    const win=mat(0x78a4b0,.25);

    box(h,0,2.2,0,13,4.4,9,wall);
    box(h,0,4.7,0,14,.3,10,roof);
    box(h,0,1.1,4.55,1.5,2.2,.1,door);

    for(const s of [-1,1]){
      box(h,s*3,2.8,4.6,1.6,1.1,.1,win);
    }
  }

  h.position.set(x,0,z);
  scene.add(h);
}

const housePositions=[
  [-23,-85,"house1"],
  [24,-105,"house2"],
  [-25,-45,"house1"],
  [25,-15,"house2"],
  [-26,35,"house1"],
  [25,75,"house2"],
  [-25,105,"house1"],
  [25,145,"house2"],
  [-25,175,"house1"],
  [-42,-100,"house2"],
  [43,-65,"house1"],
  [-45,55,"house2"],
  [45,110,"house1"]
];

function createHouses(){
  for(const h of housePositions){
    makeHouse(h[2],h[0],h[1]);
  }
}

/* TREES */

function makeTree(x,z,s=1){
  const name=Math.random()>.5?"treeA":"treeB";
  let t=makeAsset(name,7*s);

  if(!t){
    t=new THREE.Group();

    const trunk=new THREE.Mesh(
      new THREE.CylinderGeometry(.18*s,.32*s,3.8*s,10),
      M.tree
    );

    trunk.position.y=1.9*s;
    t.add(trunk);

    for(let i=0;i<13;i++){
      const crown=new THREE.Mesh(
        new THREE.IcosahedronGeometry(
          (.8+Math.random()*.6)*s,1
        ),
        i%2?M.leaf:M.leaf2
      );

      const a=i*2.399;

      crown.position.set(
        Math.cos(a)*1.05*s,
        (3.2+Math.random()*2.1)*s,
        Math.sin(a)*1.05*s
      );

      crown.scale.set(1.12,.9,1.05);
      t.add(crown);
    }
  }

  t.position.set(x,0,z);
  t.rotation.y=Math.random()*Math.PI*2;
  scene.add(t);
}

function createTrees(){
  for(let i=0;i<65;i++){
    const x=(Math.random()-.5)*180;
    const z=(Math.random()-.5)*230;

    if(Math.abs(x)>10){
      makeTree(x,z,.8+Math.random()*.8);
    }
  }
}

function bananaTree(x,z){
  const g=new THREE.Group();

  const tr=new THREE.Mesh(
    new THREE.CylinderGeometry(.16,.2,2.6,12),
    M.tree
  );

  tr.position.y=1.3;
  g.add(tr);

  for(let i=0;i<7;i++){
    const l=new THREE.Mesh(
      new THREE.ConeGeometry(.35,3.6,7),
      M.leaf
    );

    l.position.y=2.6;
    l.rotation.z=Math.PI/2.4;
    l.rotation.y=i*.9;
    l.scale.set(.55,1,.25);
    g.add(l);
  }

  g.position.set(x,0,z);
  scene.add(g);
}

for(let i=0;i<15;i++){
  bananaTree(
    15+Math.random()*45,
    -90+Math.random()*180
  );
}

/* HUMAN CHARACTER WITH MOVING LIMBS */

function makeFallbackHuman(kind="casual"){
  const g=new THREE.Group();

  const skin=mat(0xb77e5b);

  const shirt=mat(
    ({
      farmer:0x527342,
      casual:0x426b9a,
      worker:0xb78a37
    })[kind]||0x8b4b3e
  );

  const pants=mat(0x343b49);
  const shoes=mat(0x242321);
  const hair=mat(0x211b18);

  function capsule(parent,r,len,m,x,y,z){
    const o=new THREE.Mesh(
      new THREE.CapsuleGeometry(r,len,4,8),
      m
    );

    o.position.set(x,y,z);
    o.castShadow=true;
    parent.add(o);

    return o;
  }

  const legs=[];
  const arms=[];

  // Legs with separate joints
  for(const side of [-1,1]){
    const leg=new THREE.Group();
    leg.position.set(side*.15,.91,0);
    g.add(leg);

    capsule(leg,.105,.52,pants,0,-.30,0);

    const foot=new THREE.Mesh(
      new THREE.SphereGeometry(.13,12,8),
      shoes
    );

    foot.scale.set(.9,.55,1.5);
    foot.position.set(0,-.79,.1);
    leg.add(foot);

    legs.push(leg);
  }

  // Body
  capsule(g,.25,.5,shirt,0,1.34,0);

  const neck=new THREE.Mesh(
    new THREE.CylinderGeometry(.075,.085,.16,10),
    skin
  );

  neck.position.y=1.72;
  g.add(neck);

  // Head
  const head=new THREE.Mesh(
    new THREE.SphereGeometry(.19,16,12),
    skin
  );

  head.position.y=1.96;
  head.castShadow=true;
  g.add(head);

  // Hair
  const cap=new THREE.Mesh(
    new THREE.SphereGeometry(
      .195,14,8,0,Math.PI*2,0,Math.PI*.48
    ),
    hair
  );

  cap.position.y=2.015;
  g.add(cap);

  // Arms with separate joints
  for(const side of [-1,1]){
    const arm=new THREE.Group();
    arm.position.set(side*.31,1.49,0);
    g.add(arm);

    capsule(arm,.082,.42,shirt,0,-.25,0);

    const hand=new THREE.Mesh(
      new THREE.SphereGeometry(.08,10,8),
      skin
    );

    hand.position.set(0,-.52,0);
    arm.add(hand);

    arms.push(arm);
  }

  g.userData.limbs={legs,arms};

  return g;
}

/* RUNNING / WALKING ANIMATION */

function animateHuman(root,phase,amount=1){
  root.traverse(o=>{
    if(!o.userData.limbs)return;

    const swing=Math.sin(phase)*.62*amount;

    o.userData.limbs.legs[0].rotation.x=swing;
    o.userData.limbs.legs[1].rotation.x=-swing;

    o.userData.limbs.arms[0].rotation.x=-swing*.72;
    o.userData.limbs.arms[1].rotation.x=swing*.72;
  });
}

function addCharacterModel(name,root,height){
  const model=makeAsset(name,height);

  if(model){
    root.add(model);
  }else{
    const f=makeFallbackHuman(name);
    f.scale.setScalar(height/2.15);
    root.add(f);
  }

  return true;
}

function makeDriver(kind="worker",scale=.78){
  const g=makeFallbackHuman(kind);

  g.scale.setScalar(scale);
  g.position.y=-.48;
  g.rotation.x=-.12;

  return g;
}

/* PLAYER */

const player=new THREE.Group();
scene.add(player);

addCharacterModel("farmer",player,2.05);

player.position.set(0,0,0);
player.rotation.y=Math.PI;

let jumpVelocity=0;
let isJumping=false;

/* VILLAGERS */

const villagers=[];

function addVillager(name,x,z,height=1.9){
  const n=new THREE.Group();

  addCharacterModel(name,n,height);

  n.position.set(x,0,z);
  scene.add(n);

  villagers.push({
    mesh:n,
    phase:Math.random()*10
  });
}

addVillager("casual",8,15);
addVillager("worker",-12,30);
addVillager("casual",30,-20);
addVillager("worker",-30,-25);
addVillager("casual",45,65);
addVillager("farmer",-42,12);
addVillager("worker",18,92);
addVillager("casual",-18,-115);

/* WHEELS */

function makeWheel(parent,x,y,z,r){
  const tire=new THREE.Mesh(
    new THREE.CylinderGeometry(r,r,.24,24),
    M.black
  );

  tire.rotation.z=Math.PI/2;
  tire.position.set(x,y,z);
  tire.castShadow=true;
  parent.add(tire);

  const rim=new THREE.Mesh(
    new THREE.CylinderGeometry(
      r*.56,r*.56,.255,20
    ),
    M.metal
  );

  rim.rotation.z=Math.PI/2;
  rim.position.copy(tire.position);
  parent.add(rim);

  const hub=new THREE.Mesh(
    new THREE.CylinderGeometry(
      r*.18,r*.18,.27,14
    ),
    M.metal
  );

  hub.rotation.z=Math.PI/2;
  hub.position.copy(tire.position);
  parent.add(hub);

  return tire;
}

const traffic=[];

/* TRACTOR WITH DRIVER */

function makeTractor(x,z,direction=1){
  const g=new THREE.Group();
  const wheels=[];

  const green=mat(0x28743b,.68);
  const dark=mat(0x174d2b,.8);
  const metal=mat(0x858d8a,.42,.45);

  const chassis=new THREE.Mesh(
    new THREE.CapsuleGeometry(.42,1.45,5,12),
    dark
  );

  chassis.rotation.x=Math.PI/2;
  chassis.scale.set(1,.66,1);
  chassis.position.set(0,.82,.05);
  g.add(chassis);

  const bonnet=new THREE.Mesh(
    new THREE.CylinderGeometry(.47,.56,1.35,20),
    green
  );

  bonnet.rotation.x=Math.PI/2;
  bonnet.position.set(0,1.15,.72);
  g.add(bonnet);

  const nose=new THREE.Mesh(
    new THREE.CylinderGeometry(.42,.47,.14,18),
    dark
  );

  nose.rotation.x=Math.PI/2;
  nose.position.set(0,1.15,1.43);
  g.add(nose);

  for(let i=-3;i<=3;i++){
    box(g,i*.085,1.15,1.51,.035,.62,.035,metal);
  }

  for(const s of [-1,1]){
    const lamp=new THREE.Mesh(
      new THREE.SphereGeometry(.105,12,8),
      mat(0xffe7a1)
    );

    lamp.position.set(s*.36,1.37,1.45);
    g.add(lamp);

    const fender=new THREE.Mesh(
      new THREE.TorusGeometry(.62,.075,8,24,Math.PI),
      green
    );

    fender.rotation.z=Math.PI;
    fender.position.set(s*.72,.58,-.68);
    g.add(fender);

    wheels.push(
      makeWheel(g,s*.77,.58,-.68,.57),
      makeWheel(g,s*.69,.4,1,.38)
    );
  }

  const seat=new THREE.Mesh(
    new THREE.CapsuleGeometry(.18,.28,4,10),
    M.black
  );

  seat.position.set(0,1.55,-.58);
  g.add(seat);

  const steering=new THREE.Mesh(
    new THREE.TorusGeometry(.23,.025,8,18),
    metal
  );

  steering.position.set(0,1.48,.02);
  steering.rotation.x=.55;
  g.add(steering);

  // Visible tractor driver
  const driver=makeDriver("farmer",.78);
  driver.position.set(0,.92,-.72);
  g.add(driver);

  const exhaust=new THREE.Mesh(
    new THREE.CylinderGeometry(.045,.055,.95,10),
    metal
  );

  exhaust.position.set(-.34,1.86,.88);
  g.add(exhaust);

  // Trailer
  const trailer=new THREE.Group();

  box(trailer,0,.95,0,1.9,.18,2.55,M.red);

  for(const s of [-1,1]){
    box(trailer,s*.9,1.28,0,.1,.62,2.55,M.red);

    wheels.push(
      makeWheel(trailer,s*1,.46,0,.34)
    );
  }

  for(let i=0;i<6;i++){
    const sack=new THREE.Mesh(
      new THREE.SphereGeometry(.24,10,8),
      mat(0xb99a58)
    );

    sack.scale.set(1,.8,1.5);

    sack.position.set(
      -.55+(i%3)*.55,
      1.16,
      -.65+Math.floor(i/3)*.65
    );

    trailer.add(sack);
  }

  trailer.position.z=-2.55;
  g.add(trailer);

  g.position.set(x,0,z);
  g.rotation.y=direction>0?0:Math.PI;

  scene.add(g);

  traffic.push({
    mesh:g,
    wheels,
    speed:direction*3.2
  });
}

/* MOTORBIKE WITH RIDER */

function makeMotorcycle(x,z,direction=1){
  const g=new THREE.Group();
  const wheels=[];

  const red=mat(0xa52e25,.55);
  const chrome=mat(0x9ca5a5,.35,.7);

  wheels.push(
    makeWheel(g,0,.43,.86,.39),
    makeWheel(g,0,.43,-.86,.39)
  );

  const tank=new THREE.Mesh(
    new THREE.SphereGeometry(.42,16,12),
    red
  );

  tank.scale.set(.72,.65,1.05);
  tank.position.set(0,1.02,.05);
  g.add(tank);

  const seat=new THREE.Mesh(
    new THREE.CapsuleGeometry(.17,.58,4,10),
    M.black
  );

  seat.rotation.x=Math.PI/2;
  seat.position.set(0,1.13,-.55);
  g.add(seat);

  const engine=new THREE.Mesh(
    new THREE.CylinderGeometry(.24,.24,.42,12),
    mat(0x777d7c,.4,.55)
  );

  engine.rotation.z=Math.PI/2;
  engine.position.set(0,.72,-.12);
  g.add(engine);

  for(const s of [-1,1]){
    const fork=new THREE.Mesh(
      new THREE.CylinderGeometry(.035,.045,.83,8),
      chrome
    );

    fork.position.set(s*.09,.87,.65);
    fork.rotation.x=-.18;
    g.add(fork);
  }

  const handle=new THREE.Mesh(
    new THREE.CylinderGeometry(.035,.035,.78,8),
    chrome
  );

  handle.rotation.z=Math.PI/2;
  handle.position.set(0,1.35,.68);
  g.add(handle);

  const lamp=new THREE.Mesh(
    new THREE.SphereGeometry(.15,12,10),
    mat(0xffe8b4)
  );

  lamp.position.set(0,1.25,.89);
  g.add(lamp);

  const exhaust=new THREE.Mesh(
    new THREE.CylinderGeometry(.055,.07,.85,10),
    chrome
  );

  exhaust.rotation.x=Math.PI/2;
  exhaust.position.set(.22,.64,-.18);
  g.add(exhaust);

  // Visible motorcycle rider
  const rider=makeDriver("casual",.72);
  rider.position.set(0,.88,-.48);
  rider.rotation.x=-.08;
  g.add(rider);

  g.position.set(x,0,z);
  g.rotation.y=direction>0?0:Math.PI;

  scene.add(g);

  traffic.push({
    mesh:g,
    wheels,
    speed:direction*5.8
  });
}

/* CAR WITH DRIVER */

function makeCar(x,z,direction=1){
  const g=new THREE.Group();
  const wheels=[];

  const bodyMat=mat(0x315d86,.48,.18);

  const glass=new THREE.MeshStandardMaterial({
    color:0x9fc6d1,
    roughness:.18,
    metalness:.25,
    transparent:true,
    opacity:.58
  });

  const body=new THREE.Mesh(
    new THREE.CapsuleGeometry(.58,1.55,5,16),
    bodyMat
  );

  body.rotation.x=Math.PI/2;
  body.scale.set(1,.72,1);
  body.position.y=.82;
  g.add(body);

  const cabin=new THREE.Mesh(
    new THREE.CapsuleGeometry(.44,.8,5,14),
    glass
  );

  cabin.rotation.x=Math.PI/2;
  cabin.scale.set(.94,.75,.9);
  cabin.position.set(0,1.38,-.13);
  g.add(cabin);

  for(const s of [-1,1]){
    wheels.push(
      makeWheel(g,s*.58,.47,.78,.31),
      makeWheel(g,s*.58,.47,-.78,.31)
    );

    const hl=new THREE.Mesh(
      new THREE.SphereGeometry(.1,10,8),
      mat(0xffedbd)
    );

    hl.position.set(s*.39,.82,1.52);
    g.add(hl);

    const tl=new THREE.Mesh(
      new THREE.SphereGeometry(.09,10,8),
      mat(0xb52b21)
    );

    tl.position.set(s*.39,.82,-1.5);
    g.add(tl);
  }

  box(g,-.23,1.05,-.25,.42,.12,.48,M.black);

  // Visible car driver
  const driver=makeDriver("worker",.68);
  driver.position.set(-.23,.54,-.28);
  g.add(driver);

  const steering=new THREE.Mesh(
    new THREE.TorusGeometry(.17,.018,8,16),
    M.black
  );

  steering.position.set(-.23,1.25,.35);
  steering.rotation.x=.5;
  g.add(steering);

  g.position.set(x,0,z);
  g.rotation.y=direction>0?0:Math.PI;

  scene.add(g);

  traffic.push({
    mesh:g,
    wheels,
    speed:direction*7.5
  });
}

/* VEHICLE SPAWN */

makeTractor(-2.5,-155,1);
makeCar(2.5,-105,-1);
makeMotorcycle(2.5,145,-1);
makeMotorcycle(-2.5,-65,1);

/* BIRDS */

const birds=[];

for(let i=0;i<9;i++){
  const bird=new THREE.Group();

  const feather=mat(0x353a3a);
  const belly=mat(0x77766d);

  const body=new THREE.Mesh(
    new THREE.SphereGeometry(.22,12,9),
    feather
  );

  body.scale.set(.78,.72,1.35);
  bird.add(body);

  const head=new THREE.Mesh(
    new THREE.SphereGeometry(.13,12,9),
    belly
  );

  head.position.set(0,.08,.28);
  bird.add(head);

  const beak=new THREE.Mesh(
    new THREE.ConeGeometry(.055,.22,7),
    mat(0xc58c35)
  );

  beak.rotation.x=-Math.PI/2;
  beak.position.set(0,.04,.46);
  bird.add(beak);

  const tail=new THREE.Mesh(
    new THREE.ConeGeometry(.13,.42,7),
    feather
  );

  tail.rotation.x=Math.PI/2;
  tail.position.z=-.34;
  bird.add(tail);

  const wings=[];

  for(const s of [-1,1]){
    const p=new THREE.Group();
    p.position.set(s*.12,.05,.02);
    bird.add(p);

    const w=new THREE.Mesh(
      new THREE.SphereGeometry(.32,10,8),
      feather
    );

    w.scale.set(1.65,.12,.55);
    w.position.x=s*.3;
    p.add(w);

    wings.push({pivot:p,side:s});
  }

  bird.position.set(
    (Math.random()-.5)*85,
    13+Math.random()*9,
    (Math.random()-.5)*110
  );

  scene.add(bird);

  birds.push({
    mesh:bird,
    wings,
    phase:Math.random()*10,
    speed:1.2+Math.random()*1.4
  });
}

/* MOBILE CONTROLS */

const controls=document.createElement("div");

controls.style.cssText=
  "position:fixed;inset:0;z-index:20;pointer-events:none";

document.body.appendChild(controls);

/* JOYSTICK */

const joystick=document.createElement("div");

joystick.id="joystick";

joystick.style.cssText=
  "position:absolute;left:25px;bottom:35px;width:125px;height:125px;border-radius:50%;background:rgba(20,25,25,.32);border:2px solid rgba(255,255,255,.55);pointer-events:auto;touch-action:none";

const stick=document.createElement("div");

stick.style.cssText=
  "position:absolute;width:52px;height:52px;left:35px;top:35px;border-radius:50%;background:rgba(255,255,255,.7);border:2px solid white";

joystick.appendChild(stick);
controls.appendChild(joystick);

let moveX=0;
let moveY=0;
let joyPointer=null;

function updateJoystick(e){
  const r=joystick.getBoundingClientRect();
  const cx=r.left+r.width/2;
  const cy=r.top+r.height/2;

  let dx=e.clientX-cx;
  let dy=e.clientY-cy;

  const max=43;
  const d=Math.hypot(dx,dy);

  if(d>max){
    dx=dx/d*max;
    dy=dy/d*max;
  }

  stick.style.left=(35+dx)+"px";
  stick.style.top=(35+dy)+"px";

  moveX=dx/max;
  moveY=dy/max;
}

joystick.addEventListener("pointerdown",e=>{
  joyPointer=e.pointerId;
  joystick.setPointerCapture(e.pointerId);
  updateJoystick(e);
});

joystick.addEventListener("pointermove",e=>{
  if(e.pointerId===joyPointer){
    updateJoystick(e);
  }
});

function releaseJoy(e){
  if(e.pointerId!==joyPointer)return;

  joyPointer=null;
  moveX=0;
  moveY=0;

  stick.style.left="35px";
  stick.style.top="35px";
}

joystick.addEventListener("pointerup",releaseJoy);
joystick.addEventListener("pointercancel",releaseJoy);

/* JUMP */

const jumpButton=document.createElement("button");

jumpButton.id="jump";
jumpButton.textContent="JUMP";

jumpButton.style.cssText=
  "position:absolute;right:28px;bottom:48px;width:75px;height:75px;border-radius:50%;border:2px solid white;background:rgba(220,170,60,.75);color:white;font-weight:bold;font-size:15px;pointer-events:auto;touch-action:none";

controls.appendChild(jumpButton);

function jump(){
  if(!isJumping){
    jumpVelocity=7.5;
    isJumping=true;
  }
}

jumpButton.addEventListener("pointerdown",e=>{
  e.preventDefault();
  jump();
});

/* CAMERA LOOK */

let cameraYaw=0;
let cameraPitch=.68;
const cameraDistance=9.5;

let lookTouchId=null;
let lastTouchX=0;
let lastTouchY=0;

window.addEventListener("touchstart",e=>{
  if(lookTouchId!==null)return;

  const t=Array.from(e.changedTouches).find(t=>{
    const el=document.elementFromPoint(t.clientX,t.clientY);

    return el&&!el.closest("#joystick,#jump");
  });

  if(!t)return;

  lookTouchId=t.identifier;
  lastTouchX=t.clientX;
  lastTouchY=t.clientY;

},{capture:true,passive:false});

window.addEventListener("touchmove",e=>{
  if(lookTouchId===null)return;

  const t=Array.from(e.touches).find(
    t=>t.identifier===lookTouchId
  );

  if(!t)return;

  const dx=t.clientX-lastTouchX;
  const dy=t.clientY-lastTouchY;

  lastTouchX=t.clientX;
  lastTouchY=t.clientY;

  cameraYaw-=dx*.006;

  cameraPitch=THREE.MathUtils.clamp(
    cameraPitch+dy*.005,
    .18,
    1.25
  );

  e.preventDefault();

},{capture:true,passive:false});

function endLook(e){
  if(Array.from(e.changedTouches).some(
    t=>t.identifier===lookTouchId
  )){
    lookTouchId=null;
  }
}

window.addEventListener("touchend",endLook);
window.addEventListener("touchcancel",endLook);

/* GAME LOOP */

const clock=new THREE.Clock();
let elapsed=0;

function animate(){
  requestAnimationFrame(animate);

  const dt=Math.min(clock.getDelta(),.04);
  elapsed+=dt;

  // Joystick up = forward, down = backward.
  const forward=-moveY;
  const side=moveX;

  const moving=Math.hypot(forward,side)>.08;

  if(moving){
    const dx=
      side*Math.cos(cameraYaw)-
      forward*Math.sin(cameraYaw);

    const dz=
      -side*Math.sin(cameraYaw)-
      forward*Math.cos(cameraYaw);

    const len=Math.hypot(dx,dz)||1;

    player.position.x+=(dx/len)*5*dt;
    player.position.z+=(dz/len)*5*dt;

    player.rotation.y=Math.atan2(dx/len,dz/len);

    // Running animation
    animateHuman(player,elapsed*12,1);
  }else{
    // Stop running when joystick is released
    animateHuman(player,0,0);
  }

  // Jump physics
  if(isJumping){
    player.position.y+=jumpVelocity*dt;
    jumpVelocity-=18*dt;

    if(player.position.y<=0){
      player.position.y=0;
      jumpVelocity=0;
      isJumping=false;
    }
  }

  // Villager walking animation
  for(const n of villagers){
    n.mesh.position.y=
      Math.sin(elapsed*2+n.phase)*.025;

    animateHuman(
      n.mesh,
      elapsed*3+n.phase,
      .45
    );
  }

  // Vehicle movement
  for(const v of traffic){
    v.mesh.position.z+=v.speed*dt;

    if(v.mesh.position.z>220){
      v.mesh.position.z=-220;
    }

    if(v.mesh.position.z< -220){
      v.mesh.position.z=220;
    }

    for(const w of v.wheels){
      w.rotation.x+=v.speed*dt*1.8;
    }
  }

  // Flying birds
  for(const b of birds){
    b.mesh.position.x+=b.speed*dt;

    b.mesh.position.y+=
      Math.sin(elapsed*2+b.phase)*dt*.25;

    b.mesh.position.z+=
      Math.cos(elapsed+b.phase)*dt*.35;

    if(b.mesh.position.x>100){
      b.mesh.position.x=-100;
    }

    for(const w of b.wings){
      w.pivot.rotation.z=
        w.side*Math.sin(elapsed*9+b.phase)*.72;
    }
  }

  // Camera follows player
  const h=cameraDistance*Math.cos(cameraPitch);

  const target=new THREE.Vector3(
    player.position.x+Math.sin(cameraYaw)*h,
    player.position.y+cameraDistance*Math.sin(cameraPitch),
    player.position.z+Math.cos(cameraYaw)*h
  );

  camera.position.lerp(
    target,
    1-Math.exp(-7*dt)
  );

  camera.lookAt(
    player.position.x,
    player.position.y+1.2,
    player.position.z
  );

  renderer.render(scene,camera);
}

/* START GAME */

async function startGame(){
  status("Building Nayabasti...",15);

  createHouses();
  createTrees();

  status("Loading optional 3D models...",30);

  // Optional assets load in the background.
  prepareAssets().catch(e=>{
    console.warn("Optional model loading:",e);
  });

  // Start immediately using local 3D characters and objects.
  setTimeout(()=>{
    if(loading.isConnected){
      loading.remove();
    }
  },800);

  animate();
}

startGame().catch(e=>{
  console.error(e);
  loading.textContent="Game error — reload the page";
});

/* RESIZE */

window.addEventListener("resize",()=>{
  camera.aspect=innerWidth/innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(innerWidth,innerHeight);
  renderer.setPixelRatio(
    Math.min(devicePixelRatio||1,1.25)
  );
});


/* =========================================
   NAYABASTI TERAI — VILLAGE LIFE UPGRADE
   Add at the VERY END of game.js
========================================= */

const villageAnimals = [];
const villageDetails = [];

// Extra materials
const animalMats = {
  cow: mat(0xe5dfc9),
  cowPatch: mat(0x49423a),
  buffalo: mat(0x292b2b),
  goat: mat(0xb9a58a),
  dog: mat(0xb58a5e),
  nose: mat(0x30221b),
  horn: mat(0xd7c7a0),
  hay: mat(0xc4a04c),
  wood: mat(0x65452b),
  pole: mat(0x777d79),
  wire: mat(0x303536)
};

function makeAnimal(type, x, z, scale = 1) {
  const g = new THREE.Group();

  const bodyMat = animalMats[type];
  const body = new THREE.Mesh(
    new THREE.SphereGeometry(0.65, 18, 14),
    bodyMat
  );

  body.scale.set(1.15, 0.78, 0.72);
  body.position.y = 0.95;
  body.castShadow = true;
  g.add(body);

  const head = new THREE.Group();
  head.position.set(0, 1.15, 0.62);
  g.add(head);

  const headMesh = new THREE.Mesh(
    new THREE.SphereGeometry(
      type === "dog" ? 0.27 : 0.31,
      14,
      12
    ),
    bodyMat
  );
  headMesh.position.z = 0.18;
  headMesh.castShadow = true;
  head.add(headMesh);

  const muzzle = new THREE.Mesh(
    new THREE.SphereGeometry(0.16, 12, 10),
    animalMats.nose
  );
  muzzle.position.set(0, -0.08, 0.43);
  head.add(muzzle);

  // Ears
  for (const s of [-1, 1]) {
    const ear = new THREE.Mesh(
      new THREE.SphereGeometry(0.13, 10, 8),
      bodyMat
    );
    ear.scale.set(1.5, 0.55, 0.7);
    ear.position.set(s * 0.27, 0.12, 0.12);
    ear.rotation.z = s * -0.25;
    head.add(ear);
  }

  // Horns for cow, buffalo and goat
  if (type !== "dog") {
    for (const s of [-1, 1]) {
      const horn = new THREE.Mesh(
        new THREE.ConeGeometry(0.075, 0.38, 8),
        animalMats.horn
      );
      horn.position.set(s * 0.2, 0.39, 0.08);
      horn.rotation.z = s * -0.45;
      head.add(horn);
    }
  }

  // Cow patches
  if (type === "cow") {
    for (let i = 0; i < 3; i++) {
      const patch = new THREE.Mesh(
        new THREE.SphereGeometry(0.22, 10, 8),
        animalMats.cowPatch
      );
      patch.scale.set(1.1, 0.7, 0.25);
      patch.position.set(
        (i - 1) * 0.38,
        1.25 + (i % 2) * 0.13,
        -0.18
      );
      g.add(patch);
    }
  }

  // Four legs
  const legs = [];

  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const leg = new THREE.Group();
      leg.position.set(sx * 0.39, 0.72, sz * 0.39);

      const limb = new THREE.Mesh(
        new THREE.CylinderGeometry(
          0.075,
          0.095,
          type === "goat" ? 0.72 : 0.65,
          9
        ),
        bodyMat
      );
      limb.position.y = -0.3;
      limb.castShadow = true;
      leg.add(limb);

      const hoof = new THREE.Mesh(
        new THREE.BoxGeometry(0.17, 0.12, 0.18),
        animalMats.nose
      );
      hoof.position.y = -0.64;
      leg.add(hoof);

      g.add(leg);
      legs.push(leg);
    }
  }

  // Tail
  const tail = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.045, 0.65, 7),
    bodyMat
  );
  tail.position.set(0, 1.05, -0.78);
  tail.rotation.x = -0.55;
  g.add(tail);

  g.scale.setScalar(scale);
  g.position.set(x, 0, z);
  scene.add(g);

  villageAnimals.push({
    mesh: g,
    head,
    legs,
    tail,
    phase: Math.random() * 6,
    type
  });

  return g;
}

// Animals around village houses
makeAnimal("cow", -17, -77, 1.05);
makeAnimal("cow", 31, -94, 1.0);
makeAnimal("buffalo", -33, -39, 1.12);
makeAnimal("buffalo", 34, 68, 1.08);
makeAnimal("goat", -18, 42, 0.72);
makeAnimal("goat", 30, 132, 0.75);
makeAnimal("goat", -39, 100, 0.72);
makeAnimal("dog", 8, -22, 0.72);
makeAnimal("dog", -12, 112, 0.75);

// Haystacks
function makeHaystack(x, z, size = 1) {
  const h = new THREE.Group();

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(
      0.9 * size,
      1.15 * size,
      1.1 * size,
      14
    ),
    animalMats.hay
  );
  base.position.y = 0.55 * size;
  base.castShadow = true;
  h.add(base);

  const top = new THREE.Mesh(
    new THREE.ConeGeometry(1.05 * size, 1.1 * size, 14),
    animalMats.hay
  );
  top.position.y = 1.55 * size;
  top.castShadow = true;
  h.add(top);

  h.position.set(x, 0, z);
  scene.add(h);
  villageDetails.push(h);
}

makeHaystack(-34, -91, 1.1);
makeHaystack(36, -42, 0.9);
makeHaystack(-39, 78, 1.0);
makeHaystack(38, 155, 1.1);

// Wooden village fences
function makeFence(x, z, length, rotation = 0) {
  const f = new THREE.Group();

  const sections = Math.max(2, Math.floor(length / 2));

  for (let i = 0; i <= sections; i++) {
    const px = -length / 2 + (length / sections) * i;

    const post = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 1.2, 0.14),
      animalMats.wood
    );
    post.position.set(px, 0.6, 0);
    post.castShadow = true;
    f.add(post);
  }

  for (const y of [0.38, 0.9]) {
    const rail = new THREE.Mesh(
      new THREE.BoxGeometry(length, 0.12, 0.12),
      animalMats.wood
    );
    rail.position.y = y;
    rail.castShadow = true;
    f.add(rail);
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

// Electric poles and overhead wires
function makeElectricPole(x, z) {
  const p = new THREE.Group();

  const post = new THREE.Mesh(
    new THREE.CylinderGeometry(0.13, 0.19, 10, 10),
    animalMats.pole
  );
  post.position.y = 5;
  post.castShadow = true;
  p.add(post);

  const crossbar = new THREE.Mesh(
    new THREE.BoxGeometry(3.2, 0.16, 0.18),
    animalMats.wood
  );
  crossbar.position.y = 9.2;
  p.add(crossbar);

  for (const s of [-1, 0, 1]) {
    const insulator = new THREE.Mesh(
      new THREE.CylinderGeometry(0.09, 0.09, 0.4, 8),
      animalMats.white || M.white
    );
    insulator.position.set(s * 1.15, 9.48, 0);
    p.add(insulator);
  }

  p.position.set(x, 0, z);
  scene.add(p);
  villageDetails.push(p);
}

for (let z = -190; z <= 190; z += 38) {
  makeElectricPole(-10, z);
  makeElectricPole(10, z);
}

// Wire between poles
function makeWire(x1, z1, x2, z2, y = 9.5) {
  const curve = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(x1, y, z1),
    new THREE.Vector3((x1 + x2) / 2, y - 1.1, (z1 + z2) / 2),
    new THREE.Vector3(x2, y, z2)
  );

  const wire = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 20, 0.025, 5, false),
    animalMats.wire
  );
  scene.add(wire);
}

for (let z = -190; z < 190; z += 38) {
  makeWire(-10, z, -10, z + 38);
  makeWire(10, z, 10, z + 38);
}

// Banana plant clusters
function makeBananaCluster(x, z) {
  for (let i = 0; i < 4; i++) {
    bananaTree(
      x + (Math.random() - 0.5) * 4,
      z + (Math.random() - 0.5) * 4
    );
  }
}

makeBananaCluster(-36, -15);
makeBananaCluster(37, 35);
makeBananaCluster(-40, 145);
makeBananaCluster(42, -145);

// Small outdoor water pots
function makeWaterPot(x, z) {
  const pot = new THREE.Group();

  const clay = mat(0x9b5940);

  const body = new THREE.Mesh(
    new THREE.SphereGeometry(0.38, 14, 12),
    clay
  );
  body.scale.set(1, 1.15, 1);
  body.position.y = 0.4;
  pot.add(body);

  const opening = new THREE.Mesh(
    new THREE.CylinderGeometry(0.19, 0.23, 0.12, 14),
    clay
  );
  opening.position.y = 0.82;
  pot.add(opening);

  const water = new THREE.Mesh(
    new THREE.CircleGeometry(0.16, 14),
    M.water
  );
  water.rotation.x = -Math.PI / 2;
  water.position.y = 0.89;
  pot.add(water);

  pot.position.set(x, 0, z);
  scene.add(pot);
}

makeWaterPot(-18, -88);
makeWaterPot(30, -12);
makeWaterPot(-32, 55);
makeWaterPot(28, 108);

// Animal idle and grazing animation
const animalClock = new THREE.Clock();

function animateVillageAnimals() {
  requestAnimationFrame(animateVillageAnimals);

  const t = animalClock.getElapsedTime();

  for (const a of villageAnimals) {
    const phase = t * 2 + a.phase;

    a.head.rotation.x =
      a.type === "cow" || a.type === "buffalo"
        ? Math.sin(phase * 0.5) * 0.08
        : Math.sin(phase) * 0.12;

    a.tail.rotation.x = -0.55 + Math.sin(phase * 2) * 0.3;
    a.tail.rotation.z = Math.sin(phase * 1.4) * 0.25;

    for (let i = 0; i < a.legs.length; i++) {
      a.legs[i].rotation.x =
        Math.sin(phase + i * Math.PI / 2) * 0.035;
    }

    a.mesh.position.y =
      Math.abs(Math.sin(phase)) * 0.012;
  }
}

animateVillageAnimals();

console.log("Nayabasti village life upgrade loaded.");
