// WUP 25-26
// Chiara Cherubin

let startButton;
let sidebar;
let sidebarToggle;
let sizeSelect; 
let isDrawing = false;
let waitForRelease = false;
let isFixedSize = false;
let isSidebarOpen = true;
let isSticky = false; 
let brushColor = '#000000'; 
let brushSize = 30; 
let brushSpacing = 50; 
let brushType = 'Emoji Pen'; 
let brushAlpha = 255; 
let isRainbowMode = false; 
let isInteractingWithSidebar = false; 
let isTintActive = false; 

// Assets
let customBrushImage = null; 
let selectedEmoji = "😀"; 
let backgroundImage = null; 

// Tool State
let currentTool = 'freehand'; 
let shapeStartX = -1;
let shapeStartY = -1;
let isDrawingShape = false;

// Layering
let drawingLayer; 
let canvasBgColor = '#ffffff'; 

// UI Elements
let bgPicker, brushPicker, rainbowCheckbox, brushTypeSelect, sizeSlider, spacingSlider, opacitySlider, fileNameInput, shapeSelect;
let emojiInput, emojiSelect, brushImageInput, bgImageInput, tintCheckbox; 

let startShapes = [];
let undoStack = [];
let redoStack = [];

const SIDEBAR_WIDTH = 200;
const TOGGLE_SIZE = 40;
const TOGGLE_TOP = 10;

function setup() {
  pixelDensity(3);
  createCanvas(windowWidth, windowHeight);
  frameRate(60); 
    
  drawingLayer = createGraphics(windowWidth, windowHeight);
  drawingLayer.pixelDensity(3);
  drawingLayer.strokeJoin(ROUND);
    
  strokeJoin(ROUND);

  for (let i = 0; i < 50; i++) {
    startShapes.push(new StartScreenShape());
  }

  // --- STILE DEL CORPO (BODY) ---
  // Invece del CSS, lo applichiamo qui via JS
  let body = select('body');
  body.style('margin', '0');
  body.style('padding', '0');
  body.style('overflow', 'hidden');
  body.style('background-color', '#f0f0f0');
  body.style('font-family', 'sans-serif');
    
  // --- PULSANTE START ---
  startButton = createButton('START CREATING');
  startButton.id('start-btn');
  startButton.mousePressed(enableDrawing);
  
  // Stile pulsante Start
  startButton.style('font-size', '24px');
  startButton.style('font-weight', 'bold');
  startButton.style('padding', '15px 40px');
  startButton.style('cursor', 'pointer');
  startButton.style('background-color', '#333');
  startButton.style('color', 'white');
  startButton.style('border', 'none');
  startButton.style('border-radius', '50px');
  startButton.style('transition', 'transform 0.1s, background-color 0.3s');
  startButton.style('z-index', '10');
  startButton.style('box-shadow', '0 4px 15px rgba(0,0,0,0.2)');
  
  // Effetti Hover (mouse sopra/fuori) gestiti in JS
  startButton.mouseOver(() => {
      startButton.style('background-color', '#000');
      startButton.style('transform', 'scale(1.05)');
  });
  startButton.mouseOut(() => {
      startButton.style('background-color', '#333');
      startButton.style('transform', 'scale(1.0)');
  });

  repositionUI();
}

function draw() {
  if (!isDrawing) {
      drawStartScreenAnimation();
      return;
  }

  if (waitForRelease) {
    if (!mouseIsPressed) waitForRelease = false;
    return;
  }

    // --- RENDER ---
    background(canvasBgColor);
    
    if (backgroundImage) {
        push();
        imageMode(CORNER);
        image(backgroundImage, 0, 0, width, height);
        pop();
    }

    image(drawingLayer, 0, 0, width, height);

    // --- PREVIEW SHAPES ---
    if (isDrawingShape && mouseIsPressed && !isInteractingWithSidebar) {
        push();
        stroke(150);
        strokeWeight(1);
        noFill();
        strokeCap(ROUND);
        strokeJoin(ROUND);
        drawingContext.setLineDash([5, 5]); 

        let w = mouseX - shapeStartX;
        let h = mouseY - shapeStartY;

        if (currentTool === 'line') line(shapeStartX, shapeStartY, mouseX, mouseY);
        else if (currentTool === 'rectangle') { rectMode(CORNERS); rect(shapeStartX, shapeStartY, mouseX, mouseY); }
        else if (currentTool === 'circle') { ellipseMode(CORNER); ellipse(shapeStartX, shapeStartY, w, h); }
        else if (currentTool === 'triangle') triangle(shapeStartX + w / 2, shapeStartY, shapeStartX, mouseY, mouseX, mouseY);
        drawingContext.setLineDash([]);
        pop();
    }

    // --- DRAWING LOGIC (Freehand) ---
    if (currentTool === 'freehand' && (mouseIsPressed || isSticky)) {
      if (isInteractingWithSidebar) return;
      if (isSidebarOpen && winMouseX < SIDEBAR_WIDTH) return;
        
      let toggleXStart = isSidebarOpen ? SIDEBAR_WIDTH : 0;
      if (winMouseX >= toggleXStart && winMouseX <= toggleXStart + TOGGLE_SIZE && 
          winMouseY >= TOGGLE_TOP && winMouseY <= TOGGLE_TOP + TOGGLE_SIZE) return;

      let distMoved = dist(pmouseX, pmouseY, mouseX, mouseY);
      
      let spacingMultiplier = brushSpacing / 60.0; 
      let currentStepSize = max(brushSize * spacingMultiplier, 1);

      if (isRainbowMode) {
          drawingLayer.push();
          drawingLayer.colorMode(HSB, 360, 100, 100, 255);
      }

      // 1. IMAGE BRUSH
      if (brushType === 'Image' && customBrushImage) {
          let aspect = customBrushImage.width / customBrushImage.height;
          let dH = brushSize * 4;
          let dW = dH * aspect;
          
          let step = currentStepSize;
          let steps = Math.ceil(distMoved / step);
          
          drawingLayer.imageMode(CENTER);
          
          if(isRainbowMode) {
             let hueVal = (frameCount * 5) % 360;
             drawingLayer.tint(hueVal, 90, 90, brushAlpha);
          } else if (isTintActive) {
             let c = color(brushColor);
             c.setAlpha(brushAlpha);
             drawingLayer.tint(c);
          } else {
             drawingLayer.tint(255, brushAlpha);
          }

          for(let i = 0; i <= steps; i++) {
              let t = steps === 0 ? 0 : i / steps;
              let x = lerp(pmouseX, mouseX, t);
              let y = lerp(pmouseY, mouseY, t);
              drawingLayer.image(customBrushImage, x, y, dW, dH);
          }
          drawingLayer.noTint();
      }
        
      // 2. EMOJI SPRAY
      else if (brushType === 'Emoji Spray') {
          let step = max(currentStepSize, 5); 
          let steps = Math.ceil(distMoved / step);
          let baseDensity = map(brushSize, 1, 100, 1, 5); 
          let radius = brushSize * 3;

          drawingLayer.textAlign(CENTER, CENTER);
          drawingLayer.textSize(brushSize); 
          drawingLayer.noStroke();

          for(let i = 0; i <= steps; i++) {
              let t = steps === 0 ? 0 : i / steps;
              let x = lerp(pmouseX, mouseX, t);
              let y = lerp(pmouseY, mouseY, t);
              
              for(let j = 0; j < baseDensity; j++) {
                  if (isRainbowMode) {
                      let hueVal = ((frameCount * 5) + (i * 2)) % 360;
                      drawingLayer.fill(hueVal, 90, 90, brushAlpha);
                  } else if (isTintActive) {
                      let c = color(brushColor);
                      c.setAlpha(brushAlpha);
                      drawingLayer.fill(c);
                  } else {
                      drawingLayer.fill(255, 255, 255, brushAlpha); 
                  }
                  
                  let angle = random(TWO_PI);
                  let r = random(0, radius);
                  drawingLayer.text(selectedEmoji, x + r * cos(angle), y + r * sin(angle));
              }
          }
      } 
        
      // 3. EMOJI PEN
      else {
          let usedEmoji = (brushType === 'Image' && !customBrushImage) ? "⚠️" : selectedEmoji;
          let step = currentStepSize;
          let steps = Math.ceil(distMoved / step);
          
          drawingLayer.textAlign(CENTER, CENTER);
          drawingLayer.textSize(brushSize * 2);
          drawingLayer.noStroke();

          for(let i = 0; i <= steps; i++) {
              let t = steps === 0 ? 0 : i / steps;
              let x = lerp(pmouseX, mouseX, t);
              let y = lerp(pmouseY, mouseY, t);
              
              if (isRainbowMode) {
                 let hueVal = ((frameCount * 5) + (i * 10)) % 360;
                 drawingLayer.fill(hueVal, 90, 90, brushAlpha);
              } else if (isTintActive) {
                 let c = color(brushColor);
                 c.setAlpha(brushAlpha);
                 drawingLayer.fill(c);
              } else {
                 drawingLayer.fill(255, 255, 255, brushAlpha);
              }
              
              drawingLayer.text(usedEmoji, x, y);
          }
      }

      if (isRainbowMode) drawingLayer.pop();
    }
}

function mousePressed() {
    if (isSidebarOpen && winMouseX < SIDEBAR_WIDTH) { isInteractingWithSidebar = true; return; }
    let toggleXStart = isSidebarOpen ? SIDEBAR_WIDTH : 0;
    if (winMouseX >= toggleXStart && winMouseX <= toggleXStart + TOGGLE_SIZE && 
        winMouseY >= TOGGLE_TOP && winMouseY <= TOGGLE_TOP + TOGGLE_SIZE) { isInteractingWithSidebar = true; return; }

    if (currentTool !== 'freehand') {
        isDrawingShape = true;
        shapeStartX = mouseX;
        shapeStartY = mouseY;
        return;
    }
    if (isSticky) { isSticky = false; return; }
    if (isDrawing) saveState();
}

function mouseReleased() {
    if (isDrawingShape && currentTool !== 'freehand' && !isInteractingWithSidebar) {
        drawPatternShape(currentTool, shapeStartX, shapeStartY, mouseX, mouseY);
        saveState(); 
        isDrawingShape = false;
    }
    isInteractingWithSidebar = false;
}

// --- SHAPE LOGIC ---
function drawPatternShape(tool, x1, y1, x2, y2) {
    let w = x2 - x1;
    let h = y2 - y1;
    let perimeterPoints = [];
    
    let spacingMultiplier = brushSpacing / 40.0; 
    let spacing = max(brushSize * spacingMultiplier, 5);

    if (tool === 'line') {
        let distShape = dist(x1, y1, x2, y2);
        let steps = floor(distShape / spacing);
        for(let i=0; i<=steps; i++) {
            let t = i/steps;
            perimeterPoints.push({x: lerp(x1, x2, t), y: lerp(y1, y2, t)});
        }
    } else if (tool === 'rectangle') {
        addLinearPoints(x1, y1, x2, y1, spacing, perimeterPoints);
        addLinearPoints(x2, y1, x2, y2, spacing, perimeterPoints);
        addLinearPoints(x2, y2, x1, y2, spacing, perimeterPoints);
        addLinearPoints(x1, y2, x1, y1, spacing, perimeterPoints);
    } else if (tool === 'circle') {
        let cx = x1 + w/2; 
        let cy = y1 + h/2;
        let rx = w/2;
        let ry = h/2;
        let circumference = TWO_PI * sqrt((rx*rx + ry*ry)/2); 
        let steps = floor(circumference / spacing);
        for(let i=0; i<steps; i++){
            let ang = map(i, 0, steps, 0, TWO_PI);
            perimeterPoints.push({x: x1 + (w/2) + (w/2)*cos(ang), y: y1 + (h/2) + (h/2)*sin(ang)});
        }
    } else if (tool === 'triangle') {
        let tx1 = x1 + w/2, ty1 = y1;
        let tx2 = x1, ty2 = y2;
        let tx3 = x2, ty3 = y2;
        let tx1_2 = x1 + w/2, ty1_2 = y1; // Fix reference
        addLinearPoints(tx1, ty1, tx3, ty3, spacing, perimeterPoints);
        addLinearPoints(tx3, ty3, tx2, ty2, spacing, perimeterPoints);
        addLinearPoints(tx2, ty2, tx1, ty1, spacing, perimeterPoints);
    }

    drawingLayer.push();
    if(isRainbowMode) drawingLayer.colorMode(HSB, 360, 100, 100, 255);
    
    drawingLayer.imageMode(CENTER);
    drawingLayer.textAlign(CENTER, CENTER);
    drawingLayer.textSize(brushSize * 2);
    drawingLayer.noStroke();

    for(let i=0; i<perimeterPoints.length; i++) {
        let p = perimeterPoints[i];
        
        if(isRainbowMode) {
             let hueVal = (i * 5) % 360;
             if(brushType === 'Image' && customBrushImage) drawingLayer.tint(hueVal, 90, 90, brushAlpha);
             else drawingLayer.fill(hueVal, 90, 90, brushAlpha);
        } else if (isTintActive) {
             let c = color(brushColor);
             c.setAlpha(brushAlpha);
             if(brushType === 'Image' && customBrushImage) drawingLayer.tint(c);
             else drawingLayer.fill(c);
        } else {
             if(brushType === 'Image' && customBrushImage) drawingLayer.tint(255, brushAlpha);
             else drawingLayer.fill(255, 255, 255, brushAlpha);
        }

        if (brushType === 'Image' && customBrushImage) {
            let aspect = customBrushImage.width / customBrushImage.height;
            drawingLayer.image(customBrushImage, p.x, p.y, brushSize * 4 * aspect, brushSize * 4);
        } else {
            let charToDraw = (brushType === 'Image') ? "?" : selectedEmoji; 
            drawingLayer.text(charToDraw, p.x, p.y);
        }
    }
    drawingLayer.pop();
}

function addLinearPoints(x1, y1, x2, y2, spacing, arr) {
    let d = dist(x1, y1, x2, y2);
    let steps = floor(d / spacing);
    for(let i=0; i<steps; i++) {
        let t = i/steps;
        arr.push({x: lerp(x1, x2, t), y: lerp(y1, y2, t)});
    }
}

function doubleClicked() {
    if (currentTool !== 'freehand') return;
    if (isDrawing && mouseButton === LEFT) {
        if (isSidebarOpen && winMouseX < SIDEBAR_WIDTH) return;
        let toggleXStart = isSidebarOpen ? SIDEBAR_WIDTH : 0;
        if (winMouseX >= toggleXStart && winMouseX <= toggleXStart + TOGGLE_SIZE && winMouseY >= TOGGLE_TOP && winMouseY <= TOGGLE_TOP + TOGGLE_SIZE) return;
        isSticky = true;
    }
}

function saveState() {
    let currentState = {
        image: drawingLayer.get(),
        bgColor: canvasBgColor,
        bgImg: backgroundImage,
        tools: {
            color: brushColor, size: brushSize, type: brushType, alpha: brushAlpha,
            rainbow: isRainbowMode, sticky: isSticky, tool: currentTool, emoji: selectedEmoji, customBrush: customBrushImage,
            tint: isTintActive, spacing: brushSpacing 
        }
    };
    undoStack.push(currentState);
    redoStack = [];
    if (undoStack.length > 10) undoStack.shift();
}

function restoreState(state) {
    if (!state) return;
    drawingLayer.clear();
    drawingLayer.image(state.image, 0, 0, drawingLayer.width, drawingLayer.height);
    canvasBgColor = state.bgColor;
    backgroundImage = state.bgImg;
    brushColor = state.tools.color;
    brushSize = state.tools.size;
    brushType = state.tools.type;
    brushAlpha = state.tools.alpha;
    isRainbowMode = state.tools.rainbow;
    isSticky = state.tools.sticky;
    currentTool = state.tools.tool || 'freehand';
    selectedEmoji = state.tools.emoji || "😀";
    customBrushImage = state.tools.customBrush || null;
    isTintActive = state.tools.tint || false;
    brushSpacing = state.tools.spacing || 50; 
    updateUI();
}

function updateUI() {
    if(brushPicker) brushPicker.value(brushColor);
    if(sizeSlider) sizeSlider.value(brushSize);
    if(spacingSlider) spacingSlider.value(brushSpacing); 
    if(brushTypeSelect) brushTypeSelect.selected(brushType);
    if(opacitySlider) opacitySlider.value(brushAlpha);
    if(rainbowCheckbox) rainbowCheckbox.checked(isRainbowMode);
    if(bgPicker) bgPicker.value(canvasBgColor);
    if(fileNameInput) fileNameInput.value('myDrawing'); 
    if(tintCheckbox) tintCheckbox.checked(isTintActive);
    
    if(emojiInput) emojiInput.value(selectedEmoji);
    if(emojiSelect && (brushType === 'Emoji Pen' || brushType === 'Emoji Spray')) {
        let opts = emojiSelect.elt.options;
        let found = false;
        for(let i=0; i<opts.length; i++){
            if(opts[i].value === selectedEmoji) found = true;
        }
        if(found) emojiSelect.selected(selectedEmoji);
        else emojiSelect.selected('custom');
    }
    
    handleBrushTypeChange();
    
    if(shapeSelect) {
        let toolName = currentTool.charAt(0).toUpperCase() + currentTool.slice(1);
        shapeSelect.selected(toolName);
    }
}

function handleUndo() { if (undoStack.length > 0) { redoStack.push({image:drawingLayer.get(),bgColor:canvasBgColor,bgImg:backgroundImage,tools:{color:brushColor,size:brushSize,type:brushType,alpha:brushAlpha,rainbow:isRainbowMode,sticky:isSticky,tool:currentTool,emoji:selectedEmoji,customBrush:customBrushImage,tint:isTintActive,spacing:brushSpacing}}); restoreState(undoStack.pop()); } }
function handleRedo() { if (redoStack.length > 0) { undoStack.push({image:drawingLayer.get(),bgColor:canvasBgColor,bgImg:backgroundImage,tools:{color:brushColor,size:brushSize,type:brushType,alpha:brushAlpha,rainbow:isRainbowMode,sticky:isSticky,tool:currentTool,emoji:selectedEmoji,customBrush:customBrushImage,tint:isTintActive,spacing:brushSpacing}}); restoreState(redoStack.pop()); } }

function resetDefaults() {
    brushColor = '#000000'; brushSize = 30; brushSpacing = 50; brushType = 'Emoji Pen'; brushAlpha = 255; isRainbowMode = false; isSticky = false; canvasBgColor = '#ffffff'; currentTool = 'freehand'; backgroundImage = null; customBrushImage = null; selectedEmoji = "😀"; isTintActive = false;
    updateUI();
}

function drawStartScreenAnimation() {
    background(245);
    // Draw floating emojis
    for(let s of startShapes) { s.update(); s.display(); }
    
    // Main Title and Box
    fill(255, 255, 255, 220); 
    noStroke(); 
    rectMode(CENTER); 
    rect(width/2, height/2 - 60, 600, 180, 20); // Box background
    
    fill(30); 
    textAlign(CENTER, CENTER); 
    textFont('sans-serif');
    
    // Title
    textSize(50);
    textStyle(BOLD);
    text("EMOJI BRUSH", width / 2, height / 2 - 90);
    
    // Subtitle / Instruction
    textSize(18);
    textStyle(NORMAL);
    fill(80);
    text("Paint with Emojis, Stickers & Images!", width / 2, height / 2 - 40);
    
    // Hint
    textSize(14);
    fill(120);
    text("(Press START to begin)", width / 2, height / 2 + 50);
}

function repositionUI() { startButton.position(width/2 - 100, height/2 + 30); }
function enableDrawing() { startButton.hide(); isFixedSize = false; resizeCanvas(windowWidth, windowHeight); drawingLayer = createGraphics(windowWidth, windowHeight); drawingLayer.pixelDensity(3); drawingLayer.strokeJoin(ROUND); styleCanvasFull(); isDrawing = true; waitForRelease = true; createSidebarUI(); background(255); cursor(CROSS); }
function handleBgUpload(file) { if (file.type === 'image') { saveState(); backgroundImage = loadImage(file.data); } else backgroundImage = null; }
function handleBrushUpload(file) { if (file.type === 'image') customBrushImage = loadImage(file.data); else customBrushImage = null; }

function handleBrushTypeChange() {
    let type = brushTypeSelect.value();
    brushType = type;
    
    emojiInput.style('display', 'none');
    emojiSelect.style('display', 'none');
    brushImageInput.style('display', 'none');

    if (type === 'Emoji Pen' || type === 'Emoji Spray') {
        emojiSelect.style('display', 'block');
        if (emojiSelect.value() === 'custom') {
            emojiInput.style('display', 'block');
        }
    } else if (type === 'Image') {
        brushImageInput.style('display', 'block');
    }
}

function handleEmojiSelectChange() {
    let val = emojiSelect.value();
    if (val === 'custom') {
        emojiInput.style('display', 'block');
    } else {
        emojiInput.style('display', 'none');
        selectedEmoji = val;
    }
}

// --- UTILITY STYLES PER UI ---
// Funzioni per applicare stili senza usare CSS esterni

function styleContainerDiv(div) {
    div.style('display', 'flex');
    div.style('flex-direction', 'column');
    div.style('gap', '15px');
    div.style('padding', '20px');
    div.style('height', '100%');
    div.style('width', '100%');
    div.style('box-sizing', 'border-box');
    div.style('overflow-y', 'auto');
}

function styleToolBtn(btn) {
    btn.style('padding', '10px');
    btn.style('cursor', 'pointer');
    btn.style('background-color', '#555');
    btn.style('color', 'white');
    btn.style('border', 'none');
    btn.style('border-radius', '5px');
    btn.style('text-align', 'center');
    btn.style('font-size', '14px');
    btn.style('width', '100%');
    btn.style('transition', 'background 0.2s');
    btn.style('flex-shrink', '0');
    
    btn.mouseOver(() => btn.style('background-color', '#777'));
    btn.mouseOut(() => btn.style('background-color', '#555'));
    return btn;
}

function styleDangerBtn(btn) {
    styleToolBtn(btn);
    btn.style('background-color', '#d32f2f');
    btn.mouseOver(() => btn.style('background-color', '#b71c1c'));
    btn.mouseOut(() => btn.style('background-color', '#d32f2f'));
    return btn;
}

function styleInput(inp) {
    inp.style('padding', '8px');
    inp.style('border-radius', '5px');
    inp.style('width', '100%');
    inp.style('background', 'white');
    inp.style('border', 'none');
    inp.style('font-family', 'sans-serif');
    inp.style('box-sizing', 'border-box');
    inp.style('flex-shrink', '0');
    return inp;
}

function styleLabel(lbl) {
    lbl.style('font-size', '12px');
    lbl.style('color', '#ccc');
    lbl.style('margin-bottom', '5px');
    lbl.style('display', 'block');
    lbl.style('flex-shrink', '0');
    return lbl;
}
function createSidebarUI() {
    sidebar = createDiv(); 
    sidebar.id('sidebar');
    
    // Stile Sidebar
    sidebar.style('position', 'fixed');
    sidebar.style('left', '0');
    sidebar.style('top', '0');
    sidebar.style('width', '200px');
    sidebar.style('height', '100vh');
    sidebar.style('background-color', '#333');
    sidebar.style('color', 'white');
    sidebar.style('box-shadow', '2px 0 5px rgba(0,0,0,0.2)');
    sidebar.style('transition', 'transform 0.3s ease');
    sidebar.style('z-index', '100');
    sidebar.style('overflow', 'visible');
    
    if(isSidebarOpen) sidebar.style('transform', 'translateX(0)');
    else sidebar.style('transform', 'translateX(-200px)');

    // Toggle Button
    sidebarToggle = createButton(isSidebarOpen ? '◄' : '►'); 
    sidebarToggle.id('sidebar-toggle'); 
    sidebarToggle.parent(sidebar); 
    
    // Stile Toggle
    sidebarToggle.style('position', 'absolute');
    sidebarToggle.style('right', '-40px');
    sidebarToggle.style('top', '10px');
    sidebarToggle.style('width', '40px');
    sidebarToggle.style('height', '40px');
    sidebarToggle.style('background-color', '#333');
    sidebarToggle.style('color', 'white');
    sidebarToggle.style('border', 'none');
    sidebarToggle.style('border-radius', '0 5px 5px 0');
    sidebarToggle.style('cursor', 'pointer');
    sidebarToggle.style('font-size', '20px');
    sidebarToggle.style('display', 'flex');
    sidebarToggle.style('align-items', 'center');
    sidebarToggle.style('justify-content', 'center');
    sidebarToggle.style('box-shadow', '2px 2px 5px rgba(0,0,0,0.2)');
    sidebarToggle.style('z-index', '101');
    
    sidebarToggle.mousePressed(toggleSidebar);
    
    let content = createDiv(); 
    content.id('sidebar-content'); 
    content.parent(sidebar);
    styleContainerDiv(content);

    let h2 = createElement('h2', 'Tools');
    h2.parent(content);
    h2.style('margin', '0 0 10px 0');
    h2.style('font-size', '18px');
    h2.style('border-bottom', '1px solid #555');
    h2.style('padding-bottom', '10px');
    h2.style('flex-shrink', '0');

    let clearBtn = createButton('🗑️ Clear Canvas'); 
    styleDangerBtn(clearBtn); 
    clearBtn.parent(content);
    clearBtn.mousePressed(()=>{ saveState(); drawingLayer.clear(); backgroundImage=null; });

    // --- SEZIONE UNDO / REDO CORRETTA ---
    let undoRedo = createDiv(); 
    undoRedo.parent(content);
    undoRedo.style('display', 'flex');
    undoRedo.style('gap', '10px'); // Spazio tra i bottoni
    undoRedo.style('width', '100%');
    undoRedo.style('flex-shrink', '0');

    let uBtn = createButton('Undo');
    styleToolBtn(uBtn); // Applica lo stile base
    uBtn.parent(undoRedo);
    uBtn.style('width', 'auto'); // IMPORTANTE: Resetta la larghezza per farlo stare nella riga
    uBtn.style('flex-grow', '1'); // Si espande per riempire metà spazio
    uBtn.mousePressed(handleUndo);
    
    let rBtn = createButton('Redo');
    styleToolBtn(rBtn);
    rBtn.parent(undoRedo);
    rBtn.style('width', 'auto'); // IMPORTANTE: Resetta la larghezza anche qui
    rBtn.style('flex-grow', '1');
    rBtn.mousePressed(handleRedo);
    // -------------------------------------

    let sizeBtn = createButton('Canvas size'); 
    styleToolBtn(sizeBtn);
    sizeBtn.style('margin-top','15px'); 
    sizeBtn.parent(content);
    
    let sizeMenu = createDiv(); 
    sizeMenu.parent(content); 
    sizeMenu.style('display','none'); 
    sizeMenu.style('margin-top','5px'); 
    sizeMenu.style('padding-left','10px'); 
    sizeMenu.style('border-left','2px solid #03A9F4');
    
    sizeBtn.mousePressed(() => { sizeMenu.style('display',sizeMenu.style('display')==='none'?'block':'none'); });
    
    styleLabel(createElement('label', 'Select size:')).parent(sizeMenu);
    sizeSelect = createSelect(); 
    styleInput(sizeSelect).parent(sizeMenu); 
    ['Full window','16:9','4:3','3:2','1:1'].forEach(o => sizeSelect.option(o));
    sizeSelect.changed(() => { handleSizeChange(); sizeMenu.style('display','none'); });

    let colorBtn = createButton('Colours & BG'); 
    styleToolBtn(colorBtn);
    colorBtn.style('margin-top','15px'); 
    colorBtn.parent(content);
    
    let colorMenu = createDiv(); 
    colorMenu.parent(content); 
    colorMenu.style('display','none'); 
    colorMenu.style('margin-top','5px'); 
    colorMenu.style('padding-left','10px'); 
    colorMenu.style('border-left','2px solid #03A9F4');
    
    colorBtn.mousePressed(() => { colorMenu.style('display',colorMenu.style('display')==='none'?'block':'none'); });
    
    styleLabel(createElement('label', 'Canvas color:')).parent(colorMenu);
    bgPicker = createColorPicker('#ffffff'); 
    bgPicker.parent(colorMenu); 
    bgPicker.style('border', 'none');
    bgPicker.style('width', '100%');
    bgPicker.style('height', '35px');
    bgPicker.style('cursor', 'pointer');
    bgPicker.style('background', 'transparent');
    bgPicker.mousePressed(saveState); 
    bgPicker.input(()=>{canvasBgColor=bgPicker.value();backgroundImage=null;});
    
    styleLabel(createElement('label', 'Or Upload Background:')).parent(colorMenu).style('margin-top','10px');
    bgImageInput = createFileInput(handleBgUpload); 
    bgImageInput.parent(colorMenu);
    bgImageInput.style('font-size', '10px');
    bgImageInput.style('color', '#ccc');
    bgImageInput.style('width', '100%');

    styleLabel(createElement('label', 'Brush color (Tint):')).parent(colorMenu).style('margin-top','10px');
    brushPicker = createColorPicker('#000000'); 
    brushPicker.parent(colorMenu); 
    brushPicker.style('border', 'none');
    brushPicker.style('width', '100%');
    brushPicker.style('height', '35px');
    brushPicker.style('background', 'transparent');
    brushPicker.mousePressed(saveState); 
    brushPicker.input(()=>{brushColor=brushPicker.value();});

    tintCheckbox = createCheckbox(' Apply Color/Tint', false); 
    tintCheckbox.parent(colorMenu); 
    tintCheckbox.style('color','#ccc'); 
    tintCheckbox.style('font-size','12px');
    tintCheckbox.style('margin-top', '5px');
    tintCheckbox.changed(()=>{ isTintActive = tintCheckbox.checked(); });

    rainbowCheckbox = createCheckbox(' Rainbow mode', false); 
    rainbowCheckbox.parent(colorMenu); 
    rainbowCheckbox.style('margin-top','5px'); 
    rainbowCheckbox.style('color','#ccc'); 
    rainbowCheckbox.style('font-size','12px');
    rainbowCheckbox.mousePressed(saveState); 
    rainbowCheckbox.changed(()=>{isRainbowMode=rainbowCheckbox.checked();});

    let brushTypeBtn = createButton('Brush Mode'); 
    styleToolBtn(brushTypeBtn);
    brushTypeBtn.style('margin-top','15px'); 
    brushTypeBtn.parent(content);
    
    let brushSettings = createDiv(); 
    brushSettings.parent(content); 
    brushSettings.style('display','none'); 
    brushSettings.style('margin-top','5px'); 
    brushSettings.style('padding-left','10px'); 
    brushSettings.style('border-left','2px solid #03A9F4');
    
    brushTypeBtn.mousePressed(() => { brushSettings.style('display',brushSettings.style('display')==='none'?'block':'none'); });

    styleLabel(createElement('label', 'Mode:')).parent(brushSettings);
    brushTypeSelect = createSelect(); 
    styleInput(brushTypeSelect).parent(brushSettings);
    ['Emoji Pen', 'Emoji Spray', 'Image'].forEach(o => brushTypeSelect.option(o));
    brushTypeSelect.mousePressed(saveState); 
    brushTypeSelect.changed(handleBrushTypeChange);

    emojiSelect = createSelect();
    styleInput(emojiSelect).parent(brushSettings);
    emojiSelect.style('display', 'block'); 
    emojiSelect.style('margin-top', '5px');
    let emojis = ['😀','😂','😍','😎','😭','😡','👻','👽','🤖','💩','❤️','✨','🔥','🎉','🍕','🚀'];
    emojis.forEach(e => emojiSelect.option(e));
    emojiSelect.option('Write custom...', 'custom'); 
    emojiSelect.changed(handleEmojiSelectChange);

    emojiInput = createInput('😀'); 
    styleInput(emojiInput).parent(brushSettings); 
    emojiInput.style('display','none'); 
    emojiInput.style('margin-top','5px');
    emojiInput.input(()=>{selectedEmoji=emojiInput.value();});

    brushImageInput = createFileInput(handleBrushUpload); 
    brushImageInput.parent(brushSettings); 
    brushImageInput.style('display','none');
    brushImageInput.style('font-size', '10px');
    brushImageInput.style('color', '#ccc');

    styleLabel(createElement('label', 'Size:')).parent(brushSettings).style('margin-top','10px');
    sizeSlider = createSlider(1, 150, 30); 
    sizeSlider.parent(brushSettings); 
    sizeSlider.style('width', '100%');
    sizeSlider.mousePressed(saveState); 
    sizeSlider.input(()=>{brushSize=sizeSlider.value();});

    styleLabel(createElement('label', 'Spacing:')).parent(brushSettings).style('margin-top','10px');
    spacingSlider = createSlider(1, 150, 50); 
    spacingSlider.parent(brushSettings); 
    spacingSlider.style('width', '100%');
    spacingSlider.mousePressed(saveState); 
    spacingSlider.input(()=>{brushSpacing=spacingSlider.value();});

    styleLabel(createElement('label', 'Opacity:')).parent(brushSettings).style('margin-top','10px');
    opacitySlider = createSlider(0, 255, 255); 
    opacitySlider.parent(brushSettings); 
    opacitySlider.style('width', '100%');
    opacitySlider.mousePressed(saveState); 
    opacitySlider.input(()=>{brushAlpha=opacitySlider.value();});

    let shapesBtn = createButton('Geometrical Shapes'); 
    styleToolBtn(shapesBtn);
    shapesBtn.style('margin-top','15px'); 
    shapesBtn.parent(content);
    
    let shapesMenu = createDiv(); 
    shapesMenu.parent(content); 
    shapesMenu.style('display','none'); 
    shapesMenu.style('margin-top','5px'); 
    shapesMenu.style('padding-left','10px'); 
    shapesMenu.style('border-left','2px solid #03A9F4');
    
    shapesBtn.mousePressed(() => { shapesMenu.style('display',shapesMenu.style('display')==='none'?'block':'none'); });
    
    styleLabel(createElement('label', 'Draw Shape with Emoji/Img:')).parent(shapesMenu);
    shapeSelect = createSelect(); 
    styleInput(shapeSelect).parent(shapesMenu);
    ['Freehand','Line','Rectangle','Circle','Triangle'].forEach(o => shapeSelect.option(o));
    shapeSelect.selected('Freehand'); 
    shapeSelect.mousePressed(saveState); 
    shapeSelect.changed(()=>{ let v=shapeSelect.value(); currentTool = (v==='Freehand')?'freehand':v.toLowerCase(); });

    let saveBtn = createButton('Save as'); 
    styleToolBtn(saveBtn);
    saveBtn.style('margin-top','auto'); 
    saveBtn.parent(content);
    
    let saveMenu = createDiv(); 
    saveMenu.parent(content); 
    saveMenu.style('display','none'); 
    saveMenu.style('margin-top','5px'); 
    saveMenu.style('padding-left','10px'); 
    saveMenu.style('border-left','2px solid #4CAF50');
    
    saveBtn.mousePressed(() => { saveMenu.style('display',saveMenu.style('display')==='none'?'block':'none'); });
    
    styleLabel(createElement('label', 'File name:')).parent(saveMenu);
    fileNameInput = createInput('myDrawing'); 
    styleInput(fileNameInput).parent(saveMenu); 
    fileNameInput.style('margin-bottom','10px');
    
    let jpgBtn = createButton('JPG');
    styleToolBtn(jpgBtn).parent(saveMenu);
    jpgBtn.mousePressed(()=>{ saveCanvas(fileNameInput.value()||'myDrawing','jpg'); saveMenu.style('display','none'); });
    
    let pngBtn = createButton('PNG'); 
    styleToolBtn(pngBtn);
    pngBtn.style('margin-top','5px'); 
    pngBtn.parent(saveMenu);
    
    let pngOpts = createDiv(); 
    pngOpts.parent(saveMenu); 
    pngOpts.style('display','none'); 
    pngOpts.style('padding-left','10px'); 
    pngOpts.style('border-left','1px solid #4CAF50');
    
    pngBtn.mousePressed(()=>{ pngOpts.style('display',pngOpts.style('display')==='none'?'block':'none'); });
    
    let pngFull = createButton('With background');
    styleToolBtn(pngFull).parent(pngOpts).style('font-size','12px');
    pngFull.mousePressed(()=>{ saveCanvas(fileNameInput.value()||'myDrawing','png'); saveMenu.style('display','none'); });
    
    let pngTrans = createButton('Without background');
    styleToolBtn(pngTrans).parent(pngOpts).style('margin-top','5px').style('font-size','12px');
    pngTrans.mousePressed(()=>{ save(drawingLayer, (fileNameInput.value()||'myDrawing')+'.png'); saveMenu.style('display','none'); });

    let optsBtn = createButton('Options'); 
    styleToolBtn(optsBtn);
    optsBtn.style('margin-top','10px'); 
    optsBtn.parent(content);
    
    let optsMenu = createDiv(); 
    optsMenu.parent(content); 
    optsMenu.style('display','none'); 
    optsMenu.style('margin-top','5px'); 
    optsMenu.style('padding-left','10px'); 
    optsMenu.style('border-left','2px solid #F44336');
    
    optsBtn.mousePressed(()=>{ optsMenu.style('display',optsMenu.style('display')==='none'?'block':'none'); });
    
    let resetBtn = createButton('Reset defaults');
    styleToolBtn(resetBtn).parent(optsMenu);
    resetBtn.mousePressed(()=>{ saveState(); resetDefaults(); optsMenu.style('display','none'); });
}
function handleSizeChange() { let v=sizeSelect.value(); let img=drawingLayer.get(); undoStack=[]; redoStack=[]; let w,h; if(v==='Full window'){isFixedSize=false;resizeCanvas(windowWidth,windowHeight);w=windowWidth;h=windowHeight;styleCanvasFull();}else{isFixedSize=true; if(v==='16:9'){w=960;h=540;}else if(v==='4:3'){w=800;h=600;}else if(v==='3:2'){w=900;h=600;}else{w=600;h=600;} resizeCanvas(w,h);styleCanvasFixed();} drawingLayer=createGraphics(w,h); drawingLayer.pixelDensity(3); drawingLayer.strokeJoin(ROUND); drawingLayer.image(img,0,0,w,h); saveState(); }

function styleCanvasFull() { 
    let c=select('canvas'); 
    c.style('position','absolute'); 
    c.style('top','0'); 
    c.style('left','0'); 
    c.style('transform','none'); 
    c.style('box-shadow','none'); 
    c.style('border','none'); 
}

function styleCanvasFixed() { 
    let c=select('canvas'); 
    c.style('position','absolute'); 
    c.style('left','50%'); 
    c.style('top','50%'); 
    c.style('transform','translate(-50%, -50%)'); 
    c.style('box-shadow','0 0 20px rgba(0,0,0,0.1)'); 
    c.style('border','1px solid #ddd'); 
}

function toggleSidebar() { 
    isSidebarOpen=!isSidebarOpen; 
    if(isSidebarOpen){
        sidebar.style('transform', 'translateX(0)');
        sidebar.addClass('open'); // Manteniamo la classe per logica interna se serve
        sidebarToggle.html('◄');
    }else{
        sidebar.style('transform', 'translateX(-200px)');
        sidebar.removeClass('open');
        sidebarToggle.html('►');
    } 
    waitForRelease=true; 
}

function windowResized() { if(!isDrawing||(isDrawing&&!isFixedSize)){ resizeCanvas(windowWidth,windowHeight); drawingLayer=createGraphics(windowWidth,windowHeight); drawingLayer.pixelDensity(3); drawingLayer.strokeJoin(ROUND); if(!isDrawing) repositionUI(); else {background(255); undoStack=[]; redoStack=[];} } }

// --- REVISED START SCREEN CLASS ---
class StartScreenShape {
    constructor() { this.init(); }
    init() {
        this.x = random(width);
        this.y = random(height);
        this.size = random(30, 80);
        this.baseSize = this.size;
        this.emojis = ['🎨', '😂', '😎', '✨', '💩', '👻', '🎉', '🔥', '❤️', '👽', '🍕', '🚀'];
        this.emoji = random(this.emojis);
        
        this.vx = random(-3.5, 3.5);
        this.vy = random(-3.5, 3.5);
        
        this.angle = random(TWO_PI);
        this.rotSpeed = random(-0.03, 0.03);
        this.wobbleOffset = random(1000); 
    }
    update() {
        this.x += this.vx;
        let floatY = sin(frameCount * 0.05 + this.wobbleOffset) * 2;
        this.y += this.vy + floatY;
        this.angle += this.rotSpeed;
        this.size = this.baseSize + sin(frameCount * 0.1 + this.wobbleOffset) * 5;

        if (this.x < -100) this.x = width + 100;
        if (this.x > width + 100) this.x = -100;
        if (this.y < -100) this.y = height + 100;
        if (this.y > height + 100) this.y = -100;
    }
    display() {
        push();
        translate(this.x, this.y);
        rotate(this.angle);
        textAlign(CENTER, CENTER);
        textSize(this.size);
        text(this.emoji, 0, 0);
        pop();
    }
}