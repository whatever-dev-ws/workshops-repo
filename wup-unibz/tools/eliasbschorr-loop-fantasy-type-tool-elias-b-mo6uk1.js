// WUP 2025-26
// Elias Bschorr
let textInput;
let textColorPicker, bgColorPicker, frameColorPicker;
let textColorLabel, bgColorLabel, frameColorLabel;
let textLoopCheck, bgLoopCheck;
let pngSaveButton, gifSaveButton;
let mirrorMinusBtn, mirrorPlusBtn, mirrorLabel;
let toggleBtn;
let speedMinusBtn, speedPlusBtn, speedLabel;
let fsToggleBtn;
let canvasWidthInput, canvasHeightInput, applyCanvasSizeBtn;

// UI Storage
let sliders = {};
let sectionLabels = [];
let sliderLabels = [];
let sidebarElements = [];
let separatorLine;

const SIDEBAR_WIDTH = 260;
const PADDING = 20;
const MENU_BG = '#1E1E1E';
const GOLD_COLOR = '#D4AF37';

// Logic Variables
let isSidebarOpen = true;
let loopFrames = 180;
let speedLevel = 1;
const SPEEDS = [360, 180, 120, 90];
const SPEED_NAMES = ["SLOW", "NORMAL", "FAST", "TURBO"];

let mirrorLevel = 0;
let isRecordingGIF = false;
let recordingFrameCount = 0;

// Animation area size (user-configurable)
let animationWidth = 800;
let animationHeight = 600;

// --- START SCREEN VARIABLES ---
let showingStartScreen = true;
let startHeadlineVal = "TYPING TOOL";
let startHeadlineDisplay = "";
let startButton, fsButton;

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);

  // Inject global styles via JS
  let styleEl = document.createElement('style');
  styleEl.textContent = `
    html, body { margin: 0; padding: 0; overflow: hidden; background: #000; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    canvas { display: block; }
  `;
  document.head.appendChild(styleEl);

  setupUI();
  toggleEditorUI(false);
  setupStartScreenUI();
  repositionUI();

  background(0);
  textFont('Arial');
  textStyle(BOLD);
  frameRate(60);
  loop();
}

// --- START SCREEN LOGIC ---
function setupStartScreenUI() {
    const btnStyle = `
        background-color: transparent;
        color: ${GOLD_COLOR};
        border: 2px solid ${GOLD_COLOR};
        border-radius: 25px;
        font-size: 20px;
        font-weight: bold;
        padding: 12px 0;
        cursor: pointer;
        transition: background 0.3s ease, color 0.3s ease;
        text-align: center;
    `;

    startButton = createButton('START');
    startButton.style(btnStyle);
    startButton.size(160, 50);
    startButton.mouseOver(() => startButton.style('background-color', GOLD_COLOR).style('color', '#000'));
    startButton.mouseOut(() => startButton.style('background-color', 'transparent').style('color', GOLD_COLOR));
    startButton.mousePressed(enterEditorMode);

    fsButton = createButton('FULLSCREEN');
    fsButton.style(btnStyle);
    fsButton.size(160, 50);
    fsButton.mouseOver(() => fsButton.style('background-color', GOLD_COLOR).style('color', '#000'));
    fsButton.mouseOut(() => fsButton.style('background-color', 'transparent').style('color', GOLD_COLOR));
    fsButton.mousePressed(() => {
        fullscreen(true);
        setTimeout(enterEditorMode, 100);
    });
}

function drawStartScreen() {
    background(0);
    textAlign(CENTER, CENTER);
    fill(GOLD_COLOR);
    noStroke();
    textSize(min(windowWidth * 0.08, 80));

    let charIndex = floor(frameCount / 8) % (startHeadlineVal.length + 20);
    startHeadlineDisplay = startHeadlineVal.substring(0, charIndex);
    if (frameCount % 60 < 30) startHeadlineDisplay += "|";

    text(startHeadlineDisplay, width/2, height * 0.35);

    let pulseScale = 1 + sin(frameCount * 0.1) * 0.03;
    if(startButton) startButton.style('transform', `scale(${pulseScale})`);
    if(fsButton) fsButton.style('transform', `scale(${pulseScale})`);
}

function enterEditorMode() {
    showingStartScreen = false;
    if(startButton) startButton.remove();
    if(fsButton) fsButton.remove();
    startButton = null;
    fsButton = null;

    toggleEditorUI(true);
    repositionUI();
}

// --- SMART SLIDER CLASS ---
class SmartSlider {
    constructor(name, min, max, val) {
        this.name = name;
        this.minGlobal = min;
        this.maxGlobal = max;
        this.val = val;
        this.low = min;
        this.high = max;

        this.x = 0;
        this.y = 0;
        this.w = 140;

        this.check = createCheckbox('Loop', false);
        this.check.style('color', '#888')
                  .style('font-size', '10px')
                  .style('accent-color', GOLD_COLOR)
                  .style('cursor', 'pointer')
                  .style('font-family', '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif');

        this.labelDOM = createP(name + ': ' + val);
        this.labelDOM.style('color', '#ccc')
                     .style('font-size', '11px')
                     .style('font-family', '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif')
                     .style('margin', '0')
                     .style('white-space', 'nowrap')
                     .style('line-height', '1.2');

        sidebarElements.push({ elt: this.check });
        sliderLabels.push({ elt: this.labelDOM });

        this.dragging = null;
    }

    display() {
        noStroke();
        fill(60);
        rect(this.x, this.y + 7, this.w, 4, 2);

        let xLow = map(this.low, this.minGlobal, this.maxGlobal, this.x, this.x + this.w);
        let xHigh = map(this.high, this.minGlobal, this.maxGlobal, this.x, this.x + this.w);

        fill(90);
        rect(xLow, this.y + 7, xHigh - xLow, 4);

        stroke(GOLD_COLOR);
        strokeWeight(2);
        line(xLow, this.y + 1, xLow, this.y + 17);
        line(xHigh, this.y + 1, xHigh, this.y + 17);

        let xVal = map(this.val, this.minGlobal, this.maxGlobal, this.x, this.x + this.w);
        noStroke();
        fill(255);
        circle(xVal, this.y + 9, 12);
    }

    updateInteraction() {
        if (!mouseIsPressed) {
            this.dragging = null;
            return;
        }
        let mx = mouseX;
        let my = mouseY;
        let xVal = map(this.val, this.minGlobal, this.maxGlobal, this.x, this.x + this.w);
        let xLow = map(this.low, this.minGlobal, this.maxGlobal, this.x, this.x + this.w);
        let xHigh = map(this.high, this.minGlobal, this.maxGlobal, this.x, this.x + this.w);
        let hitR = 15;

        if (this.dragging === null) {
            if (dist(mx, my, xHigh, this.y + 9) < hitR) this.dragging = 'high';
            else if (dist(mx, my, xLow, this.y + 9) < hitR) this.dragging = 'low';
            else if (dist(mx, my, xVal, this.y + 9) < hitR) this.dragging = 'val';
            else if (mx > this.x && mx < this.x + this.w && my > this.y && my < this.y + 20) this.dragging = 'val';
        }

        if (this.dragging) {
            let newVal = map(mx, this.x, this.x + this.w, this.minGlobal, this.maxGlobal);
            newVal = constrain(newVal, this.minGlobal, this.maxGlobal);

            if (this.dragging === 'val') {
                this.val = newVal;
            } else if (this.dragging === 'low') {
                this.low = min(newVal, this.high);
            } else if (this.dragging === 'high') {
                this.high = max(newVal, this.low);
            }
            this.labelDOM.html(this.name + ': ' + floor(this.val));
            loop();
        }
    }
}

// --- MAIN UI SETUP ---

function setupUI() {
    toggleBtn = createButton('?');
    toggleBtn.style('background', '#333')
             .style('color', '#fff')
             .style('border', 'none')
             .style('cursor', 'pointer')
             .style('z-index', '100')
             .style('font-size', '14px')
             .style('border-radius', '4px');
    toggleBtn.mousePressed(() => {
        isSidebarOpen = !isSidebarOpen;
        toggleBtn.html(isSidebarOpen ? '?' : '?');
        toggleEditorUI(isSidebarOpen);
        repositionUI();
    });

    fsToggleBtn = createButton('ENTER FULLSCREEN');
    styleButton(fsToggleBtn, '#555');
    fsToggleBtn.size(SIDEBAR_WIDTH - 40, 25);
    fsToggleBtn.mousePressed(() => {
        let fs = fullscreen();
        fullscreen(!fs);
    });
    sidebarElements.push({ elt: fsToggleBtn });

    createSectionLabel('CANVAS SIZE');

    canvasWidthInput = createInput(String(animationWidth));
    canvasWidthInput.style('width', '70px')
                    .style('padding', '6px')
                    .style('font-size', '12px')
                    .style('background', '#333')
                    .style('color', '#fff')
                    .style('border', '1px solid #555')
                    .style('border-radius', '4px')
                    .style('outline', 'none')
                    .style('font-family', 'inherit');
    canvasWidthInput.attribute('type', 'number');
    canvasWidthInput.attribute('min', '100');
    canvasWidthInput.attribute('placeholder', 'Width');
    sidebarElements.push({ elt: canvasWidthInput });

    canvasHeightInput = createInput(String(animationHeight));
    canvasHeightInput.style('width', '70px')
                     .style('padding', '6px')
                     .style('font-size', '12px')
                     .style('background', '#333')
                     .style('color', '#fff')
                     .style('border', '1px solid #555')
                     .style('border-radius', '4px')
                     .style('outline', 'none')
                     .style('font-family', 'inherit');
    canvasHeightInput.attribute('type', 'number');
    canvasHeightInput.attribute('min', '100');
    canvasHeightInput.attribute('placeholder', 'Height');
    sidebarElements.push({ elt: canvasHeightInput });

    applyCanvasSizeBtn = createButton('APPLY');
    styleButton(applyCanvasSizeBtn, '#555');
    applyCanvasSizeBtn.size(50, 28);
    applyCanvasSizeBtn.mousePressed(applyCanvasSize);
    sidebarElements.push({ elt: applyCanvasSizeBtn });

    createSectionLabel('YOUR TEXT');
    textInput = createInput('DESIGN');
    textInput.style('width', '200px')
             .style('padding', '8px')
             .style('font-size', '14px')
             .style('background', '#333')
             .style('color', '#fff')
             .style('border', '1px solid #555')
             .style('border-radius', '4px')
             .style('outline', 'none')
             .style('font-family', 'inherit');
    textInput.input(() => loop());
    sidebarElements.push({ elt: textInput });

    createSectionLabel('LOOP SPEED');
    speedMinusBtn = createButton('-');
    styleButton(speedMinusBtn, '#444');
    speedMinusBtn.size(30, 25);
    speedMinusBtn.mousePressed(() => changeSpeed(-1));
    sidebarElements.push({ elt: speedMinusBtn });

    speedLabel = createSpan(SPEED_NAMES[speedLevel]);
    speedLabel.style('color', '#fff')
              .style('font-family', '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif')
              .style('font-size', '12px')
              .style('font-weight', 'bold')
              .style('text-align', 'center')
              .style('width', '60px')
              .style('display', 'inline-block');
    sidebarElements.push({ elt: speedLabel });

    speedPlusBtn = createButton('+');
    styleButton(speedPlusBtn, '#444');
    speedPlusBtn.size(30, 25);
    speedPlusBtn.mousePressed(() => changeSpeed(1));
    sidebarElements.push({ elt: speedPlusBtn });

    separatorLine = createDiv('');
    separatorLine.style('height', '1px').style('background-color', '#444').style('width', '220px');
    sidebarElements.push({ elt: separatorLine });

    createSectionLabel('COLORS');

    textColorLabel = createSpan('TEXT');
    textColorLabel.style('color', '#888')
                  .style('font-size', '10px')
                  .style('font-family', '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif')
                  .style('display', 'block')
                  .style('margin-bottom', '2px');
    sidebarElements.push({ elt: textColorLabel });

    textColorPicker = createColorPicker('#ffffff');
    textColorPicker.style('width', '50px')
                   .style('height', '30px')
                   .style('border', 'none')
                   .style('padding', '0')
                   .style('cursor', 'pointer')
                   .style('border-radius', '4px');
    textColorPicker.input(() => { textLoopCheck.checked(false); loop(); });
    sidebarElements.push({ elt: textColorPicker });

    bgColorLabel = createSpan('BACKGROUND');
    bgColorLabel.style('color', '#888')
                .style('font-size', '10px')
                .style('font-family', '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif')
                .style('display', 'block')
                .style('margin-bottom', '2px');
    sidebarElements.push({ elt: bgColorLabel });

    bgColorPicker = createColorPicker('#000000');
    bgColorPicker.style('width', '50px')
                 .style('height', '30px')
                 .style('border', 'none')
                 .style('padding', '0')
                 .style('cursor', 'pointer')
                 .style('border-radius', '4px');
    bgColorPicker.input(() => { bgLoopCheck.checked(false); loop(); });
    sidebarElements.push({ elt: bgColorPicker });

    frameColorLabel = createSpan('FRAME');
    frameColorLabel.style('color', '#888')
                   .style('font-size', '10px')
                   .style('font-family', '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif')
                   .style('display', 'block')
                   .style('margin-bottom', '2px');
    sidebarElements.push({ elt: frameColorLabel });

    frameColorPicker = createColorPicker('#333333');
    frameColorPicker.style('width', '50px')
                    .style('height', '30px')
                    .style('border', 'none')
                    .style('padding', '0')
                    .style('cursor', 'pointer')
                    .style('border-radius', '4px');
    frameColorPicker.input(() => loop());
    sidebarElements.push({ elt: frameColorPicker });

    textLoopCheck = createCheckbox('Rainbow Text', true);
    textLoopCheck.style('color', '#aaa')
                 .style('font-size', '11px')
                 .style('cursor', 'pointer')
                 .style('accent-color', GOLD_COLOR)
                 .style('font-family', '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif');
    textLoopCheck.changed(() => loop());
    sidebarElements.push({ elt: textLoopCheck });

    bgLoopCheck = createCheckbox('Rainbow BG', false);
    bgLoopCheck.style('color', '#aaa')
               .style('font-size', '11px')
               .style('cursor', 'pointer')
               .style('accent-color', GOLD_COLOR)
               .style('font-family', '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif');
    bgLoopCheck.changed(() => loop());
    sidebarElements.push({ elt: bgLoopCheck });

    createSectionLabel('GEOMETRY');
    sliders.count   = new SmartSlider('Vertical Copies', 1, 50, 15);
    sliders.spacing = new SmartSlider('Vertical Spacing', 5, 150, 30);
    sliders.size    = new SmartSlider('Text Size', 0, 800, 60);

    createSectionLabel('DISTORTION');
    sliders.amp     = new SmartSlider('Wave Amplitude', 0, 300, 50);
    sliders.freq    = new SmartSlider('Wave Frequency', 1, 50, 10);
    sliders.twist   = new SmartSlider('Rotation Twist', 0, 100, 0);

    createSectionLabel('STYLE');
    sliders.weight  = new SmartSlider('Stroke Weight', 0, 20, 2);
    sliders.alpha   = new SmartSlider('Opacity', 0, 255, 255);

    createSectionLabel('MIRROR');
    mirrorMinusBtn = createButton('-');
    styleButton(mirrorMinusBtn, '#444');
    mirrorMinusBtn.size(30, 25);
    mirrorMinusBtn.mousePressed(() => { if(mirrorLevel > 0) mirrorLevel--; updateMirrorLabel(); loop(); });
    sidebarElements.push({ elt: mirrorMinusBtn });

    mirrorLabel = createSpan('OFF');
    mirrorLabel.style('color', '#fff')
               .style('font-family', '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif')
               .style('font-size', '12px')
               .style('font-weight', 'bold')
               .style('text-align', 'center')
               .style('width', '50px')
               .style('display', 'inline-block');
    sidebarElements.push({ elt: mirrorLabel });

    mirrorPlusBtn = createButton('+');
    styleButton(mirrorPlusBtn, '#444');
    mirrorPlusBtn.size(30, 25);
    mirrorPlusBtn.mousePressed(() => { if(mirrorLevel < 3) mirrorLevel++; updateMirrorLabel(); loop(); });
    sidebarElements.push({ elt: mirrorPlusBtn });

    createSectionLabel('EXPORT');
    pngSaveButton = createButton('PNG');
    styleButton(pngSaveButton, '#007AFF');
    pngSaveButton.size(80, 30);
    pngSaveButton.mousePressed(savePNG);
    sidebarElements.push({ elt: pngSaveButton });

    gifSaveButton = createButton('GIF');
    styleButton(gifSaveButton, '#FF3B30');
    gifSaveButton.size(80, 30);
    gifSaveButton.mousePressed(saveLoopGIF);
    sidebarElements.push({ elt: gifSaveButton });
}

function changeSpeed(dir) {
    speedLevel += dir;
    if(speedLevel < 0) speedLevel = 0;
    if(speedLevel > 3) speedLevel = 3;
    loopFrames = SPEEDS[speedLevel];
    speedLabel.html(SPEED_NAMES[speedLevel]);
    loop();
}

function applyCanvasSize() {
    let newWidth = parseInt(canvasWidthInput.value());
    let newHeight = parseInt(canvasHeightInput.value());

    if (isNaN(newWidth) || newWidth < 100) newWidth = 100;
    if (isNaN(newHeight) || newHeight < 100) newHeight = 100;

    canvasWidthInput.value(String(newWidth));
    canvasHeightInput.value(String(newHeight));

    animationWidth = newWidth;
    animationHeight = newHeight;
    loop();
}

function updateMirrorLabel() {
    let labels = ["OFF", "HORZ", "QUAD", "OCTA"];
    mirrorLabel.html(labels[mirrorLevel]);
}

function createSectionLabel(txt) {
    let p = createP(txt);
    p.style('color', GOLD_COLOR)
     .style('font-size', '11px')
     .style('font-weight', 'bold')
     .style('font-family', '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif')
     .style('margin', '0')
     .style('padding', '0')
     .style('letter-spacing', '1px')
     .style('white-space', 'nowrap');
    sectionLabels.push({ elt: p });
}

function updateLabels() {
    for (let key in sliders) {
      let s = sliders[key];
      s.labelDOM.html(s.name + ': ' + floor(s.val));
    }
}

// --- VISIBILITY & LAYOUT ---

function toggleEditorUI(show) {
    let displayState = show ? '' : 'none';
    if (showingStartScreen) toggleBtn.style('display', 'none');
    else toggleBtn.style('display', '');

    for (let item of sidebarElements) item.elt.style('display', displayState);
    for (let item of sectionLabels) item.elt.style('display', displayState);
    for (let item of sliderLabels) item.elt.style('display', displayState);
}

function repositionUI() {
    if (showingStartScreen) {
        let centerX = width / 2;
        let btnWidth = 160;
        let gap = 30;
        if(startButton) startButton.position(centerX - btnWidth - gap/2, height * 0.6);
        if(fsButton) fsButton.position(centerX + gap/2, height * 0.6);
        return;
    }

    toggleBtn.position(isSidebarOpen ? SIDEBAR_WIDTH - 30 : 5, 10);
    toggleBtn.size(25, 25);

    if (!isSidebarOpen) return;

    const X = 15;
    const SLIDER_W = 140;
    const LABEL_HEIGHT = 18;
    const ELEMENT_HEIGHT = 28;
    const SLIDER_ROW_HEIGHT = 24;
    const SECTION_GAP = 10;
    const ITEM_GAP = 4;

    let y = 10;

    fsToggleBtn.position(X, y);
    y += ELEMENT_HEIGHT + SECTION_GAP;

    sectionLabels[0].elt.position(X, y);
    y += LABEL_HEIGHT;
    canvasWidthInput.position(X, y);
    canvasHeightInput.position(X + 80, y);
    applyCanvasSizeBtn.position(X + 160, y);
    y += 35 + SECTION_GAP;

    sectionLabels[1].elt.position(X, y);
    y += LABEL_HEIGHT;
    textInput.position(X, y);
    y += 35 + SECTION_GAP;

    sectionLabels[2].elt.position(X, y);
    y += LABEL_HEIGHT;
    speedMinusBtn.position(X, y);
    speedLabel.position(X + 40, y + 5);
    speedPlusBtn.position(X + 110, y);
    y += ELEMENT_HEIGHT + ITEM_GAP;

    separatorLine.position(X, y);
    y += 10;

    sectionLabels[3].elt.position(X, y);
    y += LABEL_HEIGHT + 4;

    textColorLabel.position(X, y);
    y += 14;
    textColorPicker.position(X, y);

    bgColorLabel.position(X + 70, y - 14);
    bgColorPicker.position(X + 70, y);

    frameColorLabel.position(X + 140, y - 14);
    frameColorPicker.position(X + 140, y);
    y += 35;

    textLoopCheck.position(X, y);
    bgLoopCheck.position(X + 110, y);
    y += 25 + SECTION_GAP;

    sectionLabels[4].elt.position(X, y);
    y += LABEL_HEIGHT + ITEM_GAP;

    let sliderKeys = ['count', 'spacing', 'size', 'amp', 'freq', 'twist', 'weight', 'alpha'];
    let sliderIdx = 0;

    for (let i = 0; i < 3; i++) {
        let key = sliderKeys[sliderIdx];
        let s = sliders[key];
        sliderLabels[sliderIdx].elt.position(X, y);
        y += 15;
        s.x = X;
        s.y = y;
        s.w = SLIDER_W;
        s.check.position(X + SLIDER_W + 8, y - 4);
        y += SLIDER_ROW_HEIGHT;
        sliderIdx++;
    }

    y += ITEM_GAP + 2;
    sectionLabels[5].elt.position(X, y);
    y += LABEL_HEIGHT + ITEM_GAP;

    for (let i = 0; i < 3; i++) {
        let key = sliderKeys[sliderIdx];
        let s = sliders[key];
        sliderLabels[sliderIdx].elt.position(X, y);
        y += 15;
        s.x = X;
        s.y = y;
        s.w = SLIDER_W;
        s.check.position(X + SLIDER_W + 8, y - 4);
        y += SLIDER_ROW_HEIGHT;
        sliderIdx++;
    }

    y += ITEM_GAP + 2;
    sectionLabels[6].elt.position(X, y);
    y += LABEL_HEIGHT + ITEM_GAP;

    for (let i = 0; i < 2; i++) {
        let key = sliderKeys[sliderIdx];
        let s = sliders[key];
        sliderLabels[sliderIdx].elt.position(X, y);
        y += 15;
        s.x = X;
        s.y = y;
        s.w = SLIDER_W;
        s.check.position(X + SLIDER_W + 8, y - 4);
        y += SLIDER_ROW_HEIGHT;
        sliderIdx++;
    }

    y += ITEM_GAP + 2;
    sectionLabels[7].elt.position(X, y);
    y += LABEL_HEIGHT + ITEM_GAP;

    mirrorMinusBtn.position(X, y);
    mirrorLabel.position(X + 40, y + 5);
    mirrorPlusBtn.position(X + 100, y);
    y += ELEMENT_HEIGHT + SECTION_GAP;

    sectionLabels[8].elt.position(X, y);
    y += LABEL_HEIGHT;
    pngSaveButton.position(X, y);
    gifSaveButton.position(X + 90, y);
}


function draw() {
    if (fsToggleBtn) {
        let isFS = fullscreen();
        let expectedText = isFS ? 'EXIT FULLSCREEN' : 'ENTER FULLSCREEN';
        if(fsToggleBtn.html() !== expectedText) fsToggleBtn.html(expectedText);
    }

    if (showingStartScreen) {
        drawStartScreen();
    } else {
        // Only draw sidebar UI when not recording GIF
        if (isSidebarOpen && !isRecordingGIF) {
            background(MENU_BG);
            for(let key in sliders) {
                sliders[key].display();
                sliders[key].updateInteraction();
            }
        } else {
            // Reset canvas context state completely at start of each frame during recording
            if (isRecordingGIF) {
                drawingContext.setTransform(1, 0, 0, 1, 0, 0);
                drawingContext.globalAlpha = 1;
                drawingContext.globalCompositeOperation = 'source-over';
            }
            background(0);
        }

        let isAnyLoopActive = false;
        let currentFrame = isRecordingGIF ? recordingFrameCount : frameCount;
        let baseProgress = (currentFrame % loopFrames) / loopFrames;

        for (let key in sliders) {
            let s = sliders[key];
            if (s.check.checked()) {
                isAnyLoopActive = true;

                let rangeSize = s.high - s.low;
                let fullRange = s.maxGlobal - s.minGlobal;
                let rangeRatio = rangeSize / fullRange;

                let speedMultiplier = 1 / max(rangeRatio, 0.1);

                let sliderProgress = ((currentFrame * speedMultiplier) % loopFrames) / loopFrames;
                let sinVal = sin(sliderProgress * TWO_PI);

                let autoVal = map(sinVal, -1, 1, s.low, s.high);
                s.val = autoVal;
            }
        }
        if (textLoopCheck.checked() || bgLoopCheck.checked()) isAnyLoopActive = true;
        if (isAnyLoopActive) updateLabels();

        let progress = baseProgress;

        // Calculate animation area position (centered in available space)
        let sidebarOffset = (isSidebarOpen && !isRecordingGIF) ? SIDEBAR_WIDTH : 0;
        let availableW = width - sidebarOffset;
        let availableH = height;

        // Use custom animation dimensions
        let animW = animationWidth;
        let animH = animationHeight;

        // Center the animation area
        let animX = sidebarOffset + (availableW - animW) / 2;
        let animY = (availableH - animH) / 2;

        // Draw frame color (area outside animation but after sidebar)
        if (!isRecordingGIF) {
            fill(frameColorPicker.color());
            noStroke();
            rect(sidebarOffset, 0, availableW, availableH);
        }

        let finalBgColor;
        if (bgLoopCheck.checked()) {
            push(); colorMode(HSB, 360, 100, 100);
            let hue = map((progress + 0.5) % 1, 0, 1, 0, 360);
            finalBgColor = color(hue, 30, 95);
            pop();
        } else {
            finalBgColor = bgColorPicker.color();
        }

        fill(finalBgColor);
        noStroke();
        rect(animX, animY, animW, animH);

        // Use explicit save/restore for clipping to prevent state accumulation
        drawingContext.save();
        drawingContext.beginPath();
        drawingContext.rect(animX, animY, animW, animH);
        drawingContext.clip();

        push();
        translate(animX + animW/2, animY + animH/2);

        let finalTextColor;
        if (textLoopCheck.checked()) {
            push(); colorMode(HSB, 360, 100, 100);
            let hue = map(progress, 0, 1, 0, 360);
            finalTextColor = color(hue, 80, 90);
            pop();
        } else {
            finalTextColor = textColorPicker.color();
        }

        let alphaVal = sliders.alpha.val;
        let weightVal = sliders.weight.val;
        let r = red(finalTextColor), g = green(finalTextColor), b = blue(finalTextColor);

        fill(r, g, b, alphaVal);
        if (weightVal > 0) {
            stroke(r, g, b, alphaVal);
            strokeWeight(weightVal);
        } else {
            noStroke();
        }

        textSize(sliders.size.val);
        textAlign(CENTER, CENTER);

        drawDesign();
        if (mirrorLevel >= 1) { push(); scale(1, -1); drawDesign(); pop(); }
        if (mirrorLevel >= 2) {
            push(); scale(-1, 1); drawDesign(); scale(1, -1); drawDesign(); pop();
        }
        if (mirrorLevel >= 3) {
            push(); rotate(HALF_PI/2); drawDesign(); push(); scale(1,-1); drawDesign(); pop();
            push(); scale(-1,1); drawDesign(); scale(1,-1); drawDesign(); pop(); pop();
            push(); rotate(-HALF_PI/2); drawDesign(); push(); scale(1,-1); drawDesign(); pop();
            push(); scale(-1,1); drawDesign(); scale(1,-1); drawDesign(); pop(); pop();
        }

        pop();
        drawingContext.restore();

        // Increment recording frame counter during GIF export
        if (isRecordingGIF) {
            recordingFrameCount++;
        }

        // Don't stop loop while recording
        if (!isAnyLoopActive && !isRecordingGIF && frameCount > 10) noLoop();
    }
}

function drawDesign() {
  if(!textInput) return;
  let txt = textInput.value();
  let count = sliders.count.val;
  let spacing = sliders.spacing.val;
  let amp = sliders.amp.val;
  let freq = sliders.freq.val * 0.01;
  let twist = sliders.twist.val * 0.01;

  let totalHeight = (count - 1) * spacing;
  let startY = -totalHeight / 2;

  for (let i = 0; i < count; i++) {
    push();
    let yPos = startY + (i * spacing);
    let waveVal = sin(i * freq);
    let xOffset = waveVal * amp;
    let angle = waveVal * twist;
    translate(xOffset, yPos);
    rotate(angle);
    text(txt, 0, 0);
    pop();
  }
}

function styleButton(btn, col) {
    btn.style('background', col)
       .style('color', '#fff')
       .style('border', 'none')
       .style('border-radius', '4px')
       .style('cursor', 'pointer')
       .style('font-family', '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif')
       .style('font-size', '12px')
       .style('font-weight', 'bold');
}

function savePNG() {
    // Calculate animation area position
    let sidebarOffset = isSidebarOpen ? SIDEBAR_WIDTH : 0;
    let availableW = width - sidebarOffset;
    let availableH = height;
    let animX = sidebarOffset + (availableW - animationWidth) / 2;
    let animY = (availableH - animationHeight) / 2;

    let out = get(animX, animY, animationWidth, animationHeight);
    out.save('kinetic_design', 'png');
}

function saveLoopGIF() {
    isRecordingGIF = true;

    // Hide all DOM UI elements during recording
    toggleBtn.style('display', 'none');
    for (let item of sidebarElements) item.elt.style('display', 'none');
    for (let item of sectionLabels) item.elt.style('display', 'none');
    for (let item of sliderLabels) item.elt.style('display', 'none');

    // Resize canvas to match animation dimensions for GIF export
    resizeCanvas(animationWidth, animationHeight);
    pixelDensity(1); // Ensure consistent pixel density for GIF

    recordingFrameCount = 0;

    // Small delay to let canvas stabilize after resize before starting capture
    setTimeout(() => {
        loop();

        // Use frames instead of seconds for more precise control
        saveGif('kinetic_loop', loopFrames, {
            units: 'frames',
            delay: 0,
            notificationDuration: 1
        });

        // Restore UI after GIF recording completes (with generous buffer for encoding)
        // Estimate: capture time + encoding time (roughly 50ms per frame for encoding)
        let estimatedTime = (loopFrames / 60 * 1000) + (loopFrames * 50) + 3000;
        setTimeout(restoreUIAfterGIF, estimatedTime);
    }, 100);
}

function restoreUIAfterGIF() {
    isRecordingGIF = false;
    // Restore canvas to window size
    resizeCanvas(windowWidth, windowHeight);
    // Restore UI
    toggleBtn.style('display', '');
    if (isSidebarOpen) {
        for (let item of sidebarElements) item.elt.style('display', '');
        for (let item of sectionLabels) item.elt.style('display', '');
        for (let item of sliderLabels) item.elt.style('display', '');
    }
    repositionUI();
    loop();
}

function mousePressed() {
    if(!isSidebarOpen || showingStartScreen) return;
    
    let activeEl = document.activeElement;
    let targetEl = document.elementFromPoint(mouseX, mouseY);
    
    if (targetEl && (
        targetEl.tagName === 'INPUT' || 
        targetEl.tagName === 'SELECT' || 
        targetEl.tagName === 'TEXTAREA' ||
        targetEl.type === 'color'
    )) {
        return;
    }
    
    for(let key in sliders) {
        sliders[key].updateInteraction();
    }
    if(mouseX < SIDEBAR_WIDTH) return false;
}

function mouseDragged() {
    if(!isSidebarOpen || showingStartScreen) return;
    for(let key in sliders) {
        sliders[key].updateInteraction();
    }
}

function mouseReleased() {
    for(let key in sliders) {
        sliders[key].dragging = null;
    }
}

function windowResized() {
    // Don't resize during GIF recording - it would corrupt the capture
    if (isRecordingGIF) return;

    resizeCanvas(windowWidth, windowHeight);
    repositionUI();
    loop();
}

function keyPressed() {
    if (document.activeElement.tagName === 'INPUT') return;
    if (isRecordingGIF) return; // Don't allow fullscreen toggle during recording

    if (key === 'f' || key === 'F') {
        let fs = fullscreen();
        fullscreen(!fs);
    }
}
