// WUP2025/26
// Hannah Marlen Zischg
// TYPE STUDIO PRO - STANDALONE EVENT LISTENER VERSION

/**
 * CONFIGURAZIONE E STATO GLOBALE
 */
let currentFont;
let fontReady = false;
let canvas;

// Variabili Registrazione
let isRecording = false;
let recordDuration = 5; 
let mediaRecorder;
let recordedChunks = [];

// Font URLs
const fontLibrary = {
  'roboto': 'https://cdnjs.cloudflare.com/ajax/libs/topcoat/0.8.0/font/SourceCodePro-Bold.otf',
  'mono': 'https://cdnjs.cloudflare.com/ajax/libs/topcoat/0.8.0/font/SourceCodePro-Regular.otf'
};

let loadedFonts = {};

// Stato Applicazione
let state = {
  text: "VIDEO",
  fontKey: 'roboto',
  fontSize: 120,
  tracking: 0,        
  vScale: 1.0,        
  hScale: 1.0,        
  skew: 0,            
  depth: 50,
  spacing: 3,
  twist: 0,
  wave: 0,
  waveSpeed: 0.04,
  glitch: 0,
  color: "#1a1a1a",
  rainbow: false,
  bgColor: "#f5f5f5"
};

const presets = {
  "Swiss": { fontSize: 120, tracking: -2, vScale: 1.0, hScale: 0.9, depth: 40, twist: 0, wave: 0, glitch: 0, color: "#000000", rainbow: false },
  "Liquid": { fontSize: 90, tracking: 0, vScale: 1.0, hScale: 1.0, depth: 150, twist: 1.5, wave: 80, glitch: 0, color: "#007AFF", rainbow: false },
  "Kinetic": { fontSize: 60, tracking: 10, vScale: 3.0, hScale: 0.5, depth: 20, twist: 0.5, wave: 20, glitch: 0, color: "#FF3E00", rainbow: false },
  "Cyber": { fontSize: 110, tracking: -2, vScale: 0.8, hScale: 1.5, depth: 100, twist: 0, wave: 0, glitch: 35, color: "#3296FA", rainbow: true }
};

const SIDEBAR_WIDTH = 320;

function preload() {
  loadedFonts['roboto'] = loadFont(fontLibrary['roboto']);
  loadedFonts['mono'] = loadFont(fontLibrary['mono']);
}

function setup() {
  // 1. Costruisci Interfaccia (JS Puro)
  createInterfaceAndBindEvents();

  // 2. Setup Canvas per Video
  setAttributes('preserveDrawingBuffer', true);
  
  let w = window.innerWidth - SIDEBAR_WIDTH;
  let h = window.innerHeight;
  canvas = createCanvas(w, h, WEBGL);
  canvas.id('typeCanvas');
  
  // Posizionamento Assoluto (Layout Fix)
  let canvasEl = document.getElementById('typeCanvas');
  canvasEl.style.position = 'absolute';
  canvasEl.style.top = '0px';
  canvasEl.style.left = SIDEBAR_WIDTH + 'px';
  canvasEl.style.zIndex = '0';
  
  // Disabilita menu contestuale
  canvas.elt.oncontextmenu = () => false;
  
  currentFont = loadedFonts['roboto'];
  textFont(currentFont);
  fontReady = true;
  textAlign(CENTER, CENTER);
}

function draw() {
  background(state.bgColor);
  
  if (!fontReady || !currentFont) return;
  
  orbitControl(1, 1, 0.1);
  setupStudioLighting();
  renderAdvancedType();
}

// --- LOGICA RENDER 3D ---
function renderAdvancedType() {
  let chars = state.text.split("");
  let charSpace = state.fontSize * (0.6 + state.tracking * 0.1);

  if (currentFont) textFont(currentFont);

  for (let i = 0; i < state.depth; i += state.spacing) {
    let p = i / state.depth;
    push();
    
    let zPos = i - state.depth / 2;
    let waveX = sin(frameCount * state.waveSpeed + i * 0.1) * state.wave;
    let waveY = cos(frameCount * state.waveSpeed + i * 0.1) * (state.wave * 0.4);
    
    translate(waveX, waveY, zPos);
    rotateZ(p * state.twist);
    applyMatrix(1, state.skew * 0.1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
    
    if (state.glitch > 0) translate(random(-state.glitch, state.glitch), random(-state.glitch*0.5, state.glitch*0.5), 0);

    if (state.rainbow) {
      colorMode(HSB, 360, 100, 100);
      fill((frameCount * 2 + i * 3) % 360, 70, 90);
    } else {
      colorMode(RGB);
      let c = color(state.color);
      let shadowFactor = 1 - (p * 0.3); 
      fill(red(c) * shadowFactor, green(c) * shadowFactor, blue(c) * shadowFactor);
    }

    noStroke();
    specularMaterial(200); 
    shininess(20);
    textSize(state.fontSize);
    scale(state.hScale, state.vScale);

    let totalWidth = (chars.length - 1) * charSpace;
    for (let j = 0; j < chars.length; j++) {
      let xPos = j * charSpace - totalWidth / 2;
      text(chars[j], xPos, 0);
    }
    pop();
  }
}

function setupStudioLighting() {
  ambientLight(150);
  pointLight(255, 255, 255, 200, -200, 400);
  directionalLight(100, 100, 100, 1, 1, -1);
}

// --- FUNZIONI EXPORT (VIDEO/FOTO) ---

function handleStartRecording() {
  recordedChunks = [];
  let stream = document.getElementById('typeCanvas').captureStream(30);
  mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });

  mediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) recordedChunks.push(e.data);
  };

  mediaRecorder.onstop = () => {
    let blob = new Blob(recordedChunks, { type: 'video/webm' });
    let url = URL.createObjectURL(blob);
    let a = document.createElement('a');
    a.href = url;
    a.download = 'Type_Animation.webm';
    a.click();
    
    // Reset UI Button
    let btn = document.getElementById('btn-rec');
    btn.innerHTML = `REC Video`;
    btn.classList.remove('recording');
    isRecording = false;
  };

  mediaRecorder.start();
  isRecording = true;
  
  // Feedback UI
  let btn = document.getElementById('btn-rec');
  btn.innerHTML = "🔴 Stop / Saving...";
  btn.classList.add('recording');

  // Stop automatico
  setTimeout(() => {
    if(mediaRecorder.state === 'recording') mediaRecorder.stop();
  }, recordDuration * 1000);
}

function handleSaveImage() {
  saveCanvas('Type_Pro_Export', 'png');
}

// --- COSTRUZIONE UI & EVENT BINDING ---

function createInterfaceAndBindEvents() {
  // 1. CSS Styles
  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
    body, html { margin: 0; padding: 0; overflow: hidden; background: #fff; width: 100%; height: 100%; }
    
    #sidebar {
      position: absolute; left: 0; top: 0; bottom: 0; width: 320px;
      background: #1e1e1e; border-right: 1px solid #333;
      font-family: 'Inter', sans-serif; color: #e0e0e0;
      display: flex; flex-direction: column; user-select: none; z-index: 100;
    }
    
    .header { padding: 18px 20px; border-bottom: 1px solid #333; background: #252525; }
    .header h1 { font-size: 13px; margin: 0; color: #fff; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; }
    
    .scroll-area { flex: 1; overflow-y: auto; padding: 20px; }
    .scroll-area::-webkit-scrollbar { width: 4px; }
    .scroll-area::-webkit-scrollbar-thumb { background: #444; }

    .section-title {
      font-size: 10px; font-weight: 600; color: #666;
      text-transform: uppercase; margin: 20px 0 10px 0; letter-spacing: 0.5px;
    }
    
    .text-input {
      width: 100%; padding: 10px; background: #2c2c2c; border: 1px solid #444;
      color: #fff; font-size: 14px; font-family: 'Inter', sans-serif;
      border-radius: 4px; box-sizing: border-box; margin-bottom: 8px;
    }
    .text-input:focus { outline: none; border-color: #007AFF; }
    
    select {
      width: 100%; padding: 8px; background: #2c2c2c; color: #fff;
      border: 1px solid #444; border-radius: 4px; margin-bottom: 8px; font-size: 12px;
    }

    .control-row { margin-bottom: 12px; }
    .label-row { display: flex; justify-content: space-between; font-size: 11px; color: #aaa; margin-bottom: 4px; }
    .val-disp { color: #007AFF; font-weight: 600; }
    input[type="range"] { width: 100%; cursor: pointer; height: 4px; accent-color: #007AFF; }

    .color-row { display: flex; gap: 10px; align-items: center; margin-top: 5px; }
    input[type="color"] { -webkit-appearance: none; border: none; width: 24px; height: 24px; background: none; cursor: pointer; padding: 0; }
    .chk-label { font-size: 11px; color: #ccc; display: flex; align-items: center; gap: 6px; cursor: pointer; }

    .preset-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
    .preset-btn {
      background: #2c2c2c; border: 1px solid #444; color: #aaa;
      padding: 8px; border-radius: 4px; cursor: pointer; font-size: 10px;
      transition: 0.2s; text-align: center;
    }
    .preset-btn:hover { background: #333; color: #fff; border-color: #666; }

    .export-container { padding: 15px 20px; border-top: 1px solid #333; background: #1e1e1e; }
    .export-row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 8px; }
    
    .btn-action {
      border: none; border-radius: 4px; padding: 10px; font-size: 11px; font-weight: 600;
      cursor: pointer; display: flex; justify-content: center; gap: 6px; align-items: center;
      transition: 0.2s;
    }
    .btn-rec { background: #2c2c2c; color: #fff; border: 1px solid #444; }
    .btn-rec:hover { background: #333; }
    .btn-rec.recording { background: #ff1744; border-color: #ff1744; color: #fff; animation: pulse 1.5s infinite; }
    
    .btn-img { background: #007AFF; color: #fff; }
    .btn-img:hover { background: #0062cc; }
    
    @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.7; } 100% { opacity: 1; } }
  `;
  
  let s = document.createElement('style');
  s.type = 'text/css';
  s.appendChild(document.createTextNode(css));
  document.head.appendChild(s);

  // 2. HTML Structure (No onclicks!)
  let sidebar = document.createElement('div');
  sidebar.id = 'sidebar';
  sidebar.innerHTML = `
    <div class="header"><h1>Type Studio Pro</h1></div>

    <div class="scroll-area">
      <div class="section-title">Content</div>
      <input type="text" id="inp-text" class="text-input" value="${state.text}">
      <select id="sel-font">
        <option value="roboto">Roboto Bold</option>
        <option value="mono">Source Code Mono</option>
      </select>

      <div class="section-title">Geometry</div>
      ${renderSlider('Size', 'fontSize', 10, 300, state.fontSize)}
      ${renderSlider('Tracking', 'tracking', -10, 50, state.tracking)}
      ${renderSlider('V-Scale', 'vScale', 0.1, 5, state.vScale, 0.1)}
      ${renderSlider('H-Scale', 'hScale', 0.1, 5, state.hScale, 0.1)}
      ${renderSlider('Skew', 'skew', -5, 5, state.skew, 0.1)}
      
      <div class="section-title">3D Effects</div>
      ${renderSlider('Depth', 'depth', 1, 500, state.depth)}
      ${renderSlider('Twist', 'twist', 0, 10, state.twist, 0.1)}
      ${renderSlider('Wave', 'wave', 0, 200, state.wave)}
      ${renderSlider('Glitch', 'glitch', 0, 100, state.glitch)}

      <div class="section-title">Style</div>
      <div class="color-row">
        <input type="color" id="inp-color" value="${state.color}">
        <label class="chk-label">
          <input type="checkbox" id="chk-rainbow"> Rainbow Mode
        </label>
      </div>
      <div class="color-row" style="margin-top:8px;">
        <span style="font-size:11px; color:#888;">Bg Color:</span>
        <input type="color" id="inp-bg" value="${state.bgColor}">
      </div>

      <div class="section-title">Presets</div>
      <div class="preset-grid">
        <button class="preset-btn" id="pre-Swiss">Swiss</button>
        <button class="preset-btn" id="pre-Liquid">Liquid</button>
        <button class="preset-btn" id="pre-Kinetic">Kinetic</button>
        <button class="preset-btn" id="pre-Cyber">Cyber</button>
      </div>
    </div>

    <div class="export-container">
      <span style="font-size:10px; color:#666; font-weight:600; text-transform:uppercase;">Export</span>
      <select id="sel-duration" style="margin-top:5px;">
        <option value="5">Durata Video: 5s</option>
        <option value="15">Durata Video: 15s</option>
        <option value="30">Durata Video: 30s</option>
        <option value="60">Durata Video: 1 min</option>
      </select>
      <div class="export-row">
        <button id="btn-rec" class="btn-action btn-rec">REC Video</button>
        <button id="btn-img" class="btn-action btn-img">PNG 4K</button>
      </div>
    </div>
  `;
  document.body.appendChild(sidebar);

  // 3. EVENT BINDING (Il Fix)
  
  // -- Text & Font --
  document.getElementById('inp-text').addEventListener('input', (e) => {
    state.text = e.target.value;
  });
  
  document.getElementById('sel-font').addEventListener('change', (e) => {
    state.fontKey = e.target.value;
    if (loadedFonts[state.fontKey]) {
      currentFont = loadedFonts[state.fontKey];
      textFont(currentFont);
    }
  });

  // -- Sliders --
  const sliders = ['fontSize', 'tracking', 'vScale', 'hScale', 'skew', 'depth', 'twist', 'wave', 'glitch'];
  sliders.forEach(key => {
    document.getElementById(`sld-${key}`).addEventListener('input', (e) => {
       state[key] = parseFloat(e.target.value);
       document.getElementById(`val-${key}`).innerText = state[key];
    });
  });

  // -- Style --
  document.getElementById('inp-color').addEventListener('input', (e) => {
     state.color = e.target.value;
  });
  
  document.getElementById('inp-bg').addEventListener('input', (e) => {
     state.bgColor = e.target.value;
  });
  
  document.getElementById('chk-rainbow').addEventListener('change', (e) => {
     state.rainbow = e.target.checked;
  });

  // -- Presets --
  const presetKeys = ['Swiss', 'Liquid', 'Kinetic', 'Cyber'];
  presetKeys.forEach(p => {
    document.getElementById(`pre-${p}`).addEventListener('click', () => applyPreset(p));
  });

  // -- Export --
  document.getElementById('sel-duration').addEventListener('change', (e) => {
     recordDuration = parseInt(e.target.value);
  });
  
  document.getElementById('btn-rec').addEventListener('click', handleStartRecording);
  document.getElementById('btn-img').addEventListener('click', handleSaveImage);
}

function renderSlider(label, key, min, max, val, step=1) {
  return `
    <div class="control-row">
      <div class="label-row">
        <span>${label}</span>
        <span id="val-${key}" class="val-disp">${val}</span>
      </div>
      <input type="range" id="sld-${key}" min="${min}" max="${max}" step="${step}" value="${val}">
    </div>
  `;
}

function applyPreset(name) {
  let p = presets[name];
  if (!p) return;
  Object.assign(state, p);
  
  // Sync UI
  Object.keys(p).forEach(k => {
    let el = document.getElementById(`sld-${k}`);
    let disp = document.getElementById(`val-${k}`);
    if (el) el.value = p[k];
    if (disp) disp.innerText = p[k];
  });
  
  document.getElementById('inp-color').value = state.color;
  document.getElementById('chk-rainbow').checked = state.rainbow;
}

function windowResized() {
  resizeCanvas(window.innerWidth - SIDEBAR_WIDTH, window.innerHeight);
}