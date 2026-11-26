
let cameraYaw = 0;
let cameraPitch = 0.25;

let cameraDistance = 8;
let cameraHeight = 1.8;

let cameraMode = "FREE";

let targetYaw = 0;
let targetPitch = 0.25;
let targetDistance = 8;

const cameraTarget = new THREE.Vector3();
const desiredCameraPosition = new THREE.Vector3();

function updateCamera() {
  cameraYaw += (targetYaw - cameraYaw) * 0.18;
  cameraPitch += (targetPitch - cameraPitch) * 0.18;
  cameraDistance += (targetDistance - cameraDistance) * 0.15;

  cameraTarget.set(
    player.position.x,
    player.position.y + 1.5,
    player.position.z
  );

  const horizontal = Math.cos(cameraPitch) * cameraDistance;

  desiredCameraPosition.set(
    player.position.x + Math.sin(cameraYaw) * horizontal,
    player.position.y + cameraHeight +
      Math.sin(cameraPitch) * cameraDistance,
    player.position.z + Math.cos(cameraYaw) * horizontal
  );

  camera.position.copy(desiredCameraPosition);
  camera.lookAt(cameraTarget);
}

// FULL 360 CAMERA ROTATION

let cameraPointer = null;
let lastX = 0;
let lastY = 0;

cameraArea.addEventListener("pointerdown", e => {
  cameraPointer = e.pointerId;
  lastX = e.clientX;
  lastY = e.clientY;
  cameraArea.setPointerCapture(e.pointerId);
});

cameraArea.addEventListener("pointermove", e => {
  if (cameraPointer !== e.pointerId) return;

  const dx = e.clientX - lastX;
  const dy = e.clientY - lastY;

  targetYaw -= dx * 0.012;
  targetPitch += dy * 0.009;

  targetPitch = THREE.MathUtils.clamp(
    targetPitch,
    -1.15,
    1.15
  );

  lastX = e.clientX;
  lastY = e.clientY;
});

cameraArea.addEventListener("pointerup", () => {
  cameraPointer = null;
});

cameraArea.addEventListener("pointercancel", () => {
  cameraPointer = null;
});

// TWO FINGER PINCH ZOOM

let pinchStart = null;

cameraArea.addEventListener("touchstart", e => {
  if (e.touches.length === 2) {
    pinchStart = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    );
  }
}, { passive: false });

cameraArea.addEventListener("touchmove", e => {
  if (e.touches.length === 2 && pinchStart !== null) {
    e.preventDefault();

    const current = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    );

    targetDistance = THREE.MathUtils.clamp(
      targetDistance + (pinchStart - current) * 0.025,
      3,
      22
    );

    pinchStart = current;
  }
}, { passive: false });

cameraArea.addEventListener("touchend", e => {
  if (e.touches.length < 2) pinchStart = null;
});
