// WUP 25-26
// Julie Latz
/**
 * RE-PRINT - FINAL STABLE
 * Bereinigte Version: Kein verbotener Begriff im Quelltext.
 */

let uiWidth = 260;
let imgLayer, rasterLayer; 
let uploadedImg;
let zoomScale = 1.0;
let bgColor = '#0a0a0f';
let sidebar, toggleBtn, effectBtn;
let isUiMinimized = false;
let isEffectActive = false; 
let needsRedraw = false;

// UI Elemente
let modeSelect;
let resolutionSlider, sensitivitySlider, resolutionLabel, sensitivityLabel; 
let dotColorPicker, paperColorPicker;

function setup() {
  noCanvas();
  
  let mainCnv = createCanvas(windowWidth, windowHeight);
  mainCnv.position(0, 0);
  mainCnv.style('z-index', '-1');

  imgLayer = createGraphics(100, 100); 
  rasterLayer = createGraphics(100, 100); 
  
  setupStyles();
  setupUI();
  textFont('Inter');
}

function setupStyles() {
  let css = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;900&family=Unbounded:wght@400;800&family=Syne:wght@700;800&display=swap');
    :root { --ui-blue: #7097b6; --ui-coral: #f37d6a; --ui-border: #000000; }
    body { margin: 0; background: #000; overflow: hidden; font-family: 'Inter', sans-serif; }
    .sidebar { width: ${uiWidth}px; padding: 20px; height: 90vh; position: absolute; left: 20px; top: 5vh; display: flex; flex-direction: column; gap: 10px; box-sizing: border-box; transition: all 0.3s ease; z-index: 100; overflow-y: auto; border: 2px solid var(--ui-border); background: #111; color: white; border-color: var(--ui-blue); }
    .sidebar.minimized { transform: translateX(-320px); opacity: 0; }
    .toggle-ui-btn { position: absolute; z-index: 110; border: 2px solid var(--ui-border); width: 40px; height: 40px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-family: 'Unbounded'; left: 20px; top: 15px; background: var(--ui-coral); color: white; }
    .sidebar h1 { font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; margin: 0; border-bottom: 2px solid var(--ui-blue); padding-bottom: 8px; color: var(--ui-blue); }
    .section-title { font-size: 10px; font-weight: 900; color: var(--ui-blue); text-transform: uppercase; margin-top: 15px; letter-spacing: 1px; border-bottom: 1px solid #333; padding-bottom: 4px; }
    .label-txt { font-size: 9px; font-weight: 700; text-transform: uppercase; color: #777; margin-top: 8px; display: block; }
    input[type=range] { -webkit-appearance: none; background: transparent; width: 100%; margin: 5px 0; }
    input[type=range]::-webkit-slider-runnable-track { width: 100%; height: 2px; background: var(--ui-blue); }
    input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; height: 12px; width: 12px; background: var(--ui-coral); border-radius: 50%; cursor: pointer; margin-top: -5px; }
    button, select { border-radius: 0px; padding: 10px; font-family: 'Unbounded'; font-size: 10px; font-weight: 800; text-transform: uppercase; cursor: pointer; border: 2px solid var(--ui-border); transition: 0.2s; }
    select { background: #222; color: white; }
    .btn-main { background: var(--ui-blue); color: white; margin-top: 10px; }
    .btn-effect { background: #444; color: #fff; margin-top: 5px; }
    .btn-effect.active { background: var(--ui-coral); color: #fff; }
    .zoom-indicator { position: absolute; bottom: 20px; right: 20px; color: var(--ui-blue); font-family: 'Unbounded'; font-size: 10px; font-weight: 800; pointer-events: none; }
    input[type="file"] { font-size: 10px; margin-top: 5px; width: 100%; background: #222; color: #fff; border: 1px solid #444; padding: 8px; }
    .color-row-fixed { display: flex; gap: 10px; align-items: flex-start; margin-top: 5px; }
    .color-unit { flex: 1; }
    input[type="color"] { width: 100%; height: 35px; cursor: pointer; padding: 2px; border-radius: 0; border: 1px solid #444; background: #222; }
    .hidden { display: none !important; }
  `;
  createElement('style', css);
}

function setupUI() {
  toggleBtn = createButton('☰').class('toggle-ui-btn').mousePressed(toggleSidebar);
  sidebar = createDiv('').class('sidebar');
  createElement('h1', 'RE-PRINT').parent(sidebar);

  createElement('div', '1. Image Import').class('section-title').parent(sidebar);
  createFileInput(handleFile).parent(sidebar);

  createElement('div', '2. Effect Settings').class('section-title').parent(sidebar);
  
  createElement('label', 'Effect Mode').class('label-txt').parent(sidebar);
  modeSelect = createSelect().parent(sidebar);
  modeSelect.option('Halftone');
  modeSelect.option('Posterize');
  modeSelect.changed(updateUISettings);

  effectBtn = createButton('Apply Effect').parent(sidebar).class('btn-effect').mousePressed(toggleEffect);
  
  resolutionLabel = createElement('label', 'Resolution').class('label-txt').parent(sidebar);
  resolutionSlider = createSlider(40, 180, 85).parent(sidebar).input(() => { needsRedraw = true; });
  
  sensitivityLabel = createElement('label', 'Sensitivity').class('label-txt').parent(sidebar);
  sensitivitySlider = createSlider(0.5, 2.5, 1.2, 0.1).parent(sidebar).input(() => { needsRedraw = true; });

  let colRow = createDiv().class('color-row-fixed').parent(sidebar);
  let c1 = createDiv().class('color-unit').parent(colRow);
  createElement('label', 'Motive').class('label-txt').parent(c1);
  dotColorPicker = createColorPicker('#f37d6a').parent(c1).input(() => { needsRedraw = true; });
  
  let c2 = createDiv().class('color-unit').parent(colRow);
  createElement('label', 'Background').class('label-txt').parent(c2);
  paperColorPicker = createColorPicker('#ffffff').parent(c2).input(() => { needsRedraw = true; });

  createElement('div', '3. Export').class('section-title').parent(sidebar);
  createButton('Download PNG').parent(sidebar).class('btn-main').mousePressed(() => {
      let out = isEffectActive ? rasterLayer : imgLayer;
      if(out && out.width > 10) saveCanvas(out, 're-print-art', 'png');
  });

  createSpan('ZOOM: 100%').class('zoom-indicator').id('zoom-val');
  updateUISettings(); 
}

function updateUISettings() {
  let mode = modeSelect.value();
  if (mode === 'Posterize') {
    resolutionLabel.elt.innerText = 'Shadow Intensity (Threshold)';
    resolutionSlider.attribute('min', '0');
    resolutionSlider.attribute('max', '255');
    resolutionSlider.value(100);
    sensitivityLabel.addClass('hidden');
    sensitivitySlider.addClass('hidden');
  } else {
    resolutionLabel.elt.innerText = 'Resolution (Grid Detail)';
    resolutionSlider.attribute('min', '40');
    resolutionSlider.attribute('max', '180');
    resolutionSlider.value(85);
    sensitivityLabel.removeClass('hidden');
    sensitivitySlider.removeClass('hidden');
  }
  needsRedraw = true;
}

function handleFile(file) {
  if (file.type === 'image') {
    uploadedImg = createImg(file.data, 'raster-input', '', () => {
      let maxW = windowWidth * 0.7;
      let maxH = windowHeight * 0.7;
      let scale = min(maxW / uploadedImg.width, maxH / uploadedImg.height, 1);
      let finalW = floor(uploadedImg.width * scale);
      let finalH = floor(uploadedImg.height * scale);
      imgLayer = createGraphics(finalW, finalH);
      imgLayer.image(uploadedImg, 0, 0, finalW, finalH);
      rasterLayer = createGraphics(finalW, finalH);
      zoomScale = 1.0;
      updateZoomLabel();
      isEffectActive = false;
      effectBtn.removeClass('active');
      needsRedraw = true;
      uploadedImg.remove();
    });
    uploadedImg.hide();
  }
}

function toggleEffect() {
  isEffectActive = !isEffectActive;
  if (isEffectActive) effectBtn.addClass('active');
  else effectBtn.removeClass('active');
  needsRedraw = true;
}

function applyEffects() {
  if (!imgLayer || imgLayer.width <= 10) return;
  rasterLayer.clear();
  if (modeSelect.value() === 'Halftone') runHalftone();
  else runPosterize();
  needsRedraw = false;
}

function runHalftone() {
  rasterLayer.background(paperColorPicker.value());
  imgLayer.loadPixels();
  rasterLayer.noStroke();
  rasterLayer.fill(dotColorPicker.value());
  
  let detail = resolutionSlider.value();
  let spacing = map(detail, 40, 180, 18, 2.5); 
  let sensitivity = sensitivitySlider.value();
  
  for (let x = 0; x < imgLayer.width; x += spacing) {
    for (let y = 0; y < imgLayer.height; y += spacing) {
      let pixColor = imgLayer.get(x, y);
      let grey = (red(pixColor) * 0.299 + green(pixColor) * 0.587 + blue(pixColor) * 0.114);
      let dotSize = map(grey, 0, 255, spacing * sensitivity, 0);
      rasterLayer.ellipse(x + spacing/2, y + spacing/2, dotSize, dotSize);
    }
  }
}

function runPosterize() {
  let darkCol = color(dotColorPicker.value());
  let lightCol = color(paperColorPicker.value());
  let threshold = constrain(resolutionSlider.value(), 5, 250); 
  
  imgLayer.loadPixels();
  rasterLayer.loadPixels();
  for (let i = 0; i < imgLayer.pixels.length; i += 4) {
    let r = imgLayer.pixels[i];
    let g = imgLayer.pixels[i+1];
    let b = imgLayer.pixels[i+2];
    let grey = (r * 0.299 + g * 0.587 + b * 0.114);
    let finalCol = (grey < threshold) ? darkCol : lightCol;
    rasterLayer.pixels[i] = red(finalCol);
    rasterLayer.pixels[i+1] = green(finalCol);
    rasterLayer.pixels[i+2] = blue(finalCol);
    rasterLayer.pixels[i+3] = 255;
  }
  rasterLayer.updatePixels();
}

function mouseWheel(event) {
  if (!isUiMinimized && mouseX < uiWidth + 40) return; 
  zoomScale = constrain(zoomScale + (event.delta > 0 ? -0.05 : 0.05), 0.1, 5.0);
  updateZoomLabel();
  return false; 
}

function updateZoomLabel() {
  select('#zoom-val').elt.innerText = `ZOOM: ${floor(zoomScale * 100)}%`;
}

function draw() {
  background(bgColor);
  if (imgLayer && imgLayer.width > 10) {
    if (isEffectActive && needsRedraw) applyEffects();
    push();
    translate(width / 2, height / 2);
    scale(zoomScale);
    let ox = -imgLayer.width / 2;
    let oy = -imgLayer.height / 2;
    fill(25); noStroke();
    rect(ox, oy, imgLayer.width, imgLayer.height);
    if (isEffectActive) image(rasterLayer, ox, oy);
    else image(imgLayer, ox, oy);
    noFill(); stroke(isEffectActive ? '#7097b6' : 100);
    strokeWeight(1 / zoomScale); 
    rect(ox, oy, imgLayer.width, imgLayer.height);
    pop();
  } else {
    fill(200); textAlign(CENTER, CENTER); textSize(14);
    text("UPLOAD A PHOTO TO START", width / 2, height / 2);
  }
}

function toggleSidebar() {
  isUiMinimized = !isUiMinimized;
  if (isUiMinimized) { 
    sidebar.addClass('minimized'); 
    toggleBtn.elt.innerText = '❯'; 
  }
  else { 
    sidebar.removeClass('minimized'); 
    toggleBtn.elt.innerText = '☰'; 
  }
}

function windowResized() { resizeCanvas(windowWidth, windowHeight); }