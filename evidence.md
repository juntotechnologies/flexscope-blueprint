# Evidence

Use: README blueprint + standalone viewer. Output: A3 landscape sheets, viewer at screen size, SVG/PNG/PDF export. All sheets NTS, `concept: true`.

| Feature group | Evidence | Notes |
|---|---|---|
| Cord OD 3.0, tip OD 3.5, working length 300 | Supplied dims (Ambu Slim spec page + GUDID) | Benchmark, not this device's measured value. Drawing shortens cord (param, default 80 mm) |
| Camera 1.0 mm-class cube | Estimated | OVM6948 is 0.65 × 0.65 × 1.158 (brief); drawn 1.0 × 1.0 × 1.6 for legibility + hi-res option |
| LEDs ×2 beside camera | Illustrative | Common single-use layout; not from a teardown |
| Bending links ×8, 2 pull wires | Illustrative | Generic 2-way bending design; real scopes vary (links, notched tube) |
| Bending sheath, tip housing, window | Illustrative | |
| Handle shells, lever + drum, board, strain reliefs, USB-C cable | Fictional concept (user request) | Designed assembly; dims invented |
| Pull-wire routing in handle | Illustrative | Simplified straight-ish runs drum → nose |

Omitted: wire anchors/crimps, LED + sensor wiring, drum friction detent, seals, sterile pouch.

## Rebuild + proof

```sh
npm i
brew install resvg          # PNG proofs
npm run proof               # proof/full/*.png; open every sheet
CHROME_PATH=... npm run check   # gen drift + dist/index.html + headless viewer
```

Last proof (2026-11-01): no occlusion WARNING; most hidden exploded part: tip `leds` 64%, scope `shellRight` 98%.
