// WUP 25 - 26
// Angela Santolini
let particles = [];
let NUM_PARTICLES = 30; 
let amplitude = 80;    
let spacing = 100;      
let speed = 0.03;      

let shapeSelector, countSlider, countLabel;
let trailSlider, trailLabel, alignSlider, alignLabel, bloomSlider, bloomLabel;
let sizeSlider, sizeLabel, colorPicker, bgColorPicker, recordButton;

let currentShape = 'Cosmic Lotus'; 
let trailVal = 40;     
let alignVal = 1.0;    
let bloomVal = 20;     
let numLines = 3;
let recordingCountdown = -1;

let globalSpeedMultiplier = 1;
let globalSizeMultiplier = 1.8; 
const sidebarWidth = 240;

// Logica per il disegno personalizzato
let customShapePoints = []; 
let isDrawing = false;
let startDrawX, startDrawY;

function setup() {
    createCanvas(windowWidth, windowHeight);
    pixelDensity(1); // Ottimizzazione per iPad/Retina
    createSidebar();
    updateParticleCount();
}

function draw() {
    // Gestione sfondo con scia dinamica
    let bg = bgColorPicker.color();
    background(red(bg), green(bg), blue(bg), 255 - trailVal);

    // Feedback visivo del disegno mentre trascini
    if (isDrawing && currentShape === 'Your Design') {
        customShapePoints.push(createVector(mouseX - startDrawX, mouseY - startDrawY));
        push();
        stroke(255);
        strokeWeight(2);
        noFill();
        beginShape();
        for(let p of customShapePoints) vertex(p.x + startDrawX, p.y + startDrawY);
        endShape();
        pop();
    }

    // Aggiorna e disegna i fiori
    for (let p of particles) {
        p.update();
        p.display();
    }
    
    drawSidebarUI();
    handleRecordingUI();
}

// --- GESTIONE INPUT (Mouse & Apple Pencil/Touch) ---

function mousePressed() {
    if (mouseX > sidebarWidth && currentShape === 'Your Design') {
        customShapePoints = []; 
        startDrawX = mouseX;
        startDrawY = mouseY;
        isDrawing = true;
    }
}

function mouseReleased() { isDrawing = false; }

function touchMoved() {
    if (mouseX > sidebarWidth && currentShape === 'Your Design') return false; 
}

// --- CLASSE FIORE ---

class Particle {
    constructor(index) {
        this.index = index;
        this.reset();
        this.y = random(height);
        this.x = width / 2;
        this.rotSpeed = random(0.01, 0.03);
    }

    reset() {
        this.basePhase = this.index * 0.5; 
        this.baseVelocity = random(0.5, 1.5);
        this.baseSize = random(20, 35);
        this.randomX = random(sidebarWidth + 100, width - 100);
        this.numPetals = floor(random(6, 12));
    }

    update() {
        this.y += this.baseVelocity * globalSpeedMultiplier;
        if (this.y > height + 150) this.y = -150;

        let colIndex = this.index % numLines;
        let totalWidth = (numLines - 1) * spacing;
        let startX = sidebarWidth + (width - sidebarWidth - totalWidth) / 2;
        let alignedX = startX + (colIndex * spacing);
        
        // Transizione fluida tra caos e allineamento
        let targetX = lerp(this.randomX, alignedX, alignVal);
        this.x = lerp(this.x, targetX, 0.05);
        this.xOffset = sin(this.y * 0.005 + (frameCount * speed) + this.basePhase) * amplitude;
    }

    display() {
        let s = this.baseSize * globalSizeMultiplier;
        let c = colorPicker.color();
        push();
        translate(this.x + this.xOffset, this.y);
        
        if (bloomVal > 0) {
            drawingContext.shadowBlur = bloomVal;
            drawingContext.shadowColor = c;
        }

        stroke(c);
        noFill();
        strokeWeight(1.5);

        if (currentShape === 'Cosmic Lotus') {
            rotate(frameCount * this.rotSpeed);
            for (let i = 0; i < this.numPetals; i++) {
                push(); rotate(TWO_PI / this.numPetals * i);
                beginShape(); vertex(0,0); bezierVertex(s, -s/2, s, s/2, 0, s); endShape();
                pop();
            }
        } else if (currentShape === 'Your Design' && customShapePoints.length > 1) {
            rotate(frameCount * this.rotSpeed);
            for (let i = 0; i < this.numPetals; i++) {
                push();
                rotate(TWO_PI / this.numPetals * i);
                beginShape();
                for (let p of customShapePoints) vertex(p.x * (s/50), p.y * (s/50));
                endShape();
                pop();
            }
        } else {
            ellipse(0, 0, s*0.2); // Placeholder se non si è disegnato nulla
        }
        pop();
    }
}

// --- INTERFACCIA UTENTE ---

function createSidebar() {
    let x = 25, y = 20;
    const labelStyle = 'color: #00ffcc; font-family: monospace; font-size: 10px;';

    createElement('h2', 'FLORA GEN').style('color:#fff; letter-spacing:4px;').position(x, 10);

    recordButton = createButton('CAPTURE GIF (5s)');
    recordButton.position(x, y + 60);
    recordButton.style('width: 190px; height: 35px; background: transparent; border: 1px solid #ff0050; color: #ff0050; cursor: pointer; font-family: monospace;');
    recordButton.mousePressed(() => { recordingCountdown = 300; saveGif('my_floral_design', 5); });

    trailLabel = createLabel('MOTION TRAILS', x, y + 120, labelStyle);
    trailSlider = createSlider(0, 250, trailVal, 1);
    trailSlider.position(x, y + 135);
    trailSlider.input(() => trailVal = trailSlider.value());

    alignLabel = createLabel('ALIGNMENT', x, y + 180, labelStyle);
    alignSlider = createSlider(0, 1, alignVal, 0.01);
    alignSlider.position(x, y + 195);
    alignSlider.input(() => alignVal = alignSlider.value());

    bloomLabel = createLabel('BLOOM STRENGTH', x, y + 240, labelStyle);
    bloomSlider = createSlider(0, 100, bloomVal, 1);
    bloomSlider.position(x, y + 255);
    bloomSlider.input(() => bloomVal = bloomSlider.value());

    createLabel('SPECIES', x, y + 310, labelStyle);
    shapeSelector = createSelect();
    shapeSelector.position(x, y + 325);
    shapeSelector.option('Cosmic Lotus'); 
    shapeSelector.option('Your Design');
    shapeSelector.changed(() => currentShape = shapeSelector.value());

    sizeLabel = createLabel('SIZE', x, y + 375, labelStyle);
    sizeSlider = createSlider(0.5, 5, globalSizeMultiplier, 0.1);
    sizeSlider.position(x, y + 390);
    sizeSlider.input(() => globalSizeMultiplier = sizeSlider.value());

    createLabel('PETAL COLOR', x, y + 440, labelStyle);
    colorPicker = createColorPicker('#ff00ff');
    colorPicker.position(x, y + 455);

    createLabel('BACKGROUND COLOR', x, y + 505, labelStyle);
    bgColorPicker = createColorPicker('#0a0a0a');
    bgColorPicker.position(x, y + 520);
    
    countLabel = createLabel('DENSITY', x, y + 570, labelStyle);
    countSlider = createSlider(2, 60, NUM_PARTICLES, 1);
    countSlider.position(x, y + 585);
    countSlider.input(updateParticleCount);
}

function drawSidebarUI() {
    push(); noStroke(); fill(15); rect(0, 0, sidebarWidth, height);
    stroke(255, 30); line(sidebarWidth, 0, sidebarWidth, height); pop();
}

function handleRecordingUI() {
    if (recordingCountdown > 0) {
        fill(255, 0, 50, map(sin(frameCount * 0.2), -1, 1, 100, 255));
        noStroke(); ellipse(width - 40, 40, 20, 20);
        recordingCountdown--;
    }
}

function updateParticleCount() {
    let target = countSlider.value();
    while (particles.length < target) particles.push(new Particle(particles.length));
    if (particles.length > target) particles.splice(target);
}

function createLabel(txt, x, y, style) {
    let l = createElement('span', txt);
    l.style(style); l.position(x, y);
    return l;
}

function windowResized() { resizeCanvas(windowWidth, windowHeight); }
