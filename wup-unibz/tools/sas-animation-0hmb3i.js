let layerBg = null; // Background layer
let layerFg = null; // Foreground layer

// DOM Elements variables
let inputBg, inputFg; 
let sliderBg, sliderFg;
let selectorBlend;
let btnGif;

// Variabili per la registrazione GIF
let gifEncoder = null;
let isRecording = false;
let recordedFrames = 0;
const TOTAL_FRAMES = 180; // 6 secondi a 30fps

function setup() {
  // --- CARICAMENTO LIBRERIA GIF.JS (Dinamico) ---
  loadGifLibrary();

  // --- FONT DM SANS ---
  let fontLink = createElement('link');
  fontLink.attribute('rel', 'stylesheet');
  fontLink.attribute('href', 'https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&display=swap');
  document.head.appendChild(fontLink.elt);

  pixelDensity(1); 
  
  // 1. Layout Container
  let mainContainer = createDiv();
  mainContainer.style('display', 'flex');
  mainContainer.style('gap', '20px');
  mainContainer.style('font-family', '"DM Sans", sans-serif');
  mainContainer.style('padding', '20px');
  mainContainer.style('background', 'white');
  mainContainer.style('border-radius', '8px');

  // 2. Sidebar (Controls)
  let controls = createDiv();
  controls.parent(mainContainer);
  controls.style('background', '#f8f9fa'); 
  controls.style('padding', '24px'); 
  controls.style('width', '280px');
  controls.style('border-radius', '12px');
  controls.style('box-shadow', '0 2px 10px rgba(0,0,0,0.05)');

  // --- TITLE ---
  let title = createElement('h2', 'Animation Tool 🌟');
  title.parent(controls);
  title.style('margin-top', '0');
  title.style('font-weight', '700'); 
  title.style('color', '#222');
  title.style('font-size', '24px');
  title.style('text-align', 'center');
  
  let divider = createDiv();
  divider.parent(controls);
  divider.style('height', '1px');
  divider.style('background', '#ddd');
  divider.style('margin', '15px 0');

  // ==========================================
  // --- LAYER 1 CONTROLS (Background) ---
  // ==========================================
  let label1 = createDiv('1. Background');
  label1.parent(controls);
  label1.style('font-weight', '600');
  label1.style('margin-bottom', '8px');
  
  inputBg = createFileInput((f) => handleFile(f, 1));
  inputBg.parent(controls);
  inputBg.style('font-family', 'inherit'); 
  inputBg.style('margin-bottom', '8px');
  
  let btnDel1 = createButton('Remove Background');
  btnDel1.parent(controls);
  styleButton(btnDel1); 
  btnDel1.mousePressed(() => clearLayer(1));

  let rowBgOpt = createDiv();
  rowBgOpt.parent(controls);
  rowBgOpt.style('display', 'flex');
  rowBgOpt.style('align-items', 'center'); 
  rowBgOpt.style('gap', '10px');
  rowBgOpt.style('margin-bottom', '15px');

  createSpan('Opacity').parent(rowBgOpt).style('font-size', '12px').style('color', '#666').style('width', '70px');
  sliderBg = createSlider(0, 255, 255).parent(rowBgOpt);
  sliderBg.style('flex-grow', '1'); 
  sliderBg.style('cursor', 'pointer');
  
  let divider2 = createDiv();
  divider2.parent(controls);
  divider2.style('height', '1px');
  divider2.style('background', '#ddd');
  divider2.style('margin', '15px 0');

  // ==========================================
  // --- LAYER 2 CONTROLS (Foreground) ---
  // ==========================================
  let label2 = createDiv('2. Foreground');
  label2.parent(controls);
  label2.style('font-weight', '600');
  label2.style('margin-bottom', '8px');
  
  inputFg = createFileInput((f) => handleFile(f, 2));
  inputFg.parent(controls);
  inputFg.style('font-family', 'inherit');
  inputFg.style('margin-bottom', '8px');

  let btnDel2 = createButton('Remove Foreground');
  btnDel2.parent(controls);
  styleButton(btnDel2);
  btnDel2.mousePressed(() => clearLayer(2));
  
  let rowFgBlend = createDiv();
  rowFgBlend.parent(controls);
  rowFgBlend.style('display', 'flex');
  rowFgBlend.style('align-items', 'center');
  rowFgBlend.style('gap', '10px');
  rowFgBlend.style('margin-bottom', '8px'); 

  createSpan('Blend Mode').parent(rowFgBlend).style('font-size', '12px').style('color', '#666').style('width', '70px'); 
  
  selectorBlend = createSelect().parent(rowFgBlend);
  selectorBlend.style('flex-grow', '1'); 
  selectorBlend.style('padding', '4px');
  selectorBlend.style('border-radius', '4px');
  selectorBlend.style('border', '1px solid #ccc');
  selectorBlend.style('font-family', 'inherit'); 
  selectorBlend.style('font-size', '11px');

  selectorBlend.option('NORMAL', BLEND);
  selectorBlend.option('MULTIPLY', MULTIPLY);
  selectorBlend.option('SCREEN', SCREEN);
  selectorBlend.option('OVERLAY', OVERLAY);
  selectorBlend.option('DIFFERENCE', DIFFERENCE);
  selectorBlend.option('ADD', ADD);
  selectorBlend.selected(BLEND);

  let rowFgOp = createDiv();
  rowFgOp.parent(controls);
  rowFgOp.style('display', 'flex');
  rowFgOp.style('align-items', 'center');
  rowFgOp.style('gap', '10px');
  rowFgOp.style('margin-bottom', '20px');

  createSpan('Opacity').parent(rowFgOp).style('font-size', '12px').style('color', '#666').style('width', '70px'); 
  
  sliderFg = createSlider(0, 255, 255).parent(rowFgOp);
  sliderFg.style('flex-grow', '1'); 
  sliderFg.style('cursor', 'pointer');
  
  let divider3 = createDiv();
  divider3.parent(controls);
  divider3.style('height', '1px');
  divider3.style('background', '#ddd');
  divider3.style('margin', '20px 0');

  // --- EXPORT BUTTON ---
  btnGif = createButton('Record GIF (6 sec)');
  btnGif.parent(controls);
  btnGif.style('width', '100%');
  btnGif.style('padding', '14px');
  btnGif.style('background-color', '#618A9E'); 
  btnGif.style('color', 'white');
  btnGif.style('border', 'none');
  btnGif.style('border-radius', '8px');
  btnGif.style('cursor', 'pointer');
  btnGif.style('font-weight', '700');
  btnGif.style('font-size', '15px');
  btnGif.style('font-family', 'inherit'); 
  btnGif.style('transition', 'background 0.3s');
  
  btnGif.mouseOver(() => { if(!isRecording) btnGif.style('background-color', '#4d7082') });
  btnGif.mouseOut(() => { if(!isRecording) btnGif.style('background-color', '#618A9E') });
  
  btnGif.mousePressed(startGifRecording);

  // 3. Canvas
  let cnv = createCanvas(600, 400);
  cnv.parent(mainContainer);
  cnv.style('border-radius', '4px');
  cnv.style('box-shadow', '0 4px 15px rgba(0,0,0,0.1)');
  cnv.id('myCanvas');
  
  textFont("DM Sans"); 
}

function styleButton(btn) {
  btn.style('font-size', '12px');
  btn.style('margin-bottom', '10px'); 
  btn.style('cursor', 'pointer');
  btn.style('background', 'white');
  btn.style('border', '1px solid #ccc');
  btn.style('padding', '5px 10px');
  btn.style('border-radius', '4px');
  btn.style('font-family', 'inherit'); 
  btn.style('width', '100%'); 
}

function draw() {
  // SAFEGUARD: Assicuriamoci che i video girino
  if (layerBg && layerBg.elt && layerBg.elt.tagName === 'VIDEO' && layerBg.elt.paused) layerBg.play();
  if (layerFg && layerFg.elt && layerFg.elt.tagName === 'VIDEO' && layerFg.elt.paused) layerFg.play();

  blendMode(BLEND); 
  background('#EFF3F5'); 

  // Empty state
  if (!layerBg && !layerFg) {
    fill('#2D3F49'); 
    noTint();
    textStyle(BOLD);
    textAlign(CENTER, CENTER);
    textSize(18);
    text("1. Upload files on the left", width/2, height/2 - 20);
    textStyle(NORMAL);
    textSize(15);
    text("2. Adjust & Record", width/2, height/2 + 10);
  }

  // Draw Background
  if (layerBg) {
    push();
    tint(255, sliderBg.value());
    image(layerBg, 0, 0, width, height);
    pop();
  }

  // Draw Foreground
  if (layerFg) {
    push();
    blendMode(selectorBlend.value());
    tint(255, sliderFg.value());
    image(layerFg, 0, 0, width, height);
    pop();
  }

  // --- LOGICA DI REGISTRAZIONE GIF FRAME-BY-FRAME ---
  if (isRecording) {
    // Indicatore rosso
    push();
    fill(255, 0, 0);
    noStroke();
    circle(width - 20, 20, 15);
    pop();

    // Aggiungi frame alla GIF
    if (gifEncoder && recordedFrames < TOTAL_FRAMES) {
      // delay: 33ms circa per 30fps
      gifEncoder.addFrame(document.getElementById('myCanvas'), {copy: true, delay: 33});
      recordedFrames++;
      
      let progress = Math.floor((recordedFrames / TOTAL_FRAMES) * 100);
      btnGif.html(`Recording... ${progress}%`);
    } 
    else if (recordedFrames >= TOTAL_FRAMES) {
      finishRecording();
    }
  }
}

// --- GIF RECORDING LOGIC ---

function startGifRecording() {
  if (isRecording) return;
  
  if (typeof GIF === 'undefined') {
    alert("GIF Library not loaded yet, please wait 2 seconds and try again.");
    return;
  }

  console.log("Starting GIF Recording...");
  isRecording = true;
  recordedFrames = 0;
  
  btnGif.style('background-color', '#e74c3c');
  
  // Inizializza l'encoder
  gifEncoder = new GIF({
    workers: 2,
    quality: 10, // 10 è un buon compromesso tra qualità e velocità
    width: width,
    height: height,
    workerScript: URL.createObjectURL(new Blob([getWorkerScript()], { type: 'text/javascript' }))
  });

  // Evento finale
  gifEncoder.on('finished', function(blob) {
    console.log("GIF Rendered!");
    window.open(URL.createObjectURL(blob)); // Anteprima (opzionale)
    
    // Download
    let a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'animation.gif';
    document.body.appendChild(a);
    a.click();
    
    // Reset Button
    btnGif.html('Record GIF (6 sec)');
    btnGif.style('background-color', '#618A9E');
    isRecording = false;
  });
}

function finishRecording() {
  console.log("Recording finished, rendering GIF...");
  isRecording = false; // Ferma la cattura
  btnGif.html('Rendering GIF... (Wait)');
  btnGif.style('background-color', '#f39c12'); // Giallo attesa
  gifEncoder.render();
}


// --- FILE MANAGEMENT (CON FIX VIDEO TRASPARENTE) ---

function handleFile(file, layerID) {
  clearLayer(layerID, false); 
  
  if (file.type === 'image') {
    loadImage(file.data, img => assignLayer(img, layerID));
  } else if (file.type === 'video') {
    let vid = createVideo(file.data, () => {
      vid.elt.setAttribute('playsinline', '');
      vid.elt.muted = true;
      vid.elt.loop = true; 
      
      // *** FIX CRUCIALE ***
      // Mantiene il video attivo nel DOM ma invisibile
      vid.style('position', 'fixed');
      vid.style('top', '0');
      vid.style('left', '0');
      vid.style('opacity', '0.01'); 
      vid.style('z-index', '-1');
      vid.style('pointer-events', 'none');
      vid.size(100, 100); 
      
      vid.volume(0); 
      vid.loop();        
      assignLayer(vid, layerID);
    });
  } else {
    alert("Please upload only images or videos!");
  }
}

function assignLayer(asset, layerID) {
  if (layerID === 1) layerBg = asset;
  else layerFg = asset;
}

function clearLayer(layerID, resetInput = true) {
  let asset = (layerID === 1) ? layerBg : layerFg;
  
  if (asset) {
    if (typeof asset.stop === 'function') asset.stop(); 
    if (typeof asset.remove === 'function') asset.remove(); 
  }

  if (layerID === 1) {
    layerBg = null;
    if(resetInput && inputBg) inputBg.elt.value = ''; 
  } else {
    layerFg = null;
    if(resetInput && inputFg) inputFg.elt.value = '';
  }
}

// --- HELPERS LIBRERIA ESTERNA ---

function loadGifLibrary() {
  let script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.js';
  document.head.appendChild(script);
}

// Questo contiene il codice del Web Worker per gif.js
// Lo includiamo come stringa per evitare problemi di CORS o file multipli
function getWorkerScript() {
  return `
    importScripts('https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.worker.js');
  `;
}