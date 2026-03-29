## Expo Backdrop QA

Use these exact routes for visual QA of the release backdrop strategy.

### Balanced

`/expo-3d?expoQuality=balanced&expoDebugSkylineBounds=1&expoDebugSpawn=1&expoDebugWalkCorridor=1`

Expected:
- city shell reads as a distant muted silhouette
- skyline bounds stay behind the sponsor corridor
- sponsor boulevard remains the dominant visual layer
- no overhead black-building feeling at spawn

### Quality

`/expo-3d?expoQuality=quality&expoDebugSkylineBounds=1&expoDebugSpawn=1&expoDebugWalkCorridor=1`

Expected:
- skyline ring adds depth without crowding the boulevard
- quality adds richer distant accents, not random object noise
- arrival framing remains readable and sponsor-first

### What to check

1. Spawn view:
- player starts facing sponsor arrival
- no large dark backdrop mass reads as overhead roof

2. Sponsor priority:
- boulevard and booths read first
- backdrop stays secondary

3. Skyline containment:
- debug skyline boxes do not overlap the walk corridor
- no skyline anchor appears inside the sponsor route

4. Balanced vs quality:
- balanced is cleaner/minimal
- quality is richer, but still controlled

### Fail conditions

- city shell feels like a full random city directly behind the player
- skyline anchors read as unrelated free assets
- skyline/debug boxes overlap sponsor route
- backdrop competes with sponsor booths for primary attention
