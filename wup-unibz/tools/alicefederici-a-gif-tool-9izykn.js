// WUP 2025-26 
// Federici Alice
let particles = [];
let NUM_PARTICLES = 100;
let amplitude = 60;   
let spacing = 20;      
let speed = 0.04;      

let shapeSelector, moveSelector, directionSelector, countSlider;
let alignCheck, trailCheck, spacingSlider, linesSlider;
let sizeSlider, speedSlider, colorPicker;
let recordButton, fileInput, stickerInput, stickerSizeSlider;

let bgImage = null;
let stickerImage = null; 
let stickerControls, alignmentControls, bgImageControls; // Contenitori per UI dinamica
let bgModeSelector, bgColorPicker;
let currentBgMode = 'Color';

let currentShape = 'Square';
let currentMove = 'Harmonic';
let currentDir = 'Down'; 
let isAligned = true; 
let numLines = 1; 
let hasTrail = true;
let recordingCountdown = -1;

let globalSpeedMultiplier = 1;
let globalSizeMultiplier = 1; 
let stickerScale = 0.5; 
const sidebarWidth = 240;

class Particle {
    constructor(index) {
        this.index = index;
        this.resetPosition();
        this.phaseShift = 0;
        this.basePhase = this.index * 0.2; 
        this.baseVelocity = random(1.5, 3.5);
        this.baseSize = 6;
    }

    resetPosition() {
        this.x = random(20, width - 20);
        this.y = random(-50, height + 50);
    }

    update() {
        let t = frameCount * speed * globalSpeedMultiplier;
        let v = this.baseVelocity * globalSpeedMultiplier;
        
        if (currentDir === 'Down') {
            this.y += v;
            if (this.y > height + 50) this.y = -50;
        } else if (currentDir === 'Up') {
            this.y -= v;
            if (this.y < -50) this.y = height + 50;
        } else if (currentDir === 'Right') {
            this.x += v;
            if (this.x > width + 20) this.x = -20;
        } else if (currentDir === 'Left') {
            this.x -= v;
            if (this.x < -20) this.x = width + 20;
        }

        if (isAligned) {
            let colIndex = this.index % numLines;
            let totalSpace = (numLines - 1) * spacing;
            
            if (currentDir === 'Down' || currentDir === 'Up') {
                this.targetX = (width - totalSpace) / 2 + (colIndex * spacing);
                this.x = lerp(this.x, this.targetX, 0.1);
            } else {
                this.targetY = (height - totalSpace) / 2 + (colIndex * spacing);
                this.y = lerp(this.y, this.targetY, 0.1);
            }
        }

        let finalPhase = this.basePhase + this.phaseShift;
        let osc = 0;
        if (currentMove === 'Harmonic') {
            osc = sin(t + finalPhase) * amplitude + sin(t * 1.6 + this.index) * (amplitude * 0.25);
        } else if (currentMove === 'Wave') {
            let ref = (currentDir === 'Down' || currentDir === 'Up') ? this.y : this.x;
            osc = sin(ref * 0.01 + finalPhase) * amplitude;
        }
        this.offset = osc;
    }

    display() {
        let s = this.baseSize * globalSizeMultiplier;
        let c = colorPicker.color();
        push();
        if (currentDir === 'Down' || currentDir === 'Up') {
            translate(this.x + this.offset, this.y);
        } else {
            translate(this.x, this.y + this.offset);
        }
        fill(c);
        noStroke();
        if (currentShape === 'Square') { rectMode(CENTER); rect(0, 0, s, s); } 
        else if (currentShape === 'Circle') { ellipse(0, 0, s); } 
        else if (currentShape === 'Triangle') { let h = s * 0.866; triangle(0, -h/2, -s/2, h/2, s/2, h/2); } 
        else if (currentShape === 'Line') { 
            stroke(c); strokeWeight(s / 2);
            if (currentDir === 'Right' || currentDir === 'Left') line(-s * 1.5, 0, s * 1.5, 0);
            else line(0, -s * 1.5, 0, s * 1.5);
        }
        pop();
    }
}

function setup() {
    let cnv = createCanvas(windowWidth - sidebarWidth, windowHeight);
    cnv.position(sidebarWidth, 0); 
    createSidebar();
    updateParticleCount();
}

function draw() {
    let bgCol = bgColorPicker.color();
    if (hasTrail) {
        fill(red(bgCol), green(bgCol), blue(bgCol), 40);
        rect(0, 0, width, height);
    } else {
        background(bgCol);
    }

    if (currentBgMode === 'Image' && bgImage) {
        push();
        let imgAspect = bgImage.width / bgImage.height;
        let canvasAspect = width / height;
        let dW, dH;
        if (canvasAspect > imgAspect) { dW = width; dH = dW / imgAspect; } 
        else { dH = height; dW = dH * imgAspect; }
        if (hasTrail) tint(255, 40);
        image(bgImage, (width - dW)/2, (height - dH)/2, dW, dH);
        pop();
    }

    for (let p of particles) {
        p.update();
        p.display();
    }

    if (stickerImage) {
        push();
        imageMode(CENTER);
        let baseRatio = min(width / stickerImage.width, height / stickerImage.height);
        let finalScale = baseRatio * stickerScale;
        image(stickerImage, width / 2, height / 2, stickerImage.width * finalScale, stickerImage.height * finalScale);
        pop();
    }

    if (recordingCountdown > 0) {
        fill(255, 50, 50); noStroke();
        ellipse(width - 30, 30, 15, 15);
        recordingCountdown--;
    }
}

function startGifRecording() {
    recordingCountdown = 150; 
    saveGif('GIF_PROJECT', 5);
}

function createSidebar() {
    let side = createDiv('');
    side.position(0, 0);
    side.size(sidebarWidth, windowHeight);
    side.style('background-color', '#141414');
    side.style('padding', '20px');
    side.style('box-sizing', 'border-box');
    side.style('border-right', '1px solid #333');
    side.style('overflow-y', 'auto');
    side.style('z-index', '1000');

    const labelS = 'color: #888; font-family: sans-serif; font-size: 10px; display: block; margin-top: 15px; margin-bottom: 5px;';
    const inputS = 'background: #222; color: #fff; border: 1px solid #333; padding: 5px; border-radius: 3px; font-size: 10px; width: 100%; box-sizing: border-box;';

    let title = createElement('h2', 'A GIF TOOL');
    title.parent(side);
    title.style('color: #fff; font-family: monospace; font-size: 14px; border-bottom: 1px solid #333; padding-bottom: 10px; margin-bottom: 20px;');

    recordButton = createButton('EXPORT GIF');
    recordButton.parent(side);
    recordButton.style('background', '#fff; border:none; width: 100%; padding:10px; cursor:pointer; font-weight:bold; font-size:10px;');
    recordButton.mousePressed(startGifRecording);

    // --- SFONDO E CARICAMENTO IMMAGINE (DINAMICO) ---
    createLabel('BG MODE', side, labelS);
    bgModeSelector = createSelect();
    bgModeSelector.parent(side);
    bgModeSelector.style(inputS);
    bgModeSelector.option('Color'); bgModeSelector.option('Image');
    bgModeSelector.changed(() => {
        currentBgMode = bgModeSelector.value();
        currentBgMode === 'Image' ? bgImageControls.show() : bgImageControls.hide();
    });

    bgImageControls = createDiv('');
    bgImageControls.parent(side);
    bgImageControls.hide(); // Inizialmente nascosto perché il default è "Color"

    createLabel('SELECT BACKGROUND IMAGE', bgImageControls, labelS);
    fileInput = createFileInput(handleFile);
    fileInput.parent(bgImageControls);
    fileInput.style('font-size', '9px'); fileInput.style('color', '#666');

    bgColorPicker = createColorPicker('#0a0a0a');
    bgColorPicker.parent(side);
    bgColorPicker.style('width', '100%'); bgColorPicker.style('margin-top', '5px');

    // --- SEZIONE ALIGNMENT (DINAMICA) ---
    alignCheck = createCheckbox(' ALIGNMENT', true);
    alignCheck.parent(side);
    alignCheck.style('color', '#888'); alignCheck.style('font-size', '10px'); alignCheck.style('margin-top', '15px');
    alignCheck.changed(() => {
        isAligned = alignCheck.checked();
        isAligned ? alignmentControls.show() : alignmentControls.hide();
    });

    alignmentControls = createDiv('');
    alignmentControls.parent(side);

    createLabel('NUMBER OF LINES', alignmentControls, labelS);
    linesSlider = createSlider(1, 20, numLines, 1);
    linesSlider.parent(alignmentControls);
    linesSlider.style('width', '100%');
    linesSlider.input(() => numLines = linesSlider.value());

    createLabel('SPACING', alignmentControls, labelS);
    spacingSlider = createSlider(0, 400, spacing, 1);
    spacingSlider.parent(alignmentControls);
    spacingSlider.style('width', '100%');
    spacingSlider.input(() => spacing = spacingSlider.value());

    // --- SEZIONE STICKER (DINAMICA) ---
    createLabel('UPLOAD STICKER', side, labelS);
    stickerInput = createFileInput(handleSticker);
    stickerInput.parent(side);

    stickerControls = createDiv('');
    stickerControls.parent(side);
    stickerControls.hide();

    createLabel('STICKER SIZE', stickerControls, labelS);
    stickerSizeSlider = createSlider(0.05, 2, stickerScale, 0.01);
    stickerSizeSlider.parent(stickerControls);
    stickerSizeSlider.style('width', '100%');
    stickerSizeSlider.input(() => stickerScale = stickerSizeSlider.value());

    // --- SEZIONE SPEED & SIZE ---
    createLabel('SPEED', side, labelS);
    speedSlider = createSlider(0.1, 5, 1, 0.1);
    speedSlider.parent(side);
    speedSlider.style('width', '100%');
    speedSlider.input(() => globalSpeedMultiplier = speedSlider.value());

    createLabel('PARTICLE SIZE', side, labelS);
    sizeSlider = createSlider(0.1, 10, 1, 0.1);
    sizeSlider.parent(side);
    sizeSlider.style('width', '100%');
    sizeSlider.input(() => globalSizeMultiplier = sizeSlider.value());

    // --- ALTRI CONTROLLI ---
    createLabel('DENSITY', side, labelS);
    countSlider = createSlider(1, 500, NUM_PARTICLES, 1);
    countSlider.parent(side);
    countSlider.style('width', '100%');
    countSlider.input(updateParticleCount);

    createLabel('PARTICLE COLOR', side, labelS);
    colorPicker = createColorPicker('#ffffff');
    colorPicker.parent(side);
    colorPicker.style('width', '100%');

    createLabel('GEOMETRY', side, labelS);
    shapeSelector = createSelect();
    shapeSelector.parent(side);
    shapeSelector.style(inputS);
    shapeSelector.option('Square'); shapeSelector.option('Circle'); shapeSelector.option('Triangle'); shapeSelector.option('Line');
    shapeSelector.changed(() => currentShape = shapeSelector.value());

    createLabel('DIRECTION', side, labelS);
    directionSelector = createSelect();
    directionSelector.parent(side);
    directionSelector.style(inputS);
    directionSelector.option('Down'); directionSelector.option('Up'); directionSelector.option('Left'); directionSelector.option('Right');
    directionSelector.changed(() => { currentDir = directionSelector.value(); particles.forEach(p => p.resetPosition()); });

    trailCheck = createCheckbox(' TRAIL EFFECT', true);
    trailCheck.parent(side);
    trailCheck.style('color', '#888'); trailCheck.style('font-size', '10px');
    trailCheck.changed(() => hasTrail = trailCheck.checked());
}

function handleFile(file) { if (file.type === 'image') bgImage = loadImage(file.data); }

function handleSticker(file) { 
    if (file.type === 'image') {
        stickerImage = loadImage(file.data);
        stickerControls.show(); 
    } 
}

function updateParticleCount() {
    let target = countSlider.value();
    if (particles.length < target) { for (let i = particles.length; i < target; i++) particles.push(new Particle(i)); } 
    else { particles.splice(target); }
}

function createLabel(txt, parent, style) { 
    let l = createElement('span', txt); 
    l.style(style); 
    l.parent(parent); 
}

function windowResized() {
    resizeCanvas(windowWidth - sidebarWidth, windowHeight);
}