// WUP 25-26 // Niccolò Parmeggiani
// TYPE TOOL V27 - WEBGL FIXED
// Puro JS - Nessun HTML/CSS

// --- CONFIGURAZIONE UI ---
let uiParams = {
  width: 280,
  bg: [20, 20, 25, 230], // Sfondo UI
  accent: [0, 229, 255], // Ciano Elettrico
  textMain: 220,
  textDim: 140
};

// --- PRESET SFONDI ---
const bgPresets = [
  [30, 30, 35],    // Dark (Default)
  [255, 255, 255], // White
  [0, 0, 0],       // Black
  [255, 50, 50],   // Red
  [0, 229, 255],   // Cyan
  [80, 255, 100],  // Green
  [255, 180, 0],   // Orange
  [150, 50, 255]   // Purple
];

// --- STATO APPLICAZIONE ---
let appState = {
  canvasW: 1080, canvasH: 1080,
  inputString: "Type Here",
  tool: 'type', 
  size: 80, spacing: 2, animSpeed: 1.0,
  hue: 180, sat: 100, bri: 100, alpha: 255,
  bgColor: [30, 30, 35], 
  transp: false,
  effect: 0, depth: 0,
  rotX: 0, rotY: 0, rotZ: 0,
  geoSides: 3, geoDensity: 0.1, geoRot: 0, geoFill: true,
  gifDuration: 4
};

// Variabili Globali
let myFont; // Variabile per il font
let oggettiTesto = [];
let historyStack = [];
let indiceSelezionato = -1;
const effectList = ['Nessuno', 'Acqua', 'Terremoto', 'Brivido', 'Gelatina', 'Geometrico'];

// Variabili Motore
let isExporting = false;
let isResizingText = false;
let globalTime = 0;
let camX = 0, camY = 0, camZoom = 1.0;
let isPanning = false;
let startPanX = 0, startPanY = 0;

// Interazione UI
let activeSlider = null;
let uiMap = []; 

// *** FIX CRITICO: In WEBGL è obbligatorio caricare un font ***
function preload() {
  // Usiamo un font affidabile da CDN. Senza questo, WEBGL crasha con text().
  myFont = loadFont('https://cdnjs.cloudflare.com/ajax/libs/topcoat/0.8.0/font/SourceCodePro-Bold.otf');
}

function setup() {
  pixelDensity(1);
  createCanvas(windowWidth, windowHeight, WEBGL);
  
  // Impostiamo il font caricato
  textFont(myFont);
  textAlign(CENTER, CENTER);
  
  let t = new OggettoTesto(0, 0, "Type Here");
  t.isPlaceholder = true;
  oggettiTesto.push(t);
  indiceSelezionato = 0;
  syncParamsToObj(t);
  saveState();
}

function draw() {
  perspective(PI / 3.0, width / height, 0.1, 500000); 
  let dt = isExporting ? (1.0 / 30.0) : (deltaTime / 1000.0);
  globalTime += dt;

  // --- DISEGNO SFONDO ---
  if (appState.transp) {
     if (isExporting) clear(); else disegnaScacchieraInfinita();
  } else {
     push();
     translate(camX, camY, -10000); 
     let infiniteS = (max(width, height) / camZoom) * 40; 
     scale(infiniteS);
     noStroke(); fill(appState.bgColor); 
     rectMode(CENTER); rect(0,0, 2, 2); 
     pop();
  }

  push();
  if (!isExporting) {
    translate(camX, camY); scale(camZoom);
    drawCanvasBorder();
    if(!appState.transp) disegnaGrigliaDinamica();
  }

  // Cursori
  if (keyIsDown(32)) cursor('grab');
  else if (appState.tool === 'cursor') cursor(ARROW);
  else if (appState.tool === 'type') cursor(TEXT);
  else cursor(ARROW);

  // Render Oggetti
  for (let i = 0; i < oggettiTesto.length; i++) {
    let isSel = (i === indiceSelezionato && !isExporting && appState.tool !== 'pipette');
    if(i === indiceSelezionato) oggettiTesto[i].updateFromParams();
    oggettiTesto[i].disegna(isSel, dt);
  }
  pop();

  if (!isExporting) {
    drawProGUI();
    if (appState.tool === 'pipette') drawPipetteCursor();
  }
}

// =================== INTERFACCIA UTENTE ===================

function drawProGUI() {
  push();
  resetMatrix(); 
  ortho(-width/2, width/2, -height/2, height/2); 
  translate(-width/2, -height/2); 
  
  uiMap = []; 

  let x = 15, y = 15;
  let w = uiParams.width;
  let ph = height - 30; 

  // Sfondo Pannello
  noStroke(); fill(uiParams.bg); rect(x, y, w, ph, 12);

  // Header
  fill(uiParams.textMain); textSize(14); textAlign(LEFT, TOP); textStyle(BOLD);
  text("TYPE TOOL V27", x + 15, y + 15);
  drawSimpleBtn("↶ UNDO", x + w - 70, y + 12, 55, 20, false, undo);

  y += 45; 
  let pad = 15; 
  let cw = w - pad*2; 

  // -- TOOLS --
  let btnW = cw / 3 - 2;
  drawSimpleBtn("MOVE", x+pad, y, btnW, 25, appState.tool==='cursor', ()=>appState.tool='cursor');
  drawSimpleBtn("TYPE", x+pad+btnW+3, y, btnW, 25, appState.tool==='type', ()=>appState.tool='type');
  drawSimpleBtn("PICK", x+pad+(btnW+3)*2, y, btnW, 25, appState.tool==='pipette', ()=>appState.tool='pipette');
  y += 35;

  // -- INPUT --
  drawLabel("CONTENUTO", x+pad, y); y+=15;
  fill(30); stroke(60); strokeWeight(1); rect(x+pad, y, cw, 28, 4);
  noStroke(); fill(255); textAlign(LEFT, CENTER); textSize(12); textStyle(NORMAL);
  let dTxt = appState.inputString.substring(0, 22);
  let cur = (frameCount % 60 < 30 && indiceSelezionato > -1) ? "|" : "";
  text(dTxt + cur, x+pad+8, y+14);
  y += 38;

  // -- COLORE --
  drawLabel("COLORE TESTO", x+pad, y); y+=15;
  let pc = color(`hsb(${appState.hue}, ${appState.sat}%, ${appState.bri}%)`);
  fill(pc); stroke(255); rect(x+pad, y, 30, 30, 4);
  drawRainbowBar(x+pad+40, y, cw-40, 12);
  drawGradientBar(x+pad+40, y+18, cw-40, 12);
  y += 38;
  drawSlider("Luminosità", x+pad, y, 0, 100, appState.bri, cw, (v)=>appState.bri=v); y+=25;
  drawSlider("Opacità", x+pad, y, 0, 255, appState.alpha, cw, (v)=>appState.alpha=v); y+=25;

  // -- PARAMETRI --
  drawSlider("Grandezza", x+pad, y, 10, 500, appState.size, cw, (v)=>appState.size=v); y+=25;
  drawSlider("Spaziatura", x+pad, y, -10, 100, appState.spacing, cw, (v)=>appState.spacing=v); y+=25;
  drawSlider("Velocità Anim", x+pad, y, 0, 5, appState.animSpeed, cw, (v)=>appState.animSpeed=v); y+=25;
  
  // -- EFFETTI --
  drawLabel("EFFETTI", x+pad, y); y+=15;
  drawSimpleBtn(effectList[appState.effect] + "  ►", x+pad, y, cw, 22, false, () => {
    appState.effect = (appState.effect + 1) % effectList.length;
  }); y += 28;
  
  if (appState.effect === 5) { 
    fill(255, 10); noStroke(); rect(x+pad-5, y-5, cw+10, 55, 4);
    drawSlider("Lati: "+floor(appState.geoSides), x+pad, y, 3, 12, appState.geoSides, cw, (v)=>appState.geoSides=v); y+=22;
    drawSlider("Densità", x+pad, y, 0.05, 0.5, appState.geoDensity, cw, (v)=>appState.geoDensity=v); y+=28;
  }
  
  // -- 3D --
  drawLabel("ROTAZIONE 3D", x+pad, y); y+=15;
  let sw = (cw-10)/3;
  drawSlider("X", x+pad, y, -180, 180, appState.rotX, sw, (v)=>appState.rotX=v, true);
  drawSlider("Y", x+pad+sw+5, y, -180, 180, appState.rotY, sw, (v)=>appState.rotY=v, true);
  drawSlider("Z", x+pad+(sw+5)*2, y, -180, 180, appState.rotZ, sw, (v)=>appState.rotZ=v, true);
  y += 25;
  drawSlider("Profondità", x+pad, y, 0, 100, appState.depth, cw, (v)=>appState.depth=v); y+=30;

  // -- EXPORT --
  fill(uiParams.textDim); stroke(60); strokeWeight(1);
  line(x+pad, y, x+w-pad, y); y+=10; 
  
  drawLabel("RISOLUZIONE", x+pad, y); y+=15;
  fill(30); stroke(60); rect(x+pad, y, cw, 25, 4);
  fill(255); noStroke(); textAlign(CENTER, CENTER); textSize(11);
  text(`${appState.canvasW} x ${appState.canvasH} px`, x+pad + cw/2, y+12.5);
  drawMiniBtn("-", x+pad+5, y+2, 20, 20, ()=>appState.canvasW-=50);
  drawMiniBtn("+", x+pad+cw/2-25, y+2, 20, 20, ()=>appState.canvasW+=50);
  drawMiniBtn("-", x+pad+cw/2+5, y+2, 20, 20, ()=>appState.canvasH-=50);
  drawMiniBtn("+", x+w-pad-25, y+2, 20, 20, ()=>appState.canvasH+=50);
  y += 35;
  
  // -- SFONDO --
  drawSimpleBtn(appState.transp ? "Sfondo: TRASP" : "Sfondo: COLORE", x+pad, y, cw, 22, appState.transp, ()=>appState.transp=!appState.transp);
  y += 30;

  if(!appState.transp) {
    drawLabel("SFONDO", x+pad, y); y+=15;
    let gap = 5;
    let swatchW = (cw - (gap * (bgPresets.length - 1))) / bgPresets.length;
    for(let i=0; i<bgPresets.length; i++) {
       let c = bgPresets[i];
       let bx = x+pad + (swatchW+gap)*i;
       fill(c); 
       if(dist(appState.bgColor[0],appState.bgColor[1],appState.bgColor[2], c[0],c[1],c[2]) < 5) {
         stroke(255); strokeWeight(2);
       } else {
         stroke(60); strokeWeight(1);
       }
       rect(bx, y, swatchW, 20, 4);
       regClick(bx, y, swatchW, 20, () => { appState.bgColor = [...c]; });
    }
    y += 28;
    let rgbW = (cw - 10) / 3;
    drawSlider("R", x+pad, y, 0, 255, appState.bgColor[0], rgbW, (v)=>appState.bgColor[0]=v, true);
    drawSlider("G", x+pad+rgbW+5, y, 0, 255, appState.bgColor[1], rgbW, (v)=>appState.bgColor[1]=v, true);
    drawSlider("B", x+pad+(rgbW+5)*2, y, 0, 255, appState.bgColor[2], rgbW, (v)=>appState.bgColor[2]=v, true);
    y += 20;
  }

  y += 10;
  let ew = (cw-5)/2;
  drawSimpleBtn("PNG", x+pad, y, ew, 25, false, exportPNG, [80,80,80]);
  drawSimpleBtn("GIF ("+appState.gifDuration+"s)", x+pad+ew+5, y, ew, 25, false, exportGIF, [46, 213, 115]);
  y += 30;
  
  drawSimpleBtn("ELIMINA OGGETTO", x+pad, y, cw, 25, false, deleteSelected, [200, 60, 60]);

  pop();
}

// =================== HELPER UI ===================

function drawLabel(t,x,y) { noStroke(); fill(uiParams.accent); textSize(10); textStyle(BOLD); textAlign(LEFT,TOP); text(t,x,y); }

function drawSimpleBtn(txt, x, y, w, h, act, cb, col=null) {
  let hov = isMouseOver(x,y,w,h);
  if(act) fill(uiParams.accent);
  else if(col) fill(hov ? [col[0]+30,col[1]+30,col[2]+30] : col);
  else fill(hov ? 80 : 50);
  stroke(0); strokeWeight(1); rect(x,y,w,h,4);
  fill(act?0:255); noStroke(); textSize(10); textAlign(CENTER,CENTER); textStyle(BOLD); text(txt,x+w/2,y+h/2);
  regClick(x,y,w,h,cb);
}

function drawMiniBtn(txt, x, y, w, h, cb) {
  let hov = isMouseOver(x,y,w,h);
  fill(hov?100:60); stroke(80); rect(x,y,w,h,3);
  fill(255); noStroke(); textAlign(CENTER,CENTER); text(txt,x+w/2,y+h/2);
  regClick(x,y,w,h,cb);
}

function drawSlider(lbl, x, y, min, max, val, w, set, compact=false) {
  let sy = compact ? y : y+10;
  if(!compact) { fill(uiParams.textMain); textAlign(LEFT,TOP); textSize(11); textStyle(NORMAL); text(lbl,x,y-5); }
  else { fill(uiParams.textDim); textAlign(CENTER,BOTTOM); textSize(9); text(lbl,x+w/2,y-2); }
  stroke(60); strokeWeight(4); strokeCap(ROUND); line(x+2, sy+5, x+w-2, sy+5);
  let t = map(val, min, max, 0, 1);
  let hx = x + t * w;
  stroke(uiParams.accent); line(x+2, sy+5, hx, sy+5);
  noStroke(); fill(255); ellipse(hx, sy+5, 10, 10);
  let id = lbl+x+y;
  if(mouseIsPressed && isMouseOver(x-5, sy-5, w+10, 20)) activeSlider = id;
  if(activeSlider === id) set(map(mouseX, x, x+w, min, max, true));
}

function drawRainbowBar(x, y, w, h) {
  colorMode(HSB, 360, 100, 100); noStroke();
  for(let i=0; i<w; i+=3) { fill(map(i,0,w,0,360), 100, 100); rect(x+i,y,3,h); }
  colorMode(RGB); stroke(255); strokeWeight(2); noFill();
  rect(map(appState.hue,0,360,x,x+w)-2, y-2, 4, h+4);
  if(mouseIsPressed && isMouseOver(x,y-5,w,h+10)) activeSlider="hue";
  if(activeSlider==="hue") appState.hue = map(mouseX,x,x+w,0,360,true);
}

function drawGradientBar(x, y, w, h) {
  colorMode(HSB, 360, 100, 100);
  for(let i=0; i<w; i+=3) { fill(appState.hue, map(i,0,w,0,100), 100); rect(x+i,y,3,h); }
  colorMode(RGB); stroke(255); strokeWeight(2); noFill();
  rect(map(appState.sat,0,100,x,x+w)-2, y-2, 4, h+4);
  if(mouseIsPressed && isMouseOver(x,y-5,w,h+10)) activeSlider="sat";
  if(activeSlider==="sat") appState.sat = map(mouseX,x,x+w,0,100,true);
}

// =================== INTERAZIONI & HELPER SCENA ===================

function regClick(x, y, w, h, cb) { if(!mouseIsPressed && window.lcf === frameCount) return; uiMap.push({x,y,w,h,cb}); }

function mousePressed() {
  window.lcf = frameCount;
  let hitUI = false;
  for(let b of uiMap) { if(isMouseOver(b.x,b.y,b.w,b.h)) { b.cb(); hitUI=true; saveState(); break; } }
  if(mouseX < uiParams.width + 30) hitUI = true;
  if(hitUI) return;

  if(appState.tool === 'pipette') {
    loadPixels(); let d=pixelDensity(); let off=4*((mouseY*d)*(width*d)+(mouseX*d));
    let r=pixels[off], g=pixels[off+1], b=pixels[off+2];
    if(indiceSelezionato>-1) oggettiTesto[indiceSelezionato].overrideColor([r,g,b]);
    appState.tool='cursor'; return;
  }
  
  if(keyIsDown(32)) { isPanning=true; startPanX=mouseX; startPanY=mouseY; return; }

  let mx = getMouseX(), my = getMouseY();
  let picked = false;
  
  if(indiceSelezionato>-1) {
    let t = oggettiTesto[indiceSelezionato];
    let b = t.getBoundingBox();
    if(dist(mx,my,t.x+b.w/2, t.y+b.h/2) < 50/camZoom) { isResizingText=true; return; }
  }

  for(let i=0; i<oggettiTesto.length; i++) {
    if(oggettiTesto[i].contains(mx,my)) { indiceSelezionato=i; syncParamsToObj(oggettiTesto[i]); picked=true; break; }
  }
  
  if(!picked && appState.tool==='type') {
    indiceSelezionato=-1;
    let n = new OggettoTesto(mx,my,"Type"); n.isPlaceholder=true;
    oggettiTesto.push(n); indiceSelezionato=oggettiTesto.length-1;
    syncParamsToObj(n); appState.inputString="";
  } else if(!picked) { indiceSelezionato=-1; }
}

function mouseReleased() { isPanning=false; isResizingText=false; activeSlider=null; }
function mouseDragged() {
  if(activeSlider || mouseX < uiParams.width+30) return;
  if(isPanning) { camX+=mouseX-startPanX; camY+=mouseY-startPanY; startPanX=mouseX; startPanY=mouseY; return; }
  let mx=getMouseX(), my=getMouseY();
  if(indiceSelezionato>-1 && appState.tool!=='pipette') {
      let t=oggettiTesto[indiceSelezionato];
      if(isResizingText) { 
        let d=dist(mx,my,t.x,t.y); 
        appState.size=constrain(d*0.8, 10, 500); t.size=appState.size; 
      } else { t.x=mx; t.y=my; }
  }
}
function mouseWheel(e) { if(mouseX>uiParams.width+30) { camZoom-=e.delta*0.001*camZoom; camZoom=constrain(camZoom,0.05,10); return false; } }

function keyTyped() { if(!keyIsDown(CONTROL) && indiceSelezionato>-1) { let t=oggettiTesto[indiceSelezionato]; if(t.isPlaceholder){t.content=""; t.isPlaceholder=false;} if(key.length===1){t.content+=key; appState.inputString=t.content;} } }
function keyPressed() { if(keyIsDown(CONTROL)&&keyCode===90)undo(); if(indiceSelezionato>-1){ let t=oggettiTesto[indiceSelezionato]; if(keyCode===BACKSPACE){ if(t.content.length>0) t.content=t.content.slice(0,-1); appState.inputString=t.content;} if(keyCode===DELETE) deleteSelected(); } }

// --- UTILS ---
function isMouseOver(x,y,w,h){ return mouseX>=x && mouseX<=x+w && mouseY>=y && mouseY<=y+h; }
function getMouseX(){ return (mouseX-width/2-camX)/camZoom; }
function getMouseY(){ return (mouseY-height/2-camY)/camZoom; }
function windowResized(){ resizeCanvas(windowWidth,windowHeight); }
function saveState(){ historyStack.push({objs:JSON.parse(JSON.stringify(oggettiTesto)), sel:indiceSelezionato}); if(historyStack.length>40)historyStack.shift(); }
function undo(){ if(historyStack.length>0){ let s=historyStack.pop(); objectsFromState(s.objs); indiceSelezionato=s.sel; if(indiceSelezionato>-1)syncParamsToObj(oggettiTesto[indiceSelezionato]); } }
function objectsFromState(data){ oggettiTesto=data.map(d=>{let t=new OggettoTesto(d.x,d.y,d.content); Object.assign(t,d); return t;}); }
function deleteSelected(){ if(indiceSelezionato>-1){ saveState(); oggettiTesto.splice(indiceSelezionato,1); indiceSelezionato=-1; appState.inputString=""; } }
function syncParamsToObj(o) { appState.inputString=o.content; appState.size=o.size; appState.spacing=o.spacing; appState.animSpeed=o.animSpeed; appState.depth=o.depth; appState.rotX=o.rotX; appState.rotY=o.rotY; appState.rotZ=o.rotZ; }

function exportPNG(){ isExporting=true; resizeCanvas(appState.canvasW, appState.canvasH); draw(); saveCanvas('art','png'); resizeCanvas(windowWidth,windowHeight); isExporting=false; }
function exportGIF(){ isExporting=true; resizeCanvas(appState.canvasW, appState.canvasH); saveGif('anim', appState.gifDuration, {units:'seconds'}); setTimeout(()=>{isExporting=false; resizeCanvas(windowWidth,windowHeight);}, appState.gifDuration*1000+2000); }

// --- DRAWING HELPERS ---
function disegnaScacchieraInfinita() {
  push();
  translate(camX, camY, -20000); 
  let s = (max(width,height)/camZoom) * 2; 
  scale(s); 
  noStroke(); fill(220); 
  let gridSize = 100;
  for(let x=-gridSize*5; x<gridSize*5; x+=gridSize) {
    for(let y=-gridSize*5; y<gridSize*5; y+=gridSize) {
       if(((x+y)/gridSize)%2===0) rect(x,y,gridSize,gridSize);
    }
  }
  pop();
}

function disegnaGrigliaDinamica() {
  push(); translate(0,0,-10); stroke(255,40); strokeWeight(1/camZoom);
  let sz = max(appState.canvasW, appState.canvasH)*2;
  for(let i=-sz; i<=sz; i+=100) { line(i,-sz, i,sz); line(-sz,i, sz,i); }
  pop();
}

function drawCanvasBorder() {
  push(); noFill(); stroke(150); strokeWeight(2/camZoom); rectMode(CENTER);
  rect(0,0, appState.canvasW, appState.canvasH);
  fill(150); noStroke(); textSize(12/camZoom); 
  text(`${appState.canvasW}x${appState.canvasH}px`, 0, -appState.canvasH/2 - 20/camZoom);
  pop();
}

function drawPipetteCursor() {
  push(); resetMatrix(); translate(mouseX-width/2, mouseY-height/2); 
  noCursor(); stroke(255); strokeWeight(2); noFill(); ellipse(0,0,20,20); line(0,-10,0,10); line(-10,0,10,0); pop();
}

function polygon(ctx, x, y, r, n) {
  let a = TWO_PI/n; ctx.beginShape(); for(let i=0;i<TWO_PI;i+=a) ctx.vertex(x+cos(i)*r, y+sin(i)*r); ctx.endShape(CLOSE);
}

// --- CLASSE OGGETTO ---
class OggettoTesto {
  constructor(x,y,c) {
    this.x=x; this.y=y; this.content=c;
    this.size=80; this.spacing=2; this.color=[0,229,255]; this.alpha=255;
    this.effect='Nessuno'; this.animSpeed=1; this.depth=0;
    this.rotX=0; this.rotY=0; this.rotZ=0;
    this.geoSides=3; this.geoDensity=0.15; this.geoRot=0; this.geoFilled=true;
    this.localTime=0;
  }
  updateFromParams() {
    this.size=appState.size; this.spacing=appState.spacing;
    push(); colorMode(HSB); let c=color(appState.hue, appState.sat, appState.bri); pop();
    this.color=[red(c),green(c),blue(c)]; this.alpha=appState.alpha;
    this.effect=effectList[appState.effect]; this.animSpeed=appState.animSpeed;
    this.rotX=appState.rotX; this.rotY=appState.rotY; this.rotZ=appState.rotZ; this.depth=appState.depth;
    this.geoSides=appState.geoSides; this.geoDensity=appState.geoDensity;
  }
  overrideColor(rgb){ this.color=rgb; }
  
  getBoundingBox() {
    textSize(this.size); 
    let w = 0;
    // Calcolo larghezza con fallback per evitare 0
    if(this.effect !== 'Geometrico') {
      for(let i=0; i<this.content.length; i++) w += textWidth(this.content[i]) + this.spacing;
    } else {
      w = this.content.length * (this.size * 0.6) + (this.content.length * this.spacing);
    }
    if(w===0) w = 50; 
    return { w: w, h: this.size + 20 };
  }
  
  contains(px,py) { let b=this.getBoundingBox(); return px>this.x-b.w/2 && px<this.x+b.w/2 && py>this.y-b.h/2 && py<this.y+b.h/2; }
  
  disegna(sel, dt) {
    this.localTime+=dt*this.animSpeed;
    push(); translate(this.x,this.y,0);
    rotateX(radians(this.rotX)); rotateY(radians(this.rotY)); rotateZ(radians(this.rotZ));
    
    // Box selezione
    if(sel) {
       push(); translate(0,0,this.depth+2); let b=this.getBoundingBox();
       stroke(255,50,50); strokeWeight(1.5); noFill(); rect(0,0,b.w,b.h);
       noStroke(); fill(uiParams.accent); rect(b.w/2, b.h/2, 10/camZoom, 10/camZoom);
       pop();
    }
    
    let lay=(this.depth>0)?floor(this.depth):1;
    let c=color(this.color[0],this.color[1],this.color[2],this.alpha);
    
    // Disegno multi-layer per effetto profondità
    for(let i=0; i<lay; i++) {
       push(); translate(0,0,-i);
       let lc = (i===0)?c:lerpColor(c,color(0), (1-map(i,0,60,1,0.5)));
       this.renderTxt(lc); 
       pop();
    }
    
    if(this.content.length===0 && sel) { stroke(255); line(0,-this.size/2,0,this.size/2); }
    pop();
  }
  
  renderTxt(col) {
    // GEOMETRICO: Usa textToPoints che richiede assolutamente il font caricato
    if(this.effect==='Geometrico') {
       if(!myFont) return; // Protezione crash
       let pts = myFont.textToPoints(this.content, 0, 0, this.size, {
         sampleFactor: appState.geoDensity, simplifyThreshold: 0
       });
       let b = myFont.textBounds(this.content, 0, 0, this.size);
       push(); translate(-b.w/2, b.h/4);
       if(appState.geoFill) { fill(col); noStroke(); } else { noFill(); stroke(col); strokeWeight(1); }
       
       let rad = map(appState.geoDensity, 0.05, 0.5, 8, 2);
       for(let p of pts){ 
         push(); translate(p.x, p.y); rotate(radians(appState.geoRot)); 
         polygon(this,0,0,rad,appState.geoSides); 
         pop(); 
       }
       pop();
    } else {
      // NORMALE
      fill(col); noStroke(); textSize(this.size); textStyle(BOLD);
      
      let ws=[];
      let totW=0;
      for(let c of this.content) { let w=textWidth(c); ws.push(w); totW+=w+this.spacing; }
      if(ws.length>0) totW-=this.spacing;
      
      let cx = -totW/2;
      for(let i=0; i<this.content.length; i++) {
         push(); 
         translate(cx+ws[i]/2, 0); 
         this.eff(i); 
         text(this.content[i],0,0); 
         pop();
         cx+=ws[i]+this.spacing;
      }
    }
  }
  
  vertex(x,y){vertex(x,y);} beginShape(){beginShape();} endShape(m){endShape(m);}
  eff(i) {
    let t=this.localTime;
    if(this.effect==='Acqua') translate(0,sin(t*3+i*0.5)*10);
    else if(this.effect==='Terremoto') translate((noise(t*20,i)-0.5)*20, (noise(t*20+100,i)-0.5)*20);
    else if(this.effect==='Brivido') scale(1+sin(t*30+i)*0.1);
    else if(this.effect==='Gelatina') { let b=sin(t*5); scale(1+b*0.2, 1-b*0.2); }
  }
}