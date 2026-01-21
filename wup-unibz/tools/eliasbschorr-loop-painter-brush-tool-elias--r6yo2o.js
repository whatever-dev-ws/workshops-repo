let brushSelector;
let brushColorPicker, bgColorPicker;
let brushLoopCheck, bgLoopCheck; 
let mixButton, invertButton, clearButton, saveButton;
let mirrorMinusBtn, mirrorPlusBtn, mirrorLabel; 
let reverseMouseCheck; 
let toggleMenuBtn;    
let fsBtn;            

// Slider Gruppen
let sliders = {};
let uiElements = [];
let staticLabels = [];

// Canvas Buffer
let artLayer;

// Pinsel Physik (Smoothing)
let brushX = 0;
let brushY = 0;
let pBrushX = 0;
let pBrushY = 0;

// MENU CONFIG
const MENU_WIDTH = 260; 
const MENU_BG = '#1E1E1E';
let isMenuOpen = true;

// Button Config
const BTN_Y = 10;
const BTN_W = 30; 
const BTN_H = 30;

// Status
let isMixing = false;
let loopFrames = 180; 
let mirrorLevel = 0; 
let ignoreClick = false; // NEU: Verhindert Malen beim Umschalten

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);
  
  artLayer = createGraphics(width, height); 
  artLayer.clear(); 
  
  brushX = mouseX;
  brushY = mouseY;
  pBrushX = mouseX;
  pBrushY = mouseY;
  
  setupUI();
  repositionUI(); 
  
  background(MENU_BG);
}

function setupUI() {
  // --- 0. GLOBAL BUTTONS ---
  fsBtn = createButton('⛶');
  styleButton(fsBtn, '#333');
  fsBtn.size(30, 30);
  fsBtn.mousePressed(() => {
    let fs = fullscreen();
    fullscreen(!fs);
  });
  
  toggleMenuBtn = createButton('◀');
  styleButton(toggleMenuBtn, '#555');
  toggleMenuBtn.size(BTN_W, BTN_H); 
  toggleMenuBtn.mousePressed(toggleMenu);

  // --- 1. BRUSH & COLORS ---
  createLabel('BRUSH TYPE');
  
  brushSelector = createSelect();
  brushSelector.option('CIRCLE');
  brushSelector.option('CROSS');
  brushSelector.option('SPRAY');
  brushSelector.option('SLASH');
  brushSelector.option('ERASER'); 
  brushSelector.style('width', '210px');
  uiElements.push({ elt: brushSelector, h: 25 });

  reverseMouseCheck = createCheckbox('Reverse Input (Invert)', false);
  reverseMouseCheck.style('color', '#aaa').style('font-size', '11px');
  uiElements.push({ elt: reverseMouseCheck, h: 20 });

  createLabel('BRUSH COLOR');
  
  brushColorPicker = createColorPicker('#000000');
  brushColorPicker.style('width', '100px');
  brushColorPicker.input(() => brushLoopCheck.checked(false));
  
  brushLoopCheck = createCheckbox('Loop Color', false);
  brushLoopCheck.style('color', '#aaa').style('font-size', '10px');
  
  uiElements.push({ elt: brushColorPicker, h: 30, inline: brushLoopCheck, inlineOffset: 120 }); 

  createLabel('BACKGROUND');

  bgColorPicker = createColorPicker('#ffffff');
  bgColorPicker.style('width', '100px');
  bgColorPicker.input(() => bgLoopCheck.checked(false));

  bgLoopCheck = createCheckbox('Loop BG', false);
  bgLoopCheck.style('color', '#aaa').style('font-size', '10px');
  
  uiElements.push({ elt: bgColorPicker, h: 30, inline: bgLoopCheck, inlineOffset: 120 });

  // --- 2. SLIDERS (SIZE, SMOOTH, OPACITY) ---
  sliders.size   = createSliderGroup('SIZE', 2, 300, 20);
  sliders.smooth = createSliderGroup('SMOOTH', 1, 50, 10);
  sliders.alpha  = createSliderGroup('OPACITY', 1, 255, 255);

  // --- 3. SYMMETRY ---
  createLabel('SYMMETRY');
  
  mirrorMinusBtn = createButton('-');
  styleButton(mirrorMinusBtn, '#444');
  mirrorMinusBtn.size(30, 25);
  mirrorMinusBtn.mousePressed(() => { if(mirrorLevel > 0) mirrorLevel--; updateMirrorLabel(); });

  mirrorLabel = createSpan('OFF');
  mirrorLabel.style('color', '#fff').style('font-family', 'monospace').style('font-size', '11px');
  mirrorLabel.style('text-align', 'center').style('width', '50px').style('display', 'inline-block');

  mirrorPlusBtn = createButton('+');
  styleButton(mirrorPlusBtn, '#444');
  mirrorPlusBtn.size(30, 25);
  mirrorPlusBtn.mousePressed(() => { if(mirrorLevel < 3) mirrorLevel++; updateMirrorLabel(); });
  
  uiElements.push({ 
    elt: mirrorMinusBtn, 
    h: 30, 
    customGroup: [mirrorLabel, mirrorPlusBtn] 
  });

  // --- 4. ACTIONS ---
  createLabel('ACTIONS');
  
  mixButton = createButton('MIX IT!');
  styleButton(mixButton, '#E040FB'); 
  mixButton.style('width', '210px');
  mixButton.mousePressed(() => {
    isMixing = !isMixing;
    mixButton.html(isMixing ? 'STOP MIX' : 'MIX IT!');
  });
  uiElements.push({ elt: mixButton, h: 30 });

  invertButton = createButton('INVERT COLORS');
  styleButton(invertButton, '#FF9800'); 
  invertButton.style('width', '210px');
  invertButton.mousePressed(invertColors);
  uiElements.push({ elt: invertButton, h: 30 });

  clearButton = createButton('CLEAR CANVAS');
  styleButton(clearButton, '#555');
  clearButton.style('width', '210px');
  clearButton.mousePressed(() => {
    artLayer.clear(); 
    isMixing = false;
    mixButton.html('MIX IT!');
  });
  uiElements.push({ elt: clearButton, h: 30 });

  saveButton = createButton('SAVE PNG');
  styleButton(saveButton, '#007AFF');
  saveButton.style('width', '210px');
  saveButton.mousePressed(() => {
    let exportCanvas = createGraphics(width, height); 
    let currentBg = bgLoopCheck.checked() ? getRainbowColor(0.5) : bgColorPicker.color();
    exportCanvas.background(currentBg);
    exportCanvas.image(artLayer, 0, 0);
    save(exportCanvas, 'kaleidoscope_art.png');
  });
  uiElements.push({ elt: saveButton, h: 30 });
}

function toggleMenu() {
  ignoreClick = true; // WICHTIG: Blockiert das Malen für diesen Klick
  isMenuOpen = !isMenuOpen;
  repositionUI(); 
}

function mouseReleased() {
  ignoreClick = false; // Gibt das Malen wieder frei
}

function createLabel(txt) {
  let l = createP(txt);
  l.style('color', '#888').style('font-weight', 'bold').style('font-size', '10px').style('margin', '0');
  staticLabels.push({ elt: l, h: 15 });
  uiElements.push({ elt: l, h: 15, isLabel: true });
}

function updateMirrorLabel() {
  let labels = ["OFF", "VERT", "QUAD", "STAR"];
  mirrorLabel.html(labels[mirrorLevel]);
}

function repositionUI() {
  // 1. Toggle Button Positionierung
  if (isMenuOpen) {
    toggleMenuBtn.position(MENU_WIDTH - BTN_W - 10, BTN_Y);
    toggleMenuBtn.html('◀');
  } else {
    toggleMenuBtn.position(0, BTN_Y);
    toggleMenuBtn.html('▶');
  }
  
  // 2. Fullscreen Button
  if (isMenuOpen) {
      fsBtn.position(10, BTN_Y);
      fsBtn.show();
  } else {
      fsBtn.hide(); 
  }

  // 3. Restliche Menü Elemente
  let currentY = 50; 
  let leftPad = 20;

  for (let item of uiElements) {
    if (isMenuOpen) {
      item.elt.show();
      item.elt.position(leftPad, currentY);
      
      if (item.inline) {
        item.inline.show();
        let offset = item.inlineOffset || 110;
        item.inline.position(leftPad + offset, currentY + 5);
      }
      
      if (item.customGroup) {
        let xOff = 40;
        for(let g of item.customGroup) {
           g.show();
           g.position(leftPad + xOff, currentY + 2); 
           xOff += 60;
        }
      }
      currentY += item.h + 10; 
    } else {
      item.elt.hide();
      if (item.inline) item.inline.hide();
      if (item.customGroup) {
        for(let g of item.customGroup) g.hide();
      }
    }
  }
}

function draw() {
  // 1. AUTOMATION
  let progress = (frameCount % loopFrames) / loopFrames;
  let sinVal = sin(progress * TWO_PI); 
  let isAnyLoopActive = false;

  for (let key in sliders) {
    let s = sliders[key];
    if (s.check.checked()) {
      isAnyLoopActive = true;
      let autoVal = map(sinVal, -1, 1, s.min, s.max);
      s.slider.value(autoVal);
    }
  }
  if (isAnyLoopActive) updateLabels();

  // 2. COLORS
  let currentBrushColor, currentBgColor;
  if (brushLoopCheck.checked()) currentBrushColor = getRainbowColor(0);
  else currentBrushColor = brushColorPicker.color();

  if (bgLoopCheck.checked()) currentBgColor = getRainbowColor(0.5);
  else currentBgColor = bgColorPicker.color();

  // 3. TARGET CALCULATION
  let targetX, targetY;
  
  if (reverseMouseCheck.checked()) {
    targetX = width - mouseX;
    targetY = height - mouseY;
  } else {
    targetX = mouseX;
    targetY = mouseY;
  }

  // --- 4. PROTECTION LOGIC ---
  let isSafeToDraw = true;

  if (isMenuOpen) {
      // Wenn Menü offen: Nicht malen, wenn Maus im Menübereich ist
      if (mouseX < MENU_WIDTH) isSafeToDraw = false;
  } else {
      // Wenn Menü zu: Nicht malen, wenn Maus auf dem "Öffnen"-Button ist
      if (mouseX < BTN_W + 10 && mouseY < BTN_Y + BTN_H + 10) isSafeToDraw = false;
  }

  // Wenn wir gerade einen UI-Knopf geklickt haben (z.B. Menü Toggle), verbieten wir das Malen
  if (ignoreClick) isSafeToDraw = false;

  // Smoothing Logic
  let smoothVal = map(sliders.smooth.slider.value(), 1, 50, 1.0, 0.05);
  
  if (mouseIsPressed && isSafeToDraw && !isMixing) {
      brushX = lerp(brushX, targetX, smoothVal);
      brushY = lerp(brushY, targetY, smoothVal);
  } else {
      brushX = targetX;
      brushY = targetY;
      pBrushX = targetX;
      pBrushY = targetY;
  }

  // 5. DRAWING
  if (mouseIsPressed && isSafeToDraw && !isMixing) {
    let mode = brushSelector.value();
    let sz = sliders.size.slider.value();
    let opacity = sliders.alpha.slider.value();
    
    let autoSpacing = max(1, sz * 0.1); 

    let finalCol;
    if (mode === 'ERASER') {
      finalCol = color(0); 
    } else {
      let r = red(currentBrushColor);
      let g = green(currentBrushColor);
      let b = blue(currentBrushColor);
      finalCol = color(r, g, b, opacity);
    }
    
    let d = dist(brushX, brushY, pBrushX, pBrushY);

    if (d > 0) {
        let stepSize = autoSpacing / d; 
        if (d < autoSpacing) {
             applySymmetryDrawing(mode, brushX, brushY, sz, finalCol);
        } else {
             for (let t = 0; t <= 1; t += stepSize) {
                 let x = lerp(pBrushX, brushX, t);
                 let y = lerp(pBrushY, brushY, t);
                 applySymmetryDrawing(mode, x, y, sz, finalCol);
             }
        }
    } else {
        applySymmetryDrawing(mode, brushX, brushY, sz, finalCol);
    }
  }

  // 6. RENDER
  if (isMixing) mixArt();

  background(currentBgColor);
  image(artLayer, 0, 0);
  
  // UI Layer
  if (isMenuOpen) {
    noStroke();
    fill(MENU_BG); 
    rect(0, 0, MENU_WIDTH, height);
    stroke(50);
    line(MENU_WIDTH, 0, MENU_WIDTH, height);
  }
  
  // Cursor Feedback (zeigen wir an, solange wir nicht auf Buttons sind)
  if (isSafeToDraw) {
    noFill();
    stroke(255);
    strokeWeight(1);
    
    ellipse(mouseX, mouseY, 5);
    
    stroke(255, 150);
    ellipse(brushX, brushY, sliders.size.slider.value());
    
    if (reverseMouseCheck.checked()) {
       stroke(255, 50);
       line(mouseX, mouseY, brushX, brushY);
    }
  }
  
  pBrushX = brushX;
  pBrushY = brushY;
}

function applySymmetryDrawing(mode, x, y, sz, col) {
  let cx = width / 2;
  let cy = height / 2;
  let rx = x - cx;
  let ry = y - cy;
  
  let points = [];
  points.push({x: rx, y: ry});
  
  if (mirrorLevel >= 1) points.push({x: -rx, y: ry}); 
  if (mirrorLevel >= 2) {
    let len = points.length;
    for(let i=0; i<len; i++) points.push({x: points[i].x, y: -points[i].y});
  }
  if (mirrorLevel >= 3) {
    let len = points.length;
    for(let i=0; i<len; i++) points.push({x: points[i].y, y: points[i].x});
  }
  
  for (let p of points) {
    drawShape(mode, cx + p.x, cy + p.y, sz, col);
  }
}

function drawShape(mode, x, y, sz, col) {
  artLayer.push();
  if (mode === 'ERASER') {
    artLayer.erase();
    artLayer.noStroke();
    artLayer.fill(255); 
    artLayer.circle(x, y, sz);
    artLayer.noErase();
  } 
  else {
      if (mode === 'CIRCLE') {
        artLayer.noStroke();
        artLayer.fill(col);
        artLayer.circle(x, y, sz);
      } 
      else if (mode === 'CROSS') {
        artLayer.stroke(col);
        artLayer.strokeWeight(sz / 5); 
        artLayer.noFill();
        artLayer.line(x - sz/2, y, x + sz/2, y); 
        artLayer.line(x, y - sz/2, x, y + sz/2); 
      }
      else if (mode === 'SLASH') {
        artLayer.stroke(col);
        artLayer.strokeWeight(sz / 4);
        artLayer.noFill();
        artLayer.line(x - sz/2, y + sz/2, x + sz/2, y - sz/2);
      }
      else if (mode === 'SPRAY') {
        artLayer.stroke(col);
        artLayer.strokeWeight(1); 
        for (let i = 0; i < sz; i++) {
          artLayer.point(x + randomGaussian(0, sz/4), y + randomGaussian(0, sz/4));
        }
      }
  }
  artLayer.pop();
}

function getRainbowColor(offset) {
  push();
  colorMode(HSB, 360, 100, 100);
  let c = color(map(((frameCount % loopFrames) / loopFrames + offset) % 1, 0, 1, 0, 360), 80, 100);
  pop();
  return c;
}

function invertColors() {
    artLayer.loadPixels();
    for (let i = 0; i < artLayer.pixels.length; i += 4) {
        if (artLayer.pixels[i+3] > 0) { 
            artLayer.pixels[i]     = 255 - artLayer.pixels[i];       
            artLayer.pixels[i + 1] = 255 - artLayer.pixels[i + 1]; 
            artLayer.pixels[i + 2] = 255 - artLayer.pixels[i + 2]; 
        }
    }
    artLayer.updatePixels();
}

function mixArt() {
  artLayer.loadPixels();
  let scale = 0.005, speed = frameCount * 0.01, strength = 3; 
  let w = artLayer.width, h = artLayer.height;
  let tempPixels = new Uint8ClampedArray(artLayer.pixels);

  for (let y = 0; y < h; y+=1) {
    for (let x = 0; x < w; x+=1) {
      let angle = noise(x * scale, y * scale, speed) * TWO_PI * 2;
      let targetIndex = (y * w + x) * 4;
      let srcX = Math.floor(x - cos(angle) * strength);
      let srcY = Math.floor(y - sin(angle) * strength);
      if (srcX >= 0 && srcX < w && srcY >= 0 && srcY < h) {
          let sourceIndex = (srcY * w + srcX) * 4;
          artLayer.pixels[targetIndex] = tempPixels[sourceIndex];       
          artLayer.pixels[targetIndex + 1] = tempPixels[sourceIndex + 1]; 
          artLayer.pixels[targetIndex + 2] = tempPixels[sourceIndex + 2]; 
          artLayer.pixels[targetIndex + 3] = tempPixels[sourceIndex + 3]; 
      }
    }
  }
  artLayer.updatePixels();
}

function createSliderGroup(labelName, min, max, val) {
  let lab = createP(labelName + ': ' + val);
  lab.style('color', '#aaa').style('font-size', '10px').style('margin', '0');
  uiElements.push({ elt: lab, h: 15 });

  let sld = createSlider(min, max, val, 1).style('width', '150px'); 
  sld.input(() => updateLabels()); 
  
  let chk = createCheckbox('Loop', false);
  chk.style('color', '#555').style('font-size', '10px');
  
  uiElements.push({ elt: sld, h: 20, inline: chk, inlineOffset: 160 });

  return { slider: sld, label: lab, check: chk, min: min, max: max, name: labelName };
}

function updateLabels() {
  for (let key in sliders) {
    sliders[key].label.html(sliders[key].name + ': ' + Math.floor(sliders[key].slider.value()));
  }
}

function styleButton(btn, col) {
  btn.style('background', col).style('color', '#fff').style('border', 'none')
      .style('padding', '5px 10px').style('border-radius', '4px').style('cursor', 'pointer');
}

function keyPressed() { if (key === 'f' || key === 'F') fullscreen(!fullscreen()); }

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  let oldImg = artLayer.get();
  artLayer = createGraphics(windowWidth, windowHeight);
  artLayer.image(oldImg, 0, 0);
  repositionUI();
}