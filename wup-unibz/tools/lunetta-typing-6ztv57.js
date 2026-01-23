// WUP 25-26 - Chiara Luna Pane
// VERSIONE FULLSCREEN RESPONSIVE

let input, shapeSelect, trackingSlider, wSlider, hSlider, colorPicker, fontSelect, orientSelect, saveBtn, clearBtn, fontUpload;
let lineToggle;
let customFont;
let drawings = []; 

const THEME = {
  bg: '#F9F7F2',      
  uiText: '#5E5A52',  
  accent: '#D4C5B9',  
  canvasBg: '#FFFFFF' 
};

function setup() {
  // Crea il canvas che occupa l'intera finestra
  createCanvas(windowWidth, windowHeight);
  
  // Inizializzazione controlli
  input = createInput('GEOMETRIA');
  styleElement(input, 140);

  shapeSelect = createSelect();
  ['Rectangle', 'Ellipse', 'Triangle', 'Hexagon', 'Octagon', 'Drawing'].forEach(s => shapeSelect.option(s));
  styleElement(shapeSelect, 110);

  orientSelect = createSelect();
  orientSelect.option('Vertical (Radial)');
  orientSelect.option('Horizontal (Tangent)');
  styleElement(orientSelect, 130);

  colorPicker = createColorPicker('#3C3A36');
  colorPicker.style('width', '110px');

  fontSelect = createSelect();
  ['Helvetica', 'Courier New', 'Georgia', 'Times New Roman', 'Verdana', 'Trebuchet MS', 'Arial'].forEach(f => fontSelect.option(f));
  styleElement(fontSelect, 110);

  lineToggle = createCheckbox(' SHOW LINE', true);
  lineToggle.style('color', THEME.uiText);
  lineToggle.style('font-size', '10px');
  lineToggle.style('font-family', 'Helvetica');

  fontUpload = createFileInput(handleFile);
  fontUpload.style('font-size', '10px');

  trackingSlider = createSlider(0, 100, 20, 0.5);
  wSlider = createSlider(50, 800, 400);
  hSlider = createSlider(20, 600, 200);

  saveBtn = createButton('SAVE DESIGN');
  saveBtn.mousePressed(saveCurrentDesign);
  styleButton(saveBtn);

  clearBtn = createButton('CLEAR DRAW');
  clearBtn.mousePressed(() => drawings = []);
  styleButton(clearBtn);
  clearBtn.style('background-color', '#A89F91');

  // Posiziona gli elementi per la prima volta
  repositionUI();
  textAlign(CENTER, CENTER);
}

// Funzione fondamentale per il "Fullscreen Share"
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  repositionUI();
}

function repositionUI() {
  let controlX = 40;
  let startY = height - 280; // Posiziona i controlli in fondo alla pagina

  input.position(controlX, startY + 20);
  shapeSelect.position(controlX + 160, startY + 20);
  orientSelect.position(controlX + 290, startY + 20);
  colorPicker.position(controlX + 440, startY + 20);
  fontSelect.position(controlX + 570, startY + 20);
  
  lineToggle.position(controlX + 440, startY + 50);
  fontUpload.position(controlX + 570, startY + 45);
  
  trackingSlider.position(controlX, startY + 100);
  wSlider.position(controlX + 160, startY + 100);
  hSlider.position(controlX + 320, startY + 100);
  
  saveBtn.position(controlX + 500, startY + 90);
  clearBtn.position(controlX + 630, startY + 90);
  
  // Adattamento per schermi piccoli (mobile)
  if (width < 700) {
    let mobileY = height - 450;
    input.position(20, mobileY);
    shapeSelect.position(20, mobileY + 40);
    // ... si potrebbero aggiungere altre regole per mobile qui
  }
}

function draw() {
  background(THEME.bg); 
  
  // Definiamo l'area di disegno bianca (dinamica)
  let margin = 20;
  let uiAreaHeight = 300; 
  let canvasAreaW = width - (margin * 2);
  let canvasAreaH = height - uiAreaHeight - (margin * 2);
  
  // Rettangolo Bianco (Canvas di lavoro)
  fill(255);
  noStroke();
  rect(margin, margin, canvasAreaW, canvasAreaH, 15); 
  
  // Logic per il disegno a mano libera
  if (mouseIsPressed && mouseY < canvasAreaH + margin && mouseY > margin && mouseX > margin && mouseX < width - margin) {
    if (drawings.length === 0 || dist(mouseX, mouseY, drawings[drawings.length-1].x, drawings[drawings.length-1].y) > 3) {
        drawings.push({x: mouseX, y: mouseY});
    }
  }
  
  if (lineToggle.checked() && drawings.length > 1) {
    noFill();
    stroke(THEME.accent);
    strokeWeight(1);
    beginShape();
    for (let p of drawings) vertex(p.x, p.y);
    endShape();
  }

  // Rendering del testo
  let txt = input.value();
  let boxW = wSlider.value();
  let boxH = hSlider.value();
  let spacing = trackingSlider.value();
  let shape = shapeSelect.value();
  let orientation = orientSelect.value();
  
  if (customFont) textFont(customFont);
  else textFont(fontSelect.value());
  
  // Disegna il testo al centro dell'area bianca
  drawGeometricText(txt, width/2, (canvasAreaH + margin*2)/2, boxW, boxH, spacing, shape, orientation);
  
  drawUIDecorations(height - 280);
}

function drawGeometricText(t, x, y, w, h, spacing, type, orient) {
  textSize(20 + (w * 0.03)); 
  let chars = t.split('');
  let color = colorPicker.color();
  
  if (type === 'Drawing' && drawings.length > 5) {
    let currentDist = 0;
    for (let i = 0; i < chars.length; i++) {
      let pIndex = floor(map(currentDist, 0, drawings.length * 5, 0, drawings.length - 1));
      pIndex = constrain(pIndex, 0, drawings.length - 2);
      let pos = drawings[pIndex];
      let nextPos = drawings[pIndex + 1];
      let angle = atan2(nextPos.y - pos.y, nextPos.x - pos.x);
      push();
      fill(color);
      translate(pos.x, pos.y);
      rotate(orient === 'Vertical (Radial)' ? angle + HALF_PI : angle);
      text(chars[i], 0, 0);
      pop();
      currentDist += textWidth(chars[i]) + spacing;
      if (pIndex >= drawings.length - 2) break;
    }
  } else if (type !== 'Drawing') {
    let perimeter = getPerimeter(w, h, type);
    let currentDist = 0; 
    for (let i = 0; i < chars.length; i++) {
      let p = (currentDist / perimeter) % 1.0;
      let pos = getPointOnShape(x, y, w, h, p, type);
      push();
      fill(color);
      translate(pos.x, pos.y);
      rotate(orient === 'Vertical (Radial)' ? pos.angle + HALF_PI : pos.angle);
      text(chars[i], 0, 0);
      pop();
      currentDist += textWidth(chars[i]) + spacing;
    }
  }
}

// --- LOGICA GEOMETRICA ---
function getPerimeter(w, h, type) {
  if (type === 'Ellipse') return PI * (1.5 * (w + h) - sqrt(w * h));
  if (type === 'Rectangle') return (w + h) * 2;
  let sides = (type === 'Hexagon') ? 6 : (type === 'Octagon' ? 8 : 3);
  return (w * sin(PI / sides)) * sides;
}

function getPointOnShape(x, y, w, h, p, type) {
  let tx, ty, angle;
  if (type === 'Ellipse') {
    let pc = p * TWO_PI - HALF_PI;
    tx = x + (w/2) * cos(pc);
    ty = y + (h/2) * sin(pc);
    angle = pc;
  } else if (type === 'Rectangle') {
    let side = p * 4;
    if (side < 1) { tx = lerp(x-w/2, x+w/2, side); ty = y-h/2; angle = 0; }
    else if (side < 2) { tx = x+w/2; ty = lerp(y-h/2, y+h/2, side-1); angle = HALF_PI; }
    else if (side < 3) { tx = lerp(x+w/2, x-w/2, side-2); ty = y+h/2; angle = PI; }
    else { tx = x-w/2; ty = lerp(y+h/2, y-h/2, side-3); angle = PI+HALF_PI; }
  } else {
    let sides = (type === 'Hexagon') ? 6 : (type === 'Octagon' ? 8 : 3);
    let segment = floor(p * sides);
    let segP = (p * sides) % 1;
    let a1 = (segment * TWO_PI / sides) - HALF_PI;
    let a2 = ((segment + 1) * TWO_PI / sides) - HALF_PI;
    let x1 = x + cos(a1) * w/2; let y1 = y + sin(a1) * h/2;
    let x2 = x + cos(a2) * w/2; let y2 = y + sin(a2) * h/2;
    tx = lerp(x1, x2, segP); ty = lerp(y1, y2, segP);
    angle = atan2(y2 - y1, x2 - x1);
  }
  return { x: tx, y: ty, angle: angle };
}

function drawUIDecorations(startY) {
  push();
  fill(THEME.uiText);
  noStroke();
  textAlign(LEFT);
  textSize(10);
  textStyle(BOLD);
  text('GEOMETRIC TYPOGRAPHY LAB', 40, startY - 5);
  textStyle(NORMAL);
  textSize(9);
  text('INPUT TEXT', 40, startY + 15);
  text('SHAPE', 200, startY + 15);
  text('ORIENTATION', 330, startY + 15);
  text('COLOR', 480, startY + 15);
  text('FONT', 610, startY + 15);
  text('SPACING', 40, startY + 95);
  text('WIDTH', 200, startY + 95);
  text('HEIGHT', 360, startY + 95);
  stroke(THEME.accent);
  line(40, startY + 75, width - 40, startY + 75);
  pop();
}

function handleFile(file) {
  if (file.type === 'font' || file.name.endsWith('.ttf') || file.name.endsWith('.otf')) {
    customFont = loadFont(file.data);
  }
}

function saveCurrentDesign() {
  let margin = 20;
  let uiAreaHeight = 300;
  let img = get(margin, margin, width - (margin * 2), height - uiAreaHeight - (margin * 2));
  img.save('design.png');
}

function styleElement(el, w) {
  el.style('border', '1px solid #D4C5B9');
  el.style('background', '#FFF');
  el.style('padding', '5px');
  el.style('width', w + 'px');
  el.style('font-size', '11px');
  el.style('color', '#5E5A52');
}

function styleButton(btn) {
  btn.style('background-color', '#4A4741');
  btn.style('color', '#F9F7F2');
  btn.style('border', 'none');
  btn.style('padding', '10px 15px');
  btn.style('border-radius', '20px');
  btn.style('cursor', 'pointer');
  btn.style('font-size', '10px');
}