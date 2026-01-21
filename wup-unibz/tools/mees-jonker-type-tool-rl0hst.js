//WUP 2025-2026
//Mees Jonker
let pg; 
let textInput, fontSelect, hSizeSlider;
let colSlider, rowSlider, textRotSlider;
let speedXSlider, speedYSlider, speedZSlider; 
let dirXSelect, dirYSelect, dirZSelect;        
let shapeSelect, textColorPicker, bgColorPicker;
let zoomSlider; // New Zoom Variable
let rotX = 0, rotY = 0, rotZ = 0; 

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  
  // High-resolution texture buffer
  pg = createGraphics(1000, 1000);
  pg.pixelDensity(2);
  
  setupUI();
}

function setupUI() {
  let UI_X = 20;
  let labelColor = '#ffffff';
  let headerColor = '#00ffcc';
  let motionHeader = '#ffaa00';

  // --- 1. Typography Module ---
  createHeader('1. TYPOGRAPHY', UI_X, 10, headerColor);
  textInput = createInput('KINETIC').position(UI_X, 35);
  
  createLabel('Font Family', UI_X, 65, labelColor);
  fontSelect = createSelect().position(UI_X, 85);
  fontSelect.option('Sans-Serif', 'sans-serif');
  fontSelect.option('Serif', 'serif');
  fontSelect.option('Monospace', 'monospace');
  fontSelect.option('Impact', 'Impact');

  createLabel('Font Size', UI_X, 115, labelColor);
  hSizeSlider = createSlider(10, 300, 60).position(UI_X, 130);

  // --- 2. Grid & Texture ---
  createHeader('2. GRID & TEXTURE', UI_X, 165, headerColor);
  createLabel('Columns', UI_X, 190, labelColor);
  colSlider = createSlider(1, 30, 5).position(UI_X, 205);
  
  createLabel('Rows', UI_X, 230, labelColor);
  rowSlider = createSlider(1, 30, 5).position(UI_X, 245);

  createLabel('Texture Rotation', UI_X, 270, labelColor);
  textRotSlider = createSlider(0, TWO_PI, 0, 0.01).position(UI_X, 285);

  // --- 3. Motion Engine ---
  createHeader('3. MOTION ENGINE', UI_X, 325, motionHeader);
  
  createLabel('X-Axis (Speed)', UI_X, 345, labelColor);
  dirXSelect = createSelect().position(UI_X, 360);
  addMotionModes(dirXSelect);
  speedXSlider = createSlider(0, 0.1, 0, 0.001).position(UI_X, 385);

  createLabel('Y-Axis (Speed)', UI_X, 415, labelColor);
  dirYSelect = createSelect().position(UI_X, 430);
  addMotionModes(dirYSelect);
  speedYSlider = createSlider(0, 0.1, 0.01, 0.001).position(UI_X, 455);

  createLabel('Z-Axis (Speed)', UI_X, 485, labelColor);
  dirZSelect = createSelect().position(UI_X, 500);
  addMotionModes(dirZSelect);
  speedZSlider = createSlider(0, 0.1, 0, 0.001).position(UI_X, 525);

  // --- 4. Style & Zoom ---
  createHeader('4. STYLE & VIEW', UI_X, 570, headerColor);
  
  createLabel('Geometry Shape', UI_X, 590, labelColor);
  shapeSelect = createSelect().position(UI_X, 605);
  shapeSelect.option('Cube'); shapeSelect.option('Cylinder'); 
  shapeSelect.option('Sphere'); shapeSelect.option('Torus');
  shapeSelect.option('Cone'); shapeSelect.option('Pyramid');
  shapeSelect.option('Plane');

  createLabel('Zoom (Scroll Wheel)', UI_X, 635, labelColor);
  zoomSlider = createSlider(-1000, 500, 0).position(UI_X, 650);

  createLabel('Colors (Text / BG)', UI_X, 680, labelColor);
  textColorPicker = createColorPicker('#ffffff').position(UI_X, 700);
  bgColorPicker = createColorPicker('#000000').position(UI_X + 65, 700);

  let btnPng = createButton('SAVE PNG').position(UI_X, 745).mousePressed(() => saveCanvas('kinetic_type', 'png'));
  let btnGif = createButton('SAVE GIF').position(UI_X + 90, 745).mousePressed(() => saveGif('kinetic_type', 3));
}

function addMotionModes(sel) {
  sel.option('Static');
  sel.option('Linear +');
  sel.option('Linear -');
  sel.option('Ping-Pong');
  sel.option('Sine Wave');
  sel.option('Jitter');
}

function draw() {
  background(15);
  updateTexture();

  // Apply Motion
  rotX = calculateMotion(dirXSelect.value(), speedXSlider.value(), rotX);
  rotY = calculateMotion(dirYSelect.value(), speedYSlider.value(), rotY);
  rotZ = calculateMotion(dirZSelect.value(), speedZSlider.value(), rotZ);

  // Manual Interaction (Click & Drag right of the menu)
  if (mouseIsPressed && mouseX > 250) {
    rotY += (mouseX - pmouseX) * 0.01;
    rotX -= (mouseY - pmouseY) * 0.01;
  }

  // 3D Rendering
  ambientLight(150);
  pointLight(255, 255, 255, 0, 0, 500);
  texture(pg);
  noStroke();

  push();
    // Apply Zoom (Z-axis translation)
    translate(0, 0, zoomSlider.value());
    
    rotateX(rotX); 
    rotateY(rotY); 
    rotateZ(rotZ); 
    renderShape(shapeSelect.value());
  pop();
}

function updateTexture() {
  pg.background(bgColorPicker.color()); 
  pg.fill(textColorPicker.color());
  pg.textAlign(CENTER, CENTER);
  pg.noStroke();
  pg.textFont(fontSelect.value());
  
  let xGap = pg.width / colSlider.value();
  let yGap = pg.height / rowSlider.value();
  
  for (let i = 0; i < colSlider.value(); i++) {
    for (let j = 0; j < rowSlider.value(); j++) {
      pg.push();
      pg.translate(i * xGap + xGap/2, j * yGap + yGap/2);
      pg.rotate(textRotSlider.value());
      pg.textSize(hSizeSlider.value());
      pg.text(textInput.value(), 0, 0);
      pg.pop();
    }
  }
}

// Mouse Wheel Zoom Logic
function mouseWheel(event) {
  if (mouseX > 250) {
    let sensitivity = 0.5;
    let newZoom = zoomSlider.value() - (event.delta * sensitivity);
    zoomSlider.value(constrain(newZoom, -1000, 500));
    return false; // Prevent page scroll
  }
}

function calculateMotion(mode, speed, currentVal) {
  if (mode === 'Linear +') return currentVal + speed;
  if (mode === 'Linear -') return currentVal - speed;
  if (mode === 'Ping-Pong') return sin(frameCount * speed) * PI;
  if (mode === 'Sine Wave') return currentVal + (sin(frameCount * 0.05) * speed);
  if (mode === 'Jitter') return currentVal + random(-speed, speed);
  return currentVal;
}

function renderShape(s) {
  if (s === 'Cube') box(250);
  else if (s === 'Cylinder') cylinder(100, 300);
  else if (s === 'Sphere') sphere(150, 48, 48);
  else if (s === 'Torus') torus(150, 50, 48, 48);
  else if (s === 'Cone') cone(150, 300, 48);
  else if (s === 'Pyramid') cone(150, 300, 4);
  else if (s === 'Plane') plane(500, 500);
}

// UI Helpers
function createHeader(txt, x, y, col) {
  let h = createSpan(txt).position(x, y);
  h.style('color', col).style('font-family', 'Arial').style('font-size', '14px').style('font-weight', 'bold');
}

function createLabel(txt, x, y, col) {
  let l = createSpan(txt).position(x, y);
  l.style('color', col).style('font-family', 'Arial').style('font-size', '11px');
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}