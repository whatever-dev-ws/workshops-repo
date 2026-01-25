// ==========================================
// WUP 25/26 TOMASELLI LUCA
// ==========================================

let particles = [];
let graphics;
let fontScale = 150;

// UI refs
let textInput, sizeSlider, radiusSlider, speedSlider, frictionSlider;
let shapeSelect, modeSelect, colorPicker, bgColorPicker, resetBtn;
let trailSlider, particleDensitySlider, maxParticlesSlider;
let isRecordingGif = false;

// ==========================================
// CSS STYLES - Green Theme
// ==========================================

const CSS = `
:root {
    --bg-dark: #0a0a0a;
    --sidebar-bg: #111;
    --accent: #10b981;
    --accent-glow: rgba(16, 185, 129, 0.4);
    --text-white: #f0f0f0;
    --text-gray: #777;
    --border: #222;
}

* { margin: 0; padding: 0; box-sizing: border-box; }

body {
    background: var(--bg-dark);
    font-family: 'Segoe UI', system-ui, sans-serif;
    color: var(--text-white);
    overflow: hidden;
    height: 100vh;
}

.app-container {
    display: flex;
    height: 100%;
}

/* SIDEBAR */
.sidebar {
    width: 280px;
    background: var(--sidebar-bg);
    border-right: 1px solid var(--border);
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    overflow-y: auto;
}

.header {
    font-size: 18px;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 8px;
}
.header .hl { color: var(--accent); }

.divider {
    height: 1px;
    background: var(--border);
    margin: 5px 0;
}

/* CONTROLS */
.control-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.label-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

label {
    font-size: 11px;
    color: var(--text-gray);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-weight: 600;
}

.val {
    font-family: monospace;
    font-size: 11px;
    color: var(--accent);
}

input[type="text"], select, textarea {
    background: #1a1a1a;
    border: 1px solid var(--border);
    color: var(--accent);
    padding: 10px 12px;
    font-size: 14px;
    border-radius: 6px;
    outline: none;
    font-family: inherit;
    transition: border-color 0.2s;
}
input[type="text"]:focus, select:focus, textarea:focus {
    border-color: var(--accent);
}
textarea {
    resize: vertical;
    min-height: 60px;
    line-height: 1.4;
}

input[type="range"] {
    -webkit-appearance: none;
    width: 100%;
    height: 6px;
    background: #222;
    border-radius: 3px;
    cursor: pointer;
}
input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 16px;
    height: 16px;
    background: var(--text-white);
    border-radius: 50%;
    cursor: pointer;
    transition: background 0.2s;
}
input[type="range"]:hover::-webkit-slider-thumb {
    background: var(--accent);
}

.color-row {
    display: flex;
    gap: 10px;
}
.color-box {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 5px;
}
.color-wrap {
    width: 100%;
    height: 36px;
    border-radius: 6px;
    overflow: hidden;
    border: 1px solid var(--border);
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

.btn {
    padding: 12px;
    border: none;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    font-size: 13px;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
}
.btn-primary {
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
}
.btn-primary:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 15px var(--accent-glow);
}
.btn-secondary {
    background: #1a1a1a;
    color: var(--text-white);
    border: 1px solid var(--border);
}
.btn-secondary:hover {
    border-color: var(--accent);
    color: var(--accent);
}
.btn-gif {
    background: linear-gradient(135deg, #ef4444, #dc2626);
}

/* CANVAS */
#canvas-container {
    flex-grow: 1;
    background: var(--bg-dark);
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: crosshair;
    position: relative;
}

/* GIF Overlay - Canvas Only */
.gif-overlay {
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.85);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 100;
    pointer-events: none;
}
.gif-countdown {
    font-size: 120px;
    font-weight: 700;
    color: var(--accent);
    text-shadow: 0 0 50px var(--accent-glow);
}
.gif-status {
    font-size: 20px;
    color: white;
    margin-top: 15px;
}
`;

// ==========================================
// HTML STRUCTURE
// ==========================================

const HTML = `
<div class="app-container">
    <aside class="sidebar">
        <div class="header">
            🔤 Typography<span class="hl">Tool</span>
        </div>

        <div class="control-group">
            <label>Your Text (Enter for new line)</label>
            <textarea id="textInput" rows="2">HELLO</textarea>
        </div>

        <div class="divider"></div>

        <div class="control-group">
            <div class="label-row">
                <label>Particle Size</label>
                <span class="val" id="sizeVal">6</span>
            </div>
            <input type="range" id="sizeSlider" min="2" max="20" value="6">
        </div>

        <div class="control-group">
            <div class="label-row">
                <label>Force Radius</label>
                <span class="val" id="radiusVal">100</span>
            </div>
            <input type="range" id="radiusSlider" min="30" max="400" value="100">
        </div>

        <div class="control-group">
            <div class="label-row">
                <label>Return Speed</label>
                <span class="val" id="speedVal">8</span>
            </div>
            <input type="range" id="speedSlider" min="1" max="25" value="8">
        </div>

        <div class="control-group">
            <div class="label-row">
                <label>Friction</label>
                <span class="val" id="frictionVal">0.95</span>
            </div>
            <input type="range" id="frictionSlider" min="80" max="99" value="95">
        </div>

        <div class="control-group">
            <div class="label-row">
                <label>Trail Length</label>
                <span class="val" id="trailVal">40</span>
            </div>
            <input type="range" id="trailSlider" min="5" max="100" value="40">
        </div>

        <div class="control-group">
            <div class="label-row">
                <label>Density</label>
                <span class="val" id="densityVal">6</span>
            </div>
            <input type="range" id="densitySlider" min="3" max="15" value="6">
        </div>

        <div class="divider"></div>

        <div class="control-group">
            <label>Particle Shape</label>
            <select id="shapeSelect">
                <option value="circle">● Circles</option>
                <option value="square">■ Squares</option>
                <option value="line">— Lines</option>
                <option value="triangle">▲ Triangles</option>
            </select>
        </div>

        <div class="control-group">
            <label>Interaction Mode</label>
            <select id="modeSelect">
                <option value="repel">↔ Repel (Push)</option>
                <option value="attract">↻ Attract (Pull)</option>
                <option value="orbit">◎ Orbit</option>
            </select>
        </div>

        <div class="divider"></div>

        <div class="color-row">
            <div class="color-box">
                <label>Particle</label>
                <div class="color-wrap">
                    <input type="color" id="colorPicker" value="#10b981">
                </div>
            </div>
            <div class="color-box">
                <label>Background</label>
                <div class="color-wrap">
                    <input type="color" id="bgColorPicker" value="#0a0a0a">
                </div>
            </div>
        </div>

        <div class="divider"></div>

        <button id="resetBtn" class="btn btn-secondary">
            🔄 Respawn Particles
        </button>

        <div class="divider"></div>

        <div class="control-group">
            <div class="label-row">
                <label>GIF Duration</label>
                <span class="val" id="gifDurVal">5s</span>
            </div>
            <input type="range" id="gifDurSlider" min="2" max="15" value="5">
        </div>

        <button id="gifBtn" class="btn btn-gif">
            🎬 Record GIF
        </button>
    </aside>

    <main id="canvas-container"></main>
</div>
`;

// ==========================================
// SETUP
// ==========================================

function setup() {
    // Inject CSS
    let style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);

    // Inject HTML
    document.body.innerHTML = HTML;

    // Get DOM refs
    const container = document.getElementById('canvas-container');
    textInput = document.getElementById('textInput');
    sizeSlider = document.getElementById('sizeSlider');
    radiusSlider = document.getElementById('radiusSlider');
    speedSlider = document.getElementById('speedSlider');
    frictionSlider = document.getElementById('frictionSlider');
    trailSlider = document.getElementById('trailSlider');
    particleDensitySlider = document.getElementById('densitySlider');
    shapeSelect = document.getElementById('shapeSelect');
    modeSelect = document.getElementById('modeSelect');
    colorPicker = document.getElementById('colorPicker');
    bgColorPicker = document.getElementById('bgColorPicker');
    resetBtn = document.getElementById('resetBtn');

    // Create canvas with WEBGL for better performance
    let cnv = createCanvas(container.offsetWidth, container.offsetHeight);
    cnv.parent('canvas-container');
    pixelDensity(1);
    noSmooth(); // Disable anti-aliasing for performance

    // Events
    textInput.addEventListener('input', spawnParticles);
    resetBtn.addEventListener('click', spawnParticles);
    document.getElementById('gifBtn').addEventListener('click', startGifRecording);

    // Slider value displays
    setupSliderDisplay('sizeSlider', 'sizeVal');
    setupSliderDisplay('radiusSlider', 'radiusVal');
    setupSliderDisplay('speedSlider', 'speedVal');
    setupSliderDisplay('frictionSlider', 'frictionVal', v => (v / 100).toFixed(2));
    setupSliderDisplay('trailSlider', 'trailVal');
    setupSliderDisplay('densitySlider', 'densityVal');
    setupSliderDisplay('gifDurSlider', 'gifDurVal', v => v + 's');

    spawnParticles();
}

function setupSliderDisplay(sliderId, valId, formatter) {
    let slider = document.getElementById(sliderId);
    let val = document.getElementById(valId);
    slider.addEventListener('input', () => {
        val.textContent = formatter ? formatter(slider.value) : slider.value;
    });
}

// ==========================================
// DRAW LOOP
// ==========================================

function draw() {
    let bgColor = color(bgColorPicker.value);
    let trailAlpha = parseInt(trailSlider.value);

    // Trail effect
    bgColor.setAlpha(trailAlpha);
    background(bgColor);

    let pSize = parseInt(sizeSlider.value);
    let radius = parseInt(radiusSlider.value);
    let speed = parseInt(speedSlider.value);
    let friction = parseInt(frictionSlider.value) / 100;
    let shape = shapeSelect.value;
    let mode = modeSelect.value;
    let pColor = color(colorPicker.value);

    noStroke();
    fill(pColor);

    for (let p of particles) {
        p.friction = friction;
        p.update(radius, speed, mode);
        p.show(pSize, shape, pColor);
    }
}

// ==========================================
// PARTICLE SPAWNING
// ==========================================

function spawnParticles() {
    let txt = textInput.value.toUpperCase();
    if (!txt) {
        particles = [];
        return;
    }

    // Split into lines for multi-line support
    let lines = txt.split('\n');
    let longestLine = lines.reduce((a, b) => a.length > b.length ? a : b, '');
    let lineCount = lines.length;

    // Dynamic font scaling based on longest line and number of lines
    fontScale = width / (longestLine.length * 0.7);
    let maxHeightScale = height / (lineCount * 1.3);
    fontScale = Math.min(fontScale, maxHeightScale);
    if (fontScale > height * 0.5) fontScale = height * 0.5;
    if (fontScale < 16) fontScale = 16; // Minimum size

    particles = [];

    graphics = createGraphics(width, height);
    graphics.pixelDensity(1);
    graphics.background(0);
    graphics.fill(255);
    graphics.textSize(fontScale);
    graphics.textLeading(fontScale * 1.2); // Line spacing for multi-line
    graphics.textAlign(CENTER, CENTER);
    graphics.textStyle(BOLD);
    graphics.text(txt, width / 2, height / 2);
    graphics.loadPixels();

    let density = parseInt(document.getElementById('densitySlider').value);

    // Create particles for all text pixels
    for (let y = 0; y < height; y += density) {
        for (let x = 0; x < width; x += density) {
            let idx = (x + y * width) * 4;
            if (graphics.pixels[idx] > 128) {
                particles.push(new Particle(x, y));
            }
        }
    }

    console.log(`Created ${particles.length} particles`);
}

// ==========================================
// PARTICLE CLASS
// ==========================================

class Particle {
    constructor(x, y) {
        this.target = createVector(x, y);
        this.pos = createVector(random(width), random(height));
        this.vel = createVector(random(-5, 5), random(-5, 5));
        this.acc = createVector(0, 0);
        this.maxSpeed = 15;
        this.maxForce = 1;
        this.friction = 0.95;
    }

    update(radius, returnSpeed, mode) {
        let arrive = this.arrive(this.target, returnSpeed);
        this.applyForce(arrive);

        let mouse = createVector(mouseX, mouseY);
        let interact;

        if (mode === 'repel') {
            interact = this.flee(mouse, radius);
        } else if (mode === 'attract') {
            interact = this.attract(mouse, radius);
        } else if (mode === 'orbit') {
            interact = this.orbit(mouse, radius);
        }

        if (interact) this.applyForce(interact);

        this.vel.add(this.acc);
        this.vel.mult(this.friction);
        this.pos.add(this.vel);
        this.acc.mult(0);
    }

    applyForce(force) {
        this.acc.add(force);
    }

    arrive(target, speedVal) {
        let desired = p5.Vector.sub(target, this.pos);
        let d = desired.mag();
        let speed = this.maxSpeed;

        if (d < 100) speed = map(d, 0, 100, 0, this.maxSpeed);

        desired.setMag(speed);
        let steer = p5.Vector.sub(desired, this.vel);
        let strength = map(speedVal, 1, 25, 0.01, 0.6);
        steer.limit(strength);
        return steer;
    }

    flee(target, radius) {
        let desired = p5.Vector.sub(target, this.pos);
        let d = desired.mag();
        if (d < radius) {
            desired.setMag(this.maxSpeed);
            desired.mult(-1);
            let steer = p5.Vector.sub(desired, this.vel);
            steer.limit(this.maxForce * 2);
            return steer;
        }
        return createVector(0, 0);
    }

    attract(target, radius) {
        let desired = p5.Vector.sub(target, this.pos);
        let d = desired.mag();
        if (d < radius) {
            desired.setMag(this.maxSpeed);
            let steer = p5.Vector.sub(desired, this.vel);
            steer.limit(this.maxForce);
            return steer;
        }
        return createVector(0, 0);
    }

    orbit(target, radius) {
        let desired = p5.Vector.sub(target, this.pos);
        let d = desired.mag();
        if (d < radius) {
            // Perpendicular force for orbit
            let perp = createVector(-desired.y, desired.x);
            perp.setMag(this.maxSpeed * 0.5);
            let steer = p5.Vector.sub(perp, this.vel);
            steer.limit(this.maxForce);
            return steer;
        }
        return createVector(0, 0);
    }

    show(size, shape, col) {
        fill(col);

        if (shape === 'line') {
            noFill();
            stroke(col);
            strokeWeight(size / 3);
            let angle = this.vel.heading();
            push();
            translate(this.pos.x, this.pos.y);
            rotate(angle);
            line(0, 0, size * 2, 0);
            pop();
            noStroke();
        } else if (shape === 'circle') {
            ellipse(this.pos.x, this.pos.y, size);
        } else if (shape === 'square') {
            rectMode(CENTER);
            rect(this.pos.x, this.pos.y, size, size);
        } else if (shape === 'triangle') {
            push();
            translate(this.pos.x, this.pos.y);
            rotate(this.vel.heading());
            triangle(-size / 2, size / 2, -size / 2, -size / 2, size / 2, 0);
            pop();
        }
    }
}

// ==========================================
// GIF RECORDING
// ==========================================

function startGifRecording() {
    if (isRecordingGif) return;
    isRecordingGif = true;

    let gifDuration = parseInt(document.getElementById('gifDurSlider').value);
    let container = document.getElementById('canvas-container');

    let overlay = document.createElement('div');
    overlay.className = 'gif-overlay';
    overlay.id = 'gif-overlay';
    overlay.innerHTML = `
        <div class="gif-countdown" id="countdown">3</div>
        <div class="gif-status" id="gif-status">Get ready...</div>
    `;
    container.appendChild(overlay);

    let count = 3;
    let countdownEl = document.getElementById('countdown');
    let statusEl = document.getElementById('gif-status');

    let interval = setInterval(() => {
        count--;
        if (count > 0) {
            countdownEl.textContent = count;
        } else {
            clearInterval(interval);
            countdownEl.textContent = '🔴';
            statusEl.textContent = `Recording ${gifDuration}s...`;

            // Use p5.js saveGif with user-defined duration
            saveGif('typography-animation', gifDuration);

            setTimeout(() => {
                let el = document.getElementById('gif-overlay');
                if (el) el.remove();
                isRecordingGif = false;
            }, (gifDuration + 0.5) * 1000);
        }
    }, 1000);
}

// ==========================================
// WINDOW RESIZE
// ==========================================

function windowResized() {
    let container = document.getElementById('canvas-container');
    if (container) {
        resizeCanvas(container.offsetWidth, container.offsetHeight);
        spawnParticles();
    }
}
