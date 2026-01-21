//WUP 25/26
//Leo Longhin

let font;
let points = [];
let textInput;
let fileInput; 
let sColor, sSpacing, sFreq, sSpeed, sTextSize, sDotSize, checkRainbow, checkTransparent;

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 360, 100, 100);
  
  let uiX = 20;
  
  // Font Upload
  let uploadLabel = createP('1. Upload Font (.ttf/.otf)');
  uploadLabel.position(uiX, 0).style('color', 'white').style('font-weight', 'bold');
  fileInput = createFileInput(handleFile);
  fileInput.position(uiX, 35);

  // Text Input
  textInput = createInput('RAINBOW');
  textInput.position(uiX, 70);
  
  // Transparency Toggle
  checkTransparent = createCheckbox(' Transparent Background', false);
  checkTransparent.position(uiX, 100).style('color', 'white');

  // Sliders
  createP('Base Color').position(uiX, 120).style('color', 'white');
  sColor = createSlider(0, 360, 180);
  sColor.position(uiX, 150);

  checkRainbow = createCheckbox(' Rainbow Mode', true);
  checkRainbow.position(uiX, 180).style('color', 'white');

  createP('Spacing (Density)').position(uiX, 200).style('color', 'white');
  sSpacing = createSlider(0.05, 0.3, 0.1, 0.01);
  sSpacing.position(uiX, 230);

  createP('Wave Frequency').position(uiX, 250).style('color', 'white');
  sFreq = createSlider(0, 0.5, 0.1, 0.01);
  sFreq.position(uiX, 280);

  createP('Wave Speed').position(uiX, 300).style('color', 'white');
  sSpeed = createSlider(0, 10, 3);
  sSpeed.position(uiX, 330);

  createP('Text Size').position(uiX, 350).style('color', 'white');
  sTextSize = createSlider(40, 400, 150);
  sTextSize.position(uiX, 380);

  createP('Dot Size').position(uiX, 400).style('color', 'white');
  sDotSize = createSlider(1, 15, 5);
  sDotSize.position(uiX, 430);

  // Export Buttons
  let btnPng = createButton('Save PNG');
  btnPng.position(uiX, 480);
  btnPng.mousePressed(() => saveCanvas('typing_art', 'png'));

  let btnGif = createButton('Save 5s GIF');
  btnGif.position(uiX, 510);
  btnGif.mousePressed(() => saveGif('typing_art_loop', 3));
}

function handleFile(file) {
  if (file.name.endsWith('.ttf') || file.name.endsWith('.otf')) {
    // We pass a callback function to ensure we know when it's done loading
    font = loadFont(file.data, () => {
       console.log("Font loaded successfully!");
    });
  } else {
    alert('Please upload a valid .ttf or .otf font file.');
  }
}

function draw() {
  if (checkTransparent.checked()) {
    clear();
  } else {
    background(0);
  }
  
  // CRITICAL FIX: Check if font exists AND if the internal font data is ready
  if (font && font.font) {
    try {
      points = font.textToPoints(
        textInput.value(), 
        300, 
        height / 2, 
        sTextSize.value(), 
        { sampleFactor: sSpacing.value() }
      );

      for (let i = 0; i < points.length; i++) {
        let p = points[i];
        let wave = sin(frameCount * sSpeed.value() * 0.05 + i * sFreq.value()) * 30;
        
        if (checkRainbow.checked()) {
          let hueVal = (sColor.value() + i * 2) % 360; 
          fill(hueVal, 80, 100);
        } else {
          fill(sColor.value(), 80, 100);
        }
        
        noStroke();
        ellipse(p.x, p.y + wave, sDotSize.value());
      }
    } catch (e) {
      // Catch any momentary errors during font switching
      console.log("Waiting for glyphs...");
    }
  } 
  else {
    // Show instruction screen
    fill(255);
    noStroke();
    textSize(20);
    textAlign(LEFT);
    text("← Please upload a .ttf or .otf font file.", 300, height / 2);
    
    textSize(14);
    fill(200);
    text("The 'textToPoints' function requires a physical font file to calculate dots.", 300, height / 2 + 40);
    text("Tip: You can usually find fonts in C:/Windows/Fonts or /Library/Fonts.", 300, height / 2 + 60);
  }
}