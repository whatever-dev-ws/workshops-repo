// WUP 25-26
// Francesco Lewis
let shapes = [];
let selectedShapes = [];
let currentShape = null;
let mode = 'DRAW'; 
let colorPicker, textInput;
let shapeSelect; 

// UI Sliders
let speedSlider, rotSlider;

let pathMode = 'NONE';
let isAnimating = false;
let isRecordingGIF = false;
let gifBtn, pathBtn;

function setup() {
  createCanvas(800, 700);
  setupDrawingUI();
  setupAnimationUI();
}

function setupDrawingUI() {
  colorPicker = createColorPicker('#ed225d');
  colorPicker.position(10, 10);
  colorPicker.input(updateSelectedColor);

  shapeSelect = createSelect();
  shapeSelect.position(70, 10);
  ['rect', 'square', 'circle', 'triangle', 'hexagon', 'octagon'].forEach(opt => shapeSelect.option(opt));
  shapeSelect.changed(() => { mode = 'DRAW'; });

  textInput = createInput('Type here');
  textInput.position(220, 10);
  createButton('Add Text').position(380, 10).mousePressed(addTextNode);

  // Management Buttons
  createButton('Delete Selected').position(500, 10).mousePressed(deleteSelected);
  createButton('Reset Canvas').position(620, 10).mousePressed(resetCanvas);
}

function setupAnimationUI() {
  pathBtn = createButton('Record Path');
  pathBtn.position(10, 660);
  pathBtn.mousePressed(togglePathRecord);
  
  createButton('Toggle Rotation').position(110, 660).mousePressed(() => {
    if (selectedShapes.length === 0) {
      alert("Select a shape first!");
      return;
    }
    selectedShapes.forEach(s => s.isRotating = !s.isRotating);
  });
  
  // --- SPEED CONTROLS ---
  createP('Path Speed').position(480, 635).style('font-size', '11px').style('font-weight', 'bold');
  speedSlider = createSlider(0, 5, 1, 0.1);
  speedSlider.position(480, 665);
  speedSlider.size(100);
  speedSlider.input(() => {
    selectedShapes.forEach(s => s.moveSpeed = speedSlider.value());
  });

  createP('Rot Speed').position(600, 635).style('font-size', '11px').style('font-weight', 'bold');
  rotSlider = createSlider(0, 0.5, 0.05, 0.01);
  rotSlider.position(600, 665);
  rotSlider.size(100);
  rotSlider.input(() => {
    selectedShapes.forEach(s => s.rotationSpeed = rotSlider.value());
  });

  let playBtn = createButton('PLAY / PAUSE');
  playBtn.position(230, 660);
  playBtn.mousePressed(() => isAnimating = !isAnimating);

  gifBtn = createButton('🔴 GIF');
  gifBtn.position(350, 660);
  gifBtn.style('background-color', '#ff4444').style('color', 'white');
  gifBtn.mousePressed(toggleGIFCapture);
}

function draw() {
  background(255);
  drawUIBoundaries();
  
  // UI STATUS TEXT
  textAlign(LEFT, BASELINE);
  textSize(14); fill(0); noStroke();
  if (pathMode === 'WAITING_FOR_SHAPE') {
    text("STEP 1: Click on the shape to animate.", 110, 685);
  } else if (pathMode === 'READY_TO_DRAW') {
    text("STEP 2: Click and drag to draw path!", 110, 685);
  } else if (pathMode === 'RECORDING') {
    text("🔴 RECORDING PATH...", 110, 685);
  }

  // DISPLAY SHAPES
  for (let s of shapes) {
    if ((!isAnimating || pathMode === 'RECORDING') && s.path.length > 0) {
      noFill(); stroke(s.color); strokeWeight(1);
      beginShape();
      for (let p of s.path) vertex(p.x, p.y);
      endShape();
    }
    if (isAnimating) s.animate();
    s.display(selectedShapes.includes(s));
  }

  // Recording Logic
  if (pathMode === 'RECORDING' && selectedShapes.length > 0) {
    let s = selectedShapes[0];
    let lastPt = s.path[s.path.length-1];
    if (!lastPt || dist(mouseX, mouseY, lastPt.x, lastPt.y) > 2) {
       s.path.push({x: mouseX, y: mouseY});
    }
  }

  // Preview Logic
  if (currentShape && mode === 'DRAW' && pathMode === 'NONE') {
    currentShape.w = mouseX - currentShape.x;
    currentShape.h = (currentShape.type === 'square') ? currentShape.w : mouseY - currentShape.y;
    currentShape.display(false);
  }
}

function mousePressed() {
  if (mouseY < 50 || mouseY > 630) return; 

  let clickedShape = shapes.findLast(s => s.contains(mouseX, mouseY));

  if (pathMode === 'WAITING_FOR_SHAPE') {
    if (clickedShape) {
      selectedShapes = [clickedShape];
      pathMode = 'READY_TO_DRAW';
      pathBtn.style('background-color', 'yellow').html('Draw Now!');
      speedSlider.value(clickedShape.moveSpeed);
      rotSlider.value(clickedShape.rotationSpeed);
    }
    return;
  }

  if (pathMode === 'READY_TO_DRAW') {
    if (selectedShapes.length > 0) {
      pathMode = 'RECORDING';
      selectedShapes[0].path = [];
      selectedShapes[0].pathIndex = 0;
      selectedShapes[0].path.push({x: mouseX, y: mouseY});
    }
    return;
  }

  if (clickedShape) {
    mode = 'MOVE';
    selectedShapes = keyIsDown(SHIFT) ? [...selectedShapes, clickedShape] : [clickedShape];
    colorPicker.value(selectedShapes[0].color.toString('#rrggbb'));
    speedSlider.value(selectedShapes[0].moveSpeed);
    rotSlider.value(selectedShapes[0].rotationSpeed);

    for (let s of selectedShapes) {
      s.offsetX = mouseX - s.x;
      s.offsetY = mouseY - s.y;
    }
  } else {
    mode = 'DRAW';
    selectedShapes = [];
    currentShape = new Shape(mouseX, mouseY, shapeSelect.value(), colorPicker.color());
  }
}

function mouseDragged() {
  if (mode === 'MOVE' && pathMode === 'NONE') {
    for (let s of selectedShapes) {
      s.x = mouseX - s.offsetX;
      s.y = mouseY - s.offsetY;
    }
  }
}

function mouseReleased() {
  if (currentShape) { shapes.push(currentShape); currentShape = null; }
  if (pathMode === 'RECORDING') {
    pathMode = 'NONE';
    pathBtn.style('background-color', '').html('Record Path');
  }
}

function deleteSelected() {
  shapes = shapes.filter(s => !selectedShapes.includes(s));
  selectedShapes = [];
}

function resetCanvas() {
  if (confirm("Clear entire canvas?")) {
    shapes = [];
    selectedShapes = [];
  }
}

function togglePathRecord() {
  pathMode = 'WAITING_FOR_SHAPE';
  selectedShapes = [];
  pathBtn.style('background-color', 'cyan').html('Select Shape...');
}

function toggleGIFCapture() {
  if (!isRecordingGIF) {
    isRecordingGIF = true; isAnimating = true; 
    gifBtn.html('⏹ Stop').style('background-color', '#333');
  } else {
    isRecordingGIF = false;
    gifBtn.html('🔴 GIF').style('background-color', '#ff4444');
    saveGif('myAnimation', 5); 
  }
}

function updateSelectedColor() {
  selectedShapes.forEach(s => s.color = colorPicker.color());
}

function addTextNode() {
  let content = textInput.value();
  if (!content) return; 
  let s = new Shape(width / 2 - 50, height / 2, 'text', colorPicker.color());
  s.textValue = content;
  textSize(32); s.w = textWidth(content) + 20; s.h = 40; 
  shapes.push(s);
  textInput.value('');
}

function drawUIBoundaries() {
  fill(240); noStroke();
  rect(0, 0, width, 50); rect(0, 650, width, 50);
}

class Shape {
  constructor(x, y, type, col) {
    this.x = x; this.y = y; this.w = 50; this.h = 50;
    this.type = type; this.color = col; 
    this.textValue = ''; this.path = []; 
    this.pathIndex = 0; this.angle = 0;
    this.isRotating = false; 
    this.moveSpeed = 1;      
    this.rotationSpeed = 0.05; 
  }

  display(isSelected) {
    push();
    let idx = floor(this.pathIndex);
    let pos = (isAnimating && this.path.length > 0) ? this.path[idx] : {x: this.x, y: this.y};
    translate(pos.x + this.w/2, pos.y + this.h/2);
    if (isAnimating && this.isRotating) this.angle += this.rotationSpeed; 
    rotate(this.angle); 
    if (isSelected) { stroke('blue'); strokeWeight(2); } 
    else { (this.type === 'text') ? noStroke() : stroke(0); strokeWeight(1); }
    fill(this.color); rectMode(CENTER); textAlign(CENTER, CENTER); 
    switch (this.type) {
      case 'circle': ellipse(0, 0, this.w, this.h); break;
      case 'rect': case 'square': rect(0, 0, this.w, this.h); break;
      case 'triangle': this.drawPoly(3); break;
      case 'hexagon': this.drawPoly(6); break;
      case 'octagon': this.drawPoly(8); break;
      case 'text': textSize(32); fill(this.color); noStroke(); text(this.textValue, 0, 0); break;
    }
    pop();
  }

  drawPoly(sides) {
    beginShape();
    let radius = min(abs(this.w), abs(this.h)) / 2;
    for (let i = 0; i < sides; i++) {
      let a = TWO_PI / sides * i - PI/2;
      vertex(cos(a) * radius, sin(a) * radius);
    }
    endShape(CLOSE);
  }

  animate() {
    if (this.path.length > 0) {
      this.pathIndex = (this.pathIndex + this.moveSpeed) % this.path.length;
    }
  }

  contains(px, py) {
    let rx = this.w < 0 ? this.x + this.w : this.x;
    let ry = this.h < 0 ? this.y + this.h : this.y;
    return px > rx && px < rx + abs(this.w) && py > ry && py < ry + abs(this.h);
  }
}