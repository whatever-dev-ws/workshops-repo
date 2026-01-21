// --- BUFFERS ---
let pingLayer, pongLayer; 
let glassLayer; 
let isExporting = false; 
let isRecordingGIF = false; 
let gifEndFrame = 0; 

// INTERACTION STATE
let isDragging = false;
let dragTargetType = null; // 'TEXT' or 'GLASS'
let isDraggingGradKnob = false;
let isDraggingMotionWheel = false;
let isDraggingMoveWheel = false; 

// GAME STATE & ASSETS
let isStarted = false;
let startButton;

// STATE
let textObjects = [];
let activeIndex = 0; 
let customFont = null;
let defaultFont = 'Georgia'; // System safe font

// SETTINGS
let globalSettings = {
  canvasW: 800,
  canvasH: 600,
  bgColor: '#111111',
  isTransparent: false
};

// CONSTANTS FOR LOOPING
const TOTAL_LOOP_FRAMES = 180; 

// UI DOM ELEMENTS
let domElements = {};
let uiGroups = {};
let uiContainer; 
let cnv; 

// ----------------------------------------------------
// PRELOAD
// ----------------------------------------------------
function preload() {
  // No external assets required
}

// ----------------------------------------------------
// CLASS: TEXT ITEM
// ----------------------------------------------------
class TextItem {
  constructor(str, x, y) {
    this.text = str;
    this.pos = createVector(x, y);
    this.fontSize = 150;
    this.font = customFont || defaultFont;
    
    // FLAGS
    this.hasLiquid = false;
    this.hasScanner = false; 
    this.hasMotion = false;
    this.hasGlass = false;
    this.hasRepeater = false; 
    
    // PARAMS
    this.params = {
      useGradient: false,
      useGlobalGradient: false, 
      gradientAngle: 90,
      colorMain: '#ffffff',
      colorSec: '#ff0055',
      
      // REPEATER
      repeatX: 0, 
      repeatY: 0, 
      repeatGapX: 200, 
      repeatGapY: 150, 
      
      // SCANNER - PIXEL GLITCH
      scannerAmp: 50,
      scannerFreq: 0.02,
      scannerNoise: 0,

      // SCANNER - MOVEMENT
      moveEnabled: false,   
      moveAngle: 0,          
      moveDist: 100,        
      moveSpeed: 1,          
      
      // LIQUID
      liquidFlow: 50,
      liquidTurbulence: 20,
      liquidSeed: random(100),
      
      // MOTION
      motionAngle: 45,
      motionDist: 60,
      motionRepeats: 15,
      motionTrailAlpha: 100,
      motionMainAlpha: 255,
      
      // GLASS
      glassBlur: 8,
      glassWidth: 300,
      glassHeight: 400,
      glassStroke: true,
      glassTextColor: '#ff0055',
      glassPos: createVector(x, y) 
    };
  }

  getRenderPos() {
    let rx = this.pos.x;
    let ry = this.pos.y;
    
    if (this.hasScanner && this.params.moveEnabled) {
      // FRAME BASED PROGRESS (0.0 to 1.0)
      let progress = (frameCount % TOTAL_LOOP_FRAMES) / TOTAL_LOOP_FRAMES;
      
      let cycle = progress * TWO_PI * this.params.moveSpeed;
      let wave = sin(cycle); 
      let dist = this.params.moveDist;
      let rads = radians(this.params.moveAngle);
      rx += cos(rads) * (wave * dist);
      ry += sin(rads) * (wave * dist);
    }
    return createVector(rx, ry);
  }

  drawBase(pg, overrideColor) {
    pg.clear();
    pg.textSize(this.fontSize);
    pg.textFont(this.font);
    pg.textAlign(CENTER, CENTER);
    pg.textLeading(this.fontSize * 1.1); 
    pg.noStroke();
    
    let centerPos = this.getRenderPos();
    
    let xStart = 0; let xEnd = 0;
    let yStart = 0; let yEnd = 0;
    
    if (this.hasRepeater) {
      xStart = -this.params.repeatX; xEnd = this.params.repeatX;
      yStart = -this.params.repeatY; yEnd = this.params.repeatY;
    }

    // PRE-CALCULATE GLOBAL GRADIENT
    let globalGrad = null;
    let ctx = pg.drawingContext;
    if (this.params.useGradient && this.params.useGlobalGradient) {
      let ang = radians(this.params.gradientAngle);
      let gridW = (this.params.repeatX * this.params.repeatGapX);
      let gridH = (this.params.repeatY * this.params.repeatGapY);
      let r = max(gridW, gridH) + (this.fontSize * 2);
      
      let x1 = centerPos.x + cos(ang + PI) * r;
      let y1 = centerPos.y + sin(ang + PI) * r;
      let x2 = centerPos.x + cos(ang) * r;
      let y2 = centerPos.y + sin(ang) * r;

      globalGrad = ctx.createLinearGradient(x1, y1, x2, y2);
      globalGrad.addColorStop(0, this.params.colorMain);
      globalGrad.addColorStop(1, this.params.colorSec);
    }

    // DRAW GRID
    for (let ix = xStart; ix <= xEnd; ix++) {
      for (let iy = yStart; iy <= yEnd; iy++) {
        
        let drawX = centerPos.x + (ix * this.params.repeatGapX);
        let drawY = centerPos.y + (iy * this.params.repeatGapY);

        if (overrideColor) {
          pg.fill(overrideColor);
          pg.text(this.text, drawX, drawY);
        } 
        else if (this.params.useGradient) {
          if (this.params.useGlobalGradient && globalGrad) {
             ctx.fillStyle = globalGrad;
             pg.text(this.text, drawX, drawY);
          } else {
             let ang = radians(this.params.gradientAngle);
             let r = this.fontSize * 0.6; 
             let x1 = drawX + cos(ang + PI) * r;
             let y1 = drawY + sin(ang + PI) * r;
             let x2 = drawX + cos(ang) * r;
             let y2 = drawY + sin(ang) * r;

             let grad = ctx.createLinearGradient(x1, y1, x2, y2);
             grad.addColorStop(0, this.params.colorMain);
             grad.addColorStop(1, this.params.colorSec);
             ctx.fillStyle = grad;
             pg.text(this.text, drawX, drawY);
          }
        } else {
          pg.fill(this.params.colorMain);
          pg.text(this.text, drawX, drawY);
        }
      }
    }
  }

  checkHit(mx, my) {
    if (this.hasGlass) {
      let gx = this.params.glassPos.x;
      let gy = this.params.glassPos.y;
      let w = this.params.glassWidth;
      let h = this.params.glassHeight;
      if (mx > gx - w/2 && mx < gx + w/2 && my > gy - h/2 && my < gy + h/2) {
        return 'GLASS';
      }
    }

    let rPos = this.getRenderPos();
    textSize(this.fontSize); textFont(this.font);
    
    let w = textWidth(this.text);
    let lines = this.text.split('\n').length;
    let h = this.fontSize * lines * 1.1; 
    
    let left = rPos.x - w/2;
    let right = rPos.x + w/2;
    let top = rPos.y - h/2;
    let bottom = rPos.y + h/2;
    
    if (mx > left && mx < right && my > top && my < bottom) {
      return 'TEXT';
    }

    return null;
  }
}

// ----------------------------------------------------
// SETUP & DRAW
// ----------------------------------------------------
function setup() {
  cnv = createCanvas(windowWidth, windowHeight);
  cnv.position(0, 0); 
  cnv.id('myCanvas'); 
  cnv.drop(handleFileDrop);
  
  pixelDensity(2); 
  frameRate(60); 
  
  // Inject basic body styles via JS to ensure dark mode
  let body = select('body');
  if(body) {
    body.style('background-color', '#222');
    body.style('margin', '0');
    body.style('overflow', 'hidden');
  }
  
  initBuffers(width, height);
  
  createInterface(); 
  uiContainer.hide();
  
  // Safe Button Creation
  startButton = createButton('Start typing');
  centerStartButton();
  startButton.size(200, 60);
  startButton.style('font-size', '24px');
  startButton.style('background', '#00ffcc');
  startButton.style('border', 'none');
  startButton.style('cursor', 'pointer');
  startButton.style('font-weight', 'bold');
  startButton.style('border-radius', '30px');
  startButton.mousePressed(() => {
    isStarted = true;
    startButton.hide();
    resizeCanvas(globalSettings.canvasW, globalSettings.canvasH);
    cnv.position(290, 20); 
    initBuffers(globalSettings.canvasW, globalSettings.canvasH);
    uiContainer.show();
    addTextObject("Typo Tool");
  });
}

function initBuffers(w, h) {
  pingLayer = createGraphics(w, h); pingLayer.pixelDensity(2);
  pongLayer = createGraphics(w, h); pongLayer.pixelDensity(2);
  glassLayer = createGraphics(w, h); glassLayer.pixelDensity(2);
}

function handleFileDrop(file) {
  console.log("File selected:", file.name, file.subtype); 
  let ext = file.name.split('.').pop().toLowerCase();
  if (file.subtype === 'ttf' || file.subtype === 'otf' || ext === 'ttf' || ext === 'otf') {
    customFont = loadFont(file.data, () => {
      console.log("Font loaded.");
      for(let t of textObjects) t.font = customFont;
    });
  } else {
    console.log("Not a recognized font file.");
  }
}

function centerStartButton() {
  if(startButton) {
    // Moved down slightly (+50) to avoid overlapping the new title text
    startButton.position(windowWidth/2 - 100, windowHeight/2 + 50);
  }
}

function windowResized() {
  if (!isStarted) {
    resizeCanvas(windowWidth, windowHeight);
    centerStartButton();
  }
}

function draw() {
  if (!isStarted) {
    drawStartScreen();
  } else {
    drawApp();
  }
}

function drawStartScreen() {
  // 1. PROCEDURAL GRID BACKGROUND
  background(20);
  stroke(40);
  strokeWeight(1);
  let gridSize = 40;
  
  // Moving grid effect
  let offset = (frameCount * 0.5) % gridSize;
  
  for(let x = 0; x < width; x += gridSize) {
    line(x, 0, x, height);
  }
  for(let y = 0; y < height; y += gridSize) {
    line(0, y + offset, width, y + offset);
    if(y + offset > height) line(0, (y + offset) - height, width, (y + offset) - height);
  }

  // Darker Overlay so text pops out
  fill(0, 180); noStroke(); rect(0,0,width,height);

  // 2. DRAW THE TITLE
  push();
  textAlign(CENTER, CENTER);
  // 'Verdana' or 'Arial Black' are standard system fonts that look good bold
  textFont('Verdana'); 
  textStyle(BOLD);
  
  let cx = width / 2;
  let cy = height / 2 - 100; // Shift up above the button

  // -- MAIN TITLE (GLITCH EFFECT) --
  textSize(50);
  
  // Layer 1: Cyan Offset (Left/Up)
  fill(0, 255, 255, 200);
  text("Best Typography Tool", cx - 3, cy - 3);
  
  // Layer 2: Magenta Offset (Right/Down)
  fill(255, 0, 255, 200);
  text("Best Typography Tool", cx + 3, cy + 3);
  
  // Layer 3: Main White Text
  fill(255);
  text("Best Typography Tool", cx, cy);

  // -- SUBTITLE "PRO MAX SUPER" --
  textSize(24);
  textStyle(NORMAL);
  // Pulsing Yellow Opacity
  let alpha = map(sin(frameCount * 0.15), -1, 1, 50, 255);
  fill(255, 255, 0, alpha); 
  // Slight spacing for dramatic effect
  drawingContext.letterSpacing = "5px"; 
  text("PRO MAX SUPER", cx, cy + 60);
  
  // Reset context
  drawingContext.letterSpacing = "0px";
  pop();
}

function drawApp() {
  if (frameCount < gifEndFrame + 10) {
    isRecordingGIF = true;
  } else {
    isRecordingGIF = false;
  }

  if (globalSettings.isTransparent) {
    clear(); 
  } else {
    background(globalSettings.bgColor); 
  }
  
  for (let t of textObjects) {
    renderTextObject(t, false);
  }

  if (!isExporting && !isRecordingGIF) {
    drawSelectionBox();
    drawWidgets();
  }
}

// ----------------------------------------------------
// MIXER PIPELINE
// ----------------------------------------------------
function renderTextObject(t, isForSVG) {
  t.drawBase(pingLayer, null); 
  applyEffectsChain(t, pingLayer, pongLayer); 
  
  if (isForSVG) isForSVG.image(pingLayer, 0, 0, width, height);
  else image(pingLayer, 0, 0, width, height);

  if (t.hasGlass) {
    let p = t.params;
    t.drawBase(glassLayer, p.glassTextColor);
    applyEffectsChain(t, glassLayer, pongLayer);
    if (p.glassBlur > 0) glassLayer.filter(BLUR, p.glassBlur);
    
    let gW = p.glassWidth; let gH = p.glassHeight;
    let gx = p.glassPos.x - gW/2; let gy = p.glassPos.y - gH/2;
    
    let crop = glassLayer.get(gx, gy, gW, gH);
    let target = isForSVG ? isForSVG : window;
    
    if (isForSVG) target.push(); else push();
    if (isForSVG) target.translate(gx, gy); else translate(gx, gy);
    
    let frostCol = color(globalSettings.bgColor); 
    if (globalSettings.isTransparent) {
       frostCol = color(255);
       frostCol.setAlpha(30); 
    } else {
       frostCol.setAlpha(240);
    }

    if (isForSVG) { target.fill(frostCol); target.noStroke(); target.rect(0,0,gW,gH); }
    else { fill(frostCol); noStroke(); rect(0,0,gW,gH); }
    
    if (isForSVG) target.image(crop, 0, 0, gW, gH); else image(crop, 0, 0, gW, gH);
    
    if (p.glassStroke) {
      let strk = (isSVG) => {
        if(isSVG) { target.noFill(); target.stroke(255, 100); target.strokeWeight(1); target.rect(1,1,gW-2,gH-2); target.stroke(0,50); target.rect(0,0,gW,gH); }
        else { noFill(); stroke(255, 100); strokeWeight(1); rect(1,1,gW-2,gH-2); stroke(0,50); rect(0,0,gW,gH); }
      }
      strk(isForSVG);
    }
    
    if (isForSVG) target.pop(); else pop();
  }
}

function applyEffectsChain(t, buffer, swapBuffer) {
  let p = t.params;
  
  if (t.hasLiquid) {
    swapBuffer.clear();
    let step = 1; 
    for (let x = 0; x < width; x += step) {
       let fn = noise(x * 0.01 + p.liquidSeed);
       let offY = Math.floor(fn * p.liquidFlow);
       let tn = (noise(x * 0.05 + p.liquidSeed + 100) - 0.5); 
       let offX = Math.floor(tn * p.liquidTurbulence);
       swapBuffer.copy(buffer, x, 0, step, height, x + offX, offY, step, height);
    }
    buffer.clear(); buffer.image(swapBuffer, 0, 0, width, height); 
  }
  
  if (t.hasScanner) {
    swapBuffer.clear();
    let step = 1;
    // Static Glitch
    for (let y = 0; y < height; y += step) {
       let phase = p.scannerAmp * 0.05;
       let wave = sin(y * p.scannerFreq + phase); 
       let n = (noise(y * 0.8) - 0.5) * p.scannerNoise;
       let offX = Math.floor((wave * p.scannerAmp) + n);
       swapBuffer.copy(buffer, 0, y, width, step, offX, y, width, step);
    }
    buffer.clear(); buffer.image(swapBuffer, 0, 0, width, height);
  }

  if (t.hasMotion) {
    swapBuffer.clear();
    let rads = radians(p.motionAngle);
    let dirX = cos(rads); let dirY = sin(rads);
    let steps = p.motionRepeats;
    let stepSize = p.motionDist / steps;
    
    for(let i = steps; i > 0; i--) {
      let d = i * stepSize;
      swapBuffer.push();
      swapBuffer.translate(-(dirX * d), -(dirY * d));
      swapBuffer.tint(255, p.motionTrailAlpha); 
      swapBuffer.image(buffer, 0, 0, width, height);
      swapBuffer.noTint();
      swapBuffer.pop();
    }
    swapBuffer.tint(255, p.motionMainAlpha);
    swapBuffer.image(buffer, 0, 0, width, height);
    swapBuffer.noTint();
    buffer.clear(); buffer.image(swapBuffer, 0, 0, width, height);
  }
}

// ----------------------------------------------------
// UI & INTERACTION
// ----------------------------------------------------
function drawSelectionBox() {
  if (!textObjects[activeIndex]) return;
  
  let t = textObjects[activeIndex];
  let rPos = t.getRenderPos(); 
  
  push();
  if (dragTargetType === 'TEXT' || dragTargetType === null || isDragging) {
    textSize(t.fontSize); textFont(t.font);
    
    let w = textWidth(t.text);
    let lines = t.text.split('\n').length;
    let h = t.fontSize * lines * 1.1; 

    stroke(0, 255, 255, 80); strokeWeight(1); noFill();
    rectMode(CENTER);
    rect(rPos.x, rPos.y, w + 20, h + 20);
  }
  
  if (t.hasGlass) {
    if (dragTargetType === 'GLASS') stroke(255, 0, 255, 255); 
    else stroke(255, 0, 255, 100);
    rectMode(CENTER);
    rect(t.params.glassPos.x, t.params.glassPos.y, t.params.glassWidth, t.params.glassHeight);
    if(dist(rPos.x, rPos.y, t.params.glassPos.x, t.params.glassPos.y) > 100) {
      stroke(255, 0, 255, 30);
      line(rPos.x, rPos.y, t.params.glassPos.x, t.params.glassPos.y);
    }
  }
  pop();
}

function drawWidgets() {
  if (!textObjects[activeIndex]) return;
  let t = textObjects[activeIndex];

  // 1. GRADIENT KNOB
  if (t.params.useGradient) {
    let kx = width - 40; let ky = 40; let r = 25;
    fill(0, 200); stroke(255, 100); strokeWeight(2); ellipse(kx, ky, r*2);
    let ang = radians(t.params.gradientAngle);
    line(kx, ky, kx + cos(ang) * 20, ky + sin(ang) * 20);
    noStroke(); fill(255); textSize(10); textAlign(CENTER); text("GRAD", kx, ky + 35);
  }
  
  // 2. MOTION KNOB
  if (t.hasMotion) {
    let kx = width - 40; let ky = 110; let r = 25;
    fill(0, 200); stroke(0, 255, 200, 100); strokeWeight(2); ellipse(kx, ky, r*2);
    let ang = radians(t.params.motionAngle);
    stroke(0, 255, 200); line(kx, ky, kx + cos(ang) * 20, ky + sin(ang) * 20);
    noStroke(); fill(0, 255, 200); textSize(10); textAlign(CENTER); text("MOT", kx, ky + 35);
  }

  // 3. SCANNER MOVE DIRECTION KNOB
  if (t.hasScanner && t.params.moveEnabled) {
    let kx = width - 40; let ky = 180; let r = 25;
    fill(0, 200); stroke(255, 255, 0, 100); strokeWeight(2); ellipse(kx, ky, r*2);
    let ang = radians(t.params.moveAngle);
    stroke(255, 255, 0); line(kx, ky, kx + cos(ang) * 20, ky + sin(ang) * 20);
    noStroke(); fill(255, 255, 0); textSize(10); textAlign(CENTER); text("DIR", kx, ky + 35);
  }
}

function mousePressed(e) {
  if (!isStarted) return;
  if (e.target.id !== 'myCanvas') return;
  
  let t = textObjects[activeIndex];
  
  if (t) {
    if (t.params.useGradient && dist(mouseX, mouseY, width-40, 40) < 30) {
      isDraggingGradKnob = true; return;
    }
    if (t.hasMotion && dist(mouseX, mouseY, width-40, 110) < 30) {
      isDraggingMotionWheel = true; return;
    }
    if (t.hasScanner && t.params.moveEnabled && dist(mouseX, mouseY, width-40, 180) < 30) {
      isDraggingMoveWheel = true; return;
    }
  }

  for(let i = textObjects.length-1; i >= 0; i--) {
    let hitType = textObjects[i].checkHit(mouseX, mouseY);
    if(hitType) {
      activeIndex = i;
      isDragging = true;
      dragTargetType = hitType; 
      updateTextList(); 
      updateUI(); 
      break;
    }
  }
}

function mouseDragged() {
  if (!isStarted) return;
  if (!textObjects[activeIndex]) return;
  let t = textObjects[activeIndex];

  if (isDraggingGradKnob) {
    t.params.gradientAngle = degrees(atan2(mouseY - 40, mouseX - (width - 40)));
  }
  else if (isDraggingMotionWheel) {
    t.params.motionAngle = degrees(atan2(mouseY - 110, mouseX - (width - 40)));
  }
  else if (isDraggingMoveWheel) {
    t.params.moveAngle = degrees(atan2(mouseY - 180, mouseX - (width - 40)));
  }
  else if (isDragging) {
    if (dragTargetType === 'GLASS') {
      t.params.glassPos.x += movedX;
      t.params.glassPos.y += movedY;
    } 
    else if (dragTargetType === 'TEXT') {
      t.pos.x += movedX;
      t.pos.y += movedY;
    }
  }
}

function mouseReleased() { 
  isDragging = false; dragTargetType = null;
  isDraggingGradKnob = false; isDraggingMotionWheel = false; isDraggingMoveWheel = false;
}

function addTextObject(str) {
  textObjects.push(new TextItem(str, width/2, height/2));
  activeIndex = textObjects.length - 1;
  updateTextList();
  updateUI();
}

function deleteActiveText() {
  if (textObjects.length > 0) {
    textObjects.splice(activeIndex, 1);
    activeIndex = max(0, textObjects.length - 1);
    updateTextList();
    updateUI();
  }
}

function moveActiveToFront() {
  if (textObjects.length < 2 || activeIndex === textObjects.length - 1) return;
  let t = textObjects.splice(activeIndex, 1)[0];
  textObjects.push(t);
  activeIndex = textObjects.length - 1;
  updateTextList();
}

function moveActiveToBack() {
  if (textObjects.length < 2 || activeIndex === 0) return;
  let t = textObjects.splice(activeIndex, 1)[0];
  textObjects.unshift(t);
  activeIndex = 0;
  updateTextList();
}

function updateCanvasDimensions() {
  let w = parseInt(domElements.inpW.value());
  let h = parseInt(domElements.inpH.value());
  if(w > 0 && h > 0) {
    globalSettings.canvasW = w;
    globalSettings.canvasH = h;
    resizeCanvas(w, h);
    initBuffers(w, h); 
  }
}

function exportPNG() {
  isExporting = true; pixelDensity(4); draw(); 
  saveCanvas('graphic_lab_4K', 'png');
  setTimeout(()=> { pixelDensity(2); isExporting=false; }, 500);
}

function exportGIF() {
  gifEndFrame = frameCount + TOTAL_LOOP_FRAMES;
  saveGif('typo_loop', TOTAL_LOOP_FRAMES, { units: 'frames', delay: 0 });
}

function exportSVG() {
  let w = globalSettings.canvasW; let h = globalSettings.canvasH;
  let flatten = createGraphics(w, h); flatten.pixelDensity(1); 
  
  if(!globalSettings.isTransparent) flatten.background(globalSettings.bgColor);
  else flatten.clear();

  for (let t of textObjects) renderTextObject(t, flatten); 
  flatten.loadPixels();
  
  let svgLines = [`<?xml version="1.0" encoding="UTF-8"?>`, `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`];
  if(!globalSettings.isTransparent) {
    svgLines.push(`<rect width="100%" height="100%" fill="${globalSettings.bgColor}" />`);
  }

  let step = 1; 
  for (let y = 0; y < h; y += step) {
    let currentRect = null;
    for (let x = 0; x < w; x += step) {
      let index = (x + y * w) * 4;
      let r = flatten.pixels[index]; let g = flatten.pixels[index+1]; let b = flatten.pixels[index+2]; let a = flatten.pixels[index+3];
      
      if (a > 0) { 
        let hex = "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
        let isBg = (!globalSettings.isTransparent && r === red(color(globalSettings.bgColor)) && g === green(color(globalSettings.bgColor)) && b === blue(color(globalSettings.bgColor)));
        
        if (!isBg) {
            if (currentRect && currentRect.fill === hex) { currentRect.width += step; } 
            else {
              if (currentRect) svgLines.push(`<rect x="${currentRect.x}" y="${currentRect.y}" width="${currentRect.width+0.5}" height="${currentRect.height+0.5}" fill="${currentRect.fill}" />`);
              currentRect = { x: x, y: y, width: step, height: step, fill: hex };
            }
        } else {
            if (currentRect) { svgLines.push(`<rect x="${currentRect.x}" y="${currentRect.y}" width="${currentRect.width+0.5}" height="${currentRect.height+0.5}" fill="${currentRect.fill}" />`); currentRect = null; }
        }
      } else {
        if (currentRect) { svgLines.push(`<rect x="${currentRect.x}" y="${currentRect.y}" width="${currentRect.width+0.5}" height="${currentRect.height+0.5}" fill="${currentRect.fill}" />`); currentRect = null; }
      }
    }
    if (currentRect) svgLines.push(`<rect x="${currentRect.x}" y="${currentRect.y}" width="${currentRect.width+0.5}" height="${currentRect.height+0.5}" fill="${currentRect.fill}" />`);
  }
  svgLines.push(`</svg>`); saveStrings(svgLines, 'graphic_lab_vector', 'svg'); flatten.remove();
}

// ----------------------------------------------------
// UI CREATION
// ----------------------------------------------------
function createInterface() {
  uiContainer = createDiv('');
  let c = uiContainer;
  c.style('position','absolute'); c.style('top','20px'); c.style('left','10px');
  c.style('width','260px'); c.style('background','#1a1a1a'); c.style('padding','15px');
  c.style('color','#fff'); c.style('font-family','monospace'); c.style('border','1px solid #333');
  c.style('max-height','90vh'); c.style('overflow-y','auto'); 

  createDiv('Typo Lab').parent(c).style('font-weight','bold').style('color','#00ffcc').style('margin-bottom','10px');

  const addGroup = (parent, title, color) => {
    let box = createDiv('').parent(parent).style('background','#222').style('border-left',`3px solid ${color}`).style('margin-bottom','10px').style('padding','5px');
    createDiv(title).parent(box).style('background',color).style('color','#000').style('font-weight','bold').style('padding','2px 5px').style('display','inline-block').style('margin-bottom','5px').style('font-size','10px');
    return box;
  };
  const addLabel = (parent, txt) => createDiv(txt).parent(parent).style('font-size','10px').style('color','#888').style('margin-top','5px');

  // 1. MAIN SETTINGS
  let grpSize = addGroup(c, 'CANVAS SIZE', '#ffffff');
  let rowSz = createDiv('').parent(grpSize).style('display','flex').style('gap','5px');
  domElements.inpW = createInput(str(globalSettings.canvasW)).parent(rowSz).style('width','40%');
  domElements.inpH = createInput(str(globalSettings.canvasH)).parent(rowSz).style('width','40%');
  
  let btnResize = createButton('SET');
  btnResize.parent(rowSz);
  btnResize.style('width','20%');
  btnResize.mousePressed(updateCanvasDimensions);
  
  domElements.chkTrans = createCheckbox('Transparent BG', false).parent(grpSize).style('color','#aaa').style('margin-top','5px');
  domElements.chkTrans.changed(() => { globalSettings.isTransparent = domElements.chkTrans.checked(); });

  addLabel(c, 'SELECT LAYER');
  // NEW: DROPDOWN FOR TEXT SELECTION
  domElements.selLayer = createSelect().parent(c).style('width','100%').style('background','#333').style('color','#fff').style('margin-bottom','10px');
  domElements.selLayer.changed(() => {
      activeIndex = int(domElements.selLayer.value());
      updateUI();
  });

  addLabel(c, 'TEXT CONTENT');
  domElements.inpText = createElement('textarea', '').parent(c).style('width','100%').style('background','#333').style('border','none').style('color','#fff').style('margin-bottom','5px').style('resize','vertical');
  domElements.inpText.attribute('rows', '3');
  domElements.inpText.input(() => { 
    if(textObjects[activeIndex]) {
      textObjects[activeIndex].text = domElements.inpText.value(); 
      updateTextList(); 
    }
  });
  
  // FONT UPLOAD SECTION
  addLabel(c, 'CUSTOM FONT (.TTF / .OTF)');
  let fontInput = createFileInput(handleFileDrop).parent(c).style('color','#aaa').style('margin-bottom','10px');

  domElements.sSize = createSlider(10, 400, 150).parent(c).style('width','100%');
  domElements.sSize.input(() => { if(textObjects[activeIndex]) textObjects[activeIndex].fontSize = domElements.sSize.value(); });

  let rowBtn = createDiv('').parent(c).style('display','flex').style('gap','5px').style('margin-bottom','15px');
  
  let btnAdd = createButton('+ TEXT');
  btnAdd.parent(rowBtn);
  btnAdd.style('width','50%').style('background','#333').style('color','#fff').style('border','none');
  btnAdd.mousePressed(() => addTextObject("NEW"));

  let btnDel = createButton('DELETE');
  btnDel.parent(rowBtn);
  btnDel.style('width','50%').style('background','#500').style('color','#fff').style('border','none');
  btnDel.mousePressed(deleteActiveText);

  let rowZ = createDiv('').parent(c).style('display','flex').style('gap','5px').style('margin-bottom','15px');
  
  let btnBack = createButton('TO BACK');
  btnBack.parent(rowZ);
  btnBack.style('width','50%').style('background','#444').style('color','#fff').style('border','none');
  btnBack.mousePressed(moveActiveToBack);

  let btnFront = createButton('TO FRONT');
  btnFront.parent(rowZ);
  btnFront.style('width','50%').style('background','#444').style('color','#fff').style('border','none');
  btnFront.mousePressed(moveActiveToFront);

  // 2. TOGGLES
  let rowEf = createDiv('').parent(c).style('display','grid').style('grid-template-columns','1fr 1fr').style('gap','5px').style('margin-bottom','15px');
  domElements.chkLiq = createCheckbox('Liquid', false).parent(rowEf).style('color','#ccc');
  domElements.chkScan = createCheckbox('Scanner', false).parent(rowEf).style('color','#ccc');
  domElements.chkRep = createCheckbox('Repeater', false).parent(rowEf).style('color','#ccc');
  domElements.chkMot = createCheckbox('Motion', false).parent(rowEf).style('color','#ccc');
  domElements.chkGlass = createCheckbox('Glass', false).parent(rowEf).style('color','#ccc');

  const updateChecks = () => {
    if(!textObjects[activeIndex]) return;
    textObjects[activeIndex].hasLiquid = domElements.chkLiq.checked();
    textObjects[activeIndex].hasScanner = domElements.chkScan.checked();
    textObjects[activeIndex].hasRepeater = domElements.chkRep.checked();
    textObjects[activeIndex].hasMotion = domElements.chkMot.checked();
    textObjects[activeIndex].hasGlass = domElements.chkGlass.checked();
    updateUIVisibility();
  };
  domElements.chkLiq.changed(updateChecks); 
  domElements.chkScan.changed(updateChecks);
  domElements.chkRep.changed(updateChecks);
  domElements.chkMot.changed(updateChecks); 
  domElements.chkGlass.changed(updateChecks);

  // 3. COLOR
  let colorBox = addGroup(c, 'COLOR / GRADIENT', '#fff');
  domElements.chkGrad = createCheckbox('Use Gradient', false).parent(colorBox).style('color','#aaa');
  domElements.chkGrad.changed(() => { if(textObjects[activeIndex]) { textObjects[activeIndex].params.useGradient = domElements.chkGrad.checked(); updateUIVisibility(); }});
  
  // Global Gradient Checkbox
  domElements.chkGlobalGrad = createCheckbox('Global Gradient', false).parent(colorBox).style('color','#aaa');
  domElements.chkGlobalGrad.changed(() => { if(textObjects[activeIndex]) textObjects[activeIndex].params.useGlobalGradient = domElements.chkGlobalGrad.checked(); });

  let rowC = createDiv('').parent(colorBox).style('display','flex').style('gap','5px');
  domElements.c1 = createColorPicker('#ffffff').parent(rowC).style('width','100%');
  domElements.c2 = createColorPicker('#ff0055').parent(rowC).style('width','100%');
  domElements.c1.input(()=>{ if(textObjects[activeIndex]) textObjects[activeIndex].params.colorMain = domElements.c1.value(); });
  domElements.c2.input(()=>{ if(textObjects[activeIndex]) textObjects[activeIndex].params.colorSec = domElements.c2.value(); });

  // 4. DYNAMIC GROUPS
  
  // -- REPEATER --
  uiGroups.repeater = addGroup(c, 'REPEATER GRID', '#8888ff');
  addLabel(uiGroups.repeater, 'HORIZONTAL REPS');
  domElements.sRepX = createSlider(0, 10, 0).parent(uiGroups.repeater).style('width','100%');
  domElements.sRepX.input(() => { if(textObjects[activeIndex]) textObjects[activeIndex].params.repeatX = domElements.sRepX.value(); });
  
  addLabel(uiGroups.repeater, 'HORIZONTAL SPACING');
  domElements.sRepGapX = createSlider(0, 500, 200).parent(uiGroups.repeater).style('width','100%');
  domElements.sRepGapX.input(() => { if(textObjects[activeIndex]) textObjects[activeIndex].params.repeatGapX = domElements.sRepGapX.value(); });

  addLabel(uiGroups.repeater, 'VERTICAL REPS');
  domElements.sRepY = createSlider(0, 10, 0).parent(uiGroups.repeater).style('width','100%');
  domElements.sRepY.input(() => { if(textObjects[activeIndex]) textObjects[activeIndex].params.repeatY = domElements.sRepY.value(); });
  
  addLabel(uiGroups.repeater, 'VERTICAL SPACING');
  domElements.sRepGapY = createSlider(0, 500, 150).parent(uiGroups.repeater).style('width','100%');
  domElements.sRepGapY.input(() => { if(textObjects[activeIndex]) textObjects[activeIndex].params.repeatGapY = domElements.sRepGapY.value(); });

  // -- LIQUID --
  uiGroups.liquid = addGroup(c, 'LIQUID DISTORTION', '#00ccff');
  addLabel(uiGroups.liquid, 'FLOW');
  domElements.sFlow = createSlider(0, 300, 50).parent(uiGroups.liquid).style('width','100%');
  domElements.sFlow.input(() => { if(textObjects[activeIndex]) textObjects[activeIndex].params.liquidFlow = domElements.sFlow.value(); });
  addLabel(uiGroups.liquid, 'TURBULENCE');
  domElements.sTurb = createSlider(0, 50, 20).parent(uiGroups.liquid).style('width','100%');
  domElements.sTurb.input(() => { if(textObjects[activeIndex]) textObjects[activeIndex].params.liquidTurbulence = domElements.sTurb.value(); });

  // -- SCANNER (COMBINED) --
  uiGroups.scanner = addGroup(c, 'SCANNER TOOLS', '#ffff00');
  
  // SUB-FEATURE: GLITCH
  createDiv(':: PIXEL GLITCH').parent(uiGroups.scanner).style('font-weight','bold').style('margin-top','5px').style('font-size','11px');
  addLabel(uiGroups.scanner, 'AMPLITUDE (GLITCH)');
  domElements.sScanAmp = createSlider(0, 200, 50).parent(uiGroups.scanner).style('width','100%');
  domElements.sScanNoise = createSlider(0, 50, 0).parent(uiGroups.scanner).style('width','100%');
  domElements.sScanAmp.input(() => { if(textObjects[activeIndex]) textObjects[activeIndex].params.scannerAmp = domElements.sScanAmp.value(); });
  domElements.sScanNoise.input(() => { if(textObjects[activeIndex]) textObjects[activeIndex].params.scannerNoise = domElements.sScanNoise.value(); });
  
  createDiv('---').parent(uiGroups.scanner).style('color','#444').style('margin','5px 0');

  // SUB-FEATURE: MOVE (Inside Scanner)
  createDiv(':: AUTO-MOVE').parent(uiGroups.scanner).style('font-weight','bold').style('font-size','11px');
  domElements.chkMoveEnable = createCheckbox('Enable Move', false).parent(uiGroups.scanner).style('color','#aaa');
  domElements.chkMoveEnable.changed(() => { if(textObjects[activeIndex]) textObjects[activeIndex].params.moveEnabled = domElements.chkMoveEnable.checked(); });

  addLabel(uiGroups.scanner, 'LOOPS PER 3s (SPEED)');
  domElements.sMoveSpeed = createSlider(1, 5, 1, 1).parent(uiGroups.scanner).style('width','100%');
  domElements.sMoveSpeed.input(() => { if(textObjects[activeIndex]) textObjects[activeIndex].params.moveSpeed = domElements.sMoveSpeed.value(); });

  addLabel(uiGroups.scanner, 'MOVE DISTANCE');
  domElements.sMoveDist = createSlider(0, 400, 100).parent(uiGroups.scanner).style('width','100%');
  domElements.sMoveDist.input(() => { if(textObjects[activeIndex]) textObjects[activeIndex].params.moveDist = domElements.sMoveDist.value(); });

  // -- MOTION --
  uiGroups.motion = addGroup(c, 'MOTION BLUR', '#00ffaa');
  addLabel(uiGroups.motion, 'DISTANCE / REPEATS');
  let rowM1 = createDiv('').parent(uiGroups.motion).style('display','flex');
  domElements.sMotD = createSlider(0, 500, 60).parent(rowM1).style('width','50%');
  domElements.sMotR = createSlider(1, 50, 15).parent(rowM1).style('width','50%');
  domElements.sMotD.input(() => { if(textObjects[activeIndex]) textObjects[activeIndex].params.motionDist = domElements.sMotD.value(); });
  domElements.sMotR.input(() => { if(textObjects[activeIndex]) textObjects[activeIndex].params.motionRepeats = domElements.sMotR.value(); });
  addLabel(uiGroups.motion, 'OPACITY (Trail vs Main)');
  let rowM2 = createDiv('').parent(uiGroups.motion).style('display','flex');
  domElements.sMotAlphaT = createSlider(0, 255, 100).parent(rowM2).style('width','50%');
  domElements.sMotAlphaM = createSlider(0, 255, 255).parent(rowM2).style('width','50%');
  domElements.sMotAlphaT.input(() => { if(textObjects[activeIndex]) textObjects[activeIndex].params.motionTrailAlpha = domElements.sMotAlphaT.value(); });
  domElements.sMotAlphaM.input(() => { if(textObjects[activeIndex]) textObjects[activeIndex].params.motionMainAlpha = domElements.sMotAlphaM.value(); });

  // -- GLASS --
  uiGroups.glass = addGroup(c, 'GLASS PANE', '#ff00ff');
  domElements.chkStr = createCheckbox('Show Border', true).parent(uiGroups.glass).style('color','#aaa');
  domElements.chkStr.changed(()=> { if(textObjects[activeIndex]) textObjects[activeIndex].params.glassStroke = domElements.chkStr.checked(); });
  
  addLabel(uiGroups.glass, 'TEXT COLOR IN GLASS');
  domElements.cGlass = createColorPicker('#ff0055').parent(uiGroups.glass).style('width','100%');
  domElements.cGlass.input(() => { if(textObjects[activeIndex]) textObjects[activeIndex].params.glassTextColor = domElements.cGlass.value(); });
  
  addLabel(uiGroups.glass, 'SIZE (W / H)');
  let rowG = createDiv('').parent(uiGroups.glass).style('display','flex').style('gap','5px');
  domElements.sGW = createSlider(50, 1000, 300).parent(rowG).style('width','50%');
  domElements.sGH = createSlider(50, 1000, 400).parent(rowG).style('width','50%');
  domElements.sGW.input(() => { if(textObjects[activeIndex]) textObjects[activeIndex].params.glassWidth = domElements.sGW.value(); });
  domElements.sGH.input(() => { if(textObjects[activeIndex]) textObjects[activeIndex].params.glassHeight = domElements.sGH.value(); });
  
  addLabel(uiGroups.glass, 'BLUR AMOUNT');
  domElements.sBlur = createSlider(0, 100, 10).parent(uiGroups.glass).style('width','100%');
  domElements.sBlur.input(() => { if(textObjects[activeIndex]) textObjects[activeIndex].params.glassBlur = domElements.sBlur.value(); });

  // EXPORT
  createDiv('<br>').parent(c);
  
  let btnPng = createButton('SAVE PNG (4K)');
  btnPng.parent(c);
  btnPng.style('width','100%').style('background','#444').style('color','#fff').style('border','none').style('padding','8px').style('margin-bottom','5px');
  btnPng.mousePressed(exportPNG);

  let btnGif = createButton('RECORD GIF (3s LOOP)');
  btnGif.parent(c);
  btnGif.style('width','100%').style('background','#aa00ff').style('color','#fff').style('border','none').style('padding','8px').style('margin-bottom','5px');
  btnGif.mousePressed(exportGIF);

  let btnSvg = createButton('EXPORT SVG');
  btnSvg.parent(c);
  btnSvg.style('width','100%').style('background','#00ffcc').style('color','#000').style('border','none').style('padding','10px').style('font-weight','bold');
  btnSvg.mousePressed(exportSVG);

  updateUIVisibility();
}

function updateTextList() {
  domElements.selLayer.elt.innerHTML = ''; // Clear
  for(let i=0; i<textObjects.length; i++) {
      let label = `${i}: ${textObjects[i].text.substring(0, 15)}`;
      domElements.selLayer.option(label, i);
  }
  domElements.selLayer.selected(activeIndex);
}

function updateUI() {
  if (!textObjects[activeIndex]) return;
  let t = textObjects[activeIndex];
  let p = t.params;
  
  domElements.inpText.value(t.text);
  domElements.sSize.value(t.fontSize);
  domElements.chkTrans.checked(globalSettings.isTransparent);
  
  domElements.chkLiq.checked(t.hasLiquid);
  domElements.chkScan.checked(t.hasScanner);
  domElements.chkRep.checked(t.hasRepeater);
  domElements.chkMot.checked(t.hasMotion);
  domElements.chkGlass.checked(t.hasGlass);
  
  domElements.chkGrad.checked(p.useGradient);
  domElements.chkGlobalGrad.checked(p.useGlobalGradient);
  domElements.c1.value(p.colorMain);
  domElements.c2.value(p.colorSec);
  
  // REPEATER
  domElements.sRepX.value(p.repeatX);
  domElements.sRepGapX.value(p.repeatGapX);
  domElements.sRepY.value(p.repeatY);
  domElements.sRepGapY.value(p.repeatGapY);

  // SCANNER GROUP
  domElements.sScanAmp.value(p.scannerAmp);
  domElements.sScanNoise.value(p.scannerNoise);
  domElements.chkMoveEnable.checked(p.moveEnabled);
  domElements.sMoveSpeed.value(p.moveSpeed);
  domElements.sMoveDist.value(p.moveDist);
  
  domElements.sFlow.value(p.liquidFlow);
  domElements.sTurb.value(p.liquidTurbulence);
  
  domElements.cGlass.value(p.glassTextColor);
  domElements.sGW.value(p.glassWidth);
  domElements.sGH.value(p.glassHeight);
  domElements.sBlur.value(p.glassBlur);
  domElements.chkStr.checked(p.glassStroke);
  
  domElements.sMotD.value(p.motionDist);
  domElements.sMotR.value(p.motionRepeats);
  domElements.sMotAlphaT.value(p.motionTrailAlpha);
  domElements.sMotAlphaM.value(p.motionMainAlpha);
  
  updateUIVisibility();
}

function updateUIVisibility() {
  uiGroups.scanner.hide(); uiGroups.repeater.hide(); uiGroups.liquid.hide(); uiGroups.motion.hide(); uiGroups.glass.hide();
  if (!textObjects[activeIndex]) return;
  let t = textObjects[activeIndex];
  if(t.hasLiquid) uiGroups.liquid.show();
  if(t.hasRepeater) uiGroups.repeater.show();
  if(t.hasScanner) uiGroups.scanner.show();
  if(t.hasMotion) uiGroups.motion.show();
  if(t.hasGlass) uiGroups.glass.show();
  
  if(t.params.useGradient) {
    domElements.c2.show();
    if(t.hasRepeater) domElements.chkGlobalGrad.show(); else domElements.chkGlobalGrad.hide();
  } else {
    domElements.c2.hide();
    domElements.chkGlobalGrad.hide();
  }
}