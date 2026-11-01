// Distal tip + bending section. Axis = world x, proximal x=0 -> distal +x.
self.DrawingModels ??= {};

const TIP_CAMERA = {azimuth: -38, elevation: 24, roll: 0};

function tipDisc(cy, cz, r, count) {
  const points = [];
  for (let i = 0; i < count; i++) {
    const a = i * 2 * Math.PI / count;
    points.push([cy + r * Math.cos(a), cz + r * Math.sin(a)]);
  }
  return points;
}

function tipRect(cy, cz, halfY, halfZ) {
  return [[cy - halfY, cz - halfZ], [cy + halfY, cz - halfZ], [cy + halfY, cz + halfZ], [cy - halfY, cz + halfZ]];
}

function tipPart(G, id) {
  const spec = self.ScopeData.parts.tip[id];
  return G.part(id, spec.name);
}

function tipStations(d) {
  const linksStart = d.cordStub + d.linkGap;
  const linksEnd = linksStart + d.linkCount * (d.linkLength + d.linkGap) - d.linkGap;
  const housingStart = linksEnd + d.linkGap;
  const face = housingStart + d.tipLength;
  return {linksStart, linksEnd, housingStart, face};
}

function tipCord(G, d) {
  const p = tipPart(G, 'cord');
  G.lathe(p, [[0, d.cordInnerRadius], [0, d.cordOuterRadius], [d.cordStub, d.cordOuterRadius], [d.cordStub, d.cordInnerRadius]]);
  return p;
}

function tipLinks(G, d, s) {
  const p = tipPart(G, 'links');
  for (let i = 0; i < d.linkCount; i++) {
    const a = s.linksStart + i * (d.linkLength + d.linkGap), b = a + d.linkLength;
    G.merge(p, G.lathe(G.piece(), [[a, d.linkInnerRadius], [a, d.linkOuterRadius], [b, d.linkOuterRadius], [b, d.linkInnerRadius]], {segments: 96}));
  }
  return p;
}

function tipHousing(G, d, s) {
  const p = tipPart(G, 'housing');
  const holes = [
    tipRect(0, 0, d.cameraSize / 2 + 0.05, d.cameraSize / 2 + 0.05),
    tipRect(d.ledOffset, 0, d.ledWidth / 2 + 0.03, d.ledHeight / 2 + 0.03),
    tipRect(-d.ledOffset, 0, d.ledWidth / 2 + 0.03, d.ledHeight / 2 + 0.03),
    tipDisc(0, d.wireOffset, 0.13, 24),
    tipDisc(0, -d.wireOffset, 0.13, 24)
  ];
  G.extrude(p, tipDisc(0, 0, d.tipOuterRadius, 144), {depth: d.tipLength, holes});
  G.transform(p, {origin: [s.housingStart, 0, 0], ...G.plane('yz')});
  return p;
}

function tipWindow(G, d, s) {
  const p = tipPart(G, 'window');
  G.lathe(p, [[s.face, 0], [s.face, d.tipOuterRadius], [s.face + d.windowThickness, d.tipOuterRadius], [s.face + d.windowThickness, 0]]);
  p.transparent = true;
  return p;
}

function tipCamera(G, d, s) {
  const p = tipPart(G, 'camera');
  const h = d.cameraSize / 2, front = s.face - 0.02, back = front - d.cameraLength;
  G.box(p, [back, -h, -h], [front, h, h]);
  G.circle(p, [front + 0.01, 0, 0], h * 0.6, [1, 0, 0], {role: 'detail', segments: 48});
  G.merge(p, G.sweep(G.piece(), [[0, 0, 0], [back + 0.05, 0, 0]], tipDisc(0, 0, d.cameraCableRadius, 24)));
  return p;
}

function tipLeds(G, d, s) {
  const p = tipPart(G, 'leds');
  const front = s.face - 0.02, back = front - d.ledDepth;
  for (const y of [d.ledOffset, -d.ledOffset]) {
    G.box(p, [back, y - d.ledWidth / 2, -d.ledHeight / 2], [front, y + d.ledWidth / 2, d.ledHeight / 2]);
  }
  return p;
}

function tipWires(G, d, s) {
  const p = tipPart(G, 'wires');
  for (const z of [d.wireOffset, -d.wireOffset]) {
    G.merge(p, G.sweep(G.piece(), [[0, 0, z], [s.housingStart + 1.5, 0, z]], tipDisc(0, 0, d.wireRadius, 16)));
  }
  return p;
}

function tipSheath(G, d, s) {
  const p = tipPart(G, 'sheath');
  const a = d.cordStub - 1.5, b = s.housingStart;
  G.lathe(p, [[a, d.sheathInnerRadius], [a, d.sheathOuterRadius], [b, d.sheathOuterRadius], [b, d.sheathInnerRadius]]);
  return p;
}

function tipParts(G, d) {
  const s = tipStations(d);
  const parts = [tipCord(G, d), tipLinks(G, d, s), tipHousing(G, d, s), tipWindow(G, d, s), tipCamera(G, d, s), tipLeds(G, d, s), tipWires(G, d, s), tipSheath(G, d, s)];
  for (const p of parts) p.explosion = self.ScopeData.parts.tip[p.id].explosion;
  return parts;
}

function tipModel(parameters, options) {
  const parts = tipParts(TechnicalGeometry, self.ScopeData.dims.tip);
  return TechnicalProjection.render(parts, {...options, camera: TIP_CAMERA});
}

self.DrawingModels.tip = tipModel;
