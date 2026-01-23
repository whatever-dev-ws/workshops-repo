// WUP 25-26
// Laila Emam
// ---------------- Variablen ----------------
let sizeSlider, scatterSlider, rotSlider, opacitySlider;
let pCol, bgCol, savePicBtn, clearBtn, fileInput;
let brushTitle, dynTitle, styleTitle, exportTitle;
let sizeLabel, scatterLabel, rotLabel, opacLabel, pColLabel, bgColLabel;
let userImg = null;

// ---------------- Setup ----------------
function setup() {
  createCanvas(windowWidth, windowHeight);
  background(255); 
  
  // UI GRID CONSTANTS
  let col1 = 30;             // Column for File Input
  let col2 = 220;            // Column for Dynamics
  let col3 = 450;            // Column for Colors
  let col4 = width - 180;    // Column for Export
  let row1 = height - 150;
  let row2 = height - 100;
  let row3 = height - 50;

  // --- COLUMN 1: IMAGE UPLOAD ---
  brushTitle = createLabel('1. UPLOAD PNG', col1, row1 - 25, true);
  fileInput = createFileInput(handleFile);
  fileInput.position(col1, row1);

  // --- COLUMN 2: DYNAMICS ---
  dynTitle = createLabel('2. DYNAMICS', col2, row1 - 25, true);
  
  sizeLabel = createLabel('Stamp Size', col2, row1, false);
  sizeSlider = createSlider(10, 500, 100); 
  sizeSlider.position(col2, row1 + 15);
  
  scatterLabel = createLabel('Scatter Amount', col2, row2, false);
  scatterSlider = createSlider(0, 200, 0); 
  scatterSlider.position(col2, row2 + 15);

  rotLabel = createLabel('Manual Rotation', col2, row3, false);
  rotSlider = createSlider(0, TWO_PI, 0, 0.01); 
  rotSlider.position(col2, row3 + 15);

  // --- COLUMN 3: STYLE ---
  styleTitle = createLabel('3. STYLE & TINT', col3, row1 - 25, true);
  
  pColLabel = createLabel('Color Tint', col3, row1, false);
  pCol = createColorPicker('#ffffff'); // White = No tint
  pCol.position(col3, row1 + 15);
  
  opacLabel = createLabel('Opacity', col3, row2, false);
  opacitySlider = createSlider(0, 255, 255);
  opacitySlider.position(col3, row2 + 15);

  bgColLabel = createLabel('Canvas Color', col3, row3, false);
  bgCol = createColorPicker('#ffffff');
  bgCol.position(col3, row3 + 15);

  // --- COLUMN 4: EXPORT ---
  exportTitle = createLabel('4. EXPORT', col4, row1 - 25, true);
  
  savePicBtn = createButton('📸 SAVE IMAGE');
  savePicBtn.position(col4, row1);
  savePicBtn.size(140, 40);
  savePicBtn.mousePressed(() => saveCanvas('PNG_Vibe_Art', 'png'));

  clearBtn = createButton('🗑️ RESET');
  clearBtn.position(col4, row2 + 10);
  clearBtn.size(140, 40);
  clearBtn.mousePressed(() => background(bgCol.color()));

}

// ---------------- Draw ----------------
function draw() {
  // UI Background Box (Prevents seeing brush strokes under the UI)
  push();
  fill(20, 255); // Solid Dark UI Bar
  noStroke();
  rect(0, height - 180, width, 180);
  pop();

  if (mouseIsPressed && mouseY < height - 180) {
    if (userImg) {
      paint(mouseX, mouseY);
    }
  }
}

function paint(x, y) {
  let s = scatterSlider.value();
  let posX = x + random(-s, s);
  let posY = y + random(-s, s);
  let size = sizeSlider.value();
  let rotation = rotSlider.value();
  
  push();
  translate(posX, posY);
  rotate(rotation);
  
  // Apply the Tint and Opacity
  let c = pCol.color();
  tint(red(c), green(c), blue(c), opacitySlider.value());
  
  imageMode(CENTER);
  image(userImg, 0, 0, size, size);
  pop();
}

function handleFile(file) {
  if (file.type === 'image') {
    userImg = loadImage(file.data);
  }
}

function createLabel(txt, x, y, isTitle) {
  let l = createElement('p', txt);
  l.position(x, y);
  l.style('color', isTitle ? '#00FFCC' : '#FFFFFF');
  l.style('font-family', 'sans-serif');
  l.style('font-size', isTitle ? '14px' : '10px');
  l.style('font-weight', isTitle ? 'bold' : 'normal');
  l.style('margin', '0');
  l.style('pointer-events', 'none'); // Prevents the text from blocking clicks
  return l;
}

function windowResized() { 
  resizeCanvas(windowWidth, windowHeight); 
  background(bgCol.color()); 
}