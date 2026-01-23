//WUP 25-26
//Luca Neugebauer

// added color sliders and fixed transparent export
let img;
let fileInput, modeCheckbox, bgCheckbox;
let sliders = {}; 
let allPaths = []; 
let currentPath = [];
let drawingMode = true;
let needsRedraw = false;
let uiVisible = true;
let hasStartedDrawing = false;

let artworkBounds = { x: 0, y: 0, w: 0, h: 0 };

function setup() {
  createCanvas(windowWidth, windowHeight+100);
  pixelDensity(1); 
  
  let startY = 60;
  let gap = 50;
  
  fileInput = createFileInput(handleFile);
  fileInput.position(30, startY);
  fileInput.style('color', 'white');
  fileInput.hide();

  const createControl = (key, min, max, val, step, label) => {
    let s = createSlider(min, max, val, step);
    s.position(30, startY + gap); 
    s.style('width', '160px');
    s.input(() => { needsRedraw = true; }); 
    s.hide();
    sliders[key] = { el: s, label: label, y: startY + gap };
    gap += 50; 
  };

  // Original Sliders
  createControl('res', 8, 100, 15, 1, "Grid Density"); 
  createControl('size', 0, 3, 1.5, 0.1, "Symbol Size");
  createControl('thick', 0.5, 14, 1, 0.5, "Stroke Weight");
  createControl('noise', 0.001, 0.1, 0.01, 0.001, "Flow Scale");
  createControl('chaos', 0, 100, 0, 1, "Chaos Factor");
  
  // New Color Sliders
  createControl('sat', 0, 2, 1, 0.1, "Saturation");
  createControl('r_mult', 0, 2, 1, 0.05, "Red Tint");
  createControl('g_mult', 0, 2, 1, 0.05, "Green Tint");
  createControl('b_mult', 0, 2, 1, 0.05, "Blue Tint");

  modeCheckbox = createCheckbox(' Enable Flow/Chaos', true);
  modeCheckbox.position(30, startY + gap + 5);
  modeCheckbox.style('color', 'white');
  modeCheckbox.style('font-family', 'monospace');
  modeCheckbox.style('font-size', '13px');
  modeCheckbox.changed(() => { needsRedraw = true; });
  modeCheckbox.hide();

  bgCheckbox = createCheckbox(' White Background', true);
  bgCheckbox.position(30, startY + gap + 30);
  bgCheckbox.style('color', 'white');
  bgCheckbox.style('font-family', 'monospace');
  bgCheckbox.style('font-size', '13px');
  bgCheckbox.changed(() => { needsRedraw = true; });
  bgCheckbox.hide();

  background(20);
}

function draw() {
  if (drawingMode) {
    drawEditorInterface();
  } else {
    if (needsRedraw && img) {
      renderRaster();
      needsRedraw = false; 
    }
    if (uiVisible) drawControlPanel();
  }
}

function drawEditorInterface() {
  background(20);
  stroke(40); strokeWeight(1);
  for(let i=0; i<width; i+=50) line(i,0,i,height);
  for(let i=0; i<height; i+=50) line(0,i,width,i);

  stroke(255); strokeWeight(2); noFill();
  
  for (let path of allPaths) {
    beginShape();
    for (let p of path) vertex(p.x, p.y);
    endShape();
  }
  beginShape();
  for (let p of currentPath) vertex(p.x, p.y);
  endShape();
  
  if (!hasStartedDrawing) {
    fill(255); noStroke(); textAlign(CENTER); 
    textSize(18); textStyle(BOLD);
    text("DRAW YOUR SYMBOL", width/2, height/2 - 20);
    textSize(13); fill(180); textStyle(NORMAL);
    text("Press ENTER when finished", width/2, height/2 + 10);
  }
}

function drawControlPanel() {
  noStroke();
  fill(0, 180);
  rect(10, 10, 220, 680, 10); // Resized for new sliders

  fill(255); textAlign(LEFT); textSize(14); textStyle(BOLD);
  text("CONTROLS", 30, 35);
  textStyle(NORMAL); textSize(12);
  
  if (sliders['res']) {
    for (let key in sliders) {
      let item = sliders[key];
      fill(200);
      text(item.label, 30, item.y - 15);
      fill(255);
      textAlign(RIGHT);
      text(item.el.value(), 190, item.y - 15);
      textAlign(LEFT);
    }
  }
  
  fill(180); textSize(11);
  text("H — Toggle UI", 30, 630);
  text("S — Save Artwork (PNG)", 30, 645);
}

function getAdjustedColor(r, g, b) {
  let s = sliders['sat'].el.value();
  let rm = sliders['r_mult'].el.value();
  let gm = sliders['g_mult'].el.value();
  let bm = sliders['b_mult'].el.value();
  
  // Calculate grayscale for saturation lerping
  let gray = (r + g + b) / 3;
  
  // Apply saturation and RGB multipliers
  let finalR = lerp(gray, r, s) * rm;
  let finalG = lerp(gray, g, s) * gm;
  let finalB = lerp(gray, b, s) * bm;
  
  return color(constrain(finalR, 0, 255), constrain(finalG, 0, 255), constrain(finalB, 0, 255));
}

function renderRaster() {
  let useBg = bgCheckbox.checked();
  if (useBg) {
    background(245);
  } else {
    clear(); 
    background(20); // Visual preview background for the editor (not in export)
  }
  
  let baseRes = sliders['res'].el.value();
  let sizeMult = sliders['size'].el.value();
  let strokeThick = sliders['thick'].el.value();
  let nScale = sliders['noise'].el.value();
  let chaos = sliders['chaos'].el.value();
  let useFlow = modeCheckbox.checked();

  let drawW = width;
  let drawH = drawW * (img.height / img.width);
  if (drawH > height) {
    drawH = height;
    drawW = drawH * (img.width / img.height);
  }
  let offX = (width - drawW) / 2;
  let offY = (height - drawH) / 2;

  artworkBounds = { x: offX, y: offY, w: drawW, h: drawH };

  img.loadPixels(); 
  
  for (let y = 0; y < drawH; y += baseRes) {
    for (let x = 0; x < drawW; x += baseRes) {
      let imgX = floor(map(x, 0, drawW, 0, img.width));
      let imgY = floor(map(y, 0, drawH, 0, img.height));
      let index = (imgY * img.width + imgX) * 4;
      
      let r = img.pixels[index];
      let g = img.pixels[index + 1];
      let b = img.pixels[index + 2];
      let bright = (r + g + b) / 3; 

      if (bright < 240) { 
        let angle = 0;
        if (useFlow) {
            let n = noise(imgX * nScale, imgY * nScale);
            angle = map(n, 0, 1, -PI, PI) + radians(random(-chaos, chaos));
        }

        let dynamicSize = baseRes * sizeMult * map(bright, 0, 255, 1.2, 0.5);
        let c = getAdjustedColor(r, g, b);

        push();
        translate(x + offX + baseRes/2, y + offY + baseRes/2);
        rotate(angle);
        stroke(c); 
        strokeWeight(strokeThick);
        noFill();

        for (let path of allPaths) {
          beginShape();
          for (let p of path) vertex(p.x * dynamicSize, p.y * dynamicSize);
          endShape();
        }
        pop();
      }
    }
  }
}

function saveArtwork() {
  let wasVisible = uiVisible;
  if (wasVisible) uiVisible = false;
  
  let useBg = bgCheckbox.checked();
  let pg = createGraphics(floor(artworkBounds.w), floor(artworkBounds.h));
  pg.pixelDensity(1);
  
  if (useBg) {
    pg.background(245);
  } else {
    pg.clear(); 
  }
  
  let baseRes = sliders['res'].el.value();
  let sizeMult = sliders['size'].el.value();
  let strokeThick = sliders['thick'].el.value();
  let nScale = sliders['noise'].el.value();
  let chaos = sliders['chaos'].el.value();
  let useFlow = modeCheckbox.checked();
  
  img.loadPixels();
  
  for (let y = 0; y < artworkBounds.h; y += baseRes) {
    for (let x = 0; x < artworkBounds.w; x += baseRes) {
      let imgX = floor(map(x, 0, artworkBounds.w, 0, img.width));
      let imgY = floor(map(y, 0, artworkBounds.h, 0, img.height));
      let index = (imgY * img.width + imgX) * 4;
      
      let r = img.pixels[index];
      let g = img.pixels[index + 1];
      let b = img.pixels[index + 2];
      let bright = (r + g + b) / 3;

      if (bright < 240) {
        let angle = 0;
        if (useFlow) {
          let n = noise(imgX * nScale, imgY * nScale);
          angle = map(n, 0, 1, -PI, PI) + radians(random(-chaos, chaos));
        }

        let dynamicSize = baseRes * sizeMult * map(bright, 0, 255, 1.2, 0.5);
        
        // Manual color calculation for PG context
        let s = sliders['sat'].el.value();
        let gray = (r + g + b) / 3;
        let cR = constrain((lerp(gray, r, s) * sliders['r_mult'].el.value()), 0, 255);
        let cG = constrain((lerp(gray, g, s) * sliders['g_mult'].el.value()), 0, 255);
        let cB = constrain((lerp(gray, b, s) * sliders['b_mult'].el.value()), 0, 255);

        pg.push();
        pg.translate(x + baseRes/2, y + baseRes/2);
        pg.rotate(angle);
        pg.stroke(cR, cG, cB);
        pg.strokeWeight(strokeThick);
        pg.noFill();

        for (let path of allPaths) {
          pg.beginShape();
          for (let p of path) pg.vertex(p.x * dynamicSize, p.y * dynamicSize);
          pg.endShape();
        }
        pg.pop();
      }
    }
  }
  
  let timestamp = year() + nf(month(), 2) + nf(day(), 2) + '_' + nf(hour(), 2) + nf(minute(), 2) + nf(second(), 2);
  pg.save('symbol_raster_' + timestamp + '.png');
  
  if (wasVisible) uiVisible = true;
  needsRedraw = true;
}

// REST OF THE ORIGINAL FUNCTIONS (mousePressed, mouseDragged, etc.) remain the same...
function mousePressed() { if (drawingMode) { currentPath = []; hasStartedDrawing = true; } }
function mouseDragged() { if (drawingMode) currentPath.push(createVector(mouseX, mouseY)); }
function mouseReleased() { if (drawingMode && currentPath.length > 0) { allPaths.push(currentPath); currentPath = []; } }
function handleFile(file) { if (file.type === 'image') { img = loadImage(file.data, (loadedImg) => { if(loadedImg.width > 600) loadedImg.resize(600, 0); img = loadedImg; needsRedraw = true; }); } }
function normalizeAllPaths() { let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity; for (let path of allPaths) { for (let p of path) { minX = min(minX, p.x); minY = min(minY, p.y); maxX = max(maxX, p.x); maxY = max(maxY, p.y); } } let w = maxX - minX, h = maxY - minY, maxDim = max(w, h) || 1; for (let path of allPaths) { for (let p of path) { p.x = (p.x - (minX + w / 2)) / maxDim; p.y = (p.y - (minY + h / 2)) / maxDim; } } }
function windowResized() { resizeCanvas(windowWidth, windowHeight); needsRedraw = true; }

function keyPressed() {
  if (keyCode === ENTER && drawingMode && allPaths.length > 0) {
    normalizeAllPaths();
    drawingMode = false;
    fileInput.show();
    for(let k in sliders) sliders[k].el.show();
    modeCheckbox.show();
    bgCheckbox.show();
    needsRedraw = true;
  }
  if (key === 's' || key === 'S') { if (!drawingMode && img) saveArtwork(); }
  if (key === 'h' || key === 'H') {
    uiVisible = !uiVisible;
    let state = uiVisible ? 'show' : 'hide';
    fileInput[state]();
    for(let k in sliders) sliders[k].el[state]();
    modeCheckbox[state]();
    bgCheckbox[state]();
    if(!drawingMode && img) needsRedraw = true;
  }
}