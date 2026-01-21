let numSegments = 24;
let rings = [];
let t = 0;

// GIF export (50 Frames)
let gifFrames = 100;

// Rotation
let rotSpeed = 20;
let rotSlider;

// Clay deformation
let clayCenter;
let clayActive = false;
let clayRadius = 260;
let clayIntensity = 1.4;

// UI
let numSegmentsSlider;
let gifButton;
let formatSelect;
let recolorButton;

// Canvas container
let sketchHolder;

// Color state
let baseHue = 0;
let palette = [];

// --- Color palette helpers ---

// Build a random kaleidoscope-style palette around a random base hue
function buildRandomKaleidoPalette() {
  baseHue = random(360);

  const pal = [];
  // base hue
  pal.push(baseHue);

  // analogous neighbors (soft variation)
  pal.push((baseHue + random(10, 25)) % 360);
  pal.push((baseHue - random(10, 25) + 360) % 360);

  // split complementary
  const comp = (baseHue + 180) % 360;
  pal.push((comp + random(8, 20)) % 360);
  pal.push((comp - random(8, 20) + 360) % 360);

  // extra accent between triadic positions
  pal.push((baseHue + random(90, 140)) % 360);

  palette = pal;
}

// backup palette from a given base hue (used for initial state)
function buildHarmonicPaletteFromBase(h0) {
  const pal = [];
  pal.push(h0);
  pal.push((h0 + 15 + 360) % 360);
  pal.push((h0 - 15 + 360) % 360);
  const comp = (h0 + 180) % 360;
  pal.push((comp + 15) % 360);
  pal.push((comp - 15 + 360) % 360);
  pal.push((h0 + 120 + 5) % 360);
  pal.push((h0 - 120 - 5 + 360) % 360);
  return pal;
}

// pick color from current palette (used only when generating / recoloring)
function pickHueFromPalette(weightMain = 0.5) {
  if (!palette || palette.length === 0) return baseHue;
  if (random() < weightMain) return palette[0]; // base hue
  const idx = floor(random(1, palette.length));
  let h = palette[idx] + random(-4, 4);
  return (h + 360) % 360;
}

// Only change colors, keep geometry
function recolorCurrentPattern() {
  if (!palette || palette.length === 0) {
    palette = buildHarmonicPaletteFromBase(baseHue);
  }

  for (let r of rings) {
    const weightMain = 0.65;
    for (let s of r.shapes) {
      const newHue = pickHueFromPalette(weightMain);
      s.hueBase = newHue;
      s.hueOffset = random(-2, 2);
    }
  }
}

function setup() {
  frameRate(45);
  colorMode(HSB, 360, 100, 100, 255);

  const container = createDiv();
  container.style('display', 'flex');
  container.style('height', '100vh');
  container.style('margin', '0');
  container.style('box-sizing', 'border-box');
  container.style(
    'font-family',
    'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  );

  const ui = createDiv();
  ui.parent(container);
  ui.style('width', '260px');
  ui.style('padding', '14px 12px');
  ui.style('box-sizing', 'border-box');
  ui.style('border-right', '1px solid #333');
  ui.style('background', '#050509');
  ui.style('font-size', '12px');
  ui.style('color', '#e5e5e5');
  ui.style('line-height', '1.3');

  sketchHolder = createDiv();
  sketchHolder.parent(container);
  sketchHolder.style('flex', '1');
  sketchHolder.style('display', 'flex');
  sketchHolder.style('justify-content', 'center');
  sketchHolder.style('align-items', 'center');
  sketchHolder.style('background', '#f5f5f5');

  const cnv = createCanvas(800, 800); // default bigger
  cnv.parent(sketchHolder);
  pixelDensity(1);

  const fullWidth = '100%';

  function sectionTitle(txt) {
    const t = createDiv(txt);
    t.parent(ui);
    t.style('margin-top', '10px');
    t.style('margin-bottom', '4px');
    t.style('font-size', '11px');
    t.style('text-transform', 'uppercase');
    t.style('letter-spacing', '0.08em');
    t.style('color', '#e5e5e5');
  }

  function makeSliderRow(label, min, max, val, step) {
    const row = createDiv();
    row.parent(ui);
    row.style('margin-bottom', '10px');

    const lab = createDiv(label);
    lab.parent(row);
    lab.style('margin-bottom', '3px');
    lab.style('font-size', '11px');
    lab.style('color', '#e5e5e5');

    const s = createSlider(min, max, val, step);
    s.parent(row);
    s.style('width', fullWidth);
    s.style('accent-color', '#ff4d9a');
    s.style('background', '#151520');
    return s;
  }

  // 1) Canvas format
  sectionTitle('Canvas');
  const formatRow = createDiv();
  formatRow.parent(ui);
  formatRow.style('margin-bottom', '10px');

  const formatLabel = createDiv('Canvas format');
  formatLabel.parent(formatRow);
  formatLabel.style('margin-bottom', '3px');
  formatLabel.style('font-size', '11px');
  formatLabel.style('color', '#e5e5e5');

  formatSelect = createSelect();
  formatSelect.parent(formatRow);
  formatSelect.style('width', fullWidth);
  formatSelect.style('padding', '4px 2px');
  formatSelect.style('background', '#151520');
  formatSelect.style('color', '#e5e5e5');

  // Bigger formats
  formatSelect.option('Square 1:1 (800×800)', '800x800');
  formatSelect.option('4:5 (800×1000)', '800x1000');
  formatSelect.option('3:4 (900×1200)', '900x1200');
  formatSelect.option('16:9 (1280×720)', '1280x720');
  formatSelect.selected('800x800');
  formatSelect.changed(onFormatChange);

  // 2) Color buttons section
  sectionTitle('Color');
  const colorRow = createDiv();
  colorRow.parent(ui);
  colorRow.style('margin-bottom', '10px');
  colorRow.style('color', '#e5e5e5');

  recolorButton = createButton('New Colors (Keep Shape)');
  recolorButton.parent(colorRow);
  recolorButton.style('width', fullWidth);
  recolorButton.style('padding', '6px 0');
  recolorButton.style('border', '1px solid #444');
  recolorButton.style('background', '#151520');
  recolorButton.style('color', '#ffffff');
  recolorButton.style('text-transform', 'uppercase');
  recolorButton.style('letter-spacing', '0.08em');
  recolorButton.style('cursor', 'pointer');
  recolorButton.mousePressed(() => {
    buildRandomKaleidoPalette(); // new random combo
    recolorCurrentPattern();     // apply to current geometry
  });

  // 3) Sliders
  sectionTitle('Structure');
  numSegmentsSlider = makeSliderRow(
    'Segments (mirrors)',
    4, 24, numSegments, 1
  );

  sectionTitle('Rotation');
  rotSlider = makeSliderRow(
    'Rotation speed (deg/loop)',
    0, 60, rotSpeed, 1
  );

  // 4) Save button
  sectionTitle('Export');
  gifButton = createButton('Save GIF (50 frames)');
  gifButton.parent(ui);
  gifButton.style('width', fullWidth);
  gifButton.style('padding', '6px 0');
  gifButton.style('border', '1px solid #444');
  gifButton.style('background', '#111');
  gifButton.style('color', '#ffffff');
  gifButton.style('text-transform', 'uppercase');
  gifButton.style('letter-spacing', '0.08em');
  gifButton.style('cursor', 'pointer');
  gifButton.mousePressed(() => {
    saveGif('kaleidoscope_loop', gifFrames, { units: 'frames' });
  });

  // Shortcuts box
  const hint = createDiv();
  hint.parent(ui);
  hint.style('margin-top', '10px');
  hint.style('padding', '8px 6px');
  hint.style('font-size', '11px');
  hint.style('line-height', '1.5');
  hint.style('color', '#e5e5e5');
  hint.style('border', '1px solid #444');
  hint.style('background', '#101020');
  hint.style('border-radius', '4px');

  hint.html(`
    <div style="font-weight:600; letter-spacing:0.06em; text-transform:uppercase; margin-bottom:4px;">
      Shortcuts
    </div>
    <div>Space – New random shape + palette</div>
    <div>New Colors – New random palette, keep shape</div>
    <div>S – Save GIF (50 frames)</div>
    <div>Mouse drag – Sculpt / deform</div>
  `);

  clayCenter = createVector(0, 0);

  // Initial: simple harmonic palette + pattern
  baseHue = 190;
  palette = buildHarmonicPaletteFromBase(baseHue);
  generatePattern();
}

function onFormatChange() {
  const value = formatSelect.value();
  const parts = value.split('x');
  const w = int(parts[0]);
  const h = int(parts[1]);
  resizeCanvas(w, h, true);
}

function draw() {
  numSegments = numSegmentsSlider.value();
  rotSpeed    = rotSlider.value();

  // loopT für Animation weiter wie bisher
  const loopT = (frameCount % (16 * 60)) / (16 * 60);
  t = loopT * 360;
  const globalRot = loopT * rotSpeed;

  background(0, 0, 100); // white

  translate(width / 2, height / 2);
  rotate(globalRot);

  const angleStep = 360 / numSegments;
  const spectrumShift = 0;

  // Layer 1
  for (let i = 0; i < numSegments; i++) {
    push();
    rotate(i * angleStep);
    if (i % 2 === 1) scale(-1, 1);
    drawRings(spectrumShift, 1.0, 0);
    pop();
  }

  // Layer 2
  push();
  rotate(5);
  for (let i = 0; i < numSegments; i++) {
    push();
    rotate(i * angleStep);
    if (i % 2 === 1) scale(-1, 1);
    drawRings(spectrumShift, 0.4, 10);
    pop();
  }
  pop();
}

function drawRings(segHueShift, alphaMul, timeOffset) {
  for (let r of rings) {
    const tt = (t + timeOffset) * r.speed;
    const baseR = r.radius + sin(tt + r.phase) * r.radAmp;

    for (let s of r.shapes) {
      const ang = s.baseAngle +
                  s.angle +
                  sin(tt * s.oscSpeed + s.oscPhase) * s.oscAmp;
      const rr  = baseR + s.radBase + s.radOffset;

      const x = cos(ang) * rr + s.offX;
      const y = sin(ang) * rr + s.offY;

      const newAng = atan2(y, x);
      const newR   = sqrt(x * x + y * y);

      push();
      rotate(newAng);
      translate(newR, 0);

      const spin = s.spinBase + tt * s.spinSpeed;
      rotate(spin);

      const sz = s.size * (1 + 0.16 * sin(tt * s.pulseSpeed + s.pulsePhase));

      let hue = s.hueBase;
      hue += s.hueOffset;
      hue += segHueShift;
      hue += tt * r.hueDrift;
      hue = (hue + 360) % 360;

      const a = r.alpha * alphaMul;
      fill(hue, r.sat, r.bri, a);

      if (s.type === "rect") {
        rectMode(CENTER);
        rect(0, 0, sz * 1.6, sz * 0.6, s.round);
      } else {
        triangle(
          -sz * 0.6, sz * 0.6,
           sz * 0.6, sz * 0.6,
           0,       -sz * 0.8
        );
      }
      pop();
    }
  }
}

function generatePattern() {
  rings = [];
  const numRings = 6;

  for (let i = 0; i < numRings; i++) {
    const radius = map(i, 0, numRings - 1, 40, min(width, height) * 0.45);
    const shapeCount = int(random(14, 26));

    const pastel = (i % 2 === 0);
    const sat = pastel ? random(45, 80) : random(70, 100);
    const bri = pastel ? random(80, 100) : random(75, 100);
    const alpha = pastel ? random(110, 200) : random(160, 245);

    const ring = {
      radius: radius,
      radAmp: random(2, 6),
      phase: random(360),
      speed: random(0.06, 0.22),
      hueDrift: random(-0.015, 0.015),
      sat: sat,
      bri: bri,
      alpha: alpha,
      shapes: []
    };

    for (let j = 0; j < shapeCount; j++) {
      const type = random() < 0.6 ? "rect" : "tri";

      const baseAngle = random(-5, 5);
      const radBase   = 0;

      const shapeHue = pickHueFromPalette(0.65);

      ring.shapes.push({
        type: type,
        size: random(10, 26),
        round: random(2, 12),
        baseAngle: baseAngle,
        radBase: radBase,
        angle: 0,
        radOffset: random(-8, 8),

        oscAmp: random(0.1, 1.4),
        oscSpeed: random(0.08, 0.35),
        oscPhase: random(360),
        pulseSpeed: random(0.08, 0.3),
        pulsePhase: random(360),
        spinBase: random(360),
        spinSpeed: random(-0.8, 0.8),

        hueBase: shapeHue,
        hueOffset: random(-2, 2),

        offX: 0,
        offY: 0
      });
    }

    rings.push(ring);
  }
}

// --- Clay interaction ---

function mousePressed() {
  if (mouseX < 0 || mouseX > width || mouseY < 0 || mouseY > height) return;
  clayActive = true;
  clayCenter = createVector(mouseX - width / 2, mouseY - height / 2);
}

function mouseDragged() {
  if (!clayActive) return;

  const localX = mouseX - width / 2;
  const localY = mouseY - height / 2;
  clayCenter.set(localX, localY);

  for (let r of rings) {
    for (let s of r.shapes) {
      const ang = s.baseAngle + s.angle;
      const rr  = r.radius + s.radBase + s.radOffset;

      const x = cos(ang) * rr + s.offX;
      const y = sin(ang) * rr + s.offY;

      const d = dist(x, y, clayCenter.x, clayCenter.y);
      if (d < clayRadius) {
        let influence = 1 - (d / clayRadius);
        influence = pow(influence, 2.5);

        let dirX = clayCenter.x - x;
        let dirY = clayCenter.y - y;

        const len = sqrt(dirX * dirX + dirY * dirY) || 1;
        dirX /= len;
        dirY /= len;

        const amount = clayIntensity * 3.5 * influence;
        s.offX += dirX * amount;
        s.offY += dirY * amount;
      }
    }
  }
}

function mouseReleased() {
  clayActive = false;
}

function keyPressed() {
  if (key === ' ') {
    // Space: completely new random palette + new geometry
    buildRandomKaleidoPalette();
    generatePattern();
  } else if (key === 's' || key === 'S') {
    saveGif('kaleidoscope_loop', gifFrames, { units: 'frames' });
  }
}
