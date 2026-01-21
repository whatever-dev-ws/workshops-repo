let img;
let input, colorPicker, exportBtn;
let targetPos, vel;
let anchor;
let curtain; 

function setup() {
  createCanvas(windowWidth, windowHeight);
  
  // --- UI CONSTRUCTION WITH INLINE STYLES ---
  
  // File Input Styling
  input = createFileInput(handleFile);
  styleElement(input, {
    'position': 'fixed',
    'top': '10px',
    'left': '10px',
    'z-index': '100',
    'background': '#222',
    'color': 'white',
    'padding': '5px',
    'border-radius': '4px',
    'font-family': 'sans-serif',
    'font-size': '12px'
  });
  
  // Color Picker Styling
  colorPicker = createColorPicker('#FFFAF0');
  styleElement(colorPicker, {
    'position': 'fixed',
    'top': '45px',
    'left': '10px',
    'z-index': '100',
    'width': '50px',
    'height': '30px',
    'border': 'none',
    'cursor': 'pointer'
  });

  // Export Button Styling
  exportBtn = createButton('Record 5s GIF');
  exportBtn.position(10, 85);
  styleElement(exportBtn, {
    'position': 'fixed',
    'top': '85px',
    'left': '10px',
    'z-index': '100',
    'padding': '8px 12px',
    'background': '#444',
    'color': '#fff',
    'border': '1px solid #666',
    'border-radius': '4px',
    'cursor': 'pointer',
    'font-weight': 'bold'
  });

  // Interactive Button Hover States
  exportBtn.elt.addEventListener('mouseenter', () => exportBtn.style('background', '#666'));
  exportBtn.elt.addEventListener('mouseleave', () => exportBtn.style('background', '#444'));
  exportBtn.mousePressed(() => saveGif('overhead_beacon', 5));

  // Initialize Physics
  anchor = createVector(width / 2, 0); 
  targetPos = createVector(width / 2, height / 2);
  vel = createVector(7.5, 5.0);

  curtain = createGraphics(width, height);
}

function draw() {
  background(15, 10, 5); 

  if (img) {
    // 1. Movement Logic
    targetPos.add(vel);
    if (targetPos.x < 0 || targetPos.x > width) vel.x *= -1;
    if (targetPos.y < 0 || targetPos.y > height) vel.y *= -1;

    // 2. Draw the Image (The Target)
    push();
    imageMode(CENTER);
    let displayW = 250; 
    let displayH = (img.height / img.width) * displayW;
    image(img, width / 2, height / 2, displayW, displayH);
    pop();

    // 3. THE DARK CURTAIN
    curtain.clear();
    curtain.background(10, 7, 3); 
    curtain.push();
    curtain.erase(); 
    curtain.noStroke();
    
    let angle = atan2(targetPos.y - anchor.y, targetPos.x - anchor.x);
    let spread = 110; 
    
    curtain.beginShape();
    curtain.vertex(anchor.x, anchor.y);
    curtain.vertex(targetPos.x + cos(angle + HALF_PI) * spread, targetPos.y + sin(angle + HALF_PI) * spread);
    curtain.vertex(targetPos.x + cos(angle - HALF_PI) * spread, targetPos.y - sin(angle - HALF_PI) * spread);
    curtain.endShape(CLOSE);
    
    curtain.ellipse(targetPos.x, targetPos.y, spread * 2, spread * 2);
    curtain.noErase();
    curtain.pop();
    
    image(curtain, 0, 0);

    // 4. THE LIGHT EFFECT
    drawOverheadLight(anchor.x, anchor.y, targetPos.x, targetPos.y, spread);
  } else {
    fill(200);
    textAlign(CENTER);
    textSize(16);
    text("UPLOAD IMAGE TO START BEACON", width/2, height/2);
  }
}

function drawOverheadLight(x1, y1, x2, y2, spread) {
  push();
  blendMode(SCREEN);
  let c = colorPicker.color();
  let angle = atan2(y2 - y1, x2 - x1);
  noStroke();
  
  fill(red(c), green(c), blue(c), 45);
  beginShape();
  vertex(x1, y1);
  vertex(x2 + cos(angle + HALF_PI) * spread, y2 + sin(angle + HALF_PI) * spread);
  vertex(x2 + cos(angle - HALF_PI) * spread, y2 - sin(angle - HALF_PI) * spread);
  endShape(CLOSE);
  
  fill(red(c), green(c), blue(c), 150);
  ellipse(x1, y1, 20);
  pop();
}

function handleFile(file) {
  if (file.type === 'image') {
    img = loadImage(file.data);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  curtain = createGraphics(width, height);
}

/**
 * Helper function to apply multiple inline styles to a p5 element
 */
function styleElement(el, styles) {
  for (let prop in styles) {
    el.style(prop, styles[prop]);
  }
}