// WUP 25-26
// Andrea Ghirardi


// ============================================================================
// KINETIC MOIRÉ GENERATOR
// An interactive application that generates animated geometric patterns with moiré effects through overlapping rotating layers
// ============================================================================

// Load external libraries dynamically
(function loadExternalLibraries() {
    // Load p5.createLoop - library for creating looping animations
    const createLoopScript = document.createElement('script');
    // Set source URL for the p5.createLoop library from unpkg CDN
    createLoopScript.src = 'https://unpkg.com/p5.createloop@0.2.8/dist/p5.createloop.js';
    // Append the script tag to the document head to load it
    document.head.appendChild(createLoopScript);
    
    // Load lil-gui - library for creating GUI controls
    const lilGuiScript = document.createElement('script');
    // Set source URL for lil-gui library from jsDelivr CDN
    lilGuiScript.src = 'https://cdn.jsdelivr.net/npm/lil-gui@0.19';
    // Append the script tag to the document head to load it
    document.head.appendChild(lilGuiScript);
})();

// Inject custom styles
(function injectStyles() {
    // Create a new style element
    const style = document.createElement('style');
    // Define all CSS styles as a template literal
    style.textContent = `
        body {
            /* Use system font stack for native appearance */
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            /* Dark background color */
            background: #0a0a0a;
            /* White text color */
            color: #fff;
            /* Prevent scrollbars from appearing */
            overflow: hidden;
        }

        main {
            /* Use flexbox for centering */
            display: flex;
            /* Center horizontally */
            justify-content: center;
            /* Center vertically */
            align-items: center;
            /* Full viewport height */
            min-height: 100vh;
        }

        canvas {
            /* Add shadow effect around canvas */
            box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
            /* Add subtle border with transparency */
            border: 1px solid rgba(255, 255, 255, 0.1);
        }

        #title {
            /* Position fixed relative to viewport */
            position: fixed;
            /* 20px from top edge */
            top: 20px;
            /* 20px from left edge */
            left: 20px;
            /* Small font size */
            font-size: 14px;
            /* Semi-bold font weight */
            font-weight: 600;
            /* Semi-transparent white */
            color: rgba(255, 255, 255, 0.8);
            /* Add spacing between letters */
            letter-spacing: 0.5px;
            /* Ensure it appears above other elements */
            z-index: 100;
        }

        #status {
            /* Position fixed relative to viewport */
            position: fixed;
            /* 20px from bottom edge */
            bottom: 20px;
            /* 20px from left edge */
            left: 20px;
            /* Small font size */
            font-size: 12px;
            /* Add padding inside the status box */
            padding: 8px 16px;
            /* Dark semi-transparent background */
            background: rgba(0, 0, 0, 0.8);
            /* Subtle border */
            border: 1px solid rgba(255, 255, 255, 0.1);
            /* Rounded corners */
            border-radius: 4px;
            /* Initially invisible */
            opacity: 0;
            /* Smooth fade in/out transition */
            transition: opacity 0.3s ease;
        }

        #status.show {
            /* Fully visible when 'show' class is added */
            opacity: 1;
        }

        .lil-gui {
            /* CSS custom property for GUI background color */
            --background-color: rgba(10, 10, 10, 0.95);
            /* CSS custom property for GUI text color */
            --text-color: #e0e0e0;
            /* CSS custom property for folder title background */
            --title-background-color: rgba(255, 255, 255, 0.05);
            /* CSS custom property for folder title text */
            --title-text-color: #ffffff;
            /* CSS custom property for control widget color */
            --widget-color: rgba(255, 255, 255, 0.1);
            /* CSS custom property for hover state color */
            --hover-color: rgba(255, 255, 255, 0.15);
            /* CSS custom property for focus state color */
            --focus-color: rgba(255, 255, 255, 0.2);
            /* CSS custom property for number input color */
            --number-color: #ffffff;
            /* CSS custom property for string input color */
            --string-color: #ffffff;
            /* Font family for GUI controls */
            --font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            /* Small font size for GUI */
            font-size: 11px;
            /* Border around GUI panel */
            border: 1px solid rgba(255, 255, 255, 0.1);
            /* Shadow effect for GUI panel */
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        }

        .lil-gui .title {
            /* Semi-bold weight for folder titles */
            font-weight: 600;
            /* Add letter spacing to titles */
            letter-spacing: 0.5px;
        }

        .lil-gui button {
            /* Semi-transparent white background for buttons */
            background: rgba(255, 255, 255, 0.1);
            /* Border for buttons */
            border: 1px solid rgba(255, 255, 255, 0.2);
            /* White text color */
            color: #fff;
            /* Medium font weight */
            font-weight: 500;
            /* Show pointer cursor on hover */
            cursor: pointer;
            /* Smooth transition for hover effects */
            transition: all 0.2s ease;
        }

        .lil-gui button:hover {
            /* Slightly brighter background on hover */
            background: rgba(255, 255, 255, 0.15);
            /* Slightly brighter border on hover */
            border-color: rgba(255, 255, 255, 0.3);
        }
    `;
    // Append the style element to document head
    document.head.appendChild(style);
})();

// Create HTML elements
(function createHTMLElements() {
    // Title
    // Create a div element for the title
    const titleDiv = document.createElement('div');
    // Set the id attribute
    titleDiv.id = 'title';
    // Set the text content
    titleDiv.textContent = 'Kinetic Moiré Generator';
    // Add the title div to the document body
    document.body.appendChild(titleDiv);
    
    // Status
    // Create a div element for status messages
    const statusDiv = document.createElement('div');
    // Set the id attribute
    statusDiv.id = 'status';
    // Add the status div to the document body
    document.body.appendChild(statusDiv);
})();

// ============================================================================
// P5.JS SKETCH
// ============================================================================

// Global variable to hold the animation loop object
let animLoop;
// Global variable to hold the GUI controller
let gui;
// Flag to track whether GIF recording is in progress
let isRecording = false;
// Flag to track whether external libraries have loaded
let librariesLoaded = false;
// Flag to track GUI visibility state
let guiVisible = true;
// Array to store references to layer folder controllers
let layerFolders = [];

// Configuration object
const config = {
    // Layers array - dynamic
    // Array of layer objects, each defining a pattern layer
    layers: [
        {
            // Pattern type for first layer
            pattern: 'Concentric Circles',
            // Rotation speed multiplier
            speed: 1.0,
            // Color in hexadecimal format
            color: '#ff71ce',
            // Line thickness
            strokeWeight: 1.5
        },
        {
            // Pattern type for second layer
            pattern: 'Radial Lines',
            // Rotation speed multiplier (twice as fast)
            speed: 2.0,
            // Cyan color
            color: '#71efff',
            // Line thickness
            strokeWeight: 1.5
        }
    ],
    
    // Animation controls
    // Number of pattern repetitions/lines
    complexity: 20,
    // Ratio between layer speeds
    speedRatio: 2.0,
    
    // Visual effects
    // Enable/disable kaleidoscope effect
    kaleidoscope: false,
    // Number of symmetrical segments in kaleidoscope mode
    kaleidoscopeSegments: 6,
    
    // Style
    // Background color (black)
    backgroundColor: '#000000',
    // Currently selected color palette preset
    colorPalette: 'Vaporwave',
    
    // Canvas
    // Canvas orientation (horizontal or vertical)
    orientation: 'Horizontal',
    // Width to height ratio
    aspectRatio: '1:1',
    // Canvas size in pixels (for longest dimension)
    canvasSize: 800,
    // Scale factor for pattern radius relative to canvas size
    radiusScale: 0.45,
    
    // Export
    // Animation duration in seconds
    duration: 3,
    // Frames per second for animation
    fps: 30,
    // Function to trigger GIF export
    exportGIF: function() {
        startRecording();
    }
};

// Color palettes presets
// Object containing predefined color palette configurations
const palettes = {
    'Vaporwave': {
        // Background color for vaporwave palette
        bg: '#000000',
        // Array of colors for layers
        colors: ['#ff71ce', '#71efff']
    },
    'Cyberpunk': {
        // Background color for cyberpunk palette
        bg: '#000000',
        // Cyan and magenta colors
        colors: ['#00ffff', '#ff00ff']
    },
    'Monochrome': {
        // Background color for monochrome palette
        bg: '#000000',
        // White and gray colors
        colors: ['#ffffff', '#999999']
    },
    'Neon Night': {
        // Background color for neon night palette
        bg: '#000000',
        // Green and pink neon colors
        colors: ['#00ff9d', '#ff2476']
    },
    'Infrared': {
        // Background color for infrared palette
        bg: '#000000',
        // Red and orange colors
        colors: ['#ff0000', '#ff7f00']
    },
    'Deep Ocean': {
        // Dark blue background
        bg: '#001a33',
        // Blue aqua colors
        colors: ['#00bfff', '#1affff']
    },
    'Sunset': {
        // Dark purple background
        bg: '#1a0033',
        // Orange and yellow sunset colors
        colors: ['#ff6b35', '#f7931e']
    },
    'Toxic': {
        // Very dark background
        bg: '#0d0d0d',
        // Bright neon green colors
        colors: ['#39ff14', '#ccff00']
    }
};

// Wait for libraries to load
// Function to check if external libraries are loaded
function checkLibraries() {
    // Check if createLoop function exists (from p5.createloop library)
    // AND if lil object exists (from lil-gui library)
    if (typeof createLoop !== 'undefined' && typeof lil !== 'undefined') {
        // Set flag to true when both libraries are available
        librariesLoaded = true;
        // Log success message to console
        console.log('External libraries loaded successfully');
    }
}

// Function to calculate canvas dimensions based on configuration
function getCanvasDimensions() {
    // Object mapping aspect ratio strings to width/height arrays
    const ratios = {
        '1:1': [1, 1],      // Square
        '4:3': [4, 3],      // Standard
        '3:4': [3, 4],      // Portrait standard
        '16:9': [16, 9],    // Widescreen
        '9:16': [9, 16],    // Portrait widescreen
        '21:9': [21, 9],    // Ultra-wide
        '9:21': [9, 21],    // Ultra-tall
        '3:2': [3, 2],      // Classic photo
        '2:3': [2, 3]       // Portrait photo
    };
    
    // Get width and height values for selected aspect ratio, default to 1:1
    let [w, h] = ratios[config.aspectRatio] || [1, 1];
    
    // If vertical orientation selected AND width is greater than height
    if (config.orientation === 'Vertical' && w > h) {
        // Swap width and height to make it vertical
        [w, h] = [h, w];
    // If horizontal orientation selected AND height is greater than width
    } else if (config.orientation === 'Horizontal' && h > w) {
        // Swap width and height to make it horizontal
        [w, h] = [h, w];
    }
    
    // Calculate aspect ratio as a decimal
    const aspectRatio = w / h;
    // Declare variables for final width and height
    let width, height;
    
    // If aspect ratio is 1 or greater (horizontal or square)
    if (aspectRatio >= 1) {
        // Width equals the canvas size setting
        width = config.canvasSize;
        // Calculate height by dividing by aspect ratio
        height = config.canvasSize / aspectRatio;
    } else {
        // Height equals the canvas size setting
        height = config.canvasSize;
        // Calculate width by multiplying by aspect ratio
        width = config.canvasSize * aspectRatio;
    }
    
    // Return object with rounded integer dimensions
    return { width: Math.round(width), height: Math.round(height) };
}

// Function to update canvas size based on current configuration
function updateCanvasSize() {
    // Get calculated dimensions
    const { width, height } = getCanvasDimensions();
    // Resize the p5.js canvas to new dimensions
    resizeCanvas(width, height);
    // Log the new dimensions to console
    console.log(`Canvas resized to ${width}x${height}`);
}

// p5.js setup function - runs once at start
function setup() {
    // Wait for libraries to load
    // Set interval to repeatedly check if libraries are loaded
    const waitForLibraries = setInterval(() => {
        // Call function to check library availability
        checkLibraries();
        // If libraries are loaded
        if (librariesLoaded) {
            // Stop the interval timer
            clearInterval(waitForLibraries);
            // Initialize the main sketch
            initializeSketch();
        }
    }, 100); // Check every 100 milliseconds
}

// Function to initialize the sketch after libraries load
function initializeSketch() {
    // Get calculated canvas dimensions
    const { width, height } = getCanvasDimensions();
    // Create p5.js canvas with calculated dimensions
    createCanvas(width, height);
    // Set animation frame rate from config
    frameRate(config.fps);
    
    // Initialize p5.createLoop
    try {
        // Create animation loop object with configuration
        animLoop = createLoop({
            // Duration of one loop cycle
            duration: config.duration,
            // Don't auto-start GIF recording
            gif: false
        });
        
        // Configure GIF export settings
        animLoop.gif = {
            // Default filename for exported GIF
            fileName: "moire_kinetic.gif",
            // Start recording at beginning of loop
            startLoop: 0,
            // End recording after one complete loop
            endLoop: 1,
            // Don't render GIF yet
            render: false,
            // Don't auto-download
            download: false,
            // GIF quality (lower = better, slower)
            quality: 10
        };
        
        // Log success to console
        console.log('createLoop initialized');
    } catch(e) {
        // If createLoop initialization fails, log error
        console.log("Error initializing createLoop:", e);
        // Create fallback animation loop object
        animLoop = {
            // Function to calculate animation progress
            progress: function() {
                // Calculate normalized time (0 to 1) based on frame count
                const t = (frameCount / (config.fps * config.duration)) % 1.0;
                // Return object with theta (animation position) and noise
                return { theta: t, noise: 0 };
            },
            // Empty reset function
            reset: function() { },
            // Store duration value
            duration: config.duration,
            // GIF settings object
            gif: { render: false, download: false }
        };
    }
    
    // Initialize the GUI controls
    setupGUI();
    // Set stroke caps to square ends
    strokeCap(SQUARE);
    // Disable fill for all shapes
    noFill();
    // Show ready message for 2 seconds
    showStatus('Ready to generate', 2000);
}

// p5.js draw function - runs continuously every frame
function draw() {
    // Convert background color string to color object
    const bgColor = color(config.backgroundColor);
    // Fill canvas with background color
    background(bgColor);
    
    // Initialize animation progress variable
    let theta = 0;
    // If animLoop exists AND has progress function
    if (animLoop && typeof animLoop.progress === 'function') {
        // Get animation progress data from loop
        const progressData = animLoop.progress();
        // Extract theta (current position in animation cycle)
        theta = progressData.theta;
    } else {
        // Calculate theta manually based on frame count
        theta = (frameCount / (config.fps * config.duration)) % 1.0;
    }
    
    // Move origin to center of canvas
    translate(width / 2, height / 2);
    
    // Check if kaleidoscope mode is enabled
    if (config.kaleidoscope) {
        // Render with kaleidoscope effect
        applyKaleidoscope(theta);
    } else {
        // Render in normal mode
        renderNormalMode(theta);
    }
}

// Function to render patterns in normal (non-kaleidoscope) mode
function renderNormalMode(theta) {
    // Render all layers
    // Loop through each layer in the configuration
    for (let i = 0; i < config.layers.length; i++) {
        // Get current layer object
        const layer = config.layers[i];
        // Calculate rotation angle: progress * full circle * layer speed
        const angle = theta * TWO_PI * layer.speed;
        
        // Save current transformation state
        push();
        // Rotate canvas by calculated angle
        rotate(angle);
        // Draw the pattern with layer settings (no transparency)
        drawPattern(layer.pattern, layer.color, 0, layer.strokeWeight);
        // Restore previous transformation state
        pop();
    }
    
    // Additional overlay for high complexity
    // If complexity is high AND at least one layer exists
    if (config.complexity > 30 && config.layers.length > 0) {
        // Get first layer
        const layer = config.layers[0];
        // Calculate rotation angle
        const angle = theta * TWO_PI * layer.speed;
        // Save transformation state
        push();
        // Rotate in opposite direction at half speed
        rotate(-angle * 0.5);
        // Draw pattern with 50% transparency
        drawPattern(layer.pattern, layer.color, 0.5, layer.strokeWeight);
        // Restore transformation state
        pop();
    }
}

// Function to apply kaleidoscope effect
function applyKaleidoscope(theta) {
    // Get number of kaleidoscope segments from config
    const segments = config.kaleidoscopeSegments;
    
    // Loop through each segment
    for (let i = 0; i < segments; i++) {
        // Save transformation state
        push();
        // Rotate by segment angle (360° / number of segments * segment index)
        rotate((TWO_PI / segments) * i);
        
        // Mirror every other segment horizontally
        if (i % 2 === 1) {
            // Flip horizontally (negative x scale)
            scale(-1, 1);
        }
        
        // Render all layers
        // Loop through each layer
        for (let j = 0; j < config.layers.length; j++) {
            // Get current layer
            const layer = config.layers[j];
            // Calculate rotation angle
            const angle = theta * TWO_PI * layer.speed;
            
            // Save transformation state
            push();
            // Rotate by calculated angle
            rotate(angle);
            // Draw pattern with 30% transparency
            drawPattern(layer.pattern, layer.color, 0.3, layer.strokeWeight);
            // Restore transformation state
            pop();
        }
        
        // Restore transformation state for this segment
        pop();
    }
}

// Function to draw a specific pattern type
function drawPattern(patternType, hexColor, alphaMultiplier = 0, strokeWeightValue = 1.5) {
    // Convert hex color string to color object
    const col = color(hexColor);
    // Calculate alpha: if multiplier provided use it, else full opacity
    const alpha = alphaMultiplier > 0 ? 255 * alphaMultiplier : 255;
    // Set stroke color with calculated alpha
    stroke(red(col), green(col), blue(col), alpha);
    // Set stroke thickness
    strokeWeight(strokeWeightValue);
    
    // Calculate maximum radius based on smaller canvas dimension
    const maxRadius = min(width, height) * config.radiusScale;
    // Get complexity value (number of elements to draw)
    const count = config.complexity;
    
    // Switch based on pattern type
    switch(patternType) {
        case 'Concentric Circles':
            // Draw concentric circles pattern
            drawConcentricCircles(maxRadius, count);
            break;
        case 'Radial Lines':
            // Draw radial lines pattern
            drawRadialLines(maxRadius, count);
            break;
        case 'Square Grid':
            // Draw square grid pattern
            drawSquareGrid(maxRadius, count);
            break;
        case 'Spiral':
            // Draw spiral pattern
            drawSpiral(maxRadius, count);
            break;
        case 'Hexagonal':
            // Draw hexagonal pattern
            drawHexagonal(maxRadius, count);
            break;
        case 'Triangular':
            // Draw triangular pattern
            drawTriangular(maxRadius, count);
            break;
        case 'Wave Grid':
            // Draw wave grid pattern
            drawWaveGrid(maxRadius, count);
            break;
    }
}

// Function to draw concentric circles
function drawConcentricCircles(maxRadius, count) {
    // Loop from 1 to count
    for (let i = 1; i <= count; i++) {
        // Calculate radius for this circle (evenly spaced)
        const r = (maxRadius / count) * i;
        // Draw circle at origin with calculated diameter
        circle(0, 0, r * 2);
    }
}

// Function to draw radial lines from center
function drawRadialLines(maxRadius, count) {
    // Loop through each line
    for (let i = 0; i < count; i++) {
        // Calculate angle for this line (evenly distributed around circle)
        const angle = (TWO_PI / count) * i;
        // Calculate endpoint x coordinate
        const x = cos(angle) * maxRadius;
        // Calculate endpoint y coordinate
        const y = sin(angle) * maxRadius;
        // Draw line from center to calculated endpoint
        line(0, 0, x, y);
    }
}

// Function to draw concentric squares
function drawSquareGrid(maxRadius, count) {
    // Loop from 1 to count
    for (let i = 1; i <= count; i++) {
        // Calculate size for this square (evenly spaced)
        const size = (maxRadius * 2 / count) * i;
        // Set rect mode to draw from center
        rectMode(CENTER);
        // Draw square centered at origin
        square(0, 0, size);
    }
}

// Function to draw spiral pattern
function drawSpiral(maxRadius, count) {
    // Begin shape for continuous curve
    beginShape();
    // Calculate total number of points (more points = smoother spiral)
    const points = count * 20;
    // Loop through each point
    for (let i = 0; i < points; i++) {
        // Calculate angle (spirals outward)
        const angle = (i / points) * TWO_PI * count;
        // Calculate radius (increases linearly)
        const r = (i / points) * maxRadius;
        // Calculate x coordinate
        const x = cos(angle) * r;
        // Calculate y coordinate
        const y = sin(angle) * r;
        // Add vertex at calculated position
        vertex(x, y);
    }
    // End shape without closing
    endShape();
}

// Function to draw concentric hexagons
function drawHexagonal(maxRadius, count) {
    // Loop through each hexagon ring
    for (let ring = 1; ring <= count; ring++) {
        // Calculate radius for this ring
        const r = (maxRadius / count) * ring;
        // Begin shape for hexagon
        beginShape();
        // Loop through 7 vertices (6 sides + 1 to close)
        for (let i = 0; i <= 6; i++) {
            // Calculate angle for this vertex
            const angle = (TWO_PI / 6) * i;
            // Calculate x coordinate
            const x = cos(angle) * r;
            // Calculate y coordinate
            const y = sin(angle) * r;
            // Add vertex at calculated position
            vertex(x, y);
        }
        // Close the hexagon shape
        endShape(CLOSE);
    }
}

// Function to draw concentric triangles
function drawTriangular(maxRadius, count) {
    // Loop through each triangle
    for (let i = 1; i <= count; i++) {
        // Calculate radius for this triangle
        const r = (maxRadius / count) * i;
        // Begin shape for triangle
        beginShape();
        // Loop through 4 vertices (3 sides + 1 to close)
        for (let j = 0; j <= 3; j++) {
            // Calculate angle (starting from top)
            const angle = (TWO_PI / 3) * j - HALF_PI;
            // Calculate x coordinate
            const x = cos(angle) * r;
            // Calculate y coordinate
            const y = sin(angle) * r;
            // Add vertex at calculated position
            vertex(x, y);
        }
        // Close the triangle shape
        endShape(CLOSE);
    }
}

// Function to draw wavy grid pattern
function drawWaveGrid(maxRadius, count) {
    // Calculate spacing between grid lines
    const spacing = maxRadius * 2 / count;
    // Draw horizontal wavy lines
    for (let i = -count; i <= count; i++) {
        // Begin shape for wavy line
        beginShape();
        // Loop through points along line
        for (let j = -count; j <= count; j++) {
            // Calculate x coordinate
            const x = j * spacing;
            // Calculate y coordinate with sine wave offset
            const y = i * spacing + sin(j * 0.5) * spacing * 0.3;
            // Add vertex at calculated position
            vertex(x, y);
        }
        // End shape without closing
        endShape();
    }
    
    // Draw vertical wavy lines
    for (let i = -count; i <= count; i++) {
        // Begin shape for wavy line
        beginShape();
        // Loop through points along line
        for (let j = -count; j <= count; j++) {
            // Calculate x coordinate with sine wave offset
            const x = i * spacing + sin(j * 0.5) * spacing * 0.3;
            // Calculate y coordinate
            const y = j * spacing;
            // Add vertex at calculated position
            vertex(x, y);
        }
        // End shape without closing
        endShape();
    }
}

// Function to set up the GUI controls
function setupGUI() {
    // Create new lil-gui instance with title
    gui = new lil.GUI({ title: 'MOIRE CONTROLS' });
    
    // Array of available pattern type names
    const patternTypes = ['Concentric Circles', 'Radial Lines', 'Square Grid', 'Spiral', 'Hexagonal', 'Triangular', 'Wave Grid'];
    
    // Layers folder with add/remove functionality
    // Create folder in GUI for layer controls
    const layersFolder = gui.addFolder('Layers');
    
    // Function to create a layer folder
    // Function that creates GUI controls for a specific layer
    function createLayerFolder(layerIndex) {
        // Get layer object from config
        const layer = config.layers[layerIndex];
        // Create subfolder for this layer
        const folder = layersFolder.addFolder(`Layer ${layerIndex + 1}`);
        
        // Add dropdown control for pattern type
        folder.add(layer, 'pattern', patternTypes).name('Pattern');
        // Add slider for rotation speed
        folder.add(layer, 'speed', -5, 5, 0.1).name('Speed');
        // Add color picker for layer color
        folder.addColor(layer, 'color').name('Color');
        // Add slider for stroke thickness
        folder.add(layer, 'strokeWeight', 0.5, 5, 0.1).name('Stroke Weight');
        
        // Remove button
        // Add button to remove this layer
        folder.add({
            remove: function() {
                // Check if more than one layer exists
                if (config.layers.length > 1) {
                    // Remove layer at this index from array
                    config.layers.splice(layerIndex, 1);
                    // Rebuild layer GUI controls
                    refreshLayersGUI();
                    // Show status message
                    showStatus(`Layer ${layerIndex + 1} removed`, 2000);
                } else {
                    // Show error message if trying to remove last layer
                    showStatus('Cannot remove last layer', 2000);
                }
            }
        }, 'remove').name('❌ Remove Layer');
        
        // Open folder by default
        folder.open();
        // Return folder reference
        return folder;
    }
    
    // Function to refresh all layer folders
    // Function that rebuilds all layer GUI controls
function refreshLayersGUI() {
    // Remove all existing layer folders
    // Loop through each folder reference
    layerFolders.forEach(folder => {
        // Destroy the folder GUI element
        folder.destroy(); // Changed from layersFolder.removeFolder(folder)
    });
    // Clear the array of folder references
    layerFolders = [];
    
    // Recreate layer folders
    // Loop through each layer and create its GUI folder
    config.layers.forEach((layer, index) => {
        // Create folder and add reference to array
        layerFolders.push(createLayerFolder(index));
    });
    }
    
    // Add layer button
    // Add button to create new layer
    layersFolder.add({
        addLayer: function() {
            // Get random color from palettes
            // Array of available colors
            const paletteColors = ['#ff71ce', '#71efff', '#00ffff', '#ff00ff', '#ffffff', '#00ff9d', '#ff2476', '#39ff14'];
            // Select random color from array
            const randomColor = paletteColors[Math.floor(Math.random() * paletteColors.length)];
            
            // Add new layer object to config array
            config.layers.push({
                // Default pattern type
                pattern: 'Concentric Circles',
                // Default speed
                speed: 1.0,
                // Random color
                color: randomColor,
                // Default stroke weight
                strokeWeight: 1.5
            });
            // Rebuild layer GUI controls
            refreshLayersGUI();
            // Show status message
            showStatus(`Layer ${config.layers.length} added`, 2000);
        }
    }, 'addLayer').name('➕ Add New Layer');
    
    // Initialize layer folders
    // Loop through each existing layer
    config.layers.forEach((layer, index) => {
        // Create GUI folder and store reference
        layerFolders.push(createLayerFolder(index));
    });
    
    // Open layers folder by default
    layersFolder.open();
    
    // Animation
    // Create folder for animation controls
    const animFolder = gui.addFolder('Animation');
    // Add slider for pattern complexity
    animFolder.add(config, 'complexity', 5, 50, 1).name('Complexity');
    // Add slider for speed ratio between layers
    animFolder.add(config, 'speedRatio', 0.1, 5, 0.1).name('Speed Ratio').onChange((value) => {
        // Apply ratio to all layers except first
        // Check if multiple layers exist
        if (config.layers.length > 1) {
            // Loop through layers starting from second
            for (let i = 1; i < config.layers.length; i++) {
                // Set speed relative to first layer
                config.layers[i].speed = config.layers[0].speed * (value * i);
            }
            // Update all GUI displays
            gui.controllersRecursive().forEach(c => c.updateDisplay());
        }
    });
    // Add checkbox for kaleidoscope mode
    animFolder.add(config, 'kaleidoscope').name('Kaleidoscope Mode (K)');
    // Add slider for number of kaleidoscope segments
    animFolder.add(config, 'kaleidoscopeSegments', 3, 12, 1).name('K-Segments');
    
    // Style
    // Create folder for style controls
    const styleFolder = gui.addFolder('Style');
    // Add dropdown for color palette presets
    styleFolder.add(config, 'colorPalette', Object.keys(palettes)).name('Palette').onChange((paletteName) => {
        // Get selected palette object
        const palette = palettes[paletteName];
        // Update background color
        config.backgroundColor = palette.bg;
        // Apply palette colors to existing layers
        // Loop through each layer
        config.layers.forEach((layer, index) => {
            // If palette has color for this layer index
            if (index < palette.colors.length) {
                // Update layer color
                layer.color = palette.colors[index];
            }
        });
        // Update all GUI displays
        gui.controllersRecursive().forEach(c => c.updateDisplay());
        // Show status message
        showStatus(`Palette: ${paletteName}`, 2000);
    });
    // Add color picker for background color
    styleFolder.addColor(config, 'backgroundColor').name('Background Color');
    
    // Canvas
    // Create folder for canvas controls
    const canvasFolder = gui.addFolder('Canvas');
    // Declare variable for aspect ratio controller
    let aspectRatioController;
    
    // Function to get available aspect ratios based on orientation
    function getAvailableRatios() {
        // Object mapping orientations to their available ratios
        const allRatios = {
            // Square only has one option
            'Square': ['1:1'],
            // Horizontal ratios
            'Horizontal': ['1:1', '4:3', '16:9', '21:9', '3:2'],
            // Vertical ratios
            'Vertical': ['1:1', '3:4', '9:16', '9:21', '2:3']
        };
        // Return ratios for current orientation or default to square
        return allRatios[config.orientation] || ['1:1'];
    }
    
    // Function to update aspect ratio dropdown options
    function updateAspectRatioOptions() {
        // Get available ratios for current orientation
        const availableRatios = getAvailableRatios();
        
        // If current aspect ratio is not available in new orientation
        if (!availableRatios.includes(config.aspectRatio)) {
            // Reset to square aspect ratio
            config.aspectRatio = '1:1';
        }
        
        // If aspect ratio controller already exists
        if (aspectRatioController) {
            // Remove old controller from GUI
            canvasFolder.remove(aspectRatioController);
        }
        
        // Create new aspect ratio controller with updated options
        aspectRatioController = canvasFolder.add(config, 'aspectRatio', availableRatios).name('Aspect Ratio').onChange(() => {
            // Update canvas dimensions
            updateCanvasSize();
            // Show status message
            showStatus('Aspect ratio updated', 2000);
        });
    }
    
    // Add dropdown for canvas orientation
    canvasFolder.add(config, 'orientation', ['Horizontal', 'Vertical']).name('Orientation').onChange(() => {
        // Update available aspect ratio options
        updateAspectRatioOptions();
        // Update canvas dimensions
        updateCanvasSize();
        // Show status message
        showStatus('Canvas orientation updated', 2000);
    });
    
    // Initialize aspect ratio options
    updateAspectRatioOptions();
    
    // Add slider for canvas size
    canvasFolder.add(config, 'canvasSize', 400, 1600, 50).name('Size (px)').onChange(() => {
        // Update canvas dimensions
        updateCanvasSize();
        // Show status message
        showStatus('Canvas size updated', 2000);
    });
    
    // Add slider for pattern radius scale
    canvasFolder.add(config, 'radiusScale', 0.2, 0.8, 0.01).name('Pattern Radius').onChange(() => {
        // Show status message
        showStatus('Pattern radius updated', 1000);
    });
    
    // Export
    // Create folder for export controls
    const exportFolder = gui.addFolder('Export');
    // Add slider for animation duration
    exportFolder.add(config, 'duration', 1, 10, 0.5).name('Duration (sec)').onChange((value) => {
        // Update animation loop duration
        animLoop.duration = value;
    });
    // Add slider for frames per second
    exportFolder.add(config, 'fps', 15, 60, 1).name('FPS').onChange((value) => {
        // Update p5.js frame rate
        frameRate(value);
        // Log to console
        console.log(`Framerate updated to ${value} fps`);
    });
    // Add button to start GIF recording
    exportFolder.add(config, 'exportGIF').name('Record & Export (R)');
    // Add button to save single PNG frame
    exportFolder.add({
        saveFrame: function() {
            // Save current canvas as PNG
            saveCanvas('moire-frame', 'png');
            // Show status message
            showStatus('Frame saved!', 2000);
        }
    }, 'saveFrame').name('Save PNG Frame (S)');
    
    // Add button to save SVG frame
    exportFolder.add({
        saveSVG: function() {
            // Call function to generate and save SVG
            saveSVGFrame();
        }
    }, 'saveSVG').name('Save SVG Frame (V)');
    
    // Actions
    // Create folder for action controls
    const actionsFolder = gui.addFolder('Actions');
    // Add button to toggle pause/play
    actionsFolder.add({
        togglePause: function() {
            // Check if animation is currently running
            if (isLooping()) {
                // Pause animation
                noLoop();
                // Show status message
                showStatus('Paused', 2000);
            } else {
                // Resume animation
                loop();
                // Show status message
                showStatus('Playing', 2000);
            }
        }
    }, 'togglePause').name('Pause/Play (P)');
    
    // Add button to toggle GUI visibility
    actionsFolder.add({
        toggleGUI: function() {
            // Toggle visibility flag
            guiVisible = !guiVisible;
            // If GUI should be visible
            if (guiVisible) {
                // Show GUI
                gui.show();
                // Show status message
                showStatus('GUI visible', 1000);
            } else {
                // Hide GUI
                gui.hide();
                // Show status message
                showStatus('GUI hidden', 1000);
            }
        }
    }, 'toggleGUI').name('Hide/Show GUI (G)');
    
    // Open animation folder by default
    animFolder.open();
}

// Function to start GIF recording
function startRecording() {
    // Log function call
    console.log('startRecording called');
    
    // Check if already recording
    if (isRecording) {
        // Log warning
        console.log('Already recording');
        // Show status message
        showStatus('Already recording!', 2000);
        // Exit function early
        return;
    }
    
    // Check if animation loop exists
    if (!animLoop) {
        // Log error
        console.log('ERROR: animLoop not initialized');
        // Show status message
        showStatus('Animation loop not available', 3000);
        // Exit function early
        return;
    }
    
    // Log recording start
    console.log('Starting new recording...');
    // Log recording parameters
    console.log(`Duration: ${config.duration}s, FPS: ${config.fps}`);
    // Set recording flag to true
    isRecording = true;
    // Show initial status message (duration 0 = stays visible)
    showStatus('Initializing GIF recorder...', 0);
    
    try {
        // Set frame rate to configured FPS
        frameRate(config.fps);
        
        // Recreate animation loop with GIF recording enabled
        animLoop = createLoop({
            // Animation duration
            duration: config.duration,
            // GIF export configuration
            gif: {
                // Output filename
                fileName: "moire_kinetic.gif",
                // Start recording at loop beginning
                startLoop: 0,
                // End recording after one complete loop
                endLoop: 1,
                // Enable rendering
                render: true,
                // Enable auto-download
                download: true,
                // GIF quality setting
                quality: 10
            }
        });
        
        // Log success
        console.log(`GIF recording started - ${config.fps} fps`);
        // Show recording status
        showStatus('Recording GIF...', 0);
        
        // Calculate total number of frames to record
        const totalFrames = config.duration * config.fps;
        // Initialize frame counter
        let framesCaptured = 0;
        
        // Set up interval to track recording progress
        const checkInterval = setInterval(() => {
            // Increment frame counter
            framesCaptured++;
            // Calculate progress percentage (cap at 100%)
            const progress = Math.min(Math.round((framesCaptured / totalFrames) * 100), 100);
            // Update status with progress
            showStatus(`Recording: ${progress}%`, 0);
            
            // If captured enough frames (including buffer)
            if (framesCaptured >= totalFrames + 30) {
                // Stop the progress interval
                clearInterval(checkInterval);
                // Log completion
                console.log('Recording should be complete');
                // Show processing message
                showStatus('Processing GIF...', 0);
                
                // Wait 2 seconds for GIF processing
                setTimeout(() => {
                    // Show completion message
                    showStatus('GIF downloaded!', 3000);
                    // Reset recording flag
                    isRecording = false;
                    
                    // Reset animation loop to non-recording mode
                    animLoop = createLoop({
                        // Animation duration
                        duration: config.duration,
                        // Disable GIF recording
                        gif: false
                    });
                    // Set GIF properties to disabled
                    animLoop.gif = {
                        render: false,
                        download: false
                    };
                }, 2000);
            }
        }, 1000 / config.fps); // Run at same rate as FPS
        
    } catch(e) {
        // Log error details
        console.error('Error starting GIF recording:', e);
        // Show error message
        showStatus('GIF export failed', 3000);
        // Reset recording flag
        isRecording = false;
    }
}

// Function to save current frame as SVG
function saveSVGFrame() {
    // Create SVG content
    // Get current canvas dimensions
    const { width: w, height: h } = getCanvasDimensions();
    // Start building SVG string with XML declaration
    let svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<rect width="${w}" height="${h}" fill="${config.backgroundColor}"/>
<g transform="translate(${w/2}, ${h/2})">
`;
    
    // Get current animation state
    // Initialize theta variable
    let theta = 0;
    // Check if animation loop exists and has progress function
    if (animLoop && typeof animLoop.progress === 'function') {
        // Get animation progress data
        const progressData = animLoop.progress();
        // Extract theta value
        theta = progressData.theta;
    } else {
        // Calculate theta manually from frame count
        theta = (frameCount / (config.fps * config.duration)) % 1.0;
    }
    
    // Generate SVG paths for patterns
    // Check if kaleidoscope mode is enabled
    if (config.kaleidoscope) {
        // Get number of segments
        const segments = config.kaleidoscopeSegments;
        
        // Loop through each kaleidoscope segment
        for (let i = 0; i < segments; i++) {
            // Calculate rotation angle for this segment
            const segmentAngle = (360 / segments) * i;
            // Determine if this segment should be mirrored
            const mirror = i % 2 === 1 ? 'scale(-1, 1)' : '';
            
            // Open group with transformation
            svgContent += `<g transform="rotate(${segmentAngle}) ${mirror}">`;
            
            // Render all layers
            // Loop through each layer
            for (let j = 0; j < config.layers.length; j++) {
                // Get layer object
                const layer = config.layers[j];
                // Calculate rotation angle for this layer
                const angle = theta * TWO_PI * layer.speed;
                // Generate SVG for this pattern and add to content
                svgContent += generateSVGPattern(layer.pattern, layer.color, angle * 180 / PI, 0.3, layer.strokeWeight);
            }
            
            // Close group
            svgContent += `</g>`;
        }
    } else {
        // Render all layers in normal mode
        // Loop through each layer
        for (let i = 0; i < config.layers.length; i++) {
            // Get layer object
            const layer = config.layers[i];
            // Calculate rotation angle for this layer
            const angle = theta * TWO_PI * layer.speed;
            // Generate SVG for this pattern and add to content
            svgContent += generateSVGPattern(layer.pattern, layer.color, angle * 180 / PI, 1, layer.strokeWeight);
        }
    }
    
    // Close SVG tags
    svgContent += `</g>
</svg>`;
    
    // Download SVG
    // Create blob from SVG string
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    // Create object URL for blob
    const url = URL.createObjectURL(blob);
    // Create temporary link element
    const link = document.createElement('a');
    // Set link href to blob URL
    link.href = url;
    // Set download filename
    link.download = 'moire-frame.svg';
    // Trigger download by clicking link
    link.click();
    // Clean up object URL
    URL.revokeObjectURL(url);
    
    // Show status message
    showStatus('SVG frame saved!', 2000);
}

// Function to generate SVG code for a specific pattern
function generateSVGPattern(patternType, hexColor, rotationDeg, opacity, strokeWeightValue) {
    // Get canvas dimensions
    const { width: w, height: h } = getCanvasDimensions();
    // Calculate maximum radius
    const maxRadius = min(w, h) * config.radiusScale;
    // Get complexity count
    const count = config.complexity;
    // Start SVG group with rotation and styling
    let svg = `<g transform="rotate(${rotationDeg})" stroke="${hexColor}" stroke-width="${strokeWeightValue}" fill="none" opacity="${opacity}">`;
    
    // Switch based on pattern type
    switch(patternType) {
        case 'Concentric Circles':
            // Loop through each circle
            for (let i = 1; i <= count; i++) {
                // Calculate radius
                const r = (maxRadius / count) * i;
                // Add circle SVG element
                svg += `<circle cx="0" cy="0" r="${r}"/>`;
            }
            break;
            
        case 'Radial Lines':
            // Loop through each line
            for (let i = 0; i < count; i++) {
                // Calculate angle in degrees
                const angle = (360 / count) * i;
                // Calculate endpoint x using cosine
                const x = Math.cos(angle * PI / 180) * maxRadius;
                // Calculate endpoint y using sine
                const y = Math.sin(angle * PI / 180) * maxRadius;
                // Add line SVG element
                svg += `<line x1="0" y1="0" x2="${x}" y2="${y}"/>`;
            }
            break;
            
        case 'Square Grid':
            // Loop through each square
            for (let i = 1; i <= count; i++) {
                // Calculate square size
                const size = (maxRadius * 2 / count) * i;
                // Calculate half size for centering
                const half = size / 2;
                // Add rect SVG element (centered)
                svg += `<rect x="${-half}" y="${-half}" width="${size}" height="${size}"/>`;
            }
            break;
            
        case 'Spiral':
            // Calculate number of points in spiral
            const points = count * 20;
            // Start path data with Move command
            let pathData = 'M';
            // Loop through each point
            for (let i = 0; i < points; i++) {
                // Calculate angle (spirals outward)
                const angle = (i / points) * TWO_PI * count;
                // Calculate radius (increases linearly)
                const r = (i / points) * maxRadius;
                // Calculate x coordinate
                const x = Math.cos(angle) * r;
                // Calculate y coordinate
                const y = Math.sin(angle) * r;
                // Add point to path data
                pathData += `${x},${y} `;
            }
            // Add path SVG element
            svg += `<path d="${pathData}"/>`;
            break;
            
        case 'Hexagonal':
            // Loop through each hexagon ring
            for (let ring = 1; ring <= count; ring++) {
                // Calculate radius for this ring
                const r = (maxRadius / count) * ring;
                // Start path data with Move command
                let pathData = 'M';
                // Loop through 7 vertices (6 sides + 1 to close)
                for (let i = 0; i <= 6; i++) {
                    // Calculate angle in degrees
                    const angle = (360 / 6) * i;
                    // Calculate x coordinate using cosine
                    const x = Math.cos(angle * PI / 180) * r;
                    // Calculate y coordinate using sine
                    const y = Math.sin(angle * PI / 180) * r;
                    // Add point to path data
                    pathData += `${x},${y} `;
                }
                // Add path SVG element with Z to close path
                svg += `<path d="${pathData}Z"/>`;
            }
            break;
            
        case 'Triangular':
            // Loop through each triangle
            for (let i = 1; i <= count; i++) {
                // Calculate radius for this triangle
                const r = (maxRadius / count) * i;
                // Start path data with Move command
                let pathData = 'M';
                // Loop through 4 vertices (3 sides + 1 to close)
                for (let j = 0; j <= 3; j++) {
                    // Calculate angle in degrees (rotated 90° to point up)
                    const angle = (360 / 3) * j - 90;
                    // Calculate x coordinate using cosine
                    const x = Math.cos(angle * PI / 180) * r;
                    // Calculate y coordinate using sine
                    const y = Math.sin(angle * PI / 180) * r;
                    // Add point to path data
                    pathData += `${x},${y} `;
                }
                // Add path SVG element with Z to close path
                svg += `<path d="${pathData}Z"/>`;
            }
            break;
            
        case 'Wave Grid':
            // Calculate spacing between grid lines
            const spacing = maxRadius * 2 / count;
            // Draw horizontal wavy lines
            for (let i = -count; i <= count; i++) {
                // Start path data with Move command
                let pathData = 'M';
                // Loop through points along line
                for (let j = -count; j <= count; j++) {
                    // Calculate x coordinate
                    const x = j * spacing;
                    // Calculate y coordinate with sine wave
                    const y = i * spacing + Math.sin(j * 0.5) * spacing * 0.3;
                    // Add point to path data
                    pathData += `${x},${y} `;
                }
                // Add path SVG element
                svg += `<path d="${pathData}"/>`;
            }
            // Draw vertical wavy lines
            for (let i = -count; i <= count; i++) {
                // Start path data with Move command
                let pathData = 'M';
                // Loop through points along line
                for (let j = -count; j <= count; j++) {
                    // Calculate x coordinate with sine wave
                    const x = i * spacing + Math.sin(j * 0.5) * spacing * 0.3;
                    // Calculate y coordinate
                    const y = j * spacing;
                    // Add point to path data
                    pathData += `${x},${y} `;
                }
                // Add path SVG element
                svg += `<path d="${pathData}"/>`;
            }
            break;
    }
    
    // Close SVG group tag
    svg += '</g>';
    // Return completed SVG string
    return svg;
}

// Function to show status message to user
function showStatus(message, duration) {
    // Get status div element by ID
    const status = document.getElementById('status');
    // If element exists
    if (status) {
        // Set the message text
        status.innerHTML = message;
        // Add 'show' class to make it visible
        status.classList.add('show');
        
        // If duration is greater than 0
        if (duration > 0) {
            // Set timeout to hide message after duration
            setTimeout(() => {
                // Remove 'show' class to hide it
                status.classList.remove('show');
            }, duration);
        }
    }
}

// p5.js keyPressed function - called when a key is pressed
function keyPressed() {
    // Check if 'r' or 'R' key was pressed
    if (key === 'r' || key === 'R') {
        // Start GIF recording
        startRecording();
    // Check if 's' or 'S' key was pressed
    } else if (key === 's' || key === 'S') {
        // Save current frame as PNG
        saveCanvas('moire-frame', 'png');
        // Show status message
        showStatus('Frame saved!', 2000);
    // Check if 'v' or 'V' key was pressed
    } else if (key === 'v' || key === 'V') {
        // Save current frame as SVG
        saveSVGFrame();
    // Check if 'g' or 'G' key was pressed
    } else if (key === 'g' || key === 'G') {
        // Toggle GUI visibility flag
        guiVisible = !guiVisible;
        // If GUI should be visible
        if (guiVisible) {
            // Show GUI
            gui.show();
            // Show status message
            showStatus('GUI visible', 1000);
        } else {
            // Hide GUI
            gui.hide();
            // Show status message
            showStatus('GUI hidden', 1000);
        }
    // Check if 'k' or 'K' key was pressed
    } else if (key === 'k' || key === 'K') {
        // Toggle kaleidoscope mode
        config.kaleidoscope = !config.kaleidoscope;
        // Update all GUI controls to reflect change
        gui.controllersRecursive().forEach(c => c.updateDisplay());
    // Check if 'p' or 'P' key was pressed
    } else if (key === 'p' || key === 'P') {
        // Check if animation is currently running
        if (isLooping()) {
            // Pause the animation
            noLoop();
            // Show paused status
            showStatus('Paused', 2000);
        } else {
            // Resume the animation
            loop();
            // Show playing status
            showStatus('Playing', 2000);
        }
    }
}