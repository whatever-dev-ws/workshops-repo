// WUP 2025/26
// Maud Grünewald

let px = 4;
let scaleFactor = 1.8;
let unit = px * scaleFactor; 
let state = "walk"; 
let currentPart = ""; 
let hoveredPart = ""; 
let grid = [];
let gridSizeW, gridSizeH;
let eraserMode = false;
let brushSize = 1;
let canClick = true; 

let customBgColor = null; 

let themes = [
  { name: "original blue", main: [130, 180, 240], accent: [220, 40, 40], bg: [240, 225, 100], dark: [100, 140, 200] },
  { name: "neon cyber", main: [180, 100, 255], accent: [0, 255, 200], bg: [20, 20, 40], dark: [100, 50, 150] },
  { name: "autumn earth", main: [255, 140, 0], accent: [101, 67, 33], bg: [255, 250, 230], dark: [180, 80, 0] }
];
let currentTheme = 0;

let overrides = { body: false, head: false, face: false, legs: false, tail: false, clouds: false };
let parts = { body: [], head: [], face: [], legs: [], tail: [], clouds: [] };
let ghostParts = { body: [], head: [], face: [], legs: [], tail: [], clouds: [] }; 

let catX = -250;
let walkSpeed = 7.0;
let clouds = [];
let themePreviews = []; 

let customBtn, finishBtn, hubBtn, toolBtn, brushBtn, clearBtn, exportBtn, restartBtn;
let brushPicker, sceneBgPicker; 

function setup() {
  createCanvas(800, 600);
  noSmooth();
  initializeGhostParts();
  resetAllParts();
  
  for (let i = 0; i < 3; i++) {
    themePreviews[i] = createGraphics(600, 120);
    themePreviews[i].noSmooth();
  }

  for (let i = 0; i < 6; i++) { 
    clouds.push({ 
      x: random(-100, width), y: random(50, 300), w: random(60, 130), 
      speed: random(0.3, 1.5), size: random(0.5, 0.9), offset: random(1000)
    });
  }

  customBtn = createButton('start customising');
  customBtn.position(width / 2 - 100, 25); 
  finishBtn = createButton('finish & view result');
  finishBtn.position(width - 220, 25); 
  hubBtn = createButton('back to selection');
  hubBtn.position(20, 25); 
  toolBtn = createButton('tool: brush');
  toolBtn.position(width / 2 - 205, 25);
  brushBtn = createButton('size: small');
  brushBtn.position(width / 2 - 65, 25);
  clearBtn = createButton('clear canvas');
  clearBtn.position(width / 2 + 75, 25); 
  exportBtn = createButton('export gif');
  exportBtn.position(width / 2 - 110, 25); 
  restartBtn = createButton('start over');
  restartBtn.position(20, 25); 

  brushPicker = createColorPicker(color(themes[0].main));
  brushPicker.position(20, 120);
  brushPicker.style('width', '140px');

  sceneBgPicker = createColorPicker(color(themes[0].bg));
  sceneBgPicker.position(width - 160, height - 70); 
  sceneBgPicker.style('width', '140px');
  sceneBgPicker.style('height', '50px');

  customBtn.mousePressed(() => { state = "color_pick"; canClick = false; });
  finishBtn.mousePressed(() => state = "final");
  hubBtn.mousePressed(() => { saveCurrentPart(); state = "hub"; canClick = false; });
  toolBtn.mousePressed(() => { eraserMode = !eraserMode; toolBtn.html(eraserMode ? 'tool: eraser' : 'tool: brush'); });
  brushBtn.mousePressed(() => { brushSize = (brushSize === 1) ? 2 : 1; brushBtn.html(brushSize === 1 ? 'size: small' : 'size: thick'); });
  clearBtn.mousePressed(resetGrid);
  exportBtn.mousePressed(() => saveGif('custom_cat.gif', 5));
  restartBtn.mousePressed(() => { resetAllParts(); customBgColor = null; state = "walk"; });

  applyThemeToButtons();
}

function draw() {
  let theme = themes[currentTheme];
  let bgColor = customBgColor ? customBgColor : color(theme.bg);
  background(bgColor);
  if (!mouseIsPressed) canClick = true;

  if (state === "walk" || state === "final" || state === "hub") {
    drawAndMoveClouds();
    let cx = (state === "hub") ? width / 2 : catX;
    if (state !== "hub") {
        catX += walkSpeed;
        if (catX > width + 250) catX = -250;
    }
    if (state === "hub") checkHubSelection(cx, height - 200);
    push(); translate(cx, height - 200); drawPerfectCat(frameCount * 0.22, state !== "hub", -1, hoveredPart); pop();
    if (state === "hub") drawHubUI(bgColor);
  } 
  else if (state === "color_pick") drawColorPicker();
  else if (state === "editor") drawEditor(bgColor);
  else if (state === "sky_editor") drawSkyEditor(bgColor);
  updateUI();
}

function drawColorPicker() {
  textAlign(CENTER); fill(themes[currentTheme].accent); textFont('Courier New'); textSize(22);
  text("step 1: choose a colour theme", width/2, 85);
  let boxW = 600, boxH = 120, startY = 130, spacing = 145;
  for (let i = 0; i < themes.length; i++) {
    let pg = themePreviews[i], x = (width - boxW) / 2, y = startY + (i * spacing); 
    let isHover = (mouseX > x && mouseX < x + boxW && mouseY > y && mouseY < y + boxH);
    
    pg.background(themes[i].bg); 
    
    // ONLY THE BOX OUTLINE GETS THICKER
    pg.stroke(themes[i].main); 
    pg.strokeWeight(isHover ? 8 : 2); 
    pg.noFill(); 
    pg.rect(0, 0, boxW, boxH);
    
    // RESET STROKE BEFORE DRAWING CAT (Prevents cat getting thicker)
    pg.noStroke(); 
    pg.fill(themes[i].accent);
    pg.push(); 
    pg.translate(boxW/2, boxH - 45); 
    pg.scale(0.45); 
    drawPerfectCatOnBuffer(pg, frameCount * 0.22, true, i); 
    pg.pop();

    image(pg, x, y);
    fill(themes[i].accent); textAlign(LEFT); textSize(16); text(themes[i].name, x + 20, y + 25);
    if (isHover) { 
        cursor(HAND); 
        if (mouseIsPressed && canClick) { 
            currentTheme = i; 
            brushPicker.value(color(themes[i].main).toString('#rrggbb'));
            sceneBgPicker.value(color(themes[i].bg).toString('#rrggbb'));
            customBgColor = null; 
            applyThemeToButtons(); 
            state = "hub"; 
            canClick = false; 
        } 
    }
  }
}

function getDynamicTextCol(bgColor) {
  let theme = themes[currentTheme];
  let luminance = (0.299 * red(bgColor) + 0.587 * green(bgColor) + 0.114 * blue(bgColor));
  let accent = color(theme.accent);
  let accentLum = (0.299 * red(accent) + 0.587 * green(accent) + 0.114 * blue(accent));
  if (abs(luminance - accentLum) < 70) return color(theme.main);
  return accent;
}

function updateUI() { 
  let btns = [customBtn, finishBtn, hubBtn, toolBtn, brushBtn, clearBtn, exportBtn, restartBtn]; 
  for (let b of btns) b.hide(); 
  brushPicker.hide(); sceneBgPicker.hide();
  if (state === "walk") customBtn.show(); 
  if (state === "hub") finishBtn.show(); 
  if (state === "editor") { hubBtn.show(); toolBtn.show(); brushBtn.show(); clearBtn.show(); brushPicker.show(); } 
  if (state === "sky_editor") { hubBtn.show(); sceneBgPicker.show(); }
  if (state === "final") { exportBtn.show(); restartBtn.show(); } 
  if (state === "color_pick") restartBtn.show(); 
}

function drawHubUI(bgColor) { 
  let txtCol = getDynamicTextCol(bgColor);
  textAlign(CENTER); textFont('Courier New'); fill(txtCol);
  textSize(18); text("step 2: choose a part or background to edit", width/2, 85); 
  if (hoveredPart !== "") { 
    let partName = hoveredPart === "clouds" ? "clouds" : (hoveredPart === "sky" ? "sky background" : hoveredPart.toLowerCase()); 
    if (partName === "body") partName = "torso"; 
    fill(txtCol); textSize(24); text("> edit " + partName + " <", width/2, 560); 
  } 
}

function drawSkyEditor(bgColor) {
  customBgColor = sceneBgPicker.color();
  let txtCol = getDynamicTextCol(bgColor);
  textAlign(CENTER); fill(txtCol); textFont('Courier New'); textSize(22);
  text("customising: sky background color", width/2, 80);
  textAlign(RIGHT); textSize(14); text("pick background colour:", width - 170, height - 40);
  drawAndMoveClouds();
  push(); translate(width/2, height - 200); drawPerfectCat(frameCount * 0.22, true); pop();
}

function drawEditor(bgColor) { 
  let customCol = brushPicker.color(); customCol.setAlpha(255); 
  let txtCol = getDynamicTextCol(bgColor);
  textAlign(CENTER); fill(txtCol); textFont('Courier New'); textSize(20); 
  text("customising: " + currentPart, width/2, 95); 
  textAlign(LEFT); textSize(14); fill(txtCol); text("brush colour:", 20, 110);
  let cell = gridSizeW > 35 ? 9 : 12;
  let startX = width/2 - (gridSizeW * cell)/2, startY = 150;
  fill(255, 255, 255, 220); noStroke(); rect(startX - 10, startY - 10, gridSizeW * cell + 20, gridSizeH * cell + 20, 10); 
  for(let i=0; i<gridSizeW; i++) { for(let j=0; j<gridSizeH; j++) { 
      let posX = startX + i*cell, posY = startY + j*cell; stroke(200); strokeWeight(0.5); noFill(); rect(posX, posY, cell, cell); 
      if (ghostParts[currentPart][i][j]) { let gC = color(customCol); gC.setAlpha(35); fill(gC); noStroke(); rect(posX, posY, cell, cell); } 
      if (grid[i][j]) { let opC = color(grid[i][j]); opC.setAlpha(255); fill(opC); noStroke(); rect(posX, posY, cell, cell); } 
      if (currentPart === "tail" && i === 23 && j === 23) {
        let aC = (frameCount % 40 < 20) ? color(255) : color(0);
        fill(aC); noStroke(); rect(posX + cell*0.2, posY + cell*0.2, cell*0.6, cell*0.6);
      }
  } } 
  if (mouseIsPressed && mouseY > startY && mouseY < startY + (gridSizeH * cell) && mouseX > startX && mouseX < startX + (gridSizeW * cell)) { 
    let x = floor((mouseX - startX) / cell), y = floor((mouseY - startY) / cell); 
    for (let ox = 0; ox < brushSize; ox++) for (let oy = 0; oy < brushSize; oy++) { 
      let tx = x + ox, ty = y + oy; if(tx >= 0 && tx < gridSizeW && ty >= 0 && ty < gridSizeH) grid[tx][ty] = eraserMode ? false : customCol; 
    } overrides[currentPart] = true; saveCurrentPart(); 
  } 
  push(); fill(0, 50); noStroke(); rect(0, 420, width, 180); translate(width/2, 530); scale(0.6); drawPerfectCat(frameCount * 0.22, true); pop(); 
}

function checkHubSelection(cx, cy) { 
  let mx = mouseX - cx, my = mouseY - cy; hoveredPart = ""; cursor(ARROW); 
  let hs = [{x: 10 * unit, y: -30 * unit, w: 22 * unit, h: 18 * unit, id: "face"}, {x: 10 * unit, y: -35 * unit, w: 18 * unit, h: 25 * unit, id: "head"}, {x: -25 * unit, y: -26 * unit, w: 45 * unit, h: 18 * unit, id: "body"}, {x: -36 * unit, y: -32 * unit, w: 18 * unit, h: 25 * unit, id: "tail"}, {x: -24 * unit, y: -12 * unit, w: 50 * unit, h: 20 * unit, id: "legs"}]; 
  for (let h of hs) if (mx > h.x && mx < h.x + h.w && my > h.y && my < h.y + h.h) { hoveredPart = h.id; cursor(HAND); if (mouseIsPressed && canClick) { currentPart = h.id; setGridSize(h.id); loadPartIntoGrid(); state = "editor"; canClick = false; } return; } 
  for (let c of clouds) if (mouseX > c.x && mouseX < c.x + c.w && mouseY > c.y && mouseY < c.y + 30) { hoveredPart = "clouds"; cursor(HAND); if (mouseIsPressed && canClick) { currentPart = "clouds"; setGridSize("clouds"); loadPartIntoGrid(); state = "editor"; canClick = false; } return; }
  if (mouseY > 100 && mouseY < 480) { hoveredPart = "sky"; cursor(HAND); if (mouseIsPressed && canClick) { state = "sky_editor"; canClick = false; } }
}

function drawPerfectCat(speed, animate, themeIdx = -1, highlight = "") {
  let t = themes[themeIdx === -1 ? currentTheme : themeIdx]; scale(scaleFactor); 
  let bodyY = -25 * px, move = animate ? speed : 0, mC = color(t.main), dC = color(t.dark), aC = color(t.accent);
  const getCol = (base, id) => (id === highlight) ? lerpColor(base, color(0), 0.3) : base;
  const rL = (lx, ly, ang, kang, col) => { push(); translate(lx, ly); rotate(ang); if (!overrides.legs) { fill(col); rect(-3.5*px, 0, 7*px, 12*px); translate(0, 10*px); rotate(kang); rect(-2.5*px, 0, 5.5*px, 12*px); rect(-2.5*px, 10*px, 8*px, 3*px); } else { drawPart(parts.legs, -4*px, 0); } pop(); };
  rL(-18*px, bodyY+12*px, animate?sin(move+PI)*0.5:0, animate?constrain(sin(move+PI-HALF_PI)*1.4,0,1.6):0, getCol(dC, "legs"));
  rL(12*px, bodyY+12*px, animate?sin(move)*0.5:0, animate?constrain(sin(move-HALF_PI)*1.4,0,1.6):0, getCol(dC, "legs"));
  push(); translate(-26*px, bodyY+2*px); rotate(animate ? sin(move * 0.4) * 0.15 : 0);
  if (!overrides.tail) { fill(getCol(mC, "tail")); for (let i = 0; i < 5; i++) { rotate(animate?sin(move*0.4 + i*0.2)*0.12:0); rect(-2*px, -6*px, 5*px, 7*px); translate(0, -5*px); } } else { drawPart(parts.tail, -23*px, -23*px); } pop();
  if (!overrides.body) { fill(getCol(mC, "body")); rect(-25*px, bodyY, 42*px, 16*px); } else { drawPart(parts.body, -25*px, bodyY); }
  let hX = 18*px, hY = bodyY - 8*px;
  if (!overrides.head) { fill(getCol(mC, "head")); rect(hX-8*px, hY, 16*px, 14*px); rect(hX-7*px, hY-5*px, 4*px, 5*px); rect(hX+3*px, hY-5*px, 4*px, 5*px); } else { drawPart(parts.head, hX-8*px, hY-5*px); }
  if (!overrides.face) { fill(getCol(aC, "face")); rect(hX-6*px, hY+4*px, 3*px, 4*px); rect(hX+3*px, hY+4*px, 3*px, 4*px); triangle(hX-1.5*px, hY+11*px, hX+1.5*px, hY+11*px, hX, hY+13.5*px); } else { drawPart(parts.face, hX-8*px, hY-5*px); }
  rL(-22*px, bodyY+12*px, animate?sin(move)*0.5:0, animate?constrain(sin(move-HALF_PI)*1.4,0,1.6):0, getCol(mC, "legs"));
  rL(16*px, bodyY+12*px, animate?sin(move+PI)*0.5:0, animate?constrain(sin(move+PI-HALF_PI)*1.4,0,1.6):0, getCol(mC, "legs"));
}

function drawPart(data, ox, oy) { noStroke(); for(let i=0; i<data.length; i++) for(let j=0; j<data[i].length; j++) if(data[i][j]) { fill(data[i][j]); rect(ox + i*px, oy + j*px, px, px); } }
function drawPartOnBuffer(b, d, ox, oy) { b.noStroke(); for(let i=0; i<d.length; i++) for(let j=0; j<d[i].length; j++) if(d[i][j]) { b.fill(d[i][j]); b.rect(ox + i*px, oy + j*px, px, px); } }
function drawAndMoveClouds() { let t = currentTheme; noStroke(); fill(themes[t].accent); for (let c of clouds) { c.x += c.speed; if (c.x > width + 150) c.x = -200; push(); translate(c.x, c.y); if (!overrides.clouds) rect(0, 0, c.w, 30, 15); else { scale(c.size); drawPart(parts.clouds, 0, 0); } pop(); } }
function applyThemeToButtons() { let t = themes[currentTheme]; let btns = [customBtn, finishBtn, hubBtn, toolBtn, brushBtn, clearBtn, exportBtn, restartBtn]; let bM = `rgb(${t.main[0]}, ${t.main[1]}, ${t.main[2]})`, bA = `rgb(${t.accent[0]}, ${t.accent[1]}, ${t.accent[2]})`; for (let btn of btns) { btn.style('background-color', bM); btn.style('color', bA); btn.style('border', 'none'); btn.style('padding', '10px 20px'); btn.style('font-family', 'Courier New'); btn.style('font-weight', 'bold'); btn.mouseOver(() => { btn.style('background-color', bA); btn.style('color', bM); }); btn.mouseOut(() => { btn.style('background-color', bM); btn.style('color', bA); }); } }
function drawPerfectCatOnBuffer(b, speed, animate, themeIdx) { let t = themes[themeIdx], move = animate ? speed : 0, mC = color(t.main), dC = color(t.dark), aC = color(t.accent); const rLB = (lx, ly, ang, kang, col) => { b.push(); b.translate(lx, ly); b.rotate(ang); if (!overrides.legs) { b.fill(col); b.rect(-3.5*px, 0, 7*px, 12*px); b.translate(0, 10*px); b.rotate(kang); b.rect(-2.5*px, 0, 5.5*px, 12*px); b.rect(-2.5*px, 10*px, 8*px, 3*px); } else { drawPartOnBuffer(b, parts.legs, -4*px, 0); } b.pop(); }; rLB(-18*px, 12*px, animate?sin(move+PI)*0.5:0, animate?constrain(sin(move+PI-HALF_PI)*1.4,0,1.6):0, dC); rLB(12*px, 12*px, animate?sin(move)*0.5:0, animate?constrain(sin(move-HALF_PI)*1.4,0,1.6):0, dC); b.push(); b.translate(-26*px, 2*px); b.rotate(animate ? sin(move * 0.4) * 0.15 : 0); if (!overrides.tail) { b.fill(mC); for (let i = 0; i < 5; i++) { b.rotate(animate?sin(move*0.4 + i*0.2)*0.12:0); b.rect(-2*px, -6*px, 5*px, 7*px); b.translate(0, -5*px); } } else { drawPartOnBuffer(b, parts.tail, -23*px, -23*px); } b.pop(); if (!overrides.body) { b.fill(mC); b.rect(-25*px, 0, 42*px, 16*px); } else { drawPartOnBuffer(b, parts.body, -25*px, 0); } let hX = 18*px; if (!overrides.head) { b.fill(mC); b.rect(hX-8*px, -8*px, 16*px, 14*px); b.rect(hX-7*px, -13*px, 4*px, 5*px); b.rect(hX+3*px, -13*px, 4*px, 5*px); } else { drawPartOnBuffer(b, parts.head, hX-8*px, -13*px); } if (!overrides.face) { b.fill(aC); b.rect(hX-6*px, -4*px, 3*px, 4*px); b.rect(hX+3*px, -4*px, 3*px, 4*px); b.triangle(hX-1.5*px, 3*px, hX+1.5*px, 3*px, hX, 5.5*px); } else { drawPartOnBuffer(b, parts.face, hX-8*px, -13*px); } rLB(-22*px, 12*px, animate?sin(move)*0.5:0, animate?constrain(sin(move-HALF_PI)*1.4,0,1.6):0, mC); rLB(16*px, 12*px, animate?sin(move+PI)*0.5:0, animate?constrain(sin(move+PI-HALF_PI)*1.4,0,1.6):0, mC); }
function setGridSize(p) { if (p === "body") { gridSizeW = 42; gridSizeH = 16; } else if (p === "head" || p === "face") { gridSizeW = 16; gridSizeH = 20; } else if (p === "legs") { gridSizeW = 8; gridSizeH = 24; } else if (p === "clouds") { gridSizeW = 50; gridSizeH = 20; } else if (p === "tail") { gridSizeW = 24; gridSizeH = 24; } else { gridSizeW = 40; gridSizeH = 40; } }
function loadPartIntoGrid() { grid = parts[currentPart].map(row => (Array.isArray(row) ? [...row] : row)); }
function saveCurrentPart() { parts[currentPart] = grid.map(row => (Array.isArray(row) ? [...row] : row)); }
function resetGrid() { grid = Array(gridSizeW).fill().map(() => Array(gridSizeH).fill(false)); overrides[currentPart] = false; }
function resetAllParts() { for(let k in parts) { let w=20, h=20; if(k==="body") {w=42; h=16;} else if(k==="head"||k==="face") {w=16; h=20;} else if(k==="legs") {w=8; h=24;} else if(k==="tail") {w=24; h=24;} else if(k==="clouds") {w=50; h=20;} parts[k] = Array(w).fill().map(() => Array(h).fill(false)); overrides[k] = false; } }
function initializeGhostParts() { ghostParts.body = Array(42).fill().map(() => Array(16).fill(false)); for(let i=0; i<42; i++) for(let j=0; j<16; j++) ghostParts.body[i][j] = true; ghostParts.head = Array(16).fill().map(() => Array(20).fill(false)); for(let i=0; i<16; i++) for(let j=5; j<19; j++) ghostParts.head[i][j] = true; ghostParts.face = Array(16).fill().map(() => Array(20).fill(false)); for(let i=2; i<5; i++) for(let j=9; j<13; j++) ghostParts.face[i][j] = true; for(let i=11; i<14; i++) for(let j=9; j<13; j++) ghostParts.face[i][j] = true; ghostParts.legs = Array(8).fill().map(() => Array(24).fill(false)); for(let i=1; i<7; i++) for(let j=0; j<24; j++) ghostParts.legs[i][j] = true; ghostParts.tail = Array(24).fill().map(() => Array(24).fill(false)); const t = ghostParts.tail; for(let j=18; j<24; j++) { t[22][j] = true; t[21][j] = true; } for(let j=10; j<18; j++) { t[21][j] = true; t[20][j] = true; } t[20][9] = true; t[19][9] = true; t[19][8] = true; t[18][8] = true; ghostParts.clouds = Array(50).fill().map(() => Array(20).fill(false)); for(let i=5; i<45; i++) for(let j=5; j<15; j++) ghostParts.clouds[i][j] = true; }