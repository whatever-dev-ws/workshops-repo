//WUP 2025-26
//Marwa Charaf

let particles = [];

// UI Variables
let sliderSize, sliderSpeed, sliderSpread, sliderCount, sliderHue;
let colorPickerBg;
let selBrush; 
let btnMirror, btnClear, btnSave, btnPause;
let btnUndo, btnRedo; 
// NUOVO: Pulsante Rewind
let btnRewind;

let isMirrored = false; 
let isPaused = false; 

// Variabili per la Storia (Undo/Redo - Disegno a tratti)
let history = [];
let historyIndex = -1;
let maxHistory = 8; 

// NUOVO: Buffer temporale (Registra ogni secondo)
let timeBuffer = []; 

function setup() {
  createCanvas(windowWidth, windowHeight);
  noStroke();

  addMermaidStyles();

  // --- UI CONTAINER ---
  let toolbar = createDiv();
  toolbar.class('mermaid-toolbar');

  // 1. Background Color
  let groupBg = createDiv().parent(toolbar).class('control-group');
  createSpan('Ocean Depth').parent(groupBg);
  colorPickerBg = createColorPicker('#001f2b').parent(groupBg);
  colorPickerBg.input(() => {
    particles = [];
    timeBuffer = []; // Reset buffer temporale
    background(colorPickerBg.color());
    saveHistory();
  });

  // 2. Brush Selector
  let groupBrush = createDiv().parent(toolbar).class('control-group');
  createSpan('Brush Type').parent(groupBrush);
  selBrush = createSelect().parent(groupBrush);
  selBrush.option('Pearls');     
  selBrush.option('Bubbles');    
  selBrush.option('Neon Ink');   
  selBrush.option('Scales');     
  selBrush.option('Whirlpool');  
  selBrush.option('Storm');      
  selBrush.option('Plankton');   
  selBrush.selected('Pearls');

  // 3. Size
  let groupSize = createDiv().parent(toolbar).class('control-group');
  createSpan('Size').parent(groupSize);
  sliderSize = createSlider(5, 300, 40, 1).parent(groupSize);

  // 4. Color Hue
  let groupHue = createDiv().parent(toolbar).class('control-group');
  createSpan('Color Shift').parent(groupHue);
  sliderHue = createSlider(0, 360, 0, 1).parent(groupHue);

  // 5. Speed
  let groupSpeed = createDiv().parent(toolbar).class('control-group');
  createSpan('Speed').parent(groupSpeed);
  sliderSpeed = createSlider(0.5, 8, 2, 0.1).parent(groupSpeed);

  // 6. Spread
  let groupSpread = createDiv().parent(toolbar).class('control-group');
  createSpan('Chaos').parent(groupSpread);
  sliderSpread = createSlider(0, 50, 15, 1).parent(groupSpread);

  // --- BUTTONS ROW ---
  let groupBtns = createDiv().parent(toolbar).class('button-group');

  btnMirror = createButton('Mirror: OFF').parent(groupBtns);
  btnMirror.mousePressed(() => {
    isMirrored = !isMirrored;
    btnMirror.html(isMirrored ? 'Mirror: ON' : 'Mirror: OFF');
    btnMirror.style('background', isMirrored ? 'linear-gradient(135deg, #ff758c, #ff7eb3)' : 'linear-gradient(135deg, #00b4db, #0083b0)');
  });

  btnPause = createButton('Freeze').parent(groupBtns);
  btnPause.mousePressed(togglePause);

  // NUOVO TASTO: REWIND 1s
  // Funziona meglio quando è in pausa
  btnRewind = createButton('⏪ -1s').parent(groupBtns);
  btnRewind.mousePressed(() => {
    // Funziona solo se c'è qualcosa nel buffer e se siamo in Freeze (preferibilmente)
    if (isPaused && timeBuffer.length > 0) {
      let pastFrame = timeBuffer.pop(); // Prendi l'ultimo secondo salvato
      background(pastFrame); // Sovrascrivi lo schermo
      particles = []; // Rimuovi le particelle vive per pulire la vista
    }
  });

  // UNDO
  btnUndo = createButton('❮ Undo').parent(groupBtns);
  btnUndo.mousePressed(undoAction);
  
  // REDO
  btnRedo = createButton('Redo ❯').parent(groupBtns);
  btnRedo.mousePressed(redoAction);

  btnClear = createButton('Clear').parent(groupBtns);
  btnClear.mousePressed(() => {
    particles = [];
    timeBuffer = []; // Pulisci memoria tempo
    background(colorPickerBg.color());
    saveHistory(); 
  });

  btnSave = createButton('Save JPG').parent(groupBtns);
  btnSave.mousePressed(() => saveCanvas('mermaid_magic', 'jpg'));

  background(colorPickerBg.color());
  saveHistory();
}

function draw() {
  // Se non è in pausa, applica l'effetto scia
  if (!isPaused) {
    let bgColor = colorPickerBg.color();
    fill(red(bgColor), green(bgColor), blue(bgColor), 25);
    rect(0, 0, width, height);
    
    // --- NUOVO: REGISTRAZIONE TEMPORALE ---
    // Ogni 60 frame (circa 1 secondo), salva una foto nel buffer
    if (frameCount % 60 === 0) {
      timeBuffer.push(get());
      // Mantieni solo gli ultimi 20 secondi per non bloccare il PC
      if (timeBuffer.length > 20) {
        timeBuffer.shift();
      }
    }
  }

  // Input Mouse 
  if (mouseIsPressed && mouseY < height - 120) {
    if (isPaused && particles.length === 0) {
       togglePause(); 
    }
    spawnParticles(mouseX, mouseY);
    if (isMirrored) spawnParticles(width - mouseX, mouseY);
  }

  blendMode(ADD); 

  for (let i = particles.length - 1; i >= 0; i--) {
    if (!isPaused) particles[i].update(); 
    particles[i].show();
    if (!isPaused && particles[i].finished()) {
      particles.splice(i, 1);
    }
  }

  blendMode(BLEND);
}

// --- GESTIONE STORIA (UNDO/REDO) ---

function mouseReleased() {
  if (mouseY < height - 100) {
    saveHistory();
  }
}

function saveHistory() {
  if (historyIndex < history.length - 1) {
    history = history.slice(0, historyIndex + 1);
  }
  let snap = get(); 
  history.push(snap);
  historyIndex++;
  if (history.length > maxHistory) {
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
  if (!isPaused) togglePause();
  particles = []; 
  background(history[historyIndex]);
}

function togglePause() {
  isPaused = !isPaused;
  if (isPaused) {
    btnPause.html('Resume');
    btnPause.style('background', 'linear-gradient(135deg, #f093fb, #f5576c)');
    // Quando metti pausa, salva l'istante corrente nel buffer temporale
    // così il primo click su -1s torna a un secondo fa, non ora.
    timeBuffer.push(get());
  } else {
    btnPause.html('Freeze');
    btnPause.style('background', 'linear-gradient(135deg, #00b4db, #0083b0)');
  }
}

// --- PENNELLI & CLASSI ---

function spawnParticles(x, y) {
  let mode = selBrush.value();
  let currentSize = sliderSize.value();
  let densityModifier = currentSize > 100 ? 0.5 : 1;
  
  if (mode === 'Pearls') {
    for (let i = 0; i < 3 * densityModifier; i++) particles.push(new RainbowPearl(x, y));
  } 
  else if (mode === 'Bubbles') {
    for (let i = 0; i < 2 * densityModifier; i++) particles.push(new Bubble(x, y));
  }
  else if (mode === 'Neon Ink') {
    for (let i = 0; i < 4; i++) particles.push(new NeonInk(x, y));
  }
  else if (mode === 'Scales') {
    particles.push(new MermaidScale(x, y));
  }
  else if (mode === 'Whirlpool') {
    for (let i = 0; i < 3 * densityModifier; i++) particles.push(new WhirlpoolParticle(x, y));
  }
  else if (mode === 'Storm') {
    for (let i = 0; i < 3; i++) particles.push(new StormParticle(x, y));
  }
  else if (mode === 'Plankton') {
    for (let i = 0; i < 10; i++) particles.push(new Plankton(x, y));
  }
}

// 1. Pearls
class RainbowPearl {
  constructor(x, y) {
    let spread = sliderSpread.value();
    this.x = x + random(-spread, spread);
    this.y = y + random(-spread, spread);
    this.vx = random(-1, 1);
    this.vy = random(-sliderSpeed.value(), -0.5); 
    this.alpha = random(180, 255);
    this.size = random(sliderSize.value() * 0.5, sliderSize.value()); 
    this.hueShift = sliderHue.value();
    this.hueOffset = random(0, 100);
  }
  update() {
    this.x += this.vx + sin(frameCount * 0.05 + this.hueOffset) * 2;
    this.y += this.vy;
    this.alpha -= 2.5;
  }
  finished() { return this.alpha < 0; }
  show() {
    noStroke();
    colorMode(HSB);
    let h = (170 + this.hueShift + sin(frameCount * 0.05) * 20) % 360;
    fill(h, 60, 90, this.alpha/255);
    ellipse(this.x, this.y, this.size);
    colorMode(RGB);
  }
}

// 2. Bubbles
class Bubble {
  constructor(x, y) {
    let spread = sliderSpread.value();
    this.x = x + random(-spread, spread);
    this.y = y + random(-spread, spread);
    this.size = random(sliderSize.value() * 0.2, sliderSize.value() * 0.8);
    this.vy = -random(sliderSpeed.value() * 1.5, sliderSpeed.value() * 3);
    this.alpha = 255;
    this.wobble = random(0, 100);
  }
  update() {
    this.y += this.vy;
    this.x += sin(frameCount * 0.1 + this.wobble);
    this.alpha -= 3;
    this.size += 0.2; 
  }
  finished() { return this.alpha < 0; }
  show() {
    noFill();
    strokeWeight(1 + sliderSize.value() * 0.05); 
    stroke(255, this.alpha);
    ellipse(this.x, this.y, this.size);
  }
}

// 3. Neon Ink
class NeonInk {
  constructor(x, y) {
    let spread = sliderSpread.value();
    this.x = x + random(-spread/2, spread/2);
    this.y = y + random(-spread/2, spread/2);
    this.vx = random(-2, 2);
    this.vy = random(-sliderSpeed.value(), 2); 
    this.alpha = 200;
    this.size = map(sliderSize.value(), 5, 300, 2, 25);
    this.hueShift = sliderHue.value();
    this.history = []; 
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= 0.95; 
    this.vy -= 0.05; 
    this.alpha -= 4;
    this.history.push({x: this.x, y: this.y});
    if(this.history.length > 10) this.history.shift();
  }
  finished() { return this.alpha < 0; }
  show() {
    colorMode(HSB);
    let h = (280 + this.hueShift) % 360;
    stroke(h, 80, 100, this.alpha/255);
    strokeWeight(this.size);
    noFill();
    beginShape();
    for(let pos of this.history) vertex(pos.x, pos.y);
    endShape();
    colorMode(RGB);
  }
}

// 4. Scales
class MermaidScale {
  constructor(x, y) {
    let spread = sliderSpread.value();
    this.x = x + random(-spread, spread);
    this.y = y + random(-spread, spread);
    this.size = sliderSize.value(); 
    this.angle = random(TWO_PI);
    this.vy = random(1, 3); 
    this.vx = random(-1, 1);
    this.alpha = 255;
    this.hueShift = sliderHue.value();
    this.rotSpeed = random(-0.1, 0.1);
  }
  update() {
    this.y += this.vy * (sliderSpeed.value() * 0.5); 
    this.x += sin(frameCount * 0.05 + this.x) * 1.5; 
    this.angle += this.rotSpeed;
    this.alpha -= 2;
  }
  finished() { return this.alpha < 0; }
  show() {
    noStroke();
    colorMode(HSB);
    let h = (200 + this.hueShift) % 360; 
    fill(h, 70, 100, this.alpha/255);
    push();
    translate(this.x, this.y);
    rotate(this.angle);
    arc(0, 0, this.size, this.size, 0, PI + QUARTER_PI, CHORD);
    pop();
    colorMode(RGB);
  }
}

// 5. Whirlpool
class WhirlpoolParticle {
  constructor(x, y) {
    this.centerX = x;
    this.centerY = y;
    this.angle = random(TWO_PI);
    this.radius = random(5, 20);
    this.speed = random(0.1, 0.3);
    this.alpha = 255;
    this.hueShift = sliderHue.value();
    this.size = map(sliderSize.value(), 5, 300, 2, 40);
  }
  update() {
    this.angle += this.speed * sliderSpeed.value();
    this.radius += 1.5; 
    this.alpha -= 4;
    this.x = this.centerX + cos(this.angle) * this.radius;
    this.y = this.centerY + sin(this.angle) * this.radius;
  }
  finished() { return this.alpha < 0; }
  show() {
    noStroke();
    colorMode(HSB);
    let h = (240 + this.hueShift) % 360; 
    fill(h, 90, 100, this.alpha/255);
    ellipse(this.x, this.y, this.size);
    colorMode(RGB);
  }
}

// 6. Storm
class StormParticle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = map(sliderSize.value(), 5, 300, 1, 15);
    this.alpha = 255;
    this.hueShift = sliderHue.value();
    this.history = [];
    this.step = 0;
  }
  update() {
    let spread = sliderSpread.value();
    this.x += random(-spread, spread);
    this.y += random(-spread, spread);
    this.alpha -= 10; 
    this.history.push({x: this.x, y: this.y});
    if(this.history.length > 5) this.history.shift();
  }
  finished() { return this.alpha < 0; }
  show() {
    colorMode(HSB);
    let h = (60 + this.hueShift) % 360; 
    stroke(h, 50, 100, this.alpha/255);
    strokeWeight(this.size);
    noFill();
    beginShape();
    for(let pos of this.history) vertex(pos.x, pos.y);
    endShape();
    colorMode(RGB);
  }
}

// 7. Plankton
class Plankton {
  constructor(x, y) {
    let spread = sliderSpread.value() * 2; 
    this.x = x + random(-spread, spread);
    this.y = y + random(-spread, spread);
    this.vx = random(-0.5, 0.5);
    this.vy = random(-0.5, 0.5);
    this.size = map(sliderSize.value(), 5, 300, 1, 10);
    this.alpha = random(100, 255);
    this.hueShift = sliderHue.value();
    this.t = random(100); 
  }
  update() {
    this.x += map(noise(this.t), 0, 1, -2, 2);
    this.y += map(noise(this.t + 1000), 0, 1, -2, 2);
    this.t += 0.05 * sliderSpeed.value();
    this.alpha -= 1.5;
  }
  finished() { return this.alpha < 0; }
  show() {
    noStroke();
    colorMode(HSB);
    let h = (120 + this.hueShift) % 360; 
    fill(h, 100, 100, this.alpha/255);
    ellipse(this.x, this.y, this.size);
    colorMode(RGB);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  background(colorPickerBg.color());
  particles = [];
  history = []; 
  timeBuffer = []; // Reset memoria tempo
  historyIndex = -1;
  saveHistory();
}

// --- CSS STYLES ---
function addMermaidStyles() {
  let css = `
    body { margin: 0; padding: 0; background-color: #000; font-family: 'Segoe UI', sans-serif; overflow: hidden; }
    
    .mermaid-toolbar {
      display: flex; flex-wrap: wrap; justify-content: center; align-items: center;
      gap: 15px; padding: 10px 20px;
      position: fixed; bottom: 15px; left: 50%; transform: translateX(-50%);
      background: rgba(10, 20, 40, 0.7);
      backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 16px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
      z-index: 10; width: auto; max-width: 95%;
    }

    .control-group {
      display: flex; flex-direction: column; align-items: center;
      color: #bde0fe; font-size: 10px; text-transform: uppercase; letter-spacing: 1px;
    }
    .control-group span { margin-bottom: 4px; font-weight: 700; text-shadow: 0 0 5px rgba(0,255,255,0.4);}

    /* SLIDERS */
    input[type=range] { -webkit-appearance: none; width: 70px; height: 3px; background: rgba(255,255,255,0.2); border-radius: 2px; outline: none; }
    input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 12px; height: 12px; border-radius: 50%; background: #fff; box-shadow: 0 0 8px #00ffff; cursor: pointer; }

    /* SELECT */
    select { background: rgba(0,0,0,0.4); color: #fff; border: 1px solid rgba(255,255,255,0.3); padding: 4px; border-radius: 6px; outline: none; cursor: pointer; font-size: 11px; }
    select option { background: #001f2b; }

    /* BUTTONS */
    button {
      background: linear-gradient(135deg, #00b4db, #0083b0); border: none; color: white;
      padding: 6px 14px; border-radius: 15px; font-size: 11px; font-weight: bold; cursor: pointer;
      box-shadow: 0 3px 10px rgba(0,0,0,0.3); transition: 0.2s;
    }
    button:hover { transform: scale(1.05); filter: brightness(1.2); }

    /* COLOR PICKER */
    input[type="color"] { border: none; width: 25px; height: 25px; border-radius: 50%; cursor: pointer; background: none; }
    input[type="color"]::-webkit-color-swatch-wrapper { padding: 0; }
    input[type="color"]::-webkit-color-swatch { border: 2px solid rgba(255,255,255,0.5); border-radius: 50%; }
  `;
  let style = createElement('style', css);
  style.parent(document.head);
}