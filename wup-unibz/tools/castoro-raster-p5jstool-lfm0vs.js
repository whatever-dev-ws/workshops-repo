//WUP 25/26
//Leo Longhin

let img, font;
let imgInput, fontInput, emojiInput, letterInput;
let sMaxScale, sDensity, sBg, checkTransparent;
let showGrid = false;
let modeToggle, btnSave; 
let emojiList = [
  '😀','😍','🥳','😎','🤔','😴','😱','🤡',
  '❤️','🔥','✨','⭐','🌟','☁️','🌈','❄️',
  '🌸','🌵','🌲','🌻','🍋','🍎','🍓','🍕',
  '💎','👑','🎈','🎁','🎨','🎬','🎮','🎧',
  '🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼',
  '🦁','🐯','🐵','🐧','🐦','🐤','🐣','🦆',
  '🚀','🛸','🛸','🚗','🚲','⚓','🗺️','🗿',
  '⚡','💀','👻','👽','🤖','👾','💩','🔥'
];

function setup() {
  createCanvas(windowWidth, windowHeight);
  
  let uiX = 20;
  
  // 1. Image & Font Upload
  createP('1. Upload Image').position(uiX, 0).style('color', 'white');
  imgInput = createFileInput(handleFile);
  imgInput.position(uiX, 30);
  
  createP('2. Upload Font (Optional)').position(uiX, 55).style('color', 'white');
  fontInput = createFileInput(handleFont);
  fontInput.position(uiX, 85);
  
  // 2. Mode Selection
  modeToggle = createSelect();
  modeToggle.position(uiX, 120);
  modeToggle.option('Emoji Mode');
  modeToggle.option('Letter Mode');
  
  // 3. Inputs
  emojiInput = createInput('⭐');
  emojiInput.position(uiX, 150);
  emojiInput.elt.onfocus = () => { showGrid = true; };

  letterInput = createInput('A');
  letterInput.position(uiX, 180);

  // 4. Transparent Toggle
  checkTransparent = createCheckbox(' Transparent BG', false);
  checkTransparent.position(uiX, 210).style('color', 'white');

  // 5. Sliders
  createP('Max Size').position(uiX, 230).style('color', 'white');
  sMaxScale = createSlider(5, 150, 40);
  sMaxScale.position(uiX, 260);

  createP('Density').position(uiX, 290).style('color', 'white');
  sDensity = createSlider(5, 60, 20);
  sDensity.position(uiX, 320);

  createP('Background Color').position(uiX, 350).style('color', 'white');
  sBg = createSlider(0, 255, 0);
  sBg.position(uiX, 380);

  // 6. Save Button
  btnSave = createButton('DOWNLOAD PNG');
  btnSave.position(uiX, 430);
  btnSave.style('background-color', '#4CAF50');
  btnSave.style('color', 'white');
  btnSave.mousePressed(saveImage);
  
  textAlign(CENTER, CENTER);
}

function handleFile(file) {
  if (file.type === 'image') {
    img = loadImage(file.data, () => {
      if (img.width > width - 260) img.resize(width - 260, 0);
      if (img.height > height - 60) img.resize(0, height - 60);
    });
  }
}

function handleFont(file) {
  if (file.name.endsWith('.ttf') || file.name.endsWith('.otf')) {
    font = loadFont(file.data);
  }
}

function saveImage() {
  // Create a temporary buffer to save art WITHOUT the UI sidebar
  let tempExport = createGraphics(width, height);
  if (checkTransparent.checked()) {
    tempExport.clear();
  } else {
    tempExport.background(sBg.value());
  }
  
  // Run the rasterize logic into the export buffer
  renderArt(tempExport);
  save(tempExport, 'my_raster_art.png');
}

function draw() {
  // Display logic
  if (checkTransparent.checked()) {
    drawCheckerboard();
  } else {
    background(sBg.value()); 
  }

  if (img) {
    renderArt(this); // Render directly to main canvas
  } else {
    fill(255);
    noStroke();
    textSize(20);
    text("Upload an image to start", width/2 + 120, height/2);
  }

  // Draw Sidebar UI
  push();
  resetMatrix();
  noStroke();
  fill(30);
  rect(0, 0, 240, height);
  pop();

  if (showGrid) {
    drawEmojiGrid();
  }
}

// Separated logic so it can be used by both draw() and saveImage()
function renderArt(target) {
  let gap = sDensity.value();
  let maxSz = sMaxScale.value();
  let startX = 260; 
  let startY = 40;
  
  let charToDraw = (modeToggle.value() === 'Emoji Mode') ? emojiInput.value() : letterInput.value();

  target.textAlign(CENTER, CENTER);
  
  // Set the font if uploaded, else fallback to Arial
  if (font && font.font) {
    target.textFont(font);
  } else {
    target.textFont('Arial');
  }

  for (let x = 0; x < img.width; x += gap) {
    for (let y = 0; y < img.height; y += gap) {
      let c = img.get(x, y);
      let bright = (red(c) * 0.299 + green(c) * 0.587 + blue(c) * 0.114);
      let currentSize = map(bright, 0, 255, 0, maxSz);

      if (currentSize > 0.5) {
        target.push();
        target.translate(startX + x, startY + y);
        target.textSize(currentSize);
        target.fill(c); 
        target.noStroke();
        target.text(charToDraw, 0, 0);
        target.pop();
      }
    }
  }
}

function drawCheckerboard() {
  background(20);
  noStroke();
  fill(30);
  let squareSize = 20;
  for (let y = 0; y < height; y += squareSize * 2) {
    for (let x = 240; x < width; x += squareSize * 2) { // Start after sidebar
      rect(x, y, squareSize, squareSize);
      rect(x + squareSize, y + squareSize, squareSize, squareSize);
    }
  }
}

function drawEmojiGrid() {
  let gridX = 250;
  let gridY = 80;
  let cellSize = 45;
  
  fill(40, 250);
  stroke(255, 50);
  strokeWeight(2);
  rect(gridX, gridY, cellSize * 8, cellSize * 8, 15);
  
  noStroke();
  textFont('Arial'); // Keep grid font standard
  for (let i = 0; i < emojiList.length; i++) {
    let col = i % 8;
    let row = floor(i / 8);
    let x = gridX + col * cellSize + cellSize/2;
    let y = gridY + row * cellSize + cellSize/2;
    
    if (mouseX > x - cellSize/2 && mouseX < x + cellSize/2 && 
        mouseY > y - cellSize/2 && mouseY < y + cellSize/2) {
      fill(80);
      rect(x - cellSize/2 + 2, y - cellSize/2 + 2, cellSize - 4, cellSize - 4, 8);
      
      if (mouseIsPressed) {
        emojiInput.value(emojiList[i]);
        showGrid = false;
      }
    }
    
    fill(255);
    textSize(24);
    text(emojiList[i], x, y);
  }
}

function mousePressed() {
  if (showGrid && mouseX > 250 + (45 * 8)) {
    showGrid = false;
  }
}