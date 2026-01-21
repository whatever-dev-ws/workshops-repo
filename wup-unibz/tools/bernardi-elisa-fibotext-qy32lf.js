let pg, spiralTexture;
let fonts = {}; 
let currentFontName = 'System'; 
let autoRot = 0;
let uiElements = [];
let sidebar;
let currentTemplate = 'Spirale'; 
let currentRatio = '1:1';

const params = {
  text: "GHOST DESIGN",
  textColor: '#ffffff',
  canvasColor: '#0f0f0f', // Colore sfondo
  rotationSpeed: 0.005,
  radius: 150, 
  height: 400, 
  textSize: 70, 
  lineSpacing: 0.9,
  detail: 80,
  angleStep: 18,
  expansion: 0.18,
  numElements: 120,
  minFont: 10,
  maxFont: 45
};

function setup() {
  let sz = calculateSize(currentRatio);
  createCanvas(sz.w, sz.h, WEBGL);
  
  sidebar = createDiv('');
  styleSidebar(); 

  // Buffer principale per Cilindro/Sfera
  pg = createGraphics(1024, 512);
  pg.pixelDensity(1);
  
  // Buffer per la Spirale
  spiralTexture = createGraphics(400, 100);
  
  textureMode(NORMAL);
  angleMode(DEGREES);
  
  createInterface();
  repositionCanvas();
}

function draw() {
  background(params.canvasColor); // Sfondo dinamico
  orbitControl(); 
  ambientLight(255);
  
  autoRot += params.rotationSpeed * 100;

  if (currentTemplate === 'Sfera Ghost') renderSphere();
  else if (currentTemplate === 'Cilindro Ghost') renderCylinder();
  else if (currentTemplate === 'Spirale') renderSpiral();
}

// --- LOGICA SPIRALE ---
function renderSpiral() {
  spiralTexture.clear();
  if (fonts[currentFontName]) spiralTexture.textFont(fonts[currentFontName]);
  else spiralTexture.textFont('sans-serif');
  
  spiralTexture.textAlign(CENTER, CENTER);
  spiralTexture.fill(params.textColor);
  spiralTexture.textSize(60);
  spiralTexture.text(params.text.replace(/\n/g, " "), spiralTexture.width/2, spiralTexture.height/2);

  push();
  rotateX(65); 
  translate(0, 0, -params.height/2); 
  noStroke();
  
  for (let i = 0; i < params.numElements; i++) {
    push();
    let dSize = map(i, 0, params.numElements, params.minFont, params.maxFont);
    let zPos = map(i, 0, params.numElements, 0, params.height);
    let theta = i * params.angleStep + autoRot;
    let localR = pow(i, 1.2) * params.expansion * 2.5;
    
    translate(localR * cos(theta), localR * sin(theta), zPos);
    rotateZ(theta + 90);
    
    texture(spiralTexture);
    plane(dSize * 3.5, dSize); 
    pop();
  }
  pop();
}

// --- LOGICA CILINDRO GHOST ---
function renderCylinder() {
  updateTexture();
  push();
  rotateY(autoRot);
  texture(pg);
  noStroke();
  let gl = _renderer.GL;
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.enable(gl.CULL_FACE);
  
  gl.cullFace(gl.FRONT); gl.depthMask(false);
  drawCustomCylinder(true);
  
  gl.cullFace(gl.BACK); gl.depthMask(true);
  drawCustomCylinder(false);
  
  gl.disable(gl.CULL_FACE);
  pop();
}

function drawCustomCylinder(inverted) {
  beginShape(TRIANGLE_STRIP);
  for (let i = 0; i <= params.detail; i++) {
    let a = map(i, 0, params.detail, 0, 360);
    let u = inverted ? map(i, 0, params.detail, 1, 0) : map(i, 0, params.detail, 0, 1);
    vertex(params.radius * cos(a), -params.height / 2, params.radius * sin(a), u, 0);
    vertex(params.radius * cos(a), params.height / 2, params.radius * sin(a), u, 1);
  }
  endShape();
}

// --- LOGICA SFERA GHOST ---
function renderSphere() {
  updateTexture();
  push();
  rotateY(autoRot);
  texture(pg);
  noStroke();
  let gl = _renderer.GL;
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.enable(gl.CULL_FACE);
  
  gl.cullFace(gl.FRONT); gl.depthMask(false);
  sphere(params.radius, params.detail/2, params.detail/2);
  
  gl.cullFace(gl.BACK); gl.depthMask(true);
  sphere(params.radius, params.detail/2, params.detail/2);
  
  gl.disable(gl.CULL_FACE);
  pop();
}

// --- SUPPORT ---
function updateTexture() {
  pg.clear();
  if (fonts[currentFontName]) pg.textFont(fonts[currentFontName]);
  else pg.textFont('sans-serif');
  pg.noStroke();
  pg.fill(params.textColor);
  pg.textAlign(CENTER, CENTER);
  pg.textSize(params.textSize);
  pg.textLeading(params.textSize * params.lineSpacing);
  pg.text(params.text, pg.width / 2, pg.height / 2);
}

function handleFontUpload(file) {
  if (file.subtype === 'otf' || file.subtype === 'ttf') {
    loadFont(file.data, (newFont) => {
      let name = file.name.split('.')[0]; 
      fonts[name] = newFont;
      currentFontName = name;
    });
  }
}

function createInterface() {
  uiElements.forEach(el => el.remove());
  uiElements = [];

  makeLabel("TEMPLATE");
  let selT = createSelect().parent(sidebar).style('width','100%');
  ['Spirale', 'Cilindro Ghost', 'Sfera Ghost'].forEach(t => selT.option(t));
  selT.selected(currentTemplate);
  selT.changed(() => { currentTemplate = selT.value(); createInterface(); });
  uiElements.push(selT);

  makeLabel("CARICA FONT (.TTF)");
  let bLoad = createFileInput(handleFontUpload).parent(sidebar);
  uiElements.push(bLoad);

  makeLabel("TESTO");
  let ta = createElement('textarea', params.text).parent(sidebar).style('width','100%').style('height','40px');
  ta.input(() => params.text = ta.value());
  uiElements.push(ta);

  makeSlider("VELOCITÀ", 0, 0.05, params.rotationSpeed, (v) => params.rotationSpeed = v);
  makeSlider("ALTEZZA", 100, 800, params.height, (v) => params.height = v);
  
  if (currentTemplate === 'Spirale') {
    makeSlider("ESPANSIONE", 0.01, 1.0, params.expansion, (v) => params.expansion = v);
    makeSlider("SEGMENTI", 50, 300, params.numElements, (v) => params.numElements = v);
  } else {
    makeSlider("RAGGIO FORMA", 50, 300, params.radius, (v) => params.radius = v);
    makeSlider("DIMENSIONE FONT", 20, 150, params.textSize, (v) => params.textSize = v);
  }

  let bReset = createButton('🎯 RESET VIEW').parent(sidebar).style('width','100%').style('margin-top','20px');
  bReset.mousePressed(() => camera(0, 0, 800, 0, 0, 0, 0, 1, 0));
  
  let bPng = createButton('📸 SALVA PNG').parent(sidebar).style('width','100%').style('margin-top','5px');
  bPng.mousePressed(() => saveCanvas('ghost_design', 'png'));
  uiElements.push(bReset, bPng);

  // --- SEZIONE COLORI ---
  makeLabel("COLORE TESTO");
  let c1 = createColorPicker(params.textColor).parent(sidebar);
  c1.input(() => params.textColor = c1.color());
  uiElements.push(c1);

  makeLabel("COLORE SFONDO");
  let c2 = createColorPicker(params.canvasColor).parent(sidebar);
  c2.input(() => params.canvasColor = c2.color());
  uiElements.push(c2);
}

function makeSlider(txt, min, max, val, callback) {
  makeLabel(txt);
  let s = createSlider(min, max, val, 0.001).parent(sidebar).style('width','100%');
  s.input(() => callback(s.value()));
  uiElements.push(s);
}

function makeLabel(txt) {
  let l = createDiv(txt).parent(sidebar).style('color','#888').style('font-size','10px').style('margin-top','10px').style('font-weight','bold');
  uiElements.push(l);
}

function calculateSize(ratio) {
  let mW = windowWidth - 280, mH = windowHeight - 60;
  let w = min(mW, mH);
  return {w: w, h: w};
}

function repositionCanvas() {
  canvas.style.position = 'absolute';
  canvas.style.left = (240 + (windowWidth - 240 - width) / 2) + 'px';
  canvas.style.top = ((windowHeight - height) / 2) + 'px';
}

function styleSidebar() {
  sidebar.style('position','fixed').style('left','0').style('top','0').style('width','240px').style('height','100%').style('background','#111').style('padding','20px').style('box-sizing','border-box').style('border-right','1px solid #333').style('z-index','100').style('overflow-y', 'auto');
}