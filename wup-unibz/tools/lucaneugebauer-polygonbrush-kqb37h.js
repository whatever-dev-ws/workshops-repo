//WUP 25-26
//Luca Neugebauer

let gui;
let bSides, bSize, bAlpha, bColor, bRotation;
let drawingLayer;
let showGui = true;


function setup() {
  createCanvas(windowWidth, windowHeight);
  
  
  
  // Create a separate graphics layer for the drawing to allow transparency
  drawingLayer = createGraphics(windowWidth, windowHeight);
  drawingLayer.clear(); // Makes the background transparent

  // Initialize GUI using p5.dom elements
  createInterface();
}

function draw() {
  background(0); // blalalalalack workspace background
  
 if (showGui)
 {fill(180); textSize(11);
  text("H — Toggle UI", 30, 225);
  text("S — Save Artwork (PNG)", 30, 250);
  text("C — Clear Canvas ", 30, 275);}
  
  else {text("H- tOgGLe uI",30,30)}
  
  

  if (mouseIsPressed && !isMouseOverGui()) {
    paint();
  }

  // Display the drawing layer
  image(drawingLayer, 0, 0);
  
  // Toggle GUI visibility
  gui.style('display', showGui ? 'block' : 'none');
}

function paint() {
  // Calculate the distance moved since the last frame
  let distance = dist(mouseX, mouseY, pmouseX, pmouseY);
  
  // Draw multiple polygons along the path based on the distance
  // We draw at least one, and more if the mouse moved quickly
  let steps = max(distance / (bSize.value() / 2), 1);

  for (let i = 0; i <= steps; i++) {
    // lerp finds a point between the old mouse position and new mouse position
    let x = lerp(pmouseX, mouseX, i / steps);
    let y = lerp(pmouseY, mouseY, i / steps);

     //aiaiai I'm your little butterfly
    
    drawingLayer.push();
    drawingLayer.fill(red(bColor.value()), green(bColor.value()), blue(bColor.value()), bAlpha.value());
    drawingLayer.noStroke();
    drawingLayer.translate(x, y);
    // Draw the polygon
    let angle = TWO_PI / bSides.value();
    let radius = bSize.value();
   
    drawingLayer.beginShape();
    for (let a = 0; a < TWO_PI; a += angle) {
      let sx = cos(a) * radius;
      let sy = sin(a) * radius;
      drawingLayer.vertex(sx, sy);
    }
    drawingLayer.endShape(CLOSE);
    drawingLayer.pop();
  }
}

function createInterface() {
  gui = createDiv('').id('brush-settings');
  gui.style('position', 'absolute');
  gui.style('top', '20px');
  gui.style('left', '20px');
  gui.style('background', 'rgba(255, 255, 255, 0.9)');
  gui.style('padding', '15px');
  gui.style('border-radius', '8px');
  gui.style('font-family', 'sans-serif');
  gui.html('<strong>BRUSH SETTINGS</strong><br><br>');

  // Number of Sides
  createLabel("Sides: ", gui);
  bSides = createSlider(3, 12, 4, 1).parent(gui);
  
  // Size
  createLabel("<br>Size: ", gui);
  bSize = createSlider(5, 100, 20, 1).parent(gui);
  
  // Opacity
  createLabel("<br>Opacity: ", gui);
  bAlpha = createSlider(0, 255, 100, 1).parent(gui);
  


  // Color Picker (Includes Eyedropper in modern browsers)
  createLabel("<br>Color: ", gui);
  bColor = createColorPicker('#FFFFFF').parent(gui);
  
  
  
  // Export Button
  let saveBtn = createButton("Export PNG").parent(gui);
  saveBtn.style('margin-top', '10px');
  saveBtn.mousePressed(() => saveCanvas(drawingLayer, 'myBrushArt', 'png'));
   // Clear Button
  let clearBtn = createButton('Clear Canvas').parent(gui);
  clearBtn.style('margin-top', '10px');
  clearBtn.style('margin-left', '5px');
  clearBtn.mousePressed(() => drawingLayer.clear());
}

function createLabel(text, parent) {
  let span = createSpan(text);
  span.parent(parent);
}

function keyPressed() {
  // Toggle Visibility
  if (key === 'h' || key === 'H') {
    showGui = !showGui;
    }
  if (key === 's' || key === 'S') {saveCanvas(drawingLayer, 'brushahhh', 'png');}
   if (key === 'c' || key === 'C') {drawingLayer.clear()}
}

function isMouseOverGui() {
  // Prevent drawing when clicking on the settings panel
  return showGui && mouseX < 300 && mouseY < 250; 
}


