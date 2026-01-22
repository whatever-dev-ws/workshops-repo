/**
 * FILAMENTA PRO | Generative Studio - STANDALONE JS
 * Maintains 100% of the original HTML/CSS layout and generative logic.
 */

(function setupFilamentaInterface() {
    // 1. INJECT ORIGINAL CSS
    const style = document.createElement('style');
    style.innerHTML = `
        :root { --accent: #ff3232; --border: #ddd; --bg-ui: #fff; }
        body { background: #fff; color: #333; font-family: -apple-system, sans-serif; margin: 0; display: flex; height: 100vh; overflow: hidden; }
        
        #entry-page {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: #fff; display: flex; flex-direction: column;
            align-items: center; justify-content: center; z-index: 2000;
        }

        #sidebar { width: 280px; background: var(--bg-ui); border-right: 1px solid var(--border); display: flex; flex-direction: column; padding: 25px; z-index: 100; box-shadow: 5px 0 15px rgba(0,0,0,0.05); overflow-y: auto; }
        .logo { font-size: 22px; font-weight: 900; letter-spacing: -1px; margin-bottom: 5px; color: #000; }
        .sub-logo { font-size: 10px; font-weight: 800; color: var(--accent); letter-spacing: 2px; margin-bottom: 30px; }
        
        .section-label { font-size: 10px; font-weight: 800; color: #999; text-transform: uppercase; margin: 20px 0 10px 0; }
        .tool-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        
        .studio-btn, select { background: #f5f5f5; color: #333; border: 1px solid #eee; padding: 12px; border-radius: 6px; cursor: pointer; font-size: 11px; font-weight: 700; transition: all 0.1s; width: 100%; text-align: center; box-sizing: border-box; }
        .studio-btn:hover { background: #eee; border-color: #ccc; }
        .studio-btn.active { background: #000 !important; color: #fff !important; border-color: #000 !important; }
        .accent-btn { background: var(--accent); color: #fff; border: none; }
        
        input[type="range"] { width: 100%; margin: 10px 0; accent-color: var(--accent); cursor: pointer; }
        .color-row { display: flex; gap: 10px; margin-bottom: 10px; }
        input[type="color"] { border: none; width: 40px; height: 40px; cursor: pointer; background: none; }

        #viewport { flex-grow: 1; background: #111; display: flex; align-items: center; justify-content: center; position: relative; }
        #canvas-container { box-shadow: 0 0 50px rgba(0,0,0,0.5); border-radius: 2px; line-height: 0; }
        
        #selection-status { position: absolute; top: 20px; color: #00ffff; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; display: none; z-index: 50; }
    `;
    document.head.appendChild(style);

    // 2. INJECT ORIGINAL HTML
    const ui = document.createElement('div');
    ui.style.display = 'contents';
    ui.innerHTML = `
        <div id="entry-page">
            <div class="logo" style="font-size: 48px;">FILAMENTA PRO</div>
            <div class="sub-logo" style="font-size: 14px; margin-bottom: 40px;">GENERATIVE WEB STUDIO</div>
            <button class="accent-btn studio-btn" style="padding: 20px 60px; font-size: 16px; border-radius: 50px; width:auto;" onclick="startStudio()">ENTER STUDIO</button>
        </div>

        <div id="sidebar">
            <div class="logo">FILAMENTA</div>
            <div class="sub-logo">PRO STUDIO</div>
            
            <div class="section-label">Canvas Format</div>
            <select id="format-selector" onchange="changeFormat()">
                <option value="A4">Standard A4</option>
                <option value="A3">Large A3</option>
                <option value="Insta SQ">Instagram Square</option>
                <option value="Insta Story">Instagram Story</option>
                <option value="Screen">Fit to Screen</option>
            </select>

            <div class="section-label">Tools</div>
            <div class="tool-grid">
                <button id="btn-BRUSH" class="studio-btn active" onclick="setTool('BRUSH')">BRUSH [B]</button>
                <button id="btn-SELECT" class="studio-btn" onclick="setTool('SELECT')">SELECT [V]</button>
                <button id="btn-ERASER" class="studio-btn" onclick="setTool('ERASER')">ERASER [E]</button>
                <button class="studio-btn" onclick="clearAll()" style="color: #ff3232;">CLEAR</button>
                <button class="studio-btn" onclick="undo()">UNDO</button>
                <button class="studio-btn" onclick="redo()">REDO</button>
            </div>

            <div class="section-label">Generative Settings</div>
            <div id="brush-settings">
                <span class="section-label" style="color:#666">Connection Radius</span>
                <input type="range" id="connect-dist" min="5" max="200" value="50">
                
                <span class="section-label" style="color:#666">Web Weight</span>
                <input type="range" id="web-weight" min="0.1" max="5" step="0.1" value="0.5">
                
                <button id="cont-btn" class="studio-btn" onclick="toggleContinuous()" style="margin-top:10px; font-size:9px;">CONTINUOUS WEB: OFF</button>
            </div>

            <div class="section-label">Visuals</div>
            <div class="color-row">
                <div style="flex:1"><span class="section-label" style="margin:0">WEB</span><br><input type="color" id="brush-color" value="#ff3232"></div>
                <div style="flex:1"><span class="section-label" style="margin:0">BG</span><br><input type="color" id="bg-color" value="#f5f5f5"></div>
            </div>
            <button class="studio-btn" onclick="suggestPalette()">SUGGEST PALETTE</button>
            <button class="studio-btn" onclick="applyToAll()" style="margin-top:8px; font-size:9px;">APPLY COLOR TO ALL</button>

            <div class="section-label">Export</div>
            <div class="tool-grid">
                <button class="accent-btn studio-btn" onclick="exportFile('png')">PNG</button>
                <button class="accent-btn studio-btn" style="background:#333" onclick="exportFile('svg')">SVG</button>
            </div>
        </div>

        <div id="viewport">
            <div id="selection-status">Selection Active: Drag to move | Arrow keys to scale</div>
            <div id="canvas-container"></div>
        </div>
    `;
    document.body.appendChild(ui);
})();

// 3. CORE P5.JS & GENERATIVE LOGIC
let strokes = [];
let redoStack = [];
let currentStroke = [];
let activeFormat = 'A4';
let toolMode = 'BRUSH';
let selectedIdx = -1;
let dragOffset = { x: 0, y: 0 };
let canvasW, canvasH;

// Brush Config
let connectionDist = 50;
let webWeight = 0.5;
let brushColor = '#ff3232';
let bgColor = '#f5f5f5';
let continuousMode = false;
let continuousStartIndex = 0;

const formats = {
    'A4': { w: 210, h: 297, pxW: 3508, pxH: 4961 },
    'A3': { w: 297, h: 420, pxW: 4961, pxH: 7016 },
    'Insta SQ': { w: 1080, h: 1080, pxW: 3000, pxH: 3000 },
    'Insta Story': { w: 1080, h: 1920, pxW: 1080, pxH: 1920 },
    'Screen': { w: 0, h: 0 }
};

// Global bridge functions for UI buttons
window.startStudio = function() { document.getElementById('entry-page').style.display = 'none'; };
window.changeFormat = function() {
    activeFormat = document.getElementById('format-selector').value;
    updateSize();
    resizeCanvas(canvasW, canvasH);
};
window.setTool = function(m) {
    toolMode = m;
    document.querySelectorAll('.tool-grid button').forEach(b => b.classList.remove('active'));
    document.getElementById('btn-' + m).classList.add('active');
    if (m !== 'SELECT') {
        selectedIdx = -1;
        document.getElementById('selection-status').style.display = 'none';
    }
};
window.toggleContinuous = function() {
    continuousMode = !continuousMode;
    continuousStartIndex = strokes.length;
    document.getElementById('cont-btn').innerText = `CONTINUOUS WEB: ${continuousMode ? 'ON' : 'OFF'}`;
};
window.clearAll = function() { strokes = []; redoStack = []; selectedIdx = -1; };
window.undo = function() { if (strokes.length > 0) redoStack.push(strokes.pop()); };
window.redo = function() { if (redoStack.length > 0) strokes.push(redoStack.pop()); };
window.suggestPalette = function() {
    colorMode(HSB, 360, 100, 100);
    let h = random(360);
    bgColor = colorToHex(color(h, 10, 95));
    brushColor = colorToHex(color((h + 180) % 360, 80, 70));
    colorMode(RGB, 255);
    document.getElementById('bg-color').value = bgColor;
    document.getElementById('brush-color').value = brushColor;
};
window.applyToAll = function() { strokes.forEach(s => s.forEach(p => p.col = brushColor)); };

function setup() {
    let container = select('#canvas-container');
    updateSize();
    let cnv = createCanvas(canvasW, canvasH);
    cnv.parent(container);
    
    // UI input mappings
    select('#connect-dist').input((e) => connectionDist = e.target.value);
    select('#web-weight').input((e) => webWeight = e.target.value);
    select('#brush-color').input((e) => brushColor = e.target.value);
    select('#bg-color').input((e) => bgColor = e.target.value);
}

function updateSize() {
    let f = formats[activeFormat];
    if (activeFormat === 'Screen') {
        canvasW = windowWidth - 320; 
        canvasH = windowHeight - 60;
    } else {
        let ratio = f.w / f.h;
        canvasH = windowHeight - 100;
        canvasW = canvasH * ratio;
        if (canvasW > windowWidth - 320) {
            canvasW = windowWidth - 320;
            canvasH = canvasW / ratio;
        }
    }
}

function draw() {
    background(bgColor);
    
    // Render
    [...strokes, currentStroke].forEach(s => {
        s.forEach(p => {
            stroke(p.col); strokeWeight(p.weight);
            p.conns.forEach(c => line(p.pos.x, p.pos.y, p.pos.x + c.x, p.pos.y + c.y));
        });
    });

    if (toolMode === 'BRUSH' && mouseIsPressed && isInside()) {
        handleDrawing();
    } else if (toolMode === 'ERASER' && mouseIsPressed && isInside()) {
        handleEraser();
    }

    if (toolMode === 'SELECT' && selectedIdx !== -1) {
        drawSelectionUI();
    }
}

function handleDrawing() {
    let d = dist(mouseX, mouseY, pmouseX, pmouseY);
    let steps = map(d, 0, 100, 1, 8);
    for (let i = 1; i <= steps; i++) {
        let t = i / steps;
        addPoint(lerp(pmouseX, mouseX, t), lerp(pmouseY, mouseY, t));
    }
}

function addPoint(x, y) {
    let current = createVector(x, y);
    let connections = [];
    let lookback = [];
    if (continuousMode) {
        for (let i = continuousStartIndex; i < strokes.length; i++) lookback.push(...strokes[i]);
    }
    lookback.push(...currentStroke);

    for (let p of lookback) {
        if (dist(current.x, current.y, p.pos.x, p.pos.y) < connectionDist) {
            connections.push({x: p.pos.x - x, y: p.pos.y - y});
        }
    }
    currentStroke.push({ pos: current, weight: webWeight, col: brushColor, conns: connections });
}

function handleEraser() {
    let r = 25;
    noFill(); stroke(255, 100); circle(mouseX, mouseY, r*2);
    for (let i = strokes.length - 1; i >= 0; i--) {
        strokes[i] = strokes[i].filter(p => dist(mouseX, mouseY, p.pos.x, p.pos.y) > r);
        if (strokes[i].length === 0) strokes.splice(i, 1);
    }
}

function drawSelectionUI() {
    let b = getBounds(strokes[selectedIdx]);
    noFill(); stroke('#00ffff'); strokeWeight(1);
    drawingContext.setLineDash([5, 5]);
    rect(b.x - 5, b.y - 5, b.w + 10, b.h + 10);
    drawingContext.setLineDash([]);
    document.getElementById('selection-status').style.display = 'block';
}

function mousePressed() {
    if (!isInside()) return;
    if (toolMode === 'SELECT') {
        selectedIdx = -1;
        for (let i = strokes.length - 1; i >= 0; i--) {
            let b = getBounds(strokes[i]);
            if (mouseX > b.x && mouseX < b.x + b.w && mouseY > b.y && mouseY < b.y + b.h) {
                selectedIdx = i;
                dragOffset = { x: mouseX, y: mouseY };
                break;
            }
        }
    }
}

function mouseDragged() {
    if (toolMode === 'SELECT' && selectedIdx !== -1) {
        let dx = mouseX - dragOffset.x;
        let dy = mouseY - dragOffset.y;
        strokes[selectedIdx].forEach(p => { p.pos.x += dx; p.pos.y += dy; });
        dragOffset = { x: mouseX, y: mouseY };
    }
}

function mouseReleased() {
    if (currentStroke.length > 0) {
        strokes.push([...currentStroke]);
        currentStroke = [];
        redoStack = [];
    }
}

function keyPressed() {
    if (key === 'b' || key === 'B') window.setTool('BRUSH');
    if (key === 'v' || key === 'V') window.setTool('SELECT');
    if (key === 'e' || key === 'E') window.setTool('ERASER');
    
    if (selectedIdx !== -1) {
        let b = getBounds(strokes[selectedIdx]);
        let cx = b.x + b.w/2; let cy = b.y + b.h/2;
        if (keyCode === UP_ARROW) scaleStroke(1.05, cx, cy);
        if (keyCode === DOWN_ARROW) scaleStroke(0.95, cx, cy);
    }
}

function scaleStroke(f, cx, cy) {
    strokes[selectedIdx].forEach(p => {
        p.pos.x = cx + (p.pos.x - cx) * f;
        p.pos.y = cy + (p.pos.y - cy) * f;
        p.conns.forEach(c => { c.x *= f; c.y *= f; });
    });
}

function getBounds(s) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    s.forEach(p => {
        minX = min(minX, p.pos.x); minY = min(minY, p.pos.y);
        maxX = max(maxX, p.pos.x); maxY = max(maxY, p.pos.y);
    });
    return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

function isInside() { return mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height; }
function colorToHex(c) { return "#" + hex(floor(red(c)), 2) + hex(floor(green(c)), 2) + hex(floor(blue(c)), 2); }

window.exportFile = function(type) {
    let fmt = formats[activeFormat === 'Screen' ? 'A4' : activeFormat];
    let scaleF = fmt.pxH / height;
    if (type === 'png') {
        let hiRes = createGraphics(fmt.pxW, fmt.pxH);
        hiRes.background(bgColor); hiRes.scale(scaleF);
        strokes.forEach(s => s.forEach(p => {
            hiRes.stroke(p.col); hiRes.strokeWeight(p.weight);
            p.conns.forEach(c => hiRes.line(p.pos.x, p.pos.y, p.pos.x + c.x, p.pos.y + c.y));
        }));
        save(hiRes, `FILAMENTA_PRO.png`);
    } else {
        let content = [`<svg width="${fmt.pxW}" height="${fmt.pxH}" xmlns="http://www.w3.org/2000/svg">`];
        content.push(`<rect width="100%" height="100%" fill="${bgColor}"/>`);
        strokes.forEach(s => s.forEach(p => {
            p.conns.forEach(c => {
                content.push(`<line x1="${p.pos.x*scaleF}" y1="${p.pos.y*scaleF}" x2="${(p.pos.x+c.x)*scaleF}" y2="${(p.pos.y+c.y)*scaleF}" stroke="${p.col}" stroke-width="${p.weight*scaleF}"/>`);
            });
        }));
        content.push(`</svg>`);
        let blob = new Blob([content.join('\n')], {type: 'image/svg+xml'});
        let a = document.createElement('a'); a.href = URL.createObjectURL(blob);
        a.download = `FILAMENTA.svg`; a.click();
    }
};

function windowResized() {
    updateSize();
    resizeCanvas(canvasW, canvasH);
}