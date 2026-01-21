let img = null;
let sidebar, canvas;
let needsRedraw = true;
let isExporting = false;
let exportY = 0;
let exportBuffer = null;

const UI_FONT_SIZE = '12px';

// GLOBAL UI REFERENCES
let l1Group, l2Group, l2Container, infoBox;
let eyeBtn1, lockBtn1, eyeBtn2, lockBtn2, infoBtn;
let densitySlider, sizeSlider, inkColorPicker, bgColorPicker, contrastSlider, invertToggle, staggerToggle, jitterSlider, rotationSlider;
let layer2Toggle, densitySlider2, sizeSlider2, rotationSlider2, inkColorPicker2, invertToggle2, staggerToggle2;

// STATES
let selectedShape = 'Circles';
let isVisible1 = true, isLocked1 = false;
let selectedShape2 = 'Lines';
let isVisible2 = true, isLocked2 = false;
let selectedBlendMode = 'MULTIPLY';
let isInfoOpen = false;

const sidebarWidth = 300; 
const shapeNames = ['Circles', 'Squares', 'Lines', 'Triangles', 'Plus', 'Hexagon'];
const blendModes = ['MULTIPLY', 'SCREEN', 'OVERLAY', 'ADD', 'DIFFERENCE'];

// SVG Icons
const ICON_EYE = (on) => on 
  ? `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="white" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>` 
  : `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#555" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;
const ICON_LOCK = (locked) => `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="${locked ? '#555' : 'white'}" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>`;
const ICON_TRASH = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="white" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`;

function setup() {
  removeElements(); 

  // CSS for clean UI components
  let cssStyleNode = createElement('style', `
    input[type="color"] { -webkit-appearance: none; border: none; background: none; padding: 0; }
    input[type="color"]::-webkit-color-swatch-wrapper { padding: 0; border: none; }
    input[type="color"]::-webkit-color-swatch { border: none; padding: 0; }
    input[type="color"]::-moz-color-swatch { border: none; padding: 0; }
    
    input[type="file"] { 
      font-family: Helvetica, Arial, sans-serif;
      font-size: 12px;
      color: #888;
      background: none;
      border: none;
      padding: 0;
      margin-bottom: 30px;
    }
    input[type="file"]::-webkit-file-upload-button {
      background: #444;
      color: white;
      border: none;
      padding: 6px 12px;
      font-family: Helvetica;
      font-size: 12px;
      margin-right: 10px;
      cursor: pointer;
    }
    .info-item { margin-bottom: 10px; line-height: 1.4; }
    .info-title { font-weight: bold; color: #fff; display: block; }
  `);

  canvas = createCanvas(windowWidth - (sidebarWidth + 40), windowHeight - 40);
  canvas.position(sidebarWidth + 20, 20);
  
  sidebar = createDiv('').style('width', sidebarWidth + 'px').style('height', '100%').style('position', 'fixed').style('top', '0').style('left', '0').style('background', '#1a1a1a').style('color', '#fff').style('padding', '25px 20px').style('box-sizing', 'border-box').style('font-family', 'Helvetica, Arial, sans-serif').style('overflow-y', 'auto').style('overflow-x', 'hidden').style('z-index', '100');

  // UPDATED MAIN TITLE
  createP('RASTER STUDIO').parent(sidebar).style('font-size', UI_FONT_SIZE).style('font-weight', 'bold').style('letter-spacing', '1px').style('color', '#fff').style('margin-bottom', '25px');

  const createHeading = (txt, parent = sidebar) => {
    let container = createDiv('').parent(parent).style('display', 'flex').style('justify-content', 'space-between').style('align-items', 'center').style('margin-bottom', '12px');
    createP(txt).parent(container).style('font-size', UI_FONT_SIZE).style('color', '#888').style('letter-spacing', '1px').style('margin', '0').style('font-weight', 'bold');
    return container;
  };

  const createSliderLabel = (txt, parent = sidebar) => {
    return createP(txt).parent(parent).style('font-size', UI_FONT_SIZE).style('margin-top', '10px').style('color', '#fff');
  };

  // 1. SOURCE IMAGE
  createHeading('SOURCE IMAGE');
  createFileInput(handleFile).parent(sidebar);

  // 2. LAYER 1
  let l1Toolbar = createHeading('LAYER 1');
  let l1Icons = createDiv('').parent(l1Toolbar).style('display', 'flex');
  eyeBtn1 = createButton(ICON_EYE(isVisible1)).parent(l1Icons).style('background', 'none').style('border', 'none').style('cursor', 'pointer').mousePressed(toggleVisibility1);
  lockBtn1 = createButton(ICON_LOCK(isLocked1)).parent(l1Icons).style('background', 'none').style('border', 'none').style('cursor', 'pointer').mousePressed(toggleLock1);
  createButton(ICON_TRASH).parent(l1Icons).style('background', 'none').style('border', 'none').style('cursor', 'pointer').mousePressed(resetLayer1);

  l1Group = createDiv('').parent(sidebar);
  let colorFlex = createDiv('').parent(l1Group).style('display', 'flex').style('gap', '10px').style('margin-bottom', '20px');
  let inkWrap = createDiv('').parent(colorFlex).style('flex', '1');
  createP('Ink').parent(inkWrap).style('font-size', UI_FONT_SIZE).style('margin-bottom', '5px');
  inkColorPicker = createColorPicker('#ffffff').parent(inkWrap).style('width', '100%').style('height', '50px').input(triggerRedraw);
  let bgWrap = createDiv('').parent(colorFlex).style('flex', '1');
  createP('BG').parent(bgWrap).style('font-size', UI_FONT_SIZE).style('margin-bottom', '5px');
  bgColorPicker = createColorPicker('#111111').parent(bgWrap).style('width', '100%').style('height', '50px').input(triggerRedraw);

  shapesToUI(createDiv('').parent(l1Group).style('display', 'flex').style('gap', '5px'), 1);
  densitySlider = (createSliderLabel('Density', l1Group), createSlider(2, 80, 12, 1).parent(l1Group).style('width', '100%').input(triggerRedraw));
  sizeSlider = (createSliderLabel('Shape Size', l1Group), createSlider(0.1, 5, 1.2, 0.1).parent(l1Group).style('width', '100%').input(triggerRedraw));
  rotationSlider = (createSliderLabel('Rotation', l1Group), createSlider(0, 360, 0, 1).parent(l1Group).style('width', '100%').input(triggerRedraw));
  invertToggle = createCheckbox(' Invert', false).parent(l1Group).style('font-size', UI_FONT_SIZE).style('margin-top', '10px').changed(triggerRedraw);
  staggerToggle = createCheckbox(' Stagger', false).parent(l1Group).style('font-size', UI_FONT_SIZE).changed(triggerRedraw);

  createDiv('').parent(sidebar).style('height', '30px');

  // 3. LAYER 2
  createHeading('LAYER 2');
  layer2Toggle = createCheckbox(' Enable Layer 2', false).parent(sidebar).style('font-size', UI_FONT_SIZE).style('margin-bottom', '10px').changed(updateL2Visibility);

  l2Container = createDiv('').parent(sidebar).style('background', '#333').style('padding', '15px').style('margin-bottom', '20px').style('border-radius', '4px').hide();
  let l2Toolbar = createHeading('LAYER 2 SETTINGS', l2Container);
  let l2Icons = createDiv('').parent(l2Toolbar).style('display', 'flex');
  eyeBtn2 = createButton(ICON_EYE(isVisible2)).parent(l2Icons).style('background', 'none').style('border', 'none').style('cursor', 'pointer').mousePressed(toggleVisibility2);
  lockBtn2 = createButton(ICON_LOCK(isLocked2)).parent(l2Icons).style('background', 'none').style('border', 'none').style('cursor', 'pointer').mousePressed(toggleLock2);
  createButton(ICON_TRASH).parent(l2Icons).style('background', 'none').style('border', 'none').style('cursor', 'pointer').mousePressed(deleteLayer2);

  l2Group = createDiv('').parent(l2Container);
  let blendHeader = createDiv('').parent(l2Group).style('display', 'flex').style('justify-content', 'space-between').style('align-items', 'center').style('margin-bottom', '8px');
  createP('<b>Blend Mode</b>').parent(blendHeader).style('font-size', UI_FONT_SIZE).style('margin', '0');
  infoBtn = createButton('INFO').parent(blendHeader).style('background', 'none').style('color', '#fff').style('cursor', 'pointer').style('border', '1px solid #666').style('padding', '2px 6px').style('font-size', '9px').style('letter-spacing', '1px').mousePressed(toggleInfo);

  infoBox = createDiv(`
    <div class="info-item"><span class="info-title">MULTIPLY</span>Darks get darker. Best for dark ink on light BG.</div>
    <div class="info-item"><span class="info-title">SCREEN</span>Brightens overlaps. Best for light ink on dark BG.</div>
    <div class="info-item"><span class="info-title">OVERLAY</span>Boosts contrast. Mixes based on base layer brightness.</div>
    <div class="info-item"><span class="info-title">ADD</span>Linear addition. Intense glowing/neon effects.</div>
    <div class="info-item"><span class="info-title">DIFFERENCE</span>Negative space. Inverts colors on layer overlap.</div>
  `).parent(l2Group).style('background', '#222').style('padding', '15px').style('border-radius', '4px').style('font-size', '10px').style('color', '#888').style('display', 'none').style('margin-bottom', '15px');

  let blendRow = createDiv('').parent(l2Group).style('display', 'grid').style('grid-template-columns', '1fr 1fr').style('gap', '4px').style('margin-bottom', '15px');
  blendModes.forEach(m => {
    let btn = createButton(m).parent(blendRow).addClass('blend-btn').style('font-size', '9px').style('background', '#444').style('color', '#fff').style('border', '1px solid transparent').style('padding', '6px 2px').style('cursor', 'pointer').mousePressed(() => setBlendMode(m));
  });

  createP('Ink').parent(l2Group).style('font-size', UI_FONT_SIZE).style('margin-top', '10px').style('margin-bottom', '5px');
  inkColorPicker2 = createColorPicker('#ff0000').parent(l2Group).style('width', '100%').style('height', '50px').input(triggerRedraw);
  shapesToUI(createDiv('').parent(l2Group).style('display', 'flex').style('gap', '4px').style('margin', '10px 0'), 2);

  densitySlider2 = (createSliderLabel('Density', l2Group), createSlider(2, 80, 24, 1).parent(l2Group).style('width', '100%').input(triggerRedraw));
  sizeSlider2 = (createSliderLabel('Shape Size', l2Group), createSlider(0.1, 5, 1.0, 0.1).parent(l2Group).style('width', '100%').input(triggerRedraw));
  rotationSlider2 = (createSliderLabel('Rotation', l2Group), createSlider(0, 360, 45, 1).parent(l2Group).style('width', '100%').input(triggerRedraw));
  invertToggle2 = createCheckbox(' Invert', false).parent(l2Group).style('font-size', UI_FONT_SIZE).style('margin-top', '10px').changed(triggerRedraw);
  staggerToggle2 = createCheckbox(' Stagger', false).parent(l2Group).style('font-size', UI_FONT_SIZE).changed(triggerRedraw);

  // 4. GLOBAL & EXPORT
  createHeading('GLOBAL ADJUSTMENTS');
  contrastSlider = (createSliderLabel('Contrast'), createSlider(-100, 100, 0, 1).parent(sidebar).style('width', '100%').input(triggerRedraw));
  jitterSlider = (createSliderLabel('Grain Jitter'), createSlider(0, 15, 0, 0.5).parent(sidebar).style('width', '100%').input(triggerRedraw));
  
  createHeading('EXPORT').style('margin-top', '30px');
  createButton('SAVE PNG').parent(sidebar).style('width', '100%').style('background', '#fff').style('color', '#000').style('border', 'none').style('padding', '12px').style('font-weight', 'bold').style('font-size', UI_FONT_SIZE).style('cursor', 'pointer').mousePressed(() => saveCanvas(canvas, 'raster_export', 'png'));
  createButton('HIGH-RES EXPORT').parent(sidebar).style('width', '100%').style('background', '#000').style('color', '#fff').style('border', '1px solid #444').style('padding', '12px').style('margin-top', '10px').style('font-weight', 'bold').style('font-size', UI_FONT_SIZE).style('cursor', 'pointer').mousePressed(startHighResExport);

  setBlendMode('MULTIPLY'); setShape('Circles', 1); setShape('Lines', 2);
  rectMode(CENTER); angleMode(DEGREES); noStroke();
}

// LOGIC
function toggleInfo() { isInfoOpen = !isInfoOpen; infoBox.style('display', isInfoOpen ? 'block' : 'none'); infoBtn.style('border-color', isInfoOpen ? '#fff' : '#666'); }
function toggleVisibility1() { isVisible1 = !isVisible1; eyeBtn1.html(ICON_EYE(isVisible1)); triggerRedraw(); }
function toggleVisibility2() { isVisible2 = !isVisible2; eyeBtn2.html(ICON_EYE(isVisible2)); triggerRedraw(); }
function toggleLock1() { isLocked1 = !isLocked1; lockBtn1.html(ICON_LOCK(isLocked1)); l1Group.style('opacity', isLocked1 ? '0.3' : '1'); l1Group.style('pointer-events', isLocked1 ? 'none' : 'auto'); }
function toggleLock2() { isLocked2 = !isLocked2; lockBtn2.html(ICON_LOCK(isLocked2)); l2Group.style('opacity', isLocked2 ? '0.3' : '1'); l2Group.style('pointer-events', isLocked2 ? 'none' : 'auto'); }
function resetLayer1() { if(isLocked1) return; setShape('Circles', 1); densitySlider.value(12); sizeSlider.value(1.2); rotationSlider.value(0); inkColorPicker.value('#ffffff'); bgColorPicker.value('#111111'); triggerRedraw(); }
function deleteLayer2() { if(isLocked2) return; layer2Toggle.checked(false); l2Container.hide(); triggerRedraw(); }
function updateL2Visibility() { if (layer2Toggle.checked()) l2Container.show(); else l2Container.hide(); triggerRedraw(); }
function triggerRedraw() { needsRedraw = true; }

function shapesToUI(parent, layer) {
  const shapes = [{name:'Circles', icon:'<circle cx="50" cy="50" r="40" fill="currentColor"/>'}, {name:'Squares', icon:'<rect x="15" y="15" width="70" height="70" fill="currentColor"/>'}, {name:'Lines', icon:'<line x1="20" y1="20" x2="80" y2="80" stroke="currentColor" stroke-width="12"/>'}, {name:'Triangles', icon:'<polygon points="50,15 90,85 10,85" fill="currentColor"/>'}, {name:'Plus', icon:'<rect x="40" y="15" width="20" height="70" fill="white"/><rect x="15" y="40" width="70" height="20" fill="currentColor"/>'}, {name:'Hexagon', icon:'<polygon points="50,5 95,25 95,75 50,95 5,75 5,25" fill="currentColor"/>'}];
  shapes.forEach(s => {
    let btn = createButton(`<svg viewBox="0 0 100 100">${s.icon}</svg>`).parent(parent).addClass(`shape-btn-${layer}`).id(`btn-${layer}-${s.name}`).style('width', '32px').style('height', '32px').style('background', '#2a2a2a').style('color', '#fff').style('border', '1px solid transparent').style('padding', '6px').style('cursor', 'pointer').mousePressed(() => setShape(s.name, layer));
  });
}

function setBlendMode(m) { selectedBlendMode = m; selectAll('.blend-btn').forEach(b => b.style('border', '1px solid transparent')); let active = selectAll('.blend-btn').find(b => b.html() === m); if (active) active.style('border', '1px solid #fff'); triggerRedraw(); }
function setShape(name, layer) { if (layer === 1) { selectedShape = name; selectAll('.shape-btn-1').forEach(b => b.style('border', '1px solid transparent')); select(`#btn-1-${name}`).style('border', '1px solid #fff'); } else { selectedShape2 = name; selectAll('.shape-btn-2').forEach(b => b.style('border', '1px solid transparent')); select(`#btn-2-${name}`).style('border', '1px solid #fff'); } triggerRedraw(); }

function draw() { if (isExporting) { continueHighResExport(); return; } if (needsRedraw) { if (!img) { background(30); fill(255); textAlign(CENTER, CENTER); textFont('Helvetica'); textSize(18); text('upload image to start', width / 2, height / 2); } else { renderRaster(this); } needsRedraw = false; } }

function renderRaster(target) {
  target.background(bgColorPicker.color()); img.loadPixels();
  if (isVisible1) drawLayer(target, 1);
  if (layer2Toggle.checked() && isVisible2) { target.blendMode(target[selectedBlendMode]); drawLayer(target, 2); target.blendMode(BLEND); }
}

function drawLayer(target, layer) {
  let d = (layer === 1) ? densitySlider.value() : densitySlider2.value();
  let m = (layer === 1) ? sizeSlider.value() : sizeSlider2.value();
  let r = (layer === 1) ? rotationSlider.value() : rotationSlider2.value();
  let ink = (layer === 1) ? inkColorPicker.color() : inkColorPicker2.color();
  let inv = (layer === 1) ? invertToggle.checked() : invertToggle2.checked();
  let stg = (layer === 1) ? staggerToggle.checked() : staggerToggle2.checked();
  let c = contrastSlider.value(), j = jitterSlider.value();
  let shape = (layer === 1) ? selectedShape : selectedShape2;
  if (target !== this) { d *= 4; j *= 4; }
  target.fill(ink); target.noStroke();
  let rowCount = 0;
  for (let y = 0; y < target.height + d; y += d) {
    rowCount++;
    let xOff = (stg && rowCount % 2 === 0) ? d / 2 : 0;
    for (let x = -d; x < target.width + d; x += d) {
      let drawX = x + xOff, imgX = floor(map(drawX, 0, target.width, 0, img.width)), imgY = floor(map(y, 0, target.height, 0, img.height));
      if (imgX >= 0 && imgX < img.width && imgY >= 0 && imgY < img.height) {
        let i = (imgX + imgY * img.width) * 4, b = (img.pixels[i] + img.pixels[i+1] + img.pixels[i+2]) / 3, f = (259 * (c + 255)) / (255 * (259 - c)), adjB = constrain(f * (b - 128) + 128, 0, 255);
        let sz = inv ? map(adjB, 0, 255, 0, d * m) : map(adjB, 0, 255, d * m, 0);
        if (sz > 0.2) drawShapeAt(target, drawX + random(-j, j), y + random(-j, j), sz, d, r, shape, ink);
      }
    }
  }
}

function drawShapeAt(t, x, y, sz, d, r, shape, ink) {
  t.push(); t.translate(x, y); t.rotate(r);
  if (shape === 'Circles') t.ellipse(0, 0, sz, sz);
  else if (shape === 'Squares') t.rect(0, 0, sz, sz);
  else if (shape === 'Lines') { t.stroke(ink); t.strokeWeight(sz * 0.5); t.line(-d/2, 0, d/2, 0); }
  else if (shape === 'Triangles') t.triangle(0, -sz/2, -sz/2, sz/2, sz/2, sz/2);
  else if (shape === 'Plus') { t.rect(0, 0, sz, sz/4); t.rect(0, 0, sz/4, sz); }
  else if (shape === 'Hexagon') { t.beginShape(); for (let a = 0; a < 360; a += 60) t.vertex(cos(a) * (sz/2), sin(a) * (sz/2)); t.endShape(CLOSE); }
  t.pop();
}

function startHighResExport() { if (!img) return; isExporting = true; exportY = 0; exportBuffer = createGraphics(width * 4, height * 4); exportBuffer.angleMode(DEGREES); }
function continueHighResExport() { renderRaster(exportBuffer); save(exportBuffer, 'raster_export', 'png'); isExporting = false; }
function handleFile(file) { if (file.type === 'image') img = loadImage(file.data, (l) => { resizeCanvas(min(windowWidth-340, l.width), min(windowHeight-40, l.height)); triggerRedraw(); }); }