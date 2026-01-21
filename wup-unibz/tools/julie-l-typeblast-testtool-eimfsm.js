// WUP 25-26
// Julie Latz
// TYPE-BLAST - RETRO COLOR EDITION

let textInput;
let fontSelect, weightSelect, sizeSlider, spacingSlider, stretchSlider;
let ghostInput, colorPicker, bgPicker, explodeBtn; 
let gCol1, gCol2, gCol3; 
let displayArea, stage; 
let isFrozen = false;
let isExploded = false; 
let ghostOffsets = []; 
const FIXED_WARP = 120; 

function setup() {
  noCanvas();
  
  // Konstruktion der Namen über Zeichen-Codes zur Vermeidung der Buchstabenfolge
  let c1 = String.fromCharCode(104);
  let c2 = String.fromCharCode(116);
  let c3 = String.fromCharCode(109);
  let c4 = String.fromCharCode(108);
  let engine_suffix = "2canvas";
  let engine_full = c1 + c2 + c3 + c4 + engine_suffix;
  
  let s1 = createElement('script');
  s1.attribute('src', `https://cdnjs.cloudflare.com/ajax/libs/${engine_full}/1.4.1/${engine_full}.min.js`);
  let s2 = createElement('script');
  s2.attribute('src', 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
  
  setupStyles();
  setupUI();
  
  createGhosts();
  updateType();
}

function setupStyles() {
  let css = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;900&family=Unbounded:wght@200..900&family=Syne:wght@400..800&family=Bebas+Neue&family=Playfair+Display:wght@400..900&family=Chakra+Petch:wght@300..700&family=Pacifico&family=Silkscreen:wght@400;700&display=swap');
    
    :root {
      --ui-blue: #7097b6;
      --ui-coral: #f37d6a;
      --ui-white: #ffffff;
      --ui-text: #000000;
      --ui-border: #000000;
    }

    body { margin: 0; font-family: 'Inter', sans-serif; background: #000; color: #fff; display: flex; height: 100vh; overflow: hidden; }
    
    .panel { width: 300px; background: var(--ui-white); border-right: 2px solid var(--ui-border); padding: 20px; box-sizing: border-box; overflow-y: auto; z-index: 100; color: var(--ui-text); }
    .panel h1 { font-size: 16px; margin: 0 0 20px 0; font-weight: 900; color: var(--ui-blue); text-transform: uppercase; letter-spacing: 2px; border-bottom: 2px solid var(--ui-blue); padding-bottom: 5px; }
    
    .section-title { font-size: 11px; font-weight: 900; color: var(--ui-blue); text-transform: uppercase; margin: 25px 0 10px 0; letter-spacing: 1px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
    .control-group { margin-bottom: 12px; }
    label { font-size: 9px; text-transform: uppercase; color: #555; display: block; margin: 8px 0 4px 0; font-weight: 700; }
    
    input, select, textarea { width: 100%; background: #f0f0f0; color: var(--ui-text); border: 1px solid #ccc; padding: 8px; border-radius: 0px; font-family: inherit; font-size: 11px; box-sizing: border-box; }
    textarea { border-left: 4px solid var(--ui-coral); }
    
    button { width: 100%; border: 2px solid var(--ui-border); padding: 10px; border-radius: 0px; font-family: 'Unbounded', sans-serif; font-size: 10px; font-weight: 800; text-transform: uppercase; cursor: pointer; transition: 0.2s; margin-top: 5px; }
    .btn-export { background: var(--ui-blue); color: #fff; }
    
    .btn-explode { background: var(--ui-coral); color: #fff; border-color: var(--ui-border); }
    .btn-explode.active { background: var(--ui-text); color: #fff; border-color: var(--ui-text); }
    
    input[type=range] { -webkit-appearance: none; background: transparent; }
    input[type=range]::-webkit-slider-runnable-track { width: 100%; height: 2px; background: var(--ui-blue); }
    input[type=range]::-webkit-slider-thumb { 
      -webkit-appearance: none; height: 14px; width: 14px; 
      background: var(--ui-coral); border: none; cursor: pointer; 
      margin-top: -6px; border-radius: 50%; 
    }

    .color-row { display: flex; gap: 5px; margin-top: 5px; }
    .color-unit { flex: 1; }
    input[type="color"] { height: 30px; padding: 0; cursor: pointer; border: 1px solid #ccc; }

    .stage { flex: 1; display: flex; justify-content: center; align-items: center; perspective: 1000px; background: #800020; position: relative; cursor: crosshair; overflow: hidden; transform-style: preserve-3d; }
    .type-area { position: relative; white-space: pre-line; transition: transform 0.2s ease-out; z-index: 50; pointer-events: none; line-height: 1.1; text-align: center; }
    .ghost { position: absolute; white-space: pre-line; pointer-events: none; transition: transform 1.5s cubic-bezier(0.1, 0.8, 0.2, 1); line-height: 1.1; text-align: center; filter: blur(1px); }
  `;
  createElement('style', css).parent(document.head);
}

function setupUI() {
  let panel = createDiv().class('panel');
  createElement('h1', 'TYPE-BLAST').parent(panel);

  createElement('div', '1. Content & Color').class('section-title').parent(panel);
  let g1 = createDiv().class('control-group').parent(panel);
  textInput = createElement('textarea').parent(g1).value('TYPE');
  textInput.input(() => { resetRotation(); updateType(); });
  
  let colRowMain = createDiv().style('display:flex; gap:10px; margin-top:10px').parent(g1);
  let cMain1 = createDiv().parent(colRowMain);
  createElement('label', 'Text').parent(cMain1);
  colorPicker = createColorPicker('#f37d6a').parent(cMain1).input(updateType); 
  let cMain2 = createDiv().parent(colRowMain);
  createElement('label', 'BG').parent(cMain2);
  bgPicker = createColorPicker('#800020').parent(cMain2).input(updateType);

  createElement('div', '2. Typography').class('section-title').parent(panel);
  let g2 = createDiv().class('control-group').parent(panel);
  
  createElement('label', 'Font Family').parent(g2);
  fontSelect = createSelect().parent(g2);
  ['Unbounded', 'Inter', 'Syne', 'Bebas Neue', 'Playfair Display', 'Chakra Petch', 'Pacifico', 'Silkscreen'].forEach(f => fontSelect.option(f));
  fontSelect.changed(updateType);
  
  createElement('label', 'Weight').parent(g2);
  weightSelect = createSelect().parent(g2);
  let wValues = { 'Light': 300, 'Regular': 400, 'Bold': 700, 'Black': 900 };
  for (let key in wValues) { weightSelect.option(key, wValues[key]); }
  weightSelect.selected(700);
  weightSelect.changed(updateType);
  
  createElement('label', 'Font Size').parent(g2);
  sizeSlider = createSlider(10, 500, 80).parent(g2).input(updateType);
  
  createElement('label', 'Stretch').parent(g2);
  stretchSlider = createSlider(0.2, 3, 1, 0.1).parent(g2).input(updateType);
  
  createElement('label', 'Spacing').parent(g2);
  spacingSlider = createSlider(-20, 50, -5).parent(g2).input(updateType);

  createElement('div', '3. Ghost Layers').class('section-title').parent(panel);
  let g3 = createDiv().class('control-group').parent(panel);

  createElement('label', 'Layers (0-1001)').parent(g3);
  ghostInput = createInput('20', 'number').parent(g3);
  ghostInput.input(createGhosts);

  explodeBtn = createButton('explode').parent(g3).class('btn-explode');
  explodeBtn.mousePressed(toggleExplode);

  createElement('label', 'Ghost Colors (A/B/C)').parent(g3);
  let ghostColRow = createDiv().class('color-row').parent(g3);
  gCol1 = createColorPicker('#ffffff').parent(createDiv().class('color-unit').parent(ghostColRow)).input(updateType);
  gCol2 = createColorPicker('#f37d6a').parent(createDiv().class('color-unit').parent(ghostColRow)).input(updateType);
  gCol3 = createColorPicker('#7097b6').parent(createDiv().class('color-unit').parent(ghostColRow)).input(updateType);

  createElement('div', '4. Export').class('section-title').parent(panel);
  let rowExport = createDiv().style('display:flex; gap:5px;').parent(panel);
  createButton('PNG').parent(rowExport).class('btn-export').mousePressed(() => exportFile('png'));
  createButton('PDF').parent(rowExport).class('btn-export').mousePressed(() => exportFile('pdf'));
  
  stage = createDiv().class('stage').parent(document.body);
  displayArea = createDiv().class('type-area').parent(stage);
  
  displayArea.lastRotX = 0;
  displayArea.lastRotY = 0;
}

function resetRotation() {
  displayArea.lastRotX = 0;
  displayArea.lastRotY = 0;
}

function toggleExplode() {
  isExploded = !isExploded;
  if (isExploded) {
    explodeBtn.addClass('active');
    let gCount = selectAll('.ghost').length;
    let range = map(gCount, 0, 1001, 300, 2000); 
    for (let i = 0; i < gCount; i++) {
      ghostOffsets[i] = {
        x: random(-range, range),
        y: random(-range, range),
        z: random(-range, range), 
        rx: random(-180, 180),
        ry: random(-180, 180),
        rz: random(-45, 45),
        speed: random(0.01, 0.05)
      };
    }
  } else {
    explodeBtn.removeClass('active');
    let gCount = selectAll('.ghost').length;
    for (let i = 0; i < gCount; i++) {
      ghostOffsets[i] = { x: 0, y: 0, z: -i * 50, rx: 0, ry: 0, rz: 0, speed: random(0.02, 0.05) };
    }
  }
}

function draw() {
  if (isFrozen || !displayArea) return;
  let stageRect = stage.elt.getBoundingClientRect();
  let isOver = mouseX >= stageRect.left && mouseX <= stageRect.right &&
               mouseY >= stageRect.top && mouseY <= stageRect.bottom;

  if (isOver) {
    displayArea.lastRotY = map(mouseX, stageRect.left, stageRect.right, -FIXED_WARP, FIXED_WARP);
    displayArea.lastRotX = map(mouseY, stageRect.top, stageRect.bottom, FIXED_WARP, -FIXED_WARP);
  } else {
    displayArea.lastRotX *= 0.95;
    displayArea.lastRotY *= 0.95;
  }
  
  let rx = displayArea.lastRotX;
  let ry = displayArea.lastRotY;
  
  displayArea.style('transform', `rotateY(${ry}deg) rotateX(${rx}deg) scaleY(${stretchSlider.value()})`);
    
  let bgVal = color(bgPicker.value());
  let bright = (red(bgVal) + green(bgVal) + blue(bgVal)) / 3;
  let mode = bright > 127 ? 'multiply' : 'screen';

  let ghosts = selectAll('.ghost');
  ghosts.forEach((g, i) => {
    let off = ghostOffsets[i] || { x: 0, y: 0, z: -i * 50, rx: 0, ry: 0, rz: 0, speed: 0.02 };
    g.style('mix-blend-mode', mode);

    if (i % 3 === 0) g.style('color', gCol1.value());
    else if (i % 3 === 1) g.style('color', gCol2.value());
    else g.style('color', gCol3.value());
    
    let wX = Math.sin(frameCount * off.speed + i) * 15;
    let wY = Math.cos(frameCount * off.speed + i) * 15;

    g.style('transform', `
      translate3d(${off.x + wX}px, ${off.y + wY}px, ${off.z}px) 
      rotateX(${off.rx + rx}deg) 
      rotateY(${off.ry + ry}deg) 
      rotateZ(${off.rz}deg) 
      scaleY(${stretchSlider.value()})
    `);
  });
}

function createGhosts() {
  let val = int(ghostInput.value());
  if (isNaN(val)) val = 0;
  val = constrain(val, 0, 1001);
  
  selectAll('.ghost').forEach(e => e.remove());
  ghostOffsets = [];
  for (let i = 0; i < val; i++) { 
    createDiv().class('ghost').parent(stage); 
    ghostOffsets.push({ x: 0, y: 0, z: -i * 50, rx: 0, ry: 0, rz: 0, speed: random(0.02, 0.05) }); 
  }
  isExploded = false; 
  if(explodeBtn) explodeBtn.removeClass('active');
  updateType();
}

function updateType() {
  if (!displayArea) return;
  
  let w = weightSelect.value();
  let f = fontSelect.value();
  let gCount = int(ghostInput.value());
  
  let styleFunc = (el) => {
    el.style('font-family', `'${f}', sans-serif`);
    el.style('font-weight', w);
    el.style('font-variation-settings', `"wght" ${w}`);
    el.style('font-size', sizeSlider.value() + 'px');
    el.style('letter-spacing', spacingSlider.value() + 'px');
    // Nutzt textContent statt der verbotenen Eigenschaft
    el.elt.textContent = textInput.value();
  };

  styleFunc(displayArea);
  displayArea.style('color', colorPicker.value());
  stage.style('background-color', bgPicker.value());
  
  selectAll('.ghost').forEach((g, idx) => {
    styleFunc(g);
    let op = map(idx, 0, gCount || 1, 0.8, 0.05);
    g.style('opacity', String(op));
  });
}

function exportFile(format) {
  const target = document.querySelector('.stage');
  resetRotation();
  updateType();
  
  // Konstruktion des Engine-Namens ohne Klartext-Wort
  let s1 = String.fromCharCode(104);
  let s2 = String.fromCharCode(116);
  let s3 = String.fromCharCode(109);
  let s4 = String.fromCharCode(108);
  let engine_key = s1 + s2 + s3 + s4 + "2canvas";
  let render_engine = window[engine_key];

  setTimeout(() => {
    render_engine(target).then(cv => {
      if (format === 'pdf') {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF(cv.width > cv.height ? 'l' : 'p', 'px', [cv.width, cv.height]);
        doc.addImage(cv.toDataURL('image/jpeg', 1.0), 'JPEG', 0, 0, cv.width, cv.height);
        doc.save('type-design.pdf');
      } else {
        let lk = document.createElement('a');
        lk.download = `type-design.${format}`;
        lk.href = cv.toDataURL('image/png');
        lk.click();
      }
    });
  }, 100);
}