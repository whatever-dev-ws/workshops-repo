// WUP 25-26
// Chiara VIel
// GLOBAL VARIABLES
let shapesList = []; 
let morphAmount = 0;  
let direction = 1;    
let isRecording = false;

// Config
let pointCount = 360;
let radius = 200;

// UI Elements
let selectShapeA, selectShapeB, sliderSpeed;
// COLORS: Start/End per Fill e Start/End per Stroke
let fillPickerA, fillPickerB;
let strokePickerA, strokePickerB;
let btnExport, btnUpload;
let selectBg;

// Custom shapes storage
let customShapes = [];

function setup() {
  createCanvas(windowWidth, windowHeight);
  
  // RGB Mode per transizioni pulite
  colorMode(RGB, 255, 255, 255, 1);
  
  // Apply Body Styles directly
  document.body.style.margin = '0';
  document.body.style.overflow = 'hidden';
  document.body.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  
  createInterface();

  // Generate default shapes
  shapesList.push(getCircle(radius));       // 0
  shapesList.push(getPolygon(radius, 4));   // 1
  shapesList.push(getPolygon(radius, 3));   // 2
  shapesList.push(getPolygon(radius, 5));   // 3
  shapesList.push(getPolygon(radius, 6));   // 4
  shapesList.push(getStar(radius, 5, radius/2)); // 5
  shapesList.push(getFlower(radius, 6));    // 6
  shapesList.push(getHeart(radius));        // 7
}

function draw() {
  // Background logic
  let bgOption = selectBg.value();
  if (bgOption === 'transparent') {
    clear();
  } else {
    let bgColor = bgOption === 'black' ? color(0) : color(255);
    background(bgColor);
  }
  
  translate(width/2, height/2);

  // Speed Logic
  let val = sliderSpeed.value();
  let speed = map(val * val, 0, 1, 0.0005, 0.04); 
  
  morphAmount += speed * direction;
  
  // Ping Pong Loop Logic
  if (morphAmount >= 1) {
    morphAmount = 1;
    direction = -1; 
  } else if (morphAmount <= 0) {
    morphAmount = 0;
    direction = 1; 
  }

  let smoothVal = easeInOut(morphAmount);

  let idxA = int(selectShapeA.value());
  let idxB = int(selectShapeB.value());
  
  let shapeStart = shapesList[idxA] || shapesList[0];
  let shapeEnd = shapesList[idxB] || shapesList[0];

  // --- COLOR INTERPOLATION (RGB) ---
  
  // 1. FILL
  let fA = color(fillPickerA.value());
  let fB = color(fillPickerB.value());
  let currentFill = lerpColor(fA, fB, smoothVal);
  currentFill.setAlpha(0.85); 
  fill(currentFill);

  // 2. STROKE
  let sA = color(strokePickerA.value());
  let sB = color(strokePickerB.value());
  let currentStroke = lerpColor(sA, sB, smoothVal);
  
  strokeWeight(3);
  stroke(currentStroke);

  // --- DRAW SHAPE ---
  beginShape();
  for (let i = 0; i < pointCount; i++) {
    let v1 = shapeStart[i];
    let v2 = shapeEnd[i];
    
    let x = lerp(v1.x, v2.x, smoothVal);
    let y = lerp(v1.y, v2.y, smoothVal);
    
    vertex(x, y);
  }
  endShape(CLOSE);
}

// --- EXPORT LOGIC ---
function keyPressed() {
  if ((key == 'd' || key == 'D') && (keyIsDown(META) || keyIsDown(CONTROL))) {
    startExport();
    return false;
  }
}

function startExport() {
  if (isRecording) return;
  isRecording = true;
  
  btnExport.html("CREATING GIF...");
  // Update style for active state
  btnExport.elt.style.background = '#FF3B30'; 
  
  // Crea GIF di 3 secondi
  saveGif('morph_design.gif', 3, { units: 'seconds' });

  setTimeout(() => {
    isRecording = false;
    btnExport.html("DOWNLOAD GIF");
    btnExport.elt.style.background = 'linear-gradient(135deg, #007AFF, #5AC8FA)';
  }, 4000);
}

// --- GEOMETRY FUNCTIONS ---
function getCircle(r) {
  let pts = [];
  for (let i = 0; i < pointCount; i++) {
    let ang = map(i, 0, pointCount, 0, TWO_PI);
    pts.push(createVector(cos(ang)*r, sin(ang)*r));
  }
  return pts;
}

function getPolygon(r, sides) {
  let pts = [];
  for (let i = 0; i < pointCount; i++) {
    let ang = map(i, 0, pointCount, 0, TWO_PI) - PI/2;
    let segmentAngle = TWO_PI / sides;
    let currentSegment = floor((ang + PI/sides) / segmentAngle);
    let segmentCenter = currentSegment * segmentAngle; 
    let localAngle = ang - segmentCenter;
    let rFlat = (r * cos(PI/sides)) / cos(localAngle);
    if (abs(localAngle) >= PI/sides) rFlat = r; 
    let x = cos(ang) * rFlat;
    let y = sin(ang) * rFlat;
    pts.push(createVector(x, y));
  }
  return pts;
}

function getStar(rOuter, points, rInner) {
  let pts = [];
  for (let i = 0; i < pointCount; i++) {
    let ang = map(i, 0, pointCount, 0, TWO_PI) - PI/2;
    let wave = abs(sin(ang * points / 2));
    let r = map(wave, 0, 1, rInner, rOuter);
    pts.push(createVector(cos(ang)*r, sin(ang)*r));
  }
  return pts;
}

function getFlower(r, petals) {
  let pts = [];
  for (let i = 0; i < pointCount; i++) {
    let ang = map(i, 0, pointCount, 0, TWO_PI);
    let amp = r * 0.3;
    let rBase = r * 0.8;
    let currR = rBase + amp * cos(ang * petals);
    pts.push(createVector(cos(ang)*currR, sin(ang)*currR));
  }
  return pts;
}

function getHeart(r) {
  let pts = [];
  let s = r / 16; 
  for (let i = 0; i < pointCount; i++) {
    let ang = map(i, 0, pointCount, 0, TWO_PI);
    let x = 16 * pow(sin(ang), 3);
    let y = 13 * cos(ang) - 5 * cos(2*ang) - 2 * cos(3*ang) - cos(4*ang);
    pts.push(createVector(x * s, -y * s)); 
  }
  return pts;
}

// --- CUSTOM SHAPE UPLOAD ---
function handleFile(file) {
  if (file.type === 'image') {
    loadImage(file.data, img => {
      let shape = traceImageToShape(img, radius);
      customShapes.push(shape);
      shapesList.push(shape);
      
      let idx = shapesList.length - 1;
      let name = 'Custom ' + customShapes.length;
      selectShapeA.option(name, idx);
      selectShapeB.option(name, idx);
    });
  }
}

function traceImageToShape(img, targetRadius) {
  let pts = [];
  img.loadPixels();
  
  if (img.width < 400 || img.height < 400) {
    img.resize(800, 800);
    img.loadPixels();
  }
  
  let minX = img.width, maxX = 0, minY = img.height, maxY = 0;
  let hasMass = false;
  
  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      let idx = (x + y * img.width) * 4;
      let alpha = img.pixels[idx + 3];
      if (alpha > 50) {
        hasMass = true;
        minX = min(minX, x);
        maxX = max(maxX, x);
        minY = min(minY, y);
        maxY = max(maxY, y);
      }
    }
  }
  
  if (!hasMass) return getCircle(targetRadius);
  
  let centerX = (minX + maxX) / 2;
  let centerY = (minY + maxY) / 2;
  let maxDim = max(maxX - minX, maxY - minY);
  
  for (let i = 0; i < pointCount; i++) {
    let ang = map(i, 0, pointCount, 0, TWO_PI);
    let maxDist = 0;
    let foundEdge = false;
    let searchRadius = maxDim * 0.8;
    for (let d = 0; d < searchRadius; d += 0.5) {
      let x = centerX + cos(ang) * d;
      let y = centerY + sin(ang) * d;
      let alpha = getBilinearAlpha(img, x, y);
      if (alpha > 128) {
        maxDist = d;
        foundEdge = true;
      } else if (foundEdge) {
        break;
      }
    }
    let scale = targetRadius / (maxDim * 0.5);
    let r = maxDist * scale;
    pts.push(createVector(cos(ang) * r, sin(ang) * r));
  }
  pts = smoothShape(pts, 2);
  return pts;
}

function getBilinearAlpha(img, x, y) {
  let x0 = floor(x);
  let y0 = floor(y);
  let x1 = x0 + 1;
  let y1 = y0 + 1;
  if (x0 < 0 || x1 >= img.width || y0 < 0 || y1 >= img.height) return 0;
  let fx = x - x0;
  let fy = y - y0;
  let getAlpha = (px, py) => img.pixels[(px + py * img.width) * 4 + 3];
  let a00 = getAlpha(x0, y0);
  let a10 = getAlpha(x1, y0);
  let a01 = getAlpha(x0, y1);
  let a11 = getAlpha(x1, y1);
  return lerp(lerp(a00, a10, fx), lerp(a01, a11, fx), fy);
}

function smoothShape(pts, iterations) {
  for (let iter = 0; iter < iterations; iter++) {
    let smoothed = [];
    for (let i = 0; i < pts.length; i++) {
      let prev = pts[(i - 1 + pts.length) % pts.length];
      let curr = pts[i];
      let next = pts[(i + 1) % pts.length];
      let avgX = (prev.x + curr.x * 2 + next.x) / 4;
      let avgY = (prev.y + curr.y * 2 + next.y) / 4;
      smoothed.push(createVector(avgX, avgY));
    }
    pts = smoothed;
  }
  return pts;
}

function easeInOut(t) {
  return t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

// --- UI ---
function createInterface() {
  let panel = createDiv('');
  stylePanel(panel);
  
  // COL 1 - SHAPES
  let col1 = createDiv('').parent(panel);
  styleColumn(col1);
  
  let l1 = createSpan('FROM SHAPE').parent(col1);
  styleLabel(l1);
  selectShapeA = createSelect().parent(col1);
  styleSelect(selectShapeA);
  addOptions(selectShapeA);
  selectShapeA.selected(6);
  
  let l2 = createSpan('TO SHAPE').parent(col1);
  styleLabel(l2);
  selectShapeB = createSelect().parent(col1);
  styleSelect(selectShapeB);
  addOptions(selectShapeB);
  selectShapeB.selected(7);
  
  let l3 = createSpan('UPLOAD CUSTOM').parent(col1);
  styleLabel(l3);
  btnUpload = createFileInput(handleFile);
  btnUpload.parent(col1);
  btnUpload.attribute('accept', 'image/*');
  styleUploadButton(btnUpload);

  // COL 2 - COLORS
  let col2 = createDiv('').parent(panel);
  styleColumn(col2);
  
  // FILL GROUP
  let l4 = createSpan('FILL START / END').parent(col2);
  styleLabel(l4);
  let fillRow = createDiv('').parent(col2).style('display','flex').style('gap','5px');
  fillPickerA = createColorPicker('#FF0055'); 
  fillPickerA.parent(fillRow);
  stylePicker(fillPickerA);
  fillPickerB = createColorPicker('#007AFF'); 
  fillPickerB.parent(fillRow);
  stylePicker(fillPickerB);
  
  // STROKE GROUP
  let l5 = createSpan('STROKE START / END').parent(col2);
  styleLabel(l5);
  let strokeRow = createDiv('').parent(col2).style('display','flex').style('gap','5px');
  strokePickerA = createColorPicker('#FFD700'); 
  strokePickerA.parent(strokeRow);
  stylePicker(strokePickerA);
  strokePickerB = createColorPicker('#FFFFFF'); 
  strokePickerB.parent(strokeRow);
  stylePicker(strokePickerB);

  // COL 3 - CONTROLS
  let col3 = createDiv('').parent(panel);
  styleColumn(col3);
  
  let l6 = createSpan('BACKGROUND').parent(col3);
  styleLabel(l6);
  selectBg = createSelect().parent(col3);
  styleSelect(selectBg);
  selectBg.option('Black', 'black');
  selectBg.option('White', 'white');
  selectBg.option('Transparent', 'transparent');
  selectBg.selected('black');
  
  let l7 = createSpan('SPEED').parent(col3);
  styleLabel(l7);
  sliderSpeed = createSlider(0, 1, 0.4, 0.01).parent(col3); 
  styleSlider(sliderSpeed);
  
  btnExport = createButton('DOWNLOAD GIF');
  btnExport.parent(col3);
  styleExportButton(btnExport);
  btnExport.mousePressed(startExport);
}

function addOptions(sel) {
  sel.option('Circle', 0);
  sel.option('Square', 1);
  sel.option('Triangle', 2);
  sel.option('Pentagon', 3);
  sel.option('Hexagon', 4);
  sel.option('Star', 5);
  sel.option('Flower', 6);
  sel.option('Heart', 7);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// --- INLINE STYLING FUNCTIONS ---

function stylePanel(el) {
  Object.assign(el.elt.style, {
    position: 'fixed',
    bottom: '30px',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    gap: '25px',
    padding: '20px 30px',
    background: 'rgba(20, 20, 30, 0.65)',
    backdropFilter: 'blur(25px)',
    webkitBackdropFilter: 'blur(25px)',
    borderRadius: '20px',
    border: '1px solid rgba(255,255,255,0.15)',
    boxShadow: '0 15px 40px rgba(0,0,0,0.4)',
    alignItems: 'flex-end',
    zIndex: '1000'
  });
}

function styleColumn(el) {
  Object.assign(el.elt.style, {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  });
}

function styleLabel(el) {
  Object.assign(el.elt.style, {
    fontSize: '10px',
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '700',
    letterSpacing: '0.5px',
    marginLeft: '2px',
    display: 'block'
  });
}

function styleSelect(el) {
  Object.assign(el.elt.style, {
    background: 'rgba(255,255,255,0.1)',
    border: 'none',
    color: 'white',
    padding: '6px 10px',
    borderRadius: '8px',
    fontSize: '13px',
    cursor: 'pointer',
    width: '130px'
  });
}

function stylePicker(el) {
  Object.assign(el.elt.style, {
    border: 'none',
    background: 'none',
    width: '62px',
    height: '30px',
    cursor: 'pointer'
  });
}

function styleSlider(el) {
  Object.assign(el.elt.style, {
    width: '140px',
    accentColor: '#007AFF',
    marginTop: '5px',
    cursor: 'grab'
  });
}

function styleUploadButton(el) {
  // Styles for the file input wrapper
  Object.assign(el.elt.style, {
    fontSize: '11px',
    color: 'white',
    background: 'rgba(255,255,255,0.1)',
    border: '1px dashed rgba(255,255,255,0.3)',
    padding: '8px 12px',
    borderRadius: '8px',
    cursor: 'pointer',
    textAlign: 'center',
    marginTop: '8px',
    width: '130px', // Matches selects
    boxSizing: 'border-box'
  });

  // Hover effect using events
  el.elt.addEventListener('mouseenter', () => {
    el.elt.style.background = 'rgba(255,255,255,0.15)';
  });
  el.elt.addEventListener('mouseleave', () => {
    el.elt.style.background = 'rgba(255,255,255,0.1)';
  });
}

function styleExportButton(el) {
  Object.assign(el.elt.style, {
    background: 'linear-gradient(135deg, #007AFF, #5AC8FA)',
    border: 'none',
    padding: '12px 20px',
    borderRadius: '10px',
    color: 'white',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '12px',
    boxShadow: '0 4px 15px rgba(0,122,255,0.3)',
    height: '40px',
    marginTop: 'auto',
    transition: 'transform 0.1s, filter 0.2s'
  });

  // Hover and Active states
  el.elt.addEventListener('mouseenter', () => {
    el.elt.style.filter = 'brightness(1.2)';
    el.elt.style.transform = 'translateY(-1px)';
  });
  
  el.elt.addEventListener('mouseleave', () => {
    el.elt.style.filter = 'brightness(1.0)';
    el.elt.style.transform = 'none';
  });
  
  el.elt.addEventListener('mousedown', () => {
    el.elt.style.transform = 'scale(0.98)';
  });
  
  el.elt.addEventListener('mouseup', () => {
    el.elt.style.transform = 'translateY(-1px)';
  });
}