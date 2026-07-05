## GALA Unreal Presentation Isolation

### Why the current setup is slow

The main problem is no longer temporary directories. Those were already cleaned.

The remaining bottleneck is structural:

- `WarpalaUE5` is a `22.7 GB` mixed project.
- It includes unrelated runtime modules:
  - `WarpalaCity`
  - `WarpalaAI`
  - `WarpalaExpo`
  - `WarpalaNetworking`
  - `WarpalaSimulation`
  - `WarpalaTraffic`
- It also enables heavy plugins not needed for a single-house presentation workflow:
  - `MassGameplay`
  - `MassCrowd`
  - `PCG`
  - `PixelStreaming2`

For GALA presentation work, this is the wrong workspace. It increases editor startup cost, asset scanning, shader work, and automation instability.

### What should be isolated

The useful Unreal payload is already concentrated under:

- `/Game/WoodHouse_GALA`
- filesystem source: `WarpalaUE5/Content/WoodHouse_GALA`

This subtree already contains the presentation-level assets:

- `Levels`
- `Materials`
- `Presentation/FrozenFromBlender`
- `Presentation/Materials`
- `Presentation/Sequences`
- `Blueprints`
- `DataLayers`

### Recommended target

Create a separate Unreal project:

- project root: `C:\3d\GALA_PresentationUE5`
- content root: `/Game/WoodHouse_GALA`

Keep it minimal:

- no Warpala city modules
- no Pixel Streaming
- no Mass systems
- no PCG
- keep `MovieRenderPipeline` only if screenshot/render automation is needed
- enable Python only if import automation is needed

### Minimal migration set

Copy into the new project:

1. `WarpalaUE5/Content/WoodHouse_GALA`
2. GALA-specific Unreal Python/import scripts from `unreal/`
3. minimal config pointing startup map to:
   - `/Game/WoodHouse_GALA/Levels/LVL_WoodHouse_GALA_Complete`

Do not copy:

- `/Game/Warpala/...`
- project C++ modules
- city maps
- Pixel Streaming setup
- unrelated demo/capture tooling

### Immediate payoff

This reduces the problem from:

- one large mixed UE project with unstable startup/render automation

to:

- one small single-purpose presentation project with one finished house and three cameras

### Next execution step

Use:

- [scripts/unreal/scaffold_gala_presentation_project.ps1](/abs/path/C:/3d/scripts/unreal/scaffold_gala_presentation_project.ps1)

That script scaffolds a new minimal Unreal project, copies only `Content/WoodHouse_GALA`, and writes minimal config files.
