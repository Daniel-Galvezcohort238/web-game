/*************************************
 * Zoom & Pan Functionality for #container
 *************************************/
let scale = 1;
let translateX = 0;
let translateY = 0;
const container = document.getElementById('container');
const maxScale = 2; // Maximum zoom-in scale factor
const movementSpeed = 20; // Movement speed in pixels per frame

function updateTransform() {
  container.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
}

document.addEventListener('wheel', (e) => {
  e.preventDefault();
  if (e.deltaY < 0) {
    // Zoom in, capped at maxScale.
    scale = Math.min(scale / 0.95, maxScale);
  } else {
    // Zoom out infinitely.
    scale *= 0.95;
  }
  updateTransform();
});

// Track keys for continuous WASD movement.
const keysPressed = {};
document.addEventListener('keydown', (e) => { keysPressed[e.key.toLowerCase()] = true; });
document.addEventListener('keyup', (e) => { keysPressed[e.key.toLowerCase()] = false; });

function move() {
  if (keysPressed['w']) { translateY += movementSpeed; }
  if (keysPressed['s']) { translateY -= movementSpeed; }
  if (keysPressed['a']) { translateX += movementSpeed; }
  if (keysPressed['d']) { translateX -= movementSpeed; }
  updateTransform();
  requestAnimationFrame(move);
}
requestAnimationFrame(move);

/*************************************
 * Procedural Generation for Forest Biomes
 *************************************/

// Helper: Load an image and return a promise.
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = src;
    img.onload = () => resolve(img);
    img.onerror = reject;
  });
}

// Load the grass and tree sprites.
Promise.all([
  loadImage('images/forest/grass.jpg'),
  loadImage('images/forest/tree.jpg')
]).then(([grassImg, treeImg]) => {
  // When images are loaded, generate the forest biomes.
  generateForestBiomes(grassImg, treeImg);
}).catch(err => {
  console.error("Error loading images:", err);
});

/*
  generateForestBiomes creates a 5x5 grid (25 biomes) of canvases,
  each 10,000×10,000 pixels in size. Inside each canvas, a wavefunction
  collapse algorithm is used to fill a 100x100 grid (each cell is 100x100 pixels)
  with either a grass or a tree sprite.
*/
function generateForestBiomes(grassImg, treeImg) {
  const biomeCols = 5;
  const biomeRows = 5;
  const biomeSize = 10000; // in pixels
  const cellSize = 100; // each sprite is 100x100 pixels
  const gridCells = biomeSize / cellSize; // 100 cells per side

  // Create biomes (one canvas per biome)
  for (let row = 0; row < biomeRows; row++) {
    for (let col = 0; col < biomeCols; col++) {
      const canvas = document.createElement('canvas');
      canvas.width = biomeSize;
      canvas.height = biomeSize;
      container.appendChild(canvas);

      // Generate a forest grid for this biome.
      const grid = generateForestGrid(gridCells, gridCells);
      // Draw the forest biome on the canvas.
      drawForestBiome(canvas, grid, grassImg, treeImg);
    }
  }
}

/*
  generateForestGrid creates a grid of the given width and height (in cells).
  Each cell initially has two possibilities: 'grass' or 'tree'.
  The simple adjacency rules are:
    - 'grass' can border both 'grass' and 'tree'.
    - 'tree' can only border 'grass' (ensuring trees never touch directly).
*/
function generateForestGrid(width, height) {
  const grid = [];
  for (let y = 0; y < height; y++) {
    grid[y] = [];
    for (let x = 0; x < width; x++) {
      grid[y][x] = { possibilities: ['grass', 'tree'] };
    }
  }
  
  const rules = {
    'grass': ['grass', 'tree'],
    'tree': ['grass'] // trees only next to grass
  };

  // Get orthogonal neighbors.
  function getNeighbors(x, y) {
    const neighbors = [];
    if (y > 0) neighbors.push({ x: x, y: y - 1 });
    if (y < height - 1) neighbors.push({ x: x, y: y + 1 });
    if (x > 0) neighbors.push({ x: x - 1, y: y });
    if (x < width - 1) neighbors.push({ x: x + 1, y: y });
    return neighbors;
  }

  // Propagate constraints from a collapsed cell.
  function propagate(x, y) {
    const stack = [{ x, y }];
    while (stack.length) {
      const { x, y } = stack.pop();
      const cell = grid[y][x];
      if (cell.possibilities.length !== 1) continue;
      const tile = cell.possibilities[0];
      const neighbors = getNeighbors(x, y);
      for (const n of neighbors) {
        const neighborCell = grid[n.y][n.x];
        const oldCount = neighborCell.possibilities.length;
        neighborCell.possibilities = neighborCell.possibilities.filter(p => rules[tile].includes(p));
        if (neighborCell.possibilities.length === 0) {
          // Fallback to 'grass' if a contradiction occurs.
          neighborCell.possibilities = ['grass'];
        }
        if (neighborCell.possibilities.length < oldCount) {
          stack.push({ x: n.x, y: n.y });
        }
      }
    }
  }

  // Collapse cells until all are determined.
  function collapse() {
    while (true) {
      let minEntropy = Infinity;
      let minX = -1, minY = -1;
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const cell = grid[y][x];
          if (cell.possibilities.length > 1 && cell.possibilities.length < minEntropy) {
            minEntropy = cell.possibilities.length;
            minX = x;
            minY = y;
          }
        }
      }
      if (minEntropy === Infinity) break; // all cells collapsed
      const cell = grid[minY][minX];
      const choice = cell.possibilities[Math.floor(Math.random() * cell.possibilities.length)];
      cell.possibilities = [choice];
      propagate(minX, minY);
    }
  }

  collapse();
  return grid;
}

/*
  drawForestBiome renders the generated grid onto the given canvas.
  It draws each 100x100 cell by choosing the appropriate image.
*/
function drawForestBiome(canvas, grid, grassImg, treeImg) {
  const ctx = canvas.getContext('2d');
  const cellSize = 100;
  const rows = grid.length;
  const cols = grid[0].length;
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const tile = grid[y][x].possibilities[0];
      const img = tile === 'grass' ? grassImg : treeImg;
      ctx.drawImage(img, x * cellSize, y * cellSize, cellSize, cellSize);
    }
  }
}
