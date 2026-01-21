// --- GLOBAL VARIABLES ---
let img;
let currentTileSize = 15; // Startwert
let uiContainer;
let cnv; 
let userFont;  
let recIndicator; 

// Animation & Recording Variables
let isRecording = false; 
let recordStartTime = 0; 
const RECORD_SECONDS = 3; // Dauer des GIFs (perfekter Loop)

// UI Elements
let inputUpload; 
let uploadTriggerBtn; 
let inputFont;       
let fontTriggerBtn;  
let selectMode;
let colorBg;
let colorFill;
let sliderNoise;
let saveBtn;
let gifBtn;          
let infoText;

const SIDEBAR_WIDTH = 240; 
const density = "Ñ@#W$9876543210?!abc;:+=-,._ ";

function setup() {
  cnv = createCanvas(600, 400); 
  pixelDensity(1);
  noStroke();

  // --- UI SETUP ---
  uiContainer = createDiv('');
  styleContainer(uiContainer);

  // 1. Header
  let title = createDiv('<b>NOISE RASTER</b>');
  title.parent(uiContainer);
  title.style('font-size', '18px');
  title.style('margin-bottom', '20px');
  title.style('border-bottom', '2px solid black');
  title.style('width', '100%');
  title.style('padding-bottom', '10px');

  // 2. Image Upload
  createSpan('1. Source Image:').parent(uiContainer).style('font-weight','bold');
  inputUpload = createFileInput(handleFile);
  inputUpload.parent(uiContainer);
  inputUpload.style('display', 'none'); 

  uploadTriggerBtn = createButton('📂 UPLOAD IMAGE');
  uploadTriggerBtn.parent(uiContainer);
  styleActionButton(uploadTriggerBtn);
  uploadTriggerBtn.mousePressed(() => inputUpload.elt.click());

  // 3. Font Upload
  createSpan('2. Custom Font (ASCII):').parent(uiContainer).style('font-weight','bold').style('margin-top','15px');
  inputFont = createFileInput(handleFont);
  inputFont.parent(uiContainer);
  inputFont.style('display', 'none');

  fontTriggerBtn = createButton('🔤 UPLOAD FONT (.ttf)');
  fontTriggerBtn.parent(uiContainer);
  styleActionButton(fontTriggerBtn);
  fontTriggerBtn.mousePressed(() => inputFont.elt.click());

  // 4. Mode Selection
  createSpan('3. Style Mode:').parent(uiContainer).style('font-weight','bold').style('margin-top','15px');
  selectMode = createSelect();
  selectMode.option('Circles (Smart Color)');
  selectMode.option('Circles (Mono)');
  selectMode.option('Squares');
  selectMode.option('Scanlines');
  selectMode.option('ASCII Art');
  selectMode.selected('Circles (Smart Color)');
  styleElement(selectMode);

  // 5. Colors
  let grpColor = createDiv('');
  grpColor.parent(uiContainer);
  grpColor.style('display','flex');
  grpColor.style('flex-direction','column'); 
  grpColor.style('gap','10px');
  grpColor.style('width','100%');
  grpColor.style('margin-bottom', '20px');

  let row1 = createDiv('').parent(grpColor).style('display','flex').style('justify-content','space-between');
  createSpan('Background:').parent(row1);
  colorBg = createColorPicker('#ffffff'); 
  styleColor(colorBg, row1);

  let row2 = createDiv('').parent(grpColor).style('display','flex').style('justify-content','space-between');
  createSpan('Ink / Fill:').parent(row2);
  colorFill = createColorPicker('#000000'); 
  styleColor(colorFill, row2);

  // 6. Distortion (Angepasst auf max 100)
  createSpan('4. Distortion Strength:').parent(uiContainer).style('font-weight','bold');
  sliderNoise = createSlider(0, 100, 0); // HIER GEÄNDERT: Max Wert jetzt 100
  styleSlider(sliderNoise);

  // 7. Info & Export
  infoText = createSpan('<b>Hold Left Click</b> & move mouse to scale tiles.<br>[S] Save PNG | [G] Save GIF');
  infoText.parent(uiContainer);
  infoText.style('font-family', 'monospace');
  infoText.style('font-size', '11px');
  infoText.style('color', '#444');
  infoText.style('margin-top', 'auto'); 
  infoText.style('line-height', '1.4');

  let btnGroup = createDiv('');
  btnGroup.parent(uiContainer);
  btnGroup.style('display', 'flex');
  btnGroup.style('gap', '5px');
  btnGroup.style('margin-top', '10px');

  saveBtn = createButton('IMG (S)');
  saveBtn.parent(btnGroup);
  styleExportButton(saveBtn);
  saveBtn.mousePressed(saveArt);

  gifBtn = createButton('GIF (G)');
  gifBtn.parent(btnGroup);
  styleExportButton(gifBtn);
  gifBtn.style('background', '#e74c3c'); 
  gifBtn.mousePressed(startGifRecording);
  
  // --- REC INDICATOR ---
  recIndicator = createDiv('● REC');
  recIndicator.style('position', 'absolute');
  recIndicator.style('color', 'red');
  recIndicator.style('font-family', 'Arial, sans-serif');
  recIndicator.style('font-weight', 'bold');
  recIndicator.style('background', 'rgba(255, 255, 255, 0.9)');
  recIndicator.style('padding', '5px 10px');
  recIndicator.style('border-radius', '4px');
  recIndicator.style('display', 'none'); 
  recIndicator.style('z-index', '2000'); 
  recIndicator.parent(document.body); 

  centerCanvas();
}

function draw() {
  if (!img) {
    drawPlaceholder();
    return;
  }

  // --- INTERACTION ---
  // Nur wenn MAUS GEDRÜCKT (Links) + BEWEGT wird, ändert sich die Kachelgröße
  if (mouseIsPressed && mouseButton === LEFT && mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height) {
    let targetSize = map(mouseX, 0, width, 4, 150); 
    currentTileSize = constrain(targetSize, 4, 150);
    cursor(CROSS); 
  } else {
    cursor(ARROW);
  }

  // Info Update
  let status = isRecording ? `<span style="color:red"><b>RECORDING LOOP...</b></span>` : `[S] Save PNG | [G] Save GIF`;
  infoText.html(
    `<b>Tile Size:</b> ${floor(currentTileSize)}px<br>` +
    `<b>Noise:</b> ${sliderNoise.value()}<br>` +
    status
  );

  background(colorBg.color()); 

  // --- ANIMATION LOGIC ---
  let noiseZ = 0; // Standard: Keine Bewegung

  if (isRecording) {
    let elapsed = millis() - recordStartTime;
    let progress = elapsed / (RECORD_SECONDS * 1000); 
    
    // Sinus Loop für nahtloses GIF
    let angle = progress * TWO_PI;
    noiseZ = sin(angle) * 1.5; 
  } 

  // --- RENDERING ---
  let mode = selectMode.value();
  let monoColor = colorFill.color();
  let noiseAmt = sliderNoise.value();

  img.loadPixels();

  if (userFont && mode === 'ASCII Art') textFont(userFont);
  else textFont('monospace');

  for (let x = 0; x < width; x += currentTileSize) {
    for (let y = 0; y < height; y += currentTileSize) {
      
      let index = (Math.floor(x) + Math.floor(y) * img.width) * 4;
      if (index < 0 || index >= img.pixels.length - 3) continue;

      let r = img.pixels[index];
      let g = img.pixels[index+1];
      let b = img.pixels[index+2];
      let c = color(r,g,b);
      let bright = (r + g + b) / 3; 
      
      let noiseX = noise(x * 0.01, y * 0.01, 10 + noiseZ);
      let noiseY = noise(x * 0.01 + 100, y * 0.01 + 100, 10 + noiseZ);
      
      let offsetX = (noiseX - 0.5) * noiseAmt * 2;
      let offsetY = (noiseY - 0.5) * noiseAmt * 2;

      let centerX = x + currentTileSize / 2 + offsetX;
      let centerY = y + currentTileSize / 2 + offsetY;

      drawShape(mode, centerX, centerY, currentTileSize, c, monoColor, bright);
    }
  }

  // Indikator Position updaten
  if(recIndicator.style('display') === 'block') {
    recIndicator.position(cnv.x + 10, cnv.y + 10);
  }
}

// --- LOGIC: SHAPE DRAWING ---
function drawShape(mode, x, y, size, c, mono, bright) {
  if (mode === 'Circles (Smart Color)') {
    fill(c);
    let dia = map(bright, 0, 255, size, size * 0.2);
    ellipse(x, y, dia, dia);
  } else if (mode === 'Circles (Mono)') {
    fill(mono);
    let dia = map(bright, 0, 255, size * 1.3, 0);
    ellipse(x, y, dia, dia);
  } else if (mode === 'Squares') {
    fill(c);
    rectMode(CENTER);
    let side = map(bright, 0, 255, size, size * 0.3);
    rect(x, y, side, side);
  } else if (mode === 'Scanlines') {
    fill(mono);
    rectMode(CENTER);
    let h = map(bright, 0, 255, size, 0); 
    rect(x, y, size + 2, h);
  } else if (mode === 'ASCII Art') {
    fill(mono);
    textAlign(CENTER, CENTER);
    textSize(size);
    let idx = floor(map(bright, 0, 255, 0, density.length - 1));
    text(density.charAt(idx), x, y);
  }
}

// --- GIF RECORDING LOGIC ---
function startGifRecording() {
  if (!img) { alert("Please upload an image first!"); return; }
  if (isRecording) return; 

  isRecording = true;
  recordStartTime = millis(); 

  recIndicator.style('display', 'block');
  recIndicator.position(cnv.x + 10, cnv.y + 10);

  saveGif('noise_loop', RECORD_SECONDS, { units: 'seconds' });

  setTimeout(() => {
    isRecording = false;
    recIndicator.style('display', 'none');
  }, (RECORD_SECONDS * 1000) + 500);
}

// --- GENERIC HELPERS ---

function drawPlaceholder() {
  background(230);
  fill(50);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(24);
  textStyle(BOLD);
  text("UPLOAD AN IMAGE", width/2, height/2 - 15);
  textSize(14);
  textStyle(NORMAL);
  fill(100);
  text("(Use 'Upload Image' in Sidebar)", width/2, height/2 + 15);
}

function centerCanvas() {
  let availableW = windowWidth - SIDEBAR_WIDTH;
  let availableH = windowHeight;
  let x = SIDEBAR_WIDTH + (availableW - width) / 2;
  let y = (availableH - height) / 2;
  cnv.position(x, y);
}

function keyPressed() {
  if (isRecording) return;
  if (key === 's' || key === 'S') saveArt();
  else if (key === 'g' || key === 'G') startGifRecording();
}

function windowResized() {
  if(img) fitImageToScreen();
  else { resizeCanvas(600, 400); centerCanvas(); }
}

function fitImageToScreen() {
  let availW = windowWidth - SIDEBAR_WIDTH - 40; 
  let availH = windowHeight - 40; 
  let imgRatio = img.width / img.height;
  let screenRatio = availW / availH;
  let newW, newH;

  if (imgRatio > screenRatio) { newW = availW; newH = availW / imgRatio; } 
  else { newH = availH; newW = availH * imgRatio; }

  img.resize(newW, newH);
  resizeCanvas(newW, newH);
  centerCanvas();
}

// --- FILE HANDLERS ---

function handleFile(file) {
  if (file.type === 'image') {
    loadImage(file.data, (loadedImg) => {
      img = loadedImg; 
      fitImageToScreen();
      
      // --- SETTINGS RESET ---
      currentTileSize = 15;        
      sliderNoise.value(0);        
      colorBg.value('#ffffff');    
      colorFill.value('#000000');  
    });
  }
}

function handleFont(file) {
  if (file.subtype === 'truetype' || file.subtype === 'opentype' || file.name.endsWith('.ttf') || file.name.endsWith('.otf')) {
    userFont = loadFont(file.data);
    selectMode.selected('ASCII Art'); 
    alert("Font loaded! Mode switched to ASCII.");
  } else {
    alert("Please upload a .ttf or .otf file.");
  }
}

function saveArt() {
  if (img) saveCanvas('noise_art_' + floor(random(10000)), 'png');
  else alert("Please upload an image first!");
}

// --- STYLING ---

function styleContainer(div) {
  div.style('position', 'fixed');
  div.style('left', '0');
  div.style('top', '0');
  div.style('width', SIDEBAR_WIDTH + 'px');
  div.style('height', '100%'); 
  div.style('background', '#ffffff'); 
  div.style('color', '#000000'); 
  div.style('border-right', '1px solid #ccc');
  div.style('padding', '20px');
  div.style('box-sizing', 'border-box');
  div.style('display', 'flex');
  div.style('flex-direction', 'column');
  div.style('gap', '10px');
  div.style('font-family', 'Helvetica, Arial, sans-serif');
  div.style('z-index', '1000');
  div.style('box-shadow', '2px 0 10px rgba(0,0,0,0.05)');
}

function styleActionButton(btn) {
  btn.style('background', '#fff'); 
  btn.style('color', '#000');
  btn.style('border', '2px solid #000'); 
  btn.style('padding', '8px 0');
  btn.style('width', '100%');
  btn.style('cursor', 'pointer');
  btn.style('font-weight', 'bold');
  btn.style('font-size', '12px');
  btn.mouseOver(() => btn.style('background', '#f0f0f0'));
  btn.mouseOut(() => btn.style('background', '#fff'));
}

function styleElement(elt) {
  elt.parent(uiContainer);
  elt.style('background', '#fff');
  elt.style('color', '#000');
  elt.style('padding', '8px');
  elt.style('border', '1px solid #000'); 
  elt.style('border-radius', '0px'); 
  elt.style('width', '100%');
  elt.style('margin-bottom', '5px');
  elt.style('font-family', 'inherit');
}

function styleColor(picker, parent) {
  picker.parent(parent);
  picker.style('border', '1px solid #000'); 
  picker.style('height', '30px');
  picker.style('width', '40px');
  picker.style('cursor', 'pointer');
  picker.style('padding', '0');
  picker.style('background', 'none');
}

function styleSlider(s) {
  s.parent(uiContainer);
  s.style('width', '100%');
  s.style('margin-bottom', '15px');
}

function styleExportButton(btn) {
  btn.style('background', '#000'); 
  btn.style('color', '#fff');       
  btn.style('border', 'none');
  btn.style('padding', '15px 0');
  btn.style('flex-grow', '1'); 
  btn.style('cursor', 'pointer');
  btn.style('font-weight', 'bold');
  btn.mouseOver(() => btn.style('opacity', '0.8'));
  btn.mouseOut(() => btn.style('opacity', '1.0'));
}