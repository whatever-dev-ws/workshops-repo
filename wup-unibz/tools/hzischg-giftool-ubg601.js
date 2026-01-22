//WUP2025/26
//Hannah MArlen Zischg
/**
 * 3D MOTION STUDIO - VERSIONE STANDALONE (PURO JS)
 * Questo codice contiene TUTTO: motore 3D, interfaccia grafica e gestione input.
 * Non richiede HTML o CSS esterni.
 */

// --- 1. CONFIGURAZIONE GLOBALE ---
let shape3D = { type: 'cube', vertices: [], size: 140, segments: 24 };

// Parametri modificabili dall'interfaccia
let params = {
  morph: 20, twist: 0, bulge: 0, noise: 0, wave: 30, explode: 0, // Deformazioni
  rotSpeed: 1.5, autoRotate: true, zoom: 1.0,                    // Camera
  hue: 330,                                                      // Colore
  fillShape: true,   // Checkbox "Pieno"
  wireframe: true,   // Checkbox "Linee"
  trails: false      // Checkbox "Scie"
};

let autoAngle = 0;
let sidebarWidth = 280; // Larghezza della barra laterale

// Variabili di sistema (Non toccare)
let uiLayer;          // Livello grafico per l'interfaccia 2D
let uiZones = [];     // Elenco delle aree cliccabili
let activeSlider = null; // Slider attualmente trascinato

function setup() {
  // Crea l'area di disegno 3D grande quanto la finestra
  createCanvas(windowWidth, windowHeight, WEBGL);
  pixelDensity(1);
  
  // Crea un "foglio trasparente" (buffer) su cui disegneremo l'interfaccia
  // Questo risolve i problemi di visibilità del testo in WebGL
  uiLayer = createGraphics(windowWidth, windowHeight);
  
  // Inizializza la forma geometrica
  initShape();
}

function draw() {
  // --- A. GESTIONE SFONDO E SCIE ---
  if (params.trails) {
    // Se le scie sono attive, disegniamo un velo semitrasparente invece di cancellare tutto
    push();
    translate(0, 0, -500); // Ci spostiamo dietro la forma
    noStroke();
    fill(20, 20, 25, 20);  // Sfondo scuro molto trasparente
    plane(width * 5, height * 5); 
    pop();
    
    // TRUCCO WEBGL: Puliamo il Depth Buffer affinché la nuova forma sia disegnata sopra la scia vecchia
    let gl = drawingContext;
    gl.clear(gl.DEPTH_BUFFER_BIT);
  } else {
    // Comportamento standard: pulisci tutto lo schermo
    background(20, 20, 25);
  }

  // --- B. GESTIONE CAMERA (OrbitControl) ---
  // Attiviamo la rotazione col mouse SOLO se non siamo sopra la barra laterale
  if (mouseX > sidebarWidth && !activeSlider) {
    orbitControl();
  }

  // --- C. DISEGNO SCENA 3D ---
  push();
  // Spostiamo il centro del mondo 3D verso destra per non finire sotto l'interfaccia
  translate((width - sidebarWidth) / 2 - width/2 + sidebarWidth, 0, 0); 
  scale(params.zoom);

  // Rotazione Automatica
  if (params.autoRotate && !mouseIsPressed) {
    autoAngle += 0.01 * params.rotSpeed;
    rotateX(autoAngle);
    rotateY(autoAngle * 0.7);
  }

  // Impostazione Luci e Materiali
  if(params.fillShape) {
    colorMode(HSB, 360, 100, 100);
    fill(params.hue, 70, 90);
    colorMode(RGB, 255);
    ambientLight(80);
    directionalLight(255, 255, 255, 0.5, 1, -1);
    pointLight(255, 255, 255, 0, 0, 200);
  } else {
    noFill();
  }

  if(params.wireframe) {
    colorMode(HSB, 360, 100, 100);
    stroke(params.hue, 90, 100);
    colorMode(RGB, 255);
    strokeWeight(1.2);
  } else {
    noStroke();
  }

  // Renderizza la geometria calcolata
  renderShape();
  pop();

  // --- D. DISEGNO INTERFACCIA (UI) ---
  // 1. Calcoliamo e disegniamo l'interfaccia sul livello separato uiLayer
  drawInterface(); 
  
  // 2. "Incolliamo" l'immagine dell'interfaccia sopra al mondo 3D
  push();
  resetMatrix(); // Resetta trasformazioni 3D
  camera(0, 0, (height/2.0) / tan(PI*30.0 / 180.0), 0, 0, 0, 0, 1, 0); // Camera 2D piatta
  noLights();
  translate(-width/2, -height/2); // Allinea in alto a sinistra
  image(uiLayer, 0, 0); // Mostra l'interfaccia
  pop();
}

// =========================================================
//           MOTORE INTERFACCIA (IMMEDIATE MODE GUI)
// =========================================================

function drawInterface() {
  // Pulisce il livello UI per il nuovo frame
  uiLayer.clear();
  
  // Sfondo Barra Laterale
  uiLayer.noStroke();
  uiLayer.fill(18, 18, 18, 245); 
  uiLayer.rect(0, 0, sidebarWidth, height);
  uiLayer.stroke(60);
  uiLayer.line(sidebarWidth, 0, sidebarWidth, height);

  // Svuota le zone cliccabili (verranno riempite ridisegnando i bottoni)
  uiZones = [];

  // TITOLO
  uiLayer.fill(255); uiLayer.noStroke();
  uiLayer.textSize(18); uiLayer.textStyle(BOLD); uiLayer.textAlign(LEFT, TOP);
  uiLayer.text("3D MOTION STUDIO", 20, 25);
  
  let y = 80; // Posizione verticale di partenza
  uiLayer.textSize(12); uiLayer.textStyle(NORMAL);

  // 1. BOTTONI FORMA
  drawLabel("FORMA", 20, y); y += 25;
  drawButton("CUBO", 20, y, 100, 30, shape3D.type === 'cube', () => { shape3D.type = 'cube'; initShape(); });
  drawButton("SFERA", 130, y, 100, 30, shape3D.type === 'sphere', () => { shape3D.type = 'sphere'; initShape(); });
  y += 50;

  // 2. BOTTONI PRESET
  drawLabel("PRESET RAPIDI", 20, y); y += 25;
  drawButton("Cyber", 20, y, 115, 25, false, () => applyPreset('cyber'));
  drawButton("Liquid", 145, y, 115, 25, false, () => applyPreset('liquid'));
  y += 30;
  drawButton("Chaos", 20, y, 115, 25, false, () => applyPreset('chaos'));
  drawButton("Zen", 145, y, 115, 25, false, () => applyPreset('zen'));
  y += 50;

  // 3. SLIDERS
  drawLabel("DEFORMAZIONI", 20, y); y += 25;
  drawSlider("Morphing", "morph", 0, 100, 20, y); y += 40;
  drawSlider("Rotazione", "twist", 0, 100, 20, y); y += 40;
  drawSlider("Gonfiore", "bulge", 0, 100, 20, y); y += 40;
  drawSlider("Rumore", "noise", 0, 100, 20, y); y += 40;
  drawSlider("Onde", "wave", 0, 100, 20, y); y += 40;
  drawSlider("Esplosione", "explode", 0, 200, 20, y); y += 50;

  // 4. CHECKBOX E STILE
  drawLabel("STILE & CAMERA", 20, y); y += 25;
  drawSlider("Colore (Hue)", "hue", 0, 360, 20, y); y += 40;
  drawSlider("Zoom", "zoom", 0.5, 3.0, 20, y); y += 40;
  drawSlider("Velocità", "rotSpeed", 0, 5.0, 20, y); y += 45;

  drawCheckbox("Pieno", "fillShape", 20, y);
  drawCheckbox("Linee", "wireframe", 100, y);
  drawCheckbox("Scie", "trails", 180, y);
  y += 50;

  // 5. SCREENSHOT
  drawButton("📸 SCATTA FOTO", 20, y, 240, 35, false, () => saveCanvas('Design_3D', 'png'));
}

// --- Funzioni Helper per disegnare i componenti UI ---

function drawLabel(txt, x, y) {
  uiLayer.fill(180); uiLayer.noStroke(); uiLayer.textAlign(LEFT, BASELINE);
  uiLayer.text(txt, x, y);
}

function drawButton(label, x, y, w, h, isActive, callback) {
  // Controlla hover
  let hover = mouseX >= x && mouseX <= x+w && mouseY >= y && mouseY <= y+h;
  
  // Sceglie colore
  if (isActive) uiLayer.fill(0, 150, 255); // Attivo (Blu)
  else if (hover) uiLayer.fill(60);       // Hover (Grigio chiaro)
  else uiLayer.fill(40);                  // Default (Grigio scuro)
  
  uiLayer.stroke(100);
  uiLayer.rect(x, y, w, h, 4); // Rettangolo bottone
  
  uiLayer.fill(255); uiLayer.noStroke(); uiLayer.textAlign(CENTER, CENTER);
  uiLayer.text(label, x + w/2, y + h/2 + 1); // Testo centrato
  
  // Registra zona cliccabile
  uiZones.push({ type: 'btn', x, y, w, h, callback });
}

function drawSlider(label, key, min, max, x, y) {
  let w = 240; let h = 8;
  let val = params[key];
  
  // Etichette testo
  uiLayer.fill(200); uiLayer.noStroke(); uiLayer.textAlign(LEFT, BOTTOM);
  uiLayer.text(label, x, y - 5);
  uiLayer.fill(0, 180, 255); uiLayer.textAlign(RIGHT, BOTTOM);
  uiLayer.text(val.toFixed(1), x + w, y - 5);
  
  // Barra Sfondo
  uiLayer.fill(50); uiLayer.stroke(80);
  uiLayer.rect(x, y, w, h, 4);
  
  // Calcolo posizione
  let t = map(val, min, max, 0, 1);
  let hx = x + t * w;
  
  // Barra Attiva (Blu)
  uiLayer.fill(0, 150, 255); uiLayer.noStroke();
  uiLayer.rect(x, y, hx - x, h, 4);
  
  // Pallino
  uiLayer.fill(255); uiLayer.stroke(0);
  uiLayer.circle(hx, y + h/2, 14);
  
  // Registra zona slider (più grande per facilitare il click)
  uiZones.push({ 
    type: 'slider', key: key, min: min, max: max, 
    x: x, y: y - 15, w: w, h: 30 
  });
}

function drawCheckbox(label, key, x, y) {
  let s = 20; // Dimensione box
  let isChecked = params[key];
  
  uiLayer.stroke(120);
  if (isChecked) uiLayer.fill(0, 150, 255);
  else uiLayer.fill(40);
  
  uiLayer.rect(x, y, s, s, 4);
  
  if (isChecked) {
    uiLayer.stroke(255); uiLayer.strokeWeight(2);
    // Disegna la "V"
    uiLayer.line(x+5, y+10, x+8, y+14);
    uiLayer.line(x+8, y+14, x+15, y+6);
    uiLayer.strokeWeight(1);
  }
  
  uiLayer.fill(220); uiLayer.noStroke(); uiLayer.textAlign(LEFT, CENTER);
  uiLayer.text(label, x + s + 8, y + s/2);
  
  // Registra zona cliccabile (Box + Testo)
  let labelW = uiLayer.textWidth(label);
  uiZones.push({ 
    type: 'btn', x: x, y: y, w: s + 10 + labelW, h: s, 
    callback: () => params[key] = !params[key] 
  });
}

// =========================================================
//           GESTIONE INPUT MOUSE (ESSENZIALE)
// =========================================================

function mousePressed() {
  // Controlla se abbiamo cliccato su un elemento UI
  for (let z of uiZones) {
    if (mouseX >= z.x && mouseX <= z.x + z.w && 
        mouseY >= z.y && mouseY <= z.y + z.h) {
      
      if (z.type === 'btn') {
        z.callback(); // Esegui azione bottone
      } else if (z.type === 'slider') {
        activeSlider = z; // Attiva slider
        updateSlider();
      }
      return; // Stop propagation
    }
  }
}

function mouseDragged() {
  if (activeSlider) updateSlider();
}

function mouseReleased() {
  activeSlider = null;
}

function updateSlider() {
  if (!activeSlider) return;
  let s = activeSlider;
  // Mappa la posizione X del mouse al valore dello slider
  let val = map(mouseX, s.x, s.x + s.w, s.min, s.max);
  val = constrain(val, s.min, s.max);
  params[s.key] = val;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  uiLayer.resizeCanvas(windowWidth, windowHeight);
}

// =========================================================
//           LOGICA GEOMETRIA 3D & DEFORMAZIONI
// =========================================================

function initShape() {
  shape3D.vertices = [];
  let d = shape3D.segments;
  let s = 1;

  if (shape3D.type === 'cube') {
    // Definizione vertici Cubo
    shape3D.vertices = [
      {n: [0,0,1], v:[[-s,-s,s],[s,-s,s],[s,s,s],[-s,s,s]]}, 
      {n: [0,0,-1], v:[[-s,-s,-s],[-s,s,-s],[s,s,-s],[s,-s,-s]]},
      {n: [-1,0,0], v:[[-s,-s,-s],[-s,-s,s],[-s,s,s],[-s,s,-s]]}, 
      {n: [1,0,0], v:[[s,-s,-s],[s,s,-s],[s,s,s],[s,-s,s]]},
      {n: [0,1,0], v:[[-s,s,-s],[-s,s,s],[s,s,s],[s,s,-s]]}, 
      {n: [0,-1,0], v:[[-s,-s,-s],[s,-s,-s],[s,-s,s],[-s,-s,s]]}
    ];
  } else if (shape3D.type === 'sphere') {
    // Definizione vertici Sfera
    for(let i=0; i<=d; i++){
      let lat = map(i,0,d,0,PI);
      for(let j=0; j<=d; j++){
        let lon = map(j,0,d,0,TWO_PI);
        let x = sin(lat) * cos(lon);
        let y = cos(lat);
        let z = sin(lat) * sin(lon);
        shape3D.vertices.push(createVector(x, y, z));
      }
    }
  }
}

function renderShape() {
  let s = shape3D.size;
  
  if (shape3D.type === 'cube') {
    shape3D.vertices.forEach((face, i) => {
      push();
      // Effetto Esplosione (sposta le facce lungo la normale)
      translate(face.n[0]*params.explode, face.n[1]*params.explode, face.n[2]*params.explode);
      beginShape();
      face.v.forEach(v => {
        let p = applyDeform(v[0]*s, v[1]*s, v[2]*s, i);
        vertex(p.x, p.y, p.z);
      });
      endShape(CLOSE);
      pop();
    });
  } else {
    let d = shape3D.segments;
    for (let i = 0; i < d; i++) {
      beginShape(TRIANGLE_STRIP);
      for (let j = 0; j <= d; j++) {
        [i * (d + 1) + j, (i + 1) * (d + 1) + j].forEach(idx => {
          let v = shape3D.vertices[idx];
          if(v) {
            let p = applyDeform(v.x*s, v.y*s, v.z*s, idx);
            // Effetto Esplosione (sposta i vertici dal centro)
            let dir = p.copy().normalize();
            p.add(dir.mult(params.explode));
            vertex(p.x, p.y, p.z);
          }
        });
      }
      endShape();
    }
  }
}

function applyDeform(x, y, z, i) {
  let p = createVector(x, y, z);
  let t = frameCount * 0.05;
  
  // 1. Morphing
  if (params.morph > 0) p.mult(1 + (params.morph/150) * sin(t + i*0.1));
  
  // 2. Twist (Rotazione a spirale)
  if (params.twist > 0) {
    let angle = (p.y / 200) * (params.twist/8);
    let nx = p.x * cos(angle) - p.z * sin(angle);
    let nz = p.x * sin(angle) + p.z * cos(angle);
    p.x = nx; p.z = nz;
  }
  
  // 3. Bulge (Gonfiore)
  if (params.bulge > 0) p.mult(1 + (params.bulge/150) * sin(p.mag() * 0.03 + t));
  
  // 4. Noise (Distorsione casuale)
  if (params.noise > 0) {
    p.x += (noise(p.x*0.01, t) - 0.5) * params.noise;
    p.y += (noise(p.y*0.01, t+10) - 0.5) * params.noise;
    p.z += (noise(p.z*0.01, t+20) - 0.5) * params.noise;
  }
  
  // 5. Wave (Onde sinusoidali)
  if (params.wave > 0) {
    p.x += sin(p.y * 0.04 + t) * (params.wave/1.5);
    p.z += cos(p.y * 0.04 + t) * (params.wave/1.5);
  }
  
  return p;
}

function applyPreset(name) {
  // Resetta tutto
  params.morph=0; params.twist=0; params.bulge=0; params.noise=0; params.wave=0; params.explode=0;
  params.trails=false; params.fillShape=true; params.wireframe=true; params.zoom=1;

  // Applica impostazioni specifiche
  if (name === 'cyber') {
    shape3D.type = 'cube'; initShape();
    params.wireframe = true; params.fillShape = false;
    params.hue = 190; params.noise = 60; params.explode = 40; params.rotSpeed = 2;
  } else if (name === 'liquid') {
    shape3D.type = 'sphere'; initShape();
    params.fillShape = true; params.wireframe = false;
    params.hue = 280; params.morph = 40; params.bulge = 30; params.wave = 50; params.zoom = 1.2;
  } else if (name === 'chaos') {
    shape3D.type = 'cube'; initShape();
    params.fillShape = true; params.wireframe = true;
    params.hue = 10; params.twist = 80; params.explode = 100; params.trails = true;
  } else if (name === 'zen') {
    shape3D.type = 'sphere'; initShape();
    params.fillShape = false; params.wireframe = true;
    params.hue = 0; params.wave = 10; params.rotSpeed = 0.5; params.zoom = 1.3;
  }
}