//WUP 2025-26
//Marwa Charaf

// =======================
// GLOBAL VARIABLES
// =======================

let selForma, selColore;
let pickerSfondo, pickerInterno, pickerEsterno;
let sliderVelocita; 
let btnRandom, btnGif;

// --- SHAPE CONTROLS ---
let pickerStrokeForma, sliderStrokeForma, sliderDimForma;

// --- DRAWING CONTROLS (CON BRUSH TYPES) ---
let pickerDraw, sliderDrawSize, btnClearDraw, selBrushType; 
let drawings = []; // Stores all paths
let currentDrawing = null; 

// --- TEXT VARIABLES ---
let inpTesto, pickerTesto, pickerStrokeTesto, sliderDimTesto, selFont;

// --- PERFECT LOOP VARIABLES ---
let isLooping = false;
let loopFrames = 0;
let startLoopFrame = 0;

// --- PARTICLES ---
let particelle = []; 

// =======================
// FUNCTION setup()
// =======================
function setup() {
  // 1. CREAZIONE CANVAS E IMPOSTAZIONI SALVATAGGIO (CRUCIALE)
  createCanvas(windowWidth, windowHeight); 
  
  // *** FIX PER GIF: ***
  pixelDensity(1); // Evita che schermi Retina/4K creino file giganti e corrotti
  frameRate(30);   // 30fps sono sufficienti per una GIF e pesano la metà di 60fps
  
  rectMode(CENTER);
  textAlign(CENTER, CENTER);

  // Initialize Particles
  for(let i=0; i<100; i++){
    particelle.push(new Particella());
  }

  // --- UI (COMMAND BAR) ---
  let bar = createDiv();
  bar.style(`
    position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
    display: flex; gap: 15px; align-items: flex-start; padding: 15px 25px;
    background: rgba(10, 10, 15, 0.85); backdrop-filter: blur(20px);
    border-radius: 20px; font-family: 'Inter', sans-serif; color: white;
    box-shadow: 0 20px 50px rgba(0,0,0,0.8); border: 1px solid rgba(255,255,255,0.1);
    z-index: 1000; scale: 0.85; 
  `);

  // GROUP 1: SHAPE
  let grpForma = creaGruppo('SHAPE', bar);
  
  selForma = createSelect();
  ['Heart', 'Moon', 'Circle', 'Square', 'Star', 'Flower'].forEach(o => selForma.option(o));
  selForma.selected('Heart');
  styleControl(selForma, grpForma);
  creaEtichetta('GEOMETRY TYPE', grpForma);

  let divSize = createDiv(); divSize.parent(grpForma); styleCell(divSize);
  divSize.style('margin-top: 5px; width: 100%;');
  sliderDimForma = createSlider(0.5, 2.0, 1.0, 0.1); 
  sliderDimForma.parent(divSize); 
  sliderDimForma.style('width: 100%;');
  creaEtichetta('SHAPE SIZE', divSize);

  let rowBordo = createDiv(); rowBordo.parent(grpForma);
  rowBordo.style('display:flex; gap:8px; margin-top:4px; border-top:1px solid rgba(255,255,255,0.1); padding-top:4px;');

  let dBordoCol = createDiv(); dBordoCol.parent(rowBordo); styleCell(dBordoCol);
  pickerStrokeForma = createColorPicker('#FFFFFF'); styleColor(pickerStrokeForma, dBordoCol);
  creaEtichetta('BORDER', dBordoCol); 

  let dBordoThk = createDiv(); dBordoThk.parent(rowBordo); styleCell(dBordoThk);
  sliderStrokeForma = createSlider(0, 10, 0, 0.5); 
  sliderStrokeForma.parent(dBordoThk); sliderStrokeForma.style('width:50px;');
  creaEtichetta('THICKNESS', dBordoThk); 

  // GROUP 2: PALETTE
  let grpColori = creaGruppo('PALETTE', bar);
  let rowColori = createDiv(); rowColori.parent(grpColori);
  rowColori.style('display: grid; grid-template-columns: 1fr 1fr; gap: 10px; place-items: center;');
  
  let c1 = createDiv(); c1.parent(rowColori); styleCell(c1);
  pickerInterno = createColorPicker('#ff0055'); styleColor(pickerInterno, c1);
  creaEtichetta('INNER COLOR', c1);

  let c2 = createDiv(); c2.parent(rowColori); styleCell(c2);
  pickerEsterno = createColorPicker('#ffcc00'); styleColor(pickerEsterno, c2);
  creaEtichetta('OUTER GLOW', c2);

  let c3 = createDiv(); c3.parent(rowColori); styleCell(c3);
  pickerSfondo = createColorPicker('#050203'); styleColor(pickerSfondo, c3);
  creaEtichetta('BACKGROUND', c3);

  let c4 = createDiv(); c4.parent(rowColori); styleCell(c4);
  selColore = createSelect();
  ['Static', 'Rainbow', 'Gradient'].forEach(o => selColore.option(o));
  selColore.selected('Gradient');
  styleControl(selColore, c4);
  selColore.style('width: 60px;');
  creaEtichetta('COLOR MODE', c4);

  // GROUP 3: DRAW (CON SELETTORE BRUSH)
  let grpDraw = creaGruppo('DRAW', bar);
  let rowDraw = createDiv(); rowDraw.parent(grpDraw); 
  rowDraw.style('display:flex; gap:10px; align-items:center;');

  let dDrawCol = createDiv(); dDrawCol.parent(rowDraw); styleCell(dDrawCol);
  
  // -- Selector Brush --
  selBrushType = createSelect();
  ['Pen', 'Neon', 'Dots', 'Spray', 'Square'].forEach(o => selBrushType.option(o));
  selBrushType.selected('Pen');
  styleControl(selBrushType, dDrawCol);
  selBrushType.style('width: 60px; margin-bottom: 2px;');

  pickerDraw = createColorPicker('#00FFFF'); styleColor(pickerDraw, dDrawCol);
  creaEtichetta('BRUSH / COLOR', dDrawCol);

  let dDrawSize = createDiv(); dDrawSize.parent(rowDraw); styleCell(dDrawSize);
  sliderDrawSize = createSlider(1, 30, 3, 1); 
  sliderDrawSize.parent(dDrawSize); sliderDrawSize.style('width:50px;');
  creaEtichetta('SIZE', dDrawSize);

  let dClear = createDiv(); dClear.parent(grpDraw); styleCell(dClear);
  dClear.style('margin-top:5px;');
  btnClearDraw = createButton('CLEAR');
  styleWideButton(btnClearDraw, dClear);
  btnClearDraw.mousePressed(() => { drawings = []; });

  // GROUP 4: TEXT
  let grpTesto = creaGruppo('TEXT', bar);
  inpTesto = createInput('');
  inpTesto.attribute('placeholder', 'Type here...');
  inpTesto.parent(grpTesto);
  inpTesto.style(`width: 100px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.2); color: white; padding: 4px; border-radius: 4px; outline:none; font-size: 11px; margin-bottom: 4px; text-align:center;`);

  selFont = createSelect();
  selFont.option('Georgia', 'Georgia');
  selFont.option('Sans-Serif', 'Helvetica');
  selFont.option('Monospace', 'Courier New');
  selFont.option('Impact', 'Impact');
  selFont.option('Script', 'Brush Script MT');
  selFont.parent(grpTesto);
  styleControl(selFont, grpTesto);
  selFont.style('width: 110px; margin-bottom: 6px;');

  let rowTxtCtrls = createDiv(); rowTxtCtrls.parent(grpTesto);
  rowTxtCtrls.style('display: flex; gap: 10px; align-items: center;');
  
  let divFill = createDiv(); divFill.parent(rowTxtCtrls); styleCell(divFill);
  pickerTesto = createColorPicker('#FFFFFF'); styleColor(pickerTesto, divFill);
  creaEtichetta('TEXT FILL', divFill);

  let divStrk = createDiv(); divStrk.parent(rowTxtCtrls); styleCell(divStrk);
  pickerStrokeTesto = createColorPicker('#FF0055'); styleColor(pickerStrokeTesto, divStrk);
  creaEtichetta('TEXT STROKE', divStrk);

  let divSld = createDiv(); divSld.parent(rowTxtCtrls); styleCell(divSld);
  sliderDimTesto = createSlider(10, 150, 60, 1);
  sliderDimTesto.parent(divSld); sliderDimTesto.style('width: 50px;');
  creaEtichetta('FONT SIZE', divSld);

  // GROUP 5: MOTION
  let grpAnim = creaGruppo('MOTION', bar);
  let divSpd = createDiv(); divSpd.parent(grpAnim); styleCell(divSpd);
  sliderVelocita = createSlider(0.005, 0.1, 0.02, 0.005);
  sliderVelocita.parent(divSpd);
  sliderVelocita.style('width', '80px;');
  creaEtichetta('ANIMATION SPEED', divSpd);

  // GROUP 6: ACTIONS
  let grpAzioni = creaGruppo('ACTIONS', bar);
  let rowAzioni = createDiv(); rowAzioni.parent(grpAzioni); rowAzioni.style('display: flex; gap: 8px;');

  let divRnd = createDiv(); divRnd.parent(rowAzioni); styleCell(divRnd);
  btnRandom = createButton('✦');
  styleButton(btnRandom, divRnd);
  btnRandom.mousePressed(randomizza);
  creaEtichetta('RANDOMIZE', divRnd);

  let divGif = createDiv(); divGif.parent(rowAzioni); styleCell(divGif);
  btnGif = createButton('REC');
  styleButton(btnGif, divGif);
  btnGif.style('color: #ff5555; font-weight: bold;');
  creaEtichetta('RECORD GIF', divGif);

  // --- GIF LOGIC ROBUSTA ---
  btnGif.mousePressed(() => {
    // Calcoliamo una durata fissa per sicurezza o basata sul testo
    let framesDaRegistrare = 180; // 6 secondi a 30fps (Standard stabile)
    
    // Logica opzionale: estendi se c'è testo lungo
    if (inpTesto.value().length > 10) {
        framesDaRegistrare = 240; // 8 secondi
    }

    loopFrames = framesDaRegistrare;
    startLoopFrame = frameCount;
    isLooping = true;

    // Salvataggio ottimizzato
    saveGif('magic_loop', framesDaRegistrare, { 
      units: 'frames', 
      delay: 0
    });

    // Reset flag dopo la registrazione (stima tempo + buffer)
    setTimeout(() => { isLooping = false; }, (framesDaRegistrare / 30 * 1000) + 2000);
  });
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// =======================
// MOUSE INTERACTION
// =======================
function mousePressed() {
  if (mouseY < height - 120) {
    let newStroke = {
      path: [{x: mouseX, y: mouseY}],
      col: color(pickerDraw.color()),
      size: sliderDrawSize.value(),
      type: selBrushType.value() // Salva il tipo di brush
    };
    drawings.push(newStroke);
  }
}

function mouseDragged() {
  if (drawings.length > 0 && mouseY < height - 120) {
    let currentStroke = drawings[drawings.length - 1];
    currentStroke.path.push({x: mouseX, y: mouseY});
  }
}

// =======================
// FUNCTION DRAW
// =======================
function draw() {
  colorMode(HSB, 360, 100, 100, 100);
  let bgCol = color(pickerSfondo.color());
  
  // 1. BACKGROUND
  background(bgCol);
  push();
  blendMode(MULTIPLY);
  let ctx = drawingContext;
  let gradient = ctx.createRadialGradient(width/2, height/2, width*0.1, width/2, height/2, width*0.8);
  gradient.addColorStop(0, "rgba(0,0,0,0)");
  gradient.addColorStop(1, "rgba(0,0,0,0.6)");
  ctx.fillStyle = gradient;
  rect(width/2, height/2, width, height);
  pop();

  // 2. PARTICLES
  if(!isLooping) disegnaParticelleSfondo();

  // 3. RENDER DRAWINGS (CON SWITCH BRUSH)
  push();
  strokeJoin(ROUND);
  strokeCap(ROUND);
  
  for(let d of drawings){
    stroke(d.col);
    fill(d.col); 

    switch (d.type) {
      case 'Pen':
        noFill();
        strokeWeight(d.size);
        drawingContext.shadowBlur = 0;
        beginShape();
        for(let pt of d.path) vertex(pt.x, pt.y);
        endShape();
        break;

      case 'Neon':
        noFill();
        strokeWeight(d.size);
        drawingContext.shadowBlur = d.size * 2;
        drawingContext.shadowColor = d.col;
        beginShape();
        for(let pt of d.path) vertex(pt.x, pt.y);
        endShape();
        drawingContext.shadowBlur = 0;
        break;

      case 'Dots':
        noStroke();
        for(let pt of d.path) {
          ellipse(pt.x, pt.y, d.size);
        }
        break;

      case 'Square':
        noStroke();
        rectMode(CENTER);
        for(let pt of d.path) {
          push();
          translate(pt.x, pt.y);
          rotate(frameCount * 0.1);
          rect(0, 0, d.size, d.size);
          pop();
        }
        break;

      case 'Spray':
        strokeWeight(1);
        noFill();
        beginShape(POINTS);
        for(let pt of d.path) {
          let r = d.size * 2;
          let rx = random(-r, r);
          let ry = random(-r, r);
          vertex(pt.x + rx, pt.y + ry);
        }
        endShape();
        break;
        
      default: 
        noFill();
        strokeWeight(d.size);
        beginShape();
        for(let pt of d.path) vertex(pt.x, pt.y);
        endShape();
    }
  }
  pop();

  translate(width/2, height/2);

  // --- LOOP CALCULATION ---
  let prog = 0;
  if (isLooping) {
    let current = frameCount - startLoopFrame;
    prog = (current % loopFrames) / loopFrames;
  } else {
    // Usiamo una velocità fissa ma fluida
    let periodo = map(sliderVelocita.value(), 0.005, 0.1, 300, 30); // Adattato per 30fps
    prog = (frameCount % periodo) / periodo;
  }
  let loopAngle = prog * TWO_PI;

  // --- SHAPE DRAWING ---
  let livelli = 10; 
  let forma = selForma.value();
  let interno = color(pickerInterno.color());
  let esterno = color(pickerEsterno.color());
  
  let strokeW = sliderStrokeForma.value();
  let strokeC = color(pickerStrokeForma.color());
  let shapeScale = sliderDimForma.value();

  let globalScale = map(sin(loopAngle), -1, 1, 0.9, 1.1);
  scale(globalScale);

  for(let i=0;i<livelli;i++){
    push();
    let offset = i * 0.4;
    let wave = sin(loopAngle + offset);
    
    let size = map(wave, -1, 1, 50 * shapeScale, 400 * shapeScale); 

    rotate(loopAngle); 

    if(strokeW > 0){
      strokeWeight(strokeW);
      stroke(strokeC);
    } else {
      noStroke();
    }

    if(selColore.value() === 'Rainbow'){
      let hueVal = (prog*360 + i*20)%360;
      fill(hueVal, 80, 100, map(i,0,livelli,10,80));
    } else if(selColore.value() === 'Gradient'){
      let c = lerpColor(interno, esterno, i/livelli);
      c.setAlpha(map(i,0,livelli,100,20));
      fill(c);
    } else {
      let c = color(interno); 
      c.setAlpha(map(i,0,livelli,100,30)); 
      fill(c);
    }

    drawingContext.shadowBlur = map(sin(loopAngle + i), -1, 1, 20, 60);
    drawingContext.shadowColor = esterno;

    if(forma==='Circle') ellipse(0,0,size);
    if(forma==='Square') rect(0,0,size,size, 20);
    if(forma==='Star') disegnaStella(0,0,size*0.3,size*0.65,5);
    if(forma==='Flower') disegnaFiore(0,0,size,7);
    if(forma==='Heart') disegnaCuorePerfetto(0,0,size);
    if(forma==='Moon') disegnaLunaVettoriale(0,0,size);
    pop();
  }

  // --- TEXT DRAWING ---
  let testoInserito = inpTesto.value();
  if(testoInserito!=""){
    push();
    textFont(selFont.value());
    let dimTesto = sliderDimTesto.value();
    textSize(dimTesto);
    let w = textWidth(testoInserito);
    let maxW = width-60; 
    
    scale(map(sin(loopAngle),-1,1,0.98,1.02));

    drawingContext.shadowBlur = 20;
    drawingContext.shadowColor = pickerStrokeTesto.color();
    strokeJoin(ROUND);
    strokeWeight(dimTesto * 0.05);
    stroke(pickerStrokeTesto.color());
    fill(pickerTesto.color());

    if(w>maxW){
      textAlign(LEFT,CENTER);
      let offset = prog*w;
      let baseX = -w/2;
      text(testoInserito, baseX-offset,0);
      text(testoInserito, baseX-offset + w,0);
    } else{
      textAlign(CENTER,CENTER);
      text(testoInserito,0,0);
    }
    pop();
  }
  
  drawingContext.shadowBlur = 0;
}

// =======================
// PARTICLES & EFFECTS
// =======================

class Particella {
  constructor(){
    this.x = random(width);
    this.y = random(height);
    this.size = random(1, 3);
    this.speedX = random(-0.5, 0.5);
    this.speedY = random(-0.5, 0.5);
    this.alpha = random(20, 100);
  }
  
  update(){
    this.x += this.speedX;
    this.y += this.speedY;
    if(this.x < 0) this.x = width;
    if(this.x > width) this.x = 0;
    if(this.y < 0) this.y = height;
    if(this.y > height) this.y = 0;
  }
  
  display(){
    noStroke();
    let col = color(pickerEsterno.color());
    col.setAlpha(this.alpha);
    fill(col);
    ellipse(this.x, this.y, this.size);
  }
}

function disegnaParticelleSfondo(){
  push();
  blendMode(ADD); 
  for(let p of particelle){
    p.update();
    p.display();
  }
  pop();
}

// =======================
// HELPER FUNCTIONS
// =======================
function creaGruppo(t,p){let b=createDiv();b.parent(p);b.style(`display:flex;flex-direction:column;align-items:center;gap:8px;border-right:1px solid rgba(255,255,255,0.1);padding-right:15px;height:100%;`);createSpan(t).parent(b).style(`font-size:9px;letter-spacing:1.5px;color:rgba(255,255,255,0.5);text-transform:uppercase;font-weight:bold;margin-bottom:2px;`);return b;}
function styleControl(e,p){e.parent(p);e.style(`background:rgba(0,0,0,0.3);color:white;border:1px solid rgba(255,255,255,0.2);border-radius:4px;outline:none;font-size:10px;padding:3px;cursor:pointer;`);}
function styleColor(e,p){e.parent(p);e.style(`width:20px;height:20px;border-radius:50%;border:2px solid rgba(255,255,255,0.2);padding:0;cursor:pointer;box-shadow:0 0 5px rgba(0,0,0,0.5);`);}
function styleButton(b,p){b.parent(p);b.style(`background:rgba(255,255,255,0.1);color:white;border:none;border-radius:6px;width:30px;height:30px;cursor:pointer;font-size:10px;transition:0.2s;`);b.mouseOver(()=>b.style('background','rgba(255,255,255,0.3)'));b.mouseOut(()=>b.style('background','rgba(255,255,255,0.1)'));}
function styleWideButton(b,p){b.parent(p);b.style(`background:rgba(255,255,255,0.1);color:white;border:none;border-radius:4px;padding:4px 8px;font-size:10px;cursor:pointer;width:70px;transition:0.2s;`);}
function styleCell(d){d.style('display:flex; flex-direction:column; align-items:center; gap:2px;');} 
function creaEtichetta(t,p){createSpan(t).parent(p).style('font-size:7px; color:rgba(255,255,255,0.6); margin-top:2px; letter-spacing:0.5px;');}

function disegnaCuorePerfetto(x,y,s){push();translate(x,y-s*0.1);scale(s/25);beginShape();for(let t=0;t<TWO_PI;t+=0.05)vertex(16*pow(sin(t),3),-(13*cos(t)-5*cos(2*t)-2*cos(3*t)-cos(4*t)));endShape(CLOSE);pop();}

function disegnaLunaVettoriale(x, y, s) {
  push();
  translate(x, y);
  rotate(-PI / 4); 
  let r = s / 2.2; 
  beginShape();
  vertex(0, -r);
  bezierVertex(-r * 1.3, -r * 0.5, -r * 1.3, r * 0.5, 0, r);
  bezierVertex(-r * 0.5, r * 0.3, -r * 0.5, -r * 0.3, 0, -r);
  endShape(CLOSE);
  pop();
}

function disegnaFiore(x,y,s,n){push();translate(x,y);for(let i=0;i<n;i++){rotate(TWO_PI/n);ellipse(s/4,0,s/2,s/3);}pop();}
function disegnaStella(x,y,r1,r2,n){let angle=TWO_PI/n;let half=angle/2;beginShape();for(let a=0;a<TWO_PI;a+=angle){vertex(x+cos(a)*r2,y+sin(a)*r2);vertex(x+cos(a+half)*r1,y+sin(a+half)*r1);}endShape(CLOSE);}
function randomizza(){
  selForma.selected(random(['Heart','Moon','Flower','Star']));
  selColore.selected(random(['Static','Rainbow','Gradient']));
  pickerInterno.value(color(random(360),80,100));
  pickerEsterno.value(color(random(360),60,100));
  pickerSfondo.value(color(random(30),10,5)); 
  sliderStrokeForma.value(random([0, 1, 3])); 
  pickerStrokeForma.value(color(random(360), 0, 100));
  sliderDimForma.value(random(0.5, 1.5)); 
}