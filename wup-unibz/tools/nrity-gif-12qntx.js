// WUP 2025-2026
// Nibir Khan
let particles = [];
const NUM_PARTICLES = 150;

// UI CONTROLS
let shapeSelector, currentShape = 'Circle', customShapeInput;
let speedSlider, sizeSlider;
let windXSlider, windYSlider;
let colorPicker, particleColor, bgPicker, bgColor;
let alphaSlider;

// GIF TOOL
let gifButton, durationSlider, durationLabel;
let isRecording = false; 

class Particle {
    constructor() {
        this.reset();
        this.y = random(height);
    }

    fall() {
        let verticalEffort = (this.baseVelocity * speedSlider.value()) + windYSlider.value();
        this.y += verticalEffort;
        this.x += this.drift + windXSlider.value();

        // Wrap around logic for Y axis
        if (this.y > height + 50) { 
            this.y = -20; 
            this.x = random(width); 
        } else if (this.y < -50) { 
            this.y = height + 20; 
            this.x = random(width); 
        }

        // Wrap around logic for X axis
        if (this.x > width) this.x = 0;
        if (this.x < 0) this.x = width;
    }

    display() {
        let size = this.baseSize * sizeSlider.value();
        let r = particleColor.levels[0], g = particleColor.levels[1], b = particleColor.levels[2];
        
        push();
        translate(this.x, this.y);
        
        if (currentShape === 'Line') {
            stroke(r, g, b, alphaSlider.value());
            strokeWeight(size / 2);
            let lineLen = size * 5;
            // Directional line based on velocity
            line(0, 0, 0, (this.baseVelocity + windYSlider.value()) > 0 ? lineLen : -lineLen);
        } else {
            noStroke();
            fill(r, g, b, alphaSlider.value());
            if (currentShape === 'Circle') ellipse(0, 0, size * 2);
            else if (currentShape === 'Square') { 
                rectMode(CENTER); 
                rect(0, 0, size * 2, size * 2); 
            }
            else if (currentShape === 'Triangle') {
                let h = size * 2;
                triangle(0, -h/2, -h/2, h/2, h/2, h/2);
            }
            else if (currentShape === 'Custom (Emoji)') {
                textAlign(CENTER, CENTER);
                textSize(size * 4);
                text(customShapeInput.value(), 0, 0);
            }
        }
        pop();
    }

    reset() {
        this.x = random(width);
        this.y = random(-100, -10);
        this.baseVelocity = random(2, 5);
        this.baseSize = random(2, 5);    
        this.drift = random(-0.5, 0.5);
    }
}

function setup() {
    createCanvas(windowWidth, windowHeight);
    bgColor = color(0);
    particleColor = color(255);
    
    // Initialize UI
    createControls();
    
    for (let i = 0; i < NUM_PARTICLES; i++) {
        particles.push(new Particle());
    }
}

function createControls() {
    const labelStyle = {
        'color': 'white',
        'font-family': 'sans-serif',
        'font-size': '11px',
        'font-weight': 'bold',
        'text-shadow': '1px 1px 2px black'
    };
    
    // Helper to apply object-based styles to p5.js elements
    const applyStyles = (el, styles) => {
        for (let prop in styles) el.style(prop, styles[prop]);
    };

    // --- GIF TOOL (TOP CENTER) ---
    gifButton = createButton('🔴 RECORD GIF');
    gifButton.position(width / 2, 20);
    gifButton.style('transform', 'translateX(-50%)'); 
    gifButton.style('background-color', '#ff4444');
    gifButton.style('color', 'white');
    gifButton.style('padding', '10px 20px');
    gifButton.style('border', 'none');
    gifButton.style('border-radius', '5px');
    gifButton.style('cursor', 'pointer');
    
    // Event listeners replace CSS :hover
    gifButton.mouseOver(() => { if(!isRecording) gifButton.style('background-color', '#cc0000'); });
    gifButton.mouseOut(() => { if(!isRecording) gifButton.style('background-color', '#ff4444'); });

    durationLabel = createElement('span', 'Duration: 3s');
    durationLabel.position(width / 2, 60);
    durationLabel.style('transform', 'translateX(-50%)');
    applyStyles(durationLabel, labelStyle);

    durationSlider = createSlider(1, 10, 3, 1);
    durationSlider.position(width / 2, 80);
    durationSlider.style('transform', 'translateX(-50%)');
    durationSlider.input(() => durationLabel.html('Duration: ' + durationSlider.value() + 's'));

    gifButton.mousePressed(() => {
        if (typeof saveGif === 'function') {
            isRecording = true;
            let d = durationSlider.value();
            gifButton.html('⌛ RECORDING...');
            gifButton.style('background-color', '#ffcc00');
            
            saveGif('particle_sketch.gif', d);

            setTimeout(() => {
                isRecording = false;
                gifButton.html('🔴 RECORD GIF');
                gifButton.style('background-color', '#ff4444');
            }, (d * 1000) + 1000);
        }
    });

    // --- LEFT CONTROLS (BOTTOM LEFT) ---
    let shapeLabel = createElement('span', 'SHAPE:');
    shapeLabel.position(20, height - 170);
    applyStyles(shapeLabel, labelStyle);

    shapeSelector = createSelect().position(20, height - 150);
    ['Circle', 'Square', 'Line', 'Triangle', 'Custom (Emoji)'].forEach(o => shapeSelector.option(o));
    shapeSelector.changed(() => { 
        currentShape = shapeSelector.value(); 
        currentShape === 'Custom (Emoji)' ? customShapeInput.show() : customShapeInput.hide(); 
    });
    
    customShapeInput = createInput('✨').position(135, height - 150).size(30).hide();

    // Loop to build standard sliders
    const sliderData = [
        { name: 'SPEED', min: 0.1, max: 5, val: 1, step: 0.1, y: 120 },
        { name: 'SIZE', min: 0.1, max: 5, val: 1, step: 0.1, y: 95 },
        { name: 'WIND X', min: -10, max: 10, val: 0, step: 0.1, y: 70 },
        { name: 'WIND Y', min: -15, max: 15, val: 0, step: 0.1, y: 45 }
    ];

    sliderData.forEach(s => {
        let lbl = createElement('span', s.name);
        lbl.position(20, height - s.y);
        applyStyles(lbl, labelStyle);
        let sld = createSlider(s.min, s.max, s.val, s.step).position(110, height - s.y);
        
        if (s.name === 'SPEED') speedSlider = sld;
        if (s.name === 'SIZE') sizeSlider = sld;
        if (s.name === 'WIND X') windXSlider = sld;
        if (s.name === 'WIND Y') windYSlider = sld;
    });

    // --- RIGHT CONTROLS (BOTTOM RIGHT) ---
    const rX = width - 260;
    
    let pColLabel = createElement('span', 'PARTICLE COLOR');
    pColLabel.position(rX, height - 95);
    applyStyles(pColLabel, labelStyle);
    colorPicker = createColorPicker(color(255)).position(width - 65, height - 100);
    colorPicker.input(() => particleColor = colorPicker.color());

    let bgColLabel = createElement('span', 'BG COLOR');
    bgColLabel.position(rX, height - 65);
    applyStyles(bgColLabel, labelStyle);
    bgPicker = createColorPicker(color(0)).position(width - 65, height - 70);
    bgPicker.input(() => bgColor = bgPicker.color());

    let alphaLabel = createElement('span', 'TRANSPARENCY');
    alphaLabel.position(rX, height - 40);
    applyStyles(alphaLabel, labelStyle);
    alphaSlider = createSlider(0, 255, 180, 1).position(width - 145, height - 40);
}

function draw() {
    let bgR = red(bgColor), bgG = green(bgColor), bgB = blue(bgColor);
    // Background with alpha creates the "trail" effect
    background(bgR, bgG, bgB, 25); 

    for (let p of particles) {
        p.fall();
        p.display();
    }
}

function windowResized() { 
    resizeCanvas(windowWidth, windowHeight); 
    // Note: To keep UI perfectly aligned after resize, 
    // you would ideally call createControls() again here after removing old ones.
}