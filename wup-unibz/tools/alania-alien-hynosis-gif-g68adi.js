let infoBox;
let statusBox;
let startOverlay; // Neuer Text für den Start
let isRecording = false;
let hasStarted = false; // Check, ob der User schon geklickt hat

// Variables to freeze the look during recording
let lockedSpikes;
let lockedDistort;

// Loop length (5 seconds at 60fps)
let totalLoopFrames = 300; 

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1); 
  
  colorMode(HSB, 360, 100, 100, 100);
  noFill();
  
  // --- 1. Info Box (Instructions) ---
  infoBox = createDiv(`
    <div style="font-family: Arial; font-size: 14px; color: white; background: rgba(0,0,0,0.6); padding: 12px; border-radius: 8px; line-height: 1.6;">
      <b>CONTROLS:</b><br>
      1. Click canvas to focus<br>
      2. Move Mouse: Distort • Hold Click: Intensity<br>
      <b>3. Press 'S' to save GIF (Seamless Loop)</b>
    </div>
  `);
  infoBox.position(20, height - 110);
  
  // --- 2. Start Overlay (CLICK TO START) ---
  startOverlay = createDiv(`
    <div style="text-align:center; color: white; font-family: Arial; text-shadow: 0px 0px 10px black;">
      <h1 style="margin:0; font-size: 40px;">CLICK TO START</h1>
      <p>Activate Sound & Focus</p>
    </div>
  `);
  // Center the start text
  startOverlay.position(width/2 - 150, height/2 - 50);
  startOverlay.style('pointer-events', 'none'); // Allows clicking "through" the text onto the canvas

  // --- 3. Status Box (Saving...) ---
  statusBox = createDiv('');
  statusBox.style('font-family', 'Arial');
  statusBox.style('color', '#FFD700'); // Gold color
  statusBox.style('font-weight', 'bold');
  statusBox.style('font-size', '20px');
  statusBox.style('background', 'rgba(0,0,0,0.8)');
  statusBox.style('padding', '15px 30px');
  statusBox.style('border-radius', '8px');
  statusBox.style('text-align', 'center');
  statusBox.position(width/2 - 120, height/2 - 30);
  statusBox.hide();
}

function draw() {
  // If user hasn't clicked yet, show a subtle idling background
  if (!hasStarted) {
    background(0, 10);
    // Pulse effect for the start screen
    return; // Skip the rest of the drawing until clicked
  }

  // --- BACKGROUND LOGIC ---
  // If mouse is pressed (Intensity) AND not recording -> chaotic background
  if (mouseIsPressed && !isRecording) {
    background(random(360), 100, 100, 20);
    strokeWeight(3);
  } else {
    // Normal / Recording mode -> clean background
    background(0, 10);
    strokeWeight(1.5);
  }

  translate(width / 2, height / 2);

  // --- LOOP MATHEMATICS ---
  // Calculates progress from 0.0 to 1.0 every 300 frames
  let percent = (frameCount % totalLoopFrames) / totalLoopFrames;

  // --- INPUT LOGIC ---
  let spikes, distortion;

  if (isRecording) {
    // Use locked values during recording for perfect loop
    spikes = lockedSpikes;
    distortion = lockedDistort;
  } else {
    // Live mouse values
    spikes = int(map(mouseX, 0, width, 2, 20));
    distortion = map(mouseY, 0, height, 0, 150);
  }

  // --- DRAWING THE PATTERN ---
  for (let r = 0; r < width; r += 20) {
    // Color: percent * 360 ensures exactly one full hue cycle per loop
    let hueVal = (r * 2 + percent * 360) % 360;
    
    if (mouseIsPressed && !isRecording) stroke(0, 0, 100);
    else stroke(hueVal, 80, 100);

    beginShape();
    for (let a = 0; a < TWO_PI; a += 0.05) {
      // Wave animation driven by 'percent'
      let wavePhase = percent * TWO_PI; 
      let offset = sin(a * spikes + wavePhase) * distortion;
      let currentRadius = r + offset;
      
      // Jitter only if NOT recording
      if (mouseIsPressed && !isRecording) currentRadius += random(-10, 10);

      let x = currentRadius * cos(a);
      let y = currentRadius * sin(a);
      
      // Rotation driven by 'percent'
      let loopRotation = percent * TWO_PI; 
      let twist = r * 0.005; 
      let rotAngle = loopRotation - twist; 

      let xRot = x * cos(rotAngle) - y * sin(rotAngle);
      let yRot = x * sin(rotAngle) + y * cos(rotAngle);

      vertex(xRot, yRot);
    }
    endShape(CLOSE);
  }
}

// Logic to handle the first click
function mousePressed() {
  if (!hasStarted) {
    hasStarted = true;
    startOverlay.hide(); // Hide the "CLICK TO START" text
  }
}

function keyPressed() {
  // Only allow saving if user has started (clicked) and is not already recording
  if ((key === 's' || key === 'S') && !isRecording && hasStarted) {
      
    // 1. Set status
    isRecording = true;
    
    // 2. Lock values (freeze the visual parameters)
    lockedSpikes = int(map(mouseX, 0, width, 2, 20));
    lockedDistort = map(mouseY, 0, height, 0, 150);

    // 3. Update UI
    infoBox.hide();
    statusBox.html('💾 RENDERING GIF...<br><span style="font-size:14px; color:#ddd; font-weight:normal">Please wait ~5s</span>');
    statusBox.show();
    
    console.log("Start Recording...");

    // 4. Start Recording
    saveGif('hypnosis_loop.gif', totalLoopFrames, {
        units: 'frames',
        delay: 0
    });

    // 5. Reset UI after enough time (Recording time + Encoding buffer)
    setTimeout(() => {
      isRecording = false;
      statusBox.hide();
      infoBox.show();
    }, 6500); 
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  background(0);
  infoBox.position(20, height - 110);
  startOverlay.position(width/2 - 150, height/2 - 50);
  statusBox.position(width/2 - 120, height/2 - 30);
}