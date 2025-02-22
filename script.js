/*************************************
 * Zoom & Pan Code (existing functionality)
 *************************************/
let scale = 1;
let translateX = 0;
let translateY = 0;
const container = document.getElementById('container');
const maxScale = 2; // Maximum zoom-in scale factor
const movementSpeed = 20; // Updated movement speed (pixels per frame)

function updateTransform() {
  container.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
}

document.addEventListener('wheel', (e) => {
  e.preventDefault();
  if (e.deltaY < 0) {
    // Zoom in, capped at maxScale
    scale = Math.min(scale / 0.95, maxScale);
  } else {
    // Zoom out infinitely
    scale *= 0.95;
  }
  updateTransform();
});

// Track keys for continuous WASD movement
const keysPressed = {};

document.addEventListener('keydown', (e) => {
  keysPressed[e.key.toLowerCase()] = true;
});

document.addEventListener('keyup', (e) => {
  keysPressed[e.key.toLowerCase()] = false;
});

// Continuous movement loop
function move() {
  if (keysPressed['w']) {
    translateY += movementSpeed;
  }
  if (keysPressed['s']) {
    translateY -= movementSpeed;
  }
  if (keysPressed['a']) {
    translateX += movementSpeed;
  }
  if (keysPressed['d']) {
    translateX -= movementSpeed;
  }
  updateTransform();
  requestAnimationFrame(move);
}

requestAnimationFrame(move);

/*************************************
 * Procedural Generation: Wavefunction Collapse (Simplified)
 *************************************/

// Define our biome options and simple adjacency rules.
const biomes = [
  "Forest", "Desert", "Tundra", "Plains",
  "Swamp", "Mountain", "Jungle", "Savanna", "Ice"
];

const rules = {
  "Forest":  ["Forest", "Plains", "Swamp", "Mountain", "Jungle", "Savanna"],
  "Desert":  ["Desert", "Savanna", "Plains", "Mountain"],
  "Tundra":  ["Tundra", "Ice", "Mountain", "Plains"],
  "Plains":  ["Forest", "Plains", "Desert", "Swamp", "Savanna", "Tundra"],
  "Swamp":   ["Forest", "Swamp", "Plains"],
  "Mountain":["Forest", "Mountain", "Tundra", "Desert", "Plains"],
  "Jungle":  ["Forest", "Jungle", "Swamp", "Plains"],
  "Savanna": ["Desert", "Plains", "Forest", "Savanna"],
  "Ice":     ["Tundra", "Ice"]
};

function generateBiomeGrid() {
  const gridWidth = 9;
  const gridHeight = 9;
  // Create a 2D grid where each cell starts with all biome possibilities.
  const grid = [];
  for (let y = 0; y < gridHeight; y++) {
    grid[y] = [];
    for (let x = 0; x < gridWidth; x++) {
      grid[y][x] = { possibilities: biomes.slice() };
    }
  }
  
  // Helper: Get the four orthogonal neighbors.
  function getNeighbors(x, y) {
    const neighbors = [];
    if (y > 0) neighbors.push({x: x, y: y - 1});
    if (y < gridHeight - 1) neighbors.push({x: x, y: y + 1});
    if (x > 0) neighbors.push({x: x - 1, y: y});
    if (x < gridWidth - 1) neighbors.push({x: x + 1, y: y});
    return neighbors;
  }
  
  // Propagate constraints from a collapsed cell to its neighbors.
  function propagate(startX, startY) {
    let stack = [{x: startX, y: startY}];
    while (stack.length > 0) {
      let {x, y} = stack.pop();
      let cell = grid[y][x];
      if (cell.possibilities.length !== 1) continue;
      let currentBiome = cell.possibilities[0];
      let neighbors = getNeighbors(x, y);
      for (let n of neighbors) {
        let neighborCell = grid[n.y][n.x];
        let oldLength = neighborCell.possibilities.length;
        // Filter neighbor possibilities based on allowed biomes adjacent to currentBiome.
        neighborCell.possibilities = neighborCell.possibilities.filter(b => rules[currentBiome].includes(b));
        if (neighborCell.possibilities.length === 0) {
          // If a contradiction occurs, simply set it to currentBiome (a simple fallback).
          neighborCell.possibilities = [currentBiome];
        }
        if (neighborCell.possibilities.length < oldLength) {
          stack.push({x: n.x, y: n.y});
        }
      }
    }
  }
  
  // Collapse the grid cells one by one.
  function collapseGrid() {
    while (true) {
      let minEntropy = Infinity;
      let minX = -1, minY = -1;
      for (let y = 0; y < gridHeight; y++) {
        for (let x = 0; x < gridWidth; x++) {
          let cell = grid[y][x];
          if (cell.possibilities.length > 1 && cell.possibilities.length < minEntropy) {
            minEntropy = cell.possibilities.length;
            minX = x;
            minY = y;
          }
        }
      }
      if (minEntropy === Infinity) break; // All cells are collapsed.
      let cell = grid[minY][minX];
      let chosen = cell.possibilities[Math.floor(Math.random() * cell.possibilities.length)];
      cell.possibilities = [chosen];
      propagate(minX, minY);
    }
  }
  
  collapseGrid();
  
  // Render the grid into the DOM.
  const gridContainer = document.getElementById('grid');
  gridContainer.innerHTML = ""; // Clear any previous grid.
  for (let y = 0; y < gridHeight; y++) {
    for (let x = 0; x < gridWidth; x++) {
      const tile = document.createElement('div');
      tile.className = 'tile';
      tile.textContent = grid[y][x].possibilities[0];
      gridContainer.appendChild(tile);
    }
  }
}

// Generate the biome grid when the page loads.
generateBiomeGrid();
