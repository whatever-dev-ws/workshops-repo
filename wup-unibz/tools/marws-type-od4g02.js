//WUP 2025-26
//Marwa Charaf

let message = "LEGENDARY";

// --- VARIABILI GLOBALI ---
let inputField;
let sliderSize, sliderSpeed, sliderDistort, sliderEcho, sliderStroke;
let sliderAudioSens; 
let sliderRotX, sliderRotY, sliderRotZ;
let sliderVignette; 
let colorPickerVignette; // NUOVO: Selettore colore vignettatura

let colorPickerText, colorPickerBg;
let bgInput, btnClearBg; 
let bgImage = null; 

let selFont, selStyle, selLight, selFilter; 
let btnSaveImg, btnSaveGif;

let chkAudio, chkMouse, chkOutline, chkWave;
let mic;

function setup() {
  createCanvas(800, 400);
  textAlign(CENTER, CENTER);
  
  mic = new p5.AudioIn();

  // --- IMPORTAZIONE FONT GOOGLE ---
  let link = createElement('link');
  link.attribute('rel', 'stylesheet');
  link.attribute('href', 'https://fonts.googleapis.com/css2?family=Anton&family=Lobster&family=Orbitron:wght@900&family=Pacifico&family=VT323&display=swap');

  // --- INTERFACCIA UTENTE (UI) ---
  let uiArea = createDiv('');
  uiArea.position(0, 405);
  uiArea.style('background-color', '#151515'); 
  uiArea.style('color', '#eee');
  uiArea.style('padding', '15px');
  uiArea.style('font-family', 'Segoe UI, sans-serif');
  uiArea.style('font-size', '13px');
  uiArea.style('display', 'grid');
  uiArea.style('grid-template-columns', '1fr 1fr 1fr'); 
  uiArea.style('gap', '20px'); 
  uiArea.style('width', '770px');

  // ==========================================
  // COLONNA 1: CONTENUTO E ASPETTO
  // ==========================================
  let col1 = createDiv('').parent(uiArea);
  
  // SEZIONE TESTO
  createDiv('📝 <b>CONTENUTO TESTUALE</b>').parent(col1).style('color','#00d2ff').style('margin-bottom','8px');
  
  createDiv('Inserisci la parola:').parent(col1);
  inputField = createInput(message).parent(col1).style('width', '95%').input(updateText);

  // SEZIONE FONT
  createDiv('🔤 <b>FONT & STILE</b>').parent(col1).style('color','#00d2ff').style('margin-top','15px').style('margin-bottom','8px');
  
  createDiv('Seleziona Font (Google):').parent(col1);
  selFont = createSelect().parent(col1).style('width', '100%');
  selFont.option('sans-serif'); 
  selFont.option('Anton');      
  selFont.option('Orbitron');   
  selFont.option('Lobster');    
  selFont.option('VT323');      
  selFont.option('Pacifico');   

  createDiv('Stile (Grassetto/Corsivo):').parent(col1).style('margin-top','5px');
  selStyle = createSelect().parent(col1).style('width', '100%');
  selStyle.option('NORMAL');
  selStyle.option('ITALIC');
  selStyle.option('BOLD');

  createDiv('Colore Testo:').parent(col1).style('margin-top','5px');
  colorPickerText = createColorPicker('#ffffff').parent(col1);

  // SEZIONE SFONDO
  createDiv('🖼️ <b>SFONDO</b>').parent(col1).style('color','#00d2ff').style('margin-top','15px').style('margin-bottom','8px');
  
  createDiv('Colore Tinta Unita:').parent(col1);
  colorPickerBg = createColorPicker('#111111').parent(col1);
  
  createDiv('Oppure Carica Immagine:').parent(col1).style('margin-top','5px');
  bgInput = createFileInput(handleFile).parent(col1); 
  btnClearBg = createButton('❌ Rimuovi Immagine').parent(col1).mousePressed(() => bgImage = null);
  btnClearBg.style('margin-top','5px').style('font-size','11px').style('cursor','pointer');

  // ==========================================
  // COLONNA 2: GEOMETRIA E MOVIMENTO
  // ==========================================
  let col2 = createDiv('').parent(uiArea);
  
  // SEZIONE BORDO
  createDiv('✏️ <b>STILE BORDO (OUTLINE)</b>').parent(col2).style('color','#ffff00').style('margin-bottom','8px');
  chkOutline = createCheckbox(' Attiva Solo Bordo', false).parent(col2);
  
  createDiv('Spessore Bordo (px):').parent(col2);
  sliderStroke = createSlider(1, 20, 2).parent(col2).style('width', '95%');

  // SEZIONE 3D
  createDiv('🧊 <b>ROTAZIONE 3D</b>').parent(col2).style('color','#ffff00').style('margin-top','15px').style('margin-bottom','8px');
  createDiv('Ruota X (Capriola) / Y (Trottola) / Z').parent(col2).style('font-size','11px').style('opacity','0.7');
  
  sliderRotX = createSlider(0, TWO_PI, 0, 0.01).parent(col2).style('width', '30%');
  sliderRotY = createSlider(0, TWO_PI, 0, 0.01).parent(col2).style('width', '30%');
  sliderRotZ = createSlider(0, TWO_PI, 0, 0.01).parent(col2).style('width', '30%');

  // SEZIONE ANIMAZIONE
  createDiv('🌊 <b>PARAMETRI ONDULAZIONE</b>').parent(col2).style('color','#ffff00').style('margin-top','15px').style('margin-bottom','8px');
  chkWave = createCheckbox(' Animazione Attiva', true).parent(col2);
  
  createDiv('Grandezza Testo:').parent(col2);
  sliderSize = createSlider(10, 200, 80).parent(col2).style('width', '95%'); 
  
  createDiv('Velocità Movimento:').parent(col2);
  sliderSpeed = createSlider(0, 0.5, 0.05, 0.01).parent(col2).style('width', '95%');
  
  createDiv('Intensità Distorsione:').parent(col2);
  sliderDistort = createSlider(0, 150, 40).parent(col2).style('width', '95%');

  // ==========================================
  // COLONNA 3: EFFETTI E INPUT
  // ==========================================
  let col3 = createDiv('').parent(uiArea);
  
  // SEZIONE INPUT
  createDiv('🎮 <b>INPUT ESTERNI</b>').parent(col3).style('color','#ff3333').style('margin-bottom','8px');
  chkMouse = createCheckbox(' Mouse Repulsione 🧲', false).parent(col3);
  chkAudio = createCheckbox(' Audio Microfono 🎤', false).parent(col3);
  chkAudio.changed(toggleAudio);
  
  createDiv('Sensibilità Audio (Gain):').parent(col3);
  sliderAudioSens = createSlider(0, 2000, 800).parent(col3).style('width', '95%');

  // SEZIONE FX
  createDiv('✨ <b>POST-PROCESSING</b>').parent(col3).style('color','#ff3333').style('margin-top','15px').style('margin-bottom','8px');
  
  createDiv('Scia / Echo (Trasparenza):').parent(col3);
  sliderEcho = createSlider(5, 255, 255).parent(col3).style('width', '95%');

  createDiv('Luci Ambientali:').parent(col3).style('margin-top','5px');
  selLight = createSelect().parent(col3).style('width', '100%');
  ['Nessuna', 'Caldo (Tramonto)', 'Freddo (Cyber)', 'Neon Pink', 'Matrix Green'].forEach(l => selLight.option(l));
  
  createDiv('Filtri Pixel:').parent(col3).style('margin-top','5px');
  selFilter = createSelect().parent(col3).style('width', '100%');
  ['Nessuno', 'Noise (Grana)', 'Pixelate', 'Inverti'].forEach(f => selFilter.option(f));
  
  // --- NUOVA SEZIONE VIGNETTATURA (Intensità + Colore) ---
  createDiv('🌑 Vignettatura (Intensità & Colore):').parent(col3).style('margin-top','15px').style('font-weight','bold');
  // Contenitore flessibile per mettere slider e colore vicini
  let vigContainer = createDiv('').parent(col3).style('display','flex').style('gap','10px').style('align-items','center');
  sliderVignette = createSlider(0, 255, 0).parent(vigContainer).style('flex-grow', '1');
  colorPickerVignette = createColorPicker('#000000').parent(vigContainer).style('width', '50px');

  // EXPORT
  let btnArea = createDiv('').parent(uiArea);
  btnArea.style('grid-column','span 3');
  btnArea.style('text-align','center');
  btnArea.style('border-top','1px solid #333');
  btnArea.style('padding-top','15px');
  
  btnSaveImg = createButton('📸 SCARICA PNG').parent(btnArea).mousePressed(saveArt).style('margin-right','15px').style('padding','5px 15px').style('cursor','pointer');
  btnSaveGif = createButton('🎥 REGISTRA GIF').parent(btnArea).mousePressed(saveAnim).style('padding','5px 15px').style('cursor','pointer');
}

function handleFile(file) {
  if (file.type === 'image') { bgImage = loadImage(file.data); } else { bgImage = null; }
}
function updateText() { message = this.value(); }
function toggleAudio() {
  if (this.checked()) { userStartAudio(); mic.start(); } else { mic.stop(); }
}

function draw() {
  // --- GESTIONE SFONDO ---
  if (bgImage) {
    tint(255, sliderEcho.value()); 
    image(bgImage, 0, 0, width, height);
    noTint(); 
  } else {
    let bgCol = colorPickerBg.color();
    bgCol.setAlpha(sliderEcho.value());
    background(bgCol);
  }

  let baseSize = sliderSize.value();
  let speed = sliderSpeed.value();
  let distortion = sliderDistort.value();
  let txtColor = colorPickerText.color();
  let sens = sliderAudioSens.value(); 
  
  textFont(selFont.value());
  textStyle(selStyle.value());

  if (chkAudio.checked()) {
    let vol = mic.getLevel(); 
    // Visualizzatore Audio (barra verde a destra)
    push(); noStroke(); fill(0, 255, 0);
    let hBar = map(vol, 0, 0.1, 0, height); 
    rect(width - 5, height - hBar, 5, hBar);
    pop();
    let audioBoost = vol * sens; 
    distortion += audioBoost; 
    baseSize += audioBoost * 0.8;
  }

  let xCenter = width / 2;
  let yCenter = height / 2;

  push(); 
  translate(xCenter, yCenter);
  // Rotazione 3D Simulata
  rotate(sliderRotZ.value());
  scale(cos(sliderRotY.value()), cos(sliderRotX.value()));

  for (let i = 0; i < message.length; i++) {
    let char = message.charAt(i);
    let time = frameCount * speed;
    let tracking = baseSize * 0.6;
    let xPos = (i - message.length / 2) * tracking;
    let yPos = 0; 
    
    let waveX = 0, waveY = 0, rotWave = 0;
    if (chkWave.checked()) {
      waveY = sin(time + i * 0.5) * distortion;
      waveX = cos(time * 0.8 + i) * (distortion * 0.3);
      rotWave = sin(time + i) * map(distortion, 0, 500, 0, PI); 
    }

    let mOffX = 0, mOffY = 0;
    if (chkMouse.checked()) {
      let mx = mouseX - width/2;
      let my = mouseY - height/2;
      let d = dist(mx, my, xPos + waveX, yPos + waveY);
      if (d < 200) {
        let f = map(d, 0, 200, 1, 0);
        let ang = atan2((yPos + waveY) - my, (xPos + waveX) - mx);
        mOffX = cos(ang) * f * 150;
        mOffY = sin(ang) * f * 150;
      }
    }

    push();
    translate(xPos + waveX + mOffX, yPos + waveY + mOffY);
    rotate(rotWave); 
    textSize(baseSize);

    if (chkOutline.checked()) {
      noFill();
      stroke(txtColor);
      strokeWeight(sliderStroke.value());
    } else {
      noStroke();
      fill(txtColor);
    }
    
    text(char, 0, 0);
    pop();
  }
  pop(); 

  // --- EFFETTI FINALI ---
  if (selLight.value() !== 'Nessuna') applyLighting(selLight.value());
  
  // VIGNETTATURA (Controllata da slider e colore)
  let vigAmt = sliderVignette.value();
  if (vigAmt > 0) {
    drawVignette(vigAmt);
  }
  
  if (selFilter.value() !== 'Nessuno') applyFilters(selFilter.value());
}

function applyLighting(type) {
  push(); blendMode(OVERLAY); noStroke();
  if (type.includes('Caldo')) fill(255, 150, 0, 80);
  else if (type.includes('Freddo')) fill(0, 150, 255, 80);
  else if (type.includes('Neon')) fill(255, 0, 150, 60);
  else if (type.includes('Matrix')) fill(0, 255, 50, 50);
  rect(0, 0, width, height);
  pop();
}

// --- FUNZIONE VIGNETTATURA AGGIORNATA (Più intensa e colorata) ---
function drawVignette(intensity) {
  let ctx = drawingContext;
  
  // Preleva il colore dal nuovo color picker
  let vigColor = colorPickerVignette.color();
  let r = red(vigColor);
  let g = green(vigColor);
  let b = blue(vigColor);
  
  // Normalizza l'intensità da 0-255 a 0.0-1.0
  let alphaNorm = intensity / 255;

  // Gradiente radiale. 
  // Per renderlo più intenso, riduciamo il raggio esterno (width * 0.85 invece di width)
  // così il colore pieno inizia più vicino al centro.
  let grad = ctx.createRadialGradient(width/2, height/2, width/4, width/2, height/2, width * 0.85);

  // Centro trasparente (usa il colore scelto ma con alpha 0)
  grad.addColorStop(0, `rgba(${r},${g},${b},0)`);

  // Stop intermedio per spingere l'oscurità più all'interno (intensifica l'effetto)
  grad.addColorStop(0.6, `rgba(${r},${g},${b}, ${alphaNorm * 0.4})`);

  // Esterno col colore scelto e l'opacità definita dallo slider
  grad.addColorStop(1, `rgba(${r},${g},${b}, ${alphaNorm})`);

  ctx.fillStyle = grad;
  // Disegna il rettangolo della vignettatura sopra tutto
  ctx.fillRect(0,0,width,height);
}

function applyFilters(t) {
  if (t.includes('Noise')) {
    loadPixels();
    for(let i=0; i<pixels.length; i+=4) { 
       if(random() > 0.85) { 
         let val = random(-50, 50);
         pixels[i] = constrain(pixels[i]+val,0,255);
         pixels[i+1] = constrain(pixels[i+1]+val,0,255);
         pixels[i+2] = constrain(pixels[i+2]+val,0,255);
       }
    }
    updatePixels();
  } else if (t.includes('Pixelate')) {
    let s = 8; noStroke();
    for(let y=0; y<height; y+=s) {
      for(let x=0; x<width; x+=s) {
        fill(get(x,y)); rect(x,y,s,s);
      }
    }
  } else if (t.includes('Inverti')) filter(INVERT);
}

function saveArt() { saveCanvas('kinetic_typo', 'png'); }
function saveAnim() { saveGif('kinetic_anim', 3); }