// WUP 25-26
// Annalena Psenner
let img;
let densitySlider, sizeSlider, contrastSlider, animSpeedSlider, shiftSlider, wavePeriodSlider; 
let shapeSelect, invertToggle, modeSelect;
let canvas, isLoaded = false;
let imgOffset = { x: 0, y: 0 };
let toolbar;

function setup() {
  toolbar = createDiv('');
  styleToolbar(toolbar);
  buildUI();

  canvas = createCanvas(windowWidth, windowHeight - 90);
  canvas.position(0, 90);
  canvas.drop(handleFile);
}

function buildUI() {
  toolbar.html('');
  let isIllusion = modeSelect ? modeSelect.value() === 'OPTICAL ILLUSION' : false;
  let themeColor = isIllusion ? '#ffffff' : '#00ff88'; 
  toolbar.style('border-bottom', `2px solid ${themeColor}`);

  let topRow = createDiv('').parent(toolbar).style('display','flex').style('align-items','center').style('width','100%').style('margin-bottom','8px');
  let title = createSpan(isIllusion ? 'OPTIC // WAVE' : 'RASTER // IMAGE').parent(topRow);
  title.style('font-weight', '900').style('color', themeColor).style('font-size', '14px').style('margin-right', '20px');

  if (!modeSelect) {
    modeSelect = createSelect().parent(topRow);
    modeSelect.option('IMAGE RASTER');
    modeSelect.option('OPTICAL ILLUSION');
    modeSelect.changed(() => { buildUI(); });
  } else { modeSelect.parent(topRow); }
  styleSelect(modeSelect, themeColor);
  
  shapeSelect = createSelect().parent(topRow);
  ['CIRCLES', 'SQUARES'].forEach(o => shapeSelect.option(o));
  styleSelect(shapeSelect, themeColor);

  let saveBtn = createButton('EXPORT PNG').parent(topRow);
  styleButton(saveBtn, themeColor);
  saveBtn.mousePressed(() => saveCanvas('raster_output', 'png'));

  let bottomRow = createDiv('').parent(toolbar).style('display','flex').style('align-items','center').style('width','100%');
  
  createControl(bottomRow, 'DENSITY', 60, 400, 180, (s) => densitySlider = s);
  createControl(bottomRow, 'SIZE', 0.5, 4.0, 1.5, (s) => sizeSlider = s);
  
  if (!isIllusion) {
    createControl(bottomRow, 'CONTRAST', 1.0, 5.0, 2.0, (s) => contrastSlider = s);
  } else {
    createControl(bottomRow, 'WAVE SCALE', 0.01, 0.2, 0.05, (s) => wavePeriodSlider = s);
    // FIXED: Changed variable name to animSpeedSlider
    createControl(bottomRow, 'SPEED', 0, 10, 3, (s) => animSpeedSlider = s);
  }
  
  createControl(bottomRow, 'RGB SHIFT', 0, 15, 1.5, (s) => shiftSlider = s);
  invertToggle = createCheckbox(' DARK', true).parent(bottomRow);
  styleCheckbox(invertToggle);
}

function draw() {
  // Safety check: Don't run draw if UI is partially built
  if (!modeSelect || !shapeSelect || !densitySlider) return; 
  
  let isIllusion = modeSelect.value() === 'OPTICAL ILLUSION';
  let isDark = invertToggle.checked();
  background(isDark ? 0 : 255);

  let step = floor(map(densitySlider.value(), 60, 400, 30, 3));
  let shift = shiftSlider.value();
  let shapeType = shapeSelect.value();

  if (isIllusion || (isLoaded && img)) {
    if (!isIllusion) img.loadPixels();

    let startX = isIllusion ? 0 : floor(imgOffset.x);
    let endX = isIllusion ? width : floor(imgOffset.x + img.width);
    let startY = isIllusion ? 0 : floor(imgOffset.y);
    let endY = isIllusion ? height : floor(imgOffset.y + img.height);

    for (let y = startY; y < endY; y += step) {
      for (let x = startX; x < endX; x += step) {
        let r, g, b, val;
        
        if (isIllusion) {
          let d = dist(x, y, width/2, height/2);
          let wScale = wavePeriodSlider ? wavePeriodSlider.value() : 0.05;
          // FIXED: Using animSpeedSlider instead of speed
          let currentSpeed = animSpeedSlider ? animSpeedSlider.value() * 0.05 : 0.15;
          val = map(sin(d * wScale - frameCount * currentSpeed), -1, 1, 0, 1);
          r = 255; g = 255; b = 255;
        } else {
          let imgX = floor(map(x, imgOffset.x, imgOffset.x + img.width, 0, img.width));
          let imgY = floor(map(y, imgOffset.y, imgOffset.y + img.height, 0, img.height));
          let pix = img.get(imgX, imgY);
          r = red(pix); g = green(pix); b = blue(pix);
          val = isDark ? (r + g + b) / 765 : 1 - (r + g + b) / 765;
          // Contrast check
          let cVal = contrastSlider ? contrastSlider.value() : 2.0;
          val = pow(val, cVal);
        }

        let diameter = val * step * sizeSlider.value();
        if (diameter < 0.5) continue;

        push();
        translate(x, y);
        blendMode(isDark ? ADD : MULTIPLY);
        renderRasterShape(shapeType, diameter, r, g, b, shift);
        pop();
      }
    }
  } else {
    drawPlaceholder();
  }
}

function renderRasterShape(type, d, r, g, b, shift) {
  noStroke();
  if (type === 'SQUARES') {
    rectMode(CENTER);
    fill(r, 0, 0, 200); rect(-shift, 0, d, d);
    fill(0, g, 0, 200); rect(0, 0, d, d);
    fill(0, 0, b, 200); rect(shift, 0, d, d);
  } else {
    fill(r, 0, 0, 200); ellipse(-shift, 0, d, d);
    fill(0, g, 0, 200); ellipse(0, 0, d, d);
    fill(0, 0, b, 200); ellipse(shift, 0, d, d);
  }
}

// --- STANDARD HELPERS (No changes needed) ---
function handleFile(file) {
  if (file.type === 'image') {
    loadImage(file.data, (loadedImg) => {
      img = loadedImg;
      calculateImageLayout();
      isLoaded = true;
    });
  }
}

function calculateImageLayout() {
  if (!img) return;
  let scale = min(width / img.width, height / img.height);
  img.resize(img.width * scale, img.height * scale);
  imgOffset.x = (width - img.width) / 2;
  imgOffset.y = (height - img.height) / 2;
}

function createControl(parent, label, min, max, val, assignTo) {
  let g = createDiv('').parent(parent).style('margin-right', '15px').style('display', 'flex').style('align-items', 'center');
  createSpan(label).parent(g).style('font-size', '8px').style('color', '#888').style('margin-right', '5px').style('font-weight', 'bold');
  let s = createSlider(min, max, val, 0.001).parent(g);
  s.style('width', '60px');
  assignTo(s);
}

function styleToolbar(el) {
  el.style('display','flex').style('flex-direction','column').style('justify-content','center')
    .style('background','#000').style('padding','0 25px').style('height', '90px')
    .style('position','fixed').style('top','0').style('width','100%').style('z-index','99');
}

function styleSelect(sel, col) {
  sel.style('background','#111').style('color', col).style('border',`1px solid ${col}`).style('padding','4px').style('margin-right', '10px').style('font-size','10px');
}

function styleButton(btn, col) {
  btn.style('background', col).style('color','#000').style('border','none').style('padding','6px 12px').style('font-weight', '900').style('font-size', '10px').style('margin-left','auto').style('cursor', 'pointer');
}

function styleCheckbox(cb) { cb.style('font-size','9px').style('color','#888').style('font-weight', 'bold'); }

function drawPlaceholder() {
  textAlign(CENTER, CENTER); fill(150); textSize(12); text("[ DROP IMAGE TO RECONSTRUCT ]", width/2, height/2);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight - 90);
  if (isLoaded && img) calculateImageLayout();
}


