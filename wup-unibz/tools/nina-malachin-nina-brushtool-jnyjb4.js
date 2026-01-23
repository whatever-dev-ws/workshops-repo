let sX, sY, psX, psY; 
let currentWeight = 10;
let pickerSlow, pickerFast, pickerBG;
let sliderMax, sliderMin;
let shapeSelect;
let isRecording = false;
let bgImage;

function setup() {
  createCanvas(windowWidth, windowHeight);
  background(255);

  sX = psX = mouseX;
  sY = psY = mouseY;

  // --- THE FIX: SILENCE P5 NOTIFICATIONS ---
  let style = createElement('style');
  style.html(`
    body > p { display: none !important; visibility: hidden !important; opacity: 0 !important; pointer-events: none !important; }
  `);

  // --- COMPACT UI INTERFACE ---
  let gui = createDiv('');
  gui.position(15, 15);
  gui.style('background', 'rgba(255, 255, 255, 0.9)');
  gui.style('padding', '12px');
  gui.style('border-radius', '10px');
  gui.style('font-family', 'sans-serif');
  gui.style('box-shadow', '0 4px 15px rgba(0,0,0,0.1)');
  gui.style('width', '180px');
  gui.style('font-size', '10px');

  let title = createP('<b>BRUSH LAB PRO</b>').parent(gui);
  title.style('margin', '0 0 10px 0');

  // Brush Shape
  createP('BRUSH SHAPE').parent(gui).style('margin', '5px 0');
  shapeSelect = createSelect().parent(gui).style('width', '100%');
  shapeSelect.option('LINE');
  shapeSelect.option('CIRCLES');
  shapeSelect.option('SQUARES');
  shapeSelect.option('STARS');

  // Brush Colors
  createP('SLOW / FAST COLOR').parent(gui).style('margin', '10px 0 5px 0');
  let row = createDiv('').parent(gui).style('display', 'flex').style('gap', '5px');
  pickerSlow = createColorPicker('#0A1450').parent(row).style('width', '100%');
  pickerFast = createColorPicker('#00C8FF').parent(row).style('width', '100%');

  // Background Control
  createP('BACKGROUND COLOR').parent(gui).style('margin', '10px 0 5px 0');
  pickerBG = createColorPicker('#ffffff').parent(gui).style('width', '100%');
  pickerBG.input(() => {
    if (!bgImage) background(pickerBG.color());
  });

  // Image Upload
  createP('IMPORT BACKGROUND').parent(gui).style('margin', '10px 0 2px 0');
  let uploadBtn = createFileInput(handleFile).parent(gui).style('width', '100%');

  // Size Sliders
  createP('MAX SIZE (SLOW)').parent(gui).style('margin', '10px 0 2px 0');
  sliderMax = createSlider(5, 150, 40).parent(gui).style('width', '100%');
  
  createP('MIN SIZE (FAST)').parent(gui).style('margin', '5px 0 2px 0');
  sliderMin = createSlider(1, 30, 5).parent(gui).style('width', '100%');

  let help = createDiv(`
    <div style="margin-top:10px; padding-top:10px; border-top:1px solid #ddd; color:#555;">
      [C] Clear | [W] Save PNG | [G] Save GIF
    </div>
  `).parent(gui);

  strokeCap(ROUND);
  strokeJoin(ROUND);
}

function handleFile(file) {
  if (file.type === 'image') {
    bgImage = loadImage(file.data, img => {
      let imgAspect = img.width / img.height;
      let canvasAspect = width / height;
      if (imgAspect > canvasAspect) {
        img.resize(0, height);
      } else {
        img.resize(width, 0);
      }
      background(img);
    });
  }
}

function draw() {
  psX = sX;
  psY = sY;

  let easing = 0.2; 
  sX = lerp(sX, mouseX, easing);
  sY = lerp(sY, mouseY, easing);

  if (mouseIsPressed) {
    // Avoid drawing when clicking inside the GUI area
    if (mouseX < 210 && mouseY < 450) return;

    let d = dist(sX, sY, psX, psY);
    let speedNorm = constrain(d / 25, 0, 1);

    let c = lerpColor(pickerSlow.color(), pickerFast.color(), speedNorm);
    let targetWeight = map(d, 0, 25, sliderMax.value(), sliderMin.value());
    currentWeight = lerp(currentWeight, targetWeight, 0.2);

    fill(c);
    stroke(c);
    strokeWeight(currentWeight);

    let type = shapeSelect.value();
    if (type === 'LINE') {
      line(psX, psY, sX, sY);
    } else if (type === 'CIRCLES') {
      noStroke();
      ellipse(sX, sY, currentWeight);
    } else if (type === 'SQUARES') {
      noStroke();
      rectMode(CENTER);
      rect(sX, sY, currentWeight, currentWeight);
    } else if (type === 'STARS') {
      noStroke();
      drawStar(sX, sY, currentWeight * 0.4, currentWeight, 5);
    }
  } else {
    sX = mouseX; sY = mouseY;
    psX = mouseX; psY = mouseY;
  }
}

function drawStar(x, y, r1, r2, npoints) {
  let angle = TWO_PI / npoints;
  let halfAngle = angle / 2.0;
  beginShape();
  for (let a = 0; a < TWO_PI; a += angle) {
    let sx = x + cos(a) * r2;
    let sy = y + sin(a) * r2;
    vertex(sx, sy);
    sx = x + cos(a + halfAngle) * r1;
    sy = y + sin(a + halfAngle) * r1;
    vertex(sx, sy);
  }
  endShape(CLOSE);
}

function keyPressed() {
  if (key === 'c' || key === 'C') {
    if (bgImage) background(bgImage);
    else background(pickerBG.color());
  }
  
  if (key === 'w' || key === 'W') {
    saveCanvas('my_drawing', 'png');
  }
  
  if (key === 'g' || key === 'G') {
    isRecording = true;
    saveGif('my_drawing_animation', 120, { 
      units: 'frames', 
      onComplete: () => { isRecording = false; }
    });
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  if (bgImage) background(bgImage);
  else background(pickerBG.color());
}