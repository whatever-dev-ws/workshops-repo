//WUP 2025-26
//Hristina Kukusheva

/**
 * Raster Tool generico (p5.js)
 * - Sorgente: immagine caricata o webcam
 * - Modalità: dots, lines, pixels, cross
 * - Controlli: cell size, contrast, angle, invert, color mode, opacity
 * - Download PNG
 */

let canvas;
let srcImg;         // immagine sorgente (p5.Image)
let cam;            // webcam (p5.Video)
let useCam = false; // usare webcam?
let ready = false;  // sorgente disponibile?

// Toolbar controls
let modeSelect, cellSlider, contrastSlider, angleSlider, invertCheckbox;
let colorSelect, opacitySlider;
let loadImgBtn, useCamBtn, saveBtn;

const W = 960;
const H = 540;

function preload() {
  // opzionale: caricare un’immagine di default (commentata)
  // srcImg = loadImage('https://picsum.photos/960/540');
}

function setup() {
  canvas = createCanvas(W, H);
  canvas.parent(document.body);
  pixelDensity(1);
  background(246);

  // Drag&Drop
  canvas.drop(handleFileDrop);

  // Toolbar
  buildToolbar();

  // Webcam opzionale (non attiva di default)
  // Attendere che l’utente scelga la sorgente
  textFont('sans-serif');
}

function draw() {
  background(250);

  // Sorgente: mostra suggerimenti se non pronta
  if (!ready) {
    drawPlaceholder();
    return;
  }

  // Acquisizione frame sorgente
  let src = srcImg;
  if (useCam && cam) {
    src = cam;
    cam.loadPixels();
  } else if (srcImg) {
    srcImg.loadPixels();
  }

  // Parametri
  const mode = modeSelect.value();
  const cellSize = int(cellSlider.value());
  const angle = radians(angleSlider.value());
  const contrast = contrastSlider.value(); // gamma
  const invert = invertCheckbox.checked();
  const colorMode = colorSelect.value();
  const opacity = opacitySlider.value();

  // Pre-render: draw base
  push();
  translate(width / 2, height / 2);
  rotate(angle);
  translate(-width / 2, -height / 2);

  // Rasterizzazione per celle
  noStroke();
  rectMode(CORNER);

  // Itera griglia
  for (let y = 0; y < height; y += cellSize) {
    for (let x = 0; x < width; x += cellSize) {
      const sx = constrain(x, 0, src.width - 1);
      const sy = constrain(y, 0, src.height - 1);
      const c = src.get(sx, sy);

      // Luminanza [0..1]
      let lum = rgbToLuma(c[0], c[1], c[2]);

      // Gamma/contrasto
      lum = pow(lum, contrast);

      // Inversione
      if (invert) lum = 1.0 - lum;

      // Colore del segno
      const col = pickColor(c, lum, colorMode, opacity);

      // Disegno in base alla modalità
      if (mode === 'pixels') {
        // Mosaico pixelato
        noStroke();
        fill(col);
        rect(x, y, cellSize, cellSize);
      } else if (mode === 'dots') {
        // Punto con raggio proporzionale alla luce (o ombra)
        const r = (cellSize * 0.5) * lum; // scala raggio
        noStroke();
        fill(col);
        circle(x + cellSize / 2, y + cellSize / 2, r * 2);
      } else if (mode === 'lines') {
        // Linea orizzontale; spessore/alpha dalla luminanza
        const w = cellSize;
        const h = max(1, int(cellSize * 0.85 * lum));
        noFill();
        stroke(col);
        strokeWeight(h);
        // linea centrata nella cella
        const cx = x + cellSize / 2;
        const cy = y + cellSize / 2;
        line(cx - w / 2, cy, cx + w / 2, cy);
      } else if (mode === 'cross') {
        // Croce (+) con lunghezza/spessore variabile
        const len = cellSize * 0.5 * lum + 1;
        const sw = max(1, int(cellSize * 0.15));
        stroke(col);
        strokeWeight(sw);
        const cx = x + cellSize / 2;
        const cy = y + cellSize / 2;
        line(cx - len, cy, cx + len, cy);
        line(cx, cy - len, cx, cy + len);
      }
    }
  }

  pop();

  // Info overlay
  drawHUD();
}

// ---------- UI ----------

function buildToolbar() {
  const bar = createDiv();
  bar.style('display', 'flex');
  bar.style('gap', '8px');
  bar.style('align-items', 'center');
  bar.style('margin', '8px 0');
  bar.style('flex-wrap', 'wrap');
  bar.style('font-family', 'sans-serif');

  modeSelect = createSelect();
  modeSelect.option('dots');
  modeSelect.option('lines');
  modeSelect.option('pixels');
  modeSelect.option('cross');
  modeSelect.selected('dots');
  modeSelect.parent(bar);
  labelSmall(bar, 'Modalità');

  cellSlider = createSlider(4, 64, 12, 1);
  cellSlider.parent(bar);
  labelSmall(bar, 'Cell Size');

  contrastSlider = createSlider(0.2, 3.0, 1.0, 0.05);
  contrastSlider.parent(bar);
  labelSmall(bar, 'Contrast (gamma)');

  angleSlider = createSlider(-45, 45, 0, 1);
  angleSlider.parent(bar);
  labelSmall(bar, 'Angle (°)');

  invertCheckbox = createCheckbox('Invert', false);
  invertCheckbox.parent(bar);

  colorSelect = createSelect();
  colorSelect.option('grayscale');
  colorSelect.option('original');
  colorSelect.option('single-color');
  colorSelect.selected('grayscale');
  colorSelect.parent(bar);
  labelSmall(bar, 'Color Mode');

  opacitySlider = createSlider(20, 255, 220, 1);
  opacitySlider.parent(bar);
  labelSmall(bar, 'Opacity');

  loadImgBtn = createButton('Carica immagine');
  loadImgBtn.parent(bar);
  loadImgBtn.mousePressed(() => {
    const inp = createFileInput(handleFileInput);
    inp.elt.click();
  });

  useCamBtn = createButton('Usa webcam');
  useCamBtn.parent(bar);
  useCamBtn.mousePressed(toggleCam);

  saveBtn = createButton('Salva PNG');
  saveBtn.parent(bar);
  saveBtn.mousePressed(() => {
    saveCanvas(canvas, 'rasterfoto', 'png');
  });
}

function labelSmall(parentDiv, txt) {
  const sp = createSpan(' ' + txt);
  sp.parent(parentDiv);
  sp.style('font-size', '12px');
  sp.style('color', '#555');
}

// ---------- Helpers ----------

function drawPlaceholder() {
  push();
  fill(235);
  rect(0, 0, width, height);

  fill(90);
  textAlign(CENTER, CENTER);
  textSize(18);
  text(
    "Raster Tool (p5.js)\n\nTrascina un'immagine qui, premi 'Carica immagine' o 'Usa webcam'.\n" +
    "Poi regola i parametri nella toolbar (modalità, cell size, contrasto, angolo, ecc.).",
    width / 2, height / 2
  );
  pop();
}

function drawHUD() {
  push();
  noStroke();
  fill(255, 245);
  rect(10, height - 60, 300, 50, 8);
  fill(30);
  textSize(12);
  textAlign(LEFT, TOP);
  const info = [
    `Mode: ${modeSelect.value()}`,
    `Cell: ${cellSlider.value()} px`,
    `Gamma: ${nf(contrastSlider.value(), 1, 2)}`,
    `Angle: ${angleSlider.value()}°`,
    `Invert: ${invertCheckbox.checked() ? 'on' : 'off'}`,
    `Color: ${colorSelect.value()}`,
    `Opacity: ${opacitySlider.value()}`
  ].join(' | ');
  text(info, 18, height - 50);
  pop();
}

// Caricamento via pulsante
function handleFileInput(file) {
  if (file && file.type === 'image') {
    loadImage(file.data, img => {
      srcImg = fitToCanvas(img);
      useCam = false;
      ready = true;
      if (cam) {
        cam.remove();
        cam = null;
      }
    });
  }
}

// Drag&Drop direttamente sul canvas
function handleFileDrop(file) {
  if (file && file.type === 'image') {
    loadImage(file.data, img => {
      srcImg = fitToCanvas(img);
      useCam = false;
      ready = true;
      if (cam) {
        cam.remove();
        cam = null;
      }
    });
  }
}

function toggleCam() {
  if (!useCam) {
    // Avvia webcam
    cam = createCapture(VIDEO, () => {
      useCam = true;
      ready = true;
    });
    cam.size(W, H);
    cam.hide(); // non mostrare il video DOM, usiamo i pixel nel canvas
  } else {
    // Ferma webcam
    useCam = false;
    ready = !!srcImg;
    if (cam) {
      cam.remove();
      cam = null;
    }
  }
}

// Adatta immagine al canvas mantenendo proporzioni
function fitToCanvas(img) {
  const ratioCanvas = width / height;
  const ratioImg = img.width / img.height;

  let nw, nh;
  if (ratioImg > ratioCanvas) {
    nw = width;
    nh = int((img.height * width) / img.width);
  } else {
    nh = height;
    nw = int((img.width * height) / img.height);
  }
  const resized = createImage(nw, nh);
  img.resize(nw, nh);
  resized.copy(img, 0, 0, nw, nh, 0, 0, nw, nh);
  return resized;
}

// Luminanza percettiva (Rec. 709)
function rgbToLuma(r, g, b) {
  return constrain((0.2126 * r + 0.7152 * g + 0.0722 * b) / 255, 0, 1);
}

// Selezione colore del segno in base alla modalità
function pickColor(rgb, lum, mode, alpha) {
  let r = 0, g = 0, b = 0;
  if (mode === 'grayscale') {
    const v = int(map(lum, 0, 1, 0, 255));
    r = g = b = v;
  } else if (mode === 'original') {
    r = rgb[0];
    g = rgb[1];
    b = rgb[2];
  } else if (mode === 'single-color') {
    // un singolo colore modulato dalla luminanza (qui: blu)
    r = 20;
    g = 60;
    b = int(map(lum, 0, 1, 80, 255));
  }
  return color(r, g, b, alpha);
}
