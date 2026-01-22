// WUP 25-26
// Andrea Binanzer
let noodleMachine;
let doughs = [];      
let noodles = [];     
let pastaStacks = []; 
let doughInMachine = 0; 

let prevAngle = 0;
let crankSpeed = 0;

// Screen-System
let gameState = "START"; 
let startButton, instructions;
let sauceButton, wellDoneWindow; 
let pestoBtn, tomatoBtn, aglioBtn, doneBtn; 
let finalOverlay; 

let totalPastaProduced = 0; 

// --- VARIABLEN FÜR DIE SAUCE ---
let sauceColor;
let sauceType = "none"; 

// Hilfsfunktion für einheitliches Holz-Design
function applyWoodStyle(el, isWindow = false) {
  el.style('background', 'linear-gradient(45deg, #8B4513 25%, #A0522D 25%, #A0522D 50%, #8B4513 50%, #8B4513 75%, #A0522D 75%, #A0522D 100%)');
  el.style('background-size', '40px 40px');
  el.style('color', '#F5DEB3');
  el.style('font-family', '"Trebuchet MS", sans-serif');
  el.style('font-weight', 'bold');
  el.style('border', '4px solid #3E1F0B');
  el.style('border-radius', isWindow ? '15px' : '8px');
  el.style('box-shadow', '4px 4px 10px rgba(0,0,0,0.4)');
  el.style('text-shadow', '1px 1px 3px rgba(0,0,0,0.8)');
  el.style('cursor', 'pointer');
  
  if (isWindow) {
    el.style('padding', '20px');
    el.style('display', 'flex');
    el.style('flex-direction', 'column');
    el.style('align-items', 'center');
    el.style('text-align', 'center');
  }
}

function preload() {
  noodleMachine = loadModel('base.obj', true);
}

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  prevAngle = atan2(mouseY - height / 2, mouseX - width / 2);
  sauceColor = color(255, 245, 180); 

  // --- START SEITE UI ---
  startButton = createButton("Let's make Pasta");
  startButton.position(windowWidth / 2 - 100, windowHeight / 2 - 60);
  startButton.size(200, 55);
  applyWoodStyle(startButton);

  instructions = createDiv('1. Click on "D" to put the dough in the container<br>2. Draw circles on the mousepad to make the pasta');
  instructions.position(windowWidth / 2 - 200, windowHeight / 2 + 15);
  instructions.style('width', '400px');
  instructions.style('text-align', 'center');
  instructions.style('font-family', 'sans-serif');
  instructions.style('color', '#3E1F0B');

  startButton.mousePressed(() => {
    gameState = "GAME";
    startButton.hide();
    instructions.hide();
  });

  // --- WELL DONE FENSTER ---
  wellDoneWindow = createDiv('Well done!');
  wellDoneWindow.position(windowWidth / 2 - 135, windowHeight / 2 - 100);
  // Größe passt sich nun dem Inhalt an
  wellDoneWindow.style('width', '270px');
  applyWoodStyle(wellDoneWindow, true);
  wellDoneWindow.style('font-size', '30px');
  wellDoneWindow.hide();

  sauceButton = createButton("Choose sauce ->");
  sauceButton.parent(wellDoneWindow);
  sauceButton.style('margin-top', '20px');
  sauceButton.size(180, 40);
  applyWoodStyle(sauceButton);
  sauceButton.style('font-size', '16px');

  sauceButton.mousePressed(() => {
    gameState = "SAUCE";
    wellDoneWindow.hide();
  });

  // --- SAUCEN BUTTONS ---
  pestoBtn = createButton("Pesto");
  applyWoodStyle(pestoBtn);
  pestoBtn.mousePressed(() => { sauceColor = color(100, 200, 110); sauceType = "pesto"; doneBtn.show(); });
  
  tomatoBtn = createButton("Tomato");
  applyWoodStyle(tomatoBtn);
  tomatoBtn.mousePressed(() => { sauceColor = color(255, 99, 71); sauceType = "tomato"; doneBtn.show(); });
  
  aglioBtn = createButton("Aglio e Olio");
  applyWoodStyle(aglioBtn);
  aglioBtn.mousePressed(() => { sauceColor = color(255, 250, 200); sauceType = "aglio"; doneBtn.show(); });

  pestoBtn.hide(); tomatoBtn.hide(); aglioBtn.hide();

  // --- DONE BUTTON ---
  doneBtn = createButton("SERVE PASTA");
  doneBtn.position(windowWidth / 2 - 75, windowHeight - 100);
  doneBtn.size(150, 50);
  applyWoodStyle(doneBtn);
  doneBtn.hide();
  doneBtn.mousePressed(() => {
    gameState = "FINAL";
    doneBtn.hide(); pestoBtn.hide(); tomatoBtn.hide(); aglioBtn.hide();
    finalOverlay.style('display', 'flex'); 
    setTimeout(() => { saveCanvas('pasta_chef_creation', 'png'); }, 1000);
  });

  // --- FINAL OVERLAY ---
  finalOverlay = createDiv('PASTA CHEF');
  finalOverlay.position(0, 0);
  finalOverlay.size(windowWidth, windowHeight);
  finalOverlay.style('display', 'none'); 
  finalOverlay.style('justify-content', 'center');
  finalOverlay.style('align-items', 'center'); 
  finalOverlay.style('font-family', 'sans-serif');
  finalOverlay.style('font-size', '100px');
  finalOverlay.style('font-weight', '900');
  finalOverlay.style('color', '#222');
  finalOverlay.style('text-shadow', '3px 3px 10px white');
  finalOverlay.style('pointer-events', 'none');
  finalOverlay.style('z-index', '9999');
  finalOverlay.style('padding-bottom', '600px'); 
}

function draw() {
  background(245, 240, 220);
  if (gameState === "START") return;

  if (gameState === "GAME") {
    camera(0, 0, 800, 0, 0, 0, 0, 1, 0);
    playGame();
    if (totalPastaProduced >= 2) wellDoneWindow.show();
  } else if (gameState === "SAUCE") {
    drawSauceScreen();
  } else if (gameState === "FINAL") {
    drawFinalScreen();
  }
}

function drawSauceScreen() {
  wellDoneWindow.hide(); 
  orbitControl();
  push();
  translate(0, 100, 0);
  fill(255); noStroke();
  cylinder(220, 12); 
  drawGrowingPastaPile(-45, -30, -30, 50, true); 
  drawGrowingPastaPile(50, -30, 20, 45, true); 
  drawGrowingPastaPile(-40, -30, 40, 45, true); 
  pop();

  pestoBtn.show(); pestoBtn.position(width/2 - 180, 50);
  tomatoBtn.show(); tomatoBtn.position(width/2 - 50, 50);
  aglioBtn.show(); aglioBtn.position(width/2 + 80, 50);

  push();
  resetMatrix();
  translate(0, -180);
  textAlign(CENTER);
  fill(62, 31, 11);
  textSize(28);
  textStyle(BOLD);
  text("Choose your sauce:", 0, 0);
  pop();
}

function drawFinalScreen() {
  orbitControl();
  push();
  translate(0, 100, 0);
  fill(255); noStroke();
  cylinder(220, 12); 
  drawGrowingPastaPile(-45, -30, -30, 50, true); 
  drawGrowingPastaPile(50, -30, 20, 45, true); 
  drawGrowingPastaPile(-40, -30, 40, 45, true); 
  pop();

  push();
  resetMatrix();
  fill(34);
  textAlign(CENTER, CENTER);
  textSize(50);
  textStyle(BOLD);
  translate(0, -450, 100); 
  text("PASTA CHEF", 0, 0);
  pop();
}

function drawGrowingPastaPile(x, y, z, heightValue, isOnPlate = false) {
  push(); 
  translate(x, y, z); 
  if (gameState === "SAUCE" || gameState === "FINAL") {
    fill(sauceColor);
    stroke(red(sauceColor)*0.7, green(sauceColor)*0.7, blue(sauceColor)*0.5);
    strokeWeight(0.2);
  } else {
    fill(255, 245, 180);
    stroke(200, 180, 100); 
    strokeWeight(0.5);
  }
  
  let layers = floor(heightValue); 
  for(let i = 0; i < layers; i++) {
    push(); 
    if (isOnPlate) {
      translate(sin(i * 0.4) * 35, -i * 0.6, cos(i * 0.4) * 35);
    } else {
      translate(0, -i * 1.5, 0);
    }
    rotateY(i * 0.7); 
    let r = isOnPlate ? 35 - (i * 0.4) : 10 - (i * 0.3);
    torus(max(r, 8), isOnPlate ? 4 : 2); 
    
    if (gameState === "SAUCE" || gameState === "FINAL") {
      noStroke(); 
      if (sauceType === "aglio") fill(30); 
      else if (sauceType === "pesto") fill(20, 80, 20); 
      else if (sauceType === "tomato") fill(150, 0, 0); 

      if (sauceType !== "none") {
        for (let j = 0; j < 2; j++) {
          push();
          let angle = i + j * PI; 
          translate(cos(angle) * r, 0, sin(angle) * r);
          sphere(1.3); 
          pop();
        }
      }
      fill(sauceColor); 
    }
    pop();
  }
  pop();
}

function playGame() {
  push();
  translate(0, 230, -50); 
  fill(100, 70, 40); noStroke();
  box(1000, 10, 1000);  
  pop();
  ambientLight(80); 
  pointLight(255, 255, 255, 500, -500, 500); 
  directionalLight(150, 160, 200, -1, 0, -1); 
  
  orbitControl();
  push();
  scale(3); rotateX(PI); rotateY(HALF_PI); 
  noStroke(); 
  ambientMaterial(170, 175, 180); 
  specularMaterial(255); 
  shininess(150); 
  model(noodleMachine);
  pop();

  let currentAngle = atan2(mouseY - height / 2, mouseX - width / 2);
  let deltaAngle = currentAngle - prevAngle;
  if (deltaAngle > PI) deltaAngle -= TWO_PI;
  if (deltaAngle < -PI) deltaAngle += TWO_PI;
  let mouseMoving = (abs(mouseX - pmouseX) > 0 || abs(mouseY - pmouseY) > 0);
  if (mouseMoving) {
    crankSpeed = abs(deltaAngle) * 5; 
  } else {
    crankSpeed = lerp(crankSpeed, 0, 0.1); 
  }
  prevAngle = currentAngle;
  if (crankSpeed > 0.05 && doughInMachine > 0) {
    if (frameCount % 4 == 0) {
      noodles.push(new Nudel());
      doughInMachine -= 0.5; 
    }
  }
  for (let i = doughs.length - 1; i >= 0; i--) {
    doughs[i].update(); doughs[i].display();
    if (doughs[i].y > -200) { doughInMachine += 20; doughs.splice(i, 1); }
  }
  for (let i = noodles.length - 1; i >= 0; i--) {
    noodles[i].update(crankSpeed); noodles[i].display();
    if (noodles[i].y > 230) {
      let foundStack = false;
      for (let s of pastaStacks) {
        let d = dist(s.x, s.z, noodles[i].x, noodles[i].z);
        if (d < 15) { s.h += 1.5; totalPastaProduced += 0.1; foundStack = true; break; }
      }
      if (!foundStack) { pastaStacks.push({ x: noodles[i].x, z: noodles[i].z, h: 2 }); }
      noodles.splice(i, 1);
    }
  }
  for (let s of pastaStacks) { drawGrowingPastaPile(s.x, 225, s.z, s.h); }
  drawUI();
}

function keyPressed() {
  if (gameState === "GAME" && (key === 'd' || key === 'D')) {
    doughs.push(new DoughBall());
  }
}

class DoughBall {
  constructor() { this.x = 250; this.y = -500, this.z = -200; }
  update() { this.y += 5; }
  display() { push(); translate(this.x, this.y, this.z); fill(245, 222, 179); noStroke(); sphere(30); pop(); }
}

class Nudel {
  constructor() { this.x = random(80, 200); this.y = 10; this.z = 100; this.len = 0; this.maxLen = random(50, 500); this.isFalling = false; }
  update(speed) { if (!this.isFalling) { this.len += speed * 3; if (this.len > this.maxLen) this.isFalling = true; } else { this.y += 4; } }
  display() { push(); translate(this.x, this.y + this.len/2, this.z); fill(255, 245, 180); stroke(200, 180, 100); strokeWeight(0.5); box(3, this.len, 3); pop(); }
}

function drawUI() {
  push(); resetMatrix(); translate(-width/2 + 20, -height/2 + 30);
  fill(62, 31, 11); textSize(20); textStyle(BOLD);
  text("D: Dough | Circle: Crank", 0, 0);
  pop();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  if (startButton) startButton.position(width / 2 - 100, height / 2 - 60);
  if (wellDoneWindow) wellDoneWindow.position(width / 2 - 135, height / 2 - 100);
  if (doneBtn) doneBtn.position(width / 2 - 75, height - 100);
}