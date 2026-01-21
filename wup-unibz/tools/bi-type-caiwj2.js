const fontFamilies = [
  'Abril Fatface', 'Bangers', 'Creepster', 'Dancing Script', 'DotGothic16', 
  'Fredericka the Great', 'Lobster', 'Monoton', 'Orbitron', 'Pacifico', 
  'Press Start 2P', 'Rock Salt', 'Special Elite', 'Stalinist One', 'Rubik Beastly',
  'Alumni Sans Pinstripe', 'Bungee Shade', 'Codystar', 'Comfortaa', 'Eater',
  'Fascinate Inline', 'Faster One', 'Glass Antiqua', 'Gradual', 'Kumar One Outline',
  'Megrim', 'Metal Mania', 'Nosifer', 'Rye', 'UnifrakturMaguntia'
];

let inputField, colorPicker, rectColorPicker, strokeColorPicker, bgPicker, modeRadio;
let spacingSlider, strokeSlider, pathSelect, intensitySlider, tiltSlider;
let intensityLabel; 
let words = []; 
let showRects = true; 
const MENU_WIDTH = 280; 

// Variabili interazione
let selectedWord = null; 
let isResizing = false;
let isRotating = false; 
let isDragging = false; 

// Calcoli delta
let dragOffsetX, dragOffsetY;
let initialDist = 0; 
let initialScale = 1;
let initialMouseAngle = 0; 
let initialWordRotation = 0; 

function setup() {
  createCanvas(1200, 850); 
  
  let link = createElement('link');
  link.attribute('rel', 'stylesheet');
  link.attribute('href', 'https://fonts.googleapis.com/css2?' + 
    fontFamilies.map(f => 'family=' + f.replace(/ /g, '+')).join('&') + '&display=swap');

  // --- CONFIGURAZIONE GRIGLIA MENU ---
  let xStart = 25;
  let yPos = 30;
  let elementGap = 30; 
  let sectionGap = 65; 

  // --- 1. INPUT & INSTRUCTIONS ---
  createLabel('ADD TEXT:', xStart, yPos);
  inputField = createInput('').position(xStart, yPos + 25).size(230).changed(addNewWord);
  
  let info = createP(
    'Type & Press <b>ENTER</b> to add.<br>' +
    'Click to <b>Select</b> to edit props.<br>' +
    '<span style="color:#0055FF">■</span> Bottom-Right: <b>Resize</b><br>' +
    '<span style="color:#FF8C00">●</span> Top-Left: <b>Rotate</b><br>' +
    '<span style="color:#FF0000">✖</span> Top-Right: <b>Delete</b>'
  );
  info.position(xStart, yPos + 55);
  info.style('font-family', 'sans-serif').style('font-size', '11px').style('color', '#555').style('line-height', '1.6').style('margin', '0');

  // <--- MODIFICA SPAZIATURA: Aumentato da 70 a 90 per separare meglio la scritta
  yPos += sectionGap + 90; 

  // --- 2. COLORS ---
  createLabel('TEXT COLOR:', xStart, yPos);
  colorPicker = createColorPicker('#000000').position(xStart, yPos + 25);
  colorPicker.input(() => { if(selectedWord) for(let l of selectedWord.letters) l.color = colorPicker.color(); });

  createLabel('RECT COLOR:', xStart + 120, yPos);
  rectColorPicker = createColorPicker('#FFCC00').position(xStart + 120, yPos + 25);
  rectColorPicker.input(() => { if(selectedWord) for(let l of selectedWord.letters) l.rectColor = rectColorPicker.color(); });

  yPos += sectionGap;

  createLabel('STROKE COLOR:', xStart, yPos);
  strokeColorPicker = createColorPicker('#000000').position(xStart, yPos + 25);
  strokeColorPicker.input(() => {
    if (selectedWord) {
      selectedWord.strokeColor = strokeColorPicker.color();
    }
  });

  createLabel('BACKGROUND:', xStart + 120, yPos);
  bgPicker = createColorPicker('#FFFFFF').position(xStart + 120, yPos + 25);

  yPos += sectionGap;

  // --- 3. STROKE WEIGHT ---
  createLabel('STROKE WEIGHT:', xStart, yPos);
  strokeSlider = createSlider(0, 15, 0).position(xStart, yPos + 25).size(230);
  strokeSlider.input(() => {
    if (selectedWord) {
      selectedWord.strokeWeight = strokeSlider.value();
    }
  });

  yPos += sectionGap;

  // --- 4. CLICK ACTION ---
  createLabel('ON CLICK CHANGE:', xStart, yPos);
  modeRadio = createRadio();
  modeRadio.option('FONT', 'Font');
  modeRadio.option('COLOR', 'Color');
  modeRadio.option('RECT', 'Rect');
  modeRadio.option('SIZE', 'Size'); 
  modeRadio.selected('FONT');
  modeRadio.position(xStart, yPos + 25);
  modeRadio.style('width', '240px').style('display', 'grid').style('grid-template-columns', '1fr 1fr').style('gap', '5px');
  modeRadio.style('font-family', 'sans-serif').style('font-size', '11px').style('color', '#333');

  yPos += sectionGap + 10;

  // --- 5. PATH & GEOMETRY ---
  createLabel('PATH TYPE:', xStart, yPos);
  pathSelect = createSelect().position(xStart, yPos + 25).size(235);
  pathSelect.option('LINEAR'); pathSelect.option('WAVE'); pathSelect.option('ARC'); pathSelect.option('ZIG-ZAG');
  
  pathSelect.changed(() => {
    if (selectedWord) {
      selectedWord.pathType = pathSelect.value();
      calculateLayout();
    }
    toggleIntensity(); 
  });

  yPos += sectionGap;

  createLabel('SPACING:', xStart, yPos);
  spacingSlider = createSlider(0, 100, 40).position(xStart, yPos + 25).size(230);
  spacingSlider.input(() => {
    if (selectedWord) {
      selectedWord.spacing = spacingSlider.value();
      calculateLayout();
    }
  });

  yPos += sectionGap;

  intensityLabel = createLabel('INTENSITY:', xStart, yPos);
  intensitySlider = createSlider(1, 300, 100).position(xStart, yPos + 25).size(230);
  intensitySlider.input(() => {
    if (selectedWord) {
      selectedWord.intensity = intensitySlider.value();
      calculateLayout();
    }
  });

  yPos += sectionGap;

  createLabel('TILT (ROTATION):', xStart, yPos);
  tiltSlider = createSlider(0, PI/2, 0, 0.01).position(xStart, yPos + 25).size(230);
  tiltSlider.input(() => {
    if (selectedWord) {
      selectedWord.tilt = tiltSlider.value();
      calculateLayout();
    }
  });

  yPos += sectionGap + 10;

  // --- 6. ACTIONS ---
  let btnToggle = createButton('RECT: ON').position(xStart, yPos).size(110).mousePressed(() => {
    showRects = !showRects;
    btnToggle.html(showRects ? 'RECT: ON' : 'RECT: OFF');
  });

  createButton('CLEAR ALL').position(xStart + 120, yPos).size(110).mousePressed(() => {
    words = [];
    selectedWord = null;
  });

  yPos += 45; 

  createButton('SAVE PNG (NO BACKGROUND)')
    .position(xStart, yPos)
    .size(230)
    .mousePressed(() => exportImage('png'));
  
  yPos += 35;

  createButton('SAVE JPG (WITH BACKGROUND)')
    .position(xStart, yPos)
    .size(230)
    .mousePressed(() => exportImage('jpg'));

  textAlign(LEFT, BASELINE);
  toggleIntensity();
}

function createLabel(txt, x, y) {
  let p = createP(txt);
  p.position(x, y);
  p.style('font-family', 'sans-serif').style('font-size', '10px').style('font-weight', '700').style('letter-spacing', '0.5px');
  p.style('margin', '0').style('color', '#222').style('text-transform', 'uppercase');
  return p; 
}

function toggleIntensity() {
  let type = pathSelect.value();
  if (type === 'LINEAR') {
    intensitySlider.hide();
    intensityLabel.hide();
  } else {
    intensitySlider.show();
    intensityLabel.show();
  }
}

function addNewWord() {
  let str = inputField.value();
  if (str.trim() === "") return;

  let newWordGroup = {
    x: MENU_WIDTH + (width - MENU_WIDTH)/2 + random(-50, 50), 
    y: height/2 + random(-50, 50),
    scale: 1.0, 
    rotation: 0, 
    width: 0,   
    height: 100, 
    pathType: pathSelect.value(),
    spacing: spacingSlider.value(),
    intensity: intensitySlider.value(),
    tilt: tiltSlider.value(),
    strokeWeight: strokeSlider.value(),
    strokeColor: strokeColorPicker.color(),
    letters: []
  };

  for (let i = 0; i < str.length; i++) {
    newWordGroup.letters.push({
      char: str[i], 
      localX: 0, localY: 0, angle: 0, 
      noiseSeed: random(1000), noiseTilt: 0,
      font: random(fontFamilies), size: 70, 
      color: colorPicker.color(), 
      rectColor: rectColorPicker.color()
    });
  }
  
  words.push(newWordGroup);
  selectedWord = newWordGroup; 
  inputField.value(''); 
  calculateLayout();
}

function draw() {
  background(bgPicker.color());
  
  push();
  fill(248); noStroke(); 
  rect(0, 0, MENU_WIDTH, height);
  stroke(220); 
  line(MENU_WIDTH, 0, MENU_WIDTH, height); 
  pop();

  for (let w of words) {
    push();
    translate(w.x, w.y); 
    rotate(w.rotation);  
    scale(w.scale);      

    for (let l of w.letters) {
      push();
      translate(l.localX, l.localY);
      rotate(l.angle + l.noiseTilt);
      
      textFont(l.font);
      textSize(l.size);
      let tw = textWidth(l.char);
      let asc = textAscent();
      let desc = textDescent();

      if (showRects && l.char !== " ") {
        fill(l.rectColor);
        noStroke();
        rectMode(CENTER);
        rect(tw/2, (-asc + desc)/2, tw + (l.size * 0.2), (asc + desc) * 1.1);
      }

      stroke(w.strokeColor);
      strokeWeight(w.strokeWeight);
      
      fill(l.color);
      text(l.char, 0, 0);
      pop();
    }

    if (w === selectedWord) {
      drawSelectionUI(w);
    }
    pop();
  }
}

function drawSelectionUI(w) {
  let boxW = w.width + 40;
  let boxH = w.height + 40;
  
  push();
  noFill();
  stroke(0, 100, 255);
  strokeWeight(1 / w.scale); 
  drawingContext.setLineDash([5, 5]);
  rectMode(CENTER);
  rect(0, 0, boxW, boxH);
  drawingContext.setLineDash([]); 

  let handleSize = 14 / w.scale; 

  // 1. Resize Handle (Bottom-Right)
  let resizeX = boxW/2;
  let resizeY = boxH/2;
  fill(0, 100, 255); noStroke(); rectMode(CENTER);
  rect(resizeX, resizeY, handleSize, handleSize);
  stroke(255); strokeWeight(2 / w.scale);
  line(resizeX - handleSize/3, resizeY - handleSize/3, resizeX + handleSize/3, resizeY + handleSize/3);
  
  // 2. Rotate Handle (Top-Left)
  let rotateX = -boxW/2;
  let rotateY = -boxH/2;
  fill(255, 140, 0); noStroke();
  ellipse(rotateX, rotateY, handleSize, handleSize);
  noFill(); stroke(255); strokeWeight(2 / w.scale);
  arc(rotateX, rotateY, handleSize*0.6, handleSize*0.6, 0, PI + HALF_PI);

  // 3. DELETE Handle (Top-Right)
  let deleteX = boxW/2;
  let deleteY = -boxH/2;
  fill(255, 0, 0); noStroke();
  ellipse(deleteX, deleteY, handleSize, handleSize);
  
  stroke(255); strokeWeight(2.5 / w.scale);
  let crossSize = handleSize * 0.25;
  line(deleteX - crossSize, deleteY - crossSize, deleteX + crossSize, deleteY + crossSize);
  line(deleteX + crossSize, deleteY - crossSize, deleteX - crossSize, deleteY + crossSize);

  pop();
}

function calculateLayout() {
  for (let w of words) {
    let type = w.pathType;        
    let spacing = w.spacing;      
    let intensity = w.intensity;  
    let tiltVal = w.tilt;         

    let totalW = 0;
    for (let l of w.letters) { 
        textFont(l.font); textSize(l.size); 
        totalW += textWidth(l.char) + spacing; 
    }
    w.width = totalW; 
    w.height = 100 + (intensity/2); 

    let startX = -totalW / 2;
    let currentPos = 0;

    for (let i = 0; i < w.letters.length; i++) {
      let l = w.letters[i];
      textFont(l.font); textSize(l.size);
      let tw = textWidth(l.char);
      l.noiseTilt = map(noise(l.noiseSeed), 0, 1, -tiltVal, tiltVal);
      
      let x, y, angle = 0;
      let effectivePos = startX + currentPos;

      if (type === 'LINEAR') {
        x = effectivePos; y = 0;
      } else if (type === 'WAVE') {
        x = effectivePos;
        y = sin(effectivePos * 0.01) * intensity;
        angle = cos(effectivePos * 0.01) * (intensity * 0.005);
      } else if (type === 'ARC') {
        let r = 5000 / (intensity * 0.1); 
        let theta = map(effectivePos, -totalW/2, totalW/2, -PI/5, PI/5); 
        let centerY = r - (intensity * 0.5);
        x = r * sin(theta); y = centerY - r * cos(theta); 
        angle = theta;
      } else if (type === 'ZIG-ZAG') {
        x = effectivePos;
        let frequency = 0.05;
        y = (Math.abs((effectivePos * frequency) % 2 - 1) * 2 - 1) * intensity;
        angle = ((effectivePos * frequency) % 2 > 1) ? 0.2 : -0.2;
      }
      
      l.localX = x; l.localY = y; l.angle = angle;
      currentPos += tw + spacing;
    }
  }
}

function mousePressed() {
  if (mouseX < MENU_WIDTH) return; 

  if (selectedWord) {
    let w = selectedWord;
    let dx = mouseX - w.x;
    let dy = mouseY - w.y;
    // Trasforma le coordinate del mouse nello spazio locale della parola
    let localMouseX = dx * cos(-w.rotation) - dy * sin(-w.rotation);
    let localMouseY = dx * sin(-w.rotation) + dy * cos(-w.rotation);
    localMouseX /= w.scale;
    localMouseY /= w.scale;

    let boxW = w.width + 40;
    let boxH = w.height + 40;
    
    // Check Resize (Bottom-Right)
    if (dist(localMouseX, localMouseY, boxW/2, boxH/2) < 20) {
      isResizing = true;
      initialDist = dist(w.x, w.y, mouseX, mouseY);
      initialScale = w.scale;
      return;
    }

    // Check Rotate (Top-Left)
    if (dist(localMouseX, localMouseY, -boxW/2, -boxH/2) < 20) {
      isRotating = true;
      initialMouseAngle = atan2(mouseY - w.y, mouseX - w.x);
      initialWordRotation = w.rotation;
      return;
    }

    // Check DELETE (Top-Right)
    if (dist(localMouseX, localMouseY, boxW/2, -boxH/2) < 20) {
      let index = words.indexOf(w);
      if (index > -1) {
        words.splice(index, 1);
      }
      selectedWord = null;
      return; 
    }
  }

  let clickedAny = false;
  
  for (let i = words.length - 1; i >= 0; i--) {
    let w = words[i];
    let dx = mouseX - w.x;
    let dy = mouseY - w.y;
    let localX = dx * cos(-w.rotation) - dy * sin(-w.rotation);
    let localY = dx * sin(-w.rotation) + dy * cos(-w.rotation);
    localX /= w.scale;
    localY /= w.scale;

    let halfW = w.width / 2 + 20; 
    let halfH = w.height / 2 + 30;

    if (Math.abs(localX) < halfW && Math.abs(localY) < halfH) {
      clickedAny = true;
      selectedWord = w; 

      pathSelect.selected(w.pathType);
      spacingSlider.value(w.spacing);
      intensitySlider.value(w.intensity);
      tiltSlider.value(w.tilt);
      strokeSlider.value(w.strokeWeight);
      strokeColorPicker.value(w.strokeColor);
      
      toggleIntensity(); 
      
      let m = modeRadio.value();
      let internalClick = false;

      for (let l of w.letters) {
        if (dist(localX, localY, l.localX + textWidth(l.char)/2, l.localY) < 50) {
           if (m === 'FONT') l.font = random(fontFamilies);
           else if (m === 'COLOR') l.color = color(random(255), random(255), random(255));
           else if (m === 'RECT') l.rectColor = color(random(255), random(255), random(255));
           else if (m === 'SIZE') l.size = random(30, 160);
           calculateLayout();
           internalClick = true;
           break;
        }
      }

      if (!internalClick) {
        isDragging = true;
        dragOffsetX = w.x - mouseX;
        dragOffsetY = w.y - mouseY;
      }
      return; 
    }
  }

  if (!clickedAny) {
    selectedWord = null;
  }
}

function mouseDragged() {
  if (isResizing && selectedWord) {
    let currentDist = dist(selectedWord.x, selectedWord.y, mouseX, mouseY);
    let newScale = initialScale * (currentDist / initialDist);
    selectedWord.scale = max(0.1, newScale); 
  } else if (isRotating && selectedWord) {
    let currentMouseAngle = atan2(mouseY - selectedWord.y, mouseX - selectedWord.x);
    let angleDiff = currentMouseAngle - initialMouseAngle;
    selectedWord.rotation = initialWordRotation + angleDiff;
  } else if (isDragging && selectedWord) {
    selectedWord.x = mouseX + dragOffsetX;
    selectedWord.y = mouseY + dragOffsetY;
  }
}

function mouseReleased() {
  isResizing = false;
  isDragging = false;
  isRotating = false;
}

function exportImage(ext) {
  let w = width - MENU_WIDTH;
  let h = height;
  let pg = createGraphics(w, h);
  
  if (ext === 'png') {
    pg.clear(); 
  } else {
    pg.background(bgPicker.color());
  }

  pg.translate(-MENU_WIDTH, 0); 
  pg.textAlign(LEFT, BASELINE);

  for (let wGroup of words) {
      pg.push();
      pg.translate(wGroup.x, wGroup.y);
      pg.rotate(wGroup.rotation); 
      pg.scale(wGroup.scale);
      
      for (let l of wGroup.letters) {
        pg.push();
        pg.translate(l.localX, l.localY);
        pg.rotate(l.angle + l.noiseTilt);
        pg.textFont(l.font);
        pg.textSize(l.size);
        let tw = pg.textWidth(l.char);
        let asc = pg.textAscent();
        let desc = pg.textDescent();

        if (showRects && l.char !== " ") {
          pg.fill(l.rectColor); pg.noStroke(); pg.rectMode(CENTER);
          pg.rect(tw/2, (-asc + desc)/2, tw + (l.size * 0.2), (asc + desc) * 1.1);
        }
        
        pg.stroke(wGroup.strokeColor);
        pg.strokeWeight(wGroup.strokeWeight);
        
        pg.fill(l.color);
        pg.text(l.char, 0, 0);
        pg.pop();
      }
      pg.pop();
  }
  save(pg, "collage_artwork." + ext);
}