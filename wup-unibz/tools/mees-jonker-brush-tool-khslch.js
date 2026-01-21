//WUP 2025-2026
//Mees Jonker
let points = []; 
let mode = 'line'; 
let snapAngle = 45;
let isAnimating = false;
let animIndex = 0;
let animProgress = 0; 

let lineBtn, arcBtn, angleSlider, playBtn, speedSlider, gifBtn;

function setup() {
  createCanvas(windowWidth, windowHeight - 60);
  angleMode(DEGREES);

  // --- UI Setup ---
  let controls = createDiv().style('padding','10px').style('background','#eee').style('display','flex').style('gap','10px');
  
  lineBtn = createButton('Line').parent(controls).mousePressed(() => mode = 'line');
  arcBtn = createButton('Arc').parent(controls).mousePressed(() => mode = 'arc');
  
  createSpan(' | Snap:').parent(controls);
  angleSlider = createSlider(1, 90, 45, 1).parent(controls);
  
  playBtn = createButton('▶ Play').parent(controls).mousePressed(toggleAnimation);
  
  createSpan('Speed:').parent(controls);
  speedSlider = createSlider(0.01, 0.2, 0.05, 0.01).parent(controls);
  
  gifBtn = createButton('💾 Save GIF').parent(controls).mousePressed(exportGif);
  
  createButton('Clear').parent(controls).mousePressed(() => { points = []; isAnimating = false; });
}

function draw() {
  background(255);
  snapAngle = angleSlider.value();

  if (isAnimating) {
    runAnimation();
  } else {
    drawEditor();
  }
}

// --- The Fixed Functions ---

function drawEditor() {
  drawPath(points.length); // Draw all saved points
  
  if (points.length > 0) {
    let last = points[points.length - 1];
    let snapped = getSnappedMouse(last.x, last.y);
    
    stroke(0, 120, 255, 100); // Blue preview
    if (mode === 'line') {
      line(last.x, last.y, snapped.x, snapped.y);
    } else {
      drawArc(last.x, last.y, snapped.x, snapped.y, 1);
    }
  }
}

function runAnimation() {
  drawPath(animIndex + 1);

  if (animIndex < points.length - 1) {
    let p1 = points[animIndex];
    let p2 = points[animIndex + 1];
    
    stroke(255, 0, 0); // Red animation line
    if (p2.type === 'line') {
      let curX = lerp(p1.x, p2.x, animProgress);
      let curY = lerp(p1.y, p2.y, animProgress);
      line(p1.x, p1.y, curX, curY);
    } else {
      drawArc(p1.x, p1.y, p2.x, p2.y, animProgress);
    }

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

function drawPath(limit) {
  noFill(); 
  stroke(0); 
  strokeWeight(2);
  for (let i = 0; i < limit - 1; i++) {
    let p1 = points[i];
    let p2 = points[i+1];
    if (p2.type === 'line') {
      line(p1.x, p1.y, p2.x, p2.y);
    } else {
      drawArc(p1.x, p1.y, p2.x, p2.y, 1);
    }
  }
}

function drawArc(x1, y1, x2, y2, percent) {
  let d = dist(x1, y1, x2, y2);
  let angle = atan2(y2 - y1, x2 - x1);
  arc(x1, y1, d * 2, d * 2, angle - (90 * percent), angle);
}

// --- Logic & Events ---

function toggleAnimation() {
  if (points.length < 2) return;
  isAnimating = !isAnimating;
  animIndex = 0;
  animProgress = 0;
  playBtn.html(isAnimating ? '⏹ Stop' : '▶ Play');
}

function exportGif() {
  if (points.length < 2) return;
  animIndex = 0;
  animProgress = 0;
  isAnimating = true;
  
  // Estimate time: roughly 1 second per 3 segments at default speed
  let duration = (points.length / speedSlider.value()) / 60;
  saveGif('drawing.gif', duration, { units: 'seconds' });
}

function getSnappedMouse(sx, sy) {
  let d = dist(sx, sy, mouseX, mouseY);
  let rawAngle = atan2(mouseY - sy, mouseX - sx);
  let snappedAngle = round(rawAngle / snapAngle) * snapAngle;
  return { 
    x: sx + d * cos(snappedAngle), 
    y: sy + d * sin(snappedAngle) 
  };
}

function mousePressed() {
  if (mouseY < 0 || isAnimating) return;
  if (points.length > 0) {
    let last = points[points.length - 1];
    let s = getSnappedMouse(last.x, last.y);
    points.push({ x: s.x, y: s.y, type: mode });
  } else {
    points.push({ x: mouseX, y: mouseY, type: 'line' });
  }
}