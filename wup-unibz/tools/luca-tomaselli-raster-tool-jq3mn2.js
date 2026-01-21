(function createFunnyRasterApp() {
    // --- 1. CLEANUP ---
    const ids = ['js-raster-toolbar', 'js-raster-canvas'];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.remove();
    });

    // --- 2. SETUP ---
    document.body.style.margin = '0';
    document.body.style.overflow = 'hidden';
    document.body.style.backgroundColor = '#222';

    const canvas = document.createElement('canvas');
    canvas.id = 'js-raster-canvas';
    const ctx = canvas.getContext('2d');
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.display = 'block';
    canvas.style.backgroundColor = '#ffffff';
    canvas.style.cursor = 'crosshair';
    document.body.appendChild(canvas);

    // --- 3. STATE ---
    let painting = false;
    let brushSize = 10;
    
    // Funny Modes
    let isRainbow = false;
    let isJitter = false;
    let isMirror = false;
    let isEmoji = false;

    // Internal State
    let hue = 0;
    let lastX = 0;
    let lastY = 0;
    
    const emojis = ['😂','🤡','🔥','👻','💩','👽','🤖','🦄','🍕','🌵'];

    // --- 4. TOOLBAR UI ---
    const toolbar = document.createElement('div');
    toolbar.id = 'js-raster-toolbar';
    Object.assign(toolbar.style, {
        position: 'fixed',
        top: '15px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: '#333',
        padding: '10px 20px',
        borderRadius: '12px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '10px',
        alignItems: 'center',
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
        zIndex: '10000',
        color: 'white',
        fontFamily: 'Arial, sans-serif'
    });
    document.body.appendChild(toolbar);

    // --- 5. UI BUTTON GENERATOR ---
    function createToggle(text, color, onClick) {
        const btn = document.createElement('button');
        btn.innerText = text;
        Object.assign(btn.style, {
            padding: '8px 12px',
            cursor: 'pointer',
            border: 'none',
            borderRadius: '4px',
            backgroundColor: '#555',
            color: 'white',
            fontWeight: 'bold',
            transition: '0.2s'
        });
        
        btn.onclick = () => {
            const isActive = onClick();
            btn.style.backgroundColor = isActive ? color : '#555';
            btn.style.transform = isActive ? 'scale(1.05)' : 'scale(1)';
        };
        return btn;
    }

    // --- 6. ADD BUTTONS ---

    // 🌈 Rainbow
    toolbar.appendChild(createToggle('🌈 Rainbow', '#e91e63', () => {
        isRainbow = !isRainbow;
        if(isRainbow) isEmoji = false; // mutually exclusive
        return isRainbow;
    }));

    // ☕ Caffeine
    toolbar.appendChild(createToggle('☕ Caffeine', '#d35400', () => {
        isJitter = !isJitter;
        return isJitter;
    }));

    // 🦋 Mirror
    toolbar.appendChild(createToggle('🦋 Mirror', '#9b59b6', () => {
        isMirror = !isMirror;
        return isMirror;
    }));

    // 🤮 Emoji
    toolbar.appendChild(createToggle('🤮 Emoji', '#27ae60', () => {
        isEmoji = !isEmoji;
        if(isEmoji) isRainbow = false; // mutually exclusive
        return isEmoji;
    }));

    // Separator
    const sep = document.createElement('div');
    sep.style.width = '1px'; sep.style.height = '25px'; sep.style.background = '#666';
    toolbar.appendChild(sep);

    // Clear
    const btnClear = document.createElement('button');
    btnClear.innerText = '🗑️ Clear';
    Object.assign(btnClear.style, {
        padding: '8px 12px', cursor: 'pointer', border: 'none', borderRadius: '4px',
        backgroundColor: '#c0392b', color: 'white', fontWeight: 'bold'
    });
    btnClear.onclick = () => ctx.clearRect(0, 0, canvas.width, canvas.height);
    toolbar.appendChild(btnClear);


    // --- 7. DRAWING LOGIC ---

    function startPosition(e) {
        painting = true;
        lastX = e.clientX;
        lastY = e.clientY;
        draw(e);
    }

    function endPosition() {
        painting = false;
        ctx.beginPath();
    }

    function draw(e) {
        if (!painting) return;

        let targetX = e.clientX;
        let targetY = e.clientY;

        // FEATURE: CAFFEINE (Jitter)
        if (isJitter) {
            targetX += (Math.random() - 0.5) * 50; // Shake x
            targetY += (Math.random() - 0.5) * 50; // Shake y
        }

        // PREPARE COLOR
        if (isRainbow) {
            hue = (hue + 5) % 360;
            ctx.strokeStyle = `hsl(${hue}, 100%, 50%)`;
            ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
        } else {
            ctx.strokeStyle = '#000';
            ctx.fillStyle = '#000';
        }

        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';

        // EXECUTE DRAWING (Handle Mirror Logic)
        const coords = [{x: targetX, y: targetY, lx: lastX, ly: lastY}];
        
        // FEATURE: MIRROR (Kaleidoscope)
        if (isMirror) {
            const w = canvas.width;
            const h = canvas.height;
            // Mirror X
            coords.push({x: w - targetX, y: targetY, lx: w - lastX, ly: lastY});
            // Mirror Y
            coords.push({x: targetX, y: h - targetY, lx: lastX, ly: h - lastY});
            // Mirror XY
            coords.push({x: w - targetX, y: h - targetY, lx: w - lastX, ly: h - lastY});
        }

        coords.forEach(c => {
            if (isEmoji) {
                // FEATURE: EMOJI VOMIT
                // Throttle emojis slightly so it's not a solid bar of color
                if (Math.random() > 0.5) {
                    ctx.font = `${brushSize * 3}px Arial`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
                    ctx.fillText(randomEmoji, c.x, c.y);
                }
            } else {
                // STANDARD LINE
                ctx.beginPath();
                ctx.moveTo(c.lx, c.ly);
                ctx.lineTo(c.x, c.y);
                ctx.stroke();
            }
        });

        // Update last positions for the next frame
        lastX = targetX;
        lastY = targetY;
        
        // If jitter is on, we don't want the line to connect perfectly back to the jittered point
        // or it creates a weird zig zag. We reset to actual mouse for continuity if jitter is off,
        // but for jitter we embrace the chaos.
        if (isJitter) {
            lastX = e.clientX;
            lastY = e.clientY;
        }
    }

    // --- 8. EVENTS ---
    canvas.addEventListener('mousedown', startPosition);
    canvas.addEventListener('mouseup', endPosition);
    canvas.addEventListener('mousemove', draw);
    
    // Resize Handle
    window.addEventListener('resize', () => {
        const img = ctx.getImageData(0,0, canvas.width, canvas.height);
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        ctx.putImageData(img, 0, 0);
    });

})();