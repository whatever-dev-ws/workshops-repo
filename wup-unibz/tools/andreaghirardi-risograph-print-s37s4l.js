// WUP 25-26
// Andrea Ghirardi

// ============================================
// RASTER - Risograph Print Aesthetic Tool
// ============================================
// A tool that simulates the Risograph printing technique by separating images into color channels
// and applying halftone patterns with offset registration errors

// Function to inject CSS styles into the document
function applyStyles() {
    // Create a new style element to hold our CSS
    const style = document.createElement('style');
    // Define all CSS rules as a template string
    style.textContent = `
        html, body {
            margin: 0;  // Remove default browser margins
            padding: 0;  // Remove default browser padding
        }

        body {
            display: flex;  // Use flexbox for centering
            justify-content: center;  // Center horizontally
            align-items: center;  // Center vertically
            min-height: 100vh;  // Full viewport height
            background: #111;  // Dark background color
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;  // System font stack
        }

        canvas {
            display: block;  // Remove inline spacing below canvas
        }

        /* Minimal GUI styling */
        .lil-gui {
            --background-color: #1a1a1a;  // Dark GUI background
            --text-color: #e0e0e0;  // Light text color
            --title-background-color: #000;  // Black title background
            --title-text-color: #fff;  // White title text
            --widget-color: #2a2a2a;  // Widget background color
            --hover-color: #333;  // Hover state color
            --focus-color: #666;  // Focus state color
            --number-color: #999;  // Number input color
            --string-color: #e0e0e0;  // String input color
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;  // Match body font
            font-size: 11px;  // Small font size for compact GUI
        }

        .lil-gui.root {
            position: fixed;  // Fixed positioning so GUI doesn't scroll
            top: 16px;  // 16px from top edge
            right: 16px;  // 16px from right edge
            max-height: calc(100vh - 32px);  // Max height accounting for top/bottom margins
            overflow-y: auto;  // Allow vertical scrolling if content exceeds height
            overflow-x: hidden;  // Hide horizontal overflow
        }
        
        /* Scrollbar styling for GUI */
        .lil-gui.root::-webkit-scrollbar {
            width: 8px;  // Scrollbar width
        }
        
        .lil-gui.root::-webkit-scrollbar-track {
            background: #1a1a1a;  // Scrollbar track color matches GUI background
        }
        
        .lil-gui.root::-webkit-scrollbar-thumb {
            background: #444;  // Scrollbar handle color
            border-radius: 4px;  // Rounded corners for handle
        }
        
        .lil-gui.root::-webkit-scrollbar-thumb:hover {
            background: #666;  // Lighter color on hover
        }

        .lil-gui button {
            font-weight: 500;  // Medium font weight for buttons
        }
    `;
    // Append the style element to the document head
    document.head.appendChild(style);
}

// Function to dynamically load the lil-gui library from CDN
function loadLilGui() {
    // Return a Promise so we can wait for the library to load
    return new Promise((resolve, reject) => {
        // Create a new script element
        const script = document.createElement('script');
        // Set the CDN URL for lil-gui library
        script.src = 'https://cdn.jsdelivr.net/npm/lil-gui@0.19.1/dist/lil-gui.umd.min.js';
        // Resolve promise when script loads successfully
        script.onload = resolve;
        // Reject promise if script fails to load
        script.onerror = reject;
        // Append script to document head to trigger loading
        document.head.appendChild(script);
    });
}

// Global variables accessible throughout the application
let img; // Original image (never modified) - stores the full resolution uploaded image
let displayImg; // Scaled version for display - optimized size for canvas rendering
let gui; // GUI controller instance
let params; // Object containing all parameter values for the effect
let imageData = []; // Array storing processed pixel data for each grid point
let canvasWidth = 800; // Canvas width in pixels
let canvasHeight = 800; // Canvas height in pixels
let isInitialized = false; // Flag to track if GUI has been initialized

// Object containing pattern drawing functions
// Each function draws a different halftone pattern based on pixel intensity
const patterns = {
    // Circles pattern - draws filled circles with radius proportional to intensity
    circles: (x, y, size, intensity) => {
        // Map intensity (0-255) to radius (0 to 80% of grid size)
        const radius = map(intensity, 0, 255, 0, size * 0.8);
        // Draw circle at position (x, y) with calculated radius
        circle(x, y, radius);
    },
    
    // Lines pattern - draws rotated lines with length proportional to intensity
    lines: (x, y, size, intensity, angle) => {
        // Map intensity to line length (0 to 120% of grid size for slight overlap)
        const lineLength = map(intensity, 0, 255, 0, size * 1.2);
        push(); // Save current transformation state
        translate(x, y); // Move origin to drawing position
        rotate(angle); // Rotate by specified angle
        line(-lineLength/2, 0, lineLength/2, 0); // Draw line centered at origin
        pop(); // Restore transformation state
    },
    
    // Crosses pattern - draws two perpendicular lines forming a cross
    crosses: (x, y, size, intensity, angle) => {
        // Map intensity to line length
        const lineLength = map(intensity, 0, 255, 0, size * 1.2);
        push(); // Save transformation state
        translate(x, y); // Move to drawing position
        rotate(angle); // Rotate entire cross
        line(-lineLength/2, 0, lineLength/2, 0); // Horizontal line
        line(0, -lineLength/2, 0, lineLength/2); // Vertical line
        pop(); // Restore transformation state
    },
    
    // Dots pattern - draws square dots with size proportional to intensity
    dots: (x, y, size, intensity) => {
        // Map intensity to dot size (0 to 60% of grid size)
        const dotSize = map(intensity, 0, 255, 0, size * 0.6);
        // Draw rectangle centered at (x, y)
        rect(x - dotSize/2, y - dotSize/2, dotSize, dotSize);
    },
    
    // Grain pattern - draws multiple small random circles for textured effect
    grain: (x, y, size, intensity) => {
        // Map intensity to number of grain particles (0 to 8)
        const grainDensity = map(intensity, 0, 255, 0, 8);
        // Draw each grain particle
        for (let i = 0; i < grainDensity; i++) {
            // Random position within grid cell
            const px = x + random(-size/2, size/2);
            const py = y + random(-size/2, size/2);
            // Random size for grain particle
            const grainSize = random(0.5, 2);
            // Draw small circle
            circle(px, py, grainSize);
        }
    }
};

// p5.js setup function - called automatically once when p5.js is loaded
function setup() {
    // Apply CSS styles first
    applyStyles();
    
    // Create canvas with specified dimensions
    let canvas = createCanvas(canvasWidth, canvasHeight);
    // Enable drag-and-drop file handling on canvas
    canvas.drop(handleFile);
    // Enable click-to-upload functionality
    canvas.mousePressed(selectFile);
    
    // Set initial background color (beige/paper color)
    background(245, 240, 230);
    
    // Show loading message while GUI library loads
    textAlign(CENTER, CENTER); // Center text alignment
    fill(100); // Gray text color
    textSize(18); // Text size
    text('Loading GUI...', width/2, height/2); // Draw loading message
    
    // Load lil-gui library and then initialize GUI
    loadLilGui().then(() => {
        setupGUI(); // Initialize the GUI once library is loaded
        isInitialized = true; // Mark as initialized
        
        // Show upload prompt after GUI is ready
        background(245, 240, 230); // Clear canvas
        textAlign(CENTER, CENTER); // Center text
        fill(100); // Gray text
        textSize(18); // Text size
        text('Drop an image here or click to upload', width/2, height/2); // Upload prompt
    }).catch(err => {
        // Handle errors if GUI library fails to load
        console.error('Failed to load lil-gui:', err);
        textAlign(CENTER, CENTER);
        fill(255, 0, 0); // Red text for error
        textSize(14);
        text('Error loading GUI library', width/2, height/2); // Error message
    });
}

// Function to initialize and configure the GUI
function setupGUI() {
    // Create new GUI instance with title
    gui = new lil.GUI({ 
        title: 'Raster' // GUI panel title
    });
    
    // Initialize parameters object with default values
    params = {
        gridSize: 8, // Size of halftone grid in pixels
        blendMode: 'source', // Blend mode for combining channels
        
        // Dynamic channels array - allows adding/removing color channels
        channels: [
            {
                id: 'channel_0', // Unique identifier
                name: 'Red', // Display name
                color: '#ff0000', // Hex color value
                offsetX: 0, // Horizontal offset in pixels
                offsetY: 0, // Vertical offset in pixels
                pattern: 'lines', // Pattern type to use
                angle: 15, // Rotation angle in degrees
                opacity: 255 // Opacity (0-255)
            },
            {
                id: 'channel_1',
                name: 'Green',
                color: '#00ff00',
                offsetX: 2, // Slight offset to simulate registration error
                offsetY: -2,
                pattern: 'circles',
                angle: 45,
                opacity: 255
            },
            {
                id: 'channel_2',
                name: 'Blue',
                color: '#0000ff',
                offsetX: -2, // Opposite offset for visual effect
                offsetY: 2,
                pattern: 'crosses',
                angle: 75,
                opacity: 255
            }
        ],
        
        // Button callbacks
        addChannel: () => addChannel(), // Add new color channel
        clear: () => clearImage(), // Clear current image
        savePNG: () => saveImage(), // Export as PNG
        saveSVG: () => saveImageSVG() // Export as SVG
    };
    
    // Create static folders for global settings (will appear at top initially)
    const gridFolder = gui.addFolder('Grid'); // Folder for grid settings
    gridFolder.add(params, 'gridSize', 3, 20, 1).name('Grid Size').onChange(processImage); // Grid size slider (3-20, step 1)
    
    const aestheticsFolder = gui.addFolder('Aesthetics'); // Folder for visual settings
    aestheticsFolder.add(params, 'blendMode', ['source', 'multiply', 'screen', 'overlay', 'normal']).name('Blend Mode').onChange(processImage); // Blend mode dropdown
    
    // Actions folder for buttons
    const actionsFolder = gui.addFolder('Actions');
    actionsFolder.add(params, 'addChannel').name('➕ Add Channel'); // Button to add channel
    actionsFolder.add(params, 'clear').name('Clear'); // Button to clear image
    actionsFolder.add(params, 'savePNG').name('Save PNG'); // Button to save PNG
    actionsFolder.add(params, 'saveSVG').name('Save SVG'); // Button to save SVG
    
    // Store references to static folders for later use
    gui._gridFolder = gridFolder;
    gui._aestheticsFolder = aestheticsFolder;
    gui._actionsFolder = actionsFolder;
    
    // Create GUI controls for each channel
    updateChannelGUI();
}

// Array to keep track of channel folder references
let channelFolders = [];

// Function to rebuild GUI for all channels
function updateChannelGUI() {
    // Remove existing channel folders from GUI
    channelFolders.forEach(folder => {
        folder.destroy(); // Remove folder and its controls
    });
    channelFolders = []; // Clear array
    
    // Get reference to GUI's controllers array (unused but kept for potential future use)
    const guiControllers = gui.controllersRecursive();
    
    // Create folder for each channel in params.channels array
    params.channels.forEach((channel, index) => {
        const folder = gui.addFolder(channel.name); // Create folder with channel name
        channelFolders.push(folder); // Store reference
        
        // Move this folder to the top (before Grid folder)
        const allFolders = gui.folders; // Get all folders
        const folderIndex = allFolders.indexOf(folder); // Find current position
        if (folderIndex !== -1) {
            allFolders.splice(folderIndex, 1); // Remove from current position
            allFolders.splice(index, 0, folder); // Insert at top (position = index)
        }
        
        // Color picker control - lil-gui supports hex color strings
        folder.addColor(channel, 'color').name('Color').onChange(processImage);
        
        // Position controls for registration offset
        folder.add(channel, 'offsetX', -50, 50, 0.5).name('Offset X').onChange(processImage); // X offset slider (-50 to 50, step 0.5)
        folder.add(channel, 'offsetY', -50, 50, 0.5).name('Offset Y').onChange(processImage); // Y offset slider
        
        // Pattern controls
        folder.add(channel, 'pattern', ['circles', 'lines', 'crosses', 'dots', 'grain']).name('Pattern').onChange(processImage); // Pattern dropdown
        folder.add(channel, 'angle', 0, 180, 1).name('Angle (°)').onChange(processImage); // Angle slider (0-180 degrees)
        folder.add(channel, 'opacity', 0, 255, 1).name('Opacity').onChange(processImage); // Opacity slider (0-255)
        
        // Remove button (only if more than 1 channel exists)
        if (params.channels.length > 1) {
            channel.removeChannel = () => removeChannel(index); // Create callback bound to this channel's index
            folder.add(channel, 'removeChannel').name('🗑️ Remove'); // Add remove button
        }
    });
}

// Function to add a new color channel
function addChannel() {
    // Create new channel object with default values
    const newChannel = {
        id: `channel_${Date.now()}`, // Unique ID using timestamp
        name: `Channel ${params.channels.length + 1}`, // Sequential name
        color: '#808080', // Gray default color
        offsetX: 0, // No offset by default
        offsetY: 0,
        pattern: 'circles', // Default pattern
        angle: 0, // No rotation by default
        opacity: 255 // Full opacity
    };
    
    params.channels.push(newChannel); // Add to channels array
    updateChannelGUI(); // Rebuild GUI to show new channel
    processImage(); // Reprocess image with new channel
}

// Function to remove a channel by index
function removeChannel(index) {
    // Only allow removal if more than 1 channel exists
    if (params.channels.length > 1) {
        params.channels.splice(index, 1); // Remove channel from array
        updateChannelGUI(); // Rebuild GUI
        processImage(); // Reprocess image without removed channel
    }
}

// Function to trigger file selection dialog when canvas is clicked
function selectFile() {
    // Only allow file selection if no image is loaded and GUI is initialized
    if (!img && isInitialized) {
        let input = createFileInput(handleFile); // Create hidden file input
        input.elt.click(); // Programmatically click it
        input.remove(); // Remove it after use
    }
}

// Function to handle file upload (both drag-drop and click-to-upload)
function handleFile(file) {
    // Check if uploaded file is an image
    if (file.type === 'image') {
        // Load image from file data
        loadImage(file.data, (loadedImg) => {
            img = loadedImg; // Store original image
            
            // Create scaled version for display to optimize performance
            const scale = min(canvasWidth / img.width, canvasHeight / img.height) * 0.9; // Calculate scale (90% of max fit)
            displayImg = img.get(); // Create a copy of original
            displayImg.resize(displayImg.width * scale, displayImg.height * scale); // Resize copy
            
            extractImageData(); // Extract pixel data from display image
            processImage(); // Process and display the effect
        });
    }
}

// Function to clear the current image and reset
function clearImage() {
    img = null; // Clear original image
    displayImg = null; // Clear display image
    imageData = []; // Clear processed data
    background(245, 240, 230); // Reset background
    
    // Show upload prompt again
    textAlign(CENTER, CENTER);
    fill(100);
    textSize(18);
    text('Drop an image here or click to upload', width/2, height/2);
}

// Helper function to convert hex color string to RGB object
function hexToRgb(hex) {
    // Remove # if present
    hex = hex.replace('#', '');
    
    // Parse hex values to integers (base 16)
    const r = parseInt(hex.substring(0, 2), 16); // First 2 characters = red
    const g = parseInt(hex.substring(2, 4), 16); // Next 2 = green
    const b = parseInt(hex.substring(4, 6), 16); // Last 2 = blue
    
    // Return as object
    return { r, g, b };
}

// Function to extract and process pixel data from the display image
function extractImageData() {
    if (!displayImg) return; // Exit if no image
    
    imageData = []; // Clear existing data
    displayImg.loadPixels(); // Load pixel array for reading
    
    // Extract color data on grid points only (optimization - don't process every pixel)
    for (let y = 0; y < displayImg.height; y += params.gridSize) { // Step by grid size
        for (let x = 0; x < displayImg.width; x += params.gridSize) {
            const idx = (x + y * displayImg.width) * 4; // Calculate pixel index in 1D array (4 values per pixel: RGBA)
            
            // Store original RGB values for this grid point
            const pixelData = {
                x: x, // X position
                y: y, // Y position
                r: displayImg.pixels[idx], // Red value (0-255)
                g: displayImg.pixels[idx + 1], // Green value
                b: displayImg.pixels[idx + 2], // Blue value
                channels: {} // Object to store intensity for each channel
            };
            
            // Calculate intensity for each channel based on its color
            params.channels.forEach(channel => {
                // Convert channel's hex color to RGB
                const channelRgb = hexToRgb(channel.color);
                
                // Calculate total brightness of channel color (normalized to 0-1)
                const colorWeight = (channelRgb.r + channelRgb.g + channelRgb.b) / 765; // 765 = 255*3
                
                if (colorWeight === 0) {
                    // Black channel contributes no intensity
                    pixelData.channels[channel.id] = 0;
                } else {
                    // Calculate how much this pixel matches the channel's color
                    // Weight by channel color components
                    const rContrib = (pixelData.r / 255) * (channelRgb.r / 255); // Red contribution
                    const gContrib = (pixelData.g / 255) * (channelRgb.g / 255); // Green contribution
                    const bContrib = (pixelData.b / 255) * (channelRgb.b / 255); // Blue contribution
                    
                    // Average of contributions, scaled back to 0-255
                    const intensity = ((rContrib + gContrib + bContrib) / 3) * 255;
                    pixelData.channels[channel.id] = intensity; // Store intensity for this channel
                }
            });
            
            imageData.push(pixelData); // Add processed pixel to array
        }
    }
}

// Main function to process and display the image with current settings
function processImage() {
    if (!displayImg) return; // Exit if no image loaded
    
    // Re-extract data in case grid size changed
    extractImageData();
    
    // Clear canvas with paper color
    background(245, 240, 230);
    
    // Calculate centering offsets to center image on canvas
    const offsetX = (width - displayImg.width) / 2;
    const offsetY = (height - displayImg.height) / 2;
    
    // Set blend mode based on user selection
    if (params.blendMode === 'source') {
        // SOURCE mode: direct RGB reconstruction without p5.js blend modes
        // We'll draw each channel to separate buffers and combine them manually
        blendMode(BLEND); // Use normal blend for final composite
    } else {
        // Apply selected p5.js blend mode
        switch(params.blendMode) {
            case 'multiply':
                blendMode(MULTIPLY); // Multiply blend (darkens)
                break;
            case 'screen':
                blendMode(SCREEN); // Screen blend (lightens)
                break;
            case 'overlay':
                blendMode(OVERLAY); // Overlay blend
                break;
            default:
                blendMode(BLEND); // Normal blend
        }
    }
    
    // Draw each channel
    if (params.blendMode === 'source') {
        // SOURCE mode: draw all channels to buffers and combine pixel-by-pixel
        drawChannelsSource(offsetX, offsetY);
    } else {
        // Standard blend modes: draw each channel directly with p5.js blend mode
        params.channels.forEach(channel => {
            drawChannel(channel, channel.offsetX, channel.offsetY, channel.pattern, 
                       channel.angle, channel.opacity, offsetX, offsetY);
        });
    }
    
    blendMode(BLEND); // Reset to normal blend mode
}

// Function to draw all channels in SOURCE mode (manual RGB combination)
function drawChannelsSource(offsetX, offsetY) {
    // Create separate graphics buffers for each channel
    const buffers = params.channels.map(() => createGraphics(width, height));
    
    // Clear all buffers to black
    buffers.forEach(buffer => buffer.background(0));
    
    // Draw each channel to its dedicated buffer
    params.channels.forEach((channel, index) => {
        drawChannelToBuffer(buffers[index], channel, channel.offsetX, channel.offsetY, 
                           channel.pattern, channel.angle, channel.opacity, offsetX, offsetY);
    });
    
    // Load pixels from all buffers for manual combination
    loadPixels(); // Load main canvas pixels
    buffers.forEach(buffer => buffer.loadPixels()); // Load each buffer's pixels
    
    // Combine channels pixel by pixel using additive color mixing
    for (let i = 0; i < pixels.length; i += 4) { // Step by 4 (RGBA)
        let r = 0, g = 0, b = 0; // Initialize RGB accumulators
        
        // Sum contributions from all channels
        params.channels.forEach((channel, index) => {
            const bufferR = buffers[index].pixels[i]; // Red from this buffer
            const bufferG = buffers[index].pixels[i + 1]; // Green
            const bufferB = buffers[index].pixels[i + 2]; // Blue
            
            r += bufferR; // Add to red accumulator
            g += bufferG; // Add to green
            b += bufferB; // Add to blue
        });
        
        // Clamp values to valid range (0-255)
        pixels[i] = min(r, 255); // Red
        pixels[i + 1] = min(g, 255); // Green
        pixels[i + 2] = min(b, 255); // Blue
        pixels[i + 3] = 255; // Alpha (fully opaque)
    }
    
    updatePixels(); // Write modified pixels back to canvas
    
    // Clean up buffers to free memory
    buffers.forEach(buffer => buffer.remove());
}

// Function to draw a single channel to a graphics buffer
function drawChannelToBuffer(buffer, channel, centerX, centerY, patternType, angle, opacity, offsetX, offsetY) {
    const angleRad = radians(angle); // Convert angle to radians
    
    buffer.noFill(); // No fill for patterns (except where explicitly set)
    buffer.strokeWeight(1.5); // Line width for patterns
    
    // Draw pattern for each pixel in imageData
    imageData.forEach(pixel => {
        // Get intensity for this channel
        const intensity = pixel.channels[channel.id];
        
        // Skip if intensity is too low (optimization)
        if (intensity < 5) return;
        
        // Calculate position with offset and centering
        const x = pixel.x + offsetX + centerX;
        const y = pixel.y + offsetY + centerY;
        
        // Set color based on channel color and intensity
        const channelRgb = hexToRgb(channel.color); // Get RGB components
        const colorValue = map(intensity, 0, 255, 0, 255) * (opacity / 255); // Apply opacity
        const r = (channelRgb.r / 255) * colorValue; // Calculate red component
        const g = (channelRgb.g / 255) * colorValue; // Green
        const b = (channelRgb.b / 255) * colorValue; // Blue
        
        buffer.stroke(r, g, b); // Set stroke color
        buffer.fill(r, g, b); // Set fill color
        
        // Draw pattern based on type
        switch(patternType) {
            case 'circles':
                const radius = map(intensity, 0, 255, 0, params.gridSize * 0.8);
                buffer.circle(x, y, radius);
                break;
                
            case 'lines':
                const lineLength = map(intensity, 0, 255, 0, params.gridSize * 1.2);
                buffer.push();
                buffer.translate(x, y);
                buffer.rotate(angleRad);
                buffer.line(-lineLength/2, 0, lineLength/2, 0);
                buffer.pop();
                break;
                
            case 'crosses':
                const crossLength = map(intensity, 0, 255, 0, params.gridSize * 1.2);
                buffer.push();
                buffer.translate(x, y);
                buffer.rotate(angleRad);
                buffer.line(-crossLength/2, 0, crossLength/2, 0); // Horizontal
                buffer.line(0, -crossLength/2, 0, crossLength/2); // Vertical
                buffer.pop();
                break;
                
            case 'dots':
                const dotSize = map(intensity, 0, 255, 0, params.gridSize * 0.6);
                buffer.rect(x - dotSize/2, y - dotSize/2, dotSize, dotSize);
                break;
                
            case 'grain':
                const grainDensity = map(intensity, 0, 255, 0, 8);
                for (let i = 0; i < grainDensity; i++) {
                    const px = x + random(-params.gridSize/2, params.gridSize/2);
                    const py = y + random(-params.gridSize/2, params.gridSize/2);
                    const grainSize = random(0.5, 2);
                    buffer.circle(px, py, grainSize);
                }
                break;
        }
    });
}

// Function to draw a single channel directly to main canvas (for non-SOURCE blend modes)
function drawChannel(channel, centerX, centerY, patternType, angle, opacity, offsetX, offsetY) {
    const angleRad = radians(angle); // Convert angle to radians
    
    noFill(); // No fill by default
    strokeWeight(1.5); // Line width
    
    // Draw pattern for each pixel
    imageData.forEach(pixel => {
        // Get intensity for this channel
        const intensity = pixel.channels[channel.id];
        
        // Skip if intensity is too low
        if (intensity < 5) return;
        
        // Calculate position with offset and centering
        const x = pixel.x + offsetX + centerX;
        const y = pixel.y + offsetY + centerY;
        
        // Set color based on channel color and opacity
        const channelRgb = hexToRgb(channel.color);
        const channelColor = color(channelRgb.r, channelRgb.g, channelRgb.b, opacity); // p5.js color with alpha
        
        // Set color
        stroke(channelColor);
        fill(channelColor);
        
        // Draw pattern using patterns object
        const patternFunc = patterns[patternType];
        if (patternFunc) {
            patternFunc(x, y, params.gridSize, intensity, angleRad);
        }
    });
}

// Function to export the image as PNG at original resolution
function saveImage() {
    if (!img || !displayImg) {
        alert('Carica prima un\'immagine!'); // "Load an image first!" in Italian
        return;
    }
    
    // Calculate scale factor between original and display
    const scaleFactor = img.width / displayImg.width;
    
    // Safety check for valid scale factor
    if (!scaleFactor || scaleFactor <= 0 || isNaN(scaleFactor)) {
        console.error('Invalid scale factor:', scaleFactor);
        alert('Errore nel calcolo della scala. Riprova.'); // "Error calculating scale. Try again."
        return;
    }
    
    // Log export information
    console.log('Export info:', {
        originalSize: `${img.width}x${img.height}`,
        displaySize: `${displayImg.width}x${displayImg.height}`,
        scaleFactor: scaleFactor,
        gridSize: params.gridSize
    });
    
    // Extract data from ORIGINAL image at full resolution
    let originalImageData = [];
    img.loadPixels(); // Load original image pixels
    // Sample at same grid as display, but map to original coordinates
    for (let y = 0; y < displayImg.height; y += params.gridSize) {
        for (let x = 0; x < displayImg.width; x += params.gridSize) {
            const origX = Math.floor(x * scaleFactor); // Scale x to original size
            const origY = Math.floor(y * scaleFactor); // Scale y to original size
            const idx = (origX + origY * img.width) * 4; // Calculate pixel index
            
            // Store pixel data with original coordinates
            const pixelData = {
                x: origX,
                y: origY,
                r: img.pixels[idx],
                g: img.pixels[idx + 1],
                b: img.pixels[idx + 2],
                channels: {} // Will store intensity per channel
            };
            
            // Calculate intensity for each channel (same logic as extractImageData)
            params.channels.forEach(channel => {
                const channelRgb = hexToRgb(channel.color);
                const colorWeight = (channelRgb.r + channelRgb.g + channelRgb.b) / 765;
                
                if (colorWeight === 0) {
                    pixelData.channels[channel.id] = 0;
                } else {
                    const rContrib = (pixelData.r / 255) * (channelRgb.r / 255);
                    const gContrib = (pixelData.g / 255) * (channelRgb.g / 255);
                    const bContrib = (pixelData.b / 255) * (channelRgb.b / 255);
                    const intensity = ((rContrib + gContrib + bContrib) / 3) * 255;
                    pixelData.channels[channel.id] = intensity;
                }
            });
            
            originalImageData.push(pixelData);
        }
    }
    
    // Temporarily resize canvas to original image size for export
    const originalW = width; // Store current width
    const originalH = height; // Store current height
    
    resizeCanvas(img.width, img.height); // Resize to original dimensions
    
    // Draw on main canvas at full resolution
    background(245, 240, 230);
    
    // Set blend mode
    if (params.blendMode === 'source') {
        blendMode(BLEND);
    } else {
        switch(params.blendMode) {
            case 'multiply':
                blendMode(MULTIPLY);
                break;
            case 'screen':
                blendMode(SCREEN);
                break;
            case 'overlay':
                blendMode(OVERLAY);
                break;
            default:
                blendMode(BLEND);
        }
    }
    
    // Scale parameters for export (grid size and stroke weight)
    const exportGridSize = params.gridSize * scaleFactor;
    const exportStrokeWeight = 1.5 * scaleFactor;
    
    // Draw channels based on blend mode
    if (params.blendMode === 'source') {
        drawChannelsSourceExport(originalImageData, scaleFactor, exportGridSize, exportStrokeWeight);
    } else {
        params.channels.forEach(channel => {
            drawChannelFromDataNew(originalImageData, channel, scaleFactor, exportGridSize, exportStrokeWeight);
        });
    }
    
    blendMode(BLEND); // Reset blend mode
    
    // Save canvas as PNG
    saveCanvas('raster-print', 'png');
    
    // Restore original canvas size
    resizeCanvas(originalW, originalH);
    
    // Redraw at display size
    processImage();
}

// Function to draw all channels in SOURCE mode for export
function drawChannelsSourceExport(data, scaleFactor, gridSize, strokeW) {
    // Create separate graphics buffers for each channel at export size
    const buffers = params.channels.map(() => createGraphics(img.width, img.height));
    
    // Clear all buffers to black
    buffers.forEach(buffer => buffer.background(0));
    
    // Draw each channel to its buffer
    params.channels.forEach((channel, index) => {
        drawChannelToBufferExport(buffers[index], data, channel, scaleFactor, gridSize, strokeW);
    });
    
    // Load pixels from all buffers and main canvas
    loadPixels();
    buffers.forEach(buffer => buffer.loadPixels());
    
    // Combine channels pixel by pixel
    for (let i = 0; i < pixels.length; i += 4) {
        let r = 0, g = 0, b = 0;
        
        // Sum contributions from all buffers
        buffers.forEach(buffer => {
            r += buffer.pixels[i];
            g += buffer.pixels[i + 1];
            b += buffer.pixels[i + 2];
        });
        
        // Clamp to valid range
        pixels[i] = min(r, 255);
        pixels[i + 1] = min(g, 255);
        pixels[i + 2] = min(b, 255);
        pixels[i + 3] = 255; // Full opacity
    }
    
    updatePixels();
    
    // Clean up buffers
    buffers.forEach(buffer => buffer.remove());
}

// Function to draw a single channel to buffer for export
function drawChannelToBufferExport(buffer, data, channel, scaleFactor, gridSize, strokeW) {
    const angleRad = radians(channel.angle);
    const offsetX = channel.offsetX * scaleFactor; // Scale offset
    const offsetY = channel.offsetY * scaleFactor;
    
    buffer.noFill();
    buffer.strokeWeight(strokeW);
    
    // Draw pattern for each pixel
    data.forEach(pixel => {
        const intensity = pixel.channels[channel.id];
        
        if (intensity < 5) return; // Skip low intensity
        
        const x = pixel.x + offsetX;
        const y = pixel.y + offsetY;
        
        // Calculate color with intensity and opacity
        const channelRgb = hexToRgb(channel.color);
        const colorValue = map(intensity, 0, 255, 0, 255) * (channel.opacity / 255);
        const r = (channelRgb.r / 255) * colorValue;
        const g = (channelRgb.g / 255) * colorValue;
        const b = (channelRgb.b / 255) * colorValue;
        
        buffer.stroke(r, g, b);
        buffer.fill(r, g, b);
        
        // Draw pattern with scaled grid size
        switch(channel.pattern) {
            case 'circles':
                const radius = map(intensity, 0, 255, 0, gridSize * 0.8);
                buffer.circle(x, y, radius);
                break;
                
            case 'lines':
                const lineLength = map(intensity, 0, 255, 0, gridSize * 1.2);
                buffer.push();
                buffer.translate(x, y);
                buffer.rotate(angleRad);
                buffer.line(-lineLength/2, 0, lineLength/2, 0);
                buffer.pop();
                break;
                
            case 'crosses':
                const crossLength = map(intensity, 0, 255, 0, gridSize * 1.2);
                buffer.push();
                buffer.translate(x, y);
                buffer.rotate(angleRad);
                buffer.line(-crossLength/2, 0, crossLength/2, 0);
                buffer.line(0, -crossLength/2, 0, crossLength/2);
                buffer.pop();
                break;
                
            case 'dots':
                const dotSize = map(intensity, 0, 255, 0, gridSize * 0.6);
                buffer.rect(x - dotSize/2, y - dotSize/2, dotSize, dotSize);
                break;
                
            case 'grain':
                const grainDensity = map(intensity, 0, 255, 0, 8);
                for (let i = 0; i < grainDensity; i++) {
                    const px = x + random(-gridSize/2, gridSize/2);
                    const py = y + random(-gridSize/2, gridSize/2);
                    const grainSize = random(0.5 * (gridSize/8), 2 * (gridSize/8));
                    buffer.circle(px, py, grainSize);
                }
                break;
        }
    });
}

// Function to draw a single channel for export (non-SOURCE modes)
function drawChannelFromDataNew(data, channel, scaleFactor, gridSize, strokeW) {
    const angleRad = radians(channel.angle);
    const offsetX = channel.offsetX * scaleFactor;
    const offsetY = channel.offsetY * scaleFactor;
    
    noFill();
    strokeWeight(strokeW);
    
    // Draw pattern for each pixel
    data.forEach(pixel => {
        const intensity = pixel.channels[channel.id];
        
        if (intensity < 5) return;
        
        const x = pixel.x + offsetX;
        const y = pixel.y + offsetY;
        
        // Create p5.js color with alpha
        const channelRgb = hexToRgb(channel.color);
        const channelColor = color(channelRgb.r, channelRgb.g, channelRgb.b, channel.opacity);
        
        stroke(channelColor);
        fill(channelColor);
        
        // Draw pattern with scaled grid size
        switch(channel.pattern) {
            case 'circles':
                const radius = map(intensity, 0, 255, 0, gridSize * 0.8);
                circle(x, y, radius);
                break;
                
            case 'lines':
                const lineLength = map(intensity, 0, 255, 0, gridSize * 1.2);
                push();
                translate(x, y);
                rotate(angleRad);
                line(-lineLength/2, 0, lineLength/2, 0);
                pop();
                break;
                
            case 'crosses':
                const crossLength = map(intensity, 0, 255, 0, gridSize * 1.2);
                push();
                translate(x, y);
                rotate(angleRad);
                line(-crossLength/2, 0, crossLength/2, 0);
                line(0, -crossLength/2, 0, crossLength/2);
                pop();
                break;
                
            case 'dots':
                const dotSize = map(intensity, 0, 255, 0, gridSize * 0.6);
                rect(x - dotSize/2, y - dotSize/2, dotSize, dotSize);
                break;
                
            case 'grain':
                const grainDensity = map(intensity, 0, 255, 0, 8);
                for (let i = 0; i < grainDensity; i++) {
                    const px = x + random(-gridSize/2, gridSize/2);
                    const py = y + random(-gridSize/2, gridSize/2);
                    const grainSize = random(0.5 * (gridSize/8), 2 * (gridSize/8));
                    circle(px, py, grainSize);
                }
                break;
        }
    });
}

// Function to export the image as SVG at original resolution
function saveImageSVG() {
    if (!img || !displayImg) {
        alert('Carica prima un\'immagine!'); // "Load an image first!"
        return;
    }
    
    // Calculate scale factor between original and display
    const scaleFactor = img.width / displayImg.width;
    
    // Safety check
    if (!scaleFactor || scaleFactor <= 0 || isNaN(scaleFactor)) {
        console.error('Invalid scale factor:', scaleFactor);
        alert('Errore nel calcolo della scala. Riprova.'); // "Error calculating scale"
        return;
    }
    
    // Log export information
    console.log('SVG Export info:', {
        originalSize: `${img.width}x${img.height}`,
        displaySize: `${displayImg.width}x${displayImg.height}`,
        scaleFactor: scaleFactor,
        gridSize: params.gridSize
    });
    
    // Extract data from ORIGINAL image
    let originalImageData = [];
    img.loadPixels();
    for (let y = 0; y < displayImg.height; y += params.gridSize) {
        for (let x = 0; x < displayImg.width; x += params.gridSize) {
            const origX = Math.floor(x * scaleFactor);
            const origY = Math.floor(y * scaleFactor);
            const idx = (origX + origY * img.width) * 4;
            
            const pixelData = {
                x: origX,
                y: origY,
                r: img.pixels[idx],
                g: img.pixels[idx + 1],
                b: img.pixels[idx + 2],
                channels: {}
            };
            
            // Calculate intensity for each channel
            params.channels.forEach(channel => {
                const channelRgb = hexToRgb(channel.color);
                const colorWeight = (channelRgb.r + channelRgb.g + channelRgb.b) / 765;
                
                if (colorWeight === 0) {
                    pixelData.channels[channel.id] = 0;
                } else {
                    const rContrib = (pixelData.r / 255) * (channelRgb.r / 255);
                    const gContrib = (pixelData.g / 255) * (channelRgb.g / 255);
                    const bContrib = (pixelData.b / 255) * (channelRgb.b / 255);
                    const intensity = ((rContrib + gContrib + bContrib) / 3) * 255;
                    pixelData.channels[channel.id] = intensity;
                }
            });
            
            originalImageData.push(pixelData);
        }
    }
    
    // Scale parameters for export
    const exportGridSize = params.gridSize * scaleFactor;
    const exportStrokeWeight = 1.5 * scaleFactor;
    
    // Build SVG string
    let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${img.width}" height="${img.height}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${img.width} ${img.height}">
`; // SVG header with dimensions and namespace
    
    // Add background - black for source mode, beige for others
    if (params.blendMode === 'source') {
        svg += `  <rect width="${img.width}" height="${img.height}" fill="rgb(0, 0, 0)"/>\n`; // Black background
    } else {
        svg += `  <rect width="${img.width}" height="${img.height}" fill="rgb(245, 240, 230)"/>\n`; // Beige background
    }
    
    // Create groups for each channel based on blend mode
    if (params.blendMode === 'source') {
        // For SOURCE mode, use lighten blend in SVG
        params.channels.forEach((channel, index) => {
            svg += `  <g id="channel-${index}" style="mix-blend-mode: lighten">\n`; // Group with lighten blend
            svg += generateSVGChannelNew(originalImageData, channel, scaleFactor, exportGridSize, exportStrokeWeight, true); // Generate SVG shapes
            svg += `  </g>\n`; // Close group
        });
    } else {
        // For standard blend modes
        const svgBlendMode = getSVGBlendMode(params.blendMode); // Convert to SVG blend mode name
        
        params.channels.forEach((channel, index) => {
            svg += `  <g id="channel-${index}" style="mix-blend-mode: ${svgBlendMode}">\n`; // Group with blend mode
            svg += generateSVGChannelNew(originalImageData, channel, scaleFactor, exportGridSize, exportStrokeWeight, false); // Generate shapes
            svg += `  </g>\n`; // Close group
        });
    }
    
    svg += `</svg>`; // Close SVG tag
    
    // Download SVG file
    const blob = new Blob([svg], { type: 'image/svg+xml' }); // Create blob with SVG content
    const url = URL.createObjectURL(blob); // Create temporary URL
    const link = document.createElement('a'); // Create download link
    link.href = url;
    link.download = 'raster-print.svg'; // Set filename
    link.click(); // Trigger download
    URL.revokeObjectURL(url); // Clean up temporary URL
    
    console.log('SVG exported successfully!');
}

// Helper function to convert blend mode names to SVG equivalents
function getSVGBlendMode(mode) {
    const modeMap = {
        'multiply': 'multiply',
        'screen': 'screen',
        'overlay': 'overlay',
        'normal': 'normal',
        'source': 'normal'
    };
    return modeMap[mode] || 'normal'; // Return mapped mode or default to normal
}

// Function to generate SVG markup for a single channel
function generateSVGChannelNew(data, channel, scaleFactor, gridSize, strokeW, isSourceMode) {
    let svgContent = ''; // String to accumulate SVG markup
    const angleRad = radians(channel.angle); // Convert angle to radians
    const offsetX = channel.offsetX * scaleFactor; // Scale offset
    const offsetY = channel.offsetY * scaleFactor;
    const opacityValue = channel.opacity / 255; // Normalize opacity to 0-1 for SVG
    const channelRgb = hexToRgb(channel.color); // Get RGB components
    
    // Process each pixel
    data.forEach(pixel => {
        const intensity = pixel.channels[channel.id]; // Get intensity for this channel
        
        if (intensity < 5) return; // Skip low intensity pixels
        
        const x = pixel.x + offsetX; // Calculate final x position
        const y = pixel.y + offsetY; // Calculate final y position
        
        // Determine color based on mode
        let color;
        if (isSourceMode) {
            // In SOURCE mode, each channel contributes only its color component
            // Color is modulated by intensity
            const colorValue = Math.round((intensity / 255) * 255 * opacityValue);
            color = `rgb(${Math.round(channelRgb.r * colorValue / 255)}, ${Math.round(channelRgb.g * colorValue / 255)}, ${Math.round(channelRgb.b * colorValue / 255)})`;
        } else {
            // Standard blend modes use full channel color, opacity handled separately
            color = `rgb(${channelRgb.r}, ${channelRgb.g}, ${channelRgb.b})`;
        }
        
        // Generate SVG elements based on pattern type
        switch(channel.pattern) {
            case 'circles':
                const radius = map(intensity, 0, 255, 0, gridSize * 0.8) / 2; // Calculate radius (divide by 2 because p5.js uses diameter)
                if (isSourceMode) {
                    // Source mode: color contains opacity, no separate opacity attribute
                    svgContent += `    <circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="${radius.toFixed(2)}" fill="${color}"/>\n`;
                } else {
                    // Standard mode: separate opacity attribute
                    svgContent += `    <circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="${radius.toFixed(2)}" fill="${color}" opacity="${opacityValue}"/>\n`;
                }
                break;
                
            case 'lines':
                const lineLength = map(intensity, 0, 255, 0, gridSize * 1.2); // Calculate line length
                // Calculate line endpoints using trigonometry
                const x1 = x + Math.cos(angleRad) * (-lineLength/2);
                const y1 = y + Math.sin(angleRad) * (-lineLength/2);
                const x2 = x + Math.cos(angleRad) * (lineLength/2);
                const y2 = y + Math.sin(angleRad) * (lineLength/2);
                if (isSourceMode) {
                    svgContent += `    <line x1="${x1.toFixed(2)}" y1="${y1.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}" stroke="${color}" stroke-width="${strokeW}"/>\n`;
                } else {
                    svgContent += `    <line x1="${x1.toFixed(2)}" y1="${y1.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}" stroke="${color}" stroke-width="${strokeW}" opacity="${opacityValue}"/>\n`;
                }
                break;
                
            case 'crosses':
                const crossLength = map(intensity, 0, 255, 0, gridSize * 1.2); // Calculate cross arm length
                // Horizontal line endpoints
                const cx1 = x + Math.cos(angleRad) * (-crossLength/2);
                const cy1 = y + Math.sin(angleRad) * (-crossLength/2);
                const cx2 = x + Math.cos(angleRad) * (crossLength/2);
                const cy2 = y + Math.sin(angleRad) * (crossLength/2);
                if (isSourceMode) {
                    svgContent += `    <line x1="${cx1.toFixed(2)}" y1="${cy1.toFixed(2)}" x2="${cx2.toFixed(2)}" y2="${cy2.toFixed(2)}" stroke="${color}" stroke-width="${strokeW}"/>\n`;
                } else {
                    svgContent += `    <line x1="${cx1.toFixed(2)}" y1="${cy1.toFixed(2)}" x2="${cx2.toFixed(2)}" y2="${cy2.toFixed(2)}" stroke="${color}" stroke-width="${strokeW}" opacity="${opacityValue}"/>\n`;
                }
                // Vertical line (perpendicular to horizontal)
                const angleRad90 = angleRad + Math.PI/2; // Add 90 degrees
                const vx1 = x + Math.cos(angleRad90) * (-crossLength/2);
                const vy1 = y + Math.sin(angleRad90) * (-crossLength/2);
                const vx2 = x + Math.cos(angleRad90) * (crossLength/2);
                const vy2 = y + Math.sin(angleRad90) * (crossLength/2);
                if (isSourceMode) {
                    svgContent += `    <line x1="${vx1.toFixed(2)}" y1="${vy1.toFixed(2)}" x2="${vx2.toFixed(2)}" y2="${vy2.toFixed(2)}" stroke="${color}" stroke-width="${strokeW}"/>\n`;
                } else {
                    svgContent += `    <line x1="${vx1.toFixed(2)}" y1="${vy1.toFixed(2)}" x2="${vx2.toFixed(2)}" y2="${vy2.toFixed(2)}" stroke="${color}" stroke-width="${strokeW}" opacity="${opacityValue}"/>\n`;
                }
                break;
                
            case 'dots':
                const dotSize = map(intensity, 0, 255, 0, gridSize * 0.6); // Calculate dot size
                if (isSourceMode) {
                    svgContent += `    <rect x="${(x - dotSize/2).toFixed(2)}" y="${(y - dotSize/2).toFixed(2)}" width="${dotSize.toFixed(2)}" height="${dotSize.toFixed(2)}" fill="${color}"/>\n`;
                } else {
                    svgContent += `    <rect x="${(x - dotSize/2).toFixed(2)}" y="${(y - dotSize/2).toFixed(2)}" width="${dotSize.toFixed(2)}" height="${dotSize.toFixed(2)}" fill="${color}" opacity="${opacityValue}"/>\n`;
                }
                break;
                
            case 'grain':
                const grainDensity = map(intensity, 0, 255, 0, 8); // Number of grain particles
                for (let i = 0; i < grainDensity; i++) {
                    // Random position within grid cell
                    const px = x + random(-gridSize/2, gridSize/2);
                    const py = y + random(-gridSize/2, gridSize/2);
                    // Random size for particle
                    const grainSize = random(0.5 * (gridSize/8), 2 * (gridSize/8)) / 2;
                    if (isSourceMode) {
                        svgContent += `    <circle cx="${px.toFixed(2)}" cy="${py.toFixed(2)}" r="${grainSize.toFixed(2)}" fill="${color}"/>\n`;
                    } else {
                        svgContent += `    <circle cx="${px.toFixed(2)}" cy="${py.toFixed(2)}" r="${grainSize.toFixed(2)}" fill="${color}" opacity="${opacityValue}"/>\n`;
                    }
                }
                break;
        }
    });
    
    return svgContent; // Return accumulated SVG markup
}

// p5.js draw function - called automatically every frame
function draw() {
    // Static render - only updates on parameter changes
    // We don't need continuous drawing, so this function is essentially empty
}