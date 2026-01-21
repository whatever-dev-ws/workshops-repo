let img, processedImg;
let panel, colorPanel;
let numColorsSlider, numColorsLabel;
let popArtSlider, popArtLabel; 
let densitySlider, densityLabel; 
let sizeSlider, sizeLabel;       
let modeRadio;                   
let dotsCheckbox; 
let colorPickers = [];
let rowsSlider, colsSlider;
let rowsLabel, colsLabel;

function setup() {
  createCanvas(windowWidth, windowHeight);
  createControlPanel();
  createColorPanel();
}

function createControlPanel() {
  panel = createDiv('<b> POP RASTER SETTINGS </b>');
  panel.position(20, windowHeight+10);
  panel.style('background-color', 'rgba(0, 0, 0, 0.85)');
  panel.style('padding', '15px');
  panel.style('border-radius', '12px');
  panel.style('color', 'white');
  panel.style('font-family', 'sans-serif');
  panel.style('display', 'flex');
  panel.style('flex-direction', 'column');
  panel.style('gap', '8px');
  panel.style('width', '260px');

  const createRow = (label, control, parent) => {
    let row = createDiv('');
    row.style('display', 'flex');
    row.style('justify-content', 'space-between');
    row.style('align-items', 'center');
    row.parent(parent);
    let lbl = createElement('span', label);
    lbl.style('font-size', '11px');
    lbl.parent(row);
    control.parent(row);
    return lbl;
  };

  let fileInput = createFileInput(handleFile);
  createRow('Picture:', fileInput, panel);

  colsSlider = createSlider(1, 3, 2);
  colsLabel = createRow('Columns: 2', colsSlider, panel);
  
  rowsSlider = createSlider(1, 3, 2);
  rowsLabel = createRow('Rows: 2', rowsSlider, panel);

  popArtSlider = createSlider(0, 100, 0); 
  popArtLabel = createRow('Pop Filter: 0%', popArtSlider, panel);
  popArtSlider.input(() => popArtLabel.html('Pop Filter: ' + popArtSlider.value() + '%'));

  dotsCheckbox = createCheckbox(' Enable Raster Dots', true);
  dotsCheckbox.style('font-size', '12px');
  dotsCheckbox.style('color', '#00ffcc');
  dotsCheckbox.parent(panel);

  modeRadio = createRadio();
  modeRadio.option('dark', 'Shadows');
  modeRadio.option('bright', 'Highlights');
  modeRadio.selected('dark');
  modeRadio.style('font-size', '10px');
  modeRadio.style('color', 'white');
  modeRadio.parent(panel);

  densitySlider = createSlider(5, 30, 12);
  densityLabel = createRow('Density: 12', densitySlider, panel);
  densitySlider.input(() => densityLabel.html('Density: ' + densitySlider.value()));

  sizeSlider = createSlider(1, 2.5, 1.5, 0.1);
  sizeLabel = createRow('Magnitude: 1.5', sizeSlider, panel);
  
    // --- BOTTONE SALVATAGGIO ---
  let saveBtn = createButton('Save Artwork');
  saveBtn.parent(panel);
  saveBtn.style('background-color', '#4CAF50');
  saveBtn.style('color', 'white');
  saveBtn.mousePressed(() => {
    saveCanvas('my_image', 'png');
  })
                       
  
}
                       

function draw() {
  let mode = modeRadio.value();
  background(mode === 'dark' ? 255 : 20);

  if (img) {
    let cols = colsSlider.value();
    let rows = rowsSlider.value();
    let cellW = width / cols;
    let cellH = height / rows;
    let counter = 0;

    // Update labels
    colsLabel.html('Columns: ' + cols);
    rowsLabel.html('Rows: ' + rows);
    sizeLabel.html('Magnitude: ' + sizeSlider.value());

    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        let x = i * cellW;
        let y = j * cellH;
        let filterC = colorPickers[counter % colorPickers.length].color();
        
        // Calculate image cropping
        let imgRatio = img.width / img.height;
        let cellRatio = cellW / cellH;
        let sx, sy, sw, sh;
        if (imgRatio > cellRatio) {
          sh = img.height; sw = sh * cellRatio;
          sx = (img.width - sw) / 2; sy = 0;
        } else {
          sw = img.width; sh = sw / cellRatio;
          sx = 0; sy = (img.height - sh) / 2;
        }

        if (dotsCheckbox.checked()) {
          renderRasterCell(x, y, cellW, cellH, sx, sy, sw, sh, filterC, mode);
        } else {
          push();
          tint(filterC);
          image(img, x, y, cellW, cellH, sx, sy, sw, sh);
          pop();
        }
        counter++;
      }
    }

    // Apply global posterize if not using dots (optional overlay)
    if (!dotsCheckbox.checked() && popArtSlider.value() > 0) {
      let pLevel = floor(map(popArtSlider.value(), 0, 100, 20, 2));
      filter(POSTERIZE, pLevel);
    }
  }
}

function renderRasterCell(cx, cy, cw, ch, sx, sy, sw, sh, filterColor, mode) {
  let spacing = densitySlider.value();
  let mag = sizeSlider.value();
  let pLevel = floor(map(popArtSlider.value(), 0, 100, 255, 2));
  
  img.loadPixels();

  for (let y = 0; y < ch; y += spacing) {
    for (let x = 0; x < cw; x += spacing) {
      
      // Posizione originale sul canvas
      let posX = cx + x;
      let posY = cy + y;

      // --- LOGICA SPOSTAMENTO (RELAZIONE COL MOUSE) ---
      let d = dist(mouseX, mouseY, posX, posY);
      let offsetX = 0;
      let offsetY = 0;

      // Se il mouse è vicino (es. meno di 100 pixel), sposta il punto
      if (d < 40) {
        let angle = atan2(posY - mouseY, posX - mouseX); // Calcola la direzione opposta al mouse
        let force = map(0, 0, 120, 5, 80); // Più è vicino, più la forza è alta (max 20px)
        offsetX = cos(angle) * force;
        offsetY = sin(angle) * force;
      }

      // Mappatura pixel per il colore (rimane sulla griglia originale)
      let imgX = floor(map(x, 0, cw, sx, sx + sw));
      let imgY = floor(map(y, 0, ch, sy, sy + sh));
      
      let c = img.get(imgX, imgY);
      let r = floor(red(c) / (256/pLevel)) * (256/pLevel);
      let g = floor(green(c) / (256/pLevel)) * (256/pLevel);
      let b_val = floor(blue(c) / (256/pLevel)) * (256/pLevel);
      
      let finalR = (r * red(filterColor)) / 255;
      let finalG = (g * green(filterColor)) / 255;
      let finalB = (b_val * blue(filterColor)) / 255;
      
      let b = brightness(color(r, g, b_val));
      let radius;

      if (mode === 'dark') {
        radius = map(b, 0, 100, spacing, 0);
      } else {
        radius = map(b, 0, 100, 0, spacing);
      }

      fill(finalR, finalG, finalB);
      noStroke();
      
      // Disegna il cerchio nella posizione originale + l'offset del mouse
      ellipse(posX + offsetX, posY + offsetY, radius * mag);
    }
  }
}
function createColorPanel() {
  colorPanel = createDiv('<b>GRID TINTS</b>');
  colorPanel.position(400,windowHeight+10);
  colorPanel.style('background-color', 'rgba(0, 0, 0, 0.85)');
  colorPanel.style('padding', '15px');
  colorPanel.style('border-radius', '12px');
  colorPanel.style('color', 'white');
  colorPanel.style('font-family', 'sans-serif');
  colorPanel.style('width', '200px');

  numColorsLabel = createElement('div', 'Active Tints: 1');
  numColorsLabel.style('font-size', '11px');

  let istruzioni = createDiv(`
  <div style="line-height: 1.5; color: #FFFF; font-size: 10px; margin-top: 15px;">
    Use white to keep the original colours of the image (255,255,255)
  </div>
`);
istruzioni.parent(colorPanel); 
  
  numColorsSlider = createSlider(1, 6, 1);
  numColorsSlider.parent(colorPanel);
  numColorsSlider.style('width', '100%');
  
  let pickerContainer = createDiv('');
  pickerContainer.parent(colorPanel);
  pickerContainer.id('picker-area');
  pickerContainer.style('display', 'grid');
  pickerContainer.style('grid-template-columns', '1fr 1fr');
  pickerContainer.style('gap', '5px');

  updateColorPickers();
  numColorsSlider.input(() => {
    numColorsLabel.html('Active Tints:' + numColorsSlider.value());
    
    

    updateColorPickers();
  });
}

function updateColorPickers() {
  colorPickers.forEach(p => p.remove());
  colorPickers = [];
  let n = numColorsSlider.value();
  let container = select('#picker-area');
  const defaultColors = ['#ffffff', '#ff0055', '#00ffcc', '#ffff00', '#0066ff', '#ff6600'];
  for (let i = 0; i < n; i++) {
    let cp = createColorPicker(defaultColors[i % defaultColors.length]);
    cp.parent(container);
    cp.style('width', '100%');
    colorPickers.push(cp);
  }
}

function handleFile(file) {
  if (file.type === 'image') {
    img = loadImage(file.data);
  }
}



function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}