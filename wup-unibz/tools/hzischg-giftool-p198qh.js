// WUP 2025/25
// Hannah Zischg
// VERSIONE SINGLE-FILE (JS + UI + CSS tutto in uno)

// --- CONFIGURAZIONE VARIABILI ---
let shape3D = { type: 'cube', vertices: [], size: 150, segments: 24 };
let params = {
  // Deformazione
  morph: 20, twist: 0, bulge: 0, noise: 0, wave: 30, explode: 0,
  // Rotazione e Camera
  rotSpeed: 1.5, autoRotate: true, zoom: 1.0,
  // Stile
  hue: 330, fillShape: true, wireframe: true, trails: false
};

let autoAngle = 0;
let isRecording = false;
let recordDuration = 5; 
let canvas;
let sidebar; // Riferimento alla sidebar

let mediaRecorder;
let recordedChunks = [];

// Larghezza Sidebar fissa
const SIDEBAR_WIDTH = 300; 

function setup() {
  // 1. Inietta lo stile globale (resetta margini body)
  injectGlobalStyles();

  // 2. Impostazioni buffer per screenshot e video
  setAttributes('preserveDrawingBuffer', true);
  
  // 3. Crea il Canvas spostato a destra
  canvas = createCanvas(windowWidth - SIDEBAR_WIDTH, windowHeight, WEBGL);
  canvas.id('myCanvas');
  canvas.position(SIDEBAR_WIDTH, 0);
  
  pixelDensity(1); 
  
  // 4. Inizializza tutto
  initShape();
  createProUI();
}

// Funzione per pulire la pagina da margini indesiderati (sostituisce il style.css)
function injectGlobalStyles() {
  let css = `
    body, html { margin: 0; padding: 0; overflow: hidden; background-color: #0f0f14; }
    canvas { display: block; outline: none; }
  `;
  let style = document.createElement('style');
  style.type = 'text/css';
  style.appendChild(document.createTextNode(css));
  document.head.appendChild(style);
}

function initShape() {
  shape3D.vertices = [];
  let d = shape3D.segments;
  let s = 1;

  if (shape3D.type === 'cube') {
    // Generazione Cubo
    shape3D.vertices = [
      {n: [0,0,1], v:[[-s,-s,s],[s,-s,s],[s,s,s],[-s,s,s]]}, 
      {n: [0,0,-1], v:[[-s,-s,-s],[-s,s,-s],[s,s,-s],[s,-s,s]]},
      {n: [-1,0,0], v:[[-s,-s,-s],[-s,-s,s],[-s,s,s],[-s,s,-s]]}, 
      {n: [1,0,0], v:[[s,-s,-s],[s,s,-s],[s,s,s],[s,-s,s]]},
      {n: [0,1,0], v:[[-s,s,-s],[-s,s,s],[s,s,s],[s,s,-s]]}, 
      {n: [0,-1,0], v:[[-s,-s,-s],[s,-s,-s],[s,-s,s],[-s,-s,s]]}
    ];
  } else if (shape3D.type === 'sphere') {
    // Generazione Sfera
    for(let i=0; i<=d; i++){
      let lat = map(i,0,d,0,PI);
      for(let j=0; j<=d; j++){
        let lon = map(j,0,d,0,TWO_PI);
        let x = sin(lat) * cos(lon);
        let y = cos(lat);
        let z = sin(lat) * sin(lon);
        shape3D.vertices.push(createVector(x, y, z));
      }
    }
  }
}

function draw() {
  // --- GESTIONE SCIE (TRAILS) ---
  if (params.trails) {
    push();
    // Resetta la camera per disegnare in 2D sopra la scena 3D
    camera(0, 0, (height/2.0) / tan(PI*30.0 / 180.0), 0, 0, 0, 0, 1, 0);
    translate(0, 0, -100); 
    noStroke();
    fill(15, 15, 20, 30); // Colore sfondo con opacità bassa
    plane(width*2, height*2); 
    pop();
    
    // Pulisci il Depth Buffer per evitare glitch grafici
    let gl = this._renderer.GL;
    gl.clear(gl.DEPTH_BUFFER_BIT);
    
  } else {
    // Sfondo standard se le scie sono spente
    background(15, 15, 20);
  }

  // --- RENDERING SCENA ---
  orbitControl(); 
  scale(params.zoom);

  if (params.autoRotate) {
    autoAngle += 0.01 * params.rotSpeed;
    rotateX(autoAngle); rotateY(autoAngle * 0.7);
  }

  // Luce e Colore
  colorMode(HSB, 360, 100, 100, 1);
  
  if(params.fillShape) {
    fill(params.hue, 70, 90);
    ambientLight(60);
    directionalLight(0, 0, 100, 0.5, 1, -1);
    pointLight(0, 0, 100, 0, 0, 200);
  } else {
    noFill();
  }

  if(params.wireframe) {
    stroke(params.hue, 90, 100);
    strokeWeight(1.2);
  } else {
    noStroke();
  }
  
  renderShape();
  
  colorMode(RGB, 255);
}

function renderShape() {
  let s = shape3D.size;
  
  if (shape3D.type === 'cube') {
    shape3D.vertices.forEach((face, i) => {
      push();
      translate(face.n[0]*params.explode, face.n[1]*params.explode, face.n[2]*params.explode);
      beginShape();
      face.v.forEach(v => {
        let p = applyDeform(v[0]*s, v[1]*s, v[2]*s, i);
        vertex(p.x, p.y, p.z);
      });
      endShape(CLOSE);
      pop();
    });
  } else {
    let d = shape3D.segments;
    for (let i = 0; i < d; i++) {
      beginShape(TRIANGLE_STRIP);
      for (let j = 0; j <= d; j++) {
        [i * (d + 1) + j, (i + 1) * (d + 1) + j].forEach(idx => {
          let v = shape3D.vertices[idx];
          if(v) {
            let p = applyDeform(v.x*s, v.y*s, v.z*s, idx);
            let dir = p.copy().normalize();
            p.add(dir.mult(params.explode));
            vertex(p.x, p.y, p.z);
          }
        });
      }
      endShape();
    }
  }
}

function applyDeform(x, y, z, i) {
  let p = createVector(x, y, z);
  let t = frameCount * 0.05;
  
  if (params.morph > 0) p.mult(1 + (params.morph/150) * sin(t + i*0.1));
  
  if (params.twist > 0) {
    let angle = (p.y / 200) * (params.twist/8);
    let nx = p.x * cos(angle) - p.z * sin(angle);
    let nz = p.x * sin(angle) + p.z * cos(angle);
    p.x = nx; p.z = nz;
  }
  
  if (params.bulge > 0) p.mult(1 + (params.bulge/150) * sin(p.mag() * 0.03 + t));
  
  if (params.noise > 0) {
    p.x += (noise(p.x*0.01, t) - 0.5) * params.noise;
    p.y += (noise(p.y*0.01, t+10) - 0.5) * params.noise;
    p.z += (noise(p.z*0.01, t+20) - 0.5) * params.noise;
  }
  
  if (params.wave > 0) {
    p.x += sin(p.y * 0.04 + t) * (params.wave/1.5);
    p.z += cos(p.y * 0.04 + t) * (params.wave/1.5);
  }
  
  return p;
}

// --- EXPORT FUNZIONI ---

function takeScreenshot() {
  saveCanvas('Design_3D', 'png');
}

function startRecording() {
  recordedChunks = [];
  let stream = document.getElementById('myCanvas').captureStream(30);
  mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });

  mediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) recordedChunks.push(e.data);
  };

  mediaRecorder.onstop = () => {
    let blob = new Blob(recordedChunks, { type: 'video/webm' });
    let url = URL.createObjectURL(blob);
    let a = document.createElement('a');
    a.href = url;
    a.download = 'animazione.webm';
    a.click();
    
    let btn = document.getElementById('btn-rec');
    btn.innerHTML = icons.video + " REGISTRA";
    btn.style.background = "#e0e0e0";
    isRecording = false;
  };

  mediaRecorder.start();
  isRecording = true;
  
  let btn = document.getElementById('btn-rec');
  btn.innerHTML = "🔴 REC...";
  btn.style.background = "#ff1744";

  setTimeout(() => {
    if(mediaRecorder.state === 'recording') mediaRecorder.stop();
  }, recordDuration * 1000);
}

// --- INTERFACCIA UTENTE E STILE INLINE ---

const icons = {
  cube: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>`,
  sphere: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle></svg>`,
  video: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect></svg>`,
  photo: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>`,
  magic: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>`
};

function makeSliderControl(label, param, min, max, val, step=1) {
  return `
    <div class="control-row">
      <div class="label-row">
        <span>${label}</span>
        <span id="val-${param}" class="val-disp">${val}</span>
      </div>
      <input type="range" id="sld-${param}" min="${min}" max="${max}" step="${step}" value="${val}" 
             oninput="updateParam('${param}', this.value)">
    </div>
  `;
}

function createProUI() {
  sidebar = createDiv();
  sidebar.position(0, 0); 
  sidebar.size(SIDEBAR_WIDTH, windowHeight);
  sidebar.class('sidebar');

  // Qui iniettiamo tutto il CSS specifico della sidebar dentro la sidebar stessa
  sidebar.html(`
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap');
      
      .sidebar {
        background: #121212;
        color: #eee;
        font-family: 'Inter', sans-serif;
        display: flex; flex-direction: column;
        border-right: 1px solid #2a2a2a;
        overflow-y: auto; user-select: none;
        box-sizing: border-box; /* Importante per evitare sballi di larghezza */
      }
      
      .header { padding: 15px; border-bottom: 1px solid #333; }
      .header h2 { font-size: 14px; margin: 0; color: #fff; text-transform: uppercase; letter-spacing: 1px; }
      
      .section { padding: 15px; border-bottom: 1px solid #222; }
      .sec-title { font-size: 10px; font-weight: 600; color: #666; text-transform: uppercase; margin-bottom: 10px; display: block; }
      
      /* Toggle Pulsanti */
      .geo-toggles { display: flex; gap: 5px; background: #1a1a1a; padding: 4px; border-radius: 6px; }
      .geo-btn { flex: 1; background: transparent; border: none; color: #888; padding: 8px; cursor: pointer; border-radius: 4px; display: flex; align-items: center; justify-content: center; gap: 5px; font-size: 11px; }
      .geo-btn.active { background: #333; color: #fff; }
      
      /* Preset Grid */
      .preset-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
      .preset-btn {
          background: #1a1a1a; border: 1px solid #333; color: #aaa;
          padding: 8px; border-radius: 4px; cursor: pointer; font-size: 10px;
          display: flex; align-items: center; gap: 6px; transition: all 0.2s;
      }
      .preset-btn:hover { border-color: #f50057; color: #fff; background: #222; }

      /* Sliders */
      .control-row { margin-bottom: 12px; }
      .label-row { display: flex; justify-content: space-between; font-size: 11px; color: #aaa; margin-bottom: 4px; }
      .val-disp { color: #f50057; font-weight: 600; }
      
      input[type="range"] { width: 100%; cursor: pointer; height: 4px; accent-color: #f50057; }
      
      /* Checkbox */
      .check-row { display: flex; gap: 10px; margin-top: 10px; }
      .check-lbl { font-size: 11px; display: flex; align-items: center; gap: 5px; color: #ccc; cursor: pointer; }
      input[type="checkbox"] { accent-color: #f50057; }

      /* Export Buttons */
      .export-row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 10px; }
      .btn-exp { border: none; padding: 10px; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: 600; display: flex; justify-content: center; gap: 5px; align-items: center; }
      .btn-rec { background: #e0e0e0; color: #000; }
      .btn-shot { background: #222; color: #fff; border: 1px solid #333; }
      
      select { width: 100%; background: #222; color: #fff; border: 1px solid #333; padding: 6px; font-size: 11px; border-radius: 4px; }
    </style>

    <div class="header">
      <h2>3D Motion Studio</h2>
    </div>

    <div class="section">
      <span class="sec-title">Forma & Preset</span>
      <div class="geo-toggles" style="margin-bottom:12px;">
        <button class="geo-btn active" id="btn-cube" onclick="window.setShape('cube')">${icons.cube} CUBE</button>
        <button class="geo-btn" id="btn-sphere" onclick="window.setShape('sphere')">${icons.sphere} SPHERE</button>
      </div>
      <div class="preset-grid">
         <button class="preset-btn" onclick="window.applyPreset('cyber')">${icons.magic} Cyber</button>
         <button class="preset-btn" onclick="window.applyPreset('liquid')">${icons.magic} Liquid</button>
         <button class="preset-btn" onclick="window.applyPreset('chaos')">${icons.magic} Chaos</button>
         <button class="preset-btn" onclick="window.applyPreset('zen')">${icons.magic} Zen</button>
      </div>
    </div>

    <div class="section">
      <span class="sec-title">Deformazioni</span>
      ${makeSliderControl('Morph', 'morph', 0, 100, 20)}
      ${makeSliderControl('Twist', 'twist', 0, 100, 0)}
      ${makeSliderControl('Bulge', 'bulge', 0, 100, 0)}
      ${makeSliderControl('Noise', 'noise', 0, 100, 0)}
      ${makeSliderControl('Wave', 'wave', 0, 100, 30)}
      ${makeSliderControl('Esplodi', 'explode', 0, 200, 0)}
    </div>

    <div class="section">
      <span class="sec-title">Stile & Camera</span>
      ${makeSliderControl('Colore', 'hue', 0, 360, 330)}
      ${makeSliderControl('Zoom', 'zoom', 0.5, 3, 1, 0.1)}
      ${makeSliderControl('Velocità', 'rotSpeed', 0, 5, 1.5, 0.1)}
      
      <div class="check-row">
        <label class="check-lbl"><input type="checkbox" id="chk-fill" checked onchange="window.setBool('fillShape', this.checked)"> Pieno</label>
        <label class="check-lbl"><input type="checkbox" id="chk-wire" checked onchange="window.setBool('wireframe', this.checked)"> Linee</label>
        <label class="check-lbl"><input type="checkbox" id="chk-trail" onchange="window.setBool('trails', this.checked)"> Scie</label>
      </div>
    </div>

    <div class="section" style="border:none">
      <span class="sec-title">Esporta</span>
      <select onchange="recordDuration=parseInt(this.value)">
        <option value="5">Durata: 5 Secondi</option>
        <option value="10">Durata: 10 Secondi</option>
        <option value="15">Durata: 15 Secondi</option>
      </select>
      <div class="export-row">
        <button class="btn-exp btn-rec" id="btn-rec" onclick="startRecording()">${icons.video} REGISTRA</button>
        <button class="btn-exp btn-shot" onclick="takeScreenshot()">${icons.photo} FOTO</button>
      </div>
    </div>
  `);
}

// --- FUNZIONI GLOBALI (WINDOW) ---

window.setShape = function(type) {
  shape3D.type = type;
  initShape();
  document.getElementById('btn-cube').classList.toggle('active', type === 'cube');
  document.getElementById('btn-sphere').classList.toggle('active', type === 'sphere');
}

window.updateParam = function(key, val) {
  params[key] = parseFloat(val);
  document.getElementById(`val-${key}`).innerText = val;
}

window.setBool = function(key, val) {
  params[key] = val;
}

window.applyPreset = function(name) {
  // Reset base
  params.morph=0; params.twist=0; params.bulge=0; params.noise=0; params.wave=0; params.explode=0;
  params.trails=false; params.fillShape=true; params.wireframe=true; params.zoom=1;

  if (name === 'cyber') {
    window.setShape('cube');
    params.wireframe = true; params.fillShape = false;
    params.hue = 190; params.noise = 60; params.explode = 40; params.rotSpeed = 2;
  } 
  else if (name === 'liquid') {
    window.setShape('sphere');
    params.fillShape = true; params.wireframe = false;
    params.hue = 280; params.morph = 40; params.bulge = 30; params.wave = 50; params.zoom = 1.2;
  } 
  else if (name === 'chaos') {
    window.setShape('cube');
    params.fillShape = true; params.wireframe = true;
    params.hue = 10; params.twist = 80; params.explode = 100; params.trails = true;
  }
  else if (name === 'zen') {
    window.setShape('sphere');
    params.fillShape = false; params.wireframe = true;
    params.hue = 0; params.wave = 10; params.rotSpeed = 0.5; params.zoom = 1.3;
  }
  
  // Sincronizza UI
  syncUI();
}

function syncUI() {
  const keys = ['morph', 'twist', 'bulge', 'noise', 'wave', 'explode', 'hue', 'zoom', 'rotSpeed'];
  keys.forEach(k => {
    let el = document.getElementById(`sld-${k}`);
    let val = document.getElementById(`val-${k}`);
    if(el) el.value = params[k];
    if(val) val.innerText = params[k];
  });
  
  document.getElementById('chk-fill').checked = params.fillShape;
  document.getElementById('chk-wire').checked = params.wireframe;
  document.getElementById('chk-trail').checked = params.trails;
}

function windowResized() {
  resizeCanvas(windowWidth - SIDEBAR_WIDTH, windowHeight);
  if(sidebar) {
    sidebar.size(SIDEBAR_WIDTH, windowHeight);
  }
}