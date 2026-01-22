//WUP 2025-26
//Hristina Kukusheva

/* 
  p5.js — Gatto arcobaleno controllabile
  Versione pulita senza GIF, con orientamento e inclinazione.
*/

let stars = [];
let trail = [];
let cat = { pos: null, dir: 1, scale: 1.0 };
let paused = false;
let t = 0;

// Movimento manuale
let manualControl = false;
let speed = 4;

const starCount   = 200;
const trailMaxLen = 120;
const rainbow     = ['#ff0000','#ff7f00','#ffff00','#00ff00','#0000ff','#4b0082','#8b00ff'];

function setup() {
  createCanvas(800, 600);
  rectMode(CENTER);
  noStroke();
  frameRate(60);

  cat.pos = createVector(-200, height * 0.5);
  trail = [];
  initStars();
}

function initStars() {
  stars = [];
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: random(width),
      y: random(height),
      z: random(0.25, 1.25),
      r: random(0.5, 2.2)
    });
  }
}

function draw() {
  background(5, 5, 15);

  // Stelle con parallax
  for (let s of stars) {
    const tw = sin((frameCount * 0.02 + s.x + s.y) * s.z) * 0.5 + 0.5;
    fill(200 + 55 * tw, 200 + 55 * tw, 255);
    circle(s.x, s.y, s.r * (0.7 + 0.6 * tw));
    s.x -= 0.8 * 0.25 * s.z;
    if (s.x < -5) { s.x = width + 5; s.y = random(height); }
  }

  if (!paused) {
    t += 0.02;

    // Movimento manuale
    let moving = false;

    if (keyIsDown(LEFT_ARROW))  { 
      cat.pos.x -= speed; 
      cat.dir = -1; 
      moving = true;
    }
    if (keyIsDown(RIGHT_ARROW)) { 
      cat.pos.x += speed; 
      cat.dir = 1; 
      moving = true;
    }
    if (keyIsDown(UP_ARROW))    { 
      cat.pos.y -= speed; 
      moving = true;
    }
    if (keyIsDown(DOWN_ARROW))  { 
      cat.pos.y += speed; 
      moving = true;
    }

    // Movimento automatico se non premi nulla
    if (!moving) {
      const bob  = sin(t * 1.6) * 0.6;
      const sway = sin(t * 0.9) * 0.3;
      cat.pos.y += bob;
      cat.pos.x += 3.2 * (1 + sway * 0.02);

      const margin = 240;
      if (cat.pos.x - margin > width) {
        cat.pos.x = -margin;
        trail = [];
      }
    }
  }

  // Punto coda
  const butt = getCatButtPoint(cat.pos.x, cat.pos.y, cat.dir, cat.scale);

  // Aggiorna trail
  const onScreen = cat.pos.x > -260 && cat.pos.x < width + 260 &&
                   cat.pos.y > -60 && cat.pos.y < height + 60;

  if (onScreen && !paused) {
    trail.push(createVector(butt.x, butt.y));
    if (trail.length > trailMaxLen) trail.shift();
  }

  drawRainbowTrail();
  drawCat(cat.pos.x, cat.pos.y, cat.dir, cat.scale);
}

function getCatButtPoint(cx, cy, dir = 1, s = 1.0) {
  const bodyW = 120 * s, bodyH = 70 * s;
  const xOffset = -dir * (bodyW * 0.55);
  const yOffset = bodyH * 0.08;
  return { x: cx + xOffset, y: cy + yOffset };
}

function drawRainbowTrail() {
  if (trail.length < 2) return;
  const totalWidth = 42 * cat.scale;
  const stripeH = totalWidth / rainbow.length;

  for (let i = 1; i < trail.length; i++) {
    const p0 = trail[i - 1], p1 = trail[i];
    const tseg = i / trail.length;
    const alpha = map(tseg, 0, 1, 40, 200);
    const dx = p1.x - p0.x, dy = p1.y - p0.y;
    const len = max(1, sqrt(dx * dx + dy * dy));
    const nx = -dy / len, ny = dx / len;

    for (let c = 0; c < rainbow.length; c++) {
      const w0 = (c - rainbow.length / 2) * stripeH;
      const w1 = w0 + stripeH;
      const a0 = { x: p0.x + nx * w0, y: p0.y + ny * w0 };
      const a1 = { x: p0.x + nx * w1, y: p0.y + ny * w1 };
      const b0 = { x: p1.x + nx * w0, y: p1.y + ny * w0 };
      const b1 = { x: p1.x + nx * w1, y: p1.y + ny * w1 };
      const col = color(rainbow[c]); col.setAlpha(alpha);
      fill(col); noStroke();
      quad(a0.x, a0.y, a1.x, a1.y, b1.x, b1.y, b0.x, b0.y);
    }
  }

  // Scintille
  const sp = trail[trail.length - 1];
  for (let k = 0; k < 8; k++) {
    const rr = color(random(rainbow)); rr.setAlpha(180);
    fill(rr);
    const ang = random(TWO_PI), d = random(1, 8) * cat.scale;
    circle(sp.x + cos(ang) * d, sp.y + sin(ang) * d, random(1, 3) * cat.scale);
  }
}

function drawCat(cx, cy, dir = 1, s = 1.0) {
  push();
  translate(cx, cy); 
  scale(dir * s, s);

  // Inclinazione in base al movimento verticale
  let tilt = 0;
  if (keyIsDown(UP_ARROW)) tilt = -0.25;
  if (keyIsDown(DOWN_ARROW)) tilt = 0.25;
  rotate(tilt);

  // Corpo
  fill(200, 200, 210);
  const bodyW = 120, bodyH = 70, bodyR = 18;
  rect(0, 0, bodyW, bodyH, bodyR);

  // Zampe
  fill(185, 185, 195);
  rect(-bodyW * 0.22, bodyH * 0.45, 12, 26, 4);
  rect(bodyW * 0.05, bodyH * 0.45, 12, 26, 4);

  // Coda
  push();
  translate(-bodyW * 0.45, -bodyH * 0.05);
  rotate(-0.2 + sin(t * 2.1) * 0.3);
  fill(200, 200, 210);
  rect(0, 0, 50, 12, 6);
  pop();

  // Testa
  push();
  translate(bodyW * 0.45, -bodyH * 0.05);
  fill(210, 210, 220);
  rect(0, 0, 60, 55, 14);

  // Orecchie
  fill(200, 200, 210);
  triangle(-28, -22, -8, -40, 4, -20);
  triangle(28, -22, 8, -40, -4, -20);
  fill(255, 180, 200);
  triangle(-18, -22, -7, -32, 2, -22);
  triangle(18, -22, 7, -32, -2, -22);

  // Occhi
  fill(40);
  ellipse(-12, -4, 8, 10);
  ellipse(12, -4, 8, 10);

  // Guance
  fill(255, 170, 190, 160);
  ellipse(-20, 10, 10, 6);
  ellipse(20, 10, 10, 6);

  // Naso
  fill(255, 120, 130);
  triangle(-4, 4, 4, 4, 0, 8);

  // Baffi
  stroke(60);
  strokeWeight(1.5);
  line(-24, 8, -40, 6);
  line(-24, 12, -40, 14);
  line(24, 8, 40, 6);
  line(24, 12, 40, 14);
  noStroke();
  pop();

  // Pulsazione dietro
  const butt = getCatButtPoint(0, 0, 1, 1);
  push();
  translate(butt.x, butt.y);
  fill(255, 240, 240, 180);
  ellipse(0, 0, (5 + sin(t * 10) * 2) * 0.8);
  pop();

  pop();
}
