let state = "HOME";
let userPhrase = "";
let inputPhrase, btnEnter;
let btnTurbulence, btnOptical, btnKinetic, btnLiquid; 
let sliderSize, sliderDistort, sliderSpeed, sliderEchoes, sliderDetail; 
let btnSaveGIF, btnExportPNG, btnToggleUI, btnBack;
let cpText, cpBG; 
let showUI = true; 
let pg;

function setup() {
  let cnv = createCanvas(500, 500);
  cnv.style('display', 'block');
  cnv.style('margin', '20px auto');
  
  pg = createGraphics(500, 500);

  // --- UI SETUP ---
  
  // 1. INPUT PHRASE
  inputPhrase = createInput('').attribute('placeholder', 'Type here...');
  inputPhrase.size(220); 
  inputPhrase.style('text-align', 'center');
  
  btnEnter = createButton('ENTER');
  styleButton(btnEnter, '#333');
  btnEnter.size(100, 35); 
  btnEnter.mousePressed(() => {
    if (inputPhrase.value().trim() !== "") {
      userPhrase = inputPhrase.value();
      changeState("CHOOSE_EFFECT");
    }
  });

  // 2. BACK BUTTON (Modificato da icona a testo)
  btnBack = createButton('GO BACK');
  styleBackButton(btnBack);
  btnBack.mousePressed(goBack);

  // 3. EFFECT BUTTONS
  btnTurbulence = createButton('Turbulence'); styleButton(btnTurbulence, '#008CBA');
  btnTurbulence.mousePressed(() => changeState("TURBULENCE"));
  btnOptical = createButton('Optical Warp'); styleButton(btnOptical, '#444');
  btnOptical.mousePressed(() => changeState("OPTICAL"));
  btnKinetic = createButton('Kinetic Stretch'); styleButton(btnKinetic, '#9b59b6');
  btnKinetic.mousePressed(() => changeState("KINETIC"));
  btnLiquid = createButton('Liquid Echo'); styleButton(btnLiquid, '#00f5d4');
  btnLiquid.style('color', '#333');
  btnLiquid.mousePressed(() => changeState("LIQUID"));

  // 4. SLIDERS & COLORS
  sliderSize = createSlider(10, 250, 80);
  sliderDistort = createSlider(0, 100, 40); 
  sliderSpeed = createSlider(0, 100, 25);
  sliderEchoes = createSlider(1, 20, 8);   
  sliderDetail = createSlider(1, 100, 50);

  cpText = createColorPicker('#000000');
  cpBG = createColorPicker('#ffffff');
  cpText.size(45, 30);
  cpBG.size(45, 30);

  // 5. VIEW & EXPORT
  btnToggleUI = createButton('VIEW');
  styleButton(btnToggleUI, '#333');
  btnToggleUI.size(50, 25);
  btnToggleUI.mousePressed(() => { showUI = !showUI; updateUIVisibility(); });

  btnSaveGIF = createButton('SAVE GIF');
  styleButton(btnSaveGIF, '#4CAF50');
  btnSaveGIF.size(90, 30);
  btnSaveGIF.mousePressed(() => {
    showUI = false; updateUIVisibility();
    setTimeout(() => { 
      saveGif('typography_art.gif', 3); 
      setTimeout(() => { showUI = true; updateUIVisibility(); }, 3100); 
    }, 50);
  });

  btnExportPNG = createButton('EXPORT PNG');
  styleButton(btnExportPNG, '#e67e22');
  btnExportPNG.size(105, 30);
  btnExportPNG.mousePressed(() => {
    showUI = false; draw();
    saveCanvas('type_design_export', 'png');
    showUI = true; updateUIVisibility();
  });

  positionElements();
  changeState("HOME");
}

function draw() {
  background(cpBG.color());
  
  textFont('sans-serif');
  pg.textFont('sans-serif');

  if (state === "HOME" || state === "CHOOSE_EFFECT") { 
    background(245);
    drawPatternBackground(); 
  }

  let artAreaHeight = (showUI) ? 340 : height;
  let centerY = artAreaHeight / 2;

  if (state === "HOME") drawHome();
  else if (state === "CHOOSE_EFFECT") drawEffectChoice();
  else if (state === "TURBULENCE") drawTurbulenceEffect(centerY);
  else if (state === "OPTICAL") drawOpticalEffect(centerY);
  else if (state === "KINETIC") drawKineticEffect(centerY);
  else if (state === "LIQUID") drawLiquidEffect(centerY);
  
  if (state !== "HOME" && state !== "CHOOSE_EFFECT" && showUI) drawLabels();
}

// --- NAVIGATION & POSITIONING ---

function positionElements() {
  let canvasW = 500;
  let cx = (windowWidth - canvasW) / 2; 
  let cy = 20;

  inputPhrase.position(cx + (canvasW - 220) / 2, cy + 240); 
  btnEnter.position(cx + (canvasW - 100) / 2, cy + 290);
  
  btnBack.position(cx + 15, cy + 15);
  btnToggleUI.position(cx + 435, cy + 15); 

  btnTurbulence.position(cx + 100, cy + 180); btnOptical.position(cx + 260, cy + 180);
  btnKinetic.position(cx + 100, cy + 240); btnLiquid.position(cx + 260, cy + 240);

  let sY = cy + 355; 
  sliderSize.position(cx + 110, sY); 
  sliderDistort.position(cx + 110, sY + 25);
  sliderSpeed.position(cx + 110, sY + 50); 
  sliderEchoes.position(cx + 110, sY + 75);
  sliderDetail.position(cx + 110, sY + 100);
  
  cpText.position(cx + 440, sY + 5); 
  cpBG.position(cx + 440, sY + 45);
  btnSaveGIF.position(cx + 380, sY + 80); 
  btnExportPNG.position(cx + 380, sY + 115);
}

function changeState(newState) {
  state = newState; showUI = true; 
  let all = [inputPhrase, btnEnter, btnTurbulence, btnOptical, btnKinetic, btnLiquid, sliderSize, sliderDistort, sliderSpeed, sliderEchoes, sliderDetail, btnSaveGIF, btnExportPNG, btnToggleUI, btnBack, cpText, cpBG];
  all.forEach(el => el.hide());

  if (state === "HOME") { 
    inputPhrase.show(); btnEnter.show(); 
  } else if (state === "CHOOSE_EFFECT") { 
    [btnTurbulence, btnOptical, btnKinetic, btnLiquid, btnBack].forEach(el => el.show()); 
  } else { 
    btnToggleUI.show(); btnBack.show(); 
    updateUIVisibility(); 
  }
}

function updateUIVisibility() {
  let s = [sliderSize, sliderDistort, sliderSpeed, sliderEchoes, sliderDetail, btnSaveGIF, btnExportPNG, cpText, cpBG];
  if (!showUI) s.forEach(el => el.hide()); 
  else {
    s.forEach(el => el.show());
    if (state !== "TURBULENCE" && state !== "LIQUID") sliderEchoes.hide();
  }
}

// --- DRAWING EFFECTS ---

function drawTurbulenceEffect(yC) {
  let baseSize = sliderSize.value();
  let layers = sliderEchoes.value();
  let intensity = sliderDistort.value() * 0.25;
  let speed = sliderSpeed.value() * 0.002;
  let freq = sliderDetail.value() * 0.05;
  textAlign(CENTER, CENTER);
  let words = userPhrase.toUpperCase().split(' ');
  let spacing = baseSize * 1.05;
  let yStart = yC - ((words.length - 1) * spacing) / 2;
  for (let i = 0; i < words.length; i++) {
    let pSize = getScaledSize(words[i], baseSize);
    let wordY = yStart + i * spacing;
    for (let j = layers; j > 0; j--) {
      let alpha = map(j, 1, layers, 180, 5);
      let waveX = sin(frameCount * speed * 10 + j * freq) * (j * intensity);
      let c = color(cpText.color()); c.setAlpha(alpha);
      fill(c); textSize(pSize + (j * 1.2)); text(words[i], width / 2 + waveX, wordY);
    }
    fill(cpText.color()); textSize(pSize); text(words[i], width / 2, wordY);
  }
}

function drawOpticalEffect(yC) {
  let baseSize = getScaledSize(userPhrase.toUpperCase(), sliderSize.value());
  let distort = sliderDistort.value();
  let speed = sliderSpeed.value() * 0.05;
  let density = floor(map(sliderDetail.value(), 1, 100, 10, 120));
  pg.clear(); pg.background(cpBG.color());
  pg.fill(cpText.color()); pg.textAlign(CENTER, CENTER); pg.textSize(baseSize); pg.textStyle(BOLD);
  pg.text(userPhrase.toUpperCase(), pg.width / 2, yC);
  let w = width / density;
  for (let i = 0; i < density; i++) {
    let sx = i * w;
    let wave = sin(frameCount * speed + i * 0.3) * distort;
    copy(pg, sx, 0, w, height, sx, wave, w, height);
  }
}

function drawKineticEffect(yC) {
  let size = getScaledSize(userPhrase.toUpperCase(), sliderSize.value());
  let distort = sliderDistort.value();
  let speed = sliderSpeed.value() * 0.002;
  let tracking = map(sliderDetail.value(), 1, 100, 0.5, 1.4);
  textAlign(CENTER, CENTER); textSize(size); fill(cpText.color());
  let letters = userPhrase.toUpperCase().split('');
  let spacing = size * tracking;
  for (let i = 0; i < letters.length; i++) {
    let x = (width/2 - (letters.length * spacing)/2) + i * spacing + spacing/2;
    let off = sin(frameCount * speed + i * 0.5) * distort;
    push(); translate(x, yC); rotate(radians(off * 0.2)); scale(1 + off/100, 1 - off/100);
    text(letters[i], 0, 0); pop();
  }
}

function drawLiquidEffect(yC) {
  let size = getScaledSize(userPhrase.toUpperCase(), sliderSize.value());
  let spread = sliderDistort.value() * 0.5;
  let speed = sliderSpeed.value() * 0.05;
  let count = sliderEchoes.value();
  let zoom = map(sliderDetail.value(), 1, 100, 0.9, 1.15);
  textAlign(CENTER, CENTER); textSize(size);
  for (let i = count; i >= 0; i--) {
    let alpha = map(i, 0, count, 255, 0);
    let offset = i * (spread * 0.5);
    let x = width/2 + cos(frameCount * speed * 0.01 + i * 0.2) * offset;
    let y = yC + sin(frameCount * speed * 0.02 + i * 0.1) * (offset * 0.5);
    push(); translate(x, y); scale(1 + (i * (zoom - 1) * 0.1));
    let c = color(cpText.color()); c.setAlpha(alpha);
    fill(c); text(userPhrase.toUpperCase(), 0, 0); pop();
  }
}

// --- UTILS & TEXT ---

function drawLabels() {
  push(); 
  let bgB = brightness(cpBG.color());
  fill(bgB > 50 ? 40 : 220); 
  textSize(10); textAlign(LEFT); noStroke(); textFont('sans-serif');
  let b = 370; 
  text("SIZE", 25, b); text("DISTORT", 25, b + 25); text("SPEED", 25, b + 50);
  let dL = "DETAIL";
  if (state === "TURBULENCE") { text("LAYERS", 25, b + 75); dL = "FREQ"; }
  else if (state === "LIQUID") { text("COUNT", 25, b + 75); dL = "ZOOM"; }
  text(dL, 25, b + 100); 
  
  textAlign(RIGHT);
  textSize(10);
  text("TEXT COLOR", 440, b + 20);
  text("BG COLOR", 440, b + 60);
  pop();
}

function styleButton(btn, col) {
  btn.size(140, 35); btn.style('background-color', col); btn.style('color', 'white');
  btn.style('border', 'none'); btn.style('border-radius', '4px'); btn.style('cursor', 'pointer');
  btn.style('font-weight', 'bold'); btn.hide();
}

// STILE PULSANTE BACK AGGIORNATO
function styleBackButton(btn) {
  btn.size(80, 30); 
  btn.style('background-color', '#fff'); 
  btn.style('color', '#333');
  btn.style('border', '1px solid #ccc'); 
  btn.style('border-radius', '4px'); 
  btn.style('cursor', 'pointer');
  btn.style('font-size', '11px'); 
  btn.style('font-weight', 'bold');
  btn.hide();
}

function getScaledSize(txt, baseSize) {
  textSize(baseSize); let w = textWidth(txt);
  return (w > width - 80) ? baseSize * ((width - 80) / w) : baseSize;
}

function drawPatternBackground() {
  stroke(220); strokeWeight(0.5);
  for (let i = 0; i < width; i += 20) line(i, 0, i, height);
  for (let i = 0; i < height; i += 20) line(0, i, width, i);
  noStroke();
}

function drawHome() {
  textAlign(CENTER); fill(40); textSize(32); textStyle(BOLD); text("Type Designer Tool", width / 2, 140);
  textSize(16); fill(100); textStyle(NORMAL); text("Enter a word to start", width / 2, 200);
}

function drawEffectChoice() {
  textAlign(CENTER); fill(40); textSize(28); textStyle(BOLD); text("Choose a Style", width / 2, 120);
}

function goBack() { (state === "CHOOSE_EFFECT") ? changeState("HOME") : changeState("CHOOSE_EFFECT"); }
function keyPressed() { if (keyCode === ESCAPE) goBack(); }
function windowResized() { positionElements(); }