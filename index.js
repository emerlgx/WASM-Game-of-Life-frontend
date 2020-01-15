import { Universe, Cell } from "wasm-game-of-life";
import { memory } from "wasm-game-of-life/wasm_game_of_life_bg";

const CELL_SIZE = 12; // px
const GRID_COLOR = "#CCCCCC";
const DEAD_COLOR = "#FFFFFF";
const ALIVE_COLOR = "#000000";

const pre = document.getElementById("game-of-life-canvas");
const boardWidth = document.getElementById('board-width');
const boardHeight = document.getElementById('board-height');

const universe = Universe.new(boardWidth.value, boardHeight.value);
let width = universe.width();
let height = universe.height();

const canvas = document.getElementById("game-of-life-canvas");

const ctx = canvas.getContext('2d');

const getIndex = (row, column) => {
    return row * width + column;
};

const bitIsSet = (n, arr) => {
    const byte = Math.floor(n / 8);
    const mask = 1 << (n % 8);
    return (arr[byte] & mask) === mask;
};

// Animation Functions
const drawGrid = () => {
    ctx.beginPath();
    ctx.strokeStyle = GRID_COLOR;
  
    // Vertical lines.
    for (let i = 0; i <= width; i++) {
      ctx.moveTo(i * (CELL_SIZE + 1) + 1, 0);
      ctx.lineTo(i * (CELL_SIZE + 1) + 1, (CELL_SIZE + 1) * height + 1);
    }
  
    // Horizontal lines.
    for (let j = 0; j <= height; j++) {
      ctx.moveTo(0,                           j * (CELL_SIZE + 1) + 1);
      ctx.lineTo((CELL_SIZE + 1) * width + 1, j * (CELL_SIZE + 1) + 1);
    }
  
    ctx.stroke();
};

const drawCells = () => {
    const cellsPtr = universe.cells();
  
    const cells = new Uint8Array(memory.buffer, cellsPtr, width * height / 8);
  
    ctx.beginPath();
    
    // Alive cells.
    ctx.fillStyle = ALIVE_COLOR;
    for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
            const idx = getIndex(row, col);
            if (!bitIsSet(idx, cells)) {
                continue;
            }

            ctx.fillRect(
            col * (CELL_SIZE + 1) + 1,
            row * (CELL_SIZE + 1) + 1,
            CELL_SIZE,
            CELL_SIZE
            );
        }
    }

    // Dead cells.
    ctx.fillStyle = DEAD_COLOR;
    for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
            const idx = getIndex(row, col);
            if (bitIsSet(idx, cells)) {
                continue;
            }

            ctx.fillRect(
            col * (CELL_SIZE + 1) + 1,
            row * (CELL_SIZE + 1) + 1,
            CELL_SIZE,
            CELL_SIZE
            );
        }
    }

    ctx.stroke();
};

const draw = () => {
    drawGrid();
    drawCells();
}

const resizeCanvas = (_width, _height) => {
    // Give the canvas room for all of our cells and a 1px border
    // around each of them.
    canvas.height = (CELL_SIZE + 1) * _height + 1;
    canvas.width = (CELL_SIZE + 1) * _width + 1;
    draw();
}
// Set the canvas size, and draw the grid
resizeCanvas(width, height);

// Animation Settings
let isPaused = true;

// Max # of updates per second
const fpsControl = document.getElementById('fps-control');
let max_fps = fpsControl.value;

// Main rendering Loop
const renderLoop = () => {
    if(isPaused) {
        // Animation is paused - don't render a new frame
        return;
    }
    setTimeout(() => {
        requestAnimationFrame(renderLoop);
        universe.tick();
        draw();
    }, 1000/max_fps);
};

// Interactive Elements

// Play/Pause Controls
const playPauseButton = document.getElementById("play-pause");

const play = () => {
    isPaused = false;
    playPauseButton.textContent = "Pause";
    renderLoop();
};

const pause = () => {
    isPaused = true;
    playPauseButton.textContent = "Play";
};

playPauseButton.addEventListener("click", event => {
    if(isPaused) {
        play();
    } else {
        pause();
    }
});

// Clear Board Button
const clearButton = document.getElementById("clear");
clearButton.addEventListener("click", event => {
    universe.clear();
    draw();
});

// FPS Control
fpsControl.addEventListener('change', (event) => {
    max_fps = event.target.value;
});

// Board-size control
boardWidth.addEventListener('change', (event) => {
    pause();
    width = event.target.value;
    universe.set_width(width);
    resizeCanvas(width, height);
});
boardHeight.addEventListener('change', (event) => {
    pause();
    height = event.target.value;
    universe.set_height(height);
    resizeCanvas(width, height);
});

// Clickable cells
    canvas.addEventListener("click", event => {
    const boundingRect = canvas.getBoundingClientRect();

    const scaleX = canvas.width / boundingRect.width;
    const scaleY = canvas.height / boundingRect.height;

    const canvasLeft = (event.clientX - boundingRect.left) * scaleX;
    const canvasTop = (event.clientY - boundingRect.top) * scaleY;

    const row = Math.min(Math.floor(canvasTop / (CELL_SIZE + 1)), height - 1);
    const col = Math.min(Math.floor(canvasLeft / (CELL_SIZE + 1)), width - 1);

    universe.toggle_cell(row, col);

    draw();
});