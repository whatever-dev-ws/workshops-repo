let points = [];
let msgInput, fontSelect, shapeSelect, brushTypeSelect;
let sizeSlider, gapSlider, brushSizeSlider;
let cpSlow, cpFast, cpBG;
let currentMsg = "NINA";
let isRecording = false;

function setup() {
  createCanvas(windowWidth, windowHeight);

  // --- THE FIX: SILENCE P5 NOTIFICATIONS ---
  let style = createElement('style');
  style.html(`
    body > p { display: none !important; visibility: hidden !important; opacity: 0 !important; pointer-events: none !important; }
  `);

  // ---- MASTER UI INTERFACE ----
  let ui = createDiv('');
  ui.position(20, 20);
  ui.style('background', 'rgba(255, 255, 255, 0.9)');
  ui.style('padding', '20px');
  ui.style('border-radius', '12px');
  ui.style('font-family', 'sans-serif');
  ui.style('width', '240px');
  ui.style('box-shadow', '0 8px 32px rgba(0,0,0,0.1)');
  ui.style('max-height', '90vh');
  ui.style('overflow-y', 'auto');

  createP('<b>TYPO MASTER LAB</b>').parent(ui).style('margin', '0 0 15px 0');

  createP('TEXT CONTENT').parent(ui).style('font-size', '10px').style('font-weight', 'bold');
  msgInput = createInput(currentMsg).parent(ui).style('width', '100%');
  msgInput.input(() => { currentMsg = msgInput.value(); generatePoints(); });

  createP('SELECT FONT').parent(ui).style('font-size', '10px').style('margin-top', '10px');
  fontSelect = createSelect().parent(ui).style('width', '100%');
  fontSelect.option('Arial'); fontSelect.option('Verdana'); fontSelect.option('Georgia'); fontSelect.option('Impact'); fontSelect.option('Courier New');
  fontSelect.changed(generatePoints);

  createP('<b>SMOOTH COLLISION</b>').parent(ui).style('margin-top', '20px').style('border-top', '1px solid #eee').style('padding-top', '10px');
  brushTypeSelect = createSelect().parent(ui).style('width', '100%');
  brushTypeSelect.option('CIRCLE'); brushTypeSelect.option('SQUARE'); brushTypeSelect.option('TRIANGLE');
  
  brushSizeSlider = createSlider(20, 300, 120).parent(ui).style('width', '100%');

  createP('<b>RASTER SHAPE</b>').parent(ui).style('margin-top', '20px').style('border-top', '1px solid #eee').style('padding-top', '10px');
  shapeSelect = createSelect().parent(ui).style('width', '100%');
  shapeSelect.option('CIRCLES'); shapeSelect.option('SQUARES'); shapeSelect.option('TRIANGLES'); shapeSelect.option('STARS');

  createP('FONT SIZE').parent(ui).style('font-size', '10px');
  sizeSlider = createSlider(50, 500, 180).parent(ui).style('width', '100%');
  sizeSlider.input(generatePoints);

  createP('DENSITY').parent(ui).style('font-size', '10px');
  gapSlider = createSlider(4, 30, 8).parent(ui).style('width', '100%');
  gapSlider.input(generatePoints);

  createP('<b>COLORS</b>').parent(ui).style('margin-top', '20px').style('border-top', '1px solid #eee').style('padding-top', '10px');
  cpBG = createColorPicker('#ffffff').parent(ui).style('width', '100%');
  let cRow = createDiv('').parent(ui).style('display', 'flex').style('gap', '5px').style('margin-top', '5px');
  cpSlow = createColorPicker('#000000').parent(cRow).style('width', '100%');
  cpFast = createColorPicker('#ff3300').parent(cRow).style('width', '100%');

  createButton('📸 SAVE PNG (W)').parent(ui).style('width', '100%').style('margin-top', '20px').mousePressed(() => saveCanvas('typo_art', 'png'));
  createButton('🎬 SAVE GIF (G)').parent(ui).style('width', '100%').style('margin-top', '5px').mousePressed(startGifCapture);

  generatePoints();
}

function generatePoints() {
  points = [];
  let pg = createGraphics(width, height);
  pg.pixelDensity(1);
  pg.background(255);
  pg.fill(0);
  pg.textFont(fontSelect.value());
  pg.textSize(sizeSlider.value());
  pg.textAlign(CENTER, CENTER);
  pg.textStyle(BOLD);
  pg.text(currentMsg, width / 2, height / 2);

  let gap = gapSlider.value();
  for (let x = 0; x < width; x += gap) {
    for (let y = 0; y < height; y += gap) {
      if (brightness(pg.get(x, y)) < 50) {
        points.push({ x: x, y: y, origX: x, origY: y, vX: 0, vY: 0 });
      }
    }
  }
  pg.remove();
}

function draw() {
  background(cpBG.color());

  let mouseSpeed = dist(mouseX, mouseY, pmouseX, pmouseY);
  let speedFactor = map(mouseSpeed, 0, 40, 0, 1, true);
  let bSize = brushSizeSlider.value();
  let bType = brushTypeSelect.value();

  for (let p of points) {
    let d = dist(mouseX, mouseY, p.x, p.y);
    let strength = 0;

    // --- SMOOTH GRADIENT COLLISION LOGIC ---
    if (bType === 'CIRCLE') {
      strength = map(d, 0, bSize, 1, 0, true);
    } else if (bType === 'SQUARE') {
      let dx = abs(p.x - mouseX);
      let dy = abs(p.y - mouseY);
      if (dx < bSize && dy < bSize) {
        strength = map(max(dx, dy), 0, bSize, 1, 0, true);
      }
    } else if (bType === 'TRIANGLE') {
      let dx = abs(p.x - mouseX);
      let dy = p.y - mouseY;
      if (dy < bSize && dy > -bSize/2 && dx < (bSize - dy) * 0.6) {
        strength = map(max(dx, dy), 0, bSize, 1, 0, true);
      }
    }

    if (strength > 0) {
      let angle = atan2(p.y - mouseY, p.x - mouseX);
      // Applying a smooth power curve to the force
      let force = pow(strength, 2) * 15; 
      p.vX += cos(angle) * force;
      p.vY += sin(angle) * force;
    }

    // Physics - Increased damping for "buttery" feel
    p.vX *= 0.82; p.vY *= 0.82;
    p.x += p.vX; p.y += p.vY;
    
    // Smooth return with easing
    p.x = lerp(p.x, p.origX, 0.1);
    p.y = lerp(p.y, p.origY, 0.1);

    let c = lerpColor(color(cpSlow.value()), color(cpFast.value()), speedFactor);
    fill(c); noStroke();
    
    let drawShape = shapeSelect.value();
    let rSize = map(speedFactor, 0, 1, 3, 10);

    push();
    translate(p.x, p.y);
    if (drawShape === 'CIRCLES') ellipse(0, 0, rSize, rSize);
    else if (drawShape === 'SQUARES') { rectMode(CENTER); rect(0, 0, rSize, rSize); }
    else if (drawShape === 'TRIANGLES') triangle(0, -rSize, -rSize, rSize, rSize, rSize);
    else if (drawShape === 'STARS') drawStar(0, 0, rSize/2, rSize, 5);
    pop();
  }
}

function drawStar(x, y, r1, r2, npoints) {
  let angle = TWO_PI / npoints;
  let halfAngle = angle / 2.0;
  beginShape();
  for (let a = 0; a < TWO_PI; a += angle) {
    let sx = x + cos(a) * r2;
    let sy = y + sin(a) * r2;
    vertex(sx, sy);
    sx = x + cos(a + halfAngle) * r1;
    sy = y + sin(a + halfAngle) * r1;
    vertex(sx, sy);
  }
  endShape(CLOSE);
}

function startGifCapture() {
  isRecording = true;
  saveGif('smooth_typo_loop', 120, { units: 'frames', onComplete: () => isRecording = false });
}

function keyPressed() {
  if (key === 'w' || key === 'W') saveCanvas('typo_art', 'png');
  if (key === 'g' || key === 'G') startGifCapture();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  generatePoints();
}