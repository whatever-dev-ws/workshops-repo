// WUP 25-26
// Annalena Psenner
let recording = false;
let recordedFrames = [];
const maxFrames = 80; 
let state = "idle"; 
let pos, head, lHand, rHand, lFoot, rfFoot;
let draggedJoint = null;
let heartY = 0, tearY = 0;
let isPlayingBack = false;
let playbackFrame = 0;
let downloadBtn;
let isProcessing = false;
let toolbar;

const script = document.createElement('script');
script.src = 'https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.js';
document.head.appendChild(script);

function setup() {
  createCanvas(600, 500);
  pos = createVector(width / 2, height / 2 + 50);
  fullReset();

  toolbar = createDiv('');
  toolbar.style('padding', '10px');
  toolbar.style('background', '#f0f0f0');
  toolbar.style('display', 'flex');
  toolbar.style('gap', '5px');
  toolbar.style('border-bottom', '1px solid #ccc');
  
  createActionButton("KISS 💋", () => { changeState("kiss"); });
  createActionButton("WAVE 👋", () => { changeState("wave"); });
  createActionButton("CRY 😭", () => { changeState("cry"); tearY = 0; });
  createActionButton("SHAKE 🙅‍♂️", () => { changeState("shake"); });
  createActionButton("DANCE 💃", () => { changeState("dance"); });
  createActionButton("POSE ✋", () => { changeState("pose"); });
  createActionButton("RESET 🔄", () => { fullReset(); });
  
  let recBtn = createButton('● START RECORDING');
  styleRecButton(recBtn);
  recBtn.mousePressed(startRecording);

  frameRate(20);
}

function changeState(newState) {
  state = newState;
  if (isPlayingBack) stopPlayback();
}

function fullReset() {
  head = createVector(0, -80);
  lHand = createVector(-25, -35);
  rHand = createVector(25, -35);
  lFoot = createVector(-20, 40);
  rfFoot = createVector(20, 40);
  state = "idle";
  stopPlayback();
}

function stopPlayback() {
  isPlayingBack = false;
  isProcessing = false;
  recording = false;
  if (downloadBtn) {
    downloadBtn.remove();
    downloadBtn = null;
  }
}

function draw() {
  background(253, 252, 248); 

  if (isPlayingBack) {
    if (recordedFrames.length > 0) {
      image(recordedFrames[playbackFrame], 0, 0);
      playbackFrame = (playbackFrame + 1) % recordedFrames.length;
    }
    if (isProcessing) drawLoadingAnimation();
    drawUIOverlay(isProcessing ? "PROCESSING GIF..." : "REWATCHING MODE - PRESS ANY POSE TO START NEW");
  } else {
    updatePuppetLogic();
    drawStickman(pos.x, pos.y, state);

    if (recording) {
      recordedFrames.push(get()); 
      fill(255, 0, 0); noStroke();
      ellipse(width - 30, 30, 15, 15);
      
      stroke(255, 0, 0, 100);
      strokeWeight(4);
      noFill();
      line(0, height-2, map(recordedFrames.length, 0, maxFrames, 0, width), height-2);
      
      if (recordedFrames.length >= maxFrames) {
        recording = false;
        isPlayingBack = true;
        isProcessing = true;
        prepareGif();
      }
    }
  }
}

function updatePuppetLogic() {
  // FIX: Explicitly check if the mouse is inside the canvas area (0 to width, 0 to height)
  let isMouseInCanvas = mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height;

  if (mouseIsPressed && isMouseInCanvas) {
    if (state === "pose") {
      handlePosing();
    } else {
      // Body movement logic only triggers if mouse is inside the drawing area
      pos.x = lerp(pos.x, mouseX, 0.15);
      pos.y = lerp(pos.y, mouseY, 0.15);
    }
  } else { 
    draggedJoint = null; 
  }
}

function drawStickman(x, y, action) {
  stroke(60); strokeWeight(3.5); noFill();
  let t = frameCount * 0.2;
  let h = head.copy(), lh = lHand.copy(), rh = rHand.copy(), lf = lFoot.copy(), rf = rfFoot.copy();

  if (action === "shake") h.x += sin(frameCount * 0.6) * 12;
  if (action === "wave") {
    let angle = sin(t * 1.5) * 0.6 - 0.8; 
    rh.x = cos(angle) * 50 + 10; rh.y = sin(angle) * 50 - 60;
  }
  if (action === "dance") {
    rh.set(sin(t * 2) * 40, cos(t * 2) * 25 - 70);
    lh.set(-sin(t * 2) * 40, -cos(t * 2) * 25 - 70);
    lf.set(-20 + sin(t * 2) * 15, 40 + cos(t * 2) * 10);
    rf.set(20 + sin(t * 2 + PI) * 15, 40 + cos(t * 2 + PI) * 10);
  }
  if (action === "kiss") {
    lh.set(-10, -55); rh.set(10, -55);
    drawHeart(x + h.x, y + h.y - 10 - heartY);
    heartY = (heartY + 4) % 100;
  }
  if (action === "cry") {
    lh.set(-15, -30); rh.set(15, -30);
    drawTear(x + h.x - 8, y + h.y + 5 + tearY);
    tearY = (tearY + 3) % 40;
  }

  push();
  translate(x, y);
  ellipse(h.x, h.y, 40, 38);
  fixedHandLine(0, 0, 0, -60);
  fixedHandLine(0, 0, lf.x, lf.y);
  fixedHandLine(0, 0, rf.x, rf.y);
  fixedHandLine(0, -50, lh.x, lh.y);
  fixedHandLine(0, -50, rh.x, rh.y);
  
  if (action === "pose" && !recording && !isPlayingBack) {
    fill(0, 100, 255, 60); noStroke();
    [h, lh, rh, lf, rf].forEach(j => ellipse(j.x, j.y, 25));
  }
  pop();
}

function handlePosing() {
  let m = createVector(mouseX - pos.x, mouseY - pos.y);
  let joints = [head, lHand, rHand, lFoot, rfFoot];
  if (!draggedJoint) {
    for (let j of joints) {
      if (dist(m.x, m.y, j.x, j.y) < 30) { draggedJoint = j; break; }
    }
  } else {
    if (draggedJoint === head) {
      let neckPos = createVector(0, -60);
      let dir = p5.Vector.sub(m, neckPos);
      dir.setMag(20); 
      head.set(p5.Vector.add(neckPos, dir));
    } else {
      let anchor = (draggedJoint === lHand || draggedJoint === rHand) ? createVector(0, -50) : createVector(0, 0);
      let dir = p5.Vector.sub(m, anchor);
      if (dir.mag() > 100) dir.setMag(100); 
      draggedJoint.set(p5.Vector.add(anchor, dir));
    }
  }
}

function startRecording() {
  if (typeof GIF === 'undefined') return;
  stopPlayback();
  recordedFrames = [];
  recording = true;
}

function prepareGif() {
  let gif = new GIF({
    workers: 2, quality: 10,
    workerScript: URL.createObjectURL(new Blob([
      'importScripts("https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.worker.js");'
    ], {type: 'application/javascript'}))
  });
  for (let f of recordedFrames) { gif.addFrame(f.canvas, {delay: 50, copy: true}); }
  gif.on('finished', function(blob) {
    isProcessing = false;
    downloadBtn = createButton('💾 DOWNLOAD GIF');
    downloadBtn.position(width/2 - 80, height/2 - 25);
    styleDownloadButton(downloadBtn);
    downloadBtn.mousePressed(() => {
      let url = URL.createObjectURL(blob);
      let link = document.createElement('a');
      link.href = url; link.download = 'multi_pose_stickman.gif'; link.click();
    });
  });
  gif.render();
}

function createActionButton(lbl, func) {
  let btn = createButton(lbl);
  btn.parent(toolbar);
  btn.style('padding', '8px'); btn.style('cursor', 'pointer');
  btn.mousePressed(func);
  return btn;
}

function styleRecButton(btn) {
  btn.parent(toolbar);
  btn.style('background', '#ff4757'); btn.style('color', '#fff');
  btn.style('padding', '8px 15px'); btn.style('border-radius', '5px');
  btn.style('font-weight', 'bold'); btn.style('cursor', 'pointer'); btn.style('border', 'none');
}

function styleDownloadButton(btn) {
  btn.style('background', '#2ecc71'); btn.style('color', 'white');
  btn.style('padding', '15px'); btn.style('border-radius', '10px');
  btn.style('cursor', 'pointer'); btn.style('border', 'none');
  btn.style('font-weight', 'bold');
}

function drawUIOverlay(msg) {
  fill(0, 150); rect(0, height-40, width, 40);
  fill(255); textAlign(CENTER); text(msg, width/2, height-15);
}

function drawLoadingAnimation() {
  push(); translate(width/2, height/2);
  fill(255, 240); noStroke(); rectMode(CENTER); rect(0, 0, 220, 80, 10);
  stroke(200); strokeWeight(2); noFill(); rect(0, 15, 150, 10, 5);
  let loadW = map(frameCount % 50, 0, 50, 0, 150);
  fill(46, 204, 113); noStroke(); rectMode(CORNER); rect(-75, 10, loadW, 10, 5);
  fill(60); textAlign(CENTER, CENTER); text("GENERATING GIF...", 0, -15);
  pop();
}

function fixedHandLine(x1, y1, x2, y2) {
  let segments = 4;
  beginShape();
  for (let i = 0; i <= segments; i++) {
    let nx = (x1 + x2 + i) * 0.5, ny = (y1 + y2 + i) * 0.5;
    let off = map(noise(nx, ny), 0, 1, -1.5, 1.5);
    vertex(lerp(x1, x2, i / segments) + off, lerp(y1, y2, i / segments) + off);
  }
  endShape();
}

function drawHeart(x, y) {
  push(); translate(x, y); fill(255, 100, 100); noStroke();
  beginShape(); vertex(0, 0); bezierVertex(-10, -10, -20, 5, 0, 15); bezierVertex(20, 5, 10, -10, 0, 0); endShape(); pop();
}

function drawTear(x, y) {
  push(); noStroke(); fill(100, 180, 255); ellipse(x, y, 6, 8); triangle(x - 3, y, x + 3, y, x, y - 6); pop();
}


