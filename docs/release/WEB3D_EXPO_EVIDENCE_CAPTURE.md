# Web3D Expo Evidence Capture

Use this guide to collect final wow-pass proof before release sign-off.

Quality preset override:

1. balanced: `/expo-3d?expoQuality=balanced`
2. quality: `/expo-3d?expoQuality=quality`
3. performance: `/expo-3d?expoQuality=performance`

Browser evidence probe:

1. enter the Expo route
2. wait until movement is interactive
3. open DevTools Console
4. inspect `window.__WARPALA_EXPO_EVIDENCE__`

The probe exposes:

- `qualityPreset`
- `sceneVersion`
- `sponsorCount`
- `sectorCount`
- `averageFps`
- `fps1Low`
- `heapUsedBytes`
- `uptimeMs`
- `activeZoneId`
- `playerPosition`

Required screenshot pack:

1. spawn view `16:9`
2. spawn view `16:10`
3. spawn view ultrawide
4. slightly elevated arrival preview
5. boulevard midpoint
6. sector transition
7. hero booth zone
8. balanced vs quality side-by-side for the same camera positions

Required performance pack:

1. capture `window.__WARPALA_EXPO_EVIDENCE__` after 20 to 30 seconds in route
2. record browser and machine class
3. repeat for balanced and quality
4. repeat on at least:
   - mid laptop
   - strong desktop
   - conservative corporate machine
