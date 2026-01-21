// WUP 25-26
// Lara Spitaler
let img;
let mic, fft;
let currentEffect = 'none';
let micActive = false;
let lerpedStep = 10; 
let driftOffset = 0; 

let settings = {
  halftone: { slider: null, label: 'HALFTONE', valDisplay: null },
  mosaic: { slider: null, label: 'MOSAIC', valDisplay: null },
  noise: { slider: null, label: 'GRAIN', valDisplay: null },
  lined: { slider: null, label: 'ENGRAVE', valDisplay: null }
};

function setup() {
  createCanvas(windowWidth, windowHeight);
  
  userStartAudio().then(() => {
    toggleMic();
  });

  let xPos = 30;
  let yPos = 30; // Starting higher for the file input
  let gap = 85;

  // 1. FILE INPUT (Now at the very top)
  let fileInput = createFileInput(handleFile);
  fileInput.position(xPos, yPos);
  fileInput.style('color', '#555');
  fileInput.style('font-family', 'monospace');
  fileInput.style('font-size', '10px');
  
  // Move yPos down for the rest of the UI
  yPos += 70;

  // 2. ULTRA-FINE EFFECT UI
  setupEffectUI('HALFTONE', 'halftone', xPos, yPos);
  yPos += gap;
  setupEffectUI('MOSAIC', 'mosaic', xPos, yPos);
  yPos += gap;
  setupEffectUI('GRAIN', 'noise', xPos, yPos);
  yPos += gap;
  setupEffectUI('ENGRAVE', 'lined', xPos, yPos); 
  yPos += gap;

  // 3. UTILS
  styleButton('MIC ACTIVATED', xPos, yPos).mousePressed(toggleMic);
  yPos += 45;
  styleButton('EXPORT .PNG', xPos, yPos).mousePressed(() => saveCanvas('Fine_Raster_Export', 'png'));
}

function setupEffectUI(label, key, x, y) {
  let container = createDiv('');
  container.position(x, y);
  container.style('width', '180px');
  container.style('display', 'flex');
  container.style('justify-content', 'space-between');
  
  let txt = createSpan(label);
  txt.style('color', '#FFFFFF');
  txt.style('font-family', 'Helvetica, sans-serif');
  txt.style('font-size', '10px');
  txt.style('letter-spacing', '5px');
  txt.parent(container);

  let valDisp = createSpan('0.00');
  valDisp.style('color', '#555');
  valDisp.style('font-family', 'Courier, monospace');
  valDisp.style('font-size', '9px');
  valDisp.parent(container);
  settings[key].valDisplay = valDisp;

  let sld = createSlider(0, 1, 0.2, 0.001); 
  sld.position(x, y + 20);
  sld.style('width', '180px');
  sld.style('height', '2px');
  
  sld.input(() => {
    currentEffect = key;
  });
  
  settings[key].slider = sld;
}

function styleButton(label, x, y) {
  let btn = createButton(label);
  btn.position(x, y);
  btn.style('background', 'none');
  btn.style('border', '1px solid #333');
  btn.style('color', '#888');
  btn.style('padding', '6px 12px');
  btn.style('font-family', 'Helvetica');
  btn.style('font-size', '8px');
  btn.style('letter-spacing', '3px');
  btn.style('cursor', 'crosshair');
  return btn;
}

function toggleMic() {
  if (!micActive) {
    userStartAudio();
    mic = new p5.AudioIn();
    mic.start();
    fft = new p5.FFT();
    fft.setInput(mic);
    micActive = true;
  }
}

function draw() {
  background(255); 
  
  // SIDEBAR
  noStroke();
  fill(5); 
  rect(0, 0, 260, height);
  stroke(25);
  line(260, 0, 260, height);

  if (img) {
    let drawW = width - 360;
    let drawH = drawW / (img.width / img.height);
    if (drawH > height - 120) {
      drawH = height - 120;
      drawW = drawH * (img.width / img.height);
    }

    let activeSlider = (currentEffect === 'none') ? settings.halftone.slider : settings[currentEffect].slider;
    let rawVal = activeSlider.value();
    let baseSize = map(pow(rawVal, 3), 0, 1, 0.5, 180); 
    
    settings[currentEffect === 'none' ? 'halftone' : currentEffect].valDisplay.html(baseSize.toFixed(2));

    let targetStep = baseSize;

    if (micActive) {
      let vol = mic.getLevel();
      if (vol > 0.005) { 
        fft.analyze();
        let pitch = fft.getCentroid(); 
        let pitchFactor = map(pitch, 500, 5000, 0, 1, true);
        driftOffset += map(pitchFactor, 0, 1, 0.001, 0.03);
        targetStep = baseSize + map(pitchFactor, 0, 1, 0, baseSize * 0.2);
      }
    }

    lerpedStep = lerp(lerpedStep, targetStep, 0.04);

    push();
    translate(310, height/2 - drawH/2);
    applyEffect(currentEffect, drawW, drawH, lerpedStep);
    pop();
  }
}

function handleFile(file) {
  if (file.type === 'image') {
    img = loadImage(file.data, () => img.loadPixels());
  }
}

function applyEffect(effect, w, h, step) {
  if (effect === 'none' || !img) { 
    image(img, 0, 0, w, h); 
    return; 
  }

  let s = max(0.1, step); 
  randomSeed(99); 

  for (let y = 0; y < h; y += s) {
    for (let x = 0; x < w; x += s) {
      let noiseX = noise(x * 0.008, y * 0.008, driftOffset) * (s * 0.4);
      let noiseY = noise(y * 0.008, x * 0.008, driftOffset) * (s * 0.4);

      let imgX = floor(map(x, 0, w, 0, img.width));
      let imgY = floor(map(y, 0, h, 0, img.height));
      let index = (constrain(imgY, 0, img.height-1) * img.width + constrain(imgX, 0, img.width-1)) * 4;
      
      let r = img.pixels[index];
      let g = img.pixels[index + 1];
      let b = img.pixels[index + 2];
      let bright = (r + g + b) / 3;

      let dx = x + noiseX;
      let dy = y + noiseY;

      if (effect === 'halftone') {
        fill(r, g, b);
        noStroke();
        let diam = map(bright, 0, 255, s * 1.15, 0);
        ellipse(dx, dy, diam, diam);
      } else if (effect === 'mosaic') {
        fill(r, g, b);
        noStroke();
        rect(dx, dy, s + 0.1, s + 0.1); 
      } else if (effect === 'noise') {
        stroke(r, g, b, 220);
        strokeWeight(s * 0.12);
        line(dx, dy, dx + s * 0.4, dy + s * 0.4);
      } else if (effect === 'lined') {
        stroke(r, g, b);
        strokeWeight(map(bright, 0, 255, s * 0.65, 0.05));
        line(dx, dy, dx + s, dy);
      }
    }
  }
}