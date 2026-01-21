// WUP 2025-2026 
// Nibir Khan

let bgPicker1, bgPicker2, bgPicker3, textPicker, shadowPicker, strokePicker;
let sizeSlider, rotateSlider, shadowAlphaSlider, speedSlider;
let pixelSlider, waveAmpSlider, shearSlider, halftoneSlider;
let stretchSlider, jitterSlider;
let fontSelect, textInBar, repeatToggle, gradDirToggle, shadowToggle;
let pg, uiContainer; 
let toolbarWidth = 280;

let returnOverlay; 
let isRecording = false;

function setup() {
  pixelDensity(1); 
  createCanvas(windowWidth, windowHeight);
  
  // Art Buffer
  pg = createGraphics(windowWidth - toolbarWidth, windowHeight);
  pg.pixelDensity(1);
  
  // --- 1. UI CONTAINER (FIXED SIDEBAR) ---
  uiContainer = createDiv('');
  uiContainer.style('position', 'fixed');
  uiContainer.style('top', '0');
  uiContainer.style('left', '0');
  uiContainer.style('width', toolbarWidth + 'px');
  uiContainer.style('height', '100%');
  uiContainer.style('overflow-y', 'auto');
  uiContainer.style('background-color', '#ffffff');
  uiContainer.style('border-right', '1px solid #ddd');
  uiContainer.style('padding', '20px');
  uiContainer.style('box-sizing', 'border-box');
  uiContainer.style('z-index', '100');
  uiContainer.style('font-family', 'sans-serif');

  // Load Fonts
  const fontLink = document.createElement('link');
  fontLink.href = 'https://fonts.googleapis.com/css2?family=Bungee&family=Monoton&family=Press+Start+2P&family=Righteous&family=Permanent+Marker&family=Fascinate+Inline&family=Orbitron:wght@900&display=swap';
  fontLink.rel = 'stylesheet';
  document.head.appendChild(fontLink);
  
  function makeLabel(txt, isHeader = false) {
    let lbl = createP(txt);
    lbl.parent(uiContainer);
    lbl.style('margin', isHeader ? '25px 0 10px 0' : '10px 0 5px 0');
    lbl.style('font-size', isHeader ? '14px' : '11px');
    lbl.style('font-weight', isHeader ? 'bold' : 'normal');
    if (isHeader) lbl.style('border-bottom', '1px solid #eee');
  }

  // --- 2. ADD UI ELEMENTS ---
  makeLabel('📝 1. CONTENT', true);
  textInBar = createInput('SKIBIDI');
  textInBar.parent(uiContainer);
  textInBar.style('width', '100%');
  
  repeatToggle = createCheckbox(' REPEAT GRID', true);
  repeatToggle.parent(uiContainer);

  makeLabel('✒️ 2. TYPOGRAPHY', true);
  fontSelect = createSelect();
  fontSelect.parent(uiContainer);
  fontSelect.style('width', '100%');
  ['Orbitron', 'Fascinate Inline', 'Permanent Marker', 'Bungee', 'Monoton', 'Press Start 2P', 'Righteous'].forEach(f => fontSelect.option(f));

  makeLabel('Size');
  sizeSlider = createSlider(10, 500, 80); sizeSlider.parent(uiContainer).style('width', '100%');
  
  makeLabel('Rotate');
  rotateSlider = createSlider(0, TWO_PI, 0, 0.01); rotateSlider.parent(uiContainer).style('width', '100%');
  
  makeLabel('Shear');
  shearSlider = createSlider(-1, 1, 0, 0.01); shearSlider.parent(uiContainer).style('width', '100%');

  makeLabel('Stretch');
  stretchSlider = createSlider(0.5, 3.0, 1.0, 0.1); stretchSlider.parent(uiContainer).style('width', '100%');

  makeLabel('🏃 3. MOTION', true);
  makeLabel('Speed');
  speedSlider = createSlider(0, 0.5, 0.1, 0.01); speedSlider.parent(uiContainer).style('width', '100%');
  
  makeLabel('Wave');
  waveAmpSlider = createSlider(0, 200, 50); waveAmpSlider.parent(uiContainer).style('width', '100%');

  makeLabel('Jitter');
  jitterSlider = createSlider(0, 50, 0); jitterSlider.parent(uiContainer).style('width', '100%');

  makeLabel('✨ 4. ADVANCED FX', true);
  makeLabel('Pixelation');
  pixelSlider = createSlider(1, 60, 1); pixelSlider.parent(uiContainer).style('width', '100%');
  
  makeLabel('Halftone Dots');
  halftoneSlider = createSlider(0, 20, 0); halftoneSlider.parent(uiContainer).style('width', '100%');

  makeLabel('🎨 5. COLORS', true);
  let cpRow = createDiv('');
  cpRow.parent(uiContainer).style('display', 'flex').style('gap', '5px');
  bgPicker1 = createColorPicker('#000000'); bgPicker1.parent(cpRow);
  bgPicker2 = createColorPicker('#1a1a1a'); bgPicker2.parent(cpRow);
  bgPicker3 = createColorPicker('#000000'); bgPicker3.parent(cpRow);
  
  gradDirToggle = createCheckbox(' HORIZ. GRADIENT', false);
  gradDirToggle.parent(uiContainer).style('margin-top', '10px');

  makeLabel('Text / Stroke / Shadow');
  let cpRow2 = createDiv('');
  cpRow2.parent(uiContainer).style('display', 'flex').style('gap', '5px');
  textPicker = createColorPicker('#ffffff'); textPicker.parent(cpRow2);
  strokePicker = createColorPicker('#00ffcc'); strokePicker.parent(cpRow2);
  shadowPicker = createColorPicker('#ff0055'); shadowPicker.parent(cpRow2);

  shadowToggle = createCheckbox(' ENABLE SHADOW', false);
  shadowToggle.parent(uiContainer).style('margin-top', '10px');
  
  makeLabel('Shadow Opacity');
  shadowAlphaSlider = createSlider(0, 255, 127); shadowAlphaSlider.parent(uiContainer).style('width', '100%');

  makeLabel('💾 6. EXPORT', true);
  let saveBtn = createButton('SAVE PNG');
  saveBtn.parent(uiContainer).style('width', '100%').style('padding', '10px').style('cursor', 'pointer').style('margin-bottom', '5px');
  saveBtn.mousePressed(saveImage);

  let gifBtn = createButton('🔴 EXPORT 3s GIF');
  gifBtn.parent(uiContainer).style('width', '100%').style('padding', '10px').style('background', '#ff4757').style('color', 'white').style('border', 'none').style('font-weight', 'bold').style('cursor', 'pointer');
  gifBtn.mousePressed(recordGif);

  setupOverlay();
}

function setupOverlay() {
  returnOverlay = createDiv('');
  returnOverlay.style('position', 'fixed').style('top', '0').style('left', '0').style('width', '100%').style('height', '100%').style('background', 'rgba(0,0,0,0.9)').style('z-index', '9999').style('display', 'none').style('flex-direction', 'column').style('align-items', 'center').style('justify-content', 'center');

  let msg = createP('GIF PROCESS COMPLETE');
  msg.parent(returnOverlay).style('color', 'white').style('font-family', 'sans-serif').style('margin-bottom', '20px');

  let backBtn = createButton('🔙 GO BACK TO TOOL');
  backBtn.parent(returnOverlay).style('padding', '15px 30px').style('font-size', '16px').style('cursor', 'pointer').style('border-radius', '5px').style('border', 'none');
  backBtn.mousePressed(() => {
    returnOverlay.style('display', 'none'); 
    uiContainer.show();    
    resizeCanvas(windowWidth, windowHeight); 
    isRecording = false;
  });
}

function updateArt() {
  // Safety check to prevent "undefined" errors on first frame
  if (!bgPicker1 || !sizeSlider || !textInBar) return;

  pg.push();
  draw3StopGradient(bgPicker1.color(), bgPicker2.color(), bgPicker3.color(), gradDirToggle.checked());
  
  if (halftoneSlider.value() > 0) applyHalftone(halftoneSlider.value());

  pg.textAlign(CENTER, CENTER);
  pg.textFont(fontSelect.value());
  pg.textSize(sizeSlider.value());

  let txt = textInBar.value();
  let spd = speedSlider.value();

  if (repeatToggle.checked()) {
    for (let y = 100; y < pg.height + 150; y += 150) {
      for (let x = 125; x < pg.width + 250; x += 250) {
        let wavyY = y + sin(x * 0.01 + frameCount * spd) * waveAmpSlider.value();
        let jitX = random(-jitterSlider.value(), jitterSlider.value());
        drawAdvText(txt, x + jitX, wavyY);
      }
    }
  } else {
    let centerY = pg.height/2 + sin(frameCount * spd) * waveAmpSlider.value();
    drawAdvText(txt, pg.width/2, centerY);
  }

  // Pixelation FX
  if (pixelSlider.value() > 1) {
    let p = int(pixelSlider.value());
    let w = int(pg.width / p);
    let h = int(pg.height / p);
    if (w > 0 && h > 0) {
      pg.copy(0, 0, pg.width, pg.height, 0, 0, w, h);
      pg.copy(0, 0, w, h, 0, 0, pg.width, pg.height);
    }
  }
  pg.pop();
}

function draw() {
  background(255);
  updateArt(); 
  if (!isRecording) {
    image(pg, toolbarWidth, 0); 
  } else {
    image(pg, 0, 0);
  }
}

function recordGif() {
  if (isRecording) return;
  isRecording = true;
  uiContainer.hide();
  resizeCanvas(pg.width, pg.height);
  
  setTimeout(() => { returnOverlay.style('display', 'flex'); }, 4500);

  saveGif('kinetic_type', 3, {
    units: 'seconds',
    silent: true,
    onComplete: () => { returnOverlay.style('display', 'flex'); }
  });
}

function draw3StopGradient(c1, c2, c3, horizontal) {
  for (let i = 0; i <= (horizontal ? pg.width : pg.height); i++) {
    let inter = i / (horizontal ? pg.width : pg.height);
    let c = inter < 0.5 ? lerpColor(color(c1), color(c2), inter * 2) : lerpColor(color(c2), color(c3), (inter - 0.5) * 2);
    pg.stroke(c);
    if (horizontal) pg.line(i, 0, i, pg.height); else pg.line(0, i, pg.width, i);
  }
}

function applyHalftone(sz) {
  pg.fill(0, 40); pg.noStroke();
  for (let x = 0; x < pg.width; x += sz * 2) {
    for (let y = 0; y < pg.height; y += sz * 2) {
      pg.ellipse(x, y, sz, sz);
    }
  }
}

function drawAdvText(m, x, y) {
  pg.push();
  pg.translate(x, y);
  pg.rotate(rotateSlider.value());
  pg.shearX(shearSlider.value());
  pg.scale(1.0, stretchSlider.value());
  
  if (shadowToggle.checked()) {
    pg.noStroke(); 
    let c = color(shadowPicker.color());
    c.setAlpha(shadowAlphaSlider.value());
    pg.fill(c);
    pg.text(m, 5, 5);
  }
  
  pg.fill(textPicker.color());
  pg.stroke(strokePicker.color());
  pg.strokeWeight(2);
  pg.text(m, 0, 0);
  pg.pop();
}

function saveImage() { save(pg, 'export.png'); }

function windowResized() {
  if (!isRecording) {
    resizeCanvas(windowWidth, windowHeight);
    pg = createGraphics(windowWidth - toolbarWidth, windowHeight);
  }
}