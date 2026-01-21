let img, vid, media;
let fileButton, camButton, snapButton, offButton, resSlider;
let goAroundButton;
let btnUp, btnDown, btnLeft, btnRight; 
let capture;
let isCamActive = false, isExpanded = false, isImploding = false;
let isScattered = false, isReturning = false;

let particles = [];
let beatIntensity = 0;
let currentMode = 'NONE';
let globalForceX = 0, globalForceY = 0;
let lastResValue;
let returnCounter = 0;
const RETURN_DURATION = 120; 

function setup() {
  createCanvas(800, 600);

  // --- UI SETUP WITH INLINE STYLES ---
  fileButton = createFileInput(handleFile);
  fileButton.position(20, height + 20);

  camButton = createButton('START CAMERA');
  camButton.position(200, height + 20);
  applyButtonStyle(camButton, '#4CAF50');
  camButton.mousePressed(toggleCamera);

  snapButton = createButton('CAPTURE SNAPSHOT');
  snapButton.position(330, height + 20);
  applyButtonStyle(snapButton, '#2196F3');
  snapButton.mousePressed(takeSnapshot);

  offButton = createButton('STOP CAMERA');
  offButton.position(490, height + 20);
  applyButtonStyle(offButton, '#f44336');
  offButton.mousePressed(stopCamera);

  goAroundButton = createButton('GO AROUND');
  goAroundButton.position(610, height + 20);
  applyButtonStyle(goAroundButton, '#9C27B0');
  goAroundButton.mousePressed(toggleScatter);
  goAroundButton.hide();

  resSlider = createSlider(1, 4, 2, 1);
  resSlider.position(620, height + 60);
  lastResValue = resSlider.value();

  // DIRECTIONAL SHAPE CONTROLS
  btnUp = createButton('▲');
  btnUp.position(365, height + 50);
  applyButtonStyle(btnUp, '#efefef', true);
  btnUp.mousePressed(() => { currentMode = 'UP'; beatIntensity = 1.0; globalForceY = -20; });

  btnLeft = createButton('●');
  btnLeft.position(320, height + 75);
  applyButtonStyle(btnLeft, '#efefef', true);
  btnLeft.mousePressed(() => { currentMode = 'LEFT'; beatIntensity = 1.0; globalForceX = -20; });

  btnDown = createButton('▬');
  btnDown.position(365, height + 75);
  applyButtonStyle(btnDown, '#efefef', true);
  btnDown.mousePressed(() => { currentMode = 'DOWN'; beatIntensity = 1.0; globalForceY = 20; });

  btnRight = createButton('■');
  btnRight.position(410, height + 75);
  applyButtonStyle(btnRight, '#efefef', true);
  btnRight.mousePressed(() => { currentMode = 'RIGHT'; beatIntensity = 1.0; globalForceX = 20; });

  let pngButton = createButton('SAVE PNG');
  pngButton.position(20, height + 60);
  applyButtonStyle(pngButton, '#555');
  pngButton.mousePressed(() => saveCanvas('raster_art', 'png'));

  background(0);
}

// Helper to handle strict inline styling and hover states
function applyButtonStyle(btn, bgColor, isSmall = false) {
  let s = btn.elt.style;
  s.backgroundColor = bgColor;
  s.color = bgColor === '#efefef' ? '#000' : '#fff';
  s.border = 'none';
  s.padding = isSmall ? '5px 15px' : '8px 16px';
  s.borderRadius = '4px';
  s.cursor = 'pointer';
  s.fontWeight = 'bold';
  s.fontSize = '12px';
  s.transition = '0.2s';

  btn.mouseOver(() => { s.filter = 'brightness(1.1)'; s.transform = 'scale(1.05)'; });
  btn.mouseOut(() => { s.filter = 'brightness(1.0)'; s.transform = 'scale(1.0)'; });
}

function draw() {
  background(0, 50);

  // Dynamic Button Highlighting
  btnUp.elt.style.backgroundColor = currentMode === 'UP' ? '#ffff00' : '#efefef';
  btnDown.elt.style.backgroundColor = currentMode === 'DOWN' ? '#ffff00' : '#efefef';
  btnLeft.elt.style.backgroundColor = currentMode === 'LEFT' ? '#ffff00' : '#efefef';
  btnRight.elt.style.backgroundColor = currentMode === 'RIGHT' ? '#ffff00' : '#efefef';

  if (!media) {
    drawMessage("1. START CAMERA OR UPLOAD MEDIA\n2. CLICK CANVAS TO EXPAND PARTICLES\n3. PRESS SPACE TO IMPLODE");
    return;
  }

  if (resSlider.value() !== lastResValue) {
    lastResValue = resSlider.value();
    initRaster();
  }

  media.loadPixels();
  if (!media.pixels || media.pixels.length === 0) return;

  beatIntensity = lerp(beatIntensity, 0, 0.1);
  globalForceX = lerp(globalForceX, 0, 0.05);
  globalForceY = lerp(globalForceY, 0, 0.05);

  for (let p of particles) {
    handleParticlePhysics(p);

    let index = (p.origX + p.origY * media.width) * 4;
    let r = media.pixels[index], g = media.pixels[index+1], b = media.pixels[index+2];
    let br = (r + g + b) / 3;

    if (br > 15) {
      push();
      translate(p.x, p.y);
      let baseSize = map(resSlider.value(), 1, 4, 24, 6);
      let s = map(br, 0, 255, 0, baseSize) * (1 + beatIntensity) * p.currentScale;
      fill(r + (beatIntensity * 60), g, b);
      noStroke();
      drawRhythmShape(currentMode, s);
      pop();
    }
  }

  if (isReturning) {
    returnCounter++;
    if (returnCounter >= RETURN_DURATION) { isReturning = false; returnCounter = 0; }
  }
}

function handleParticlePhysics(p) {
  if (isImploding) {
    p.x = lerp(p.x, width/2, 0.1);
    p.y = lerp(p.y, height/2, 0.1);
  } else if (isScattered) {
    p.x += p.vx; p.y += p.vy;
    if (p.x < 0 || p.x > width) p.vx *= -1;
    if (p.y < 0 || p.y > height) p.vy *= -1;
    p.history.push({x: p.x, y: p.y});
  } else if (isReturning) {
    if (p.history.length > 0) {
      let stepSize = ceil(p.totalHistory / RETURN_DURATION);
      for(let i=0; i<stepSize; i++) { if(p.history.length > 0) p.currentPos = p.history.pop(); }
      let ease = map(returnCounter, 0, RETURN_DURATION, 1, 0.1);
      p.x = lerp(p.x, p.currentPos.x, ease); p.y = lerp(p.y, p.currentPos.y, ease);
    } else {
      p.x = lerp(p.x, p.origX, 0.1); p.y = lerp(p.y, p.origY, 0.1);
    }
  } else {
    let targetX = p.origX + globalForceX * 8;
    let targetY = p.origY + globalForceY * 8;
    p.x = lerp(p.x, targetX, 0.1); p.y = lerp(p.y, targetY, 0.1);
  }
  p.currentScale = lerp(p.currentScale, p.targetScale, 0.1);
}

function initRaster() {
  if (!media) return;
  particles = [];
  let gridSize = [24, 14, 8, 4][resSlider.value() - 1];
  for (let y = 0; y < height; y += gridSize) {
    for (let x = 0; x < width; x += gridSize) {
      particles.push({
        x: x, y: y, origX: x, origY: y,
        vx: random(-3, 3), vy: random(-3, 3),
        history: [], totalHistory: 0, currentPos: {x:x, y:y},
        currentScale: 1, targetScale: 1
      });
    }
  }
}

function toggleScatter() {
  isScattered = !isScattered;
  if (isScattered) {
    isReturning = false;
    goAroundButton.html('COME BACK');
  } else {
    isReturning = true;
    returnCounter = 0;
    for(let p of particles) p.totalHistory = p.history.length;
    goAroundButton.html('GO AROUND');
  }
}

function keyPressed() {
  if (key === ' ') isImploding = true;
  else {
    beatIntensity = 1.0;
    if (key === 'w' || keyCode === UP_ARROW) { currentMode = 'UP'; globalForceY = -20; }
    else if (key === 's' || keyCode === DOWN_ARROW) { currentMode = 'DOWN'; globalForceY = 20; }
    else if (key === 'a' || keyCode === LEFT_ARROW) { currentMode = 'LEFT'; globalForceX = -20; }
    else if (key === 'd' || keyCode === RIGHT_ARROW) { currentMode = 'RIGHT'; globalForceX = 20; }
  }
}

function keyReleased() { if (key === ' ') isImploding = false; }

function mousePressed() {
  if (mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) {
    isExpanded = !isExpanded;
    for (let p of particles) {
      p.targetScale = isExpanded ? ((random(1) < 0.3) ? random(2, 5) : 1) : 1;
    }
  }
}

function toggleCamera() {
  if (!capture) { capture = createCapture(VIDEO); capture.size(800, 600); capture.hide(); }
  media = capture; isCamActive = true; goAroundButton.hide(); initRaster();
}

function stopCamera() { if (capture) { capture.stop(); capture.remove(); capture = null; isCamActive = false; media = null; } }

function takeSnapshot() { if (isCamActive && capture) { media = capture.get(); isCamActive = false; goAroundButton.show(); initRaster(); } }

function drawRhythmShape(mode, s) {
  rectMode(CENTER);
  if (mode === 'UP') triangle(0, -s/2, -s/2, s/2, s/2, s/2);
  else if (mode === 'DOWN') rect(0, 0, s, s * 0.2);
  else if (mode === 'LEFT') ellipse(0, 0, s, s);
  else if (mode === 'RIGHT') rect(0, 0, s, s);
  else rect(0, 0, s * 0.7, s * 0.7);
}

function handleFile(file) {
  if (file.type === 'image' || file.type === 'video') {
    if (file.type === 'image') { loadImage(file.data, img => { img.resize(800, 600); media = img; goAroundButton.show(); initRaster(); }); }
    else { if (vid) vid.remove(); vid = createVideo(file.data, () => { vid.size(800, 600); vid.loop(); vid.hide(); media = vid; goAroundButton.show(); initRaster(); }); }
  }
}

function drawMessage(txt) { fill(255); textAlign(CENTER); textSize(16); text(txt, width/2, height/2); }