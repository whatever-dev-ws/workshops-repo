// ==== GLOBALS ====
let input, img, imgLoaded = false;
let pixelSizeSlider, thresholdSlider, canvasSizeSelect, shapeSelect;
let fgPicker, bgPicker, animateCheckbox;
let halftoneCheckbox, prefilterCheckbox;
let targetW = 600, targetH = 400;
let animateShapes = false;

// Hilfsbild fürs Sampling (kleiner als Canvas)
let sampleImg;

// ==== SETUP ====
function setup() {
  const baseFont = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

  // Layout
  const container = createDiv().id('container');
  container.style('display', 'flex');
  container.style('height', '100vh');
  container.style('margin', '0');
  container.style('box-sizing', 'border-box');
  container.style('font-family', baseFont);

  const ui = createDiv().id('ui-panel');
  ui.parent(container);
  ui.style('width', '260px');
  ui.style('padding', '14px 12px');
  ui.style('box-sizing', 'border-box');
  ui.style('border-right', '1px solid #444');
  ui.style('background', '#000');
  ui.style('font-size', '12px');
  ui.style('color', '#fff');
  ui.style('line-height', '1.3');

  const sketchHolder = createDiv().id('sketch-holder');
  sketchHolder.parent(container);
  sketchHolder.style('flex', '1');
  sketchHolder.style('display', 'flex');
  sketchHolder.style('justify-content', 'center');
  sketchHolder.style('align-items', 'center');
  sketchHolder.style('background', '#f0f0f0');

  // Canvas
  createCanvas(targetW, targetH).parent(sketchHolder);
  pixelDensity(1);

  // Helper
  const styleControl = el => {
    el.style('width', '100%');
    el.style('font-family', baseFont);
    el.style('font-size', '12px');
    return el;
  };

  const makeRow = (labelText, element) => {
    const row = createDiv().parent(ui);
    row.style('margin-bottom', '6px');
    if (labelText) {
      const lab = createDiv(labelText).parent(row);
      lab.style('margin-bottom', '3px');
      lab.style('font-size', '11px');
      lab.style('letter-spacing', '0.04em');
      lab.style('text-transform', 'uppercase');
      lab.style('color', '#aaa');
    }
    styleControl(element).parent(row);
    return element;
  };

  const sectionTitle = txt => {
    const t = createDiv(txt).parent(ui);
    t.style('margin-top', '10px');
    t.style('margin-bottom', '4px');
    t.style('font-size', '11px');
    t.style('text-transform', 'uppercase');
    t.style('letter-spacing', '0.08em');
    t.style('color', '#fff');
  };

  const styleCheckbox = cb => {
    cb.parent(ui);
    cb.style('margin-bottom', '6px');
    cb.style('font-family', baseFont);
    cb.style('font-size', '12px');
    cb.style('color', '#fff');
    return cb;
  };

  // ===== MENÜ =====
  sectionTitle('Source');
  input = makeRow('', createFileInput(handleFile));

  sectionTitle('Canvas');
  canvasSizeSelect = makeRow('Size', createSelect());
  canvasSizeSelect.option('600 x 400');
  canvasSizeSelect.option('800 x 800');
  canvasSizeSelect.option('1080 x 1350');
  canvasSizeSelect.changed(changeCanvasSize);

  sectionTitle('Bitmap');
  pixelSizeSlider = makeRow('Pixel size', createSlider(1, 20, 6, 1));
  pixelSizeSlider.style('accent-color', '#fff');

  thresholdSlider = makeRow('Threshold', createSlider(0, 255, 128, 1));
  thresholdSlider.style('accent-color', '#fff');

  sectionTitle('Shape');
  shapeSelect = makeRow('Type', createSelect());
  shapeSelect.option('Pixel');
  shapeSelect.option('Kreis');
  shapeSelect.option('Herz');

  sectionTitle('Filters');
  halftoneCheckbox = styleCheckbox(createCheckbox('Halftone mode', false));
  prefilterCheckbox = styleCheckbox(createCheckbox('prefilter (blur+posterize)', false));

  sectionTitle('Motion');
  animateCheckbox = styleCheckbox(createCheckbox('vibrate', false));
  animateCheckbox.changed(() => animateShapes = animateCheckbox.checked());

  sectionTitle('Colors');
  fgPicker = createColorPicker('#000000').parent(ui);
  fgPicker.style('margin-bottom', '4px');
  bgPicker = createColorPicker('#ffffff').parent(ui);
  bgPicker.style('margin-bottom', '10px');

  sectionTitle('Export');
  const styleBtn = b => {
    b.parent(ui);
    b.style('width', '100%');
    b.style('padding', '6px 0');
    b.style('border', '1px solid #444');
    b.style('background', '#111');
    b.style('color', '#fff');
    b.style('text-transform', 'uppercase');
    b.style('letter-spacing', '0.08em');
    b.style('cursor', 'pointer');
    return b;
  };

  styleBtn(createButton('save png')).mousePressed(saveImage);
  const gifBtn = styleBtn(createButton('save gif (3s)'));
  gifBtn.style('margin-top', '4px');
  gifBtn.mousePressed(saveGifAnimation);

  background(255);
}

// ==== CANVAS-GRÖSSE ====
function changeCanvasSize() {
  const val = canvasSizeSelect.value();
  if (val === '600 x 400') { targetW = 600; targetH = 400; }
  else if (val === '800 x 800') { targetW = 800; targetH = 800; }
  else if (val === '1080 x 1350') { targetW = 1080; targetH = 1350; }

  resizeCanvas(targetW, targetH);
}

// ==== FILE-HANDLING ====
function handleFile(file) {
  if (file.type === 'image') {
    loadImage(file.data, loaded => {
      img = loaded;
      imgLoaded = true;

      const maxSampleW = 400;
      const maxSampleH = 400;
      const scale = min(maxSampleW / img.width, maxSampleH / img.height, 1);
      const sw = floor(img.width * scale);
      const sh = floor(img.height * scale);

      sampleImg = createImage(sw, sh);
      sampleImg.copy(img, 0, 0, img.width, img.height, 0, 0, sw, sh);
    });
  }
}

// ==== DRAW ====
function draw() {
  background(255);

  if (!imgLoaded || !sampleImg) {
    fill(0);
    noStroke();
    text('Bild wählen, um Bitmap zu sehen...', 10, height - 20);
    return;
  }

  let s = pixelSizeSlider.value();
  const thresh = thresholdSlider.value();
  const useHalftone = halftoneCheckbox.checked();
  const shapeType = shapeSelect.value();
  const usePrefilter = prefilterCheckbox.checked();

  if (s < 2 && max(width, height) > 800) s = 2;

  const scaleFactor = min(width / sampleImg.width, height / sampleImg.height);
  const drawW = sampleImg.width * scaleFactor;
  const drawH = sampleImg.height * scaleFactor;
  const offsetX = (width - drawW) / 2;
  const offsetY = (height - drawH) / 2;

  let base = sampleImg;

  if (usePrefilter) {
    base = base.get();
    base.filter(BLUR, 1.5);
    base.loadPixels();
    posterizeImage(base, 4);
    base.updatePixels();
  }

  base.loadPixels();

  for (let y = 0; y < base.height; y += s) {
    for (let x = 0; x < base.width; x += s) {
      const idx = 4 * (x + y * base.width);
      const r = base.pixels[idx];
      const g = base.pixels[idx + 1];
      const b = base.pixels[idx + 2];

      const bright = 0.2126 * r + 0.7152 * g + 0.0722 * b;

      // Helligkeit entscheidet immer, ob fg oder bg benutzt wird
      const isDark = bright < thresh;
      const fillCol = isDark ? fgPicker.color() : bgPicker.color();
      fill(fillCol);
      noStroke();

      let size = s * scaleFactor;
      const cx = offsetX + x * scaleFactor + size / 2;
      const cy = offsetY + y * scaleFactor + size / 2;

      push();
      translate(cx, cy);

      if (animateShapes) {
        const t = frameCount * 0.08;
        const amp = 0.5;
        const dx = sin(t + x * 0.1 + y * 0.13) * size * amp;
        const dy = cos(t + x * 0.12 + y * 0.09) * size * amp;
        translate(dx, dy);
      }

      // Halftone ändert NUR die Punktgröße, nicht die Farbe
      if (useHalftone) {
        const dotFactor = map(bright, 0, 255, 1.2, 0.2);
        size = size * dotFactor;
      }

      if (shapeType === 'Pixel') {
        rectMode(CENTER);
        rect(0, 0, size, size);
      } else if (shapeType === 'Kreis') {
        circle(0, 0, size);
      } else if (shapeType === 'Herz') {
        drawHeart(0, 0, size * 0.6);
      }

      pop();
    }
  }
}

// ==== HERZ ====
function drawHeart(x, y, size) {
  push();
  translate(x, y);
  scale(size / 100);
  beginShape();
  vertex(0, -30);
  bezierVertex(25, -80, 80, -50, 40, 0);
  bezierVertex(20, 25, 0, 45, 0, 60);
  bezierVertex(0, 45, -20, 25, -40, 0);
  bezierVertex(-80, -50, -25, -80, 0, -30);
  endShape(CLOSE);
  pop();
}

// ==== POSTERIZE ====
function posterizeImage(img, levels) {
  const step = 255 / (levels - 1);
  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      const idx = 4 * (x + y * img.width);
      const r = img.pixels[idx];
      const g = img.pixels[idx + 1];
      const b = img.pixels[idx + 2];

      const bright = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      const q = Math.round(bright / step) * step;
      img.pixels[idx] = q;
      img.pixels[idx + 1] = q;
      img.pixels[idx + 2] = q;
    }
  }
}

// ==== EXPORT ====
function saveImage() {
  saveCanvas('bitmap_export', 'png');
}

function saveGifAnimation() {
  saveGif('bitmap_vibrate', 1, { units: 'seconds' });
}
