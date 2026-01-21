// WUP 2025-2026
// Nibir Khan
// Refined for Tool Viewer Compatibility
let drawingLayer;
let colorPicker, bgPicker, sizeSlider, alphaSlider, effectSelector;
let shapeSelector, emojiInput; 
let clearBtn, saveBtn, undoBtn;

let history = [];
const maxHistory = 10;
let hueValue = 0; 

function setup() {
  createCanvas(windowWidth, windowHeight);
  
  // Initialize drawing layer
  drawingLayer = createGraphics(windowWidth, windowHeight);
  drawingLayer.clear(); 
  drawingLayer.strokeJoin(ROUND);
  drawingLayer.strokeCap(ROUND);
  
  saveState();
  setupUI();
}

function draw() {
  // 1. Draw Background
  background(bgPicker.color()); 
  
  // 2. Draw the Art Layer
  image(drawingLayer, 0, 0);
  
  // 3. Draw UI Background Bar (ensures readability)
  push();
  fill(20, 20, 20, 230); // Dark translucent bar
  noStroke();
  rect(0, height - 120, width, 120);
  stroke(255, 30);
  line(0, height - 120, width, height - 120);
  pop();
  
  // 4. Handle Drawing Input
  if (mouseIsPressed && mouseY < height - 120) {
    drawFluidStroke();
  }
}

// --- CORE DRAWING LOGIC ---

function drawFluidStroke() {
  let col = colorPicker.color();
  let sz = sizeSlider.value();
  let opac = alphaSlider.value();
  let effect = effectSelector.value();
  let shape = shapeSelector.value();
  
  if (effect === 'Rainbow') {
    colorMode(HSB, 360, 100, 100);
    col = color(hueValue, 80, 100);
    hueValue = (hueValue + 2) % 360;
    colorMode(RGB, 255, 255, 255);
  }
  
  col.setAlpha(opac);

  let d = dist(pmouseX, pmouseY, mouseX, mouseY);
  let steps = max(1, d / (sz / 8)); 

  for (let i = 1; i <= steps; i++) {
    let t = i / steps;
    let x = lerp(pmouseX, mouseX, t);
    let y = lerp(pmouseY, mouseY, t);
    
    if (effect === 'Eraser') {
      drawingLayer.erase();
      drawingLayer.noStroke();
      drawingLayer.ellipse(x, y, sz);
      drawingLayer.noErase();
    } 
    else if (effect === 'Calligraphic') {
      let speed = dist(pmouseX, pmouseY, mouseX, mouseY);
      let dynamicSize = map(speed, 0, 50, sz * 0.5, sz * 0.15);
      drawingLayer.noStroke();
      drawingLayer.fill(col);
      drawBaseShape(x, y, dynamicSize, shape);
    } 
    else if (effect === 'Emoji') {
      drawingLayer.noStroke();
      drawingLayer.textSize(sz);
      drawingLayer.textAlign(CENTER, CENTER);
      drawingLayer.text(emojiInput.value(), x, y);
    }
    else if (effect === 'Neon') {
      drawNeonShape(x, y, sz, col, shape, opac);
    } 
    else if (effect === 'Airbrush') {
      drawAirbrush(x, y, sz, col, opac);
    }
    else if (effect === 'Particles') {
      drawingLayer.noStroke();
      drawingLayer.fill(col);
      drawingLayer.ellipse(x + random(-sz, sz), y + random(-sz, sz), random(2, sz/3));
    }
    else if (effect === 'Scribble') { 
      drawScribble(x, y, sz, col);
    }
    else {
      drawingLayer.noStroke();
      drawingLayer.fill(col);
      drawBaseShape(x, y, sz, shape);
    }
  }
}

// --- SHAPE HELPERS ---

function drawAirbrush(x, y, sz, col, opac) {
  drawingLayer.noStroke();
  let sprayCol = color(red(col), green(col), blue(col), opac * 0.2);
  drawingLayer.fill(sprayCol);
  let density = map(sz, 5, 150, 10, 80); 
  for (let i = 0; i < density; i++) {
    let angle = random(TWO_PI);
    let r = random(sz / 2); 
    let px = x + cos(angle) * r;
    let py = y + sin(angle) * r;
    drawingLayer.circle(px, py, random(1, 3)); 
  }
}

function drawScribble(x, y, sz, col) {
  drawingLayer.stroke(col);
  drawingLayer.strokeWeight(1.5);
  for (let i = 0; i < 3; i++) {
    let ox = random(-sz, sz);
    let oy = random(-sz, sz);
    drawingLayer.line(x + ox, y + oy, x - ox, y - oy);
  }
}

function drawBaseShape(x, y, sz, shape) {
  if (shape === 'Circle') drawingLayer.ellipse(x, y, sz);
  else if (shape === 'Square') {
    drawingLayer.rectMode(CENTER);
    drawingLayer.rect(x, y, sz, sz);
  }
  else if (shape === 'Star') {
    drawStar(x, y, sz/2, sz, 5);
  }
}

function drawStar(x, y, r1, r2, npoints) {
  let angle = TWO_PI / npoints;
  let halfAngle = angle / 2.0;
  drawingLayer.beginShape();
  for (let a = 0; a < TWO_PI; a += angle) {
    drawingLayer.vertex(x + cos(a) * r2, y + sin(a) * r2);
    drawingLayer.vertex(x + cos(a + halfAngle) * r1, y + sin(a + halfAngle) * r1);
  }
  drawingLayer.endShape(CLOSE);
}

function drawNeonShape(x, y, sz, col, shape, opac) {
  for (let j = 3; j > 0; j--) {
    let glowAlpha = map(j, 1, 3, opac * 0.3, 0);
    drawingLayer.fill(red(col), green(col), blue(col), glowAlpha);
    drawBaseShape(x, y, sz + (j * 10), shape);
  }
  drawingLayer.fill(255, opac);
  drawBaseShape(x, y, sz, shape);
}

// --- UI & SYSTEM ---

function setupUI() {
  const uiY = height - 100;

  // Colors
  createLabel('COLOR', 20, uiY);
  colorPicker = createColorPicker('#39FF14').position(20, uiY + 15);

  createLabel('BACKGROUND', 120, uiY);
  bgPicker = createColorPicker('#000000').position(120, uiY + 15);
  bgPicker.input(() => { saveState(); });

  // Sliders
  createLabel('SIZE', 220, uiY);
  sizeSlider = createSlider(5, 150, 40).position(220, uiY + 15);

  createLabel('OPACITY', 400, uiY);
  alphaSlider = createSlider(0, 255, 150).position(400, uiY + 15);

  // Selectors
  createLabel('BRUSH', 20, uiY + 45);
  effectSelector = createSelect().position(20, uiY + 60);
  ['Simple', 'Neon', 'Airbrush', 'Calligraphic', 'Scribble', 'Particles', 'Rainbow', 'Emoji', 'Eraser'].forEach(o => effectSelector.option(o));

  createLabel('SHAPE', 150, uiY + 45);
  shapeSelector = createSelect().position(150, uiY + 60);
  ['Circle', 'Square', 'Star'].forEach(o => shapeSelector.option(o));

  createLabel('EMOJI', 280, uiY + 45);
  emojiInput = createInput('✨').position(280, uiY + 60).size(40);

  // Buttons
  undoBtn = createButton('UNDO').position(400, uiY + 60);
  applyButtonStyle(undoBtn, '#ffcc00', '#000');
  undoBtn.mousePressed(undoEffect);

  clearBtn = createButton('CLEAR').position(480, uiY + 60);
  applyButtonStyle(clearBtn, '#ff4444', '#fff');
  clearBtn.mousePressed(() => { 
    drawingLayer.clear(); 
    saveState(); 
  });

  saveBtn = createButton('SAVE').position(560, uiY + 60);
  applyButtonStyle(saveBtn, '#44aaff', '#fff');
  saveBtn.mousePressed(() => saveCanvas('my_art', 'png'));
}

function createLabel(txt, x, y) {
  let l = createElement('span', txt);
  l.position(x, y);
  l.style('color', '#ffffff');
  l.style('font-family', 'sans-serif');
  l.style('font-size', '10px');
  l.style('font-weight', 'bold');
}

function applyButtonStyle(btn, bg, fg) {
  btn.style('background-color', bg);
  btn.style('color', fg);
  btn.style('border', 'none');
  btn.style('padding', '5px 12px');
  btn.style('border-radius', '4px');
  btn.style('cursor', 'pointer');
  btn.style('font-weight', 'bold');
  
  btn.mouseOver(() => btn.style('filter', 'brightness(1.2)'));
  btn.mouseOut(() => btn.style('filter', 'brightness(1.0)'));
}

function saveState() {
  history.push(drawingLayer.get());
  if (history.length > maxHistory) history.shift();
}

function undoEffect() {
  if (history.length > 1) {
    history.pop();
    let previousState = history[history.length - 1];
    drawingLayer.clear();
    drawingLayer.image(previousState, 0, 0);
  }
}

function mouseReleased() {
  if (mouseY < height - 120) saveState();
}

function windowResized() { 
  let tempArt = drawingLayer.get();
  resizeCanvas(windowWidth, windowHeight); 
  drawingLayer = createGraphics(windowWidth, windowHeight);
  drawingLayer.clear();
  drawingLayer.image(tempArt, 0, 0);
  
  // Reposition UI
  removeElements();
  setupUI();
}