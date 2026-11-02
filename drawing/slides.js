// Per-part 2D slide per unit of explosion, in sheet mm. Projection is linear, so a page can animate
// explode/assemble by moving each part's rendered ink by slide × Δexplosion (exact render replaces it at rest).
function partSlides(parts, camera, scale) {
  return Object.fromEntries(parts.map(function slide(p) {
    const [x, y] = TechnicalProjection.project(p.explosion, camera);
    return [p.id, [x * scale, y * scale]];
  }));
}
