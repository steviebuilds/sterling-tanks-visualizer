# Sterling Tanks Visualizer

Mobile-first React + Three.js visualizer for Sterling septic process flow and control logic. This revision focuses on static, engineering-readable visuals and explicit control semantics.

## What changed

- Removed animated pulse effects and other decorative motion from the scene.
- Made tank volumes semi-transparent so internal levels/markers are visible.
- Increased horizontal spacing and tank scale to reduce visual crowding.
- Added per-tank RL bands and mapped inlet/outlet port elevations to RL-aware positions.
- Added example fill states (`Normal`, `Low level`, `High level / clear-down`) to visualize float-switch semantics:
  - pump-on float OFF blocks dosing/pumping
  - high-level float ON enforces forced clear-down priority
- Replaced acronym-heavy labels with clearer names for JS engineers, while preserving technical IDs in tooltips/notes.
- Kept a compact 2D fallback map for quick logic checking on mobile and desktop.

## Notes / assumptions

- RL references are mostly from `memory/sterling-septic-job/images/2026-03-26/sterling-div-layout-v3.png` and `memory/sterling-septic-job/docs/*`.
- Not all RL values are explicitly documented in text. Values shown in the UI are treated as approximate where required.
- Approximation note: optional **Holding / Distribution** RL entries are placeholders until final plan confirmation.

## Local

```bash
npm install
npm run dev
```

## Production sanity

```bash
npm run lint
npm run build
```

Docker image:

```bash
docker build -t sterling-tanks-visualizer .
docker run --rm -p 8080:80 sterling-tanks-visualizer
```
