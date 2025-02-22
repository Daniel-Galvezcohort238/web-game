let scale = 1;
let translateX = 0;
let translateY = 0;
const container = document.getElementById('container');
const maxScale = 2; // Maximum zoom-in scale factor
const movementSpeed = 20; // Pixels moved per frame

// Object to track the currently pressed keys.
const keysPressed = {};

// Update the container's transform property based on the current values.
function updateTransform() {
  container.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
}

// Handle mouse wheel zooming.
document.addEventListener('wheel', (e) => {
  e.preventDefault();
  if (e.deltaY < 0) {
    // Zoom in (scale up), but cap at maxScale.
    scale = Math.min(scale / 0.95, maxScale);
  } else {
    // Zoom out (scale down) infinitely.
    scale *= 0.95;
  }
  updateTransform();
});

// Track keydown events.
document.addEventListener('keydown', (e) => {
  keysPressed[e.key.toLowerCase()] = true;
});

// Track keyup events.
document.addEventListener('keyup', (e) => {
  keysPressed[e.key.toLowerCase()] = false;
});

// The movement loop, called continuously.
function move() {
  if (keysPressed['w']) {
    translateY += movementSpeed; // Moves container down (panning upward)
  }
  if (keysPressed['s']) {
    translateY -= movementSpeed; // Moves container up (panning downward)
  }
  if (keysPressed['a']) {
    translateX += movementSpeed; // Moves container right (panning left)
  }
  if (keysPressed['d']) {
    translateX -= movementSpeed; // Moves container left (panning right)
  }
  updateTransform();
  requestAnimationFrame(move);
}

// Start the animation loop.
requestAnimationFrame(move);
