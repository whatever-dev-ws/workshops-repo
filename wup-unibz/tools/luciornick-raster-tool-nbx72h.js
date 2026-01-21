// WUP 25-26 // Niccolò Parmeggiani
let layers = []; 
let selectedLayer = null; 

// Variabili per la navigazione (Vista "Google Maps")
let viewX = 50, viewY = 50;
let viewZoom = 1.0;
let isPanning = false;
let startPanX, startPanY;

// Oggetto contenitore per l'interfaccia
let ui = {};

// CONFIGURAZIONE
const MENU_WIDTH = 350;   

// Dimensioni FOGLIO DI OUTPUT (reali in pixel)
let outputW = 800; 
let outputH = 1000; 

function setup() {
  createCanvas(window.innerWidth, window.innerHeight); 
  
  // Centriamo inizialmente il foglio nello schermo
  viewX = (width - MENU_WIDTH - outputW)/2;
  viewY = (height - outputH)/2;

  // --- COSTRUZIONE MENU LATERALE ---
  ui.sidebar = createDiv('');
  ui.sidebar.position(width - MENU_WIDTH, 0);
  ui.sidebar.size(MENU_WIDTH, height);
  ui.sidebar.style('background-color', '#f8f8f8'); 
  ui.sidebar.style('padding', '20px');
  ui.sidebar.style('box-sizing', 'border-box'); 
  ui.sidebar.style('overflow-y', 'auto');
  ui.sidebar.style('font-family', 'sans-serif');
  ui.sidebar.style('border-left', '2px solid #ccc');
  ui.sidebar.style('box-shadow', '-5px 0 15px rgba(0,0,0,0.1)');

  // Funzioni helper per creare l'interfaccia pulita
  function spacer(h) { let s = createDiv(''); s.parent(ui.sidebar); s.style('height', h + 'px'); }
  function title(t) { let d = createDiv(`<b>${t}</b>`); d.parent(ui.sidebar); d.style('margin-bottom','10px'); d.style('border-bottom','1px solid #ddd'); d.style('padding-bottom','5px');}

  // =========================================
  // 1. SALVATAGGIO & FOGLIO
  // =========================================
  title('📂 SALVATAGGIO & FOGLIO');
  
  let row1 = createDiv(''); row1.parent(ui.sidebar); row1.style('display','flex'); row1.style('gap','10px');
  ui.fileInput = createFileInput(handleFile); ui.fileInput.parent(row1); ui.fileInput.style('width', '100%');
  
  spacer(10);
  
  ui.saveBtn = createButton('💾 SALVA PNG HD');
  ui.saveBtn.parent(ui.sidebar);
  ui.saveBtn.mousePressed(saveHighRes); 
  ui.saveBtn.style('width','100%'); ui.saveBtn.style('padding','10px'); ui.saveBtn.style('background','#4CAF50'); ui.saveBtn.style('color','white'); ui.saveBtn.style('border','none'); ui.saveBtn.style('cursor','pointer'); ui.saveBtn.style('font-weight','bold'); ui.saveBtn.style('border-radius','5px');

  spacer(20);
  createDiv('Dimensioni Foglio (px):').parent(ui.sidebar).style('font-size','12px');
  let sizeRow = createDiv(''); sizeRow.parent(ui.sidebar); sizeRow.style('display','flex'); sizeRow.style('gap','5px'); sizeRow.style('align-items','center');
  
  ui.inputW = createInput(outputW.toString(), 'number'); ui.inputW.parent(sizeRow); ui.inputW.style('width','70px');
  createSpan('x').parent(sizeRow);
  ui.inputH = createInput(outputH.toString(), 'number'); ui.inputH.parent(sizeRow); ui.inputH.style('width','70px');
  let updateSizeBtn = createButton('Set'); updateSizeBtn.parent(sizeRow); updateSizeBtn.mousePressed(updateCanvasSize);

  spacer(15);
  // Gestione Sfondo
  let bgRow = createDiv(''); bgRow.parent(ui.sidebar); bgRow.style('background','#e0e0e0'); bgRow.style('padding','10px'); bgRow.style('border-radius','5px');
  
  ui.bgTransparent = createCheckbox(' Sfondo Trasparente', false); 
  ui.bgTransparent.parent(bgRow);
  ui.bgTransparent.style('font-weight','bold');
  
  let colorRow = createDiv(''); colorRow.parent(bgRow); colorRow.style('margin-top','5px'); colorRow.style('display','flex'); colorRow.style('align-items','center');
  createSpan('Colore (se non trasp.): ').parent(colorRow).style('font-size','12px');
  ui.globalBgPicker = createColorPicker('#ffffff').parent(colorRow);

  spacer(30); 

  // =========================================
  // 2. POSIZIONE & ZOOM
  // =========================================
  title('📐 POSIZIONE');
  createDiv('<i>Rotella: Zoom Foglio<br>Trascina sfondo: Muovi vista</i>').parent(ui.sidebar).style('font-size','12px').style('color','#666');
  
  spacer(10);
  
  // Slider Zoom Livello
  let zoomRow = createDiv(''); zoomRow.parent(ui.sidebar);
  createSpan('Zoom Immagine: ').parent(zoomRow);
  ui.zoomSlider = createSlider(0.1, 3.0, 1.0, 0.1); ui.zoomSlider.parent(zoomRow); ui.zoomSlider.input(updateLayerFromUI);

  spacer(15);
  let btnRow = createDiv(''); btnRow.parent(ui.sidebar); btnRow.style('display','flex'); btnRow.style('gap','10px');
  ui.dupBtn = createButton('DUPLICA'); ui.dupBtn.parent(btnRow); ui.dupBtn.mousePressed(duplicateSelectedLayer); ui.dupBtn.style('flex','1'); ui.dupBtn.style('padding','5px'); ui.dupBtn.hide();
  ui.deleteBtn = createButton('ELIMINA'); ui.deleteBtn.parent(btnRow); ui.deleteBtn.mousePressed(deleteSelectedLayer); ui.deleteBtn.style('flex','1'); ui.deleteBtn.style('background','#ff4444'); ui.deleteBtn.style('color','white'); ui.deleteBtn.style('border','none'); ui.deleteBtn.hide();

  spacer(30);

  // =========================================
  // 3. EFFETTI
  // =========================================
  title('🎨 RASTERIZZAZIONE');
  let p1 = createDiv(''); p1.parent(ui.sidebar); createSpan('Densità (Risoluzione): ').parent(p1);
  ui.density = createSlider(5, 80, 12); ui.density.parent(p1); ui.density.input(updateLayerFromUI);
  spacer(5);
  let p2 = createDiv(''); p2.parent(ui.sidebar); createSpan('Grandezza Punti: ').parent(p2);
  ui.scale = createSlider(0.5, 4.0, 1.5, 0.1); ui.scale.parent(p2); ui.scale.input(updateLayerFromUI);

  spacer(30);

  // =========================================
  // 4. COLORI
  // =========================================
  title('🖌️ COLORI');
  ui.modeSelect = createRadio(); ui.modeSelect.parent(ui.sidebar);
  ui.modeSelect.option('original', 'Originale'); ui.modeSelect.option('bw', 'B/N'); ui.modeSelect.option('tint', 'Tinta Unica'); ui.modeSelect.option('custom', 'Palette (3 Col)');
  ui.modeSelect.selected('original'); ui.modeSelect.changed(updateLayerFromUI);
  ui.modeSelect.style('display', 'flex'); ui.modeSelect.style('flex-direction', 'column'); ui.modeSelect.style('gap', '5px');

  spacer(10);
  ui.colorContainer = createDiv(''); ui.colorContainer.parent(ui.sidebar); ui.colorContainer.style('border', '1px solid #ddd'); ui.colorContainer.style('padding','10px'); ui.colorContainer.style('background','white');

  ui.tintDiv = createDiv(''); ui.tintDiv.parent(ui.colorContainer);
  createSpan('Colore: ').parent(ui.tintDiv); ui.tintPicker = createColorPicker('#ed225d').parent(ui.tintDiv);

  ui.palDiv = createDiv(''); ui.palDiv.parent(ui.colorContainer);
  createDiv('Scuro / Medio / Chiaro').parent(ui.palDiv).style('margin-bottom','5px').style('font-size','12px');
  ui.pal1 = createColorPicker('#000000').parent(ui.palDiv); ui.pal2 = createColorPicker('#888888').parent(ui.palDiv); ui.pal3 = createColorPicker('#ffffff').parent(ui.palDiv);
  ui.pal1.style('margin-right', '5px'); ui.pal2.style('margin-right', '5px');

  spacer(30);

  // =========================================
  // 5. RIMOZIONE SFONDO (Soglia)
  // =========================================
  title('✂️ RIMOZIONE SFONDO (IMG)');
  createDiv('Soglia Trasparenza:').parent(ui.sidebar).style('font-size','12px');
  ui.bgThresh = createSlider(0, 255, 255); ui.bgThresh.parent(ui.sidebar); ui.bgThresh.style('width', '100%'); ui.bgThresh.input(updateLayerFromUI);
  ui.invertBg = createCheckbox(' Inverti (Rimuovi scuri)', false); ui.invertBg.parent(ui.sidebar); ui.invertBg.changed(updateLayerFromUI);

  // Inizializzazione finale
  toggleColorControls();
  pixelDensity(1);
  rectMode(CENTER);
  noStroke();
}

function draw() {
  background(40); // Sfondo grigio scuro (Tavolo di lavoro)

  // --- 1. APPLICA VISTA GLOBALE (Pan & Zoom Foglio) ---
  push();
  translate(viewX, viewY);
  scale(viewZoom);

  // --- 2. DISEGNA IL FOGLIO DI CARTA ---
  
  // Ombra del foglio
  fill(0, 0, 0, 80);
  rectMode(CORNER);
  rect(15, 15, outputW, outputH);

  // Foglio vero e proprio
  if (ui.bgTransparent.checked()) {
      // Se trasparente, disegna la scacchiera
      drawCheckerboard(0, 0, outputW, outputH);
  } else {
      // Altrimenti colore solido
      fill(ui.globalBgPicker.color());
      rect(0, 0, outputW, outputH);
  }

  // Bordo sottile del foglio
  noFill(); stroke(100); strokeWeight(1/viewZoom);
  rect(0, 0, outputW, outputH);
  noStroke();

  // --- 3. DISEGNA I LIVELLI ---
  // Passiamo 'window' come contesto grafico
  for (let layer of layers) {
    drawLayer(window, layer);
  }

  // --- 4. DISEGNA SELEZIONE E BORDI ROSSI ---
  if (selectedLayer) {
      updateLayerColors(); // Aggiorna i valori dei picker se servono
      push();
      translate(selectedLayer.x, selectedLayer.y);
      scale(selectedLayer.params.zoom);
      
      noFill(); 
      stroke(255, 50, 50); 
      // Mantiene lo spessore della linea costante indipendentemente dallo zoom
      strokeWeight(2 / (selectedLayer.params.zoom * viewZoom)); 
      rectMode(CORNER);
      rect(0, 0, selectedLayer.img.width, selectedLayer.img.height);
      pop();
  }

  pop(); // Fine trasformazione Vista Globale
  
  // Feedback a schermo fisso (fuori dallo zoom)
  if (selectedLayer) {
    fill(50); rect(20, height-40, 220, 30);
    fill(255); textAlign(LEFT, CENTER); text("✅ Immagine Selezionata", 30, height-25);
  }
}

// --- RENDERING UNIVERSALE ---
// Questa funzione disegna sia su schermo (window) che su file (pg)
function drawLayer(ctx, layer) {
  let params = layer.params;
  let img = layer.img;
  let density = params.density;
  
  ctx.push();
  ctx.translate(layer.x, layer.y);
  ctx.scale(params.zoom);

  for (let y = 0; y < img.height; y += density) {
    for (let x = 0; x < img.width; x += density) {
      
      // Controllo rapido bordi immagine
      let pixelX = floor(x); let pixelY = floor(y);
      if (pixelX >= img.width || pixelY >= img.height) continue;

      let c = img.get(pixelX, pixelY);
      
      // Se il PNG originale è trasparente in quel punto, salta
      if (alpha(c) < 10) continue; 

      let r = red(c); let g = green(c); let b = blue(c);
      let bright = (r + g + b) / 3;

      // Rimozione sfondo (Soglia luminosità)
      let isTransparent = false;
      if (!params.invertBg) { if (bright > params.bgThresh) isTransparent = true; } 
      else { if (bright < 255 - params.bgThresh) isTransparent = true; }
      if (isTransparent) continue;

      let diameter = map(bright, 255, 0, 0, density * params.scale);
      if (diameter < 0.1) continue;

      // Colore
      if (params.mode === 'bw') ctx.fill(0); 
      else if (params.mode === 'original') ctx.fill(r, g, b);
      else if (params.mode === 'tint') ctx.fill(params.tintColor);
      else if (params.mode === 'custom') {
        if (bright < 85) ctx.fill(params.pal1); else if (bright < 170) ctx.fill(params.pal2); else ctx.fill(params.pal3);
      }

      ctx.noStroke();
      ctx.rectMode(CENTER);
      if (params.mode !== 'bw' && density > 10) ctx.rect(x + density/2, y + density/2, diameter, diameter);
      else ctx.ellipse(x + density/2, y + density/2, diameter, diameter);
    }
  }
  ctx.pop();
}

// --- SALVATAGGIO ALTA RISOLUZIONE ---
function saveHighRes() {
    // Crea un buffer grafico invisibile grande come il foglio
    let pg = createGraphics(outputW, outputH);
    
    pg.clear(); // Parte trasparente
    
    // Se l'utente non vuole trasparenza, mette il colore di sfondo
    if (!ui.bgTransparent.checked()) {
        pg.background(ui.globalBgPicker.color());
    }
    
    // Disegna tutti i livelli sul buffer
    for (let layer of layers) {
        drawLayer(pg, layer);
    }
    
    // Salva il file
    save(pg, 'raster_art_hd.png');
}

// --- GESTIONE INTERFACCIA (FIXATO) ---
function updateLayerFromUI() {
  // Controllo di sicurezza fondamentale: se la UI non è pronta, esci.
  if (!selectedLayer || !ui.zoomSlider) return;
  
  let p = selectedLayer.params;
  p.zoom = ui.zoomSlider.value(); 
  p.mode = ui.modeSelect.value();
  p.density = ui.density.value(); 
  p.scale = ui.scale.value();
  p.bgThresh = ui.bgThresh.value(); 
  p.invertBg = ui.invertBg.checked();
  
  toggleColorControls();
}

function updateLayerColors() {
    if (!selectedLayer) return;
    let p = selectedLayer.params;
    p.tintColor = ui.tintPicker.color(); 
    p.pal1 = ui.pal1.color(); 
    p.pal2 = ui.pal2.color(); 
    p.pal3 = ui.pal3.color();
}

function syncUItoLayer(layer) {
  let p = layer.params;
  // Aggiorna tutti gli slider ai valori dell'immagine cliccata
  ui.zoomSlider.value(p.zoom); 
  ui.modeSelect.selected(p.mode);
  ui.density.value(p.density); 
  ui.scale.value(p.scale);
  ui.bgThresh.value(p.bgThresh); 
  ui.invertBg.checked(p.invertBg);
  
  ui.tintPicker.value(p.tintColor.toString('#rrggbb'));
  ui.pal1.value(p.pal1.toString('#rrggbb')); 
  ui.pal2.value(p.pal2.toString('#rrggbb')); 
  ui.pal3.value(p.pal3.toString('#rrggbb'));
  
  toggleColorControls();
  ui.dupBtn.show(); 
  ui.deleteBtn.show();
}

// --- INTERAZIONE MOUSE (PAN & ZOOM & SELECT) ---

function mouseWheel(event) {
    if (mouseX > width - MENU_WIDTH) return; // Ignora se sul menu

    let zoomSensitivity = 0.001;
    let newZoom = viewZoom - event.delta * zoomSensitivity;
    newZoom = constrain(newZoom, 0.1, 5.0); // Limiti zoom vista
    
    // Zoom verso il puntatore del mouse
    let mouseWorldX = (mouseX - viewX) / viewZoom;
    let mouseWorldY = (mouseY - viewY) / viewZoom;
    
    viewX -= mouseWorldX * (newZoom - viewZoom);
    viewY -= mouseWorldY * (newZoom - viewZoom);
    
    viewZoom = newZoom;
    return false; 
}

function mousePressed() {
    if (mouseX > width - MENU_WIDTH) return;

    // Calcola dove ho cliccato nel mondo del foglio
    let worldX = (mouseX - viewX) / viewZoom;
    let worldY = (mouseY - viewY) / viewZoom;

    let clickedImage = false;

    // Ciclo inverso per selezionare l'immagine più in alto
    for (let i = layers.length - 1; i >= 0; i--) {
        let l = layers[i];
        let w = l.img.width * l.params.zoom;
        let h = l.img.height * l.params.zoom;
        
        if (worldX >= l.x && worldX <= l.x + w && worldY >= l.y && worldY <= l.y + h) {
            selectedLayer = l;
            layers.splice(i, 1); layers.push(selectedLayer); // Porta in primo piano
            syncUItoLayer(selectedLayer);
            
            offsetX = worldX - l.x;
            offsetY = worldY - l.y;
            clickedImage = true;
            break;
        }
    }

    if (!clickedImage) {
        selectedLayer = null;
        ui.dupBtn.hide(); ui.deleteBtn.hide();
        // Inizia Panoramica (spostamento foglio)
        isPanning = true;
        startPanX = mouseX - viewX;
        startPanY = mouseY - viewY;
    }
}

function mouseDragged() {
    if (mouseX > width - MENU_WIDTH) return;

    if (selectedLayer) {
        // Muovi Immagine
        let worldX = (mouseX - viewX) / viewZoom;
        let worldY = (mouseY - viewY) / viewZoom;
        selectedLayer.x = worldX - offsetX;
        selectedLayer.y = worldY - offsetY;
    } else if (isPanning) {
        // Muovi Foglio
        viewX = mouseX - startPanX;
        viewY = mouseY - startPanY;
    }
}

function mouseReleased() {
    isPanning = false;
}

// --- UTILITIES ---

function handleFile(file) {
    if (file.type === 'image') {
        loadImage(file.data, (img) => {
            if (img.width > 1200) img.resize(1200, 0); 
            createLayer(img);
        });
    }
}

function createLayer(imgRef, copyParams = null) {
    let newLayer = {
        img: imgRef,
        x: (outputW - imgRef.width * 0.5)/2, // Centra nel foglio
        y: (outputH - imgRef.height * 0.5)/2,
        // Copia parametri o usa default
        params: copyParams ? JSON.parse(JSON.stringify(copyParams)) : {
            zoom: 0.5, mode: 'original', density: 12, scale: 1.5,
            bgThresh: 255, invertBg: false,
            tintColor: color('#ed225d'), pal1: color(0), pal2: color(128), pal3: color(255)
        }
    };
    // Ripristina oggetti colore p5 dopo JSON parse
    if(copyParams) {
        newLayer.params.tintColor = color(copyParams.tintColor.toString());
        newLayer.params.pal1 = color(copyParams.pal1.toString());
        newLayer.params.pal2 = color(copyParams.pal2.toString());
        newLayer.params.pal3 = color(copyParams.pal3.toString());
    }
    layers.push(newLayer);
    selectedLayer = newLayer;
    syncUItoLayer(newLayer);
}

function duplicateSelectedLayer() {
    if(selectedLayer) createLayer(selectedLayer.img, selectedLayer.params);
}

function deleteSelectedLayer() {
  if (selectedLayer) { layers = layers.filter(l => l !== selectedLayer); selectedLayer = null; ui.dupBtn.hide(); ui.deleteBtn.hide(); }
}

function toggleColorControls() {
    let m = ui.modeSelect.value();
    ui.tintDiv.hide(); ui.palDiv.hide();
    if (m === 'tint') ui.tintDiv.show(); else if (m === 'custom') ui.palDiv.show();
}

function updateCanvasSize() {
    outputW = parseInt(ui.inputW.value());
    outputH = parseInt(ui.inputH.value());
}

function drawCheckerboard(w, h) {
    let checkSize = 20;
    noStroke();
    for (let y = 0; y < h; y+=checkSize) {
        for (let x = 0; x < w; x+=checkSize) {
            if ((x/checkSize + y/checkSize) % 2 == 0) fill(200); else fill(255);
            rectMode(CORNER);
            let rw = min(checkSize, w - x);
            let rh = min(checkSize, h - y);
            rect(x, y, rw, rh);
        }
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    if(ui.sidebar) ui.sidebar.position(width - MENU_WIDTH, 0); 
}