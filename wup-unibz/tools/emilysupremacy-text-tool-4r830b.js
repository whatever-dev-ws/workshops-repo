let chars = [];
let baseFontSize = 90;
let currentFontSize = 90;
let myText = "SAY SOMETHING";
let recognition;
let isStarted = false;

// UI Elements
let fontSelect, layoutSelect, fontInput, colorPicker, bgPicker, tightSlider, recordBtn;
let currentFont = 'sans-serif';
let currentLayout = 'Dynamic Horizontal';
let customFont;

// Recording Variables
let recorder;
let chunks = [];
let isRecording = false;

function setup() {
  let canvas = createCanvas(windowWidth, windowHeight);
  
  // Voice Recognition Setup
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let current = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        current = event.results[i][0].transcript;
      }
      myText = current.toUpperCase();
      updateText();
    };

    recognition.onend = () => {
      if(isStarted) recognition.start();
    };
  }

  createUI();

  let btn = createButton('CLICK TO START VOICE');
  btn.position(width/2 - 110, height/2);
  styleElement(btn, {
    'padding': '20px 40px',
    'cursor': 'pointer',
    'background': '#ffffff',
    'color': '#000000',
    'border': 'none',
    'borderRadius': '4px',
    'fontWeight': 'bold',
    'fontSize': '16px',
    'boxShadow': '0 4px 15px rgba(0,0,0,0.3)'
  });
  
  btn.mousePressed(() => {
    isStarted = true;
    if (recognition) recognition.start();
    btn.hide();
    showUI(); 
    updateText();
  });

  textAlign(CENTER, CENTER);
  updateText();
}

function createUI() {
  // Container styling for clarity
  fontSelect = createSelect();
  fontSelect.position(20, 25);
  fontSelect.option('Sans-Serif', 'sans-serif');
  fontSelect.option('Serif', 'serif');
  fontSelect.option('Monospace', 'monospace');
  fontSelect.changed(() => { currentFont = fontSelect.value(); updateText(); });

  layoutSelect = createSelect();
  layoutSelect.position(140, 25);
  layoutSelect.option('Dynamic Horizontal');
  layoutSelect.option('Paragraph');
  layoutSelect.option('Spiral');
  layoutSelect.changed(() => { 
    currentLayout = layoutSelect.value(); 
    updateText(); 
  });

  colorPicker = createColorPicker('#ffffff');
  colorPicker.position(300, 25);

  bgPicker = createColorPicker('#050508');
  bgPicker.position(400, 25);

  fontInput = createFileInput(handleFile);
  fontInput.position(500, 25);

  tightSlider = createSlider(1, 10, 2.5, 0.1);
  tightSlider.position(670, 25);
  tightSlider.input(updateText);
  tightSlider.hide();

  recordBtn = createButton('START RECORD');
  recordBtn.position(windowWidth - 160, 25);
  recordBtn.mousePressed(toggleRecording);

  // Apply base styles to all UI
  let uiElements = [fontSelect, layoutSelect, colorPicker, bgPicker, fontInput, tightSlider, recordBtn];
  for (let el of uiElements) {
    styleElement(el, {
      'background': '#222',
      'color': '#eee',
      'border': '1px solid #555',
      'borderRadius': '3px',
      'padding': '2px 5px',
      'fontSize': '12px'
    });
    el.hide();
  }

  // Specific Record Button Style
  styleElement(recordBtn, {
    'background': '#ff4444',
    'fontWeight': 'bold',
    'padding': '5px 15px'
  });
}

function styleElement(el, styles) {
  for (let prop in styles) {
    el.style(prop, styles[prop]);
  }
}

function handleFile(file) {
  if (file.type === 'font' || file.name.endsWith('.ttf') || file.name.endsWith('.otf')) {
    loadFont(file.data, (f) => {
      customFont = f;
      currentFont = customFont;
      updateText();
    });
  }
}

function showUI() {
  fontSelect.show();
  layoutSelect.show();
  colorPicker.show();
  bgPicker.show();
  fontInput.show();
  recordBtn.show();
}

function toggleRecording() {
  if (!isRecording) {
    startRecording();
    recordBtn.html('STOP & SAVE');
    styleElement(recordBtn, { 'background': '#ffffff', 'color': '#000' });
  } else {
    stopRecording();
    recordBtn.html('START RECORD');
    styleElement(recordBtn, { 'background': '#ff4444', 'color': '#fff' });
  }
}

function startRecording() {
  chunks = [];
  let stream = canvas.captureStream(60); 
  recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
  recorder.ondataavailable = e => chunks.push(e.data);
  recorder.onstop = exportVideo;
  recorder.start();
  isRecording = true;
}

function stopRecording() {
  recorder.stop();
  isRecording = false;
}

function exportVideo() {
  let blob = new Blob(chunks, { type: 'video/webm' });
  let url = URL.createObjectURL(blob);
  let a = document.createElement('a');
  a.href = url;
  a.download = 'kinetic-typography.webm';
  a.click();
}

function updateText() {
  chars = [];
  textFont(currentFont);
  let padding = 100;

  if (isStarted) {
    if (currentLayout === 'Spiral') tightSlider.show();
    else tightSlider.hide();
  }

  if (currentLayout === 'Dynamic Horizontal') {
    currentFontSize = baseFontSize;
    textSize(currentFontSize);
    let totalWidth = textWidth(myText);
    if (totalWidth > width - padding) {
      currentFontSize = baseFontSize * ((width - padding) / totalWidth);
      textSize(currentFontSize);
      totalWidth = textWidth(myText);
    }
    let currentX = width / 2 - totalWidth / 2;
    for (let i = 0; i < myText.length; i++) {
      let charWidth = textWidth(myText[i]);
      chars.push(new KineticChar(myText[i], currentX + charWidth / 2, height / 2));
      currentX += charWidth;
    }

  } else if (currentLayout === 'Paragraph') {
    currentFontSize = 40;
    textSize(currentFontSize);
    let x = padding;
    let y = padding + 100;
    for (let i = 0; i < myText.length; i++) {
      let charWidth = textWidth(myText[i]);
      if (x + charWidth > width - padding) {
        x = padding;
        y += currentFontSize * 1.2;
      }
      chars.push(new KineticChar(myText[i], x + charWidth / 2, y));
      x += charWidth;
    }

  } else if (currentLayout === 'Spiral') {
    currentFontSize = 35;
    textSize(currentFontSize);
    let angle = 0;
    let radius = 0;
    let expansionRate = tightSlider.value(); 
    let spacingBuffer = 1.1;

    for (let i = 0; i < myText.length; i++) {
      let charWidth = textWidth(myText[i]);
      let px = width / 2 + cos(angle) * radius;
      let py = height / 2 + sin(angle) * radius;
      chars.push(new KineticChar(myText[i], px, py));
      let angleStep = (charWidth * spacingBuffer) / (radius + 5);
      angle += angleStep;
      radius = expansionRate * angle;
    }
  }
}

function draw() {
  background(bgPicker.color()); 
  
  if (!isStarted) {
    fill(255);
    textSize(18);
    text("Voice Typography Engine", width / 2, height / 2 - 80);
    textSize(14);
    fill(150);
    text("Requires Microphone Access", width / 2, height / 2 - 50);
  } else {
    // UI Labels
    fill(120);
    noStroke();
    textSize(10);
    textAlign(LEFT);
    text("FONT", 20, 18);
    text("LAYOUT", 140, 18);
    text("COLOR", 300, 18);
    text("BG", 400, 18);
    text("UPLOAD FONT", 500, 18);
    
    if (currentLayout === 'Spiral') {
      text("SPIRAL TIGHTNESS", 670, 18);
    }
    
    if (isRecording) {
      fill(255, 0, 0, sin(frameCount * 0.1) * 127 + 128);
      circle(width - 175, 25, 10);
    }
    textAlign(CENTER, CENTER);
  }

  for (let char of chars) {
    char.update();
    char.display();
  }
}

class KineticChar {
  constructor(c, x, y) {
    this.char = c;
    this.homeX = x;
    this.homeY = y;
    this.pos = createVector(x, y);
    this.vel = createVector(0, 0);
  }

  update() {
    let mouse = createVector(mouseX, mouseY);
    let distToMouse = p5.Vector.dist(this.pos, mouse);

    if (distToMouse < 150) {
      let push = p5.Vector.sub(this.pos, mouse);
      let power = map(distToMouse, 0, 150, 5, 0);
      push.setMag(power);
      this.vel.add(push);
    }

    let home = createVector(this.homeX, this.homeY);
    let spring = p5.Vector.sub(home, this.pos);
    spring.mult(0.05); // Snap back speed
    this.vel.add(spring);

    this.vel.mult(0.92); // Friction
    this.pos.add(this.vel);
  }

  display() {
    fill(colorPicker.color()); 
    noStroke();
    textFont(currentFont); 
    textSize(currentFontSize);
    
    push();
    translate(this.pos.x, this.pos.y);
    // Dynamic rotation based on velocity
    rotate(this.vel.x * 0.05);
    text(this.char, 0, 0);
    pop();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  recordBtn.position(windowWidth - 160, 25);
  updateText();
}