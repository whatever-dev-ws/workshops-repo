// WUP 25-26
// Francesco Lewis
let img;
let customShape;
let canvas;

// UI Elements
let uploadBtn, shapeUploadBtn, saveBtn;
let sizeSlider, densitySlider, colorSlider;
let shapeSelect, ditherCheckbox;

function setup() {
  canvas = createCanvas(windowWidth, windowHeight);
  background(240);

  // --- UI SETUP ---
  let controlX = TOP;
  createP('<b>Raster Controls:</b>').position(controlX, 0);

  createSpan('1. Upload Image: ').position(controlX,40);
  uploadBtn = createFileInput(handleFile);
  uploadBtn.position(controlX + 110, 70);

  createSpan('2. Density: ').position(controlX, 110);
  densitySlider = createSlider(4, 40, 15, 1);
  densitySlider.position(controlX + 110, 140);

  createSpan('3. Base Size: ').position(controlX, 170);
  sizeSlider = createSlider(0.1, 3.0, 1.2, 0.1);
  sizeSlider.position(controlX + 110, 200);

  createSpan('4. Saturation: ').position(controlX, 230);
  colorSlider = createSlider(0, 2, 1, 0.1);
  colorSlider.position(controlX + 110, 250);

  createSpan('5. Shape: ').position(controlX, 270);
  shapeSelect = createSelect();
  shapeSelect.position(controlX + 110, 300);
  shapeSelect.option('Circle');
  shapeSelect.option('Square');
  shapeSelect.option('Triangle');
  shapeSelect.option('Custom');

  ditherCheckbox = createCheckbox(' Enable Dithering', false);
  ditherCheckbox.position(controlX, 330);

  createSpan('6. Custom Shape: ').position(controlX, 360);
  shapeUploadBtn = createFileInput(handleCustomShape);
  shapeUploadBtn.position(controlX + 110, 390);

  saveBtn = createButton('Save PNG');
  saveBtn.position(controlX, 430);
  saveBtn.size(150, 40);
  saveBtn.mousePressed(() => saveCanvas('raster_dither_art', 'png'));
}

function draw() {
  resizeCanvas(windowWidth, windowHeight)
  background(255);

  if (img) {
    let imgRatio = img.width / img.height;
    let drawW = width;
    let drawH = width / imgRatio;
    if (drawH > height) {
      drawH = height;
      drawW = height * imgRatio;
    }

    let step = densitySlider.value();
    let baseScale = sizeSlider.value();
    let saturation = colorSlider.value();
    let isDithered = ditherCheckbox.checked();

    img.loadPixels();

    for (let y = 0; y < img.height; y += step) {
      for (let x = 0; x < img.width; x += step) {
        let pixX = floor(x);
        let pixY = floor(y);
        let index = (pixY * img.width + pixX) * 4;

        let r = img.pixels[index];
        let g = img.pixels[index + 1];
        let b = img.pixels[index + 2];

        // Apply Color Gamut Adjustment
        let gray = (r + g + b) / 3;
        r = lerp(gray, r, saturation);
        g = lerp(gray, g, saturation);
        b = lerp(gray, b, saturation);

        // --- DITHERING LOGIC ---
        // Calculate brightness (0-1)
        let bright = (r + g + b) / (3 * 255);
        // If dithered, invert brightness so darker areas have larger shapes
        let ditherScale = isDithered ? map(bright, 0, 1, 1.2, 0.1) : 1.0;
        
        fill(r, g, b);
        noStroke();

        let posX = map(x, 0, img.width, 0, drawW);
        let posY = map(y, 0, img.height, 0, drawH);
        let finalSize = step * baseScale * ditherScale;

        drawRasterShape(posX, posY, finalSize);
      }
    }
  } else {
    fill(100);
    textAlign(CENTER, CENTER);
    text("Upload an image to apply raster/dither effects", width / 2, height / 2);
  }
}

function drawRasterShape(x, y, s) {
  let type = shapeSelect.value();
  push();
  translate(x, y);
  if (type === 'Circle') {
    ellipse(0, 0, s, s);
  } else if (type === 'Square') {
    rectMode(CENTER);
    rect(0, 0, s, s);
  } else if (type === 'Triangle') {
    triangle(0, -s / 2, -s / 2, s / 2, s / 2, s / 2);
  } else if (type === 'Custom' && customShape) {
    imageMode(CENTER);
    tint(fill().levels[0], fill().levels[1], fill().levels[2]);
    image(customShape, 0, 0, s, s);
  } else {
    ellipse(0, 0, s, s);
  }
  pop();
}

function handleFile(file) {
  if (file.type === 'image') img = loadImage(file.data);
}

function handleCustomShape(file) {
  if (file.type === 'image') customShape = loadImage(file.data);
}