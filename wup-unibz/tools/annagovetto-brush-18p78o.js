// WUP 2025-26
// Anna Govetto
let state = "MENU"; 
let guiWidth = 240;
let brushSize = 40;
let brushSpeed = 0; 
let angle = 0;
let charIndex = 0; 
let inputField, spacingSlider, colorPicker, blendSelect, brushModeSelect;
let fontSizeSlider, fontSelect, bgColorPicker; 
let menuVisible = true; 
let uiContainer; 

let lastX = -1;
let lastY = -1;
let isDrawing = false; 
let moveMode = false;
let selection = null;
let customFont = null; // Variabile per il font caricato

let layers = [];
let activeLayer = 0;
let history = []; 
let layerSettings = [
  { visible: true, locked: false, name: "Layer 1", blend: "BLEND", color: "#ff007f" },
  { visible: true, locked: false, name: "Layer 2", blend: "BLEND", color: "#00ffcc" },
  { visible: true, locked: false, name: "Layer 3", blend: "BLEND", color: "#ffff00" }
];

function setup() {
  createCanvas(windowWidth, windowHeight);
  document.body.style.overflow = 'hidden';

  let style = createElement('style', `
    #ui-side-panel {
      position: absolute; top: 0; left: 0; width: ${guiWidth}px; height: 100vh;
      overflow-y: auto; background: rgba(255,255,255,0.98); border-right: 1px solid #ddd;
      padding: 60px 20px 30px 20px; box-sizing: border-box; z-index: 1000;
      font-family: sans-serif; transition: left 0.3s ease; display: none;
    }
    .control-group { margin-bottom: 15px; }
    .control-label { font-size: 11px; font-weight: bold; margin-bottom: 5px; display: block; color: #333; }
    .layer-item { padding: 8px; margin-bottom: 5px; border-radius: 5px; cursor: pointer; background: #f0f0f0; border: 2px solid #ccc; font-size: 11px; }
    .layer-item.active { background: #ffe6f0; border-color: #ff007f; }
    #toggle-btn { position: absolute; top: 20px; left: 20px; z-index: 1001; width: 35px; height: 35px; background: #ff007f; color: white; border: none; border-radius: 50%; cursor: pointer; display: none; font-weight: bold; }
    select, input, button { width: 100%; cursor: pointer; padding: 5px; box-sizing: border-box; }
    #download-btn { background: #ff007f; color: white; border: none; padding: 10px; border-radius: 5px; font-weight: bold; margin-top: 10px; }
    #font-upload-label { background: #444; color: white; padding: 8px; border-radius: 5px; font-size: 10px; text-align: center; display: block; cursor: pointer; margin-top: 5px; }
    .legend-box { background: #f4f4f4; padding: 12px; margin-top: 20px; border-radius: 8px; border: 1px solid #ddd; }
    .legend-title { font-size: 10px; font-weight: bold; color: #ff007f; margin-bottom: 8px; text-transform: uppercase; }
    .legend-item { font-size: 10px; color: #444; margin-bottom: 5px; line-height: 1.3; }
  `);

  uiContainer = createDiv('').id('ui-side-panel');
  let toggleBtn = createButton('→').id('toggle-btn');
  toggleBtn.mousePressed((e) => {
    e.stopPropagation();
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
  uiContainer.child(createElement('h2', 'BRUSH CONTROL').style('font-size', '16px').style('margin-top','0'));
  
  let moveBtn = createButton('MANUAL MOVE (OFF)').parent(createDiv('').class('control-group').parent(uiContainer));
  moveBtn.id('move-mode-btn').mousePressed((e) => {
    e.stopPropagation();
    moveMode = !moveMode;
    moveBtn.html(moveMode ? 'MANUAL MOVE (ON)' : 'MANUAL MOVE (OFF)');
    moveBtn.style('background', moveMode ? '#444' : '#ff007f');
    moveBtn.style('color', 'white');
  });

  let g1 = createDiv('').class('control-group').parent(uiContainer);
  g1.child(createElement('label', 'BRUSH TEXT:').class('control-label'));
  inputField = createInput('HELLO KITTY').parent(g1);

  // FONT SELECTION & IMPORT
  let gF = createDiv('').class('control-group').parent(uiContainer);
  gF.child(createElement('label', 'FONT FAMILY:').class('control-label'));
  fontSelect = createSelect().parent(gF);
  fontSelect.option('Sans-Serif', 'sans-serif');
  fontSelect.option('Serif', 'serif');
  fontSelect.option('Monospace', 'monospace');
  fontSelect.option('Cursive', 'cursive');
  fontSelect.option('Fantasy', 'fantasy');
  
  let fontUpload = createFileInput(handleFontUpload).parent(gF);
  fontUpload.id('font-uploader').style('display', 'none');
  let uploadLabel = createElement('label', '☁ IMPORT FONT (.ttf/.otf)').parent(gF);
  uploadLabel.id('font-upload-label').attribute('for', 'font-uploader');

  let gS = createDiv('').class('control-group').parent(uiContainer);
  gS.child(createElement('label', 'FONT SIZE:').class('control-label'));
  fontSizeSlider = createSlider(10, 300, 40).parent(gS);
  fontSizeSlider.input(() => { brushSize = fontSizeSlider.value(); });

  let gC = createDiv('').class('control-group').parent(uiContainer);
  gC.child(createElement('label', 'BRUSH COLOR:').class('control-label'));
  colorPicker = createColorPicker('#ff007f').parent(gC);
  colorPicker.input(() => { layerSettings[activeLayer].color = colorPicker.value(); });

  let gM = createDiv('').class('control-group').parent(uiContainer);
  gM.child(createElement('label', 'EFFECT MODE:').class('control-label'));
  blendSelect = createSelect().parent(gM);
  blendSelect.option('PAINT', 'BLEND');
  blendSelect.option('ELECTRIC GLOW', 'ADD'); 
  blendSelect.option('X-RAY', 'DIFFERENCE');
  blendSelect.changed(() => { layerSettings[activeLayer].blend = blendSelect.value(); });

  let gSt = createDiv('').class('control-group').parent(uiContainer);
  gSt.child(createElement('label', 'BRUSH STYLE:').class('control-label'));
  brushModeSelect = createSelect().parent(gSt);
  brushModeSelect.option('SOLID', 'FILL');
  brushModeSelect.option('SHADOW', 'SHADOW');
  brushModeSelect.option('OUTLINE', 'OUTLINE');
  brushModeSelect.option('ERASER', 'ERASER');

  uiContainer.child(createElement('label', 'LAYERS:').class('control-label'));
  for (let i = 0; i < 3; i++) {
    let item = createDiv('').class('layer-item').parent(uiContainer);
    item.id('layer-btn-' + i).mousePressed(() => { activeLayer = i; aggiornaStileLayer(); });
  }
  aggiornaStileLayer();

  createButton('💾 DOWNLOAD PNG').id('download-btn').parent(uiContainer).mousePressed(downloadCanvas);

  let legend = createDiv('').class('legend-box').parent(uiContainer);
  legend.child(createDiv('Guide & Shortcuts').class('legend-title'));
  legend.child(createDiv('<b>1, 2, 3:</b> Size | <b>4:</b> Rotate').class('legend-item'));
  legend.child(createDiv('<b>Z:</b> Undo | <b>C:</b> Clear Layer').class('legend-item'));
  legend.child(createDiv('<b>M:</b> Manual Move').class('legend-item'));
}

function handleFontUpload(file) {
  if (file.type === 'font' || file.name.endsWith('.ttf') || file.name.endsWith('.otf')) {
    customFont = loadFont(file.data, () => {
      console.log("Font Loaded!");
      fontSelect.option('Imported Font', 'custom');
      fontSelect.value('custom');
    });
  } else {
    alert("Please upload a valid font file (.ttf or .otf)");
  }
}

function draw() {
  if (state === "MENU") {
    background(255, 200, 220); 
    uiContainer.hide(); select('#toggle-btn').hide();
    rectMode(CENTER); fill(255, 0, 127); noStroke();
    rect(width/2, height/2, 220, 70, 15);
    fill(255); textAlign(CENTER, CENTER); textSize(28); text("START", width/2, height/2);
    if (mouseIsPressed && dist(mouseX, mouseY, width/2, height/2) < 110) state = "APP";
  } else {
    background(bgColorPicker ? bgColorPicker.color() : '#ffe6f8');
    if (menuVisible) uiContainer.show();
    select('#toggle-btn').show();

    applyLayers(this);

    if (moveMode && selection) image(selection.img, mouseX - selection.offX, mouseY - selection.offY);

    if (isDrawing && !moveMode) {
      if (!layerSettings[activeLayer].locked && layerSettings[activeLayer].visible) {
        if (lastX === -1) {
          charIndex = 0;
          drawLetter(layers[activeLayer], mouseX, mouseY);
          lastX = mouseX; lastY = mouseY;
        } else {
          let spacing = 25; 
          let d = dist(mouseX, mouseY, lastX, lastY);
          if (d >= spacing) {
            let steps = floor(d / spacing);
            for (let i = 1; i <= steps; i++) {
              drawLetter(layers[activeLayer], lerp(lastX, mouseX, i/steps), lerp(lastY, mouseY, i/steps));
            }
            lastX = mouseX; lastY = mouseY;
          }
        }
      }
    }
  }
}

function applyLayers(target) {
  for (let i = 0; i < layers.length; i++) {
    if (layerSettings[i].visible) {
      target.push();
      let mode = layerSettings[i].blend;
      if (mode === "ADD") {
        target.drawingContext.shadowBlur = brushSize * 0.6;
        target.drawingContext.shadowColor = layerSettings[i].color;
        target.blendMode(ADD);
      } else if (mode === "DIFFERENCE") {
        target.blendMode(DIFFERENCE);
      }
      if (mode !== "ADD" && mode !== "DIFFERENCE") target.tint(layerSettings[i].color);
      target.image(layers[i], 0, 0);
      target.pop();
    }
  }
}

function drawLetter(pg, x, y) {
  let txt = inputField.value();
  let bStyle = brushModeSelect.value();
  let selectedFont = fontSelect.value();
  
  pg.push();
  if (bStyle === 'ERASER') {
    pg.noStroke(); pg.fill(0); pg.erase(); pg.circle(x, y, brushSize); pg.noErase();
  } else {
    if (txt.length === 0) { pg.pop(); return; }
    pg.translate(x, y);
    if (brushSpeed > 0) angle += brushSpeed;
    pg.rotate(angle);
    
    // Gestione Font
    if (selectedFont === 'custom' && customFont) {
      pg.textFont(customFont);
    } else {
      pg.textFont(selectedFont);
    }
    
    pg.textSize(brushSize); pg.textAlign(CENTER, CENTER);
    let char = txt.charAt(charIndex % txt.length);
    pg.noStroke(); pg.fill(255);
    if (bStyle === 'SHADOW') { pg.fill(0, 150); pg.text(char, brushSize*0.06, brushSize*0.06); pg.fill(255); }
    if (bStyle === 'OUTLINE') { pg.noFill(); pg.stroke(255); pg.strokeWeight(brushSize*0.07); }
    pg.text(char, 0, 0);
    charIndex++; 
  }
  pg.pop();
}

function mousePressed() {
  if (state === "MENU") return;
  if (menuVisible && mouseX < guiWidth) return;
  if (mouseX > 20 && mouseX < 60 && mouseY > 20 && mouseY < 60) return;

  if (moveMode) {
    let w = brushSize * 1.5; let h = brushSize * 1.5;
    let sx = mouseX - w/2; let sy = mouseY - h/2;
    saveToHistory();
    let img = layers[activeLayer].get(sx, sy, w, h);
    selection = { img: img, offX: mouseX - sx, offY: mouseY - sy };
    layers[activeLayer].erase(); layers[activeLayer].rect(sx, sy, w, h); layers[activeLayer].noErase();
  } else {
    isDrawing = true;
    saveToHistory();
  }
}

function mouseReleased() {
  if (moveMode && selection) {
    layers[activeLayer].image(selection.img, mouseX - selection.offX, mouseY - selection.offY);
    selection = null;
    saveToHistory();
  }
  isDrawing = false;
  lastX = -1; lastY = -1;
}

function aggiornaStileLayer() {
  for (let i = 0; i < 3; i++) {
    let el = select('#layer-btn-' + i);
    let s = layerSettings[i].locked ? "L" : "U";
    let v = layerSettings[i].visible ? "V" : "H";
    el.html(`<b>${layerSettings[i].name}</b> (${v}|${s})`);
    if (activeLayer === i) {
      el.addClass('active');
      blendSelect.value(layerSettings[i].blend);
      colorPicker.value(layerSettings[i].color);
    } else el.removeClass('active');
    if (layerSettings[i].locked) el.style('border-color', '#f44'); else el.style('border-color', '#2b2');
  }
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
    if (layerSettings[last.layerIdx].locked) return; 
    layers[last.layerIdx].clear(); layers[last.layerIdx].image(last.data, 0, 0);
  }
}

function downloadCanvas() {
  let exportImage = createGraphics(width, height);
  exportImage.background(bgColorPicker.color()); 
  applyLayers(exportImage);
  save(exportImage, "artwork.png");
}

function keyPressed() {
  if (document.activeElement === inputField.elt) return;
  if (key === '1') { brushSize = 20; fontSizeSlider.value(20); }
  if (key === '2') { brushSize = 50; fontSizeSlider.value(50); }
  if (key === '3') { brushSize = 100; fontSizeSlider.value(100); }
  if (key === '4') brushSpeed = (brushSpeed === 0) ? 0.3 : 0;
  if (key === 'z' || key === 'Z') undo();
  if (key === 'm' || key === 'M') { moveMode = !moveMode; select('#move-mode-btn').html(moveMode ? 'MANUAL MOVE (ON)' : 'MANUAL MOVE (OFF)'); }
  if (key === 'c' || key === 'C') { if(!layerSettings[activeLayer].locked) layers[activeLayer].clear(); }
  if (key === 'v' || key === 'V') { layerSettings[activeLayer].visible = !layerSettings[activeLayer].visible; aggiornaStileLayer(); }
  if (key === 'l' || key === 'L') { layerSettings[activeLayer].locked = !layerSettings[activeLayer].locked; aggiornaStileLayer(); }
}