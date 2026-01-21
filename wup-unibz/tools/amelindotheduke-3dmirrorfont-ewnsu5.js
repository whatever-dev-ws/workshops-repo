let font;
let sizeSlider, thicknessSlider;
let posYSlider; 
let curveUpSlider, curveDownSlider; 
let lightXSlider, lightYSlider, lightZSlider;
let copiesSlider, offsetSlider;
let showLightCheckbox;
let colorPicker, textInput;
let panel;

let rotX = 0; 
let rotY = 0;

let currentText = "Text";
let defaultFontUrl = 'https://cdnjs.cloudflare.com/ajax/libs/topcoat/0.8.0/font/SourceCodePro-Bold.otf';

function preload() {
  font = loadFont(defaultFontUrl);
}

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  textFont(font);
  textAlign(CENTER, CENTER);
  
  for (let element of document.getElementsByClassName("p5Canvas")) {
    element.addEventListener('contextmenu', e => e.preventDefault());
  }
  
  createControlPanel();
}

function createControlPanel() {
  panel = createDiv('<b>SETTINGS</b>');
  panel.position(20, 20);
  panel.style('background-color', 'rgba(255,255,255,0.9)');
  panel.style('padding', '20px');
  panel.style('border-radius', '12px');
  panel.style('color', 'black');
  panel.style('font-family', 'sans-serif');
  panel.style('display', 'flex');
  panel.style('flex-direction', 'column');
  panel.style('gap', '10px');
  panel.style('width', '300px');
  panel.style('border', '1px solid #666');
  panel.style('z-index', '100');
  panel.style('max-height', '90vh');
  panel.style('overflow-y', 'auto');

  const createRow = (label, control) => {
    let row = createDiv('');
    row.style('display', 'flex');
    row.style('justify-content', 'space-between');
    row.style('align-items', 'center');
    row.parent(panel);
    let lbl = createElement('span', label);
    lbl.style('font-size', '13px');
    lbl.parent(row);
    control.parent(row);
  };

  textInput = createInput(currentText);
  textInput.style('width', '100px');
  textInput.input(() => currentText = textInput.value());
  createRow('Text:', textInput);

  let fontInput = createFileInput(handleFont);
  createRow('Custom Font:', fontInput);

  copiesSlider = createSlider(0, 10, 5);
  createRow('Back Copies:', copiesSlider);

  offsetSlider = createSlider(10, 200, 50);
  createRow('Copy Distance:', offsetSlider);

  sizeSlider = createSlider(20, 150, 60);
  createRow('Dimension:', sizeSlider);

  posYSlider = createSlider(-height/2, height/2, 0);
  createRow('Position Y:', posYSlider);

  curveUpSlider = createSlider(0, 5, 0, 0.1);
  createRow('Curve up:', curveUpSlider);
  curveUpSlider.input(() => curveDownSlider.value(0)); 

  curveDownSlider = createSlider(0, 5, 0, 0.1);
  createRow('Curve down:', curveDownSlider);
  curveDownSlider.input(() => curveUpSlider.value(0));

  thicknessSlider = createSlider(1, 40, 5);
  createRow('Thickness:', thicknessSlider);

  lightXSlider = createSlider(-600, 600, 200);
  createRow('Light X:', lightXSlider);
  lightYSlider = createSlider(-600, 600, -200);
  createRow('Light Y:', lightYSlider);
  lightZSlider = createSlider(-500, 500, 200);
  createRow('Light Z:', lightZSlider);

  colorPicker = createColorPicker('#ffffff');
  createRow('Main Colour:', colorPicker);
  
  showLightCheckbox = createCheckbox(' Show Light Guide', true);
  showLightCheckbox.parent(panel);

  // --- BOTTONI AZIONE ---
  let btnContainer = createDiv('');
  btnContainer.parent(panel);
  btnContainer.style('display', 'grid');
  btnContainer.style('grid-template-columns', '1fr 1fr');
  btnContainer.style('gap', '10px');
  btnContainer.style('margin-top', '10px');

  let btnPng = createButton('Save PNG');
  btnPng.parent(btnContainer);
  btnPng.mousePressed(() => saveCanvas('3d_text_artwork', 'png'));

  let btnSvg = createButton('Save SVG');
  btnSvg.parent(btnContainer);
  btnSvg.mousePressed(() => save('3d_text_vector.svg'));

// --- MODIFICA PULSANTE RESET ---
  let btnReset = createButton('🔄 Reset All Settings');
  btnReset.parent(panel);
  btnReset.style('width', '100%');
  btnReset.style('background-color', '#ff4d4d');
  btnReset.style('color', 'white');
  btnReset.style('font-weight', 'bold');
  btnReset.mousePressed(resetAllSettings); // Chiamata alla nuova funzione

  let btnRandom = createButton('🎲 Randomize All');
  btnRandom.parent(panel);
  btnRandom.style('width', '100%');
  btnRandom.style('background-color', '#ffeb3b');
  btnRandom.style('font-weight', 'bold');
  btnRandom.mousePressed(randomizeValues);
}

function resetAllSettings() {
  // 1. Ripristina Variabili di rotazione
  rotX = 0;
  rotY = 0;

  // 2. Ripristina Slider ai valori iniziali (setup di default)
  copiesSlider.value(5);
  offsetSlider.value(50);
  sizeSlider.value(60);
  posYSlider.value(0);
  thicknessSlider.value(5);
  curveUpSlider.value(0);
  curveDownSlider.value(0);
  
  // 3. Ripristina Luce
  lightXSlider.value(200);
  lightYSlider.value(-200);
  lightZSlider.value(200);

  // 4. Ripristina Colore e Testo
  colorPicker.value('#ffffff');
  currentText = "Text";
  textInput.value("Text");
  
  // 5. Ripristina Font (opzionale: torna a quello di default)
  textFont(font); 
  
  // 6. Checkbox
  showLightCheckbox.checked(true);
}


function randomizeValues() {
  // Randomizziamo gli slider
  copiesSlider.value(random(0, 10));
  offsetSlider.value(random(10, 200));
  sizeSlider.value(random(40, 150));
  posYSlider.value(random(-200, 200));
  thicknessSlider.value(random(1, 40));
  
  // Randomizziamo la luce
  lightXSlider.value(random(-600, 600));
  lightYSlider.value(random(-600, 600));
  lightZSlider.value(random(-300, 500));

  // Randomizziamo la curvatura (o sopra o sotto)
  if (random() > 0.5) {
    curveUpSlider.value(random(0, 4));
    curveDownSlider.value(0);
  } else {
    curveDownSlider.value(random(0, 4));
    curveUpSlider.value(0);
  }

  // Randomizziamo il colore
  colorPicker.value(color(random(255), random(255), random(255)).toString('#rrggbb'));
  
  // Randomizziamo leggermente la rotazione
  rotX = random(TWO_PI);
  rotY = random(TWO_PI);
}

function handleFont(file) {
  if (file.subtype === 'otf' || file.subtype === 'ttf' || file.name.endsWith('.otf') || file.name.endsWith('.ttf')) {
    font = loadFont(file.data, () => {
      textFont(font);
    });
  }
}

function isMouseOverPanel() {
  let panelX = 20, panelY = 20;
  let panelW = 340, panelH = panel.elt.offsetHeight;
  return (mouseX > panelX && mouseX < panelX + panelW && mouseY > panelY && mouseY < panelY + panelH);
}

function draw() {
  background(15); 
  
  if (mouseIsPressed && !isMouseOverPanel()) {
    rotY += (mouseX - pmouseX) * 0.01;
    rotX += (mouseY - pmouseY) * 0.01;
  }

  let lx = lightXSlider.value(), ly = lightYSlider.value(), lz = lightZSlider.value();

  if (showLightCheckbox.checked()) {
    push();
    translate(lx, ly, lz);
    fill(255, 255, 0);
    noStroke();
    sphere(8);
    pop();
  }

  let isUp = curveUpSlider.value() > 0;
  let curvature = isUp ? curveUpSlider.value() : curveDownSlider.value(); 
  let fontSize = sizeSlider.value();
  let spessore = thicknessSlider.value();
  let numCopies = copiesSlider.value();
  let copyDist = offsetSlider.value();
  let letters = currentText.split("");
  let tc = colorPicker.color();

  rotateX(rotX);
  rotateY(rotY);
  translate(0, posYSlider.value(), 0); 

  for (let c = numCopies; c > 0; c--) {
    push();
    let zOffset = -c * copyDist;
    translate(0, 0, zOffset);
    let alpha = map(c, 0, numCopies, 150, 20);
    fill(red(tc), green(tc), blue(tc), alpha);
    renderText(letters, fontSize, spessore, curvature, isUp, lx, ly, lz, true);
    pop();
  }

  push();
  renderText(letters, fontSize, spessore, curvature, isUp, lx, ly, lz, false);
  pop();
}

function renderText(letters, fSize, thick, curv, up, lx, ly, lz, isRef) {
  let totalLetters = letters.length;
  let tc = colorPicker.color();
  textSize(fSize);
  
  for (let z = 0; z < thick; z++) {
    push();
    let zPos = z - thick / 2;
    translate(0, 0, zPos);
    
    for (let i = 0; i < totalLetters; i++) {
      push();
      let posX, posY;

      if (curv === 0) {
        posX = map(i, 0, totalLetters - 1, -totalLetters * fSize * 0.25, totalLetters * fSize * 0.25);
        if (totalLetters === 1) posX = 0;
        posY = 0;
        translate(posX, posY, 0);
      } else {
        let angle = map(i, 0, totalLetters - 1, -curv, curv);
        let radius = 250; 
        let centerOffset = up ? radius : -radius;
        posX = sin(angle) * radius;
        posY = cos(angle) * centerOffset + (up ? -radius : radius);
        translate(posX, posY, 0);
        rotateZ(up ? -angle : angle);
      }

      if (!isRef) {
        let d = dist(posX, posY, zPos, lx, ly, lz);
        let brightnessFactor = map(d, 0, 1000, 1.8, 0.4);
        fill(red(tc) * brightnessFactor, green(tc) * brightnessFactor, blue(tc) * brightnessFactor);
      }
      
      text(letters[i], 0, 0);
      pop();
    }
    pop();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}