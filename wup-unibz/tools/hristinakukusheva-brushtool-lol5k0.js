//WUP 2025-26
//Hristina Kukusheva

let gridSize = 7;
let cellSize = 30;

let brushGrid = [];
let savedBrushes = [];
let selectedBrush = null;

let colorPicker;
let brushSizeSlider;
let brushSelector;

let drawArea;
let drawAreaCanvas;

function setup() {
  // --- EDITOR DEL PENNELLO ---
  createP("🎨 Editor del pennello (7×7)").position(20, 10);

  createCanvas(gridSize * cellSize, gridSize * cellSize).position(20, 40);

  for (let i = 0; i < gridSize; i++) {
    brushGrid[i] = [];
    for (let j = 0; j < gridSize; j++) {
      brushGrid[i][j] = null;
    }
  }

  createP("🎨 Colore selezionato:").position(20, 270);
  colorPicker = createColorPicker("#000000");
  colorPicker.position(20, 300);

  createButton("💾 Salva Pennello")
    .position(20, 340)
    .mousePressed(saveCurrentBrush);

  createP("🖌 Pennelli salvati:").position(20, 380);
  brushSelector = createSelect();
  brushSelector.position(20, 410);
  brushSelector.option("Nessuno");
  brushSelector.changed(() => {
    let idx = brushSelector.value();
    selectedBrush = idx === "Nessuno" ? null : savedBrushes[idx];
  });

  createP("📏 Dimensione pennello:").position(20, 450);
  brushSizeSlider = createSlider(10, 200, 50);
  brushSizeSlider.position(20, 480);

  createButton("🧼 Pulisci Editor")
    .position(20, 520)
    .mousePressed(() => {
      for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
          brushGrid[i][j] = null;
        }
      }
    });

  // --- AREA DI DISEGNO ---
  createP("🖼 Area di disegno:").position(400, 10);
  drawArea = createGraphics(1000, 700);
  drawArea.clear();

  drawAreaCanvas = createCanvas(1000, 700);
  drawAreaCanvas.position(400, 40);

  createButton("📷 Salva come PNG")
    .position(400, 760)
    .mousePressed(() => saveCanvas(drawArea, "disegno", "png"));

  createButton("🧼 Cancella tutto il canvas")
    .position(540, 760)
    .mousePressed(() => drawArea.clear());
}

function draw() {
  background(220);

  drawBrushEditor();

  stroke(180);
  fill(245);
  rect(400, 40, 1000, 700);
  image(drawArea, 400, 40);

  if (mouseIsPressed &&
      mouseX > 400 && mouseX < 1400 &&
      mouseY > 40 && mouseY < 740 &&
      selectedBrush) {

    let x = mouseX - 400;
    let y = mouseY - 40;
    let size = brushSizeSlider.value();

    drawArea.push();
    drawArea.translate(x, y);
    drawArea.imageMode(CENTER);
    drawArea.image(selectedBrush, 0, 0, size, size);
    drawArea.pop();
  }
}

function drawBrushEditor() {
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      if (brushGrid[i][j]) {
        fill(brushGrid[i][j]);
      } else {
        noFill();
      }
      stroke(180);
      rect(i * cellSize, j * cellSize, cellSize, cellSize);
    }
  }
}

function mousePressed() {
  if (mouseX >= 20 && mouseX < 20 + gridSize * cellSize &&
      mouseY >= 40 && mouseY < 40 + gridSize * cellSize) {

    let i = floor((mouseX - 20) / cellSize);
    let j = floor((mouseY - 40) / cellSize);
    brushGrid[i][j] = colorPicker.color();
  }
}

function saveCurrentBrush() {
  let pg = createGraphics(gridSize, gridSize);
  pg.clear();

  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      if (brushGrid[i][j]) {
        pg.noStroke();
        pg.fill(brushGrid[i][j]);
        pg.rect(i, j, 1, 1);
      }
    }
  }

  pg.updatePixels();
  savedBrushes.push(pg);
  brushSelector.option(savedBrushes.length - 1);
}
