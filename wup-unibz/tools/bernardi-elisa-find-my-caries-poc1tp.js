let modello;
let copertinaImg; 
let vittoriaImg; // 1. Variabile per lo sfondo finale
let rotazione = 0;
let guastoPos;
let guastoAngolo = 0; 
let guastoVelY = 1.5; 
let trovato = false;
let cuboEsiste = true;
let statoGioco = "MENU"; 
let interfaccia; 
let punteggio = 0;

let messaggioLivello = "";
let timerMessaggio = 0;

let livello = 1;
const configLivelli = {
  1: { colore: [100, 150, 255], soglia: 5, velBase: 0.005, sizeMirino: 85 },
  2: { colore: [150, 255, 100], soglia: 10, velBase: 0.012, sizeMirino: 75 },
  3: { colore: [255, 100, 100], soglia: 15, velBase: 0.020, sizeMirino: 65 }
};

let zoom = 1;
let targetZoom = 1;
let oscillazioneY = 0;

let oscillatore;
let haSuonato = false;
let particelle = [];

function preload() {
  // CARICAMENTO DEL NUOVO MODELLO AGGIORNATO
  modello = loadModel('Bernardi_Elisa_gear.obj', true);
  
  // Caricamento copertina
  copertinaImg = loadImage('copertina.png', 
    () => console.log("Copertina caricata"), 
    () => copertinaImg = null
  );

  // Caricamento immagine finale
  vittoriaImg = loadImage('vittoria.png', 
    () => console.log("Immagine vittoria caricata"), 
    () => vittoriaImg = null
  );
}

function setup() {
  createCanvas(800, 800, WEBGL);
  generaNuovoGuasto();
  interfaccia = createGraphics(800, 800);

  oscillatore = new p5.Oscillator('square');
  oscillatore.amp(0);
  oscillatore.start();
}

function draw() {
  background(10);

  if (statoGioco === "MENU") {
    disegnaMenu();
  } else if (statoGioco === "PLAY") {
    gestisciFocus();
    eseguiGioco();
    controllaProgresso(); 
  } else if (statoGioco === "WIN") {
    disegnaVittoria();
  }
  
  push();
  resetMatrix();
  translate(-width/2, -height/2);
  image(interfaccia, 0, 0);
  pop();
}

function controllaProgresso() {
  if (punteggio >= configLivelli[3].soglia && timerMessaggio <= 0) {
    statoGioco = "WIN";
  } else if (livello === 1 && punteggio >= configLivelli[1].soglia) {
    livello = 2;
  } else if (livello === 2 && punteggio >= configLivelli[2].soglia) {
    livello = 3;
  }
}

function gestisciFocus() {
  targetZoom = keyIsDown(32) ? 1.8 : 1.0;
  zoom = lerp(zoom, targetZoom, 0.1);
}

function disegnaMenu() {
  interfaccia.clear();
  if (copertinaImg) {
    interfaccia.image(copertinaImg, 0, 0, 800, 800);
  } else {
    interfaccia.background(15);
  }

  interfaccia.textAlign(CENTER, CENTER);
  interfaccia.stroke(255, 0, 0);
  interfaccia.strokeWeight(4);
  interfaccia.fill(255, 255, 0);
  interfaccia.textSize(55);
  interfaccia.text("FIND MY CARIES", 400, 250); 
  
  interfaccia.noStroke();
  interfaccia.textSize(18);
  interfaccia.fill(255);
  interfaccia.text("HOLD SPACE TO SLOW DOWN & FOCUS", 400, 320);

  let over = (mouseX > 300 && mouseX < 500 && mouseY > 450 && mouseY < 510);
  interfaccia.stroke(0, 255, 255);
  interfaccia.strokeWeight(2);
  interfaccia.fill(over ? [0, 255, 255, 100] : [0, 255, 255, 30]);
  interfaccia.rect(300, 450, 200, 60, 10);

  interfaccia.noStroke();
  interfaccia.fill(255);
  interfaccia.textSize(28);
  interfaccia.text("START", 400, 480);
}

function disegnaVittoria() {
  interfaccia.clear();
  
  if (vittoriaImg) {
    interfaccia.image(vittoriaImg, 0, 0, 800, 800);
  } else {
    interfaccia.background(20, 40, 20); 
  }

  interfaccia.textAlign(CENTER, CENTER);
  interfaccia.stroke(255, 0, 0);
  interfaccia.strokeWeight(4);
  interfaccia.fill(255, 215, 0);
  interfaccia.textSize(50);
  interfaccia.text("MISSION COMPLETE", 400, 350); 
  
  interfaccia.noStroke();
  interfaccia.fill(255);
  interfaccia.textSize(25);
  interfaccia.text("WOW, NICE TEETH!", 400, 410); 
  
  interfaccia.textSize(24);
  interfaccia.fill(0, 255, 255);
  interfaccia.text("> CLICK ANYWHERE TO RESTART <", 400, 500);
}

function eseguiGioco() {
  interfaccia.clear();
  cursor(CROSS);
  
  interfaccia.textAlign(LEFT);
  interfaccia.noStroke();
  interfaccia.fill(255);
  interfaccia.textSize(22);
  interfaccia.text("LEVEL: " + livello, 40, 50);
  
  let carieLivello = punteggio - (livello - 1) * 5;
  if (timerMessaggio > 0 && carieLivello === 0) carieLivello = 5; 
  interfaccia.text("CARIES: " + carieLivello + " / 5", 40, 85);

  if (timerMessaggio > 0) {
    interfaccia.textAlign(CENTER, CENTER);
    interfaccia.textSize(80);
    interfaccia.stroke(255, 0, 0);
    interfaccia.strokeWeight(6);
    interfaccia.fill(255, 255, 0); 
    interfaccia.text(messaggioLivello, 400, 400);
    timerMessaggio--;
  }

  let mx = mouseX - width / 2;
  let my = mouseY - height / 2;

  ambientLight(50);
  pointLight(255, 255, 255, 200, -200, 300);

  if (livello === 3 && cuboEsiste) {
    guastoAngolo += random(0.02, 0.05); 
    let r = dist(0, 0, guastoPos.x, guastoPos.z);
    guastoPos.x = cos(guastoAngolo) * r;
    guastoPos.z = sin(guastoAngolo) * r;
    guastoPos.y += guastoVelY;
    if (guastoPos.y > 70 || guastoPos.y < -70) guastoVelY *= -1; 
  }

  if (livello > 1) {
    oscillazioneY = sin(frameCount * 0.05) * (livello * 5);
  }

  if (cuboEsiste) {
    let raggioCollisione = (configLivelli[livello].sizeMirino / 1.4) * zoom; 
    let s = sin(rotazione);
    let c = cos(rotazione);
    let realX = guastoPos.x * c + guastoPos.z * s;
    let realZ = -guastoPos.x * s + guastoPos.z * c;
    
    if (realZ > 0) {
      let d = dist(mx, my, realX * zoom, (guastoPos.y + oscillazioneY) * zoom);
      if (d < raggioCollisione) {
        trovato = true;
        if (!haSuonato) { suonaBip(800, 0.1); haSuonato = true; }
      } else {
        trovato = false;
        haSuonato = false;
      }
    } else {
      trovato = false;
      haSuonato = false;
    }
  }

  push();
  noStroke();
  scale(zoom); 
  rotateY(rotazione);
  translate(0, oscillazioneY, 0); 
  let cl = configLivelli[livello].colore;
  fill(cl[0], cl[1], cl[2], 25); 
  drawingContext.depthMask(false); 
  scale(3);
  model(modello);
  drawingContext.depthMask(true); 
  pop();

  push();
  scale(zoom);
  rotateY(rotazione);
  if (cuboEsiste) {
    translate(guastoPos.x, guastoPos.y + oscillazioneY, guastoPos.z);
    let s = sin(rotazione);
    let c = cos(rotazione);
    let realZ = -guastoPos.x * s + guastoPos.z * c;
    
    let opacita = 0;
    if (livello === 1) {
      opacita = (realZ > 0) ? (trovato ? 255 : 180) : 30;
    } else {
      opacita = (realZ > 0 && trovato) ? 220 : 0;
    }
    
    fill(255, 0, 0, opacita); 
    box(15);
  }
  pop();

  gestisciParticelle();
  drawScannerUI();
  
  let vBase = configLivelli[livello].velBase;
  let velocitaRotazione = keyIsDown(32) ? vBase * 0.2 : vBase;
  rotazione += velocitaRotazione;
}

function mousePressed() {
  userStartAudio();
  if (statoGioco === "MENU") {
    if (mouseX > 300 && mouseX < 500 && mouseY > 450 && mouseY < 510) {
      statoGioco = "PLAY";
    }
  } else if (statoGioco === "PLAY" && trovato && cuboEsiste) {
    esplodiGuasto();
    punteggio++;
    suonaBip(200, 0.4);
    cuboEsiste = false; 
    
    if (punteggio === 5) {
      messaggioLivello = "GREAT!";
      timerMessaggio = 120;
    } else if (punteggio === 10) {
      messaggioLivello = "FANTASTIC!";
      timerMessaggio = 120;
    } else if (punteggio === 15) {
      messaggioLivello = "GOOD JOB!";
      timerMessaggio = 120;
    }

    setTimeout(generaNuovoGuasto, 500); 
  } else if (statoGioco === "WIN") {
    punteggio = 0; livello = 1; rotazione = 0; zoom = 1; particelle = [];
    generaNuovoGuasto();
    statoGioco = "MENU";
  }
}

function generaNuovoGuasto() {
  if (punteggio < 15) {
    let r = random(40, 150);
    guastoAngolo = random(TWO_PI);
    guastoPos = createVector(cos(guastoAngolo) * r, random(-70, 70), sin(guastoAngolo) * 40);
    guastoVelY = (livello === 3) ? random(1.8, 2.8) : random(-1.2, 1.2);
    if (random() > 0.5) guastoVelY *= -1;
    cuboEsiste = true;
    trovato = false;
  }
}

function drawScannerUI() {
  let baseSize = configLivelli[livello].sizeMirino;
  let size = keyIsDown(32) ? baseSize * 1.5 : baseSize;
  interfaccia.noFill();
  let c = configLivelli[livello].colore;
  interfaccia.stroke(trovato ? [255, 0, 0] : c);
  interfaccia.strokeWeight(2);
  interfaccia.ellipse(mouseX, mouseY, size, size);
  interfaccia.line(mouseX - 20, mouseY, mouseX + 20, mouseY);
  interfaccia.line(mouseX, mouseY - 20, mouseX, mouseY + 20);
}

function suonaBip(frequenza, durata) {
  oscillatore.freq(frequenza);
  oscillatore.amp(0.3, 0.05);
  setTimeout(() => { oscillatore.amp(0, 0.1); }, durata * 1000);
}

function esplodiGuasto() {
  for (let i = 0; i < 20; i++) {
    particelle.push({
      pos: createVector(guastoPos.x, guastoPos.y + oscillazioneY, guastoPos.z),
      vel: p5.Vector.random3D().mult(random(2, 5)),
      life: 255
    });
  }
}

function gestisciParticelle() {
  push();
  scale(zoom);
  rotateY(rotazione);
  noStroke();
  for (let i = particelle.length - 1; i >= 0; i--) {
    let p = particelle[i];
    p.pos.add(p.vel); p.life -= 5;
    fill(255, 100, 0, p.life);
    push(); translate(p.pos.x, p.pos.y, p.pos.z); sphere(2); pop();
    if (p.life <= 0) particelle.splice(i, 1);
  }
  pop();
}let modello;
let copertinaImg; 
let vittoriaImg; // 1. Variabile per lo sfondo finale
let rotazione = 0;
let guastoPos;
let guastoAngolo = 0; 
let guastoVelY = 1.5; 
let trovato = false;
let cuboEsiste = true;
let statoGioco = "MENU"; 
let interfaccia; 
let punteggio = 0;

let messaggioLivello = "";
let timerMessaggio = 0;

let livello = 1;
const configLivelli = {
  1: { colore: [100, 150, 255], soglia: 5, velBase: 0.005, sizeMirino: 85 },
  2: { colore: [150, 255, 100], soglia: 10, velBase: 0.012, sizeMirino: 75 },
  3: { colore: [255, 100, 100], soglia: 15, velBase: 0.020, sizeMirino: 65 }
};

let zoom = 1;
let targetZoom = 1;
let oscillazioneY = 0;

let oscillatore;
let haSuonato = false;
let particelle = [];

function preload() {
  // CARICAMENTO DEL NUOVO MODELLO AGGIORNATO
  modello = loadModel('Bernardi_Elisa_gear.obj', true);
  
  // Caricamento copertina
  copertinaImg = loadImage('copertina.png', 
    () => console.log("Copertina caricata"), 
    () => copertinaImg = null
  );

  // Caricamento immagine finale
  vittoriaImg = loadImage('vittoria.png', 
    () => console.log("Immagine vittoria caricata"), 
    () => vittoriaImg = null
  );
}

function setup() {
  createCanvas(800, 800, WEBGL);
  generaNuovoGuasto();
  interfaccia = createGraphics(800, 800);

  oscillatore = new p5.Oscillator('square');
  oscillatore.amp(0);
  oscillatore.start();
}

function draw() {
  background(10);

  if (statoGioco === "MENU") {
    disegnaMenu();
  } else if (statoGioco === "PLAY") {
    gestisciFocus();
    eseguiGioco();
    controllaProgresso(); 
  } else if (statoGioco === "WIN") {
    disegnaVittoria();
  }
  
  push();
  resetMatrix();
  translate(-width/2, -height/2);
  image(interfaccia, 0, 0);
  pop();
}

function controllaProgresso() {
  if (punteggio >= configLivelli[3].soglia && timerMessaggio <= 0) {
    statoGioco = "WIN";
  } else if (livello === 1 && punteggio >= configLivelli[1].soglia) {
    livello = 2;
  } else if (livello === 2 && punteggio >= configLivelli[2].soglia) {
    livello = 3;
  }
}

function gestisciFocus() {
  targetZoom = keyIsDown(32) ? 1.8 : 1.0;
  zoom = lerp(zoom, targetZoom, 0.1);
}

function disegnaMenu() {
  interfaccia.clear();
  if (copertinaImg) {
    interfaccia.image(copertinaImg, 0, 0, 800, 800);
  } else {
    interfaccia.background(15);
  }

  interfaccia.textAlign(CENTER, CENTER);
  interfaccia.stroke(255, 0, 0);
  interfaccia.strokeWeight(4);
  interfaccia.fill(255, 255, 0);
  interfaccia.textSize(55);
  interfaccia.text("FIND MY CARIES", 400, 250); 
  
  interfaccia.noStroke();
  interfaccia.textSize(18);
  interfaccia.fill(255);
  interfaccia.text("HOLD SPACE TO SLOW DOWN & FOCUS", 400, 320);

  let over = (mouseX > 300 && mouseX < 500 && mouseY > 450 && mouseY < 510);
  interfaccia.stroke(0, 255, 255);
  interfaccia.strokeWeight(2);
  interfaccia.fill(over ? [0, 255, 255, 100] : [0, 255, 255, 30]);
  interfaccia.rect(300, 450, 200, 60, 10);

  interfaccia.noStroke();
  interfaccia.fill(255);
  interfaccia.textSize(28);
  interfaccia.text("START", 400, 480);
}

function disegnaVittoria() {
  interfaccia.clear();
  
  if (vittoriaImg) {
    interfaccia.image(vittoriaImg, 0, 0, 800, 800);
  } else {
    interfaccia.background(20, 40, 20); 
  }

  interfaccia.textAlign(CENTER, CENTER);
  interfaccia.stroke(255, 0, 0);
  interfaccia.strokeWeight(4);
  interfaccia.fill(255, 215, 0);
  interfaccia.textSize(50);
  interfaccia.text("MISSION COMPLETE", 400, 350); 
  
  interfaccia.noStroke();
  interfaccia.fill(255);
  interfaccia.textSize(25);
  interfaccia.text("WOW, NICE TEETH!", 400, 410); 
  
  interfaccia.textSize(24);
  interfaccia.fill(0, 255, 255);
  interfaccia.text("> CLICK ANYWHERE TO RESTART <", 400, 500);
}

function eseguiGioco() {
  interfaccia.clear();
  cursor(CROSS);
  
  interfaccia.textAlign(LEFT);
  interfaccia.noStroke();
  interfaccia.fill(255);
  interfaccia.textSize(22);
  interfaccia.text("LEVEL: " + livello, 40, 50);
  
  let carieLivello = punteggio - (livello - 1) * 5;
  if (timerMessaggio > 0 && carieLivello === 0) carieLivello = 5; 
  interfaccia.text("CARIES: " + carieLivello + " / 5", 40, 85);

  if (timerMessaggio > 0) {
    interfaccia.textAlign(CENTER, CENTER);
    interfaccia.textSize(80);
    interfaccia.stroke(255, 0, 0);
    interfaccia.strokeWeight(6);
    interfaccia.fill(255, 255, 0); 
    interfaccia.text(messaggioLivello, 400, 400);
    timerMessaggio--;
  }

  let mx = mouseX - width / 2;
  let my = mouseY - height / 2;

  ambientLight(50);
  pointLight(255, 255, 255, 200, -200, 300);

  if (livello === 3 && cuboEsiste) {
    guastoAngolo += random(0.02, 0.05); 
    let r = dist(0, 0, guastoPos.x, guastoPos.z);
    guastoPos.x = cos(guastoAngolo) * r;
    guastoPos.z = sin(guastoAngolo) * r;
    guastoPos.y += guastoVelY;
    if (guastoPos.y > 70 || guastoPos.y < -70) guastoVelY *= -1; 
  }

  if (livello > 1) {
    oscillazioneY = sin(frameCount * 0.05) * (livello * 5);
  }

  if (cuboEsiste) {
    let raggioCollisione = (configLivelli[livello].sizeMirino / 1.4) * zoom; 
    let s = sin(rotazione);
    let c = cos(rotazione);
    let realX = guastoPos.x * c + guastoPos.z * s;
    let realZ = -guastoPos.x * s + guastoPos.z * c;
    
    if (realZ > 0) {
      let d = dist(mx, my, realX * zoom, (guastoPos.y + oscillazioneY) * zoom);
      if (d < raggioCollisione) {
        trovato = true;
        if (!haSuonato) { suonaBip(800, 0.1); haSuonato = true; }
      } else {
        trovato = false;
        haSuonato = false;
      }
    } else {
      trovato = false;
      haSuonato = false;
    }
  }

  push();
  noStroke();
  scale(zoom); 
  rotateY(rotazione);
  translate(0, oscillazioneY, 0); 
  let cl = configLivelli[livello].colore;
  fill(cl[0], cl[1], cl[2], 25); 
  drawingContext.depthMask(false); 
  scale(3);
  model(modello);
  drawingContext.depthMask(true); 
  pop();

  push();
  scale(zoom);
  rotateY(rotazione);
  if (cuboEsiste) {
    translate(guastoPos.x, guastoPos.y + oscillazioneY, guastoPos.z);
    let s = sin(rotazione);
    let c = cos(rotazione);
    let realZ = -guastoPos.x * s + guastoPos.z * c;
    
    let opacita = 0;
    if (livello === 1) {
      opacita = (realZ > 0) ? (trovato ? 255 : 180) : 30;
    } else {
      opacita = (realZ > 0 && trovato) ? 220 : 0;
    }
    
    fill(255, 0, 0, opacita); 
    box(15);
  }
  pop();

  gestisciParticelle();
  drawScannerUI();
  
  let vBase = configLivelli[livello].velBase;
  let velocitaRotazione = keyIsDown(32) ? vBase * 0.2 : vBase;
  rotazione += velocitaRotazione;
}

function mousePressed() {
  userStartAudio();
  if (statoGioco === "MENU") {
    if (mouseX > 300 && mouseX < 500 && mouseY > 450 && mouseY < 510) {
      statoGioco = "PLAY";
    }
  } else if (statoGioco === "PLAY" && trovato && cuboEsiste) {
    esplodiGuasto();
    punteggio++;
    suonaBip(200, 0.4);
    cuboEsiste = false; 
    
    if (punteggio === 5) {
      messaggioLivello = "GREAT!";
      timerMessaggio = 120;
    } else if (punteggio === 10) {
      messaggioLivello = "FANTASTIC!";
      timerMessaggio = 120;
    } else if (punteggio === 15) {
      messaggioLivello = "GOOD JOB!";
      timerMessaggio = 120;
    }

    setTimeout(generaNuovoGuasto, 500); 
  } else if (statoGioco === "WIN") {
    punteggio = 0; livello = 1; rotazione = 0; zoom = 1; particelle = [];
    generaNuovoGuasto();
    statoGioco = "MENU";
  }
}

function generaNuovoGuasto() {
  if (punteggio < 15) {
    let r = random(40, 150);
    guastoAngolo = random(TWO_PI);
    guastoPos = createVector(cos(guastoAngolo) * r, random(-70, 70), sin(guastoAngolo) * 40);
    guastoVelY = (livello === 3) ? random(1.8, 2.8) : random(-1.2, 1.2);
    if (random() > 0.5) guastoVelY *= -1;
    cuboEsiste = true;
    trovato = false;
  }
}

function drawScannerUI() {
  let baseSize = configLivelli[livello].sizeMirino;
  let size = keyIsDown(32) ? baseSize * 1.5 : baseSize;
  interfaccia.noFill();
  let c = configLivelli[livello].colore;
  interfaccia.stroke(trovato ? [255, 0, 0] : c);
  interfaccia.strokeWeight(2);
  interfaccia.ellipse(mouseX, mouseY, size, size);
  interfaccia.line(mouseX - 20, mouseY, mouseX + 20, mouseY);
  interfaccia.line(mouseX, mouseY - 20, mouseX, mouseY + 20);
}

function suonaBip(frequenza, durata) {
  oscillatore.freq(frequenza);
  oscillatore.amp(0.3, 0.05);
  setTimeout(() => { oscillatore.amp(0, 0.1); }, durata * 1000);
}

function esplodiGuasto() {
  for (let i = 0; i < 20; i++) {
    particelle.push({
      pos: createVector(guastoPos.x, guastoPos.y + oscillazioneY, guastoPos.z),
      vel: p5.Vector.random3D().mult(random(2, 5)),
      life: 255
    });
  }
}

function gestisciParticelle() {
  push();
  scale(zoom);
  rotateY(rotazione);
  noStroke();
  for (let i = particelle.length - 1; i >= 0; i--) {
    let p = particelle[i];
    p.pos.add(p.vel); p.life -= 5;
    fill(255, 100, 0, p.life);
    push(); translate(p.pos.x, p.pos.y, p.pos.z); sphere(2); pop();
    if (p.life <= 0) particelle.splice(i, 1);
  }
  pop();
}