# Web3D Expo Spatial QA Checklist

Use these query flags during diagnosis:

- `expoDebugNoArrivalReveal=1`
- `expoDebugNoCuratedSkylineRing=1`
- `expoDebugNoExpoLandmarkLayer=1`
- `expoDebugNoDistrictAnchorNodes=1`
- `expoDebugNoBoothArchitectureKit=1`
- `expoDebugSpawn=1`
- `expoDebugSkylineBounds=1`
- `expoDebugBoothColliders=1`
- `expoDebugWalkCorridor=1`

Runtime checks:

1. Spawn faces the sponsor arrival axis, not the skyline shell.
2. Spawn is not under a roof, canopy, or scenic shell.
3. `CuratedSkylineRing` debug bounds stay outside the visible sponsor route.
4. The player cannot walk behind sponsor-facing signage or booth back walls.
5. Mirrored text such as `DEMO ROOM` is not reachable from public route.
6. Booth collider boxes match visible side/rear structure and keep front approach open.
7. Arrival reveal, anchors, and landmarks do not overlap the main spawn route.
8. Balanced and quality presets are both spatially correct.
