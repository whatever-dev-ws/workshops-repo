(function createAdvancedPaintApp() {
    // --- 1. CLEANUP & SETUP ---
    // Remove any existing toolbar/canvas from previous runs to prevent duplicates
    const existingToolbar = document.getElementById('js-paint-toolbar');
    const existingCanvas = document.getElementById('js-paint-canvas');
    if (existingToolbar) existingToolbar.remove();
    if (existingCanvas) existingCanvas.remove();

    // Body Styles
    document.body.style.margin = '0';
    document.body.style.overflow = 'hidden';
    document.body.style.backgroundColor = '#f0f0f0';
    document.body.style.fontFamily = 'Arial, sans-serif';

    // --- 2. CREATE CANVAS ---
    const canvas = document.createElement('canvas');
    canvas.id = 'js-paint-canvas';
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.display = 'block';
    canvas.style.backgroundColor = '#ffffff';
    canvas.style.cursor = 'crosshair';
    
    document.body.appendChild(canvas);

    // --- 3. STATE MANAGEMENT ---
    let painting = false;
    let brushColor = '#000000';
    let brushSize = 5;
    let isEraser = false;
    
    // Undo History
    let drawHistory = [];
    let historyStep = -1;

    function saveHistory() {
        historyStep++;
        // If we undo and draw new, remove "future" history
        if (historyStep < drawHistory.length) {
            drawHistory.length = historyStep;
        }
        drawHistory.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    }

    // Save initial blank canvas state
    saveHistory();

    // --- 4. TOOLBAR UI ---
    const toolbar = document.createElement('div');
    toolbar.id = 'js-paint-toolbar';
    Object.assign(toolbar.style, {
        position: 'fixed',
        top: '15px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: '#222',
        padding: '10px 20px',
        borderRadius: '12px',
        display: 'flex',
        gap: '12px',
        alignItems: 'center',
        boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
        zIndex: '10000',
        color: 'white',
        userSelect: 'none' // prevents highlighting text while clicking
    });
    document.body.appendChild(toolbar);

    // Helper: Create Styled Button
    function createButton(text, onClick, id) {
        const btn = document.createElement('button');
        btn.innerText = text;
        if(id) btn.id = id;
        Object.assign(btn.style, {
            padding: '8px 12px',
            cursor: 'pointer',
            border: 'none',
            borderRadius: '6px',
            backgroundColor: '#444',
            color: 'white',
            fontWeight: '600',
            fontSize: '13px',
            transition: 'all 0.2s ease',
            minWidth: '60px'
        });
        
        btn.onmouseenter = () => btn.style.backgroundColor = '#666';
        btn.onmouseleave = () => {
            // Keep active state visual if it matches current tool
            if (text === 'Brush' && !isEraser) btn.style.backgroundColor = '#007bff';
            else if (text === 'Eraser' && isEraser) btn.style.backgroundColor = '#007bff';
            else btn.style.backgroundColor = '#444';
        };
        
        btn.addEventListener('click', onClick);
        return btn;
    }

    // Helper: Update Button Styles (Visual feedback)
    function updateUI() {
        const brushBtn = document.getElementById('btn-brush');
        const eraserBtn = document.getElementById('btn-eraser');
        
        if (!isEraser) {
            brushBtn.style.backgroundColor = '#007bff'; // Active Blue
            eraserBtn.style.backgroundColor = '#444';
        } else {
            brushBtn.style.backgroundColor = '#444';
            eraserBtn.style.backgroundColor = '#007bff';
        }
    }

    // --- 5. CONTROLS ---

    // [Color Picker]
    const colorPicker = document.createElement('input');
    colorPicker.type = 'color';
    colorPicker.value = brushColor;
    Object.assign(colorPicker.style, {
        width: '35px',
        height: '35px',
        border: 'none',
        background: 'none',
        cursor: 'pointer'
    });
    colorPicker.addEventListener('input', (e) => {
        brushColor = e.target.value;
        isEraser = false;
        updateUI();
    });
    toolbar.appendChild(colorPicker);

    // [Size Label]
    const sizeLabel = document.createElement('span');
    sizeLabel.innerText = '5px';
    sizeLabel.style.fontSize = '12px';
    sizeLabel.style.minWidth = '35px';
    sizeLabel.style.textAlign = 'right';

    // [Size Slider]
    const sizeSlider = document.createElement('input');
    sizeSlider.type = 'range';
    sizeSlider.min = '1';
    sizeSlider.max = '50';
    sizeSlider.value = '5';
    Object.assign(sizeSlider.style, {
        width: '80px',
        cursor: 'pointer'
    });
    sizeSlider.addEventListener('input', (e) => {
        brushSize = e.target.value;
        sizeLabel.innerText = brushSize + 'px';
    });

    toolbar.appendChild(sizeSlider);
    toolbar.appendChild(sizeLabel);

    // [Brush Button]
    const btnBrush = createButton('Brush', () => {
        isEraser = false;
        updateUI();
    }, 'btn-brush');
    toolbar.appendChild(btnBrush);

    // [Eraser Button]
    const btnEraser = createButton('Eraser', () => {
        isEraser = true;
        updateUI();
    }, 'btn-eraser');
    toolbar.appendChild(btnEraser);

    // [Undo Button]
    const btnUndo = createButton('Undo', () => {
        if (historyStep > 0) {
            historyStep--;
            ctx.putImageData(drawHistory[historyStep], 0, 0);
        }
    });
    toolbar.appendChild(btnUndo);

    // [Save Button]
    const btnSave = createButton('Save', () => {
        const link = document.createElement('a');
        link.download = 'my-drawing.png';
        link.href = canvas.toDataURL();
        link.click();
    });
    btnSave.style.backgroundColor = '#28a745'; // Green for save
    toolbar.appendChild(btnSave);


    // --- 6. DRAWING LOGIC ---

    function startPosition(e) {
        painting = true;
        draw(e);
    }

    function endPosition() {
        if (!painting) return;
        painting = false;
        ctx.beginPath();
        saveHistory(); // Save state after every stroke
    }

    function draw(e) {
        if (!painting) return;

        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round'; // Smoother turns
        
        if (isEraser) {
            ctx.strokeStyle = '#ffffff'; 
        } else {
            ctx.strokeStyle = brushColor;
        }

        ctx.lineTo(e.clientX, e.clientY);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(e.clientX, e.clientY);
    }

    // --- 7. EVENT LISTENERS ---

    // Mouse
    canvas.addEventListener('mousedown', startPosition);
    canvas.addEventListener('mouseup', endPosition);
    canvas.addEventListener('mousemove', draw);
    
    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
        if (e.key.toLowerCase() === 'z' && (e.ctrlKey || e.metaKey)) {
            // Undo (Ctrl+Z)
            if (historyStep > 0) {
                historyStep--;
                ctx.putImageData(drawHistory[historyStep], 0, 0);
            }
        }
        if (e.key.toLowerCase() === 'e') {
            isEraser = true;
            updateUI();
        }
        if (e.key.toLowerCase() === 'b') {
            isEraser = false;
            updateUI();
        }
    });

    // Resize Handling
    window.addEventListener('resize', () => {
        // When resizing, we lose the canvas context, so we redraw the last history state
        const currentData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        ctx.putImageData(currentData, 0, 0);
    });

    // Initialize UI active states
    updateUI();

})();