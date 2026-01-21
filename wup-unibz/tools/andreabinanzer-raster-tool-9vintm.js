// WUP 25-26
// Andrea Binanzer
let state = "START"; 
let shapeSelect, colorModeSelect, bgPicker, resSlider, rotSlider, fileInput;
let forceSlider, elasticSlider, magnetismSelect;

let particles = [];
let isReady = false;
let rainbowHue = 0;
let stickyPoints = [];
let img, vectorGraphics;

// GIF Export Status
let isExporting = false;
let startBtn;

function setup() {
  let canvas = createCanvas(800, 600);
  canvas.style('border-radius', '4px');
  canvas.style('box-shadow', '0 20px 50px rgba(0,0,0,0.8)');
  
  setupUI();
}

function setupUI() {
  removeElements();
  
  let style = createElement('style', `
    body { background: #0a0a0a; color: #ffffff; font-family: serif; padding: 20px; }
    .gui-container { 
      display: grid; 
      grid-template-columns: repeat(5, 1fr); 
      gap: 15px; 
      max-width: 800px; 
      margin: 20px auto; 
      background: #000; 
      padding: 20px; 
      border: 1px solid #222;
      border-radius: 8px;
    }
    .control-group { 
      display: flex; 
      flex-direction: column; 
      gap: 8px; 
      border-left: 1px solid #333;
      padding-left: 10px;
    }
    .control-group label { 
      font-size: 11px; 
      text-transform: uppercase; 
      letter-spacing: 2px; 
      color: #fff; 
      margin-bottom: 5px;
      font-weight: bold;
    }
    .label-small { font-size: 9px; color: #888; text-transform: uppercase; letter-spacing: 1px; }
    .label-hint { font-size: 8px; color: #666; font-style: italic; margin-top: 5px; }
    
    input, select, button { 
      background: #111; 
      color: white; 
      border: 1px solid #333; 
      padding: 5px; 
      border-radius: 0px; 
      font-family: serif;
      cursor: pointer;
    }
    input[type=range] { -webkit-appearance: none; background: #222; height: 1px; margin: 10px 0; }
    input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; height: 12px; width: 12px; background: #fff; border-radius: 50%; }
    
    .start-btn { 
      padding: 12px 40px; 
      background: white; 
      color: black; 
      border: 1px solid white; 
      font-family: serif; 
      font-weight: bold; 
      cursor: pointer; 
      font-size: 16px;
      letter-spacing: 2px;
      position: absolute;
      top: 60%; 
      left: 50%;
      transform: translate(-50%, -50%);
      transition: all 0.3s;
    }
    .start-btn:hover { background: black; color: white; }
  `);

  let gui = createDiv().addClass('gui-container').id('main-gui');
  gui.style('display', 'none'); 

  let col1 = createDiv().parent(gui).addClass('control-group');
  col1.child(createElement('label', '1. IMAGE'));
  fileInput = createFileInput(handleFile).parent(col1);

  let col2 = createDiv().parent(gui).addClass('control-group');
  col2.child(createElement('label', '2. STYLE'));
  shapeSelect = createSelect().parent(col2);
  ['DOTS', 'SQUARES', 'HEXAGONS', 'LINES', 'ASCII', 'GEARS'].forEach(s => shapeSelect.option(s));
  col2.child(createElement('span', 'Density').addClass('label-small'));
  resSlider = createSlider(3, 60, 10, 1).parent(col2).input(initParticles);
  col2.child(createElement('span', 'Rotation').addClass('label-small'));
  rotSlider = createSlider(0, TWO_PI, 0, 0.1).parent(col2);

  let col3 = createDiv().parent(gui).addClass('control-group');
  col3.child(createElement('label', '3. MAGNET'));
  magnetismSelect = createSelect().parent(col3);
  magnetismSelect.option('REPEL'); magnetismSelect.option('ATTRACT');
  col3.child(createElement('span', 'Force').addClass('label-small'));
  forceSlider = createSlider(10, 800, 120).parent(col3);
  col3.child(createElement('span', 'Elastic').addClass('label-small'));
  elasticSlider = createSlider(0.01, 0.5, 0.4, 0.01).parent(col3);
  col3.child(createElement('span', "click 'C' to remove the effect").addClass('label-hint'));

  let col4 = createDiv().parent(gui).addClass('control-group');
  col4.child(createElement('label', '4. COLOR'));
  colorModeSelect = createSelect().parent(col4);
  ['IMAGE', 'SINGLE', 'RAINBOW', 'NEGATIVE'].forEach(m => colorModeSelect.option(m));
  col4.child(createElement('span', 'Background').addClass('label-small'));
  bgPicker = createColorPicker('#ffffff').parent(col4);

  let col5 = createDiv().parent(gui).addClass('control-group');
  col5.child(createElement('label', '5. EXPORT'));
  let saveBtn = createButton('SAVE PNG').parent(col5);
  saveBtn.mousePressed(() => saveCanvas('raster_art', 'png'));
  let gifBtn = createButton('FAST GIF').parent(col5); // Name geändert
  gifBtn.style('background', '#fff').style('color', '#000');
  gifBtn.mousePressed(startGifExport);

  startBtn = createButton('START');
  startBtn.addClass('start-btn');
  startBtn.mousePressed(() => {
    state = "APP";
    startBtn.hide();
    select('#main-gui').style('display', 'grid');
  });
}

function draw() {
  if (state === "START") {
    drawStartScreen();
    return;
  }

  background(0); 
  
  if (!isReady) {
    fill(100);
    textAlign(CENTER);
    textFont('serif');
    text("UPLOAD AN IMAGE TO BEGIN", width/2, height/2);
    return;
  }
  
  push();
  translate(30, 20);
  fill(bgPicker.color()); noStroke();
  rect(0, 0, img.width, img.height);

  let force = forceSlider.value();
  let easing = elasticSlider.value();
  let mode = shapeSelect.value();
  let colMode = colorModeSelect.value();
  let isRepel = magnetismSelect.value() === 'REPEL';
  
  rainbowHue = (rainbowHue + 2) % 360;

  // Optimierung: Während des Exports nutzen wir eine etwas direktere Berechnung
  for (let i = 0; i < particles.length; i++) {
    let p = particles[i];
    let pointsToCheck = [...stickyPoints, {x: mouseX - 30, y: mouseY - 20}];
    
    for (let pt of pointsToCheck) {
      let d = dist(pt.x, pt.y, p.pX, p.pY);
      if (d < force) {
        let angle = atan2(p.pY - pt.y, p.pX - pt.x);
        let pushAmount = map(d, 0, force, 8, 0);
        if (isRepel) { p.pX += cos(angle) * pushAmount; p.pY += sin(angle) * pushAmount; } 
        else { p.pX -= cos(angle) * pushAmount; p.pY -= sin(angle) * pushAmount; }
      }
    }

    let speed = 0.51 - easing;
    p.pX += (p.tX - p.pX) * speed;
    p.pY += (p.tY - p.pY) * speed;

    let finalCol;
    if (colMode === 'IMAGE') finalCol = p.c;
    else if (colMode === 'RAINBOW') {
      colorMode(HSB, 360, 100, 100);
      finalCol = color((rainbowHue + p.tX/3) % 360, 80, 90);
      colorMode(RGB);
    } else if (colMode === 'NEGATIVE') {
      finalCol = color(255 - red(p.c), 255 - green(p.c), 255 - blue(p.c));
    } else finalCol = color(0); 

    let sz = map(p.br, 0, 255, resSlider.value() * 1.3, 0);
    if (sz > 0.5) {
      push();
      translate(p.pX, p.pY);
      rotate(rotSlider.value() + map(p.br, 0, 255, PI, 0));
      drawShape(mode, sz, finalCol, p.br);
      pop();
    }
  }
  pop();

  if (isExporting) {
    fill(255, 0, 0);
    ellipse(20, 20, 10, 10);
    fill(255);
    textSize(10);
    text("EXPORTING GIF...", 35, 25);
  }
}

function drawStartScreen() {
  background(0);
  textAlign(CENTER, CENTER);
  textFont('serif');
  fill(255);
  
  textSize(42);
  textStyle(ITALIC);
  text("Raster Tool", width/2, height/2 - 60);
  
  textSize(18);
  textStyle(NORMAL);
  text("Edit a picture with this Rastertool to add a special effect.", width/2, height/2 - 10);
  
  stroke(255, 60);
  line(width/2 - 100, height/2 + 30, width/2 + 100, height/2 + 30);
  noStroke();
}

function handleFile(file) {
  if (file.type === 'image') {
    img = loadImage(file.data, (loaded) => {
      // Wenn das Bild sehr groß ist, skalieren wir es für flüssigeres Arbeiten etwas mehr runter
      img.resize(600, 0); 
      resizeCanvas(660, img.height + 40);
      vectorGraphics = createGraphics(img.width, img.height);
      vectorGraphics.image(img, 0, 0);
      vectorGraphics.filter(GRAY);
      initParticles();
      isReady = true;
    });
  }
}

function initParticles() {
  if (!img) return;
  particles = [];
  let res = resSlider.value();
  for (let x = 0; x < img.width; x += res) {
    for (let y = 0; y < img.height; y += res) {
      let pix = vectorGraphics.get(x, y);
      particles.push({
        tX: x + res/2, tY: y + res/2,
        pX: x + res/2, pY: y + res/2,
        br: (pix[0] + pix[1] + pix[2]) / 3,
        c: color(img.get(x,y))
      });
    }
  }
}

function startGifExport() {
  if (!isReady) return;
  isExporting = true;
  // Um den Export zu beschleunigen, reduzieren wir die Qualität leicht
  // und setzen das fps-Limit für das GIF auf 15 (statt 30+), was meist ausreicht
  saveGif('raster_animation', 3, {
    delay: 0,
    units: 'seconds',
    fps: 15, 
    onComplete: () => isExporting = false
  });
}

function mousePressed() {
  if (state === "APP" && mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) {
    stickyPoints.push({x: mouseX - 30, y: mouseY - 20});
  }
}

function keyPressed() {
  if (key === 'c' || key === 'C') stickyPoints = [];
}

function drawShape(mode, sz, col, br) {
  fill(col); noStroke();
  if (mode === 'DOTS') ellipse(0, 0, sz);
  else if (mode === 'SQUARES') rect(-sz/2, -sz/2, sz, sz);
  else if (mode === 'HEXAGONS') {
    beginShape();
    for (let i = 0; i < 6; i++) {
      let a = PI/3 * i;
      vertex(cos(a) * sz/2, sin(a) * sz/2);
    }
    endShape(CLOSE);
  }
  else if (mode === 'LINES') {
    stroke(col); strokeWeight(sz/4); line(-sz/2, 0, sz/2, 0);
  }
  else if (mode === 'GEARS') {
    push(); rotate(frameCount * 0.05);
    for(let i=0; i<8; i++) { rotate(PI/4); rect(sz/3, -sz/10, sz/2, sz/5); }
    ellipse(0,0, sz/1.5); pop();
  }
  else if (mode === 'ASCII') {
    let chars = ["#", "S", "X", "+", ":", ".", " "];
    let idx = floor(map(br, 0, 255, 0, chars.length - 1));
    textSize(sz * 1.2); textAlign(CENTER, CENTER); text(chars[idx], 0, 0);
  }
}