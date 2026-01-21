//WUP 2025/26
//let isDrawing = false;
let lastX, lastY;

// --- PARAMETRI ---
let brushSize = 25;
let brushOpacity = 200; // 0-255
let brushColor;
let currentTool = 'pencil'; // pencil, pen, marker, spray, watercolor, oil, eraser
let mirrorMode = false;
let mirrorCount = 6;

// --- SISTEMA FISICO & LAYER ---
let drawingLayer;
let history = [];
let drips = []; // Array per gestire le colature di vernice
let sprayAccumulator = 0; // Per calcolare quanto insisti su un punto

// Texture generate proceduralmente
let texturePencil;
let textureSpray;

const SIDEBAR_WIDTH = 280; 

function setup() {
  pixelDensity(1); 
  
  // Setup Canvas
  canvas = createCanvas(windowWidth - SIDEBAR_WIDTH, windowHeight);
  canvas.position(SIDEBAR_WIDTH, 0);
  canvas.style('display', 'block');
  
  // Layer Grafico (Buffer)
  drawingLayer = createGraphics(width, height);
  drawingLayer.clear();
  drawingLayer.pixelDensity(1);
  
  brushColor = color(20, 20, 20); // Nero "grafite" iniziale
  
  // Generiamo le texture per performance
  generateTextures();
  
  background(250, 250, 250); // Carta bianca pulita
  createProUI();
}

function generateTextures() {
  // Texture Matita
  texturePencil = createGraphics(100, 100);
  texturePencil.noStroke();
  for(let i=0; i<1500; i++){
    let x = random(100); let y = random(100);
    let d = dist(x,y,50,50);
    if(d<45) {
      texturePencil.fill(0, random(5, 30)); // Molto leggero
      texturePencil.circle(x, y, 1.5);
    }
  }
  
  // Texture Spray (Base)
  textureSpray = createGraphics(100, 100);
  textureSpray.noStroke();
  for(let i=0; i<80; i++){
    let r = random(50);
    let a = random(TWO_PI);
    textureSpray.fill(255, 100); 
    textureSpray.circle(50 + r*cos(a), 50 + r*sin(a), random(1, 4));
  }
}

function draw() {
  background(250, 250, 250);
  image(drawingLayer, 0, 0);
  
  // --- GESTIONE FISICA COLATURE (DRIPS) ---
  // Questo loop gira sempre, creando l'animazione della vernice che cola
  if (drips.length > 0) {
    drawingLayer.push();
    drawingLayer.noStroke();
    for (let i = drips.length - 1; i >= 0; i--) {
      let d = drips[i];
      
      // La colatura scende
      d.y += d.speed;
      // La colatura si restringe man mano che scende
      d.size *= 0.96; 
      
      drawingLayer.fill(d.c);
      drawingLayer.circle(d.x, d.y, d.size);
      
      // Se è troppo piccola, la rimuoviamo dalla memoria
      if (d.size < 0.5) {
        drips.splice(i, 1);
      }
    }
    drawingLayer.pop();
  }

  // --- CURSORE PRO ---
  drawCursor();
  
  // Se lo spray è attivo e il mouse è fermo ma premuto -> accumula vernice
  if (isDrawing && currentTool === 'spray') {
     // Se ti muovi poco, accumuli vernice
     if (dist(mouseX, mouseY, lastX, lastY) < 2) {
        sprayAccumulator += 1;
        if(sprayAccumulator > 10) { // Soglia per far partire la colatura
            addDrip(mouseX, mouseY, brushSize, brushColor);
            sprayAccumulator = 0; // Reset
        }
     } else {
        sprayAccumulator = 0;
     }
  }
}

function drawCursor() {
  if (mouseX <= 0 || mouseX >= width || mouseY <= 0 || mouseY >= height) return;
  
  push();
  translate(mouseX, mouseY);
  noFill();
  stroke(100, 150);
  strokeWeight(1);
  
  if (currentTool === 'marker') {
    rectMode(CENTER);
    rotate(PI/4);
    rect(0,0, brushSize, brushSize/4);
  } else {
    circle(0, 0, brushSize);
  }
  
  if (mirrorMode) {
    pop(); push(); translate(width/2, height/2);
    stroke(0, 100, 255, 50); // Guide blu professionali
    for(let i=0; i<mirrorCount; i++){
      rotate(TWO_PI/mirrorCount);
      line(0, 0, width, 0);
    }
  }
  pop();
}

// --- INPUT ---

function mousePressed() {
  if (mouseX < 0 || mouseX > width || mouseY < 0 || mouseY > height) return;
  isDrawing = true;
  lastX = mouseX;
  lastY = mouseY;
  saveHistory();
  
  // Disegno immediato al click (dot)
  handleDrawing(mouseX, mouseY, mouseX, mouseY);
}

function mouseDragged() {
  if (!isDrawing) return;
  
  let steps = dist(lastX, lastY, mouseX, mouseY);
  if (steps === 0) return;

  // Ottimizzazione densità in base al pennello
  let density = 2;
  if (currentTool === 'spray') density = 5;
  if (currentTool === 'watercolor') density = 4;
  
  for (let i = 0; i <= steps; i += density) {
    let x = lerp(lastX, mouseX, i / steps);
    let y = lerp(lastY, mouseY, i / steps);
    handleDrawing(x, y, lastX, lastY);
  }
  
  lastX = mouseX;
  lastY = mouseY;
}

function mouseReleased() { 
  isDrawing = false; 
  sprayAccumulator = 0;
}

// --- LOGICA DI DISEGNO AVANZATA ---

function handleDrawing(x, y, px, py) {
  let cx = width / 2;
  let cy = height / 2;

  if (mirrorMode) {
    for (let i = 0; i < mirrorCount; i++) {
      let angle = TWO_PI / mirrorCount * i;
      let dx = x - cx; let dy = y - cy;
      let rx = dx * cos(angle) - dy * sin(angle);
      let ry = dx * sin(angle) + dy * cos(angle);
      
      // Calcolo rotazione per pennelli orientati (Marker)
      let pdx = px - cx; let pdy = py - cy;
      let prx = pdx * cos(angle) - pdy * sin(angle);
      let pry = pdx * sin(angle) + pdy * cos(angle);

      drawBrush(cx + rx, cy + ry, cx + prx, cy + pry);
    }
  } else {
    drawBrush(x, y, px, py);
  }
}

function drawBrush(x, y, px, py) {
  drawingLayer.push();
  
  let r = red(brushColor);
  let g = green(brushColor);
  let b = blue(brushColor);
  let a = map(brushOpacity, 0, 255, 0, 255); // Alpha

  // 1. MATITA (Grafite)
  if (currentTool === 'pencil') {
    drawingLayer.imageMode(CENTER);
    drawingLayer.tint(r, g, b, a * 0.8); // Leggera trasparenza
    drawingLayer.push();
    drawingLayer.translate(x, y);
    drawingLayer.rotate(random(TWO_PI));
    drawingLayer.image(texturePencil, 0, 0, brushSize, brushSize);
    drawingLayer.pop();
  }
  
  // 2. PENNA (Inchiostro Gel)
  else if (currentTool === 'pen') {
    drawingLayer.noStroke();
    drawingLayer.fill(r, g, b, a);
    drawingLayer.circle(x, y, brushSize * 0.5); // Tratto fine e deciso
  }
  
  // 3. PENNARELLO (Marker)
  else if (currentTool === 'marker') {
    drawingLayer.noStroke();
    // Blend multiply per sovrapposizione realistica
    drawingLayer.blendMode(MULTIPLY); 
    drawingLayer.fill(r, g, b, 150); // Semitrasparente fisso
    drawingLayer.push();
    drawingLayer.translate(x, y);
    // Orientamento basato sul movimento + 45 gradi
    let angle = atan2(y - py, x - px);
    drawingLayer.rotate(angle + PI/4);
    drawingLayer.rectMode(CENTER);
    drawingLayer.rect(0, 0, brushSize, brushSize/3);
    drawingLayer.pop();
    drawingLayer.blendMode(BLEND);
  }
  
  // 4. SPRAY (Graffiti + Drip)
  else if (currentTool === 'spray') {
    drawingLayer.imageMode(CENTER);
    drawingLayer.tint(r, g, b, a);
    drawingLayer.push();
    drawingLayer.translate(x, y);
    drawingLayer.rotate(random(TWO_PI));
    drawingLayer.image(textureSpray, 0, 0, brushSize*1.5, brushSize*1.5);
    drawingLayer.pop();
    
    // Chance casuale di colatura mentre muovi
    if (random(1) < 0.02) { 
        addDrip(x, y, brushSize, brushColor);
    }
  }
  
  // 5. ACQUERELLO (Watercolor)
  else if (currentTool === 'watercolor') {
    drawingLayer.noStroke();
    drawingLayer.blendMode(MULTIPLY); // Fondamentale per acquerello
    // Disegna più cerchi sfumati per effetto bagnato
    for(let i=0; i<3; i++){
       let offX = random(-brushSize/2, brushSize/2);
       let offY = random(-brushSize/2, brushSize/2);
       drawingLayer.fill(r, g, b, 15); // Molto trasparente
       drawingLayer.circle(x + offX, y + offY, brushSize * random(0.8, 1.5));
    }
    drawingLayer.blendMode(BLEND);
  }
  
  // 6. OLIO (Oil Paint)
  else if (currentTool === 'oil') {
    drawingLayer.noStroke();
    // Colore pieno, leggermente più chiaro al centro per volume
    drawingLayer.fill(r, g, b, 255);
    drawingLayer.circle(x, y, brushSize);
    drawingLayer.fill(255, 30); // Highlight texture
    drawingLayer.circle(x + 2, y - 2, brushSize * 0.7);
  }
  
  // GOMMA
  else if (currentTool === 'eraser') {
    drawingLayer.erase();
    drawingLayer.circle(x, y, brushSize);
    drawingLayer.noErase();
  }
  
  drawingLayer.pop();
}

// Funzione helper per creare una goccia
function addDrip(x, y, size, col) {
  drips.push({
    x: x + random(-5, 5),
    y: y,
    size: random(size * 0.2, size * 0.5),
    speed: random(1, 3), // Velocità discesa
    c: col
  });
}

// --- INTERFACCIA UTENTE PROFESSIONALE ---

function createProUI() {
  let sidebar = createDiv();
  sidebar.class('sidebar');
  sidebar.position(0, 0);
  sidebar.size(SIDEBAR_WIDTH, windowHeight);

  // SVG ICONS (Inserite come stringhe per pulizia)
  const icons = {
    pencil: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>`,
    pen: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19l7-7 3 3-7 7-3-3z"></path><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path></svg>`,
    marker: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>`,
    spray: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3h18v18H3z"></path><circle cx="8.5" cy="8.5" r="1.5"></circle><circle cx="15.5" cy="8.5" r="1.5"></circle></svg>`, // Icona stilizzata
    water: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path></svg>`,
    oil: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path></svg>`,
    eraser: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 20H7L3 16C2 15 2 13 3 12L13 2L22 11L20 20Z"></path></svg>`
  };

  sidebar.html(`
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
      
      .sidebar {
        background-color: #121212; /* Nero profondo */
        color: #e0e0e0;
        font-family: 'Inter', sans-serif;
        display: flex; flex-direction: column;
        border-right: 1px solid #2a2a2a;
        padding: 0; user-select: none;
      }
      
      .header { padding: 20px; border-bottom: 1px solid #2a2a2a; text-align: center; }
      .header h2 { font-size: 14px; letter-spacing: 1px; margin: 0; font-weight: 600; color: #fff; text-transform: uppercase; }
      
      .section { padding: 20px; border-bottom: 1px solid #2a2a2a; }
      .label { font-size: 10px; font-weight: 600; color: #666; text-transform: uppercase; margin-bottom: 12px; display: block; letter-spacing: 0.5px; }
      
      /* TOOL GRID */
      .grid-tools { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
      
      .btn-tool {
        background: #1e1e1e; border: 1px solid #333;
        color: #aaa; border-radius: 6px; padding: 12px 10px;
        cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 8px;
        transition: all 0.2s ease;
      }
      .btn-tool svg { opacity: 0.7; }
      .btn-tool span { font-size: 11px; font-weight: 500; }
      
      .btn-tool:hover { background: #252525; border-color: #444; color: #fff; }
      .btn-tool.active { 
        background: #2a2a2a; border-color: #00bcd4; /* Accent Cyan */
        color: #fff; box-shadow: 0 2px 8px rgba(0, 188, 212, 0.15);
      }
      .btn-tool.active svg { stroke: #00bcd4; opacity: 1; }

      /* CONTROLS */
      input[type="range"] {
        width: 100%; -webkit-appearance: none; background: transparent; margin: 10px 0;
      }
      input[type=range]::-webkit-slider-runnable-track {
        width: 100%; height: 4px; background: #333; border-radius: 2px;
      }
      input[type=range]::-webkit-slider-thumb {
        -webkit-appearance: none; height: 16px; width: 16px; border-radius: 50%;
        background: #fff; margin-top: -6px; cursor: pointer; border: 2px solid #121212;
      }
      .val-disp { float: right; color: #00bcd4; font-size: 11px; font-weight: 600; }

      /* COLOR PICKER CUSTOM */
      .color-picker-wrap {
        height: 36px; border-radius: 6px; overflow: hidden; position: relative; border: 1px solid #333;
      }
      input[type="color"] { position: absolute; top: -10px; left: -10px; width: 120%; height: 200%; cursor: pointer; }

      /* ACTIONS */
      .btn-primary {
        background: #fff; color: #000; width: 100%; padding: 14px;
        border: none; border-radius: 6px; font-weight: 600; font-size: 13px; cursor: pointer;
        margin-top: 10px; transition: transform 0.1s;
      }
      .btn-primary:active { transform: scale(0.98); }
      
      .row-actions { display: flex; gap: 10px; margin-top: auto; padding: 20px; border-top: 1px solid #2a2a2a; }
      .btn-sec { flex: 1; background: #1e1e1e; color: #ccc; border: 1px solid #333; padding: 10px; border-radius: 6px; cursor: pointer; font-size: 12px; }
      .btn-sec:hover { background: #252525; color: #fff; }

    </style>

    <div class="header">
      <h2>Canvas Pro</h2>
    </div>

    <div class="section">
      <span class="label">Strumenti</span>
      <div class="grid-tools">
        <button class="btn-tool active" id="btn-pencil" onclick="window.setTool('pencil')">${icons.pencil}<span>Matita</span></button>
        <button class="btn-tool" id="btn-pen" onclick="window.setTool('pen')">${icons.pen}<span>Penna</span></button>
        <button class="btn-tool" id="btn-marker" onclick="window.setTool('marker')">${icons.marker}<span>Marker</span></button>
        <button class="btn-tool" id="btn-spray" onclick="window.setTool('spray')">${icons.spray}<span>Spray</span></button>
        <button class="btn-tool" id="btn-watercolor" onclick="window.setTool('watercolor')">${icons.water}<span>Acqua</span></button>
        <button class="btn-tool" id="btn-oil" onclick="window.setTool('oil')">${icons.oil}<span>Olio</span></button>
        <button class="btn-tool" id="btn-eraser" style="grid-column: span 2" onclick="window.setTool('eraser')">${icons.eraser}<span>Gomma</span></button>
      </div>
    </div>

    <div class="section">
      <span class="label">Parametri <span id="size-val" class="val-disp">25px</span></span>
      <input type="range" min="1" max="100" value="25" oninput="window.updateParam('size', this.value)">
      
      <span class="label" style="margin-top:15px">Opacità <span id="opacity-val" class="val-disp">200</span></span>
      <input type="range" min="1" max="255" value="200" oninput="window.updateParam('opacity', this.value)">
      
      <span class="label" style="margin-top:15px">Colore</span>
      <div class="color-picker-wrap">
        <input type="color" value="#141414" oninput="window.updateParam('color', this.value)">
      </div>
    </div>

    <div class="section">
      <div style="display:flex; justify-content:space-between; align-items:center">
         <span class="label" style="margin:0">Simmetria</span>
         <input type="checkbox" onchange="window.toggleMirror(this.checked)" style="width:auto; margin:0">
      </div>
      <div id="mirror-options" style="display:none; margin-top:10px">
        <input type="range" min="2"10px; color:#666">Raggi: <span id="mirror-val">6</span></div>
      </div>
    </div>

    <div class="row-actions">
      <button class="btn-sec" onclick="window.undoDraw()">Annulla</button>
      <button class="btn-sec" style="color:#ff5252; border-color:#522" onclick="window.clearAll()">Reset</button>
    </div>
    <div style="padding: 0 20px 20px 20px;">
      <button class="btn-primary" onclick="saveCanvas('ArtWork_Pro', 'png')">Salva PNG</button>
    </div>
  `);
}

// --- FUNZIONI UTILITY ---

window.setTool = function(t) {
  currentTool = t;
  document.querySelectorAll('.btn-tool').forEach(b => b.classList.remove('active'));
  document.getElementById('btn-' + t).classList.add('active');
  
  // Preset intelligenti
  let op = document.getElementById('opacity-val');
  let range = document.querySelector('input[type=range][max="255"]');
  
  if(t==='watercolor') { brushOpacity = 50; }
  else if(t==='oil') { brushOpacity = 255; }
  else if(t==='pencil') { brushOpacity = 180; }
  
  op.innerText = brushOpacity;
  range.value = brushOpacity;
}

window.updateParam = function(type, val) {
  if (type === 'size') {
    brushSize = parseInt(val);
    document.getElementById('size-val').innerText = val + 'px';
  } else if (type === 'opacity') {
    brushOpacity = parseInt(val);
    document.getElementById('opacity-val').innerText = val;
  } else if (type === 'color') {
    brushColor = color(val);
  } else if (type === 'mirror') {
    mirrorCount = parseInt(val);
    document.getElementById('mirror-val').innerText = val;
  }
}

window.toggleMirror = function(checked) {
  mirrorMode = checked;
  document.getElementById('mirror-options').style.display = checked ? 'block' : 'none';
}

function saveHistory() {
  if (history.length > 15) history.shift();
  history.push(drawingLayer.get());
}

window.undoDraw = function() {
  if (history.length > 0) {
    let prev = history.pop();
    drawingLayer.clear();
    drawingLayer.image(prev, 0, 0);
  }
}

window.clearAll = function() {
  if(confirm("Cancellare tutto il lavoro?")) {
    drawingLayer.clear();
    drips = []; // Cancella anche le colature attive
    history = [];
  }
}

function windowResized() {
  resizeCanvas(windowWidth - SIDEBAR_WIDTH, windowHeight);
  let saved = drawingLayer.get();
  drawingLayer.resizeCanvas(width, height);
  drawingLayer.image(saved, 0, 0);
  background(250);
}
