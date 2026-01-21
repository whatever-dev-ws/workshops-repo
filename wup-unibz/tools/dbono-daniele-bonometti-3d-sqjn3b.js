// WUP 2025-26
// Daniele Bonometti
// Optimization for Tool Viewer Compatibility by Gemini

let modello3D;
let font;
let fontCaricato = false; 
let avviato = false; 
let pulsanteAvvio;   

// Variabili Tempo
let ultimoMinuto = -1;
let ultimoSecondo = -1;
let ultimoStato = -1; 

// Variabili Visual
let coloreSfondo;
let angoloRotazione = 0;
let indiceEffetto = 0; 

// --- VARIABILI GIOCHI GENERALI ---
let gameInitialized = false;
let gameInstructionsStartTime = 0; 
let victoryTime = 0; 
let audioCtx;

// --- VARIABILI BONUS ROUND ---
let bonusButtons = [];
let bonusPhaseActive = false;
let bonusPhaseDone = false; 

// --- VARIABILI MENU ---
let debugMode = false;       
let forcedGameIndex = -1;     
let debugStartTime = 0;       
let divMenuDebug;             
let btnToggleMenu;            
let menuAperto = false;        
let divMenuCentrale;
let menuCentraleVisibile = false;
let menuCentraleStartTime = 0; 
let targetSecretPos;
let targetSecretVel;
let timedGameDuration = 0;

// Variabili GIOCO 1 (Laser)
let bersagli = []; 
let laserColor; 
let laserProjectiles = []; 
let lastShotTime = 0; 

// Variabili GIOCO 2 (Palline)
let palline = [];
let cannonAngle = 0;

// Variabili GIOCO 3 (Snake)
let snakePos;
let snakeVel;
let snakeTail = [];
let foodPos;
let snakeSpeed = 4; 
let snakeTargetLength = 20; 
let snakeGameOver = false; 
let snakeGameOverStart = 0;

// GIOCO 4: Breakout
let paddleX = 0;
let bricks = [];
let breakoutGameOver = false;
let breakoutGameOverStart = 0;
let breakoutBalls = [];
let breakoutWin = false;
let breakoutWinTime = 0; 
let breakoutFlags = { threeLeft: false, twoLeft: false };

// GIOCO 5: Pacman 3D
let pacmanCellSize = 30; 
let pacmanGrid = [];
let pacmanRows = 15;
let pacmanCols = 15;
let pacmanPlayerPos; 
let pacmanGhosts = [];
let pacmanScore = 0;
let pacmanTotalDots = 0;
let pacmanGameOver = false;
let pacmanWin = false;
let pacmanNextDir; 

// GIOCO 6: Labirinto (Maze)
let mazeGrid = [];
let mazeCols = 0;
let mazeRows = 0;
let mazeCellSize = 20; 
let mazePlayerPos; 
let mazeExitPos;
let mazeWin = false;
let mazePlayerRadius = 6; 
let mazeGameOver = false;
let mazeGameOverStart = 0;

// GIOCO 7: Tilt Table
let tiltBallPos;
let tiltBallVel;
let tiltTableRot = {x: 0, y: 0};
let tiltHoles = [];
let tiltGoal;
let tiltGameOver = false;
let tiltWin = false;

function preload() {
    try {
        // Note: If F.obj is not in the viewer environment, the code handles the error gracefully
        modello3D = loadModel('F.obj', true, 
            () => console.log("Modello caricato"), 
            (err) => console.log("No model found, using fallback")
        );
    } catch (e) {}

    loadFont('https://cdnjs.cloudflare.com/ajax/libs/topcoat/0.8.0/font/SourceCodePro-Bold.otf', 
        (f) => { font = f; fontCaricato = true; },
        () => { console.log("Font error"); }
    );
}

function setup() {
    createCanvas(windowWidth, windowHeight, WEBGL);
    coloreSfondo = color(220);
    ultimoMinuto = minute();
    ultimoSecondo = second();
    laserColor = color(255, 0, 0);

    pulsanteAvvio = createButton("This is not a button");
    configuraPulsante(); 
    pulsanteAvvio.mousePressed(entraNelCanvas);

    creaMenuDebug();    
    creaMenuCentrale(); 

    targetSecretPos = createVector(0, 0, -200);
    targetSecretVel = createVector(5, 5, 0); 

    if (fontCaricato) {
        textFont(font);
        textSize(32);
    }
}

// --- AUDIO FUNCTIONS ---
function suonaLaser() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain();
    osc.type = 'sawtooth'; osc.frequency.setValueAtTime(1200, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
    osc.connect(gain); gain.connect(audioCtx.destination); osc.start(); osc.stop(audioCtx.currentTime + 0.2);
}
function suonaPop() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain();
    osc.type = 'square'; osc.frequency.setValueAtTime(200, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
    osc.connect(gain); gain.connect(audioCtx.destination); osc.start(); osc.stop(audioCtx.currentTime + 0.1);
}
function suonaRandom() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain();
    osc.type = random(['sawtooth', 'square', 'triangle']); 
    osc.frequency.setValueAtTime(random(100, 800), audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(random(50, 200), audioCtx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
    osc.connect(gain); gain.connect(audioCtx.destination); osc.start(); osc.stop(audioCtx.currentTime + 0.1);
}

// --- MENU & INTERFACCIA ---

function creaMenuCentrale() {
    divMenuCentrale = createDiv('');
    // Use individual .style calls for clarity and compatibility
    divMenuCentrale.style('position', 'fixed');
    divMenuCentrale.style('top', '50%');
    divMenuCentrale.style('left', '50%');
    divMenuCentrale.style('transform', 'translate(-50%, -50%)');
    divMenuCentrale.style('background', 'rgba(0, 0, 0, 0.95)');
    divMenuCentrale.style('border', '4px solid gold');
    divMenuCentrale.style('border-radius', '15px');
    divMenuCentrale.style('padding', '20px');
    divMenuCentrale.style('text-align', 'center');
    divMenuCentrale.style('z-index', '10001'); 
    divMenuCentrale.style('max-height', '80vh');
    divMenuCentrale.style('overflow-y', 'auto');
    divMenuCentrale.hide();

    let title = createDiv('SEGRETO SBLOCCATO!<br>SCEGLI UN GIOCO (1 MINUTO)');
    title.parent(divMenuCentrale);
    title.style('color', 'gold');
    title.style('font-family', 'monospace');
    title.style('font-size', '20px');
    title.style('margin-bottom', '15px');
    title.style('font-weight', 'bold');

    // CSS String for Inline Styles
    let styleBtn = 'display:block; margin:5px auto; padding:8px; width:180px; background:#222; color:white; border:1px solid #555; cursor:pointer; font-family:monospace; font-size:14px; border-radius:5px;';

    let games = ["⌚ OROLOGIO", "🔫 LASER", "🔵 BALLS", "🐍 SNAKE", "🧱 BREAKOUT", "👻 PACMAN 3D", "🧩 LABIRINTO", "⚖️ TILT TABLE"];
    
    for(let i=-1; i<7; i++) {
        let btn = createButton(games[i+1]);
        btn.parent(divMenuCentrale);
        // FIX: Use .attribute('style', ...) to inject the full CSS string inline
        btn.attribute('style', styleBtn);
        
        // Hover effects via JS events as per guidelines
        btn.mouseOver(() => btn.style('background', '#444'));
        btn.mouseOut(() => btn.style('background', '#222'));
        
        btn.mousePressed(() => { selezionaDaMenuCentrale(i); });
    }
    
    let btnChiudi = createButton('CHIUDI');
    btnChiudi.parent(divMenuCentrale);
    // Apply base style
    btnChiudi.attribute('style', styleBtn);
    // Override specific props
    btnChiudi.style('background', '#500');
    btnChiudi.style('margin-top', '15px');
    
    btnChiudi.mouseOver(() => btnChiudi.style('background', '#700'));
    btnChiudi.mouseOut(() => btnChiudi.style('background', '#500'));

    btnChiudi.mousePressed(() => { divMenuCentrale.hide(); menuCentraleVisibile = false; window.focus(); });
}

function selezionaDaMenuCentrale(index) {
    impostaModalita(index);
    timedGameDuration = 63000; 
    divMenuCentrale.hide();
    menuCentraleVisibile = false;
    window.focus();
}

function creaMenuDebug() {
    btnToggleMenu = createButton('');
    btnToggleMenu.style('position', 'fixed');
    btnToggleMenu.style('bottom', '30px');
    btnToggleMenu.style('right', '30px');
    btnToggleMenu.size(15, 15);
    btnToggleMenu.style('background', 'rgba(100, 100, 100, 0.4)');
    btnToggleMenu.style('border', '1px solid rgba(255,255,255,0.2)');
    btnToggleMenu.style('border-radius', '50%');
    btnToggleMenu.style('cursor', 'pointer');
    btnToggleMenu.style('z-index', '9999');
    
    // JS Event Listeners for Hover
    btnToggleMenu.mouseOver(() => btnToggleMenu.style('background', 'rgba(255, 255, 255, 0.8)'));
    btnToggleMenu.mouseOut(() => { if(!menuAperto) btnToggleMenu.style('background', 'rgba(100, 100, 100, 0.4)'); });

    btnToggleMenu.mousePressed(toggleMenu);
    btnToggleMenu.hide(); 

    divMenuDebug = createDiv('');
    divMenuDebug.style('position', 'fixed');
    divMenuDebug.style('bottom', '60px');
    divMenuDebug.style('right', '20px');
    divMenuDebug.style('background', 'rgba(0,0,0,0.85)');
    divMenuDebug.style('padding', '10px');
    divMenuDebug.style('border', '1px solid #fff');
    divMenuDebug.style('border-radius', '5px');
    divMenuDebug.style('width', '160px');
    divMenuDebug.style('z-index', '9999');
    divMenuDebug.style('max-height', 'calc(100vh - 80px)');
    divMenuDebug.style('overflow-y', 'auto');
    divMenuDebug.hide(); 

    let headerContainer = createDiv('');
    headerContainer.parent(divMenuDebug);
    headerContainer.style('display', 'flex');
    headerContainer.style('justify-content', 'space-between');
    headerContainer.style('align-items', 'center');
    headerContainer.style('margin-bottom', '10px');

    let title = createDiv('☰ GAME');
    title.parent(headerContainer);
    title.style('color', '#fff');
    title.style('font-family', 'monospace');
    title.style('font-weight', 'bold');
    
    let btnClose = createDiv('X');
    btnClose.parent(headerContainer);
    btnClose.style('color', '#fff');
    btnClose.style('font-family', 'monospace');
    btnClose.style('font-weight', 'bold');
    btnClose.style('cursor', 'pointer');
    btnClose.style('padding', '0 5px');
    
    btnClose.mouseOver(() => btnClose.style('color', '#ff5555'));
    btnClose.mouseOut(() => btnClose.style('color', '#fff'));
    btnClose.mousePressed(toggleMenu);

    let styleBtn = 'display:block; margin:5px 0; padding:6px; width:100%; background:#333; color:white; border:1px solid #555; cursor:pointer; font-family:monospace; border-radius:3px; font-size: 12px;';

    let games = ["⌚ AUTO", "🔫 LASER", "🔵 BALLS", "🐍 SNAKE", "🧱 BREAKOUT", "👻 PACMAN", "🧩 MAZE", "⚖️ TILT"];
    
    for(let i=-1; i<7; i++) {
        let btn = createButton(games[i+1]);
        btn.parent(divMenuDebug);
        // FIX: Use .attribute for bulk inline styles
        btn.attribute('style', styleBtn);
        
        btn.mouseOver(() => btn.style('background', '#555'));
        btn.mouseOut(() => btn.style('background', '#333'));

        btn.mousePressed(() => { impostaModalita(i); toggleMenu(); });
    }
}

function toggleMenu() {
    menuAperto = !menuAperto;
    if (menuAperto) {
        divMenuDebug.show();
        btnToggleMenu.style('background', 'rgba(255, 50, 50, 0.8)');
    } else {
        divMenuDebug.hide();
        btnToggleMenu.style('background', 'rgba(100, 100, 100, 0.4)');
    }
    window.focus();
}

function impostaModalita(index) {
    gameInitialized = false; 
    bersagli = [];
    palline = [];
    victoryTime = 0;
    timedGameDuration = 0; 
    
    breakoutGameOver = false; breakoutWin = false;
    snakeGameOver = false;
    pacmanGameOver = false; pacmanWin = false;
    mazeWin = false; mazeGameOver = false;
    tiltGameOver = false; tiltWin = false;
    
    bonusPhaseActive = false; 
    bonusPhaseDone = false;

    if (index === -1) {
        debugMode = false;
        forcedGameIndex = -1;
    } else {
        debugMode = true;
        forcedGameIndex = index;
        debugStartTime = millis(); 
    }
    window.focus();
}

function configuraPulsante() {
    pulsanteAvvio.size(220, 50);
    pulsanteAvvio.position(windowWidth / 2 - 110, windowHeight / 2 + 20);
    // Explicit individual styles
    pulsanteAvvio.style('font-family', 'Courier New');
    pulsanteAvvio.style('font-size', '18px');
    pulsanteAvvio.style('background-color', '#fff');
    pulsanteAvvio.style('border', '2px solid #000');
    pulsanteAvvio.style('cursor', 'pointer');
    
    pulsanteAvvio.mouseOver(() => pulsanteAvvio.style('background-color', '#eee'));
    pulsanteAvvio.mouseOut(() => pulsanteAvvio.style('background-color', '#fff'));
}

function entraNelCanvas() {
    avviato = true;        
    pulsanteAvvio.remove(); 
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    btnToggleMenu.show();
    window.focus(); 
}

function draw() {
    if (!avviato) {
        background(30); 
        if (fontCaricato) {
            push(); textAlign(CENTER, CENTER); fill(255); textSize(40);
            text("This is not a watch", 0, -50); pop();
        }
        return; 
    }

    let s = second();
    let m = minute();

    let modalitaAttuale = -1; 
    let mostraCountdown = false;
    let secondiAlVia = 0;
    let mostraPsichedelico = false;

    if (debugMode && forcedGameIndex !== -1) {
        modalitaAttuale = forcedGameIndex;
        let tempoTrascorso = millis() - debugStartTime;
        if (tempoTrascorso < 3000) {
            mostraCountdown = true;
            secondiAlVia = 3 - floor(tempoTrascorso / 1000);
        }
        if (timedGameDuration > 0) {
            if (tempoTrascorso > timedGameDuration) {
                impostaModalita(-1);
                return; 
            }
            drawingContext.disable(drawingContext.DEPTH_TEST);
            push(); resetMatrix(); fill(255); textSize(12); textAlign(RIGHT, TOP);
            text("TIME LEFT: " + floor((timedGameDuration - tempoTrascorso)/1000), width-10, 10);
            pop(); drawingContext.enable(drawingContext.DEPTH_TEST);
        }
        if (forcedGameIndex === 1 && s != ultimoSecondo) {
             coloreSfondo = color(random(255), random(255), random(255));
             ultimoSecondo = s;
        }
    } else {
        // --- LOGICA 30s AUTO + 60s GIOCO ---
        // Ciclo totale: 90 secondi.
        // 0-29s (30s): Auto Mode (Riposo)
        // 30-89s (60s): Game Mode
        
        let totalSeconds = m * 60 + s;
        let cycleDuration = 90; 
        let cyclePosition = totalSeconds % cycleDuration;
        let cycleCount = floor(totalSeconds / cycleDuration);

        // Identificatore di stato univoco per reset
        // cycleCount * 2 + (0 se auto, 1 se game)
        let statoCorrente = cycleCount * 2 + (cyclePosition >= 30 ? 1 : 0);

        if (statoCorrente != ultimoStato) {
            gameInitialized = false; 
            ultimoStato = statoCorrente;
            ultimoMinuto = m; 
            
            // Cambia effetto per i prossimi 3s
            indiceEffetto = (indiceEffetto + 1) % 10; 
            
            // Reset variabili gioco
            bersagli = []; palline = []; victoryTime = 0;
            breakoutGameOver = false; breakoutWin = false;
            snakeGameOver = false; pacmanGameOver = false; pacmanWin = false;
            mazeWin = false; mazeGameOver = false; tiltGameOver = false; tiltWin = false;
            bonusPhaseActive = false; bonusPhaseDone = false;
        }

        // Effetti speciali per i primi 3 secondi di OGNI cambio fase
        // Fase Auto inizia a 0 -> Effetto 0-3
        // Fase Gioco inizia a 30 -> Effetto 30-33
        if (cyclePosition < 3 || (cyclePosition >= 30 && cyclePosition < 33)) {
            mostraPsichedelico = true;
        } else {
            if (cyclePosition < 30) {
                // Modalità Auto (Riposo)
                modalitaAttuale = -1;
            } else {
                // Modalità Gioco
                let gameIdx = cycleCount % 7; 
                modalitaAttuale = gameIdx;
            }
        }
    }

    if (mostraPsichedelico) {
        gestisciEffettoPsichedelico(indiceEffetto);
    } 
    else if (mostraCountdown && modalitaAttuale !== -1) {
        background(0);
        push(); resetMatrix(); textAlign(CENTER, CENTER); fill(255);
        textSize(30); text("GET READY", 0, -80);
        textSize(100); text(secondiAlVia, 0, 0); pop();
    } 
    else {
        switch(modalitaAttuale) {
            case -1: modalitaRiposo(s); break;
            case 0: modalitaGioco1(); break;
            case 1: modalitaGioco2(); break;
            case 2: modalitaGioco3(); break;
            case 3: modalitaGioco4(); break;
            case 4: modalitaGioco5(); break;
            case 5: modalitaGioco6(); break;
            case 6: modalitaGioco7(); break;
        }
        if (bonusPhaseActive) {
            manageBonusPhase();
        }
    }

    if (fontCaricato) {
        let h = hour();
        let orario = nf(h, 2) + ':' + nf(m, 2) + ':' + nf(s, 2);
        drawingContext.disable(drawingContext.DEPTH_TEST);
        push(); resetMatrix(); translate(-width / 2 + 20, -height / 2 + 40);
        
        stroke(0); 
        strokeWeight(4); 
        fill(255, 215, 0); 
        text(orario, 0, 0); 
        
        pop();
        drawingContext.enable(drawingContext.DEPTH_TEST);
    }
}

class BonusButton {
    constructor(id, label) {
        this.id = id; this.label = label;
        this.w = 160; this.h = 40; 
        this.x = random(this.w/2, width - this.w/2); 
        this.y = random(this.h/2, height - this.h/2);
        this.vx = random(-6, 6); this.vy = random(-6, 6);
        this.col = color(random(100, 255), random(100, 255), random(100, 255));
    }
    update() {
        this.x += this.vx; this.y += this.vy;
        if (this.x < this.w/2 || this.x > width - this.w/2) this.vx *= -1;
        if (this.y < this.h/2 || this.y > height - this.h/2) this.vy *= -1;
    }
    display() {
        push(); translate(this.x, this.y); stroke(255); strokeWeight(2); fill(this.col);
        rectMode(CENTER); rect(0, 0, this.w, this.h, 10);
        fill(0); noStroke(); textSize(14); textAlign(CENTER, CENTER); text(this.label, 0, 0); pop();
    }
    checkClick(mx, my) {
        return (mx > this.x - this.w/2 && mx < this.x + this.w/2 && my > this.y - this.h/2 && my < this.y + this.h/2);
    }
}

function startBonusPhase() {
    bonusButtons = [];
    let labels = ["LASER", "BALLS", "SNAKE", "BREAKOUT", "PACMAN", "MAZE", "TILT"];
    for(let i=0; i<7; i++) bonusButtons.push(new BonusButton(i, labels[i]));
    bonusPhaseActive = true;
}

function manageBonusPhase() {
    drawingContext.disable(drawingContext.DEPTH_TEST);
    push(); resetMatrix();
    translate(-width/2, -height/2); 
    fill(0, 80); rectMode(CORNER); rect(0, 0, width, height);
    for(let btn of bonusButtons) { btn.update(); btn.display(); }
    fill(255); textSize(20); textAlign(CENTER, TOP); 
    text("VICTORY! CLICK A GAME TO SWITCH", width/2, 50);
    pop(); drawingContext.enable(drawingContext.DEPTH_TEST);
}

function gestisciEffettoPsichedelico(indice) {
    push();
    switch (indice) {
        case 0: background(frameCount%2===0?0:255); rotateZ(frameCount*0.5); rotateX(frameCount*0.5); stroke(255,0,0); noFill(); scale(1.5); if(modello3D) model(modello3D); else box(100); break;
        case 1: background(0); noStroke(); for(let i=0;i<50;i++){push(); rotateZ(frameCount*0.1+i*0.5); translate(i*8,0,-200+i*10); fill((frameCount*5+i*10)%255,100,255); sphere(10); pop();} rotateY(frameCount*0.05); normalMaterial(); if(modello3D) model(modello3D); else box(100); break;
        case 2: background(20,0,40); noFill(); strokeWeight(2); for(let i=0;i<10;i++){push(); stroke(255-i*20,i*25,255); rotateX(frameCount*0.02*(i%2===0?1:-1)); rotateY(frameCount*0.02*(i%2===0?1:-1)); torus(150+i*30*sin(frameCount*0.05),2); pop();} rotateX(frameCount*0.02); rotateY(frameCount*0.02); ambientLight(255); fill(255); if(modello3D) model(modello3D); else box(100); break;
        case 3: background(255,100,100); rotateZ(frameCount*0.01); for(let i=0;i<6;i++){push(); rotateZ((TWO_PI/6)*i); translate(150,0,0); rotateY(frameCount*0.05); normalMaterial(); if(modello3D) model(modello3D); else box(50); pop();} break;
        case 4: background(0); stroke(0,255,255); noFill(); push(); rotateX(PI/2.5); translate(0,-200+(frameCount%100),0); for(let x=-400;x<=400;x+=50){line(x,-1000,0,x,1000,0);line(-1000,x,0,1000,x,0);} pop(); push(); stroke(255,0,255); translate(random(-5,5),random(-5,5),0); rotateY(frameCount*0.05); if(modello3D) model(modello3D); else box(100); pop(); break;
        case 5: background(0, 20, 0); stroke(0, 255, 0); noFill(); rotateX(frameCount * 0.02); rotateY(frameCount * 0.02); box(150); for(let j=-200; j<=200; j+=40) { line(j, -200, -200, j, 200, -200); line(-200, j, -200, 200, j, -200); } if(modello3D) { fill(0, 255, 0, 100); model(modello3D); } break;
        case 6: background(frameCount % 5 === 0 ? 255 : 0); noStroke(); fill(255, 0, 255); for(let i=0; i<5; i++) { push(); translate(sin(frameCount*0.1 + i)*50, cos(frameCount*0.1 + i)*50, 0); rotateZ(frameCount * 0.05); if(modello3D) model(modello3D); else box(50); pop(); } break;
        case 7: background(20); noStroke(); fill(0, 255, 255); rotateY(frameCount * 0.05); for(let i=0; i<100; i++) { push(); rotateY(i * 0.5); translate(100 + i, i, 0); sphere(5); pop(); } normalMaterial(); scale(1.2); if(modello3D) model(modello3D); else box(100); break;
        case 8: background(100, 0, 100); let wobble = sin(frameCount * 0.2) * 50; translate(wobble, 0, 0); rotateZ(frameCount * 0.1); normalMaterial(); if(modello3D) model(modello3D); else box(100); break;
        case 9: background(0); stroke(255); noFill(); for(let i=0; i<10; i++) { push(); translate(0, 0, 200 - (frameCount * 5 + i * 200) % 1000); rectMode(CENTER); rect(0, 0, 100, 100); pop(); } fill(255, 255, 0); rotateX(frameCount * 0.05); rotateY(frameCount * 0.05); if(modello3D) model(modello3D); else box(100); break;
    }
    pop();
}

function modalitaRiposo(s) {
    if (s != ultimoSecondo) {
        coloreSfondo = color(random(255), random(255), random(255));
        ultimoSecondo = s;
    }
    background(coloreSfondo);
    let velocitaRotazione = 0.01 + (s * 0.003); 
    angoloRotazione += velocitaRotazione;
    push(); rotateX(angoloRotazione); rotateY(angoloRotazione); normalMaterial();
    if (modello3D) model(modello3D); else box(100);
    pop();
}

function modalitaGioco1() { /* LASER GAME */
    background(10, 10, 30); 
    if (victoryTime > 0) {
        let elapsed = millis() - victoryTime;
        if (elapsed > 1000 && elapsed < 5000 && !bonusPhaseActive && !bonusPhaseDone) { startBonusPhase(); bonusPhaseDone = true; }
        if (elapsed > 5000) { gameInitialized = false; victoryTime = 0; bonusPhaseActive = false; bonusPhaseDone = false; if (debugMode) debugStartTime = millis(); }
    }
    if (!gameInitialized) {
        bersagli = [];
        let indexReale = floor(random(5));
        for (let i = 0; i < 5; i++) { bersagli.push({x: random(-width/3, width/3), y: random(-height/3, height/3), z: random(-100, 100), isReal: (i === indexReale), distrutto: false, scale: 1.0, velX: random(-3, 3)}); }
        laserProjectiles = []; gameInitialized = true; gameInstructionsStartTime = millis();
    }
    ambientLight(100); pointLight(255, 255, 255, 0, 0, 500);
    for (let b of bersagli) {
        if (b.distrutto) continue;
        b.x += b.velX; if (b.x > width/2 - 50 || b.x < -width/2 + 50) b.velX *= -1; 
        let pulsation = 1.0 + 0.3 * sin(frameCount * 0.1 + b.x * 0.01);
        push(); translate(b.x, b.y, b.z); rotateY(frameCount * 0.02); rotateX(frameCount * 0.02); normalMaterial(); scale(b.scale * pulsation); if (modello3D) model(modello3D); else box(50); pop();
    }
    let aimX = -(mouseX - width / 2); let aimY = -(mouseY - height / 2);
    if (mouseIsPressed && !menuAperto && !menuCentraleVisibile && !bonusPhaseActive && millis() - lastShotTime > 100) { 
        lastShotTime = millis(); suonaLaser();
        let startPos = createVector(0, height/2 + 20, 200); let targetPos = createVector(aimX, aimY, -100);      
        let dir = p5.Vector.sub(targetPos, startPos); dir.normalize(); dir.mult(40); 
        laserProjectiles.push({ pos: startPos, vel: dir, col: color(random(255), random(255), random(255)) });
        let nuovi = []; let colpito = false;
        for (let b of bersagli) {
            if (!b.distrutto && !colpito) {
                let pulsation = 1.0 + 0.3 * sin(frameCount * 0.1 + b.x * 0.01); let hitRadius = 60 * b.scale * pulsation;
                if (dist(aimX, aimY, b.x, b.y) < hitRadius) { 
                    colpito = true;
                    if (b.isReal) { b.distrutto = true; victoryTime = millis(); laserColor = color(0, 255, 0); setTimeout(() => laserColor = color(255, 0, 0), 200); } 
                    else { b.distrutto = true; for(let k=0; k<2; k++) nuovi.push({x: b.x + random(-20, 20), y: random(-height/3, height/3), z: random(-100, 100), isReal: false, distrutto: false, scale: b.scale * 0.6, velX: random(-4, 4)}); }
                }
            }
        }
        if (nuovi.length > 0) bersagli.push(...nuovi);
    }
    for (let i = laserProjectiles.length - 1; i >= 0; i--) {
        let p = laserProjectiles[i]; p.pos.add(p.vel);
        push(); translate(p.pos.x, p.pos.y, p.pos.z); stroke(p.col); strokeWeight(4); let tail = p5.Vector.mult(p.vel, 2); line(0, 0, 0, -tail.x/4, -tail.y/4, -tail.z/4); pop();
        if (p.pos.z < -3000) laserProjectiles.splice(i, 1);
    }
    push(); stroke(laserColor); strokeWeight(2); translate(aimX, aimY, 0); noFill(); ellipse(0, 0, 30, 30); line(-20, 0, 20, 0); line(0, -20, 0, 20); pop();
    drawingContext.disable(drawingContext.DEPTH_TEST); push(); resetMatrix(); fill(255); textSize(16); textAlign(CENTER);
    if (victoryTime > 0 && millis() - victoryTime < 5000) { fill(255, 215, 0); textSize(24); text("Congratulations!\nhaven't won anything", 0, 0); } 
    else { if (millis() - gameInstructionsStartTime < 5000) text("GUESS THE REAL ONE (HOLD FOR RAPID FIRE)", 0, height/2 - 50); }
    pop(); drawingContext.enable(drawingContext.DEPTH_TEST);
}

function modalitaGioco2() { /* PALLINE */
    if (!gameInitialized) { gameInitialized = true; gameInstructionsStartTime = millis(); targetSecretPos.set(0, 0, -250); }
    background(coloreSfondo);
    if(frameCount % 10 === 0) { targetSecretVel.add(createVector(random(-5, 5), random(-5, 5), 0)); targetSecretVel.limit(25); }
    targetSecretPos.add(targetSecretVel);
    if (targetSecretPos.x > width || targetSecretPos.x < -width) targetSecretVel.x *= -1;
    if (targetSecretPos.y > height || targetSecretPos.y < -height) targetSecretVel.y *= -1;
    
    // Disegna Cannone
    let cannonBase = createVector(0, height/2 - 50, 200);
    let mouseAim = createVector(mouseX - width/2, mouseY - height/2, -100);
    push();
    translate(cannonBase.x, cannonBase.y, cannonBase.z);
    // Calcolo angolo per puntare al mouse
    let dir = p5.Vector.sub(mouseAim, cannonBase);
    let angle = atan2(dir.y, dir.x);
    rotateZ(angle + PI/2);
    fill(50); noStroke();
    cylinder(20, 80); // Canna del cannone
    push(); translate(0, 40, 0); fill(30); sphere(30); pop(); // Base
    pop();

    push(); translate(targetSecretPos.x, targetSecretPos.y, targetSecretPos.z); noStroke(); fill(255, 215, 0); ambientLight(200); rotateY(frameCount * 0.1); sphere(30); pop();
    push(); let speed = 0.02 + (second() * 0.005); rotateX(frameCount * speed); rotateY(frameCount * speed); rotateZ(frameCount * speed); normalMaterial(); scale(1.5); if (modello3D) model(modello3D); else box(80); pop();
    for (let p of palline) { 
        p.update(); 
        p.display(); 
        if (dist(p.pos.x, p.pos.y, p.pos.z, targetSecretPos.x, targetSecretPos.y, targetSecretPos.z) < 50) { 
            if (!menuCentraleVisibile) { 
                divMenuCentrale.show(); 
                menuCentraleVisibile = true; 
                suonaRandom(); 
            } 
        } 
    } 
    
    drawingContext.disable(drawingContext.DEPTH_TEST); push(); resetMatrix(); fill(0, 255, 0); textSize(16); textAlign(CENTER);
    if (millis() - gameInstructionsStartTime < 5000) text("SHOOT THE GOLD BALL TO WIN", 0, height/2 - 50); 
    pop(); drawingContext.enable(drawingContext.DEPTH_TEST);
}

function modalitaGioco3() { /* SNAKE */
    background(20, 40, 20); 
    if (snakeGameOver) {
        if (millis() - snakeGameOverStart > 3000) { gameInitialized = false; snakeGameOver = false; } else { drawingContext.disable(drawingContext.DEPTH_TEST); push(); resetMatrix(); fill(255, 0, 0); textSize(40); textAlign(CENTER); text("TRY AGAIN", 0, 0); pop(); drawingContext.enable(drawingContext.DEPTH_TEST); return; }
    }
    if (!gameInitialized) {
        snakePos = createVector(0, 0, 0); snakeSpeed = 4; snakeVel = createVector(snakeSpeed, 0, 0); snakeTail = [];
        foodPos = createVector(random(-200, 200), random(-200, 200), 0); snakeTargetLength = 20; 
        gameInitialized = true; gameInstructionsStartTime = millis(); 
    }
    snakePos.add(snakeVel);
    if (snakePos.x > width/2) snakePos.x = -width/2; if (snakePos.x < -width/2) snakePos.x = width/2;
    if (snakePos.y > height/2) snakePos.y = -height/2; if (snakePos.y < -height/2) snakePos.y = height/2;
    if (dist(snakePos.x, snakePos.y, foodPos.x, foodPos.y) < 30) { suonaPop(); snakeTargetLength += 5; snakeSpeed += 0.2; snakeVel.setMag(snakeSpeed); foodPos = createVector(random(-width/3, width/3), random(-height/3, height/3), 0); }
    if (frameCount % 5 == 0) { snakeTail.push(snakePos.copy()); if (snakeTail.length > snakeTargetLength) snakeTail.shift(); }
    for (let i = 0; i < snakeTail.length - 10; i++) { if (dist(snakePos.x, snakePos.y, snakeTail[i].x, snakeTail[i].y) < 20) { snakeGameOver = true; snakeGameOverStart = millis(); suonaRandom(); break; } }
    push(); translate(foodPos.x, foodPos.y, 0); fill(255, 0, 0); noStroke(); box(20); pop();
    push(); translate(snakePos.x, snakePos.y, 0); rotateX(-HALF_PI); rotateZ(PI); normalMaterial(); if (modello3D) { scale(0.5); model(modello3D); } else box(30); pop();
    for (let t of snakeTail) { push(); translate(t.x, t.y, 0); fill(100, 255, 100); noStroke(); sphere(10); pop(); }
    drawingContext.disable(drawingContext.DEPTH_TEST); push(); resetMatrix(); fill(255); textSize(16); textAlign(CENTER);
    if (millis() - gameInstructionsStartTime < 5000) text("USE ARROW KEYS TO EAT RED CUBES", 0, height/2 - 50); 
    pop(); drawingContext.enable(drawingContext.DEPTH_TEST);
}

function modalitaGioco4() { /* BREAKOUT */
    background(40, 20, 60); 
    if (breakoutGameOver) {
        if (millis() - breakoutGameOverStart > 5000) { gameInitialized = false; breakoutGameOver = false; } else { if (frameCount % 5 == 0) suonaRandom(); drawingContext.disable(drawingContext.DEPTH_TEST); push(); resetMatrix(); fill(255, 0, 0); textSize(40); textAlign(CENTER); text("GAME OVER LOSER", 0, 0); pop(); drawingContext.enable(drawingContext.DEPTH_TEST); return; }
    }
    if (breakoutWin) {
          drawingContext.disable(drawingContext.DEPTH_TEST); push(); resetMatrix(); fill(0, 255, 0); textSize(40); textAlign(CENTER); text("WELL DONE CHAMPION", 0, 0); pop(); drawingContext.enable(drawingContext.DEPTH_TEST);
          let elapsed = millis() - breakoutWinTime;
          if (elapsed > 1000 && elapsed < 5000 && !bonusPhaseActive && !bonusPhaseDone) { startBonusPhase(); bonusPhaseDone = true; }
          if (elapsed > 5000) { breakoutWin = false; gameInitialized = false; bonusPhaseActive = false; bonusPhaseDone = false; }
          return;
    }
    if (!gameInitialized) {
        paddleX = 0; breakoutBalls = []; breakoutBalls.push({ pos: createVector(0, 0, 0), vel: createVector(4, -4, 0) });
        bricks = []; let rows = 5; let cols = 8; let bW = 60; let bH = 20;
        for (let r=0; r<rows; r++) for (let c=0; c<cols; c++) bricks.push({x: (c * bW) - (cols*bW)/2 + bW/2, y: (r * bH) - 200, w: 50, h: 15, active: true});
        breakoutGameOver = false; breakoutWin = false; breakoutFlags = { threeLeft: false, twoLeft: false };
        gameInitialized = true; gameInstructionsStartTime = millis(); 
    }
    paddleX = mouseX - width/2; paddleX = constrain(paddleX, -width/2 + 75, width/2 - 75); let paddleY = height/2 - 100;
    if (frameCount % 60 == 0) for(let b of breakoutBalls) b.vel.mult(1.05); 
    let activeBricks = bricks.filter(b => b.active).length;
    if (activeBricks === 0 && !breakoutWin) { breakoutWin = true; breakoutWinTime = millis(); }
    if (!breakoutWin) {
        if (activeBricks <= 3 && !breakoutFlags.threeLeft) { breakoutFlags.threeLeft = true; breakoutBalls.push({ pos: createVector(0,0,0), vel: createVector(-4, -4, 0) }); }
        if (activeBricks <= 2 && !breakoutFlags.twoLeft) { breakoutFlags.twoLeft = true; breakoutBalls.push({ pos: createVector(0,0,0), vel: createVector(4, -5, 0) }); }
        let ballsActive = 0;
        for (let i = 0; i < breakoutBalls.length; i++) {
            let b = breakoutBalls[i]; if (b.pos.y > height/2) continue; ballsActive++; b.pos.add(b.vel);
            if (b.pos.x > width/2 || b.pos.x < -width/2) b.vel.x *= -1; if (b.pos.y < -height/2) b.vel.y *= -1;
            if (b.pos.y > paddleY - 20 && b.pos.y < paddleY + 20 && b.pos.x > paddleX - 75 && b.pos.x < paddleX + 75) { b.vel.y *= -1; suonaPop(); let diff = b.pos.x - paddleX; let speed = b.vel.mag(); b.vel.x = map(diff, -75, 75, -speed, speed); b.vel.setMag(speed); }
            for (let brick of bricks) { if (brick.active && b.pos.x > brick.x - brick.w/2 && b.pos.x < brick.x + brick.w/2 && b.pos.y > brick.y - brick.h/2 && b.pos.y < brick.y + brick.h/2) { brick.active = false; b.vel.y *= -1; suonaPop(); break; } }
            push(); translate(b.pos.x, b.pos.y, 0); fill(255); noStroke(); sphere(10); pop();
        }
        if (ballsActive === 0) { breakoutGameOver = true; breakoutGameOverStart = millis(); suonaRandom(); }
    }
    for (let b of bricks) { if (b.active) { push(); translate(b.x, b.y, 0); fill(255 - (b.y+200), 100, 200); noStroke(); box(b.w, b.h, 20); pop(); } }
    push(); translate(paddleX, paddleY, 0); rotateX(-HALF_PI); rotateZ(PI); normalMaterial(); scale(1.5, 1.0, 1.0); if (modello3D) model(modello3D); else box(100, 20, 20); pop();
    drawingContext.disable(drawingContext.DEPTH_TEST); push(); resetMatrix(); fill(255); textSize(16); textAlign(CENTER);
    if (millis() - gameInstructionsStartTime < 5000) text("MOUSE LEFT/RIGHT TO BREAK BLOCKS", 0, height/2 - 30); 
    pop(); drawingContext.enable(drawingContext.DEPTH_TEST);
}

function modalitaGioco5() { /* PACMAN */
    background(0, 0, 50); 
    if (pacmanGameOver) {
        if (millis() - victoryTime > 3000) { gameInitialized = false; }
        else { drawingContext.disable(drawingContext.DEPTH_TEST); push(); resetMatrix(); fill(255, 0, 0); textSize(40); textAlign(CENTER); text("GAME OVER", 0, 0); pop(); drawingContext.enable(drawingContext.DEPTH_TEST); return; }
    }
    if (pacmanWin) {
        if (millis() - victoryTime > 3000) { gameInitialized = false; }
        else { drawingContext.disable(drawingContext.DEPTH_TEST); push(); resetMatrix(); fill(0, 255, 0); textSize(40); textAlign(CENTER); text("YOU WON!", 0, 0); pop(); drawingContext.enable(drawingContext.DEPTH_TEST); return; }
    }
    if (!gameInitialized) {
        pacmanScore = 0; pacmanTotalDots = 0; pacmanGameOver = false; pacmanWin = false; pacmanGhosts = []; pacmanGrid = []; pacmanNextDir = createVector(0,0);
        pacmanCols = floor(width / pacmanCellSize); pacmanRows = floor(height / pacmanCellSize);
        if(pacmanCols % 2 === 0) pacmanCols--; if(pacmanRows % 2 === 0) pacmanRows--; 
        for (let r=0; r<pacmanRows; r++) { pacmanGrid[r] = []; for (let c=0; c<pacmanCols; c++) { if (r===0 || r===pacmanRows-1 || c===0 || c===pacmanCols-1 || (r%3===0 && c%3===0)) { pacmanGrid[r][c] = 1; } else { pacmanGrid[r][c] = 2; pacmanTotalDots++; } } }
        pacmanPlayerPos = createVector(1, 1); pacmanGrid[1][1] = 0; 
        
        // Raddoppio fantasmi (da 4 a 8) e li piazzo casualmente o in posizioni fisse extra
        pacmanGhosts.push({pos: createVector(pacmanCols-2, pacmanRows-2), dir: createVector(0,0)});
        pacmanGhosts.push({pos: createVector(1, pacmanRows-2), dir: createVector(0,0)});
        pacmanGhosts.push({pos: createVector(pacmanCols-2, 1), dir: createVector(0,0)});
        pacmanGhosts.push({pos: createVector(floor(pacmanCols/2), floor(pacmanRows/2)), dir: createVector(0,0)});
        // Extra 4 ghosts
        pacmanGhosts.push({pos: createVector(floor(pacmanCols/2), 1), dir: createVector(0,0)});
        pacmanGhosts.push({pos: createVector(floor(pacmanCols/2), pacmanRows-2), dir: createVector(0,0)});
        pacmanGhosts.push({pos: createVector(1, floor(pacmanRows/2)), dir: createVector(0,0)});
        pacmanGhosts.push({pos: createVector(pacmanCols-2, floor(pacmanRows/2)), dir: createVector(0,0)});

        gameInitialized = true; gameInstructionsStartTime = millis();
    }
    if (frameCount % 10 === 0) { 
        // Movimento solo se il tasto è premuto
        pacmanNextDir.set(0, 0); // Resetta direzione
        if (keyIsDown(UP_ARROW)) pacmanNextDir.set(0, -1);
        else if (keyIsDown(DOWN_ARROW)) pacmanNextDir.set(0, 1);
        else if (keyIsDown(LEFT_ARROW)) pacmanNextDir.set(-1, 0);
        else if (keyIsDown(RIGHT_ARROW)) pacmanNextDir.set(1, 0);

        // Se c'è una direzione valida (tasto premuto), prova a muovere
        if (pacmanNextDir.x !== 0 || pacmanNextDir.y !== 0) {
            let nextX = pacmanPlayerPos.x + pacmanNextDir.x; let nextY = pacmanPlayerPos.y + pacmanNextDir.y;
            if (pacmanGrid[nextY] && pacmanGrid[nextY][nextX] !== 1) {
                pacmanPlayerPos.set(nextX, nextY);
                if (pacmanGrid[nextY][nextX] === 2) { pacmanGrid[nextY][nextX] = 0; pacmanScore++; suonaPop(); if (pacmanScore >= pacmanTotalDots) { pacmanWin = true; victoryTime = millis(); } }
            }
        }

        for (let g of pacmanGhosts) {
            let moves = [createVector(0,1), createVector(0,-1), createVector(1,0), createVector(-1,0)];
            let validMoves = moves.filter(m => pacmanGrid[g.pos.y + m.y][g.pos.x + m.x] !== 1);
            if (validMoves.length > 0) { let move = random(validMoves); g.pos.add(move); }
            if (dist(pacmanPlayerPos.x, pacmanPlayerPos.y, g.pos.x, g.pos.y) < 1.2) { pacmanGameOver = true; victoryTime = millis(); suonaRandom(); }
        }
    }
    translate(-pacmanCols*pacmanCellSize/2, -pacmanRows*pacmanCellSize/2, 0); 
    for (let r=0; r<pacmanRows; r++) { for (let c=0; c<pacmanCols; c++) { push(); translate(c*pacmanCellSize + pacmanCellSize/2, r*pacmanCellSize + pacmanCellSize/2, 0); if (pacmanGrid[r][c] === 1) { fill(50, 50, 200); box(pacmanCellSize); } else if (pacmanGrid[r][c] === 2) { fill(255, 255, 0); noStroke(); sphere(5); } pop(); } }
    
    // Disegna Pacman (Verticale)
    push(); 
    translate(pacmanPlayerPos.x*pacmanCellSize + pacmanCellSize/2, pacmanPlayerPos.y*pacmanCellSize + pacmanCellSize/2, 0); 
    // ORIENTATION LIKE SNAKE
    rotateX(-HALF_PI);
    rotateZ(PI);
    normalMaterial(); 
    if (modello3D) { scale(0.4); model(modello3D); } else { fill(255, 255, 0); sphere(12); } 
    pop();

    // Disegna Fantasmi (Colore cangiante)
    let r = map(sin(frameCount * 0.1), -1, 1, 100, 255);
    let g = map(sin(frameCount * 0.1 + 2), -1, 1, 100, 255);
    let b = map(sin(frameCount * 0.1 + 4), -1, 1, 100, 255);
    
    for (let ghst of pacmanGhosts) { 
        push(); 
        translate(ghst.pos.x*pacmanCellSize + pacmanCellSize/2, ghst.pos.y*pacmanCellSize + pacmanCellSize/2, 0); 
        fill(r, g, b); // Colore dinamico
        box(20); 
        pop(); 
    }

    drawingContext.disable(drawingContext.DEPTH_TEST); push(); resetMatrix(); fill(255); textSize(16); textAlign(CENTER);
    if (millis() - gameInstructionsStartTime < 5000) text("USE ARROWS TO MOVE", 0, height/2 - 50); 
    pop(); drawingContext.enable(drawingContext.DEPTH_TEST);
}

function modalitaGioco6() {
    background(50, 30, 30); 

    if (mazeWin) {
        drawingContext.disable(drawingContext.DEPTH_TEST); push(); resetMatrix(); fill(0, 255, 0); textSize(40); textAlign(CENTER); text("ESCAPED!", 0, 0); pop(); drawingContext.enable(drawingContext.DEPTH_TEST);
        
        let elapsed = millis() - victoryTime;
        // Bonus Phase tra 1s e 5s
        if (elapsed > 1000 && elapsed < 5000 && !bonusPhaseActive && !bonusPhaseDone) { 
            startBonusPhase(); 
            bonusPhaseDone = true; 
        }
        if (elapsed > 5000) { 
            gameInitialized = false; 
            mazeWin = false; 
            bonusPhaseActive = false; 
            bonusPhaseDone = false; 
        }
        return; 
    }

    if (mazeGameOver) {
        if (millis() - mazeGameOverStart > 3000) { gameInitialized = false; mazeGameOver = false; }
        else { 
            drawingContext.disable(drawingContext.DEPTH_TEST); 
            push(); resetMatrix(); fill(255, 0, 0); textSize(40); textAlign(CENTER); 
            text("WATCH YOUR STEP", 0, 0); 
            pop(); 
            drawingContext.enable(drawingContext.DEPTH_TEST); 
            return; 
        }
    }

    if (!gameInitialized) {
        // Calcola dimensioni griglia basate sul canvas per riempirlo tutto
        mazeCols = floor(width / mazeCellSize);
        mazeRows = floor(height / mazeCellSize);
        // Assicuriamoci che siano dispari per l'algoritmo DFS classico
        if (mazeCols % 2 === 0) mazeCols--;
        if (mazeRows % 2 === 0) mazeRows--;

        // Inizializza tutto a Muro (1)
        mazeGrid = [];
        for (let y = 0; y < mazeRows; y++) {
            mazeGrid[y] = [];
            for (let x = 0; x < mazeCols; x++) {
                mazeGrid[y][x] = 1;
            }
        }

        // --- ALGORITMO DFS RECURSIVE BACKTRACKER ---
        let stack = [];
        let current = {x: 1, y: 1};
        mazeGrid[current.y][current.x] = 0; // Punto partenza
        stack.push(current);

        while (stack.length > 0) {
            let cx = current.x;
            let cy = current.y;
            
            // Trova vicini non visitati (distanza 2)
            let neighbors = [];
            let dirs = [
                {x: 0, y: -2}, {x: 0, y: 2}, 
                {x: -2, y: 0}, {x: 2, y: 0}
            ];

            for (let d of dirs) {
                let nx = cx + d.x;
                let ny = cy + d.y;
                // Controlla limiti e se è muro (non visitato)
                if (nx > 0 && nx < mazeCols - 1 && ny > 0 && ny < mazeRows - 1 && mazeGrid[ny][nx] === 1) {
                    neighbors.push({x: nx, y: ny, dx: d.x, dy: d.y});
                }
            }

            if (neighbors.length > 0) {
                // Scegli un vicino a caso
                let chosen = random(neighbors);
                // Rimuovi muro tra corrente e scelto
                mazeGrid[cy + chosen.dy/2][cx + chosen.dx/2] = 0;
                // Rimuovi muro nel scelto
                mazeGrid[chosen.y][chosen.x] = 0;
                // Sposta
                stack.push(current);
                current = {x: chosen.x, y: chosen.y};
            } else {
                // Backtrack
                current = stack.pop();
            }
        }

        // Posizioni in pixel (centrate rispetto al canvas)
        // Offset per centrare il labirinto nello schermo
        let mazeWidth = mazeCols * mazeCellSize;
        let mazeHeight = mazeRows * mazeCellSize;
        let offsetX = (width - mazeWidth) / 2;
        let offsetY = (height - mazeHeight) / 2;

        // Player start (cella 1,1)
        mazePlayerPos = createVector(offsetX + mazeCellSize * 1.5, offsetY + mazeCellSize * 1.5);
        
        // Exit (penultimo angolo in basso a destra)
        mazeExitPos = createVector(offsetX + (mazeCols-2) * mazeCellSize + mazeCellSize/2, offsetY + (mazeRows-2) * mazeCellSize + mazeCellSize/2);
        // Assicura che l'uscita sia raggiungibile (lo è col DFS, ma puliamo per sicurezza)
        mazeGrid[mazeRows-2][mazeCols-2] = 0; 

        gameInitialized = true; gameInstructionsStartTime = millis();
    }

    // --- MOVIMENTO CON COLLISIONI ---
    let speed = 5; 
    let nextX = mazePlayerPos.x;
    let nextY = mazePlayerPos.y;

    if (keyIsDown(UP_ARROW)) nextY -= speed;
    if (keyIsDown(DOWN_ARROW)) nextY += speed;
    if (keyIsDown(LEFT_ARROW)) nextX -= speed;
    if (keyIsDown(RIGHT_ARROW)) nextX += speed;

    // Logica di Collisione (Bounding Box ai 4 angoli)
    // Trasformiamo coordinate pixel -> coordinate griglia per controllare
    // Dobbiamo tenere conto dell'offset di disegno
    let mazeWidth = mazeCols * mazeCellSize;
    let mazeHeight = mazeRows * mazeCellSize;
    let offsetX = (width - mazeWidth) / 2 - width/2; // Offset per coordinate WEBGL (0 al centro)
    let offsetY = (height - mazeHeight) / 2 - height/2;

    // Funzione helper per controllare collisione in un punto
    function checkCollision(px, py) {
        // Converti pixel screen space -> grid space
        // Nota: mazePlayerPos è in coordinate screen (0..width), qui convertiamo per l'array
        let gx = floor((px - (width - mazeWidth)/2) / mazeCellSize);
        let gy = floor((py - (height - mazeHeight)/2) / mazeCellSize);
        
        if (gx < 0 || gx >= mazeCols || gy < 0 || gy >= mazeRows) return 1; // Fuori mappa come muro
        
        // Se è trappola (2), ritorna 2
        if (mazeGrid[gy][gx] === 2) return 2;
        
        // Se è muro (1), ritorna 1
        if (mazeGrid[gy][gx] === 1) return 1;
        
        return 0; // Libero
    }

    // Controlla collisione su asse X
    let r = mazePlayerRadius;
    let c1 = checkCollision(nextX - r, mazePlayerPos.y - r);
    let c2 = checkCollision(nextX + r, mazePlayerPos.y - r);
    let c3 = checkCollision(nextX - r, mazePlayerPos.y + r);
    let c4 = checkCollision(nextX + r, mazePlayerPos.y + r);

    if (c1===2 || c2===2 || c3===2 || c4===2) { mazeGameOver = true; mazeGameOverStart = millis(); suonaRandom(); return; }
    
    if (c1!==1 && c2!==1 && c3!==1 && c4!==1) {
        mazePlayerPos.x = nextX;
    }

    // Controlla collisione su asse Y
    c1 = checkCollision(mazePlayerPos.x - r, nextY - r);
    c2 = checkCollision(mazePlayerPos.x + r, nextY - r);
    c3 = checkCollision(mazePlayerPos.x - r, nextY + r);
    c4 = checkCollision(mazePlayerPos.x + r, nextY + r);

    if (c1===2 || c2===2 || c3===2 || c4===2) { mazeGameOver = true; mazeGameOverStart = millis(); suonaRandom(); return; }

    if (c1!==1 && c2!==1 && c3!==1 && c4!==1) {
        mazePlayerPos.y = nextY;
    }

    // Win Check
    if (dist(mazePlayerPos.x, mazePlayerPos.y, mazeExitPos.x, mazeExitPos.y) < 20) {
        mazeWin = true; victoryTime = millis();
    }

    // --- RENDER ---
    // Trasla tutto per centrare (il sistema di coordinate di disegno e collisione deve combaciare)
    push();
    translate(-width/2, -height/2);

    // Disegna Labirinto
    let startX = (width - mazeWidth) / 2;
    let startY = (height - mazeHeight) / 2;

    for(let y=0; y<mazeRows; y++) {
        for(let x=0; x<mazeCols; x++) {
            if (mazeGrid[y][x] === 1) {
                push(); 
                translate(startX + x * mazeCellSize + mazeCellSize/2, startY + y * mazeCellSize + mazeCellSize/2, 0); 
                fill(100); 
                box(mazeCellSize); 
                pop();
            } else if (mazeGrid[y][x] === 2) { // Trappola
                push(); 
                translate(startX + x * mazeCellSize + mazeCellSize/2, startY + y * mazeCellSize + mazeCellSize/2, 0); 
                fill(255, 0, 0); // Rosso
                box(mazeCellSize/2); // Più piccola per non toccare per sbaglio
                pop();
            }
        }
    }

    // Exit
    push(); 
    translate(mazeExitPos.x, mazeExitPos.y, 0); 
    fill(0, 255, 0); 
    noStroke(); 
    box(mazeCellSize/1.5); 
    pop();

    // Player
    push(); 
    translate(mazePlayerPos.x, mazePlayerPos.y, 0); 
    rotateX(-HALF_PI); 
    rotateZ(PI);      
    normalMaterial(); 
    if (modello3D) { scale(0.3); model(modello3D); } else sphere(10);
    pop();

    pop(); // End Translation

    drawingContext.disable(drawingContext.DEPTH_TEST);
    push(); resetMatrix(); fill(255); textSize(16); textAlign(CENTER);
    if (millis() - gameInstructionsStartTime < 5000) text("FIND THE GREEN EXIT", 0, height/2 - 50); 
    pop(); drawingContext.enable(drawingContext.DEPTH_TEST);
}

function modalitaGioco7() { /* TILT */
    background(50, 50, 60); 
    if (tiltGameOver) {
        if (millis() - victoryTime > 3000) { gameInitialized = false; tiltGameOver = false; }
        else { drawingContext.disable(drawingContext.DEPTH_TEST); push(); resetMatrix(); fill(255, 0, 0); textSize(40); textAlign(CENTER); text("FELL IN HOLE", 0, 0); pop(); drawingContext.enable(drawingContext.DEPTH_TEST); return; }
    }
    if (tiltWin) {
        if (millis() - victoryTime > 3000) { gameInitialized = false; tiltWin = false; }
        else { drawingContext.disable(drawingContext.DEPTH_TEST); push(); resetMatrix(); fill(0, 255, 0); textSize(40); textAlign(CENTER); text("SAFE!", 0, 0); pop(); drawingContext.enable(drawingContext.DEPTH_TEST); return; }
    }
    if (!gameInitialized) {
        tiltBallPos = createVector(-150, 0, 20); tiltBallVel = createVector(0,0,0); tiltHoles = [];
        for(let i=0; i<15; i++) { // Changed from 5 to 15
            let hx, hy;
            do {
                hx = random(-180, 180);
                hy = random(-130, 130);
            } while (dist(hx, hy, -150, 0) < 50 || dist(hx, hy, 150, 0) < 50);
            tiltHoles.push({x: hx, y: hy});
        }
        tiltGoal = {x: 150, y: 0}; gameInitialized = true; gameInstructionsStartTime = millis();
    }
    let rx = map(mouseY - height/2, -height/2, height/2, -PI/6, PI/6); let ry = map(mouseX - width/2, -width/2, width/2, -PI/6, PI/6);
    let gravity = 0.5; tiltBallVel.x += sin(ry) * gravity; tiltBallVel.y -= sin(rx) * gravity; tiltBallVel.mult(0.98); tiltBallPos.add(tiltBallVel);
    if (tiltBallPos.x > 190 || tiltBallPos.x < -190) tiltBallVel.x *= -0.5; if (tiltBallPos.y > 140 || tiltBallPos.y < -140) tiltBallVel.y *= -0.5;
    tiltBallPos.x = constrain(tiltBallPos.x, -195, 195); tiltBallPos.y = constrain(tiltBallPos.y, -145, 145);
    for(let h of tiltHoles) { if(dist(tiltBallPos.x, tiltBallPos.y, h.x, h.y) < 15) { tiltGameOver = true; victoryTime = millis(); suonaRandom(); } }
    if(dist(tiltBallPos.x, tiltBallPos.y, tiltGoal.x, tiltGoal.y) < 20) { tiltWin = true; victoryTime = millis(); }
    push(); rotateX(rx); rotateZ(ry); 
    fill(150, 100, 50); box(400, 300, 10);
    for(let h of tiltHoles) { push(); translate(h.x, h.y, 6); fill(0); cylinder(15, 2); pop(); }
    push(); translate(tiltGoal.x, tiltGoal.y, 6); fill(0, 255, 0); cylinder(20, 2); pop();
    
    // Here is the ball/model
    push(); 
    translate(tiltBallPos.x, tiltBallPos.y, 20); 
    rotateX(-HALF_PI); // Add this
    rotateZ(PI);       // Add this
    normalMaterial(); 
    if (modello3D) { scale(0.5); model(modello3D); } else sphere(15); 
    pop();
    
    pop();
    drawingContext.disable(drawingContext.DEPTH_TEST); push(); resetMatrix(); fill(255); textSize(16); textAlign(CENTER);
    if (millis() - gameInstructionsStartTime < 5000) text("MOUSE TO TILT", 0, height/2 - 50); 
    pop(); drawingContext.enable(drawingContext.DEPTH_TEST);
}

class Ball {
    constructor(x, y, tx, ty) {
        this.pos = createVector(x, y, 200); 
        
        // Se vengono passati tx e ty, usa la logica del cannone
        if (tx !== undefined) {
             let target = createVector(tx, ty, -100); // Punta verso la profondità
             this.vel = p5.Vector.sub(target, this.pos);
             this.vel.setMag(15); // Velocità del proiettile
        } else {
            // Logica di fallback o vecchia logica
             let target = createVector(random(-50, 50), random(-50, 50), 0);
             this.vel = p5.Vector.sub(target, this.pos);
             this.vel.setMag(random(5, 10));
        }
        
        this.col = color(random(255), random(255), random(255));
        this.r = 10; this.history = [];
    }
    update() {
        this.pos.add(this.vel); this.history.push(this.pos.copy());
        if (this.history.length > 20) this.history.shift();
        
        // Wall collisions
        if (this.pos.x > width/2 || this.pos.x < -width/2) this.vel.x *= -1;
        if (this.pos.y > height/2 || this.pos.y < -height/2) this.vel.y *= -1;
        if (this.pos.z > 500 || this.pos.z < -500) this.vel.z *= -1;
        
        // Collision with spinning shape (approx radius 80)
        let d = this.pos.mag();
        if (d < 80) {
            let n = this.pos.copy().normalize();
            // Reflect velocity: v = v - 2(v.n)n
            this.vel.reflect(n);
            // Push out to avoid sticking
            this.pos = n.mult(82);
        }
    }
    display() {
        noStroke();
        for (let i = 0; i < this.history.length; i++) {
            let pos = this.history[i]; let size = map(i, 0, this.history.length, 2, this.r);
            push(); translate(pos.x, pos.y, pos.z); fill(this.col); sphere(size); pop();
        }
        push(); translate(this.pos.x, this.pos.y, this.pos.z); noStroke(); fill(this.col); sphere(this.r); pop();
    }
}

function keyPressed() {
    let activeGameIndex = -1;
    let isCountdown = false;
    let s = second(); let m = minute();

    if (debugMode && forcedGameIndex !== -1) {
        activeGameIndex = forcedGameIndex;
        if (millis() - debugStartTime < 3000) isCountdown = true;
    } else {
        let totalSeconds = m * 60 + s;
        let cycleDuration = 90;
        let cyclePosition = totalSeconds % cycleDuration;
        let cycleCount = floor(totalSeconds / cycleDuration);

        if (cyclePosition >= 30) {
            activeGameIndex = cycleCount % 7;
            if (cyclePosition < 33) return; 
        } else {
            return;
        }
    }

    if (isCountdown || menuAperto || menuCentraleVisibile) return;

    if (activeGameIndex === 2 && !snakeGameOver) {
        if (keyCode === UP_ARROW && snakeVel.y === 0) snakeVel.set(0, -snakeSpeed, 0);
        else if (keyCode === DOWN_ARROW && snakeVel.y === 0) snakeVel.set(0, snakeSpeed, 0);
        else if (keyCode === LEFT_ARROW && snakeVel.x === 0) snakeVel.set(-snakeSpeed, 0, 0);
        else if (keyCode === RIGHT_ARROW && snakeVel.x === 0) snakeVel.set(snakeSpeed, 0, 0);
        return false; 
    }
}

function mousePressed() {
    if (!avviato) return;
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (menuAperto || menuCentraleVisibile) return;

    if (bonusPhaseActive) {
        let mx = mouseX; let my = mouseY;
        for (let btn of bonusButtons) {
            if (btn.checkClick(mx, my)) { impostaModalita(btn.id); bonusPhaseActive = false; return; }
        }
    }

    let activeGameIndex = -1;
    let isCountdown = false;
    let s = second(); let m = minute();

    if (debugMode && forcedGameIndex !== -1) {
        activeGameIndex = forcedGameIndex;
        if (millis() - debugStartTime < 3000) isCountdown = true;
    } else {
        let totalSeconds = m * 60 + s;
        let cycleDuration = 90;
        let cyclePosition = totalSeconds % cycleDuration;
        let cycleCount = floor(totalSeconds / cycleDuration);

        if (cyclePosition >= 30) {
            activeGameIndex = cycleCount % 7;
            if (cyclePosition < 33) return; 
        } else {
            return;
        }
    }

    if (isCountdown || activeGameIndex === -1) return;

    if (activeGameIndex === 1) {
        suonaPop(); 
        palline.push(new Ball(0, height/2 - 50, mouseX - width/2, mouseY - height/2));
    }
}