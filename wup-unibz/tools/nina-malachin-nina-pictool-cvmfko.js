let video;
let shapeSelect, cpSlow, cpFast;
let isRecording = false;
let totalFrames = 60;
let prevPixels = []; 

function setup() {
  createCanvas(windowWidth, windowHeight);
  
  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide();

  // --- THE FIX: SILENCE P5 NOTIFICATIONS ---
  // This CSS rule hides any paragraph that is a direct child of the body 
  // (which is where p5.js injects the "Done" message)
  let style = createElement('style');
  style.html(`
    body > p { display: none !important; visibility: hidden !important; opacity: 0 !important; }
  `);
  
  // ---- COMPACT UI INTERFACE ----
  let ui = createDiv('');
  ui.position(15, 15);
  ui.style('background', 'rgba(255, 255, 255, 0.7)');
  ui.style('backdrop-filter', 'blur(5px)');
  ui.style('padding', '15px');
  ui.style('border-radius', '10px');
  ui.style('font-family', 'sans-serif');
  ui.style('width', '180px');
  ui.style('box-shadow', '0 4px 15px rgba(0,0,0,0.1)');

  // Title in the UI (Inside a div, so it stays visible)
  let title = createP('<b>MY VIDEO LAB</b>');
  title.parent(ui);
  title.style('margin', '0 0 10px 0');
  title.style('font-size', '12px');

  // Shape Selection
  shapeSelect = createSelect().parent(ui).style('width', '100%');
  shapeSelect.option('CIRCLES');
  shapeSelect.option('SQUARES');
  shapeSelect.option('STARS');
  shapeSelect.option('HEARTS');
  shapeSelect.option('TRIANGLES');
  shapeSelect.option('HEXAGONS');
  shapeSelect.option('CROSSES');

  // Colors
  createP('Colors (Still vs Motion)').parent(ui).style('font-size', '10px').style('margin', '10px 0 5px 0');
  let cRow = createDiv('').parent(ui).style('display', 'flex').style('gap', '5px');
  cpSlow = createColorPicker('#222222').parent(cRow).style('width', '100%');
  cpFast = createColorPicker('#00ffcc').parent(cRow).style('width', '100%');

  // Buttons
  let btnStyle = "width:100%; margin-top:10px; font-size:10px; padding:5px; cursor:pointer;";
  
  let btnW = createButton('SAVE PHOTO (W)').parent(ui).elt.setAttribute('style', btnStyle);
  let btnG = createButton('RECORD GIF (G)').parent(ui).elt.setAttribute('style', btnStyle);
  
  // Assign actions
  selectAll('button')[0].mousePressed(() => saveCanvas('raster_art', 'png'));
  selectAll('button')[1].mousePressed(startRecording);

  noStroke();
  rectMode(CENTER);
}

function draw() {
  background(245);

  if (isRecording) {
    fill(255, 0, 0);
    ellipse(width - 25, 25, 12, 12);
  }

  video.loadPixels();
  if (video.pixels.length === 0) return;

  let step = floor(map(mouseX, 0, width, 12, 40, true));
  let sensitivity = map(mouseY, 0, height, 0.5, 3.0);

  push();
  translate(width, 0);
  scale(-1, 1);

  for (let y = 0; y < video.height; y += step) {
    for (let x = 0; x < video.width; x += step) {
      let index = (y * video.width + x) * 4;
      
      if (index + 2 >= video.pixels.length) continue;

      let r = video.pixels[index];
      let g = video.pixels[index + 1];
      let b = video.pixels[index + 2];
      
      let motion = 0;
      if (prevPixels.length === video.pixels.length) {
        motion = dist(r, g, b, prevPixels[index], prevPixels[index+1], prevPixels[index+2]);
      }
      
      let lumin = (0.299 * r + 0.587 * g + 0.114 * b);
      let d = map(lumin, 0, 255, step * sensitivity, 0);
      
      if (d > 0.5) {
        let colorInterp = map(motion, 0, 50, 0, 1, true);
        let finalCol = lerpColor(color(cpSlow.value()), color(cpFast.value()), colorInterp);
        
        fill(finalCol);
        let posX = map(x, 0, video.width, 0, width);
        let posY = map(y, 0, video.height, 0, height);
        
        push();
        translate(posX, posY);
        rotate(motion * 0.05); 
        drawCustomShape(d, shapeSelect.value());
        pop();
      }
    }
  }
  pop();
  
  if (prevPixels.length !== video.pixels.length) {
    prevPixels = new Uint8ClampedArray(video.pixels.length);
  }
  prevPixels.set(video.pixels);
}

function drawCustomShape(d, type) {
  if (type === 'CIRCLES') ellipse(0, 0, d, d);
  else if (type === 'SQUARES') rect(0, 0, d, d);
  else if (type === 'HEARTS') drawHeart(d);
  else if (type === 'STARS') drawStar(0, 0, d * 0.2, d * 0.5, 5);
  else if (type === 'TRIANGLES') triangle(0, -d/2, -d/2, d/2, d/2, d/2);
  else if (type === 'HEXAGONS') drawStar(0, 0, d * 0.45, d * 0.5, 6);
  else if (type === 'CROSSES') {
    rect(0, 0, d, d/4);
    rect(0, 0, d/4, d);
  }
}

function drawHeart(size) {
  beginShape();
  for (let a = 0; a < TWO_PI; a += 0.2) {
    let r = size / 35;
    let x = r * 16 * pow(sin(a), 3);
    let y = -r * (13 * cos(a) - 5 * cos(2 * a) - 2 * cos(3 * a) - cos(4 * a));
    vertex(x, y);
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

function startRecording() {
  isRecording = true;
  saveGif('raster_motion_art', totalFrames, {
    units: 'frames',
    onComplete: () => { isRecording = false; }
  });
}

function keyPressed() {
  if (key === 'g' || key === 'G') startRecording();
  if (key === 'w' || key === 'W') saveCanvas('raster_snap', 'png');
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
g}