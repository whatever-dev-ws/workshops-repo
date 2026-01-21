let state = "NORMAL"; 
let letters = [];
let inputField, colorPicker, fontSelect, fontUpload, btnTerminal, btnSaveImg, saveType, fontLabel;
let terminalInput, diffSelect, btnDecrypt, btnClaim, btnReturn, btnCopy, btnStartRhythm;
let customFont, capture, screenshot;
let dripPositions = [];

// Game & Logic Variables
let tries = 3;
let bootLines = ["> INITIALIZING TYPOGRAPHIC KERNEL...", "> MOUNTING LETTERS...", "> ACCESS GRANTED."];
let bootLineIdx = 0, bootCharIdx = 0;
let pacPos, pacDir, hearts = 3, level = 1, ghosts = [], countdown = 0, lastCountTime = 0, levelActive = false, obstacles = [];
let typingActive = false, typingTimer = 35, lastTimerTick = 0, shakeAmount = 0;
let currentLineIdx = 0, currentCharIdx = 0, targetLines = [];

// --- RHYTHM & MATRIX VARIABLES ---
let rhythmScore = 0;
let fallingLetters = [];
let matrixStreams = [];
let matrixPulse = 0;
let rhythmErrors = 0; 
let globalDifficulty = 1; 
const RHYTHM_TARGET = 150; 
const HORIZON_Y = 100, HIT_LINE_Y = 500;

const diffSettings = {
  "1": { lines: ["HELLO_REYKJAVIK"], time: 60, name: "Easy" },
  "2": { lines: ["ACCESS_KEY_IDENTIFIED", "REYKJAVIK_SERVER_CONNECTED"], time: 45, name: "Medium" },
  "3": { lines: ["SYSTEM_OVERRIDE_INITIATED", "DECRYPTING_REYKJAVIK_COORDINATES"], time: 35, name: "Hard" }
};

function setup() {
  createCanvas(800, 600);
  for (let i = 0; i < 80; i++) dripPositions[i] = 0;

  for (let i = 0; i < width / 20; i++) {
    matrixStreams.push({ x: i * 20, y: random(-height, 0), speed: random(2, 5) });
  }

  // --- UI INITIALIZATION WITH INLINE STYLES ---
  inputField = createInput('TYPE');
  inputField.position(10, height + 10);
  applyInlineStyle(inputField, { width: '140px', background: '#222', color: '#0f0', border: '1px solid #0f0' });
  inputField.input(handleInput);

  colorPicker = createColorPicker('#f0f0ff');
  colorPicker.position(160, height + 10);

  fontSelect = createSelect();
  fontSelect.position(240, height + 10);
  applyInlineStyle(fontSelect, { background: '#222', color: '#0f0', border: '1px solid #0f0' });
  fontSelect.option('Arial'); fontSelect.option('Courier New'); fontSelect.option('Impact');

  fontLabel = createSpan('Import Font: ');
  fontLabel.position(380, height + 10);
  applyInlineStyle(fontLabel, { color: '#444', fontSize: '12px', fontFamily: 'monospace' });
  
  fontUpload = createFileInput(handleFontUpload);
  fontUpload.position(470, height + 10);

  btnTerminal = createButton('ACCESS TERMINAL');
  btnTerminal.position(10, height + 40);
  styleTerminalButton(btnTerminal, '#0f0', '#000');
  btnTerminal.mousePressed(startBootSequence);

  saveType = createSelect();
  saveType.position(10, height + 70);
  applyInlineStyle(saveType, { background: '#222', color: '#0f0', border: '1px solid #0f0' });
  saveType.option('png'); saveType.option('jpg');

  btnSaveImg = createButton('SAVE IMAGE');
  btnSaveImg.position(80, height + 70);
  styleTerminalButton(btnSaveImg, '#0ff', '#000');
  btnSaveImg.mousePressed(() => saveCanvas('art_capture', saveType.value()));

  textAlign(CENTER, CENTER);
  handleInput();
}

// Helper to apply common styles
function applyInlineStyle(element, styles) {
  for (let prop in styles) {
    element.elt.style[prop] = styles[prop];
  }
}

// Specialized styling for "Hacker" buttons
function styleTerminalButton(btn, color, bg) {
  let s = btn.elt.style;
  s.padding = '5px 10px';
  s.backgroundColor = bg;
  s.color = color;
  s.border = `1px solid ${color}`;
  s.fontFamily = 'monospace';
  s.cursor = 'pointer';
  s.fontWeight = 'bold';
  s.transition = '0.2s';

  btn.mouseOver(() => { s.backgroundColor = color; s.color = bg; });
  btn.mouseOut(() => { s.backgroundColor = bg; s.color = color; });
}

function draw() {
  if (shakeAmount > 0) {
    translate(random(-shakeAmount, shakeAmount), random(-shakeAmount, shakeAmount));
    shakeAmount *= 0.85;
  }

  if (state === "NORMAL") drawNormal();
  else if (state === "BOOT") drawBootSequence();
  else if (state === "TERMINAL") drawTerminal();
  else if (state === "RHYTHM_SELECT") drawRhythmSelect();
  else if (state === "RHYTHM_GAME") drawRhythmGame();
  else if (state === "PACMAN") drawPacman();
  else if (state === "OVERWRITE_GAME") drawOverwriteGame();
  else if (state.startsWith("PRIZE_")) drawPrizes();
  else if (state === "MELT_FAIL") drawMeltAnimation(false);
  else if (state === "SUCCESS_TRANSITION") drawMeltAnimation(true);
}

// --- MATRIX & RHYTHM LOGIC ---

function drawMatrixBackground() {
  fill(0, 255, 0, 80);
  textFont('monospace');
  matrixPulse = lerp(matrixPulse, 0, 0.1);
  for (let s of matrixStreams) {
    s.y += s.speed;
    if (s.y > height) s.y = -20;
    textSize(14 + (matrixPulse * 25));
    text(char(0x30A0 + floor(random(96))), s.x, s.y);
  }
}

function drawRhythmSelect() {
  background(0);
  drawMatrixBackground();
  fill(0, 255, 0);
  textSize(24);
  text("REYKJAVIK SYSTEM SYNC", width/2, height/2 - 100);
  textSize(14);
  text("COMPLETE SYNC TO UNLOCK PAC-MAN PROTOCOL", width/2, height/2 - 70);
}

function startRhythmGame() {
  globalDifficulty = int(diffSelect.value());
  rhythmScore = 0;
  rhythmErrors = 0;
  fallingLetters = [];
  state = "RHYTHM_GAME";
  if (diffSelect) diffSelect.hide();
  if (btnStartRhythm) btnStartRhythm.hide();
}

function drawRhythmGame() {
  background(0, 40);
  drawMatrixBackground();
  
  stroke(0, 255, 255); strokeWeight(4);
  line(50, HIT_LINE_Y, width-50, HIT_LINE_Y);
  noStroke(); fill(0, 255, 0);
  
  let livesMsg = (globalDifficulty === 3) ? ` | ERRORS: ${rhythmErrors}/3` : " | LIVES: ∞";
  text(`SYNC STATUS | SCORE: ${rhythmScore}/${RHYTHM_TARGET}${livesMsg}`, width/2, 30);

  if (frameCount % floor(60 / (globalDifficulty + 1)) === 0) {
    let chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let combo = chars[floor(random(chars.length))];
    if (globalDifficulty >= 2) combo += chars[floor(random(chars.length))];
    fallingLetters.push({ txt: combo, y: HORIZON_Y, side: random([-1, 0, 1]), speed: 3 + globalDifficulty });
  }

  for (let i = fallingLetters.length - 1; i >= 0; i--) {
    let f = fallingLetters[i];
    f.y += f.speed;
    let xPos = width/2 + f.side * map(f.y, HORIZON_Y, height, 0, 350);
    let sz = map(f.y, HORIZON_Y, height, 10, 60);
    fill(0, 255, 0); textSize(sz); text(f.txt, xPos, f.y);
    
    if (f.y > height) {
      fallingLetters.splice(i, 1);
      if (globalDifficulty === 3) {
        rhythmErrors++;
        shakeAmount = 15;
        if (rhythmErrors >= 3) startMelt();
      }
    }
  }

  if (rhythmScore >= RHYTHM_TARGET) {
    startPacmanLevel(1);
  }
}

// --- PACMAN SYSTEM ---

function startPacmanLevel(lvl) {
  state = "PACMAN"; level = lvl; pacPos = createVector(100, 100); countdown = 4; lastCountTime = millis();
  levelActive = false; obstacles = []; ghosts = []; hearts = 3;
  for (let i = 0; i < level * 10; i++) obstacles.push({ pos: createVector(random(60, width-100), random(60, height-100)), isPurple: (level === 4) });
  let gCount = (level === 4) ? 5 : (level >= 2 ? level - 1 : 0);
  for (let i = 0; i < gCount; i++) ghosts.push({pos: createVector(width-100, height-100)});
}

function drawPacman() {
  background(0, 15, 0); stroke(0, 255, 0); noFill(); rect(10, 10, width-20, height-20); noStroke();
  if (countdown > 0) {
    fill(0, 255, 0); textSize(18);
    text("PAC-MAN PROTOCOL: LEVEL " + level + "\nREACH { EXIT }\nSTARTING IN: " + countdown, width/2, height/2);
    if (millis() - lastCountTime > 1000) { countdown--; lastCountTime = millis(); if(countdown==0) levelActive=true; }
    return;
  }
  fill(0, 255, 255); textSize(24); text("{ EXIT }", width-80, height-80);
  if (levelActive) { handlePacmanMovement(); checkPacmanCollisions(); }
  push(); translate(pacPos.x, pacPos.y); rotate(pacDir); fill(255, 255, 0); textSize(35); text(">", 0, 0); pop();
  for (let obs of obstacles) { fill(obs.isPurple ? color(150, 0, 255) : color(255, 50, 50)); text("[ X ]", obs.pos.x, obs.pos.y); }
  for (let g of ghosts) {
    let s = (level === 4) ? 2.3 : 1.4; g.pos.x += pacPos.x > g.pos.x ? s : -s; g.pos.y += pacPos.y > g.pos.y ? s : -s;
    fill(255, 0, 255); text("?", g.pos.x, g.pos.y);
  }
  textAlign(LEFT); fill(0, 255, 0); textSize(14); text("INTEGRITY: " + "█ ".repeat(ceil(hearts)), 30, 40);
}

function checkPacmanCollisions() {
  for (let obs of obstacles) if (dist(pacPos.x, pacPos.y, obs.pos.x, obs.pos.y) < 25) { hearts -= 0.5; pacPos.set(100, 100); shakeAmount = 10; }
  for (let g of ghosts) if (dist(pacPos.x, pacPos.y, g.pos.x, g.pos.y) < 25) { hearts -= 1; pacPos.set(100, 100); }
  if (hearts <= 0) startMelt();
  if (dist(pacPos.x, pacPos.y, width-80, height-80) < 40) {
    if (level < 4) startPacmanLevel(level + 1); else setupOverwriteUI();
  }
}

// --- TERMINAL UI & DECRYPTION ---

function setupTerminalUI() {
  terminalInput = createInput('');
  terminalInput.position(width/2 - 100, height/2 + 100);
  applyInlineStyle(terminalInput, { background: '#000', color: '#0f0', border: '1px solid #0f0', textAlign: 'center' });
  terminalInput.changed(() => {
    if (terminalInput.value().toLowerCase() === "reykjavik") {
      terminalInput.remove(); state = "RHYTHM_SELECT";
      diffSelect = createSelect(); diffSelect.position(width/2 - 50, height/2 - 40);
      applyInlineStyle(diffSelect, { background: '#000', color: '#0f0', border: '1px solid #0f0' });
      diffSelect.option('Easy', 1); diffSelect.option('Medium', 2); diffSelect.option('Hard', 3);
      btnStartRhythm = createButton('SYNC KERNEL');
      btnStartRhythm.position(width/2 - 70, height/2 + 10);
      styleTerminalButton(btnStartRhythm, '#0f0', '#000');
      btnStartRhythm.mousePressed(() => startRhythmGame());
    } else { tries--; terminalInput.value(''); if (tries <= 0) { terminalInput.remove(); startMelt(); } }
  });
}

function setupOverwriteUI() {
  state = "OVERWRITE_GAME";
  currentCharIdx = 0; currentLineIdx = 0;
  let d = diffSettings[globalDifficulty.toString()];
  targetLines = d.lines; 
  typingTimer = d.time;
  
  btnDecrypt = createButton('START DECRYPTION');
  btnDecrypt.position(width/2 - 70, height/2 + 140);
  styleTerminalButton(btnDecrypt, '#f0f', '#000');
  btnDecrypt.mousePressed(() => { 
    typingActive = true; 
    btnDecrypt.hide(); 
    lastTimerTick = millis(); 
  });
}

function drawOverwriteGame() {
  background(0); fill(0, 255, 0); textFont('monospace'); textAlign(CENTER);
  textSize(22); text("FINAL UPLINK: DECRYPTION PHASE", width/2, 50);
  textSize(14); fill(200); text("INSTRUCTIONS: TYPE THE TEXT EXACTLY AS SEEN", width/2, 90);
  for (let i = 0; i < targetLines.length; i++) {
    let line = targetLines[i]; let y = height/2 - 40 + (i * 40);
    for (let j = 0; j < line.length; j++) {
      fill(i < currentLineIdx || (i === currentLineIdx && j < currentCharIdx) ? color(0, 255, 255) : 60);
      text(line[j], (width/2 - (line.length * 16)/2) + (j * 16), y);
    }
  }
  if (typingActive) {
    if (millis() - lastTimerTick > 1000) { typingTimer--; lastTimerTick = millis(); }
    fill(255, 255, 0); text("TIME: " + typingTimer + "s", width/2, 140);
    if (currentLineIdx >= targetLines.length) triggerClaimButton();
    if (typingTimer <= 0) startMelt();
  }
}

function triggerClaimButton() {
  typingActive = false;
  if (!btnClaim) {
    btnClaim = createButton('DOWNLOAD REWARD');
    btnClaim.position(width/2 - 60, height/2 + 100);
    styleTerminalButton(btnClaim, '#fff', '#000');
    btnClaim.mousePressed(() => {
      btnClaim.remove(); btnClaim = null;
      let diffName = diffSettings[globalDifficulty.toString()].name.toUpperCase();
      state = "PRIZE_" + diffName; 
      setupUniversalReturn();
    });
  }
}

// --- UTILITIES & GAMEPLAY ---

function drawTerminal() {
  background(0); fill(0, 255, 0); textFont('monospace'); textAlign(CENTER);
  text("REYKJAVIK CENTRAL HUB\nCHALLENGE: What is the capital of Iceland?", width/2, height/2 - 40);
  fill(255, 0, 0); text("ATTEMPTS: " + tries, width/2, height/2 + 50);
}

function keyPressed() {
  if (state === "RHYTHM_GAME") {
    for (let i = fallingLetters.length - 1; i >= 0; i--) {
      let f = fallingLetters[i];
      let d = abs(f.y - HIT_LINE_Y);
      if (f.txt.includes(key.toUpperCase()) && d < 60) {
        rhythmScore += 25; matrixPulse = 1.0; fallingLetters.splice(i, 1); return;
      }
    }
  }
  if (state === "OVERWRITE_GAME" && typingActive) {
    let expected = targetLines[currentLineIdx][currentCharIdx];
    if (key.toUpperCase() === expected || (expected === '_' && key === ' ')) {
      currentCharIdx++; if (currentCharIdx >= targetLines[currentLineIdx].length) { currentCharIdx = 0; currentLineIdx++; }
    } else if (key !== 'Shift') shakeAmount = 10;
  }
}

function drawNormal() {
  background(colorPicker.color());
  if (customFont) textFont(customFont); else textFont(fontSelect.value());
  for (let l of letters) {
    l.x += l.vx; l.y += l.vy;
    if (l.x < 0 || l.x > width) l.vx *= -1;
    if (l.y < 0 || l.y > height) l.vy *= -1;
    fill(0); textSize(40); text(l.char, l.x, l.y);
  }
}

function startBootSequence() { state = "BOOT"; toggleInitialUI(false); bootLineIdx = 0; bootCharIdx = 0; }

function drawBootSequence() {
  background(0); fill(0, 255, 0); textFont('monospace'); textAlign(LEFT);
  let currentLine = bootLines[bootLineIdx];
  if (frameCount % 3 === 0 && bootCharIdx < currentLine.length) bootCharIdx++;
  for (let i = 0; i <= bootLineIdx; i++) {
    let t = (i === bootLineIdx) ? bootLines[i].substring(0, bootCharIdx) : bootLines[i];
    text(t, 50, 50 + (i * 30));
  }
  if (bootCharIdx >= currentLine.length && frameCount % 30 === 0) {
    if (bootLineIdx < bootLines.length - 1) { bootLineIdx++; bootCharIdx = 0; }
    else { state = "TERMINAL"; setupTerminalUI(); }
  }
}

function drawPrizes() {
  background(0);
  if (state === "PRIZE_EASY") {
    let s = 100 + sin(frameCount * 0.1) * 20;
    fill(0, 255, 0); textSize(s); text("EASY_MODE\nCOMPLETE", width/2, height/2);
  } else if (state === "PRIZE_MEDIUM") {
    push(); translate(width/2, height/2); rotate(frameCount * 0.02);
    for(let i=0; i<8; i++) { rotate(PI/4); fill(random(255), 255, 255); textSize(20); text("REWARD", 100, 0); }
    pop();
  } else if (state === "PRIZE_HARD") {
    if (!capture) { capture = createCapture(VIDEO); capture.hide(); }
    image(capture, 0, 0, width, height); filter(THRESHOLD);
    fill(0, 255, 0); textSize(40); text("SYSTEM_OWNED", width/2, height/2);
  }
}

function handlePacmanMovement() {
  let speed = 6;
  if (keyIsDown(LEFT_ARROW)) { pacPos.x -= speed; pacDir = PI; }
  if (keyIsDown(RIGHT_ARROW)) { pacPos.x += speed; pacDir = 0; }
  if (keyIsDown(UP_ARROW)) { pacPos.y -= speed; pacDir = -HALF_PI; }
  if (keyIsDown(DOWN_ARROW)) { pacPos.y += speed; pacDir = HALF_PI; }
}

function setupUniversalReturn() {
  btnReturn = createButton('LOGOUT'); btnReturn.position(width - 100, 20);
  styleTerminalButton(btnReturn, '#f00', '#000');
  btnReturn.mousePressed(() => { btnReturn.remove(); state = "SUCCESS_TRANSITION"; });
}

function drawMeltAnimation(isSuccess) {
  if (isSuccess) drawNormal(); else if (screenshot) image(screenshot, 0, 0);
  fill(isSuccess ? 255 : 0, 180);
  let fin = 0;
  for (let i = 0; i < dripPositions.length; i++) {
    rect(i * 10, dripPositions[i], 10, height);
    if (dripPositions[i] < height) dripPositions[i] += random(3, 10); else fin++;
  }
  if (fin >= dripPositions.length) resetToDefault();
}

function startMelt() { screenshot = get(); state = "MELT_FAIL"; if(diffSelect) diffSelect.hide(); if(btnStartRhythm) btnStartRhythm.hide(); if(btnDecrypt) btnDecrypt.hide(); }

function resetToDefault() {
  state = "NORMAL"; toggleInitialUI(true);
  for (let i = 0; i < 80; i++) dripPositions[i] = 0;
  hearts = 3; level = 1; tries = 3;
}

function toggleInitialUI(show) {
  let f = show ? 'show' : 'hide';
  inputField[f](); colorPicker[f](); fontSelect[f](); fontUpload[f](); fontLabel[f](); btnTerminal[f]();
}

function handleInput() {
  letters = []; let txt = inputField.value();
  for (let i = 0; i < txt.length; i++) { letters.push({ char: txt[i], x: 100 + i * 40, y: height/2, vx: random(-1,1), vy: random(-1,1) }); }
}

function handleFontUpload(f) { if (f.name.endsWith('.ttf') || f.name.endsWith('.otf')) customFont = loadFont(f.data); }