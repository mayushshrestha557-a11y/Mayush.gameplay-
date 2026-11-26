
/* FULL SCREEN GTA STYLE CAMERA CONTROL */

const cameraArea = document.createElement("div");

Object.assign(cameraArea.style, {
  position: "fixed",
  inset: "0",
  width: "100%",
  height: "100%",
  zIndex: "1",
  background: "transparent",
  touchAction: "none"
});

document.body.appendChild(cameraArea);

let cameraPointer = null;
let lastX = 0;
let lastY = 0;

cameraArea.addEventListener("pointerdown", (e) => {
  // Ignore joystick and buttons
  if (
    e.target.closest("button") ||
    e.target.closest("#joystick")
  ) return;

  cameraPointer = e.pointerId;
  lastX = e.clientX;
  lastY = e.clientY;

  cameraArea.setPointerCapture(e.pointerId);
});

cameraArea.addEventListener("pointermove", (e) => {
  if (cameraPointer !== e.pointerId) return;

  const dx = e.clientX - lastX;
  const dy = e.clientY - lastY;

  targetYaw -= dx * 0.010;
  targetPitch += dy * 0.008;

  // Unlimited horizontal 360-degree rotation
  // Safe vertical viewing angle
  targetPitch = THREE.MathUtils.clamp(
    targetPitch,
    -1.2,
    1.2
  );

  lastX = e.clientX;
  lastY = e.clientY;
});

function stopCameraSwipe() {
  cameraPointer = null;
}

cameraArea.addEventListener("pointerup", stopCameraSwipe);
cameraArea.addEventListener("pointercancel", stopCameraSwipe);

// Keep touch gestures from scrolling the webpage
cameraArea.addEventListener("contextmenu", e => e.preventDefault());
