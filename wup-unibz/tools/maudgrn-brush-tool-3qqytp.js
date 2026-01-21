// WUP 2025/26
// Maud Grünewald

// --- global settings ---
let artLayer;
let sidebarWidth = 260; 
let zoomScale = 0.8; 
let offsetX = 0, offsetY = 0;
let uiLoaded = false;

// professional color palette
const THEME = {
  bg: '#f8f9fa',       
  sidebar: '#ffffff',  
  accent: '#c62828',   
  text: '#37474f',     
  muted: '#90a4ae',    
  font: 'helvetica, arial, sans-serif'
};

// symmetry data
let symmetryCenters = []; 
let activeGridLabel = ""; 
let isPlacingCenter = false, isLinked = true, isClipped = true, isGridSnap = true;   
let showGuides = true, isErasing = false, isDrawing = false;
let isPreviewOnly = false, history = [], gridSpacing = 50;    

let artX, artY, prevArtX, prevArtY;
let presetButtons = {}; 

// --- system functions ---

function saveState() {
  let snap = createGraphics(artLayer.width, artLayer.height);
  snap.image(artLayer, 0, 0);
  history.push(snap);
  if (history.length > 30) history.shift();
}

function undoLast() {
  if (history.length > 1) {
    history.pop(); 
    let prevState = history[history.length - 1]; 
    artLayer.clear();
    artLayer.image(prevState, 0, 0);
  }
}

function resetApp() {
  artLayer.clear();
  symmetryCenters = [];
  activeGridLabel = "";
  zoomScale = 0.8;
  offsetX = 0;
  offsetY = 0;
  history = [];
  saveState();
}

function resetView() {
  zoomScale = 0.8;
  offsetX = 0;
  offsetY = 0;
}

function exportImage() {
  let out = createGraphics(artLayer.width, artLayer.height);
  out.background(bgPicker.color());
  out.image(artLayer, 0, 0);
  out.save('pattern.png');
}

// --- setup and ui ---

function setup() {
  createCanvas(windowWidth, windowHeight);
  artLayer = createGraphics(1000, 1000);
  artLayer.clear();
  saveState(); 

  let themeStyles = createElement('style', `
    input[type=range] { -webkit-appearance: none; background: transparent; margin: 8px 0; width: 100%; }
    input[type=range]::-webkit-slider-runnable-track { width: 100%; height: 2px; background: #e0e0e0; }
    input[type=range]::-webkit-slider-thumb { 
      height: 12px; width: 12px; border-radius: 50%; 
      background: ${THEME.accent}; -webkit-appearance: none; margin-top: -5px; 
    }
    .sb-section { margin-bottom: 35px; }
    .sb-row { display: flex; gap: 6px; width: 100%; margin-bottom: 6px; }
  `);
  
  let sidebar = createDiv().size(sidebarWidth, height).position(0,0);
  sidebar.style('background', THEME.sidebar).style('padding', '25px').style('box-sizing', 'border-box').style('display','flex').style('flex-direction', 'column').style('z-index', '9999').style('border-right', '1px solid #eceff1').style('overflow', 'hidden');

  const createHeader = (parent, txt) => createElement('div', txt.toLowerCase()).parent(parent).style('font-family', THEME.font).style('font-weight', 'bold').style('font-size', '11px').style('color', THEME.text).style('margin-bottom', '12px').style('letter-spacing', '0.8px');
  
  const createSubLabel = (parent, txt, extraSpace = false) => {
    let lbl = createElement('div', txt.toLowerCase()).parent(parent);
    lbl.style('font-family', THEME.font).style('font-size', '9px').style('color', THEME.muted).style('margin-bottom', '2px');
    if (extraSpace) lbl.style('margin-top', '20px');
    return lbl;
  };

  // section 1: workspace colors
  let s1 = createDiv().parent(sidebar).addClass('sb-section');
  createHeader(s1, "workspace");
  let colorRow = createDiv().parent(s1).addClass('sb-row');
  let paperBox = createDiv().parent(colorRow).style('flex','1');
  createSubLabel(paperBox, "paper");
  bgPicker = createColorPicker('#ffffff').parent(paperBox).style('width','100%').style('height','24px').style('border','1px solid #eee');
  let inkBox = createDiv().parent(colorRow).style('flex','1');
  createSubLabel(inkBox, "ink");
  colorPicker = createColorPicker('#000000').parent(inkBox).style('width','100%').style('height','24px').style('border','1px solid #eee');

  // section 2: tools
  let s2 = createDiv().parent(sidebar).addClass('sb-section');
  createHeader(s2, "drawing tools");
  let toolRow = createDiv().parent(s2).addClass('sb-row');
  btnBrush = createButton('brush').parent(toolRow).style('flex','1').mousePressed(() => isErasing = false);
  btnEraser = createButton('eraser').parent(toolRow).style('flex','1').mousePressed(() => isErasing = true);
  btnPreview = createButton('view').parent(toolRow).style('flex','1').mousePressed(() => isPreviewOnly = !isPreviewOnly);
  createSubLabel(s2, "brush size", true);
  brushSlider = createSlider(1, 100, 5, 5).parent(s2);

  // section 3: grid layout
  let s3 = createDiv().parent(sidebar).addClass('sb-section');
  createHeader(s3, "grid layout");
  let gridRow = createDiv().parent(s3).addClass('sb-row');
  ['2x2','3x3','4x4','5x5'].forEach(label => {
    let btn = createButton(label).parent(gridRow).style('flex','1').mousePressed(() => { generateGrid(parseInt(label[0]), parseInt(label[0])); activeGridLabel = label; });
    presetButtons[label] = btn;
  });
  let gridCtls = createDiv().parent(s3).addClass('sb-row').style('margin-top','6px');
  btnAddCenter = createButton('add center').parent(gridCtls).style('flex','1').mousePressed(() => { isPlacingCenter = true; activeGridLabel = ""; });
  btnSnap = createButton('snap grid').parent(gridCtls).style('flex','1').mousePressed(() => isGridSnap = !isGridSnap);

  // section 4: symmetry & tiling
  let s4 = createDiv().parent(sidebar).addClass('sb-section');
  createHeader(s4, "symmetry & tiling");
  let symRow = createDiv().parent(s4).addClass('sb-row');
  btnLink = createButton('link all').parent(symRow).style('flex','1').mousePressed(() => isLinked = !isLinked);
  btnClip = createButton('box clip').parent(symRow).style('flex','1').mousePressed(() => isClipped = !isClipped);
  
  createSubLabel(s4, "radial slices", true);
  symSlider = createSlider(1, 32, 8, 1).parent(s4);
  createSubLabel(s4, "clip box size", true);
  boxSizeSlider = createSlider(50, 1000, 300, 50).parent(s4);

  // section 5: system
  let s5 = createDiv().parent(sidebar).addClass('sb-section').style('margin-top','auto');
  createHeader(s5, "system");
  let sysRow1 = createDiv().parent(s5).addClass('sb-row');
  createButton('undo').parent(sysRow1).style('flex','1').mousePressed(undoLast);
  createButton('clear').parent(sysRow1).style('flex','1').mousePressed(resetApp);
  
  let sysRow2 = createDiv().parent(s5).addClass('sb-row').style('margin-top','4px');
  createButton('reset view').parent(sysRow2).style('flex','1').mousePressed(resetView);
  createButton('save png').parent(sysRow2).style('flex','1').mousePressed(exportImage);

  selectAll('button').forEach(b => {
    b.style('font-family', THEME.font).style('font-size', '10px').style('cursor', 'pointer').style('padding', '6px').style('border', '1px solid #eee').style('background', '#fff').style('color', THEME.text).style('border-radius','3px').style('text-transform', 'lowercase');
  });

  uiLoaded = true;
}

// --- draw loop ---

function draw() {
  if (!uiLoaded) return;
  background(THEME.bg); 
  
  updateCoordinates();
  updateUIStyles();

  // dynamic centering math
  let workW = width - sidebarWidth;
  let workH = height;
  let centerX = sidebarWidth + (workW - artLayer.width * zoomScale) / 2;
  let centerY = (workH - artLayer.height * zoomScale) / 2;

  push();
  translate(centerX + offsetX, centerY + offsetY);
  scale(zoomScale);
  
  // artboard drop shadow and surface
  noStroke(); 
  fill(0, 10); rect(4/zoomScale, 4/zoomScale, artLayer.width, artLayer.height, 2); 
  fill(bgPicker.color()); rect(0, 0, artLayer.width, artLayer.height, 2); 
  
  if (!isPreviewOnly) {
    if (showGuides) drawDraftingGrid();
    drawVisualGuides(); 
    if (isPlacingCenter && mouseX > sidebarWidth) {
      fill(THEME.accent + "44"); noStroke();
      ellipse(artX, artY, 10/zoomScale);
    }
  }
  
  image(artLayer, 0, 0);
  pop();

  if (isPlacingCenter) {
    if (mouseIsPressed && mouseX > sidebarWidth) {
       symmetryCenters.push({x: artX, y: artY});
       isPlacingCenter = false;
    }
  } else if (mouseIsPressed && mouseX > sidebarWidth) {
    handleDrawing();
  }
  
  prevArtX = artX; prevArtY = artY;
}

// --- core logic ---

function handleDrawing() {
  if (!isDrawing) { isDrawing = true; saveState(); prevArtX = artX; prevArtY = artY; }
  let bSz = floor(boxSizeSlider.value());
  let centers = (symmetryCenters.length > 0) ? symmetryCenters : [{x: artLayer.width/2, y: artLayer.height/2}];
  
  let nearestC = centers[0];
  let minDist = dist(artX, artY, centers[0].x, centers[0].y);
  for(let i = 0; i < centers.length; i++) {
    let d = dist(artX, artY, centers[i].x, centers[i].y);
    if(d < minDist) { minDist = d; nearestC = centers[i]; }
  }
  let relX = artX - nearestC.x; let relY = artY - nearestC.y;
  let relPrevX = prevArtX - nearestC.x; let relPrevY = prevArtY - nearestC.y;

  for (let i = 0; i < centers.length; i++) {
    let target = centers[i];
    if (!isLinked && target !== nearestC) continue;
    artLayer.drawingContext.save(); 
    if (isClipped) {
      artLayer.drawingContext.beginPath();
      artLayer.drawingContext.rect(floor(target.x - bSz/2), floor(target.y - bSz/2), bSz, bSz);
      artLayer.drawingContext.clip();
    }
    artLayer.push();
    if (isErasing) artLayer.erase();
    else artLayer.stroke(colorPicker.color());
    artLayer.strokeWeight(brushSlider.value());
    renderRadial(relX + target.x, relY + target.y, relPrevX + target.x, relPrevY + target.y, target.x, target.y);
    artLayer.noErase(); artLayer.pop();
    artLayer.drawingContext.restore();
  }
}

function renderRadial(x, y, px, py, cx, cy) {
  let segments = symSlider.value();
  for (let i = 0; i < segments; i++) {
    let angle = (TWO_PI / segments) * i;
    artLayer.push(); artLayer.translate(cx, cy); artLayer.rotate(angle);
    artLayer.line(px - cx, py - cy, x - cx, y - cy);
    artLayer.pop();
  }
}

// --- visual guide logic ---

function drawVisualGuides() {
  let centers = (symmetryCenters.length > 0) ? symmetryCenters : [{x: artLayer.width/2, y: artLayer.height/2}];
  let bSz = floor(boxSizeSlider.value());
  let bg = bgPicker.color();
  let bright = (red(bg) * 299 + green(bg) * 587 + blue(bg) * 114) / 1000;
  let mainCol = bright > 125 ? 50 : 220; 
  let haloCol = bright > 125 ? 255 : 0;  
  
  rectMode(CENTER);
  for (let i = 0; i < centers.length; i++) {
    let c = centers[i];
    if (isClipped) { 
      stroke(haloCol, 40); strokeWeight(3/zoomScale); noFill(); rect(c.x, c.y, bSz, bSz);
      stroke(mainCol, 60); strokeWeight(1/zoomScale); rect(c.x, c.y, bSz, bSz);
    }
    if (symSlider.value() > 1) {
      push(); translate(c.x, c.y);
      for (let j = 0; j < symSlider.value(); j++) { 
        rotate(TWO_PI/symSlider.value()); 
        stroke(mainCol, 30); strokeWeight(0.5/zoomScale); line(0, 0, 0, -2000);
      }
      pop();
    }
  }
  fill(THEME.accent); noStroke(); 
  for (let k = 0; k < symmetryCenters.length; k++) {
    ellipse(symmetryCenters[k].x, symmetryCenters[k].y, 6/zoomScale);
  }
}

// --- utilities ---

function updateUIStyles() {
  const styleBtn = (btn, active) => {
    if(!btn) return;
    btn.style('background', active ? THEME.accent : '#ffffff');
    btn.style('color', active ? '#ffffff' : THEME.text);
    btn.style('border-color', active ? THEME.accent : '#eee');
  };
  styleBtn(btnBrush, !isErasing);
  styleBtn(btnEraser, isErasing);
  styleBtn(btnLink, isLinked);
  styleBtn(btnClip, isClipped);
  styleBtn(btnAddCenter, isPlacingCenter);
  styleBtn(btnSnap, isGridSnap);
  styleBtn(btnPreview, isPreviewOnly);
  ['2x2','3x3','4x4','5x5'].forEach(label => { styleBtn(presetButtons[label], activeGridLabel === label); });
  if(!mouseIsPressed) isDrawing = false;
}

function updateCoordinates() {
  let workW = width - sidebarWidth; let workH = height;
  let centerX = sidebarWidth + (workW - artLayer.width * zoomScale) / 2;
  let centerY = (workH - artLayer.height * zoomScale) / 2;
  artX = (mouseX - (centerX + offsetX)) / zoomScale;
  artY = (mouseY - (centerY + offsetY)) / zoomScale;
  if (isGridSnap && isPlacingCenter) {
    artX = Math.round(artX / gridSpacing) * gridSpacing;
    artY = Math.round(artY / gridSpacing) * gridSpacing;
  }
}

function generateGrid(r, c) { symmetryCenters = []; for (let i = 1; i <= r; i++) for (let j = 1; j <= c; j++) symmetryCenters.push({ x: (artLayer.width/(c+1))*j, y: (artLayer.height/(r+1))*i }); }
function drawDraftingGrid() { stroke(200, 50); strokeWeight(0.5/zoomScale); for (let x = 0; x <= artLayer.width; x += gridSpacing) line(x, 0, x, artLayer.height); for (let y = 0; y <= artLayer.height; y += gridSpacing) line(0, y, artLayer.width, y); }
function mouseWheel(event) { if (mouseX > sidebarWidth) { zoomScale = constrain(zoomScale - event.delta * 0.005, 0.02, 20.0); return false; } }
function windowResized() { resizeCanvas(windowWidth, windowHeight); }