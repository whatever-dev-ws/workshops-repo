(function createFunnyTypographyApp() {
    // --- 1. CLEANUP ---
    const ids = ['js-fun-toolbar', 'js-fun-canvas'];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.remove();
    });

    // --- 2. SETUP ---
    document.body.style.margin = '0';
    document.body.style.overflow = 'hidden';
    document.body.style.backgroundColor = '#222';

    const canvas = document.createElement('canvas');
    canvas.id = 'js-fun-canvas';
    const ctx = canvas.getContext('2d');
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.display = 'block';
    canvas.style.backgroundColor = '#ffffff';
    canvas.style.cursor = 'text';
    document.body.appendChild(canvas);

    // --- 3. STATE ---
    // User Settings
    let textContent = "Funny Text";
    let fontSize = 40;
    let fontColor = "#000000";
    let fontFamily = "Arial";
    
    // Modes
    let isClownMode = false;
    let isGravityMode = false;

    // Physics Engine Data
    let fallingWords = []; 
    let staticImage = null; // Stores the permanent drawing

    // --- 4. TOOLBAR UI ---
    const toolbar = document.createElement('div');
    toolbar.id = 'js-fun-toolbar';
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

    // --- 5. UI HELPERS ---
    function createSep() {
        const s = document.createElement('div');
        s.style.width = '1px'; s.style.height = '25px'; s.style.background = '#555';
        toolbar.appendChild(s);
    }

    // --- 6. STANDARD CONTROLS ---
    
    // Text Input
    const input = document.createElement('input');
    input.value = textContent;
    Object.assign(input.style, { padding: '8px', borderRadius: '4px', border: 'none', width: '120px' });
    input.addEventListener('input', (e) => textContent = e.target.value);
    toolbar.appendChild(input);

    // Color
    const colorPicker = document.createElement('input');
    colorPicker.type = 'color';
    colorPicker.value = fontColor;
    Object.assign(colorPicker.style, { width: '30px', height: '30px', border: 'none', background: 'none', cursor: 'pointer' });
    colorPicker.addEventListener('input', (e) => fontColor = e.target.value);
    toolbar.appendChild(colorPicker);

    createSep();

    // --- 7. FUNNY FEATURE 1: SpongeBobify ---
    const btnSponge = document.createElement('button');
    btnSponge.innerText = '🤪 Mock';
    btnSponge.title = "Make text mOcKiNg";
    Object.assign(btnSponge.style, {
        padding: '8px 12px', cursor: 'pointer', border: 'none', borderRadius: '4px',
        backgroundColor: '#f1c40f', color: '#000', fontWeight: 'bold'
    });
    btnSponge.onclick = () => {
        // The logic: alternate caps
        let newText = "";
        for(let i=0; i<textContent.length; i++) {
            newText += Math.random() > 0.5 ? textContent[i].toUpperCase() : textContent[i].toLowerCase();
        }
        textContent = newText;
        input.value = newText;
    };
    toolbar.appendChild(btnSponge);

    // --- 8. FUNNY FEATURE 2: Clown Mode ---
    const btnClown = document.createElement('button');
    btnClown.innerText = '🤡 Clown Mode: OFF';
    Object.assign(btnClown.style, {
        padding: '8px 12px', cursor: 'pointer', border: 'none', borderRadius: '4px',
        backgroundColor: '#444', color: 'white', fontWeight: 'bold'
    });
    btnClown.onclick = () => {
        isClownMode = !isClownMode;
        btnClown.innerText = isClownMode ? '🤡 Clown Mode: ON' : '🤡 Clown Mode: OFF';
        btnClown.style.backgroundColor = isClownMode ? '#e74c3c' : '#444';
        
        // Disable Gravity if Clown is on to avoid chaos overload
        if(isClownMode && isGravityMode) btnGravity.click(); 
    };
    toolbar.appendChild(btnClown);

    // --- 9. FUNNY FEATURE 3: Gravity ---
    const btnGravity = document.createElement('button');
    btnGravity.innerText = '🪐 Gravity: OFF';
    Object.assign(btnGravity.style, {
        padding: '8px 12px', cursor: 'pointer', border: 'none', borderRadius: '4px',
        backgroundColor: '#444', color: 'white', fontWeight: 'bold'
    });
    btnGravity.onclick = () => {
        isGravityMode = !isGravityMode;
        btnGravity.innerText = isGravityMode ? '🪐 Gravity: ON' : '🪐 Gravity: OFF';
        btnGravity.style.backgroundColor = isGravityMode ? '#9b59b6' : '#444';
        
        // Disable Clown if Gravity is on
        if(isGravityMode && isClownMode) btnClown.click();
    };
    toolbar.appendChild(btnGravity);

    createSep();

    // Clear Button
    const btnClear = document.createElement('button');
    btnClear.innerText = 'Clear';
    Object.assign(btnClear.style, {
        padding: '8px 12px', cursor: 'pointer', border: 'none', borderRadius: '4px',
        backgroundColor: '#dc3545', color: 'white'
    });
    btnClear.onclick = () => {
        fallingWords = [];
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        staticImage = ctx.getImageData(0,0, canvas.width, canvas.height);
    };
    toolbar.appendChild(btnClear);

    // --- 10. ANIMATION LOOP (Required for Gravity) ---
    // Save initial blank state
    staticImage = ctx.getImageData(0,0, canvas.width, canvas.height);

    function loop() {
        // 1. Clear Screen
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 2. Draw Static Layer (The permanent text)
        if (staticImage) {
            ctx.putImageData(staticImage, 0, 0);
        }

        // 3. Update & Draw Falling Words
        for (let i = 0; i < fallingWords.length; i++) {
            let word = fallingWords[i];
            
            // Physics
            word.dy += 0.5; // Gravity
            word.x += word.dx;
            word.y += word.dy;

            // Bounce Floor
            if (word.y > canvas.height - 20) {
                word.y = canvas.height - 20;
                word.dy *= -0.6; // Lose energy
            }
            // Bounce Walls
            if (word.x > canvas.width || word.x < 0) {
                word.dx *= -1;
            }

            // Draw
            ctx.font = word.font;
            ctx.fillStyle = word.color;
            ctx.fillText(word.text, word.x, word.y);
        }

        requestAnimationFrame(loop);
    }
    loop(); // Start loop

    // --- 11. INTERACTION LOGIC ---
    canvas.addEventListener('mousedown', (e) => {
        let useSize = fontSize;
        let useColor = fontColor;
        let useFont = fontFamily;
        let useText = textContent;

        // LOGIC: CLOWN MODE
        if (isClownMode) {
            const colors = ['red', 'blue', 'green', 'purple', 'orange', 'pink', 'lime'];
            const fonts = ['Comic Sans MS', 'Impact', 'Courier New', 'Arial'];
            useColor = colors[Math.floor(Math.random() * colors.length)];
            useFont = fonts[Math.floor(Math.random() * fonts.length)];
            useSize = Math.floor(Math.random() * 80) + 20;
            
            // Screen Shake Effect
            canvas.style.transform = `translate(${Math.random()*10-5}px, ${Math.random()*10-5}px)`;
            setTimeout(() => canvas.style.transform = 'translate(0,0)', 50);
        }

        const fontString = `bold ${useSize}px ${useFont}`;
        ctx.font = fontString;
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';

        // LOGIC: GRAVITY MODE
        if (isGravityMode) {
            fallingWords.push({
                text: useText,
                x: e.clientX,
                y: e.clientY,
                font: fontString,
                color: useColor,
                dx: (Math.random() - 0.5) * 10, // Random horizontal toss
                dy: -5 // Toss up slightly first
            });
        } else {
            // STANDARD STAMP
            ctx.fillStyle = useColor;
            ctx.fillText(useText, e.clientX, e.clientY);
            // Save this to the static layer so it doesn't get wiped by the animation loop
            staticImage = ctx.getImageData(0,0, canvas.width, canvas.height);
        }
    });
    
    // Resize Handler
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        if(staticImage) ctx.putImageData(staticImage, 0, 0);
    });

})();