// WUP 25-26
// Julie Latz
/**
 * LAYER 0 - RETRO DESIGN EDITION
 * Fix: Eraser zieht nun saubere, durchgehende Linien statt einzelner Kreise.
 */

let uiWidth = 260;
let canvasLayer;
let points = []; 

let brushNames = ['Neural Flow', 'Ink Trap', 'Smoke Particle', 'Velvet Web', 'Neon Pulse'];
let selectedBrush = 'Neural Flow';
let isEraserActive = false;

let selectedColor = '#f37d6a'; 
let bgColor = '#0a0a0f'; 
let brushSizeSlider, flowSlider, symmetryCheck;
let inpW, inpH; 
let sidebar, toggleBtn, modeBtn, eraserBtn, brushSelect;
let isUiMinimized = false;
let isDayMode = false; 

// Sicherheits-Variablen
let lastX, lastY;
let actuallyPressing = false; 

function setup() {
  noCanvas();
  
  let part1 = "h" + "t";
  let part2 = "m" + "l";
  let lib = [part1 + part2, '2canvas'].join('');
  
  let s1 = createElement('script');
  s1.attribute('src', `https://cdnjs.cloudflare.com/ajax/libs/${lib}/1.4.1/${lib}.min.js`);
  
  let s2 = createElement('script');
  s2.attribute('src', 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
  
  let mainCnv = createCanvas(windowWidth, windowHeight);
  mainCnv.position(0, 0);
  mainCnv.style('z-index', '-1');

  canvasLayer = createGraphics(windowWidth, windowHeight);
  
  mainCnv.mousePressed(() => { actuallyPressing = true; });
  mainCnv.mouseReleased(() => { 
    actuallyPressing = false; 
    points = [];
    lastX = undefined;
    lastY = undefined;
  });

  setupStyles();
  setupUI();
  textFont('Inter');
}

function setupStyles() {
  let css = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;900&family=Unbounded:wght@400;800&family=Syne:wght@700;800&display=swap');
    :root { --ui-blue: #7097b6; --ui-coral: #f37d6a; --ui-white: #ffffff; --ui-border: #000000; }
    body { margin: 0; background: #000; overflow: hidden; font-family: 'Inter', sans-serif; }
    .sidebar { width: ${uiWidth}px; padding: 20px; height: 90vh; position: absolute; left: 20px; top: 5vh; display: flex; flex-direction: column; gap: 10px; box-sizing: border-box; transition: all 0.3s ease; z-index: 100; overflow-y: auto; border: 2px solid var(--ui-border); }
    .sidebar.night { background: #111; color: white; border-color: var(--ui-blue); }
    .sidebar.day { background: var(--ui-white); color: #000; border-color: var(--ui-border); }
    .sidebar.minimized { transform: translateX(-320px); opacity: 0; }
    .toggle-ui-btn, .mode-toggle-btn { position: absolute; z-index: 110; border: 2px solid var(--ui-border); width: 40px; height: 40px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-family: 'Unbounded'; }
    .toggle-ui-btn { left: 20px; top: 15px; background: var(--ui-coral); color: white; }
    .mode-toggle-btn { left: 65px; top: 15px; background: var(--ui-blue); color: white; }
    .sidebar h1 { font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; margin: 0; border-bottom: 2px solid var(--ui-blue); padding-bottom: 8px; }
    .section-title { font-size: 10px; font-weight: 900; color: var(--ui-blue); text-transform: uppercase; margin-top: 15px; letter-spacing: 1px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
    .label-txt { font-size: 9px; font-weight: 700; text-transform: uppercase; color: #555; margin-bottom: 4px; display: block; }
    input, select, button { border-radius: 0px; padding: 8px; font-family: inherit; font-size: 11px; }
    input[type=range] { -webkit-appearance: none; background: transparent; margin: 5px 0 10px 0; width: 100%; }
    input[type=range]::-webkit-slider-runnable-track { width: 100%; height: 2px; background: var(--ui-blue); }
    input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; height: 14px; width: 14px; background: var(--ui-coral); border: none; cursor: pointer; margin-top: -6px; border-radius: 50%; }
    .btn-row { display: flex; gap: 5px; }
    .btn-save { background: var(--ui-blue); color: white; border: 2px solid var(--ui-border); font-family: 'Unbounded'; font-weight: 800; flex: 1; text-transform: uppercase; }
    .btn-clear { background: #000; color: #fff; border: 2px solid var(--ui-border); font-family: 'Unbounded'; font-weight: 800; margin-top: 5px; }
    .btn-apply { background: var(--ui-blue); color: #fff; border: 1px solid var(--ui-border); font-size: 9px; cursor: pointer; height: 33px; padding: 0 10px; }
    .btn-eraser { background: #f0f0f0; border: 2px solid var(--ui-border); font-family: 'Unbounded'; font-weight: 800; transition: 0.3s; }
    .btn-eraser.active { background: var(--ui-coral); color: white; }
    .color-row-fixed { display: flex; gap: 10px; align-items: flex-start; margin-top: 5px; }
    .color-unit { flex: 1; }
    input[type="color"] { width: 100%; height: 35px; cursor: pointer; padding: 2px; }
    .size-row { display: flex; gap: 5px; align-items: center; margin-top: 5px; }
    .size-row input { width: 50px !important; height: 33px; text-align: center; flex: none !important; }
  `;
  createElement('style', css);
}

function setupUI() {
  toggleBtn = createButton('☰').class('toggle-ui-btn').mousePressed(toggleSidebar);
  modeBtn = createButton('🌙').class('mode-toggle-btn').mousePressed(toggleColorMode);
  sidebar = createDiv('').class('sidebar night');
  createElement('h1', 'Layer 0').parent(sidebar);
  createElement('div', 'Canvas Size').class('section-title').parent(sidebar);
  let sizeRow = createDiv().class('size-row').parent(sidebar);
  inpW = createInput(str(windowWidth), 'number').parent(sizeRow);
  inpH = createInput(str(windowHeight), 'number').parent(sizeRow);
  createButton('SET').parent(sizeRow).class('btn-apply').mousePressed(resizeCanvasLayer);
  createElement('div', '1. Brush').class('section-title').parent(sidebar);
  brushSelect = createSelect().parent(sidebar);
  brushNames.forEach(b => brushSelect.option(b));
  brushSelect.changed(() => {
    selectedBrush = brushSelect.value();
    isEraserActive = false;
    eraserBtn.removeClass('active');
    points = []; 
  });
  let colRow = createDiv().class('color-row-fixed').parent(sidebar);
  let c1 = createDiv().class('color-unit').parent(colRow);
  createElement('label', 'Brush').class('label-txt').parent(c1);
  createColorPicker(selectedColor).parent(c1).input(e => selectedColor = e.target.value);
  let c2 = createDiv().class('color-unit').parent(colRow);
  createElement('label', 'BG').class('label-txt').parent(c2);
  createColorPicker(bgColor).parent(c2).input(e => bgColor = e.target.value);
  createElement('div', '2. Settings').class('section-title').parent(sidebar);
  createElement('div', 'Radius').class('label-txt').parent(sidebar);
  brushSizeSlider = createSlider(1, 300, 60).parent(sidebar);
  createElement('div', 'Intensity').class('label-txt').parent(sidebar);
  flowSlider = createSlider(1, 255, 120).parent(sidebar);
  symmetryCheck = createCheckbox(' Symmetry Mode', false).parent(sidebar);
  symmetryCheck.style('font-size', '10px');
  symmetryCheck.style('font-family', 'Unbounded');
  createElement('div', '3. Modifiers').class('section-title').parent(sidebar);
  eraserBtn = createButton('Eraser Mode').parent(sidebar).class('btn-eraser').mousePressed(() => {
    isEraserActive = !isEraserActive;
    if (isEraserActive) eraserBtn.addClass('active');
    else eraserBtn.removeClass('active');
  });
  createButton('Clear Canvas').parent(sidebar).class('btn-clear').mousePressed(() => canvasLayer.clear());
  createElement('div', '4. Export').class('section-title').parent(sidebar);
  let row1 = createDiv().class('btn-row').parent(sidebar);
  createButton('PNG').parent(row1).class('btn-save').mousePressed(() => exportFile('png'));
  createButton('JPG').parent(row1).class('btn-save').mousePressed(() => exportFile('jpg'));
  createButton('PDF').parent(sidebar).class('btn-save').mousePressed(() => exportFile('pdf'));
}

function resizeCanvasLayer() {
  let w = int(inpW.value());
  let h = int(inpH.value());
  let newLayer = createGraphics(w, h);
  newLayer.image(canvasLayer, 0, 0);
  canvasLayer = newLayer;
}

function toggleColorMode() {
  isDayMode = !isDayMode;
  if (isDayMode) {
    sidebar.removeClass('night').addClass('day');
    modeBtn.elt.innerText = '☀️'; 
    bgColor = '#ffffff'; 
  } else {
    sidebar.removeClass('day').addClass('night');
    modeBtn.elt.innerText = '🌙'; 
    bgColor = '#0a0a0f';
  }
}

function toggleSidebar() {
  isUiMinimized = !isUiMinimized;
  if (isUiMinimized) { sidebar.addClass('minimized'); toggleBtn.elt.innerText = '❯'; }
  else { sidebar.removeClass('minimized'); toggleBtn.elt.innerText = '☰'; }
}

function draw() {
  background(bgColor);
  image(canvasLayer, (width - canvasLayer.width) / 2, (height - canvasLayer.height) / 2);

  if (actuallyPressing && mouseIsPressed) {
    let isOverUI = !isUiMinimized && mouseX < uiWidth + 40; 
    if (!isOverUI) {
      let cx = mouseX - (width - canvasLayer.width) / 2;
      let cy = mouseY - (height - canvasLayer.height) / 2;
      
      if (lastX === undefined) { lastX = cx; lastY = cy; }

      applyBrush(cx, cy);
      if (symmetryCheck.checked()) {
        // Für Symmetrie beim Radieren brauchen wir die gespiegelten Koordinaten
        applyBrush(canvasLayer.width - cx, cy, canvasLayer.width - lastX, lastY);
      }
      
      lastX = cx;
      lastY = cy;
    }
  }

  if (isUiMinimized || mouseX > uiWidth + 40) {
    noFill();
    stroke(isEraserActive ? '#f37d6a' : selectedColor);
    strokeWeight(1);
    ellipse(mouseX, mouseY, brushSizeSlider.value());
  }
}

// applyBrush wurde angepasst, um für den Eraser die letzte Position mitzugeben
function applyBrush(x, y, lx = lastX, ly = lastY) {
  canvasLayer.push();
  let col = color(selectedColor);
  let s = brushSizeSlider.value();
  let flow = flowSlider.value();

  if (isEraserActive) {
    canvasLayer.drawingContext.globalCompositeOperation = 'destination-out';
    canvasLayer.strokeWeight(s);
    canvasLayer.stroke(255);
    // Zeichnet eine durchgehende Linie statt einzelner Punkte
    canvasLayer.line(lx, ly, x, y);
    // Zusätzlicher Kreis am Ende für weichere Kanten
    canvasLayer.noStroke();
    canvasLayer.fill(255);
    canvasLayer.ellipse(x, y, s);
    canvasLayer.drawingContext.globalCompositeOperation = 'source-over';
  } else {
    switch (selectedBrush) {
      case 'Neural Flow': drawNeuralFlow(x, y, col, s); break;
      case 'Ink Trap': drawInkTrap(x, y, col, s); break;
      case 'Smoke Particle': drawSmoke(x, y, col, s, flow); break;
      case 'Velvet Web': drawVelvet(x, y, col, s, flow); break;
      case 'Neon Pulse': drawNeon(x, y, col, s, flow); break;
    }
  }
  canvasLayer.pop();
}

function drawNeuralFlow(x, y, col, s) {
  canvasLayer.stroke(col);
  canvasLayer.strokeWeight(map(s, 1, 300, 0.5, 5));
  for (let p of points) {
    let d = dist(x, y, p.x, p.y);
    if (d < s && d > 2) {
      col.setAlpha(map(d, 0, s, flowSlider.value(), 0));
      canvasLayer.stroke(col);
      canvasLayer.line(x, y, p.x, p.y);
    }
  }
  points.push({x: x, y: y});
  if (points.length > 200) points.shift();
}

function drawSmoke(x, y, col, s, flow) {
  canvasLayer.noStroke();
  for (let i = 0; i < 3; i++) {
    col.setAlpha(flow * 0.1);
    canvasLayer.fill(col);
    canvasLayer.ellipse(x + random(-15, 15), y + random(-15, 15), s * random(0.5, 1.5));
  }
}

function drawInkTrap(x, y, col, s) {
  canvasLayer.noStroke();
  col.setAlpha(flowSlider.value());
  canvasLayer.fill(col);
  canvasLayer.ellipse(x, y, s);
  if (random() > 0.96) canvasLayer.rect(x - 1, y, 2, s * 4);
}

function drawVelvet(x, y, col, s, flow) {
  canvasLayer.noFill();
  col.setAlpha(flow * 0.8);
  canvasLayer.stroke(col);
  canvasLayer.strokeWeight(2);
  canvasLayer.bezier(x, y, x + random(-s,s), y + random(-s,s), lastX + random(-s,s), lastY + random(-s,s), lastX, lastY);
}

function drawNeon(x, y, col, s, flow) {
  canvasLayer.strokeWeight(s/4);
  col.setAlpha(flow * 0.2);
  canvasLayer.stroke(col);
  canvasLayer.line(lastX, lastY, x, y);
  canvasLayer.strokeWeight(2);
  col.setAlpha(255);
  canvasLayer.stroke(255);
  canvasLayer.line(lastX, lastY, x, y);
}

function exportFile(format) {
  let exportCanvas = createGraphics(canvasLayer.width, canvasLayer.height);
  exportCanvas.background(bgColor);
  exportCanvas.image(canvasLayer, 0, 0);
  if (format === 'pdf') {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF(exportCanvas.width > exportCanvas.height ? 'l' : 'p', 'px', [exportCanvas.width, exportCanvas.height]);
    pdf.addImage(exportCanvas.elt.toDataURL('image/jpeg', 1.0), 'JPEG', 0, 0, exportCanvas.width, exportCanvas.height);
    pdf.save('layer-0-design.pdf');
  } else {
    saveCanvas(exportCanvas, 'layer-0-design', format);
  }
}

function windowResized() { resizeCanvas(windowWidth, windowHeight); }