let player;
let aliens = [];
let bullets = [];
let alienBullets = [];
let level = 1;
let score = 0;
let lives = 3;
let gameState = "START";
let playerImg; 
let fileInput, fsBtn;

const GAME_WIDTH = 600;

const alienShape = [
  [0,0,1,0,0,0,0,0,1,0,0], [0,0,0,1,0,0,0,1,0,0,0], [0,0,1,1,1,1,1,1,1,0,0],
  [0,1,1,0,1,1,1,0,1,1,0], [1,1,1,1,1,1,1,1,1,1,1], [1,0,1,1,1,1,1,1,1,0,1],
  [1,0,1,0,0,0,0,0,1,0,1], [0,0,0,1,1,0,1,1,0,0,0]
];

function setup() {
  createCanvas(windowWidth, windowHeight);
  
  fileInput = createFileInput(handleFile);
  fileInput.position(20, 20);
  fileInput.style('color', 'white');

  fsBtn = createButton('🖥️ Schermo Intero');
  fsBtn.position(20, 50);
  fsBtn.mousePressed(() => fullscreen(!fullscreen()));

  player = new Player();
  createAliens();
  
  document.body.style.margin = '0';
  document.body.style.overflow = 'hidden';
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function handleFile(file) {
  if (file.type === 'image') playerImg = loadImage(file.data);
}

function createAliens() {
  aliens = []; bullets = []; alienBullets = [];
  let ps = 5, spX = 62, spY = 48, cols = 9, rows = 6;
  let totalW = (cols - 1) * spX + (11 * ps);
  let startX = (GAME_WIDTH - totalW) / 2;
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      let col = (j === 0) ? color(255,0,255) : (j < 3 ? color(0,255,0) : color(255,255,0));
      let hp = (level === 3 && j === 0) ? 2 : 1;
      aliens.push(new Alien(startX + i * spX, j * spY + 100, col, hp, ps));
    }
  }
}

function draw() {
  background(25); 

  push();
  // Centramento Quadrante
  translate(width / 2 - GAME_WIDTH / 2, 0);
  fill(0); noStroke();
  rect(0, 0, GAME_WIDTH, height);
  stroke(100); line(0, 0, 0, height); line(GAME_WIDTH, 0, GAME_WIDTH, height);

  if (gameState === "START") showStartScreen();
  else if (gameState === "PLAY") playGame();
  else if (gameState === "GAMEOVER") showGameOver();
  else if (gameState === "WIN") showWinScreen();
  pop();
}

function playGame() {
  if (aliens.length === 0) {
    if (level < 3) { level++; createAliens(); } 
    else { gameState = "WIN"; return; }
  }
  displayUI(); player.show(); player.move();

  for (let i = bullets.length - 1; i >= 0; i--) {
    bullets[i].show(); bullets[i].update();
    if (bullets[i].y < 0) { bullets.splice(i, 1); continue; }
    for (let j = aliens.length - 1; j >= 0; j--) {
      if (bullets[i] && bullets[i].hits(aliens[j])) {
        aliens[j].hp--; bullets.splice(i, 1);
        if (aliens[j].hp <= 0) { aliens.splice(j, 1); score += 10 * level; }
        break;
      }
    }
  }

  let edge = false;
  for (let a of aliens) {
    a.show(); a.move();
    if (level > 1 && (a.x <= 0 || a.x + a.w >= GAME_WIDTH)) edge = true;
    if (a.y + a.h > height - 100) { gameState = "GAMEOVER"; return; }
    let fChance = (level === 1) ? 10000 : 6000;
    if (random(fChance) < 1) alienBullets.push(new AlienBullet(a.x + a.w/2, a.y + a.h));
  }
  if (edge && level > 1) { for (let a of aliens) a.shift(); }

  for (let i = alienBullets.length - 1; i >= 0; i--) {
    alienBullets[i].show(); alienBullets[i].update();
    if (alienBullets[i].hits(player)) {
      alienBullets.splice(i, 1); lives--;
      if (lives <= 0) { gameState = "GAMEOVER"; return; }
    } else if (alienBullets[i].y > height) { alienBullets.splice(i, 1); }
  }
}

// --- LOGICA GIF INTEGRATA (METODO SAVEGIF) ---
function keyPressed() {
  // Se premo S o s, registro 3 secondi di quello che vedo
  if (key === 's' || key === 'S') {
    saveGif('il_mio_gameplay.gif', 3);
  }

  // Comandi di gioco normali
  if (gameState !== "PLAY" && key === ' ') {
    resetGame();
  } else if (gameState === "PLAY" && key === ' ') {
    bullets.push(new Bullet(player.x, height - 100));
  }
}

function mouseClicked() { if (gameState !== "PLAY") resetGame(); }

function resetGame() { lives = 3; score = 0; level = 1; createAliens(); gameState = "PLAY"; }

function showStartScreen() {
  textAlign(CENTER); fill(255); textSize(45);
  text("MEGA ARCADE DEFENDER", GAME_WIDTH/2, height/2 - 50);
  textSize(20); text("Premi SPAZIO per iniziare\nPremi 'S' per salvare GIF (3s)", GAME_WIDTH/2, height/2 + 20);
}

function showGameOver() {
  textAlign(CENTER); fill(255,0,0); textSize(60);
  text("GAME OVER", GAME_WIDTH/2, height/2);
  fill(255); textSize(20); text("Clicca per ritentare", GAME_WIDTH/2, height/2 + 80);
}

function showWinScreen() {
  textAlign(CENTER); fill(0, 255, 0); textSize(60); 
  text("VICTORY", GAME_WIDTH/2, height/2 - 40);
  fill(255); textSize(30); text(`SCORE: ${score}`, GAME_WIDTH/2, height/2 + 20);
  textSize(20); text("Clicca per rigiocare", GAME_WIDTH/2, height/2 + 80);
}

class Player {
  constructor() { this.x = GAME_WIDTH / 2; this.w = 90; }
  show() {
    push(); rectMode(CENTER); let py = height - 60;
    fill(0, 200, 0); noStroke();
    rect(this.x, py, this.w, 20, 5); rect(this.x, py - 15, 60, 20, 5);
    let oSize = 50; let oY = py - 25;
    stroke(255); strokeWeight(3); fill(30); ellipse(this.x, oY, oSize);
    if (playerImg) {
      drawingContext.save(); noStroke(); ellipse(this.x, oY, oSize);
      drawingContext.clip(); imageMode(CENTER);
      let asp = playerImg.width / playerImg.height;
      if (asp > 1) image(playerImg, this.x, oY, oSize * asp, oSize);
      else image(playerImg, this.x, oY, oSize, oSize / asp);
      drawingContext.restore();
    } pop();
  }
  move() {
    let s = 12;
    if (keyIsDown(LEFT_ARROW) && this.x > this.w/2) this.x -= s;
    if (keyIsDown(RIGHT_ARROW) && this.x < GAME_WIDTH - this.w/2) this.x += s;
  }
}

class Alien {
  constructor(x, y, col, hp, ps) {
    this.x = x; this.y = y; this.col = col; this.hp = hp;
    this.w = 11 * ps; this.h = 8 * ps; this.ps = ps; this.dir = 1;
  }
  show() {
    push(); translate(this.x, this.y);
    fill(this.hp > 1 ? this.col : color(255)); noStroke();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 11; c++) {
        if (alienShape[r][c] === 1) rect(c * this.ps, r * this.ps, this.ps, this.ps);
      }
    } pop();
  }
  move() { 
    let s = 0; if (level === 2) s = 1.1; if (level === 3) s = 1.6;
    this.x += this.dir * s; 
  }
  shift() { this.dir *= -1; this.y += 15; }
}

class Bullet {
  constructor(x, y) { this.x = x; this.y = y; }
  show() { fill(255, 255, 0); noStroke(); rect(this.x, this.y, 6, 20); }
  update() { this.y -= 16; }
  hits(a) { return (this.x > a.x && this.x < a.x + a.w && this.y > a.y && this.y < a.y + a.h); }
}

class AlienBullet {
  constructor(x, y) { this.x = x; this.y = y; }
  show() { fill(255, 0, 0); noStroke(); rect(this.x, this.y, 5, 20); }
  update() { this.y += 4 + level; }
  hits(p) { return (this.x > p.x - p.w/2 && this.x < p.x + p.w/2 && this.y > height - 100 && this.y < height - 30); }
}

function displayUI() {
  fill(255); textSize(24); textAlign(CENTER);
  text(`SCORE: ${score} | LEVEL: ${level}`, GAME_WIDTH/2, height - 25);
  fill(255, 0, 0);
  let h = ""; for(let i=0; i<lives; i++) h += "❤ ";
  text(h, GAME_WIDTH/2, 40);
}