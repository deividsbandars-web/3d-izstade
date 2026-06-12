from __future__ import annotations

import unreal


LEVEL_PATH = "/Game/ModularHome/LT52A/Maps/LT52A_Showroom"
MAT_DEST = "/Game/ModularHome/LT52A/Materials"
TAG = "LT52A_GeneratedExterior"

# World-space reference derived from the valid LT52A floor actor in the current project.
MIN_X = -443.5
MAX_X = 576.5
MAX_Y = 143.5
MIN_Y = -366.5
WALL_T = 15.0
WALL_H = 270.0
BOTTOM_Z = 48.0
TOP_Z = BOTTOM_Z + WALL_H
CENTER_Z = BOTTOM_Z + WALL_H / 2.0


def ensure_material_instance(name: str, color: unreal.LinearColor):
    unreal.EditorAssetLibrary.make_directory(MAT_DEST)
    asset_path = f"{MAT_DEST}/{name}"
    material = unreal.EditorAssetLibrary.load_asset(asset_path)
    parent = unreal.EditorAssetLibrary.load_asset("/Engine/BasicShapes/BasicShapeMaterial.BasicShapeMaterial")
    if not material:
        factory = unreal.MaterialInstanceConstantFactoryNew()
        material = unreal.AssetToolsHelpers.get_asset_tools().create_asset(
            name,
            MAT_DEST,
            unreal.MaterialInstanceConstant,
            factory,
        )
    if material and parent:
        try:
            material.set_editor_property("parent", parent)
        except Exception:
            pass
        for param in ["Color", "BaseColor"]:
            try:
                unreal.MaterialEditingLibrary.set_material_instance_vector_parameter_value(material, param, color)
            except Exception:
                pass
        unreal.EditorAssetLibrary.save_loaded_asset(material)
    return material


def load_cube():
    return unreal.EditorAssetLibrary.load_asset("/Engine/BasicShapes/Cube.Cube")


def local_x(meters: float) -> float:
    return MIN_X + meters * 100.0


def local_y(meters: float) -> float:
    return MAX_Y - meters * 100.0


def destroy_previous():
    for actor in list(unreal.EditorLevelLibrary.get_all_level_actors()):
        label = actor.get_actor_label().lower()
        tags = [str(tag) for tag in getattr(actor, "tags", [])]
        if TAG in tags:
            unreal.EditorLevelLibrary.destroy_actor(actor)
            continue
        if any(token in label for token in ["lt52a_showroom_backdrop", "lt52a_showroom_leftwing", "lt52a_showroom_rightwing"]):
            unreal.EditorLevelLibrary.destroy_actor(actor)
            continue
        if any(
            token in label
            for token in [
                "lt52a_sm_lt52a_floor_base",
                "lt52a_sm_lt52a_exteriorwalls",
                "lt52a_sm_lt52a_northwall_",
                "lt52a_sm_lt52a_southwall_",
                "lt52a_sm_lt52a_eastwall_",
                "lt52a_sm_lt52a_westwall_",
                "lt52a_sm_lt52a_facadeboard_",
                "lt52a_sm_lt52a_facadecornertrim_",
                "lt52a_sm_lt52a_entry_bench",
                "lt52a_sm_lt52a_technical_",
            ]
        ):
            unreal.EditorLevelLibrary.destroy_actor(actor)


def spawn_block(label: str, location: unreal.Vector, size: unreal.Vector, material):
    actor = unreal.EditorLevelLibrary.spawn_actor_from_class(unreal.StaticMeshActor, location, unreal.Rotator(0, 0, 0))
    actor.set_actor_label(label)
    actor.tags = [TAG]
    actor.set_actor_scale3d(unreal.Vector(size.x / 100.0, size.y / 100.0, size.z / 100.0))
    comp = actor.get_component_by_class(unreal.StaticMeshComponent)
    cube = load_cube()
    if cube:
        comp.set_static_mesh(cube)
    if material:
        comp.set_material(0, material)
    return actor


def set_material_on_labeled_actors(label_tokens: list[str], material):
    lowered = [token.lower() for token in label_tokens]
    for actor in unreal.EditorLevelLibrary.get_all_level_actors():
        label = actor.get_actor_label().lower()
        if not any(token in label for token in lowered):
            continue
        comp = actor.get_component_by_class(unreal.StaticMeshComponent)
        if comp and material:
            try:
                slot_count = 1
                try:
                    slot_count = max(1, int(comp.get_num_materials()))
                except Exception:
                    slot_count = 1
                for slot_index in range(slot_count):
                    comp.set_material(slot_index, material)
            except Exception:
                pass


def wall_x(label: str, x1: float, x2: float, y_center: float, z_center: float, thickness: float, height: float, material):
    width = max(2.0, x2 - x1)
    spawn_block(
        label,
        unreal.Vector((x1 + x2) / 2.0, y_center, z_center),
        unreal.Vector(width, thickness, height),
        material,
    )


def wall_y(label: str, x_center: float, y1: float, y2: float, z_center: float, thickness: float, height: float, material):
    depth = max(2.0, y2 - y1)
    spawn_block(
        label,
        unreal.Vector(x_center, (y1 + y2) / 2.0, z_center),
        unreal.Vector(thickness, depth, height),
        material,
    )


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
    return [(a, b) for a, b in segments if (b - a) >= 12.0]


def build_shell(wall_mat):
    plinth_mat = ensure_material_instance("M_Plith_Dark", unreal.LinearColor(0.16, 0.16, 0.15, 1.0))
    spawn_block(
        "LT52A_GEN_Plinth_Base",
        unreal.Vector((MIN_X + MAX_X) / 2.0, (MIN_Y + MAX_Y) / 2.0, BOTTOM_Z - 12.0),
        unreal.Vector((MAX_X - MIN_X) + 20.0, (MAX_Y - MIN_Y) + 20.0, 24.0),
        plinth_mat,
    )
    south_y = MAX_Y + WALL_T / 2.0
    north_y = MIN_Y - WALL_T / 2.0
    west_x = MIN_X - WALL_T / 2.0
    east_x = MAX_X + WALL_T / 2.0

    # South wall: terrace side, with SD1 and W2 openings.
    south_openings = [
        ("SD1", local_x(2.7), local_x(5.7), 0.0, 220.0),
        ("W2", local_x(6.9), local_x(9.3), 85.0, 205.0),
    ]
    x_cursor = MIN_X
    idx = 1
    for code, x1, x2, sill, head in south_openings:
        if x1 > x_cursor:
            wall_x(f"LT52A_GEN_South_Solid_{idx:02d}", x_cursor, x1, south_y, CENTER_Z, WALL_T, WALL_H, wall_mat)
            idx += 1
        if sill > 0:
            wall_x(f"LT52A_GEN_South_{code}_Sill", x1, x2, south_y, BOTTOM_Z + sill / 2.0, WALL_T, sill, wall_mat)
        if head < WALL_H:
            wall_x(f"LT52A_GEN_South_{code}_Head", x1, x2, south_y, head + (WALL_H - head) / 2.0 + BOTTOM_Z, WALL_T, WALL_H - head, wall_mat)
        wall_x(f"LT52A_GEN_South_{code}_LeftJamb", x1, x1 + 10.0, south_y, BOTTOM_Z + head / 2.0, WALL_T, head, wall_mat)
        wall_x(f"LT52A_GEN_South_{code}_RightJamb", x2 - 10.0, x2, south_y, BOTTOM_Z + head / 2.0, WALL_T, head, wall_mat)
        x_cursor = x2
    if x_cursor < MAX_X:
        wall_x(f"LT52A_GEN_South_Solid_{idx:02d}", x_cursor, MAX_X, south_y, CENTER_Z, WALL_T, WALL_H, wall_mat)

    # North wall.
    north_openings = [
        ("W1A", local_x(1.0), local_x(3.4), 85.0, 205.0),
        ("W1B", local_x(3.8), local_x(6.2), 85.0, 205.0),
        ("W3", local_x(7.05), local_x(7.75), 110.0, 230.0),
        ("W4", local_x(9.1), local_x(9.7), 145.0, 205.0),
    ]
    x_cursor = MIN_X
    idx = 1
    for code, x1, x2, sill, head in north_openings:
        if x1 > x_cursor:
            wall_x(f"LT52A_GEN_North_Solid_{idx:02d}", x_cursor, x1, north_y, CENTER_Z, WALL_T, WALL_H, wall_mat)
            idx += 1
        wall_x(f"LT52A_GEN_North_{code}_Sill", x1, x2, north_y, BOTTOM_Z + sill / 2.0, WALL_T, sill, wall_mat)
        if head < WALL_H:
            wall_x(f"LT52A_GEN_North_{code}_Head", x1, x2, north_y, head + (WALL_H - head) / 2.0 + BOTTOM_Z, WALL_T, WALL_H - head, wall_mat)
        wall_x(f"LT52A_GEN_North_{code}_LeftJamb", x1, x1 + 10.0, north_y, BOTTOM_Z + head / 2.0, WALL_T, head, wall_mat)
        wall_x(f"LT52A_GEN_North_{code}_RightJamb", x2 - 10.0, x2, north_y, BOTTOM_Z + head / 2.0, WALL_T, head, wall_mat)
        x_cursor = x2
    if x_cursor < MAX_X:
        wall_x(f"LT52A_GEN_North_Solid_{idx:02d}", x_cursor, MAX_X, north_y, CENTER_Z, WALL_T, WALL_H, wall_mat)

    # West entry wall with D1.
    y1 = local_y(0.65)
    y2 = local_y(1.65)
    head = 210.0
    wall_y("LT52A_GEN_West_Solid_01", west_x, y1, MAX_Y, CENTER_Z, WALL_T, WALL_H, wall_mat)
    wall_y("LT52A_GEN_West_Solid_02", west_x, MIN_Y, y2, CENTER_Z, WALL_T, WALL_H, wall_mat)
    wall_y("LT52A_GEN_West_D1_Head", west_x, y2, y1, head + (WALL_H - head) / 2.0 + BOTTOM_Z, WALL_T, WALL_H - head, wall_mat)
    wall_y("LT52A_GEN_West_D1_LeftJamb", west_x, y1 - 10.0, y1, BOTTOM_Z + head / 2.0, WALL_T, head, wall_mat)
    wall_y("LT52A_GEN_West_D1_RightJamb", west_x, y2, y2 + 10.0, BOTTOM_Z + head / 2.0, WALL_T, head, wall_mat)

    # East wall solid.
    wall_y("LT52A_GEN_East_Solid", east_x, MIN_Y, MAX_Y, CENTER_Z, WALL_T, WALL_H, wall_mat)


def build_cladding(board_mat, trim_mat):
    board_width = 18.0
    board_depth = 8.0
    board_gap = 3.5
    vertical_margin = 10.0
    x_margin = 8.0
    y_margin = 8.0
    batten_width = 6.0
    batten_depth = 4.0

    north_openings = [
        (local_x(1.0), local_x(3.4), BOTTOM_Z + 85.0, BOTTOM_Z + 205.0),
        (local_x(3.8), local_x(6.2), BOTTOM_Z + 85.0, BOTTOM_Z + 205.0),
        (local_x(7.05), local_x(7.75), BOTTOM_Z + 110.0, BOTTOM_Z + 230.0),
        (local_x(9.1), local_x(9.7), BOTTOM_Z + 145.0, BOTTOM_Z + 205.0),
    ]
    south_openings = [
        (local_x(2.7), local_x(5.7), BOTTOM_Z + 0.0, BOTTOM_Z + 220.0),
        (local_x(6.9), local_x(9.3), BOTTOM_Z + 85.0, BOTTOM_Z + 205.0),
    ]
    west_openings = [
        (local_y(1.72), local_y(0.58), BOTTOM_Z - 4.0, BOTTOM_Z + 214.0),
    ]

    def add_vertical_board_x(prefix: str, x_center: float, y_center: float, z1: float, z2: float, idx: int, board_offset: float):
        height = z2 - z1
        if height < 18.0:
            return
        wall_x(
            f"{prefix}_{idx:03d}",
            x_center - board_width / 2.0,
            x_center + board_width / 2.0,
            y_center + board_offset,
            z1 + height / 2.0,
            board_depth,
            height,
            board_mat,
        )

    def add_vertical_board_y(prefix: str, x_center: float, y_center: float, z1: float, z2: float, idx: int, board_offset: float):
        height = z2 - z1
        if height < 18.0:
            return
        wall_y(
            f"{prefix}_{idx:03d}",
            x_center + board_offset,
            y_center - board_width / 2.0,
            y_center + board_width / 2.0,
            z1 + height / 2.0,
            board_depth,
            height,
            board_mat,
        )

    def add_battens_north_south(
        prefix: str,
        y_center: float,
        start_x: float,
        end_x: float,
        offset_sign: float,
        openings: list[tuple[float, float, float, float]],
    ):
        x = start_x + 4.0
        idx = 0
        while x < end_x - 4.0:
            blocked = False
            for x1, x2, _z1, _z2 in openings:
                if (x - batten_width / 2.0) < (x2 + 10.0) and (x + batten_width / 2.0) > (x1 - 10.0):
                    blocked = True
                    break
            if blocked:
                x += (board_width + board_gap) * 2.0
                idx += 1
                continue
            wall_x(
                f"{prefix}_{idx:03d}",
                x - batten_width / 2.0,
                x + batten_width / 2.0,
                y_center + offset_sign * (board_depth / 2.0 + batten_depth / 2.0 + 1.0),
                BOTTOM_Z + WALL_H / 2.0,
                batten_depth,
                WALL_H - 4.0,
                trim_mat,
            )
            x += (board_width + board_gap) * 2.0
            idx += 1

    def add_battens_east_west(
        prefix: str,
        x_center: float,
        start_y: float,
        end_y: float,
        offset_sign: float,
        openings: list[tuple[float, float, float, float]],
    ):
        y = start_y + 4.0
        idx = 0
        while y < end_y - 4.0:
            blocked = False
            for y1, y2, _z1, _z2 in openings:
                low = min(y1, y2)
                high = max(y1, y2)
                if (y - batten_width / 2.0) < (high + 10.0) and (y + batten_width / 2.0) > (low - 10.0):
                    blocked = True
                    break
            if blocked:
                y += (board_width + board_gap) * 2.0
                idx += 1
                continue
            wall_y(
                f"{prefix}_{idx:03d}",
                x_center + offset_sign * (board_depth / 2.0 + batten_depth / 2.0 + 1.0),
                y - batten_width / 2.0,
                y + batten_width / 2.0,
                BOTTOM_Z + WALL_H / 2.0,
                batten_depth,
                WALL_H - 4.0,
                trim_mat,
            )
            y += (board_width + board_gap) * 2.0
            idx += 1

    def build_face_x(prefix: str, x_start: float, x_end: float, y_center: float, openings: list[tuple[float, float, float, float]], offset_sign: float):
        idx = 0
        x = x_start + x_margin + board_width / 2.0
        while x < x_end - x_margin - board_width / 2.0:
            blocked = []
            for x1, x2, z1, z2 in openings:
                if (x - board_width / 2.0) < (x2 + 10.0) and (x + board_width / 2.0) > (x1 - 10.0):
                    blocked.append((z1 - 8.0, z2 + 8.0))
            for seg_idx, (z1, z2) in enumerate(subtract_intervals(BOTTOM_Z + vertical_margin, TOP_Z - vertical_margin, blocked), start=1):
                add_vertical_board_x(prefix + f"_{seg_idx:02d}", x, y_center, z1, z2, idx, offset_sign * 1.5)
            x += board_width + board_gap
            idx += 1

    def build_face_y(prefix: str, x_center: float, y_start: float, y_end: float, openings: list[tuple[float, float, float, float]], offset_sign: float):
        idx = 0
        y = y_start + y_margin + board_width / 2.0
        while y < y_end - y_margin - board_width / 2.0:
            blocked = []
            for y1, y2, z1, z2 in openings:
                low = min(y1, y2)
                high = max(y1, y2)
                if (y - board_width / 2.0) < (high + 10.0) and (y + board_width / 2.0) > (low - 10.0):
                    blocked.append((z1 - 8.0, z2 + 8.0))
            for seg_idx, (z1, z2) in enumerate(subtract_intervals(BOTTOM_Z + vertical_margin, TOP_Z - vertical_margin, blocked), start=1):
                add_vertical_board_y(prefix + f"_{seg_idx:02d}", x_center, y, z1, z2, idx, offset_sign * 1.5)
            y += board_width + board_gap
            idx += 1

    build_face_x("LT52A_GEN_Cladding_N", MIN_X, MAX_X, MIN_Y - WALL_T - board_depth / 2.0, north_openings, -1.0)
    build_face_x("LT52A_GEN_Cladding_S", MIN_X, MAX_X, MAX_Y + WALL_T + board_depth / 2.0, south_openings, 1.0)
    build_face_y("LT52A_GEN_Cladding_W", MIN_X - WALL_T - board_depth / 2.0, MIN_Y, MAX_Y, west_openings, -1.0)
    build_face_y("LT52A_GEN_Cladding_E", MAX_X + WALL_T + board_depth / 2.0, MIN_Y, MAX_Y, [], 1.0)

    add_battens_north_south("LT52A_GEN_Batten_N", MIN_Y - WALL_T - board_depth, MIN_X + x_margin, MAX_X - x_margin, -1.0, north_openings)
    add_battens_north_south("LT52A_GEN_Batten_S", MAX_Y + WALL_T + board_depth, MIN_X + x_margin, MAX_X - x_margin, 1.0, south_openings)
    add_battens_east_west("LT52A_GEN_Batten_W", MIN_X - WALL_T - board_depth, MIN_Y + y_margin, MAX_Y - y_margin, -1.0, west_openings)
    add_battens_east_west("LT52A_GEN_Batten_E", MAX_X + WALL_T + board_depth, MIN_Y + y_margin, MAX_Y - y_margin, 1.0, [])

    trim_w = 18.0
    trim_d = 12.0
    trim_h = WALL_H + 8.0
    trim_z = BOTTOM_Z + trim_h / 2.0
    positions = [
        ("NW", unreal.Vector(MIN_X - WALL_T - trim_w / 2.0, MIN_Y - WALL_T - trim_d / 2.0, trim_z)),
        ("NE", unreal.Vector(MAX_X + WALL_T + trim_w / 2.0, MIN_Y - WALL_T - trim_d / 2.0, trim_z)),
        ("SW", unreal.Vector(MIN_X - WALL_T - trim_w / 2.0, MAX_Y + WALL_T + trim_d / 2.0, trim_z)),
        ("SE", unreal.Vector(MAX_X + WALL_T + trim_w / 2.0, MAX_Y + WALL_T + trim_d / 2.0, trim_z)),
    ]
    for suffix, loc in positions:
        spawn_block(f"LT52A_GEN_CornerTrim_{suffix}", loc, unreal.Vector(trim_w, trim_d, trim_h), trim_mat)


def build_opening_frames(frame_mat, glass_mat):
    frame_depth = 16.0
    frame_width = 10.0
    reveal_depth = 14.0
    reveal_width = 12.0
    cap_depth = 6.0
    cap_width = 8.0
    south_y = MAX_Y + WALL_T + frame_depth / 2.0 + 0.5
    north_y = MIN_Y - WALL_T - frame_depth / 2.0 - 0.5
    west_x = MIN_X - WALL_T - frame_depth / 2.0 - 0.5

    def frame_x(prefix: str, x1: float, x2: float, y_center: float, sill_z: float, head_z: float):
        wall_x(f"{prefix}_Head", x1, x2, y_center, head_z - frame_width / 2.0, frame_depth, frame_width, frame_mat)
        wall_x(f"{prefix}_Sill", x1, x2, y_center, sill_z + frame_width / 2.0, frame_depth, frame_width, frame_mat)
        wall_x(f"{prefix}_Left", x1 + frame_width / 2.0, x1 + frame_width, y_center, (sill_z + head_z) / 2.0, frame_depth, head_z - sill_z, frame_mat)
        wall_x(f"{prefix}_Right", x2 - frame_width, x2 - frame_width / 2.0, y_center, (sill_z + head_z) / 2.0, frame_depth, head_z - sill_z, frame_mat)
        inner_y = y_center - (frame_depth / 2.0) if y_center > 0 else y_center + (frame_depth / 2.0)
        wall_x(f"{prefix}_RevealTop", x1 + reveal_width, x2 - reveal_width, inner_y, head_z - reveal_width / 2.0, reveal_depth, reveal_width, frame_mat)
        if sill_z > BOTTOM_Z + 2.0:
            wall_x(f"{prefix}_RevealSill", x1 + reveal_width, x2 - reveal_width, inner_y, sill_z + reveal_width / 2.0, reveal_depth, reveal_width, frame_mat)
        outer_y = y_center + (frame_depth / 2.0) if y_center > 0 else y_center - (frame_depth / 2.0)
        wall_x(f"{prefix}_CapTop", x1 - 6.0, x2 + 6.0, outer_y, head_z + cap_width / 2.0, cap_depth, cap_width, frame_mat)
        if sill_z > BOTTOM_Z + 2.0:
            wall_x(f"{prefix}_CapSill", x1 - 6.0, x2 + 6.0, outer_y, sill_z - cap_width / 2.0, cap_depth, cap_width, frame_mat)
        wall_x(f"{prefix}_OuterLeft", x1 - cap_width / 2.0, x1 + cap_width / 2.0, outer_y, (sill_z + head_z) / 2.0, cap_depth, head_z - sill_z + cap_width, frame_mat)
        wall_x(f"{prefix}_OuterRight", x2 - cap_width / 2.0, x2 + cap_width / 2.0, outer_y, (sill_z + head_z) / 2.0, cap_depth, head_z - sill_z + cap_width, frame_mat)

    def frame_y(prefix: str, x_center: float, y1: float, y2: float, sill_z: float, head_z: float):
        wall_y(f"{prefix}_Head", x_center, y1, y2, head_z - frame_width / 2.0, frame_depth, frame_width, frame_mat)
        wall_y(f"{prefix}_Sill", x_center, y1, y2, sill_z + frame_width / 2.0, frame_depth, frame_width, frame_mat)
        wall_y(f"{prefix}_Left", x_center, y1 + frame_width / 2.0, y1 + frame_width, (sill_z + head_z) / 2.0, frame_depth, head_z - sill_z, frame_mat)
        wall_y(f"{prefix}_Right", x_center, y2 - frame_width, y2 - frame_width / 2.0, (sill_z + head_z) / 2.0, frame_depth, head_z - sill_z, frame_mat)
        inner_x = x_center + (frame_depth / 2.0)
        wall_y(f"{prefix}_RevealTop", inner_x, y1 + reveal_width, y2 - reveal_width, head_z - reveal_width / 2.0, reveal_depth, reveal_width, frame_mat)
        outer_x = x_center - (frame_depth / 2.0)
        wall_y(f"{prefix}_CapHead", outer_x, y1 - 6.0, y2 + 6.0, head_z + cap_width / 2.0, cap_depth, cap_width, frame_mat)
        wall_y(f"{prefix}_CapLeft", outer_x, y1 - cap_width / 2.0, y1 + cap_width / 2.0, (sill_z + head_z) / 2.0, cap_depth, head_z - sill_z + cap_width, frame_mat)
        wall_y(f"{prefix}_CapRight", outer_x, y2 - cap_width / 2.0, y2 + cap_width / 2.0, (sill_z + head_z) / 2.0, cap_depth, head_z - sill_z + cap_width, frame_mat)

    # South facade
    frame_x("LT52A_GEN_Frame_SD1", local_x(2.7), local_x(5.7), south_y, BOTTOM_Z, BOTTOM_Z + 220.0)
    spawn_block(
        "LT52A_GEN_Glass_SD1",
        unreal.Vector((local_x(2.7) + local_x(5.7)) / 2.0, south_y - 1.5, BOTTOM_Z + 110.0),
        unreal.Vector(local_x(5.7) - local_x(2.7) - 20.0, 2.0, 200.0),
        glass_mat,
    )
    frame_x("LT52A_GEN_Frame_W2", local_x(6.9), local_x(9.3), south_y, BOTTOM_Z + 85.0, BOTTOM_Z + 205.0)
    spawn_block(
        "LT52A_GEN_Glass_W2",
        unreal.Vector((local_x(6.9) + local_x(9.3)) / 2.0, south_y - 1.5, BOTTOM_Z + 145.0),
        unreal.Vector(local_x(9.3) - local_x(6.9) - 20.0, 2.0, 100.0),
        glass_mat,
    )
    wall_x("LT52A_GEN_W2_SillShelf", local_x(6.9) - 8.0, local_x(9.3) + 8.0, south_y + 8.0, BOTTOM_Z + 78.0, 18.0, 8.0, frame_mat)

    # North facade
    north_windows = [
        ("W1A", local_x(1.0), local_x(3.4), BOTTOM_Z + 85.0, BOTTOM_Z + 205.0),
        ("W1B", local_x(3.8), local_x(6.2), BOTTOM_Z + 85.0, BOTTOM_Z + 205.0),
        ("W3", local_x(7.05), local_x(7.75), BOTTOM_Z + 110.0, BOTTOM_Z + 230.0),
        ("W4", local_x(9.1), local_x(9.7), BOTTOM_Z + 145.0, BOTTOM_Z + 205.0),
    ]
    for code, x1, x2, sill, head in north_windows:
        frame_x(f"LT52A_GEN_Frame_{code}", x1, x2, north_y, sill, head)
        spawn_block(
            f"LT52A_GEN_Glass_{code}",
            unreal.Vector((x1 + x2) / 2.0, north_y + 1.5, (sill + head) / 2.0),
            unreal.Vector(max(20.0, (x2 - x1) - 20.0), 2.0, max(20.0, (head - sill) - 20.0)),
            glass_mat,
        )
        if code in {"W1A", "W1B"}:
            wall_x(f"LT52A_GEN_{code}_SillShelf", x1 - 8.0, x2 + 8.0, north_y - 8.0, sill - 7.0, 18.0, 8.0, frame_mat)

    # West entry door
    frame_y("LT52A_GEN_Frame_D1", west_x, local_y(1.65), local_y(0.65), BOTTOM_Z, BOTTOM_Z + 210.0)
    door_panel_mat = ensure_material_instance("M_Door_Warm", unreal.LinearColor(0.42, 0.30, 0.18, 1.0))
    metal_mat = ensure_material_instance("M_Metal_Dark", unreal.LinearColor(0.14, 0.15, 0.16, 1.0))
    door_center_y = (local_y(1.65) + local_y(0.65)) / 2.0
    door_height = 198.0
    door_width = abs(local_y(0.65) - local_y(1.65)) - 16.0
    spawn_block(
        "LT52A_GEN_Door_D1",
        unreal.Vector(west_x + 1.8, door_center_y, BOTTOM_Z + 105.0),
        unreal.Vector(2.2, door_width, door_height),
        door_panel_mat,
    )
    spawn_block(
        "LT52A_GEN_DoorInset_D1",
        unreal.Vector(west_x + 2.8, door_center_y - 4.0, BOTTOM_Z + 112.0),
        unreal.Vector(0.9, door_width - 22.0, door_height - 26.0),
        frame_mat,
    )
    spawn_block(
        "LT52A_GEN_DoorLite_D1",
        unreal.Vector(west_x + 3.4, local_y(1.12), BOTTOM_Z + 152.0),
        unreal.Vector(2.0, 22.0, 88.0),
        glass_mat,
    )
    wall_y(
        "LT52A_GEN_DoorPanel_Groove_A",
        west_x + 7.5,
        door_center_y - 24.0,
        door_center_y - 18.0,
        BOTTOM_Z + 105.0,
        1.5,
        150.0,
        metal_mat,
    )
    wall_y(
        "LT52A_GEN_DoorPanel_Groove_B",
        west_x + 7.5,
        door_center_y + 18.0,
        door_center_y + 24.0,
        BOTTOM_Z + 105.0,
        1.5,
        150.0,
        metal_mat,
    )
    wall_y(
        "LT52A_GEN_DoorHandle_D1",
        west_x + 4.8,
        local_y(1.10),
        local_y(1.04),
        BOTTOM_Z + 110.0,
        3.0,
        26.0,
        metal_mat,
    )
    wall_y(
        "LT52A_GEN_DoorPull_D1",
        west_x + 5.8,
        local_y(1.16),
        local_y(0.98),
        BOTTOM_Z + 118.0,
        2.0,
        54.0,
        metal_mat,
    )


def build_terrace_structure(wood_mat, trim_mat):
    deck_origin_y = MAX_Y + 260.0
    deck_z = BOTTOM_Z - 8.0
    joist_z = BOTTOM_Z - 24.0
    beam_z = BOTTOM_Z - 42.0
    post_z = BOTTOM_Z - 72.0

    wall_x("LT52A_GEN_Terrace_Beam_Front", MIN_X + 40.0, MAX_X - 40.0, deck_origin_y + 52.0, beam_z, 18.0, 18.0, trim_mat)
    wall_x("LT52A_GEN_Terrace_Beam_Back", MIN_X + 50.0, MAX_X - 50.0, deck_origin_y - 52.0, beam_z, 18.0, 18.0, trim_mat)

    x = MIN_X + 70.0
    idx = 0
    while x < MAX_X - 70.0:
        wall_y(f"LT52A_GEN_Terrace_Joist_{idx:02d}", x, deck_origin_y - 60.0, deck_origin_y + 60.0, joist_z, 12.0, 14.0, trim_mat)
        wall_y(f"LT52A_GEN_Terrace_Post_{idx:02d}", x, deck_origin_y + 52.0, deck_origin_y + 64.0, post_z, 14.0, 70.0, wood_mat)
        idx += 1
        x += 120.0

    wall_x("LT52A_GEN_Terrace_Edge_Front", MIN_X + 36.0, MAX_X - 36.0, deck_origin_y + 68.0, deck_z + 10.0, 10.0, 22.0, wood_mat)
    wall_x("LT52A_GEN_Terrace_Edge_Back", MIN_X + 48.0, MAX_X - 48.0, deck_origin_y - 68.0, deck_z + 8.0, 10.0, 18.0, trim_mat)
    wall_x("LT52A_GEN_Terrace_Skirt", MIN_X + 36.0, MAX_X - 36.0, deck_origin_y + 74.0, BOTTOM_Z - 20.0, 4.0, 30.0, trim_mat)

    step_center_y = deck_origin_y + 118.0
    wall_x("LT52A_GEN_Terrace_Step_01", MAX_X - 210.0, MAX_X - 40.0, step_center_y, BOTTOM_Z - 28.0, 56.0, 10.0, wood_mat)
    wall_x("LT52A_GEN_Terrace_Step_02", MAX_X - 194.0, MAX_X - 56.0, step_center_y + 24.0, BOTTOM_Z - 40.0, 42.0, 10.0, trim_mat)
    wall_y("LT52A_GEN_Terrace_Step_Stringer_A", MAX_X - 196.0, step_center_y - 16.0, step_center_y + 38.0, BOTTOM_Z - 40.0, 8.0, 26.0, trim_mat)
    wall_y("LT52A_GEN_Terrace_Step_Stringer_B", MAX_X - 52.0, step_center_y - 16.0, step_center_y + 38.0, BOTTOM_Z - 40.0, 8.0, 26.0, trim_mat)

    rail_post_x = MAX_X - 18.0
    wall_y("LT52A_GEN_Terrace_Rail_Post_A", rail_post_x, deck_origin_y + 40.0, deck_origin_y + 52.0, BOTTOM_Z + 44.0, 10.0, 88.0, trim_mat)
    wall_y("LT52A_GEN_Terrace_Rail_Post_B", rail_post_x, deck_origin_y + 108.0, deck_origin_y + 120.0, BOTTOM_Z + 44.0, 10.0, 88.0, trim_mat)
    wall_x("LT52A_GEN_Terrace_Rail_Top", MAX_X - 30.0, MAX_X + 6.0, deck_origin_y + 80.0, BOTTOM_Z + 86.0, 10.0, 8.0, trim_mat)
    wall_x("LT52A_GEN_Terrace_Rail_Mid", MAX_X - 28.0, MAX_X + 4.0, deck_origin_y + 80.0, BOTTOM_Z + 56.0, 6.0, 6.0, trim_mat)
    wall_y("LT52A_GEN_Terrace_Rail_Picket_A", MAX_X - 12.0, deck_origin_y + 58.0, deck_origin_y + 64.0, BOTTOM_Z + 52.0, 4.0, 54.0, wood_mat)
    wall_y("LT52A_GEN_Terrace_Rail_Picket_B", MAX_X - 12.0, deck_origin_y + 96.0, deck_origin_y + 102.0, BOTTOM_Z + 52.0, 4.0, 54.0, wood_mat)


def build_roof_edge_and_entry_trim(trim_mat):
    roof_front_y = MAX_Y + WALL_T + 10.0
    roof_rear_y = MIN_Y - WALL_T - 10.0
    roof_z = TOP_Z + 8.0
    wall_x("LT52A_GEN_RoofEdge_Front", MIN_X - 6.0, MAX_X + 6.0, roof_front_y, roof_z, 12.0, 18.0, trim_mat)
    wall_x("LT52A_GEN_RoofEdge_Rear", MIN_X - 6.0, MAX_X + 6.0, roof_rear_y, roof_z, 12.0, 18.0, trim_mat)
    wall_y("LT52A_GEN_RoofEdge_West", MIN_X - WALL_T - 10.0, MIN_Y - 4.0, MAX_Y + 4.0, roof_z, 12.0, 18.0, trim_mat)
    wall_y("LT52A_GEN_RoofEdge_East", MAX_X + WALL_T + 10.0, MIN_Y - 4.0, MAX_Y + 4.0, roof_z, 12.0, 18.0, trim_mat)
    wall_y("LT52A_GEN_EntryTrim", MIN_X - WALL_T - 12.0, local_y(1.72), local_y(0.58), BOTTOM_Z + 104.0, 18.0, 220.0, trim_mat)


def build_entry_portal(frame_mat, trim_mat, roof_mat):
    door_y1 = local_y(1.72)
    door_y2 = local_y(0.58)
    portal_x = MIN_X - WALL_T - 18.0
    portal_center_y = (door_y1 + door_y2) / 2.0

    wall_y("LT52A_GEN_EntryPortal_Left", portal_x, door_y1 - 12.0, door_y1 - 4.0, BOTTOM_Z + 112.0, 10.0, 220.0, trim_mat)
    wall_y("LT52A_GEN_EntryPortal_Right", portal_x, door_y2 + 4.0, door_y2 + 12.0, BOTTOM_Z + 112.0, 10.0, 220.0, trim_mat)
    wall_y("LT52A_GEN_EntryPortal_Head", portal_x, door_y2 - 8.0, door_y1 + 8.0, BOTTOM_Z + 218.0, 10.0, 8.0, trim_mat)
    wall_y("LT52A_GEN_EntryThreshold", MIN_X - 10.0, door_y2 + 8.0, door_y1 - 8.0, BOTTOM_Z - 6.0, 8.0, 4.0, trim_mat)


def main():
    unreal.EditorLevelLibrary.load_level(LEVEL_PATH)
    destroy_previous()
    wall_mat = ensure_material_instance("M_Wood_Exterior", unreal.LinearColor(0.67, 0.60, 0.49, 1.0))
    board_mat = ensure_material_instance("M_Wood_Cladding", unreal.LinearColor(0.31, 0.22, 0.14, 1.0))
    trim_mat = ensure_material_instance("M_Trim_Wood", unreal.LinearColor(0.20, 0.14, 0.09, 1.0))
    glass_mat = ensure_material_instance("M_Glass", unreal.LinearColor(0.58, 0.77, 0.88, 1.0))
    roof_mat = ensure_material_instance("M_Roof_Dark", unreal.LinearColor(0.23, 0.25, 0.28, 1.0))
    platform_mat = ensure_material_instance("M_Showroom_Platform", unreal.LinearColor(0.18, 0.19, 0.20, 1.0))
    floor_base_mat = ensure_material_instance("M_Floor_Base_Dark", unreal.LinearColor(0.22, 0.21, 0.19, 1.0))
    set_material_on_labeled_actors(["showroom_platform"], platform_mat)
    set_material_on_labeled_actors(["floor_base"], floor_base_mat)
    set_material_on_labeled_actors(["roof_base", "roof_left", "roof_right", "roof_skylightstrip"], roof_mat)
    build_shell(wall_mat)
    build_cladding(board_mat, trim_mat)
    build_opening_frames(trim_mat, glass_mat)
    build_terrace_structure(board_mat, trim_mat)
    build_roof_edge_and_entry_trim(trim_mat)
    build_entry_portal(wall_mat, trim_mat, roof_mat)
    unreal.EditorLevelLibrary.save_current_level()
    unreal.EditorLevelLibrary.editor_invalidate_viewports()
    unreal.log("[LT52A-GENERATED-EXTERIOR] shell and cladding rebuilt")


if __name__ == "__main__":
    main()
