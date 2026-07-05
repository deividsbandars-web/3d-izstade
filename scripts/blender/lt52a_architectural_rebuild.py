"""
LT52A architectural rebuild generator.

Purpose:
- replace ad-hoc Unreal-side block patching with a Blender-driven source model;
- model the exterior wall system in the correct layer order;
- keep openings, corners, stud bays, battens, and cladding under one geometry source.

This is an architectural source-model script, not an engineering approval artifact.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
import json


ROOT = Path(__file__).resolve().parents[2]
SOURCE_JSON = ROOT / "tmp" / "lt52a_revc_unpack" / "LT52A_luksus_koka_modulu_maja_RevC_data.json"
OUTPUT_SUMMARY = ROOT / "tmp" / "lt52a_architectural_rebuild_summary.json"
BLEND_OUTPUT = Path(r"C:\Users\esauk\OneDrive\Documents\Blender\LT52A\LT52A_Architectural_Rebuild.blend")
FBX_OUTPUT = Path(r"C:\Users\esauk\OneDrive\Documents\Blender\LT52A\exports\LT52A_Architectural_Rebuild.fbx")


@dataclass(frozen=True)
class Opening:
    code: str
    side: str
    x1: float
    x2: float
    sill: float
    head: float
    kind: str


@dataclass(frozen=True)
class LT52AConfig:
    length_m: float = 10.2
    width_m: float = 5.1
    wall_height_m: float = 2.7
    wall_build_up_m: float = 0.15
    terrace_depth_m: float = 2.4
    primary_w_m: float = 0.095
    primary_d_m: float = 0.145
    stud_w_m: float = 0.045
    stud_d_m: float = 0.145
    stud_spacing_m: float = 0.6
    membrane_t_m: float = 0.018
    batten_t_m: float = 0.045
    batten_h_m: float = 0.045
    cladding_w_m: float = 0.122
    cladding_t_m: float = 0.022
    cladding_gap_m: float = 0.0
    base_z_m: float = 0.0


CFG = LT52AConfig()


def load_source_data() -> dict:
    if not SOURCE_JSON.exists():
        raise FileNotFoundError(f"Source JSON not found: {SOURCE_JSON}")
    return json.loads(SOURCE_JSON.read_text(encoding="utf-8"))


def source_openings() -> list[Opening]:
    return [
        Opening("SD1", "south", 2.7, 5.7, 0.0, 2.2, "slider"),
        Opening("W2", "south", 6.9, 9.3, 0.85, 2.05, "window"),
        Opening("W1", "north", 2.25, 4.65, 0.85, 2.05, "window"),
        Opening("W3", "north", 7.05, 7.75, 1.10, 2.30, "window"),
    ]


def build_summary(data: dict) -> dict:
    project = data["project"]
    return {
        "projectCode": project["code"],
        "projectName": project["name"],
        "generator": "lt52a_architectural_rebuild",
        "dimensions": {
            "lengthM": CFG.length_m,
            "widthM": CFG.width_m,
            "heightM": CFG.wall_height_m,
            "wallBuildUpM": CFG.wall_build_up_m,
            "terraceDepthM": CFG.terrace_depth_m,
        },
        "openings": [
            {
                "code": op.code,
                "side": op.side,
                "x1": op.x1,
                "x2": op.x2,
                "sill": op.sill,
                "head": op.head,
                "kind": op.kind,
            }
            for op in source_openings()
        ],
        "layers": [
            "plinth",
            "wall_backing",
            "primary_corner_and_opening_members",
            "stud_bays_at_600mm",
            "insulation_fields",
            "outer_membrane",
            "horizontal_battens",
            "tight_vertical_cladding",
            "opening_frames",
            "glazing_and_slider_units",
            "terrace",
            "roof",
        ],
        "notes": [
            "Exterior facade boards are tight, no fence-like gap.",
            "Primary members sit below facade plane.",
            "Openings are controlled per bay, not by blind 600 mm repetition.",
        ],
    }


def write_summary(summary: dict) -> None:
    OUTPUT_SUMMARY.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_SUMMARY.write_text(json.dumps(summary, indent=2, ensure_ascii=False), encoding="utf-8")


def try_import_blender():
    try:
        import bpy  # type: ignore
        return bpy
    except Exception:
        return None


def clear_scene(bpy) -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)


def ensure_collection(bpy, name: str, parent=None):
    collection = bpy.data.collections.get(name)
    if collection is None:
        collection = bpy.data.collections.new(name)
    if parent is None:
        if collection.name not in bpy.context.scene.collection.children:
            bpy.context.scene.collection.children.link(collection)
    else:
        if collection.name not in parent.children:
            parent.children.link(collection)
    return collection


def ensure_material(bpy, name: str, color: tuple[float, float, float, float], roughness: float = 0.65):
    material = bpy.data.materials.get(name)
    if material is None:
        material = bpy.data.materials.new(name=name)
        material.use_nodes = True
    principled = material.node_tree.nodes.get("Principled BSDF")
    if principled is not None:
        principled.inputs["Base Color"].default_value = color
        principled.inputs["Roughness"].default_value = roughness
    return material


def assign_material(obj, material):
    if len(obj.data.materials) == 0:
        obj.data.materials.append(material)
    else:
        obj.data.materials[0] = material


def create_box(bpy, name: str, location: tuple[float, float, float], size: tuple[float, float, float], collection, material=None):
    bpy.ops.mesh.primitive_cube_add(location=location)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = (size[0] / 2.0, size[1] / 2.0, size[2] / 2.0)
    if obj.users_collection:
        for current in list(obj.users_collection):
            current.objects.unlink(obj)
    collection.objects.link(obj)
    if material is not None:
        assign_material(obj, material)
    return obj


def subtract_intervals(base_start: float, base_end: float, blocked: list[tuple[float, float]]) -> list[tuple[float, float]]:
    segments = [(base_start, base_end)]
    for b_start, b_end in blocked:
        next_segments = []
        for s_start, s_end in segments:
            if b_end <= s_start or b_start >= s_end:
                next_segments.append((s_start, s_end))
                continue
            if b_start > s_start:
                next_segments.append((s_start, b_start))
            if b_end < s_end:
                next_segments.append((b_end, s_end))
        segments = next_segments
    return [(a, b) for a, b in segments if (b - a) > 0.03]


def distribute_centers(start_edge: float, end_edge: float, element_w: float, target_spacing: float) -> list[float]:
    usable = end_edge - start_edge
    if usable <= element_w:
        return [start_edge + usable / 2.0]
    count = max(1, int((usable + (target_spacing - element_w)) // target_spacing))
    while count > 1:
        total_used = count * element_w + (count - 1) * (target_spacing - element_w)
        if total_used <= usable + 0.001:
            break
        count -= 1
    total_used = count * element_w + (count - 1) * (target_spacing - element_w)
    edge_offset = max(0.0, (usable - total_used) / 2.0)
    return [
        start_edge + edge_offset + (element_w / 2.0) + idx * target_spacing
        for idx in range(count)
    ]


def openings_for_side(side: str) -> list[Opening]:
    return [op for op in source_openings() if op.side == side]


def build_plinth(bpy, collection, mat):
    create_box(
        bpy,
        "SM_LT52A_Plinth_Base",
        (CFG.length_m / 2.0, CFG.width_m / 2.0, -0.06),
        (CFG.length_m + 0.20, CFG.width_m + 0.20, 0.12),
        collection,
        mat,
    )


def build_primary_members_and_backing(bpy, collection, mats):
    h = CFG.wall_height_m
    z = CFG.base_z_m + h / 2.0
    t = CFG.wall_build_up_m
    pw = CFG.primary_w_m
    pd = CFG.primary_d_m

    # Backing wall faces split by openings
    def wall_x(name: str, x1: float, x2: float, y: float, zc: float, depth: float, height: float, mat):
        create_box(bpy, name, ((x1 + x2) / 2.0, y, zc), (max(0.02, x2 - x1), depth, height), collection, mat)

    def wall_y(name: str, x: float, y1: float, y2: float, zc: float, depth: float, height: float, mat):
        create_box(bpy, name, (x, (y1 + y2) / 2.0, zc), (depth, max(0.02, y2 - y1), height), collection, mat)

    for side, y_center in [("south", -(t / 2.0)), ("north", CFG.width_m + (t / 2.0))]:
        x_cursor = 0.0
        for idx, op in enumerate(openings_for_side(side), start=1):
            if op.x1 > x_cursor:
                wall_x(f"SM_LT52A_WallFace_{side}_{idx:02d}", x_cursor, op.x1, y_center, z, t, h, mats["membrane"])
            if op.sill > 0.0:
                wall_x(f"SM_LT52A_WallFace_{side}_{op.code}_Sill", op.x1, op.x2, y_center, op.sill / 2.0, t, op.sill, mats["membrane"])
            if op.head < h:
                wall_x(f"SM_LT52A_WallFace_{side}_{op.code}_Head", op.x1, op.x2, y_center, op.head + (h - op.head) / 2.0, t, h - op.head, mats["membrane"])
            x_cursor = op.x2
        if x_cursor < CFG.length_m:
            wall_x(f"SM_LT52A_WallFace_{side}_End", x_cursor, CFG.length_m, y_center, z, t, h, mats["membrane"])

    wall_y("SM_LT52A_WallFace_West", -(t / 2.0), 0.0, CFG.width_m, z, t, h, mats["membrane"])
    wall_y("SM_LT52A_WallFace_East", CFG.length_m + (t / 2.0), 0.0, CFG.width_m, z, t, h, mats["membrane"])

    # Corner heavy posts
    for name, loc in [
        ("SM_LT52A_Corner_Post_SW", (pw / 2.0, -(pd / 2.0), z)),
        ("SM_LT52A_Corner_Post_SE", (CFG.length_m - pw / 2.0, -(pd / 2.0), z)),
        ("SM_LT52A_Corner_Post_NW", (pw / 2.0, CFG.width_m + (pd / 2.0), z)),
        ("SM_LT52A_Corner_Post_NE", (CFG.length_m - pw / 2.0, CFG.width_m + (pd / 2.0), z)),
    ]:
        create_box(bpy, name, loc, (pw, pd, h), collection, mats["primary"])

    # Opening jamb posts + headers
    for side, y_center in [("south", pd / 2.0), ("north", CFG.width_m - (pd / 2.0))]:
        sign = -1.0 if side == "south" else 1.0
        face_y = -y_center if side == "south" else CFG.width_m + y_center
        for op in openings_for_side(side):
            open_h = op.head - CFG.base_z_m
            create_box(bpy, f"SM_LT52A_{op.code}_Post_Left", (op.x1 + (pw / 2.0), face_y, open_h / 2.0), (pw, pd, open_h), collection, mats["primary"])
            create_box(bpy, f"SM_LT52A_{op.code}_Post_Right", (op.x2 - (pw / 2.0), face_y, open_h / 2.0), (pw, pd, open_h), collection, mats["primary"])
            if op.head < h:
                create_box(
                    bpy,
                    f"SM_LT52A_{op.code}_Header",
                    ((op.x1 + op.x2) / 2.0, face_y, op.head + (CFG.primary_d_m / 2.0)),
                    (op.x2 - op.x1, pd, pd),
                    collection,
                    mats["primary"],
                )


def build_stud_bays(bpy, collection, mats):
    pw = CFG.primary_w_m
    sw = CFG.stud_w_m
    sd = CFG.stud_d_m
    spacing = CFG.stud_spacing_m
    h = CFG.wall_height_m
    z = CFG.base_z_m + h / 2.0

    def studs_x(side: str, face_y: float):
        ops = openings_for_side(side)
        blocked = [(op.x1 - pw, op.x2 + pw) for op in ops]
        bays = subtract_intervals(pw + 0.03, CFG.length_m - pw - 0.03, blocked)
        for bay_idx, (x1, x2) in enumerate(bays, start=1):
            centers = distribute_centers(x1, x2, sw, spacing)
            prev = x1
            for idx, center in enumerate(centers, start=1):
                create_box(bpy, f"SM_LT52A_{side}_Stud_{bay_idx:02d}_{idx:02d}", (center, face_y, z), (sw, sd, h), collection, mats["stud"])
                left = center - (sw / 2.0)
                if left - prev > 0.03:
                    create_box(
                        bpy,
                        f"SM_LT52A_{side}_Insulation_{bay_idx:02d}_{idx:02d}",
                        ((prev + left) / 2.0, face_y, z),
                        (left - prev, 0.03, h - 0.06),
                        collection,
                        mats["insulation"],
                    )
                prev = center + (sw / 2.0)
            if x2 - prev > 0.03:
                create_box(
                    bpy,
                    f"SM_LT52A_{side}_Insulation_{bay_idx:02d}_End",
                    ((prev + x2) / 2.0, face_y, z),
                    (x2 - prev, 0.03, h - 0.06),
                    collection,
                    mats["insulation"],
                )

    studs_x("south", 0.03)
    studs_x("north", CFG.width_m - 0.03)


def build_battens_and_cladding(bpy, collection, mats):
    h = CFG.wall_height_m
    batten_face_s = -CFG.batten_t_m / 2.0
    batten_face_n = CFG.width_m + CFG.batten_t_m / 2.0
    cladding_face_s = -(CFG.batten_t_m + CFG.cladding_t_m / 2.0)
    cladding_face_n = CFG.width_m + CFG.batten_t_m + CFG.cladding_t_m / 2.0

    # Horizontal battens
    z = 0.20
    batten_idx = 0
    while z < h - 0.10:
        create_box(bpy, f"SM_LT52A_Batten_S_{batten_idx:02d}", (CFG.length_m / 2.0, batten_face_s, z), (CFG.length_m - 0.20, CFG.batten_t_m, CFG.batten_h_m), collection, mats["batten"])
        create_box(bpy, f"SM_LT52A_Batten_N_{batten_idx:02d}", (CFG.length_m / 2.0, batten_face_n, z), (CFG.length_m - 0.20, CFG.batten_t_m, CFG.batten_h_m), collection, mats["batten"])
        z += CFG.stud_spacing_m
        batten_idx += 1

    # Tight vertical cladding with opening stop logic for north/south
    def add_cladding_for_side(side: str, face_y: float):
        ops = openings_for_side(side)
        board_idx = 0
        x = CFG.cladding_w_m / 2.0
        while x < CFG.length_m - (CFG.cladding_w_m / 2.0):
            blocked = []
            for op in ops:
                if (x + CFG.cladding_w_m / 2.0) > op.x1 and (x - CFG.cladding_w_m / 2.0) < op.x2:
                    blocked.append((op.sill - 0.02, op.head + 0.02))
            segments = subtract_intervals(0.02, h - 0.02, blocked)
            for seg_idx, (z1, z2) in enumerate(segments, start=1):
                create_box(
                    bpy,
                    f"SM_LT52A_Cladding_{side}_{board_idx:03d}_{seg_idx:02d}",
                    (x, face_y, (z1 + z2) / 2.0),
                    (CFG.cladding_w_m, CFG.cladding_t_m, z2 - z1),
                    collection,
                    mats["cladding"],
                )
            x += CFG.cladding_w_m + CFG.cladding_gap_m
            board_idx += 1

    add_cladding_for_side("south", cladding_face_s)
    add_cladding_for_side("north", cladding_face_n)


def create_architectural_rebuild(summary: dict) -> None:
    bpy = try_import_blender()
    if bpy is None:
        print("Blender bpy module not available. Summary only.")
        return

    clear_scene(bpy)

    master = ensure_collection(bpy, "LT52A_Architectural_Rebuild")
    exterior = ensure_collection(bpy, "Exterior", master)

    mats = {
        "plinth": ensure_material(bpy, "M_LT52A_Plinth", (0.14, 0.14, 0.14, 1.0), 0.92),
        "membrane": ensure_material(bpy, "M_LT52A_Membrane", (0.18, 0.18, 0.17, 1.0), 0.94),
        "primary": ensure_material(bpy, "M_LT52A_Primary", (0.42, 0.31, 0.18, 1.0), 0.80),
        "stud": ensure_material(bpy, "M_LT52A_Stud", (0.54, 0.41, 0.25, 1.0), 0.82),
        "insulation": ensure_material(bpy, "M_LT52A_Insulation", (0.86, 0.75, 0.24, 1.0), 0.96),
        "batten": ensure_material(bpy, "M_LT52A_Batten", (0.26, 0.20, 0.13, 1.0), 0.80),
        "cladding": ensure_material(bpy, "M_LT52A_Cladding", (0.31, 0.23, 0.14, 1.0), 0.76),
    }

    build_plinth(bpy, exterior, mats["plinth"])
    build_primary_members_and_backing(bpy, exterior, mats)
    build_stud_bays(bpy, exterior, mats)
    build_battens_and_cladding(bpy, exterior, mats)

    BLEND_OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    FBX_OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_OUTPUT))
    export_objects = [obj for obj in bpy.data.objects if obj.type == "MESH"]
    for obj in bpy.context.scene.objects:
        obj.select_set(False)
    for obj in export_objects:
        obj.select_set(True)
    if export_objects:
        bpy.context.view_layer.objects.active = export_objects[0]
    bpy.ops.export_scene.fbx(
        filepath=str(FBX_OUTPUT),
        use_selection=True,
        apply_scale_options="FBX_SCALE_UNITS",
        bake_space_transform=False,
    )
    print(f"BLEND saved to: {BLEND_OUTPUT}")
    print(f"FBX exported to: {FBX_OUTPUT}")


def main() -> int:
    data = load_source_data()
    summary = build_summary(data)
    write_summary(summary)
    create_architectural_rebuild(summary)
    print(f"Summary written to: {OUTPUT_SUMMARY}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
