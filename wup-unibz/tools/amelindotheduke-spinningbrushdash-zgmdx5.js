let shapeSelector;
let sizeSlider;
let colorPicker;
let currentShape = 'Circle';
let userImage; 

// Variabili per la rotazione
let angle = 0;
let isRotating = false;
let rotationSpeed = 0.05;

// Variabili per il Multicolor
let isMulticolor = false;
let hueValue = 0;

function setup() {
  createCanvas(windowWidth, windowHeight);
  background(255);
  createControlPanel();
}

function createControlPanel() {
  let panel = createDiv('<b>BRUSH SETTINGS</b>');
  panel.position(20, 20);
  panel.style('background-color', 'rgba(240, 240, 240, 0.95)');
  panel.style('padding', '15px');
  panel.style('border-radius', '12px');
  panel.style('display', 'flex');
  panel.style('flex-direction', 'column');
  panel.style('gap', '10px');
  panel.style('font-family', 'sans-serif');
  panel.style('border', '1px solid #aaa');
  panel.style('width', '220px');
  panel.style('box-shadow', '5px 5px 15px rgba(0,0,0,0.1)');

  // Immagine Utente
  createElement('label', 'Use your image:').parent(panel).style('font-size', '12px');
  let fileInput = createFileInput(handleFile);
  fileInput.parent(panel);
  fileInput.style('font-size', '10px');

  // Forma
  createElement('label', 'Brush shape:').parent(panel).style('font-size', '12px');
  shapeSelector = createSelect();
  shapeSelector.parent(panel);
  shapeSelector.option('Circle');
  shapeSelector.option('Square');
  shapeSelector.option('Triangle');
  shapeSelector.option('User Image');
  shapeSelector.changed(() => currentShape = shapeSelector.value());

  // Dimensione
  createElement('label', 'Dimension:').parent(panel).style('font-size', '12px');
  sizeSlider = createSlider(5, 200, 40);
  sizeSlider.parent(panel);

  // Colore
  createElement('label', 'Colour:').parent(panel).style('font-size', '12px');
  colorPicker = createColorPicker('#000000');
  colorPicker.parent(panel);

  // --- NUOVI BOTTONI MODALITÀ ---
  
  // Bottone Rotazione
  let rotBtn = createButton('Rotation: OFF');
  rotBtn.parent(panel);
  rotBtn.mousePressed(() => {
    isRotating = !isRotating;
    rotBtn.html(isRotating ? 'Rotation: ON' : 'Rotation: OFF');
    rotBtn.style('background-color', isRotating ? '#4CAF50' : '#e7e7e7');
    rotBtn.style('color', isRotating ? 'white' : 'black');
  });

  // Bottone Multicolor
  let multiBtn = createButton('Multicolor: OFF');
  multiBtn.parent(panel);
  multiBtn.mousePressed(() => {
    isMulticolor = !isMulticolor;
    multiBtn.html(isMulticolor ? 'Multicolor: ON' : 'Multicolor: OFF');
    multiBtn.style('background-color', isMulticolor ? '#4CAF50' : '#e7e7e7');
    multiBtn.style('color', isMulticolor ? 'white' : 'black');
  });

  // BOTTONE PULIZIA
  let clearBtn = createButton('Clean Canvas');
  clearBtn.parent(panel);
  clearBtn.style('margin-top', '10px');
  clearBtn.mousePressed(() => background(255));
  
  // BOTTONE SALVATAGGIO
  let saveBtn = createButton('Save Artwork');
  saveBtn.parent(panel);
  saveBtn.style('background-color', '#2196F3');
  saveBtn.style('color', 'white');
  saveBtn.mousePressed(() => {
    saveCanvas('my_drawing', 'png');
  });
}

function handleFile(file) {
  if (file.type === 'image') {
    userImage = loadImage(file.data, () => {
      currentShape = 'User Image';
      shapeSelector.selected('User Image');
    });
  }
}

function draw() {
  if (mouseIsPressed) {
    // Evita di disegnare se il mouse è sopra il pannello
    if (mouseX > 250 || mouseY > 550) {
      drawBrush();
    }
  }
  
  if (isRotating) angle += rotationSpeed;
  
  if (isMulticolor) {
    hueValue = (hueValue + 2) % 360;
  }
}

function drawBrush() {
  let sz = sizeSlider.value();
  
  push();
  translate(mouseX, mouseY);
  if (isRotating) rotate(angle);

  if (isMulticolor) {
    colorMode(HSB, 360, 100, 100);
    let c = color(hueValue, 80, 90);
    fill(c);
    tint(c);
  } else {
    colorMode(RGB, 255);
    let c = colorPicker.color();
    fill(c);
    tint(c);
  }
  
  noStroke();

  if (currentShape === 'Circle') {
    ellipse(0, 0, sz);
  } else if (currentShape === 'Square') {
    rectMode(CENTER);
    rect(0, 0, sz, sz);
  } else if (currentShape === 'Triangle') {
    let h = sz * (sqrt(3) / 2);
    triangle(0, -h/2, -sz/2, h/2, sz/2, h/2);
  } else if (currentShape === 'User Image' && userImage) {
    imageMode(CENTER);
    image(userImage, 0, 0, sz, sz);
  }
  
  pop();
  colorMode(RGB, 255);
}

function windowResized() {
  let tempCanvas = get();
  resizeCanvas(windowWidth, windowHeight);
  background(255);
  image(tempCanvas, 0, 0);
}