// WUP 25-26
// Laila Emam

let particles = [];
const NUM_PARTICLES = 150;

// UI Elements
let shapeSelector, speedSlider, sizeSlider, colorPicker, bgColorPicker, alphaSlider, trailSlider;
let savePicBtn, saveGifBtn, fileInput, textInput, statusLabel;
let speedLabel, sizeLabel, opacityLabel, trailLabel;

// Global States
let currentShape = 'Circle';
let globalSpeedMultiplier = 1;
let globalSizeMultiplier = 1;
let globalAlpha = 180;
let trailIntensity = 80; 
let particleColor;
let backgroundColor;
let userImg = null;

function setup() {
  createCanvas(windowWidth, windowHeight); 
  particleColor = color(255); 
  backgroundColor = color(0); 
  createControls(); 

  for (let i = 0; i < NUM_PARTICLES; i++) {
    particles.push(new Particle()); 
  }
}

function draw() {
  // Trail Logic: lower alpha = longer trails
  let backgroundAlpha = map(trailIntensity, 0, 100, 255, 5);
  let bgR = red(backgroundColor);
  let bgG = green(backgroundColor);
  let bgB = blue(backgroundColor);
  
  // Use a rectangle for background to support alpha trails correctly
  push();
  fill(bgR, bgG, bgB, backgroundAlpha);
  noStroke();
  rect(0, 0, width, height);
  pop();

  for (let i = 0; i < particles.length; i++) {
    particles[i].fall(); 
    particles[i].display(); 
  }
  
  updateLabelColors();
}

class Particle {
  constructor() {
    this.reset(); 
    this.y = random(-height, 0); 
  }

  fall() {
    this.velocity = this.baseVelocity * globalSpeedMultiplier; 
    this.y += this.velocity; 
    this.x += this.drift; 
    if (this.y > height) this.reset(); 
  }

  display() {
    this.size = this.baseSize * globalSizeMultiplier; 
    let r = red(particleColor);
    let g = green(particleColor);
    let b = blue(particleColor);
    
    push();
    if (currentShape === 'Line') {
      stroke(r, g, b, globalAlpha); 
      strokeWeight(this.size / 2); 
      line(this.x, this.y, this.x, this.y + this.size * 5); 
    } else {
      noStroke(); 
      fill(r, g, b, globalAlpha); 
      
      if (currentShape === 'Circle') {
        ellipse(this.x, this.y, this.size * 2); 
      } else if (currentShape === 'Square') {
        rectMode(CENTER);
        rect(this.x, this.y, this.size * 2, this.size * 2); 
      } else if (currentShape === 'Triangle') {
        let h = this.size * 1.5;
        triangle(this.x, this.y - h, this.x - this.size, this.y + h, this.x + this.size, this.y + h); 
      } else if (currentShape === '✨ Star') {
        this.drawStar(this.x, this.y, this.size, this.size * 2.5, 5);
      } else if (currentShape === 'Custom Text') {
        textAlign(CENTER, CENTER);
        textSize(this.size * 4);
        text(textInput.value(), this.x, this.y);
      } else if (currentShape === 'Upload PNG' && userImg) {
        tint(r, g, b, globalAlpha);
        imageMode(CENTER);
        image(userImg, this.x, this.y, this.size * 6, this.size * 6);
      }
    }
    pop();
  }

  drawStar(x, y, radius1, radius2, npoints) {
    let angle = TWO_PI / npoints;
    let halfAngle = angle / 2.0;
    beginShape();
    for (let a = 0; a < TWO_PI; a += angle) {
      let sx = x + cos(a) * radius2;
      let sy = y + sin(a) * radius2;
      vertex(sx, sy);
      sx = x + cos(a + halfAngle) * radius1;
      sy = y + sin(a + halfAngle) * radius1;
      vertex(sx, sy);
    }
    endShape(CLOSE);
  }

  reset() {
    this.x = random(width); 
    this.y = random(-100, -10); 
    this.baseVelocity = random(2, 5); 
    this.baseSize = random(2, 5); 
    this.drift = random(-0.5, 0.5); 
  }
}

function createControls() {
  const col1 = 20;
  const col2 = 250;
  const col3 = 500; // Fixed width for better layout

  createLabel('Shape:', col1, height - 130);
  shapeSelector = createSelect(); 
  shapeSelector.position(col1, height - 110);
  ['Circle', 'Square', 'Triangle', 'Line', '✨ Star', 'Custom Text', 'Upload PNG'].forEach(opt => shapeSelector.option(opt));
  shapeSelector.changed(() => currentShape = shapeSelector.value());

  createLabel('Text / Image:', col1, height - 80);
  textInput = createInput('VIBE');
  textInput.position(col1, height - 60);
  textInput.size(70);

  fileInput = createFileInput(handleFile);
  fileInput.position(col1 + 90, height - 60);

  speedLabel = createLabel('Speed: 1.0x', col2, height - 130);
  speedSlider = createSlider(0.5, 4.0, 1.0, 0.1); 
  speedSlider.position(col2, height - 110);
  speedSlider.input(() => {
    globalSpeedMultiplier = speedSlider.value();
    speedLabel.html('Speed: ' + globalSpeedMultiplier.toFixed(1) + 'x');
  });

  sizeLabel = createLabel('Size: 1.0x', col2, height - 80);
  sizeSlider = createSlider(0.1, 5.0, 1.0, 0.1); 
  sizeSlider.position(col2, height - 60);
  sizeSlider.input(() => {
    globalSizeMultiplier = sizeSlider.value();
    sizeLabel.html('Size: ' + globalSizeMultiplier.toFixed(1) + 'x');
  });

  trailLabel = createLabel('Trail Length: 80%', col2, height - 30);
  trailSlider = createSlider(0, 100, 80, 1);
  trailSlider.position(col2 + 100, height - 30);
  trailSlider.input(() => {
    trailIntensity = trailSlider.value();
    trailLabel.html('Trail Length: ' + trailIntensity + '%');
  });

  opacityLabel = createLabel('Object Opacity: 70%', col3, height - 130);
  alphaSlider = createSlider(0, 255, 180, 1); 
  alphaSlider.position(col3, height - 110);
  alphaSlider.input(() => {
    globalAlpha = alphaSlider.value();
    opacityLabel.html('Object Opacity: ' + map(globalAlpha, 0, 255, 0, 100).toFixed(0) + '%');
  });

  createLabel('Particle Color:', col3, height - 80);
  colorPicker = createColorPicker('#ffffff'); 
  colorPicker.position(col3 + 120, height - 80);
  colorPicker.input(() => particleColor = colorPicker.color());

  createLabel('Background Color:', col3, height - 50);
  bgColorPicker = createColorPicker('#000000');
  bgColorPicker.position(col3 + 120, height - 50);
  bgColorPicker.input(() => backgroundColor = bgColorPicker.color());

  savePicBtn = createButton('📸 SAVE IMAGE');
  savePicBtn.position(width - 150, height - 130);
  savePicBtn.mousePressed(() => saveCanvas('vibe_art', 'png'));

  saveGifBtn = createButton('🎬 SAVE 6s GIF');
  saveGifBtn.position(width - 150, height - 100);
  saveGifBtn.mousePressed(() => {
    statusLabel.html('RECORDING GIF...');
    saveGif('vibe_animation', 6);
    setTimeout(() => statusLabel.html(''), 6000);
  });

  statusLabel = createLabel('', width - 150, height - 60);
}

function createLabel(txt, x, y) {
  let l = createElement('span', txt);
  l.addClass('ui-label');
  l.position(x, y);
  return l;
}

function updateLabelColors() {
  let brightness = (red(backgroundColor) + green(backgroundColor) + blue(backgroundColor)) / 3;
  let txtCol = brightness > 127 ? 'black' : 'white';
  let labels = selectAll('.ui-label');
  for (let l of labels) {
    l.style('color', txtCol);
    l.style('font-family', 'sans-serif');
    l.style('font-weight', 'bold');
    l.style('font-size', '12px');
    l.style('text-shadow', '1px 1px 2px rgba(0,0,0,0.5)'); // Improves readability
  }
}

function handleFile(file) {
  if (file.type === 'image') {
    userImg = loadImage(file.data, img => {
      if (img.width > 120 || img.height > 120) img.resize(120, 0);
      currentShape = 'Upload PNG';
      shapeSelector.selected('Upload PNG');
    });
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  // Optional: Re-run createControls if you want them to reposition 
  // correctly on resize. Currently, they will stay at their original Y.
}