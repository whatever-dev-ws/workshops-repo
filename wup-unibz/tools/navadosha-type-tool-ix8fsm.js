// =======================
// GLOBAL SETTINGS
// =======================

let params = {
  text: 'KINETIC BANNER',
  fontSize: 20,
  bannerWidth: 1200,
  bannerHeight: 400,
  distortion: 0,
  samples: 10,
  lineSpacingFactor: 0,
  speed: 0,
  scaleJitter: 0,
  spinSpeed: 0,          // 0 = kein Spin
  shapeMode: 'lines',    // 2D-Start
  dragRotX: 0,
  dragRotY: 0,
  shapeScale: 0.1,
  columns: 1
};

let cnv;
let gifDuration = 3;
let fps = 30;

// GUI Elemente
let textInput;
let fontSlider, distortionSlider, samplesSlider, lineSpacingSlider;
let speedSlider, scaleSlider, shapeScaleSlider;
let bgPicker, textPicker;
let spinSpeedSlider;
let fontFileInput, formatSelect, shapeSelect;
let btnSavePNG, btnSaveGIF, btnReset;
let columnsSlider;

// Font / State
let currentFont = null;
let fontReady = false;

// Drag Orbit
let isDragging = false;
let lastMouseX = 0;
let lastMouseY = 0;

// Canvas-Position
let canvasRect = null;


// =======================
// SETUP
// =======================

function setup() {
  const wrapper = createDiv();
  wrapper.style('display', 'flex');
  wrapper.style('flex-direction', 'row');
  wrapper.style('align-items', 'flex-start');
  wrapper.style('gap', '16px');
  wrapper.position(20, 20);

  const guiDiv = createDiv();
  guiDiv.parent(wrapper);
  guiDiv.style('display', 'flex');
  guiDiv.style('flex-direction', 'column');
  guiDiv.style('gap', '4px');

  function group(labelText) {
    const g = createDiv();
    g.parent(guiDiv);
    g.style('display', 'flex');
    g.style('flex-direction', 'column');
    g.style('gap', '2px');
    const lab = createElement('label', labelText);
    lab.parent(g);
    return g;
  }

  cnv = createCanvas(params.bannerWidth, params.bannerHeight, WEBGL);
  cnv.parent(wrapper);
  frameRate(fps);
  updateCanvasRect();

  // 1. Text
  const gText = group('Text');
  textInput = createInput(params.text);
  textInput.parent(gText);
  textInput.style('width', '220px');
  textInput.input(() => params.text = textInput.value());

  // 2. Font file
  const gFontFile = group('Font File (.ttf/.otf)');
  fontFileInput = createFileInput(handleFontFile, false);
  fontFileInput.parent(gFontFile);
  createSpan(' (pick a .ttf/.otf from your computer)').parent(gFontFile);

  // 3. Canvas Format
  const gFormat = group('Canvas Format');
  formatSelect = createSelect();
  formatSelect.parent(gFormat);
  formatSelect.style('width', '220px');
  formatSelect.option('1200 x 400', '1200x400');
  formatSelect.option('800 x 800', '800x800');
  formatSelect.option('1080 x 1080', '1080x1080');
  formatSelect.option('1920 x 1080', '1920x1080');
  formatSelect.option('1600 x 900', '1600x900');
  formatSelect.selected('1200x400');
  formatSelect.changed(onFormatChange);

  // 4. Font Size
  const gFont = group('Font Size');
  fontSlider = createSlider(20, 300, params.fontSize, 1);
  fontSlider.parent(gFont);
  fontSlider.style('width', '220px');

  // 5. Shape Mode
  const gShape = group('Shape Mode');
  shapeSelect = createSelect();
  shapeSelect.parent(gShape);
  shapeSelect.style('width', '220px');
  shapeSelect.option('Normal (2D)', 'lines');
  shapeSelect.option('Circle (3D)', 'circle');
  shapeSelect.option('Wave (3D)', 'donut');
  shapeSelect.option('Spiral (3D)', 'spiral');
  shapeSelect.option('DNA (3D)', 'cylinder');
  shapeSelect.selected('lines');
  shapeSelect.changed(() => {
    params.shapeMode = shapeSelect.value();
    if (params.shapeMode !== 'lines' && samplesSlider.value() < 10) {
      samplesSlider.value(10);
    }
  });

  // 6. Shape Size
  const gShapeSize = group('Shape Size');
  shapeScaleSlider = createSlider(0.1, 3, params.shapeScale, 0.01);
  shapeScaleSlider.parent(gShapeSize);
  shapeScaleSlider.style('width', '220px');

  // 7. Spin Speed (0 = aus)
  const gSpin = group('Spin Speed');
  spinSpeedSlider = createSlider(0, 5, params.spinSpeed, 0.1);
  spinSpeedSlider.parent(gSpin);
  spinSpeedSlider.style('width', '220px');

  // 8. Distortion Amount
  const gDist = group('Distortion Amount');
  distortionSlider = createSlider(0, 100, params.distortion, 1);
  distortionSlider.parent(gDist);
  distortionSlider.style('width', '220px');

  // 9. Path samples
  const gSamples = group('Path Samples');
  samplesSlider = createSlider(10, 120, params.samples, 1);
  samplesSlider.parent(gSamples);
  samplesSlider.style('width', '220px');

  // 10. Line spacing (2D)
  const gLS = group('Line Spacing (2D)');
  lineSpacingSlider = createSlider(0, 10.0, params.lineSpacingFactor, 0.1);
  lineSpacingSlider.parent(gLS);
  lineSpacingSlider.style('width', '220px');

  // 11. Noise/Wave Speed
  const gSpeed = group('Noise/Wave Speed');
  speedSlider = createSlider(0, 5, params.speed, 0.1);
  speedSlider.parent(gSpeed);
  speedSlider.style('width', '220px');

  // 12. Scale Jitter
  const gScale = group('Scale Jitter');
  scaleSlider = createSlider(0, 0.3, params.scaleJitter, 0.005);
  scaleSlider.parent(gScale);
  scaleSlider.style('width', '220px');

  // 13. Columns
  const gCols = group('Columns');
  columnsSlider = createSlider(1, 6, params.columns, 1);
  columnsSlider.parent(gCols);
  columnsSlider.style('width', '220px');

  // 14+15 Colors nebeneinander
  const gColors = group('Colors');
  const colorsRow = createDiv();
  colorsRow.parent(gColors);
  colorsRow.style('display', 'flex');
  colorsRow.style('flex-direction', 'row');
  colorsRow.style('gap', '8px');
  colorsRow.style('align-items', 'center');

  const bgLabel = createSpan('Background');
  bgLabel.parent(colorsRow);
  bgPicker = createColorPicker('#0a0a0a');
  bgPicker.parent(colorsRow);

  const txtLabel = createSpan('Text');
  txtLabel.parent(colorsRow);
  textPicker = createColorPicker('#ffffff');
  textPicker.parent(colorsRow);

  // 16. Reset + Save (ohne Überschrift)
  const btnRow = createDiv();
  btnRow.parent(guiDiv);
  btnRow.style('display', 'flex');
  btnRow.style('flex-direction', 'column');
  btnRow.style('gap', '6px');

  // Reset dezenter
  btnReset = createButton('Reset');
  btnReset.parent(btnRow);
  btnReset.mousePressed(resetParamsAndSliders);
  btnReset.style('width', '220px');
  btnReset.style('height', '28px');
  btnReset.style('font-size', '13px');
  btnReset.style('font-weight', '500');
  btnReset.style('background-color', '#444');
  btnReset.style('color', '#ffffff');
  btnReset.style('border', 'none');
  btnReset.style('border-radius', '4px');
  btnReset.style('cursor', 'pointer');

  const saveRow = createDiv();
  saveRow.parent(btnRow);
  saveRow.style('display', 'flex');
  saveRow.style('flex-direction', 'row');
  saveRow.style('gap', '8px');

  btnSavePNG = createButton('Save PNG');
  btnSavePNG.parent(saveRow);
  btnSavePNG.mousePressed(() => saveCanvas('banner-3d', 'png'));

  btnSaveGIF = createButton('Save GIF');
  btnSaveGIF.parent(saveRow);
  btnSaveGIF.mousePressed(() => {
    if (typeof saveGif === 'function') {
      saveGif('banner-3d', gifDuration, { units: 'seconds', delay: 0 });
    } else {
      alert('saveGif() ist nicht verfügbar. Stelle sicher, dass du eine p5.js-Version mit saveGif verwendest oder die p5.gif-Erweiterung eingebunden ist.');
    }
  });

  textFont('sans-serif');
  fontReady = true;
}


// =======================
// RESET
// =======================

function resetParamsAndSliders() {
  params.fontSize = 20;
  params.distortion = 0;
  params.samples = 10;
  params.lineSpacingFactor = 0;
  params.speed = 0;
  params.scaleJitter = 0;
  params.spinSpeed = 0;
  params.shapeMode = 'lines';
  params.dragRotX = 0;
  params.dragRotY = 0;
  params.shapeScale = 0.1;
  params.columns = 1;

  fontSlider.value(20);
  distortionSlider.value(0);
  samplesSlider.value(10);
  lineSpacingSlider.value(0);
  speedSlider.value(0);
  scaleSlider.value(0);
  spinSpeedSlider.value(0);
  shapeScaleSlider.value(0.1);
  columnsSlider.value(1);

  shapeSelect.value('lines');
}


// =======================
// FONT HANDLING
// =======================

function handleFontFile(file) {
  if (!file || (file.subtype !== 'ttf' && file.subtype !== 'otf')) return;

  loadFont(
    file.data,
    f => {
      currentFont = f;
      fontReady = true;
    },
    () => {
      console.error('Could not load font from file input');
      fontReady = false;
    }
  );
}


// =======================
// FORMAT / CANVAS
// =======================

function onFormatChange() {
  const val = formatSelect.value();
  const parts = val.split('x');
  if (parts.length !== 2) return;

  const w = int(parts[0]);
  const h = int(parts[1]);

  params.bannerWidth = w;
  params.bannerHeight = h;
  resizeCanvas(w, h, true);
  updateCanvasRect();
}

function updateCanvasRect() {
  if (cnv && cnv.elt) {
    canvasRect = cnv.elt.getBoundingClientRect();
  }
}

function getColumnOffset(colIndex, totalCols) {
  const columnSpacing = params.fontSize * 4;
  const totalWidth = columnSpacing * (totalCols - 1);
  const startOffset = -totalWidth / 2;
  return startOffset + colIndex * columnSpacing;
}


// =======================
// DRAW
// =======================

function draw() {
  if (!fontReady) {
    background(0);
    resetMatrix();
    translate(-width / 2, -height / 2);
    textAlign(CENTER, CENTER);
    textSize(16);
    fill(255);
    text('Upload a .ttf or .otf font to see text in WEBGL', width / 2, height / 2);
    return;
  }

  params.fontSize          = fontSlider.value();
  params.distortion        = distortionSlider.value();
  params.samples           = samplesSlider.value();
  params.lineSpacingFactor = lineSpacingSlider.value();
  params.speed             = speedSlider.value();
  params.scaleJitter       = scaleSlider.value();
  params.spinSpeed         = spinSpeedSlider.value();
  params.columns           = columnsSlider ? columnsSlider.value() : 1;
  params.shapeScale        = shapeScaleSlider.value();

  drawBanner3D();
}


// =======================
// MAIN RENDER
// =======================

function drawBanner3D() {
  const bgCol = bgPicker.color();
  const txtCol = textPicker.color();
  background(red(bgCol), green(bgCol), blue(bgCol));

  textAlign(CENTER, CENTER);
  textSize(params.fontSize);
  if (currentFont) {
    textFont(currentFont);
  }

  drawingContext.disable(drawingContext.DEPTH_TEST);

  const t = frameCount * 0.03 * params.speed;
  const scJitter = 1 + params.scaleJitter * sin(t * 0.7);

  const spinAngleY = params.spinSpeed > 0 ? frameCount * 0.03 * params.spinSpeed : 0;
  rotateY(spinAngleY + params.dragRotY);
  rotateX(params.dragRotX);

  const r = red(txtCol);
  const g = green(txtCol);
  const b = blue(txtCol);

  if (params.shapeMode === 'lines') {
    drawLines2DColumns(r, g, b, t);
    drawingContext.enable(drawingContext.DEPTH_TEST);
    return;
  }

  if (params.distortion === 0 && params.scaleJitter === 0 && params.speed === 0) {
    for (let c = 0; c < params.columns; c++) {
      const cx = getColumnOffset(c, params.columns);
      push();
      translate(cx, 0, 0);
      fill(r, g, b, 255);
      text(params.text, 0, 0);
      pop();
    }
    drawingContext.enable(drawingContext.DEPTH_TEST);
    return;
  }

  drawFullTextOnShapeColumns(r, g, b, t, scJitter);

  drawingContext.enable(drawingContext.DEPTH_TEST);
}


// =======================
// 2D MODE
// =======================

function drawLines2DColumns(r, g, b, t) {
  const samples = params.samples;
  if (samples <= 0 || params.fontSize <= 0) return;

  for (let c = 0; c < params.columns; c++) {
    const cx = getColumnOffset(c, params.columns);
    push();
    translate(cx, 0, 0);
    drawLines2D(r, g, b, t);
    pop();
  }
}

function drawLines2D(r, g, b, t) {
  const samples = params.samples;
  if (samples <= 0 || params.fontSize <= 0) return;

  const baseSpacing = params.fontSize * 0.8;
  const lineSpacing = baseSpacing * params.lineSpacingFactor / max(1, samples / 2);
  const echoCount = 4;

  for (let i = 0; i < samples; i++) {
    const yOff = (i - samples / 2) * lineSpacing;
    const phase = i * 0.4;
    const xWave = params.distortion * sin(t + phase);

    for (let j = 0; j < echoCount; j++) {
      const nX = noise(i * 0.3, t + j * 0.1) * 2 - 1;
      const nY = noise(i * 0.3 + 100, t + j * 0.1) * 2 - 1;

      const offX = xWave + nX * params.distortion * 0.5;
      const offY = yOff + nY * params.distortion * 0.2;

      fill(r, g, b, 255);
      text(params.text, offX, offY);
    }
  }
}


// =======================
// 3D MODES
// =======================

function drawFullTextOnShapeColumns(r, g, b, t, scJitter) {
  const samples = params.samples;
  if (samples <= 0 || params.fontSize <= 0) return;

  let path;
  if (params.shapeMode === 'circle')      path = buildCirclePath(samples, t);
  else if (params.shapeMode === 'donut')  path = buildDonutPath(samples, t);
  else if (params.shapeMode === 'spiral') path = buildSpiralPath(samples, t);
  else if (params.shapeMode === 'cylinder') path = buildCylinderPath(samples, t);
  else return;

  if (!path || path.length < 2) return;

  const echoCount = 3;

  for (let c = 0; c < params.columns; c++) {
    const cx = getColumnOffset(c, params.columns);
    push();
    translate(cx, 0, 0);

    for (let e = 0; e < echoCount; e++) {
      for (let i = 0; i < path.length; i++) {
        const p = path[i];
        const nJ = noise(e * 10 + i * 0.2, t + e * 0.2) * 2 - 1;
        const echoScaleJ = 1 + nJ * 0.06;

        push();
        translate(p.x, p.y, p.z);
        rotateY(p.angleY);
        rotateX(p.angleX);
        scale(echoScaleJ * p.scale);
        fill(r, g, b, p.alpha);
        text(params.text, 0, 0);
        pop();
      }
    }

    pop();
  }
}


// ---------- Circle ----------

function buildCirclePath(samples, t) {
  const path = [];
  const layoutScale = min(width, height) / 800;
  const baseRadius = min(width, height) * 0.25 * layoutScale * params.shapeScale;

  for (let i = 0; i < samples; i++) {
    const a = map(i, 0, samples, 0, TWO_PI);
    const depth = sin(a + t * 0.5);

    const radius = baseRadius + depth * (params.distortion * 0.3 * params.shapeScale);
    const x = radius * cos(a);
    const z = radius * sin(a);
    const y = 0;

    const scaleVal = 1 + depth * 0.4;
    const alpha = map(depth, -1, 1, 80, 255);
    const angleY = -a + HALF_PI;
    const angleX = 0;

    path.push({ x, y, z, angleY, angleX, scale: scaleVal, alpha });
  }

  return path;
}


// ---------- Wave (Donut) ----------

function buildDonutPath(samples, t) {
  const path = [];
  const layoutScale = min(width, height) / 800;
  const R = min(width, height) * 0.2 * layoutScale * params.shapeScale;
  const rMinor = min(width, height) * 0.08 * layoutScale * params.shapeScale;

  for (let i = 0; i < samples; i++) {
    const theta = map(i, 0, samples, 0, TWO_PI);

    let phi = sin(theta * 2 + t) * 0.5 + 0.5;
    phi = map(phi, 0, 1, 0, TWO_PI);

    const baseDepth = sin(theta + t * 0.3);
    const noiseAmt = params.distortion * 0.3 * params.shapeScale;

    const nT = noise(i * 0.2, t) * 2 - 1;
    const nP = noise(i * 0.2 + 300, t) * 2 - 1;

    const Rn = R + nT * noiseAmt;
    const rn = rMinor + nP * noiseAmt * 0.6;

    const x = (Rn + rn * cos(phi)) * cos(theta);
    const z = (Rn + rn * cos(phi)) * sin(theta);
    const y = rn * sin(phi);

    const scaleVal = 1 + baseDepth * 0.4;
    const alpha = map(baseDepth, -1, 1, 70, 255);
    const angleY = -theta;
    const angleX = 0;

    path.push({ x, y, z, angleY, angleX, scale: scaleVal, alpha });
  }

  return path;
}


// ---------- Spiral ----------

function buildSpiralPath(samples, t) {
  const path = [];
  const layoutScale = min(width, height) / 800;
  const maxAngle = TWO_PI * 4;
  const radialStep = min(width, height) * 0.015 * layoutScale * params.shapeScale;
  const heightSpan = params.fontSize * samples * 0.15 * params.shapeScale;

  for (let i = 0; i < samples; i++) {
    const a = map(i, 0, samples, 0, maxAngle);

    const radius = radialStep * i + params.distortion * 0.02 * i * params.shapeScale;
    const yBase = map(i, 0, samples, -heightSpan / 2, heightSpan / 2);

    const depthWave = sin(a * 0.6 + t * 0.4);
    const nR = noise(i * 0.2, t) * 2 - 1;
    const nY = noise(i * 0.2 + 400, t) * 2 - 1;

    const rOff = radius + nR * params.distortion * 0.2 * params.shapeScale;
    const yOff = yBase + nY * params.distortion * 0.2 * params.shapeScale;

    const x = rOff * cos(a);
    const z = rOff * sin(a);

    const scaleVal = 1 + depthWave * 0.4;
    const alpha = map(depthWave, -1, 1, 60, 255);
    const angleY = -a + HALF_PI;
    const angleX = 0;

    path.push({ x, y: yOff, z, angleY, angleX, scale: scaleVal, alpha });
  }

  return path;
}


// ---------- DNA (Cylinder) ----------

function buildCylinderPath(samples, t) {
  const path = [];
  const layoutScale = min(width, height) / 800;
  const radius = min(width, height) * 0.25 * layoutScale * params.shapeScale;
  const heightSpan = params.fontSize * max(4, samples * 0.25) * params.shapeScale;

  for (let i = 0; i < samples; i++) {
    const a = map(i, 0, samples, 0, TWO_PI);

    const yBase = map(i, 0, samples, -heightSpan / 2, heightSpan / 2);
    const depthWave = sin(a + t * 0.4);

    const nA = noise(i * 0.25, t) * 2 - 1;
    const nY = noise(i * 0.25 + 500, t) * 2 - 1;

    const aC = a + nA * 0.2;
    const yOff = yBase + nY * params.distortion * 0.3 * params.shapeScale;

    const x = radius * cos(aC);
    const z = radius * sin(aC);

    const scaleVal = 1 + depthWave * 0.4;
    const alpha = map(depthWave, -1, 1, 70, 255);
    const angleY = -aC;
    const angleX = 0;

    path.push({ x, y: yOff, z, angleY, angleX, scale: scaleVal, alpha });
  }

  return path;
}


// =======================
// MOUSE DRAG ORBIT
// =======================

function mousePressed() {
  updateCanvasRect();
  if (!canvasRect) return;

  if (mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height) {
    isDragging = true;
    lastMouseX = mouseX;
    lastMouseY = mouseY;
  }
}

function mouseDragged() {
  if (!isDragging) return;

  const dx = mouseX - lastMouseX;
  const dy = mouseY - lastMouseY;

  params.dragRotY += dx * 0.01;
  params.dragRotX -= dy * 0.01;

  lastMouseX = mouseX;
  lastMouseY = mouseY;
}

function mouseReleased() {
  isDragging = false;
}
