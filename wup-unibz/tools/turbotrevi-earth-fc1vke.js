// =====================================================
// STRATI TEMPORALI — LUCE E TEMPO
// VERSIONE FINALE — REC x6 + LOOP (FIX INTERAZIONE)
// =====================================================

// ---------------- CONFIG ----------------

const GRID_W = 80;
const GRID_H = 80;

const TILE_W = 7;
const TILE_H = 4;

const MAX_HEIGHT = 80;
const MIN_HEIGHT = -40;

// Mare
let baseSeaLevel = -10;
let seaAmplitude = 4;
let seaSpeed = 0.002;

// Pennello
let brushRadius = 3;
let brushStrength = 4;

// Modalità
let mode = "raise";
let contemplative = false;

// ---------------- RECORD SETTINGS ----------------

const RECORD_SPEED = 6;
const LOOP_COUNT = 3;
const LOOP_DURATION = 5;
const RECORD_FPS = 30;

// ---------------- DATA ----------------

let grid = [];
let time = 0;
let recordStartTime = 0;

// Luce
let lightDir = { x: -0.6, y: -0.8, z: 1 };

// ---------------- RECORDING ----------------

let recorder;
let recordedChunks = [];
let isRecording = false;

// ---------------- SETUP ----------------

function setup() {
  let c = createCanvas(windowWidth, windowHeight);
  pixelDensity(1);
  drawingContext.imageSmoothingEnabled = false;

  let stream = c.elt.captureStream(RECORD_FPS);
  recorder = new MediaRecorder(stream, { mimeType: "video/webm" });

  recorder.ondataavailable = e => {
    if (e.data.size > 0) recordedChunks.push(e.data);
  };

  recorder.onstop = saveRecording;

  initGrid();
  createUI();
}

// ---------------- GRID ----------------

function initGrid() {
  grid = [];
  for (let x = 0; x <= GRID_W; x++) {
    grid[x] = [];
    for (let y = 0; y <= GRID_H; y++) {
      let v = random(-5, 5);
      grid[x][y] = { h: v, target: v };
    }
  }
}

// ---------------- DRAW ----------------

function draw() {
  background(15);
  translate(width / 2, height / 4);

  let baseSpeed = contemplative ? 4 : 1;
  let tSpeed = isRecording ? baseSpeed * RECORD_SPEED : baseSpeed;
  time += tSpeed;

  if (isRecording) {
    let loopFrames = LOOP_DURATION * RECORD_FPS * RECORD_SPEED;
    time = recordStartTime + (frameCount % loopFrames);
  }

  let seaLevel =
    baseSeaLevel +
    sin(time * seaSpeed * TWO_PI) *
    (contemplative ? seaAmplitude * 2 : seaAmplitude);

  updateGrid(seaLevel);
  drawSurface(seaLevel);

  drawRecIndicator();
}

// ---------------- UPDATE ----------------

function updateGrid(seaLevel) {
  for (let x = 1; x < GRID_W; x++) {
    for (let y = 1; y < GRID_H; y++) {
      let c = grid[x][y];

      let matSpeed = map(abs(c.target), 0, MAX_HEIGHT, 0.18, 0.05);
      if (contemplative) matSpeed *= 2.5;
      if (isRecording) matSpeed *= RECORD_SPEED * 0.6;

      c.h = lerp(c.h, c.target, matSpeed);

      let avg =
        (grid[x - 1][y].h +
         grid[x + 1][y].h +
         grid[x][y - 1].h +
         grid[x][y + 1].h) / 4;

      let erosionStrength = contemplative ? 0.008 : 0.001;
      if (isRecording) erosionStrength *= RECORD_SPEED;

      c.target = lerp(c.target, avg, erosionStrength);
    }
  }
}

// ---------------- DRAW SURFACE ----------------

function drawSurface(seaLevel) {
  for (let y = 0; y < GRID_H; y++) {
    for (let x = 0; x < GRID_W; x++) {
      drawCell(x, y, seaLevel);
    }
  }
}

function drawCell(x, y, seaLevel) {
  let h00 = grid[x][y].h;
  let h10 = grid[x + 1][y].h;
  let h01 = grid[x][y + 1].h;
  let h11 = grid[x + 1][y + 1].h;

  let avgH = (h00 + h10 + h01 + h11) / 4;

  let p0 = iso(x, y, h00);
  let p1 = iso(x + 1, y, h10);
  let p2 = iso(x + 1, y + 1, h11);
  let p3 = iso(x, y + 1, h01);

  expand(p0, p1, p2, p3, 0.5);

  let nx = h00 - h10;
  let ny = h00 - h01;
  let nz = 8;
  let len = sqrt(nx * nx + ny * ny + nz * nz);
  nx /= len; ny /= len; nz /= len;

  let dot = nx * lightDir.x + ny * lightDir.y + nz * lightDir.z;
  let light = constrain(map(dot, 0, 1, 0.4, 1.1), 0.35, 1.15);

  let baseCol = getLandColor(avgH);
  fill(
    red(baseCol) * light,
    green(baseCol) * light,
    blue(baseCol) * light
  );

  noStroke();
  beginShape();
  vertex(p0.x, p0.y);
  vertex(p1.x, p1.y);
  vertex(p2.x, p2.y);
  vertex(p3.x, p3.y);
  endShape(CLOSE);

  if (avgH < seaLevel) {
    let wave = sin(time * 0.08 + x * 0.4 + y * 0.4) *
      (contemplative ? 3 : 1.5);

    let wp0 = iso(x, y, seaLevel + wave);
    let wp1 = iso(x + 1, y, seaLevel + wave);
    let wp2 = iso(x + 1, y + 1, seaLevel + wave);
    let wp3 = iso(x, y + 1, seaLevel + wave);

    expand(wp0, wp1, wp2, wp3, 0.5);

    fill(40, 90, 150, 170);
    beginShape();
    vertex(wp0.x, wp0.y);
    vertex(wp1.x, wp1.y);
    vertex(wp2.x, wp2.y);
    vertex(wp3.x, wp3.y);
    endShape(CLOSE);
  }
}

// ---------------- HELPERS ----------------

function iso(x, y, h) {
  return { x: (x - y) * TILE_W, y: (x + y) * TILE_H - h };
}

function expand(p0, p1, p2, p3, a) {
  p0.x -= a; p0.y -= a;
  p1.x += a; p1.y -= a;
  p2.x += a; p2.y += a;
  p3.x -= a; p3.y += a;
}

function getLandColor(h) {
  if (h < baseSeaLevel) return color(60, 80, 90);
  if (h < 10) return color(70, 120, 80);
  if (h < 30) return color(120, 130, 90);
  if (h < 60) return color(155, 155, 155);
  return color(230);
}

// ---------------- RECORDING ----------------

function startRecording() {
  recordedChunks = [];
  recordStartTime = time;
  recorder.start();
  isRecording = true;

  setTimeout(stopRecording, LOOP_DURATION * LOOP_COUNT * 1000);
}

function stopRecording() {
  if (isRecording) recorder.stop();
  isRecording = false;
}

function saveRecording() {
  let blob = new Blob(recordedChunks, { type: "video/webm" });
  let url = URL.createObjectURL(blob);

  let a = document.createElement("a");
  a.href = url;
  a.download = "strati_temporali_loop_x6.webm";
  a.click();

  URL.revokeObjectURL(url);
}

function drawRecIndicator() {
  if (!isRecording) return;
  resetMatrix();
  fill(220, 50, 50);
  noStroke();
  ellipse(width - 30, 30, 10);
}

// ---------------- INTERACTION ----------------

function mouseDragged() {
  if (contemplative) return;   // 🔥 FIX: registrazione NON blocca più

  let m = screenToGrid(mouseX, mouseY);
  if (!m) return;

  for (let x = 0; x <= GRID_W; x++) {
    for (let y = 0; y <= GRID_H; y++) {
      let d = dist(x, y, m.x, m.y);
      if (d < brushRadius) {
        let influence = map(d, 0, brushRadius, 1, 0);
        let delta = influence * brushStrength;
        grid[x][y].target += mode === "raise" ? delta : -delta;
        grid[x][y].target = constrain(grid[x][y].target, MIN_HEIGHT, MAX_HEIGHT);
      }
    }
  }
}

// ---------------- SCREEN → GRID ----------------

function screenToGrid(mx, my) {
  let sx = mx - width / 2;
  let sy = my - height / 4;
  let y = (sy / TILE_H - sx / TILE_W) / 2;
  let x = (sy / TILE_H + sx / TILE_W) / 2;
  return { x: floor(x), y: floor(y) };
}

// ---------------- UI ----------------

function createUI() {
  let panel = createDiv();
  panel.position(20, 20);
  panel.style("color", "#ddd");
  panel.style("font-family", "Arial, sans-serif");
  panel.style("font-size", "12px");

  panel.child(createP("STRATI TEMPORALI"));

  let btnRaise = createButton("INNALZA");
  let btnLower = createButton("ABBASSA");
  let btnView = createButton("CONTEMPLA");
  let btnRec = createButton("● REC");

  btnRaise.mousePressed(() => mode = "raise");
  btnLower.mousePressed(() => mode = "lower");
  btnView.mousePressed(() => contemplative = !contemplative);

  btnRec.mousePressed(() => {
    isRecording ? stopRecording() : startRecording();
    btnRec.html(isRecording ? "STOP" : "● REC");
  });

  panel.child(btnRaise);
  panel.child(btnLower);
  panel.child(btnView);
  panel.child(btnRec);
}
