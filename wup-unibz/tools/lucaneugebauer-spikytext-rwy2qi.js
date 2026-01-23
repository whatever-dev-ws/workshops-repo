//WUP 25-26
//Luca Neugebauer

let customFont;
let showUI = true;
let textInput = "SPIKY";
let pg; // The transparent layer for the text

// UI Elements
let uploadBtn, inputField, sizeSld, spikeSld, spacingSld, fillCB, exportBtn;

function setup() {
  createCanvas(windowWidth, windowHeight);
  // Create the transparent layer
  pg = createGraphics(windowWidth, windowHeight);
  
  let uiX = 20;
  
  uploadBtn = createFileInput(handleFile);
  uploadBtn.position(uiX, 60);

  inputField = createInput(textInput);
  inputField.position(uiX, 110);
  inputField.input(() => { textInput = inputField.value(); });

  sizeSld = createSlider(10, 400, 150);
  sizeSld.position(uiX, 170);
  
   spikenumberSld = createSlider(0.1, 3, 0.1, 0.1);
  spikenumberSld.position(uiX, 230);

  spikeSld = createSlider(0, 100, 20);
  spikeSld.position(uiX, 290);

  spacingSld = createSlider(20, 400, 120);
  spacingSld.position(uiX, 350);
  
  
  sampleSld = createSlider(1, 50, 1,1);
  sampleSld.position(uiX, 410);

  fillCB = createCheckbox('Fill Text', false);
  fillCB.position(uiX, 450);
  fillCB.style('font-size', '11px');

  exportBtn = createButton('EXPORT TRANSPARENT PNG');
  exportBtn.position(uiX, 490);
  exportBtn.mousePressed(exportPNG);
}

function handleFile(file) {
  if (file.type === 'font' || file.name.endsWith('.ttf') || file.name.endsWith('.otf')) {
    customFont = loadFont(file.data);
  } else {
    alert("Please upload a valid .ttf or .otf file.");
  }
}

function draw() {
  background(220); // Background for the editor view (won't be exported)
  pg.clear();      // Clear the transparent layer every frame

  if (customFont && customFont.font) {
    drawModifiedText();
  } else {
    fill(100);
    textAlign(CENTER, CENTER);
    textSize(16);
    text("1. Upload a .ttf or .otf font file\n2. Press 'H' to toggle menu", width/2, height/2);
  }

  // Draw the transparent layer onto the main canvas
  image(pg, 0, 0);

  if (showUI) {
    drawHUD();
  }
}

function drawModifiedText() {
  let chars = textInput.split('');
  let totalWidth = (chars.length - 1) * spacingSld.value();
  
  pg.push();
  pg.translate(width/2 - totalWidth/2, height/2 + sizeSld.value()/3);

  for (let i = 0; i < chars.length; i++) {
    pg.push();
    pg.translate(i * spacingSld.value(), 0);

    let pts = customFont.textToPoints(chars[i], 0, 0, sizeSld.value(), {
      sampleFactor: spikenumberSld.value(),
      simplifyThreshold: 0
    });

    if (fillCB.checked()) {
      pg.fill(0);
      pg.noStroke();
    } else {
      pg.noFill();
      pg.stroke(0);
      pg.strokeWeight(1.5);
    }

    // --- KEY FIX STARTS HERE ---
    pg.beginShape();
    for (let j = 0; j < pts.length; j++) {
      let p = pts[j];
      
      // If this point belongs to a different contour than the previous one,
      // close the current shape and start a new one.
      if (j > 0 && pts[j].contour !== pts[j - 1].contour) {
        pg.endShape(CLOSE);
        pg.beginShape();
      }

      let spike = spikeSld.value() * 1;
      let xOff = map(noise(p.x * 0.1, p.y * 0.1, sampleSld.value()), 0, 1, -spike, spike);
      let yOff = map(noise(p.y * 0.1, p.x * 0.1, sampleSld.value()), 0, 1, -spike, spike);
      
      pg.vertex(p.x + xOff, p.y + yOff);
    }
    pg.endShape(CLOSE);
    // --- KEY FIX ENDS HERE ---

    pg.pop();
  }
  pg.pop();
}
function drawHUD() {
  push();
  fill(245, 245, 245, 220);
  stroke(200);
  rect(10, 10, 240, 540, 8);
  
  fill(0);
  noStroke();
  textAlign(LEFT);
  textSize(11);
  text("FONT UPLOAD", 20, 50);
  text("TEXT INPUT", 20, 100);
  text("SIZE: " + sizeSld.value(), 20, 160);
  text("SPIKE NUMBER: " + spikenumberSld.value(), 20, 220);
  text("SPIKE VALUE: " + spikeSld.value(), 20, 280);
  text("SPACING: " + spacingSld.value(), 20, 340);
   text("SAMPLE: " + sampleSld.value(), 20, 400);
  
  textSize(12);
  fill(100);
  text("Press '#' to hide/show UI", 20, 530);
  pop();
}

function keyPressed() {
  if (key === '#' ) {
    showUI = !showUI;
    toggleUIElements();
  }
}

function toggleUIElements() {
  let mode = showUI ? 'block' : 'none';
  uploadBtn.style('display', mode);
  inputField.style('display', mode);
  sizeSld.style('display', mode);
  spikeSld.style('display', mode);
  spacingSld.style('display', mode);
  fillCB.style('display', mode);
  exportBtn.style('display', mode);
}

function exportPNG() {
  // Save only the pg (Graphics) layer to ensure transparency
  saveCanvas(pg, 'distorted_text_transparent', 'png');
}