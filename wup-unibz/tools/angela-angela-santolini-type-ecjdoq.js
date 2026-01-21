// WUP 25-26
// Angela Santolini
let textContent, fontSizeControl, lineSpacingControl, characterWrap;      
let inkColor, paperColor, textAlignment, canvasFormat, fontSelect; 

let lensType, addLensBtn, objects = [], targetObject = null, activeObject = null;
let offset_X = 0, offset_Y = 0, lensScale, lensRotation;

let manualInk, inkWeight, resetInkBtn, strokes = [], currentStroke = []; 
let isRecording = false;

// NUOVI PARAMETRI PRO
let blendModeSelect;
let noiseSlider;

function setup() {
  let c = createCanvas(600, 400);
  angleMode(DEGREES);
  injectFontsAndStyle();

  // 01 / ARCHITETTURA CANVAS
  let section1 = createDiv().class('ui-section');
  section1.child(createP('<b>01 / ARCHITETTURA CANVAS</b>').class('title'));
  canvasFormat = createSelect().parent(section1).class('styled-select');
  canvasFormat.option('Landscape (600x400)'); canvasFormat.option('Square (500x500)');
  canvasFormat.option('Portrait (400x600)'); canvasFormat.option('Widescreen (800x400)');
  canvasFormat.changed(adjustCanvas);
  createSpan(' &nbsp; Paper: ').parent(section1);
  paperColor = createColorPicker('#050505').parent(section1);

  // 02 / TIPOGRAFIA
  let section2 = createDiv().class('ui-section');
  section2.child(createP('<b>02 / TIPOGRAFIA</b>').class('title'));
  textContent = createInput('ÆSTHETICA PRO').parent(section2).class('styled-input'); 
  fontSelect = createSelect().parent(section2).class('styled-select');
  fontSelect.option('Modern Sans'); fontSelect.option('Classic Serif'); fontSelect.option('Industrial Stencil');
  
  let sliderGroup = createDiv().parent(section2).class('slider-group');
  createSpan('Size: ').parent(sliderGroup);
  fontSizeControl = createSlider(10, 250, 90, 1).parent(sliderGroup);
  createSpan(' &nbsp; Leading: ').parent(sliderGroup);
  lineSpacingControl = createSlider(10, 250, 90, 1).parent(sliderGroup);
  inkColor = createColorPicker('#ffffff').parent(section2);

  // 03 / LENTI & FUSIONE (AGGIORNATA)
  let section3 = createDiv().class('ui-section');
  section3.child(createP('<b>03 / LENTI & FUSIONE</b>').class('title'));
  
  let row1 = createDiv().parent(section3).class('row');
  lensType = createSelect().parent(row1).class('styled-select');
  lensType.option('Circle'); lensType.option('Square'); lensType.option('Rectangle');
  lensType.option('Triangle'); lensType.option('Star');
  
  blendModeSelect = createSelect().parent(row1).class('styled-select').style('margin-left','10px');
  blendModeSelect.option('DIFFERENCE');
  blendModeSelect.option('MULTIPLY');
  blendModeSelect.option('SCREEN');
  blendModeSelect.option('OVERLAY');
  blendModeSelect.option('EXCLUSION');

  addLensBtn = createButton('ADD LENS').parent(section3).class('styled-btn');
  addLensBtn.mousePressed(generateNewLens);

  let propGroup = createDiv().parent(section3).class('slider-group');
  createSpan('Scale: ').parent(propGroup);
  lensScale = createSlider(10, 400, 100, 1).parent(propGroup);
  createSpan(' Rotation: ').parent(propGroup);
  lensRotation = createSlider(0, 360, 0, 1).parent(propGroup);

  // 04 / TRATTO MANUALE
  let section4 = createDiv().class('ui-section');
  section4.child(createP('<b>04 / TRATTO MANUALE</b>').class('title'));
  manualInk = createCheckbox(' Ink Mode', false).parent(section4).class('styled-check');
  inkWeight = createSlider(2, 80, 15, 1).parent(section4);
  resetInkBtn = createButton('PURGE').parent(section4).class('styled-btn ghost');
  resetInkBtn.mousePressed(() => { strokes = []; }); 

  // 05 / POST-PROCESSING (NUOVA)
  let section5 = createDiv().class('ui-section');
  section5.child(createP('<b>05 / POST-PROCESSING</b>').class('title'));
  createSpan('Grain Intensity: ').parent(section5);
  noiseSlider = createSlider(0, 100, 15, 1).parent(section5);

  // 06 / ESPORTAZIONE
  let section6 = createDiv().class('ui-section');
  section6.child(createP('<b>06 / ESPORTAZIONE</b>').class('title'));
  let saveBtn = createButton('JPG').parent(section6).class('styled-btn');
  saveBtn.mousePressed(() => saveCanvas('Aesthetica_Pro', 'jpg'));
  let gifBtn = createButton('GIF (5s)').parent(section6).class('styled-btn motion').style('margin-left','10px');
  gifBtn.mousePressed(recordGif);
}

function draw() {
  background(paperColor.value());

  if (targetObject != null) {
    targetObject.size = lensScale.value();
    targetObject.rotation = lensRotation.value();
  }
  
  if (isRecording) {
    for (let obj of objects) { obj.rotation += 2; }
  }

  // RENDERING TESTO
  let txt = textContent.value();
  let f = fontSelect.value();
  if (f === 'Modern Sans') { textFont('Inter'); textStyle(BOLD); }
  else if (f === 'Classic Serif') { textFont('Playfair Display'); textStyle(ITALIC); }
  else { textFont('Big Shoulders Stencil Text'); textStyle(BOLD); }

  textSize(fontSizeControl.value());
  textLeading(lineSpacingControl.value()); 
  fill(inkColor.value());
  noStroke();
  textAlign(CENTER, TOP);
  text(txt, 30, 40, width - 60, height - 60);
  
  // LOGICA FUSIONE DINAMICA
  let currentBM = blendModeSelect.value();
  blendMode(eval(currentBM)); // Converte stringa in costante p5
  
  for (let obj of objects) obj.display();
  stroke(255); noFill();
  for (let s of strokes) {
    strokeWeight(s.weight); beginShape();
    for (let p of s.pts) vertex(p.x, p.y);
    endShape();
  }
  if (currentStroke.length > 0) {
    strokeWeight(inkWeight.value()); beginShape();
    for (let p of currentStroke) vertex(p.x, p.y);
    endShape();
  }
  
  blendMode(BLEND);

  // APPLICAZIONE FILTRO GRANA (NOISE)
  applyGrain();
}

function applyGrain() {
  let intensity = noiseSlider.value();
  if (intensity === 0) return;
  
  loadPixels();
  for (let i = 0; i < pixels.length; i += 4) {
    let grain = random(-intensity, intensity);
    pixels[i] += grain;     // R
    pixels[i + 1] += grain; // G
    pixels[i + 2] += grain; // B
  }
  updatePixels();
}

function recordGif() {
  isRecording = true;
  let btn = select('.motion');
  btn.html('...RECORDING...');
  saveGif('Aesthetica_Pro_Motion', 5, {
    delay: 0, units: 'seconds',
    onComplete: () => {
      isRecording = false;
      btn.html('GIF (5s)');
    }
  });
}

// --- FUNZIONI DI SUPPORTO (Classi e Interazioni rimangono coerenti) ---
function generateNewLens() { let l = new InterferenceLens(width / 2, height / 2, lensType.value()); objects.push(l); pickLens(l); }
function mousePressed() { if (mouseX < 0 || mouseX > width || mouseY < 0 || mouseY > height) return; if (manualInk.checked()) { currentStroke = [{ x: mouseX, y: mouseY }]; return; } let hit = false; for (let i = objects.length - 1; i >= 0; i--) { if (objects[i].checkHit(mouseX, mouseY)) { activeObject = objects[i]; offset_X = mouseX - objects[i].x; offset_Y = mouseY - objects[i].y; pickLens(objects[i]); hit = true; break; } } if (!hit) targetObject = null; }
function mouseDragged() { if (manualInk.checked()) { currentStroke.push({ x: mouseX, y: mouseY }); return; } if (activeObject) { activeObject.x = mouseX - offset_X; activeObject.y = mouseY - offset_Y; } }
function mouseReleased() { if (manualInk.checked() && currentStroke.length > 0) { strokes.push({ pts: currentStroke, weight: inkWeight.value() }); currentStroke = []; } activeObject = null; }
function pickLens(l) { targetObject = l; lensScale.value(l.size); lensRotation.value(l.rotation); }
function adjustCanvas() { let v = canvasFormat.value(); if (v.includes('600x400')) resizeCanvas(600, 400); else if (v.includes('500x500')) resizeCanvas(500, 500); else if (v.includes('400x600')) resizeCanvas(400, 600); else if (v.includes('800x400')) resizeCanvas(800, 400); }

class InterferenceLens {
  constructor(x, y, type) { this.x = x; this.y = y; this.type = type; this.size = 100; this.rotation = 0; }
  display() { push(); translate(this.x, this.y); rotate(this.rotation); fill(255); if (this === targetObject) { stroke(255, 120); strokeWeight(2); } else { noStroke(); } if (this.type === 'Circle') circle(0, 0, this.size); else if (this.type === 'Square') { rectMode(CENTER); rect(0, 0, this.size, this.size); } else if (this.type === 'Rectangle') { rectMode(CENTER); rect(0, 0, this.size, this.size * 0.6); } else if (this.type === 'Triangle') { let r = this.size/2; triangle(0, -r, -r, r, r, r); } else if (this.type === 'Star') drawStar(0, 0, this.size * 0.4, this.size, 5); pop(); }
  checkHit(mx, my) { return dist(mx, my, this.x, this.y) < this.size / 1.5; }
}

function drawStar(x, y, r1, r2, n) { let angle = 360 / n; beginShape(); for (let a = 0; a < 360; a += angle) { vertex(x + cos(a - 90) * r2, y + sin(a - 90) * r2); vertex(x + cos(a + (angle/2) - 90) * r1, y + sin(a + (angle/2) - 90) * r1); } endShape(CLOSE); }

function injectFontsAndStyle() {
  let head = document.getElementsByTagName('head')[0];
  let link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@900&family=Playfair+Display:ital,wght@1,900&family=Big+Shoulders+Stencil+Text:wght@900&display=swap';
  head.appendChild(link);
  let style = createElement('style', `
    body { background-color: #030303; color: #555; font-family: 'Verdana', sans-serif; padding: 20px; }
    canvas { border: 1px solid #151515; margin-bottom: 20px; }
    .ui-section { background: #080808; padding: 15px; border-radius: 0; margin-bottom: 10px; border: 1px solid #111; }
    .title { color: #333; letter-spacing: 2px; margin-bottom: 10px; font-size: 9px; text-transform: uppercase; }
    .styled-input { background: #000; color: #fff; border: 1px solid #1a1a1a; padding: 10px; width: 100%; margin-bottom: 10px; font-size: 14px; border-radius: 0; }
    .styled-select, .styled-btn { background: #111; color: #eee; border: 1px solid #222; padding: 8px 12px; cursor: pointer; font-size: 9px; text-transform: uppercase; border-radius: 0; }
    .styled-btn:hover { background: #fff; color: #000; }
    .styled-btn.motion { border: 1px solid #333; color: #888; }
    .styled-btn.ghost { background: transparent; color: #333; border: 1px solid #111; margin-left: 10px; }
    .slider-group { margin: 10px 0; font-size: 9px; }
    .row { margin-bottom: 10px; display: flex; align-items: center; }
    input[type=range] { flex-grow: 1; margin: 0 10px; accent-color: #fff; }
  `);
}
