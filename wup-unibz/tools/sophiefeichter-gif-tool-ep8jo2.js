let shapeSelect, fontSelect, colorPicker, bgPicker, textColorPicker, speedSlider, repetitionSlider, textInput;
let startSizeSlider, endSizeSlider, startTextSlider, endTextSlider, cycleSlider;
let gifBtn, canvas; 
let isRecording = false;
let customFont; 
let fontFileInput; 
let durationSeconds = 5; 
let fps = 20; 
let recordStartTime = 0;

function setup() {
  let mainContainer = createDiv();
  mainContainer.style('display', 'flex');
  mainContainer.style('font-family', '"Inter", sans-serif');
  mainContainer.style('background', '#1a1a1a');
  mainContainer.style('min-height', '100vh');

  let gui = createDiv();
  gui.parent(mainContainer);
  gui.style('width', '300px');
  gui.style('background', '#ffffff');
  gui.style('padding', '20px');
  gui.style('display', 'flex');
  gui.style('flex-direction', 'column');
  gui.style('gap', '10px');
  gui.style('box-shadow', '4px 0 15px rgba(0,0,0,0.3)');
  gui.style('overflow-y', 'auto');
  gui.style('height', '100vh');

  gui.html('<b style="font-size:22px;">GIF CREATOR</b><hr>', true);

  createSpan('Text Content:').parent(gui);
  textInput = createInput('hi').parent(gui);
  
  createSpan('Font Style:').parent(gui);
  fontSelect = createSelect().parent(gui);
  ['Sans-Serif', 'Serif', 'Monospace', 'Cursive'].forEach(f => fontSelect.option(f));

  let uploadBtn = createButton('Upload Font');
  uploadBtn.parent(gui);
  uploadBtn.style('background', '#34495e');
  uploadBtn.style('color', 'white');
  uploadBtn.style('padding', '8px');
  uploadBtn.style('cursor', 'pointer');
  
  fontFileInput = createFileInput(handleFile);
  fontFileInput.hide();
  uploadBtn.mousePressed(() => fontFileInput.elt.click());

  gui.html('<br><b style="color:#e67e22;">Animation Settings</b>', true);
  createSpan('Pulse Frequency (Cycles):').parent(gui);
  cycleSlider = createSlider(1, 10, 2, 1).parent(gui); 

  createSpan('Rotation (Full Loops):').parent(gui);
  speedSlider = createSlider(0, 5, 1, 1).parent(gui); 

  gui.html('<br><b>Shape Scale (Min to Max)</b>', true);
  createSpan('Start Scale:').parent(gui);
  startSizeSlider = createSlider(0, 2, 0.4, 0.05).parent(gui);
  createSpan('End Scale:').parent(gui);
  endSizeSlider = createSlider(0, 2, 1.2, 0.05).parent(gui);

  gui.html('<br><b>Text Size (Min to Max)</b>', true);
  createSpan('Start Text Size:').parent(gui);
  startTextSlider = createSlider(5, 150, 30).parent(gui);
  createSpan('End Text Size:').parent(gui);
  endTextSlider = createSlider(5, 150, 80).parent(gui);

  gui.html('<hr>', true);
  createSpan('Shape color:').parent(gui);
  colorPicker = createColorPicker('#3498db').parent(gui);
  createSpan('Text color:').parent(gui);
  textColorPicker = createColorPicker('#ffffff').parent(gui);
  createSpan('background:').parent(gui);
  bgPicker = createColorPicker('#111111').parent(gui);

  createSpan('Select Shape:').parent(gui);
  shapeSelect = createSelect().parent(gui);
  ['Circle', 'Square', 'Polygon (5-Side)', 'Star', 'Spiral', 'Atom', 'Heart', 'Flower', 'Gear'].forEach(s => shapeSelect.option(s));

  createSpan('Grid (NxN):').parent(gui);
  repetitionSlider = createSlider(1, 5, 2, 1).parent(gui);

  gifBtn = createButton(`EXPORT PERFECT LOOP (5s)`);
  gifBtn.parent(gui);
  gifBtn.style('margin-top', '15px');
  gifBtn.style('background', '#27ae60');
  gifBtn.style('color', 'white');
  gifBtn.style('padding', '12px');
  gifBtn.style('cursor', 'pointer');
  gifBtn.mousePressed(startRecording);

  let resetBtn = createButton('Restart Tool');
  resetBtn.parent(gui);
  resetBtn.style('background', '#7f8c8d');
  resetBtn.style('color', 'white');
  resetBtn.style('padding', '10px');
  resetBtn.style('border', 'none');
  resetBtn.style('cursor', 'pointer');
  resetBtn.mousePressed(resetTool);

  let canvasContainer = createDiv().parent(mainContainer);
  canvasContainer.style('flex-grow', '1');
  canvasContainer.style('display', 'flex');
  canvasContainer.style('justify-content', 'center');
  canvasContainer.style('align-items', 'center');

  canvas = createCanvas(600, 600);
  canvas.parent(canvasContainer);
  frameRate(fps);
}

function handleFile(file) {
  if (file.name.endsWith('.ttf') || file.name.endsWith('.otf')) {
    loadFont(file.data, (f) => { customFont = f; fontSelect.option(file.name, 'CUSTOM'); fontSelect.selected('CUSTOM'); });
  }
}

function startRecording() {
  isRecording = true;
  recordStartTime = millis();
  gifBtn.html('RECORDING...');
  gifBtn.style('background', '#c0392b');
  
  saveGif('perfect_loop.gif', durationSeconds, { 
    units: 'seconds', 
    framerate: fps, 
    onComplete: () => {
      isRecording = false;
      gifBtn.html(`EXPORT PERFECT LOOP (5s)`);
      gifBtn.style('background', '#27ae60');
    }
  });
}

function resetTool() {
  isRecording = false;
  gifBtn.html(`EXPORT PERFECT LOOP (5s)`);
  gifBtn.style('background', '#27ae60');
  cycleSlider.value(2);
  speedSlider.value(1);
  startSizeSlider.value(0.4);
  endSizeSlider.value(1.2);
  startTextSlider.value(30);
  endTextSlider.value(80);
  repetitionSlider.value(2);
  textInput.value('hi');
  colorPicker.value('#3498db');
  textColorPicker.value('#ffffff');
  bgPicker.value('#111111');
}

function draw() {
  background(bgPicker.color());
  
  let msLimit = durationSeconds * 1000;
  let progress;

  if (isRecording) {
    let totalFrames = durationSeconds * fps;
    progress = (frameCount % totalFrames) / totalFrames;
  } else {
    progress = (millis() % msLimit) / msLimit;
  }

  let cycles = cycleSlider.value();
  let wave = sin(progress * TWO_PI * cycles - HALF_PI);
  let t = map(wave, -1, 1, 0, 1); 

  let currentShapeScale = lerp(startSizeSlider.value(), endSizeSlider.value(), t);
  let currentTextSize = lerp(startTextSlider.value(), endTextSlider.value(), t);
  
  let rotationsPerGif = speedSlider.value();
  let currentRotation = progress * TWO_PI * rotationsPerGif;

  let gridN = repetitionSlider.value(); 
  let cellSize = width / gridN;
  let objectSize = cellSize * currentShapeScale;

  for (let r = 0; r < gridN; r++) {
    for (let c = 0; c < gridN; c++) {
      push();
      translate(c * cellSize + cellSize/2, r * cellSize + cellSize/2);
      fill(colorPicker.color());
      stroke(colorPicker.color());
      strokeWeight(2);
      renderShape(shapeSelect.value(), objectSize, currentRotation, (r + c) * 0.2);
      fill(textColorPicker.color());
      noStroke();
      textAlign(CENTER, CENTER);
      if (fontSelect.value() === 'CUSTOM' && customFont) textFont(customFont);
      else textFont(fontSelect.value());
      textSize(currentTextSize); 
      text(textInput.value(), 0, 0);
      pop();
    }
  }
}

function renderShape(mode, sz, rotation, offset) {
  push();
  rotate(rotation + offset);
  if (mode === 'Circle') ellipse(0, 0, sz);
  else if (mode === 'Square') { rectMode(CENTER); rect(0, 0, sz, sz, sz*0.1); }
  else if (mode === 'Polygon (5-Side)') drawPolygon(0, 0, sz / 2, 5);
  else if (mode === 'Star') drawStar(0, 0, sz / 5, sz / 2, 5);
  else if (mode === 'Spiral') {
    noFill(); beginShape();
    for (let a = 0; a < TWO_PI * 3; a += 0.1) {
      let r = map(a, 0, TWO_PI * 3, 0, sz / 2);
      vertex(r * cos(a), r * sin(a));
    }
    endShape();
  }
  else if (mode === 'Atom') {
    noFill(); for(let j=0; j<3; j++) {
      push(); rotate(j * PI/3); ellipse(0, 0, sz, sz/3); pop();
    }
  }
  else if (mode === 'Heart') drawHeart(0, 0, sz/60);
  else if (mode === 'Flower') {
    for (let k = 0; k < 8; k++) {
      push(); rotate(TWO_PI * k / 8); ellipse(sz/4, 0, sz/2, sz/6); pop();
    }
  }
  else if (mode === 'Gear') drawGear(sz/2, sz/3, 12);
  pop();
}

function drawPolygon(x, y, radius, npoints) {
  let angle = TWO_PI / npoints;
  beginShape();
  for (let a = 0; a < TWO_PI; a += angle) { vertex(x + cos(a) * radius, y + sin(a) * radius); }
  endShape(CLOSE);
}

function drawStar(x, y, r1, r2, n) {
  let angle = TWO_PI / n;
  beginShape();
  for (let a = 0; a < TWO_PI; a += angle) {
    vertex(x + cos(a) * r2, y + sin(a) * r2);
    vertex(x + cos(a + angle/2) * r1, y + sin(a + angle/2) * r1);
  }
  endShape(CLOSE);
}

function drawHeart(x, y, size) {
  beginShape();
  for (let a = 0; a < TWO_PI; a += 0.1) {
    let hx = size * 16 * pow(sin(a), 3);
    let hy = -size * (13 * cos(a) - 5 * cos(2 * a) - 2 * cos(3 * a) - cos(4 * a));
    vertex(hx, hy);
  }
  endShape(CLOSE);
}

function drawGear(outer, inner, teeth) {
  beginShape();
  for (let i = 0; i < teeth; i++) {
    let a1 = TWO_PI / teeth * i;
    let a2 = TWO_PI / teeth * (i + 0.5);
    vertex(cos(a1) * outer, sin(a1) * outer); vertex(cos(a1) * inner, sin(a1) * inner);
    vertex(cos(a2) * inner, sin(a2) * inner); vertex(cos(a2) * outer, sin(a2) * outer);
  }
  endShape(CLOSE);
}