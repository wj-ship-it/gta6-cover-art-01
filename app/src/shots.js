// Fixed scenes for screenshots: ?shot=editor shows the page with a sample photo;
// ?shot=cover shows the cover alone, drawn at viewport size.
// Params: photo (pier|boulevard), caption, subtitle, grade (sunset|neon|pink),
// layout (hero-split|vice-grid|full-bleed), size (1080x1080|1080x1350|1920x1080).
// window.__shotReady is set once painted.
export async function runShot(shot, query, apply) {
  if (shot === 'cover') document.body.classList.add('shot-cover');
  await apply((state, photos, ui) => {
    const photo = query.get('photo') ?? 'pier';
    const other = photo === 'pier' ? 'boulevard' : 'pier';
    state.title = query.get('caption') ?? 'Sunset Heist';
    state.subtitle = query.get('subtitle') ?? 'Vice City Nights';
    const grade = query.get('grade');
    if (grade) state.grade = grade;
    const layout = query.get('layout');
    if (layout) state.layout = layout;
    const size = query.get('size');
    if (size) state.size = size;
    // Panels alternate the chosen photo with the other sample, so every
    // layout shows both photos without any extra setup.
    ui.fitPanels();
    state.panels.forEach((p, i) => { p.photo = i % 2 === 0 ? photo : other; });
    ui.refreshPanelUI();
    // Sync the visible inputs with the scene, so the editor shot is honest.
    const title = document.getElementById('title');
    if (title) title.value = state.title;
    const subtitle = document.getElementById('subtitle');
    if (subtitle) subtitle.value = state.subtitle;
    const gradeRadio = document.querySelector(`[name=grade][value="${state.grade}"]`);
    if (gradeRadio) gradeRadio.checked = true;
    const layoutRadio = document.querySelector(`[name=layout][value="${state.layout}"]`);
    if (layoutRadio) layoutRadio.checked = true;
    const sizeRadio = document.querySelector(`[name=size][value="${state.size}"]`);
    if (sizeRadio) sizeRadio.checked = true;
  });
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
