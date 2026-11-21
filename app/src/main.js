// Vice City Nights — wires the editor: photos, panels, caption, grades, export.
// A `?shot=` query sets up a fixed scene for a screenshot instead (./shots.js).
import { drawCover, layoutRects, LAYOUT_NAMES, GRADE_NAMES } from './cover.js';
import { runShot } from './shots.js';

export const SIZES = {
  '1080x1080': [1080, 1080],
  '1080x1350': [1080, 1350],
  '1920x1080': [1920, 1080],
};

const SAMPLES = ['pier', 'boulevard'];

function defaultPanels(layout) {
  const count = layout === 'vice-grid' ? 4 : layout === 'full-bleed' ? 1 : 3;
  const crops = [
    { photo: 'pier', zoom: 1, ox: 0, oy: 0 },
    { photo: 'boulevard', zoom: 1.15, ox: 0, oy: -0.06 },
    { photo: 'pier', zoom: 1.35, ox: 0.08, oy: 0 },
    { photo: 'boulevard', zoom: 1, ox: 0, oy: 0.05 },
  ];
  return crops.slice(0, count);
}

const state = {
  title: 'Sunset Heist',
  subtitle: 'Vice City Nights',
  layout: 'hero-split',
  grade: 'sunset',
  titleScale: 1,
  titleY: 0.82,
  size: '1080x1080',
  panels: defaultPanels('hero-split'),
};

const photos = new Map();
const uploads = []; // { key, name, img }
let selectedPanel = 0;

const canvas = document.getElementById('cover');
const statusEl = document.getElementById('status');
let coverShot = false; // in ?shot=cover the canvas is the viewport, not an export size.

function redraw() {
  if (!coverShot) {
    const [w, h] = SIZES[state.size];
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
  }
  drawCover(canvas, state, photos);
  document.querySelectorAll('[data-panel]').forEach((btn) => {
    btn.classList.toggle('active', Number(btn.dataset.panel) === selectedPanel);
  });
  const panel = state.panels[selectedPanel];
  const zoom = document.getElementById('zoom');
  if (panel && zoom) zoom.value = String(panel.zoom);
  const photoSelect = document.getElementById('panel-photo');
  if (panel && photoSelect) photoSelect.value = panel.photo;
}

/** Loads an image from a URL, resolving to the image once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

async function loadSamples() {
  for (const name of SAMPLES) {
    if (!photos.has(name)) photos.set(name, await loadImage(`samples/${name}.jpg`));
  }
}

function panelCount() {
  return state.layout === 'vice-grid' ? 4 : state.layout === 'full-bleed' ? 1 : 3;
}

function fitPanels() {
  const want = panelCount();
  while (state.panels.length < want) {
    const i = state.panels.length;
    state.panels.push({ photo: SAMPLES[i % SAMPLES.length], zoom: 1, ox: 0, oy: 0 });
  }
  state.panels.length = want;
  selectedPanel = Math.min(selectedPanel, want - 1);
}

function buildPanelButtons() {
  const wrap = document.getElementById('panel-list');
  wrap.innerHTML = '';
  state.panels.forEach((panel, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.panel = String(i);
    btn.textContent = `Panel ${i + 1} · ${panelLabel(panel.photo)}`;
    btn.addEventListener('click', () => { selectedPanel = i; redraw(); });
    wrap.appendChild(btn);
  });
}

function panelLabel(key) {
  if (key === 'pier') return 'Pier';
  if (key === 'boulevard') return 'Boulevard';
  const up = uploads.find((u) => u.key === key);
  return up ? up.name : 'Photo';
}

function buildPhotoOptions() {
  const select = document.getElementById('panel-photo');
  select.innerHTML = '';
  for (const name of SAMPLES) {
    const opt = document.createElement('option');
    opt.value = name;
    opt.textContent = name === 'pier' ? 'Pier (sample)' : 'Boulevard (sample)';
    select.appendChild(opt);
  }
  for (const up of uploads) {
    const opt = document.createElement('option');
    opt.value = up.key;
    opt.textContent = `${up.name} (uploaded)`;
    select.appendChild(opt);
  }
}

function refreshPanelUI() {
  buildPanelButtons();
  buildPhotoOptions();
  redraw();
}

// ---- caption controls ----
document.getElementById('title').addEventListener('input', (e) => { state.title = e.target.value; redraw(); });
document.getElementById('subtitle').addEventListener('input', (e) => { state.subtitle = e.target.value; redraw(); });
document.getElementById('title-size').addEventListener('input', (e) => { state.titleScale = Number(e.target.value); redraw(); });
document.getElementById('title-pos').addEventListener('input', (e) => { state.titleY = Number(e.target.value); redraw(); });

// ---- layout, grade, size ----
document.querySelectorAll('[name=layout]').forEach((radio) => {
  radio.addEventListener('change', () => { state.layout = radio.value; fitPanels(); refreshPanelUI(); });
});
document.querySelectorAll('[name=grade]').forEach((radio) => {
  radio.addEventListener('change', () => { state.grade = radio.value; redraw(); });
});
document.querySelectorAll('[name=size]').forEach((radio) => {
  radio.addEventListener('change', () => { state.size = radio.value; redraw(); });
});

// ---- selected panel: photo, zoom, reset, fill-all ----
document.getElementById('panel-photo').addEventListener('change', (e) => {
  state.panels[selectedPanel].photo = e.target.value;
  refreshPanelUI();
});
document.getElementById('zoom').addEventListener('input', (e) => {
  state.panels[selectedPanel].zoom = Number(e.target.value);
  redraw();
});
document.getElementById('reset-crop').addEventListener('click', () => {
  const p = state.panels[selectedPanel];
  p.zoom = 1; p.ox = 0; p.oy = 0;
  redraw();
});
document.getElementById('fill-all').addEventListener('click', () => {
  const photo = state.panels[selectedPanel].photo;
  state.panels.forEach((p) => { p.photo = photo; });
  refreshPanelUI();
});

// ---- photo upload ----
document.getElementById('photo').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const img = await loadImage(URL.createObjectURL(file));
  const key = `up:${uploads.length}`;
  uploads.push({ key, name: file.name.replace(/\.[^.]+$/, '').slice(0, 18) || 'Upload', img });
  photos.set(key, img);
  state.panels[selectedPanel].photo = key;
  refreshPanelUI();
  statusEl.textContent = `Loaded ${file.name} into panel ${selectedPanel + 1}.`;
});
for (const name of SAMPLES) {
  document.getElementById(`sample-${name}`).addEventListener('click', () => {
    state.panels[selectedPanel].photo = name;
    refreshPanelUI();
  });
}

// ---- drag a photo inside its panel; click a panel to select it ----
let drag = null;
function canvasPoint(e) {
  const r = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - r.left) * (canvas.width / r.width),
    y: (e.clientY - r.top) * (canvas.height / r.height),
  };
}
function panelAt(x, y) {
  const rects = layoutRects(state.layout, canvas.width, canvas.height);
  return rects.findIndex((r) => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h);
}
canvas.addEventListener('pointerdown', (e) => {
  const { x, y } = canvasPoint(e);
  const i = panelAt(x, y);
  if (i < 0) return;
  selectedPanel = i;
  drag = { x, y, moved: false, ox: state.panels[i].ox, oy: state.panels[i].oy };
  canvas.setPointerCapture(e.pointerId);
  redraw();
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const { x, y } = canvasPoint(e);
  const rects = layoutRects(state.layout, canvas.width, canvas.height);
  const rect = rects[selectedPanel];
  const dx = (x - drag.x) / rect.w;
  const dy = (y - drag.y) / rect.h;
  if (Math.abs(x - drag.x) + Math.abs(y - drag.y) > 4) drag.moved = true;
  if (drag.moved) {
    const p = state.panels[selectedPanel];
    p.ox = Math.max(-0.5, Math.min(0.5, drag.ox + dx));
    p.oy = Math.max(-0.5, Math.min(0.5, drag.oy + dy));
    redraw();
  }
});
canvas.addEventListener('pointerup', () => { drag = null; });

// ---- export ----
document.getElementById('export').addEventListener('click', () => {
  const [w, h] = SIZES[state.size];
  const off = document.createElement('canvas');
  off.width = w;
  off.height = h;
  drawCover(off, state, photos);
  off.toBlob((blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-city-nights-${w}x${h}.png`;
    a.click();
    statusEl.textContent = `Saved vice-city-nights-${w}x${h}.png`;
    window.__lastExport = { w, h, bytes: blob.size };
  }, 'image/png');
});

// ---- boot ----
const query = new URLSearchParams(location.search);
const shot = query.get('shot');
if (shot) {
  runShot(shot, query, async (setup) => {
    await loadSamples();
    setup(state, photos, { redraw, fitPanels, refreshPanelUI });
    if (shot === 'cover') {
      // The cover fills the viewport: draw at viewport size.
      coverShot = true;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      canvas.style.width = '100vw';
      canvas.style.height = '100vh';
    }
    redraw();
  });
} else {
  loadSamples().then(() => { refreshPanelUI(); });
}

// Keep the layout/grade names honest: every name the renderer knows is offered.
if (!LAYOUT_NAMES.includes(state.layout)) state.layout = LAYOUT_NAMES[0];
if (!GRADE_NAMES.includes(state.grade)) state.grade = GRADE_NAMES[0];
