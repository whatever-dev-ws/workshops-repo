// ==========================================
// WUP 25/26 TOMASELLI LUCA
// ==========================================

let canvas;
let layers = [];
let activeLayerIndex = 0;
let currentTool = 'brush';
let lastPoint = null;
let lineStart = null;
let shapeStart = null; // For rectangle/circle tools

let settings = {
    color: '#10b981',
    size: 12,
    opacity: 255,
    smoothing: 0.3,
    symmetry: false,
    shape: 'round'
};

// Layer drag state
let draggedLayerIndex = null;
let dragOverIndex = null;

// UI refs
let layersList, addLayerBtn;
let sizeSlider, sizeValue, opacitySlider, opacityValue, smoothingSlider, smoothingValue;
let symmetryCheck, shapeSelect, colorPicker, toolButtons, clearBtn, undoBtn;
let importBtn, exportMenu;

// Undo system
let undoStack = [];
const MAX_UNDO = 15;

// ==========================================
// CSS STYLES
// ==========================================

const CSS = `
:root {
    --bg-dark: #0a0a0a;
    --bg-panel: #111;
    --accent: #10b981;
    --accent-glow: rgba(16, 185, 129, 0.3);
    --text-main: #f0f0f0;
    --text-muted: #666;
    --border: #1a1a1a;
}

* { margin: 0; padding: 0; box-sizing: border-box; user-select: none; }

body {
    font-family: 'Segoe UI', system-ui, sans-serif;
    background: var(--bg-dark);
    color: var(--text-main);
    height: 100vh;
    overflow: hidden;
}

.app-container { display: flex; flex-direction: column; height: 100vh; }

/* TOP BAR */
.top-bar {
    height: 56px;
    background: var(--bg-panel);
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    padding: 0 15px;
    gap: 15px;
}

.brand { 
    font-weight: 700; 
    font-size: 14px; 
    display: flex;
    align-items: center;
    gap: 8px;
}
.brand .hl { color: var(--accent); }

.divider { width: 1px; height: 24px; background: var(--border); }

.prop-group { 
    display: flex; 
    align-items: center; 
    gap: 8px; 
    font-size: 11px;
    color: var(--text-muted);
}
.prop-group label {
    text-transform: uppercase;
    font-weight: 600;
    font-size: 10px;
    letter-spacing: 0.5px;
}
.prop-val { 
    font-family: monospace; 
    color: var(--accent); 
    min-width: 35px;
    text-align: right;
}

.spacer { flex: 1; }

/* WORKSPACE */
.workspace { display: flex; flex: 1; overflow: hidden; }

/* LEFT TOOLBAR */
.left-toolbar {
    width: 52px;
    background: var(--bg-panel);
    border-right: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    padding: 12px 0;
    gap: 4px;
    align-items: center;
    overflow-y: auto;
}

.tool-btn {
    width: 38px; height: 38px;
    background: transparent;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    font-size: 14px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
    flex-shrink: 0;
}
.tool-btn:hover { 
    color: var(--text-main); 
    background: rgba(255,255,255,0.05); 
}
.tool-btn.active { 
    color: var(--accent); 
    background: rgba(16, 185, 129, 0.15); 
}

.tool-divider {
    width: 28px;
    height: 1px;
    background: var(--border);
    margin: 6px 0;
    flex-shrink: 0;
}

/* ACTION BUTTONS */
.action-btn {
    width: 32px; height: 32px;
    background: transparent;
    border: 1px solid var(--border);
    color: var(--text-muted);
    cursor: pointer;
    font-size: 12px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
}
.action-btn:hover { 
    color: var(--text-main); 
    border-color: var(--accent);
}
.action-btn.danger:hover {
    border-color: #ef4444;
    color: #ef4444;
}

/* SYMMETRY TOGGLE */
.toggle-btn {
    width: 32px; height: 32px;
    background: transparent;
    border: 1px solid var(--border);
    color: var(--text-muted);
    cursor: pointer;
    font-size: 12px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
}
.toggle-btn.active {
    background: var(--accent);
    border-color: var(--accent);
    color: white;
}

/* EXPORT DROPDOWN */
.export-wrapper { position: relative; }
.export-menu {
    display: none;
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: 8px;
    background: #1a1a1a;
    border: 1px solid var(--border);
    border-radius: 8px;
    min-width: 160px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    z-index: 100;
    overflow: hidden;
}
.export-menu.open { display: block; }
.export-item {
    padding: 10px 14px;
    font-size: 12px;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: all 0.15s;
}
.export-item:hover { background: var(--accent); color: white; }
.export-item span { opacity: 0.6; font-size: 10px; }

/* RIGHT PANEL - LAYERS */
.right-panel {
    width: 200px;
    background: var(--bg-panel);
    border-left: 1px solid var(--border);
    display: flex;
    flex-direction: column;
}

.panel-header {
    padding: 12px 14px;
    font-size: 11px;
    font-weight: 700;
    color: var(--text-main);
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--border);
    background: rgba(255,255,255,0.02);
}
.layer-actions { display: flex; gap: 2px; }
.layer-actions button {
    background: rgba(255,255,255,0.05);
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    font-size: 11px;
    padding: 6px 8px;
    border-radius: 4px;
    transition: all 0.15s;
}
.layer-actions button:hover { 
    color: var(--accent); 
    background: rgba(16, 185, 129, 0.15); 
}

.layers-list { 
    padding: 8px; 
    flex: 1; 
    overflow-y: auto; 
}

.layer-item {
    padding: 8px 10px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    cursor: grab;
    margin-bottom: 4px;
    background: rgba(255,255,255,0.03);
    border: 1px solid transparent;
    transition: all 0.15s;
}
.layer-item:hover { 
    background: rgba(255,255,255,0.06); 
}
.layer-item.active { 
    background: rgba(16, 185, 129, 0.12); 
    border-color: var(--accent); 
}
.layer-item.dragging {
    opacity: 0.5;
    transform: scale(0.95);
}
.layer-item.drag-over {
    border-color: var(--accent);
    border-style: dashed;
}

.layer-drag-handle {
    color: var(--text-muted);
    font-size: 10px;
    cursor: grab;
    opacity: 0.4;
    padding: 2px;
}
.layer-item:hover .layer-drag-handle { opacity: 0.8; }

.layer-item .layer-name { 
    flex: 1; 
    overflow: hidden; 
    text-overflow: ellipsis; 
    white-space: nowrap;
    font-size: 11px;
}
.layer-item .layer-icon {
    opacity: 0.5;
    font-size: 11px;
    cursor: pointer;
    padding: 2px;
    border-radius: 3px;
    transition: all 0.15s;
}
.layer-item .layer-icon:hover { 
    opacity: 1; 
    color: var(--accent);
    background: rgba(255,255,255,0.1);
}

.layer-thumb {
    width: 28px;
    height: 20px;
    background: #222;
    border-radius: 3px;
    border: 1px solid var(--border);
    overflow: hidden;
}
.layer-thumb canvas {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

/* CANVAS */
#canvas-container {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    background: #080808;
    background-image: 
        linear-gradient(45deg, #151515 25%, transparent 25%),
        linear-gradient(-45deg, #151515 25%, transparent 25%),
        linear-gradient(45deg, transparent 75%, #151515 75%),
        linear-gradient(-45deg, transparent 75%, #151515 75%);
    background-size: 20px 20px;
    background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
    padding: 20px;
    overflow: hidden;
}

canvas { 
    border-radius: 4px; 
    box-shadow: 0 10px 40px rgba(0,0,0,0.5);
}

/* INPUTS */
input[type="range"] {
    -webkit-appearance: none;
    height: 4px;
    background: #222;
    border-radius: 2px;
    width: 70px;
    cursor: pointer;
}
input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 12px;
    height: 12px;
    background: var(--text-main);
    border-radius: 50%;
    cursor: pointer;
}
input[type="range"]:hover::-webkit-slider-thumb {
    background: var(--accent);
}

select {
    background: #1a1a1a;
    color: var(--text-main);
    border: 1px solid var(--border);
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 11px;
    cursor: pointer;
    outline: none;
}

.color-picker-wrap {
    width: 32px;
    height: 32px;
    border-radius: 6px;
    overflow: hidden;
    border: 2px solid var(--border);
    position: relative;
}
input[type="color"] {
    position: absolute;
    width: 150%;
    height: 150%;
    top: -25%;
    left: -25%;
    border: none;
    cursor: pointer;
}

#importInput { display: none; }
`;

// ==========================================
// HTML STRUCTURE
// ==========================================

const HTML = `
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
<div class="app-container">
    <header class="top-bar">
        <div class="brand">
            <i class="fa-solid fa-paintbrush"></i> Brush<span class="hl">Tool</span>
        </div>
        
        <div class="divider"></div>

        <div class="prop-group">
            <label>Size</label>
            <input type="range" id="sizeSlider" min="1" max="100" value="12">
            <span class="prop-val" id="sizeValue">12</span>
        </div>

        <div class="prop-group">
            <label>Opacity</label>
            <input type="range" id="opacitySlider" min="10" max="255" value="255">
            <span class="prop-val" id="opacityValue">100%</span>
        </div>

        <div class="prop-group">
            <label>Smooth</label>
            <input type="range" id="smoothingSlider" min="0" max="80" value="30">
            <span class="prop-val" id="smoothingValue">30%</span>
        </div>

        <div class="prop-group">
            <select id="shapeSelect">
                <option value="round">● Round</option>
                <option value="square">■ Square</option>
            </select>
        </div>

        <div class="prop-group">
            <button id="symmetryBtn" class="toggle-btn" title="Mirror Mode">
                <i class="fa-solid fa-arrows-left-right"></i>
            </button>
        </div>

        <div class="prop-group">
            <div class="color-picker-wrap">
                <input type="color" id="colorPicker" value="#10b981">
            </div>
        </div>

        <div class="spacer"></div>

        <div class="prop-group" style="gap: 6px;">
            <button id="importBtn" class="action-btn" title="Import Image">
                <i class="fa-solid fa-image"></i>
            </button>
            <button id="undoBtn" class="action-btn" title="Undo (Ctrl+Z)">
                <i class="fa-solid fa-rotate-left"></i>
            </button>
            <button id="clearBtn" class="action-btn danger" title="Clear Layer">
                <i class="fa-solid fa-trash"></i>
            </button>
            <div class="export-wrapper">
                <button id="exportBtn" class="action-btn" title="Export" style="background: var(--accent); border-color: var(--accent); color: white;">
                    <i class="fa-solid fa-download"></i>
                </button>
                <div id="exportMenu" class="export-menu">
                    <div class="export-item" data-format="png">PNG <span>Transparent</span></div>
                    <div class="export-item" data-format="png-white">PNG <span>White BG</span></div>
                    <div class="export-item" data-format="jpg">JPG <span>Compressed</span></div>
                    <div class="export-item" data-format="webp">WebP <span>Modern</span></div>
                    <div class="export-item" data-format="svg">SVG <span>Vector</span></div>
                </div>
            </div>
        </div>
    </header>

    <div class="workspace">
        <aside class="left-toolbar">
            <button class="tool-btn active" data-tool="brush" title="Brush (B)">
                <i class="fa-solid fa-paintbrush"></i>
            </button>
            <button class="tool-btn" data-tool="pencil" title="Pencil (P)">
                <i class="fa-solid fa-pencil"></i>
            </button>
            <button class="tool-btn" data-tool="eraser" title="Eraser (E)">
                <i class="fa-solid fa-eraser"></i>
            </button>
            <button class="tool-btn" data-tool="spray" title="Spray (S)">
                <i class="fa-solid fa-spray-can"></i>
            </button>
            
            <div class="tool-divider"></div>
            
            <button class="tool-btn" data-tool="fill" title="Fill (F)">
                <i class="fa-solid fa-fill-drip"></i>
            </button>
            <button class="tool-btn" data-tool="line" title="Line (L)">
                <i class="fa-solid fa-minus"></i>
            </button>
            <button class="tool-btn" data-tool="rectangle" title="Rectangle (R)">
                <i class="fa-regular fa-square"></i>
            </button>
            <button class="tool-btn" data-tool="circle" title="Circle (C)">
                <i class="fa-regular fa-circle"></i>
            </button>
            
            <div class="tool-divider"></div>
            
            <button class="tool-btn" data-tool="blur" title="Blur/Smudge (U)">
                <i class="fa-solid fa-droplet"></i>
            </button>
            <button class="tool-btn" data-tool="eyedropper" title="Eyedropper (I)">
                <i class="fa-solid fa-eye-dropper"></i>
            </button>
        </aside>

        <main id="canvas-container"></main>

        <aside class="right-panel">
            <div class="panel-header">
                <span>Layers</span>
                <div class="layer-actions">
                    <button id="duplicateLayerBtn" title="Duplicate"><i class="fa-solid fa-copy"></i></button>
                    <button id="mergeLayerBtn" title="Merge Down"><i class="fa-solid fa-layer-group"></i></button>
                    <button id="addLayerBtn" title="New Layer"><i class="fa-solid fa-plus"></i></button>
                </div>
            </div>
            <div id="layers-list" class="layers-list"></div>
        </aside>
    </div>
</div>
<input type="file" id="importInput" accept="image/*">
`;

// ==========================================
// SETUP
// ==========================================

function setup() {
    let style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);

    document.body.innerHTML = HTML;

    const container = document.getElementById('canvas-container');
    layersList = document.getElementById('layers-list');
    addLayerBtn = document.getElementById('addLayerBtn');
    sizeSlider = document.getElementById('sizeSlider');
    sizeValue = document.getElementById('sizeValue');
    opacitySlider = document.getElementById('opacitySlider');
    opacityValue = document.getElementById('opacityValue');
    smoothingSlider = document.getElementById('smoothingSlider');
    smoothingValue = document.getElementById('smoothingValue');
    symmetryCheck = document.getElementById('symmetryBtn');
    shapeSelect = document.getElementById('shapeSelect');
    colorPicker = document.getElementById('colorPicker');
    toolButtons = document.querySelectorAll('.tool-btn');
    clearBtn = document.getElementById('clearBtn');
    undoBtn = document.getElementById('undoBtn');
    importBtn = document.getElementById('importBtn');
    exportMenu = document.getElementById('exportMenu');

    let w = container.offsetWidth - 40;
    let h = container.offsetHeight - 40;
    if (w < 100) w = 800;
    if (h < 100) h = 600;

    canvas = createCanvas(w, h);
    canvas.parent('canvas-container');
    pixelDensity(1);

    addLayer();
    setupEvents();
    updateLayerUI();
}

// ==========================================
// DRAW LOOP
// ==========================================

function draw() {
    clear();

    for (let i = 0; i < layers.length; i++) {
        if (layers[i].visible) {
            image(layers[i].buffer, 0, 0);
        }
    }

    // Shape previews
    if (mouseIsPressed && shapeStart) {
        let c = color(settings.color);
        c.setAlpha(settings.opacity);
        stroke(c);
        noFill();
        strokeWeight(settings.size);

        if (currentTool === 'line') {
            line(shapeStart.x, shapeStart.y, mouseX, mouseY);
        } else if (currentTool === 'rectangle') {
            rectMode(CORNERS);
            rect(shapeStart.x, shapeStart.y, mouseX, mouseY);
        } else if (currentTool === 'circle') {
            let cx = (shapeStart.x + mouseX) / 2;
            let cy = (shapeStart.y + mouseY) / 2;
            let w = abs(mouseX - shapeStart.x);
            let h = abs(mouseY - shapeStart.y);
            ellipse(cx, cy, w, h);
        }
    }

    // Drawing tools
    if (mouseIsPressed && layers[activeLayerIndex] && layers[activeLayerIndex].visible) {
        if (mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) {
            if (!['line', 'rectangle', 'circle', 'fill', 'eyedropper'].includes(currentTool)) {
                let activeBuffer = layers[activeLayerIndex].buffer;

                let smoothing = settings.smoothing;
                let targetX = mouseX;
                let targetY = mouseY;

                if (lastPoint && smoothing > 0) {
                    targetX = lerp(lastPoint.x, mouseX, 1 - smoothing);
                    targetY = lerp(lastPoint.y, mouseY, 1 - smoothing);
                }

                let prevX = lastPoint ? lastPoint.x : targetX;
                let prevY = lastPoint ? lastPoint.y : targetY;

                applyTool(activeBuffer, targetX, targetY, prevX, prevY);

                if (settings.symmetry) {
                    applyTool(activeBuffer, width - targetX, targetY, width - prevX, prevY);
                }

                lastPoint = { x: targetX, y: targetY };
            }
        }
    }

    // Cursor previews
    if (!mouseIsPressed) {
        noFill();
        strokeWeight(1);
        if (currentTool === 'eraser') {
            stroke(255);
            ellipse(mouseX, mouseY, settings.size, settings.size);
        } else if (currentTool === 'blur') {
            stroke(100, 150, 255);
            ellipse(mouseX, mouseY, settings.size, settings.size);
        }
    }
}

// ==========================================
// TOOL LOGIC
// ==========================================

function applyTool(target, x, y, px, py) {
    if (currentTool === 'eraser') {
        target.erase(255, 255);
        target.noStroke();

        let d = dist(px, py, x, y);
        let steps = max(1, floor(d));
        for (let i = 0; i <= steps; i++) {
            let t = steps === 0 ? 0 : i / steps;
            let ix = lerp(px, x, t);
            let iy = lerp(py, y, t);
            if (settings.shape === 'square') {
                target.rectMode(CENTER);
                target.rect(ix, iy, settings.size, settings.size);
            } else {
                target.ellipse(ix, iy, settings.size, settings.size);
            }
        }
        target.noErase();
        return;
    }

    if (currentTool === 'blur') {
        // Smudge effect - blend colors
        let radius = settings.size / 2;
        target.loadPixels();

        let samples = [];
        for (let ox = -radius; ox < radius; ox += 2) {
            for (let oy = -radius; oy < radius; oy += 2) {
                if (ox * ox + oy * oy < radius * radius) {
                    let sx = floor(px + ox);
                    let sy = floor(py + oy);
                    if (sx >= 0 && sx < width && sy >= 0 && sy < height) {
                        let idx = (sy * width + sx) * 4;
                        samples.push([target.pixels[idx], target.pixels[idx + 1], target.pixels[idx + 2], target.pixels[idx + 3]]);
                    }
                }
            }
        }

        if (samples.length > 0) {
            let avgR = samples.reduce((a, c) => a + c[0], 0) / samples.length;
            let avgG = samples.reduce((a, c) => a + c[1], 0) / samples.length;
            let avgB = samples.reduce((a, c) => a + c[2], 0) / samples.length;
            let avgA = samples.reduce((a, c) => a + c[3], 0) / samples.length;

            target.noStroke();
            target.fill(avgR, avgG, avgB, avgA * 0.5);
            target.ellipse(x, y, settings.size * 0.8, settings.size * 0.8);
        }
        return;
    }

    let c = color(settings.color);
    c.setAlpha(settings.opacity);
    target.stroke(c);
    target.fill(c);

    if (currentTool === 'brush') {
        target.strokeWeight(settings.size);
        target.strokeCap(settings.shape === 'square' ? PROJECT : ROUND);
        target.line(px, py, x, y);
    }
    else if (currentTool === 'pencil') {
        target.strokeWeight(1);
        target.stroke(c);

        let d = dist(px, py, x, y);
        let steps = max(1, floor(d));
        for (let i = 0; i <= steps; i++) {
            let t = i / steps;
            let ix = lerp(px, x, t);
            let iy = lerp(py, y, t);
            target.point(ix, iy);
        }
    }
    else if (currentTool === 'spray') {
        target.noStroke();
        let radius = settings.size * 1.5;
        let density = 20;

        for (let i = 0; i < density; i++) {
            let angle = random(TWO_PI);
            let r = random(radius);
            let ox = cos(angle) * r;
            let oy = sin(angle) * r;
            let pz = random(1, 3);
            target.ellipse(x + ox, y + oy, pz, pz);
        }
    }
}

// ==========================================
// LAYER SYSTEM
// ==========================================

function addLayer() {
    let pg = createGraphics(width, height);
    pg.clear();

    layers.push({
        id: Date.now(),
        name: `Layer ${layers.length + 1}`,
        buffer: pg,
        visible: true
    });

    activeLayerIndex = layers.length - 1;
    updateLayerUI();
}

function duplicateLayer() {
    if (!layers[activeLayerIndex]) return;

    let pg = createGraphics(width, height);
    pg.image(layers[activeLayerIndex].buffer, 0, 0);

    layers.splice(activeLayerIndex + 1, 0, {
        id: Date.now(),
        name: layers[activeLayerIndex].name + ' copy',
        buffer: pg,
        visible: true
    });

    activeLayerIndex++;
    updateLayerUI();
}

function mergeDown() {
    if (activeLayerIndex <= 0 || !layers[activeLayerIndex]) return;

    // Merge current layer into the one below
    layers[activeLayerIndex - 1].buffer.image(layers[activeLayerIndex].buffer, 0, 0);
    layers.splice(activeLayerIndex, 1);
    activeLayerIndex--;
    updateLayerUI();
}

function deleteLayer(index) {
    if (layers.length <= 1) return;
    layers.splice(index, 1);

    if (activeLayerIndex >= layers.length) {
        activeLayerIndex = layers.length - 1;
    }
    updateLayerUI();
}

function reorderLayers(fromIndex, toIndex) {
    if (fromIndex === toIndex) return;

    let layer = layers.splice(fromIndex, 1)[0];
    layers.splice(toIndex, 0, layer);

    // Update active index
    if (activeLayerIndex === fromIndex) {
        activeLayerIndex = toIndex;
    } else if (fromIndex < activeLayerIndex && toIndex >= activeLayerIndex) {
        activeLayerIndex--;
    } else if (fromIndex > activeLayerIndex && toIndex <= activeLayerIndex) {
        activeLayerIndex++;
    }

    updateLayerUI();
}

function updateLayerUI() {
    layersList.innerHTML = '';

    for (let i = layers.length - 1; i >= 0; i--) {
        let layer = layers[i];
        let div = document.createElement('div');
        div.className = `layer-item ${i === activeLayerIndex ? 'active' : ''}`;
        div.draggable = true;
        div.dataset.index = i;

        div.innerHTML = `
            <i class="fa-solid fa-grip-vertical layer-drag-handle"></i>
            <i class="fa-solid ${layer.visible ? 'fa-eye' : 'fa-eye-slash'} layer-icon" data-action="toggle" data-idx="${i}"></i>
            <span class="layer-name">${layer.name}</span>
            <i class="fa-solid fa-xmark layer-icon" data-action="delete" data-idx="${i}"></i>
        `;

        // Click to select
        div.addEventListener('click', (e) => {
            if (!e.target.dataset.action) {
                activeLayerIndex = i;
                updateLayerUI();
            }
        });

        // Drag events
        div.addEventListener('dragstart', (e) => {
            draggedLayerIndex = i;
            div.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
        });

        div.addEventListener('dragend', () => {
            div.classList.remove('dragging');
            document.querySelectorAll('.layer-item').forEach(el => el.classList.remove('drag-over'));

            if (draggedLayerIndex !== null && dragOverIndex !== null && draggedLayerIndex !== dragOverIndex) {
                reorderLayers(draggedLayerIndex, dragOverIndex);
            }
            draggedLayerIndex = null;
            dragOverIndex = null;
        });

        div.addEventListener('dragover', (e) => {
            e.preventDefault();
            if (draggedLayerIndex !== null && draggedLayerIndex !== i) {
                div.classList.add('drag-over');
                dragOverIndex = i;
            }
        });

        div.addEventListener('dragleave', () => {
            div.classList.remove('drag-over');
        });

        layersList.appendChild(div);
    }

    // Action button handlers
    document.querySelectorAll('.layer-icon[data-action]').forEach(icon => {
        icon.addEventListener('click', (e) => {
            e.stopPropagation();
            let idx = parseInt(icon.dataset.idx);
            if (icon.dataset.action === 'toggle') {
                layers[idx].visible = !layers[idx].visible;
                updateLayerUI();
            } else if (icon.dataset.action === 'delete') {
                deleteLayer(idx);
            }
        });
    });
}

// ==========================================
// UNDO SYSTEM
// ==========================================

function saveUndoState() {
    if (!layers[activeLayerIndex]) return;

    let snapshot = layers[activeLayerIndex].buffer.get();
    undoStack.push({ layerIndex: activeLayerIndex, image: snapshot });

    if (undoStack.length > MAX_UNDO) {
        undoStack.shift();
    }
}

function undo() {
    if (undoStack.length === 0) return;

    let state = undoStack.pop();
    if (layers[state.layerIndex]) {
        layers[state.layerIndex].buffer.clear();
        layers[state.layerIndex].buffer.image(state.image, 0, 0);
    }
}

// ==========================================
// IMPORT / EXPORT
// ==========================================

function importImage(file) {
    loadImage(URL.createObjectURL(file), img => {
        let pg = createGraphics(width, height);
        pg.clear();

        let scale = min(width / img.width, height / img.height);
        let w = img.width * scale;
        let h = img.height * scale;
        let x = (width - w) / 2;
        let y = (height - h) / 2;

        pg.image(img, x, y, w, h);

        layers.push({
            id: Date.now(),
            name: file.name.substring(0, 12),
            buffer: pg,
            visible: true
        });

        activeLayerIndex = layers.length - 1;
        updateLayerUI();
    });
}

function exportImage(format) {
    let exportPg = createGraphics(width, height);

    if (format === 'png-white' || format === 'jpg') {
        exportPg.background(255);
    } else {
        exportPg.clear();
    }

    for (let i = 0; i < layers.length; i++) {
        if (layers[i].visible) {
            exportPg.image(layers[i].buffer, 0, 0);
        }
    }

    if (format === 'png' || format === 'png-white') {
        save(exportPg, 'BrushTool_Art.png');
    } else if (format === 'jpg') {
        save(exportPg, 'BrushTool_Art.jpg');
    } else if (format === 'webp') {
        save(exportPg, 'BrushTool_Art.png');
    } else if (format === 'svg') {
        save(exportPg, 'BrushTool_Art.png');
    }

    exportMenu.classList.remove('open');
}

// ==========================================
// EVENTS
// ==========================================

function mousePressed() {
    if (mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) {
        saveUndoState();
        lastPoint = { x: mouseX, y: mouseY };

        if (['line', 'rectangle', 'circle'].includes(currentTool)) {
            shapeStart = { x: mouseX, y: mouseY };
        }

        if (currentTool === 'fill' && layers[activeLayerIndex]) {
            let c = color(settings.color);
            c.setAlpha(settings.opacity);
            layers[activeLayerIndex].buffer.background(c);
        }

        if (currentTool === 'eyedropper') {
            let c = get(mouseX, mouseY);
            if (c[3] > 0) {
                let hexStr = '#' + hex(c[0], 2) + hex(c[1], 2) + hex(c[2], 2);
                settings.color = hexStr;
                colorPicker.value = hexStr;
            }
        }
    }
}

function mouseReleased() {
    // Shape tools draw on release
    if (shapeStart && layers[activeLayerIndex]) {
        let activeBuffer = layers[activeLayerIndex].buffer;
        let c = color(settings.color);
        c.setAlpha(settings.opacity);
        activeBuffer.stroke(c);
        activeBuffer.noFill();
        activeBuffer.strokeWeight(settings.size);
        activeBuffer.strokeCap(ROUND);

        if (currentTool === 'line') {
            activeBuffer.line(shapeStart.x, shapeStart.y, mouseX, mouseY);
            if (settings.symmetry) {
                activeBuffer.line(width - shapeStart.x, shapeStart.y, width - mouseX, mouseY);
            }
        } else if (currentTool === 'rectangle') {
            activeBuffer.rectMode(CORNERS);
            activeBuffer.rect(shapeStart.x, shapeStart.y, mouseX, mouseY);
            if (settings.symmetry) {
                activeBuffer.rect(width - shapeStart.x, shapeStart.y, width - mouseX, mouseY);
            }
        } else if (currentTool === 'circle') {
            let cx = (shapeStart.x + mouseX) / 2;
            let cy = (shapeStart.y + mouseY) / 2;
            let w = abs(mouseX - shapeStart.x);
            let h = abs(mouseY - shapeStart.y);
            activeBuffer.ellipse(cx, cy, w, h);
            if (settings.symmetry) {
                activeBuffer.ellipse(width - cx, cy, w, h);
            }
        }
    }

    lastPoint = null;
    shapeStart = null;
}

function keyPressed() {
    if (keyCode === 90 && (keyIsDown(CONTROL) || keyIsDown(91))) {
        undo();
    }

    if (key === 'b' || key === 'B') selectTool('brush');
    if (key === 'p' || key === 'P') selectTool('pencil');
    if (key === 'e' || key === 'E') selectTool('eraser');
    if (key === 's' || key === 'S') selectTool('spray');
    if (key === 'f' || key === 'F') selectTool('fill');
    if (key === 'l' || key === 'L') selectTool('line');
    if (key === 'r' || key === 'R') selectTool('rectangle');
    if (key === 'c' || key === 'C') selectTool('circle');
    if (key === 'u' || key === 'U') selectTool('blur');
    if (key === 'i' || key === 'I') selectTool('eyedropper');
}

function selectTool(tool) {
    currentTool = tool;
    toolButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tool === tool);
    });

    if (tool === 'eraser' || tool === 'blur') {
        canvas.style('cursor', 'none');
    } else {
        canvas.style('cursor', 'crosshair');
    }
}

function setupEvents() {
    addLayerBtn.onclick = addLayer;
    document.getElementById('duplicateLayerBtn').onclick = duplicateLayer;
    document.getElementById('mergeLayerBtn').onclick = mergeDown;

    toolButtons.forEach(btn => {
        btn.onclick = () => selectTool(btn.dataset.tool);
    });

    sizeSlider.oninput = (e) => {
        settings.size = parseInt(e.target.value);
        sizeValue.textContent = settings.size;
    };

    opacitySlider.oninput = (e) => {
        settings.opacity = parseInt(e.target.value);
        opacityValue.textContent = Math.round((settings.opacity / 255) * 100) + '%';
    };

    smoothingSlider.oninput = (e) => {
        settings.smoothing = parseInt(e.target.value) / 100;
        smoothingValue.textContent = e.target.value + '%';
    };

    symmetryCheck.onclick = () => {
        settings.symmetry = !settings.symmetry;
        symmetryCheck.classList.toggle('active', settings.symmetry);
    };

    shapeSelect.onchange = (e) => settings.shape = e.target.value;
    colorPicker.oninput = (e) => settings.color = e.target.value;

    undoBtn.onclick = undo;

    clearBtn.onclick = () => {
        if (layers[activeLayerIndex]) {
            saveUndoState();
            layers[activeLayerIndex].buffer.clear();
        }
    };

    importBtn.onclick = () => document.getElementById('importInput').click();
    document.getElementById('importInput').onchange = (e) => {
        if (e.target.files[0]) {
            importImage(e.target.files[0]);
        }
    };

    document.getElementById('exportBtn').onclick = () => {
        exportMenu.classList.toggle('open');
    };

    document.querySelectorAll('.export-item').forEach(item => {
        item.onclick = () => exportImage(item.dataset.format);
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.export-wrapper')) {
            exportMenu.classList.remove('open');
        }
    });
}
