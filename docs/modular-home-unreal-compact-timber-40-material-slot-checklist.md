# Compact Timber 40 Material Slot Checklist

Status: checklist for stable mesh import and material assignment. Slot names must stay stable so Unreal variant logic can depend on them later.

## Required Stable Slots

- `Facade_Main`
- `Facade_Trim`
- `Roof_Main`
- `Roof_Edge`
- `Window_Frame`
- `Window_Glass`
- `Door_Main`
- `Door_Glass`
- `Terrace_Deck`
- `Terrace_Rail`
- `Interior_Wall`
- `Interior_Floor`
- `Bathroom_WetCore`
- `Kitchen_Cabinet`
- `Kitchen_Counter`
- `Furniture_Main`
- `Furniture_Accent`
- `Foundation_Concrete`

## Mesh Group Coverage

Exterior:
- facade shell meshes expose `Facade_Main` and `Facade_Trim`
- roof meshes expose `Roof_Main` and `Roof_Edge`
- foundation meshes expose `Foundation_Concrete`

Windows and doors:
- window meshes expose `Window_Frame` and `Window_Glass`
- entry door exposes `Door_Main`
- glazed door variants reserve `Door_Glass`

Terrace:
- deck meshes expose `Terrace_Deck`
- railing/posts expose `Terrace_Rail`

Interior:
- interior wall/ceiling related meshes expose `Interior_Wall`
- floor meshes expose `Interior_Floor`
- bathroom core exposes `Bathroom_WetCore`
- kitchen meshes expose `Kitchen_Cabinet` and `Kitchen_Counter`
- furniture meshes expose `Furniture_Main`
- accent furniture or lights expose `Furniture_Accent`

## Material Instance Checklist

Create or reserve:

- `MI_CT40_Facade_NaturalTimber`
- `MI_CT40_Facade_DarkThermoWood`
- `MI_CT40_Facade_LightPainted`
- `MI_CT40_Trim_Timber`
- `MI_CT40_Trim_DarkMetal`
- `MI_CT40_Roof_Metal`
- `MI_CT40_Roof_GreenPlaceholder`
- `MI_CT40_Glass_Clear`
- `MI_CT40_Glass_Panoramic`
- `MI_CT40_Glass_Privacy`
- `MI_CT40_Door_TimberEntry`
- `MI_CT40_Door_TerraceSlider`
- `MI_CT40_Terrace_TimberDeck`
- `MI_CT40_Interior_Plywood`
- `MI_CT40_Interior_PremiumWall`
- `MI_CT40_Bathroom_WetCore`
- `MI_CT40_Kitchen_Standard`
- `MI_CT40_Kitchen_Premium`
- `MI_CT40_Furniture_Standard`
- `MI_CT40_Furniture_Premium`
- `MI_CT40_Foundation_ConcretePad`

## Import Acceptance

Accept import only when:

- no slot names are auto-renamed unexpectedly;
- Blender export preserves slot order;
- no mesh bakes facade/roof variants into geometry;
- premium locked payload can be expressed with material instances only where intended.
