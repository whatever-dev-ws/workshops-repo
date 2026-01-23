// WUP 25-26
// Andrea Ghirardi

// ============================================================================
// KINETIC TYPE
// ============================================================================
// A tool for creating kinetic typography with 3D effects, supporting sphere, cylinder, and fibonacci spiral shapes with customizable text and animations.
// ============================================================================

// --- CORE VARIABLES ---
// Main text content and size
let inputText = "Hello world";  // Text to be displayed on 3D shapes
let text_size = 72;              // Base font size in pixels

// --- TYPOGRAPHY VARIABLES ---
// Controls for text appearance and spacing
let text_leading = 1.0;   // Line height multiplier
let h_scale = 1.0;        // Horizontal scale factor
let v_scale = 1.0;        // Vertical scale factor

// --- FONT MANAGEMENT ---
// Stores loaded fonts for use in WEBGL (system fonts don't work in WEBGL)
let font_name = 'Source Code Pro';  // Currently selected font name
let customFont;          // Source Code Pro (default)
let arialFont;           // Arial alternative (Roboto)
let timesFont;           // Times New Roman alternative
let courierFont;         // Courier New alternative
let userUploadedFont;    // User's custom uploaded font
let userFontName = null; // Name of user's uploaded font

// --- 3D SHAPE & TEXTURE VARIABLES ---
// Controls for 3D rendering and texture mapping
let currentShape = 'SPHERE';      // Current 3D shape: 'SPHERE', 'CYLINDER', or 'FIBONACCI'
let textTexture;                  // Graphics buffer for text texture (2048x2048)
let currentTextColor = '#000000'; // Color of the text
let currentTextureAlpha = 255;    // Opacity of texture (0-255)
let currentSphereSize = 200;      // Radius of sphere
let cylinderRadius = 100;         // Radius of cylinder
let cylinderHeight = 300;         // Height of cylinder
const detail = 60;                // Tessellation detail for 3D shapes

// --- GENERAL SETTINGS ---
let backgroundColor = '#FFFFFF';  // Canvas background color

// --- ROTATION CONTROLS ---
// Manual and automatic rotation settings
let totalRotationX = 0;       // Accumulated X-axis rotation from mouse drag
let totalRotationY = 0;       // Accumulated Y-axis rotation from mouse drag
let autoRotationY = 0;        // Current automatic Y-axis rotation
let autoRotationSpeed = 0.2;  // Speed of automatic rotation (can be negative)
let isRotationPaused = false; // Whether automatic rotation is paused

// --- FIBONACCI SPIRAL VARIABLES ---
// Parameters for the fibonacci spiral shape
const PHI = 1.6180339887;  // Golden ratio constant
let startRadius = 0.5;     // Starting radius of spiral
let angleStep = 8;         // Angular distance between elements
let scaleFactor = 0.15;    // How fast the spiral expands
let maxZHeight = 200;      // Maximum Z-depth of spiral
let numElements = 150;     // Number of text elements in spiral
let minSize = 10;          // Minimum text size in spiral
let maxSize = 40;          // Maximum text size in spiral
let showDots = false;      // Show blue reference dots (debug feature)
let dynamicRotation = 0;   // Accumulated rotation for spiral animation

// --- REPETITION & PATTERN VARIABLES ---
// Controls for text repetition in texture
let repeatX = 2;              // Number of horizontal repetitions
let repeatY = 5;              // Number of vertical repetitions
let patternSpacingX = 1.0;    // Horizontal spacing multiplier between repetitions
let patternSpacingY = 1.0;    // Vertical spacing multiplier between repetitions

// --- INITIAL VALUES FOR RESET ---
// Default values for all parameters (currently not used, reset function removed)
const INITIAL_VALUES = {
    inputText: "GREAT TOOL",
    text_size: 72,
    text_leading: 1.0,
    h_scale: 1.0,
    v_scale: 1.0,
    font_name: 'Source Code Pro',
    currentShape: 'SPHERE',
    currentTextColor: '#000000',
    currentTextureAlpha: 255,
    currentSphereSize: 200,
    cylinderRadius: 100,
    cylinderHeight: 300,
    backgroundColor: '#FFFFFF',
    totalRotationX: 0,
    totalRotationY: 0,
    autoRotationY: 0,
    autoRotationSpeed: 0.2,
    angleStep: 8,
    scaleFactor: 0.15,
    numElements: 150,
    repeatX: 2,
    repeatY: 5,
    patternSpacingX: 1.0,
    patternSpacingY: 1.0,
    canvasOrientation: 'landscape',
    canvasWidth: 842,
    canvasHeight: 595
};

// --- EXPORT SETTINGS ---
const A4_RATIO = 1.414;  // Aspect ratio for A4 paper (landscape)
let doExport = false;    // Flag to trigger high-res export

// --- CANVAS SETTINGS ---
// Canvas dimensions and orientation
let canvasOrientation = 'landscape';  // 'landscape' or 'portrait'
let canvasWidth = 842;                // Canvas width in pixels (A4 landscape)
let canvasHeight = 595;               // Canvas height in pixels (A4 landscape)

// --- VIDEO RECORDING ---
// Variables for WebM video recording
let mediaRecorder;       // MediaRecorder instance
let recordedChunks = []; // Array to store recorded video chunks
let isRecording = false; // Recording state flag
let recordBtn;           // Reference to record button

// --- UI CONTAINERS ---
// References to main UI elements
let mainContainer, canvasContainer, controlsContainer;
let isGUIVisible = true;  // Whether GUI controls are visible

// ============================================================================
// P5.JS LIFECYCLE FUNCTIONS
// ============================================================================

/**
 * preload()
 * Loads all fonts before setup runs
 * WEBGL requires fonts to be loaded as files, can't use system fonts
 */
function preload() {
    // Load all fonts for WEBGL compatibility
    try {
        customFont = loadFont('https://cdnjs.cloudflare.com/ajax/libs/topcoat/0.8.0/font/SourceCodePro-Bold.otf');
    } catch (e) { console.error("Error loading Source Code Pro"); }
    
    try {
        arialFont = loadFont('https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf');
    } catch (e) { console.error("Error loading Arial alternative"); }
    
    try {
        timesFont = loadFont('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.0/fonts/HTML-CSS/TeX/woff/MathJax_Main-Regular.woff');
    } catch (e) { console.error("Error loading Times alternative"); }
    
    try {
        courierFont = loadFont('https://cdnjs.cloudflare.com/ajax/libs/topcoat/0.8.0/font/SourceCodePro-Regular.otf');
    } catch (e) { console.error("Error loading Courier alternative"); }
}

/**
 * setup()
 * Initializes the canvas, creates UI, and sets up initial state
 */
function setup() {
    // Create the UI structure
    setupInterface();
    
    // Calculate responsive canvas size
    let dims = calculateCanvasSize();
    let canvas = createCanvas(dims.w, dims.h, WEBGL);
    canvas.parent(canvasContainer);
    
    // High pixel density for sharper rendering on retina displays
    pixelDensity(2);
    angleMode(DEGREES);
    
    // Disable depth test to allow transparent overlapping textures
    let gl = drawingContext;
    gl.disable(gl.DEPTH_TEST);

    // Create high-resolution texture buffer for text
    textTexture = createGraphics(2048, 2048);
    
    // Set default font
    if (customFont) { 
        textFont(customFont); 
        textTexture.textFont(customFont); 
    }
    
    textAlign(CENTER, CENTER);
    
    // Generate UI controls
    createControls(); 
    
    // Render initial texture
    updateTextureWrapper();
}

// ============================================================================
// CANVAS SIZE & RESPONSIVENESS
// ============================================================================

/**
 * calculateCanvasSize()
 * Calculates optimal canvas dimensions based on available space
 * Adjusts for GUI visibility and maintains aspect ratio
 */
function calculateCanvasSize() {
    // Available width depends on GUI visibility
    let availableW = isGUIVisible ? (windowWidth - 340) : (windowWidth - 40);
    let availableH = windowHeight - 40;

    let targetW = canvasWidth;
    let targetH = canvasHeight;
    
    // Scale to fit available space
    let scaleW = availableW / targetW;
    let scaleH = availableH / targetH;
    let scale = Math.min(scaleW, scaleH, 1); // Don't scale up beyond 1:1
    
    return { 
        w: targetW * scale, 
        h: targetH * scale,
        actualW: targetW,
        actualH: targetH
    };
}

/**
 * calculateOptimal3DSizes()
 * Calculates optimal 3D shape sizes based on canvas dimensions
 * Note: Currently not called automatically, kept for reference
 */
function calculateOptimal3DSizes() {
    // Get the smaller dimension of the canvas
    let smallerDim = Math.min(canvasWidth, canvasHeight);
    
    // Set sphere size to 1/3 of smaller dimension (rounded)
    let optimalSize = Math.round(smallerDim / 3);
    
    currentSphereSize = optimalSize;
    cylinderRadius = Math.round(optimalSize / 2);
    cylinderHeight = Math.round(optimalSize * 1.5);
    
    // Update UI sliders if they exist
    let sliders = selectAll('input[type="range"]');
    sliders.forEach(slider => {
        slider.elt.dispatchEvent(new Event('input'));
    });
}

/**
 * windowResized()
 * p5.js callback when window is resized
 * Recalculates and updates canvas dimensions
 */
function windowResized() {
    let dims = calculateCanvasSize();
    resizeCanvas(dims.w, dims.h);
}

function setupInterface() {
    let css = `
        * { box-sizing: border-box; }
        body { 
            margin: 0;
            padding: 0;
            overflow: hidden; 
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
            background: #f0f0f0;
        } 
        
        #main-layout { 
            display: flex; 
            height: 100vh; 
            width: 100vw; 
            padding: 20px; 
            gap: 20px; 
        }
        
        /* lil-gui style controls */
        #controls-box { 
            width: 300px; 
            min-width: 300px; 
            background: #1a1a1a;
            border-radius: 8px;
            padding: 0;
            display: flex; 
            flex-direction: column;
            height: calc(100vh - 40px);
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        }

        #controls-header h3 {
            margin: 0;
            color: #e0e0e0;
            font-size: 13px;
            font-weight: 600;
            letter-spacing: 0.5px;
            text-transform: uppercase;
        }

        #controls-content {
            flex: 1;
            overflow-y: auto;
            padding: 8px;
        }

        #controls-content::-webkit-scrollbar {
            width: 8px;
        }

        #controls-content::-webkit-scrollbar-track {
            background: #1a1a1a;
        }

        #controls-content::-webkit-scrollbar-thumb {
            background: #3a3a3a;
            border-radius: 4px;
        }

        #controls-content::-webkit-scrollbar-thumb:hover {
            background: #4a4a4a;
        }

        #canvas-box { 
            flex: 1;
            display: flex; 
            align-items: center; 
            justify-content: center;
            background: transparent;
        }

        canvas { 
            border-radius: 4px; 
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        }
        
        /* Group styles */
        .control-group {
            margin-bottom: 4px;
        }

        .group-label { 
            font-size: 11px;
            font-weight: 600;
            color: #888;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            padding: 12px 8px 8px 8px;
            margin: 0;
            border-top: 1px solid #2a2a2a;
        }

        .group-label:first-child {
            border-top: none;
            padding-top: 4px;
        }

        .control-row {
            display: flex;
            align-items: center;
            padding: 6px 8px;
            background: #232323;
            border-radius: 4px;
            margin-bottom: 4px;
            min-height: 32px;
        }

        .control-row:hover {
            background: #2a2a2a;
        }

        .control-label {
            flex: 1;
            font-size: 12px;
            color: #c0c0c0;
            font-weight: 400;
            user-select: none;
        }

        .control-input {
            flex: 0 0 auto;
        }

        .slider-container {
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .slider-value {
            width: 45px;
            text-align: right;
        }

        /* Input styles */
        .p5-input, .p5-select {
            background: #1a1a1a;
            border: 1px solid #3a3a3a;
            border-radius: 3px;
            color: #e0e0e0;
            padding: 4px 8px;
            font-size: 11px;
            font-family: monospace;
            width: 140px;
            outline: none;
        }

        textarea.p5-input {
            resize: vertical;
            min-height: 60px;
            font-family: monospace;
            line-height: 1.4;
        }

        .p5-input:focus, .p5-select:focus {
            border-color: #5a5a5a;
            background: #252525;
        }

        .p5-input[type="number"] {
            width: 60px;
            text-align: right;
        }

        /* File upload button */
        .file-upload-wrapper {
            position: relative;
            overflow: hidden;
            display: inline-block;
        }

        .file-upload-btn {
            background: #3a3a3a;
            color: #e0e0e0;
            padding: 4px 8px;
            border: 1px solid #3a3a3a;
            border-radius: 3px;
            font-size: 11px;
            cursor: pointer;
            transition: background 0.2s;
        }

        .file-upload-btn:hover {
            background: #4a4a4a;
        }

        .file-upload-wrapper input[type=file] {
            position: absolute;
            left: 0;
            top: 0;
            opacity: 0;
            width: 100%;
            height: 100%;
            cursor: pointer;
        }

        /* Color picker */
        input[type="color"] {
            width: 40px;
            height: 24px;
            border: 1px solid #3a3a3a;
            border-radius: 3px;
            background: transparent;
            cursor: pointer;
            padding: 0;
        }

        input[type="color"]::-webkit-color-swatch-wrapper {
            padding: 2px;
        }

        input[type="color"]::-webkit-color-swatch {
            border: none;
            border-radius: 2px;
        }

        /* Slider styles */
        input[type=range] { 
            -webkit-appearance: none;
            appearance: none;
            width: 100px;
            height: 4px;
            background: #3a3a3a;
            border-radius: 2px;
            outline: none;
            cursor: pointer;
        }

        input[type=range]::-webkit-slider-thumb { 
            -webkit-appearance: none;
            appearance: none;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: #e0e0e0;
            cursor: pointer;
            border: none;
        }

        input[type=range]::-webkit-slider-thumb:hover {
            background: #fff;
        }

        input[type=range]::-moz-range-thumb { 
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: #e0e0e0;
            cursor: pointer;
            border: none;
        }

        input[type=range]::-moz-range-thumb:hover {
            background: #fff;
        }

        /* Checkbox */
        input[type="checkbox"] {
            width: 16px;
            height: 16px;
            cursor: pointer;
            accent-color: #5a5a5a;
        }

        .checkbox-label {
            display: flex;
            align-items: center;
            gap: 8px;
            cursor: pointer;
        }

        /* Buttons */
        .action-btn { 
            width: 100%;
            padding: 10px;
            font-weight: 600;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            color: white;
            margin-top: 4px;
            transition: all 0.2s;
            background: #4a4a4a;
        }

        .action-btn:hover { 
            background: #5a5a5a;
            transform: translateY(-1px);
        }

        .action-btn:active {
            transform: translateY(0);
        }

        .btn-recording {
            background: #ef4444;
            animation: pulse 1.5s ease-in-out infinite;
        }

        .btn-paused {
            background: #4a4a4a;
        }

        .btn-paused:hover {
            background: #5a5a5a;
        }

        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
        }

        /* Toggle GUI button in header */
        #controls-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 12px 16px;
        }

        .toggle-gui-btn {
            background: #4a4a4a;
            color: #e0e0e0;
            border: none;
            border-radius: 4px;
            padding: 6px 10px;
            font-size: 10px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            cursor: pointer;
            transition: all 0.2s;
        }

        .toggle-gui-btn:hover {
            background: #5a5a5a;
        }
    `;
    createElement('style', css);

    mainContainer = createDiv().id('main-layout');
    controlsContainer = createDiv().id('controls-box');
    controlsContainer.parent(mainContainer);
    
    let header = createDiv().id('controls-header').parent(controlsContainer);
    header.style('background', '#232323');
    header.style('border-bottom', '1px solid #2a2a2a');
    
    createElement('h3', 'KINETIC TYPE').parent(header);
    
    let toggleBtn = createButton('HIDE (G)').class('toggle-gui-btn').parent(header);
    toggleBtn.mousePressed(toggleGUI);
    window.toggleGUIBtn = toggleBtn;

    canvasContainer = createDiv().id('canvas-box');
    canvasContainer.parent(mainContainer);
}

// ============================================================================
// MAIN DRAW LOOP & EXPORT
// ============================================================================

/**
 * draw()
 * p5.js main loop - renders the 3D scene every frame
 * Handles export mode with high-resolution rendering
 */
function draw() {
    // EXPORT MODE: Create high-resolution texture for PNG export
    if (doExport) {
        pixelDensity(4);  // 4x pixel density for ultra-sharp export
        let oldTex = textTexture;
        textTexture = createGraphics(4096, 4096); // Create 4K texture
        if (customFont) textTexture.textFont(customFont);
        drawTextureText(textTexture, 4096, 4096); 
    }

    // Clear background and enable orbit camera control
    background(backgroundColor); 
    orbitControl();  // Built-in p5.js camera control with mouse

    // Update automatic rotation if not paused and mouse not pressed
    if (!mouseIsPressed && !isRotationPaused) {
        autoRotationY += autoRotationSpeed;
    }

    // Apply rotations and render the 3D scene
    push();
    rotateX(totalRotationX);  // Manual X rotation from mouse drag
    rotateY(totalRotationY + autoRotationY);  // Manual + automatic Y rotation
    renderScene(this, textTexture, dynamicRotation);
    pop();

    // EXPORT MODE: Save the high-res image and restore normal texture
    if (doExport) {
        // Create timestamped filename
        let timestamp = year() + nf(month(), 2) + nf(day(), 2) + '_' + 
                       nf(hour(), 2) + nf(minute(), 2) + nf(second(), 2);
        let filename = 'kinetic-type_' + timestamp + '.png';
        save(filename);
        
        // Restore normal resolution
        pixelDensity(2);
        textTexture.remove(); 
        textTexture = createGraphics(2048, 2048); 
        if (customFont) textTexture.textFont(customFont);
        updateTextureWrapper(); 
        
        doExport = false; 
        alert("Export Finished!");
    }
}

/**
 * triggerExport()
 * Initiates high-resolution PNG export
 */
function triggerExport() { 
    doExport = true; 
    loop(); 
}

/**
 * keyTyped()
 * p5.js keyboard event handler
 * Handles keyboard shortcuts: S (save), P (play/pause), G (hide GUI)
 */
function keyTyped() { 
    // Don't trigger shortcuts when typing in input fields
    if (document.activeElement.tagName === 'INPUT' || 
        document.activeElement.tagName === 'TEXTAREA' || 
        document.activeElement.tagName === 'SELECT') {
        return;
    }
    
    // Keyboard shortcuts
    if (key === 's' || key === 'S') triggerExport();      // Save PNG
    if (key === 'p' || key === 'P') togglePlayPause();    // Play/Pause rotation
    if (key === 'g' || key === 'G') toggleGUI();          // Hide/Show GUI
}

// ============================================================================
// VIDEO RECORDING
// ============================================================================

/**
 * toggleRecording()
 * Starts or stops video recording based on current state
 */
function toggleRecording() { 
    if (!isRecording) startRecording(); 
    else stopRecording(); 
}

/**
 * startRecording()
 * Begins WebM video recording of the canvas at 30fps
 */
function startRecording() {
    console.log("REC Start");
    recordedChunks = [];
    const stream = document.querySelector('canvas').captureStream(30);
    let options = { mimeType: 'video/webm;codecs=vp9' };
    if (!MediaRecorder.isTypeSupported(options.mimeType)) options = { mimeType: 'video/webm' };
    try { mediaRecorder = new MediaRecorder(stream, options); } catch (e) { return; }
    mediaRecorder.ondataavailable = e => { if (e.data.size > 0) recordedChunks.push(e.data); };
    mediaRecorder.start();
    isRecording = true;
    recordBtn.html("STOP RECORDING");
    recordBtn.addClass('btn-recording');
}
/**
 * stopRecording()
 * Stops video recording and saves the WebM file with timestamp
 */
function stopRecording() {
    console.log("REC Stop");
    mediaRecorder.stop();
    
    // When recording stops, create and download the video file
    mediaRecorder.onstop = () => {
        // Create video blob from recorded chunks
        const blob = new Blob(recordedChunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        
        // Generate timestamped filename
        let timestamp = year() + nf(month(), 2) + nf(day(), 2) + '_' + 
                       nf(hour(), 2) + nf(minute(), 2) + nf(second(), 2);
        let filename = 'kinetic-type_' + timestamp + '.webm';
        
        // Trigger download
        const a = document.createElement('a'); 
        document.body.appendChild(a); 
        a.style = 'display: none'; 
        a.href = url; 
        a.download = filename; 
        a.click(); 
        window.URL.revokeObjectURL(url);
    };
    
    // Update UI state
    isRecording = false;
    recordBtn.html("RECORD VIDEO");
    recordBtn.removeClass('btn-recording');
}

// ============================================================================
// 3D RENDERING FUNCTIONS
// ============================================================================

/**
 * renderScene()
 * Main rendering function that draws the appropriate 3D shape
 * @param {p5} t - The p5 graphics context
 * @param {p5.Graphics} tex - The texture to apply to the shape
 * @param {number} dynRot - Dynamic rotation value (used for spiral)
 */
function renderScene(t, tex, dynRot) {
    let gl = t.drawingContext;
    let alphaFront = currentTextureAlpha;      // Full opacity for front faces
    let alphaBack = currentTextureAlpha * 0.15; // Reduced opacity for back faces
    
    // SPHERE MODE
    if (currentShape === 'SPHERE') {
        t.noStroke(); 
        t.texture(tex);  // Apply text texture
        gl.enable(gl.CULL_FACE);  // Enable face culling for depth
        
        // Flip sphere horizontally to correct texture orientation
        t.push(); 
        t.scale(-1, 1, 1); 
        
        // Draw back faces (inside) with lower opacity
        gl.cullFace(gl.FRONT); 
        t.push(); 
        t.tint(255, alphaBack); 
        t.sphere(currentSphereSize, detail, detail); 
        t.pop();
        
        // Draw front faces (outside) with full opacity
        gl.cullFace(gl.BACK); 
        t.push(); 
        t.tint(255, alphaFront); 
        t.sphere(currentSphereSize, detail, detail); 
        t.pop();
        
        t.pop(); 
        t.noTint(); 
        gl.disable(gl.CULL_FACE);
    } 
    // CYLINDER MODE
    else if (currentShape === 'CYLINDER') {
        t.noStroke(); 
        t.texture(tex);
        
        // Flip cylinder horizontally
        t.push(); 
        t.scale(-1, 1); 
        gl.enable(gl.CULL_FACE);
        
        // Draw back faces with lower opacity
        gl.cullFace(gl.FRONT); 
        t.push(); 
        t.tint(255, alphaBack); 
        t.cylinder(cylinderRadius, cylinderHeight, detail, 1, false, false); 
        t.pop();
        
        // Draw front faces with full opacity
        gl.cullFace(gl.BACK); 
        t.push(); 
        t.tint(255, alphaFront); 
        t.cylinder(cylinderRadius, cylinderHeight, detail, 1, false, false); 
        t.pop();
        
        t.noTint(); 
        gl.disable(gl.CULL_FACE); 
        t.pop(); 
    } 
    // FIBONACCI SPIRAL MODE
    else if (currentShape === 'FIBONACCI') {
        t.push(); 
        t.rotateX(-totalRotationX + 20);  // Apply rotation offset
        renderFibonacciSpiral(t, dynRot); 
        t.pop();
    }
}

/**
 * renderFibonacciSpiral()
 * Renders text along a fibonacci/golden ratio spiral in 3D space
 * Each text element is positioned using the golden ratio for natural spiral growth
 * @param {p5} t - The p5 graphics context
 * @param {number} currentDynRot - Current dynamic rotation (unused but kept for compatibility)
 */
function renderFibonacciSpiral(t, currentDynRot) {
    // Select the appropriate font based on user choice
    let selectedFont = customFont; // default fallback
    
    if (userUploadedFont && (font_name === userFontName || font_name === 'Custom Font')) {
        selectedFont = userUploadedFont;
    } else if (font_name === 'Source Code Pro' && customFont) {
        selectedFont = customFont;
    } else if (font_name === 'Arial' && arialFont) {
        selectedFont = arialFont;
    } else if (font_name === 'Times New Roman' && timesFont) {
        selectedFont = timesFont;
    } else if (font_name === 'Courier New' && courierFont) {
        selectedFont = courierFont;
    }
    
    if (selectedFont) {
        t.textFont(selectedFont);
    }

    t.textAlign(CENTER, CENTER);
    t.fill(currentTextColor);
    
    // Accumulate rotation over time (2x speed for more dynamic motion)
    dynamicRotation += autoRotationSpeed * 2; 
    let rotToUse = dynamicRotation;

    // Constrain number of elements to reasonable range
    let numElementsVal = constrain(numElements, 2, 300);
    
    // Draw each text element along the spiral
    for (let i = 0; i < numElementsVal; i++) {
        t.push();
        
        // Text size grows from minSize to maxSize along spiral
        let dynamicSize = map(i, 0, numElementsVal, minSize, maxSize);
        t.textSize(dynamicSize);
        
        // Z position grows from 0 to maxZHeight (depth)
        let currentZ = map(i, 0, numElementsVal - 1, 0, maxZHeight);
        
        // Calculate spiral position using golden ratio
        let theta = i * angleStep;  // Base angle
        let radius = startRadius * pow(PHI, i * scaleFactor);  // Exponential growth
        let totalAngle = theta + rotToUse;  // Add rotation
        
        // Convert polar to cartesian coordinates
        let x = radius * cos(totalAngle);
        let y = radius * sin(totalAngle);
        
        // Position and orient the text
        t.translate(x, y, currentZ);
        t.rotateZ(totalAngle + 90);  // Orient text along spiral curve
        
        // Optional debug dots to show spiral path
        if (showDots) {
            t.push(); 
            t.translate(0, 0, 1); 
            t.fill(0, 0, 255); 
            t.noStroke(); 
            t.sphere(3); 
            t.pop(); 
            t.fill(currentTextColor);
        }

        // Draw the text
        t.text(inputText, 0, 0);
        t.pop();
    }
}

// ============================================================================
// TEXTURE GENERATION FUNCTIONS
// ============================================================================

/**
 * drawTextureText()
 * Renders text into a texture buffer that will be mapped onto 3D shapes
 * Creates a repeating pattern of text with customizable spacing and scaling
 * This is the core function that generates the visual texture
 * 
 * @param {p5.Graphics} pgTarget - The graphics buffer to draw into
 * @param {number} w - Width of the texture (typically 2048 or 4096 for export)
 * @param {number} h - Height of the texture (typically 2048 or 4096 for export)
 */
function drawTextureText(pgTarget, w, h) {
    // Clear previous content
    pgTarget.clear();
    
    // Set text color with full opacity
    let colorOpaque = color(currentTextColor); 
    colorOpaque.setAlpha(255); 
    pgTarget.fill(colorOpaque);
    
    // Calculate size ratio to scale text appropriately for texture size
    // Base size is 2048, so ratio adjusts for different resolutions
    let sizeRatio = w / 2048;
    
    // Set text properties with ratio scaling
    pgTarget.textLeading(text_size * text_leading * sizeRatio);  // Line height
    pgTarget.textAlign(CENTER, CENTER);                          // Center alignment
    pgTarget.textSize(text_size * sizeRatio);                   // Scaled text size
    
    // Flip horizontally to correct orientation when mapped to 3D shapes
    pgTarget.push(); 
    pgTarget.translate(w, 0); 
    pgTarget.scale(-1, 1);
    
    // ========================================================================
    // CALCULATE GRID LAYOUT FOR TEXT REPETITION
    // ========================================================================
    
    // Vertical spacing calculations
    let baseStepY = h / repeatY;                    // Base height per row
    let actualStepY = baseStepY * patternSpacingY;  // Apply spacing multiplier
    let totalBlockHeight = actualStepY * repeatY;   // Total height of all rows
    let startY = (h - totalBlockHeight) / 2;        // Center vertically
    
    // Horizontal spacing calculations
    let baseStepX = w / repeatX;                    // Base width per column
    let actualStepX = baseStepX * patternSpacingX;  // Apply spacing multiplier
    let totalBlockWidth = actualStepX * repeatX;    // Total width of all columns
    let startX = (w - totalBlockWidth) / 2;         // Center horizontally
    
    // ========================================================================
    // RENDER TEXT IN GRID PATTERN
    // ========================================================================
    
    // Nested loops to create grid of text
    for (let j = 0; j < repeatY; j++) {           // Rows (Y axis)
        for (let i = 0; i < repeatX; i++) {       // Columns (X axis)
            pgTarget.push();
            
            // Calculate position for this grid cell
            let posX = startX + (i * actualStepX) + (actualStepX / 2); 
            let posY = startY + (j * actualStepY) + (actualStepY / 2);
            
            // Move to cell position
            pgTarget.translate(posX, posY); 
            
            // Scale text to fit in grid cell
            pgTarget.scale(1.0 / repeatX, 1.0 / repeatY); 
            
            // Apply user-defined horizontal and vertical scaling
            pgTarget.scale(h_scale, v_scale);
            
            // Render the text at current position
            pgTarget.text(inputText, 0, 0);
            
            pgTarget.pop();
        }
    }
    pgTarget.pop(); 
}

/**
 * updateTextureWrapper()
 * Convenience function to regenerate the texture at standard resolution
 * Called by UI callbacks when text properties change
 * Always uses 2048x2048 resolution for real-time display
 */
function updateTextureWrapper() { 
    drawTextureText(textTexture, 2048, 2048); 
}

// ============================================================================
// UI CALLBACK FUNCTIONS
// ============================================================================
// These functions are called when UI controls are changed by the user
// Most update the corresponding variable and regenerate the texture

/**
 * updateText()
 * Called when user types in the text input field
 * Updates the text content and regenerates texture
 */
function updateText() { 
    inputText = this.value(); 
    updateTextureWrapper(); 
}

/**
 * updateBackgroundColor()
 * Called when user changes background color picker
 * Updates background color (no texture regeneration needed)
 */
function updateBackgroundColor() { 
    backgroundColor = this.value(); 
}

/**
 * changeFont()
 * Called when user selects a different font from dropdown
 * Loads the selected font and applies it to both canvas and texture
 */
function changeFont() {
    let selectedValue = this.value();
    let selectedFont = customFont; // default fallback
    
    // Determine which font to use based on selection
    if (selectedValue === 'USER_UPLOADED' && userUploadedFont) {
        font_name = userFontName || 'Custom Font';
        selectedFont = userUploadedFont;
    } else if (selectedValue === 'Source Code Pro' && customFont) { 
        font_name = 'Source Code Pro'; 
        selectedFont = customFont;
    } else if (selectedValue === 'Arial' && arialFont) { 
        font_name = 'Arial'; 
        selectedFont = arialFont;
    } else if (selectedValue === 'Times New Roman' && timesFont) { 
        font_name = 'Times New Roman'; 
        selectedFont = timesFont;
    } else if (selectedValue === 'Courier New' && courierFont) { 
        font_name = 'Courier New'; 
        selectedFont = courierFont;
    }
    
    // Apply font to both main canvas and texture buffer
    if (selectedFont) {
        textFont(selectedFont); 
        textTexture.textFont(selectedFont);
    }
    updateTextureWrapper();
}

// Typography control callbacks
function updateTextSize() { text_size = this.value(); updateTextureWrapper(); }
function updateTextColor() { currentTextColor = this.value(); updateTextureWrapper(); }
function updateTextureAlpha() { currentTextureAlpha = this.value(); updateTextureWrapper(); }
function updateLeading() { text_leading = this.value(); updateTextureWrapper(); }
function updateHScale() { h_scale = this.value(); updateTextureWrapper(); }
function updateVScale() { v_scale = this.value(); updateTextureWrapper(); }
function updateRepeatX() { repeatX = this.value(); updateTextureWrapper(); }
function updateRepeatY() { repeatY = this.value(); updateTextureWrapper(); }
function updatePatternSpacingX() { patternSpacingX = this.value(); updateTextureWrapper(); }
function updatePatternSpacingY() { patternSpacingY = this.value(); updateTextureWrapper(); }

// 3D shape control callbacks (no texture update needed)
function updateSphereSize() { currentSphereSize = this.value(); }
function updateCylinderRadius() { cylinderRadius = this.value(); }
function updateCylinderHeight() { cylinderHeight = this.value(); }
function updateRotationSpeed() { autoRotationSpeed = this.value(); }

// Fibonacci spiral control callbacks
function updateAngleStep() { angleStep = parseFloat(this.value()); }
function updateScaleFactor() { scaleFactor = parseFloat(this.value()); }
function updateMaxZHeight() { maxZHeight = parseFloat(this.value()); }
function updateNumElements() { numElements = parseInt(this.value()); }
function updateMinSize() { minSize = parseInt(this.value()); }
function updateMaxSize() { maxSize = parseInt(this.value()); }
function toggleDots() { showDots = this.checked(); }

/**
 * updateCanvasOrientation()
 * Called when user changes between landscape/portrait
 * Swaps width and height values and resizes canvas
 */
function updateCanvasOrientation() {
    canvasOrientation = this.value();
    
    // Swap width and height
    let temp = canvasWidth;
    canvasWidth = canvasHeight;
    canvasHeight = temp;
    
    // Update input fields to reflect new values
    let widthInput = select('#canvas-width-input');
    let heightInput = select('#canvas-height-input');
    if (widthInput) widthInput.value(canvasWidth);
    if (heightInput) heightInput.value(canvasHeight);
    
    // Recalculate and resize canvas
    let dims = calculateCanvasSize();
    resizeCanvas(dims.w, dims.h);
}

/**
 * updateCanvasWidth()
 * Called when user changes canvas width input
 * Recalculates canvas size and resizes
 */
function updateCanvasWidth() {
    canvasWidth = parseInt(this.value());
    let dims = calculateCanvasSize();
    resizeCanvas(dims.w, dims.h);
}

/**
 * updateCanvasHeight()
 * Called when user changes canvas height input
 * Recalculates canvas size and resizes
 */
function updateCanvasHeight() {
    canvasHeight = parseInt(this.value());
    let dims = calculateCanvasSize();
    resizeCanvas(dims.w, dims.h);
}

/**
 * handleFontUpload()
 * Called when user uploads a custom font file
 * Loads the font and adds it to the font selector dropdown
 * @param {File} file - The uploaded font file
 * @param {string} dataURL - Base64 data URL of the font file
 */
function handleFontUpload(file, dataURL) {
    // Validate file type
    if (file.type.includes('font') || file.name.endsWith('.ttf') || 
        file.name.endsWith('.otf') || file.name.endsWith('.woff') || 
        file.name.endsWith('.woff2')) {
        
        // Extract font name from filename
        userFontName = file.name.split('.')[0];
        
        // Load the font asynchronously
        loadFont(dataURL, function(loadedFont) {
            userUploadedFont = loadedFont;
            
            // Update font selector dropdown
            let fontSelector = selectAll('select.p5-select')[0];
            if (fontSelector) {
                // Remove old custom option if exists
                let options = fontSelector.elt.options;
                for (let i = options.length - 1; i >= 0; i--) {
                    if (options[i].value === 'USER_UPLOADED') {
                        fontSelector.elt.remove(i);
                    }
                }
                
                // Add new custom option with font name
                let option = document.createElement('option');
                option.value = 'USER_UPLOADED';
                option.text = userFontName;
                fontSelector.elt.add(option);
                fontSelector.elt.value = 'USER_UPLOADED';
                
                // Apply the newly loaded font
                font_name = userFontName;
                textFont(userUploadedFont);
                textTexture.textFont(userUploadedFont);
                updateTextureWrapper();
            }
        }, function(err) {
            // Error handling for invalid fonts
            console.error('Error loading font:', err);
            alert('Error loading font. Please make sure it\'s a valid font file.');
        });
    } else {
        alert('Please upload a valid font file (.ttf, .otf, .woff, .woff2)');
    }
}

/**
 * togglePlayPause()
 * Called when user clicks play/pause button or presses P key
 * Toggles automatic rotation on/off and updates button appearance
 */
function togglePlayPause() {
    isRotationPaused = !isRotationPaused;
    if (isRotationPaused) {
        playPauseBtn.html('▶ PLAY (P)');
        playPauseBtn.addClass('btn-paused');
    } else {
        playPauseBtn.html('⏸ PAUSE (P)');
        playPauseBtn.removeClass('btn-paused');
    }
}

/**
 * toggleGUI()
 * Called when user clicks hide/show button or presses G key
 * Shows or hides the control panel and resizes canvas to fill space
 */
function toggleGUI() {
    isGUIVisible = !isGUIVisible;
    if (isGUIVisible) {
        controlsContainer.style('display', 'flex');
        if (window.toggleGUIBtn) toggleGUIBtn.html('HIDE (G)');
    } else {
        controlsContainer.style('display', 'none');
        if (window.toggleGUIBtn) toggleGUIBtn.html('SHOW (G)');
    }
    
    // Recalculate and resize canvas to fill available space
    windowResized();
}

/**
 * changeShape()
 * Called when user selects a different 3D shape from dropdown
 * Shows/hides relevant control groups and regenerates texture
 */
function changeShape() {
    currentShape = this.value();
    
    // Hide all shape-specific control groups
    controls3D_Sphere.style('display', 'none'); 
    controls3D_Cylinder.style('display', 'none'); 
    controls3D_Fibonacci.style('display', 'none');
    
    // Hide rotation controls for Fibonacci (uses different rotation system)
    if (currentShape !== 'FIBONACCI') {
        controls3D_Rotation.style('display', 'block'); 
    } else {
        controls3D_Rotation.style('display', 'none');
    }
    
    // Show appropriate controls based on selected shape
    if (currentShape === 'SPHERE') { 
        controls3D_Sphere.style('display', 'block'); 
        controlsTypography.style('display', 'block'); 
    } else if (currentShape === 'CYLINDER') { 
        controls3D_Cylinder.style('display', 'block'); 
        controlsTypography.style('display', 'block'); 
    } else if (currentShape === 'FIBONACCI') { 
        controls3D_Fibonacci.style('display', 'block'); 
        controlsTypography.style('display', 'none');  // Fibonacci has fixed text rendering
    }
    
    updateTextureWrapper();
}

// ============================================================================
// UI HELPER FUNCTIONS
// ============================================================================

/**
 * createControlRow()
 * Helper function to create a labeled control row in the UI
 * @param {string} label - The label text for the control
 * @param {p5.Element} inputElement - The input element (slider, select, etc.)
 * @param {p5.Element} parent - The parent container element
 * @returns {p5.Element} The created row element
 */
function createControlRow(label, inputElement, parent) {
    let row = createDiv().class('control-row').parent(parent);
    createSpan(label).class('control-label').parent(row);
    let inputContainer = createDiv().class('control-input').parent(row);
    inputElement.parent(inputContainer);
    return row;
}

/**
 * createSliderWithValue()
 * Creates a slider with an associated numeric input field
 * Both controls are synchronized - changing one updates the other
 * @param {number} min - Minimum slider value
 * @param {number} max - Maximum slider value
 * @param {number} initial - Initial value
 * @param {number} step - Step increment
 * @param {function} callback - Function to call when value changes
 * @param {p5.Element} parent - Parent container (unused, kept for compatibility)
 * @returns {p5.Element} Container with slider and number input
 */
function createSliderWithValue(min, max, initial, step, callback, parent) {
    let container = createDiv().class('slider-container');
    let slider = createSlider(min, max, initial, step);
    let valueInput = createInput(initial.toString(), 'number').class('p5-input slider-value');
    valueInput.attribute('step', step);
    valueInput.attribute('min', min);
    valueInput.attribute('max', max);
    
    // When slider moves, update number input and call callback
    slider.input(function() {
        valueInput.value(this.value());
        callback.call(this);
    });
    
    // When number input changes, update slider and call callback
    valueInput.input(function() {
        let val = parseFloat(this.value());
        if (!isNaN(val)) {
            val = constrain(val, min, max);  // Keep within bounds
            slider.value(val);
            callback.call(slider);
        }
    });
    
    slider.parent(container);
    valueInput.parent(container);
    return container;
}

// ============================================================================
// UI CREATION FUNCTION
// ============================================================================

/**
 * createControls()
 * Builds the entire UI control panel with all groups and controls
 * Creates sections for: Content & Font, Appearance, Typography, Canvas, 
 * 3D Shape, and Export
 * This is called once during setup() to generate the interface
 */
function createControls() {
    const contentDiv = createDiv().id('controls-content').parent(controlsContainer);
    
    // ========================================================================
    // 1. CONTENT & FONT SECTION
    // ========================================================================
    createP("CONTENT & FONT").class('group-label').parent(contentDiv);
    let inputGroup = createDiv().class('control-group').parent(contentDiv);
    
    // Text input (multiline textarea)
    let textInput = createElement('textarea', inputText).class('p5-input').input(updateText);
    textInput.attribute('rows', '3');
    createControlRow("Text", textInput, inputGroup);
    
    // Font selector dropdown
    let fontSelector = createSelect().class('p5-select');
    fontSelector.option('Source Code Pro', 'Source Code Pro'); 
    fontSelector.option('Arial', 'Arial'); 
    fontSelector.option('Times New Roman', 'Times New Roman');
    fontSelector.option('Courier New', 'Courier New');
    fontSelector.changed(changeFont);
    createControlRow("Font", fontSelector, inputGroup);
    
    // Custom font upload button
    let uploadRow = createDiv().class('control-row').parent(inputGroup);
    createSpan('Upload Font').class('control-label').parent(uploadRow);
    let uploadContainer = createDiv().class('control-input').parent(uploadRow);
    let uploadBtn = createButton('Choose File').class('file-upload-btn').parent(uploadContainer);
    uploadBtn.mousePressed(function() {
        // Create hidden file input
        let input = document.createElement('input');
        input.type = 'file';
        input.accept = '.ttf,.otf,.woff,.woff2';
        input.onchange = function(e) {
            let file = e.target.files[0];
            if (file) {
                // Read font file as base64
                let reader = new FileReader();
                reader.onload = function(event) {
                    handleFontUpload(file, event.target.result);
                };
                reader.readAsDataURL(file);
            }
        };
        input.click();
    });

    // ========================================================================
    // 2. APPEARANCE SECTION
    // ========================================================================
    createP("APPEARANCE").class('group-label').parent(contentDiv);
    let appearanceGroup = createDiv().class('control-group').parent(contentDiv);
    
    let textColorPicker = createColorPicker(currentTextColor).input(updateTextColor);
    createControlRow("Text Color", textColorPicker, appearanceGroup);
    
    let bgColorPicker = createColorPicker(backgroundColor).input(updateBackgroundColor);
    createControlRow("Background", bgColorPicker, appearanceGroup);
    
    let opacitySlider = createSliderWithValue(0, 255, currentTextureAlpha, 1, updateTextureAlpha, appearanceGroup);
    createControlRow("Opacity", opacitySlider, appearanceGroup);

    // ========================================================================
    // 3. TYPOGRAPHY SECTION
    // ========================================================================
    controlsTypography = createDiv().parent(contentDiv);
    createP("TYPOGRAPHY").class('group-label').parent(controlsTypography);
    let typoGroup = createDiv().class('control-group').parent(controlsTypography);
    
    let sizeSlider = createSliderWithValue(10, 500, text_size, 1, updateTextSize, typoGroup);
    createControlRow("Size", sizeSlider, typoGroup);
    
    let leadingSlider = createSliderWithValue(0.5, 3.0, text_leading, 0.1, updateLeading, typoGroup);
    createControlRow("Leading", leadingSlider, typoGroup);
    
    let scaleXSlider = createSliderWithValue(0.1, 3.0, h_scale, 0.1, updateHScale, typoGroup);
    createControlRow("Scale X", scaleXSlider, typoGroup);
    
    let scaleYSlider = createSliderWithValue(0.1, 3.0, v_scale, 0.1, updateVScale, typoGroup);
    createControlRow("Scale Y", scaleYSlider, typoGroup);
    
    let repeatXSlider = createSliderWithValue(1, 20, repeatX, 1, updateRepeatX, typoGroup);
    createControlRow("Repeat X", repeatXSlider, typoGroup);
    
    let spacingXSlider = createSliderWithValue(0.1, 8.0, patternSpacingX, 0.1, updatePatternSpacingX, typoGroup);
    createControlRow("Spacing X", spacingXSlider, typoGroup);
    
    let repeatYSlider = createSliderWithValue(1, 20, repeatY, 1, updateRepeatY, typoGroup);
    createControlRow("Repeat Y", repeatYSlider, typoGroup);
    
    let spacingYSlider = createSliderWithValue(0.1, 8.0, patternSpacingY, 0.1, updatePatternSpacingY, typoGroup);
    createControlRow("Spacing Y", spacingYSlider, typoGroup);

    // ========================================================================
    // 4. CANVAS SECTION
    // ========================================================================
    createP("CANVAS").class('group-label').parent(contentDiv);
    let canvasGroup = createDiv().class('control-group').parent(contentDiv);
    
    // Orientation selector (landscape/portrait)
    let orientationSelector = createSelect().class('p5-select');
    orientationSelector.option('Landscape', 'landscape');
    orientationSelector.option('Portrait', 'portrait');
    orientationSelector.changed(updateCanvasOrientation);
    createControlRow("Orientation", orientationSelector, canvasGroup);
    
    // Canvas width input
    let widthInput = createInput(canvasWidth.toString(), 'number').class('p5-input').id('canvas-width-input');
    widthInput.attribute('min', '100');
    widthInput.attribute('max', '4000');
    widthInput.input(updateCanvasWidth);
    createControlRow("Width (px)", widthInput, canvasGroup);
    
    // Canvas height input
    let heightInput = createInput(canvasHeight.toString(), 'number').class('p5-input').id('canvas-height-input');
    heightInput.attribute('min', '100');
    heightInput.attribute('max', '4000');
    heightInput.input(updateCanvasHeight);
    createControlRow("Height (px)", heightInput, canvasGroup);

    // ========================================================================
    // 5. 3D SHAPE SECTION
    // ========================================================================
    let controls3D = createDiv().parent(contentDiv);
    createP("3D SHAPE").class('group-label').parent(controls3D);
    let shapeGroup = createDiv().class('control-group').parent(controls3D);
    
    // Shape selector dropdown
    let shapeSel = createSelect().class('p5-select');
    shapeSel.option('Sphere', 'SPHERE'); 
    shapeSel.option('Cylinder', 'CYLINDER'); 
    shapeSel.option('Spiral', 'FIBONACCI'); 
    shapeSel.changed(changeShape);
    createControlRow("Shape", shapeSel, shapeGroup);

    // Rotation controls (hidden for Fibonacci spiral)
    controls3D_Rotation = createDiv().class('control-group').parent(controls3D);
    let rotSpeedSlider = createSliderWithValue(-5.0, 5.0, autoRotationSpeed, 0.1, updateRotationSpeed, controls3D_Rotation);
    createControlRow("Rotation", rotSpeedSlider, controls3D_Rotation);
    
    // Play/Pause button for rotation
    window.playPauseBtn = createButton('⏸ PAUSE (P)').class('action-btn').parent(controls3D_Rotation);
    playPauseBtn.mousePressed(togglePlayPause);

    // Sphere-specific controls
    controls3D_Sphere = createDiv().class('control-group').parent(controls3D);
    let sphereSizeSlider = createSliderWithValue(50, 800, currentSphereSize, 1, updateSphereSize, controls3D_Sphere);
    createControlRow("Size", sphereSizeSlider, controls3D_Sphere);

    // Cylinder-specific controls
    controls3D_Cylinder = createDiv().class('control-group').parent(controls3D);
    let cylRadiusSlider = createSliderWithValue(50, 800, cylinderRadius, 1, updateCylinderRadius, controls3D_Cylinder);
    createControlRow("Radius", cylRadiusSlider, controls3D_Cylinder);
    let cylHeightSlider = createSliderWithValue(100, 1200, cylinderHeight, 1, updateCylinderHeight, controls3D_Cylinder);
    createControlRow("Height", cylHeightSlider, controls3D_Cylinder);

    // Fibonacci spiral-specific controls
    controls3D_Fibonacci = createDiv().class('control-group').parent(controls3D);
    let distSlider = createSliderWithValue(1, 40, angleStep, 0.5, updateAngleStep, controls3D_Fibonacci);
    createControlRow("Distance", distSlider, controls3D_Fibonacci);
    let spreadSlider = createSliderWithValue(0.01, 0.50, scaleFactor, 0.01, updateScaleFactor, controls3D_Fibonacci);
    createControlRow("Spread", spreadSlider, controls3D_Fibonacci);
    let numInput = createInput(numElements.toString(), 'number').class('p5-input').input(function() { numElements = parseInt(this.value()); });
    createControlRow("Elements", numInput, controls3D_Fibonacci);

    // Initialize shape selector and trigger shape change
    if(shapeSel.value()) currentShape = shapeSel.value(); 
    changeShape.call(shapeSel);

    // ========================================================================
    // 6. EXPORT SECTION
    // ========================================================================
    createP("EXPORT").class('group-label').parent(contentDiv);
    let exportGroup = createDiv().class('control-group').parent(contentDiv);
    
    // PNG export button
    let exportBtn = createButton(`SAVE PNG (S)`).class('action-btn').parent(exportGroup).mousePressed(triggerExport);
    
    // Video recording button
    recordBtn = createButton(`RECORD VIDEO`).class('action-btn').parent(exportGroup).mousePressed(toggleRecording);
}

// ============================================================================
// MOUSE INTERACTION
// ============================================================================

/**
 * mouseDragged()
 * p5.js callback when mouse is dragged
 * Allows user to manually rotate the 3D object with mouse
 * Rotation persists and combines with automatic rotation
 */
function mouseDragged() { 
    // Only respond to drags within canvas bounds
    if (mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height) { 
        let deltaX = mouseX - pmouseX;  // Horizontal mouse movement
        let deltaY = mouseY - pmouseY;  // Vertical mouse movement
        
        totalRotationY += deltaX * 0.5;  // Horizontal drag → Y-axis rotation
        totalRotationX -= deltaY * 0.5;  // Vertical drag → X-axis rotation
        
        return false;  // Prevent default behavior
    } 
}