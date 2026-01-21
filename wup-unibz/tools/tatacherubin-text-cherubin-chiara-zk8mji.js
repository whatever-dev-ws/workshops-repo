// WUP 25-26
// Chiara Cherubin

let currentView = 'landing'; 
let elements = [];
let draggingId = null;
let selectedIds = []; 
let dragOffset = { x: 0, y: 0 };
let customFont = null;
let isExporting = false;
let isTransparentExport = false;
let isSidebarOpen = true; // Nuova variabile per gestire lo stato

// UI State
let defaultSettings = {
  fontSize: 60,
  jitter: 0,     
  radius: 0,
  speed: 2,
  textColor: '#111827',
  fontStyle: 'sans-serif',
  motionType: 'Jitter'
};

let canvasBgColor = '#f3f4f6';
let flowParticles = [];
let ui = {};
let sidebarContainer; // Contenitore principale UI

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1); 
  textFont('sans-serif');
  
  // NIENTE PIÙ injectCSS() QUI!

  // --- START SCREEN PARTICLES ---
  for(let i=0; i<60; i++) {
      flowParticles.push(new Particle());
  }

  // 2. Creiamo l'interfaccia con stile integrato
  createEditorUI();
  
  // 3. Aggiungiamo un elemento di default
  addElement('LIMITED');
  updateUIValues(); 
  
  // Nascondiamo l'editor all'inizio (siamo in landing page)
  toggleEditorUI(false);
}

function draw() {
  if (currentView === 'landing') {
    drawLanding();
  } else if (currentView === 'editor') {
    drawEditor();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// --- DATA MANAGEMENT ---

function addElement(txt) {
    let newId = Date.now() + random(100);
    elements.push({
        id: newId,
        text: txt,
        x: width/2 + random(-40, 40),
        y: height/2 + random(-40, 40),
        fontSize: defaultSettings.fontSize,
        jitter: defaultSettings.jitter,
        radius: defaultSettings.radius,
        speed: defaultSettings.speed,
        textColor: defaultSettings.textColor,
        fontStyle: defaultSettings.fontStyle,
        motionType: defaultSettings.motionType
    });
    
    selectedIds = [newId];
    updateLayerList();
    updateUIFromSelection();
}

function applyProperty(prop, value) {
    defaultSettings[prop] = value;
    elements.forEach(el => {
        if (selectedIds.includes(el.id)) {
            el[prop] = value;
        }
    });
}

function updateUIFromSelection() {
    if (selectedIds.length > 0) {
        let firstEl = elements.find(e => e.id === selectedIds[0]);
        if (firstEl) {
            ui.sSize.value(firstEl.fontSize);
            ui.sJitter.value(firstEl.jitter);
            ui.sRadius.value(firstEl.radius);
            ui.sSpeed.value(firstEl.speed);
            ui.cText.value(firstEl.textColor);
            ui.sMotionType.selected(firstEl.motionType);
            ui.textInput.value(selectedIds.length > 1 ? "MULTIPLE..." : firstEl.text);
        }
    }
}

// --- VIEWS ---

function drawLanding() {
  background(10, 10, 18);

  // Particles Logic
  noStroke();
  flowParticles.forEach(p => {
      p.interact(); 
      p.update();
      p.display();
  });

  // Connections (Constellation effect)
  stroke(255, 30); 
  strokeWeight(0.5);
  for (let i = 0; i < flowParticles.length; i++) {
    for (let j = i + 1; j < flowParticles.length; j++) {
      let d = dist(flowParticles[i].x, flowParticles[i].y, flowParticles[j].x, flowParticles[j].y);
      if (d < 120) {
        let alpha = map(d, 0, 120, 100, 0); 
        stroke(255, alpha);
        line(flowParticles[i].x, flowParticles[i].y, flowParticles[j].x, flowParticles[j].y);
      }
    }
  }

  // UI Landing Text
  noStroke();
  textAlign(CENTER, CENTER);
  
  let titleSize = min(width * 0.08, 80);
  drawingContext.shadowBlur = 20;
  drawingContext.shadowColor = 'rgba(255, 255, 255, 0.3)';
  
  fill(255);
  textFont('Georgia'); 
  textStyle(BOLD);
  textSize(titleSize);
  text("Kinetic Studio", width / 2, height / 2 - 50);
  
  drawingContext.shadowBlur = 0;

  textFont('Helvetica'); 
  textSize(12);
  textStyle(NORMAL);
  fill(180);
  let subText = "RAW EXPORT  •  MAX 4s LOOP  •  GENERATIVE ART";
  text(subText, width / 2, height / 2 + 20);
  
  // Pulsante START
  let btnY = height / 2 + 100;
  let btnW = 180;
  let btnH = 50;
  
  let isHover = (mouseX > width/2 - btnW/2 && mouseX < width/2 + btnW/2 && 
                 mouseY > btnY - btnH/2 && mouseY < btnY + btnH/2);
                 
  stroke(255);
  strokeWeight(1);
  
  if (isHover) {
      fill(255); 
      cursor(HAND);
      rect(width/2 - btnW/2, btnY - btnH/2, btnW, btnH, 4); 
      fill(10); 
      noStroke();
      textStyle(BOLD);
      text("ENTER EDITOR", width / 2, btnY);
  } else {
      noFill(); 
      cursor(ARROW);
      rect(width/2 - btnW/2, btnY - btnH/2, btnW, btnH, 4);
      fill(255);
      noStroke();
      textStyle(NORMAL);
      text("ENTER EDITOR", width / 2, btnY);
  }
}

// --- PARTICLE CLASS ---
class Particle {
    constructor() {
        this.x = random(width);
        this.y = random(height);
        this.size = random(1.5, 3.5);
        this.vx = random(-0.5, 0.5);
        this.vy = random(-0.5, 0.5);
    }

    interact() {
        let d = dist(mouseX, mouseY, this.x, this.y);
        if (d < 150) {
            let forceX = (this.x - mouseX) / d;
            let forceY = (this.y - mouseY) / d;
            this.x += forceX * 2;
            this.y += forceY * 2;
        }
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        let n = noise(this.x * 0.005, this.y * 0.005, frameCount * 0.002);
        this.x += cos(n * TWO_PI) * 0.3;
        this.y += sin(n * TWO_PI) * 0.3;
        if (this.x < -20) this.x = width + 20;
        if (this.x > width + 20) this.x = -20;
        if (this.y < -20) this.y = height + 20;
        if (this.y > height + 20) this.y = -20;
    }

    display() {
        fill(255, 180);
        noStroke();
        ellipse(this.x, this.y, this.size);
    }
}

function drawEditor() {
  if (isTransparentExport) {
    clear(); 
  } else {
    background(canvasBgColor);
  }

  noStroke();

  // Disegno elementi testo
  elements.forEach(el => {
    fill(el.textColor);
    
    if (el.fontStyle === 'custom' && customFont) textFont(customFont);
    else if (el.fontStyle === 'serif') textFont('Georgia');
    else if (el.fontStyle === 'monospace') textFont('Courier New');
    else if (el.fontStyle === 'cursive') textFont('Brush Script MT');
    else textFont('Arial');

    textSize(el.fontSize);
    textAlign(CENTER, CENTER);

    push();
    translate(el.x, el.y);

    // Box di selezione
    if (selectedIds.includes(el.id) && !isExporting) {
        push();
        noFill();
        stroke('#3b82f6');
        strokeWeight(1);
        drawingContext.setLineDash([5, 5]);
        let w = textWidth(el.text);
        rectMode(CENTER);
        rect(0, 0, w + el.fontSize, el.fontSize * 1.5);
        drawingContext.setLineDash([]);
        pop();
    }

    let pts = el.text.split('');
    let r = el.radius;

    for (let i = 0; i < pts.length; i++) {
      push();
      let x = 0, y = 0;
      
      // Calcolo posizione (lineare o circolare)
      if (r > 0) {
        let angle = map(i, 0, pts.length, 0, TWO_PI);
        x = cos(angle) * r;
        y = sin(angle) * r;
        rotate(angle + HALF_PI);
      } else {
        let totalWidth = textWidth(el.text);
        x = map(i, 0, pts.length - 1 || 1, -totalWidth/2, totalWidth/2);
        if(pts.length === 1) x = 0;
      }

      // Calcolo movimento
      let timeShift = frameCount * (el.speed * 0.05);
      let noiseX = 0, noiseY = 0;
      let scaleFactor = 1;

      if (el.motionType === 'Jitter') {
          noiseX = noise(i + el.id, timeShift) * el.jitter;
          noiseY = noise(i + 100 + el.id, timeShift) * el.jitter;
          scaleFactor = 1 + sin(timeShift + i) * 0.1;
      } 
      else if (el.motionType === 'Wave') {
          noiseY = sin(i * 0.5 + timeShift * 2) * (el.jitter * 2);
      }
      else if (el.motionType === 'Spiral') {
           let spiralMag = el.jitter * 0.5;
           x += cos(timeShift + i * 0.5) * spiralMag;
           y += sin(timeShift + i * 0.5) * spiralMag;
      }

      translate(x + noiseX, y + noiseY);
      scale(scaleFactor);
      text(pts[i], 0, 0);
      pop();
    }
    pop();
  });
  
  // Gestione cursore
  if (!isExporting) cursor(ARROW);
}

// --- INTERACTION ---

function mousePressed() {
  if (isExporting) return;

  if (currentView === 'landing') {
    // Click pulsante start
    let btnY = height / 2 + 100;
    let btnW = 180;
    let btnH = 50;
    if (mouseX > width/2 - btnW/2 && mouseX < width/2 + btnW/2 && 
        mouseY > btnY - btnH/2 && mouseY < btnY + btnH/2) {
      currentView = 'editor';
      toggleEditorUI(true);
    }
  } 
  else if (currentView === 'editor') {
    // Gestione click sugli elementi
    let safeZoneX = (isSidebarOpen && currentView === 'editor') ? 300 : 0;

    if (mouseX > safeZoneX) { 
        let clickedId = null;
        for (let i = elements.length - 1; i >= 0; i--) {
          let el = elements[i];
          if (dist(mouseX, mouseY, el.x, el.y) < el.fontSize) {
            clickedId = el.id;
            break;
          }
        }

        if (clickedId) {
            draggingId = clickedId;
            let el = elements.find(e => e.id === clickedId);
            dragOffset = { x: el.x - mouseX, y: el.y - mouseY };

            if (keyIsDown(SHIFT)) {
                if (selectedIds.includes(clickedId)) {
                    selectedIds = selectedIds.filter(id => id !== clickedId);
                } else {
                    selectedIds.push(clickedId);
                }
            } else {
                if (!selectedIds.includes(clickedId)) {
                    selectedIds = [clickedId];
                }
            }
            updateUIFromSelection();
            
        } else {
            selectedIds = [];
        }
        updateLayerList();
    }
  }
}

function mouseDragged() {
  if (currentView === 'editor' && draggingId !== null && !isExporting) {
    if (selectedIds.includes(draggingId)) {
        let mainEl = elements.find(e => e.id === draggingId);
        let dx = (mouseX + dragOffset.x) - mainEl.x;
        let dy = (mouseY + dragOffset.y) - mainEl.y;

        elements.forEach(el => {
            if (selectedIds.includes(el.id)) {
                el.x += dx;
                el.y += dy;
            }
        });
    }
  }
}

function mouseReleased() {
  draggingId = null;
}

// --- EXPORT LOGIC ---

function exportCanvas(transparent = false) {
  isExporting = true;
  isTransparentExport = transparent;
  
  toggleEditorUI(false); 
  redraw(); 
  setTimeout(() => {
    let name = transparent ? 'kinetic_transparent' : 'kinetic_art';
    saveCanvas(name, 'png');
    
    isExporting = false;
    isTransparentExport = false;
    toggleEditorUI(true);
  }, 100);
}

function exportGif() {
  let duration = ui.sGifDuration.value();
  let originalLabel = ui.bGif.html();
  
  isExporting = true;
  toggleEditorUI(false);
  ui.bGif.html('REC...');

  saveGif('kinetic_raw', duration, {
    units: 'seconds',
    notificationDuration: 1,
    silent: true
  });
  
  setTimeout(() => {
    isExporting = false;
    toggleEditorUI(true);
    ui.bGif.html(originalLabel);
  }, duration * 1000 + 1000);
}

function handleFontFile(file) {
  if (file.subtype === 'font' || file.name.endsWith('.ttf') || file.name.endsWith('.otf')) {
    customFont = loadFont(file.data, () => {
        applyProperty('fontStyle', 'custom');
    }, () => alert('Error loading font.'));
  } else {
    alert('Invalid file type.');
  }
}

// --- NEW UI IMPLEMENTATION (NO CSS STRINGS) ---

function createEditorUI() {
  // 1. Container Principale (Glass Style applicato via JS)
  sidebarContainer = createDiv('');
  sidebarContainer.id('ui-sidebar');
  sidebarContainer.style('position', 'fixed');
  sidebarContainer.style('left', '20px');
  sidebarContainer.style('top', '20px');
  sidebarContainer.style('bottom', '20px');
  sidebarContainer.style('width', '260px');
  sidebarContainer.style('background', 'rgba(255, 255, 255, 0.85)');
  sidebarContainer.style('backdrop-filter', 'blur(12px)');
  sidebarContainer.style('webkit-backdrop-filter', 'blur(12px)'); // Per Safari
  sidebarContainer.style('border', '1px solid rgba(255,255,255,0.6)');
  sidebarContainer.style('border-radius', '16px');
  sidebarContainer.style('box-shadow', '0 10px 40px rgba(0,0,0,0.1)');
  sidebarContainer.style('padding', '20px');
  sidebarContainer.style('display', 'flex');
  sidebarContainer.style('flex-direction', 'column');
  sidebarContainer.style('gap', '15px');
  sidebarContainer.style('overflow-y', 'auto');
  sidebarContainer.style('font-family', 'Helvetica, sans-serif');
  sidebarContainer.style('color', '#333');
  sidebarContainer.style('z-index', '1000');
  sidebarContainer.style('transition', 'transform 0.4s ease, opacity 0.4s ease'); // Animazione

  // --- PULSANTE FRECCETTA (Toggle) ---
  let toggleBtn = createDiv('‹'); 
  ui.toggleBtn = toggleBtn; 
  
  // Stile Bottone Toggle
  toggleBtn.style('position', 'fixed');
  toggleBtn.style('left', '300px');
  toggleBtn.style('top', '25px');
  toggleBtn.style('width', '32px');
  toggleBtn.style('height', '32px');
  toggleBtn.style('background', 'white');
  toggleBtn.style('border-radius', '50%');
  toggleBtn.style('border', '1px solid rgba(0,0,0,0.1)');
  toggleBtn.style('box-shadow', '0 4px 12px rgba(0,0,0,0.1)');
  toggleBtn.style('display', 'flex'); 
  toggleBtn.style('justify-content', 'center'); 
  toggleBtn.style('align-items', 'center');
  toggleBtn.style('cursor', 'pointer');
  toggleBtn.style('z-index', '1100');
  toggleBtn.style('font-weight', 'bold');
  toggleBtn.style('color', '#555');
  toggleBtn.style('transition', 'all 0.4s ease');
  toggleBtn.style('user-select', 'none');
  toggleBtn.style('display', 'none'); // Nascosto all'inizio

  toggleBtn.mousePressed(() => {
      isSidebarOpen = !isSidebarOpen;
      
      if (isSidebarOpen) {
          sidebarContainer.style('transform', 'translateX(0)');
          sidebarContainer.style('opacity', '1');
          sidebarContainer.style('pointer-events', 'auto');
          toggleBtn.html('‹');
          toggleBtn.style('left', '300px');
          toggleBtn.style('background', 'white');
      } else {
          sidebarContainer.style('transform', 'translateX(-320px)');
          sidebarContainer.style('opacity', '0');
          sidebarContainer.style('pointer-events', 'none');
          toggleBtn.html('›');
          toggleBtn.style('left', '20px');
          toggleBtn.style('background', 'rgba(255,255,255,0.9)');
      }
  });

  // HEADER
  let header = createDiv('').parent(sidebarContainer);
  header.style('border-bottom', '1px solid rgba(0,0,0,0.05)');
  header.style('padding-bottom', '12px');
  
  createDiv('Kinetic Editor').parent(header).style('font-weight:700; font-size:16px; margin-bottom:10px;');
  
  ui.clearBtn = createButton('Clear Canvas');
  ui.clearBtn.parent(header);
  styleButton(ui.clearBtn, '#ef4444', 'white'); // Rosso
  ui.clearBtn.style('width', '100%');
  ui.clearBtn.mousePressed(() => {
      elements = [];
      selectedIds = [];
      updateLayerList();
  });

  // CONTENT SECTION
  let contentSec = createDiv('').parent(sidebarContainer);
  contentSec.style('border-bottom', '1px solid rgba(0,0,0,0.05)');
  contentSec.style('padding-bottom', '12px');
  createSpan('Content & Layers').parent(contentSec).style('font-size:10px; text-transform:uppercase; color:#888; font-weight:600; display:block; margin-bottom:6px;');
  
  let rowInput = createDiv('').parent(contentSec);
  rowInput.style('display', 'flex');
  rowInput.style('gap', '10px');
  rowInput.style('margin-bottom', '8px');

  ui.textInput = createInput('').parent(rowInput);
  ui.textInput.style('width', '100%');
  ui.textInput.style('padding', '8px');
  ui.textInput.style('border', '1px solid #ddd');
  ui.textInput.style('border-radius', '6px');
  ui.textInput.attribute('placeholder', 'Type text...');
  
  ui.addBtn = createButton('+').parent(rowInput);
  styleButton(ui.addBtn, '#2563eb', 'white');
  ui.addBtn.mousePressed(() => addElement('NEW'));
  
  ui.textInput.input(() => {
      elements.forEach(el => {
          if (selectedIds.includes(el.id)) {
              el.text = ui.textInput.value();
          }
      });
      updateLayerList();
  });

  ui.layerBox = createDiv('').parent(contentSec);
  ui.layerBox.style('background', 'rgba(255,255,255,0.5)');
  ui.layerBox.style('border', '1px solid #eee');
  ui.layerBox.style('border-radius', '6px');
  ui.layerBox.style('max-height', '100px');
  ui.layerBox.style('overflow-y', 'auto');

  // MOTION SECTION
  let motionSec = createDiv('').parent(sidebarContainer);
  motionSec.style('border-bottom', '1px solid rgba(0,0,0,0.05)');
  motionSec.style('padding-bottom', '12px');
  createSpan('Motion Dynamics').parent(motionSec).style('font-size:10px; text-transform:uppercase; color:#888; font-weight:600; display:block; margin-bottom:6px;');
  
  ui.sMotionType = createSelect().parent(motionSec);
  ui.sMotionType.style('width', '100%');
  ui.sMotionType.style('padding', '5px');
  ui.sMotionType.style('margin-bottom', '10px');
  ui.sMotionType.option('Jitter');
  ui.sMotionType.option('Wave');
  ui.sMotionType.option('Spiral');
  ui.sMotionType.changed(() => applyProperty('motionType', ui.sMotionType.value()));
  
  addSliderControl(motionSec, 'Intensity', 0, 100, 0, (v) => applyProperty('jitter', v), 'sJitter');
  addSliderControl(motionSec, 'Speed', 0, 20, 2, (v) => applyProperty('speed', v), 'sSpeed');

  // STYLE SECTION
  let styleSec = createDiv('').parent(sidebarContainer);
  styleSec.style('border-bottom', '1px solid rgba(0,0,0,0.05)');
  styleSec.style('padding-bottom', '12px');
  createSpan('Appearance').parent(styleSec).style('font-size:10px; text-transform:uppercase; color:#888; font-weight:600; display:block; margin-bottom:6px;');
  
  addSliderControl(styleSec, 'Size', 20, 300, 60, (v) => applyProperty('fontSize', v), 'sSize');
  addSliderControl(styleSec, 'Radius', 0, 400, 0, (v) => applyProperty('radius', v), 'sRadius');

  let rowColors = createDiv('').parent(styleSec).style('display:flex; justify-content:space-between; margin-bottom:8px; align-items:center;');
  createSpan('Text Color').parent(rowColors).style('font-size:11px;');
  ui.cText = createColorPicker('#111827').parent(rowColors);
  ui.cText.input(() => applyProperty('textColor', ui.cText.color()));
  
  let rowBg = createDiv('').parent(styleSec).style('display:flex; justify-content:space-between; margin-bottom:8px; align-items:center;');
  createSpan('Background').parent(rowBg).style('font-size:11px;');
  ui.cBg = createColorPicker('#f3f4f6').parent(rowBg);
  ui.cBg.input(() => canvasBgColor = ui.cBg.color());

  let rowFonts = createDiv('').parent(styleSec).style('display:flex; justify-content:space-between; margin-top:10px;');
  ui.bFont = createButton('Cycle Font').parent(rowFonts);
  styleButton(ui.bFont, '#fff', '#333');
  ui.bFont.mousePressed(() => {
      let f = ['sans-serif', 'serif', 'monospace', 'cursive'];
      applyProperty('fontStyle', random(f));
  });
  
  ui.iFont = createFileInput(handleFontFile).parent(rowFonts);
  ui.iFont.style('font-size:9px; width:90px;');

  // EXPORT SECTION
  let exportSec = createDiv('').parent(sidebarContainer);
  createSpan('Export Studio').parent(exportSec).style('font-size:10px; text-transform:uppercase; color:#888; font-weight:600; display:block; margin-bottom:6px;');
  
  addSliderControl(exportSec, 'Gif Duration (sec)', 1, 4, 2, (v) => {
    ui.lDurVal.html(v + 's');
  }, 'sGifDuration', 0.5);
  
  ui.lDurVal = createDiv('2s').parent(exportSec).style('font-size:10px; text-align:right; margin-top:-5px; margin-bottom:5px; color:#666;');

  let btnRow = createDiv('').parent(exportSec);
  btnRow.style('display', 'flex');
  btnRow.style('gap', '5px');

  ui.bGif = createButton('GIF').parent(btnRow);
  styleButton(ui.bGif, '#2563eb', 'white');
  ui.bGif.style('flex', '1');
  ui.bGif.mousePressed(exportGif);

  ui.bPng = createButton('PNG').parent(btnRow);
  styleButton(ui.bPng, '#fff', '#333');
  ui.bPng.style('flex', '1');
  ui.bPng.mousePressed(() => exportCanvas(false));

  ui.bPngAlpha = createButton('PNG (TP)').parent(btnRow);
  styleButton(ui.bPngAlpha, '#fff', '#333');
  ui.bPngAlpha.style('flex', '1');
  ui.bPngAlpha.mousePressed(() => exportCanvas(true));
}

// Funzione helper per lo stile dei bottoni
function styleButton(btn, bgColor, txtColor) {
    btn.style('background', bgColor);
    btn.style('color', txtColor);
    btn.style('border', bgColor === '#fff' ? '1px solid #ddd' : 'none');
    btn.style('border-radius', '6px');
    btn.style('padding', '6px 12px');
    btn.style('font-size', '11px');
    btn.style('cursor', 'pointer');
    btn.style('font-weight', '500');
}

// Helper per creare slider
function addSliderControl(parent, label, min, max, val, callback, uiKey, step=1) {
    let box = createDiv('').parent(parent).style('margin-bottom:8px;');
    let header = createDiv('').parent(box).style('display:flex; justify-content:space-between; margin-bottom:2px;');
    createSpan(label).parent(header).style('font-size:11px; color:#555;');
    
    let slider = createSlider(min, max, val, step).parent(box);
    slider.style('width', '100%');
    slider.style('accent-color', '#2563eb'); // Colore slider moderno
    slider.input(() => callback(slider.value()));
    if(uiKey) ui[uiKey] = slider;
}

function updateLayerList() {
    if (!ui.layerBox) return; 
    ui.layerBox.html(''); 
    
    elements.forEach((el) => {
        let row = createDiv('').parent(ui.layerBox);
        row.style('padding', '6px 8px');
        row.style('border-bottom', '1px solid rgba(0,0,0,0.05)');
        row.style('font-size', '12px');
        row.style('cursor', 'pointer');
        row.style('display', 'flex');
        row.style('justify-content', 'space-between');
        row.style('align-items', 'center');
        
        if (selectedIds.includes(el.id)) {
            row.style('background-color', 'rgba(37, 99, 235, 0.1)'); 
            row.style('color', '#2563eb');
            row.style('font-weight', '600');
        } else {
            row.style('background-color', 'transparent');
            row.style('color', '#333');
        }
        
        row.mousePressed((e) => {
            if (keyIsDown(SHIFT)) {
                 if (selectedIds.includes(el.id)) selectedIds = selectedIds.filter(id => id !== el.id);
                 else selectedIds.push(el.id);
            } else {
                 selectedIds = [el.id];
            }
            updateUIFromSelection();
            updateLayerList();
        });

        let del = createSpan('×');
        del.parent(row);
        del.style('color', '#ef4444');
        del.style('font-weight', 'bold');
        del.style('padding', '0 4px');
        del.mousePressed((e) => {
            e.stopPropagation();
            elements = elements.filter(e => e.id !== el.id);
            selectedIds = selectedIds.filter(id => id !== el.id);
            updateLayerList();
        });
    });
}

function updateUIValues() {
    ui.sSize.value(defaultSettings.fontSize);
    ui.sJitter.value(defaultSettings.jitter);
    ui.sRadius.value(defaultSettings.radius);
    ui.sSpeed.value(defaultSettings.speed);
}

function toggleEditorUI(show) {
    if(sidebarContainer) {
        if(show) {
            sidebarContainer.style('display', 'flex');
            if(ui.toggleBtn) ui.toggleBtn.style('display', 'flex');
            
            // Reset posizione quando si apre
            isSidebarOpen = true;
            sidebarContainer.style('transform', 'translateX(0)');
            sidebarContainer.style('opacity', '1');
            if(ui.toggleBtn) {
                ui.toggleBtn.style('left', '300px');
                ui.toggleBtn.html('‹');
            }
        }
        else {
            sidebarContainer.style('display', 'none');
            if(ui.toggleBtn) ui.toggleBtn.style('display', 'none');
        }
    }
}