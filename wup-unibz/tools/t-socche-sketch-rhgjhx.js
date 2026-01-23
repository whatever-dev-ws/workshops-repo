let nodes = [];
let maxNodes = 1000;
let guiContenitore;
let guiVisibile = true;
let isMenuHovered = false;

// Global Controls
let selectedColor = '#FFFFFF'; 
let smokeLifeSpeed = 2; 
let smokeFracture = 2.0; 

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 360, 100, 100, 1);
  setupGui();
}

function setupGui() {
  // --- CSS ANIMATION FOR SMOKY BORDER ---
  let styleSheet = createElement('style', `
    @keyframes smoke-pulse {
      0% { 
        box-shadow: 0 0 15px rgba(255,255,255,0.05), inset 0 0 10px rgba(255,255,255,0.05); 
        border-color: rgba(255,255,255,0.1);
      }
      50% { 
        box-shadow: 0 0 30px rgba(255,255,255,0.2), inset 0 0 20px rgba(255,255,255,0.1); 
        border-color: rgba(255,255,255,0.3);
      }
      100% { 
        box-shadow: 0 0 15px rgba(255,255,255,0.05), inset 0 0 10px rgba(255,255,255,0.05); 
        border-color: rgba(255,255,255,0.1);
      }
    }
  `);

  // --- SMOKY UI DESIGN ---
  guiContenitore = createDiv('').style('position', 'fixed').style('top', '20px').style('left', '20px')
    .style('background', 'rgba(10, 10, 10, 0.6)') 
    .style('backdrop-filter', 'blur(10px)')       
    .style('-webkit-backdrop-filter', 'blur(10px)') 
    .style('padding', '25px')
    .style('color', '#eee')
    .style('font-family', 'Helvetica, Arial, sans-serif')
    .style('font-weight', '300')
    .style('border-radius', '20px')
    .style('border', '1px solid rgba(255, 255, 255, 0.1)') 
    .style('animation', 'smoke-pulse 4s infinite ease-in-out')
    .style('z-index', '1000').style('width', '240px');

  guiContenitore.mouseOver(() => isMenuHovered = true);
  guiContenitore.mouseOut(() => isMenuHovered = false);

  // Title
  createDiv('ETHERIAL SMOKE').parent(guiContenitore)
    .style('color', 'rgba(255,255,255,0.8)')
    .style('font-size', '14px')
    .style('letter-spacing', '3px')
    .style('margin-bottom', '15px')
    .style('text-align', 'center')
    .style('text-shadow', '0 0 10px rgba(255,255,255,0.5)');

  // 1. Life Slider
  creaLabel("DISSIPATION SPEED", guiContenitore);
  let lifeSlider = createSlider(0.5, 10, 2, 0.5).parent(guiContenitore).style('width', '100%').style('opacity', '0.7');
  lifeSlider.input(() => smokeLifeSpeed = lifeSlider.value());

  // 2. Fracture/Turbulence Slider (UPDATED MINIMUM)
  // Min is now 0.1, allowing for much smoother, less fractured lines.
  creaLabel("TURBULENCE (FRACTURE)", guiContenitore);
  let fractureSlider = createSlider(0.1, 10, 2, 0.1).parent(guiContenitore).style('width', '100%').style('opacity', '0.7');
  fractureSlider.input(() => smokeFracture = fractureSlider.value());

  // 3. Color Picker
  creaLabel("VAPOR COLOR", guiContenitore);
  let cp = createColorPicker(selectedColor).parent(guiContenitore).style('width', '100%').style('border', 'none').style('height', '30px').style('cursor', 'pointer');
  cp.input(() => selectedColor = cp.value());

  // Divider
  createDiv('').parent(guiContenitore).style('height','1px').style('background','linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)').style('margin','15px 0');

  // 4. Export Controls
  let btnStyle = 'width: 100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #ddd; padding: 8px; margin-top: 5px; cursor: pointer; border-radius: 6px; transition: all 0.3s; font-size: 11px; letter-spacing: 1px;';
  
  let saveBtn = createButton('SAVE SNAPSHOT').parent(guiContenitore).style(btnStyle);
  saveBtn.mouseOver(() => saveBtn.style('background', 'rgba(255,255,255,0.15)').style('box-shadow', '0 0 10px rgba(255,255,255,0.1)'));
  saveBtn.mouseOut(() => saveBtn.style('background', 'rgba(255,255,255,0.05)').style('box-shadow', 'none'));
  saveBtn.mousePressed(() => saveCanvas('smoke_art', 'png'));
  
  let gifSecs = createSelect().parent(guiContenitore).style('width', '100%').style('margin-top', '5px').style('background', 'rgba(0,0,0,0.3)').style('color', 'white').style('border', 'none').style('padding', '5px');
  [3, 5, 10].forEach(s => gifSecs.option(s + 's GIF'));
  
  let gifBtn = createButton('RECORD GIF').parent(guiContenitore).style(btnStyle);
  gifBtn.mousePressed(() => {
    saveGif('smoke_anim', parseInt(gifSecs.value()));
  });

  let clearBtn = createButton('CLEAR SKY').parent(guiContenitore).style(btnStyle);
  clearBtn.mousePressed(() => nodes = []);

  // Toggle Button
  let toggleBtn = createButton('☰').position(20, 20)
    .style('z-index', '1001')
    .style('background', 'rgba(50,50,50,0.3)')
    .style('backdrop-filter', 'blur(5px)')
    .style('color', 'white')
    .style('border', '1px solid rgba(255,255,255,0.2)')
    .style('border-radius', '50%')
    .style('width', '35px')
    .style('height', '35px')
    .style('cursor', 'pointer')
    .style('transition', 'all 0.3s');
    
  toggleBtn.mouseOver(() => {
    isMenuHovered = true;
    toggleBtn.style('background', 'rgba(255,255,255,0.1)').style('box-shadow', '0 0 15px white');
  });
  toggleBtn.mouseOut(() => {
    isMenuHovered = false;
    toggleBtn.style('background', 'rgba(50,50,50,0.3)').style('box-shadow', 'none');
  });
  toggleBtn.mousePressed(() => {
    guiVisibile = !guiVisibile;
    guiContenitore.style('display', guiVisibile ? 'block' : 'none');
  });
}

function creaLabel(t, p) {
  createSpan(t).parent(p).style('font-size', '10px').style('display', 'block').style('color', 'rgba(255,255,255,0.5)').style('margin-top', '12px').style('letter-spacing', '1px');
}

function draw() {
  background(10, 0.2); 

  if (mouseIsPressed && !isMenuHovered) {
    nodes.push(new GhostNode(mouseX, mouseY, selectedColor));
    if (nodes.length > maxNodes) nodes.shift();
  }

  for (let i = nodes.length - 1; i >= 0; i--) {
    let n = nodes[i];
    n.update();
    
    for (let j = 0; j < nodes.length; j++) {
      let other = nodes[j];
      let d = p5.Vector.dist(n.pos, other.pos);
      
      if (d > 5 && d < n.maxReach) {
        let alpha = map(d, 5, n.maxReach, n.life / 255, 0);
        stroke(hue(n.col), saturation(n.col), brightness(n.col), alpha);
        
        strokeWeight(map(n.life, 255, 0, 1.5, 0.05));
        
        noFill();
        beginShape();
        vertex(n.pos.x, n.pos.y);
        controlPt(n.pos, other.pos, n.vel, n.life, smokeFracture);
        vertex(other.pos.x, other.pos.y);
        endShape();
      }
    }

    if (n.isDead()) nodes.splice(i, 1);
  }
}

class GhostNode {
  constructor(x, y, col) {
    this.pos = createVector(x, y);
    this.vel = createVector(mouseX - pmouseX, mouseY - pmouseY).limit(10);
    this.col = color(col);
    this.life = 255;
    this.maxReach = 60; 
  }

  update() {
    this.life -= smokeLifeSpeed;
    this.maxReach += 0.5; 
    
    // Subtle drift
    let driftX = map(noise(frameCount * 0.01 + this.pos.y), 0, 1, -1, 1);
    let driftY = map(noise(frameCount * 0.01 + this.pos.x), 0, 1, -1, 0); 
    
    this.pos.add(driftX, driftY);
  }

  isDead() { return this.life <= 0; }
}

function controlPt(p1, p2, vel, life, fracture) {
  let mid = p5.Vector.lerp(p1, p2, 0.5);
  
  let curveBase = map(life, 255, 0, 10, 100);
  
  // Adjusted logic: Low fracture values now allow for much smoother lines
  let noiseVal = noise(mid.x * 0.01, mid.y * 0.01, frameCount * 0.02);
  let turbulence = map(noiseVal, 0, 1, -1, 1) * 30 * fracture; 
  
  let offset = vel.copy().rotate(HALF_PI).setMag(curveBase + turbulence);
  
  if(fracture > 5) {
      offset.rotate(random(-0.5, 0.5));
  }

  quadraticVertex(mid.x + offset.x, mid.y + offset.y, p2.x, p2.y);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}