/**
 * LOOPA PRO | Animation Studio - STANDALONE JS
 * Maintains 100% of the original HTML/CSS layout, timeline logic, and GIF engine.
 * Added: Playback Speed Control
 */

(function setupLoopaInterface() {
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

        #progress-container {
            position: fixed; top: 0; left: 280px; right: 0; height: 5px;
            background: #eee; z-index: 3000; display: none;
        }
        #progress-bar { width: 0%; height: 100%; background: var(--accent); transition: width 0.1s; }

        #sidebar { width: 280px; background: #fff; border-right: 1px solid var(--border); display: flex; flex-direction: column; padding: 25px; z-index: 100; box-shadow: 5px 0 15px rgba(0,0,0,0.2); overflow-y: auto; }
        .logo { font-size: 22px; font-weight: 900; letter-spacing: -1px; margin-bottom: 5px; color: #000; }
        .sub-logo { font-size: 10px; font-weight: 800; color: var(--accent); letter-spacing: 2px; margin-bottom: 30px; }
        
        .section-label { font-size: 10px; font-weight: 800; color: #999; text-transform: uppercase; margin: 20px 0 10px 0; }
        .tool-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        
        .studio-btn, select { background: #f5f5f5; color: #333; border: 1px solid #eee; padding: 12px; border-radius: 6px; cursor: pointer; font-size: 11px; font-weight: 700; transition: all 0.1s; width: 100%; box-sizing: border-box; text-align:center; }
        .studio-btn:hover { background: #eee; border-color: #ccc; }
        .studio-btn.active { background: #000 !important; color: #fff !important; border-color: #000 !important; }
        .accent-btn { background: var(--accent); color: #fff; border: none; }
        
        input[type="range"] { width: 100%; margin: 10px 0; accent-color: var(--accent); cursor: pointer; }
        .color-row { display: flex; gap: 10px; margin-bottom: 10px; }
        input[type="color"] { border: none; width: 40px; height: 40px; cursor: pointer; background: none; }

        #viewport { flex-grow: 1; background: #111; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; padding-bottom: 120px; }
        #canvas-container { box-shadow: 0 0 40px rgba(0,0,0,0.4); border-radius: 4px; overflow: hidden; background: #fff; }
        
        #timeline { position: absolute; bottom: 0; left: 0; right: 0; height: 120px; background: #fff; border-top: 1px solid #ddd; display: flex; align-items: center; padding: 0 20px; gap: 12px; overflow-x: auto; }
        .frame-thumb { min-width: 80px; height: 80px; background: #f9f9f9; border: 2px solid #eee; border-radius: 4px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 800; color: #ccc; }
        .frame-thumb.active { border-color: var(--accent); color: var(--accent); background: #fff; }

        #transform-ui { background: #fdfdfd; padding: 15px; border: 1px solid #eee; border-radius: 8px; margin-top: 15px; display: none; }
    `;
    document.head.appendChild(style);

    // 2. INJECT ORIGINAL HTML
    const ui = document.createElement('div');
    ui.style.display = 'contents';
    ui.innerHTML = `
        <div id="progress-container"><div id="progress-bar"></div></div>
        <div id="entry-page">
            <div class="logo" style="font-size: 48px;">LOOPA PRO</div>
            <div class="sub-logo" style="font-size: 14px; margin-bottom: 40px;">ANIMATION STUDIO</div>
            <button class="accent-btn studio-btn" style="padding: 20px 60px; font-size: 16px; border-radius: 50px; width:auto;" onclick="startStudio()">START STUDIO</button>
        </div>

        <div id="sidebar">
            <div class="logo">LOOPA PRO</div>
            <div class="sub-logo">ANIMATION STUDIO</div>
            
            <div class="section-label">Canvas Resolution</div>
            <select id="res-selector" onchange="changeResolution()">
                <option value="900x600">Standard (3:2) - 900x600</option>
                <option value="600x600">Square (1:1) - 600x600</option>
                <option value="1280x720">HD (16:9) - 1280x720</option>
                <option value="800x600">Classic (4:3) - 800x600</option>
            </select>

            <div class="section-label">Tools</div>
            <div class="tool-grid">
                <button id="btn-BRUSH" class="studio-btn active" onclick="setTool('BRUSH')">BRUSH [B]</button>
                <button id="btn-SELECT" class="studio-btn" onclick="setTool('SELECT')">SELECT [V]</button>
                <button id="btn-ERASER" class="studio-btn" onclick="setTool('ERASER')">ERASER [E]</button>
                <button class="studio-btn" onclick="clearCanvas()" style="color: #ff3232;">CLEAR</button>
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:5px; grid-column: span 2;">
                    <button class="studio-btn" onclick="undo()">UNDO</button>
                    <button class="studio-btn" onclick="redo()">REDO</button>
                </div>
            </div>

            <div id="transform-ui">
                <div class="section-label" style="margin-top:0">Selection Edit</div>
                <div class="tool-grid">
                    <button class="studio-btn" onclick="duplicateSelection()">COPY</button>
                    <button class="studio-btn" onclick="deleteSelection()" style="color:#ff3232">DEL</button>
                    <button class="studio-btn" onclick="transformSelection('flipH')">FLIP H</button>
                    <button class="studio-btn" onclick="transformSelection('flipV')">FLIP V</button>
                    <button class="studio-btn" onclick="arrangeSelection('front')">FRONT</button>
                    <button class="studio-btn" onclick="arrangeSelection('back')">BACK</button>
                </div>
            </div>

            <div class="section-label">Properties</div>
            <div class="color-row">
                <div style="flex:1"><span class="section-label" style="margin:0">INK</span><br><input type="color" id="ink-color" value="#ff3232"></div>
                <div style="flex:1"><span class="section-label" style="margin:0">BG</span><br><input type="color" id="bg-color" value="#ffffff"></div>
            </div>
            <button id="bg-mode-btn" class="studio-btn" onclick="toggleBgMode()" style="font-size: 9px;">SET BG: THIS FRAME</button>

            <span class="section-label">Weight</span>
            <input type="range" id="brush-size" min="1" max="100" value="4">

            <span class="section-label">Smoothing</span>
            <input type="range" id="steady-val" min="1" max="50" value="10">

            <div class="section-label">Animation</div>
            <button class="studio-btn" onclick="addFrame()" style="margin-bottom:8px;">+ NEW FRAME [N]</button>
            <button class="studio-btn" onclick="cloneFrame()" style="margin-bottom:8px;">CLONE FRAME</button>
            <button class="studio-btn" onclick="deleteFrame()" style="color:#ff3232">DELETE FRAME</button>
            
            <span class="section-label">Playback Speed (FPS)</span>
            <input type="range" id="fps-val" min="1" max="60" value="12">

            <button class="accent-btn studio-btn" style="margin-top:20px; padding:15px;" onclick="exportGif()">EXPORT GIF</button>
            <button class="accent-btn studio-btn" style="margin-top:8px; padding:15px; background:#333;" onclick="exportPNGs()">EXPORT ALL PNGs</button>
        </div>

        <div id="viewport">
            <div id="canvas-container"></div>
            <div style="margin-top:20px;">
                <button id="play-btn" class="studio-btn" onclick="togglePlay()" style="padding: 12px 60px; font-size: 14px; background:#000; color:#fff; border-radius: 30px; width:auto;">PLAY ANIMATION</button>
            </div>
            <div id="timeline"></div>
        </div>
    `;
    document.body.appendChild(ui);
})();

// 3. CORE P5.JS & ANIMATION LOGIC
let frames = []; 
let currentFrameIdx = 0;
let toolMode = 'BRUSH';
let isPlaying = false;
let playIdx = 0;
let brushColor = '#ff3232';
let bgAllMode = false;
let currentStroke = [];
let selectedIdx = -1;
let points = []; 

// Global Bridge Functions
window.startStudio = function() { document.getElementById('entry-page').style.display = 'none'; };

window.changeResolution = function() {
    let res = document.getElementById('res-selector').value.split('x');
    resizeCanvas(parseInt(res[0]), parseInt(res[1]));
};

window.addFrame = function() {
    frames.push({ strokes: [], bg: '#ffffff', redoStack: [] });
    currentFrameIdx = frames.length - 1;
    updateUI();
};

window.clearCanvas = function() {
    let f = frames[currentFrameIdx];
    if(f.strokes.length > 0) {
        f.redoStack.push([...f.strokes]); 
        f.strokes = [];
    }
    selectedIdx = -1;
};

window.cloneFrame = function() {
    let current = frames[currentFrameIdx];
    let copy = JSON.parse(JSON.stringify(current.strokes));
    frames.push({ strokes: copy, bg: current.bg, redoStack: [] });
    currentFrameIdx = frames.length - 1;
    updateUI();
};

window.setTool = function(m) {
    toolMode = m;
    document.querySelectorAll('.tool-grid button').forEach(b => b.classList.remove('active'));
    let activeBtn = document.getElementById('btn-' + m);
    if(activeBtn) activeBtn.classList.add('active');
    if (m !== 'SELECT') {
        selectedIdx = -1;
        document.getElementById('transform-ui').style.display = 'none';
    }
};

window.toggleBgMode = function() {
    bgAllMode = !bgAllMode;
    document.getElementById('bg-mode-btn').innerText = bgAllMode ? "SET BG: ALL" : "SET BG: THIS FRAME";
};

window.togglePlay = function() {
    isPlaying = !isPlaying;
    playIdx = 0;
    document.getElementById('play-btn').innerText = isPlaying ? "STOP" : "PLAY ANIMATION";
    document.getElementById('play-btn').style.background = isPlaying ? '#ff3232' : '#000';
};

window.undo = function() {
    let f = frames[currentFrameIdx];
    if (f.redoStack.length > 0) {
        let lastAction = f.redoStack.pop();
        if(Array.isArray(lastAction) && lastAction.length > 0 && Array.isArray(lastAction[0])){
             f.strokes = lastAction;
        } else { f.strokes.push(lastAction); }
    } else if (f.strokes.length > 0) {
        f.redoStack.push(f.strokes.pop());
    }
};

window.redo = function() {
    let f = frames[currentFrameIdx];
    if (f.redoStack && f.redoStack.length > 0) {
        f.strokes.push(f.redoStack.pop());
    }
};

window.deleteFrame = function() {
    if (frames.length > 1) {
        frames.splice(currentFrameIdx, 1);
        currentFrameIdx = Math.max(0, currentFrameIdx - 1);
        updateUI();
    }
};

// Selection Transform Global Functions
window.deleteSelection = function() {
    if (selectedIdx !== -1) {
        let f = frames[currentFrameIdx];
        f.redoStack.push(f.strokes.splice(selectedIdx, 1)[0]);
        selectedIdx = -1;
        document.getElementById('transform-ui').style.display = 'none';
    }
};
window.duplicateSelection = function() {
    if (selectedIdx === -1) return;
    let copy = JSON.parse(JSON.stringify(frames[currentFrameIdx].strokes[selectedIdx]));
    copy.forEach(p => { p.x += 20; p.y += 20; });
    frames[currentFrameIdx].strokes.push(copy);
    selectedIdx = frames[currentFrameIdx].strokes.length - 1;
};
window.transformSelection = function(type) {
    if (selectedIdx === -1) return;
    let s = frames[currentFrameIdx].strokes[selectedIdx];
    let b = getBounds(s);
    let cx = b.x + b.w/2; let cy = b.y + b.h/2;
    s.forEach(p => {
        if (type === 'flipH') p.x = cx - (p.x - cx);
        if (type === 'flipV') p.y = cy - (p.y - cy);
    });
};
window.arrangeSelection = function(dir) {
    if (selectedIdx === -1) return;
    let f = frames[currentFrameIdx];
    let item = f.strokes.splice(selectedIdx, 1)[0];
    if (dir === 'front') f.strokes.push(item);
    else f.strokes.unshift(item);
    selectedIdx = (dir === 'front') ? f.strokes.length - 1 : 0;
};

// p5 Hooks
function setup() {
    let cnv = createCanvas(900, 600);
    cnv.parent('canvas-container');
    window.addFrame();

    document.getElementById('ink-color').oninput = (e) => brushColor = e.target.value;
    document.getElementById('bg-color').oninput = (e) => {
        let c = e.target.value;
        if (bgAllMode) {
            frames.forEach(f => {
                f.bg = c;
                f.strokes.forEach(s => { if(s[0].isEraser) s[0].col = c; });
            });
        } else {
            frames[currentFrameIdx].bg = c;
            frames[currentFrameIdx].strokes.forEach(s => { if(s[0].isEraser) s[0].col = c; });
        }
    };
}

function draw() {
    let f = isPlaying ? frames[playIdx] : frames[currentFrameIdx];
    background(f.bg);

    if (isPlaying) {
        renderStrokes(f.strokes);
        let currentFPS = document.getElementById('fps-val').value;
        if (frameCount % Math.max(1, Math.floor(60 / currentFPS)) === 0) {
            playIdx = (playIdx + 1) % frames.length;
        }
        return;
    }

    // Onion Skin
    if (currentFrameIdx > 0) {
        push();
        drawingContext.globalAlpha = 0.15;
        renderStrokes(frames[currentFrameIdx-1].strokes);
        pop();
    }

    renderStrokes(f.strokes);

    // Drawing Logic
    if ((toolMode === 'BRUSH' || toolMode === 'ERASER') && mouseIsPressed && isInside()) {
        let weight = document.getElementById('brush-size').value;
        let strength = document.getElementById('steady-val').value;
        let col = toolMode === 'BRUSH' ? brushColor : f.bg;

        points.push({x: mouseX, y: mouseY});
        if (points.length > strength) points.shift();
        let sx = 0, sy = 0;
        for (let p of points) { sx += p.x; sy += p.y; }
        sx /= points.length; sy /= points.length;

        if (currentStroke.length === 0) {
            currentStroke.push({ x: sx, y: sy, col: col, weight: weight, isEraser: (toolMode === 'ERASER') });
        } else {
            currentStroke.push({ x: sx, y: sy });
        }
        
        stroke(col); strokeWeight(weight); noFill(); strokeCap(ROUND); strokeJoin(ROUND);
        beginShape();
        currentStroke.forEach(p => vertex(p.x, p.y));
        endShape();
    } 

    if (toolMode === 'SELECT' && selectedIdx !== -1) {
        let b = getBounds(f.strokes[selectedIdx]);
        noFill(); stroke('#ff3232'); strokeWeight(1);
        drawingContext.setLineDash([4, 4]);
        rect(b.x-4, b.y-4, b.w+8, b.h+8);
        drawingContext.setLineDash([]);
    }
}

function renderStrokes(strokeList) {
    if (!strokeList) return;
    strokeList.forEach(s => {
        if (!s || s.length < 1) return;
        noFill(); stroke(s[0].col); strokeWeight(s[0].weight);
        strokeCap(ROUND); strokeJoin(ROUND);
        beginShape();
        s.forEach(p => vertex(p.x, p.y));
        endShape();
    });
}

function mousePressed() {
    if (!isInside()) return;
    if (toolMode === 'SELECT') {
        let f = frames[currentFrameIdx];
        selectedIdx = -1;
        for (let i = f.strokes.length - 1; i >= 0; i--) {
            let b = getBounds(f.strokes[i]);
            if (mouseX > b.x-10 && mouseX < b.x+b.w+10 && mouseY > b.y-10 && mouseY < b.y+b.h+10) {
                if (f.strokes[i][0].isEraser) continue; 
                selectedIdx = i;
                document.getElementById('transform-ui').style.display = 'block';
                return;
            }
        }
        document.getElementById('transform-ui').style.display = 'none';
    }
    points = [];
}

function mouseDragged() {
    if (toolMode === 'SELECT' && selectedIdx !== -1) {
        let dx = mouseX - pmouseX;
        let dy = mouseY - pmouseY;
        frames[currentFrameIdx].strokes[selectedIdx].forEach(p => { p.x += dx; p.y += dy; });
    }
}

function mouseReleased() {
    if (currentStroke.length > 0) {
        frames[currentFrameIdx].strokes.push([...currentStroke]);
        frames[currentFrameIdx].redoStack = []; 
    }
    currentStroke = [];
}

function getBounds(pts) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    pts.forEach(p => {
        minX = Math.min(minX, p.x); minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y);
    });
    return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

function updateUI() {
    let bar = document.getElementById('timeline');
    if(!bar) return;
    bar.innerHTML = '';
    frames.forEach((f, i) => {
        let div = document.createElement('div');
        div.className = `frame-thumb ${i === currentFrameIdx ? 'active' : ''}`;
        div.innerText = i + 1;
        div.onclick = () => { currentFrameIdx = i; updateUI(); };
        bar.appendChild(div);
    });
}

function scaleSelection(amt) {
    if (selectedIdx === -1) return;
    let s = frames[currentFrameIdx].strokes[selectedIdx];
    let b = getBounds(s);
    let cx = b.x + b.w/2; let cy = b.y + b.h/2;
    s.forEach(p => {
        p.x = cx + (p.x - cx) * amt;
        p.y = cy + (p.y - cy) * amt;
    });
}

function keyPressed() {
    if (key === 'b' || key === 'B') window.setTool('BRUSH');
    if (key === 'v' || key === 'V') window.setTool('SELECT');
    if (key === 'e' || key === 'E') window.setTool('ERASER');
    if (key === 'n' || key === 'N') window.addFrame();
    
    if (selectedIdx !== -1 && (keyCode === DELETE || keyCode === BACKSPACE)) {
        window.deleteSelection();
    }

    if (selectedIdx !== -1) {
        if (keyIsDown(SHIFT)) {
            if (keyCode === UP_ARROW || keyCode === RIGHT_ARROW) scaleSelection(1.05);
            if (keyCode === DOWN_ARROW || keyCode === LEFT_ARROW) scaleSelection(0.95);
        } else {
            if (keyCode === LEFT_ARROW) { frames[currentFrameIdx].strokes[selectedIdx].forEach(p => p.x-=5); }
            if (keyCode === RIGHT_ARROW) { frames[currentFrameIdx].strokes[selectedIdx].forEach(p => p.x+=5); }
            if (keyCode === UP_ARROW) { frames[currentFrameIdx].strokes[selectedIdx].forEach(p => p.y-=5); }
            if (keyCode === DOWN_ARROW) { frames[currentFrameIdx].strokes[selectedIdx].forEach(p => p.y+=5); }
        }
    }
    
    if (keyIsDown(CONTROL) || keyIsDown(91)) {
        if (key === 'z' || key === 'Z') window.undo();
        if (key === 'y' || key === 'Y') window.redo();
    }
}

function isInside() { return mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height; }

// EXPORT ENGINE
window.exportGif = async function() {
    const progCont = document.getElementById('progress-container');
    const progBar = document.getElementById('progress-bar');
    progCont.style.display = 'block';
    progBar.style.width = '0%';

    const workerScriptText = await fetch('https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.worker.js').then(r => r.text());
    const workerBlob = new Blob([workerScriptText], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(workerBlob);

    const currentFPS = document.getElementById('fps-val').value;

    const gif = new GIF({
        workers: 4, quality: 10, width: width, height: height, workerScript: workerUrl
    });

    for (let f of frames) {
        let tc = document.createElement('canvas'); 
        tc.width = width; tc.height = height;
        let ctx = tc.getContext('2d');
        ctx.fillStyle = f.bg; ctx.fillRect(0, 0, width, height);
        f.strokes.forEach(s => {
            if (!s || s.length < 1) return;
            ctx.beginPath(); ctx.strokeStyle = s[0].col; ctx.lineWidth = s[0].weight;
            ctx.lineCap = 'round'; ctx.lineJoin = 'round';
            ctx.moveTo(s[0].x, s[0].y);
            s.forEach(p => ctx.lineTo(p.x, p.y));
            ctx.stroke();
        });
        gif.addFrame(tc, {delay: 1000 / currentFPS});
    }

    gif.on('progress', (p) => { progBar.style.width = (p * 100) + '%'; });
    gif.on('finished', (blob) => {
        let a = document.createElement('a'); 
        a.href = URL.createObjectURL(blob); a.download = 'loopa_pro.gif'; a.click();
        progCont.style.display = 'none'; URL.revokeObjectURL(workerUrl);
    });
    gif.render();
};

window.exportPNGs = async function() {
    for (let i = 0; i < frames.length; i++) {
        let f = frames[i];
        let tc = document.createElement('canvas'); tc.width = width; tc.height = height;
        let ctx = tc.getContext('2d');
        ctx.fillStyle = f.bg; ctx.fillRect(0, 0, width, height);
        f.strokes.forEach(s => {
            if (!s || s.length < 1) return;
            ctx.beginPath(); ctx.strokeStyle = s[0].col; ctx.lineWidth = s[0].weight;
            ctx.lineCap = 'round'; ctx.lineJoin = 'round';
            ctx.moveTo(s[0].x, s[0].y);
            s.forEach(p => ctx.lineTo(p.x, p.y));
            ctx.stroke();
        });
        let link = document.createElement('a');
        link.download = `frame_${(i + 1).toString().padStart(3, '0')}.png`;
        link.href = tc.toDataURL("image/png");
        link.click();
        await new Promise(r => setTimeout(r, 200)); 
    }
    alert("Frames Exported!");
};

updateUI();