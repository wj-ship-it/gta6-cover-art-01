// Vice City Nights — the cover renderer.
// Draws a multi-panel GTA-poster-style cover onto a canvas: panel photos with a
// colour grade, white paper gutters, and bold diagonal title lettering.
// Everything is drawn from the canvas size, so the same code renders the live
// preview and the exported PNG at any post size. No external fonts: the lettering
// is a heavy system stack (Arial Black / Helvetica Bold) only.

// Panel layouts, as fractions of the canvas: each entry is [x, y, w, h].
const LAYOUTS = {
  // Big hero on the left, two stacked panels on the right.
  'hero-split': [
    [0, 0, 0.63, 1],
    [0.645, 0, 0.355, 0.4925],
    [0.645, 0.5075, 0.355, 0.4925],
  ],
  // Four equal panels, the classic poster grid.
  'vice-grid': [
    [0, 0, 0.4925, 0.4925],
    [0.5075, 0, 0.4925, 0.4925],
    [0, 0.5075, 0.4925, 0.4925],
    [0.5075, 0.5075, 0.4925, 0.4925],
  ],
  // One photo, full bleed, the title does the talking.
  'full-bleed': [[0, 0, 1, 1]],
};

export const LAYOUT_NAMES = ['hero-split', 'vice-grid', 'full-bleed'];

const GRADES = {
  sunset: { accent: '#ff5a3c', second: '#ffb347' },
  neon: { accent: '#22d3ff', second: '#ff2ea6' },
  pink: { accent: '#ff2ea6', second: '#ff7a3c' },
};

export const GRADE_NAMES = ['sunset', 'neon', 'pink'];

/** The panel rectangles (in canvas pixels) for a layout at this canvas size. */
export function layoutRects(layout, w, h) {
  const cells = LAYOUTS[layout] ?? LAYOUTS['hero-split'];
  return cells.map(([fx, fy, fw, fh]) => ({
    x: fx * w, y: fy * h, w: fw * w, h: fh * h,
  }));
}

/** Draws one photo into a rectangle, cover-fit, with a zoom and a pan offset. */
function drawPhotoCover(ctx, img, rect, zoom, ox, oy) {
  const base = Math.max(rect.w / img.naturalWidth, rect.h / img.naturalHeight) * zoom;
  const pw = img.naturalWidth * base;
  const ph = img.naturalHeight * base;
  // Clamp the pan so the photo always covers the panel: no bare paper shows.
  const maxOx = Math.max(0, (pw - rect.w) / 2 / rect.w);
  const maxOy = Math.max(0, (ph - rect.h) / 2 / rect.h);
  const cx = Math.max(-maxOx, Math.min(maxOx, ox));
  const cy = Math.max(-maxOy, Math.min(maxOy, oy));
  const dx = rect.x + (rect.w - pw) / 2 + cx * rect.w;
  const dy = rect.y + (rect.h - ph) / 2 + cy * rect.h;
  ctx.drawImage(img, dx, dy, pw, ph);
}

/** The colour grade: warm sunset, neon night, or hot pink wash, clipped to a panel. */
function gradePanel(ctx, rect, grade) {
  const { x, y, w, h } = rect;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  if (grade === 'sunset') {
    const wash = ctx.createLinearGradient(x, y, x, y + h);
    wash.addColorStop(0, 'rgba(255, 190, 90, 0.06)');
    wash.addColorStop(0.55, 'rgba(255, 120, 50, 0.10)');
    wash.addColorStop(1, 'rgba(255, 80, 40, 0.42)');
    ctx.fillStyle = wash;
    ctx.fillRect(x, y, w, h);
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = 'rgba(255, 140, 60, 0.22)';
    ctx.fillRect(x, y, w, h);
    ctx.globalCompositeOperation = 'source-over';
  } else if (grade === 'neon') {
    const wash = ctx.createLinearGradient(x, y, x, y + h);
    wash.addColorStop(0, 'rgba(90, 40, 190, 0.30)');
    wash.addColorStop(0.5, 'rgba(40, 20, 120, 0.10)');
    wash.addColorStop(1, 'rgba(0, 220, 255, 0.22)');
    ctx.fillStyle = wash;
    ctx.fillRect(x, y, w, h);
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = 'rgba(140, 60, 255, 0.18)';
    ctx.fillRect(x, y, w, h);
    ctx.globalCompositeOperation = 'source-over';
  } else {
    const wash = ctx.createLinearGradient(x, y, x, y + h);
    wash.addColorStop(0, 'rgba(255, 60, 180, 0.30)');
    wash.addColorStop(1, 'rgba(255, 120, 80, 0.20)');
    ctx.fillStyle = wash;
    ctx.fillRect(x, y, w, h);
    ctx.globalCompositeOperation = 'soft-light';
    ctx.fillStyle = 'rgba(255, 40, 160, 0.35)';
    ctx.fillRect(x, y, w, h);
    ctx.globalCompositeOperation = 'source-over';
  }
  // Vignette: darkened corners pull the eye to the middle of each panel.
  const vig = ctx.createRadialGradient(
    x + w / 2, y + h / 2, Math.min(w, h) * 0.42,
    x + w / 2, y + h / 2, Math.max(w, h) * 0.75,
  );
  vig.addColorStop(0, 'rgba(10, 5, 20, 0)');
  vig.addColorStop(1, 'rgba(10, 5, 20, 0.38)');
  ctx.fillStyle = vig;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
}

/** Bold diagonal title lettering with a hard outline and an accent shadow. */
function drawTitle(ctx, w, h, title, subtitle, grade, titleScale, titleY) {
  const { accent } = GRADES[grade] ?? GRADES.sunset;
  const text = title.trim().toUpperCase();
  const sub = subtitle.trim().toUpperCase();
  if (!text && !sub) return;

  // A dark wash behind the lettering so it reads over any photo.
  const wash = ctx.createLinearGradient(0, h * (titleY - 0.28), 0, h);
  wash.addColorStop(0, 'rgba(8, 4, 18, 0)');
  wash.addColorStop(1, 'rgba(8, 4, 18, 0.62)');
  ctx.fillStyle = wash;
  ctx.fillRect(0, h * (titleY - 0.28), w, h * (1 - titleY + 0.28));

  ctx.save();
  ctx.translate(w / 2, h * titleY);
  ctx.rotate(-0.09); // about -5 degrees: the poster diagonal.
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  if (text) {
    let size = w * 0.115 * titleScale;
    const font = (s) => `900 ${s}px "Arial Black", "Helvetica Neue", Arial, sans-serif`;
    ctx.font = font(size);
    while (ctx.measureText(text).width > w * 0.94 && size > 16) {
      size -= 2;
      ctx.font = font(size);
    }
    // Accent echo, offset down-right, then the white face with a black outline.
    ctx.font = font(size);
    ctx.fillStyle = accent;
    ctx.fillText(text, size * 0.045, size * 0.05);
    ctx.lineWidth = size * 0.16;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0d0a14';
    ctx.strokeText(text, 0, 0);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, 0, 0);
    // Accent rule under the title.
    const tw = ctx.measureText(text).width;
    ctx.fillStyle = accent;
    ctx.fillRect(-tw / 2, size * 0.16, tw, size * 0.085);
    if (sub) {
      const subSize = Math.max(size * 0.26, 14);
      ctx.font = `700 ${subSize}px "Helvetica Neue", Arial, sans-serif`;
      try { ctx.letterSpacing = `${Math.max(subSize * 0.22, 2)}px`; } catch { /* older canvas */ }
      ctx.lineWidth = subSize * 0.18;
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#0d0a14';
      ctx.strokeText(sub, 0, size * 0.58);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(sub, 0, size * 0.58);
      try { ctx.letterSpacing = '0px'; } catch { /* older canvas */ }
    }
  } else if (sub) {
    const subSize = Math.max(w * 0.045 * titleScale, 16);
    ctx.font = `700 ${subSize}px "Helvetica Neue", Arial, sans-serif`;
    ctx.lineWidth = subSize * 0.18;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0d0a14';
    ctx.strokeText(sub, 0, 0);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(sub, 0, 0);
  }
  ctx.restore();
}

/**
 * Draws the whole cover onto `canvas` from `state` and a photo lookup.
 * state: { title, subtitle, layout, grade, titleScale, titleY, panels }
 * panels: [{ photo, zoom, ox, oy }, ...] — photo is a key in `photos`.
 * photos: Map<string, HTMLImageElement>.
 */
export function drawCover(canvas, state, photos) {
  const ctx = canvas.getContext('2d');
  const { width: w, height: h } = canvas;
  // Poster paper: the gutters between panels read as the poster's white frame.
  ctx.fillStyle = '#f4ede1';
  ctx.fillRect(0, 0, w, h);

  const rects = layoutRects(state.layout, w, h);
  const gutter = Math.max(2, Math.round(w * 0.008));
  rects.forEach((rect, i) => {
    const panel = state.panels[i] ?? { photo: 'pier', zoom: 1, ox: 0, oy: 0 };
    const img = photos.get(panel.photo);
    const inset = {
      x: rect.x + gutter, y: rect.y + gutter,
      w: rect.w - gutter * 2, h: rect.h - gutter * 2,
    };
    ctx.save();
    ctx.beginPath();
    ctx.rect(inset.x, inset.y, inset.w, inset.h);
    ctx.clip();
    if (img) {
      drawPhotoCover(ctx, img, inset, panel.zoom || 1, panel.ox || 0, panel.oy || 0);
    } else {
      ctx.fillStyle = '#241a33';
      ctx.fillRect(inset.x, inset.y, inset.w, inset.h);
    }
    gradePanel(ctx, inset, state.grade);
    ctx.restore();
    ctx.strokeStyle = '#f4ede1';
    ctx.lineWidth = gutter;
    ctx.strokeRect(inset.x, inset.y, inset.w, inset.h);
  });

  drawTitle(ctx, w, h, state.title, state.subtitle, state.grade, state.titleScale, state.titleY);
}
