// WUP 2025-26
// Alice Federici 
let img, originalImg;
let input;
let lastX, lastY;
let currentPalette = 'thermal';
let sidebarWidth = 200;
let densitySlider, sizeSlider, gradientSlider;
let bgColorPicker;
let gradientToggle;
let canvasLayer;
let stepCount = 0;
let wInput, hInput;
let uiElements = [];
let welcomeOverlay;
let currentBgColor = '#ffffff';

function setup() {
  pixelDensity(displayDensity());
  createCanvas(windowWidth, windowHeight);
  // Inizializzazione layer predefinito
  createCanvasLayer(2000, 2000); 
  setupUI();
  createWelcomeScreen();
  lastX = mouseX;
  lastY = mouseY;
}

function createCanvasLayer(w, h) {
  // Protezione contro valori non validi o troppo bassi
  let safeW = max(10, int(w));
  let safeH = max(10, int(h));
  canvasLayer = createGraphics(safeW, safeH);
  canvasLayer.clear(); 
}

function createWelcomeScreen() {
  welcomeOverlay = createDiv('');
  welcomeOverlay.style('position', 'fixed');
  welcomeOverlay.style('top', '0');
  welcomeOverlay.style('left', '0');
  welcomeOverlay.style('width', '100vw');
  welcomeOverlay.style('height', '100vh');
  welcomeOverlay.style('background-color', '#0a0a0a');
  welcomeOverlay.style('display', 'flex');
  welcomeOverlay.style('flex-direction', 'column');
  welcomeOverlay.style('justify-content', 'center');
  welcomeOverlay.style('align-items', 'center');
  welcomeOverlay.style('z-index', '1000');
  welcomeOverlay.style('transition', 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)');

  let title = createP('A TOOL BRUSH');
  title.parent(welcomeOverlay);
  title.style('color', '#fff');
  title.style('font-family', 'Inter, system-ui, sans-serif');
  title.style('font-size', '14px');
  title.style('font-weight', '700');
  title.style('letter-spacing', '12px');
  title.style('margin-bottom', '4px');
  title.style('text-transform', 'uppercase');

  let subtitle = createP('Select an image to get started');
  subtitle.parent(welcomeOverlay);
  subtitle.style('color', '#fff');
  subtitle.style('font-family', 'Inter, system-ui, sans-serif');
  subtitle.style('font-size', '10px');
  subtitle.style('font-weight', '300');
  subtitle.style('letter-spacing', '1.5px');
  subtitle.style('margin-top', '0px');
  subtitle.style('margin-bottom', '35px');
  subtitle.style('opacity', '0.4');

  input.parent(welcomeOverlay);
  input.style('color', '#555');
}

function setupUI() {
  let yPos = 40;
  const createLabel = (text, y) => {
    let l = createP(text);
    l.position(30, y);
    l.style('font-family', 'Inter, sans-serif');
    l.style('font-size', '9px');
    l.style('font-weight', '600');
    l.style('letter-spacing', '1.5px');
    l.style('color', '#999');
    uiElements.push(l);
    return l;
  };

  input = createFileInput(handleFile);

  createLabel('CANVAS SIZE', yPos);
  wInput = createInput('2000');
  wInput.position(30, yPos + 25);
  wInput.size(45);
  styleInput(wInput);
  
  hInput = createInput('2000');
  hInput.position(85, yPos + 25);
  hInput.size(45);
  styleInput(hInput);
  
  let resizeBtn = createButton('SET');
  resizeBtn.position(140, yPos + 25);
  styleBtn(resizeBtn, 40);
  resizeBtn.mousePressed(() => {
    let nw = int(wInput.value());
    let nh = int(hInput.value());
    if (isNaN(nw) || isNaN(nh) || nw < 100 || nh < 100) {
      alert("Please enter a valid size (min 100px)");
      return;
    }
    if(confirm("This will clear the current drawing. Continue?")) {
      createCanvasLayer(nw, nh);
    }
  });
  uiElements.push(resizeBtn);

  yPos += 90;
  createLabel('PALETTE', yPos);
  createPaletteButtons(yPos + 25);

  yPos += 160;
  createLabel('DISTANCE', yPos);
  densitySlider = createSlider(5, 150, 25);
  styleSlider(densitySlider, yPos + 25);

  yPos += 60;
  createLabel('BRUSH SIZE', yPos);
  sizeSlider = createSlider(0.1, 3.0, 1.5, 0.1);
  styleSlider(sizeSlider, yPos + 25);

  yPos += 60;
  createLabel('GRADIENT EFFECT', yPos);
  gradientToggle = createCheckbox(' ACTIVE', false);
  gradientToggle.position(30, yPos + 25);
  gradientToggle.style('font-family', 'Inter, sans-serif');
  gradientToggle.style('font-size', '10px');
  uiElements.push(gradientToggle);
  
  gradientSlider = createSlider(5, 150, 50);
  styleSlider(gradientSlider, yPos + 50);

  yPos += 90;
  createLabel('BACKGROUND COLOR', yPos);
  bgColorPicker = createColorPicker('#ffffff');
  bgColorPicker.position(30, yPos + 25);
  bgColorPicker.style('width', '140px');
  bgColorPicker.input(() => currentBgColor = bgColorPicker.color());
  uiElements.push(bgColorPicker);

  let info = createP('[C] CLEAR &nbsp; [S] SAVE HQ');
  info.position(30, height - 50);
  info.style('font-family', 'Inter, sans-serif');
  info.style('font-size', '9px');
  info.style('color', '#ccc');
  uiElements.push(info);

  toggleUI(false);
}

function draw() {
  background(245); 
  
  if (!canvasLayer) return;

  push();
  // Calcolo scala con protezione
  let availableW = width - sidebarWidth - 100;
  let availableH = height - 100;
  let previewScale = min(availableW / canvasLayer.width, availableH / canvasLayer.height);
  
  translate(sidebarWidth + (width - sidebarWidth) / 2, height / 2);
  scale(previewScale);
  
  rectMode(CENTER);
  noStroke();
  fill(currentBgColor);
  rect(0, 0, canvasLayer.width, canvasLayer.height);
  
  // Shadow effect
  fill(0, 15);
  rect(10, 10, canvasLayer.width, canvasLayer.height);
  
  imageMode(CENTER);
  image(canvasLayer, 0, 0);
  pop();
  
  // Sidebar
  noStroke();
  fill(255);
  rect(0, 0, sidebarWidth, height);
  stroke(240);
  line(sidebarWidth, 0, sidebarWidth, height);
  
  if (img && mouseX > sidebarWidth) {
    drawPreviewCursor(previewScale);
    if (!mouseIsPressed) {
      lastX = mouseX;
      lastY = mouseY;
    }
  }
}

function drawPreviewCursor(pScale) {
  push(); 
  noFill(); 
  stroke(180); 
  strokeWeight(1 / pScale); // Mantiene la linea sottile indipendentemente dallo zoom
  
  let baseScale = sizeSlider.value();
  let dX = mouseIsPressed ? abs(mouseX - lastX) * 0.05 : 0;
  let dY = mouseIsPressed ? abs(mouseY - lastY) * 0.05 : 0;
  
  translate(mouseX, mouseY);
  scale(pScale);
  rectMode(CENTER); 
  rect(0, 0, img.width * (baseScale + dX), img.height * (baseScale + dY));
  pop();
}

function paintImage() {
  if (!img || !canvasLayer) return;

  let availableW = width - sidebarWidth - 100;
  let availableH = height - 100;
  let previewScale = min(availableW / canvasLayer.width, availableH / canvasLayer.height);

  // Conversione coordinate schermo -> coordinate canvasLayer
  let tx = (mouseX - (sidebarWidth + (width - sidebarWidth) / 2)) / previewScale + canvasLayer.width / 2;
  let ty = (mouseY - height / 2) / previewScale + canvasLayer.height / 2;

  let dX = abs(mouseX - lastX) * 0.03;
  let dY = abs(mouseY - lastY) * 0.03;

  canvasLayer.push();
  canvasLayer.imageMode(CENTER);
  canvasLayer.translate(tx, ty);
  let baseScale = sizeSlider.value();
  canvasLayer.scale(baseScale + dX, baseScale + dY);

  if (gradientToggle.checked()) {
    let alpha = map(stepCount, 0, gradientSlider.value(), 255, 0, true);
    canvasLayer.tint(255, alpha);
  } else { 
    canvasLayer.noTint(); 
  }
  
  canvasLayer.image(img, 0, 0);
  canvasLayer.pop();
}

function handleFile(file) {
  if (file.type === 'image') {
    originalImg = loadImage(file.data, (loaded) => {
      loaded.resize(500, 0);
      img = loaded.get();
      processImage(img);
      welcomeOverlay.style('opacity', '0');
      welcomeOverlay.style('pointer-events', 'none');
      setTimeout(() => { 
        welcomeOverlay.remove(); 
        toggleUI(true); 
      }, 800);
    });
  }
}

function mousePressed() { 
  if (mouseX > sidebarWidth && img) { 
    stepCount = 0; 
    lastX = mouseX;
    lastY = mouseY;
    paintImage(); 
  } 
}

function mouseDragged() {
  if (!img || mouseX < sidebarWidth) return;
  let d = dist(mouseX, mouseY, lastX, lastY);
  if (d > densitySlider.value()) { 
    stepCount++; 
    paintImage(); 
    lastX = mouseX; 
    lastY = mouseY; 
  }
}

function saveHighRes() {
  let exportCanvas = createGraphics(canvasLayer.width, canvasLayer.height);
  exportCanvas.background(currentBgColor);
  exportCanvas.image(canvasLayer, 0, 0);
  save(exportCanvas, 'tool_brush_render_HQ.png');
}

function keyPressed() {
  if (key === 'c' || key === 'C') canvasLayer.clear();
  if (key === 's' || key === 'S') saveHighRes();
}

function processImage(p) {
  p.loadPixels();
  for (let i = 0; i < p.pixels.length; i += 4) {
    let r = p.pixels[i], g = p.pixels[i+1], b = p.pixels[i+2];
    let avg = (r + g + b) / 3;
    if (currentPalette === 'thermal') {
      if (avg < 60) { p.pixels[i]=45; p.pixels[i+1]=0; p.pixels[i+2]=180; }
      else if (avg < 120) { p.pixels[i]=255; p.pixels[i+1]=0; p.pixels[i+2]=150; }
      else if (avg < 190) { p.pixels[i]=0; p.pixels[i+1]=255; p.pixels[i+2]=220; }
      else { p.pixels[i]=255; p.pixels[i+1]=255; p.pixels[i+2]=150; }
    } else if (currentPalette === 'neon') {
      p.pixels[i] = avg > 120 ? 255 : 20; p.pixels[i+1] = 0; p.pixels[i+2] = avg > 120 ? 200 : 255;
    } else if (currentPalette === 'ocean') {
      p.pixels[i] = 0; p.pixels[i+1] = avg; p.pixels[i+2] = avg + 50;
    } else if (currentPalette === 'forest') {
      p.pixels[i] = avg/2; p.pixels[i+1] = avg; p.pixels[i+2] = 40;
    } else if (currentPalette === 'sunset') {
      p.pixels[i] = 255; p.pixels[i+1] = avg; p.pixels[i+2] = 50;
    } else if (currentPalette === 'bw') {
      p.pixels[i] = p.pixels[i+1] = p.pixels[i+2] = avg;
    } else if (currentPalette === 'vintage') {
      p.pixels[i] = avg + 30; p.pixels[i+1] = avg; p.pixels[i+2] = avg - 30;
    }
  }
  p.updatePixels();
}

function createPaletteButtons(startY) {
  const palNames = ['THM', 'NEO', 'B&W', 'VIN', 'OCN', 'FOR', 'SUN'];
  const palIDs = ['thermal', 'neon', 'bw', 'vintage', 'ocean', 'forest', 'sunset'];
  for (let i = 0; i < palNames.length; i++) {
    let btn = createButton(palNames[i]);
    let col = i % 3; let row = floor(i / 3);
    btn.position(30 + col * 50, startY + row * 30);
    styleBtn(btn, 45);
    btn.mousePressed(() => {
      currentPalette = palIDs[i];
      if (originalImg) { img = originalImg.get(); processImage(img); }
    });
    uiElements.push(btn);
  }
}

function styleInput(i) { i.style('background','none'); i.style('border','none'); i.style('border-bottom','1px solid #eee'); i.style('font-size','11px'); uiElements.push(i); }
function styleBtn(b, w) { b.size(w, 22); b.style('background','#f0f0f0'); b.style('border','none'); b.style('font-size','9px'); b.style('cursor','pointer'); }
function styleSlider(s, y) { s.position(30, y); s.style('width', '140px'); uiElements.push(s); }
function toggleUI(show) { for (let el of uiElements) { if (show) el.show(); else el.hide(); } }