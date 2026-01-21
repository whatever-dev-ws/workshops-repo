// WUP 25-26
// Lara Spitaler
let angle = 0;
let shapeType = 'sphere';
let animType = 'nebula'; 
let hueValue = 0;
let speedSlider;
let zoomAngle = 0;


let currentPos;
let targetPos;


const shapes = ['sphere', 'box', 'torus', 'cylinder', 'cone', 'pyramid', 'tube', 'hyperboloid'];


function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  colorMode(HSB, 360, 100, 100, 100);
  
  currentPos = createVector(0, 0);
  targetPos = createVector(0, 0);


  let container = createDiv();
  container.style('position', 'absolute');
  container.style('bottom', '20px');
  container.style('left', '20px');
  container.style('display', 'flex');
  container.style('flex-direction', 'column');
  container.style('gap', '5px');


  setupUI(container);
}


function draw() {
  background(0);
  hueValue = (hueValue + 1.2) % 360;
  
  if (mouseIsPressed) {
    targetPos.set(mouseX - width / 2, mouseY - height / 2);
  } else {
    targetPos.set(0, 0);
  }
  
  currentPos.lerp(targetPos, 0.1);


  pointLight(hueValue, 100, 100, currentPos.x, currentPos.y, 600);
  pointLight((hueValue + 180) % 360, 100, 100, -currentPos.x, -currentPos.y, 600);
  ambientLight(5);


  orbitControl(); 


  zoomAngle += 0.01;
  let zoomFactor = map(sin(zoomAngle), -1, 1, 0.7, 1.3);
  
  let deformX = map(currentPos.x, -width/2, width/2, 0.7, 1.4);
  let deformY = map(currentPos.y, -height/2, height/2, 0.7, 1.4);


  push();
  scale(zoomFactor);


  for (let i = 0; i < 2; i++) {
    push();
    translate(currentPos.x, currentPos.y, 0); 
    applyFlowingAnimation(i);
    
    let sz = 120 + i * 80;
    
    // --- INTENSIVE LED GLOW PASSES ---
    stroke((hueValue + 20) % 360, 100, 100, 15);
    strokeWeight(8);
    drawDenseWireframe(sz, deformX, deformY, 1);


    stroke((hueValue + 200) % 360, 100, 100, 30);
    strokeWeight(4);
    drawDenseWireframe(sz, deformX, deformY, -1);


    stroke(hueValue, 40, 100, 100); 
    strokeWeight(1.5);
    drawDenseWireframe(sz, deformX, deformY, 0);
    
    pop();
  }
  pop();


  angle += speedSlider.value();
}


function drawDenseWireframe(sz, defX, defY, glitch) {
  let detail = 24; 
  let offset = sin(angle * 5) * glitch * 3;
  noFill();


  for (let j = 0; j <= detail; j++) {
    beginShape();
    let lat = map(j, 0, detail, 0, PI);
    for (let k = 0; k <= detail; k++) {
      let lon = map(k, 0, detail, 0, TWO_PI);
      let pos = calculateBaseShape(lat, lon, sz);
      vertex(pos.x * defX + offset, pos.y * defY + offset, pos.z);
    }
    endShape();
  }


  for (let k = 0; k <= detail; k++) {
    beginShape();
    let lon = map(k, 0, detail, 0, TWO_PI);
    for (let j = 0; j <= detail; j++) {
      let lat = map(j, 0, detail, 0, PI);
      let pos = calculateBaseShape(lat, lon, sz);
      vertex(pos.x * defX, pos.y * defY, pos.z + offset);
    }
    endShape();
  }
}


function calculateBaseShape(lat, lon, sz) {
  let x, y, z;
  if (shapeType === 'sphere') {
    x = sz * sin(lat) * cos(lon);
    y = sz * sin(lat) * sin(lon);
    z = sz * cos(lat);
  } else if (shapeType === 'box') {
    let r = sz * 1.1;
    x = r * pow(abs(cos(lon)), 0.2) * sign(cos(lon)) * pow(abs(sin(lat)), 0.2) * sign(sin(lat));
    y = r * pow(abs(sin(lon)), 0.2) * sign(sin(lon)) * pow(abs(sin(lat)), 0.2) * sign(sin(lat));
    z = r * pow(abs(cos(lat)), 0.2) * sign(cos(lat));
  } else if (shapeType === 'torus') {
    let r1 = sz; let r2 = sz * 0.5;
    x = (r1 + r2 * cos(lat)) * cos(lon);
    y = (r1 + r2 * cos(lat)) * sin(lon);
    z = r2 * sin(lat);
  } else if (shapeType === 'cylinder') {
    x = sz * cos(lon); y = sz * sin(lon);
    z = map(lat, 0, PI, -sz * 1.5, sz * 1.5);
  } else if (shapeType === 'cone') {
    let r = map(lat, 0, PI, 0, sz);
    x = r * cos(lon); y = r * sin(lon);
    z = map(lat, 0, PI, sz, -sz);
  } else if (shapeType === 'pyramid') {
    let r = map(lat, 0, PI, 0, sz);
    x = r * (abs(cos(lon)) > 0.5 ? sign(cos(lon)) : cos(lon));
    y = r * (abs(sin(lon)) > 0.5 ? sign(sin(lon)) : sin(lon));
    z = map(lat, 0, PI, sz, -sz);
  } else if (shapeType === 'tube') {
    x = (sz * 0.8) * cos(lon); y = (sz * 0.8) * sin(lon);
    z = map(lat, 0, PI, -sz * 2.5, sz * 2.5);
  } else if (shapeType === 'hyperboloid') {
    let v = map(lat, 0, PI, -1.5, 1.5);
    x = sz * 0.5 * sqrt(1 + v*v) * cos(lon);
    y = sz * 0.5 * sqrt(1 + v*v) * sin(lon);
    z = sz * v;
  }
  return {x, y, z};
}


function sign(n) { return n >= 0 ? 1 : -1; }


function applyFlowingAnimation(i) {
  let speedMult = angle * (1 + i * 0.1);
  if (animType === 'nebula') {
    rotateY(speedMult * 0.15);
    rotateZ(speedMult * 0.05);
  } else if (animType === 'vortex') {
    rotateZ(speedMult);
    rotateX(sin(angle) * 0.3);
  } else if (animType === 'liquid') {
    rotateX(speedMult * 0.3);
    rotateY(speedMult * 0.2);
  } else if (animType === 'pulsar') {
    let p = sin(speedMult * 2) * 0.4;
    scale(1 + p);
    rotateX(speedMult * 0.5);
    rotateZ(speedMult * 0.2);
  } else if (animType === 'elastic') {
    let eX = sin(speedMult * 10) * 10;
    let eY = cos(speedMult * 10) * 10;
    translate(eX, eY, 0);
    rotateY(speedMult);
  }
}


function setupUI(container) {
  let shapeBtn = createButton('💎 NEXT STRUCTURE');
  shapeBtn.mousePressed(() => {
    shapeType = shapes[(shapes.indexOf(shapeType) + 1) % shapes.length];
  });
  styleBtn(shapeBtn, container);


  let animBtn = createButton('🌊 Movement');
  animBtn.mousePressed(() => {
    const anims = ['nebula', 'vortex', 'liquid', 'pulsar', 'elastic'];
    animType = anims[(anims.indexOf(animType) + 1) % anims.length];
  });
  styleBtn(animBtn, container);


  let label = createSpan('Cycle Speed');
  label.style('color', 'white');
  label.parent(container);
  
  speedSlider = createSlider(0.01, 0.1, 0.03, 0.005);
  speedSlider.parent(container);


  let saveBtn = createButton('💾 EXPORT GifTool.png');
  saveBtn.mousePressed(() => saveGif('GifTool.png', 5));
  styleBtn(saveBtn, container);
}


function styleBtn(btn, parent) {
  btn.parent(parent);
  btn.style('background', '#000');
  btn.style('color', '#00FFCC'); 
  btn.style('border', '1px solid #00FFCC');
  btn.style('padding', '10px');
  btn.style('font-family', 'monospace');
  btn.style('text-transform', 'uppercase');
  btn.style('cursor', 'pointer');
}