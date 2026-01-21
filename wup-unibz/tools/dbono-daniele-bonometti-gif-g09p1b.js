// WUP 2025-26
// Daniele Bonometti
/**
 * P5.js GIF Animation Tool - Viewer Compatible Version
 * * COMPATIBILITY NOTES:
 * 1. All styling is inline via .style() property.
 * 2. Hover states are handled via .mouseOver() and .mouseOut() listeners.
 * 3. Layout uses flexbox with strict box-sizing to resist external CSS.
 */

// --- AUTO-LOAD LIBRARY (Fix for missing dependencies) ---
if (typeof window.GIF === 'undefined') {
    let script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.js';
    script.onload = () => console.log('gif.js library loaded automatically.');
    document.head.appendChild(script);
}

// --- GLOBAL VARIABLES ---
let exporter;
let ui = {}; 
let sidebar; 
let currentPrimary; 
let currentBg;      
let cnv; 

// --- BRUSH MODE VARIABLES ---
let currentStroke = null; 
let isDrawing = false; 

// --- APP STATE VARIABLES ---
let appState = 'INTRO'; // 'INTRO', 'TRANSITION', 'TOOL'
let introPhrases = [];
let startBtn;
let transitionProgress = 0;
let mainLayout; 
let canvasArea;

// Define Defaults for Reset
const defaultSettings = {
    pattern: 'lissajous',
    speed: 1.0, 
    zoom: 1.0,
    duration: 2, 
    frames: 120, 
    quality: 10,
    width: 512,
    height: 512,
    primaryColor: '#3b82f6',
    bgColor: '#1a1a1a',
    discoMode: false, 
    brushMode: false,
    textBrushMode: false, 
    textString: 'Hello!', 
    filename: 'My_animation',
    drawnStrokes: [] 
};

// Deep copy helper
const clone = (obj) => JSON.parse(JSON.stringify(obj));

// Settings Object
let settings = clone(defaultSettings);

// History Management
let historyStack = [];
let futureStack = [];
let lastStableSettings = clone(settings);

function recordHistory() {
    historyStack.push(clone(lastStableSettings));
    futureStack = [];
    lastStableSettings = clone(settings);
}

function performUndo() {
    if (historyStack.length === 0) return;
    futureStack.push(clone(lastStableSettings));
    let prevState = historyStack.pop();
    settings = clone(prevState);
    lastStableSettings = clone(prevState);
    updateUIFromSettings();
}

function performRedo() {
    if (futureStack.length === 0) return;
    historyStack.push(clone(lastStableSettings));
    let nextState = futureStack.pop();
    settings = clone(nextState);
    lastStableSettings = clone(nextState);
    updateUIFromSettings();
}

function performRefresh() {
    recordHistory();
    settings = clone(defaultSettings);
    settings.drawnStrokes = []; 
    lastStableSettings = clone(settings);
    resizeCanvas(settings.width, settings.height);
    updateUIFromSettings();
}

function updateUIFromSettings() {
    if(ui.resolution) ui.resolution.value(settings.width + 'x' + settings.height);
    if(ui.pattern) ui.pattern.value(settings.pattern);
    
    if (ui.textBrushCheck) {
        ui.textBrushCheck.checked(settings.textBrushMode);
        if (ui.textInput && ui.textLabel) {
            ui.textInput.value(settings.textString);
            if (settings.textBrushMode) {
                ui.textInput.style('display', 'block');
                ui.textLabel.style('display', 'block');
            } else {
                ui.textInput.style('display', 'none');
                ui.textLabel.style('display', 'none');
            }
        }
    }

    if(ui.speed) ui.speed.value(settings.speed);
    if(ui.zoom) ui.zoom.value(settings.zoom);
    if(ui.color) ui.color.value(settings.primaryColor);
    if(ui.bgColor) ui.bgColor.value(settings.bgColor);
    if(ui.discoCheck) ui.discoCheck.checked(settings.discoMode);
    if(ui.brushCheck) ui.brushCheck.checked(settings.brushMode); 
    
    if(ui.duration) {
        ui.duration.value(settings.duration);
        ui.durationLabel.html('Duration: ' + settings.duration + ' Seconds');
    }
    if(ui.filenameInput) ui.filenameInput.value(settings.filename);
    if(ui.quality) ui.quality.selected(settings.quality); 
    
    currentPrimary = settings.primaryColor;
    currentBg = settings.bgColor;
    
    if(width !== settings.width || height !== settings.height) {
        resizeCanvas(settings.width, settings.height);
    }
}

// --- INTRO PHRASE CLASS ---
class IntroPhrase {
    constructor() {
        this.reset();
        this.x = random(width);
        this.y = random(height);
    }
    
    reset() {
        this.x = random(width);
        this.y = random(height);
        this.vx = random(-2, 2);
        this.vy = random(-2, 2);
        this.size = random(14, 32);
        this.color = color(random(100, 255), random(100, 255), random(200, 255));
        this.angle = 0;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        if(this.x < -100) this.x = width + 100;
        if(this.x > width + 100) this.x = -100;
        if(this.y < -50) this.y = height + 50;
        if(this.y > height + 50) this.y = -50;
    }

    draw() {
        noStroke();
        fill(this.color);
        textSize(this.size);
        textAlign(CENTER, CENTER);
        text("Animation gif generator", this.x, this.y);
    }
}

function setup() {
    // --- COMPATIBILITY: Strict Reset of Body ---
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.overflow = 'hidden';
    document.body.style.backgroundColor = '#1a1a1a';
    document.body.style.fontFamily = 'sans-serif'; // Enforce font at root

    pixelDensity(1);

    exporter = new GifExporter();

    cnv = createCanvas(windowWidth, windowHeight);
    cnv.id('p5-canvas'); 
    
    for(let i=0; i<30; i++) {
        introPhrases.push(new IntroPhrase());
    }

    createStartButton();

    currentPrimary = settings.primaryColor;
    currentBg = settings.bgColor;
}

// --- INPUT HANDLING FOR BRUSH ---
function mousePressed(e) {
    if (appState !== 'TOOL') return;
    if (!settings.brushMode) return;
    if (e.target.id !== 'p5-canvas') return;

    isDrawing = true;
    
    let type = settings.textBrushMode ? 'text' : settings.pattern;

    currentStroke = {
        pattern: type,
        text: settings.textString, 
        points: []
    };
    settings.drawnStrokes.push(currentStroke);
    
    addPointToStroke();
}

function mouseDragged() {
    if (isDrawing && appState === 'TOOL' && settings.brushMode) {
        addPointToStroke();
    }
}

function mouseReleased() {
    if (isDrawing) {
        isDrawing = false;
        recordHistory();
    }
}

function addPointToStroke() {
    if (mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height) {
        let localX = (mouseX - width / 2) / settings.zoom;
        let localY = (mouseY - height / 2) / settings.zoom;

        if (currentStroke && currentStroke.points) {
            if (currentStroke.points.length > 0) {
                let last = currentStroke.points[currentStroke.points.length - 1];
                if (dist(localX, localY, last.x, last.y) < 5) return; 
            }
            currentStroke.points.push({ x: localX, y: localY });
        }
    }
}

function createStartButton() {
    startBtn = createButton("LET'S START");
    startBtn.position(windowWidth/2 - 100, windowHeight/2 - 30);
    // Inline Styles
    startBtn.style('width', '200px');
    startBtn.style('padding', '20px');
    startBtn.style('font-size', '20px');
    startBtn.style('font-weight', 'bold');
    startBtn.style('background', '#3b82f6');
    startBtn.style('color', 'white');
    startBtn.style('border', 'none');
    startBtn.style('border-radius', '50px');
    startBtn.style('cursor', 'pointer');
    startBtn.style('z-index', '1000');
    startBtn.style('font-family', 'sans-serif');
    startBtn.style('box-shadow', '0 0 20px rgba(59, 130, 246, 0.6)');
    startBtn.style('transition', 'transform 0.2s, box-shadow 0.2s, background 0.2s');
    startBtn.style('box-sizing', 'border-box'); // Protective
    
    // JS Event Listeners for Hover (CSS :hover replacement)
    startBtn.mouseOver(() => {
        startBtn.style('transform', 'scale(1.1)');
        startBtn.style('background', '#2563eb');
        startBtn.style('box-shadow', '0 0 30px rgba(59, 130, 246, 0.9)');
    });
    startBtn.mouseOut(() => {
        startBtn.style('transform', 'scale(1.0)');
        startBtn.style('background', '#3b82f6');
        startBtn.style('box-shadow', '0 0 20px rgba(59, 130, 246, 0.6)');
    });
    
    startBtn.mousePressed(() => {
        appState = 'TRANSITION';
        startBtn.hide();
    });
}

function initToolInterface() {
    mainLayout = createDiv('');
    mainLayout.style('display', 'flex');
    mainLayout.style('width', '100vw');
    mainLayout.style('height', '100vh');
    mainLayout.style('box-sizing', 'border-box'); // Protective
    mainLayout.style('font-family', 'sans-serif'); // Protective

    canvasArea = createDiv('');
    canvasArea.parent(mainLayout);
    canvasArea.style('flex-grow', '1'); 
    canvasArea.style('display', 'flex');
    canvasArea.style('justify-content', 'center');
    canvasArea.style('align-items', 'center');
    canvasArea.style('background', '#1a1a1a');
    canvasArea.style('position', 'relative');
    canvasArea.style('overflow', 'hidden');

    cnv.parent(canvasArea);
    cnv.style('box-shadow', '0 10px 40px rgba(0,0,0,0.6)');
    resizeCanvas(settings.width, settings.height);

    createControlPanel(mainLayout);

    // --- TOGGLE BUTTON ---
    let toggleBtn = createButton('☰');
    toggleBtn.parent(canvasArea);
    toggleBtn.style('position', 'absolute');
    toggleBtn.style('top', '20px');
    toggleBtn.style('right', '20px');
    toggleBtn.style('z-index', '100');
    toggleBtn.style('background', '#333');
    toggleBtn.style('color', '#fff');
    toggleBtn.style('border', 'none');
    toggleBtn.style('padding', '10px 15px');
    toggleBtn.style('font-size', '24px');
    toggleBtn.style('border-radius', '4px');
    toggleBtn.style('cursor', 'pointer');
    toggleBtn.style('box-shadow', '0 2px 5px rgba(0,0,0,0.3)');
    toggleBtn.style('transition', 'background 0.2s');
    
    // Toggle Button Hover Events
    toggleBtn.mouseOver(() => toggleBtn.style('background', '#555'));
    toggleBtn.mouseOut(() => toggleBtn.style('background', '#333'));
    
    toggleBtn.mousePressed(() => {
        if (sidebar.style('display') === 'none') {
            sidebar.style('display', 'block');
        } else {
            sidebar.style('display', 'none');
        }
    });
}

function draw() {
    if (appState === 'INTRO') {
        drawIntro();
    } else if (appState === 'TRANSITION') {
        drawTransition();
    } else if (appState === 'TOOL') {
        drawTool();
    }
}

function drawIntro() {
    background(20, 20, 30);
    for(let p of introPhrases) {
        p.update();
        p.draw();
    }
}

function drawTransition() {
    background(20, 20, 30, 50); 
    
    push();
    translate(width/2, height/2);
    rotate(transitionProgress * 0.2); 
    let s = map(transitionProgress, 0, 100, 1, 0); 
    scale(s);
    
    for(let p of introPhrases) {
        let angle = atan2(p.y - height/2, p.x - width/2);
        let d = dist(p.x, p.y, width/2, height/2); 
        d = lerp(d, 0, 0.05);
        angle += 0.1;
        p.x = width/2 + cos(angle) * d;
        p.y = height/2 + sin(angle) * d;
        p.draw();
    }
    pop();

    transitionProgress += 2;

    fill(settings.bgColor);
    noStroke();
    let circleSize = map(transitionProgress, 0, 120, 0, width * 2.5);
    ellipse(width/2, height/2, circleSize);

    if (transitionProgress > 120) {
        appState = 'TOOL';
        initToolInterface();
    }
}

function drawTool() {
    if (settings.discoMode) {
        let r = map(sin(frameCount * 0.03), -1, 1, 0, 255);
        let g = map(sin(frameCount * 0.04 + 2.0), -1, 1, 0, 255);
        let b = map(sin(frameCount * 0.05 + 4.0), -1, 1, 0, 255);
        
        currentPrimary = color(r, g, b);
        
        let bgR = map(sin(frameCount * 0.02 + PI), -1, 1, 0, 255);
        let bgG = map(sin(frameCount * 0.03 + PI + 2.0), -1, 1, 0, 255);
        let bgB = map(sin(frameCount * 0.04 + PI + 4.0), -1, 1, 0, 255);
        
        currentBg = color(bgR, bgG, bgB);
    } else {
        currentPrimary = settings.primaryColor;
        currentBg = settings.bgColor;
    }

    background(currentBg);
    
    push();
    translate(width / 2, height / 2);
    scale(settings.zoom);

    noFill();
    stroke(currentPrimary); 
    strokeWeight(2);

    let t = (frameCount % settings.frames) / settings.frames;
    let animTime = t * TWO_PI * settings.duration;

    if (settings.brushMode) {
        if (settings.drawnStrokes && settings.drawnStrokes.length > 0) {
            for (let strokeObj of settings.drawnStrokes) {
                let pts, pat, txt;
                
                if (Array.isArray(strokeObj)) {
                    pts = strokeObj;
                    pat = settings.pattern; 
                    txt = settings.textString;
                } else {
                    pts = strokeObj.points;
                    pat = strokeObj.pattern || settings.pattern;
                    txt = strokeObj.text || settings.textString; 
                }

                for (let pt of pts) {
                    push();
                    translate(pt.x, pt.y);
                    scale(0.15); 
                    drawPatternByType(pat, animTime, txt);
                    pop();
                }
            }
        }
    } 
    else {
        drawPatternByType(settings.pattern, animTime, settings.textString);
    }

    pop();

    exporter.capture(document.getElementById('p5-canvas'));
}

function drawPatternByType(type, animTime, customText) {
    if (type === 'freehand') { 
        drawFreehand();
    } else if (type === 'text') { 
        drawTextPattern(animTime, customText);
    } else if (type === 'lissajous') {
        drawLissajous(animTime);
    } else if (type === 'wave') {
        drawWaveGrid(animTime);
    } else if (type === 'particles') {
        drawFlowField(animTime);
    } else if (type === 'spiral') {
        drawSpiral(animTime);
    } else if (type === 'wobbly') {
        drawWobblyGrid(animTime);
    } else if (type === 'concentric') {
        drawConcentric(animTime);
    } else if (type === 'rose') {
        drawRose(animTime);
    } else if (type === 'dna') {
        drawDNA(animTime);
    } else if (type === 'phyllotaxis') {
        drawPhyllotaxis(animTime);
    } else if (type === 'supershape') {
        drawSuperShape(animTime);
    } else if (type === 'polygons') {
        drawPolygons(animTime);
    } else if (type === 'tunnel') {
        drawPsychoTunnel(animTime);
    } else if (type === 'blob') {
        drawOrganicBlob(animTime);
    } else if (type === 'electric') {
        drawElectricOrb(animTime);
    } else if (type === 'fractal') {
        drawFractalStar(animTime);
    } else if (type === 'moire') {
        drawMoirePatterns(animTime);
    }
}

// --- PATTERN FUNCTIONS ---

function drawFreehand() {
    noStroke();
    fill(currentPrimary);
    ellipse(0, 0, 120, 120); 
}

function drawTextPattern(animTime, customText) {
    noStroke();
    fill(currentPrimary);
    textAlign(CENTER, CENTER);
    textSize(120); 
    
    let wobbleAngle = sin(animTime * settings.speed * 2) * 0.1;
    let scalePulse = map(sin(animTime * settings.speed * 3), -1, 1, 0.9, 1.1);
    
    push();
    rotate(wobbleAngle);
    scale(scalePulse);
    text(customText || settings.textString, 0, 0);
    pop();
}

function drawLissajous(animTime) {
    beginShape();
    for (let i = 0; i < TWO_PI; i += 0.05) {
        let x = sin(i * 3 + animTime * settings.speed) * 150;
        let y = cos(i * 2 + animTime * settings.speed) * 150;
        vertex(x, y);
    }
    endShape(CLOSE);
    
    strokeWeight(1);
    stroke(lerpColor(color(currentPrimary), color('#fff'), 0.5));
    beginShape();
    for (let i = 0; i < TWO_PI; i += 0.1) {
        let x = cos(i * 5 - animTime * settings.speed) * 100;
        let y = sin(i * 3 - animTime * settings.speed) * 100;
        vertex(x, y);
    }
    endShape(CLOSE);
}

function drawWaveGrid(animTime) {
    let cols = 20;
    let rows = 20;
    let spacing = 20;
    
    for (let x = -cols/2; x < cols/2; x++) {
        for (let y = -rows/2; y < rows/2; y++) {
            let d = dist(x * spacing, y * spacing, 0, 0);
            let offset = map(d, 0, 200, 0, TWO_PI);
            let size = map(sin(animTime * settings.speed + offset), -1, 1, 2, 10);
            
            strokeWeight(size);
            point(x * spacing, y * spacing);
        }
    }
}

function drawFlowField(animTime) {
    let numParticles = 100;
    for(let i = 0; i < numParticles; i++) {
        let angle = map(i, 0, numParticles, 0, TWO_PI);
        let rad = 100 + sin(animTime * settings.speed * 2 + i * 0.1) * 50;
        let x = cos(angle + animTime) * rad;
        let y = sin(angle + animTime) * rad;
        
        line(0, 0, x, y);
        ellipse(x, y, 5, 5);
    }
}

function drawSpiral(animTime) {
    beginShape();
    let points = 300;
    for (let i = 0; i < points; i++) {
        let angle = i * 0.1 + animTime * settings.speed;
        let r = map(i, 0, points, 10, 250);
        let x = cos(angle) * r;
        let y = sin(angle) * r;
        x += sin(animTime * 2 + i * 0.1) * 10;
        vertex(x, y);
    }
    endShape();
}

function drawWobblyGrid(animTime) {
    let spacing = 30;
    let cols = 16;
    let rows = 16;
    
    for (let j = -rows/2; j <= rows/2; j++) {
        beginShape();
        for (let i = -cols/2; i <= cols/2; i++) {
            let x = i * spacing;
            let y = j * spacing;
            let yOff = sin(x * 0.1 + animTime * settings.speed) * 15;
            let xOff = cos(y * 0.1 + animTime * settings.speed) * 15;
            vertex(x + xOff, y + yOff);
        }
        endShape();
    }
    
    for (let i = -cols/2; i <= cols/2; i++) {
        beginShape();
        for (let j = -rows/2; j <= rows/2; j++) {
            let x = i * spacing;
            let y = j * spacing;
            let yOff = sin(x * 0.1 + animTime * settings.speed) * 15;
            let xOff = cos(y * 0.1 + animTime * settings.speed) * 15;
            vertex(x + xOff, y + yOff);
        }
        endShape();
    }
}

function drawConcentric(animTime) {
    let count = 15;
    for(let i = 0; i < count; i++) {
        let t = animTime * settings.speed + (i * 0.5);
        let baseR = i * 25;
        let r = baseR + sin(t) * 15;
        
        strokeWeight(map(sin(t), -1, 1, 1, 4));
        ellipse(0, 0, r, r);
    }
}

function drawRose(animTime) {
    let k = 4 + sin(animTime * settings.speed * 0.2) * 2; 
    beginShape();
    for (let a = 0; a < TWO_PI * 10; a += 0.02) {
        let r = 200 * cos(k * a);
        let x = r * cos(a);
        let y = r * sin(a);
        vertex(x, y);
    }
    endShape();
}

function drawDNA(animTime) {
    let points = 30;
    let heightLimit = 220;
    let elements = [];
    
    for(let i = -points; i <= points; i++) {
        let y = map(i, -points, points, -heightLimit, heightLimit);
        let angle = map(i, -points, points, 0, TWO_PI * 2) + animTime * settings.speed;
        
        let x1 = sin(angle) * 60;
        let z1 = cos(angle); 
        
        let x2 = sin(angle + PI) * 60;
        let z2 = cos(angle + PI); 
        
        elements.push({
            type: 'line',
            x1: x1, x2: x2, y: y,
            z: (z1 + z2) / 2
        });
        
        elements.push({ type: 'bead1', x: x1, y: y, z: z1 });
        elements.push({ type: 'bead2', x: x2, y: y, z: z2 });
    }
    
    elements.sort((a, b) => a.z - b.z);
    
    for(let el of elements) {
        if(el.type === 'line') {
            strokeWeight(1);
            stroke(currentPrimary);
            line(el.x1, el.y, el.x2, el.y);
        } else {
            strokeWeight(6);
            if(el.type === 'bead1') {
                stroke(currentPrimary);
            } else {
                stroke('#fff');
            }
            point(el.x, el.y);
        }
    }
}

function drawPhyllotaxis(animTime) {
    let count = 400;
    let c = 6;
    let angleOffset = animTime * settings.speed * 2;
    
    for (let i = 0; i < count; i++) {
        let a = i * 137.5 * (PI/180) + angleOffset; 
        let r = c * sqrt(i);
        let x = r * cos(a);
        let y = r * sin(a);
        
        let d = dist(0,0,x,y);
        let size = map(sin(d*0.05 - animTime * settings.speed * 5), -1, 1, 1, 8);
        
        strokeWeight(size);
        point(x, y);
    }
}

function drawSuperShape(animTime) {
    let theta = animTime * settings.speed;
    let m = map(sin(theta), -1, 1, 0, 10);
    let n1 = 1;
    let n2 = 1.7;
    let n3 = 1.7;
    let a = 1;
    let b = 1;
    let radius = 150;

    beginShape();
    for (let angle = 0; angle < TWO_PI; angle += 0.05) {
        let raux = pow(abs(cos(m * angle / 4.0) / a), n2) + pow(abs(sin(m * angle / 4.0) / b), n3);
        let r = pow(raux, -1.0 / n1);
        let x = radius * r * cos(angle);
        let y = radius * r * sin(angle);
        vertex(x, y);
    }
    endShape(CLOSE);
}

function drawPolygons(animTime) {
    let count = 8;
    for(let i=0; i<count; i++) {
        push();
        let s = map(i, 0, count, 40, 350);
        let dir = (i % 2 === 0) ? 1 : -1;
        rotate(animTime * settings.speed * dir * 0.5);
        
        strokeWeight(2);
        beginShape();
        let sides = 6;
        for(let j=0; j<sides; j++) {
            let ang = map(j, 0, sides, 0, TWO_PI);
            vertex(cos(ang)*s/2, sin(ang)*s/2);
        }
        endShape(CLOSE);
        pop();
    }
}

function drawPsychoTunnel(animTime) {
    let layers = 20;
    for(let i=layers; i>0; i--) {
        push();
        let s = map(i, 0, layers, 0, 500);
        rotate(animTime * settings.speed + i * 0.2);
        strokeWeight(3);
        let c = lerpColor(color(currentPrimary), color('#fff'), i/layers);
        stroke(c);
        rectMode(CENTER);
        rect(0, 0, s, s);
        pop();
    }
}

function drawOrganicBlob(animTime) {
    beginShape();
    for (let a = 0; a < TWO_PI; a += 0.05) {
        let r = 150 + sin(a * 5 + animTime * settings.speed * 3) * 50 + sin(a * 13 - animTime * settings.speed) * 30;
        let x = r * cos(a);
        let y = r * sin(a);
        vertex(x, y);
    }
    endShape(CLOSE);
    
    beginShape();
    for (let a = 0; a < TWO_PI; a += 0.05) {
         let r = 70 + cos(a * 5 - animTime * settings.speed * 3) * 30;
         vertex(r*cos(a), r*sin(a));
    }
    endShape(CLOSE);
}

function drawElectricOrb(animTime) {
    let rays = 30;
    for(let i=0; i<rays; i++) {
        let angle = map(i, 0, rays, 0, TWO_PI);
        let len = 200;
        
        push();
        rotate(angle + animTime * settings.speed);
        
        beginShape();
        vertex(0,0);
        let segs = 10;
        for(let j=0; j<segs; j++) {
            let r = map(j, 0, segs, 0, len);
            let off = sin(j * 10 - animTime * settings.speed * 10) * 15;
            vertex(r, off);
        }
        endShape();
        pop();
    }
}

function drawFractalStar(animTime) {
    for(let i=0; i<6; i++) {
        push();
        rotate(animTime * settings.speed * 0.5 + i * (TWO_PI/6));
        drawStarArm(150, animTime);
        pop();
    }
}

function drawStarArm(len, t) {
    line(0,0, len, 0);
    translate(len, 0);
    if(len > 20) {
        push();
        rotate(t * settings.speed + 0.5);
        drawStarArm(len * 0.6, t);
        pop();
        push();
        rotate(-t * settings.speed - 0.5);
        drawStarArm(len * 0.6, t);
        pop();
    }
}

function drawMoirePatterns(animTime) {
    noFill();
    strokeWeight(2);
    let count = 50;
    
    push();
    translate(-50, 0);
    for(let i=0; i<count; i++) {
        ellipse(0, 0, i*10, i*10);
    }
    pop();
    
    push();
    let xOff = sin(animTime * settings.speed) * 100;
    translate(xOff, 0);
    for(let i=0; i<count; i++) {
        ellipse(0, 0, i*10, i*10);
    }
    pop();
}

// --- UI GENERATION ---

function createControlPanel(parentDiv) {
    sidebar = createDiv('');
    sidebar.parent(parentDiv);
    // Strict inline styles for layout protection
    sidebar.style('width', '320px');
    sidebar.style('height', '100vh');
    sidebar.style('background', '#262626');
    sidebar.style('padding', '20px');
    sidebar.style('box-sizing', 'border-box'); // Protective
    sidebar.style('overflow-y', 'auto');
    sidebar.style('border-left', '1px solid #333');
    sidebar.style('color', '#fff');
    sidebar.style('font-family', 'sans-serif'); // Protective
    sidebar.style('flex-shrink', '0'); 
    sidebar.style('display', 'block'); 
    sidebar.style('z-index', '500'); 

    // Title
    let title = createDiv('Animation tools');
    title.parent(sidebar);
    title.style('font-size', '18px');
    title.style('font-weight', 'bold');
    title.style('margin-bottom', '20px');
    title.style('border-bottom', '1px solid #444');
    title.style('padding-bottom', '10px');

    const createLabel = (txt) => {
        let l = createDiv(txt);
        l.parent(sidebar);
        l.style('margin-top', '15px');
        l.style('font-size', '12px');
        l.style('color', '#aaa');
        return l;
    };

    // --- UNDO / REDO BUTTONS ---
    let historyContainer = createDiv('');
    historyContainer.parent(sidebar);
    historyContainer.style('display', 'flex');
    historyContainer.style('gap', '10px');
    historyContainer.style('margin-top', '10px');
    historyContainer.style('margin-bottom', '10px');

    // Helper to style buttons consistently with JS hover states
    const styleSideBtn = (btn) => {
        btn.style('flex', '1');
        btn.style('padding', '8px');
        btn.style('background', '#444');
        btn.style('color', '#fff');
        btn.style('border', 'none');
        btn.style('border-radius', '4px');
        btn.style('cursor', 'pointer');
        btn.style('transition', 'background 0.2s');
        
        // JS Hover
        btn.mouseOver(() => btn.style('background', '#666'));
        btn.mouseOut(() => btn.style('background', '#444'));
    };

    let undoBtn = createButton('↶ Undo');
    undoBtn.parent(historyContainer);
    styleSideBtn(undoBtn);
    undoBtn.mousePressed(performUndo);

    let redoBtn = createButton('↷ Redo');
    redoBtn.parent(historyContainer);
    styleSideBtn(redoBtn);
    redoBtn.mousePressed(performRedo);

    // Canvas Resolution Select
    createLabel('Canvas dimensions');
    ui.resolution = createSelect();
    ui.resolution.parent(sidebar);
    ui.resolution.option('1:1', '512x512');
    ui.resolution.option('16:9', '800x450');
    ui.resolution.option('4:5', '400x500');
    ui.resolution.option('9:16', '360x640');
    ui.resolution.style('width', '100%');
    ui.resolution.style('padding', '8px');
    ui.resolution.style('background', '#333');
    ui.resolution.style('color', '#fff');
    ui.resolution.style('border', '1px solid #444');
    ui.resolution.style('border-radius', '4px');
    ui.resolution.style('box-sizing', 'border-box'); // Protective
    
    ui.resolution.changed(() => {
        let val = ui.resolution.value();
        let dims = val.split('x');
        settings.width = parseInt(dims[0]);
        settings.height = parseInt(dims[1]);
        resizeCanvas(settings.width, settings.height);
        recordHistory();
    });

    // Pattern Select
    createLabel('Animation patterns');
    ui.pattern = createSelect();
    ui.pattern.parent(sidebar);
    ui.pattern.option('Lissajous Knots', 'lissajous');
    ui.pattern.option('Sine Wave Grid', 'wave');
    ui.pattern.option('Flow Field', 'particles');
    ui.pattern.option('Hypnotic Spiral', 'spiral');
    ui.pattern.option('Wobbly Grid', 'wobbly');
    ui.pattern.option('Pulsing Concentric', 'concentric');
    ui.pattern.option('Rose Mathematics', 'rose');
    ui.pattern.option('Double Helix', 'dna');
    ui.pattern.option('Phyllotaxis Spiral', 'phyllotaxis');
    ui.pattern.option('Super Shape Morph', 'supershape');
    ui.pattern.option('Rotating Polygons', 'polygons');
    ui.pattern.option('Psycho Tunnel', 'tunnel');
    ui.pattern.option('Bio Blob', 'blob');
    ui.pattern.option('Electric Orb', 'electric');
    ui.pattern.option('Fractal Snowflake', 'fractal');
    ui.pattern.option('Moire Dance', 'moire');
    
    ui.pattern.changed(() => {
        settings.pattern = ui.pattern.value();
        updateUIFromSettings(); 
        recordHistory();
    });
    ui.pattern.style('width', '100%');
    ui.pattern.style('padding', '8px');
    ui.pattern.style('background', '#333');
    ui.pattern.style('color', '#fff');
    ui.pattern.style('border', '1px solid #444');
    ui.pattern.style('border-radius', '4px');
    ui.pattern.style('box-sizing', 'border-box'); // Protective

    // --- SLIDERS ROW ---
    let sliderRow = createDiv('');
    sliderRow.parent(sidebar);
    sliderRow.style('display', 'flex');
    sliderRow.style('gap', '10px');
    sliderRow.style('margin-top', '15px');

    let colSpeed = createDiv('');
    colSpeed.parent(sliderRow);
    colSpeed.style('width', '50%');
    
    let lblSpeed = createDiv('Speed');
    lblSpeed.parent(colSpeed);
    lblSpeed.style('font-size', '12px');
    lblSpeed.style('color', '#aaa');
    
    ui.speed = createSlider(0.1, 3.0, settings.speed, 0.1); 
    ui.speed.parent(colSpeed);
    ui.speed.style('width', '100%');
    ui.speed.style('margin-top', '5px');
    ui.speed.input(() => settings.speed = ui.speed.value());
    ui.speed.changed(() => recordHistory()); 

    let colZoom = createDiv('');
    colZoom.parent(sliderRow);
    colZoom.style('width', '50%');

    let lblZoom = createDiv('Zoom');
    lblZoom.parent(colZoom);
    lblZoom.style('font-size', '12px');
    lblZoom.style('color', '#aaa');

    ui.zoom = createSlider(0.1, 3.0, settings.zoom, 0.1);
    ui.zoom.parent(colZoom);
    ui.zoom.style('width', '100%');
    ui.zoom.style('margin-top', '5px');
    ui.zoom.input(() => settings.zoom = ui.zoom.value());
    ui.zoom.changed(() => recordHistory()); 

    // --- COLORS ROW ---
    let colorRow = createDiv('');
    colorRow.parent(sidebar);
    colorRow.style('display', 'flex');
    colorRow.style('gap', '10px');
    colorRow.style('margin-top', '15px');

    let col1 = createDiv('');
    col1.parent(colorRow);
    col1.style('width', '50%');
    
    let lbl1 = createDiv('Animation color');
    lbl1.parent(col1);
    lbl1.style('font-size', '12px');
    lbl1.style('color', '#aaa');
    
    ui.color = createColorPicker(settings.primaryColor);
    ui.color.parent(col1);
    ui.color.style('width', '100%');
    ui.color.style('margin-top', '5px');
    ui.color.style('box-sizing', 'border-box');
    ui.color.input(() => settings.primaryColor = ui.color.value());
    ui.color.changed(() => recordHistory());

    let col2 = createDiv('');
    col2.parent(colorRow);
    col2.style('width', '50%');

    let lbl2 = createDiv('Canvas color');
    lbl2.parent(col2);
    lbl2.style('font-size', '12px');
    lbl2.style('color', '#aaa');

    ui.bgColor = createColorPicker(settings.bgColor);
    ui.bgColor.parent(col2);
    ui.bgColor.style('width', '100%');
    ui.bgColor.style('margin-top', '5px');
    ui.bgColor.style('box-sizing', 'border-box');
    ui.bgColor.input(() => settings.bgColor = ui.bgColor.value());
    ui.bgColor.changed(() => recordHistory());

    // Random Colors Checkbox
    let discoContainer = createDiv('');
    discoContainer.parent(sidebar);
    discoContainer.style('display', 'flex');
    discoContainer.style('align-items', 'center');
    discoContainer.style('margin-top', '15px');
    discoContainer.style('gap', '8px');

    ui.discoCheck = createCheckbox('', false);
    ui.discoCheck.parent(discoContainer);
    ui.discoCheck.style('margin', '0');
    ui.discoCheck.changed(() => {
        settings.discoMode = ui.discoCheck.checked();
        recordHistory();
    });

    let discoLabel = createSpan('Random colors');
    discoLabel.parent(discoContainer);
    discoLabel.style('font-size', '14px');

    // --- BRUSH MODE TOGGLE ---
    let brushContainer = createDiv('');
    brushContainer.parent(sidebar);
    brushContainer.style('display', 'flex');
    brushContainer.style('align-items', 'center');
    brushContainer.style('margin-top', '10px');
    brushContainer.style('gap', '8px');
    brushContainer.style('padding', '10px');
    brushContainer.style('background', '#333');
    brushContainer.style('border-radius', '4px');
    brushContainer.style('box-sizing', 'border-box');

    ui.brushCheck = createCheckbox('', false);
    ui.brushCheck.parent(brushContainer);
    ui.brushCheck.style('margin', '0');
    ui.brushCheck.changed(() => {
        settings.brushMode = ui.brushCheck.checked();
        updateUIFromSettings(); 
    });

    let brushLabel = createSpan('Brush');
    brushLabel.parent(brushContainer);
    brushLabel.style('font-size', '14px');

    // --- TEXT BRUSH TOGGLE ---
    ui.textBrushCheck = createCheckbox('', false);
    ui.textBrushCheck.parent(brushContainer); 
    ui.textBrushCheck.style('margin', '0 0 0 15px'); 
    ui.textBrushCheck.changed(() => {
        settings.textBrushMode = ui.textBrushCheck.checked();
        updateUIFromSettings();
        recordHistory();
    });

    let textBrushLabel = createSpan('Text');
    textBrushLabel.parent(brushContainer);
    textBrushLabel.style('font-size', '14px');

    let clearBrushBtn = createButton('Clear canvas');
    clearBrushBtn.parent(brushContainer);
    clearBrushBtn.style('margin-left', 'auto');
    clearBrushBtn.style('font-size', '10px');
    clearBrushBtn.style('padding', '5px');
    clearBrushBtn.style('cursor', 'pointer');
    clearBrushBtn.style('border', 'none');
    clearBrushBtn.style('background', '#555');
    clearBrushBtn.style('color', '#fff');
    clearBrushBtn.style('border-radius', '3px');
    // JS Hover
    clearBrushBtn.mouseOver(() => clearBrushBtn.style('background', '#777'));
    clearBrushBtn.mouseOut(() => clearBrushBtn.style('background', '#555'));

    clearBrushBtn.mousePressed(() => {
        settings.drawnStrokes = [];
        recordHistory(); 
    });
    // --- END BRUSH MODE TOGGLE ---

    ui.textLabel = createLabel('Testo da disegnare');
    ui.textLabel.style('display', 'none'); 
    
    ui.textInput = createInput(settings.textString);
    ui.textInput.parent(sidebar);
    ui.textInput.style('width', '100%');
    ui.textInput.style('padding', '8px');
    ui.textInput.style('background', '#333');
    ui.textInput.style('color', '#fff');
    ui.textInput.style('border', '1px solid #444');
    ui.textInput.style('border-radius', '4px');
    ui.textInput.style('display', 'none'); 
    ui.textInput.style('box-sizing', 'border-box');
    
    ui.textInput.input(() => settings.textString = ui.textInput.value());
    ui.textInput.changed(() => recordHistory());

    // Duration Slider
    ui.durationLabel = createLabel('Duration: 2 Seconds');
    ui.duration = createSlider(2, 8, 2, 1);
    ui.duration.parent(sidebar);
    ui.duration.style('width', '100%');
    ui.duration.input(() => {
        settings.duration = ui.duration.value();
        settings.frames = settings.duration * 60; 
        ui.durationLabel.html('Duration: ' + settings.duration + ' Seconds');
    });
    ui.duration.changed(() => recordHistory());

    // Filename Input
    createLabel('File name');
    ui.filenameInput = createInput(settings.filename);
    ui.filenameInput.parent(sidebar);
    ui.filenameInput.style('width', '100%'); 
    ui.filenameInput.style('padding', '8px');
    ui.filenameInput.style('background', '#333');
    ui.filenameInput.style('color', '#fff');
    ui.filenameInput.style('border', '1px solid #444');
    ui.filenameInput.style('border-radius', '4px');
    ui.filenameInput.style('box-sizing', 'border-box');
    ui.filenameInput.input(() => settings.filename = ui.filenameInput.value());
    ui.filenameInput.changed(() => recordHistory());

    // Render Quality Select
    createLabel('Quality settings (Higher quality = slower saving speed)');
    ui.quality = createSelect();
    ui.quality.parent(sidebar);
    ui.quality.option('Low', 20);
    ui.quality.option('Standard', 10);
    ui.quality.option('High', 1);
    ui.quality.style('width', '100%');
    ui.quality.style('padding', '8px');
    ui.quality.style('background', '#333');
    ui.quality.style('color', '#fff');
    ui.quality.style('border', '1px solid #444');
    ui.quality.style('border-radius', '4px');
    ui.quality.style('box-sizing', 'border-box');
    ui.quality.selected(10);
    ui.quality.changed(() => {
        settings.quality = parseInt(ui.quality.value());
        recordHistory();
    });

    // Record Button
    createDiv('<br>').parent(sidebar);
    ui.recordBtn = createButton('Start recording GIF');
    ui.recordBtn.parent(sidebar);
    ui.recordBtn.style('width', '100%');
    ui.recordBtn.style('padding', '12px');
    ui.recordBtn.style('background', '#3b82f6');
    ui.recordBtn.style('color', 'white');
    ui.recordBtn.style('border', 'none');
    ui.recordBtn.style('border-radius', '6px');
    ui.recordBtn.style('cursor', 'pointer');
    ui.recordBtn.style('font-weight', 'bold');
    ui.recordBtn.style('font-size', '14px');
    ui.recordBtn.style('transition', 'background 0.2s');
    
    // JS Hover Events
    ui.recordBtn.mouseOver(() => ui.recordBtn.style('background', '#2563eb'));
    ui.recordBtn.mouseOut(() => {
        if(!exporter.isRecording) ui.recordBtn.style('background', '#3b82f6');
    });
    
    ui.recordBtn.mousePressed(() => {
        if (!exporter.isRecording) {
            settings.frames = settings.duration * 60;
            exporter.start(settings.quality, settings.width, settings.height);
            ui.recordBtn.html('Recording...');
            ui.recordBtn.style('background', '#ef4444');
        }
    });

    // Refresh Canvas Button
    createDiv('<br>').parent(sidebar); 
    let refreshBtn = createButton('↻ Refresh canvas');
    refreshBtn.parent(sidebar);
    refreshBtn.style('width', '100%');
    refreshBtn.style('padding', '10px');
    refreshBtn.style('background', '#dc2626'); 
    refreshBtn.style('color', 'white');
    refreshBtn.style('border', 'none');
    refreshBtn.style('border-radius', '6px');
    refreshBtn.style('cursor', 'pointer');
    refreshBtn.style('font-weight', 'bold');
    refreshBtn.style('margin-top', '10px');
    refreshBtn.style('font-size', '12px');
    refreshBtn.style('transition', 'background 0.2s');
    
    // JS Hover Events
    refreshBtn.mouseOver(() => refreshBtn.style('background', '#b91c1c'));
    refreshBtn.mouseOut(() => refreshBtn.style('background', '#dc2626'));

    refreshBtn.mousePressed(performRefresh);
}

// --- GIF EXPORTER CLASS ---

class GifExporter {
    constructor() {
        this.gif = null;
        this.isRecording = false;
        this.recordedFrames = 0;
        this.workerBlobURL = null;
        this.initWorker();
    }

    async initWorker() {
        try {
            const response = await fetch('https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.worker.js');
            const text = await response.text();
            const blob = new Blob([text], { type: 'application/javascript' });
            this.workerBlobURL = URL.createObjectURL(blob);
        } catch (e) {
            console.error("GIF Worker Load Error:", e);
        }
    }

    start(quality, width, height) {
        if (!this.workerBlobURL) {
            alert("Worker not loaded yet. Wait a moment and try again.");
            return;
        }
        
        if (typeof window.GIF === 'undefined') {
            alert("GIF library not loaded. Please ensure gif.js is included.");
            return;
        }

        const threads = navigator.hardwareConcurrency || 4;

        this.gif = new window.GIF({
            workers: Math.max(2, threads), 
            quality: quality,
            width: width,
            height: height,
            workerScript: this.workerBlobURL
        });

        this.gif.on('finished', (blob) => {
            let url = URL.createObjectURL(blob);
            let a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            let name = settings.filename || 'animation';
            a.download = name + '.gif';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            
            if(ui.recordBtn) {
                ui.recordBtn.html('Start recording GIF');
                ui.recordBtn.style('background', '#3b82f6');
            }
        });

        this.isRecording = true;
        this.recordedFrames = 0;
        
        frameCount = 0; 
    }

    capture(canvasElement) {
        if (this.isRecording && this.gif) {
            this.gif.addFrame(canvasElement, {copy: true, delay: 1000/60});
            this.recordedFrames++;

            if (this.recordedFrames >= settings.frames) {
                this.finish();
            }
        }
    }

    finish() {
        this.isRecording = false;
        if(ui.recordBtn) ui.recordBtn.html('Saving, please wait...');
        this.gif.render();
    }
}