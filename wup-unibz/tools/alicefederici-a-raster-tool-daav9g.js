// WUP 2025-26
// Alice Federici - Optimized for Tool Viewer Compatibility
let img;
let customFont = null; 
let renderBuffer;
let inputImg, inputFont, inputChars, inputRes, inputContrast, inputThreshold, inputLeading, inputJitter, inputRotation;
let selFont, pickerText, pickerBg, checkColor, checkVariableSize, checkInvert, selExportScale;
let myText = "?"; 
const sidebarWidth = 260;
const accentColor = '#E91E63';

function setup() {
  let canvas = createCanvas(windowWidth - sidebarWidth, windowHeight);
  canvas.position(sidebarWidth, 0);
  canvas.style('position', 'fixed');
  canvas.style('z-index', '1');
  pixelDensity(displayDensity());
  
  let sidebar = createDiv('');
  styleSidebarInline(sidebar);

  // Title
  let title = createP('A RASTER TOOL').parent(sidebar);
  title.style('font-family', '"Inter", sans-serif');
  title.style('font-weight', '800');
  title.style('font-size', '14px');
  title.style('letter-spacing', '2px');
  title.style('margin', '0 0 30px 0');
  title.style('color', '#ffffff');
  title.style('border-left', `3px solid ${accentColor}`);
  title.style('padding-left', '10px');

  // --- 1. SORGENTE ---
  createLabel('1. IMMAGINE SORGENTE', sidebar);
  inputImg = createFileInput(handleFile).parent(sidebar);
  inputImg.style('font-size', '9px');
  inputImg.style('color', '#555');
  
  // --- 2. TIPOGRAFIA ---
  createLabel('2. TIPOGRAFIA E TESTO', sidebar);
  createInnerLabel('Testo da usare:', sidebar);
  inputChars = createInput(myText).parent(sidebar);
  styleInputInline(inputChars);
  inputChars.input(() => { myText = inputChars.value(); loop(); });

  createInnerLabel('Carattere standard:', sidebar);
  selFont = createSelect().parent(sidebar);
  styleSelectInline(selFont);
  ['Monospace', 'Helvetica', 'Impact', 'Georgia'].forEach(f => selFont.option(f));

  createInnerLabel('Carica font (.ttf/.otf):', sidebar);
  inputFont = createFileInput(handleFont).parent(sidebar);
  inputFont.style('font-size', '9px');

  let btnResetFont = createButton('Rimuovi Font Caricato').parent(sidebar);
  styleResetBtnInline(btnResetFont);
  btnResetFont.mousePressed(() => { customFont = null; loop(); });

  // --- 3. GRIGLIA ---
  createLabel('3. DIMENSIONE E DENSITÀ', sidebar);
  inputRes = createSlider(5, 100, 18, 1).parent(sidebar); 
  inputLeading = createSlider(0.5, 2.5, 1.0, 0.1).parent(sidebar);

  // --- 4. TRASFORMAZIONE ---
  createLabel('4. ROTAZIONE E DISORDINE', sidebar);
  inputRotation = createSlider(0, TWO_PI, 0, 0.01).parent(sidebar);
  inputJitter = createSlider(0, 50, 0, 1).parent(sidebar);

  // --- 5. COLORI ---
  createLabel('5. COLORI E MODALITÀ', sidebar);
  let rowColor = createDiv('').parent(sidebar);
  rowColor.style('display', 'flex');
  rowColor.style('gap', '10px');
  rowColor.style('margin-bottom', '15px');
  
  pickerText = createColorPicker(accentColor).parent(rowColor);
  pickerBg = createColorPicker('#FFFFFF').parent(rowColor);
  
  checkColor = createCheckbox(' Usa colori foto', false).parent(sidebar);
  styleCheckInline(checkColor);
  checkVariableSize = createCheckbox(' Grandezza dinamica', true).parent(sidebar);
  styleCheckInline(checkVariableSize);
  checkInvert = createCheckbox(' Inverti zone disegno', false).parent(sidebar);
  styleCheckInline(checkInvert);

  // --- 6. FILTRI ---
  createLabel('6. CONTRASTO E SOGLIA LUCE', sidebar);
  inputContrast = createSlider(1, 5, 1.5, 0.1).parent(sidebar);
  inputThreshold = createSlider(0, 255, 127, 5).parent(sidebar);

  // --- 7. EXPORT ---
  createLabel('7. QUALITÀ DOWNLOAD', sidebar);
  selExportScale = createSelect().parent(sidebar);
  styleSelectInline(selExportScale);
  selExportScale.option('Standard (Anteprima)', 1);
  selExportScale.option('Alta Definizione (2x)', 2);
  selExportScale.option('Qualità Stampa (4x)', 4);
  selExportScale.selected(2); 

  let btnSave = createButton('SCARICA OPERA').parent(sidebar);
  styleSaveBtnInline(btnSave);
  btnSave.mousePressed(exportHighRes);

  // Input Listeners
  let controls = [selFont, inputRes, inputLeading, inputRotation, inputJitter, pickerText, pickerBg, checkColor, checkVariableSize, checkInvert, inputContrast, inputThreshold];
  controls.forEach(c => c.input(loop));

  noLoop();
}

// --- RENDER LOGIC ---

function draw() {
  background(30); 
  if (!img) {
    fill(180); textAlign(CENTER, CENTER);
    noStroke(); textSize(14);
    text("CARICA UN'IMMAGINE DALLA SIDEBAR", width/2, height/2);
    return;
  }

  if (!renderBuffer || renderBuffer.width !== img.width) {
    renderBuffer = createGraphics(img.width, img.height);
  }

  renderArt(renderBuffer, 1); 
  addFooter(renderBuffer, 1); 

  let previewScale = min((width - 80) / img.width, (height - 80) / img.height);
  push();
  translate(width/2, height/2);
  imageMode(CENTER);
  fill(0, 80);
  rect(8, 8, img.width * previewScale, img.height * previewScale);
  image(renderBuffer, 0, 0, img.width * previewScale, img.height * previewScale);
  pop();
  noLoop(); 
}

function renderArt(pg, scaleFactor) {
  pg.background(pickerBg.color());
  pg.smooth();
  let tempImg = img.get();
  tempImg.loadPixels();
  
  let res = inputRes.value() * scaleFactor;
  let lead = inputLeading.value();
  let jitter = inputJitter.value() * scaleFactor;
  let rot = inputRotation.value();
  let thresh = inputThreshold.value();
  let contrast = inputContrast.value();
  let charIndex = 0;

  if (customFont) pg.textFont(customFont);
  else pg.textFont(selFont.value());
  
  pg.textAlign(CENTER, CENTER);

  for (let y = 0; y < tempImg.height; y += inputRes.value() * lead) {
    for (let x = 0; x < tempImg.width; x += inputRes.value()) {
      let scaledX = x * scaleFactor;
      let scaledY = y * scaleFactor;
      let i = (floor(x) + floor(y) * tempImg.width) * 4;
      
      let r = tempImg.pixels[i];
      let g = tempImg.pixels[i+1];
      let b = tempImg.pixels[i+2];
      
      r = constrain((r - 128) * contrast + 128, 0, 255);
      g = constrain((g - 128) * contrast + 128, 0, 255);
      b = constrain((b - 128) * contrast + 128, 0, 255);
      let bright = (r + g + b) / 3;
      
      let shouldDraw = checkInvert.checked() ? (bright > thresh) : (bright < thresh);
      
      if (shouldDraw) {
        pg.push();
        pg.translate(scaledX + random(-jitter, jitter), scaledY + random(-jitter, jitter));
        pg.rotate(rot);
        let dSize = res;
        if (checkVariableSize.checked()) {
          dSize = checkInvert.checked() ? map(bright, thresh, 255, 0, res * 2) : map(bright, 0, thresh, res * 2, 0);
        }
        pg.textSize(max(dSize, 0.1));
        pg.fill(checkColor.checked() ? color(r, g, b) : pickerText.color());
        pg.text(myText.charAt(charIndex % myText.length), 0, 0);
        pg.pop();
        charIndex++;
      }
    }
  }
}

// --- HELPERS ---

function handleFont(file) {
  if (file.name.toLowerCase().endsWith('.ttf') || file.name.toLowerCase().endsWith('.otf')) {
    customFont = loadFont(file.data, () => loop());
  }
}

function handleFile(file) { if (file.type === 'image') { img = loadImage(file.data, () => loop()); } }

function addFooter(buffer, scaleFactor) {
  buffer.push();
  let m = buffer.width * 0.03;
  let cFooter = color(pickerText.color());
  buffer.stroke(cFooter);
  buffer.strokeWeight(buffer.width * 0.001);
  buffer.line(m, buffer.height - (buffer.height * 0.05), m + (buffer.width * 0.05), buffer.height - (buffer.height * 0.05));
  buffer.noStroke();
  cFooter.setAlpha(150);
  buffer.fill(cFooter);
  buffer.textFont('Helvetica');
  buffer.textSize(buffer.height * 0.012); 
  buffer.textAlign(LEFT, BOTTOM);
  buffer.text("Vibe Code Exercise", m, buffer.height - (buffer.height * 0.032));
  cFooter.setAlpha(255);
  buffer.fill(cFooter);
  buffer.textStyle(BOLD);
  buffer.textSize(buffer.height * 0.018);
  buffer.text("Alice Federici", m, buffer.height - (buffer.height * 0.012));
  buffer.pop();
}

function exportHighRes() {
  if (!img) return;
  let scale = int(selExportScale.value());
  let hiResBuffer = createGraphics(img.width * scale, img.height * scale);
  renderArt(hiResBuffer, scale);
  addFooter(hiResBuffer, scale);
  save(hiResBuffer, `opera_federici_${scale}x.png`);
  hiResBuffer.remove();
}

// --- INLINE STYLING FUNCTIONS ---

function styleSidebarInline(s) {
  s.style('width', sidebarWidth + 'px');
  s.style('height', '100%');
  s.style('position', 'fixed');
  s.style('left', '0');
  s.style('top', '0');
  s.style('background', '#0a0a0a');
  s.style('padding', '30px');
  s.style('border-right', '1px solid #222');
  s.style('overflow-y', 'auto');
  s.style('box-sizing', 'border-box');
  s.style('z-index', '100');
  s.style('color', '#fff');
}

function createLabel(t, p) { 
  let l = createP(t).parent(p);
  l.style('font-size', '10px');
  l.style('font-weight', 'bold');
  l.style('color', '#ffffff');
  l.style('margin', '30px 0 10px 0');
  l.style('text-transform', 'uppercase');
  l.style('letter-spacing', '1.2px');
  l.style('font-family', 'sans-serif');
  l.style('border-bottom', '1px solid #222');
  l.style('padding-bottom', '5px');
}

function createInnerLabel(t, p) {
  let l = createP(t).parent(p);
  l.style('color', '#888');
  l.style('font-size', '9px');
  l.style('margin', '10px 0 5px 0');
  l.style('font-family', 'sans-serif');
  l.style('text-transform', 'uppercase');
}

function styleInputInline(i) {
  i.style('background', 'transparent');
  i.style('border', '1px solid #333');
  i.style('color', accentColor);
  i.style('padding', '10px');
  i.style('border-radius', '4px');
  i.style('width', '100%');
  i.style('box-sizing', 'border-box');
  i.style('font-family', 'monospace');
}

function styleSelectInline(s) {
  s.style('background', '#1a1a1a');
  s.style('border', '1px solid #333');
  s.style('color', '#fff');
  s.style('padding', '8px');
  s.style('width', '100%');
  s.style('border-radius', '4px');
  s.style('cursor', 'pointer');
}

function styleCheckInline(c) {
  c.style('display', 'block');
  c.style('color', '#ffffff');
  c.style('font-size', '11px');
  c.style('margin-bottom', '12px');
  c.style('cursor', 'pointer');
  c.style('font-family', 'sans-serif');
}

function styleResetBtnInline(b) {
  b.style('background', '#333');
  b.style('color', '#eee');
  b.style('border', 'none');
  b.style('padding', '5px 10px');
  b.style('font-size', '9px');
  b.style('border-radius', '3px');
  b.style('cursor', 'pointer');
  b.style('margin-bottom', '10px');
  b.elt.onmouseover = () => b.style('background', '#444');
  b.elt.onmouseout = () => b.style('background', '#333');
}

function styleSaveBtnInline(b) {
  b.style('background', accentColor);
  b.style('color', '#fff');
  b.style('border', 'none');
  b.style('padding', '14px');
  b.style('font-weight', 'bold');
  b.style('width', '100%');
  b.style('margin-top', '30px');
  b.style('cursor', 'pointer');
  b.style('border-radius', '4px');
  b.style('font-family', 'sans-serif');
  b.elt.onmouseover = () => b.style('background', '#fff');
  b.elt.onmouseout = () => b.style('background', accentColor);
}

function windowResized() { 
  resizeCanvas(windowWidth - sidebarWidth, windowHeight); 
  loop(); 
}