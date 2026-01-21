// WUP 25-26 // Niccolò Parmeggiani
/* TYPE TOOL V22 - FIX TAGLIO EXPORT & PROFONDITÀ INFINITA & VIEWER COMPATIBILITY
   1. Fix Clipping: La "Perspective" viene ricaricata ogni frame.
   2. Sfondo Infinito: Spostato a Z = -50.000.
   3. Tutte le funzioni precedenti funzionanti.
   4. COMPATIBILITÀ VIEWER: Stili inline e hover via JS event listeners.
*/

let gui; 
let oggettiTesto = []; 
let historyStack = []; 
let indiceSelezionato = -1; 
let myFont;

// UI Elements
let uiToolCursor, uiToolType, uiToolPipette; 
let uiSize, uiSpace, uiAnimSpeed, uiColor, uiOpacity, uiEffect, uiInput, uiBgColor, uiCheckTransp;
let uiGeoSides, uiGeoSidesNum, uiGeoDensity, uiGeoRot, uiGeoFill; 
let uiRotX, uiRotY, uiRotZ, uiDepth; 
let uiGifDuration; 
let uiCanvasW, uiCanvasH, uiResetView;

// Variabili di stato
let currentTool = 'type'; 
let isDraggingPanel = false;
let isResizingText = false; 
let isExporting = false; 
let backgroundColor = '#222222'; 
let dragOffsetX = 0, dragOffsetY = 0;

// Camera
let camX = 0, camY = 0, camZoom = 1.0;
let isPanning = false;
let startPanX = 0, startPanY = 0;

// Export
let exportW = 1080;
let exportH = 1080;

// Tempo
let globalTime = 0; 

function preload() {
  myFont = loadFont('https://cdnjs.cloudflare.com/ajax/libs/topcoat/0.8.0/font/SourceCodePro-Bold.otf');
}

function setup() {
  pixelDensity(1); 
  createCanvas(windowWidth, windowHeight, WEBGL);
  
  textFont(myFont);
  textAlign(CENTER, CENTER); 

  creaPannelloMobile();
  
  let t = new OggettoTesto(0, 0, "Scrivi qui");
  t.isPlaceholder = true; 
  oggettiTesto.push(t);
  indiceSelezionato = 0;
  aggiornaPannelloDaOggetto(t);
  
  impostaTool('type');
  saveState(); 
}

function draw() {
  // --- FIX CRITICO PER IL TAGLIO (CLIPPING) ---
  perspective(PI / 3.0, width / height, 0.1, 100000);

  let dt;
  if (isExporting) dt = 1.0 / 30.0; else dt = deltaTime / 1000.0; 
  globalTime += dt; 

  // --- SFONDO ---
  if (uiCheckTransp.checked()) {
    if (isExporting) clear(); else disegnaScacchiera();
  } else {
    push();
    translate(-width/2, -height/2, -50000); // LONTANISSIMO
    scale(200); 
    noStroke(); fill(backgroundColor);
    rectMode(CENTER);
    rect(0, 0, width*10, height*10);
    pop();
  }

  push(); 
  
  if (!isExporting) {
      translate(camX, camY);
      scale(camZoom);
      
      // Bordo Canvas Virtuale
      push();
      translate(0, 0, 10); 
      noFill(); stroke(100); strokeWeight(2 / camZoom);
      rectMode(CENTER);
      rect(0, 0, exportW, exportH);
      fill(100); noStroke(); textSize(12 / camZoom);
      text(exportW + "x" + exportH + "px", 0, -exportH/2 - 15/camZoom);
      pop();
  }

  if (!isExporting && !uiCheckTransp.checked()) disegnaGriglia();

  // Input Scrittura
  let isMenuInput = isInputActive();
  if (currentTool === 'type' && keyIsPressed && indiceSelezionato > -1 && !isMenuInput) {
    if (frameCount % 5 === 0) gestisciInputContinuo();
  }

  if (keyIsDown(32)) cursor('grab'); 
  else if (currentTool === 'cursor') cursor(ARROW);

  // Render Oggetti
  for (let i = 0; i < oggettiTesto.length; i++) {
    let showSelection = (i === indiceSelezionato && !isExporting && currentTool !== 'pipette');
    oggettiTesto[i].disegna(showSelection, dt); 
  }
  
  pop(); 

  if (currentTool === 'pipette' && !isDraggingPanel) drawPipetteCursor();
}

// --- HELPER MOUSE & INPUT ---
function getMouseX() { return (mouseX - width / 2 - camX) / camZoom; }
function getMouseY() { return (mouseY - height / 2 - camY) / camZoom; }

function isInputActive() {
  if (!document.activeElement) return false;
  let tag = document.activeElement.tagName;
  return (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT');
}

function isMouseOverGUI() {
    if (!gui) return false;
    let gx = gui.position().x; let gy = gui.position().y;
    let gw = gui.elt.offsetWidth; let gh = gui.elt.offsetHeight;
    return (mouseX >= gx && mouseX <= gx + gw && mouseY >= gy && mouseY <= gy + gh);
}

function keyTyped() {
  if (isInputActive()) return true; 
  return false; 
}

function mouseWheel(event) {
    if (isMouseOverGUI()) return true; 
    if (isDraggingPanel) return false;
    let sens = 0.001;
    camZoom -= event.delta * sens * camZoom; 
    camZoom = constrain(camZoom, 0.1, 5.0);
    return false; 
}

function mousePressed() {
  if (keyIsDown(32)) { 
      isPanning = true; startPanX = mouseX; startPanY = mouseY; return;
  }
  
  if (isMouseOverGUI()) return;

  let mx = getMouseX();
  let my = getMouseY();

  if (currentTool === 'pipette') {
    saveState();
    loadPixels();
    let d = pixelDensity();
    let off = 4 * ((mouseY * d) * (width * d) + (mouseX * d));
    let r = pixels[off]; let g = pixels[off+1]; let b = pixels[off+2];
    uiColor.value('#' + hex(r,2) + hex(g,2) + hex(b,2)); 
    if (indiceSelezionato > -1) oggettiTesto[indiceSelezionato].color = uiColor.value(); 
    impostaTool('cursor'); return; 
  }

  saveState(); 

  let hoSelezionato = false;
  if (indiceSelezionato > -1) {
      let t = oggettiTesto[indiceSelezionato];
      let bbox = t.getBoundingBox();
      if (dist(mx, my, t.x + bbox.w/2, t.y + bbox.h/2) < 20) { isResizingText = true; return; }
  }

  for (let i = 0; i < oggettiTesto.length; i++) {
    if (oggettiTesto[i].contienePunto(mx, my)) {
      indiceSelezionato = i; aggiornaPannelloDaOggetto(oggettiTesto[i]); hoSelezionato = true;
      if (uiInput) uiInput.elt.blur(); break;
    }
  }

  if (!hoSelezionato) {
    if (currentTool === 'type') {
      indiceSelezionato = -1; let nuovo = new OggettoTesto(mx, my, "Scrivi");
      nuovo.isPlaceholder = true; oggettiTesto.push(nuovo);
      indiceSelezionato = oggettiTesto.length - 1; aggiornaPannelloDaOggetto(nuovo);
      if (uiInput) uiInput.elt.blur(); 
    } else {
      indiceSelezionato = -1; uiInput.value('');
    }
  }
}

function mouseDragged() {
  if (isPanning) {
      camX += mouseX - startPanX; camY += mouseY - startPanY;
      startPanX = mouseX; startPanY = mouseY; return;
  }
  if (isMouseOverGUI() || isDraggingPanel || currentTool === 'pipette') return;
  
  let mx = getMouseX(); let my = getMouseY();

  if (indiceSelezionato > -1) {
    let t = oggettiTesto[indiceSelezionato];
    if (isResizingText) {
      let d = dist(mx, my, t.x, t.y); t.size = constrain(d * 0.8, 10, 300); uiSize.value(t.size); 
    } else {
       t.x = mx; t.y = my; 
    }
  }
}

function mouseReleased() {
    isPanning = false; isResizingText = false; 
    cursor(ARROW); if(currentTool==='type') cursor(TEXT);
}

function keyPressed() {
  if (isInputActive()) return; 
  if (keyIsDown(CONTROL) && keyCode === 90) undo();
  if (keyCode === DELETE && indiceSelezionato > -1) {
     saveState(); oggettiTesto.splice(indiceSelezionato, 1); indiceSelezionato = -1; uiInput.value('');
  }
}

// =================== UNDO & STATE ===================
function saveState() {
  let state = {
    objects: JSON.parse(JSON.stringify(oggettiTesto)),
    bgColor: backgroundColor,
    selectionIdx: indiceSelezionato
  };
  historyStack.push(state);
  if(historyStack.length > 50) historyStack.shift();
}

function undo() {
  if (historyStack.length > 0) {
    let lastState = historyStack.pop();
    backgroundColor = lastState.bgColor;
    uiBgColor.value(backgroundColor);
    
    oggettiTesto = lastState.objects.map(data => {
      let t = new OggettoTesto(data.x, data.y, data.content);
      Object.assign(t, data); return t;
    });
    
    if(lastState.selectionIdx < oggettiTesto.length) {
       indiceSelezionato = lastState.selectionIdx;
       if(indiceSelezionato > -1) aggiornaPannelloDaOggetto(oggettiTesto[indiceSelezionato]);
    } else { indiceSelezionato = -1; }
  }
}

// =================== GUI & STYLING HELPER ===================

// Helper per applicare stili multipli
function applyStyle(el, styles) {
  for (let prop in styles) {
    el.style(prop, styles[prop]);
  }
}

// Helper per gestire hover senza CSS
function addHoverInteraction(el, normalBg, hoverBg, activeColor = null) {
  el.elt.addEventListener('mouseenter', () => {
    // Non cambiare se è un tool attivo
    if (activeColor && el.elt.style.backgroundColor === activeColor) return;
    el.style('background', hoverBg);
  });
  el.elt.addEventListener('mouseleave', () => {
    if (activeColor && el.elt.style.backgroundColor === activeColor) return;
    el.style('background', normalBg);
  });
}

function creaPannelloMobile() {
  // --- THEME DEFINITION ---
  const theme = {
    bg: 'rgba(255,255,255,0.98)',
    header: '#333333',
    headerText: '#ffffff',
    text: '#222222',
    inputBg: '#ffffff',
    inputBorder: '1px solid #ccc',
    btnBg: '#555555',
    btnColor: '#ffffff',
    btnHover: '#777777',
    active: '#00E5FF',
    danger: '#ff4757',
    dangerHover: '#ff6b81',
    success: '#2ed573',
    successHover: '#55e590',
    font: 'sans-serif'
  };

  // Main Container
  gui = createDiv(''); 
  gui.position(20, 20);
  applyStyle(gui, {
    width: '250px',
    background: theme.bg,
    borderRadius: '8px',
    boxShadow: '0 5px 25px rgba(0,0,0,0.5)',
    display: 'flex',
    flexDirection: 'column',
    zIndex: '2000',
    overflow: 'hidden',
    resize: 'both', // Works on desktop
    fontFamily: theme.font,
    fontSize: '11px',
    color: theme.text
  });

  // Header Row
  let headerRow = createDiv('').parent(gui);
  applyStyle(headerRow, { display: 'flex', background: theme.header, alignItems: 'center' });

  // Title Drag Handle
  let header = createDiv('::: TYPE TOOL :::').parent(headerRow);
  applyStyle(header, {
    flex: '1', color: theme.headerText, padding: '8px', cursor: 'move',
    fontWeight: 'bold', userSelect: 'none'
  });
  
  // Undo Button
  let btnUndo = createButton('↶').parent(headerRow);
  applyStyle(btnUndo, {
    background: theme.btnBg, color: theme.btnColor, border: 'none',
    cursor: 'pointer', padding: '8px 12px', fontSize: '14px', margin: '0'
  });
  addHoverInteraction(btnUndo, theme.btnBg, theme.btnHover);
  btnUndo.mousePressed(undo);

  // Drag Logic
  header.elt.onmousedown = function(e) { isDraggingPanel = true; dragOffsetX = e.clientX - gui.position().x; dragOffsetY = e.clientY - gui.position().y; };
  document.onmouseup = function() { isDraggingPanel = false; };
  document.onmousemove = function(e) { if (isDraggingPanel) gui.position(e.clientX - dragOffsetX, e.clientY - dragOffsetY); };

  // Content Container
  let content = createDiv('').parent(gui);
  applyStyle(content, {
    padding: '10px', display: 'flex', flexDirection: 'column',
    gap: '8px', maxHeight: '600px', overflowY: 'auto'
  });

  // --- UI COMPONENTS HELPERS ---
  const makeInput = (val, type='text') => {
    let inp = createInput(val, type);
    applyStyle(inp, { border: theme.inputBorder, background: theme.inputBg, borderRadius: '3px', padding: '4px', color: theme.text });
    return inp;
  };
  const makeBtn = (lbl) => {
    let b = createButton(lbl);
    applyStyle(b, { border: 'none', padding: '6px 2px', cursor: 'pointer', borderRadius: '4px', fontSize: '11px', background: '#444', color: '#fff', flex: '1' });
    return b;
  };

  // CANVAS SETTINGS
  let rowCanvas = createDiv('').parent(content).style('display','flex').style('gap','5px').style('align-items','center').style('margin-bottom','5px');
  createSpan('Canvas:').parent(rowCanvas).style('font-size','11px');
  
  uiCanvasW = makeInput('1080', 'number').parent(rowCanvas).style('flex','1').style('width','40px');
  createSpan('x').parent(rowCanvas).style('font-size','11px');
  uiCanvasH = makeInput('1080', 'number').parent(rowCanvas).style('flex','1').style('width','40px');
  
  uiCanvasW.input(() => { exportW = parseInt(uiCanvasW.value()); });
  uiCanvasH.input(() => { exportH = parseInt(uiCanvasH.value()); });
  
  const stopKeys = (e) => e.stopPropagation();
  uiCanvasW.elt.addEventListener('keydown', stopKeys);
  uiCanvasH.elt.addEventListener('keydown', stopKeys);
  
  uiResetView = createButton('⟲ Vista').parent(rowCanvas);
  applyStyle(uiResetView, { fontSize: '10px', cursor: 'pointer', border: '1px solid #ccc', background: '#eee', padding: '2px 5px', borderRadius: '3px' });
  addHoverInteraction(uiResetView, '#eee', '#ddd');
  uiResetView.mousePressed(() => { camX = 0; camY = 0; camZoom = 1; });

  // Tools
  let toolRow = createDiv('').parent(content).style('display','flex').style('gap','5px').style('margin-bottom','5px');
  
  uiToolCursor = makeBtn('⬉ Sposta').parent(toolRow);
  uiToolType = makeBtn('A Scrivi').parent(toolRow);
  uiToolPipette = makeBtn('💉 Pipetta').parent(toolRow);
  
  // Apply Tool Button Logic
  [uiToolCursor, uiToolType, uiToolPipette].forEach(b => {
      // Hover logic handled manually in impostaTool interactions or simply rely on active state
      b.elt.addEventListener('mouseenter', () => { if(b.elt.style.backgroundColor !== 'rgb(0, 229, 255)' && b.elt.style.backgroundColor !== '#00E5FF') b.style('background', '#666'); });
      b.elt.addEventListener('mouseleave', () => { if(b.elt.style.backgroundColor !== 'rgb(0, 229, 255)' && b.elt.style.backgroundColor !== '#00E5FF') b.style('background', '#444'); });
  });

  uiToolCursor.mousePressed(() => impostaTool('cursor'));
  uiToolType.mousePressed(() => impostaTool('type'));
  uiToolPipette.mousePressed(() => impostaTool('pipette'));

  createSpan('Testo:').parent(content);
  uiInput = makeInput('').parent(content);
  uiInput.elt.addEventListener('keydown', stopKeys);
  uiInput.input(() => { 
      if (indiceSelezionato > -1) { 
          oggettiTesto[indiceSelezionato].content = uiInput.value(); 
          oggettiTesto[indiceSelezionato].isPlaceholder = false; 
      }
  });

  let rowBg = createDiv('').parent(content).style('display','flex').style('justify-content','space-between').style('align-items','center');
  createSpan('Sfondo:').parent(rowBg);
  uiBgColor = createColorPicker(backgroundColor).parent(rowBg);
  uiBgColor.style('border', 'none');
  uiBgColor.changed(() => { saveState(); backgroundColor = uiBgColor.value(); }); 
  uiCheckTransp = createCheckbox('Trasparente', false).parent(content);
  uiCheckTransp.style('font-size', '11px');

  createDiv('').parent(content).style('border-top','1px solid #ddd').style('margin','5px 0');

  // CONTROLLI
  createSpan('Grandezza:').parent(content);
  uiSize = createSlider(10, 300, 50).parent(content).style('width', '100%'); createChangeWrapper(uiSize, aggiornaOggetto);
  
  createSpan('Velocità Anim:').parent(content);
  uiAnimSpeed = createSlider(0, 5, 1, 0.1).parent(content).style('width', '100%'); createChangeWrapper(uiAnimSpeed, aggiornaOggetto);

  createSpan('Spaziatura:').parent(content);
  uiSpace = createSlider(-10, 50, 2).parent(content).style('width', '100%'); createChangeWrapper(uiSpace, aggiornaOggetto);
  
  let rowCol = createDiv('').parent(content).style('display','flex').style('justify-content','space-between');
  createSpan('Colore:').parent(rowCol);
  uiColor = createColorPicker('#00E5FF').parent(rowCol); 
  uiColor.style('border','none'); createChangeWrapper(uiColor, aggiornaOggetto);
  
  createSpan('Opacità:').parent(content);
  uiOpacity = createSlider(0, 255, 255).parent(content); createChangeWrapper(uiOpacity, aggiornaOggetto);

  // --- CONTROLLI 3D ---
  createDiv('').parent(content).style('border-top','1px solid #ddd').style('margin','5px 0');
  createSpan('Rotazione 3D (X, Y, Z):').parent(content).style('font-weight','bold');
  let row3D = createDiv('').parent(content).style('display','flex').style('gap','2px');
  uiRotX = createSlider(-180, 180, 0).parent(row3D).style('flex','1'); createChangeWrapper(uiRotX, aggiornaOggetto);
  uiRotY = createSlider(-180, 180, 0).parent(row3D).style('flex','1'); createChangeWrapper(uiRotY, aggiornaOggetto);
  uiRotZ = createSlider(-180, 180, 0).parent(row3D).style('flex','1'); createChangeWrapper(uiRotZ, aggiornaOggetto);
  
  createSpan('Profondità:').parent(content);
  uiDepth = createSlider(0, 50, 0).parent(content).style('width', '100%'); createChangeWrapper(uiDepth, aggiornaOggetto);

  createDiv('').parent(content).style('border-top','1px solid #ddd').style('margin','5px 0');
  
  createSpan('Effetto:').parent(content);
  uiEffect = createSelect().parent(content);
  applyStyle(uiEffect, { padding: '4px', border: theme.inputBorder, borderRadius: '3px', background: theme.inputBg });
  ['Nessuno','Acqua','Terremoto','Brivido','Gelatina','Geometrico'].forEach(e => uiEffect.option(e));
  createChangeWrapper(uiEffect, aggiornaOggetto);

  // --- SEZIONE GEOMETRICA ---
  let geoPanel = createDiv('').parent(content).id('geoPanel');
  applyStyle(geoPanel, { background: '#f0f0f0', padding: '5px', borderRadius: '4px', display: 'none' });
  
  createSpan('Lati Figure:').parent(geoPanel).style('font-size','10px');
  let rowSides = createDiv('').parent(geoPanel).style('display','flex').style('gap','5px');
  uiGeoSides = createSlider(3, 12, 3, 1).parent(rowSides).style('flex','1'); 
  uiGeoSidesNum = makeInput('3', 'number').parent(rowSides).style('width','40px');
  uiGeoSidesNum.elt.addEventListener('keydown', stopKeys);

  uiGeoSides.input(() => { uiGeoSidesNum.value(uiGeoSides.value()); aggiornaOggetto(); });
  uiGeoSidesNum.input(() => { let val = parseInt(uiGeoSidesNum.value()); if(val >= 3) { uiGeoSides.value(val); aggiornaOggetto(); }});
  
  createSpan('Densità:').parent(geoPanel).style('font-size','10px');
  uiGeoDensity = createSlider(0.05, 0.5, 0.1, 0.01).parent(geoPanel).style('width', '100%'); createChangeWrapper(uiGeoDensity, aggiornaOggetto);
  
  createSpan('Rotazione Fig:').parent(geoPanel).style('font-size','10px');
  uiGeoRot = createSlider(0, 360, 0, 10).parent(geoPanel).style('width', '100%'); createChangeWrapper(uiGeoRot, aggiornaOggetto);
  
  uiGeoFill = createCheckbox('Figure Piene', true).parent(geoPanel); uiGeoFill.changed(() => { saveState(); aggiornaOggetto(); });

  uiEffect.changed(() => {
     saveState(); aggiornaOggetto();
     let isGeo = (uiEffect.selected() === 'Geometrico');
     select('#geoPanel').style('display', isGeo ? 'block' : 'none');
  });

  // Delete Button
  let btnDel = createButton('Elimina').parent(content);
  applyStyle(btnDel, { background: theme.danger, color: '#fff', border: 'none', marginTop: '5px', padding: '8px', borderRadius: '4px', cursor: 'pointer' });
  addHoverInteraction(btnDel, theme.danger, theme.dangerHover);
  btnDel.mousePressed(() => { if (indiceSelezionato > -1) { saveState(); oggettiTesto.splice(indiceSelezionato, 1); indiceSelezionato = -1; uiInput.value(''); }});

  // Export Section
  createDiv('').parent(content).style('border-top','1px solid #ddd').style('margin','10px 0');
  
  createSpan('Durata GIF (sec):').parent(content);
  uiGifDuration = createSlider(1, 10, 4, 1).parent(content).style('width', '100%');
  let spanDur = createSpan('4s').parent(content).style('font-size','10px').style('float','right').style('margin-top','-20px');
  uiGifDuration.input(() => spanDur.html(uiGifDuration.value() + 's'));

  let rowSave = createDiv('').parent(content).style('display','flex').style('gap','5px');
  
  let btnPng = createButton('PNG').parent(rowSave);
  applyStyle(btnPng, { flex: '1', background: theme.btnBg, color: '#fff', border: 'none', padding: '8px', borderRadius: '4px', cursor: 'pointer' });
  addHoverInteraction(btnPng, theme.btnBg, theme.btnHover);
  btnPng.mousePressed(() => { 
      isExporting = true; resizeCanvas(exportW, exportH); draw(); 
      saveCanvas('progetto', 'png'); 
      resizeCanvas(windowWidth, windowHeight); isExporting = false; 
  });
  
  let btnGif = createButton('GIF').parent(rowSave);
  applyStyle(btnGif, { flex: '1', background: theme.success, color: '#fff', border: 'none', padding: '8px', borderRadius: '4px', cursor: 'pointer' });
  addHoverInteraction(btnGif, theme.success, theme.successHover);
  
  btnGif.mousePressed(() => {
    isExporting = true; resizeCanvas(exportW, exportH);
    saveGif('animazione', uiGifDuration.value(), { units: 'seconds', pixelDensity: 1 }); 
    setTimeout(() => { isExporting = false; resizeCanvas(windowWidth, windowHeight); }, (uiGifDuration.value() * 1000) + 1500);
  });
}

function createChangeWrapper(element, callback) { element.input(callback); element.changed(saveState); }

function impostaTool(toolName) {
  currentTool = toolName;
  // Reset stili base
  [uiToolCursor, uiToolType, uiToolPipette].forEach(btn => {
      btn.style('background', '#444').style('color', '#fff');
  });
  
  let activeColor = '#00E5FF';
  let activeText = '#000';
  
  if (toolName === 'cursor') { uiToolCursor.style('background', activeColor).style('color', activeText); cursor(ARROW); }
  else if (toolName === 'type') { uiToolType.style('background', activeColor).style('color', activeText); cursor(TEXT); }
  else if (toolName === 'pipette') { uiToolPipette.style('background', activeColor).style('color', activeText); }
}

function drawPipetteCursor() {
  push(); resetMatrix(); translate(mouseX - width/2, mouseY - height/2, 200); 
  noCursor(); stroke(255); strokeWeight(2); noFill();
  ellipse(0, 0, 20, 20);
  line(0, -15, 0, -5); line(0, 5, 0, 15); line(-15, 0, -5, 0); line(5, 0, 15, 0);
  pop();
}

function aggiornaOggetto() {
  if (indiceSelezionato > -1) {
    let t = oggettiTesto[indiceSelezionato];
    t.size = uiSize.value(); t.spacing = uiSpace.value(); t.color = uiColor.value(); t.alpha = uiOpacity.value(); 
    t.effect = uiEffect.selected(); t.animSpeed = uiAnimSpeed.value();
    t.rotX = uiRotX.value(); t.rotY = uiRotY.value(); t.rotZ = uiRotZ.value(); t.depth = uiDepth.value();
    t.geoSides = uiGeoSides.value(); t.geoDensity = uiGeoDensity.value(); t.geoRot = uiGeoRot.value(); t.geoFilled = uiGeoFill.checked();
  }
}

function aggiornaPannelloDaOggetto(obj) {
  uiInput.value(obj.content); uiSize.value(obj.size); uiSpace.value(obj.spacing); 
  uiColor.value(obj.color); uiOpacity.value(obj.alpha); uiEffect.selected(obj.effect); uiAnimSpeed.value(obj.animSpeed);
  uiRotX.value(obj.rotX); uiRotY.value(obj.rotY); uiRotZ.value(obj.rotZ); uiDepth.value(obj.depth);
  uiGeoSides.value(obj.geoSides); uiGeoSidesNum.value(obj.geoSides); uiGeoDensity.value(obj.geoDensity); uiGeoRot.value(obj.geoRot); uiGeoFill.checked(obj.geoFilled);
  select('#geoPanel').style('display', (obj.effect === 'Geometrico') ? 'block' : 'none');
}

function gestisciInputContinuo() {
  saveState(); let t = oggettiTesto[indiceSelezionato];
  if (keyCode === BACKSPACE) {
    if (t.isPlaceholder) { t.content = ""; t.isPlaceholder = false; } else if (t.content.length > 0) t.content = t.content.substring(0, t.content.length - 1);
  } else if (key.length === 1 && keyCode !== ENTER && keyCode !== BACKSPACE && keyCode !== DELETE) {
    if (t.isPlaceholder) { t.content = ""; t.isPlaceholder = false; } t.content += key;
  }
  if(uiInput) uiInput.value(t.content);
}
function windowResized() { resizeCanvas(windowWidth, windowHeight); }

// FIX SFONDO INFINITO E NON-CLIPPING
function disegnaScacchiera() { 
    background(255); noStroke(); fill(220); let dim = 20; 
    push(); 
    translate(-width/2, -height/2, -50000); // LONTANISSIMO
    scale(200);
    for (let x = -width; x < width*2; x += dim) for (let y = -height; y < height*2; y += dim) if ((x / dim + y / dim) % 2 === 0) rect(x, y, dim, dim);
    pop();
}

function disegnaGriglia() { 
    push(); 
    translate(-width/2, -height/2, -49990); // Appena sopra lo sfondo infinito
    scale(200);
    stroke(255, 30); strokeWeight(1); 
    for (let x = -width; x < width*2; x += 50) line(x, -height, x, height*2); 
    for (let y = -height; y < height*2; y += 50) line(-width, y, width*2, y); 
    pop();
}

function polygon(ctx, x, y, radius, npoints) {
  let angle = TWO_PI / npoints; ctx.beginShape();
  for (let a = 0; a < TWO_PI; a += angle) { ctx.vertex(x + cos(a) * radius, y + sin(a) * radius); }
  ctx.endShape(CLOSE);
}

// --- CLASSE OGGETTO ---
class OggettoTesto {
  constructor(x, y, textStr) {
    this.x = x; this.y = y; this.content = textStr;
    this.size = 80; this.spacing = 2; this.color = '#00E5FF';
    this.alpha = 255; this.effect = 'Nessuno'; 
    this.isPlaceholder = false; this.animSpeed = 1.0; 
    this.rotX = 0; this.rotY = 0; this.rotZ = 0; this.depth = 0; 
    this.geoSides = 3; this.geoDensity = 0.15; this.geoRot = 0; this.geoFilled = true; 
    this.localTime = 0; 
  }
  
  getBoundingBox() {
    textSize(this.size); let totalW = 0;
    if (this.effect !== 'Geometrico') { for(let i=0; i<this.content.length; i++) totalW += textWidth(this.content.charAt(i)) + this.spacing; } 
    else { totalW = this.content.length * (this.size * 0.6) + (this.content.length * this.spacing); }
    if(totalW === 0) totalW = 20; return { w: totalW + 20, h: this.size + 20 };
  }
  
  contienePunto(px, py) {
    let bbox = this.getBoundingBox();
    return (px > this.x - bbox.w/2 && px < this.x + bbox.w/2 && py > this.y - bbox.h/2 && py < this.y + bbox.h/2);
  }
  
  disegna(selezionato, dt) {
    this.localTime += dt * this.animSpeed;
    push(); translate(this.x, this.y, 0); 
    rotateX(radians(this.rotX)); rotateY(radians(this.rotY)); rotateZ(radians(this.rotZ));

    if (selezionato) {
      push(); translate(0,0, this.depth + 1); 
      let bbox = this.getBoundingBox();
      stroke(255, 50, 50); strokeWeight(1); noFill(); rect(0, 0, bbox.w, bbox.h); 
      noStroke(); fill(0, 100, 255); rect(bbox.w/2, bbox.h/2, 10, 10);
      pop();
    }
    
    let layers = (this.depth > 0) ? floor(this.depth) : 1;
    let c = color(this.color); c.setAlpha(this.alpha); 
    
    for (let d = 0; d < layers; d++) {
        push(); translate(0, 0, d * -1);
        let layC = (d === 0) ? c : lerpColor(c, color(0), (1 - map(d, 0, 50, 1, 0.5)));
        this.renderContent(layC);
        pop();
    }
    if (this.content.length === 0 && selezionato) { stroke(255); strokeWeight(2); line(0, -this.size/2, 0, this.size/2); }
    pop();
  }
  
  renderContent(drawColor) {
      if (this.effect === 'Geometrico') {
         let points = myFont.textToPoints(this.content, 0, 0, this.size, { sampleFactor: this.geoDensity, simplifyThreshold: 0 });
         let bbox = myFont.textBounds(this.content, 0, 0, this.size);
         push(); translate(-bbox.w / 2, bbox.h / 4); 
         if (this.geoFilled) { fill(drawColor); noStroke(); } else { noFill(); stroke(drawColor); strokeWeight(1); }
         let shapeRad = map(this.geoDensity, 0.05, 0.5, 8, 2);
         for (let p of points) { push(); translate(p.x, p.y); rotate(radians(this.geoRot)); polygon(this, 0, 0, shapeRad, this.geoSides); pop(); }
         pop();
    } else {
        fill(drawColor); noStroke(); textSize(this.size); textStyle(BOLD);
        let totalWidth = 0; let widths = [];
        for (let i = 0; i < this.content.length; i++) { let w = textWidth(this.content.charAt(i)); widths.push(w); totalWidth += w + this.spacing; }
        if(this.content.length > 0) totalWidth -= this.spacing;
        let currentX = -totalWidth / 2; 
        for (let i = 0; i < this.content.length; i++) {
          push(); translate(currentX + widths[i]/2, 0); this.applicaEffetto(i); text(this.content.charAt(i), 0, 0); pop();
          currentX += widths[i] + this.spacing;
        }
    }
  }

  vertex(x, y) { vertex(x, y); } beginShape() { beginShape(); } endShape(mode) { endShape(mode); }

  applicaEffetto(index) {
    let t = this.localTime; 
    if (this.effect === 'Acqua') { translate(0, sin(t * 3 + index * 0.5) * 10); } 
    else if (this.effect === 'Terremoto') {
      let shakeForce = 5;
      let nx = (noise(t * 20, index) - 0.5) * shakeForce * 4;
      let ny = (noise(t * 20 + 100, index) - 0.5) * shakeForce * 4;
      translate(nx, ny);
    } 
    else if (this.effect === 'Brivido') { scale(1 + sin(t * 30 + index) * 0.1); }
    else if (this.effect === 'Gelatina') { let b = sin(t * 5); scale(1 + b * 0.2, 1 - b * 0.2); }
  }
}