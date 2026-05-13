# SplatTrack

Gaussian Splat viewer with live camera tracking for virtual production.

A desktop viewer (Three.js + [@mkkellogg/gaussian-splats-3d](https://github.com/mkkellogg/GaussianSplats3D)) takes pose data from an XR tracker over WebSocket and drives the viewport camera in real time. Designed for on-set previs / virtual camera work against captured splat environments.

## Tracking sources

- **Meta Quest 3** (recommended) — WebXR `immersive-vr` session in the Quest browser; streams 6DOF right-controller grip pose. Mount the Touch controller on your camera rig.
- **OpenTrack** — UDP FreeTrack 2.0 packets on port 4242 (head-trackers, IR clip, etc.).

## Quick start

```bash
npm install
npm start
```

Server prints a banner with the URLs:

- Controller (viewer): `http://localhost:3000`
- Projector view: `http://localhost:3000?projector`
- Tracker page (open in Quest browser): `http://<lan-ip>:3000/quest-tracker.html`
- OpenTrack: UDP → port 4242

Drop a `.splat` / `.ply` / `.spz` / `.ksplat` into `scenes/` (not checked in) and pick it from the scene dropdown.

## Quest workflow

1. Same LAN as the host PC.
2. Open the tracker URL in the Meta Quest Browser.
3. **Start XR Tracking** → grant VR permission.
4. Position your rig at the desired origin and tap **Recenter** (or press the A button on the right Touch).
5. Use **Two-marker calibration** in the viewer panel to scale physical-meter motion to scene units: drop marker A and B on a feature of known real size, type the real metres, hit Apply.

Smoothing on the tracker page is on by default; toggle off for low-latency framing.

## Notes

- Headset cameras must stay active and the controller within ~3–4m line-of-sight for inside-out tracking.
- WebXR works over plain HTTP on LAN; HTTPS is only required for hand-tracking or off-LAN hosting.
- `scenes/` and `node_modules/` are gitignored.
