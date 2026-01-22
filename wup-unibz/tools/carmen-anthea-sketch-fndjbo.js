/**
 * FOVEA PRO V3.0 ULTIMATE - STANDALONE JS
 * Maintains 100% of the original HTML/CSS layout and logic.
 */

(function setupInterface() {
    // 1. INJECT ORIGINAL CSS
    const style = document.createElement('style');
    style.innerHTML = `
        :root { --bg-ui: #ffffff; --text-ui: #000; --accent: #ff3232; --border: #eee; --hover: #f9f9f9; }
        body.dark-mode { --bg-ui: #111; --text-ui: #fff; --border: #222; --hover: #1a1a1a; }
        body { background: #0a0a0a; color: var(--text-ui); font-family: -apple-system, sans-serif; margin: 0; display: flex; height: 100vh; overflow: hidden; }
        #sidebar { width: 300px; background: var(--bg-ui); border-right: 1px solid var(--border); display: flex; flex-direction: column; padding: 25px; z-index: 100; box-shadow: 5px 0 15px rgba(0,0,0,0.2); overflow-y: auto; }
        .logo { font-size: 24px; font-weight: 900; letter-spacing: -1.5px; color: var(--text-ui); margin-bottom: 2px; }
        .sub-logo { font-size: 10px; font-weight: 800; color: var(--accent); letter-spacing: 2px; margin-bottom: 30px; }
        .section-label { font-size: 10px; font-weight: 800; color: #888; text-transform: uppercase; margin: 20px 0 8px 0; }
        .studio-btn { background: var(--hover); color: var(--text-ui); border: 1px solid var(--border); padding: 12px; border-radius: 6px; cursor: pointer; font-size: 11px; font-weight: 700; width: 100%; margin-bottom: 8px; transition: all 0.1s; text-align:center; display:block; }
        .studio-btn:hover { background: var(--accent); color: white; border-color: var(--accent); }
        .studio-btn.active { background: var(--accent); color: white; }
        input[type="text"], select { width: 100%; padding: 12px; border: 1px solid var(--border); border-radius: 6px; margin-bottom: 10px; background: var(--bg-ui); color: var(--text-ui); font-size: 13px; box-sizing: border-box; }
        input[type="range"] { width: 100%; margin: 10px 0; accent-color: var(--accent); cursor: pointer; }
        #viewport { flex-grow: 1; display: flex; align-items: center; justify-content: center; background: #0f0f0f; }
        #canvas-container { box-shadow: 0 0 50px rgba(0,0,0,0.8); border-radius: 4px; overflow: hidden; }
        #landing { position: fixed; inset: 0; background: #fff; z-index: 9999; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
        #landing h1 { font-size: 100px; font-weight: 900; letter-spacing: -6px; margin: 0; line-height: 0.8; color: #000; }
        .pro-tag { font-size: 14px; font-weight: 800; color: #ff3232; letter-spacing: 5px; margin-top: 15px; text-transform: uppercase; }
        .upload-box { display: flex; gap: 8px; margin-bottom: 5px; }
        #font-info { font-size: 9px; color: var(--accent); margin-bottom: 15px; font-weight: bold; height: 12px; }
        .check-row { display: flex; align-items: center; gap: 8px; font-size: 11px; font-weight: 700; margin-bottom: 10px; cursor: pointer;}
        .shortcut-footer { margin-top: auto; font-size: 10px; color: #888; line-height: 1.6; border-top: 1px solid var(--border); padding-top: 15px; }
    `;
    document.head.appendChild(style);

    // 2. INJECT ORIGINAL HTML STRUCTURE
    const ui = document.createElement('div');
    ui.style.display = 'contents';
    ui.innerHTML = `
        <div id="landing">
            <h1>FOVEA PRO</h1>
            <div class="pro-tag">Typography Studio</div>
            <button class="studio-btn" style="width: auto; padding: 18px 60px; border-radius: 50px; background: #000; color: #fff; font-size: 14px; border: none; margin-top: 30px;" onclick="enterStudio()">ENTER STUDIO</button>
        </div>
        <div id="sidebar">
            <div class="logo">FOVEA PRO</div>
            <div class="sub-logo">V3.0 ULTIMATE</div>
            <button class="studio-btn" onclick="document.body.classList.toggle('dark-mode')">LIGHT/DARK MODE</button>
            <div class="section-label">Format</div>
            <select id="sel-format">
                <option value="Screen">Screen (Dynamic)</option>
                <option value="A4">A4 (300 DPI)</option>
                <option value="A3">A3 (300 DPI)</option>
                <option value="InstaSQ">Instagram Square</option>
            </select>
            <div class="section-label">Typography</div>
            <input type="text" id="inp-text" value="FOVEA">
            <div class="upload-box">
                <select id="sel-font" style="flex:1">
                    <option value="sans-serif">Sans-Serif</option>
                    <option value="serif">Serif</option>
                    <option value="monospace">Monospace</option>
                    <option value="Impact">Impact</option>
                </select>
                <button class="studio-btn" onclick="document.getElementById('font-upload').click()" style="width:70px; padding: 11px 0;">UPLOAD</button>
            </div>
            <div id="font-info">System Active</div>
            <input type="file" id="font-upload" style="display:none" accept=".ttf,.otf,.woff">
            <label class="check-row"><input type="checkbox" id="check-rotate"> ROTATE 90°</label>
            <span style="font-size:9px">Text Size</span>
            <input type="range" id="range-size" min="10" max="250" value="64">
            <span style="font-size:9px">Vertical Spread</span>
            <input type="range" id="range-spread" min="1" max="60" value="8">
            <span style="font-size:9px">Zoom</span>
            <input type="range" id="range-zoom" min="0.1" max="3" step="0.1" value="1">
            <div class="section-label">Distortion Engine</div>
            <button id="btn-animate" class="studio-btn" onclick="toggleAutoAnimate()">AUTO-ANIMATE: OFF</button>
            <span style="font-size:9px">Animation Speed</span>
            <input type="range" id="range-anim-speed" min="0.1" max="5" step="0.1" value="1">
            <span style="font-size:9px">Bulge Radius</span>
            <input type="range" id="range-radius" min="50" max="1200" value="250">
            <span style="font-size:9px">Bulge Strength</span>
            <input type="range" id="range-strength" min="0.1" max="5" step="0.1" value="1.2">
            <div class="section-label">Colors</div>
            <div style="display:flex; gap:10px;">
                <input type="color" id="color-text" value="#000000" style="width:100%; height:40px; cursor:pointer;">
                <input type="color" id="color-bg" value="#dcdcdc" style="width:100%; height:40px; cursor:pointer;">
            </div>
            <button class="studio-btn" onclick="randomizeColors()" style="margin-top:10px;">RANDOMIZE COLORS</button>
            <div class="section-label">Export</div>
            <button class="studio-btn" onclick="exportFile('png')" style="background:#000; color:#fff;">EXPORT PNG</button>
            <button class="studio-btn" onclick="exportFile('svg')">EXPORT SVG</button>
            <span style="font-size:9px">GIF Duration</span>
            <input type="range" id="range-gif-duration" min="1" max="10" value="5">
            <button id="btn-gif" class="studio-btn" onclick="exportGIF()" style="background:#ff3232; color:#fff; border:none;">RECORD GIF</button>
            <div class="shortcut-footer"><b>CMD+P</b> PNG | <b>CMD+S</b> SVG | <b>CMD+G</b> GIF</div>
        </div>
        <div id="viewport"><div id="canvas-container"></div></div>
    `;
    document.body.appendChild(ui);
})();

// 3. CORE P5.JS LOGIC
let inputText = "FOVEA", text_size = 64, word_repeat_v = 8; 
let font_name = 'sans-serif', customFont = null, zoomLevel = 1.0;
let bgColor = '#dcdcdc', textColor = '#000000', rotateText = false; 
let bulgeRadius = 250, bulgeStrength = 1.2, activeFormat = 'Screen';
let smoothedMouseX = 0, smoothedMouseY = 0, canvasW, canvasH;
let isAutoAnimating = false, animSpeed = 1.0, time = 0;
let isRecording = false, recorder = null;

const formats = {
    'Screen': { w: 0, h: 0 },
    'A4': { w: 210, h: 297, pxW: 3508, pxH: 4961 },
    'A3': { w: 297, h: 420, pxW: 4961, pxH: 7016 },
    'InstaSQ': { w: 100, h: 100, pxW: 3000, pxH: 3000 }
};

function setup() {
    updateSize();
    let cnv = createCanvas(canvasW, canvasH);
    cnv.parent('canvas-container');
    setupUIListeners();
    smoothedMouseX = width/2;
    smoothedMouseY = height/2;
}

function setupUIListeners() {
    select('#inp-text').input(() => inputText = select('#inp-text').value());
    select('#range-size').input(() => text_size = float(select('#range-size').value()));
    select('#range-spread').input(() => word_repeat_v = int(select('#range-spread').value()));
    select('#range-radius').input(() => bulgeRadius = float(select('#range-radius').value()));
    select('#range-strength').input(() => bulgeStrength = float(select('#range-strength').value()));
    select('#range-zoom').input(() => zoomLevel = float(select('#range-zoom').value()));
    select('#range-anim-speed').input(() => animSpeed = float(select('#range-anim-speed').value()));
    select('#color-text').input(() => textColor = select('#color-text').value());
    select('#color-bg').input(() => bgColor = select('#color-bg').value());
    select('#check-rotate').changed(() => rotateText = select('#check-rotate').checked());
    select('#sel-format').changed(() => { activeFormat = select('#sel-format').value(); windowResized(); });
    
    select('#sel-font').changed(() => { 
        font_name = select('#sel-font').value();
        if (font_name !== 'CustomFont') document.getElementById('font-info').innerText = "System Active";
    });

    document.getElementById('font-upload').onchange = (e) => {
        let file = e.target.files[0];
        if (file) {
            let reader = new FileReader();
            reader.onload = (ev) => {
                customFont = loadFont(ev.target.result, () => {
                    font_name = 'CustomFont';
                    let sel = document.getElementById('sel-font');
                    if (!Array.from(sel.options).some(o => o.value === 'CustomFont')) {
                        let opt = document.createElement('option');
                        opt.value = 'CustomFont'; opt.text = 'Uploaded Font';
                        sel.add(opt);
                    }
                    sel.value = 'CustomFont';
                    document.getElementById('font-info').innerText = "Active: " + file.name;
                });
            };
            reader.readAsDataURL(file);
        }
    };
}

function toggleAutoAnimate() {
    isAutoAnimating = !isAutoAnimating;
    let btn = document.getElementById('btn-animate');
    btn.innerText = isAutoAnimating ? "AUTO-ANIMATE: ON" : "AUTO-ANIMATE: OFF";
    btn.classList.toggle('active', isAutoAnimating);
}

function randomizeColors() {
    bgColor = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
    textColor = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
    document.getElementById('color-bg').value = bgColor;
    document.getElementById('color-text').value = textColor;
}

function draw() {
    background(15);
    fill(bgColor); noStroke(); rectMode(CENTER);
    rect(width/2, height/2, width, height);

    let targetX = mouseX, targetY = mouseY;
    if (isAutoAnimating) {
        time += 0.02 * animSpeed;
        let autoX = width/2 + cos(time) * (width * 0.35);
        let autoY = height/2 + sin(time * 0.7) * (height * 0.35);
        if (mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) {
            targetX = lerp(autoX, mouseX, 0.5); targetY = lerp(autoY, mouseY, 0.5);
        } else { targetX = autoX; targetY = autoY; }
    }

    smoothedMouseX += (targetX - smoothedMouseX) * 0.05;
    smoothedMouseY += (targetY - smoothedMouseY) * 0.05;

    push();
    translate(width/2, height/2);
    scale(zoomLevel);
    if (rotateText) rotate(-HALF_PI);
    translate(-width/2, -height/2);
    render2DTypography(window, smoothedMouseX, smoothedMouseY, text_size, bulgeRadius);
    pop();

    if (isRecording && frameCount % 2 === 0) {
        recorder.addFrame(drawingContext.canvas, {delay: 33, copy: true});
    }
}

function render2DTypography(pg, mX, mY, tSize, bRad) {
    if (font_name === 'CustomFont' && customFont) pg.textFont(customFont);
    else pg.textFont(font_name);
    pg.textSize(tSize); pg.fill(textColor); pg.textAlign(CENTER, CENTER); 
    let cx = pg.width / 2, cy = pg.height / 2;
    for (let i = -word_repeat_v; i <= word_repeat_v; i++) {
        let yPos = cy + (i * tSize * 1.5);
        drawDistortedWord(pg, inputText, cx, yPos, mX, mY, tSize, bRad);
    }
}

function drawDistortedWord(pg, word, centerX, y, mX, mY, tSize, bRad) {
    let totalW = 0, charWidths = [];
    pg.textSize(tSize);
    for (let i = 0; i < word.length; i++) {
        let w = pg.textWidth(word[i]);
        charWidths.push(w); totalW += w;
    }
    let currentX = centerX - totalW / 2;
    for (let c = 0; c < word.length; c++) {
        let char = word.charAt(c), charW = charWidths[c];
        let ox = currentX + charW / 2;
        let d = dist(mX, mY, ox, y);
        let dx = ox, dy = y;
        if (d < bRad) {
            let move = pow(sin((d / bRad) * PI / 2), bulgeStrength);
            let angle = atan2(y - mY, ox - mX);
            dx = mX + cos(angle) * bRad * move;
            dy = mY + sin(angle) * bRad * move;
        }
        pg.text(char, dx, dy);
        currentX += charW;
    }
}

function updateSize() {
    if (activeFormat === 'Screen') {
        canvasW = windowWidth - 350; canvasH = windowHeight - 100;
    } else {
        let f = formats[activeFormat];
        let r = f.w / f.h;
        canvasH = windowHeight - 150;
        canvasW = canvasH * r;
        if (canvasW > windowWidth - 380) { canvasW = windowWidth - 380; canvasH = canvasW / r; }
    }
}

function windowResized() { updateSize(); resizeCanvas(canvasW, canvasH); }
function enterStudio() { document.getElementById('landing').style.display = 'none'; }

function exportFile(type) {
    let fmt = formats[activeFormat === 'Screen' ? 'A4' : activeFormat];
    let scaleF = (activeFormat === 'Screen') ? 1 : fmt.pxH / height;
    if (type === 'png') {
        let hiRes = createGraphics(fmt.pxW || width, fmt.pxH || height);
        hiRes.background(bgColor);
        hiRes.push();
        hiRes.translate(hiRes.width/2, hiRes.height/2);
        hiRes.scale(zoomLevel);
        if (rotateText) hiRes.rotate(-HALF_PI);
        hiRes.translate(-hiRes.width/2, -hiRes.height/2);
        render2DTypography(hiRes, smoothedMouseX * scaleF, smoothedMouseY * scaleF, text_size * scaleF, bulgeRadius * scaleF);
        hiRes.pop();
        save(hiRes, `FOVEA_${activeFormat}.png`);
    } else { saveSVG(scaleF); }
}

function saveSVG(scaleF) {
    let fmt = formats[activeFormat === 'Screen' ? 'A4' : activeFormat];
    let w = fmt.pxW || width, h = fmt.pxH || height;
    let tSize = text_size * scaleF * zoomLevel;
    let bRad = bulgeRadius * scaleF;
    let mX = smoothedMouseX * scaleF, mY = smoothedMouseY * scaleF;
    let svg = [`<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">`];
    svg.push(`<rect width="100%" height="100%" fill="${bgColor}"/>`);
    svg.push(`<g fill="${textColor}" font-family="${font_name}" font-size="${tSize}" text-anchor="middle" dominant-baseline="central">`);
    let cx = w/2, cy = h/2;
    for (let i = -word_repeat_v; i <= word_repeat_v; i++) {
        let rowY = cy + (i * tSize * 1.5);
        push(); textSize(tSize); if(font_name === 'CustomFont' && customFont) textFont(customFont); else textFont(font_name);
        let totalW = 0, charWds = [];
        for(let ch of inputText) { let cw = textWidth(ch); charWds.push(cw); totalW += cw; }
        pop();
        let curX = cx - totalW / 2;
        for(let j=0; j < inputText.length; j++) {
            let ch = inputText[j], cw = charWds[j], ox = curX + cw/2;
            let d = dist(mX, mY, ox, rowY);
            let dx = ox, dy = rowY;
            if (d < bRad) {
                let move = pow(sin((d/bRad) * PI/2), bulgeStrength);
                let angle = atan2(rowY - mY, ox - mX);
                dx = mX + cos(angle) * bRad * move; dy = mY + sin(angle) * bRad * move;
            }
            svg.push(`<text x="${dx.toFixed(2)}" y="${dy.toFixed(2)}">${ch}</text>`);
            curX += cw;
        }
    }
    svg.push(`</g></svg>`);
    let blob = new Blob([svg.join('\n')], {type: 'image/svg+xml'});
    let a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = "FOVEA_VECTOR.svg"; a.click();
}

async function exportGIF() {
    let btn = document.getElementById('btn-gif');
    let duration = int(document.getElementById('range-gif-duration').value) * 1000;
    btn.innerText = "CAPTURING..."; btn.style.background = "#000";
    const response = await fetch('https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.worker.js');
    const workerCode = await response.text();
    const workerBlob = new Blob([workerCode], { type: 'application/javascript' });
    const workerURL = URL.createObjectURL(workerBlob);
    recorder = new GIF({ workers: 4, quality: 10, width: width*pixelDensity(), height: height*pixelDensity(), workerScript: workerURL });
    isRecording = true;
    setTimeout(() => {
        isRecording = false; btn.innerText = "COMPILING: 0%";
        recorder.on('progress', (p) => { btn.innerText = "COMPILING: " + Math.round(p * 100) + "%"; });
        recorder.on('finished', (blob) => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a'); link.href = url; link.download = 'FOVEA_ANIMATION.gif';
            document.body.appendChild(link); link.click(); document.body.removeChild(link);
            URL.revokeObjectURL(workerURL); btn.innerText = "RECORD GIF"; btn.style.background = "#ff3232";
        });
        recorder.render();
    }, duration);
}

window.addEventListener('keydown', (e) => {
    let isCmd = e.metaKey || e.ctrlKey;
    if (isCmd && e.key === 's') { e.preventDefault(); exportFile('svg'); }
    if (isCmd && e.key === 'p') { e.preventDefault(); exportFile('png'); }
    if (isCmd && e.key === 'g') { e.preventDefault(); exportGIF(); }
});