// WUP 25-26 // Niccolò Parmeggiani
/* P5.JS ULTIMATE DRAWING TOOL - SPACED SHAPES
   - SCIA FORME: Distanza aumentata (meno figure, più pulito).
   - SLIDER DISTANZA: Range da 20 a 500px.
   - COLORE: Fix sincronizzazione attivo.
   - WET/SPRAY: Funzioni avanzate mantenute.
*/

// --- STATO GLOBALE ---
let elements = []; 
let undoStack = []; 
let bgImage = null;       
let bgDisplay = null;     

// Configurazione Interfaccia
let ui = {
  container: null,
  inputs: {} 
};

// Stato del sistema
let appState = {
  tool: 'pen',         
  subTool: 'basic',    
  color: '#000000',
  backgroundColor: '#F0F0F0', 
  isTransparent: false, 
  
  size: 30,
  opacity: 255,
  filled: false,
  polySides: 5,        
  perfectMode: false,  
  
  // -- CONFIG SPRAY --
  dripEnabled: false, 
  dripWavy: false,    
  dripLength: 60,     
  dripSize: 3,        
  dripChance: 5,

  // -- CONFIG WET --
  wetAngled: false,   
  wetAngle: 0,

  // -- CONFIG SCIA FORME (MODIFICATO) --
  shapeTrailMode: false, 
  shapeSpacing: 100,     // Default aumentato a 100 (meno figure)
  shapeAngle: 0,         
  
  // Gestione Sfondo
  bgEditMode: false,   
  bgCropMode: false,   
  bgTransform: { x: 0, y: 0, scale: 1.0 }, 
  
  // Variabili di interazione
  isDrawing: false,
  startX: 0, startY: 0,
  currentPoints: [],    
  currentDrips: [],     
  
  // Selezione
  selection: -1,       
  interactionMode: null, 
  dragOff: {x:0, y:0},
  resizeStart: {w:0, h:0, mouseX:0, mouseY:0}
};

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1); 
  createInterface(); 
}

function draw() {
  // FIX COLORE CONTINUO
  if(ui.inputs.colorPicker) {
    appState.color = ui.inputs.colorPicker.value();
  }

  // 1. GESTIONE SFONDO
  if (appState.isTransparent) {
    clear(); 
  } else {
    background(appState.backgroundColor);
  }

  // 2. DISEGNA FOTO SFONDO
  if (bgDisplay) {
    push();
    translate(width/2 + appState.bgTransform.x, height/2 + appState.bgTransform.y);
    scale(appState.bgTransform.scale);
    imageMode(CENTER);
    image(bgDisplay, 0, 0);
    
    if(appState.bgEditMode) {
      noFill(); stroke(255, 0, 0); strokeWeight(2 / appState.bgTransform.scale);
      rect(-bgDisplay.width/2, -bgDisplay.height/2, bgDisplay.width, bgDisplay.height);
    }
    pop();
  }

  // 3. DISEGNA ELEMENTI
  for (let i = 0; i < elements.length; i++) {
    drawElement(elements[i], i === appState.selection);
  }

  // 4. ANTEPRIMA
  if (appState.isDrawing) {
    if (appState.bgCropMode) {
      push();
      stroke(255, 0, 255); strokeWeight(2); noFill();
      beginShape();
      for(let p of appState.currentPoints) vertex(p.x, p.y);
      vertex(mouseX, mouseY);
      endShape();
      pop();
    } else if (appState.interactionMode === 'drawing') {
      previewDrawing();
    }
  }

  drawCursor();
}

// --- LOGICA DI DISEGNO ---
function drawElement(el, isSelected) {
  push();
  let c = color(el.color);
  
  // Gestione Alpha generale
  if (el.subTool !== 'spray' && el.type !== 'shapeBrush' && !el.wetAngled) {
    c.setAlpha(el.opacity);
  }
  
  // 1. FORME GEOMETRICHE STANDARD (Singole)
  if (['rect', 'circle', 'poly', 'line'].includes(el.type)) {
    if (el.filled && el.type !== 'line') { fill(c); noStroke(); } 
    else { noFill(); stroke(c); strokeWeight(el.size); }

    let rot = el.shapeAngle || 0;
    
    if (el.type === 'rect') {
       rectMode(CORNER);
       rect(el.x, el.y, el.w, el.h);
    }
    else if (el.type === 'circle') { 
       ellipseMode(CORNER); 
       ellipse(el.x, el.y, el.w, el.h); 
    }
    else if (el.type === 'line') {
       line(el.x, el.y, el.x + el.w, el.y + el.h);
    }
    else if (el.type === 'poly') {
       drawPolygon(el.x + el.w/2, el.y + el.h/2, max(abs(el.w), abs(el.h))/2, el.sides, 0);
    }
  } 
  
  // 2. PENNELLO DI FORME (Scia distanziata)
  else if (el.type === 'shapeBrush') {
    c.setAlpha(el.opacity);
    if (el.filled) { fill(c); noStroke(); } 
    else { noFill(); stroke(c); strokeWeight(2); } 

    rectMode(CENTER);
    ellipseMode(CENTER);

    let distAcc = 0; 
    let safeSpacing = max(el.spacing, 20); // Protezione anti-crash (minimo 20px)
    
    if (el.points.length > 0) {
      drawShapeAt(el.points[0].x, el.points[0].y, el);

      for (let i = 1; i < el.points.length; i++) {
        let p1 = el.points[i-1];
        let p2 = el.points[i];
        let d = dist(p1.x, p1.y, p2.x, p2.y);
        
        distAcc += d;
        while (distAcc >= safeSpacing) {
           drawShapeAt(p2.x, p2.y, el);
           distAcc -= safeSpacing;
        }
      }
    }
  }

  // 3. PENNELLI ARTISTICI (Brush)
  else if (el.type === 'brush') {
    noFill(); stroke(c); strokeWeight(el.size); strokeCap(ROUND); strokeJoin(ROUND);
    
    if (el.subTool === 'spray') {
      strokeWeight(1); 
      let sprayColor = color(el.color);
      let pointAlpha = map(el.opacity, 0, 255, 0, 80); 
      sprayColor.setAlpha(pointAlpha);
      stroke(sprayColor);
      beginShape(POINTS);
      for (let p of el.points) vertex(p.x, p.y);
      if (el.drips && el.drips.length > 0) {
        for (let d of el.drips) vertex(d.x, d.y);
      }
      endShape();
    }
    else if (el.subTool === 'wet') {
      blendMode(MULTIPLY); 
      if (el.wetAngled) {
        noStroke();
        c.setAlpha(el.opacity / 4); 
        fill(c);
        for (let p of el.points) {
           push(); translate(p.x, p.y); rotate(radians(el.wetAngle)); 
           ellipse(0, 0, el.size, el.size / 5); pop();
        }
      } else {
        noFill(); c.setAlpha(el.opacity / 3); stroke(c); strokeWeight(el.size);
        beginShape(); for (let p of el.points) curveVertex(p.x, p.y); endShape();
      }
      blendMode(BLEND);
    }
    else if (el.subTool === 'basic' || el.subTool === 'eraser') {
      if (el.subTool === 'eraser') { 
         strokeWeight(el.size);
         if(appState.isTransparent) { blendMode(REMOVE); } 
         else { stroke(appState.backgroundColor); }
      } else {
        c.setAlpha(el.opacity); stroke(c);
      }
      beginShape(); for (let p of el.points) vertex(p.x, p.y); endShape();
      blendMode(BLEND);
    } 
    else if (el.subTool === 'soft') {
      c.setAlpha(el.opacity); stroke(c);
      drawingContext.shadowBlur = el.size; drawingContext.shadowColor = c;
      beginShape(); for (let p of el.points) vertex(p.x, p.y); endShape();
      drawingContext.shadowBlur = 0;
    }
    else if (el.subTool === 'particle') {
      c.setAlpha(el.opacity); stroke(c);
      strokeWeight(1);
      for (let i = 0; i < el.points.length - 1; i+=2) {
        let p = el.points[i];
        let rndX = sin(p.x * 0.1) * el.size * 2;
        let rndY = cos(p.y * 0.1) * el.size * 2;
        line(p.x, p.y, p.x + rndX, p.y + rndY);
      }
    }
  }

  if (isSelected) {
    blendMode(BLEND); noFill(); stroke(0, 100, 255); strokeWeight(1);
    let bx = el.x, by = el.y, bw = el.w, bh = el.h;
    
    if (el.type === 'brush' || el.type === 'shapeBrush') {
       let minX=Infinity, minY=Infinity, maxX=-Infinity, maxY=-Infinity;
       for(let p of el.points) { 
         minX = min(minX, p.x); minY = min(minY, p.y); 
         maxX = max(maxX, p.x); maxY = max(maxY, p.y); 
       }
       if(el.drips && el.subTool === 'spray') {
          for(let d of el.drips) { 
            minX = min(minX, d.x); minY = min(minY, d.y);
            maxX = max(maxX, d.x); maxY = max(maxY, d.y);
          }
       }
       let pad = el.size || 10;
       bx = minX - pad; by = minY - pad; bw = (maxX - minX) + pad*2; bh = (maxY - minY) + pad*2;
       el.x=bx; el.y=by; el.w=bw; el.h=bh; 
    }
    rect(bx, by, bw, bh);
    fill(255, 0, 0); noStroke(); rect(bx + bw - 6, by + bh - 6, 12, 12);
  }
  pop();
}

function drawShapeAt(x, y, el) {
  push();
  translate(x, y);
  rotate(radians(el.shapeAngle));
  
  if (el.subTool === 'rect') {
    rect(0, 0, el.size, el.size);
  } else if (el.subTool === 'circle') {
    ellipse(0, 0, el.size, el.size);
  } else if (el.subTool === 'poly') {
    drawPolygon(0, 0, el.size/2, el.sides, 0);
  }
  pop();
}

function drawPolygon(x, y, radius, npoints, offsetAngle) {
  let angle = TWO_PI / npoints;
  beginShape();
  for (let a = 0; a < TWO_PI; a += angle) {
    let sx = x + cos(a - PI/2 + offsetAngle) * radius;
    let sy = y + sin(a - PI/2 + offsetAngle) * radius;
    vertex(sx, sy);
  }
  endShape(CLOSE);
}

// --- INTERAZIONE MOUSE ---

function mouseWheel(event) {
  if (bgDisplay && appState.bgEditMode) {
    modifyBgScale(event.delta > 0 ? -0.1 : 0.1);
    return false; 
  }
}

function modifyBgScale(amount) {
  appState.bgTransform.scale += amount;
  appState.bgTransform.scale = constrain(appState.bgTransform.scale, 0.1, 10.0);
}

function mousePressed() {
  if (mouseY < 140) return;

  if (appState.bgEditMode && bgDisplay) {
    appState.interactionMode = 'bgMove';
    appState.dragOff = { x: mouseX, y: mouseY, oldX: appState.bgTransform.x, oldY: appState.bgTransform.y };
    return;
  }

  if (appState.bgCropMode && bgDisplay) {
    appState.isDrawing = true;
    appState.currentPoints = [{x: mouseX, y: mouseY}];
    return;
  }

  if (appState.tool === 'pipette') {
    let x = parseInt(mouseX); let y = parseInt(mouseY);
    let c = get(x, y);
    let pickedColor = color(c);
    let hexVal = pickedColor.toString('#rrggbb');
    appState.color = hexVal; 
    ui.inputs.colorPicker.value(hexVal);
    appState.tool = 'brush'; appState.subTool = 'basic'; ui.inputs.toolSelect.value('basic'); 
    return;
  }

  if (appState.tool === 'select') {
    if (appState.selection !== -1) {
      let el = elements[appState.selection];
      if (dist(mouseX, mouseY, el.x + el.w, el.y + el.h) < 15) {
        appState.interactionMode = 'resize';
        appState.resizeStart = { w: el.w, h: el.h, mouseX: mouseX, mouseY: mouseY };
        return;
      }
    }
    let hitIndex = -1;
    for (let i = elements.length - 1; i >= 0; i--) {
       let el = elements[i];
       let minX = el.x; let maxX = el.x + el.w; let minY = el.y; let maxY = el.y + el.h;
       if(el.w < 0) { minX = el.x+el.w; maxX = el.x; }
       if(el.h < 0) { minY = el.y+el.h; maxY = el.y; }
       if (mouseX > minX && mouseX < maxX && mouseY > minY && mouseY < maxY) {
         hitIndex = i; break;
       }
    }
    appState.selection = hitIndex;
    if (hitIndex !== -1) {
      appState.interactionMode = 'move';
      appState.dragOff = { x: mouseX - elements[hitIndex].x, y: mouseY - elements[hitIndex].y };
      syncUI(elements[hitIndex]); 
    } else { appState.interactionMode = null; }
    return;
  }

  appState.selection = -1;
  appState.interactionMode = 'drawing';
  appState.isDrawing = true;
  appState.startX = mouseX;
  appState.startY = mouseY;
  
  appState.currentPoints = [];
  appState.currentDrips = []; 
  
  if (appState.subTool === 'spray') {
    generateSprayPoints(mouseX, mouseY);
  } else {
    appState.currentPoints.push({x: mouseX, y: mouseY});
  }
}

function mouseDragged() {
  if (appState.bgEditMode && appState.interactionMode === 'bgMove') {
    let dx = mouseX - appState.dragOff.x;
    let dy = mouseY - appState.dragOff.y;
    appState.bgTransform.x = appState.dragOff.oldX + dx;
    appState.bgTransform.y = appState.dragOff.oldY + dy;
    return;
  }

  if (appState.tool === 'select' && appState.selection !== -1) {
    let el = elements[appState.selection];
    if (appState.interactionMode === 'move') {
      let dx = mouseX - appState.dragOff.x; let dy = mouseY - appState.dragOff.y;
      if (el.type === 'brush' || el.type === 'shapeBrush') {
        let diffX = dx - el.x; let diffY = dy - el.y;
        for(let p of el.points) { p.x += diffX; p.y += diffY; }
        if(el.drips) { for(let d of el.drips) { d.x += diffX; d.y += diffY; } }
      }
      el.x = dx; el.y = dy;
    } else if (appState.interactionMode === 'resize') {
      let diffX = mouseX - appState.resizeStart.mouseX; let diffY = mouseY - appState.resizeStart.mouseY;
      el.w = appState.resizeStart.w + diffX; el.h = appState.resizeStart.h + diffY;
    }
    return;
  }

  if (!appState.isDrawing) return;

  let tx = mouseX, ty = mouseY;
  
  if ((appState.perfectMode || keyIsDown(SHIFT)) && !appState.bgCropMode) {
    if (appState.tool === 'brush' || appState.tool === 'line' || 
       (appState.shapeTrailMode && ['rect','circle','poly'].includes(appState.tool))) {
      if (abs(mouseX - appState.startX) > abs(mouseY - appState.startY)) ty = appState.startY; 
      else tx = appState.startX; 
    }
  }

  if (appState.subTool === 'spray') {
     generateSprayPoints(tx, ty);
  } else if (appState.tool === 'brush' || appState.bgCropMode || appState.shapeTrailMode) {
     appState.currentPoints.push({x: tx, y: ty});
  }
}

// --- GENERATORE SPRAY ---
function generateSprayPoints(cx, cy) {
  let density = map(appState.size, 10, 100, 50, 200); 
  
  for(let i=0; i<density; i++) {
    let spread = (random() < 0.7) ? appState.size/4 : appState.size/2;
    let r = randomGaussian(0, spread);
    let angle = random(TWO_PI);
    let px = cx + cos(angle) * r;
    let py = cy + sin(angle) * r;
    
    if(dist(cx, cy, px, py) < appState.size) {
      appState.currentPoints.push({x: px, y: py});
    }
  }

  let forcedDrip = keyIsDown(32); 
  let autoDrip = appState.dripEnabled && (random(100) < appState.dripChance);

  if (autoDrip || forcedDrip) {
      let dripX = cx + random(-appState.size/4, appState.size/4); 
      let dripY = cy + random(0, appState.size/2);
      
      let baseLen = appState.dripLength;
      if (forcedDrip) baseLen *= 1.5;
      let len = baseLen * random(0.7, 1.3);
      let thick = appState.dripSize; 

      let isWavy = appState.dripWavy;
      let amp = map(thick, 1, 10, 5, 15) * random(0.8, 1.2);
      let freq = random(0.05, 0.1);
      let phase = random(TWO_PI);

      for (let y = 0; y < len; y+=1) {
         let dots = map(thick, 1, 10, 2, 8); 
         let waveOffsetX = 0;
         if (isWavy) {
            waveOffsetX = sin(y * freq + phase) * amp * map(y,0,len,0.2,1.0);
         }

         for (let k = 0; k < dots; k++) {
            let scatterX = randomGaussian(0, thick/2);
            appState.currentDrips.push({
               x: dripX + waveOffsetX + scatterX,
               y: dripY + y
            });
         }
      }
  }
}

function mouseReleased() {
  if (appState.bgCropMode && appState.isDrawing) {
    appState.isDrawing = false;
    performImageCrop(); 
    return;
  }

  if (appState.bgEditMode) { appState.interactionMode = null; return; }
  if (appState.tool === 'select') { appState.interactionMode = null; return; }
  if (!appState.isDrawing) return;

  appState.isDrawing = false;
  
  let el = {
    color: appState.color, 
    size: appState.size,
    opacity: appState.opacity, 
    filled: appState.filled, 
    sides: appState.polySides,
    x: appState.startX, y: appState.startY, 
    w: mouseX - appState.startX, h: mouseY - appState.startY,
    points: [...appState.currentPoints],
    drips: [...appState.currentDrips], 
    wetAngle: appState.wetAngle,
    wetAngled: appState.wetAngled
  };

  if (['rect', 'circle', 'poly'].includes(appState.tool) && appState.shapeTrailMode) {
    el.type = 'shapeBrush';
    el.subTool = appState.tool; 
    el.spacing = appState.shapeSpacing;
    el.shapeAngle = appState.shapeAngle;
  } 
  else {
    el.type = appState.tool;
    el.subTool = appState.subTool;
  }

  if (appState.perfectMode || keyIsDown(SHIFT)) {
    if (['rect', 'circle', 'poly'].includes(el.type)) { 
      let s = max(abs(el.w), abs(el.h));
      el.w = (el.w<0 ? -s : s); el.h = (el.h<0 ? -s : s);
    }
    if (el.type === 'line' || el.type === 'brush' || el.type === 'shapeBrush') {
       let lastX = (el.type==='line')? mouseX : el.points[el.points.length-1].x;
       let lastY = (el.type==='line')? mouseY : el.points[el.points.length-1].y;
       if(abs(lastX - el.x) > abs(lastY - el.y)) {
          el.h = 0; if(el.points) el.points = el.points.map(p => ({x:p.x, y:el.y}));
       } else {
          el.w = 0; if(el.points) el.points = el.points.map(p => ({x:el.x, y:p.y}));
       }
    }
  }
  elements.push(el);
}

function performImageCrop() {
  if (!bgDisplay) return;

  let mask = createGraphics(bgDisplay.width, bgDisplay.height);
  mask.pixelDensity(1); 
  mask.background(0, 0, 0, 0); 
  mask.fill(255);              
  mask.noStroke();

  let tx = width/2 + appState.bgTransform.x;
  let ty = height/2 + appState.bgTransform.y;
  let s = appState.bgTransform.scale;

  mask.beginShape();
  for (let p of appState.currentPoints) {
    let imgX = (p.x - tx) / s + bgDisplay.width/2;
    let imgY = (p.y - ty) / s + bgDisplay.height/2;
    mask.vertex(imgX, imgY);
  }
  mask.endShape(CLOSE);

  let newImg = bgDisplay.get(); 
  let maskImage = mask.get();
  newImg.mask(maskImage);
  bgDisplay = newImg;
  
  toggleCropMode(false);
}

function previewDrawing() {
  let tempType = appState.tool;
  let tempSub = appState.subTool;
  
  if (['rect', 'circle', 'poly'].includes(appState.tool) && appState.shapeTrailMode) {
    tempType = 'shapeBrush';
    tempSub = appState.tool;
  }

  let tempEl = {
    type: tempType, 
    subTool: tempSub, 
    color: appState.color, 
    size: appState.size,
    opacity: appState.opacity, 
    filled: appState.filled, 
    sides: appState.polySides,
    x: appState.startX, y: appState.startY, 
    w: mouseX - appState.startX, h: mouseY - appState.startY,
    points: appState.currentPoints,
    drips: appState.currentDrips,
    wetAngle: appState.wetAngle,
    wetAngled: appState.wetAngled,
    spacing: appState.shapeSpacing,
    shapeAngle: appState.shapeAngle
  };
  
  if (appState.perfectMode || keyIsDown(SHIFT)) {
      if (['rect', 'circle', 'poly'].includes(tempEl.type)) { 
         let s = max(abs(tempEl.w), abs(tempEl.h));
         tempEl.w = (tempEl.w<0 ? -s : s); tempEl.h = (tempEl.h<0 ? -s : s);
      } else if (tempEl.type === 'line' || tempEl.type === 'shapeBrush') {
         if(abs(mouseX - appState.startX) > abs(mouseY - appState.startY)) {
            tempEl.points = tempEl.points.map(p => ({x:p.x, y:appState.startY}));
            tempEl.h = 0;
         } else {
            tempEl.points = tempEl.points.map(p => ({x:appState.startX, y:p.y}));
            tempEl.w = 0;
         }
      }
  }
  drawElement(tempEl, false);
}

function mixColors(c1, c2) {
  let col1 = color(c1); let col2 = color(c2); let mixed = lerpColor(col1, col2, 0.5);
  let hexVal = mixed.toString('#rrggbb');
  ui.inputs.colorPicker.value(hexVal); updateParams();
}

function updateParams() {
  let t = ui.inputs.toolSelect.value();
  if (['select', 'pipette', 'line', 'rect', 'circle', 'poly'].includes(t)) {
    appState.tool = t;
  } else {
    appState.tool = 'brush'; appState.subTool = t; 
  }
  // appState.color viene aggiornato in draw(), ma lo leggiamo anche qui per sicurezza
  if(ui.inputs.colorPicker) appState.color = ui.inputs.colorPicker.value();
  
  appState.size = parseInt(ui.inputs.sizeSlider.value());
  appState.opacity = parseInt(ui.inputs.opacitySlider.value());
  appState.filled = ui.inputs.fillCheck.checked();
  appState.perfectMode = ui.inputs.perfectCheck.checked();
  
  appState.polySides = parseInt(ui.inputs.polyInput.value());
  ui.inputs.polyGroup.style('display', t === 'poly' ? 'flex' : 'none');

  // SPRAY UI
  if (t === 'spray') {
    ui.inputs.sprayGroup.style('display', 'flex');
    appState.dripEnabled = ui.inputs.dripCheck.checked();
    appState.dripWavy = ui.inputs.dripWavyCheck.checked(); 
    appState.dripLength = parseInt(ui.inputs.dripLenSlider.value());
    appState.dripSize = parseInt(ui.inputs.dripSizeSlider.value());
    appState.dripChance = parseInt(ui.inputs.dripChanceSlider.value());
  } else {
    ui.inputs.sprayGroup.style('display', 'none');
  }

  // WET UI
  if (t === 'wet') {
    ui.inputs.wetGroup.style('display', 'flex');
    appState.wetAngled = ui.inputs.wetAngledCheck.checked();
    appState.wetAngle = parseInt(ui.inputs.wetAngleSlider.value());
    if(appState.wetAngled) ui.inputs.wetAngleContainer.style('display', 'block');
    else ui.inputs.wetAngleContainer.style('display', 'none');
  } else {
    ui.inputs.wetGroup.style('display', 'none');
  }

  // SHAPE TRAIL UI
  if (['rect', 'circle', 'poly'].includes(t)) {
    ui.inputs.shapeGroup.style('display', 'flex');
    appState.shapeTrailMode = ui.inputs.shapeTrailCheck.checked();
    appState.shapeSpacing = parseInt(ui.inputs.shapeSpacingSlider.value());
    appState.shapeAngle = parseInt(ui.inputs.shapeAngleSlider.value());
    
    if(appState.shapeTrailMode) {
       ui.inputs.shapeParams.style('display', 'block');
    } else {
       ui.inputs.shapeParams.style('display', 'none');
    }
  } else {
    ui.inputs.shapeGroup.style('display', 'none');
    appState.shapeTrailMode = false; 
  }

  appState.isTransparent = ui.inputs.transpCheck.checked(); 
  
  if (appState.bgCropMode && t !== 'brush') toggleCropMode(false);
  
  if (appState.selection !== -1 && appState.tool === 'select') {
    let el = elements[appState.selection];
    el.color = appState.color; el.size = appState.size; el.opacity = appState.opacity; el.filled = appState.filled;
  }
}

function syncUI(el) {
  ui.inputs.colorPicker.value(el.color); ui.inputs.sizeSlider.value(el.size);
  ui.inputs.opacitySlider.value(el.opacity); ui.inputs.fillCheck.checked(el.filled);
  updateParams();
}

function toggleBgEditMode() {
  appState.bgEditMode = !appState.bgEditMode;
  appState.bgCropMode = false; 
  ui.inputs.btnMoveBg.style('background', appState.bgEditMode ? '#ffcccc' : '#f0f0f0');
  ui.inputs.btnCropBg.style('background', '#f0f0f0');
}

function toggleCropMode(forceState) {
  appState.bgCropMode = forceState !== undefined ? forceState : !appState.bgCropMode;
  appState.bgEditMode = false; 
  ui.inputs.btnCropBg.style('background', appState.bgCropMode ? '#ccffcc' : '#f0f0f0');
  ui.inputs.btnMoveBg.style('background', '#f0f0f0');
  
  if (appState.bgCropMode) cursor(CROSS); else drawCursor();
}

function createInterface() {
  ui.container = createDiv('').style(`
    position: absolute; top: 0; left: 0; right: 0; 
    background: #fff; border-bottom: 2px solid #ccc; 
    padding: 10px; display: flex; flex-wrap: wrap; gap: 10px; 
    align-items: center; font-family: sans-serif; font-size: 13px; z-index: 100; box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  `);

  let groupTools = createDiv('<b>Tools:</b>').parent(ui.container);
  ui.inputs.toolSelect = createSelect().parent(groupTools);
  ui.inputs.toolSelect.option('👆 SELEZIONA', 'select');
  ui.inputs.toolSelect.option('🖊️ Penna', 'basic');
  ui.inputs.toolSelect.option('💧 Wet', 'wet');
  ui.inputs.toolSelect.option('🚿 Spray', 'spray');
  ui.inputs.toolSelect.option('🧼 Gomma', 'eraser');
  ui.inputs.toolSelect.option('🧪 Pipetta', 'pipette');
  ui.inputs.toolSelect.option('➖ Linea', 'line');
  ui.inputs.toolSelect.option('⬜ Rettangolo', 'rect');
  ui.inputs.toolSelect.option('⭕ Cerchio', 'circle');
  ui.inputs.toolSelect.option('🔷 Poligono', 'poly');
  ui.inputs.toolSelect.changed(updateParams);

  let groupStyle = createDiv('').parent(ui.container).style('display:flex; gap:8px; align-items:center;');
  
  ui.inputs.colorPicker = createColorPicker('#000000').parent(groupStyle).style('width:30px; border:none');
  
  let divSize = createDiv('🖊️ Dimensione').parent(groupStyle).style('font-size:11px; display:flex; flex-direction:column; align-items:center;');
  ui.inputs.sizeSlider = createSlider(1, 100, 30).parent(divSize).style('width:70px');
  ui.inputs.sizeSlider.attribute('title', 'Modifica la grandezza del tratto');
  ui.inputs.sizeSlider.input(updateParams);

  let divOp = createDiv('👻 Opacità').parent(groupStyle).style('font-size:11px; display:flex; flex-direction:column; align-items:center;');
  ui.inputs.opacitySlider = createSlider(0, 255, 255).parent(divOp).style('width:70px');
  ui.inputs.opacitySlider.attribute('title', 'Modifica la trasparenza del tratto');
  ui.inputs.opacitySlider.input(updateParams);

  ui.inputs.fillCheck = createCheckbox('Fill', false).parent(groupStyle);
  ui.inputs.fillCheck.changed(updateParams);
  ui.inputs.perfectCheck = createCheckbox('Perfetto', false).parent(groupStyle);
  ui.inputs.perfectCheck.changed(updateParams);

  ui.inputs.polyGroup = createDiv('').parent(groupStyle).style('display:none; align-items:center; gap:3px;');
  createSpan('Lati:').parent(ui.inputs.polyGroup).style('font-size:11px;');
  ui.inputs.polyInput = createInput('5', 'number').parent(ui.inputs.polyGroup).style('width:35px;');
  ui.inputs.polyInput.attribute('min', '3');
  ui.inputs.polyInput.input(updateParams);

  ui.inputs.sprayGroup = createDiv('').parent(ui.container).style('display:none; background:#f0f8ff; padding:5px; border-radius:5px; align-items:center; gap:8px;');
  ui.inputs.dripCheck = createCheckbox('Gocce', false).parent(ui.inputs.sprayGroup);
  ui.inputs.dripCheck.changed(updateParams);
  ui.inputs.dripWavyCheck = createCheckbox('Ondulate', false).parent(ui.inputs.sprayGroup);
  ui.inputs.dripWavyCheck.changed(updateParams);
  
  let dLen = createDiv('Lunghezza').parent(ui.inputs.sprayGroup).style('font-size:10px; text-align:center');
  ui.inputs.dripLenSlider = createSlider(10, 200, 50).parent(dLen).style('width:60px');
  ui.inputs.dripLenSlider.input(updateParams);

  let dSize = createDiv('Spessore').parent(ui.inputs.sprayGroup).style('font-size:10px; text-align:center');
  ui.inputs.dripSizeSlider = createSlider(1, 10, 3).parent(dSize).style('width:60px');
  ui.inputs.dripSizeSlider.input(updateParams);

  let dChance = createDiv('Quantità').parent(ui.inputs.sprayGroup).style('font-size:10px; text-align:center');
  ui.inputs.dripChanceSlider = createSlider(1, 100, 10).parent(dChance).style('width:60px');
  ui.inputs.dripChanceSlider.input(updateParams);

  ui.inputs.wetGroup = createDiv('').parent(ui.container).style('display:none; background:#e6f3ff; padding:5px; border-radius:5px; align-items:center; gap:8px;');
  ui.inputs.wetAngledCheck = createCheckbox('Punta Piatta', false).parent(ui.inputs.wetGroup);
  ui.inputs.wetAngledCheck.changed(updateParams);

  ui.inputs.wetAngleContainer = createDiv('').parent(ui.inputs.wetGroup).style('display:none; text-align:center');
  let wAngle = createDiv('Angolo').parent(ui.inputs.wetAngleContainer).style('font-size:10px;');
  ui.inputs.wetAngleSlider = createSlider(0, 180, 0).parent(ui.inputs.wetAngleContainer).style('width:80px');
  ui.inputs.wetAngleSlider.attribute('title', 'Ruota la punta piatta del pennello');
  ui.inputs.wetAngleSlider.input(updateParams);

  ui.inputs.shapeGroup = createDiv('').parent(ui.container).style('display:none; background:#fff0e0; padding:5px; border-radius:5px; align-items:center; gap:8px;');
  ui.inputs.shapeTrailCheck = createCheckbox('🖊️ Disegna Scia', false).parent(ui.inputs.shapeGroup);
  ui.inputs.shapeTrailCheck.changed(updateParams);
  
  ui.inputs.shapeParams = createDiv('').parent(ui.inputs.shapeGroup).style('display:none; align-items:center; gap:5px');
  
  let sDist = createDiv('Distanza').parent(ui.inputs.shapeParams).style('font-size:10px; text-align:center');
  ui.inputs.shapeSpacingSlider = createSlider(20, 400, 100).parent(sDist).style('width:70px');
  ui.inputs.shapeSpacingSlider.input(updateParams);

  let sAng = createDiv('Angolo').parent(ui.inputs.shapeParams).style('font-size:10px; text-align:center');
  ui.inputs.shapeAngleSlider = createSlider(0, 360, 0).parent(sAng).style('width:70px');
  ui.inputs.shapeAngleSlider.input(updateParams);

  let groupBg = createDiv('').parent(ui.container).style('margin-left:auto; display:flex; gap:5px; align-items:center; border-left:2px solid #ccc; padding-left:10px;');
  let bgPick = createColorPicker(appState.backgroundColor).parent(groupBg).style('width:20px; height:20px; border:none;');
  bgPick.input(() => { appState.backgroundColor = bgPick.value(); });

  ui.inputs.transpCheck = createCheckbox('Traspar.', false).parent(groupBg);
  ui.inputs.transpCheck.changed(updateParams);

  ui.inputs.btnMoveBg = createButton('✋ Sposta').parent(groupBg).mousePressed(toggleBgEditMode);
  
  createButton('🔍+').parent(groupBg).style('padding:0 4px').mousePressed(() => modifyBgScale(0.1));
  createButton('🔍-').parent(groupBg).style('padding:0 4px').mousePressed(() => modifyBgScale(-0.1));

  ui.inputs.btnCropBg = createButton('✂️ Taglia').parent(groupBg).mousePressed(() => toggleCropMode());

  ui.inputs.bgUpload = createFileInput(handleFile).parent(groupBg);
  
  ui.inputs.removeBgBtn = createButton('❌').parent(groupBg).style('display:none;');
  ui.inputs.removeBgBtn.mousePressed(() => {
    bgImage = null; bgDisplay = null;
    ui.inputs.removeBgBtn.style('display', 'none');
    ui.inputs.bgUpload.elt.value = ''; 
    appState.bgTransform = {x:0, y:0, scale:1}; 
  });

  createButton('💾').parent(groupBg).mousePressed(() => saveCanvas('art', 'png'));
  createButton('↩️').parent(groupBg).mousePressed(() => elements.pop());

  let btnClear = createButton('🗑️ PULISCI').parent(groupBg).style('background:#ffebeb; color:red; border:1px solid red; font-weight:bold;');
  btnClear.mousePressed(() => {
    if (confirm("Sei sicuro di voler cancellare TUTTO il disegno?")) {
      elements = [];
    }
  });
}

function handleFile(file) {
  if (file.type === 'image') {
    bgImage = loadImage(file.data, (img) => {
       bgDisplay = img.get(); 
       let s = Math.min(width/bgDisplay.width, height/bgDisplay.height) * 0.8;
       appState.bgTransform.scale = s;
       appState.bgTransform.x = 0;
       appState.bgTransform.y = 0;
    });
    if(ui.inputs.removeBgBtn) ui.inputs.removeBgBtn.style('display', 'inline');
  }
}

function drawCursor() {
  if (mouseY < 140) { cursor(ARROW); return; }
  if(appState.bgCropMode) { cursor(CROSS); return; } 
  if(appState.bgEditMode) { cursor('move'); return; }

  if (appState.tool === 'pipette') cursor('crosshair');
  else if (appState.tool === 'select') cursor('grab');
  else {
    noCursor(); 
    push(); 
    stroke(0); 
    // MOSTRA IL COLORE ATTIVO NEL CURSORE
    let c = color(appState.color);
    c.setAlpha(150);
    fill(c); 
    circle(mouseX, mouseY, appState.size); 
    pop();
  }
}

function windowResized() { resizeCanvas(windowWidth, windowHeight); }