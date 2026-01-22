
let particles = [];
let numParticles = 200; 

// UI Variables
let shapeSelector, speedSlider, sizeSlider; // <--- sizeSlider aggiunto
let directionSlider, colorPicker, alphaSlider;
let densitySlider, trailSlider, fileInput, rainbowCheckbox;
let chaosSlider, maskSelector;
let maskSizeSlider, maskRotationSlider;

let currentShape = 'Circle';
let exportMask = 'None'; 
let globalSpeedMultiplier = 1;
let globalSizeMultiplier = 1; // Questa variabile ora è controllata dallo slider
let globalAngle = 90;
let globalAlpha = 180;
let globalTrail = 40; 
let globalChaos = 0.5; 
let globalMaskSize = 0.8; 
let globalMaskRotation = 0;
let particleColor;
let bgImage = null;
let rainbowMode = false;

let canvasBuffer;
let maskBuffer;

class Particle {
    constructor() {
        this.x = random(-50, width + 50);
        this.y = random(-50, height + 50);
        this.initProperties();
    }

    initProperties() {
        this.baseVelocity = random(2, 5);
        this.baseSize = random(2, 8); // Dimensione base casuale
        this.drift = random(-0.5, 0.5);
        this.hue = random(360);
        this.chaosThreshold = random(0, 2); 
        this.noiseOffset = random(1000);
    }

    fall() {
        this.velocity = this.baseVelocity * globalSpeedMultiplier;
        let currentAngle = globalAngle;
        
        if (globalChaos > this.chaosThreshold) {
            let noiseVal = noise(this.noiseOffset + frameCount * 0.02);
            let angleDeviation = map(noiseVal, 0, 1, -180, 180) * (globalChaos);
            currentAngle += angleDeviation;
        }

        let rad = radians(currentAngle);
        this.x += cos(rad) * this.velocity + this.drift;
        this.y += sin(rad) * this.velocity;

        if (rainbowMode) {
            this.hue = (this.hue + this.velocity * 0.5) % 360;
        }

        let margin = 150;
        if (this.x < -margin) this.x = width + margin;
        if (this.x > width + margin) this.x = -margin;
        if (this.y < -margin) this.y = height + margin;
        if (this.y > height + margin) this.y = -margin;
    }

    display(target) {
        this.size = this.baseSize * globalSizeMultiplier;
        let r, g, b;
        
        if (rainbowMode) {
            push();
            colorMode(HSB, 360, 100, 100, 255);
            // Se la particella è in "stato caos", la saturazione aumenta
            let sat = (globalChaos > this.chaosThreshold) ? 100 : 70;
            let c = color(this.hue, sat, 100, globalAlpha);
            r = red(c); g = green(c); b = blue(c);
            pop();
        } else {
            r = particleColor.levels[0];
            g = particleColor.levels[1];
            b = particleColor.levels[2];
        }
        
        target.push();
        target.translate(this.x, this.y);

        if (currentShape === 'Line') {
            target.stroke(r, g, b, globalAlpha);
            target.strokeWeight(this.size / 2);
            let rad = radians(globalAngle); 
            target.line(0, 0, cos(rad) * this.size * 5, sin(rad) * this.size * 5);
        } else {
            target.noStroke();
            target.fill(r, g, b, globalAlpha);
            if (currentShape === 'Circle') target.ellipse(0, 0, this.size);
            else if (currentShape === 'Square') { target.rectMode(CENTER); target.rect(0, 0, this.size, this.size); }
            else if (currentShape === 'Triangle') {
                target.rotate(radians(globalAngle + 90));
                let h = this.size * 0.866;
                target.triangle(0, -h/2, -this.size/2, h/2, this.size/2, h/2);
            }
        }
        target.pop();
    }
}

function setup() {
    createCanvas(windowWidth, windowHeight);
    canvasBuffer = createGraphics(windowWidth, windowHeight);
    maskBuffer = createGraphics(windowWidth, windowHeight);
    createControls();
    for (let i = 0; i < numParticles; i++) {
        particles.push(new Particle());
    }
}

function draw() {
    if (bgImage) {
        canvasBuffer.tint(255, globalTrail); 
        canvasBuffer.image(bgImage, 0, 0, width, height);
        canvasBuffer.noTint();
    } else {
        canvasBuffer.background(0, globalTrail); 
    }
    
    for (let p of particles) {
        p.fall();
        p.display(canvasBuffer);
    }

    background(0); 

    if (exportMask === 'None') {
        image(canvasBuffer, 0, 0);
    } else {
        updateMask(); 
        let maskedImg = canvasBuffer.get();
        maskedImg.mask(maskBuffer);
        image(maskedImg, 0, 0);
    }
}

function updateMask() {
    maskBuffer.clear();
    maskBuffer.fill(255);
    maskBuffer.noStroke();
    maskBuffer.push();
    maskBuffer.translate(width/2, height/2);
    maskBuffer.rotate(radians(globalMaskRotation));
    let mSize = min(width, height) * globalMaskSize;

    if (exportMask === 'Circle') maskBuffer.ellipse(0, 0, mSize, mSize);
    else if (exportMask === 'Square') { maskBuffer.rectMode(CENTER); maskBuffer.rect(0, 0, mSize, mSize); }
    else if (exportMask === 'Star') drawStar(maskBuffer, 0, 0, mSize/4, mSize/2, 5);
    else if (exportMask === 'Triangle') maskBuffer.triangle(0, -mSize/2, -mSize/2, mSize/2, mSize/2, mSize/2);
    maskBuffer.pop();
}

function drawStar(target, x, y, radius1, radius2, npoints) {
    let angle = TWO_PI / npoints;
    let halfAngle = angle / 2.0;
    target.beginShape();
    for (let a = 0; a < TWO_PI; a += angle) {
        let sx = x + cos(a) * radius2;
        let sy = y + sin(a) * radius2;
        target.vertex(sx, sy);
        sx = x + cos(a + halfAngle) * radius1;
        sy = y + sin(a + halfAngle) * radius1;
        target.vertex(sx, sy);
    }
    target.endShape(CLOSE);
}

function createControls() {
    let panel = createDiv('');
    panel.position(20, 20); 
    panel.style('background-color', 'rgba(0, 0, 0, 0.85)');
    panel.style('padding', '15px');
    panel.style('border-radius', '12px');
    panel.style('border', '1px solid #666');    
    panel.style('font-family', 'sans-serif');
    panel.style('color', 'white');
    panel.style('display', 'flex');
    panel.style('flex-direction', 'column');
    panel.style('gap', '8px');
    panel.style('width', '280px');

    const createRow = (labelText, control) => {
        let row = createDiv('');
        row.style('display', 'flex');
        row.style('justify-content', 'space-between');
        row.style('align-items', 'center');
        row.parent(panel);
        let lbl = createElement('span', labelText);
        lbl.style('font-size', '13px');
        lbl.parent(row);
        control.parent(row);
        return lbl;
    };

    fileInput = createFileInput(handleFile);
    createRow('Background:', fileInput);

    maskSelector = createSelect();
    maskSelector.option('None'); maskSelector.option('Circle'); maskSelector.option('Square'); maskSelector.option('Triangle'); maskSelector.option('Star');
    maskSelector.changed(() => exportMask = maskSelector.value());
    createRow('Frame Shape:', maskSelector);

    maskSizeSlider = createSlider(0.1, 1.5, 0.8, 0.01);
    createRow('Frame Size:', maskSizeSlider);
    maskSizeSlider.input(() => globalMaskSize = maskSizeSlider.value());

    maskRotationSlider = createSlider(0, 360, 0, 1);
    createRow('Frame Rotate:', maskRotationSlider);
    maskRotationSlider.input(() => globalMaskRotation = maskRotationSlider.value());

    rainbowCheckbox = createCheckbox(' Rainbow Mode', false);
    rainbowCheckbox.parent(panel);
    rainbowCheckbox.changed(() => rainbowMode = rainbowCheckbox.checked());

    chaosSlider = createSlider(0, 2, 0.5, 0.05);
    createRow('Chaos:', chaosSlider);
    chaosSlider.input(() => globalChaos = chaosSlider.value());

    densitySlider = createSlider(10, 1000, 200, 10);
    createRow('Density:', densitySlider);
    densitySlider.input(() => {
        let target = densitySlider.value();
        while (particles.length < target) particles.push(new Particle());
        while (particles.length > target) particles.pop();
    });

    shapeSelector = createSelect();
    shapeSelector.option('Circle'); shapeSelector.option('Square'); shapeSelector.option('Line'); shapeSelector.option('Triangle');
    shapeSelector.changed(() => currentShape = shapeSelector.value());
    createRow('Particle:', shapeSelector);

    // --- NUOVO SLIDER DIMENSIONE PARTICELLE ---
    sizeSlider = createSlider(0.1, 10, 1, 0.1);
    createRow('Particle Size:', sizeSlider);
    sizeSlider.input(() => globalSizeMultiplier = sizeSlider.value());

    speedSlider = createSlider(0.5, 5, 1, 0.1);
    createRow('Speed:', speedSlider);
    speedSlider.input(() => globalSpeedMultiplier = speedSlider.value());

    directionSlider = createSlider(0, 360, 90, 1);
    createRow('Angle:', directionSlider);
    directionSlider.input(() => globalAngle = directionSlider.value());

    colorPicker = createColorPicker(color(70, 250, 70));
    particleColor = colorPicker.color();
    colorPicker.input(() => particleColor = colorPicker.color());
    createRow('Color:', colorPicker);

    alphaSlider = createSlider(0, 255, 180, 1);
    createRow('Alpha:', alphaSlider);
    alphaSlider.input(() => globalAlpha = alphaSlider.value());

    trailSlider = createSlider(5, 255, 40, 1);
    createRow('Trail:', trailSlider);
    trailSlider.input(() => globalTrail = trailSlider.value());

    let btnContainer = createDiv('');
    btnContainer.parent(panel);
    btnContainer.style('display', 'flex');
    btnContainer.style('gap', '10px');
    btnContainer.style('margin-top', '10px');

    let btnImg = createButton('Save PNG');
    btnImg.parent(btnContainer);
    btnImg.style('flex', '1');
    btnImg.mousePressed(() => saveCanvas('my_artwork', 'png'));

    let btnGif = createButton('Save GIF');
    btnGif.parent(btnContainer);
    btnGif.style('flex', '1');
    btnGif.mousePressed(() => saveGif('my_animation', 5));
}

function handleFile(file) {
    if (file.type === 'image') bgImage = loadImage(file.data);
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    canvasBuffer = createGraphics(windowWidth, windowHeight);
    maskBuffer = createGraphics(windowWidth, windowHeight);
}