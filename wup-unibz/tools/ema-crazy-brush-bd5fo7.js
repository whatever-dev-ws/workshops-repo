let symmetry = 6;
let angle = 360 / symmetry;
let xoff = 0;

// APP STATES
let isDrawing = false;
let canDraw = false;
let pg;
let showGuides = false;
let isDarkMode = true;
let uiVisible = true;

// GENERATIVE BACKGROUND VARS
let startPg;
let ghostX = null;
let ghostY = null;
let ghostOff = 0;
let ghostHue = 0;

// DATA STORAGE
let strokeHistory = [];
let redoHistory = [];
let currentStrokeBundle = [];
let lastPoints = [];

// SMOOTHING & CURSOR
let smoothX = 0;
let smoothY = 0;
let currentWeight = 0;

// AUTO-SPIN VARS
let autoSpinActive = false;
let spinAngle = 0;

// CENTER OFFSET
let topBarHeight = 85;
let centerOffsetY = 35;

// UI Elements
let startBtn, clearBtn, undoBtn, redoBtn, symSlider, symLabel, guideCheckbox;
let savePngBtn, saveSvgBtn;
let magicBrushCheckbox, brushSizeSlider, brushAlphaSlider;
let sizeLabel, alphaLabel, colorModeSelect, colorPicker;
let gradPicker1, gradPicker2, gradPicker3;
let brushModeSelect, bgToggleBtn, modeLabel, spinCheckbox;
let spinSpeedSlider, spinSpeedLabel;

// ==========================================
//              SETUP
// ==========================================
function setup() {
  createCanvas(windowWidth, windowHeight);
  angleMode(DEGREES);
  // Color Mode: Hue(360), Sat(100), Bri(100), Alpha(100)
  colorMode(HSB, 360, 100, 100, 100);

  // Main Drawing Canvas
  pg = createGraphics(windowWidth, windowHeight);
  pg.angleMode(DEGREES);
  pg.colorMode(HSB, 360, 100, 100, 100);
  pg.translate(width / 2, height / 2 + centerOffsetY);

  // Generative Start Screen Canvas
  startPg = createGraphics(windowWidth, windowHeight);
  startPg.angleMode(DEGREES);
  startPg.colorMode(HSB, 360, 100, 100, 100);
  startPg.background(10); // Start with dark gray

  setupUI();
  background(isDarkMode ? 10 : 95);
}

function draw() {
  if (isDrawing) {
    let bgCol = isDarkMode ? 10 : 95;
    background(bgCol);

    // 1. Draw Art Buffer
    image(pg, 0, 0);

    // 2. Visuals (Guides & Cursor)
    if (showGuides) drawGuides();
    if (canDraw) drawBrushCursor();

    // 3. UI Layer
    if (uiVisible) {
      push();
      resetMatrix();
      noStroke();
      fill(isDarkMode ? 20 : 90);
      rect(0, 0, width, topBarHeight);
      stroke(isDarkMode ? 50 : 80);
      line(0, topBarHeight, width, topBarHeight);
      pop();
      updateUILabels();
    }

    runDrawingLogic();
  } else {
    // RUN THE GENERATIVE BACKGROUND ANIMATION
    runGenerativeBackground();
    drawStartScreen();
  }
}

// ==========================================
//      GENERATIVE BACKGROUND LOGIC
// ==========================================

function runGenerativeBackground() {
  startPg.push();
  startPg.translate(width / 2, height / 2);

  // --- FADE EFFECT REMOVED ---
  // To make the trails NOT fade, we simply do NOT draw the rectangle here.
  // The background set in setup() acts as the permanent canvas.
  /*
  startPg.noStroke();
  startPg.fill(20, 1); 
  startPg.rect(-width / 2, -height / 2, width, height);
  */

  // 2. Calculate "Ghost" Cursor movement using Perlin Noise
  ghostOff += 0.005;
  let r = map(noise(ghostOff), 0, 1, 50, height / 2 - 50);
  let theta = frameCount * 0.5;

  // Convert to Cartesian
  let x = r * cos(theta);
  let y = r * sin(theta);

  // Add some erratic noise to X/Y
  x += map(noise(ghostOff * 2), 0, 1, -50, 50);
  y += map(noise(ghostOff * 3), 0, 1, -50, 50);

  // Initialize previous position if first frame
  if (ghostX === null) {
    ghostX = x;
    ghostY = y;
  }

  // 3. Draw Symmetrical Lines on startPg
  startPg.strokeWeight(3);
  ghostHue = (ghostHue + 0.5) % 360;
  startPg.stroke(ghostHue, 80, 100, 100);

  let startSym = 8;
  let startAng = 360 / startSym;

  for (let i = 0; i < startSym; i++) {
    startPg.push();
    startPg.rotate(i * startAng);

    // Draw line from previous position to current
    startPg.line(x, y, ghostX, ghostY);
    startPg.scale(1, -1); // Mirror
    startPg.line(x, y, ghostX, ghostY);

    startPg.pop();
  }

  // Update previous position
  ghostX = x;
  ghostY = y;

  startPg.pop();
}

function drawStartScreen() {
  // 1. Draw the Generative Graphics Buffer
  push();
  resetMatrix();
  image(startPg, 0, 0);
  pop();

  // 2. Dark Overlay to make text pop
  push();
  resetMatrix();
  noStroke();
  
  // Kept at 35% opacity as requested previously so text is readable
  fill(0, 0, 0, 35);
  rect(0, 0, width, height);

  // 3. Text & UI
  textAlign(CENTER, CENTER);

  // Glow effect for title
  drawingContext.shadowBlur = 20;
  drawingContext.shadowColor = 'white';

  fill(255);
  textSize(80);
  textStyle(BOLD);
  text("CRAZY BRUSH", width / 2, height / 2 - 60);

  drawingContext.shadowBlur = 0; // Reset glow

  textSize(20);
  textStyle(NORMAL);
  fill(200);
  text("Generative Symmetry Studio", width / 2, height / 2 + 10);
  pop();
}

// ==========================================
//          VISUAL CURSOR
// ==========================================

function drawBrushCursor() {
  if (mouseY < topBarHeight && uiVisible) return;
  if (magicBrushCheckbox.checked()) return;

  push();
  translate(width / 2, height / 2 + centerOffsetY);

  let targetX =
    brushModeSelect.value() === 'Smooth' ? smoothX : mouseX - width / 2;
  let targetY =
    brushModeSelect.value() === 'Smooth'
      ? smoothY
      : mouseY - (height / 2 + centerOffsetY);

  noFill();

  let mode = colorModeSelect.value();
  if (mode === 'Solid') {
    let c = color(colorPicker.value());
    stroke(hue(c), saturation(c), brightness(c), 80);
  } else if (mode === 'Custom Grad') {
    let c = color(gradPicker1.value());
    stroke(hue(c), saturation(c), brightness(c), 80);
  } else {
    stroke(isDarkMode ? 255 : 0, 50);
  }

  strokeWeight(1);
  ellipse(targetX, targetY, currentWeight * 2, currentWeight * 2);

  line(targetX - 3, targetY, targetX + 3, targetY);
  line(targetX, targetY - 3, targetX, targetY + 3);

  pop();
}

// ==========================================
//          DRAWING LOGIC
// ==========================================

function mousePressed() {
  if (isDrawing && mouseY > topBarHeight && canDraw) {
    currentStrokeBundle = [];
    redoHistory = [];
  }
}

function mouseReleased() {
  if (isDrawing && currentStrokeBundle.length > 0) {
    strokeHistory.push(currentStrokeBundle);
    currentStrokeBundle = [];
  }
}

function runDrawingLogic() {
  symmetry = symSlider.value();
  angle = 360 / symmetry;

  if (autoSpinActive && isDrawing) {
    spinAngle += spinSpeedSlider.value();
  }

  let rawMx = mouseX - width / 2;
  let rawMy = mouseY - (height / 2 + centerOffsetY);

  let finalHue, finalSat, finalBri, finalAlpha;
  let isMagic = magicBrushCheckbox.checked();
  let mode = colorModeSelect.value();
  let brushType = brushModeSelect.value();

  if (mode === 'Rainbow') {
    finalHue = (frameCount * 2) % 360;
    finalSat = 80;
    finalBri = isDarkMode ? 100 : 80;
  } else if (mode === 'Solid') {
    let c = color(colorPicker.value());
    finalHue = hue(c);
    finalSat = saturation(c);
    finalBri = brightness(c);
  } else if (mode === 'Custom Grad') {
    let c1 = color(gradPicker1.value());
    let c2 = color(gradPicker2.value());
    let c3 = color(gradPicker3.value());
    let cycle = (frameCount * 2) % 360;
    let amt = map(cycle, 0, 360, 0, 3);
    let mixed;
    if (amt < 1) mixed = lerpColor(c1, c2, amt);
    else if (amt < 2) mixed = lerpColor(c2, c3, amt - 1);
    else mixed = lerpColor(c3, c1, amt - 2);
    finalHue = hue(mixed);
    finalSat = saturation(mixed);
    finalBri = brightness(mixed);
  } else if (mode === 'Fire') {
    finalHue = map(noise(frameCount * 0.1), 0, 1, 0, 50);
    finalSat = 90;
    finalBri = 100;
  } else if (mode === 'Ice') {
    finalHue = map(noise(frameCount * 0.1), 0, 1, 160, 260);
    finalSat = 70;
    finalBri = 100;
  } else if (mode === 'Forest') {
    finalHue = map(noise(frameCount * 0.1), 0, 1, 80, 150);
    finalSat = 60;
    finalBri = 80;
  }

  let speed = dist(mouseX, mouseY, pmouseX, pmouseY);
  if (isMagic) {
    currentWeight = map(speed, 0, 20, 2, 8);
    finalAlpha = 60;
  } else {
    currentWeight = brushSizeSlider.value();
    finalAlpha = brushAlphaSlider.value();
  }

  if (mouseIsPressed && (mouseY > topBarHeight || !uiVisible) && canDraw) {
    pg.stroke(finalHue, finalSat, finalBri, finalAlpha);
    pg.strokeWeight(currentWeight);

    let inputX, inputY, prevInputX, prevInputY;

    function counterRotate(x, y, ang) {
      let ca = cos(-ang);
      let sa = sin(-ang);
      return { x: x * ca - y * sa, y: x * sa + y * ca };
    }

    if (brushType === 'Classic') {
      smoothX = rawMx;
      smoothY = rawMy;
      let pRawMx = pmouseX - width / 2;
      let pRawMy = pmouseY - (height / 2 + centerOffsetY);

      let curr = counterRotate(rawMx, rawMy, spinAngle);
      let prev = counterRotate(pRawMx, pRawMy, spinAngle);

      let noiseVal = noise(xoff) * 20 - 10;
      inputX = curr.x + noiseVal;
      inputY = curr.y + noiseVal;
      prevInputX = prev.x - noiseVal;
      prevInputY = prev.y - noiseVal;
    } else if (brushType === 'Smooth') {
      let smoothingFactor = 0.15;
      smoothX = lerp(smoothX, rawMx, smoothingFactor);
      smoothY = lerp(smoothY, rawMy, smoothingFactor);

      let curr = counterRotate(smoothX, smoothY, spinAngle);

      let noiseVal = noise(xoff) * 5 - 2.5;
      inputX = curr.x + noiseVal;
      inputY = curr.y + noiseVal;
    }

    let useConnectedLines = brushType === 'Smooth';
    let frameData = {
      h: finalHue,
      s: finalSat,
      b: finalBri,
      a: finalAlpha,
      weight: currentWeight,
      sym: symmetry,
      cap: useConnectedLines ? 'butt' : 'round',
      lines: [],
    };

    pg.strokeCap(ROUND);
    for (let i = 0; i < symmetry; i++) {
      let theta = angle * i + spinAngle;

      if (brushType === 'Classic') {
        pg.push();
        pg.rotate(theta);
        pg.line(inputX, inputY, prevInputX, prevInputY);
        pg.scale(1, -1);
        pg.line(inputX, inputY, prevInputX, prevInputY);
        pg.pop();

        let rX1 = inputX * cos(theta) - inputY * sin(theta);
        let rY1 = inputX * sin(theta) + inputY * cos(theta);
        let rX2 = prevInputX * cos(theta) - prevInputY * sin(theta);
        let rY2 = prevInputX * sin(theta) + prevInputY * cos(theta);
        let mX1 = inputX * cos(theta) - -inputY * sin(theta);
        let mY1 = inputX * sin(theta) + -inputY * cos(theta);
        let mX2 = prevInputX * cos(theta) - -prevInputY * sin(theta);
        let mY2 = prevInputX * sin(theta) + -prevInputY * cos(theta);
        frameData.lines.push({ x1: rX1, y1: rY1, x2: rX2, y2: rY2 });
        frameData.lines.push({ x1: mX1, y1: mY1, x2: mX2, y2: mY2 });
      } else {
        let rX = inputX * cos(theta) - inputY * sin(theta);
        let rY = inputX * sin(theta) + inputY * cos(theta);
        let mX = inputX * cos(theta) - -inputY * sin(theta);
        let mY = inputX * sin(theta) + -inputY * cos(theta);

        if (lastPoints[i]) {
          pg.line(lastPoints[i].rX, lastPoints[i].rY, rX, rY);
          pg.line(lastPoints[i].mX, lastPoints[i].mY, mX, mY);
          frameData.lines.push({
            x1: lastPoints[i].rX,
            y1: lastPoints[i].rY,
            x2: rX,
            y2: rY,
          });
          frameData.lines.push({
            x1: lastPoints[i].mX,
            y1: lastPoints[i].mY,
            x2: mX,
            y2: mY,
          });
        }
        lastPoints[i] = { rX: rX, rY: rY, mX: mX, mY: mY };
      }
    }
    if (frameData.lines.length > 0) currentStrokeBundle.push(frameData);
    xoff += 0.1;
  } else {
    lastPoints = [];
    if (!mouseIsPressed) {
      smoothX = lerp(smoothX, rawMx, 0.3);
      smoothY = lerp(smoothY, rawMy, 0.3);
    }
  }
}

// ==========================================
//      HISTORY MANAGEMENT (UNDO/REDO)
// ==========================================

function redrawCanvasFromHistory() {
  pg.clear();
  for (let strokeBundle of strokeHistory) {
    for (let s of strokeBundle) {
      pg.stroke(s.h, s.s, s.b, s.a);
      pg.strokeWeight(s.weight);
      pg.strokeCap(s.cap === 'butt' ? ROUND : ROUND);
      for (let l of s.lines) pg.line(l.x1, l.y1, l.x2, l.y2);
    }
  }
}

function undoLastStroke() {
  if (strokeHistory.length > 0) {
    let removedStroke = strokeHistory.pop();
    redoHistory.push(removedStroke);
    redrawCanvasFromHistory();
  }
}

function redoLastStroke() {
  if (redoHistory.length > 0) {
    let restoredStroke = redoHistory.pop();
    strokeHistory.push(restoredStroke);
    redrawCanvasFromHistory();
  }
}

function keyPressed() {
  if (key == ' ') clearCanvas();

  if ((key === 'z' || key === 'Z') && (keyIsDown(CONTROL) || keyIsDown(META))) {
    if (keyIsDown(SHIFT)) {
      redoLastStroke();
    } else {
      undoLastStroke();
    }
  }

  if ((key === 'y' || key === 'Y') && (keyIsDown(CONTROL) || keyIsDown(META))) {
    redoLastStroke();
  }

  if (key === 's' || key === 'S') saveCustomSVG();
  if (key === 'c' || key === 'C') clearCanvas();
  if (key === 'h' || key === 'H') {
    uiVisible = !uiVisible;
    if (uiVisible) showAllControls();
    else hideAllControls();
  }
  if (key === '[') brushSizeSlider.value(max(1, brushSizeSlider.value() - 2));
  if (key === ']') brushSizeSlider.value(min(30, brushSizeSlider.value() + 2));
}

// ==========================================
//          EXPORTERS
// ==========================================

function saveCustomSVG() {
  let svgContent = [];
  svgContent.push(`<?xml version="1.0" encoding="utf-8"?>`);
  svgContent.push(
    `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`
  );
  if (isDarkMode)
    svgContent.push(
      `<rect x="0" y="0" width="${width}" height="${height}" fill="#0a0a0a" />`
    );
  let cx = width / 2;
  let cy = height / 2 + centerOffsetY;

  for (let strokeBundle of strokeHistory) {
    for (let s of strokeBundle) {
      let c = color(s.h, s.s, s.b);
      let hexCode = '#' + hex(red(c), 2) + hex(green(c), 2) + hex(blue(c), 2);
      let svgOpacity = s.a / 100.0;
      let lineCap = s.cap || 'round';
      for (let l of s.lines) {
        svgContent.push(
          `<line x1="${(cx + l.x1).toFixed(2)}" y1="${(cy + l.y1).toFixed(
            2
          )}" ` +
            `x2="${(cx + l.x2).toFixed(2)}" y2="${(cy + l.y2).toFixed(2)}" ` +
            `stroke="${hexCode}" stroke-opacity="${svgOpacity}" stroke-width="${s.weight}" stroke-linecap="${lineCap}" />`
        );
      }
    }
  }
  svgContent.push(`</svg>`);
  let blob = new Blob([svgContent.join('\n')], { type: 'image/svg+xml' });
  let link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'crazy-brush-export.svg';
  link.click();
}

function saveHighResPNG() {
  let scaler = 3;
  let hiW = width * scaler;
  let hiH = height * scaler;
  let pgHigh = createGraphics(hiW, hiH);
  pgHigh.angleMode(DEGREES);
  pgHigh.colorMode(HSB, 360, 100, 100, 100);
  pgHigh.background(isDarkMode ? 10 : 95);
  pgHigh.translate(hiW / 2, (height / 2 + centerOffsetY) * scaler);
  pgHigh.scale(scaler);

  for (let strokeBundle of strokeHistory) {
    for (let s of strokeBundle) {
      pgHigh.stroke(s.h, s.s, s.b, s.a);
      pgHigh.strokeWeight(s.weight);
      pgHigh.strokeCap(ROUND);
      for (let l of s.lines) pgHigh.line(l.x1, l.y1, l.x2, l.y2);
    }
  }
  save(pgHigh, 'crazy-brush-HD.png');
  pgHigh.remove();
}

// ==========================================
//                UI SETUP
// ==========================================

function setupUI() {
  startBtn = createButton('ENTER STUDIO');
  styleButton(startBtn);
  startBtn.size(250, 60);
  startBtn.style('font-size', '18px');
  startBtn.style('letter-spacing', '2px');
  startBtn.style('font-weight', 'bold');
  centerStartButton();
  startBtn.mousePressed(startApp);

  symLabel = createDiv('Mirrors: 6');
  symLabel.position(20, 10);
  styleLabel(symLabel);

  symSlider = createSlider(2, 24, 6, 1);
  symSlider.position(20, 30);
  symSlider.style('width', '100px');

  guideCheckbox = createCheckbox(' Guides', false);
  guideCheckbox.position(20, 55);
  styleCheckbox(guideCheckbox);
  guideCheckbox.changed(() => {
    showGuides = guideCheckbox.checked();
  });

  modeLabel = createDiv('Mode:');
  modeLabel.position(150, 12);
  styleLabel(modeLabel);

  brushModeSelect = createSelect();
  brushModeSelect.position(200, 10);
  brushModeSelect.option('Classic');
  brushModeSelect.option('Smooth');
  brushModeSelect.style('width', '80px');
  brushModeSelect.changed(() => (lastPoints = []));

  magicBrushCheckbox = createCheckbox(' Magic', true);
  magicBrushCheckbox.position(290, 10);
  styleCheckbox(magicBrushCheckbox);

  sizeLabel = createDiv('Size: Auto');
  sizeLabel.position(150, 35);
  styleLabel(sizeLabel);
  brushSizeSlider = createSlider(1, 30, 5, 1);
  brushSizeSlider.position(220, 35);
  brushSizeSlider.style('width', '80px');

  alphaLabel = createDiv('Alpha: Auto');
  alphaLabel.position(150, 55);
  styleLabel(alphaLabel);
  brushAlphaSlider = createSlider(10, 100, 100, 1);
  brushAlphaSlider.position(220, 55);
  brushAlphaSlider.style('width', '80px');

  let colorX = 380;
  bgToggleBtn = createButton('☀/☾');
  styleButton(bgToggleBtn);
  bgToggleBtn.position(colorX, 10);
  bgToggleBtn.size(40, 25);
  bgToggleBtn.mousePressed(() => {
    isDarkMode = !isDarkMode;
  });

  spinCheckbox = createCheckbox(' Auto-Spin', false);
  spinCheckbox.position(colorX, 65);
  styleCheckbox(spinCheckbox);
  spinCheckbox.changed(() => {
    autoSpinActive = spinCheckbox.checked();
    if (autoSpinActive) {
      guideCheckbox.checked(true);
      showGuides = true;
    }
    updateUILabels();
  });

  spinSpeedLabel = createDiv('Speed: 0.2');
  spinSpeedLabel.position(colorX + 110, 65);
  styleLabel(spinSpeedLabel);

  spinSpeedSlider = createSlider(-2, 2, 0.2, 0.1);
  spinSpeedSlider.position(colorX + 180, 65);
  spinSpeedSlider.style('width', '80px');

  colorModeSelect = createSelect();
  colorModeSelect.position(colorX + 50, 10);
  colorModeSelect.option('Rainbow');
  colorModeSelect.option('Solid');
  colorModeSelect.option('Custom Grad');
  colorModeSelect.option('Fire');
  colorModeSelect.option('Ice');
  colorModeSelect.option('Forest');
  colorModeSelect.style('background', '#333');
  colorModeSelect.style('color', '#FFF');
  colorModeSelect.style('border', '1px solid #555');
  colorModeSelect.style('padding', '5px');

  colorPicker = createColorPicker('#ff0000');
  colorPicker.position(colorX + 50, 40);
  colorPicker.style('height', '25px');
  colorPicker.style('width', '100px');
  colorPicker.style('border', 'none');

  gradPicker1 = createColorPicker('#FF0000');
  gradPicker1.position(colorX + 50, 40);
  gradPicker1.size(30, 25);
  gradPicker1.style('border', 'none');

  gradPicker2 = createColorPicker('#00FF00');
  gradPicker2.position(colorX + 85, 40);
  gradPicker2.size(30, 25);
  gradPicker2.style('border', 'none');

  gradPicker3 = createColorPicker('#0000FF');
  gradPicker3.position(colorX + 120, 40);
  gradPicker3.size(30, 25);
  gradPicker3.style('border', 'none');

  let actionX = windowWidth - 280;

  undoBtn = createButton('UNDO');
  styleButton(undoBtn);
  undoBtn.position(actionX, 25);
  undoBtn.size(60, 30);
  undoBtn.mousePressed(undoLastStroke);

  redoBtn = createButton('REDO');
  styleButton(redoBtn);
  redoBtn.position(actionX + 70, 25);
  redoBtn.size(60, 30);
  redoBtn.mousePressed(redoLastStroke);

  clearBtn = createButton('CLEAR');
  styleButton(clearBtn);
  clearBtn.position(actionX + 140, 25);
  clearBtn.size(60, 30);
  clearBtn.mousePressed(clearCanvas);

  saveSvgBtn = createButton('SVG');
  styleButton(saveSvgBtn);
  saveSvgBtn.position(actionX + 210, 10);
  saveSvgBtn.size(50, 25);
  saveSvgBtn.mousePressed(saveCustomSVG);

  savePngBtn = createButton('PNG');
  styleButton(savePngBtn);
  savePngBtn.position(actionX + 210, 40);
  savePngBtn.size(50, 25);
  savePngBtn.mousePressed(saveHighResPNG);

  hideAllControls();
}

function updateUILabels() {
  symLabel.html('Mirrors: ' + symSlider.value());
  let textColor = isDarkMode ? '#fff' : '#000';
  symLabel.style('color', textColor);
  modeLabel.style('color', textColor);

  if (magicBrushCheckbox.checked()) {
    brushSizeSlider.attribute('disabled', '');
    brushAlphaSlider.attribute('disabled', '');
    sizeLabel.html('Size: Auto');
    alphaLabel.html('Alpha: Auto');
    sizeLabel.style('color', '#888');
    alphaLabel.style('color', '#888');
  } else {
    brushSizeSlider.removeAttribute('disabled');
    brushAlphaSlider.removeAttribute('disabled');
    sizeLabel.html('Size: ' + brushSizeSlider.value());
    alphaLabel.html('Alpha: ' + brushAlphaSlider.value());
    sizeLabel.style('color', textColor);
    alphaLabel.style('color', textColor);
  }

  spinSpeedLabel.html('Speed: ' + spinSpeedSlider.value());
  if (autoSpinActive) {
    spinSpeedSlider.removeAttribute('disabled');
    spinSpeedLabel.style('color', textColor);
  } else {
    spinSpeedSlider.attribute('disabled', '');
    spinSpeedLabel.style('color', '#555');
  }

  let btnBorder = isDarkMode ? 'white' : 'black';
  let btnColor = isDarkMode ? 'white' : 'black';

  [undoBtn, redoBtn, clearBtn, savePngBtn, saveSvgBtn, bgToggleBtn].forEach(
    (b) => {
      b.style('border', `2px solid ${btnBorder}`);
      b.style('color', btnColor);
    }
  );

  if (colorModeSelect.value() === 'Solid') {
    colorPicker.show();
    gradPicker1.hide();
    gradPicker2.hide();
    gradPicker3.hide();
  } else if (colorModeSelect.value() === 'Custom Grad') {
    colorPicker.hide();
    gradPicker1.show();
    gradPicker2.show();
    gradPicker3.show();
  } else {
    colorPicker.hide();
    gradPicker1.hide();
    gradPicker2.hide();
    gradPicker3.hide();
  }
  spinCheckbox.style('color', textColor);
}

function drawGuides() {
  push();
  translate(width / 2, height / 2 + centerOffsetY);
  if (autoSpinActive) rotate(spinAngle);
  stroke(isDarkMode ? 255 : 0, 50);
  strokeWeight(1);
  for (let i = 0; i < symmetry; i++) {
    rotate(angle);
    line(0, 0, width, 0);
  }
  pop();
}

function startApp() {
  isDrawing = true;
  startBtn.hide();
  showAllControls();
  repositionTopBar();
  pg.background(isDarkMode ? 10 : 95);
  pg.clear();
  strokeHistory = [];
  redoHistory = [];
  setTimeout(() => {
    canDraw = true;
  }, 500);
}

function showAllControls() {
  symSlider.show();
  symLabel.show();
  guideCheckbox.show();
  magicBrushCheckbox.show();
  brushModeSelect.show();
  modeLabel.show();
  brushSizeSlider.show();
  brushAlphaSlider.show();
  sizeLabel.show();
  alphaLabel.show();
  colorModeSelect.show();
  bgToggleBtn.show();
  spinCheckbox.show();
  spinSpeedSlider.show();
  spinSpeedLabel.show();

  clearBtn.show();
  undoBtn.show();
  redoBtn.show();
  savePngBtn.show();
  saveSvgBtn.show();
  updateUILabels();
}

function hideAllControls() {
  symSlider.hide();
  symLabel.hide();
  guideCheckbox.hide();
  magicBrushCheckbox.hide();
  brushModeSelect.hide();
  modeLabel.hide();
  brushSizeSlider.hide();
  brushAlphaSlider.hide();
  sizeLabel.hide();
  alphaLabel.hide();
  colorModeSelect.hide();
  colorPicker.hide();
  gradPicker1.hide();
  gradPicker2.hide();
  gradPicker3.hide();
  bgToggleBtn.hide();
  spinCheckbox.hide();
  spinSpeedSlider.hide();
  spinSpeedLabel.hide();

  clearBtn.hide();
  undoBtn.hide();
  redoBtn.hide();
  savePngBtn.hide();
  saveSvgBtn.hide();
}

function clearCanvas() {
  pg.clear();
  strokeHistory = [];
  redoHistory = [];
  lastPoints = [];
  spinAngle = 0;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  // Re-create graphics buffers on resize
  pg = createGraphics(windowWidth, windowHeight);
  pg.angleMode(DEGREES);
  pg.colorMode(HSB, 360, 100, 100, 100);
  pg.translate(width / 2, height / 2 + centerOffsetY);

  startPg = createGraphics(windowWidth, windowHeight);
  startPg.angleMode(DEGREES);
  startPg.colorMode(HSB, 360, 100, 100, 100);
  startPg.background(10); // Re-fill with background on resize

  // Reset ghost position to prevent jumping
  ghostX = null;
  ghostY = null;

  centerStartButton();
  if (isDrawing) repositionTopBar();
}

function centerStartButton() {
  if (startBtn) {
    startBtn.position(width / 2 - 125, height / 2 + centerOffsetY + 80);
  }
}

function repositionTopBar() {
  let w = windowWidth;
  let actionX = w - 280;
  undoBtn.position(actionX, 25);
  redoBtn.position(actionX + 70, 25);
  clearBtn.position(actionX + 140, 25);
  saveSvgBtn.position(actionX + 210, 10);
  savePngBtn.position(actionX + 210, 40);
}

function styleLabel(lbl) {
  lbl.style('color', '#fff');
  lbl.style('font-family', 'sans-serif');
  lbl.style('font-size', '12px');
}
function styleCheckbox(chk) {
  chk.style('color', 'white');
  chk.style('font-family', 'sans-serif');
  chk.style('font-size', '12px');
}
function styleButton(btn) {
  btn.style('background-color', 'transparent');
  btn.style('border', '2px solid white');
  btn.style('color', 'white');
  btn.style('cursor', 'pointer');
}