// WUP 25-26
// Chiara Cherubin

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const FPS = 50; 

// Global Settings
let gifDuration = 3; 
let mode = 'START';
let exporter; 
let buffer; 
let fileInput;
let uiButtons = []; 
let stars = []; 

// Assets (PUNK STYLE)
const hats = ['NONE', 'CAP', 'CROWN', 'WIZARD', 'PHONES'];
const hairs = ['LIBERTY SPIKES', 'CHARGED HAWK', 'CRUST PUNK', 'DEATHHAWK']; 
const mouths = ['SMILE', 'NEUTRAL', 'O-FACE', 'GRIN'];
// Nuovi stili di vestiti
const shirtStyles = ['TEE', 'SUIT', 'HOODIE', 'PUNK VEST'];

const colors = ['#2b2b2b', '#f5d68d', '#e74c3c', '#3498db', '#9b59b6', '#ffffff']; 
const eyeColors = ['#634021', '#2b82d9', '#2ecc71'];

// State
let userBgImage = null;

let avatar = { 
  hat: 0, hair: 0, hairCol: 2, 
  shirtCol: 0, shirtStyle: 0, // Nuovo parametro vestiti
  eyeCol: 0, mouth: 1, 
  action: 'IDLE', 
  x: 0, y: 0, vy: 0, isJumping: false
};

function setup() {
  pixelDensity(1); 
  createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
  
  buffer = createGraphics(CANVAS_WIDTH, CANVAS_HEIGHT);
  
  exporter = new GifExporter();
  
  fileInput = createFileInput(handleFile);
  fileInput.position(-1000, -1000); 

  textFont('Courier New');
  
  // Genera stelle statiche
  for(let i=0; i<100; i++) stars.push({ x: random(width), y: random(height), s: random(1,3) });
  
  // --- UI BUTTONS ---
  let x = 20; let y = 60;
  
  // HEAD
  uiButtons.push(new Button(x, y, 100, 30, "HAIR STYLE", () => avatar.hair = (avatar.hair + 1) % hairs.length));
  uiButtons.push(new Button(x+110, y, 100, 30, "HAT", () => avatar.hat = (avatar.hat + 1) % hats.length));
  y += 40;
  uiButtons.push(new Button(x, y, 100, 30, "HAIR COL", () => avatar.hairCol = (avatar.hairCol + 1) % colors.length));
  uiButtons.push(new Button(x+110, y, 100, 30, "EYES", () => avatar.eyeCol = (avatar.eyeCol + 1) % eyeColors.length));
  
  // BODY (Nuovi pulsanti vestiti)
  y += 40;
  uiButtons.push(new Button(x, y, 100, 30, "OUTFIT", () => avatar.shirtStyle = (avatar.shirtStyle + 1) % shirtStyles.length));
  uiButtons.push(new Button(x+110, y, 100, 30, "SHIRT COL", () => avatar.shirtCol = (avatar.shirtCol + 1) % colors.length));
  
  // BG
  y += 60; 
  uiButtons.push(new Button(x, y, 210, 30, "UPLOAD BG IMG", () => fileInput.elt.click()));
  
  // ACTIONS
  y += 60;
  uiButtons.push(new Button(x, y, 65, 30, "WAVE", () => toggleAction('WAVE')));
  uiButtons.push(new Button(x+72, y, 65, 30, "DANCE", () => toggleAction('DANCE')));
  uiButtons.push(new Button(x+144, y, 65, 30, "FALL", () => toggleAction('FALL'))); // Changed SLEEP to FALL
  y += 40;
  uiButtons.push(new Button(x, y, 210, 40, "!!! JUMP !!!", () => { avatar.isJumping = true; avatar.vy = -20; avatar.action = 'IDLE'; }));
  
  // NOTE: Ho rimosso i pulsanti freccia UI perché ora usiamo la tastiera!
  
  // EXPORT BUTTON
  uiButtons.push(new Button(x, height - 60, 210, 40, "RECORD GIF (FAST)", () => exporter.start(3, buffer)));
}

function handleFile(file) { if (file.type === 'image') userBgImage = loadImage(file.data); }
function toggleAction(act) { if (avatar.action === act) avatar.action = 'IDLE'; else avatar.action = act; }

function draw() {
  // Input Tastiera
  handleInput();
  updatePhysics();

  if (mode === 'START') {
    drawStartScreen();
  } else {
    // 1. Disegna sul Buffer (quello che diventa GIF)
    drawBuffer();
    
    // 2. Disegna sullo schermo principale
    background(20);
    image(buffer, 0, 0); 
    
    // Sidebar Area
    fill(30); noStroke(); rect(0, 0, 250, height); 
    stroke(100); line(250, 0, 250, height);
    fill(0, 255, 255); textSize(20); textAlign(LEFT); text("CONTROLS", 20, 35);
    
    // Draw Buttons
    for (let btn of uiButtons) btn.display();
    
    // Istruzioni Tasti
    fill(150); textSize(12); textAlign(CENTER);
    text("USE ARROW KEYS", 125, 450);
    text("TO MOVE", 125, 465);
    
    // Recording Logic
    if (exporter.isRecording) { 
      exporter.capture(buffer.elt); 
      drawRecordingLabel(); 
    }
  }
}

// --- NUOVO SISTEMA MOVIMENTO TASTIERA ---
function handleInput() {
  if (mode !== 'DESIGN') return;
  
  // Velocità di movimento
  let speed = 5;
  if (keyIsDown(LEFT_ARROW)) avatar.x -= speed;
  if (keyIsDown(RIGHT_ARROW)) avatar.x += speed;
  if (keyIsDown(UP_ARROW)) avatar.y -= speed;
  if (keyIsDown(DOWN_ARROW)) avatar.y += speed;
}

function updatePhysics() {
  if (avatar.isJumping) {
    avatar.y += avatar.vy; avatar.vy += 2;
    if (avatar.y >= 0) { avatar.y = 0; avatar.vy = 0; avatar.isJumping = false; }
  }
}

// --- CLEAN DRAWING (THE GIF) ---
function drawBuffer() {
  let pg = buffer;
  pg.reset();
  
  // A. BACKGROUND (MIGLIORATO - SYNTHWAVE STYLE)
  if (userBgImage) { 
    pg.image(userBgImage, 0, 0, pg.width, pg.height); 
  } else { 
    // Sfondo stile "Start Screen"
    pg.background(10, 5, 20); // Blu scuro/viola
    
    // Stelle
    pg.noStroke(); pg.fill(255);
    for(let s of stars) { 
        pg.ellipse(s.x, s.y, s.s, s.s); 
    }
    
    // Griglia Retro
    pg.stroke(0, 255, 255, 40); // Ciano trasparente
    pg.strokeWeight(1);
    let horizon = pg.height/2 + 50;
    
    // Linee prospettiche (dal centro verso il basso)
    for(let x = -pg.width; x <= pg.width*2; x+=80) {
        pg.line(x, pg.height, pg.width/2, horizon); 
    }
    // Linee orizzontali (che si muovono per effetto 3D)
    let offset = (frameCount * 1) % 40;
    for(let y = horizon; y < pg.height; y+=40) {
        // Effetto movimento: y + offset
        // (disegniamo solo se dentro il canvas)
        let drawY = y + offset;
        if(drawY < pg.height) pg.line(0, drawY, pg.width, drawY);
    }
  }

  // B. AVATAR ANIMATION MATH
  let bounce = 0; let rArm = -0.5, lArm = 0.5; let rot = 0;
  
  if (avatar.action === 'WAVE') { lArm = sin(frameCount * 0.4) * 1.5 - 1.0; } 
  else if (avatar.action === 'DANCE') { bounce = abs(sin(frameCount * 0.6) * 15); lArm = sin(frameCount * 0.8) * 2.5; rArm = cos(frameCount * 0.8) * 2.5; } 
  else if (avatar.action === 'FALL') { 
      // Animazione caduta: ruota di 90 gradi e rimbalza un po' a terra
      rot = HALF_PI; // 90 gradi
      let fallBounce = abs(sin(frameCount * 0.2)) * 5; 
      pg.translate(0, 60 - fallBounce); // Sposta in basso per toccare terra
  }
  
  if (avatar.isJumping) { lArm = -2.5; rArm = -2.5; } 
  else if (avatar.action === 'IDLE') { bounce = sin(frameCount * 0.2) * 5; }

  let cx = pg.width/2 + avatar.x; let cy = pg.height/2 + 80 + avatar.y;
  let hy = -110 + bounce;

  pg.push(); pg.translate(cx, cy); pg.rotate(rot);

  // C. AVATAR DRAWING
  drawHair(pg, hy, "BACK");
  
  // --- BODY & OUTFIT ---
  pg.noStroke(); 
  let sStyle = shirtStyles[avatar.shirtStyle];
  
  // Braccia (dietro)
  pg.stroke(255); pg.strokeWeight(8);
  // Se ha il gilet o suit, le maniche sono diverse, ma teniamo semplice per ora
  pg.push(); pg.translate(-25, -70+bounce); pg.rotate(lArm); pg.line(0,0, -25, 20); pg.pop();
  pg.push(); pg.translate(25, -70+bounce); pg.rotate(rArm); pg.line(0,0, 25, 20); pg.pop();
  
  // Corpo / Maglietta
  pg.noStroke();
  pg.fill(colors[avatar.shirtCol]); 
  pg.rectMode(CENTER);
  
  // Base torso
  pg.rect(0, -45 + bounce, 60, 80, 10);
  
  // Dettagli Outfit
  if (sStyle === 'HOODIE') {
      pg.fill(0,0,0, 50); // Tasca
      pg.rect(0, -20 + bounce, 40, 20, 5);
      pg.stroke(0,0,0, 50); pg.strokeWeight(2); // Lacci cappuccio
      pg.line(-10, -80+bounce, -10, -50+bounce);
      pg.line(10, -80+bounce, 10, -50+bounce);
  } else if (sStyle === 'SUIT') {
      pg.fill(255); // Camicia bianca sotto
      pg.triangle(-10, -85+bounce, 10, -85+bounce, 0, -60+bounce);
      pg.stroke(0); pg.strokeWeight(3); // Cravatta/Linea
      pg.line(0, -85+bounce, 0, -45+bounce);
  } else if (sStyle === 'PUNK VEST') {
      pg.fill(20); // Gilet scuro sopra il colore base
      pg.rect(-20, -45+bounce, 20, 80);
      pg.rect(20, -45+bounce, 20, 80);
      // Borchie
      pg.fill(200); pg.noStroke();
      pg.ellipse(-20, -70+bounce, 5, 5);
      pg.ellipse(20, -70+bounce, 5, 5);
  }
  
  // Gambe
  pg.stroke(255); pg.strokeWeight(8);
  pg.line(-15, -5+bounce, -20, 45+bounce); pg.line(15, -5+bounce, 20, 45+bounce);

  // HEAD
  pg.noStroke(); pg.fill(255, 220, 200); pg.ellipse(0, hy, 60, 65); 
  pg.fill(255); pg.ellipse(-12, hy-5, 12, 12); pg.ellipse(12, hy-5, 12, 12);
  pg.fill(eyeColors[avatar.eyeCol]); pg.ellipse(-12, hy-5, 5, 5); pg.ellipse(12, hy-5, 5, 5);
  
  // MOUTH
  pg.stroke(0); pg.strokeWeight(2); pg.noFill(); 
  if (avatar.mouth === 0) pg.arc(0, hy+15, 20, 10, 0, PI);
  if (avatar.mouth === 1) pg.line(-5, hy+15, 5, hy+15);
  if (avatar.mouth === 2) pg.ellipse(0, hy+18, 10, 15);
  if (avatar.mouth === 3) { pg.line(-8, hy+12, 8, hy+18); pg.line(-8, hy+18, 8, hy+12); }

  drawHair(pg, hy, "FRONT");
  drawHat(pg, hy);
  pg.pop();

  // D. OVERLAYS (Scanlines stile vecchio monitor)
  pg.noFill(); pg.stroke(0); pg.strokeWeight(10); pg.rect(0, 0, pg.width, pg.height); 
  pg.stroke(255, 255, 255, 15); pg.strokeWeight(1); 
  for(let i=0; i<pg.height; i+=4) pg.line(0, i, pg.width, i); 
}

// --- PUNK HAIR ENGINE ---
function drawHair(pg, y, layer) {
  let h = hairs[avatar.hair]; let col = colors[avatar.hairCol]; pg.fill(col); pg.noStroke();

  if (layer === "BACK") {
     if (h === 'CHARGED HAWK') { pg.beginShape(); pg.vertex(-15, y); pg.vertex(-30, y-70); pg.vertex(0, y-95); pg.vertex(30, y-70); pg.vertex(15, y); pg.endShape(CLOSE); }
     if (h === 'DEATHHAWK') { pg.beginShape(); pg.vertex(-25, y+10); pg.vertex(-40, y-50); pg.vertex(0, y-70); pg.vertex(40, y-50); pg.vertex(25, y+10); pg.endShape(CLOSE); pg.beginShape(); pg.vertex(-15, y+20); pg.vertex(-20, y+80); pg.vertex(0, y+100); pg.vertex(20, y+80); pg.vertex(15, y+20); pg.endShape(CLOSE); }
  }

  if (layer === "FRONT") {
    if (h === 'LIBERTY SPIKES') {
      pg.fill(0,0,0,50); pg.arc(0, y-5, 60, 55, PI, TWO_PI); pg.fill(col);
      for(let i=-40; i<=40; i+=20) { pg.beginShape(); pg.vertex(i-8, y-25); pg.vertex(i + random(-2,2), y-85 - abs(i)*0.8); pg.vertex(i+8, y-25); pg.endShape(CLOSE); }
    }
    if (h === 'CHARGED HAWK') {
      pg.fill(0,0,0,50); pg.arc(0, y-8, 58, 50, PI, TWO_PI); pg.fill(col); pg.rect(-12, y-35, 24, 30);
      pg.beginShape(); pg.vertex(-12, y-30); pg.vertex(-5, y-50); pg.vertex(5, y-50); pg.vertex(12, y-30); pg.endShape(CLOSE);
    }
    if (h === 'CRUST PUNK') {
      pg.push(); pg.translate(0, y-15);
      for(let i=-35; i<=35; i+=10) { let h = random(30, 50); let tilt = random(-5, 5); pg.beginShape(); pg.vertex(i-6, 5); pg.vertex(i+tilt, -h); pg.vertex(i+6, 5); pg.endShape(CLOSE); pg.beginShape(); pg.vertex(i, 5); pg.vertex(i+tilt+3, -h*0.6); pg.vertex(i+8, 5); pg.endShape(CLOSE); }
      pg.pop();
    }
    if (h === 'DEATHHAWK') { pg.beginShape(); pg.vertex(-25, y-20); pg.vertex(-35, y-45); pg.vertex(0, y-60); pg.vertex(35, y-45); pg.vertex(25, y-20); pg.endShape(CLOSE); }
  }
}

function drawHat(pg, y) {
  let hy = y - 35; let hType = hats[avatar.hat]; pg.push();
  if (hType === 'CAP') { pg.fill(200, 50, 50); pg.noStroke(); pg.arc(0, hy+5, 55, 45, PI, TWO_PI); pg.fill(180, 40, 40); pg.rect(0, hy+5, 70, 10, 5); pg.fill(200, 50, 50); pg.ellipse(0, hy-18, 8, 6); }
  else if (hType === 'CROWN') { pg.fill(255, 215, 0); pg.stroke(200, 170, 0); pg.strokeWeight(2); pg.rect(0, hy, 60, 15, 2); pg.beginShape(); pg.vertex(-30, hy-7); pg.vertex(-20, hy-35); pg.vertex(-10, hy-7); pg.vertex(0, hy-45); pg.vertex(10, hy-7); pg.vertex(20, hy-35); pg.vertex(30, hy-7); pg.endShape(CLOSE); pg.noStroke(); pg.fill(255,0,0); pg.ellipse(0, hy-25, 8, 8); pg.fill(0,255,0); pg.ellipse(-20, hy-20, 6, 6); pg.fill(0,0,255); pg.ellipse(20, hy-20, 6, 6); }
  else if (hType === 'WIZARD') { pg.fill(40, 40, 120); pg.noStroke(); pg.ellipse(0, hy, 80, 20); pg.beginShape(); pg.vertex(-25, hy); pg.vertex(15, hy-75); pg.vertex(25, hy); pg.endShape(CLOSE); pg.fill(255, 255, 100); pg.push(); pg.translate(0, hy-45); pg.rotate(frameCount*0.05); drawStar(pg,0,0,6,14,5); pg.pop(); }
  else if (hType === 'PHONES') { pg.stroke(30); pg.strokeWeight(8); pg.noFill(); pg.arc(0, hy+20, 75, 75, PI, TWO_PI); pg.noStroke(); pg.fill(50); pg.rect(-40, hy+25, 20, 35, 5); pg.rect(40, hy+25, 20, 35, 5); pg.fill(0, 255, 255); pg.ellipse(-40, hy+25, 10, 25); pg.ellipse(40, hy+25, 10, 25); }
  pg.pop();
}

function drawStar(pg, x, y, r1, r2, npoints) { let angle = TWO_PI / npoints; let halfAngle = angle / 2.0; pg.beginShape(); for (let a = 0; a < TWO_PI; a += angle) { let sx = x + cos(a) * r2; let sy = y + sin(a) * r2; pg.vertex(sx, sy); sx = x + cos(a + halfAngle) * r1; sy = y + sin(a + halfAngle) * r1; pg.vertex(sx, sy); } pg.endShape(CLOSE); }

class Button { constructor(x, y, w, h, label, callback) { this.x = x; this.y = y; this.w = w; this.h = h; this.label = label; this.callback = callback; } display() { if (this.isMouseOver()) fill(60, 60, 80); else fill(40, 40, 50); if ((this.label === "DANCE" && avatar.action === 'DANCE') || (this.label === "WAVE" && avatar.action === 'WAVE') || (this.label === "FALL" && avatar.action === 'FALL')) fill(0, 150, 0); stroke(100); strokeWeight(1); rect(this.x, this.y, this.w, this.h, 5); fill(255); noStroke(); textAlign(CENTER, CENTER); textSize(10); text(this.label, this.x+this.w/2, this.y+this.h/2); } isMouseOver() { return mouseX > this.x && mouseX < this.x + this.w && mouseY > this.y && mouseY < this.y + this.h; } click() { if (this.isMouseOver()) this.callback(); } }
function mousePressed() { if (mode === 'START') { mode = 'DESIGN'; return; } for (let btn of uiButtons) btn.click(); }
function drawStartScreen() { background(10, 5, 20); noStroke(); fill(255); for(let s of stars) { ellipse(s.x, s.y, s.s, s.s); s.x -= 0.5; if(s.x < 0) s.x = width; } stroke(0, 255, 255, 50); strokeWeight(1); let horizon = height/2 + 50; for(let x = 0; x <= width; x+=80) line(x, height, width/2, horizon); for(let y = horizon; y < height; y+=30) line(0, y, width, y); let s = 1 + sin(frameCount * 0.05) * 0.05; push(); translate(width/2, height/2 - 50); scale(s); textAlign(CENTER, CENTER); fill(0, 255, 255, 50); textSize(60); text("AVATAR STUDIO", 4, 4); fill(255, 0, 255, 50); textSize(60); text("AVATAR STUDIO", -4, -4); fill(255); textStyle(BOLD); textSize(60); text("AVATAR STUDIO", 0, 0); pop(); if(frameCount % 60 < 30) { fill(0, 255, 0); textSize(20); text("> PRESS CLICK TO START <", width/2, height/2 + 60); } }
function drawRecordingLabel() { fill(255, 0, 0); rect(width-150, 20, 130, 40); fill(255); textAlign(CENTER, CENTER); text("RECORDING...", width-85, 40); }

class GifExporter { 
  constructor() { 
    this.gif = null; 
    this.isRecording = false; 
    this.recordedFrames = 0; 
    this.totalFrames = 0; 
    this.workerBlobURL = null; 
    this.initWorker(); 
  } 
  
  async initWorker() { 
    try { 
      const response = await fetch('https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.worker.js'); 
      const text = await response.text(); 
      const blob = new Blob([text], { type: 'application/javascript' }); 
      this.workerBlobURL = URL.createObjectURL(blob); 
    } catch (e) { 
      console.error("GIF Worker Error:", e); 
    }
  } 
  
  start(duration, canvasObj) { 
    if (!this.workerBlobURL) { alert("Engine loading... wait 2s"); return; } 
    this.totalFrames = duration * FPS; 
    
    // Create the GIF engine
    this.gif = new window.GIF({ 
      workers: 3, 
      quality: 15, 
      width: canvasObj.width, 
      height: canvasObj.height, 
      workerScript: this.workerBlobURL 
    }); 
    
    this.gif.on('finished', (blob) => { 
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'punk_avatar.gif'; 
      document.body.appendChild(a);
      a.click();
      
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 100);
    }); 
    
    this.isRecording = true; 
    this.recordedFrames = 0; 
  } 
  
  capture(elt) { 
    if (this.isRecording && this.gif) { 
      this.gif.addFrame(elt, {copy: true, delay: 20}); 
      this.recordedFrames++; 
      if (this.recordedFrames >= this.totalFrames) { 
        this.isRecording = false; 
        console.log("Rendering GIF... Please wait."); 
        this.gif.render(); 
      }
    }
  }
}