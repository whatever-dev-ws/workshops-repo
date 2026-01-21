let modelP1, modelP2;
let terminalFont; 
let p1, p2;
let p1Hp = 500, p2Hp = 500;
let p1Attacking = false, p2Attacking = false;
let gameOver = false, winner = "";
let camDist = 600; 
let camAngleX = -0.2; 
let camAngleY = 0; 

// --- NUOVE VARIABILI FISICA SALTO ---
let p1Y = 0, p2Y = 0;
let p1Vely = 0, p2Vely = 0;
let gravity = 0.8;
let jumpForce = -15;

// Flash & Combo variables
let p1Flash = 0, p2Flash = 0; 
let p1ComboActive = false, p2ComboActive = false;
let p1LastKey = "", p2LastKey = "";
let p1LastKeyTime = 0, p2LastKeyTime = 0;
let comboThreshold = 300; 

// --- COOLDOWN VARIABLES ---
let p1LastComboTime = -60000;
let p2LastComboTime = -60000;
let comboCooldown = 60000; 

let tracks = [];
let currentTrackIdx = 0;
let musicFiles = ['Smash Bros.mp3', 'Pokemon.mp3','Undertale.mp3','Zelda.mp3']; // Inserisci qui i nomi dei tuoi file

let p1ComboStartTime = 0;
let p2ComboStartTime = 0;
let comboDuration = 400; // La combo dura 1 secondo (1000 millisecondi)

// IMAGES
let imgBg, imgFloor, imgSide, imgTop;

function preload() {
  modelP1 = loadModel('ready definitivo.stl', true);
  modelP2 = loadModel('ready definitivo.stl', true);
  terminalFont = loadFont('terminal-grotesque.ttf');
  imgBg = loadImage('arena.png');   
  imgFloor = loadImage('floor.png');
  imgSide = loadImage('arena2.png'); 
  imgTop = loadImage('stars.png');
// Caricamento suoni
  soundFormats('mp3', 'ogg');
  for (let f of musicFiles) {
    tracks.push(loadSound(f));
  }
}

function setup() {
  createCanvas(1000, 500, WEBGL);
  if (terminalFont) textFont(terminalFont);
  perspective(PI / 2.5, width / height, 10, 5000);
  p1 = createVector(-300, 0, 0);
  p2 = createVector(300, 0, 0);
  
  // Avvia la prima traccia se presente
  if (tracks.length > 0) {
    tracks[currentTrackIdx].loop();
    tracks[currentTrackIdx].setVolume(0.5); // Volume al 50%
  }
}

function draw() {
  background(0); 
let now = millis();

if (gameOver) { showWinScreen(); return; }

// Spegnimento automatico combo dopo la durata
if (p1ComboActive && (now - p1ComboStartTime > comboDuration)) {
p1ComboActive = false;
}
if (p2ComboActive && (now - p2ComboStartTime > comboDuration)) {
p2ComboActive = false;
}

  if (gameOver) {
    showWinScreen();
    return; 
  }

  // --- LOGICA FISICA SALTO ---
  p1Y += p1Vely;
  p2Y += p2Vely;
  if (p1Y < 0) p1Vely += gravity; else { p1Y = 0; p1Vely = 0; }
  if (p2Y < 0) p2Vely += gravity; else { p2Y = 0; p2Vely = 0; }

  if (p1Flash > 0) p1Flash--;
  if (p2Flash > 0) p2Flash--;

  ambientLight(150); 
  pointLight(255, 255, 255, 0, -600, 300); 
  directionalLight(100, 100, 255, -1, 1, -1);

  // Camera
  let camX = camDist * cos(camAngleX) * sin(camAngleY);
  let camY = camDist * sin(camAngleX);
  let camZ = camDist * cos(camAngleX) * cos(camAngleY);
  camera(camX, camY, camZ, 0, 0, 0, 0, 1, 0);

  drawArena();
  
  // Calcolo posizioni effettive (incluse Y del salto)
  let p1Pos = createVector(p1.x, p1.y + p1Y, p1.z);
  let p2Pos = createVector(p2.x, p2.y + p2Y, p2.z);

  // Controllo movimento per rotazione
  let p1Moving = keyIsDown(68) || keyIsDown(65) || keyIsDown(87) || keyIsDown(83) || p1Y < 0;
  let p2Moving = keyIsDown(LEFT_ARROW) || keyIsDown(RIGHT_ARROW) || keyIsDown(UP_ARROW) || keyIsDown(DOWN_ARROW) || p2Y < 0;

  draw3DPlayer(p1Pos, color(0, 50, 255), p1Attacking, modelP1, p1Flash, p1ComboActive, p1Moving); 
  draw3DPlayer(p2Pos, color(255, 20, 20), p2Attacking, modelP2, p2Flash, p2ComboActive, p2Moving); 

  // Collision & Damage Logic (Usa posizioni Y aggiornate)
  let d = dist(p1Pos.x, p1Pos.y, p1Pos.z, p2Pos.x, p2Pos.y, p2Pos.z);
  if (d < 120) { 
    if (p1Attacking && frameCount % 2 === 0) { 
      let dmg = p1ComboActive ? 10.0 : 2.0;
      p2Hp -= dmg; 
      p2Flash = p1ComboActive ? 10 : 10; 
    }
    if (p2Attacking && frameCount % 2 === 0) { 
      let dmg = p2ComboActive ? 10.0 : 2.0;
      p1Hp -= dmg; 
      p1Flash = p2ComboActive ? 10 : 10;
    }
  }
  


  if (p1Hp <= 0) { gameOver = true; winner = "PLAYER TWO WINS"; }
  else if (p2Hp <= 0) { gameOver = true; winner = "PLAYER ONE WINS"; }

  handleInput();
  drawUI(); 
}

function draw3DPlayer(pos, col, attacking, mdl, flash, combo, isMoving) {
  push();
  translate(pos.x, pos.y, pos.z);
  if (isMoving || attacking) { rotateY(frameCount * 0.05); } 
  else { rotateY(pos.x > 0 ? PI : 0); }

  if (attacking) { 
    rotateZ(frameCount * (combo ? 0.8 : 0.5)); 
    scale(combo ? 1.5 : 1.1); 
  }

  if (flash > 0) emissiveMaterial(255, 255, 255); 
  else if (combo) emissiveMaterial(255,255,0); 
  else ambientMaterial(col);

  if (mdl) { scale(1.2); model(mdl); } 
  else { torus(30, 10); }
  pop();
}

function handleInput() {
  let s = 6;
  if (keyIsDown(68)) p1.x += s; if (keyIsDown(65)) p1.x -= s;
  if (keyIsDown(87)) p1.z -= s; if (keyIsDown(83)) p1.z += s;
  if (keyIsDown(LEFT_ARROW)) p2.x -= s; if (keyIsDown(RIGHT_ARROW)) p2.x += s;
  if (keyIsDown(UP_ARROW)) p2.z -= s; if (keyIsDown(DOWN_ARROW)) p2.z += s;
  p1.x = constrain(p1.x, -950, 950); p1.z = constrain(p1.z, -950, 950);
  p2.x = constrain(p2.x, -950, 950); p2.z = constrain(p2.z, -950, 950);
}

function changeMusic() {
  // Ferma il brano attuale
  if (tracks[currentTrackIdx].isPlaying()) {
    tracks[currentTrackIdx].stop();
  }
  
  // Passa al prossimo (ricomincia da 0 se finiti)
  currentTrackIdx = (currentTrackIdx + 1) % tracks.length;
  
  // Avvia il nuovo brano in loop
  tracks[currentTrackIdx].loop();
}


function keyPressed() {
  let now = millis();
  
  // Salto P1 (Barra Spaziatrice)
  if (keyCode === 32 && p1Y === 0) p1Vely = jumpForce;

  // Salto P2 (Tasto SHIFT)
  if (keyCode === SHIFT && p2Y === 0) p2Vely = jumpForce;

// P1 Combo/Attack
if (key === 'w' || key === 'W') { p1LastKey = "W"; p1LastKeyTime = now; }
if (key === '1') {
p1Attacking = true;
// Attiva la combo SOLO se non è già attiva e se le condizioni sono rispettate
if (!p1ComboActive && p1LastKey === "W" && (now - p1LastKeyTime < comboThreshold) && (now - p1LastComboTime > comboCooldown)) {
p1ComboActive = true;
p1ComboStartTime = now;
p1LastComboTime = now;
}
}

// P2 Combo/Attack
if (keyCode === UP_ARROW) { p2LastKey = "UP"; p2LastKeyTime = now; }
if (key === '0') {
p2Attacking = true;
if (!p2ComboActive && p2LastKey === "UP" && (now - p2LastKeyTime < comboThreshold) && (now - p2LastComboTime > comboCooldown)) {
p2ComboActive = true;
p2ComboStartTime = now;
p2LastComboTime = now;
}
}
  
  // Tasto per cambiare musica
  if (key === 'm' || key === 'M') {
    changeMusic();
  }

  if (gameOver && (key === 'r' || key === 'R')) resetGame();
  
    if (key === 'i' || key === 'I') saveCanvas('battle', 'png');
}

function keyReleased() {
if (key === '1') {
p1Attacking = false;
// Opzionale: se vuoi che la combo si fermi al rilascio, decommenta la riga sotto
//p1ComboActive = false;
}
if (key === '0' ) {
p2Attacking = false;
//p2ComboActive = false;
}
}

function mouseWheel(event) {
  camDist = constrain(camDist + event.delta, 400, 950);
  return false;
}



function drawUI() {
  push(); resetMatrix(); translate(-width/2, -height/2, 1); noStroke();
  let now = millis();

    text(  "Use the mousewheel to zoom \n Block Num active for better experience \n Press i to save an image", 400, -60);
  
  
  // P1 UI
  fill(0, 150); rect(50, 10, 250, 5, 5);
  fill(255); textSize(13); textAlign(LEFT);
  if (terminalFont) textFont(terminalFont);
  text("press to move: WASD | press to attack: 1 \n press SPACE to jump", 60, -15);
  fill(50); rect(50, 40, 300, 20);
  fill(0, 100, 255); rect(50, 40, map(p1Hp, 0, 500, 0, 300), 20);
  fill(255); textSize(13); text("P1 HP: " + int(p1Hp), 50, 35);
  
  // P1 Cooldown Bar
  let p1CD = constrain(now - p1LastComboTime, 0, comboCooldown);
  fill(50); rect(50, 65, 100, 5);
  fill(0, 255, 255); rect(50, 65, map(p1CD, 0, comboCooldown, 0, 100), 5);
  if (p1CD >= comboCooldown) text("COMBO READY (W+1)", 50, 85);

  // P2 UI
  fill(0, 150); rect(width - 300, 10, 250, 5, 5);
  fill(255); textAlign(RIGHT);
  text("press to move: ARROWS |  attack: 0 \n press SHIFT to jump", width - 60, -15);
  fill(50); rect(width - 350, 40, 300, 20);
  fill(255, 20, 20); rect(width - 350, 40, map(p2Hp, 0, 500, 0, 300), 20);
  fill(255); textSize(13); text("P2 HP: " + int(p2Hp), width - 50, 35);
  
  // P2 Cooldown Bar
  let p2CD = constrain(now - p2LastComboTime, 0, comboCooldown);
  fill(50); rect(width - 150, 65, 100, 5);
  fill(255, 255, 0); rect(width - 150, 65, map(p2CD, 0, comboCooldown, 0, 100), 5);
  if (p2CD >= comboCooldown) text("COMBO READY (UP+0)", width - 50, 85);
  
  //musica
  fill(255);
  textAlign(CENTER);
  text("Press 'M' to change music", 470, -15); // Posizionato in basso al centro
  text("Now Playing: Track " + (currentTrackIdx + 1), 458, 0);
  
  pop();
}


function drawArena() {
  noStroke();
  let sz = 2000, h = 800, yOff = 150;
  push(); translate(0, yOff, 0); rotateX(HALF_PI); if (imgFloor) texture(imgFloor); plane(sz, sz); pop();
  push(); translate(0, yOff - h, 0); rotateX(HALF_PI); if (imgTop) texture(imgTop); plane(sz, sz); pop();
  push(); translate(0, yOff - h/2, -sz/2); if (imgBg) texture(imgBg); plane(sz, h); pop();
  push(); translate(0, yOff - h/2, sz/2); rotateY(PI); if (imgBg) texture(imgBg); plane(sz, h); pop();
  push(); translate(-sz/2, yOff - h/2, 0); rotateY(HALF_PI); if (imgSide) texture(imgSide); plane(sz, h); pop();
  push(); translate(sz/2, yOff - h/2, 0); rotateY(-HALF_PI); if (imgSide) texture(imgSide); plane(sz, h); pop();
}

function showWinScreen() {
  push(); resetMatrix(); translate(0, 0, 300);
  fill(winner.includes("ONE") ? color(0, 100, 255) : color(255, 20, 20));
  textAlign(CENTER, CENTER); textSize(60); text(winner, 0, -20);
  fill(255); textSize(20); text("PRESS 'R' TO RESTART", 0, 40);
  pop();
}


function resetGame() {
  p1Hp = 500; p2Hp = 500;
  p1 = createVector(-300, 0, 0); p2 = createVector(300, 0, 0);
  p1Y = 0; p2Y = 0; p1Vely = 0; p2Vely = 0;
  p1LastComboTime = -60000; p2LastComboTime = -60000;
  gameOver = false;
}
