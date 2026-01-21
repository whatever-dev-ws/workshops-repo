let canvasWInput;
let canvasHInput;
let resizeBtn;

// --- BACKGROUND IMAGE VARIABLES ---
let bgImage = null; 
let bgInput;        
let removeBgBtn;

// --- SHAPE & TEXT VARIABLES ---
let shapeTypeSelect;
let addShapeBtn;
let addTextBtn; 
let shapes = [];
let selectedShape = null;
let draggedShape = null;
let dragOffsetX = 0;
let dragOffsetY = 0;

// --- FONT VARIABLES (NEW) ---
let customFont = null;
let fontInput;
let resetFontBtn;

// --- PROPERTIES UI ---
let shapeSizeSlider;
let shapeRotateSlider;
let shapeStretchSlider; 
let selectedTextInput; 

// --- BRUSH VARIABLES ---
let brushCheckbox;
let brushSizeSlider;
let clearBrushBtn;
let paintings = [];
let currentPath = [];

function setup() {
  // --- INJECT GOOGLE FONTS ---
  let link = document.createElement('link');
  // Load DM Sans and Urbanist
  link.href = 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Urbanist:wght@400;500;700;900&display=swap';
  link.rel = 'stylesheet';
  document.head.appendChild(link);

  // ==========================================
  // --- LAYOUT SETUP ---
  // ==========================================
    
  let mainLayout = createDiv();
  mainLayout.style('display', 'flex');
  mainLayout.style('height', '100vh');
  mainLayout.style('width', '100%');
  mainLayout.style('font-family', "'Urbanist', sans-serif");

  // SIDEBAR
  let sidebar = createDiv();
  sidebar.parent(mainLayout);
  sidebar.style('width', '320px');
  
  // --- UI COLORS (SIDEBAR) ---
  sidebar.style('background', '#F7F2EB'); 
  sidebar.style('color', '#422C0F');        
  
  sidebar.style('padding', '25px');
  sidebar.style('overflow-y', 'auto');
  sidebar.style('box-sizing', 'border-box');
  sidebar.style('border-right', '1px solid #e0e0e0');
  sidebar.style('display', 'flex');           
  sidebar.style('flex-direction', 'column');

  // CANVAS CONTAINER
  let canvasContainer = createDiv();
  canvasContainer.parent(mainLayout);
  canvasContainer.style('flex-grow', '1');
  canvasContainer.style('display', 'flex');
  canvasContainer.style('justify-content', 'center');
  canvasContainer.style('align-items', 'center');
  canvasContainer.style('background', '#333');
  canvasContainer.style('overflow', 'auto');

  let cnv = createCanvas(600, 400);
  cnv.parent(canvasContainer);
  angleMode(DEGREES);
  
  // --- SETUP DEFAULT FONT ---
  textFont('Urbanist'); 
  textStyle(BOLD);

  // ==========================================
  // SIDEBAR CONTROLS
  // ==========================================

  // --- MAIN TITLE (REDUCED) ---
  let appTitle = createDiv('Negative type🌟');
  appTitle.parent(sidebar);
  appTitle.style('font-family', "'Urbanist', sans-serif"); 
  appTitle.style('font-weight', '700'); 
  appTitle.style('font-size', '22px'); 
  appTitle.style('color', '#381D16');
  appTitle.style('margin-top', '0px');
  appTitle.style('margin-bottom', '25px');
  appTitle.style('line-height', '1.1em');
  appTitle.style('text-transform', 'uppercase'); 

  // --- SECTION 1: CANVAS & BACKGROUND ---
  createP('<strong>Canvas size</strong>').parent(sidebar).style('margin-top', '0');
    
  let sizeDiv = createDiv();
  sizeDiv.parent(sidebar);
  sizeDiv.style('display', 'flex');
  sizeDiv.style('gap', '10px');
  sizeDiv.style('margin-bottom', '15px'); 

  canvasWInput = createInput('600');
  canvasWInput.parent(sizeDiv);
  canvasWInput.size(50);
  createSpan('x').parent(sizeDiv);
  canvasHInput = createInput('400');
  canvasHInput.parent(sizeDiv);
  canvasHInput.size(50);

  resizeBtn = createButton('Resize');
  resizeBtn.parent(sizeDiv);
  
  // --- CENTERING IMPLEMENTATION ---
  resizeBtn.mousePressed(() => {
    let w = int(canvasWInput.value());
    let h = int(canvasHInput.value());

    if (w > 0 && h > 0) {
      let oldCenterX = width / 2;
      let oldCenterY = height / 2;

      resizeCanvas(w, h);

      let newCenterX = width / 2;
      let newCenterY = height / 2;

      let deltaX = newCenterX - oldCenterX;
      let deltaY = newCenterY - oldCenterY;

      for (let s of shapes) {
        s.x += deltaX;
        s.y += deltaY;
      }
      
    }
  });

  createP('Upload Image:').parent(sidebar).style('margin-bottom','5px');
  bgInput = createFileInput(handleFile); 
  bgInput.parent(sidebar);
  
  removeBgBtn = createButton('Remove Image');
  removeBgBtn.parent(sidebar);
  removeBgBtn.style('margin-top', '5px');
  removeBgBtn.mousePressed(() => {
      bgImage = null; 
      bgInput.value(''); 
  });

  // --- SECTION 2: TEXT TOOLS ---
  let sepText = createP('<hr><strong>Text Tools</strong>');
  sepText.parent(sidebar);
  sepText.child()[0].style.borderColor = '#381D16'; 
  sepText.child()[0].style.opacity = '0.3';

  // 1. Add Text Button
  addTextBtn = createButton('Add Text');
  addTextBtn.parent(sidebar);
  addTextBtn.style('cursor', 'pointer');
  addTextBtn.style('font-weight', 'bold');
  addTextBtn.style('width', '100%');
  addTextBtn.style('margin-bottom', '10px');
  addTextBtn.style('color', '#381D16'); 
  addTextBtn.mousePressed(addNewText);

  // 2. Edit Text Input
  createSpan('Edit selected text:').parent(sidebar);
  selectedTextInput = createInput('');
  selectedTextInput.parent(sidebar);
  selectedTextInput.attribute('placeholder', 'Select text to edit');
  selectedTextInput.style('width', '100%');
  selectedTextInput.style('box-sizing', 'border-box'); 
  selectedTextInput.style('margin-bottom', '5px');
  selectedTextInput.style('margin-top', '5px');
  selectedTextInput.input(() => {
      if (selectedShape && selectedShape.type === 'Text') {
          selectedShape.content = selectedTextInput.value();
      }
  });

  // 3. Custom Font Import (NEW)
  createDiv('').parent(sidebar).style('height', '10px'); // Spacer
  createSpan('Custom Font (.ttf/.otf):').parent(sidebar);
  
  fontInput = createFileInput(handleFont);
  fontInput.parent(sidebar);
  fontInput.style('margin-top', '5px');

  resetFontBtn = createButton('Reset Font');
  resetFontBtn.parent(sidebar);
  resetFontBtn.style('margin-top', '5px');
  resetFontBtn.mousePressed(() => {
      customFont = null;
      fontInput.value('');
  });

  // --- SECTION 3: SHAPE TOOLS ---
  let sepShape = createP('<hr><strong>Shape Tools</strong>');
  sepShape.parent(sidebar);
  sepShape.child()[0].style.borderColor = '#381D16'; 
  sepShape.child()[0].style.opacity = '0.3';
    
  let shapeRow = createDiv();
  shapeRow.parent(sidebar);
  shapeRow.style('display', 'flex');
  shapeRow.style('gap', '5px');
  shapeRow.style('margin-bottom', '10px');

  shapeTypeSelect = createSelect();
  shapeTypeSelect.parent(shapeRow);
  shapeTypeSelect.option('Circle');
  shapeTypeSelect.option('Square');
  shapeTypeSelect.option('Triangle');
  shapeTypeSelect.option('Star');
  shapeTypeSelect.option('Heart');      
  shapeTypeSelect.style('flex-grow', '1');
  
  addShapeBtn = createButton('Add Shape');
  addShapeBtn.parent(shapeRow);
  addShapeBtn.style('color', '#381D16');
  addShapeBtn.mousePressed(addNewShape);

  // --- SECTION 4: TRANSFORM PROPERTIES ---
  let sepTransform = createP('<hr><strong>Transform Properties</strong>');
  sepTransform.parent(sidebar);
  sepTransform.child()[0].style.borderColor = '#381D16'; 
  sepTransform.child()[0].style.opacity = '0.3';

  createSpan('Size: ').parent(sidebar);
  shapeSizeSlider = createSlider(10, 400, 60, 1);
  shapeSizeSlider.parent(sidebar);
  shapeSizeSlider.style('width', '100%'); 
    
  createP('').parent(sidebar);
  createSpan('Rotation: ').parent(sidebar);
  shapeRotateSlider = createSlider(0, 360, 0, 1);
  shapeRotateSlider.parent(sidebar);
  shapeRotateSlider.style('width', '100%'); 

  createP('').parent(sidebar);
  createSpan('Vertical Stretch: ').parent(sidebar); 
  shapeStretchSlider = createSlider(0.5, 3.0, 1.0, 0.1); 
  shapeStretchSlider.parent(sidebar);
  shapeStretchSlider.style('width', '100%'); 

  // --- SECTION 5: BRUSH ---
  let sepBrush = createP('<hr><strong>Brush</strong>');
  sepBrush.parent(sidebar);
  sepBrush.child()[0].style.borderColor = '#381D16'; 
  sepBrush.child()[0].style.opacity = '0.3';
    
  brushCheckbox = createCheckbox('Enable Brush', false);
  brushCheckbox.parent(sidebar);
    
  createSpan('Size: ').parent(sidebar);
  brushSizeSlider = createSlider(2, 50, 10, 1);
  brushSizeSlider.parent(sidebar);
    
  createP('').parent(sidebar);
  clearBrushBtn = createButton('Clear Brush');
  clearBrushBtn.parent(sidebar);
  clearBrushBtn.style('color', '#381D16');
  clearBrushBtn.mousePressed(() => { paintings = []; }); 

  // --- FOOTER LEGEND ---
  let spacer = createDiv();
  spacer.parent(sidebar);
  spacer.style('flex-grow', '1');
  spacer.style('min-height', '20px');

  let legendDiv = createDiv();
  legendDiv.parent(sidebar);
  legendDiv.style('background', '#fff'); 
  legendDiv.style('padding', '10px');
  legendDiv.style('border-radius', '4px');
  legendDiv.style('border', '1px solid #eee');
  legendDiv.style('font-size', '0.9em');
  legendDiv.style('line-height', '1.4em');

  legendDiv.html(`
    <strong>SHORTCUTS:</strong><br>
    <span style="display:inline-block; width: 20px; font-weight:bold;">S</span> : Save Image<br>
    <span style="display:inline-block; width: 20px; font-weight:bold;">C</span> : Clear Canvas
  `);

  // --- INITIALIZATION: DEFAULT TEXT ---
  let startText = new CustomShape(width/2, height/2, 'Text');
  startText.content = "UPLOAD YOUR IMAGE";
  startText.size = 50;
  startText.isPlaceholder = true; 
  shapes.push(startText);
  selectShape(startText);
}

// --- NEW FUNCTION: HANDLE FONT UPLOAD ---
function handleFont(file) {
  if (file.subtype === 'font' || file.name.endsWith('.ttf') || file.name.endsWith('.otf')) {
    // loadFont supports Base64 DataURLs provided by file.data
    customFont = loadFont(file.data);
  } else {
    customFont = null;
    alert("Please upload a valid .ttf or .otf file.");
  }
}

function handleFile(file) {
  if (file.type === 'image') {
    bgImage = createImg(file.data, '');
    bgImage.hide(); 
    
    // --- REMOVE PLACEHOLDER TEXT ---
    for (let i = shapes.length - 1; i >= 0; i--) {
        if (shapes[i].isPlaceholder) {
            if (selectedShape === shapes[i]) {
                selectedShape = null;
                selectedTextInput.value('');
            }
            shapes.splice(i, 1);
        }
    }

  } else {
    bgImage = null;
  }
}

function draw() {
  let contentColor;

  // 1. BACKGROUND & COLOR MODE
  if (bgImage) {
      // --- IMAGE MODE (Negative) ---
      image(bgImage, 0, 0, width, height);
      blendMode(DIFFERENCE); 
      contentColor = color(255); // White for negative effect
  } else {
      // --- DEFAULT MODE (No Image) ---
      background('#FFFFFF');    
      blendMode(BLEND); 
      contentColor = color('#000000'); 
  }

  // 2. UPDATE SELECTED SHAPE PROPERTIES
  if (selectedShape != null) {
    selectedShape.size = shapeSizeSlider.value();
    selectedShape.rotation = shapeRotateSlider.value();
    selectedShape.stretch = shapeStretchSlider.value(); 
  }

  // 3. DRAW OBJECTS
  for (let s of shapes) {
    s.display(contentColor);
  }

  // 4. BRUSH
  noFill();
  stroke(contentColor); 
  strokeJoin(ROUND);
  strokeCap(ROUND);

  for (let pathData of paintings) {
    strokeWeight(pathData.size); 
    beginShape();
    for (let p of pathData.points) { vertex(p.x, p.y); }
    endShape();
  }

  if (currentPath.length > 0) {
    strokeWeight(brushSizeSlider.value());
    beginShape();
    for (let p of currentPath) { vertex(p.x, p.y); }
    endShape();
  }
    
  blendMode(BLEND);
}

// --- INTERACTION FUNCTIONS ---

function addNewShape() {
  let type = shapeTypeSelect.value();
  let newShape = new CustomShape(width / 2, height / 2, type);
  shapes.push(newShape);
  selectShape(newShape);
  brushCheckbox.checked(false);
}

function addNewText() {
    let newText = new CustomShape(width / 2, height / 2, 'Text');
    newText.content = "TEXT"; 
    newText.size = 80;
    shapes.push(newText);
    selectShape(newText);
    brushCheckbox.checked(false);
}

function mousePressed() {
  if (mouseX < 0 || mouseX > width || mouseY < 0 || mouseY > height) return;

  if (brushCheckbox.checked()) {
    currentPath = [];
    currentPath.push({ x: mouseX, y: mouseY });
    return; 
  }

  let clickedOnShape = false;
  for (let i = shapes.length - 1; i >= 0; i--) {
    if (shapes[i].isHit(mouseX, mouseY)) {
      draggedShape = shapes[i];
      dragOffsetX = mouseX - shapes[i].x;
      dragOffsetY = mouseY - shapes[i].y;
      selectShape(shapes[i]);
      clickedOnShape = true;
      break;
    }
  }
  if (!clickedOnShape) {
      selectedShape = null;
      selectedTextInput.value(''); 
      selectedTextInput.attribute('disabled', '');
  }
}

function mouseDragged() {
  if (mouseX < 0 || mouseX > width || mouseY < 0 || mouseY > height) return;

  if (brushCheckbox.checked()) {
    currentPath.push({ x: mouseX, y: mouseY });
    return;
  }

  if (draggedShape) {
    draggedShape.x = mouseX - dragOffsetX;
    draggedShape.y = mouseY - dragOffsetY;
  }
}

function mouseReleased() {
  if (brushCheckbox.checked()) {
    if (currentPath.length > 0) {
      paintings.push({ points: currentPath, size: brushSizeSlider.value() });
      currentPath = []; 
    }
  }
  draggedShape = null;
}

function selectShape(shape) {
  selectedShape = shape;
  shapeSizeSlider.value(shape.size);
  shapeRotateSlider.value(shape.rotation);
  shapeStretchSlider.value(shape.stretch); 
  
  if (shape.type === 'Text') {
      selectedTextInput.removeAttribute('disabled');
      selectedTextInput.value(shape.content);
  } else {
      selectedTextInput.value('(Shape Selected)');
      selectedTextInput.attribute('disabled', '');
  }
}

function doubleClicked() {
  if (mouseX < 0 || mouseX > width || mouseY < 0 || mouseY > height) return;
    
  if (!brushCheckbox.checked()) {
    for (let i = shapes.length - 1; i >= 0; i--) {
      if (shapes[i].isHit(mouseX, mouseY)) {
        if (shapes[i] === selectedShape) {
             selectedShape = null;
             selectedTextInput.value('');
        }
        shapes.splice(i, 1);
        break;
      }
    }
  }
}

function keyPressed() {
  if (document.activeElement.tagName === 'INPUT') return; 

  if (key === 's' || key === 'S') {
    saveCanvas('inverted.image', 'jpg');
  }

  if (key === 'c' || key === 'C') {
      shapes = [];
      paintings = [];
      currentPath = [];
      selectedShape = null;
      selectedTextInput.value('');
  }
}

// --- CUSTOM SHAPE CLASS ---
class CustomShape {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type; 
    this.size = 60; 
    this.rotation = 0; 
    this.stretch = 1.0; 
    this.content = ""; 
    this.isPlaceholder = false; 
  }

  display(contentColor) {
    push();
    translate(this.x, this.y);
    rotate(this.rotation); 
    scale(1, this.stretch); 
    
    fill(contentColor); 
    
    if (this === selectedShape) {
      stroke(contentColor); 
      strokeWeight(1.0 / Math.max(0.5, this.stretch)); 
    } else {
      noStroke();
    }

    if (this.type === 'Text') {
        // --- UPDATED FONT LOGIC ---
        if (customFont) {
          textFont(customFont);
        } else {
          textFont('Urbanist');
        }

        textAlign(CENTER, CENTER);
        rectMode(CENTER); 
        textSize(this.size);
        textLeading(this.size); 
        
        let maxBoxWidth = width - 40; 
        let maxBoxHeight = height * 4; 

        text(this.content, 0, 0, maxBoxWidth, maxBoxHeight);
    } 
    else if (this.type === 'Circle') {
      circle(0, 0, this.size);
    } else if (this.type === 'Square') {
      rectMode(CENTER);
      rect(0, 0, this.size, this.size);
    } else if (this.type === 'Triangle') {
      let r = this.size / 2;
      triangle(0, -r, -r, r, r, r);
    } else if (this.type === 'Star') {
      drawStar(0, 0, this.size * 0.4, this.size, 5);
    } else if (this.type === 'Heart') {
      drawHeart(0, 0, this.size);
    }
    
    pop();
  }

  isHit(mx, my) {
    let hitSize = this.size;
    let scalingFactor = this.stretch > 1 ? this.stretch : 1;

    if (this.type === 'Text' && this.content.length > 0) {
        // Temporary font check for Hitbox calculation
        push();
        if (customFont) textFont(customFont);
        else textFont('Urbanist');
        textSize(this.size);
        
        let dx = abs(mx - this.x);
        let dy = abs(my - this.y);
        
        let singleLineWidth = textWidth(this.content); // More accurate width calc
        let maxBoxWidth = width - 40;
        
        let actualWidth = min(singleLineWidth, maxBoxWidth);
        let numLines = ceil(singleLineWidth / maxBoxWidth); 
        numLines = max(1, numLines);

        let estHeight = (this.size) * numLines * scalingFactor;
        pop();
        
        return (dx < actualWidth / 2 + 10 && dy < estHeight / 2 + 10);
    }

    let d = dist(mx, my, this.x, this.y);
    return d < (hitSize * scalingFactor) / 1.5; 
  }
}

function drawStar(x, y, radius1, radius2, npoints) {
  let angle = 360 / npoints;
  let halfAngle = angle / 2.0;
  beginShape();
  for (let a = 0; a < 360; a += angle) {
    let sx = x + cos(a - 90) * radius2; 
    let sy = y + sin(a - 90) * radius2;
    vertex(sx, sy);
    sx = x + cos(a + halfAngle - 90) * radius1;
    sy = y + sin(a + halfAngle - 90) * radius1;
    vertex(sx, sy);
  }
  endShape(CLOSE);
}

function drawHeart(x, y, size) {
  beginShape();
  let r = size / 2;
  vertex(0, -r * 0.4); 
  bezierVertex(r * 0.5, -r * 1.2, r * 1.3, -r * 0.3, 0, r * 0.8);
  bezierVertex(-r * 1.3, -r * 0.3, -r * 0.5, -r * 1.2, 0, -r * 0.4);
  endShape(CLOSE);
}