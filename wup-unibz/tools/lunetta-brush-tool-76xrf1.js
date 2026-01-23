function setup() {
  createCanvas(400, 400);
}

function draw() {
  background(220);
}
let textInput, sizeSlider, effectSelect, paletteSelect, fontSelect, spacingSlider, fontUploadBtn;
let letters = [];
let currentIndex = 0;
let lastX, lastY;

let showWheel = false;
let customPalette = []; 
let colorIndex = 0;
let customFontsCount = 0;

// Variabili per il suono
let mic, vol = 0;
let audioActive = false; 
let audioBtn;

// Variabili per il salvataggio video
let recorder;
let chunks = [];
let isRecording = false;

const THEME = {
  bg: '#F9F7F2',      
  uiText: '#5E5A52',  
  accent: '#D4C5B9',  
  sidebarBg: '#EEEBE3', // Colore sidebar leggermente più scuro per visibilità
  canvasBg: '#FFFFFF',
  buttonBg: '#4A4741',
  sidebarW: 240 // Leggermente più larga per comodità
};

const palettes = {
  "Rainbow": null,
  "Cyberpunk": ["#00ff41", "#00d1ff", "#ff00ff", "#ffcc00"],
  "Bauhaus": ["#ff0000", "#ffcc00", "#0000ff", "#000000"],
  "Forest": ["#2d5a27", "#6b8e23", "#a0522d", "#deb887"],
  "Deep Sea": ["#000080", "#008b8b", "#20b2aa", "#e0ffff"],
  "Pastel": ["#ffb7b2", "#ffdac1", "#e2f0cb", "#b5ead7"],
  "Custom Palette": "custom"
};

const fonts = ["sans-serif", "serif", "monospace", "cursive", "fantasy", "Georgia", "Impact"];

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 360, 100, 100, 1);
  mic = new p5.AudioIn();

  let cX = 30; 
  let startY = 60;
  let gap = 55; // Spaziatura verticale costante tra i tool

  // --- CONTROLLI VERTICALI (Posizionamento preciso) ---
  
  textInput = createInput('TOUCH & DRAW');
  textInput.position(cX, startY);
  styleElement(textInput, 180);

  fontSelect = createSelect();
  fontSelect.position(cX, startY + gap);
  fonts.forEach(f => fontSelect.option(f));
  styleElement(fontSelect, 180);

  sizeSlider = createSlider(10, 120, 40);
  sizeSlider.position(cX, startY + gap * 2);
  sizeSlider.style('width', '180px');

  spacingSlider = createSlider(0.1, 2.0, 0.7, 0.1);
  spacingSlider.position(cX, startY + gap * 3);
  spacingSlider.style('width', '180px');

  effectSelect = createSelect();
  effectSelect.position(cX, startY + gap * 4);
  ['None', 'Ghost', 'Jiggle', 'Gravity'].forEach(o => effectSelect.option(o));
  styleElement(effectSelect, 180);

  paletteSelect = createSelect();
  paletteSelect.position(cX, startY + gap * 5);
  Object.keys(palettes).forEach(p => paletteSelect.option(p));
  paletteSelect.changed(() => {
    showWheel = (paletteSelect.value() === "Custom Palette");
  });
  styleElement(paletteSelect, 180);

  fontUploadBtn = createFileInput(handleFontUpload);
  fontUploadBtn.position(cX, startY + gap * 6);
  fontUploadBtn.style('font-size', '10px');
  fontUploadBtn.style('width', '180px');

  // --- PULSANTI AZIONE (Griglia per evitare sovrapposizioni in altezza) ---
  let btnStartY = startY + gap * 7.5;
  let btnH = 40;
  
  audioBtn = createButton('MIC: OFF');
  audioBtn.position(cX, btnStartY);
  styleButton(audioBtn);
  audioBtn.mousePressed(toggleAudio);

  let clearBtn = createButton('CLEAR CANVAS');
  clearBtn.position(cX, btnStartY + btnH + 10);
  styleButton(clearBtn);
  clearBtn.mousePressed(() => letters = []);

  let savePngBtn = createButton('SAVE PNG');
  savePngBtn.position(cX, btnStartY + (btnH + 10) * 2);
  styleButton(savePngBtn);
  savePngBtn.mousePressed(() => {
    let area = get(THEME.sidebarW + 10, 0, width - THEME.sidebarW, height);
    area.save('artwork.png');
  });

  let saveVidBtn = createButton('REC VIDEO');
  saveVidBtn.position(cX, btnStartY + (btnH + 10) * 3);
  styleButton(saveVidBtn);
  saveVidBtn.mousePressed(handleSave);

  lastX = mouseX; lastY = mouseY;
}

function styleElement(el, w) {
  el.style('border', '1px solid ' + THEME.accent);
  el.style('background', '#FFFFFF');
  el.style('padding', '6px');
  el.style('border-radius', '4px');
  el.style('width', w + 'px');
  el.style('color', THEME.uiText);
  el.style('font-family', 'Helvetica, sans-serif');
  el.style('font-size', '11px');
}

function styleButton(btn) {
  btn.style('background-color', THEME.buttonBg);
  btn.style('color', '#F9F7F2');
  btn.style('border', 'none');
  btn.style('width', '180px');
  btn.style('height', '35px');
  btn.style('border-radius', '20px');
  btn.style('cursor', 'pointer');
  btn.style('font-family', 'Helvetica, sans-serif');
  btn.style('font-size', '10px');
  btn.style('letter-spacing', '1px');
  btn.style('text-transform', 'uppercase');
}

function draw() {
  // Sfondo totale
  background(THEME.bg);
  
  // DISEGNO SIDEBAR (Rettangolo visibile)
  fill(THEME.sidebarBg);
  noStroke();
  rect(0, 0, THEME.sidebarW, height);

  // DISEGNO AREA BIANCA (Foglio di lavoro)
  fill(THEME.canvasBg);
  rect(THEME.sidebarW + 15, 15, width - THEME.sidebarW - 30, height - 30, 10);

  if (audioActive) {
    vol = lerp(vol, mic.getLevel(), 0.15);
  } else {
    vol = 0;
  }

  // Logica disegno (solo se fuori dalla sidebar)
  if (mouseIsPressed && !showWheel && mouseX > THEME.sidebarW + 15) {
    let content = textInput.value();
    let spacing = sizeSlider.value() * spacingSlider.value();
    
    if (dist(mouseX, mouseY, lastX, lastY) > spacing) {
      let selectedPal = paletteSelect.value();
      let c;
      if (selectedPal === "Rainbow") c = color(frameCount % 360, 80, 90);
      else if (selectedPal === "Custom Palette") {
        let colHex = customPalette.length > 0 ? customPalette[colorIndex % customPalette.length] : "#000";
        c = color(colHex);
        colorIndex++;
      } else c = color(random(palettes[selectedPal]));

      letters.push({
        char: content.charAt(currentIndex),
        x: mouseX, y: mouseY,
        angle: atan2(mouseY - lastY, mouseX - lastX),
        size: sizeSlider.value(),
        font: fontSelect.value(),
        col: c, opacity: 1, vx: random(-1, 1), vy: 0
      });
      currentIndex = (currentIndex + 1) % content.length;
      lastX = mouseX; lastY = mouseY;
    }
  }

  renderLetters();
  if (showWheel) drawPaletteStudio(width/2, height/2, 150);
  drawLabels();
}

function drawLabels() {
  push();
  fill(THEME.uiText);
  noStroke();
  textAlign(LEFT);
  textFont('Helvetica');
  
  let cX = 30;
  let startY = 60;
  let gap = 55;

  textSize(12);
  textStyle(BOLD);
  text('TYPOGRAPHY LAB', cX, 35);
  
  textStyle(NORMAL);
  textSize(9);
  text('INPUT TEXT', cX, startY - 8);
  text('TYPEFACE', cX, startY + gap - 8);
  text('FONT SIZE', cX, startY + gap * 2 - 8);
  text('SPACING', cX, startY + gap * 3 - 8);
  text('ANIMATION EFFECT', cX, startY + gap * 4 - 8);
  text('COLOR PALETTE', cX, startY + gap * 5 - 8);
  text('UPLOAD FONT (.TTF)', cX, startY + gap * 6 - 8);

  stroke(THEME.accent);
  line(cX, startY + gap * 6.8, THEME.sidebarW - 30, startY + gap * 6.8);
  pop();
}

// --- RESTO DELLE FUNZIONI (Audio, Font, Video) ---
function renderLetters() {
  for (let i = letters.length - 1; i >= 0; i--) {
    let l = letters[i];
    let mode = effectSelect.value();
    let audioSize = vol * 400; 
    let audioShake = vol * 60;

    push();
    translate(l.x + random(-audioShake, audioShake), l.y + random(-audioShake, audioShake));
    rotate(l.angle);
    if (mode === 'Ghost') l.opacity -= 0.01;
    else if (mode === 'Jiggle') { l.x += random(-0.5,0.5); l.y += random(-0.5,0.5); }
    else if (mode === 'Gravity') { l.vy += 0.2; l.y += l.vy; }
    
    textFont(l.font);
    textSize(l.size + audioSize);
    textAlign(CENTER, CENTER);
    let c = color(l.col);
    fill(hue(c), saturation(c), brightness(c), l.opacity);
    noStroke();
    text(l.char, 0, 0);
    pop();
    
    if (l.opacity <= 0 || l.y > height || l.x < THEME.sidebarW) letters.splice(i, 1);
  }
}

async function toggleAudio() {
  await userStartAudio();
  audioActive = !audioActive;
  if (audioActive) {
    mic.start();
    audioBtn.html('MIC: ON');
    audioBtn.style('background-color', '#7A756B');
  } else {
    mic.stop();
    audioBtn.html('MIC: OFF');
    audioBtn.style('background-color', THEME.buttonBg);
  }
}

function handleFontUpload(file) {
  if (file.type === 'font' || file.name.endsWith('.ttf') || file.name.endsWith('.otf')) {
    loadFont(file.data, (f) => {
      fontSelect.option(file.name, f);
      fontSelect.selected(file.name);
    });
  }
}

function handleSave() {
  if (!isRecording) {
    startRecording();
    setTimeout(stopRecording, 5000); 
    alert("Recording 5 seconds...");
  }
}

function startRecording() {
  chunks = [];
  let stream = canvas.captureStream(30);
  recorder = new MediaRecorder(stream);
  recorder.ondataavailable = e => chunks.push(e.data);
  recorder.onstop = exportVideo;
  recorder.start();
  isRecording = true;
}

function stopRecording() { recorder.stop(); isRecording = false; }

function exportVideo() {
  let blob = new Blob(chunks, { type: 'video/webm' });
  let url = URL.createObjectURL(blob);
  let a = document.createElement('a');
  a.href = url;
  a.download = 'typography.webm';
  a.click();
}

function drawPaletteStudio(x, y, r) {
  push();
  fill(0, 0, 0, 0.9);
  rect(0, 0, width, height);
  translate(x, y);
  for (let a = 0; a < 360; a += 10) {
    for (let radius = 0; radius < r; radius += 15) {
      fill(a, radius / (r/100), 100);
      ellipse(cos(radians(a)) * radius, sin(radians(a)) * radius, 12, 12);
    }
  }
  pop();
}

function mousePressed() {
  userStartAudio();
  if (showWheel) showWheel = false; 
}

function colorToHex(c) {
  let r = floor(red(c)); let g = floor(green(c)); let b = floor(blue(c));
  return "#" + hex(r, 2) + hex(g, 2) + hex(b, 2);
}

function windowResized() { resizeCanvas(windowWidth, windowHeight); }