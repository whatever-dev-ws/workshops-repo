let circles = [];
let shards = [];
let independentTrails = []; 
let colors = ['#FF5733', '#33FF57', '#3357FF', '#F333FF', '#FFFF33', '#33FFFF'];

let worldMask; 
let offset = { x: 0, y: 0 }; 
let boardSize = { w: 0, h: 0 }; 
let cubePos = { x: 0, y: 0 };
let currentMode = 0; 
let resetType = ""; 
let isRestarting = false;
let shakeTimer = 0;
let blackHoleAlpha = 0;

let gravity = 0; 
let softness = 1.0; 
let recordDuration = 2;
let durSlider;

let isRecording = false;
let recordStartTime = 0;
const MAX_BALLS = 150; 

function setup() {
  createCanvas(windowWidth - 40, windowHeight - 160);
  boardSize.w = width * 0.7;
  boardSize.h = height * 0.7;
  
  worldMask = createGraphics(width, height);
  worldMask.background(255); 
  resetPositions();

  // --- UI SECTION ---
  let x = 20;
  
  const modeBtn = createButton('MODE (M)');
  modeBtn.position(x, 10);
  applyStyle(modeBtn, '#444');
  modeBtn.mousePressed(toggleMode);

  const gravBtn = createButton('GRAVITY');
  gravBtn.position(x + 90, 10);
  applyStyle(gravBtn, '#444');
  gravBtn.mousePressed(() => {
    gravity = (gravity === 0) ? 0.2 : (gravity === 0.2 ? 0.5 : 0);
  });

  const softBtn = createButton('SOFTNESS');
  softBtn.position(x + 175, 10);
  applyStyle(softBtn, '#444');
  softBtn.mousePressed(() => {
    softness = (softness === 1.0) ? 0.3 : 1.0;
  });
  
  const bhBtn = createButton('MERGE BLACK HOLE');
  bhBtn.position(x, 40);
  applyStyle(bhBtn, '#8e44ad'); // Purple for black hole
  bhBtn.mousePressed(triggerBlackHoleReset);

  const lsBtn = createButton('LIQUID SHATTER');
  lsBtn.position(x + 155, 40);
  applyStyle(lsBtn, '#d35400'); // Orange for shatter
  lsBtn.mousePressed(triggerLiquidShatter);

  const clBtn = createButton('CLEAN RESET');
  clBtn.position(x + 285, 40);
  applyStyle(clBtn, '#2c3e50');
  clBtn.mousePressed(triggerCleanReset);
  
  const pngBtn = createButton('SAVE PNG');
  pngBtn.position(x, 70);
  applyStyle(pngBtn, '#27ae60');
  pngBtn.mousePressed(() => saveCanvas('merged_space', 'png'));

  const recBtn = createButton('REC GIF');
  recBtn.position(x + 95, 70);
  applyStyle(recBtn, '#c0392b');
  recBtn.mousePressed(startGifRecording);
  
  durSlider = createSlider(1, 10, 2, 1);
  durSlider.position(x + 185, 75);
  durSlider.style('width', '100px');
}

// Utility for strict inline styling and hover effects
function applyStyle(btn, bgColor) {
  let s = btn.elt.style;
  s.backgroundColor = bgColor;
  s.color = 'white';
  s.border = 'none';
  s.padding = '5px 12px';
  s.borderRadius = '4px';
  s.cursor = 'pointer';
  s.fontFamily = 'sans-serif';
  s.fontSize = '11px';
  s.fontWeight = 'bold';
  s.transition = '0.2s';

  btn.mouseOver(() => {
    s.filter = 'brightness(1.3)';
    s.transform = 'translateY(-1px)';
  });
  btn.mouseOut(() => {
    s.filter = 'brightness(1.0)';
    s.transform = 'translateY(0)';
  });
}

function resetPositions() {
  offset.x = (width - boardSize.w) / 2;
  offset.y = (height - boardSize.h) / 2;
  cubePos.x = width / 2;
  cubePos.y = height / 2;
}

function triggerBlackHoleReset() {
  isRestarting = true;
  resetType = "blackhole";
  blackHoleAlpha = 0;
}

function triggerLiquidShatter() {
  isRestarting = true;
  resetType = "shatter";
  shakeTimer = 60;
  for (let c of circles) {
    independentTrails.push(new GhostTrail(c.history, c.color, c.vel, "dissolve"));
    for (let i = 0; i < 5; i++) shards.push(new Shard(c.x, c.y, c.color, c.vel));
  }
  circles = [];
}

function triggerCleanReset() {
  isRestarting = true;
  resetType = "clean";
  circles = [];
  shards = [];
  independentTrails = [];
  resetPositions();
}

function draw() {
  recordDuration = durSlider.value();
  let jiggleX = (isRestarting && resetType === "shatter" && shakeTimer > 0) ? sin(frameCount * 0.5) * (shakeTimer * 0.1) : 0;
  let jiggleY = (isRestarting && resetType === "shatter" && shakeTimer > 0) ? cos(frameCount * 0.4) * (shakeTimer * 0.1) : 0;
  if (shakeTimer > 0) shakeTimer--;

  push();
  translate(jiggleX, jiggleY);
  background(245); 

  if (!isRestarting || resetType === "blackhole") {
    handleInput();
    if (mouseIsPressed && mouseY > 150 && frameCount % 5 === 0) {
      circles.push(new BouncingCircle(mouseX, mouseY));
      if (circles.length > MAX_BALLS) {
        circles.shift(); 
      }
    }
  }

  if (isRestarting) {
    handleRestartLogic();
  }

  worldMask.noStroke(); worldMask.fill(0);
  worldMask.rect(offset.x, offset.y, boardSize.w, boardSize.h);
  image(worldMask, 0, 0);

  handleEntities();

  if (currentMode === 1) {
    fill(255, 0, 0); rect(cubePos.x - 15, cubePos.y - 15, 30, 30);
    worldMask.fill(0); worldMask.rect(cubePos.x - 15, cubePos.y - 15, 30, 30);
  }
  pop();

  drawHUD();
}

function handleRestartLogic() {
  let lerpSpeed = (resetType === "clean") ? 0.1 : 0.02;
  let targetX = (width - boardSize.w) / 2;
  let targetY = (height - boardSize.h) / 2;
  
  offset.x = lerp(offset.x, targetX, lerpSpeed);
  offset.y = lerp(offset.y, targetY, lerpSpeed);
  cubePos.x = lerp(cubePos.x, width / 2, lerpSpeed);
  cubePos.y = lerp(cubePos.y, height / 2, lerpSpeed);
  
  if (resetType === "blackhole") {
    blackHoleAlpha = lerp(blackHoleAlpha, 255, 0.05);
    for(let i = 5; i > 0; i--) {
      noStroke();
      fill(0, blackHoleAlpha / i);
      ellipse(width/2, height/2, 15 * i + sin(frameCount*0.2)*15, 15 * i + sin(frameCount*0.2)*15);
    }
    if (blackHoleAlpha > 250 && circles.length === 0 && independentTrails.length === 0) {
      if (dist(offset.x, offset.y, targetX, targetY) < 1) {
        isRestarting = false;
        blackHoleAlpha = 0;
        resetType = "";
        worldMask.background(255);
        resetPositions();
      }
    }
  } else if (resetType === "clean" || resetType === "shatter") {
     if (dist(offset.x, offset.y, targetX, targetY) < 1 && shards.length === 0 && independentTrails.length === 0) {
        isRestarting = false;
        resetType = "";
        worldMask.background(255);
        resetPositions();
     }
  }
}

function drawHUD() {
  fill(80); noStroke(); textSize(11); textAlign(LEFT);
  text("REC TIME: " + recordDuration + "s", 300, 88);
  text("BALLS: " + circles.length + " / " + MAX_BALLS, 20, height - 20);
  let statusText = "GRAVITY: " + (gravity > 0 ? "ON" : "OFF") + " | SOFTNESS: " + (softness < 1 ? "LOW" : "HIGH");
  text(statusText, 20, 110);
}

function startGifRecording() {
  saveGif('vortex_loop', recordDuration, { delay: 0, units: 'seconds' });
}

function handleEntities() {
  for (let i = shards.length - 1; i >= 0; i--) {
    shards[i].update(); shards[i].display();
    if (shards[i].alpha <= 0) shards.splice(i, 1);
  }
  for (let i = independentTrails.length - 1; i >= 0; i--) {
    independentTrails[i].update(worldMask); 
    independentTrails[i].display();
    if (independentTrails[i].isDead()) independentTrails.splice(i, 1);
  }
  for (let i = circles.length - 1; i >= 0; i--) {
    if (isRestarting && resetType === "blackhole") {
      circles[i].attractToCenter();
    }
    circles[i].update(); 
    circles[i].display();
    
    if (isRestarting && resetType === "blackhole") {
      if (dist(circles[i].x, circles[i].y, width/2, height/2) < 15) {
        circles.splice(i, 1);
        continue;
      }
    }
    for (let j = i + 1; j < circles.length; j++) {
      circles[i].checkCollision(circles[j]);
    }
  }
}

function handleInput() {
  let moveSpeed = 6;
  let target = (currentMode === 0) ? offset : cubePos;
  if (keyIsDown(LEFT_ARROW)) target.x -= moveSpeed;
  if (keyIsDown(RIGHT_ARROW)) target.x += moveSpeed;
  if (keyIsDown(UP_ARROW)) target.y -= moveSpeed;
  if (keyIsDown(DOWN_ARROW)) target.y += moveSpeed;
}

function toggleMode() { currentMode = currentMode === 0 ? 1 : 0; }

class GhostTrail {
  constructor(history, col, vel, behavior) {
    this.history = [...history];
    this.color = color(col);
    this.vel = vel.copy();
    this.behavior = behavior;
    this.alpha = 255;
  }
  update(mask) {
    if (this.history.length === 0) return;
    this.vel.mult(0.95);
    this.history.shift();
    if (this.history.length === 0) this.alpha = 0;
  }
  display() {
    if (this.history.length < 2) return;
    noFill(); stroke(red(this.color), green(this.color), blue(this.color), this.alpha);
    strokeWeight(2);
    beginShape();
    for (let p of this.history) vertex(p.x, p.y);
    endShape();
  }
  isDead() { return this.alpha <= 0 || this.history.length === 0; }
}

class Shard {
  constructor(x, y, col, pVel) {
    this.x = x; this.y = y;
    this.vel = p5.Vector.random2D().mult(random(1, 3)).add(pVel.copy().mult(0.2));
    this.color = col; this.alpha = 255;
  }
  update() { this.x += this.vel.x; this.y += this.vel.y; this.alpha -= 5; }
  display() {
    let c = color(this.color); c.setAlpha(this.alpha);
    fill(c); noStroke(); rect(this.x, this.y, 3, 3);
  }
}

class BouncingCircle {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.vel = p5.Vector.random2D().mult(random(3, 5));
    this.r = 14; this.color = random(colors);
    this.history = [];
    this.deflateY = 28;
  }

  attractToCenter() {
    let center = createVector(width/2, height/2);
    let pos = createVector(this.x, this.y);
    let dir = p5.Vector.sub(center, pos);
    let d = dir.mag();
    dir.setMag(map(d, 0, width, 3, 0.5));
    this.vel.add(dir);
    let sideWays = createVector(-dir.y, dir.x);
    sideWays.setMag(1.5);
    this.vel.add(sideWays);
    this.vel.mult(0.96); 
  }

  update() {
    if (!isRestarting || resetType !== "blackhole") this.vel.y += gravity;
    this.history.push(createVector(this.x, this.y));
    let maxH = softness < 1 ? 40 : 15;
    if (this.history.length > maxH) this.history.shift();
    let nx = this.x + this.vel.x, ny = this.y + this.vel.y;
    
    if (!isRestarting || resetType !== "blackhole") {
      if (worldMask.get(nx, ny)[0] > 200) {
        if (worldMask.get(nx, this.y)[0] > 200) this.vel.x *= -softness;
        if (worldMask.get(this.x, ny)[0] > 200) {
          this.vel.y *= -softness;
          if (softness < 1) this.deflateY = 15; 
        }
      } else { 
        this.x = nx; this.y = ny; 
        this.deflateY = lerp(this.deflateY, 28, 0.1);
      }
    } else {
      this.x = nx; this.y = ny;
    }
  }

  display() {
    noFill(); stroke(this.color); strokeWeight(2);
    beginShape();
    for (let p of this.history) vertex(p.x, p.y);
    endShape();
    fill(this.color); noStroke();
    ellipse(this.x, this.y, 28, this.deflateY);
  }

  checkCollision(other) {
    let d = dist(this.x, this.y, other.x, other.y);
    if (d < 28) {
      let temp = this.vel.copy();
      this.vel = other.vel.copy().mult(softness);
      other.vel = temp.mult(softness);
    }
  }
}