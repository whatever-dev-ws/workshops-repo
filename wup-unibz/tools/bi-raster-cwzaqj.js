// --- VARIABILI GLOBALI ---
let img;
let drawingLayer, glowLayer, vectorGraphics;
let gridColors = []; 

// Gestione UNDO / REDO
let history = [];
let redoStack = [];

// Variabile di sicurezza: impedisce di disegnare se stiamo cliccando sui menu
let canPaint = false;

// Controlli UI
let fileInput, shapeSelector, resolutionSlider;
let dotColorPicker, bgColorPicker;
let brushColorPicker, brushToggle, brushSizeSlider;
let undoButton, redoButton;
let neonCheckbox, saveButton;

// Parametri
let resolution = 10;
let maxShapeSize = 10;
let brushRadius = 25; 

// Layout
const SIDEBAR_WIDTH = 280;
let imgDisplayW, imgDisplayH, imgX, imgY; 
let finalX, finalY; 

function setup() {
    addStyle();
    createCanvas(windowWidth, windowHeight, P2D);
    createSidebar();
    
    // Inizializzazione schermo
    background(30);
    fill(150);
    textAlign(CENTER, CENTER);
    textSize(16);
    text("CARICAMENTO...", width/2 + SIDEBAR_WIDTH/2, height/2);
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    if (img) calculateImageGeometry();
}

// --- GESTIONE INTERAZIONE ---

function mousePressed() {
    // 1. BLOCCO TOTALE: Se il mouse è nella Sidebar, IGNORA il disegno.
    if (mouseX < SIDEBAR_WIDTH) {
        canPaint = false;
        return;
    }

    // 2. Logica di disegno (solo se siamo fuori dalla sidebar)
    if (brushToggle.checked() && img) {
        let localMX = mouseX - finalX;
        let localMY = mouseY - finalY;
        
        // Controllo se siamo sopra l'area di lavoro (con margine di tolleranza)
        if (localMX >= -50 && localMX <= imgDisplayW + 50 && 
            localMY >= -50 && localMY <= imgDisplayH + 50) {
            
            // SALVA LO STATO *PRIMA* DI TOCCARE PIXEL
            saveState(); 
            canPaint = true; 
        }
    }
}

function mouseReleased() {
    canPaint = false; // Ferma il pennello
}

function keyPressed() {
    // Scorciatoie tastiera
    if (key === 'z' && (keyIsDown(CONTROL) || keyIsDown(META))) performUndo();
    if ((key === 'y' && (keyIsDown(CONTROL) || keyIsDown(META))) || 
        (key === 'Z' && (keyIsDown(CONTROL) || keyIsDown(META)))) performRedo();
}

function draw() {
    background(30); 

    push();
    if (img && drawingLayer && glowLayer) {
        
        // Calcolo posizione centrata
        let effectiveWidth = width - SIDEBAR_WIDTH;
        finalX = SIDEBAR_WIDTH + (effectiveWidth - imgDisplayW) / 2;
        finalY = (height - imgDisplayH) / 2;

        translate(finalX, finalY);

        // 1. Sfondo
        fill(bgColorPicker.color());
        noStroke();
        rect(0, 0, imgDisplayW, imgDisplayH);

        // 2. PENNELLO (Attivo solo se canPaint è true)
        if (canPaint && mouseIsPressed && brushToggle.checked()) {
            let localMX = mouseX - finalX;
            let localMY = mouseY - finalY;
            paintWithMouse(localMX, localMY);
        }

        // 3. CURSORE
        if (brushToggle.checked() && mouseX > SIDEBAR_WIDTH) {
             let localMX = mouseX - finalX;
             let localMY = mouseY - finalY;
             push();
             stroke(255); noFill(); strokeWeight(1);
             ellipse(localMX, localMY, brushRadius * 2);
             pop();
        }

        // 4. NEON LAYER
        if (neonCheckbox.checked()) {
            glowLayer.clear();
            glowLayer.image(drawingLayer, 0, 0);
            glowLayer.filter(BLUR, 12);
            push();
            blendMode(ADD);
            image(glowLayer, 0, 0);
            image(glowLayer, 0, 0); 
            pop();
        }

        // 5. DISEGNO PRINCIPALE
        image(drawingLayer, 0, 0);

    } else {
        // Schermata Home
        translate(SIDEBAR_WIDTH, 0);
        fill(200); textAlign(CENTER, CENTER); textSize(18); noStroke();
        text("1. Carica una foto dal menu a sinistra.", (width - SIDEBAR_WIDTH)/2, height/2 - 20);
    }
    pop();
}

// --- CORE: UNDO / REDO ---

function saveState() {
    // Deep Copy della griglia.
    let currentGridSnapshot = gridColors.map(col => (col ? col.slice() : []));
    history.push(currentGridSnapshot);
    
    // Nuova azione = futuro cancellato
    redoStack = []; 
    
    // Limite memoria
    if (history.length > 40) history.shift();
    
    updateButtonStyles();
}

function performUndo() {
    canPaint = false; // Sicurezza extra

    if (history.length > 0) {
        // 1. Salva presente nel Redo
        let currentGridSnapshot = gridColors.map(col => (col ? col.slice() : []));
        redoStack.push(currentGridSnapshot);
        
        // 2. Ripristina passato
        gridColors = history.pop();
        
        // 3. Applica
        fullRedraw();
        updateButtonStyles();
    }
}

function performRedo() {
    canPaint = false;

    if (redoStack.length > 0) {
        // 1. Salva presente nella History
        let currentGridSnapshot = gridColors.map(col => (col ? col.slice() : []));
        history.push(currentGridSnapshot);
        
        // 2. Ripristina futuro
        gridColors = redoStack.pop();
        
        // 3. Applica
        fullRedraw();
        updateButtonStyles();
    }
}

function updateButtonStyles() {
    if(undoButton) {
        if (history.length === 0) {
            undoButton.attribute('disabled', '');
            undoButton.style('opacity', '0.3');
        } else {
            undoButton.removeAttribute('disabled');
            undoButton.style('opacity', '1');
        }
    }
    
    if(redoButton) {
        if (redoStack.length === 0) {
            redoButton.attribute('disabled', '');
            redoButton.style('opacity', '0.3');
        } else {
            redoButton.removeAttribute('disabled');
            redoButton.style('opacity', '1');
        }
    }
}

// --- MOTORE GRAFICO ---

function paintWithMouse(x, y) {
    if (!drawingLayer) return;

    let startI = floor((x - brushRadius) / resolution);
    let endI = floor((x + brushRadius) / resolution);
    let startJ = floor((y - brushRadius) / resolution);
    let endJ = floor((y + brushRadius) / resolution);

    let cols = ceil(imgDisplayW / resolution);
    let rows = ceil(imgDisplayH / resolution);
    
    startI = constrain(startI, 0, cols);
    endI = constrain(endI, 0, cols);
    startJ = constrain(startJ, 0, rows);
    endJ = constrain(endJ, 0, rows);

    let brushCol = brushColorPicker.color();
    let brushColStr = brushCol.toString(); 

    drawingLayer.noStroke();
    
    let changed = false;

    for (let i = startI; i < endI; i++) {
        for (let j = startJ; j < endJ; j++) {
            let px = i * resolution;
            let py = j * resolution;
            
            if (dist(px, py, x, y) < brushRadius) {
                if (!gridColors[i]) gridColors[i] = [];
                
                let currentColor = gridColors[i][j];
                if (!currentColor || currentColor.toString() !== brushColStr) {
                    gridColors[i][j] = brushCol; 
                    
                    drawSingleShape(i, j, brushCol);
                    changed = true;
                }
            }
        }
    }
}

function drawSingleShape(i, j, colorToUse) {
    let px = i * resolution;
    let py = j * resolution;

    let origX = map(px, 0, imgDisplayW, 0, img.width);
    let origY = map(py, 0, imgDisplayH, 0, img.height);
    origX = constrain(origX, 0, img.width-1);
    origY = constrain(origY, 0, img.height-1);

    let col = vectorGraphics.get(origX, origY);
    let br = col[0]; 
    let sz = map(br, 0, 255, maxShapeSize, 0);

    if (sz > 0.5) {
        renderShapeOnBuffer(drawingLayer, px, py, sz, br, colorToUse);
    }
}

function fullRedraw() {
    if (!img || !drawingLayer) return;
    drawingLayer.clear();
    
    let cols = ceil(imgDisplayW / resolution);
    let rows = ceil(imgDisplayH / resolution);
    let baseCol = dotColorPicker.color();

    for (let i = 0; i < cols; i++) {
        if (!gridColors[i]) gridColors[i] = []; 

        for (let j = 0; j < rows; j++) {
            let pixelColor = gridColors[i][j] ? gridColors[i][j] : baseCol;
            drawSingleShape(i, j, pixelColor);
        }
    }
}

function renderShapeOnBuffer(target, x, y, sz, br, c) {
    let mode = shapeSelector.value();
    let cx = x + resolution/2;
    let cy = y + resolution/2;

    target.push();
    target.translate(cx, cy);
    target.fill(c);
    target.noStroke();

    if (mode === 'DOTS') target.ellipse(0, 0, sz, sz);
    else if (mode === 'SQUARES') { target.rectMode(CENTER); target.rect(0, 0, sz, sz); }
    else if (mode === 'LINES') {
        target.stroke(c); target.strokeWeight(sz * 0.3);
        target.rotate(map(br, 0, 255, 0, PI));
        target.line(-sz/2, 0, sz/2, 0);
    }
    else if (mode === 'CROSSES') {
        target.stroke(c); target.strokeWeight(sz * 0.25);
        target.line(-sz/2, 0, sz/2, 0); target.line(0, -sz/2, 0, sz/2);
    }
    else if (mode === 'TRIANGLES') target.triangle(0, -sz/2, -sz/2, sz/2, sz/2, sz/2);
    else if (mode === 'STARS') {
        target.beginShape();
        for (let k=0; k<10; k++) {
            let r = (k%2===0) ? sz/2 : sz/4;
            let a = TWO_PI * k/10;
            target.vertex(cos(a)*r, sin(a)*r);
        }
        target.endShape(CLOSE);
    }
    else if (mode === 'HEARTS') {
        target.scale(sz/20);
        target.beginShape();
        target.vertex(0,0); target.bezierVertex(5,-5,10,0,0,10); target.bezierVertex(-10,0,-5,-5,0,0);
        target.endShape(CLOSE);
    }

    target.pop();
}

// --- INIT & UTILITIES ---

function handleFile(file) {
    if (file.type === 'image') {
        img = loadImage(file.data, (loadedImg) => {
            calculateImageGeometry();
            
            drawingLayer = createGraphics(imgDisplayW, imgDisplayH, P2D);
            glowLayer = createGraphics(imgDisplayW, imgDisplayH, P2D);
            
            vectorGraphics = createGraphics(loadedImg.width, loadedImg.height);
            vectorGraphics.image(loadedImg, 0, 0);
            vectorGraphics.filter(GRAY);
            
            resetGrid();
            
            history = [];
            redoStack = [];
            updateButtonStyles();
            
            fullRedraw();
        });
    }
}

function calculateImageGeometry() {
    if (!img) return;
    let availableW = windowWidth - SIDEBAR_WIDTH - 40; 
    let availableH = windowHeight - 40;
    
    let scale = min(availableW / img.width, availableH / img.height);
    imgDisplayW = floor(img.width * scale);
    imgDisplayH = floor(img.height * scale);
}

function resetGrid() {
    gridColors = [];
    let cols = ceil(imgDisplayW / resolution) + 5; 
    for (let i = 0; i < cols; i++) gridColors[i] = [];
}

function updateResolution() {
    let val = resolutionSlider.value();
    
    // --- NUOVA LOGICA DI MAPPING ---
    // Mappa lo slider (1-100) in una risoluzione inversa.
    // Slider 1 (Minimo) -> Risoluzione 60px (Molto grandi, poco dettaglio)
    // Slider 100 (Massimo) -> Risoluzione 3px (Piccolissimi, alto dettaglio)
    resolution = floor(map(val, 1, 100, 60, 3)); 
    
    let label = select('#res-val-label');
    // Mostriamo sia la percentuale di dettaglio che la dimensione tecnica
    if(label) label.html(val + "% (Griglia: " + resolution + "px)");
    
    maxShapeSize = resolution * 0.9;
    
    if (img) {
        resetGrid();
        history = []; 
        redoStack = [];
        updateButtonStyles();
        fullRedraw();
    }
}

function savePNG() {
    if (!drawingLayer) return;
    let exportLayer = createGraphics(imgDisplayW, imgDisplayH, P2D);
    exportLayer.background(bgColorPicker.color());
    
    if (neonCheckbox.checked()) {
        exportLayer.blendMode(ADD);
        exportLayer.image(glowLayer, 0, 0);
        exportLayer.image(glowLayer, 0, 0);
        exportLayer.blendMode(BLEND);
    }
    exportLayer.image(drawingLayer, 0, 0);
    exportLayer.save('raster_neon.png');
}

// --- UI SIDEBAR ---

function createSidebar() {
    let sb = createDiv().class('sidebar');
    sb.child(createDiv('RASTER EDITOR').class('sidebar-title'));

    createControlGroup(sb, "1. PROGETTO", "Carica immagine", () => {
        fileInput = createFileInput(handleFile).class('file-input');
        return fileInput;
    });

    createControlGroup(sb, "2. STILE", "Dettagli", () => { // Nome cambiato
        shapeSelector = createSelect().class('modern-select');
        ['DOTS', 'SQUARES', 'LINES', 'CROSSES', 'STARS', 'TRIANGLES', 'HEARTS'].forEach(o => shapeSelector.option(o));
        shapeSelector.changed(fullRedraw);
        
        // --- NUOVO SLIDER AGGIORNATO ---
        // Range: da 1 a 100, default 50
        resolutionSlider = createSlider(1, 100, 50, 1).class('modern-slider');
        resolutionSlider.input(updateResolution);
        
        let valLabel = createSpan('50%').id('res-val-label').style('float','right').style('color','#888').style('font-size','11px');
        return [shapeSelector, resolutionSlider, valLabel];
    }, "Aumenta per più definizione.");

    createControlGroup(sb, "3. COLORI", "Base & Sfondo", () => {
        dotColorPicker = createColorPicker('#E0E0E0').class('modern-picker'); 
        dotColorPicker.changed(fullRedraw);
        bgColorPicker = createColorPicker('#050510').class('modern-picker'); 
        return [dotColorPicker, bgColorPicker];
    });

    createControlGroup(sb, "4. PENNELLO", "Strumenti", () => {
        brushColorPicker = createColorPicker('#FF0055').class('modern-picker');
        let bLabel = createDiv('Dimensione: 25px').id('brush-val-label').style('font-size','12px').style('color','#bbb').style('margin-top','10px');
        brushSizeSlider = createSlider(1, 80, 25, 1).class('modern-slider');
        brushSizeSlider.input(() => {
            brushRadius = brushSizeSlider.value();
            bLabel.html('Dimensione: ' + brushRadius + 'px');
        });

        brushToggle = createCheckbox(' Abilita Mouse', true).class('modern-checkbox');
        
        let btnRow = createDiv().style('display','flex').style('gap','10px').style('margin-top','15px');
        undoButton = createButton('↩ Indietro').class('tool-btn').mousePressed(performUndo); 
        redoButton = createButton('↪ Avanti').class('tool-btn').mousePressed(performRedo); 
        
        updateButtonStyles();
        
        btnRow.child(undoButton);
        btnRow.child(redoButton);
        return [brushColorPicker, bLabel, brushSizeSlider, brushToggle, btnRow];
    });

    createControlGroup(sb, "5. EFFETTI", "Post-Processing", () => {
        neonCheckbox = createCheckbox(' Attiva Neon', false).class('modern-checkbox');
        return neonCheckbox;
    });

    let footer = createDiv().class('sidebar-footer');
    sb.child(footer);
    saveButton = createButton('SALVA PNG').class('save-btn');
    saveButton.mousePressed(savePNG);
    footer.child(saveButton);
}

function createControlGroup(parent, groupTitle, labelText, elementFactory, descText) {
    let group = createDiv().class('control-group');
    parent.child(group);
    if (groupTitle) group.child(createDiv(groupTitle).class('group-header'));
    group.child(createDiv(labelText).class('control-label'));
    let elements = elementFactory();
    if (Array.isArray(elements)) elements.forEach(e => group.child(e));
    else group.child(elements);
    if(descText) group.child(createDiv(descText).class('control-desc'));
}

function addStyle() {
    let css = `
        body { margin: 0; padding: 0; overflow: hidden; background: #1a1a1a; font-family: 'Segoe UI', sans-serif; }
        canvas { display: block; }
        .sidebar { position: fixed; top: 0; left: 0; width: ${SIDEBAR_WIDTH}px; height: 100vh; background: #121212; border-right: 1px solid #333; overflow-y: auto; z-index: 1000; }
        .sidebar-title { padding: 25px; font-size: 18px; font-weight: 700; color: #fff; background: #000; text-align: center; letter-spacing: 3px; border-bottom: 1px solid #333; }
        .control-group { padding: 18px 25px; border-bottom: 1px solid #222; }
        .group-header { font-size: 11px; color: #007AFF; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
        .control-label { font-size: 14px; margin-bottom: 8px; color: #ddd; display: block; }
        .control-desc { font-size: 11px; color: #666; margin-top: 6px; line-height: 1.4; }
        .modern-select { width: 100%; padding: 8px; background: #2a2a2a; color: #fff; border: 1px solid #444; border-radius: 4px; outline: none; margin-bottom: 8px; }
        .modern-slider { width: 100%; accent-color: #007AFF; margin-top: 5px; cursor: pointer; }
        .modern-picker { width: 100%; height: 35px; border: none; cursor: pointer; padding: 0; background: none; margin-bottom: 5px; }
        .modern-checkbox { color: #ccc; font-size: 13px; cursor: pointer; margin-top: 5px; display: block; accent-color: #007AFF; }
        .sidebar-footer { padding: 25px; background: #000; margin-top: auto; }
        .save-btn { width: 100%; padding: 14px; background: #007AFF; color: white; border: none; border-radius: 6px; font-weight: 700; cursor: pointer; letter-spacing: 1px; transition: background 0.2s; }
        .save-btn:hover { background: #005bb5; }
        .tool-btn { flex: 1; padding: 8px; background: #333; color: white; border: 1px solid #444; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: bold; transition: 0.2s; }
        .tool-btn:hover { background: #444; }
        .tool-btn[disabled] { cursor: not-allowed; opacity: 0.5; }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-thumb { background: #444; border-radius: 3px; }
    `;
    createElement('style', css);
}

