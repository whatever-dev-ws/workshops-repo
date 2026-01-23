// WUP 2025-26
// Anna Govetto
let fase = 0; 
let img;
let sliderSpacing, sliderLight, sliderPoints, sliderInnerRadius, sliderDeconstruction, selFilter;
let inputFile, btnSave; 
let displayedImg = { x: 0, y: 0, w: 0, h: 0 }; 
let pastelPink = [255, 182, 193]; 
let pg; 
let uiContainer; 
let btnToggle;
let menuOpen = false; 
let needsUpdate = true; 

function setup() {
  let canvas = createCanvas(windowWidth, windowHeight);
  canvas.style('display', 'block');

  // CSS for UI
  createElement('style', `
    #ui-side-panel {
      position: absolute; top: 0; left: -240px; width: 240px; height: 100vh;
      overflow-y: auto; padding: 80px 20px 40px 20px;
      box-sizing: border-box; background-color: rgb(255, 182, 193);
      z-index: 100; transition: left 0.4s ease;
      font-family: sans-serif; box-shadow: 5px 0 15px rgba(0,0,0,0.2);
    }
    #toggle-menu {
      position: absolute; top: 20px; left: 20px; z-index: 101;
      width: 45px; height: 45px; background: #000; color: #fff;
      border: none; border-radius: 50%; cursor: pointer; display: none;
    }
    .control-group { margin-bottom: 25px; }
    .control-label { font-size: 10px; font-weight: bold; display: block; margin-bottom:5px; }
    
    /* CUSTOM FILE INPUT STYLE */
    .custom-file-input {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 11px;
    }
    .file-btn {
      background: #fff;
      border: 1px solid #000;
      padding: 5px 10px;
      cursor: pointer;
      font-weight: bold;
      white-space: nowrap;
      width: auto !important;
    }
    #file-name {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: #333;
    }

    select, input, button { width: 100%; cursor: pointer; }
  `);

  uiContainer = createDiv('').id('ui-side-panel');
  btnToggle = createButton('→').id('toggle-menu').mousePressed(togglePanel);

  createControls();
  pg = createGraphics(windowWidth, windowHeight);
}

function createControls() {
  uiContainer.child(createElement('h2', 'STAR RASTER PRO').style('font-size', '16px').style('margin-bottom', '20px'));

  // 1. FILE - CUSTOM ENGLISH BUTTON
  let div1 = createDiv('').class('control-group').parent(uiContainer);
  div1.child(createElement('label', '1. IMPORT FILE').class('control-label'));
  
  let customFileWrap = createDiv('').class('custom-file-input').parent(div1);
  let fakeBtn = createButton('CHOOSE FILE').class('file-btn').parent(customFileWrap);
  let fileNameLabel = createSpan('No file chosen').id('file-name').parent(customFileWrap);
  
  // Real input hidden
  inputFile = createFileInput(handleFile);
  inputFile.style('display', 'none');
  inputFile.parent(div1);
  
  fakeBtn.mousePressed(() => inputFile.elt.click());

  // 2. GRID
  let div2 = createDiv('').class('control-group').parent(uiContainer);
  div2.child(createElement('label', '2. GRID RESOLUTION').class('control-label'));
  sliderSpacing = createSlider(10, 60, 25).parent(div2).input(() => needsUpdate = true);

  // 3. LIGHT
  let div3 = createDiv('').class('control-group').parent(uiContainer);
  div3.child(createElement('label', '3. LIGHT DIFFUSION').class('control-label'));
  sliderLight = createSlider(50, 1000, 400).parent(div3).input(() => needsUpdate = true);

  // 4. DECONSTRUCTION
  let div4 = createDiv('').class('control-group').parent(uiContainer);
  div4.child(createElement('label', '4. DECONSTRUCTION').class('control-label'));
  sliderDeconstruction = createSlider(0, 150, 0).parent(div4).input(() => needsUpdate = true);

  // 5. STAR POINTS
  let div5 = createDiv('').class('control-group').parent(uiContainer);
  div5.child(createElement('label', '5. STAR POINTS').class('control-label'));
  sliderPoints = createSlider(3, 20, 5, 1).parent(div5).input(() => needsUpdate = true);

  // 6. INNER RADIUS
  let div6 = createDiv('').class('control-group').parent(uiContainer);
  div6.child(createElement('label', '6. INNER RADIUS').class('control-label'));
  sliderInnerRadius = createSlider(0.1, 0.9, 0.4, 0.05).parent(div6).input(() => needsUpdate = true);

  // 7. COLOR
  let div7 = createDiv('').class('control-group').parent(uiContainer);
  div7.child(createElement('label', '7. COLOR BALANCE').class('control-label'));
  selFilter = createSelect().parent(div7).changed(() => needsUpdate = true);
  selFilter.option('Original');
  selFilter.option('Warm Light (3000K)');
  selFilter.option('Cool Light (6500K)');
  selFilter.option('High Contrast (B&W)');

  btnSave = createButton('DOWNLOAD RASTER').parent(uiContainer).mousePressed(saveImage)
    .style('margin-top','20px').style('background','#000').style('color','#fff').style('height','45px').style('border','none').style('border-radius','5px');
}

function draw() {
  if (fase === 0) {
    background(pastelPink);
    rectMode(CENTER);
    fill(255);
    rect(width / 2, height / 2, 250, 80, 20);
    fill(0);
    textAlign(CENTER, CENTER);
    textSize(22);
    text("START PROJECT", width / 2, height / 2);
  } else {
    if (needsUpdate) {
      drawRaster();
      needsUpdate = false; 
    }
    background(15);
    image(pg, 0, 0);
  }
}

function drawRaster() {
  pg.clear();
  pg.background(15);
  if (!img) return;

  let spacing = sliderSpacing.value();
  let lightRadius = sliderLight.value();
  let deconstruction = sliderDeconstruction.value();
  let filterVal = selFilter.value();
  let numPoints = sliderPoints.value();
  let radiusCoeff = sliderInnerRadius.value();
  
  let targetX = width / 2;
  let targetY = height / 2;

  img.loadPixels();

  for (let x = displayedImg.x; x < displayedImg.x + displayedImg.w; x += spacing) {
    for (let y = displayedImg.y; y < displayedImg.y + displayedImg.h; y += spacing) {
      
      let imgX = floor(map(x, displayedImg.x, displayedImg.x + displayedImg.w, 0, img.width - 1));
      let imgY = floor(map(y, displayedImg.y, displayedImg.y + displayedImg.h, 0, img.height - 1));
      
      let index = (imgX + imgY * img.width) * 4;
      let r = img.pixels[index];
      let g = img.pixels[index + 1];
      let b = img.pixels[index + 2];

      if (filterVal === 'Warm Light (3000K)') { r *= 1.3; b *= 0.7; }
      else if (filterVal === 'Cool Light (6500K)') { r *= 0.8; b *= 1.4; }
      else if (filterVal === 'High Contrast (B&W)') { 
        let grey = (r + g + b) / 3; 
        r = g = b = grey > 127 ? 255 : 0; 
      }

      let d = dist(targetX, targetY, x, y);
      let intensity = map(d, 0, lightRadius, 1, 0, true);
      
      if (intensity > 0.05) {
        let noiseX = noise(x * 0.01, y * 0.01);
        let noiseY = noise(y * 0.01, x * 0.01 + 100);
        let offsetX = map(noiseX, 0, 1, -deconstruction, deconstruction);
        let offsetY = map(noiseY, 0, 1, -deconstruction, deconstruction);

        pg.push();
        pg.translate(x + offsetX, y + offsetY);
        pg.rotate(atan2(targetY - (y + offsetY), targetX - (x + offsetX)));
        pg.fill(r * intensity, g * intensity, b * intensity);
        pg.noStroke();
        
        let r2 = spacing * 0.7;
        let r1 = r2 * radiusCoeff;
        drawStar(0, 0, r1, r2, numPoints, pg);
        pg.pop();
      }
    }
  }
}

function drawStar(x, y, r1, r2, n, target) {
  target.beginShape();
  let angle = TWO_PI / n;
  for (let a = 0; a < TWO_PI; a += angle) {
    target.vertex(x + cos(a) * r2, y + sin(a) * r2);
    target.vertex(x + cos(a + angle/2) * r1, y + sin(a + angle/2) * r1);
  }
  target.endShape(CLOSE);
}

function handleFile(file) {
  if (file.type === 'image') {
    select('#file-name').html(file.name); // Updates the fake label
    img = loadImage(file.data, () => {
      let ratio = min((width - 80) / img.width, (height - 80) / img.height);
      displayedImg.w = img.width * ratio;
      displayedImg.h = img.height * ratio;
      displayedImg.x = (width - displayedImg.w) / 2;
      displayedImg.y = (height - displayedImg.h) / 2;
      img.loadPixels();
      needsUpdate = true; 
    });
  }
}

function togglePanel() {
  menuOpen = !menuOpen;
  uiContainer.style('left', menuOpen ? '0px' : '-240px');
  btnToggle.style('left', menuOpen ? '250px' : '20px');
  btnToggle.html(menuOpen ? '←' : '→');
}

function mousePressed() {
  if (fase === 0 && mouseX > width/2 - 125 && mouseX < width/2 + 125 && mouseY > height/2 - 40 && mouseY < height/2 + 40) {
    fase = 1;
    btnToggle.style('display', 'block');
    needsUpdate = true;
  }
}

function saveImage() {
  save(pg, 'star_raster_output.jpg');
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  pg = createGraphics(windowWidth, windowHeight);
  needsUpdate = true;
}