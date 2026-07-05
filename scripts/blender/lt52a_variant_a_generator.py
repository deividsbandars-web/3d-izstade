"""
LT52A Variant A base generator.

This script is designed to run in Blender's Python environment.
It can also run in plain Python for a dry-run summary, which is useful for
validating the source data and the generation plan without Blender.

Purpose:
- generate the first architectural shell for LT52A Variant A;
- avoid relying on the simplified Rev C GLB as the final visual source;
- create a clean base for later Unreal import and detail expansion.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
import json


ROOT = Path(__file__).resolve().parents[2]
SOURCE_JSON = ROOT / "tmp" / "lt52a_revc_unpack" / "LT52A_luksus_koka_modulu_maja_RevC_data.json"
OUTPUT_SUMMARY = ROOT / "tmp" / "lt52a_variant_a_generator_summary.json"
BLEND_OUTPUT = Path(r"C:\Users\esauk\OneDrive\Documents\Blender\LT52A\LT52A_VariantA_RevD_BaseShell.blend")
FBX_OUTPUT = Path(r"C:\Users\esauk\OneDrive\Documents\Blender\LT52A\exports\LT52A_VariantA_RevD_BaseShell.fbx")


@dataclass(frozen=True)
class Opening:
    code: str
    opening_type: str
    width_m: float
    height_m: float
    quantity: int
    location: str


@dataclass(frozen=True)
class Room:
    name: str
    x: float
    y: float
    width_m: float
    depth_m: float
    area_m2: float


def load_source_data() -> dict:
    if not SOURCE_JSON.exists():
        raise FileNotFoundError(f"Source JSON not found: {SOURCE_JSON}")
    return json.loads(SOURCE_JSON.read_text(encoding="utf-8"))


def normalize_rooms(data: dict) -> list[Room]:
    rooms: list[Room] = []
    for room in data.get("rooms", []):
        rooms.append(
            Room(
                name=room["name"],
                x=float(room["x"]),
                y=float(room["y"]),
                width_m=float(room["w"]),
                depth_m=float(room["h"]),
                area_m2=float(room["area"]),
            )
        )
    return rooms


def normalize_openings(data: dict) -> list[Opening]:
    openings: list[Opening] = []
    for item in data.get("openings", []):
        openings.append(
            Opening(
                code=item["code"],
                opening_type=item["type"],
                width_m=float(item["w"]),
                height_m=float(item["h"]),
                quantity=int(item["qty"]),
                location=item["location"],
            )
        )
    return openings


def build_summary(data: dict) -> dict:
    project = data["project"]
    rooms = normalize_rooms(data)
    openings = normalize_openings(data)

    return {
        "projectCode": project["code"],
        "projectName": project["name"],
        "variant": "A",
        "dimensions": {
            "lengthM": float(project["length_m"]),
            "widthM": float(project["width_m"]),
            "heightM": float(project["wall_height_m"]),
            "wallThicknessM": float(project["wall_thickness_m"]),
            "terraceDepthM": float(project["terrace_depth_m"]),
            "moduleCount": int(project["module_count"]),
            "moduleWidthM": float(project["module_width_m"]),
        },
        "rooms": [
            {
                "name": room.name,
                "x": room.x,
                "y": room.y,
                "widthM": room.width_m,
                "depthM": room.depth_m,
                "areaM2": room.area_m2,
            }
            for room in rooms
        ],
        "openings": [
            {
                "code": opening.code,
                "type": opening.opening_type,
                "widthM": opening.width_m,
                "heightM": opening.height_m,
                "quantity": opening.quantity,
                "location": opening.location,
            }
            for opening in openings
        ],
        "generationPasses": [
            "floor_base",
            "exterior_wall_segments_with_openings",
            "interior_walls",
            "roof_base",
            "terrace_base",
            "openings",
            "furniture_blockout",
            "facade_board_placeholders",
            "window_door_frame_placeholders",
            "terrace_beam_placeholders",
            "roof_edge_placeholders",
        ],
        "limitations": [
            "No engineering approval",
            "No stud-by-stud construction detail in first pass",
            "No board-by-board facade detail in first pass",
            "No fabrication-ready export in first pass",
        ],
    }


def write_summary(summary: dict) -> None:
    OUTPUT_SUMMARY.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_SUMMARY.write_text(json.dumps(summary, indent=2, ensure_ascii=False), encoding="utf-8")


def try_import_blender():
    try:
        import bpy  # type: ignore
        import bmesh  # type: ignore
        return bpy, bmesh
    except Exception:
        return None, None


def clear_scene(bpy) -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for block in list(bpy.data.meshes):
        if block.users == 0:
            bpy.data.meshes.remove(block)
    for block in list(bpy.data.materials):
        if block.users == 0:
            bpy.data.materials.remove(block)


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


def create_box(bpy, name: str, location: tuple[float, float, float], size: tuple[float, float, float], collection):
    bpy.ops.mesh.primitive_cube_add(location=location)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = (size[0] / 2.0, size[1] / 2.0, size[2] / 2.0)
    if obj.users_collection:
        for current in list(obj.users_collection):
            current.objects.unlink(obj)
    collection.objects.link(obj)
    return obj


def ensure_material(bpy, name: str, base_color: tuple[float, float, float, float]):
    material = bpy.data.materials.get(name)
    if material is None:
        material = bpy.data.materials.new(name=name)
        material.use_nodes = True
    principled = material.node_tree.nodes.get("Principled BSDF")
    if principled is not None:
        principled.inputs["Base Color"].default_value = base_color
        principled.inputs["Roughness"].default_value = 0.6
    return material


def assign_material(obj, material):
    if len(obj.data.materials) == 0:
        obj.data.materials.append(material)
    else:
        obj.data.materials[0] = material


def create_wall_x(bpy, name, x1, x2, y_center, z_center, thickness, height, collection, material):
    width = max(0.02, x2 - x1)
    obj = create_box(
        bpy,
        name,
        location=((x1 + x2) / 2.0, y_center, z_center),
        size=(width, thickness, height),
        collection=collection,
    )
    assign_material(obj, material)
    return obj


def create_wall_y(bpy, name, x_center, y1, y2, z_center, thickness, height, collection, material):
    depth = max(0.02, y2 - y1)
    obj = create_box(
        bpy,
        name,
        location=(x_center, (y1 + y2) / 2.0, z_center),
        size=(thickness, depth, height),
        collection=collection,
    )
    assign_material(obj, material)
    return obj


def add_south_wall_segments(bpy, shell_collection, material, wall_thickness, wall_height_m):
    sill_w2 = 0.85
    head_w2 = 2.05
    sill_sd1 = 0.0
    head_sd1 = 2.2
    openings = [
        ("SD1", 2.7, 5.7, sill_sd1, head_sd1),
        ("W2", 6.9, 9.3, sill_w2, head_w2),
    ]
    y_center = -wall_thickness / 2.0
    x_cursor = 0.0
    seg_index = 1
    for code, x1, x2, sill, head in openings:
        if x1 > x_cursor:
            create_wall_x(
                bpy,
                f"SM_LT52A_SouthWall_Solid_{seg_index:02d}",
                x_cursor,
                x1,
                y_center,
                wall_height_m / 2.0,
                wall_thickness,
                wall_height_m,
                shell_collection,
                material,
            )
            seg_index += 1
        if sill > 0.0:
            create_wall_x(
                bpy,
                f"SM_LT52A_SouthWall_{code}_Sill",
                x1,
                x2,
                y_center,
                sill / 2.0,
                wall_thickness,
                sill,
                shell_collection,
                material,
            )
        if head < wall_height_m:
            create_wall_x(
                bpy,
                f"SM_LT52A_SouthWall_{code}_Head",
                x1,
                x2,
                y_center,
                head + (wall_height_m - head) / 2.0,
                wall_thickness,
                wall_height_m - head,
                shell_collection,
                material,
            )
        create_wall_x(
            bpy,
            f"SM_LT52A_SouthWall_{code}_LeftJamb",
            x1,
            x1 + 0.10,
            y_center,
            head / 2.0,
            wall_thickness,
            head,
            shell_collection,
            material,
        )
        create_wall_x(
            bpy,
            f"SM_LT52A_SouthWall_{code}_RightJamb",
            x2 - 0.10,
            x2,
            y_center,
            head / 2.0,
            wall_thickness,
            head,
            shell_collection,
            material,
        )
        x_cursor = x2
    if x_cursor < 10.2:
        create_wall_x(
            bpy,
            f"SM_LT52A_SouthWall_Solid_{seg_index:02d}",
            x_cursor,
            10.2,
            y_center,
            wall_height_m / 2.0,
            wall_thickness,
            wall_height_m,
            shell_collection,
            material,
        )


def add_north_wall_segments(bpy, shell_collection, material, wall_thickness, wall_height_m, width_m):
    openings = [
        ("W1A", 1.0, 3.4, 0.85, 2.05),
        ("W1B", 3.8, 6.2, 0.85, 2.05),
        ("W3", 7.05, 7.75, 1.1, 2.3),
        ("W4", 9.1, 9.7, 1.45, 2.05),
    ]
    y_center = width_m + wall_thickness / 2.0
    x_cursor = 0.0
    seg_index = 1
    for code, x1, x2, sill, head in openings:
        if x1 > x_cursor:
            create_wall_x(
                bpy,
                f"SM_LT52A_NorthWall_Solid_{seg_index:02d}",
                x_cursor,
                x1,
                y_center,
                wall_height_m / 2.0,
                wall_thickness,
                wall_height_m,
                shell_collection,
                material,
            )
            seg_index += 1
        create_wall_x(
            bpy,
            f"SM_LT52A_NorthWall_{code}_Sill",
            x1,
            x2,
            y_center,
            sill / 2.0,
            wall_thickness,
            sill,
            shell_collection,
            material,
        )
        if head < wall_height_m:
            create_wall_x(
                bpy,
                f"SM_LT52A_NorthWall_{code}_Head",
                x1,
                x2,
                y_center,
                head + (wall_height_m - head) / 2.0,
                wall_thickness,
                wall_height_m - head,
                shell_collection,
                material,
            )
        create_wall_x(
            bpy,
            f"SM_LT52A_NorthWall_{code}_LeftJamb",
            x1,
            x1 + 0.10,
            y_center,
            head / 2.0,
            wall_thickness,
            head,
            shell_collection,
            material,
        )
        create_wall_x(
            bpy,
            f"SM_LT52A_NorthWall_{code}_RightJamb",
            x2 - 0.10,
            x2,
            y_center,
            head / 2.0,
            wall_thickness,
            head,
            shell_collection,
            material,
        )
        x_cursor = x2
    if x_cursor < 10.2:
        create_wall_x(
            bpy,
            f"SM_LT52A_NorthWall_Solid_{seg_index:02d}",
            x_cursor,
            10.2,
            y_center,
            wall_height_m / 2.0,
            wall_thickness,
            wall_height_m,
            shell_collection,
            material,
        )


def add_west_wall_segments(bpy, shell_collection, material, wall_thickness, wall_height_m, width_m):
    opening_y1 = 0.65
    opening_y2 = 1.65
    head = 2.1
    x_center = -wall_thickness / 2.0
    create_wall_y(
        bpy,
        "SM_LT52A_WestWall_Solid_01",
        x_center,
        0.0,
        opening_y1,
        wall_height_m / 2.0,
        wall_thickness,
        wall_height_m,
        shell_collection,
        material,
    )
    create_wall_y(
        bpy,
        "SM_LT52A_WestWall_Solid_02",
        x_center,
        opening_y2,
        width_m,
        wall_height_m / 2.0,
        wall_thickness,
        wall_height_m,
        shell_collection,
        material,
    )
    create_wall_y(
        bpy,
        "SM_LT52A_WestWall_D1_Head",
        x_center,
        opening_y1,
        opening_y2,
        head + (wall_height_m - head) / 2.0,
        wall_thickness,
        wall_height_m - head,
        shell_collection,
        material,
    )
    create_wall_y(
        bpy,
        "SM_LT52A_WestWall_D1_LeftJamb",
        x_center,
        opening_y1,
        opening_y1 + 0.10,
        head / 2.0,
        wall_thickness,
        head,
        shell_collection,
        material,
    )
    create_wall_y(
        bpy,
        "SM_LT52A_WestWall_D1_RightJamb",
        x_center,
        opening_y2 - 0.10,
        opening_y2,
        head / 2.0,
        wall_thickness,
        head,
        shell_collection,
        material,
    )


def add_east_wall_segments(bpy, shell_collection, material, wall_thickness, wall_height_m, length_m, width_m):
    create_wall_y(
        bpy,
        "SM_LT52A_EastWall_Solid",
        length_m + wall_thickness / 2.0,
        0.0,
        width_m,
        wall_height_m / 2.0,
        wall_thickness,
        wall_height_m,
        shell_collection,
        material,
    )


def add_facade_boards(bpy, shell_collection, material, length_m, width_m, wall_height_m):
    board_thickness = 0.12
    board_depth = 0.055
    board_step = 0.155
    z = 0.22
    index = 0
    while z < wall_height_m - 0.10:
        north = create_box(
            bpy,
            f"SM_LT52A_FacadeBoard_North_{index:02d}",
            location=(length_m / 2.0, width_m + board_depth / 2.0, z),
            size=(length_m - 0.10, board_depth, board_thickness),
            collection=shell_collection,
        )
        south = create_box(
            bpy,
            f"SM_LT52A_FacadeBoard_South_{index:02d}",
            location=(length_m / 2.0, -board_depth / 2.0, z),
            size=(length_m - 0.10, board_depth, board_thickness),
            collection=shell_collection,
        )
        east = create_box(
            bpy,
            f"SM_LT52A_FacadeBoard_East_{index:02d}",
            location=(length_m + board_depth / 2.0, width_m / 2.0, z),
            size=(board_depth, width_m - 0.10, board_thickness),
            collection=shell_collection,
        )
        west = create_box(
            bpy,
            f"SM_LT52A_FacadeBoard_West_{index:02d}",
            location=(-board_depth / 2.0, width_m / 2.0, z),
            size=(board_depth, width_m - 0.10, board_thickness),
            collection=shell_collection,
        )
        for obj in [north, south, east, west]:
            assign_material(obj, material)
        z += board_step
        index += 1


def add_facade_corner_trims(bpy, shell_collection, material, length_m, width_m, wall_height_m):
    trim_depth = 0.08
    trim_width = 0.12
    trim_height = wall_height_m + 0.04
    trim_z = trim_height / 2.0
    placements = [
        ("SW", (0.0, 0.0, trim_z)),
        ("SE", (length_m, 0.0, trim_z)),
        ("NW", (0.0, width_m, trim_z)),
        ("NE", (length_m, width_m, trim_z)),
    ]
    for suffix, location in placements:
        obj = create_box(
            bpy,
            f"SM_LT52A_FacadeCornerTrim_{suffix}",
            location=location,
            size=(trim_width, trim_depth, trim_height),
            collection=shell_collection,
        )
        assign_material(obj, material)


def add_window_sills_and_headers(bpy, details_collection, material):
    placements = [
        ("W1A", (2.2, 5.19, 0.82), (2.62, 0.12, 0.06)),
        ("W1B", (5.0, 5.19, 0.82), (2.62, 0.12, 0.06)),
        ("W2", (8.1, -0.09, 0.82), (2.62, 0.12, 0.06)),
        ("W3", (7.4, 5.19, 1.06), (0.92, 0.12, 0.05)),
        ("W4", (9.4, 5.19, 1.42), (0.80, 0.12, 0.05)),
        ("SD1", (4.2, -0.08, 2.23), (3.26, 0.10, 0.08)),
        ("D1", (-0.08, 1.15, 2.08), (0.10, 1.22, 0.08)),
    ]
    for code, location, size in placements:
        sill = create_box(
            bpy,
            f"SM_LT52A_Trim_{code}",
            location=location,
            size=size,
            collection=details_collection,
        )
        assign_material(sill, material)


def add_roof_edges(bpy, shell_collection, material, length_m, width_m, wall_height_m):
    edge_h = 0.16
    edge_d = 0.08
    top_z = wall_height_m + 0.30
    parts = [
        ("North", (length_m / 2.0, width_m + edge_d / 2.0, top_z), (length_m + 0.34, edge_d, edge_h)),
        ("South", (length_m / 2.0, -edge_d / 2.0, top_z), (length_m + 0.34, edge_d, edge_h)),
        ("East", (length_m + edge_d / 2.0, width_m / 2.0, top_z), (edge_d, width_m + 0.34, edge_h)),
        ("West", (-edge_d / 2.0, width_m / 2.0, top_z), (edge_d, width_m + 0.34, edge_h)),
    ]
    for suffix, location, size in parts:
        obj = create_box(bpy, f"SM_LT52A_RoofEdge_{suffix}", location=location, size=size, collection=shell_collection)
        assign_material(obj, material)


def add_terrace_structure(bpy, terrace_collection, material, length_m, terrace_depth_m):
    beam_h = 0.12
    beam_w = 0.12
    beam_z = -0.10
    for idx, y in enumerate([-terrace_depth_m * 0.2, -terrace_depth_m * 0.5, -terrace_depth_m * 0.8], start=1):
        beam = create_box(
            bpy,
            f"SM_LT52A_TerraceBeam_{idx:02d}",
            location=(length_m / 2.0, y, beam_z),
            size=(length_m, beam_w, beam_h),
            collection=terrace_collection,
        )
        assign_material(beam, material)
    for idx, x in enumerate([0.4, length_m / 2.0, length_m - 0.4], start=1):
        post = create_box(
            bpy,
            f"SM_LT52A_TerracePost_{idx:02d}",
            location=(x, -terrace_depth_m + 0.10, -0.24),
            size=(0.12, 0.12, 0.48),
            collection=terrace_collection,
        )
        assign_material(post, material)
    board_step = 0.14
    board_depth = 0.03
    y = -0.08
    board_index = 1
    while y > -terrace_depth_m + 0.08:
        board = create_box(
            bpy,
            f"SM_LT52A_TerraceDeckBoard_{board_index:02d}",
            location=(length_m / 2.0, y, 0.17),
            size=(length_m - 0.10, board_depth, 0.025),
            collection=terrace_collection,
        )
        assign_material(board, material)
        y -= board_step
        board_index += 1


def add_window_and_door_frames(bpy, openings_collection, material):
    frame_depth = 0.06
    frame_thickness = 0.08
    placements = [
        ("D1", (0.0, 1.15, 1.05), (frame_depth, 1.16, 2.18)),
        ("SD1", (4.2, 0.0, 1.10), (3.20, frame_depth, 2.30)),
        ("W1A", (2.2, 5.10, 1.55), (2.55, frame_depth, 1.34)),
        ("W1B", (5.0, 5.10, 1.55), (2.55, frame_depth, 1.34)),
        ("W2", (8.1, 0.0, 1.55), (2.55, frame_depth, 1.34)),
        ("W3", (7.4, 5.10, 1.55), (0.86, frame_depth, 1.34)),
        ("W4", (9.4, 5.10, 1.75), (0.76, frame_depth, 0.76)),
        ("ID1", (6.55, 1.25, 1.02), (frame_depth, 0.92, 2.12)),
        ("ID2", (7.35, 3.00, 1.02), (frame_depth, 0.92, 2.12)),
        ("ID3", (8.82, 3.05, 1.02), (frame_depth, 0.82, 2.12)),
    ]
    for code, location, size in placements:
        frame = create_box(
            bpy,
            f"SM_LT52A_Frame_{code}",
            location=location,
            size=size,
            collection=openings_collection,
        )
        assign_material(frame, material)


def add_glazing_panels(bpy, openings_collection, material):
    placements = [
        ("SD1", (4.2, 0.02, 1.10), (2.88, 0.02, 2.08)),
        ("W1A", (2.2, 5.08, 1.55), (2.30, 0.02, 1.10)),
        ("W1B", (5.0, 5.08, 1.55), (2.30, 0.02, 1.10)),
        ("W2", (8.1, 0.02, 1.55), (2.30, 0.02, 1.10)),
        ("W3", (7.4, 5.08, 1.55), (0.62, 0.02, 1.08)),
        ("W4", (9.4, 5.08, 1.75), (0.52, 0.02, 0.52)),
    ]
    for code, location, size in placements:
        pane = create_box(
            bpy,
            f"SM_LT52A_GlassPane_{code}",
            location=location,
            size=size,
            collection=openings_collection,
        )
        assign_material(pane, material)


def add_interior_panel_seams(bpy, interior_collection, material, rooms):
    seam_w = 0.02
    for idx, room in enumerate(rooms, start=1):
        seam = create_box(
            bpy,
            f"SM_LT52A_InteriorSeam_{idx:02d}",
            location=(room["x"] + room["widthM"] / 2.0, room["y"] + room["depthM"] / 2.0, 1.35),
            size=(room["widthM"], seam_w, 2.65),
            collection=interior_collection,
        )
        assign_material(seam, material)


def room_zone_material(name: str, materials: dict):
    lowered = name.lower()
    if "living" in lowered or "kitchen" in lowered:
        return materials["living"]
    if "bedroom" in lowered:
        return materials["bedroom"]
    if "bath" in lowered:
        return materials["bathroom"]
    return materials["technical"]


def add_room_zone_surfaces(bpy, interior_collection, materials: dict, rooms):
    for room in rooms:
        mat = room_zone_material(room["name"], materials)
        zone = create_box(
            bpy,
            f"SM_LT52A_Zone_{sanitize_name(room['name'])}",
            location=(
                room["x"] + room["widthM"] / 2.0,
                room["y"] + room["depthM"] / 2.0,
                0.03,
            ),
            size=(max(0.18, room["widthM"] - 0.10), max(0.18, room["depthM"] - 0.10), 0.05),
            collection=interior_collection,
        )
        assign_material(zone, mat)


def add_room_markers(bpy, interior_collection, materials: dict, rooms):
    for room in rooms:
        mat = room_zone_material(room["name"], materials)
        marker = create_box(
            bpy,
            f"SM_LT52A_RoomMarker_{sanitize_name(room['name'])}",
            location=(
                room["x"] + min(room["widthM"] * 0.20, 0.55),
                room["y"] + min(room["depthM"] * 0.20, 0.35),
                1.80,
            ),
            size=(0.40, 0.04, 0.28),
            collection=interior_collection,
        )
        assign_material(marker, mat)


def add_interior_walls(bpy, interior_collection, material, wall_height_m):
    header_z = 2.30

    # Vertical wall between living and bedroom with door opening.
    x1, x2 = 6.50, 6.65
    for suffix, y1, y2 in [
        ("Lower", 0.0, 1.05),
        ("Upper", 1.95, 2.55),
    ]:
        wall = create_box(
            bpy,
            f"SM_LT52A_InteriorWall_LivingBedroom_{suffix}",
            location=((x1 + x2) / 2.0, (y1 + y2) / 2.0, wall_height_m / 2.0),
            size=(max(0.02, x2 - x1), max(0.02, y2 - y1), wall_height_m),
            collection=interior_collection,
        )
        assign_material(wall, material)
    header = create_box(
        bpy,
        "SM_LT52A_InteriorWall_LivingBedroom_Header",
        location=((x1 + x2) / 2.0, 1.50, header_z + (wall_height_m - header_z) / 2.0),
        size=(max(0.02, x2 - x1), 0.90, wall_height_m - header_z),
        collection=interior_collection,
    )
    assign_material(header, material)

    # Horizontal wall between bedroom and bath with opening.
    y1, y2 = 2.55, 2.70
    for suffix, x1, x2 in [
        ("Left", 6.50, 7.05),
        ("Right", 8.00, 8.80),
    ]:
        wall = create_box(
            bpy,
            f"SM_LT52A_InteriorWall_BedBath_{suffix}",
            location=((x1 + x2) / 2.0, (y1 + y2) / 2.0, wall_height_m / 2.0),
            size=(max(0.02, x2 - x1), max(0.02, y2 - y1), wall_height_m),
            collection=interior_collection,
        )
        assign_material(wall, material)
    header = create_box(
        bpy,
        "SM_LT52A_InteriorWall_BedBath_Header",
        location=(7.52, (y1 + y2) / 2.0, header_z + (wall_height_m - header_z) / 2.0),
        size=(0.95, max(0.02, y2 - y1), wall_height_m - header_z),
        collection=interior_collection,
    )
    assign_material(header, material)

    # Vertical wall between bath and technical with opening.
    x1, x2 = 8.80, 8.95
    for suffix, y1, y2 in [
        ("Lower", 2.55, 3.60),
        ("Upper", 4.45, 5.10),
    ]:
        wall = create_box(
            bpy,
            f"SM_LT52A_InteriorWall_BathTech_{suffix}",
            location=((x1 + x2) / 2.0, (y1 + y2) / 2.0, wall_height_m / 2.0),
            size=(max(0.02, x2 - x1), max(0.02, y2 - y1), wall_height_m),
            collection=interior_collection,
        )
        assign_material(wall, material)
    header = create_box(
        bpy,
        "SM_LT52A_InteriorWall_BathTech_Header",
        location=((x1 + x2) / 2.0, 4.03, header_z + (wall_height_m - header_z) / 2.0),
        size=(max(0.02, x2 - x1), 0.85, wall_height_m - header_z),
        collection=interior_collection,
    )
    assign_material(header, material)


def add_room_volume_shells(bpy, interior_collection, materials: dict, rooms, wall_height_m: float):
    for room in rooms:
        mat = room_zone_material(room["name"], materials)
        shell = create_box(
            bpy,
            f"SM_LT52A_RoomVolume_{sanitize_name(room['name'])}",
            location=(
                room["x"] + room["widthM"] / 2.0,
                room["y"] + room["depthM"] / 2.0,
                0.10,
            ),
            size=(
                max(0.28, room["widthM"] - 0.18),
                max(0.28, room["depthM"] - 0.18),
                0.20,
            ),
            collection=interior_collection,
        )
        assign_material(shell, mat)


def add_ceiling_rafts(bpy, interior_collection, material, rooms, wall_height_m: float):
    ceiling_z = wall_height_m - 0.12
    for room in rooms:
        raft = create_box(
            bpy,
            f"SM_LT52A_CeilingRaft_{sanitize_name(room['name'])}",
            location=(
                room["x"] + room["widthM"] / 2.0,
                room["y"] + room["depthM"] / 2.0,
                ceiling_z,
            ),
            size=(
                max(0.30, room["widthM"] - 0.22),
                max(0.30, room["depthM"] - 0.22),
                0.05,
            ),
            collection=interior_collection,
        )
        assign_material(raft, material)


def add_living_furniture(bpy, furniture_collection, materials: dict, width_m):
    kitchen_line = create_box(
        bpy,
        "SM_LT52A_Kitchen_Base",
        location=(1.25, width_m - 0.35, 0.45),
        size=(3.2, 0.65, 0.9),
        collection=furniture_collection,
    )
    assign_material(kitchen_line, materials["kitchen"])
    tall_unit = create_box(
        bpy,
        "SM_LT52A_Kitchen_TallUnit",
        location=(0.35, width_m - 0.34, 1.15),
        size=(0.62, 0.68, 2.30),
        collection=furniture_collection,
    )
    assign_material(tall_unit, materials["kitchen"])
    uppers = create_box(
        bpy,
        "SM_LT52A_Kitchen_Uppers",
        location=(1.55, width_m - 0.22, 1.78),
        size=(2.40, 0.28, 0.74),
        collection=furniture_collection,
    )
    assign_material(uppers, materials["kitchen"])
    island_base = create_box(
        bpy,
        "SM_LT52A_Kitchen_Island_Base",
        location=(2.8, width_m / 2.0, 0.44),
        size=(1.8, 0.90, 0.88),
        collection=furniture_collection,
    )
    assign_material(island_base, materials["kitchen"])
    island_top = create_box(
        bpy,
        "SM_LT52A_Kitchen_Island_Top",
        location=(2.8, width_m / 2.0, 0.92),
        size=(1.95, 1.02, 0.06),
        collection=furniture_collection,
    )
    assign_material(island_top, materials["furniture"])
    dining_top = create_box(
        bpy,
        "SM_LT52A_Dining_TableTop",
        location=(5.1, 2.4, 0.74),
        size=(1.85, 0.92, 0.08),
        collection=furniture_collection,
    )
    assign_material(dining_top, materials["furniture"])
    for idx, dx in enumerate([-0.72, 0.72], start=1):
        leg = create_box(
            bpy,
            f"SM_LT52A_Dining_Leg_{idx:02d}",
            location=(5.1 + dx, 2.4, 0.36),
            size=(0.10, 0.10, 0.72),
            collection=furniture_collection,
        )
        assign_material(leg, materials["furniture"])
    sofa_base = create_box(
        bpy,
        "SM_LT52A_Sofa_Base",
        location=(4.4, 1.15, 0.28),
        size=(2.25, 0.92, 0.56),
        collection=furniture_collection,
    )
    assign_material(sofa_base, materials["furniture"])
    sofa_back = create_box(
        bpy,
        "SM_LT52A_Sofa_Back",
        location=(4.4, 1.58, 0.72),
        size=(2.25, 0.12, 0.70),
        collection=furniture_collection,
    )
    assign_material(sofa_back, materials["furniture"])
    tv_niche = create_box(
        bpy,
        "SM_LT52A_TV_Fireplace_Niche",
        location=(6.05, 4.62, 0.86),
        size=(1.15, 0.22, 1.72),
        collection=furniture_collection,
    )
    assign_material(tv_niche, materials["interior"])


def add_bedroom_furniture(bpy, furniture_collection, materials: dict):
    bed_base = create_box(
        bpy,
        "SM_LT52A_Bed_Base",
        location=(8.3, 1.2, 0.22),
        size=(2.02, 1.82, 0.44),
        collection=furniture_collection,
    )
    assign_material(bed_base, materials["furniture"])
    mattress = create_box(
        bpy,
        "SM_LT52A_Bed_Mattress",
        location=(8.3, 1.2, 0.48),
        size=(1.92, 1.72, 0.18),
        collection=furniture_collection,
    )
    assign_material(mattress, materials["bedroom"])
    headboard = create_box(
        bpy,
        "SM_LT52A_Bed_Headboard",
        location=(9.2, 1.2, 0.82),
        size=(0.08, 1.90, 1.10),
        collection=furniture_collection,
    )
    assign_material(headboard, materials["bedroom"])
    wardrobe = create_box(
        bpy,
        "SM_LT52A_Wardrobe_Main",
        location=(9.55, 2.00, 1.10),
        size=(0.60, 1.20, 2.20),
        collection=furniture_collection,
    )
    assign_material(wardrobe, materials["bedroom"])
    nightstand = create_box(
        bpy,
        "SM_LT52A_Bedside_Block",
        location=(7.3, 0.55, 0.30),
        size=(0.42, 0.42, 0.60),
        collection=furniture_collection,
    )
    assign_material(nightstand, materials["furniture"])


def add_bathroom_furniture(bpy, furniture_collection, materials: dict):
    shower_tray = create_box(
        bpy,
        "SM_LT52A_Shower_Tray",
        location=(7.15, 4.20, 0.05),
        size=(0.92, 0.92, 0.10),
        collection=furniture_collection,
    )
    assign_material(shower_tray, materials["bathroom"])
    shower_glass = create_box(
        bpy,
        "SM_LT52A_Shower_Glass",
        location=(7.38, 4.44, 1.00),
        size=(0.04, 0.86, 2.00),
        collection=furniture_collection,
    )
    assign_material(shower_glass, materials["glass"])
    vanity = create_box(
        bpy,
        "SM_LT52A_Vanity_Main",
        location=(8.15, 4.35, 0.45),
        size=(0.82, 0.46, 0.90),
        collection=furniture_collection,
    )
    assign_material(vanity, materials["bathroom"])
    mirror = create_box(
        bpy,
        "SM_LT52A_Vanity_Mirror",
        location=(8.15, 4.58, 1.35),
        size=(0.72, 0.03, 0.88),
        collection=furniture_collection,
    )
    assign_material(mirror, materials["glass"])
    wc = create_box(
        bpy,
        "SM_LT52A_WC_Main",
        location=(8.35, 3.15, 0.40),
        size=(0.42, 0.68, 0.80),
        collection=furniture_collection,
    )
    assign_material(wc, materials["bathroom"])


def add_technical_furniture(bpy, furniture_collection, materials: dict):
    # Service furniture is intentionally omitted from the current exterior-focused Rev D pass.
    # It needs a dedicated design pass so it does not read as a random exterior wall block.
    return


def create_shell_geometry(summary: dict) -> None:
    bpy, _bmesh = try_import_blender()
    if bpy is None:
        print("Blender bpy module not available. Dry-run summary only.")
        return

    clear_scene(bpy)

    dims = summary["dimensions"]
    length_m = dims["lengthM"]
    width_m = dims["widthM"]
    wall_height_m = dims["heightM"]
    wall_thickness_m = dims["wallThicknessM"]
    terrace_depth_m = dims["terraceDepthM"]

    master = ensure_collection(bpy, "LT52A")
    shell = ensure_collection(bpy, "Shell", master)
    interior = ensure_collection(bpy, "Interior", master)
    openings_collection = ensure_collection(bpy, "Openings", master)
    furniture = ensure_collection(bpy, "Furniture", master)
    terrace = ensure_collection(bpy, "Terrace", master)
    details = ensure_collection(bpy, "Details", master)

    mat_exterior = ensure_material(bpy, "M_LT52A_ExteriorShell", (0.56, 0.42, 0.28, 1.0))
    mat_interior = ensure_material(bpy, "M_LT52A_Interior", (0.78, 0.69, 0.56, 1.0))
    mat_roof = ensure_material(bpy, "M_LT52A_Roof", (0.12, 0.12, 0.13, 1.0))
    mat_terrace = ensure_material(bpy, "M_LT52A_Terrace", (0.45, 0.31, 0.20, 1.0))
    mat_opening = ensure_material(bpy, "M_LT52A_OpeningPlaceholder", (0.15, 0.32, 0.60, 1.0))
    mat_furniture = ensure_material(bpy, "M_LT52A_FurnitureBlock", (0.42, 0.42, 0.42, 1.0))
    mat_frame = ensure_material(bpy, "M_LT52A_Frame", (0.10, 0.10, 0.10, 1.0))
    mat_seam = ensure_material(bpy, "M_LT52A_Seam", (0.30, 0.20, 0.12, 1.0))
    mat_trim = ensure_material(bpy, "M_LT52A_Trim", (0.22, 0.18, 0.14, 1.0))
    mat_glass = ensure_material(bpy, "M_LT52A_Glass", (0.62, 0.82, 0.92, 1.0))
    zone_materials = {
        "living": ensure_material(bpy, "M_LT52A_Zone_Living", (0.63, 0.49, 0.31, 1.0)),
        "bedroom": ensure_material(bpy, "M_LT52A_Zone_Bedroom", (0.55, 0.44, 0.36, 1.0)),
        "bathroom": ensure_material(bpy, "M_LT52A_Zone_Bathroom", (0.36, 0.49, 0.56, 1.0)),
        "technical": ensure_material(bpy, "M_LT52A_Zone_Technical", (0.42, 0.42, 0.38, 1.0)),
        "kitchen": ensure_material(bpy, "M_LT52A_Kitchen", (0.52, 0.50, 0.46, 1.0)),
        "interior": mat_interior,
        "furniture": mat_furniture,
        "glass": mat_glass,
    }

    floor = create_box(
        bpy,
        "SM_LT52A_Floor_Base",
        location=(length_m / 2.0, width_m / 2.0, 0.12),
        size=(length_m, width_m, 0.24),
        collection=shell,
    )
    assign_material(floor, mat_interior)

    add_south_wall_segments(bpy, shell, mat_exterior, wall_thickness_m, wall_height_m)
    add_north_wall_segments(bpy, shell, mat_exterior, wall_thickness_m, wall_height_m, width_m)
    add_west_wall_segments(bpy, shell, mat_exterior, wall_thickness_m, wall_height_m, width_m)
    add_east_wall_segments(bpy, shell, mat_exterior, wall_thickness_m, wall_height_m, length_m, width_m)

    add_room_zone_surfaces(bpy, interior, zone_materials, summary["rooms"])
    add_room_volume_shells(bpy, interior, zone_materials, summary["rooms"], wall_height_m)
    add_room_markers(bpy, interior, zone_materials, summary["rooms"])
    add_interior_walls(bpy, interior, mat_interior, wall_height_m)
    add_ceiling_rafts(bpy, interior, mat_interior, summary["rooms"], wall_height_m)

    roof_left = create_box(
        bpy,
        "SM_LT52A_Roof_Left",
        location=(length_m / 2.0, width_m * 0.24, wall_height_m + 0.13),
        size=(length_m + 0.32, width_m * 0.48, 0.18),
        collection=shell,
    )
    assign_material(roof_left, mat_roof)
    roof_right = create_box(
        bpy,
        "SM_LT52A_Roof_Right",
        location=(length_m / 2.0, width_m * 0.76, wall_height_m + 0.13),
        size=(length_m + 0.32, width_m * 0.48, 0.18),
        collection=shell,
    )
    assign_material(roof_right, mat_roof)
    skylight_strip = create_box(
        bpy,
        "SM_LT52A_Roof_SkylightStrip",
        location=(length_m / 2.0, width_m / 2.0, wall_height_m + 0.16),
        size=(length_m * 0.68, 0.22, 0.08),
        collection=details,
    )
    assign_material(skylight_strip, mat_glass)

    terrace_base = create_box(
        bpy,
        "SM_LT52A_Terrace_Base",
        location=(length_m / 2.0, -terrace_depth_m / 2.0, 0.08),
        size=(length_m, terrace_depth_m, 0.16),
        collection=terrace,
    )
    assign_material(terrace_base, mat_terrace)

    add_facade_boards(bpy, details, mat_exterior, length_m, width_m, wall_height_m)
    add_facade_corner_trims(bpy, details, mat_trim, length_m, width_m, wall_height_m)
    add_roof_edges(bpy, details, mat_roof, length_m, width_m, wall_height_m)
    add_window_sills_and_headers(bpy, details, mat_trim)
    add_terrace_structure(bpy, terrace, mat_terrace, length_m, terrace_depth_m)
    add_window_and_door_frames(bpy, openings_collection, mat_frame)
    add_glazing_panels(bpy, openings_collection, mat_glass)
    add_interior_panel_seams(bpy, interior, mat_seam, summary["rooms"])

    for opening in summary["openings"]:
        base_name = f"SM_LT52A_Opening_{opening['code']}"
        for index in range(opening["quantity"]):
            opening_obj = create_box(
                bpy,
                base_name if opening["quantity"] == 1 else f"{base_name}_{index + 1}",
                location=(0.0, 0.0, opening["heightM"] / 2.0),
                size=(opening["widthM"], wall_thickness_m, opening["heightM"]),
                collection=openings_collection,
            )
            assign_material(opening_obj, mat_opening)

    add_living_furniture(bpy, furniture, zone_materials, width_m)
    add_bedroom_furniture(bpy, furniture, zone_materials)
    add_bathroom_furniture(bpy, furniture, zone_materials)
    add_technical_furniture(bpy, furniture, zone_materials)

    for obj in bpy.context.scene.objects:
        obj.select_set(False)

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

    print("LT52A Variant A shell generation completed in Blender.")
    print(f"BLEND saved to: {BLEND_OUTPUT}")
    print(f"FBX exported to: {FBX_OUTPUT}")


def sanitize_name(name: str) -> str:
    cleaned = "".join(char if char.isalnum() else "_" for char in name)
    while "__" in cleaned:
        cleaned = cleaned.replace("__", "_")
    return cleaned.strip("_")


def main() -> int:
    data = load_source_data()
    summary = build_summary(data)
    write_summary(summary)
    create_shell_geometry(summary)
    print(f"Summary written to: {OUTPUT_SUMMARY}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
