// --- CONFIGURATION ---
const DURATION = 3; 
const FPS = 30; // 30 FPS is more compatible with "Photos" apps and saves memory
const TOTAL_FRAMES = DURATION * FPS;
let appState = 'CREATE';
let trailLayer; 

let drawnPoints = [];
let isFollowingPath = false;

let params = {
  pathType: 'circle',
  trailType: 'hearts',
  bodyType: 'cat',
  pathSize: 120,
  bgColor: '#2d1b4d',
  pathColor: '#ff77ff',
  bodyColor: '#ffffff',
  laps: 1
};

let uiElements = [];
let labels = [];
let homeBtn;

function setup() {
  // Canvas positioned to the right of the toolbar
  let canvas = createCanvas(400, 650);
  canvas.position(200, 10);
  canvas.style('image-rendering', 'pixelated');
  frameRate(FPS);
  
  trailLayer = createGraphics(400, 650);
  trailLayer.style('image-rendering', 'pixelated');

  // Retro CSS Styles
  createElement('style', `
    canvas { border: 6px double #ff99cc; box-shadow: 0 0 20px #ff99cc; border-radius: 10px; }
    body { background-color: #1a0a2e; font-family: "Courier New", monospace; color: #ff99cc; margin: 0; overflow: hidden; }
    .retro-ui { 
      background: #ffccff; color: #cc0066; border: 2px solid #ff6699; 
      padding: 5px; text-transform: uppercase; font-weight: bold; border-radius: 5px;
      font-size: 10px; width: 160px; cursor: pointer;
    }
    .retro-ui:hover { background: #ff99cc; color: white; }
    .label-text { font-size: 11px; font-weight: bold; color: #ff99cc; display: block; margin-bottom: 5px; }
  `);

  // --- TOOLBAR ---
  let startY = 20;
  let gap = 55;

  labels.push(createSpan('PATH TYPE').position(15, startY).addClass('label-text'));
  pathSelect = createSelect().position(15, startY + 20).addClass('retro-ui');
  ['circle', 'square', 'triangle', 'pentagon', 'hexagon', 'infinity', 'heart', 'star', 'spiral', 'wave', 'zigzag', 'leaf', 'flower', 'butterfly', 'diamond', 'cross', 'gear', 'moon', 'clover', 'atom', 'dna', 'DRAW'].forEach(o => pathSelect.option(o));
  
  labels.push(createSpan('TRAIL SYMBOL').position(15, startY + gap).addClass('label-text'));
  trailSelect = createSelect().position(15, startY + gap + 20).addClass('retro-ui');
  ['hearts', 'stars', 'cherries', 'sparkles', 'dots'].forEach(o => trailSelect.option(o));

  labels.push(createSpan('CHARACTER').position(15, startY + gap*2).addClass('label-text'));
  bodySelect = createSelect().position(15, startY + gap*2 + 20).addClass('retro-ui');
  ['cat', 'slime', 'bunny', 'ufo', 'ghost', 'princess', 'car', 'warrior'].forEach(o => bodySelect.option(o));

  labels.push(createSpan('SPEED').position(15, startY + gap*3).addClass('label-text'));
  speedSlider = createSlider(1, 4, 1, 1).position(15, startY + gap*3 + 20).style('width', '150px');

  labels.push(createSpan('BG / PATH COLOR').position(15, startY + gap*4).addClass('label-text'));
  bgPicker = createColorPicker(params.bgColor).position(15, startY + gap*4 + 20).size(75, 30);
  pathPicker = createColorPicker(params.pathColor).position(95, startY + gap*4 + 20).size(75, 30);

  let clearBtn = createButton('CLEAR CANVAS').position(15, startY + gap*5 + 10).addClass('retro-ui');
  let btn = createButton('✨ SAVE GIF ✨').position(15, startY + gap*6).addClass('retro-ui').size(160, 50);

  // --- SAVE LOGIC ---
  btn.mousePressed(() => {
    // Starts recording with a progress bar at the top
    saveGif('kawaii_animation', DURATION, {
      units: 'seconds',
      delay: 0,
      repeat: 0, // Infinite loop
      silent: false // Shows "Recording..." bar
    });
    
    // Delay the help screen so it doesn't interrupt the capture
    setTimeout(showHelp, (DURATION * 1000) + 500);
  });

  pathSelect.changed(() => { trailLayer.clear(); drawnPoints = []; isFollowingPath = false; }); 
  clearBtn.mousePressed(() => { trailLayer.clear(); drawnPoints = []; isFollowingPath = false; });

  uiElements = [pathSelect, trailSelect, bodySelect, speedSlider, bgPicker, pathPicker, btn, clearBtn];
  
  homeBtn = createButton('BACK TO EDIT').position(15, startY + gap*6).addClass('retro-ui').size(160, 50);
  homeBtn.mousePressed(showCreate);
  homeBtn.hide();
}

function keyPressed() {
  if (keyCode === ENTER && pathSelect.value() === 'DRAW' && drawnPoints.length > 0) {
    isFollowingPath = !isFollowingPath;
  }
}

function draw() {
  background(bgPicker.value());
  image(trailLayer, 0, 0);
  drawScanlines();

  if (appState === 'CREATE') {
    params.laps = speedSlider.value();
    let baseT = (frameCount % TOTAL_FRAMES) / TOTAL_FRAMES;
    let t = (baseT * params.laps) % 1;

    push();
    translate(width / 2, height / 2 - 50); 
    let pos = getPositionOnPath(t);

    if (pathSelect.value() === 'DRAW') {
      if (mouseIsPressed && mouseX > 200) { 
        let mx = mouseX - 200 - width/2;
        let my = mouseY - 10 - (height/2 - 50);
        drawnPoints.push({x: mx, y: my});
        trailLayer.push();
        trailLayer.translate(mouseX - 200, mouseY - 10);
        drawKawaiiSymbolBuffer(trailLayer, trailSelect.value());
        trailLayer.pop();
      }
    } else {
      drawKawaiiPath();
    }
    
    drawPixelCharacter(pos.x, pos.y, bodySelect.value());
    pop();

    drawRetroUI(baseT);
  } else {
    drawInstructionBox();
  }
}

function getPositionOnPath(t) {
  let x, y, s = params.pathSize;
  let type = pathSelect.value();
  let angle = TWO_PI * t;

  if (type === 'DRAW') {
    if (isFollowingPath && drawnPoints.length > 0) {
      let index = floor(t * (drawnPoints.length - 1));
      return drawnPoints[index];
    }
    return { x: mouseX - 200 - width/2, y: mouseY - 10 - (height/2 - 50) };
  }

  switch(type) {
    case 'circle': x = cos(angle)*s; y = sin(angle)*s; break;
    case 'infinity': x = s*cos(angle); y = s*sin(angle*2)/2; break;
    case 'heart': 
      x = 16*pow(sin(angle),3); 
      y = -(13*cos(angle)-5*cos(2*angle)-2*cos(3*angle)-cos(4*angle));
      x*=(s/15); y*=(s/15); break;
    case 'star': let r = s*(0.7+0.3*cos(angle*5)); x = r*cos(angle); y = r*sin(angle); break;
    case 'spiral': let sr = s*t; x = sr*cos(angle*3); y = sr*sin(angle*3); break;
    case 'wave': x = lerp(-s, s, t); y = sin(t*TWO_PI*2)*(s/2); break;
    case 'zigzag': x = lerp(-s, s, t); y = (floor(t*6)%2===0)?-s/2:s/2; break;
    case 'leaf': x = s*cos(angle)*(1+sin(angle)); y = s*sin(angle)*(1+sin(angle)); break;
    case 'flower': let fr = s*cos(angle*5); x = fr*cos(angle); y = fr*sin(angle); break;
    case 'butterfly': 
      let br = exp(sin(angle)) - 2*cos(4*angle) + pow(sin((2*angle-PI)/24),5);
      x = br*sin(angle)*(s/3); y = -br*cos(angle)*(s/3); break;
    case 'diamond': x = s*(pow(cos(angle),3)); y = s*(pow(sin(angle),3)); break;
    case 'cross': x = (abs(cos(angle)) > abs(sin(angle))) ? s*(cos(angle)>0?1:-1) : 0;
                  y = (abs(sin(angle)) > abs(cos(angle))) ? s*(sin(angle)>0?1:-1) : 0; break;
    case 'gear': let gr = s*(1+0.2*sin(angle*8)); x = gr*cos(angle); y = gr*sin(angle); break;
    case 'moon': x = s*cos(angle); y = s*sin(angle) - s*cos(angle)*0.5; break;
    case 'clover': let cr = s*cos(angle*3); x = cr*cos(angle); y = cr*sin(angle); break;
    case 'atom': x = s*cos(angle); y = s*sin(angle*3)*0.5; break;
    case 'dna': x = s*cos(angle); y = lerp(-s, s, t); break;
    default:
      let sides = {square:4, triangle:3, pentagon:5, hexagon:6}[type] || 4;
      let side = (t * sides) % sides;
      let i = floor(side);
      let a1 = TWO_PI * i / sides - HALF_PI;
      let a2 = TWO_PI * (i + 1) / sides - HALF_PI;
      x = lerp(cos(a1)*s, cos(a2)*s, side % 1);
      y = lerp(sin(a1)*s, sin(a2)*s, side % 1);
  }
  return { x, y };
}

function drawKawaiiSymbolBuffer(target, type) {
  target.noStroke();
  target.fill(pathPicker.value());
  let s = 3;
  if (type === 'hearts') {
    target.rect(-s, 0, s, s); target.rect(0, 0, s, s); target.rect(-s*2, -s, s, s); 
    target.rect(s, -s, s, s); target.rect(-s, s, s, s);
  } else if (type === 'stars') {
    target.rect(0, -s, s, s); target.rect(0, s, s, s); target.rect(-s, 0, s, s); target.rect(s, 0, s, s);
  } else if (type === 'cherries') {
    target.fill('#ff4466'); target.rect(-2, 2, 4, 4); target.rect(4, 2, 4, 4);
    target.fill('#44ff66'); target.rect(0, -2, 2, 4);
  } else if (type === 'sparkles') {
    target.rect(0,-6,2,2); target.rect(0,6,2,2); target.rect(-6,0,2,2); target.rect(6,0,2,2);
  } else { target.rect(0, 0, s, s); }
}

function drawKawaiiPath() {
  let steps = 60;
  for (let i = 0; i < 1; i += 1/steps) {
    let p = getPositionOnPath(i);
    push(); translate(p.x, p.y);
    drawKawaiiSymbolBuffer(this, trailSelect.value());
    pop();
  }
}

function drawPixelCharacter(x, y, type) {
  push(); translate(x, y); noStroke();
  if (type === 'cat') {
    fill(255); rect(-12, -8, 24, 16); rect(-12, -12, 8, 8); rect(4, -12, 8, 8);
    fill(0); rect(-6, -2, 4, 4); rect(2, -2, 4, 4); fill('#ff99cc'); rect(-2, 2, 4, 2);
  } else if (type === 'slime') {
    fill('#00ffcc'); rect(-16, 0, 32, 12); rect(-12, -8, 24, 20);
    fill(255); rect(-8, -2, 4, 4); rect(4, -2, 4, 4);
  } else if (type === 'bunny') {
    fill(255); rect(-8, -16, 6, 12); rect(2, -16, 6, 12); rect(-10, -4, 20, 16);
    fill('#ff99cc'); rect(-4, 2, 8, 4);
  } else if (type === 'ufo') {
    fill('#cccccc'); rect(-16, 0, 32, 8); fill('#00ffff'); rect(-8, -6, 16, 6);
    fill('#ff00ff'); rect(-12, 2, 4, 4); rect(8, 2, 4, 4);
  } else if (type === 'ghost') {
    fill(255, 200); rect(-12, -12, 24, 20); rect(-12, 8, 6, 4); rect(6, 8, 6, 4);
    fill(0); rect(-6, -2, 4, 4); rect(2, -2, 4, 4);
  } else if (type === 'princess') {
    fill('#ffeb3b'); rect(-10, -16, 20, 8); fill('#ffc1cc'); rect(-12, -8, 24, 24); 
    fill(255); rect(-8, 8, 16, 12); fill(0); rect(-6, -2, 3, 3); rect(3, -2, 3, 3);
  } else if (type === 'car') {
    fill('#ff3333'); rect(-16, 0, 32, 12); rect(-8, -8, 16, 8);
    fill('#333333'); rect(-12, 10, 6, 6); rect(6, 10, 6, 6); fill('#99ffff'); rect(4, -6, 4, 4);
  } else if (type === 'warrior') {
    fill('#999999'); rect(-10, -12, 20, 20); fill('#ffcc00'); rect(-2, -16, 4, 6);
    fill('#dddddd'); rect(10, -4, 4, 16); fill(0); rect(-6, -4, 12, 2);
  }
  pop();
}

function drawScanlines() {
  stroke(0, 30);
  for (let i = 0; i < height; i += 4) line(0, i, width, i);
}

function drawRetroUI(t) {
  fill(0); stroke('#ff99cc');
  rect(10, height - 25, width - 20, 15);
  fill('#ff99cc');
  rect(10, height - 25, (width - 20) * t, 15);
}

function showHelp() { 
  appState = 'HELP'; uiElements.forEach(el => el.hide()); labels.forEach(l => l.hide()); homeBtn.show(); 
}

function showCreate() { 
  appState = 'CREATE'; uiElements.forEach(el => el.show()); labels.forEach(l => l.show()); homeBtn.hide(); 
}

function drawInstructionBox() {
  fill(40, 0, 60, 230); stroke('#ff99cc'); strokeWeight(3);
  rect(20, 50, width - 40, 500, 15);
  fill('#ffccff'); noStroke(); textAlign(CENTER); textSize(18);
  text("✨ RECORDING ✨", width/2, 100);
  textSize(12); text("Check the progress bar at the top!", width/2, 140);
  text("Wait for the download to finish", width/2, 160);
  text("before importing to Photos.", width/2, 180);
  textSize(30); text("ฅ^•ﻌ•^ฅ", width/2, 300);
}