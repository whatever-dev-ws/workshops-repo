// VARIABLES
let symmetry = 8;
let angle = 360 / symmetry;
let x = 1; // For rainbow cycle
let canvas, ctx, drawingBuffer, bufferCtx;
let mouseIsPressed = false;
let prevMouseX = 0, prevMouseY = 0;

// UI Elements
let symmetrySlider, sizeSlider;
let clearBtn, saveBtn;
let colorPicker, rainbowCheckbox, bgSelect;
let axesLabel, brushLabel;

function init() {
  setupCanvas();
  // addStyles(); // REMOVED: Incompatible with tool viewer
  createUI();
  updateLabels();
  setupEventListeners();
  animate();
}

// Helper to apply inline styles (Replaces CSS classes)
function setStyles(element, styles) {
  for (const property in styles) {
    element.style[property] = styles[property];
  }
}

function setupCanvas() {
  canvas = document.createElement('canvas');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  
  setStyles(canvas, {
    position: 'fixed',
    top: '0',
    left: '0',
    zIndex: '1'
  });

  document.body.appendChild(canvas);
  ctx = canvas.getContext('2d');
  
  // Create drawing buffer
  drawingBuffer = document.createElement('canvas');
  drawingBuffer.width = window.innerWidth;
  drawingBuffer.height = window.innerHeight;
  bufferCtx = drawingBuffer.getContext('2d');
}

function setupEventListeners() {
  setStyles(document.body, {
    margin: '0',
    padding: '0',
    overflow: 'hidden',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
  });

  canvas.addEventListener('mousedown', (e) => {
    mouseIsPressed = true;
    prevMouseX = e.clientX;
    prevMouseY = e.clientY;
  });
  
  canvas.addEventListener('mouseup', () => {
    mouseIsPressed = false;
  });
  
  canvas.addEventListener('mouseleave', () => {
    mouseIsPressed = false;
  });
  
  canvas.addEventListener('mousemove', (e) => {
    // Prevent drawing over UI (approximate height of panel)
    if (mouseIsPressed && e.clientY < window.innerHeight - 120) {
      drawSymmetric(e.clientX, e.clientY, prevMouseX, prevMouseY);
    }
    prevMouseX = e.clientX;
    prevMouseY = e.clientY;
  });
  
  window.addEventListener('resize', handleResize);
}

function drawSymmetric(mouseX, mouseY, pmouseX, pmouseY) {
  let mx = mouseX - canvas.width / 2;
  let my = mouseY - canvas.height / 2;
  let pmx = pmouseX - canvas.width / 2;
  let pmy = pmouseY - canvas.height / 2;
  
  bufferCtx.save();
  bufferCtx.translate(canvas.width / 2, canvas.height / 2);
  
  if (rainbowCheckbox.checked) {
    bufferCtx.strokeStyle = hsbToRgb(x, 0.9, 1);
    x = (x + 3) % 360;
  } else {
    bufferCtx.strokeStyle = colorPicker.value;
  }
  
  bufferCtx.lineWidth = sizeSlider.value;
  bufferCtx.lineCap = 'round';
  
  for (let i = 0; i < symmetry; i++) {
    bufferCtx.rotate((angle * Math.PI) / 180);
    bufferCtx.beginPath();
    bufferCtx.moveTo(pmx, pmy);
    bufferCtx.lineTo(mx, my);
    bufferCtx.stroke();
    
    bufferCtx.save();
    bufferCtx.scale(1, -1);
    bufferCtx.beginPath();
    bufferCtx.moveTo(pmx, pmy);
    bufferCtx.lineTo(mx, my);
    bufferCtx.stroke();
    bufferCtx.restore();
  }
  
  bufferCtx.restore();
}

function animate() {
  draw();
  requestAnimationFrame(animate);
}

function draw() {
  let bgMode = bgSelect.value;
  
  if (bgMode === 'transparent') {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  } else if (bgMode === 'black') {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  
  ctx.drawImage(drawingBuffer, 0, 0);
  drawCenterGuide();
  
  symmetry = parseInt(symmetrySlider.value);
  angle = 360 / symmetry;
}

function drawCenterGuide() {
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  
  let bgMode = bgSelect.value;
  if (bgMode === 'white') {
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
  } else {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  }
  
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(0, 0, 10, 0, Math.PI * 2);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(-15, 0);
  ctx.lineTo(15, 0);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(0, -15);
  ctx.lineTo(0, 15);
  ctx.stroke();
  
  ctx.restore();
}

function createUI() {
  let controls = document.createElement('div');
  
  // Apply "glass-panel" styles inline
  setStyles(controls, {
    position: 'fixed',
    bottom: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    gap: '20px',
    padding: '15px 25px',
    backgroundColor: 'rgba(40, 40, 40, 0.65)',
    backdropFilter: 'blur(20px)',
    webkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '24px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
    color: 'white',
    zIndex: '1000',
    alignItems: 'flex-start'
  });
  
  document.body.appendChild(controls);

  // SYMMETRY
  let symGroup = createControlGroup(controls, 'Simmetria');
  axesLabel = createValueDisplay(symGroup, '8 ASSI');
  symmetrySlider = createSlider(symGroup, 2, 32, 8, 1);
  symmetrySlider.addEventListener('input', updateLabels);

  // BRUSH
  let brushGroup = createControlGroup(controls, 'Pennello');
  brushLabel = createValueDisplay(brushGroup, '4 px');
  sizeSlider = createSlider(brushGroup, 1, 40, 4, 1);
  sizeSlider.addEventListener('input', updateLabels);

  // COLOR
  let colorGroup = createControlGroup(controls);
  colorPicker = document.createElement('input');
  colorPicker.type = 'color';
  colorPicker.value = '#00C7BE';
  setStyles(colorPicker, {
    border: 'none',
    background: 'none',
    width: '50px',
    height: '35px',
    cursor: 'pointer',
    borderRadius: '8px'
  });
  colorGroup.appendChild(colorPicker);
  
  let rainbowDiv = document.createElement('div');
  setStyles(rainbowDiv, {
    display: 'flex',
    alignItems: 'center',
    marginTop: '5px'
  });
  colorGroup.appendChild(rainbowDiv);
  
  rainbowCheckbox = document.createElement('input');
  rainbowCheckbox.type = 'checkbox';
  rainbowCheckbox.style.cursor = 'pointer';
  rainbowDiv.appendChild(rainbowCheckbox);
  
  let rainbowLabel = document.createElement('span');
  rainbowLabel.textContent = 'Rainbow';
  setStyles(rainbowLabel, {
    marginLeft: '5px',
    fontSize: '12px'
  });
  rainbowDiv.appendChild(rainbowLabel);

  // BACKGROUND
  let bgGroup = createControlGroup(controls, 'Sfondo');
  bgSelect = document.createElement('select');
  setStyles(bgSelect, {
    width: '100%',
    padding: '8px',
    background: 'rgba(0, 0, 0, 0.3)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    color: 'white',
    fontSize: '12px',
    outline: 'none',
    cursor: 'pointer'
  });
  
  ['Black', 'White', 'Transparent'].forEach((opt, i) => {
    let option = document.createElement('option');
    option.value = ['black', 'white', 'transparent'][i];
    option.textContent = opt;
    bgSelect.appendChild(option);
  });
  bgGroup.appendChild(bgSelect);

  // ACTIONS
  let actionGroup = createControlGroup(controls);
  // Remove border from last group manually
  actionGroup.style.borderRight = 'none';
  
  let btnRow = document.createElement('div');
  setStyles(btnRow, {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  });
  actionGroup.appendChild(btnRow);
  
  // Create Destructive Button
  clearBtn = createButton(btnRow, 'Pulisci', '#FF3B30', 'rgba(255, 59, 48, 0.2)');
  clearBtn.addEventListener('click', clearCanvas);
  
  // Create Primary Button
  saveBtn = createButton(btnRow, 'Export PNG', '#ffffff', '#007AFF');
  saveBtn.addEventListener('click', exportArt);
}

function createControlGroup(parent, title) {
  let group = document.createElement('div');
  setStyles(group, {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
    minWidth: '100px',
    borderRight: '1px solid rgba(255,255,255,0.1)',
    paddingRight: '20px'
  });
  parent.appendChild(group);
  
  if (title) {
    let label = document.createElement('span');
    label.textContent = title;
    setStyles(label, {
      fontSize: '10px',
      textTransform: 'uppercase',
      letterSpacing: '1px',
      color: 'rgba(255,255,255,0.5)',
      marginBottom: '2px'
    });
    group.appendChild(label);
  }
  
  return group;
}

function createValueDisplay(parent, text) {
  let span = document.createElement('span');
  span.textContent = text;
  setStyles(span, {
    fontSize: '18px',
    fontWeight: '600',
    marginBottom: '5px',
    color: '#fff'
  });
  parent.appendChild(span);
  return span;
}

function createSlider(parent, min, max, value, step) {
  let slider = document.createElement('input');
  slider.type = 'range';
  slider.min = min;
  slider.max = max;
  slider.value = value;
  slider.step = step;
  
  // Basic inline styling for slider
  setStyles(slider, {
    width: '100%',
    cursor: 'pointer',
    background: 'rgba(255,255,255,0.2)',
    borderRadius: '2px',
    height: '4px',
    appearance: 'none',
    WebkitAppearance: 'none'
  });
  
  parent.appendChild(slider);
  return slider;
}

function createButton(parent, text, textColor, bgColor) {
  let btn = document.createElement('button');
  btn.textContent = text;
  
  const baseStyle = {
    border: 'none',
    padding: '8px 16px',
    borderRadius: '12px',
    fontWeight: '500',
    cursor: 'pointer',
    fontSize: '12px',
    transition: 'transform 0.2s ease, opacity 0.2s ease',
    color: textColor,
    backgroundColor: bgColor
  };
  
  setStyles(btn, baseStyle);
  
  // Replicating :hover using event listeners
  btn.addEventListener('mouseenter', () => {
    btn.style.transform = 'scale(1.05)';
    btn.style.opacity = '0.9';
  });
  
  btn.addEventListener('mouseleave', () => {
    btn.style.transform = 'scale(1)';
    btn.style.opacity = '1';
  });

  parent.appendChild(btn);
  return btn;
}

function updateLabels() {
  axesLabel.textContent = symmetrySlider.value + ' ASSI';
  brushLabel.textContent = sizeSlider.value + ' px';
}

function clearCanvas() {
  bufferCtx.clearRect(0, 0, drawingBuffer.width, drawingBuffer.height);
}

function exportArt() {
  let exportScale = 2;
  let exportCanvas = document.createElement('canvas');
  exportCanvas.width = canvas.width * exportScale;
  exportCanvas.height = canvas.height * exportScale;
  let exportCtx = exportCanvas.getContext('2d');
  
  let bgMode = bgSelect.value;
  if (bgMode === 'transparent') {
    exportCtx.clearRect(0, 0, exportCanvas.width, exportCanvas.height);
  } else if (bgMode === 'black') {
    exportCtx.fillStyle = '#000000';
    exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
  } else {
    exportCtx.fillStyle = '#ffffff';
    exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
  }
  
  exportCtx.drawImage(drawingBuffer, 0, 0, exportCanvas.width, exportCanvas.height);
  
  let now = new Date();
  let timestamp = `${now.getFullYear()}-${now.getMonth()+1}-${now.getDate()}_${now.getHours()}${now.getMinutes()}`;
  
  exportCanvas.toBlob((blob) => {
    let url = URL.createObjectURL(blob);
    let a = document.createElement('a');
    a.href = url;
    a.download = `mandala_${timestamp}.png`;
    a.click();
    URL.revokeObjectURL(url);
  });
}

function handleResize() {
  let oldBuffer = bufferCtx.getImageData(0, 0, drawingBuffer.width, drawingBuffer.height);
  
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  drawingBuffer.width = window.innerWidth;
  drawingBuffer.height = window.innerHeight;
  
  bufferCtx.putImageData(oldBuffer, 0, 0);
}

function hsbToRgb(h, s, v) {
  let c = v * s;
  let x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  let m = v - c;
  let r, g, b;
  
  if (h >= 0 && h < 60) { r = c; g = x; b = 0; }
  else if (h >= 60 && h < 120) { r = x; g = c; b = 0; }
  else if (h >= 120 && h < 180) { r = 0; g = c; b = x; }
  else if (h >= 180 && h < 240) { r = 0; g = x; b = c; }
  else if (h >= 240 && h < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }
  
  return `rgb(${Math.round((r + m) * 255)}, ${Math.round((g + m) * 255)}, ${Math.round((b + m) * 255)})`;
}

// Initialize on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}