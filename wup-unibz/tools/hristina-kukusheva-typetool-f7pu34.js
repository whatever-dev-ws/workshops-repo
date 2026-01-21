// WUP 2025-26
//Hristina Kukusheva

/**
 * Editor di testo su canvas con toolbar (p5.js)
 * - Scrittura diretta da tastiera
 * - Grassetto / Italic / Sottolineato
 * - Aumenta / Diminuisci dimensione testo
 * - Scarica come .txt
 * - Censura automatica (rettangolo nero) su parole che iniziano con lettera maiuscola
 */

let canvas;
let testo = "";            // buffer del testo
let fontSize = 24;         // dimensione iniziale
let isBold = false;
let isItalic = false;
let isUnderline = false;

let toolbarDiv;
let boldBtn, italicBtn, underlineBtn;
let sizeDecBtn, sizeIncBtn, sizeLabel;
let downloadBtn;

function setup() {
  canvas = createCanvas(900, 520);
  canvas.parent(document.body);
  background(250);

  // Permette al canvas di ricevere il focus della tastiera
  canvas.elt.setAttribute("tabindex", "0");
  canvas.mousePressed(() => canvas.elt.focus());

  // Toolbar UI
  buildToolbar();

  textFont('sans-serif');
  textSize(fontSize);
  textAlign(LEFT, BASELINE);
}

function draw() {
  background(255);

  // Margini
  const margin = 24;

  // Titolo/istruzioni leggere
  noStroke();
  fill(120);
  textSize(14);
  text("Clicca sul canvas e digita. Usa la toolbar per stile, dimensione e download (.txt).\n" +
       "Twist: ogni parola con iniziale maiuscola viene censurata con un evidenziatore nero.",
       margin, margin - 6);

  // Disegno del testo con censura automatica
  renderTextWithCensor(margin, margin + 28, width - margin, height - margin);

  // Cursore lampeggiante alla fine del testo
  drawCaretAtEnd(margin, margin + 28, width - margin);
}

/**
 * Costruisce la toolbar sopra al canvas
 */
function buildToolbar() {
  toolbarDiv = createDiv();
  toolbarDiv.style('display', 'flex');
  toolbarDiv.style('gap', '8px');
  toolbarDiv.style('align-items', 'center');
  toolbarDiv.style('margin', '8px 0');
  toolbarDiv.style('flex-wrap', 'wrap');

  // Bottoni stile
  boldBtn = createButton('Grassetto');
  italicBtn = createButton('Italic');
  underlineBtn = createButton('Sottolinea');

  [boldBtn, italicBtn, underlineBtn].forEach(btn => {
    btn.parent(toolbarDiv);
    styleButton(btn);
  });

  boldBtn.mousePressed(() => {
    isBold = !isBold;
    setActive(boldBtn, isBold);
  });

  italicBtn.mousePressed(() => {
    isItalic = !isItalic;
    setActive(italicBtn, isItalic);
  });

  underlineBtn.mousePressed(() => {
    isUnderline = !isUnderline;
    setActive(underlineBtn, isUnderline);
  });

  // Dimensione testo
  sizeDecBtn = createButton('A-');
  sizeIncBtn = createButton('A+');
  sizeLabel = createSpan(` Dimensione: ${fontSize}px`);

  [sizeDecBtn, sizeIncBtn].forEach(btn => {
    btn.parent(toolbarDiv);
    styleButton(btn);
  });

  sizeLabel.parent(toolbarDiv);
  sizeLabel.style('font-family', 'sans-serif');

  sizeDecBtn.mousePressed(() => {
    fontSize = max(10, fontSize - 2);
    textSize(fontSize);
    sizeLabel.html(` Dimensione: ${fontSize}px`);
  });
  sizeIncBtn.mousePressed(() => {
    fontSize = min(96, fontSize + 2);
    textSize(fontSize);
    sizeLabel.html(` Dimensione: ${fontSize}px`);
  });

  // Download .txt
  downloadBtn = createButton('Scarica .txt');
  downloadBtn.parent(toolbarDiv);
  stylePrimaryButton(downloadBtn);
  downloadBtn.mousePressed(() => {
    // Salva il testo come file .txt (p5 salva ogni elemento dell'array come riga)
    saveStrings(testo.split('\n'), 'testo_censurato.txt');
  });
}

/**
 * Stile base per bottoni
 */
function styleButton(btn) {
  btn.style('padding', '6px 10px');
  btn.style('border', '1px solid #ccc');
  btn.style('border-radius', '6px');
  btn.style('background', '#f7f7f7');
  btn.style('cursor', 'pointer');
  btn.style('font-family', 'sans-serif');
}

function stylePrimaryButton(btn) {
  btn.style('padding', '6px 12px');
  btn.style('border', '1px solid #1976d2');
  btn.style('border-radius', '6px');
  btn.style('background', '#2196f3');
  btn.style('color', '#fff');
  btn.style('cursor', 'pointer');
  btn.style('font-family', 'sans-serif');
}

function setActive(btn, active) {
  if (active) {
    btn.style('background', '#e0f2ff');
    btn.style('border-color', '#1976d2');
  } else {
    btn.style('background', '#f7f7f7');
    btn.style('border-color', '#ccc');
  }
}

/**
 * Rende il testo (con ritorno a capo automatico semplice) e applica
 * la censura su parole che iniziano con lettera maiuscola (rettangolo nero).
 */
function renderTextWithCensor(x0, y0, xMax, yMax) {
  textSize(fontSize);
  const lineGap = 8; // spaziatura tra righe
  const ascent = textAscent();
  const descent = textDescent();
  const lineHeight = ascent + descent + lineGap;

  let x = x0;
  let y = y0 + ascent;

  // Tokenizza mantenendo spazi e newline
  const tokens = testo.split(/(\s+)/);

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    if (token === '') continue;

    if (token.includes('\n')) {
      // gestisce uno o più newline
      const parts = token.split('\n');
      for (let k = 0; k < parts.length; k++) {
        const part = parts[k];
        if (part.length > 0) {
          const w = textWidth(part);
          if (x + w > xMax) {
            x = x0;
            y += lineHeight;
          }
          drawToken(part, x, y, ascent, descent);
          x += w;
        }
        if (k < parts.length - 1) {
          // newline effettivo
          x = x0;
          y += lineHeight;
        }
      }
      continue;
    }

    const w = textWidth(token);

    // Vai a capo se supera il margine destro (solo per parole non vuote)
    if (x + w > xMax && token.trim() !== '') {
      x = x0;
      y += lineHeight;
    }

    drawToken(token, x, y, ascent, descent);
    x += w;

    // Stop se si supera il fondo (non indispensabile, ma evita overflow)
    if (y + descent > yMax) break;
  }
}

/**
 * Disegna un token con stile e applica censura se necessario
 */
function drawToken(token, x, y, ascent, descent) {
  const isWord = token.trim() !== '' && !/^\s+$/.test(token);
  const w = textWidth(token);

  push();

  // Imposta stile: se Bold+Italic sono entrambi attivi,
  // si usa Bold e si inclina il canvas per simulare l'italic.
  if (isBold && isItalic) {
    textStyle(BOLD);
    shearX(radians(-12)); // simulazione dell'italic
  } else if (isBold) {
    textStyle(BOLD);
  } else if (isItalic) {
    textStyle(ITALIC);
  } else {
    textStyle(NORMAL);
  }

  if (isWord && startsWithUppercase(token)) {
    // CENSURA: evidenziatore/rettangolo nero che copre interamente la parola
    noStroke();
    fill(0);
    const padX = 2;
    const padY = 3;
    const h = ascent + descent + padY * 2;
    rect(x - padX, y - ascent - padY, w + padX * 2, h);
    // Non disegniamo il testo per rendere la censura totale
  } else {
    // Disegno normale del testo/spazi
    noStroke();
    fill(20);
    text(token, x, y);

    // Sottolineatura (solo per parola non vuota)
    if (isUnderline && token.trim() !== '') {
      stroke(20);
      strokeWeight(1.5);
      const underlineY = y + descent * 0.2;
      line(x, underlineY, x + w, underlineY);
    }
  }

  pop();
}

/**
 * Determina se un token (parola) inizia con lettera maiuscola.
 * Gestisce Unicode (accentate) e ignora punteggiatura iniziale.
 */
function startsWithUppercase(word) {
  const trimmed = word.trim();

  if (trimmed.length === 0) return false;

  // Ignora punteggiatura iniziale (es. "«Mario", "(Bologna", etc.)
  // Togli caratteri non alfabetici all'inizio
  const firstReal = trimmed.match(/[\p{L}]/u);
  if (!firstReal) return false;

  const idx = trimmed.indexOf(firstReal[0]);
  const firstChar = trimmed[idx];

  // \p{Lu} = lettera maiuscola Unicode
  return /\p{Lu}/u.test(firstChar);
}

/**
 * Disegna un cursore lampeggiante alla fine del testo
 */
function drawCaretAtEnd(x0, y0, xMax) {
  textSize(fontSize);
  const ascent = textAscent();
  const descent = textDescent();
  const lineGap = 8;
  const lineHeight = ascent + descent + lineGap;

  // Calcola posizione finale come nel render
  let x = x0;
  let y = y0 + ascent;
  const tokens = testo.split(/(\s+)/);

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    if (token.includes('\n')) {
      const parts = token.split('\n');
      for (let k = 0; k < parts.length; k++) {
        const part = parts[k];
        if (part.length > 0) {
          const w = textWidth(part);
          if (x + w > xMax) {
            x = x0;
            y += lineHeight;
          }
          x += w;
        }
        if (k < parts.length - 1) {
          x = x0;
          y += lineHeight;
        }
      }
      continue;
    }

    const w = textWidth(token);
    if (x + w > xMax && token.trim() !== '') {
      x = x0;
      y += lineHeight;
    }
    x += w;
  }

  // Caret: lampeggia
  if (floor(frameCount / 30) % 2 === 0) {
    stroke(30);
    strokeWeight(1.5);
    line(x, y - ascent, x, y + descent);
  }
}

/**
 * Gestione input tastiera
 */
function keyTyped() {
  // Aggiunge caratteri stampabili
  if (key.length === 1) {
    testo += key;
  }
  return false; // previene input sul DOM
}

function keyPressed() {
  if (keyCode === BACKSPACE) {
    testo = testo.slice(0, -1);
    return false;
  }
  if (keyCode === ENTER || keyCode === RETURN) {
    testo += '\n';
    return false;
  }
  if (keyCode === TAB) {
    testo += '    '; // inserisce 4 spazi
    return false;
  }
}
