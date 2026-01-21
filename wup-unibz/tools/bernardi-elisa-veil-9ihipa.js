let images = [null, null, null, null]; 
let settings = [
  { zoom: 1.0, ox: 0, oy: 0, color: '#000000', shape: 'circle', density: 1500, showOriginal: false, showRaster: true },
  { zoom: 1.0, ox: 0, oy: 0, color: '#ff0000', shape: 'heart', density: 1200, showOriginal: false, showRaster: true },
  { zoom: 1.0, ox: 0, oy: 0, color: '#0000ff', shape: 'square', density: 1500, showOriginal: false, showRaster: true },
  { zoom: 1.0, ox: 0, oy: 0, color: '#555555', shape: 'circle', density: 1500, showOriginal: false, showRaster: true }
];

let formatSelect, gridSelect, bgPicker, fileNameInput;
const MAX_DIM = 600; 

function setup() {
  let mainContainer = createDiv().id('main-app');
  let canvas = createCanvas(MAX_DIM, MAX_DIM).id('canvas-art').parent(mainContainer);
  
  let style = createElement('style', `
    body { margin: 0; background: #bbb; font-family: sans-serif; overflow: hidden; display: flex; justify-content: center; align-items: center; height: 100vh; }
    #main-app { display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100vw; height: 100vh; position: relative; }
    #canvas-art { max-width: 100%; max-height: 60vh; object-fit: contain; box-shadow: 0 0 30px rgba(0,0,0,0.3); background: #fff; }
    
    .controls-panel { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; background: rgba(255, 255, 255, 0.95); padding: 10px; border-radius: 12px; margin-top: 10px; z-index: 100; font-size: 10px; border: 1px solid #999; max-width: 95vw; }
    .layer-box { border: 1px solid #ccc; padding: 5px; border-radius: 6px; background: #f9f9f9; display: flex; flex-direction: column; gap: 3px; min-width: 140px; }
    .layer-title { font-weight: bold; border-bottom: 1px solid #ddd; margin-bottom: 2px; color: #333; text-align: center; }
    
    .config-box { background: #e3f2fd; border: 1px solid #2196F3; }
    input[type="file"] { width: 130px; font-size: 9px; }
    select, button { padding: 3px; cursor: pointer; }
    .save-group { display: flex; align-items: center; gap: 3px; background: #eee; padding: 5px; border-radius: 8px; }
    .check-row { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; font-size: 9px; margin-top: 2px; }
  `);

  let controls = createDiv().parent(mainContainer).addClass('controls-panel');

  // CONFIGURAZIONE
  let config = createDiv().parent(controls).addClass('layer-box config-box');
  config.child(createDiv('LAYOUT').addClass('layer-title'));
  
  gridSelect = createSelect().parent(config);
  gridSelect.option('1 Tela', '1'); 
  gridSelect.option('2 Tele', '2'); 
  gridSelect.option('4 Tele', '4'); 
  gridSelect.option('Sovrapponi (1+2)', 'overlay');
  gridSelect.changed(updateLayerVisibility);

  formatSelect = createSelect().parent(config);
  formatSelect.option('1:1'); formatSelect.option('3:4'); formatSelect.option('4:3');
  formatSelect.option('9:16'); formatSelect.option('16:9');
  formatSelect.changed(updateLayout);

  bgPicker = createColorPicker('#ffffff').parent(config);

  // CREAZIONE DEI 4 LIVELLI
  for (let i = 0; i < 4; i++) {
    createLayerControl(controls, i);
  }

  let saveGroup = createDiv().parent(controls).addClass('save-group');
  fileNameInput = createInput('').attribute('placeholder', 'Nome...').parent(saveGroup);
  createButton('💾').parent(saveGroup).mousePressed(() => saveCanvas(fileNameInput.value() || 'raster_art', 'png'));
  createButton('⛶').parent(controls).mousePressed(toggleFullScreen);

  updateLayerVisibility();
}

function createLayerControl(parent, i) {
  let box = createDiv().parent(parent).addClass('layer-box').id('layer-ctrl-' + i);
  box.child(createDiv('IMG ' + (i + 1)).addClass('layer-title'));

  createFileInput((f) => handleFile(f, i)).parent(box);
  
  let row = createDiv().parent(box).style('display','flex').style('gap','3px');
  let sel = createSelect().parent(row);
  sel.option('●', 'circle'); sel.option('■', 'square'); sel.option('❤', 'heart');
  sel.changed(() => settings[i].shape = sel.value());

  let cp = createColorPicker(settings[i].color).parent(row);
  cp.input(() => settings[i].color = cp.value());

  let sld = createSlider(200, 10000, settings[i].density, 50).parent(box);
  sld.style('width', '100%');
  sld.input(() => settings[i].density = sld.value());

  // OPZIONI VISIBILITÀ: Foto e Raster
  let checkRow = createDiv().parent(box).addClass('check-row');
  
  let cbOrig = createCheckbox(' Foto', false).parent(checkRow);
  cbOrig.changed(() => settings[i].showOriginal = cbOrig.checked());

  let cbRast = createCheckbox(' Raster', true).parent(checkRow);
  cbRast.changed(() => settings[i].showRaster = cbRast.checked());
}

function updateLayerVisibility() {
  let mode = gridSelect.value();
  for (let i = 0; i < 4; i++) {
    let el = select('#layer-ctrl-' + i);
    if (mode === '4') el.show();
    else if (mode === '2' || mode === 'overlay') i < 2 ? el.show() : el.hide();
    else i < 1 ? el.show() : el.hide();
  }
}

function handleFile(file, i) {
  if (file.type === 'image') {
    loadImage(file.data, (img) => { images[i] = img; });
  }
}

function draw() {
  background(bgPicker.color());
  let mode = gridSelect.value();
  if (!images[0]) { textAlign(CENTER); fill(50); text("CARICA IMG 1 PER INIZIARE", width/2, height/2); return; }

  if (mode === 'overlay') {
    renderLayer(images[0], settings[0], width, height);
    if (images[1]) renderLayer(images[1], settings[1], width, height);
  } else {
    let num = int(mode);
    let cols = (num === 1) ? 1 : 2;
    let rows = (num <= 2) ? 1 : 2;
    let wt = width / cols; let ht = height / rows;

    for (let t = 0; t < num; t++) {
      let col = t % cols; let row = floor(t / cols);
      let idx;
      if (num === 4) {
        if (t === 0) idx = 0;
        else if (t === 1) idx = images[1] ? 1 : 0;
        else if (t === 2) idx = images[2] ? 2 : (images[1] ? 1 : 0);
        else idx = images[3] ? 3 : 0;
      } else {
        idx = images[t] ? t : 0;
      }
      
      push();
      translate(col * wt, row * ht);
      drawingContext.beginPath(); drawingContext.rect(0, 0, wt, ht); drawingContext.clip();
      renderLayer(images[idx], settings[idx], wt, ht);
      stroke(200); noFill(); rect(0, 0, wt, ht);
      pop();
    }
  }
}

function renderLayer(img, st, tw, th) {
  if (!img) return;
  let imgRatio = img.width / img.height;
  let canvasRatio = tw / th;
  let sw, sh;
  if (imgRatio > canvasRatio) { sh = img.height; sw = img.height * canvasRatio; }
  else { sw = img.width; sh = img.width / canvasRatio; }

  let zsw = sw / st.zoom; let zsh = sh / st.zoom;
  let sx = constrain((img.width - zsw) / 2 + st.ox, 0, img.width - zsw);
  let sy = constrain((img.height - zsh) / 2 + st.oy, 0, img.height - zsh);

  // 1. DISEGNA FOTO ORIGINALE
  if (st.showOriginal) {
    image(img, 0, 0, tw, th, sx, sy, zsw, zsh);
  }

  // 2. DISEGNA RASTER
  if (st.showRaster) {
    let spacing = sqrt((tw * th) / st.density);
    img.loadPixels();
    fill(st.color); noStroke();

    for (let y = spacing/2; y < th; y += spacing) {
      for (let x = spacing/2; x < tw; x += spacing) {
        let ix = floor(map(x, 0, tw, sx, sx + zsw));
        let iy = floor(map(y, 0, th, sy, sy + zsh));
        ix = constrain(ix, 0, img.width - 1); iy = constrain(iy, 0, img.height - 1);
        let i = (ix + iy * img.width) * 4;
        let b = (img.pixels[i] + img.pixels[i+1] + img.pixels[i+2]) / 3;
        let size = map(b, 0, 255, spacing * 1.5, 0);
        
        if (size > 0.5) {
          if (st.shape === 'circle') ellipse(x, y, size, size);
          else if (st.shape === 'square') rect(x-size/2, y-size/2, size, size);
          else {
            push(); translate(x, y);
            let r = size/2; beginShape();
            vertex(0, r/2); bezierVertex(-r, -r, -r*1.5, r/3, 0, r*1.2); bezierVertex(r*1.5, r/3, r, -r, 0, r/2);
            endShape(CLOSE); pop();
          }
        }
      }
    }
  }
}

function mouseWheel(event) {
  if (mouseX < 0 || mouseX > width || mouseY < 0 || mouseY > height) return;
  let idx = getActiveIdx();
  settings[idx].zoom = constrain(settings[idx].zoom - event.delta * 0.001, 1.0, 10.0);
  return false;
}

function mouseDragged() {
  if (mouseX < 0 || mouseX > width || mouseY < 0 || mouseY > height) return;
  let idx = getActiveIdx();
  settings[idx].ox += (pmouseX - mouseX) / settings[idx].zoom;
  settings[idx].oy += (pmouseY - mouseY) / settings[idx].zoom;
  return false;
}

function getActiveIdx() {
  let mode = gridSelect.value();
  if (mode === 'overlay') {
    if (keyIsPressed && key === '2') return 1;
    return 0;
  }
  let cols = (mode === '1') ? 1 : 2;
  let rows = (mode === '4') ? 2 : 1;
  let q = floor(mouseX / (width / cols)) + floor(mouseY / (height / rows)) * cols;
  if (mode === '4') return (q==0?0 : q==1?(images[1]?1:0) : q==2?(images[2]?2:(images[1]?1:0)) : (images[3]?3:0));
  return (images[q]?q:0);
}

function toggleFullScreen() { 
  if (!document.fullscreenElement) document.getElementById('main-app').requestFullscreen().then(() => resizeCanvas(windowWidth, windowHeight)); 
  else document.exitFullscreen(); 
}

document.addEventListener('fullscreenchange', () => { 
  if (!document.fullscreenElement) updateLayout(); 
  else resizeCanvas(windowWidth, windowHeight); 
});

function updateLayout() { 
  let val = formatSelect.value(); 
  let w = MAX_DIM, h = MAX_DIM; 
  if (val === '3:4') w = MAX_DIM * 0.75; 
  if (val === '4:3') h = MAX_DIM * 0.75; 
  if (val === '9:16') w = MAX_DIM * 0.56; 
  if (val === '16:9') h = MAX_DIM * 0.56; 
  resizeCanvas(w, h); 
}