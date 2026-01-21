// WUP 25-26
// Francesco Lewis
// COMBINED SINGLE FILE VERSION - PURE JS DOM MODIFICATION

let currentVehicle;
let trailGraphics;
let gameState = "START"; // Options: START, PLAY
let uiVisible = true;
let isDragging = false;
let lastSpacePress = 0;

// Settings Variables
let currentWeight = 2;
let currentTrailColor;
let targetColorState = 0; // 0 = Color 1, 1 = Color 2

// DOM Elements (Global References)
let uiContainer;
let startScreen;
let inputWeightNormal, inputWeightDrift, vehicleSelector, blendToggle, wheelToggle;
let picker1, picker2;
let secondaryColorRow;

// --- PURE JS UI CREATION ---
// Helper to apply styles via object
function applyStyles(element, styles) {
  for (let property in styles) {
    element.style[property] = styles[property];
  }
}

// Helper to create elements quickly
function createEl(tag, parent, styles = {}, props = {}) {
  let el = document.createElement(tag);
  applyStyles(el, styles);
  for (let prop in props) {
    el[prop] = props[prop];
  }
  if (parent) parent.appendChild(el);
  return el;
}

function createInterface() {
  // 1. Global Body Styles
  applyStyles(document.body, {
    margin: '0',
    padding: '0',
    overflow: 'hidden',
    fontFamily: "'Segoe UI', Roboto, Helvetica, sans-serif",
    userSelect: 'none'
  });

  // 2. Start Screen Overlay
  startScreen = createEl('div', document.body, {
    position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    zIndex: '1000', color: 'white', background: 'transparent'
  }, { id: 'start-screen' });

  let menuContent = createEl('div', startScreen, {
    background: 'rgba(0, 0, 0, 0.85)', padding: '40px',
    borderRadius: '15px', textAlign: 'center',
    border: '1px solid #444', boxShadow: '0 0 30px rgba(0,0,0,0.5)'
  });

  createEl('h1', menuContent, {
    margin: '0', fontSize: '3rem', letterSpacing: '2px',
    color: '#ff4444', textTransform: 'uppercase', fontStyle: 'italic'
  }, { innerText: 'DRIFT BRUSH' });

  createEl('p', menuContent, {
    marginTop: '0', color: '#aaa', fontSize: '1.2rem', marginBottom: '30px'
  }, { innerText: 'A Physics-Based Drawing Tool' });

  // Instructions Grid
  let grid = createEl('div', menuContent, {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px',
    textAlign: 'left', marginBottom: '30px',
    background: 'rgba(255,255,255,0.1)', padding: '20px', borderRadius: '8px'
  });

  const instructions = [
    ['WASD / Arrows', 'Drive'], ['Spacebar (Hold)', 'Drift'],
    ['Spacebar (x2)', 'Jump'], ['C Key', 'Blend Colors'],
    ['Mouse Drag', 'Move Car']
  ];

  instructions.forEach(item => {
    createEl('div', grid, { fontWeight: 'bold', color: '#fff' }, { innerText: item[0] });
    createEl('div', grid, { color: '#ccc' }, { innerText: item[1] });
  });

  let startBtn = createEl('button', menuContent, {
    background: '#ff4444', color: 'white', border: 'none',
    padding: '15px 30px', fontSize: '1.2rem', borderRadius: '50px',
    cursor: 'pointer', fontWeight: 'bold'
  }, { innerText: 'PRESS SPACE TO START' });

  // JS Animation for Pulse (replaces CSS @keyframes)
  startBtn.animate([
    { transform: 'scale(1)' },
    { transform: 'scale(1.05)' },
    { transform: 'scale(1)' }
  ], { duration: 1500, iterations: Infinity });

  startBtn.addEventListener('click', () => {
    // Simulate Start
    document.dispatchEvent(new KeyboardEvent('keydown', { 'keyCode': 32 }));
  });

  // 3. Main UI Sidebar
  uiContainer = createEl('div', document.body, {
    display: 'none', position: 'fixed', top: '20px', left: '20px', width: '260px',
    background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)',
    padding: '20px', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
    zIndex: '500'
  }, { id: 'ui-container' });

  // Header
  let header = createEl('div', uiContainer, {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '15px',
    borderBottom: '2px solid #eee', paddingBottom: '10px'
  });
  createEl('span', header, {}, { innerText: 'Studio Settings' });
  let closeBtn = createEl('button', header, {
    background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#888'
  }, { innerText: '✕' });
  closeBtn.addEventListener('click', toggleUI);

  // Group Helper
  const createGroup = () => createEl('div', uiContainer, {
    marginBottom: '15px', borderBottom: '1px solid #f0f0f0', paddingBottom: '15px'
  });

  // Group 1: Vehicle
  let g1 = createGroup();
  createEl('label', g1, { display: 'block', marginBottom: '5px', fontSize: '0.9rem' }, { innerText: 'Vehicle Type' });
  vehicleSelector = createEl('select', g1, {
    width: '100%', padding: '5px', borderRadius: '4px', border: '1px solid #ccc'
  });
  ['Car', 'Tractor', 'Motorbike', 'F1 Car'].forEach(v => {
    let opt = createEl('option', vehicleSelector, {}, { value: v, innerText: v });
    if (v === 'Car') opt.innerText = 'Sports Car';
    if (v === 'F1 Car') opt.innerText = 'F1 Racer';
  });
  vehicleSelector.addEventListener('change', () => {
    currentVehicle = new Vehicle(vehicleSelector.value);
    handleUIUpdates();
  });

  // Group 2: Colors
  let g2 = createGroup();
  const createRow = (parent, labelTxt, type, id, val) => {
    let r = createEl('div', parent, { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontSize: '0.9rem', color: '#444' });
    createEl('label', r, {}, { innerText: labelTxt });
    let inp = createEl('input', r, { padding: '5px', borderRadius: '4px', border: '1px solid #ccc', width: type === 'number' ? '80px' : 'auto' }, { type: type, id: id });
    if (val !== undefined) inp.value = val;
    return { row: r, input: inp };
  };

  picker1 = createRow(g2, 'Primary Color', 'color', 'color-picker-1', '#333333').input;
  
  let secObj = createRow(g2, 'Secondary / Blend', 'color', 'color-picker-2', '#ff0000');
  picker2 = secObj.input;
  secondaryColorRow = secObj.row;
  secondaryColorRow.style.display = 'none';

  let blendObj = createRow(g2, 'Color Blend (Press C)', 'checkbox', 'blend-toggle');
  blendToggle = blendObj.input;
  blendToggle.addEventListener('change', handleUIUpdates);

  // Group 3: Physics
  let g3 = createGroup();
  inputWeightNormal = createRow(g3, 'Normal Weight', 'number', 'weight-normal', '2').input;
  inputWeightDrift = createRow(g3, 'Drift Weight', 'number', 'weight-drift', '12').input;
  wheelToggle = createRow(g3, 'Independent Wheels', 'checkbox', 'wheel-toggle').input;
  wheelToggle.checked = true;

  // Buttons
  let btnRow = createEl('div', uiContainer, { display: 'flex', gap: '10px', marginTop: '10px' });
  
  let btnStyle = {
    flex: '1', padding: '10px', border: 'none', borderRadius: '6px',
    background: '#333', color: 'white', cursor: 'pointer', fontWeight: 'bold'
  };
  
  let saveBtn = createEl('button', btnRow, btnStyle, { innerText: 'Save PNG' });
  saveBtn.addEventListener('click', () => saveCanvas(trailGraphics, 'my-drift-art', 'png'));

  let clearBtn = createEl('button', btnRow, Object.assign({}, btnStyle, { background: '#ffeded', color: '#d32f2f' }), { innerText: 'Clear' });
  clearBtn.addEventListener('click', () => trailGraphics.clear());

  createEl('div', uiContainer, {
    textAlign: 'center', color: '#999', fontSize: '0.8rem', marginTop: '10px', fontStyle: 'italic'
  }, { innerText: "Press 'H' to Hide Interface" });
}

function setup() {
  createInterface(); // Build DOM
  createCanvas(windowWidth, windowHeight);
  trailGraphics = createGraphics(windowWidth, windowHeight);
  
  // Initialize Vehicle
  currentVehicle = new Vehicle("Car");
  
  // Set initial color (using standard DOM .value property)
  currentTrailColor = color(picker1.value);
  
  handleUIUpdates();
}

function draw() {
  if (gameState === "START") {
    drawStartMenuAnimation();
  } else {
    background(240);
    image(trailGraphics, 0, 0);

    handleInputAndPhysics();
    currentVehicle.display();
  }
}

function handleInputAndPhysics() {
  // 1. Mouse Dragging
  if (isDragging) {
    currentVehicle.pos.x = mouseX;
    currentVehicle.pos.y = mouseY;
    currentVehicle.vel.mult(0);
    currentVehicle.speed = 0;
    return;
  }

  // 2. Settings Updates (Using standard DOM .value)
  let wNormal = float(inputWeightNormal.value);
  let wDrift = float(inputWeightDrift.value);
  
  // Check drift status
  let isDrifting = keyIsDown(32) && !currentVehicle.isJumping;
  
  // Smooth Weight Transition
  let targetW = isDrifting ? wDrift : wNormal;
  currentWeight = lerp(currentWeight, targetW, 0.15);

  // Color Blending (Using standard DOM .value)
  let c1 = color(picker1.value);
  let c2 = color(picker2.value);
  let targetC = (targetColorState === 0) ? c1 : c2;
  currentTrailColor = lerpColor(color(currentTrailColor), targetC, 0.05);

  // 3. Vehicle Update
  currentVehicle.update(isDrifting);
}

// --- VEHICLE CLASS ---
class Vehicle {
  constructor(type) {
    this.type = type;
    this.pos = createVector(width/2, height/2);
    this.vel = createVector(0, 0);
    this.angle = 0;
    this.speed = 0;
    this.isJumping = false;
    this.jumpTimer = 0;
    this.config = this.getSpecs(type);
  }

  getSpecs(type) {
    switch(type) {
      case "Tractor": return { w: 45, h: 32, color: '#32CD32', treaded: true };
      case "Motorbike": return { w: 28, h: 10, color: '#444', singleLine: true };
      case "F1 Car": return { w: 52, h: 26, color: '#0055AA', f1Style: true };
      default: return { w: 42, h: 22, color: '#DC143C' };
    }
  }

  update(isDrifting) {
    // --- ACCELERATION ---
    if (keyIsDown(UP_ARROW) || keyIsDown(87)) this.speed += 0.2;
    if (keyIsDown(DOWN_ARROW) || keyIsDown(83)) this.speed -= 0.15;
    
    // --- FRICTION UPDATE ---
    if (isDrifting) {
      this.speed *= 0.99; 
    } else {
      this.speed *= 0.96;
    }

    // --- STEERING ---
    let steerRate = map(this.speed, 0, 12, 0, 0.07);
    if (keyIsDown(LEFT_ARROW) || keyIsDown(65)) this.angle -= steerRate;
    if (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) this.angle += steerRate;

    let direction = p5.Vector.fromAngle(this.angle);

    // --- PHYSICS VECTOR MATH ---
    if (isDrifting) {
      this.vel.lerp(direction.mult(this.speed), 0.06); 
    } else {
      this.vel = direction.mult(this.speed);
    }

    // Move
    this.pos.add(this.vel);
    
    // Boundary Clamp
    this.pos.x = constrain(this.pos.x, 0, width);
    this.pos.y = constrain(this.pos.y, 0, height);

    // Trail Drawing
    if (!this.isJumping && abs(this.speed) > 0.2) {
      this.drawTrail();
    } else if (this.isJumping) {
      this.jumpTimer--;
      if (this.jumpTimer <= 0) this.isJumping = false;
    }
  }

  drawTrail() {
    trailGraphics.push();
    
    let alphaVal = map(abs(this.speed), 0, 12, 20, 255);
    let c = color(currentTrailColor);
    c.setAlpha(alphaVal);
    
    trailGraphics.stroke(c);
    trailGraphics.strokeWeight(currentWeight);
    trailGraphics.translate(this.pos.x, this.pos.y);
    trailGraphics.rotate(this.angle);

    let w = this.config.w / 2;
    let h = this.config.h / 2;
    // Using standard DOM .checked property
    let useMulti = wheelToggle.checked;

    if (useMulti && this.config.singleLine) {
        this.renderLine(-w, 0, w, 0); 
    } else if (useMulti && this.config.f1Style) {
        trailGraphics.stroke(picker2.value); // Standard DOM value
        trailGraphics.strokeWeight(currentWeight * 1.8);
        this.renderLine(-w, -h, -w + 8, -h); 
        this.renderLine(-w, h, -w + 8, h);
        
        trailGraphics.stroke(picker1.value); // Standard DOM value
        trailGraphics.strokeWeight(currentWeight * 0.8);
        this.renderLine(w - 8, -h, w, -h); 
        this.renderLine(w - 8, h, w, h);
    } else if (useMulti) {
        this.renderLine(-w, -h, w, -h); 
        this.renderLine(-w, h, w, h);
    } else {
        this.renderLine(-w, 0, w, 0);
    }
    trailGraphics.pop();
  }

  renderLine(x1, y1, x2, y2) {
    if (this.config.treaded) {
      trailGraphics.drawingContext.setLineDash([3, 8]);
      trailGraphics.strokeWeight(currentWeight + 3);
    } else {
      trailGraphics.drawingContext.setLineDash([]);
    }
    trailGraphics.line(x1, y1, x2, y2);
  }

  display() {
    push();
    translate(this.pos.x, this.pos.y);
    rotate(this.angle);
    
    if (this.isJumping) {
      let jumpScale = map(sin(map(this.jumpTimer, 0, 40, PI, 0)), 0, 1, 1, 1.5);
      scale(jumpScale);
      drawingContext.shadowBlur = 20;
      drawingContext.shadowColor = 'black';
    }

    rectMode(CENTER);
    fill(this.config.color);
    noStroke();
    rect(0, 0, this.config.w, this.config.h, 4);
    
    fill(255, 150);
    rect(this.config.w/5, 0, this.config.w/4, this.config.h*0.7);
    pop();
  }
}

// --- SYSTEM FUNCTIONS ---

function drawStartMenuAnimation() {
  background(40);
  noStroke();
  fill(255, 10);
  for(let i = 0; i < width; i+=50) {
    rect(i - (frameCount % 50), 0, 2, height);
  }
  let animX = (frameCount * 5) % (width + 100) - 50;
  fill(220, 20, 60);
  rect(animX, height/2 - 100, 60, 30, 5);
  fill(50);
  rect(animX - 20, height/2 - 200 - 15, 15, 5);
  rect(animX - 20, height/2 - 100 + 15, 15, 5);
  for(let i = 0; i < width; i+=50) {
    rect(i - (frameCount % 50), 0, 2, height);
  }
  let animY = (frameCount * 10) % (width + 100) - 50;
  fill(220, 140, 20);
  rect(animY, height/2 - 200, 60, 30, 5);
  fill(50);
  rect(animY - 20, height/2 - 200 - 15, 15, 5);
  rect(animY - 20, height/2 - 200 + 15, 15, 5);
  let animZ = (frameCount * 6) % (width + 100) - 50;
  fill(50, 220, 60);
  rect(animZ, height/2 - 300, 30, 30, 5);
  fill(50);
  rect(animZ - 20, height/2 - 300 - 15, 15, 5);
  rect(animZ - 20, height/2 - 300 + 15, 15, 5);
  for(let i = 0; i < width; i+=50) {
    rect(i - (frameCount % 50), 0, 2, height);
  }
  let animT = (frameCount * 7) % (width + 100) - 50;
  fill(40, 80, 240);
  rect(animT, height/2 - 0, 80, 30, 5);
  fill(50);
  rect(animT - 20, height/2 - 400 - 15, 15, 5);
  rect(animT - 20, height/2 - 400 + 15, 15, 5);
}

function keyPressed() {
  if (gameState === "START") {
    if (keyCode === 32) {
      gameState = "PLAY";
      startScreen.style.display = 'none';
      uiContainer.style.display = 'block';
    }
  } else {
    if (key === 'h' || key === 'H') toggleUI();
    if (key === 'c' || key === 'C') targetColorState = 1 - targetColorState;
    if (keyCode === 32) {
      let now = millis();
      if (now - lastSpacePress < 250) { 
        currentVehicle.isJumping = true;
        currentVehicle.jumpTimer = 40;
      }
      lastSpacePress = now;
    }
  }
}

function mousePressed() {
  if (gameState !== "PLAY") return;
  let d = dist(mouseX, mouseY, currentVehicle.pos.x, currentVehicle.pos.y);
  if (d < 50) isDragging = true;
}

function mouseReleased() {
  isDragging = false;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  trailGraphics = createGraphics(windowWidth, windowHeight);
}

function toggleUI() {
  uiVisible = !uiVisible;
  if(uiVisible) uiContainer.style.display = 'block';
  else uiContainer.style.display = 'none';
}

function handleUIUpdates() {
  let showSec = (vehicleSelector.value === "F1 Car" || blendToggle.checked);
  if(showSec) secondaryColorRow.style.display = 'flex';
  else secondaryColorRow.style.display = 'none';
}