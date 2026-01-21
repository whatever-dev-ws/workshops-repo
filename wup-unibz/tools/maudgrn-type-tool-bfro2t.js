// WUP 2025/26
// Maud Grünewald

let pg;
let textContent = "click to\ntype";
let isFocused = false, weightIndex = 5, paletteHistory = [], charScales = [];
let fontLocked = false, boxLocked = false, bgLocked  = false;
let isAuto = false, isRecording = false;
let showUI = true;

// --- Colors ---
let c_font, c_box, c_bg;

// --- State Values ---
let val_size = 100, val_line = 1.2, val_char = 0, val_speed = 0.03;
let lastPaletteChange = 0; 

// --- Typographic Smoothing & Bounding Box ---
let currentRadius = 0, targetRadius = 0;
let smoothBoxW = 0, smoothBoxH = 0; // Bounding box for hitbox detection

// --- Layout Constants ---
const SIDEBAR_WIDTH = 250;
const ALIGN_X = 25; 
const ELEMENT_W = 200; 

const Y_START = 55, STEP = 48;   
const y_size = Y_START + 15, y_line = y_size + STEP, y_char = y_line + STEP;
const y_col  = y_char + 65, y_hist = y_col + 85;  
const y_thick = y_hist + 100, y_motion = y_thick + 65, y_speed = y_motion + 42; 
const y_btns = y_speed + 50; 

const WEIGHT_PERCENTS = [-0.22, -0.15, -0.08, -0.04, -0.02, 0, 0.04, 0.10, 0.18, 0.28, 0.40];

function setup() {
  pixelDensity(displayDensity());
  createCanvas(windowWidth, windowHeight);
  pg = createGraphics(windowWidth - SIDEBAR_WIDTH, windowHeight);
  
  c_font = color(255);
  c_box = color(0);
  c_bg = color(245);
  
  saveCurrentToHistory();
  textFont('Helvetica');
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  let targetDesignWidth = showUI ? windowWidth - SIDEBAR_WIDTH : windowWidth;
  pg = createGraphics(targetDesignWidth, windowHeight);
}

function draw() {
  background(30); 

  let targetDesignWidth = showUI ? windowWidth - SIDEBAR_WIDTH : windowWidth;
  if (pg.width !== targetDesignWidth) {
    pg = createGraphics(targetDesignWidth, windowHeight);
  }

  pg.background(c_bg);
  pg.textAlign(CENTER, CENTER); pg.rectMode(CENTER); pg.textFont('Helvetica');

  let lines = textContent.split('\n');
  let maxW = 0; pg.textSize(val_size);
  for (let l of lines) {
    let lW = pg.textWidth(l.toLowerCase()) + (l.length > 0 ? (l.length - 1) * val_char : 0);
    maxW = max(maxW, lW || 1);
  }
  
  let finalFontSize = min(val_size, (pg.width * 0.85 / maxW) * val_size);
  let totalHeight = lines.length * (finalFontSize * val_line);
  if (totalHeight > pg.height * 0.8) finalFontSize *= (pg.height * 0.8 / totalHeight);
  
  if (isAuto) {
    let activeIdx = floor((frameCount * val_speed) % (textContent.length || 1));
    while (charScales.length < textContent.length) charScales.push(1.0);
    for (let i = 0; i < charScales.length; i++) {
      charScales[i] = lerp(charScales[i] || 1.0, (i === activeIdx) ? 1.45 : 1.0, 0.15);
    }
  }

  renderTypography(pg.width/2, pg.height/2, finalFontSize, val_line, val_char * (finalFontSize/val_size));
  
  if (showUI) {
    image(pg, SIDEBAR_WIDTH, 0, pg.width, pg.height);
    drawCanvasSidebar();
    handleContinuousInput();
  } else {
    image(pg, 0, 0, pg.width, pg.height);
  }
  
  handleKeyboardInput();
}

function renderTypography(x, y, fSize, leadingRatio, spacing) { 
  pg.push(); pg.textSize(fSize); pg.strokeJoin(ROUND); pg.strokeCap(ROUND);
  let weightValue = fSize * WEIGHT_PERCENTS[weightIndex]; 
  let lines = textContent.split('\n'), leading = fSize * leadingRatio; 
  let maxW = 0; for (let l of lines) maxW = max(maxW, pg.textWidth(l.toLowerCase()) + (l.length > 1 ? (l.length - 1) * spacing : 0)); 
  let blockH = lines.length * leading; 
  
  smoothBoxW = lerp(smoothBoxW, maxW + (fSize * 1.0), 0.2); 
  smoothBoxH = lerp(smoothBoxH, blockH + (fSize * 0.4), 0.2); 
  
  // Draw the main text box
  pg.noStroke(); pg.fill(c_box); 
  let mx = showUI ? mouseX - SIDEBAR_WIDTH : mouseX; 
  targetRadius = (mx > x - smoothBoxW/2 && mx < x + smoothBoxW/2 && mouseY > y - smoothBoxH/2 && mouseY < y + smoothBoxH/2) ? fSize / 2 : 0; 
  currentRadius = lerp(currentRadius, targetRadius, 0.15); 
  pg.rect(x, y, smoothBoxW, smoothBoxH, currentRadius); 
  
  // NEW: Focus Frame - Only visible when text area is active
  if (isFocused && showUI) {
    pg.noFill();
    pg.stroke(255, 150); // Semi-transparent white
    pg.strokeWeight(1.5);
    pg.rect(x, y, smoothBoxW + 10, smoothBoxH + 10, currentRadius + 5);
  }
  
  let charIdx = 0, startY = y - (blockH / 2) + (leading / 2); 
  for (let j = 0; j < lines.length; j++) { 
    let lineText = lines[j]; let lineW = pg.textWidth(lineText.toLowerCase()) + (lineText.length > 1 ? (lineText.length - 1) * spacing : 0); let runningX = x - (lineW / 2); 
    for (let k = 0; k < lineText.length; k++) { 
      let char = lineText[k]; let charW = pg.textWidth(char.toLowerCase()); let isH = false;
      if (!isAuto && showUI) {
        isH = (mx > runningX && mx < runningX + charW && mouseY > startY + (j * leading) - fSize/2 && mouseY < startY + (j * leading) + fSize/2);
        charScales[charIdx] = lerp(charScales[charIdx] || 1, isH ? 1.45 : 1.0, 0.15);
      } else { isH = charScales[charIdx] > 1.25; }
      let displayChar = (isH || charScales[charIdx] > 1.25) ? char.toUpperCase() : char.toLowerCase();
      pg.push(); pg.translate(runningX + charW / 2, startY + (j * leading)); pg.scale(charScales[charIdx] || 1); pg.fill(c_font); 
      if (weightValue > 0) { pg.stroke(c_font); pg.strokeWeight(weightValue); pg.text(displayChar, 0, 0); } 
      else if (weightValue < 0) { pg.noStroke(); pg.text(displayChar, 0, 0); pg.stroke(c_box); pg.strokeWeight(abs(weightValue)); pg.noFill(); pg.text(displayChar, 0, 0); } 
      else { pg.noStroke(); pg.text(displayChar, 0, 0); }
      pg.pop(); runningX += charW + spacing; charIdx++; 
    } charIdx++; 
  } pg.pop(); 
}

function mousePressed() { 
  if (!showUI) return;
  
  let mx = showUI ? mouseX - SIDEBAR_WIDTH : mouseX;
  let centerX = pg.width / 2;
  let centerY = pg.height / 2;

  // Hitbox check for the text box area
  if (mouseX > SIDEBAR_WIDTH && 
      mx > centerX - smoothBoxW/2 && mx < centerX + smoothBoxW/2 && 
      mouseY > centerY - smoothBoxH/2 && mouseY < centerY + smoothBoxH/2) { 
    isFocused = true; 
  } else {
    isFocused = false; 
  }

  // Sidebar logic
  let hBase = y_hist + 15;
  if (mouseX > ALIGN_X && mouseX < ALIGN_X + 100) { 
    for (let i = 0; i < min(3, paletteHistory.length); i++) {
      let rY = hBase + (i * 20);
      if (mouseY > rY && mouseY < rY + 15) {
        let p = paletteHistory[paletteHistory.length - 1 - i];
        if (p) { c_font = p.font; c_box = p.box; c_bg = p.bg; }
      }
    }
  }

  if (mouseY > y_col - 15 && mouseY < y_col + 50) { 
    if (dist(mouseX, mouseY, ALIGN_X + 40, y_col) < 25) fontLocked = !fontLocked; 
    else if (dist(mouseX, mouseY, ALIGN_X + 110, y_col) < 25) boxLocked = !boxLocked; 
    else if (dist(mouseX, mouseY, ALIGN_X + 180, y_col) < 25) bgLocked = !bgLocked; 
    else if (mouseX > ALIGN_X && mouseX < ALIGN_X + 40) generateRandomPalette(); 
    else if (mouseX > ALIGN_X + 70 && mouseX < ALIGN_X + 110) generateRandomPalette(); 
    else if (mouseX > ALIGN_X + 140 && mouseX < ALIGN_X + 180) generateRandomPalette(); 
  } 

  if (mouseY > y_thick + 10 && mouseY < y_thick + 40) { 
    for (let i = 0; i <= 10; i++) { if (dist(mouseX, mouseY, ALIGN_X + (i * 20), y_thick + 25) < 15) weightIndex = i; } 
  } 

  if (mouseX > ALIGN_X + 80 && mouseX < ALIGN_X + 145 && mouseY > y_motion - 15 && mouseY < y_motion + 15) isAuto = !isAuto; 

  if (mouseX > ALIGN_X && mouseX < ALIGN_X + ELEMENT_W) { 
    if (mouseY > y_btns && mouseY < y_btns + 30) save(pg, 'TypeTool_Sharp.png'); 
    if (mouseY > y_btns + 35 && mouseY < y_btns + 65) recordIsolatedGif();
    if (mouseY > y_btns + 70 && mouseY < y_btns + 100) resetSettings(); 
  } 
}

function keyPressed() {
  if (keyCode === LEFT_ARROW) weightIndex = max(0, weightIndex - 1);
  if (keyCode === RIGHT_ARROW) weightIndex = min(10, weightIndex + 1);

  if (isFocused) {
    if (keyCode === BACKSPACE) textContent = textContent.slice(0, -1);
    else if (keyCode === ENTER) textContent += '\n';
    else if (key === ' ') textContent += ' ';
    else if (key.length === 1 && keyCode !== SHIFT) textContent += key;
  } else {
    // If NOT focused on text box, spacebar randomizes palette
    if (key === ' ') generateRandomPalette();
  }

  if (keyCode === LEFT_ARROW || keyCode === RIGHT_ARROW || keyCode === UP_ARROW || keyCode === DOWN_ARROW || key === ' ') {
    return false;
  }
}

// --- Rest of UI Helpers ---
function drawCanvasSidebar() {
  noStroke(); fill(30); rect(0, 0, SIDEBAR_WIDTH, height);
  fill(255); textStyle(BOLD); textAlign(LEFT); textSize(11); text("TYPE TOOL", ALIGN_X, 35); 
  drawHeader("SIZE & SPACING", Y_START);
  drawSliderWithUnderLabel("SIZE", y_size, val_size, 20, 300);
  drawSliderWithUnderLabel("LINE SPACING", y_line, val_line, 0.5, 2.5);
  drawSliderWithUnderLabel("CHARACTER SPACING", y_char, val_char, 0, 50);
  drawHeader("COLORS", y_col - 20);
  drawColorSwatchWithLock(ALIGN_X, y_col, c_font, fontLocked, "TEXT");
  drawColorSwatchWithLock(ALIGN_X + 70, y_col, c_box, boxLocked, "BOX");
  drawColorSwatchWithLock(ALIGN_X + 140, y_col, c_bg, bgLocked, "BG");
  drawHistory(y_hist);
  drawHeader("THICKNESS", y_thick);
  for(let i=0; i<=10; i++){
    let dotX = ALIGN_X + (i * 20); fill(i === weightIndex ? 255 : 70); circle(dotX, y_thick + 25, i === weightIndex ? 7 : 3);
  }
  drawHeader("MOTION", y_motion);
  fill(isAuto ? 255 : 60); rect(ALIGN_X + 80, y_motion - 8, 65, 16, 2);
  fill(isAuto ? 0 : 200); textAlign(CENTER, CENTER); textSize(7.5); textStyle(BOLD);
  text(isAuto ? "AUTO" : "MANUAL", ALIGN_X + 112.5, y_motion);
  drawSliderWithUnderLabel("PULSE SPEED", y_speed, val_speed, 0.01, 0.1);
  drawButton("EXPORT PNG", y_btns);
  drawButton("EXPORT GIF", y_btns + 35);
  drawButton("RESET ALL", y_btns + 70);
}

function handleContinuousInput() { if (mouseIsPressed && mouseX > ALIGN_X && mouseX < ALIGN_X + ELEMENT_W) { if (abs(mouseY - y_size) < 15) val_size = map(mouseX, ALIGN_X, ALIGN_X + ELEMENT_W, 20, 300); if (abs(mouseY - y_line) < 15) val_line = map(mouseX, ALIGN_X, ALIGN_X + ELEMENT_W, 0.5, 2.5); if (abs(mouseY - y_char) < 15) val_char = map(mouseX, ALIGN_X, ALIGN_X + ELEMENT_W, 0, 50); if (abs(mouseY - y_speed) < 15) val_speed = map(mouseX, ALIGN_X, ALIGN_X + ELEMENT_W, 0.01, 0.1); } }
function handleKeyboardInput() { if (keyIsDown(BACKSPACE) && isFocused && frameCount % 5 === 0) textContent = textContent.slice(0, -1); }
function saveCurrentToHistory() { paletteHistory.push({ font: c_font, box: c_box, bg: c_bg }); if (paletteHistory.length > 10) paletteHistory.shift(); }
function resetSettings() { val_size = 100; val_line = 1.2; val_char = 0; val_speed = 0.03; weightIndex = 5; textContent = "click to type"; c_font = color(255); c_box = color(0); c_bg = color(245); paletteHistory = []; fontLocked = boxLocked = bgLocked = false; isAuto = false; saveCurrentToHistory(); isFocused = false; }
function drawHeader(txt, y) { textAlign(LEFT); fill(150); textStyle(BOLD); textSize(9); text(txt, ALIGN_X, y); }
function drawSliderWithUnderLabel(label, y, val, minV, maxV) { fill(60); noStroke(); rect(ALIGN_X, y, ELEMENT_W, 2, 1); fill(255); circle(map(val, minV, maxV, ALIGN_X, ALIGN_X + ELEMENT_W), y, 10); fill(100); textStyle(NORMAL); textSize(7.5); textAlign(LEFT); text(label, ALIGN_X, y + 15); }
function drawColorSwatchWithLock(x, y, col, locked, label) { fill(col); noStroke(); rect(x, y, 40, 40, 4); fill(locked ? 255 : 60); circle(x + 40, y, 8); fill(100); textAlign(CENTER); textStyle(NORMAL); textSize(7); text(label, x + 20, y + 52); }
function drawButton(label, y) { fill(255); rect(ALIGN_X, y, ELEMENT_W, 30, 4); fill(0); textAlign(CENTER, CENTER); textStyle(BOLD); textSize(9); text(label, ALIGN_X + (ELEMENT_W/2), y + 15); }
function drawHistory(y) { fill(100); textAlign(LEFT); textStyle(NORMAL); textSize(7.5); text("HISTORY (CLICK TO REVERT)", ALIGN_X, y); for (let i = 0; i < min(3, paletteHistory.length); i++) { let p = paletteHistory[paletteHistory.length - 1 - i]; if (!p) continue; let rY = y + 15 + (i * 20); noStroke(); fill(p.bg); rect(ALIGN_X, rY, 12, 12, 2); fill(p.box); rect(ALIGN_X + 15, rY, 12, 12, 2); fill(p.font); rect(ALIGN_X + 30, rY, 12, 12, 2); fill(i === 0 ? 160 : 80); textAlign(LEFT, CENTER); textSize(7); text(i === 0 ? "ACTIVE" : "PREVIOUS", ALIGN_X + 50, rY + 6); } }
function recordIsolatedGif() { if (!isRecording) { isRecording = true; showUI = false; saveGif('TypeTool_Export', 600, { units: 'frames', graphics: pg, silent: false }); setTimeout(() => { isRecording = false; showUI = true; }, 10500); } }
function generateRandomPalette() { if (millis() - lastPaletteChange < 300) return; if (!boxLocked) c_box = color(random(255), random(255), random(255)); if (!fontLocked) c_font = color(random(255), random(255), random(255)); if (!bgLocked) c_bg = color(random(255), random(255), random(255)); lastPaletteChange = millis(); saveCurrentToHistory(); }