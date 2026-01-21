let frames = [];
let currentFrame = 0;
let isPlaying = false;
let playIndex = 0;
let animFPS = 12;
let doWiggle = true;
let brushSize = 5;
let brushColor = '#000000';

function setup() {
  createCanvas(windowWidth, windowHeight);
  resetProject(); // Initialize
  setupInterface();
  cursor(CROSS);
}

function addFrame() {
  let pg = createGraphics(width, height);
  pg.strokeCap(ROUND);
  pg.strokeJoin(ROUND);
  frames.push(pg);
}

function resetProject() {
  frames = [];
  currentFrame = 0;
  addFrame();
  if (this.timeline) {
    this.timeline.attribute('max', 0);
    this.timeline.value(0);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function keyPressed() {
  if (key === ' ') togglePlay();
  if (keyCode === RIGHT_ARROW) changeFrame(1);
  if (keyCode === LEFT_ARROW) changeFrame(-1);
  if (keyCode === BACKSPACE || keyCode === DELETE) deleteFrame();
}

function draw() {
  background(255);

  // 1. Onion Skin
  if (!isPlaying && currentFrame > 0) {
    tint(255, 30); 
    image(frames[currentFrame - 1], 0, 0);
    noTint();
  }

  // 2. Main Viewport
  push();
  if (doWiggle) {
    translate(random(-0.7, 0.7), random(-0.7, 0.7));
    rotate(random(-0.002, 0.002));
  }
  let frameToShow = isPlaying ? playIndex : currentFrame;
  image(frames[frameToShow], 0, 0);
  pop();

  // 3. Drawing & Animation
  if (isPlaying) {
    if (frameCount % Math.max(1, Math.floor(60 / animFPS)) === 0) {
      playIndex = (playIndex + 1) % frames.length;
    }
  } else if (mouseIsPressed && mouseY < height - 140) {
    let f = frames[currentFrame];
    f.stroke(brushColor);
    f.strokeWeight(brushSize);
    f.line(pmouseX, pmouseY, mouseX, mouseY);
  }

  updateDynamicUI();
}

function setupInterface() {
  let menu = createDiv('');
  menu.style('position', 'fixed');
  menu.style('bottom', '20px');
  menu.style('left', '50%');
  menu.style('transform', 'translateX(-50%)');
  menu.style('display', 'flex');
  menu.style('flex-direction', 'column');
  menu.style('align-items', 'center');
  menu.style('gap', '12px');
  menu.style('padding', '15px 30px');
  menu.style('background', 'rgba(15, 15, 15, 0.96)');
  menu.style('backdrop-filter', 'blur(25px)');
  menu.style('border-radius', '30px');
  menu.style('color', 'white');
  menu.style('font-family', 'sans-serif');
  menu.style('box-shadow', '0 20px 60px rgba(0,0,0,0.8)');

  // Row 1: Timeline Scrubber
  let timelineRow = createDiv('').parent(menu).style('display','flex').style('align-items','center').style('gap','15px').style('width','100%');
  this.frameLabel = createSpan('1').parent(timelineRow).style('font-weight','bold').style('min-width','25px');
  
  this.timeline = createSlider(0, 0, 0).parent(timelineRow);
  this.timeline.style('flex-grow', '1');
  this.timeline.input(() => {
    isPlaying = false;
    currentFrame = this.timeline.value();
  });

  // Row 2: Controls & Tools
  let controlRow = createDiv('').parent(menu).style('display','flex').style('align-items','center').style('gap','18px');

  createIconBtn('❮', () => changeFrame(-1)).parent(controlRow);
  this.playBtn = createIconBtn('PLAY', togglePlay).parent(controlRow);
  createIconBtn('❯', () => changeFrame(1)).parent(controlRow);

  addDivider(controlRow);

  this.speedSlider = createSlider(1, 60, 12).parent(controlRow).style('width', '60px');
  this.speedSlider.input(() => animFPS = this.speedSlider.value());

  this.wiggleBtn = createIconBtn('WIGGLE', () => { doWiggle = !doWiggle; }).parent(controlRow);

  let cp = createColorPicker('#000000').parent(controlRow);
  cp.style('width', '24px').style('height', '24px').style('border', 'none').style('border-radius', '50%');
  cp.input(() => brushColor = cp.value());

  let sz = createSlider(1, 80, 5).parent(controlRow).style('width', '60px');
  sz.input(() => brushSize = sz.value());

  addDivider(controlRow);

  // Management Section
  createIconBtn('DEL', deleteFrame).parent(controlRow).style('color', '#ffaa44');
  
  createIconBtn('RESET', () => {
    if (confirm("Reset everything? This will delete all frames.")) resetProject();
  }).parent(controlRow).style('color', '#ff4444');

  createIconBtn('SAVE', exportGIF).parent(controlRow).style('color', '#66ff66');
}

function changeFrame(dir) {
  isPlaying = false;
  currentFrame += dir;
  if (currentFrame < 0) currentFrame = 0;
  if (currentFrame >= frames.length) addFrame();
}

function deleteFrame() {
  if (frames.length > 1) {
    frames.splice(currentFrame, 1);
    currentFrame = constrain(currentFrame, 0, frames.length - 1);
  } else {
    frames[0].clear();
  }
}

function updateDynamicUI() {
  this.frameLabel.html(currentFrame + 1);
  this.playBtn.html(isPlaying ? "STOP" : "PLAY");
  this.wiggleBtn.style('opacity', doWiggle ? '1' : '0.4');
  
  this.timeline.attribute('max', frames.length - 1);
  if (isPlaying) {
    this.timeline.value(playIndex);
  } else {
    this.timeline.value(currentFrame);
  }
}

function togglePlay() {
  isPlaying = !isPlaying;
  playIndex = currentFrame;
}

function createIconBtn(label, func) {
  let b = createButton(label);
  b.style('background', 'transparent').style('border', 'none').style('color', 'white');
  b.style('font-weight', 'bold').style('cursor', 'pointer');
  b.mousePressed(func);
  return b;
}

function addDivider(parent) {
  let d = createDiv('').parent(parent);
  d.style('width', '1px').style('height', '20px').style('background', 'rgba(255,255,255,0.2)');
}

function exportGIF() {
  saveGif('anim-export', frames.length * (1/animFPS), { delay: 0, units: 'seconds' });
}