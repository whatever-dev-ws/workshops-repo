//WUP 25/26
//Leo Longhin

let sentence = "";
let words = [];
let paths = []; 
let currentPath = [];
let state = "INPUT"; 
let wordIndex = 0;
let animTimer = 0;
let isDrawing = false;
let font; // Variable for custom font

let sSize, sSpeed, sColor, sSpacing, sSmooth, checkTransparent, fontInput;

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 360, 100, 100);
  
  // INITIAL INPUT UI
  let welcome = createP('1. Type Sentence & Upload Font').position(20, 0).style('color', 'white');
  
  let inp = createInput('Type sentence here');
  inp.position(20, 45);
  
  fontInput = createFileInput(handleFont);
  fontInput.position(20, 75);

  let startBtn = createButton('START DRAWING');
  startBtn.position(20, 110);
  
  startBtn.mousePressed(() => {
    sentence = inp.value();
    words = sentence.split(" ");
    inp.hide();
    welcome.hide();
    fontInput.hide();
    startBtn.hide();
    createUI();
    state = "DRAWING";
  });
}

function handleFont(file) {
  if (file.name.endsWith('.ttf') || file.name.endsWith('.otf')) {
    font = loadFont(file.data);
  }
}

function createUI() {
  let uiX = 20;
  
  checkTransparent = createCheckbox(' Transparent BG', false);
  checkTransparent.position(uiX, 10).style('color', 'white');

  createP('Text Size').position(uiX, 30).style('color', 'white');
  sSize = createSlider(10, 100, 40); sSize.position(uiX, 60);

  createP('Letter Spacing').position(uiX, 90).style('color', 'white');
  sSpacing = createSlider(10, 80, 30); sSpacing.position(uiX, 120);

  createP('Anim Speed').position(uiX, 150).style('color', 'white');
  sSpeed = createSlider(0.5, 3, 1, 0.1); sSpeed.position(uiX, 180);

  createP('Smoothing').position(uiX, 210).style('color', 'white');
  sSmooth = createSlider(0, 5, 3); sSmooth.position(uiX, 240);

  createP('Color').position(uiX, 270).style('color', 'white');
  sColor = createSlider(0, 360, 180); sColor.position(uiX, 300);
  
  let btnGif = createButton('Save as GIF');
  btnGif.position(uiX, 340);
  btnGif.mousePressed(() => {
     let duration = (words.length * (180 / sSpeed.value())) / 60;
     saveGif('word_animation', duration);
  });

  let btnReset = createButton('Reset / New Text');
  btnReset.position(uiX, 370);
  btnReset.mousePressed(() => location.reload());
}

function draw() {
  if (checkTransparent && checkTransparent.checked()) {
    clear();
    // Temporary visual guide for drawing path
    if (state === "DRAWING") {
      background(15, 50); 
    }
  } else {
    background(15);
  }

  if (state === "DRAWING") {
    fill(255); noStroke(); textAlign(LEFT);
    textFont('Arial'); // Instructions in standard font
    text(`Step ${wordIndex + 1}/${words.length}: Draw path for "${words[wordIndex]}"`, 250, 40);
    
    stroke(255, 50); noFill();
    for (let p of paths) {
      beginShape();
      for (let pt of p.points) vertex(pt.x, pt.y);
      endShape();
    }
  } else if (state === "ANIMATING") {
    animateLetters();
  }
}

// CHAIKIN'S ALGORITHM
function smoothPath(path, iterations) {
  if (iterations === 0 || path.length < 3) return path;
  let newPath = [];
  newPath.push(path[0]);
  for (let i = 0; i < path.length - 1; i++) {
    let p0 = path[i];
    let p1 = path[i + 1];
    let q = p5.Vector.lerp(p0, p1, 0.25);
    let r = p5.Vector.lerp(p0, p1, 0.75);
    newPath.push(q);
    newPath.push(r);
  }
  newPath.push(path[path.length - 1]);
  return smoothPath(newPath, iterations - 1);
}

function animateLetters() {
  let pathData = paths[wordIndex];
  let totalPathLen = pathData.totalDist;
  let speedMult = sSpeed.value();
  let letterGap = sSpacing.value();
  let totalTime = 180 / speedMult;
  
  let charProgress = animTimer / totalTime;
  if (charProgress > 1) charProgress = 1;

  let leaderDist;
  if (charProgress < 0.4) {
    let t = map(charProgress, 0, 0.4, 0, 1);
    leaderDist = (1 - Math.pow(1 - t, 3)) * (totalPathLen * 0.5);
  } else if (charProgress < 0.6) {
    leaderDist = totalPathLen * 0.5;
  } else {
    let t = map(charProgress, 0.6, 1, 0, 1);
    leaderDist = map(Math.pow(t, 3), 0, 1, totalPathLen * 0.5, totalPathLen);
  }

  let chars = words[wordIndex].split("").reverse(); 
  for (let i = 0; i < chars.length; i++) {
    let targetDist = leaderDist - (i * letterGap);
    if (targetDist >= 0 && targetDist <= totalPathLen) {
      let posObj = getPointAtDist(pathData.points, targetDist);
      if (posObj) drawOrientedLetter(chars[i], posObj.pos, posObj.angle);
    }
  }

  animTimer += speedMult;
  let lastLetterDist = leaderDist - (chars.length * letterGap);
  if (lastLetterDist > totalPathLen || animTimer > totalTime + 50) {
    animTimer = 0;
    wordIndex = (wordIndex + 1) % words.length;
  }
}

function getPointAtDist(points, targetD) {
  let accumulated = 0;
  for (let i = 0; i < points.length - 1; i++) {
    let d = dist(points[i].x, points[i].y, points[i+1].x, points[i+1].y);
    if (accumulated + d >= targetD) {
      let localT = (targetD - accumulated) / d;
      let x = lerp(points[i].x, points[i+1].x, localT);
      let y = lerp(points[i].y, points[i+1].y, localT);
      let angle = atan2(points[i+1].y - points[i].y, points[i+1].x - points[i].x);
      return { pos: createVector(x, y), angle: angle };
    }
    accumulated += d;
  }
  return { pos: points[points.length-1], angle: 0 };
}

function drawOrientedLetter(char, pos, angle) {
  push();
  translate(pos.x, pos.y);
  rotate(angle);
  textAlign(CENTER, CENTER);
  
  // USE FONT IF LOADED
  if (font && font.font) {
    textFont(font);
  } else {
    textFont('Arial');
  }
  
  textSize(sSize.value());
  fill(sColor.value(), 80, 100); noStroke();
  text(char, 0, 0);
  pop();
}

function mousePressed() {
  if (state === "DRAWING" && mouseX > 240) {
    isDrawing = true;
    currentPath = [];
  }
}

function mouseDragged() {
  if (isDrawing) currentPath.push(createVector(mouseX, mouseY));
}

function mouseReleased() {
  if (isDrawing && currentPath.length > 2) {
    let smoothed = smoothPath(currentPath, sSmooth.value());
    let dTotal = 0;
    for (let i = 0; i < smoothed.length - 1; i++) {
      dTotal += dist(smoothed[i].x, smoothed[i].y, smoothed[i+1].x, smoothed[i+1].y);
    }
    paths.push({ points: smoothed, totalDist: dTotal });
    wordIndex++;
    if (wordIndex >= words.length) {
      state = "ANIMATING";
      wordIndex = 0;
    }
    isDrawing = false;
  }
}