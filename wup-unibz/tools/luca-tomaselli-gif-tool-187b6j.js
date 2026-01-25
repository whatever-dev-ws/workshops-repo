// ==========================================
// WUP 25/26 TOMASELLI LUCA
// ==========================================

const cssStyles = `
:root {
    --bg-app: #121212;
    --bg-panel: #1e1e1e;
    --accent: #8e44ad;
    --accent-glow: rgba(142, 68, 173, 0.4);
    --text-main: #ffffff;
    --text-muted: #b0b0b0;
    --border: #333333;
    --success: #2ecc71;
    --trim-color: rgba(220, 38, 38, 0.6);
}

* { margin: 0; padding: 0; box-sizing: border-box; }

body {
    font-family: 'Segoe UI', Inter, sans-serif;
    background-color: var(--bg-app);
    color: var(--text-main);
    display: flex; justify-content: center; align-items: center;
    min-height: 100vh;
}

.container {
    width: 95%; max-width: 850px;
    background-color: var(--bg-panel);
    padding: 35px; border-radius: 16px;
    box-shadow: 0 15px 40px rgba(0,0,0,0.6);
    text-align: center;
}

header h1 { margin-bottom: 8px; font-size: 28px; letter-spacing: -0.5px; display: flex; align-items: center; justify-content: center; gap: 10px; }
header .highlight { color: var(--accent); position: relative; }
header p { color: var(--text-muted); font-size: 14px; margin-bottom: 30px; }
header .p5-logo { width: 32px; height: 32px; opacity: 0.9; }

/* Upload */
.upload-area {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    border: 2px dashed var(--border); border-radius: 12px; padding: 50px 20px;
    cursor: pointer; transition: all 0.3s ease; background: rgba(255,255,255,0.02);
}
.upload-area:hover { 
    border-color: var(--accent); 
    background: rgba(142, 68, 173, 0.08); 
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(142, 68, 173, 0.2);
}
.upload-area .icon { font-size: 48px; color: var(--text-muted); margin-bottom: 15px; transition: transform 0.3s; }
.upload-area:hover .icon { transform: scale(1.1); color: var(--accent); }

/* REUSABLE BUTTONS */
.btn-icon-small {
    background: #2a2a2a; border: 1px solid #3a3a3a; color: #eee;
    padding: 8px 12px; border-radius: 6px; cursor: pointer;
    display: inline-flex; align-items: center; justify-content: center; gap: 6px;
    transition: all 0.2s ease; font-size: 13px;
}
.btn-icon-small:hover { border-color: var(--accent); background: #333; transform: translateY(-1px); }
.btn-icon-small.active { background: var(--accent); border-color: var(--accent); color: white; box-shadow: 0 2px 10px var(--accent-glow); }
.btn-icon-small .icon-fallback { font-size: 14px; }

.btn-primary {
    background: linear-gradient(135deg, #8e44ad, #9b59b6);
    color: white; border: none; padding: 14px 30px;
    border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 16px;
    width: 100%; box-shadow: 0 4px 15px var(--accent-glow);
    transition: all 0.2s ease; margin-top: 15px;
    display: inline-flex; align-items: center; justify-content: center; gap: 8px;
}
.btn-primary:hover { transform: translateY(-2px); box-shadow: 0 6px 20px var(--accent-glow); }
.btn-primary:active { transform: scale(0.98); }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

.btn-download {
    display: inline-flex; align-items: center; gap: 8px;
    background: linear-gradient(135deg, #27ae60, #2ecc71);
    color: white; text-decoration: none; padding: 12px 25px;
    border-radius: 8px; font-weight: 600; margin-top: 20px;
    box-shadow: 0 4px 15px rgba(46, 204, 113, 0.3);
    transition: all 0.2s ease;
}
.btn-download:hover { filter: brightness(1.1); transform: translateY(-2px); }

.btn-ghost {
    background: none; border: 1px solid var(--border); color: var(--text-muted);
    padding: 10px 20px; border-radius: 8px; margin-top: 10px; margin-left: 10px;
    cursor: pointer; font-size: 14px; transition: all 0.2s ease;
}
.btn-ghost:hover { border-color: var(--accent); color: white; background: rgba(142, 68, 173, 0.1); }


/* RESIZABLE WRAPPER */
.editor-section { margin-top: 0; animation: fadeIn 0.4s ease; }
@keyframes fadeIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }

.resizable-zone {
    display: inline-block; position: relative;
    border: 2px solid #333; background: #000; border-radius: 8px;
    margin-bottom: 15px; box-shadow: 0 5px 20px rgba(0,0,0,0.3);
    overflow: hidden;
    max-width: 100%;
}
.resizable-zone video { display: block; width: 100%; height: 100%; object-fit: contain; }
.resizable-zone.unlocked video { object-fit: fill; }

.resize-overlay {
    position: absolute; top: 0; left: 0; right: 0; bottom: 0;
    border: 3px solid var(--accent); pointer-events: none; opacity: 0; 
    transition: opacity 0.2s ease;
    background: linear-gradient(45deg, transparent 48%, var(--accent) 49%, var(--accent) 51%, transparent 52%);
    background-size: 10px 10px;
    background-color: rgba(142, 68, 173, 0.05);
}
.resizable-zone.resizing .resize-overlay { opacity: 1; }

.resize-handle {
    position: absolute; width: 18px; height: 18px;
    background: var(--accent); border: 2px solid white; border-radius: 50%;
    z-index: 50; display: none;
    box-shadow: 0 2px 8px rgba(0,0,0,0.4);
    transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.resize-handle:hover { 
    transform: scale(1.2); 
    box-shadow: 0 3px 12px var(--accent-glow); 
}
.resizable-zone.resizing .resize-handle { display: block; }

/* Handle Positions - Fixed for proper corner alignment */
.h-tl { top: -9px; left: -9px; cursor: nwse-resize; }
.h-tr { top: -9px; right: -9px; cursor: nesw-resize; }
.h-bl { bottom: -9px; left: -9px; cursor: nesw-resize; }
.h-br { bottom: -9px; right: -9px; cursor: nwse-resize; }


/* TOOLBAR */
.toolbar {
    display: flex; justify-content: center; align-items: center; gap: 12px; flex-wrap: wrap;
    background: linear-gradient(180deg, #1a1a1a, #151515); 
    padding: 12px 18px; border-radius: 10px;
    margin-bottom: 20px; border: 1px solid #333;
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.05);
}
.dim-text { 
    font-family: 'Consolas', 'Monaco', monospace; font-size: 13px; color: #888; 
    margin-left: 10px; background: #222; padding: 4px 10px; border-radius: 4px;
}

/* TABS */
.tab-nav { display: flex; gap: 8px; border-bottom: 1px solid #333; margin-bottom: 20px; padding: 0 10px; }
.tab-link {
    background: none; border: none; color: var(--text-muted);
    padding: 12px 16px; cursor: pointer; font-size: 14px; font-weight: 500;
    position: relative; transition: all 0.2s ease; border-radius: 8px 8px 0 0;
}
.tab-link:hover { color: white; background: rgba(255,255,255,0.05); }
.tab-link::after {
    content:''; position: absolute; bottom: -1px; left: 0; width: 0%; height: 2px;
    background: var(--accent); transition: width 0.3s ease;
}
.tab-link.active { color: white; font-weight: 600; background: rgba(142, 68, 173, 0.1); }
.tab-link.active::after { width: 100%; }

.tab-pane { display: none; }
.tab-pane.active { display: block; animation: fadeIn 0.3s; }

/* TIMELINE */
.timeline-wrapper {
    position: relative; width: 100%; height: 70px;
    margin: 20px 0 15px 0;
    user-select: none;
}
/* The background frames */
.timeline-track {
    position: absolute; top: 10px; bottom: 10px; left: 10px; right: 10px;
    background: #1a1a1a; overflow: hidden; border-radius: 6px; border: 1px solid #444;
    display: flex;
}
.frame-strip { height: 100%; flex: 1; opacity: 0.7; border-right: 1px solid rgba(0,0,0,0.3); }

/* Red Trim Zones - Areas that will be REMOVED */
.timeline-trim-left, .timeline-trim-right {
    position: absolute; top: 10px; bottom: 10px;
    background: var(--trim-color);
    pointer-events: none;
    transition: width 0.05s, left 0.05s;
}
.timeline-trim-left { left: 10px; border-radius: 6px 0 0 6px; }
.timeline-trim-right { right: 10px; border-radius: 0 6px 6px 0; }

/* Keep zone highlight (optional subtle green border) */
.timeline-keep {
    position: absolute; top: 10px; bottom: 10px;
    border-top: 2px solid var(--success);
    border-bottom: 2px solid var(--success);
    pointer-events: none;
    background: rgba(46, 204, 113, 0.08);
}

/* The Handles */
.t-handle {
    position: absolute; top: 0; bottom: 0; width: 24px;
    cursor: ew-resize; z-index: 100;
    display: flex; align-items: center; justify-content: center;
    transform: translateX(-50%);
    transition: transform 0.05s;
}
.t-handle::before {
    content:''; width: 6px; height: 100%; 
    background: linear-gradient(180deg, #fff, #ddd); 
    border-radius: 3px;
    box-shadow: 0 0 8px rgba(0,0,0,0.5), 0 0 0 2px rgba(255,255,255,0.1);
    transition: transform 0.15s, box-shadow 0.15s;
}
.t-handle:hover::before { 
    transform: scaleX(1.3); 
    box-shadow: 0 0 12px rgba(0,0,0,0.6), 0 0 0 3px var(--accent-glow); 
}
.t-handle::after {
    content: ''; position: absolute; top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    width: 10px; height: 16px;
    background: repeating-linear-gradient(0deg, #888 0px, #888 2px, transparent 2px, transparent 4px);
    opacity: 0.6; pointer-events: none;
}

.control-input {
    background: #2a2a2a; border: 1px solid #444; color: white;
    padding: 8px 12px; border-radius: 6px; width: 100px; text-align: center;
    transition: border-color 0.2s;
}
.control-input:focus { border-color: var(--accent); outline: none; }
.control-select {
    background: #2a2a2a; border: 1px solid #444; color: white;
    padding: 8px 12px; border-radius: 6px; cursor: pointer;
    transition: border-color 0.2s;
}
.control-select:focus { border-color: var(--accent); outline: none; }

.hidden { display: none !important; }

/* Status animations */
/* Status animations */
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
.spinner {
    display: inline-block; width: 20px; height: 20px;
    border: 3px solid rgba(142,68,173, 0.3);
    border-radius: 50%;
    border-top-color: var(--accent);
    animation: spin 1s ease-in-out infinite;
    vertical-align: middle; margin-right: 8px;
}
.loading-overlay {
    position: absolute; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.8); z-index: 200;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    border-radius: 8px;
    backdrop-filter: blur(2px);
}
.loading-text { margin-top: 15px; color: var(--accent); font-weight: 600; font-size: 15px; }
`;

document.addEventListener('DOMContentLoaded', () => {
    injectStyles();
    injectLibrary();
    createUI();
    initializeLogic();
});

function injectStyles() {
    const s = document.createElement('style');
    s.textContent = cssStyles;
    document.head.appendChild(s);
}
function injectLibrary() {
    if (typeof gifshot === 'undefined') {
        const s = document.createElement('script');
        s.src = 'https://unpkg.com/gifshot@0.3.2/build/gifshot.min.js';
        document.head.appendChild(s);
    }
}

// Global Refs
let dom = {}; // Store UI refs here
let state = {
    file: null,
    dur: 0,
    w: 400, h: 225,
    origW: 400, origH: 225,
    resizing: false,
    locked: true,
    tab: 'trim',
    tL: 0, tR: 100 // timeline percentages
};

function createUI() {
    const root = document.querySelector('.container') || document.createElement('div');
    if (!root.className) { root.className = 'container'; document.body.appendChild(root); }

    root.innerHTML = `
        <header>
            <h1>
                <svg class="p5-logo" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M14 0L28 14L14 28L0 14L14 0Z" fill="#ED225D"/>
                    <path d="M14 4L24 14L14 24L4 14L14 4Z" fill="#1e1e1e"/>
                    <text x="14" y="18" text-anchor="middle" fill="white" font-size="10" font-weight="bold">*</text>
                </svg>
                GIF<span class="highlight">Tool</span>
            </h1>
            <p>Convert video to GIF with professional control.</p>
        </header>

        <input type="file" id="upFile" accept="video/*" style="display:none">
        
        <label id="dropZone" class="upload-area">
            <span class="icon">📤</span>
            <div style="font-size:16px; font-weight:500;">
                Drag & Drop Video or <span style="color:var(--accent); text-decoration:underline;">Browse</span>
            </div>
            <div style="font-size:13px; color:#666; margin-top:5px;">Supports MP4, WebM</div>
        </label>

        <div id="editor" class="editor-section hidden">
            
            <!-- VIDEO AREA -->
            <div class="resizable-zone" id="rZone">
                <video id="vid" controls playsinline></video>
                <div class="resize-overlay"></div>
                <!-- Loading Overlay -->
                <div id="loader" class="loading-overlay hidden">
                    <div class="spinner" style="width:40px; height:40px; border-width:4px;"></div>
                    <div class="loading-text" id="loadText">Processing...</div>
                </div>
                <div class="resize-handle h-tl" id="rh-tl"></div>
                <div class="resize-handle h-tr" id="rh-tr"></div>
                <div class="resize-handle h-bl" id="rh-bl"></div>
                <div class="resize-handle h-br" id="rh-br"></div>
            </div>

            <!-- TOOLBAR -->
            <div class="toolbar">
                <button id="btnResize" class="btn-icon-small" title="Toggle Resize Handles">
                    <span class="icon-fallback">⤢</span> Resize
                </button>
                <button id="btnLock" class="btn-icon-small active" title="Lock Aspect Ratio">
                    <span class="icon-fallback">🔗</span>
                </button>
                <button id="btnResetSize" class="btn-icon-small" title="Reset to Original Size">
                    <span class="icon-fallback">↺</span>
                </button>
                <span id="dimDisp" class="dim-text">400 x 225</span>
            </div>

            <!-- TABS -->
            <div class="tab-nav">
                <button class="tab-link active" data-tab="trim">✂️ Simple Trim</button>
                <button class="tab-link" data-tab="timeline">🎬 Timeline</button>
                <button class="tab-link" data-tab="speed">⚡ Speed Fit</button>
            </div>

            <!-- TAB: TRIM -->
            <div id="pane-trim" class="tab-pane active">
                <div style="display:flex; justify-content:center; gap:20px; align-items:center; flex-wrap:wrap;">
                    <div>
                        <label style="font-size:12px; color:#aaa; display:block; margin-bottom:5px;">Duration</label>
                        <input type="number" id="inpTrimDur" class="control-input" value="5" min="1"> <span style="font-size:12px; color:#888;">sec</span>
                    </div>
                    <div>
                        <label style="font-size:12px; color:#aaa; display:block; margin-bottom:5px;">Keep</label>
                        <select id="inpTrimDir" class="control-select">
                            <option value="start">From Start</option>
                            <option value="end">From End</option>
                        </select>
                    </div>
                </div>
            </div>

            <!-- TAB: TIMELINE -->
            <div id="pane-timeline" class="tab-pane">
                <div style="color:#aaa; font-size:12px; margin-bottom:8px;">
                    <span style="color:#dc2626;">🔴 Red = Trimmed</span> • 
                    <span style="color:#22c55e;">🟢 Green = Kept</span>
                </div>
                <div class="timeline-wrapper" id="tlWrap">
                    <div class="timeline-track" id="tlTrack">
                        <!-- Thumbnails injected here -->
                    </div>
                    <!-- Red Trim Zones -->
                    <div class="timeline-trim-left" id="tlTrimL"></div>
                    <div class="timeline-trim-right" id="tlTrimR"></div>
                    <!-- Keep Zone (green border) -->
                    <div class="timeline-keep" id="tlKeep"></div>
                    <!-- Handles -->
                    <div class="t-handle" id="thL"></div>
                    <div class="t-handle" id="thR"></div>
                </div>
                <div style="font-family:monospace; color:var(--text-muted); font-size:13px; margin-top:5px;">
                    Keeping: <span id="lblTime" style="color:#22c55e; font-weight:600;">0.0s - 0.0s</span>
                </div>
            </div>

            <!-- TAB: SPEED -->
            <div id="pane-speed" class="tab-pane">
                <p style="color:#aaa; font-size:13px; margin-bottom:15px; max-width:400px; margin-left:auto; margin-right:auto;">
                    Uses <b style="color:var(--accent)">Time-Lapse</b> mode to fit the <b>entire video</b> into the target duration.
                </p>
                <div>
                    <label style="font-size:12px; color:#aaa; display:block; margin-bottom:5px;">Target Duration</label>
                    <input type="number" id="inpSpeedDur" class="control-input" value="3" min="0.5" max="60" step="0.5"> <span style="font-size:12px; color:#888;">sec</span>
                </div>
            </div>

            <button id="btnConvert" class="btn-primary">
                <span class="icon-fallback">✨</span> Create GIF
            </button>
            <div id="status" style="margin-top:15px; color:var(--accent); min-height:20px;"></div>
        </div>

        <div id="result" class="result-section hidden">
            <h3 style="color:var(--success); margin-bottom:15px;">✅ GIF Ready!</h3>
            <div style="background:#000; padding:10px; border-radius:8px; display:inline-block;">
                <img id="outImg" style="max-width:100%; display:block;">
            </div>
            <br>
            <a id="btnDl" class="btn-download" download="my-animation.gif">
                <span class="icon-fallback">⬇️</span> Download GIF
            </a>
            <button id="btnRestart" class="btn-ghost">🔄 Start Over</button>
        </div>
    `;

    // Map DOM
    dom.up = document.getElementById('upFile');
    dom.drop = document.getElementById('dropZone');
    dom.editor = document.getElementById('editor');
    dom.result = document.getElementById('result');
    dom.vid = document.getElementById('vid');
    dom.rZone = document.getElementById('rZone');

    dom.btnResize = document.getElementById('btnResize');
    dom.btnLock = document.getElementById('btnLock');
    dom.btnResetSize = document.getElementById('btnResetSize');
    dom.dimDisp = document.getElementById('dimDisp');

    dom.tlWrap = document.getElementById('tlWrap');
    dom.tlTrack = document.getElementById('tlTrack');
    dom.tlTrimL = document.getElementById('tlTrimL');
    dom.tlTrimR = document.getElementById('tlTrimR');
    dom.tlKeep = document.getElementById('tlKeep');
    dom.thL = document.getElementById('thL');
    dom.thR = document.getElementById('thR');

    dom.btnConvert = document.getElementById('btnConvert');
    dom.status = document.getElementById('status');
    dom.outImg = document.getElementById('outImg');
    dom.btnDl = document.getElementById('btnDl');
    dom.btnRestart = document.getElementById('btnRestart');
    dom.loader = document.getElementById('loader');
    dom.loadText = document.getElementById('loadText');
}

function initializeLogic() {
    // --- UPLOAD & INIT ---
    dom.drop.onclick = () => dom.up.click();
    dom.up.onchange = (e) => loadVideo(e.target.files[0]);
    dom.drop.ondragover = (e) => { e.preventDefault(); dom.drop.style.borderColor = 'var(--accent)'; };
    dom.drop.ondragleave = (e) => { dom.drop.style.borderColor = 'var(--border)'; };
    dom.drop.ondrop = (e) => { e.preventDefault(); loadVideo(e.dataTransfer.files[0]); };

    function loadVideo(file) {
        if (!file || !file.type.startsWith('video/')) return;
        state.file = file;
        dom.vid.src = URL.createObjectURL(file);

        // ensure loader is hidden for new file
        dom.loader.classList.add('hidden');
        dom.status.innerText = '';

        dom.vid.onloadedmetadata = () => {
            state.dur = dom.vid.duration;

            // Set Dims
            state.origW = dom.vid.videoWidth;
            state.origH = dom.vid.videoHeight;
            let scale = 1;
            if (state.origW > 600) scale = 600 / state.origW;
            state.w = Math.round(state.origW * scale);
            state.h = Math.round(state.origH * scale);
            updateDims();

            // Setup Timeline
            generateTimeline();

            // Show editor FIRST so layout is calculated
            dom.drop.classList.add('hidden');
            dom.editor.classList.remove('hidden');

            // Wait for DOM to render, then update timeline positions
            requestAnimationFrame(() => {
                updateTimelineUI();
            });
        };
    }

    // --- TOOLBAR ---
    dom.btnResize.onclick = () => {
        state.resizing = !state.resizing;
        dom.rZone.classList.toggle('resizing', state.resizing);
        dom.btnResize.classList.toggle('active', state.resizing);
    };

    dom.btnLock.onclick = () => {
        state.locked = !state.locked;
        dom.btnLock.classList.toggle('active', state.locked);
        dom.btnLock.innerHTML = state.locked
            ? '<span class="icon-fallback">🔗</span>'
            : '<span class="icon-fallback">⛓️‍💥</span>';
        dom.rZone.classList.toggle('unlocked', !state.locked);
    };

    dom.btnResetSize.onclick = () => {
        let scale = 1;
        if (state.origW > 600) scale = 600 / state.origW;
        state.w = Math.round(state.origW * scale);
        state.h = Math.round(state.origH * scale);
        updateDims();
    };

    function updateDims() {
        dom.rZone.style.width = state.w + 'px';
        dom.rZone.style.height = state.h + 'px';
        dom.dimDisp.innerText = `${state.w} x ${state.h}`;
    }

    // --- RESIZING DRAG ---
    document.querySelectorAll('.resize-handle').forEach(h => {
        h.onmousedown = (e) => {
            e.preventDefault();
            let startX = e.clientX, startY = e.clientY;
            let startW = dom.rZone.offsetWidth;
            let startH = dom.rZone.offsetHeight;
            let ratio = startW / startH;

            const onMove = (ev) => {
                let dx = ev.clientX - startX;
                let dy = ev.clientY - startY;

                // Simple logic: dragging any corner adjusts size 
                // We use width mainly for scale
                let nw = Math.max(100, startW + dx);
                let nh;

                if (state.locked) {
                    nh = nw / ratio;
                } else {
                    nh = Math.max(100, startH + dy);
                }

                state.w = Math.round(nw);
                state.h = Math.round(nh);
                updateDims();
            };

            const onUp = () => {
                window.removeEventListener('mousemove', onMove);
                window.removeEventListener('mouseup', onUp);
            };

            window.addEventListener('mousemove', onMove);
            window.addEventListener('mouseup', onUp);
        };
    });

    // --- TABS ---
    document.querySelectorAll('.tab-link').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.tab-link').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
            btn.classList.add('active');
            state.tab = btn.dataset.tab;
            document.getElementById(`pane-${state.tab}`).classList.add('active');

            // Force recalculate timeline when switching to it
            // This fixes the 0-width issue if it was hidden
            if (state.tab === 'timeline') {
                setTimeout(() => updateTimelineUI(), 50);
            }
        };
    });

    // --- TIMELINE ---
    async function generateTimeline() {
        dom.tlTrack.innerHTML = '';
        let frames = 8;
        let step = state.dur / frames;
        let v = document.createElement('video');
        v.src = dom.vid.src; v.muted = true;

        let cv = document.createElement('canvas');
        cv.width = 100; cv.height = 60;
        let cx = cv.getContext('2d');

        // Play briefly to ensure loading
        try { await v.play(); v.pause(); } catch (e) { }

        for (let i = 0; i < frames; i++) {
            v.currentTime = i * step + 0.1;
            await new Promise(r => { let f = () => { v.removeEventListener('seeked', f); r(); }; v.addEventListener('seeked', f); });

            cx.drawImage(v, 0, 0, 100, 60);
            let d = document.createElement('div');
            d.className = 'frame-strip';
            d.style.background = `url(${cv.toDataURL()}) center/cover no-repeat`;
            dom.tlTrack.appendChild(d);
        }
    }

    // Timeline Handles
    function mapPctToPx(pct) {
        // Track width is width of wrapper - 20px padding (10 left, 10 right)
        // Wait, handle 'left' is set relative to wrapper
        // Track starts at 10px, ends at width-10px.
        // So 0% = 10px. 100% = width-10px.
        let w = dom.tlWrap.offsetWidth;
        let trackW = w - 20;
        return 10 + (pct / 100) * trackW;
    }

    function mapPxToPct(px) {
        let w = dom.tlWrap.offsetWidth;
        let trackW = w - 20;
        let val = (px - 10) / trackW;
        return Math.max(0, Math.min(100, val * 100));
    }

    function updateTimelineUI() {
        // Calculate positions
        let leftPx = mapPctToPx(state.tL);
        let rightPx = mapPctToPx(state.tR);
        let wrapperWidth = dom.tlWrap.offsetWidth;

        // Position the red trim zones (areas that will be cut)
        // Left trim zone: from track start (10px) to left handle
        dom.tlTrimL.style.width = (leftPx - 10) + 'px';

        // Right trim zone: from right handle to track end (wrapper width - 10px)
        dom.tlTrimR.style.width = (wrapperWidth - 10 - rightPx) + 'px';

        // Position the keep zone (green highlight)
        dom.tlKeep.style.left = leftPx + 'px';
        dom.tlKeep.style.width = (rightPx - leftPx) + 'px';

        // Position Handles
        dom.thL.style.left = leftPx + 'px';
        dom.thR.style.left = rightPx + 'px';

        // Update Text
        let s = (state.tL / 100) * state.dur;
        let e = (state.tR / 100) * state.dur;
        let duration = e - s;
        document.getElementById('lblTime').innerText = `${s.toFixed(1)}s - ${e.toFixed(1)}s (${duration.toFixed(1)}s)`;
    }

    [dom.thL, dom.thR].forEach(h => {
        h.onmousedown = (e) => {
            e.preventDefault();
            let isL = (h === dom.thL);

            document.onmousemove = (ev) => {
                let rect = dom.tlWrap.getBoundingClientRect();
                let x = ev.clientX - rect.left; // relative to wrapper
                let pct = mapPxToPct(x);

                if (isL) {
                    state.tL = Math.min(pct, state.tR - 5);
                } else {
                    state.tR = Math.max(pct, state.tL + 5);
                }
                updateTimelineUI();
            };
            document.onmouseup = () => {
                document.onmousemove = null;
                document.onmouseup = null;
            };
        };
    });

    // --- CONVERT ---
    dom.btnConvert.onclick = async () => {
        dom.btnConvert.disabled = true;
        dom.loader.classList.remove('hidden');
        dom.loadText.innerText = 'Initializing...';

        // Give UI a moment to show loader
        await new Promise(r => requestAnimationFrame(() => setTimeout(r, 50)));

        let options = {
            'gifWidth': state.w,
            'gifHeight': state.h,
            'interval': 0.1
        };

        // --- UNIVERSAL FAST FRAME CAPTURE ---
        // All modes use manual canvas capture for speed

        let offset = 0;
        let duration = state.dur;
        let frameCount;

        if (state.tab === 'speed') {
            // Speed Fit: compress full video into target duration
            let targetDur = parseFloat(document.getElementById('inpSpeedDur').value);
            frameCount = Math.floor(targetDur * 10);
            // step through entire video
            offset = 0;
            duration = state.dur;
        } else if (state.tab === 'trim') {
            // Simple Trim
            let d = parseFloat(document.getElementById('inpTrimDur').value);
            let mode = document.getElementById('inpTrimDir').value;
            if (mode === 'end') offset = Math.max(0, state.dur - d);
            duration = Math.min(d, state.dur);
            frameCount = Math.floor(duration * 10);
        } else if (state.tab === 'timeline') {
            // Timeline
            offset = (state.tL / 100) * state.dur;
            duration = ((state.tR - state.tL) / 100) * state.dur;
            frameCount = Math.floor(duration * 10);
        } else {
            frameCount = Math.floor(duration * 10);
        }

        // Cap frame count to prevent excessive processing
        frameCount = Math.min(frameCount, 100);

        dom.loadText.innerText = `Capturing ${frameCount} frames...`;

        // Canvas for frame capture
        let c = document.createElement('canvas');
        c.width = state.w; c.height = state.h;
        let cx = c.getContext('2d');

        dom.vid.pause();
        let orgT = dom.vid.currentTime;
        let images = [];

        // Calculate step size
        let step;
        if (state.tab === 'speed') {
            // For speed fit, spread frames across entire video
            step = state.dur / frameCount;
        } else {
            // For trim/timeline, spread frames across selected duration
            step = duration / frameCount;
        }

        // Capture frames
        for (let i = 0; i < frameCount; i++) {
            let targetTime = offset + (i * step);
            dom.vid.currentTime = targetTime;

            await new Promise(r => {
                let f = () => {
                    dom.vid.removeEventListener('seeked', f);
                    r();
                };
                dom.vid.addEventListener('seeked', f);
            });

            cx.drawImage(dom.vid, 0, 0, state.w, state.h);
            images.push(c.toDataURL('image/jpeg', 0.8));

            // Update progress
            dom.loadText.innerText = `Capturing frame ${i + 1}/${frameCount}...`;
        }

        dom.vid.currentTime = orgT;

        options.images = images;
        runGifShot(options);
    };

    function runGifShot(currentOpt) {
        dom.loadText.innerText = 'Rendering GIF...';

        // Add a small delay to ensure UI updates
        setTimeout(() => {
            gifshot.createGIF(currentOpt, (obj) => {
                dom.btnConvert.disabled = false;
                dom.loader.classList.add('hidden');
                dom.status.innerText = '';

                if (!obj.error) {
                    dom.outImg.src = obj.image;
                    dom.btnDl.href = obj.image;
                    dom.editor.classList.add('hidden');
                    dom.result.classList.remove('hidden');
                } else {
                    dom.status.innerText = 'Error: ' + obj.errorMsg;
                }
            });
        }, 100);
    }

    dom.btnRestart.onclick = () => location.reload();
}
