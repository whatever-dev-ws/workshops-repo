// --- CONFIGURATION ---
const FPS = 60;
const MENU_WIDTH = 340; 

// --- AUDIO VARS ---
let song;
let fft; 
// Audio Effects (FILTER ENTFERNT)

let isPlaying = false;
let bassEnergy = 0;
let midEnergy = 0;
let trebleEnergy = 0;

// --- RHYTHM VARS ---
let lastTapTime = 0;
let beatInterval = 600; 
let vizTime = 0; 
let tapBtn;

// --- UI ELEMENTS ---
let sidebarDiv;
let toggleBtn; // Neuer Button für das Menü
let isMenuOpen = true; // Status des Menüs

let characterSelector; 
let customDiv; 

// Parameters
let p_sens, p_thick, p_rate, p_scale, p_trail;
let p_cols, p_rows, p_radial;
let p_cust_head, p_cust_jump, p_cust_hands;

// Audio FX Parameter (ENTFERNT)

let btnUpload, btnPlay, btnFull, btnGif;

// Colors
let colorBody = { picker: null, loop: null };
let colorBg = { picker: null, loop: null };

// --- STATE ---
let currentCharacter = 'SWING DANCER'; 

function setup() {
  // Canvas initial erstellen
  let c = createCanvas(windowWidth - MENU_WIDTH, windowHeight);
  c.position(MENU_WIDTH, 0);
  
  angleMode(DEGREES);
  pixelDensity(1);
  frameRate(FPS);

  try {
    fft = new p5.FFT(0.8, 256);
    // CLEAN AUDIO SETUP: Filter wurde entfernt, keine weitere Init nötig.
  } catch (e) {
    console.log("Sound Library Error:", e);
  }

  setupUI();
  updateLayout(); // Einmaliges Layout-Update beim Start
}

function windowResized() {
  updateLayout();
  if(sidebarDiv) sidebarDiv.style('height', windowHeight + 'px');
}

// Neue Funktion, um Layout basierend auf Menü-Status zu regeln
function updateLayout() {
  let c = select('canvas');
  
  if (isMenuOpen) {
    // Menü offen
    resizeCanvas(windowWidth - MENU_WIDTH, windowHeight);
    if(c) c.position(MENU_WIDTH, 0);
    if(sidebarDiv) sidebarDiv.style('left', '0px');
    if(toggleBtn) {
       toggleBtn.html('◀'); 
       toggleBtn.style('left', (MENU_WIDTH - 30) + 'px'); // Button innerhalb der Leiste rechts
    }
  } else {
    // Menü geschlossen
    resizeCanvas(windowWidth, windowHeight);
    if(c) c.position(0, 0);
    if(sidebarDiv) sidebarDiv.style('left', (-MENU_WIDTH) + 'px');
    if(toggleBtn) {
      toggleBtn.html('▶');
      toggleBtn.style('left', '10px'); // Button am linken Rand
    }
  }
}

function toggleMenu() {
  isMenuOpen = !isMenuOpen;
  updateLayout();
}

// --- UI SETUP ---
function setupUI() {
  // Sidebar Styling mit Transition für weiches Gleiten
  sidebarDiv = createDiv('');
  sidebarDiv.style('width', MENU_WIDTH + 'px');
  sidebarDiv.style('height', '100vh');
  sidebarDiv.style('background', 'rgba(15, 15, 20, 0.95)'); 
  sidebarDiv.style('position', 'fixed');
  sidebarDiv.style('top', '0');
  sidebarDiv.style('left', '0'); // Startposition
  sidebarDiv.style('border-right', '1px solid #333');
  sidebarDiv.style('overflow-y', 'auto'); 
  sidebarDiv.style('padding', '20px');
  sidebarDiv.style('box-sizing', 'border-box');
  sidebarDiv.style('transition', 'left 0.3s ease'); // Animation
  sidebarDiv.style('z-index', '1000'); // Immer oben

  // -- TOGGLE BUTTON --
  // Dieser Button steuert das Ein/Ausklappen
  toggleBtn = createButton('◀');
  toggleBtn.mousePressed(toggleMenu);
  toggleBtn.style('position', 'fixed');
  toggleBtn.style('top', '15px');
  toggleBtn.style('width', '30px');
  toggleBtn.style('height', '30px');
  toggleBtn.style('background', '#007AFF');
  toggleBtn.style('color', 'white');
  toggleBtn.style('border', 'none');
  toggleBtn.style('border-radius', '4px');
  toggleBtn.style('cursor', 'pointer');
  toggleBtn.style('z-index', '1001'); // Höher als Sidebar
  toggleBtn.style('transition', 'left 0.3s ease'); // Animiert mit
  toggleBtn.style('font-weight', 'bold');

  const labelStyle = 'font-family: sans-serif; font-size: 13px; font-weight: bold; color: #ccc; margin: 15px 0 5px 0; display: block; text-transform: uppercase; letter-spacing: 1px;';
  const btnStyle = 'width: 100%; padding: 8px; background: #333; color: white; border: 1px solid #555; border-radius: 4px; cursor: pointer; margin-bottom: 5px;';
  
  // -- TITEL --
  let title = createP("DANCING MAN STUDIO");
  title.parent(sidebarDiv);
  title.style('font-family: sans-serif; font-size: 20px; font-weight: 900; color: #fff; margin: 0 0 20px 0; border-bottom: 2px solid #007AFF; padding-bottom: 10px;');

  // -- CONTROL --
  createLabel("1. CONTROL", sidebarDiv, labelStyle);
  
  btnFull = createButton("⛶ FULLSCREEN");
  btnFull.parent(sidebarDiv);
  btnFull.style(btnStyle);
  btnFull.mousePressed(() => {
    let fs = fullscreen();
    fullscreen(!fs);
  });

  tapBtn = createButton("🥁 TAP RHYTHM");
  tapBtn.parent(sidebarDiv);
  tapBtn.style(btnStyle);
  tapBtn.style('border: 1px solid #007AFF; font-weight: bold;'); 
  tapBtn.mousePressed(handleTap);

  btnGif = createButton("🔴 REC GIF (5s)");
  btnGif.parent(sidebarDiv);
  btnGif.style(btnStyle);
  btnGif.style('background', '#b00'); 
  btnGif.mousePressed(recordGif);

  // -- AUDIO --
  createLabel("2. AUDIO SOURCE", sidebarDiv, labelStyle);
  
  btnUpload = createFileInput(handleFile);
  btnUpload.parent(sidebarDiv);
  btnUpload.style('color: #aaa; margin-bottom: 10px; width: 100%;');

  btnPlay = createButton("▶ PLAY / PAUSE");
  btnPlay.parent(sidebarDiv);
  btnPlay.style(btnStyle);
  btnPlay.style('background', '#007AFF; border: none; font-weight: bold;');
  btnPlay.mousePressed(toggleAudio);

  p_rate = createLoopedSlider("PLAYBACK SPEED", 0.1, 3.0, 1.0, 0.1, sidebarDiv);

  // -- CHARACTER SELECTOR --
  createLabel("3. DANCE STYLE", sidebarDiv, labelStyle);
  characterSelector = createSelect();
  characterSelector.parent(sidebarDiv);
  characterSelector.style(btnStyle);
  characterSelector.option('SWING DANCER'); 
  characterSelector.option('HEADBANGER');
  characterSelector.option('WAVY ARMS');
  characterSelector.option('BREAKDANCER (HEADSPIN)'); 
  characterSelector.option('CUSTOM DANCER');
  
  characterSelector.changed(() => {
    currentCharacter = characterSelector.value();
    if(currentCharacter === 'CUSTOM DANCER') {
      customDiv.style('display', 'block');
    } else {
      customDiv.style('display', 'none');
    }
  });

  // -- CUSTOM DANCER MENU --
  customDiv = createDiv('');
  customDiv.parent(sidebarDiv);
  customDiv.style('background', '#1a1a24; padding: 10px; border-radius: 8px; border: 1px solid #007AFF; margin-bottom: 15px; display: none;');
  
  createLabel("↳ CUSTOM MOVE SETTINGS", customDiv, "font-size: 11px; color: #007AFF; margin: 0 0 10px 0; font-weight: bold;");
  
  p_cust_head = createLoopedSlider("HEAD NOD", 0, 50, 10, 1, customDiv);
  p_cust_jump = createLoopedSlider("JUMP / KNEES", 0, 60, 20, 1, customDiv);
  p_cust_hands = createLoopedSlider("HAND MOVEMENT", 0, 80, 30, 1, customDiv);

  // -- MIRROR --
  createLabel("4. MIRROR / GRID", sidebarDiv, labelStyle);
  p_cols = createLoopedSlider("↔ VERTICAL (COLS)", 1, 10, 1, 1, sidebarDiv);
  p_rows = createLoopedSlider("↕ HORIZONTAL (ROWS)", 1, 10, 1, 1, sidebarDiv);
  p_radial = createLoopedSlider("۞ STAR / RADIAL", 1, 8, 1, 1, sidebarDiv);

  // -- COLORS --
  createLabel("5. COLORS", sidebarDiv, labelStyle);
  let colorRow = createDiv('');
  colorRow.parent(sidebarDiv);
  colorRow.style('display: flex; gap: 10px; width: 100%;');

  let c1Box = createDiv('');
  c1Box.parent(colorRow);
  c1Box.style('flex: 1; background: #222; padding: 10px; border-radius: 6px;');
  createColorInner("BODY", "#00ffcc", colorBody, c1Box);

  let c2Box = createDiv('');
  c2Box.parent(colorRow);
  c2Box.style('flex: 1; background: #222; padding: 10px; border-radius: 6px;');
  createColorInner("BACKGR.", "#000000", colorBg, c2Box);

  // -- FINE TUNING --
  createLabel("6. FINE TUNING", sidebarDiv, labelStyle);
  p_scale = createLoopedSlider("GLOBAL SIZE", 0.2, 2.0, 0.8, 0.05, sidebarDiv);
  p_sens = createLoopedSlider("BEAT SENSITIVITY", 0.5, 3.0, 1.5, 0.1, sidebarDiv);
  p_thick = createLoopedSlider("LINE THICKNESS", 1, 15, 3, 0.5, sidebarDiv); 
  p_trail = createLoopedSlider("TRAIL / GHOSTING", 0, 100, 20, 1, sidebarDiv);

  // Filter UI wurde komplett entfernt

  createP("").parent(sidebarDiv).style('height', '50px');
}

// UI HELPERS
function createLabel(txt, parent, style) {
  let l = createP(txt);
  l.parent(parent);
  l.style(style);
}

function createLoopedSlider(labelTxt, min, max, val, step, parent) {
  let wrapper = createDiv('');
  wrapper.parent(parent);
  wrapper.style('margin-bottom', '15px; background: #252525; padding: 8px; border-radius: 5px;');
  
  let header = createDiv('');
  header.parent(wrapper);
  header.style('display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;');

  let l = createSpan(labelTxt);
  l.parent(header);
  l.style('font-family: monospace; font-size: 11px; color: #bbb;');

  let chk = createCheckbox('AUTO', false);
  chk.parent(header);
  chk.style('font-family: monospace; font-size: 10px; color: #888;');
  
  let s = createSlider(min, max, val, step);
  s.parent(wrapper);
  s.style('width', '100%');
  s.style('accent-color', '#007AFF');
  return { slider: s, auto: chk, min: min, max: max };
}

function createColorInner(label, hex, obj, parent) {
  let l = createSpan(label);
  l.parent(parent);
  l.style('font-family: monospace; font-size: 10px; color: #eee; display: block; margin-bottom: 5px;');
  obj.picker = createColorPicker(hex);
  obj.picker.parent(parent);
  obj.picker.style('border: none; width: 100%; height: 25px; cursor: pointer; margin-bottom: 5px;');
  obj.loop = createCheckbox('LOOP', false);
  obj.loop.parent(parent);
  obj.loop.style('color: #aaa; font-family: sans-serif; font-size: 9px;');
}

// --- LOGIC ---
function handleTap() {
  let now = millis();
  tapBtn.style('background', '#FFF');
  setTimeout(() => tapBtn.style('background', '#333'), 100);

  if (lastTapTime > 0) {
    let diff = now - lastTapTime;
    if (diff > 100 && diff < 3000) {
       beatInterval = (beatInterval * 0.6) + (diff * 0.4);
    } else {
       beatInterval = diff; 
    }
  }
  lastTapTime = now;
}

function updateSliderLoops() {
  let params = [
    p_sens, p_thick, p_rate, p_scale, p_trail, p_cols, p_rows, p_radial,
    p_cust_head, p_cust_jump, p_cust_hands
    // p_fx_filter entfernt
  ];

  params.forEach(p => {
    if (p.auto.checked()) {
      let osc = sin(frameCount * 2); 
      let range = p.max - p.min;
      let mid = p.min + range / 2;
      let val = mid + (osc * (range / 2));
      p.slider.value(val);
    }
  });
}

function recordGif() {
  saveGif('viz_output', 5, { units: 'seconds', delay: 0 });
}

// --- DRAW LOOP ---
function draw() {
  updateSliderLoops();

  // Simple Audio Filter Logic wurde entfernt

  if (fft) {
    fft.analyze();
    bassEnergy = fft.getEnergy("bass");
    midEnergy = fft.getEnergy("mid");
    trebleEnergy = fft.getEnergy("treble");
  }

  let speedMult = p_rate.slider.value();
  if (song && song.isLoaded()) {
    song.rate(speedMult);
  }

  let baseSpeed = 600 / max(50, beatInterval); 
  vizTime += baseSpeed * speedMult;

  let cBody = resolveColor(colorBody, 0);
  let cBg = resolveColor(colorBg, 90);

  let trailAlpha = map(p_trail.slider.value(), 0, 100, 255, 10);
  cBg.setAlpha(trailAlpha);
  background(cBg);

  push();
  // Zentrum des Canvas ist abhängig vom aktuellen Offset (MENU_WIDTH oder 0)
  // Durch translate(width/2, height/2) passt p5 das automatisch an, 
  // da resizeCanvas 'width' verändert hat.
  translate(width / 2, height / 2);
  scale(p_scale.slider.value());

  let cols = floor(p_cols.slider.value());  
  let rows = floor(p_rows.slider.value());  
  let radial = floor(p_radial.slider.value());
  let radialStep = 360 / max(1, radial);
  let spacingX = 150;
  let spacingY = 220;

  for (let r = 0; r < radial; r++) {
    push();
    rotate(r * radialStep);
    let totalW = (cols - 1) * spacingX;
    let totalH = (rows - 1) * spacingY;
    translate(-totalW / 2, -totalH / 2);

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        push();
        translate(x * spacingX, y * spacingY);
        drawSpecificDancer(cBody);
        pop();
      }
    }
    pop();
  }
  pop();
}

function resolveColor(ctrl, hueOffset) {
  if (ctrl.loop.checked()) {
    let h = (vizTime * 0.5 + hueOffset) % 360;
    return color(`hsl(${floor(h)}, 100%, 50%)`);
  } else {
    return color(ctrl.picker.value());
  }
}

// --- DANCER LOGIC ---

function drawSpecificDancer(cPrimary) {
  let sens = p_sens.slider.value();
  let thick = p_thick.slider.value();
  
  strokeWeight(thick);
  strokeCap(ROUND);
  noFill();

  let beatScale = 1 + (bassEnergy/255 * 0.2 * sens);
  scale(beatScale);

  if (currentCharacter === 'SWING DANCER') {
    drawSwingDancer(cPrimary, sens);
  } else if (currentCharacter === 'HEADBANGER') {
    drawHeadbanger(cPrimary, sens);
  } else if (currentCharacter === 'WAVY ARMS') {
    drawWavyDancer(cPrimary, sens);
  } else if (currentCharacter === 'BREAKDANCER (HEADSPIN)') {
    drawBreakdancer(cPrimary, sens);
  } else if (currentCharacter === 'CUSTOM DANCER') {
    drawCustomDancer(cPrimary, sens); 
  }
}

function drawCustomDancer(c, sens) {
  stroke(c);

  let headAmp = p_cust_head.slider.value();
  let jumpAmp = p_cust_jump.slider.value();
  let handsAmp = p_cust_hands.slider.value();

  let headNod = sin(vizTime * 10) * headAmp;
  let jump = abs(sin(vizTime * 10)) * jumpAmp; 
  let armWave = cos(vizTime * 10) * handsAmp;

  let headY = -80 + headNod;
  let neckY = -50 + (headNod * 0.5);
  let hipY = 20 + jump; 

  ellipse(0, headY, 30, 30);
  line(0, neckY, 0, hipY);

  let audioArm = trebleEnergy * 0.2 * sens;
  let armY = neckY + 20;

  line(0, neckY, 30, armY); 
  line(30, armY, 50 + audioArm, armY - armWave);

  line(0, neckY, -30, armY); 
  line(-30, armY, -50 - audioArm, armY - armWave);

  let kneeBend = jump * 0.8; 
  line(0, hipY, 20 + kneeBend, hipY + 40);
  line(20 + kneeBend, hipY + 40, 20, hipY + 80);
  line(0, hipY, -20 - kneeBend, hipY + 40);
  line(-20 - kneeBend, hipY + 40, -20, hipY + 80);
}

function drawSwingDancer(c, sens) {
  stroke(c);
  let headY = -80;
  let neckY = -50;
  let hipY = 20;
  let hipSwingX = sin(vizTime * 8) * 30; 
  ellipse(0 + hipSwingX*0.2, headY, 30, 30);
  line(0 + hipSwingX*0.2, neckY, hipSwingX, hipY);
  let armWave = sin(vizTime * 5) * 40;
  let armLift = map(trebleEnergy * sens, 0, 255, 0, 80);
  line(0 + hipSwingX*0.2, neckY, 30, neckY + 10 - armLift/2); 
  line(30, neckY + 10 - armLift/2, 50 + armWave, neckY + 40 - armLift); 
  line(0 + hipSwingX*0.2, neckY, -30, neckY + 10 - armLift/2); 
  line(-30, neckY + 10 - armLift/2, -50 - armWave, neckY + 40 - armLift); 
  let kneeLift = map(bassEnergy * sens, 0, 255, 0, 40);
  line(hipSwingX, hipY, 20 + hipSwingX, hipY + 40 - kneeLift); 
  line(20 + hipSwingX, hipY + 40 - kneeLift, 25, hipY + 80); 
  line(hipSwingX, hipY, -20 + hipSwingX, hipY + 40 - (kneeLift*0.5)); 
  line(-20 + hipSwingX, hipY + 40 - (kneeLift*0.5), -25, hipY + 80); 
}

function drawHeadbanger(c, sens) {
  stroke(c);
  let headBang = sin(vizTime * 20) * (trebleEnergy/255 * 30 * sens);
  let headY = -70 + headBang;
  let neckY = -40 + (headBang * 0.3);
  let hipY = 20;
  ellipse(0, headY, 35, 35);
  line(0, neckY, 0, hipY);
  let armUp = map(midEnergy * sens, 0, 255, 0, 60);
  line(0, neckY, 25, neckY); 
  line(25, neckY, 35, neckY - 30 - armUp); 
  line(0, neckY, -25, neckY); 
  line(-25, neckY, -35, neckY - 30 - armUp); 
  let jump = map(bassEnergy, 0, 255, 0, 10);
  line(0, hipY, 20, hipY + 50 - jump);
  line(20, hipY + 50 - jump, 25, hipY + 90 - jump);
  line(0, hipY, -20, hipY + 50 - jump);
  line(-20, hipY + 50 - jump, -25, hipY + 90 - jump);
}

function drawWavyDancer(c, sens) {
  stroke(c);
  let neckY = -50;
  let hipY = 20;
  ellipse(0, -80, 30, 30);
  line(0, neckY, 0, hipY);
  let waveSpeed = vizTime * 15;
  let waveAmp = 20 * sens;
  let startX = 0, startY = neckY;
  for(let i=0; i<5; i++) {
     let nextX = startX + 15;
     let nextY = neckY + sin(waveSpeed + (i*50)) * waveAmp;
     line(startX, startY, nextX, nextY);
     startX = nextX; startY = nextY;
  }
  startX = 0; startY = neckY;
  for(let i=0; i<5; i++) {
     let nextX = startX - 15;
     let nextY = neckY + sin(waveSpeed + (i*50) + 180) * waveAmp; 
     line(startX, startY, nextX, nextY);
     startX = nextX; startY = nextY;
  }
  let stampf = (vizTime % 20 < 10) ? 10 : 0;
  line(0, hipY, 15, hipY + 40);
  line(15, hipY + 40, 15, hipY + 80 - stampf); 
  line(0, hipY, -15, hipY + 40);
  line(-15, hipY + 40, -15, hipY + 80 - (10-stampf)); 
}

function drawBreakdancer(c, sens) {
  stroke(c);
  let spinSpeed = vizTime * (5 + (bassEnergy * 0.05 * sens));
  push();
  rotate(spinSpeed); 
  ellipse(0, 0, 30, 30); 
  let hipY = -60;
  line(0, -15, 0, hipY); 
  line(0, -20, 30, 10);
  line(30, 10, 40, 30); 
  line(0, -20, -30, 10);
  line(-30, 10, -40, 30); 
  let split = 30 + (trebleEnergy * 0.2 * sens);
  line(0, hipY, split, hipY - 50); 
  line(split, hipY - 50, split + 10, hipY - 80); 
  line(0, hipY, -split, hipY - 50); 
  line(-split, hipY - 50, -split - 10, hipY - 80); 
  pop();
}

// --- AUDIO HANDLING ---
function handleFile(file) {
  if (file.type === 'audio') {
    if (song) song.stop();
    song = loadSound(file.data, () => {
      // CLEAN AUDIO: Keine Filter-Verbindungen mehr. Einfach abspielen.
      song.loop();
      isPlaying = true;
    });
  } else {
    alert("Bitte MP3 Datei wählen.");
  }
}

function toggleAudio() {
  if (song) {
    if (song.isPlaying()) {
      song.pause();
    } else {
      song.play();
    }
  }
}