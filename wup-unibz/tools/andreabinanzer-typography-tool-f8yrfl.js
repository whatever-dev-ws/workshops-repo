// WUP 25-26
// Andrea Binanzer
let state = "START"; 
let params = {
  text: 'WUP 2026',
  fontSize: 80,
  tunnelDepth: 15,
  tunnelGap: 0.2,
  speed: 1.5,
  wobble: 15,
  rainbow: true,
  animationMode: 'Wave',
  fontStyle: 'serif',
  customFont: null, 
  yOffset: 0,
  visualEffect: 'None',
  baseColor: '#ffffff'
};

let gifDuration = 3;
let fps = 30;
let textInput, depthSlider, gapSlider, speedSlider, wobbleSlider, sizeSlider, ySlider;
let rainbowCheckbox, modeSelect, fontSelect, effectSelect, colorPicker, fontInput;
let startBtn;

function setup() {
  let style = createElement('style', `
    body { background: #0a0a0a; color: #ffffff; font-family: 'serif'; padding: 20px; }
    canvas { 
      border-radius: 4px; 
      box-shadow: 0 20px 50px rgba(0,0,0,0.8); 
      margin-bottom: 30px; 
      border: 1px solid #333; 
      display: block; 
      margin-left: auto; 
      margin-right: auto; 
    }
    .gui-container { 
      display: grid; 
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); 
      gap: 20px; 
      max-width: 1100px; 
      margin: 0 auto; 
      background: #000; 
      padding: 30px; 
      border: 1px solid #222;
      border-radius: 8px;
    }
    .control-group { 
      background: #000; 
      padding: 15px; 
      border-left: 1px solid #444; 
      display: flex; 
      flex-direction: column; 
      gap: 12px; 
    }
    .control-group > label { 
      font-size: 13px; 
      text-transform: uppercase; 
      letter-spacing: 2px; 
      color: #fff; 
      margin-bottom: 10px; 
      font-weight: bold;
    }
    .slider-unit { display: flex; flex-direction: column; gap: 6px; }
    .slider-unit span { font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 1px; }
    
    input, select { 
      background: #111; 
      color: white; 
      border: 1px solid #333; 
      padding: 8px; 
      border-radius: 0px; 
      font-family: serif;
    }
    input[type=file] {
      font-size: 10px;
      color: #888;
    }
    input[type=range] {
      -webkit-appearance: none;
      background: #222;
      height: 2px;
      margin: 10px 0;
    }
    input[type=range]::-webkit-slider-thumb {
      -webkit-appearance: none;
      height: 14px;
      width: 14px;
      background: #fff;
      cursor: pointer;
    }

    .shortcut-info { 
      grid-column: 1 / -1; 
      text-align: center; 
      color: #444; 
      font-size: 12px; 
      margin-top: 20px; 
      border-top: 1px solid #222; 
      padding-top: 15px;
      letter-spacing: 1px;
    }
    .key-hint { color: #fff; font-weight: bold; }
    
    .start-btn { 
      padding: 12px 40px; 
      background: white; 
      color: black; 
      border: 1px solid white; 
      font-family: serif; 
      font-weight: bold; 
      cursor: pointer; 
      font-size: 16px;
      letter-spacing: 2px;
      transition: all 0.3s;
      /* Fixierung für präzise Zentrierung */
      position: absolute;
      transform: translate(-50%, -50%);
    }
    .start-btn:hover {
      background: black;
      color: white;
    }
  `);

  createCanvas(windowWidth - 80, 500);
  frameRate(fps);
  colorMode(HSB, 360, 100, 100, 100);

  let container = createDiv().addClass('gui-container').id('main-gui');
  container.style('display', 'none');

  // Gruppe 1: Content
  let g1 = createDiv().parent(container).addClass('control-group');
  g1.child(createElement('label', 'Text & Style'));
  textInput = createInput(params.text).parent(g1);
  fontSelect = createSelect().parent(g1);
  ['serif', 'sans-serif', 'monospace', 'cursive'].forEach(o => fontSelect.option(o));
  g1.child(createElement('span', 'Upload Font (.ttf, .otf)').style('font-size', '10px').style('color', '#888'));
  fontInput = createFileInput(handleFontUpload).parent(g1);

  // Gruppe 2: Color
  let g2 = createDiv().parent(container).addClass('control-group');
  g2.child(createElement('label', 'Visuals'));
  colorPicker = createColorPicker(params.baseColor).parent(g2);
  rainbowCheckbox = createCheckbox(' Rainbow', params.rainbow).parent(g2);

  // Gruppe 3: Movement
  let g3 = createDiv().parent(container).addClass('control-group');
  g3.child(createElement('label', 'Animation Mode'));
  modeSelect = createSelect().parent(g3);
  ['Wave', 'Shake', 'Spin', 'Pulse', 'Spiral'].forEach(o => modeSelect.option(o));
  effectSelect = createSelect().parent(g3);
  ['None', 'Glow', 'Glitter', 'Stripes'].forEach(o => effectSelect.option(o));
  effectSelect.changed(() => params.visualEffect = effectSelect.value());

  // Gruppe 4: Dimensions
  let g4 = createDiv().parent(container).addClass('control-group');
  g4.child(createElement('label', 'Layout'));
  let s1 = createDiv().addClass('slider-unit').parent(g4);
  s1.child(createElement('span', 'Size'));
  sizeSlider = createSlider(20, 300, params.fontSize).parent(s1);
  let s2 = createDiv().addClass('slider-unit').parent(g4);
  s2.child(createElement('span', 'Y-Offset'));
  ySlider = createSlider(-150, 150, 0).parent(s2);

  // Gruppe 5: Tunnel & Intensity
  let g5 = createDiv().parent(container).addClass('control-group');
  g5.child(createElement('label', 'Dynamics'));
  let s3 = createDiv().addClass('slider-unit').parent(g5);
  s3.child(createElement('span', 'Depth'));
  depthSlider = createSlider(1, 60, params.tunnelDepth).parent(s3);
  let s5 = createDiv().addClass('slider-unit').parent(g5);
  s5.child(createElement('span', 'Speed'));
  speedSlider = createSlider(0.1, 5, params.speed, 0.1).parent(s5);
  let s6 = createDiv().addClass('slider-unit').parent(g5);
  s6.child(createElement('span', 'Intensity'));
  wobbleSlider = createSlider(0, 100, params.wobble).parent(s6);

  createDiv('Shortcuts: [<span class="key-hint">G</span>] GIF | [<span class="key-hint">S</span>] PNG').parent(container).addClass('shortcut-info');

  // Start Button initial zentrieren
  startBtn = createButton('START');
  startBtn.addClass('start-btn');
  centerStartButton();
  startBtn.mousePressed(startApp);
}

function centerStartButton() {
  // Verwendet die Canvas-Position für die Zentrierung
  let canvasElt = select('canvas').elt;
  let canvasRect = canvasElt.getBoundingClientRect();
  let centerX = canvasRect.left + canvasRect.width / 2 + window.scrollX;
  let centerY = canvasRect.top + canvasRect.height / 2 + 100 + window.scrollY;
  startBtn.position(centerX, centerY);
}

function handleFontUpload(file) {
  if (file.subtype === 'ttf' || file.subtype === 'otf' || file.type === 'font') {
    params.customFont = loadFont(file.data, () => {
      params.fontStyle = params.customFont;
    });
  }
}

function startApp() {
  state = "APP";
  startBtn.hide();
  select('#main-gui').style('display', 'grid');
}

function draw() {
  if (state === "START") {
    drawStartScreen();
    return;
  }

  params.text = textInput.value();
  if (!params.customFont) params.fontStyle = fontSelect.value();
  
  params.fontSize = sizeSlider.value();
  params.tunnelDepth = depthSlider.value();
  params.speed = speedSlider.value();
  params.wobble = wobbleSlider.value();
  params.rainbow = rainbowCheckbox.checked();
  params.yOffset = ySlider.value();

  background(0);

  translate(width / 2, height / 2 + params.yOffset);
  let t = frameCount * 0.02 * params.speed;

  let h, s, b;
  if (params.rainbow) {
    h = (frameCount * 2) % 360;
    s = 80; b = 100;
  } else {
    let c = colorPicker.color();
    h = hue(c); s = saturation(c); b = brightness(c);
  }

  for (let i = params.tunnelDepth; i > 0; i--) {
    push();
    let phase = i * 0.2; 
    let xOff = 0, yOff = 0, rot = 0, sMult = 1;

    switch (modeSelect.value()) {
      case 'Wave':
        xOff = sin(t + phase) * params.wobble * (i * 0.3);
        yOff = cos(t * 0.8 + phase) * params.wobble * (i * 0.2);
        break;
      case 'Shake':
        xOff = random(-1, 1) * params.wobble * (i * 0.1);
        yOff = random(-1, 1) * params.wobble * (i * 0.1);
        break;
      case 'Spin':
        rot = t + (i * 0.2);
        break;
      case 'Pulse':
        sMult = 1 + sin(t * 2 + phase) * (params.wobble / 100);
        break;
      case 'Spiral':
        rot = t + (i * 0.2);
        xOff = sin(t + phase) * params.wobble * 2;
        break;
    }

    let zScale = map(i, 0, params.tunnelDepth, 1.2, 0.05) * sMult;
    scale(zScale);
    translate(xOff, yOff);
    rotate(rot);

    textFont(params.fontStyle);
    textSize(params.fontSize);
    textAlign(CENTER, CENTER);
    textStyle(BOLD);

    let currentH = params.rainbow ? (h + i * 10) % 360 : h;
    let alpha = map(i, 0, params.tunnelDepth, 100, 5);

    if (params.visualEffect === 'Glow') {
      drawingContext.shadowBlur = map(params.wobble, 0, 100, 0, 50);
      drawingContext.shadowColor = color(currentH, s, b);
      fill(currentH, s, b, alpha);
    } 
    else if (params.visualEffect === 'Glitter') {
      fill(currentH, s, random(40, 100), alpha);
      if (random(1) > 0.92) {
        push();
        fill(0, 0, 100, 100);
        circle(random(-width/4, width/4), random(-height/4, height/4), random(2, 6));
        pop();
      }
    } 
    else if (params.visualEffect === 'Stripes') {
      if ((floor(frameCount / 10) + i) % 2 === 0) {
        fill(currentH, s, b, alpha);
      } else {
        fill(0, 0, 20, alpha);
      }
    } 
    else {
      fill(currentH, s, b, alpha);
      drawingContext.shadowBlur = 0;
    }

    text(params.text, 0, 0);
    pop();
  }
}

function drawStartScreen() {
  background(0);
  textAlign(CENTER, CENTER);
  textFont('serif');
  fill(255);
  
  textSize(42);
  textStyle(ITALIC);
  text("Typography Tool", width/2, height/2 - 60);
  
  textSize(18);
  textStyle(NORMAL);
  text("Create an animated text or just a picture with a cool effect.", width/2, height/2 - 10);
  
  stroke(255, 60);
  line(width/2 - 100, height/2 + 30, width/2 + 100, height/2 + 30);
  noStroke();
}

function keyPressed() {
  if (state === "START") return;
  if (key === 's' || key === 'S') saveCanvas('typography-noir', 'png');
  if (key === 'g' || key === 'G') {
    saveGif('typography-animation', gifDuration, { units: 'seconds', delay: 0 });
  }
}

function windowResized() {
  resizeCanvas(windowWidth - 80, 500);
  if (startBtn && state === "START") centerStartButton();
}