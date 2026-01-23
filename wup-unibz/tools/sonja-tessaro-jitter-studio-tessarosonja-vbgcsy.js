/* JITTER STUDIO v13 - INLINE STYLE EDITION
   Compatible with Tool Viewers (No <style> tags, No CSS classes)
*/

// --- STYLE CONFIGURATION (Inline Dictionary) ---
const STYLES = {
  // Layouts
  app: { display: 'flex', width: '100%', height: '100vh', background: '#111', color: '#ccc', fontFamily: 'Inter, sans-serif', overflow: 'hidden', userSelect: 'none' },
  sidebar: { width: '230px', background: '#181818', borderRight: '1px solid #333', padding: '15px', display: 'flex', flexDirection: 'column', gap: '10px' },
  main: { flex: '1', display: 'flex', flexDirection: 'column' },
  
  // Panels
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' },
  timeline: { height: '60px', background: '#181818', borderBottom: '1px solid #333', display: 'flex', alignItems: 'center', padding: '0 10px', gap: '10px' },
  props: { height: '80px', background: '#181818', borderTop: '1px solid #333', display: 'flex', alignItems: 'center', padding: '0 15px', gap: '15px' },
  canvasWrap: { flex: '1', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#555', overflow: 'hidden' },
  
  // UI Elements
  btn: { background: '#111', border: '1px solid #333', color: '#ccc', padding: '8px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', textAlign: 'center' },
  btnActive: { background: '#4e4eff', color: '#fff', border: '1px solid #4e4eff' },
  
  label: { fontSize: '10px', fontWeight: 'bold', color: '#ccc', opacity: '0.6', marginTop: '5px' },
  tooltip: { position: 'fixed', background: 'rgba(0,0,0,0.9)', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', pointerEvents: 'none', zIndex: '9999', display: 'none' }
};

// --- DATA & STATE ---
let frames = [ { strokes: [], duration: 1 } ]; 
let currentFrameIdx = 0;
let currentPath = [];
let redoStack = [];
let selection = [];
let isRecording = false; 

// References for manual style updates
let uiRefs = { 
  toolBtns: [], 
  brushBtns: [], 
  frames: [],
  tooltip: null,
  durationInput: null,
  colorPicker: null,
  playBtn: null
};

let config = {
  tool: 'brush', 
  brush: 'Pen',
  drawMode: 'stroke', 
  color: '#4e4eff',
  bgColor: '#111111',
  size: 5, spacing: 15, 
  jitterMode: 'Noise', jitterAmp: 3, jitterSpeed: 12,
  textPhrase: 'HELLO', textFont: 'Arial',
  onionSkin: true, isPlaying: false, isMirror: false, isEraser: false, isRainbow: false, isTransparent: false
};

let dragState = { startX: 0, startY: 0, isDraggingItems: false, lastX: 0, lastY: 0 };

function setup() {
  // Main Container
  let app = createDiv('');
  applyStyles(app, STYLES.app);
  
  uiRefs.tooltip = createDiv('');
  applyStyles(uiRefs.tooltip, STYLES.tooltip);

  // --- SIDEBAR ---
  let sidebar = createDiv('').parent(app);
  applyStyles(sidebar, STYLES.sidebar);

  // Header
  let header = createDiv('').parent(sidebar);
  applyStyles(header, STYLES.header);
  createDiv('⚡ JITTER v13').parent(header).style('font-weight','900').style('color', '#ccc');

  // 1. TRANSFORM PANEL (Hidden by default)
  uiRefs.transformGroup = createDiv('').parent(sidebar);
  applyStyles(uiRefs.transformGroup, { background: '#222', padding: '10px', borderRadius: '6px', border: '1px solid #444', marginBottom: '10px', display: 'none' });
  
  createDiv('TRANSFORM').parent(uiRefs.transformGroup).style('font-size','10px').style('font-weight','bold').style('color','#e91e63').style('margin-bottom','5px');
  let tGrid = createDiv('').parent(uiRefs.transformGroup);
  applyStyles(tGrid, STYLES.grid);

  createStyledBtn('↺', tGrid, () => rotateSelection(-0.1), "Rotate Left");
  createStyledBtn('↻', tGrid, () => rotateSelection(0.1), "Rotate Right");
  createStyledBtn('Lat', tGrid, () => scaleSelection(1.1), "Scale Up");
  createStyledBtn('Sml', tGrid, () => scaleSelection(0.9), "Scale Down");
  
  let delBtn = createStyledBtn('🗑 Delete', uiRefs.transformGroup, deleteSelection);
  delBtn.style('margin-top','5px').style('width', '100%');

  // 2. TOOLS
  createLabel('TOOLS', sidebar);
  let toolGrid = createDiv('').parent(sidebar);
  applyStyles(toolGrid, STYLES.grid);

  let btnSel = createToolBtn('⬚ Select', toolGrid, 'select');
  btnSel.mousePressed(() => { setTool('select'); updateToolStyles(); });
  
  let btnFill = createToolBtn('🪣 Fill', toolGrid, 'bucket');
  btnFill.mousePressed(() => { setTool('bucket'); updateToolStyles(); });

  let btnDrop = createToolBtn('🖊 Picker', toolGrid, 'dropper');
  btnDrop.mousePressed(() => { setTool('dropper'); updateToolStyles(); });

  let btnEra = createToolBtn('🧼 Eraser', toolGrid, 'eraser');
  btnEra.mousePressed(() => { config.isEraser = !config.isEraser; updateToolStyles(); });

  let btnMir = createToolBtn('🦋 Mirror', toolGrid, 'mirror');
  btnMir.mousePressed(() => { config.isMirror = !config.isMirror; updateToolStyles(); });

  // 3. HISTORY
  createLabel('HISTORY', sidebar);
  let histGrid = createDiv('').parent(sidebar);
  applyStyles(histGrid, STYLES.grid);
  createStyledBtn('↺ Undo', histGrid, undo, "Ctrl+Z");
  createStyledBtn('↻ Redo', histGrid, redo, "Ctrl+Y");
  createStyledBtn('🗑 Clear', histGrid, clearFrame, "Clear Frame");

  // 4. BRUSHES
  createLabel('INK', sidebar);
  let bGrid1 = createDiv('').parent(sidebar);
  applyStyles(bGrid1, STYLES.grid);
  ['Pen', 'Marker', 'Sketch', 'Web', 'DNA', 'Glitch'].forEach(b => createBrushBtn(b, bGrid1));

  createLabel('STAMP', sidebar);
  let bGrid2 = createDiv('').parent(sidebar);
  applyStyles(bGrid2, STYLES.grid);
  ['Spray', 'Bubbles', 'Star', 'Pixel', 'Text'].forEach(b => createBrushBtn(b, bGrid2));

  // --- MAIN AREA ---
  let mainArea = createDiv('').parent(app);
  applyStyles(mainArea, STYLES.main);

  // 5. TIMELINE
  let timelineArea = createDiv('').parent(mainArea);
  applyStyles(timelineArea, STYLES.timeline);

  // Controls
  let controls = createDiv('').parent(timelineArea).style('display','flex').style('gap','5px').style('align-items','center');
  
  uiRefs.playBtn = createStyledBtn('▶', controls, () => togglePlay());
  uiRefs.playBtn.style('background', '#4e4eff').style('color','white').style('border','none').style('width','30px').style('height','30px').style('border-radius','50%');
  
  let onionBtn = createStyledBtn('🧅', controls, function() { 
      config.onionSkin = !config.onionSkin; 
      this.style('color', config.onionSkin ? '#4e4eff' : '#ccc');
  }, "Onion Skin");
  onionBtn.style('background','none').style('border','none').style('font-size','16px').style('color', '#4e4eff'); // Active by default

  let dupBtn = createStyledBtn('❐', controls, duplicateFrame, "Duplicate");
  dupBtn.style('background','none').style('border','none').style('font-size','16px');

  createDiv('Hold:').parent(controls).style('font-size','9px').style('color','#888');
  uiRefs.durationInput = createInput('1', 'number').parent(controls);
  uiRefs.durationInput.style('width','30px').style('background','#111').style('border','1px solid #333').style('color','#ccc').style('text-align','center');
  uiRefs.durationInput.attribute('min', '1');
  uiRefs.durationInput.input(() => { 
    frames[currentFrameIdx].duration = parseInt(uiRefs.durationInput.value()) || 1; 
    renderTimeline(); 
  });

  let addBtn = createStyledBtn('+', controls, addFrame, "Add Frame");
  addBtn.style('background','#4e4eff').style('color','white').style('border','none').style('border-radius','4px').style('width','20px');

  // Strip
  uiRefs.timeline = createDiv('').parent(timelineArea);
  uiRefs.timeline.style('flex','1').style('display','flex').style('gap','4px').style('overflow-x','auto').style('padding','5px');
  renderTimeline();

  // 6. CANVAS
  let cnvWrap = createDiv('').parent(mainArea);
  applyStyles(cnvWrap, STYLES.canvasWrap);
  let cnv = createCanvas(800, 500);
  cnv.parent(cnvWrap);
  cnv.style('box-shadow', '0 0 20px rgba(0,0,0,0.3)');

  // 7. PROPERTIES
  let props = createDiv('').parent(mainArea);
  applyStyles(props, STYLES.props);

  // Group 1: Ink
  createPropGroup(props, [
    createLabel('INK', null, true),
    uiRefs.colorPicker = createColorPicker(config.color).input(() => config.color = uiRefs.colorPicker.value()),
    createStyledBtn('○', null, function() {
       config.drawMode = (config.drawMode === 'stroke') ? 'fill' : 'stroke';
       this.html(config.drawMode === 'stroke' ? '○' : '●');
    }, "Stroke/Fill"),
    createCheckbox('🌈', false).changed(function() { config.isRainbow = this.checked(); }).style('font-size','10px').style('display','flex')
  ]);

  // Group 2: Specs
  createPropGroup(props, [
    createLabel('SPECS', null, true),
    createSliderGroup('Size', 1, 80, 5, v => config.size = v),
    createSliderGroup('Space', 5, 100, 15, v => config.spacing = v)
  ]);

  // Group 3: Jitter
  let jSelect = createSelect();
  ['Noise', 'Wave', 'Twitch', 'Elastic'].forEach(m => jSelect.option(m));
  jSelect.changed(() => config.jitterMode = jSelect.value());
  jSelect.style('background','#111').style('color','#ccc').style('border','1px solid #333');

  createPropGroup(props, [
    createLabel('JITTER', null, true),
    jSelect,
    createSliderGroup('Amp', 0, 40, 3, v => config.jitterAmp = v),
    createSliderGroup('FPS', 1, 60, 12, v => config.jitterSpeed = v)
  ]);

  // Group 4: Canvas
  let sizeSel = createSelect();
  sizeSel.option('Std'); sizeSel.option('Sqr'); sizeSel.option('Vert'); sizeSel.option('HD');
  sizeSel.changed(() => setCanvasSize(sizeSel.value()));
  sizeSel.style('background','#111').style('color','#ccc').style('border','1px solid #333').style('width','50px');

  let saveBtn = createStyledBtn('💾 GIF', null, exportGif);
  saveBtn.style('background','#4e4eff').style('color','white').style('border','none');

  createPropGroup(props, [
    createLabel('CANVAS', null, true),
    sizeSel,
    createColorPicker(config.bgColor).input(function() { config.bgColor = this.value(); }),
    createCheckbox('Transp', false).changed(function() { config.isTransparent = this.checked(); }).style('font-size','9px').style('display','flex').style('color','#ccc'),
    saveBtn
  ]);

  // Text Options (Hidden overlay)
  uiRefs.textGroup = createDiv('').parent(mainArea);
  applyStyles(uiRefs.textGroup, { position: 'absolute', bottom: '90px', left: '50%', transform: 'translateX(-50%)', background: '#222', padding: '10px', borderRadius: '8px', border: '1px solid #333', display: 'none', alignItems: 'center', gap: '10px' });
  
  createDiv('TEXT:').parent(uiRefs.textGroup).style('font-weight','bold').style('color','#ccc');
  createInput('HELLO').parent(uiRefs.textGroup).input(function(){ config.textPhrase = this.value(); }).style('background','#111').style('color','#ccc').style('border','1px solid #333').style('padding','4px');
  
  strokeJoin(ROUND); strokeCap(ROUND);
  
  // Initialize Active Styles
  updateToolStyles();
  updateBrushStyles();
}

// --- DRAW LOOP ---
let frameTimer = 0; 
function draw() {
  frameRate(config.jitterSpeed);
  
  if (config.isPlaying && frames.length > 1) {
    frameTimer++;
    if (frameTimer > frames[currentFrameIdx].duration * 3) {
      currentFrameIdx = (currentFrameIdx + 1) % frames.length;
      frameTimer = 0; selection = []; 
      updateTimelineUI(); renderTimeline();
    }
  }

  // Visibility toggles
  if(config.brush === 'Text') uiRefs.textGroup.style('display','flex'); else uiRefs.textGroup.style('display','none');
  if(config.tool === 'select' && selection.length > 0) uiRefs.transformGroup.style('display','block'); else uiRefs.transformGroup.style('display','none');

  if (config.isTransparent && isRecording) clear(); 
  else background(config.bgColor);

  // Onion Skin
  if (config.onionSkin && !config.isPlaying && currentFrameIdx > 0) {
    push();
    drawingContext.globalAlpha = 0.3;
    let prevFrame = frames[currentFrameIdx-1];
    for(let s of prevFrame.strokes) drawStroke(s, false);
    pop();
  }

  // Current Frame
  let currentStrokes = frames[currentFrameIdx].strokes;
  for (let s of currentStrokes) drawStroke(s, true);

  // Overlay
  if (config.tool === 'select' && selection.length > 0) drawSelectionOverlay();

  // Preview
  if (mouseIsPressed && mouseInCanvas() && config.tool === 'brush') {
    let preview = { path: currentPath, ...config, isPreview: true };
    drawStroke(preview, true);
  }
  
  // Selection Box
  if (config.tool === 'select' && mouseIsPressed && selection.length === 0 && !dragState.isDraggingItems) {
    push(); stroke(100, 100, 255); fill(100, 100, 255, 50); strokeWeight(1);
    rect(dragState.startX, dragState.startY, mouseX - dragState.startX, mouseY - dragState.startY);
    pop();
  }
}

// --- RENDERERS ---
function drawStroke(s, doJitter) {
  push();
  let c;
  if (s.isEraser) {
    c = color(config.bgColor);
    stroke(c); fill(c);
  } else if (s.isRainbow) {
    colorMode(HSB, 360, 100, 100);
    let h = (frameCount * 5) % 360;
    c = color(h, 80, 100);
  } else {
    colorMode(RGB);
    c = color(s.color);
  }

  let forceStroke = ['Web','Sketch','DNA','Glitch'].includes(s.brush);
  if (s.drawMode === 'fill' && !s.isEraser && !forceStroke) {
    fill(c); noStroke();
  } else {
    noFill(); stroke(c);
  }

  if(s.brush === 'Marker' && !s.isEraser && s.drawMode === 'stroke') {
     c.setAlpha(40); stroke(c);
  }

  strokeWeight(s.size);
  let amp = doJitter ? s.jitterAmp : 0;
  let iterations = s.isMirror ? 2 : 1;

  for(let k=0; k<iterations; k++) {
    if(k===1) { translate(width, 0); scale(-1, 1); }

    if(['Pen','Marker','Sketch','Web','DNA','Glitch'].includes(s.brush)) {
       beginShape();
       for(let i=0; i<s.path.length; i++) {
         let p = s.path[i];
         let j = getJitter(i, s.jitterMode, amp);
         if(s.brush === 'DNA') {
            let wave = sin(i*0.4 + frameCount*0.2) * s.size*2;
            vertex(p.x + wave + j.x, p.y + j.y);
         } else if(s.brush === 'Glitch') {
            let gX = (random() > 0.8) ? random(-s.size*4, s.size*4) : 0;
            vertex(p.x + j.x + gX, p.y + j.y);
         } else if(s.brush === 'Sketch') {
            vertex(p.x + j.x + random(-2,2), p.y + j.y + random(-2,2));
         } else {
            vertex(p.x + j.x, p.y + j.y);
         }
       }
       if(s.drawMode === 'fill' && !forceStroke) endShape(CLOSE); else endShape();
       
       if(s.brush === 'Web') {
          strokeWeight(1);
          let distThresh = s.size * 10;
          for(let i=0; i<s.path.length; i+=3) {
             if(random() > 0.7 && i > 5) {
               let p1 = s.path[i]; let p2 = s.path[i - floor(random(2, 5))];
               if(dist(p1.x, p1.y, p2.x, p2.y) < distThresh) line(p1.x+rJ(amp), p1.y+rJ(amp), p2.x, p2.y);
             }
          }
       }
    } 
    else {
       noStroke();
       for(let i=0; i<s.path.length; i++) {
         let p = s.path[i];
         let j = getJitter(i, s.jitterMode, amp);
         let x = p.x+j.x; let y=p.y+j.y;
         
         if(s.isRainbow) { colorMode(HSB, 360, 100, 100); fill((frameCount*5 + i*15)%360, 80, 100); } 
         else { colorMode(RGB); fill(s.color); }
         
         if(s.brush==='Spray') { for(let z=0; z<3; z++) circle(x+rJ(s.size*2), y+rJ(s.size*2), 2); }
         else if(s.brush==='Bubbles') circle(x, y, s.size);
         else if(s.brush==='Pixel') square(x, y, s.size);
         else if(s.brush==='Star') drawStar(x,y,s.size/2,s.size,5);
         else if(s.brush==='Text') {
            textAlign(CENTER,CENTER); textSize(s.size*2 + 10);
            textFont(s.textFont || 'Arial');
            text((s.textPhrase||"?").charAt(i%(s.textPhrase||"?").length), x, y);
         }
       }
    }
  }
  pop();
}

function getJitter(i, mode, amp) {
  if(amp === 0) return createVector(0,0);
  let t = frameCount;
  if(mode==='Noise') return createVector(random(-amp,amp), random(-amp,amp));
  if(mode==='Wave') return createVector(sin(i*0.2+t*0.2)*amp, cos(i*0.2+t*0.2)*amp);
  if(mode==='Twitch') return (t%8===0)?createVector(random(-amp*2,amp*2), random(-amp*2,amp*2)):createVector(0,0);
  if(mode==='Elastic') return createVector(random(-1,1)*amp*sin(t*0.3), random(-1,1)*amp*sin(t*0.3));
  return createVector(0,0);
}

// --- INTERACTION ---
function mousePressed() {
  if (!mouseInCanvas()) return;
  if (config.tool === 'select') {
    if (checkSelectionHit(mouseX, mouseY)) {
      dragState.isDraggingItems = true; dragState.lastX = mouseX; dragState.lastY = mouseY;
    } else {
      selection = []; dragState.isDraggingItems = false; dragState.startX = mouseX; dragState.startY = mouseY;
    }
  } else if (config.tool === 'brush') {
    redoStack = []; currentPath = [createVector(mouseX, mouseY)];
  } else if (config.tool === 'bucket') performFill(mouseX, mouseY);
  else if (config.tool === 'dropper') pickColor(mouseX, mouseY);
}

function mouseDragged() {
  if (!mouseInCanvas()) return;
  if (config.tool === 'select' && dragState.isDraggingItems) {
      moveSelection(mouseX - dragState.lastX, mouseY - dragState.lastY);
      dragState.lastX = mouseX; dragState.lastY = mouseY;
  } else if (config.tool === 'brush') {
    let p = createVector(mouseX, mouseY);
    let last = currentPath[currentPath.length-1];
    if(dist(p.x, p.y, last.x, last.y) > config.spacing) currentPath.push(p);
  }
}

function mouseReleased() {
  if (!mouseInCanvas()) return;
  if (config.tool === 'select') {
    if (!dragState.isDraggingItems) performBoxSelection(dragState.startX, dragState.startY, mouseX, mouseY);
    dragState.isDraggingItems = false;
  } else if (config.tool === 'brush') {
    if (currentPath.length > 0) frames[currentFrameIdx].strokes.push({ path: currentPath, ...config });
  }
}

// --- LOGIC HELPER FUNCTIONS ---
function setCanvasSize(mode) {
  let w=800, h=500;
  if(mode === 'Sqr') { w=600; h=600; }
  else if(mode === 'Vert') { w=450; h=800; }
  else if(mode === 'HD') { w=1280; h=720; }
  resizeCanvas(w, h);
}

function rotateSelection(angle) {
  if(selection.length === 0) return;
  let cx=0, cy=0, count=0;
  let strokes = frames[currentFrameIdx].strokes;
  for(let idx of selection) for(let p of strokes[idx].path) { cx+=p.x; cy+=p.y; count++; }
  cx/=count; cy/=count;
  for(let idx of selection) for(let p of strokes[idx].path) {
    let x = p.x - cx; let y = p.y - cy;
    p.x = x*cos(angle) - y*sin(angle) + cx;
    p.y = x*sin(angle) + y*cos(angle) + cy;
  }
}

function scaleSelection(factor) {
  if(selection.length === 0) return;
  let cx=0, cy=0, count=0;
  let strokes = frames[currentFrameIdx].strokes;
  for(let idx of selection) for(let p of strokes[idx].path) { cx+=p.x; cy+=p.y; count++; }
  cx/=count; cy/=count;
  for(let idx of selection) for(let p of strokes[idx].path) {
    p.x = cx + (p.x - cx) * factor; p.y = cy + (p.y - cy) * factor;
  }
}

function deleteSelection() {
  let strokes = frames[currentFrameIdx].strokes;
  selection.sort((a,b)=>b-a);
  for(let idx of selection) strokes.splice(idx,1);
  selection = [];
}

function undo() { if(frames[currentFrameIdx].strokes.length>0) redoStack.push(frames[currentFrameIdx].strokes.pop()); }
function redo() { if(redoStack.length>0) frames[currentFrameIdx].strokes.push(redoStack.pop()); }
function clearFrame() { frames[currentFrameIdx].strokes = []; selection = []; redoStack = []; }

function performFill(mx, my) {
  let strokes = frames[currentFrameIdx].strokes;
  for(let i=strokes.length-1; i>=0; i--) for(let p of strokes[i].path) {
    if(dist(mx, my, p.x, p.y) < 10) { strokes[i].drawMode = (strokes[i].drawMode === 'fill') ? 'stroke' : 'fill'; return; }
  }
}
function checkSelectionHit(mx, my) {
  if(selection.length===0) return false;
  let strokes = frames[currentFrameIdx].strokes;
  for(let idx of selection) if(strokes[idx]) for(let p of strokes[idx].path) if(dist(mx, my, p.x, p.y)<20) return true;
  return false;
}
function performBoxSelection(x1,y1,x2,y2) {
  let l=min(x1,x2), r=max(x1,x2), t=min(y1,y2), b=max(y1,y2);
  let strokes = frames[currentFrameIdx].strokes; selection=[];
  for(let i=0; i<strokes.length; i++) for(let p of strokes[i].path) if(p.x>l && p.x<r && p.y>t && p.y<b) { selection.push(i); break; }
}
function moveSelection(dx, dy) {
  let strokes = frames[currentFrameIdx].strokes;
  for(let idx of selection) for(let p of strokes[idx].path) { p.x += dx; p.y += dy; }
}
function drawSelectionOverlay() {
  push(); noFill(); stroke(0, 150, 255); strokeWeight(1); drawingContext.setLineDash([5, 5]);
  let strokes = frames[currentFrameIdx].strokes;
  for(let idx of selection) if(strokes[idx]) { beginShape(); for(let p of strokes[idx].path) vertex(p.x, p.y); endShape(); }
  drawingContext.setLineDash([]); pop();
}
function pickColor(mx, my) {
  loadPixels(); let c = get(mx, my);
  let h = '#' + hex(c[0],2) + hex(c[1],2) + hex(c[2],2);
  config.color = h; uiRefs.colorPicker.value(h);
}

// --- UI HELPERS (STYLED) ---
function applyStyles(el, styleObj) {
  for(let k in styleObj) el.style(k, styleObj[k]);
}

function createStyledBtn(label, parent, callback, tooltip) {
  let btn = createButton(label);
  if(parent) btn.parent(parent);
  applyStyles(btn, STYLES.btn);
  if(callback) btn.mousePressed(callback);
  
  // Interactive States (JS Hover)
  btn.mouseOver(() => {
    btn.style('border-color', '#ccc');
    if(tooltip) showTooltip(btn, tooltip);
  });
  btn.mouseOut(() => {
    // Only reset border if not active (handled by specific functions)
    if(!btn.attribute('data-active')) btn.style('border-color', '#333');
    hideTooltip();
  });
  return btn;
}

function createToolBtn(label, parent, id) {
  let btn = createStyledBtn(label, parent, null, label);
  btn.attribute('data-id', id);
  uiRefs.toolBtns.push(btn);
  return btn;
}

function createBrushBtn(label, parent) {
  let btn = createStyledBtn(label, parent, () => {
    config.brush = label;
    setTool('brush');
    updateBrushStyles();
    updateToolStyles();
  }, label);
  btn.attribute('data-brush', label);
  uiRefs.brushBtns.push(btn);
  return btn;
}

// Manually update styles for active tools (replacing .active-tool class)
function updateToolStyles() {
  uiRefs.toolBtns.forEach(btn => {
     let id = btn.attribute('data-id');
     let isActive = (config.tool === id) || 
                    (id === 'eraser' && config.isEraser) || 
                    (id === 'mirror' && config.isMirror);
     
     if (isActive) applyStyles(btn, STYLES.btnActive);
     else applyStyles(btn, STYLES.btn);
     
     // Store active state for hover logic
     if(isActive) btn.attribute('data-active', 'true'); else btn.removeAttribute('data-active');
  });
}

function updateBrushStyles() {
  uiRefs.brushBtns.forEach(btn => {
     let isActive = (config.brush === btn.attribute('data-brush')) && (config.tool === 'brush');
     if (isActive) applyStyles(btn, STYLES.btnActive);
     else applyStyles(btn, STYLES.btn);
     
     if(isActive) btn.attribute('data-active', 'true'); else btn.removeAttribute('data-active');
  });
}

function setTool(t) { config.tool = t; }

function createLabel(txt, parent, isVertical) {
  let sp = createSpan(txt);
  if(parent) sp.parent(parent);
  if(isVertical) {
    sp.style('font-size','8px').style('font-weight','bold').style('writing-mode','vertical-rl').style('transform','rotate(180deg)').style('color','#4e4eff').style('opacity','0.7');
  } else {
    applyStyles(sp, STYLES.label);
  }
  return sp;
}

function createPropGroup(parent, children) {
  let g = createDiv('').parent(parent);
  g.style('display','flex').style('align-items','center').style('gap','8px').style('padding-right','15px').style('border-right','1px solid #333');
  children.forEach(c => c.parent(g));
}

function createSliderGroup(label, min, max, val, cb) {
  let wrapper = createDiv('').style('display','flex').style('flex-direction','column').style('width','80px');
  createSpan(label).parent(wrapper).style('font-size','9px').style('color','#888');
  let valSpan = createSpan(val).parent(wrapper).style('float','right').style('font-size','9px').style('color','#4e4eff').style('align-self','flex-end').style('margin-top','-12px');
  createSlider(min, max, val).parent(wrapper).style('width','100%').input(function() {
    cb(this.value());
    valSpan.html(this.value());
  });
  return wrapper;
}

function showTooltip(el, text) {
  uiRefs.tooltip.html(text);
  uiRefs.tooltip.style('display', 'block');
  let b = el.elt.getBoundingClientRect();
  uiRefs.tooltip.position(b.left, b.bottom + 5);
}
function hideTooltip() { uiRefs.tooltip.style('display', 'none'); }

// Timeline Logic
function renderTimeline() {
  uiRefs.timeline.html('');
  frames.forEach((f, idx) => {
    let cell = createDiv('').parent(uiRefs.timeline);
    let isActive = idx === currentFrameIdx;
    
    // Inline Cell Style
    cell.style('min-width','35px').style('height','35px').style('border','1px solid #333').style('border-radius','4px')
        .style('display','flex').style('flex-direction','column').style('align-items','center').style('justify-content','center')
        .style('cursor','pointer').style('position','relative')
        .style('background', '#111').style('color', '#ccc');

    if(isActive) cell.style('border-color','#4e4eff').style('color','#4e4eff').style('font-weight','bold');
    
    createDiv(idx+1).parent(cell).style('font-size','10px');
    createDiv(f.duration + 's').parent(cell).style('opacity','0.6').style('font-size','8px');

    cell.mousePressed(() => { currentFrameIdx = idx; selection=[]; updateTimelineUI(); renderTimeline(); });
    
    if (isActive && frames.length > 1) {
       let del = createDiv('×').parent(cell).style('position','absolute').style('top','0').style('right','2px').style('font-size','9px');
       del.mousePressed((e) => { e.stopPropagation(); deleteFrame(idx); });
    }
  });
}
function updateTimelineUI() { uiRefs.durationInput.value(frames[currentFrameIdx].duration); }
function addFrame() { frames.splice(currentFrameIdx+1,0,{strokes:[], duration:1}); currentFrameIdx++; renderTimeline(); }
function deleteFrame(idx) { frames.splice(idx,1); if(currentFrameIdx>=frames.length) currentFrameIdx=frames.length-1; renderTimeline(); }
function duplicateFrame() { let c = frames[currentFrameIdx]; frames.splice(currentFrameIdx+1, 0, { duration: c.duration, strokes: JSON.parse(JSON.stringify(c.strokes)) }); currentFrameIdx++; renderTimeline(); }

function exportGif() { 
  config.isPlaying = true; 
  if(uiRefs.playBtn) uiRefs.playBtn.html('⏹');
  isRecording = true; currentFrameIdx = 0; frameTimer = 0;
  saveGif('jitter-v13.gif', 3, { units: 'seconds' }); 
  setTimeout(() => { isRecording = false; }, 3500);
}

function rJ(v) { return random(-v, v); }
function drawStar(x,y,r1,r2,n) { let ang=TWO_PI/n; beginShape(); for(let a=0; a<TWO_PI; a+=ang) vertex(x+cos(a)*r2, y+sin(a)*r2), vertex(x+cos(a+ang/2)*r1, y+sin(a+ang/2)*r1); endShape(CLOSE); }
function togglePlay() { config.isPlaying=!config.isPlaying; uiRefs.playBtn.html(config.isPlaying?'⏹':'▶'); }
function mouseInCanvas() { return mouseX>0 && mouseX<width && mouseY>0 && mouseY<height; }