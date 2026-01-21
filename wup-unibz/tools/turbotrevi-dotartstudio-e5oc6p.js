(() => {
  // ============================================================
  // DOT ART STUDIO — TITLE UPDATE (DOTS ONLY, NO OUTLINE)
  // - Title rendered ONLY with dense dots (no stroke/lines).
  // Everything else unchanged.
  // ============================================================

  const APP_W = 960;
  const APP_H = 640;
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  const FONT_STACK = "system-ui, -apple-system, Segoe UI, Roboto, Arial";

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  function luminance(r, g, b) { return 0.2126 * r + 0.7152 * g + 0.0722 * b; }
  function applyGamma(v, gamma) { const n = v / 255; return Math.pow(n, gamma) * 255; }
  function fitContain(iw, ih, ow, oh) {
    const s = Math.min(ow / iw, oh / ih);
    return { w: iw * s, h: ih * s, x: (ow - iw * s) / 2, y: (oh - ih * s) / 2 };
  }
  function downloadText(filename, text, mime = "text/plain") {
    const blob = new Blob([text], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.download = filename; a.href = url; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 300);
  }
  function downloadCanvasPNG(canvas) {
    const a = document.createElement("a");
    a.download = "dot-art.png";
    a.href = canvas.toDataURL("image/png");
    a.click();
  }

  document.body.style.margin = "0";
  document.body.style.background = "#f3f4f7";

  const root = document.createElement("div");
  root.style.maxWidth = (APP_W + 520) + "px";
  root.style.margin = "18px auto";
  root.style.padding = "16px";
  root.style.fontFamily = FONT_STACK;
  root.style.color = "#111";

  const header = document.createElement("div");
  header.style.display = "flex";
  header.style.justifyContent = "space-between";
  header.style.alignItems = "center";
  header.style.gap = "12px";
  header.style.marginBottom = "12px";

  // ---------- NEW dotted title (dots ONLY, no outline) ----------
  // We create a text mask (offscreen canvas) then render a dense dot field where the text pixels are "on".
  function makeDottedTitle(text) {
    const wrap = document.createElement("div");
    wrap.style.display = "flex";
    wrap.style.alignItems = "center";
    wrap.style.gap = "10px";

    const c = document.createElement("canvas");
    const W = 360, H = 56;
    c.width = W * dpr;
    c.height = H * dpr;
    c.style.width = W + "px";
    c.style.height = H + "px";
    // important: transparent background, only dots
    const g = c.getContext("2d", { willReadFrequently: true });
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, W, H);

    // --- build text mask on offscreen ---
    const m = document.createElement("canvas");
    m.width = W;
    m.height = H;
    const mg = m.getContext("2d", { willReadFrequently: true });
    mg.clearRect(0, 0, W, H);

    // Bigger title than before, bold
    mg.fillStyle = "#000";
    mg.textBaseline = "alphabetic";
    mg.font = `900 34px ${FONT_STACK}`;
    // place nicely
    const x = 0;
    const y = 40;
    mg.fillText(text, x, y);

    const data = mg.getImageData(0, 0, W, H).data;

    // --- render dense dots only where text is present ---
    // Dot density: smaller step => denser dots
    const step = 4;          // density control (smaller = denser)
    const r = 1.35;          // dot radius
    const threshold = 8;     // alpha threshold for mask
    g.fillStyle = "#111";

    for (let yy = 0; yy < H; yy += step) {
      for (let xx = 0; xx < W; xx += step) {
        const ix = ((yy | 0) * W + (xx | 0)) * 4;
        const a = data[ix + 3];
        if (a <= threshold) continue;

        // slight jitter makes it feel "dotty" not grid-perfect
        const jx = (Math.random() * 2 - 1) * 0.6;
        const jy = (Math.random() * 2 - 1) * 0.6;

        g.beginPath();
        g.arc(xx + 0.5 + jx, yy + 0.5 + jy, r, 0, Math.PI * 2);
        g.fill();
      }
    }

    wrap.appendChild(c);
    return wrap;
  }

  const titleWrap = makeDottedTitle("Dot Art Studio");

  const hint = document.createElement("div");
  hint.textContent = "Drag per pan • S PNG • Ctrl/Cmd+S SVG";
  hint.style.fontSize = "12px";
  hint.style.opacity = "0.7";
  hint.style.whiteSpace = "nowrap";

  header.appendChild(titleWrap);
  header.appendChild(hint);

  // ---------- Layout ----------
  const layout = document.createElement("div");
  layout.style.display = "grid";
  layout.style.gridTemplateColumns = "420px 1fr";
  layout.style.gap = "14px";
  layout.style.alignItems = "start";

  const controls = document.createElement("div");
  controls.style.background = "#fff";
  controls.style.border = "1px solid rgba(0,0,0,.10)";
  controls.style.borderRadius = "14px";
  controls.style.padding = "12px";
  controls.style.position = "sticky";
  controls.style.top = "12px";
  controls.style.maxHeight = "calc(100vh - 44px)";
  controls.style.overflow = "auto";

  const stageWrap = document.createElement("div");
  stageWrap.style.display = "grid";
  stageWrap.style.placeItems = "center";
  stageWrap.style.gap = "10px";

  const stageTopBar = document.createElement("div");
  stageTopBar.style.width = APP_W + "px";
  stageTopBar.style.display = "flex";
  stageTopBar.style.justifyContent = "flex-end";
  stageTopBar.style.alignItems = "center";
  stageTopBar.style.gap = "8px";

  const mkBtn = (txt) => {
    const b = document.createElement("button");
    b.textContent = txt;
    b.style.padding = "8px 10px";
    b.style.borderRadius = "10px";
    b.style.border = "1px solid rgba(0,0,0,.12)";
    b.style.background = "#fff";
    b.style.cursor = "pointer";
    return b;
  };

  const btnResetView = mkBtn("Reset view");
  const btnPNG = mkBtn("Export PNG");
  const btnSVG = mkBtn("Export SVG");

  stageTopBar.appendChild(btnResetView);
  stageTopBar.appendChild(btnPNG);
  stageTopBar.appendChild(btnSVG);

  const canvas = document.createElement("canvas");
  canvas.width = APP_W * dpr;
  canvas.height = APP_H * dpr;
  canvas.style.width = APP_W + "px";
  canvas.style.height = APP_H + "px";
  canvas.style.background = "#fff";
  canvas.style.borderRadius = "16px";
  canvas.style.boxShadow = "0 12px 40px rgba(0,0,0,.10)";
  canvas.style.border = "1px solid rgba(0,0,0,.08)";
  canvas.style.cursor = "grab";

  stageWrap.appendChild(stageTopBar);
  stageWrap.appendChild(canvas);

  layout.appendChild(controls);
  layout.appendChild(stageWrap);

  root.appendChild(header);
  root.appendChild(layout);
  document.body.appendChild(root);

  // Responsive
  const style = document.createElement("style");
  style.textContent = `
    @media (max-width: 1240px) {
      .das-layout { grid-template-columns: 1fr !important; }
      .das-controls { position: relative !important; top: auto !important; max-height: none !important; overflow: visible !important; }
      .das-stageTop { width: 100% !important; justify-content: space-between !important; }
      .das-canvas { width: 100% !important; height: auto !important; }
    }
  `;
  document.head.appendChild(style);
  layout.className = "das-layout";
  controls.className = "das-controls";
  stageTopBar.className = "das-stageTop";
  canvas.className = "das-canvas";

  // ---------- Help tooltip (same font) ----------
  const helpPop = document.createElement("div");
  helpPop.style.position = "fixed";
  helpPop.style.maxWidth = "340px";
  helpPop.style.background = "#111";
  helpPop.style.color = "#fff";
  helpPop.style.padding = "10px 12px";
  helpPop.style.borderRadius = "12px";
  helpPop.style.boxShadow = "0 12px 40px rgba(0,0,0,.25)";
  helpPop.style.fontFamily = FONT_STACK;
  helpPop.style.fontSize = "12px";
  helpPop.style.lineHeight = "1.35";
  helpPop.style.zIndex = "999999";
  helpPop.style.display = "none";

  const helpTitle = document.createElement("div");
  helpTitle.style.fontWeight = "800";
  helpTitle.style.marginBottom = "6px";

  const helpBody = document.createElement("div");
  helpPop.appendChild(helpTitle);
  helpPop.appendChild(helpBody);
  document.body.appendChild(helpPop);

  function showHelp(anchorEl, title, body) {
    helpTitle.textContent = title;
    helpBody.textContent = body;
    helpPop.style.display = "block";

    const r = anchorEl.getBoundingClientRect();
    const pad = 10;
    let x = r.right + 10;
    let y = r.top;

    const maxX = window.innerWidth - 360;
    x = Math.min(x, maxX);
    y = Math.min(y, window.innerHeight - 200);
    x = Math.max(pad, x);
    y = Math.max(pad, y);

    helpPop.style.left = x + "px";
    helpPop.style.top = y + "px";
  }
  function hideHelp() { helpPop.style.display = "none"; }

  window.addEventListener("mousedown", (e) => {
    if (helpPop.style.display === "none") return;
    if (helpPop.contains(e.target)) return;
    if (e.target && e.target.dataset && e.target.dataset.isHelpBtn === "1") return;
    hideHelp();
  });

  function mkHelpBtn(title, body) {
    const b = document.createElement("button");
    b.textContent = "?";
    b.dataset.isHelpBtn = "1";
    b.style.width = "26px";
    b.style.height = "26px";
    b.style.borderRadius = "999px";
    b.style.border = "1px solid rgba(0,0,0,.14)";
    b.style.background = "#fff";
    b.style.cursor = "pointer";
    b.style.fontWeight = "900";
    b.style.lineHeight = "1";
    b.style.opacity = "0.9";
    b.addEventListener("mousedown", (e) => e.stopPropagation());
    b.addEventListener("click", (e) => {
      e.stopPropagation();
      if (helpPop.style.display === "block") hideHelp();
      else showHelp(b, title, body);
    });
    return b;
  }

  const hr = () => {
    const h = document.createElement("hr");
    h.style.opacity = "0.12";
    h.style.margin = "12px 0";
    return h;
  };

  const mkTitle = (text) => {
    const t = document.createElement("div");
    t.textContent = text;
    t.style.fontSize = "12px";
    t.style.fontWeight = "800";
    t.style.opacity = "0.85";
    t.style.margin = "6px 0 8px";
    return t;
  };

  function mkRow(labelText, rightEl, helpTitleText = "", helpText = "") {
    const row = document.createElement("div");
    row.style.display = "grid";
    row.style.gridTemplateColumns = "1fr auto auto";
    row.style.alignItems = "center";
    row.style.gap = "10px";
    row.style.margin = "8px 0";

    const l = document.createElement("div");
    l.textContent = labelText;
    l.style.fontSize = "12px";
    l.style.opacity = "0.85";

    const helpBtn = mkHelpBtn(helpTitleText || labelText, helpText || "—");
    row.appendChild(l);
    row.appendChild(rightEl);
    row.appendChild(helpBtn);
    return row;
  }

  function mkSlider(label, min, max, step, value, suffix = "", helpTitleText = "", helpText = "") {
    const wrap = document.createElement("div");
    wrap.style.display = "grid";
    wrap.style.gap = "6px";
    wrap.style.margin = "8px 0";

    const top = document.createElement("div");
    top.style.display = "grid";
    top.style.gridTemplateColumns = "1fr auto auto";
    top.style.alignItems = "center";
    top.style.gap = "10px";

    const lab = document.createElement("div");
    lab.textContent = label;
    lab.style.fontSize = "12px";
    lab.style.opacity = "0.85";

    const val = document.createElement("div");
    val.textContent = String(value) + suffix;
    val.style.fontSize = "12px";
    val.style.fontWeight = "800";

    const helpBtn = mkHelpBtn(helpTitleText || label, helpText || "—");

    const s = document.createElement("input");
    s.type = "range";
    s.min = String(min);
    s.max = String(max);
    s.step = String(step);
    s.value = String(value);
    s.style.width = "100%";

    top.appendChild(lab);
    top.appendChild(val);
    top.appendChild(helpBtn);
    wrap.appendChild(top);
    wrap.appendChild(s);

    return { wrap, slider: s, valueEl: val, suffix };
  }

  function mkSelect(options, value) {
    const s = document.createElement("select");
    s.style.width = "100%";
    s.style.padding = "10px 10px";
    s.style.borderRadius = "10px";
    s.style.border = "1px solid rgba(0,0,0,.12)";
    s.style.background = "#fff";
    options.forEach((opt) => {
      const o = document.createElement("option");
      o.value = opt.value;
      o.textContent = opt.label;
      s.appendChild(o);
    });
    s.value = value;
    return s;
  }

  function mkToggle(label, checked, helpTitleText = "", helpText = "") {
    const w = document.createElement("label");
    w.style.display = "flex";
    w.style.alignItems = "center";
    w.style.gap = "8px";
    w.style.fontSize = "12px";
    w.style.opacity = "0.9";
    const i = document.createElement("input");
    i.type = "checkbox";
    i.checked = checked;
    w.appendChild(i);
    w.appendChild(document.createTextNode(label));

    const row = document.createElement("div");
    row.style.display = "grid";
    row.style.gridTemplateColumns = "1fr auto";
    row.style.alignItems = "center";
    row.style.gap = "10px";
    row.style.margin = "8px 0";

    const helpBtn = mkHelpBtn(helpTitleText || label, helpText || "—");
    row.appendChild(w);
    row.appendChild(helpBtn);
    return { wrap: row, input: i };
  }

  // ---------- Rendering + rest of the app ----------
  // NOTE: Everything below is the same as your last version, unchanged,
  // except it now uses this new title rendering above.

  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const srcC = document.createElement("canvas");
  srcC.width = APP_W;
  srcC.height = APP_H;
  const srcCtx = srcC.getContext("2d", { willReadFrequently: true });

  const video = document.createElement("video");
  video.playsInline = true;
  video.muted = true;
  video.autoplay = true;
  video.setAttribute("playsinline", "true");

  let srcImg = null;
  let camStream = null;
  let sourceMode = "none";
  let needsRender = true;
  let view = { zoom: 1.0, panX: 0, panY: 0 };

  // ---------- SOURCE UI ----------
  controls.appendChild(mkTitle("Inizia da qui"));

  const sourceCard = document.createElement("div");
  sourceCard.style.border = "1px solid rgba(0,0,0,.10)";
  sourceCard.style.borderRadius = "14px";
  sourceCard.style.padding = "12px";
  sourceCard.style.background = "linear-gradient(180deg, rgba(243,244,247,0.65), rgba(255,255,255,1))";
  sourceCard.style.display = "grid";
  sourceCard.style.gap = "10px";

  const sourceHeadline = document.createElement("div");
  sourceHeadline.textContent = "Scegli una sorgente";
  sourceHeadline.style.fontWeight = "900";
  sourceHeadline.style.fontSize = "13px";
  sourceHeadline.style.opacity = "0.9";

  const sourceSub = document.createElement("div");
  sourceSub.textContent = "Carica una foto oppure usa la fotocamera. Poi regola i parametri sotto.";
  sourceSub.style.fontSize = "12px";
  sourceSub.style.opacity = "0.7";

  const file = document.createElement("input");
  file.type = "file";
  file.accept = "image/*";
  file.style.width = "100%";

  const uploadWrap = document.createElement("div");
  uploadWrap.style.display = "grid";
  uploadWrap.style.gridTemplateColumns = "1fr auto";
  uploadWrap.style.gap = "10px";
  uploadWrap.style.alignItems = "center";

  const uploadHelp = mkHelpBtn(
    "Carica immagine",
    "Scegli una foto dal computer: verrà trasformata in puntini. Se avvii la camera, la sorgente diventa live."
  );

  uploadWrap.appendChild(file);
  uploadWrap.appendChild(uploadHelp);

  const camBlock = document.createElement("div");
  camBlock.style.display = "grid";
  camBlock.style.gridTemplateColumns = "1fr 1fr";
  camBlock.style.gap = "8px";

  const mkBtn2 = mkBtn; // reuse
  const btnCamStart = mkBtn2("Avvia camera");
  const btnCamStop = mkBtn2("Stop");
  btnCamStop.disabled = true;
  btnCamStop.style.opacity = "0.65";
  camBlock.appendChild(btnCamStart);
  camBlock.appendChild(btnCamStop);

  const camOptions = document.createElement("div");
  camOptions.style.display = "grid";
  camOptions.style.gridTemplateColumns = "1fr 1fr auto";
  camOptions.style.alignItems = "center";
  camOptions.style.gap = "8px";

  const liveToggle = mkToggle(
    "Live",
    true,
    "Live",
    "Se ON: la camera aggiorna continuamente. Se OFF: usa 'Scatta frame' per congelare un frame e lavorare in statico."
  );

  const btnSnapshot = mkBtn2("Scatta frame");
  btnSnapshot.disabled = true;
  btnSnapshot.style.opacity = "0.65";

  const snapHelp = mkHelpBtn(
    "Scatta frame",
    "Congela un singolo frame della fotocamera e lo usa come immagine. Utile se Live è pesante."
  );

  camOptions.appendChild(liveToggle.wrap);
  camOptions.appendChild(btnSnapshot);
  camOptions.appendChild(snapHelp);

  const sourceState = document.createElement("div");
  sourceState.style.display = "flex";
  sourceState.style.justifyContent = "space-between";
  sourceState.style.alignItems = "center";
  sourceState.style.gap = "10px";
  sourceState.style.fontSize = "12px";
  sourceState.style.opacity = "0.75";
  sourceState.style.paddingTop = "4px";

  const sourceStateLeft = document.createElement("div");
  sourceStateLeft.textContent = "Sorgente: nessuna";

  const fpsCtl = mkSlider(
    "FPS (live)",
    5,
    30,
    1,
    12,
    "",
    "FPS (live)",
    "Quanti aggiornamenti al secondo quando la camera è in Live. Più alto = più fluido ma più pesante."
  );
  fpsCtl.wrap.style.marginTop = "6px";

  const uploadRow = document.createElement("div");
  uploadRow.style.display = "grid";
  uploadRow.style.gap = "6px";
  const ulab = document.createElement("div");
  ulab.textContent = "Carica foto";
  ulab.style.fontSize = "12px";
  ulab.style.fontWeight = "800";
  ulab.style.opacity = "0.85";
  uploadRow.appendChild(ulab);
  uploadRow.appendChild(uploadWrap);

  const camRow = document.createElement("div");
  camRow.style.display = "grid";
  camRow.style.gap = "6px";
  const clab = document.createElement("div");
  clab.textContent = "Oppure fotocamera";
  clab.style.fontSize = "12px";
  clab.style.fontWeight = "800";
  clab.style.opacity = "0.85";
  camRow.appendChild(clab);
  camRow.appendChild(camBlock);
  camRow.appendChild(camOptions);

  sourceCard.appendChild(sourceHeadline);
  sourceCard.appendChild(sourceSub);
  sourceCard.appendChild(uploadRow);
  sourceCard.appendChild(camRow);
  sourceCard.appendChild(fpsCtl.wrap);

  sourceState.appendChild(sourceStateLeft);
  sourceCard.appendChild(sourceState);

  controls.appendChild(sourceCard);
  controls.appendChild(hr());

  // ---------- View ----------
  controls.appendChild(mkTitle("View"));
  const zoomCtl = mkSlider(
    "Zoom",
    0.5,
    3.0,
    0.01,
    1.0,
    "x",
    "Zoom",
    "Ingrandisce/rimpicciolisce la sorgente (foto o camera) prima della conversione in puntini."
  );
  controls.appendChild(zoomCtl.wrap);

  controls.appendChild(hr());

  // ---------- Dots ----------
  controls.appendChild(mkTitle("Puntini"));

  const dotSizeCtl = mkSlider("Dimensione", 1, 22, 1, 3, "px", "Dimensione", "Raggio/base del puntino.");
  const spacingCtl = mkSlider("Step", 3, 34, 1, 8, "px", "Step", "Più basso = più puntini (più dettaglio) ma più lento.");
  const threshCtl = mkSlider("Threshold", 0, 255, 1, 170, "", "Threshold", "Decide dove mettere i segni.");
  const gammaCtl = mkSlider("Gamma", 0.3, 2.5, 0.05, 1.0, "", "Gamma", "Modifica il contrasto.");

  controls.appendChild(dotSizeCtl.wrap);
  controls.appendChild(spacingCtl.wrap);
  controls.appendChild(threshCtl.wrap);
  controls.appendChild(gammaCtl.wrap);

  const shapeSel = mkSelect(
    [
      { label: "Cerchi", value: "circle" },
      { label: "Quadrati", value: "square" },
      { label: "Linee", value: "line" },
    ],
    "circle"
  );
  controls.appendChild(mkRow("Forma", shapeSel, "Forma", "Tipo di segno: cerchi, quadrati o linee."));

  const jitterCtl = mkSlider("Jitter", 0, 6, 0.1, 0.0, "px", "Jitter", "Casualità nella posizione dei segni.");
  controls.appendChild(jitterCtl.wrap);

  const invertToggle = mkToggle("Inverti", false, "Inverti", "Se ON: segni dove è più chiaro invece che più scuro.");
  controls.appendChild(invertToggle.wrap);

  controls.appendChild(hr());

  // ---------- Colors ----------
  controls.appendChild(mkTitle("Colori"));

  const bgColor = document.createElement("input");
  bgColor.type = "color";
  bgColor.value = "#ffffff";
  controls.appendChild(mkRow("Sfondo", bgColor, "Sfondo", "Colore di background del risultato."));

  const paletteCount = mkSelect(
    [
      { label: "1 colore", value: "1" },
      { label: "2 colori", value: "2" },
      { label: "3 colori", value: "3" },
      { label: "4 colori", value: "4" },
    ],
    "1"
  );
  controls.appendChild(mkRow("Palette", paletteCount, "Palette", "Divide la luminanza in fasce e assegna un colore."));

  const palWrap = document.createElement("div");
  palWrap.style.display = "grid";
  palWrap.style.gap = "8px";
  palWrap.style.marginTop = "8px";

  const palInputs = Array.from({ length: 4 }, (_, i) => {
    const c = document.createElement("input");
    c.type = "color";
    c.value = ["#111111", "#555555", "#999999", "#dddddd"][i];
    return c;
  });

  function rebuildPaletteUI() {
    palWrap.innerHTML = "";
    const n = Number(paletteCount.value);
    for (let i = 0; i < n; i++) {
      palWrap.appendChild(mkRow(`Colore ${i + 1}`, palInputs[i], `Colore ${i + 1}`, "Un colore della palette (ordine scuro→chiaro)."));
    }
  }
  rebuildPaletteUI();
  controls.appendChild(palWrap);

  controls.appendChild(hr());

  // ---------- Edge ----------
  controls.appendChild(mkTitle("Edge"));

  const edgeToggle = mkToggle("Solo bordi (Sobel)", false, "Solo bordi", "Rileva contorni e mette segni sui bordi.");
  controls.appendChild(edgeToggle.wrap);

  const edgeStrengthCtl = mkSlider("Sensibilità", 0, 255, 1, 70, "", "Sensibilità bordi", "Soglia bordi: più basso = più bordi.");
  controls.appendChild(edgeStrengthCtl.wrap);

  controls.appendChild(hr());

  // ---------- Presets ----------
  controls.appendChild(mkTitle("Preset"));
  const presetGrid = document.createElement("div");
  presetGrid.style.display = "grid";
  presetGrid.style.gridTemplateColumns = "1fr 1fr";
  presetGrid.style.gap = "8px";

  const presetFine = mkBtn2("Fine");
  const presetBold = mkBtn2("Bold");
  const presetPoster = mkBtn2("Poster");
  const presetNight = mkBtn2("Night");
  const presetSketch = mkBtn2("Sketch");

  presetGrid.appendChild(presetFine);
  presetGrid.appendChild(presetBold);
  presetGrid.appendChild(presetPoster);
  presetGrid.appendChild(presetNight);
  presetGrid.appendChild(presetSketch);
  controls.appendChild(presetGrid);

  // ---------- Engine ----------
  function getPaletteColors() {
    const n = Number(paletteCount.value);
    return palInputs.slice(0, n).map((x) => x.value);
  }
  function pickColorByLum(lum255, colors, inv) {
    let t = lum255 / 255;
    if (inv) t = 1 - t;
    const n = colors.length;
    if (n === 1) return colors[0];
    const idx = clamp(Math.floor(t * n), 0, n - 1);
    return colors[idx];
  }
  function computeEdgeMask(lumData, w, h) {
    const out = new Uint8Array(w * h);
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const a00 = lumData[(y - 1) * w + (x - 1)];
        const a01 = lumData[(y - 1) * w + (x)];
        const a02 = lumData[(y - 1) * w + (x + 1)];
        const a10 = lumData[(y) * w + (x - 1)];
        const a12 = lumData[(y) * w + (x + 1)];
        const a20 = lumData[(y + 1) * w + (x - 1)];
        const a21 = lumData[(y + 1) * w + (x)];
        const a22 = lumData[(y + 1) * w + (x + 1)];

        const gx = (-1 * a00) + (1 * a02) + (-2 * a10) + (2 * a12) + (-1 * a20) + (1 * a22);
        const gy = (-1 * a00) + (-2 * a01) + (-1 * a02) + (1 * a20) + (2 * a21) + (1 * a22);

        out[y * w + x] = clamp(Math.sqrt(gx * gx + gy * gy), 0, 255);
      }
    }
    return out;
  }

  function syncValueLabels() {
    dotSizeCtl.valueEl.textContent = dotSizeCtl.slider.value + dotSizeCtl.suffix;
    spacingCtl.valueEl.textContent = spacingCtl.slider.value + spacingCtl.suffix;
    threshCtl.valueEl.textContent = threshCtl.slider.value;
    gammaCtl.valueEl.textContent = Number(gammaCtl.slider.value).toFixed(2);
    jitterCtl.valueEl.textContent = Number(jitterCtl.slider.value).toFixed(1) + jitterCtl.suffix;
    zoomCtl.valueEl.textContent = Number(zoomCtl.slider.value).toFixed(2) + zoomCtl.suffix;
    fpsCtl.valueEl.textContent = fpsCtl.slider.value;
    edgeStrengthCtl.valueEl.textContent = edgeStrengthCtl.slider.value;
  }

  function setZoom(z) { view.zoom = clamp(z, 0.5, 3.0); zoomCtl.slider.value = String(view.zoom); zoomCtl.valueEl.textContent = view.zoom.toFixed(2) + zoomCtl.suffix; }
  function requestRender() { needsRender = true; if (sourceMode === "camera" && liveToggle.input.checked) return; render(); }

  function resetView() { view.panX = 0; view.panY = 0; setZoom(1.0); requestRender(); }
  btnResetView.addEventListener("click", resetView);

  // Pan drag
  let dragging = false;
  let dragStart = { x: 0, y: 0 };
  let panStart = { x: 0, y: 0 };
  canvas.addEventListener("mousedown", (e) => {
    dragging = true; canvas.style.cursor = "grabbing";
    dragStart = { x: e.clientX, y: e.clientY };
    panStart = { x: view.panX, y: view.panY };
  });
  window.addEventListener("mousemove", (e) => {
    if (!dragging) return;
    view.panX = panStart.x + (e.clientX - dragStart.x);
    view.panY = panStart.y + (e.clientY - dragStart.y);
    requestRender();
  });
  window.addEventListener("mouseup", () => { dragging = false; canvas.style.cursor = "grab"; });

  function drawSourceToOffscreen() {
    srcC.width = APP_W; srcC.height = APP_H;
    srcCtx.clearRect(0, 0, APP_W, APP_H);
    srcCtx.fillStyle = bgColor.value; srcCtx.fillRect(0, 0, APP_W, APP_H);

    if (sourceMode === "image" && srcImg) {
      const fit = fitContain(srcImg.width, srcImg.height, APP_W, APP_H);
      const zw = fit.w * view.zoom, zh = fit.h * view.zoom;
      const zx = fit.x + (fit.w - zw) / 2 + view.panX;
      const zy = fit.y + (fit.h - zh) / 2 + view.panY;
      srcCtx.drawImage(srcImg, zx, zy, zw, zh);
      return true;
    }

    if (sourceMode === "camera") {
      const ready = video.readyState >= 2 && (video.videoWidth || 0) > 0 && (video.videoHeight || 0) > 0;
      if (!ready) return false;
      const vw = video.videoWidth, vh = video.videoHeight;
      const fit = fitContain(vw, vh, APP_W, APP_H);
      const zw = fit.w * view.zoom, zh = fit.h * view.zoom;
      const zx = fit.x + (fit.w - zw) / 2 + view.panX;
      const zy = fit.y + (fit.h - zh) / 2 + view.panY;
      srcCtx.drawImage(video, zx, zy, zw, zh);
      return true;
    }
    return false;
  }

  function render() {
    if (!needsRender && !(sourceMode === "camera" && liveToggle.input.checked)) return;
    needsRender = false;

    ctx.clearRect(0, 0, APP_W, APP_H);
    ctx.fillStyle = bgColor.value;
    ctx.fillRect(0, 0, APP_W, APP_H);

    const hasSrc = drawSourceToOffscreen();
    syncValueLabels();

    if (!hasSrc) {
      ctx.fillStyle = "rgba(0,0,0,.55)";
      ctx.font = `700 16px ${FONT_STACK}`;
      ctx.fillText("Scegli una sorgente: carica una foto o avvia la camera", 22, 34);
      ctx.font = `400 12px ${FONT_STACK}`;
      ctx.fillText("Poi modifica i parametri nella colonna a sinistra.", 22, 56);
      return;
    }

    const dotR = Number(dotSizeCtl.slider.value);
    const step = Number(spacingCtl.slider.value);
    const threshold = Number(threshCtl.slider.value);
    const gamma = Number(gammaCtl.slider.value);
    const jitter = Number(jitterCtl.slider.value);
    const inv = invertToggle.input.checked;
    const edgeOn = edgeToggle.input.checked;
    const edgeThreshold = Number(edgeStrengthCtl.slider.value);
    const shape = shapeSel.value;
    const colors = getPaletteColors();

    const imgData = srcCtx.getImageData(0, 0, APP_W, APP_H).data;

    let edgeMask = null;
    if (edgeOn) {
      const lum = new Uint8Array(APP_W * APP_H);
      for (let i = 0, p = 0; i < lum.length; i++, p += 4) {
        const a = imgData[p + 3];
        if (a < 10) { lum[i] = 0; continue; }
        let L = luminance(imgData[p], imgData[p + 1], imgData[p + 2]);
        L = applyGamma(L, gamma);
        lum[i] = clamp(L, 0, 255);
      }
      edgeMask = computeEdgeMask(lum, APP_W, APP_H);
    }

    for (let y = 0; y < APP_H; y += step) {
      for (let x = 0; x < APP_W; x += step) {
        const xi = x | 0;
        const yi = y | 0;
        const idx = yi * APP_W + xi;
        const p = idx * 4;

        const a = imgData[p + 3];
        if (a < 10) continue;

        let lum = luminance(imgData[p], imgData[p + 1], imgData[p + 2]);
        lum = applyGamma(lum, gamma);

        if (edgeOn) {
          const e = edgeMask ? edgeMask[idx] : 0;
          if (e < edgeThreshold) continue;

          const s = (e - edgeThreshold) / (255 - edgeThreshold + 1e-6);
          const rr = clamp(dotR * (0.7 + s * 1.2), 0.6, 40);

          const jx = jitter ? (Math.random() * 2 - 1) * jitter : 0;
          const jy = jitter ? (Math.random() * 2 - 1) * jitter : 0;

          const c = pickColorByLum(lum, colors, inv);
          ctx.fillStyle = c;
          ctx.strokeStyle = c;

          if (shape === "circle") {
            ctx.beginPath(); ctx.arc(x + 0.5 + jx, y + 0.5 + jy, rr, 0, Math.PI * 2); ctx.fill();
          } else if (shape === "square") {
            const s2 = rr * 2;
            ctx.fillRect(x + 0.5 + jx - rr, y + 0.5 + jy - rr, s2, s2);
          } else {
            const ang = (Math.random() * 2 - 1) * 0.5;
            const len = rr * 2.4;
            const x1 = x + 0.5 + jx - Math.cos(ang) * len * 0.5;
            const y1 = y + 0.5 + jy - Math.sin(ang) * len * 0.5;
            const x2 = x + 0.5 + jx + Math.cos(ang) * len * 0.5;
            const y2 = y + 0.5 + jy + Math.sin(ang) * len * 0.5;
            ctx.lineWidth = Math.max(1, rr * 0.55);
            ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
          }
          continue;
        }

        const shouldDot = inv ? (lum > threshold) : (lum < threshold);
        if (!shouldDot) continue;

        const strength = inv ? (lum - threshold) / 255 : (threshold - lum) / 255;
        const rr = Math.max(0.6, dotR * (0.65 + strength * 0.9));

        const jx = jitter ? (Math.random() * 2 - 1) * jitter : 0;
        const jy = jitter ? (Math.random() * 2 - 1) * jitter : 0;

        const c = pickColorByLum(lum, colors, inv);
        ctx.fillStyle = c;
        ctx.strokeStyle = c;

        if (shape === "circle") {
          ctx.beginPath(); ctx.arc(x + 0.5 + jx, y + 0.5 + jy, rr, 0, Math.PI * 2); ctx.fill();
        } else if (shape === "square") {
          const s2 = rr * 2;
          ctx.fillRect(x + 0.5 + jx - rr, y + 0.5 + jy - rr, s2, s2);
        } else {
          const ang = (Math.random() * 2 - 1) * 0.45;
          const len = rr * 2.2;
          const x1 = x + 0.5 + jx - Math.cos(ang) * len * 0.5;
          const y1 = y + 0.5 + jy - Math.sin(ang) * len * 0.5;
          const x2 = x + 0.5 + jx + Math.cos(ang) * len * 0.5;
          const y2 = y + 0.5 + jy + Math.sin(ang) * len * 0.5;
          ctx.lineWidth = Math.max(1, rr * 0.55);
          ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        }
      }
    }
  }

  // ---------- SVG export (same as before) ----------
  function exportSVG() {
    const hasSrc = drawSourceToOffscreen();
    if (!hasSrc) return;

    const dotR = Number(dotSizeCtl.slider.value);
    const step = Number(spacingCtl.slider.value);
    const threshold = Number(threshCtl.slider.value);
    const gamma = Number(gammaCtl.slider.value);
    const jitter = Number(jitterCtl.slider.value);
    const inv = invertToggle.input.checked;
    const edgeOn = edgeToggle.input.checked;
    const edgeThreshold = Number(edgeStrengthCtl.slider.value);
    const shape = shapeSel.value;
    const colors = getPaletteColors();

    const imgData = srcCtx.getImageData(0, 0, APP_W, APP_H).data;

    let edgeMask = null;
    if (edgeOn) {
      const lum = new Uint8Array(APP_W * APP_H);
      for (let i = 0, p = 0; i < lum.length; i++, p += 4) {
        const a = imgData[p + 3];
        if (a < 10) { lum[i] = 0; continue; }
        let L = luminance(imgData[p], imgData[p + 1], imgData[p + 2]);
        L = applyGamma(L, gamma);
        lum[i] = clamp(L, 0, 255);
      }
      edgeMask = computeEdgeMask(lum, APP_W, APP_H);
    }

    const parts = [];
    parts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${APP_W}" height="${APP_H}" viewBox="0 0 ${APP_W} ${APP_H}">`);
    parts.push(`<rect width="100%" height="100%" fill="${bgColor.value}"/>`);

    for (let y = 0; y < APP_H; y += step) {
      for (let x = 0; x < APP_W; x += step) {
        const xi = x | 0;
        const yi = y | 0;
        const idx = yi * APP_W + xi;
        const p = idx * 4;
        const a = imgData[p + 3];
        if (a < 10) continue;

        let lum = luminance(imgData[p], imgData[p + 1], imgData[p + 2]);
        lum = applyGamma(lum, gamma);

        let rr = 0;
        if (edgeOn) {
          const e = edgeMask ? edgeMask[idx] : 0;
          if (e < edgeThreshold) continue;
          const s = (e - edgeThreshold) / (255 - edgeThreshold + 1e-6);
          rr = clamp(dotR * (0.7 + s * 1.2), 0.6, 40);
        } else {
          const shouldDot = inv ? (lum > threshold) : (lum < threshold);
          if (!shouldDot) continue;
          const strength = inv ? (lum - threshold) / 255 : (threshold - lum) / 255;
          rr = Math.max(0.6, dotR * (0.65 + strength * 0.9));
        }

        const jx = jitter ? (Math.random() * 2 - 1) * jitter : 0;
        const jy = jitter ? (Math.random() * 2 - 1) * jitter : 0;
        const c = pickColorByLum(lum, colors, inv);

        const cx = x + 0.5 + jx;
        const cy = y + 0.5 + jy;

        if (shape === "circle") {
          parts.push(`<circle cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="${rr.toFixed(2)}" fill="${c}"/>`);
        } else if (shape === "square") {
          const s2 = rr * 2;
          parts.push(`<rect x="${(cx - rr).toFixed(2)}" y="${(cy - rr).toFixed(2)}" width="${s2.toFixed(2)}" height="${s2.toFixed(2)}" fill="${c}"/>`);
        } else {
          const ang = (Math.random() * 2 - 1) * 0.45;
          const len = rr * 2.2;
          const x1 = cx - Math.cos(ang) * len * 0.5;
          const y1 = cy - Math.sin(ang) * len * 0.5;
          const x2 = cx + Math.cos(ang) * len * 0.5;
          const y2 = cy + Math.sin(ang) * len * 0.5;
          const sw = Math.max(1, rr * 0.55);
          parts.push(`<line x1="${x1.toFixed(2)}" y1="${y1.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}" stroke="${c}" stroke-width="${sw.toFixed(2)}" stroke-linecap="round"/>`);
        }
      }
    }

    parts.push(`</svg>`);
    downloadText("dot-art.svg", parts.join("\n"), "image/svg+xml");
  }

  btnPNG.addEventListener("click", () => downloadCanvasPNG(canvas));
  btnSVG.addEventListener("click", exportSVG);

  // ---------- Camera (Mac/Safari-safe) ----------
  function uiCamState(running) {
    btnCamStart.disabled = running;
    btnCamStart.style.opacity = running ? "0.65" : "1";
    btnCamStop.disabled = !running;
    btnCamStop.style.opacity = running ? "1" : "0.65";
    btnSnapshot.disabled = !running;
    btnSnapshot.style.opacity = running ? "1" : "0.65";
  }

  async function getStreamWithFallback() {
    const attempts = [
      { video: { width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false },
      { video: { facingMode: "user" }, audio: false },
      { video: true, audio: false },
    ];
    let lastErr = null;
    for (const c of attempts) {
      try { return await navigator.mediaDevices.getUserMedia(c); }
      catch (e) { lastErr = e; }
    }
    throw lastErr || new Error("getUserMedia failed");
  }

  let rafId = 0;
  let lastFrameTime = 0;

  function startLiveLoop() {
    if (rafId) return;
    lastFrameTime = 0;
    const loop = (t) => {
      rafId = requestAnimationFrame(loop);
      if (sourceMode !== "camera" || !liveToggle.input.checked) return;
      const fps = Number(fpsCtl.slider.value);
      const minDt = 1000 / fps;
      if (!lastFrameTime) lastFrameTime = t;
      if (t - lastFrameTime >= minDt) {
        lastFrameTime = t;
        needsRender = true;
        render();
      }
    };
    rafId = requestAnimationFrame(loop);
  }

  function stopLiveLoop() {
    if (!rafId) return;
    cancelAnimationFrame(rafId);
    rafId = 0;
  }

  async function startCamera() {
    if (!(window.isSecureContext || location.hostname === "localhost")) {
      alert("La fotocamera richiede https oppure localhost (restrizione del browser).");
      return;
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("getUserMedia non disponibile in questo browser.");
      return;
    }

    try {
      stopCamera();
      camStream = await getStreamWithFallback();
      video.srcObject = camStream;

      await new Promise((resolve) => {
        let done = false;
        const finish = () => { if (done) return; done = true; resolve(); };
        video.onloadedmetadata = finish;
        setTimeout(finish, 250);
      });

      try { await video.play(); } catch (_) {}

      sourceMode = "camera";
      sourceStateLeft.textContent = "Sorgente: fotocamera";
      uiCamState(true);

      if (liveToggle.input.checked) startLiveLoop();
      else stopLiveLoop();

      requestRender();
    } catch (err) {
      console.error(err);
      uiCamState(false);
      sourceStateLeft.textContent = "Sorgente: errore fotocamera";
      alert("Impossibile avviare la fotocamera. Controlla permessi e che sia https/localhost.");
      stopCamera();
    }
  }

  function stopCamera() {
    stopLiveLoop();
    if (camStream) {
      camStream.getTracks().forEach((t) => t.stop());
      camStream = null;
    }
    video.srcObject = null;

    uiCamState(false);

    if (sourceMode === "camera") {
      sourceMode = srcImg ? "image" : "none";
      sourceStateLeft.textContent = srcImg ? "Sorgente: immagine" : "Sorgente: nessuna";
    }
    requestRender();
  }

  function snapshotFromCamera() {
    if (sourceMode !== "camera") return;
    const has = drawSourceToOffscreen();
    if (!has) return;

    const img = new Image();
    img.onload = () => {
      srcImg = img;
      sourceMode = "image";
      sourceStateLeft.textContent = "Sorgente: immagine (da frame)";
      stopCamera();
      requestRender();
    };
    img.src = srcC.toDataURL("image/png");
  }

  btnCamStart.addEventListener("click", startCamera);
  btnCamStop.addEventListener("click", stopCamera);
  btnSnapshot.addEventListener("click", snapshotFromCamera);

  liveToggle.input.addEventListener("change", () => {
    if (sourceMode === "camera") {
      if (liveToggle.input.checked) startLiveLoop();
      else stopLiveLoop();
    }
    requestRender();
  });

  // Upload image
  file.addEventListener("change", () => {
    const f = file.files && file.files[0];
    if (!f) return;

    const url = URL.createObjectURL(f);
    const img = new Image();
    img.onload = () => {
      srcImg = img;
      sourceMode = "image";
      sourceStateLeft.textContent = "Sorgente: immagine";
      URL.revokeObjectURL(url);
      stopLiveLoop();
      requestRender();
    };
    img.src = url;
  });

  // Presets
  function applyPreset(name) {
    const set = (ctl, v, fmt) => {
      ctl.slider.value = String(v);
      if (fmt) ctl.valueEl.textContent = fmt(v) + (ctl.suffix || "");
    };

    if (name === "fine") {
      set(dotSizeCtl, 2);
      set(spacingCtl, 6);
      set(threshCtl, 165);
      set(gammaCtl, 1.05, (v) => Number(v).toFixed(2));
      shapeSel.value = "circle";
      jitterCtl.slider.value = "0";
      edgeToggle.input.checked = false;
      paletteCount.value = "1";
      invertToggle.input.checked = false;
      rebuildPaletteUI();
    }
    if (name === "bold") {
      set(dotSizeCtl, 5);
      set(spacingCtl, 10);
      set(threshCtl, 180);
      set(gammaCtl, 0.9, (v) => Number(v).toFixed(2));
      shapeSel.value = "circle";
      jitterCtl.slider.value = "0.4";
      edgeToggle.input.checked = false;
      paletteCount.value = "1";
      invertToggle.input.checked = false;
      rebuildPaletteUI();
    }
    if (name === "poster") {
      set(dotSizeCtl, 4);
      set(spacingCtl, 9);
      set(threshCtl, 170);
      set(gammaCtl, 1.0, (v) => Number(v).toFixed(2));
      shapeSel.value = "square";
      jitterCtl.slider.value = "0.2";
      edgeToggle.input.checked = false;
      paletteCount.value = "3";
      invertToggle.input.checked = false;
      rebuildPaletteUI();
    }
    if (name === "night") {
      set(dotSizeCtl, 3);
      set(spacingCtl, 7);
      set(threshCtl, 210);
      set(gammaCtl, 1.35, (v) => Number(v).toFixed(2));
      shapeSel.value = "circle";
      jitterCtl.slider.value = "0";
      edgeToggle.input.checked = false;
      paletteCount.value = "2";
      invertToggle.input.checked = true;
      rebuildPaletteUI();
    }
    if (name === "sketch") {
      set(dotSizeCtl, 2);
      set(spacingCtl, 7);
      set(threshCtl, 140);
      set(gammaCtl, 1.1, (v) => Number(v).toFixed(2));
      shapeSel.value = "line";
      jitterCtl.slider.value = "0.6";
      edgeToggle.input.checked = true;
      edgeStrengthCtl.slider.value = "65";
      invertToggle.input.checked = false;
      paletteCount.value = "1";
      rebuildPaletteUI();
    }

    requestRender();
  }

  presetFine.addEventListener("click", () => applyPreset("fine"));
  presetBold.addEventListener("click", () => applyPreset("bold"));
  presetPoster.addEventListener("click", () => applyPreset("poster"));
  presetNight.addEventListener("click", () => applyPreset("night"));
  presetSketch.addEventListener("click", () => applyPreset("sketch"));

  // Wiring
  const rerender = () => requestRender();
  [
    dotSizeCtl.slider, spacingCtl.slider, threshCtl.slider, gammaCtl.slider,
    jitterCtl.slider, zoomCtl.slider, fpsCtl.slider, edgeStrengthCtl.slider,
  ].forEach((el) => el.addEventListener("input", rerender));

  shapeSel.addEventListener("change", rerender);
  bgColor.addEventListener("input", rerender);
  invertToggle.input.addEventListener("change", rerender);
  edgeToggle.input.addEventListener("change", rerender);

  paletteCount.addEventListener("change", () => { rebuildPaletteUI(); requestRender(); });
  palInputs.forEach((c) => c.addEventListener("input", rerender));

  zoomCtl.slider.addEventListener("input", () => {
    setZoom(Number(zoomCtl.slider.value));
    requestRender();
  });

  // Shortcuts
  window.addEventListener("keydown", (e) => {
    const tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : "";
    const typing = tag === "textarea" || tag === "input" || tag === "select";
    if (typing) return;

    if (e.key === "s" || e.key === "S") {
      if (e.ctrlKey || e.metaKey) { e.preventDefault(); exportSVG(); return; }
      e.preventDefault(); downloadCanvasPNG(canvas);
    }
    if (e.key === "Escape") hideHelp();
  });

  // Buttons
  btnPNG.addEventListener("click", () => downloadCanvasPNG(canvas));
  btnSVG.addEventListener("click", exportSVG);

  // Init
  resetView();
  render();
})();
