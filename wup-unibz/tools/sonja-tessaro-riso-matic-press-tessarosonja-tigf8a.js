/*
  PROJECT: RISO-MATIC PRESS (v14 - TOOL COMPATIBLE)
  WUP 2025/26 - Refactored for Inline Styles
  TESSARO SONJA
*/

// --- GLOBAL STATE ---
let sourceImg;
let layers = { c: null, m: null, y: null, k: null };
let layerOrder = ['c', 'm', 'y', 'k']; 

let grainTexture;
let processed = false;
let mainCanvas;
let isDarkMode = false;
let tooltipDiv;

// UI References for Theme Toggling
let uiRefs = {
  body: null,
  sidebar: null,
  panels: [],
  texts: [],
  cards: [],
  inputs: []
};

// Layout dimensions
const SIDEBAR_WIDTH = 340; 
const CANVAS_MAX_WIDTH = 800;
const CANVAS_MAX_HEIGHT = 800;

let sidebar, canvasContainer;
let halftoneToggle, textureToggle, dotSizeSlider, formatSel, shapeSel, themeBtn;

let controls = {
  c: { x: null, y: null, r: null, s: null, a: null, blend: true, gray: false, visible: true },
  m: { x: null, y: null, r: null, s: null, a: null, blend: true, gray: false, visible: true },
  y: { x: null, y: null, r: null, s: null, a: null, blend: true, gray: false, visible: true },
  k: { x: null, y: null, r: null, s: null, a: null, blend: true, gray: false, visible: true }
};

let currentShape = 'circle';

// --- STYLING HELPERS ---

const STYLES = {
  light: {
    bgApp: '#f0f2f5', bgSidebar: '#ffffff', bgPanel: '#f7f9fc',
    textMain: '#333333', textMuted: '#888888', border: '#eeeeee',
    cardBg: '#ffffff', inputBg: '#ffffff'
  },
  dark: {
    bgApp: '#121212', bgSidebar: '#1e1e1e', bgPanel: '#2a2a2a',
    textMain: '#e0e0e0', textMuted: '#aaaaaa', border: '#444444',
    cardBg: '#252525', inputBg: '#333333'
  }
};

function setup() {
  createLayoutStructure();
  
  // Tooltip setup
  tooltipDiv = createDiv('');
  setStyle(tooltipDiv, {
    position: 'fixed', background: 'rgba(30,30,30,0.95)', color: '#fff',
    padding: '6px 10px', borderRadius: '4px', fontSize: '11px',
    pointerEvents: 'none', display: 'none', zIndex: '9999',
    whiteSpace: 'nowrap', boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
  });
  document.addEventListener('mousemove', moveTooltip);

  mainCanvas = createCanvas(CANVAS_MAX_WIDTH, CANVAS_MAX_HEIGHT);
  mainCanvas.parent(canvasContainer);
  
  // Canvas Styles
  setStyle(mainCanvas, {
    borderRadius: '4px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
  });

  pixelDensity(1); 
  grainTexture = createGraphics(width, height);
  
  drawEmptyState();
  buildUI();
  applyTheme(); // Apply initial colors
}

function draw() {
  if (!processed) return;
  compositeFinalImage(this);
}

// --- HELPER: APPLY INLINE STYLES ---
function setStyle(p5Element, styleObj) {
  for (let prop in styleObj) {
    p5Element.style(prop, styleObj[prop]);
  }
}

// --- HELPER: HOVER EFFECTS (JS instead of CSS :hover) ---
function addHover(elt, baseStyles, hoverStyles) {
  elt.elt.addEventListener('mouseenter', () => {
    for (let prop in hoverStyles) elt.style(prop, hoverStyles[prop]);
  });
  elt.elt.addEventListener('mouseleave', () => {
    for (let prop in baseStyles) elt.style(prop, baseStyles[prop]);
  });
}

// --- SCREEN RENDERING (RASTER PREVIEW) ---

function compositeFinalImage(target) {
  let useTexture = textureToggle.checked();

  // 1. Background
  if (useTexture) {
    drawPaperTexture(target);
  } else {
    target.background(255);
  }

  target.push();
  target.translate(target.width / 2, target.height / 2);

  // 2. Draw Inks
  layerOrder.forEach(key => {
    drawInkLayer(target, layers[key], controls[key]);
  });
  
  target.pop();

  // 3. Grain Overlay
  if (useTexture) {
    if(grainTexture.width !== target.width || grainTexture.height !== target.height){
        generateGrainTexture(target.width, target.height);
    }
    target.push();
    target.blendMode(SOFT_LIGHT); 
    target.imageMode(CORNER);
    target.tint(255, 180); 
    target.image(grainTexture, 0, 0);
    target.pop();
    target.blendMode(BLEND);
  }
}

function drawInkLayer(target, imgLayer, ctrl) {
  if (!imgLayer || !ctrl.visible) return;
  
  target.push();
  if (ctrl.blend) target.blendMode(MULTIPLY);
  else target.blendMode(BLEND);
  
  let scaleFactor = target.width / width; 
  let tx = ctrl.x.value() * scaleFactor;
  let ty = ctrl.y.value() * scaleFactor;
  let rot = ctrl.r.value();
  let scl = ctrl.s.value(); 
  let alpha = ctrl.a.value();

  target.translate(tx, ty);
  target.rotate(radians(rot));
  target.scale(scl);
  target.imageMode(CENTER);
  
  if (ctrl.gray) target.tint(40, alpha);
  else target.tint(255, alpha);
  
  target.image(imgLayer, 0, 0);
  target.pop();
}

function drawPaperTexture(target) {
  target.push();
  target.background(250, 248, 242);
  target.noStroke();
  for (let i = 0; i < target.width; i += 10) {
    for (let j = 0; j < target.height; j += 10) {
      if (noise(i, j) > 0.6) {
        target.fill(230, 225, 215, 100); 
        target.rect(i, j, 4, 4);
      }
    }
  }
  target.pop();
}

function generateGrainTexture(w, h) {
  if (grainTexture) grainTexture.remove();
  grainTexture = createGraphics(w, h);
  grainTexture.loadPixels();
  for (let i = 0; i < grainTexture.pixels.length; i += 4) {
    let val = random(200, 255);
    grainTexture.pixels[i] = val;     
    grainTexture.pixels[i + 1] = val; 
    grainTexture.pixels[i + 2] = val; 
    grainTexture.pixels[i + 3] = 255; 
  }
  grainTexture.updatePixels();
}

// --- PROCESSING LOGIC ---

function handleFile(file) {
  if (file.type === 'image') {
    drawLoadingState();
    sourceImg = loadImage(file.data, () => {
      let ratio = min(CANVAS_MAX_WIDTH / sourceImg.width, CANVAS_MAX_HEIGHT / sourceImg.height);
      let newW = floor(sourceImg.width * ratio);
      let newH = floor(sourceImg.height * ratio);
      sourceImg.resize(newW, newH);
      resizeCanvas(newW, newH);
      generateGrainTexture(newW, newH);
      setTimeout(processCMYKLayers, 100);
    });
  }
}

function processCMYKLayers() {
  if(!sourceImg) return;
  let w = sourceImg.width;
  let h = sourceImg.height;

  ['c', 'm', 'y', 'k'].forEach(k => {
    layers[k] = createGraphics(w, h);
    layers[k].loadPixels();
  });

  sourceImg.loadPixels();

  let useHalftone = halftoneToggle.checked();
  let density = useHalftone ? dotSizeSlider.value() : 1; 

  for (let x = 0; x < w; x += density) {
    for (let y = 0; y < h; y += density) {
      let i = (y * w + x) * 4;
      if (i >= sourceImg.pixels.length) continue;

      let r = sourceImg.pixels[i] / 255;
      let g = sourceImg.pixels[i + 1] / 255;
      let b = sourceImg.pixels[i + 2] / 255;

      let kVal = 1 - Math.max(r, g, b);
      let cVal = (1 - r - kVal) / (1 - kVal) || 0;
      let mVal = (1 - g - kVal) / (1 - kVal) || 0;
      let yVal = (1 - b - kVal) / (1 - kVal) || 0;

      if (useHalftone) {
        drawHalftoneShape(layers.c, x, y, cVal, density, color(0, 255, 255));
        drawHalftoneShape(layers.m, x, y, mVal, density, color(255, 0, 255));
        drawHalftoneShape(layers.y, x, y, yVal, density, color(255, 255, 0));
        drawHalftoneShape(layers.k, x, y, kVal, density, color(30));
      } else {
        writeContinuousPixel(layers.c, i, 0, 255, 255, cVal);
        writeContinuousPixel(layers.m, i, 255, 0, 255, mVal);
        writeContinuousPixel(layers.y, i, 255, 255, 0, yVal);
        writeContinuousPixel(layers.k, i, 30, 30, 30, kVal);
      }
    }
  }

  if (!useHalftone) {
    ['c', 'm', 'y', 'k'].forEach(k => layers[k].updatePixels());
  }
  processed = true;
}

function drawHalftoneShape(pg, x, y, val, density, col) {
  if (val < 0.02) return; 
  pg.noStroke();
  col.setAlpha(255); 
  pg.fill(col);
  
  let size = map(val, 0, 1, 0, density * 1.5);
  
  if (currentShape === 'circle') {
    pg.circle(x, y, size);
  } else if (currentShape === 'rect') {
    pg.rectMode(CENTER);
    pg.rect(x, y, size, size);
  } else if (currentShape === 'line') {
    pg.rectMode(CENTER);
    pg.rect(x, y, density * 1.2, size);
  }
}

function writeContinuousPixel(pg, index, r, g, b, intensity) {
    pg.pixels[index] = r;
    pg.pixels[index+1] = g;
    pg.pixels[index+2] = b;
    pg.pixels[index+3] = intensity * 255; 
}


// --- LAYER MANAGEMENT ---

function moveLayer(key, direction) {
  let idx = layerOrder.indexOf(key);
  if (idx === -1) return;
  
  let newIdx = idx + direction;
  if (newIdx >= 0 && newIdx < layerOrder.length) {
    let temp = layerOrder[newIdx];
    layerOrder[newIdx] = layerOrder[idx];
    layerOrder[idx] = temp;
  }
}

function resetLayer(key) {
  controls[key].x.value(0);
  controls[key].y.value(0);
  controls[key].r.value(0);
  controls[key].s.value(1.0);
  controls[key].a.value(220);
  updateSliderDisplays(key);
}

function randomizeLayer(key) {
  controls[key].x.value(random(-30, 30));
  controls[key].y.value(random(-30, 30));
  controls[key].r.value(random(-3, 3));
  controls[key].s.value(random(0.9, 1.1));
  updateSliderDisplays(key);
}

function updateSliderDisplays(key) {
  controls[key].x.elt.dispatchEvent(new Event('input'));
  controls[key].y.elt.dispatchEvent(new Event('input'));
  controls[key].r.elt.dispatchEvent(new Event('input'));
  controls[key].s.elt.dispatchEvent(new Event('input'));
  controls[key].a.elt.dispatchEvent(new Event('input'));
}

// --- EXPORT LOGIC ---

function handleExport() {
  if(!processed) return;
  let fmt = formatSel.value(); 
  
  if (fmt === 'svg') {
    exportVectorSVG(); 
  } else {
    let exportBuffer = createGraphics(width, height);
    exportBuffer.pixelDensity(1); 
    compositeFinalImage(exportBuffer);
    saveCanvas(exportBuffer, `riso_art_${int(random(1000))}`, fmt);
    exportBuffer.remove();
    generateGrainTexture(width, height); 
  }
}

function exportVectorSVG() {
  if (!sourceImg) { alert("No image loaded."); return; }
  
  let w = sourceImg.width;
  let h = sourceImg.height;
  let useHalftone = halftoneToggle.checked();
  let density = useHalftone ? dotSizeSlider.value() : 1; 
  
  if (useHalftone && density < 5) {
    let ok = confirm("Warning: SVG Export with Dot Size < 5 generates massive files. Continue?");
    if(!ok) return;
  }

  const colors = { c: '#00adef', m: '#ec008c', y: '#fff200', k: '#222222' };
  const layerNames = { c: 'Cyan', m: 'Magenta', y: 'Yellow', k: 'Black' };

  let svgParts = [];
  svgParts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`);
  let bgFill = textureToggle.checked() ? "#faf8f2" : "#ffffff";
  svgParts.push(`<rect width="100%" height="100%" fill="${bgFill}"/>`);

  layerOrder.forEach(key => {
    let ctrl = controls[key];
    if (!ctrl.visible) return;

    let cx = w/2; 
    let cy = h/2;
    let tx = ctrl.x.value();
    let ty = ctrl.y.value();
    let rot = ctrl.r.value();
    let scl = ctrl.s.value(); 
    let alpha = (ctrl.a.value() / 255).toFixed(2);
    
    let transformStr = `translate(${tx}, ${ty}) translate(${cx}, ${cy}) rotate(${rot}) scale(${scl}) translate(-${cx}, -${cy})`;
    svgParts.push(`<g id="${layerNames[key]}" fill="${colors[key]}" opacity="${alpha}" style="mix-blend-mode: multiply;" transform="${transformStr}">`);

    for (let y = 0; y < h; y += density) {
      for (let x = 0; x < w; x += density) {
        
        let i = (y * w + x) * 4;
        if (i >= sourceImg.pixels.length) break;

        let r = sourceImg.pixels[i] / 255;
        let g = sourceImg.pixels[i + 1] / 255;
        let b = sourceImg.pixels[i + 2] / 255;

        let kVal = 1 - Math.max(r, g, b);
        let val = 0;
        if (key === 'c') val = (1 - r - kVal) / (1 - kVal) || 0;
        else if (key === 'm') val = (1 - g - kVal) / (1 - kVal) || 0;
        else if (key === 'y') val = (1 - b - kVal) / (1 - kVal) || 0;
        else if (key === 'k') val = kVal;

        if (val < 0.05) continue;

        let shapeStr = "";
        if (useHalftone) {
           let s = map(val, 0, 1, 0, density * 1.6);
           let rad = s / 2;
           let sF = s.toFixed(2);
           let rF = rad.toFixed(2);
           
           if (currentShape === 'circle') {
             shapeStr = `<circle cx="${x}" cy="${y}" r="${rF}"/>`;
           } else if (currentShape === 'rect') {
             shapeStr = `<rect x="${x - rad}" y="${y - rad}" width="${sF}" height="${sF}"/>`;
           } else if (currentShape === 'line') {
             let lw = (density * 1.2).toFixed(2);
             shapeStr = `<rect x="${x - density*0.6}" y="${y - rad}" width="${lw}" height="${sF}"/>`;
           }
        } else {
           shapeStr = `<rect x="${x}" y="${y}" width="${density}" height="${density}" opacity="${val.toFixed(2)}"/>`;
        }
        svgParts.push(shapeStr);
      }
    }
    svgParts.push(`</g>`); 
  });

  svgParts.push(`</svg>`);

  let blob = new Blob([svgParts.join('')], {type: "image/svg+xml"});
  let url = URL.createObjectURL(blob);
  let link = document.createElement("a");
  link.href = url;
  link.download = `riso_vector_${int(random(1000))}.svg`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// --- TOOLTIPS ---

function moveTooltip(e) {
  if (tooltipDiv && tooltipDiv.style('display') !== 'none') {
    let x = e.clientX + 15;
    let y = e.clientY + 15;
    if (x + 150 > window.innerWidth) x = e.clientX - 160;
    if (y + 40 > window.innerHeight) y = e.clientY - 40;
    tooltipDiv.style('left', x + 'px');
    tooltipDiv.style('top', y + 'px');
  }
}

function attachTooltip(elt, text) {
  elt.elt.addEventListener('mouseenter', () => {
    tooltipDiv.html(text);
    tooltipDiv.style('display', 'block');
  });
  elt.elt.addEventListener('mouseleave', () => {
    tooltipDiv.style('display', 'none');
  });
}

// --- UI CONSTRUCTION ---

function createLayoutStructure() {
  uiRefs.body = select('body');
  setStyle(uiRefs.body, { margin: '0', overflow: 'hidden', fontFamily: 'Segoe UI, sans-serif' });

  let main = createDiv();
  main.id('main-container');
  setStyle(main, { display: 'flex', height: '100vh', width: '100vw' });

  sidebar = createDiv();
  sidebar.parent(main);
  setStyle(sidebar, {
    width: SIDEBAR_WIDTH + 'px',
    padding: '20px',
    boxSizing: 'border-box',
    overflowY: 'auto',
    display: 'flex', flexDirection: 'column', gap: '10px'
  });
  uiRefs.sidebar = sidebar;

  canvasContainer = createDiv();
  canvasContainer.parent(main);
  setStyle(canvasContainer, {
    flexGrow: '1', display: 'flex', justifyContent: 'center', alignItems: 'center',
    background: '#f0f2f5', transition: 'background 0.3s'
  });
}

function buildUI() {
  let titleBox = createDiv().parent(sidebar);
  setStyle(titleBox, { textAlign: 'center', marginBottom: '20px', position: 'relative' });
  
  themeBtn = createButton('🌙').parent(titleBox);
  setStyle(themeBtn, { position: 'absolute', right: '0', top: '0', background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer' });
  themeBtn.mousePressed(toggleTheme);
  attachTooltip(themeBtn, "Switch Dark/Light Theme");
  
  let t1 = createDiv('Riso-Matic').parent(titleBox);
  setStyle(t1, { fontSize: '28px', fontWeight: '800', letterSpacing: '-0.5px' });
  uiRefs.texts.push(t1);

  let t2 = createDiv('Digital Offset Press').parent(titleBox);
  setStyle(t2, { fontSize: '13px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '1px' });
  uiRefs.texts.push(t2); // Add to text array for coloring

  // --- PANEL 1: SETTINGS ---
  let settingsBox = createPanel(sidebar);
  
  let hiddenInput = createFileInput(handleFile);
  hiddenInput.style('display', 'none').parent(sidebar);
  
  let uploadLabel = createElement('label', 'Upload Image');
  uploadLabel.attribute('for', hiddenInput.id());
  uploadLabel.parent(settingsBox);
  stylePrimaryBtn(uploadLabel);

  let row1 = createRow(settingsBox);
  
  halftoneToggle = createCheckbox('Halftone', false);
  stylePill(halftoneToggle);
  halftoneToggle.parent(row1);
  halftoneToggle.changed(() => { if (sourceImg) processCMYKLayers(); });

  textureToggle = createCheckbox('Texture', true);
  stylePill(textureToggle);
  textureToggle.parent(row1);

  let row2 = createRow(settingsBox);
  let shpLbl = createSpan('Shape:').parent(row2);
  styleLabel(shpLbl);

  shapeSel = createSelect();
  shapeSel.option('Circle', 'circle');
  shapeSel.option('Square', 'rect');
  shapeSel.option('Line', 'line');
  styleSelect(shapeSel);
  shapeSel.parent(row2);
  shapeSel.changed(() => { currentShape = shapeSel.value(); if (sourceImg) processCMYKLayers(); });

  let sliderRow = createDiv().parent(settingsBox);
  setStyle(sliderRow, { display: 'flex', alignItems: 'center', gap: '10px' });
  
  let dsLbl = createSpan('Dot Size').parent(sliderRow);
  styleLabel(dsLbl);
  
  dotSizeSlider = createSlider(3, 30, 7, 1);
  dotSizeSlider.parent(sliderRow);
  setStyle(dotSizeSlider, { flexGrow: '1', cursor: 'pointer' });

  let dotVal = createSpan(dotSizeSlider.value()).parent(sliderRow);
  setStyle(dotVal, { width: '30px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold' });
  uiRefs.texts.push(dotVal);
  
  dotSizeSlider.input(() => dotVal.html(dotSizeSlider.value()));
  dotSizeSlider.changed(() => { if (sourceImg && halftoneToggle.checked()) processCMYKLayers(); });

  // --- PANEL 2: LAYERS ---
  createHeader('Color Plates (↓ Bottom to Top ↑)');
  createLayerControls('Cyan', 'c', '#00adef');
  createLayerControls('Magenta', 'm', '#ec008c');
  createLayerControls('Yellow', 'y', '#fcdb03');
  createLayerControls('Black', 'k', '#333');

  // --- PANEL 3: EXPORT ---
  createHeader('Export');
  let exportBox = createPanel(sidebar);
  let rowExp = createRow(exportBox);
  
  formatSel = createSelect();
  formatSel.option('PNG', 'png');
  formatSel.option('JPG', 'jpg');
  formatSel.option('SVG (Vector)', 'svg'); 
  styleSelect(formatSel);
  formatSel.parent(rowExp);

  let exportBtn = createButton('Download');
  exportBtn.parent(exportBox);
  stylePrimaryBtn(exportBtn);
  setStyle(exportBtn, { background: '#4a90e2', marginTop: '10px' });
  addHover(exportBtn, { background: '#4a90e2', transform: 'scale(1)' }, { background: '#357abd', transform: 'scale(1.02)' });
  exportBtn.mousePressed(handleExport);
}

function createLayerControls(labelStr, key, colorHex) {
  let container = createDiv();
  container.parent(sidebar);
  uiRefs.cards.push(container); // Track for theming
  
  setStyle(container, {
    borderLeft: `6px solid ${colorHex}`, borderRadius: '12px',
    padding: '12px', marginBottom: '10px',
    boxShadow: '0 2px 5px rgba(0,0,0,0.02)'
  });

  let head = createDiv().parent(container);
  setStyle(head, { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px'});
  
  let titleGrp = createDiv().parent(head);
  setStyle(titleGrp, { display: 'flex', gap: '4px', alignItems: 'center' });
  
  let title = createSpan(labelStr).parent(titleGrp);
  setStyle(title, { fontWeight: '700', fontSize: '15px', marginRight: '5px' });
  uiRefs.texts.push(title);

  let btnDown = createTinyBtn('⬇').parent(titleGrp);
  btnDown.mousePressed(() => moveLayer(key, -1));

  let btnUp = createTinyBtn('⬆').parent(titleGrp);
  btnUp.mousePressed(() => moveLayer(key, 1));

  let vis = createCheckbox('', true);
  vis.parent(head);
  vis.changed(() => { controls[key].visible = vis.checked(); });

  let opts = createDiv().parent(container);
  setStyle(opts, { display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px dashed #ddd' });
  
  let btnReset = createTinyBtn('⟳').parent(opts);
  btnReset.mousePressed(() => resetLayer(key));

  let btnRand = createTinyBtn('🎲').parent(opts);
  btnRand.mousePressed(() => randomizeLayer(key));

  let blendC = createCheckbox('Ink', true);
  styleMiniCheck(blendC); blendC.parent(opts);
  blendC.changed(() => controls[key].blend = blendC.checked());
  
  let grayC = createCheckbox('B&W', false);
  styleMiniCheck(grayC); grayC.parent(opts);
  grayC.changed(() => controls[key].gray = grayC.checked());

  controls[key].x = createSliderWithLabel(container, 'X', -80, 80, 0, 1);
  controls[key].y = createSliderWithLabel(container, 'Y', -80, 80, 0, 1);
  controls[key].r = createSliderWithLabel(container, 'Rot', -10, 10, 0, 0.5);
  controls[key].s = createSliderWithLabel(container, 'Scale', 0.5, 1.5, 1.0, 0.05);
  controls[key].a = createSliderWithLabel(container, 'Opac', 0, 255, 220, 5);
}

// --- UI COMPONENT FACTORIES (Inline Styles) ---

function createPanel(parent) {
  let p = createDiv().parent(parent);
  uiRefs.panels.push(p);
  setStyle(p, { padding: '15px', borderRadius: '12px', border: '1px solid #eee' });
  return p;
}

function createRow(parent) {
  let r = createDiv().parent(parent);
  setStyle(r, { display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' });
  return r;
}

function createHeader(text) {
  let h = createElement('h4', text).parent(sidebar);
  setStyle(h, { fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', margin: '15px 0 5px 0', letterSpacing: '0.5px', color: '#888' });
  uiRefs.texts.push(h); // Treat headers as text for theming
}

function stylePrimaryBtn(elt) {
  setStyle(elt, {
    display: 'block', width: '100%', padding: '12px', boxSizing: 'border-box',
    background: '#333', color: '#fff', textAlign: 'center', borderRadius: '30px',
    fontWeight: '600', fontSize: '14px', cursor: 'pointer', border: 'none', transition: 'transform 0.2s'
  });
  addHover(elt, { opacity: '1', transform: 'scale(1)' }, { opacity: '0.9', transform: 'scale(1.02)' });
}

function createTinyBtn(txt) {
  let b = createButton(txt);
  setStyle(b, {
    background: '#fff', border: '1px solid #ddd', borderRadius: '4px',
    fontSize: '10px', padding: '2px 6px', cursor: 'pointer', color: '#333'
  });
  uiRefs.inputs.push(b); // Add for theming
  return b;
}

function stylePill(elt) {
  uiRefs.inputs.push(elt);
  setStyle(elt, {
    border: '1px solid #ddd', padding: '5px 10px', borderRadius: '20px',
    fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center'
  });
}

function styleSelect(elt) {
  uiRefs.inputs.push(elt);
  setStyle(elt, {
    flex: '1', padding: '8px', borderRadius: '8px', border: '1px solid #ddd',
    fontFamily: 'inherit', fontSize: '12px'
  });
}

function styleLabel(elt) {
  uiRefs.texts.push(elt);
  setStyle(elt, { fontSize: '12px', fontWeight: '600', minWidth: '60px' });
}

function styleMiniCheck(elt) {
  setStyle(elt, { fontSize: '11px', display: 'flex', alignItems: 'center', color: '#888', fontWeight: '500'});
}

function createSliderWithLabel(parent, label, min, max, val, step) {
  let row = createDiv().parent(parent);
  setStyle(row, { display: 'flex', alignItems: 'center', marginBottom: '4px' });
  
  let lbl = createSpan(label).parent(row);
  setStyle(lbl, { width: '35px', fontSize: '11px', color: '#888', fontWeight: '600' });
  
  let sld = createSlider(min, max, val, step);
  sld.parent(row);
  setStyle(sld, { flexGrow: '1', cursor: 'pointer', marginRight: '8px' });
  
  let valSpan = createSpan(val).parent(row);
  setStyle(valSpan, { width: '30px', textAlign: 'right', fontFamily: 'monospace', fontSize: '11px', fontWeight: 'bold' });
  uiRefs.texts.push(valSpan);
  
  sld.input(() => valSpan.html(sld.value()));
  return sld;
}

// --- THEME LOGIC (Direct Inline Updates) ---

function toggleTheme() {
  isDarkMode = !isDarkMode;
  themeBtn.html(isDarkMode ? '☀️' : '🌙');
  applyTheme();
}

function applyTheme() {
  let t = isDarkMode ? STYLES.dark : STYLES.light;

  // Main Areas
  if(uiRefs.body) uiRefs.body.style('background', t.bgApp);
  if(uiRefs.sidebar) uiRefs.sidebar.style('background', t.bgSidebar);
  if(uiRefs.sidebar) uiRefs.sidebar.style('borderRight', `1px solid ${t.border}`);
  if(canvasContainer) canvasContainer.style('background', t.bgApp);

  // Panels
  uiRefs.panels.forEach(p => {
    p.style('background', t.bgPanel);
    p.style('border', `1px solid ${t.border}`);
  });

  // Cards
  uiRefs.cards.forEach(c => {
    c.style('background', t.cardBg);
    c.style('border', `1px solid ${t.border}`);
  });

  // Inputs
  uiRefs.inputs.forEach(i => {
    i.style('background', t.inputBg);
    i.style('border', `1px solid ${t.border}`);
    i.style('color', t.textMain);
  });

  // Texts
  uiRefs.texts.forEach(txt => {
    txt.style('color', t.textMain);
  });
}

function drawEmptyState() {
  drawPaperTexture(this);
  fill(100); noStroke(); textAlign(CENTER); textSize(16);
  text("Ready to print.", width/2, height/2 - 10);
  textSize(14); fill(150);
  text("Select an image to start.", width/2, height/2 + 15);
}

function drawLoadingState() {
  background(250); fill(50); noStroke(); textAlign(CENTER); textSize(16);
  text("Processing Layers...", width/2, height/2);
}