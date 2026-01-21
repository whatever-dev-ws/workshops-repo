// =======================
// SHHHHHCODE – p5.js
// =======================

let alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789?!/+=-_.,:;()[]{}@#€$%&*";
let secretMap = {};
let inputBox, outputBox;
let shuffleButton;

function setup() {
  createCanvas(1000, 600);
  textFont('monospace');
  generateSecretAlphabet();

  // Input testo normale
  inputBox = createElement('textarea');
  inputBox.position(350, 160);
  inputBox.size(600, 120);
  inputBox.input(encodeText);

  // Output testo cifrato
  outputBox = createElement('textarea');
  outputBox.position(350, 330);
  outputBox.size(600, 120);
  outputBox.attribute('readonly', '');

  // Bottone rimescola
  shuffleButton = createButton("Rimescola alfabeto segreto");
  shuffleButton.position(20, 120);
  shuffleButton.mousePressed(() => {
    generateSecretAlphabet();
    encodeText();
  });
}

function draw() {
  background(245);

  // Titolo
  textSize(28);
  textAlign(RIGHT, TOP);
  text("SHHHHHCODE", width - 20, 20);

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

  // Titoli sezioni
  textSize(16);
  text("Alfabeto segreto", 20, 90);
  text("Testo normale", 350, 130);
  text("Testo cifrato", 350, 300);

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
  let startY = 150;
  let colWidth = 120;
  let maxWidth = 300; // limite orizzontale area alfabeto
  let lineHeight = 16;

  let x = startX;
  let y = startY;

  for (let char of alphabet) {
    text(char, x, y);
    text("→", x + 20, y);
    text(secretMap[char], x + 40, y);

    y += lineHeight;

    // nuova colonna se finisce lo spazio verticale
    if (y > height - 20) {
      y = startY;
      x += colWidth;
    }

    // blocca l'espansione verso destra
    if (x > startX + maxWidth) {
      break;
    }
  }
}
