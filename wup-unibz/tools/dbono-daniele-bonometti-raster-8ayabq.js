// WUP 2025-26
// Daniele Bonometti
// Refactored for Tool Viewer Compatibility (Inline Styles)

/**
 * RASTER MASTER - p5.js Tool
 * Updated Version:
 * - Added "RGB Offset" Layer Mode (Additive Glitch effect)
 * - Replaced boolean layering with "Layer Mode" selector
 * - Even smoother Grid Density control (Cubic progression)
 * - Default Background is now WHITE
 * - Default Foreground is now BLACK
 * - Canvas Auto-Resize & English UI
 */

// --- GLOBAL VARIABLES ---
let img;             // The loaded image
let myCanvas;        // The p5 canvas
let cWidth = 800;
let cHeight = 800;

// UI Object to hold references
let ui = {
  mainWrapper: null, // New wrapper to act as flex container
  sidebar: null,
  content: null,
  toggleBtn: null,
  sidebarOpen: true,
  wInput: null,
  hInput: null
};

// Configuration Parameters
let params = {
  gridSize: 15,
  scale: 0.8,
  type: 'Dots',
  layerMode: 'Single', // Options: 'Single', 'CMYK', 'RGB'
  layerShiftX: 4,      // Horizontal offset for layers
  layerShiftY: 4,      // Vertical offset for layers
  fg: '#000000',       // Default Foreground Black
  bg: '#ffffff'        // Default Background White
};

function setup() {
  // 1. Create a Main Wrapper to act as the "Body" (Flex Container)
  ui.mainWrapper = createDiv('');
  ui.mainWrapper.style('display', 'flex');
  ui.mainWrapper.style('flex-direction', 'row');
  ui.mainWrapper.style('height', '100vh');
  ui.mainWrapper.style('width', '100%');
  ui.mainWrapper.style('background-color', '#000');
  ui.mainWrapper.style('font-family', "'Segoe UI', sans-serif");
  ui.mainWrapper.style('overflow', 'hidden');
  ui.mainWrapper.style('margin', '0');
  ui.mainWrapper.style('color', '#f0f0f0');

  // 2. Initialize UI
  createSidebarUI();

  // 3. Create Canvas Container
  let canvasContainer = createDiv('');
  canvasContainer.id('canvas-container');
  canvasContainer.parent(ui.mainWrapper);
  
  // Inline styles for canvas container
  canvasContainer.style('flex-grow', '1');
  canvasContainer.style('display', 'flex');
  canvasContainer.style('justify-content', 'center');
  canvasContainer.style('align-items', 'center');
  canvasContainer.style('background', '#111');
  canvasContainer.style('background-image', 'radial-gradient(#222 1px, transparent 1px)');
  canvasContainer.style('background-size', '20px 20px');
  canvasContainer.style('overflow', 'auto');
  canvasContainer.style('position', 'relative');

  // 4. Create Canvas
  myCanvas = createCanvas(cWidth, cHeight);
  myCanvas.parent(canvasContainer);
  pixelDensity(1);
  noLoop();

  drawRaster();
}

function draw() {
  // Loop disabled for performance
}

// --- RASTER LOGIC ---

function drawRaster() {
  background(params.bg);

  if (!img) {
    fill(params.fg);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(20);
    text("Upload an image from the menu", width / 2, height / 2);
    return;
  }

  img.loadPixels();
  noStroke();
  
  // Aspect Ratio Logic
  let drawW, drawH, startX, startY;
  let imgAspect = img.width / img.height;
  let canvasAspect = width / height;

  if (imgAspect > canvasAspect) {
    drawW = width;
    drawH = width / imgAspect;
    startX = 0;
    startY = (height - drawH) / 2;
  } else {
    drawH = height;
    drawW = height * imgAspect;
    startX = (width - drawW) / 2;
    startY = 0;
  }

  let step = params.gridSize;
  if (step < 1) step = 1;

  for (let y = 0; y < drawH; y += step) {
    for (let x = 0; x < drawW; x += step) {
      
      let imgX = Math.floor(map(x, 0, drawW, 0, img.width));
      let imgY = Math.floor(map(y, 0, drawH, 0, img.height));
      
      let c = getQuickColor(img, imgX, imgY);
      
      let posX = startX + x + step/2;
      let posY = startY + y + step/2;

      // Check Layer Mode
      if (params.layerMode !== 'Single') {
        drawLayers(params.type, posX, posY, step, c);
      } else {
        // Normal Single Layer
        let b = brightness(c);
        fill(params.fg);
        stroke(params.fg);
        drawElement(params.type, posX, posY, step, b, params.scale);
      }
    }
  }
}

/**
 * Draws elements based on selected Layer Mode (CMYK or RGB)
 */
function drawLayers(type, x, y, step, c) {
  let r = red(c);
  let g = green(c);
  let b = blue(c);

  let offX = params.layerShiftX; 
  let offY = params.layerShiftY;

  if (params.layerMode === 'CMYK') {
    // --- CMYK (Subtractive) Logic ---
    let cVal = 255 - r;
    let mVal = 255 - g;
    let yVal = 255 - b;

    // Cyan
    fill(0, 255, 255, 200); 
    stroke(0, 255, 255, 200);
    let sizeC = map(cVal, 0, 255, 0, 100);
    if (sizeC > 5) drawElement(type, x - offX, y - offY, step, sizeC, params.scale);

    // Magenta
    fill(255, 0, 255, 200);
    stroke(255, 0, 255, 200);
    let sizeM = map(mVal, 0, 255, 0, 100);
    if (sizeM > 5) drawElement(type, x, y, step, sizeM, params.scale);

    // Yellow
    fill(255, 255, 0, 200);
    stroke(255, 255, 0, 200);
    let sizeY = map(yVal, 0, 255, 0, 100);
    if (sizeY > 5) drawElement(type, x + offX, y + offY, step, sizeY, params.scale);
  } 
  else if (params.layerMode === 'RGB') {
    // --- RGB (Additive) Logic ---
    // Red
    fill(255, 0, 0, 200); 
    stroke(255, 0, 0, 200);
    let sizeR = map(r, 0, 255, 0, 100);
    if (sizeR > 5) drawElement(type, x - offX, y - offY, step, sizeR, params.scale);

    // Green
    fill(0, 255, 0, 200);
    stroke(0, 255, 0, 200);
    let sizeG = map(g, 0, 255, 0, 100);
    if (sizeG > 5) drawElement(type, x, y, step, sizeG, params.scale);

    // Blue
    fill(0, 0, 255, 200);
    stroke(0, 0, 255, 200);
    let sizeB = map(b, 0, 255, 0, 100);
    if (sizeB > 5) drawElement(type, x + offX, y + offY, step, sizeB, params.scale);
  }
}

function drawElement(type, x, y, step, bright, scaleFactor) {
  let maxDim = step * scaleFactor;
  let size = map(bright, 0, 100, 0, maxDim);
  
  if (size <= 0.5) return;

  if (type === 'Dots') {
    noStroke();
    circle(x, y, size);
  } 
  else if (type === 'Squares') {
    noStroke();
    rectMode(CENTER);
    rect(x, y, size, size);
  } 
  else if (type === 'Lines') {
    let sw = map(bright, 0, 100, 0, maxDim * 0.6);
    strokeWeight(sw);
    line(x - step/2, y, x + step/2, y);
  }
  else if (type === 'Crosses') {
    let sw = map(bright, 0, 100, 0.5, maxDim * 0.3);
    strokeWeight(sw);
    let l = size / 2;
    line(x - l, y - l, x + l, y + l);
    line(x + l, y - l, x - l, y + l);
  }
  else if (type === 'Triangles') {
    noStroke();
    let r = size / 2;
    triangle(x, y - r, x - r*0.866, y + r*0.5, x + r*0.866, y + r*0.5);
  }
  else if (type === 'Waves') {
    noFill();
    let sw = map(bright, 0, 100, 0.5, maxDim * 0.4);
    strokeWeight(sw);
    arc(x, y, step, step * 0.6, PI, TWO_PI);
  }
}

function getQuickColor(sourceImg, x, y) {
  let index = (x + y * sourceImg.width) * 4;
  if (index < 0 || index >= sourceImg.pixels.length) return color(0);
  return color(sourceImg.pixels[index], sourceImg.pixels[index + 1], sourceImg.pixels[index + 2]);
}

// --- UI ---

function createSidebarUI() {
  ui.sidebar = createDiv('');
  ui.sidebar.id('sidebar');
  ui.sidebar.parent(ui.mainWrapper);
  
  // Inline Sidebar Styles
  ui.sidebar.style('width', '300px');
  ui.sidebar.style('background-color', '#1a1a1a');
  ui.sidebar.style('border-right', '1px solid #333');
  ui.sidebar.style('box-shadow', '5px 0 15px rgba(0,0,0,0.5)');
  ui.sidebar.style('position', 'relative');
  ui.sidebar.style('z-index', '10');
  ui.sidebar.style('height', '100%'); // Full height of wrapper
  ui.sidebar.style('display', 'flex');
  ui.sidebar.style('flex-direction', 'column');
  ui.sidebar.style('flex-shrink', '0');
  ui.sidebar.style('transition', 'margin-left 0.3s ease');
  ui.sidebar.style('overflow', 'visible');

  // Toggle Button
  ui.toggleBtn = createButton('✕');
  ui.toggleBtn.id('toggle-btn');
  ui.toggleBtn.parent(ui.sidebar);
  
  // Inline Button Styles
  ui.toggleBtn.style('position', 'absolute');
  ui.toggleBtn.style('top', '15px');
  ui.toggleBtn.style('right', '-40px');
  ui.toggleBtn.style('width', '40px');
  ui.toggleBtn.style('height', '40px');
  ui.toggleBtn.style('background', '#4a90e2');
  ui.toggleBtn.style('border', 'none');
  ui.toggleBtn.style('color', 'white');
  ui.toggleBtn.style('font-size', '1.2rem');
  ui.toggleBtn.style('border-radius', '0 5px 5px 0');
  ui.toggleBtn.style('cursor', 'pointer');
  ui.toggleBtn.style('display', 'flex');
  ui.toggleBtn.style('align-items', 'center');
  ui.toggleBtn.style('justify-content', 'center');
  ui.toggleBtn.style('box-shadow', '2px 0 5px rgba(0,0,0,0.3)');
  ui.toggleBtn.mousePressed(toggleSidebar);

  ui.content = createDiv('');
  ui.content.id('sidebar-content');
  ui.content.parent(ui.sidebar);
  ui.content.style('padding', '20px');
  ui.content.style('overflow-y', 'auto');
  ui.content.style('flex-grow', '1');

  let title = createElement('h2', 'Raster Master');
  title.parent(ui.content);
  title.style('color', '#4a90e2');
  title.style('margin-top', '0');
  title.style('font-size', '1.4rem');
  title.style('margin-bottom', '20px');

  // --- IMAGE ---
  createControlGroup('Image', (group) => {
    let p = createP('Upload JPG or PNG:');
    p.parent(group);
    styleLabel(p);
    
    let fileInput = createFileInput(handleFile);
    fileInput.parent(group);
    fileInput.style('color', '#aaa');
    fileInput.style('margin-bottom', '8px');
  });

  // --- CANVAS ---
  createControlGroup('Canvas', (group) => {
    ui.wInput = createLabeledInput(group, 'Width (px):', cWidth);
    ui.hInput = createLabeledInput(group, 'Height (px):', cHeight);
    
    let resizeBtn = createButton('Resize Manual');
    resizeBtn.parent(group);
    styleButton(resizeBtn, 'secondary');
    resizeBtn.mousePressed(() => {
      let w = parseInt(ui.wInput.value());
      let h = parseInt(ui.hInput.value());
      if (w > 0 && h > 0) {
        cWidth = w; cHeight = h;
        resizeCanvas(cWidth, cHeight);
        drawRaster();
      }
    });
  });

  // --- EFFECTS ---
  createControlGroup('Effects', (group) => {
    let typeLabel = createP('Shape:');
    typeLabel.parent(group);
    styleLabel(typeLabel);

    let sel = createSelect();
    sel.parent(group);
    styleInput(sel);
    sel.option('Dots');
    sel.option('Squares');
    sel.option('Lines');
    sel.option('Crosses');
    sel.option('Triangles');
    sel.option('Waves');
    sel.selected('Dots');
    sel.changed(() => {
      params.type = sel.value();
      drawRaster();
    });

    // Layer Mode Selector
    let layerContainer = createDiv('');
    layerContainer.parent(group);
    layerContainer.style('margin', '15px 0 5px 0');
    
    let layerLabel = createP('Layer Mode:');
    layerLabel.parent(layerContainer);
    layerLabel.style('margin', '0 0 5px 0');
    layerLabel.style('font-size', '0.9rem');

    let layerSel = createSelect();
    layerSel.parent(layerContainer);
    styleInput(layerSel);
    layerSel.option('Single Layer');
    layerSel.option('CMYK Offset');
    layerSel.option('RGB Offset');
    layerSel.selected('Single Layer');
    layerSel.changed(() => {
      let val = layerSel.value();
      if (val === 'Single Layer') params.layerMode = 'Single';
      else if (val === 'CMYK Offset') params.layerMode = 'CMYK';
      else if (val === 'RGB Offset') params.layerMode = 'RGB';
      drawRaster();
    });

    // Layer Shift Sliders
    createSliderControl(group, 'Layer Offset X', -50, 50, 4, 1, (val) => params.layerShiftX = val);
    createSliderControl(group, 'Layer Offset Y', -50, 50, 4, 1, (val) => params.layerShiftY = val);

    // Grid & Scale
    createSliderControl(group, 'Grid Density', 0, 100, 40, 1, (val) => {
      params.gridSize = 5 + floor((val * val * val) / 6500);
    });

    createSliderControl(group, 'Effect Strength', 0.1, 2.0, 0.8, 0.05, (val) => params.scale = val);
  });

  // --- COLORS ---
  createControlGroup('Colors (Single Mode)', (group) => {
    createColorControl(group, 'Elements:', '#000000', (val) => params.fg = val);
    createColorControl(group, 'Background:', '#ffffff', (val) => params.bg = val);
    let note = createP('Note: Colors apply only in "Single Layer" mode.');
    note.parent(group);
    note.style('font-size', '0.7rem');
    note.style('color', '#666');
    note.style('margin', '5px 0');
  });

  // --- EXPORT ---
  createControlGroup('Save/Export', (group) => {
    let btnJpg = createButton('JPG');
    btnJpg.parent(group);
    styleButton(btnJpg, 'primary');
    btnJpg.mousePressed(() => saveCanvas(myCanvas, 'raster', 'jpg'));

    let btnPng = createButton('PNG');
    btnPng.parent(group);
    styleButton(btnPng, 'primary');
    btnPng.mousePressed(() => saveCanvas(myCanvas, 'raster', 'png'));
  });
}

// --- UI HELPERS AND INLINE STYLING FUNCTIONS ---

function createControlGroup(title, callback) {
  let g = createDiv('');
  g.parent(ui.content);
  // Inline styling replacing .control-group
  g.style('background', '#252525');
  g.style('padding', '15px');
  g.style('border-radius', '6px');
  g.style('margin-bottom', '15px');

  let h = createElement('h3', title);
  h.parent(g);
  // Inline styling for H3
  h.style('margin', '0 0 10px 0');
  h.style('font-size', '0.85rem');
  h.style('color', '#888');
  h.style('text-transform', 'uppercase');
  h.style('letter-spacing', '1px');
  
  callback(g);
}

// Style Helper for Labels
function styleLabel(el) {
    el.style('margin', '5px 0');
    el.style('font-size', '0.85rem');
}

// Style Helper for Inputs/Selects
function styleInput(el) {
    el.style('width', '100%');
    el.style('padding', '6px');
    el.style('background', '#333');
    el.style('border', '1px solid #444');
    el.style('color', 'white');
    el.style('border-radius', '4px');
    el.style('box-sizing', 'border-box');
    el.style('margin-bottom', '8px');
}

// Style Helper for Buttons with Hover States
function styleButton(btn, type) {
    btn.style('width', '100%');
    btn.style('padding', '10px');
    btn.style('border-radius', '4px');
    btn.style('cursor', 'pointer');
    btn.style('margin-top', '5px');
    btn.style('border', 'none');
    btn.style('color', 'white');

    if (type === 'primary') {
        let normal = '#4a90e2';
        let hover = '#357abd';
        btn.style('background', normal);
        btn.mouseOver(() => btn.style('background', hover));
        btn.mouseOut(() => btn.style('background', normal));
    } else {
        let normal = '#444';
        let hover = '#555';
        btn.style('padding', '8px'); // Slightly smaller for secondary
        btn.style('background', normal);
        btn.mouseOver(() => btn.style('background', hover));
        btn.mouseOut(() => btn.style('background', normal));
    }
}

function createLabeledInput(parent, label, val) {
  let l = createP(label);
  l.parent(parent);
  styleLabel(l);
  
  let i = createInput(String(val), 'number');
  i.parent(parent);
  styleInput(i);
  return i;
}

function createSliderControl(parent, label, min, max, val, step, callback) {
  let l = createP(label);
  l.parent(parent);
  styleLabel(l);
  
  let s = createSlider(min, max, val, step);
  s.parent(parent);
  s.style('width', '100%');
  s.input(() => {
    callback(s.value());
    drawRaster();
  });
}

function createColorControl(parent, label, val, callback) {
  let l = createP(label);
  l.parent(parent);
  styleLabel(l);
  
  let c = createColorPicker(val);
  c.parent(parent);
  // Default color picker styles usually fine, but ensure width
  c.style('width', '100%');
  c.style('height', '40px');
  c.style('border', 'none');
  c.input(() => {
    callback(c.value());
    drawRaster();
  });
}

function handleFile(file) {
  if (file.type === 'image') {
    loadImage(file.data, (loadedImg) => {
      img = loadedImg;
      if (img.width > 2000) img.resize(2000, 0);
      
      cWidth = img.width;
      cHeight = img.height;
      resizeCanvas(cWidth, cHeight);
      
      if (ui.wInput) ui.wInput.value(cWidth);
      if (ui.hInput) ui.hInput.value(cHeight);

      drawRaster();
    });
  }
}

function toggleSidebar() {
  ui.sidebarOpen = !ui.sidebarOpen;
  
  // Directly manipulate the style property instead of toggling a CSS class
  if (ui.sidebarOpen) {
    ui.sidebar.style('margin-left', '0px');
    ui.toggleBtn.html('✕');
  } else {
    ui.sidebar.style('margin-left', '-300px');
    ui.toggleBtn.html('☰');
  }
}