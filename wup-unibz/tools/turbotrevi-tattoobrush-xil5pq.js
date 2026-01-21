// =====================================================
// TATTOO MACHINE BRUSH — FINAL STABLE VERSION
// p5.js — single file, no manual fixes needed
// =====================================================

// ---------- CANVAS LAYERS ----------
let skinBackground;   // SOLO colore + texture pelle
let tattooLayer;      // SOLO tatuaggio (puntini)

// ---------- TOOL ----------
let toolPos, mousePos;
let needlePhase = 0;
let needleFreq = 0.6;
let needleStroke = 14;
let lastDot = null;

const machineAngle = -Math.PI / 6;
const needleTipLocal = { x: 140, y: 0 };

// ---------- UI ----------
const UI_WIDTH = 260;

let dotSize = 0.5;
let dotSpacing = 0.5;
let sensitivity = 0.25;

let skinIndex = 5;
let inkIndex = 0;
let activeSlider = null;

// ---------- PALETTES ----------
const skinTones = [
  '#2b1b14', // 1 very dark
  '#4a3026', // 2 dark
  '#6f4a37', // 3 medium
  '#a06b4a', // 4 light
  '#e0b48a'  // 5 caucasian
];

const inkPalette = [
  '#0f0f0f',
  '#2a2a2a',
  '#3b2b2b',
  '#1c1c3a',
  '#3a1c2a'
];

// =====================================================

function setup() {
  createCanvas(windowWidth, windowHeight);

  skinBackground = createGraphics(width - UI_WIDTH, height);
  tattooLayer = createGraphics(width - UI_WIDTH, height);

  tattooLayer.noStroke();

  toolPos = createVector(width / 2, height / 2);
  mousePos = createVector(mouseX, mouseY);

  applySkinBackground();
}

// =====================================================
// DRAW LOOP
// =====================================================

function draw() {
  image(skinBackground, 0, 0);
  image(tattooLayer, 0, 0);

  mousePos.set(mouseX, mouseY);
  toolPos.lerp(mousePos, sensitivity);

  if (mouseIsPressed && toolPos.x < width - UI_WIDTH) {
    tattooDot();
  }

  if (toolPos.x < width - UI_WIDTH) {
    drawMachine(toolPos.x, toolPos.y);
  }

  drawUI();

  if (activeSlider) updateSlider();
}

// =====================================================
// TATTOO DOT ENGINE
// =====================================================

function tattooDot() {
  let osc = sin(needlePhase);

  if (osc > 0.75) {
    let tip = needleTipWorld();

    let spacing = map(dotSpacing, 0, 1, 0.6, 22);
    let size = map(dotSize, 0, 1, 1.2, 3.5);

    if (!lastDot || dist(tip.x, tip.y, lastDot.x, lastDot.y) > spacing) {
      let alpha = 200;

      // halo (sfumatura)
      tattooLayer.fill(0, 0, 0, alpha * 0.25);
      tattooLayer.ellipse(tip.x, tip.y, size * 2.6);

      // core
      let ink = color(inkPalette[inkIndex]);
      tattooLayer.fill(red(ink), green(ink), blue(ink), alpha);
      tattooLayer.ellipse(
        tip.x + random(-0.25, 0.25),
        tip.y + random(-0.25, 0.25),
        size
      );

      lastDot = createVector(tip.x, tip.y);
    }
  }

  needlePhase += needleFreq;
}

// =====================================================
// NEEDLE POSITION
// =====================================================

function needleTipWorld() {
  let osc = sin(needlePhase) * needleStroke;
  let lx = needleTipLocal.x + osc;
  let ly = needleTipLocal.y;

  let cosA = cos(machineAngle);
  let sinA = sin(machineAngle);

  return {
    x: toolPos.x + lx * cosA - ly * sinA,
    y: toolPos.y + lx * sinA + ly * cosA
  };
}

// =====================================================
// TATTOO MACHINE GRAPHICS
// =====================================================

function drawMachine(x, y) {
  push();
  translate(x, y);
  rotate(machineAngle);

  stroke(0);
  strokeWeight(3);

  fill(210);
  rect(-55, -28, 85, 38, 8);

  fill(190);
  ellipse(-20, -10, 20);
  ellipse(8, -10, 20);

  fill(170);
  rect(30, -8, 70, 16, 6);

  let osc = sin(needlePhase) * needleStroke;
  line(95 + osc, 0, 150 + osc, 0);

  pop();
}

// =====================================================
// UI PANEL
// =====================================================

function drawUI() {
  push();
  translate(width - UI_WIDTH, 0);

  fill(28);
  rect(0, 0, UI_WIDTH, height);

  fill(240);
  textSize(14);
  text("TATTOO SETTINGS", 20, 30);

  textSize(12);

  // Ink
  text("Ink", 20, 60);
  for (let i = 0; i < inkPalette.length; i++) {
    fill(inkPalette[i]);
    rect(20 + i * 40, 75, 30, 30, 6);
    if (inkIndex === i) {
      stroke(255); strokeWeight(3); noFill();
      rect(20 + i * 40, 75, 30, 30, 6);
      noStroke();
    }
  }

  fill(240);
  text("Dot size", 20, 140);
  drawSlider(20, 150, dotSize);

  text("Dot spacing", 20, 180);
  drawSlider(20, 190, dotSpacing);

  text("Sensitivity", 20, 220);
  drawSlider(20, 230, map(sensitivity, 0.05, 0.4, 0, 1));

  text("Skin tone", 20, 270);
  for (let i = 0; i < skinTones.length; i++) {
    fill(skinTones[i]);
    rect(20 + i * 40, 290, 30, 30, 6);
    if (skinIndex === i + 1) {
      stroke(255); strokeWeight(3); noFill();
      rect(20 + i * 40, 290, 30, 30, 6);
      noStroke();
    }
  }

  fill(240);
  rect(20, 340, 200, 40, 8);
  fill(20);
  textAlign(CENTER, CENTER);
  text("SAVE IMAGE", 120, 360);
  textAlign(LEFT, BASELINE);

  pop();
}

function drawSlider(x, y, value) {
  fill(80);
  rect(x, y, 200, 6, 3);
  fill(240);
  rect(x, y, value * 200, 6, 3);
}

// =====================================================
// INTERACTIONS
// =====================================================

function mousePressed() {
  if (mouseX > width - UI_WIDTH) {
    let ux = mouseX - (width - UI_WIDTH);

    // Ink
    if (mouseY > 75 && mouseY < 105) {
      let i = floor((ux - 20) / 40);
      if (inkPalette[i]) inkIndex = i;
    }

    // Skin
    if (mouseY > 290 && mouseY < 320) {
      let i = floor((ux - 20) / 40);
      if (skinTones[i]) {
        skinIndex = i + 1;
        applySkinBackground();
      }
    }

    // Sliders
    if (ux > 20 && ux < 220) {
      if (mouseY > 150 && mouseY < 160) activeSlider = "dotSize";
      if (mouseY > 190 && mouseY < 200) activeSlider = "dotSpacing";
      if (mouseY > 230 && mouseY < 240) activeSlider = "sensitivity";
    }

    // SAVE IMAGE — DOWNLOAD GARANTITO
    if (mouseY > 340 && mouseY < 380) {
      let exportImg = createGraphics(tattooLayer.width, tattooLayer.height);
      exportImg.image(skinBackground, 0, 0);
      exportImg.image(tattooLayer, 0, 0);
      save(exportImg, `tattoo_${Date.now()}.png`);
    }

    return;
  }
}

function mouseReleased() {
  activeSlider = null;
  lastDot = null;
}

function updateSlider() {
  let v = constrain((mouseX - (width - UI_WIDTH + 20)) / 200, 0, 1);
  if (activeSlider === "dotSize") dotSize = v;
  if (activeSlider === "dotSpacing") dotSpacing = v;
  if (activeSlider === "sensitivity") sensitivity = map(v, 0, 1, 0.05, 0.4);
}

// =====================================================
// SKIN BACKGROUND (NON DISTRUTTIVO)
// =====================================================

function applySkinBackground() {
  skinBackground.background(skinTones[skinIndex - 1]);

  skinBackground.loadPixels();
  for (let i = 0; i < skinBackground.pixels.length; i += 4) {
    let n = random(-6, 6);
    skinBackground.pixels[i] += n;
    skinBackground.pixels[i + 1] += n;
    skinBackground.pixels[i + 2] += n;
  }
  skinBackground.updatePixels();
}

// =====================================================

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  skinBackground.resizeCanvas(width - UI_WIDTH, height);
  tattooLayer.resizeCanvas(width - UI_WIDTH, height);
  applySkinBackground();
}
