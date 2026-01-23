// WUP 25-26
// Laila Emam

let img;
let customShapeImg;
let input, shapeSelect, resSlider, bgPicker, shapePicker, colorModeRadio, exportBtn, customShapeInput;
let artBuffer; 
let needsRedraw = false;

function setup() {
  let cnv = createCanvas(600, 600);
  cnv.style('display', 'block');
  cnv.style('margin', '20px auto');
  
  artBuffer = createGraphics(600, 600); 

  let controls = createDiv();
  controls.style('width', '600px');
  controls.style('margin', '0 auto');
  controls.style('padding', '20px');
  controls.style('background', '#fff');
  controls.style('border-radius', '8px');
  controls.style('font-family', 'sans-serif');

  createP("<strong>1. Upload Main PNG:</strong>").parent(controls);
  input = createFileInput(handleFile);
  input.parent(controls);
  
  createP("<strong>2. Shape:</strong>").parent(controls);
  shapeSelect = createSelect();
  shapeSelect.parent(controls);
  shapeSelect.option('circle');
  shapeSelect.option('square');
  shapeSelect.option('triangle');
  shapeSelect.option('star');
  shapeSelect.option('cross');
  shapeSelect.option('heart');
  shapeSelect.option('custom PNG');
  shapeSelect.changed(() => { 
    if(shapeSelect.value() === 'custom PNG') customShapeInput.show();
    else customShapeInput.hide();
    triggerRedraw(); 
  });

  customShapeInput = createFileInput(handleCustomShape);
  customShapeInput.parent(controls);
  customShapeInput.hide();

  createP("<strong>3. Resolution (Detail):</strong><br><small>Lower = More Detail but Slower</small>").parent(controls);
  resSlider = createSlider(15, 100, 30, 1); 
  resSlider.parent(controls);
  resSlider.style('width', '100%');
  resSlider.input(triggerRedraw);

  createP("<strong>4. Background & Color:</strong>").parent(controls);
  bgPicker = createColorPicker('#ffffff');
  bgPicker.parent(controls);
  bgPicker.input(triggerRedraw);

  colorModeRadio = createRadio();
  colorModeRadio.parent(controls);
  colorModeRadio.option('original', 'Photo Colors');
  colorModeRadio.option('custom', 'Solid Color');
  colorModeRadio.selected('original');
  colorModeRadio.style('margin-left', '10px');
  colorModeRadio.input(triggerRedraw);

  shapePicker = createColorPicker('#000000');
  shapePicker.parent(controls);
  shapePicker.input(triggerRedraw);

  createP("").parent(controls);
  exportBtn = createButton('DOWNLOAD IMAGE');
  exportBtn.parent(controls);
  exportBtn.style('background', '#4CAF50');
  exportBtn.style('color', 'white');
  exportBtn.style('border', 'none');
  exportBtn.style('padding', '10px 20px');
  exportBtn.style('cursor', 'pointer');
  exportBtn.mousePressed(() => saveCanvas('raster_art', 'png'));

  noLoop();
}

function triggerRedraw() {
  needsRedraw = true;
  redraw();
}

function handleFile(file) {
  if (file.type === 'image') {
    img = loadImage(file.data, () => {
      img.resize(400, 0);
      if (img.height > 400) img.resize(0, 400);
      triggerRedraw();
    });
  }
}

function handleCustomShape(file) {
  if (file.type === 'image') {
    customShapeImg = loadImage(file.data, () => {
      customShapeImg.resize(50, 0); 
      triggerRedraw();
    });
  }
}

function draw() {
  if (!img) {
    background(240);
    textAlign(CENTER, CENTER);
    text("Upload a PNG to start", width/2, height/2);
    return;
  }

  if (needsRedraw) {
    renderArt();
    needsRedraw = false;
  }

  image(artBuffer, 0, 0);
}

function renderArt() {
  artBuffer.background(bgPicker.color());
  img.loadPixels();
  
  let spacing = resSlider.value();
  let currentShape = shapeSelect.value();
  let mode = colorModeRadio.value();
  let customCol = shapePicker.color();
  let brush = customShapeImg ? customShapeImg : img;

  artBuffer.noStroke();
  artBuffer.imageMode(CENTER);

  let offsetX = (width - img.width) / 2;
  let offsetY = (height - img.height) / 2;

  for (let py = 0; py < img.height; py += spacing) {
    for (let px = 0; px < img.width; px += spacing) {
      let i = (Math.floor(px) + Math.floor(py) * img.width) * 4;
      let r = img.pixels[i];
      let g = img.pixels[i+1];
      let b = img.pixels[i+2];
      let a = img.pixels[i+3];

      if (a > 50) { 
        let c = (mode === 'original') ? color(r, g, b) : customCol;
        
        artBuffer.push();
        artBuffer.translate(px + offsetX, py + offsetY);
        
        if (currentShape === 'custom PNG') {
          artBuffer.tint(c);
          artBuffer.image(brush, 0, 0, spacing, spacing);
        } else {
          artBuffer.fill(c);
          drawPrimitiveBuffer(currentShape, spacing * 0.8);
        }
        artBuffer.pop();
      }
    }
  }
}

function drawPrimitiveBuffer(type, sz) {
  if (type === 'circle') {
    artBuffer.ellipse(0, 0, sz, sz);
  } else if (type === 'square') {
    artBuffer.rectMode(CENTER);
    artBuffer.rect(0, 0, sz, sz);
  } else if (type === 'triangle') {
    artBuffer.triangle(0, -sz/2, -sz/2, sz/2, sz/2, sz/2);
  } else if (type === 'star') {
    artBuffer.beginShape();
    for (let i = 0; i < 10; i++) {
      let rad = i % 2 === 0 ? sz / 2 : sz / 4;
      let angle = TWO_PI / 10 * i - HALF_PI;
      artBuffer.vertex(rad * cos(angle), rad * sin(angle));
    }
    artBuffer.endShape(CLOSE);
  } else if (type === 'cross') {
    artBuffer.rectMode(CENTER);
    artBuffer.rect(0, 0, sz, sz/3);
    artBuffer.rect(0, 0, sz/3, sz);
  } else if (type === 'heart') {
    artBuffer.beginShape();
    artBuffer.vertex(0, sz/4);
    artBuffer.bezierVertex(0, 0, -sz/2, 0, -sz/2, sz/4);
    artBuffer.bezierVertex(-sz/2, sz/2, 0, sz*0.8, 0, sz);
    artBuffer.bezierVertex(0, sz*0.8, sz/2, sz/2, sz/2, sz/4);
    artBuffer.bezierVertex(sz/2, 0, 0, 0, 0, sz/4);
    artBuffer.endShape(CLOSE);
  }
}