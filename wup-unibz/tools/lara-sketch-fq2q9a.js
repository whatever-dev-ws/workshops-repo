// WUP 25-26
// Lara Spitaler
let currentColor;
let brushSize = 10;
let brushMode = 'nebula'; 
let colorPicker;
let sizeSlider;


function setup() {
  createCanvas(windowWidth, windowHeight);
  background(255);
  
  let uiY = height - 60;


  colorPicker = createColorPicker('#ed225d');
  colorPicker.position(20, uiY);


  sizeSlider = createSlider(5, 200, 50); 
  sizeSlider.position(120, uiY);


  createModeButton("Nebula", 'nebula', 280, uiY);
  createModeButton("Spikes", 'spikes', 345, uiY);
  createModeButton("Tendrils", 'tendrils', 410, uiY);
  createModeButton("Supernova", 'supernova', 485, uiY);
  
  let clearBtn = createButton("Reset Canvas");
  clearBtn.position(580, uiY);
  clearBtn.mousePressed(() => background(255));
}


function draw() {
  currentColor = colorPicker.color();
  brushSize = sizeSlider.value();


  if (mouseIsPressed && mouseY < height - 80) {
    push(); 
    translate(mouseX, mouseY);
    
    // The "Pulse" variable makes things zoom in/out over time
    // sin() oscillates between -1 and 1
    let pulse = sin(frameCount * 0.1); 
    let zoom = map(pulse, -1, 1, 0.5, 1.5); 


    if (brushMode === 'nebula') {
      drawAnimatedNebula(zoom);
    } else if (brushMode === 'spikes') {
      drawAnimatedSpikes(zoom);
    } else if (brushMode === 'tendrils') {
      drawAnimatedTendrils();
    } else if (brushMode === 'supernova') {
      drawAnimatedSupernova(zoom);
    }
    pop();
  }
  
  drawInterfacePanel();
}


// --- ANIMATED BRUSH LOGIC ---


function drawAnimatedNebula(z) {
  noStroke();
  // Scale the entire coordinate system for the zoom effect
  scale(z); 
  for (let i = 0; i < 5; i++) {
    let alpha = map(i, 0, 5, 40, 5);
    let c = color(red(currentColor), green(currentColor), blue(currentColor), alpha);
    fill(c);
    // Subtle internal movement
    let move = sin(frameCount * 0.05 + i) * 10;
    ellipse(move, -move, brushSize + (i * 15));
  }
}


function drawAnimatedSpikes(z) {
  stroke(currentColor);
  strokeWeight(2);
  noFill();
  // Double rotation: one for the brush, one for the canvas frame
  rotate(frameCount * 0.1);
  for (let i = 0; i < 8; i++) {
    rotate(PI / 4);
    // Length of spikes reacts to the zoom/pulse
    let len = brushSize * z;
    line(0, 0, len, len);
    rect(-2, -2, 4, 4);
  }
}


function drawAnimatedTendrils() {
  stroke(currentColor);
  strokeWeight(random(1, brushSize/10)); // Jittery thickness
  noFill();
  beginShape();
  for (let i = 0; i < 6; i++) {
    // High frequency jitter using random offset by frameCount
    let x = random(-brushSize, brushSize) + sin(frameCount) * 5;
    let y = random(-brushSize, brushSize) + cos(frameCount) * 5;
    curveVertex(x, y);
  }
  endShape();
}


function drawAnimatedSupernova(z) {
  noStroke();
  // Particles rotate and move outward based on zoom
  rotate(frameCount * 0.05);
  for (let i = 0; i < 10; i++) {
    fill(currentColor);
    let angle = TWO_PI / 10 * i;
    let dist = (brushSize * 0.6) * z + random(5);
    let px = cos(angle) * dist;
    let py = sin(angle) * dist;
    ellipse(px, py, random(2, 5));
  }
}


// --- UI & HELPERS ---


function createModeButton(label, mode, x, y) {
  let btn = createButton(label);
  btn.position(x, y);
  btn.mousePressed(() => brushMode = mode);
}


function drawInterfacePanel() {
  noStroke();
  fill(240);
  rectMode(CORNER);
  rect(0, height - 80, width, 80);
  fill(50);
  textSize(11);
  textAlign(LEFT);
  text("COLOR           SIZE / INTENSITY                    ANIMATED BRUSHES", 20, height - 65);
  textAlign(RIGHT);
  text("Press 'S' to Save Artwork.png", width - 20, height - 35);
}


function keyPressed() {
  if (key === 's' || key === 'S') {
    saveCanvas('Artwork', 'png');
  }
}


function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  background(255);
}