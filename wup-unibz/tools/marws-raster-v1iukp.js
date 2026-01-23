//WUP 2025-26
//Marwa Charaf

let img;
let fileInput, sizeSlider, shapeSelect, textInput, saveBtn, gifBtn;
let colorModeSelect, presetSelect;
let pickerContainer, presetContainer; 
let colorPicker1, colorPicker2, colorPicker3, colorPicker4;
let bgColorPicker; 
let animCheckbox;
let halftoneCheckbox, chaosCheckbox;
let sizeValueLabel;
let cnv; 

let maxShapeSize = 15;
let rotationOffset = 0; 

// --- PALETTE ARTISTICHE ---
let presets = {
  'Andy Warhol': ['#E74C3C', '#8E44AD', '#3498DB', '#F1C40F'], 
  'Lichtenstein': ['#FFFFFF', '#000000', '#FF0000', '#0000FF'], 
  'Rinascimento': ['#3E2723', '#8D6E63', '#D4AF37', '#F5CBA7'], 
  'Impressionismo': ['#A8E6CF', '#DCEDC1', '#FFD3B6', '#FFAAA5'], 
  'Barocco': ['#000000', '#3E0000', '#B8860B', '#F5DEB3'], 
  'Bauhaus': ['#111111', '#FF0000', '#FFFF00', '#0000FF'], 
  'Fauvismo': ['#581845', '#900C3F', '#C70039', '#FF5733'], 
  'Art Deco': ['#2C3E50', '#16A085', '#D4AC0D', '#000000'], 
  'Cyberpunk': ['#000000', '#FF00FF', '#00FFFF', '#FFFF00'], 
  'Matrix': ['#000000', '#003300', '#00FF00', '#CCFFCC'], 
  'Game Boy': ['#0F380F', '#306230', '#8BAC0F', '#9BBC0F'], 
  'Bianco & Nero': ['#000000', '#444444', '#AAAAAA', '#FFFFFF']
};

function setup() {
  cnv = createCanvas(100, 100); 
  
  // --- CSS STILE ---
  let css = `
    body {
      margin: 0; display: flex; height: 100vh;
      font-family: 'Segoe UI', Roboto, Helvetica, sans-serif;
      background-color: #121212; color: #eee; overflow: hidden;
    }
    #sidebar {
      width: 340px; 
      background: rgba(30, 30, 30, 0.95);
      backdrop-filter: blur(10px);
      padding: 20px;
      display: flex; flex-direction: column; gap: 15px;
      box-shadow: 4px 0 15px rgba(0,0,0,0.6); 
      overflow-y: auto; flex-shrink: 0; border-right: 1px solid #333;
    }
    h2 { margin: 0; color: #3498db; font-size: 1.6rem; text-transform: uppercase; letter-spacing: 2px; text-shadow: 0 0 10px rgba(52, 152, 219, 0.3); }
    p { margin: 5px 0; font-size: 0.85rem; color: #aaa; }
    label { display: block; margin-bottom: 5px; font-weight: 600; font-size: 0.9rem; color: #ddd; }
    
    .control-group {
      background: rgba(255, 255, 255, 0.05); 
      padding: 15px; border-radius: 10px; border: 1px solid #333;
      transition: border 0.3s;
    }
    .control-group:hover { border: 1px solid #3498db; }
    input[type="text"], select {
      width: 100%; padding: 10px; background: #222; border: 1px solid #444; 
      color: white; border-radius: 6px; box-sizing: border-box; outline: none;
    }
    input[type="range"] { width: 100%; cursor: pointer; accent-color: #3498db; }
    
    /* STILE BOTTONI */
    .btn-container { display: flex; gap: 10px; margin-bottom: 50px; }
    
    .save-btn {
      flex: 1;
      background: linear-gradient(135deg, #e67e22, #d35400); color: white; border: none; 
      padding: 15px; font-weight: bold; border-radius: 8px; cursor: pointer; 
      text-transform: uppercase; letter-spacing: 1px;
      box-shadow: 0 4px 15px rgba(230, 126, 34, 0.4);
      transition: all 0.2s;
    }
    .save-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(230, 126, 34, 0.6); }
    
    .gif-btn {
      flex: 1;
      background: linear-gradient(135deg, #8E44AD, #9B59B6); color: white; border: none; 
      padding: 15px; font-weight: bold; border-radius: 8px; cursor: pointer; 
      text-transform: uppercase; letter-spacing: 1px;
      box-shadow: 0 4px 15px rgba(142, 68, 173, 0.4);
      transition: all 0.2s;
    }
    .gif-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(142, 68, 173, 0.6); }
    
    #custom-picker-box { display: flex; justify-content: space-between; margin-top: 10px; }
    input[type="color"] { width: 100%; height: 40px; border: none; padding: 0; background: none; cursor: pointer; }
    
    #canvas-container {
      flex-grow: 1; display: flex; justify-content: center; align-items: center;
      background-image: radial-gradient(#222 1px, transparent 1px);
      background-size: 30px 30px; background-color: #050505;
      overflow: auto; padding: 20px;
    }
    canvas { box-shadow: 0 0 40px rgba(0,0,0,0.8); display: block; border-radius: 4px; }
    .checkbox-row { display: flex; align-items: center; gap: 10px; margin-bottom: 5px; }
    input[type="checkbox"] { width: 18px; height: 18px; accent-color: #3498db; cursor: pointer; }
  `;
  createElement('style', css);

  let sidebar = createDiv().id('sidebar');
  let canvasContainer = createDiv().id('canvas-container');
  cnv.parent(canvasContainer);

  createElement('h2', 'Pop Art Studio Pro').parent(sidebar);
  createP('Viaggio nell\'arte digitale.').parent(sidebar);

  // 1. CARICAMENTO
  let group1 = createDiv().class('control-group').parent(sidebar);
  createElement('label', '1. Sorgente').parent(group1);
  fileInput = createFileInput(handleFile).parent(group1);

  // 2. DIMENSIONE E SFONDO
  let group2 = createDiv().class('control-group').parent(sidebar);
  let sizeHeader = createDiv().style('display:flex; justify-content:space-between;').parent(group2);
  createElement('label', '2. Dimensione & Sfondo').parent(sizeHeader);
  sizeValueLabel = createSpan(maxShapeSize + 'px').style('color:#3498db; font-weight:bold').parent(sizeHeader);
  
  sizeSlider = createSlider(4, 100, maxShapeSize, 1).parent(group2);
  sizeSlider.input(() => { maxShapeSize = sizeSlider.value(); sizeValueLabel.html(maxShapeSize + 'px'); });
  
  createDiv().style('margin-top:10px').parent(group2);
  createElement('label', 'Colore Sfondo:').style('font-size:0.8rem').parent(group2);
  bgColorPicker = createColorPicker('#1E1E1E').parent(group2);
  bgColorPicker.style('width: 100%');

  // 3. FORMA
  let group3 = createDiv().class('control-group').parent(sidebar);
  createElement('label', '3. Forma').parent(group3);
  shapeSelect = createSelect().parent(group3);
  shapeSelect.option('Stelle');
  shapeSelect.option('Cuori');
  shapeSelect.option('Fiori');
  shapeSelect.option('Piedi');
  shapeSelect.option('Testo');
  shapeSelect.option('Numeri');
  shapeSelect.option('Cerchi (HD)');
  
  createElement('label', 'Testo personalizzato:').style('margin-top:10px; font-size:0.8rem').parent(group3);
  textInput = createInput('ART').parent(group3);

  // 4. EFFETTI
  let groupEffects = createDiv().class('control-group').parent(sidebar);
  createElement('label', '4. Effetti Speciali ✨').style('color:#F1C40F').parent(groupEffects);
  
  let rowAnim = createDiv().class('checkbox-row').parent(groupEffects);
  animCheckbox = createCheckbox('', false).parent(rowAnim);
  createSpan('Animazione Automatica').parent(rowAnim);

  let rowHalftone = createDiv().class('checkbox-row').parent(groupEffects);
  halftoneCheckbox = createCheckbox('', false).parent(rowHalftone);
  createSpan('Dimensione Dinamica (Halftone)').parent(rowHalftone);

  let rowChaos = createDiv().class('checkbox-row').parent(groupEffects);
  chaosCheckbox = createCheckbox('', false).parent(rowChaos);
  createSpan('Caos Artistico (Effetto Schizzo)').parent(rowChaos);
  
  // 5. COLORI
  let group4 = createDiv().class('control-group').parent(sidebar);
  createElement('label', '5. Stile Artistico').parent(group4);

  colorModeSelect = createSelect().parent(group4);
  colorModeSelect.option('Colori Originali');
  colorModeSelect.option('Correnti Artistiche (Preset)');
  colorModeSelect.option('Scegli Colori');
  colorModeSelect.changed(updateColorUI); 

  presetContainer = createDiv().style('margin-top:10px; display:none').parent(group4);
  presetSelect = createSelect().parent(presetContainer);
  for (let key in presets) presetSelect.option(key);

  pickerContainer = createDiv().id('custom-picker-box').style('display:none').parent(group4);
  colorPicker1 = createColorPicker('#FF0055').parent(pickerContainer);
  colorPicker2 = createColorPicker('#00FF55').parent(pickerContainer);
  colorPicker3 = createColorPicker('#5500FF').parent(pickerContainer);
  colorPicker4 = createColorPicker('#FFFF00').parent(pickerContainer);

  // AREA PULSANTI
  let btnContainer = createDiv().class('btn-container').parent(sidebar);
  
  saveBtn = createButton('FOTO (PNG)').class('save-btn').parent(btnContainer);
  saveBtn.mousePressed(savePNG);
  
  gifBtn = createButton('GIF (3s)').class('gif-btn').parent(btnContainer);
  gifBtn.mousePressed(createGif);

  updateColorUI();

  textAlign(CENTER, CENTER);
  noStroke();
  background(30);
  fill(150);
  text("Carica un'immagine per iniziare", width/2, height/2);
}

function updateColorUI() {
  let mode = colorModeSelect.value();
  presetContainer.style('display', mode === 'Correnti Artistiche (Preset)' ? 'block' : 'none');
  pickerContainer.style('display', mode === 'Scegli Colori' ? 'flex' : 'none');
}

function handleFile(file) {
  if (file.type === 'image') {
    img = loadImage(file.data, () => {
      let maxDim = 800; // Ridotto leggermente per performance GIF
      if (img.width > img.height) {
        if(img.width > maxDim) img.resize(maxDim, 0);
      } else {
        if(img.height > maxDim) img.resize(0, maxDim);
      }
      resizeCanvas(img.width, img.height);
      img.loadPixels(); 
    });
  } else {
    alert("Carica un'immagine valida.");
  }
}

function draw() {
  if (!img) return;

  background(bgColorPicker.color());

  let cols = floor(img.width / maxShapeSize);
  let rows = floor(img.height / maxShapeSize);
  
  let shapeMode = shapeSelect.value();
  let colorMode = colorModeSelect.value();
  let userWord = textInput.value() || "?";
  let isAnimated = animCheckbox.checked();
  let isHalftone = halftoneCheckbox.checked();
  let isChaos = chaosCheckbox.checked();

  if (isAnimated) {
    rotationOffset += 0.08; 
  }

  let currentPalette = [];
  if (colorMode === 'Correnti Artistiche (Preset)') currentPalette = presets[presetSelect.value()];
  else if (colorMode === 'Scegli Colori') currentPalette = [colorPicker1.color(), colorPicker2.color(), colorPicker3.color(), colorPicker4.color()];

  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      let x = i * maxShapeSize + maxShapeSize / 2;
      let y = j * maxShapeSize + maxShapeSize / 2;

      let px = constrain(floor(x), 0, img.width - 1);
      let py = constrain(floor(y), 0, img.height - 1);
      let idx = 4 * (py * img.width + px);
      
      let r = img.pixels[idx];
      let g = img.pixels[idx + 1];
      let b = img.pixels[idx + 2];
      let bright = (r + g + b) / 3;

      let dynamicSize = maxShapeSize;
      
      if (isHalftone) {
        dynamicSize = map(bright, 0, 255, 2, maxShapeSize * 1.5);
      }

      if (isAnimated && shapeMode !== 'Testo' && shapeMode !== 'Numeri') {
         let pulse = map(sin(rotationOffset + (i*0.1) + (j*0.1)), -1, 1, 0.8, 1.2);
         dynamicSize *= pulse;
      }

      if (colorMode === 'Colori Originali') {
        fill(r, g, b);
      } else {
        let colorIndex = floor(map(bright, 0, 255, 0, currentPalette.length));
        colorIndex = constrain(colorIndex, 0, currentPalette.length - 1);
        fill(currentPalette[colorIndex]);
      }

      push();
      if (isChaos) {
        translate(x + random(-3, 3), y + random(-3, 3));
      } else {
        translate(x, y);
      }
      
      let staticRandom = sin(i * 12.989 + j * 78.233); 
      
      switch (shapeMode) {
        case 'Stelle':
          rotate(map(staticRandom, -1, 1, -0.5, 0.5)); 
          if(isAnimated) rotate(rotationOffset); 
          drawStar(dynamicSize / 2);
          break;
        case 'Cuori':
          rotate(map(staticRandom, -1, 1, -0.2, 0.2));
          if(isAnimated) {
             rotate(rotationOffset); 
             let beat = map(sin(rotationOffset * 3), -1, 1, 0.9, 1.1);
             scale(beat);
          }
          drawHeart(dynamicSize / 2.5);
          break;
        case 'Fiori':
          rotate(map(staticRandom, -1, 1, 0, TWO_PI));
          if(isAnimated) rotate(-rotationOffset); 
          drawFlower(dynamicSize / 2);
          break;
        case 'Piedi':
          rotate(map(staticRandom, -1, 1, -0.3, 0.3));
          if(isAnimated) rotate(rotationOffset * 0.5); 
          drawFoot(dynamicSize / 2.2);
          break;
        case 'Testo':
          textSize(dynamicSize);
          textStyle(BOLD);
          if(isAnimated) rotate(sin(rotationOffset + i)*0.2); 
          let charIndex = (i + j) % userWord.length; 
          text(userWord.charAt(charIndex), 0, 0);
          break;
        case 'Numeri':
          textSize(dynamicSize);
          textStyle(BOLD);
          let fixedNum = floor(abs(staticRandom * 10)) % 10;
          if (isAnimated) {
             text(floor(random(0, 10)), 0, 0);
          } else {
             text(fixedNum, 0, 0);
          }
          break;
        case 'Cerchi (HD)':
          ellipse(0, 0, dynamicSize, dynamicSize);
          break;
      }
      pop();
    }
  }
}

// --- FORME ---
function drawStar(size) {
  beginShape();
  for (let i = 0; i < 10; i++) {
    let r = i % 2 === 0 ? size : size * 0.5;
    let angle = TWO_PI * i / 10 - HALF_PI;
    vertex(cos(angle) * r, sin(angle) * r);
  }
  endShape(CLOSE);
}
function drawHeart(size) {
  beginShape();
  for (let t = 0; t < TWO_PI; t += 0.1) {
    let x = 16 * pow(sin(t), 3);
    let y = 13 * cos(t) - 5 * cos(2 * t) - 2 * cos(3 * t) - cos(4 * t);
    vertex(x * (size / 16), -y * (size / 16));
  }
  endShape(CLOSE);
}
function drawFlower(size) {
  let petals = 6; 
  for (let i = 0; i < petals; i++) {
    push();
    rotate(TWO_PI * i / petals);
    ellipse(0, size / 1.8, size / 3, size);
    pop();
  }
  fill(255, 150); 
  ellipse(0, 0, size / 2, size / 2);
}
function drawFoot(size) {
  ellipse(0, size * 0.2, size, size * 1.4);
  for (let i = -2; i <= 2; i++) {
    let toeX = i * (size * 0.25);
    let toeY = -size * 0.6 - (2 - abs(i)) * 2;
    ellipse(toeX, toeY, size * 0.25, size * 0.25);
  }
}

function savePNG() {
  if (img) saveCanvas('pop_art_statico', 'png');
}

// Funzione intelligente per la GIF
function createGif() {
  if (img) {
    // Se l'animazione non è attiva, la attiviamo temporaneamente per registrare il movimento
    let wasAnimated = animCheckbox.checked();
    if (!wasAnimated) animCheckbox.checked(true);
    
    gifBtn.html('Generazione...'); // Feedback visivo
    
    // Salva 3 secondi di GIF
    saveGif('pop_art_animazione', 3, { units: 'seconds' });
    
    // Ripristina testo bottone dopo un po' (solo estetico)
    setTimeout(() => {
      gifBtn.html('GIF (3s)');
      if (!wasAnimated) animCheckbox.checked(false); // Rimetti come prima
    }, 3500);
  } else {
    alert("Carica prima un'immagine!");
  }
}