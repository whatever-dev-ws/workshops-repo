let inkCanvas;
let centralCircle = { x: 400, y: 300, r: 50, vx: 0, vy: 0 };
let boundaryMode = 1; 
let isBitmapActive = false;
let isFluidActive = false;
let durSlider, radiusSlider, pixelSlider;

let notifyText = "";
let notifyAlpha = 0;
let notifyTimer = 0;

function setup() {
  createCanvas(800, 600);
  inkCanvas = createGraphics(800, 600);
  inkCanvas.background(255);

  // --- UI CONTROLS ---
  let x = 20;
  
  let boundaryBtn = createButton("BOUNDARY");
  boundaryBtn.position(x, 20);
  applyStyle(boundaryBtn, '#4a4a4a');
  boundaryBtn.mousePressed(() => { 
    boundaryMode = (boundaryMode % 3) + 1; 
    triggerNotify("MODE: " + ["STRICT", "LOOSE", "VOID"][boundaryMode-1]);
  });

  let fluidBtn = createButton("FLUID INK: OFF");
  fluidBtn.position(x + 105, 20);
  applyStyle(fluidBtn, '#4a4a4a');
  fluidBtn.mousePressed(() => { 
    isFluidActive = !isFluidActive;
    fluidBtn.html("FLUID INK: " + (isFluidActive ? "ON" : "OFF"));
    triggerNotify(isFluidActive ? "DYNAMIC SPEED ON" : "DYNAMIC SPEED OFF");
  });

  let bitBtn = createButton("BITMAP");
  bitBtn.position(x + 225, 20);
  applyStyle(bitBtn, '#4a4a4a');
  bitBtn.mousePressed(() => { 
    isBitmapActive = !isBitmapActive;
    triggerNotify(isBitmapActive ? "BITMAP: ON" : "BITMAP: OFF");
  });

  let resetBtn = createButton("RESET");
  resetBtn.position(x + 310, 20);
  applyStyle(resetBtn, '#d32f2f');
  resetBtn.mousePressed(() => { 
    inkCanvas.background(255); 
    triggerNotify("CANVAS RESET");
  });

  radiusSlider = createSlider(10, 150, 50, 1);
  radiusSlider.position(x, 50);

  pixelSlider = createSlider(2, 25, 8, 1);
  pixelSlider.position(x, 115);

  // --- EXPORT CONTROLS ---
  let pngBtn = createButton("PNG");
  pngBtn.position(x, 80);
  applyStyle(pngBtn, '#1976d2');
  pngBtn.mousePressed(() => saveCanvas('fluid_snap', 'png'));

  let gifBtn = createButton("GIF");
  gifBtn.position(x + 65, 80);
  applyStyle(gifBtn, '#f57c00');
  gifBtn.mousePressed(exportGif);

  durSlider = createSlider(1, 10, 3, 1);
  durSlider.position(x + 125, 85);
}

// Helper for inline styling and interactivity
function applyStyle(btn, baseCol) {
  let s = btn.elt.style;
  s.backgroundColor = baseCol;
  s.color = 'white';
  s.border = 'none';
  s.padding = '4px 12px';
  s.borderRadius = '4px';
  s.cursor = 'pointer';
  s.fontSize = '11px';
  s.fontWeight = 'bold';
  s.transition = 'all 0.2s';

  btn.mouseOver(() => {
    s.filter = 'brightness(1.2)';
    s.transform = 'translateY(-1px)';
  });
  btn.mouseOut(() => {
    s.filter = 'brightness(1.0)';
    s.transform = 'translateY(0)';
  });
}

function draw() {
  background(245);
  
  let currentSpeed = dist(0, 0, centralCircle.vx, centralCircle.vy);
  let targetR = isFluidActive ? map(currentSpeed, 0, 15, radiusSlider.value(), 5, true) : radiusSlider.value();
  centralCircle.r = lerp(centralCircle.r, targetR, 0.2);

  if (isBitmapActive) {
    applyBitmapEffect();
  } else {
    image(inkCanvas, 0, 0);
  }
  
  handleHUD();
  handleNotifications();

  // --- SNAP PHYSICS ---
  if (keyIsPressed && key === ' ') {
    let tx = mouseX - centralCircle.x;
    let ty = mouseY - centralCircle.y;
    centralCircle.vx += tx * 0.12; 
    centralCircle.vy += ty * 0.12;
    
    inkCanvas.stroke(0, 40); 
    inkCanvas.noFill();
    inkCanvas.ellipse(centralCircle.x, centralCircle.y, centralCircle.r * 2);
  }
  
  if (mouseIsPressed && mouseY > 145) {
    centralCircle.vx += (mouseX - centralCircle.x) * 0.04;
    centralCircle.vy += (mouseY - centralCircle.y) * 0.04;
  }
  
  centralCircle.vx *= 0.9; 
  centralCircle.vy *= 0.9;
  centralCircle.x += centralCircle.vx; 
  centralCircle.y += centralCircle.vy;

  applyBoundaries();

  noFill(); stroke(0); strokeWeight(2); 
  ellipse(centralCircle.x, centralCircle.y, centralCircle.r * 2);
}

function applyBitmapEffect() {
  let pSize = pixelSlider.value();
  noStroke();
  fill(20, 20, 30); 
  inkCanvas.loadPixels();
  for (let y = 0; y < height; y += pSize) {
    for (let x = 0; x < width; x += pSize) {
      let pixColor = inkCanvas.get(x, y);
      if (pixColor[0] < 200) { 
        rect(x, y, pSize - 1, pSize - 1);
      }
    }
  }
}

function applyBoundaries() {
  let margin = (boundaryMode === 1) ? 0 : (boundaryMode === 2 ? 300 : 10000);
  if (centralCircle.x < -margin || centralCircle.x > width + margin) {
    centralCircle.vx *= -0.8;
    if (boundaryMode === 1) centralCircle.x = constrain(centralCircle.x, 0, width);
  }
  if (centralCircle.y < -margin || centralCircle.y > height + margin) {
    centralCircle.vy *= -0.8;
    if (boundaryMode === 1) centralCircle.y = constrain(centralCircle.y, 0, height);
  }
}

function handleHUD() {
  fill(80); noStroke(); textSize(11); textAlign(LEFT);
  text("BASE RADIUS", 160, 65);
  text("PIXEL SIZE: " + pixelSlider.value(), 160, 130);
  text("GIF DURATION: " + durSlider.value() + "s", 265, 100);
  
  fill(150);
  text("HOLD SPACE: SNAP INK", 20, height - 40);
  text("DRAG MOUSE: PULL CIRCLE", 20, height - 20);
}

function handleNotifications() {
  if (notifyTimer > 0) {
    notifyTimer--;
    if (notifyTimer < 60) notifyAlpha = lerp(notifyAlpha, 0, 0.1);
  } else notifyAlpha = 0;
  if (notifyAlpha > 1) {
    push(); textAlign(LEFT, CENTER); textSize(12); textStyle(BOLD); fill(211, 47, 47, notifyAlpha);
    text(">> " + notifyText, 400, 28); pop();
  }
}

function triggerNotify(msg) { notifyText = msg; notifyAlpha = 255; notifyTimer = 180; }

function exportGif() {
  triggerNotify("RECORDING GIF...");
  saveGif('fluid_bitmap_art', durSlider.value(), { delay: 0, units: 'seconds' });
}