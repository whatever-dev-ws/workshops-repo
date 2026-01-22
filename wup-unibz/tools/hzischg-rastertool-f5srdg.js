// WUP 2025/26
// Hannah Marlen Zischg
// RASTER PRO TOOL - SINGLE FILE VERSION (No p5.dom needed)

// --- CONFIGURAZIONE E STATO ---
let img;
let effects = {
  glitch: false, chromatic: false, pixel: false,
  blur: false, halftone: false, distort: false
};

let params = {
  glitchInt: 0, chromaticOff: 0, pixelSize: 2,
  blurInt: 0, halftoneSize: 3, distortAmt: 0
};

let colorFilter = 'none'; // 'none', 'grayscale', 'sepia', 'polaroid', 'vintage', 'cool', 'halftone-bw'

// Larghezza Sidebar
const SIDEBAR_WIDTH = 320; 

function setup() {
  // 1. Inietta CSS e Struttura HTML (Sostituisce p5.dom)
  createInterfaceJS();

  // 2. Crea Canvas
  // Calcola spazio disponibile (schermo - sidebar)
  let w = window.innerWidth - SIDEBAR_WIDTH;
  let h = window.innerHeight;
  
  let cnv = createCanvas(w, h);
  cnv.id('p5Canvas');
  
  // 3. Posiziona il canvas via CSS nativo
  let canvasEl = document.getElementById('p5Canvas');
  canvasEl.style.position = 'absolute';
  canvasEl.style.top = '0px';
  canvasEl.style.left = SIDEBAR_WIDTH + 'px';
  canvasEl.style.zIndex = '0'; // Dietro eventuali popup

  background(18, 18, 18);
  
  // Render iniziale (testo vuoto)
  updateImage();
}

function draw() {
  // Il draw loop è vuoto perché aggiorniamo l'immagine solo quando serve (risparmio CPU)
}

// --- LOGICA CORE DI RENDERING ---

function updateImage() {
  // Resetta sfondo
  background(18, 18, 18);
  
  if (!img) {
    textAlign(CENTER, CENTER);
    fill(80); noStroke(); textFont('Inter, sans-serif'); textSize(14);
    text('Nessuna immagine caricata', width/2, height/2);
    return;
  }
  
  // Calcolo per adattare l'immagine al canvas mantenendo l'aspect ratio
  // Lasciamo un po' di margine (padding 40px)
  let availableW = width - 40;
  let availableH = height - 40;
  
  let scaleFactor = min(availableW / img.width, availableH / img.height, 1);
  let dispW = floor(img.width * scaleFactor);
  let dispH = floor(img.height * scaleFactor);
  
  let x = (width - dispW) / 2;
  let y = (height - dispH) / 2;
  
  // Se nessun effetto è attivo, disegna l'immagine originale (veloce)
  if (!Object.values(effects).some(e => e) && colorFilter === 'none') {
    image(img, x, y, dispW, dispH);
    return;
  }
  
  // Buffer per elaborazione pixel
  let tempImg = createImage(dispW, dispH);
  tempImg.copy(img, 0, 0, img.width, img.height, 0, 0, dispW, dispH);
  tempImg.loadPixels();
  
  // Pipeline Effetti
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

// --- ALGORITMI EFFETTI ---

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
          img.pixels[ti] = img.pixels[si];
          img.pixels[ti+1] = img.pixels[si+1];
          img.pixels[ti+2] = img.pixels[si+2];
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
      let r = img.pixels[idx];
      let g = img.pixels[idx+1];
      let b = img.pixels[idx+2];
      
      for (let dy=0; dy<size && y+dy<img.height; dy++) {
        for (let dx=0; dx<size && x+dx<img.width; dx++) {
          let ti = ((y+dy)*img.width + (x+dx)) * 4;
          img.pixels[ti] = r; 
          img.pixels[ti+1] = g; 
          img.pixels[ti+2] = b;
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
            img.pixels[ti] = r * 0.6; img.pixels[ti+1] = g * 0.6; img.pixels[ti+2] = b * 0.6;
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
      img.pixels[ti] = temp[si];
      img.pixels[ti+1] = temp[si+1];
      img.pixels[ti+2] = temp[si+2];
    }
  }
}

function applyColorFilterToImage(img) {
  for(let i=0; i<img.pixels.length; i+=4) {
    let r = img.pixels[i], g = img.pixels[i+1], b = img.pixels[i+2];
    switch(colorFilter) {
      case 'grayscale':
        let gray = r * 0.2126 + g * 0.7152 + b * 0.0722;
        img.pixels[i] = img.pixels[i+1] = img.pixels[i+2] = gray; break;
      case 'sepia':
        img.pixels[i] = min(255, r*.393+g*.769+b*.189);
        img.pixels[i+1] = min(255, r*.349+g*.686+b*.168);
        img.pixels[i+2] = min(255, r*.272+g*.534+b*.131); break;
      case 'polaroid':
        img.pixels[i] = constrain(r*1.2-10,0,255);
        img.pixels[i+1] = constrain(g*1.15-5,0,255);
        img.pixels[i+2] = constrain(b*1.05,0,255); break;
      case 'vintage':
        img.pixels[i] = min(255, r*1.1); img.pixels[i+1] = min(255, g*1.05); img.pixels[i+2] = b*0.85; break;
      case 'cool':
        img.pixels[i] = r*0.9; img.pixels[i+1] = min(255, g*1.05); img.pixels[i+2] = min(255, b*1.2); break;
      case 'halftone-bw':
        let bw = r * 0.2126 + g * 0.7152 + b * 0.0722;
        img.pixels[i] = img.pixels[i+1] = img.pixels[i+2] = bw; break;
    }
  }
}

// --- FUNZIONI WINDOW (INTERFACCIA) ---

// Caricamento Immagine Nativo (senza createFileInput di p5.dom)
window.triggerUpload = function() {
  // Crea input file temporaneo
  let input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = e => {
    let file = e.target.files[0];
    if (file) {
      let reader = new FileReader();
      reader.onload = function(event) {
        // Carica in p5
        loadImage(event.target.result, (loadedImg) => {
          img = loadedImg;
          updateImage();
          window.showStatus('Immagine caricata');
        });
      };
      reader.readAsDataURL(file);
    }
  };
  input.click();
}

window.toggleEffect = function(name) {
  effects[name] = !effects[name];
  // Toggle class nativo
  let el = document.getElementById('row-' + name);
  if(effects[name]) el.classList.add('active');
  else el.classList.remove('active');
  updateImage();
}

window.updateParam = function(key, val) {
  params[key] = parseFloat(val);
  document.getElementById('val-' + key).innerText = Math.floor(val);
  
  // Auto-attiva effetto
  let map = {glitchInt:'glitch',chromaticOff:'chromatic',pixelSize:'pixel',blurInt:'blur',halftoneSize:'halftone',distortAmt:'distort'};
  let effect = map[key];
  if(effect && val > 0 && !effects[effect]) {
    effects[effect] = true;
    document.getElementById('row-' + effect).classList.add('active');
  }
  updateImage();
}

window.applyColorFilter = function(name) {
  colorFilter = name;
  // Gestione classi active nativa
  let btns = document.querySelectorAll('.filter-btn');
  btns.forEach(b => b.classList.remove('active'));
  let activeBtn = document.getElementById('filter-' + name);
  if(activeBtn) activeBtn.classList.add('active');
  updateImage();
}

window.applyPreset = function(name) {
  window.resetEffects();
  if(name === 'neon') {
    params.glitchInt = 60; params.chromaticOff = 15;
    effects.glitch = true; effects.chromatic = true;
  } else if (name === 'vintage') {
    params.halftoneSize = 6; effects.halftone = true;
  } else if (name === 'glitchcore') {
    params.glitchInt = 90; params.distortAmt = 40; params.pixelSize = 4;
    effects.glitch = true; effects.distort = true; effects.pixel = true;
  } else if (name === 'clean') {
    // just reset
  }
  window.syncUI();
  updateImage();
}

window.resetEffects = function() {
  Object.keys(effects).forEach(k => effects[k] = false);
  Object.keys(params).forEach(k => {
     // Valori di default
     if(k==='pixelSize') params[k]=2; 
     else if(k==='halftoneSize') params[k]=3;
     else params[k]=0;
  });
  colorFilter = 'none';
  window.syncUI();
}

window.syncUI = function() {
  // Sync HTML elements
  Object.keys(effects).forEach(k => {
    let el = document.getElementById('row-'+k);
    if(effects[k]) el.classList.add('active'); else el.classList.remove('active');
  });
  Object.keys(params).forEach(k => {
    let sl = document.getElementById('slider-'+k);
    let vl = document.getElementById('val-'+k);
    if(sl) sl.value = params[k];
    if(vl) vl.innerText = Math.floor(params[k]);
  });
  let btns = document.querySelectorAll('.filter-btn');
  btns.forEach(b => b.classList.remove('active'));
  let def = document.getElementById('filter-none');
  if(def) def.classList.add('active');
}

window.saveResult = function() {
  if(!img) return window.showStatus('Nessuna immagine');
  saveCanvas('raster-pro-export', 'png');
  window.showStatus('Salvato!');
}

window.showStatus = function(msg) {
  let el = document.getElementById('status-msg');
  el.innerText = msg;
  el.style.opacity = 1;
  setTimeout(() => el.style.opacity = 0, 3000);
}

// --- CREAZIONE UI NATIVA (NO p5.dom) ---

const icons = {
  upload: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`,
  glitch: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
  chromatic: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/></svg>`,
  pixel: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>`,
  blur: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>`,
  halftone: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/><circle cx="12" cy="19" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="19" cy="19" r="1"/><circle cx="5" cy="5" r="1"/><circle cx="19" cy="5" r="1"/><circle cx="5" cy="19" r="1"/></svg>`,
  distort: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12c5.5-8 14.5 8 20 0"/></svg>`,
  reset: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>`,
  save: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>`
};

function createInterfaceJS() {
  // 1. CSS
  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
    body, html { margin: 0; padding: 0; overflow: hidden; background: #121212; width: 100%; height: 100%; }
    
    #sidebar-container {
      position: absolute; left: 0; top: 0; bottom: 0; width: 320px;
      background: #1e1e1e; border-right: 1px solid #333;
      font-family: 'Inter', sans-serif; color: #e0e0e0;
      display: flex; flex-direction: column; overflow: hidden; z-index: 10;
    }
    
    .header { padding: 20px; border-bottom: 1px solid #333; background: #1e1e1e; }
    .header h1 { font-size: 14px; font-weight: 600; margin: 0 0 15px 0; letter-spacing: 0.5px; color: #fff; text-transform: uppercase; }
    
    .scroll-area { flex: 1; overflow-y: auto; padding: 20px; }
    .scroll-area::-webkit-scrollbar { width: 6px; }
    .scroll-area::-webkit-scrollbar-thumb { background: #444; border-radius: 3px; }
    
    .upload-btn { width: 100%; padding: 12px; background: #252525; border: 1px solid #333; color: #fff; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 13px; transition: 0.2s; }
    .upload-btn:hover { background: #333; border-color: #555; }
    
    .section-label { font-size: 11px; font-weight: 600; color: #666; text-transform: uppercase; margin: 25px 0 10px 0; letter-spacing: 1px; }
    
    .effect-row { background: #252525; border: 1px solid #333; border-radius: 8px; margin-bottom: 8px; padding: 12px; transition: 0.2s; }
    .effect-row.active { background: #2c2c2c; border-color: #007AFF; }
    
    .effect-header { display: flex; justify-content: space-between; align-items: center; cursor: pointer; user-select: none; }
    .effect-title { display: flex; align-items: center; gap: 10px; font-size: 13px; font-weight: 500; }
    .effect-title svg { color: #888; }
    .effect-row.active .effect-title svg { color: #007AFF; }
    
    .toggle-switch { width: 32px; height: 18px; background: #444; border-radius: 10px; position: relative; transition: 0.3s; }
    .toggle-switch::after { content: ''; position: absolute; top: 2px; left: 2px; width: 14px; height: 14px; background: #fff; border-radius: 50%; transition: 0.3s; }
    .effect-row.active .toggle-switch { background: #007AFF; }
    .effect-row.active .toggle-switch::after { transform: translateX(14px); }
    
    .slider-container { margin-top: 12px; display: none; padding-top: 10px; border-top: 1px solid #333; }
    .effect-row.active .slider-container { display: block; }
    
    input[type=range] { width: 100%; -webkit-appearance: none; background: transparent; }
    input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; height: 14px; width: 14px; border-radius: 50%; background: #fff; cursor: pointer; margin-top: -5px; }
    input[type=range]::-webkit-slider-runnable-track { width: 100%; height: 4px; background: #444; border-radius: 2px; }
    
    .value-display { display: flex; justify-content: space-between; font-size: 10px; color: #888; margin-bottom: 5px; }
    
    .preset-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .preset-btn, .filter-btn { background: #252525; border: 1px solid #333; color: #aaa; padding: 10px; border-radius: 6px; cursor: pointer; font-size: 11px; text-align: center; transition: 0.2s; }
    .preset-btn:hover, .filter-btn:hover { background: #333; color: #fff; }
    .filter-btn.active { background: #007AFF; color: white; border-color: #007AFF; }
    
    .footer { padding: 20px; border-top: 1px solid #333; background: #1e1e1e; display: grid; grid-template-columns: 1fr 2fr; gap: 10px; }
    .btn-action { border: none; border-radius: 6px; padding: 12px; font-size: 13px; font-weight: 500; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; }
    .btn-reset { background: #252525; color: #fff; border: 1px solid #333; }
    .btn-save { background: #007AFF; color: white; }
    
    #status-msg { position: fixed; bottom: 20px; right: 20px; background: #333; color: white; padding: 10px 20px; border-radius: 50px; font-size: 12px; opacity: 0; pointer-events: none; transition: opacity 0.3s; font-family: 'Inter', sans-serif; z-index: 99; }
  `;
  
  let s = document.createElement('style');
  s.type = 'text/css';
  s.appendChild(document.createTextNode(css));
  document.head.appendChild(s);
  
  // 2. HTML
  let sidebar = document.createElement('div');
  sidebar.id = 'sidebar-container';
  sidebar.innerHTML = `
    <div class="header">
      <h1>Raster Pro Editor</h1>
      <button class="upload-btn" onclick="window.triggerUpload()">
        ${icons.upload} Carica Immagine
      </button>
    </div>

    <div class="scroll-area">
      <div class="section-label">Effetti</div>

      ${makeEffectRow('glitch', icons.glitch, 'Glitch', 'Intensità', 'glitchInt', 0, 100, 0)}
      ${makeEffectRow('chromatic', icons.chromatic, 'Aberrazione', 'Offset', 'chromaticOff', 0, 40, 0)}
      ${makeEffectRow('pixel', icons.pixel, 'Pixelate', 'Dimensione', 'pixelSize', 2, 25, 2)}
      ${makeEffectRow('blur', icons.blur, 'Sfocatura', 'Livello', 'blurInt', 0, 15, 0)}
      ${makeEffectRow('halftone', icons.halftone, 'Halftone', 'Punti', 'halftoneSize', 3, 12, 3)}
      ${makeEffectRow('distort', icons.distort, 'Distorsione', 'Ampiezza', 'distortAmt', 0, 100, 0)}

      <div class="section-label">Filtri Colore</div>
      <div class="preset-grid">
        <button class="filter-btn active" id="filter-none" onclick="window.applyColorFilter('none')">Nessuno</button>
        <button class="filter-btn" id="filter-grayscale" onclick="window.applyColorFilter('grayscale')">B&W</button>
        <button class="filter-btn" id="filter-sepia" onclick="window.applyColorFilter('sepia')">Seppia</button>
        <button class="filter-btn" id="filter-polaroid" onclick="window.applyColorFilter('polaroid')">Polaroid</button>
        <button class="filter-btn" id="filter-vintage" onclick="window.applyColorFilter('vintage')">Vintage</button>
        <button class="filter-btn" id="filter-cool" onclick="window.applyColorFilter('cool')">Cool</button>
        <button class="filter-btn" id="filter-halftone-bw" onclick="window.applyColorFilter('halftone-bw')">Halftone B&W</button>
      </div>

      <div class="section-label">Preset Rapidi</div>
      <div class="preset-grid">
        <button class="preset-btn" onclick="window.applyPreset('neon')">Neon City</button>
        <button class="preset-btn" onclick="window.applyPreset('vintage')">Vintage Paper</button>
        <button class="preset-btn" onclick="window.applyPreset('glitchcore')">System Fail</button>
        <button class="preset-btn" onclick="window.applyPreset('clean')">Clean Up</button>
      </div>
    </div>

    <div class="footer">
      <button class="btn-action btn-reset" onclick="window.resetEffects()">${icons.reset} Reset</button>
      <button class="btn-action btn-save" onclick="window.saveResult()">${icons.save} Esporta</button>
    </div>
    <div id="status-msg"></div>
  `;
  document.body.appendChild(sidebar);
}

function makeEffectRow(id, icon, title, label, param, min, max, val) {
  return `
    <div class="effect-row" id="row-${id}">
        <div class="effect-header" onclick="window.toggleEffect('${id}')">
          <div class="effect-title">${icon} ${title}</div>
          <div class="toggle-switch"></div>
        </div>
        <div class="slider-container">
          <div class="value-display"><span>${label}</span><span id="val-${param}">${val}</span></div>
          <input type="range" id="slider-${param}" min="${min}" max="${max}" value="${val}" oninput="window.updateParam('${param}', this.value)">
        </div>
      </div>
  `;
}

function windowResized() {
  resizeCanvas(window.innerWidth - SIDEBAR_WIDTH, window.innerHeight);
  updateImage();
}