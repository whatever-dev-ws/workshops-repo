// WUP 25-26
// Annalena Psenner
let word = "";
let inputMode = true;
let baseFontSize = 120;
let displayFontSize = 120;
let isPaused = false;
let isBold = true;
let isItalic = false;

// 12 Professional Themes
let themes = [
  { name: 'NOIR', bg: '#0A0A0A', text: '#FFFFFF', accent: '#444444' },
  { name: 'BAUHAUS', bg: '#F0F0F0', text: '#000000', accent: '#FF0000' },
  { name: 'CYBER', bg: '#050505', text: '#00FF41', accent: '#003300' },
  { name: 'SOLAR', bg: '#FDF6E3', text: '#657B83', accent: '#93A1A1' },
  { name: 'COBALT', bg: '#00172D', text: '#00D4FF', accent: '#004A7F' },
  { name: 'VINTAGE', bg: '#2C2C2C', text: '#E9E4D4', accent: '#A63D40' },
  { name: 'NEON', bg: '#000000', text: '#FF00FF', accent: '#00FFFF' },
  { name: 'LATTE', bg: '#FFF4E0', text: '#4D3E3E', accent: '#B09B8E' },
  { name: 'BRUTAL', bg: '#0000FF', text: '#FFFFFF', accent: '#000000' },
  { name: 'FOREST', bg: '#0B1A13', text: '#D1D9D0', accent: '#4B5D52' },
  { name: 'SUNSET', bg: '#2D1B33', text: '#FF9E7D', accent: '#724E91' },
  { name: 'MUSEUM', bg: '#FFFFFF', text: '#000000', accent: '#E5E5E5' }
];
let themeIndex = 0;

let fonts = [
  { name: 'HELVETICA', family: 'Helvetica' },
  { name: 'GEORGIA', family: 'Georgia' },
  { name: 'COURIER', family: 'Courier New' },
  { name: 'IMPACT', family: 'Impact' },
  { name: 'VERDANA', family: 'Verdana' },
  { name: 'TIMES', family: 'Times New Roman' },
  { name: 'TREBUCHET', family: 'Trebuchet MS' },
  { name: 'ARIAL BLACK', family: 'Arial Black' },
  { name: 'PALATINO', family: 'Palatino' },
  { name: 'GENEVA', family: 'Geneva' }
];
let fontIndex = 0;

let frozenMX = 0, frozenMY = 0;
let inp;
let lastScrollTime = 0;

function setup() {
  createCanvas(windowWidth, windowHeight);
  inp = createInput('');
  inp.attribute('placeholder', 'TYPE WORD + ENTER');
  styleInput();
  centerInput();
}

function styleInput() {
  inp.style('background', 'transparent');
  inp.style('color', '#fff');
  inp.style('border', 'none');
  inp.style('border-bottom', '2px solid #fff');
  inp.style('text-align', 'center');
  inp.style('font-size', '32px');
  inp.style('font-family', 'sans-serif');
  inp.style('outline', 'none');
  inp.style('width', '80%');
  inp.style('max-width', '600px');
}

function centerInput() {
  // Ensure the input box stays centered on window resize
  let inpWidth = min(windowWidth * 0.8, 600);
  inp.position(windowWidth / 2 - inpWidth / 2, windowHeight / 2 - 20);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  centerInput();
}

function keyPressed() {
  if (inputMode && keyCode === ENTER) {
    if (inp.value().trim().length > 0) {
      word = inp.value().toUpperCase();
      inputMode = false;
      inp.hide();
    }
  } else if (!inputMode) {
    if (key === ' ') { 
      isPaused = !isPaused;
      if (isPaused) { frozenMX = mouseX; frozenMY = mouseY; }
    }
    if (key === 'c' || key === 'C') themeIndex = (themeIndex + 1) % themes.length;
    if (key === 'b' || key === 'B') isBold = !isBold;
    if (key === 'i' || key === 'I') isItalic = !isItalic;
    if (key === 's' || key === 'S') saveCanvas('kinetic_design', 'png');
    if (key === 'r' || key === 'R') {
      inputMode = true;
      inp.show();
      word = "";
      inp.value("");
    }
  }
}

function draw() {
  let theme = themes[themeIndex];
  background(theme.bg); 

  if (inputMode) {
    drawEntry();
    return;
  }

  textFont(fonts[fontIndex].family);
  let styleStr = NORMAL;
  if (isBold && isItalic) styleStr = BOLDITALIC;
  else if (isBold) styleStr = BOLD;
  else if (isItalic) styleStr = ITALIC;
  textStyle(styleStr);

  let mX = isPaused ? frozenMX : mouseX;
  let mY = isPaused ? frozenMY : mouseY;
  
  let letterSpacing = map(mX, 0, width, 0.4, 4.0);
  let vScale = map(mY, 0, height, 0.1, 5.0);
  let currentShear = map(mX, 0, width, -0.2, 0.2);

  // AUTO-SCALE calculation
  textSize(baseFontSize);
  let letters = word.split("");
  let rawWidth = 0;
  for (let l of letters) rawWidth += textWidth(l) * letterSpacing;
  
  let maxWidth = width * 0.9;
  let scaleFactor = rawWidth > maxWidth ? maxWidth / rawWidth : 1.0;
  displayFontSize = baseFontSize * scaleFactor;
  textSize(displayFontSize);

  let totalW = 0;
  for(let l of letters) totalW += textWidth(l) * letterSpacing;
  let currentX = width / 2 - totalW / 2;

  textAlign(CENTER, CENTER);

  for (let i = 0; i < letters.length; i++) {
    let charW = textWidth(letters[i]) * letterSpacing;
    push();
    translate(currentX + charW / 2, height / 2);
    
    shearX(currentShear); 
    scale(1, vScale);
    
    // Trail logic
    for (let d = 0; d < 4; d++) {
      let tCol = color(theme.accent);
      tCol.setAlpha(map(d, 0, 4, 80, 0));
      fill(tCol);
      text(letters[i], d * (mX-width/2)*0.01, d * (mY-height/2)*0.02);
    }
    
    fill(theme.text);
    text(letters[i], 0, 0);
    pop();
    currentX += charW;
  }

  drawHUD(theme);
}

function drawEntry() {
  push();
  textAlign(CENTER, CENTER);
  textFont('sans-serif');
  textStyle(NORMAL);
  noStroke();
  
  // Title text - perfectly centered horizontally
  fill(255, 100);
  textSize(14);
  text("KINETIC STUDIO", width/2, height/2 - 100);
  
  // Subtle prompt below
  fill(255, 50);
  textSize(10);
  text("ENTER WORD TO BEGIN", width/2, height/2 + 40);
  pop();
}

function drawHUD(theme) {
  push();
  let margin = 40;
  textFont('sans-serif');
  textStyle(NORMAL);
  textSize(9);
  noStroke();
  
  textAlign(LEFT);
  fill(theme.text);
  text(`STATUS: ${isPaused ? "LOCKED" : "ACTIVE"}`, margin, height - margin);
  
  textAlign(CENTER);
  text("MOUSE X: SPACING  |  MOUSE Y: HEIGHT  |  SPACE: FREEZE  |  C: THEME  |  B: BOLD  |  S: SAVE", width/2, height - margin);
  
  textAlign(RIGHT);
  text(`${fonts[fontIndex].name} / ${theme.name}`, width - margin, height - margin);
  pop();
}

function mouseWheel(event) {
  if (!inputMode) {
    let now = millis();
    if (now - lastScrollTime > 200) {
      if (event.delta > 0) fontIndex = (fontIndex + 1) % fonts.length;
      else fontIndex = (fontIndex - 1 + fonts.length) % fonts.length;
      lastScrollTime = now;
    }
  }
  return false; 
}


