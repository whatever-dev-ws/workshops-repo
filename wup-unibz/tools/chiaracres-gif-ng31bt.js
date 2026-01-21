
let screen = 'home';
let bgImage;
let texts = [];
let particles = [];
let effectMode = 'none'; 
let movementType = 'none';
let bgEffectMode = 'none'; 
let selectedEmoji = '\u2728'; 
 
let sidebar, mainLayout, emojiContainer, textColorPicker;
let patternOffset = 0;
 
let moveX = 0, moveY = 0, sz = 1;
 
function setup() {
  // Layout principale
  mainLayout = createDiv().style('display', 'flex').style('font-family', 'sans-serif');
 
  // Sidebar
  sidebar = createDiv().parent(mainLayout);
  sidebar.style('width', '260px').style('padding', '15px').style('background', '#f8f9fa')
         .style('height', '500px').style('border-right', '2px solid #dee2e6')
         .style('display', 'none').style('flex-direction', 'column').style('gap', '12px');
 
  // 1. BACKGROUND IMAGE
  createP('<strong>1. BACKGROUND IMAGE</strong>').parent(sidebar).style('margin', '0');
  createFileInput(handleFile).parent(sidebar);
 
  // 2. TEXT SETTINGS (Invertito: Colore -> Testo)
  createP('<strong>2. TEXT SETTINGS</strong>').parent(sidebar).style('margin', '0');
  
  let colorRow = createDiv().parent(sidebar).style('display', 'flex').style('align-items', 'center').style('gap', '10px');
  createSpan('Color:').parent(colorRow).style('font-size', '12px');
  textColorPicker = createColorPicker('#ffffff').parent(colorRow);

  let tInput = createInput('').parent(sidebar);
  tInput.attribute('placeholder', 'Type & hit Enter');
 
  tInput.elt.onkeypress = (e) => {
    if (e.key === 'Enter' && tInput.value() !== "") {
      texts.push({ 
        txt: tInput.value(), 
        x: width/2, 
        y: height/2, 
        col: textColorPicker.color(),
        isDragging: false 
      });
      tInput.value('');
    }
  };
 
  // 3. PARTICLE EFFECTS
  createP('<strong>3. PARTICLE EFFECTS</strong>').parent(sidebar).style('margin', '0');
  let effSel = createSelect().parent(sidebar);
  effSel.option('None', 'none');
  effSel.option('Exploding Stars', 'stars');
  effSel.option('Emoji Waterfall', 'emoji');
 
  emojiContainer = createDiv().parent(sidebar).style('display', 'none')
                    .style('background', '#e9ecef').style('padding', '8px').style('border-radius', '5px');
  let eSel = createSelect().parent(emojiContainer);
  
  let emojiList = ['\u2728', '\uD83D\uDD25', '\u2764\uFE0F', '\uD83C\uDF08', '\u2B50', '\uD83C\uDF88', '\uD83C\uDF55', '\uD83D\uDE80', '\uD83D\uDC31', '\uD83D\uDC8E', '\uD83C\uDF38', '\uD83C\uDF89'];
  emojiList.forEach(e => eSel.option(e));
  eSel.changed(() => selectedEmoji = eSel.value());
 
  effSel.changed(() => {
    effectMode = effSel.value();
    particles = []; 
    emojiContainer.style('display', (effectMode === 'emoji') ? 'block' : 'none');
  });
 
  // 4. TEXT MOVEMENT
  createP('<strong>4. TEXT MOVEMENT</strong>').parent(sidebar).style('margin', '0');
  let mSel = createSelect().parent(sidebar);
  mSel.option('Static', 'none');
  mSel.option('Pulsation', 'pulsation');
  mSel.option('Wobble', 'wobble');
  mSel.option('Floating', 'floating');
  mSel.changed(() => movementType = mSel.value());

  // 5. BG ANIMATION
  createP('<strong>5. BG ANIMATION</strong>').parent(sidebar).style('margin', '0');
  let bgEffSel = createSelect().parent(sidebar);
  bgEffSel.option('None', 'none');
  bgEffSel.option('Pulsation', 'pulsation');
  bgEffSel.option('Color Shift', 'colorShift');
  bgEffSel.option('Ken Burns (Zoom)', 'kenBurns');
  bgEffSel.changed(() => bgEffectMode = bgEffSel.value());
 
  // Pulsante GIF
  let recBtn = createButton('\uD83C\uDFAC GENERATE GIF').parent(sidebar).style('margin-top', 'auto')
                .style('background', '#ff4757').style('color', 'white').style('font-weight', 'bold')
                .style('border', 'none').style('padding', '12px').style('cursor', 'pointer').style('border-radius', '5px');
  recBtn.mousePressed(() => saveGif('my_awesome_gif', 3, { units: 'seconds' }));
 
  let cv = createCanvas(500, 500);
  cv.parent(mainLayout);
}
 
function draw() {
  if (screen === 'home') {
    drawHome();
  } else {
    drawApp();
  }
}
 
function drawHome() {
  background(245, 247, 250);
  stroke(220, 225, 235);
  patternOffset += 0.5;
  for (let i = -500; i < 500; i += 30) {
    line(i + (patternOffset % 30), 0, i + 500 + (patternOffset % 30), 500);
  }
  textAlign(CENTER, CENTER);
  noStroke(); fill(45, 52, 71);
  textSize(42); textStyle(BOLD);
  text("GIF MAKER PRO", width/2, height/2 - 70);
  
  let isHover = mouseX > 140 && mouseX < 360 && mouseY > 260 && mouseY < 340;
  fill(isHover ? '#ff4757' : '#ff6b81');
  rect(140, 260, 220, 80, 15);
  fill(255); textSize(18);
  text("START CREATING", width/2, 300);
  if(isHover) cursor(HAND); else cursor(ARROW);
}
 
function drawApp() {
  background(20);
  
  push();
  let bgZoom = 1;
  let bgOffX = 0;
  let bgOffY = 0;

  if (bgEffectMode === 'pulsation') bgZoom = 1 + sin(frameCount * 0.05) * 0.05;
  if (bgEffectMode === 'kenBurns') {
    bgZoom = 1.2;
    bgOffX = sin(frameCount * 0.02) * 20;
    bgOffY = cos(frameCount * 0.02) * 20;
  }
  if (bgEffectMode === 'colorShift') {
    colorMode(HSB);
    tint(frameCount % 360, 100, 255);
  }

  if (bgImage) {
    imageMode(CENTER);
    image(bgImage, width/2 + bgOffX, height/2 + bgOffY, width * bgZoom, height * bgZoom);
    noTint();
  } else if (bgEffectMode === 'colorShift') {
    background(frameCount % 360, 50, 60);
  }
  pop();
  colorMode(RGB);
 
  moveX = 0; moveY = 0; sz = 1;
  if (movementType === 'pulsation') sz = 1 + sin(frameCount * 0.1) * 0.1;
  if (movementType === 'wobble') moveX = sin(frameCount * 0.1) * 20;
  if (movementType === 'floating') moveY = cos(frameCount * 0.05) * 25;
 
  handleParticles();
 
  let anyoneHovered = false;
  for (let i = texts.length - 1; i >= 0; i--) {
    let t = texts[i];
    let visX = t.x + moveX;
    let visY = t.y + moveY;
 
    if (mouseX > visX - 100 && mouseX < visX + 100 && mouseY > visY - 30 && mouseY < visY + 30) {
      anyoneHovered = true;
    }
 
    if (t.isDragging) {
      t.x = mouseX - moveX;
      t.y = mouseY - moveY;
    }
 
    push();
    translate(visX, visY);
    scale(sz);
    fill(t.col); 
    textAlign(CENTER, CENTER);
    textSize(35); 
    textStyle(BOLD);
    text(t.txt, 0, 0); 
    pop();
  }
 
  if (anyoneHovered) cursor(HAND); else cursor(ARROW);
}
 
function handleParticles() {
  if (effectMode === 'stars' && frameCount % 5 === 0) {
    particles.push({x: random(width), y: random(height), type: 'star', life: 255});
  }
  if (effectMode === 'emoji' && frameCount % 10 === 0) {
    particles.push({x: random(width), y: -50, type: 'emoji', char: selectedEmoji, sp: random(3, 7)});
  }
  
  for (let i = particles.length - 1; i >= 0; i--) {
    let p = particles[i];
    push();
    textAlign(CENTER, CENTER);
    if (p.type === 'star') {
      fill(255, 255, 0, p.life); textSize(20);
      text('\u2B50', p.x, p.y); 
      p.life -= 5;
    } else {
      textSize(40);
      text(p.char, p.x, p.y);
      p.y += p.sp;
    }
    pop();
    
    if (p.y > height + 60 || (p.life !== undefined && p.life <= 0)) {
      particles.splice(i, 1);
    }
  }
}
 
function handleFile(file) {
  if (file.type === 'image') bgImage = loadImage(file.data);
}
 
function mousePressed() {
  if (screen === 'home') {
    if (mouseX > 140 && mouseX < 360 && mouseY > 260 && mouseY < 340) {
      screen = 'app';
      sidebar.style('display', 'flex');
    }
  } else {
    for (let i = texts.length - 1; i >= 0; i--) {
      let t = texts[i]; // Corretto: texts[i] invece di t[i]
      let visX = t.x + moveX;
      let visY = t.y + moveY;
      
      if (mouseX > visX - 100 && mouseX < visX + 100 && mouseY > visY - 30 && mouseY < visY + 30) {
        t.isDragging = true;
        break; 
      }
    }
  }
}
 
function mouseReleased() {
  for (let t of texts) t.isDragging = false;
}