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
  // Center container and then apply pan and zoom
  container.style.transform =
    `translate(-50%, -50%) translate(${translateX}px, ${translateY}px) scale(${scale})`;
  // After applying the transform, perform viewport culling
  cullBiomes();
}

document.addEventListener('wheel', (e) => {
  e.preventDefault();
  if (e.deltaY < 0) {
    scale = Math.min(scale / 0.95, maxScale);
  } else {
    scale *= 0.95;
  }
  updateTransform();
});

// Continuous WASD movement.
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
 * Viewport Culling
 *************************************/
/*
  cullBiomes() iterates through each biome canvas (child of #container)
  and checks if its bounding rectangle (in viewport coordinates) overlaps
  the visible window. If a canvas is completely outside the viewport,
  we set its display to "none"; otherwise, we ensure it’s visible.
*/
function cullBiomes() {
  const buffer = 200; // pixels of extra space around the viewport
  const canvases = container.children;
  for (let i = 0; i < canvases.length; i++) {
    const canvas = canvases[i];
    const rect = canvas.getBoundingClientRect();
    if (
      rect.right < -buffer ||
      rect.left > window.innerWidth + buffer ||
      rect.bottom < -buffer ||
      rect.top > window.innerHeight + buffer
    ) {
      canvas.style.display = 'none';
    } else {
      canvas.style.display = 'block';
    }
  }
}


/*************************************
 * Procedural Generation for Forest Biomes (Optimized)
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
  generateForestBiomes(grassImg, treeImg);
}).catch(err => {
  console.error("Error loading images:", err);
});

/*
  generateForestBiomes creates a 5x5 grid (25 biomes) of canvases,
  each 10,000×10,000 pixels in size. Inside each canvas, a wavefunction
  collapse algorithm fills a grid with either a grass or tree sprite.
  
  **Optimization:** We now use a 50x50 grid instead of 100x100.
  Since 50 cells × 200 pixels = 10,000 pixels, each cell is drawn as 200x200.
*/
function generateForestBiomes(grassImg, treeImg) {
  const biomeCols = 5;
  const biomeRows = 5;
  const biomeSize = 10000; // in pixels
  const gridCells = 50;     // reduced grid resolution (50 cells per side)
  const cellSize = biomeSize / gridCells; // 200 pixels per cell

  // Create a canvas for each biome.
  for (let row = 0; row < biomeRows; row++) {
    for (let col = 0; col < biomeCols; col++) {
      const canvas = document.createElement('canvas');
      canvas.width = biomeSize;
      canvas.height = biomeSize;
      container.appendChild(canvas);

      const grid = generateForestGrid(gridCells, gridCells);
      drawForestBiome(canvas, grid, grassImg, treeImg, cellSize);
    }
  }
}

/*
  generateForestGrid creates a grid with the given width and height (in cells).
  Each cell initially has two possibilities: 'grass' or 'tree'.
  The propagation rules allow both types, but the weighted collapse step
  biases selection so that similar neighbors are more likely and trees are overall more common.
*/
function generateForestGrid(width, height) {
  const grid = [];
  for (let y = 0; y < height; y++) {
    grid[y] = [];
    for (let x = 0; x < width; x++) {
      grid[y][x] = { possibilities: ['grass', 'tree'] };
    }
  }
  
  // Allowed transitions (both types allowed, but weights will bias the selection).
  const rules = {
    'grass': ['grass', 'tree'],
    'tree': ['tree', 'grass']
  };

  // Helper: Get orthogonal neighbors.
  function getNeighbors(x, y) {
    const neighbors = [];
    if (y > 0) neighbors.push({ x, y: y - 1 });
    if (y < height - 1) neighbors.push({ x, y: y + 1 });
    if (x > 0) neighbors.push({ x: x - 1, y });
    if (x < width - 1) neighbors.push({ x: x + 1, y });
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
          neighborCell.possibilities = ['grass'];
        }
        if (neighborCell.possibilities.length < oldCount) {
          stack.push({ x: n.x, y: n.y });
        }
      }
    }
  }

  /*
    collapse() picks the cell with the lowest entropy (fewest possibilities)
    and collapses it using weighted random selection.
    Base weights: grass 0.3, tree 0.7.
    Plus a bonus (0.5) for each collapsed neighbor matching the possibility.
  */
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
      if (minEntropy === Infinity) break; // All cells collapsed.
      const cell = grid[minY][minX];
      
      // Base weights.
      const baseWeights = { grass: 0.3, tree: 0.7 };
      const bonus = 0.5;
      let weights = {};
      // Initialize weights for possibilities.
      for (let poss of cell.possibilities) {
        weights[poss] = baseWeights[poss];
      }
      
      // Add bonus for matching neighbors.
      const neighbors = getNeighbors(minX, minY);
      for (let n of neighbors) {
        const neighborCell = grid[n.y][n.x];
        if (neighborCell.possibilities.length === 1) {
          const neighborType = neighborCell.possibilities[0];
          if (weights.hasOwnProperty(neighborType)) {
            weights[neighborType] += bonus;
          }
        }
      }
      
      // Weighted random selection.
      let totalWeight = 0;
      for (let key in weights) {
        totalWeight += weights[key];
      }
      let r = Math.random() * totalWeight;
      let chosen = null;
      for (let key in weights) {
        r -= weights[key];
        if (r <= 0) {
          chosen = key;
          break;
        }
      }
      
      cell.possibilities = [chosen];
      propagate(minX, minY);
    }
  }
  
  collapse();
  return grid;
}

/*
  drawForestBiome renders the grid onto the given canvas.
  Each cell (of size cellSize x cellSize) is drawn with the corresponding sprite.
*/
function drawForestBiome(canvas, grid, grassImg, treeImg, cellSize) {
  const ctx = canvas.getContext('2d');
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
