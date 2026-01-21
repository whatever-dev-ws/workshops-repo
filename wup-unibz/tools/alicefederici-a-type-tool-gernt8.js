// WUP 2025-26
// Alice Federici
let inputTesto, sliderSize, sliderRepetitions, sliderSpacing, selectForma, selectFont, selectEffetto, selectFormato;
let pickerSfondo, pickerTesto, btnShuffle, btnSave, btnSaveGif, btnInvert;
let labelSize, labelSpacing, labelReps; 
let parola = "typography";
let marginL = 250; 
let topH = 80;    
let seed = 0;
let pg; 
let tavolaW, tavolaH;

function setup() {
  createCanvas(windowWidth, windowHeight);
  
  let xUI = 25;
  let labelStyle = "color: #888; font-family: sans-serif; font-size: 10px; margin-bottom: 5px; letter-spacing: 1px; font-weight: bold; text-transform: uppercase;";

  // --- TOP BAR (Input Testo) ---
  let inputW = 400;
  let topLabel = createP('Inserisci Testo');
  topLabel.position(marginL + (width-marginL)/2 - inputW/2, 5);
  topLabel.style(labelStyle + "text-align:center; width:400px; color: #555;");
  
  inputTesto = createInput(parola).position(marginL + (width-marginL)/2 - inputW/2, 40).size(inputW, 25);
  inputTesto.input(() => parola = inputTesto.value());
  inputTesto.style("background:transparent; border:none; border-bottom:1px solid #555; color:#888; font-size:18px; text-align:center; outline:none;");

  // --- MENU LATERALE ---
  let y = 30; 
  let step = 60; 
  
  createP('Formato Tavola').position(xUI, y).style(labelStyle);
  selectFormato = createSelect().position(xUI, y + 22).size(180);
  selectFormato.option('A4 (Verticale)');
  selectFormato.option('SQUARE (1:1)');
  selectFormato.option('CINEMA (Orizzontale)');
  selectFormato.changed(updateTavola);

  y += step;
  createP('Struttura').position(xUI, y).style(labelStyle);
  selectForma = createSelect().position(xUI, y + 22).size(180);
  // Nomi modificati qui: CHAOS e LINEA
  ['GRID', 'CIRCLE', 'ROTATED GRID', 'CHAOS', 'LINEA', 'ONDULATO'].forEach(o => selectForma.option(o));

  y += step;
  createP('Filtro Grafico').position(xUI, y).style(labelStyle);
  selectEffetto = createSelect().position(xUI, y + 22).size(180);
  ['NONE', 'OUTLINE', 'BLUR'].forEach(o => selectEffetto.option(o));

  y += step;
  createP('Carattere').position(xUI, y).style(labelStyle);
  selectFont = createSelect().position(xUI, y + 22).size(180);
  ['Helvetica', 'Impact', 'Courier New', 'Georgia'].forEach(o => selectFont.option(o));

  y += step;
  createP('Colori (Testo / Sfondo)').position(xUI, y).style(labelStyle);
  pickerTesto = createColorPicker('#ffffff').position(xUI, y + 22).size(85, 25);
  pickerSfondo = createColorPicker('#0f0f0f').position(xUI + 95, y + 22).size(85, 25);

  y += step;
  labelSize = createP('Dimensione').position(xUI, y).style(labelStyle);
  sliderSize = createSlider(5, 250, 60).position(xUI, y + 22).size(180);

  y += step;
  labelSpacing = createP('Spaziatura').position(xUI, y).style(labelStyle);
  sliderSpacing = createSlider(0.1, 5, 1, 0.1).position(xUI, y + 22).size(180);

  y += step;
  labelReps = createP('Ripetizioni').position(xUI, y).style(labelStyle);
  sliderRepetitions = createSlider(1, 1000, 100).position(xUI, y + 22).size(180);

  // --- BOTTONI FISSI IN BASSO ---
  let bottomY = height - 200;
  
  btnInvert = createButton('Inverti Colori').position(xUI, bottomY).size(180, 30);
  btnInvert.mousePressed(invertiColori);
  btnInvert.style("cursor:pointer; background:transparent; color:#888; border:1px solid #444; font-size:10px; text-transform:uppercase;");

  btnShuffle = createButton('Shuffle Caso').position(xUI, bottomY + 40).size(180, 30);
  btnShuffle.mousePressed(() => seed = random(1000));
  btnShuffle.style("cursor:pointer; background:transparent; color:#888; border:1px solid #444; font-size:10px; text-transform:uppercase;");
  
  btnSaveGif = createButton('Salva GIF').position(xUI, bottomY + 80).size(180, 30);
  btnSaveGif.mousePressed(() => { if(selectForma.value()==='ONDULATO') saveGif('motion.gif', 2); });
  btnSaveGif.style("cursor:pointer; background:#333; color:#fff; border:none; font-size:10px; font-weight:bold; text-transform:uppercase;");

  btnSave = createButton('Salva PNG').position(xUI, bottomY + 120).size(180, 40);
  btnSave.mousePressed(() => save(pg, 'Poster_Alice.png'));
  btnSave.style("cursor:pointer; background:#fff; color:#000; border:none; font-size:11px; font-weight:bold; text-transform:uppercase;");

  updateTavola(); 
}

function updateTavola() {
  let availableW = windowWidth - marginL - 60;
  let availableH = windowHeight - topH - 120;
  let f = selectFormato.value();
  if (f === 'A4 (Verticale)') { tavolaH = availableH; tavolaW = tavolaH * 0.7; }
  else if (f === 'SQUARE (1:1)') { let s = min(availableW, availableH); tavolaW = s; tavolaH = s; }
  else if (f === 'CINEMA (Orizzontale)') { tavolaW = availableW; tavolaH = tavolaW * 0.56; }
  if (pg) pg.remove();
  pg = createGraphics(tavolaW, tavolaH);
}

function draw() {
  background(12); 
  let forma = selectForma.value();

  // --- LOGICA UI DINAMICA ---
  // Aggiornato il controllo per il tasto Shuffle (attivo con CHAOS)
  if (['ROTATED GRID', 'CHAOS'].includes(forma)) {
    btnShuffle.removeAttribute('disabled'); btnShuffle.style("opacity", "1");
  } else {
    btnShuffle.attribute('disabled', ''); btnShuffle.style("opacity", "0.2");
  }

  if (forma === 'ONDULATO') {
    sliderRepetitions.hide(); labelReps.hide();
    btnSaveGif.show();
  } else {
    sliderRepetitions.show(); labelReps.show();
    btnSaveGif.hide();
  }

  let areaX = marginL + (width - marginL) / 2 - tavolaW / 2;
  let areaY = topH + (height - topH) / 2 - tavolaH / 2;
  let safeH = tavolaH - 35; 

  pg.background(pickerSfondo.value());
  pg.push();
  pg.translate(tavolaW / 2, safeH / 2);
  
  let eff = selectEffetto.value();
  if (eff === 'OUTLINE') { pg.noFill(); pg.stroke(pickerTesto.value()); pg.strokeWeight(1.5); } 
  else { pg.fill(pickerTesto.value()); pg.noStroke(); }
  
  pg.textFont(selectFont.value());
  pg.textSize(sliderSize.value());
  pg.textAlign(CENTER, CENTER);
  pg.randomSeed(seed);
  
  disegnaFormaBuffer(forma, pg, safeH);
  pg.pop();

  if (eff === 'BLUR') pg.filter(BLUR, 3);
  drawFooterInTavola(pg);

  image(pg, areaX, areaY);
  
  stroke(30);
  line(marginL, 0, marginL, height);
}

function disegnaFormaBuffer(stile, buffer, hLimite) {
  let fs = sliderSize.value();
  let reps = sliderRepetitions.value();
  let space = sliderSpacing.value();
  let limitY = hLimite / 2;

  if (stile === 'GRID') {
    let cols = ceil(sqrt(reps * (tavolaW / hLimite))); 
    for (let i = 0; i < reps; i++) {
      let col = i % cols;
      let row = floor(i / cols);
      let x = (col - cols/2 + 0.5) * (fs * space * 1.5);
      let y = (row - (reps/cols)/2 + 0.5) * (fs * space * 1.1);
      if (abs(y) < limitY - fs/2 && abs(x) < tavolaW/2) buffer.text(parola, x, y);
    }
  } else if (stile === 'CIRCLE') {
    let rBase = (min(tavolaW, hLimite) * 0.1) * space;
    for (let i = 0; i < reps; i++) {
      let angle = TWO_PI / reps * i;
      let r = rBase + (i * 0.5); 
      buffer.push(); 
      buffer.rotate(angle); 
      buffer.text(parola, r, 0); 
      buffer.pop();
    }
  } else if (stile === 'CHAOS') { // Vecchio 'CONCRETE POETRY'
    for (let i = 0; i < reps; i++) {
      let tx = buffer.random(-tavolaW/2.2, tavolaW/2.2) * (space * 0.5 + 0.5);
      let ty = buffer.random(-limitY + fs, limitY - fs) * (space * 0.5 + 0.5);
      buffer.push();
      buffer.translate(tx, ty);
      buffer.text(parola, 0, 0);
      buffer.pop();
    }
  } else if (stile === 'LINEA') { // Vecchio 'TYPEWRITER ART'
    buffer.textAlign(LEFT);
    let yStart = -limitY + fs;
    for (let i = 0; i < reps/4; i++) {
      let yPos = yStart + (i * fs * space * 0.5);
      if (yPos < limitY - fs) {
        let lineStr = "";
        while(buffer.textWidth(lineStr + parola + " ") < tavolaW * 0.9) {
          lineStr += parola + " ";
        }
        buffer.text(lineStr, -tavolaW/2 + 20, yPos);
      }
    }
  } else if (stile === 'ONDULATO') {
    for (let i = 0; i < parola.length; i++) {
      let x = (i - parola.length/2 + 0.5) * (fs * space * 0.7);
      let y = sin(frameCount * 0.1 + i * 0.5) * (limitY * 0.5);
      buffer.text(parola[i], x, y);
    }
  } else if (stile === 'ROTATED GRID') {
    let area = (tavolaW * 0.8) * (hLimite * 0.8);
    let density = sqrt(area / reps);
    let step = density * space; 
    
    let count = 0;
    for (let y = -limitY + fs; y < limitY - fs; y += step) {
      for (let x = -tavolaW/2 + fs; x < tavolaW/2 - fs; x += step) {
        if (count < reps) {
          buffer.push(); 
          buffer.translate(x, y); 
          buffer.rotate(buffer.random([0, HALF_PI, PI, -HALF_PI])); 
          buffer.text(parola, 0, 0); 
          buffer.pop();
          count++;
        }
      }
    }
  }
}

function invertiColori() {
  let c1 = pickerTesto.value(); let c2 = pickerSfondo.value();
  pickerTesto.value(c2); pickerSfondo.value(c1);
}

function drawFooterInTavola(buffer) {
  buffer.push();
  let c = color(pickerTesto.value()); c.setAlpha(150);
  buffer.fill(c); buffer.textSize(8); buffer.textAlign(LEFT, BOTTOM);
  buffer.text("Alice Federici", 10, buffer.height - 8);
  buffer.pop();
}

function windowResized() { resizeCanvas(windowWidth, windowHeight); updateTavola(); }