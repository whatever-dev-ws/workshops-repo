let inkedPaws = [];
let pawSizeSlider, durSlider;
let fillMode = "SOLID";
let currentPaletteIdx = 0;
let canvasOverlayColor;

const MAX_PAWS = 100; 
let notifyText = ""; let notifyAlpha = 0; let notifyTimer = 0;

const palettes = [
  { name: "SHADOW GREY", col: [150, 150, 150], alpha: 40 },
  { name: "DEEP VOID", col: [20, 20, 30], alpha: 60 },
  { name: "NEON GHOST", col: [0, 255, 200], alpha: 30 },
  { name: "CRIMSON CREEP", col: [255, 50, 50], alpha: 35 }
];

function setup() {
  createCanvas(800, 600);
  canvasOverlayColor = color(255, 255, 255, 0); 

  // --- UI CONTROLS ---
  let clearBtn = createButton("CLEAR");
  clearBtn.position(20, 20);
  styleElement(clearBtn, '#444');
  clearBtn.mousePressed(() => { inkedPaws = []; canvasOverlayColor = color(255,0); triggerNotify("CLEARED"); });

  let colBtn = createButton("SHADOW THEME");
  colBtn.position(95, 20);
  styleElement(colBtn, '#444');
  colBtn.mousePressed(() => {
    currentPaletteIdx = (currentPaletteIdx + 1) % palettes.length;
    triggerNotify("THEME: " + palettes[currentPaletteIdx].name);
  });

  let modeBtn = createButton("FILL: SOLID");
  modeBtn.position(230, 20);
  styleElement(modeBtn, '#444');
  modeBtn.mousePressed(() => {
    fillMode = (fillMode === "SOLID") ? "STRIPES" : "SOLID";
    modeBtn.html("FILL: " + fillMode);
  });

  pawSizeSlider = createSlider(0.5, 3, 1, 0.1);
  pawSizeSlider.position(20, 55);

  let pngBtn = createButton("PNG");
  pngBtn.position(20, 85);
  styleElement(pngBtn, '#2196F3');
  pngBtn.mousePressed(() => saveCanvas('paws_optimized', 'png'));

  let gifBtn = createButton("GIF");
  gifBtn.position(75, 85);
  styleElement(gifBtn, '#FF9800');
  gifBtn.mousePressed(exportGif);

  durSlider = createSlider(1, 10, 3, 1);
  durSlider.position(125, 85);
}

// Utility for strict inline styling
function styleElement(btn, bgColor) {
  let e = btn.elt;
  e.style.backgroundColor = bgColor;
  e.style.color = 'white';
  e.style.border = 'none';
  e.style.padding = '4px 10px';
  e.style.borderRadius = '2px';
  e.style.cursor = 'pointer';
  e.style.fontSize = '11px';
  e.style.fontWeight = 'bold';
  e.style.transition = 'background 0.2s';

  btn.mouseOver(() => e.style.backgroundColor = '#666');
  btn.mouseOut(() => e.style.backgroundColor = bgColor);
}

function draw() {
  background(245);
  
  if (fillMode === "SOLID") {
    fill(canvasOverlayColor);
    noStroke();
    rect(0, 0, width, height);
  } else {
    drawStripePattern();
  }

  handleNotifications();

  // INPUT RECORDING
  if (mouseIsPressed && frameCount % 12 === 0 && mouseY > 140) {
    inkedPaws.push({ 
      x: mouseX, y: mouseY, 
      vx: random(-3, 3), vy: random(-3, 3), 
      spawnTime: millis(),
      isBehind: false,
      blurVal: 0,
      scaleMult: 1,
      bounceCount: 0
    });

    if (inkedPaws.length > MAX_PAWS) {
      inkedPaws.shift(); 
    }
  }

  let sPulse = map(sin(frameCount * 0.08), -1, 1, 0.8, 1.2);
  let pSetting = palettes[currentPaletteIdx];

  for (let i = inkedPaws.length - 1; i >= 0; i--) {
    let p = inkedPaws[i];
    
    if (millis() - p.spawnTime > 1500) { 
      p.x += p.vx; 
      p.y += p.vy; 
      
      if (p.x < 0 || p.x > width || p.y < 0 || p.y > height) {
        p.bounceCount++;
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        if (p.bounceCount === 3) {
          p.isBehind = true;
          p.blurVal = random(6, 12);
          p.scaleMult = random(2, 5);
          canvasOverlayColor = color(pSetting.col[0], pSetting.col[1], pSetting.col[2], pSetting.alpha);
          triggerNotify("SINKING...");
        }
      }
    }
    
    push();
    if (p.isBehind) {
      drawingContext.filter = `blur(${p.blurVal}px)`;
    }
    
    translate(p.x, p.y);
    let currentSize = pawSizeSlider.value() * sPulse * p.scaleMult;
    
    fill(pSetting.col[0], pSetting.col[1], pSetting.col[2], pSetting.alpha); 
    noStroke(); 
    ellipse(4, 4, 20 * currentSize, 15 * currentSize);
    
    if (!p.isBehind) {
      fill(0); 
      ellipse(0, 0, 18 * pawSizeSlider.value(), 14 * pawSizeSlider.value());
    }
    pop();

    if (p.isBehind && (p.x < -1000 || p.x > width + 1000 || p.y < -1000 || p.y > height + 1000)) {
      inkedPaws.splice(i, 1);
    }
  }

  // HUD
  fill(80); noStroke(); textSize(11);
  text("PAW SCALE", 160, 68);
  text("GIF: " + durSlider.value() + "s | ACTIVE: " + inkedPaws.length, 260, 100);
}

function drawStripePattern() {
  let p = palettes[currentPaletteIdx];
  stroke(p.col[0], p.col[1], p.col[2], alpha(canvasOverlayColor));
  strokeWeight(20);
  for (let i = -width; i < width + height; i += 60) {
    line(0, i, i, 0); 
  }
}

function handleNotifications() {
  if (notifyTimer > 0) {
    notifyTimer--;
    if (notifyTimer < 60) notifyAlpha = lerp(notifyAlpha, 0, 0.1);
  } else notifyAlpha = 0;
  if (notifyAlpha > 1) {
    push(); textAlign(LEFT, CENTER); textSize(12); textStyle(BOLD);
    fill(255, 0, 0, notifyAlpha); text(">> " + notifyText, 260, 28); pop();
  }
}

function triggerNotify(msg) { notifyText = msg; notifyAlpha = 255; notifyTimer = 180; }

function exportGif() {
  triggerNotify("RECORDING...");
  saveGif('paws_sketch', durSlider.value(), { delay: 0, units: 'seconds' });
}