let inkedHairs = [];
let hairThicknessSlider, durSlider;
let notifyText = "";
let notifyAlpha = 0;
let notifyTimer = 0;

function setup() {
  createCanvas(800, 600);
  
  // --- UI CONTROLS ---
  let clearBtn = createButton("CLEAR CANVAS");
  clearBtn.position(20, 20);
  applyButtonStyle(clearBtn, '#f44336'); // Red for clear
  clearBtn.mousePressed(() => { 
    inkedHairs = []; 
    triggerNotify("CANVAS CLEARED");
  });

  hairThicknessSlider = createSlider(1, 10, 2, 0.5);
  hairThicknessSlider.position(20, 50);

  // --- EXPORT CONTROLS ---
  let pngBtn = createButton("SAVE PNG");
  pngBtn.position(20, 80);
  applyButtonStyle(pngBtn, '#2196F3');
  pngBtn.mousePressed(() => { saveCanvas('kinetic_hair', 'png'); triggerNotify("PNG SAVED"); });

  let jpgBtn = createButton("SAVE JPG");
  jpgBtn.position(110, 80);
  applyButtonStyle(jpgBtn, '#2196F3');
  jpgBtn.mousePressed(() => { saveCanvas('kinetic_hair', 'jpg'); triggerNotify("JPG SAVED"); });

  let gifBtn = createButton("EXPORT GIF");
  gifBtn.position(20, 115);
  applyButtonStyle(gifBtn, '#FF9800');
  gifBtn.mousePressed(exportGif);

  durSlider = createSlider(1, 10, 3, 1);
  durSlider.position(120, 120);
}

// Helper function to handle inline styles and hover effects
function applyButtonStyle(btn, color) {
  const elt = btn.elt;
  elt.style.backgroundColor = color;
  elt.style.color = 'white';
  elt.style.border = 'none';
  elt.style.padding = '5px 12px';
  elt.style.borderRadius = '4px';
  elt.style.cursor = 'pointer';
  elt.style.fontWeight = 'bold';
  elt.style.transition = '0.2s';
  elt.style.fontSize = '10px';

  btn.mouseOver(() => {
    elt.style.filter = 'brightness(1.2)';
    elt.style.transform = 'scale(1.05)';
  });
  
  btn.mouseOut(() => {
    elt.style.filter = 'brightness(1.0)';
    elt.style.transform = 'scale(1.0)';
  });
}

function draw() {
  background(245);
  
  // HUD
  fill(80); noStroke(); textSize(11); textStyle(BOLD);
  text("HAIR THICKNESS", 160, 65);
  text("GIF DURATION: " + durSlider.value() + "s", 260, 133);
  
  fill(150); textStyle(NORMAL);
  text("SPACEBAR: KINETIC IMPULSE", 20, height - 20);
  text("DRAG MOUSE TO DRAW HAIR", 20, 155);
  
  handleNotifications();

  // --- INPUT RECORDING ---
  if (mouseIsPressed && frameCount % 3 === 0 && mouseY > 160) {
    let dx = mouseX - pmouseX;
    let dy = mouseY - pmouseY;
    let ang = (abs(dx) > 0.1 || abs(dy) > 0.1) ? atan2(dy, dx) : 0;
    
    inkedHairs.push(new Hair(mouseX, mouseY, ang, dist(mouseX, mouseY, pmouseX, pmouseY)));
  }

  // --- PHYSICS & RENDERING ---
  for (let i = inkedHairs.length - 1; i >= 0; i--) {
    let h = inkedHairs[i];
    h.update();
    h.display();
    
    // BREAKAGE LOGIC
    if (h.vel.mag() > 12 && h.len > 40 && random(1) < 0.05) {
      let newH = new Hair(h.x, h.y, h.angle + PI, h.speed);
      newH.len = h.len / 2;
      newH.vel = h.vel.copy().rotate(random(-0.5, 0.5)).mult(0.8);
      inkedHairs.push(newH);
      
      h.len /= 2;
      triggerNotify("HAIR SNAPPED!");
    }
  }
}

class Hair {
  constructor(x, y, angle, speed) {
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.speed = speed;
    this.spawnTime = millis();
    this.len = 5;
    this.vel = createVector(0, 0);
    this.wobble = 0;
  }

  update() {
    if (millis() - this.spawnTime > 800) {
      this.len = lerp(this.len, map(this.speed, 0, 30, 10, 80), 0.05);
    }

    this.x += this.vel.x;
    this.y += this.vel.y;
    
    if (this.x < 0 || this.x > width) this.vel.x *= -0.8;
    if (this.y < 0 || this.y > height) this.vel.y *= -0.8;
    
    this.vel.mult(0.97);
    this.wobble = sin(frameCount * 0.2) * (this.vel.mag() * 0.1);
  }

  display() {
    push();
    translate(this.x, this.y);
    rotate(this.angle + this.wobble);
    stroke(0, 150);
    noFill();
    strokeWeight(hairThicknessSlider.value());
    bezier(0, 0, -2, this.len/3, 2, this.len * 0.6, 0, this.len);
    pop();
  }
}

function keyPressed() {
  if (key === ' ') {
    for (let h of inkedHairs) {
      let force = p5.Vector.random2D().mult(random(5, 15));
      h.vel.add(force);
    }
    triggerNotify("IMPULSE APPLIED");
  }
}

function handleNotifications() {
  if (notifyTimer > 0) {
    notifyTimer--;
    if (notifyTimer < 60) notifyAlpha = lerp(notifyAlpha, 0, 0.1);
  } else notifyAlpha = 0;

  if (notifyAlpha > 1) {
    push();
    textAlign(LEFT, CENTER);
    textSize(13); textStyle(BOLD); fill(255, 0, 0, notifyAlpha);
    text(">> " + notifyText, 210, 93);
    pop();
  }
}

function triggerNotify(msg) { notifyText = msg; notifyAlpha = 255; notifyTimer = 180; }

function exportGif() {
  triggerNotify("RECORDING GIF...");
  saveGif('hair_kinetic', durSlider.value(), { delay: 0, units: 'seconds' });
  setTimeout(() => { triggerNotify("DOWNLOAD INITIATED"); }, durSlider.value() * 1000);
}