//WUP 25/26
//Leo Longhin

let img, font;
let imgInput, fontInput, textInput;
let sSize, sHue, sOpacity, sSpacing, checkMono, checkText, checkTransparent;
let canvasBuffer;
let lastX, lastY; 

function setup() {
  createCanvas(windowWidth, windowHeight);
  
  canvasBuffer = createGraphics(windowWidth, windowHeight);
  canvasBuffer.background(0); 
  canvasBuffer.colorMode(HSB, 360, 100, 100, 1);
  canvasBuffer.textAlign(CENTER, CENTER);

  let uiX = 20;
  
  // File Inputs
  createP('Upload Image Brush').position(uiX, 0).style('color', '#fff').style('font-size', '12px');
  imgInput = createFileInput(handleImage);
  imgInput.position(uiX, 30);
  
  createP('Upload Custom Font').position(uiX, 55).style('color', '#fff').style('font-size', '12px');
  fontInput = createFileInput(handleFont);
  fontInput.position(uiX, 85);
  
  textInput = createInput('BRUSH');
  textInput.position(uiX, 115);

  checkText = createCheckbox(' Use Text Mode', false);
  checkText.position(uiX, 140).style('color', '#fff');

  checkTransparent = createCheckbox(' Transparent BG', false);
  checkTransparent.position(uiX, 165).style('color', '#fff');
  checkTransparent.changed(handleTransparency);

  // Sliders (Shifted down)
  createP('Brush Size').position(uiX, 190).style('color', '#fff');
  sSize = createSlider(10, 300, 60);
  sSize.position(uiX, 220);

  createP('Spacing').position(uiX, 250).style('color', '#fff');
  sSpacing = createSlider(1, 100, 20); 
  sSpacing.position(uiX, 280);

  createP('Hue Shift').position(uiX, 310).style('color', '#fff');
  sHue = createSlider(0, 360, 0);
  sHue.position(uiX, 340);

  createP('Opacity').position(uiX, 370).style('color', '#fff');
  sOpacity = createSlider(0, 1, 1, 0.01);
  sOpacity.position(uiX, 400);

  checkMono = createCheckbox(' Monochrome', false);
  checkMono.position(uiX, 430).style('color', '#fff');
  
  // Actions
  let btnClear = createButton('Clear Canvas');
  btnClear.position(uiX, 465);
  btnClear.mousePressed(handleTransparency);

  let btnSave = createButton('Save PNG');
  btnSave.position(uiX, 495);
  btnSave.mousePressed(() => saveCanvas(canvasBuffer, 'brush_art', 'png'));

  lastX = mouseX;
  lastY = mouseY;
}

function handleImage(file) {
  if (file.type === 'image') {
    img = loadImage(file.data);
  }
}

function handleFont(file) {
  if (file.name.endsWith('.ttf') || file.name.endsWith('.otf')) {
    font = loadFont(file.data);
  } else {
    alert('Please upload a .ttf or .otf font file.');
  }
}

function handleTransparency() {
  if (checkTransparent.checked()) {
    canvasBuffer.clear();
  } else {
    canvasBuffer.background(0);
  }
}

function draw() {
  if (checkTransparent.checked()) {
    drawCheckerboard(); 
  } else {
    background(40); 
  }
  
  image(canvasBuffer, 0, 0);

  // Drawing Logic
  if (mouseIsPressed && mouseX > 200) {
    let d = dist(mouseX, mouseY, lastX, lastY);
    if (d > sSpacing.value()) {
      paint();
      lastX = mouseX;
      lastY = mouseY;
    }
  }
}

function drawCheckerboard() {
  background(20);
  noStroke();
  fill(30);
  let squareSize = 20;
  for (let y = 0; y < height; y += squareSize * 2) {
    for (let x = 0; x < width; x += squareSize * 2) {
      rect(x, y, squareSize, squareSize);
      rect(x + squareSize, y + squareSize, squareSize, squareSize);
    }
  }
}

function paint() {
  let h = sHue.value();
  let s = checkMono.checked() ? 0 : 100;
  let b = 100;
  let a = sOpacity.value();
  let sz = sSize.value();

  canvasBuffer.push();
  canvasBuffer.tint(h, s, b, a);
  canvasBuffer.fill(h, s, b, a);
  
  if (checkText.checked()) {
    // Only use custom font if it has finished loading
    if (font && font.font) {
      canvasBuffer.textFont(font);
    } else {
      canvasBuffer.textFont('Arial');
    }
    canvasBuffer.textSize(sz);
    canvasBuffer.text(textInput.value(), mouseX, mouseY);
  } else if (img) {
    canvasBuffer.imageMode(CENTER);
    canvasBuffer.image(img, mouseX, mouseY, sz, sz);
  }
  
  canvasBuffer.pop();
}