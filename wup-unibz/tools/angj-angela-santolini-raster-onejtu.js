// WUP 25 - 26
// Angela Santolini
let appState = 0;
let startButton, t = 0;               
const GRID_SPACING = 20, DISTORTION_FORCE = 40, ANIMATION_SPEED = 0.005; 

let img, video;
let isVideo = false;
let rasterTypeSelect, blendModeSelect;
let densitySlider, sizeSlider, thresholdSlider, noiseSlider;
let inkColorPicker, bgColorPicker, popArtCb, outlineCb; 
let saveButton, camButton, gifButton; 

const SIDEBAR_WIDTH = 260;
let currentW = 424, currentH = 600; 
let isRecording = false; 

function setup() {
  createCanvas(windowWidth, windowHeight);
  setupStartButton();
  textAlign(CENTER, CENTER);
  pixelDensity(1); 
}

function draw() {
  if (appState === 0) {
    background(10); 
    drawWavyGrid(); 
    drawStartUI();
  } else {
    background(15); 
    
    let source = isVideo ? video : img;

    if (!source || (isVideo && source.elt.readyState < 2)) {
        fill(100);
        textSize(16);
        textFont('Georgia');
        text("Awaiting visual input...", width/2 + SIDEBAR_WIDTH/2, height/2);
        return;
    }
    
    source.loadPixels();

    let availableH = height - 100;
    let availableW = availableH / 1.414;
    
    if (availableW > width - (SIDEBAR_WIDTH + 100)) {
        availableW = width - (SIDEBAR_WIDTH + 150);
        availableH = availableW * 1.414;
    }

    let canvasX = SIDEBAR_WIDTH + (width - SIDEBAR_WIDTH - availableW) / 2;
    let canvasY = (height - availableH) / 2;

    push();
    fill(0);
    rect(canvasX + 5, canvasY + 5, availableW, availableH); 
    stroke(255, 20);
    noFill();
    rect(canvasX, canvasY, availableW, availableH); 
    pop();

    if (popArtCb.checked()) {
      drawPopArtGrid(this, availableW, availableH, canvasX, canvasY, frameCount * 0.05, 1.0, source);
    } else {
      render(this, 1.0, availableW, availableH, null, null, canvasX, canvasY, frameCount * 0.05, source);
    }

    if (isRecording) {
      drawRecordingIndicator();
    }
  }
}

function drawRecordingIndicator() {
  push();
  fill(255, 0, 0, sin(frameCount * 0.1) * 127 + 128);
  noStroke();
  ellipse(width - 40, 40, 20, 20);
  fill(255);
  textSize(10);
  textAlign(RIGHT);
  text("RECORDING GIF...", width - 60, 45);
  pop();
}

function recordGif() {
  if (!img && !video) return;
  isRecording = true;
  saveGif('aesthetica_crazy_motion.gif', 5, {
    units: 'seconds',
    delay: 0,
    onComplete: () => isRecording = false
  });
}

function render(target, scaleFactor, boxW, boxH, overrideInk, overrideBg, offX, offY, timeVal, sourceImg) {
  let type = rasterTypeSelect.value();
  let den = densitySlider.value() * scaleFactor; 
  let sz = sizeSlider.value();
  let thresh = thresholdSlider.value();
  let useOutline = outlineCb.checked();
  
  let cInk = overrideInk ? color(overrideInk.r, overrideInk.g, overrideInk.b) : inkColorPicker.color();
  let cBg = overrideBg ? color(overrideBg.r, overrideBg.g, overrideBg.b) : bgColorPicker.color();
  
  target.push();
  target.translate(offX, offY);
  target.fill(cBg); target.noStroke(); target.rect(0, 0, boxW, boxH);
  
  let bm = blendModeSelect.value();
  target.blendMode(eval(bm));

  if (useOutline) {
    target.noFill(); target.stroke(cInk); target.strokeWeight(1 * scaleFactor);
  } else {
    target.noStroke(); target.fill(cInk);
  }

  for (let y = 0; y < boxH; y += den) {
    for (let x = 0; x < boxW; x += den) {
      let ix = floor(map(x, 0, boxW, 0, sourceImg.width-1));
      let iy = floor(map(y, 0, boxH, 0, sourceImg.height-1));
      let idx = (ix + iy * sourceImg.width) * 4;
      let bri = sourceImg.pixels[idx]*0.3 + sourceImg.pixels[idx+1]*0.59 + sourceImg.pixels[idx+2]*0.11;

      if (bri < thresh) {
        if (type === 'Stippling') {
          if (random(255) > bri) target.rect(x, y, sz * 2, sz * 2);
        } else if (type === 'Lines') {
          let lineW = map(bri, 0, thresh, den * sz, 1);
          target.stroke(cInk);
          target.strokeWeight(map(bri, 0, thresh, sz * 2, 0.5));
          target.line(x, y + den/2, x + lineW, y + den/2);
          if (!useOutline) target.noStroke();
        } else if (type === 'Geometric Dot') {
          let circleSize = map(bri, 0, thresh, den * sz, 1);
          target.circle(x + den/2, y + den/2, circleSize);
        } else if (type === 'Fluid Motion') {
          let offset = map(bri, 0, 255, den, 0) * sz;
          let wave = sin(x * 0.05 + timeVal) * offset;
          target.circle(x + den/2, y + den/2 + wave, den * 0.5);
        } else if (type === 'Glitch Mosaic') {
          // --- CRAZY TECHNIQUE ---
          let n = noise(x * 0.01, y * 0.01, timeVal);
          let shift = n * sz * den;
          let w = map(bri, 0, 255, den * sz, 2);
          target.rect(x + shift - (den/2), y + (n * den), w, den * n * 2);
        }
      }
    }
  }
  target.blendMode(BLEND);
  target.pop();

  applyGrain(target, offX, offY, boxW, boxH);
}

function applyGrain(target, x, y, w, h) {
  let intensity = noiseSlider.value();
  if (intensity === 0) return;
  target.loadPixels();
  for (let i = 0; i < target.pixels.length; i += 8) {
    let g = random(-intensity, intensity);
    target.pixels[i] += g;
    target.pixels[i+1] += g;
    target.pixels[i+2] += g;
  }
  target.updatePixels();
}

function setupMainAppInterface() {
  let sidebar = createDiv().position(20, 20).style('width', SIDEBAR_WIDTH + 'px').style('background', '#0a0a0a').style('color', '#888').style('padding', '25px').style('font-family', 'Verdana').style('border', '1px solid #222');
  
  createLabel(sidebar, '01 / SOURCE');
  let btnRow = createDiv().parent(sidebar).style('display', 'flex').style('gap', '10px').style('margin', '10px 0 20px 0');
  createFileInput(handleFile).parent(btnRow).style('font-size', '10px');
  camButton = createButton('CAM').parent(btnRow).style('background', '#111').style('color', '#fff').style('border', '1px solid #333').mousePressed(startCamera);

  createLabel(sidebar, '02 / TECHNIQUE');
  rasterTypeSelect = createSelect().parent(sidebar).style('width', '100%').style('margin', '10px 0');
  rasterTypeSelect.option('Geometric Dot'); 
  rasterTypeSelect.option('Stippling'); 
  rasterTypeSelect.option('Lines'); 
  rasterTypeSelect.option('Fluid Motion');
  rasterTypeSelect.option('Glitch Mosaic'); // CRAZY ADDITION
  rasterTypeSelect.changed(onTypeChanged); 

  densitySlider = makeControl('Resolution', 4, 80, 24, 1, sidebar);
  sizeSlider = makeControl('Element Scale', 0.1, 5.0, 1.0, 0.1, sidebar);
  thresholdSlider = makeControl('Luminance Cut', 0, 255, 128, 1, sidebar);

  createLabel(sidebar, '03 / BLEND ENGINE');
  blendModeSelect = createSelect().parent(sidebar).style('width', '100%').style('margin', '10px 0');
  blendModeSelect.option('BLEND'); blendModeSelect.option('DIFFERENCE');
  blendModeSelect.option('MULTIPLY'); blendModeSelect.option('SCREEN');
  blendModeSelect.option('OVERLAY');
  blendModeSelect.changed(requestRedraw);

  outlineCb = createCheckbox(' Outline Mode', false).parent(sidebar).style('margin-top', '5px').changed(requestRedraw);
  popArtCb = createCheckbox(' Pop Art Mode', false).parent(sidebar).changed(onWarholChanged);

  createLabel(sidebar, '04 / POST-PROCESSING');
  noiseSlider = makeControl('Grain Intensity', 0, 100, 15, 1, sidebar);

  createLabel(sidebar, '05 / PALETTE');
  let colorRow = createDiv().parent(sidebar).style('display', 'flex').style('gap', '10px').style('margin-top', '10px');
  inkColorPicker = createColorPicker('#ffffff').parent(colorRow);
  bgColorPicker = createColorPicker('#000000').parent(colorRow);
  stylePickers([inkColorPicker, bgColorPicker]);

  createDiv('').parent(sidebar).style('margin-top', '30px');
  saveButton = createButton('EXPORT A4 ARTWORK (JPG)').parent(sidebar).style('width', '100%').style('padding', '12px').style('background', '#fff').style('border', 'none').style('font-weight', 'bold').style('margin-bottom', '10px').mousePressed(() => saveHighRes());
  gifButton = createButton('RECORD 5S GIF').parent(sidebar).style('width', '100%').style('padding', '12px').style('background', '#ff0050').style('color', '#fff').style('border', 'none').style('font-weight', 'bold').mousePressed(recordGif);
}

function stylePickers(pickers) {
  pickers.forEach(p => {
    p.style('width', '45px').style('height', '30px').style('border', '1px solid #333').style('background', 'none').style('border-radius', '0');
    p.input(requestRedraw);
  });
}

function startCamera() {
  if (video) video.remove();
  video = createCapture(VIDEO, () => { isVideo = true; loop(); });
  video.size(640, 480); video.hide();
}

function handleFile(f) { 
  if (f.type === 'image') { isVideo = false; img = loadImage(f.data, () => { img.loadPixels(); onTypeChanged(); }); }
}

function saveHighRes() { 
  let source = isVideo ? video : img; if (!source) return;
  let exportW = 2480; let exportH = 3508;
  let pg = createGraphics(exportW, exportH);
  source.loadPixels();
  if (popArtCb.checked()) drawPopArtGrid(pg, exportW, exportH, 0, 0, 0, exportW/currentW, source);
  else render(pg, exportW/(height/1.414), exportW, exportH, null, null, 0, 0, 0, source);
  save(pg, 'æsthetica_A4_pro.jpg');
}

function drawPopArtGrid(target, totalW, totalH, startX, startY, t, sFactor, src) {
  let w = totalW / 2; let h = totalH / 2;
  let pal = [{i:{r:255,g:50,b:50},b:{r:10,g:10,b:40}}, {i:{r:0,g:255,b:180},b:{r:40,g:10,b:10}}, {i:{r:255,g:230,b:0},b:{r:50,g:0,b:80}}, {i:{r:0,g:180,b:255},b:{r:255,g:80,b:0}}];
  render(target, sFactor, w, h, pal[0].i, pal[0].b, startX, startY, t, src); 
  render(target, sFactor, w, h, pal[1].i, pal[1].b, startX + w, startY, t, src); 
  render(target, sFactor, w, h, pal[2].i, pal[2].b, startX, startY + h, t, src); 
  render(target, sFactor, w, h, pal[3].i, pal[3].b, startX + w, startY + h, t, src);
}

function createLabel(p, t) { createSpan('<b style="color:#eee; font-size:9px; letter-spacing:2px; display:block; margin-top:15px">'+t+'</b>').parent(p); }
function onTypeChanged() { if (rasterTypeSelect.value() === 'Fluid Motion' || rasterTypeSelect.value() === 'Glitch Mosaic' || isVideo) loop(); else { noLoop(); redraw(); } }
function onWarholChanged() { onTypeChanged(); requestRedraw(); }
function makeControl(label, min, max, val, step, parent) {
  createDiv(label).parent(parent).style('font-size', '8px').style('margin-top', '8px').style('color', '#555').style('text-transform', 'uppercase');
  let s = createSlider(min, max, val, step).parent(parent).style('width', '100%');
  s.input(requestRedraw); return s;
}
function setupStartButton() { startButton = createButton('OPEN A4 PRO STUDIO').position(width/2-95, height/2+80).style('padding', '12px 24px').style('background', 'none').style('color', '#fff').style('border', '1px solid #444').style('cursor', 'pointer').mousePressed(launchMainApp); }
function launchMainApp() { startButton.remove(); appState = 1; setupMainAppInterface(); }
function drawWavyGrid() { stroke(255, 10); noFill(); t += ANIMATION_SPEED; for (let x = 0; x <= width; x += GRID_SPACING) { beginShape(); for (let y = 0; y <= height; y += 15) { vertex(x + map(noise(x*0.005, y*0.005, t), 0, 1, -DISTORTION_FORCE, DISTORTION_FORCE), y); } endShape(); } }
function requestRedraw() { if (rasterTypeSelect.value() !== 'Fluid Motion' && rasterTypeSelect.value() !== 'Glitch Mosaic' && !isVideo) redraw(); }
function drawStartUI() { fill(255); noStroke(); textFont('Georgia'); textSize(60); text('ÆSTHETICA', width/2, height/2 - 40); textSize(12); textFont('Verdana'); drawingContext.letterSpacing = '5px'; fill(100); text('A4 RASTER PRO STUDIO', width/2, height/2 + 20); }
