// WUP 25-26
// Andrea Binanzer
let state = "START"; 
let bgCanvas, charCanvas;
let path = [];
let animProgress = 0;
let charBounds = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity, centerX: 0, centerY: 0 };

let colorPicker, nextBtn, speedSlider, modeSelect, togglePathBtn, exportBtn, fileInput, customFileBtn;
let intensitySlider; 
let showPath = true;
let isExporting = false;

// Image Transform Variables
let uploadedImg = null;
let imgPos, imgSize;
let sizeSlider;

// UI Layout Hilfsvariablen
const col1 = 25, col2 = 200, col3 = 375, col4 = 550;
const row1 = 45, row2 = 100;

function setup() {
  createCanvas(800, 600);
  
  bgCanvas = createGraphics(800, 600);
  bgCanvas.background(20); 
  
  charCanvas = createGraphics(800, 600);
  charCanvas.background(255, 0);
  
  imgPos = createVector(200, 150);
  imgSize = createVector(400, 300);

  // 1. Color Picker
  colorPicker = createColorPicker('#ffffff');
  colorPicker.position(col1, row1);
  colorPicker.size(140, 35);
  colorPicker.hide();
  
  // 2. Next Button (Startet mittig, wandert dann ins UI-Panel)
  nextBtn = createButton('START');
  nextBtn.mousePressed(nextStep);
  styleDarkButton(nextBtn);
  nextBtn.position(width/2 - 60, height/2 + 90);

  // 3. File Input (Unsichtbar)
  fileInput = createFileInput(handleFile);
  fileInput.hide();

  // 4. Custom Elegant "Select Image" Button
  customFileBtn = createButton('📷 Select Image');
  customFileBtn.mousePressed(() => fileInput.elt.click());
  styleDarkButton(customFileBtn);
  customFileBtn.position(col2, row1);
  customFileBtn.size(140, 35);
  customFileBtn.hide();

  // 5. Size Slider
  sizeSlider = createSlider(10, 800, 400);
  sizeSlider.position(col2, row2);
  sizeSlider.size(140, 20);
  sizeSlider.hide();

  // 6. Path Toggle
  togglePathBtn = createButton('Path: On');
  togglePathBtn.mousePressed(() => { 
    showPath = !showPath; 
    togglePathBtn.html(showPath ? "Path: On" : "Path: Off");
  });
  styleDarkButton(togglePathBtn);
  togglePathBtn.position(col3, row1);
  togglePathBtn.size(140, 35);
  togglePathBtn.hide();

  // 7. Export Button
  exportBtn = createButton('💾 EXPORT GIF');
  exportBtn.mousePressed(startGifExport);
  styleDarkButton(exportBtn);
  exportBtn.style('background', '#ffffff');
  exportBtn.style('color', '#000000');
  exportBtn.position(col4, row2);
  exportBtn.size(140, 35);
  exportBtn.hide();

  // 8. Animation Settings
  speedSlider = createSlider(0.1, 15, 3, 0.1);
  speedSlider.position(col1, row1 + 5);
  speedSlider.size(140, 20);
  speedSlider.hide();

  intensitySlider = createSlider(0, 100, 20);
  intensitySlider.position(col2, row1 + 5);
  intensitySlider.size(140, 20);
  intensitySlider.hide();

  modeSelect = createSelect();
  modeSelect.position(col3, row1);
  modeSelect.size(140, 35);
  modeSelect.option('Simple');
  modeSelect.option('Shaking');
  modeSelect.option('Little Circles');
  modeSelect.option('Pulse & Size');
  styleSelect(modeSelect);
  modeSelect.hide();
}

function styleDarkButton(btn) {
  btn.style('padding', '5px 15px');
  btn.style('background', '#333333');
  btn.style('color', '#ffffff');
  btn.style('border', '1px solid #555555');
  btn.style('border-radius', '4px');
  btn.style('cursor', 'pointer');
  btn.style('font-family', 'serif');
  btn.style('font-size', '13px');
  btn.style('transition', 'all 0.3s');
}

function styleSelect(sel) {
  sel.style('background', '#333333');
  sel.style('color', 'white');
  sel.style('border', '1px solid #555555');
  sel.style('border-radius', '4px');
}

function draw() {
  background(15); 

  if (state === "START") {
    drawStartScreen();
    return;
  }

  image(bgCanvas, 0, 0);

  if (!isExporting) {
    if (state === "DRAW_BG") {
      drawUIOverlay("1. Paint background or Select Image");
      if (uploadedImg) {
        handleImageTransform();
        image(uploadedImg, imgPos.x, imgPos.y, imgSize.x, imgSize.y);
      } else {
        handleDrawing(bgCanvas, false);
      }
    } 
    else if (state === "DRAW_CHAR") {
      drawUIOverlay("2. Draw character or Drag & Scale Image");
      image(charCanvas, 0, 0); 
      if (uploadedImg) {
        handleImageTransform();
        image(uploadedImg, imgPos.x, imgPos.y, imgSize.x, imgSize.y);
      } else {
        handleDrawing(charCanvas, true);
      }
    } 
    else if (state === "DRAW_PATH") {
      drawUIOverlay("3. Draw the movement path");
      image(charCanvas, 0, 0);
      if (showPath) drawPathLine(150);
    } 
    else if (state === "PREVIEW") {
      drawUIOverlay("4. Preview, Speed & Intensity");
      if (showPath) drawPathLine(50);
      if (path.length > 1) renderAnimation();
    }
  } else {
    if (path.length > 1) renderAnimation();
  }
}

function handleImageTransform() {
  if (!uploadedImg) return;
  let aspect = uploadedImg.width / uploadedImg.height;
  imgSize.x = sizeSlider.value();
  imgSize.y = imgSize.x / aspect;

  if (mouseIsPressed && mouseY > 150) {
    imgPos.x = mouseX - imgSize.x / 2;
    imgPos.y = mouseY - imgSize.y / 2;
  }
  updateBoundsFromImage(imgPos.x, imgPos.y, imgSize.x, imgSize.y);
}

function drawStartScreen() {
  background(0);
  textAlign(CENTER, CENTER);
  textFont('serif');
  fill(255);
  textSize(42);
  textStyle(ITALIC);
  text("Animation Tool", width/2, height/2 - 140);
  stroke(255, 60);
  line(width/2 - 100, height/2 - 105, width/2 + 100, height/2 - 105);
  noStroke();
  textSize(18);
  textStyle(NORMAL);
  text("Make an animation with a picture, or draw one yourself.", width/2, height/2 - 70);
  fill(160);
  textSize(15);
  text("1. Select/draw background", width/2, height/2 + 0);
  text("2. Draw character OR load photo", width/2, height/2 + 25);
  text("3. Draw movement path", width/2, height/2 + 50);
}

function handleFile(file) {
  if (file.type === 'image') {
    uploadedImg = loadImage(file.data, () => {
      sizeSlider.show();
      imgPos.set(width/2 - imgSize.x/2, height/2 - imgSize.y/2);
    });
  }
}

function updateBoundsFromImage(x, y, w, h) {
  charBounds.minX = x;
  charBounds.maxX = x + w;
  charBounds.minY = y;
  charBounds.maxY = y + h;
  charBounds.centerX = x + w/2;
  charBounds.centerY = y + h/2;
}

function renderAnimation() {
  let index = floor(animProgress) % path.length;
  let pos = path[index];
  let scaleVal = 1.0;
  let mode = modeSelect.value();
  let dx = pos.x;
  let dy = pos.y;
  let intens = intensitySlider.value(); 

  if (mode === "Shaking") {
    dx += random(-intens/4, intens/4); 
    dy += random(-intens/4, intens/4);
  } else if (mode === "Little Circles") {
    dx += sin(frameCount * 0.2) * (intens/2); 
    dy += cos(frameCount * 0.2) * (intens/2);
  } else if (mode === "Pulse & Size") {
    scaleVal = 1.0 + sin(frameCount * 0.1) * (intens / 100);
  }

  push();
  translate(dx, dy);
  scale(scaleVal);
  imageMode(CENTER);
  image(charCanvas, -charBounds.centerX + width/2, -charBounds.centerY + height/2);
  pop();
  
  animProgress += speedSlider.value();
}

function nextStep() {
  if (state === "START") {
    state = "DRAW_BG";
    nextBtn.html("Next →");
    nextBtn.position(col4, row1);
    nextBtn.size(140, 35);
    colorPicker.show();
    customFileBtn.show();
  } else if (state === "DRAW_BG") {
    if (uploadedImg) {
        bgCanvas.image(uploadedImg, imgPos.x, imgPos.y, imgSize.x, imgSize.y);
        uploadedImg = null;
    }
    state = "DRAW_CHAR";
    sizeSlider.hide(); 
    nextBtn.html("Next →");
  } else if (state === "DRAW_CHAR") {
    if (uploadedImg) {
      charCanvas.image(uploadedImg, imgPos.x, imgPos.y, imgSize.x, imgSize.y);
      uploadedImg = null;
    }
    state = "DRAW_PATH";
    customFileBtn.hide();
    sizeSlider.hide();
    togglePathBtn.show();
    nextBtn.html("Preview");
  } else if (state === "DRAW_PATH") {
    if (path.length < 2) return;
    state = "PREVIEW";
    colorPicker.hide(); speedSlider.show(); modeSelect.show(); exportBtn.show(); intensitySlider.show();
    nextBtn.html("Reset & New");
  } else {
    state = "START";
    bgCanvas.background(20); 
    charCanvas.clear(); 
    path = []; 
    animProgress = 0;
    uploadedImg = null;
    charBounds = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity, centerX: 0, centerY: 0 };
    colorPicker.hide(); speedSlider.hide(); modeSelect.hide(); togglePathBtn.hide(); exportBtn.hide(); customFileBtn.hide(); sizeSlider.hide(); intensitySlider.hide();
    nextBtn.html("START");
    nextBtn.position(width/2 - 60, height/2 + 90);
    nextBtn.size(120, 40);
  }
}

function startGifExport() {
  if (path.length < 2) return;
  isExporting = true;
  animProgress = 0;
  let totalFrames = floor(path.length / speedSlider.value());
  saveGif('my_animation', totalFrames, {
    delay: 0, units: 'frames', onComplete: () => isExporting = false 
  });
}

function handleDrawing(layer, isChar) {
  if (mouseIsPressed && mouseY > 150) {
    layer.stroke(colorPicker.color());
    layer.strokeWeight(5);
    layer.line(pmouseX, pmouseY, mouseX, mouseY);
    if (isChar) {
      charBounds.minX = min(charBounds.minX, mouseX, pmouseX);
      charBounds.maxX = max(charBounds.maxX, mouseX, pmouseX);
      charBounds.minY = min(charBounds.minY, mouseY, pmouseY);
      charBounds.maxY = max(charBounds.maxY, mouseY, pmouseY);
      charBounds.centerX = (charBounds.minX + charBounds.maxX) / 2;
      charBounds.centerY = (charBounds.minY + charBounds.maxY) / 2;
    }
  }
}

function mouseDragged() {
  if (state === "DRAW_PATH" && mouseY > 150) {
    path.push(createVector(mouseX, mouseY));
  }
}

function drawPathLine(alpha) {
  stroke(255, alpha);
  noFill(); strokeWeight(2);
  beginShape();
  for (let p of path) vertex(p.x, p.y);
  endShape();
}

function drawUIOverlay(msg) {
  // UI Background
  fill(0, 230); noStroke(); rect(0, 0, width, 145); 
  stroke(255, 20); line(0, 145, width, 145); noStroke();

  // Status & Labels
  fill(255, 180); textSize(11); textAlign(LEFT); textFont('sans-serif');
  text(msg.toUpperCase(), col1, 25);
  
  if (state === "PREVIEW") {
    text("SPEED", col1, row1 - 5);
    text("INTENSITY", col2, row1 - 5);
    text("ANIMATION MODE", col3, row1 - 5);
  }
  
  if ((state === "DRAW_CHAR" || state === "DRAW_BG") && uploadedImg) {
    text("DRAG IMAGE TO MOVE / SCALE BELOW:", col2, row2 - 10);
  }
}