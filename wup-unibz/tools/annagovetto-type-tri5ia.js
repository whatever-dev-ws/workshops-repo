// WUP 2025-26
// Anna Govetto 
let state = "MENU";
let guiVisible = false;
let guiWidth = 280;
let guiScrollY = 0; 

let inputField, sizeSlider, stretchSlider, waveSlider, rotateSlider, fontSelect, spacingSlider, resetImgBtn; 
let textColorPicker, bgColorPicker;
let imgUpload, userImg;
let bgUpload, bgImg; 
let pg; 

// POSIZIONE E SCALA IMMAGINE
let imgX = 0;
let imgY = 0;
let imgScale = 1.0; 
let padSize = 120; 
let padKnobX = 0;  
let padKnobY = 0;
let isDraggingPad = false;

function setup() {
  createCanvas(windowWidth, windowHeight);
  pg = createGraphics(windowWidth, windowHeight);

  // CONTROLLI UI
  inputField = createInput('TYPE DESIGN');
  sizeSlider = createSlider(10, 500, 120);
  stretchSlider = createSlider(0.2, 5, 1, 0.1);
  spacingSlider = createSlider(0.1, 2.0, 0.55, 0.01);
  waveSlider = createSlider(0, 200, 0);
  rotateSlider = createSlider(0, TWO_PI, 0, 0.01);
  
  fontSelect = createSelect();
  fontSelect.option('Arial Black');
  fontSelect.option('Impact');
  fontSelect.option('Helvetica');
  fontSelect.option('Georgia');

  imgUpload = createFileInput(handleFile);
  bgUpload = createFileInput(handleBackground); 
  
  resetImgBtn = createButton('RESET IMAGE');
  resetImgBtn.mousePressed(() => { 
    imgX = 0; imgY = 0; 
    padKnobX = 0; padKnobY = 0;
    imgScale = 1.0;
  });

  // COLOR PICKERS
  textColorPicker = createColorPicker('#1E1E1E');
  bgColorPicker = createColorPicker('#FFFFFF');

  hideUI();
}

function handleFile(file) {
  if (file.type === 'image') {
    userImg = loadImage(file.data);
    imgX = 0; imgY = 0; padKnobX = 0; padKnobY = 0; imgScale = 1.0;
  }
}

function handleBackground(file) {
  if (file.type === 'image') {
    bgImg = loadImage(file.data);
  }
}

function draw() {
  if (state === "MENU") {
    drawMenu();
  } else if (state === "APP") {
    renderMainContent(); // Funzione separata per il design puro

    if (guiVisible) {
      drawSidebar();
      showUI();
      updateUIPositions();
      handleTrackpadLogic();
    } else {
      hideUI();
    }
    drawMenuButton();
  }
}

// NUOVA FUNZIONE: Contiene solo il design (Sfondo + Tipografia)
function renderMainContent() {
  background(bgColorPicker.color());
  
  if (bgImg) {
    push();
    imageMode(CENTER);
    let aspect = bgImg.width / bgImg.height;
    if (width / height > aspect) {
      image(bgImg, width / 2, height / 2, width, width / aspect);
    } else {
      image(bgImg, width / 2, height / 2, height * aspect, height);
    }
    pop();
  }
  
  push();
  translate(width / 2, height / 2);
  renderTypography(); 
  pop();
}

function handleTrackpadLogic() {
  if (!userImg) return;
  let padX = width - guiWidth + 25;
  let padY = 75 + guiScrollY + (9 * 52) + 20; 

  if (mouseIsPressed) {
    if (mouseX > padX && mouseX < padX + padSize && mouseY > padY && mouseY < padY + padSize) {
      isDraggingPad = true;
    }
  } else {
    isDraggingPad = false;
  }

  if (isDraggingPad) {
    padKnobX = constrain(mouseX - (padX + padSize / 2), -padSize / 2, padSize / 2);
    padKnobY = constrain(mouseY - (padY + padSize / 2), -padSize / 2, padSize / 2);
    imgX = padKnobX * 10; 
    imgY = padKnobY * 10;
  }
}

function renderTypography() {
  let txt = inputField.value();
  let sz = sizeSlider.value();
  let str = stretchSlider.value();
  let spc = spacingSlider.value();
  let wv = waveSlider.value();
  let rot = rotateSlider.value();
  let selectedFont = fontSelect.value();

  pg.clear(); 
  pg.push();
  pg.translate(pg.width / 2, pg.height / 2);
  
  pg.push();
  pg.rotate(rot);
  pg.textAlign(CENTER, CENTER);
  pg.textSize(sz);
  pg.textFont(selectedFont);
  
  function drawLetters(target) {
    for (let i = 0; i < txt.length; i++) {
      let spacing = sz * spc * str;
      let x = (i - (txt.length - 1) / 2) * spacing;
      let y = sin(i * 0.5) * wv; 
      target.push();
      target.translate(x, y);
      target.scale(str, 1);
      target.text(txt[i], 0, 0);
      target.pop();
    }
  }

  if (userImg) {
    pg.fill(255);
    drawLetters(pg);
    pg.pop(); 

    pg.drawingContext.globalCompositeOperation = 'source-in';
    pg.imageMode(CENTER);
    let aspect = userImg.width / userImg.height;
    let finalW = (sz * txt.length * str * 1.5) * imgScale; 
    pg.image(userImg, imgX, imgY, finalW, finalW / aspect);
    pg.drawingContext.globalCompositeOperation = 'source-over';
  } else {
    pg.fill(textColorPicker.color());
    drawLetters(pg);
    pg.pop();
  }
  pg.pop();

  imageMode(CENTER);
  image(pg, 0, 0);
}

function drawSidebar() {
  push();
  noStroke(); fill(255, 252); rectMode(CORNER);
  rect(width - guiWidth, 0, guiWidth, height);
  
  stroke(230);
  line(width - guiWidth, 0, width - guiWidth, height);

  let startX = width - guiWidth + 25;
  let startY = 60 + guiScrollY; 
  
  let labels = ["TEXT", "SIZE", "STRETCH", "SPACING", "WAVE", "ROTATION", "FONT", "MASK IMG", "BG IMG", "ACTION", "POSITION & ZOOM"];
  fill(80); textSize(9); textStyle(BOLD); textAlign(LEFT, TOP);
  for(let i = 0; i < labels.length; i++) {
    text(labels[i], startX, startY + (i * 52));
  }

  let colorY = height - 120;
  fill(255); noStroke(); rect(width-guiWidth+1, colorY-20, guiWidth-1, 140); 
  fill(80); text("TEXT COLOR", startX, colorY); text("BG COLOR", startX + 100, colorY);

  if (userImg) {
    let padY = startY + (10 * 52); 
    fill(240); stroke(200); strokeWeight(1);
    rect(startX, padY, padSize, padSize, 5);
    stroke(220);
    line(startX + padSize/2, padY, startX + padSize/2, padY + padSize);
    line(startX, padY + padSize/2, startX + padSize, padY + padSize/2);
    noStroke(); fill(255, 0, 127);
    ellipse(startX + padSize/2 + padKnobX, padY + padSize/2 + padKnobY, 12, 12);
    fill(150); textSize(8); text("ZOOM: " + floor(imgScale * 100) + "%", startX, padY + padSize + 10);
  }

  fill(255, 0, 127); noStroke();
  rect(startX, height - 65, guiWidth - 50, 45, 10);
  fill(255); textAlign(CENTER, CENTER); textSize(13);
  text("EXPORT PNG", width - guiWidth/2, height - 42);
  pop();
}

function updateUIPositions() {
  let x = width - guiWidth + 25;
  let y = 75 + guiScrollY; 
  let step = 52; 
  let elements = [inputField, sizeSlider, stretchSlider, spacingSlider, waveSlider, rotateSlider, fontSelect, imgUpload, bgUpload, resetImgBtn];

  for (let i = 0; i < elements.length; i++) {
    elements[i].position(x, y + (i * step));
    if (y + (i * step) > height - 140 || y + (i * step) < 20) elements[i].hide();
    else elements[i].show();
  }
  
  textColorPicker.position(x, height - 100);
  bgColorPicker.position(x + 100, height - 100);
  textColorPicker.show(); bgColorPicker.show();
}

function mouseWheel(event) {
  if (guiVisible && mouseX > width - guiWidth) {
    let startY = 60 + guiScrollY;
    let padX = width - guiWidth + 25;
    let padY = startY + (10 * 52);

    if (userImg && mouseX > padX && mouseX < padX + padSize && mouseY > padY && mouseY < padY + padSize) {
      imgScale -= event.delta * 0.001;
      imgScale = constrain(imgScale, 0.1, 10.0);
    } else {
      guiScrollY -= event.delta;
      guiScrollY = constrain(guiScrollY, -300, 0);
    }
  }
}

function mousePressed() {
  if (state === "MENU") {
    if (dist(mouseX, mouseY, width / 2, height / 2 + 50) < 100) state = "APP";
  } else if (state === "APP") {
    if (dist(mouseX, mouseY, width - 40, 40) < 25) {
      guiVisible = !guiVisible;
      guiScrollY = 0;
    }
    
    // LOGICA DI EXPORT AGGIORNATA
    let btnX = width - guiWidth + 25;
    if (guiVisible && mouseX > btnX && mouseX < width - 25 && mouseY > height - 65 && mouseY < height - 20) {
       exportCleanDesign();
    }
  }
}

// NUOVA FUNZIONE PER L'ESPORTAZIONE PULITA
function exportCleanDesign() {
  // 1. Ridisegniamo solo il contenuto principale
  renderMainContent();
  // 2. Salviamo il canvas (ora contiene solo il design)
  saveCanvas('my-type-design', 'png');
}

function drawMenu() {
  background(255, 0, 127);
  textAlign(CENTER, CENTER); fill(255); textSize(50); textStyle(BOLD);
  text("TYPE TOOL PRO", width / 2, height / 2 - 50);
  noFill(); stroke(255); strokeWeight(2); rectMode(CENTER);
  rect(width / 2, height / 2 + 50, 200, 50, 25);
  noStroke(); fill(255); textSize(18); text("START DESIGN", width / 2, height / 2 + 50);
}

function hideUI() {
  let el = [inputField, sizeSlider, stretchSlider, spacingSlider, waveSlider, rotateSlider, fontSelect, imgUpload, bgUpload, resetImgBtn, textColorPicker, bgColorPicker];
  el.forEach(e => e.hide());
}

function showUI() {}

function drawMenuButton() {
  push(); translate(width - 40, 40); fill(255, 0, 127); noStroke(); ellipse(0, 0, 35, 35);
  stroke(255); strokeWeight(2);
  if (guiVisible) { line(-5, -5, 5, 5); line(5, -5, -5, 5); } 
  else { line(-8, -4, 8, -4); line(-8, 0, 8, 0); line(-8, 4, 8, 4); }
  pop();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  pg.resizeCanvas(windowWidth, windowHeight);
}