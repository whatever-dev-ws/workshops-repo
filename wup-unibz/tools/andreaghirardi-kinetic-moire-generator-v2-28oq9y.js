// WUP 25-26
// Andrea Ghirardi - Refactored for Tool Viewer Compatibility


// ============================================================================
// KINETIC MOIRÉ GENERATOR
// ============================================================================

// Load external libraries dynamically
(function loadExternalLibraries() {
    // Load p5.createLoop - library for creating looping animations
    const createLoopScript = document.createElement('script');
    createLoopScript.src = 'https://unpkg.com/p5.createloop@0.2.8/dist/p5.createloop.js';
    document.head.appendChild(createLoopScript);
    
    // Load lil-gui - library for creating GUI controls
    const lilGuiScript = document.createElement('script');
    lilGuiScript.src = 'https://cdn.jsdelivr.net/npm/lil-gui@0.19';
    document.head.appendChild(lilGuiScript);
})();

// Apply inline styles to body
(function styleBody() {
    document.body.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    document.body.style.background = '#0a0a0a';
    document.body.style.color = '#fff';
    document.body.style.overflow = 'hidden';
    document.body.style.margin = '0';
    document.body.style.padding = '0';
})();

// Create and style main container
(function createMainContainer() {
    const main = document.createElement('main');
    main.style.display = 'flex';
    main.style.justifyContent = 'center';
    main.style.alignItems = 'center';
    main.style.minHeight = '100vh';
    document.body.appendChild(main);
})();

// Create HTML elements with inline styles
(function createHTMLElements() {
    // Title
    const titleDiv = document.createElement('div');
    titleDiv.id = 'title';
    titleDiv.textContent = 'Kinetic Moiré Generator';
    titleDiv.style.position = 'fixed';
    titleDiv.style.top = '20px';
    titleDiv.style.left = '20px';
    titleDiv.style.fontSize = '14px';
    titleDiv.style.fontWeight = '600';
    titleDiv.style.color = 'rgba(255, 255, 255, 0.8)';
    titleDiv.style.letterSpacing = '0.5px';
    titleDiv.style.zIndex = '100';
    document.body.appendChild(titleDiv);
    
    // Status
    const statusDiv = document.createElement('div');
    statusDiv.id = 'status';
    statusDiv.style.position = 'fixed';
    statusDiv.style.bottom = '20px';
    statusDiv.style.left = '20px';
    statusDiv.style.fontSize = '12px';
    statusDiv.style.padding = '8px 16px';
    statusDiv.style.background = 'rgba(0, 0, 0, 0.8)';
    statusDiv.style.border = '1px solid rgba(255, 255, 255, 0.1)';
    statusDiv.style.borderRadius = '4px';
    statusDiv.style.opacity = '0';
    statusDiv.style.transition = 'opacity 0.3s ease';
    document.body.appendChild(statusDiv);
})();

// Style canvas when it's created
function styleCanvas(canvas) {
    canvas.style.boxShadow = '0 4px 24px rgba(0, 0, 0, 0.4)';
    canvas.style.border = '1px solid rgba(255, 255, 255, 0.1)';
}

// Style lil-gui when it's created
function styleGUI(guiElement) {
    guiElement.style.setProperty('--background-color', 'rgba(10, 10, 10, 0.95)');
    guiElement.style.setProperty('--text-color', '#e0e0e0');
    guiElement.style.setProperty('--title-background-color', 'rgba(255, 255, 255, 0.05)');
    guiElement.style.setProperty('--title-text-color', '#ffffff');
    guiElement.style.setProperty('--widget-color', 'rgba(255, 255, 255, 0.1)');
    guiElement.style.setProperty('--hover-color', 'rgba(255, 255, 255, 0.15)');
    guiElement.style.setProperty('--focus-color', 'rgba(255, 255, 255, 0.2)');
    guiElement.style.setProperty('--number-color', '#ffffff');
    guiElement.style.setProperty('--string-color', '#ffffff');
    guiElement.style.setProperty('--font-family', '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif');
    guiElement.style.fontSize = '11px';
    guiElement.style.border = '1px solid rgba(255, 255, 255, 0.1)';
    guiElement.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.4)';
    
    // Style all titles
    const titles = guiElement.querySelectorAll('.title');
    titles.forEach(title => {
        title.style.fontWeight = '600';
        title.style.letterSpacing = '0.5px';
    });
    
    // Style all buttons
    const buttons = guiElement.querySelectorAll('button');
    buttons.forEach(button => {
        button.style.background = 'rgba(255, 255, 255, 0.1)';
        button.style.border = '1px solid rgba(255, 255, 255, 0.2)';
        button.style.color = '#fff';
        button.style.fontWeight = '500';
        button.style.cursor = 'pointer';
        button.style.transition = 'all 0.2s ease';
        
        // Add hover effects
        button.addEventListener('mouseenter', function() {
            this.style.background = 'rgba(255, 255, 255, 0.15)';
            this.style.borderColor = 'rgba(255, 255, 255, 0.3)';
        });
        button.addEventListener('mouseleave', function() {
            this.style.background = 'rgba(255, 255, 255, 0.1)';
            this.style.borderColor = 'rgba(255, 255, 255, 0.2)';
        });
    });
}

// ============================================================================
// P5.JS SKETCH
// ============================================================================

let animLoop;
let gui;
let isRecording = false;
let librariesLoaded = false;
let guiVisible = true;
let layerFolders = [];

// Configuration object
const config = {
    layers: [
        {
            pattern: 'Concentric Circles',
            speed: 1.0,
            color: '#ff71ce',
            strokeWeight: 1.5
        },
        {
            pattern: 'Radial Lines',
            speed: 2.0,
            color: '#71efff',
            strokeWeight: 1.5
        }
    ],
    
    complexity: 20,
    speedRatio: 2.0,
    
    kaleidoscope: false,
    kaleidoscopeSegments: 6,
    
    backgroundColor: '#000000',
    colorPalette: 'Vaporwave',
    
    orientation: 'Horizontal',
    aspectRatio: '1:1',
    canvasSize: 800,
    radiusScale: 0.45,
    
    duration: 3,
    fps: 30,
    exportGIF: function() {
        startRecording();
    }
};

// Color palettes presets
const palettes = {
    'Vaporwave': {
        bg: '#000000',
        colors: ['#ff71ce', '#71efff']
    },
    'Cyberpunk': {
        bg: '#000000',
        colors: ['#00ffff', '#ff00ff']
    },
    'Monochrome': {
        bg: '#000000',
        colors: ['#ffffff', '#999999']
    },
    'Neon Night': {
        bg: '#000000',
        colors: ['#00ff9d', '#ff2476']
    },
    'Infrared': {
        bg: '#000000',
        colors: ['#ff0000', '#ff7f00']
    },
    'Deep Ocean': {
        bg: '#001a33',
        colors: ['#00bfff', '#1affff']
    },
    'Sunset': {
        bg: '#1a0033',
        colors: ['#ff6b35', '#f7931e']
    },
    'Toxic': {
        bg: '#0d0d0d',
        colors: ['#39ff14', '#ccff00']
    }
};

// Wait for libraries to load
function checkLibraries() {
    if (typeof createLoop !== 'undefined' && typeof lil !== 'undefined') {
        librariesLoaded = true;
        console.log('External libraries loaded successfully');
    }
}

// Function to calculate canvas dimensions based on configuration
function getCanvasDimensions() {
    const ratios = {
        '1:1': [1, 1],
        '4:3': [4, 3],
        '3:4': [3, 4],
        '16:9': [16, 9],
        '9:16': [9, 16],
        '21:9': [21, 9],
        '9:21': [9, 21],
        '3:2': [3, 2],
        '2:3': [2, 3]
    };
    
    let [w, h] = ratios[config.aspectRatio] || [1, 1];
    
    if (config.orientation === 'Vertical' && w > h) {
        [w, h] = [h, w];
    } else if (config.orientation === 'Horizontal' && h > w) {
        [w, h] = [h, w];
    }
    
    const aspectRatio = w / h;
    let width, height;
    
    if (aspectRatio >= 1) {
        width = config.canvasSize;
        height = config.canvasSize / aspectRatio;
    } else {
        height = config.canvasSize;
        width = config.canvasSize * aspectRatio;
    }
    
    return { width: Math.round(width), height: Math.round(height) };
}

// Function to update canvas size based on current configuration
function updateCanvasSize() {
    const { width, height } = getCanvasDimensions();
    resizeCanvas(width, height);
    
    // Reapply canvas styles after resize
    const canvas = document.querySelector('canvas');
    if (canvas) {
        styleCanvas(canvas);
    }
    
    console.log(`Canvas resized to ${width}x${height}`);
}

// p5.js setup function - runs once at start
function setup() {
    const waitForLibraries = setInterval(() => {
        checkLibraries();
        if (librariesLoaded) {
            clearInterval(waitForLibraries);
            initializeSketch();
        }
    }, 100);
}

// Function to initialize the sketch after libraries load
function initializeSketch() {
    const { width, height } = getCanvasDimensions();
    createCanvas(width, height);
    
    // Style the canvas
    const canvas = document.querySelector('canvas');
    if (canvas) {
        styleCanvas(canvas);
    }
    
    frameRate(config.fps);
    
    try {
        animLoop = createLoop({
            duration: config.duration,
            gif: false
        });
        
        animLoop.gif = {
            fileName: "moire_kinetic.gif",
            startLoop: 0,
            endLoop: 1,
            render: false,
            download: false,
            quality: 10
        };
        
        console.log('createLoop initialized');
    } catch(e) {
        console.log("Error initializing createLoop:", e);
        animLoop = {
            progress: function() {
                const t = (frameCount / (config.fps * config.duration)) % 1.0;
                return { theta: t, noise: 0 };
            },
            reset: function() { },
            duration: config.duration,
            gif: { render: false, download: false }
        };
    }
    
    setupGUI();
    strokeCap(SQUARE);
    noFill();
    showStatus('Ready to generate', 2000);
}

// p5.js draw function - runs continuously every frame
function draw() {
    const bgColor = color(config.backgroundColor);
    background(bgColor);
    
    let theta = 0;
    if (animLoop && typeof animLoop.progress === 'function') {
        const progressData = animLoop.progress();
        theta = progressData.theta;
    } else {
        theta = (frameCount / (config.fps * config.duration)) % 1.0;
    }
    
    translate(width / 2, height / 2);
    
    if (config.kaleidoscope) {
        applyKaleidoscope(theta);
    } else {
        renderNormalMode(theta);
    }
}

// Function to render patterns in normal (non-kaleidoscope) mode
function renderNormalMode(theta) {
    for (let i = 0; i < config.layers.length; i++) {
        const layer = config.layers[i];
        const angle = theta * TWO_PI * layer.speed;
        
        push();
        rotate(angle);
        drawPattern(layer.pattern, layer.color, 0, layer.strokeWeight);
        pop();
    }
    
    if (config.complexity > 30 && config.layers.length > 0) {
        const layer = config.layers[0];
        const angle = theta * TWO_PI * layer.speed;
        push();
        rotate(-angle * 0.5);
        drawPattern(layer.pattern, layer.color, 0.5, layer.strokeWeight);
        pop();
    }
}

// Function to apply kaleidoscope effect
function applyKaleidoscope(theta) {
    const segments = config.kaleidoscopeSegments;
    
    for (let i = 0; i < segments; i++) {
        push();
        rotate((TWO_PI / segments) * i);
        
        if (i % 2 === 1) {
            scale(-1, 1);
        }
        
        for (let j = 0; j < config.layers.length; j++) {
            const layer = config.layers[j];
            const angle = theta * TWO_PI * layer.speed;
            
            push();
            rotate(angle);
            drawPattern(layer.pattern, layer.color, 0.3, layer.strokeWeight);
            pop();
        }
        
        pop();
    }
}

// Function to draw a specific pattern type
function drawPattern(patternType, hexColor, alphaMultiplier = 0, strokeWeightValue = 1.5) {
    const col = color(hexColor);
    const alpha = alphaMultiplier > 0 ? 255 * alphaMultiplier : 255;
    stroke(red(col), green(col), blue(col), alpha);
    strokeWeight(strokeWeightValue);
    
    const maxRadius = min(width, height) * config.radiusScale;
    const count = config.complexity;
    
    switch(patternType) {
        case 'Concentric Circles':
            drawConcentricCircles(maxRadius, count);
            break;
        case 'Radial Lines':
            drawRadialLines(maxRadius, count);
            break;
        case 'Square Grid':
            drawSquareGrid(maxRadius, count);
            break;
        case 'Spiral':
            drawSpiral(maxRadius, count);
            break;
        case 'Hexagonal':
            drawHexagonal(maxRadius, count);
            break;
        case 'Triangular':
            drawTriangular(maxRadius, count);
            break;
        case 'Wave Grid':
            drawWaveGrid(maxRadius, count);
            break;
    }
}

// Pattern drawing functions
function drawConcentricCircles(maxRadius, count) {
    for (let i = 1; i <= count; i++) {
        const r = (maxRadius / count) * i;
        circle(0, 0, r * 2);
    }
}

function drawRadialLines(maxRadius, count) {
    for (let i = 0; i < count; i++) {
        const angle = (TWO_PI / count) * i;
        const x = cos(angle) * maxRadius;
        const y = sin(angle) * maxRadius;
        line(0, 0, x, y);
    }
}

function drawSquareGrid(maxRadius, count) {
    for (let i = 1; i <= count; i++) {
        const size = (maxRadius * 2 / count) * i;
        rectMode(CENTER);
        square(0, 0, size);
    }
}

function drawSpiral(maxRadius, count) {
    beginShape();
    const points = count * 20;
    for (let i = 0; i < points; i++) {
        const angle = (i / points) * TWO_PI * count;
        const r = (i / points) * maxRadius;
        const x = cos(angle) * r;
        const y = sin(angle) * r;
        vertex(x, y);
    }
    endShape();
}

function drawHexagonal(maxRadius, count) {
    for (let ring = 1; ring <= count; ring++) {
        const r = (maxRadius / count) * ring;
        beginShape();
        for (let i = 0; i <= 6; i++) {
            const angle = (TWO_PI / 6) * i;
            const x = cos(angle) * r;
            const y = sin(angle) * r;
            vertex(x, y);
        }
        endShape(CLOSE);
    }
}

function drawTriangular(maxRadius, count) {
    for (let i = 1; i <= count; i++) {
        const r = (maxRadius / count) * i;
        beginShape();
        for (let j = 0; j <= 3; j++) {
            const angle = (TWO_PI / 3) * j - HALF_PI;
            const x = cos(angle) * r;
            const y = sin(angle) * r;
            vertex(x, y);
        }
        endShape(CLOSE);
    }
}

function drawWaveGrid(maxRadius, count) {
    const spacing = maxRadius * 2 / count;
    
    for (let i = -count; i <= count; i++) {
        beginShape();
        for (let j = -count; j <= count; j++) {
            const x = j * spacing;
            const y = i * spacing + sin(j * 0.5) * spacing * 0.3;
            vertex(x, y);
        }
        endShape();
    }
    
    for (let i = -count; i <= count; i++) {
        beginShape();
        for (let j = -count; j <= count; j++) {
            const x = i * spacing + sin(j * 0.5) * spacing * 0.3;
            const y = j * spacing;
            vertex(x, y);
        }
        endShape();
    }
}

// Function to set up the GUI controls
function setupGUI() {
    gui = new lil.GUI({ title: 'MOIRE CONTROLS' });
    
    // Apply GUI styles
    const guiElement = gui.domElement;
    styleGUI(guiElement);
    
    const patternTypes = ['Concentric Circles', 'Radial Lines', 'Square Grid', 'Spiral', 'Hexagonal', 'Triangular', 'Wave Grid'];
    
    const layersFolder = gui.addFolder('Layers');
    
    function createLayerFolder(layerIndex) {
        const layer = config.layers[layerIndex];
        const folder = layersFolder.addFolder(`Layer ${layerIndex + 1}`);
        
        folder.add(layer, 'pattern', patternTypes).name('Pattern');
        folder.add(layer, 'speed', -5, 5, 0.1).name('Speed');
        folder.addColor(layer, 'color').name('Color');
        folder.add(layer, 'strokeWeight', 0.5, 5, 0.1).name('Stroke Weight');
        
        folder.add({
            remove: function() {
                if (config.layers.length > 1) {
                    config.layers.splice(layerIndex, 1);
                    refreshLayersGUI();
                    showStatus(`Layer ${layerIndex + 1} removed`, 2000);
                } else {
                    showStatus('Cannot remove last layer', 2000);
                }
            }
        }, 'remove').name('❌ Remove Layer');
        
        folder.open();
        return folder;
    }
    
    function refreshLayersGUI() {
        layerFolders.forEach(folder => {
            folder.destroy();
        });
        layerFolders = [];
        
        config.layers.forEach((layer, index) => {
            layerFolders.push(createLayerFolder(index));
        });
        
        // Reapply GUI styles after refresh
        styleGUI(gui.domElement);
    }
    
    layersFolder.add({
        addLayer: function() {
            const paletteColors = ['#ff71ce', '#71efff', '#00ffff', '#ff00ff', '#ffffff', '#00ff9d', '#ff2476', '#39ff14'];
            const randomColor = paletteColors[Math.floor(Math.random() * paletteColors.length)];
            
            config.layers.push({
                pattern: 'Concentric Circles',
                speed: 1.0,
                color: randomColor,
                strokeWeight: 1.5
            });
            refreshLayersGUI();
            showStatus(`Layer ${config.layers.length} added`, 2000);
        }
    }, 'addLayer').name('➕ Add New Layer');
    
    config.layers.forEach((layer, index) => {
        layerFolders.push(createLayerFolder(index));
    });
    
    layersFolder.open();
    
    // Animation
    const animFolder = gui.addFolder('Animation');
    animFolder.add(config, 'complexity', 5, 50, 1).name('Complexity');
    animFolder.add(config, 'speedRatio', 0.1, 5, 0.1).name('Speed Ratio').onChange((value) => {
        if (config.layers.length > 1) {
            for (let i = 1; i < config.layers.length; i++) {
                config.layers[i].speed = config.layers[0].speed * (value * i);
            }
            gui.controllersRecursive().forEach(c => c.updateDisplay());
        }
    });
    animFolder.add(config, 'kaleidoscope').name('Kaleidoscope Mode (K)');
    animFolder.add(config, 'kaleidoscopeSegments', 3, 12, 1).name('K-Segments');
    
    // Style
    const styleFolder = gui.addFolder('Style');
    styleFolder.add(config, 'colorPalette', Object.keys(palettes)).name('Palette').onChange((paletteName) => {
        const palette = palettes[paletteName];
        config.backgroundColor = palette.bg;
        config.layers.forEach((layer, index) => {
            if (index < palette.colors.length) {
                layer.color = palette.colors[index];
            }
        });
        gui.controllersRecursive().forEach(c => c.updateDisplay());
        showStatus(`Palette: ${paletteName}`, 2000);
    });
    styleFolder.addColor(config, 'backgroundColor').name('Background Color');
    
    // Canvas
    const canvasFolder = gui.addFolder('Canvas');
    let aspectRatioController;
    
    function getAvailableRatios() {
        const allRatios = {
            'Square': ['1:1'],
            'Horizontal': ['1:1', '4:3', '16:9', '21:9', '3:2'],
            'Vertical': ['1:1', '3:4', '9:16', '9:21', '2:3']
        };
        return allRatios[config.orientation] || ['1:1'];
    }
    
    function updateAspectRatioOptions() {
        const availableRatios = getAvailableRatios();
        
        if (!availableRatios.includes(config.aspectRatio)) {
            config.aspectRatio = '1:1';
        }
        
        if (aspectRatioController) {
            canvasFolder.remove(aspectRatioController);
        }
        
        aspectRatioController = canvasFolder.add(config, 'aspectRatio', availableRatios).name('Aspect Ratio').onChange(() => {
            updateCanvasSize();
            showStatus('Aspect ratio updated', 2000);
        });
    }
    
    canvasFolder.add(config, 'orientation', ['Horizontal', 'Vertical']).name('Orientation').onChange(() => {
        updateAspectRatioOptions();
        updateCanvasSize();
        showStatus('Canvas orientation updated', 2000);
    });
    
    updateAspectRatioOptions();
    
    canvasFolder.add(config, 'canvasSize', 400, 1600, 50).name('Size (px)').onChange(() => {
        updateCanvasSize();
        showStatus('Canvas size updated', 2000);
    });
    
    canvasFolder.add(config, 'radiusScale', 0.2, 0.8, 0.01).name('Pattern Radius').onChange(() => {
        showStatus('Pattern radius updated', 1000);
    });
    
    // Export
    const exportFolder = gui.addFolder('Export');
    exportFolder.add(config, 'duration', 1, 10, 0.5).name('Duration (sec)').onChange((value) => {
        animLoop.duration = value;
    });
    exportFolder.add(config, 'fps', 15, 60, 1).name('FPS').onChange((value) => {
        frameRate(value);
        console.log(`Framerate updated to ${value} fps`);
    });
    exportFolder.add(config, 'exportGIF').name('Record & Export (R)');
    exportFolder.add({
        saveFrame: function() {
            saveCanvas('moire-frame', 'png');
            showStatus('Frame saved!', 2000);
        }
    }, 'saveFrame').name('Save PNG Frame (S)');
    
    exportFolder.add({
        saveSVG: function() {
            saveSVGFrame();
        }
    }, 'saveSVG').name('Save SVG Frame (V)');
    
    // Actions
    const actionsFolder = gui.addFolder('Actions');
    actionsFolder.add({
        togglePause: function() {
            if (isLooping()) {
                noLoop();
                showStatus('Paused', 2000);
            } else {
                loop();
                showStatus('Playing', 2000);
            }
        }
    }, 'togglePause').name('Pause/Play (P)');
    
    actionsFolder.add({
        toggleGUI: function() {
            guiVisible = !guiVisible;
            if (guiVisible) {
                gui.show();
                showStatus('GUI visible', 1000);
            } else {
                gui.hide();
                showStatus('GUI hidden', 1000);
            }
        }
    }, 'toggleGUI').name('Hide/Show GUI (G)');
    
    animFolder.open();
}

// Function to start GIF recording
function startRecording() {
    console.log('startRecording called');
    
    if (isRecording) {
        console.log('Already recording');
        showStatus('Already recording!', 2000);
        return;
    }
    
    if (!animLoop) {
        console.log('ERROR: animLoop not initialized');
        showStatus('Animation loop not available', 3000);
        return;
    }
    
    console.log('Starting new recording...');
    console.log(`Duration: ${config.duration}s, FPS: ${config.fps}`);
    isRecording = true;
    showStatus('Initializing GIF recorder...', 0);
    
    try {
        frameRate(config.fps);
        
        animLoop = createLoop({
            duration: config.duration,
            gif: {
                fileName: "moire_kinetic.gif",
                startLoop: 0,
                endLoop: 1,
                render: true,
                download: true,
                quality: 10
            }
        });
        
        console.log(`GIF recording started - ${config.fps} fps`);
        showStatus('Recording GIF...', 0);
        
        const totalFrames = config.duration * config.fps;
        let framesCaptured = 0;
        
        const checkInterval = setInterval(() => {
            framesCaptured++;
            const progress = Math.min(Math.round((framesCaptured / totalFrames) * 100), 100);
            showStatus(`Recording: ${progress}%`, 0);
            
            if (framesCaptured >= totalFrames + 30) {
                clearInterval(checkInterval);
                console.log('Recording should be complete');
                showStatus('Processing GIF...', 0);
                
                setTimeout(() => {
                    showStatus('GIF downloaded!', 3000);
                    isRecording = false;
                    
                    animLoop = createLoop({
                        duration: config.duration,
                        gif: false
                    });
                    animLoop.gif = {
                        render: false,
                        download: false
                    };
                }, 2000);
            }
        }, 1000 / config.fps);
        
    } catch(e) {
        console.error('Error starting GIF recording:', e);
        showStatus('GIF export failed', 3000);
        isRecording = false;
    }
}

// Function to save current frame as SVG
function saveSVGFrame() {
    const { width: w, height: h } = getCanvasDimensions();
    let svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<rect width="${w}" height="${h}" fill="${config.backgroundColor}"/>
<g transform="translate(${w/2}, ${h/2})">
`;
    
    let theta = 0;
    if (animLoop && typeof animLoop.progress === 'function') {
        const progressData = animLoop.progress();
        theta = progressData.theta;
    } else {
        theta = (frameCount / (config.fps * config.duration)) % 1.0;
    }
    
    if (config.kaleidoscope) {
        const segments = config.kaleidoscopeSegments;
        
        for (let i = 0; i < segments; i++) {
            const segmentAngle = (360 / segments) * i;
            const mirror = i % 2 === 1 ? 'scale(-1, 1)' : '';
            
            svgContent += `<g transform="rotate(${segmentAngle}) ${mirror}">`;
            
            for (let j = 0; j < config.layers.length; j++) {
                const layer = config.layers[j];
                const angle = theta * TWO_PI * layer.speed;
                svgContent += generateSVGPattern(layer.pattern, layer.color, angle * 180 / PI, 0.3, layer.strokeWeight);
            }
            
            svgContent += `</g>`;
        }
    } else {
        for (let i = 0; i < config.layers.length; i++) {
            const layer = config.layers[i];
            const angle = theta * TWO_PI * layer.speed;
            svgContent += generateSVGPattern(layer.pattern, layer.color, angle * 180 / PI, 1, layer.strokeWeight);
        }
    }
    
    svgContent += `</g>
</svg>`;
    
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'moire-frame.svg';
    link.click();
    URL.revokeObjectURL(url);
    
    showStatus('SVG frame saved!', 2000);
}

// Function to generate SVG code for a specific pattern
function generateSVGPattern(patternType, hexColor, rotationDeg, opacity, strokeWeightValue) {
    const { width: w, height: h } = getCanvasDimensions();
    const maxRadius = min(w, h) * config.radiusScale;
    const count = config.complexity;
    let svg = `<g transform="rotate(${rotationDeg})" stroke="${hexColor}" stroke-width="${strokeWeightValue}" fill="none" opacity="${opacity}">`;
    
    switch(patternType) {
        case 'Concentric Circles':
            for (let i = 1; i <= count; i++) {
                const r = (maxRadius / count) * i;
                svg += `<circle cx="0" cy="0" r="${r}"/>`;
            }
            break;
            
        case 'Radial Lines':
            for (let i = 0; i < count; i++) {
                const angle = (360 / count) * i;
                const x = Math.cos(angle * PI / 180) * maxRadius;
                const y = Math.sin(angle * PI / 180) * maxRadius;
                svg += `<line x1="0" y1="0" x2="${x}" y2="${y}"/>`;
            }
            break;
            
        case 'Square Grid':
            for (let i = 1; i <= count; i++) {
                const size = (maxRadius * 2 / count) * i;
                const half = size / 2;
                svg += `<rect x="${-half}" y="${-half}" width="${size}" height="${size}"/>`;
            }
            break;
            
        case 'Spiral':
            const points = count * 20;
            let pathData = 'M';
            for (let i = 0; i < points; i++) {
                const angle = (i / points) * TWO_PI * count;
                const r = (i / points) * maxRadius;
                const x = Math.cos(angle) * r;
                const y = Math.sin(angle) * r;
                pathData += `${x},${y} `;
            }
            svg += `<path d="${pathData}"/>`;
            break;
            
        case 'Hexagonal':
            for (let ring = 1; ring <= count; ring++) {
                const r = (maxRadius / count) * ring;
                let pathData = 'M';
                for (let i = 0; i <= 6; i++) {
                    const angle = (360 / 6) * i;
                    const x = Math.cos(angle * PI / 180) * r;
                    const y = Math.sin(angle * PI / 180) * r;
                    pathData += `${x},${y} `;
                }
                svg += `<path d="${pathData}Z"/>`;
            }
            break;
            
        case 'Triangular':
            for (let i = 1; i <= count; i++) {
                const r = (maxRadius / count) * i;
                let pathData = 'M';
                for (let j = 0; j <= 3; j++) {
                    const angle = (360 / 3) * j - 90;
                    const x = Math.cos(angle * PI / 180) * r;
                    const y = Math.sin(angle * PI / 180) * r;
                    pathData += `${x},${y} `;
                }
                svg += `<path d="${pathData}Z"/>`;
            }
            break;
            
        case 'Wave Grid':
            const spacing = maxRadius * 2 / count;
            for (let i = -count; i <= count; i++) {
                let pathData = 'M';
                for (let j = -count; j <= count; j++) {
                    const x = j * spacing;
                    const y = i * spacing + Math.sin(j * 0.5) * spacing * 0.3;
                    pathData += `${x},${y} `;
                }
                svg += `<path d="${pathData}"/>`;
            }
            for (let i = -count; i <= count; i++) {
                let pathData = 'M';
                for (let j = -count; j <= count; j++) {
                    const x = i * spacing + Math.sin(j * 0.5) * spacing * 0.3;
                    const y = j * spacing;
                    pathData += `${x},${y} `;
                }
                svg += `<path d="${pathData}"/>`;
            }
            break;
    }
    
    svg += '</g>';
    return svg;
}

// Function to show status message to user
function showStatus(message, duration) {
    const status = document.getElementById('status');
    if (status) {
        status.innerHTML = message;
        status.style.opacity = '1';
        
        if (duration > 0) {
            setTimeout(() => {
                status.style.opacity = '0';
            }, duration);
        }
    }
}

// p5.js keyPressed function - called when a key is pressed
function keyPressed() {
    if (key === 'r' || key === 'R') {
        startRecording();
    } else if (key === 's' || key === 'S') {
        saveCanvas('moire-frame', 'png');
        showStatus('Frame saved!', 2000);
    } else if (key === 'v' || key === 'V') {
        saveSVGFrame();
    } else if (key === 'g' || key === 'G') {
        guiVisible = !guiVisible;
        if (guiVisible) {
            gui.show();
            showStatus('GUI visible', 1000);
        } else {
            gui.hide();
            showStatus('GUI hidden', 1000);
        }
    } else if (key === 'k' || key === 'K') {
        config.kaleidoscope = !config.kaleidoscope;
        gui.controllersRecursive().forEach(c => c.updateDisplay());
    } else if (key === 'p' || key === 'P') {
        if (isLooping()) {
            noLoop();
            showStatus('Paused', 2000);
        } else {
            loop();
            showStatus('Playing', 2000);
        }
    }
}