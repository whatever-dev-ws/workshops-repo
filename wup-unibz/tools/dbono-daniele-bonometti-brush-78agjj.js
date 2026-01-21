// WUP 2025-26
// Daniele Bonometti
// Refactored for Tool Viewer Compatibility (Inline Styles)

let startButton;
let sidebar;
let sidebarToggle;
let sizeSelect; // Dropdown in sidebar
let isDrawing = false;
let waitForRelease = false;
let isFixedSize = false;
let isSidebarOpen = true;
let isSticky = false; // State for continuous drawing mode
let brushColor = '#000000'; // Default brush color
let brushSize = 50; // Default brush thickness (Allineato al 50%)
let brushAlpha = 127; // Default transparency (Allineato al 50%)
let brushType = 'Calligraphic'; // Default brush type
let isRainbowMode = false; // State for rainbow mode
let isInteractingWithSidebar = false; // Flag to track UI interaction

// --- NUOVE VARIABILI PER IL TESTO ---
let textBrushContent = "TEXT"; // Testo di default
let textInput; // Elemento UI per l'input del testo
let textRotation = 0; // Rotazione testo: 0, 90, 180, 270
let rotateTextBtn; // Pulsante per ruotare

// Variabile per l'effetto espansione setole
let bleedFactor = 0;
let lastPos = {x: 0, y: 0};
let stillTimer = 0; // Timer per tracciare da quanto tempo il mouse è fermo

// Array per gestire le "setole" del pennello principale
let bristles = [];
const BRISTLE_COUNT = 400; // Densità setole

// New Variables for Layering
let drawingLayer; // Off-screen graphics buffer for strokes (Main App)
let startLayer; // Off-screen graphics buffer for start screen background
let canvasBgColor = '#ffffff'; // Stores the current background color

// Global UI Elements (for resetting)
let bgPicker, brushPicker, rainbowCheckbox, brushTypeSelect, sizeSlider, opacitySlider, fileNameInput;

// Start Screen Animation Shapes (Now Autonomous Brushes)
let startShapes = [];

// History for Undo/Redo
let undoStack = [];
let redoStack = [];

// Constants for UI layout to help with collision detection
const SIDEBAR_WIDTH = 200;
const TOGGLE_SIZE = 40;
const TOGGLE_TOP = 10;

function setup() {
    // Set pixel density to 3 for ~300 DPI output capability
    pixelDensity(3);

    // Create a canvas that initially fills the window for the menu
    createCanvas(windowWidth, windowHeight);
    
    // Apply Global Body Styles directly to the document body
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.overflow = 'hidden';
    document.body.style.backgroundColor = '#f0f0f0';
    document.body.style.fontFamily = 'sans-serif';
    document.body.style.touchAction = 'none';

    // Initialize the drawing layers with matching density
    drawingLayer = createGraphics(windowWidth, windowHeight);
    drawingLayer.pixelDensity(3);
    drawingLayer.strokeJoin(ROUND);
    drawingLayer.strokeCap(ROUND);
    
    startLayer = createGraphics(windowWidth, windowHeight);
    startLayer.pixelDensity(3);
    startLayer.strokeJoin(ROUND);
    startLayer.strokeCap(ROUND);
    
    strokeJoin(ROUND);

    // Initialize autonomous brushes for start screen
    for (let i = 0; i < 15; i++) {
        startShapes.push(new StartScreenShape());
    }

    // Create the START button with Inline Styles
    startButton = createButton('START');
    startButton.id('start-btn');
    
    // Static Styles
    startButton.style('font-size', '18px');
    startButton.style('font-weight', 'bold');
    startButton.style('padding', '10px 30px');
    startButton.style('cursor', 'pointer');
    startButton.style('background-color', '#333');
    startButton.style('color', 'white');
    startButton.style('border', 'none');
    startButton.style('border-radius', '25px');
    startButton.style('transition', 'transform 0.1s, background-color 0.3s');
    startButton.style('font-family', 'sans-serif');
    startButton.style('z-index', '10');
    
    // Interactive States (Replacing CSS :hover/:active)
    startButton.mouseOver(() => startButton.style('background-color', '#555'));
    startButton.mouseOut(() => startButton.style('background-color', '#333'));
    startButton.mousePressed(() => {
        startButton.style('transform', 'scale(0.95)');
        enableDrawing();
    });
    startButton.mouseReleased(() => startButton.style('transform', 'scale(1)'));

    // Initialize bristles for main brush
    generateBristles();

    // Initial positioning
    repositionUI();
}

// Helper function to style generic tool buttons
function styleToolButton(btn) {
    btn.style('padding', '10px');
    btn.style('cursor', 'pointer');
    btn.style('background-color', '#555');
    btn.style('color', 'white');
    btn.style('border', 'none');
    btn.style('border-radius', '5px');
    btn.style('text-align', 'center');
    btn.style('transition', 'background 0.2s');
    btn.style('font-size', '14px');
    btn.style('width', '100%');
    btn.style('flex-shrink', '0');
    btn.style('font-family', 'sans-serif');

    // Hover effects via JS events
    btn.mouseOver(() => btn.style('background-color', '#777'));
    btn.mouseOut(() => btn.style('background-color', '#555'));
}

// --- LOGICA GENERAZIONE SETOLE FISICHE (Main Brush) ---
function generateBristles() {
    bristles = [];
    
    // Parametri forma
    let radius = brushSize / 2;
    
    for (let i = 0; i < BRISTLE_COUNT; i++) {
        let ox, oy; // Offset target
        
        if (brushType === 'Round') {
            let r = radius * sqrt(random());
            let theta = random(TWO_PI);
            ox = r * cos(theta);
            oy = r * sin(theta);
        } 
        else if (brushType === 'Square') {
            ox = random(-radius, radius);
            oy = random(-radius, radius);
        } 
        else if (brushType === 'Calligraphic') {
            ox = random(-radius * 0.1, radius * 0.1); 
            oy = random(-radius * 1.5, radius * 1.5);
        }
        else {
            // Per 'Text' o altro
            ox = 0; oy = 0;
        }

        bristles.push({
            baseTargetX: ox,
            baseTargetY: oy,
            x: ox + width/2, 
            y: oy + height/2,
            friction: random(0.1, 0.3),
            thickness: random(0.5, 2.0),
            alphaOffset: random(0.3, 1.0)
        });
    }
}


function draw() {
    if (!isDrawing) {
        drawStartScreenAnimation();
        return;
    }

    if (waitForRelease) {
        if (!mouseIsPressed) {
            waitForRelease = false;
            // Reset immediato al mouse
            for(let b of bristles) {
                b.x = mouseX + b.baseTargetX;
                b.y = mouseY + b.baseTargetY;
            }
            lastPos.x = mouseX;
            lastPos.y = mouseY;
        }
        return;
    }

    // --- RENDER COMPOSITION ---
    background(canvasBgColor);
    image(drawingLayer, 0, 0, width, height);

    // --- BRUSH DRAWING LOGIC ---
    if (mouseIsPressed || isSticky) {
        if (isInteractingWithSidebar) return;

        if (isSidebarOpen && mouseX < SIDEBAR_WIDTH) return;
        let toggleXStart = isSidebarOpen ? SIDEBAR_WIDTH : 0;
        if (mouseX >= toggleXStart && mouseX <= toggleXStart + TOGGLE_SIZE && 
            mouseY >= TOGGLE_TOP && mouseY <= TOGGLE_TOP + TOGGLE_SIZE) return;

        drawingLayer.push();
        
        let distMoved = dist(lastPos.x, lastPos.y, mouseX, mouseY);
        
        // Colore Base
        let rCol, gCol, bCol;
        if (isRainbowMode) {
            colorMode(HSB);
            let hueVal = (frameCount * 5) % 360;
            let c = color(hueVal, 90, 90);
            colorMode(RGB);
            rCol = red(c); gCol = green(c); bCol = blue(c);
        } else {
            let c = color(brushColor);
            rCol = red(c); gCol = green(c); bCol = blue(c);
        }

        // --- NUOVA LOGICA: TESTO VS INCHIOSTRO ---
        if (brushType === 'Text') {
            // Modalità TESTO
            drawingLayer.noStroke();
            drawingLayer.fill(rCol, gCol, bCol, brushAlpha);
            drawingLayer.textSize(brushSize);
            drawingLayer.textAlign(CENTER, CENTER);
            
            // Interpolazione per evitare spazi vuoti se il mouse si muove veloce
            // Spaziatura basata sulla dimensione del testo per non sovrapporre troppo
            let stepSize = max(1, brushSize * 0.3); 
            let steps = distMoved / stepSize;
            
            if (steps < 1 && distMoved > 0) steps = 1; // Disegna almeno una volta se c'è movimento

            for(let i = 0; i < steps; i++) {
                let t = (i + 1) / steps; // t va da quasi 0 a 1
                if (steps === 1) t = 1;

                let x = lerp(lastPos.x, mouseX, t);
                let y = lerp(lastPos.y, mouseY, t);
                
                // Salva lo stato, trasla, ruota se necessario, stampa testo, ripristina
                drawingLayer.push();
                drawingLayer.translate(x, y);
                // Rotazione in base all'angolo selezionato (0, 90, 180, 270)
                drawingLayer.rotate(radians(textRotation));
                drawingLayer.text(textBrushContent, 0, 0);
                drawingLayer.pop();
            }
            
            // Disegna anche se ci si muove poco per garantire feedback immediato
            if (distMoved < 1.0) {
                 drawingLayer.push();
                 drawingLayer.translate(mouseX, mouseY);
                 // Rotazione anche sul punto singolo
                 drawingLayer.rotate(radians(textRotation));
                 drawingLayer.text(textBrushContent, 0, 0);
                 drawingLayer.pop();
            }

        } else {
            // Modalità ORIGINALE (Setole / Inchiostro)
            drawingLayer.noFill();

            // --- CALCOLO ESPANSIONE (Bleed/Spreading) ---
            if (distMoved < 2.0) {
                if (stillTimer === 0) stillTimer = millis();
                if (millis() - stillTimer > 500) {
                    bleedFactor += 0.05; 
                    if (bleedFactor > 1.0) bleedFactor = 1.0; 
                }
            } else {
                stillTimer = 0;
                bleedFactor = max(0, bleedFactor - 0.1);
            }

            let spreadMultiplier = 1.0 + (bleedFactor * 1.5); 

            // Aggiorna e disegna ogni setola
            for (let b of bristles) {
                let spreadX = spreadMultiplier;
                let spreadY = spreadMultiplier;

                // Espansione laterale forte per Calligrafico
                if (brushType === 'Calligraphic') {
                    spreadX = 1.0 + (bleedFactor * 8.0);
                }

                let targetX = mouseX + (b.baseTargetX * spreadX);
                let targetY = mouseY + (b.baseTargetY * spreadY);
                
                let oldX = b.x;
                let oldY = b.y;
                
                b.x = lerp(b.x, targetX, b.friction);
                b.y = lerp(b.y, targetY, b.friction);
                
                let alphaVal = brushAlpha * b.alphaOffset;
                if (spreadMultiplier > 1.2) alphaVal *= 0.8;

                drawingLayer.stroke(rCol, gCol, bCol, alphaVal);
                drawingLayer.strokeWeight(b.thickness);
                
                drawingLayer.line(oldX, oldY, b.x, b.y);
            }
        }
        
        drawingLayer.pop();
        
        lastPos.x = mouseX;
        lastPos.y = mouseY;
    } else {
        lastPos.x = mouseX;
        lastPos.y = mouseY;
        bleedFactor = 0; 
        stillTimer = 0; 
        
        // Aggiorna posizione setole anche quando non si disegna
        if (brushType !== 'Text') {
            for(let b of bristles) {
                b.x = lerp(b.x, mouseX + b.baseTargetX, 0.2);
                b.y = lerp(b.y, mouseY + b.baseTargetY, 0.2);
            }
        }
    }
}


// P5 Event: Called when a mouse button is pressed
function mousePressed() {
    // Check for UI collision
    if (isSidebarOpen && mouseX < SIDEBAR_WIDTH) {
        isInteractingWithSidebar = true;
        return;
    }
    
    let toggleXStart = isSidebarOpen ? SIDEBAR_WIDTH : 0;
    if (mouseX >= toggleXStart && mouseX <= toggleXStart + TOGGLE_SIZE && 
        mouseY >= TOGGLE_TOP && mouseY <= TOGGLE_TOP + TOGGLE_SIZE) {
        isInteractingWithSidebar = true;
        return;
    }

    if (isSticky) {
        isSticky = false;
        isSticky = false;
        return;
    }

    if (isDrawing) {
        saveState();
        lastPos.x = mouseX;
        lastPos.y = mouseY;
        bleedFactor = 0;
        stillTimer = 0;
        
        // Reset immediato setole al click
        if (brushType !== 'Text') {
            for(let b of bristles) {
                b.x = mouseX + b.baseTargetX;
                b.y = mouseY + b.baseTargetY;
            }
        }
    }
}

function mouseReleased() {
    isInteractingWithSidebar = false;
    bleedFactor = 0;
    stillTimer = 0;
}

function doubleClicked() {
    if (isDrawing && mouseButton === LEFT) {
        if (isSidebarOpen && mouseX < SIDEBAR_WIDTH) return;
        let toggleXStart = isSidebarOpen ? SIDEBAR_WIDTH : 0;
        if (mouseX >= toggleXStart && mouseX <= toggleXStart + TOGGLE_SIZE && 
            mouseY >= TOGGLE_TOP && mouseY <= TOGGLE_TOP + TOGGLE_SIZE) return;
        
        isSticky = true;
    }
}

// --- Undo / Redo Logic ---

function saveState() {
    let currentState = {
        image: drawingLayer.get(),
        bgColor: canvasBgColor,
        tools: {
            color: brushColor,
            size: brushSize,
            alpha: brushAlpha,
            type: brushType,
            rainbow: isRainbowMode,
            sticky: isSticky,
            textContent: textBrushContent, // Salva anche il testo corrente
            rotation: textRotation // Salva l'angolo di rotazione
        }
    };
    undoStack.push(currentState);
    redoStack = [];
    if (undoStack.length > 10) undoStack.shift();
}

function restoreState(state) {
    if (!state) return;
    drawingLayer.clear();
    drawingLayer.image(state.image, 0, 0, drawingLayer.width, drawingLayer.height);
    canvasBgColor = state.bgColor;
    brushColor = state.tools.color;
    brushSize = state.tools.size;
    brushAlpha = state.tools.alpha;
    brushType = state.tools.type || 'Calligraphic';
    isRainbowMode = state.tools.rainbow;
    isSticky = state.tools.sticky;
    textBrushContent = state.tools.textContent || "TEXT";
    textRotation = state.tools.rotation || 0;
    
    generateBristles();
    updateUI();
}

function updateUI() {
    if(brushPicker) brushPicker.value(brushColor);
    if(sizeSlider) sizeSlider.value(brushSize);
    if(opacitySlider) opacitySlider.value(brushAlpha);
    if(brushTypeSelect) {
        brushTypeSelect.selected(brushType);
        // Aggiorna visibilità input testo e pulsante rotazione
        if(brushType === 'Text') {
            if(textInput) textInput.style('display', 'block');
            if(rotateTextBtn) {
                rotateTextBtn.style('display', 'block');
                rotateTextBtn.html(`Rotate: ${textRotation}°`);
            }
        } else {
            if(textInput) textInput.style('display', 'none');
            if(rotateTextBtn) rotateTextBtn.style('display', 'none');
        }
    }
    if(rainbowCheckbox) rainbowCheckbox.checked(isRainbowMode);
    if(bgPicker) bgPicker.value(canvasBgColor);
    if(fileNameInput) fileNameInput.value('myDrawing'); 
    if(textInput) textInput.value(textBrushContent);
    // Il pulsante si aggiorna automaticamente nella logica sopra
}

function handleUndo() {
    if (undoStack.length > 0) {
        let currentState = {
            image: drawingLayer.get(),
            bgColor: canvasBgColor,
            tools: {
                color: brushColor,
                size: brushSize,
                alpha: brushAlpha,
                type: brushType,
                rainbow: isRainbowMode,
                sticky: isSticky,
                textContent: textBrushContent,
                rotation: textRotation
            }
        };
        redoStack.push(currentState);
        let prevState = undoStack.pop();
        restoreState(prevState);
    }
}

function handleRedo() {
    if (redoStack.length > 0) {
        let currentState = {
            image: drawingLayer.get(),
            bgColor: canvasBgColor,
            tools: {
                color: brushColor,
                size: brushSize,
                alpha: brushAlpha,
                type: brushType,
                rainbow: isRainbowMode,
                sticky: isSticky,
                textContent: textBrushContent,
                rotation: textRotation
            }
        };
        undoStack.push(currentState);
        let nextState = redoStack.pop();
        restoreState(nextState);
    }
}

function resetDefaults() {
    brushColor = '#000000';
    brushSize = 50;            
    brushAlpha = 127;        
    brushType = 'Calligraphic';
    isRainbowMode = false; 
    isSticky = false;        
    canvasBgColor = '#ffffff';
    textBrushContent = "TEXT";
    textRotation = 0;
    
    if(brushPicker) brushPicker.value('#000000');
    if(sizeSlider) sizeSlider.value(50);              
    if(opacitySlider) opacitySlider.value(127);       
    if(brushTypeSelect) brushTypeSelect.selected('Calligraphic');
    if(rainbowCheckbox) rainbowCheckbox.checked(false);
    if(bgPicker) bgPicker.value('#ffffff'); 
    if(textInput) {
        textInput.value("TEXT");
        textInput.style('display', 'none'); 
    }
    if(rotateTextBtn) {
        rotateTextBtn.html('Rotate: 0°');
        rotateTextBtn.style('display', 'none');
    }
    
    generateBristles();
    updateUI();
}

// --- Start Screen Logic ---

function drawStartScreenAnimation() {
    // 2. Render the startLayer to the main canvas
    // We removed the fading logic to keep strokes persistent
    background(240);
    image(startLayer, 0, 0);
    
    // 3. Update and draw autonomous brushes
    for(let s of startShapes) {
        s.update();
        s.display();
    }
    
    // UI Background (Re-added)
    fill(255, 255, 255, 220);
    noStroke();
    rectMode(CENTER);
    rect(width/2, height/2 - 40, 650, 80, 10);
    
    // UI Text
    fill(50);
    noStroke(); 
    textAlign(CENTER, CENTER);
    textSize(24);
    textFont('sans-serif');
    text("To draw, press start and hold the left mouse button", width / 2, height / 2 - 40);
}

function repositionUI() {
    let centerX = width / 2;
    let centerY = height / 2;
    startButton.position(centerX - 50, centerY + 20);
}

function enableDrawing() {
    startButton.hide();
    isFixedSize = false;
    resizeCanvas(windowWidth, windowHeight);
    
    // Reinit drawing layer for clean start
    drawingLayer = createGraphics(windowWidth, windowHeight);
    drawingLayer.pixelDensity(3);
    drawingLayer.strokeJoin(ROUND);
    drawingLayer.strokeCap(ROUND);
    
    styleCanvasFull();

    isDrawing = true;
    waitForRelease = true;
    createSidebarUI();
    background(255);
    cursor(CROSS);
}

function createSidebarUI() {
    sidebar = createDiv();
    sidebar.id('sidebar');
    
    // Inline CSS for Sidebar
    sidebar.style('position', 'fixed');
    sidebar.style('left', '0');
    sidebar.style('top', '0');
    sidebar.style('width', '200px');
    sidebar.style('height', '100vh');
    sidebar.style('background-color', '#333');
    sidebar.style('color', 'white');
    sidebar.style('box-shadow', '2px 0 5px rgba(0,0,0,0.2)');
    sidebar.style('transition', 'transform 0.3s ease');
    sidebar.style('z-index', '100');
    sidebar.style('overflow', 'visible');
    
    // Set initial state
    if(isSidebarOpen) {
        sidebar.style('transform', 'translateX(0)');
    } else {
        sidebar.style('transform', 'translateX(-200px)');
    }
    
    sidebarToggle = createButton(isSidebarOpen ? '◄' : '►');
    sidebarToggle.id('sidebar-toggle');
    sidebarToggle.parent(sidebar);
    
    // Inline CSS for Toggle Button
    sidebarToggle.style('position', 'absolute');
    sidebarToggle.style('right', '-40px');
    sidebarToggle.style('top', '10px');
    sidebarToggle.style('width', '40px');
    sidebarToggle.style('height', '40px');
    sidebarToggle.style('background-color', '#333');
    sidebarToggle.style('color', 'white');
    sidebarToggle.style('border', 'none');
    sidebarToggle.style('border-radius', '0 5px 5px 0');
    sidebarToggle.style('cursor', 'pointer');
    sidebarToggle.style('font-size', '20px');
    sidebarToggle.style('display', 'flex');
    sidebarToggle.style('align-items', 'center');
    sidebarToggle.style('justify-content', 'center');
    sidebarToggle.style('box-shadow', '2px 2px 5px rgba(0,0,0,0.2)');
    sidebarToggle.style('z-index', '101');
    
    sidebarToggle.mousePressed(toggleSidebar);

    let content = createDiv();
    content.id('sidebar-content');
    content.parent(sidebar);
    
    // Inline CSS for Content Container
    content.style('height', '100%');
    content.style('width', '100%');
    content.style('overflow-y', 'auto');
    content.style('padding', '20px');
    content.style('box-sizing', 'border-box');
    content.style('display', 'flex');
    content.style('flex-direction', 'column');
    content.style('gap', '15px');
    content.style('font-family', 'sans-serif');

    let title = createElement('h2', 'Tools');
    title.parent(content);
    title.style('margin', '0 0 10px 0');
    title.style('font-size', '18px');
    title.style('border-bottom', '1px solid #555');
    title.style('padding-bottom', '10px');
    title.style('flex-shrink', '0');

    let instructionBtn = createButton('Instruction');
    styleToolButton(instructionBtn); // Apply inline styles helper
    instructionBtn.parent(content);
    
    let infoText = createP('- Double click the left mouse button to activate continuous drawing.<br>- Click once to stop continuous drawing.<br>- Hold without move to spread the ink.');
    infoText.parent(content);
    infoText.style('color', '#fff');
    infoText.style('font-size', '12px');
    infoText.style('margin', '5px 0');
    infoText.style('text-align', 'left'); // Added alignment
    infoText.style('line-height', '1.4'); // Added line height for readability
    infoText.style('display', 'none'); 
    
    instructionBtn.mousePressed(() => {
        let currentDisplay = infoText.style('display');
        infoText.style('display', currentDisplay === 'none' ? 'block' : 'none');
    });

    let undoRedoContainer = createDiv();
    undoRedoContainer.parent(content);
    undoRedoContainer.style('display', 'flex');
    undoRedoContainer.style('gap', '10px');
    undoRedoContainer.style('width', '100%');
    undoRedoContainer.style('flex-shrink', '0');

    let undoBtn = createButton('Undo');
    styleToolButton(undoBtn);
    undoBtn.style('width', 'auto');
    undoBtn.style('flex-grow', '1');
    undoBtn.parent(undoRedoContainer);
    undoBtn.mousePressed(handleUndo);

    let redoBtn = createButton('Redo');
    styleToolButton(redoBtn);
    redoBtn.style('width', 'auto');
    redoBtn.style('flex-grow', '1');
    redoBtn.parent(undoRedoContainer);
    redoBtn.mousePressed(handleRedo);


    // -- MENU: Canvas Size --
    let sizeBtn = createButton('Canvas size');
    styleToolButton(sizeBtn);
    sizeBtn.style('margin-top', '15px');
    sizeBtn.parent(content);

    let sizeMenu = createDiv();
    sizeMenu.parent(content);
    sizeMenu.style('display', 'none');
    sizeMenu.style('margin-top', '5px');
    sizeMenu.style('padding-left', '10px');
    sizeMenu.style('border-left', '2px solid #03A9F4');

    sizeBtn.mousePressed(() => {
        let currentDisplay = sizeMenu.style('display');
        sizeMenu.style('display', currentDisplay === 'none' ? 'block' : 'none');
    });

    let sizeLabel = createElement('label', 'Select size:');
    sizeLabel.parent(sizeMenu);
    sizeLabel.style('font-size', '12px');
    sizeLabel.style('color', '#ccc');
    sizeLabel.style('margin-bottom', '5px');
    sizeLabel.style('display', 'block');

    sizeSelect = createSelect();
    sizeSelect.parent(sizeMenu);
    sizeSelect.option('Full window');
    sizeSelect.option('16:9');
    sizeSelect.option('4:3');
    sizeSelect.option('3:2');
    sizeSelect.option('1:1');
    sizeSelect.style('width', '100%');
    sizeSelect.style('padding', '8px');
    sizeSelect.style('border-radius', '5px');
    sizeSelect.style('background', 'white');
    sizeSelect.style('border', 'none');
    sizeSelect.changed(() => {
        handleSizeChange();
        sizeMenu.style('display', 'none');
    });


    // -- MENU: Colours --
    let colorBtn = createButton('Colours');
    styleToolButton(colorBtn);
    colorBtn.style('margin-top', '15px');
    colorBtn.parent(content);

    let colorMenu = createDiv();
    colorMenu.parent(content);
    colorMenu.style('display', 'none');
    colorMenu.style('margin-top', '5px');
    colorMenu.style('padding-left', '10px');
    colorMenu.style('border-left', '2px solid #03A9F4');

    colorBtn.mousePressed(() => {
        let currentDisplay = colorMenu.style('display');
        colorMenu.style('display', currentDisplay === 'none' ? 'block' : 'none');
    });

    let canvasColorLabel = createElement('label', 'Canvas color:');
    canvasColorLabel.parent(colorMenu);
    canvasColorLabel.style('font-size', '12px');
    canvasColorLabel.style('color', '#ccc');
    canvasColorLabel.style('margin-bottom', '5px');
    canvasColorLabel.style('display', 'block');
    
    bgPicker = createColorPicker('#ffffff');
    bgPicker.parent(colorMenu);
    bgPicker.style('width', '100%');
    bgPicker.style('height', '35px');
    bgPicker.style('border', 'none');
    bgPicker.style('background', 'transparent');
    bgPicker.style('padding', '0');
    bgPicker.style('cursor', 'pointer');
    bgPicker.mousePressed(saveState); 
    bgPicker.input(() => {
        canvasBgColor = bgPicker.value();
    });

    let brushColorLabel = createElement('label', 'Brush color:');
    brushColorLabel.parent(colorMenu);
    brushColorLabel.style('margin-top', '10px');
    brushColorLabel.style('font-size', '12px');
    brushColorLabel.style('color', '#ccc');
    brushColorLabel.style('display', 'block');

    brushPicker = createColorPicker('#000000');
    brushPicker.parent(colorMenu);
    brushPicker.style('width', '100%');
    brushPicker.style('height', '35px');
    brushPicker.style('border', 'none');
    brushPicker.style('background', 'transparent');
    brushPicker.style('padding', '0');
    brushPicker.style('cursor', 'pointer');
    brushPicker.mousePressed(saveState); 
    brushPicker.input(() => {
        brushColor = brushPicker.value();
    });

    rainbowCheckbox = createCheckbox(' Rainbow mode', false);
    rainbowCheckbox.parent(colorMenu);
    rainbowCheckbox.style('margin-top', '10px');
    rainbowCheckbox.style('color', '#ccc');
    rainbowCheckbox.style('font-size', '12px');
    rainbowCheckbox.style('display', 'block');
    rainbowCheckbox.mousePressed(saveState); 
    rainbowCheckbox.changed(() => {
        isRainbowMode = rainbowCheckbox.checked();
    });


    // -- MENU: Brush Settings --
    let brushSettingsBtn = createButton('Brush Settings');
    styleToolButton(brushSettingsBtn);
    brushSettingsBtn.style('margin-top', '15px');
    brushSettingsBtn.parent(content);

    let brushSettingsDiv = createDiv();
    brushSettingsDiv.parent(content);
    brushSettingsDiv.style('display', 'none');
    brushSettingsDiv.style('margin-top', '5px');
    brushSettingsDiv.style('padding-left', '10px');
    brushSettingsDiv.style('border-left', '2px solid #03A9F4');

    brushSettingsBtn.mousePressed(() => {
        let currentDisplay = brushSettingsDiv.style('display');
        brushSettingsDiv.style('display', currentDisplay === 'none' ? 'block' : 'none');
    });

    // Brush Tip Select
    let bTypeLabel = createElement('label', 'Brush type:');
    bTypeLabel.parent(brushSettingsDiv);
    bTypeLabel.style('font-size', '12px');
    bTypeLabel.style('color', '#ccc');
    bTypeLabel.style('margin-bottom', '5px');
    bTypeLabel.style('display', 'block');
    
    brushTypeSelect = createSelect();
    brushTypeSelect.parent(brushSettingsDiv);
    brushTypeSelect.option('Calligraphic');
    brushTypeSelect.option('Round');
    brushTypeSelect.option('Square');
    brushTypeSelect.option('Text'); // NUOVA OPZIONE
    brushTypeSelect.style('width', '100%');
    brushTypeSelect.style('padding', '8px');
    brushTypeSelect.style('border-radius', '5px');
    brushTypeSelect.style('border', 'none');
    brushTypeSelect.mousePressed(saveState); 
    brushTypeSelect.changed(() => {
        brushType = brushTypeSelect.value();
        
        // Toggle Text Input Visibility
        if(brushType === 'Text') {
            textInput.style('display', 'block');
            rotateTextBtn.style('display', 'block');
        } else {
            textInput.style('display', 'none');
            rotateTextBtn.style('display', 'none');
        }
        
        generateBristles(); // Update bristles when shape changes
    });

    // --- NUOVO INPUT TESTO (Textarea per multilinea) ---
    textInput = createElement('textarea', 'TEXT');
    textInput.parent(brushSettingsDiv);
    textInput.style('margin-top', '5px');
    textInput.style('display', 'none'); // Hidden by default
    textInput.style('width', '100%'); // Changed to 100% to match select
    textInput.style('height', '60px');
    textInput.style('resize', 'vertical'); 
    textInput.style('box-sizing', 'border-box');
    textInput.style('font-family', 'sans-serif');
    textInput.style('padding', '5px');
    textInput.style('border-radius', '5px');
    textInput.style('border', 'none');
    textInput.input(() => {
        textBrushContent = textInput.value();
    });

    // Button for Rotating Text
    rotateTextBtn = createButton('Rotate: 0°'); // Initial text with degrees
    styleToolButton(rotateTextBtn);
    rotateTextBtn.parent(brushSettingsDiv);
    rotateTextBtn.style('margin-top', '5px');
    rotateTextBtn.style('font-size', '12px');
    rotateTextBtn.style('display', 'none');
    rotateTextBtn.mousePressed(() => {
        // Incrementa di 90 gradi, modulo 360 per tornare a 0
        textRotation = (textRotation + 90) % 360;
        rotateTextBtn.html(`Rotate: ${textRotation}°`); // Update with degrees
    });

    // Thickness Slider
    let bSizeLabel = createElement('label', 'Thickness / Size:');
    bSizeLabel.parent(brushSettingsDiv);
    bSizeLabel.style('margin-top', '10px');
    bSizeLabel.style('font-size', '12px');
    bSizeLabel.style('color', '#ccc');
    bSizeLabel.style('display', 'block');

    sizeSlider = createSlider(1, 100, 50); 
    sizeSlider.parent(brushSettingsDiv);
    sizeSlider.style('width', '100%');
    sizeSlider.style('cursor', 'pointer');
    sizeSlider.mousePressed(saveState); 
    sizeSlider.input(() => {
        brushSize = sizeSlider.value();
        generateBristles(); 
    });

    // Opacity Slider
    let bOpacityLabel = createElement('label', 'Opacity:');
    bOpacityLabel.parent(brushSettingsDiv);
    bOpacityLabel.style('margin-top', '10px');
    bOpacityLabel.style('font-size', '12px');
    bOpacityLabel.style('color', '#ccc');
    bOpacityLabel.style('display', 'block');

    opacitySlider = createSlider(0, 255, 127); 
    opacitySlider.parent(brushSettingsDiv);
    opacitySlider.style('width', '100%');
    opacitySlider.style('cursor', 'pointer');
    opacitySlider.mousePressed(saveState); 
    opacitySlider.input(() => {
        brushAlpha = opacitySlider.value();
    });

    // -- MENU: Save As --
    let saveBtn = createButton('Save as');
    styleToolButton(saveBtn);
    saveBtn.style('margin-top', 'auto'); 
    saveBtn.parent(content);

    let saveMenu = createDiv();
    saveMenu.parent(content);
    saveMenu.style('display', 'none');
    saveMenu.style('margin-top', '5px');
    saveMenu.style('padding-left', '10px');
    saveMenu.style('border-left', '2px solid #4CAF50');

    saveBtn.mousePressed(() => {
        let currentDisplay = saveMenu.style('display');
        saveMenu.style('display', currentDisplay === 'none' ? 'block' : 'none');
    });

    let fileNameLabel = createElement('label', 'File name:');
    fileNameLabel.parent(saveMenu);
    fileNameLabel.style('color', '#ccc');
    fileNameLabel.style('font-size', '12px');
    fileNameLabel.style('margin-bottom', '5px');
    fileNameLabel.style('display', 'block');
    
    fileNameInput = createInput('myDrawing');
    fileNameInput.parent(saveMenu);
    fileNameInput.style('margin-bottom', '10px');
    fileNameInput.style('padding', '8px');
    fileNameInput.style('border-radius', '5px');
    fileNameInput.style('width', '100%');
    fileNameInput.style('border', 'none');
    fileNameInput.style('box-sizing', 'border-box');

    let jpgBtn = createButton('JPG');
    styleToolButton(jpgBtn);
    jpgBtn.parent(saveMenu);
    jpgBtn.mousePressed(() => {
        let fn = fileNameInput.value() || 'myDrawing';
        saveCanvas(fn, 'jpg');
        saveMenu.style('display', 'none');
    });

    let pngBtn = createButton('PNG');
    styleToolButton(pngBtn);
    pngBtn.style('margin-top', '5px');
    pngBtn.parent(saveMenu);
    
    let pngOptionsDiv = createDiv();
    pngOptionsDiv.parent(saveMenu);
    pngOptionsDiv.style('display', 'none');
    pngOptionsDiv.style('padding-left', '10px');
    pngOptionsDiv.style('margin-top', '5px');
    pngOptionsDiv.style('border-left', '1px solid #4CAF50');

    pngBtn.mousePressed(() => {
        let currentDisplay = pngOptionsDiv.style('display');
        pngOptionsDiv.style('display', currentDisplay === 'none' ? 'block' : 'none');
    });

    let pngWithBgBtn = createButton('With background');
    styleToolButton(pngWithBgBtn);
    pngWithBgBtn.style('font-size', '12px');
    pngWithBgBtn.parent(pngOptionsDiv);
    pngWithBgBtn.mousePressed(() => {
        let fn = fileNameInput.value() || 'myDrawing';
        saveCanvas(fn, 'png');
        pngOptionsDiv.style('display', 'none'); 
        saveMenu.style('display', 'none'); 
    });

    let pngTranspBtn = createButton('Without background');
    styleToolButton(pngTranspBtn);
    pngTranspBtn.style('font-size', '12px');
    pngTranspBtn.style('margin-top', '5px');
    pngTranspBtn.parent(pngOptionsDiv);
    pngTranspBtn.mousePressed(() => {
        let fn = fileNameInput.value() || 'myDrawing';
        save(drawingLayer, fn + '.png');
        pngOptionsDiv.style('display', 'none'); 
        saveMenu.style('display', 'none'); 
    });

    // -- MENU: Options --
    let optionsBtn = createButton('Options');
    styleToolButton(optionsBtn);
    optionsBtn.style('margin-top', '10px'); 
    optionsBtn.parent(content);

    let optionsMenu = createDiv();
    optionsMenu.parent(content);
    optionsMenu.style('display', 'none');
    optionsMenu.style('margin-top', '5px');
    optionsMenu.style('padding-left', '10px');
    optionsMenu.style('border-left', '2px solid #F44336');

    optionsBtn.mousePressed(() => {
        let currentDisplay = optionsMenu.style('display');
        optionsMenu.style('display', currentDisplay === 'none' ? 'block' : 'none');
    });

    let resetBtn = createButton('Reset as defaults');
    styleToolButton(resetBtn);
    resetBtn.parent(optionsMenu);
    resetBtn.mousePressed(() => {
        saveState(); 
        resetDefaults();
        optionsMenu.style('display', 'none');
    });

    let clearBtn = createButton('New canvas');
    styleToolButton(clearBtn);
    clearBtn.style('margin-top', '10px');
    clearBtn.parent(optionsMenu);
    clearBtn.mousePressed(() => {
        saveState(); 
        drawingLayer.clear();
        brushColor = '#000000';
        brushSize = 50;            
        brushAlpha = 127;        
        brushType = 'Calligraphic';
        isRainbowMode = false; 
        isSticky = false;        
        canvasBgColor = '#ffffff';
        generateBristles(); // Reset bristles
        updateUI(); 
        optionsMenu.style('display', 'none');
    });
}

function handleSizeChange() {
    let val = sizeSelect.value();
    let currentDrawing = drawingLayer.get();
    undoStack = [];
    redoStack = [];

    let w, h;
    if (val === 'Full window') {
        isFixedSize = false;
        resizeCanvas(windowWidth, windowHeight);
        w = windowWidth;
        h = windowHeight;
        styleCanvasFull();
    } else {
        isFixedSize = true;
        w = 800; h = 600;
        if (val === '16:9') { w = 960; h = 540; }
        else if (val === '4:3') { w = 800; h = 600; }
        else if (val === '3:2') { w = 900; h = 600; }
        else if (val.includes('1:1')) { w = 600; h = 600; }

        resizeCanvas(w, h);
        styleCanvasFixed();
    }
    
    // Resize layers
    drawingLayer = createGraphics(w, h);
    drawingLayer.pixelDensity(3);
    drawingLayer.strokeJoin(ROUND);
    drawingLayer.strokeCap(ROUND);
    
    startLayer = createGraphics(w, h); // Resize start layer too
    startLayer.pixelDensity(3);
    startLayer.strokeJoin(ROUND);
    startLayer.strokeCap(ROUND);
    
    drawingLayer.image(currentDrawing, 0, 0, w, h);
    saveState();
}

function styleCanvasFull() {
    let cnv = select('canvas');
    if (cnv) {
        cnv.style('position', 'absolute');
        cnv.style('top', '0');
        cnv.style('left', '0');
        cnv.style('transform', 'none');
        cnv.style('box-shadow', 'none');
        cnv.style('border', 'none');
    }
}

function styleCanvasFixed() {
    let cnv = select('canvas');
    if (cnv) {
        cnv.style('position', 'absolute');
        cnv.style('left', '50%');
        cnv.style('top', '50%');
        cnv.style('transform', 'translate(-50%, -50%)');
        cnv.style('box-shadow', '0 0 20px rgba(0,0,0,0.1)');
        cnv.style('border', '1px solid #ddd');
    }
}

function toggleSidebar() {
    isSidebarOpen = !isSidebarOpen;
    // Logic driven style change instead of Class toggling
    if (isSidebarOpen) {
        sidebar.style('transform', 'translateX(0)');
        sidebarToggle.html('◄');
    } else {
        sidebar.style('transform', 'translateX(-200px)');
        sidebarToggle.html('►');
    }
    waitForRelease = true;
}

function windowResized() {
    if (!isDrawing || (isDrawing && !isFixedSize)) {
        resizeCanvas(windowWidth, windowHeight);
        
        drawingLayer = createGraphics(windowWidth, windowHeight);
        drawingLayer.pixelDensity(3);
        drawingLayer.strokeJoin(ROUND);
        drawingLayer.strokeCap(ROUND);
        
        startLayer = createGraphics(windowWidth, windowHeight);
        startLayer.pixelDensity(3);
        startLayer.strokeJoin(ROUND);
        startLayer.strokeCap(ROUND);
        
        if (!isDrawing) {
            repositionUI();
        } else {
            background(255);
            undoStack = [];
            redoStack = [];
        }
    }
}

class StartScreenShape {
    constructor() {
        this.init();
    }
    
    init() {
        this.x = random(width);
        this.y = random(height);
        this.tx = random(1000); 
        this.ty = random(1000);
        
        // Mix random colors with black
        if (random() < 0.25) { 
            this.myColor = color(0, 0, 0); // Black
        } else {
            this.myColor = color(random(255), random(255), random(255));
        }
        
        this.mySize = random(20, 60);
        let types = ['Calligraphic', 'Round', 'Square'];
        this.myType = random(types);
        
        this.myBristles = [];
        let bristleCount = 50; 
        let radius = this.mySize / 2;
        
        for (let i = 0; i < bristleCount; i++) {
            let ox, oy;
            if (this.myType === 'Round') {
                let r = radius * sqrt(random());
                let theta = random(TWO_PI);
                ox = r * cos(theta);
                oy = r * sin(theta);
            } else if (this.myType === 'Square') {
                ox = random(-radius, radius);
                oy = random(-radius, radius);
            } else { // Calligraphic
                ox = random(-radius * 0.1, radius * 0.1); 
                oy = random(-radius * 1.5, radius * 1.5);
            }
            
            this.myBristles.push({
                baseX: ox,
                baseY: oy,
                x: ox, y: oy, // Relative pos
                friction: random(0.1, 0.3),
                thickness: random(0.5, 1.5),
                alphaOffset: random(0.5, 1.0)
            });
        }
        
        this.prevX = this.x;
        this.prevY = this.y;
    }
    
    update() {
        this.prevX = this.x;
        this.prevY = this.y;
        
        let nx = map(noise(this.tx), 0, 1, -3, 3);
        let ny = map(noise(this.ty), 0, 1, -3, 3);
        
        this.x += nx;
        this.y += ny;
        
        this.tx += 0.01;
        this.ty += 0.01;
        
        if (this.x < -100) { this.x = width + 100; this.prevX = this.x; }
        if (this.x > width + 100) { this.x = -100; this.prevX = this.x; }
        if (this.y < -100) { this.y = height + 100; this.prevY = this.y; }
        if (this.y > height + 100) { this.y = -100; this.prevY = this.y; }
    }
    
    display() {
        startLayer.noFill();
        let r = red(this.myColor);
        let g = green(this.myColor);
        let b = blue(this.myColor);
        
        for (let br of this.myBristles) {
            let targetX = this.x + br.baseX;
            let targetY = this.y + br.baseY;
            
            br.x = lerp(br.x, br.baseX, 0.1); 
            br.y = lerp(br.y, br.baseY, 0.1);
            
            // Disegna - OPAQUE (Massima visibilità)
            startLayer.stroke(r, g, b, 255); // Alpha 255 (Full opacity)
            startLayer.strokeWeight(br.thickness);
            startLayer.line(this.prevX + br.baseX, this.prevY + br.baseY, targetX, targetY);
        }
    }
}