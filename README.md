# Sterling Tanks Visualizer

Mobile-first React + Three.js visualizer for Sterling septic process flow.

## Features

- 3D tank chain: Pre-treatment → Dosing/EQ → ATU → Pump/Chlorination
- Optional Holding / Distribution stage toggle
- Mobile touch interaction with OrbitControls (rotate/zoom/pan)
- Overlay IO labels: LLS/ALS/HLS, FTQ-03/4/5, PS/BSZ/PSZ/VXY
- Flow pulse + alarm highlight simulation toggles
- Compact 2D SVG map fallback sidebar for small screens
- Static deployment via Docker + Nginx

## Local

```bash
npm install
npm run dev
```

## Production

```bash
npm run build
npm run preview
```

Docker image:

```bash
docker build -t sterling-tanks-visualizer .
docker run --rm -p 8080:80 sterling-tanks-visualizer
```
