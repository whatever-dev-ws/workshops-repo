let brushSize = 20;
let hueValue = 0;
let opacityValue = 255;
let brushColor;

const uiWidth = 260;       // Breite der schwarzen Sidebar links
const bgColor = [0, 0, 100];

let brushType = 1;
let eraseMode = false;

let softness = 0.8;
let taperAngleDeg = 10;
let airStrength = 1.0;

let uiLayer;
let canvasX;               // x-Offset der Zeichenfläche (rechts neben UI)

// Höhe der UI ist jetzt volle Höhe
function setup() {
  // Gesamtbreite = UI + Zeichenfläche
  createCanvas(uiWidth + 800, 600);
  canvasX = uiWidth;

  colorMode(HSB, 360, 100, 100, 255);
  background(0, 0, 20);
  noStroke();
  updateBrushColor();

  uiLayer = createGraphics(uiWidth, height);
  uiLayer.colorMode(HSB, 360, 100, 100, 255);
  uiLayer.noStroke();

  // Zeichenbereich initial füllen
  push();
  noStroke();
  fill(bgColor[0], bgColor[1], bgColor[2]);
  rect(canvasX, 0, width - canvasX, height);
  pop();
}

function draw() {
  let inDrawingArea = mouseIsPressed && mouseX > canvasX;

  if (inDrawingArea) {
    let localX = mouseX - canvasX;
    let localPX = pmouseX - canvasX;

    if (eraseMode) {
      push();
      stroke(bgColor[0], bgColor[1], bgColor[2]);
      strokeWeight(brushSize);
      line(mouseX, mouseY, pmouseX, pmouseY);
      pop();
      noStroke();
    } else {
      noStroke();
      fill(brushColor);
      drawBrushStroke(localX, mouseY, localPX, pmouseY, brushSize);
    }
  }

  drawUI();

  // UI links
  image(uiLayer, 0, 0);
}

// ---------- color ----------

function updateBrushColor() {
  brushColor = color(hueValue, 100, 100, opacityValue);
}

// ---------- brushes ----------

function drawBrushStroke(x, y, px, py, s) {
  let spacing = s * 0.05;
  let steps = max(1, int(dist(x, y, px, py) / spacing));

  for (let i = 0; i <= steps; i++) {
    let t = i / steps;
    let sx = lerp(px, x, t);
    let sy = lerp(py, y, t);
    drawBrushStamp(canvasX + sx, sy, s); // wieder in globale Koordinaten
  }
}

function drawBrushStamp(x, y, s) {
  // nicht ins UI malen
  if (x < canvasX) return;

  if (brushType === 1) {
    // Hard
    push();
    noStroke();
    fill(brushColor);
    circle(x, y, s);
    pop();

  } else if (brushType === 3) {
    // Soft mit einstellbarer softness
    push();
    noStroke();
    let rings = 8;
    for (let i = 0; i < rings; i++) {
      let t = i / (rings - 1);
      let radius = lerp(s * 0.2, s, t);
      let edgeFalloff = pow(1 - t, softness);
      let a = opacityValue * edgeFalloff * 0.9;
      fill(hueValue, 100, 100, a);
      circle(x, y, radius);
    }
    pop();

  } else if (brushType === 5) {
    // Tapered mit Winkel
    let speed = dist(mouseX, mouseY, pmouseX, pmouseY);
    let pressure = constrain(map(speed, 0, 40, 1.0, 0.6), 0.6, 1.0);
    let nibWidth  = s * 3.0 * pressure;
    let nibHeight = s * 0.35 * pressure;

    let nibAngle = radians(taperAngleDeg);

    push();
    translate(x, y);
    rotate(nibAngle);
    noStroke();
    rectMode(CENTER);

    fill(brushColor);
    rect(0, 0, nibWidth, nibHeight, nibHeight * 0.4);

    fill(hueValue, 100, 100, opacityValue * 0.3);
    rect(0, 0, nibWidth * 1.05, nibHeight * 1.4, nibHeight * 0.7);
    pop();

  } else if (brushType === 33) {
    // Airbrush
    push();
    noStroke();
    let baseCol = color(hueValue, 100, 100, opacityValue);

    let maxR = s * 1.2;
    let dotCount = int(200 * airStrength);

    for (let i = 0; i < dotCount; i++) {
      let a = random(TWO_PI);
      let rr = maxR * sqrt(random());

      let px2 = x + cos(a) * rr;
      let py2 = y + sin(a) * rr;
      if (px2 < canvasX) continue;

      let ps = random(s * 0.04, s * 0.16);
      let falloff = 1 - rr / maxR;
      let aMul = constrain(pow(falloff, 0.7) * airStrength, 0, 1);

      let col = baseCol;
      col.setAlpha(opacityValue * 0.6 * aMul);
      fill(col);
      circle(px2, py2, ps);
    }
    pop();
  }
}

// ---------- UI auf eigenem Layer ----------

function drawUI() {
  uiLayer.clear();

  let padding = 10;
  let y = 0;

  // Schwarzer Hintergrund
  uiLayer.noStroke();
  uiLayer.fill(0, 0, 0);
  uiLayer.rect(0, 0, uiLayer.width, uiLayer.height);

  // Size slider (oben)
  let sizeX = padding;
  let sizeY = y + padding;
  let sizeW = uiWidth - padding * 2;
  let sizeH = 16;

  uiLayer.fill(0, 0, 15);
  uiLayer.rect(sizeX, sizeY, sizeW, sizeH, 4);

  let knobX = map(brushSize, 2, 200, sizeX + 5, sizeX + sizeW - 5);
  uiLayer.fill(0, 0, 80);
  uiLayer.rect(knobX - 6, sizeY - 2, 12, sizeH + 4, 4);

  uiLayer.fill(0, 0, 90);
  uiLayer.textSize(12);
  uiLayer.textAlign(LEFT, TOP);
  uiLayer.text('Size ' + brushSize, sizeX, sizeY + sizeH + 4);

  // Hue bar
  let hueX = padding;
  let hueY = sizeY + sizeH + 28;
  let hueW = uiWidth - padding * 2;
  let hueH = 16;

  for (let i = 0; i < hueW; i++) {
    let h = map(i, 0, hueW, 0, 360);
    uiLayer.stroke(h, 100, 100, 255);
    uiLayer.line(hueX + i, hueY, hueX + i, hueY + hueH);
  }

  let hx = map(hueValue, 0, 360, hueX, hueX + hueW);
  uiLayer.stroke(0, 0, 0);
  uiLayer.strokeWeight(2);
  uiLayer.line(hx, hueY - 2, hx, hueY + hueH + 2);

  uiLayer.noStroke();
  uiLayer.fill(0, 0, 90);
  uiLayer.textSize(12);
  uiLayer.textAlign(LEFT, TOP);
  uiLayer.text('Hue', hueX, hueY + hueH + 4);

  // Opacity bar
  let opX = padding;
  let opY = hueY + hueH + 28;
  let opW = uiWidth - padding * 2;
  let opH = 16;

  let tile = 6;
  for (let xx = 0; xx < opW; xx += tile) {
    for (let yy = 0; yy < opH; yy += tile) {
      let even = (int(xx / tile) + int(yy / tile)) % 2 === 0;
      uiLayer.fill(0, 0, even ? 20 : 10);
      uiLayer.rect(opX + xx, opY + yy, tile, tile);
    }
  }

  for (let i = 0; i < opW; i++) {
    let a = map(i, 0, opW, 0, 255);
    uiLayer.stroke(hueValue, 100, 100, a);
    uiLayer.line(opX + i, opY, opX + i, opY + opH);
  }

  let ox = map(opacityValue, 0, 255, opX, opX + opW);
  uiLayer.stroke(0, 0, 0);
  uiLayer.strokeWeight(2);
  uiLayer.line(ox, opY - 2, ox, opY + opH + 2);

  uiLayer.noStroke();
  uiLayer.fill(0, 0, 90);
  uiLayer.textSize(12);
  uiLayer.textAlign(LEFT, TOP);
  uiLayer.text('Opacity', opX, opY + opH + 4);

  // Brush buttons row
  let btY1 = opY + opH + 40;
  let btW = (uiWidth - padding * 2 - 3 * 8) / 4;
  let btH = 24;
  let btX = padding;

  let hardX    = btX + (btW + 8) * 0;
  let softX    = btX + (btW + 8) * 1;
  let taperedX = btX + (btW + 8) * 2;
  let airX     = btX + (btW + 8) * 3;

  drawBrushButtonRectUI(hardX,    btY1, btW, btH, 1,  'Hard');
  drawBrushButtonRectUI(softX,    btY1, btW, btH, 3,  'Soft');
  drawBrushButtonRectUI(taperedX, btY1, btW, btH, 5,  'Tapered');
  drawBrushButtonRectUI(airX,     btY1, btW, btH, 33, 'Airbrush');

  // Brush-spezifische Slider
  let sliderY = btY1 + btH + 12;
  let sliderW = btW;
  let sliderH = 16;

  // Softness
  uiLayer.fill(0, 0, 15);
  uiLayer.rect(softX, sliderY, sliderW, sliderH, 4);
  let knobSoftX = map(softness, 0.1, 4.0, softX + 5, softX + sliderW - 5);
  uiLayer.fill(0, 0, 80);
  uiLayer.rect(knobSoftX - 6, sliderY - 2, 12, sliderH + 4, 4);
  uiLayer.fill(0, 0, 90);
  uiLayer.textSize(11);
  uiLayer.textAlign(LEFT, TOP);
  uiLayer.text('Softness', softX, sliderY + sliderH + 3);

  // Taper angle
  let taperY = sliderY;
  uiLayer.fill(0, 0, 15);
  uiLayer.rect(taperedX, taperY, sliderW, sliderH, 4);
  let knobAngX = map(taperAngleDeg, -90, 90, taperedX + 5, taperedX + sliderW - 5);
  uiLayer.fill(0, 0, 80);
  uiLayer.rect(knobAngX - 6, taperY - 2, 12, sliderH + 4, 4);
  uiLayer.fill(0, 0, 90);
  uiLayer.textSize(11);
  uiLayer.textAlign(LEFT, TOP);
  uiLayer.text('Angle ' + int(taperAngleDeg) + '°', taperedX, taperY + sliderH + 3);

  // Air strength
  let airY = sliderY;
  uiLayer.fill(0, 0, 15);
  uiLayer.rect(airX, airY, sliderW, sliderH, 4);
  let knobAirX = map(airStrength, 0.0, 1.0, airX + 5, airX + sliderW - 5);
  uiLayer.fill(0, 0, 80);
  uiLayer.rect(knobAirX - 6, airY - 2, 12, sliderH + 4, 4);
  uiLayer.fill(0, 0, 90);
  uiLayer.textSize(11);
  uiLayer.textAlign(LEFT, TOP);
  uiLayer.text('Strength ' + nf(airStrength, 1, 2), airX, airY + sliderH + 3);

  // Erase + Clear + Save row
  let btY2 = airY + sliderH + 26;
  drawModeButtonRectUI(btX,                   btY2, btW, btH, 'Erase', true);
  drawClearButtonRectUI(btX + (btW + 8) * 1,  btY2, btW, btH);
  drawSaveButtonRectUI(btX + (btW + 8) * 2,   btY2, btW, btH);
}

// Buttons

function drawBrushButtonRectUI(x, y, w, h, typeId, label) {
  uiLayer.stroke(0, 0, 40);
  uiLayer.strokeWeight(1);
  let active = (brushType === typeId && !eraseMode);
  uiLayer.fill(active ? color(0, 0, 40) : color(0, 0, 15));
  uiLayer.rect(x, y, w, h, 4);

  uiLayer.noStroke();
  uiLayer.fill(0, 0, 90);
  uiLayer.textSize(11);
  uiLayer.textAlign(LEFT, CENTER);
  uiLayer.text(label, x + 6, y + h / 2);
}

function drawModeButtonRectUI(x, y, w, h, label, isEraseButton) {
  uiLayer.stroke(0, 0, 40);
  uiLayer.strokeWeight(1);

  let active = isEraseButton ? eraseMode : false;

  uiLayer.fill(active ? color(0, 0, 40) : color(0, 0, 15));
  uiLayer.rect(x, y, w, h, 4);

  uiLayer.noStroke();
  uiLayer.fill(0, 0, 90);
  uiLayer.textSize(11);
  uiLayer.textAlign(LEFT, CENTER);
  uiLayer.text(label, x + 6, y + h / 2);
}

function drawSaveButtonRectUI(x, y, w, h) {
  uiLayer.stroke(0, 0, 40);
  uiLayer.strokeWeight(1);
  uiLayer.fill(color(0, 0, 15));
  uiLayer.rect(x, y, w, h, 4);

  uiLayer.noStroke();
  uiLayer.fill(0, 0, 90);
  uiLayer.textSize(11);
  uiLayer.textAlign(LEFT, CENTER);
  uiLayer.text('Save', x + 6, y + h / 2);
}

function drawClearButtonRectUI(x, y, w, h) {
  uiLayer.stroke(0, 0, 40);
  uiLayer.strokeWeight(1);
  uiLayer.fill(color(0, 0, 15));
  uiLayer.rect(x, y, w, h, 4);

  uiLayer.noStroke();
  uiLayer.fill(0, 0, 90);
  uiLayer.textSize(11);
  uiLayer.textAlign(LEFT, CENTER);
  uiLayer.text('Clear', x + 6, y + h / 2);
}

// ---------- input ----------

function mousePressed() {
  // Klick in UI?
  if (mouseX <= uiWidth) {
    let localX = mouseX;
    let localY = mouseY;
    handleUIClick(localX, localY);
  }
}

function handleUIClick(mx, my) {
  let padding = 10;
  let y = 0;

  // Size slider
  let sizeX = padding;
  let sizeY = y + padding;
  let sizeW = uiWidth - padding * 2;
  let sizeH = 16;
  if (hitRect(mx, my, sizeX, sizeY, sizeW, sizeH)) {
    let v = map(mx, sizeX, sizeX + sizeW, 2, 200);
    brushSize = int(constrain(v, 2, 200));
    return;
  }

  // Hue bar
  let hueX = padding;
  let hueY = sizeY + sizeH + 28;
  let hueW = uiWidth - padding * 2;
  let hueH = 16;
  if (hitRect(mx, my, hueX, hueY, hueW, hueH)) {
    let h = map(mx, hueX, hueX + hueW, 0, 360);
    hueValue = constrain(h, 0, 360);
    updateBrushColor();
    return;
  }

  // Opacity bar
  let opX = padding;
  let opY = hueY + hueH + 28;
  let opW = uiWidth - padding * 2;
  let opH = 16;
  if (hitRect(mx, my, opX, opY, opW, opH)) {
    let a = map(mx, opX, opX + opW, 0, 255);
    opacityValue = int(constrain(a, 0, 255));
    updateBrushColor();
    return;
  }

  // Brush buttons row
  let btY1 = opY + opH + 40;
  let btW = (uiWidth - padding * 2 - 3 * 8) / 4;
  let btH = 24;
  let btX = padding;

  let hardX    = btX + (btW + 8) * 0;
  let softX    = btX + (btW + 8) * 1;
  let taperedX = btX + (btW + 8) * 2;
  let airX     = btX + (btW + 8) * 3;

  // Brush buttons
  if (hitRect(mx, my, hardX,    btY1, btW, btH)) { brushType = 1;  eraseMode = false; return; }
  if (hitRect(mx, my, softX,    btY1, btW, btH)) { brushType = 3;  eraseMode = false; return; }
  if (hitRect(mx, my, taperedX, btY1, btW, btH)) { brushType = 5;  eraseMode = false; return; }
  if (hitRect(mx, my, airX,     btY1, btW, btH)) { brushType = 33; eraseMode = false; return; }

  // Brush-spezifische Slider
  let sliderY = btY1 + btH + 12;
  let sliderW = btW;
  let sliderH = 16;

  // Softness
  if (hitRect(mx, my, softX, sliderY, sliderW, sliderH)) {
    let v = map(mx, softX, softX + sliderW, 0.1, 4.0);
    softness = constrain(v, 0.1, 4.0);
    return;
  }

  // Taper angle
  let taperY = sliderY;
  if (hitRect(mx, my, taperedX, taperY, sliderW, sliderH)) {
    let v = map(mx, taperedX, taperedX + sliderW, -90, 90);
    taperAngleDeg = constrain(v, -90, 90);
    return;
  }

  // Air strength
  let airY = sliderY;
  if (hitRect(mx, my, airX, airY, sliderW, sliderH)) {
    let v = map(mx, airX, airX + sliderW, 0.0, 1.0);
    airStrength = constrain(v, 0.0, 1.0);
    return;
  }

  // Erase + Clear + Save row
  let btY2 = airY + sliderH + 26;

  // Erase
  if (hitRect(mx, my, btX, btY2, btW, btH)) {
    eraseMode = true;
    return;
  }

  // Clear (nur Zeichenbereich)
  if (hitRect(mx, my, btX + (btW + 8) * 1, btY2, btW, btH)) {
    push();
    noStroke();
    fill(bgColor[0], bgColor[1], bgColor[2]);
    rect(canvasX, 0, width - canvasX, height);
    pop();
    return;
  }

  // Save (nur Zeichenbereich)
  if (hitRect(mx, my, btX + (btW + 8) * 2, btY2, btW, btH)) {
    let img = get(canvasX, 0, width - canvasX, height);
    img.save('drawing', 'png');
    return;
  }
}

function mouseDragged() {
  // Zeichnen passiert in draw()
}

function keyPressed() {
  if (key === '[') {
    brushSize = max(2, brushSize - 2);
  } else if (key === ']') {
    brushSize = min(200, brushSize + 2);
  } else if (key === 'c' || key === 'C') {
    push();
    noStroke();
    fill(bgColor[0], bgColor[1], bgColor[2]);
    rect(canvasX, 0, width - canvasX, height);
    pop();
  } else if (key === 'e' || key === 'E') {
    eraseMode = !eraseMode;
  }
}

function hitRect(mx, my, x, y, w, h) {
  return mx > x && mx < x + w && my > y && my < y + h;
}
