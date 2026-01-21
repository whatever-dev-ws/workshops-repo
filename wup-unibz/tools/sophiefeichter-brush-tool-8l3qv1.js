let penColor = '#000000';
let bgColor = '#ffffff';
let penSize = 15;
let eraserSize = 30; 
let brushType = 'NORMAL';
let selectedFont = 'Arial';
let customText = 'Art';
let textMode = false;
let eraserActive = false;

// Animation Variablen & Timer
let activeEffect = 'NONE'; 
let effectTimer = 0;
let magicDuration = 3; // Standard: 3 Sekunden

let drawingLayer; 
let currentMenuWidth = 280; 
let canvasFormat = 'SCREEN'; 

let undoStack = [];
let startX, startY;

function setup() {
  createCanvas(windowWidth, windowHeight);
  createUI();
  updateCanvasSize();
}

function draw() {
  background(40); 
  
  let menu = document.getElementById('main-menu');
  if (menu) currentMenuWidth = menu.offsetWidth;

  let cx = currentMenuWidth + (windowWidth - currentMenuWidth - drawingLayer.width) / 2;
  let cy = (windowHeight - drawingLayer.height) / 2;
  
  push();
  fill(bgColor);
  noStroke();
  rect(cx, cy, drawingLayer.width, drawingLayer.height);
  pop();

  applyLivingEffects();

  if (mouseIsPressed) {
    let mx = mouseX - cx;
    let my = mouseY - cy;
    let pmx = pmouseX - cx;
    let pmy = pmouseY - cy;
    
    if (mx >= 0 && mx <= drawingLayer.width && my >= 0 && my <= drawingLayer.height) {
      handleDrawing(mx, my, pmx, pmy);
    }
  }
  
  image(drawingLayer, cx, cy);

  if (mouseIsPressed && !eraserActive && !textMode && ['RECTANGLE', 'CIRCLE', 'LINE'].includes(brushType)) {
    drawShapePreview(cx, cy);
  }

  if (mouseX > cx && mouseX < cx + drawingLayer.width && mouseY > cy && mouseY < cy + drawingLayer.height) {
    drawBrushPreview();
  }
}

function applyLivingEffects() {
  if (activeEffect === 'NONE') return;

  effectTimer++;
  // Umrechnung von Sekunden in Frames (ca. 60fps)
  if (effectTimer > magicDuration * 60) {
    activeEffect = 'NONE';
    effectTimer = 0;
    let sel = document.querySelector('select[data-type="effect"]');
    if (sel) sel.value = 'NONE';
    return;
  }

  drawingLayer.push();
  
  if (activeEffect === 'VIBRATE') {
    drawingLayer.tint(255, 200);
    for(let i = 0; i < 2; i++) {
        drawingLayer.image(drawingLayer, random(-2, 2), random(-2, 2));
    }
  } 
  else if (activeEffect === 'PULSE') {
    drawingLayer.blendMode(SOFT_LIGHT);
    drawingLayer.tint(random(200, 255), random(200, 255), random(200, 255), 30);
    let s = 1.002;
    drawingLayer.translate(drawingLayer.width/2, drawingLayer.height/2);
    drawingLayer.scale(s);
    drawingLayer.image(drawingLayer, -drawingLayer.width/2, -drawingLayer.height/2);
    drawingLayer.blendMode(BLEND);
  } 
  else if (activeEffect === 'MELT') {
    drawingLayer.tint(255, 252); 
    drawingLayer.image(drawingLayer, 0, 1.5);
  }
  else if (activeEffect === 'GLITCH') {
    let y = floor(random(drawingLayer.height));
    let h = floor(random(10, 50));
    let xOffset = random(-20, 20);
    drawingLayer.image(drawingLayer, xOffset, y, drawingLayer.width, h, 0, y, drawingLayer.width, h);
  }
  else if (activeEffect === 'SHATTER') {
    let tw = floor(random(20, 100));
    let th = floor(random(20, 100));
    let tx = floor(random(drawingLayer.width - tw));
    let ty = floor(random(drawingLayer.height - th));
    let destX = tx + random(-15, 15);
    let destY = ty + random(-15, 15);
    drawingLayer.image(drawingLayer, destX, destY, tw, th, tx, ty, tw, th);
  }
  else if (activeEffect === 'SWIRL') {
    drawingLayer.tint(255, 245);
    drawingLayer.translate(drawingLayer.width/2, drawingLayer.height/2);
    drawingLayer.rotate(0.005);
    drawingLayer.image(drawingLayer, -drawingLayer.width/2, -drawingLayer.height/2);
  }
  else if (activeEffect === 'SNOW') {
    drawingLayer.blendMode(SCREEN);
    for(let i = 0; i < 150; i++) {
      drawingLayer.stroke(random(255), random(200));
      drawingLayer.strokeWeight(random(1, 3));
      drawingLayer.point(random(drawingLayer.width), random(drawingLayer.height));
    }
    drawingLayer.blendMode(BLEND);
  }
  
  drawingLayer.pop();
}

function handleDrawing(mx, my, pmx, pmy) {
  drawingLayer.push();
  if (eraserActive) {
    drawingLayer.erase(); 
    drawingLayer.strokeWeight(eraserSize);
    drawingLayer.line(pmx, pmy, mx, my);
    drawingLayer.noErase(); 
  } else if (textMode) {
    drawingLayer.fill(penColor);
    drawingLayer.noStroke();
    drawingLayer.textFont(selectedFont);
    drawingLayer.textSize(penSize * 2);
    drawingLayer.text(customText, mx, my);
  } else if (!['RECTANGLE', 'CIRCLE', 'LINE'].includes(brushType)) {
    drawingLayer.stroke(penColor);
    drawingLayer.fill(penColor);
    drawingLayer.strokeWeight(penSize);
    
    if (brushType === 'NORMAL') drawingLayer.line(pmx, pmy, mx, my);
    else if (brushType === 'SPRAY') {
      for (let i = 0; i < 20; i++) {
        drawingLayer.strokeWeight(1);
        drawingLayer.point(mx + random(-penSize, penSize), my + random(-penSize, penSize));
      }
    }
    else if (brushType === 'CALLIGRAPHY') {
      drawingLayer.strokeWeight(penSize / 4);
      for (let i = 0; i < 10; i++) drawingLayer.line(pmx + i, pmy - i, mx + i, my - i);
    }
    else if (brushType === 'SQUARE') {
      drawingLayer.noStroke();
      drawingLayer.rectMode(CENTER);
      drawingLayer.rect(mx, my, penSize, penSize);
    }
    else if (brushType === 'NEON') {
      drawingLayer.strokeWeight(penSize);
      drawingLayer.stroke(red(color(penColor)), green(color(penColor)), blue(color(penColor)), 50);
      drawingLayer.line(pmx, pmy, mx, my);
      drawingLayer.strokeWeight(penSize/2);
      drawingLayer.stroke(255, 255, 255, 150);
      drawingLayer.line(pmx, pmy, mx, my);
    }
    else if (brushType === 'RAINBOW') {
      drawingLayer.colorMode(HSB);
      drawingLayer.stroke(frameCount % 360, 80, 90);
      drawingLayer.line(pmx, pmy, mx, my);
      drawingLayer.colorMode(RGB);
    }
    else if (brushType === 'MIRROR') {
      drawingLayer.line(pmx, pmy, mx, my);
      drawingLayer.line(drawingLayer.width - pmx, pmy, drawingLayer.width - mx, my);
    }
  }
  drawingLayer.pop();
}

function createUI() {
  let menu = createDiv().id('main-menu');
  menu.style('position', 'fixed'); menu.style('left', '0'); menu.style('top', '0'); 
  menu.style('height', '100%'); menu.style('width', '280px');
  menu.style('background', '#1a1a1a'); menu.style('display', 'flex');
  menu.style('flex-direction', 'column'); menu.style('padding', '25px'); 
  menu.style('color', '#fff'); menu.style('z-index', '1000');
  menu.style('font-family', 'sans-serif'); menu.style('overflow-y', 'auto');
  menu.style('box-shadow', '5px 0 15px rgba(0,0,0,0.5)');

  const createSection = (title) => {
    let s = createDiv().parent(menu).style('margin-bottom', '25px').style('padding-bottom', '15px').style('border-bottom', '1px solid #333');
    createDiv(title).parent(s).style('font-weight', 'bold').style('margin-bottom', '12px').style('color', '#aaa').style('text-transform', 'uppercase').style('font-size', '12px');
    return s;
  };

  // FORMAT
  let fS = createSection('Canvas Format');
  let fSel = createSelect().parent(fS).style('width', '100%').style('padding', '5px');
  ['SCREEN', 'SQUARE', 'PORTRAIT', 'LANDSCAPE'].forEach(o => fSel.option(o));
  fSel.changed(() => { canvasFormat = fSel.value(); updateCanvasSize(); });

  // BRUSH & COLORS
  let bS = createSection('Brush & Colors');
  let cRow = createDiv().parent(bS).style('display','flex').style('justify-content','space-between').style('margin-bottom','15px');
  
  let pColDiv = createDiv().parent(cRow).style('text-align','center');
  createDiv('Pen').parent(pColDiv).style('font-size','10px').style('margin-bottom','3px');
  createColorPicker(penColor).parent(pColDiv).input(e => { penColor = e.target.value; eraserActive = false; });
  
  let bgColDiv = createDiv().parent(cRow).style('text-align','center');
  createDiv('BG').parent(bgColDiv).style('font-size','10px').style('margin-bottom','3px');
  createColorPicker(bgColor).parent(bgColDiv).input(e => bgColor = e.target.value);

  createDiv('Brush Type').parent(bS).style('font-size','11px').style('margin-bottom','5px');
  let bSel = createSelect().parent(bS).style('width', '100%').style('padding', '5px').style('margin-bottom','10px');
  ['NORMAL', 'SPRAY', 'CALLIGRAPHY', 'SQUARE', 'NEON', 'RAINBOW', 'MIRROR', 'RECTANGLE', 'CIRCLE', 'LINE'].forEach(opt => bSel.option(opt));
  bSel.changed(() => { brushType = bSel.value(); eraserActive = false; textMode = false; });
  
  createDiv('Size').parent(bS).style('font-size','11px').style('margin-bottom','5px');
  createSlider(1, 150, penSize).parent(bS).style('width', '100%').input(e => penSize = e.target.value);

  // ERASER
  let eS = createSection('Eraser');
  let eBtn = createButton('Toggle Eraser').parent(eS).style('width','100%').style('margin-bottom','10px').style('padding','8px');
  eBtn.mousePressed(() => { eraserActive = !eraserActive; eBtn.style('background', eraserActive ? '#007bff' : '#444'); });
  createSlider(1, 200, eraserSize).parent(eS).style('width', '100%').input(e => eraserSize = e.target.value);

  // EFFECTS
  let animS = createSection('Magic Effects');
  let animSel = createSelect().parent(animS).style('width', '100%').style('padding', '5px').style('margin-bottom','10px');
  animSel.elt.setAttribute('data-type', 'effect'); 
  ['NONE', 'VIBRATE', 'PULSE', 'MELT', 'GLITCH', 'SHATTER', 'SWIRL', 'SNOW'].forEach(opt => animSel.option(opt));
  animSel.changed(() => { activeEffect = animSel.value(); effectTimer = 0; });

  // NEU: Dauer-Regler
  createDiv('Duration (sec)').parent(animS).style('font-size','11px').style('margin-bottom','5px');
  let durSlider = createSlider(1, 20, magicDuration).parent(animS).style('width', '100%');
  let durLabel = createDiv(magicDuration + 's').parent(animS).style('font-size','10px').style('text-align','right');
  durSlider.input(() => { 
    magicDuration = durSlider.value(); 
    durLabel.html(magicDuration + 's');
  });

  // TEXT
  let tS = createSection('Typography');
  let tBtn = createButton('Toggle Text Mode').parent(tS).style('width','100%').style('margin-bottom','10px');
  tBtn.mousePressed(() => { textMode = !textMode; eraserActive = false; tBtn.style('background', textMode ? '#007bff' : '#444'); });
  let fontSel = createSelect().parent(tS).style('width', '100%').style('margin-bottom','10px');
  ['Arial', 'Brush Script MT', 'Comic Sans MS', 'Impact', 'Georgia'].forEach(f => fontSel.option(f));
  fontSel.changed(() => selectedFont = fontSel.value());
  createInput(customText).parent(tS).style('width','100%').style('padding','5px').input(e => customText = e.target.value);

  // ACTIONS
  let aS = createSection('Actions');
  let btnStyle = "width: 100%; margin-bottom: 8px; padding: 10px; cursor: pointer;";
  createButton('Undo').parent(aS).elt.style = btnStyle;
  document.querySelectorAll('button').forEach(b => { if(b.innerText === 'Undo') b.onclick = undo; });
  
  let sBtn = createButton('Save Image').parent(aS);
  sBtn.elt.style = btnStyle;
  sBtn.mousePressed(() => {
    let out = createGraphics(drawingLayer.width, drawingLayer.height);
    out.pixelDensity(displayDensity()); 
    out.background(bgColor);
    out.image(drawingLayer, 0, 0);
    save(out, 'Art_HQ.png');
  });
  
  let cBtn = createButton('Clear Canvas').parent(aS);
  cBtn.elt.style = btnStyle;
  cBtn.mousePressed(() => { drawingLayer.clear(); saveState(); });
  
  let surBtn = createButton('Surprise Me!').parent(aS);
  surBtn.elt.style = btnStyle + "background: #28a745; border: none; font-weight: bold; color: white;";
  surBtn.mousePressed(surpriseMe);
}

function surpriseMe() {
  saveState();
  let brushOptions = ['NORMAL', 'SPRAY', 'CALLIGRAPHY', 'SQUARE', 'NEON', 'RAINBOW', 'MIRROR', 'RECTANGLE', 'CIRCLE', 'LINE'];
  let randomBrush = random(brushOptions);
  let randomPenColor = color(random(255), random(255), random(255));
  let randomPenSize = random(5, 50);

  penColor = randomPenColor.toString('#rrggbb'); 
  document.querySelector('input[type="color"]').value = penColor;
  penSize = randomPenSize;
  document.querySelector('input[type="range"]').value = penSize;
  brushType = randomBrush;
  let selectors = document.querySelectorAll('select');
  if (selectors[1]) selectors[1].value = brushType;

  drawingLayer.push();
  drawingLayer.stroke(randomPenColor);
  drawingLayer.fill(randomPenColor);
  drawingLayer.strokeWeight(randomPenSize);
  
  let x1 = random(drawingLayer.width);
  let y1 = random(drawingLayer.height);
  let x2 = random(drawingLayer.width);
  let y2 = random(drawingLayer.height);

  if (brushType === 'RECTANGLE') {
    drawingLayer.rectMode(CORNER);
    drawingLayer.rect(min(x1, x2), min(y1, y2), abs(x2 - x1), abs(y2 - y1));
  } else if (brushType === 'CIRCLE') {
    let d = dist(x1, y1, x2, y2);
    drawingLayer.ellipse(x1, y1, d, d);
  } else {
    drawingLayer.line(x1, y1, x2, y2);
  }
  drawingLayer.pop();
  saveState();
}

function saveState() {
  undoStack.push(drawingLayer.get());
  if (undoStack.length > 20) undoStack.shift();
}

function undo() {
  if (undoStack.length > 1) {
    undoStack.pop();
    let previousState = undoStack[undoStack.length - 1];
    drawingLayer.clear();
    drawingLayer.image(previousState, 0, 0);
  }
}

function mousePressed() {
  let cx = currentMenuWidth + (windowWidth - currentMenuWidth - drawingLayer.width) / 2;
  let cy = (windowHeight - drawingLayer.height) / 2;
  startX = mouseX - cx;
  startY = mouseY - cy;
}

function mouseReleased() {
  let cx = currentMenuWidth + (windowWidth - currentMenuWidth - drawingLayer.width) / 2;
  let cy = (windowHeight - drawingLayer.height) / 2;
  let mx = mouseX - cx;
  let my = mouseY - cy;

  if (mouseX > currentMenuWidth && ['RECTANGLE', 'CIRCLE', 'LINE'].includes(brushType) && !eraserActive && !textMode) {
    drawingLayer.push();
    drawingLayer.stroke(penColor);
    drawingLayer.strokeWeight(penSize);
    drawingLayer.noFill();
    if (brushType === 'RECTANGLE') drawingLayer.rect(startX, startY, mx - startX, my - startY);
    if (brushType === 'CIRCLE') {
      let d = dist(startX, startY, mx, my) * 2;
      drawingLayer.ellipse(startX, startY, d);
    }
    if (brushType === 'LINE') drawingLayer.line(startX, startY, mx, my);
    drawingLayer.pop();
  }
  if (mouseX > currentMenuWidth) saveState();
}

function drawShapePreview(cx, cy) {
  push();
  stroke(penColor);
  strokeWeight(penSize);
  noFill();
  if (brushType === 'RECTANGLE') rect(startX + cx, startY + cy, mouseX - (startX + cx), mouseY - (startY + cy));
  if (brushType === 'CIRCLE') {
    let d = dist(startX + cx, startY + cy, mouseX, mouseY) * 2;
    ellipse(startX + cx, startY + cy, d);
  }
  if (brushType === 'LINE') line(startX + cx, startY + cy, mouseX, mouseY);
  pop();
}

function updateCanvasSize() {
  let w, h;
  let availableH = windowHeight - 60;
  let availableW = windowWidth - currentMenuWidth - 60;
  
  if (canvasFormat === 'SQUARE') {
    let s = min(availableW, availableH);
    w = s; h = s;
  } else if (canvasFormat === 'PORTRAIT') {
    h = availableH; w = h * (9/16);
    if (w > availableW) { w = availableW; h = w * (16/9); }
  } else if (canvasFormat === 'LANDSCAPE') {
    w = availableW; h = w * (9/16);
    if (h > availableH) { h = availableH; w = h / (9/16); }
  } else {
    w = availableW; h = availableH;
  }
  drawingLayer = createGraphics(w, h);
  drawingLayer.clear();
  undoStack = [];
  saveState();
}

function drawBrushPreview() {
  push();
  noFill();
  stroke(eraserActive ? 'rgba(255,0,0,0.5)' : 'rgba(100,100,100,0.5)');
  strokeWeight(1);
  let currentSize = eraserActive ? eraserSize : penSize;
  ellipse(mouseX, mouseY, currentSize, currentSize);
  pop();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  updateCanvasSize();
}

