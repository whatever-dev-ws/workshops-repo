//WUP 2025-2026
//Nibir Khan
let img;
let resSlider, distortSlider, effectSelect, colorPicker, bgColorPicker, colorModeSelect, paperToggle;
let uploadBtn, saveBtn;
let output;

function setup() {
  let cnv = createCanvas(windowWidth - 240, windowHeight);
  cnv.position(240, 0);

  // --- SIDEBAR CONSTRUCTION ---
  let sidebar = createDiv('');
  styleSidebar(sidebar);
  sidebar.html('<h2 style="color:white; margin-bottom:20px; font-size: 1.2em; border-bottom: 1px solid #333; padding-bottom: 10px;">RASTER STUDIO</h2>', true);

  // UI Helper to add labels
  const addLabel = (txt) => {
    let s = createSpan(txt).parent(sidebar);
    s.style('font-size', '10px');
    s.style('color', '#888');
    s.style('margin-top', '10px');
  };

  // 1. STYLE SELECTOR
  addLabel('ARTISTIC STYLE');
  effectSelect = createSelect().parent(sidebar);
  styleControl(effectSelect);
  ['Halftone Dots', 'Cross-hatch', 'Grainy Stipple', 'Organic Lines', 'ASCII Art', 'Concentric Rings', 'Triangles', 'CMYK Offset'].forEach(opt => effectSelect.option(opt));

  // 2. COLOR CONTROLS
  addLabel('INK & PAPER');
  colorPicker = createColorPicker('#1a1a1a').parent(sidebar);
  colorPicker.style('width', '100%');
  
  bgColorPicker = createColorPicker('#f4f1ea').parent(sidebar);
  bgColorPicker.style('width', '100%');

  colorModeSelect = createSelect().parent(sidebar);
  styleControl(colorModeSelect);
  colorModeSelect.option('Use Ink Color');
  colorModeSelect.option('Use Photo Color');

  // 3. PARAMETERS
  addLabel('DENSITY');
  resSlider = createSlider(4, 60, 15, 1).parent(sidebar);
  resSlider.style('width', '100%');

  addLabel('DISTORTION');
  distortSlider = createSlider(0, 50, 0, 1).parent(sidebar);
  distortSlider.style('width', '100%');

  paperToggle = createCheckbox(' Apply Paper Texture', true).parent(sidebar);
  paperToggle.style('font-size', '11px');
  paperToggle.style('margin-top', '10px');

  // 4. ACTIONS
  addLabel('FILES');
  uploadBtn = createFileInput(handleFile).parent(sidebar);
  uploadBtn.style('font-size', '10px');

  saveBtn = createButton('DOWNLOAD PNG').parent(sidebar);
  styleButton(saveBtn);
  saveBtn.mousePressed(downloadImage);

  noLoop();
}

// --- STYLING FUNCTIONS ---

function styleSidebar(el) {
  el.style('position', 'fixed');
  el.style('left', '0');
  el.style('top', '0');
  el.style('width', '240px');
  el.style('height', '100%');
  el.style('background', '#111');
  el.style('color', '#ccc');
  el.style('padding', '20px');
  el.style('display', 'flex');
  el.style('flex-direction', 'column');
  el.style('gap', '8px');
  el.style('font-family', 'monospace');
  el.style('box-sizing', 'border-box');
  el.style('border-right', '1px solid #333');
}

function styleControl(el) {
  el.style('background', '#222');
  el.style('color', 'white');
  el.style('border', '1px solid #444');
  el.style('padding', '5px');
  el.style('font-family', 'monospace');
}

function styleButton(btn) {
  btn.style('margin-top', '20px');
  btn.style('background', '#fff');
  btn.style('color', '#000');
  btn.style('border', 'none');
  btn.style('padding', '12px');
  btn.style('font-weight', 'bold');
  btn.style('cursor', 'pointer');
  btn.style('font-family', 'monospace');
  
  btn.elt.addEventListener('mouseenter', () => btn.style('background', '#ccc'));
  btn.elt.addEventListener('mouseleave', () => btn.style('background', '#fff'));
}

// --- LOGIC ---

function handleFile(file) {
  if (file.type === 'image') {
    img = loadImage(file.data, () => {
      let aspect = img.width / img.height;
      if (img.width > width) img.resize(width, 0);
      if (img.height > height) img.resize(0, height);
      output = createGraphics(img.width, img.height);
      redraw();
    });
  }
}

function draw() {
  if (!img || !output) {
    background(20);
    fill(100);
    textAlign(CENTER);
    textSize(14);
    textFont('monospace');
    text("UPLOAD AN IMAGE TO START RASTERING", width / 2, height / 2);
    return;
  }
  renderRaster();
  background(40);
  image(output, (width - output.width) / 2, (height - output.height) / 2);
}

function renderRaster() {
  let res = resSlider.value();
  let distort = distortSlider.value();
  let mode = effectSelect.value();
  let usePhotoColor = colorModeSelect.value() === 'Use Photo Color';

  output.background(bgColorPicker.color());
  img.loadPixels();

  for (let y = 0; y < img.height; y += res) {
    for (let x = 0; x < img.width; x += res) {
      let index = (floor(x) + floor(y) * img.width) * 4;
      let r = img.pixels[index];
      let g = img.pixels[index + 1];
      let b = img.pixels[index + 2];
      let bright = (r + g + b) / 3;

      let noiseScale = 0.01;
      let offsetX = (noise(x * noiseScale, y * noiseScale) - 0.5) * distort;
      let offsetY = (noise(y * noiseScale, x * noiseScale) - 0.5) * distort;

      output.push();
      output.translate(x + res / 2 + offsetX, y + res / 2 + offsetY);

      if (usePhotoColor) {
        output.fill(r, g, b);
        output.stroke(r, g, b);
      } else {
        output.fill(colorPicker.color());
        output.stroke(colorPicker.color());
      }

      output.strokeWeight(res * 0.15);

      // Effect logic remains the same as your high-quality implementation
      if (mode === 'Halftone Dots') {
        let size = map(bright, 0, 255, res * 1.5, 0);
        output.noStroke();
        output.ellipse(0, 0, size, size);
      } else if (mode === 'Organic Lines') {
        let angle = noise(x * 0.01, y * 0.01) * TWO_PI;
        output.rotate(angle * (distort / 10));
        let h = map(bright, 0, 255, res, 0);
        output.line(0, -h/2, 0, h/2);
      } else if (mode === 'Cross-hatch') {
        let l = map(bright, 0, 255, res, 0);
        output.line(-l/2, -l/2, l/2, l/2);
        if (bright < 120) output.line(l/2, -l/2, -l/2, l/2);
      } else if (mode === 'Grainy Stipple') {
        output.noStroke();
        let numDots = map(bright, 0, 255, 20, 0);
        for(let i=0; i<numDots; i++) {
          output.ellipse(random(-res/2, res/2), random(-res/2, res/2), res * 0.05, res * 0.05);
        }
      } else if (mode === 'ASCII Art') {
        output.noStroke();
        let chars = ["@", "#", "8", "&", "o", ":", "*", ".", " "];
        let charIndex = floor(map(bright, 0, 255, 0, chars.length - 1));
        output.textSize(res);
        output.textAlign(CENTER, CENTER);
        output.text(chars[charIndex], 0, 0);
      } else if (mode === 'Concentric Rings') {
        output.noFill();
        output.strokeWeight(map(bright, 0, 255, res/3, 0.5));
        output.ellipse(0, 0, res * 0.8, res * 0.8);
      } else if (mode === 'Triangles') {
        output.noStroke();
        let s = map(bright, 0, 255, res * 1.2, 0);
        output.rotate(noise(x * 0.02, y * 0.02) * TWO_PI * (distort/10));
        output.triangle(-s/2, s/2, s/2, s/2, 0, -s/2);
      } else if (mode === 'CMYK Offset') {
        output.noStroke();
        output.blendMode(MULTIPLY);
        let cSize = map(r, 0, 255, res * 0.8, 0);
        let mSize = map(g, 0, 255, res * 0.8, 0);
        let ySize = map(b, 0, 255, res * 0.8, 0);
        output.fill(0, 255, 255, 200); output.ellipse(-1, -1, cSize, cSize);
        output.fill(255, 0, 255, 200); output.ellipse(1, -1, mSize, mSize);
        output.fill(255, 255, 0, 200); output.ellipse(0, 1, ySize, ySize);
      }
      output.pop();
    }
  }
  if (paperToggle.checked()) applyPaperTextureToBuffer();
}

function applyPaperTextureToBuffer() {
  output.push();
  output.blendMode(BLEND);
  output.stroke(0, 30);
  for (let i = 0; i < 5000; i++) {
    output.point(random(output.width), random(output.height));
  }
  output.pop();
}

function downloadImage() {
  if (output) save(output, 'raster_artwork.png');
}

function mouseReleased() {
  redraw();
}

function windowResized() {
  resizeCanvas(windowWidth - 240, windowHeight);
  redraw();
}