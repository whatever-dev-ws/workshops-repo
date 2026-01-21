let state = "HOME";
let userPhrase = "";
let typing = "";
let pg;

// Calibrated Parameters
let sSize = 80, sDistort = 40, sSpeed = 25, sLayers = 8, sDetail = 50;
let cpText = [0, 0, 0], cpBG = [255, 255, 255];
let showUI = true, isExporting = false;
let paletteOpen = false;

function setup() {
  createCanvas(500, 500);
  pg = createGraphics(500, 500);
  textFont('sans-serif');
}

function draw() {
  background(cpBG);
  
  let artAreaHeight = (showUI && !isExporting) ? 300 : height;
  let centerY = artAreaHeight / 2;

  if (state === "HOME") {
    drawPatternBackground();
    drawHome();
  } else if (state === "CHOOSE_EFFECT") {
    drawPatternBackground();
    drawEffectChoice();
  } else {
    push();
    if (state === "TURBULENCE") drawTurbulenceEffect(centerY);
    else if (state === "OPTICAL") drawOpticalEffect(centerY);
    else if (state === "KINETIC") drawKineticEffect(centerY);
    else if (state === "LIQUID") drawLiquidEffect(centerY);
    pop();
  }

  if (!isExporting) drawManualUI();
}

// --- INTERFACE ---

function drawManualUI() {
  push();
  if (state === "HOME") {
    fill(245); stroke(200);
    rect(125, 230, 250, 40, 5);
    fill(50); noStroke(); textAlign(CENTER, CENTER); textSize(16);
    text(typing + (frameCount % 60 < 30 ? "|" : ""), 250, 250);
    drawBtn("ENTER", 200, 285, 100, 35, [50, 50, 50]);
  } 
  else if (state === "CHOOSE_EFFECT") {
    drawBtn("Turbulence", 80, 180, 150, 40, [0, 140, 186]);
    drawBtn("Optical Warp", 270, 180, 150, 40, [70, 70, 70]);
    drawBtn("Kinetic Stretch", 80, 240, 150, 40, [155, 89, 182]);
    drawBtn("Liquid Echo", 270, 240, 150, 40, [0, 245, 212], [50, 50, 50]);
    drawBtn("GO BACK", 20, 20, 80, 30, [255, 255, 255], [50, 50, 50]);
  } 
  else {
    drawBtn("BACK", 10, 10, 60, 25, [255, 255, 255], [50, 50, 50]);
    drawBtn("PNG", 80, 10, 50, 25, [230, 126, 34]);
    drawBtn("GIF", 140, 10, 50, 25, [46, 204, 113]);
    drawBtn(showUI ? "HIDE UI" : "VIEW", 420, 10, 70, 25, [50, 50, 50]);
    
    if (showUI) {
      drawCustomSlider("SIZE", 80, 330, sSize, 10, 200, (v) => sSize = v);
      drawCustomSlider("DISTORT", 80, 355, sDistort, 0, 100, (v) => sDistort = v);
      drawCustomSlider("SPEED", 80, 380, sSpeed, 0, 100, (v) => sSpeed = v);
      let labelDetail = (state === "KINETIC") ? "SPACING" : (state === "TURBULENCE" || state === "LIQUID" ? "LAYERS" : "DETAIL");
      drawCustomSlider(labelDetail, 80, 405, sDetail, 1, 100, (v) => sDetail = v);
      
      drawBtn(paletteOpen ? "CLOSE COLORS" : "COLORS / SHADES", 15, 440, 120, 40, [80, 80, 80]);
      
      if (paletteOpen) {
        fill(250, 250, 250, 245); stroke(200);
        rect(150, 320, 335, 165, 8);
        drawFullSpectrumPicker("TEXT COLOR", 170, 350, (c) => cpText = c);
        drawFullSpectrumPicker("BG COLOR", 170, 420, (c) => cpBG = c);
      }
    }
  }
  pop();
}

function drawFullSpectrumPicker(label, x, y, callback) {
  push();
  fill(50); textAlign(LEFT); textSize(10); textStyle(BOLD); noStroke();
  text(label, x, y - 5);
  
  // 1. Rainbow Hue Spectrum
  let specW = 300, specH = 20;
  for (let i = 0; i < specW; i++) {
    let hueVal = map(i, 0, specW, 0, 360);
    push();
    colorMode(HSB);
    stroke(hueVal, 80, 90);
    line(x + i, y, x + i, y + specH);
    pop();
  }
  
  // 2. Grayscale Bar
  for (let i = 0; i < specW; i++) {
    let grayVal = map(i, 0, specW, 0, 255);
    stroke(grayVal);
    line(x + i, y + specH + 5, x + i, y + specH + 15);
  }
  
  // Interaction
  if (mouseIsPressed) {
    if (overRect(x, y, specW, specH)) {
      push(); colorMode(HSB);
      let c = color(map(mouseX, x, x + specW, 0, 360), 80, 90);
      callback([red(c), green(c), blue(c)]);
      pop();
    } else if (overRect(x, y + specH + 5, specW, 10)) {
      let g = map(mouseX, x, x + specW, 0, 255);
      callback([g, g, g]);
    }
  }
  pop();
}

function drawBtn(label, x, y, w, h, col, tCol = [255, 255, 255]) {
  push();
  fill(col); stroke(200); strokeWeight(1);
  rect(x, y, w, h, 4);
  fill(tCol); noStroke(); textAlign(CENTER, CENTER); textSize(11); textStyle(BOLD);
  text(label, x + w/2, y + h/2);
  pop();
}

function drawCustomSlider(label, x, y, val, minV, maxV, callback) {
  push();
  fill(100); textAlign(LEFT, CENTER); textSize(10); noStroke();
  text(label, 15, y + 5);
  stroke(220); strokeWeight(3); line(x, y + 5, x + 180, y + 5);
  let posX = map(val, minV, maxV, x, x + 180);
  noStroke(); fill(50, 150, 250);
  ellipse(posX, y + 5, 12, 12);
  if (mouseIsPressed && !paletteOpen && mouseX > x - 10 && mouseX < x + 190 && mouseY > y - 10 && mouseY < y + 20) {
    let newVal = map(constrain(mouseX, x, x + 180), x, x + 180, minV, maxV);
    callback(newVal);
  }
  pop();
}

// --- LOGIC ---

function mousePressed() {
  if (state === "HOME" && overRect(200, 285, 100, 35)) submitText();
  else if (state === "CHOOSE_EFFECT") {
    if (overRect(80, 180, 150, 40)) state = "TURBULENCE";
    if (overRect(270, 180, 150, 40)) state = "OPTICAL";
    if (overRect(80, 240, 150, 40)) state = "KINETIC";
    if (overRect(270, 240, 150, 40)) state = "LIQUID";
    if (overRect(20, 20, 80, 30)) state = "HOME";
  } else {
    if (overRect(10, 10, 60, 25)) state = "CHOOSE_EFFECT";
    if (overRect(80, 10, 50, 25)) exportPNG();
    if (overRect(140, 10, 50, 25)) exportGIF();
    if (overRect(420, 10, 70, 25)) showUI = !showUI;
    if (showUI && overRect(15, 440, 120, 40)) paletteOpen = !paletteOpen;
  }
}

function keyPressed() {
  if (state === "HOME") {
    if (keyCode === ENTER) submitText();
    else if (keyCode === BACKSPACE) typing = typing.slice(0, -1);
    else if (key.length === 1) typing += key;
  }
}

function submitText() {
  if (typing.trim() !== "") { userPhrase = typing; state = "CHOOSE_EFFECT"; }
}

function overRect(x, y, w, h) {
  return mouseX >= x && mouseX <= x + w && mouseY >= y && mouseY <= y + h;
}

// --- EXPORT ---

function exportPNG() {
  isExporting = true; draw();
  saveCanvas('my_type_art', 'png');
  isExporting = false;
}

function exportGIF() {
  isExporting = true;
  saveGif('my_type_art', 3); 
  setTimeout(() => { isExporting = false; }, 100);
}

// --- EFFECTS ---

function drawKineticEffect(yC) {
  let size = getScaledSize(userPhrase, sSize);
  let tracking = map(sDetail, 1, 100, 0.5, 1.4);
  let speed = sSpeed * 0.02; 
  let letters = userPhrase.toUpperCase().split('');
  let spacing = size * tracking;
  textAlign(CENTER, CENTER); textSize(size); fill(cpText);
  for (let i = 0; i < letters.length; i++) {
    let x = (width/2 - (letters.length * spacing)/2) + i * spacing + spacing/2;
    let off = sin(frameCount * speed + i * 0.5) * sDistort;
    push(); translate(x, yC); rotate(radians(off * 0.15));
    scale(1 + off/250, 1 - off/250); 
    text(letters[i], 0, 0);
    pop();
  }
}

function drawTurbulenceEffect(yC) {
  let words = userPhrase.toUpperCase().split(' ');
  let size = getScaledSize(userPhrase, sSize);
  let speed = sSpeed * 0.01; 
  textAlign(CENTER, CENTER);
  for (let i = 0; i < words.length; i++) {
    let y = yC + (i - (words.length-1)/2) * (size * 1.1);
    let layers = floor(map(sDetail, 1, 100, 2, 12));
    for (let j = layers; j > 0; j--) {
      let off = sin(frameCount * speed * 2 + j * 0.4) * (j * (sDistort*0.15));
      fill(cpText[0], cpText[1], cpText[2], map(j, 0, layers, 160, 10));
      textSize(size + j*1.5); text(words[i], width/2 + off, y);
    }
    fill(cpText); textSize(size); text(words[i], width/2, y);
  }
}

function drawOpticalEffect(yC) {
  pg.clear(); pg.background(cpBG); pg.fill(cpText);
  pg.textAlign(CENTER, CENTER); pg.textSize(getScaledSize(userPhrase, sSize));
  pg.text(userPhrase.toUpperCase(), width/2, yC); 
  let density = floor(map(sDetail, 1, 100, 10, 80));
  let speed = sSpeed * 0.015;
  let w = width/density;
  for (let i = 0; i < density; i++) {
    let sx = i * w;
    let wave = sin(frameCount * speed + i * 0.25) * sDistort;
    copy(pg, sx, 0, w, height, sx, wave, w, height);
  }
}

function drawLiquidEffect(yC) {
  let size = getScaledSize(userPhrase, sSize);
  let speed = sSpeed * 0.01;
  textAlign(CENTER, CENTER); textSize(size);
  let layers = floor(map(sDetail, 1, 100, 4, 18));
  for (let i = layers; i >= 0; i--) {
    let alpha = map(i, 0, layers, 255, 0);
    let x = width/2 + cos(frameCount * speed + i * 0.2) * (i * sDistort * 0.15);
    let y = yC + sin(frameCount * speed * 1.5 + i * 0.1) * (i * sDistort * 0.1);
    fill(cpText[0], cpText[1], cpText[2], alpha);
    text(userPhrase.toUpperCase(), x, y);
  }
}

// --- UTILITIES ---

function getScaledSize(txt, base) {
  textSize(base);
  let w = textWidth(txt);
  return w > width - 60 ? base * ((width - 60) / w) : base;
}

function drawPatternBackground() {
  stroke(235); strokeWeight(1);
  for (let i = 0; i < width; i += 25) line(i, 0, i, height);
  for (let i = 0; i < height; i += 25) line(0, i, width, i);
}

function drawHome() {
  textAlign(CENTER); fill(50); textSize(30); textStyle(BOLD); noStroke();
  text("Type Designer Tool", width/2, 140);
  textSize(14); fill(120); textStyle(NORMAL);
  text("Enter text and press ENTER", width/2, 175);
}

function drawEffectChoice() {
  textAlign(CENTER); fill(50); textSize(24); textStyle(BOLD); noStroke();
  text("Choose a Style", width/2, 100);
h}