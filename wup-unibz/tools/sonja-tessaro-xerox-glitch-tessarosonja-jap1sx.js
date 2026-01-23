/**
 XEROX GLITCH TOOL (Inline Style Compatible Version)
 TESSARO SONJA
 WUP 2025/26
 */

// --- GLOBAL VARIABLES ---
// Layers
let sourceLayer;      // Invisible: Where the live text exists
let outputLayer;      // Invisible: The accumulator for the scan slices
let finalCompLayer;   // Invisible: Where effects are composed
let noiseTexture;     // Pre-generated noise layer

// Data Recording (For Vector Export)
let scanHistory = []; 

// State
let textX, textY;
let scanPos = 0;      
let isScanning = false; 
let isPaused = false;
let isDarkMode = true;

// UI & Layout
let sidebarWidth = 280;
let canvasW, canvasH;
let ui = {}; 
let uiElements = []; // Store references for theme updating
let fonts = [
  'Helvetica Neue', 'Arial Black', 'Georgia', 'Courier New', 'Impact', 
  'Verdana', 'Times New Roman', 'Trebuchet MS', 'Comic Sans MS', 'Lucida Console'
];

// --- THEME DEFINITIONS (JS instead of CSS) ---
const themeColors = {
  dark: {
    bg: '#1a1a1a', text: '#eeeeee', sidebar: '#222222', 
    input: '#333333', border: '#444444', accent: '#00e676', accentHover: '#00c853'
  },
  light: {
    bg: '#e0e0e0', text: '#222222', sidebar: '#ffffff', 
    input: '#f0f0f0', border: '#cccccc', accent: '#2979ff', accentHover: '#2962ff'
  }
};

function setup() {
  // 1. Layout Container
  // We use a main container to manage flexbox layout inline
  let mainContainer = createDiv().id('main-container');
  mainContainer.style('display', 'flex');
  mainContainer.style('width', '100vw');
  mainContainer.style('height', '100vh');
  mainContainer.style('overflow', 'hidden');
  mainContainer.style('margin', '0');
  mainContainer.style('padding', '0');

  // 2. Sidebar
  let sidebar = createDiv().id('sidebar');
  sidebar.parent(mainContainer);
  // Inline styles for Sidebar
  sidebar.style('width', sidebarWidth + 'px');
  sidebar.style('flex-shrink', '0');
  sidebar.style('padding', '20px');
  sidebar.style('overflow-y', 'auto');
  sidebar.style('display', 'flex');
  sidebar.style('flex-direction', 'column');
  sidebar.style('gap', '10px');
  sidebar.style('font-family', 'Helvetica Neue, sans-serif');
  sidebar.style('font-size', '13px');
  sidebar.style('border-right', '1px solid #444'); // Initial color
  sidebar.style('box-sizing', 'border-box'); // Crucial for padding

  // 3. Canvas Wrapper
  let canvasWrapper = createDiv().id('canvas-wrapper');
  canvasWrapper.parent(mainContainer);
  canvasWrapper.style('flex-grow', '1');
  canvasWrapper.style('position', 'relative');
  canvasWrapper.style('display', 'flex');
  canvasWrapper.style('justify-content', 'center');
  canvasWrapper.style('align-items', 'center');
  canvasWrapper.style('overflow', 'hidden');

  // Status Overlay (Styled Inline)
  let status = createDiv('Paused').id('status-overlay').parent(canvasWrapper);
  status.style('position', 'absolute');
  status.style('top', '20px');
  status.style('left', '50%');
  status.style('transform', 'translateX(-50%)');
  status.style('background', 'rgba(0,0,0,0.6)');
  status.style('color', '#fff');
  status.style('padding', '5px 15px');
  status.style('border-radius', '20px');
  status.style('pointer-events', 'none');
  status.style('font-size', '11px');
  status.style('font-family', 'sans-serif');
  status.style('opacity', '0');
  status.style('transition', 'opacity 0.3s');

  // 4. Create Canvas
  canvasW = windowWidth - sidebarWidth;
  canvasH = windowHeight;
  let cnv = createCanvas(canvasW, canvasH);
  cnv.parent('canvas-wrapper');
  pixelDensity(1);

  // Initialize Layers
  sourceLayer = createGraphics(width, height);
  sourceLayer.textAlign(CENTER, CENTER);
  sourceLayer.noStroke();
  outputLayer = createGraphics(width, height);
  finalCompLayer = createGraphics(width, height);

  generateNoiseTexture();
  
  // Build UI with Inline Styles
  buildInterface(sidebar);
  
  // Apply initial theme
  applyTheme();

  // Initial Placement
  textX = width / 2;
  textY = height / 2;
  
  resetScan();
  isScanning = false;
  isPaused = false; 
  updateStatus("READY. POSITION TEXT & PRESS START");
}

function draw() {
  // Input Handling
  if (mouseIsPressed && mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) {
    textX += (mouseX - pmouseX);
    textY += (mouseY - pmouseY);
  }

  // Draw Source
  sourceLayer.clear();
  sourceLayer.push();
  sourceLayer.translate(textX, textY);
  sourceLayer.rotate(radians(ui.sliderRot.value()));
  let sX = ui.chkMirrorX.checked() ? -1 : 1;
  let sY = ui.chkMirrorY.checked() ? -1 : 1;
  sourceLayer.scale(sX, sY);
  sourceLayer.textSize(ui.sliderSize.value());
  sourceLayer.textFont(ui.selFont.value());
  
  let currentFill = color(255);
  if (ui.chkRainbow.checked()) {
    sourceLayer.colorMode(HSB);
    currentFill = color((frameCount * 2) % 360, 80, 100);
    sourceLayer.fill(currentFill);
    sourceLayer.colorMode(RGB);
  } else {
    sourceLayer.fill(255);
  }
  sourceLayer.text(ui.inpText.value(), 0, 0);
  sourceLayer.pop();

  // Scanning Loop
  let dir = ui.selDir.value();
  let limit = (dir === 'Vertical') ? height : width;

  if (isScanning && !isPaused) {
    updateStatus("SCANNING... DRAG TEXT NOW!");
    let speed = ui.sliderSpeed.value();
    
    for (let i = 0; i < speed; i++) {
      if (scanPos < limit) {
        if (dir === 'Vertical') {
          outputLayer.image(sourceLayer, 0, scanPos, width, 1, 0, scanPos, width, 1);
        } else {
          outputLayer.image(sourceLayer, scanPos, 0, 1, height, scanPos, 0, 1, height);
        }

        let recColor = ui.chkRainbow.checked() ? '#' + hex(currentFill.levels[0],2) + hex(currentFill.levels[1],2) + hex(currentFill.levels[2],2) : ui.colText.value();
        
        scanHistory.push({
            pos: scanPos, dir: dir,
            tx: textX, ty: textY,
            rot: ui.sliderRot.value(), sx: sX, sy: sY,
            txt: ui.inpText.value(), fSize: ui.sliderSize.value(),
            font: ui.selFont.value(), col: recColor
        });

        scanPos++;
      } else {
        isScanning = false;
        updateStatus("DONE. EXPORT OR RESET.");
      }
    }
  } else if (isPaused && isScanning) {
    updateStatus("PAUSED (SPACEBAR TO RESUME)");
  }

  composeFinalImage();

  background(ui.colBg.value());
  image(finalCompLayer, 0, 0);

  // Overlays
  push();
  if (ui.chkRainbow.checked()) drawingContext.globalAlpha = 0.3;
  else {
      tint(ui.colText.value());
      drawingContext.globalAlpha = 0.2;
  }
  image(sourceLayer, 0, 0);
  pop();

  let lineCol = isPaused ? color(255, 255, 0) : (isDarkMode ? color(0, 255, 100) : color(0, 100, 255));
  stroke(lineCol);
  strokeWeight(2);
  if (isPaused || !isScanning) drawingContext.setLineDash([5, 5]);
  
  let dPos = isScanning ? scanPos : (scanPos > 0 ? scanPos : 0);
  if (dir === 'Vertical') line(0, dPos, width, dPos);
  else line(dPos, 0, dPos, height);
  drawingContext.setLineDash([]);
}

// --- LOGIC FUNCTIONS (Unchanged logic, just keeping structure) ---

function keyPressed() {
  if (key === ' ') {
    if (isScanning) togglePause();
    else if (scanPos === 0) startScan();
    return false;
  }
  if (keyCode === ENTER) {
    resetScan();
    startScan();
  }
  if (key === 'r' || key === 'R') {
    ui.sliderRot.elt.value = 0;
    ui.sliderRot.elt.dispatchEvent(new Event('input'));
  }
}

function composeFinalImage() {
  finalCompLayer.clear();
  let caAmount = ui.sliderAb.value();
  let noiseAmt = ui.sliderNoise.value();
  let threshAmt = ui.sliderThresh.value();
  let blurAmt = ui.sliderBlur.value();
  let invertMode = ui.chkInvert.checked();
  let textColor = color(ui.colText.value());
  let isRainbow = ui.chkRainbow.checked();

  finalCompLayer.push();
  if (isRainbow) {
     finalCompLayer.blendMode(BLEND);
     finalCompLayer.tint(255, 150);
     if(caAmount > 0) finalCompLayer.image(outputLayer, -caAmount, 0);
     if(caAmount > 0) finalCompLayer.image(outputLayer, caAmount, 0);
     finalCompLayer.tint(255, 255);
     finalCompLayer.image(outputLayer, 0, 0);
  } else {
     finalCompLayer.blendMode(ADD);
     finalCompLayer.tint(red(textColor), 0, 0);
     finalCompLayer.image(outputLayer, -caAmount, 0);
     finalCompLayer.tint(0, green(textColor), 0);
     finalCompLayer.image(outputLayer, 0, 0);
     finalCompLayer.tint(0, 0, blue(textColor));
     finalCompLayer.image(outputLayer, caAmount, 0);
  }
  finalCompLayer.pop();

  if (noiseAmt > 0) {
      finalCompLayer.push();
      finalCompLayer.blendMode(MULTIPLY); 
      finalCompLayer.tint(255, map(noiseAmt,0,100,0,180));
      finalCompLayer.image(noiseTexture, 0,0);
      finalCompLayer.pop();
  }

  if (blurAmt > 0) finalCompLayer.filter(BLUR, map(blurAmt, 0, 100, 0, 10));

  if (threshAmt > 0) {
      finalCompLayer.filter(THRESHOLD, map(threshAmt, 0, 100, 0.01, 0.95));
      if (!isRainbow) {
         finalCompLayer.drawingContext.globalCompositeOperation = 'source-in';
         finalCompLayer.fill(ui.colText.value());
         finalCompLayer.rect(0,0,width,height);
         finalCompLayer.drawingContext.globalCompositeOperation = 'source-over';
      }
  }

  if (invertMode) finalCompLayer.filter(INVERT);
}

function startScan() {
  isScanning = true; isPaused = false;
  ui.btnScan.html("RESTART"); ui.btnPause.html("PAUSE");
}

function resetScan() {
  scanPos = 0; isScanning = false; isPaused = false;
  scanHistory = [];
  outputLayer.clear();
  ui.btnScan.html("START SCAN"); ui.btnPause.html("PAUSE");
  updateStatus("READY. POSITION TEXT & PRESS START");
}

function togglePause() {
  if (!isScanning && scanPos === 0) { startScan(); return; }
  isPaused = !isPaused;
  ui.btnPause.html(isPaused ? "RESUME" : "PAUSE");
}

function updateStatus(msg) {
  let el = select('#status-overlay');
  el.html(msg);
  el.style('opacity', '1');
}

function generateNoiseTexture() {
  noiseTexture = createGraphics(canvasW, canvasH);
  noiseTexture.loadPixels();
  for (let i = 0; i < noiseTexture.pixels.length; i += 4) {
    let val = random(100, 200); 
    noiseTexture.pixels[i] = val; noiseTexture.pixels[i+1] = val; noiseTexture.pixels[i+2] = val; noiseTexture.pixels[i+3] = 255;
  }
  noiseTexture.updatePixels();
}

function toggleTheme() {
    isDarkMode = !isDarkMode;
    ui.btnTheme.html(isDarkMode ? "☀ LIGHT MODE" : "☾ DARK MODE");
    applyTheme();
}

function applyTheme() {
  let t = isDarkMode ? themeColors.dark : themeColors.light;
  
  // Body and Containers
  document.body.style.backgroundColor = t.bg;
  select('#sidebar').style('background', t.sidebar);
  select('#sidebar').style('color', t.text);
  select('#sidebar').style('border-right', `1px solid ${t.border}`);
  select('#canvas-wrapper').style('background', t.bg);

  // UI Elements
  uiElements.forEach(el => {
    if (el.type === 'button') {
        // Buttons
        el.dom.style('color', isDarkMode ? '#eee' : '#222'); // Default text
        if (el.isAccent) {
            el.dom.style('background', t.accent);
            el.dom.style('color', (isDarkMode ? '#000' : '#fff'));
        } else {
            el.dom.style('background', t.input);
        }
        el.dom.style('border', `1px solid ${t.border}`);
    } else if (el.type === 'input' || el.type === 'select') {
        // Inputs
        el.dom.style('background', t.input);
        el.dom.style('color', t.text);
        el.dom.style('border', `1px solid ${t.border}`);
    } else if (el.type === 'text') {
        // Labels
        el.dom.style('color', isDarkMode ? '#888' : '#666');
    } else if (el.type === 'value') {
        // Dynamic Values
        el.dom.style('color', t.accent);
    }
  });
}

function exportImage(format) {
  let fname = `glitch_${ui.inpText.value()}_${frameCount}`;
  if (format === 'svg') { saveSVG(fname); return; }
  if (format === 'png-trans') save(finalCompLayer, fname + '.png');
  else {
    let flat = createGraphics(width, height);
    flat.background(ui.colBg.value());
    flat.image(finalCompLayer, 0, 0);
    save(flat, fname + (format === 'jpg' ? '.jpg' : '.png'));
    flat.remove();
  }
}

function saveSVG(filename) {
    if (scanHistory.length === 0) { alert("No scan data to export! Please run a scan first."); return; }
    let svgW = width; let svgH = height;
    let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}">`;
    svgContent += `<style>text { text-anchor: middle; dominant-baseline: middle; font-weight: bold; }</style>`;
    svgContent += `<defs>`;
    for (let i = 0; i < scanHistory.length; i++) {
        let step = scanHistory[i];
        let rectX = (step.dir === 'Vertical') ? 0 : step.pos;
        let rectY = (step.dir === 'Vertical') ? step.pos : 0;
        let rectW = (step.dir === 'Vertical') ? svgW : 1;
        let rectH = (step.dir === 'Vertical') ? 1 : svgH;
        svgContent += `<clipPath id="clip-${i}"><rect x="${rectX}" y="${rectY}" width="${rectW}" height="${rectH}" /></clipPath>`;
    }
    svgContent += `</defs>`;
    svgContent += `<rect width="100%" height="100%" fill="${ui.colBg.value()}" />`;
    svgContent += `<g>`;
    for (let i = 0; i < scanHistory.length; i++) {
        let step = scanHistory[i];
        let transform = `translate(${step.tx} ${step.ty}) rotate(${step.rot}) scale(${step.sx} ${step.sy})`;
        svgContent += `<g clip-path="url(#clip-${i})">`;
        svgContent += `<text transform="${transform}" font-family="${step.font}, sans-serif" font-size="${step.fSize}" fill="${step.col}">${step.txt}</text>`;
        svgContent += `</g>`;
    }
    svgContent += `</g></svg>`;
    let blob = new Blob([svgContent], {type: "image/svg+xml;charset=utf-8"});
    let url = URL.createObjectURL(blob);
    let downloadLink = document.createElement("a");
    downloadLink.href = url; downloadLink.download = filename + ".svg";
    document.body.appendChild(downloadLink); downloadLink.click(); document.body.removeChild(downloadLink);
}

function windowResized() {
  canvasW = windowWidth - sidebarWidth; canvasH = windowHeight;
  resizeCanvas(canvasW, canvasH);
  sourceLayer = createGraphics(width, height);
  sourceLayer.textAlign(CENTER, CENTER); sourceLayer.noStroke();
  let oldOut = outputLayer.get();
  outputLayer = createGraphics(width, height); outputLayer.image(oldOut,0,0);
  finalCompLayer = createGraphics(width, height);
  generateNoiseTexture();
}

// --- UI BUILDER (With Inline Styles) ---
function buildInterface(p) {
  
  // Style Helper
  const commonInputStyle = (el, type) => {
    el.style('padding', '6px 8px');
    el.style('border-radius', '4px');
    el.style('outline', 'none');
    el.style('font-family', 'inherit');
    el.style('font-size', '12px');
    el.style('width', '100%');
    el.style('box-sizing', 'border-box');
    
    // Register for theme updates
    uiElements.push({ dom: el, type: type });
  };

  const sliderWithLabel = (lbl, min, max, val, parent) => {
      let g = createDiv().parent(parent);
      g.style('display', 'flex'); g.style('flex-direction', 'column'); g.style('gap', '4px'); g.style('margin-bottom', '5px');

      let row = createDiv().parent(g);
      row.style('display', 'flex'); row.style('justify-content', 'space-between'); row.style('align-items', 'center');

      let l = createDiv(lbl).parent(row);
      l.style('font-size', '10px'); l.style('font-weight', '800'); l.style('letter-spacing', '1px'); l.style('text-transform', 'uppercase');
      uiElements.push({ dom: l, type: 'text' });

      let valDisplay = createDiv(val).parent(row);
      valDisplay.style('font-size', '10px'); valDisplay.style('font-family', 'monospace');
      uiElements.push({ dom: valDisplay, type: 'value' });
      
      let s = createSlider(min, max, val);
      s.parent(g);
      s.style('width', '100%'); // Make slider take full width
      s.input(() => valDisplay.html(s.value()));
      return s;
  };

  const ctl = (lbl, type, par=p) => {
    let g = createDiv().parent(par);
    g.style('display', 'flex'); g.style('flex-direction', 'column'); g.style('gap', '4px'); g.style('margin-bottom', '5px');

    let l = createDiv(lbl).parent(g);
    l.style('font-size', '10px'); l.style('font-weight', '800'); l.style('letter-spacing', '1px'); l.style('text-transform', 'uppercase');
    uiElements.push({ dom: l, type: 'text' });

    let e;
    if(type=='input') e=createInput(); else if(type=='select') e=createSelect(); else if(type=='color') e=createColorPicker();
    e.parent(g);
    commonInputStyle(e, type);
    return e;
  };

  // --- BUTTON STYLE HELPER (Since we can't use :hover in CSS) ---
  const styleBtn = (btn, isAccent = false) => {
      commonInputStyle(btn, 'button');
      btn.style('cursor', 'pointer');
      btn.style('font-weight', 'bold');
      btn.style('text-transform', 'uppercase');
      btn.style('letter-spacing', '0.5px');
      btn.style('padding', '10px');
      btn.style('transition', 'background 0.2s');
      
      // Register special property for theme logic
      uiElements[uiElements.length-1].isAccent = isAccent;

      // JS-Based Hover Interaction
      btn.mouseOver(() => {
          let t = isDarkMode ? themeColors.dark : themeColors.light;
          btn.style('background', isAccent ? t.accentHover : '#555'); 
          if(!isDarkMode && !isAccent) btn.style('background', '#ddd');
      });
      btn.mouseOut(() => {
          let t = isDarkMode ? themeColors.dark : themeColors.light;
          btn.style('background', isAccent ? t.accent : t.input); 
      });
      return btn;
  };

  ui.btnTheme = createButton("☀ LIGHT MODE").parent(p).mousePressed(toggleTheme);
  styleBtn(ui.btnTheme);
  ui.btnTheme.style('margin-bottom', '10px');

  // --- CONTENT ---
  ui.inpText = ctl('TEXT CONTENT', 'input').value('MELT');
  ui.selFont = ctl('FONT FAMILY', 'select');
  fonts.forEach(f => ui.selFont.option(f));

  let styleRow = createDiv().parent(p);
  styleRow.style('display', 'flex'); styleRow.style('gap', '10px'); styleRow.style('align-items', 'center');
  
  let c1 = ctl('TEXT', 'color', styleRow).value('#ffffff'); 
  c1.style('flex-grow', '1'); ui.colText = c1;
  let c2 = ctl('BG', 'color', styleRow).value('#1a1a1a'); 
  c2.style('flex-grow', '1'); ui.colBg = c2;
  
  let chkRow = createDiv().parent(p).style('margin','5px 0');
  chkRow.style('display', 'flex'); chkRow.style('align-items', 'center'); chkRow.style('gap', '8px'); chkRow.style('font-size', '11px'); chkRow.style('font-weight', 'bold');
  ui.chkRainbow = createCheckbox(' RAINBOW MODE', false).parent(chkRow);
  
  // --- TRANSFORMS ---
  let l1 = createDiv('TRANSFORM').parent(p);
  l1.style('margin-top', '10px'); l1.style('font-size', '10px'); l1.style('font-weight', '800'); l1.style('color', '#888');
  uiElements.push({ dom: l1, type: 'text' });
  
  ui.sliderSize = sliderWithLabel('SIZE', 40, 500, 150, p);
  ui.sliderRot = sliderWithLabel('ROTATION', 0, 360, 0, p);
  
  let flipRow = createDiv().parent(p);
  flipRow.style('display', 'flex'); flipRow.style('gap', '8px'); flipRow.style('font-size', '11px'); flipRow.style('font-weight', 'bold');
  ui.chkMirrorX = createCheckbox(' REFLECT X', false).parent(flipRow);
  ui.chkMirrorY = createCheckbox(' REFLECT Y', false).parent(flipRow);

  // --- SCANNER ---
  let l2 = createDiv('SCANNER').parent(p);
  l2.style('margin-top', '15px'); l2.style('font-size', '10px'); l2.style('font-weight', '800'); l2.style('color', '#888');
  uiElements.push({ dom: l2, type: 'text' });

  ui.selDir = createSelect().parent(createDiv().parent(p).style('margin-bottom','5px'));
  commonInputStyle(ui.selDir, 'select');
  ui.selDir.option('Vertical');
  ui.selDir.option('Horizontal');
  
  ui.sliderSpeed = sliderWithLabel('SPEED', 1, 40, 5, p);

  // --- FILTERS ---
  let l3 = createDiv('FILTERS & FX').parent(p);
  l3.style('margin-top', '15px'); l3.style('font-size', '10px'); l3.style('font-weight', '800'); l3.style('color', '#888');
  uiElements.push({ dom: l3, type: 'text' });

  ui.sliderAb = sliderWithLabel('RGB SPLIT', 0, 50, 0, p);
  ui.sliderBlur = sliderWithLabel('BLUR / GLOW', 0, 100, 0, p);
  ui.sliderNoise = sliderWithLabel('NOISE GRAIN', 0, 100, 0, p);
  ui.sliderThresh = sliderWithLabel('THRESHOLD', 0, 100, 0, p);

  let invRow = createDiv().parent(p).style('margin','10px 0');
  invRow.style('display', 'flex'); invRow.style('gap', '8px'); invRow.style('font-size', '11px'); invRow.style('font-weight', 'bold');
  ui.chkInvert = createCheckbox(' INVERT COLORS', false).parent(invRow);

  // --- ACTIONS ---
  let btnRow = createDiv().parent(p).style('margin-top','15px');
  btnRow.style('display', 'flex'); btnRow.style('gap', '10px');
  
  ui.btnScan = createButton('START SCAN').parent(btnRow).mousePressed(() => { resetScan(); startScan(); });
  styleBtn(ui.btnScan, true);
  ui.btnScan.style('flex-grow', '1');

  ui.btnPause = createButton('PAUSE').parent(btnRow).mousePressed(togglePause);
  styleBtn(ui.btnPause);
  ui.btnPause.style('flex-grow', '1');

  let l4 = createDiv('EXPORT').parent(p);
  l4.style('margin-top', '15px'); l4.style('font-size', '10px'); l4.style('font-weight', '800'); l4.style('color', '#888');
  uiElements.push({ dom: l4, type: 'text' });

  let expRow = createDiv().parent(p);
  expRow.style('display', 'flex'); expRow.style('gap', '5px');

  let b1 = createButton('PNG').parent(expRow).mousePressed(()=>exportImage('png')); styleBtn(b1); b1.style('flex-grow','1');
  let b2 = createButton('JPG').parent(expRow).mousePressed(()=>exportImage('jpg')); styleBtn(b2); b2.style('flex-grow','1');
  let b3 = createButton('SVG').parent(expRow).mousePressed(()=>exportImage('svg')); styleBtn(b3, true); b3.style('flex-grow','1');
  let b4 = createButton('TRANS').parent(expRow).mousePressed(()=>exportImage('png-trans')); styleBtn(b4); b4.style('flex-grow','1');
  
  let info = createDiv('SPACE=PAUSE | ENTER=RESTART | R=RESET ROT').parent(p);
  info.style('font-size','9px'); info.style('color','#666'); info.style('margin-top','10px');
}