const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Set canvas size
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Load the grass sprite
const grassImg = new Image();
grassImg.src = "images/temperate/ground-textures/grass.jpg";; // Adjust the path as needed

// Grid settings
const tileSize = 100;
const gridRows = 10;
const gridCols = 10;

// Camera settings
let cameraX = 0;
let cameraY = 0;
let zoom = 1;
const zoomSpeed = 0.1;
const baseMoveSpeed = 10; // Base movement speed
const keys = {}; // Object to track pressed keys

// Function to draw the grid
function drawGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(-canvas.width / 2 + cameraX, -canvas.height / 2 + cameraY);

    for (let row = 0; row < gridRows; row++) {
        for (let col = 0; col < gridCols; col++) {
            ctx.drawImage(grassImg, col * tileSize, row * tileSize, tileSize, tileSize);
        }
    }

    ctx.restore();
}

// Event listeners for zoom
canvas.addEventListener("wheel", (event) => {
    if (event.deltaY < 0) {
        zoom += zoomSpeed;
    } else if (event.deltaY > 0) {
        zoom -= zoomSpeed;
    }
    zoom = Math.max(0.5, Math.min(2, zoom)); // Clamp zoom between 0.5x and 2x
    drawGrid();
});

// Event listeners for movement
document.addEventListener("keydown", (event) => {
  keys[event.key] = true;
});

document.addEventListener("keyup", (event) => {
  keys[event.key] = false;
});

// Update function for smooth movement
function updateCamera() {
  const moveSpeed = baseMoveSpeed / zoom; // Adjust speed dynamically

  if (keys["ArrowUp"] || keys["w"]) cameraY += moveSpeed;
  if (keys["ArrowDown"] || keys["s"]) cameraY -= moveSpeed;
  if (keys["ArrowLeft"] || keys["a"]) cameraX += moveSpeed;
  if (keys["ArrowRight"] || keys["d"]) cameraX -= moveSpeed;

  drawGrid(); // Redraw canvas with updated camera position
}

// Smooth loop (runs 60 times per second)
function gameLoop() {
  updateCamera();
  requestAnimationFrame(gameLoop);
}

gameLoop(); // Start the loop

// Mouse drag controls
let isDragging = false;
let lastMouseX, lastMouseY;

canvas.addEventListener("mousedown", (event) => {
    isDragging = true;
    lastMouseX = event.clientX;
    lastMouseY = event.clientY;
});

canvas.addEventListener("mousemove", (event) => {
    if (isDragging) {
        cameraX += (event.clientX - lastMouseX) / zoom;
        cameraY += (event.clientY - lastMouseY) / zoom;
        lastMouseX = event.clientX;
        lastMouseY = event.clientY;
        drawGrid();
    }
});

canvas.addEventListener("mouseup", () => {
    isDragging = false;
});

// Resize canvas on window resize
window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    drawGrid();
});

// Draw grid once image loads
grassImg.onload = drawGrid;
