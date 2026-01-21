// WUP 2025/26
// Maud Grünewald

let tapModel; 
let mic, fft;
let drops = [];
let ripples = [];
let drillParticles = []; 

// HTML Elements
let emptyButton;
let startGameButton;
let fullLabel;
let titleLabel;
let instructionLabel;
let startOverlay;
let micIndicator;
let drillLabel; 
let drillProgressDiv; 
let drillBar; 

// --- STATE ---
let gameState = 'DRILL'; 
let drillProgress = 0;
let isAudioStarted = false;

// --- SCENE CONFIG ---
let sceneScale = 1.4; 
let sceneOffsetY = -20;
let tapUpOffset = -60; 

// --- HARDCODED SETTINGS ---
// 1. Hole Position (Local)
let localSpoutX = -40;
let localSpoutY = -37; 
let localSpoutZ = -30;

// 2. Hole Rotation (Decal)
let holeRotX = 3.17;
let holeRotY = 0;
let holeRotZ = 0;

// 3. Drill Phase View Rotation
let drillRotX = 3.11;
let drillRotY = 0.14;
let drillRotZ = 0;

// 4. GLASS COORDINATES
let glassX = -49;
let glassY = 74;
let glassZ = -3;
let glassBottom = 104; 

// --- WATER LEVEL ---
let collectedWaterHeight = 0;
let maxWaterHeight = 55;

function preload() {
  tapModel = loadModel('base-3.obj', true);
}

function setup() {
  createCanvas(600, 600, WEBGL);
  
  mic = new p5.AudioIn();
  fft = new p5.FFT();
  fft.setInput(mic);

  setupUI();
}

function setupUI() {
  // Title
  titleLabel = createDiv("fill the glass!");
  titleLabel.position(0, 20);
  titleLabel.style('width', '600px');
  titleLabel.style('text-align', 'center');
  titleLabel.style('font-family', 'Helvetica, sans-serif');
  titleLabel.style('font-size', '24px');
  titleLabel.style('font-weight', 'bold');
  titleLabel.style('color', '#ffffff');

  // Drill Instructions
  drillLabel = createDiv("click & hold to drill the water hole");
  drillLabel.position(0, height - 100);
  drillLabel.style('width', '600px');
  drillLabel.style('text-align', 'center');
  drillLabel.style('font-family', 'Helvetica, sans-serif');
  drillLabel.style('color', '#ffcc00'); 
  drillLabel.style('font-size', '16px');
  
  // Drill Progress Bar
  drillProgressDiv = createDiv("");
  drillProgressDiv.position(width/2 - 100, height - 60);
  drillProgressDiv.size(200, 10);
  drillProgressDiv.style('border', '2px solid white');
  drillProgressDiv.style('border-radius', '5px');
  
  drillBar = createDiv("");
  drillBar.parent(drillProgressDiv);
  drillBar.size(0, 10); 
  drillBar.style('background-color', '#ffcc00');
  drillBar.style('border-radius', '3px');

  // START GAME BUTTON (Updated Style)
  startGameButton = createButton("start game"); // Lowercase
  startGameButton.position(width/2 - 60, height - 60);
  startGameButton.mousePressed(enterGamePhase);
  
  // Styling to match your "empty glass" button
  startGameButton.style('font-family', 'Helvetica, sans-serif');
  startGameButton.style('background-color', '#000000'); // Black background
  startGameButton.style('color', '#ffffff'); // White text
  startGameButton.style('border', '1px solid #ffffff');
  startGameButton.style('padding', '12px 24px');
  startGameButton.style('border-radius', '4px');
  startGameButton.style('font-size', '14px');
  startGameButton.style('cursor', 'pointer');
  
  startGameButton.hide();

  // Game UI
  instructionLabel = createDiv("make a 'shh' sound to release water");
  instructionLabel.position(0, 60); 
  instructionLabel.style('width', '600px');
  instructionLabel.style('text-align', 'center');
  instructionLabel.style('font-family', 'Helvetica, sans-serif');
  instructionLabel.style('font-size', '14px');
  instructionLabel.style('color', '#aaaaaa');
  instructionLabel.hide();

  emptyButton = createButton("empty glass");
  emptyButton.position(width/2 - 60, height - 60); 
  emptyButton.mousePressed(emptyGlass);
  styleButton(emptyButton);
  emptyButton.hide();

  fullLabel = createDiv("full!");
  fullLabel.position(0, height - 110); 
  fullLabel.style('width', '600px'); 
  fullLabel.style('text-align', 'center');
  fullLabel.style('font-family', 'Helvetica, sans-serif');
  fullLabel.style('color', '#ffffff'); 
  fullLabel.style('font-size', '24px');
  fullLabel.style('font-weight', 'bold');
  fullLabel.style('text-shadow', '1px 1px 2px black');
  fullLabel.hide(); 

  micIndicator = createDiv("");
  micIndicator.position(20, 20);
  micIndicator.size(12, 12);
  micIndicator.style('background-color', 'red');
  micIndicator.style('border-radius', '50%');
  micIndicator.hide(); 

  startOverlay = createDiv("<span>click to start</span>");
  startOverlay.position(0, 0);
  startOverlay.size(width, height);
  startOverlay.style('display', 'flex');
  startOverlay.style('align-items', 'center');
  startOverlay.style('justify-content', 'center');
  startOverlay.style('background', 'rgba(0,0,0,0.8)');
  startOverlay.style('color', 'white');
  startOverlay.style('font-family', 'Helvetica, sans-serif');
  startOverlay.style('font-size', '30px');
  startOverlay.style('font-weight', 'bold');
  startOverlay.style('cursor', 'pointer');
  startOverlay.mousePressed(startApp);
}

function styleButton(btn) {
  btn.style('font-family', 'Helvetica, sans-serif');
  btn.style('background-color', '#000000'); 
  btn.style('color', '#ffffff');
  btn.style('border', '1px solid #ffffff');
  btn.style('padding', '12px 24px');
  btn.style('border-radius', '4px');
  btn.style('font-size', '14px');
  btn.style('cursor', 'pointer');
}

function startApp() {
  userStartAudio();
  mic.start();
  isAudioStarted = true;
  startOverlay.hide();
}

function emptyGlass() {
  collectedWaterHeight = 0;
  ripples = []; 
  fullLabel.hide();
}

function draw() {
  background(20); 

  if (gameState === 'DRILL' || gameState === 'DRILL_DONE') {
    drawDrillPhase();
  } else {
    drawGamePhase();
  }
}

// ==========================================
// DRAW THE HOLE (Flat Decal)
// ==========================================
function drawRuggedHole(size) {
  if(size <= 0.1) return;

  push();
  translate(localSpoutX, localSpoutY, localSpoutZ);
  
  // Custom Rotation
  rotateX(holeRotX);
  rotateY(holeRotY);
  rotateZ(holeRotZ);
  
  // Decal Offset
  translate(0, 0, 0.2); 

  noStroke();
  fill(0); // Black

  beginShape();
  for (let a = 0; a <= TWO_PI + 0.1; a += 0.1) {
    let jagged = map(noise(a * 4, 100), 0, 1, -0.2, 0.2);
    let r = (size * 0.5) + (size * 0.5 * jagged);
    vertex(r * cos(a), r * sin(a));
  }
  endShape(CLOSE);
  
  pop();
}

// ==========================================
// PHASE 1: DRILLING
// ==========================================
function drawDrillPhase() {
  orbitControl(1, 1, 0.2);
  
  ambientLight(150);
  pointLight(255, 200, 150, 0, 0, 300);

  push();
  translate(0, 60, 0); 
  scale(sceneScale); 

  push();
  translate(0, tapUpOffset, 0);
  
  // Rotation for Drilling View
  rotateX(drillRotX);
  rotateY(drillRotY);
  rotateZ(drillRotZ);
  
  if (gameState === 'DRILL' && mouseIsPressed && isAudioStarted) {
    let shake = 1.0;
    translate(random(-shake, shake), random(-shake, shake), random(-shake, shake));
    
    drillProgress += 0.6; 
    let percent = constrain(drillProgress, 0, 100);
    drillBar.style('width', percent + '%');

    // Sparks
    for(let i=0; i<4; i++) {
        drillParticles.push(new DrillParticle(localSpoutX, localSpoutY, localSpoutZ));
    }

    if (drillProgress >= 100) {
      finishDrilling();
    }
  }

  // Draw Model
  noStroke();
  fill(150);
  specularMaterial(100);
  shininess(50);
  model(tapModel); 
  
  // Draw Hole (Decal)
  let currentHoleSize = map(drillProgress, 0, 100, 0, 14.0);
  if (gameState === 'DRILL_DONE') currentHoleSize = 14.0;
  drawRuggedHole(currentHoleSize);
  
  // Draw Drill Bit
  if (gameState === 'DRILL') {
    if (mouseIsPressed && isAudioStarted) {
      push();
      translate(localSpoutX, localSpoutY, localSpoutZ);
      
      // Match Hole Angle
      rotateX(holeRotX);
      rotateY(holeRotY);
      rotateZ(holeRotZ);
      
      translate(0, 0, 15); 
      fill(100); 
      rotateZ(frameCount * 0.8); 
      cylinder(4, 40); 
      pop();
    } else {
      // Blinking Target
      push();
      translate(localSpoutX, localSpoutY, localSpoutZ);
      
      rotateX(holeRotX);
      rotateY(holeRotY);
      rotateZ(holeRotZ);
      translate(0, 0, 0.5);
      
      fill(255, 0, 0, 150);
      noStroke();
      if (frameCount % 30 < 15) ellipse(0,0, 4, 4);
      pop();
    }
  }
  
  pop(); // End Tap Transform
  pop(); // End Scene

  // Sparks
  for (let i = drillParticles.length - 1; i >= 0; i--) {
    drillParticles[i].update();
    drillParticles[i].display();
    if (drillParticles[i].isFinished()) drillParticles.splice(i, 1);
  }
}

function finishDrilling() {
  gameState = 'DRILL_DONE';
  drillLabel.html("drilling complete!"); // Lowercase
  drillLabel.style('color', '#ffffff'); // White
  drillProgressDiv.hide();
  startGameButton.show();
}

function enterGamePhase() {
  gameState = 'PLAY';
  startGameButton.hide();
  drillLabel.hide();
  instructionLabel.show();
  emptyButton.show();
  micIndicator.show();
  drillParticles = [];
}

// ==========================================
// PHASE 2: GAME
// ==========================================
function drawGamePhase() {
  orbitControl(1, 0, 0.2); 

  ambientLight(100); 
  directionalLight(255, 255, 255, 0, 0, -1); 
  directionalLight(100, 100, 120, 0.5, 0.5, -0.5); 

  push();
  translate(0, sceneOffsetY, 0);
  scale(sceneScale);

  // 1. TAP MODEL
  push();
  translate(0, tapUpOffset, 0); 
  noStroke();
  ambientMaterial(60, 60, 60);    
  specularMaterial(255, 255, 255); 
  shininess(150);                  
  
  rotateX(PI); 
  rotateY(QUARTER_PI); 
  
  model(tapModel); 
  
  // DRAW HOLE
  drawRuggedHole(14.0); 
  
  pop();

  // 2. WATER
  if (collectedWaterHeight > 0.1) {
    push();
    translate(glassX, glassBottom - (collectedWaterHeight / 2), glassZ);
    noStroke();
    fill(100, 200, 255, 120); 
    specularMaterial(255, 255, 255);
    shininess(100);
    cylinder(16.5, collectedWaterHeight);
    translate(0, -collectedWaterHeight/2, 0);
    rotateX(HALF_PI);
    fill(180, 230, 255, 180); 
    ellipse(0, 0, 16.5, 16.5);
    pop();
  }

  // 3. GLASS
  push();
  translate(glassX, glassY, glassZ);
  rotateX(PI); 
  fill(240, 250, 255, 30); 
  stroke(200, 230, 255, 80); 
  strokeWeight(1.5);
  specularMaterial(255, 255, 255);
  shininess(250); 
  cylinder(18, 60, 24, 1, true, false);
  pop();

  // 4. RIPPLES
  let waterSurfaceY = 102 - collectedWaterHeight;
  for (let i = ripples.length - 1; i >= 0; i--) {
    ripples[i].update();
    ripples[i].display(glassX, waterSurfaceY, glassZ);
    if (ripples[i].isFinished()) {
      ripples.splice(i, 1);
    }
  }

  // LOGIC
  if (isAudioStarted) {
    let spectrum = fft.analyze();
    let trebleVol = fft.getEnergy("treble"); 
    let midVol = fft.getEnergy("mid"); 
    let isShh = trebleVol > 20 && trebleVol > midVol * 1.1;
    let isFull = collectedWaterHeight >= maxWaterHeight;

    if (isShh) {
      micIndicator.style('background-color', '#00ff00');
      micIndicator.style('box-shadow', '0px 0px 10px #00ff00');
    } else {
      micIndicator.style('background-color', '#ff0000');
      micIndicator.style('box-shadow', 'none');
    }

    if (isFull) fullLabel.show();
    else fullLabel.hide();

    if (isShh && !isFull) {
      if (trebleVol > 100) {
         if(frameCount % 1 == 0) drops.push(new Drop(true)); 
      } else {
         if (random(1) < 0.15) drops.push(new Drop(false));
      }
    }
  }

  // DROPS
  for (let i = drops.length - 1; i >= 0; i--) {
    drops[i].update();
    if (drops[i].hasHitSurface(waterSurfaceY)) {
      let fillAmount = drops[i].isStream ? 0.4 : 0.15;
      if (collectedWaterHeight < maxWaterHeight) {
        collectedWaterHeight += fillAmount;
      }
      if (!drops[i].isStream || frameCount % 8 === 0) {
        ripples.push(new Ripple());
      }
      drops.splice(i, 1);
    }
  }

  for (let i = 0; i < drops.length; i++) {
    let current = drops[i];
    let prev = (i > 0) ? drops[i-1] : null;

    if (current.isStream && prev && prev.isStream && (current.y - prev.y) < 50) {
      drawStreamConnection(current, prev);
    } else {
      current.display();
    }
  }
  pop(); 
}

// --- HELPER: CALCULATE WORLD POS FOR DROPS ---
function getSpoutWorldPos() {
    let v = createVector(localSpoutX, localSpoutY, localSpoutZ);
    // Rotate X (PI)
    let tempY = v.y * cos(PI) - v.z * sin(PI);
    let tempZ = v.y * sin(PI) + v.z * cos(PI);
    v.y = tempY;
    v.z = tempZ;
    // Rotate Y (QUARTER_PI)
    let tempX = v.x * cos(QUARTER_PI) - v.z * sin(QUARTER_PI);
    tempZ = v.x * sin(QUARTER_PI) + v.z * cos(QUARTER_PI);
    v.x = tempX;
    v.z = tempZ;
    v.y += tapUpOffset;
    return v;
}

// --- CLASSES ---

class Drop {
  constructor(isStream) {
    this.isStream = isStream; 
    let startPos = getSpoutWorldPos();
    this.x = startPos.x;
    this.z = startPos.z;
    this.y = startPos.y; 
    let scatter = this.isStream ? 0.05 : 0.5;
    this.x += random(-scatter, scatter);
    this.z += random(-scatter, scatter);
    this.speed = 8;
    this.gravity = 0.8;
  }
  update() {
    this.speed += this.gravity;
    this.y += this.speed;
  }
  display() {
    push();
    translate(this.x, this.y, this.z);
    noStroke();
    fill(180, 220, 255, 150); 
    specularMaterial(255, 255, 255);
    shininess(200);
    if (this.isStream) {
      sphere(2.3); 
    } else {
      push();
      scale(1, 1.3, 1);
      sphere(2.5);
      pop();
    }
    pop();
  }
  hasHitSurface(surfaceY) { return this.y >= surfaceY; }
}

class DrillParticle {
  constructor(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.vx = random(-4, 4);
    this.vy = random(-4, 4);
    this.vz = random(-4, 4);
    this.life = 255;
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.z += this.vz;
    this.life -= 15;
  }
  display() {
    push();
    translate(this.x, this.y, this.z);
    stroke(255, 200, 50, this.life); 
    strokeWeight(3);
    point(0, 0);
    pop();
  }
  isFinished() { return this.life < 0; }
}

class Ripple {
  constructor() {
    this.radius = 1;
    this.alpha = 200;
  }
  update() {
    this.radius += 1.0; 
    this.alpha -= 10; 
  }
  display(gx, gy, gz) {
    push();
    translate(gx, gy, gz);
    rotateX(HALF_PI); 
    noFill();
    stroke(255, 255, 255, this.alpha); 
    strokeWeight(1.5);
    ellipse(0, 0, this.radius, this.radius);
    pop();
  }
  isFinished() { return this.alpha <= 0; }
}

function drawStreamConnection(topDrop, bottomDrop) {
  push();
  let midX = (topDrop.x + bottomDrop.x) / 2;
  let midY = (topDrop.y + bottomDrop.y) / 2;
  let midZ = (topDrop.z + bottomDrop.z) / 2;
  let d = dist(topDrop.x, topDrop.y, topDrop.z, bottomDrop.x, bottomDrop.y, bottomDrop.z);
  translate(midX, midY, midZ);
  noStroke();
  fill(180, 220, 255, 180); 
  specularMaterial(255, 255, 255);
  shininess(200);
  cylinder(2.3, d * 1.1, 8, 1, false, false);
  pop();
}

function mousePressed() {
  if (!isAudioStarted) userStartAudio();
}