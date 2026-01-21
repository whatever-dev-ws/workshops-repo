// WUP 25-26
// Chiara Cherubin

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

// WEBCAM VARIABLES (NEW)
let video;
let isWebcamActive = false;
let webcamButton;

// UI Globals
let formatSelect;
let rasterTypeSelect;
let rasterTextInput;
let densitySlider, sizeSlider, contrastSlider;
let inkColorPicker, originalColorCb;
let warholCb;
let sliceEnableCb, sliceDirSelect, sliceStartSlider, sliceCountSlider;

// Buttons
let saveButton;
let saveGifButton;
let resetButton;

// PULSING MODE COLORS
let pColor1, pColor2, pColor3;

// Layout Constants
const MAX_PREVIEW_SIZE = 400;
const SIDEBAR_WIDTH = 240;
const GAP = 20;

let currentW = 250;
let currentH = 250;

function setup() {
  createCanvas(windowWidth, windowHeight);

  // Initialize Pulsing Colors
  pColor1 = color(153, 255, 0);   // Lime Green
  pColor2 = color(255, 255, 0);   // Sun Yellow
  pColor3 = color(255, 140, 0);   // Dark Orange

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
    // --- WEBCAM LOGIC ADDED HERE ---
    if (isWebcamActive && video && video.loadedmetadata) {
        // Capture frame
        img = video.get();
        // Resize for performance (Rasterizing HD video is too heavy)
        if(img.width > 320) img.resize(320, 0);
    }

    if (!img) return;
    
    // Pass 'this' (the main canvas) as the target
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
  startButton.style('border-radius', '5px');
  startButton.style('cursor', 'pointer');
  startButton.style('font-family', 'Courier New, monospace');
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
  textFont('Courier New');
  textStyle(BOLD);
  textSize(80);
  text('THE BEST', width / 2, height / 2 - 80);
  textSize(40);
  text('Image Rasterizer', width / 2, height / 2 + 10);
  textStyle(NORMAL);
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
  sidebar.style('font-family', 'sans-serif');
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
  formatSelect.changed(updateCanvasSize);
  createDiv('').parent(sidebar).style('height','20px');

  // B. File Input & WEBCAM
  createSpan('<b>2. Image Source</b>').parent(sidebar);
  createDiv('').parent(sidebar).style('height','5px');
  
  let fileInput = createFileInput(handleFile);
  fileInput.parent(sidebar);
  fileInput.style('width', '100%');
  createDiv('').parent(sidebar).style('height','10px');

  // --- NEW WEBCAM BUTTON ---
  webcamButton = createButton('📷 Use Webcam');
  webcamButton.parent(sidebar);
  webcamButton.style('width', '100%');
  webcamButton.style('padding', '5px');
  webcamButton.style('cursor', 'pointer');
  webcamButton.mousePressed(toggleWebcam);

  createDiv('').parent(sidebar).style('height','20px');

  // C. Raster Style
  createSpan('<b>3. Raster Style</b>').parent(sidebar);
  createDiv('').parent(sidebar).style('height','5px');
  rasterTypeSelect = createSelect();
  rasterTypeSelect.parent(sidebar);
  rasterTypeSelect.option('Dot Raster');
  rasterTypeSelect.option('Grainy Film');
  rasterTypeSelect.option('Pattern Raster');
  rasterTypeSelect.option('Text Raster');
  rasterTypeSelect.option('Pulsing Halftone');
  rasterTypeSelect.option('Wavy Distortion');
  rasterTypeSelect.style('width', '100%');
  rasterTypeSelect.style('padding', '5px');
  rasterTypeSelect.changed(onTypeChanged);

  // Text Input
  rasterTextInput = createInput('');
  rasterTextInput.parent(sidebar);
  rasterTextInput.attribute('placeholder', 'Type characters...');
  rasterTextInput.style('width', '90%');
  rasterTextInput.style('padding', '5px');
  rasterTextInput.style('margin-top', '5px');
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

  // E. Color Palette
  createSpan('<b>Color Palette</b>').parent(sidebar).style('font-size','12px');
  let colorBox = createDiv().parent(sidebar).style('border-top', '1px solid #ccc').style('padding-top', '10px').style('margin-top', '5px');
  
  originalColorCb = createCheckbox(' Use Original Colors', false);
  originalColorCb.parent(colorBox);
  originalColorCb.style('font-size', '13px');
  originalColorCb.changed(requestRedraw);
  createDiv('').parent(colorBox).style('height','10px');

  createSpan('Ink Color (if not original):').parent(colorBox).style('font-size','11px');
  inkColorPicker = createColorPicker('#000000');
  inkColorPicker.parent(colorBox);
  inkColorPicker.style('width', '100%');
  inkColorPicker.style('height', '30px');
  inkColorPicker.style('cursor', 'pointer');
  inkColorPicker.style('margin-top', '5px');
  inkColorPicker.input(requestRedraw);
  
  createDiv('').parent(sidebar).style('height','20px');

  // F. Special Modes
  createSpan('<b>4. Special Modes</b>').parent(sidebar);
  let specialBox = createDiv().parent(sidebar);
  specialBox.style('border-top', '1px solid #ccc');
  specialBox.style('padding-top', '10px');
  specialBox.style('margin-top', '5px');
  
  warholCb = createCheckbox(' Andy Warhol Mode', false);
  warholCb.parent(specialBox);
  warholCb.style('font-size', '13px');
  createDiv('Pop Art colors (Static modes only).').parent(specialBox)
    .style('font-size','10px').style('color','#666').style('margin-left','20px');

  createDiv('').parent(sidebar).style('height','20px');
  
  // G. Slice & Repeat
  createSpan('<b>5. Slice & Repeat</b>').parent(sidebar);
  let sliceBox = createDiv().parent(sidebar);
  sliceBox.style('border-top', '1px solid #ccc');
  sliceBox.style('padding-top', '10px');
  sliceBox.style('margin-top', '5px');

  sliceEnableCb = createCheckbox(' Enable Slice', false);
  sliceEnableCb.parent(sliceBox);
  sliceEnableCb.changed(requestRedraw);
  createDiv('').parent(sliceBox).style('height','10px');

  sliceDirSelect = createSelect();
  sliceDirSelect.parent(sliceBox);
  sliceDirSelect.option('Vertical (Repeat rows)');
  sliceDirSelect.option('Horizontal (Repeat cols)');
  sliceDirSelect.style('width', '100%');
  sliceDirSelect.style('margin', '5px 0');
  sliceDirSelect.changed(requestRedraw);

  sliceCountSlider = makeControl('Number of Slices', 1, 10, 2, 1, sliceBox);
  createDiv('').parent(sliceBox).style('height','10px');
  sliceStartSlider = makeControl('Slice Offset', 0.0, 0.99, 0.0, 0.01, sliceBox);

  createDiv('').parent(sidebar).style('height','25px');

  // H. Actions & Buttons
  saveButton = createButton('<b>Save High-Res PNG</b>');
  saveButton.parent(sidebar);
  saveButton.style('width', '100%');
  saveButton.style('padding', '10px');
  saveButton.style('background', '#2196F3');
  saveButton.style('color', 'white');
  saveButton.style('border', 'none');
  saveButton.style('cursor', 'pointer');
  saveButton.mousePressed(saveHighRes);

  saveGifButton = createButton('<b>Record GIF (5 sec)</b>');
  saveGifButton.parent(sidebar);
  saveGifButton.style('width', '100%');
  saveGifButton.style('padding', '10px');
  saveGifButton.style('background', '#FF5722'); 
  saveGifButton.style('color', 'white');
  saveGifButton.style('border', 'none');
  saveGifButton.style('cursor', 'pointer');
  saveGifButton.style('display', 'none');
  saveGifButton.mousePressed(saveAnimatedGif);

  resetButton = createButton('CLEAR ALL FILTERS');
  resetButton.parent(sidebar);
  resetButton.style('width', '100%');
  resetButton.style('margin-top', '10px');
  resetButton.style('background', '#ff4444');
  resetButton.style('color', '#fff');
  resetButton.style('border', 'none');
  resetButton.style('padding', '10px');
  resetButton.style('font-weight', 'bold');
  resetButton.style('cursor', 'pointer');
  resetButton.mousePressed(resetAll);

  updateCanvasSize();
  noLoop();
}

// --- LOGIC FUNCTIONS ---

// NEW: WEBCAM TOGGLE FUNCTION
function toggleWebcam() {
  if (!isWebcamActive) {
    // Start Webcam
    video = createCapture(VIDEO);
    video.size(320, 240); // Keep capture small for performance
    video.hide();
    isWebcamActive = true;
    webcamButton.html('⏹ Stop Webcam');
    webcamButton.style('background', '#ffcccc');
    loop(); // Must loop for video
  } else {
    // Stop Webcam
    video.remove();
    video = null;
    isWebcamActive = false;
    webcamButton.html('📷 Use Webcam');
    webcamButton.style('background', '');
    
    // Stop looping if we aren't in pulsing mode
    if (rasterTypeSelect.value() !== 'Pulsing Halftone') {
        noLoop();
    }
  }
}

function resetAll() {
  densitySlider.value(10);
  sizeSlider.value(1.2);
  contrastSlider.value(1.5);
  
  inkColorPicker.value('#000000'); 
  originalColorCb.checked(false);
  
  rasterTypeSelect.selected('Dot Raster');
  rasterTextInput.value('');
  
  warholCb.checked(false);
  sliceEnableCb.checked(false);
  sliceCountSlider.value(2);
  sliceStartSlider.value(0.0);
  
  // Also turn off webcam if resetting all? Optional, but safer.
  if(isWebcamActive) toggleWebcam();

  onTypeChanged(); 
  requestRedraw();
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
  if (!img && !isWebcamActive) {
    fill(0); textAlign(CENTER, CENTER);
    textFont('sans-serif'); textStyle(NORMAL);
    text("Upload Image or Use Webcam", width/2, height/2);
  } else {
    requestRedraw();
  }
}

function makeControl(label, min, max, val, step, parent) {
  createSpan(label).parent(parent).style('font-size','12px');
  let box = createDiv().parent(parent).style('display', 'flex').style('align-items', 'center').style('margin-top', '2px');
  let btnMinus = createButton('-').parent(box).style('width', '25px').style('cursor', 'pointer');
  let sld = createSlider(min, max, val, step).parent(box).style('flex-grow', '1').style('margin', '0 5px');
  let btnPlus = createButton('+').parent(box).style('width', '25px').style('cursor', 'pointer');
  btnMinus.mousePressed(() => { sld.value(sld.value() - step); requestRedraw(); });
  btnPlus.mousePressed(() => { sld.value(sld.value() + step); requestRedraw(); });
  sld.input(requestRedraw);
  return sld;
}

function onTypeChanged() {
  let type = rasterTypeSelect.value();
  
  // 1. Manage Text Input
  if (type === 'Text Raster') {
    rasterTextInput.style('display', 'block');
  } else {
    rasterTextInput.style('display', 'none');
  }

  // 2. Manage Animation & GIF Button
  // Note: if Webcam is active, we always loop.
  if (type === 'Pulsing Halftone' || isWebcamActive) {
    saveButton.style('display', 'none');      
    saveGifButton.style('display', 'block'); 
    loop(); 
  } else {
    saveButton.style('display', 'block');    
    saveGifButton.style('display', 'none');  
    noLoop(); 
  }
  
  // 3. Defaults 
  if (type === 'Dot Raster') {
    contrastSlider.value(5.0); 
    densitySlider.value(6);
  } else if (type === 'Grainy Film') {
    contrastSlider.value(1.5); 
    densitySlider.value(6);
  } else if (type === 'Pattern Raster') {
    contrastSlider.value(1.0);
    densitySlider.value(15); 
  } else if (type === 'Text Raster') {
    densitySlider.value(12);
    contrastSlider.value(1.0);
  } else if (type === 'Pulsing Halftone') {
    densitySlider.value(8);
    contrastSlider.value(1.0);
  } else if (type === 'Wavy Distortion') {
    densitySlider.value(10); 
    contrastSlider.value(1.0); 
    sizeSlider.value(1.0);    
  }

  if (type !== 'Pulsing Halftone' && !isWebcamActive) redraw();
}

function requestRedraw() { 
  if (rasterTypeSelect.value() !== 'Pulsing Halftone' && !isWebcamActive) {
      redraw(); 
  }
  // If webcam or pulsing is active, the loop() handles it.
}

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
  
  let density = densitySlider.value();
  let sizeMult = sizeSlider.value();
  let contrast = contrastSlider.value();
  
  let useOriginalColor = originalColorCb.checked();

  // Determine Ink Color
  let rInk, gInk, bInk;
  if (overrideInk) {
    rInk = overrideInk.r; gInk = overrideInk.g; bInk = overrideInk.b;
  } else {
    let c = inkColorPicker.color();
    rInk = red(c); gInk = green(c); bInk = blue(c);
  }
  
  // Determine BG Color
  let bgCol; 
  if (overrideBg) {
    bgCol = color(overrideBg.r, overrideBg.g, overrideBg.b);
  } else {
    if (useOriginalColor && type !== 'Grainy Film') {
         bgCol = color(255);
    } else if (type === 'Grainy Film' || type === 'Pulsing Halftone') {
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
        let idx = (ix + iy * img.width) * 4;
        let r = img.pixels[idx];
        let g = img.pixels[idx+1];
        let b = img.pixels[idx+2];
        
        if (useOriginalColor) {
            target.fill(r, g, b);
        } else {
            let dotAlpha = map(contrast, 0.1, 5.0, 25, 255);
            target.fill(rInk, gInk, bInk, dotAlpha);
        }

        let bright = (r*0.299 + g*0.587 + b*0.114);
        let diameter = map(bright, 255, 0, minDotSize, effectiveGrid) * sizeMult;
        
        if (useOriginalColor) {
              diameter = effectiveGrid * sizeMult * 0.9; 
        }

        if (diameter > 0.5 * scaleFactor) {
          target.circle(startX + x + effectiveGrid/2, startY + y + effectiveGrid/2, diameter);
        }
      }
    }

  // 2. --- PATTERN RASTER ---
  } else if (type === 'Pattern Raster') {
    let effectiveGrid = density * scaleFactor;
    for (let y = 0; y < drawH; y += effectiveGrid) {
      for (let x = 0; x < drawW; x += effectiveGrid) {
        let sx = map(x, 0, drawW, 0, img.width);
        let sy = map(y, 0, drawH, 0, img.height);
        if (sliceEnabled) {
          if (sliceVertical) sy = sliceYStart + (sy % sliceH);
          else sx = sliceXStart + (sx % sliceW);
        }
        
        let ix = floor(constrain(sx, 0, img.width - 1));
        let iy = floor(constrain(sy, 0, img.height - 1));

        let finalR, finalG, finalB;
        if (useOriginalColor) {
            let idx = (ix + iy * img.width) * 4;
            finalR = img.pixels[idx];
            finalG = img.pixels[idx+1];
            finalB = img.pixels[idx+2];
        } else {
            finalR = rInk; finalG = gInk; finalB = bInk;
        }

        let sampleW = effectiveGrid * (img.width / drawW);
        let avgGray = getAverageGrayFromImage(ix, iy, sampleW);
        avgGray = constrain(avgGray * contrast, 0, 255);
        
        drawPatternTexture(target, startX + x, startY + y, effectiveGrid, avgGray, finalR, finalG, finalB);
      }
    }

  // 3. --- GRAINY FILM ---
  } else if (type === 'Grainy Film') {
    target.loadPixels(); 
    let grainAmount = map(density, 2, 15, 10, 100); 
    let grainBuffer = 15;
    let rBg = red(bgCol); let gBg = green(bgCol); let bBg = blue(bgCol);

    for (let y = 0; y < drawH; y++) {
      for (let x = 0; x < drawW; x++) {
        let sx = map(x, 0, drawW, 0, img.width);
        let sy = map(y, 0, drawH, 0, img.height);
        if (sliceEnabled) {
          if (sliceVertical) sy = sliceYStart + (sy % sliceH);
          else sx = sliceXStart + (sx % sliceW);
        }
        let ix = floor(constrain(sx, 0, img.width-1));
        let iy = floor(constrain(sy, 0, img.height-1));
        let srcIdx = (ix + iy * img.width) * 4;
        let r = img.pixels[srcIdx];
        let g = img.pixels[srcIdx+1];
        let b = img.pixels[srcIdx+2];
        
        let finalR, finalG, finalB;

        if (useOriginalColor) {
             let noise = random(-grainAmount, grainAmount);
             finalR = constrain(r + noise, 0, 255);
             finalG = constrain(g + noise, 0, 255);
             finalB = constrain(b + noise, 0, 255);
        } else {
            let bright = (r*0.299 + g*0.587 + b*0.114);
            let val = bright / 255.0;
            val = (val - 0.5) * contrast + 0.5;
            val = val * 255.0;
            val = val + random(-grainAmount, grainAmount);
            val = constrain(val, grainBuffer, 255-grainBuffer);
            let ratio = 1.0 - (val / 255.0); 
            let bgRatio = 1.0 - ratio;        
            finalR = rInk * ratio + rBg * bgRatio;
            finalG = gInk * ratio + gBg * bgRatio;
            finalB = bInk * ratio + bBg * bgRatio;
        }

        let destIdx = ((startX + x | 0) + (startY + y | 0) * target.width) * 4;
        target.pixels[destIdx]    = finalR;
        target.pixels[destIdx+1] = finalG;
        target.pixels[destIdx+2] = finalB;
        target.pixels[destIdx+3] = 255; 
      }
    }
    target.updatePixels();
    
  // 4. --- TEXT RASTER ---
  } else if (type === 'Text Raster') {
    let effectiveGrid = density * scaleFactor;
    
    target.textFont('Courier New'); 
    target.textStyle(BOLD);
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

        let ix = floor(constrain(sx, 0, img.width - 1));
        let iy = floor(constrain(sy, 0, img.height - 1));

        if (useOriginalColor) {
            let idx = (ix + iy * img.width) * 4;
            target.fill(img.pixels[idx], img.pixels[idx+1], img.pixels[idx+2]);
        } else {
            target.fill(rInk, gInk, bInk);
        }

        let sampleW = effectiveGrid * (img.width / drawW);
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
    target.textStyle(NORMAL); 

  // 5. --- PULSING HALFTONE ---
  } else if (type === 'Pulsing Halftone') {
      let effectiveGrid = density * scaleFactor;
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
        if (x < colW - blendZone) { dotColor = pColor1; } 
        else if (x >= colW - blendZone && x < colW + blendZone) {
            let lerpFactor = map(x, colW - blendZone, colW + blendZone, 0, 1, true);
            dotColor = lerpColor(pColor1, pColor2, lerpFactor);
        } else if (x < colW * 2 - blendZone) { dotColor = pColor2; } 
        else if (x >= colW * 2 - blendZone && x < colW * 2 + blendZone) {
            let lerpFactor = map(x, colW * 2 - blendZone, colW * 2 + blendZone, 0, 1, true);
            dotColor = lerpColor(pColor2, pColor3, lerpFactor);
        } else { dotColor = pColor3; }

        let baseDiameter = map(bright, 0, 255, 0, effectiveGrid * 0.7);
        let diameter = baseDiameter * pulseFactor * sizeMult * 0.5;
        target.fill(dotColor);
        target.circle(startX + x + effectiveGrid/2, startY + y + effectiveGrid/2, diameter);
       }
      }
      
  // 6. --- WAVY DISTORTION ---
  } else if (type === 'Wavy Distortion') {
    drawWavyDistortion(target, drawW, drawH, startX, startY, density, contrast, sizeMult, sliceEnabled, sliceVertical, sliceYStart, sliceH, sliceXStart, sliceW);
  }
}

// ---------------------------------------------------------
// HELPER FUNCTIONS
// ---------------------------------------------------------
function drawWavyDistortion(target, drawW, drawH, startX, startY, density, contrast, sizeMult, sliceEnabled, sliceVertical, sliceYStart, sliceH, sliceXStart, sliceW) {
  target.loadPixels();
  let noiseScale = map(density, 2, 60, 0.002, 0.05);
  let distortionMax = map(contrast, 0.1, 5.0, 0, 100);
  let phase = sizeMult * 10; 

  for (let y = 0; y < drawH; y++) {
    for (let x = 0; x < drawW; x++) {
      let nX = noise(x * noiseScale + phase, y * noiseScale);
      let xOffset = map(nX, 0, 1, -distortionMax, distortionMax);
      let nY = noise(x * noiseScale, y * noiseScale + phase + 100);
      let yOffset = map(nY, 0, 1, -distortionMax, distortionMax);
      let sx_draw = x - xOffset;
      let sy_draw = y - yOffset;
      let sx = map(sx_draw, 0, drawW, 0, img.width);
      let sy = map(sy_draw, 0, drawH, 0, img.height);
      if (sliceEnabled) {
        if (sliceVertical) sy = sliceYStart + (sy % sliceH);
        else sx = sliceXStart + (sx % sliceW);
      }
      let ix = floor(constrain(sx, 0, img.width - 1));
      let iy = floor(constrain(sy, 0, img.height - 1));
      let srcIdx = (ix + iy * img.width) * 4;
      let destIdx = ((startX + x | 0) + (startY + y | 0) * target.width) * 4;
      target.pixels[destIdx]    = img.pixels[srcIdx];
      target.pixels[destIdx+1] = img.pixels[srcIdx+1];
      target.pixels[destIdx+2] = img.pixels[srcIdx+2];
      target.pixels[destIdx+3] = 255; 
    }
  }
  target.updatePixels();
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
    render(pg1, exportScale, singleW, singleH, palettes[0].ink, palettes[0].bg); finalPG.image(pg1, 0, 0);
    let pg2 = createGraphics(singleW, singleH); pg2.pixelDensity(1); pg2.noSmooth();
    render(pg2, exportScale, singleW, singleH, palettes[1].ink, palettes[1].bg); finalPG.image(pg2, singleW, 0);
    let pg3 = createGraphics(singleW, singleH); pg3.pixelDensity(1); pg3.noSmooth();
    render(pg3, exportScale, singleW, singleH, palettes[2].ink, palettes[2].bg); finalPG.image(pg3, 0, singleH);
    let pg4 = createGraphics(singleW, singleH); pg4.pixelDensity(1); pg4.noSmooth();
    render(pg4, exportScale, singleW, singleH, palettes[3].ink, palettes[3].bg); finalPG.image(pg4, singleW, singleH);
    save(finalPG, 'warhol-grid.png');
  } else {
    let pg = createGraphics(singleW, singleH);
    pg.pixelDensity(1); pg.noSmooth();
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
    // If we upload an image, turn off webcam if it's running
    if(isWebcamActive) toggleWebcam();
    
    img = loadImage(file.data, () => { 
      updateCanvasSize(); 
      if (rasterTypeSelect.value() === 'Pulsing Halftone') loop();
      else redraw(); 
    });
  }
}