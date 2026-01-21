let textInput;
let colorPicker;
let sizeSlider;
let densitySlider;
let directionCheckbox;
let randomCheckbox;
let eraserCheckbox;

// Checkbox per il colore
let randomWordCheckbox;
let randomLetterCheckbox;
let currentWordColor;

// Variabili per il ridimensionamento
let widthInput;
let heightInput;
let resizeButton;

// Variabile per il colore di sfondo
let bgColorPicker;

// --- VARIABILI PER IL FONT ---
let currentFont = null; // Inizializzato a null (userà il default)
let fontInput;
let resetFontBtn; // Nuovo bottone reset

let alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
let elements = [];
let lastX = 0;
let lastY = 0;

// Variabile per il colore dei titoli
let titleColor = '#215401';

function setup() {
  // --- 0. CARICAMENTO FONT URBANIST ---
  let link = document.createElement('link');
  link.href = "https://fonts.googleapis.com/css2?family=Urbanist:ital,wght@0,100..900;1,100..900&display=swap";
  link.rel = "stylesheet";
  document.head.appendChild(link);
  // ------------------------------------

  currentWordColor = color(0);

  // 1. CREAZIONE STRUTTURA LAYOUT
  let mainLayout = createDiv();
  mainLayout.style('display', 'flex');
  mainLayout.style('height', '100vh');
  mainLayout.style('font-family', "'Urbanist', sans-serif");
  mainLayout.style('font-weight', '500');

  // A. Sidebar
  let sidebar = createDiv();
  sidebar.parent(mainLayout);
  sidebar.style('width', '280px');
  sidebar.style('background-color', '#F3FAED');
  sidebar.style('padding', '20px');
  sidebar.style('display', 'flex');
  sidebar.style('flex-direction', 'column');
  sidebar.style('gap', '12px');
  sidebar.style('overflow-y', 'auto');
  sidebar.style('border-right', '1px solid #e0e0e0');

  // B. Canvas Container
  let canvasContainer = createDiv();
  canvasContainer.parent(mainLayout);
  canvasContainer.style('padding', '20px');
  canvasContainer.style('background-color', '#fff');
  canvasContainer.style('flex-grow', '1');
  canvasContainer.style('display', 'flex');
  canvasContainer.style('justify-content', 'center');
  canvasContainer.style('align-items', 'start');

  // C. Canvas
  let cnv = createCanvas(500, 500);
  cnv.parent(canvasContainer);
  
  // --- SIDEBAR ---

  // Titolo
  let title = createP("<b>Word brush🌟</b>");
  title.parent(sidebar);
  title.style('margin-top', '0');
  title.style('font-size', '22px');
  title.style('font-weight', '700');
  title.style('color', titleColor);

  // 1. Canvas Size
  let t1 = createDiv("<b>Canvas Size</b>");
  t1.parent(sidebar);
  t1.style('margin-top','10px');
  t1.style('color', titleColor);

  let sizeRow = createDiv();
  sizeRow.parent(sidebar);
  sizeRow.style('display', 'flex');
  sizeRow.style('gap', '5px');
  
  widthInput = createInput(width.toString(), 'number');
  widthInput.parent(sizeRow);
  widthInput.style('width', '60px');
  widthInput.style('font-family', 'Urbanist');
  
  createSpan("x").parent(sizeRow).style('align-self', 'center');
  
  heightInput = createInput(height.toString(), 'number');
  heightInput.parent(sizeRow);
  heightInput.style('width', '60px');
  heightInput.style('font-family', 'Urbanist');
  
  resizeButton = createButton('Resize');
  resizeButton.parent(sizeRow);
  resizeButton.mousePressed(changeCanvasSize);
  resizeButton.style('font-family', 'Urbanist');
  resizeButton.style('cursor', 'pointer');
  resizeButton.style('background-color', '#fff');
  resizeButton.style('border', '1px solid #ccc');

  // Background
  let bgRow = createDiv();
  bgRow.parent(sidebar);
  bgRow.style('display', 'flex');
  bgRow.style('align-items', 'center');
  bgRow.style('margin-top', '5px');

  createSpan("Background: ").parent(bgRow).style('margin-right', '10px');
  
  bgColorPicker = createColorPicker('#FFFFFF');
  bgColorPicker.parent(bgRow);

  // Separatore
  createDiv("").parent(sidebar).style('border-top', '1px solid #ccc').style('margin', '10px 0');

  // 2. Text Content
  let t2 = createDiv("<b>Text Content</b>");
  t2.parent(sidebar);
  t2.style('color', titleColor);

  textInput = createInput('Hello');
  textInput.parent(sidebar);
  textInput.style('font-family', 'Urbanist');
  textInput.style('padding', '5px');
  
  randomCheckbox = createCheckbox(" Random letters", false);
  randomCheckbox.parent(sidebar);
  randomCheckbox.style('font-family', 'Urbanist');

  // --- UPLOAD FONT (MODIFICATO) ---
  createDiv('').parent(sidebar).style('height', '5px'); 
  let fontLabel = createSpan("Custom Font (.ttf/.otf):");
  fontLabel.parent(sidebar);
  fontLabel.style('font-size', '13px');
  fontLabel.style('color', '#555');

  fontInput = createFileInput(handleFontFile);
  fontInput.parent(sidebar);
  fontInput.style('font-family', 'Urbanist');
  fontInput.style('font-size', '12px');
  fontInput.style('margin-top', '5px');

  resetFontBtn = createButton('Reset Font');
  resetFontBtn.parent(sidebar);
  resetFontBtn.style('font-family', 'Urbanist');
  resetFontBtn.style('font-size', '11px');
  resetFontBtn.style('margin-top', '5px');
  resetFontBtn.style('width', '80px');
  resetFontBtn.mousePressed(() => {
      currentFont = null;
      fontInput.value(''); // Pulisce l'input file
  });
  // -------------------------

  // 3. Style
  let t3 = createDiv("<b>Style</b>");
  t3.parent(sidebar);
  t3.style('margin-top','10px');
  t3.style('color', titleColor);
  
  let colorRow = createDiv();
  colorRow.parent(sidebar);
  colorRow.style('display', 'flex');
  colorRow.style('align-items', 'center');
  createSpan("Color: ").parent(colorRow).style('margin-right', '10px');
  colorPicker = createColorPicker('#000000');
  colorPicker.parent(colorRow);

  // --- CHECKBOX ---
  randomWordCheckbox = createCheckbox(" Random Letter Color", false);
  randomWordCheckbox.parent(sidebar);
  randomWordCheckbox.style('font-family', 'Urbanist');
  randomWordCheckbox.style('margin-top', '5px');

  randomLetterCheckbox = createCheckbox(" Random Word Color", false);
  randomLetterCheckbox.parent(sidebar);
  randomLetterCheckbox.style('font-family', 'Urbanist');
  
  createSpan("Size:").parent(sidebar).style('margin-top', '10px');
  sizeSlider = createSlider(10, 150, 24);
  sizeSlider.parent(sidebar);

  createSpan("Spacing (Density):").parent(sidebar);
  densitySlider = createSlider(0, 60, 0);
  densitySlider.parent(sidebar);

  // 4. Tools
  let t4 = createDiv("<b>Tools</b>");
  t4.parent(sidebar);
  t4.style('margin-top','10px');
  t4.style('color', titleColor);

  directionCheckbox = createCheckbox(" Follow direction", false);
  directionCheckbox.parent(sidebar);
  directionCheckbox.style('font-family', 'Urbanist');

  eraserCheckbox = createCheckbox(" Eraser Mode", false);
  eraserCheckbox.parent(sidebar);
  eraserCheckbox.style('font-family', 'Urbanist');

  // Separatore
  createDiv("").parent(sidebar).style('border-top', '1px solid #ccc').style('margin', '10px 0');

  // 5. INFO BOX (SHORTCUTS)
  let shortcutBox = createDiv();
  shortcutBox.parent(sidebar);
  shortcutBox.style('background-color', '#FFFFFF');
  shortcutBox.style('border', '1px solid #ddd');
  shortcutBox.style('border-radius', '8px');
  shortcutBox.style('padding', '15px');
  shortcutBox.style('box-shadow', '0 2px 5px rgba(0,0,0,0.05)');

  shortcutBox.html(`
    <div style="margin-bottom: 10px; color:${titleColor}; font-weight:700; font-size:14px;"> Shortcuts</div>
    <div style="display:flex; justify-content:space-between; font-size:13px; color:#555; margin-bottom:5px;">
        <span>Save Image</span> <b style="color:#000; background:#eee; padding:0 5px; border-radius:4px;">S</b>
    </div>
    <div style="display:flex; justify-content:space-between; font-size:13px; color:#555; margin-bottom:5px;">
        <span>Clear All</span> <b style="color:#000; background:#eee; padding:0 5px; border-radius:4px;">C</b>
    </div>
    <div style="display:flex; justify-content:space-between; font-size:13px; color:#555;">
        <span>Undo</span> <b style="color:#000; background:#eee; padding:0 5px; border-radius:4px;">Z</b>
    </div>
  `);

  // Setup grafico
  textAlign(CENTER, CENTER);
  noStroke();
  // Il default viene settato nel loop draw se currentFont è null
}

// --- FUNZIONE PER GESTIRE L'UPLOAD DEL FONT (AGGIORNATA) ---
function handleFontFile(file) {
  if (file.subtype === 'font' || file.name.endsWith('.ttf') || file.name.endsWith('.otf')) {
    // Carica il file come oggetto p5.Font
    currentFont = loadFont(file.data);
    console.log("Font caricato correttamente!");
  } else {
    currentFont = null;
    alert("Per favore carica un file .ttf o .otf valido");
  }
}
// ----------------------------------------------

function draw() {
  background(bgColorPicker.color());

  for (let i = 0; i < elements.length; i++) {
    let e = elements[i];
    push();
    translate(e.x, e.y);
    rotate(e.angle);
    textSize(e.size);
    
    // --- USA IL FONT SALVATO NELL'ELEMENTO (O URBANIST COME DEFAULT) ---
    if (e.font) {
        textFont(e.font);
    } else {
        textFont('Urbanist');
    }
    // -------------------------------------------------------------------
    
    if (e.individualColors && e.individualColors.length > 0) {
        
        let totalWidth = textWidth(e.txt);
        let startX = -totalWidth / 2;
        
        textAlign(LEFT, CENTER);
        
        let currentOffset = 0;
        for (let j = 0; j < e.txt.length; j++) {
            fill(e.individualColors[j]);
            let char = e.txt.charAt(j);
            text(char, startX + currentOffset, 0);
            currentOffset += textWidth(char);
        }
        
        textAlign(CENTER, CENTER);
        
    } else {
        fill(e.col);
        text(e.txt, 0, 0);
    }
    pop();
  }

  // --- INTERAZIONE MOUSE ---
  if (mouseIsPressed && mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) {
    
    // GOMMA
    if (eraserCheckbox.checked()) {
      noFill();
      stroke(255, 0, 0);
      circle(mouseX, mouseY, sizeSlider.value());
      noStroke();

      let eraserRadius = sizeSlider.value() / 2;
      elements = elements.filter(e => dist(mouseX, mouseY, e.x, e.y) > eraserRadius);
    } 
    // DISEGNO
    else {
      let d = dist(mouseX, mouseY, lastX, lastY);
      let minSpacing = densitySlider.value();

      if (d > minSpacing) {
        let angle = 0;
        if (directionCheckbox.checked()) {
          angle = atan2(mouseY - lastY, mouseX - lastX);
        }

        let content;
        if (randomCheckbox.checked()) {
          let rIndex = floor(random(alphabet.length));
          content = alphabet.charAt(rIndex);
        } else {
          content = textInput.value();
        }

        // --- CALCOLO COLORI ---
        let mainColor = color(0);
        let individualColors = []; 

        if (randomWordCheckbox.checked()) { 
           for(let k=0; k < content.length; k++){
               individualColors.push(color(random(255), random(255), random(255)));
           }
        } 
        else if (randomLetterCheckbox.checked()) {
           mainColor = color(random(255), random(255), random(255));
        } 
        else {
           mainColor = colorPicker.color();
        }

        let newElement = {
          x: mouseX,
          y: mouseY,
          txt: content,
          col: mainColor,        
          individualColors: individualColors, 
          size: sizeSlider.value(),
          angle: angle,
          font: currentFont // --- SALVA IL FONT ATTUALE (Oggetto o null) ---
        };

        elements.push(newElement);
        lastX = mouseX;
        lastY = mouseY;
      }
    }
  } else {
    lastX = mouseX;
    lastY = mouseY;
  }
}

function mousePressed() {
    // Vuoto intenzionalmente
}

function changeCanvasSize() {
  let newW = int(widthInput.value());
  let newH = int(heightInput.value());
  if (newW > 0 && newH > 0) {
    resizeCanvas(newW, newH);
  }
}

function keyPressed() {
  if (document.activeElement.tagName === "INPUT") return;

  if (key === 'c' || key === 'C') elements = [];
  if (key === 'z' || key === 'Z') elements.pop();
  if (key === 's' || key === 'S') saveCanvas('nice.drawing', 'png');
}