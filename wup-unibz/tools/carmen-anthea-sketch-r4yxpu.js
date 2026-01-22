/**
 * PIXELA PRO | Ultimate Studio - STANDALONE JS
 * Maintains 100% of the original HTML/CSS layout and logic.
 */

(function setupPixelaInterface() {
    // 1. INJECT ORIGINAL CSS
    const style = document.createElement('style');
    style.innerHTML = `
        :root { --accent: #ff3232; --border: #eee; --bg-sidebar: #fff; }
        body { background: #fff; color: #333; font-family: -apple-system, sans-serif; margin: 0; display: flex; height: 100vh; overflow: hidden; }
        
        #entry-page {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: #fff; display: flex; flex-direction: column;
            align-items: center; justify-content: center; z-index: 2000;
        }

        #sidebar { width: 280px; background: var(--bg-sidebar); border-right: 1px solid #ddd; display: flex; flex-direction: column; padding: 25px; z-index: 100; box-shadow: 5px 0 15px rgba(0,0,0,0.05); overflow-y: auto; }
        .logo { font-size: 22px; font-weight: 900; letter-spacing: -1px; margin-bottom: 5px; color: #000; }
        .sub-logo { font-size: 10px; font-weight: 800; color: var(--accent); letter-spacing: 2px; margin-bottom: 30px; }
        
        .section-label { font-size: 10px; font-weight: 800; color: #999; text-transform: uppercase; margin: 20px 0 10px 0; }
        
        .studio-btn, select, .file-input-label { background: #f5f5f5; color: #333; border: 1px solid #eee; padding: 12px; border-radius: 6px; cursor: pointer; font-size: 11px; font-weight: 700; transition: all 0.1s; width: 100%; text-align: center; display: block; box-sizing: border-box; }
        .studio-btn:hover, .file-input-label:hover { background: #eee; }
        .studio-btn.active { background: #000 !important; color: #fff !important; }
        .accent-btn { background: var(--accent); color: #fff; border: none; margin-top: 10px; }
        
        input[type="range"] { width: 100%; margin: 10px 0; accent-color: var(--accent); cursor: pointer; }
        .color-row { display: flex; gap: 10px; margin-bottom: 10px; }
        input[type="color"] { border: none; width: 40px; height: 40px; cursor: pointer; background: none; }

        #viewport { flex-grow: 1; background: #111; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; }
        #canvas-container { box-shadow: 0 0 50px rgba(0,0,0,0.5); line-height: 0; }
        
        .layer-item { padding: 12px; border: 1px solid #eee; margin-bottom: 8px; border-radius: 8px; font-size: 11px; display: flex; justify-content: space-between; align-items: center; background: #fafafa; cursor: pointer; transition: 0.2s; }
        .layer-item.active { border-color: var(--accent); background: #fff0f0; }
        
        .mode-toggle-container { display: flex; gap: 5px; margin-bottom: 20px; }
        .mode-toggle-container .studio-btn { padding: 8px; font-size: 9px; }
    `;
    document.head.appendChild(style);

    // 2. INJECT ORIGINAL HTML
    const ui = document.createElement('div');
    ui.style.display = 'contents';
    ui.innerHTML = `
        <div id="entry-page">
            <div class="logo" style="font-size: 48px;">PIXELA PRO</div>
            <div class="sub-logo" style="font-size: 14px; margin-bottom: 40px;">DUAL ENGINE STUDIO</div>
            <button class="accent-btn studio-btn" style="padding: 20px 60px; font-size: 16px; border-radius: 50px; width:auto;" onclick="startStudio()">ENTER STUDIO</button>
        </div>

        <div id="sidebar">
            <div class="logo">PIXELA</div>
            <div class="sub-logo">PRO EDITION</div>

            <div class="section-label">Studio Mode</div>
            <div class="mode-toggle-container">
                <button id="mode-single-btn" class="studio-btn active" onclick="switchStudioMode('SINGLE')">SINGLE</button>
                <button id="mode-layer-btn" class="studio-btn" onclick="switchStudioMode('LAYER')">LAYER STACK</button>
            </div>
            
            <label class="file-input-label">UPLOAD IMAGE<input type="file" id="file-loader" style="display:none"></label>

            <div class="section-label">Canvas Format</div>
            <select id="format-selector" onchange="updateFormat()">
                <option value="A4">A4 Portrait</option>
                <option value="A3">A3 Portrait</option>
                <option value="Insta SQ">Insta Square</option>
                <option value="Screen">Fit Screen</option>
            </select>

            <div id="single-controls">
                <div class="section-label">Raster Effect</div>
                <select id="single-effect-selector">
                    <option value="Dots">Dots</option>
                    <option value="Squares">Squares</option>
                    <option value="Lines">Lines</option>
                    <option value="Cross-Hatch">Cross-Hatch</option>
                    <option value="Plus">Plus</option>
                </select>
                
                <div class="section-label">Color System</div>
                <select id="col-system-selector" onchange="toggleDuotoneUI()">
                    <option value="Single">Single Color</option>
                    <option value="Duotone">Duotone Gradient</option>
                </select>

                <div id="single-color-ui" style="margin-top:10px">
                    <div id="single-col-row"><input type="color" id="single-color" value="#00ff41" style="width:100%; height:40px;"></div>
                    <div id="duotone-col-row" class="color-row" style="display:none;">
                        <div style="flex:1"><span class="section-label" style="margin:0">SHADOW</span><input type="color" id="shadow-color" value="#ff0055"></div>
                        <div style="flex:1"><span class="section-label" style="margin:0">LIGHT</span><input type="color" id="highlight-color" value="#00ff41"></div>
                    </div>
                </div>
            </div>

            <div id="layer-controls" style="display:none;">
                <div class="section-label">Brush & Layers</div>
                <select id="layer-brush-selector">
                    <option value="Dots">Dots</option>
                    <option value="Squares">Squares</option>
                    <option value="Lines">Lines</option>
                    <option value="Cross-Hatch">Cross-Hatch</option>
                    <option value="Plus">Plus</option>
                </select>
                <input type="range" id="brush-size" min="10" max="400" value="100">
                <button class="accent-btn studio-btn" onclick="addLayer()">+ NEW LAYER</button>
                <div id="layer-list" style="margin-top:15px"></div>
            </div>

            <div class="section-label">Global Geometry</div>
            <span class="section-label" style="font-size:9px">Density</span>
            <input type="range" id="grid-res" min="20" max="250" value="80">
            <span class="section-label" style="font-size:9px">Zoom</span>
            <input type="range" id="img-zoom" min="0.1" max="3.0" step="0.05" value="1.0">
            <span class="section-label" style="font-size:9px">Slices</span>
            <input type="range" id="repeat-count" min="1" max="4" value="1">

            <div class="section-label">Environment</div>
            <div class="color-row">
                <div style="flex:1"><span class="section-label" style="margin:0">BG</span><br><input type="color" id="bg-color" value="#1a1a1a"></div>
                <div style="flex:1"><button class="studio-btn" onclick="randomizePalette()" style="margin-top:20px; font-size:9px;">RANDOMIZE</button></div>
            </div>

            <div style="display:flex; gap:10px; margin-top: 20px;">
                <button class="accent-btn studio-btn" onclick="exportFile('png')">PNG</button>
                <button class="accent-btn studio-btn" style="background:#333" onclick="exportFile('svg')">SVG</button>
            </div>
        </div>

        <div id="viewport">
            <div id="canvas-container"></div>
        </div>
    `;
    document.body.appendChild(ui);
})();

// 3. CORE P5.JS LOGIC
let baseImg;
let layers = [];
let activeLayerIdx = 0;
let studioMode = 'SINGLE'; 
let activeFormat = 'A4';
let canvasW, canvasH;

const formats = {
    'A4': { w: 210, h: 297, pxW: 2480, pxH: 3508 },
    'A3': { w: 297, h: 420, pxW: 3508, pxH: 4961 },
    'Insta SQ': { w: 100, h: 100, pxW: 2000, pxH: 2000 },
    'Screen': { w: 0, h: 0 }
};

// Functions made global so HTML onclick can find them
window.startStudio = function() { document.getElementById('entry-page').style.display = 'none'; };

window.switchStudioMode = function(mode) {
    studioMode = mode;
    document.getElementById('mode-single-btn').classList.toggle('active', mode === 'SINGLE');
    document.getElementById('mode-layer-btn').classList.toggle('active', mode === 'LAYER');
    document.getElementById('single-controls').style.display = mode === 'SINGLE' ? 'block' : 'none';
    document.getElementById('layer-controls').style.display = mode === 'LAYER' ? 'block' : 'none';
};

window.toggleDuotoneUI = function() {
    let isDuo = document.getElementById('col-system-selector').value === 'Duotone';
    document.getElementById('single-col-row').style.display = isDuo ? 'none' : 'block';
    document.getElementById('duotone-col-row').style.display = isDuo ? 'flex' : 'none';
};

window.updateFormat = function() {
    activeFormat = document.getElementById('format-selector').value;
    updateCanvasSize();
    resizeCanvas(canvasW, canvasH);
    layers.forEach(l => {
        let oldMask = l.mask;
        l.mask = createGraphics(canvasW, canvasH);
        l.mask.image(oldMask, 0, 0, canvasW, canvasH);
    });
};

window.addLayer = function(forcedMode) {
    let mode = forcedMode || document.getElementById('layer-brush-selector').value;
    let mask = createGraphics(canvasW || 800, canvasH || 600);
    mask.noStroke();
    if(layers.length === 0) mask.fill(255).rect(0,0,5000,5000);
    layers.push({ mode: mode, mask: mask, color: '#00ff41' });
    activeLayerIdx = layers.length - 1;
    updateLayerUI();
};

function setup() {
    updateCanvasSize();
    let cnv = createCanvas(canvasW, canvasH);
    cnv.parent('canvas-container');
    
    document.getElementById('file-loader').onchange = (e) => {
        let file = e.target.files[0];
        if (file) {
            let reader = new FileReader();
            reader.onload = (ev) => { baseImg = loadImage(ev.target.result); };
            reader.readAsDataURL(file);
        }
    };
    window.addLayer('Dots');
}

function updateCanvasSize() {
    let f = formats[activeFormat];
    if (activeFormat === 'Screen') {
        canvasW = windowWidth - 320;
        canvasH = windowHeight - 100;
    } else {
        let ratio = f.w / f.h;
        canvasH = windowHeight - 120;
        canvasW = canvasH * ratio;
        if (canvasW > windowWidth - 320) {
            canvasW = windowWidth - 320;
            canvasH = canvasW / ratio;
        }
    }
}

function draw() {
    background(document.getElementById('bg-color').value);
    if (!baseImg) return;

    if (studioMode === 'LAYER' && mouseIsPressed && isInside()) {
        let bSize = document.getElementById('brush-size').value;
        layers[activeLayerIdx].mask.fill(255);
        layers[activeLayerIdx].mask.ellipse(mouseX, mouseY, bSize, bSize);
    }

    baseImg.loadPixels();
    let gRes = document.getElementById('grid-res').value;
    let zoom = document.getElementById('img-zoom').value;
    let reps = document.getElementById('repeat-count').value;
    
    let imgAspect = baseImg.width / baseImg.height;
    let paperAspect = width / height;
    let baseW = (imgAspect > paperAspect) ? width : height * imgAspect;
    let baseH = (imgAspect > paperAspect) ? width / imgAspect : height;
    let fitW = baseW * zoom;
    let fitH = baseH * zoom;
    let tileW = fitW / reps;
    let tileH = fitH / reps;
    let rasterSize = tileW / gRes;

    for (let tx = 0; tx < reps; tx++) {
        for (let ty = 0; ty < reps; ty++) {
            let startX = (width - fitW)/2 + (tx * tileW);
            let startY = (height - fitH)/2 + (ty * tileH);

            for (let y = 0; y < tileH; y += rasterSize) {
                for (let x = 0; x < tileW; x += rasterSize) {
                    let drawX = startX + x + rasterSize/2;
                    let drawY = startY + y + rasterSize/2;

                    if (drawX > 0 && drawX < width && drawY > 0 && drawY < height) {
                        let imgX = floor(map(x, 0, tileW, 0, baseImg.width));
                        let imgY = floor(map(y, 0, tileH, 0, baseImg.height));
                        let loc = (imgX + imgY * baseImg.width) * 4;
                        let avg = (baseImg.pixels[loc] + baseImg.pixels[loc+1] + baseImg.pixels[loc+2]) / 3 || 0;
                        let sz = map(avg, 0, 255, 0, rasterSize * 0.8);

                        if (studioMode === 'SINGLE') {
                            let isDuo = document.getElementById('col-system-selector').value === 'Duotone';
                            let finalCol;
                            if (isDuo) {
                                let c1 = color(document.getElementById('shadow-color').value);
                                let c2 = color(document.getElementById('highlight-color').value);
                                finalCol = lerpColor(c1, c2, avg/255);
                            } else {
                                finalCol = document.getElementById('single-color').value;
                            }
                            push(); translate(drawX, drawY);
                            drawRasterShape(document.getElementById('single-effect-selector').value, sz, rasterSize, finalCol);
                            pop();
                        } else {
                            for (let i = layers.length - 1; i >= 0; i--) {
                                if (layers[i].mask.get(drawX, drawY)[0] > 128) {
                                    push(); translate(drawX, drawY);
                                    drawRasterShape(layers[i].mode, sz, rasterSize, layers[i].color);
                                    pop();
                                    break;
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

function drawRasterShape(mode, sz, rs, col) {
    fill(col); stroke(col);
    if (mode === 'Dots') { noStroke(); ellipse(0, 0, sz, sz); }
    else if (mode === 'Squares') { noStroke(); rectMode(CENTER); rect(0, 0, sz, sz); }
    else if (mode === 'Lines') { strokeWeight(sz/2); line(-rs/2, 0, rs/2, 0); }
    else if (mode === 'Cross-Hatch') { strokeWeight(sz/4); line(-rs/2, -rs/2, rs/2, rs/2); line(rs/2, -rs/2, -rs/2, rs/2); }
    else if (mode === 'Plus') { strokeWeight(sz/3); line(-sz/2, 0, sz/2, 0); line(0, -sz/2, 0, sz/2); }
}

function updateLayerUI() {
    let list = document.getElementById('layer-list'); list.innerHTML = '';
    layers.forEach((l, i) => {
        let item = document.createElement('div');
        item.className = `layer-item ${i === activeLayerIdx ? 'active' : ''}`;
        item.innerHTML = `<div><strong>${l.mode}</strong></div><input type="color" value="${l.color}" oninput="layers[${i}].color=this.value" onclick="event.stopPropagation()">`;
        item.onclick = () => { activeLayerIdx = i; updateLayerUI(); };
        list.appendChild(item);
    });
}

window.randomizePalette = function() {
    colorMode(HSB, 360, 100, 100);
    let h = random(360);
    let bg = colorToHex(color(h, random(70, 90), random(10, 20)));
    let c1 = colorToHex(color((h + 180) % 360, 80, 100));
    colorMode(RGB, 255);

    document.getElementById('bg-color').value = bg;
    document.getElementById('single-color').value = c1;
    document.getElementById('shadow-color').value = bg;
    document.getElementById('highlight-color').value = c1;
    
    layers.forEach(l => l.color = colorToHex(color(random(255), random(255), random(255))));
    updateLayerUI();
};

function colorToHex(c) { return "#" + hex(floor(red(c)), 2) + hex(floor(green(c)), 2) + hex(floor(blue(c)), 2); }
function isInside() { return mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height; }
window.exportFile = function(type) { saveCanvas('PIXELA_PRO_STUDIO', 'png'); };
function windowResized() { updateCanvasSize(); resizeCanvas(canvasW, canvasH); }