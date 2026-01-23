// WUP 2025-26
// Anna Govetto 
let state = "MENU"; 
let guiWidth = 240;
let brushSize = 40;
let brushSpeed = 0; 
let angle = 0;
let charIndex = 0;
let inputField, spacingSlider, colorPicker, blendSelect, brushModeSelect;
let fontSizeSlider, fontSelect; 
let bgColorPicker; // AGGIUNTO
let menuVisible = true; 
let uiContainer; 

// Variabili per il tratto fluido
let lastX = -1;
let lastY = -1;

let layers = [];
let activeLayer = 0;
let history = []; 
let layerSettings = [
  { visible: true, locked: false, name: "Layer 1", blend: "BLEND" },
  { visible: true, locked: false, name: "Layer 2", blend: "BLEND" },
  { visible: true, locked: false, name: "Layer 3", blend: "BLEND" }
];

function setup() {
  createCanvas(windowWidth, windowHeight);
  document.body.style.overflow = 'hidden';

  let style = createElement('style', `
    #ui-side-panel {
      position: absolute;
      top: 0; left: 0;
      width: ${guiWidth}px;
      height: 100vh;
      overflow-y: auto;
      background: rgba(255, 255, 255, 0.95);
      border-right: 1px solid #ddd;
      padding: 60px 20px 30px 20px;
      box-sizing: border-box;
      z-index: 100;
      font-family: sans-serif;
      transition: left 0.3s ease;
      display: none;
    }
    .control-group { margin-bottom: 15px; }
    .control-label { font-size: 11px; font-weight: bold; margin-bottom: 5px; display: block; color: #333; }
    .layer-item { 
      padding: 10px; margin-bottom: 5px; border-radius: 5px; cursor: pointer;
      background: #f0f0f0; border: 2px solid #ccc; font-size: 11px;
    }
    .layer-item.active { background: #ffe6f0; }
    .layer-locked { border-color: #ff4d4d !important; }
    .layer-unlocked { border-color: #2eb82e !important; }

    #toggle-btn {
      position: absolute;
      top: 20px; left: 20px;
      z-index: 101;
      width: 35px; height: 35px;
      background: #ff007f; color: white;
      border: none; border-radius: 50%;
      cursor: pointer; font-weight: bold;
      display: none;
    }
    select, input, button { width: 100%; cursor: pointer; padding: 5px; box-sizing: border-box; }
    #download-btn { background: #ff007f; color: white; border: none; padding: 10px; border-radius: 5px; font-weight: bold; margin-top: 10px; margin-bottom: 20px; }
    
    .legend-box {
      background: #f9f9f9;
      border: 1px dashed #ff007f;
      padding: 10px;
      margin-top: 20px;
      border-radius: 5px;
    }
    .legend-title { font-size: 10px; font-weight: bold; color: #ff007f; margin-bottom: 5px; text-transform: uppercase; }
    .legend-item { font-size: 9px; color: #444; margin-bottom: 3px; line-height: 1.2; }
  `);

  uiContainer = createDiv('');
  uiContainer.id('ui-side-panel');
  
  let toggleBtn = createButton('→');
  toggleBtn.id('toggle-btn');
  toggleBtn.mousePressed(() => {
    menuVisible = !menuVisible;
    uiContainer.style('left', menuVisible ? '0px' : `-${guiWidth}px`);
    toggleBtn.style('left', menuVisible ? `${guiWidth + 10}px` : '20px');
    toggleBtn.html(menuVisible ? '←' : '→');
  });

  creaInterfaccia();

  for (let i = 0; i < 3; i++) {
    layers[i] = createGraphics(windowWidth, windowHeight);
    layers[i].clear();
  }
}

function creaInterfaccia() {
  uiContainer.child(createElement('h2', 'BRUSH CONTROL').style('font-size', '16px').style('margin-bottom', '15px'));

  let group1 = createDiv('').class('control-group').parent(uiContainer);
  group1.child(createElement('label', 'BRUSH TEXT:').class('control-label'));
  inputField = createInput('HELLO KITTY').parent(group1);

  let groupFont = createDiv('').class('control-group').parent(uiContainer);
  groupFont.child(createElement('label', 'FONT FAMILY:').class('control-label'));
  fontSelect = createSelect().parent(groupFont);
  fontSelect.option('Sans-Serif', 'sans-serif');
  fontSelect.option('Serif', 'serif');
  fontSelect.option('Monospace', 'monospace');
  fontSelect.option('Cursive', 'cursive');
  fontSelect.option('Fantasy', 'fantasy');

  let groupSize = createDiv('').class('control-group').parent(uiContainer);
  groupSize.child(createElement('label', 'FONT SIZE:').class('control-label'));
  fontSizeSlider = createSlider(10, 300, 40).parent(groupSize);
  fontSizeSlider.input(() => { brushSize = fontSizeSlider.value(); });

  let group2 = createDiv('').class('control-group').parent(uiContainer);
  group2.child(createElement('label', 'SPACING:').class('control-label'));
  spacingSlider = createSlider(5, 150, 25).parent(group2);

  let group3 = createDiv('').class('control-group').parent(uiContainer);
  group3.child(createElement('label', 'BRUSH COLOR:').class('control-label'));
  colorPicker = createColorPicker('#ff007f').parent(group3);

  // --- AGGIUNTA SOLO QUI: BACKGROUND COLOR ---
  let groupBG = createDiv('').class('control-group').parent(uiContainer);
  groupBG.child(createElement('label', 'BACKGROUND COLOR:').class('control-label'));
  bgColorPicker = createColorPicker('#ffe6f8').parent(groupBG); 
  // -------------------------------------------

  let group4 = createDiv('').class('control-group').parent(uiContainer);
  group4.child(createElement('label', 'LAYER BLEND MODE:').class('control-label'));
  blendSelect = createSelect().parent(group4);
  blendSelect.option('PAINT (Normal)', 'BLEND');
  blendSelect.option('WATERCOLOR (Multiply)', 'MULTIPLY');
  blendSelect.option('GLOW (Screen)', 'SCREEN');
  blendSelect.option('X-RAY (Difference)', 'DIFFERENCE');
  blendSelect.changed(() => { layerSettings[activeLayer].blend = blendSelect.value(); });

  let group5 = createDiv('').class('control-group').parent(uiContainer);
  group5.child(createElement('label', 'BRUSH STYLE:').class('control-label'));
  brushModeSelect = createSelect().parent(group5);
  brushModeSelect.option('SOLID (Default)', 'FILL');
  brushModeSelect.option('SHADOW', 'SHADOW');
  brushModeSelect.option('OUTLINE', 'OUTLINE');
  brushModeSelect.option('ERASER', 'ERASER');

  uiContainer.child(createElement('label', 'SELECT LAYER:').class('control-label'));
  for (let i = 0; i < layerSettings.length; i++) {
    let item = createDiv('').class('layer-item').parent(uiContainer);
    item.id('layer-btn-' + i);
    item.mousePressed(() => { activeLayer = i; aggiornaStileLayer(); });
  }
  aggiornaStileLayer();

  let downBtn = createButton('💾 DOWNLOAD PNG').id('download-btn').parent(uiContainer);
  downBtn.mousePressed(downloadCanvas);

  let legend = createDiv('').class('legend-box').parent(uiContainer);
  legend.child(createDiv('Shortcuts').class('legend-title'));
  legend.child(createDiv('<b>1, 2, 3:</b> Quick Size').class('legend-item'));
  legend.child(createDiv('<b>4:</b> Toggle Rotation').class('legend-item'));
  legend.child(createDiv('<b>Z:</b> Undo').class('legend-item'));
  legend.child(createDiv('<b>V:</b> Toggle Visibility').class('legend-item'));
  legend.child(createDiv('<b>L:</b> Toggle Lock').class('legend-item'));
  legend.child(createDiv('<b>C:</b> Clear Active Layer').class('legend-item'));
}

function aggiornaStileLayer() {
  for (let i = 0; i < layerSettings.length; i++) {
    let el = select('#layer-btn-' + i);
    let statusTxt = layerSettings[i].locked ? "LOCKED" : "UNLOCKED";
    let visTxt = layerSettings[i].visible ? "VISIBLE" : "HIDDEN";
    el.html(`<b>${layerSettings[i].name}</b><br><span style="font-size:8px">${visTxt} | ${statusTxt}</span>`);
    if (activeLayer === i) el.addClass('active'); else el.removeClass('active');
    if (layerSettings[i].locked) { el.addClass('layer-locked'); el.removeClass('layer-unlocked'); } 
    else { el.addClass('layer-unlocked'); el.removeClass('layer-locked'); }
  }
}

function draw() {
  if (state === "MENU") {
    background(255, 200, 220); 
    uiContainer.hide();
    select('#toggle-btn').hide();
    rectMode(CENTER); fill(255, 0, 127); rect(width/2, height/2, 220, 70, 15);
    fill(255); textAlign(CENTER, CENTER); textSize(28); text("START", width/2, height/2);
    fill(0); textSize(30); text("🎀 PRO BRUSH BASE 🎀", width/2, height/2 - 100);
  } else {
    // CAMBIATO SOLO QUI PER LO SFONDO
    background(bgColorPicker.color()); 
    
    if (menuVisible) uiContainer.show();
    select('#toggle-btn').show();

    for (let i = 0; i < layers.length; i++) {
      if (layerSettings[i].visible) {
        push();
        if (layerSettings[i].blend === "MULTIPLY") blendMode(MULTIPLY);
        else if (layerSettings[i].blend === "SCREEN") blendMode(SCREEN);
        else if (layerSettings[i].blend === "DIFFERENCE") blendMode(DIFFERENCE);
        image(layers[i], 0, 0);
        pop();
      }
    }

    if (mouseIsPressed && (!menuVisible || mouseX > guiWidth)) {
      if (!layerSettings[activeLayer].locked && layerSettings[activeLayer].visible) {
        if (lastX === -1) {
          drawLetter(layers[activeLayer], mouseX, mouseY);
          lastX = mouseX;
          lastY = mouseY;
        }
        let spacing = spacingSlider.value();
        let d = dist(mouseX, mouseY, lastX, lastY);
        if (d >= spacing) {
          let steps = floor(d / spacing);
          for (let i = 1; i <= steps; i++) {
            let lerpX = lerp(lastX, mouseX, i / steps);
            let lerpY = lerp(lastY, mouseY, i / steps);
            drawLetter(layers[activeLayer], lerpX, lerpY);
          }
          lastX = mouseX;
          lastY = mouseY;
        }
      }
    } else {
      lastX = -1;
      lastY = -1;
    }
  }
}

function drawLetter(pg, x, y) {
  let txt = inputField.value() + " ";
  let mode = brushModeSelect.value();
  pg.push();
  pg.translate(x, y);
  if (brushSpeed > 0) angle += brushSpeed;
  pg.rotate(angle);
  pg.textFont(fontSelect.value());
  pg.textSize(brushSize); 
  pg.textAlign(CENTER, CENTER);
  let char = txt.charAt(charIndex);
  if (mode === 'ERASER') { pg.erase(); pg.text(char, 0, 0); pg.noErase(); } 
  else if (mode === 'OUTLINE') { pg.noFill(); pg.stroke(colorPicker.color()); pg.strokeWeight(2); pg.text(char, 0, 0); } 
  else if (mode === 'SHADOW') { pg.noStroke(); pg.fill(0, 80); pg.text(char, brushSize*0.05, brushSize*0.05); pg.fill(colorPicker.color()); pg.text(char, 0, 0); } 
  else { pg.noStroke(); pg.fill(colorPicker.color()); pg.text(char, 0, 0); }
  charIndex = (charIndex + 1) % txt.length;
  pg.pop();
}

function mousePressed() {
  if (state === "MENU") {
    if (dist(mouseX, mouseY, width/2, height/2) < 110) {
      state = "APP";
      select('#toggle-btn').style('left', menuVisible ? `${guiWidth + 10}px` : '20px');
      select('#toggle-btn').html(menuVisible ? '←' : '→');
    }
  } else if (state === "APP" && (!menuVisible || mouseX > guiWidth)) {
    saveToHistory();
  }
}

function downloadCanvas() {
  let exportImage = createGraphics(width, height);
  exportImage.background(bgColorPicker.color()); 
  for (let i = 0; i < layers.length; i++) {
    if (layerSettings[i].visible) {
      exportImage.push();
      if (layerSettings[i].blend === "MULTIPLY") exportImage.blendMode(MULTIPLY);
      else if (layerSettings[i].blend === "SCREEN") exportImage.blendMode(SCREEN);
      else if (layerSettings[i].blend === "DIFFERENCE") exportImage.blendMode(DIFFERENCE);
      exportImage.image(layers[i], 0, 0);
      exportImage.pop();
    }
  }
  save(exportImage, "artwork.png");
}

function saveToHistory() {
  let snapshot = createGraphics(width, height);
  snapshot.image(layers[activeLayer], 0, 0);
  history.push({layerIdx: activeLayer, data: snapshot});
  if (history.length > 20) history.shift();
}

function undo() {
  if (history.length > 0) {
    let last = history.pop();
    layers[last.layerIdx].clear();
    layers[last.layerIdx].image(last.data, 0, 0);
  }
}

function keyPressed() {
  if (document.activeElement === inputField.elt) return;
  if (key === '1') { brushSize = 20; fontSizeSlider.value(20); }
  if (key === '2') { brushSize = 50; fontSizeSlider.value(50); }
  if (key === '3') { brushSize = 100; fontSizeSlider.value(100); }
  if (key === '4') brushSpeed = (brushSpeed === 0) ? 0.3 : 0;
  if (key === 'z' || key === 'Z') undo();
  if (key === 'v' || key === 'V') { layerSettings[activeLayer].visible = !layerSettings[activeLayer].visible; aggiornaStileLayer(); }
  if (key === 'l' || key === 'L') { layerSettings[activeLayer].locked = !layerSettings[activeLayer].locked; aggiornaStileLayer(); }
  if (key === 'c' || key === 'C') layers[activeLayer].clear();
}