
/* GTA STYLE FULL SCREEN TOUCH CAMERA */

renderer.domElement.style.touchAction = "none";

let cameraPointer = null;
let previousTouchX = 0;
let previousTouchY = 0;

renderer.domElement.addEventListener("pointerdown", (e) => {
  if (
    e.target.closest("button") ||
    e.target.closest("#joystick")
  ) return;

  cameraPointer = e.pointerId;

  previousTouchX = e.clientX;
  previousTouchY = e.clientY;

  renderer.domElement.setPointerCapture(e.pointerId);
});

renderer.domElement.addEventListener("pointermove", (e) => {
  if (cameraPointer !== e.pointerId) return;

  const dx = e.clientX - previousTouchX;
  const dy = e.clientY - previousTouchY;

  targetYaw -= dx * 0.012;
  targetPitch += dy * 0.009;

  targetPitch = THREE.MathUtils.clamp(
    targetPitch,
    -1.2,
    1.2
  );

  previousTouchX = e.clientX;
  previousTouchY = e.clientY;
});

function stopCamera() {
  cameraPointer = null;
}

renderer.domElement.addEventListener("pointerup", stopCamera);
renderer.domElement.addEventListener("pointercancel", stopCamera);
