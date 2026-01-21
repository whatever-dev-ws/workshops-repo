// GLOBAL VARIABLES
let img;
let canvas;

// UI Controls
let sliderScale, sliderThreshold, sliderSpacing;
let colorPickers = [];
let saveBtn, uploadBtn;
let shapeSelect, bgSelect;
let showUpload = true;

// Advanced parameters
let currentShape = 'circle';
let bgColor = 'white';

// Font stack
const fontStack = '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif';

function setup() {
  canvas = createCanvas(windowWidth, windowHeight);
  pixelDensity(1);
  noLoop();
  
  // Apply body styles directly
  Object.assign(document.body.style, {
    margin: '0',
    padding: '0',
    overflow: 'hidden',
    fontFamily: fontStack,
    background: '#000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  });
  
  canvas.elt.style.display = 'block';
  
  createUI();
}

function draw() {
  if (showUpload) {
    background(255);
  } else if (img) {
    // Background selection
    if (bgColor === 'transparent') {
      clear();
    } else if (bgColor === 'black') {
      background(0);
    } else {
      background(255);
    }
    
    updatePanelStyle();
    
    push();
    translate(width / 2 - img.width / 2, height / 2 - img.height / 2);
    drawAdvancedRaster();
    pop();
  }
}

function updatePanelStyle() {
  // We need to access the DOM element directly for styling
  let panel = document.getElementById('control-panel');
  if (!panel) return;

  if (bgColor === 'black') {
    panel.style.background = 'rgba(255, 255, 255, 0.1)';
    panel.style.border = '1px solid rgba(255, 255, 255, 0.2)';
    // Update labels for visibility
    let labels = document.querySelectorAll('.section-label');
    labels.forEach(l => l.style.color = 'rgba(255,255,255,0.8)');
  } else {
    panel.style.background = 'rgba(0, 0, 0, 0.75)';
    panel.style.border = '1px solid rgba(0, 0, 0, 0.3)';
    let labels = document.querySelectorAll('.section-label');
    labels.forEach(l => l.style.color = 'rgba(255,255,255,0.9)');
  }
}

function createUI() {
  // --- UPLOAD PANEL ---
  let uploadPanel = createDiv('');
  uploadPanel.id('upload-panel');
  styleGlassPanel(uploadPanel.elt);
  Object.assign(uploadPanel.elt.style, {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: '1000',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '20px'
  });

  let title = createElement('h1', 'Advanced Raster Tool');
  title.parent(uploadPanel);
  Object.assign(title.elt.style, {
    color: 'black',
    fontSize: '32px',
    fontWeight: '700',
    margin: '0',
    fontFamily: fontStack
  });
  
  // File Input Styling
  uploadBtn = createFileInput(handleFile);
  uploadBtn.parent(uploadPanel);
  uploadBtn.attribute('accept', 'image/*');
  Object.assign(uploadBtn.elt.style, {
    background: '#007AFF',
    color: 'white',
    padding: '12px',
    borderRadius: '12px',
    fontFamily: fontStack,
    cursor: 'pointer'
  });

  // --- CONTROL PANEL ---
  let controlPanel = createDiv('');
  controlPanel.id('control-panel');
  styleGlassPanel(controlPanel.elt);
  Object.assign(controlPanel.elt.style, {
    display: 'none', // Hidden initially
    position: 'fixed',
    top: '20px',
    right: '20px',
    width: '280px',
    maxHeight: '90vh',
    overflowY: 'auto',
    overflowX: 'hidden',
    zIndex: '1000',
    flexDirection: 'column',
    gap: '15px',
    boxSizing: 'border-box'
  });
  
  // Shape Selection
  createLabel('SHAPE', controlPanel);
  shapeSelect = createSelect();
  shapeSelect.parent(controlPanel);
  styleSelect(shapeSelect.elt);
  shapeSelect.option('Circle', 'circle');
  shapeSelect.option('Square', 'square');
  shapeSelect.option('Triangle', 'triangle');
  shapeSelect.option('Hexagon', 'hexagon');
  shapeSelect.option('Diamond', 'diamond');
  shapeSelect.option('Cross', 'cross');
  shapeSelect.changed(() => { currentShape = shapeSelect.value(); redraw(); });
  
  // Background Selection
  createLabel('BACKGROUND', controlPanel);
  bgSelect = createSelect();
  bgSelect.parent(controlPanel);
  styleSelect(bgSelect.elt);
  bgSelect.option('White', 'white');
  bgSelect.option('Black', 'black');
  bgSelect.option('Transparent', 'transparent');
  bgSelect.changed(() => { bgColor = bgSelect.value(); redraw(); });
  
  // Parameters
  createLabel('SIZE', controlPanel);
  sliderScale = createSlider(3, 40, 12, 1);
  sliderScale.parent(controlPanel);
  styleSlider(sliderScale.elt);
  sliderScale.input(redraw);
  
  createLabel('DENSITY', controlPanel);
  sliderThreshold = createSlider(0.3, 3, 1.2, 0.1);
  sliderThreshold.parent(controlPanel);
  styleSlider(sliderThreshold.elt);
  sliderThreshold.input(redraw);
  
  createLabel('SPACING', controlPanel);
  sliderSpacing = createSlider(0.5, 2, 1, 0.1);
  sliderSpacing.parent(controlPanel);
  styleSlider(sliderSpacing.elt);
  sliderSpacing.input(redraw);
  
  // Color Palette (Gradient Map Controls)
  createLabel('GRADIENT MAP PALETTE', controlPanel);
  let colorContainer = createDiv('');
  colorContainer.parent(controlPanel);
  Object.assign(colorContainer.elt.style, {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '10px',
    width: '100%',
    boxSizing: 'border-box'
  });
  
  let defaultColors = ['#000000', '#2b1d38', '#5e2a5e', '#a33b6b', 
                       '#e65a5a', '#f59b6c', '#fce09c', '#ffffff'];
  
  for (let i = 0; i < 8; i++) {
    let colorWrapper = createDiv('');
    colorWrapper.parent(colorContainer);
    Object.assign(colorWrapper.elt.style, {
      width: '100%',
      aspectRatio: '1',
      borderRadius: '12px',
      overflow: 'hidden',
      border: '2px solid rgba(255,255,255,0.2)',
      position: 'relative'
    });

    let picker = createColorPicker(defaultColors[i]);
    picker.parent(colorWrapper);
    Object.assign(picker.elt.style, {
      position: 'absolute',
      top: '-10%',
      left: '-10%',
      width: '120%',
      height: '120%',
      border: 'none',
      cursor: 'pointer',
      padding: '0',
      background: 'none'
    });
    picker.input(redraw);
    colorPickers.push(picker);
  }
  
  // Buttons
  let btnContainer = createDiv('');
  btnContainer.parent(controlPanel);
  Object.assign(btnContainer.elt.style, {
    display: 'flex',
    gap: '10px',
    marginTop: '15px',
    width: '100%',
    boxSizing: 'border-box'
  });
  
  let resetBtn = createButton('RESET');
  resetBtn.parent(btnContainer);
  styleSecondaryBtn(resetBtn.elt);
  resetBtn.mousePressed(resetImage);
  
  saveBtn = createButton('EXPORT PNG');
  saveBtn.parent(btnContainer);
  stylePrimaryBtn(saveBtn.elt);
  saveBtn.mousePressed(exportImage);
}

// --- HELPER STYLING FUNCTIONS ---

function styleGlassPanel(el) {
  Object.assign(el.style, {
    background: 'rgba(255, 255, 255, 0.9)', // Higher opacity for visibility without backdrop-filter support issues
    border: '1px solid rgba(0, 0, 0, 0.1)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
    borderRadius: '24px',
    padding: '30px'
  });
}

function createLabel(text, parent) {
  let span = createSpan(text);
  span.parent(parent);
  span.addClass('section-label'); // Keeping class for selection logic
  Object.assign(span.elt.style, {
    fontSize: '11px',
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '700',
    letterSpacing: '1px',
    marginTop: '10px',
    display: 'block',
    fontFamily: fontStack
  });
}

function styleSelect(el) {
  Object.assign(el.style, {
    width: '100%',
    padding: '10px',
    background: 'rgba(0, 0, 0, 0.3)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    color: 'white',
    fontSize: '14px',
    outline: 'none',
    cursor: 'pointer',
    boxSizing: 'border-box',
    fontFamily: fontStack
  });
}

function styleSlider(el) {
  Object.assign(el.style, {
    width: '100%',
    height: '6px',
    outline: 'none',
    cursor: 'pointer',
    boxSizing: 'border-box',
    margin: '10px 0',
    accentColor: 'white' // Provides native styling for track/thumb
  });
}

function stylePrimaryBtn(el) {
  Object.assign(el.style, {
    flex: '1',
    padding: '14px',
    border: 'none',
    borderRadius: '12px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
    background: '#007AFF',
    color: 'white',
    boxShadow: '0 4px 15px rgba(0, 122, 255, 0.3)',
    fontFamily: fontStack
  });

  el.addEventListener('mouseenter', () => {
    el.style.background = '#0051cc';
    el.style.transform = 'translateY(-2px)';
  });
  el.addEventListener('mouseleave', () => {
    el.style.background = '#007AFF';
    el.style.transform = 'translateY(0)';
  });
}

function styleSecondaryBtn(el) {
  Object.assign(el.style, {
    flex: '1',
    padding: '14px',
    border: 'none',
    borderRadius: '12px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
    background: 'rgba(255, 255, 255, 0.15)',
    color: 'white',
    fontFamily: fontStack
  });

  el.addEventListener('mouseenter', () => {
    el.style.background = 'rgba(255, 255, 255, 0.25)';
  });
  el.addEventListener('mouseleave', () => {
    el.style.background = 'rgba(255, 255, 255, 0.15)';
  });
}

// --- LOGIC FUNCTIONS ---

function handleFile(file) {
  if (file.type === 'image') {
    img = loadImage(file.data, () => {
      let maxDim = min(windowWidth * 0.7, windowHeight * 0.7, 1000);
      if (img.width > maxDim || img.height > maxDim) {
        if (img.width > img.height) {
          img.resize(maxDim, 0);
        } else {
          img.resize(0, maxDim);
        }
      }
      
      img.loadPixels();
      extractColorsFromImage();
      
      document.getElementById('upload-panel').style.display = 'none';
      document.getElementById('control-panel').style.display = 'flex';
      showUpload = false;
      
      redraw();
    });
  }
}

function getGradientColor(brightnessVal) {
  let t = brightnessVal / 255;
  let numColors = colorPickers.length;
  let scaledT = t * (numColors - 1);
  let index = floor(scaledT);
  let amt = scaledT - index; 
  
  if (index >= numColors - 1) {
    return color(colorPickers[numColors - 1].value());
  }
  
  let c1 = color(colorPickers[index].value());
  let c2 = color(colorPickers[index + 1].value());
  
  return lerpColor(c1, c2, amt);
}

function drawAdvancedRaster() {
  if (!img) return;
  
  let scaleVal = int(sliderScale.value());
  let threshVal = sliderThreshold.value();
  let spacing = sliderSpacing.value();
  let stepSize = scaleVal * spacing;
  
  noStroke();
  
  for (let y = 0; y < img.height; y += stepSize) {
    for (let x = 0; x < img.width; x += stepSize) {
      
      let index = (int(x) + int(y) * img.width) * 4;
      let r = img.pixels[index];
      let g = img.pixels[index + 1];
      let b = img.pixels[index + 2];
      
      let bright = (r + g + b) / 3;
      
      let gradientColor = getGradientColor(bright);
      fill(gradientColor); 
      
      let size = map(bright, 0, 255, scaleVal * threshVal, 0);
      
      if (size > 0.5) {
        push();
        translate(x + stepSize/2, y + stepSize/2);
        drawShape(currentShape, size);
        pop();
      }
    }
  }
}

function drawShape(shape, size) {
  if (shape === 'circle') {
    circle(0, 0, size);
  } else if (shape === 'square') {
    rectMode(CENTER);
    square(0, 0, size * 0.8);
  } else if (shape === 'triangle') {
    let h = size * 0.866;
    triangle(0, -h/2, -size/2, h/2, size/2, h/2);
  } else if (shape === 'hexagon') {
    beginShape();
    for (let i = 0; i < 6; i++) {
      let angle = TWO_PI / 6 * i;
      let hx = cos(angle) * size/2;
      let hy = sin(angle) * size/2;
      vertex(hx, hy);
    }
    endShape(CLOSE);
  } else if (shape === 'diamond') {
    quad(0, -size/2, size/2, 0, 0, size/2, -size/2, 0);
  } else if (shape === 'cross') {
    let w = size * 0.3;
    rectMode(CENTER);
    rect(0, 0, w, size);
    rect(0, 0, size, w);
  } else {
    circle(0, 0, size);
  }
}

function extractColorsFromImage() {
  let samples = [];
  let step = max(floor(img.width / 20), floor(img.height / 20), 10);
  
  for (let y = 0; y < img.height; y += step) {
    for (let x = 0; x < img.width; x += step) {
      let index = (x + y * img.width) * 4;
      let r = img.pixels[index];
      let g = img.pixels[index + 1];
      let b = img.pixels[index + 2];
      samples.push({ r: r, g: g, b: b });
    }
  }
  
  samples.sort((a, b) => {
    let brightA = (a.r + a.g + a.b) / 3;
    let brightB = (b.r + b.g + b.b) / 3;
    return brightA - brightB;
  });
  
  for (let i = 0; i < 8; i++) {
    let idx = floor(map(i, 0, 7, 0, samples.length - 1));
    let c = samples[idx];
    let hexColor = rgbToHex(c.r, c.g, c.b);
    colorPickers[i].value(hexColor);
  }
}

function rgbToHex(r, g, b) {
  return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

function componentToHex(c) {
  let hex = Math.round(c).toString(16);
  return hex.length == 1 ? "0" + hex : hex;
}

function resetImage() {
  if (img) {
    document.getElementById('upload-panel').style.display = 'flex';
    document.getElementById('control-panel').style.display = 'none';
    showUpload = true;
    img = null;
    redraw();
  }
}

function exportImage() {
  let scale = 2;
  let tempCanvas = createGraphics(img.width * scale, img.height * scale);
  tempCanvas.pixelDensity(1);
  
  if (bgColor === 'transparent') {
    tempCanvas.clear();
  } else if (bgColor === 'black') {
    tempCanvas.background(0);
  } else {
    tempCanvas.background(255);
  }
  
  let scaleVal = int(sliderScale.value()) * scale;
  let threshVal = sliderThreshold.value();
  let spacing = sliderSpacing.value(); 
  let stepSize = scaleVal * spacing;
  
  tempCanvas.noStroke();
  
  for (let y = 0; y < img.height * scale; y += stepSize) {
    for (let x = 0; x < img.width * scale; x += stepSize) {
      let imgX = floor(x / scale);
      let imgY = floor(y / scale);
      let index = (imgX + imgY * img.width) * 4;
      let r = img.pixels[index];
      let g = img.pixels[index + 1];
      let b = img.pixels[index + 2];
      let bright = (r + g + b) / 3;
      
      let gradientColor = getGradientColor(bright);
      tempCanvas.fill(gradientColor);
      
      let size = map(bright, 0, 255, scaleVal * threshVal, 0);
      
      if (size > 0.5) {
        tempCanvas.push();
        tempCanvas.translate(x + stepSize/2, y + stepSize/2);
        
        if (currentShape === 'circle') {
          tempCanvas.circle(0, 0, size);
        } else if (currentShape === 'square') {
          tempCanvas.rectMode(CENTER);
          tempCanvas.square(0, 0, size * 0.8);
        } else if (currentShape === 'triangle') {
          let h = size * 0.866;
          tempCanvas.triangle(0, -h/2, -size/2, h/2, size/2, h/2);
        } else if (currentShape === 'hexagon') {
          tempCanvas.beginShape();
          for (let i = 0; i < 6; i++) {
            let angle = TWO_PI / 6 * i;
            let hx = cos(angle) * size/2;
            let hy = sin(angle) * size/2;
            tempCanvas.vertex(hx, hy);
          }
          tempCanvas.endShape(CLOSE);
        } else if (currentShape === 'diamond') {
          tempCanvas.quad(0, -size/2, size/2, 0, 0, size/2, -size/2, 0);
        } else if (currentShape === 'cross') {
          let w = size * 0.3;
          tempCanvas.rectMode(CENTER);
          tempCanvas.rect(0, 0, w, size);
          tempCanvas.rect(0, 0, size, w);
        }
        
        tempCanvas.pop();
      }
    }
  }
  
  let timestamp = year() + "-" + month() + "-" + day() + "_" + hour() + minute();
  save(tempCanvas, 'Raster_Gradient_' + timestamp + '.png');
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  if (!showUpload) {
    redraw();
  }
}