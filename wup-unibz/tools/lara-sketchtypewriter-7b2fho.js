// WUP 25-26
// Lara Spitaler 
let tInput, fontSelect, colorPicker, bgColorPicker, sizeSlider, animSelect, saveBtn;
let isPinned = false; 
let isRecording = false; 
let frozenX, frozenY;
const sidebarWidth = 160; 

function setup() {
  // Creating a canvas that respects the sidebar width
  let canvas = createCanvas(windowWidth - sidebarWidth, windowHeight);
  canvas.position(sidebarWidth, 0);

  let sidebar = createDiv('');
  styleSidebar(sidebar);

  createLabel("TEXT INPUT", sidebar);
  tInput = createInput('Kinetic Type'); 
  tInput.parent(sidebar);
  styleCompact(tInput);

  createLabel("FONT FAMILY", sidebar);
  fontSelect = createSelect();
  fontSelect.option('Impact');
  fontSelect.option('Arial');
  fontSelect.option('Courier New');
  fontSelect.parent(sidebar);
  styleCompact(fontSelect);

  createLabel("COLORS (TEXT / BG)", sidebar);
  let colorRow = createDiv('');
  colorRow.parent(sidebar);
  colorRow.style('display', 'flex');
  colorRow.style('gap', '5px');

  colorPicker = createColorPicker('#00FFCC');
  colorPicker.parent(colorRow);
  colorPicker.style('flex', '1');
  
  bgColorPicker = createColorPicker('#050505');
  bgColorPicker.parent(colorRow);
  bgColorPicker.style('flex', '1');

  createLabel("FONT SIZE", sidebar);
  sizeSlider = createSlider(5, 150, 60); 
  sizeSlider.parent(sidebar);
  sizeSlider.style('width', '100%');

  createLabel("LAYOUT MODE", sidebar);
  animSelect = createSelect();
  animSelect.option('Orbit Ring', 'orbit');
  animSelect.option('Vortex Spiral', 'vortex');
  animSelect.option('DNA Helix', 'helix');
  animSelect.option('Interactive Zoom', 'zoom');
  animSelect.option('Hyper Grid', 'grid');
  animSelect.parent(sidebar);
  styleCompact(animSelect);

  saveBtn = createButton('SAVE AS GIF');
  saveBtn.parent(sidebar);
  styleButton(saveBtn);
  
  saveBtn.mousePressed((e) => {
    e.stopPropagation(); 
    if (!isPinned) {
      isPinned = true;
      frozenX = width / 2;
      frozenY = height / 2;
      updateStatusLabel();
    }
    isRecording = true;
    saveBtn.html('RECORDING...');
    saveGif('TypeToolAnimated', 3, { delay: 0, units: 'seconds' });
    setTimeout(() => {
      saveBtn.html('SAVE AS GIF');
      isRecording = false;
    }, 3500);
  });

  createLabel("STATUS", sidebar);
  let statusInfo = createDiv('Following Mouse');
  statusInfo.parent(sidebar);
  statusInfo.id('statusLabel');
  statusInfo.style('color', '#00FFCC');
  statusInfo.style('font-size', '10px');
  statusInfo.style('font-family', 'monospace');
  
  frozenX = (windowWidth - sidebarWidth) / 2;
  frozenY = windowHeight / 2;
}

function updateStatusLabel() {
  let label = select('#statusLabel');
  label.html(isPinned ? 'POSITION FIXED' : 'FOLLOWING MOUSE');
  label.style('color', isPinned ? '#FF3366' : '#00FFCC');
}

function mousePressed() {
  if (isRecording) return;
  // Ensure click is within the canvas area (not on sidebar)
  if (mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height) {
    isPinned = !isPinned;
    if (isPinned) {
      frozenX = mouseX;
      frozenY = mouseY;
    }
    updateStatusLabel();
  }
}

function draw() {
  background(bgColorPicker.color());
  
  let txt = tInput.value();
  let baseSize = sizeSlider.value();
  let layoutMode = animSelect.value();
  
  textAlign(CENTER, CENTER);
  textFont(fontSelect.value());
  textSize(baseSize);
  
  let targetX = (isPinned || isRecording) ? frozenX : mouseX;
  let targetY = (isPinned || isRecording) ? frozenY : mouseY;
  let time = frameCount * 0.01;

  for (let i = 0; i < txt.length; i++) {
    let char = txt[i];
    let x = targetX;
    let y = targetY;
    let rot = 0;
    let s = 1.0;
    let p = i / max(1, txt.length - 1);

    push();
    if (layoutMode === 'orbit') {
      let radius = 150 + sin(time * 2) * 10;
      let angle = p * TWO_PI + time;
      x += cos(angle) * radius;
      y += sin(angle) * radius;
      rot = angle + HALF_PI;
    } else if (layoutMode === 'vortex') {
      let angle = p * TWO_PI * 3 + time;
      let radius = (1 - p) * 300;
      x += cos(angle) * radius;
      y += sin(angle) * radius;
      rot = angle;
      s = map(p, 0, 1, 0.2, 2.0);
    } else if (layoutMode === 'helix') {
      let spacing = 400;
      let side = sin(p * PI * 2 + time) * 100;
      x += side;
      y += (p - 0.5) * spacing;
      rot = cos(p * PI * 2 + time) * 0.5;
    } else if (layoutMode === 'zoom') {
      let spacing = 60;
      let startX = width / 2 - (txt.length * spacing) / 2;
      let origX = startX + i * spacing;
      let origY = height / 2;
      let d = dist(targetX, targetY, origX, origY);
      s = map(d, 0, width/2, 4.0, 0.5);
      s = constrain(s, 0.1, 5.0);
      x = lerp(origX, targetX, -0.1); 
      y = lerp(origY, targetY, -0.1);
    } else if (layoutMode === 'grid') {
      let cols = floor(sqrt(txt.length));
      let col = i % cols;
      let row = floor(i / cols);
      let gX = (col - cols/2) * 80 + width/2;
      let gY = (row - (txt.length/cols)/2) * 80 + height/2;
      let d = dist(targetX, targetY, gX, gY);
      let force = map(min(d, 400), 0, 400, 1, 0);
      x = lerp(gX, targetX, force);
      y = lerp(gY, targetY, force);
      s = 1 + force * 2;
    }

    translate(x, y);
    rotate(rot);
    scale(s);
    
    let c = colorPicker.color();
    fill(red(c), green(c), blue(c));
    text(char, 0, 0);
    pop();
  }
}

function windowResized() {
  resizeCanvas(windowWidth - sidebarWidth, windowHeight);
}

// --- REFINED STYLING HELPERS ---
function styleSidebar(el) {
  el.style('position', 'fixed');
  el.style('left', '0'); el.style('top', '0');
  el.style('width', sidebarWidth + 'px'); el.style('height', '100%');
  el.style('background', '#0a0a0a'); el.style('display', 'flex');
  el.style('flex-direction', 'column'); el.style('padding', '20px');
  el.style('gap', '5px'); el.style('border-right', '2px solid #222');
  el.style('box-sizing', 'border-box'); el.style('font-family', 'monospace');
  el.style('z-index', '1000');
}

function styleCompact(el) {
  el.style('background', '#151515'); el.style('color', '#00FFCC');
  el.style('border', '1px solid #333'); el.style('font-size', '11px');
  el.style('padding', '8px'); el.style('width', '100%');
  el.style('border-radius', '4px');
  el.style('outline', 'none');
  el.mousePressed((e) => e.stopPropagation());
}

function styleButton(el) {
  el.style('background', '#00FFCC'); el.style('color', '#000');
  el.style('border', 'none'); el.style('font-weight', 'bold');
  el.style('padding', '12px'); el.style('cursor', 'pointer');
  el.style('font-size', '11px'); el.style('margin-top', '15px');
  el.style('border-radius', '4px');
  el.style('transition', '0.2s');

  el.elt.addEventListener('mouseenter', () => el.style('background', '#ffffff'));
  el.elt.addEventListener('mouseleave', () => el.style('background', '#00FFCC'));
}

function createLabel(txt, parent) {
  let s = createSpan(txt);
  s.style('color', '#888'); s.style('font-size', '9px');
  s.style('font-weight', 'bold'); s.style('margin-top', '15px');
  s.style('letter-spacing', '1px');
  s.parent(parent);
}