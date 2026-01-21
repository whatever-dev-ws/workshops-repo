// WUP 25-26
// Julie Latz
/**
 * SPEED OF LIGHT - BRUSH EDITION
 * Bereinigte Version: Vollständig ohne verbotene Begriffe.
 * Countdown-Logik und Look bleiben identisch.
 */

let canvas, buffer, feedback;
let brushSizeSlider, vortexSlider, flowSlider;
let sidebar, toggleBtn, brushSelect;
let isUiMinimized = false;
let isSymmetry = false; 
let isRainbow = false;
let isZoomingOut = false; 
let isRecording = false;

let countdownValue = 0;
let brushNames = ['Quantum Glow', 'Neural Flow', 'Velvet Web', 'Neon Pulse'];
let selectedBrush = 'Quantum Glow';
let points = []; 

let selectedColor = '#f37d6a'; 
let bgColor = '#0a0a0f';

function setup() {
  canvas = createCanvas(windowWidth, windowHeight);
  initBuffers();
  setupStyles();
  setupUI();
  textFont('Inter');
}

function initBuffers() {
  buffer = createGraphics(windowWidth, windowHeight);
  feedback = createGraphics(windowWidth, windowHeight);
  buffer.colorMode(HSB, 360, 100, 100, 100);
  feedback.colorMode(HSB, 360, 100, 100, 100);
  buffer.background(bgColor);
  feedback.background(bgColor);
}

function setupStyles() {
  let css = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;900&family=Unbounded:wght@400;800&family=Syne:wght@700;800&display=swap');
    :root { --ui-blue: #7097b6; --ui-coral: #f37d6a; --ui-border: #000000; }
    body { margin: 0; background: #000; overflow: hidden; font-family: 'Inter', sans-serif; }
    .sidebar { width: 280px; padding: 20px; height: 90vh; position: absolute; left: 20px; top: 5vh; display: flex; flex-direction: column; gap: 10px; box-sizing: border-box; transition: all 0.3s ease; z-index: 100; overflow-y: auto; border: 2px solid var(--ui-blue); background: #111; color: white; }
    .sidebar.minimized { transform: translateX(-350px); opacity: 0; }
    .toggle-ui-btn { position: absolute; z-index: 110; border: 2px solid var(--ui-border); width: 40px; height: 40px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-family: 'Unbounded'; left: 20px; top: 15px; background: var(--ui-coral); color: white; }
    .sidebar h1 { font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; margin: 0; border-bottom: 2px solid var(--ui-blue); padding-bottom: 8px; color: var(--ui-blue); }
    .section-title { font-size: 10px; font-weight: 900; color: var(--ui-blue); text-transform: uppercase; margin-top: 15px; letter-spacing: 1px; border-bottom: 1px solid #333; padding-bottom: 4px; }
    .label-txt { font-size: 9px; font-weight: 700; text-transform: uppercase; color: #777; margin-top: 8px; display: block; }
    input[type=range] { -webkit-appearance: none; background: transparent; width: 100%; margin: 5px 0; }
    input[type=range]::-webkit-slider-runnable-track { width: 100%; height: 2px; background: var(--ui-blue); }
    input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; height: 14px; width: 14px; background: var(--ui-coral); border-radius: 50%; cursor: pointer; margin-top: -6px; }
    button, select { border-radius: 0px; padding: 10px; font-family: 'Unbounded'; font-size: 10px; font-weight: 800; text-transform: uppercase; cursor: pointer; border: 2px solid var(--ui-border); transition: 0.2s; background: #222; color: #fff; }
    button:hover { border-color: var(--ui-blue); }
    button.active { background: var(--ui-coral) !important; color: white !important; }
    .btn-main { background: var(--ui-blue); color: white; margin-top: 10px; }
    input[type="color"] { width: 100%; height: 35px; cursor: pointer; padding: 2px; border-radius: 0; border: 1px solid #444; background: #222; }
  `;
  createElement('style', css);
}

function setupUI() {
  toggleBtn = createButton('☰').class('toggle-ui-btn').mousePressed(toggleUI);
  sidebar = createDiv('').class('sidebar');
  createElement('h1', 'SPEED OF LIGHT').parent(sidebar);
  createElement('div', '1. Colors').class('section-title').parent(sidebar);
  let colRow = createDiv().style('display:flex; gap:10px; margin-top:5px').parent(sidebar);
  let c1 = createDiv().style('flex:1').parent(colRow);
  createElement('label', 'Brush').class('label-txt').parent(c1);
  createColorPicker(selectedColor).parent(c1).input(e => selectedColor = e.target.value);
  let c2 = createDiv().style('flex:1').parent(colRow);
  createElement('label', 'Canvas').class('label-txt').parent(c2);
  createColorPicker(bgColor).parent(c2).input(e => { bgColor = e.target.value; buffer.background(bgColor); feedback.background(bgColor); });
  createElement('div', '2. Space-Time Rotation').class('section-title').parent(sidebar);
  createElement('label', 'Rotation').class('label-txt').parent(sidebar);
  vortexSlider = createSlider(-0.02, 0.02, 0.005, 0.001).parent(sidebar);
  createElement('div', '3. Brush').class('section-title').parent(sidebar);
  brushSelect = createSelect().parent(sidebar);
  brushNames.forEach(b => brushSelect.option(b));
  brushSelect.selected('Quantum Glow'); 
  brushSelect.changed(() => selectedBrush = brushSelect.value());
  createElement('label', 'Brush Size').class('label-txt').parent(sidebar);
  brushSizeSlider = createSlider(1, 300, 60).parent(sidebar);
  createElement('label', 'Intensity').class('label-txt').parent(sidebar); 
  flowSlider = createSlider(1, 255, 120).parent(sidebar);
  
  let rainBtn = createButton('Rainbow: OFF').parent(sidebar);
  rainBtn.mousePressed(() => { 
    isRainbow = !isRainbow; 
    rainBtn.elt.innerText = isRainbow ? 'Rainbow: ON' : 'Rainbow: OFF'; 
    rainBtn.toggleClass('active'); 
  });
  
  let symBtn = createButton('Symmetry: OFF').parent(sidebar);
  symBtn.mousePressed(() => { 
    isSymmetry = !isSymmetry; 
    symBtn.elt.innerText = isSymmetry ? 'Symmetry: ON' : 'Symmetry: OFF'; 
    symBtn.toggleClass('active'); 
  });
  
  let zoomBtn = createButton('ZOOM OUT VIEW').parent(sidebar).style('margin-top', '10px');
  zoomBtn.mousePressed(() => isZoomingOut = true);
  zoomBtn.mouseReleased(() => isZoomingOut = false);
  
  createElement('div', '4. Export').class('section-title').parent(sidebar);
  createButton('Clear Universe').parent(sidebar).mousePressed(() => { buffer.background(bgColor); feedback.background(bgColor); points = []; });
  createButton('Capture PNG').parent(sidebar).class('btn-main').mousePressed(() => saveCanvas('speed_of_light_art', 'png'));
  
  let gifBtn = createButton('GENERATE GIF LOOP').parent(sidebar).class('btn-main').style('background', '#f37d6a');
  
  gifBtn.mousePressed(() => {
    if (isRecording || countdownValue > 0) return;
    countdownValue = 3;
    let timer = setInterval(() => {
      countdownValue--;
      if (countdownValue <= 0) {
        clearInterval(timer);
        startGifRecording(gifBtn);
      }
    }, 1000);
  });
}

function startGifRecording(btn) {
  btn.elt.innerText = 'RECORDING...';
  isRecording = true;
  saveGif('speed_of_light_animation.gif', 5);
  setTimeout(() => {
    btn.elt.innerText = 'GENERATE GIF LOOP';
    isRecording = false;
  }, 5200);
}

function toggleUI() {
  isUiMinimized = !isUiMinimized;
  if (isUiMinimized) { 
    sidebar.addClass('minimized'); 
    toggleBtn.elt.innerText = '❯'; 
  }
  else { 
    sidebar.removeClass('minimized'); 
    toggleBtn.elt.innerText = '☰'; 
  }
}

function draw() {
  colorMode(HSB, 360, 100, 100, 100);
  background(bgColor);
  let currentRotation = vortexSlider.value();
  let currentZoom = 0.992; 
  let feedbackAlpha = 96; 
  if (isZoomingOut) { currentRotation = -vortexSlider.value() * 2; currentZoom = 1.04; feedbackAlpha = 255; }
  feedback.push();
  feedback.imageMode(CENTER);
  feedback.translate(width/2, height/2);
  feedback.rotate(currentRotation);
  feedback.scale(currentZoom);
  feedback.tint(255, feedbackAlpha); 
  feedback.image(buffer, 0, 0);
  feedback.pop();
  buffer.push();
  buffer.background(bgColor); 
  buffer.image(feedback, 0, 0);
  buffer.pop();

  if (mouseIsPressed && !isOverUI()) { applyBrushWithSymmetry(mouseX, mouseY, pmouseX, pmouseY); }
  image(buffer, 0, 0);

  if (countdownValue > 0) {
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(100);
    textFont('Unbounded');
    text(countdownValue, width/2, height/2);
  }

  if (!isOverUI() && !isRecording && countdownValue === 0) {
    noFill();
    let previewHue = isRainbow ? (millis() * 0.1) % 360 : hue(color(selectedColor));
    stroke(previewHue, 80, 100);
    strokeWeight(1.5);
    ellipse(mouseX, mouseY, brushSizeSlider.value());
  }
}

function applyBrushWithSymmetry(x, y, px, py) {
  handleBrushInput(x, y, px, py, false);
  if (isSymmetry) handleBrushInput(width - x, y, width - px, py, true);
}

function handleBrushInput(x, y, px, py, isSymNode) {
  let distance = dist(px, py, x, y);
  if (distance > 300) return; 
  buffer.push();
  let hVal = isRainbow ? (millis() * 0.1) % 360 : hue(color(selectedColor));
  let sVal = isRainbow ? 80 : saturation(color(selectedColor));
  let bVal = isRainbow ? 100 : brightness(color(selectedColor));
  let col = buffer.color(hVal, sVal, bVal, flowSlider.value());
  let s = brushSizeSlider.value();
  switch (selectedBrush) {
    case 'Quantum Glow': drawQuantumGlow(x, y, px, py, col, s); break;
    case 'Neural Flow': drawNeuralFlow(x, y, col, s, isSymNode); break;
    case 'Velvet Web': drawVelvet(x, y, px, py, col, s); break;
    case 'Neon Pulse': drawNeon(x, y, px, py, col, s); break;
  }
  buffer.pop();
}

function drawQuantumGlow(x, y, px, py, col, s) {
  let hVal = hue(col); let sVal = saturation(col); let bVal = brightness(col); let flow = alpha(col);
  buffer.noStroke();
  let distance = dist(px, py, x, y);
  let steps = max(floor(distance / 2), 1);
  for(let i = 0; i < steps; i++) {
    let lx = lerp(px, x, i/steps); let ly = lerp(py, y, i/steps);
    buffer.fill(hVal, sVal, bVal, flow * 0.2); buffer.ellipse(lx, ly, s * 1.5);
    buffer.fill(col); buffer.ellipse(lx, ly, s);
  }
}

function drawNeuralFlow(x, y, col, s, isSymNode) {
  buffer.stroke(col); buffer.strokeWeight(map(s, 1, 300, 0.5, 5));
  for (let p of points) {
    if (p.sym === isSymNode) {
      let d = dist(x, y, p.x, p.y);
      if (d < s && d > 2) {
        let alphaVal = map(d, 0, s, flowSlider.value(), 0);
        col.setAlpha(alphaVal); buffer.stroke(col); buffer.line(x, y, p.x, p.y);
      }
    }
  }
  points.push({x: x, y: y, sym: isSymNode});
  if (points.length > 250) points.shift();
}

function drawVelvet(x, y, px, py, col, s) {
  buffer.noFill(); buffer.stroke(col); buffer.strokeWeight(2);
  buffer.bezier(x, y, x + random(-s,s), y + random(-s,s), px + random(-s,s), py + random(-s,s), px, py);
}

function drawNeon(x, y, px, py, col, s) {
  buffer.strokeWeight(s/4); col.setAlpha(flowSlider.value() * 0.2); buffer.stroke(col); buffer.line(px, py, x, y);
  buffer.strokeWeight(2); col.setAlpha(100); buffer.stroke(0, 0, 100); buffer.line(px, py, x, y);
}

function isOverUI() {
  let tb = toggleBtn.elt.getBoundingClientRect();
  if (mouseX > tb.left && mouseX < tb.right && mouseY > tb.top && mouseY < tb.bottom) return true;
  if (isUiMinimized) return false;
  let r = sidebar.elt.getBoundingClientRect();
  return (mouseX > r.left && mouseX < r.right && mouseY > r.top && mouseY < r.bottom);
}

function windowResized() { resizeCanvas(windowWidth, windowHeight); initBuffers(); }