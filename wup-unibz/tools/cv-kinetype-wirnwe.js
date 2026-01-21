// WUP 25-26
// Chiara Viel

// GLOBAL VARIABLES
let font;
let points = [];
let bounds;

// UI Elements
let ui_txt, ui_mode, ui_size, ui_amp, ui_freq, ui_speed, ui_colText, ui_colBg;
let btnPng, btnGif;

// Settings
let gifDuration = 3; // Exact loop duration in seconds
let fontStack = 'Helvetica, Arial, sans-serif';

function preload() {
  // Using a Helvetica-like font
  font = loadFont('https://cdnjs.cloudflare.com/ajax/libs/topcoat/0.8.0/font/SourceSansPro-Regular.otf');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  
  // Apply body styles directly to the document
  document.body.style.margin = '0';
  document.body.style.overflow = 'hidden';
  document.body.style.background = '#000';
  document.body.style.fontFamily = fontStack;

  createInterface();
  generatePoints();
}

function draw() {
  background(ui_colBg.value());
  translate(width / 2, height / 2);

  let mode = ui_mode.value();
  let amp = ui_size.value() * (ui_amp.value() / 100);
  let freq = parseFloat(ui_freq.value());
  let speed = parseFloat(ui_speed.value()); 

  // --- PERFECT LOOP CALCULATION ---
  let totalFrames = gifDuration * 60;
  let percent = (frameCount % totalFrames) / totalFrames;
  let t = percent * TWO_PI;

  fill(ui_colText.value());
  noStroke();

  // Glow effect
  drawingContext.shadowBlur = 15;
  drawingContext.shadowColor = ui_colText.value();

  for (let i = 0; i < points.length; i++) {
    let p = points[i];
    let dx = 0;
    let dy = 0;
    
    let distFromCenter = dist(p.x, p.y, 0, 0);
    let angleFromCenter = atan2(p.y, p.x);

    // --- CIRCULAR LOGIC (PERFECT LOOP) ---
    
    if (mode === 'Sine Wave') {
      dy = sin(p.x * freq + t) * amp;
      dx = cos(p.y * freq * 2 + t) * (amp * 0.2);

    } else if (mode === 'Liquid Noise') {
      let r = 1.5;
      let nx = p.x * 0.01 + r * cos(t);
      let ny = p.y * 0.01 + r * sin(t);
      dx = map(noise(nx, ny), 0, 1, -amp, amp);
      dy = map(noise(nx + 10, ny + 10), 0, 1, -amp, amp);

    } else if (mode === 'Spiral') {
      let spiral = sin(distFromCenter * freq * 0.1 - t) * amp;
      dx = cos(angleFromCenter) * spiral;
      dy = sin(angleFromCenter) * spiral;

    } else if (mode === 'Explode') {
      let pulse = sin(t); 
      dx = cos(angleFromCenter) * pulse * amp * 0.5;
      dy = sin(angleFromCenter) * pulse * amp * 0.5;

    } else if (mode === 'Ripple') {
      let wave = sin(distFromCenter * freq * 0.5 - t) * amp;
      dx = cos(angleFromCenter) * wave;
      dy = sin(angleFromCenter) * wave;

    } else if (mode === 'Fire') {
      let r = 1.0;
      let flicker = noise(p.x * 0.05, p.y * 0.05 + r * sin(t)) * amp;
      dy = -abs(flicker);
      dx = sin(p.x * freq + t) * amp * 0.2;
    }

    circle(p.x + dx, p.y + dy, 4);
  }
  
  drawingContext.shadowBlur = 0;
}

// --- EXPORT FUNCTION ---
function triggerGifExport() {
  btnGif.html("RENDERING...");
  // Direct inline style for rendering state
  btnGif.elt.style.background = '#ff3b30';
  
  saveGif('KINETYPE', gifDuration, {
    units: 'seconds',
    delay: 0,
    notificationDuration: 1
  });

  setTimeout(() => {
    btnGif.html("SAVE GIF");
    btnGif.elt.style.background = 'rgba(255,255,255,0.15)';
  }, gifDuration * 1000 + 1000);
}


// --- DATA MANAGEMENT & UI ---

function generatePoints() {
  let txtStr = ui_txt.value();
  let s = parseInt(ui_size.value());
  if (!font) return;

  points = font.textToPoints(txtStr, 0, 0, s, {
    sampleFactor: 0.15,
    simplifyThreshold: 0
  });

  if (points.length > 0) {
    bounds = font.textBounds(txtStr, 0, 0, s);
    let offsetX = -bounds.w / 2;
    let offsetY = bounds.h / 3;
    for (let p of points) {
      p.x += offsetX;
      p.y += offsetY;
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  generatePoints();
}

function createInterface() {
  // Main Panel
  let panel = createDiv('');
  panel.id('glass-panel'); // ID kept for reference, but styles applied manually below
  Object.assign(panel.elt.style, {
    position: 'fixed',
    top: '20px',
    right: '20px',
    width: '260px',
    padding: '20px',
    background: 'rgba(30, 30, 30, 0.85)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: '16px',
    color: 'white',
    zIndex: '100',
    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
    fontFamily: fontStack
  });

  // Title
  let title = createElement('h3', 'KINETYPE');
  title.parent(panel);
  Object.assign(title.elt.style, {
    margin: '0 0 15px 0',
    fontSize: '14px',
    letterSpacing: '2px',
    textTransform: 'uppercase',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    paddingBottom: '10px',
    fontFamily: fontStack
  });

  // Content Section
  createLabel('CONTENT', panel);
  
  ui_txt = createElement('textarea', 'LOOP\nGIF');
  ui_txt.parent(panel);
  ui_txt.input(generatePoints);
  Object.assign(ui_txt.elt.style, {
    width: '100%',
    background: 'rgba(0,0,0,0.3)',
    color: 'white',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '6px',
    padding: '8px',
    fontFamily: fontStack,
    outline: 'none',
    marginTop: '5px',
    boxSizing: 'border-box'
  });

  ui_mode = createSelect();
  ui_mode.parent(panel);
  ['Sine Wave', 'Liquid Noise', 'Spiral', 'Explode', 'Ripple', 'Fire'].forEach(m => ui_mode.option(m));
  Object.assign(ui_mode.elt.style, {
    width: '100%',
    padding: '6px',
    background: '#333',
    color: 'white',
    border: '1px solid #555',
    borderRadius: '4px',
    marginTop: '5px',
    fontFamily: fontStack
  });

  // Features Section
  createLabel('FEATURES', panel);
  
  createSubLabel('Size', panel);
  ui_size = createSlider(50, 300, 130);
  ui_size.parent(panel);
  ui_size.input(generatePoints);
  styleSlider(ui_size);

  createSubLabel('Width', panel);
  ui_amp = createSlider(0, 200, 40);
  ui_amp.parent(panel);
  styleSlider(ui_amp);

  createSubLabel('Frequency', panel);
  ui_freq = createSlider(0.01, 0.5, 0.08, 0.01);
  ui_freq.parent(panel);
  styleSlider(ui_freq);
  
  createSubLabel('Speed', panel);
  ui_speed = createSlider(1, 5, 1, 0.5);
  ui_speed.parent(panel);
  styleSlider(ui_speed);

  // Style Section
  createLabel('STYLE', panel);
  
  let colorRow = createDiv('');
  colorRow.parent(panel);
  Object.assign(colorRow.elt.style, {
    display: 'flex',
    gap: '15px',
    marginTop: '10px'
  });
  
  let c1 = createDiv('');
  c1.parent(colorRow);
  let c1Label = createSpan('Text');
  c1Label.parent(c1);
  c1Label.elt.style.fontSize = '10px';
  ui_colText = createColorPicker('#e0e0ff');
  ui_colText.parent(c1);
  styleColorPicker(ui_colText);
  
  let c2 = createDiv('');
  c2.parent(colorRow);
  let c2Label = createSpan('Background');
  c2Label.parent(c2);
  c2Label.elt.style.fontSize = '10px';
  ui_colBg = createColorPicker('#1a1a2e');
  ui_colBg.parent(c2);
  styleColorPicker(ui_colBg);

  // Buttons
  let btnGroup = createDiv('');
  btnGroup.parent(panel);
  Object.assign(btnGroup.elt.style, {
    display: 'flex',
    gap: '10px',
    marginTop: '20px'
  });

  btnPng = createButton('PNG');
  btnPng.parent(btnGroup);
  styleButton(btnPng);
  btnPng.mousePressed(() => saveCanvas('kinetic_still', 'png'));

  btnGif = createButton('SAVE GIF');
  btnGif.parent(btnGroup);
  styleButton(btnGif);
  btnGif.mousePressed(triggerGifExport);
}

// --- HELPER FUNCTIONS FOR INLINE STYLING ---

function createLabel(txt, parent) {
  let l = createSpan(txt);
  l.parent(parent);
  Object.assign(l.elt.style, {
    fontSize: '11px',
    color: '#aaa',
    marginTop: '15px',
    display: 'block',
    fontWeight: 'bold',
    letterSpacing: '1px',
    fontFamily: fontStack
  });
}

function createSubLabel(txt, parent) {
  let l = createSpan(txt);
  l.parent(parent);
  Object.assign(l.elt.style, {
    fontSize: '10px',
    color: '#888',
    marginTop: '8px',
    display: 'block',
    fontFamily: fontStack
  });
}

function styleSlider(slider) {
  Object.assign(slider.elt.style, {
    width: '100%',
    margin: '5px 0',
    cursor: 'pointer',
    accentColor: 'white' // Standard modern CSS property for range inputs
  });
}

function styleColorPicker(cp) {
  Object.assign(cp.elt.style, {
    border: 'none',
    width: '30px',
    height: '30px',
    borderRadius: '4px',
    cursor: 'pointer',
    background: 'none'
  });
}

function styleButton(btn) {
  // Base Styles
  Object.assign(btn.elt.style, {
    flex: '1',
    padding: '10px',
    border: 'none',
    borderRadius: '6px',
    background: 'rgba(255,255,255,0.15)',
    color: 'white',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background 0.2s',
    fontFamily: fontStack,
    fontSize: '11px'
  });

  // Interaction States (Simulating :hover)
  btn.elt.onmouseenter = function() {
    // Only change hover color if we aren't in the middle of rendering (Red state)
    // We check this by seeing if the background is the Red color #ff3b30
    // computed style check helps handle color format differences
    let currentBg = window.getComputedStyle(btn.elt).backgroundColor;
    
    // Convert hex #ff3b30 to rgb(255, 59, 48) approx for check, 
    // or easier: check text content.
    if(btn.html() !== "RENDERING...") {
        btn.elt.style.background = 'rgba(255,255,255,0.3)';
    }
  };

  btn.elt.onmouseleave = function() {
    if(btn.html() !== "RENDERING...") {
        btn.elt.style.background = 'rgba(255,255,255,0.15)';
    }
  };
}