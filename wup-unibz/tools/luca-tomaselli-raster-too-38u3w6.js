// ==========================================
// WUP 25/26 TOMASELLI LUCA
// ==========================================

let img;
let canvas;
let densityString = "@%#*+=-:. ";

// UI Elements
let modeSelect, resSlider, resVal, threshSlider, threshVal, noiseSlider, animateCheck;
let bgColorPicker, fillColorPicker, originalColorCheck, fileInput, dropZone, dropOverlay;
let noiseSpeedSlider, noiseSpeedVal;

// Brush & FX UI
let brushMenu, brushSizeSlider, brushSizeVal, eraserBtn, isEraser = false;
let fxPanel, contrastSlider, saturationSlider;

// Toolbar & Interaction
let activeTool = 'none';
let maskBuffer;
let textBuffer; // Optimization: Reusable buffer for text effects
let zoomLevel = 1.0;
let isMirrored = false;
let isInverted = false;
let noiseTime = 0;
let isExportingTransparent = false;

// Add this at the very top of sketch.js with other variables
let maskHasPixels = false;

let undoStack = []; // New global for Undo

// Add these globals at the top
let randomSizeState = false;
let sizeSeed = 0;

let textObjects = []; // Array to store all text items
let selectedTextIdx = -1; // Which text is currently selected
let isDraggingText = false;
let dragOffsetX = 0;
let dragOffsetY = 0;

// Add this global variable at the top if not already there
let randomSizeCheck;

let textSettings = {
    content: "RASTER",
    size: 100,
    font: 'Anton',
    x: 0, y: 0,
    align: 'CENTER',
    renderMode: 'vector', // 'vector', 'outline', 'raster'
    fill: '#ffffff',
    stroke: '#000000',
    strokeWeight: 0
};
let standardPanel, textPanel;
let textInput, fontSelect, textSizeSlider, textColorPicker, textStrokePicker, textStrokeSlider, renderModeSelect;
let composit;
// Global Undo Stack
let globalUndoStack = [];
let textXSlider, textYSlider; // New sliders for text pos

function setup() {
    pixelDensity(1);

    // Fonts & Icons
    if (!document.getElementById('font-link')) {
        let link = document.createElement('link');
        link.id = 'font-link'; link.rel = 'stylesheet';
        link.href = 'https://fonts.googleapis.com/css2?family=Anton&family=Bangers&family=Inter:wght@400;600&family=Lobster&family=Playfair+Display:wght@700&family=Space+Mono:wght@400;700&display=swap';
        document.head.appendChild(link);
    }
    if (!document.getElementById('fa-link')) {
        let link = document.createElement('link');
        link.id = 'fa-link'; link.rel = 'stylesheet'; link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
        document.head.appendChild(link);
    }

    const styleSheet = document.createElement("style");
    styleSheet.innerText = `
        :root { --bg-app: #000000; --bg-panel: #141414; --accent: #ff0055; --text-main: #f0f0f0; --text-muted: #888888; --border: #333333; --input-bg: #1f1f1f; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background-color: var(--bg-app); font-family: 'Inter', sans-serif; color: var(--text-main); height: 100vh; overflow: hidden; }
        .app-container { display: flex; flex-direction: column; height: 100%; width: 100%; }
        .main-area { display: flex; flex-grow: 1; overflow: hidden; position: relative; } 
        .top-bar { height: 50px; background-color: var(--bg-panel); border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; padding: 0 20px; z-index: 30; }
        .export-wrapper { position: relative; }
        .export-menu { display: none; position: absolute; top: 100%; left: 0; margin-top: 10px; background: var(--bg-panel); border: 1px solid var(--border); border-radius: 6px; box-shadow: 0 5px 20px rgba(0,0,0,0.5); width: 160px; z-index: 100; flex-direction: column; }
        .export-menu.open { display: flex; }
        .export-item { padding: 10px 15px; color: var(--text-main); cursor: pointer; font-size: 13px; transition: 0.2s; display: flex; justify-content: space-between; }
        .export-item:hover { background: var(--accent); color: white; }
        .sidebar { width: 280px; background-color: var(--bg-panel); border-right: 1px solid var(--border); padding: 20px; display: flex; flex-direction: column; gap: 15px; overflow-y: auto; }
        .panel-section { display: flex; flex-direction: column; gap: 18px; } 
        .hidden { display: none !important; } 
        .toolbar-right { width: 70px; background-color: var(--bg-panel); border-left: 1px solid var(--border); display: flex; flex-direction: column; align-items: center; padding: 20px 0; gap: 15px; z-index: 40; }
        input[type=text], textarea { width: 100%; background: #222; border: 1px solid #333; color: white; padding: 10px; border-radius: 6px; font-family: 'Inter', sans-serif; outline: none; resize: vertical; min-height: 60px;}
        input[type=text]:focus, textarea:focus { border-color: var(--accent); }
        input[type=range] { -webkit-appearance: none; width: 100%; background: transparent; cursor: pointer; margin: 5px 0; }
        input[type=range]::-webkit-slider-runnable-track { width: 100%; height: 6px; background: #2a2a2a; border-radius: 3px; border: 1px solid #333; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; height: 16px; width: 16px; border-radius: 50%; background: var(--text-main); margin-top: -6px; border: 2px solid var(--bg-panel); transition: background 0.2s; }
        input[type=range]:hover::-webkit-slider-thumb { background: var(--accent); }
        .checkbox-row { display: flex; align-items: center; gap: 10px; cursor: pointer; }
        .custom-checkbox { position: relative; width: 36px; height: 20px; background: #333; border-radius: 10px; transition: 0.3s; }
        .custom-checkbox::after { content: ''; position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; background: white; border-radius: 50%; transition: 0.3s; }
        input[type="checkbox"] { display: none; }
        input[type="checkbox"]:checked + .custom-checkbox { background: var(--accent); }
        input[type="checkbox"]:checked + .custom-checkbox::after { transform: translateX(16px); }
        .checkbox-label { font-size: 11px; text-transform: uppercase; font-weight: 600; color: var(--text-muted); select-none: none; }
        select { width: 100%; background: #222; border: 1px solid #333; color: white; padding: 10px; border-radius: 6px; cursor: pointer; font-family: 'Inter', sans-serif; font-size: 12px; outline: none; transition: 0.2s; }
        .val-display { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--accent); }
        .control-group { display: flex; flex-direction: column; gap: 8px; }
        .label-row { display: flex; justify-content: space-between; align-items: center; }
        .brand { font-family: 'Space Mono', monospace; font-size: 18px; font-weight: 700; }
        .brand .highlight { color: var(--accent); }
        .btn-primary { background: var(--accent); color: white; border: none; padding: 8px 16px; border-radius: 4px; font-weight: 600; cursor: pointer; font-size: 13px; }
        .btn-danger { background: #ff3333; color: white; border: none; padding: 8px 16px; border-radius: 4px; font-weight: 600; cursor: pointer; font-size: 13px; width: 100%; margin-top:5px; }
        .color-row { display: flex; gap: 10px; align-items: center; }
        .color-input-wrapper { width: 30px; height: 30px; border-radius: 6px; overflow: hidden; border: 1px solid var(--border); position: relative; }
        input[type="color"] { position: absolute; width: 150%; height: 150%; top: -25%; left: -25%; border: none; cursor: pointer; }
        .floating-panel { position: absolute; right: 80px; background: var(--bg-panel); border: 1px solid var(--border); border-radius: 8px; padding: 15px; width: 220px; display: none; flex-direction: column; gap: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.8); z-index: 50; }
        .panel-close { position: absolute; top: 10px; right: 10px; cursor: pointer; color: var(--text-muted); }
        .brush-controls { display: flex; gap: 10px; margin-top: 5px; flex-wrap: wrap; }
        .brush-btn-small { flex: 1; padding: 8px; background: var(--input-bg); border: 1px solid var(--border); color: white; border-radius: 4px; cursor: pointer; text-align: center; font-size: 12px; }
        .brush-btn-small:hover { border-color: var(--accent); }
        .brush-btn-small.active { background: var(--accent); border-color: var(--accent); }
        .tool-btn { width: 45px; height: 45px; background-color: #222; border: 1px solid #444; border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; color: white !important; font-size: 20px; }
        .tool-btn:hover { border-color: var(--accent); background: #333; }
        .tool-btn.active { background-color: var(--accent); border-color: var(--accent); box-shadow: 0 0 10px var(--accent); }
        .align-group { display: flex; background: #222; border: 1px solid #333; border-radius: 6px; overflow: hidden; margin-top: 5px; }
        .align-btn { flex: 1; padding: 8px; cursor: pointer; text-align: center; color: #666; font-size: 14px; transition: 0.2s; border-right: 1px solid #333; }
        .align-btn:last-child { border-right: none; }
        .align-btn:hover { background: #333; color: white; }
        .align-btn.active { background: var(--accent); color: white; }
        #canvas-container { flex-grow: 1; background-color: #050505; position: relative; overflow: hidden; display: flex; justify-content: center; align-items: center; }
        #drop-overlay { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; color: #555; pointer-events: none; }
    `;
    document.head.appendChild(styleSheet);

    let appContainer = createDiv().class('app-container');
    let topBar = createDiv().class('top-bar').parent(appContainer);
    let exportWrap = createDiv().class('export-wrapper').parent(topBar);
    let exportBtn = createButton('<i class="fa-solid fa-download"></i> Export').class('btn-primary').parent(exportWrap);
    let exportMenu = createDiv().class('export-menu').parent(exportWrap);
    let opts = [{ lbl: 'JPG', desc: 'Solid BG', type: 'jpg' }, { lbl: 'PNG', desc: 'Transparent', type: 'png' }, { lbl: 'WEBP', desc: 'Web Ready', type: 'webp' }, { lbl: 'JSON', desc: 'Settings', type: 'json' }];
    opts.forEach(o => {
        let item = createDiv(`${o.lbl} <span>${o.desc}</span>`).class('export-item').parent(exportMenu);
        item.mousePressed(() => { handleExport(o.type); exportMenu.removeClass('open'); });
    });
    exportBtn.mousePressed(() => { let isOpen = exportMenu.elt.classList.contains('open'); if (isOpen) exportMenu.removeClass('open'); else exportMenu.addClass('open'); });
    createDiv('<i class="fa-solid fa-layer-group"></i> Raster<span class="highlight">Tool</span>').class('brand').parent(topBar);

    let mainArea = createDiv().class('main-area').parent(appContainer);
    let sidebar = createDiv().class('sidebar').parent(mainArea);

    standardPanel = createDiv().class('panel-section').parent(sidebar);
    let uploadBtn = createButton('<i class="fa-solid fa-image"></i> Upload Image').class('btn-primary').style('width:100%').parent(standardPanel);
    fileInput = createInput('', 'file').attribute('accept', 'image/*').attribute('hidden', 'true').parent(standardPanel);
    uploadBtn.mousePressed(() => fileInput.elt.click());
    fileInput.elt.addEventListener('change', handleFile);

    createDiv().class('divider').parent(standardPanel);

    let modeGroup = createDiv().class('control-group').parent(standardPanel);
    createSpan('Style Mode').class('checkbox-label').parent(modeGroup);
    modeSelect = createSelect().parent(modeGroup);
    ['◼ Pixelate', '● Halftone', '✕ Compass', '☰ Scanline', '@ ASCII', '✱ Random Fusion'].forEach((m, i) => {
        let val = ['square', 'circle', 'compass', 'scanline', 'ascii', 'random'][i];
        modeSelect.option(m, val);
    });
    modeSelect.changed(() => redraw());

    let resGroup = createDiv().class('control-group').parent(standardPanel);
    let resLabelRow = createDiv().class('label-row').parent(resGroup);
    let leftLabel = createDiv().style('display:flex; align-items:center;').parent(resLabelRow);
    createSpan('Grid Size').class('checkbox-label').parent(leftLabel);
    let rndRow = createDiv().class('checkbox-row').parent(standardPanel);
    randomSizeCheck = createInput('', 'checkbox').parent(rndRow);
    createDiv().class('custom-checkbox').parent(rndRow).mousePressed(() => { randomSizeCheck.elt.checked = !randomSizeCheck.elt.checked; randomSizeCheck.elt.dispatchEvent(new Event('change')); });
    createSpan('Random Sizes').class('checkbox-label').parent(rndRow);
    randomSizeCheck.changed(() => { if (randomSizeCheck.elt.checked) sizeSeed = random(1000); redraw(); });
    let valDisp = createSpan('12px').class('val-display').parent(resLabelRow);
    resSlider = createSlider(5, 100, 12).parent(resGroup);
    resSlider.input(() => { valDisp.html(resSlider.value() + 'px'); redraw(); });

    let threshGroup = createDiv().class('control-group').parent(standardPanel);
    let threshRow = createDiv().class('label-row').parent(threshGroup);
    createSpan('Threshold').class('checkbox-label').parent(threshRow);
    threshVal = createSpan('0%').class('val-display').parent(threshRow);
    threshSlider = createSlider(0, 100, 0).parent(threshGroup);
    threshSlider.input(() => { threshVal.html(threshSlider.value() + '%'); redraw(); });

    let noiseGroup = createDiv().class('control-group').parent(standardPanel);
    createSpan('Distortion (Noise)').class('checkbox-label').parent(noiseGroup);
    noiseSlider = createSlider(0, 100, 0).parent(noiseGroup);
    noiseSlider.input(() => redraw());

    let speedGroup = createDiv().class('control-group').parent(standardPanel);
    let speedRow = createDiv().class('label-row').parent(speedGroup);
    createSpan('Noise Speed').class('checkbox-label').parent(speedRow);
    noiseSpeedVal = createSpan('1x').class('val-display').parent(speedRow);
    noiseSpeedSlider = createSlider(1, 20, 5).parent(speedGroup);
    noiseSpeedSlider.input(() => { noiseSpeedVal.html((noiseSpeedSlider.value() / 5).toFixed(1) + 'x'); });

    let animRow = createDiv().class('checkbox-row').parent(standardPanel);
    animateCheck = createInput('', 'checkbox').parent(animRow);
    createDiv().class('custom-checkbox').parent(animRow).mousePressed(() => { animateCheck.elt.checked = !animateCheck.elt.checked; animateCheck.elt.dispatchEvent(new Event('change')); });
    createSpan('Animate Noise').class('checkbox-label').parent(animRow);
    animateCheck.changed(() => { if (animateCheck.elt.checked) loop(); else noLoop(); });

    createDiv().class('divider').parent(standardPanel);

    let colorRowSection = createDiv().class('color-row').parent(standardPanel);
    let bgWrap = createDiv().class('color-input-wrapper').parent(colorRowSection);
    bgColorPicker = createInput('#111111', 'color').parent(bgWrap);
    let fillWrap = createDiv().class('color-input-wrapper').parent(colorRowSection);
    fillColorPicker = createInput('#ff0055', 'color').parent(fillWrap);
    let origRow = createDiv().class('checkbox-row').style('margin-left', 'auto').parent(colorRowSection);
    originalColorCheck = createInput('', 'checkbox').attribute('checked', 'true').parent(origRow);
    createDiv().class('custom-checkbox').parent(origRow).mousePressed(() => { originalColorCheck.elt.checked = !originalColorCheck.elt.checked; originalColorCheck.elt.dispatchEvent(new Event('input')); });
    createSpan('Original').class('checkbox-label').parent(origRow);
    bgColorPicker.changed(() => redraw()); fillColorPicker.changed(() => redraw()); originalColorCheck.input(() => redraw());

    // ============================
    // 2. TEXT PANEL (MULTIPLE TEXT SUPPORT)
    // ============================
    textPanel = createDiv().class('panel-section hidden').parent(sidebar);
    createDiv('<i class="fa-solid fa-font"></i> Text Editor').class('brand').style('font-size:14px; margin-bottom:10px;').parent(textPanel);

    // Create Text Button
    let createTextBtn = createButton('<i class="fa-solid fa-plus"></i> Add New Text').class('btn-primary').parent(textPanel);
    createTextBtn.mousePressed(() => createNewText());

    // Content
    let txtGroup = createDiv().class('control-group').parent(textPanel);
    createSpan('Content').class('checkbox-label').parent(txtGroup);
    textInput = createElement('textarea', 'RASTER').parent(txtGroup);
    textInput.input(() => {
        if (selectedTextIdx > -1) {
            textObjects[selectedTextIdx].content = textInput.value();
            redraw();
        }
    });

    // Font Family
    let fontGroup = createDiv().class('control-group').parent(textPanel);
    createSpan('Font Family').class('checkbox-label').parent(fontGroup);
    fontSelect = createSelect().parent(fontGroup);
    ['Anton', 'Bangers', 'Inter', 'Lobster', 'Playfair Display', 'Space Mono', 'Arial', 'Courier New'].forEach(f => {
        let opt = createElement('option', f);
        opt.attribute('value', f);
        opt.style('font-family', f);
        opt.parent(fontSelect);
    });
    fontSelect.changed(() => { if (selectedTextIdx > -1) { textObjects[selectedTextIdx].font = fontSelect.value(); redraw(); } });

    // Alignment
    let alignGroup = createDiv().class('control-group').parent(textPanel);
    createSpan('Alignment').class('checkbox-label').parent(alignGroup);
    let alignRow = createDiv().class('align-group').parent(alignGroup);
    let btnLeft = createDiv('<i class="fa-solid fa-align-left"></i>').class('align-btn').parent(alignRow);
    let btnCenter = createDiv('<i class="fa-solid fa-align-center"></i>').class('align-btn active').parent(alignRow);
    let btnRight = createDiv('<i class="fa-solid fa-align-right"></i>').class('align-btn').parent(alignRow);
    btnLeft.mousePressed(() => setAlign('LEFT', btnLeft));
    btnCenter.mousePressed(() => setAlign('CENTER', btnCenter));
    btnRight.mousePressed(() => setAlign('RIGHT', btnRight));

    // Position Sliders (Hidden but needed for logic)
    let posGroup = createDiv().class('control-group hidden').parent(textPanel); // Keep hidden or show if desired
    textXSlider = createSlider(-1000, 1000, 0).parent(posGroup);
    textYSlider = createSlider(-1000, 1000, 0).parent(posGroup);
    textXSlider.input(() => { if (selectedTextIdx > -1) { textObjects[selectedTextIdx].x = textXSlider.value(); redraw(); } });
    textYSlider.input(() => { if (selectedTextIdx > -1) { textObjects[selectedTextIdx].y = textYSlider.value(); redraw(); } });

    // Size
    let tSizeGroup = createDiv().class('control-group').parent(textPanel);
    let tSizeRow = createDiv().class('label-row').parent(tSizeGroup);
    createSpan('Size').class('checkbox-label').parent(tSizeRow);
    let tSizeVal = createSpan('100px').class('val-display').parent(tSizeRow);
    textSizeSlider = createSlider(10, 400, 100).parent(tSizeGroup);
    textSizeSlider.input(() => {
        if (selectedTextIdx > -1) {
            textObjects[selectedTextIdx].size = textSizeSlider.value();
            tSizeVal.html(textSizeSlider.value() + 'px');
            redraw();
        }
    });

    // Render Mode (UPDATED)
    let renderGroup = createDiv().class('control-group').parent(textPanel);
    createSpan('Render Mode').class('checkbox-label').parent(renderGroup);
    renderModeSelect = createSelect().parent(renderGroup);
    renderModeSelect.option('Vector (Solid)', 'vector');
    renderModeSelect.option('Vector (Outline)', 'outline');
    renderModeSelect.option('Pixelate (Square)', 'pixel_square');
    renderModeSelect.option('Pixelate (Round)', 'pixel_round');
    renderModeSelect.option('Merged (Image Style)', 'merged');
    renderModeSelect.selected('vector');
    renderModeSelect.changed(() => { if (selectedTextIdx > -1) { textObjects[selectedTextIdx].renderMode = renderModeSelect.value(); redraw(); } });

    // Fill & Stroke Colors
    let colorGrp = createDiv().class('control-group').style('margin-top:10px').parent(textPanel);
    let colorRow = createDiv().class('label-row').parent(colorGrp);
    let fillBox = createDiv().style('display:flex; flex-direction:column; gap:5px;').parent(colorRow);
    createSpan('Fill').class('checkbox-label').parent(fillBox);
    let tFillWrap = createDiv().class('color-input-wrapper').parent(fillBox);
    textColorPicker = createInput('#ffffff', 'color').parent(tFillWrap);
    textColorPicker.changed(() => { if (selectedTextIdx > -1) { textObjects[selectedTextIdx].fill = textColorPicker.value(); redraw(); } });

    let strokeBox = createDiv().style('display:flex; flex-direction:column; gap:5px;').parent(colorRow);
    createSpan('Stroke').class('checkbox-label').parent(strokeBox);
    let tStrokeWrap = createDiv().class('color-input-wrapper').parent(strokeBox);
    textStrokePicker = createInput('#000000', 'color').parent(tStrokeWrap);
    textStrokePicker.changed(() => { if (selectedTextIdx > -1) { textObjects[selectedTextIdx].stroke = textStrokePicker.value(); redraw(); } });

    // Stroke Weight
    let strWGroup = createDiv().class('control-group').parent(textPanel);
    let strWRow = createDiv().class('label-row').parent(strWGroup);
    createSpan('Stroke Width').class('checkbox-label').parent(strWRow);
    let strWVal = createSpan('0px').class('val-display').parent(strWRow);
    textStrokeSlider = createSlider(0, 20, 0).parent(strWGroup);
    textStrokeSlider.input(() => {
        if (selectedTextIdx > -1) {
            textObjects[selectedTextIdx].strokeWeight = textStrokeSlider.value();
            strWVal.html(textStrokeSlider.value() + 'px');
            redraw();
        }
    });

    // Delete Text Button
    let deleteTextBtn = createButton('<i class="fa-solid fa-trash"></i> Delete Selected Text').class('btn-danger').parent(textPanel);
    deleteTextBtn.mousePressed(() => deleteSelectedText());

    createDiv().class('divider').parent(textPanel);
    let closeTextBtn = createButton('Close Text Tool').class('btn-primary').style('background:#333').parent(textPanel);
    closeTextBtn.mousePressed(() => handleToolClick('text', document.getElementById('btn-text')));

    dropZone = createDiv().id('canvas-container').parent(mainArea);
    dropOverlay = createDiv('<i class="fa-regular fa-image" style="font-size: 40px; display:block; margin-bottom:10px;"></i><p>Drop Image Here</p>').id('drop-overlay').parent(dropZone);

    let toolbar = createDiv().class('toolbar-right').parent(mainArea);
    const tools = [
        { id: 'brush', icon: 'fa-paintbrush', title: 'Brush Tool' },
        { id: 'text', icon: 'fa-font', title: 'Text Tool' },
        { id: 'undo', icon: 'fa-rotate-left', title: 'Undo Action' },
        { id: 'fx', icon: 'fa-sliders', title: 'Effects Panel' },
        { id: 'mirror', icon: 'fa-arrows-left-right', title: 'Mirror Image' },
        { id: 'invert', icon: 'fa-circle-half-stroke', title: 'Invert Colors' },
        { id: 'zoom', icon: 'fa-magnifying-glass-plus', title: 'Zoom 1.5x' },
        { id: 'reset', icon: 'fa-trash-can', title: 'Reset Mask' }
    ];
    tools.forEach(t => {
        let btn = createDiv(`<i class="fa-solid ${t.icon}"></i>`).class('tool-btn').id(`btn-${t.id}`).parent(toolbar).attribute('title', t.title);
        btn.mousePressed(() => handleToolClick(t.id, btn));
    });

    brushMenu = createDiv().class('floating-panel').style('top', '20px').parent(mainArea);
    brushMenu.elt.addEventListener('mousedown', (e) => e.stopPropagation());
    createDiv('<i class="fa-solid fa-xmark"></i>').class('panel-close').parent(brushMenu).mousePressed(() => toggleBrushMenu(false));
    createElement('h4', 'Brush Settings').parent(brushMenu);
    let bSizeRow = createDiv().class('label-row').parent(brushMenu);
    createSpan('Size').class('checkbox-label').parent(bSizeRow);
    brushSizeVal = createSpan('50px').class('val-display').parent(bSizeRow);
    brushSizeSlider = createSlider(10, 200, 50).parent(brushMenu);
    brushSizeSlider.input(() => { brushSizeVal.html(brushSizeSlider.value() + 'px'); });
    let bControls = createDiv().class('brush-controls').parent(brushMenu);
    eraserBtn = createDiv('Eraser').class('brush-btn-small').parent(bControls);
    eraserBtn.mousePressed(() => { isEraser = !isEraser; if (isEraser) eraserBtn.addClass('active'); else eraserBtn.removeClass('active'); });
    let undoBtn = createDiv('Undo').class('brush-btn-small').parent(bControls);
    undoBtn.mousePressed(() => performBrushUndo());
    let exitBtn = createDiv('Exit').class('brush-btn-small').style('width: 100%; margin-top:5px;').parent(bControls);
    exitBtn.mousePressed(() => toggleBrushMenu(false));

    fxPanel = createDiv().class('floating-panel').style('top', '140px').parent(mainArea);
    fxPanel.elt.addEventListener('mousedown', (e) => e.stopPropagation());
    createDiv('<i class="fa-solid fa-xmark"></i>').class('panel-close').parent(fxPanel).mousePressed(() => { fxPanel.style('display', 'none'); document.getElementById('btn-fx').classList.remove('active'); });
    createElement('h4', 'Post-Processing').parent(fxPanel);
    createSpan('Contrast').class('checkbox-label').parent(fxPanel);
    contrastSlider = createSlider(1.0, 3.0, 1.0, 0.1).parent(fxPanel);
    createSpan('Saturation').class('checkbox-label').parent(fxPanel);
    saturationSlider = createSlider(0.0, 2.0, 1.0, 0.1).parent(fxPanel);
    [contrastSlider, saturationSlider].forEach(el => el.input(() => redraw()));

    let w = dropZone.elt.offsetWidth;
    let h = dropZone.elt.offsetHeight;
    canvas = createCanvas(w, h);
    canvas.parent(dropZone);
    maskBuffer = createGraphics(1, 1);
    composit = createGraphics(1, 1);

    let allInputs = [
        resSlider, threshSlider, noiseSlider, noiseSpeedSlider,
        textSizeSlider, textStrokeSlider,
        contrastSlider, saturationSlider,
        bgColorPicker, fillColorPicker, textColorPicker, textStrokePicker,
        modeSelect, fontSelect, renderModeSelect
    ];
    allInputs.forEach(inp => {
        if (inp) inp.elt.addEventListener('mousedown', saveGlobalState);
    });
}

function handleToolClick(id, btn) {
    if (id !== 'brush') toggleBrushMenu(false, true);
    if (id !== 'fx') fxPanel.style('display', 'none');

    // TOGGLE SIDEBAR CONTENT
    if (id === 'text') {
        if (activeTool === 'text') {
            activeTool = 'none';
            textPanel.addClass('hidden');
            standardPanel.removeClass('hidden');
        } else {
            activeTool = 'text';
            standardPanel.addClass('hidden');
            textPanel.removeClass('hidden');
        }
    }
    else if (id === 'brush') {
        if (activeTool === 'text') { textPanel.addClass('hidden'); standardPanel.removeClass('hidden'); }
        if (activeTool === 'brush') toggleBrushMenu(false);
        else { activeTool = 'brush'; toggleBrushMenu(true); }
    }
    else if (id === 'undo') {
        performGlobalUndo(); // Main toolbar undo
    }
    else {
        if (activeTool === 'text') { textPanel.addClass('hidden'); standardPanel.removeClass('hidden'); }

        if (id === 'fx') {
            let isVis = fxPanel.style('display') === 'flex';
            fxPanel.style('display', isVis ? 'none' : 'flex');
            if (!isVis) btn.addClass('active'); else btn.removeClass('active');
        } else if (id === 'mirror') {
            isMirrored = !isMirrored;
        } else if (id === 'invert') {
            isInverted = !isInverted;
        } else if (id === 'zoom') {
            zoomLevel = zoomLevel === 1.0 ? 1.5 : 1.0;
        } else if (id === 'reset') {
            img = null; maskBuffer.background(0); maskHasPixels = false;
            background(bgColorPicker.value()); dropOverlay.style('display', 'block'); fileInput.value('');
            activeTool = 'none'; toggleBrushMenu(false);
            textPanel.addClass('hidden'); standardPanel.removeClass('hidden');
        }
    }

    document.querySelectorAll('.tool-btn').forEach(b => {
        if (b.id !== 'btn-fx') b.classList.remove('active');
    });

    if (activeTool === 'brush') document.getElementById('btn-brush').classList.add('active');
    if (activeTool === 'text') document.getElementById('btn-text').classList.add('active');

    redraw();
}

// --- GLOBAL UNDO LOGIC ---
function saveGlobalState() {
    let state = {
        mode: modeSelect.value(),
        grid: resSlider.value(),
        thresh: threshSlider.value(),
        noise: noiseSlider.value(),
        noiseSpeed: noiseSpeedSlider.value(),
        animate: animateCheck.elt.checked,
        randomSize: randomSizeCheck.elt.checked,
        origColor: originalColorCheck.elt.checked,
        contrast: contrastSlider.value(),
        saturation: saturationSlider.value(),
        bgColor: bgColorPicker.value(),
        fillColor: fillColorPicker.value(),

        // Text Settings Copy
        txtContent: textSettings.content,
        txtSize: textSettings.size,
        txtFont: textSettings.font,
        txtX: textSettings.x,
        txtY: textSettings.y,
        txtRaster: textSettings.rasterize,
        txtFill: textSettings.fill
    };

    if (globalUndoStack.length > 20) globalUndoStack.shift();
    globalUndoStack.push(state);
}

function performGlobalUndo() {
    if (globalUndoStack.length > 0) {
        let s = globalUndoStack.pop();

        // Restore DOM
        modeSelect.value(s.mode);
        resSlider.value(s.grid);
        threshSlider.value(s.thresh);
        noiseSlider.value(s.noise);
        noiseSpeedSlider.value(s.noiseSpeed);
        contrastSlider.value(s.contrast);
        saturationSlider.value(s.saturation);

        animateCheck.elt.checked = s.animate;
        randomSizeCheck.elt.checked = s.randomSize;
        originalColorCheck.elt.checked = s.origColor;

        bgColorPicker.value(s.bgColor);
        fillColorPicker.value(s.fillColor);

        // Restore Text
        textSettings.content = s.txtContent;
        textSettings.size = s.txtSize;
        textSettings.font = s.txtFont;
        textSettings.x = s.txtX;
        textSettings.y = s.txtY;
        textSettings.rasterize = s.txtRaster;
        textSettings.fill = s.txtFill;

        textInput.value(s.txtContent);
        textSizeSlider.value(s.txtSize);
        textXSlider.value(s.txtX);
        textYSlider.value(s.txtY);
        textColorPicker.value(s.txtFill);
        textRasterCheck.elt.checked = s.txtRaster;

        redraw();
    }
}

// --- BRUSH UNDO LOGIC ---
function performBrushUndo() {
    if (undoStack.length > 0) {
        let prev = undoStack.pop();
        maskBuffer.clear();
        maskBuffer.image(prev, 0, 0);
        maskBuffer.loadPixels();
        maskHasPixels = false;
        for (let i = 3; i < maskBuffer.pixels.length; i += 16) {
            if (maskBuffer.pixels[i] > 0) { maskHasPixels = true; break; }
        }
        redraw();
    }
}

function performUndo() {
    if (undoStack.length > 0) {
        let prev = undoStack.pop();
        maskBuffer.clear();
        maskBuffer.image(prev, 0, 0);
        maskBuffer.loadPixels();
        maskHasPixels = false;
        for (let i = 3; i < maskBuffer.pixels.length; i += 16) {
            if (maskBuffer.pixels[i] > 0) { maskHasPixels = true; break; }
        }
        redraw();
    }
}

function mousePressed() {
    // 1. Handle Text Tool Clicks
    if (activeTool === 'text') {
        let scaleFactor = Math.min(width / img.width, height / img.height) * 0.9 * zoomLevel;
        let startX = (width - img.width * scaleFactor) / 2;
        let startY = (height - img.height * scaleFactor) / 2;

        let mx = (mouseX - startX) / scaleFactor - img.width / 2;
        let my = (mouseY - startY) / scaleFactor - img.height / 2;

        // Ensure we are clicking on canvas area, not panels
        if (mouseX > 280 && mouseX < width - 70) {
            let clickedIdx = -1;

            for (let i = textObjects.length - 1; i >= 0; i--) {
                // FIX: Use Rectangular Hit Detection
                if (isMouseOverText(mx, my, textObjects[i])) {
                    clickedIdx = i;
                    break;
                }
            }

            if (clickedIdx > -1) {
                selectedTextIdx = clickedIdx;
                isDraggingText = true;
                // Calculate Exact Offset so text doesn't snap to mouse center
                dragOffsetX = mx - textObjects[clickedIdx].x;
                dragOffsetY = my - textObjects[clickedIdx].y;
                updateTextUI(textObjects[selectedTextIdx]);
            } else {
                selectedTextIdx = -1;
                isDraggingText = false;
            }
            redraw();
        }
    }

    // 2. Brush Tool
    if (activeTool === 'brush' && img) {
        if (mouseX > 280 && mouseX < width - 70) {
            if (undoStack.length > 10) undoStack.shift();
            undoStack.push(maskBuffer.get());
            loop();
        }
    }
}

function mouseReleased() {
    isDraggingText = false;
    if (activeTool === 'brush') {
        if (!animateCheck.elt.checked) noLoop();
        maskBuffer.loadPixels();
        let foundPixel = false;
        for (let i = 3; i < maskBuffer.pixels.length; i += 16) {
            if (maskBuffer.pixels[i] > 0) {
                foundPixel = true;
                break;
            }
        }
        maskHasPixels = foundPixel;
        redraw();
    }
}

function mouseDragged() {
    // FIX: Only move if we are explicitly in "Dragging Mode" established in mousePressed
    if (activeTool === 'text' && isDraggingText && selectedTextIdx > -1) {
        let scaleFactor = Math.min(width / img.width, height / img.height) * 0.9 * zoomLevel;
        let startX = (width - img.width * scaleFactor) / 2;
        let startY = (height - img.height * scaleFactor) / 2;

        let mx = (mouseX - startX) / scaleFactor - img.width / 2;
        let my = (mouseY - startY) / scaleFactor - img.height / 2;

        // Apply position minus the initial offset -> 1:1 dragging
        textObjects[selectedTextIdx].x = mx - dragOffsetX;
        textObjects[selectedTextIdx].y = my - dragOffsetY;

        // Update sliders visually if panels are open
        textXSlider.value(textObjects[selectedTextIdx].x);
        textYSlider.value(textObjects[selectedTextIdx].y);

        redraw();
        return false;
    }
}

function toggleBrushMenu(show, keepTool = false) {
    if (show) {
        brushMenu.style('display', 'flex');
        activeTool = 'brush';
        document.getElementById('btn-brush').classList.add('active');
    } else {
        brushMenu.style('display', 'none');
        if (!keepTool) {
            activeTool = 'none';
            document.getElementById('btn-brush').classList.remove('active');
        }
    }
    redraw();
}

function draw() {
    if (isExportingTransparent) clear();
    else background(bgColorPicker.value());

    // Cursor Logic
    let isHovering = false;
    if (activeTool === 'text') {
        let scaleFactor = Math.min(width / img.width, height / img.height) * 0.9 * zoomLevel;
        let startX = (width - img.width * scaleFactor) / 2;
        let startY = (height - img.height * scaleFactor) / 2;
        let mx = (mouseX - startX) / scaleFactor - img.width / 2;
        let my = (mouseY - startY) / scaleFactor - img.height / 2;

        for (let o of textObjects) {
            if (isMouseOverText(mx, my, o)) { isHovering = true; break; }
        }
        cursor(isDraggingText ? 'grabbing' : (isHovering ? 'grab' : ARROW));
    } else {
        cursor(ARROW);
    }

    if (!img) return;

    if (maskBuffer.width !== img.width || maskBuffer.height !== img.height) {
        maskBuffer = createGraphics(img.width, img.height);
        maskBuffer.pixelDensity(1);
        maskBuffer.background(0);
        maskHasPixels = false;
        undoStack = [];
        composit = createGraphics(img.width, img.height);
        composit.pixelDensity(1);

        // Optimization: Create/Resize shared text buffer
        textBuffer = createGraphics(img.width, img.height, { willReadFrequently: true });
        textBuffer.pixelDensity(1);
    }

    // FIX: Force init if missing (e.g. initial load or hot reload)
    if (!textBuffer && img) {
        textBuffer = createGraphics(img.width, img.height, { willReadFrequently: true });
        textBuffer.pixelDensity(1);
    }

    let tileSize = parseInt(resSlider.value());
    let scaleFactor = Math.min(width / img.width, height / img.height) * 0.9 * zoomLevel;
    let startX = (width - img.width * scaleFactor) / 2;
    let startY = (height - img.height * scaleFactor) / 2;

    // --- 1. COMPOSITION (MERGED MODE) ---
    // Draw the clean image
    composit.image(img, 0, 0, img.width, img.height);

    // Draw any "Merged" text onto the image so it gets processed by the main loop
    textObjects.forEach(obj => {
        if (obj.renderMode === 'merged') {
            // Draw SOLID text for the rasterizer to pick up
            drawTextObject(composit, obj, false);
        }
    });
    composit.loadPixels();

    // --- 2. BRUSH ---
    if (activeTool === 'brush' && mouseIsPressed && !isExportingTransparent) {
        let mx = (mouseX - startX) / scaleFactor;
        let my = (mouseY - startY) / scaleFactor;
        if (mx >= -50 && mx <= img.width + 50 && my >= -50 && my <= img.height + 50) {
            maskBuffer.push();
            maskBuffer.noStroke();
            maskBuffer.fill(isEraser ? 0 : 255);
            maskBuffer.ellipse(mx, my, brushSizeSlider.value() / scaleFactor);
            maskBuffer.pop();
            maskBuffer.loadPixels();
            if (!isEraser) maskHasPixels = true;
        }
    }
    if (maskBuffer.pixels.length === 0) maskBuffer.loadPixels();

    if (animateCheck.elt.checked && !isExportingTransparent) noiseTime += noiseSpeedSlider.value() * 0.005;

    // Settings
    let mode = modeSelect.value();
    let threshAmt = parseInt(threshSlider.value());
    let noiseAmt = parseInt(noiseSlider.value());
    let useOrigColor = originalColorCheck.elt.checked;
    let contrast = contrastSlider.value();
    let saturation = saturationSlider.value();

    let cBg = color(bgColorPicker.value());
    let cFill = color(fillColorPicker.value());
    let r1 = red(cBg), g1 = green(cBg), b1 = blue(cBg);
    let r2 = red(cFill), g2 = green(cFill), b2 = blue(cFill);

    push();
    translate(startX, startY);
    if (isMirrored) { translate(img.width * scaleFactor, 0); scale(-scaleFactor, scaleFactor); }
    else { scale(scaleFactor); }

    let isLineMode = (mode === 'compass' || mode === 'scanline');
    if (isLineMode) { noFill(); strokeCap(ROUND); } else { noStroke(); }

    let showGhost = (activeTool === 'brush');
    let applyMask = (activeTool === 'brush');
    if (randomSizeCheck.elt.checked) randomSeed(sizeSeed);

    // --- 3. MAIN RASTER LOOP ---
    for (let y = 0; y < img.height; y += tileSize) {
        for (let x = 0; x < img.width; x += tileSize) {

            let currentTileSize = tileSize;
            if (randomSizeCheck.elt.checked) currentTileSize = random(tileSize * 0.1, tileSize * 3.0);

            let alphaVal = 255;
            if (applyMask) {
                let mIdx = (floor(x) + floor(y) * maskBuffer.width) * 4;
                let maskVal = maskBuffer.pixels[mIdx];
                if (showGhost && !isExportingTransparent) alphaVal = map(maskVal, 0, 255, 50, 255);
                else { if (maskVal < 128) continue; }
            }

            let index = (floor(x) + floor(y) * img.width) * 4;
            if (index < 0 || index >= composit.pixels.length) continue;

            let r_in = composit.pixels[index];
            let g_in = composit.pixels[index + 1];
            let b_in = composit.pixels[index + 2];

            let gray = 0.299 * r_in + 0.587 * g_in + 0.114 * b_in;
            let r_s = gray + (r_in - gray) * saturation;
            let g_s = gray + (g_in - gray) * saturation;
            let b_s = gray + (b_in - gray) * saturation;

            let r_c = (r_s - 128) * contrast + 128;
            let g_c = (g_s - 128) * contrast + 128;
            let b_c = (b_s - 128) * contrast + 128;

            let r_final = constrain(r_c, 0, 255);
            let g_final = constrain(g_c, 0, 255);
            let b_final = constrain(b_c, 0, 255);

            let bright = (r_final + g_final + b_final) / 3;
            let brightNorm = map(bright, 0, 255, 0, 100);

            if (brightNorm > (100 - threshAmt)) continue;

            let offX = 0, offY = 0;
            if (noiseAmt > 0) {
                offX = map(noise(x * 0.005, y * 0.005, noiseTime), 0, 1, -noiseAmt, noiseAmt);
                offY = map(noise(y * 0.005, x * 0.005, noiseTime), 0, 1, -noiseAmt, noiseAmt);
            }

            let drawR, drawG, drawB;
            if (useOrigColor) {
                drawR = isInverted ? 255 - r_final : r_final;
                drawG = isInverted ? 255 - g_final : g_final;
                drawB = isInverted ? 255 - b_final : b_final;
            } else {
                let amt = bright / 255;
                drawR = r1 + (r2 - r1) * amt;
                drawG = g1 + (g2 - g1) * amt;
                drawB = b1 + (b2 - b1) * amt;
                if (isInverted) { drawR = 255 - drawR; drawG = 255 - drawG; drawB = 255 - drawB; }
            }

            drawR = drawR || 0; drawG = drawG || 0; drawB = drawB || 0;
            let c = color(drawR, drawG, drawB);
            c.setAlpha(alphaVal);

            if (isLineMode) stroke(c); else fill(c);

            let drawX = x + offX;
            let drawY = y + offY;

            let currentMode = mode;
            if (mode === 'random') {
                let n = noise(x * 99, y * 99);
                if (n < 0.2) currentMode = 'square';
                else if (n < 0.4) currentMode = 'circle';
                else if (n < 0.6) currentMode = 'scanline';
                else if (n < 0.8) currentMode = 'compass';
                else currentMode = 'ascii';
                let isLine = (currentMode === 'compass' || currentMode === 'scanline');
                if (isLine) { noFill(); stroke(c); strokeCap(ROUND); } else { noStroke(); fill(c); }
            }

            if (currentMode === 'square') rect(drawX, drawY, currentTileSize, currentTileSize);
            else if (currentMode === 'circle') ellipse(drawX + tileSize / 2, drawY + tileSize / 2, map(bright, 0, 255, 0, currentTileSize * 1.3));
            else if (currentMode === 'ascii') {
                let char = densityString.charAt(floor(map(bright, 0, 255, 0, densityString.length - 1)));
                textSize(currentTileSize); textAlign(CENTER, CENTER); text(char, drawX + tileSize / 2, drawY + tileSize / 2);
            } else if (currentMode === 'compass') {
                push(); translate(drawX + tileSize / 2, drawY + tileSize / 2); rotate(map(bright, 0, 255, 0, PI));
                strokeWeight(2); line(-tileSize / 2, 0, tileSize / 2, 0); pop();
            } else if (currentMode === 'scanline') {
                strokeWeight(map(bright, 0, 255, 1, tileSize));
                line(drawX, drawY + tileSize / 2, drawX + tileSize, drawY + tileSize / 2);
            }
        }
    }
    pop();

    // --- 4. DRAW OVERLAY TEXTS (Vector / Pixelate / Round) ---
    push();
    translate(startX, startY);
    if (isMirrored) { translate(img.width * scaleFactor, 0); scale(-scaleFactor, scaleFactor); }
    else { scale(scaleFactor); }

    textObjects.forEach((obj, idx) => {
        let isSelected = (idx === selectedTextIdx);
        let isMovingThis = (isSelected && isDraggingText);

        // If merged, we handled it above. EXCEPT if dragging, we show a preview outline.
        if (obj.renderMode === 'merged') {
            if (isMovingThis) drawTextObject(this, obj, true);
            return;
        }

        if (isMovingThis) {
            // Fast mode while dragging
            drawTextObject(this, obj, true);
        } else {
            if (obj.renderMode === 'vector' || obj.renderMode === 'outline') {
                drawTextObject(this, obj, obj.renderMode === 'outline');
            } else {
                drawRasterizedTextEffect(this, obj);
            }
        }

        // Selection Box (Accurate to Hitbox)
        // FIX: Multiline Awareness
        if (isSelected && activeTool === 'text' && !isExportingTransparent) {
            push();
            let dims = getTextDimensions(this, obj);
            let tw = dims.w;
            let th = dims.h;

            let alignH = CENTER;
            if (obj.align === 'LEFT') alignH = LEFT; if (obj.align === 'RIGHT') alignH = RIGHT;

            noFill(); stroke('#00aaff'); strokeWeight(2);
            let bx = img.width / 2 + obj.x; let by = img.height / 2 + obj.y;

            // Box Calc based on alignment
            let x1, y1;
            // Vertical center correction for multiple lines
            // drawTextObject centers vertically around the middle, so box is simple
            y1 = by - th / 2;

            if (alignH === CENTER) x1 = bx - tw / 2;
            else if (alignH === LEFT) x1 = bx;
            else if (alignH === RIGHT) x1 = bx - tw;

            // Draw Box
            rect(x1 - 10, y1 - 10, tw + 20, th + 20);

            // Draw Handles
            fill('#00aaff'); noStroke();
            rect(x1 - 15, y1 - 15, 10, 10); // TL
            rect(x1 + tw + 5, y1 + th + 5, 10, 10); // BR
            pop();
        }
    });
    pop();

    if (activeTool === 'brush' && !mouseIsPressed && !isExportingTransparent) {
        noFill(); stroke(255); strokeWeight(1);
        ellipse(mouseX, mouseY, brushSizeSlider.value());
    }
}

// --- HELPER TO DRAW TEXT WITH SETTINGS ---
function drawTextVector(ctx, isOutline) {
    let tx = img.width / 2 + textSettings.x;
    let ty = img.height / 2 + textSettings.y;

    ctx.textSize(textSettings.size);
    ctx.textLeading(textSettings.size * 1.15); // Standard leading
    ctx.textFont(textSettings.font);

    // ... rest is handled by generic drawTextObject logic usually?
    // Wait, this specific function seems redundant or needs update too?
    // Actually, drawTextVector is for global settings, let's update drawTextObject strictly
}

// Helper for Raster Buffer (Always filled, stroke optional)
function drawTextToBuffer(ctx) {
    ctx.push();
    drawTextVector(ctx, false);
    ctx.pop();
}

// NEW HELPER: Measure Multiline Text
function getTextDimensions(ctx, obj) {
    ctx.push();
    ctx.textSize(obj.size);
    ctx.textFont(obj.font);

    let lines = obj.content.split('\n');
    let maxW = 0;
    lines.forEach(line => {
        let w = ctx.textWidth(line);
        if (w > maxW) maxW = w;
    });

    let leading = obj.size * 1.15;
    // If lines=1, p5 height is roughly obj.size. multiline adds leading
    let totalH = (lines.length === 1) ? obj.size : (lines.length * leading);

    ctx.pop();
    return { w: maxW, h: totalH, lines: lines.length };
}

function handleFile(event) {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image')) {
        const url = URL.createObjectURL(file);
        loadImage(url, (loadedImg) => {
            img = loadedImg;

            // --- PERFORMANCE FIX: Limit max resolution ---
            // Raster calculations are heavy. 1500px is plenty for screen.
            if (img.width > 1500 || img.height > 1500) {
                img.resize(1500, 0);
            }

            maskBuffer = createGraphics(img.width, img.height);
            maskBuffer.pixelDensity(1);
            maskBuffer.background(0);

            composit = createGraphics(img.width, img.height);
            composit.pixelDensity(1);

            // Optimization: Create/Resize shared text buffer
            textBuffer = createGraphics(img.width, img.height, { willReadFrequently: true });
            textBuffer.pixelDensity(1);

            dropOverlay.style('display', 'none');

            windowResized();
            redraw();
        });
    }
}

function handleExport(type) {
    if (type === 'png' || type === 'webp') {
        isExportingTransparent = true;
        redraw(); saveCanvas('raster-export', type);
        isExportingTransparent = false; redraw();
    } else if (type === 'jpg') {
        saveCanvas('raster-export', 'jpg');
    } else if (type === 'json') {
        // Save Settings
        let settings = {
            mode: modeSelect.value(),
            grid: resSlider.value(),
            thresh: threshSlider.value(),
            noise: noiseSlider.value(),
            text: textSettings
        };
        saveJSON(settings, 'raster-settings.json');
    }
}

function windowResized() {
    resizeCanvas(dropZone.elt.offsetWidth, dropZone.elt.offsetHeight);
    redraw();
}

function mouseReleased() {
    isDraggingText = false; // Stop dragging text

    if (activeTool === 'brush') {
        if (!animateCheck.elt.checked) noLoop();
        maskBuffer.loadPixels();
        let foundPixel = false;
        for (let i = 3; i < maskBuffer.pixels.length; i += 16) {
            if (maskBuffer.pixels[i] > 0) {
                foundPixel = true;
                break;
            }
        }
        maskHasPixels = foundPixel;
        redraw();
    }
}

function createNewText() {
    let newObj = {
        content: "NEW TEXT",
        size: 100,
        font: 'Anton',
        x: 0, y: 0,
        align: 'CENTER',
        renderMode: 'vector',
        fill: '#ffffff',
        stroke: '#000000',
        strokeWeight: 0
    };
    textObjects.push(newObj);
    selectedTextIdx = textObjects.length - 1; // Immediately select the new text

    // Force UI update so sliders control THIS text
    updateTextUI(newObj);
    redraw();
}

function deleteSelectedText() {
    if (selectedTextIdx > -1 && selectedTextIdx < textObjects.length) {
        textObjects.splice(selectedTextIdx, 1);
        selectedTextIdx = -1; // Reset selection
        // Clear UI values to show it's empty
        textInput.value('');
        redraw();
    }
}

function updateTextUI(obj) {
    if (!obj) return;

    // Update inputs without triggering their events
    // We update the DOM elements directly
    textInput.elt.value = obj.content;
    fontSelect.elt.value = obj.font;
    renderModeSelect.elt.value = obj.renderMode;

    textSizeSlider.elt.value = obj.size;
    // Manually update the number display next to slider
    textSizeSlider.elt.previousSibling.innerText = obj.size + 'px';

    textColorPicker.elt.value = obj.fill;
    textStrokePicker.elt.value = obj.stroke;

    textStrokeSlider.elt.value = obj.strokeWeight;
    textStrokeSlider.elt.previousSibling.innerText = obj.strokeWeight + 'px';

    // Update alignment buttons visually
    document.querySelectorAll('.align-btn').forEach(b => b.classList.remove('active'));
    // Find the right button to highlight
    if (obj.align === 'LEFT') document.querySelectorAll('.align-btn')[0].classList.add('active');
    if (obj.align === 'CENTER') document.querySelectorAll('.align-btn')[1].classList.add('active');
    if (obj.align === 'RIGHT') document.querySelectorAll('.align-btn')[2].classList.add('active');
}

function setAlign(a, btn) {
    if (selectedTextIdx > -1) {
        let obj = textObjects[selectedTextIdx];

        // 1. Calculate visual offset to keep text in place
        textSize(obj.size);
        textFont(obj.font);
        let w = textWidth(obj.content); // Note: Simple width for offset logic helps keeps it centered-ish?
        // Actually, just resetting align is fine usually

        obj.align = a;

        // 2. Update UI
        document.querySelectorAll('.align-btn').forEach(b => b.classList.remove('active'));
        btn.addClass('active');
        redraw();
    }
}

function drawTextObject(ctx, obj, isOutline) {
    let tx = img.width / 2 + obj.x;
    let ty = img.height / 2 + obj.y;

    ctx.push();
    ctx.textSize(obj.size);
    ctx.textLeading(obj.size * 1.15); // Fix Multiline Leading
    ctx.textFont(obj.font);
    ctx.strokeJoin(ROUND);

    let alignH = CENTER;
    if (obj.align === 'LEFT') alignH = LEFT;
    if (obj.align === 'RIGHT') alignH = RIGHT;
    ctx.textAlign(alignH, CENTER);

    if (isOutline) {
        ctx.noFill();
        ctx.stroke(obj.stroke);
        // FIX: Force minimum visible thickness (2px) if mode is Outline
        ctx.strokeWeight(max(2, obj.strokeWeight));
    } else {
        ctx.fill(obj.fill);

        if (obj.strokeWeight > 0) {
            ctx.stroke(obj.stroke);
            ctx.strokeWeight(obj.strokeWeight);
        } else {
            ctx.noStroke();
        }
    }

    ctx.text(obj.content, tx, ty);
    ctx.pop();
}

function drawRasterizedTextEffect(ctx, obj) {
    if (!textBuffer) return;

    // 1. Setup Temp Buffer (Reused)
    textBuffer.clear();

    // 2. Draw text into buffer (Solid fill for detection)
    // We manually push/pop to ensure clean state
    textBuffer.push();
    // Move 0,0 to top-left of image context (same as draw loop)
    drawTextObject(textBuffer, obj, false);
    textBuffer.pop();

    textBuffer.loadPixels();

    // 3. Grid Settings
    let step = max(6, floor(obj.size / 15)); // Auto-scale grid size based on font size

    // FIX: Set font properties on ctx before measuring to fix "disappearing text"
    ctx.push();
    ctx.textSize(obj.size);
    ctx.textFont(obj.font);
    ctx.noStroke();
    ctx.fill(obj.fill); // Use text color

    // 4. Scan the buffer
    // Optimization: Calculate bounding box to avoid scanning empty space

    // NOW this calculates correctly because we set the font above
    let dims = getTextDimensions(ctx, obj);
    let tw = dims.w;
    let th = dims.h;

    // Coordinates relative to image
    let cx = img.width / 2 + obj.x;
    let cy = img.height / 2 + obj.y;

    let x1, x2, y1, y2;
    // Vertical Align starts at centered Y, but for multiline it grows
    y1 = cy - th / 2;
    y2 = cy + th / 2;

    if (obj.align === 'CENTER') {
        x1 = cx - tw / 2;
        x2 = cx + tw / 2;
    } else if (obj.align === 'LEFT') {
        x1 = cx;
        x2 = cx + tw;
    } else if (obj.align === 'RIGHT') {
        x1 = cx - tw;
        x2 = cx;
    }

    // Add padding to ensure we catch edges
    x1 -= step; x2 += step;
    y1 -= step; y2 += step;

    let startX = max(0, floor(x1 / step) * step);
    let startY = max(0, floor(y1 / step) * step);
    let endX = min(img.width, x2);
    let endY = min(img.height, y2);

    for (let y = startY; y < endY; y += step) {
        for (let x = startX; x < endX; x += step) {

            // Check pixel in the center of the grid cell
            let px = floor(x + step / 2);
            let py = floor(y + step / 2);
            let idx = (px + py * textBuffer.width) * 4;

            // Check Alpha (Is there text here?)
            if (textBuffer.pixels[idx + 3] > 64) { // Lower threshold for stroke
                let r = textBuffer.pixels[idx];
                let g = textBuffer.pixels[idx + 1];
                let b = textBuffer.pixels[idx + 2];
                ctx.fill(r, g, b); // Sample exact color from buffer

                if (obj.renderMode === 'pixel_round') {
                    ctx.ellipse(x + step / 2, y + step / 2, step * 0.9);
                } else {
                    // Square (Pixelate)
                    ctx.rect(x, y, step * 0.9, step * 0.9);
                }
            }
        }
    }
    ctx.pop();
}

// --- NEW HELPER: RECTANGULAR HIT DETECTION ---
function isMouseOverText(mx, my, obj) {
    let dims = getTextDimensions(this, obj);
    let w = dims.w;
    let h = dims.h;

    let x1, x2, y1, y2;
    // Y is centered around obj.y
    y1 = obj.y - h / 2 - 10;
    y2 = obj.y + h / 2 + 10;

    if (obj.align === 'CENTER') {
        x1 = obj.x - w / 2 - 10;
        x2 = obj.x + w / 2 + 10;
    } else if (obj.align === 'LEFT') {
        x1 = obj.x - 10;
        x2 = obj.x + w + 10;
    } else if (obj.align === 'RIGHT') {
        x1 = obj.x - w - 10;
        x2 = obj.x + 10;
    }

    return (mx >= x1 && mx <= x2 && my >= y1 && my <= y2);
}
