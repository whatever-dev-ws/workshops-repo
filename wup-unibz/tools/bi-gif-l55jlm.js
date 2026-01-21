let cellule = [];
let maxCellule = 800; // Aumentato il limite massimo

// Variabili UI e Layout
let sidebarWidth = 240;
let sidebar;
let uiElements = {}; 
let currentThemeKey = 'blue';
let isRecording = false;

// Variabili Tutorial
let showTutorial = true; 

// Variabili Sfondo (Immagine/Webcam)
let bgMode = 'color'; 
let bgImage = null;
let videoCapture = null;

// Temi colori
const themes = {
  'blue': { name: 'Blu Elettrico', r: [100, 150], g: [200, 255], b: [220, 255] },
  'red': { name: 'Rosa & Rosso', r: [200, 255], g: [50, 100], b: [100, 150] },
  'green': { name: 'Verde', r: [50, 100], g: [200, 255], b: [50, 150] },
  'gold': { name: 'Oro & Miele', r: [200, 255], g: [180, 230], b: [0, 50] },
  'mono': { name: 'Pastello', r: [200, 255], g: [200, 255], b: [200, 255] }
};

function setup() {
  let cnv = createCanvas(windowWidth - sidebarWidth, windowHeight);
  cnv.position(sidebarWidth, 0);
  
  frameRate(30);
  setupSidebar();
  
  cellule.push(new Cellula(width / 2, height / 2, 80));
}

function draw() {
  // --- 0. GESTIONE SFONDO ---
  background(0); 

  if (bgMode === 'image' && bgImage) {
    image(bgImage, 0, 0, width, height);
  } else if (bgMode === 'video' && videoCapture) {
    push();
    translate(width, 0);
    scale(-1, 1);
    image(videoCapture, 0, 0, width, height);
    pop();
  } else {
    background(uiElements.bgPicker.color());
  }

  // --- 1. LOGICA CELLULE ---
  for (let i = cellule.length - 1; i >= 0; i--) {
    let c = cellule[i];
    
    if (c.toRemove) {
      cellule.splice(i, 1);
      continue;
    }

    if (!c.isPopping && c.hasSplit) {
      cellule.splice(i, 1); 
      let newR = c.r * 0.8;
      let dir = p5.Vector.fromAngle(c.angle);
      let separation = newR * 1.8; 
      let offset = p5.Vector.mult(dir, separation / 2);
      let c1 = new Cellula(c.pos.x - offset.x, c.pos.y - offset.y, newR);
      let c2 = new Cellula(c.pos.x + offset.x, c.pos.y + offset.y, newR);
      c1.vel.sub(p5.Vector.mult(dir, 4));
      c2.vel.add(p5.Vector.mult(dir, 4));
      cellule.push(c1);
      cellule.push(c2);
    }
  }

  // --- 2. FORZE INTERATTIVE ---
  if (mouseIsPressed) {
    let mousePos = createVector(mouseX, mouseY);
    for (let c of cellule) {
      let dir = p5.Vector.sub(c.pos, mousePos);
      let d = dir.mag();
      if (d > 0) {
        dir.normalize();
        let forceMagnitude = 600 / (d + 20); 
        c.vel.add(dir.mult(forceMagnitude));
      }
    }
  }

  // --- 3. AGGIORNAMENTO FISICA ---
  for (let c of cellule) c.update();

  let iterations = 10;
  for (let k = 0; k < iterations; k++) {
    for (let c of cellule) {
      if (!c.isPopping) {
        if (c.pos.x < c.r) c.pos.x = c.r;
        if (c.pos.x > width - c.r) c.pos.x = width - c.r;
        if (c.pos.y < c.r) c.pos.y = c.r;
        if (c.pos.y > height - c.r) c.pos.y = height - c.r;
      }
    }
    for (let i = 0; i < cellule.length; i++) {
      for (let j = i + 1; j < cellule.length; j++) {
        let c1 = cellule[i];
        let c2 = cellule[j];
        if (c1.isPopping || c2.isPopping) continue;
        let distVec = p5.Vector.sub(c1.pos, c2.pos);
        let d = distVec.mag();
        let minDist = c1.r + c2.r;
        if (d < minDist && d > 0) {
          let overlap = minDist - d;
          let dir = distVec.copy().normalize();
          let correction = dir.copy().mult(overlap * 0.5);
          c1.pos.add(correction);
          c2.pos.sub(correction);
          if (k === iterations - 1) {
            let relativeVelocity = p5.Vector.sub(c1.vel, c2.vel);
            let speed = relativeVelocity.dot(dir);
            if (speed < 0) {
              let restitution = 0.9;
              let impulse = dir.copy().mult(speed * -(1 + restitution) * 0.5);
              c1.vel.add(impulse);
              c2.vel.sub(impulse);
            }
          }
        }
      }
    }
  }

  // --- 4. DISEGNO ---
  for (let c of cellule) {
    if (!c.toRemove) c.show();
  }

  // --- 5. TUTORIAL TEXT ---
  if (showTutorial) {
    if (cellule.length > 1 || cellule.length === 0) {
       showTutorial = false;
    } else {
       let c = cellule[0];
       push();
       fill(255, 180); 
       noStroke();
       textAlign(CENTER, BOTTOM);
       textSize(14);
       textStyle(BOLD);
       text("Move the mouse on the bubble to divide it", c.pos.x, c.pos.y - c.r - 15);
       pop();
    }
  }

  // --- 6. AGGIORNAMENTO INFO UI ---
  if (uiElements.infoCount) {
    uiElements.infoCount.html("Cells: " + cellule.length);
  }
}

function mousePressed() {
  if (mouseX < 0) return;
  for (let i = cellule.length - 1; i >= 0; i--) {
    let c = cellule[i];
    if (!c.isPopping && dist(mouseX, mouseY, c.pos.x, c.pos.y) < c.r) {
      c.triggerPop();
      break; 
    }
  }
}

// --- CLASSE CELLULA ---
class Cellula {
  constructor(x, y, r) {
    this.pos = createVector(x, y);
    this.r = r;
    this.state = "normal";
    this.hasSplit = false;
    this.vel = p5.Vector.random2D().mult(1); 
    this.angle = random(TWO_PI);
    this.timer = 0;
    this.currentSep = 0;
    this.wobbleOffset = random(100);
    this.applyThemeColor();
    this.strokeW = map(r, 10, 80, 1.5, 3);
    this.isPopping = false;
    this.popAlpha = 255;
    this.toRemove = false;
  }

  applyThemeColor() {
    let t = themes[currentThemeKey];
    this.baseColor = color(random(t.r[0], t.r[1]), random(t.g[0], t.g[1]), random(t.b[0], t.b[1]));
  }

  triggerPop() {
    this.isPopping = true;
    this.vel.mult(0); 
    this.state = "popping"; 
  }

  update() {
    if (this.isPopping) {
      this.r += 3; this.popAlpha -= 20; 
      if (this.popAlpha <= 0) this.toRemove = true;
      return; 
    }
    let drift = p5.Vector.random2D().mult(0.08);
    this.vel.add(drift);
    this.pos.add(this.vel);
    this.vel.mult(0.99); 
    this.vel.limit(6);
    if (this.pos.x < this.r) this.vel.x = abs(this.vel.x);
    if (this.pos.x > width - this.r) this.vel.x = -abs(this.vel.x);
    if (this.pos.y < this.r) this.vel.y = abs(this.vel.y);
    if (this.pos.y > height - this.r) this.vel.y = -abs(this.vel.y);
    this.wobbleOffset += 0.05;

    if (this.state === "normal") {
      // FIX QUI: Aggiunto controllo maxCellule e abbassato il limite di raggio a 6
      if (cellule.length < maxCellule && 
          dist(mouseX, mouseY, this.pos.x, this.pos.y) < this.r + 10 && 
          this.r > 6) { 
        this.state = "splitting";
      }
    } else if (this.state === "splitting") {
      this.timer += 0.035;
      let progress = constrain(pow(this.timer * 1.2, 3), 0, 1);
      this.currentSep = progress * (this.r * 2.0);
      if (progress >= 1.0) this.hasSplit = true;
    }
  }

  show() {
    noFill();
    let currentColor = color(this.baseColor);
    currentColor.setAlpha(this.popAlpha);
    stroke(currentColor);
    strokeWeight(this.strokeW);

    if (this.isPopping || this.state === "normal" || this.state === "popping") {
      let liquidBase = this.isPopping ? 0 : sin(this.wobbleOffset) * (this.r * 0.05);
      let r_eff = this.r + liquidBase;
      ellipse(this.pos.x, this.pos.y, r_eff * 2, r_eff * 2 - liquidBase*2);
    } 
    else if (this.state === "splitting") {
      push();
      translate(this.pos.x, this.pos.y);
      rotate(this.angle);
      let sep = this.currentSep;
      let r_eff = this.r + sin(this.wobbleOffset) * (this.r * 0.05);
      let bridgeRatio = constrain(map(sep, 0, r_eff * 2.0, 0, PI/2), 0, PI/2);
      let bridgeFactor = cos(bridgeRatio); 
      let x1 = -sep / 2, x2 = sep / 2;
      beginShape();
      let p1_top = createVector(x1, -r_eff);
      let p1_bot = createVector(x1, r_eff);
      let p2_top = createVector(x2, -r_eff);
      let p2_bot = createVector(x2, r_eff);
      let pinch = sep * 0.6 * (1 - bridgeFactor*0.5);
      vertex(p1_top.x, p1_top.y);
      bezierVertex(x1 - r_eff*1.3, -r_eff, x1 - r_eff*1.3, r_eff, p1_bot.x, p1_bot.y);
      bezierVertex(x1 + pinch, r_eff * bridgeFactor, x2 - pinch, r_eff * bridgeFactor, p2_bot.x, p2_bot.y);
      bezierVertex(x2 + r_eff*1.3, r_eff, x2 + r_eff*1.3, -r_eff, p2_top.x, p2_top.y);
      bezierVertex(x2 - pinch, -r_eff * bridgeFactor, x1 + pinch, -r_eff * bridgeFactor, p1_top.x, p1_top.y);
      endShape(CLOSE);
      pop();
    }
  }
}

// --- GESTIONE SIDEBAR UI ---

function setupSidebar() {
  sidebar = createDiv();
  sidebar.style('position', 'fixed');
  sidebar.style('left', '0');
  sidebar.style('top', '0');
  sidebar.style('width', sidebarWidth + 'px');
  sidebar.style('height', '100%');
  sidebar.style('background-color', '#121212');
  sidebar.style('color', '#eee');
  sidebar.style('font-family', 'Helvetica, sans-serif');
  sidebar.style('display', 'flex');
  sidebar.style('flex-direction', 'column');
  sidebar.style('padding', '20px');
  sidebar.style('box-sizing', 'border-box');
  sidebar.style('border-right', '1px solid #333');
  sidebar.style('z-index', '1000');

  let labelStyle = 'font-size: 11px; color: #888; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 1px; margin-top: 20px;';
  let inputStyle = 'width: 100%; margin-bottom: 5px; background: #222; color: white; border: 1px solid #444; padding: 8px; border-radius: 4px;';
  let btnStyle = 'width: 100%; padding: 10px; background-color: #333; color: white; border: none; border-radius: 4px; cursor: pointer; text-align: center; margin-bottom: 10px; transition: background 0.2s;';

  // --- SEZIONE 1: STATISTICHE ---
  let lInfo = createDiv('INFO'); lInfo.style(labelStyle); lInfo.parent(sidebar);
  uiElements.infoCount = createDiv('Cells: 1');
  uiElements.infoCount.style('font-size: 14px; font-weight: bold; margin-bottom: 5px;');
  uiElements.infoCount.parent(sidebar);
  
  let instructions = createDiv('Click to Pop<br>Hold to Push');
  instructions.style('font-size: 12px; color: #aaa; line-height: 1.5;');
  instructions.parent(sidebar);

  // --- SEZIONE 2: TEMA ---
  let lTheme = createDiv('THEME'); lTheme.style(labelStyle); lTheme.parent(sidebar);
  
  uiElements.themeSelect = createSelect();
  uiElements.themeSelect.parent(sidebar);
  uiElements.themeSelect.style(inputStyle);
  for (let k in themes) uiElements.themeSelect.option(themes[k].name, k);
  uiElements.themeSelect.selected('blue');
  uiElements.themeSelect.changed(() => {
    currentThemeKey = uiElements.themeSelect.value();
    for (let c of cellule) c.applyThemeColor();
  });

  // --- SEZIONE 3: SFONDO ---
  let lBg = createDiv('BACKGROUND COLOR'); lBg.style(labelStyle); lBg.parent(sidebar);
  
  uiElements.bgPicker = createColorPicker('#141928');
  uiElements.bgPicker.parent(sidebar);
  uiElements.bgPicker.style('width: 100%; height: 35px; border: none; cursor: pointer; margin-bottom: 10px;');
  
  let lImg = createDiv('BACKGROUND IMAGE'); lImg.style(labelStyle); lImg.parent(sidebar);
  
  uiElements.fileInput = createFileInput(handleFile);
  uiElements.fileInput.parent(sidebar);
  uiElements.fileInput.style('color: #aaa; font-size: 11px; margin-bottom: 10px; width: 100%;');

  uiElements.resetBgButton = createButton('Reset Background');
  uiElements.resetBgButton.parent(sidebar);
  uiElements.resetBgButton.style(btnStyle);
  uiElements.resetBgButton.mousePressed(resetBackground);

  // --- SEZIONE 4: WEBCAM ---
  let lCam = createDiv('WEBCAM'); lCam.style(labelStyle); lCam.parent(sidebar);
  
  uiElements.camButton = createButton('OFF');
  uiElements.camButton.parent(sidebar);
  uiElements.camButton.style(btnStyle);
  uiElements.camButton.style('border', '1px solid #444');
  uiElements.camButton.mousePressed(toggleWebcam);

  // --- SEZIONE 5: AZIONI ---
  let lAct = createDiv('ACTIONS'); lAct.style(labelStyle); lAct.parent(sidebar);

  uiElements.saveButton = createButton('Record GIF (5s)');
  uiElements.saveButton.parent(sidebar);
  uiElements.saveButton.style(btnStyle);
  uiElements.saveButton.style('background-color', '#e53935'); 
  uiElements.saveButton.mousePressed(registraGIF);
}

// --- FUNZIONI LOGICHE UI ---

function handleFile(file) {
  if (file.type === 'image') {
    bgImage = createImg(file.data, '');
    bgImage.hide(); 
    bgMode = 'image';
    stopWebcamLogic(); 
  } else {
    bgImage = null;
  }
}

function toggleWebcam() {
  if (!videoCapture) {
    videoCapture = createCapture(VIDEO);
    videoCapture.size(width, height);
    videoCapture.hide();
    bgMode = 'video';
    
    uiElements.camButton.html("ON");
    uiElements.camButton.style('background-color', '#00e676');
    uiElements.camButton.style('color', '#000');
    uiElements.camButton.style('box-shadow', '0 0 10px rgba(0,230,118,0.4)');
  } else {
    stopWebcamLogic();
    bgMode = 'color';
  }
}

function stopWebcamLogic() {
  if (videoCapture) {
    let stream = videoCapture.elt.srcObject;
    if (stream) {
      let tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
    }
    videoCapture.remove(); 
    videoCapture = null;
    
    uiElements.camButton.html("OFF");
    uiElements.camButton.style('background-color', '#333');
    uiElements.camButton.style('color', '#fff');
    uiElements.camButton.style('box-shadow', 'none');
  }
}

function resetBackground() {
  bgMode = 'color';
  bgImage = null;
  stopWebcamLogic(); 
}

function registraGIF() {
  isRecording = true;
  uiElements.saveButton.html("Recording..."); 
  uiElements.saveButton.style('opacity', '0.6');
  
  saveGif('mitosi', 5, { units: 'seconds', pixelDensity: 1 });
  
  setTimeout(() => {
    uiElements.saveButton.html("Record GIF (5s)"); 
    uiElements.saveButton.style('opacity', '1.0');
    isRecording = false;
  }, 5500);
}

function windowResized() {
  resizeCanvas(windowWidth - sidebarWidth, windowHeight);
}

