// WUP 25-26
// Andrea Ghirardi

// ============================================
// CHEMICAL REACTOR
// Gray-Scott Reaction-Diffusion Algorithm
// ============================================

// ============================================
// SIMULATION GRIDS
// ============================================
// Using Float32Array for optimal performance
let gridA, gridB;      // Current concentration grids for chemicals A and B
let nextA, nextB;      // Next generation grids (double buffering)
let gridWidth, gridHeight; // Grid dimensions (scaled down from canvas)
let gridSize;          // Total number of cells (width * height)

// ============================================
// SIMULATION PARAMETERS
// ============================================
let params = {
    // Gray-Scott reaction parameters
    feedRate: 0.055,    // Rate at which chemical A is added
    killRate: 0.062,    // Rate at which chemical B is removed
    diffusionA: 1.0,    // Diffusion rate of chemical A
    diffusionB: 0.5,    // Diffusion rate of chemical B
    
    // Performance settings
    resolution: 'Medium',  // Grid resolution: Low, Medium, High
    simSpeed: 1,           // Simulation steps per frame (1-5)
    
    // Brush settings
    brushRadius: 20,       // Size of the brush
    brushDensity: 1.0,     // Amount of chemical B deposited
    velocityEffect: 0.3,   // How much mouse speed affects brush (0-1)
    
    // Visual settings
    backgroundColor: '#0a0a0a',  // Canvas background color
    chemicalColor: '#00ff9f',    // Chemical B color
    colorMode: 'Neon Glow',      // Color preset mode
    halftone: false,             // Enable halftone/dithering effect
    ditherStrength: 0.5          // Dithering intensity (0-1)
};

// Store default values for reset functionality
let defaultParams = {
    feedRate: 0.055,
    killRate: 0.062,
    diffusionA: 1.0,
    diffusionB: 0.5,
    resolution: 'Medium',
    simSpeed: 1,
    brushRadius: 20,
    brushDensity: 1.0,
    velocityEffect: 0.3,
    backgroundColor: '#0a0a0a',
    chemicalColor: '#00ff9f',
    colorMode: 'Neon Glow',
    halftone: false,
    ditherStrength: 0.5
};

// ============================================
// MOUSE TRACKING
// ============================================
let prevMouseX = 0;        // Previous mouse X position
let prevMouseY = 0;        // Previous mouse Y position
let mouseVelocity = 0;     // Calculated mouse speed
let lastDepositX = 0;      // Last brush deposit X position
let lastDepositY = 0;      // Last brush deposit Y position
let mouseWasPressed = false; // Track mouse press state
let isSavingImage = false; // Flag to prevent UI drawing during image/GIF save

// ============================================
// PRESET BOOSTING
// ============================================
// Speed boost for faster pattern formation when loading presets
let presetBoostFrames = 0;  // Remaining frames to boost
let originalSimSpeed = 1;   // Store original speed to restore after boost

// ============================================
// GIF RECORDING
// ============================================
let isRecordingGIF = false; // Recording state flag
let gifFrames = [];         // Array storing captured frames
let gifFrameCount = 0;      // Current frame count
let gifSettings = {
    duration: 5,   // Recording duration in seconds
    fps: 30,       // Frames per second
    quality: 10    // GIF quality (1-30, lower is better)
};
let maxGifFrames = gifSettings.duration * gifSettings.fps; // Total frames to capture

// ============================================
// USER INTERFACE
// ============================================
let guiContainer;          // Main GUI container element (left side - parameters)
let actionsGuiContainer;   // Secondary GUI container (right side - actions & export)
let showActionsGUI = false; // Flag to show/hide actions GUI panel (starts collapsed)
let sliders = {};          // Object storing all slider elements
let buttons = {};          // Object storing all button elements
let selects = {};          // Object storing all select/dropdown elements
let showGUI = true;        // GUI visibility flag
let guiBounds = { x: 20, y: 20, width: 300, height: 800 }; // GUI collision area
let isInteractingWithGUI = false; // Flag to prevent brush when over GUI

// ============================================
// P5.JS SETUP FUNCTION
// ============================================
function setup() {
    createCanvas(windowWidth, windowHeight); // Create a fullscreen canvas
    pixelDensity(1); // Set pixel density to 1 for better performance
    
    updateGridSize(); // Calculate grid dimensions based on resolution setting
    initializeGrid(); // Initialize chemical grids with default values
    
    createGUI(); // Create the user interface with all controls
    
    frameRate(30); // Set to 30 frames per second for optimal performance
}

// ============================================
// CREATE GUI FUNCTION
// ============================================
function createGUI() {
    // Create the main GUI container
    guiContainer = createDiv(''); // Create an empty div to contain the GUI
    guiContainer.position(20, 20); // Position the GUI at top-left with margin
    guiContainer.style('background-color', 'rgba(10, 10, 10, 0.95)'); // Semi-transparent black background
    guiContainer.style('border', '2px solid rgba(0, 255, 159, 0.4)'); // Semi-transparent neon green border
    guiContainer.style('border-radius', '8px'); // Rounded corners
    guiContainer.style('padding', '20px'); // Internal spacing
    guiContainer.style('color', '#00ff9f'); // Neon green text color
    guiContainer.style('font-family', 'monospace'); // Monospace font for technical look
    guiContainer.style('font-size', '12px'); // Readable font size
    guiContainer.style('max-height', (height - 40) + 'px'); // Maximum height to fit in window
    guiContainer.style('overflow-y', 'auto'); // Vertical scroll if content exceeds height
    guiContainer.style('width', '300px'); // Fixed panel width
    guiContainer.style('box-shadow', '0 0 30px rgba(0, 255, 159, 0.2)'); // Green glowing shadow
    guiContainer.style('z-index', '1000'); // Top layer to always be visible
    guiContainer.style('pointer-events', 'auto'); // Enable mouse events on GUI
    
    // Prevent clicks on GUI from reaching the canvas
    guiContainer.elt.addEventListener('mousedown', (e) => { // Listen to mousedown events
        e.stopPropagation(); // Block event propagation to canvas
    });
    guiContainer.elt.addEventListener('touchstart', (e) => { // Listen to touch events for mobile
        e.stopPropagation(); // Block propagation for touch devices
    });
    guiContainer.elt.addEventListener('mouseenter', () => { // When mouse enters the GUI
        isInteractingWithGUI = true; // Set flag to disable brush
    });
    guiContainer.elt.addEventListener('mouseleave', () => { // When mouse leaves the GUI
        isInteractingWithGUI = false; // Reset flag to re-enable brush
    });
    
    // Create the GUI title
    let title = createDiv('🧪 REACTOR CONTROLS'); // Create div with title and emoji
    title.style('font-size', '18px'); // Large font size for title
    title.style('font-weight', 'bold'); // Bold text
    title.style('margin-bottom', '20px'); // Space below title
    title.style('text-align', 'center'); // Center the text
    title.style('letter-spacing', '2px'); // Letter spacing for futuristic effect
    title.style('color', '#00ff9f'); // Neon green color
    title.parent(guiContainer); // Add title to GUI container
    
    // INSTRUCTIONS SECTION (at top for easy visibility)
    addSection('INSTRUCTIONS'); // Add instructions section header
    let instructions = createDiv( // Create div with multi-line instructions
        'CLICK + DRAG to deposit Chemical B<br>' + // First instruction line
        'Mouse VELOCITY affects density<br>' + // Second instruction: velocity feature
        'Press 1-9 for presets<br>' + // Third instruction: keyboard shortcuts for presets
        'Press G to hide this panel' // Fourth instruction: how to hide GUI
    );
    instructions.style('font-size', '11px'); // Small readable font for instructions
    instructions.style('line-height', '1.7'); // Line height for better readability
    instructions.style('color', 'rgba(0, 255, 159, 0.7)'); // Semi-transparent green
    instructions.style('margin-top', '5px'); // Small space above instructions
    instructions.style('margin-bottom', '15px'); // Space below instructions before next section
    instructions.parent(guiContainer); // Add instructions to main container
    
    // CHEMICAL PRESETS SECTION
    addSection('CHEMICAL PRESETS'); // Add section header
    
    let presetsGrid = createDiv(''); // Create container for preset grid
    presetsGrid.style('display', 'grid'); // Use CSS Grid for layout
    presetsGrid.style('grid-template-columns', '1fr 1fr 1fr'); // 3 equal columns
    presetsGrid.style('gap', '6px'); // Space between buttons
    presetsGrid.style('margin-bottom', '10px'); // Space below grid
    presetsGrid.parent(guiContainer); // Add grid to main container
    
    let presets = ['Coral', 'Maze', 'Mitosis', 'Worms', 'Waves', 'Spirals', 'Chaos', 'Fingerprint', 'Bubbles']; // Array with all 9 available presets
    presets.forEach(preset => { // Iterate over each preset
        let btn = createButton(preset); // Create a button with preset name
        styleButton(btn); // Apply consistent style to button
        btn.mousePressed(() => loadPreset(preset)); // Load preset when clicked
        btn.parent(presetsGrid); // Add button to grid
        btn.style('width', '100%'); // Full width of grid cell
        btn.style('margin', '0'); // Remove margins for precise fit
        btn.style('font-size', '10px'); // Smaller font to fit 3 columns
        btn.style('padding', '8px 6px'); // Compact padding
    });
    
    // REACTION PARAMETERS SECTION
    addSection('REACTION PARAMETERS'); // Add section header
    sliders.feedRate = addSlider('Feed Rate (f)', 0, 0.1, params.feedRate, 0.001, (val) => { // Create slider for Feed Rate (min: 0, max: 0.1, step: 0.001)
        params.feedRate = val; // Update parameter when slider changes
    });
    sliders.killRate = addSlider('Kill Rate (k)', 0, 0.1, params.killRate, 0.001, (val) => { // Create slider for Kill Rate (min: 0, max: 0.1, step: 0.001)
        params.killRate = val; // Update parameter when slider changes
    });
    sliders.diffusionA = addSlider('Diffusion A', 0, 2, params.diffusionA, 0.01, (val) => { // Create slider for Diffusion A (min: 0, max: 2, step: 0.01)
        params.diffusionA = val; // Update parameter when slider changes
    });
    sliders.diffusionB = addSlider('Diffusion B', 0, 2, params.diffusionB, 0.01, (val) => { // Create slider for Diffusion B (min: 0, max: 2, step: 0.01)
        params.diffusionB = val; // Update parameter when slider changes
    });
    
    // BRUSH SETTINGS SECTION
    addSection('BRUSH SETTINGS'); // Add section header
    sliders.brushRadius = addSlider('Radius', 5, 40, params.brushRadius, 1, (val) => { // Create slider for brush size (min: 5, max: 40, step: 1)
        params.brushRadius = val; // Update parameter when slider changes
    });
    sliders.brushDensity = addSlider('Density', 0.1, 1, params.brushDensity, 0.1, (val) => { // Create slider for brush density (min: 0.1, max: 1, step: 0.1)
        params.brushDensity = val; // Update parameter when slider changes
    });
    sliders.velocityEffect = addSlider('Velocity Effect', 0, 1, params.velocityEffect, 0.1, (val) => { // Create slider for velocity effect (min: 0, max: 1, step: 0.1)
        params.velocityEffect = val; // Update how much mouse velocity affects the brush
    });
    
    // PERFORMANCE SECTION
    addSection('PERFORMANCE'); // Add performance section header
    
    // Resolution dropdown for grid resolution
    addSelect('Resolution', selects, 'resolution', // Create dropdown menu for resolution
        ['Low', 'Medium', 'High'], // Available options: Low, Medium, High
        params.resolution, // Current selected value
        (val) => { // Callback when selection changes
            params.resolution = val; // Update resolution parameter
            updateGridSize(); // Recalculate grid dimensions
            initializeGrid(); // Reinitialize grid with new dimensions
        }
    );
    
    // Performance tip message
    let perfTip = createDiv('💡 Low/Medium recommended for smooth performance'); // Create div with tip
    perfTip.style('font-size', '10px'); // Small font for tip
    perfTip.style('color', 'rgba(0, 255, 159, 0.6)'); // Semi-transparent green color
    perfTip.style('margin-top', '4px'); // Space above tip
    perfTip.style('margin-bottom', '10px'); // Space below tip
    perfTip.style('font-style', 'italic'); // Italic style
    perfTip.parent(guiContainer); // Add to main container
    
    // Simulation speed slider
    sliders.simSpeed = addSlider('Sim Speed', 1, 5, params.simSpeed, 1, (val) => { // Create slider for speed (min: 1, max: 5, step: 1)
        params.simSpeed = val; // Update number of simulation steps per frame
    });
    
    // VISUAL SETTINGS SECTION
    addSection('VISUAL SETTINGS'); // Add visual settings section header
    
    // Color mode dropdown
    addSelect('Color Mode', selects, 'colorMode', // Create dropdown menu for color mode
        ['Neon Glow', 'Heat Map', 'Acid Green', 'Electric Cyan', 'Magmatic Orange'], // 5 available color presets
        params.colorMode, // Current selected mode
        (val) => { // Callback when selection changes
            params.colorMode = val; // Update color mode
            updateColorMode(); // Update background and brush colors to match preset
        }
    );
    
    // BACKGROUND COLOR PICKER
    let bgColorContainer = createDiv(''); // Create container for background color picker
    bgColorContainer.parent(guiContainer); // Add to main container
    bgColorContainer.style('margin-bottom', '15px'); // Space below container
    
    let bgColorLabel = createDiv('Background Color:'); // Create label for color picker
    bgColorLabel.style('font-size', '11px'); // Font size for label
    bgColorLabel.style('color', '#00ff9f'); // Neon green color for label
    bgColorLabel.style('margin-bottom', '6px'); // Space below label
    bgColorLabel.parent(bgColorContainer); // Add label to container
    
    let bgColorPicker = createColorPicker(params.backgroundColor); // Create color picker with current background color
    bgColorPicker.parent(bgColorContainer); // Add to container
    bgColorPicker.style('width', '100%'); // Full width of container
    bgColorPicker.style('height', '35px'); // Height for easy clicking
    bgColorPicker.style('border', '1px solid #00ff9f'); // Neon green border
    bgColorPicker.style('border-radius', '4px'); // Rounded corners
    bgColorPicker.style('cursor', 'pointer'); // Pointer cursor to indicate clickability
    bgColorPicker.input(() => { // Callback when color changes
        params.backgroundColor = bgColorPicker.value(); // Update background color
        // Automatically switch to Neon Glow mode to use custom colors
        if (params.colorMode !== 'Neon Glow') { // If not already in Neon Glow mode
            params.colorMode = 'Neon Glow'; // Switch to Neon Glow mode
            if (selects.colorMode) selects.colorMode.selected('Neon Glow'); // Update dropdown
        }
    });
    sliders.bgColorPicker = bgColorPicker; // Save reference for future updates
    
    // BRUSH/CHEMICAL COLOR PICKER
    let chemColorContainer = createDiv(''); // Create container for brush color picker
    chemColorContainer.parent(guiContainer); // Add to main container
    chemColorContainer.style('margin-bottom', '15px'); // Space below container
    
    let chemColorLabel = createDiv('Brush/Chemical Color:'); // Create label for color picker
    chemColorLabel.style('font-size', '11px'); // Font size for label
    chemColorLabel.style('color', '#00ff9f'); // Neon green color for label
    chemColorLabel.style('margin-bottom', '6px'); // Space below label
    chemColorLabel.parent(chemColorContainer); // Add label to container
    
    let chemColorPicker = createColorPicker(params.chemicalColor); // Create color picker with current chemical color
    chemColorPicker.parent(chemColorContainer); // Add to container
    chemColorPicker.style('width', '100%'); // Full width of container
    chemColorPicker.style('height', '35px'); // Height for easy clicking
    chemColorPicker.style('border', '1px solid #00ff9f'); // Neon green border
    chemColorPicker.style('border-radius', '4px'); // Rounded corners
    chemColorPicker.style('cursor', 'pointer'); // Pointer cursor to indicate clickability
    chemColorPicker.input(() => { // Callback when color changes
        params.chemicalColor = chemColorPicker.value(); // Update chemical/brush color
        // Automatically switch to Neon Glow mode to use custom colors
        if (params.colorMode !== 'Neon Glow') { // If not already in Neon Glow mode
            params.colorMode = 'Neon Glow'; // Switch to Neon Glow mode
            if (selects.colorMode) selects.colorMode.selected('Neon Glow'); // Update dropdown
        }
    });
    sliders.chemColorPicker = chemColorPicker; // Store reference for updates
    
    // Halftone checkbox
    addCheckbox('Halftone', params.halftone, (val) => { // Create checkbox for halftone effect
        params.halftone = val; // Update halftone parameter when toggled
    });
    
    sliders.ditherStrength = addSlider('Dither Strength', 0, 1, params.ditherStrength, 0.1, (val) => { // Create slider for dither strength (min: 0, max: 1, step: 0.1)
        params.ditherStrength = val; // Update dither strength when slider changes
    });
    
    // Update GUI bounds after creation
    updateGUIBounds(); // Calculate GUI collision bounds for brush blocking
    
    // Create the second GUI panel for actions and export
    createActionsGUI(); // Create collapsible actions panel on the right
}

// ============================================
// CREATE ACTIONS GUI FUNCTION
// ============================================
// Creates the secondary collapsible GUI panel for actions and export
function createActionsGUI() {
    // Create container for actions GUI
    actionsGuiContainer = createDiv(''); // Create div for actions GUI container
    actionsGuiContainer.style('position', 'fixed'); // Fixed position for overlay
    actionsGuiContainer.style('top', '20px'); // Distance from top
    actionsGuiContainer.style('right', '20px'); // Position on right side
    actionsGuiContainer.style('width', '280px'); // Fixed width for actions panel
    actionsGuiContainer.style('max-height', (height - 40) + 'px'); // Max height based on window
    actionsGuiContainer.style('overflow-y', 'auto'); // Scrollable if content overflows
    actionsGuiContainer.style('background', 'rgba(10, 10, 10, 0.95)'); // Dark background with high opacity
    actionsGuiContainer.style('border', '2px solid #00ff9f'); // Neon green border
    actionsGuiContainer.style('border-radius', '10px'); // Rounded corners
    actionsGuiContainer.style('padding', '15px'); // Internal padding
    actionsGuiContainer.style('box-shadow', '0 4px 20px rgba(0, 255, 159, 0.3)'); // Neon glow effect
    actionsGuiContainer.style('z-index', '1000'); // Above everything except main GUI
    actionsGuiContainer.style('backdrop-filter', 'blur(10px)'); // Blur effect for modern look
    actionsGuiContainer.style('font-family', 'monospace'); // Monospace font
    actionsGuiContainer.style('font-size', '12px'); // Base font size
    actionsGuiContainer.style('color', '#00ff9f'); // Neon green text
    
    // Prevent brush drawing when interacting with actions GUI
    actionsGuiContainer.elt.addEventListener('mousedown', (e) => { // When mouse is pressed on the actions GUI
        e.stopPropagation(); // Stop event from bubbling up
        isInteractingWithGUI = true; // Set flag to disable brush
    });
    actionsGuiContainer.elt.addEventListener('touchstart', (e) => { // When touch starts on the actions GUI (mobile)
        e.stopPropagation(); // Stop event from bubbling up
        isInteractingWithGUI = true; // Set flag to disable brush
    });
    actionsGuiContainer.elt.addEventListener('mouseenter', () => { // When mouse enters the actions GUI
        isInteractingWithGUI = true; // Set flag to disable brush
    });
    actionsGuiContainer.elt.addEventListener('mouseleave', () => { // When mouse leaves the actions GUI
        isInteractingWithGUI = false; // Reset flag to re-enable brush
    });
    
    // Create collapsible header
    let header = createDiv(''); // Create header container
    header.style('display', 'flex'); // Use flexbox
    header.style('justify-content', 'space-between'); // Space between title and button
    header.style('align-items', 'center'); // Vertical alignment
    header.style('margin-bottom', '15px'); // Space below header
    header.style('cursor', 'pointer'); // Pointer cursor for clickability
    header.parent(actionsGuiContainer); // Add to actions GUI
    
    let headerTitle = createDiv('⚡ ACTIONS & EXPORT'); // Create title with emoji
    headerTitle.style('font-size', '16px'); // Larger font for title
    headerTitle.style('font-weight', 'bold'); // Bold text
    headerTitle.style('letter-spacing', '1.5px'); // Letter spacing
    headerTitle.style('color', '#00ff9f'); // Neon green
    headerTitle.parent(header); // Add to header
    
    let collapseBtn = createDiv('▶'); // Create collapse button with right arrow (starts collapsed)
    collapseBtn.style('font-size', '14px'); // Medium size
    collapseBtn.style('color', '#00ff9f'); // Neon green
    collapseBtn.style('cursor', 'pointer'); // Pointer cursor
    collapseBtn.style('user-select', 'none'); // Prevent text selection
    collapseBtn.parent(header); // Add to header
    
    // Create content container (collapsible)
    let actionsContent = createDiv(''); // Create content container
    actionsContent.id('actionsContent'); // Set ID for easy access
    actionsContent.style('display', 'none'); // Start hidden (collapsed state)
    actionsContent.parent(actionsGuiContainer); // Add to actions GUI
    
    // Toggle collapse on header click
    header.mousePressed(() => { // When header is clicked
        showActionsGUI = !showActionsGUI; // Toggle visibility flag
        if (showActionsGUI) { // If showing
            actionsContent.style('display', 'block'); // Show content
            collapseBtn.html('▼'); // Down arrow
        } else { // If hiding
            actionsContent.style('display', 'none'); // Hide content
            collapseBtn.html('▶'); // Right arrow
        }
    });
    
    // Helper function to add sections to actions GUI
    function addActionSection(title) {
        let section = createDiv(title); // Create div with section title text
        section.style('margin-top', '20px'); // Space above section for separation
        section.style('margin-bottom', '12px'); // Space below section before content
        section.style('font-weight', 'bold'); // Bold text for emphasis
        section.style('font-size', '12px'); // Slightly larger than body text
        section.style('color', '#00ff9f'); // Neon green color
        section.style('border-bottom', '1px solid rgba(0, 255, 159, 0.3)'); // Bottom border for visual separation
        section.style('padding-bottom', '6px'); // Space between text and border
        section.style('letter-spacing', '1px'); // Letter spacing for modern look
        section.parent(actionsContent); // Add section to actions content
        return section; // Return section element
    }
    
    // GIF RECORDING SETTINGS SECTION
    addActionSection('GIF RECORDING'); // Add GIF recording section header
    
    sliders.gifDuration = addSlider('Duration (seconds)', 1, 60, gifSettings.duration, 1, (val) => { // Create slider for GIF duration (min: 1s, max: 60s, step: 1)
        gifSettings.duration = val; // Update GIF duration setting
        // Update button text to reflect new duration
        if (buttons.gifBtn) { // Check if GIF button exists
            buttons.gifBtn.html(`🎬 Record GIF (${gifSettings.duration}s)`); // Update button text with new duration
        }
    }, actionsContent); // Pass actionsContent as parent
    
    sliders.gifFPS = addSlider('FPS', 10, 60, gifSettings.fps, 5, (val) => { // Create slider for GIF FPS (min: 10, max: 60, step: 5)
        gifSettings.fps = val; // Update GIF frames per second setting
    }, actionsContent); // Pass actionsContent as parent
    
    // GIF recording info text with warning
    let gifInfo = createDiv('💡 Creates a single animated GIF file<br>⚠️ Long durations or high FPS may take time to process'); // Create info div with two-line message
    gifInfo.style('font-size', '10px'); // Small font for info text
    gifInfo.style('color', 'rgba(0, 255, 159, 0.6)'); // Semi-transparent green color
    gifInfo.style('margin-top', '8px'); // Space above info text
    gifInfo.style('margin-bottom', '10px'); // Space below info text
    gifInfo.style('font-style', 'italic'); // Italic style
    gifInfo.style('line-height', '1.5'); // Line height for readability
    gifInfo.parent(actionsContent); // Add to actions content
    
    // ACTIONS SECTION
    addActionSection('ACTIONS'); // Add actions section header
    
    let actionsGrid = createDiv(''); // Create container for action buttons grid
    actionsGrid.style('display', 'grid'); // Use CSS Grid for layout
    actionsGrid.style('grid-template-columns', '1fr 1fr'); // Two columns of equal width
    actionsGrid.style('gap', '8px'); // Space between buttons
    actionsGrid.parent(actionsContent); // Add to actions content
    
    let clearBtn = createButton('🗑️ Clear (C)'); // Create clear button with emoji and keyboard shortcut hint
    styleButton(clearBtn); // Apply consistent button style
    clearBtn.mousePressed(() => initializeGrid()); // Reset grid when clicked
    clearBtn.parent(actionsGrid); // Add button to actions grid
    clearBtn.style('width', '100%'); // Full width of grid cell
    clearBtn.style('margin', '0'); // No margin for tight fit
    clearBtn.style('font-size', '10px'); // Smaller font to fit
    
    let saveBtn = createButton('💾 Save (S)'); // Create save button with emoji and keyboard shortcut hint
    styleButton(saveBtn); // Apply consistent button style
    saveBtn.mousePressed(() => { // Define save button behavior
        // Hide GUI temporarily for clean screenshot
        let wasShowing = showGUI; // Store current GUI visibility state
        showGUI = false; // Hide GUI
        isSavingImage = true; // Set flag to prevent Show GUI indicator
        
        // Wait one frame to ensure GUI is hidden, then save
        setTimeout(() => { // Delay execution by 50ms
            saveCanvas('chemical-reactor', 'png'); // Save canvas as PNG file
            // Restore GUI visibility
            showGUI = wasShowing; // Restore original GUI visibility state
            isSavingImage = false; // Reset saving flag
        }, 50); // 50 milliseconds delay
    });
    saveBtn.parent(actionsGrid); // Add button to actions grid
    saveBtn.style('width', '100%'); // Full width of grid cell
    saveBtn.style('margin', '0'); // No margin for tight fit
    saveBtn.style('font-size', '10px'); // Smaller font to fit
    
    buttons.gifBtn = createButton(`🎬 GIF (${gifSettings.duration}s)`); // Create GIF button with duration
    styleButton(buttons.gifBtn); // Apply consistent button style
    buttons.gifBtn.mousePressed(() => { // Define GIF button behavior
        if (!isRecordingGIF) { // If not currently recording
            startGIFRecording(); // Start recording
            buttons.gifBtn.html('⏹️ Stop'); // Change button text to "Stop"
            buttons.gifBtn.style('background-color', 'rgba(255, 0, 0, 0.3)'); // Red background while recording
        } else { // If already recording
            stopGIFRecording(); // Stop recording and process GIF
        }
    });
    buttons.gifBtn.parent(actionsGrid); // Add button to actions grid
    buttons.gifBtn.style('width', '100%'); // Full width of grid cell
    buttons.gifBtn.style('margin', '0'); // No margin for tight fit
    buttons.gifBtn.style('font-size', '10px'); // Smaller font to fit
    
    let resetBtn = createButton('🔄 Reset (R)'); // Create reset button with emoji and keyboard shortcut hint
    styleButton(resetBtn); // Apply consistent button style
    resetBtn.mousePressed(() => resetToDefaults()); // Reset all parameters to default when clicked
    resetBtn.parent(actionsGrid); // Add button to actions grid
    resetBtn.style('width', '100%'); // Full width of grid cell
    resetBtn.style('margin', '0'); // No margin for tight fit
    resetBtn.style('font-size', '10px'); // Smaller font to fit
}

// ============================================
// ADD SECTION HELPER FUNCTION
// ============================================
// Creates a styled section header for the GUI
function addSection(title) {
    let section = createDiv(title); // Create div with section title text
    section.style('margin-top', '20px'); // Space above section for separation
    section.style('margin-bottom', '12px'); // Space below section before content
    section.style('font-weight', 'bold'); // Bold text for emphasis
    section.style('font-size', '12px'); // Slightly larger than body text
    section.style('color', '#00ff9f'); // Neon green color
    section.style('border-bottom', '1px solid rgba(0, 255, 159, 0.3)'); // Bottom border for visual separation
    section.style('padding-bottom', '6px'); // Space between text and border
    section.style('letter-spacing', '1px'); // Letter spacing for modern look
    section.parent(guiContainer); // Add section to main GUI container
}

// ============================================
// ADD SLIDER HELPER FUNCTION
// ============================================
// Creates a labeled slider with live value display
function addSlider(label, min, max, value, step, callback, parent = null) { // Added optional parent parameter
    let container = createDiv(''); // Create container for slider and label
    container.parent(parent || guiContainer); // Add container to specified parent or main GUI
    container.style('margin-bottom', '15px'); // Space below slider group
    
    // Label row with value display
    let labelRow = createDiv(''); // Create row for label and value
    labelRow.style('display', 'flex'); // Use flexbox for layout
    labelRow.style('justify-content', 'space-between'); // Space label and value apart
    labelRow.style('align-items', 'center'); // Vertically center items
    labelRow.style('margin-bottom', '6px'); // Space between label row and slider
    labelRow.parent(container); // Add label row to container
    
    let labelSpan = createSpan(label); // Create span with label text
    labelSpan.parent(labelRow); // Add label to label row
    labelSpan.style('font-size', '11px'); // Small font for label
    labelSpan.style('color', '#00ff9f'); // Neon green color for label
    
    let valueSpan = createSpan(formatValue(value, step)); // Create span with formatted value
    valueSpan.parent(labelRow); // Add value display to label row
    valueSpan.style('font-size', '11px'); // Same size as label
    valueSpan.style('color', '#00ffaa'); // Slightly different green for value
    valueSpan.style('font-weight', 'bold'); // Bold to emphasize current value
    
    // Slider element
    let slider = createSlider(min, max, value, step); // Create slider with specified range and step
    slider.parent(container); // Add slider to container
    slider.style('width', '100%'); // Full width of container
    slider.style('height', '6px'); // Thin height for modern look
    slider.style('cursor', 'pointer'); // Pointer cursor to indicate interactivity
    slider.input(() => { // Callback when slider value changes
        let val = slider.value(); // Get current slider value
        valueSpan.html(formatValue(val, step)); // Update value display with formatted value
        callback(val); // Call provided callback with new value
    });
    
    // Custom slider styling with CSS
    slider.style('accent-color', '#00ff9f'); // Neon green accent color for slider thumb
    slider.style('-webkit-appearance', 'none'); // Remove default webkit styling
    slider.style('appearance', 'none'); // Remove default styling
    slider.style('background', 'rgba(0, 255, 159, 0.2)'); // Semi-transparent green track background
    slider.style('border-radius', '3px'); // Rounded corners for track
    slider.style('outline', 'none'); // Remove focus outline
    
    return slider; // Return slider element for external reference
}

// ============================================
// ADD SELECT HELPER FUNCTION
// ============================================
// Creates a labeled dropdown/select menu
function addSelect(label, selectsObj, key, options, defaultVal, callback) {
    let container = createDiv(''); // Create container for select and label
    container.parent(guiContainer); // Add container to main GUI
    container.style('margin-bottom', '15px'); // Space below select group
    
    // Label
    let labelDiv = createDiv(label + ':'); // Create div with label text and colon
    labelDiv.style('font-size', '11px'); // Small font for label
    labelDiv.style('color', '#00ff9f'); // Neon green color for label
    labelDiv.style('margin-bottom', '6px'); // Space between label and select
    labelDiv.parent(container); // Add label to container
    
    // Select dropdown element
    let sel = createSelect(); // Create select/dropdown element
    options.forEach(opt => sel.option(opt)); // Add each option to the select menu
    sel.selected(defaultVal); // Set default selected value
    sel.changed(() => callback(sel.value())); // Call callback when selection changes
    sel.parent(container); // Add select to container
    
    sel.style('width', '100%'); // Full width of container
    sel.style('background-color', 'rgba(0, 255, 159, 0.15)'); // Semi-transparent green background
    sel.style('border', '1px solid #00ff9f'); // Neon green border
    sel.style('color', '#00ff9f'); // Neon green text color
    sel.style('padding', '8px 12px'); // Internal padding for select
    sel.style('border-radius', '4px'); // Rounded corners
    sel.style('font-family', 'monospace'); // Monospace font for consistency
    sel.style('font-size', '11px'); // Small font size
    sel.style('cursor', 'pointer'); // Pointer cursor to indicate interactivity
    sel.style('outline', 'none'); // Remove focus outline
    
    selectsObj[key] = sel; // Store reference to select element in provided object
}

// ============================================
// ADD CHECKBOX HELPER FUNCTION
// ============================================
// Creates a labeled checkbox element
function addCheckbox(label, defaultVal, callback) {
    let container = createDiv(''); // Create container for checkbox and label
    container.parent(guiContainer); // Add container to main GUI
    container.style('margin-bottom', '15px'); // Space below checkbox group
    container.style('display', 'flex'); // Use flexbox for layout
    container.style('align-items', 'center'); // Vertically center items
    container.style('gap', '10px'); // Space between checkbox and label
    
    let checkbox = createCheckbox('', defaultVal); // Create checkbox with default value (no label text)
    checkbox.changed(() => callback(checkbox.checked())); // Call callback when checkbox state changes
    checkbox.parent(container); // Add checkbox to container
    checkbox.style('width', '18px'); // Fixed width for checkbox
    checkbox.style('height', '18px'); // Fixed height for checkbox
    checkbox.style('cursor', 'pointer'); // Pointer cursor to indicate interactivity
    checkbox.style('accent-color', '#00ff9f'); // Neon green accent color for checkbox
    
    let labelSpan = createSpan(label + ':'); // Create span with label text and colon
    labelSpan.parent(container); // Add label to container
    labelSpan.style('font-size', '11px'); // Small font for label
    labelSpan.style('color', '#00ff9f'); // Neon green color for label
}

// ============================================
// FORMAT VALUE HELPER FUNCTION
// ============================================
// Formats slider values based on step size for display
function formatValue(val, step) {
    if (step >= 1) return val.toFixed(0); // No decimals for step >= 1
    if (step >= 0.1) return val.toFixed(1); // 1 decimal for step >= 0.1
    if (step >= 0.01) return val.toFixed(2); // 2 decimals for step >= 0.01
    return val.toFixed(3); // 3 decimals for very small steps
}

// ============================================
// STYLE BUTTON HELPER FUNCTION
// ============================================
// Applies consistent styling to all buttons with hover effects
function styleButton(btn) {
    btn.style('background-color', 'rgba(0, 255, 159, 0.15)'); // Semi-transparent green background
    btn.style('border', '1px solid #00ff9f'); // Neon green border
    btn.style('color', '#00ff9f'); // Neon green text color
    btn.style('padding', '10px 15px'); // Internal padding
    btn.style('border-radius', '4px'); // Rounded corners
    btn.style('cursor', 'pointer'); // Pointer cursor to indicate clickability
    btn.style('font-family', 'monospace'); // Monospace font for consistency
    btn.style('font-size', '11px'); // Small font size
    btn.style('font-weight', 'bold'); // Bold text for emphasis
    btn.style('transition', 'all 0.2s ease'); // Smooth transitions for hover effects
    btn.style('outline', 'none'); // Remove focus outline
    
    // Prevent canvas interaction when clicking button
    btn.mousePressed((e) => { // Mouse press event handler
        if (e) e.stopPropagation(); // Block event propagation to canvas if event exists
    });
    
    btn.mouseOver(() => { // Mouse hover event handler
        btn.style('background-color', 'rgba(0, 255, 159, 0.3)'); // Brighter green on hover
        btn.style('box-shadow', '0 0 15px rgba(0, 255, 159, 0.5)'); // Glowing shadow effect
        btn.style('transform', 'translateY(-1px)'); // Slight upward movement
    });
    btn.mouseOut(() => { // Mouse leave event handler
        btn.style('background-color', 'rgba(0, 255, 159, 0.15)'); // Restore original background
        btn.style('box-shadow', 'none'); // Remove shadow
        btn.style('transform', 'translateY(0)'); // Restore original position
    });
}

// ============================================
// TOGGLE GUI FUNCTION
// ============================================
// Shows or hides the GUI panel
// ============================================
// TOGGLE GUI FUNCTION
// ============================================
// Toggles visibility of both GUI panels
function toggleGUI() {
    showGUI = !showGUI; // Toggle visibility flag
    if (showGUI) { // If GUIs should be shown
        guiContainer.show(); // Display the main GUI container
        actionsGuiContainer.show(); // Display the actions GUI container
    } else { // If GUIs should be hidden
        guiContainer.hide(); // Hide the main GUI container
        actionsGuiContainer.hide(); // Hide the actions GUI container
    }
}

// ============================================
// UPDATE COLOR MODE FUNCTION
// ============================================
// Updates background and chemical colors based on selected color mode
function updateColorMode() {
    const colorPresets = { // Define color presets with background and chemical colors
        'Neon Glow': { // First preset
            chemical: '#00ff9f', // Neon green chemical color
            background: '#0a0a0a' // Nearly black background
        },
        'Heat Map': { // Second preset
            chemical: '#ff3300', // Hot red/orange chemical color
            background: '#001a33' // Deep navy blue background
        },
        'Acid Green': { // Third preset
            chemical: '#39ff14', // Bright fluorescent green chemical color
            background: '#0a0a0a' // Nearly black background
        },
        'Electric Cyan': { // Fourth preset
            chemical: '#00ffff', // Electric cyan chemical color
            background: '#001a1a' // Dark teal background
        },
        'Magmatic Orange': { // Fifth preset
            chemical: '#ff6600', // Bright orange chemical color
            background: '#1a0a00' // Dark brown/burnt background
        }
    };
    
    if (colorPresets[params.colorMode]) { // If selected color mode exists in presets
        params.chemicalColor = colorPresets[params.colorMode].chemical; // Update chemical color parameter
        params.backgroundColor = colorPresets[params.colorMode].background; // Update background color parameter
        
        // Update both color pickers to reflect the new colors
        if (sliders.chemColorPicker) { // If chemical color picker exists
            sliders.chemColorPicker.value(params.chemicalColor); // Update picker to show new chemical color
        }
        if (sliders.bgColorPicker) { // If background color picker exists
            sliders.bgColorPicker.value(params.backgroundColor); // Update picker to show new background color
        }
    }
}

// ============================================
// UPDATE GRID SIZE FUNCTION
// ============================================
// Calculates grid dimensions based on canvas size and resolution setting
function updateGridSize() {
    const resolutionMap = { // Map resolution names to divisor values
        'Low': 3.2,      // Lower divisor = fewer cells = faster performance
        'Medium': 2.5,   // Medium divisor = balanced cell count
        'High': 2.0      // Higher divisor = more cells = better detail
    };
    
    let divisor = resolutionMap[params.resolution] || 2.5; // Get divisor or default to 2.5
    gridWidth = floor(width / divisor); // Calculate grid width from canvas width
    gridHeight = floor(height / divisor); // Calculate grid height from canvas height
    
    // Reduced caps for better performance
    if (params.resolution === 'High') { // If high resolution is selected
        gridWidth = min(gridWidth, 320);  // Cap width at 320 (reduced from 380 for performance)
        gridHeight = min(gridHeight, 320); // Cap height at 320
    } else if (params.resolution === 'Medium') { // If medium resolution is selected
        gridWidth = min(gridWidth, 380); // Cap width at 380
        gridHeight = min(gridHeight, 380); // Cap height at 380
    } else { // If low resolution is selected
        gridWidth = min(gridWidth, 280);  // Cap width at 280
        gridHeight = min(gridHeight, 280); // Cap height at 280
    }
    
    gridSize = gridWidth * gridHeight; // Calculate total number of cells
}

// ============================================
// INITIALIZE GRID FUNCTION
// ============================================
// Creates and resets all chemical concentration grids
function initializeGrid() {
    gridA = new Float32Array(gridSize); // Create new Float32Array for chemical A (current state)
    gridB = new Float32Array(gridSize); // Create new Float32Array for chemical B (current state)
    nextA = new Float32Array(gridSize); // Create new Float32Array for chemical A (next state)
    nextB = new Float32Array(gridSize); // Create new Float32Array for chemical B (next state)
    
    for (let i = 0; i < gridSize; i++) { // Loop through all grid cells
        gridA[i] = 1.0; // Initialize chemical A to maximum concentration (1.0)
        gridB[i] = 0.0; // Initialize chemical B to zero concentration
        nextA[i] = 1.0; // Initialize next state of chemical A to maximum
        nextB[i] = 0.0; // Initialize next state of chemical B to zero
    }
}

// ============================================
// P5.JS DRAW FUNCTION - MAIN LOOP
// ============================================
// Called continuously at ~30fps - handles all simulation and rendering
function draw() {
    // ====================================
    // MOUSE VELOCITY CALCULATION
    // ====================================
    // Calculate mouse speed for velocity-based brush effects
    let dx = mouseX - prevMouseX; // Calculate horizontal distance moved
    let dy = mouseY - prevMouseY; // Calculate vertical distance moved
    mouseVelocity = sqrt(dx * dx + dy * dy);  // Calculate Euclidean distance (speed in pixels/frame)
    prevMouseX = mouseX; // Store current X position for next frame
    prevMouseY = mouseY; // Store current Y position for next frame
    
    // ====================================
    // BRUSH INTERACTION
    // ====================================
    // Deposit Chemical B when mouse is pressed (but NOT over GUI)
    if (mouseIsPressed && // If mouse button is pressed
        mouseX > 0 && mouseX < width && // Mouse is within canvas horizontal bounds
        mouseY > 0 && mouseY < height && // Mouse is within canvas vertical bounds
        !isInteractingWithGUI) {  // Mouse is not over GUI (prevent drawing on controls)
        
        // Initialize last deposit position on first press
        if (!mouseWasPressed) { // If this is the first frame of the press
            lastDepositX = mouseX; // Store initial X position
            lastDepositY = mouseY; // Store initial Y position
        }
        
        // Deposit with smooth interpolation between frames
        depositChemicalSmooth(mouseX, mouseY); // Call smooth brush function with current position
        lastDepositX = mouseX; // Update last deposit X for next frame
        lastDepositY = mouseY; // Update last deposit Y for next frame
    }
    
    // Track mouse press state for next frame
    mouseWasPressed = mouseIsPressed; // Store current press state to detect first frame of press
    
    // ====================================
    // PRESET SPEED BOOST
    // ====================================
    // Temporarily increase simulation speed when loading presets
    // This makes patterns form faster initially
    let currentSimSpeed = params.simSpeed; // Start with user-set simulation speed
    if (presetBoostFrames > 0) { // If boost is still active
        currentSimSpeed = 5;  // Override with 5x speed boost for faster pattern formation
        presetBoostFrames--; // Decrement remaining boost frames
        
        // Restore original speed after boost period
        if (presetBoostFrames === 0) { // If boost just ended
            params.simSpeed = originalSimSpeed; // Restore original speed setting
            if (sliders.simSpeed) sliders.simSpeed.value(params.simSpeed); // Update slider to show restored value
        }
    }
    
    // ====================================
    // RUN SIMULATION
    // ====================================
    // Execute multiple simulation steps per frame for faster evolution
    for (let i = 0; i < currentSimSpeed; i++) { // Loop for number of simulation steps
        simulateReactionDiffusion();  // Execute one Gray-Scott algorithm step
    }
    
    // ====================================
    // RENDER TO CANVAS
    // ====================================
    // Convert grid data to pixels and display
    renderChemicals(); // Render chemical concentrations as colored pixels
    
    // ====================================
    // GIF RECORDING
    // ====================================
    // Capture current frame if recording is active
    if (isRecordingGIF) { // If GIF recording is in progress
        gifFrames.push(get());  // Capture current canvas state as p5.Image and add to frames array
        gifFrameCount++; // Increment frame counter
        
        // Stop recording when max frames reached
        if (gifFrameCount >= maxGifFrames) { // If we've captured all required frames
            stopGIFRecording(); // Stop recording and process GIF
        }
    }
    
    // ====================================
    // DRAW UI OVERLAYS
    // ====================================
    // Only draw if GUI is visible (performance optimization)
    if (showGUI) { // If GUI is not hidden
        drawVelocityIndicator();  // Draw brush velocity bar at bottom-left
        
        // Show recording indicator if GIF recording is active
        if (isRecordingGIF) { // If currently recording GIF
            drawRecordingIndicator(); // Draw red recording dot and progress bar
        }
    } else if (!isSavingImage) { // If GUI is hidden BUT we're not saving (to keep screenshots clean)
        drawShowGUIIndicator(); // Draw "Show GUI (G)" text in top-left corner
    }
}

// ============================================
// DRAW SHOW GUI INDICATOR
// ============================================
// Shows clickable "Show GUI (G)" button when GUI is hidden
function drawShowGUIIndicator() {
    push(); // Save current drawing state
    
    // Check if mouse is hovering over button
    let buttonX = 15; // Button X position
    let buttonY = 15; // Button Y position
    let buttonW = 120; // Button width
    let buttonH = 35; // Button height
    let isHovering = mouseX > buttonX && mouseX < buttonX + buttonW && 
                     mouseY > buttonY && mouseY < buttonY + buttonH; // Check if mouse is inside button bounds
    
    // Background panel for button with hover effect
    if (isHovering) { // If mouse is hovering
        fill(10, 10, 10, 250); // Slightly more opaque background on hover
        stroke(0, 255, 159, 200); // Brighter border on hover
        strokeWeight(2); // Thicker border on hover
        cursor(HAND); // Change cursor to hand pointer
    } else { // If mouse is not hovering
        fill(10, 10, 10, 220); // Normal background
        stroke(0, 255, 159, 100); // Normal border
        strokeWeight(1); // Normal border thickness
    }
    rect(buttonX, buttonY, buttonW, buttonH, 5); // Draw button with rounded corners
    
    // "Show GUI (G)" text
    noStroke(); // No outline for text
    fill(0, 255, 159, isHovering ? 255 : 200); // Brighter text on hover
    textSize(12); // Medium text size
    textFont('monospace'); // Monospace font for consistency
    textStyle(BOLD); // Bold text for emphasis
    textAlign(CENTER, CENTER); // Center text in button
    text('Show GUI (G)', buttonX + buttonW / 2, buttonY + buttonH / 2); // Draw centered text
    
    pop(); // Restore previous drawing state
}

// ============================================
// P5.JS MOUSE PRESSED FUNCTION
// ============================================
// Handles mouse clicks on Show GUI button
function mousePressed() {
    // Check if clicking on Show GUI button when GUI is hidden
    if (!showGUI && !isSavingImage) { // If GUI is hidden and not saving
        let buttonX = 15; // Button X position
        let buttonY = 15; // Button Y position
        let buttonW = 120; // Button width
        let buttonH = 35; // Button height
        
        // Check if click is inside button bounds
        if (mouseX > buttonX && mouseX < buttonX + buttonW && 
            mouseY > buttonY && mouseY < buttonY + buttonH) {
            toggleGUI(); // Show the GUI
        }
    }
}

// ============================================
// DRAW RECORDING INDICATOR
// ============================================
// Shows a pulsing red dot and progress bar when recording GIF
function drawRecordingIndicator() {
    push(); // Save current drawing state
    
    // Recording dot in top right
    let dotX = width - 40; // X position: 40px from right edge
    let dotY = 40; // Y position: 40px from top
    
    // Pulsing red dot
    let pulseAlpha = 150 + sin(frameCount * 0.2) * 105; // Oscillate alpha between 45-255 for pulsing effect
    fill(255, 0, 0, pulseAlpha); // Red color with pulsing transparency
    noStroke(); // No outline for dot
    circle(dotX, dotY, 20); // Draw 20px diameter circle
    
    // REC text
    fill(255, 0, 0, pulseAlpha); // Same pulsing red for text
    textSize(14); // Medium text size
    textFont('monospace'); // Monospace font for technical look
    textStyle(BOLD); // Bold text for emphasis
    textAlign(RIGHT, CENTER); // Align right of dot, vertically centered
    text('REC', dotX - 15, dotY); // Draw "REC" text to the left of dot
    
    // Progress bar
    let barWidth = 200; // Width of progress bar
    let barHeight = 8; // Height of progress bar
    let barX = width - barWidth - 20; // X position: 20px from right edge
    let barY = 70; // Y position: below the dot
    
    // Background
    fill(20, 20, 20, 200); // Dark semi-transparent background
    stroke(255, 0, 0, 100); // Semi-transparent red border
    strokeWeight(1); // Thin border
    rect(barX, barY, barWidth, barHeight, 2); // Draw background bar with 2px rounded corners
    
    // Progress
    let progress = gifFrameCount / maxGifFrames; // Calculate progress as percentage (0.0 to 1.0)
    noStroke(); // No outline for progress fill
    fill(255, 0, 0, 200); // Solid red color for progress
    rect(barX, barY, barWidth * progress, barHeight, 2); // Draw filled portion based on progress
    
    // Frame count
    textAlign(RIGHT, TOP); // Align text to right, top
    textSize(11); // Small text size for counter
    fill(255, 0, 0, 200); // Red color for counter text
    text(`${gifFrameCount}/${maxGifFrames} frames`, width - 20, 85); // Display "X/Y frames" below bar
    
    pop(); // Restore previous drawing state
}

// ============================================
// DRAW VELOCITY INDICATOR
// ============================================
// Shows brush velocity as an animated bar at bottom-left
function drawVelocityIndicator() {
    if (!showGUI) return; // Don't draw if GUI is hidden
    
    push(); // Save current drawing state
    let velX = 20; // X position: 20px from left edge
    let velY = height - 50; // Y position: 50px from bottom
    let velBarWidth = 250; // Width of velocity bar
    let velBarHeight = 10; // Height of velocity bar
    
    // Background panel
    fill(10, 10, 10, 240); // Dark semi-transparent background
    stroke(0, 255, 159, 100); // Semi-transparent neon green border
    strokeWeight(1); // Thin border
    rect(velX - 5, velY - 25, velBarWidth + 10, 45, 5); // Draw panel with 5px padding and rounded corners
    
    // Label
    noStroke(); // No outline for text
    fill(0, 255, 159, 200); // Neon green color for label
    textSize(10); // Small text size
    textFont('monospace'); // Monospace font for consistency
    textStyle(BOLD); // Bold text for emphasis
    text('BRUSH VELOCITY', velX, velY - 8); // Draw label above bar
    
    // Bar background
    stroke(0, 255, 159, 100); // Semi-transparent neon green border
    strokeWeight(1); // Thin border
    noFill(); // No fill for background (just outline)
    rect(velX, velY, velBarWidth, velBarHeight, 2); // Draw bar outline with 2px rounded corners
    
    // Velocity fill
    let velocityPercent = min(mouseVelocity / 90, 1.0); // Normalize velocity to 0-1 range (90 pixels/frame = max)
    noStroke(); // No outline for fill
    
    // Gradient effect
    for (let i = 0; i < velocityPercent * velBarWidth; i++) { // Loop through each pixel of the filled portion
        let alpha = map(i, 0, velBarWidth, 150, 255); // Map position to alpha (fade from 150 to 255)
        fill(0, 255, 159, alpha); // Neon green with gradient alpha
        rect(velX + i, velY, 1, velBarHeight); // Draw 1px wide vertical slice
    }
    
    pop(); // Restore previous drawing state
}

// ============================================
// DEPOSIT CHEMICAL SMOOTH
// ============================================
// Deposits chemical B with smooth interpolation between mouse positions
function depositChemicalSmooth(currentX, currentY) {
    // Calculate distance from last deposit
    let distance = dist(lastDepositX, lastDepositY, currentX, currentY); // Euclidean distance in pixels
    
    // If distance is small, just deposit at current position
    if (distance < 2) { // If mouse moved less than 2 pixels since last deposit
        depositChemicalAt(currentX, currentY); // Just deposit at current position (no interpolation needed)
        return; // Exit function early
    }
    
    // Interpolate between last and current position
    // Number of steps based on distance to ensure smooth line
    let steps = ceil(distance / 2); // Calculate number of interpolation steps (1 step per 2 pixels)
    
    for (let i = 0; i <= steps; i++) { // Loop through interpolation steps
        let t = i / steps; // Calculate interpolation parameter (0.0 to 1.0)
        let x = lerp(lastDepositX, currentX, t); // Linear interpolation for X coordinate
        let y = lerp(lastDepositY, currentY, t); // Linear interpolation for Y coordinate
        depositChemicalAt(x, y); // Deposit chemical at interpolated position
    }
}

// ============================================
// DEPOSIT CHEMICAL AT POSITION
// ============================================
// Deposits chemical B in a circular area at specified position
function depositChemicalAt(x, y) {
    // Convert mouse position to grid coordinates
    let gx = floor(map(x, 0, width, 0, gridWidth)); // Map X from canvas space to grid space
    let gy = floor(map(y, 0, height, 0, gridHeight)); // Map Y from canvas space to grid space
    
    // Calculate effective brush radius based on velocity
    let velocityFactor = 1.0 - (mouseVelocity / 150.0) * params.velocityEffect; // Reduce size when moving fast
    velocityFactor = constrain(velocityFactor, 0.5, 1.0); // Clamp between 0.5 and 1.0 (min 50% size)
    
    let effectiveRadius = params.brushRadius * velocityFactor; // Apply velocity factor to radius
    let effectiveDensity = params.brushDensity * velocityFactor; // Apply velocity factor to density
    
    // Deposit Chemical B in a circular area
    let radiusSq = effectiveRadius * effectiveRadius; // Square of radius for distance comparison (avoid sqrt)
    let startX = max(1, floor(gx - effectiveRadius)); // Calculate bounding box left edge (stay within grid bounds)
    let endX = min(gridWidth - 1, ceil(gx + effectiveRadius)); // Calculate bounding box right edge
    let startY = max(1, floor(gy - effectiveRadius)); // Calculate bounding box top edge
    let endY = min(gridHeight - 1, ceil(gy + effectiveRadius)); // Calculate bounding box bottom edge
    
    for (let ix = startX; ix < endX; ix++) { // Loop through X coordinates in bounding box
        for (let iy = startY; iy < endY; iy++) { // Loop through Y coordinates in bounding box
            let dx = ix - gx; // Calculate X distance from brush center
            let dy = iy - gy; // Calculate Y distance from brush center
            let distSq = dx * dx + dy * dy; // Calculate squared distance (Pythagorean theorem)
            
            if (distSq < radiusSq) { // If point is inside brush radius
                let idx = ix + iy * gridWidth; // Calculate 1D array index
                let dist = sqrt(distSq); // Calculate actual distance (needed for falloff)
                
                // Smooth falloff from center
                let amount = (1.0 - dist / effectiveRadius) * effectiveDensity; // Linear falloff (1.0 at center, 0.0 at edge)
                gridB[idx] = min(gridB[idx] + amount * 0.3, 1.0); // Add chemical B (scaled by 0.3), clamp to 1.0
            }
        }
    }
}

// ============================================
// GRAY-SCOTT REACTION-DIFFUSION SIMULATION
// ============================================
// Implements the Gray-Scott model: A + 2B → 3B (autocatalytic) and B → P (decay)
// Mathematical equations:
//   dA/dt = Da·∇²A - AB² + f(1-A)
//   dB/dt = Db·∇²B + AB² - (k+f)B
function simulateReactionDiffusion() {
    // Pre-calculate frequently used values for performance
    let killPlusFeed = params.killRate + params.feedRate; // Pre-calculate k+f term
    let oneMinusKillPlusFeed = 1.0 - killPlusFeed; // Pre-calculate 1-(k+f) for optimization (unused but kept)
    
    // Loop through all grid cells (excluding borders)
    for (let x = 1; x < gridWidth - 1; x++) { // Loop through columns (skip left/right borders)
        for (let y = 1; y < gridHeight - 1; y++) { // Loop through rows (skip top/bottom borders)
            let idx = x + y * gridWidth;  // Calculate 1D array index from 2D coordinates
            
            // Get current concentrations
            let a = gridA[idx]; // Current concentration of chemical A at this cell
            let b = gridB[idx]; // Current concentration of chemical B at this cell
            
            // ====================================
            // LAPLACIAN CALCULATION (Diffusion)
            // ====================================
            // 9-point stencil approximates ∇²f (second derivative / curvature)
            // Weights: center=-1.0, orthogonal (cardinal)=0.2, diagonal=0.05
            
            // Laplacian for Chemical A
            let laplaceA = gridA[idx] * -1.0; // Center cell (negative weight)
            laplaceA += gridA[idx - 1] * 0.2;              // Left neighbor (cardinal direction)
            laplaceA += gridA[idx + 1] * 0.2;              // Right neighbor (cardinal direction)
            laplaceA += gridA[idx - gridWidth] * 0.2;      // Up neighbor (cardinal direction)
            laplaceA += gridA[idx + gridWidth] * 0.2;      // Down neighbor (cardinal direction)
            laplaceA += gridA[idx - 1 - gridWidth] * 0.05; // Top-left diagonal neighbor
            laplaceA += gridA[idx + 1 - gridWidth] * 0.05; // Top-right diagonal neighbor
            laplaceA += gridA[idx - 1 + gridWidth] * 0.05; // Bottom-left diagonal neighbor
            laplaceA += gridA[idx + 1 + gridWidth] * 0.05; // Bottom-right diagonal neighbor
            
            // Laplacian for Chemical B (same 9-point stencil as A)
            let laplaceB = gridB[idx] * -1.0; // Center cell (negative weight)
            laplaceB += gridB[idx - 1] * 0.2; // Left neighbor (cardinal direction)
            laplaceB += gridB[idx + 1] * 0.2; // Right neighbor (cardinal direction)
            laplaceB += gridB[idx - gridWidth] * 0.2; // Up neighbor (cardinal direction)
            laplaceB += gridB[idx + gridWidth] * 0.2; // Down neighbor (cardinal direction)
            laplaceB += gridB[idx - 1 - gridWidth] * 0.05; // Top-left diagonal neighbor
            laplaceB += gridB[idx + 1 - gridWidth] * 0.05; // Top-right diagonal neighbor
            laplaceB += gridB[idx - 1 + gridWidth] * 0.05; // Bottom-left diagonal neighbor
            laplaceB += gridB[idx + 1 + gridWidth] * 0.05; // Bottom-right diagonal neighbor
            
            // ====================================
            // REACTION TERM
            // ====================================
            // AB² represents the autocatalytic reaction A + 2B → 3B
            let abb = a * b * b; // Calculate reaction term (a * b²)
            
            // ====================================
            // GRAY-SCOTT UPDATE EQUATIONS
            // ====================================
            // dA/dt = Da·∇²A - AB² + f(1-A)
            let newA = a + (params.diffusionA * laplaceA) - abb + (params.feedRate * (1.0 - a));
            // dB/dt = Db·∇²B + AB² - (k+f)B
            let newB = b + (params.diffusionB * laplaceB) + abb - (killPlusFeed * b);
            
            // Clamp values inline to [0, 1] range
            nextA[idx] = newA < 0 ? 0 : (newA > 1 ? 1 : newA); // Ternary clamping for A
            nextB[idx] = newB < 0 ? 0 : (newB > 1 ? 1 : newB); // Ternary clamping for B
        }
    }
    
    // Swap grids (pointer swap is very fast)
    let tempA = gridA; // Store reference to current A grid
    let tempB = gridB; // Store reference to current B grid
    gridA = nextA; // Make next A grid the current grid
    gridB = nextB; // Make next B grid the current grid
    nextA = tempA; // Reuse old A grid as next grid (recycling)
    nextB = tempB; // Reuse old B grid as next grid (recycling)
}

// ============================================
// RENDER CHEMICALS FUNCTION
// ============================================
// Converts chemical concentration grid to colored pixels on canvas
function renderChemicals() {
    loadPixels(); // Load pixel array for direct manipulation
    
    let scaleX = width / gridWidth; // Calculate horizontal scaling factor (canvas pixels per grid cell)
    let scaleY = height / gridHeight; // Calculate vertical scaling factor (canvas pixels per grid cell)
    
    let bgColor = color(params.backgroundColor); // Create p5.Color object for background
    let chemColor = color(params.chemicalColor); // Create p5.Color object for chemical
    
    // Pre-extract RGB components once (optimization)
    let bgR = red(bgColor); // Extract red component of background color
    let bgG = green(bgColor); // Extract green component of background color
    let bgB = blue(bgColor); // Extract blue component of background color
    let chemR = red(chemColor); // Extract red component of chemical color
    let chemG = green(chemColor); // Extract green component of chemical color
    let chemB = blue(chemColor); // Extract blue component of chemical color
    
    let heatColdR, heatColdG, heatColdB, heatHotR, heatHotG, heatHotB; // Variables for Heat Map mode colors
    let acidR, acidG, acidB, cyanR, cyanG, cyanB, magmaR, magmaG, magmaB; // Variables for other color modes
    
    switch(params.colorMode) { // Pre-extract colors for special color modes
        case 'Heat Map': // Heat map uses gradient from cold to hot
            let heatCold = color('#001a33'); // Dark blue for low concentration
            let heatHot = color('#ff3300'); // Bright red/orange for high concentration
            heatColdR = red(heatCold); // Extract red component of cold color
            heatColdG = green(heatCold); // Extract green component of cold color
            heatColdB = blue(heatCold); // Extract blue component of cold color
            heatHotR = red(heatHot); // Extract red component of hot color
            heatHotG = green(heatHot); // Extract green component of hot color
            heatHotB = blue(heatHot); // Extract blue component of hot color
            break;
        case 'Acid Green': // Acid green mode
            let acidColor = color('#39ff14'); // Bright fluorescent green
            acidR = red(acidColor); // Extract red component
            acidG = green(acidColor); // Extract green component
            acidB = blue(acidColor); // Extract blue component
            break;
        case 'Electric Cyan': // Electric cyan mode
            let cyanColor = color('#00ffff'); // Bright cyan
            cyanR = red(cyanColor); // Extract red component
            cyanG = green(cyanColor); // Extract green component
            cyanB = blue(cyanColor); // Extract blue component
            break;
        case 'Magmatic Orange': // Magmatic orange mode
            let magmaColor = color('#ff6600'); // Bright orange
            magmaR = red(magmaColor); // Extract red component
            magmaG = green(magmaColor); // Extract green component
            magmaB = blue(magmaColor); // Extract blue component
            break;
    }
    
    // Pre-compute Bayer matrix if halftone is enabled
    let bayerThresholds = null; // Will hold dither thresholds if halftone enabled
    if (params.halftone) { // If halftone effect is enabled
        bayerThresholds = new Float32Array(16); // Create array for 4x4 Bayer matrix thresholds
        const bayerMatrix = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5]; // Standard 4x4 Bayer matrix
        for (let i = 0; i < 16; i++) { // Loop through matrix values
            let threshold = bayerMatrix[i] / 16.0; // Normalize to 0.0-1.0 range
            bayerThresholds[i] = threshold + (0.5 - threshold) * (1.0 - params.ditherStrength); // Adjust threshold based on dither strength
        }
    }
    
    // Pre-calculate scaled positions to avoid redundant floor operations
    let pixelWidth = width * 4; // Pre-calculate row width in bytes (4 bytes per pixel: RGBA)
    
    for (let y = 0; y < gridHeight; y++) { // Loop through grid rows
        let py = floor(y * scaleY); // Calculate starting pixel Y for this grid row
        let pyEnd = floor((y + 1) * scaleY); // Calculate ending pixel Y for this grid row
        let rowOffset = y * gridWidth; // Pre-calculate row offset for 1D indexing
        
        for (let x = 0; x < gridWidth; x++) { // Loop through grid columns
            let idx = x + rowOffset; // Calculate 1D array index
            let b = gridB[idx]; // Get chemical B concentration at this cell
            
            // Apply dither first if enabled
            if (params.halftone) { // If halftone effect is enabled
                let bayerIdx = (x & 3) + ((y & 3) << 2); // Calculate Bayer matrix index using bitwise operations (x mod 4, y mod 4)
                b = b > bayerThresholds[bayerIdx] ? 1.0 : 0.0; // Apply threshold: convert to binary (0 or 1)
            } else {
                // Apply stronger power curve for much better color saturation (makes colors highly opaque)
                // This ensures that medium-high concentrations (0.6-1.0) reach near-full color opacity
                b = pow(b, 0.5); // Stronger power curve: pushes values much closer to 1.0
                b = min(b * 1.15, 1.0); // Add 15% boost and clamp to 1.0 for maximum saturation
            }
            
            let r, g, b_color; // Variables for final RGB color values
            
            // Direct RGB interpolation without creating color objects (performance optimization)
            switch(params.colorMode) {
                case 'Neon Glow': // Neon glow mode with white glow at high concentrations
                    r = bgR + (chemR - bgR) * b; // Linear interpolation for red channel
                    g = bgG + (chemG - bgG) * b; // Linear interpolation for green channel
                    b_color = bgB + (chemB - bgB) * b; // Linear interpolation for blue channel
                    if (b > 0.5) { // If concentration above 50%, add white glow
                        let glow = (b - 0.5) * 2 * 100 / 255; // Calculate glow intensity (0.0-1.0 normalized)
                        r += (255 - r) * glow; // Blend toward white for red
                        g += (255 - g) * glow; // Blend toward white for green
                        b_color += (255 - b_color) * glow; // Blend toward white for blue
                    }
                    break;
                    
                case 'Heat Map': // Heat map mode (cold to hot gradient)
                    r = heatColdR + (heatHotR - heatColdR) * b; // Interpolate red from cold to hot
                    g = heatColdG + (heatHotG - heatColdG) * b; // Interpolate green from cold to hot
                    b_color = heatColdB + (heatHotB - heatColdB) * b; // Interpolate blue from cold to hot
                    break;
                    
                case 'Acid Green': // Acid green mode
                    r = bgR + (acidR - bgR) * b; // Interpolate red with acid green
                    g = bgG + (acidG - bgG) * b; // Interpolate green with acid green
                    b_color = bgB + (acidB - bgB) * b; // Interpolate blue with acid green
                    break;
                    
                case 'Electric Cyan': // Electric cyan mode
                    r = bgR + (cyanR - bgR) * b; // Interpolate red with cyan
                    g = bgG + (cyanG - bgG) * b; // Interpolate green with cyan
                    b_color = bgB + (cyanB - bgB) * b; // Interpolate blue with cyan
                    break;
                    
                case 'Magmatic Orange': // Magmatic orange mode
                    r = bgR + (magmaR - bgR) * b; // Interpolate red with orange
                    g = bgG + (magmaG - bgG) * b; // Interpolate green with orange
                    b_color = bgB + (magmaB - bgB) * b; // Interpolate blue with orange
                    break;
                    
                default: // Default mode (uses user-selected colors)
                    r = bgR + (chemR - bgR) * b; // Interpolate red
                    g = bgG + (chemG - bgG) * b; // Interpolate green
                    b_color = bgB + (chemB - bgB) * b; // Interpolate blue
            }
            
            // Calculate pixel positions for this grid cell
            let px = floor(x * scaleX); // Calculate starting pixel X for this grid column
            let pxEnd = floor((x + 1) * scaleX); // Calculate ending pixel X for this grid column
            
            // Fill the scaled area with optimized indexing
            for (let dy = py; dy < pyEnd && dy < height; dy++) { // Loop through pixel rows for this grid cell
                let rowStart = dy * pixelWidth; // Pre-calculate byte offset for this pixel row
                for (let dx = px; dx < pxEnd && dx < width; dx++) { // Loop through pixel columns for this grid cell
                    let index = rowStart + (dx << 2); // Calculate pixel index using bit shift (dx * 4)
                    pixels[index] = r; // Set red channel
                    pixels[index + 1] = g; // Set green channel
                    pixels[index + 2] = b_color; // Set blue channel
                    pixels[index + 3] = 255; // Set alpha channel to fully opaque
                }
            }
        }
    }
    
    updatePixels(); // Update canvas with modified pixel array
}

// ============================================
// LOAD PRESET FUNCTION
// ============================================
// Loads a predefined set of Gray-Scott parameters and seeds the grid
function loadPreset(presetName) {
    const presets = { // Define all available presets with their parameters
        // Organic coral-like branching structures
        'Coral': { // Coral preset
            f: 0.055, // Feed rate (higher = more A replenishment)
            k: 0.062, // Kill rate (higher = more B removal)
            dA: 1.0, // Diffusion rate for chemical A
            dB: 0.5, // Diffusion rate for chemical B (slower = more defined structures)
            seedType: 'random' // Seed pattern: random scattered points
        },
        // Maze-like patterns with sharp edges
        'Maze': { // Maze preset
            f: 0.029, // Feed rate
            k: 0.057, // Kill rate
            dA: 1.0, // Diffusion rate for chemical A
            dB: 0.5, // Diffusion rate for chemical B
            seedType: 'random' // Seed pattern: random scattered points
        },
        // Large spots that divide and multiply
        'Mitosis': { // Mitosis preset
            f: 0.0367, // Feed rate
            k: 0.0649, // Kill rate
            dA: 1.0, // Diffusion rate for chemical A
            dB: 0.5, // Diffusion rate for chemical B
            seedType: 'spots' // Seed pattern: grid of spots
        },
        // Worm-like moving structures
        'Worms': { // Worms preset
            f: 0.078, // Feed rate
            k: 0.061, // Kill rate
            dA: 1.0, // Diffusion rate for chemical A
            dB: 0.5, // Diffusion rate for chemical B
            seedType: 'random' // Seed pattern: random scattered points
        },
        // Pulsating circular waves
        'Waves': { // Waves preset
            f: 0.014, // Feed rate (low = stable waves)
            k: 0.045, // Kill rate
            dA: 1.0, // Diffusion rate for chemical A
            dB: 0.5, // Diffusion rate for chemical B
            seedType: 'center' // Seed pattern: large central circle
        },
        // Spiraling organic growth
        'Spirals': { // Spirals preset
            f: 0.010, // Feed rate (very low for stable spirals)
            k: 0.041, // Kill rate
            dA: 0.8, // Diffusion rate for chemical A (reduced for tighter spirals)
            dB: 0.4, // Diffusion rate for chemical B (reduced)
            seedType: 'center' // Seed pattern: large central circle
        },
        // Unstable chaotic patterns
        'Chaos': { // Chaos preset
            f: 0.026, // Feed rate
            k: 0.051, // Kill rate
            dA: 1.2, // Diffusion rate for chemical A (increased for instability)
            dB: 0.6, // Diffusion rate for chemical B (increased)
            seedType: 'random' // Seed pattern: random scattered points
        },
        // Dense fingerprint-like lines
        'Fingerprint': { // Fingerprint preset
            f: 0.037, // Feed rate
            k: 0.060, // Kill rate
            dA: 1.0, // Diffusion rate for chemical A
            dB: 0.5, // Diffusion rate for chemical B
            seedType: 'random' // Seed pattern: random scattered points
        },
        // Bubble-like cellular structures
        'Bubbles': { // Bubbles preset
            f: 0.098, // Feed rate (high = large stable bubbles)
            k: 0.057, // Kill rate
            dA: 1.0, // Diffusion rate for chemical A
            dB: 0.5, // Diffusion rate for chemical B
            seedType: 'spots' // Seed pattern: grid of spots
        }
    };
    
    if (presets[presetName]) { // If preset exists in presets object
        params.feedRate = presets[presetName].f; // Update feed rate parameter
        params.killRate = presets[presetName].k; // Update kill rate parameter
        params.diffusionA = presets[presetName].dA; // Update diffusion A parameter
        params.diffusionB = presets[presetName].dB; // Update diffusion B parameter
        
        // Update sliders to reflect new values
        if (sliders.feedRate) sliders.feedRate.value(params.feedRate); // Update feed rate slider
        if (sliders.killRate) sliders.killRate.value(params.killRate); // Update kill rate slider
        if (sliders.diffusionA) sliders.diffusionA.value(params.diffusionA); // Update diffusion A slider
        if (sliders.diffusionB) sliders.diffusionB.value(params.diffusionB); // Update diffusion B slider
        
        // Seed the grid with the appropriate pattern
        seedGrid(presets[presetName].seedType); // Call seedGrid with preset's seed type
        
        // Activate speed boost for 120 frames (4 seconds at 30fps) at 5x speed
        originalSimSpeed = params.simSpeed; // Store current speed to restore later
        presetBoostFrames = 120; // Set boost duration to 120 frames
    }
}

// ============================================
// SEED GRID FUNCTION
// ============================================
// Initializes grid with different starting patterns for preset formation
function seedGrid(seedType) {
    // Reset grid first
    initializeGrid(); // Clear grid to default state (A=1.0, B=0.0)
    
    if (seedType === 'random') { // Random scattered seed pattern
        // Scatter random points across the grid
        let numSeeds = floor(gridWidth * gridHeight * 0.02); // Calculate 2% of total grid cells
        for (let i = 0; i < numSeeds; i++) { // Loop for number of seed points
            let x = floor(random(5, gridWidth - 5)); // Random X position (with 5px border)
            let y = floor(random(5, gridHeight - 5)); // Random Y position (with 5px border)
            let radius = random(3, 8); // Random radius between 3-8 pixels
            
            for (let dx = -radius; dx < radius; dx++) { // Loop through horizontal offset
                for (let dy = -radius; dy < radius; dy++) { // Loop through vertical offset
                    let dist = sqrt(dx * dx + dy * dy); // Calculate distance from seed center
                    if (dist < radius) { // If point is within seed radius
                        let nx = x + dx; // Calculate absolute X coordinate
                        let ny = y + dy; // Calculate absolute Y coordinate
                        if (nx >= 0 && nx < gridWidth && ny >= 0 && ny < gridHeight) { // Bounds check
                            let idx = nx + ny * gridWidth; // Calculate 1D array index
                            gridB[idx] = 1.0; // Set chemical B to maximum concentration
                        }
                    }
                }
            }
        }
    } else if (seedType === 'center') { // Large central circle seed pattern
        // Large central circle
        let cx = floor(gridWidth / 2); // Calculate center X coordinate
        let cy = floor(gridHeight / 2); // Calculate center Y coordinate
        let radius = min(gridWidth, gridHeight) * 0.15; // Calculate radius as 15% of smaller dimension
        
        for (let x = 0; x < gridWidth; x++) { // Loop through all X coordinates
            for (let y = 0; y < gridHeight; y++) { // Loop through all Y coordinates
                let dx = x - cx; // Calculate X distance from center
                let dy = y - cy; // Calculate Y distance from center
                let dist = sqrt(dx * dx + dy * dy); // Calculate Euclidean distance from center
                
                if (dist < radius) { // If point is within circle radius
                    let idx = x + y * gridWidth; // Calculate 1D array index
                    gridB[idx] = 1.0; // Set chemical B to maximum concentration
                }
            }
        }
    } else if (seedType === 'spots') { // Regular grid of spots seed pattern
        // Grid of spots
        let spacing = floor(min(gridWidth, gridHeight) / 8); // Calculate spacing between spots (1/8 of grid)
        let radius = spacing * 0.3; // Calculate spot radius (30% of spacing)
        
        for (let sx = spacing; sx < gridWidth; sx += spacing) { // Loop through X positions at intervals
            for (let sy = spacing; sy < gridHeight; sy += spacing) { // Loop through Y positions at intervals
                // Add some randomness to position
                let x = sx + floor(random(-spacing * 0.2, spacing * 0.2)); // Add random X offset (±20% of spacing)
                let y = sy + floor(random(-spacing * 0.2, spacing * 0.2)); // Add random Y offset (±20% of spacing)
                
                for (let dx = -radius; dx < radius; dx++) { // Loop through horizontal offset
                    for (let dy = -radius; dy < radius; dy++) { // Loop through vertical offset
                        let dist = sqrt(dx * dx + dy * dy); // Calculate distance from spot center
                        if (dist < radius) { // If point is within spot radius
                            let nx = x + dx; // Calculate absolute X coordinate
                            let ny = y + dy; // Calculate absolute Y coordinate
                            if (nx >= 0 && nx < gridWidth && ny >= 0 && ny < gridHeight) { // Bounds check
                                let idx = nx + ny * gridWidth; // Calculate 1D array index
                                gridB[idx] = 1.0; // Set chemical B to maximum concentration
                            }
                        }
                    }
                }
            }
        }
    }
}

// ============================================
// RESET TO DEFAULTS FUNCTION
// ============================================
// Restores all parameters to their default values
function resetToDefaults() {
    // Reset all parameters to default values
    params.feedRate = defaultParams.feedRate; // Restore default feed rate
    params.killRate = defaultParams.killRate; // Restore default kill rate
    params.diffusionA = defaultParams.diffusionA; // Restore default diffusion A
    params.diffusionB = defaultParams.diffusionB; // Restore default diffusion B
    params.resolution = defaultParams.resolution; // Restore default resolution
    params.simSpeed = defaultParams.simSpeed; // Restore default simulation speed
    params.brushRadius = defaultParams.brushRadius; // Restore default brush radius
    params.brushDensity = defaultParams.brushDensity; // Restore default brush density
    params.velocityEffect = defaultParams.velocityEffect; // Restore default velocity effect
    params.backgroundColor = defaultParams.backgroundColor; // Restore default background color
    params.chemicalColor = defaultParams.chemicalColor; // Restore default chemical color
    params.colorMode = defaultParams.colorMode; // Restore default color mode
    params.halftone = defaultParams.halftone; // Restore default halftone setting
    params.ditherStrength = defaultParams.ditherStrength; // Restore default dither strength
    
    // Update all sliders to show default values
    if (sliders.feedRate) sliders.feedRate.value(params.feedRate); // Update feed rate slider
    if (sliders.killRate) sliders.killRate.value(params.killRate); // Update kill rate slider
    if (sliders.diffusionA) sliders.diffusionA.value(params.diffusionA); // Update diffusion A slider
    if (sliders.diffusionB) sliders.diffusionB.value(params.diffusionB); // Update diffusion B slider
    if (sliders.simSpeed) sliders.simSpeed.value(params.simSpeed); // Update simulation speed slider
    if (sliders.brushRadius) sliders.brushRadius.value(params.brushRadius); // Update brush radius slider
    if (sliders.brushDensity) sliders.brushDensity.value(params.brushDensity); // Update brush density slider
    if (sliders.velocityEffect) sliders.velocityEffect.value(params.velocityEffect); // Update velocity effect slider
    if (sliders.ditherStrength) sliders.ditherStrength.value(params.ditherStrength); // Update dither strength slider
    
    // Update color pickers to show default colors
    if (sliders.bgColorPicker) sliders.bgColorPicker.value(params.backgroundColor); // Update background color picker
    if (sliders.chemColorPicker) sliders.chemColorPicker.value(params.chemicalColor); // Update chemical color picker
    
    // Update selects to show default selections
    if (selects.resolution) selects.resolution.selected(params.resolution); // Update resolution dropdown
    if (selects.colorMode) selects.colorMode.selected(params.colorMode); // Update color mode dropdown
    
    // Update grid size if resolution changed
    updateGridSize(); // Recalculate grid dimensions
    initializeGrid(); // Reset grid to default state
    
    // Update color mode to apply default colors
    updateColorMode(); // Synchronize color pickers with color mode
}

// ============================================
// START GIF RECORDING FUNCTION
// ============================================
// Initializes GIF recording state and arrays
function startGIFRecording() {
    maxGifFrames = gifSettings.duration * gifSettings.fps; // Calculate total frames needed (seconds * fps)
    isRecordingGIF = true; // Set recording flag to true
    gifFrames = []; // Initialize empty frames array
    gifFrameCount = 0; // Reset frame counter to zero
    
    console.log(`🎬 Started GIF recording: ${gifSettings.duration}s at ${gifSettings.fps} fps (${maxGifFrames} frames)`); // Log recording parameters
}

// ============================================
// STOP GIF RECORDING FUNCTION
// ============================================
// Stops GIF recording and initiates processing
function stopGIFRecording() {
    if (!isRecordingGIF) return; // Exit if not currently recording
    
    isRecordingGIF = false; // Set recording flag to false
    console.log('🎬 Stopped recording. Processing GIF...'); // Log stop message
    
    // Reset button appearance to default state
    if (buttons.gifBtn) { // If GIF button exists
        buttons.gifBtn.html(`🎬 Record GIF (${gifSettings.duration}s)`); // Restore original button text
        buttons.gifBtn.style('background-color', 'rgba(0, 255, 159, 0.15)'); // Restore green background
    }
    
    // Create GIF from captured frames
    createGIFFromFrames(); // Call GIF processing function
}

// ============================================
// CREATE GIF FROM FRAMES FUNCTION
// ============================================
// Loads gifshot library and initiates GIF creation
function createGIFFromFrames() {
    if (gifFrames.length === 0) { // If no frames were captured
        console.log('❌ No frames to save!'); // Log error
        alert('No frames captured!'); // Alert user
        return; // Exit function
    }
    
    console.log(`📦 Processing ${gifFrames.length} frames into GIF...`); // Log frame count
    
    // Load gifshot library if not already loaded
    if (typeof gifshot === 'undefined') { // If gifshot library not loaded
        let script = document.createElement('script'); // Create script element
        script.src = 'https://cdn.jsdelivr.net/npm/gifshot@0.4.5/dist/gifshot.min.js'; // Set CDN URL
        script.onload = function() { // On successful load
            processGIF(); // Call GIF processing function
        };
        script.onerror = function() { // On load error
            console.error('❌ Failed to load gifshot library'); // Log error
            alert('Failed to load GIF library. Please check your internet connection.'); // Alert user
            gifFrames = []; // Clear frames array
            gifFrameCount = 0; // Reset frame counter
        };
        document.head.appendChild(script); // Add script to document head
    } else { // If library already loaded
        processGIF(); // Call GIF processing function immediately
    }
}

// ============================================
// PROCESS GIF FUNCTION
// ============================================
// Converts captured frames to GIF and downloads it
function processGIF() {
    // Convert p5.Image objects to base64 images
    let images = []; // Initialize images array
    for (let i = 0; i < gifFrames.length; i++) { // Loop through all captured frames
        images.push(gifFrames[i].canvas.toDataURL()); // Convert canvas to base64 data URL and add to array
    }
    
    console.log('⏳ Rendering GIF... This may take a moment...'); // Log processing message
    
    // Create GIF using gifshot library
    gifshot.createGIF({ // Call gifshot with options
        images: images, // Array of base64 image data
        gifWidth: width, // GIF width (canvas width)
        gifHeight: height, // GIF height (canvas height)
        interval: 1 / gifSettings.fps, // Interval between frames in seconds
        numFrames: gifFrames.length, // Total number of frames
        frameDuration: 1, // Duration multiplier for each frame
        sampleInterval: 10, // Sampling interval for color quantization
        numWorkers: 2 // Number of web workers for parallel processing
    }, function(obj) { // Callback function when GIF is ready
        if (!obj.error) { // If no error occurred
            console.log('✅ GIF created successfully!'); // Log success
            
            // Download the GIF
            let link = document.createElement('a'); // Create anchor element
            link.download = 'chemical-reactor-' + Date.now() + '.gif'; // Set filename with timestamp
            link.href = obj.image; // Set href to base64 GIF data
            document.body.appendChild(link); // Add link to document
            link.click(); // Programmatically click link to trigger download
            document.body.removeChild(link); // Remove link from document
            
            console.log('💾 GIF downloaded!'); // Log download confirmation
        } else { // If error occurred
            console.error('❌ Error creating GIF:', obj.error); // Log error details
            alert('Error creating GIF: ' + obj.error); // Alert user with error message
        }
        
        // Clean up
        gifFrames = []; // Clear frames array to free memory
        gifFrameCount = 0; // Reset frame counter
    });
}

// ============================================
// WINDOW RESIZED FUNCTION
// ============================================
// Handles window resize events
function windowResized() {
    resizeCanvas(windowWidth, windowHeight); // Resize canvas to match new window size
    let oldGridSize = gridSize; // Store old grid size
    updateGridSize(); // Recalculate grid dimensions based on new canvas size
    if (oldGridSize !== gridSize) { // If grid size changed
        initializeGrid(); // Reset grid with new dimensions
    }
    
    // Update GUI containers max height and bounds
    if (guiContainer) { // If main GUI container exists
        guiContainer.style('max-height', (height - 40) + 'px'); // Update max height to fit new window
        // Update GUI bounds for click detection
        updateGUIBounds(); // Recalculate GUI collision bounds
    }
    if (actionsGuiContainer) { // If actions GUI container exists
        actionsGuiContainer.style('max-height', (height - 40) + 'px'); // Update max height to fit new window
    }
}

// ============================================
// UPDATE GUI BOUNDS FUNCTION
// ============================================
// Recalculates GUI boundaries for mouse collision detection
function updateGUIBounds() {
    // Update the bounds based on actual GUI size
    // Account for scrollable content
    let maxHeight = min(height - 40, 850); // Calculate max height (cap at 850px or window height)
    guiBounds.height = maxHeight; // Update GUI bounds height
}

// ============================================
// KEY PRESSED FUNCTION
// ============================================
// Handles keyboard shortcuts
function keyPressed() {
    if (key === 'c' || key === 'C') { // If C key pressed
        initializeGrid(); // Clear canvas by resetting grid
    }
    
    if (key === 's' || key === 'S') { // If S key pressed
        // Hide GUI temporarily for clean screenshot
        let wasShowing = showGUI; // Store current GUI visibility state
        showGUI = false; // Hide GUI
        isSavingImage = true; // Set flag to prevent Show GUI indicator
        
        // Wait one frame to ensure GUI is hidden, then save
        setTimeout(() => { // Delay execution by 50ms
            saveCanvas('chemical-reactor', 'png'); // Save canvas as PNG file
            // Restore GUI visibility
            showGUI = wasShowing; // Restore original GUI visibility state
            isSavingImage = false; // Reset saving flag
        }, 50); // 50 milliseconds delay
    }
    
    if (key === 'h' || key === 'H') { // If H key pressed
        params.halftone = !params.halftone; // Toggle halftone effect on/off
    }
    
    if (key === 'g' || key === 'G') { // If G key pressed
        toggleGUI(); // Toggle GUI visibility
    }
    
    if (key === 'r' || key === 'R') { // If R key pressed
        resetToDefaults(); // Reset all parameters to defaults
    }
    
    // Presets (1-9) - Number keys load corresponding presets
    if (key === '1') loadPreset('Coral'); // Key 1 loads Coral preset
    if (key === '2') loadPreset('Maze'); // Key 2 loads Maze preset
    if (key === '3') loadPreset('Mitosis'); // Key 3 loads Mitosis preset
    if (key === '4') loadPreset('Worms'); // Key 4 loads Worms preset
    if (key === '5') loadPreset('Waves'); // Key 5 loads Waves preset
    if (key === '6') loadPreset('Spirals'); // Key 6 loads Spirals preset
    if (key === '7') loadPreset('Chaos'); // Key 7 loads Chaos preset
    if (key === '8') loadPreset('Fingerprint'); // Key 8 loads Fingerprint preset
    if (key === '9') loadPreset('Bubbles'); // Key 9 loads Bubbles preset
}