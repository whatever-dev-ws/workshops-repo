//WUP 2025-26
//Sara Gomizel

let font;
let appState = 0; // 0 = Start Screen, 1 = Main App

// --- VARIABLES FOR PART 1 (START SCREEN) ---
let startButton;
let t = 0;              
const GRID_SPACING = 20;    
const DISTORTION_FORCE = 40; 
const ANIMATION_SPEED = 0.005; 

// --- VARIABLES FOR PART 2 (RASTERIZER) ---
let img;
let cnv; 

// UI Globals
let formatSelect; 
let rasterTypeSelect;
let rasterTextInput; 
let densitySlider, sizeSlider, contrastSlider;

// Color UI Containers
let singleColorContainer; 
let pulseColorContainer;  
// CHANGED: New checkbox variable
let originalColorCb; 

let inkColorPicker; 
let pPicker1, pPicker2, pPicker3; 

let warholCb;
let sliceEnableCb, sliceDirSelect, sliceStartSlider, sliceCountSlider;

// Buttons
let saveButton;     
let saveGifButton;  

// Layout Constants
const MAX_PREVIEW_SIZE = 400; 
const SIDEBAR_WIDTH = 240;
const GAP = 20;

let currentW = 250;
let currentH = 250;

function preload() {
  font = loadFont('https://raw.githubusercontent.com/google/fonts/main/ofl/pressstart2p/PressStart2P-Regular.ttf');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  setupStartButton();
  textAlign(CENTER, CENTER);
  frameRate(60); 
}

function draw() {
  if (appState === 0) {
    // --- DRAW START SCREEN ---
    background(255); 
    drawWavyGrid();
    drawStartUI();
  } else {
    // --- DRAW MAIN APP ---
    if (!img) return;
    render(this, 1.0, width, height, null, null);
  }
}

// ---------------------------------------------------------
// PART 1: START SCREEN FUNCTIONS
// ---------------------------------------------------------

function setupStartButton() {
  startButton = createButton('START');
  startButton.style('font-size', '20px');
  startButton.style('padding', '15px 40px');
  startButton.style('background-color', '#000000');
  startButton.style('color', '#FFFFFF');
  startButton.style('border', 'none');
  startButton.style('border-radius', '0px'); 
  startButton.style('cursor', 'pointer');
  startButton.style('font-family', '"Courier New", monospace'); 
  startButton.position(width / 2 - 60, height / 2 + 80);
  startButton.mousePressed(launchMainApp);
}

function launchMainApp() {
  startButton.remove();
  appState = 1;
  background(240);
  setupMainAppInterface();
}

function drawWavyGrid() {
  stroke(0, 50); 
  noFill();
  strokeWeight(1);
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
  textFont(font);
  textSize(45);
  text('THE BEST', width / 2, height / 2 - 60);
  textSize(20);
  text('Image Rasterizer', width / 2, height / 2 + 10);
  
  startButton.position(width / 2 - startButton.size().width / 2, height / 2 + 80);
}


// ---------------------------------------------------------
// PART 2: MAIN APP LOGIC & INTERFACE
// ---------------------------------------------------------

function setupMainAppInterface() {
  let sidebar = createDiv();
  sidebar.position(20, 20);
  sidebar.style('width', SIDEBAR_WIDTH + 'px');
  sidebar.style('max-height', (windowHeight - 40) + 'px');
  sidebar.style('overflow-y', 'auto');
  sidebar.style('background-color', '#f4f4f4');
  sidebar.style('padding', '15px');
  sidebar.style('font-family', '"Courier New", monospace');
  sidebar.style('box-sizing', 'border-box');

  cnv = createCanvas(currentW, currentH);
  cnv.position(20 + SIDEBAR_WIDTH + GAP, 20);
  pixelDensity(1); 
  noSmooth();

  // --- UI CONSTRUCTION ---
  
  // A. Format
  createSpan('<b>1. Canvas Format</b>').parent(sidebar);
  formatSelect = createSelect();
  formatSelect.parent(sidebar);
  formatSelect.option('1:1 (Square)');
  formatSelect.option('2:3 (Portrait)');
  formatSelect.option('3:2 (Landscape)');
  formatSelect.option('16:9 (Landscape)');
  formatSelect.option('9:16 (Portrait)');
  formatSelect.style('width', '100%');
  formatSelect.style('margin-top', '5px');
  formatSelect.style('font-family', 'monospace');
  formatSelect.changed(updateCanvasSize); 
  createDiv('').parent(sidebar).style('height','20px');

  // B. File Input
  createSpan('<b>2. Upload Image</b>').parent(sidebar);
  createDiv('').parent(sidebar).style('height','5px');
  let fileInput = createFileInput(handleFile);
  fileInput.parent(sidebar);
  fileInput.style('width', '100%');
  createDiv('').parent(sidebar).style('height','20px');

  // C. Raster Style
  createSpan('<b>3. Raster Style</b>').parent(sidebar);
  createDiv('').parent(sidebar).style('height','5px');
  rasterTypeSelect = createSelect();
  rasterTypeSelect.parent(sidebar);
  rasterTypeSelect.option('Dot Raster');        
  rasterTypeSelect.option('Line Raster'); 
  rasterTypeSelect.option('Pattern Raster');    
  rasterTypeSelect.option('Text Raster'); 
  rasterTypeSelect.option('Pulsing Halftone');
  rasterTypeSelect.option('Pixelate (Color)');
  rasterTypeSelect.style('width', '100%');
  rasterTypeSelect.style('padding', '5px');
  rasterTypeSelect.style('font-family', 'monospace');
  rasterTypeSelect.changed(onTypeChanged); 

  // Text Input
  rasterTextInput = createInput('');
  rasterTextInput.parent(sidebar);
  rasterTextInput.attribute('placeholder', 'Type characters...');
  rasterTextInput.style('width', '90%');
  rasterTextInput.style('padding', '5px');
  rasterTextInput.style('margin-top', '5px');
  rasterTextInput.style('font-family', 'monospace');
  rasterTextInput.style('display', 'none'); 
  rasterTextInput.input(requestRedraw);
  createDiv('').parent(sidebar).style('height','15px');

  // D. Sliders
  densitySlider = makeControl('Density / Frequency', 2, 60, 10, 1, sidebar);
  createDiv('').parent(sidebar).style('height','10px');

  sizeSlider = makeControl('Size / Phase', 0.1, 10.0, 1.2, 0.1, sidebar);
  createDiv('').parent(sidebar).style('height','10px');

  contrastSlider = makeControl('Contrast / Strength', 0.1, 5.0, 1.5, 0.1, sidebar);
  createDiv('').parent(sidebar).style('height','10px');

  // E. Color System
  createSpan('Ink Colors').parent(sidebar).style('font-size','12px');
  
  // -- CHANGED: Original Color Checkbox --
  let ocBox = createDiv().parent(sidebar).style('margin-top','5px');
  originalColorCb = createCheckbox(' Use Original Colors', false);
  originalColorCb.parent(ocBox);
  originalColorCb.style('font-size', '11px');
  originalColorCb.changed(() => {
    onTypeChanged(); 
    requestRedraw();
  });
  createDiv('Raster elements use image colors.').parent(ocBox)
     .style('font-size','9px').style('color','#666').style('margin-left','20px');


  // -- Container 1: Single Color
  singleColorContainer = createDiv().parent(sidebar);
  singleColorContainer.style('margin-top', '5px');
  inkColorPicker = createColorPicker('#000000');
  inkColorPicker.parent(singleColorContainer);
  inkColorPicker.style('width', '100%');
  inkColorPicker.style('height', '30px');
  inkColorPicker.style('cursor', 'pointer');
  inkColorPicker.input(requestRedraw);

  // -- Container 2: Three Colors
  pulseColorContainer = createDiv().parent(sidebar);
  pulseColorContainer.style('margin-top', '5px');
  pulseColorContainer.style('display', 'none'); 

  function makeLabeledPicker(label, defaultHex, parent) {
      let box = createDiv().parent(parent).style('display','flex').style('align-items','center').style('margin-bottom','4px');
      createSpan(label).parent(box).style('width','50px').style('font-size','10px');
      let p = createColorPicker(defaultHex).parent(box);
      p.style('flex-grow','1').style('height','25px');
      return p;
  }

  pPicker1 = makeLabeledPicker("Left", "#99FF00", pulseColorContainer);
  pPicker2 = makeLabeledPicker("Center", "#FFFF00", pulseColorContainer);
  pPicker3 = makeLabeledPicker("Right", "#FF8C00", pulseColorContainer);

  createDiv('').parent(sidebar).style('height','20px');

  // F. Special Modes
  createSpan('<b>4. Special Modes</b>').parent(sidebar);
  let specialBox = createDiv().parent(sidebar);
  specialBox.style('border-top', '1px solid #ccc');
  specialBox.style('padding-top', '10px');
  specialBox.style('margin-top', '5px');
  
  warholCb = createCheckbox(' Andy Warhol Mode', false);
  warholCb.parent(specialBox);
  warholCb.style('font-size', '11px'); 
  createDiv('Pop Art colors (Static modes only).').parent(specialBox)
    .style('font-size','9px').style('color','#666').style('margin-left','20px');

  createDiv('').parent(sidebar).style('height','20px');
  
  // G. Slice & Repeat
  createSpan('<b>5. Slice & Repeat</b>').parent(sidebar);
  let sliceBox = createDiv().parent(sidebar);
  sliceBox.style('border-top', '1px solid #ccc');
  sliceBox.style('padding-top', '10px');
  sliceBox.style('margin-top', '5px');

  sliceEnableCb = createCheckbox(' Enable Slice', false);
  sliceEnableCb.parent(sliceBox);
  sliceEnableCb.style('font-size', '11px');
  sliceEnableCb.changed(requestRedraw);
  createDiv('').parent(sliceBox).style('height','10px');

  sliceDirSelect = createSelect();
  sliceDirSelect.parent(sliceBox);
  sliceDirSelect.option('Vertical (Repeat rows)');
  sliceDirSelect.option('Horizontal (Repeat cols)');
  sliceDirSelect.style('width', '100%');
  sliceDirSelect.style('margin', '5px 0');
  sliceDirSelect.style('font-family', 'monospace');
  sliceDirSelect.changed(requestRedraw);

  sliceCountSlider = makeControl('Number of Slices', 1, 10, 2, 1, sliceBox);
  createDiv('').parent(sliceBox).style('height','10px');
  sliceStartSlider = makeControl('Slice Offset', 0.0, 0.99, 0.0, 0.01, sliceBox);

  createDiv('').parent(sidebar).style('height','25px');

  // H. Save Buttons
  saveButton = createButton('<b>Save High-Res PNG</b>');
  saveButton.parent(sidebar);
  saveButton.style('width', '100%');
  saveButton.style('padding', '10px');
  saveButton.style('background', '#2196F3');
  saveButton.style('color', 'white');
  saveButton.style('border', 'none');
  saveButton.style('cursor', 'pointer');
  saveButton.style('font-family', 'monospace');
  saveButton.mousePressed(saveHighRes);

  saveGifButton = createButton('<b>Record GIF (5 sec)</b>');
  saveGifButton.parent(sidebar);
  saveGifButton.style('width', '100%');
  saveGifButton.style('padding', '10px');
  saveGifButton.style('background', '#FF5722'); 
  saveGifButton.style('color', 'white');
  saveGifButton.style('border', 'none');
  saveGifButton.style('cursor', 'pointer');
  saveGifButton.style('font-family', 'monospace');
  saveGifButton.style('display', 'none'); 
  saveGifButton.mousePressed(saveAnimatedGif);

  updateCanvasSize();
  
  noLoop();
}

function updateCanvasSize() {
  let mode = formatSelect.value();
  let maxDim = MAX_PREVIEW_SIZE; 

  if (mode === '1:1 (Square)') {
    currentW = maxDim; currentH = maxDim;
  } 
  else if (mode === '2:3 (Portrait)') {
    currentH = maxDim; currentW = Math.floor(maxDim * (2/3)); 
  } 
  else if (mode === '3:2 (Landscape)') {
    currentW = maxDim; currentH = Math.floor(maxDim * (2/3)); 
  }
  else if (mode === '16:9 (Landscape)') {
    currentW = maxDim; currentH = Math.floor(maxDim * (9/16)); 
  }
  else if (mode === '9:16 (Portrait)') {
    currentH = maxDim; currentW = Math.floor(maxDim * (9/16));
  }
  
  resizeCanvas(currentW, currentH);
  background(240);
  if (!img) {
    fill(0); textAlign(CENTER, CENTER);
    textFont(font); 
    textSize(15);
    text("Upload Image", width/2, height/2);
  } else {
    if (rasterTypeSelect.value() === 'Pulsing Halftone') {
      loop();
    } else {
      redraw();
    }
  }
}

function makeControl(label, min, max, val, step, parent) {
  createSpan(label).parent(parent).style('font-size','12px');
  let box = createDiv().parent(parent).style('display', 'flex').style('align-items', 'center').style('margin-top', '2px');
  let btnMinus = createButton('-').parent(box).style('width', '25px').style('cursor', 'pointer').style('font-family', 'monospace');
  let sld = createSlider(min, max, val, step).parent(box).style('flex-grow', '1').style('margin', '0 5px');
  let btnPlus = createButton('+').parent(box).style('width', '25px').style('cursor', 'pointer').style('font-family', 'monospace');
  btnMinus.mousePressed(() => { sld.value(sld.value() - step); requestRedraw(); });
  btnPlus.mousePressed(() => { sld.value(sld.value() + step); requestRedraw(); });
  sld.input(requestRedraw);
  return sld;
}

function onTypeChanged() {
  let type = rasterTypeSelect.value();
  // CHANGED: Check new checkbox variable
  let useOriginal = originalColorCb.checked();

  // 1. Text Input Visibility
  if (type === 'Text Raster') {
    rasterTextInput.style('display', 'block');
  } else {
    rasterTextInput.style('display', 'none');
  }

  // 2. Manage Color Pickers & Animation
  if (type === 'Pulsing Halftone') {
    saveButton.style('display', 'none');     
    saveGifButton.style('display', 'block');
    
    singleColorContainer.style('display', 'none');
    pulseColorContainer.style('display', 'block');
    
    loop(); 

  } else if (type === 'Pixelate (Color)') {
    saveButton.style('display', 'block');    
    saveGifButton.style('display', 'none');
    
    // Hide pickers (Pixelate always uses original colors)
    singleColorContainer.style('display', 'none');
    pulseColorContainer.style('display', 'none');
    
    noLoop();

  } else {
    // Dot, Line, Pattern, Text
    saveButton.style('display', 'block');    
    saveGifButton.style('display', 'none');
    
    pulseColorContainer.style('display', 'none');

    // CHANGED: Hide single picker if using original colors
    if (useOriginal) {
        singleColorContainer.style('display', 'none');
    } else {
        singleColorContainer.style('display', 'block');
    }
    
    noLoop(); 
  }
  
  // 3. Defaults
  if (type === 'Dot Raster') {
    if(!useOriginal) inkColorPicker.value('#000000');
    contrastSlider.value(5.0); 
    densitySlider.value(6);
  } else if (type === 'Line Raster') {
    if(!useOriginal) inkColorPicker.value('#000000');
    contrastSlider.value(1.0); 
    densitySlider.value(8); 
  } else if (type === 'Pattern Raster') {
    if(!useOriginal) inkColorPicker.value('#000000');
    contrastSlider.value(1.0);
    densitySlider.value(15); 
  } else if (type === 'Text Raster') {
    if(!useOriginal) inkColorPicker.value('#000000');
    densitySlider.value(12);
    contrastSlider.value(1.0);
  } else if (type === 'Pulsing Halftone') {
    densitySlider.value(8);
    contrastSlider.value(1.0);
  } else if (type === 'Pixelate (Color)') {
    densitySlider.value(10);
    sizeSlider.value(1.0); 
    contrastSlider.value(1.2); 
  }

  if (type !== 'Pulsing Halftone') redraw();
}

function requestRedraw() { 
  if (rasterTypeSelect.value() !== 'Pulsing Halftone') {
      redraw(); 
  }
}

// Used primarily for hardcoded Warhol palettes now
function getRGB(name) {
  if (name === 'Black') return {r:0, g:0, b:0};
  if (name === 'White') return {r:255, g:255, b:255};
  if (name === 'Red') return {r:255, g:0, b:0};
  if (name === 'Blue') return {r:0, g:0, b:255};
  if (name === 'Cyan') return {r:0, g:255, b:255};
  if (name === 'Magenta') return {r:255, g:0, b:255};
  if (name === 'Yellow') return {r:255, g:255, b:0};
  if (name === 'Green') return {r:0, g:255, b:0};
  if (name === 'Purple') return {r:128, g:0, b:128};
  if (name === 'Orange') return {r:255, g:165, b:0};
  return {r:0, g:0, b:0};
}

/**
 * MAIN RENDER FUNCTION
 */
function render(target, scaleFactor, boxW, boxH, overrideInk, overrideBg) {
  let type = rasterTypeSelect.value();
  // CHANGED: Check new checkbox
  let useOriginalCol = originalColorCb.checked();
  
  let density = densitySlider.value();
  let sizeMult = sizeSlider.value();
  let contrast = contrastSlider.value();
  
  // Determine BG Color
  let bgCol; 
  if (overrideBg) {
    bgCol = color(overrideBg.r, overrideBg.g, overrideBg.b);
  } else {
    if (type === 'Pulsing Halftone') {
        bgCol = color(20);
    } else {
        bgCol = color(255); 
    }
  }

  // Slicing Logic
  let sliceEnabled = sliceEnableCb.checked();
  if (type === 'Pulsing Halftone') sliceEnabled = false; 

  let sliceVertical = sliceDirSelect.value().startsWith('Vertical');
  let sliceCount = sliceCountSlider.value();
  let sliceSizePct = 1.0 / sliceCount; 
  let sliceStartPct = sliceStartSlider.value();

  let imgAspect = img.width / img.height;
  let boxAspect = boxW / boxH;
  let drawW, drawH;
  if (imgAspect > boxAspect) { drawW = boxW; drawH = boxW / imgAspect; } 
  else { drawH = boxH; drawW = boxH * imgAspect; }
  let startX = (boxW - drawW) / 2;
  let startY = (boxH - drawH) / 2;

  let sliceW = img.width * sliceSizePct;
  let sliceH = img.height * sliceSizePct;
  let sliceXStart = img.width * sliceStartPct;
  let sliceYStart = img.height * sliceStartPct;

  img.loadPixels();
  
  target.background(bgCol); 
  target.noStroke();

  // 1. --- DOT RASTER ---
  if (type === 'Dot Raster') {
    let effectiveGrid = density * scaleFactor;
    let minDotSize = effectiveGrid * 0.05;
    
    // Pre-fetch picker color if needed
    let pickerC = inkColorPicker.color();
    let pickerR=red(pickerC), pickerG=green(pickerC), pickerB=blue(pickerC);

    for (let y = 0; y < drawH; y += effectiveGrid) {
      for (let x = 0; x < drawW; x += effectiveGrid) {
        
        let sx = map(x, 0, drawW, 0, img.width);
        let sy = map(y, 0, drawH, 0, img.height);
        if (sliceEnabled) {
          if (sliceVertical) sy = sliceYStart + (sy % sliceH);
          else sx = sliceXStart + (sx % sliceW);
        }
        let ix = floor(constrain(sx, 0, img.width-1));
        let iy = floor(constrain(sy, 0, img.height-1));
        
        // CHANGED: Determine Color per dot
        let rInk, gInk, bInk;
        if (overrideInk) {
             rInk=overrideInk.r; gInk=overrideInk.g; bInk=overrideInk.b;
        } else if (useOriginalCol) {
             // Sample average color of the area
             let sampleW = effectiveGrid * (img.width / drawW);
             let cImg = getAverageRGBFromImage(ix, iy, sampleW);
             rInk = cImg.r; gInk = cImg.g; bInk = cImg.b;
        } else {
             rInk = pickerR; gInk = pickerG; bInk = pickerB;
        }

        // Brightness for size
        let idx = (ix + iy * img.width) * 4;
        let r = img.pixels[idx];
        let g = img.pixels[idx+1];
        let b = img.pixels[idx+2];
        let bright = (r*0.299 + g*0.587 + b*0.114);
        
        let dotAlpha = map(contrast, 0.1, 5.0, 25, 255);
        target.fill(rInk, gInk, bInk, dotAlpha);

        let diameter = map(bright, 255, 0, minDotSize, effectiveGrid) * sizeMult;
        if (diameter > 0.5 * scaleFactor) {
          target.circle(startX + x + effectiveGrid/2, startY + y + effectiveGrid/2, diameter);
        }
      }
    }

  // 2. --- LINE RASTER ---
  } else if (type === 'Line Raster') {
    let effectiveGrid = density * scaleFactor;
    
    // Pre-fetch picker color if needed
    let pickerC = inkColorPicker.color();
    let pickerR=red(pickerC), pickerG=green(pickerC), pickerB=blue(pickerC);
    
    for (let y = 0; y < drawH; y += effectiveGrid) {
      for (let x = 0; x < drawW; x += effectiveGrid) {
        
        let sx = map(x, 0, drawW, 0, img.width);
        let sy = map(y, 0, drawH, 0, img.height);
        if (sliceEnabled) {
          if (sliceVertical) sy = sliceYStart + (sy % sliceH);
          else sx = sliceXStart + (sx % sliceW);
        }
        
        let sampleW = effectiveGrid * (img.width / drawW);
        let ix = floor(constrain(sx, 0, img.width - 1));
        let iy = floor(constrain(sy, 0, img.height - 1));
        
        // CHANGED: Determine Color per line segment
        if (overrideInk) {
             target.fill(overrideInk.r, overrideInk.g, overrideInk.b);
        } else if (useOriginalCol) {
             let cImg = getAverageRGBFromImage(ix, iy, sampleW);
             target.fill(cImg.r, cImg.g, cImg.b);
        } else {
             target.fill(pickerR, pickerG, pickerB);
        }
        
        let bright = getAverageGrayFromImage(ix, iy, sampleW);
        let thickness = map(bright, 255, 0, 0, effectiveGrid) * sizeMult;
        thickness = thickness * contrast;
        thickness = constrain(thickness, 0, effectiveGrid);
        let yOffset = (effectiveGrid - thickness) / 2;
        
        if (thickness > 0.5) {
             target.rect(startX + x, startY + y + yOffset, effectiveGrid + 0.5, thickness);
        }
      }
    }

  // 3. --- PATTERN RASTER ---
  } else if (type === 'Pattern Raster') {
    let effectiveGrid = density * scaleFactor;

    // Pre-fetch picker color if needed
    let pickerC = inkColorPicker.color();
    let pickerR=red(pickerC), pickerG=green(pickerC), pickerB=blue(pickerC);

    for (let y = 0; y < drawH; y += effectiveGrid) {
      for (let x = 0; x < drawW; x += effectiveGrid) {
        let sx = map(x, 0, drawW, 0, img.width);
        let sy = map(y, 0, drawH, 0, img.height);
        if (sliceEnabled) {
          if (sliceVertical) sy = sliceYStart + (sy % sliceH);
          else sx = sliceXStart + (sx % sliceW);
        }
        let sampleW = effectiveGrid * (img.width / drawW);
        let ix = floor(constrain(sx, 0, img.width - 1));
        let iy = floor(constrain(sy, 0, img.height - 1));
        
        // CHANGED: Determine Color per pattern block
        let rInk, gInk, bInk;
        if (overrideInk) {
             rInk=overrideInk.r; gInk=overrideInk.g; bInk=overrideInk.b;
        } else if (useOriginalCol) {
             let cImg = getAverageRGBFromImage(ix, iy, sampleW);
             rInk = cImg.r; gInk = cImg.g; bInk = cImg.b;
        } else {
             rInk = pickerR; gInk = pickerG; bInk = pickerB;
        }

        let avgGray = getAverageGrayFromImage(ix, iy, sampleW);
        avgGray = constrain(avgGray * contrast, 0, 255);
        drawPatternTexture(target, startX + x, startY + y, effectiveGrid, avgGray, rInk, gInk, bInk);
      }
    }

  // 4. --- TEXT RASTER ---
  } else if (type === 'Text Raster') {
    let effectiveGrid = density * scaleFactor;
    
    // Pre-fetch picker color if needed
    let pickerC = inkColorPicker.color();
    let pickerR=red(pickerC), pickerG=green(pickerC), pickerB=blue(pickerC);
    
    target.textFont(font); 
    target.textAlign(CENTER, CENTER);
    let txt = rasterTextInput.value();
    if (txt.length === 0) txt = "TYPE";
    let charIndex = 0;

    for (let y = 0; y < drawH; y += effectiveGrid) {
      for (let x = 0; x < drawW; x += effectiveGrid) {
        let sx = map(x, 0, drawW, 0, img.width);
        let sy = map(y, 0, drawH, 0, img.height);
        if (sliceEnabled) {
          if (sliceVertical) sy = sliceYStart + (sy % sliceH);
          else sx = sliceXStart + (sx % sliceW);
        }
        let sampleW = effectiveGrid * (img.width / drawW);
        let ix = floor(constrain(sx, 0, img.width - 1));
        let iy = floor(constrain(sy, 0, img.height - 1));

        // CHANGED: Determine Color per character
        if (overrideInk) {
             target.fill(overrideInk.r, overrideInk.g, overrideInk.b);
        } else if (useOriginalCol) {
             let cImg = getAverageRGBFromImage(ix, iy, sampleW);
             target.fill(cImg.r, cImg.g, cImg.b);
        } else {
             target.fill(pickerR, pickerG, pickerB);
        }

        let bright = getAverageGrayFromImage(ix, iy, sampleW);
        let dynamicMax = effectiveGrid * 1.5 * sizeMult; 
        let dynamicMin = 1 * sizeMult;
        let tSize = map(bright, 0, 255, dynamicMin, dynamicMax);
        tSize = tSize * contrast; 
        target.textSize(tSize);
        let char = txt.charAt(charIndex % txt.length);
        target.text(char, startX + x + effectiveGrid/2, startY + y + effectiveGrid/2);
        charIndex++;
      }
    }

  // 5. --- PULSING HALFTONE ---
  } else if (type === 'Pulsing Halftone') {
      // Pulsing ignores "Original Color" mode to maintain its effect
      let effectiveGrid = density * scaleFactor;
      
      let c1 = pPicker1.color();
      let c2 = pPicker2.color();
      let c3 = pPicker3.color();
      
      let colW = drawW / 3;
      let blendZone = effectiveGrid * 10;
      let pulseWave = sin(frameCount * 0.1); 
      let pulseFactor = map(pulseWave, -1, 1, 2, 6); 

      for (let y = 0; y < drawH; y += effectiveGrid) {
       for (let x = 0; x < drawW; x += effectiveGrid) {
        let sx = map(x, 0, drawW, 0, img.width);
        let sy = map(y, 0, drawH, 0, img.height);
        
        let ix = floor(constrain(sx, 0, img.width-1));
        let iy = floor(constrain(sy, 0, img.height-1));
        let idx = (ix + iy * img.width) * 4;
        let r = img.pixels[idx];
        let g = img.pixels[idx+1];
        let b = img.pixels[idx+2];
        let bright = (r*0.299 + g*0.587 + b*0.114);
        
        let dotColor;
        if (x < colW - blendZone) {
            dotColor = c1;
        } else if (x >= colW - blendZone && x < colW + blendZone) {
            let lerpFactor = map(x, colW - blendZone, colW + blendZone, 0, 1, true);
            dotColor = lerpColor(c1, c2, lerpFactor);
        } else if (x < colW * 2 - blendZone) {
            dotColor = c2;
        } else if (x >= colW * 2 - blendZone && x < colW * 2 + blendZone) {
            let lerpFactor = map(x, colW * 2 - blendZone, colW * 2 + blendZone, 0, 1, true);
            dotColor = lerpColor(c2, c3, lerpFactor);
        } else {
            dotColor = c3;
        }

        let baseDiameter = map(bright, 0, 255, 0, effectiveGrid * 0.7);
        let diameter = baseDiameter * pulseFactor * sizeMult * 0.5; 
        target.fill(dotColor);
        target.circle(startX + x + effectiveGrid/2, startY + y + effectiveGrid/2, diameter);
       }
      }

  // 6. --- PIXELATE (COLOR) ---
  } else if (type === 'Pixelate (Color)') {
      let effectiveGrid = density * scaleFactor;
      let pixelSize = effectiveGrid * sizeMult;
      
      for (let y = 0; y < drawH; y += effectiveGrid) {
        for (let x = 0; x < drawW; x += effectiveGrid) {
          
          let sx = map(x, 0, drawW, 0, img.width);
          let sy = map(y, 0, drawH, 0, img.height);
          
          if (sliceEnabled) {
            if (sliceVertical) sy = sliceYStart + (sy % sliceH);
            else sx = sliceXStart + (sx % sliceW);
          }
          
          let sampleW = effectiveGrid * (img.width / drawW);
          let ix = floor(constrain(sx, 0, img.width - 1));
          let iy = floor(constrain(sy, 0, img.height - 1));
          
          let c = getAverageRGBFromImage(ix, iy, sampleW);
          
          let rC = (c.r - 128) * contrast + 128;
          let gC = (c.g - 128) * contrast + 128;
          let bC = (c.b - 128) * contrast + 128;
          
          target.fill(constrain(rC,0,255), constrain(gC,0,255), constrain(bC,0,255));
          
          let offset = (effectiveGrid - pixelSize) / 2;
          target.rect(startX + x + offset, startY + y + offset, pixelSize, pixelSize);
        }
      }
  }
}

function drawPatternTexture(target, x, y, size, grayValue, r, g, b) {
    target.push(); 
    target.translate(x, y); 
    target.fill(r, g, b); 
    target.stroke(r, g, b);
    const step = 255 / 6;
    const level = floor(grayValue / step);
    const lineW = size / 10; 
    switch (level) {
        case 0: target.noStroke(); target.rect(0, 0, size, size); break;
        case 1: target.strokeWeight(lineW / 2); for (let i = 0; i < 8; i++) { target.line(i * size/8, 0, 0, i * size/8); target.line(i * size/8, size, size, i * size/8); } break;
        case 2: target.strokeWeight(lineW / 2); for (let i = -1; i < 8; i++) { target.line(i * size/6, 0, 0, i * size/6); } break;
        case 3: target.strokeWeight(lineW / 2); for (let i = -1; i < 6; i++) { target.line(i * size/4, 0, 0, i * size/4); } break;
        case 4: target.noStroke(); const smallRectSize = size / 4; target.rect(0, 0, smallRectSize, smallRectSize); target.rect(smallRectSize * 3, 0, smallRectSize, smallRectSize); target.rect(0, smallRectSize * 3, smallRectSize, smallRectSize); target.rect(smallRectSize * 3, smallRectSize * 3, smallRectSize, smallRectSize); break;
        case 5: target.noStroke(); target.rect(size/2 - lineW/2, size/2 - lineW/2, lineW, lineW); break;
    }
    target.pop(); 
}

function getAverageGrayFromImage(ix, iy, sampleSize) {
  let avg = 0; let count = 0;
  let step = (sampleSize > 5) ? 2 : 1;
  let half = floor(sampleSize / 2);
  let startX = max(0, ix - half);
  let endX = min(img.width, ix + half);
  let startY = max(0, iy - half);
  let endY = min(img.height, iy + half);
  if (sampleSize < 1.5) {
     let idx = (ix + iy * img.width) * 4;
     return (img.pixels[idx]*0.299 + img.pixels[idx+1]*0.587 + img.pixels[idx+2]*0.114);
  }
  for (let y = startY; y < endY; y += step) {
    for (let x = startX; x < endX; x += step) {
      let idx = (x + y * img.width) * 4;
      avg += (img.pixels[idx]*0.299 + img.pixels[idx+1]*0.587 + img.pixels[idx+2]*0.114);
      count++;
    }
  }
  if (count > 0) return avg / count;
  return 255; 
}

function getAverageRGBFromImage(ix, iy, sampleSize) {
  let rT=0, gT=0, bT=0; let count = 0;
  let step = (sampleSize > 5) ? 2 : 1;
  let half = floor(sampleSize / 2);
  let startX = max(0, ix - half);
  let endX = min(img.width, ix + half);
  let startY = max(0, iy - half);
  let endY = min(img.height, iy + half);
  
  if (sampleSize < 1.5) {
     let idx = (ix + iy * img.width) * 4;
     return {r: img.pixels[idx], g: img.pixels[idx+1], b: img.pixels[idx+2]};
  }
  
  for (let y = startY; y < endY; y += step) {
    for (let x = startX; x < endX; x += step) {
      let idx = (x + y * img.width) * 4;
      rT += img.pixels[idx];
      gT += img.pixels[idx+1];
      bT += img.pixels[idx+2];
      count++;
    }
  }
  if (count > 0) return {r: rT/count, g: gT/count, b: bT/count};
  return {r:0, g:0, b:0}; 
}

// REMOVED extractColors() function

function saveHighRes() {
  if (!img) return;
  
  let exportScale = 2400 / currentW; 
  let singleW = currentW * exportScale; 
  let singleH = currentH * exportScale;
  
  if (warholCb.checked()) {
    let gridW = singleW * 2; let gridH = singleH * 2;
    let finalPG = createGraphics(gridW, gridH);
    finalPG.pixelDensity(1); finalPG.noSmooth(); finalPG.background(255);
    let palettes = [ { ink: getRGB('Magenta'), bg: getRGB('Yellow') }, { ink: getRGB('Cyan'), bg: getRGB('Red') }, { ink: getRGB('Green'), bg: getRGB('Purple') }, { ink: getRGB('Yellow'), bg: getRGB('Blue') } ];
    palettes = shuffle(palettes);
    let pg1 = createGraphics(singleW, singleH); pg1.pixelDensity(1); pg1.noSmooth();
    pg1.textFont(font); 
    render(pg1, exportScale, singleW, singleH, palettes[0].ink, palettes[0].bg); finalPG.image(pg1, 0, 0);
    let pg2 = createGraphics(singleW, singleH); pg2.pixelDensity(1); pg2.noSmooth();
    pg2.textFont(font); 
    render(pg2, exportScale, singleW, singleH, palettes[1].ink, palettes[1].bg); finalPG.image(pg2, singleW, 0);
    let pg3 = createGraphics(singleW, singleH); pg3.pixelDensity(1); pg3.noSmooth();
    pg3.textFont(font); 
    render(pg3, exportScale, singleW, singleH, palettes[2].ink, palettes[2].bg); finalPG.image(pg3, 0, singleH);
    let pg4 = createGraphics(singleW, singleH); pg4.pixelDensity(1); pg4.noSmooth();
    pg4.textFont(font); 
    render(pg4, exportScale, singleW, singleH, palettes[3].ink, palettes[3].bg); finalPG.image(pg4, singleW, singleH);
    save(finalPG, 'warhol-grid.png');
  } else {
    let pg = createGraphics(singleW, singleH);
    pg.pixelDensity(1); pg.noSmooth();
    pg.textFont(font); 
    render(pg, exportScale, singleW, singleH, null, null);
    save(pg, 'raster-highres.png');
  }
}

function saveAnimatedGif() {
  console.log("Recording 5 seconds of GIF...");
  saveGif('pulsing_raster', 5); 
}

function handleFile(file) {
  if (file.type === 'image') {
    img = loadImage(file.data, () => { 
      // REMOVED extractColors call
      updateCanvasSize(); 
      if (rasterTypeSelect.value() === 'Pulsing Halftone') loop();
      else redraw(); 
    });
  }
}