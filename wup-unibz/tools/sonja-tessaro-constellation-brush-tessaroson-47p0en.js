/**
 * CONSTELLATION TOOL - VIEWER COMPATIBLE
 * WUP 2025/26
 * TESSARO SONJA
 * Optimized for Inline-Style compatibility
 */

// --- GLOBAL VARIABLES ---
let points = [];        // Standard brush points
let textObjects = [];   // Editable text objects
let redoStack = [];     // For Undo/Redo
let timeOffset = 0;

// Fonts
let fontSans, fontSerif, fontMono;

// Interaction State
let selectedTextObj = null; 
let isDraggingText = false;
let dragStartX, dragStartY;

// --- STATE FLAGS ---
let isTransparentMode = false;
let isRecordingGif = false;
let showGrid = false;

// --- UI ELEMENTS ---
let uiPanel, toggleBtn, statusBar;
let isUIVisible = true;

// Text Controls
let textInput, fontSelect, fontSizeSlider, fontAngleSlider;
// Brush Controls
let distSlider, thickSlider, rateSlider;
// Animation Controls
let speedSlider, ampSlider;
// Color Controls
let strokePicker, bgPicker, rainbowCheck;
// Labels
let lblDist, lblThick, lblRate, lblSpeed, lblAmp, lblSize, lblAngle;

// --- UI DRAG ---
let isDraggingUI = false;
let uiDragOffX = 0, uiDragOffY = 0;

// --- DEFAULTS ---
const DEFAULT_BG = '#111111';
const DEFAULT_STROKE = '#ffffff';

// --- CLASS: EDITABLE TEXT OBJECT ---
class TextConstellation {
  constructor(str, x, y, size, angle, fontObj) {
    this.str = str;
    this.pos = createVector(x, y);
    this.size = size;
    this.angle = angle; 
    this.font = fontObj;
    this.points = []; 
    this.recalculatePoints();
  }

  recalculatePoints() {
    let bbox = this.font.textBounds(this.str, 0, 0, this.size);
    let centerOffX = bbox.w / 2;
    let centerOffY = bbox.h / 2;

    let rawPoints = this.font.textToPoints(this.str, -centerOffX, centerOffY/2, this.size, {
      sampleFactor: 0.1, 
      simplifyThreshold: 0
    });

    this.points = rawPoints.map(p => ({
      baseX: p.x,
      baseY: p.y,
      noiseOffset: random(10000)
    }));
    
    this.width = bbox.w;
    this.height = bbox.h;
  }

  update(size, angle, font) {
    let changed = false;
    if (size !== undefined && size !== this.size) { this.size = size; changed = true; }
    if (angle !== undefined && angle !== this.angle) { this.angle = angle; changed = true; }
    if (font !== undefined && font !== this.font) { this.font = font; changed = true; }
    if (changed) this.recalculatePoints();
  }

  isMouseOver(mx, my) {
    let d = dist(mx, my, this.pos.x, this.pos.y);
    return d < (this.width / 2) + 20; 
  }

  draw(timeVal, animAmp, useRainbow, brushDist, brushColor, brushThick) {
    push();
    translate(this.pos.x, this.pos.y);
    rotate(this.angle);

    let currentPts = this.points.map(pt => {
      let nX = noise(pt.noiseOffset + timeVal);
      let nY = noise(pt.noiseOffset + 5000 + timeVal);
      let dx = map(nX, 0, 1, -animAmp, animAmp);
      let dy = map(nY, 0, 1, -animAmp, animAmp);
      return createVector(pt.baseX + dx, pt.baseY + dy);
    });

    strokeWeight(brushThick);
    
    for (let i = 0; i < currentPts.length; i++) {
      let p1 = currentPts[i];
      for (let j = i + 1; j < currentPts.length; j++) {
        let p2 = currentPts[j];
        let d = dist(p1.x, p1.y, p2.x, p2.y);
        
        if (d < brushDist) {
          if (useRainbow) {
            colorMode(HSB, 360, 100, 100, 100);
            let hue = (frameCount * 2 + (this.pos.x + p1.x)*0.5) % 360;
            stroke(hue, 80, 100, 70); 
          } else {
            colorMode(RGB, 255);
            let c = color(brushColor);
            c.setAlpha(150); 
            stroke(c);
          }
          line(p1.x, p1.y, p2.x, p2.y);
        }
      }
    }
    pop();
    colorMode(RGB, 255);
  }

  drawSelectionBox() {
    push();
    translate(this.pos.x, this.pos.y);
    rotate(this.angle);
    noFill();
    stroke(0, 255, 255);
    strokeWeight(1);
    drawingContext.setLineDash([5, 5]); 
    rectMode(CENTER);
    rect(0, 0, this.width + 40, this.height + 40);
    drawingContext.setLineDash([]); 
    fill(0, 255, 255);
    ellipse(0, 0, 8, 8);
    pop();
  }
}

// --- SETUP & MAIN LOOP ---

function preload() {
  fontSans = loadFont('https://cdnjs.cloudflare.com/ajax/libs/topcoat/0.8.0/font/SourceSansPro-Bold.otf');
  fontSerif = loadFont('https://cdnjs.cloudflare.com/ajax/libs/topcoat/0.8.0/font/SourceCodePro-Bold.otf');
  fontMono = loadFont('https://cdnjs.cloudflare.com/ajax/libs/topcoat/0.8.0/font/SourceCodePro-Regular.otf');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  createModernUI();
  createToggleBtn();
  createStatusBar();
  background(DEFAULT_BG);
  
  updateStatus("Welcome! TAB to toggle menu. Click empty space to deselect.");
}

function draw() {
  let animSpeed = speedSlider.value();
  let animAmp = ampSlider.value();
  timeOffset += animSpeed * 0.01;

  if (isTransparentMode) {
    clear();
  } else {
    background(bgPicker.value());
    if (showGrid) drawGrid();
  }

  let connectDist = distSlider.value();
  let thickness = thickSlider.value();
  let useRainbow = rainbowCheck.checked();
  let col = strokePicker.value();

  // Draw Brush Points
  strokeWeight(thickness);
  for (let pt of points) {
    let nX = noise(pt.offset + timeOffset);
    let nY = noise(pt.offset + 5000 + timeOffset);
    let dx = map(nX, 0, 1, -animAmp, animAmp);
    let dy = map(nY, 0, 1, -animAmp, animAmp);
    pt.currX = pt.origin.x + dx;
    pt.currY = pt.origin.y + dy;
  }

  for (let i = 0; i < points.length; i++) {
    let p1 = points[i];
    for (let j = i + 1; j < points.length; j++) {
      let p2 = points[j];
      let d = dist(p1.currX, p1.currY, p2.currX, p2.currY);
      if (d < connectDist) {
        if (useRainbow) {
          colorMode(HSB, 360, 100, 100, 100);
          let hue = (frameCount * 2 + p1.currX * 0.5) % 360;
          stroke(hue, 80, 100, 70); 
        } else {
          colorMode(RGB, 255);
          let c = color(col);
          c.setAlpha(150); 
          stroke(c);
        }
        line(p1.currX, p1.currY, p2.currX, p2.currY);
      }
    }
  }
  colorMode(RGB, 255);

  // Draw Text Objects
  for (let txtObj of textObjects) {
    txtObj.draw(timeOffset, animAmp, useRainbow, connectDist, col, thickness);
    if (txtObj === selectedTextObj && !isRecordingGif && !isTransparentMode) {
      txtObj.drawSelectionBox();
    }
  }

  // Brush Input
  if (mouseIsPressed && !isMouseOverUI() && !isDraggingUI && !isDraggingText && selectedTextObj === null && !isRecordingGif) {
    let txt = textInput.value();
    if (txt.trim() === "") {
       let rate = map(rateSlider.value(), 1, 10, 12, 1); 
       if (frameCount % Math.floor(rate) === 0) {
         addBrushPoint(mouseX, mouseY);
       }
    }
  }
  
  updateUILabels();
}

// --- INTERACTION LOGIC ---

function mousePressed() {
  if (isMouseOverHeader()) {
    isDraggingUI = true;
    let r = uiPanel.elt.getBoundingClientRect();
    uiDragOffX = mouseX - r.left;
    uiDragOffY = mouseY - r.top;
    return;
  }
  if (isMouseOverUI()) return;

  let hit = null;
  for (let i = textObjects.length - 1; i >= 0; i--) {
    if (textObjects[i].isMouseOver(mouseX, mouseY)) {
      hit = textObjects[i];
      break;
    }
  }

  if (hit) {
    selectedTextObj = hit;
    isDraggingText = true;
    fontSizeSlider.value(hit.size);
    fontAngleSlider.value(degrees(hit.angle));
    updateStatus("Selected: '" + hit.str + "'.");
  } else {
    if (selectedTextObj) {
      selectedTextObj = null;
      updateStatus("Deselected.");
    } else {
      let txt = textInput.value();
      if (txt.trim() !== "") {
        spawnTextObject(txt, mouseX, mouseY);
        textInput.value(''); 
      }
    }
  }
}

function mouseDragged() {
  if (isDraggingUI) {
    uiPanel.position(mouseX - uiDragOffX, mouseY - uiDragOffY);
  } else if (isDraggingText && selectedTextObj) {
    selectedTextObj.pos.x = mouseX;
    selectedTextObj.pos.y = mouseY;
  }
}

function mouseReleased() {
  isDraggingUI = false;
  isDraggingText = false;
}

// --- KEYBOARD SHORTCUTS ---
function keyPressed() {
  // CRITICAL: Do not trigger shortcuts if user is typing in the input box!
  if (document.activeElement === textInput.elt) {
    return;
  }

  // TAB: Toggle Menu (prevent default tab navigation)
  if (keyCode === TAB) {
    toggleUI();
    return false; 
  }

  // UNDO / REDO (Ctrl+Z, Ctrl+Y)
  // FIX: Using '91' for Mac Command Key as p5js doesn't have a 'COMMAND' constant
  if (keyIsDown(CONTROL) || keyIsDown(91)) { 
    if (key === 'z' || key === 'Z') {
      if (keyIsDown(SHIFT)) redo(); // Ctrl + Shift + Z
      else undo();
    }
    if (key === 'y' || key === 'Y') redo();
  }
  
  // CLEAR: Shift + Backspace/Delete
  if (keyIsDown(SHIFT) && (keyCode === DELETE || keyCode === BACKSPACE)) {
    clearAll();
  } 
  // DELETE: Delete Selected Object (only if no Shift)
  else if (keyCode === DELETE || keyCode === BACKSPACE) {
    if (selectedTextObj) {
      let idx = textObjects.indexOf(selectedTextObj);
      if (idx > -1) {
        textObjects.splice(idx, 1);
        selectedTextObj = null;
        updateStatus("Object Deleted.");
      }
    }
  }
  
  // ESC: Deselect
  if (keyCode === ESCAPE) {
    selectedTextObj = null;
    updateStatus("Deselected.");
  }
}

// --- CORE FUNCTIONS ---

function addBrushPoint(x, y) {
  points.push({
    origin: createVector(x, y),
    currX: x, currY: y,
    offset: random(10000)
  });
  if(redoStack.length > 0) redoStack = []; 
}

function spawnTextObject(str, x, y) {
  let size = fontSizeSlider.value();
  let angle = radians(fontAngleSlider.value());
  let f = getCurrentFont();
  let newObj = new TextConstellation(str, x, y, size, angle, f);
  textObjects.push(newObj);
  selectedTextObj = newObj;
  updateStatus("Text Created.");
}

function updateSelectedObject() {
  if (selectedTextObj) {
    let size = fontSizeSlider.value();
    let angle = radians(fontAngleSlider.value());
    let f = getCurrentFont();
    selectedTextObj.update(size, angle, f);
  }
}

function getCurrentFont() {
  let val = fontSelect.value();
  if (val === 'Monospace') return fontMono;
  if (val === 'Serif') return fontSerif;
  return fontSans;
}

function undo() {
  if (points.length > 0) {
    redoStack.push({ type: 'point', data: points.pop() });
    updateStatus("Undo: Brush Point");
  } else if (textObjects.length > 0) {
    redoStack.push({ type: 'text', data: textObjects.pop() });
    selectedTextObj = null;
    updateStatus("Undo: Text Object");
  }
}

function redo() {
  if (redoStack.length > 0) {
    let action = redoStack.pop();
    if (action.type === 'point') points.push(action.data);
    else textObjects.push(action.data);
    updateStatus("Redo.");
  }
}

function clearAll() {
  points = [];
  textObjects = [];
  redoStack = [];
  selectedTextObj = null;
  updateStatus("Canvas Cleared.");
}

function drawGrid() {
  stroke(255, 30);
  strokeWeight(1);
  let sz = 50;
  for (let x = 0; x < width; x += sz) line(x, 0, x, height);
  for (let y = 0; y < height; y += sz) line(0, y, width, y);
}

function updateStatus(msg) {
  if(statusBar) statusBar.html(msg);
}

function windowResized() { resizeCanvas(windowWidth, windowHeight); }
function toggleGrid() { showGrid = !showGrid; }


// --- EXPORT ENGINES ---
function exportJPG() { saveCanvas('constellation', 'jpg'); updateStatus("Saved JPG"); }
function exportPNG() { saveCanvas('constellation', 'png'); updateStatus("Saved PNG"); }
function exportTransparentPNG() {
  isTransparentMode = true;
  redraw();
  saveCanvas('constellation_trans', 'png');
  isTransparentMode = false;
  updateStatus("Saved Transparent PNG");
}
function exportGIF() {
  isRecordingGif = true;
  updateStatus("Recording GIF (Wait 4s)...");
  saveGif('constellation_anim', 4);
  setTimeout(() => { isRecordingGif = false; updateStatus("GIF Saved."); }, 4500);
}
function exportSVG() {
  updateStatus("Generating Vector File...");
  let connectDist = distSlider.value();
  let col = strokePicker.value();
  let w = thickSlider.value();
  
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`;
  
  // Brush Lines
  for (let i = 0; i < points.length; i++) {
    let p1 = points[i];
    for (let j = i + 1; j < points.length; j++) {
      let p2 = points[j];
      if (dist(p1.currX, p1.currY, p2.currX, p2.currY) < connectDist) {
        svg += `<line x1="${p1.currX.toFixed(2)}" y1="${p1.currY.toFixed(2)}" x2="${p2.currX.toFixed(2)}" y2="${p2.currY.toFixed(2)}" stroke="${col}" stroke-width="${w}" />`;
      }
    }
  }

  // Text Object Lines
  for(let obj of textObjects) {
     let pts = obj.points.map(p => {
       let rX = p.baseX * cos(obj.angle) - p.baseY * sin(obj.angle);
       let rY = p.baseX * sin(obj.angle) + p.baseY * cos(obj.angle);
       return { x: obj.pos.x + rX, y: obj.pos.y + rY };
     });
     for (let i = 0; i < pts.length; i++) {
       for (let j = i + 1; j < pts.length; j++) {
         if (dist(pts[i].x, pts[i].y, pts[j].x, pts[j].y) < connectDist) {
           svg += `<line x1="${pts[i].x.toFixed(2)}" y1="${pts[i].y.toFixed(2)}" x2="${pts[j].x.toFixed(2)}" y2="${pts[j].y.toFixed(2)}" stroke="${col}" stroke-width="${w}" />`;
         }
       }
     }
  }

  svg += `</svg>`;
  let blob = new Blob([svg], {type: "image/svg+xml;charset=utf-8"});
  let url = URL.createObjectURL(blob);
  let link = createA(url, 'constellation.svg');
  link.elt.download = 'constellation.svg';
  link.elt.click();
  link.remove();
  updateStatus("SVG Saved.");
}


// --- UI CONSTRUCTION ---
function createStatusBar() {
  statusBar = createDiv('Loading...');
  statusBar.position(0, windowHeight - 30);
  statusBar.style('width', '100%');
  statusBar.style('padding', '5px 20px');
  statusBar.style('background', 'rgba(0,0,0,0.8)');
  statusBar.style('color', '#fff');
  statusBar.style('font-family', 'monospace');
  statusBar.style('font-size', '12px');
  statusBar.style('pointer-events', 'none');
  statusBar.style('user-select', 'none');
  statusBar.style('box-sizing', 'border-box'); // Added box-sizing
  statusBar.style('z-index', '998'); // Ensure depth
}

function createToggleBtn() {
  toggleBtn = createButton('☰ Menu (TAB)');
  toggleBtn.position(20, 20);
  styleBtn(toggleBtn);
  toggleBtn.style('z-index', '1000');
  toggleBtn.style('width', '110px');
  toggleBtn.style('background', 'rgba(50,50,50,0.8)');
  toggleBtn.style('color', '#fff');
  toggleBtn.style('backdrop-filter', 'blur(5px)');
  toggleBtn.mousePressed(toggleUI);
}

function createModernUI() {
  uiPanel = createDiv('');
  uiPanel.position(30, 60);
  stylePanel(uiPanel);
  uiPanel.style('z-index', '999'); // Explicit Z-Index for safety

  let header = createDiv('Constellation Ultimate');
  header.parent(uiPanel);
  styleHeader(header);
  header.mousePressed(() => { isDraggingUI = true; let r = uiPanel.elt.getBoundingClientRect(); uiDragOffX = mouseX - r.left; uiDragOffY = mouseY - r.top; });
  header.mouseReleased(() => { isDraggingUI = false; });

  let content = createDiv('');
  content.parent(uiPanel);
  content.style('padding', '15px');
  content.style('overflow-y', 'auto');
  content.style('display', 'flex');
  content.style('flex-direction', 'column');
  content.style('gap', '5px');
  content.style('box-sizing', 'border-box'); // Added box-sizing

  // --- TEXT TOOL ---
  createSectionHeader('TEXT & OBJECTS', content);
  textInput = createInput(''); 
  textInput.parent(content); 
  textInput.attribute('placeholder', 'Type here then CLICK canvas...');
  textInput.style('padding','8px'); 
  textInput.style('border','1px solid #ccc'); 
  textInput.style('border-radius','4px'); 
  textInput.style('margin-bottom','5px');
  textInput.style('font-family', 'inherit'); // Inherit font safely
  textInput.style('box-sizing', 'border-box'); // Prevent overflow

  fontSelect = createSelect();
  fontSelect.parent(content);
  fontSelect.option('Sans-Serif');
  fontSelect.option('Monospace');
  fontSelect.option('Serif');
  fontSelect.changed(updateSelectedObject);
  fontSelect.style('padding','5px'); 
  fontSelect.style('margin-bottom','8px');
  fontSelect.style('font-family', 'inherit');
  fontSelect.style('width', '100%'); // Explicit width

  let tRow1 = createRow(content); createLabel('Size', tRow1); lblSize = createVal('100', tRow1);
  fontSizeSlider = createSlider(20, 400, 100); 
  styleSlider(fontSizeSlider, content);
  fontSizeSlider.input(() => { updateSelectedObject(); updateUILabels(); });
  
  let tRow2 = createRow(content); createLabel('Angle', tRow2); lblAngle = createVal('0°', tRow2);
  fontAngleSlider = createSlider(0, 360, 0); 
  styleSlider(fontAngleSlider, content);
  fontAngleSlider.input(() => { updateSelectedObject(); updateUILabels(); });

  // --- BRUSH ---
  createSectionHeader('BRUSH & STYLE', content);
  let r1 = createRow(content); createLabel('Connect Dist', r1); lblDist = createVal('100', r1);
  distSlider = createSlider(20, 300, 100); styleSlider(distSlider, content);

  let r2 = createRow(content); createLabel('Thickness', r2); lblThick = createVal('1', r2);
  thickSlider = createSlider(0.5, 10, 1, 0.1); styleSlider(thickSlider, content);

  let r3 = createRow(content); createLabel('Brush Density', r3); lblRate = createVal('Med', r3);
  rateSlider = createSlider(1, 10, 5); styleSlider(rateSlider, content);

  // --- ANIMATION ---
  createSectionHeader('ANIMATION', content);
  let r4 = createRow(content); createLabel('Drift Speed', r4); lblSpeed = createVal('1.0', r4);
  speedSlider = createSlider(0, 5, 1.0, 0.1); styleSlider(speedSlider, content);

  let r5 = createRow(content); createLabel('Amplitude', r5); lblAmp = createVal('20', r5);
  ampSlider = createSlider(0, 100, 20); styleSlider(ampSlider, content);

  // --- COLORS ---
  createSectionHeader('APPEARANCE', content);
  rainbowCheck = createCheckbox(' 🌈 Rainbow Flow', false);
  rainbowCheck.parent(content); rainbowCheck.style('font-size','12px');
  
  let gridCheck = createCheckbox(' ▦ Show Grid', false);
  gridCheck.parent(content); gridCheck.style('font-size','12px'); gridCheck.changed(toggleGrid);
  
  let cRow = createRow(content);
  let b1 = createDiv(''); b1.parent(cRow); b1.style('flex','1'); createLabel('Stroke', b1, true);
  strokePicker = createColorPicker(DEFAULT_STROKE); stylePicker(strokePicker, b1);
  let b2 = createDiv(''); b2.parent(cRow); b2.style('flex','1'); createLabel('Background', b2, true);
  bgPicker = createColorPicker(DEFAULT_BG); stylePicker(bgPicker, b2);

  // --- ACTIONS ---
  createSectionHeader('HISTORY', content);
  let actRow = createRow(content);
  let btnU = createButton('Undo'); styleBtn(btnU, actRow); btnU.mousePressed(undo);
  let btnR = createButton('Redo'); styleBtn(btnR, actRow); btnR.mousePressed(redo);
  let btnC = createButton('Clear'); styleBtn(btnC, actRow, '#ffebee', '#d32f2f'); btnC.mousePressed(clearAll);

  // --- EXPORT ---
  createSectionHeader('EXPORT', content);
  let expRow1 = createRow(content);
  let bJpg = createButton('JPG'); styleBtn(bJpg, expRow1, '#e3f2fd', '#1565c0'); bJpg.mousePressed(exportJPG);
  let bPng = createButton('PNG'); styleBtn(bPng, expRow1, '#e3f2fd', '#1565c0'); bPng.mousePressed(exportPNG);
  let bPngT = createButton('Alpha'); styleBtn(bPngT, expRow1, '#fff3e0', '#e65100'); bPngT.mousePressed(exportTransparentPNG);
  let expRow2 = createRow(content);
  let bGif = createButton('GIF'); styleBtn(bGif, expRow2, '#e8f5e9', '#2e7d32'); bGif.mousePressed(exportGIF);
  let bSvg = createButton('SVG'); styleBtn(bSvg, expRow2, '#f3e5f5', '#7b1fa2'); bSvg.mousePressed(exportSVG);

  // --- SHORTCUTS REFERENCE ---
  createSectionHeader('SHORTCUTS', content);
  let sList = createDiv(`
    <b>TAB</b> Toggle Menu<br>
    <b>Ctrl+Z</b> Undo | <b>Ctrl+Y</b> Redo<br>
    <b>Delete</b> Del Object | <b>Shift+Del</b> Clear<br>
  `);
  sList.parent(content);
  sList.style('font-size','10px');
  sList.style('color','#777');
  sList.style('line-height','1.5');
}

function updateUILabels() {
  if (!isUIVisible) return;
  lblDist.html(distSlider.value());
  lblThick.html(thickSlider.value());
  lblRate.html(rateSlider.value() < 4 ? 'Low' : rateSlider.value() > 7 ? 'High' : 'Med');
  lblSpeed.html(speedSlider.value());
  lblAmp.html(ampSlider.value());
  lblSize.html(fontSizeSlider.value() + 'px');
  lblAngle.html(fontAngleSlider.value() + '°');
}

// --- HELPERS ---
function isMouseOverUI() { if (!isUIVisible || !uiPanel) return false; let r = uiPanel.elt.getBoundingClientRect(); return (mouseX > r.left && mouseX < r.right && mouseY > r.top && mouseY < r.bottom); }
function isMouseOverHeader() { if (!isUIVisible || !uiPanel) return false; return (mouseY > uiPanel.elt.offsetTop && mouseY < uiPanel.elt.offsetTop + 40 && mouseX > uiPanel.elt.offsetLeft && mouseX < uiPanel.elt.offsetLeft + 280); }
function toggleUI() { isUIVisible = !isUIVisible; uiPanel.style('display', isUIVisible ? 'flex' : 'none'); toggleBtn.html(isUIVisible ? '☰ Menu (TAB)' : '☰ Show (TAB)'); }

// --- CSS-IN-JS STYLES (PURE INLINE IMPLEMENTATION) ---
function stylePanel(el) { 
  el.style('width','280px'); 
  el.style('max-height','85vh'); 
  el.style('background','rgba(255,255,255,0.98)'); 
  el.style('border-radius','8px'); 
  el.style('box-shadow','0 10px 40px rgba(0,0,0,0.5)'); 
  el.style('font-family','Segoe UI, sans-serif'); 
  el.style('display','flex'); 
  el.style('flex-direction','column'); 
  el.style('overflow','hidden'); 
  el.style('user-select','none'); 
  el.style('box-sizing', 'border-box'); // SAFETY: Ensure padding doesn't widen element
}
function styleHeader(el) { 
  el.style('padding','15px'); 
  el.style('background','#f1f1f1'); 
  el.style('border-bottom','1px solid #ddd'); 
  el.style('font-weight','bold'); 
  el.style('color','#333'); 
  el.style('cursor','grab'); 
  el.style('text-align','center'); 
  el.style('margin', '0'); // SAFETY: Reset margin
}
function createSectionHeader(text, parent) { 
  let el = createDiv(text); 
  el.parent(parent); 
  el.style('font-size','10px'); 
  el.style('font-weight','800'); 
  el.style('color','#999'); 
  el.style('letter-spacing','1px'); 
  el.style('margin','15px 0 5px 0'); 
  el.style('border-bottom','1px solid #eee'); 
  el.style('line-height', '1.2'); // SAFETY: Explicit line height
}
function createRow(parent) { 
  let el = createDiv(''); 
  el.parent(parent); 
  el.style('display','flex'); 
  el.style('gap','8px'); 
  el.style('margin-bottom','5px'); 
  el.style('justify-content','space-between'); 
  el.style('align-items','center'); // SAFETY: Vertical center
  return el; 
}
function createLabel(text, parent, block=false) { 
  let el = createSpan(text); 
  el.parent(parent); 
  el.style('font-size','12px'); 
  el.style('color','#555'); 
  el.style('font-weight','600'); 
  if(block) el.style('display','block'); 
}
function createVal(text, parent) { 
  let el = createSpan(text); 
  el.parent(parent); 
  el.style('font-size','11px'); 
  el.style('color','#888'); 
  return el; 
}
function styleSlider(el, parent) { 
  el.parent(parent); 
  el.style('width','100%'); 
  el.style('margin','0 0 10px 0'); 
  el.style('cursor','pointer'); 
  el.style('display', 'block'); // SAFETY: Enforce block for sliders
}
function stylePicker(el, parent) { 
  el.parent(parent); 
  el.style('width','100%'); 
  el.style('height','25px'); 
  el.style('border','none'); 
  el.style('background','none'); 
  el.style('cursor','pointer'); 
}
function styleBtn(el, parent, bg='#f5f5f5', col='#333') { 
  if(parent) el.parent(parent); 
  el.style('border','none'); 
  el.style('padding','8px 10px'); 
  el.style('border-radius','4px'); 
  el.style('background', bg); 
  el.style('color', col); 
  el.style('font-weight','600'); 
  el.style('font-size','11px'); 
  el.style('cursor','pointer'); 
  el.style('flex','1'); 
  el.style('font-family', 'inherit'); // SAFETY: Inherit font
  // HOVER STATE (JS EVENT LISTENER)
  el.mouseOver(() => el.style('filter','brightness(0.95)')); 
  el.mouseOut(() => el.style('filter','brightness(1)')); 
}