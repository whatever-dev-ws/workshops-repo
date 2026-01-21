// =======================
// SHHHHHCODE – p5.js
// Layout definitivo anti-sovrapposizione
// =======================

let alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789?!/+=-_.,:;()[]{}@#€$%&*";
let secretMap = {};
let inputBox, outputBox;
let shuffleButton;

// LARGHEZZA SIDEBAR (alfabeto)
const sidebarWidth = 340;

function setup() {
  createCanvas(1100, 620);
  textFont('monospace');
  generateSecretAlphabet();

  // Input testo normale
  inputBox = createElement('textarea');
  inputBox.position(sidebarWidth + 40, 170);
  inputBox.size(680, 120);
  inputBox.input(encodeText);

  // Output testo cifrato
  outputBox = createElement('textarea');
  outputBox.position(sidebarWidth + 40, 360);
  outputBox.size(680, 120);
  outputBox.attribute('readonly', '');

  // Bottone rimescola
  shuffleButton = createButton("Rimescola alfabeto segreto");
  shuffleButton.position(20, 130);
  shuffleButton.mousePressed(() => {
    generateSecretAlphabet();
    encodeText();
  });
}

function draw() {
  background(245);

  // Separatore visivo sidebar
  stroke(200);
  line(sidebarWidth, 0, sidebarWidth, height);
  noStroke();

  // Titolo
  textSize(28);
  textAlign(RIGHT, TOP);
  text("SHHHHHCODE", width - 30, 20);

  // Regole
  textAlign(LEFT, TOP);
  textSize(14);
  text(
    "Questo strumento utilizza un cifrario a sostituzione monoalfabetica.\n" +
    "Ogni lettera o simbolo viene sostituito da un altro carattere casuale.\n" +
    "Usa il bottone per creare un nuovo alfabeto segreto.",
    20,
    20
  );

  // Titoli
  textSize(16);
  text("Alfabeto segreto", 20, 95);
  text("Testo normale", sidebarWidth + 40, 135);
  text("Testo cifrato", sidebarWidth + 40, 325);

  drawAlphabetTable();
}

function generateSecretAlphabet() {
  secretMap = {};
  let shuffled = shuffle(alphabet.split(''));

  for (let i = 0; i < alphabet.length; i++) {
    secretMap[alphabet[i]] = shuffled[i];
  }
}

function encodeText() {
  let txt = inputBox.value();
  let encoded = "";

  for (let char of txt) {
    if (secretMap[char]) {
      encoded += secretMap[char];
    } else {
      encoded += char;
    }
  }

  outputBox.value(encoded);
}

function drawAlphabetTable() {
  textSize(12);

  let startX = 20;
  let startY = 155;
  let colWidth = 140;
  let lineHeight = 16;

  let x = startX;
  let y = startY;

  for (let char of alphabet) {
    text(char, x, y);
    text("→", x + 22, y);
    text(secretMap[char], x + 44, y);

    y += lineHeight;

    // nuova colonna se finisce lo spazio verticale
    if (y > height - 30) {
      y = startY;
      x += colWidth;
    }

    // NON uscire dalla sidebar
    if (x + colWidth > sidebarWidth - 10) {
      break;
    }
  }
}
