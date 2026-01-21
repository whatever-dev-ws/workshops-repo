// --- CONFIGURAZIONE CORE ---
let state = 'HOME'; 
let brushColor = '#2d3436';
let canvasBgColor = '#ffffff'; 
let brushSize = 8; 
let opacity = 180;
let densityVal = 3; 
let showUI = true;
let isEraser = false;

// Variabili Vector Flow
let effectMode = 'VECTOR_FLOW'; 
let flowType = 'ORDERED'; 
let pointA = null, pointB = null;
let flowActive = false;
let flowTimer = 0; 
const FLOW_LIMIT = 150; 

let particles = []; 
let uiContainer, toggleBtn, startBtn;
let offsetLine = 0;
const UI_WIDTH = 220; 

// --- CLASSE PARTICELLE (FISICA KINETIC & NEBULA) ---
class Particle {
  constructor(x, y, col, size, maxLife, target, type) {
    this.type = type; // 'ORDERED', 'DISORDERED', 'NEBULA', 'NONE'
    this.color = color(col);
    this.life = 255;
    this.maxLife = maxLife;
    this.wanderingSeed = random(10000);
    
    // Nebula Drift Ã¨ piÃ¹ grande e soffusa
    if (this.type === 'NEBULA') {
      this.baseSize = size * random(1, 3);
      this.fadeRate = 255 / (maxLife * 2);
    } else {
      this.baseSize = (target) ? (size / 5) : size * 0.4;
      this.fadeRate = 255 / (maxLife * 0.9);
    }
    
    this.size = this.baseSize;
    this.pos = createVector(x + random(-5, 5), y + random(-5, 5));
    this.target = target;
    
    // VelocitÃ  iniziale differenziata
    if (type === 'ORDERED' && target) {
      this.vel = p5.Vector.sub(target, this.pos).setMag(random(3, 5));
    } else if (type === 'NEBULA') {
      this.vel = p5.Vector.random2D().mult(random(0.2, 0.8)); // Molto lento
    } else {
      this.vel = p5.Vector.random2D().mult(random(2, 6));
    }
    this.acc = createVector(0, 0);
  }
  
  update() {
    if (this.target) {
      let vectorToTarget = p5.Vector.sub(this.target, this.pos);
      let dist = vectorToTarget.mag();
      
      if (this.type === 'ORDERED') {
        let n = noise(this.pos.x * 0.005, this.pos.y * 0.005, this.wanderingSeed * 0.01);
        this.acc.add(p5.Vector.fromAngle(n * TWO_PI).mult(0.15));
        this.acc.add(vectorToTarget.setMag(0.25));
      } else {
        // Disordered con convergenza totale
        let chaosAmount = map(dist, 50, 250, 0, 1.5, true);
        let n = noise(this.pos.x * 0.02, this.pos.y * 0.02, this.wanderingSeed);
        this.acc.add(p5.Vector.fromAngle(n * TWO_PI * 4).mult(chaosAmount));
        this.acc.add(vectorToTarget.setMag(0.6));
      }

      if (dist < 45) {
        this.pos.lerp(this.target, 0.25);
        this.size *= 0.85;
        if (dist < 2) this.life = 0;
      }
    } else {
      // Fisica per effetti a trascinamento
      if (this.type === 'NEBULA') {
        // Movimento oscillante simile a fumo
        let n = noise(this.pos.x * 0.01, this.pos.y * 0.01, frameCount * 0.01);
        this.acc.add(p5.Vector.fromAngle(n * TWO_PI).mult(0.05));
        this.vel.limit(1.5);
      } else if (effectMode === 'PARTICLES') {
        this.acc.add(createVector(0, 0.15)); 
      }
    }
    
    this.vel.add(this.acc);
    this.pos.add(this.vel);
    this.acc.mult(0);
    this.life -= (this.fadeRate || 2);
  }
  
  show() {
    noStroke();
    let c = color(this.color);
    c.setAlpha(this.life);
    fill(c);
    ellipse(this.pos.x, this.pos.y, this.size);
  }
  isDead() { return this.life <= 0; }
}

function setup() {
  cnv = createCanvas(windowWidth, windowHeight);
  cnv.position(0, 0);
  cnv.style('z-index', '-1').style('position', 'fixed');
  document.body.style.margin = "0";
  document.body.style.overflow = "hidden";
  pixelDensity(1);
  setupUI();
  
  startBtn = createButton('START CREATING');
  styleStartButton(startBtn);
  startBtn.mousePressed(startApp);
  background(255);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  if(state === 'APP') background(canvasBgColor);
}

function mousePressed() {
  if (state === 'APP' && (showUI === false || mouseX > UI_WIDTH)) {
    if (effectMode === 'VECTOR_FLOW') {
      if (!pointA) {
        pointA = createVector(mouseX, mouseY);
        flowActive = false; 
      } else if (!pointB) {
        pointB = createVector(mouseX, mouseY);
        flowActive = true;
        flowTimer = 0;
      } else {
        pointA = createVector(mouseX, mouseY);
        pointB = null;
        flowActive = false;
      }
    }
  }
}

function draw() {
  if (state === 'HOME') {
    drawHome();
  } else {
    if (mouseIsPressed && (showUI === false || mouseX > UI_WIDTH)) handleDrawingLogic();
    
    if (flowActive && effectMode === 'VECTOR_FLOW' && pointA && pointB) {
      let spawnRate = floor(map(densityVal, 1, 10, 10, 1));
      if (frameCount % spawnRate == 0) {
        particles.push(new Particle(pointA.x, pointA.y, brushColor, brushSize, opacity, pointB, flowType));
      }
      flowTimer++;
      if (flowTimer > FLOW_LIMIT) { 
        flowActive = false; pointA = null; pointB = null; 
      }
    }
    
    for (let i = particles.length - 1; i >= 0; i--) {
      particles[i].update();
      particles[i].show();
      if (particles[i].isDead()) particles.splice(i, 1);
    }
  }
}

function handleDrawingLogic() {
  if (isEraser) {
    stroke(canvasBgColor); strokeWeight(brushSize * 2); line(pmouseX, pmouseY, mouseX, mouseY);
    return;
  }
  if (effectMode === 'KANDINSKY') {
    let count = map(densityVal, 1, 10, 1, 5);
    for (let i = 0; i < count; i++) {
      let c = color(brushColor); c.setAlpha(random(opacity * 0.3, opacity)); fill(c);
      ellipse(mouseX + random(-brushSize, brushSize), mouseY + random(-brushSize, brushSize), brushSize * random(0.4, 1.1));
    }
  } else if (effectMode === 'PARTICLES') {
    for(let i = 0; i < map(densityVal, 1, 10, 1, 8); i++) {
      particles.push(new Particle(mouseX, mouseY, brushColor, brushSize, opacity, null, 'NONE'));
    }
  } else if (effectMode === 'NEBULA_DRIFT') {
    let count = map(densityVal, 1, 10, 1, 4);
    for(let i = 0; i < count; i++) {
      particles.push(new Particle(mouseX, mouseY, brushColor, brushSize, opacity, null, 'NEBULA'));
    }
  }
}

function setupUI() {
  uiContainer = createDiv('').style('width', UI_WIDTH + 'px').style('height', '100vh').style('background', 'rgba(255,255,255,0.95)').style('border-right', '1px solid #ddd').style('padding', '20px').style('display', 'none').style('flex-direction', 'column').style('position', 'fixed').style('top', '0').style('left', '0').style('z-index', '100').style('font-family', 'sans-serif').style('box-sizing', 'border-box').style('overflow-y', 'auto');
  
  toggleBtn = createButton('NASCONDI MENU').position(10, 10).style('z-index', '200').style('padding', '6px 12px').style('border-radius', '20px').style('border', '1px solid #ddd').style('background', '#fff').style('cursor', 'pointer').style('font-size', '9px').style('font-weight', 'bold');
  toggleBtn.hide();
  toggleBtn.mousePressed(() => {
    showUI = !showUI;
    uiContainer.style('display', showUI ? 'flex' : 'none');
    toggleBtn.html(showUI ? 'NASCONDI MENU' : 'MOSTRA MENU');
  });

  createHeader('PHYSICAL EFFECTS').parent(uiContainer);
  let btns = [
    {n: 'VECTOR FLOW (sign two points)', m: 'VECTOR_FLOW', c: '#e3f2fd', b: '#74b9ff'},
    {n: 'NEBULA DRIFT (cosmic smoke)', m: 'NEBULA_DRIFT', c: '#f3e5f5', b: '#9c27b0'},
    {n: 'KANDINSKY PARTICLES', m: 'KANDINSKY', c: '#fff9db', b: '#ffeaa7'},
    {n: 'PARTICLE PHYSICS', m: 'PARTICLES', c: '#e0f7fa', b: '#81ecec'},
    {n: 'ERASER', m: 'ERASER', c: '#ffebee', b: '#ffadad'}
  ];

  btns.forEach(b => {
    let btn = createButton(b.n).parent(uiContainer);
    styleBtn(btn);
    if(b.m === 'VECTOR_FLOW') btn.style('background', b.c).style('border-left', '5px solid '+b.b);
    btn.mousePressed(() => {
      effectMode = b.m; isEraser = (b.m === 'ERASER'); resetButtonStyles();
      btn.style('background', b.c).style('border-left', '5px solid '+b.b);
      flowSubMenu.style('display', b.m === 'VECTOR_FLOW' ? 'flex' : 'none');
      pointA = null; pointB = null; flowActive = false;
    });
  });

  flowSubMenu = createDiv('').parent(uiContainer).style('display', 'flex').style('flex-direction', 'column').style('margin', '0 0 15px 10px').style('padding', '10px').style('background', '#f8f9fa').style('border-radius', '8px');
  let ordBtn = createButton('Ordered (Fluid)').parent(flowSubMenu); styleSubBtn(ordBtn).style('color', '#74b9ff').style('font-weight', 'bold');
  ordBtn.mousePressed(() => { flowType = 'ORDERED'; resetSubBtnStyles(); ordBtn.style('font-weight', 'bold').style('color','#74b9ff'); });
  let disBtn = createButton('Disordered (Chaos)').parent(flowSubMenu); styleSubBtn(disBtn);
  disBtn.mousePressed(() => { flowType = 'DISORDERED'; resetSubBtnStyles(); disBtn.style('font-weight', 'bold').style('color','#74b9ff'); });

  createHeader('CANVAS').parent(uiContainer);
  createColorPicker(canvasBgColor).parent(uiContainer).style('width','100%').input(e=>{ canvasBgColor=e.target.value; background(canvasBgColor); });

  createHeader('APPEARANCE').parent(uiContainer);
  createLabel('Color').parent(uiContainer);
  createColorPicker(brushColor).parent(uiContainer).style('width','100%').input(e=>brushColor=e.target.value);
  createLabel('Size').parent(uiContainer);
  createSlider(1, 20, brushSize).parent(uiContainer).style('width','100%').input(e=>brushSize=e.target.value);
  createLabel('Intensity').parent(uiContainer);
  createSlider(10, 255, opacity).parent(uiContainer).style('width','100%').input(e=>opacity=e.target.value);
  createLabel('Density').parent(uiContainer);
  createSlider(1, 10, densityVal).parent(uiContainer).style('width','100%').input(e=>densityVal=e.target.value);

  createHeader('ACTIONS').parent(uiContainer);
  styleBtn(createButton('SAVE PNG').parent(uiContainer)).style('background', '#55efc4').mousePressed(() => { saveCanvas('artwork', 'png'); });
  styleBtn(createButton('CLEAR ALL').parent(uiContainer)).style('background', '#fab1a0').style('color', '#d63031').mousePressed(() => { background(canvasBgColor); particles = []; pointA = null; pointB = null; flowActive = false; });
}

function drawHome() {
  background(255); stroke(210, 225, 255); strokeWeight(2);
  for (let i = -200; i < width; i += 35) {
    let xMove = sin(offsetLine + i * 0.02) * 50;
    line(i + xMove, 0, width - (i + xMove), height);
  }
  offsetLine += 0.03; noStroke(); fill(255, 255, 255, 210); rect(0, 0, width, height);
  textAlign(CENTER, CENTER); fill(45); textStyle(BOLD); textSize(45); text('PARTICLE DYNAMICS', width/2, height/2 - 60);
  textStyle(NORMAL); textSize(18); fill(100); text('Kinetic Art Studio', width/2, height/2 - 10);
  startBtn.position(width/2 - 100, height/2 + 60);
}

function startApp() { state = 'APP'; startBtn.hide(); uiContainer.style('display', 'flex'); toggleBtn.show(); background(255); }
function resetButtonStyles() { selectAll('button').forEach(b => { if(b.parent() === uiContainer) b.style('background', '#eee').style('border-left','none'); }); }
function resetSubBtnStyles() { flowSubMenu.elt.querySelectorAll('button').forEach(b => { b.style.color = '#999'; b.style.fontWeight = 'normal'; }); }
function styleBtn(btn) { btn.style('width', '100%').style('padding', '10px').style('margin-bottom', '6px').style('border-radius', '6px').style('border', '1px solid #ddd').style('background', '#eee').style('cursor', 'pointer').style('font-weight', 'bold').style('font-size','11px'); return btn; }
function styleSubBtn(btn) { btn.style('background', 'none').style('border', 'none').style('text-align', 'left').style('font-size', '10px').style('cursor', 'pointer').style('padding', '4px 0').style('color', '#999'); return btn; }
function createHeader(txt) { return createP(txt).style('font-weight', 'bold').style('font-size', '9px').style('color', '#aaa').style('margin', '18px 0 6px 0').style('letter-spacing', '1.5px'); }
function createLabel(txt) { return createP(txt).style('font-size', '10px').style('margin', '4px 0'); }
function styleStartButton(btn) { btn.style('width', '200px').style('padding', '18px').style('background', '#2d3436').style('color', 'white').style('border-radius', '40px').style('border', 'none').style('cursor', 'pointer').style('font-weight', 'bold').style('z-index', '1000').style('font-size', '14px'); }