// WUP 25-26 // Sophie Feichter
let guitarModel;
let guitarSynth;
let isAudioStarted = false;
let floatOffset = 0;
let musicalNotes = [];
let feedbackTexts = []; 
let playText, customizeBtn, startBtn; 
let clickCount = 0;

// Hintergrund-Effekt Variablen
let bgParticles = [];

let mode = "play"; 
let guitarColor;
let woodColors = [
  { name: "Mahagoni", rgb: [101, 67, 33] },
  { name: "Sienna", rgb: [160, 82, 45] },
  { name: "Ahorn", rgb: [190, 150, 100] },
  { name: "Ebenholz", rgb: [40, 20, 10] },
  { name: "Walnuss", rgb: [80, 50, 30] },
  { name: "Kirsche", rgb: [139, 0, 0] },
  { name: "Kiefer", rgb: [210, 180, 140] },
  { name: "Weiß", rgb: [240, 240, 240] },
  { name: "Tiefblau", rgb: [25, 25, 112] },
  { name: "Rauchgrau", rgb: [105, 105, 105] }
];
let colorButtons = [];

const messages = ["Well done!", "Wow!", "Fantastic!", "Great!", "Amazing!", "Beautiful!"];

function preload() {
  guitarModel = loadModel('base-2.obj', true);
}

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  guitarSynth = new p5.PolySynth();
  guitarColor = color(woodColors[0].rgb);

  // Hintergrund-Partikel initialisieren
  for (let i = 0; i < 50; i++) {
    bgParticles.push({
      x: random(-width, width),
      y: random(-height, height),
      z: random(-500, -100),
      size: random(2, 8),
      speed: random(0.2, 0.5)
    });
  }

  const sharedStyle = {
    'font-family': '"Playfair Display", "Georgia", serif',
    'font-size': '28px',
    'font-style': 'italic',
    'color': 'rgba(65, 36, 17, 0.8)',
    'user-select': 'none',
    'position': 'absolute',
    'z-index': '100'
  };

  // --- START BUTTON ---
  startBtn = createButton('START');
  startBtn.position(windowWidth/2 - 60, windowHeight/2 - 25);
  startBtn.size(120, 50);
  startBtn.style('font-family', '"Playfair Display", serif');
  startBtn.style('font-size', '20px');
  startBtn.style('letter-spacing', '2px');
  startBtn.style('background', 'rgba(65, 36, 17, 0.8)');
  startBtn.style('color', 'white');
  startBtn.style('border', 'none');
  startBtn.style('border-radius', '25px');
  startBtn.style('cursor', 'pointer');
  startBtn.mousePressed(startExperience);

  // --- CUSTOMIZE ME BUTTON ---
  customizeBtn = createDiv('Customize me');
  for (let prop in sharedStyle) customizeBtn.style(prop, sharedStyle[prop]);
  customizeBtn.style('bottom', '60px');
  customizeBtn.style('left', '10%');
  customizeBtn.style('border', '2px solid white');
  customizeBtn.style('padding', '5px 20px');
  customizeBtn.style('border-radius', '8px');
  customizeBtn.style('cursor', 'pointer');
  customizeBtn.style('background', 'rgba(255, 255, 255, 0.2)');
  customizeBtn.mousePressed(toggleMode);
  customizeBtn.hide();

  // --- PLAY WITH ME TEXT ---
  playText = createDiv('Play with me');
  for (let prop in sharedStyle) playText.style(prop, sharedStyle[prop]);
  playText.style('bottom', '60px');
  playText.style('right', '10%');
  playText.style('padding', '7px 20px');
  playText.hide();

  createColorMenu();
  cursor(HAND);
}

function startExperience() {
  isAudioStarted = true;
  userStartAudio();
  startBtn.hide();
  customizeBtn.show();
  playText.show();
}

function draw() {
  background(255, 253, 245); 

  if (!isAudioStarted) {
    return; 
  }

  drawBackgroundEffect();

  orbitControl(1, 0);
  ambientLight(180, 150, 120); 
  pointLight(255, 255, 255, 200, -200, 400);
  directionalLight(80, 70, 60, 1, 1, -1);

  floatOffset = sin(frameCount * 0.02) * 12;

  // Animationen (Noten & Feedback) laufen IMMER weiter
  updateAndDrawNotes();
  updateAndDrawFeedback();

  if (mode === "play") {
    playText.show();
    let textAlpha = map(sin(frameCount * 0.05), -1, 1, 0.4, 0.8);
    playText.style('opacity', textAlpha);
    colorButtons.forEach(b => b.hide());
  } else {
    playText.hide();
    colorButtons.forEach(b => b.show());
  }

  push();
  translate(0, floatOffset, 0); 
  rotateX(PI); rotateY(PI); scale(3.5); 
  noStroke();
  fill(guitarColor); 
  specularMaterial(60); 
  model(guitarModel);
  pop();
}

function drawBackgroundEffect() {
  push();
  noStroke();
  for (let p of bgParticles) {
    fill(180, 160, 140, 50);
    push();
    translate(p.x, p.y, p.z);
    ellipse(0, 0, p.size);
    pop();
    p.y -= p.speed;
    if (p.y < -height) p.y = height;
  }
  pop();
}

function createColorMenu() {
  for (let i = 0; i < woodColors.length; i++) {
    let btn = createDiv('');
    btn.style('width', '25px'); 
    btn.style('height', '25px');
    btn.style('border-radius', '50%');
    btn.style('background-color', `rgb(${woodColors[i].rgb[0]}, ${woodColors[i].rgb[1]}, ${woodColors[i].rgb[2]})`);
    btn.style('margin', '10px'); 
    btn.style('border', '2px solid white');
    btn.style('cursor', 'pointer'); 
    btn.position(30, 60 + i * 45); 
    btn.mousePressed(() => { guitarColor = color(woodColors[i].rgb); });
    btn.hide();
    colorButtons.push(btn);
  }
}

function spawnFeedback() {
  let msg = random(messages);
  let fb = createDiv(msg);
  fb.style('font-family', '"Playfair Display", serif');
  fb.style('font-size', '20px'); 
  fb.style('font-style', 'italic');
  fb.style('color', '#412411'); 
  fb.style('position', 'absolute');
  fb.style('pointer-events', 'none');
  fb.style('z-index', '999');

  feedbackTexts.push({
    element: fb, x: width / 2, y: height / 2, z: 0,
    vx: random(-4, 4), vy: random(-1, -3), vz: random(-3, 3),
    life: 255
  });
}

function updateAndDrawFeedback() {
  for (let i = feedbackTexts.length - 1; i >= 0; i--) {
    let f = feedbackTexts[i];
    f.x += f.vx; f.y += f.vy; f.z += f.vz;
    f.life -= 1.2;
    let scaleFactor = map(f.z, -300, 300, 0.5, 2.0);
    f.element.position(f.x + f.z, f.y); 
    f.element.style('opacity', f.life / 255);
    f.element.style('transform', `scale(${scaleFactor})`);
    if (f.life <= 0) { f.element.remove(); feedbackTexts.splice(i, 1); }
  }
}

function mousePressed() {
  if (mouseY > height - 120) return;
  if (!isAudioStarted) return; 

  if (mode === "play") {
    let mx = mouseX - width / 2;
    let my = mouseY - height / 2;
    
    if (abs(mx) < 70 && my > -150 && my < 150) { 
      clickCount++;
      let notes = [40, 45, 50, 55, 59, 64]; 
      guitarSynth.play(midiToFreq(random(notes)), 0.5, 0, 1.0);
      for(let i = 0; i < 4; i++) spawnNote();
      if (clickCount % 3 === 0) spawnFeedback();
    }
  }
}

function toggleMode() {
  if (mode === "play") {
    mode = "customize";
    customizeBtn.html('Back to play');
  } else {
    mode = "play";
    customizeBtn.html('Customize me');
  }
}

function spawnNote() {
  musicalNotes.push({
    x: 0, y: floatOffset, z: 0,
    vx: random(-5, 5), vy: random(-2, -6), vz: random(-5, 5),
    life: 255, rot: random(TWO_PI),
    color: [random(100, 255), random(100, 255), random(100, 255)] // Zufällige helle Farbe
  });
}

function updateAndDrawNotes() {
  for (let i = musicalNotes.length - 1; i >= 0; i--) {
    let n = musicalNotes[i];
    push(); 
    translate(n.x, n.y, n.z); 
    rotateZ(n.rot); 
    fill(n.color[0], n.color[1], n.color[2], n.life); // Bunte Farbe mit Alpha
    noStroke();
    push(); rotateX(HALF_PI); ellipsoid(8, 6, 4); pop();
    translate(6, -10, 0); cylinder(1, 20); 
    pop();
    
    n.x += n.vx; n.y += n.vy; n.z += n.vz; n.life -= 1.5;
    if (n.life <= 0) musicalNotes.splice(i, 1);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  if (startBtn) startBtn.position(windowWidth/2 - 60, windowHeight/2 - 25);
}