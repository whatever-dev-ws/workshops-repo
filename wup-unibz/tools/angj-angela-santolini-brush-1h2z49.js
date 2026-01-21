// WUP 25-26
// Angela Santolini
let symmetrySlider, thicknessSlider, colorPicker, brushSelector, clearButton;
let saveGifButton, saveJpegButton; 
let recordingCountdown = -1; 

function setup() {
  // Ottimizzazione per iPad e Apple Pencil
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1); 
  angleMode(DEGREES);
  background(15);
  createUI();
}

function draw() {
  let symmetry = symmetrySlider.value();
  let angle = 360 / symmetry;

  translate(width / 2, height / 2);

  // Funziona sia con mouseIsPressed che con i tocchi della penna
  if (mouseIsPressed && mouseX > 240) { // Evita di disegnare se tocchi la sidebar
    let mx = mouseX - width / 2;
    let my = mouseY - height / 2;
    let pmx = pmouseX - width / 2;
    let pmy = pmouseY - height / 2;

    for (let i = 0; i < symmetry; i++) {
      rotate(angle);
      drawBrush(mx, my, pmx, pmy);
      push();
      scale(1, -1);
      drawBrush(mx, my, pmx, pmy);
      pop();
    }
  }
  handleRecordingUI(); 
}

// BLOCCA LO SCROLL DELL'IPAD MENTRE USI LA PENNA
function touchMoved() {
  if (mouseX > 240) {
    return false; 
  }
}

function drawBrush(x, y, px, py) {
  let type = brushSelector.value();
  let col = colorPicker.color();
  let thick = thicknessSlider.value();
  
  stroke(col);
  strokeWeight(thick);
  drawingContext.shadowBlur = 0; 
  noFill(); 

  if (type === 'Classic') {
    line(x, y, px, py);
  } 
  else if (type === 'Sparkle') {
    noStroke(); fill(col);
    drawingContext.shadowBlur = thick / 2;
    drawingContext.shadowColor = col;
    for (let i = 0; i < 5; i++) {
      ellipse(x + random(-10, 10), y + random(-10, 10), random(1, thick));
    }
  } 
  else if (type === 'Calligraphy') {
    strokeWeight(0); fill(col);
    beginShape();
    vertex(x - thick/2, y - thick/2);
    vertex(px - thick/2, py - thick/2);
    vertex(px + thick/2, py + thick/2);
    vertex(x + thick/2, y + thick/2);
    endShape(CLOSE);
  } 
  else if (type === 'Neon Fur') {
    strokeWeight(0.5);
    drawingContext.shadowBlur = thick * 1.5;
    drawingContext.shadowColor = col;
    for (let i = 0; i < 3; i++) {
      line(x, y, px + random(-thick * 2, thick * 2), py + random(-thick * 2, thick * 2));
    }
  }
  else if (type === 'Rainbow') {
    colorMode(HSB, 360, 100, 100);
    stroke(frameCount % 360, 80, 100);
    strokeWeight(thick);
    colorMode(RGB);
    line(x, y, px, py);
  }
  else if (type === 'Mirror Web') {
    strokeWeight(thick * 0.2);
    line(x, y, px, py);
    strokeWeight(0.5);
    line(x, y, px + random(-thick*5, thick*5), py + random(-thick*5, thick*5));
    fill(col);
    ellipse(x, y, thick * 0.5);
  }
}

function createUI() {
  let panel = createDiv().style('position','fixed').style('top','20px').style('left','20px')
                         .style('background','rgba(0,0,0,0.85)').style('padding','20px')
                         .style('border-radius','10px').style('color','white').style('font-family','sans-serif')
                         .style('z-index', '100');

  createLabel('COLOR', panel);
  colorPicker = createColorPicker('#ff0055').parent(panel);
  
  createLabel('<br>THICKNESS', panel);
  thicknessSlider = createSlider(1, 30, 5).parent(panel);

  createLabel('<br>SYMMETRY', panel);
  symmetrySlider = createSlider(2, 24, 8, 1).parent(panel);

  createLabel('<br>BRUSH TYPE', panel);
  brushSelector = createSelect().parent(panel);
  brushSelector.option('Classic');
  brushSelector.option('Sparkle');
  brushSelector.option('Calligraphy');
  brushSelector.option('Neon Fur');
  brushSelector.option('Rainbow');
  brushSelector.option('Mirror Web');

  createLabel('<br><br>', panel);
  clearButton = createButton('RESET CANVAS').parent(panel).mousePressed(() => background(15));
  clearButton.style('background','#444').style('color','white').style('border','none').style('padding','8px 15px').style('width','100%');

  createLabel('<br>', panel);
  saveJpegButton = createButton('SAVE JPG').parent(panel).mousePressed(() => saveCanvas('art', 'jpg'));
  saveJpegButton.style('background','#007bff').style('color','white').style('border','none').style('padding','8px 15px').style('margin-top','10px').style('width','100%');

  createLabel('<br>', panel);
  saveGifButton = createButton('SAVE GIF (5s)').parent(panel).mousePressed(() => {
      recordingCountdown = 300; 
      saveGif('mandala_anim', 5);
  });
  saveGifButton.style('background','#ff0050').style('color','white').style('border','none').style('padding','8px 15px').style('margin-top','10px').style('width','100%');
}

function createLabel(txt, p) { createSpan(txt).parent(p).style('font-size','12px').style('font-weight','bold'); }

function handleRecordingUI() {
    if (recordingCountdown > 0) {
        push();
        fill(255, 0, 0, map(sin(frameCount * 10), -1, 1, 100, 255));
        noStroke();
        ellipse(width - 40, 40, 20, 20);
        pop();
        recordingCountdown--;
    }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  background(15);
}
