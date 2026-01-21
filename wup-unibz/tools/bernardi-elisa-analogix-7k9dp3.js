let slider, colorPicker, bgPicker; 
let PennelliSelect, TemplateSelect; 
let mode = "pen"; 
let bgType = "carta"; 
let telaDisegno; 
let cronologia = []; 
let maxUndo = 20;
let zoom = 1.00;
let offsetX = 0, offsetY = 0;

// --- VARIABILI TESTO ---
let caselleTesto = [];
let indiceTestoSelezionato = -1;
let showStartScreen = true;
let inputInterno; 
let activeTextX, activeTextY;

const dimensionePixel = 15; 

function preload() {
  // Font rimosso come richiesto
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  telaDisegno = createGraphics(1200, 900);
  telaDisegno.clear();
  salvaStato();

  document.oncontextmenu = () => false;

  // --- INTERFACCIA ---
  slider = createSlider(1, 100, 20);
  slider.position(120, 20);
  colorPicker = createColorPicker('#2b5797');
  colorPicker.position(120, 50);
  bgPicker = createColorPicker('#ffffff');
  bgPicker.position(120, 80);

  TemplateSelect = createSelect();
  TemplateSelect.option('Tavola libera', 'carta');
  TemplateSelect.option('Pixel art', 'quadretti');
  TemplateSelect.option('Sticker', 'sticker'); 
  TemplateSelect.changed(cambioTavola);
  TemplateSelect.position(120, 110);

  PennelliSelect = createSelect();
  PennelliSelect.option('Pen', 'pen'); 
  PennelliSelect.option('Watercolor', 'watercolor'); 
  PennelliSelect.option('Graphite', 'graphite'); 
  PennelliSelect.changed(() => { if (mode !== "gomma") mode = PennelliSelect.value(); });
  PennelliSelect.position(120, 140);

  // BOTTONI
  createButton('🖊️ BRUSH').position(400, 30).size(120, 40).mousePressed(() => {
    mode = (bgType === "quadretti") ? "pixel" : PennelliSelect.value();
  });
  createButton('🧽 RUBBER').position(400, 80).size(120, 40).mousePressed(() => mode = "gomma");
  createButton('↩ BACK').position(590, 40).size(100, 35).mousePressed(undo); 
  createButton('💾 PNG').position(710, 30).size(100, 35).mousePressed(scaricaImmagine);
  createButton('📺 Full Screen').position(600, 75).size(210, 35).mousePressed(() => fullscreen(!fullscreen()));
  createButton('Reset').position(600, 120).size(210, 35).mousePressed(() => { 
    telaDisegno.clear(); caselleTesto = []; salvaStato(); 
  });

  // --- INPUT INTERNO ---
  inputInterno = createInput('');
  inputInterno.style('background', '#fff');
  inputInterno.style('border', '2px solid pink');
  inputInterno.style('padding', '5px');
  inputInterno.style('font-family', 'monospace');
  inputInterno.hide();
}

function draw() {
  background(210); 
  if (showStartScreen) { drawStartScreen(); return; }

  let mX = (mouseX - width/2 - offsetX) / zoom + telaDisegno.width/2;
  let mY = (mouseY - height/2 - offsetY) / zoom + telaDisegno.height/2;
  let pmX = (pmouseX - width/2 - offsetX) / zoom + telaDisegno.width/2;
  let pmY = (pmouseY - height/2 - offsetY) / zoom + telaDisegno.height/2;

  push();
  translate(width/2 + offsetX, height/2 + offsetY); 
  scale(zoom);
  translate(-telaDisegno.width/2, -telaDisegno.height/2);

  if (bgType === 'sticker') drawCheckerboard(0, 0, telaDisegno.width, telaDisegno.height);
  else { fill(bgPicker.color()); noStroke(); rect(0, 0, telaDisegno.width, telaDisegno.height); }
  
  if (bgType === "quadretti") disegnaGrigliaPixel(bgPicker.color());

  image(telaDisegno, 0, 0);

  // DISEGNO TESTO
  for (let i = 0; i < caselleTesto.length; i++) {
    let t = caselleTesto[i];
    push();
    translate(t.x, t.y); rotate(t.rot); fill(t.col); textSize(t.size);
    textAlign(CENTER, CENTER); text(t.txt, 0, 0);
    if (i === indiceTestoSelezionato) {
      noFill(); stroke(255, 0, 0); strokeWeight(1/zoom); rectMode(CENTER);
      rect(0, 0, textWidth(t.txt) + 10, t.size + 10);
    }
    pop();
  }

  // LOGICA DISEGNO E SPOSTAMENTO
  if (!(keyIsPressed && key === ' ') && inputInterno.style('display') === 'none') { 
    if (mouseIsPressed && mouseButton === LEFT && mouseY > 180) {
      if (indiceTestoSelezionato !== -1) {
        caselleTesto[indiceTestoSelezionato].x = mX; caselleTesto[indiceTestoSelezionato].y = mY;
      } else {
        if (bgType === "quadretti") gestisciPixelArt(pmX, pmY, mX, mY);
        else eseguiDisegnoLibero(mX, mY, pmX, pmY);
      }
    }
  } else if (keyIsPressed && key === ' ') {
    cursor(HAND);
    if (mouseIsPressed && mouseButton === LEFT) { offsetX += mouseX - pmouseX; offsetY += mouseY - pmouseY; }
  }
  pop(); 

  drawHeaderUI();
}

function drawStartScreen() {
  push();
  background(20, 20, 20, 220);
  textAlign(CENTER, CENTER);
  fill(255, 182, 193);
  textSize(50); text("MY BRUSH TOOL, ENJOY!", width/2, height/2 - 30);
  textSize(24); text("drawing/writing tool & pixel-art maker", width/2, height/2 + 40);
  textSize(16); fill(200); text("Click anywhere to start", width/2, height - 50);
  pop();
}

function drawHeaderUI() {
  push();
  noStroke(); fill(245); rect(0, 0, width, 180);
  stroke(200); line(350, 10, 350, 170); line(560, 10, 560, 170);
  fill(60); noStroke(); textFont('sans-serif'); textSize(13);
  text("Size:", 20, 35); text("Pen Color:", 20, 65); text("Bg Color:", 20, 95); text("Layout:", 20, 125); text("Brush Type:", 20, 155);
  fill(0); text((bgType === "quadretti") ? "MODE: PIXEL ART" : "BRUSH IN USE: " + mode.toUpperCase(), 400, 155);
  pop();
}

function mousePressed() {
  if (showStartScreen) { showStartScreen = false; return; }
  let mX = (mouseX - width/2 - offsetX) / zoom + telaDisegno.width/2;
  let mY = (mouseY - height/2 - offsetY) / zoom + telaDisegno.height/2;

  if (mouseButton === RIGHT && mouseY > 180) {
    activeTextX = mX; activeTextY = mY;
    inputInterno.show();
    inputInterno.position(mouseX, mouseY);
    inputInterno.elt.focus();
  } else if (mouseButton === LEFT) {
    if (inputInterno.style('display') !== 'none') inputInterno.hide();
    indiceTestoSelezionato = -1;
    for (let i = caselleTesto.length - 1; i >= 0; i--) {
      let t = caselleTesto[i];
      if (dist(mX, mY, t.x, t.y) < t.size) { indiceTestoSelezionato = i; break; }
    }
  }
}

function keyPressed() {
  if (keyCode === ENTER && inputInterno.style('display') !== 'none') {
    let t = inputInterno.value();
    if (t !== "") {
      caselleTesto.push({x: activeTextX, y: activeTextY, txt: t, size: slider.value(), col: colorPicker.color(), rot: 0});
    }
    inputInterno.value('');
    inputInterno.hide();
  }
  
  if (indiceTestoSelezionato !== -1) {
    if (keyCode === BACKSPACE || keyCode === DELETE) { 
      caselleTesto.splice(indiceTestoSelezionato, 1); 
      indiceTestoSelezionato = -1; 
    }
    if (key === '+') caselleTesto[indiceTestoSelezionato].size += 5;
    if (key === '-') caselleTesto[indiceTestoSelezionato].size -= 5;
  }
}

function cambioTavola() { bgType = TemplateSelect.value(); mode = (bgType === "quadretti") ? "pixel" : PennelliSelect.value(); }

function gestisciPixelArt(x1, y1, x2, y2) {
  let passi = max(1, dist(x1, y1, x2, y2) / (dimensionePixel / 4)); 
  for (let i = 0; i <= passi; i++) {
    let gx = floor(lerp(x1, x2, i / passi) / dimensionePixel) * dimensionePixel;
    let gy = floor(lerp(y1, y2, i / passi) / dimensionePixel) * dimensionePixel;
    if (mode === "gomma") { telaDisegno.erase(); telaDisegno.rect(gx, gy, dimensionePixel, dimensionePixel); telaDisegno.noErase(); }
    else { telaDisegno.noStroke(); telaDisegno.fill(colorPicker.color()); telaDisegno.rect(gx, gy, dimensionePixel, dimensionePixel); }
  }
}

function eseguiDisegnoLibero(mX, mY, pmX, pmY) {
  let sz = slider.value() / zoom; let col = colorPicker.color();
  if (mode === "gomma") { telaDisegno.erase(); telaDisegno.strokeWeight(sz); telaDisegno.line(pmX, pmY, mX, mY); telaDisegno.noErase(); }
  else if (mode === "pen") { telaDisegno.stroke(col); telaDisegno.strokeWeight(sz); telaDisegno.line(pmX, pmY, mX, mY); }
  else if (mode === "watercolor") { telaDisegno.noStroke(); let r = red(col), g = green(col), b = blue(col); for (let i = 0; i < 5; i++) { telaDisegno.fill(r, g, b, 5); telaDisegno.ellipse(mX + random(-sz/2, sz/2), mY + random(-sz/2, sz/2), sz, sz); } }
  else if (mode === "graphite") { telaDisegno.stroke(red(col), green(col), blue(col), 90); for (let i = 0; i < 12; i++) { telaDisegno.strokeWeight(random(0.6, 1.8)); telaDisegno.point(mX + random(-sz/2, sz/2), mY + random(-sz/2, sz/2)); } }
}

function drawCheckerboard(x, y, w, h) { let s = 15; for (let i = 0; i < w; i += s) { for (let j = 0; j < h; j += s) { fill((i/s+j/s)%2==0?255:230); noStroke(); rect(i, j, s, s); } } }
function disegnaGrigliaPixel(c) { stroke(red(c)-40, green(c)-40, blue(c)-40, 80); strokeWeight(0.5/zoom); for (let x = 0; x <= telaDisegno.width; x += dimensionePixel) line(x, 0, x, telaDisegno.height); for (let y = 0; y <= telaDisegno.height; y += dimensionePixel) line(0, y, telaDisegno.width, y); }
function salvaStato() { cronologia.push(telaDisegno.get()); if (cronologia.length > maxUndo) cronologia.shift(); }
function undo() { if (cronologia.length > 1) { cronologia.pop(); telaDisegno.clear(); telaDisegno.image(cronologia[cronologia.length - 1], 0, 0); } }
function scaricaImmagine() { let exp = createGraphics(1200, 900); if (bgType !== 'sticker') exp.background(bgPicker.color()); exp.image(telaDisegno, 0, 0); for (let t of caselleTesto) { exp.push(); exp.translate(t.x, t.y); exp.rotate(t.rot); exp.fill(t.col); exp.textSize(t.size); exp.textAlign(CENTER, CENTER); exp.text(t.txt, 0, 0); exp.pop(); } save(exp, 'disegno.png'); }
function mouseWheel(event) { if (indiceTestoSelezionato !== -1) { caselleTesto[indiceTestoSelezionato].rot += event.delta * 0.001; return false; } zoom = constrain(zoom + (event.delta > 0 ? -0.05 : 0.05), 0.1, 5); return false; }
function mouseReleased() { if (!showStartScreen && mouseY > 180 && mouseButton === LEFT && indiceTestoSelezionato === -1) salvaStato(); }
function windowResized() { resizeCanvas(windowWidth, windowHeight); }