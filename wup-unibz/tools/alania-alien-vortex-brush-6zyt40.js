// WUP 25-26
// Ladwig Alina
/**
 * ORGANIC SILK WEAVER v18 - Layout & Logic Fix
 * * UPDATE:
 * - "SAVE PNG" button moved below "CLEAR" to prevent overlapping.
 * - Toggling "MIRROR" no longer deletes your drawing.
 * - Layout tightened for better visibility.
 */

let particleCount = 700; 
let particles = [];
let undoHistory = []; 

// --- PALETTES ---
let palettes = [
  { name: "Magma",   c: [[0, 100, 100], [30, 100, 100], [50, 100, 100], [0, 0, 10]] }, 
  { name: "Cyber",   c: [[290, 100, 100], [180, 100, 100], [320, 80, 100], [200, 100, 50]] }, 
  { name: "Jungle",  c: [[100, 80, 60], [140, 100, 80], [40, 100, 100], [120, 50, 20]] }, 
  { name: "Cotton",  c: [[340, 30, 100], [200, 30, 100], [60, 30, 100], [280, 20, 100]] },
  { name: "Toxic",   c: [[90, 100, 100], [280, 100, 100], [120, 100, 50], [300, 100, 20]] },
  { name: "Abyss",   c: [[220, 100, 40], [200, 100, 80], [180, 100, 100], [240, 80, 60]] },
  { name: "Noir",    c: [[0, 0, 100], [0, 0, 50], [0, 100, 80], [0, 0, 0]] },
  { name: "Royal",   c: [[45, 80, 100], [35, 100, 60], [260, 60, 40], [50, 20, 100]] },
  { name: "Alien",   c: [[150, 100, 100], [280, 100, 100], [160, 100, 50], [0, 0, 100]] },
  { name: "Ink",     c: [[0, 0, 0], [200, 40, 20], [0, 0, 20], [0, 0, 5]] }
];
let currentPalette = 1;

// Status Variables
let mirrorMode = false;
let glowMode = true;
let teleportMode = false;

// Slider Config
const MIN_PARTICLES = 10;
const MAX_PARTICLES = 6000;
let isDraggingSlider = false;

// UI Config
const UI_WIDTH = 130; 
const BTN_HEIGHT = 35;
// Reduced gap slightly to fit everything nicely
const BTN_GAP = 38; 

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 360, 100, 100, 100);
  background(10);
  document.oncontextmenu = () => false; 
  
  updateParticleArray();
  saveState(); // Initial save
}

function updateParticleArray() {
  let targetCount = floor(particleCount);
  while (particles.length < targetCount) particles.push(new Particle());
  if (particles.length > targetCount) particles.splice(targetCount); 
}

// --- UNDO SYSTEM ---
function saveState() {
  let snapshot = get(); 
  let savedPositions = [];
  for (let p of particles) savedPositions.push(p.pos.copy());

  undoHistory.push({ image: snapshot, positions: savedPositions });
  if (undoHistory.length > 10) undoHistory.shift(); 
}

function performUndo() {
  if (undoHistory.length > 0) {
    let previousState = undoHistory.pop();
    background(10);
    blendMode(BLEND);
    image(previousState.image, 0, 0);
    
    // Restore particle positions (Smart Continuation)
    for (let i = 0; i < particles.length; i++) {
      if (i < previousState.positions.length) {
        particles[i].pos = previousState.positions[i].copy();
      } else {
        let lastPos = previousState.positions[previousState.positions.length - 1];
        particles[i].pos = lastPos ? lastPos.copy() : createVector(width/2, height/2);
      }
      particles[i].vel.mult(0);
      particles[i].acc.mult(0);
    }
  }
}

function draw() {
  if (glowMode) blendMode(ADD);
  else blendMode(BLEND);

  // --- DRAWING ---
  if (mouseIsPressed && mouseX > UI_WIDTH && !isDraggingSlider) {
    let isVortex = (mouseButton === RIGHT);
    for (let p of particles) {
      p.follow(mouseX, mouseY, isVortex);
      p.update();
      p.show();
    }
  }

  // Draw UI
  blendMode(BLEND);
  drawUI();
  
  if (mouseX < UI_WIDTH) cursor(HAND);
  else cursor(ARROW);
}

class Particle {
  constructor() { this.reset(); }
  
  reset() {
    this.pos = createVector(random(UI_WIDTH, width), random(height));
    this.vel = createVector(0, 0);
    this.acc = createVector(0, 0);
    this.maxSpeed = random(3, 7);
    this.friction = 0.93; 
    this.colorIndex = floor(random(4)); 
  }

  follow(targetX, targetY, isVortex) {
    let target = createVector(targetX, targetY);
    let force = p5.Vector.sub(target, this.pos);
    
    if (isVortex) {
      let rotateForce = createVector(-force.y, force.x); 
      rotateForce.normalize().mult(3); 
      force.normalize().mult(0.5); 
      this.acc.add(rotateForce);
      this.acc.add(force);
    } else {
      force.normalize().mult(0.9);
      this.acc.add(force);
    }
    
    this.acc.add(createVector(
      map(noise(this.pos.x*0.005, frameCount*0.01),0,1,-0.5,0.5),
      map(noise(this.pos.y*0.005, frameCount*0.01),0,1,-0.5,0.5)
    ));
  }

  update() {
    this.vel.add(this.acc);
    this.vel.limit(this.maxSpeed);
    this.pos.add(this.vel);
    this.vel.mult(this.friction);
    this.acc.mult(0);
  }

  show() {
    let cVals = palettes[currentPalette].c[this.colorIndex % 4];
    let countFactor = map(particleCount, MIN_PARTICLES, MAX_PARTICLES, 1.0, 0.05);
    let baseAlpha = glowMode ? 15 : 40;
    
    stroke(cVals[0], cVals[1], cVals[2], baseAlpha * countFactor);
    strokeWeight(map(this.vel.mag(), 0, this.maxSpeed, 3, 0.5));

    if (this.pos.x > UI_WIDTH) {
      this.drawLines(this.pos.x, this.pos.y, this.vel.x, this.vel.y);
    }
  }

  drawLines(x, y, vx, vy) {
    if (dist(x, y, x - vx, y - vy) > 30) return;

    line(x, y, x - vx, y - vy);
    if (mirrorMode) {
      let areaW = width - UI_WIDTH;
      let midX = UI_WIDTH + areaW / 2;
      let relX = x - midX;
      line(midX - relX, y, midX - relX + vx, y - vy); 
      line(x, height - y, x - vx, height - y + vy);   
      line(midX - relX, height - y, midX - relX + vx, height - y + vy);
    }
  }
}

// --- UI RENDER SYSTEM ---
function drawUI() {
  noStroke();
  fill(10); 
  rect(0, 0, UI_WIDTH, height);
  stroke(30);
  line(UI_WIDTH, 0, UI_WIDTH, height);

  // 1. PALETTES AREA
  textAlign(CENTER); fill(150); textSize(10); noStroke();
  text("PALETTES", UI_WIDTH/2, 25);
  
  // Moved palettes up slightly (35 instead of 40)
  let pY = 35; let boxSize = 40; let gap = 12;
  let lastRowY = 0;

  for (let i = 0; i < palettes.length; i++) {
    let col = i % 2; let row = floor(i / 2);
    let x = 18 + col * (boxSize + gap);
    let y = pY + row * (boxSize + gap + 15);
    lastRowY = y + boxSize + 15; 

    if (i === currentPalette) {
      stroke(255); strokeWeight(2); noFill();
      rect(x-3, y-3, boxSize+6, boxSize+6, 4);
    }
    
    noStroke();
    let swatchW = boxSize / 4; 
    for(let k = 0; k < 4; k++) {
      let c = palettes[i].c[k];
      fill(c[0], c[1], c[2]);
      if(k === 0) rect(x + k*swatchW, y, swatchW, boxSize, 4, 0, 0, 4);
      else if(k === 3) rect(x + k*swatchW, y, swatchW, boxSize, 0, 4, 4, 0);
      else rect(x + k*swatchW, y, swatchW, boxSize);
    }
    fill(140); textSize(9); noStroke();
    text(palettes[i].name, x + boxSize/2, y + boxSize + 11);
  }

  stroke(30);
  line(10, lastRowY + 10, UI_WIDTH - 10, lastRowY + 10);

  // 2. CONTROLS AREA
  let controlsY = lastRowY + 25; 
  
  // A. Slider
  let sliderY = controlsY;
  fill(180); textSize(9); noStroke(); textAlign(CENTER);
  text(`DENSITY: ${floor(particleCount)}`, UI_WIDTH/2, sliderY - 5);
  fill(30); stroke(50);
  rect(20, sliderY, 90, 6, 3);
  let fillW = map(particleCount, MIN_PARTICLES, MAX_PARTICLES, 0, 90);
  fill(0, 90, 40); noStroke(); 
  rect(20, sliderY, fillW, 6, 3);
  fill(220); stroke(0);
  circle(20 + fillW, sliderY + 3, 12);

  // B. Buttons
  let btnStart = sliderY + 30; // Moved up 5px
  
  // 1. Mirror
  drawButton(15, btnStart, "MIRROR", mirrorMode);
  // 2. Glow
  drawButton(15, btnStart + BTN_GAP, "GLOW", glowMode);
  // 3. Teleport
  drawButton(15, btnStart + BTN_GAP * 2, "TELEPORT", teleportMode);
  // 4. Undo
  let hasHistory = undoHistory.length > 0;
  drawButton(15, btnStart + BTN_GAP * 3, "UNDO STEP", false, hasHistory);
  
  // 5. CLEAR CANVAS (Destructive)
  let clearY = btnStart + BTN_GAP * 4 + 10;
  fill(40); stroke(60);
  // Reddish Hover for Clear
  if (isClick(15, clearY, UI_WIDTH - 30, BTN_HEIGHT)) { fill(80, 20, 20); stroke(255, 100, 100); }
  rect(15, clearY, UI_WIDTH - 30, BTN_HEIGHT, 4);
  fill(200); noStroke(); textSize(10);
  text("CLEAR CANVAS", UI_WIDTH/2, clearY + 22);

  // 6. SAVE PNG (Stacked below Clear, NOT anchored to bottom)
  let saveY = clearY + BTN_HEIGHT + 10;
  
  if(isClick(15, saveY, UI_WIDTH - 30, BTN_HEIGHT)) { fill(50); stroke(255); } 
  else { fill(30); stroke(100); }
  
  rect(15, saveY, UI_WIDTH - 30, BTN_HEIGHT, 5);
  noStroke(); fill(255); textSize(11); // Matched text size
  text("SAVE PNG", UI_WIDTH/2, saveY + 22);
}

function drawButton(x, y, label, isActive, isEnabled = true) {
  // Style logic
  if (!isEnabled) {
    fill(15); stroke(30); 
  } else if (isActive) {
    fill(0, 90, 40); stroke(120, 100, 100); 
  } else {
    fill(25); stroke(50); 
  }
  
  // Hover
  if (isEnabled && mouseX > x && mouseX < x + UI_WIDTH - 30 && mouseY > y && mouseY < y + BTN_HEIGHT) {
      if(!isActive) stroke(150);
  }

  rect(x, y, UI_WIDTH - 30, BTN_HEIGHT, 5);
  noStroke();
  
  if (!isEnabled) fill(60);
  else fill(isActive ? 255 : 150);
  
  textSize(11);
  text(label, UI_WIDTH/2, y + 22);
  
  if (isActive && isEnabled) {
    fill(120, 100, 100);
    circle(x + 10, y + 17, 4);
  }
}

// --- INPUT LOGIC ---

function mouseDragged() {
  // Slider Logic (Re-calculated for new layout)
  let pY = 35; let boxSize = 40; let gap = 12;
  let rows = ceil(palettes.length / 2);
  let lastRowY = pY + (rows - 1) * (boxSize + gap + 15) + boxSize + 15;
  let sliderY = lastRowY + 25;

  if (isDraggingSlider) {
    let newVal = map(mouseX, 20, 110, MIN_PARTICLES, MAX_PARTICLES, true);
    particleCount = newVal;
    updateParticleArray();
    return false;
  }
}

function mouseReleased() {
  isDraggingSlider = false;
}

function mousePressed() {
  // Layout Re-Calc for Clicks
  let pY = 35; let boxSize = 40; let gap = 12;
  let rows = ceil(palettes.length / 2);
  let lastRowY = pY + (rows - 1) * (boxSize + gap + 15) + boxSize + 15;
  let sliderY = lastRowY + 25;

  // 1. Slider Click
  if (mouseX > 10 && mouseX < 120 && mouseY > sliderY - 10 && mouseY < sliderY + 20) {
    isDraggingSlider = true;
    let newVal = map(mouseX, 20, 110, MIN_PARTICLES, MAX_PARTICLES, true);
    particleCount = newVal;
    updateParticleArray();
    return;
  }

  // 2. Canvas Click (Paint)
  if (mouseX > UI_WIDTH) {
    saveState(); // SAVE BEFORE DRAW

    if (teleportMode) {
      for (let p of particles) {
        // Explosion Effect
        p.pos.set(mouseX + random(-2, 2), mouseY + random(-2, 2));
        let explosionForce = p5.Vector.random2D();
        explosionForce.mult(random(5, 15)); 
        p.vel = explosionForce;
        p.acc.mult(0);
      }
    }
    return;
  }

  // 3. Palettes Click
  for (let i = 0; i < palettes.length; i++) {
    let col = i % 2; let row = floor(i / 2);
    let x = 18 + col * (boxSize + gap);
    let y = pY + row * (boxSize + gap + 15);
    if (mouseX >= x && mouseX <= x+boxSize && mouseY >= y && mouseY <= y+boxSize) {
      currentPalette = i;
      particles.forEach(p => p.colorIndex = floor(random(4))); 
      return;
    }
  }
  
  // 4. Buttons Click
  let btnStart = sliderY + 30; 
  let btnW = UI_WIDTH - 30;

  // Mirror - FIXED: No longer calls background(10)
  if (isClick(15, btnStart, btnW, BTN_HEIGHT)) { 
    mirrorMode = !mirrorMode; 
    // removed background(10); -> Canvas remains untouched
  }
  // Glow
  if (isClick(15, btnStart + BTN_GAP, btnW, BTN_HEIGHT)) { 
    glowMode = !glowMode; 
  }
  // Teleport
  if (isClick(15, btnStart + BTN_GAP * 2, btnW, BTN_HEIGHT)) { 
    teleportMode = !teleportMode; 
  }
  // Undo
  if (isClick(15, btnStart + BTN_GAP * 3, btnW, BTN_HEIGHT)) {
    performUndo();
  }
  
  // CLEAR CANVAS
  let clearY = btnStart + BTN_GAP * 4 + 10;
  if (isClick(15, clearY, btnW, BTN_HEIGHT)) {
     saveState(); 
     background(10);
     particles.forEach(p => p.reset());
  }

  // Save - FIXED: Logic matches new stacked position
  let saveY = clearY + BTN_HEIGHT + 10;
  if (isClick(15, saveY, btnW, BTN_HEIGHT)) { 
    saveCanvas('My_Art_' + frameCount, 'png'); 
  }
}

function isClick(x, y, w, h) {
  return (mouseX > x && mouseX < x + w && mouseY > y && mouseY < y + h);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  background(10);
  undoHistory = [];
  saveState();
}