// WUP 2025-2026 - Mees Jonker
// Intricate Maze + Light GIF Export + Clear Button

let points = []; 
let mode = 'line'; 
let snapAngle = 90; 
let isAnimating = false;
let animIndex = 0;
let animProgress = 0; 

let lineBtn, arcBtn, angleSlider, playBtn, speedSlider, mazeBtn, gifBtn, clearBtn, angleDisplay;

function setup() {
  createCanvas(windowWidth, windowHeight - 70);
  angleMode(DEGREES);

  // --- UI Styling ---
  let controls = createDiv().style('padding','12px').style('background','#1a1a1a').style('color','#eee')
    .style('display', 'flex').style('gap', '15px').style('align-items', 'center').style('font-family', 'sans-serif');
  
  let group1 = createDiv().parent(controls).style('display','flex').style('gap','5px');
  lineBtn = createButton('Line').parent(group1).mousePressed(() => mode = 'line');
  arcBtn = createButton('Arc').parent(group1).mousePressed(() => mode = 'arc');
  
  let group2 = createDiv().parent(controls).style('display','flex').style('gap','10px').style('align-items','center');
  createSpan('Angle Snap:').parent(group2);
  angleSlider = createSlider(0, 3, 3, 1).parent(group2); 
  angleDisplay = createSpan('90°').parent(group2).style('width', '35px');
  
  let group3 = createDiv().parent(controls).style('display','flex').style('gap','10px').style('align-items','center');
  createSpan('Speed:').parent(group3);
  speedSlider = createSlider(0.01, 0.3, 0.1, 0.01).parent(group3);
  
  let group4 = createDiv().parent(controls).style('display', 'flex').style('gap', '10px').style('margin-left', 'auto');
  mazeBtn = createButton('🧩 Gen Maze').parent(group4).mousePressed(generateMaze);
  playBtn = createButton('▶ Play').parent(group4).mousePressed(toggleAnimation);
  gifBtn = createButton('💾 Save GIF').parent(group4).mousePressed(exportGif);
  clearBtn = createButton('🗑 Clear').parent(group4).mousePressed(clearCanvas);

  styleButtons();
}

function draw() {
  background(255); // Solid white background for lighter GIF encoding
  updateSnapValue();

  if (isAnimating) {
    runAnimation();
  } else {
    drawEditor();
  }
}

function updateSnapValue() {
  let vals = [15, 30, 45, 90];
  snapAngle = vals[angleSlider.value()];
  angleDisplay.html(snapAngle + '°');
}

function clearCanvas() {
  points = [];
  isAnimating = false;
  animIndex = 0;
  animProgress = 0;
}

// --- Maze Generator ---

function generateMaze() {
  clearCanvas();
  let gridSize = 35;
  let curX = floor(random(width * 0.2, width * 0.8) / gridSize) * gridSize;
  let curY = floor(random(height * 0.2, height * 0.8) / gridSize) * gridSize;
  points.push({ x: curX, y: curY, type: 'line' });

  let currentAngle = floor(random(4)) * 90;

  for (let i = 0; i < 100; i++) {
    let last = points[points.length - 1];
    let turn = random([-90, 0, 90, 180]);
    currentAngle += turn;
    let stepSize = gridSize * floor(random(1, 4));
    let nextX = last.x + cos(currentAngle) * stepSize;
    let nextY = last.y + sin(currentAngle) * stepSize;

    if (nextX < 40 || nextX > width - 40 || nextY < 40 || nextY > height - 40) {
      currentAngle += 180;
      nextX = last.x + cos(currentAngle) * stepSize;
      nextY = last.y + sin(currentAngle) * stepSize;
    }

    points.push({ x: nextX, y: nextY, type: (i % 12 === 0) ? 'arc' : 'line' });
    if (i % 15 === 0) {
      let sideAngle = currentAngle + (random() > 0.5 ? 90 : -90);
      points.push({ x: nextX + cos(sideAngle) * gridSize, y: nextY + sin(sideAngle) * gridSize, type: 'line' });
      points.push({ x: nextX, y: nextY, type: 'line' });
    }
  }
}

// --- Drawing & GIF Logic ---

function exportGif() {
  if (points.length < 2) return;
  
  isAnimating = true;
  animIndex = 0;
  animProgress = 0;
  
  // Calculate duration: slightly faster recording makes for a "lighter" file size
  let duration = (points.length / (speedSlider.value() * 60)) + 0.3;
  
  // saveGif options: lower quality/fps can make the file much smaller
  saveGif('maze_art.gif', duration, { units: 'seconds', delay: 0 });
}

function drawPath(limit) {
  noFill(); 
  stroke(60); // Dark gray for better compression
  strokeWeight(2);
  for (let i = 0; i < limit - 1; i++) {
    renderSegment(points[i].x, points[i].y, points[i+1].x, points[i+1].y, points[i+1].type, 1);
  }
}

function renderSegment(x1, y1, x2, y2, type, ratio) {
  if (type === 'line') {
    line(x1, y1, lerp(x1, x2, ratio), lerp(y1, y2, ratio));
  } else {
    drawDynamicArc(x1, y1, x2, y2, ratio);
  }
}

function drawDynamicArc(x1, y1, x2, y2, percent) {
  let d = dist(x1, y1, x2, y2);
  let angleToMouse = atan2(y2 - y1, x2 - x1);
  arc(x1, y1, d * 2, d * 2, angleToMouse - (90 * percent), angleToMouse);
}

function runAnimation() {
  drawPath(animIndex + 1);
  if (animIndex < points.length - 1) {
    let p1 = points[animIndex];
    let p2 = points[animIndex + 1];
    stroke(255, 0, 0); 
    strokeWeight(3);
    renderSegment(p1.x, p1.y, p2.x, p2.y, p2.type, animProgress);

    animProgress += speedSlider.value();
    if (animProgress >= 1) { 
      animProgress = 0; 
      animIndex++; 
    }
  } else {
    isAnimating = false;
    playBtn.html('▶ Play');
  }
}

function drawEditor() {
  drawPath(points.length);
  if (points.length > 0 && !isAnimating) {
    let last = points[points.length - 1];
    let s = getSnappedMouse(last.x, last.y);
    stroke(0, 120, 255, 150); 
    strokeWeight(1);
    if (mode === 'line') line(last.x, last.y, s.x, s.y);
    else drawDynamicArc(last.x, last.y, s.x, s.y, 1);
    noStroke(); fill(0, 120, 255);
    ellipse(s.x, s.y, 6, 6);
  }
}

function getSnappedMouse(sx, sy) {
  let d = dist(sx, sy, mouseX, mouseY);
  let rawAngle = atan2(mouseY - sy, mouseX - sx);
  let snappedAngle = round(rawAngle / snapAngle) * snapAngle;
  return { x: sx + d * cos(snappedAngle), y: sy + d * sin(snappedAngle) };
}

function toggleAnimation() {
  if (points.length < 2) return;
  isAnimating = !isAnimating;
  animIndex = 0; animProgress = 0;
  playBtn.html(isAnimating ? '⏹ Stop' : '▶ Play');
}

function mousePressed() {
  if (mouseY < 0 || mouseY > height || isAnimating) return;
  if (points.length > 0) {
    let last = points[points.length - 1];
    let s = getSnappedMouse(last.x, last.y);
    points.push({ x: s.x, y: s.y, type: mode });
  } else {
    points.push({ x: mouseX, y: mouseY, type: 'line' });
  }
}

function styleButtons() {
  let btns = selectAll('button');
  for (let b of btns) {
    b.style('padding', '6px 14px').style('cursor', 'pointer').style('border', 'none')
     .style('border-radius', '4px').style('background', '#333').style('color', '#fff');
  }
}