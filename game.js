import { startStory } from "./story.js";

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 30, 180);

const camera = new THREE.PerspectiveCamera(
  65,
  window.innerWidth / window.innerHeight,
  0.1,
  500
);

camera.position.set(0, 5, 12);

const renderer = new THREE.WebGLRenderer({
  antialias: true
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.shadowMap.enabled = true;

document.body.appendChild(renderer.domElement);

// Lighting
const sunlight = new THREE.DirectionalLight(0xffffff, 2);
sunlight.position.set(20, 30, 10);
sunlight.castShadow = true;
scene.add(sunlight);

scene.add(new THREE.HemisphereLight(0xffffff, 0x52633d, 2));

// Ground
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(300, 300),
  new THREE.MeshStandardMaterial({ color: 0x557c38 })
);

ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// Road
const road = new THREE.Mesh(
  new THREE.PlaneGeometry(9, 300),
  new THREE.MeshStandardMaterial({ color: 0x77736b })
);

road.rotation.x = -Math.PI / 2;
road.position.y = 0.03;
scene.add(road);

// Temporary player placeholder
const player = new THREE.Mesh(
  new THREE.CapsuleGeometry(0.45, 1, 4, 8),
  new THREE.MeshStandardMaterial({ color: 0x263f75 })
);

player.position.set(0, 1.2, 0);
player.castShadow = true;
scene.add(player);

camera.lookAt(player.position);

// Movement
const keys = {};

window.addEventListener("keydown", e => {
  keys[e.key.toLowerCase()] = true;
});

window.addEventListener("keyup", e => {
  keys[e.key.toLowerCase()] = false;
});

function animate() {
  requestAnimationFrame(animate);

  const speed = 0.12;

  if (keys["w"] || keys["arrowup"]) player.position.z -= speed;
  if (keys["s"] || keys["arrowdown"]) player.position.z += speed;
  if (keys["a"] || keys["arrowleft"]) player.position.x -= speed;
  if (keys["d"] || keys["arrowright"]) player.position.x += speed;

  camera.position.x += (player.position.x - camera.position.x) * 0.08;
  camera.position.z += (player.position.z + 12 - camera.position.z) * 0.08;
  camera.lookAt(player.position);

  renderer.render(scene, camera);
}

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();startStory(() => {
  console.log("MAYUSH ADVENTURE STARTED");
});