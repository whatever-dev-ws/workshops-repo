let cols = 4;
let rows = 4;
let baseSeed = 0;

// --- APP STATE ---
let appMode = 'START'; // 'START' or 'APP'
let startScreenDiv;

// --- TIMING VARIABLES ---
let framesPerPoster = 60;
let savePending = false;

// --- EXPORT STATE VARIABLES ---
let isExporting = false;
let exportStartFrame = 0;
let maxAllowedIndex = 0;

// UI Variables
let xpWindow;
let orientSelector, sizeSelector, gridSelector, textInput, colorSelector, orderSelector;
let framesInput, durationInput, presetSelector;
let widthInput, heightInput; 
let customSizeGroup;
let centerCheck; 
let saveButton;
let fontInput; // NEW: Font Input

// --- FONT STATE ---
let currentFont = 'Helvetica'; // Default font string
let customFontObject = null;   // To store uploaded p5 font

// Custom Color Variables
let customColorGroup;
let cp1, cp2, cp3;

// --- PRESET DATA ---
const PRESETS = [
  { name: "Default (Balanced)", view: 60, total: 120 },
  { name: "Social Short (Loop)", view: 60, total: 60 },
  { name: "Hyper Speed (Fast)", view: 10, total: 60 },
  { name: "Slow Gallery", view: 120, total: 360 },
  { name: "Strobe Effect", view: 2, total: 60 },
  { name: "Long Compilation", view: 90, total: 900 },
  { name: "Quick Glitch", view: 5, total: 30 }
];

function setup() {
  createCanvas(windowWidth, windowHeight);
  noStroke();
  frameRate(30);
  pixelDensity(1);

  baseSeed = int(random(10000));

  createXPInterface();
  createStartScreen();
  
  // Initially hide XP window, show start screen
  xpWindow.style('display', 'none');
  
  toggleCustomPalette();
  toggleCustomSize();
  
  updateGridSettings(); 
}

function windowResized() {
  if (appMode === 'START') {
    resizeCanvas(windowWidth, windowHeight);
  }
}

function draw() {
  if (appMode === 'START') {
    drawStartBackground();
  } else {
    drawApp();
  }
}

// --- START SCREEN LOGIC ---
function drawStartBackground() {
  background(20); 
  
  let autoSpeed = 45; 
  let currentPosterIndex = floor(frameCount / autoSpeed);
  let currentSeed = baseSeed + (currentPosterIndex * 99999);
  randomSeed(currentSeed);

  let bgText = "POSTER MAKER CREATIVE STUDIO";
  let bgWords = bgText.split(" ");
  
  let palettes = ['Bauhaus', 'Swiss Red', 'Deep Ocean', 'Retro 70s', 'Industrial'];
  let pName = palettes[currentPosterIndex % palettes.length];
  let palette = getPalette(pName);

  // Store original app state
  let originalCols = cols;
  let originalRows = rows;

  // --- DYNAMIC GRID CALCULATION (FIXES STRETCHING) ---
  // Ensure cells remain roughly square regardless of aspect ratio
  let shortestSide = min(width, height);
  // Divide shortest side by 6 to get a target cell size
  let targetCellSize = shortestSide / 6; 
  
  cols = round(width / targetCellSize);
  rows = round(height / targetCellSize);
  
  // Safety check: ensure at least 2x2
  cols = max(2, cols);
  rows = max(2, rows);
  
  // Start screen always uses full grid (forceCenter=false, forceRandom=true, whiteText=true)
  drawPosterContent(bgWords, palette, true, true, false); 
  
  // Restore original app state so the editor isn't affected
  cols = originalCols;
  rows = originalRows;

  // Vignette overlay
  fill(0, 0, 0, 100);
  rect(0,0,width,height);
}

function createStartScreen() {
  startScreenDiv = createDiv();
  startScreenDiv.position(0, 0);
  startScreenDiv.style('width', '100%');
  startScreenDiv.style('height', '100%');
  startScreenDiv.style('display', 'flex');
  startScreenDiv.style('flex-direction', 'column');
  startScreenDiv.style('justify-content', 'center');
  startScreenDiv.style('align-items', 'center');
  startScreenDiv.style('z-index', '1000');
  
  let btn = createButton('START CREATING');
  btn.parent(startScreenDiv);
  btn.style('padding', '20px 40px');
  btn.style('font-size', '18px');
  btn.style('font-family', 'Helvetica, Arial, sans-serif');
  btn.style('font-weight', 'bold');
  btn.style('cursor', 'pointer');
  btn.style('background', 'white');
  btn.style('color', 'black');
  btn.style('border', 'none');
  btn.style('box-shadow', '0px 10px 30px rgba(0,0,0,0.5)');
  btn.style('border-radius', '50px');
  btn.style('transition', 'transform 0.1s ease');
  
  btn.mouseOver(() => {
    btn.style('transform', 'scale(1.1)');
  });
  btn.mouseOut(() => {
    btn.style('transform', 'scale(1.0)');
  });
  
  btn.mousePressed(() => {
    appMode = 'APP';
    startScreenDiv.style('display', 'none');
    xpWindow.style('display', 'block');
    applyPreset();
    updateCanvasSize(); 
    frameCount = 0; 
  });
}

// --- MAIN APP LOGIC ---
function drawApp() {
  background(240, 240, 235);
  
  if (!isExporting && durationInput) {
    let val = int(durationInput.value());
    if (val > 0) framesPerPoster = val;
  }
  
  let currentPosterIndex = 0;

  if (isExporting) {
    let relativeFrame = frameCount - exportStartFrame;
    let calculatedIndex = floor(relativeFrame / framesPerPoster);
    
    if (calculatedIndex > maxAllowedIndex) {
      currentPosterIndex = maxAllowedIndex;
    } else {
      currentPosterIndex = calculatedIndex;
    }
  } else {
    currentPosterIndex = floor((frameCount - 1) / framesPerPoster);
  }
  
  let currentSeed = baseSeed + (currentPosterIndex * 99999);
  randomSeed(currentSeed);
  
  handleExportLogic();
  
  let fullText = textInput.value();
  let words = fullText.split(/[\s\n]+/).filter(w => w.length > 0);
  let paletteName = colorSelector.value();
  let palette = getPalette(paletteName);

  // Use checkbox value for centering
  let isCentered = centerCheck.checked();
  drawPosterContent(words, palette, false, false, isCentered);
}

function drawPosterContent(words, palette, forceRandom, useWhiteText, forceCenter) {
  let totalCells = cols * rows;
  let baseShapeChance = 0.3; 
  
  if (words.length > totalCells * 0.3) baseShapeChance = 0.2; 
  if (words.length > totalCells * 0.5) baseShapeChance = 0.15; 

  let cellW = width / cols;
  let cellH = height / rows;
  let emptyCells = [];

  // --- CALCULATE CENTER ZONE ---
  let padX = floor(cols / 4);
  let padY = floor(rows / 4);
  if (padX < 1 && cols > 2) padX = 1; 
  if (padY < 1 && rows > 2) padY = 1;

  // 1. Draw Grid & Shapes
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      let xPos = x * cellW;
      let yPos = y * cellH;
      
      let inCenterX = (x >= padX && x < cols - padX);
      let inCenterY = (y >= padY && y < rows - padY);
      let isCenter = (inCenterX && inCenterY);
      
      let shouldDrawShape = false;

      if (forceCenter) {
        // Centered Mode: Shapes OUTSIDE, Text INSIDE
        if (!isCenter && random() < baseShapeChance) {
          shouldDrawShape = true;
        }
      } else {
        // Normal Mode: Shapes anywhere
        if (random() < baseShapeChance) {
          shouldDrawShape = true;
        }
      }

      if (shouldDrawShape) {
        fill(random(palette));
        let shapeType = floor(random(3));
        
        if (shapeType === 0) {
            rect(xPos, yPos, cellW, cellH);
        }
        else if (shapeType === 1) { 
            // Ellipse (Fixed to fit box)
            ellipseMode(CORNER); 
            ellipse(xPos, yPos, cellW, cellH); 
        } 
        else if (shapeType === 2) {
            triangle(xPos, yPos, xPos + cellW, yPos, xPos, yPos + cellH);
        }
      } else {
        // Cell is empty
        let cellData = {x: xPos, y: yPos, w: cellW, h: cellH, col: x, row: y, isCenter: isCenter};
        emptyCells.push(cellData);
      }
    }
  }
  
  // 2. Filter Cells for Text
  let cellsForText = emptyCells;
  
  if (forceCenter) {
    // If Centered Mode: Text ONLY goes into center cells
    cellsForText = emptyCells.filter(c => c.isCenter);
  }

  // 3. Draw Text
  let useChronological = false;
  if (!forceRandom && orderSelector && orderSelector.value() === 'Chronological') {
    useChronological = true;
  }
  
  // Pass forceCenter to control repetition behavior
  drawTextInEmptyCells(words, cellsForText, cellW, useChronological, useWhiteText, forceCenter);
}

function handleExportLogic() {
  if (savePending && (frameCount - 1) % framesPerPoster === 0) {
      let fps = 30; 
      let framesToSave = int(framesInput.value());
      let filename = `poster_${sizeSelector.value()}_${orientSelector.value()}`;
      let gifDelay = 1000 / fps;

      isExporting = true;
      exportStartFrame = frameCount;
      
      let totalPosters = Math.ceil(framesToSave / framesPerPoster);
      maxAllowedIndex = totalPosters - 1;

      saveGif(filename, framesToSave, { 
        units: 'frames', 
        quality: 1,
        delay: gifDelay 
      });
      
      savePending = false;
      saveButton.html('Saving...');
      
      let approximateTime = (framesToSave / 30) * 1000;
      setTimeout(() => {
        saveButton.html('Export GIF');
        isExporting = false; 
      }, approximateTime + 2000);
  }
}

// --- HELPER FUNCTIONS ---

function updateGridSettings() {
  let val = gridSelector.value();
  
  if (val.includes('2x2')) { cols = 2; rows = 2; }
  else if (val.includes('4x4')) { cols = 4; rows = 4; }
  else if (val.includes('6x6')) { cols = 6; rows = 6; }
  else if (val.includes('8x8')) { cols = 8; rows = 8; }
  else if (val.includes('12x12')) { cols = 12; rows = 12; }
}

function getPalette(name) {
  if (name === 'Custom') {
    return [cp1.color(), cp2.color(), cp3.color()];
  }
  if (name === 'Bauhaus') return [color(0, 50, 200), color(255, 100, 0), color(20)];
  if (name === 'Swiss Red') return [color(220, 20, 20), color(20), color(40)];
  if (name === 'Deep Ocean') return [color(10, 25, 60), color(0, 100, 110), color(180, 170, 140)];
  if (name === 'Retro 70s') return [color(204, 153, 0), color(85, 107, 47), color(120, 60, 20)];
  if (name === 'Industrial') return [color(40), color(150), color(255, 69, 0)];
  
  return [color(0)];
}

// NEW: Added isCenteredParam to control repetition
function drawTextInEmptyCells(words, emptyCells, cellW, isChronological, useWhiteText, isCenteredParam) {
  if (words.length === 0 || emptyCells.length === 0) return;

  // --- TEXT COLOR ---
  if (useWhiteText) fill(240); 
  else fill(20);
  
  textAlign(CENTER, CENTER);
  
  // NEW: Use Custom Font if loaded
  if (customFontObject) {
    textFont(customFontObject);
  } else {
    textFont(currentFont);
  }
  
  textStyle(BOLD);

  // --- STEP 1: ASSIGN WORDS TO CELLS ---
  let assignments = [];

  // Logic: If Centered (isCenteredParam is true), we do NOT repeat words.
  // We limit the loops to Math.min(words.length, cells.length).

  if (isChronological) {
    emptyCells.sort((a, b) => {
      if (a.y !== b.y) return a.y - b.y;
      return a.x - b.x;
    });
    
    // If Center mode, stop when words run out. If not, loop.
    let loopLimit = isCenteredParam ? Math.min(emptyCells.length, words.length) : emptyCells.length;

    let wordIndex = 0;
    for (let i = 0; i < loopLimit; i++) {
      let wordToUse = words[wordIndex % words.length];
      assignments.push({
        word: wordToUse,
        cell: emptyCells[i]
      });
      wordIndex++;
    }

  } else {
    // Random Order
    let contentQueue = [...words];
    
    if (!isCenteredParam) {
        // Only refill queue with duplicates if NOT in center mode
        let remainingSlots = emptyCells.length - contentQueue.length;
        if (remainingSlots > 0) {
          for(let i=0; i<remainingSlots; i++){
            if (random() < 0.4) contentQueue.push(random(words));
          }
        }
    }
    
    shuffle(emptyCells, true);
    
    // Determine how many cells to fill
    let loopLimit = isCenteredParam ? Math.min(emptyCells.length, contentQueue.length) : emptyCells.length;

    for (let i = 0; i < loopLimit; i++) {
      if (i < contentQueue.length) {
        assignments.push({
          word: contentQueue[i],
          cell: emptyCells[i]
        });
      }
    }
  }

  // --- STEP 2: CALCULATE MINIMUM COMMON FONT SIZE ---
  let commonSize = cellW * 0.25; 
  
  for (let item of assignments) {
    let wordStr = item.word;
    let targetW = item.cell.w * 0.9; 
    
    textSize(commonSize);
    let currentW = textWidth(wordStr);
    
    if (currentW > targetW) {
      let ratio = targetW / currentW;
      commonSize = commonSize * ratio; 
    }
  }

  // --- STEP 3: DRAW EVERYTHING AT COMMON SIZE ---
  textSize(commonSize);
  
  for (let item of assignments) {
    text(item.word, item.cell.x + item.cell.w/2, item.cell.y + item.cell.h/2);
  }
}

function updateCanvasSize() {
  if (appMode !== 'APP') return;

  let orient = orientSelector.value();
  let sizeLabel = sizeSelector.value();
  
  let w = 400; 
  let h = 500;
  
  if (sizeLabel === 'Custom') {
    let custW = int(widthInput.value());
    let custH = int(heightInput.value());
    if (custW < 50) custW = 50;
    if (custH < 50) custH = 50;
    w = custW;
    h = custH;
  } else {
    let multiplier = 1;
    if (sizeLabel === 'Tiny') multiplier = 0.5;
    if (sizeLabel === 'Regular') multiplier = 1.0;
    if (sizeLabel === 'Big') multiplier = 1.5;
    if (sizeLabel === 'Huge') multiplier = 2.0;
    
    w = 400 * multiplier;
    h = 500 * multiplier;
  }
  
  if (orient === 'Horizontal') { 
    let temp = w; w = h; h = temp; 
  }
  
  resizeCanvas(w, h);
  
  if (xpWindow) {
    xpWindow.position(w + 20, 20);
  }
}

function requestSave() {
  savePending = true;
  saveButton.html('Syncing (Wait)...');
}

function applyPreset() {
  let selectedName = presetSelector.value();
  let p = PRESETS.find(obj => obj.name === selectedName);
  
  if (p) {
    durationInput.value(p.view);
    framesInput.value(p.total);
    framesPerPoster = p.view; 
  }
}

function toggleCustomPalette() {
  if (colorSelector.value() === 'Custom') {
    customColorGroup.style('display', 'block');
  } else {
    customColorGroup.style('display', 'none');
  }
}

function toggleCustomSize() {
  if (sizeSelector.value() === 'Custom') {
    customSizeGroup.style('display', 'block');
  } else {
    customSizeGroup.style('display', 'none');
  }
}

// NEW: Font Handler
function handleFontFile(file) {
  if (file.subtype === 'ttf' || file.subtype === 'otf' || file.name.endsWith('.ttf') || file.name.endsWith('.otf')) {
    customFontObject = loadFont(file.data, () => {
       console.log("Font loaded successfully!");
    });
  } else {
    console.log("Not a font file!");
  }
}

// --- XP INTERFACE CONSTRUCTION ---
function createXPInterface() {
  xpWindow = createDiv();
  xpWindow.position(0, 0); 
  xpWindow.style('width', '200px');
  xpWindow.style('background-color', '#ECE9D8'); 
  xpWindow.style('border', '1px solid #0054E3'); 
  xpWindow.style('border-radius', '3px 3px 0 0');
  xpWindow.style('box-shadow', '2px 2px 5px rgba(0,0,0,0.3)');
  xpWindow.style('font-family', 'Tahoma, sans-serif');
  
  let titleBar = createDiv('Generator');
  titleBar.parent(xpWindow);
  titleBar.style('background', 'linear-gradient(to bottom, #0058EE 0%, #3593FF 4%, #288EFF 18%, #127DFF 100%)');
  titleBar.style('color', 'white');
  titleBar.style('padding', '4px 8px');
  titleBar.style('font-weight', 'bold');
  titleBar.style('font-size', '13px');
  titleBar.style('text-shadow', '1px 1px #0f1089');
  
  let content = createDiv();
  content.parent(xpWindow);
  content.style('padding', '10px');
  
  // --- TEXT AREA ---
  createDiv('Poster Text:').parent(content).style('font-size', '11px').style('margin-bottom', '2px');
  textInput = createElement('textarea', 'DESIGN IS FUN'); 
  textInput.parent(content);
  textInput.style('width', '94%'); 
  textInput.style('height', '50px'); 
  textInput.style('margin-bottom', '10px');
  textInput.style('border', '1px solid #7F9DB9'); 
  textInput.style('font-family', 'sans-serif');
  textInput.style('resize', 'vertical'); 

  // --- ORDER & CENTER ROW ---
  createDiv('Text Layout:').parent(content).style('font-size', '11px').style('margin-bottom', '2px');
  
  orderSelector = createSelect();
  orderSelector.parent(content);
  orderSelector.style('width', '100%');
  orderSelector.style('margin-bottom', '5px');
  orderSelector.option('Random');
  orderSelector.option('Chronological');

  // CENTER TEXT CHECKBOX
  centerCheck = createCheckbox(' Center Text Only', false);
  centerCheck.parent(content);
  centerCheck.style('font-size', '11px');
  centerCheck.style('margin-bottom', '10px');
  
  // NEW: FONT UPLOAD
  createDiv('Custom Font (.ttf/.otf):').parent(content).style('font-size', '11px').style('margin-bottom', '2px');
  fontInput = createFileInput(handleFontFile);
  fontInput.parent(content);
  fontInput.style('width', '100%');
  fontInput.style('margin-bottom', '15px');
  fontInput.style('font-size', '10px');

  // --- PRESET SELECTOR ---
  createDiv('Timing Presets:').parent(content).style('font-size', '11px').style('margin-bottom', '2px');
  presetSelector = createSelect();
  presetSelector.parent(content);
  presetSelector.style('width', '100%');
  presetSelector.style('margin-bottom', '10px');
  
  for(let p of PRESETS) {
    presetSelector.option(p.name);
  }
  presetSelector.changed(applyPreset);

  // --- MANUAL INPUTS ---
  createDiv('Poster viewtime (frames):').parent(content).style('font-size', '11px').style('margin-bottom', '2px');
  durationInput = createInput('60', 'number'); 
  durationInput.parent(content);
  durationInput.style('width', '94%'); 
  durationInput.style('margin-bottom', '10px');
  durationInput.style('border', '1px solid #7F9DB9'); 
  
  createDiv('Total Export Frames:').parent(content).style('font-size', '11px').style('margin-bottom', '2px');
  framesInput = createInput('120', 'number');
  framesInput.parent(content);
  framesInput.style('width', '94%');
  framesInput.style('margin-bottom', '10px');
  framesInput.style('border', '1px solid #7F9DB9'); 
  
  // Color Selector
  createDiv('Color Palette:').parent(content).style('font-size', '11px').style('margin-bottom', '2px');
  colorSelector = createSelect();
  colorSelector.parent(content);
  colorSelector.style('width', '100%');
  colorSelector.style('margin-bottom', '10px');
  colorSelector.option('Bauhaus');
  colorSelector.option('Swiss Red');
  colorSelector.option('Deep Ocean');
  colorSelector.option('Retro 70s');
  colorSelector.option('Industrial');
  colorSelector.option('Custom'); 
  
  colorSelector.selected('Custom');
  colorSelector.changed(toggleCustomPalette); 

  // Custom Color Interface
  customColorGroup = createDiv();
  customColorGroup.parent(content);
  customColorGroup.style('display', 'block'); 
  customColorGroup.style('margin-bottom', '10px');
  customColorGroup.style('background', '#fff');
  customColorGroup.style('padding', '5px');
  customColorGroup.style('border', '1px solid #ccc');
  
  createDiv('Pick 3 Colors:').parent(customColorGroup).style('font-size','10px').style('margin-bottom','4px');
  
  let pickerRow = createDiv();
  pickerRow.parent(customColorGroup);
  pickerRow.style('display', 'flex');
  pickerRow.style('justify-content', 'space-between');
  
  cp1 = createColorPicker('#D02222'); // Bold Red
  cp1.parent(pickerRow);
  cp1.style('width', '45px');
  cp1.style('height', '25px');
  cp1.style('border', 'none');
  
  cp2 = createColorPicker('#1845A2'); // Bauhaus Blue
  cp2.parent(pickerRow);
  cp2.style('width', '45px');
  cp2.style('height', '25px');
  cp2.style('border', 'none');

  cp3 = createColorPicker('#F2C409'); // Vibrant Yellow
  cp3.parent(pickerRow);
  cp3.style('width', '45px');
  cp3.style('height', '25px');
  cp3.style('border', 'none');

  // GRID SELECTOR
  createDiv('Grid Density:').parent(content).style('font-size', '11px').style('margin-bottom', '2px');
  gridSelector = createSelect();
  gridSelector.parent(content);
  gridSelector.style('width', '100%');
  gridSelector.style('margin-bottom', '10px');
  gridSelector.option('Blocky (2x2)');
  gridSelector.option('Classic (4x4)');
  gridSelector.option('Detailed (6x6)');
  gridSelector.option('Dense (8x8)');
  gridSelector.option('Mosaic (12x12)');
  gridSelector.selected('Classic (4x4)');
  gridSelector.changed(updateGridSettings);

  // Orientation
  createDiv('Orientation:').parent(content).style('font-size', '11px').style('margin-bottom', '2px');
  orientSelector = createSelect();
  orientSelector.parent(content);
  orientSelector.style('width', '100%');
  orientSelector.style('margin-bottom', '10px');
  orientSelector.option('Vertical');
  orientSelector.option('Horizontal');
  orientSelector.changed(updateCanvasSize);

  // Size
  createDiv('Canvas Size:').parent(content).style('font-size', '11px').style('margin-bottom', '2px');
  sizeSelector = createSelect();
  sizeSelector.parent(content);
  sizeSelector.style('width', '100%');
  sizeSelector.style('margin-bottom', '5px');
  sizeSelector.option('Tiny');
  sizeSelector.option('Regular');
  sizeSelector.option('Big');
  sizeSelector.option('Huge');
  sizeSelector.option('Custom');
  sizeSelector.selected('Regular');
  sizeSelector.changed(() => {
    toggleCustomSize();
    updateCanvasSize();
  });

  // Custom Size Inputs
  customSizeGroup = createDiv();
  customSizeGroup.parent(content);
  customSizeGroup.style('display', 'none'); 
  customSizeGroup.style('margin-bottom', '15px');
  customSizeGroup.style('background', '#fff');
  customSizeGroup.style('padding', '5px');
  customSizeGroup.style('border', '1px solid #ccc');
  
  createDiv('Width (px):').parent(customSizeGroup).style('font-size','10px');
  widthInput = createInput('600', 'number');
  widthInput.parent(customSizeGroup);
  widthInput.style('width', '90%');
  widthInput.style('margin-bottom', '5px');
  widthInput.changed(updateCanvasSize);

  createDiv('Height (px):').parent(customSizeGroup).style('font-size','10px');
  heightInput = createInput('800', 'number');
  heightInput.parent(customSizeGroup);
  heightInput.style('width', '90%');
  heightInput.changed(updateCanvasSize);

  // Save Button
  saveButton = createButton('Export GIF');
  saveButton.parent(content);
  saveButton.mousePressed(requestSave);
  
  saveButton.style('width', '100%');
  saveButton.style('padding', '5px');
  saveButton.style('font-family', 'Tahoma');
  saveButton.style('font-size', '12px');
  saveButton.style('cursor', 'pointer');
  saveButton.style('background-color', '#f0f0f0');
  saveButton.style('border', '2px solid');
  saveButton.style('border-color', '#ffffff #808080 #808080 #ffffff'); 
  
  saveButton.mouseOver(() => saveButton.style('background-color', '#f8f8f8'));
  saveButton.mouseOut(() => saveButton.style('background-color', '#f0f0f0'));
}