let img; // Main image
let particleImg; // Image used as a "brush"
let inputCarica, inputParticle;
let sliderSgrana, selectTexture, checkBN, cpChiaro, cpScuro, btnSalva, btnToggle, checkRotate;
let guiVisibile = true;
let guiContenitore;
let imgX = 0, imgY = 0, imgW = 0, imgH = 0;

function setup() {
  pixelDensity(2); // High-resolution sharp edges
  createCanvas(windowWidth, windowHeight);
  
  // GUI Container
  guiContenitore = createDiv('').style('position', 'fixed').style('top', '10px').style('right', '10px').style('background', 'rgba(0,0,0,0.85)').style('padding', '15px').style('color', 'white').style('border-radius', '8px').style('font-family', 'monospace').style('width', '220px').style('max-height', '90vh').style('overflow-y', 'auto').style('z-index', '100');
  
  btnToggle = createButton('Toggle UI').position(20, height - 40).mousePressed(() => {
    guiVisibile = !guiVisibile;
    guiContenitore.style('display', guiVisibile ? 'block' : 'none');
  });

  // Controls
  creaLabel("RASTER SIZE:", guiContenitore);
  sliderSgrana = createSlider(5, 100, 20, 1).parent(guiContenitore).style('width', '100%');
  
  creaLabel("TEXTURE TYPE:", guiContenitore);
  selectTexture = createSelect().parent(guiContenitore).style('width', '100%');
  selectTexture.option('Cerchi');
  selectTexture.option('Quadrati');
  selectTexture.option('Linee');
  selectTexture.option('Croci');
  selectTexture.option('Triangoli');
  selectTexture.option('Custom Image');

  creaLabel("RANDOM ROTATION:", guiContenitore);
  checkRotate = createCheckbox('Active', false).parent(guiContenitore);

  creaLabel("PROCESS B&W:", guiContenitore);
  checkBN = createCheckbox('Apply Palette', true).parent(guiContenitore);

  creaLabel("BRIGHT COLOR:", guiContenitore);
  cpChiaro = createColorPicker('#00ffff').parent(guiContenitore);
  
  creaLabel("DARK COLOR:", guiContenitore);
  cpScuro = createColorPicker('#000000').parent(guiContenitore);

  creaLabel("UPLOAD PARTICLE (For Custom):", guiContenitore);
  inputParticle = createFileInput(handleParticle).parent(guiContenitore);

  btnSalva = createButton('EXPORT PNG').parent(guiContenitore).style('margin-top', '20px').style('width', '100%').mousePressed(() => saveCanvas('raster_art', 'png'));

  // Main Image Upload
  let uploadDiv = createDiv('MAIN IMAGE: ').position(20, 20).style('color', 'white').style('font-family', 'monospace');
  inputCarica = createFileInput(gestisciFile).parent(uploadDiv);
  
  noStroke();
}

function creaLabel(testo, parent) {
  createSpan(testo).parent(parent).style('font-size', '10px').style('display', 'block').style('margin-top', '10px').style('color', '#0f0');
}

function gestisciFile(file) {
  if (file.type === 'image') {
    img = loadImage(file.data, () => {
      calculateFit();
    });
  }
}

function handleParticle(file) {
  if (file.type === 'image') {
    particleImg = loadImage(file.data);
  }
}

function calculateFit() {
  let ratio = img.width / img.height;
  if (width / height > ratio) {
    imgH = height;
    imgW = height * ratio;
  } else {
    imgW = width;
    imgH = width / ratio;
  }
  imgX = (width - imgW) / 2;
  imgY = (height - imgH) / 2;
}

function draw() {
  background(cpScuro.color());

  if (!img) {
    fill(0, 255, 0);
    textAlign(CENTER);
    text("[ SYSTEM READY: UPLOAD IMAGE TO START ]", width/2, height/2);
    return;
  }

  let passo = sliderSgrana.value();
  
  for (let y = 0; y < imgH; y += passo) {
    for (let x = 0; x < imgW; x += passo) {
      let imgPx = floor(map(x, 0, imgW, 0, img.width));
      let imgPy = floor(map(y, 0, imgH, 0, img.height));
      
      let pix = img.get(imgPx, imgPy);
      let lum = (red(pix) + green(pix) + blue(pix)) / 3;
      
      let finalColor;
      if (checkBN.checked()) {
        finalColor = lerpColor(cpScuro.color(), cpChiaro.color(), lum/255);
      } else {
        finalColor = color(pix);
      }

      disegnaRaster(imgX + x + passo/2, imgY + y + passo/2, passo, lum, finalColor);
    }
  }
}

function disegnaRaster(x, y, d, lum, c) {
  push();
  translate(x, y);
  
  if (checkRotate.checked()) {
    rotate(random(TWO_PI)); 
  }

  let t = selectTexture.value();
  let s = map(lum, 0, 255, d * 0.1, d * 1.1);

  // Apply the color to both fill (for shapes) and stroke (for lines/crosses)
  fill(c);
  stroke(c);

  if (t === 'Cerchi') {
    noStroke();
    ellipse(0, 0, s);
  } else if (t === 'Quadrati') {
    noStroke();
    rectMode(CENTER);
    rect(0, 0, s);
  } else if (t === 'Linee') {
    strokeWeight(map(lum, 0, 255, 1, d/3));
    line(-d/2, 0, d/2, 0);
  } else if (t === 'Croci') {
    // FIX: Crosses now use the calculated finalColor 'c' via stroke()
    strokeWeight(d * 0.15); 
    line(-s/2, 0, s/2, 0);
    line(0, -s/2, 0, s/2);
  } else if (t === 'Triangoli') {
    noStroke();
    triangle(0, -s/2, -s/2, s/2, s/2, s/2);
  } else if (t === 'Custom Image' && particleImg) {
    noStroke();
    imageMode(CENTER);
    image(particleImg, 0, 0, s, s);
  }
  pop();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  if (img) calculateFit();
}