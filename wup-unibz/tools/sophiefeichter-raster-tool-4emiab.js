// --- Global Variables ---
let img, originalImg;
let vectorGraphics;

let fileInput, shapeSelector, styleSelector;
let resolutionSlider, sizeSlider, scatterSlider, rotationSlider;
let contrastSlider; 
let dotColorPicker, bgColorPicker, opacitySlider;
let pngSaveButton, randomButton, resetButton;

let resolution = 10;
let shapeScale = 0.9; 
let scatterAmount = 0;
let rotationVal = 0; 
let rasterStyle = 'GRID';

// --- Layout & Scaling ---
const MENU_WIDTH = 250; 
const PADDING_OUTER = 20;
let displayScale = 1; 

let menuDiv;

function setup() {
    let cnv = createCanvas(windowWidth - MENU_WIDTH, windowHeight);
    cnv.style('margin-left', MENU_WIDTH + 'px');
    cnv.style('display', 'block');
    noLoop();

    menuDiv = createDiv();
    menuDiv.style('position', 'fixed');
    menuDiv.style('top', '0');
    menuDiv.style('left', '0');
    menuDiv.style('width', MENU_WIDTH + 'px');
    menuDiv.style('height', '100vh');
    menuDiv.style('background', '#1E1E1E');
    menuDiv.style('padding', '20px');
    menuDiv.style('display', 'flex');
    menuDiv.style('flex-direction', 'column');
    menuDiv.style('gap', '12px');
    menuDiv.style('box-sizing', 'border-box');
    menuDiv.style('font-family', 'sans-serif');
    menuDiv.style('color', '#fff');
    menuDiv.style('border-right', '2px solid #333');
    menuDiv.style('overflow-y', 'auto');

    // CSS für smoothe Slider hinzufügen
    let style = createElement('style', `
        input[type=range] {
            -webkit-appearance: none;
            width: 100%;
            background: transparent;
            cursor: pointer;
        }
        input[type=range]:focus { outline: none; }
        input[type=range]::-webkit-slider-runnable-track {
            width: 100%;
            height: 6px;
            background: #444;
            border-radius: 3px;
        }
        input[type=range]::-webkit-slider-thumb {
            height: 16px;
            width: 16px;
            border-radius: 50%;
            background: #007AFF;
            -webkit-appearance: none;
            margin-top: -5px;
            transition: transform 0.1s ease;
        }
        input[type=range]:active::-webkit-slider-thumb {
            transform: scale(1.2);
            background: #34C759;
        }
    `);

    setupInterface();
}

function setupInterface() {
    createMenuBlock('1. IMAGE', b => {
        fileInput = createFileInput(handleFile);
        fileInput.style('width', '100%');
        fileInput.parent(b);
    });

    createMenuBlock('QUICK ACTIONS', b => {
        randomButton = createButton('SURPRISE ME');
        randomButton.mousePressed(randomizeSettings);
        randomButton.style('background', '#34C759');
        randomButton.style('color', '#fff');
        randomButton.style('border', 'none');
        randomButton.style('padding', '10px');
        randomButton.style('border-radius', '4px');
        randomButton.style('cursor', 'pointer');
        randomButton.style('font-weight', 'bold');
        randomButton.style('width', '100%');
        randomButton.style('margin-bottom', '5px');
        randomButton.parent(b);

        resetButton = createButton('RESET');
        resetButton.mousePressed(resetSettings);
        resetButton.style('background', '#FF3B30');
        resetButton.style('color', '#fff');
        resetButton.style('border', 'none');
        resetButton.style('padding', '10px');
        resetButton.style('border-radius', '4px');
        resetButton.style('cursor', 'pointer');
        resetButton.style('font-weight', 'bold');
        resetButton.style('width', '100%');
        resetButton.parent(b);
    });

    createMenuBlock('2. STYLE', b => {
        styleSelector = createSelect();
        ['GRID', 'OFFSET', 'PHOTO COLORS', 'RAINBOW OMBRE', 'CHESS', 'SPIRAL'].forEach(s => styleSelector.option(s));
        styleSelector.changed(() => { rasterStyle = styleSelector.value(); triggerRedraw(); });
        styleSelector.style('width', '100%');
        styleSelector.parent(b);
    });

    createMenuBlock('3. SHAPE', b => {
        shapeSelector = createSelect();
        ['DOTS','LINES','SQUARES','HEARTS','CROSSES','STARS','TRIANGLES'].forEach(s => shapeSelector.option(s));
        shapeSelector.changed(triggerRedraw);
        shapeSelector.style('width', '100%');
        shapeSelector.parent(b);
    });

    createMenuBlock('4. DENSITY', b => {
        resolutionSlider = createSlider(4, 60, resolution, 1);
        resolutionSlider.input(() => { resolution = resolutionSlider.value(); triggerRedraw(); });
        resolutionSlider.style('width', '100%').parent(b);
    });

    createMenuBlock('5. SIZE', b => {
        sizeSlider = createSlider(0.1, 4.0, 0.9, 0.01);
        sizeSlider.input(() => { shapeScale = sizeSlider.value(); triggerRedraw(); });
        sizeSlider.style('width', '100%').parent(b);
    });

    createMenuBlock('6. CONTRAST', b => {
        contrastSlider = createSlider(-100, 100, 0, 1);
        contrastSlider.input(triggerRedraw); 
        contrastSlider.style('width', '100%').parent(b);
    });

    createMenuBlock('7. RANDOM / SCATTER', b => {
        scatterSlider = createSlider(0, 30, 0, 0.1);
        scatterSlider.input(() => { scatterAmount = scatterSlider.value(); triggerRedraw(); });
        scatterSlider.style('width', '100%').parent(b);
    });

    createMenuBlock('8. ROTATION', b => {
        rotationSlider = createSlider(0, 360, 0, 1);
        rotationSlider.input(() => { rotationVal = rotationSlider.value(); triggerRedraw(); });
        rotationSlider.style('width', '100%').parent(b);
    });

    createMenuBlock('9. COLORS & OPACITY', b => {
        let pickerRow = createDiv().style('display', 'flex').style('gap', '10px').style('margin-bottom', '5px').parent(b);
        dotColorPicker = createColorPicker('#000000');
        dotColorPicker.changed(triggerRedraw);
        dotColorPicker.size(45, 25);
        dotColorPicker.parent(pickerRow);

        bgColorPicker = createColorPicker('#ffffff');
        bgColorPicker.changed(triggerRedraw);
        bgColorPicker.size(45, 25);
        bgColorPicker.parent(pickerRow);

        opacitySlider = createSlider(0, 255, 255, 1);
        opacitySlider.input(triggerRedraw);
        opacitySlider.style('width', '100%').parent(b);
    });

    createMenuBlock('10. EXPORT', b => {
        pngSaveButton = createButton('SAVE FULL RES PNG');
        pngSaveButton.mousePressed(savePNG);
        pngSaveButton.style('background', '#007AFF');
        pngSaveButton.style('color', '#fff');
        pngSaveButton.style('border', 'none');
        pngSaveButton.style('padding', '10px');
        pngSaveButton.style('border-radius', '4px');
        pngSaveButton.style('cursor', 'pointer');
        pngSaveButton.style('width', '100%');
        pngSaveButton.parent(b);
    });
}

function createMenuBlock(label, content) {
    const b = createDiv();
    b.style('display','flex').style('flex-direction','column');
    b.parent(menuDiv);
    createDiv(label).style('font-size', '10px').style('margin-bottom', '5px').style('color', '#888').style('font-weight', 'bold').parent(b);
    content(b);
}

function resetSettings() {
    resolution = 10;
    resolutionSlider.value(10);
    shapeScale = 0.9;
    sizeSlider.value(0.9);
    contrastSlider.value(0);
    scatterAmount = 0;
    scatterSlider.value(0);
    rotationVal = 0;
    rotationSlider.value(0);
    rasterStyle = 'GRID';
    styleSelector.selected('GRID');
    shapeSelector.selected('DOTS');
    dotColorPicker.value('#000000');
    bgColorPicker.value('#ffffff');
    opacitySlider.value(255);
    triggerRedraw();
}

function randomizeSettings() {
    rasterStyle = random(['GRID', 'OFFSET', 'PHOTO COLORS', 'RAINBOW OMBRE', 'CHESS', 'SPIRAL']);
    styleSelector.selected(rasterStyle);
    shapeSelector.selected(random(['DOTS','LINES','SQUARES','HEARTS','CROSSES','STARS','TRIANGLES']));
    resolution = floor(random(6, 40));
    resolutionSlider.value(resolution);
    shapeScale = random(0.5, 2.5);
    sizeSlider.value(shapeScale);
    contrastSlider.value(random(-50, 80));
    scatterAmount = random(0, 15);
    scatterSlider.value(scatterAmount);
    rotationVal = random(0, 360);
    rotationSlider.value(rotationVal);
    opacitySlider.value(random(150, 255));
    dotColorPicker.value(color(random(255), random(255), random(255)).toString('#rrggbb'));
    bgColorPicker.value(color(random(200, 255), random(200, 255), random(200, 255)).toString('#rrggbb'));
    triggerRedraw();
}

function triggerRedraw() { if (originalImg) loop(); }

function handleFile(file) {
    if (file.type !== 'image') return;
    if (vectorGraphics) vectorGraphics.remove();
    loadImage(file.data, i => { 
        originalImg = i; 
        img = i;
        vectorGraphics = createGraphics(img.width, img.height);
        vectorGraphics.image(img, 0, 0);
        vectorGraphics.filter(GRAY);
        updateCanvasSize();
        triggerRedraw(); 
    });
}

function updateCanvasSize() {
    if (!originalImg) return;
    let availableW = windowWidth - MENU_WIDTH - (PADDING_OUTER * 2);
    let availableH = windowHeight - (PADDING_OUTER * 2);
    let scaleW = availableW / originalImg.width;
    let scaleH = availableH / originalImg.height;
    displayScale = min(scaleW, scaleH, 1); 
    resizeCanvas(windowWidth - MENU_WIDTH, windowHeight);
}

function windowResized() {
    updateCanvasSize();
    triggerRedraw();
}

function getAdjustedBrightness(val) {
    let contrast = contrastSlider.value();
    let factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
    return factor * (val - 128) + 128;
}

function drawShape(g, x, y, s, b, customColor) {
    const m = shapeSelector.value();
    let baseCol = customColor ? customColor : dotColorPicker.color();
    let c = color(baseCol);
    c.setAlpha(opacitySlider.value()); 
    
    g.fill(c);
    g.noStroke(); 
    
    let offX = random(-scatterAmount, scatterAmount);
    let offY = random(-scatterAmount, scatterAmount);
    
    g.push();
    g.translate(x + offX, y + offY);
    g.rotate(radians(rotationVal));

    if (m === 'DOTS') g.ellipse(0, 0, s, s);
    else if (m === 'LINES') {
        g.stroke(c);
        g.strokeWeight(s * 0.2); 
        g.rotate(map(b, 0, 255, 0, PI));
        g.line(-s/2, 0, s/2, 0);
    }
    else if (m === 'SQUARES') g.rect(-s/2, -s/2, s, s);
    else if (m === 'CROSSES') { 
        g.stroke(c);
        g.strokeWeight(s * 0.2);
        g.line(-s/2, 0, s/2, 0); 
        g.line(0, -s/2, 0, s/2); 
    }
    else if (m === 'TRIANGLES') g.triangle(0, -s/2, -s/2, s/2, s/2, s/2);
    else if (m === 'STARS') star(g, 0, 0, s*0.2, s*0.5, 5);
    else if (m === 'HEARTS') heart(g, 0, 0, s*0.6);
    g.pop();
}

function renderGraphics(g) {
    let isPreview = !g;
    let target = g ? g : this;
    
    if (isPreview) {
        background(30); 
        push();
        let centerX = (width / 2) - (originalImg.width * displayScale / 2);
        let centerY = (height / 2) - (originalImg.height * displayScale / 2);
        translate(centerX, centerY);
        scale(displayScale);
        fill(bgColorPicker.color());
        noStroke();
        rect(0, 0, originalImg.width, originalImg.height);
    } else {
        g.background(bgColorPicker.color());
        g.smooth(); 
    }

    randomSeed(99);
    let rowCount = 0;
    for (let y = 0; y < img.height; y += resolution) {
        let xOffset = (rasterStyle === 'OFFSET' && rowCount % 2 === 1) ? resolution / 2 : 0;
        if (rasterStyle === 'SPIRAL') xOffset = sin(y * 0.05) * resolution;

        for (let x = 0; x < img.width; x += resolution) {
            if (rasterStyle === 'CHESS' && (floor(x/resolution) + rowCount) % 2 === 0) continue;

            let pixelColor = vectorGraphics.get(x, y)[0];
            let b = getAdjustedBrightness(pixelColor);
            let s = map(b, 0, 255, resolution * shapeScale, 0);
            
            if (s > 0.5) {
                let drawX = x + resolution/2 + xOffset;
                let drawY = y + resolution/2;
                let customCol = null;

                if (rasterStyle === 'RAINBOW OMBRE') {
                    target.push(); target.colorMode(HSB, 360, 100, 100);
                    customCol = target.color(map(x + y, 0, img.width + img.height, 0, 360), 80, 90);
                    target.pop();
                } else if (rasterStyle === 'PHOTO COLORS') {
                    customCol = originalImg.get(x, y);
                }
                drawShape(target, drawX, drawY, s, b, customCol);
            }
        }
        rowCount++;
    }
    if (isPreview) pop();
}

function savePNG() {
    if (!originalImg) return;
    let g = createGraphics(originalImg.width, originalImg.height);
    g.smooth();
    renderGraphics(g);
    save(g, 'raster_art_pro.png');
    g.remove(); 
}

function draw() {
    if (!originalImg) return;
    renderGraphics(null);
    noLoop();
}

function star(g, x, y, r1, r2, n) {
    g.beginShape();
    for (let i = 0; i < TWO_PI; i += TWO_PI / n) {
        g.vertex(x + cos(i) * r2, y + sin(i) * r2);
        g.vertex(x + cos(i + PI / n) * r1, y + sin(i + PI / n) * r1);
    }
    g.endShape(CLOSE);
}

function heart(g, x, y, s) {
    g.beginShape();
    g.vertex(x, y);
    g.bezierVertex(x - s, y - s, x - s * 1.5, y + s / 3, x, y + s);
    g.bezierVertex(x + s * 1.5, y + s / 3, x + s, y - s, x, y);
    g.endShape(CLOSE);
}