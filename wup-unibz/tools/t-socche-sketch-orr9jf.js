// WUP 25-26 // Tobia Socche // Final Clean Version
let font = null;
let points = [];
let bounds;
let fontSize = 150;
let msg = "knödeln?";

// UI Variables
let sliderVelocity, sliderAmplitude, sliderRaster;
let mouseFollowToggle, rasterToggle;
let colorPicker1, colorPicker2;
let textInput, fileInput;
let saveBtn, gifBtn, gifTimeInput; 
let gui, toggleBtn; 
let isMouseOverGUI = false;
let guiVisible = true; 
let isRecording = false; 

function preload() {
  // 1. Load the Default Font immediately
  font = loadFont('https://cdnjs.cloudflare.com/ajax/libs/topcoat/0.8.0/font/SourceCodePro-Bold.otf');
}

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  
  // --- UI SETUP (Pure JS Styles) ---
  
  // 1. Toggle Button
  toggleBtn = createButton('⚙️ Settings');
  toggleBtn.position(20, 20);
  toggleBtn.style('z-index', '1000');
  toggleBtn.style('padding', '8px 12px');
  toggleBtn.style('background', '#222');
  toggleBtn.style('color', '#fff');
  toggleBtn.style('border', '1px solid #444');
  toggleBtn.style('cursor', 'pointer');
  toggleBtn.style('font-family', 'sans-serif');
  toggleBtn.mousePressed(toggleGUI);

  // 2. Main GUI Panel
  gui = createDiv();
  gui.position(20, 60);
  gui.style('width', '220px');
  gui.style('background', 'rgba(10, 10, 10, 0.9)'); 
  gui.style('padding', '15px');
  gui.style('border-radius', '8px');
  gui.style('border', '1px solid #333');
  gui.style('font-family', 'sans-serif');
  gui.style('color', 'white');
  gui.style('z-index', '999');
  gui.style('display', 'flex');
  gui.style('flex-direction', 'column');
  
  gui.mouseOver(() => isMouseOverGUI = true);
  gui.mouseOut(() => isMouseOverGUI = false);
  
  function addLabel(txt) {
    let lab = createDiv(txt);
    lab.parent(gui);
    lab.style('font-size', '11px');
    lab.style('color', '#aaa');
    lab.style('margin-top', '10px');
    lab.style('margin-bottom', '4px');
    lab.style('font-weight', 'bold');
    return lab;
  }

  // --- CONTROLS ---

  // Text
  addLabel('1. TEXT INPUT');
  textInput = createInput(msg);
  textInput.parent(gui);
  textInput.input(updateMessage);
  textInput.style('width', '95%');
  textInput.style('background', '#333');
  textInput.style('color', '#fff');
  textInput.style('border', '1px solid #555');
  textInput.style('padding', '4px');

  // Font Upload
  addLabel('2. UPLOAD FONT (.otf / .ttf)');
  fileInput = createFileInput(handleFile);
  fileInput.parent(gui);
  fileInput.style('font-size', '10px');
  fileInput.style('color', '#ccc');
  fileInput.style('margin-bottom', '5px');

  // Animation
  addLabel('3. ANIMATION');
  
  createDiv('Velocity').parent(gui).style('font-size','10px').style('color','#666');
  sliderVelocity = createSlider(0, 0.1, 0.05, 0.001);
  sliderVelocity.parent(gui);
  sliderVelocity.style('width', '100%');

  createDiv('Amplitude').parent(gui).style('font-size','10px').style('color','#666').style('margin-top','4px');
  sliderAmplitude = createSlider(0, 100, 50);
  sliderAmplitude.parent(gui);
  sliderAmplitude.style('width', '100%');
  
  createDiv('Density').parent(gui).style('font-size','10px').style('color','#666').style('margin-top','4px');
  sliderRaster = createSlider(0.05, 0.5, 0.2, 0.01);
  sliderRaster.parent(gui);
  sliderRaster.style('width', '100%');
  sliderRaster.input(computePoints);

  // Colors
  addLabel('4. COLORS');
  let colorBox = createDiv();
  colorBox.parent(gui);
  colorBox.style('display', 'flex');
  colorBox.style('gap', '10px');
  
  colorPicker1 = createColorPicker('#00f2ff');
  colorPicker1.parent(colorBox);
  colorPicker1.style('border', 'none');
  colorPicker1.style('height', '25px');
  colorPicker1.style('flex', '1');
  
  colorPicker2 = createColorPicker('#ff00ea');
  colorPicker2.parent(colorBox);
  colorPicker2.style('border', 'none');
  colorPicker2.style('height', '25px');
  colorPicker2.style('flex', '1');

  // Toggles
  let toggleBox = createDiv();
  toggleBox.parent(gui);
  toggleBox.style('display', 'flex');
  toggleBox.style('flex-direction', 'column');
  toggleBox.style('margin-top', '10px');
  toggleBox.style('gap', '5px');
  
  mouseFollowToggle = createCheckbox(' Follow Mouse', false);
  mouseFollowToggle.parent(toggleBox);
  mouseFollowToggle.style('color', '#ccc');
  mouseFollowToggle.style('font-size', '11px');
  
  rasterToggle = createCheckbox(' Raster Wave', true);
  rasterToggle.parent(toggleBox);
  rasterToggle.style('color', '#ccc');
  rasterToggle.style('font-size', '11px');

  // Export
  addLabel('5. EXPORT');
  saveBtn = createButton('📸 Save PNG');
  saveBtn.parent(gui);
  saveBtn.style('background', '#444');
  saveBtn.style('color', '#fff');
  saveBtn.style('border', '1px solid #666');
  saveBtn.style('padding', '6px');
  saveBtn.style('cursor', 'pointer');
  saveBtn.style('margin-bottom', '8px');
  saveBtn.mousePressed(() => saveCanvas('kinetic_text', 'png'));

  // GIF Area
  let gifBox = createDiv();
  gifBox.parent(gui);
  gifBox.style('display', 'flex');
  gifBox.style('gap', '5px');
  gifBox.style('align-items', 'center');

  let gifTxt = createDiv('Secs:');
  gifTxt.parent(gifBox);
  gifTxt.style('font-size', '11px');
  gifTxt.style('color', '#aaa');

  gifTimeInput = createInput('3', 'number');
  gifTimeInput.parent(gifBox);
  gifTimeInput.style('width', '30px');
  gifTimeInput.style('background', '#333');
  gifTimeInput.style('color', '#fff');
  gifTimeInput.style('border', '1px solid #555');
  gifTimeInput.style('text-align', 'center');

  gifBtn = createButton('🎬 Record GIF');
  gifBtn.parent(gifBox);
  gifBtn.style('flex', '1');
  gifBtn.style('background', '#9c27b0');
  gifBtn.style('color', '#fff');
  gifBtn.style('border', 'none');
  gifBtn.style('padding', '6px');
  gifBtn.style('cursor', 'pointer');
  gifBtn.mousePressed(recordGif);
  
  // Calculate initial points
  computePoints();
}

function recordGif() {
  let duration = parseFloat(gifTimeInput.value());
  if (isNaN(duration) || duration <= 0) return;

  isRecording = true;
  toggleBtn.elt.innerText = '🔴 Recording ' + duration + 's...';
  toggleBtn.style('background', '#d32f2f');
  
  saveGif('kinetic_typography', duration, {
    units: 'seconds',
    silent: false,
    callback: () => {
      isRecording = false;
      toggleBtn.elt.innerText = guiVisible ? '⚙️ Close Settings' : '⚙️ Open Settings';
      toggleBtn.style('background', '#222');
    }
  });
}

function handleFile(file) {
  if (file.type === 'font' || file.name.endsWith('.ttf') || file.name.endsWith('.otf')) {
    // When a file is uploaded, we immediately replace the 'font' variable
    loadFont(file.data, (newFont) => {
      font = newFont;
      computePoints(); // Re-calculate points with new font
    });
  }
}

function toggleGUI() {
  if (isRecording) return; 
  guiVisible = !guiVisible;
  if (guiVisible) { 
    gui.show(); 
    toggleBtn.elt.innerText = '⚙️ Close Settings'; 
  } else { 
    gui.hide(); 
    toggleBtn.elt.innerText = '⚙️ Open Settings'; 
    isMouseOverGUI = false; 
  }
}

function updateMessage() {
  msg = this.value();
  computePoints();
}

function computePoints() {
  if (!font) return;
  try {
    points = font.textToPoints(msg, 0, 0, fontSize, {
      sampleFactor: sliderRaster.value(),
      simplifyThreshold: 0
    });
    bounds = font.textBounds(msg, 0, 0, fontSize);
  } catch(e) {
    console.log("Error generating points", e);
  }
}

function draw() {
  background(15);
  
  if (!isMouseOverGUI) {
    orbitControl(); 
  }
  
  let tempo = frameCount * sliderVelocity.value();
  let amplitude = sliderAmplitude.value();

  if (bounds) {
    translate(-bounds.w / 2, bounds.h / 2);
  }

  if (mouseFollowToggle.checked() && !isMouseOverGUI) {
    let mX = map(mouseX, 0, width, -200, 200);
    let mY = map(mouseY, 0, height, 200, -200);
    translate(mX, mY);
  }

  for (let i = 0; i < points.length; i++) {
    let p = points[i];
    push();
    
    let waveOffset = rasterToggle.checked() ? i * 0.1 : 0;
    
    let x = p.x + sin(tempo + waveOffset) * amplitude;
    let y = p.y + cos(tempo + waveOffset) * amplitude;
    let z = sin(tempo * 0.5 + waveOffset) * (amplitude * 2);
    
    translate(x, y, z);
    
    let mapPos = map(p.x, 0, bounds ? bounds.w : width, 0, 1);
    let c = lerpColor(colorPicker1.color(), colorPicker2.color(), mapPos);
    
    fill(c);
    noStroke();
    
    if (rasterToggle.checked()) {
      box(5);
    } else {
      sphere(2);
    }
    pop();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}