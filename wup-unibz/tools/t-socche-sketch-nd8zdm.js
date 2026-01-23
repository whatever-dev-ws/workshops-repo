let particles = [];
let drawingPath = [];
let followPath = [];
let lastMouseTime = 0;
let pathDisplayStartTime = 0;
let mode = "RANDOM"; 

let isAnimating = true;
let useRandomColor = true;
let totalLeds = 500; 

// UI Variables
let toggleBtn, randomColorBtn, colorPicker, freqSlider, gifBtn, gifDurationInput;
let sizeSlider, speedSlider, countInput;

function setup() {
  createCanvas(windowWidth, windowHeight - 120);
  colorMode(HSB, 360, 100, 100, 1);
  
  // --- UI CONTROLS ---
  // Using a container to keep it organized at the bottom
  let controls = createDiv();
  controls.style('position', 'absolute');
  controls.style('bottom', '0');
  controls.style('left', '0');
  controls.style('width', '100%');
  controls.style('height', '120px'); // Matches the canvas offset
  controls.style('padding', '15px');
  controls.style('background', '#000');
  controls.style('border-top', '2px solid #333');
  controls.style('display', 'flex');
  controls.style('flex-wrap', 'wrap');
  controls.style('align-items', 'center');
  controls.style('gap', '10px');
  controls.style('box-sizing', 'border-box'); // Ensures padding doesn't break width
  
  // Helper for text labels to ensure they are visible
  function addLabel(txt) {
    let span = createSpan(txt);
    span.parent(controls);
    span.style('color', 'white');
    span.style('font-family', 'monospace');
    span.style('margin-right', '5px');
    span.style('margin-left', '10px');
  }

  // 1. Toggle On/Off
  toggleBtn = createButton('ON');
  toggleBtn.parent(controls);
  toggleBtn.style('width', '60px');
  toggleBtn.style('cursor', 'pointer');
  toggleBtn.mousePressed(() => isAnimating = !isAnimating);
  
  // 2. Color Mode
  randomColorBtn = createButton('RAINBOW');
  randomColorBtn.parent(controls);
  randomColorBtn.style('width', '80px');
  randomColorBtn.style('cursor', 'pointer');
  randomColorBtn.mousePressed(() => useRandomColor = !useRandomColor);
  
  // 3. Frequency
  addLabel('FREQ:');
  freqSlider = createSlider(0, 2, 0.2, 0.01);
  freqSlider.style('width', '60px');
  freqSlider.parent(controls);
  
  // 4. Color
  addLabel('CLR:');
  colorPicker = createColorPicker('#00ffff');
  colorPicker.style('width', '40px');
  colorPicker.style('border', 'none'); // Fix for some browsers
  colorPicker.parent(controls);

  // 5. Size
  addLabel('SIZE:');
  sizeSlider = createSlider(1, 20, 5, 0.5);
  sizeSlider.style('width', '60px');
  sizeSlider.parent(controls);

  // 6. Speed
  addLabel('SPD:');
  speedSlider = createSlider(1, 20, 8, 0.5);
  speedSlider.style('width', '60px');
  speedSlider.parent(controls);

  // 7. Particle Count
  addLabel('COUNT:');
  countInput = createInput(totalLeds.toString(), 'number');
  countInput.size(60);
  countInput.parent(controls);
  // Style the input so it's not white-on-white
  countInput.style('background', '#222');
  countInput.style('color', '#fff');
  countInput.style('border', '1px solid #555');
  countInput.changed(updateParticleCount); 

  // 8. GIF
  gifBtn = createButton('💾');
  gifBtn.parent(controls);
  gifBtn.style('cursor', 'pointer');
  gifBtn.mousePressed(() => {
    let secs = parseInt(gifDurationInput.value());
    saveGif('techno_visuals', secs);
  });
  
  gifDurationInput = createInput('3', 'number');
  gifDurationInput.size(30);
  gifDurationInput.parent(controls);
  gifDurationInput.style('background', '#222');
  gifDurationInput.style('color', '#fff');
  gifDurationInput.style('border', '1px solid #555');

  // Initialize
  updateParticleCount();
}

function updateParticleCount() {
  let val = parseInt(countInput.value());
  if (!isNaN(val) && val > 0) {
    totalLeds = val;
    particles = [];
    for (let i = 0; i < totalLeds; i++) {
      particles.push(new LEDParticle(i));
    }
  }
}

function draw() {
  background(0); 
  updateUI();

  // Mode Management
  if (mode === "COUNTDOWN" && millis() - lastMouseTime > 3000) {
    followPath = [...drawingPath];
    drawingPath = [];
    mode = "PATH";
    pathDisplayStartTime = millis();
  }

  if (mode === "PATH" && millis() - pathDisplayStartTime > 5000) {
    mode = "RANDOM";
    followPath = [];
  }

  if (isAnimating) {
    let strobeSpeed = freqSlider.value() * 10; 
    let strobeActive = sin(frameCount * strobeSpeed) > -0.5;

    for (let p of particles) {
      p.update();
      if (strobeActive) {
        p.show();
      }
    }
  }

  drawHUD();
}

function drawHUD() {
  fill(0, 0, 100);
  noStroke();
  textFont('monospace');
  textSize(14);
  
  push(); 
  textAlign(CENTER);
  text("Draw with your mouse on the canvas and trust the process...", width / 2, 30);
  pop(); 

  // Status Text
  if (mode === "COUNTDOWN") {
    let timeLeft = 3 - (millis() - lastMouseTime) / 1000;
    text(">> LOCKING PATH IN: " + timeLeft.toFixed(1) + "s", 20, 30);
  } else if (mode === "PATH") {
    let timeLeft = 5 - (millis() - pathDisplayStartTime) / 1000;
    text(">> HOLDING SHAPE: " + timeLeft.toFixed(1) + "s", 20, 30);
  } else {
    text(">> MODE: CHAOTIC DISCO", 20, 30);
  }
  
  textAlign(RIGHT);
  text("PARTICLES: " + particles.length, width - 20, 30);
}

function updateUI() {
  toggleBtn.html(isAnimating ? "ON" : "OFF");
  toggleBtn.style('background', isAnimating ? '#00ff00' : '#440000');
  toggleBtn.style('color', isAnimating ? '#000' : '#fff');
  toggleBtn.style('border', '1px solid #333');
  
  randomColorBtn.html(useRandomColor ? "RAINBOW" : "SOLID");
  randomColorBtn.style('background', useRandomColor ? '#00ff00' : '#440000');
  randomColorBtn.style('color', useRandomColor ? '#000' : '#fff');
  randomColorBtn.style('border', '1px solid #333');
}

function mouseDragged() {
  if (mouseY < height && mouseY > 0) {
    drawingPath.push(createVector(mouseX, mouseY));
    lastMouseTime = millis();
    mode = "COUNTDOWN";
  }
}

class LEDParticle {
  constructor(id) {
    this.id = id;
    this.pos = createVector(random(width), random(height));
    this.vel = p5.Vector.random2D();
    this.acc = createVector(0, 0);
  }

  update() {
    let currentMaxSpeed = speedSlider.value();
    
    // LOGIC: IF in PATH mode, EVERYONE follows.
    if (mode === "PATH" && followPath.length > 2) {
      // Evenly distribute ALL particles along the path
      let pathIdx = floor(map(this.id, 0, totalLeds, 0, followPath.length - 1));
      let target = followPath[pathIdx];
      
      let desired = p5.Vector.sub(target, this.pos);
      let d = desired.mag();
      
      // Arrive logic
      if (d < 100) {
        let m = map(d, 0, 100, 0, currentMaxSpeed);
        desired.setMag(m);
      } else {
        desired.setMag(currentMaxSpeed);
      }
      
      let steer = p5.Vector.sub(desired, this.vel);
      steer.limit(0.8); 
      this.acc.add(steer);
      
    } else {
      // Chaos / Wander Mode
      let angle = noise(this.pos.x * 0.005, this.pos.y * 0.005, frameCount * 0.02) * TWO_PI * 4;
      let drift = p5.Vector.fromAngle(angle);
      drift.mult(0.5); 
      this.acc.add(drift);
      this.vel.limit(currentMaxSpeed * 0.6); 
    }

    this.vel.add(this.acc);
    this.pos.add(this.vel);
    this.acc.mult(0);

    // Screen Wrap
    if (this.pos.x < 0) this.pos.x = width;
    if (this.pos.x > width) this.pos.x = 0;
    if (this.pos.y < 0) this.pos.y = height;
    if (this.pos.y > height) this.pos.y = 0;
  }

  show() {
    let h, s, b;
    if (useRandomColor) {
      h = (this.id + frameCount * 2) % 360;
      s = 80;
      b = 100;
    } else {
      let c = color(colorPicker.value());
      h = hue(c);
      s = saturation(c);
      b = brightness(c);
    }
    
    let baseSize = sizeSlider.value();

    // Outer Glow
    noStroke();
    fill(h, s, b, 0.2);
    ellipse(this.pos.x, this.pos.y, baseSize * 2.5);
    
    // Core
    fill(h, s, b);
    ellipse(this.pos.x, this.pos.y, baseSize);
    
    // Sparkle
    fill(0, 0, 100, 0.9);
    ellipse(this.pos.x - (baseSize*0.2), this.pos.y - (baseSize*0.2), baseSize * 0.4);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight - 120);
}