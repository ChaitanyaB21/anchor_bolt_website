# Anchor Bolt Design — 2D Web Frontend (v2, simplified)

Standalone HTML/CSS/JS frontend, styled after the PIP/ACI input
sheet (white background, black borders, yellow input cells, grey
diagram fills). No build step, no external libraries, no local
server required — just open `index.html` in a browser.

## Run it

Double-click `index.html`, or open it in your browser directly.
That's it — this version uses plain scripts (not ES modules), so it
works fine over `file://`.

## What's implemented

- **Input panel** (left): every field from the PIP input sheet —
  Loading Conditions, Design Considerations, Anchor Data & Embedment,
  Concrete Failure Areas, Eccentricity, Edge Distances & Spacing
  (tension and shear).
- **Side view** (center, top): elevation matching the sheet's
  "Breakout cone for tension" sketch — hef, 1.5hef each side, 35°
  cone, ca1, Nu load arrow. Redraws on every input change.
- **Top view** (center, bottom): plan matching the sheet's edge
  distance/spacing sketches — ca1/ca2/ca3/ca4, s1/s2, anchor
  symbol(s), Vu direction arrow, and a dashed 1.5·ca1 shear breakout
  projection circle.
- **Summary of Results** (right): ductility note, Eq.1 (\u03c6Nn vs Nua),
  Eq.2 (\u03c6Vn vs Vua), Eq.3 interaction check, and a GOOD / NO GOOD
  status box — styled like the sheet's own conditional formatting
  (green / red fill).

- **Design code edition** dropdown (Design Considerations): ACI 318-14 or
  ACI 318-19. For cast-in headed anchors both editions use the same
  equations and factors, so the edition switches every clause reference
  on the main page and in the calculation report (`js/codes.js`).

Results are calculated in `calculateResults()` in `js/app.js` for cast-in
headed anchors in normal-weight concrete. Always verify with a qualified
engineer.

## Wiring up your Python backend later

`mockCalculate(inputs, edgeLimited)` in `js/app.js` documents the
exact shape the results panel expects:

```json
{
  "ductilityText": "Tensile ductility not req'd",
  "phiNn": 100.5,
  "phiVn": 66.4,
  "eq3": 1.47,
  "pass": false
}
```

When your Flask/FastAPI endpoint is ready, make `mockCalculate` (or
`refresh`) `async` and `fetch()` that endpoint instead, keeping this
same shape — no other UI code needs to change.

## File structure

```
anchor_web_frontend/
├── index.html          # full input form + side/top view containers + results panel
├── css/styles.css       # white/black/yellow/grey visual system
├── calcs.html          # printable step-by-step calculation report
├── js/codes.js         # ACI 318-14 / 318-19 clause references
├── js/app.js           # read inputs, draw both SVG views, calculation engine
└── js/calcs.js         # renders the calculation report
```

## Known simplifications

- The tension breakout cone (side view) and shear breakout circle (top
  view) are drawn as ideal geometry, not clipped against the free
  edge — the side view instead tints the cone when it's edge-limited
  (1.5·hef > ca1).
- Only one extra anchor is drawn (`n_tension`/`n_shear` > 1), spaced
  by `s1` or `s2` depending on the "Direction of s" input. Full 2×2+
  anchor groups aren't modeled yet.
- Eccentricity fields (e'N, e'V) are captured in the form but not yet
  reflected in the diagrams or placeholder math — flag it if you want
  that added before the backend stage.
