let imgA, imgB; 
let vgA, vgB; 
let fileInputA, fileInputB;
let blendSlider, blendLabel;
let shapeSelector, resolutionSlider, resolutionLabel, bgColorPicker;
let pngSaveButton;
let toggleBtn; 
let fsButton; 

// Neue Variablen für Format
let wSlider, hSlider, sizeLabel;
let labelA, labelB; 

let statusMsg = "Please upload Image A and Image B.";

let drawMode = 'DOTS';
let resolution = 8; 
let maxShapeSize = 8;
let blendAmount = 0.5; 

let flashAlpha = 0;

// --- LAYOUT KONFIGURATION ---
const SIDEBAR_WIDTH = 220; 
const COLLAPSED_WIDTH = 40; 
const PADDING = 20;
const MENU_BG = '#1E1E1E';
let isMenuOpen = true;
let currentSidebarWidth = SIDEBAR_WIDTH;

let uiElements = []; 

// Globale Variablen für Originalbilder
let imgA_Original, imgB_Original;

function setup() {
  // --- ÄNDERUNG 1: Body Hintergrund auf WEISS ---
  let body = select('body');
  body.style('background-color', '#ffffff'); // Weiß statt rgb(230, 230, 230)
  body.style('margin', '0');
  body.style('padding', '0');
  body.style('overflow', 'hidden'); 

  let cnv = createCanvas(800, 600); 
  cnv.style('display', 'block'); 

  pixelDensity(1); 
  setupUI();
  noLoop();
}

function setupUI() {
  toggleBtn = createButton('‹').position(5, 5).size(30, 30);
  styleButton(toggleBtn, '#333');
  toggleBtn.mousePressed(toggleMenu);

  let x = 15;
  let yStart = 50; 
  let yGap = 50;   
  let elementWidth = '180px';

  // 0. FULLSCREEN BUTTON
  fsButton = createButton('ENTER FULLSCREEN');
  fsButton.position(x, yStart).style('width', elementWidth);
  styleButton(fsButton, '#555'); 
  fsButton.mousePressed(toggleFullScreen);
  addUIElement(fsButton, x, yStart);
  
  yStart += 40; 

  // --- CANVAS SIZE ---
  addUIElement(createLabel('CANVAS SIZE (Format)', x, yStart), x, yStart);
  yStart += 20;
  
  // Width Slider
  addUIElement(createLabel('WIDTH', x, yStart), x, yStart);
  wSlider = createSlider(100, 2000, 800, 10).position(x + 50, yStart).style('width', '130px');
  wSlider.input(updateCanvasSize);
  addUIElement(wSlider, x + 50, yStart);
  
  yStart += 25;
  // Height Slider
  addUIElement(createLabel('HEIGHT', x, yStart), x, yStart);
  hSlider = createSlider(100, 2000, 600, 10).position(x + 50, yStart).style('width', '130px');
  hSlider.input(updateCanvasSize);
  addUIElement(hSlider, x + 50, yStart);
  
  yStart += 20;
  sizeLabel = createLabel('800 x 600 px', x, yStart);
  sizeLabel.style('text-align', 'right').style('width', elementWidth).style('color', '#888');
  addUIElement(sizeLabel, x, yStart);

  yStart += yGap; 

  // 1. Bilder
  labelA = createLabel('IMAGE A (Structure)', x, yStart); 
  addUIElement(labelA, x, yStart);
  
  fileInputA = createFileInput(handleFileA).position(x, yStart + 20).style('width', elementWidth);
  addUIElement(fileInputA, x, yStart + 20);
  
  yStart += yGap + 10;
  labelB = createLabel('IMAGE B (Color)', x, yStart); 
  addUIElement(labelB, x, yStart);
  
  fileInputB = createFileInput(handleFileB).position(x, yStart + 20).style('width', elementWidth);
  addUIElement(fileInputB, x, yStart + 20);

  // 2. Blending
  yStart += yGap + 10;
  blendLabel = createLabel('STRUCTURE BLEND: 50%', x, yStart);
  addUIElement(blendLabel, x, yStart);
  
  blendSlider = createSlider(0, 1, 0.5, 0.05).position(x, yStart + 20).style('width', elementWidth);
  blendSlider.input(updateBlend);
  addUIElement(blendSlider, x, yStart + 20);

  // 3. Hintergrund
  yStart += yGap + 20; 
  addUIElement(createLabel('BACKGROUND', x, yStart), x, yStart);
  bgColorPicker = createColorPicker('#ffffff').position(x, yStart + 20).style('width', elementWidth);
  bgColorPicker.input(forceLoop);
  addUIElement(bgColorPicker, x, yStart + 20);

  // 4. Form
  yStart += yGap;
  addUIElement(createLabel('SHAPE', x, yStart), x, yStart);
  shapeSelector = createSelect().position(x, yStart + 20).style('width', elementWidth);
  ['DOTS', 'SQUARES', 'LINES', 'HEARTS', 'STARS'].forEach(s => shapeSelector.option(s));
  shapeSelector.selected(drawMode);
  shapeSelector.changed(updateShape);
  addUIElement(shapeSelector, x, yStart + 20);

  // 5. Shape Size
  yStart += yGap;
  resolutionLabel = createLabel('SHAPE SIZE: ' + resolution, x, yStart);
  addUIElement(resolutionLabel, x, yStart);
  resolutionSlider = createSlider(4, 40, resolution, 1).position(x, yStart + 20).style('width', elementWidth);
  resolutionSlider.input(updateResolution);
  addUIElement(resolutionSlider, x, yStart + 20);

  // 6. Export
  yStart += yGap + 20;
  addUIElement(createLabel('EXPORT', x, yStart), x, yStart);
  pngSaveButton = createButton('SAVE PNG').position(x, yStart + 20).size(180, 30);
  styleButton(pngSaveButton, '#007AFF');
  pngSaveButton.mousePressed(savePNG);
  addUIElement(pngSaveButton, x, yStart + 20);
}

function addUIElement(el, x, y) {
    uiElements.push({ element: el, x: x, y: y });
}

function toggleMenu() {
    isMenuOpen = !isMenuOpen;
    currentSidebarWidth = isMenuOpen ? SIDEBAR_WIDTH : COLLAPSED_WIDTH;
    
    toggleBtn.html(isMenuOpen ? '‹' : '›');
    
    for(let item of uiElements) {
        if(isMenuOpen) {
            item.element.style('display', 'block');
        } else {
            item.element.style('display', 'none');
        }
    }
    
    windowResized();
}

// --- LOGIK FUNKTIONEN ---

function toggleFullScreen() {
  let fs = fullscreen();
  fullscreen(!fs);
  if(!fs) {
      fsButton.html('EXIT FULLSCREEN');
  } else {
      fsButton.html('ENTER FULLSCREEN');
  }
}

function updateCanvasSize() {
    if (!imgA_Original) return;

    let newW = wSlider.value();
    let newH = hSlider.value();
    
    sizeLabel.html(newW + ' x ' + newH + ' px');
    
    let totalH = newH + (PADDING * 2);
    if(totalH < windowHeight) totalH = windowHeight;
    resizeCanvas(windowWidth, totalH);

    let tempA = cropAndResize(imgA_Original, newW, newH);
    
    let vg = createGraphics(newW, newH);
    vg.image(tempA, 0, 0);
    vg.filter(GRAY);
    
    imgA = tempA;
    vgA = vg;

    if (imgB_Original) {
        processImage(imgB_Original, 'B_FORCE_FIT');
    } else {
        loop();
    }
}

function windowResized() {
    if (fsButton) {
        if (fullscreen()) fsButton.html('EXIT FULLSCREEN');
        else fsButton.html('ENTER FULLSCREEN');
    }
    
    if (imgA) {
        let totalH = imgA.height + (PADDING * 2);
        if(totalH < windowHeight) totalH = windowHeight;
        resizeCanvas(windowWidth, totalH);
        loop();
    } else {
        resizeCanvas(windowWidth, windowHeight);
        drawStatus();
    }
}

function createLabel(txt, x, y) {
  return createP(txt).position(x, y).style('color', '#eee').style('font-size', '10px').style('margin', '0');
}

function styleButton(btn, col) {
  btn.style('background', col).style('color', '#fff').style('border', 'none')
      .style('padding', '5px 10px').style('border-radius', '4px').style('cursor', 'pointer');
}

function updateBlend() {
  blendAmount = blendSlider.value();
  blendLabel.html('STRUCTURE BLEND: ' + Math.round(blendAmount * 100) + '%');
  loop();
}

function updateShape() {
  drawMode = shapeSelector.value();
  loop();
}

function updateResolution() {
  resolution = resolutionSlider.value();
  resolutionLabel.html('SHAPE SIZE: ' + resolution);
  maxShapeSize = resolution * 1.3; 
  loop();
}

function forceLoop() { loop(); }

// --- DATEI HANDLING ---
function handleFileA(file) { handleFile(file, 'A'); }
function handleFileB(file) { handleFile(file, 'B'); }

function handleFile(file, targetSlot) {
  if (file.type === 'image') {
    statusMsg = "Loading image " + targetSlot + "...";
    drawStatus(); 
    
    loadImage(file.data, function(loadedImg) {
        if (targetSlot === 'A') {
            labelA.html('IMAGE A (Structure) <span style="color:#4CAF50; font-weight:bold;">✅</span>');
            fileInputA.style('border-left', '5px solid #4CAF50');
        } else {
            labelB.html('IMAGE B (Color) <span style="color:#4CAF50; font-weight:bold;">✅</span>');
            fileInputB.style('border-left', '5px solid #4CAF50');
        }
        
        processImage(loadedImg, targetSlot);
    });
  } else {
    statusMsg = "Error: Not an image file!";
    drawStatus();
  }
}

function processImage(loadedImg, targetSlot) {
    
    // FALL A
    if (targetSlot === 'A') {
        imgA_Original = loadedImg;

        let w = loadedImg.width;
        let h = loadedImg.height;
        
        if (w > 1200) {
             let ratio = h / w;
             w = 1200; h = w * ratio;
        }

        wSlider.value(w);
        hSlider.value(h);
        sizeLabel.html(Math.round(w) + ' x ' + Math.round(h) + ' px');
        
        updateCanvasSize(); 
        return;
    } 

    // FALL B
    if (targetSlot === 'B' || targetSlot === 'B_FORCE_FIT') {
        if (!imgA) {
            statusMsg = "Please upload Image A first!";
            drawStatus();
            return;
        }
        
        if (targetSlot === 'B') imgB_Original = loadedImg;
        let sourceImg = (targetSlot === 'B') ? loadedImg : imgB_Original;

        let targetW = imgA.width;
        let targetH = imgA.height;

        let croppedGraphics = cropAndResize(sourceImg, targetW, targetH);
        let tempImg = croppedGraphics.get(); 
        
        let vg = createGraphics(targetW, targetH);
        vg.image(tempImg, 0, 0);
        vg.filter(GRAY);

        imgB = tempImg;
        vgB = vg;
    } 

    statusMsg = ""; 
    loop();
} 

function drawStatus() {
    // --- ÄNDERUNG 2: Start-Hintergrund auf WEISS ---
    background(255); // Weiß statt 230
    fill(MENU_BG); noStroke();
    rect(0, 0, currentSidebarWidth, height);
    
    fill(50); textAlign(CENTER); textSize(16);
    text(statusMsg, currentSidebarWidth + (width - currentSidebarWidth)/2, height/2);
}

// --- SAVE & FEEDBACK ---
function savePNG() {
  let xStart = currentSidebarWidth + PADDING;
  let w = imgA ? imgA.width : width;
  let h = imgA ? imgA.height : height;
  
  if (xStart + w > width) w = width - xStart - PADDING;
  
  let out = get(xStart, PADDING, w, h);
  out.save('blend_raster', 'png');

  pngSaveButton.html("✅ SAVED!");
  pngSaveButton.style('background', '#28a745'); 

  setTimeout(() => {
    pngSaveButton.html("SAVE PNG");
    styleButton(pngSaveButton, '#007AFF'); 
  }, 2000);

  flashAlpha = 255;
  loop(); 
}

// --- HAUPTSCHLEIFE ---
function draw() {
  fill(MENU_BG); noStroke();
  rect(0, 0, currentSidebarWidth, height); 

  if (!imgA || !imgB || !vgA || !vgB) {
      drawStatus();
      return;
  }
  
  // --- ÄNDERUNG 3: Hintergrund hinter dem Bild auf WEISS ---
  fill(255); // Weiß statt 230
  noStroke();
  rect(currentSidebarWidth, 0, windowWidth, windowHeight);

  let drawX = currentSidebarWidth + PADDING;
  let drawY = PADDING;

  fill(bgColorPicker.color());
  rect(drawX, drawY, imgA.width, imgA.height);

  vgA.loadPixels();
  vgB.loadPixels();
  imgB.loadPixels();

  let imgW = imgA.width;
  let imgH = imgA.height;

  push();
  drawingContext.beginPath();
  drawingContext.rect(drawX, drawY, imgW, imgH);
  drawingContext.clip();

  for (let x = 0; x < imgW; x += resolution) {
    for (let y = 0; y < imgH; y += resolution) {
      
      let pxX = Math.floor(x);
      let pxY = Math.floor(y);
      let index = (pxY * imgW + pxX) * 4;

      if (index >= vgA.pixels.length) continue;

      let brA = vgA.pixels[index];
      let brB = vgB.pixels[index];
      
      let blendedBr = lerp(brA, brB, blendAmount);
      let sz = map(blendedBr, 0, 255, maxShapeSize, 0);

      if (sz > 0.3) {
        let rB = imgB.pixels[index]; 
        let gB = imgB.pixels[index+1]; 
        let bB = imgB.pixels[index+2];
        
        let finalColor = color(rB, gB, bB);
        
        drawShape(x + drawX, y + drawY, sz, blendedBr, finalColor);
      }
    }
  }
  pop();

  if (flashAlpha > 0) {
      fill(255, flashAlpha);
      noStroke();
      rect(currentSidebarWidth, 0, width - currentSidebarWidth, height);
      flashAlpha -= 15; 
  }

  if (flashAlpha <= 0) {
      noLoop();
  }
}

function drawShape(x, y, sz, br, col) {
  fill(col);
  noStroke();
  
  if (drawMode === 'DOTS') {
    ellipse(x, y, sz);
  } else if (drawMode === 'SQUARES') {
    rectMode(CENTER); rect(x, y, sz, sz); rectMode(CORNER);
  } else if (drawMode === 'LINES') {
    push(); translate(x, y); 
    rotate(map(br, 0, 255, 0, PI));
    stroke(col); strokeWeight(sz > 3 ? sz/3 : 1.5); 
    line(-sz/2, 0, sz/2, 0); pop();
  } else if (drawMode === 'HEARTS') {
    push(); translate(x, y); scale(sz / 20); 
    beginShape(); vertex(0, 0);
    bezierVertex(5, -10, 15, -5, 0, 10);
    bezierVertex(-15, -5, -5, -10, 0, 0);
    endShape(CLOSE); pop();
  } else if (drawMode === 'STARS') {
    push(); translate(x, y); rotate(PI / 5);
    beginShape();
    for(let i=0; i<10; i++){
      let r = i%2==0 ? sz/2 : sz/5;
      let angle = TWO_PI * i / 10;
      vertex(cos(angle)*r, sin(angle)*r);
    }
    endShape(CLOSE); pop();
  }
}

function keyPressed() {
  if (key === 'p' || key === 'P') savePNG();
}

// --- HILFSFUNKTIONEN ---

function cropAndResize(img, targetW, targetH) {
  let imgRatio = img.width / img.height;
  let targetRatio = targetW / targetH;
  let newImg = createGraphics(targetW, targetH);
  
  let w, h, x, y;

  if (imgRatio > targetRatio) {
    h = targetH;
    w = img.width * (targetH / img.height);
    y = 0;
    x = (targetW - w) / 2; 
  } else {
    w = targetW;
    h = img.height * (targetW / img.width);
    x = 0;
    y = (targetH - h) / 2; 
  }

  newImg.image(img, x, y, w, h);
  return newImg;
}