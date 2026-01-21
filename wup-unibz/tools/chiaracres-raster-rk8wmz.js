let appState = 0;
let startButton, t = 0;      
const GRID_SPACING = 20, DISTORTION_FORCE = 40, ANIMATION_SPEED = 0.005; 

let img; 
let formatSelect, rasterTypeSelect;
let densitySlider, sizeSlider, thresholdSlider, numColorsSlider;
let inkColorPicker, bgColorPicker, warholCb;
let saveButton, saveGifButton; 

let pColorPickers = []; 
let pStyleSelectors = []; 
let pCutSliders = []; 
let pulseColorContainer;

const SIDEBAR_WIDTH = 240, GAP = 20;
let currentW = 600, currentH = 600; 

function setup() {
  createCanvas(windowWidth, windowHeight);
  setupStartButton();
  textAlign(CENTER, CENTER);
  pixelDensity(1); 
}

function draw() {
  if (appState === 0) {
    background(255); 
    drawWavyGrid(); 
    drawStartUI();
  } else {
    if (!img) {
        background(240);
        fill(100);
        textSize(16);
        text("Please upload an image to start", width/2 + SIDEBAR_WIDTH/2, height/2);
        return;
    }
    
    background(240); 
    let globalTime = frameCount * 0.05;
    let globalPulse = map(sin(globalTime), -1, 1, 0.4, 1.2);

    let availableW = width - (SIDEBAR_WIDTH + GAP + 60);
    let availableH = height - 60;
    let canvasX = SIDEBAR_WIDTH + GAP + 30;
    let canvasY = 30;

    if (warholCb.checked()) {
      drawWarholGrid(this, availableW, availableH, canvasX, canvasY, globalPulse, globalTime, 1.0);
    } else {
      render(this, 1.0, availableW, availableH, null, null, canvasX, canvasY, globalPulse, globalTime);
    }
  }
}

// --- HOME SCREEN ---
function drawStartUI() { 
  fill(0); 
  noStroke(); 
  textSize(50); 
  text('THE BEST', width/2, height/2 - 35); 
  text('Image Rasterizer', width/2, height/2 + 35); 
}

function drawWavyGrid() { 
  stroke(0, 30); noFill(); t += ANIMATION_SPEED; 
  for (let x = 0; x <= width; x += GRID_SPACING) { 
    beginShape(); 
    for (let y = 0; y <= height; y += 15) { 
      let distortion = map(noise(x * 0.005, y * 0.005, t), 0, 1, -DISTORTION_FORCE, DISTORTION_FORCE);
      vertex(x + distortion, y); 
    } 
    endShape(); 
  } 
}

// --- WARHOL ---
function drawWarholGrid(target, totalW, totalH, startX, startY, p, t, sFactor) {
  let w = totalW / 2; let h = totalH / 2;
  let type = rasterTypeSelect.value();
  
  let pal = [
    {i:{r:255,g:0,b:255},b:{r:255,g:255,b:0}}, 
    {i:{r:0,g:255,b:255},b:{r:255,g:0,b:0}}, 
    {i:{r:255,g:255,b:0},b:{r:0,g:0,b:255}}, 
    {i:{r:0,g:255,b:0},b:{r:128,g:0,b:128}}
  ];

  let bgOverride = null;
  if (type === 'Wavy Distortion') {
    let c = bgColorPicker.color();
    bgOverride = {r: red(c), g: green(c), b: blue(c)};
  }

  render(target, sFactor, w, h, pal[0].i, bgOverride || pal[0].b, startX, startY, p, t); 
  render(target, sFactor, w, h, pal[1].i, bgOverride || pal[1].b, startX + w, startY, p, t); 
  render(target, sFactor, w, h, pal[2].i, bgOverride || pal[2].b, startX, startY + h, p, t); 
  render(target, sFactor, w, h, pal[3].i, bgOverride || pal[3].b, startX + w, startY + h, p, t);
}

// --- ENGINE DI RENDERING ---
function render(target, scaleFactor, boxW, boxH, overrideInk, overrideBg, offX, offY, pulseVal, timeVal) {
  let type = rasterTypeSelect.value();
  let den = densitySlider.value() * scaleFactor; 
  let sz = sizeSlider.value();
  let thresh = thresholdSlider.value();
  
  let cInk = overrideInk ? color(overrideInk.r, overrideInk.g, overrideInk.b) : inkColorPicker.color();
  let cBg = overrideBg ? color(overrideBg.r, overrideBg.g, overrideBg.b) : bgColorPicker.color();
  
  target.push();
  target.translate(offX, offY);

  target.drawingContext.save();
  target.noStroke();
  target.fill(cBg);
  target.rect(0, 0, boxW, boxH); 
  target.drawingContext.clip(); 

  let imgAspect = img.width / img.height;
  let dW = (imgAspect > boxW/boxH) ? boxW : boxH * imgAspect;
  let dH = (imgAspect > boxW/boxH) ? boxW / imgAspect : boxH;
  let sX = (boxW - dW) / 2, sY = (boxH - dH) / 2;

  if (type === 'Wavy Distortion') {
    target.stroke(cInk); target.strokeWeight(sz * scaleFactor * 2); target.noFill();
    for (let y = 0; y < dH; y += den) {
      target.beginShape();
      for (let x = 0; x < dW; x += 5 * scaleFactor) {
        let ix = floor(map(x, 0, dW, 0, img.width-1));
        let iy = floor(map(y, 0, dH, 0, img.height-1));
        let bri = getBri(ix, iy);
        let offset = map(bri, 0, 255, den, 0) * sz;
        target.vertex(sX + x, sY + y + sin(x * (0.05/scaleFactor) + timeVal * 2) * offset);
      }
      target.endShape();
    }
  } else {
    for (let y = 0; y < dH; y += den) {
      for (let x = 0; x < dW; x += den) {
        let ix = floor(map(x, 0, dW, 0, img.width-1));
        let iy = floor(map(y, 0, dH, 0, img.height-1));
        let bri = getBri(ix, iy);

        if (bri < thresh) {
          let posX = sX + x + den/2;
          let posY = sY + y + den/2;
          let size = (den * 0.7) * pulseVal * sz;

          if (type === 'Dynamic Hybrid Raster') {
            let n = numColorsSlider.value();
            let xRatio = x / dW;
            let boundaries = [0];
            for(let i=0; i<n-1; i++) boundaries.push(pCutSliders[i].value());
            boundaries.push(1.0); boundaries.sort((a, b) => a - b);

            let segIdx = 0;
            for(let i=0; i<n; i++) { if(xRatio >= boundaries[i] && xRatio <= boundaries[i+1]) { segIdx = i; break; } }

            let amt = map(xRatio, boundaries[segIdx], boundaries[segIdx+1], 0, 1);
            let dotColor = lerpColor(pColorPickers[segIdx].color(), (segIdx < n - 1 ? pColorPickers[segIdx+1].color() : pColorPickers[segIdx].color()), amt);
            let selectedStyle = pStyleSelectors[segIdx].value();

            target.fill(overrideInk ? cInk : dotColor); target.stroke(overrideInk ? cInk : dotColor);
            target.push(); target.translate(posX, posY); drawSelectedStyle(target, selectedStyle, size, timeVal, x); target.pop();

          } else if (type === 'Dot Raster') {
            target.fill(cInk); target.noStroke();
            target.circle(posX, posY, map(bri, 0, thresh, den * sz, 1 * scaleFactor));
          } else if (type === 'Grainy Film') {
            target.fill(cInk); target.noStroke();
            target.rect(posX + random(-2,2), posY + random(-2,2), 2*scaleFactor, 2*scaleFactor);
          }
        }
      }
    }
  }
  target.drawingContext.restore();
  target.pop();
}

function drawSelectedStyle(t, style, sz, time, globalX) {
  if (style === 'Dots') { t.noStroke(); t.circle(0, 0, sz); }
  else if (style === 'Squares') { t.noStroke(); t.rectMode(CENTER); t.rect(0, 0, sz, sz); }
  else if (style === 'Grainy') { t.noStroke(); t.rect(random(-2,2), random(-2,2), sz*0.5, sz*0.5); }
  else if (style === 'Wavy') { t.noFill(); t.strokeWeight(sz * 0.3); let w = sin(globalX * 0.05 + time * 2) * sz; t.line(-sz/2, w, sz/2, w); }
  else if (style === 'Cross') { t.noFill(); t.strokeWeight(sz * 0.2); t.line(-sz/2, 0, sz/2, 0); t.line(0, -sz/2, 0, sz/2); }
}

function getBri(ix, iy) {
  let idx = (ix + iy * img.width) * 4;
  return img.pixels[idx]*0.299 + img.pixels[idx+1]*0.587 + img.pixels[idx+2]*0.114;
}

// --- INTERFACCIA ---
function setupMainAppInterface() {
  let sidebar = createDiv().position(20, 20).style('width', SIDEBAR_WIDTH + 'px').style('background', '#f4f4f4').style('padding', '15px').style('border-radius', '8px').style('box-shadow', '0 4px 10px rgba(0,0,0,0.1)');
  
  createSpan('1. Format').parent(sidebar);
  formatSelect = createSelect().parent(sidebar).style('width', '100%').style('margin-bottom', '10px');
  formatSelect.option('1:1 (Square)'); formatSelect.option('2:3 (Portrait)');
  
  createDiv('2. Image').parent(sidebar);
  createFileInput(handleFile).parent(sidebar);

  createDiv('3. Style').parent(sidebar);
  rasterTypeSelect = createSelect().parent(sidebar).style('width', '100%');
  rasterTypeSelect.option('Dot Raster'); rasterTypeSelect.option('Grainy Film'); rasterTypeSelect.option('Wavy Distortion'); rasterTypeSelect.option('Dynamic Hybrid Raster'); 
  rasterTypeSelect.changed(onTypeChanged);

  densitySlider = makeControl('Density', 2, 60, 15, 1, sidebar);
  sizeSlider = makeControl('Size / Stroke', 0.1, 2.5, 0.8, 0.1, sidebar);
  thresholdSlider = makeControl('Threshold', 0, 255, 127, 1, sidebar);

  createDiv('4. Global Colors').parent(sidebar).style('margin-top', '10px');
  inkColorPicker = createColorPicker('#000000').parent(sidebar).style('width', '100%');
  bgColorPicker = createColorPicker('#ffffff').parent(sidebar).style('width', '100%');

  pulseColorContainer = createDiv().parent(sidebar).style('margin-top','10px').style('padding','10px').style('background','#e0e0e0').style('display','none').style('border-radius','5px');
  numColorsSlider = makeControl('Hybrid Slots', 1, 5, 2, 1, pulseColorContainer);
  numColorsSlider.input(updateVisiblePickers);

  for (let i = 0; i < 5; i++) {
    let group = createDiv().parent(pulseColorContainer).style('margin-top','8px').style('border-top', '1px solid #ccc');
    let cp = createColorPicker(color(random(255), random(255), random(255))).parent(group).style('width','45%').style('display','inline-block');
    let sel = createSelect().parent(group).style('width','50%').style('display','inline-block').style('margin-left','5%');
    sel.option('Dots'); sel.option('Squares'); sel.option('Grainy'); sel.option('Wavy'); sel.option('Cross');
    sel.selected(i === 0 ? 'Dots' : i === 1 ? 'Squares' : i === 2 ? 'Wavy' : i === 3 ? 'Grainy' : 'Cross');
    pColorPickers.push(cp); pStyleSelectors.push(sel);
    group.style('display','none');
  }

  createDiv('Choose the Cuts').parent(pulseColorContainer).style('margin-top','10px').style('font-size','11px');
  for (let i = 0; i < 4; i++) {
    let s = createSlider(0, 1, (i + 1) * 0.2, 0.01).parent(pulseColorContainer).style('width','100%');
    pCutSliders.push(s); s.style('display','none');
  }

  warholCb = createCheckbox(' Warhol Mode', false).parent(sidebar).changed(() => redraw());
  
  createDiv('Export').parent(sidebar).style('margin-top','10px');
  saveButton = createButton('SAVE PNG').parent(sidebar).style('width','100%').mousePressed(() => save('raster_art.png'));
  saveGifButton = createButton('SAVE GIF (5s)').parent(sidebar).style('width','100%').style('margin-top','5px').style('background','#FF5722').style('color','white').style('display','none');
  saveGifButton.mousePressed(() => {
    saveGif('raster_hybrid_anim', 5, {units: "frames", delay: 0, subRect: [SIDEBAR_WIDTH + GAP + 30, 30, width - (SIDEBAR_WIDTH + GAP + 60), height - 60]});
  });

  updateVisiblePickers();
  updateCanvasSize();
}

function updateVisiblePickers() {
  let n = numColorsSlider.value();
  for (let i = 0; i < 5; i++) pStyleSelectors[i].elt.parentNode.style.display = i < n ? 'block' : 'none';
  for (let i = 0; i < 4; i++) pCutSliders[i].style('display', i < n - 1 ? 'block' : 'none');
}

function onTypeChanged() {
  let type = rasterTypeSelect.value();
  let isAnimated = type === 'Dynamic Hybrid Raster' || type === 'Wavy Distortion';
  pulseColorContainer.style('display', type === 'Dynamic Hybrid Raster' ? 'block' : 'none');
  saveGifButton.style('display', isAnimated ? 'block' : 'none');
  if (isAnimated) loop(); else { noLoop(); redraw(); }
}

function makeControl(label, min, max, val, step, parent) {
  createDiv(label).parent(parent).style('font-size', '11px').style('margin-top','5px');
  let s = createSlider(min, max, val, step).parent(parent).style('width', '100%');
  s.input(() => { if (rasterTypeSelect.value() !== 'Dynamic Hybrid Raster' && rasterTypeSelect.value() !== 'Wavy Distortion') redraw(); }); 
  return s;
}

function launchMainApp() { startButton.remove(); appState = 1; setupMainAppInterface(); }
function handleFile(f) { if (f.type === 'image') img = loadImage(f.data, () => { img.loadPixels(); redraw(); }); }
function updateCanvasSize() { resizeCanvas(windowWidth, windowHeight); }
function setupStartButton() { startButton = createButton('START RASTERIZER').position(width/2 - 80, height/2 + 110).mousePressed(launchMainApp); }