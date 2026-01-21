let colorPicker, sizeSlider, densitySlider;
let bgPicker, fileInput, stencilInput;
let isFirstClick = false;

// --- CONFIGURAZIONE INTERFACCIA ---
const UI_WIDTH = 240; 
const FONT_FAMILY = '"Segoe UI", Roboto, Helvetica, Arial, sans-serif';

let pg;       // Livello GRAFFITI
let bgLayer;  // Livello SFONDO
let drips = []; 

// VARIABILI STENCIL
let stencilImg = null;
let stencilX = 300;
let stencilY = 200;
let stencilScale = 1.0;
let showStencil = true;
let isEditingStencil = false;

// --- VARIABILI UNDO / REDO ---
let history = [];        
let historyIndex = -1;   
const MAX_HISTORY = 15;  

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);
  
  pg = createGraphics(windowWidth, windowHeight);
  pg.clear(); 
  
  saveHistory(); // Salva stato iniziale
  
  bgLayer = createGraphics(windowWidth, windowHeight);
  bgLayer.background('#222222');

  // --- COSTRUZIONE SIDEBAR ---
  let uiContainer = createDiv('');
  styleSidebar(uiContainer);

  let title = createDiv('GRAFFITI<br>STUDIO');
  title.parent(uiContainer);
  title.style('font-size', '24px');
  title.style('font-weight', '900');
  title.style('line-height', '0.9');
  title.style('color', '#555'); 
  title.style('margin-bottom', '20px');

  function createSection(title) {
    let t = createDiv(title);
    t.parent(uiContainer);
    t.style('width', '100%');
    t.style('border-bottom', '1px solid #444');
    t.style('margin', '15px 0 10px 0');
    t.style('padding-bottom', '5px');
    t.style('font-size', '11px');
    t.style('letter-spacing', '1px');
    t.style('color', '#888');
    t.style('font-weight', 'bold');
  }

  function createControl(label, element) {
    let div = createDiv('');
    div.parent(uiContainer);
    div.style('width', '100%');
    div.style('display', 'flex');
    div.style('flex-direction', 'column');
    div.style('margin-bottom', '12px');
    let l = createSpan(label);
    l.parent(div);
    l.style('font-size', '10px');
    l.style('color', '#ccc');
    l.style('margin-bottom', '4px');
    element.parent(div);
    element.style('width', '100%'); 
    element.style('box-sizing', 'border-box');
  }

  // --- SEZIONE 1: STRUMENTO ---
  createSection("STRUMENTO");
  
  colorPicker = createColorPicker('#39ff14');
  colorPicker.style('height', '30px');
  colorPicker.style('border', 'none');
  colorPicker.style('padding', '0');
  colorPicker.style('background', 'none');
  createControl("COLORE", colorPicker);
  
  sizeSlider = createSlider(1, 400, 60);
  createControl("DIMENSIONE", sizeSlider);
  
  densitySlider = createSlider(50, 400, 180);
  createControl("PRESSIONE", densitySlider);

  // --- UNDO / REDO (SPOSTATO QUI SOTTO) ---
  let undoRedoGroup = createDiv('');
  undoRedoGroup.parent(uiContainer);
  undoRedoGroup.style('display', 'flex');
  undoRedoGroup.style('gap', '5px');
  undoRedoGroup.style('margin-bottom', '10px');
  undoRedoGroup.style('margin-top', '5px'); // Un po' di aria dallo slider

  let btnUndo = createButton('◄ INDIETRO');
  let btnRedo = createButton('AVANTI ►');
  
  styleButton(btnUndo);
  styleButton(btnRedo);
  
  btnUndo.parent(undoRedoGroup);
  btnRedo.parent(undoRedoGroup);
  btnUndo.style('flex', '1');
  btnRedo.style('flex', '1');
  
  btnUndo.mousePressed(undoAction);
  btnRedo.mousePressed(redoAction);


  // --- SEZIONE 2: STENCIL ---
  createSection("STENCIL (PNG)");
  
  stencilInput = createFileInput(handleStencil);
  createControl("CARICA STENCIL", stencilInput);
  stencilInput.style('font-size', '10px');
  stencilInput.style('color', '#aaa');

  let stencilControls = createDiv('');
  stencilControls.parent(uiContainer);
  stencilControls.style('display', 'flex');
  stencilControls.style('flex-direction', 'column');
  stencilControls.style('gap', '10px');

  let editCheck = createCheckbox(' SPOSTA / RIDIMENS.', false);
  editCheck.parent(stencilControls);
  editCheck.style('color', '#fff');
  editCheck.style('font-size', '11px');
  editCheck.changed(() => isEditingStencil = editCheck.checked());

  let visCheck = createCheckbox(' MOSTRA STENCIL', true);
  visCheck.parent(stencilControls);
  visCheck.style('color', '#fff');
  visCheck.style('font-size', '11px');
  visCheck.changed(() => showStencil = visCheck.checked());
  
  let help = createDiv('Usa la rotella mouse per zoomare lo stencil quando "Sposta" è attivo.');
  help.parent(stencilControls);
  help.style('font-size', '9px');
  help.style('color', '#666');
  help.style('margin-top', '5px');


  // --- SEZIONE 3: SFONDO ---
  createSection("MURO & SFONDO");
  bgPicker = createColorPicker('#222222');
  bgPicker.style('height', '25px');
  bgPicker.style('border', 'none');
  bgPicker.style('padding', '0');
  bgPicker.input(() => bgLayer.background(bgPicker.value()));
  createControl("TINTA UNITA", bgPicker);

  let btnGroup = createDiv('');
  btnGroup.parent(uiContainer);
  btnGroup.style('display', 'flex');
  btnGroup.style('gap', '5px');
  let btnBrick = createButton('Mattoni');
  let btnConcrete = createButton('Cemento');
  let btnMetal = createButton('Metallo');
  [btnBrick, btnConcrete, btnMetal].forEach(btn => {
    btn.parent(btnGroup);
    styleButton(btn);
    btn.style('flex', '1'); 
    btn.style('font-size', '10px');
  });
  btnBrick.mousePressed(drawBricks);
  btnConcrete.mousePressed(drawConcrete);
  btnMetal.mousePressed(drawMetal);

  // --- SPAZIATORE AGGIUNTO ---
  let spacer = createDiv('');
  spacer.parent(uiContainer);
  spacer.style('margin-bottom', '25px'); // Aumentata distanza (Spazio vuoto)

  fileInput = createFileInput(handleFile);
  createControl("CARICA FOTO SFONDO", fileInput);
  fileInput.style('font-size', '10px');
  fileInput.style('color', '#aaa');

  // --- SEZIONE 4: AZIONI ---
  createSection("SALVATAGGIO");
  let actionGroup = createDiv('');
  actionGroup.parent(uiContainer);
  actionGroup.style('display', 'flex');
  actionGroup.style('gap', '10px');
  let btnClearSpray = createButton('PULISCI');
  let btnSave = createButton('SALVA JPG');
  styleButton(btnClearSpray);
  styleButton(btnSave);
  btnSave.style('background', '#007bff'); 
  btnClearSpray.style('flex', '1');
  btnSave.style('flex', '1');
  
  btnClearSpray.mousePressed(() => { 
      pg.clear(); 
      drips = []; 
      saveHistory(); 
  });
  
  btnSave.mousePressed(() => {
    let oldState = showStencil;
    showStencil = false;
    draw(); 
    saveCanvas('mio_graffito', 'jpg');
    showStencil = oldState; 
  });
  btnClearSpray.parent(actionGroup);
  btnSave.parent(actionGroup);
}

// --- FUNZIONI STORICO ---

function saveHistory() {
  if (historyIndex < history.length - 1) {
    history = history.slice(0, historyIndex + 1);
  }
  history.push(pg.get());
  historyIndex++;
  if (history.length > MAX_HISTORY) {
    history.shift();
    historyIndex--;
  }
}

function undoAction() {
  if (historyIndex > 0) {
    historyIndex--;
    restoreHistory();
  }
}

function redoAction() {
  if (historyIndex < history.length - 1) {
    historyIndex++;
    restoreHistory();
  }
}

function restoreHistory() {
  pg.clear();
  pg.image(history[historyIndex], 0, 0);
  drips = [];
}

// --- EVENTI ---

function mouseReleased() {
    if (mouseX > UI_WIDTH && !isEditingStencil) {
        saveHistory();
    }
}

function keyPressed() {
    if (keyIsDown(CONTROL)) {
        if (key === 'z' || key === 'Z') undoAction();
        if (key === 'y' || key === 'Y') redoAction();
    }
}

function draw() {
  image(bgLayer, 0, 0); 
  image(pg, 0, 0);      

  if (stencilImg && showStencil) {
    push();
    translate(stencilX, stencilY);
    scale(stencilScale);
    tint(0, 100); 
    image(stencilImg, 5, 5); 
    tint(255, 200); 
    image(stencilImg, 0, 0);
    
    if (isEditingStencil) {
      noFill();
      stroke(0, 255, 255);
      strokeWeight(2 / stencilScale);
      rect(0, 0, stencilImg.width, stencilImg.height);
    }
    pop();
  }

  if (mouseIsPressed && mouseX > UI_WIDTH && !isEditingStencil) {
    let distance = dist(mouseX, mouseY, pmouseX, pmouseY);
    let steps = max(1, floor(distance / 2)); 
    let baseDensity = densitySlider.value();
    let currentSize = sizeSlider.value();
    
    if (isFirstClick) { baseDensity *= 3; isFirstClick = false; }
    
    for (let s = 0; s < steps; s++) {
      let lerpX = lerp(pmouseX, mouseX, s / steps);
      let lerpY = lerp(pmouseY, mouseY, s / steps);
      sprayPaint(pg, lerpX, lerpY, baseDensity);
    }

    if (distance < 5 && baseDensity > 100) {
      if (random(100) < 20) { 
        drips.push(new Drip(mouseX + random(-currentSize/4, currentSize/4), mouseY, colorPicker.value(), currentSize));
      }
    }
  }
  
  if (mouseIsPressed && isEditingStencil && stencilImg) {
    stencilX += mouseX - pmouseX;
    stencilY += mouseY - pmouseY;
  }

  for (let i = drips.length - 1; i >= 0; i--) {
    let d = drips[i];
    d.update();
    d.display();
    if (d.isFinished()) drips.splice(i, 1);
  }
}

function sprayPaint(targetLayer, x, y, density) {
  let radius = sizeSlider.value();
  let col = color(colorPicker.value());
  col.setAlpha(80); 
  targetLayer.stroke(col);
  
  for (let i = 0; i < density; i++) {
    let r = randomGaussian(0, radius / 2.5);
    let angle = random(TWO_PI);
    let offX = cos(angle) * r;
    let offY = sin(angle) * r;
    
    let pX = x + offX;
    let pY = y + offY;

    if (abs(r) < radius) {
      let canPaint = true;

      if (stencilImg && showStencil) {
        let localX = (pX - stencilX) / stencilScale;
        let localY = (pY - stencilY) / stencilScale;

        if (localX >= 0 && localX < stencilImg.width && localY >= 0 && localY < stencilImg.height) {
          let pixelColor = stencilImg.get(floor(localX), floor(localY));
          if (alpha(pixelColor) > 50) {
            canPaint = false; 
          }
        }
      }

      if (canPaint) {
        let minWeight = map(radius, 1, 400, 0.5, 2.5);
        targetLayer.strokeWeight(random(minWeight, minWeight * 3)); 
        targetLayer.point(pX, pY);
      }
    }
  }
}

function handleStencil(file) {
  if (file.type === 'image') {
    stencilImg = loadImage(file.data, (img) => {
      if (img.width > 500) img.resize(500, 0);
      stencilX = (width/2) + 100;
      stencilY = height/2 - img.height/2;
    });
  }
}

function mouseWheel(event) {
  if (isEditingStencil && stencilImg) {
    let zoomAmount = 0.05;
    if (event.delta > 0) stencilScale = max(0.2, stencilScale - zoomAmount);
    else stencilScale = min(5.0, stencilScale + zoomAmount);
    return false; 
  }
}

class Drip {
  constructor(x, y, c, brushSize) {
    this.x = x; this.y = y;
    this.color = color(c); this.color.setAlpha(200);
    this.size = random(2, brushSize / 10); 
    if (this.size < 2) this.size = 2;
    this.speed = random(1, 3);
    this.life = random(50, 200);
  }
  update() {
    this.y += this.speed; this.speed *= 0.98; this.life -= 2; this.x += random(-0.5, 0.5);
  }
  display() {
    let canPaint = true;
    if (stencilImg && showStencil) {
        let localX = (this.x - stencilX) / stencilScale;
        let localY = (this.y - stencilY) / stencilScale;
        if (localX >= 0 && localX < stencilImg.width && localY >= 0 && localY < stencilImg.height) {
          if (alpha(stencilImg.get(floor(localX), floor(localY))) > 50) canPaint = false;
        }
    }
    if (canPaint) {
        pg.noStroke(); pg.fill(this.color); pg.ellipse(this.x, this.y, this.size, this.size);
    }
  }
  isFinished() { return (this.life < 0 || this.speed < 0.1); }
}

function drawBricks() {
  bgLayer.background(60, 55, 50); bgLayer.noStroke();
  let w = 70, h = 35;
  for(let y = 0; y < height; y += h) {
    let offset = (y / h) % 2 === 0 ? 0 : w/2;
    for(let x = -w; x < width; x += w) {
      let r = random(130, 180), g = random(50, 80), b = random(40, 60);
      bgLayer.fill(r, g, b); let gap = 3; bgLayer.rect(x+offset+gap, y+gap, w-gap*2, h-gap*2);
      for(let k=0; k<15; k++){ bgLayer.fill(0, random(50)); bgLayer.rect(x+offset+random(w), y+random(h), 2, 2); bgLayer.fill(255, random(30)); bgLayer.rect(x+offset+random(w), y+random(h), 1, 1); }
    }
  }
  applyGrunge(5000); applyGrain(bgLayer, 40); 
}
function drawConcrete() {
  bgLayer.background(140); bgLayer.noStroke();
  for(let i = 0; i < 150; i++) { bgLayer.fill(random(100, 160), 20); let s = random(100, 400); bgLayer.ellipse(random(width), random(height), s, s * 0.6); }
  bgLayer.stroke(80, 80); bgLayer.noFill(); for(let i=0; i<8; i++){ let x=random(width), y=random(height); bgLayer.beginShape(); bgLayer.strokeWeight(random(0.5,1.5)); for(let j=0; j<20; j++){ vertex(x,y); x+=random(-15,15); y+=random(-15,15); } bgLayer.endShape(); }
  applyGrain(bgLayer, 60); 
}
function drawMetal() {
  bgLayer.background(80, 85, 90); let slatH = 40; 
  for(let y = 0; y < height; y += slatH) { for(let i = 0; i < slatH; i++) { let inter = map(i, 0, slatH, 0, PI); let c = map(sin(inter), 0, 1, 50, 160); bgLayer.stroke(c); bgLayer.line(0, y+i, width, y+i); } bgLayer.stroke(0, 150); bgLayer.line(0, y, width, y); }
  bgLayer.noStroke(); for(let i=0; i<300; i++) { bgLayer.fill(random(100, 160), random(40, 80), 20, random(50)); bgLayer.ellipse(random(width), random(height), random(5, 50)); }
  applyGrain(bgLayer, 25);
}
function applyGrunge(amount) { bgLayer.noStroke(); for(let i=0; i<amount; i++){ bgLayer.fill(20, 30, 40, random(5, 15)); bgLayer.rect(random(width), random(height), random(2, 6), random(2, 6)); } }
function applyGrain(layer, intensity) { layer.loadPixels(); let d = layer.pixelDensity(); let fullCount = 4 * (layer.width * d) * (layer.height * d); for (let i = 0; i < fullCount; i += 4) { let noiseVal = random(-intensity, intensity); layer.pixels[i] = constrain(layer.pixels[i] + noiseVal, 0, 255); layer.pixels[i+1] = constrain(layer.pixels[i+1] + noiseVal, 0, 255); layer.pixels[i+2] = constrain(layer.pixels[i+2] + noiseVal, 0, 255); } layer.updatePixels(); }
function mousePressed() { if (mouseX > UI_WIDTH) isFirstClick = true; } 
function handleFile(file) { if (file.type === 'image') { let img = createImg(file.data, ''); img.hide(); setTimeout(() => { bgLayer.image(img, 0, 0, width, height); }, 200); } }
function windowResized() { resizeCanvas(windowWidth, windowHeight); pg = createGraphics(windowWidth, windowHeight); bgLayer = createGraphics(windowWidth, windowHeight); bgLayer.background('#222222'); drips = []; history = []; historyIndex = -1; saveHistory(); }
function styleSidebar(div) { div.style('position', 'absolute'); div.style('top', '0'); div.style('left', '0'); div.style('width', UI_WIDTH + 'px'); div.style('height', '100vh'); div.style('background', '#1e1e1e'); div.style('border-right', '1px solid #333'); div.style('display', 'flex'); div.style('flex-direction', 'column'); div.style('padding', '20px'); div.style('box-sizing', 'border-box'); div.style('font-family', FONT_FAMILY); div.style('color', '#eee'); div.style('z-index', '1000'); div.style('overflow-y', 'auto'); }
function styleButton(b) { b.style('background', '#333'); b.style('color', '#eee'); b.style('border', '1px solid #555'); b.style('padding', '8px 10px'); b.style('border-radius', '4px'); b.style('cursor', 'pointer'); b.style('font-family', FONT_FAMILY); b.style('font-weight', '600'); b.style('transition', 'background 0.2s'); b.elt.onmouseover = () => b.style('background', '#444'); b.elt.onmouseout = () => b.style('background', '#333'); }