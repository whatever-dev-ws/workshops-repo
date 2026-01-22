// WUP 2025/26
// Hannah Marlen Zischg
// RASTER PRO TOOL - "EVENT LISTENER" VERSION (Fixes UI issues)

// --- VARIABILI GLOBALI ---
let img;
let cnv;
let effects = {
  glitch: false, chromatic: false, pixel: false,
  blur: false, halftone: false, distort: false
};

let params = {
  glitchInt: 0, chromaticOff: 0, pixelSize: 2,
  blurInt: 0, halftoneSize: 3, distortAmt: 0
};

let colorFilter = 'none';
const SIDEBAR_WIDTH = 320; 

function setup() {
  // 1. Crea l'interfaccia e collega gli eventi (NO p5.dom)
  createInterfaceAndBindEvents();

  // 2. Crea Canvas
  let w = window.innerWidth - SIDEBAR_WIDTH;
  let h = window.innerHeight;
  cnv = createCanvas(w, h);
  cnv.id('p5Canvas');
  
  // 3. Posizionamento Canvas
  let canvasEl = document.getElementById('p5Canvas');
  if(canvasEl) {
    canvasEl.style.position = 'absolute';
    canvasEl.style.top = '0px';
    canvasEl.style.left = SIDEBAR_WIDTH + 'px';
    canvasEl.style.zIndex = '0';
  }

  pixelDensity(1);
  background(18, 18, 18);
  
  // Messaggio iniziale
  updateImage();
}

function draw() {
  // Loop non necessario per manipolazione statica
}

// --- LOGICA DI RENDERING ---

function updateImage() {
  background(18, 18, 18);
  
  if (!img) {
    textAlign(CENTER, CENTER);
    fill(100); noStroke(); textFont('sans-serif'); textSize(14);
    text('Carica un\'immagine per iniziare', width/2, height/2);
    return;
  }
  
  // Calcolo aspect ratio
  let availableW = width - 40;
  let availableH = height - 40;
  let scaleFactor = min(availableW / img.width, availableH / img.height, 1);
  let dispW = floor(img.width * scaleFactor);
  let dispH = floor(img.height * scaleFactor);
  let x = (width - dispW) / 2;
  let y = (height - dispH) / 2;
  
  // Se nessun effetto è attivo, render veloce
  if (!Object.values(effects).some(e => e) && colorFilter === 'none') {
    image(img, x, y, dispW, dispH);
    return;
  }
  
  // Buffer Effetti
  let tempImg = createImage(dispW, dispH);
  tempImg.copy(img, 0, 0, img.width, img.height, 0, 0, dispW, dispH);
  tempImg.loadPixels();
  
  // Pipeline
  if (colorFilter !== 'none') applyColorFilterToImage(tempImg);
  if (effects.pixel) applyPixelation(tempImg);
  if (effects.glitch) applyGlitch(tempImg);
  if (effects.chromatic) applyChromaticAberration(tempImg);
  if (effects.blur) applyBlur(tempImg);
  if (effects.halftone) applyHalftone(tempImg);
  if (effects.distort) applyDistortion(tempImg);
  
  tempImg.updatePixels();
  image(tempImg, x, y);
}

// --- ALGORITMI EFFETTI (GLITCH, PIXEL, ETC.) ---

function applyGlitch(img) {
  let intensity = params.glitchInt / 100;
  let numGlitches = floor(random(5, 15));
  for (let i = 0; i < numGlitches; i++) {
    let y = floor(random(img.height));
    let h = floor(random(2, 20));
    let offset = floor(random(-30, 30) * intensity);
    for (let row = y; row < min(y + h, img.height); row++) {
      for (let x = 0; x < img.width; x++) {
        let sx = (x + offset + img.width) % img.width;
        let si = (row * img.width + sx) * 4;
        let ti = (row * img.width + x) * 4;
        if (random() > 0.3) {
          img.pixels[ti] = img.pixels[si]; img.pixels[ti+1] = img.pixels[si+1]; img.pixels[ti+2] = img.pixels[si+2];
        }
      }
    }
  }
}

function applyChromaticAberration(img) {
  let temp = [...img.pixels];
  let off = params.chromaticOff;
  for (let i = 0; i < img.pixels.length; i += 4) {
    let rIdx = i + (off * 4);
    if (rIdx < img.pixels.length) img.pixels[i] = temp[rIdx];
    let bIdx = i - (off * 4);
    if (bIdx >= 0) img.pixels[i+2] = temp[bIdx+2];
  }
}

function applyPixelation(img) {
  let size = params.pixelSize;
  for (let y = 0; y < img.height; y += size) {
    for (let x = 0; x < img.width; x += size) {
      let idx = (y * img.width + x) * 4;
      let r = img.pixels[idx]; let g = img.pixels[idx+1]; let b = img.pixels[idx+2];
      for (let dy=0; dy<size && y+dy<img.height; dy++) {
        for (let dx=0; dx<size && x+dx<img.width; dx++) {
          let ti = ((y+dy)*img.width + (x+dx)) * 4;
          img.pixels[ti] = r; img.pixels[ti+1] = g; img.pixels[ti+2] = b;
        }
      }
    }
  }
}

function applyBlur(img) {
  let temp = [...img.pixels];
  let r = floor(params.blurInt);
  if(r===0) return;
  // Orizzontale
  for(let y=0; y<img.height; y++){
    for(let x=0; x<img.width; x++){
      let red=0, green=0, blue=0, count=0;
      for(let k=-r; k<=r; k++){
        let nx = constrain(x + k, 0, img.width-1);
        let idx = (y*img.width + nx)*4;
        red+=temp[idx]; green+=temp[idx+1]; blue+=temp[idx+2]; count++;
      }
      let idx = (y*img.width + x)*4;
      img.pixels[idx] = red/count; img.pixels[idx+1] = green/count; img.pixels[idx+2] = blue/count;
    }
  }
  // Verticale
  temp = [...img.pixels];
  for(let x=0; x<img.width; x++){
    for(let y=0; y<img.height; y++){
      let red=0, green=0, blue=0, count=0;
      for(let k=-r; k<=r; k++){
        let ny = constrain(y + k, 0, img.height-1);
        let idx = (ny*img.width + x)*4;
        red+=temp[idx]; green+=temp[idx+1]; blue+=temp[idx+2]; count++;
      }
      let idx = (y*img.width + x)*4;
      img.pixels[idx] = red/count; img.pixels[idx+1] = green/count; img.pixels[idx+2] = blue/count;
    }
  }
}

function applyHalftone(img) {
  let size = params.halftoneSize;
  let temp = [...img.pixels];
  for(let y=0; y<img.height; y+=size){
    for(let x=0; x<img.width; x+=size){
      let r=0, g=0, b=0, count=0;
      for(let dy=0; dy<size && y+dy<img.height; dy++){
        for(let dx=0; dx<size && x+dx<img.width; dx++){
          let idx = ((y+dy)*img.width + (x+dx))*4;
          r += temp[idx]; g += temp[idx+1]; b += temp[idx+2]; count++;
        }
      }
      r/=count; g/=count; b/=count;
      let bright = (r + g + b) / 3;
      let dotRadius = map(bright, 0, 255, size*0.45, 0);
      for(let dy=0; dy<size && y+dy<img.height; dy++){
        for(let dx=0; dx<size && x+dx<img.width; dx++){
          let ti = ((y+dy)*img.width + (x+dx))*4;
          let d = dist(dx, dy, size/2, size/2);
          if(d < dotRadius) {
            img.pixels[ti] = r*0.6; img.pixels[ti+1] = g*0.6; img.pixels[ti+2] = b*0.6;
          } else {
            img.pixels[ti] = r; img.pixels[ti+1] = g; img.pixels[ti+2] = b;
          }
        }
      }
    }
  }
}

function applyDistortion(img) {
  let temp = [...img.pixels];
  let amt = params.distortAmt;
  let time = millis() * 0.002;
  for(let y=0; y<img.height; y++){
    let xOff = floor(sin(y * 0.05 + time) * amt * 0.5);
    for(let x=0; x<img.width; x++){
      let sx = constrain(x + xOff, 0, img.width-1);
      let si = (y*img.width + sx)*4;
      let ti = (y*img.width + x)*4;
      img.pixels[ti] = temp[si]; img.pixels[ti+1] = temp[si+1]; img.pixels[ti+2] = temp[si+2];
    }
  }
}

function applyColorFilterToImage(img) {
  for(let i=0; i<img.pixels.length; i+=4) {
    let r = img.pixels[i], g = img.pixels[i+1], b = img.pixels[i+2];
    switch(colorFilter) {
      case 'grayscale':
        let gray = r*.2126 + g*.7152 + b*.0722;
        img.pixels[i]=img.pixels[i+1]=img.pixels[i+2]=gray; break;
      case 'sepia':
        img.pixels[i] = min(255, r*.393+g*.769+b*.189);
        img.pixels[i+1] = min(255, r*.349+g*.686+b*.168);
        img.pixels[i+2] = min(255, r*.272+g*.534+b*.131); break;
      case 'polaroid':
        img.pixels[i] = constrain(r*1.2-10,0,255);
        img.pixels[i+1] = constrain(g*1.15-5,0,255);
        img.pixels[i+2] = constrain(b*1.05,0,255); break;
      case 'vintage':
        img.pixels[i]=min(255, r*1.1); img.pixels[i+1]=min(255, g*1.05); img.pixels[i+2]=b*0.85; break;
      case 'cool':
        img.pixels[i]=r*0.9; img.pixels[i+1]=min(255, g*1.05); img.pixels[i+2]=min(255, b*1.2); break;
      case 'halftone-bw':
        let bw = r*.2126 + g*.7152 + b*.0722;
        img.pixels[i]=img.pixels[i+1]=img.pixels[i+2]=bw; break;
    }
  }
}

// --- COSTRUZIONE UI & EVENT BINDING ---

function createInterfaceAndBindEvents() {
  // 1. INIEZIONE STILE CSS
  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
    body, html { margin: 0; padding: 0; overflow: hidden; background: #121212; width: 100%; height: 100%; }
    #ui-sidebar {
      position: absolute; left: 0; top: 0; bottom: 0; width: 320px;
      background: #1e1e1e; border-right: 1px solid #333;
      font-family: 'Inter', sans-serif; color: #e0e0e0;
      display: flex; flex-direction: column; overflow: hidden; z-index: 10;
    }
    .header { padding: 20px; border-bottom: 1px solid #333; background: #1e1e1e; }
    .header h1 { font-size: 14px; margin: 0 0 10px 0; color: #fff; text-transform: uppercase; }
    .upload-btn { width: 100%; padding: 12px; background: #252525; border: 1px solid #333; color: #fff; border-radius: 6px; cursor: pointer; display: flex; justify-content: center; gap: 8px; font-size: 13px; }
    .upload-btn:hover { background: #333; border-color: #555; }
    
    .scroll-area { flex: 1; overflow-y: auto; padding: 20px; }
    .section-label { font-size: 11px; font-weight: 600; color: #666; text-transform: uppercase; margin: 20px 0 10px 0; }
    
    .effect-row { background: #252525; border: 1px solid #333; border-radius: 8px; margin-bottom: 8px; padding: 12px; transition: 0.2s; }
    .effect-row.active { background: #2c2c2c; border-color: #007AFF; }
    .effect-header { display: flex; justify-content: space-between; align-items: center; cursor: pointer; user-select: none; }
    .toggle-switch { width: 32px; height: 18px; background: #444; border-radius: 10px; position: relative; }
    .toggle-switch::after { content: ''; position: absolute; top: 2px; left: 2px; width: 14px; height: 14px; background: #fff; border-radius: 50%; transition: 0.2s; }
    .effect-row.active .toggle-switch { background: #007AFF; }
    .effect-row.active .toggle-switch::after { transform: translateX(14px); }
    
    .slider-container { margin-top: 10px; display: none; padding-top: 10px; border-top: 1px solid #333; }
    .effect-row.active .slider-container { display: block; }
    input[type=range] { width: 100%; -webkit-appearance: none; background: transparent; margin: 5px 0; }
    input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; height: 14px; width: 14px; border-radius: 50%; background: #fff; cursor: pointer; margin-top: -5px; }
    input[type=range]::-webkit-slider-runnable-track { width: 100%; height: 4px; background: #444; }
    
    .preset-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .grid-btn { background: #252525; border: 1px solid #333; color: #aaa; padding: 10px; border-radius: 6px; cursor: pointer; font-size: 11px; text-align: center; }
    .grid-btn:hover { background: #333; color: #fff; }
    .grid-btn.active { background: #007AFF; color: white; border-color: #007AFF; }
    
    .footer { padding: 20px; border-top: 1px solid #333; display: grid; grid-template-columns: 1fr 2fr; gap: 10px; }
    .action-btn { border: none; border-radius: 6px; padding: 12px; cursor: pointer; font-size: 13px; font-weight: 600; }
    .btn-reset { background: #252525; color: #fff; border: 1px solid #333; }
    .btn-save { background: #007AFF; color: white; }
    #status { position: fixed; bottom: 20px; right: 20px; background: #333; color: white; padding: 10px 20px; border-radius: 20px; font-size: 12px; opacity: 0; transition: opacity 0.5s; pointer-events: none; }
  `;
  
  let s = document.createElement('style');
  s.type = 'text/css';
  s.appendChild(document.createTextNode(css));
  document.head.appendChild(s);

  // 2. INIEZIONE STRUTTURA HTML (Senza 'onclick')
  // Usiamo gli ID per agganciare gli eventi dopo
  const sidebar = document.createElement('div');
  sidebar.id = 'ui-sidebar';
  
  // Icone SVG
  const icoUpload = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`;
  
  // Template string
  sidebar.innerHTML = `
    <div class="header">
      <h1>Raster Pro</h1>
      <button id="btn-upload" class="upload-btn">${icoUpload} Carica Immagine</button>
      <input type="file" id="file-input" accept="image/*" style="display:none">
    </div>
    <div class="scroll-area">
      <div class="section-label">Effetti</div>
      ${renderEffectRow('glitch', 'Glitch', 'glitchInt', 0, 100, 0)}
      ${renderEffectRow('chromatic', 'Aberrazione', 'chromaticOff', 0, 40, 0)}
      ${renderEffectRow('pixel', 'Pixelate', 'pixelSize', 2, 25, 2)}
      ${renderEffectRow('blur', 'Sfocatura', 'blurInt', 0, 15, 0)}
      ${renderEffectRow('halftone', 'Halftone', 'halftoneSize', 3, 12, 3)}
      ${renderEffectRow('distort', 'Distorsione', 'distortAmt', 0, 100, 0)}
      
      <div class="section-label">Filtri Colore</div>
      <div class="preset-grid">
        <button class="grid-btn active" id="filter-none" data-val="none">Nessuno</button>
        <button class="grid-btn" id="filter-grayscale" data-val="grayscale">B&W</button>
        <button class="grid-btn" id="filter-sepia" data-val="sepia">Seppia</button>
        <button class="grid-btn" id="filter-polaroid" data-val="polaroid">Polaroid</button>
        <button class="grid-btn" id="filter-vintage" data-val="vintage">Vintage</button>
        <button class="grid-btn" id="filter-cool" data-val="cool">Cool</button>
      </div>
      
      <div class="section-label">Preset</div>
      <div class="preset-grid">
         <button class="grid-btn" id="preset-neon">Neon</button>
         <button class="grid-btn" id="preset-vintage">Vintage</button>
         <button class="grid-btn" id="preset-glitch">Glitch</button>
         <button class="grid-btn" id="preset-clean">Clean</button>
      </div>
    </div>
    <div class="footer">
      <button id="btn-reset" class="action-btn btn-reset">Reset</button>
      <button id="btn-save" class="action-btn btn-save">Esporta</button>
    </div>
    <div id="status"></div>
  `;
  document.body.appendChild(sidebar);

  // 3. EVENT BINDING (Il cuore della correzione)
  
  // A. Upload
  document.getElementById('btn-upload').addEventListener('click', () => {
    document.getElementById('file-input').click();
  });
  
  document.getElementById('file-input').addEventListener('change', (e) => {
    let file = e.target.files[0];
    if(file) {
      let reader = new FileReader();
      reader.onload = (evt) => {
        loadImage(evt.target.result, (loaded) => {
           img = loaded;
           updateImage();
           showStatus('Immagine Caricata');
        });
      };
      reader.readAsDataURL(file);
    }
  });

  // B. Effetti (Toggle + Slider)
  const effectKeys = ['glitch', 'chromatic', 'pixel', 'blur', 'halftone', 'distort'];
  const paramKeys = ['glitchInt', 'chromaticOff', 'pixelSize', 'blurInt', 'halftoneSize', 'distortAmt'];
  
  effectKeys.forEach((key, index) => {
    // Toggle click header
    document.getElementById(`header-${key}`).addEventListener('click', () => {
       effects[key] = !effects[key];
       toggleRowClass(key);
       updateImage();
    });
    
    // Slider input
    let pKey = paramKeys[index];
    let slider = document.getElementById(`slider-${pKey}`);
    slider.addEventListener('input', (e) => {
       let val = parseFloat(e.target.value);
       params[pKey] = val;
       document.getElementById(`val-${pKey}`).innerText = Math.floor(val);
       
       // Auto-attiva se muovi slider
       if(val > 0 && !effects[key]) {
         effects[key] = true;
         toggleRowClass(key);
       }
       updateImage();
    });
  });

  // C. Filtri Colore
  const filters = ['none', 'grayscale', 'sepia', 'polaroid', 'vintage', 'cool'];
  filters.forEach(f => {
    document.getElementById(`filter-${f}`).addEventListener('click', (e) => {
       colorFilter = f;
       filters.forEach(x => document.getElementById(`filter-${x}`).classList.remove('active'));
       e.target.classList.add('active');
       updateImage();
    });
  });

  // D. Presets
  document.getElementById('preset-neon').addEventListener('click', () => applyPreset('neon'));
  document.getElementById('preset-vintage').addEventListener('click', () => applyPreset('vintage'));
  document.getElementById('preset-glitch').addEventListener('click', () => applyPreset('glitch'));
  document.getElementById('preset-clean').addEventListener('click', () => resetAll());
  
  // E. Footer Actions
  document.getElementById('btn-reset').addEventListener('click', resetAll);
  document.getElementById('btn-save').addEventListener('click', () => {
    if(img) { saveCanvas('Raster_Pro', 'png'); showStatus('Download...'); }
    else showStatus('Nessuna immagine');
  });
}

function renderEffectRow(key, title, param, min, max, val) {
  return `
    <div class="effect-row" id="row-${key}">
      <div class="effect-header" id="header-${key}">
        <span>${title}</span>
        <div class="toggle-switch"></div>
      </div>
      <div class="slider-container">
        <div style="display:flex; justify-content:space-between; font-size:10px; color:#888;">
           <span>Valore</span><span id="val-${param}">${val}</span>
        </div>
        <input type="range" id="slider-${param}" min="${min}" max="${max}" value="${val}">
      </div>
    </div>
  `;
}

function toggleRowClass(key) {
  let el = document.getElementById(`row-${key}`);
  if(effects[key]) el.classList.add('active');
  else el.classList.remove('active');
}

// --- HELPER FUNCTIONS ---

function applyPreset(name) {
  resetAll(false); // Reset senza aggiornare immagine subito
  
  if(name === 'neon') {
    params.glitchInt = 60; params.chromaticOff = 15;
    effects.glitch = true; effects.chromatic = true;
  } else if (name === 'vintage') {
    params.halftoneSize = 6; effects.halftone = true;
    colorFilter = 'sepia';
  } else if (name === 'glitch') {
    params.glitchInt = 90; params.distortAmt = 40; params.pixelSize = 4;
    effects.glitch = true; effects.distort = true; effects.pixel = true;
  }
  
  syncUI();
  updateImage();
}

function resetAll(refresh = true) {
  Object.keys(effects).forEach(k => effects[k] = false);
  params = { glitchInt: 0, chromaticOff: 0, pixelSize: 2, blurInt: 0, halftoneSize: 3, distortAmt: 0 };
  colorFilter = 'none';
  if(refresh) { syncUI(); updateImage(); }
}

function syncUI() {
  // Sync sliders and classes based on state
  const keys = ['glitch', 'chromatic', 'pixel', 'blur', 'halftone', 'distort'];
  const pKeys = ['glitchInt', 'chromaticOff', 'pixelSize', 'blurInt', 'halftoneSize', 'distortAmt'];
  
  keys.forEach((k, i) => {
    toggleRowClass(k);
    let sl = document.getElementById(`slider-${pKeys[i]}`);
    let lb = document.getElementById(`val-${pKeys[i]}`);
    if(sl) sl.value = params[pKeys[i]];
    if(lb) lb.innerText = Math.floor(params[pKeys[i]]);
  });
  
  // Reset filters visual
  const filters = ['none', 'grayscale', 'sepia', 'polaroid', 'vintage', 'cool'];
  filters.forEach(x => document.getElementById(`filter-${x}`).classList.remove('active'));
  document.getElementById('filter-none').classList.add('active');
}

function showStatus(msg) {
  let el = document.getElementById('status');
  el.innerText = msg;
  el.style.opacity = 1;
  setTimeout(() => el.style.opacity = 0, 3000);
}

function windowResized() {
  resizeCanvas(window.innerWidth - SIDEBAR_WIDTH, window.innerHeight);
  updateImage();
}