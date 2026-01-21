let img, originalImg;
let isColor = true;
let sidebarWidth = 220;
let resSlider, depthSlider, smudgeSlider, brushSizeSlider;
let grid = []; 
let currentBrush = 'SMUDGE'; 

function setup() {
  createCanvas(windowWidth, windowHeight);
  
  // UI Sidebar Container
  let sidebar = createDiv();
  styleElement(sidebar, {
    'position': 'absolute',
    'left': '0',
    'top': '0',
    'width': sidebarWidth + 'px',
    'height': '100%',
    'background': 'rgba(15, 15, 15, 0.95)',
    'color': '#eee',
    'padding': '20px',
    'font-family': 'system-ui, -apple-system, sans-serif',
    'box-sizing': 'border-box',
    'overflow-y': 'auto',
    'z-index': '100',
    'border-right': '1px solid #333',
    'backdrop-filter': 'blur(10px)'
  });

  // Helper for Headers
  const createHeader = (txt) => {
    let p = createP(txt);
    p.parent(sidebar);
    styleElement(p, {
      'font-size': '12px',
      'font-weight': 'bold',
      'letter-spacing': '1px',
      'margin-top': '20px',
      'margin-bottom': '8px',
      'color': '#888'
    });
  };

  createHeader('1. UPLOAD IMAGE');
  let input = createFileInput(handleFile);
  input.parent(sidebar);
  styleElement(input, { 'font-size': '12px' });

  createHeader('DENSITY');
  resSlider = createSlider(2, 50, 12, 1); 
  resSlider.parent(sidebar);
  styleSlider(resSlider);
  resSlider.input(initGrid);

  createHeader('SQUARE SIZE');
  depthSlider = createSlider(1, 60, 18, 1);
  depthSlider.parent(sidebar);
  styleSlider(depthSlider);

  createHeader('BRUSH SIZE');
  brushSizeSlider = createSlider(10, 200, 60, 1);
  brushSizeSlider.parent(sidebar);
  styleSlider(brushSizeSlider);

  createHeader('BRUSH MODE');
  let smudgeBtn = createStyledButton('Smudge Tool (Circle)', sidebar);
  smudgeBtn.mousePressed(() => currentBrush = 'SMUDGE');
  
  let invertBtn = createStyledButton('Invert Tool (Square)', sidebar);
  invertBtn.style('margin-top', '8px');
  invertBtn.mousePressed(() => currentBrush = 'INVERT');

  createHeader('SMUDGE INTENSITY');
  smudgeSlider = createSlider(1, 500, 150, 1); 
  smudgeSlider.parent(sidebar);
  styleSlider(smudgeSlider);

  createHeader('CONTROLS');
  let colBtn = createStyledButton('Toggle Color/BW', sidebar);
  colBtn.mousePressed(() => isColor = !isColor);

  let saveBtn = createStyledButton('Save Artwork', sidebar);
  saveBtn.style('margin-top', '8px');
  saveBtn.style('background', '#2d5a27');
  saveBtn.mousePressed(() => saveCanvas('raster_art', 'png'));

  let resetBtn = createStyledButton('Reset Canvas', sidebar);
  resetBtn.style('margin-top', '8px');
  resetBtn.style('background', '#5a2727');
  resetBtn.mousePressed(hardReset);

  rectMode(CENTER);
  noStroke();
}

function draw() {
  background(10);

  if (img && grid.length > 0) {
    let startX = sidebarWidth + (width - sidebarWidth - img.width) / 2;
    let startY = (height - img.height) / 2;

    if (mouseIsPressed && mouseX > sidebarWidth) {
      if (currentBrush === 'SMUDGE') applyColorSmudge(startX, startY);
      if (currentBrush === 'INVERT') applySquareInvert(startX, startY);
    }

    let maxS = depthSlider.value();

    for (let i = 0; i < grid.length; i++) {
      let p = grid[i];
      let r = red(p.col);
      let g = green(p.col);
      let b = blue(p.col);
      let luma = (r * 0.299) + (g * 0.587) + (b * 0.114);
      
      let size = map(luma, 0, 255, 1, maxS);

      fill(isColor ? p.col : color(luma));
      rect(startX + p.x, startY + p.y, size, size);
    }
    
    // Brush Preview
    noFill();
    stroke(255, 100);
    strokeWeight(1);
    let bSize = brushSizeSlider.value();
    if (currentBrush === 'SMUDGE') {
      ellipse(mouseX, mouseY, bSize * 2);
    } else {
      rect(mouseX, mouseY, bSize * 2, bSize * 2);
    }
    noStroke();
  } else {
    fill(100); 
    textAlign(CENTER);
    textSize(16);
    text("← Upload an image to start creating", (width + sidebarWidth) / 2, height / 2);
  }
}

// --- Logic Functions ---

function applySquareInvert(startX, startY) {
  let bSize = brushSizeSlider.value();
  for (let p of grid) {
    let px = startX + p.x;
    let py = startY + p.y;
    if (px > mouseX - bSize && px < mouseX + bSize &&
        py > mouseY - bSize && py < mouseY + bSize) {
      if (!p.locked) {
        let r = 255 - red(p.col);
        let g = 255 - green(p.col);
        let b = 255 - blue(p.col);
        p.col = color(r, g, b);
        p.locked = true; 
      }
    }
  }
}

function applyColorSmudge(startX, startY) {
  let strength = smudgeSlider.value() / 1000; 
  let bRadius = brushSizeSlider.value();
  let dx = (mouseX - pmouseX);
  let dy = (mouseY - pmouseY);

  for (let i = 0; i < grid.length; i++) {
    let p = grid[i];
    let d = dist(mouseX, mouseY, startX + p.x, startY + p.y);
    
    if (d < bRadius) { 
      let targetX = p.x + dx;
      let targetY = p.y + dy;
      
      // Affect neighboring cells by blending current cell color
      for(let j = 0; j < 2; j++) { 
        let randomIndex = floor(random(grid.length));
        let n = grid[randomIndex];
        if (dist(targetX, targetY, n.x, n.y) < resSlider.value() * 1.5) {
          n.col = lerpColor(n.col, p.col, strength);
        }
      }
    }
  }
}

function initGrid() {
  if (!img) return;
  grid = [];
  let res = resSlider.value();
  img.loadPixels();
  for (let y = 0; y < img.height; y += res) {
    for (let x = 0; x < img.width; x += res) {
      let pix = img.get(x, y);
      grid.push({ x: x, y: y, col: color(pix), locked: false });
    }
  }
}

function handleFile(file) {
  if (file.type === 'image') {
    img = loadImage(file.data, (loadedImg) => {
      let availableW = width - sidebarWidth - 100;
      let availableH = height - 100;
      let ratio = min(availableW / loadedImg.width, availableH / loadedImg.height);
      loadedImg.resize(loadedImg.width * ratio, loadedImg.height * ratio);
      originalImg = loadedImg.get();
      initGrid();
    });
  }
}

function hardReset() {
  if (!originalImg) return;
  img = originalImg.get(); 
  initGrid();
}

function mouseReleased() {
  if (grid) {
    for (let p of grid) p.locked = false;
  }
}

function windowResized() { 
  resizeCanvas(windowWidth, windowHeight); 
}

// --- UI Styling Helpers ---

function styleElement(el, styles) {
  for (let prop in styles) {
    el.style(prop, styles[prop]);
  }
}

function styleSlider(slider) {
  slider.style('width', '100%');
  slider.style('margin-bottom', '10px');
  slider.style('cursor', 'pointer');
}

function createStyledButton(label, parent) {
  let btn = createButton(label);
  btn.parent(parent);
  styleElement(btn, {
    'width': '100%',
    'padding': '8px',
    'background': '#333',
    'color': 'white',
    'border': 'none',
    'border-radius': '4px',
    'cursor': 'pointer',
    'transition': 'background 0.2s',
    'font-size': '12px'
  });
  
  btn.elt.addEventListener('mouseenter', () => btn.style('background', '#444'));
  btn.elt.addEventListener('mouseleave', () => {
    // Return to default unless it's a special button
    if (label === 'Save Artwork') btn.style('background', '#2d5a27');
    else if (label === 'Reset Canvas') btn.style('background', '#5a2727');
    else btn.style('background', '#333');
  });
  
  return btn;
}