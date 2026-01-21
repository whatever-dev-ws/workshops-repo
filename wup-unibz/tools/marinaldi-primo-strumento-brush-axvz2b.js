let inkedDots = [];
let isMelting = false;
let impactColorMode = false;
let sizeSlider, durSlider;

// Notification variables
let notifyText = "";
let notifyAlpha = 0;
let notifyTimer = 0;

function setup() {
  createCanvas(800, 600);

  // --- UI STYLING CONSTANTS ---
  const btnStyle = {
    padding: '6px 12px',
    borderRadius: '4px',
    border: '1px solid #ccc',
    background: '#ffffff',
    cursor: 'pointer',
    fontSize: '11px',
    fontFamily: 'sans-serif',
    fontWeight: 'bold',
    transition: 'background 0.2s'
  };

  // --- UI CONTROLS ---
  let meltBtn = createButton("MELT / RESET POS");
  applyStyles(meltBtn, { ...btnStyle, position: 'absolute', left: '20px', top: '20px' });
  meltBtn.mousePressed(() => { isMelting = !isMelting; });

  let colorBtn = createButton("IMPACT COLOR: OFF");
  applyStyles(colorBtn, { ...btnStyle, position: 'absolute', left: '160px', top: '20px' });
  colorBtn.mousePressed(() => {
    impactColorMode = !impactColorMode;
    colorBtn.html("IMPACT COLOR: " + (impactColorMode ? "ON" : "OFF"));
    colorBtn.style('color', impactColorMode ? '#ff0000' : '#000000');
  });

  let clearBtn = createButton("CLEAR CANVAS");
  applyStyles(clearBtn, { ...btnStyle, position: 'absolute', left: '320px', top: '20px', color: '#721c24' });
  clearBtn.mousePressed(() => {
    inkedDots = [];
    triggerNotify("CANVAS CLEARED");
  });

  sizeSlider = createSlider(2, 20, 6, 1);
  sizeSlider.position(20, 50);
  sizeSlider.style('width', '130px');

  // --- EXPORT CONTROLS ---
  let pngBtn = createButton("SAVE PNG");
  applyStyles(pngBtn, { ...btnStyle, position: 'absolute', left: '20px', top: '80px' });
  pngBtn.mousePressed(() => {
    saveCanvas('melting_dots', 'png');
    triggerNotify("PNG SAVED");
  });

  let jpgBtn = createButton("SAVE JPG");
  applyStyles(jpgBtn, { ...btnStyle, position: 'absolute', left: '100px', top: '80px' });
  jpgBtn.mousePressed(() => {
    saveCanvas('melting_dots', 'jpg');
    triggerNotify("JPG SAVED");
  });

  let gifBtn = createButton("EXPORT GIF");
  applyStyles(gifBtn, { ...btnStyle, position: 'absolute', left: '20px', top: '110px', background: '#fff9c4', border: '1px solid #fbc02d' });
  gifBtn.mousePressed(exportGif);

  durSlider = createSlider(1, 10, 3, 1);
  durSlider.position(110, 115);
  durSlider.style('width', '100px');
}

// Helper function to apply inline styles and hover effects
function applyStyles(el, styles) {
  for (let key in styles) {
    el.style(key, styles[key]);
  }
  
  // Hover effects using event listeners
  el.elt.addEventListener('mouseenter', () => {
    el.style('background', '#f0f0f0');
  });
  el.elt.addEventListener('mouseleave', () => {
    // Revert to original background (yellowish for GIF, white for others)
    if (el.html() === "EXPORT GIF") {
      el.style('background', '#fff9c4');
    } else {
      el.style('background', '#ffffff');
    }
  });
}

function draw() {
  background(245);

  // HUD Labels
  fill(80); noStroke(); textSize(11); textAlign(LEFT);
  text("DOT SIZE", 160, 64);
  text("GIF LENGTH: " + durSlider.value() + "s", 220, 128);

  // --- NOTIFICATION LOGIC ---
  if (notifyTimer > 0) {
    notifyTimer--;
    if (notifyTimer < 60) {
      notifyAlpha = lerp(notifyAlpha, 0, 0.1);
    }
  } else {
    notifyAlpha = 0;
  }

  if (notifyAlpha > 1) {
    push();
    textAlign(LEFT, CENTER);
    textSize(12);
    textStyle(BOLD);
    fill(200, 0, 0, notifyAlpha);
    text(">> " + notifyText, 220, 92);
    pop();
  }

  // --- INPUT RECORDING ---
  if (mouseIsPressed && frameCount % 2 === 0 && mouseY > 140) {
    let dx = mouseX - pmouseX;
    let dy = mouseY - pmouseY;
    let angle = (abs(dx) > 0.1 || abs(dy) > 0.1) ? atan2(dy, dx) : 0;

    for (let i = 0; i < 4; i++) {
      let offX = -15 + (i * 10);
      let wX = mouseX + cos(angle) * offX;
      let wY = mouseY + sin(angle) * offX;
      if (inkedDots.length < 2500) {
        inkedDots.push({
          x: wX, y: wY,
          origX: wX, origY: wY,
          vx: random(-0.5, 0.5), vy: 0,
          currentColor: color(0)
        });
      }
    }
  }

  // --- PHYSICS & RENDERING ---
  for (let d of inkedDots) {
    if (isMelting) {
      d.vy += 0.22; d.x += d.vx; d.y += d.vy;
      if (d.y >= height) {
        d.y = height; d.vy *= -0.5; d.vx *= 0.9;
        if (impactColorMode) d.currentColor = color(255, 0, 0);
      }
    } else {
      d.x = lerp(d.x, d.origX, 0.15);
      d.y = lerp(d.y, d.origY, 0.15);
      d.vx = 0; d.vy = 0;
      d.currentColor = lerpColor(d.currentColor, color(0), 0.1);
    }
    fill(d.currentColor);
    noStroke();
    ellipse(d.x, d.y, sizeSlider.value(), sizeSlider.value());
  }
}

function triggerNotify(msg) {
  notifyText = msg;
  notifyAlpha = 255;
  notifyTimer = 180;
}

function exportGif() {
  triggerNotify("RECORDING GIF...");
  saveGif('melting_artwork', durSlider.value(), {
    delay: 0,
    units: 'seconds',
    silent: true
  });

  setTimeout(() => {
    triggerNotify("PROCESSING DOWNLOAD...");
  }, durSlider.value() * 1000);
}