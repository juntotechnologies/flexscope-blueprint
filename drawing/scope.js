// Whole scope. Handle along world x (nose at x=0, rear at -handleLength), z up, shells split at y=0.
self.DrawingModels ??= {};

const SCOPE_CAMERA = {azimuth: -62, elevation: 26, roll: 0};

function scopeDisc(r, count) {
  const points = [];
  for (let i = 0; i < count; i++) {
    const a = i * 2 * Math.PI / count;
    points.push([r * Math.cos(a), r * Math.sin(a)]);
  }
  return points;
}

function scopePart(G, id) {
  return G.part(id, self.ScopeData.parts.scope[id].name);
}

function scopeShellProfile(G, d, inset) {
  const centerX = -d.handleLength / 2;
  return G.roundedRectangle(d.handleLength - 2 * inset, d.handleHeight - 2 * inset, d.handleCorner - inset, {center: [centerX, 0]});
}

// side = -1 (left, toward -y) or 1 (right). Open frame + side plate = shell with a cavity facing y=0.
function scopeShell(G, d, id, side) {
  const p = scopePart(G, id), frameDepth = d.handleHalfWidth - d.shellWall;
  const frame = G.extrude(G.piece(), scopeShellProfile(G, d, 0), {depth: frameDepth, holes: [scopeShellProfile(G, d, d.shellWall)]});
  const plate = G.extrude(G.piece(), scopeShellProfile(G, d, 0), {depth: d.shellWall});
  G.transform(frame, {origin: [0, 0, 0], ...G.plane('xz')});
  G.transform(plate, {origin: [0, -frameDepth, 0], ...G.plane('xz')});
  G.merge(p, frame);
  G.merge(p, plate);
  if (side > 0) G.transform(p, {origin: [0, 0, 0], xAxis: [1, 0, 0], yAxis: [0, -1, 0], zAxis: [0, 0, -1]});
  return p;
}

function scopeLever(G, d) {
  const p = scopePart(G, 'lever'), [px, , pz] = d.pivot, w = d.drumWidth / 2;
  G.lathe(p, [[-w, 0], [-w, d.drumRadius], [w, d.drumRadius], [w, 0]], {axis: 'y', at: d.pivot});
  G.box(p, [px - 3, -2, pz + d.drumRadius - 1], [px + 3, 2, d.handleHeight / 2 + 7]);
  G.box(p, [px - 10, -6, d.handleHeight / 2 + 7], [px + 8, 6, d.handleHeight / 2 + 10], {radius: 3});
  return p;
}

function scopeBoard(G, d) {
  const p = scopePart(G, 'board');
  G.box(p, d.board.min, d.board.max);
  G.merge(p, G.box(G.piece(), d.chip.min, d.chip.max));
  return p;
}

function scopeWires(G, d) {
  const p = scopePart(G, 'pullWires'), [px, , pz] = d.pivot, section = scopeDisc(0.35, 12);
  for (const s of [1, -1]) {
    G.merge(p, G.sweep(G.piece(), [[px, 0, pz + s * d.drumRadius], [px + 40, 0, pz + s * d.drumRadius * 0.6], [-2, 0, s * 0.6]], section));
  }
  return p;
}

function scopeNose(G, d) {
  const p = scopePart(G, 'nose');
  G.lathe(p, [[-2, 0], [-2, d.noseRadius], [0, d.noseRadius], [d.noseLength, d.cordRadius + 0.6], [d.noseLength, 0]]);
  return p;
}

function scopeTube(G, id, x0, x1, r, pitch) {
  const p = scopePart(G, id), profile = [[x0, 0]];
  const steps = pitch ? Math.round((x1 - x0) / pitch) : 1;
  for (let i = 0; i <= steps; i++) profile.push([x0 + (x1 - x0) * i / steps, r]);
  profile.push([x1, 0]);
  G.lathe(p, profile, {segments: 72});
  return p;
}

function scopeTip(G, d, x0) {
  const p = scopeTube(G, 'tip', x0, x0 + d.tipLength, d.tipRadius, 0), face = x0 + d.tipLength + 0.01;
  G.circle(p, [face, 0, 0], 0.5, [1, 0, 0], {role: 'detail', segments: 48});
  for (const y of [1.1, -1.1]) G.circle(p, [face, y, 0], 0.3, [1, 0, 0], {role: 'detail', segments: 24});
  return p;
}

function scopeBoot(G, d) {
  const p = scopePart(G, 'boot'), rear = -d.handleLength;
  G.lathe(p, [[rear + 2, 0], [rear + 2, d.bootRadius], [rear, d.bootRadius], [rear - d.bootLength, d.cableRadius + 0.6], [rear - d.bootLength, 0]]);
  return p;
}

function scopeCable(G, d) {
  const p = scopePart(G, 'cable'), start = -d.handleLength - d.bootLength + 1, end = start - d.cableShown;
  G.lathe(p, [[end, 0], [end, d.cableRadius], [start, d.cableRadius], [start, 0]], {segments: 72});
  G.merge(p, G.box(G.piece(), [end - 9, -4.5, -2.2], [end, 4.5, 2.2], {radius: 1.2}));
  G.merge(p, G.box(G.piece(), [end - 16, -4.2, -1.3], [end - 9, 4.2, 1.3], {radius: 1.2}));
  return p;
}

function scopeShaft(G, d, cordShown) {
  const x0 = d.noseLength - 1, x1 = x0 + cordShown, x2 = x1 + d.bendingLength;
  return [scopeTube(G, 'cord', x0, x1, d.cordRadius, 0), scopeTube(G, 'bending', x1, x2, d.tipRadius, d.bendingPitch), scopeTip(G, d, x2)];
}

function scopeParts(G, d, cordShown) {
  const parts = [scopeShell(G, d, 'shellLeft', -1), scopeShell(G, d, 'shellRight', 1), scopeLever(G, d), scopeBoard(G, d), scopeWires(G, d), scopeNose(G, d), ...scopeShaft(G, d, cordShown), scopeBoot(G, d), scopeCable(G, d)];
  for (const p of parts) p.explosion = self.ScopeData.parts.scope[p.id].explosion;
  return parts;
}

function scopeModel(parameters, options) {
  const cordShown = parameters.cordShown;
  if (!Number.isFinite(cordShown) || cordShown < 60 || cordShown > 300) throw Error('Cord length shown must be 60-300 mm');
  const parts = scopeParts(TechnicalGeometry, self.ScopeData.dims.scope, cordShown);
  const result = TechnicalProjection.render(parts, {...options, camera: SCOPE_CAMERA});
  return {...result, slides: partSlides(parts, SCOPE_CAMERA, result.scale)};
}

self.DrawingModels.scope = scopeModel;
