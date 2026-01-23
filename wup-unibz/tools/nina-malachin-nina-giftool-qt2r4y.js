let totalFrames = 120;
let shapeType = 'CIRCLE';
let shapeSelect, cpSlow, cpFast, cpBG, sliderWeight;
let isRecording = false;

function setup() {
  createCanvas(windowWidth, windowHeight);
  rectMode(CENTER);
  noFill();

  // --- THE FIX: SILENCE P5 NOTIFICATIONS ---
  let style = createElement('style');
  style.html(`
    body > p { display: none !important; visibility: hidden !important; opacity: 0 !important; }
  `);

  // ---- UI INTERFACE ----
  let ui = createDiv('');
  ui.position(20, 20);
  ui.style('background', 'rgba(255, 255, 255, 0.9)');
  ui.style('padding', '20px');
  ui.style('border-radius', '12px');
  ui.style('font-family', 'sans-serif');
  ui.style('box-shadow', '0 10px 30px rgba(0,0,0,0.1)');
  ui.style('width', '220px');

  createP('<b>GENERATIVE CONTROLS</b>').parent(ui).style('margin-top', '0');

  // Shape Selection
  createP('Shape').parent(ui).style('font-size', '10px').style('margin-bottom', '5px');
  shapeSelect = createSelect().parent(ui).style('width', '100%');
  shapeSelect.option('CIRCLE');
  shapeSelect.option('SQUARE');
  shapeSelect.option('TRIANGLE');
  shapeSelect.option('HEXAGON');
  shapeSelect.option('STAR');
  shapeSelect.option('CROSS');
  shapeSelect.option('POINT');
  shapeSelect.changed(() => shapeType = shapeSelect.value());

  // Dynamic Colors
  createP('Colors (Slow vs Fast)').parent(ui).style('font-size', '10px').style('margin-top', '15px');
  let colorContainer = createDiv('').parent(ui).style('display', 'flex').style('gap', '10px');
  cpSlow = createColorPicker('#000000').parent(colorContainer).style('width', '50%');
  cpFast = createColorPicker('#ff0055').parent(colorContainer).style('width', '50%');

  // Background Color
  createP('Background Color').parent(ui).style('font-size', '10px').style('margin-top', '15px');
  cpBG = createColorPicker('#ffffff').parent(ui).style('width', '100%');

  // Thickness Control
  createP('Line Thickness').parent(ui).style('font-size', '10px').style('margin-top', '15px');
  sliderWeight = createSlider(0.5, 15, 2, 0.5).parent(ui).style('width', '100%');

  // Randomize Button
  let btnRand = createButton('RANDOMIZE EVERYTHING').parent(ui).style('width', '100%').style('margin-top', '20px').style('cursor', 'pointer');
  btnRand.mousePressed(randomizeSettings);

  // Export Buttons
  let btnPNG = createButton('SAVE PNG (W)').parent(ui).style('width', '100%').style('margin-top', '10px');
  btnPNG.mousePressed(() => saveCanvas('generative_art', 'png'));

  let btnGIF = createButton('SAVE LOOP VIDEO (G)').parent(ui).style('width', '100%').style('margin-top', '10px');
  btnGIF.mousePressed(startGifCapture);

  createP('<i>Move mouse for complexity and rotation</i>').parent(ui).style('font-size', '9px').style('color', '#666').style('margin-top', '10px');
}

function draw() {
  background(cpBG.color());
  
  translate(width/2, height/2);
  
  // Mouse speed color logic
  let mouseSpeed = dist(mouseX, mouseY, pmouseX, pmouseY);
  let colorMix = map(mouseSpeed, 0, 50, 0, 1, true);
  let finalColor = lerpColor(color(cpSlow.value()), color(cpFast.value()), colorMix);

  let percent = (frameCount % totalFrames) / totalFrames;
  let angle = TWO_PI * percent;
  let pulse = sin(angle) * 50;

  let complexity = map(mouseX, 0, width, 5, 50, true);
  let rotationSpeed = map(mouseY, 0, height, 0.1, 3.0);

  strokeWeight(sliderWeight.value());

  for (let i = 0; i < complexity; i++) {
    push();
    rotate(angle + (i * 0.1) * rotationSpeed);
    
    let strokeCol = color(finalColor);
    strokeCol.setAlpha(map(i, 0, complexity, 255, 20));
    stroke(strokeCol);
    
    let diameter = i * 15 + pulse;
    drawSelectedShape(0, 0, diameter);
    pop();
  }
}

function drawSelectedShape(x, y, d) {
  if (shapeType === 'SQUARE') rect(x, y, d, d);
  else if (shapeType === 'CIRCLE') ellipse(x, y, d, d);
  else if (shapeType === 'TRIANGLE') {
    drawPoly(x, y, d/2, 3);
  } else if (shapeType === 'HEXAGON') {
    drawPoly(x, y, d/2, 6);
  } else if (shapeType === 'STAR') {
    drawStar(x, y, d/4, d/2, 5);
  } else if (shapeType === 'CROSS') {
    line(x - d/2, y, x + d/2, y);
    line(x, y - d/2, x, y + d/2);
  } else if (shapeType === 'POINT') {
    point(x + d/2, y);
    point(x - d/2, y);
  }
}

function drawPoly(x, y, radius, npoints) {
  let angle = TWO_PI / npoints;
  beginShape();
  for (let a = 0; a < TWO_PI; a += angle) {
    let sx = x + cos(a) * radius;
    let sy = y + sin(a) * radius;
    vertex(sx, sy);
  }
  endShape(CLOSE);
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

function randomizeSettings() {
  cpSlow.value(color(random(255), random(255), random(255)).toString('#rrggbb'));
  cpFast.value(color(random(255), random(255), random(255)).toString('#rrggbb'));
  cpBG.value(color(random(200, 255), random(200, 255), random(200, 255)).toString('#rrggbb'));
  sliderWeight.value(random(0.5, 8));
  let options = ['CIRCLE', 'SQUARE', 'TRIANGLE', 'HEXAGON', 'STAR', 'CROSS', 'POINT'];
  shapeType = random(options);
  shapeSelect.selected(shapeType);
}

function startGifCapture() {
  isRecording = true;
  frameCount = 0;  
  saveGif('generative_loop', totalFrames, {
    units: 'frames',
    onComplete: () => { isRecording = false; }
  });
}

function keyPressed() {
  if (key === 'g' || key === 'G') startGifCapture();
  if (key === 'w' || key === 'W') saveCanvas('generative_art', 'png');
  if (key === 'r' || key === 'R') randomizeSettings();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}