// WUP 25-26
// Andrea Binanzer

let state = "START";
let brushMode = 'none'; 
let shapeType = 'rect';
let brushSize = 20;
let brushDensity = 50;
let brushColor = '#ffffff'; 
let rainbowMode = false;
let hueValue = 0;

let undoStack = [];
let redoStack = [];

// REPLAY & RECORDING
let historyLog = []; 
let isReplaying = false;
let replayIndex = 0;

let startBtn, guiPanel;

function setup() {
  createCanvas(windowWidth, windowHeight);
  angleMode(DEGREES);
  background(0);
  
  createStyledUI();
  
  startBtn = createButton('START');
  styleDarkButton(startBtn);
  startBtn.style('padding', '12px 45px');
  startBtn.style('font-size', '16px');
  startBtn.style('position', 'absolute');
  startBtn.style('top', '60%');
  startBtn.style('left', '50%');
  startBtn.style('transform', 'translate(-50%, -50%)');
  startBtn.mousePressed(startApp);
}

function startApp() {
  state = "APP";
  startBtn.hide();
  guiPanel.style('display', 'grid'); 
  updateCanvasSize();
  saveState();
}

function updateCanvasSize() {
  background(15);
  undoStack = [];
  redoStack = [];
  historyLog = [];
}

// --- HISTORY LOGIK ---
function saveState() {
  let img = createGraphics(width, height);
  img.image(get(), 0, 0);
  undoStack.push(img);
  if (undoStack.length > 30) undoStack.shift();
  redoStack = [];
}

function undo() {
  if (undoStack.length > 1) {
    redoStack.push(undoStack.pop());
    let prevState = undoStack[undoStack.length - 1];
    image(prevState, 0, 0);
  }
}

function redo() {
  if (redoStack.length > 0) {
    let nextState = redoStack.pop();
    undoStack.push(nextState);
    image(nextState, 0, 0);
  }
}

// --- REPLAY LOGIK ---
function recordStep(x, y, px, py) {
  historyLog.push({
    x: x, y: y, px: px, py: py,
    mode: brushMode, col: brushColor,
    rainbow: rainbowMode, hue: hueValue,
    size: brushSize, dens: brushDensity, shape: shapeType
  });
}

function startReplay() {
  if (historyLog.length === 0) return;
  isReplaying = true;
  replayIndex = 0;
  let bgCol = select('#bgColorPicker').value();
  background(bgCol);
}

function runReplay() {
  for (let i = 0; i < 5; i++) { 
    if (replayIndex < historyLog.length) {
      let s = historyLog[replayIndex];
      drawBrush(s.x, s.y, s.px, s.py, s.mode, s.col, s.rainbow, s.hue, s.size, s.dens, s.shape);
      replayIndex++;
    } else {
      isReplaying = false;
      saveState();
      break;
    }
  }
}

function exportGIF() {
  if (historyLog.length === 0) return;
  startReplay();
  // Kalkulierte Dauer für die Aufnahme
  let duration = (historyLog.length / 300) + 1; 
  saveGif('my-drawing-process', duration, { delay: 0, units: 'seconds' });
}

// --- DRAW LOOP ---
function draw() {
  if (state === "START") {
    drawStartScreen();
    return;
  }

  if (isReplaying) {
    runReplay();
    return;
  }

  if (mouseIsPressed && brushMode !== 'none') {
    if (mouseY < height - 160) {
      recordStep(mouseX, mouseY, pmouseX, pmouseY);
      drawBrush(mouseX, mouseY, pmouseX, pmouseY, brushMode, brushColor, rainbowMode, hueValue, brushSize, brushDensity, shapeType);
    }
  }
}

function drawStartScreen() {
  background(0);
  textAlign(CENTER, CENTER);
  textFont('serif');
  fill(255);
  textSize(42);
  textStyle(ITALIC);
  text("Brush Tool", width / 2, height / 2 - 60);
  stroke(255, 60);
  line(width / 2 - 100, height / 2 + 30, width / 2 + 100, height / 2 + 30);
  noStroke();
  textSize(18);
  textStyle(NORMAL);
  text("Make your own drawing.", width / 2, height / 2 - 10);
}

function drawBrush(mX, mY, pX, pY, bMode, bCol, rBow, hVal, bSize, bDens, sType) {
  let currentStroke;
  if (rBow) {
    colorMode(HSB);
    currentStroke = color(hVal, 80, 80, bMode === 'watercolor' ? 0.1 : 1);
    if (!isReplaying) hueValue = (hueValue + 2) % 360;
  } else {
    colorMode(RGB);
    currentStroke = color(bCol);
  }

  push();
  let px = (abs(mX - pX) > bSize * 2) ? mX : pX;
  let py = (abs(mY - pY) > bSize * 2) ? mY : pY;

  if (bMode === 'eraser') {
    let bgCol = select('#bgColorPicker').value();
    stroke(bgCol); strokeWeight(bSize);
    line(px, py, mX, mY);
  } else if (bMode === 'watercolor') {
    noStroke(); fill(red(currentStroke), green(currentStroke), blue(currentStroke), 15); 
    for (let i = 0; i < bDens / 5; i++) {
      let offset = random(-bSize, bSize);
      circle(mX + offset, mY + offset, bSize * random(0.5, 1.5));
    }
  } else if (bMode === 'oilpaint') {
    strokeWeight(1);
    for (let i = 0; i < bDens / 2; i++) {
      let offX = random(-bSize, bSize);
      let offY = random(-bSize, bSize);
      stroke(currentStroke);
      line(px + offX, py + offY, mX + offX, mY + offY);
    }
  } else if (bMode === 'caligraphy') {
    noStroke(); fill(currentStroke);
    beginShape();
    vertex(px - bSize/2, py - bSize/2); vertex(px + bSize/2, py + bSize/2);
    vertex(mX + bSize/2, mY + bSize/2); vertex(mX - bSize/2, mY - bSize/2);
    endShape(CLOSE);
  } else if (bMode === 'chalk') {
    noStroke(); fill(currentStroke);
    for (let i = 0; i < bDens; i++) {
      let r = random(bSize); let angle = random(360);
      circle(mX + r * cos(angle), mY + r * sin(angle), random(1, 3));
    }
  } else if (bMode === 'shapes') {
    fill(currentStroke); noStroke();
    drawCustomShape(mX, mY, bSize, sType);
  }
  pop();
}

function drawCustomShape(x, y, sz, type) {
  push();
  translate(x, y);
  if (type === 'rect') rect(-sz/2, -sz/2, sz, sz);
  else if (type === 'circle') circle(0, 0, sz);
  else if (type === 'star') drawStar(0, 0, sz/2, sz, 5);
  else if (type === 'heart') drawHeart(0, 0, sz);
  else if (type === 'smiley') drawSmiley(0, 0, sz);
  pop();
}

function drawStar(x, y, r1, r2, n) {
  let angle = 360 / n;
  beginShape();
  for (let a = 0; a < 360; a += angle) {
    vertex(x + cos(a) * r2, y + sin(a) * r2);
    vertex(x + cos(a + angle/2) * r1, y + sin(a + angle/2) * r1);
  }
  endShape(CLOSE);
}

function drawHeart(x, y, size) {
  beginShape(); vertex(x, y);
  bezierVertex(x - size, y - size, x - size, y + size/2, x, y + size);
  bezierVertex(x + size, y + size/2, x + size, y - size, x, y);
  endShape(CLOSE);
}

function drawSmiley(x, y, size) {
  circle(0, 0, size); fill(0);
  circle(-size/4, -size/4, size/6); circle(size/4, -size/4, size/6);
  noFill(); stroke(0); arc(0, 0, size/2, size/2, 0, 180);
}

function createStyledUI() {
  guiPanel = createDiv();
  guiPanel.addClass('gui-container');
  guiPanel.style('display', 'none'); 
  
  let style = createElement('style', `
    .gui-container { 
      position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
      display: grid; grid-template-columns: repeat(5, 1fr); gap: 15px; 
      width: 90%; max-width: 1000px; background: #000; padding: 20px; 
      border: 1px solid #222; border-radius: 8px; z-index: 100; font-family: serif;
    }
    .control-group { display: flex; flex-direction: column; gap: 8px; border-left: 1px solid #333; padding-left: 10px; }
    .control-group label { font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #fff; font-weight: bold; }
    .label-small { font-size: 9px; color: #888; text-transform: uppercase; margin-bottom: 2px; margin-top: 5px; }
    input, select, button { background: #111; color: white; border: 1px solid #333; padding: 5px; font-family: serif; cursor: pointer; }
    input[type=range] { -webkit-appearance: none; background: #222; height: 1px; margin: 5px 0 10px 0; }
    input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; height: 12px; width: 12px; background: #fff; border-radius: 50%; }
  `);

  // COL 1
  let col1 = createDiv().parent(guiPanel).addClass('control-group');
  col1.child(createElement('label', '1. Brush Style'));
  let sel = createSelect().parent(col1);
  sel.option('-- SELECT --', 'none'); 
  sel.option('watercolor'); sel.option('oilpaint'); sel.option('caligraphy'); sel.option('chalk'); sel.option('shapes'); sel.option('eraser');
  sel.changed(() => brushMode = sel.value());
  let sSel = createSelect().parent(col1);
  sSel.option('rect'); sSel.option('circle'); sSel.option('star'); sSel.option('heart'); sSel.option('smiley');
  sSel.changed(() => shapeType = sSel.value());

  // COL 2: SETTINGS MIT BESCHRIFTUNG
  let col2 = createDiv().parent(guiPanel).addClass('control-group');
  col2.child(createElement('label', '2. Settings'));
  
  col2.child(createElement('span', 'Size').addClass('label-small'));
  let sz = createSlider(1, 100, 20).parent(col2);
  sz.input(() => brushSize = sz.value());
  
  col2.child(createElement('span', 'Density').addClass('label-small'));
  let ds = createSlider(1, 100, 50).parent(col2);
  ds.input(() => brushDensity = ds.value());

  // COL 3
  let col3 = createDiv().parent(guiPanel).addClass('control-group');
  col3.child(createElement('label', '3. Color'));
  let cp = createColorPicker('#ffffff').parent(col3);
  cp.input(() => { brushColor = cp.value(); rainbowMode = false; });
  let bgCp = createColorPicker('#0f0f0f').parent(col3);
  bgCp.id('bgColorPicker');
  bgCp.input(() => { background(bgCp.value()); saveState(); historyLog = []; });
  let rbBtn = createButton('RAINBOW').parent(col3);
  rbBtn.mousePressed(() => rainbowMode = !rainbowMode);

  // COL 4
  let col4 = createDiv().parent(guiPanel).addClass('control-group');
  col4.child(createElement('label', '4. History'));
  createButton('UNDO').parent(col4).mousePressed(undo);
  createButton('REDO').parent(col4).mousePressed(redo);
  createButton('▶ REPLAY').parent(col4).mousePressed(startReplay).style('background', '#224422');

  // COL 5
  let col5 = createDiv().parent(guiPanel).addClass('control-group');
  col5.child(createElement('label', '5. Export'));
  createButton('SAVE PNG').parent(col5).mousePressed(() => saveCanvas('art', 'png')).style('background', '#fff').style('color', '#000');
  createButton('EXPORT GIF').parent(col5).mousePressed(exportGIF).style('background', '#ff5555');
}

function styleDarkButton(btn) {
  btn.style('background', '#fff'); btn.style('color', '#000');
  btn.style('border', '1px solid #fff'); btn.style('font-family', 'serif');
  btn.style('cursor', 'pointer');
}

function mouseReleased() {
  if (state === "APP" && mouseY < height - 160 && brushMode !== 'none' && !isReplaying) {
    saveState();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  if (state === "START") background(0);
}