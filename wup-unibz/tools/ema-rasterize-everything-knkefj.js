// --- GLOBAL VARIABLES ---
let font; 
let appState = 0; // 0 = Start Screen, 1 = Main App
let previewMode = false; // Toggle for Preview button

// --- UNDO SYSTEM ---
let undoState = null; // Stores the state before the last action

// --- IMAGES & BUFFERS ---
let imgOriginal;      // The raw uploaded image
let imgFiltered;      // The cached result of Film Emulation
let cnv;              // The canvas

// --- UI CONTAINERS ---
let sidebar;
let filmPanel, rasterPanel; // Divs to show/hide controls
let actionToolbar; // Container for Undo/Reset/Preview

// --- CHECKBOXES (THE MAIN TOGGLES) ---
let filmEnableCb, rasterEnableCb;

// --- FILM EMULATION VARIABLES ---
const filmLibrary = {
  "None": { "Original": { curve: 0, sat: 1.0, shift: [1,1,1], black: [0,0,0], white: [255,255,255] } },
  "Kodak": { 
    "Gold 200": { curve: 1.1, sat: 1.05, grain: 12, shift: [0.92, 0.94, 1.08], black: [10, 5, 0], white: [255, 245, 230] }, 
    "Ektar 100": { curve: 1.25, sat: 1.4, grain: 6, shift: [0.95, 0.98, 1.05], black: [0, 5, 10], white: [255, 252, 245] }, 
    "Portra 400": { curve: 0.92, sat: 1.1, grain: 6, shift: [0.98, 1.02, 1.04], black: [15, 12, 12], white: [255, 250, 245], halation: true },
    "Kodachrome": { curve: 1.3, sat: 1.2, grain: 8, shift: [0.95, 0.97, 1.05], black: [15, 5, 8], white: [255, 248, 240] },
    "Aerochrome": { special: 'aerochrome_shader', curve: 1.0, sat: 1.0, grain: 10, shift: [1, 1, 1], black: [0, 0, 0], white: [255, 255, 255], halation: false }
  },
  "Fujifilm": { 
    "Pro 400H": { curve: 0.95, sat: 0.9, grain: 10, shift: [1.02, 0.94, 1.02], black: [8, 12, 15], white: [248, 255, 252] }, 
    "Superia 400": { curve: 1.1, sat: 1.05, grain: 14, shift: [1.05, 0.90, 1.05], black: [5, 10, 5], white: [245, 255, 245] }, 
    "Velvia 50": { curve: 1.5, sat: 1.5, grain: 4, shift: [1.05, 0.95, 1.0], black: [0, 0, 5], white: [255, 240, 250] },
    "Provia 100F": { curve: 1.2, sat: 1.15, grain: 5, shift: [1.02, 0.98, 1.02], black: [2, 5, 5], white: [250, 255, 250] }
  },
  "Ilford": { 
    "HP5 Plus (B&W)": { bw: true, curve: 1.1, grain: 15, black: [5,5,5], white: [250,250,250] }, 
    "Delta 100 (B&W)": { bw: true, curve: 1.15, grain: 6, black: [8, 8, 8], white: [255, 255, 255] } 
  },
  "CineStill": { 
    "800T": { curve: 1.1, sat: 1.2, grain: 14, shift: [1.1, 1.05, 0.85], black: [0, 5, 20], white: [220, 230, 255], halation: true },
    "400D": { curve: 1.05, sat: 1.2, grain: 10, shift: [0.95, 0.98, 1.05], black: [10, 5, 5], white: [255, 250, 240], halation: true }
  }
};

const defaultAdj = { bright: 0, contrast: 0, highlights: 0, shadows: 0, sat: 0, warmth: 0, tint: 0 };
let adj = { ...defaultAdj };
let makerSelect, filmSelect, filmGrainSlider, filmIntensitySlider;
let filmStatusText;

// --- RASTERIZER VARIABLES ---
let formatSelect, rasterTypeSelect, rasterTextInput;
let densitySlider, sizeSlider, contrastSlider, inkColorPicker;
let warholCb, sliceEnableCb, sliceDirSelect, sliceStartSlider, sliceCountSlider;

// --- VIEW / EXPORT / ANIMATION ---
let startButton;
let t = 0;
const GRID_SPACING = 20;
const DISTORTION_FORCE = 40;
const ANIMATION_SPEED = 0.005;

let zoom = 1.0, panX = 0, panY = 0;
let isDragging = false, startDragX, startDragY, startPanX, startPanY;
let saveButton, saveSvgButton, saveGifButton;
let previewToggleBtn, undoBtn, resetBtn;

// Layout
const MAX_PREVIEW_SIZE = 600;
const SIDEBAR_WIDTH = 280;
const GAP = 20;
let currentW = 250, currentH = 250;

// Pulse Colors
let pColor1, pColor2, pColor3;

function setup() {
  let c = createCanvas(windowWidth, windowHeight);
  c.drop(handleFile); 
  
  // FIX: Allow dropping on the whole body
  let body = select('body');
  if(body) body.drop(handleFile);

  pColor1 = color(153, 255, 0);    
  pColor2 = color(255, 255, 0);    
  pColor3 = color(255, 140, 0);    
  setupStartButton();
  textAlign(CENTER, CENTER);
  frameRate(60); 
}

function draw() {
  if (appState === 0) {
    background(255); 
    drawWavyGrid();
    drawStartUI();
  } else {
    // --- MAIN RENDER LOOP ---
    if (!imgOriginal) { updateCanvasSize(); return; }

    // 1. DETERMINE SOURCE IMAGE
    // If Preview Mode is ON, force original. 
    // Else: If Film is enabled, use filtered image. If not, use original.
    let source;
    if (previewMode) {
      source = imgOriginal;
    } else {
      source = (filmEnableCb && filmEnableCb.checked() && imgFiltered) ? imgFiltered : imgOriginal;
    }

    // 2. RENDER PHASE
    // If Preview Mode is ON, skip raster and show simple preview
    if (previewMode) {
       background(30);
       renderSimple(this, source, width, height, "PREVIEWING ORIGINAL");
    } 
    else if (rasterEnableCb && rasterEnableCb.checked()) {
      // A. RASTER MODE
      if (rasterTypeSelect.value() !== 'Pulsing Halftone') {
         // background(255); // Optional clear
      }
      renderRaster(this, source, 1.0, width, height, null, null);
    } else {
      // B. SIMPLE PREVIEW MODE (No Raster)
      background(30);
      renderSimple(this, source, width, height, "RASTER DISABLED");
    }
  }
}

// ---------------------------------------------------------
// PART 1: START SCREEN
// ---------------------------------------------------------
function setupStartButton() {
  startButton = createButton('ENTER LAB');
  startButton.style('font-size', '20px');
  startButton.style('padding', '15px 40px');
  startButton.style('background-color', '#000000');
  startButton.style('color', '#FFFFFF');
  startButton.style('border', 'none');
  startButton.style('cursor', 'pointer');
  startButton.style('font-family', 'Courier New');
  startButton.style('font-weight', 'bold');
  startButton.position(width / 2 - 70, height / 2 + 80);
  startButton.mousePressed(launchMainApp);
}

function launchMainApp() {
  startButton.remove();
  appState = 1;
  background(240);
  setupMainAppInterface();
}

function drawWavyGrid() {
  stroke(0, 50); noFill(); strokeWeight(1);
  t += ANIMATION_SPEED; 
  for (let x = 0; x <= width; x += GRID_SPACING) {
    beginShape();
    for (let y = 0; y <= height; y += 10) {
      let xOffset = map(noise(x * 0.005, y * 0.005, t), 0, 1, -DISTORTION_FORCE, DISTORTION_FORCE);
      vertex(x + xOffset, y);
    }
    endShape();
  }
  for (let y = 0; y <= height; y += GRID_SPACING) {
    beginShape();
    for (let x = 0; x <= width; x += 10) {
      let yOffset = map(noise(x * 0.005, y * 0.005, t + 100), 0, 1, -DISTORTION_FORCE, DISTORTION_FORCE);
      vertex(x, y + yOffset);
    }
    endShape();
  }
}

function drawStartUI() {
  fill(0);
  textFont('Courier New'); // System font
  textSize(80); text('FILM & RASTER', width / 2, height / 2 - 80);
  textSize(20); textFont('Courier New'); text('VISUAL PROCESSOR', width / 2, height / 2 + 10);
  startButton.position(width / 2 - startButton.size().width / 2, height / 2 + 80);
}

// ---------------------------------------------------------
// PART 2: MAIN INTERFACE SETUP
// ---------------------------------------------------------
function setupMainAppInterface() {
  // Sidebar Setup
  sidebar = createDiv();
  sidebar.position(20, 20);
  sidebar.style('width', SIDEBAR_WIDTH + 'px');
  sidebar.style('max-height', (windowHeight - 40) + 'px');
  sidebar.style('overflow-y', 'auto');
  sidebar.style('background-color', '#ffffff');
  sidebar.style('padding', '20px'); 
  sidebar.style('font-family', 'Helvetica, sans-serif');
  sidebar.style('border', '1px solid #ddd');
  sidebar.style('box-shadow', '0 10px 25px rgba(0,0,0,0.1)'); 

  cnv = createCanvas(currentW, currentH);
  cnv.position(20 + SIDEBAR_WIDTH + GAP, 20);
  pixelDensity(1); noSmooth();
  cnv.mousePressed(canvasPressed);
  cnv.mouseReleased(canvasReleased);

  function createHeader(label, parent) {
    let h = createDiv(label); h.parent(parent);
    h.style('font-weight', '800'); h.style('font-size', '11px');
    h.style('text-transform', 'uppercase'); h.style('color', '#888');
    h.style('margin-bottom', '5px'); h.style('letter-spacing', '1px');
    return h;
  }

  // --- 0. ACTION TOOLBAR (PREVIEW, UNDO, RESET) ---
  createHeader('ACTIONS', sidebar);
  actionToolbar = createDiv().parent(sidebar).style('display', 'flex').style('gap', '5px').style('margin-bottom', '20px');
  
  previewToggleBtn = createButton('Preview').parent(actionToolbar).style('flex', '1').style('cursor','pointer');
  previewToggleBtn.mousePressed(togglePreviewMode);
  
  undoBtn = createButton('Undo').parent(actionToolbar).style('flex', '1').style('cursor','pointer');
  undoBtn.mousePressed(performUndo);

  resetBtn = createButton('Reset All').parent(actionToolbar).style('flex', '1').style('cursor','pointer');
  resetBtn.mousePressed(performResetAll);


  // --- 1. UPLOAD (TOP PRIORITY) ---
  createHeader('SOURCE INPUT', sidebar);
  let fileInput = createFileInput(handleFile);
  fileInput.parent(sidebar).style('width', '100%').style('margin-bottom', '20px');

  // --- 2. PIPELINE TOGGLES ---
  let pipelineBox = createDiv().parent(sidebar).style('background', '#f4f4f4').style('padding', '15px').style('border-radius', '8px').style('margin-bottom', '20px');
  
  // Default unchecked
  filmEnableCb = createCheckbox(' Enable Film Emulation', false).parent(pipelineBox);
  filmEnableCb.style('font-weight', 'bold').style('margin-bottom', '8px');
  // Capture state for undo on change
  filmEnableCb.elt.onmousedown = captureState; 
  
  // Default unchecked
  rasterEnableCb = createCheckbox(' Enable Raster Styles', false).parent(pipelineBox);
  rasterEnableCb.style('font-weight', 'bold');
  rasterEnableCb.elt.onmousedown = captureState;

  // Event Listeners for Toggles
  filmEnableCb.changed(() => {
    if(filmEnableCb.checked()) { filmPanel.style('display', 'block'); runFilmProcessing(); }
    else { filmPanel.style('display', 'none'); requestRedraw(); }
  });

  rasterEnableCb.changed(() => {
    if(rasterEnableCb.checked()) { rasterPanel.style('display', 'block'); onTypeChanged(); }
    else { rasterPanel.style('display', 'none'); noLoop(); requestRedraw(); }
  });

  // --- 3. FILM PANEL ---
  filmPanel = createDiv().parent(sidebar).style('border-left', '3px solid #000').style('padding-left', '10px').style('margin-bottom', '30px').style('display', 'none');
  createHeader('FILM CONTROLS', filmPanel);
  
  makerSelect = createSelect().parent(filmPanel).style('width', '100%').style('margin-bottom', '5px');
  makerSelect.option('Select Brand...');
  for (let maker in filmLibrary) { if (maker !== "None") makerSelect.option(maker); }
  makerSelect.elt.onmousedown = captureState;
  makerSelect.changed(updateFilmOptions);

  filmSelect = createSelect().parent(filmPanel).style('width', '100%').style('margin-bottom', '10px');
  filmSelect.option('Select Stock'); filmSelect.disable();
  filmSelect.elt.onmousedown = captureState;
  filmSelect.changed(runFilmProcessing);

  filmGrainSlider = makeControl('Grain', 0, 100, 50, 1, filmPanel, runFilmProcessing);
  filmIntensitySlider = makeControl('Intensity', 0, 100, 100, 1, filmPanel, runFilmProcessing);

  let advDiv = createDiv().parent(filmPanel).style('margin-top','10px');
  let advCb = createCheckbox(' Advanced', false).parent(advDiv);
  let advInner = createDiv().parent(advDiv).style('display','none').style('margin-top','5px');
  advCb.changed(() => { advInner.style('display', advCb.checked() ? 'block' : 'none'); });

  function makeAdvSlider(label, key, min, max, def) {
    let row = createDiv('').style('display:flex; justify-content:space-between; font-size:10px').parent(advInner);
    createSpan(label).parent(row); 
    let s = createSlider(min, max, def).parent(advInner).style('width', '100%');
    // For Undo: Capture state on mouse press (start of drag)
    s.mousePressed(captureState);
    s.mouseReleased(() => { adj[key] = s.value(); runFilmProcessing(); });
  }
  makeAdvSlider('Exposure', 'bright', -50, 50, 0);
  makeAdvSlider('Temp', 'warmth', -50, 50, 0);
  makeAdvSlider('Sat', 'sat', -100, 50, 0);
  
  filmStatusText = createDiv('').parent(filmPanel).style('font-size','9px').style('color','#aaa').style('margin-top','5px');


  // --- 4. RASTER PANEL ---
  rasterPanel = createDiv().parent(sidebar).style('border-left', '3px solid #2196F3').style('padding-left', '10px').style('margin-bottom', '30px').style('display', 'none');
  createHeader('RASTER CONTROLS', rasterPanel);
  
  rasterTypeSelect = createSelect().parent(rasterPanel).style('width', '100%').changed(onTypeChanged);
  rasterTypeSelect.option('Dot Raster'); rasterTypeSelect.option('Grainy Film'); rasterTypeSelect.option('Pattern Raster'); rasterTypeSelect.option('Text Raster'); rasterTypeSelect.option('Pulsing Halftone'); rasterTypeSelect.option('Wavy Distortion');
  rasterTypeSelect.elt.onmousedown = captureState;
  rasterTypeSelect.style('margin-bottom', '10px');

  rasterTextInput = createInput('').parent(rasterPanel).attribute('placeholder', 'Type...').style('width', '90%').style('margin-bottom', '5px').style('display', 'none').input(requestRedraw);

  densitySlider = makeControl('Density', 2, 60, 10, 1, rasterPanel, requestRedraw);
  sizeSlider = makeControl('Size / Phase', 0.1, 10.0, 1.2, 0.1, rasterPanel, requestRedraw);
  contrastSlider = makeControl('Contrast', 0.1, 5.0, 1.5, 0.1, rasterPanel, requestRedraw);
  
  createDiv('Ink Color').parent(rasterPanel).style('font-size','10px').style('margin-top','5px');
  inkColorPicker = createColorPicker('#000000').parent(rasterPanel).style('width', '100%').style('height', '25px').style('border', 'none');
  inkColorPicker.input(requestRedraw);

  createDiv('').parent(rasterPanel).style('height','10px');
  let specialBox = createDiv().parent(rasterPanel);
  warholCb = createCheckbox(' Warhol Mode', false).parent(specialBox);
  warholCb.elt.onmousedown = captureState;
  
  sliceEnableCb = createCheckbox(' Slice Mode', false).parent(specialBox).changed(requestRedraw);
  sliceEnableCb.elt.onmousedown = captureState;
  
  sliceCountSlider = makeControl('Slices', 1, 10, 2, 1, specialBox, requestRedraw);
  sliceStartSlider = makeControl('Offset', 0.0, 0.99, 0.0, 0.01, specialBox, requestRedraw);


  // --- 5. GLOBAL SETTINGS (Format, View, Export) ---
  createHeader('CANVAS & EXPORT', sidebar);
  formatSelect = createSelect().parent(sidebar).style('width', '100%').style('margin-bottom', '10px');
  formatSelect.option('1:1 (Square)'); formatSelect.option('2:3 (Portrait)'); formatSelect.option('3:2 (Landscape)'); formatSelect.option('16:9 (Landscape)');
  formatSelect.changed(updateCanvasSize); 

  let zoomRow = createDiv().parent(sidebar).style('display','flex').style('gap','5px').style('margin-bottom','5px');
  createButton('Zoom +').parent(zoomRow).style('flex','1').mousePressed(() => applyButtonZoom(1.1));
  createButton('Zoom -').parent(zoomRow).style('flex','1').mousePressed(() => applyButtonZoom(0.9));
  createButton('Reset View').parent(sidebar).style('width','100%').style('margin-bottom','15px').mousePressed(resetView);

  saveButton = createButton('Save PNG').parent(sidebar).style('width', '100%').style('padding','10px').style('background','#333').style('color','#fff').style('border','none').style('cursor','pointer').mousePressed(saveHighRes);
  
  saveGifButton = createButton('Record GIF').parent(sidebar).style('width', '100%').style('margin-top','5px').style('padding','10px').style('display','none').mousePressed(saveAnimatedGif);

  updateCanvasSize();
  noLoop();
}

// ---------------------------------------------------------
// ACTION FUNCTIONS (PREVIEW, UNDO, RESET)
// ---------------------------------------------------------

function togglePreviewMode() {
  previewMode = !previewMode;
  previewToggleBtn.style('background', previewMode ? '#FFFF00' : '#E0E0E0');
  previewToggleBtn.html(previewMode ? 'Original' : 'Preview');
  requestRedraw();
}

function performResetAll() {
  // Reset checkboxes
  filmEnableCb.checked(false);
  rasterEnableCb.checked(false);
  
  // Hide panels
  filmPanel.style('display', 'none');
  rasterPanel.style('display', 'none');
  
  // Reset Sliders to defaults
  filmGrainSlider.value(50);
  filmIntensitySlider.value(100);
  densitySlider.value(10);
  sizeSlider.value(1.2);
  contrastSlider.value(1.5);
  
  // Reset Selects
  makerSelect.selected('Select Brand...');
  updateFilmOptions();
  rasterTypeSelect.selected('Dot Raster');
  onTypeChanged();
  
  // Reset view
  resetView();
  requestRedraw();
}

// Capture current settings into undoState
function captureState() {
  undoState = {
     filmEnabled: filmEnableCb.checked(),
     rasterEnabled: rasterEnableCb.checked(),
     maker: makerSelect.value(),
     stock: filmSelect.value(),
     grain: filmGrainSlider.value(),
     intensity: filmIntensitySlider.value(),
     rasterType: rasterTypeSelect.value(),
     density: densitySlider.value(),
     size: sizeSlider.value(),
     contrast: contrastSlider.value()
  };
}

function performUndo() {
  if (undoState) {
    filmEnableCb.checked(undoState.filmEnabled);
    rasterEnableCb.checked(undoState.rasterEnabled);
    
    // Update panel visibility
    if(undoState.filmEnabled) filmPanel.style('display', 'block'); else filmPanel.style('display', 'none');
    if(undoState.rasterEnabled) rasterPanel.style('display', 'block'); else rasterPanel.style('display', 'none');

    makerSelect.selected(undoState.maker);
    updateFilmOptions(); // Refresh stock list
    filmSelect.selected(undoState.stock);
    
    filmGrainSlider.value(undoState.grain);
    filmIntensitySlider.value(undoState.intensity);
    
    rasterTypeSelect.selected(undoState.rasterType);
    onTypeChanged();
    
    densitySlider.value(undoState.density);
    sizeSlider.value(undoState.size);
    contrastSlider.value(undoState.contrast);
    
    runFilmProcessing();
    requestRedraw();
  }
}


// ---------------------------------------------------------
// LOGIC: FILM EMULATION
// ---------------------------------------------------------
function updateFilmOptions() {
  let maker = makerSelect.value();
  filmSelect.elt.innerHTML = "";
  if (maker !== 'Select Brand...') { filmSelect.enable(); for (let s in filmLibrary[maker]) filmSelect.option(s); runFilmProcessing(); } 
  else { filmSelect.disable(); }
}

function runFilmProcessing() {
  if (!imgOriginal || !filmEnableCb || !filmEnableCb.checked()) return;
  filmStatusText.html('Rendering...');
  setTimeout(() => {
    let maker = makerSelect.value();
    let stockName = filmSelect.value();
    let recipe = (filmLibrary[maker] && filmLibrary[maker][stockName]) ? filmLibrary[maker][stockName] : null;
    let grainAmt = filmGrainSlider.value();
    let intensity = filmIntensitySlider.value() / 100.0;
    imgFiltered = processImageLogic(imgOriginal, recipe, grainAmt, intensity);
    filmStatusText.html('Ready');
    requestRedraw();
  }, 10);
}

// Pixel Processing Logic
function smoothstep(e0, e1, x) { let t = constrain((x - e0) / (e1 - e0), 0.0, 1.0); return t * t * (3.0 - 2.0 * t); }
function sCurve(x, k) { if (k === 0) return x; let v = 1.0/(1.0+Math.exp(-k*(x-0.5))); let mn = 1.0/(1.0+Math.exp(-k*(-0.5))); let mx = 1.0/(1.0+Math.exp(-k*(0.5))); return (v-mn)/(mx-mn); }

function processImageLogic(source, recipe, grainMult, intensity) {
  let output = source.get(); output.loadPixels();
  let amt = intensity; 
  let mBright = adj.bright; let mCont = 1.0 + (adj.contrast / 100.0); let mSat = 1.0 + (adj.sat / 100.0); let mWarm = adj.warmth;
  let useHalation = recipe && recipe.halation;

  for (let i = 0; i < output.pixels.length; i += 4) {
    let rOrig = output.pixels[i]/255.0; let gOrig = output.pixels[i+1]/255.0; let bOrig = output.pixels[i+2]/255.0;
    let r = rOrig, g = gOrig, b = bOrig;
    
    // 1. Aerochrome Special
    if (recipe && recipe.special === 'aerochrome_shader') {
        let maxVal = Math.max(r, Math.max(g, b)); let minVal = Math.min(r, Math.min(g, b));
        let delta = maxVal - minVal; let satMask = smoothstep(0.05, 0.15, delta);
        let greenBase = g - b; let redPenalty = Math.max(0.0, (r - g) * 2.0);
        let greenness = Math.max(0.0, greenBase - redPenalty);
        let shiftAmount = greenness * satMask;
        r = r + (shiftAmount * 3.5); g = g - (shiftAmount * 1.5); b = b - (shiftAmount * 0.2);
    }
    
    // 2. Film Recipe
    if (recipe && recipe.bw) { let lum = r * 0.299 + g * 0.587 + b * 0.114; r = g = b = lum; }
    if (recipe && recipe.curve > 0) { r = sCurve(r, recipe.curve * 5.0); g = sCurve(g, recipe.curve * 5.0); b = sCurve(b, recipe.curve * 5.0); }
    if (recipe && recipe.shift) { r = Math.pow(r, recipe.shift[0]); g = Math.pow(g, recipe.shift[1]); b = Math.pow(b, recipe.shift[2]); }
    if (recipe && !recipe.bw && recipe.sat !== 1.0) { let l = 0.299*r + 0.587*g + 0.114*b; r = l + (r - l) * recipe.sat; g = l + (g - l) * recipe.sat; b = l + (b - l) * recipe.sat; }
    if (recipe && recipe.black && recipe.white) { r = map(r, 0, 1, recipe.black[0]/255, recipe.white[0]/255); g = map(g, 0, 1, recipe.black[1]/255, recipe.white[1]/255); b = map(b, 0, 1, recipe.black[2]/255, recipe.white[2]/255); }
    
    // 3. Manual
    r += mBright/255.0; g += mBright/255.0; b += mBright/255.0;
    r = (r - 0.5) * mCont + 0.5; g = (g - 0.5) * mCont + 0.5; b = (b - 0.5) * mCont + 0.5;
    if(mSat !== 1.0) { let l = 0.299*r + 0.587*g + 0.114*b; r = l + (r - l) * mSat; g = l + (g - l) * mSat; b = l + (b - l) * mSat; }
    r += mWarm/255.0; b -= mWarm/255.0;

    // 4. Blend & Grain
    r = (r * amt) + (rOrig * (1.0 - amt)); g = (g * amt) + (gOrig * (1.0 - amt)); b = (b * amt) + (bOrig * (1.0 - amt));
    if (recipe) { 
        let finalGrain = (recipe.grain * (grainMult/50.0)) / 255.0; 
        if (finalGrain > 0) { let n = random(-finalGrain, finalGrain); r += n; g += n; b += n; } 
    }
    
    output.pixels[i] = constrain(r * 255, 0, 255); output.pixels[i+1] = constrain(g * 255, 0, 255); output.pixels[i+2] = constrain(b * 255, 0, 255);
  }
  output.updatePixels();
  return output;
}

// ---------------------------------------------------------
// LOGIC: RASTERIZER & RENDERERS
// ---------------------------------------------------------

// Helper to calculate geometry for both Simple and Raster renderers
function calculateGeometry(sourceImg, boxW, boxH, scaleFactor) {
  let imgAspect = sourceImg.width / sourceImg.height;
  let boxAspect = boxW / boxH;
  let drawW, drawH;
  if (imgAspect > boxAspect) { drawW = boxW; drawH = boxW / imgAspect; } 
  else { drawH = boxH; drawW = boxH * imgAspect; }
  
  let baseStartX = (boxW - drawW) / 2;
  let baseStartY = (boxH - drawH) / 2;
  
  return { drawW, drawH, baseStartX, baseStartY };
}

function renderSimple(target, sourceImg, boxW, boxH, label) {
  let geo = calculateGeometry(sourceImg, boxW, boxH, 1.0);
  
  target.push();
  // Apply transformations
  target.translate(geo.baseStartX, geo.baseStartY);
  target.translate(panX, panY); // User Pan
  target.scale(zoom); // User Zoom
  
  target.image(sourceImg, 0, 0, geo.drawW, geo.drawH);
  target.pop();

  // Overlay label
  if (label) {
    target.fill(0, 150); target.rect(0, height-20, width, 20);
    target.fill(255); target.textSize(10); target.textAlign(CENTER, CENTER);
    target.text(label, width/2, height-10);
  }
}

function renderRaster(target, sourceImg, scaleFactor, boxW, boxH, overrideInk, overrideBg) {
  let type = rasterTypeSelect.value();
  let density = densitySlider.value();
  let sizeMult = sizeSlider.value();
  let contrast = contrastSlider.value();
  
  let rInk, gInk, bInk, bgCol;
  if (overrideInk) { rInk = overrideInk.r; gInk = overrideInk.g; bInk = overrideInk.b; } 
  else { let c = getInkColor(); rInk = c.r; gInk = c.g; bInk = c.b; }
  
  if (overrideBg) { bgCol = color(overrideBg.r, overrideBg.g, overrideBg.b); } 
  else { bgCol = (type === 'Grainy Film' || type === 'Pulsing Halftone') ? color(20) : color(255); }

  let sliceEnabled = sliceEnableCb.checked();
  if (type === 'Pulsing Halftone') sliceEnabled = false; 
  let sliceCount = sliceCountSlider.value();
  let sliceH = sourceImg.height / sliceCount;
  let sliceW = sourceImg.width / sliceCount;
  let sliceYStart = sourceImg.height * sliceStartSlider.value();
  let sliceXStart = sourceImg.width * sliceStartSlider.value();

  let geo = calculateGeometry(sourceImg, boxW, boxH, scaleFactor);
  let effectivePanX = panX * scaleFactor;
  let effectivePanY = panY * scaleFactor;

  function getSourcePixel(cx, cy) {
      let relX = cx - (geo.baseStartX * scaleFactor) - effectivePanX;
      let relY = cy - (geo.baseStartY * scaleFactor) - effectivePanY;
      let sx = map(relX, 0, geo.drawW * scaleFactor * zoom, 0, sourceImg.width);
      let sy = map(relY, 0, geo.drawH * scaleFactor * zoom, 0, sourceImg.height);
      return { x: sx, y: sy };
  }

  sourceImg.loadPixels();
  target.background(bgCol); target.noStroke();

  if (type === 'Dot Raster') {
    let effectiveGrid = density * scaleFactor;
    let dotAlpha = map(contrast, 0.1, 5.0, 25, 255);
    target.fill(rInk, gInk, bInk, dotAlpha);
    let minDotSize = effectiveGrid * 0.05;
    for (let y = 0; y < boxH; y += effectiveGrid) {
      for (let x = 0; x < boxW; x += effectiveGrid) {
        let coord = getSourcePixel(x, y); let sx = coord.x; let sy = coord.y;
        if (sliceEnabled) sx = sliceXStart + (sx % sliceW); 
        if (sx >= 0 && sx < sourceImg.width && sy >= 0 && sy < sourceImg.height) {
            let idx = (floor(sx) + floor(sy) * sourceImg.width) * 4;
            let bright = (sourceImg.pixels[idx]*0.299 + sourceImg.pixels[idx+1]*0.587 + sourceImg.pixels[idx+2]*0.114);
            let dia = map(bright, 255, 0, minDotSize, effectiveGrid) * sizeMult;
            if (dia > 0.5 * scaleFactor) target.circle(x + effectiveGrid/2, y + effectiveGrid/2, dia);
        }
      }
    }
  } 
  else if (type === 'Grainy Film') {
     target.fill(rInk, gInk, bInk); target.loadPixels(); 
     let grainAmount = map(density, 2, 15, 10, 100); let rBg = red(bgCol); let gBg = green(bgCol); let bBg = blue(bgCol);
     for (let y = 0; y < boxH; y++) {
      for (let x = 0; x < boxW; x++) {
        let coord = getSourcePixel(x, y); let sx = coord.x; let sy = coord.y;
        if (sliceEnabled) sx = sliceXStart + (sx % sliceW);
        if (sx >= 0 && sx < sourceImg.width && sy >= 0 && sy < sourceImg.height) {
            let idx = (floor(sx) + floor(sy) * sourceImg.width) * 4;
            let val = (sourceImg.pixels[idx]*0.299 + sourceImg.pixels[idx+1]*0.587 + sourceImg.pixels[idx+2]*0.114) / 255.0;
            val = (val - 0.5) * contrast + 0.5;
            val = (val * 255) + random(-grainAmount, grainAmount);
            val = constrain(val, 15, 240);
            let ratio = 1.0 - (val / 255.0); 
            let dIdx = (x + y * target.width) * 4;
            target.pixels[dIdx] = rInk * ratio + rBg * (1-ratio);
            target.pixels[dIdx+1] = gInk * ratio + gBg * (1-ratio);
            target.pixels[dIdx+2] = bInk * ratio + bBg * (1-ratio);
            target.pixels[dIdx+3] = 255;
        }
      }
     }
     target.updatePixels();
  } 
  else if (type === 'Pattern Raster') {
    let effectiveGrid = density * scaleFactor;
    for (let y = 0; y < boxH; y += effectiveGrid) {
      for (let x = 0; x < boxW; x += effectiveGrid) {
        let coord = getSourcePixel(x, y); let sx = coord.x; let sy = coord.y;
        if (sliceEnabled) sx = sliceXStart + (sx % sliceW);
        if (sx >= 0 && sx < sourceImg.width && sy >= 0 && sy < sourceImg.height) {
            let sampleW = effectiveGrid * (sourceImg.width / (geo.drawW * scaleFactor * zoom));
            let avg = getAverageGray(sourceImg, floor(sx), floor(sy), sampleW);
            avg = constrain(avg * contrast, 0, 255);
            drawPatternTexture(target, x, y, effectiveGrid, avg, rInk, gInk, bInk);
        }
      }
    }
  } 
  else if (type === 'Text Raster') {
    let effectiveGrid = density * scaleFactor;
    target.fill(rInk, gInk, bInk); if(font) target.textFont(font); target.textAlign(CENTER, CENTER);
    let txt = rasterTextInput.value() || "TYPE"; let charIndex = 0;
    for (let y = 0; y < boxH; y += effectiveGrid) {
      for (let x = 0; x < boxW; x += effectiveGrid) {
        let coord = getSourcePixel(x, y); let sx = coord.x; let sy = coord.y;
        if (sliceEnabled) sx = sliceXStart + (sx % sliceW);
        if (sx >= 0 && sx < sourceImg.width && sy >= 0 && sy < sourceImg.height) {
            let sampleW = effectiveGrid * (sourceImg.width / (geo.drawW * scaleFactor * zoom));
            let bright = getAverageGray(sourceImg, floor(sx), floor(sy), sampleW);
            let tSize = map(bright, 0, 255, 1*sizeMult, effectiveGrid*1.5*sizeMult) * contrast;
            target.textSize(tSize);
            target.text(txt.charAt(charIndex % txt.length), x + effectiveGrid/2, y + effectiveGrid/2);
            charIndex++;
        }
      }
    }
  } 
  else if (type === 'Pulsing Halftone') {
      let effectiveGrid = density * scaleFactor; let colW = boxW / 3; let blendZone = effectiveGrid * 10;
      let pulse = map(sin(frameCount * 0.1), -1, 1, 2, 6);
      for (let y = 0; y < boxH; y += effectiveGrid) {
       for (let x = 0; x < boxW; x += effectiveGrid) {
        let coord = getSourcePixel(x, y); let sx = coord.x; let sy = coord.y;
        if (sx >= 0 && sx < sourceImg.width && sy >= 0 && sy < sourceImg.height) {
            let idx = (floor(sx) + floor(sy) * sourceImg.width) * 4;
            let bright = (sourceImg.pixels[idx]*0.299 + sourceImg.pixels[idx+1]*0.587 + sourceImg.pixels[idx+2]*0.114);
            let dotColor;
            if (x < colW - blendZone) dotColor = pColor1;
            else if (x < colW + blendZone) dotColor = lerpColor(pColor1, pColor2, map(x, colW - blendZone, colW + blendZone, 0, 1, true));
            else if (x < colW * 2 - blendZone) dotColor = pColor2;
            else if (x < colW * 2 + blendZone) dotColor = lerpColor(pColor2, pColor3, map(x, colW * 2 - blendZone, colW * 2 + blendZone, 0, 1, true));
            else dotColor = pColor3;
            target.fill(dotColor);
            target.circle(x + effectiveGrid/2, y + effectiveGrid/2, map(bright, 0, 255, 0, effectiveGrid * 0.7) * pulse * sizeMult * 0.5);
        }
       }
      }
  } 
  else if (type === 'Wavy Distortion') {
     target.loadPixels();
     let noiseScale = map(density, 2, 60, 0.002, 0.05); let distMax = map(contrast, 0.1, 5.0, 0, 100); let phase = sizeMult * 10;
     for (let y = 0; y < boxH; y++) {
      for (let x = 0; x < boxW; x++) {
        let nX = noise(x * noiseScale + phase, y * noiseScale);
        let nY = noise(x * noiseScale, y * noiseScale + phase + 100);
        let coord = getSourcePixel(x - map(nX, 0, 1, -distMax, distMax), y - map(nY, 0, 1, -distMax, distMax));
        let sx = coord.x; let sy = coord.y;
        if (sliceEnabled) sx = sliceXStart + (sx % sliceW);
        if (sx >= 0 && sx < sourceImg.width && sy >= 0 && sy < sourceImg.height) {
             let sIdx = (floor(sx) + floor(sy) * sourceImg.width) * 4;
             let dIdx = (x + y * target.width) * 4;
             target.pixels[dIdx] = sourceImg.pixels[sIdx]; target.pixels[dIdx+1] = sourceImg.pixels[sIdx+1]; target.pixels[dIdx+2] = sourceImg.pixels[sIdx+2]; target.pixels[dIdx+3] = 255;
        }
      }
     }
     target.updatePixels();
  }
}

// ---------------------------------------------------------
// UTILS
// ---------------------------------------------------------
function updateCanvasSize() {
  let mode = formatSelect.value();
  let maxDim = MAX_PREVIEW_SIZE; 
  if (mode === '1:1 (Square)') { currentW = maxDim; currentH = maxDim; } 
  else if (mode === '2:3 (Portrait)') { currentH = maxDim; currentW = floor(maxDim * (2/3)); } 
  else if (mode === '3:2 (Landscape)') { currentW = maxDim; currentH = floor(maxDim * (2/3)); }
  else if (mode === '16:9 (Landscape)') { currentW = maxDim; currentH = floor(maxDim * (9/16)); }
  resizeCanvas(currentW, currentH);
  background(240);
  
  if (!imgOriginal) {
    stroke(200); strokeWeight(2); drawingContext.setLineDash([10, 10]); noFill();
    rect(10, 10, width - 20, height - 20, 10); drawingContext.setLineDash([]); 
    fill(100); noStroke(); textSize(14); textFont('Helvetica');
    text("DROP IMAGE", width/2, height/2);
  } else {
    requestRedraw();
  }
}

function handleFile(file) {
  if (file.type === 'image') {
    loadImage(file.data, (img) => { 
      imgOriginal = img;
      zoom = 1.0; panX = 0; panY = 0;
      requestRedraw();
    });
  }
}

function mouseWheel(event) {
  if (appState === 1 && mouseX > SIDEBAR_WIDTH + GAP && mouseX < width && mouseY > 0 && mouseY < height) {
    let sens = 0.001; let oldZoom = zoom;
    zoom -= event.delta * sens * zoom; zoom = constrain(zoom, 0.1, 10.0);
    let scaleChange = zoom - oldZoom;
    panX -= (mouseX - (20 + SIDEBAR_WIDTH + GAP) - panX) * (scaleChange / oldZoom);
    panY -= (mouseY - 20 - panY) * (scaleChange / oldZoom);
    requestRedraw();
    return false;
  }
}

function applyButtonZoom(factor) {
    if (!imgOriginal) return;
    let oldZoom = zoom; zoom *= factor; zoom = constrain(zoom, 0.1, 10.0);
    let scaleChange = zoom - oldZoom;
    let cx = width / 2; let cy = height / 2;
    panX -= (cx - panX) * (scaleChange / oldZoom); panY -= (cy - panY) * (scaleChange / oldZoom);
    requestRedraw();
}

function canvasPressed() { if (appState === 1 && imgOriginal) { isDragging = true; startDragX = mouseX; startDragY = mouseY; startPanX = panX; startPanY = panY; cursor('grabbing'); } }
function canvasReleased() { isDragging = false; cursor('default'); }
function mouseDragged() { if (appState === 1 && isDragging && imgOriginal) { panX = startPanX + (mouseX - startDragX); panY = startPanY + (mouseY - startDragY); requestRedraw(); } }
function resetView() { zoom = 1.0; panX = 0; panY = 0; requestRedraw(); }

function makeControl(label, min, max, val, step, parent, callback) {
  let wrap = createDiv().parent(parent).style('margin-bottom','5px');
  let row = createDiv('').parent(wrap).style('display', 'flex').style('justify-content','space-between').style('font-size','10px');
  createSpan(label).parent(row); 
  let sld = createSlider(min, max, val, step).parent(wrap).style('width', '100%');
  // For Undo: Capture state when user starts dragging
  sld.mousePressed(captureState);
  sld.input(callback);
  return sld;
}

function onTypeChanged() {
  let type = rasterTypeSelect.value();
  rasterTextInput.style('display', (type === 'Text Raster') ? 'block' : 'none');
  if (type === 'Pulsing Halftone') { saveButton.hide(); saveGifButton.show(); loop(); } 
  else { saveButton.show(); saveGifButton.hide(); noLoop(); }
  if (type !== 'Pulsing Halftone') redraw();
}

function requestRedraw() { if (rasterTypeSelect.value() !== 'Pulsing Halftone') redraw(); }
function getInkColor() { let c = inkColorPicker.color(); return {r: red(c), g: green(c), b: blue(c)}; }

function getAverageGray(img, ix, iy, sampleSize) {
  if (sampleSize < 1.5) {
      let idx = (ix + iy * img.width) * 4;
      return (img.pixels[idx]*0.299 + img.pixels[idx+1]*0.587 + img.pixels[idx+2]*0.114);
  }
  let sum = 0, count = 0; let half = floor(sampleSize/2); let step = (sampleSize>5)?2:1;
  for (let y = max(0,iy-half); y < min(img.height,iy+half); y+=step) {
    for (let x = max(0,ix-half); x < min(img.width,ix+half); x+=step) {
      let idx = (x + y * img.width) * 4;
      sum += (img.pixels[idx]*0.299 + img.pixels[idx+1]*0.587 + img.pixels[idx+2]*0.114); count++;
    }
  }
  return (count > 0) ? sum/count : 0;
}

function drawPatternTexture(target, x, y, size, grayValue, r, g, b) {
    target.push(); target.translate(x, y); target.fill(r, g, b); target.stroke(r, g, b);
    const step = 255 / 6; const level = floor(grayValue / step); const lineW = size / 10;
    switch (level) {
        case 0: target.noStroke(); target.rect(0, 0, size, size); break;
        case 1: target.strokeWeight(lineW / 2); for (let i = 0; i < 8; i++) { target.line(i * size/8, 0, 0, i * size/8); target.line(i * size/8, size, size, i * size/8); } break;
        case 2: target.strokeWeight(lineW / 2); for (let i = -1; i < 8; i++) { target.line(i * size/6, 0, 0, i * size/6); } break;
        case 3: target.strokeWeight(lineW / 2); for (let i = -1; i < 6; i++) { target.line(i * size/4, 0, 0, i * size/4); } break;
        case 4: target.noStroke(); let s = size / 4; target.rect(0, 0, s, s); target.rect(s * 3, 0, s, s); target.rect(0, s * 3, s, s); target.rect(s * 3, s * 3, s, s); break;
        case 5: target.noStroke(); target.rect(size/2 - lineW/2, size/2 - lineW/2, lineW, lineW); break;
    }
    target.pop(); 
}

function saveHighRes() {
  if (!imgOriginal) return;
  // DETERMINE SOURCE
  let source = (filmEnableCb.checked() && imgFiltered) ? imgFiltered : imgOriginal;
  let exportScale = 2400 / currentW; 
  let singleW = currentW * exportScale; let singleH = currentH * exportScale;
  
  if (warholCb.checked() && rasterEnableCb.checked()) {
    let finalPG = createGraphics(singleW * 2, singleH * 2); finalPG.pixelDensity(1); finalPG.background(255);
    let pals = [ { i: {r:255,g:0,b:255}, b: {r:255,g:255,b:0} }, { i: {r:0,g:255,b:255}, b: {r:255,g:0,b:0} }, { i: {r:0,g:255,b:0}, b: {r:128,g:0,b:128} }, { i: {r:255,g:255,b:0}, b: {r:0,g:0,b:255} } ];
    pals = shuffle(pals);
    let pg = createGraphics(singleW, singleH); pg.pixelDensity(1);
    renderRaster(pg, source, exportScale, singleW, singleH, pals[0].i, pals[0].b); finalPG.image(pg, 0, 0);
    renderRaster(pg, source, exportScale, singleW, singleH, pals[1].i, pals[1].b); finalPG.image(pg, singleW, 0);
    renderRaster(pg, source, exportScale, singleW, singleH, pals[2].i, pals[2].b); finalPG.image(pg, 0, singleH);
    renderRaster(pg, source, exportScale, singleW, singleH, pals[3].i, pals[3].b); finalPG.image(pg, singleW, singleH);
    save(finalPG, 'warhol-grid.png');
  } else {
    let pg = createGraphics(singleW, singleH); pg.pixelDensity(1);
    if(rasterEnableCb.checked()) renderRaster(pg, source, exportScale, singleW, singleH, null, null);
    else renderSimple(pg, source, singleW, singleH);
    save(pg, 'export.png');
  }
}

function saveAnimatedGif() { saveGif('pulsing_raster', 5); }