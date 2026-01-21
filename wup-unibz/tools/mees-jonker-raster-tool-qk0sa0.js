//WUP 2025-2026
//Mees Jonker
let img;
let isLoaded = false;
let densitySlider, wiggleSlider, sizeSlider, speedSlider, contrastSlider;

// Web Audio variables (FM Synthesis for "Funny/Pleasant" sound)
let audioCtx, carrier, modulator, modGain, gainNode, filter, delayNode, feedback;
let audioStarted = false;
let clickImpulse = 0;

// Recording variables
let mediaRecorder;
let recordedChunks = [];
let isRecording = false;

// Sound types cycle
let waveTypes = ['sine', 'triangle', 'square', 'sawtooth'];
let waveIndex = 0;

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  
  // Interface Menu
  let menu = createDiv('');
  menu.style('position', 'fixed');
  menu.style('top', '20px');
  menu.style('left', '20px');
  menu.style('width', '220px');
  menu.style('padding', '15px');
  menu.style('background', 'rgba(0, 0, 0, 0.8)');
  menu.style('color', '#fff');
  menu.style('font-family', 'sans-serif');
  menu.style('border-radius', '8px');
  menu.style('z-index', '100');

  function addControl(label, min, max, val, step) {
    let container = createDiv(label);
    container.parent(menu);
    container.style('margin-bottom', '10px');
    let s = createSlider(min, max, val, step);
    s.style('width', '100%');
    s.parent(container);
    return s;
  }

  let fileInput = createFileInput(handleFile);
  fileInput.parent(menu);
  fileInput.style('margin-bottom', '15px');

  densitySlider = addControl('Density', 10, 150, 60, 1);
  sizeSlider = addControl('Shape Size', 0.2, 3.0, 1.2, 0.1);
  contrastSlider = addControl('Contrast', 100, 600, 255, 1);
  speedSlider = addControl('Motion Speed', 0.01, 0.2, 0.05, 0.01);
  wiggleSlider = addControl('Wiggle', 0, 200, 50, 1);

  let playBtn = createButton('START AUDIO');
  playBtn.parent(menu);
  playBtn.style('width', '100%');
  playBtn.style('margin-top', '10px');
  playBtn.mousePressed(initAudio);

  // GIF Button Added Back
  let gifBtn = createButton('SAVE GIF (No Sound)');
  gifBtn.parent(menu);
  gifBtn.style('width', '100%');
  gifBtn.style('margin-top', '10px');
  gifBtn.mousePressed(() => saveGif('raster_visual.gif', 3));

  let videoBtn = createButton('RECORD VIDEO (With Sound)');
  videoBtn.parent(menu);
  videoBtn.style('width', '100%');
  videoBtn.style('margin-top', '10px');
  videoBtn.style('background-color', '#ff4757');
  videoBtn.style('color', 'white');
  videoBtn.mousePressed(startVideoRecording);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  if (img && isLoaded) img.resize(windowWidth, windowHeight);
}

function handleFile(file) {
  if (file.type === 'image') {
    loadImage(file.data, (loadedImg) => {
      img = loadedImg;
      img.resize(windowWidth, windowHeight);
      isLoaded = true;
    });
  }
}

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    carrier = audioCtx.createOscillator();
    modulator = audioCtx.createOscillator();
    modGain = audioCtx.createGain();
    gainNode = audioCtx.createGain();
    filter = audioCtx.createBiquadFilter();
    
    // Pleasant Delay
    delayNode = audioCtx.createDelay();
    delayNode.delayTime.value = 0.3;
    feedback = audioCtx.createGain();
    feedback.gain.value = 0.4;

    modulator.connect(modGain);
    modGain.connect(carrier.frequency);
    carrier.connect(filter);
    
    filter.connect(delayNode);
    delayNode.connect(feedback);
    feedback.connect(delayNode);
    delayNode.connect(gainNode);
    
    filter.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    carrier.start();
    modulator.start();
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    audioStarted = true;
  }
  
  let target = gainNode.gain.value === 0 ? 0.2 : 0;
  gainNode.gain.setTargetAtTime(target, audioCtx.currentTime, 0.1);
}

function startVideoRecording() {
  if (!audioStarted) return alert("Start Audio first!");
  recordedChunks = [];
  const canvasStream = document.querySelector('canvas').captureStream(30);
  const dest = audioCtx.createMediaStreamDestination();
  gainNode.disconnect();
  gainNode.connect(dest);
  gainNode.connect(audioCtx.destination);
  canvasStream.addTrack(dest.stream.getAudioTracks()[0]);
  
  mediaRecorder = new MediaRecorder(canvasStream, { mimeType: 'video/webm' });
  mediaRecorder.ondataavailable = (e) => recordedChunks.push(e.data);
  mediaRecorder.onstop = () => {
    let blob = new Blob(recordedChunks, { type: 'video/webm' });
    let a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'performance.webm';
    a.click();
    isRecording = false;
  };
  mediaRecorder.start();
  isRecording = true;
  setTimeout(() => mediaRecorder.stop(), 5000);
}

function mousePressed() {
  // Ignore clicks on the menu area
  if (mouseX < 250) return;
  
  if (audioStarted) {
    waveIndex = (waveIndex + 1) % waveTypes.length;
    carrier.type = waveTypes[waveIndex];
    clickImpulse = 250; 
  }
}

function draw() {
  background(10);
  if (!isLoaded) {
    fill(255); textAlign(CENTER);
    text("UPLOAD AN IMAGE TO START", 0, 0);
    return;
  }

  let time = frameCount * speedSlider.value();
  let density = densitySlider.value();
  clickImpulse *= 0.94;

  if (audioStarted) {
    let baseFreq = map(mouseX, 0, width, 100, 800);
    carrier.frequency.setTargetAtTime(baseFreq, audioCtx.currentTime, 0.1);
    modulator.frequency.setValueAtTime(baseFreq * 2.1, audioCtx.currentTime);
    let modIntensity = map(mouseY, height, 0, 0, 500);
    modGain.gain.setTargetAtTime(modIntensity + clickImpulse, audioCtx.currentTime, 0.05);
    filter.frequency.setTargetAtTime(map(mouseY, height, 0, 200, 4000), audioCtx.currentTime, 0.1);
  }

  translate(-width / 2, -height / 2);
  let w = width / density, h = height / density;
  noStroke();
  tint(contrastSlider.value(), 255);
  texture(img);
  textureMode(NORMAL);

  for (let x = 0; x < width; x += w) {
    for (let y = 0; y < height; y += h) {
      let cx = x + w/2;
      let cy = y + h/2;
      let d = dist(cx, cy, mouseX, mouseY);
      let angle = atan2(cy - mouseY, cx - mouseX);
      
      let bounce = sin(time * 2) * 2; 
      let pulse = (sin(d * 0.05 - time) * wiggleSlider.value()) + (clickImpulse * (150 / (d + 20))) + bounce;
      let r = (w / 2) * sizeSlider.value();

      push();
      translate(cx + cos(angle) * pulse, cy + sin(angle) * pulse);
      beginShape();
      for (let a = 0; a < TAU; a += PI/8) {
        let vx = cos(a) * r, vy = sin(a) * r;
        vertex(vx, vy, map(cx + vx, 0, width, 0, 1), map(cy + vy, 0, height, 0, 1));
      }
      endShape(CLOSE);
      pop();
    }
  }

  if (isRecording) {
    resetMatrix();
    fill(255, 0, 0);
    ellipse(windowWidth/2 - 40, -windowHeight/2 + 40, 20, 20);
  }
}