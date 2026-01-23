 
let img, ditheredImg;
let thresholdSlider, sizeSlider, algoSelect, paletteSelect, morphSpeedSlider;
let chromaticSlider, scanlineToggle, vignetteSlider, invertToggle;
let video, recorder;
let chunks = [];
let isWebcam = false, isRecording = false, isPhotoCaptured = false;
let isGifMode = false;

const UI_THEME = { bg: '#F9F7F2', accent: '#1A1A1A', muted: '#E5E1D8', text: '#2C2C2C' };

const PALETTES = {
  'MONOCHROME': ['#000000', '#FFFFFF'],
  'SAINT LAURENT': ['#000000', '#1A1A1A', '#F9F7F2', '#D4AF37'],
  'BAUHAUS': ['#014421', '#E3242B', '#F5D033', '#1A1A1A'],
  'SOFT LINEN': ['#4A4238', '#8D8070', '#C3B091', '#E1D9D1'],
  'CYBERPUNK': ['#003153', '#0077BE', '#FF00FF', '#00FFFF'],
  'GAMEBOY': ['#0f380f', '#306230', '#8bac0f', '#9bbc0f'],
  'DESERT_ROSE': ['#53354A', '#903749', '#E84545', '#2B2E4A'],
  'OLIVETTI': ['#1C3D33', '#9BB7D4', '#E9E4D9', '#C53030'],
  'BRUTALIST': ['#0000FF', '#FFFFFF', '#000000', '#FF0000']
};

const ALGOS = ['FLOYD-STEINBERG', 'ATKINSON', 'STUCKI', 'JARVIS-JUDICE-NINKE', 'BURKES', 'SIERRA-LITE', 'BAYER_4x4', 'THRESHOLD'];

function setup() {
  // Aumentato l'altezza per evitare sovrapposizioni
  let canvas = createCanvas(1100, 1000);
  canvas.style('border-radius', '2px');
  pixelDensity(1);

  createElement('style', `
    body { background-color: ${UI_THEME.bg}; font-family: "Garamond", serif; color: ${UI_THEME.text}; }
    .chic-label { font-size: 10px; letter-spacing: 2px; text-transform: uppercase; margin: 0; color: ${UI_THEME.accent}; font-weight: bold; }
    .chic-ui { background: transparent; border: none; border-bottom: 1px solid ${UI_THEME.accent}; padding: 5px 0px; font-size: 11px; width: 180px; }
    .refinement-desc { font-size: 9px; color: #777; font-style: italic; width: 180px; line-height: 1.3; margin: 2px 0 15px 0; }
    button.chic-btn { background: ${UI_THEME.accent}; color: #FFF; border: none; padding: 10px 12px; cursor: pointer; font-size: 9px; letter-spacing: 1px; text-transform: uppercase; display: block; width: 180px; transition: 0.3s; margin-bottom: 5px; }
    button.chic-btn:hover { background: #555; }
    button.special-btn { background: transparent; color: ${UI_THEME.accent}; border: 1px solid ${UI_THEME.accent}; }
    input[type=checkbox] { margin-right: 8px; vertical-align: middle; }
  `);

  let xOff = 40;
  let yPos = 20;

  // --- INPUT SECTION ---
  createP('Media Source').position(xOff, yPos).addClass('chic-label');
  createFileInput(handleFile).position(xOff, yPos + 20).addClass('chic-ui');
  yPos += 70;

  createButton('Live Webcam').position(xOff, yPos).addClass('chic-btn').mousePressed(captureWebcam);
  createButton('Scatta Foto').position(xOff, yPos + 35).addClass('chic-btn').mousePressed(takeSnap);
  yPos += 85;

  // --- CURATION SECTION ---
  createP('Curation Tools').position(xOff, yPos).addClass('chic-label');
  createButton('Random Curation').position(xOff, yPos + 20).addClass('chic-btn').mousePressed(randomizeCuration);
  createButton('GIF / Morph Palette').position(xOff, yPos + 55).addClass('chic-btn').addClass('special-btn').mousePressed(() => isGifMode = !isGifMode);
  yPos += 100;

  createP('Morph Speed').position(xOff, yPos).addClass('chic-label');
  morphSpeedSlider = createSlider(5, 60, 30).position(xOff, yPos + 20).style('width', '180px');
  createP('Velocità rotazione automatica colori.').position(xOff, yPos + 40).addClass('refinement-desc');
  yPos += 70;

  // --- ALGO & PALETTE ---
  createP('Algorithm').position(xOff, yPos).addClass('chic-label');
  algoSelect = createSelect().position(xOff, yPos + 20).addClass('chic-ui');
  ALGOS.forEach(a => algoSelect.option(a));
  algoSelect.changed(processImage);
  yPos += 60;

  createP('Palette').position(xOff, yPos).addClass('chic-label');
  paletteSelect = createSelect().position(xOff, yPos + 20).addClass('chic-ui');
  Object.keys(PALETTES).forEach(p => paletteSelect.option(p));
  paletteSelect.changed(processImage);
  
  invertToggle = createCheckbox(' Inverti Colori', false).position(xOff, yPos + 50).addClass('chic-label').changed(processImage);
  yPos += 80;

  // --- RECORDING ---
  createP('Video Recording').position(xOff, yPos).addClass('chic-label');
  createButton('Inizia Video').position(xOff, yPos + 20).addClass('chic-btn').mousePressed(startRecording);
  createButton('Finisci Video').position(xOff, yPos + 55).addClass('chic-btn').mousePressed(stopRecording);
  yPos += 100;

  // --- REFINEMENT ---
  createP('Refinement').position(xOff, yPos).addClass('chic-label');
  yPos += 20;

  sizeSlider = createSlider(1, 4, 1, 1).position(xOff, yPos).style('width', '180px').input(processImage);
  createP('Grain: Risoluzione dei pixel.').position(xOff, yPos + 20).addClass('refinement-desc');
  yPos += 50;

  thresholdSlider = createSlider(-100, 100, 0).position(xOff, yPos).style('width', '180px').input(processImage);
  createP('Luminance: Esposizione luce/ombra.').position(xOff, yPos + 20).addClass('refinement-desc');
  yPos += 50;

  chromaticSlider = createSlider(0, 10, 0).position(xOff, yPos).style('width', '180px').input(processImage);
  createP('Chromatic: Glitch dei canali colore.').position(xOff, yPos + 20).addClass('refinement-desc');
  yPos += 50;

  vignetteSlider = createSlider(0, 200, 0).position(xOff, yPos).style('width', '180px').input(processImage);
  createP('Vignette: Oscuramento bordi.').position(xOff, yPos + 20).addClass('refinement-desc');
  yPos += 50;

  scanlineToggle = createCheckbox(' Scanlines', false).position(xOff, yPos).addClass('chic-label').changed(processImage);
  createP('Effetto monitor analogico.').position(xOff, yPos + 20).addClass('refinement-desc');
  yPos += 50;

  createButton('Esporta PNG').position(xOff, yPos).addClass('chic-btn').mousePressed(exportOnlyImage);
}

function draw() {
  background(UI_THEME.bg);
  
  if (isGifMode && frameCount % floor(morphSpeedSlider.value()) == 0) randomizeCuration();
  if (isWebcam && video) { img = video.get(); processImage(); }

  // Disegno Sidebar
  noStroke();
  fill(UI_THEME.muted);
  rect(0, 0, 260, height);
  
  fill(UI_THEME.accent);
  textAlign(LEFT);
  textSize(20);
  text("Atelier Dither", 40, height - 30);

  // Indicatori stato
  if (isPhotoCaptured) { fill('#E3242B'); textSize(10); text("• FOTO SCATTATA", 40, 130); }
  if (isGifMode) { fill('#0000FF'); textSize(10); text("• GIF MORPH ON", 40, 220); }

  if (ditheredImg) {
    push();
    translate(320, 50);
    let s = sizeSlider.value();
    image(ditheredImg, 0, 0, ditheredImg.width * s, ditheredImg.height * s);
    noFill(); stroke(UI_THEME.accent);
    rect(-5, -5, (ditheredImg.width * s) + 10, (ditheredImg.height * s) + 10);
    pop();
  }
}

// Logica di processamento aggiornata con Invert
function processImage() {
  if (!img) return;
  let grain = sizeSlider.value();
  let basePalette = PALETTES[paletteSelect.value()].map(c => color(c));
  
  // Gestione inversione palette
  let currentPalette = basePalette;
  if (invertToggle.checked()) {
    currentPalette = basePalette.slice().reverse();
  }

  let brightnessAdjust = thresholdSlider.value();
  ditheredImg = createImage(floor(img.width / grain), floor(img.height / grain));
  ditheredImg.copy(img, 0, 0, img.width, img.height, 0, 0, ditheredImg.width, ditheredImg.height);
  ditheredImg.loadPixels();
  
  let mode = algoSelect.value();
  for (let y = 0; y < ditheredImg.height; y++) {
    for (let x = 0; x < ditheredImg.width; x++) {
      let index = (x + y * ditheredImg.width) * 4;
      let r = ditheredImg.pixels[index] + brightnessAdjust;
      let g = ditheredImg.pixels[index+1] + brightnessAdjust;
      let b = ditheredImg.pixels[index+2] + brightnessAdjust;
      
      let oldCol = color(r, g, b);
      let newCol = (mode === 'BAYER_4x4' || mode === 'THRESHOLD') ? applyDirect(x, y, r, g, b, currentPalette, mode) : findClosestColor(oldCol, currentPalette);
      
      ditheredImg.pixels[index] = red(newCol); 
      ditheredImg.pixels[index+1] = green(newCol); 
      ditheredImg.pixels[index+2] = blue(newCol);
      
      if (!['BAYER_4x4', 'THRESHOLD'].includes(mode)) {
        let errR = r - red(newCol); let errG = g - green(newCol); let errB = b - blue(newCol);
        diffuse(ditheredImg, x, y, errR, errG, errB, mode);
      }
    }
  }
  ditheredImg.updatePixels();
  applyPostEffects();
}

// --- FUNZIONI DI SUPPORTO (ALGORITMI, ERROR DIFFUSION, ECC.) ---

function applyDirect(x, y, r, g, b, palette, mode) {
  if (mode === 'THRESHOLD') return findClosestColor(color(r, g, b), palette);
  const bayer = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
  let threshold = bayer[x % 4][y % 4] * 16;
  return findClosestColor(color((r+g+b)/3 + threshold - 128), palette);
}

function diffuse(img, x, y, er, eg, eb, mode) {
  let weights = [];
  if (mode === 'FLOYD-STEINBERG') weights = [[1,0,7/16], [-1,1,3/16], [0,1,5/16], [1,1,1/16]];
  else if (mode === 'ATKINSON') weights = [[1,0,1/8], [2,0,1/8], [-1,1,1/8], [0,1,1/8], [1,1,1/8], [0,2,1/8]];
  else if (mode === 'STUCKI') weights = [[1,0,8/42], [2,0,4/42], [-2,1,2/42], [-1,1,4/42], [0,1,8/42], [1,1,4/42], [2,1,2/42], [-2,2,1/42], [-1,2,2/42], [0,2,4/42], [1,2,2/42], [2,2,1/42]];
  else if (mode === 'JARVIS-JUDICE-NINKE') weights = [[1,0,7/48], [2,0,5/48], [-2,1,3/48], [-1,1,5/48], [0,1,7/48], [1,1,5/48], [2,1,3/48], [-2,2,1/48], [-1,2,3/48], [0,2,5/48], [1,2,3/48], [2,2,1/48]];
  else if (mode === 'BURKES') weights = [[1,0,8/32], [2,0,4/32], [-2,1,2/32], [-1,1,4/32], [0,1,8/32], [1,1,4/32], [2,1,2/32]];
  else if (mode === 'SIERRA-LITE') weights = [[1,0,2/4], [-1,1,1/4], [0,1,1/4]];
  weights.forEach(w => distErr(img, x + w[0], y + w[1], er, eg, eb, w[2]));
}

function distErr(img, x, y, er, eg, eb, f) {
  if (x < 0 || x >= img.width || y < 0 || y >= img.height) return;
  let i = (x + y * img.width) * 4;
  img.pixels[i] += er * f; img.pixels[i+1] += eg * f; img.pixels[i+2] += eb * f;
}

function applyPostEffects() {
  ditheredImg.loadPixels();
  let w = ditheredImg.width, h = ditheredImg.height;
  let chrom = chromaticSlider.value(), vig = vignetteSlider.value();
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let i = (x + y * w) * 4;
      if (chrom > 0) {
        let ri = (constrain(x + chrom, 0, w - 1) + y * w) * 4;
        let bi = (constrain(x - chrom, 0, w - 1) + y * w) * 4;
        ditheredImg.pixels[i] = ditheredImg.pixels[ri]; ditheredImg.pixels[i+2] = ditheredImg.pixels[bi];
      }
      if (scanlineToggle.checked() && y % 2 === 0) { ditheredImg.pixels[i] *= 0.8; ditheredImg.pixels[i+1] *= 0.8; ditheredImg.pixels[i+2] *= 0.8; }
      if (vig > 0) {
        let factor = map(dist(x, y, w/2, h/2), 0, w/1.5, 1, 1 - vig/255);
        ditheredImg.pixels[i] *= factor; ditheredImg.pixels[i+1] *= factor; ditheredImg.pixels[i+2] *= factor;
      }
    }
  }
  ditheredImg.updatePixels();
}

function findClosestColor(c, palette) {
  let closest = palette[0], dMin = 1000;
  for (let p of palette) {
    let d = dist(red(c), green(c), blue(c), red(p), green(p), blue(p));
    if (d < dMin) { dMin = d; closest = p; }
  }
  return closest;
}

function handleFile(file) {
  if (file.type === 'image') {
    isWebcam = false; isPhotoCaptured = false;
    img = loadImage(file.data, () => { img.resize(600, 0); processImage(); });
  }
}

function randomizeCuration() {
  algoSelect.selected(random(ALGOS));
  paletteSelect.selected(random(Object.keys(PALETTES)));
  processImage();
}

function captureWebcam() {
  if (!video) { video = createCapture(VIDEO); video.size(600, 450); video.hide(); }
  isWebcam = true; isPhotoCaptured = false;
}

function takeSnap() { if (video) { img = video.get(); isWebcam = false; isPhotoCaptured = true; processImage(); } }

function startRecording() {
  if (isRecording) return;
  chunks = [];
  let stream = canvas.getPrimaryContext().canvas.captureStream(30);
  recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
  recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
  recorder.onstop = () => {
    let blob = new Blob(chunks, { type: 'video/webm' });
    let url = URL.createObjectURL(blob);
    let a = document.createElement('a'); a.href = url; a.download = 'atelier_render.webm'; a.click();
  };
  recorder.start();
  isRecording = true;
}

function stopRecording() { isRecording = false; recorder.stop(); }

function exportOnlyImage() {
  let g = sizeSlider.value();
  let buf = createGraphics(ditheredImg.width * g, ditheredImg.height * g);
  buf.noSmooth(); buf.image(ditheredImg, 0, 0, buf.width, buf.height);
  save(buf, 'atelier_export.png');
}
