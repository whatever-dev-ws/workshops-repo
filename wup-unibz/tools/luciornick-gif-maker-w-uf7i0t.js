// WUP 25-26 // Niccolò Parmeggiani
/* GIF STUDIO FINAL - PRECISION CUT
   - Tutto il motore di rendering è INVARIATO (Fluidità e Qualità massime).
   - NUOVO: Quando muovi lo slider "Inizio Clip", il video ti mostra il frame esatto (Scrubbing).
   - NUOVO: Visualizzazione grafica della zona selezionata sulla timeline.
*/

// --- CONFIGURAZIONE ---
let gif;
let workerBlobURL = '';
let gifLibraryLoaded = false;

// --- GESTIONE MEDIA ---
let layers = []; 
let selectedLayerIndex = -1; 
let mainVideoDuration = 10.0;

// --- STATI ---
const STATE_PREVIEW = 0;
const STATE_RENDERING = 1; 
let appState = STATE_PREVIEW;

// --- VARIABILI TEMPO ---
let masterTime = 0;       
let playStartTime = 0;   
let playDuration = 2.0;   
let playbackSpeed = 1.0; 
let lastDrawTime = 0;
let isPlaying = true;

// --- RENDER ---
let renderFrameIndex = 0;
let renderTotalFrames = 0;
const GIF_OUTPUT_FPS = 30; 

// --- UI ---
let canvasContainer, controlsContainer;
let inpWidth, inpHeight;
let sliderStart, sliderDuration, sliderSpeed;
let spanSpeedVal, spanStartVal, spanDurVal; // Etichette numeriche
let btnRecord, statusText, layerListDiv;

function setup() {
  noCanvas();
  
  // Stile Pagina (Generato via JS come richiesto)
  document.body.style.backgroundColor = "#121212";
  document.body.style.margin = "0";
  document.body.style.fontFamily = "Segoe UI, sans-serif";
  document.body.style.overflow = "hidden";
  document.body.style.color = "#ccc";

  loadGifLibrary();
  createPageLayout();
  
  // Creazione Canvas p5
  let c = createCanvas(500, 500);
  c.parent(canvasContainer);
  pixelDensity(1); 
  background(50);
  
  createControls();
}

function loadGifLibrary() {
  // Caricamento dinamico della libreria GIF.js
  let script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.js';
  script.onload = () => { gifLibraryLoaded = true; console.log("GIF Lib OK"); };
  document.head.appendChild(script);

  // Caricamento del worker come Blob per evitare problemi di path
  fetch('https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.worker.js')
    .then(resp => resp.text())
    .then(text => {
      let blob = new Blob([text], {type: 'application/javascript'});
      workerBlobURL = URL.createObjectURL(blob);
    })
    .catch(e => console.warn("Worker error:", e));
}

function draw() {
  background(40);

  // Aggiorna variabili (ma controlla se l'utente sta "scrubbando")
  // playStartTime viene aggiornato anche dagli eventi dello slider (vedi createControls)
  playDuration = sliderDuration.value();
  playbackSpeed = sliderSpeed.value();
  
  // Aggiorna testi UI
  spanSpeedVal.html(playbackSpeed.toFixed(1) + "x");
  spanStartVal.html(sliderStart.value().toFixed(1) + "s");
  spanDurVal.html(sliderDuration.value().toFixed(1) + "s");

  // --- ANTEPRIMA ---
  if (appState === STATE_PREVIEW) {
    if (isPlaying) {
      let dt = (millis() - lastDrawTime) / 1000;
      masterTime += dt * playbackSpeed;
      
      // Loop: Se superiamo (Inizio + Durata), torniamo all'Inizio
      if (masterTime > playStartTime + playDuration) {
        masterTime = playStartTime;
        // Reset rapido per il loop visivo
        layers.forEach(l => { 
           if(l.type === 'video' && l.elt.duration()) l.elt.time(playStartTime % l.elt.duration());
        });
      }
    }
    lastDrawTime = millis();

    // Sincronizza Video
    layers.forEach(l => {
      if (l.type === 'video' && l.elt) {
        l.elt.volume(0);
        l.elt.speed(playbackSpeed); 
        
        let vDur = l.elt.duration();
        if (vDur > 0) {
          let target = masterTime % vDur;
          // Se siamo in pausa (scrubbing), forza il tempo esatto
          if (!isPlaying) {
             l.elt.time(target);
          } 
          // Se siamo in play, correggi solo se drift > 0.5s
          else if (Math.abs(l.elt.time() - target) > 0.5) {
             l.elt.time(target);
          }
          
          if (isPlaying) l.elt.play();
          else l.elt.pause();
        }
      }
    });
  }

  // --- DISEGNO CANVAS ---
  for (let i = 0; i < layers.length; i++) {
    let l = layers[i];
    if (l.loaded) {
      push();
      translate(l.x, l.y);
      scale(l.scale);
      image(l.elt, 0, 0, l.w, l.h);
      
      // Box selezione
      if (appState === STATE_PREVIEW && i === selectedLayerIndex) {
        noFill(); stroke('#00E676'); strokeWeight(2 / l.scale);
        rect(0, 0, l.w, l.h);
      }
      pop();
    }
  }

  if (appState === STATE_PREVIEW) drawTimelineUI();
}

// ==========================================
// === MOTORE DI RENDERING (INVARIATO) ===
// ==========================================

function startRendering() {
  if (!gifLibraryLoaded || !workerBlobURL) { alert("Attendi caricamento libreria..."); return; }
  
  appState = STATE_RENDERING;
  isPlaying = false;
  
  renderTotalFrames = Math.floor(playDuration * GIF_OUTPUT_FPS);
  renderFrameIndex = 0;
  
  layers.forEach(l => { 
      if(l.type==='video') { l.elt.pause(); l.elt.speed(1); } 
  });

  gif = new GIF({
    workers: 4, 
    quality: 1, 
    width: width,
    height: height,
    workerScript: workerBlobURL,
    background: '#121212',
    dither: false 
  });
  
  btnRecord.attribute('disabled', '');
  statusText.html("Rendering Fluido in corso...");
  
  setTimeout(processNextFrame, 100);
}

async function processNextFrame() {
  if (renderFrameIndex >= renderTotalFrames) {
    finishRendering();
    return;
  }

  let gifStep = 1.0 / GIF_OUTPUT_FPS; 
  let videoStep = gifStep * playbackSpeed;
  let currentVideoTime = playStartTime + (renderFrameIndex * videoStep);

  let seekPromises = [];
  layers.forEach(l => {
    if (l.type === 'video' && l.elt.duration() > 0) {
      let target = currentVideoTime % l.elt.duration();
      l.elt.time(target);
      
      let p = new Promise(resolve => {
        let onSeeked = () => {
          l.elt.elt.removeEventListener('seeked', onSeeked);
          resolve();
        };
        // Timeout di sicurezza se seeked non parte
        setTimeout(() => { l.elt.elt.removeEventListener('seeked', onSeeked); resolve(); }, 800);
        l.elt.elt.addEventListener('seeked', onSeeked);
      });
      seekPromises.push(p);
    }
  });

  if (seekPromises.length > 0) await Promise.all(seekPromises);
  else await new Promise(r => setTimeout(r, 10));

  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

  background(40); 
  for (let l of layers) {
    if (l.loaded) {
      push(); translate(l.x, l.y); scale(l.scale); image(l.elt, 0, 0, l.w, l.h); pop();
    }
  }
  
  gif.addFrame(document.getElementById('defaultCanvas0'), {
    copy: true, 
    delay: 1000 / GIF_OUTPUT_FPS 
  });

  drawProgressUI(renderFrameIndex, renderTotalFrames);
  renderFrameIndex++;
  setTimeout(processNextFrame, 0);
}

function finishRendering() {
  background(40);
  statusText.html("Compressione...");
  
  gif.on('finished', function(blob) {
    statusText.html("Fatto! Scarica.");
    let a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'gif_perfetta.gif';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    appState = STATE_PREVIEW;
    btnRecord.removeAttribute('disabled');
    isPlaying = true;
  });

  gif.render();
}

// --- GESTIONE FILES & DRAG ---
function handleFile(file) {
  if (file.type === 'video' || file.type === 'image') {
    statusText.html("Caricamento...");
    let cb = (elt) => {
      elt.hide();
      if (file.type === 'video') { 
          elt.loop(); elt.volume(0);
          if (elt.duration() > 0) {
              mainVideoDuration = elt.duration();
              sliderStart.attribute('max', mainVideoDuration);
              // Aggiorna visuale
              sliderDuration.value(min(3, mainVideoDuration)); 
          }
      }
      
      let layer = {
        type: file.type, elt: elt,
        x: width/2 - 150, y: height/2 - 150,
        w: elt.width || 300, h: elt.height || 300,
        scale: 1, loaded: true
      };
      if (layer.w > width) layer.scale = width / layer.w * 0.8;
      layers.push(layer);
      selectedLayerIndex = layers.length - 1;
      updateLayerUI();
      statusText.html("Media aggiunto.");
    };
    if (file.type === 'video') createVideo(file.data, cb);
    else createImg(file.data, '', cb);
  }
}

function deleteLayer() {
  if(selectedLayerIndex > -1) {
    layers[selectedLayerIndex].elt.remove();
    layers.splice(selectedLayerIndex, 1);
    selectedLayerIndex = -1;
    updateLayerUI();
  }
}

function mousePressed() {
  if (appState !== STATE_PREVIEW) return;
  if (mouseX < 0 || mouseX > width || mouseY < 0 || mouseY > height) return;
  let found = false;
  for (let i = layers.length - 1; i >= 0; i--) {
    let l = layers[i];
    if (mouseX >= l.x && mouseX <= l.x + (l.w*l.scale) && mouseY >= l.y && mouseY <= l.y + (l.h*l.scale)) {
      selectedLayerIndex = i; found = true; updateLayerUI(); break;
    }
  }
  if (!found) { selectedLayerIndex = -1; updateLayerUI(); }
}
function mouseDragged() {
  if (appState === STATE_PREVIEW && selectedLayerIndex !== -1 && mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) {
    layers[selectedLayerIndex].x += (mouseX - pmouseX); layers[selectedLayerIndex].y += (mouseY - pmouseY);
  }
}
function mouseWheel(e) {
  if (mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height && selectedLayerIndex !== -1) {
    layers[selectedLayerIndex].scale = constrain(layers[selectedLayerIndex].scale - e.delta * 0.001, 0.05, 5); return false;
  }
}
function setCanvasSize() { resizeCanvas(parseInt(inpWidth.value()), parseInt(inpHeight.value())); }

// --- UI HELPERS ---
function drawTimelineUI() {
  let h = 30; let y = height - h;
  
  // Sfondo barra
  fill(20, 20, 20); noStroke(); rect(0, y, width, h);
  
  // 1. Disegna l'intera durata del video (Grigio scuro)
  fill(50); rect(0, y, width, h);
  
  // 2. Disegna la sezione SELEZIONATA (Verde)
  // Mappiamo playStartTime e duration sulla larghezza del canvas
  if (mainVideoDuration > 0) {
    let xStart = map(playStartTime, 0, mainVideoDuration, 0, width);
    let xEnd = map(playStartTime + playDuration, 0, mainVideoDuration, 0, width);
    let wRect = xEnd - xStart;
    
    // Zona attiva
    fill(0, 230, 118, 150); rect(xStart, y, wRect, h);
    
    // Testina di riproduzione (Bianca)
    let xPlay = map(masterTime, 0, mainVideoDuration, 0, width);
    stroke(255); strokeWeight(2); line(xPlay, y, xPlay, height);
  }
  
  fill(255); noStroke(); textSize(10); textAlign(LEFT, CENTER);
  text(`${masterTime.toFixed(1)}s`, 5, y + h/2);
}

function drawProgressUI(curr, total) {
  fill(0, 180); rect(0, height/2 - 30, width, 60);
  fill(255); textAlign(CENTER, CENTER); textSize(16);
  text(`Rendering... ${Math.round((curr/total)*100)}%`, width/2, height/2 - 10);
  textSize(12); text("Non chiudere la finestra", width/2, height/2 + 15);
}

// --- INTERFACCIA UTENTE ---
function createPageLayout() {
  let main = createDiv('').style('display:flex; height:100vh; width:100vw;');
  canvasContainer = createDiv('').parent(main).style('flex:1; background:#000; display:flex; justify-content:center; align-items:center;');
  controlsContainer = createDiv('').parent(main).style('width:320px; background:#1e1e1e; padding:15px; display:flex; flex-direction:column; gap:10px; overflow-y:auto; border-left:1px solid #333;');
}

function createControls() {
  let p = controlsContainer;
  createDiv('<h2 style="margin:0; color:#fff;">GIF STUDIO PRO</h2>').parent(p);
  
  // 1. FILE
  let box1 = createBox("1. Media & Livelli", p);
  createFileInput(handleFile).parent(box1).style('color:#ccc; font-size:11px;');
  layerListDiv = createDiv('Nessun livello').parent(box1).style('background:#121212; max-height:80px; overflow-y:auto; margin-top:5px; padding:5px; font-size:11px;');
  createButton('Elimina Livello').parent(box1).mousePressed(deleteLayer).style('width:100%; margin-top:5px; background:#d32f2f; color:white; border:none; padding:5px; cursor:pointer;');

  // 2. TIMELINE & TAGLIO (MODIFICATA PER SCRUBBING)
  let box2 = createBox("2. Taglio e Velocità", p);
  
  // INIZIO CLIP
  let rowStart = createDiv('').parent(box2).style('display:flex; justify-content:space-between; margin-top:5px;');
  createDiv('Inizio (Dove parte):').parent(rowStart).style('font-size:11px; color:#bbb;');
  spanStartVal = createSpan('0.0s').parent(rowStart).style('font-size:11px; color:#fff;');
  
  sliderStart = createSlider(0, 10, 0, 0.1).parent(box2).style('width:100%');
  // --- LOGICA SCRUBBING ---
  sliderStart.input(() => {
    isPlaying = false; // Ferma il loop
    playStartTime = sliderStart.value();
    masterTime = playStartTime; // Forza il tempo al punto scelto
  });
  sliderStart.changed(() => {
    isPlaying = true; // Riparti quando l'utente lascia il mouse
  });
  
  // DURATA
  let rowDur = createDiv('').parent(box2).style('display:flex; justify-content:space-between; margin-top:10px;');
  createDiv('Durata GIF (Lungh.):').parent(rowDur).style('font-size:11px; color:#bbb;');
  spanDurVal = createSpan('2.0s').parent(rowDur).style('font-size:11px; color:#fff;');
  
  sliderDuration = createSlider(0.1, 10, 2, 0.1).parent(box2).style('width:100%');
  
  // VELOCITÀ
  let speedRow = createDiv('').parent(box2).style('display:flex; justify-content:space-between; align-items:center; margin-top:10px;');
  createDiv('Velocità:').parent(speedRow).style('font-size:11px; color:#bbb;');
  spanSpeedVal = createSpan('1.0x').parent(speedRow).style('font-size:11px; color:#00E676; font-weight:bold;');
  sliderSpeed = createSlider(0.1, 4.0, 1.0, 0.1).parent(box2).style('width:100%');

  // 3. DIMENSIONI
  let box4 = createBox("3. Dimensioni", p);
  let r = createDiv('').parent(box4).style('display:flex; gap:5px');
  inpWidth = createInput('500','number').parent(r).style('width:50px');
  inpHeight = createInput('500','number').parent(r).style('width:50px');
  createButton('Set').parent(r).mousePressed(setCanvasSize);

  statusText = createP('Carica video.').parent(p).style('color:#aaa; font-size:11px; margin:0;');
  btnRecord = createButton('🎬 CREA GIF FLUIDA').parent(p).mousePressed(startRendering)
    .style('padding:15px; background:#00E676; color:#000; font-weight:bold; border:none; border-radius:4px; cursor:pointer; font-size:14px; margin-top:5px;');
}

function createBox(t, p) {
  let d = createDiv('').parent(p).style('background:#2d2d2d; padding:10px; border-radius:6px;');
  createDiv(`<b>${t}</b>`).parent(d).style('border-bottom:1px solid #444; padding-bottom:4px; margin-bottom:6px; font-size:12px; color:#fff;');
  return d;
}
function updateLayerUI() {
  layerListDiv.html('');
  layers.forEach((l, i) => {
    let bg = (i === selectedLayerIndex) ? '#00E676' : 'transparent';
    let col = (i === selectedLayerIndex) ? '#000' : '#fff';
    let row = createDiv(`${i+1}. ${l.type}`).parent(layerListDiv);
    row.style(`padding:3px; border-bottom:1px solid #333; cursor:pointer; background:${bg}; color:${col};`);
    row.mousePressed(() => { selectedLayerIndex = i; updateLayerUI(); });
  });
}