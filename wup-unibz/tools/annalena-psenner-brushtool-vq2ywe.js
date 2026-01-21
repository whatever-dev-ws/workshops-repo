// WUP 25-26
// Annalena Psenner
let brushColor = '#2d3436';
let brushSize = 15;
let brushType = 'line'; 
let bgColor = '#ffffff';
let controlBarHeight = 100; 
let isMobile = false;
let pg; 

function setup() {
  createCanvas(windowWidth, windowHeight);
  // Create the drawing layer with a transparent background
  pg = createGraphics(windowWidth, windowHeight);
  pg.clear(); 
  
  checkLayout();
  createUI();
}

function checkLayout() {
  isMobile = windowWidth < 800;
  controlBarHeight = isMobile ? 180 : 100;
}

function draw() {
  background(bgColor); // This draws the chosen background color
  image(pg, 0, 0);     // This draws your saved artwork on top
  
  if (mouseIsPressed && mouseY > controlBarHeight) {
    pg.push();
    if (brushType === 'eraser') {
      pg.erase();
      pg.strokeWeight(brushSize);
      pg.line(pmouseX, pmouseY, mouseX, mouseY);
      pg.noErase();
    } else {
      pg.stroke(brushColor);
      pg.strokeWeight(brushSize);
      pg.strokeCap(ROUND);

      if (brushType === 'line') {
        pg.line(pmouseX, pmouseY, mouseX, mouseY);
      } 
      else if (brushType === 'dots') {
        pg.noStroke();
        pg.fill(brushColor);
        let distance = dist(pmouseX, pmouseY, mouseX, mouseY);
        let dotSpacing = brushSize * 1.2; 
        
        // FIX: Prevent division by zero if mouse hasn't moved
        if (distance > 0) {
          for (let d = 0; d <= distance; d += dotSpacing) {
            let pct = d / distance;
            let x = lerp(pmouseX, mouseX, pct);
            let y = lerp(pmouseY, mouseY, pct);
            pg.ellipse(x, y, brushSize / 2);
          }
        } else {
          // Draw a single dot for a click without movement
          pg.ellipse(mouseX, mouseY, brushSize / 2);
        }
      } 
      else if (brushType === 'hair') {
        pg.strokeWeight(max(1, brushSize/10));
        for (let i = 0; i < 4; i++) {
          let off = lerp(-brushSize/2, brushSize/2, i/3);
          pg.line(pmouseX + off, pmouseY + off, mouseX + off, mouseY + off);
        }
      } 
      else if (brushType === 'sparkle') {
        pg.noStroke();
        pg.fill(brushColor);
        for (let i = 0; i < 6; i++) {
          let offsetX = random(-brushSize, brushSize) * 1.5;
          let offsetY = random(-brushSize, brushSize) * 1.5;
          let s = random(1, brushSize / 3);
          pg.ellipse(mouseX + offsetX, mouseY + offsetY, s);
        }
      }
    }
    pg.pop();
  }

  drawControlPanel();
}

function drawControlPanel() {
  push();
  fill(255);
  noStroke();
  drawingContext.shadowBlur = 25;
  drawingContext.shadowColor = 'rgba(0,0,0,0.1)';
  rect(0, 0, width, controlBarHeight);
  
  fill(80);
  noStroke();
  textSize(11);
  textStyle(BOLD);
  textFont('Helvetica, Arial, sans-serif');
  drawingContext.letterSpacing = "1px";

  let toolsX = 40;
  let settingsX = isMobile ? 40 : 380; 
  let canvasX = isMobile ? 40 : 620;

  text("BRUSH TOOLS", toolsX, 25);
  drawBrushIcons(toolsX, 42);

  if (!isMobile) {
    text("STROKE & COLOR", settingsX, 25);
    text("CANVAS COLOR", canvasX, 25);
  }
  pop();
}

function drawBrushIcons(startX, y) {
  let types = [['line', "PEN"], ['dots', "DOTS"], ['hair', "LINES"], ['sparkle', "SPLASH"], ['eraser', "ERASER"]];
  types.forEach((t, i) => drawBrushIcon(startX + (i * 65), y, t[0], t[1]));
}

function drawBrushIcon(x, y, type, label) {
  let isSelected = brushType === type;
  push();
  noStroke();
  fill(isSelected ? '#f2f2f2' : '#ffffff');
  if(isSelected) {
    stroke(brushColor);
    strokeWeight(2);
  }
  ellipse(x + 20, y + 20, 42, 42);
  stroke(isSelected ? brushColor : 180);
  strokeWeight(2);
  
  if (type === 'line') line(x+14, y+26, x+26, y+14);
  if (type === 'dots') { ellipse(x+20, y+20, 3); point(x+14, y+14); point(x+26, y+26); }
  if (type === 'hair') { line(x+14, y+16, x+26, y+16); line(x+14, y+24, x+26, y+24); }
  if (type === 'sparkle') { noStroke(); fill(isSelected ? brushColor : 180); ellipse(x+20, y+20, 6); ellipse(x+14, y+14, 3); }
  if (type === 'eraser') { noFill(); rect(x+14, y+14, 12, 12, 2); }
  
  fill(isSelected ? 20 : 140);
  noStroke();
  textAlign(CENTER);
  textSize(9);
  textStyle(BOLD);
  text(label, x + 20, y + 56);
  pop();
}

function createUI() {
  removeElements();
  let settingsX = isMobile ? 40 : 380;
  let canvasX = isMobile ? 180 : 620;
  let uiY = isMobile ? 125 : 42;

  // Brush Color Picker
  let brushBtn = createButton('');
  brushBtn.position(settingsX, uiY);
  styleModernButton(brushBtn, brushColor);
  let cp = createColorPicker(brushColor);
  cp.style('visibility', 'hidden');
  brushBtn.mousePressed(() => cp.elt.click());
  cp.input(() => {
    brushColor = cp.color();
    brushBtn.style('background-color', brushColor);
  });

  // Stroke Slider
  let sz = createSlider(1, 100, brushSize);
  sz.position(settingsX + 50, uiY + 10);
  sz.style('width', '100px');
  sz.input(() => brushSize = sz.value());

  // Background Color Picker
  let bgBtn = createButton('🎨');
  bgBtn.position(canvasX, uiY);
  styleModernButton(bgBtn, bgColor);
  let bgcp = createColorPicker(bgColor);
  bgcp.style('visibility', 'hidden');
  bgBtn.mousePressed(() => bgcp.elt.click());
  bgcp.input(() => {
    bgColor = bgcp.color();
    bgBtn.style('background-color', bgColor);
  });

  // Download Button
  let sBtn = createButton('DOWNLOAD');
  sBtn.position(width - 120, isMobile ? height - 55 : 42);
  sBtn.style('background', '#2d3436');
  sBtn.style('color', '#fff');
  sBtn.style('border', 'none');
  sBtn.style('padding', '10px 15px');
  sBtn.style('border-radius', '6px');
  sBtn.style('font-weight', 'bold');
  sBtn.style('font-size', '10px');
  sBtn.style('cursor', 'pointer');
  sBtn.mousePressed(() => {
    let saveImg = createGraphics(width, height);
    saveImg.background(bgColor);
    saveImg.image(pg, 0, 0);
    let finalExport = saveImg.get(0, controlBarHeight, width, height - controlBarHeight);
    finalExport.save('artwork.png');
  });
}

function styleModernButton(btn, col) {
  btn.style('background-color', col);
  btn.style('width', '32px');
  btn.style('height', '32px');
  btn.style('border', '2px solid #eee');
  btn.style('border-radius', '50%');
  btn.style('cursor', 'pointer');
}

function mousePressed() {
  // Check if clicking within the UI area
  if (mouseY < controlBarHeight) {
    let bX = 40;
    // Simple bounds check for tool buttons
    if (mouseX > bX && mouseX < bX + 45) brushType = 'line';
    else if (mouseX > bX + 65 && mouseX < bX + 110) brushType = 'dots';
    else if (mouseX > bX + 130 && mouseX < bX + 175) brushType = 'hair';
    else if (mouseX > bX + 195 && mouseX < bX + 240) brushType = 'sparkle';
    else if (mouseX > bX + 260 && mouseX < bX + 305) brushType = 'eraser';
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  // Optional: Resize the graphics layer too if you want to keep drawing
  let newPg = createGraphics(windowWidth, windowHeight);
  newPg.image(pg, 0, 0);
  pg = newPg;
  
  checkLayout();
  createUI();
}