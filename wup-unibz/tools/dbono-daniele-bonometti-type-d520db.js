// WUP 2025-26
// Daniele Bonometti
// --- Bootstrapping: Load p5.js and Fonts ---
(function() {
  // 1. Load Google Fonts
  const fontLink = document.createElement('link');
  fontLink.href = 'https://fonts.googleapis.com/css2?family=Bangers&family=Courier+Prime&family=Lobster&family=Montserrat:wght@400;900&family=Oswald:wght@400;700&family=Pacifico&family=Playfair+Display:wght@400;900&family=Righteous&family=Roboto:wght@400;900&family=VT323&display=swap';
  fontLink.rel = 'stylesheet';
  document.head.appendChild(fontLink);

  // 2. Check if p5 is loaded, if not, load it dynamically
  if (typeof p5 === 'undefined') {
    console.log('p5.js not found, loading dynamically...');
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.0/p5.min.js';
    script.onload = () => {
      console.log('p5.js loaded. Starting sketch...');
    };
    document.head.appendChild(script);
  }
})();

// --- Global Variables ---
let appState = 'intro'; // 'intro' or 'editor'
let graphics; // Offscreen buffer for pure text
let canvas;
const fonts = ['Roboto', 'Montserrat', 'Playfair Display', 'Lobster', 'Pacifico', 'Bangers', 'Courier Prime', 'VT323', 'Oswald', 'Righteous'];

// Intro State
let introParticles = [];
let btnStartApp;
let introEffectTimer = 0;
let currentIntroEffect = 0;
let effectModes = ['Sine Strips', 'Vertical Wave', 'Grid Elastic', 'Block Glitch', 'Mosaic', 'Bad TV', 'Liquid Mirror', 'Pixel Noise'];

// UI State
let isSidebarOpen = false; 

// Interaction Delay State
let interactionReadyTime = 0; 

// History State
let historyStack = [];
let historyIndex = -1;
let isRestoring = false; 

// Recording State
let isCountingDown = false;
let countdownVal = 0;
let isRecording = false;
let recordingStartFrame = 0;

// Mouse Smoothing Variables
let smoothMouseX = 0;
let smoothMouseY = 0;
let targetMouseX = 0;
let targetMouseY = 0;

// UI Variables
let sidebarBg; 
let btnToggle;
let btnUndo, btnRedo; 
let selRatio; 
let inpText;
let selMode;
let selFont; 
let sliderSize, sliderParam1, sliderParam2;
let pickerText, pickerBg;
let inpFilename; 
let selImageFormat; 
let btnSaveImg, btnSaveGif;
let recordingOverlay; 

function setup() {
  // 1. Create Canvas
  canvas = createCanvas(100, 100); 
  canvas.style('display', 'block');
  canvas.style('box-shadow', '0 0 20px rgba(0,0,0,0.5)');
  
  pixelDensity(1); 
  
  // 2. Setup Intro System
  for(let i=0; i<15; i++) {
    introParticles.push(new IntroParticle());
  }
  
  // 3. Create UI Controls (Hidden initially)
  setupUI();
  setUIVisibility(false); 

  // 4. Create Start Button (Inline Styles applied here)
  btnStartApp = createButton('START CREATING');
  btnStartApp.position(windowWidth/2 - 100, windowHeight/2 - 30);
  btnStartApp.size(200, 60);
  btnStartApp.style('font-family', 'sans-serif');
  btnStartApp.style('font-size', '20px');
  btnStartApp.style('font-weight', 'bold');
  btnStartApp.style('background', '#fff');
  btnStartApp.style('color', '#000');
  btnStartApp.style('border', 'none');
  btnStartApp.style('border-radius', '30px');
  btnStartApp.style('cursor', 'pointer');
  btnStartApp.style('box-shadow', '0 0 20px rgba(255,255,255,0.5)');
  btnStartApp.style('z-index', '1000');
  
  // Start Button Hover Logic (JS instead of CSS :hover)
  btnStartApp.elt.addEventListener('mouseenter', () => btnStartApp.style('transform', 'scale(1.05)'));
  btnStartApp.elt.addEventListener('mouseleave', () => btnStartApp.style('transform', 'scale(1.0)'));
  
  btnStartApp.mousePressed(startEditor);

  // 5. Initialize Layout
  updateLayout();

  // 6. Initial Font Settings
  textAlign(CENTER, CENTER);
  noStroke();

  // 7. Save Initial State
  saveState();

  // 8. NATIVE JS MOUSE TRACKING
  window.addEventListener('mousemove', (e) => {
    if (!canvas) return;
    const bounds = canvas.elt.getBoundingClientRect();
    let x = (e.clientX - bounds.left) * (width / bounds.width);
    let y = (e.clientY - bounds.top) * (height / bounds.height);
    targetMouseX = x;
    targetMouseY = y;
  });
  
  // Apply Body Styles Inline
  document.body.style.margin = '0';
  document.body.style.padding = '0';
  document.body.style.overflow = 'hidden';
  document.body.style.backgroundColor = '#111';
  document.body.style.fontFamily = 'sans-serif';

  // Initialize targets to center
  targetMouseX = width / 2;
  targetMouseY = height / 2;
  smoothMouseX = width / 2;
  smoothMouseY = height / 2;
}

function draw() {
  // --- Smooth Mouse Logic & Delay Check ---
  let tx = targetMouseX;
  let ty = targetMouseY;
  
  if (appState === 'editor' && millis() < interactionReadyTime) {
      tx = 0;
      ty = 0;
  }

  smoothMouseX = lerp(smoothMouseX, tx, 0.25);
  smoothMouseY = lerp(smoothMouseY, ty, 0.25);

  if (appState === 'intro') {
    drawIntro();
  } else {
    drawEditor();
  }
}

// --- Intro Logic ---

class IntroParticle {
  constructor() {
    this.reset();
  }
  
  reset() {
    this.x = random(width);
    this.y = random(height);
    this.vx = random(-3, 3);
    this.vy = random(-3, 3);
    this.char = String.fromCharCode(65 + floor(random(26)));
    this.font = random(fonts);
    this.size = random(40, 150);
    this.color = color(random(100, 255), random(100, 255), random(255));
  }
  
  update() {
    this.x += this.vx;
    this.y += this.vy;
    
    if (this.x < -100 || this.x > width + 100 || this.y < -100 || this.y > height + 100) {
      this.reset();
      this.x = random(width);
      this.y = random(height);
    }
  }
  
  draw(g) {
    g.fill(this.color);
    g.textFont(this.font);
    g.textSize(this.size);
    g.text(this.char, this.x, this.y);
  }
}

function drawIntro() {
  if (!graphics) return;

  introEffectTimer++;
  if (introEffectTimer > 100) {
    introEffectTimer = 0;
    currentIntroEffect = floor(random(effectModes.length));
  }

  graphics.background(20); 
  graphics.noStroke();
  
  for(let p of introParticles) {
    p.update();
    p.draw(graphics);
  }
  
  graphics.fill(255);
  graphics.textFont('Roboto'); 
  graphics.textSize(min(width, height) * 0.08);
  graphics.text("KINETIC TYPE", width/2, height/2 - 100);

  background(20);

  let mode = effectModes[currentIntroEffect];
  let p1 = noise(frameCount * 0.01); 
  let p2 = noise(frameCount * 0.01 + 100);
  let scaleFactor = width / 1000;

  switch (mode) {
    case 'Sine Strips': effectSineStrips(p1, p2, scaleFactor); break;
    case 'Vertical Wave': effectVerticalWave(p1, p2, scaleFactor); break;
    case 'Grid Elastic': effectGridElastic(p1, p2, '#ffffff', scaleFactor); break;
    case 'Block Glitch': effectBlockGlitch(p1, p2, scaleFactor); break;
    case 'Mosaic': effectMosaic(p1, p2, scaleFactor); break;
    case 'Bad TV': effectBadTV(p1, p2, scaleFactor); break;
    case 'Liquid Mirror': effectLiquidMirror(p1, p2, scaleFactor); break;
    case 'Pixel Noise': effectPixelNoise(p1, p2); break;
  }
}

function startEditor() {
  appState = 'editor';
  btnStartApp.remove();
   
  interactionReadyTime = millis() + 5000;
   
  setUIVisibility(true);
  updateLayout();
  graphics.clear();
}

function setUIVisibility(visible) {
  if (btnToggle) {
      btnToggle.style('display', visible ? 'block' : 'none');
  }

  if (sidebarBg) {
      if (visible && isSidebarOpen) {
          sidebarBg.style('display', 'flex'); 
      } else {
          sidebarBg.style('display', 'none');
      }
  }
}

// --- Editor Draw Loop ---

function drawEditor() {
  if (!graphics) return;

  let txt = inpText.value();
  if (txt.length === 0) txt = " ";
  
  let cText = pickerText.value();
  let cBg = pickerBg.value();
  let fontName = selFont ? selFont.value() : 'sans-serif';

  let scaleFactor = width / 1000;
  
  graphics.textSize(100);
  graphics.textFont(fontName); 
  
  let lines = txt.split('\n');
  let maxW = 0;
  for (let line of lines) {
    let w = graphics.textWidth(line);
    if (w > maxW) maxW = w;
  }
 
  if (maxW < 5) { 
      maxW = Math.max(1, txt.length * 40); 
  }
  
  let scaleW = (width * 0.9) / maxW;
  let totalH = lines.length * 100 * 1.2; 
  let scaleH = (height * 0.8) / totalH; 
  
  let fitScale = min(scaleW, scaleH);
  let baseFitSize = 100 * fitScale;
 
  let sizeMultiplier = map(sliderSize.value(), 50, 300, 0.2, 1.5);
  let fSize = baseFitSize * sizeMultiplier;

  graphics.background(cBg);
  graphics.fill(cText);
  graphics.noStroke();
  graphics.textSize(fSize);
  graphics.textFont(fontName); 
  graphics.text(txt, width / 2, height / 2);

  background(cBg);

  let mode = selMode.value();
  let p1 = sliderParam1.value() / 100;
  let p2 = sliderParam2.value() / 100;

  switch (mode) {
    case 'Sine Strips': effectSineStrips(p1, p2, scaleFactor); break;
    case 'Vertical Wave':  effectVerticalWave(p1, p2, scaleFactor); break;
    case 'Grid Elastic': effectGridElastic(p1, p2, cText, scaleFactor); break;
    case 'Block Glitch':  effectBlockGlitch(p1, p2, scaleFactor); break;
    case 'Mosaic':  effectMosaic(p1, p2, scaleFactor); break;
    case 'Bad TV':  effectBadTV(p1, p2, scaleFactor); break;
    case 'Liquid Mirror':  effectLiquidMirror(p1, p2, scaleFactor); break;
    case 'Pixel Noise': effectPixelNoise(p1, p2); break;
  }

  // --- Draw Countdown Overlay ---
  if (isCountingDown) {
    push();
    fill(0, 0, 0, 150); 
    rect(0, 0, width, height);
    
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(min(width, height) * 0.3); 
    text(countdownVal, width / 2, height / 2 - 20); 
    
    let instrSize = max(14, min(width, height) * 0.04);
    textSize(instrSize);
    text("Move your mouse over the canvas\nto save your GIF in a unique way!", width / 2, height / 2 + min(width, height) * 0.2);
    pop();
  }
}

// --- History Logic ---

function saveState() {
  if (isRestoring) return;
  if (historyIndex < historyStack.length - 1) {
    historyStack = historyStack.slice(0, historyIndex + 1);
  }

  let state = {
    text: inpText.value(),
    ratio: selRatio.value(),
    mode: selMode.value(),
    font: selFont ? selFont.value() : 'Roboto',
    size: sliderSize.value(),
    p1: sliderParam1.value(),
    p2: sliderParam2.value(),
    cText: pickerText.value(),
    cBg: pickerBg.value(),
    filename: inpFilename.value(),
    imageFormat: selImageFormat.value()
  };

  historyStack.push(state);
  historyIndex++;
  
  if (historyStack.length > 50) {
    historyStack.shift();
    historyIndex--;
  }

  updateUndoRedoButtons();
}

function undo() {
  if (historyIndex > 0) {
    historyIndex--;
    restoreState(historyStack[historyIndex]);
  }
}

function redo() {
  if (historyIndex < historyStack.length - 1) {
    historyIndex++;
    restoreState(historyStack[historyIndex]);
  }
}

function restoreState(state) {
  isRestoring = true;
  
  inpText.value(state.text);
  
  if (selRatio.value() !== state.ratio) {
    selRatio.value(state.ratio);
    updateLayout();
  } else {
    selRatio.value(state.ratio);
  }
  
  selMode.value(state.mode);
  if (selFont) selFont.value(state.font);
  sliderSize.value(state.size);
  sliderParam1.value(state.p1);
  sliderParam2.value(state.p2);
  pickerText.value(state.cText);
  pickerBg.value(state.cBg);
  inpFilename.value(state.filename);
  selImageFormat.value(state.imageFormat);
  
  isRestoring = false;
  updateUndoRedoButtons();
}

function updateUndoRedoButtons() {
  if (btnUndo) {
    if (historyIndex > 0) {
      btnUndo.removeAttribute('disabled');
      btnUndo.style('opacity', '1');
      btnUndo.style('cursor', 'pointer');
    } else {
      btnUndo.attribute('disabled', '');
      btnUndo.style('opacity', '0.5');
      btnUndo.style('cursor', 'default');
    }
  }
  if (btnRedo) {
    if (historyIndex < historyStack.length - 1) {
      btnRedo.removeAttribute('disabled');
      btnRedo.style('opacity', '1');
      btnRedo.style('cursor', 'pointer');
    } else {
      btnRedo.attribute('disabled', '');
      btnRedo.style('opacity', '0.5');
      btnRedo.style('cursor', 'default');
    }
  }
}

// --- Interaction Logic ---

function keyPressed() {
  if (appState === 'intro') return;

  if (document.activeElement === inpText.elt || document.activeElement === inpFilename.elt) {
    return;
  }
  if (key === 's' || key === 'S') {
    startGifCountdown();
  }
  if ((keyIsDown(CONTROL) || keyIsDown(COMMAND))) {
    if (key === 'z' || key === 'Z') {
      if (keyIsDown(SHIFT)) redo();
      else undo();
    } else if (key === 'y' || key === 'Y') {
      redo();
    }
  }
}

// --- UI Construction with INLINE STYLES ---

function setupUI() {
  // HELPER: Apply common styles to standard inputs to avoid CSS classes
  const styleStandardInput = (elt) => {
    elt.style('display', 'block');
    elt.style('background-color', '#333');
    elt.style('color', 'white');
    elt.style('border', '1px solid #555');
    elt.style('border-radius', '4px');
    elt.style('padding', '6px');
    elt.style('width', '100%');
    elt.style('box-sizing', 'border-box');
    elt.style('font-family', 'sans-serif');
    elt.style('flex-shrink', '0');
    // Hover via JS
    elt.elt.addEventListener('mouseenter', () => elt.style('background-color', '#444'));
    elt.elt.addEventListener('mouseleave', () => elt.style('background-color', '#333'));
  };

  // Main Container for the scrolling sidebar
  sidebarBg = createDiv('');
  sidebarBg.id('sidebar');
  // INLINE STYLES FOR CONTAINER
  sidebarBg.style('position', 'fixed');
  sidebarBg.style('top', '0');
  sidebarBg.style('left', '0');
  sidebarBg.style('width', '320px');
  sidebarBg.style('height', '100vh');
  sidebarBg.style('background-color', '#222');
  sidebarBg.style('overflow-y', 'auto');
  sidebarBg.style('overflow-x', 'hidden');
  sidebarBg.style('z-index', '15');
  sidebarBg.style('padding', '60px 20px 50px 20px');
  sidebarBg.style('box-sizing', 'border-box');
  sidebarBg.style('display', 'flex');
  sidebarBg.style('flex-direction', 'column');
  sidebarBg.style('gap', '15px');
  
  // Toggle Button
  btnToggle = createButton(isSidebarOpen ? '✕' : '☰');
  btnToggle.position(10, 10); 
  btnToggle.size(30, 30);
  btnToggle.style('z-index', '20');
  btnToggle.style('background', '#444');
  btnToggle.style('color', '#fff');
  btnToggle.style('border', 'none');
  btnToggle.style('cursor', 'pointer');
  // Toggle Hover
  btnToggle.elt.addEventListener('mouseenter', () => btnToggle.style('background', '#666'));
  btnToggle.elt.addEventListener('mouseleave', () => btnToggle.style('background', '#444'));
  btnToggle.mousePressed(toggleSidebar);

  // Recording Overlay
  recordingOverlay = createDiv('');
  recordingOverlay.style('position', 'fixed');
  recordingOverlay.style('top', '50%');
  recordingOverlay.style('left', '50%');
  recordingOverlay.style('transform', 'translate(-50%, -50%)');
  recordingOverlay.style('color', '#ff3333');
  recordingOverlay.style('font-family', 'sans-serif');
  recordingOverlay.style('font-size', '64px');
  recordingOverlay.style('font-weight', 'bold');
  recordingOverlay.style('text-shadow', '2px 2px 8px rgba(0,0,0,0.8)');
  recordingOverlay.style('pointer-events', 'none'); 
  recordingOverlay.style('z-index', '9999'); 
  recordingOverlay.style('display', 'none'); 

  // Helper for Rows
  const createRow = () => {
    let d = createDiv('');
    d.parent(sidebarBg);
    d.style('display', 'flex');
    d.style('justify-content', 'space-between');
    d.style('gap', '10px');
    d.style('width', '100%');
    d.style('flex-shrink', '0');
    return d;
  };

  // Helper for Labels
  const addLabel = (txt) => {
    let s = createSpan(txt);
    s.parent(sidebarBg);
    s.style('color', '#888');
    s.style('font-size', '11px');
    s.style('text-transform', 'uppercase');
    s.style('letter-spacing', '1px');
    s.style('text-align', 'center');
    s.style('display', 'block');
    s.style('margin-top', '15px');
    s.style('margin-bottom', '5px');
    s.style('width', '100%');
    s.style('flex-shrink', '0');
  };

  // --- 1. Undo / Redo Buttons (Row) ---
  let rowUndo = createRow();
  btnUndo = createButton('↶ Undo');
  btnUndo.parent(rowUndo);
  styleStandardInput(btnUndo);
  btnUndo.style('flex', '1');
  btnUndo.mousePressed(undo);

  btnRedo = createButton('↷ Redo');
  btnRedo.parent(rowUndo);
  styleStandardInput(btnRedo);
  btnRedo.style('flex', '1');
  btnRedo.mousePressed(redo);

  // --- 2. Instructions ---
  let instrDiv = createDiv('If you move the cursor over the canvas, the text will change!');
  instrDiv.parent(sidebarBg);
  instrDiv.style('background-color', '#000');
  instrDiv.style('color', '#ccc');
  instrDiv.style('font-size', '12px');
  instrDiv.style('padding', '10px');
  instrDiv.style('text-align', 'center');
  instrDiv.style('border-radius', '5px');
  instrDiv.style('width', '100%');
  instrDiv.style('box-sizing', 'border-box');
  instrDiv.style('flex-shrink', '0');
  
  // --- 3. Text Input ---
  addLabel('TEXT');
  inpText = createElement('textarea', 'HELLO');
  inpText.parent(sidebarBg);
  styleStandardInput(inpText);
  inpText.style('height', '100px'); 
  inpText.style('resize', 'vertical'); 
  inpText.style('margin-bottom', '20px');
  inpText.elt.addEventListener('change', saveState);

  // --- 4. Aspect Ratio ---
  addLabel('CANVAS SIZE');
  selRatio = createSelect();
  selRatio.parent(sidebarBg);
  styleStandardInput(selRatio);
  selRatio.option('Fit Window');
  selRatio.option('1:1');
  selRatio.option('16:9');
  selRatio.option('9:16');
  selRatio.option('4:3');
  selRatio.changed(() => { updateLayout(); saveState(); });

  // --- 5. Mode Select ---
  addLabel('EFFECT MODE');
  selMode = createSelect();
  selMode.parent(sidebarBg);
  styleStandardInput(selMode);
  selMode.option('Sine Strips');
  selMode.option('Vertical Wave'); 
  selMode.option('Grid Elastic');
  selMode.option('Block Glitch'); 
  selMode.option('Mosaic'); 
  selMode.option('Bad TV'); 
  selMode.option('Liquid Mirror'); 
  selMode.option('Pixel Noise');
  selMode.changed(saveState);

  // --- 6. Font Selection ---
  addLabel('FONT FAMILY');
  selFont = createSelect();
  selFont.parent(sidebarBg);
  styleStandardInput(selFont);
  for(let f of fonts) {
    selFont.option(f);
  }
  selFont.changed(saveState);

  // --- 8. Sliders ---
  addLabel('FONT SIZE');
  sliderSize = createSlider(50, 300, 175);
  sliderSize.parent(sidebarBg);
  sliderSize.style('width', '100%'); // Basic override for slider
  sliderSize.changed(saveState);

  addLabel('DISTORTION / SPEED');
  sliderParam1 = createSlider(0, 100, 50);
  sliderParam1.parent(sidebarBg);
  sliderParam1.style('width', '100%');
  sliderParam1.changed(saveState);

  addLabel('INTENSITY / DENSITY');
  sliderParam2 = createSlider(0, 100, 50);
  sliderParam2.parent(sidebarBg);
  sliderParam2.style('width', '100%');
  sliderParam2.changed(saveState);

  // --- 9. Colors (Side by Side columns) ---
  let rowColors = createRow();
  
  // Col 1
  let col1 = createDiv('');
  col1.parent(rowColors);
  col1.style('display', 'flex');
  col1.style('flex-direction', 'column');
  col1.style('align-items', 'center');
  col1.style('flex', '1');
  col1.style('gap', '5px');

  let lblT = createSpan('Text Color');
  lblT.parent(col1);
  lblT.style('color', '#888');
  lblT.style('font-size', '11px');
  lblT.style('text-transform', 'uppercase');
  lblT.style('letter-spacing', '1px');
  
  pickerText = createColorPicker('#ffffff');
  pickerText.parent(col1);
  styleStandardInput(pickerText);
  pickerText.style('height', '30px'); // Fix picker height
  pickerText.style('padding', '2px');
  pickerText.changed(saveState);

  // Col 2
  let col2 = createDiv('');
  col2.parent(rowColors);
  col2.style('display', 'flex');
  col2.style('flex-direction', 'column');
  col2.style('align-items', 'center');
  col2.style('flex', '1');
  col2.style('gap', '5px');

  let lblB = createSpan('Canvas Color');
  lblB.parent(col2);
  lblB.style('color', '#888');
  lblB.style('font-size', '11px');
  lblB.style('text-transform', 'uppercase');
  lblB.style('letter-spacing', '1px');
  
  pickerBg = createColorPicker('#000000');
  pickerBg.parent(col2);
  styleStandardInput(pickerBg);
  pickerBg.style('height', '30px');
  pickerBg.style('padding', '2px');
  pickerBg.changed(saveState);

  // --- 11. Filename & Format (Row) ---
  addLabel('FILE NAME & FORMAT');
  let rowFile = createRow();
  
  inpFilename = createInput('my_animation');
  inpFilename.parent(rowFile);
  styleStandardInput(inpFilename);
  inpFilename.style('width', '65%'); 
  inpFilename.changed(saveState);

  selImageFormat = createSelect();
  selImageFormat.parent(rowFile);
  styleStandardInput(selImageFormat);
  selImageFormat.style('width', '30%'); 
  selImageFormat.option('JPG', 'jpg');
  selImageFormat.option('PNG', 'png');
  selImageFormat.changed(saveState);

  // --- 12. Save Buttons (Row) ---
  let rowSave = createRow();
  
  btnSaveImg = createButton('Save Image'); 
  btnSaveImg.parent(rowSave);
  styleStandardInput(btnSaveImg);
  btnSaveImg.style('flex', '1');
  btnSaveImg.mousePressed(saveImage); 

  btnSaveGif = createButton('Record GIF');
  btnSaveGif.parent(rowSave);
  styleStandardInput(btnSaveGif);
  btnSaveGif.style('flex', '1');
  btnSaveGif.mousePressed(startGifCountdown);
}

// --- Layout & Resizing Logic ---

function toggleSidebar() {
  isSidebarOpen = !isSidebarOpen;
  
  if (btnToggle) {
    btnToggle.html(isSidebarOpen ? '✕' : '☰');
  }
  
  if (sidebarBg) {
      sidebarBg.style('display', isSidebarOpen ? 'flex' : 'none');
  }
  
  updateLayout();
}

function updateLayout() {
  let sidebarW = 0; 
  let availW = windowWidth;
  let availH = windowHeight;
  
  let targetW = availW;
  let targetH = availH;
  
  let ratio = selRatio.value();
  
  if (appState === 'intro') {
     targetW = availW;
     targetH = availH;
  } else if (ratio !== 'Fit Window') {
    let aspect = 1;
    if (ratio === '16:9') aspect = 16/9;
    if (ratio === '9:16') aspect = 9/16;
    if (ratio === '4:3') aspect = 4/3;
    
    let pad = 40;
    let maxW = availW - pad;
    let maxH = availH - pad;
    
    targetW = maxW;
    targetH = targetW / aspect;
    
    if (targetH > maxH) {
      targetH = maxH;
      targetW = targetH * aspect;
    }
  }

  let finalW = floor(targetW);
  let finalH = floor(targetH);

  resizeCanvas(finalW, finalH);
  
  let posX = sidebarW + (availW - targetW) / 2;
  let posY = (availH - targetH) / 2;
  canvas.position(posX, posY);
  
  graphics = createGraphics(finalW, finalH);
  graphics.pixelDensity(1); 
  pixelDensity(1);
  graphics.textAlign(CENTER, CENTER);
  graphics.textStyle(BOLD);
  
  if (btnStartApp) {
      btnStartApp.position(windowWidth/2 - 100, windowHeight/2 - 30);
  }
}

function windowResized() {
  updateLayout();
}

// --- Effects Logic ---
const LOOP_FRAMES = 60; 

function effectSineStrips(p1, p2, scaleFactor) {
  let strips = 20 + floor(p2 * 80); 
  let stripHeight = height / strips;
  let amp = map(p1, 0, 1, 0, 150) * scaleFactor; 
  
  let freq = map(smoothMouseX, 0, width, 0.01, 0.1);
  if (smoothMouseX === 0) freq = 0.05;

  let currentFrame = isRecording ? (frameCount - recordingStartFrame) : frameCount;
  let t = (currentFrame * TWO_PI) / LOOP_FRAMES; 

  for (let y = 0; y < height; y += stripHeight) {
    let xShift = sin(y * freq + t) * amp;
    
    let sy = floor(y);
    let sh = ceil(stripHeight); 
    let dx = floor(xShift);

    copy(graphics, 0, sy, width, sh, dx, sy, width, sh);
  }
}

function effectVerticalWave(p1, p2, scaleFactor) {
  let strips = 20 + floor(p2 * 80); 
  let stripWidth = width / strips;
  let amp = map(p1, 0, 1, 0, 150) * scaleFactor;
  
  let freq = map(smoothMouseY, 0, height, 0.01, 0.1);
  if (smoothMouseY === 0) freq = 0.05;

  let currentFrame = isRecording ? (frameCount - recordingStartFrame) : frameCount;
  let t = (currentFrame * TWO_PI) / LOOP_FRAMES;

  for (let x = 0; x < width; x += stripWidth) {
    let yShift = sin(x * freq + t) * amp;
    
    let sx = floor(x);
    let sw = ceil(stripWidth);
    let dy = floor(yShift);
    
    copy(graphics, sx, 0, sw, height, sx, dy, sw, height);
  }
}

function effectBlockGlitch(p1, p2, scaleFactor) {
  let blocks = 10 + floor(p2 * 90); 
  let blockHeight = height / blocks;
  let amp = map(p1, 0, 1, 0, 200) * scaleFactor; 
  
  let currentFrame = isRecording ? (frameCount - recordingStartFrame) : frameCount;
  let t = (currentFrame * TWO_PI) / LOOP_FRAMES;

  for (let y = 0; y < height; y += blockHeight) {
    let n = noise(y * 0.05, 100 + 1.5 * cos(t), 100 + 1.5 * sin(t));
    let xShift = map(n, 0, 1, -amp, amp);
    
    copy(graphics, 0, floor(y), width, ceil(blockHeight), floor(xShift), floor(y), width, ceil(blockHeight));
  }
}

function effectMosaic(p1, p2, scaleFactor) {
  let tiles = floor(map(p2, 0, 1, 5, 50)); 
  let tileSize = width / tiles;
  let scatter = map(p1, 0, 1, 0, tileSize) * scaleFactor;
  
  let currentFrame = isRecording ? (frameCount - recordingStartFrame) : frameCount;
  let t = (currentFrame * TWO_PI) / LOOP_FRAMES;
  
  for (let y = 0; y < height; y += tileSize) {
    for (let x = 0; x < width; x += tileSize) {
      let n = noise(x * 0.05 + cos(t), y * 0.05 + sin(t));
      
      let sx = floor(x);
      let sy = floor(y);
      let sw = ceil(tileSize);
      let sh = ceil(tileSize);
      
      let dx = floor(x + map(n, 0, 1, -scatter, scatter));
      let dy = floor(y + map(n, 0, 1, -scatter, scatter));
      
      copy(graphics, sx, sy, sw, sh, dx, dy, sw, sh);
    }
  }
}

function effectBadTV(p1, p2, scaleFactor) {
  let blockH = map(p2, 0, 1, 2, 50) * scaleFactor;
  if(blockH < 1) blockH = 1;
  let amp = map(p1, 0, 1, 0, 100) * scaleFactor;
  
  let currentFrame = isRecording ? (frameCount - recordingStartFrame) : frameCount;
  let t = (currentFrame * TWO_PI) / LOOP_FRAMES;
  
  for (let y = 0; y < height; y += blockH) {
    let n = noise(y * 0.1, 100 + cos(t), 100 + sin(t)); 
    
    let distY = abs(y - smoothMouseY);
    let influence = 1;
    if (distY < 200 * scaleFactor) {
       influence = map(distY, 0, 200 * scaleFactor, 2, 1);
    }

    let xShift = map(n, 0, 1, -amp, amp) * influence;
    
    copy(graphics, 0, floor(y), width, ceil(blockH), floor(xShift), floor(y), width, ceil(blockH));
  }
}

function effectLiquidMirror(p1, p2, scaleFactor) {
  let h2 = floor(height/2);
  copy(graphics, 0, 0, width, h2, 0, 0, width, h2);
  
  let strips = 10 + floor(p2 * 50);
  let sh = (height/2) / strips;
  let amp = map(p1, 0, 1, 0, 100) * scaleFactor;

  let currentFrame = isRecording ? (frameCount - recordingStartFrame) : frameCount;
  let t = (currentFrame * TWO_PI) / LOOP_FRAMES; 
  
  for (let i = 0; i < strips; i++) {
    let ySrc = (height/2) - (i * sh); 
    let yDst = (height/2) + (i * sh); 
    
    let wave = sin(i * 0.2 + t + smoothMouseX * 0.01) * amp;
    
    copy(graphics, 0, floor(ySrc), width, ceil(sh), floor(wave), floor(yDst), width, ceil(sh));
  }
}

function effectGridElastic(p1, p2, cText, scaleFactor) {
  let baseTile = map(p2, 0, 1, 60, 15);
  let tileSize = baseTile * scaleFactor;
  tileSize = max(tileSize, 10); 
  
  let cols = floor(width / tileSize);
  let rows = floor(height / tileSize);

  fill(cText);
  noStroke();
  graphics.loadPixels();
  
  let gw = graphics.width;
  let gPixels = graphics.pixels;

  let currentFrame = isRecording ? (frameCount - recordingStartFrame) : frameCount;
  let t = (currentFrame * TWO_PI) / LOOP_FRAMES;
  
  let maxDist = 250 * scaleFactor;
  let maxDistSq = maxDist * maxDist; 
  let forceMult = p1 * 100 * scaleFactor;

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      let u = x * tileSize + tileSize / 2;
      let v = y * tileSize + tileSize / 2;

      let px = floor(u);
      let py = floor(v);

      if (px >= gw || py >= graphics.height) continue;

      let idx = 4 * (py * gw + px);
      let r = gPixels[idx];
      let g = gPixels[idx+1];
      let b = gPixels[idx+2];
      let bright = (r + g + b) / 3;

      if (bright > 20) {
        let finalX = u;
        let finalY = v;

        let dx = u - smoothMouseX;
        let dy = v - smoothMouseY;
        let distSq = dx*dx + dy*dy;
        
        if (distSq < maxDistSq && distSq > 0) {
           let d = Math.sqrt(distSq); 
           let force = map(d, 0, maxDist, forceMult, 0);
           
           finalX += (dx / d) * force;
           finalY += (dy / d) * force;
        }
        
        let wave = Math.sin(t + u * 0.02 + v * 0.02) * (tileSize * 0.3);
        finalX += wave;
        finalY += wave;

        let size = map(bright, 0, 255, 0, tileSize * 0.9);
        ellipse(finalX, finalY, size, size);
      }
    }
  }
}

function effectPixelNoise(p1, p2) {
  let tiles = map(p2, 0, 1, 50, 150);
  let tileSize = ceil(width / tiles);
  
  let currentFrame = isRecording ? (frameCount - recordingStartFrame) : frameCount;
  let t = (currentFrame * TWO_PI) / LOOP_FRAMES;
  
  let wScale = width / 1000;
  let scatter = map(p1, 0, 1, 0, 100) * wScale;

  graphics.loadPixels();

  for (let x = 0; x < width; x += tileSize) {
    for (let y = 0; y < height; y += tileSize) {
      let cx = floor(x + tileSize/2);
      let cy = floor(y + tileSize/2);
       
      if (cx >= width || cy >= height) continue;

      let index = 4 * (cy * width + cx);
      let r = graphics.pixels[index];
      let g = graphics.pixels[index + 1];
      let b = graphics.pixels[index + 2];
      let bright = (r + g + b) / 3;
       
      if (bright > 20) {
        let n = noise(x * 0.05 + cos(t), y * 0.05 + sin(t));
        let offsetX = floor(map(n, 0, 1, -scatter, scatter));
        let offsetY = floor(map(n, 0, 1, -scatter, scatter));
        copy(graphics, x, y, tileSize, tileSize, x + offsetX, y + offsetY, tileSize, tileSize);
      }
    }
  }
}

// --- Save Functions ---

function saveImage() {
  let fname = inpFilename.value() || 'kinetic_type';
  let ext = selImageFormat.value();
  saveCanvas(canvas, fname, ext);
}

function startGifCountdown() {
  if (isCountingDown) return; 
   
  if (isSidebarOpen) {
    toggleSidebar();
  }
   
  isCountingDown = true;
  countdownVal = 3; 
   
  let timer = setInterval(() => {
    countdownVal--;
     
    if (countdownVal <= 0) {
      clearInterval(timer);
      isCountingDown = false;
      
      isRecording = true;
      recordingStartFrame = frameCount;

      let fps = 30; 
      let totalFrames = 60; 
      let durationSec = totalFrames / fps;
       
      let fname = inpFilename.value() || 'kinetic_animation';
      fname = fname.replace(/\.gif$/i, ''); 

      console.log(`Starting recording: ${totalFrames} frames (~${durationSec.toFixed(1)}s at ${fps}fps)...`);
       
      frameRate(fps);
      pixelDensity(1);
      graphics.pixelDensity(1);

      saveGif(fname, totalFrames, {
        units: 'frames',
        delay: 33, 
        silent: true, 
        repeat: 0,
      }).then(() => {
        isRecording = false;
        console.log('Recording finished.');
         
        frameRate(60); 
        pixelDensity(1);
        graphics.pixelDensity(1);
      });
    }
  }, 1000); 
}