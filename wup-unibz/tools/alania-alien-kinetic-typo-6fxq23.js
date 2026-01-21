/*
  KINETIC TYPOGRAPHY TOOL - LOCAL INTERACTION VERSION
  Features:
  - Fullscreen Responsive Canvas
  - Sidebar UI (White on Black)
  - Neon, Pulse, Distortion
  - Export PNG & GIF
  - Adjustable Pulse Speed
  - FIXED: Local Mouse Interaction Radius (Bubble Effect)
*/

let font;
let points = [];
let bounds;

// UI Variables
let sidebarWidth = 300;
let textInput;
let sliderSize, sliderDistortion, sliderSpeed, sliderGlow, sliderPulseAmt, sliderPulseSpeed, sliderMouseRadius;
let btnSaveImage, btnSaveGif;
let colorPicker;

function preload() {
  font = loadFont('https://cdnjs.cloudflare.com/ajax/libs/topcoat/0.8.0/font/SourceCodePro-Bold.otf');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  
  // --- CSS STYLING FOR SIDEBAR ---
  let sidebar = createDiv();
  sidebar.position(0, 0);
  sidebar.size(sidebarWidth, windowHeight);
  sidebar.style('background-color', '#ffffff');
  sidebar.style('color', '#000000');
  sidebar.style('padding', '20px');
  sidebar.style('font-family', 'sans-serif');
  sidebar.style('box-sizing', 'border-box');
  sidebar.style('overflow-y', 'auto');
  sidebar.style('box-shadow', '2px 0 10px rgba(0,0,0,0.1)');

  function createControl(label, element) {
    let container = createDiv();
    container.parent(sidebar);
    container.style('margin-bottom', '15px');
    
    let lab = createP(label);
    lab.parent(container);
    lab.style('margin', '0 0 5px 0');
    lab.style('font-weight', 'bold');
    lab.style('font-size', '12px');
    
    element.parent(container);
    element.style('width', '100%');
  }

  // --- CREATE UI ELEMENTS ---

  let title = createElement('h2', 'KINETIC TOOL');
  title.parent(sidebar);
  title.style('margin-top', '0');
  title.style('border-bottom', '2px solid black');
  title.style('padding-bottom', '10px');

  // 1. Text Input
  textInput = createInput('DESIGN');
  createControl('TEXT CONTENT', textInput);
  textInput.input(updatePoints); 

  // 2. Base Sliders
  sliderSize = createSlider(2, 20, 6, 0.5); 
  createControl('BASE PARTICLE SIZE', sliderSize);

  sliderDistortion = createSlider(0, 200, 40, 1);
  createControl('WAVE DISTORTION AMOUNT', sliderDistortion);
  
  sliderSpeed = createSlider(0, 0.2, 0.05, 0.01);
  createControl('MOVEMENT SPEED', sliderSpeed);

  // 3. Pulse / 3D Effect
  sliderPulseAmt = createSlider(0, 15, 5, 0.5); 
  createControl('PULSE AMPLITUDE', sliderPulseAmt);

  sliderPulseSpeed = createSlider(0, 0.5, 0.05, 0.01); 
  createControl('PULSE SPEED', sliderPulseSpeed);

  // 4. Interaction Slider (FIXED)
  // Range 0 to 600: 0 = off, 600 = large local bubble
  sliderMouseRadius = createSlider(0, 600, 150, 10); 
  createControl('MOUSE INTERACTION RADIUS', sliderMouseRadius);

  // 5. Visuals
  sliderGlow = createSlider(0, 50, 15, 1);
  createControl('NEON GLOW STRENGTH', sliderGlow);

  colorPicker = createColorPicker('#00f2ff'); 
  createControl('COLOR', colorPicker);
  colorPicker.style('height', '40px');
  colorPicker.style('width', '100%');
  colorPicker.style('border', 'none');

  // 6. Buttons
  btnSaveImage = createButton('SAVE IMAGE (.PNG)');
  btnSaveImage.parent(sidebar);
  btnSaveImage.style('width', '100%');
  btnSaveImage.style('padding', '12px');
  btnSaveImage.style('margin-top', '20px');
  btnSaveImage.style('background', '#222');
  btnSaveImage.style('color', '#fff');
  btnSaveImage.style('border', 'none');
  btnSaveImage.style('font-weight', 'bold');
  btnSaveImage.style('cursor', 'pointer');
  btnSaveImage.mouseOver(() => btnSaveImage.style('background', '#444'));
  btnSaveImage.mouseOut(() => btnSaveImage.style('background', '#222'));
  btnSaveImage.mousePressed(exportImage);

  btnSaveGif = createButton('SAVE ANIMATION (.GIF)');
  btnSaveGif.parent(sidebar);
  btnSaveGif.style('width', '100%');
  btnSaveGif.style('padding', '12px');
  btnSaveGif.style('margin-top', '10px');
  btnSaveGif.style('background', '#222');
  btnSaveGif.style('color', '#fff');
  btnSaveGif.style('border', 'none');
  btnSaveGif.style('font-weight', 'bold');
  btnSaveGif.style('cursor', 'pointer');
  btnSaveGif.mouseOver(() => btnSaveGif.style('background', '#444'));
  btnSaveGif.mouseOut(() => btnSaveGif.style('background', '#222'));
  btnSaveGif.mousePressed(exportGif);

  updatePoints();
}

function draw() {
  background(10, 10, 15); // Dark background
  
  let baseSize = sliderSize.value();
  let distAmt = sliderDistortion.value();
  let moveSpeed = sliderSpeed.value(); 
  let pulseAmt = sliderPulseAmt.value(); 
  let pulseSpeed = sliderPulseSpeed.value(); 
  let mouseRadius = sliderMouseRadius.value(); // Gets the radius (0-600)
  let glowAmount = sliderGlow.value();
  let mainColor = colorPicker.color();

  fill(mainColor);
  noStroke();
  
  if (glowAmount > 0) {
    drawingContext.shadowBlur = glowAmount;
    drawingContext.shadowColor = mainColor;
  } else {
    drawingContext.shadowBlur = 0;
  }

  // Centering Calculation
  let centerX = sidebarWidth + (width - sidebarWidth) / 2;
  let centerY = height / 2;
  let transX = 0;
  let transY = 0;

  if (bounds) {
    transX = centerX - bounds.w / 2 - bounds.x;
    transY = centerY - bounds.h / 2 - bounds.y;
    translate(transX, transY);
  }

  for (let i = 0; i < points.length; i++) {
    let p = points[i];
    
    // Wave Math
    let waveVal = sin(frameCount * moveSpeed + p.y * 0.05 + p.x * 0.01);
    let waveX = waveVal * (distAmt * 0.5);
    let waveY = cos(frameCount * moveSpeed + p.x * 0.05) * distAmt;

    // Pulse Math
    let pulseWave = sin(frameCount * pulseSpeed + p.y * 0.05 + p.x * 0.01);
    let sizeChange = pulseWave * pulseAmt;
    let finalSize = baseSize + sizeChange;
    if (finalSize < 0) finalSize = 0;

    // Mouse Interaction
    let mouseRelX = mouseX - transX;
    let mouseRelY = mouseY - transY;
    
    let d = dist(mouseRelX, mouseRelY, p.x, p.y);
    let repulsionX = 0;
    let repulsionY = 0;
    
    // Check if point is inside the radius bubble
    if (d < mouseRadius) {
      let force = map(d, 0, mouseRadius, 1, 0);
      
      // We use a stronger multiplier (*5) to make the push visible
      // but it is strictly limited to the radius circle.
      repulsionX = (p.x - mouseRelX) * force * 5; 
      repulsionY = (p.y - mouseRelY) * force * 5;
    }

    ellipse(p.x + waveX + repulsionX, p.y + waveY + repulsionY, finalSize, finalSize);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  let sidebar = select('div'); 
  if(sidebar) sidebar.size(sidebarWidth, windowHeight);
}

function updatePoints() {
  let txt = textInput.value();
  let fontSize = 150;
  if(txt.length > 5) fontSize = 120;
  if(txt.length > 8) fontSize = 90;
  if(txt.length > 12) fontSize = 60;

  points = font.textToPoints(txt, 0, 0, fontSize, {
    sampleFactor: 0.15, 
    simplifyThreshold: 0
  });
  bounds = font.textBounds(txt, 0, 0, fontSize);
}

function exportImage() {
  saveCanvas('KineticType_Img', 'png');
}

function exportGif() {
  console.log("Recording GIF...");
  saveGif('KineticType_Anim', 3); 
}