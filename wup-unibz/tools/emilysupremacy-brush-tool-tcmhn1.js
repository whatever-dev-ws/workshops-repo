let brushColor = '#8B0000';
let brushSize = 10;
let mode = 'Point Pen';
let canvasLayer; 

function setup() {
  createCanvas(800, 750);
  
  // Separate layer for the artwork
  canvasLayer = createGraphics(600, 400);
  canvasLayer.background(255);
  
  createUI();
}

function draw() {
  background(160); // Wall color
  
  drawOrnateFrame(100, 50, 600, 400);
  
  // Display the drawing layer
  image(canvasLayer, 100, 50);
  
  drawLabels();
}

function createUI() {
  let uiY = 635;

  // --- Color Picker ---
  let cp = createColorPicker(brushColor);
  cp.position(75, uiY);
  cp.elt.style.width = '60px';
  cp.elt.style.height = '30px';
  cp.elt.style.border = '2px solid #555';
  cp.elt.style.borderRadius = '4px';
  cp.elt.style.cursor = 'pointer';
  cp.input(() => brushColor = cp.value());

  // --- Size Slider ---
  let sizeSlider = createSlider(1, 100, 20);
  sizeSlider.position(230, uiY + 5);
  sizeSlider.elt.style.width = '120px';
  sizeSlider.elt.style.cursor = 'pointer';
  sizeSlider.input(() => brushSize = sizeSlider.value());

  // --- Tool Selector ---
  let sel = createSelect();
  sel.position(430, uiY);
  sel.option('Point Pen');
  sel.option('Star Eraser');
  sel.option('Fine Spray');
  sel.option('Blending Tool');
  sel.option('Diagonal Line');
  sel.style('padding', '5px');
  sel.style('border-radius', '4px');
  sel.style('background', '#fff');
  sel.style('border', '1px solid #777');
  sel.changed(() => mode = sel.value());

  // --- Save Button ---
  let saveBtn = createButton('Save Masterpiece');
  saveBtn.position(610, uiY);
  applyButtonStyle(saveBtn);
  saveBtn.mousePressed(saveMasterpiece);
}

function applyButtonStyle(btn) {
  btn.style('padding', '8px 16px');
  btn.style('background-color', '#4A3728'); // Deep wood color
  btn.style('color', '#D4AF37'); // Gold text
  btn.style('border', '2px solid #D4AF37');
  btn.style('border-radius', '5px');
  btn.style('font-weight', 'bold');
  btn.style('cursor', 'pointer');
  btn.style('transition', '0.2s');

  btn.elt.addEventListener('mouseenter', () => {
    btn.style('background-color', '#D4AF37');
    btn.style('color', '#4A3728');
  });

  btn.elt.addEventListener('mouseleave', () => {
    btn.style('background-color', '#4A3728');
    btn.style('color', '#D4AF37');
  });
}

function drawLabels() {
  fill(40);
  noStroke();
  textAlign(LEFT);
  
  // Header
  textSize(22);
  textStyle(BOLD);
  text("THE VIRTUAL GALLERY", 100, 520);
  
  // Footer Labels
  textStyle(NORMAL);
  textSize(14);
  text("INK COLOR", 75, 630);
  text("BRUSH SIZE", 230, 630);
  text("SELECT TOOL", 430, 630);
}

function mouseDragged() {
  let lx = mouseX - 100;
  let ly = mouseY - 50;
  let plx = pmouseX - 100;
  let ply = pmouseY - 50;

  // Drawing constraints to stay inside the frame
  if (lx > 0 && lx < 600 && ly > 0 && ly < 400) {
    canvasLayer.push();
    
    if (mode === 'Point Pen') {
      canvasLayer.stroke(brushColor);
      canvasLayer.strokeWeight(brushSize);
      canvasLayer.strokeCap(ROUND);
      canvasLayer.strokeJoin(ROUND);
      canvasLayer.line(plx, ply, lx, ly);
      
    } else if (mode === 'Star Eraser') {
      canvasLayer.fill(255);
      canvasLayer.noStroke();
      drawStar(canvasLayer, lx, ly, brushSize/2, brushSize, 5);
      
    } else if (mode === 'Fine Spray') {
      canvasLayer.stroke(brushColor);
      for (let i = 0; i < 20; i++) {
        let r = random(brushSize);
        let ang = random(TWO_PI);
        canvasLayer.strokeWeight(1.5);
        canvasLayer.point(lx + r * cos(ang), ly + r * sin(ang));
      }
      
    } else if (mode === 'Diagonal Line') {
      canvasLayer.stroke(brushColor);
      canvasLayer.strokeWeight(2);
      canvasLayer.line(lx - brushSize/2, ly + brushSize/2, lx + brushSize/2, ly - brushSize/2);
      
    } else if (mode === 'Blending Tool') {
      let c = canvasLayer.get(lx, ly);
      for(let r = brushSize; r > 0; r -= 2) {
        let alpha = map(r, 0, brushSize, 15, 0); 
        canvasLayer.fill(c[0], c[1], c[2], alpha);
        canvasLayer.noStroke();
        canvasLayer.ellipse(lx, ly, r);
      }
    }
    canvasLayer.pop();
  }
}

function drawOrnateFrame(x, y, w, h) {
  let thickness = 45;
  // Outer frame shadow
  noStroke();
  fill(0, 50);
  rect(x-thickness+5, y-thickness+5, w+thickness*2, h+thickness*2, 10);

  // Main gold layers
  for (let i = 0; i < thickness; i++) {
    let inter = map(i, 0, thickness, 0, 1);
    let c = lerpColor(color(100, 70, 10), color(255, 220, 100), inter);
    
    if (i % 8 === 0) c = color(60, 40, 5); 
    if (i % 8 === 1) c = color(200, 160, 40);

    stroke(c);
    noFill();
    strokeWeight(2);
    rect(x - i, y - i, w + (i * 2), h + (i * 2), 4);
  }
  
  // Inner gold beveled lip
  stroke(184, 134, 11);
  strokeWeight(8);
  rect(x - 4, y - 4, w + 8, h + 8);
}

function drawStar(pg, x, y, r1, r2, n) {
  let angle = TWO_PI / n;
  let halfAngle = angle / 2.0;
  pg.beginShape();
  for (let a = 0; a < TWO_PI; a += angle) {
    let sx = x + cos(a) * r2;
    let sy = y + sin(a) * r2;
    pg.vertex(sx, sy);
    sx = x + cos(a + halfAngle) * r1;
    sy = y + sin(a + halfAngle) * r1;
    pg.vertex(sx, sy);
  }
  pg.endShape(CLOSE);
}

function saveMasterpiece() {
  // 1. Calculate the area that includes the frame
  // The frame is 45 pixels thick (defined in drawOrnateFrame)
  let thickness = 45;
  let saveX = 100 - thickness;
  let saveY = 50 - thickness;
  let saveW = 600 + (thickness * 2);
  let saveH = 400 + (thickness * 2);

  // 2. Grab that specific rectangular area from the main canvas
  let framedArt = get(saveX, saveY, saveW, saveH);

  // 3. Save that specific portion
  framedArt.save('my_framed_masterpiece', 'jpg');
}