let textInput, modeSelect, sizeSlider, speedSlider, ampSlider, fontSelect, repetitionSlider;
let textColorPicker, bgColorPicker;
let pg;
let exporting = false;
let gifBtn;
let customFont;
const exportDuration = 2; // Dauer in Sekunden für den Loop

function setup() {
  let cnv = createCanvas(windowWidth - 200, windowHeight);
  cnv.style('position', 'fixed');
  cnv.style('left', '200px');
  cnv.style('top', '0');
  
  pixelDensity(1);
  
  let menu = createDiv();
  menu.id('menu-container');
  menu.style('position', 'fixed');
  menu.style('top', '0');
  menu.style('left', '0');
  menu.style('width', '200px');
  menu.style('height', '100vh');
  menu.style('background', '#0f0f0f');
  menu.style('padding', '15px');
  menu.style('display', 'flex');
  menu.style('flex-direction', 'column');
  menu.style('gap', '8px');
  menu.style('color', 'white');
  menu.style('font-family', 'sans-serif');
  menu.style('font-size', '11px');
  menu.style('z-index', '1000');
  menu.style('border-right', '1px solid #333');
  menu.style('box-sizing', 'border-box');

  createLabel('TEXT INPUT', menu);
  textInput = createInput('KINETIC').parent(menu);
  textInput.style('width', '100%');

  createLabel('FONT', menu);
  fontSelect = createSelect().parent(menu);
  ['Impact', 'Arial Black', 'Monospace', 'Georgia'].forEach(f => fontSelect.option(f));
  
  let fileInput = createFileInput(handleFile);
  fileInput.parent(menu);
  fileInput.id('font-upload');
  fileInput.style('display', 'none'); 

  let uploadBtn = createButton('UPLOAD FONT');
  uploadBtn.parent(menu);
  uploadBtn.style('background', '#333').style('color', '#fff').style('border', '1px solid #555').style('padding', '5px').style('cursor', 'pointer').style('font-size', '10px');
  uploadBtn.mousePressed(() => document.getElementById('font-upload').click());

  createLabel('EFFECT', menu);
  modeSelect = createSelect().parent(menu);
  ['Wave', 'RGB-Shift', 'Grid-Rotate', 'Liquify', 'Noise', 'Strobe'].forEach(m => modeSelect.option(m));

  let colorContainer = createDiv().parent(menu).style('display', 'flex').style('justify-content', 'space-between');
  let c1 = createDiv().parent(colorContainer);
  createLabel('TEXT', c1);
  textColorPicker = createColorPicker('#ffffff').parent(c1);
  let c2 = createDiv().parent(colorContainer);
  createLabel('BG', c2);
  bgColorPicker = createColorPicker('#000000').parent(c2);

  createLabel('SIZE', menu);
  sizeSlider = createSlider(10, 500, 150).parent(menu);
  
  createLabel('REPEAT', menu);
  repetitionSlider = createSlider(1, 20, 1).parent(menu);
  
  createLabel('SPEED', menu);
  // Speed bestimmt nun die Anzahl der Zyklen im Loop (1 bis 10)
  speedSlider = createSlider(1, 10, 2, 1).parent(menu);
  
  createLabel('AMOUNT', menu);
  ampSlider = createSlider(0, 500, 50).parent(menu);

  createDiv('').parent(menu).style('margin-top', '10px').style('border-top', '1px solid #333');

  let pngBtn = createButton('SAVE PNG').parent(menu);
  pngBtn.mousePressed(() => saveCanvas('design', 'png'));

  gifBtn = createButton('EXPORT GIF');
  gifBtn.parent(menu);
  gifBtn.style('background', '#e74c3c').style('color', 'white').style('border', 'none').style('padding', '8px').style('cursor', 'pointer').style('font-weight', 'bold');
  gifBtn.mousePressed(startGifExport);

  let restartBtn = createButton('RESET').parent(menu);
  restartBtn.style('margin-top', '5px').style('background', '#444').style('color', 'white').style('border', 'none').style('padding', '5px');
  restartBtn.mousePressed(resetTool);

  pg = createGraphics(width, height);
}

function handleFile(file) {
  if (file.type === 'font' || file.name.endsWith('.ttf') || file.name.endsWith('.otf')) {
    loadFont(file.data, (f) => {
      customFont = f;
      let fontName = file.name.split('.')[0];
      fontSelect.option(fontName);
      fontSelect.selected(fontName);
    });
  }
}

function windowResized() {
  resizeCanvas(windowWidth - 200, windowHeight);
  pg = createGraphics(width, height);
}

function createLabel(txt, parent) {
  let s = createSpan(txt).parent(parent);
  s.style('font-weight', 'bold').style('margin-top', '5px').style('color', '#888');
}

function startGifExport() {
  if (exporting) return;
  exporting = true;
  gifBtn.html('RENDERING...');
  
  frameCount = 0; 

  saveGif('kinetic_loop.gif', exportDuration, {
    units: 'seconds',
    framerate: 30,
    quality: 10,
    loop: true,
    onComplete: () => resetTool()
  });
}

function resetTool() {
  exporting = false;
  gifBtn.html('EXPORT GIF');
  loop();
}

function draw() {
  let bg = bgColorPicker.value();
  background(bg);
  
  pg.background(bg);
  pg.fill(textColorPicker.value());
  pg.textAlign(CENTER, CENTER);
  
  let currentFontName = fontSelect.value();
  if (customFont && currentFontName !== 'Impact' && currentFontName !== 'Arial Black' && currentFontName !== 'Monospace' && currentFontName !== 'Georgia') {
    pg.textFont(customFont);
  } else {
    pg.textFont(currentFontName);
  }
  
  pg.textSize(sizeSlider.value());
  
  let reps = repetitionSlider.value();
  let cellW = width / reps;
  let cellH = height / reps;
  
  for (let i = 0; i < reps; i++) {
    for (let j = 0; j < reps; j++) {
      pg.text(textInput.value(), i * cellW + cellW/2, j * cellH + cellH/2);
    }
  }

  applyKineticEffect();
}

function applyKineticEffect() {
  let mode = modeSelect.value();
  let amp = ampSlider.value();
  let speedMultiplier = speedSlider.value(); 
  
  // Berechnung für perfekten Loop:
  // t läuft von 0 bis 1 über die gesamte exportDuration
  let totalFrames = exportDuration * 60;
  let t = (frameCount % totalFrames) / totalFrames;
  
  // Angle macht genau 'speedMultiplier' volle Umdrehungen pro Loop
  let angle = t * TWO_PI * speedMultiplier; 

  if (mode === 'Wave') {
    let segments = 50;
    let h = height / segments;
    for (let y = 0; y < segments; y++) {
      let xOffset = sin(angle + y * 0.15) * amp;
      copy(pg, 0, y * h, width, h, xOffset, y * h, width, h);
    }
  } else if (mode === 'RGB-Shift') {
    let shift = sin(angle) * (amp/2);
    image(pg, 0, 0);
    blendMode(SCREEN);
    tint(255, 0, 0); image(pg, shift, 0);
    tint(0, 255, 0); image(pg, -shift, 0);
    blendMode(BLEND);
    noTint();
  } else if (mode === 'Grid-Rotate') {
    let res = 10;
    let w = width / res;
    let h = height / res;
    for (let i = 0; i < res; i++) {
      for (let j = 0; j < res; j++) {
        push();
        translate(i * w + w/2, j * h + h/2);
        rotate(sin(angle + (i+j)*0.3) * (amp/80));
        image(pg, -w/2, -h/2, w, h, i*w, j*h, w, h);
        pop();
      }
    }
  } else if (mode === 'Liquify') {
    let res = 20;
    let w = width / res;
    let h = height / res;
    for (let i = 0; i < res; i++) {
      for (let j = 0; j < res; j++) {
        let d = dist(mouseX - 200, mouseY, i * w, j * h);
        let shift = map(d, 0, 300, amp, 0, true) * sin(angle);
        copy(pg, i * w, j * h, w, h, i * w + shift, j * h + shift, w, h);
      }
    }
  } else if (mode === 'Noise') {
    let segments = 60;
    let h = height / segments;
    for (let y = 0; y < segments; y++) {
      // Noise-Loop durch Kreis-Sampling (cos/sin von angle)
      let n = (noise(cos(angle) + 1, sin(angle) + 1, y * 0.1) - 0.5) * amp * 2;
      copy(pg, 0, y * h, width, h, n, y * h, width, h);
    }
  } else if (mode === 'Strobe') {
    // Strobe muss synchron zur Framerate sein, um zu loopen
    if (floor(t * 20) % 2 === 0) {
      image(pg, random(-amp/8, amp/8), random(-amp/8, amp/8));
    } else {
      image(pg, 0, 0);
    }
  }
}

