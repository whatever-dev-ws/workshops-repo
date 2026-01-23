// WUP 25-26
// Verena Piazzi
let particles = [];
let brushSize, flowIntensity, lifeSpan, colorPicker, toggleBackground, saveBtn, gifBtn;
let uiPanelWidth = 220;
let selectedColor;
let palette = ['#FF5555', '#55FF55', '#5555FF', '#FFFF55', '#FF55FF', '#55FFFF', '#FFFFFF'];
let isRecording = false;

function setup() {
  createCanvas(windowWidth, windowHeight);
  background(10);
  angleMode(DEGREES);
  selectedColor = color(palette[0]);
  
  createUI();
}

function draw() {
  // Gestione sfondo ed effetto scia (Motion Trails)
  if (toggleBackground.checked()) {
    background(10, 25); 
  }

  // Aggiornamento e visualizzazione particelle
  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    particles[i].show();
    if (particles[i].isDead()) {
      particles.splice(i, 1);
    }
  }

  // Pannello UI (disegnato sopra le particelle)
  drawUIPanel();

  // Logica di disegno con interpolazione per scrivere lettere
  if (mouseIsPressed && mouseX > uiPanelWidth) {
    let d = dist(mouseX, mouseY, pmouseX, pmouseY);
    let steps = max(d / 2, 1); 
    for (let i = 0; i < steps; i++) {
      let lerpX = lerp(pmouseX, mouseX, i / steps);
      let lerpY = lerp(pmouseY, mouseY, i / steps);
      particles.push(new Particle(lerpX, lerpY, selectedColor));
    }
  }
}

function drawUIPanel() {
  push();
  noStroke();
  fill(20, 240); 
  rect(0, 0, uiPanelWidth, height);
  
  fill(255);
  textSize(16);
  textStyle(BOLD);
  text("COSMIC STUDIO V5", 20, 40);
  
  textStyle(NORMAL);
  textSize(11);
  fill(180);
  
  text("DIMENSIONE PENNELLO: " + brushSize.value(), 20, 80);
  text("FLOW (NOISE): " + flowIntensity.value(), 20, 130);
  text("LIFE (DURATA): " + lifeSpan.value(), 20, 180);
  
  text("PALETTE RAPIDA", 20, 270);
  for(let i = 0; i < palette.length; i++) {
    fill(palette[i]);
    rect(20 + (i * 25), 280, 20, 20, 4);
    if(mouseIsPressed && mouseX > 20 + (i*25) && mouseX < 40 + (i*25) && mouseY > 280 && mouseY < 300) {
      selectedColor = color(palette[i]);
      colorPicker.value(palette[i]);
    }
  }

  fill(180);
  text("COLORE PERSONALIZZATO", 20, 330);
  
  if (isRecording) {
    fill(255, 0, 0);
    ellipse(30, 580, 10, 10);
    text("REGISTRAZIONE IN CORSO...", 45, 585);
  }
  pop();
}

class Particle {
  constructor(x, y, col) {
    this.pos = createVector(x, y);
    this.vel = createVector(random(-0.2, 0.2), random(-0.2, 0.2));
    this.acc = createVector(0, 0);
    this.maxLife = lifeSpan.value();
    this.life = this.maxLife;
    this.baseColor = col;
  }

  update() {
    let flow = flowIntensity.value();
    if (flow > 0) {
      let nScale = 0.005;
      let noiseVal = noise(this.pos.x * nScale, this.pos.y * nScale, frameCount * 0.01);
      let angle = map(noiseVal, 0, 1, -180, 180) * flow;
      let force = p5.Vector.fromAngle(angle);
      this.acc.add(force.mult(0.1));
    }
    this.vel.add(this.acc);
    let limitVal = map(flow, 0, 10, 0.5, 5);
    this.vel.limit(limitVal);
    this.pos.add(this.vel);
    this.acc.mult(0);
    this.life -= 2;
  }

  show() {
    if (this.life < 0) return;
    // Evitiamo di disegnare particelle che finiscono visivamente sotto la sidebar
    if (this.pos.x < uiPanelWidth) return;

    let alpha = map(this.life, 0, this.maxLife, 0, 255);
    let size = map(this.life, 0, this.maxLife, 0, brushSize.value());
    
    push();
    strokeWeight(size);
    let c = color(this.baseColor);
    stroke(red(c), green(c), blue(c), alpha);
    line(this.pos.x, this.pos.y, this.pos.x - this.vel.x, this.pos.y - this.vel.y);
    pop();
  }

  isDead() { return this.life < 0; }
}

function createUI() {
  brushSize = createSlider(1, 100, 15);
  brushSize.position(20, 90);
  brushSize.style('width', '160px');
  
  flowIntensity = createSlider(0, 10, 0, 0.1); 
  flowIntensity.position(20, 140);
  flowIntensity.style('width', '160px');
  
  lifeSpan = createSlider(50, 1500, 400);
  lifeSpan.position(20, 190);
  lifeSpan.style('width', '160px');

  toggleBackground = createCheckbox(' Effetto Scia', true);
  toggleBackground.position(20, 225);
  toggleBackground.style('color', 'white');

  colorPicker = createColorPicker('#FF5555');
  colorPicker.position(20, 340);
  colorPicker.input(() => { selectedColor = colorPicker.color(); });

  // --- MODIFICA QUI: Salvataggio parziale del Canvas ---
  saveBtn = createButton('SALVA IMMAGINE');
  saveBtn.position(20, 460);
  saveBtn.mousePressed(() => {
    // Cattura solo l'area a destra della sidebar
    let img = get(uiPanelWidth, 0, width - uiPanelWidth, height);
    img.save('OperaCosmica', 'png');
  });
  styleButton(saveBtn, '#444');

  gifBtn = createButton('REGISTRA GIF (4s)');
  gifBtn.position(20, 510);
  gifBtn.mousePressed(recordGif);
  styleButton(gifBtn, '#d63031');
}

function styleButton(btn, col) {
  btn.style('background-color', col);
  btn.style('color', 'white');
  btn.style('border', 'none');
  btn.style('padding', '10px');
  btn.style('width', '180px');
  btn.style('border-radius', '5px');
  btn.style('cursor', 'pointer');
  btn.style('font-weight', 'bold');
}

function recordGif() {
  isRecording = true;
  saveGif('IlMioTrattoCosmico', 4, {
    delay: 0,
    units: 'seconds',
    silent: false,
    onComplete: () => isRecording = false
  });
}

function keyPressed() {
  if (key === 'c' || key === 'C') background(10);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  background(10);
}