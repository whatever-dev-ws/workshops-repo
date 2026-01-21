// WUP 25-26
// Francesco Lewis
let font;
let points = [];
let bounds;
let fontSize = 150;
let msg = "knödeln?";

// UI Elements
let sliderVelocity, sliderAmplitude, sliderRaster;
let mouseFollowToggle, rasterToggle;
let colorPicker1, colorPicker2;
let savePngBtn, gifBtn;
let fontSelect, textInput, fileInput; 
let gui, toggleBtn; 
let isMouseOverGUI = false;
let guiVisible = true; 

function preload() {
  // Default font
  font = loadFont('https://cdnjs.cloudflare.com/ajax/libs/topcoat/0.8.0/font/SourceCodePro-Bold.otf');
}

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  frameRate(30); 

  // --- UI Setup ---
  toggleBtn = createButton('⚙️ Close Settings');
  toggleBtn.position(20, 20);
  toggleBtn.style('z-index', '110').style('padding', '8px 12px').style('cursor', 'pointer');
  toggleBtn.mousePressed(toggleGUI);

  gui = createDiv();
  gui.style('position','absolute').style('top','60px').style('left','20px')
     .style('color','white').style('background','rgba(0,0,0,0.8)')
     .style('padding','15px').style('border-radius','8px').style('font-family','sans-serif')
     .style('z-index', '100').style('width', '220px');

  gui.mouseOver(() => { isMouseOverGUI = true; });
  gui.mouseOut(() => { isMouseOverGUI = false; });
  
  // Text Input
  createP('1. Edit Text:').parent(gui).style('margin-top','0').style('font-weight','bold');
  textInput = createInput(msg).parent(gui);
  textInput.input(updateMessage);
  textInput.style('width', '100%').style('margin-bottom', '10px');

  // Font Upload
  createP('2. Load Your Font (.ttf, .otf):').parent(gui).style('font-weight','bold');
  fileInput = createFileInput(handleFile).parent(gui);
  fileInput.style('width', '100%').style('margin-bottom', '10px').style('font-size', '12px');

  // Preset Fonts
  createP('Or Select Preset:').parent(gui);
  fontSelect = createSelect().parent(gui);
  fontSelect.option('Source Code (Mono)', 'https://cdnjs.cloudflare.com/ajax/libs/topcoat/0.8.0/font/SourceCodePro-Bold.otf');
  fontSelect.option('Akkurat Office (Bold)', 'AkkuratOffice-Bold.otf');
  fontSelect.option('Anthony', 'Anthony.otf');
  fontSelect.option('Director-Regular', 'Director-Regular.otf');
  fontSelect.changed(updateFont);
  fontSelect.style('width', '100%');

  // Sliders
  createP('Wave Velocity').parent(gui).style('margin', '5px 0');
  sliderVelocity = createSlider(0, 0.1, 0.05, 0.001).parent(gui).style('width', '100%');
  
  createP('Amplitude').parent(gui).style('margin', '5px 0');
  sliderAmplitude = createSlider(0, 100, 50).parent(gui).style('width', '100%');
  
  createP('Raster Density').parent(gui).style('margin', '5px 0');
  sliderRaster = createSlider(0.05, 0.5, 0.2, 0.01).parent(gui).style('width', '100%');
  sliderRaster.input(computePoints); 

  // Colors
  createP('Gradient Colors').parent(gui).style('margin', '10px 0 5px 0');
  let colorRow = createDiv().parent(gui).style('display', 'flex').style('gap', '10px');
  colorPicker1 = createColorPicker('#00f2ff').parent(colorRow);
  colorPicker2 = createColorPicker('#ff00ea').parent(colorRow);
  
  // Toggles
  createP('').parent(gui);
  mouseFollowToggle = createCheckbox('Follow Mouse', false).parent(gui);
  rasterToggle = createCheckbox('Raster Mode', true).parent(gui);
  
  // Action Buttons
  createP('').parent(gui);
  savePngBtn = createButton('📸 Save PNG');
  savePngBtn.parent(gui).style('width', '100%').style('margin-bottom', '10px').style('cursor', 'pointer');
  savePngBtn.mousePressed(saveImage);

  gifBtn = createButton('🔴 Record GIF (5s)');
  gifBtn.parent(gui).style('width', '100%').style('background-color', '#ff4444').style('color', 'white').style('border', 'none').style('padding', '5px').style('cursor', 'pointer');
  gifBtn.mousePressed(recordGIF);

  computePoints();
}

function computePoints() {
  points = font.textToPoints(msg, 0, 0, fontSize, {
    sampleFactor: sliderRaster.value(),
    simplifyThreshold: 0
  });
  bounds = font.textBounds(msg, 0, 0, fontSize);
}

function handleFile(file) {
  if (file.type === 'font' || file.name.endsWith('.ttf') || file.name.endsWith('.otf')) {
    toggleBtn.html('⏳ Processing Font...');
    loadFont(file.data, (newFont) => {
      font = newFont;
      computePoints();
      toggleBtn.html(guiVisible ? '⚙️ Close Settings' : '⚙️ Open Settings');
    });
  } else {
    alert("Please upload a valid font file (.ttf or .otf)");
  }
}

function draw() {
  background(20);
  orbitControl(); 
  
  let Velocity = sliderVelocity.value();
  let amplitude = sliderAmplitude.value();
  let tempo = frameCount * Velocity;

  // Center the text
  translate(-bounds.w / 2, bounds.h / 2);

  // Mouse Follow Logic
  if (mouseFollowToggle.checked()) {
    let targetX = map(mouseX, 0, width, -200, 200);
    let targetY = map(mouseY, 0, height, -200, 200);
    translate(targetX, targetY);
  }

  // Draw Points
  for (let i = 0; i < points.length; i++) {
    let p = points[i];
    push();
    
    let waveOffset = rasterToggle.checked() ? i * 0.1 : 0;
    let xWav = sin(tempo + waveOffset) * amplitude;
    let yWav = cos(tempo + waveOffset) * amplitude;
    let zWav = sin(tempo * 0.5 + waveOffset) * (amplitude * 2);

    translate(p.x + xWav, p.y + yWav, zWav);
    
    let colorInt = map(p.x, 0, bounds.w, 0, 1);
    let c = lerpColor(colorPicker1.color(), colorPicker2.color(), colorInt);
    fill(c);
    noStroke();
    
    if (rasterToggle.checked()) {
      box(5);
    } else {
      sphere(3);
    }
    pop();
  }
}

function saveImage() {
  saveCanvas('wave_design', 'png');
}

function toggleGUI() {
  guiVisible = !guiVisible;
  if (guiVisible) { 
    gui.show(); 
    toggleBtn.html('⚙️ Close Settings'); 
  } else { 
    gui.hide(); 
    toggleBtn.html('⚙️ Open Settings'); 
    isMouseOverGUI = false; 
  }
}

function updateMessage() {
  msg = this.value();
  computePoints();
}

function updateFont() {
  toggleBtn.html('⏳ Loading Preset...');
  loadFont(fontSelect.value(), (newFont) => {
    font = newFont;
    computePoints();
    toggleBtn.html(guiVisible ? '⚙️ Close Settings' : '⚙️ Open Settings');
  });
}

function recordGIF() {
  gifBtn.html('⏹ Recording...');
  gifBtn.style('background-color', '#555');
  saveGif('wave_animation', 5);
  setTimeout(() => {
    gifBtn.html('🔴 Record GIF (5s)');
    gifBtn.style('background-color', '#ff4444');
  }, 5000);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}