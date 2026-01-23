// WUP 25-26
// Luca Neugebauer

let imgStart, imgGoal;
let pixelsStart = [];
let pixelsGoal = [];
let state = 'UI'; 
let resolutionSld, canvasSld, totalSld;
let resolution= 4

// Timing: 1s static + 7s transition + 1s static = 9s total
let totalDuration = 9; 
let fps = 24;
let totalFrames = totalDuration * fps;
let currentFrame = 0;
let recordedGifBlob; 

function setup() {
  createCanvas(windowWidth, windowHeight);
  setupUI();
  frameRate(fps);
}

function setupUI() {
  let uiDiv = createDiv('').id('ui-container');
  uiDiv.style('display', 'flex');
  uiDiv.style('flex-direction', 'column');
  uiDiv.style('gap', '10px');
  uiDiv.position(width / 2 - 100, height / 2 - 50);
 

  createFileInput(handleStartImg).parent(uiDiv);
  createFileInput(handleGoalImg).parent(uiDiv);
  
  resolutionSld=createSlider(1, 20, 5, 1).parent(uiDiv);
  resolutionSld.position (0,110);
  
  canvasSld=createSlider(100, 1000, 400, 1).parent(uiDiv);
  canvasSld.position (0,90);
  
 totalSld=createSlider(5, 20, 9, 1).parent(uiDiv);
 totalSld.position (0,130);
   
  let btnDone = createButton('Start & Record GIF').parent(uiDiv);
  btnDone.mousePressed(() => {
    if (imgStart && imgGoal) {
      
      canvasSize = canvasSld.value();
      resolution = resolutionSld.value();
      totalDuration = totalSld.value();
     
      
      // Re-initialize canvas and timing
      resizeCanvas(canvasSize, canvasSize);
      frameRate(fps);
      totalFrames = totalDuration * fps;
      
      processImages();
      uiDiv.hide();
      state = 'ANIMATING';
      
      // b) Automatically start capturing the GIF for 9 seconds
      saveGif('my-animation', totalDuration);
    } else {
      alert("Please upload both images!");
    }
  });
}

function handleStartImg(file) { if (file.type === 'image') imgStart = loadImage(file.data); }
function handleGoalImg(file) { if (file.type === 'image') imgGoal = loadImage(file.data); }

function processImages() {
  pixelsStart = extractPixels(imgStart);
  pixelsGoal = extractPixels(imgGoal);
  
  // Sort by brightness for smooth visual flow
  pixelsStart.sort((a, b) => brightness(a.col) - brightness(b.col));
  pixelsGoal.sort((a, b) => brightness(a.col) - brightness(b.col));
}



function draw() {
  background(255);
  let resolution= resolutionSld.value
  let canvasSize = canvasSld.value

  if (state === 'UI') {
    textAlign(CENTER);
    text("Upload Images to Begin", width / 2, height / 2 - 70);
    text(('RESOLUTION px '+resolutionSld.value()),width / 2 + 100, height / 2 +75);
      text('CANVAS SIZE '+canvasSld.value(),width / 2 + 100, height / 2 +55);
          text('GIF DURATION '+totalSld.value(),width / 2 + 100, height / 2 +95);
  } 
  
  else if (state === 'ANIMATING') {
    background(255,0.0)
    let t = currentFrame / totalFrames; 
    let moveProgress = 0;

    // NEW TIMING LOGIC (9 seconds total):
    // 0s to 1s (t: 0.0 to 0.11): Static Start
    // 1s to 8s (t: 0.11 to 0.89): 7s Transition
    // 8s to 9s (t: 0.89 to 1.0): Static End
    
    if (t < 0.11) {
      moveProgress = 0;
    } else if (t > 0.89) {
      moveProgress = 1;
    } else {
      moveProgress = map(t, 0.11, 0.89, 0, 1);
      // Smoother Easing (Cubic)
      moveProgress = moveProgress * moveProgress * (3 - 2 * moveProgress);
    }

    renderPixels(moveProgress);

    currentFrame++;
    if (currentFrame >= totalFrames) {
      state = 'FINISHED';
      createDownloadButton();
    }
  }
}


// pixels aus bild raus
function extractPixels(img) {
  let tempArr = [];
  let s = min(img.width, img.height);
  let xOff = (img.width - s) / 2;
  let yOff = (img.height - s) / 2;

  for (let y = 0; y < canvasSize; y += resolution) {
    for (let x = 0; x < canvasSize; x += resolution) {
      let imgX = floor(map(x, 0, canvasSize, xOff, xOff + s));
      let imgY = floor(map(y, 0, canvasSize, yOff, yOff + s));
      let col = img.get(imgX, imgY);
      tempArr.push({ x, y, col, startX: x, startY: y });
    }
  }
  return tempArr;
}


function renderPixels(prog) {
  noStroke();
  for (let i = 0; i < pixelsStart.length; i++) {
    let p1 = pixelsStart[i];
    let p2 = pixelsGoal[i];
    
    // We move from their grid positions (p1.startX/Y) to the goal's grid positions (p2.startX/Y)
    let x = lerp(p1.startX, p2.startX, prog);
    let y = lerp(p1.startY, p2.startY, prog);
    let c = p1.col
    
    fill(c);
    rect(x, y, resolution, resolution);
  }
}

function createDownloadButton() {
  // Since saveGif handles the download automatically in the background 
  // once the duration is met, we inform the user here.
  let msg = createP('Animation Complete. The GIF will be downloaded automatically.');
  msg.position(width / 2 - 140, height + 10);

 
}