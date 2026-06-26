from __future__ import annotations

import math
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

PRIMARY_POST_W = 9.5
PRIMARY_POST_D = 14.5
PRIMARY_HEAD_H = 14.5
STUD_W = 4.5
STUD_D = 4.5
STUD_SPACING = 60.0
BATTEN_D = 4.0
CLADDING_D = 2.2
CLADDING_BOARD_W = 12.2
CLADDING_GAP = 0.0


def ensure_flat_material(
    name: str,
    color: unreal.LinearColor,
    *,
    roughness: float = 0.72,
    metallic: float = 0.0,
    specular: float = 0.18,
    emissive: float = 0.0,
):
    unreal.EditorAssetLibrary.make_directory(MAT_DEST)
    asset_path = f"{MAT_DEST}/{name}"
    material = unreal.EditorAssetLibrary.load_asset(asset_path) if unreal.EditorAssetLibrary.does_asset_exist(asset_path) else None
    if not material:
        factory = unreal.MaterialFactoryNew()
        material = unreal.AssetToolsHelpers.get_asset_tools().create_asset(
            name,
            MAT_DEST,
            unreal.Material,
            factory,
        )
    if material:
        try:
            unreal.MaterialEditingLibrary.delete_all_material_expressions(material)
        except Exception:
            pass
        try:
            material.set_editor_property("two_sided", False)
            material.set_editor_property("blend_mode", unreal.BlendMode.BLEND_OPAQUE)
        except Exception:
            pass

        base_expr = unreal.MaterialEditingLibrary.create_material_expression(material, unreal.MaterialExpressionConstant3Vector, -420, -120)
        base_expr.set_editor_property("constant", color)
        unreal.MaterialEditingLibrary.connect_material_property(base_expr, "", unreal.MaterialProperty.MP_BASE_COLOR)

        roughness_expr = unreal.MaterialEditingLibrary.create_material_expression(material, unreal.MaterialExpressionConstant, -420, 10)
        roughness_expr.set_editor_property("r", roughness)
        unreal.MaterialEditingLibrary.connect_material_property(roughness_expr, "", unreal.MaterialProperty.MP_ROUGHNESS)

        metallic_expr = unreal.MaterialEditingLibrary.create_material_expression(material, unreal.MaterialExpressionConstant, -420, 90)
        metallic_expr.set_editor_property("r", metallic)
        unreal.MaterialEditingLibrary.connect_material_property(metallic_expr, "", unreal.MaterialProperty.MP_METALLIC)

        specular_expr = unreal.MaterialEditingLibrary.create_material_expression(material, unreal.MaterialExpressionConstant, -420, 170)
        specular_expr.set_editor_property("r", specular)
        unreal.MaterialEditingLibrary.connect_material_property(specular_expr, "", unreal.MaterialProperty.MP_SPECULAR)

        if emissive > 0.0:
            emissive_expr = unreal.MaterialEditingLibrary.create_material_expression(material, unreal.MaterialExpressionConstant3Vector, -420, 250)
            emissive_color = unreal.LinearColor(color.r * emissive, color.g * emissive, color.b * emissive, 1.0)
            emissive_expr.set_editor_property("constant", emissive_color)
            unreal.MaterialEditingLibrary.connect_material_property(emissive_expr, "", unreal.MaterialProperty.MP_EMISSIVE_COLOR)

        unreal.MaterialEditingLibrary.recompile_material(material)
        unreal.EditorAssetLibrary.save_loaded_asset(material)
    return material


def load_cube():
    return unreal.EditorAssetLibrary.load_asset("/Engine/BasicShapes/Cube.Cube")


def local_x(meters: float) -> float:
    return MIN_X + meters * 100.0


def local_y(meters: float) -> float:
    return MAX_Y - meters * 100.0


SOUTH_OPENINGS = [
    ("SD1", local_x(2.7), local_x(5.7), 0.0, 220.0),
    ("W2", local_x(6.9), local_x(9.3), 85.0, 205.0),
]
NORTH_OPENINGS = [
    ("W1", local_x(2.25), local_x(4.65), 85.0, 205.0),
    ("W3", local_x(7.05), local_x(7.75), 110.0, 230.0),
]


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
                "lt52a_sm_lt52a_terrace",
                "sm_lt52a_terrace",
                "lt52a_sm_lt52a_roof",
                "sm_lt52a_roof",
                "low_slope_roof",
                "roof_cassette",
                "roof_base",
                "roof_left",
                "roof_right",
                "roof_skylightstrip",
            ]
        ):
            unreal.EditorLevelLibrary.destroy_actor(actor)


def spawn_block(label: str, location: unreal.Vector, size: unreal.Vector, material, rotation: unreal.Rotator | None = None):
    actor = unreal.EditorLevelLibrary.spawn_actor_from_class(
        unreal.StaticMeshActor,
        location,
        rotation or unreal.Rotator(0, 0, 0),
    )
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


def distribute_centers(start_edge: float, end_edge: float, element_w: float, gap: float):
    usable = end_edge - start_edge
    if usable <= element_w:
        return [start_edge + usable / 2.0]
    count = max(1, int((usable + gap) // (element_w + gap)))
    while count > 1:
        total_used = count * element_w + (count - 1) * gap
        if total_used <= usable + 0.01:
            break
        count -= 1
    total_used = count * element_w + (count - 1) * gap
    edge_offset = max(0.0, (usable - total_used) / 2.0)
    return [
        start_edge + edge_offset + (element_w / 2.0) + idx * (element_w + gap)
        for idx in range(count)
    ]


def build_plinth():
    plinth_mat = ensure_flat_material("MAT_LT52A_Plith_Dark", unreal.LinearColor(0.16, 0.16, 0.15, 1.0), roughness=0.92, specular=0.08)
    spawn_block(
        "LT52A_GEN_Plinth_Base",
        unreal.Vector((MIN_X + MAX_X) / 2.0, (MIN_Y + MAX_Y) / 2.0, BOTTOM_Z - 12.0),
        unreal.Vector((MAX_X - MIN_X) + 20.0, (MAX_Y - MIN_Y) + 20.0, 24.0),
        plinth_mat,
    )


def build_primary_wall_faces(wall_mat):
    south_y = MAX_Y + WALL_T / 2.0
    north_y = MIN_Y - WALL_T / 2.0
    west_x = MIN_X - WALL_T / 2.0
    east_x = MAX_X + WALL_T / 2.0

    x_cursor = MIN_X
    idx = 1
    for code, x1, x2, sill, head in SOUTH_OPENINGS:
        if x1 > x_cursor:
            wall_x(f"LT52A_GEN_WallFace_South_{idx:02d}", x_cursor, x1, south_y, CENTER_Z, WALL_T, WALL_H, wall_mat)
            idx += 1
        if sill > 0:
            wall_x(f"LT52A_GEN_WallFace_South_{code}_Sill", x1, x2, south_y, BOTTOM_Z + sill / 2.0, WALL_T, sill, wall_mat)
        if head < WALL_H:
            wall_x(f"LT52A_GEN_WallFace_South_{code}_Head", x1, x2, south_y, head + (WALL_H - head) / 2.0 + BOTTOM_Z, WALL_T, WALL_H - head, wall_mat)
        x_cursor = x2
    if x_cursor < MAX_X:
        wall_x(f"LT52A_GEN_WallFace_South_{idx:02d}", x_cursor, MAX_X, south_y, CENTER_Z, WALL_T, WALL_H, wall_mat)

    x_cursor = MIN_X
    idx = 1
    for code, x1, x2, sill, head in NORTH_OPENINGS:
        if x1 > x_cursor:
            wall_x(f"LT52A_GEN_WallFace_North_{idx:02d}", x_cursor, x1, north_y, CENTER_Z, WALL_T, WALL_H, wall_mat)
            idx += 1
        wall_x(f"LT52A_GEN_WallFace_North_{code}_Sill", x1, x2, north_y, BOTTOM_Z + sill / 2.0, WALL_T, sill, wall_mat)
        if head < WALL_H:
            wall_x(f"LT52A_GEN_WallFace_North_{code}_Head", x1, x2, north_y, head + (WALL_H - head) / 2.0 + BOTTOM_Z, WALL_T, WALL_H - head, wall_mat)
        x_cursor = x2
    if x_cursor < MAX_X:
        wall_x(f"LT52A_GEN_WallFace_North_{idx:02d}", x_cursor, MAX_X, north_y, CENTER_Z, WALL_T, WALL_H, wall_mat)

    wall_y("LT52A_GEN_WallFace_West", west_x, MIN_Y, MAX_Y, CENTER_Z, WALL_T, WALL_H, wall_mat)
    wall_y("LT52A_GEN_WallFace_East", east_x, MIN_Y, MAX_Y, CENTER_Z, WALL_T, WALL_H, wall_mat)


def build_primary_posts_and_headers(trim_mat):
    south_face_y = MAX_Y + (PRIMARY_POST_D / 2.0)
    north_face_y = MIN_Y - (PRIMARY_POST_D / 2.0)
    west_face_x = MIN_X - (PRIMARY_POST_D / 2.0)
    east_face_x = MAX_X + (PRIMARY_POST_D / 2.0)

    post_z = BOTTOM_Z + WALL_H / 2.0
    corner_positions = [
        ("NW", unreal.Vector(MIN_X + PRIMARY_POST_W / 2.0, north_face_y, post_z)),
        ("NE", unreal.Vector(MAX_X - PRIMARY_POST_W / 2.0, north_face_y, post_z)),
        ("SW", unreal.Vector(MIN_X + PRIMARY_POST_W / 2.0, south_face_y, post_z)),
        ("SE", unreal.Vector(MAX_X - PRIMARY_POST_W / 2.0, south_face_y, post_z)),
    ]
    for suffix, loc in corner_positions:
        spawn_block(
            f"LT52A_GEN_CornerPost_{suffix}",
            loc,
            unreal.Vector(PRIMARY_POST_W, PRIMARY_POST_D, WALL_H),
            trim_mat,
        )

    def opening_posts_x(face_prefix: str, y_center: float, openings: list[tuple[str, float, float, float, float]]):
        for code, x1, x2, _sill, head in openings:
            head_z = BOTTOM_Z + head
            opening_h = head_z - BOTTOM_Z
            spawn_block(
                f"LT52A_GEN_{face_prefix}_{code}_PostLeft",
                unreal.Vector(x1 + PRIMARY_POST_W / 2.0, y_center, BOTTOM_Z + opening_h / 2.0),
                unreal.Vector(PRIMARY_POST_W, PRIMARY_POST_D, opening_h),
                trim_mat,
            )
            spawn_block(
                f"LT52A_GEN_{face_prefix}_{code}_PostRight",
                unreal.Vector(x2 - PRIMARY_POST_W / 2.0, y_center, BOTTOM_Z + opening_h / 2.0),
                unreal.Vector(PRIMARY_POST_W, PRIMARY_POST_D, opening_h),
                trim_mat,
            )
            if head_z < TOP_Z:
                wall_x(
                    f"LT52A_GEN_{face_prefix}_{code}_Header",
                    x1,
                    x2,
                    y_center,
                    head_z + PRIMARY_HEAD_H / 2.0,
                    PRIMARY_POST_D,
                    PRIMARY_HEAD_H,
                    trim_mat,
                )

    opening_posts_x("South", south_face_y, SOUTH_OPENINGS)
    opening_posts_x("North", north_face_y, NORTH_OPENINGS)

    wall_y("LT52A_GEN_PrimaryPost_West", west_face_x, MIN_Y, MAX_Y, post_z, PRIMARY_POST_D, WALL_H, trim_mat)
    wall_y("LT52A_GEN_PrimaryPost_East", east_face_x, MIN_Y, MAX_Y, post_z, PRIMARY_POST_D, WALL_H, trim_mat)


def build_shell(wall_mat, trim_mat):
    build_plinth()
    build_primary_wall_faces(wall_mat)
    build_primary_posts_and_headers(trim_mat)


def build_stud_grid_and_infill(stud_mat, insulation_mat):
    south_y = MAX_Y + (STUD_D / 2.0)
    north_y = MIN_Y - (STUD_D / 2.0)
    west_x = MIN_X - (STUD_D / 2.0)
    east_x = MAX_X + (STUD_D / 2.0)
    stud_z = BOTTOM_Z + WALL_H / 2.0
    infill_z = stud_z
    clear_from_corner = PRIMARY_POST_W + 4.0

    south_openings = [(x1, x2, BOTTOM_Z + sill, BOTTOM_Z + head) for _code, x1, x2, sill, head in SOUTH_OPENINGS]
    north_openings = [(x1, x2, BOTTOM_Z + sill, BOTTOM_Z + head) for _code, x1, x2, sill, head in NORTH_OPENINGS]

    def studs_for_face_x(prefix: str, y_center: float, blocked_openings):
        blocked_x = [(x1 - PRIMARY_POST_W, x2 + PRIMARY_POST_W) for x1, x2, _z1, _z2 in blocked_openings]
        intervals = subtract_intervals(MIN_X + clear_from_corner, MAX_X - clear_from_corner, blocked_x)
        stud_idx = 0
        for seg_idx, (seg_x1, seg_x2) in enumerate(intervals, start=1):
            if (seg_x2 - seg_x1) < 20.0:
                continue
            centers = distribute_centers(seg_x1, seg_x2, STUD_W, STUD_SPACING - STUD_W)
            prev_edge = seg_x1
            for center in centers:
                wall_x(
                    f"{prefix}_Stud_{stud_idx:03d}",
                    center - (STUD_W / 2.0),
                    center + (STUD_W / 2.0),
                    y_center,
                    stud_z,
                    STUD_D,
                    WALL_H,
                    stud_mat,
                )
                left_edge = center - (STUD_W / 2.0)
                if left_edge - prev_edge > 6.0:
                    wall_x(
                        f"{prefix}_Infill_{seg_idx:02d}_{stud_idx:03d}",
                        prev_edge,
                        left_edge,
                        y_center - (0.2 if y_center > 0 else -0.2),
                        infill_z,
                        1.6,
                        WALL_H - 8.0,
                        insulation_mat,
                    )
                prev_edge = center + (STUD_W / 2.0)
                stud_idx += 1
            if seg_x2 - prev_edge > 6.0:
                wall_x(
                    f"{prefix}_Infill_{seg_idx:02d}_End",
                    prev_edge,
                    seg_x2,
                    y_center - (0.2 if y_center > 0 else -0.2),
                    infill_z,
                    1.6,
                    WALL_H - 8.0,
                    insulation_mat,
                )

    def studs_for_face_y(prefix: str, x_center: float):
        centers = distribute_centers(MIN_Y + clear_from_corner, MAX_Y - clear_from_corner, STUD_W, STUD_SPACING - STUD_W)
        prev_edge = MIN_Y + clear_from_corner
        for idx, center in enumerate(centers):
            wall_y(
                f"{prefix}_Stud_{idx:03d}",
                x_center,
                center - (STUD_W / 2.0),
                center + (STUD_W / 2.0),
                stud_z,
                STUD_D,
                WALL_H,
                stud_mat,
            )
            low_edge = center - (STUD_W / 2.0)
            if low_edge - prev_edge > 6.0:
                wall_y(
                    f"{prefix}_Infill_{idx:03d}",
                    x_center - (0.2 if x_center > 0 else -0.2),
                    prev_edge,
                    low_edge,
                    infill_z,
                    1.6,
                    WALL_H - 8.0,
                    insulation_mat,
                )
            prev_edge = center + (STUD_W / 2.0)
        if (MAX_Y - clear_from_corner) - prev_edge > 6.0:
            wall_y(
                f"{prefix}_Infill_End",
                x_center - (0.2 if x_center > 0 else -0.2),
                prev_edge,
                MAX_Y - clear_from_corner,
                infill_z,
                1.6,
                WALL_H - 8.0,
                insulation_mat,
            )

    studs_for_face_x("LT52A_GEN_South", south_y, south_openings)
    studs_for_face_x("LT52A_GEN_North", north_y, north_openings)
    studs_for_face_y("LT52A_GEN_West", west_x)
    studs_for_face_y("LT52A_GEN_East", east_x)


def build_battens(trim_mat):
    outer_south_y = MAX_Y + WALL_T + (BATTEN_D / 2.0)
    outer_north_y = MIN_Y - WALL_T - (BATTEN_D / 2.0)
    outer_west_x = MIN_X - WALL_T - (BATTEN_D / 2.0)
    outer_east_x = MAX_X + WALL_T + (BATTEN_D / 2.0)
    batten_h = 4.0
    vertical_spacing = 60.0

    south_openings = [(x1, x2, BOTTOM_Z + sill, BOTTOM_Z + head) for _code, x1, x2, sill, head in SOUTH_OPENINGS]
    north_openings = [(x1, x2, BOTTOM_Z + sill, BOTTOM_Z + head) for _code, x1, x2, sill, head in NORTH_OPENINGS]

    def build_horizontal_face_x(prefix: str, x_start: float, x_end: float, y_center: float, blocked_openings):
        z = BOTTOM_Z + 24.0
        idx = 0
        while z < TOP_Z - 20.0:
            blocked = []
            for x1, x2, z1, z2 in blocked_openings:
                if z > (z1 - 6.0) and z < (z2 + 6.0):
                    blocked.append((x1 - 4.0, x2 + 4.0))
            for seg_idx, (seg_x1, seg_x2) in enumerate(subtract_intervals(x_start, x_end, blocked), start=1):
                wall_x(
                    f"{prefix}_{idx:02d}_{seg_idx:02d}",
                    seg_x1,
                    seg_x2,
                    y_center,
                    z,
                    BATTEN_D,
                    batten_h,
                    trim_mat,
                )
            z += vertical_spacing
            idx += 1

    def build_horizontal_face_y(prefix: str, x_center: float, y_start: float, y_end: float):
        z = BOTTOM_Z + 24.0
        idx = 0
        while z < TOP_Z - 20.0:
            wall_y(
                f"{prefix}_{idx:02d}",
                x_center,
                y_start,
                y_end,
                z,
                BATTEN_D,
                batten_h,
                trim_mat,
            )
            z += vertical_spacing
            idx += 1

    build_horizontal_face_x("LT52A_GEN_Batten_N", MIN_X + PRIMARY_POST_W, MAX_X - PRIMARY_POST_W, outer_north_y, north_openings)
    build_horizontal_face_x("LT52A_GEN_Batten_S", MIN_X + PRIMARY_POST_W, MAX_X - PRIMARY_POST_W, outer_south_y, south_openings)
    build_horizontal_face_y("LT52A_GEN_Batten_W", outer_west_x, MIN_Y + PRIMARY_POST_W, MAX_Y - PRIMARY_POST_W)
    build_horizontal_face_y("LT52A_GEN_Batten_E", outer_east_x, MIN_Y + PRIMARY_POST_W, MAX_Y - PRIMARY_POST_W)


def build_cladding(board_mat, trim_mat):
    board_width = CLADDING_BOARD_W
    board_depth = CLADDING_D
    board_gap = CLADDING_GAP
    vertical_margin = 6.0
    corner_clear = PRIMARY_POST_W + 3.0
    opening_side_clear = PRIMARY_POST_W + 5.0
    opening_z_clear = 6.0

    north_openings = [(x1, x2, BOTTOM_Z + sill, BOTTOM_Z + head) for _code, x1, x2, sill, head in NORTH_OPENINGS]
    south_openings = [(x1, x2, BOTTOM_Z + sill, BOTTOM_Z + head) for _code, x1, x2, sill, head in SOUTH_OPENINGS]

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

    def build_face_x(prefix: str, x_start: float, x_end: float, y_center: float, openings: list[tuple[float, float, float, float]], offset_sign: float):
        idx = 0
        x = x_start + corner_clear + board_width / 2.0
        x_end_limit = x_end - corner_clear - board_width / 2.0
        while x < x_end_limit:
            blocked = []
            for x1, x2, z1, z2 in openings:
                if (x - board_width / 2.0) < (x2 + opening_side_clear) and (x + board_width / 2.0) > (x1 - opening_side_clear):
                    blocked.append((z1 - opening_z_clear, z2 + opening_z_clear))
            for seg_idx, (z1, z2) in enumerate(subtract_intervals(BOTTOM_Z + vertical_margin, TOP_Z - vertical_margin, blocked), start=1):
                add_vertical_board_x(prefix + f"_{seg_idx:02d}", x, y_center, z1, z2, idx, offset_sign * (BATTEN_D + (board_depth / 2.0)))
            x += board_width + board_gap
            idx += 1

    def build_face_y(prefix: str, x_center: float, y_start: float, y_end: float, offset_sign: float):
        idx = 0
        y = y_start + corner_clear + board_width / 2.0
        y_end_limit = y_end - corner_clear - board_width / 2.0
        while y < y_end_limit:
            add_vertical_board_y(prefix, x_center, y, BOTTOM_Z + vertical_margin, TOP_Z - vertical_margin, idx, offset_sign * (BATTEN_D + (board_depth / 2.0)))
            y += board_width + board_gap
            idx += 1

    build_face_x("LT52A_GEN_Cladding_N", MIN_X, MAX_X, MIN_Y - WALL_T - board_depth / 2.0, north_openings, -1.0)
    build_face_x("LT52A_GEN_Cladding_S", MIN_X, MAX_X, MAX_Y + WALL_T + board_depth / 2.0, south_openings, 1.0)
    build_face_y("LT52A_GEN_Cladding_W", MIN_X - WALL_T - board_depth / 2.0, MIN_Y, MAX_Y, -1.0)
    build_face_y("LT52A_GEN_Cladding_E", MAX_X + WALL_T + board_depth / 2.0, MIN_Y, MAX_Y, 1.0)

    trim_w = 3.2
    trim_d = 4.0
    trim_h = WALL_H + 2.0
    trim_z = BOTTOM_Z + trim_h / 2.0
    positions = [
        ("NW", unreal.Vector(MIN_X - WALL_T - PRIMARY_POST_W - trim_w / 2.0, MIN_Y - WALL_T - trim_d / 2.0, trim_z)),
        ("NE", unreal.Vector(MAX_X + WALL_T + PRIMARY_POST_W + trim_w / 2.0, MIN_Y - WALL_T - trim_d / 2.0, trim_z)),
        ("SW", unreal.Vector(MIN_X - WALL_T - PRIMARY_POST_W - trim_w / 2.0, MAX_Y + WALL_T + trim_d / 2.0, trim_z)),
        ("SE", unreal.Vector(MAX_X + WALL_T + PRIMARY_POST_W + trim_w / 2.0, MAX_Y + WALL_T + trim_d / 2.0, trim_z)),
    ]
    for suffix, loc in positions:
        spawn_block(f"LT52A_GEN_CornerTrim_{suffix}", loc, unreal.Vector(trim_w, trim_d, trim_h), trim_mat)


def build_opening_frames(frame_mat, glass_mat):
    frame_depth = 6.0
    frame_width = 10.0
    reveal_depth = 8.0
    reveal_width = 8.0
    cap_depth = 3.0
    cap_width = 5.0
    south_outer_face_y = MAX_Y + WALL_T + BATTEN_D + CLADDING_D
    north_outer_face_y = MIN_Y - WALL_T - BATTEN_D - CLADDING_D
    south_y = south_outer_face_y - (frame_depth / 2.0)
    north_y = north_outer_face_y + (frame_depth / 2.0)
    glass_door_mat = ensure_flat_material("MAT_LT52A_Glass_Door", unreal.LinearColor(0.34, 0.42, 0.46, 1.0), roughness=0.14, specular=0.74)
    metal_mat = ensure_flat_material("MAT_LT52A_Metal_Dark", unreal.LinearColor(0.14, 0.15, 0.16, 1.0), roughness=0.34, metallic=0.55, specular=0.45)
    door_panel_mat = ensure_flat_material("MAT_LT52A_Door_Warm", unreal.LinearColor(0.42, 0.30, 0.18, 1.0), roughness=0.62, specular=0.28)

    south_opening_map = {code: (x1, x2, BOTTOM_Z + sill, BOTTOM_Z + head) for code, x1, x2, sill, head in SOUTH_OPENINGS}
    north_opening_map = {code: (x1, x2, BOTTOM_Z + sill, BOTTOM_Z + head) for code, x1, x2, sill, head in NORTH_OPENINGS}

    def frame_x(prefix: str, x1: float, x2: float, y_center: float, sill_z: float, head_z: float):
        wall_x(f"{prefix}_Head", x1, x2, y_center, head_z - frame_width / 2.0, frame_depth, frame_width, frame_mat)
        wall_x(f"{prefix}_Sill", x1, x2, y_center, sill_z + frame_width / 2.0, frame_depth, frame_width, frame_mat)
        wall_x(f"{prefix}_Left", x1 + frame_width / 2.0, x1 + frame_width, y_center, (sill_z + head_z) / 2.0, frame_depth, head_z - sill_z, frame_mat)
        wall_x(f"{prefix}_Right", x2 - frame_width, x2 - frame_width / 2.0, y_center, (sill_z + head_z) / 2.0, frame_depth, head_z - sill_z, frame_mat)
        inner_y = y_center - (frame_depth / 2.0) if y_center > 0 else y_center + (frame_depth / 2.0)
        wall_x(f"{prefix}_RevealTop", x1 + reveal_width, x2 - reveal_width, inner_y, head_z - reveal_width / 2.0, reveal_depth, reveal_width, frame_mat)
        if sill_z > BOTTOM_Z + 2.0:
            wall_x(f"{prefix}_RevealSill", x1 + reveal_width, x2 - reveal_width, inner_y, sill_z + reveal_width / 2.0, reveal_depth, reveal_width, frame_mat)
        outer_y = y_center + ((frame_depth - cap_depth) / 2.0) if y_center > 0 else y_center - ((frame_depth - cap_depth) / 2.0)
        wall_x(f"{prefix}_CapTop", x1 - 6.0, x2 + 6.0, outer_y, head_z + cap_width / 2.0, cap_depth, cap_width, frame_mat)
        if sill_z > BOTTOM_Z + 2.0:
            wall_x(f"{prefix}_CapSill", x1 - 6.0, x2 + 6.0, outer_y, sill_z - cap_width / 2.0, cap_depth, cap_width, frame_mat)
        wall_x(f"{prefix}_OuterLeft", x1 - cap_width / 2.0, x1 + cap_width / 2.0, outer_y, (sill_z + head_z) / 2.0, cap_depth, head_z - sill_z + cap_width, frame_mat)
        wall_x(f"{prefix}_OuterRight", x2 - cap_width / 2.0, x2 + cap_width / 2.0, outer_y, (sill_z + head_z) / 2.0, cap_depth, head_z - sill_z + cap_width, frame_mat)

    def simple_glass_x(prefix: str, x1: float, x2: float, y_center: float, sill_z: float, head_z: float):
        frame_x(prefix, x1, x2, y_center, sill_z, head_z)
        spawn_block(
            f"{prefix}_Glass",
            unreal.Vector((x1 + x2) / 2.0, y_center + (1.5 if y_center < 0 else -1.5), (sill_z + head_z) / 2.0),
            unreal.Vector(max(20.0, (x2 - x1) - 20.0), 2.0, max(20.0, (head_z - sill_z) - 20.0)),
            glass_mat,
        )

    # South facade
    sd1_x1, sd1_x2, sd1_sill, sd1_head = south_opening_map["SD1"]
    frame_x("LT52A_GEN_Frame_SD1", sd1_x1, sd1_x2, south_y, sd1_sill, sd1_head)
    left_leaf_x1 = sd1_x1 + 16.0
    left_leaf_x2 = ((sd1_x1 + sd1_x2) / 2.0) - 3.0
    right_leaf_x1 = ((sd1_x1 + sd1_x2) / 2.0) + 3.0
    right_leaf_x2 = sd1_x2 - 16.0
    leaf_head = sd1_head - 14.0
    leaf_sill = sd1_sill + 14.0
    wall_x("LT52A_GEN_SD1_HeadTrack", sd1_x1 + 12.0, sd1_x2 - 12.0, south_y - 3.2, sd1_head - 6.0, 5.0, 12.0, metal_mat)
    wall_x("LT52A_GEN_SD1_SillTrack", sd1_x1 + 12.0, sd1_x2 - 12.0, south_y - 3.0, sd1_sill + 5.0, 4.0, 10.0, metal_mat)
    wall_x(
        "LT52A_GEN_SD1_MeetingStile",
        ((sd1_x1 + sd1_x2) / 2.0) - 4.0,
        ((sd1_x1 + sd1_x2) / 2.0) + 4.0,
        south_y - 2.0,
        (sd1_head + sd1_sill) / 2.0,
        3.6,
        leaf_head - leaf_sill,
        frame_mat,
    )
    wall_x(
        "LT52A_GEN_SD1_HeadRail",
        sd1_x1 + 16.0,
        sd1_x2 - 16.0,
        south_y - 2.0,
        leaf_head,
        3.0,
        8.0,
        frame_mat,
    )
    wall_x(
        "LT52A_GEN_SD1_BottomRail",
        sd1_x1 + 16.0,
        sd1_x2 - 16.0,
        south_y - 2.0,
        leaf_sill,
        3.0,
        12.0,
        frame_mat,
    )
    for prefix, lx1, lx2 in [
        ("LT52A_GEN_SD1_LeftLeaf_Frame", left_leaf_x1, left_leaf_x2),
        ("LT52A_GEN_SD1_RightLeaf_Frame", right_leaf_x1, right_leaf_x2),
    ]:
        wall_x(f"{prefix}_Top", lx1, lx2, south_y - 2.0, leaf_head - 3.0, 2.6, 6.0, frame_mat)
        wall_x(f"{prefix}_Bottom", lx1, lx2, south_y - 2.0, leaf_sill + 3.0, 2.6, 6.0, frame_mat)
        wall_x(f"{prefix}_Left", lx1, lx1 + 5.0, south_y - 2.0, (leaf_head + leaf_sill) / 2.0, 2.6, leaf_head - leaf_sill, frame_mat)
        wall_x(f"{prefix}_Right", lx2 - 5.0, lx2, south_y - 2.0, (leaf_head + leaf_sill) / 2.0, 2.6, leaf_head - leaf_sill, frame_mat)
        wall_x(f"{prefix}_LowerPanel", lx1 + 7.0, lx2 - 7.0, south_y - 2.4, BOTTOM_Z + 60.0, 1.3, 84.0, door_panel_mat)
    wall_x(
        "LT52A_GEN_SD1_LeftLeaf",
        left_leaf_x1 + 5.0,
        left_leaf_x2 - 5.0,
        south_y - 2.6,
        BOTTOM_Z + 160.0,
        1.2,
        86.0,
        glass_door_mat,
    )
    wall_x(
        "LT52A_GEN_SD1_RightLeaf",
        right_leaf_x1 + 5.0,
        right_leaf_x2 - 5.0,
        south_y - 2.6,
        BOTTOM_Z + 160.0,
        1.2,
        86.0,
        glass_door_mat,
    )
    wall_x("LT52A_GEN_SD1_Handle_Left", right_leaf_x1 + 12.0, right_leaf_x1 + 16.0, south_y - 0.8, BOTTOM_Z + 118.0, 1.0, 72.0, metal_mat)
    wall_x("LT52A_GEN_SD1_Handle_Right", ((sd1_x1 + sd1_x2) / 2.0) - 16.0, ((sd1_x1 + sd1_x2) / 2.0) - 12.0, south_y - 0.8, BOTTOM_Z + 118.0, 1.0, 72.0, metal_mat)

    w2_x1, w2_x2, w2_sill, w2_head = south_opening_map["W2"]
    frame_x("LT52A_GEN_Frame_W2", w2_x1, w2_x2, south_y, w2_sill, w2_head)
    w2_mid = (w2_x1 + w2_x2) / 2.0
    w2_left_x1 = w2_x1 + 8.0
    w2_left_x2 = w2_mid - 2.5
    w2_right_x1 = w2_mid + 2.5
    w2_right_x2 = w2_x2 - 8.0
    wall_x(
        "LT52A_GEN_W2_Mullion",
        w2_mid - 2.5,
        w2_mid + 2.5,
        south_y - 2.0,
        (w2_sill + w2_head) / 2.0,
        3.0,
        (w2_head - w2_sill) - 24.0,
        frame_mat,
    )
    for prefix, lx1, lx2 in [
        ("LT52A_GEN_W2_LeftSash", w2_left_x1, w2_left_x2),
        ("LT52A_GEN_W2_RightSash", w2_right_x1, w2_right_x2),
    ]:
        wall_x(f"{prefix}_Top", lx1, lx2, south_y - 2.0, w2_head - 7.0, 2.0, 6.0, frame_mat)
        wall_x(f"{prefix}_Bottom", lx1, lx2, south_y - 2.0, w2_sill + 7.0, 2.0, 6.0, frame_mat)
        wall_x(f"{prefix}_Left", lx1, lx1 + 4.0, south_y - 2.0, (w2_sill + w2_head) / 2.0, 2.0, (w2_head - w2_sill) - 18.0, frame_mat)
        wall_x(f"{prefix}_Right", lx2 - 4.0, lx2, south_y - 2.0, (w2_sill + w2_head) / 2.0, 2.0, (w2_head - w2_sill) - 18.0, frame_mat)
        spawn_block(
            f"{prefix}_Glass",
            unreal.Vector((lx1 + lx2) / 2.0, south_y - 2.6, (w2_sill + w2_head) / 2.0),
            unreal.Vector(max(16.0, (lx2 - lx1) - 10.0), 1.1, max(22.0, (w2_head - w2_sill) - 24.0)),
            glass_door_mat,
        )

    # North facade
    for code in ["W1", "W3"]:
        x1, x2, sill, head = north_opening_map[code]
        simple_glass_x(f"LT52A_GEN_Frame_{code}", x1, x2, north_y, sill, head)

    # West side entry door removed in the current exterior presentation model.


def build_terrace_structure(wood_mat, trim_mat):
    deck_y1 = MAX_Y + WALL_T + 10.0
    deck_y2 = deck_y1 + 240.0
    deck_origin_y = (deck_y1 + deck_y2) / 2.0
    deck_z = BOTTOM_Z - 10.0
    deck_top_z = deck_z + 15.0
    joist_z = BOTTOM_Z - 26.0
    beam_z = BOTTOM_Z - 44.0
    post_z = BOTTOM_Z - 74.0
    deck_x1 = MIN_X + 40.0
    deck_x2 = MAX_X - 40.0
    deck_w = deck_x2 - deck_x1
    deck_d = deck_y2 - deck_y1

    board_w = 12.0
    board_gap = 1.0
    board_t = 3.0
    board_inset = 8.0

    wall_x("LT52A_GEN_Terrace_Beam_Front", deck_x1, deck_x2, deck_y2 - 8.0, beam_z, 18.0, 18.0, trim_mat)
    wall_x("LT52A_GEN_Terrace_Beam_Back", deck_x1 + 10.0, deck_x2 - 10.0, deck_y1 + 8.0, beam_z, 18.0, 18.0, trim_mat)
    spawn_block(
        "LT52A_GEN_Terrace_Deck_Base",
        unreal.Vector((deck_x1 + deck_x2) / 2.0, (deck_y1 + deck_y2) / 2.0, deck_z + 8.0),
        unreal.Vector((deck_x2 - deck_x1), (deck_y2 - deck_y1), 8.0),
        trim_mat,
    )

    joist_centers = distribute_centers(deck_x1 + 32.0, deck_x2 - 32.0, 10.0, 50.0)
    for idx, x in enumerate(joist_centers):
        wall_y(f"LT52A_GEN_Terrace_Joist_{idx:02d}", x, deck_y1 + 6.0, deck_y2 - 6.0, joist_z, 10.0, 16.0, trim_mat)
        wall_y(f"LT52A_GEN_Terrace_Post_Front_{idx:02d}", x, deck_y2 - 12.0, deck_y2 + 4.0, post_z, 14.0, 74.0, wood_mat)
        wall_y(f"LT52A_GEN_Terrace_Post_Back_{idx:02d}", x, deck_y1 - 4.0, deck_y1 + 12.0, post_z, 14.0, 70.0, wood_mat)

    wall_x("LT52A_GEN_Terrace_Edge_Front", deck_x1 - 4.0, deck_x2 + 4.0, deck_y2 + 6.0, deck_z + 10.0, 10.0, 22.0, wood_mat)
    wall_x("LT52A_GEN_Terrace_Edge_Back", deck_x1 + 8.0, deck_x2 - 8.0, deck_y1 - 6.0, deck_z + 8.0, 10.0, 18.0, trim_mat)
    wall_x("LT52A_GEN_Terrace_Skirt", deck_x1 - 4.0, deck_x2 + 4.0, deck_y2 + 12.0, BOTTOM_Z - 20.0, 4.0, 30.0, trim_mat)

    deck_board_centers = distribute_centers(deck_y1 + board_inset, deck_y2 - board_inset, board_w, board_gap)
    for board_idx, board_y in enumerate(deck_board_centers):
        wall_x(
            f"LT52A_GEN_Terrace_DeckBoard_{board_idx:03d}",
            deck_x1 + board_inset,
            deck_x2 - board_inset,
            board_y,
            deck_top_z,
            board_w,
            board_t,
            wood_mat,
        )

    stair_center_x = (local_x(2.7) + local_x(5.7)) / 2.0
    stair_width = 280.0
    step_x1 = stair_center_x - stair_width / 2.0
    step_x2 = stair_center_x + stair_width / 2.0
    tread = 32.0
    riser = 10.0
    step_y1 = deck_y2 + 14.0
    for step_idx in range(3):
        inset = step_idx * 10.0
        y_center = step_y1 + step_idx * tread
        z_center = deck_top_z - ((step_idx + 1) * riser)
        wall_x(
            f"LT52A_GEN_Terrace_Step_{step_idx + 1:02d}",
            step_x1 + inset,
            step_x2 - inset,
            y_center,
            z_center,
            tread,
            8.0,
            trim_mat,
        )
        step_board_centers = distribute_centers(
            y_center - (tread / 2.0) + 6.0,
            y_center + (tread / 2.0) - 6.0,
            8.0,
            1.0,
        )
        for board_idx, board_y in enumerate(step_board_centers):
            wall_x(
                f"LT52A_GEN_Terrace_StepBoard_{step_idx + 1:02d}_{board_idx:02d}",
                step_x1 + inset + 8.0,
                step_x2 - inset - 8.0,
                board_y,
                z_center + 5.5,
                8.0,
                board_t,
                wood_mat,
            )
        if step_idx < 2:
            wall_x(
                f"LT52A_GEN_Terrace_Stair_Riser_{step_idx + 1:02d}",
                step_x1 + inset + 4.0,
                step_x2 - inset - 4.0,
                y_center + (tread / 2.0) - 1.6,
                z_center - 5.5,
                2.4,
                11.0,
                trim_mat,
            )
    wall_y("LT52A_GEN_Terrace_Step_Stringer_A", step_x1 + 14.0, step_y1 - 12.0, step_y1 + (tread * 2.0) + 18.0, deck_top_z - 24.0, 10.0, 48.0, trim_mat)
    wall_y("LT52A_GEN_Terrace_Step_Stringer_B", step_x2 - 14.0, step_y1 - 12.0, step_y1 + (tread * 2.0) + 18.0, deck_top_z - 24.0, 10.0, 48.0, trim_mat)

    right_rail_x = deck_x2 + 10.0
    wall_y("LT52A_GEN_Terrace_Rail_Post_A", right_rail_x, deck_y1 + 10.0, deck_y1 + 22.0, BOTTOM_Z + 44.0, 10.0, 88.0, trim_mat)
    wall_y("LT52A_GEN_Terrace_Rail_Post_B", right_rail_x, deck_y2 - 22.0, deck_y2 - 10.0, BOTTOM_Z + 44.0, 10.0, 88.0, trim_mat)
    wall_x("LT52A_GEN_Terrace_Rail_Top", deck_x2 - 18.0, deck_x2 + 12.0, deck_origin_y, BOTTOM_Z + 86.0, (deck_y2 - deck_y1) + 8.0, 8.0, trim_mat)
    wall_x("LT52A_GEN_Terrace_Rail_Mid", deck_x2 - 16.0, deck_x2 + 10.0, deck_origin_y, BOTTOM_Z + 58.0, (deck_y2 - deck_y1) - 8.0, 6.0, trim_mat)
    wall_y("LT52A_GEN_Terrace_Rail_Picket_A", deck_x2 - 4.0, deck_origin_y - 22.0, deck_origin_y - 16.0, BOTTOM_Z + 52.0, 4.0, 54.0, wood_mat)
    wall_y("LT52A_GEN_Terrace_Rail_Picket_B", deck_x2 - 4.0, deck_origin_y + 16.0, deck_origin_y + 22.0, BOTTOM_Z + 52.0, 4.0, 54.0, wood_mat)


def build_roof_edge_and_entry_trim(trim_mat, roof_mat):
    roof_y1 = MIN_Y - 34.0
    roof_y2 = MAX_Y + 34.0
    roof_x1 = MIN_X - 34.0
    roof_x2 = MAX_X + 34.0
    roof_mid_y = (roof_y1 + roof_y2) / 2.0
    roof_half_depth = (roof_y2 - roof_y1) / 2.0
    roof_plane_t = 5.0
    roof_pitch = 24.0
    roof_pitch_rad = math.radians(roof_pitch)
    roof_low_z = TOP_Z + 14.0
    roof_rise = math.tan(roof_pitch_rad) * roof_half_depth
    ridge_z = roof_low_z + roof_rise
    slope_length = roof_half_depth / math.cos(roof_pitch_rad)
    roof_plane_center_z = roof_low_z + (roof_rise / 2.0)
    roof_north_center_y = roof_mid_y - (roof_half_depth / 2.0)
    roof_south_center_y = roof_mid_y + (roof_half_depth / 2.0)
    board_spacing = 18.0

    spawn_block(
        "LT52A_GEN_Roof_Plane_North",
        unreal.Vector((roof_x1 + roof_x2) / 2.0, roof_north_center_y, roof_plane_center_z),
        unreal.Vector((roof_x2 - roof_x1), slope_length, roof_plane_t),
        roof_mat,
        unreal.Rotator(roll=-roof_pitch),
    )
    spawn_block(
        "LT52A_GEN_Roof_Plane_South",
        unreal.Vector((roof_x1 + roof_x2) / 2.0, roof_south_center_y, roof_plane_center_z),
        unreal.Vector((roof_x2 - roof_x1), slope_length, roof_plane_t),
        roof_mat,
        unreal.Rotator(roll=roof_pitch),
    )

    board_x = roof_x1 + 28.0
    board_idx = 0
    while board_x < roof_x2 - 28.0:
        for suffix, plane_y, plane_roll in [
            ("North", roof_north_center_y, -roof_pitch),
            ("South", roof_south_center_y, roof_pitch),
        ]:
            spawn_block(
                f"LT52A_GEN_Roof_BoardLine_{suffix}_{board_idx:02d}",
                unreal.Vector(board_x, plane_y, roof_plane_center_z + 1.8),
                unreal.Vector(2.4, slope_length - 20.0, 1.2),
                trim_mat,
                unreal.Rotator(roll=plane_roll),
            )
        board_x += board_spacing
        board_idx += 1

    wall_x("LT52A_GEN_Roof_Ridge", roof_x1 + 20.0, roof_x2 - 20.0, roof_mid_y, ridge_z + 2.0, 12.0, 10.0, trim_mat)
    wall_x("LT52A_GEN_Roof_HighEdge", roof_x1 + 14.0, roof_x2 - 14.0, roof_mid_y, ridge_z - 3.0, 8.0, 8.0, trim_mat)
    wall_x("LT52A_GEN_Roof_LowEdge_North", roof_x1 + 12.0, roof_x2 - 12.0, roof_y1 + 8.0, roof_low_z + 4.0, 12.0, 20.0, trim_mat)
    wall_x("LT52A_GEN_Roof_LowEdge_South", roof_x1 + 12.0, roof_x2 - 12.0, roof_y2 - 8.0, roof_low_z + 4.0, 12.0, 20.0, trim_mat)
    wall_x("LT52A_GEN_Roof_Fascia_Front", MIN_X - 30.0, MAX_X + 30.0, MAX_Y + 32.0, roof_low_z + 10.0, 14.0, 30.0, trim_mat)
    wall_x("LT52A_GEN_Roof_Fascia_Rear", MIN_X - 30.0, MAX_X + 30.0, MIN_Y - 32.0, roof_low_z + 10.0, 14.0, 30.0, trim_mat)
    wall_y("LT52A_GEN_Roof_Fascia_West", MIN_X - 32.0, MIN_Y - 18.0, MAX_Y + 18.0, roof_low_z + 10.0, 14.0, 30.0, trim_mat)
    wall_y("LT52A_GEN_Roof_Fascia_East", MAX_X + 32.0, MIN_Y - 18.0, MAX_Y + 18.0, roof_low_z + 10.0, 14.0, 30.0, trim_mat)
    roof_front_y = MAX_Y + WALL_T + 12.0
    roof_rear_y = MIN_Y - WALL_T - 12.0
    roof_z = roof_low_z + 6.0
    wall_x("LT52A_GEN_RoofEdge_Front", MIN_X - 6.0, MAX_X + 6.0, roof_front_y, roof_z, 14.0, 18.0, trim_mat)
    wall_x("LT52A_GEN_RoofEdge_Rear", MIN_X - 6.0, MAX_X + 6.0, roof_rear_y, roof_z, 14.0, 18.0, trim_mat)
    wall_y("LT52A_GEN_RoofEdge_West", MIN_X - WALL_T - 12.0, MIN_Y - 4.0, MAX_Y + 4.0, roof_z, 14.0, 18.0, trim_mat)
    wall_y("LT52A_GEN_RoofEdge_East", MAX_X + WALL_T + 12.0, MIN_Y - 4.0, MAX_Y + 4.0, roof_z, 14.0, 18.0, trim_mat)
    wall_y("LT52A_GEN_WestTrim", MIN_X - WALL_T - 12.0, MIN_Y + 24.0, MAX_Y - 24.0, BOTTOM_Z + 104.0, 8.0, 220.0, trim_mat)


def build_entry_portal(frame_mat, trim_mat, roof_mat):
    return


def main():
    unreal.EditorLevelLibrary.load_level(LEVEL_PATH)
    destroy_previous()
    wall_mat = ensure_flat_material("MAT_LT52A_WindBarrier", unreal.LinearColor(0.18, 0.18, 0.17, 1.0), roughness=0.94, specular=0.03)
    board_mat = ensure_flat_material("MAT_LT52A_Wood_Cladding", unreal.LinearColor(0.31, 0.23, 0.14, 1.0), roughness=0.76, specular=0.14)
    trim_mat = ensure_flat_material("MAT_LT52A_Trim_Wood", unreal.LinearColor(0.23, 0.17, 0.10, 1.0), roughness=0.72, specular=0.10)
    stud_mat = ensure_flat_material("MAT_LT52A_Stud_Wood", unreal.LinearColor(0.49, 0.36, 0.22, 1.0), roughness=0.82, specular=0.08)
    insulation_mat = ensure_flat_material("MAT_LT52A_Insulation_Yellow", unreal.LinearColor(0.86, 0.75, 0.24, 1.0), roughness=0.96, specular=0.01)
    glass_mat = ensure_flat_material("MAT_LT52A_Glass", unreal.LinearColor(0.52, 0.68, 0.78, 1.0), roughness=0.06, specular=0.80)
    roof_mat = ensure_flat_material("MAT_LT52A_Roof_Dark", unreal.LinearColor(0.04, 0.05, 0.06, 1.0), roughness=0.96, metallic=0.08, specular=0.03)
    platform_mat = ensure_flat_material("MAT_LT52A_Showroom_Platform", unreal.LinearColor(0.18, 0.19, 0.20, 1.0), roughness=0.95, specular=0.04)
    floor_base_mat = ensure_flat_material("MAT_LT52A_Floor_Base_Dark", unreal.LinearColor(0.22, 0.21, 0.19, 1.0), roughness=0.94, specular=0.03)
    set_material_on_labeled_actors(["showroom_platform"], platform_mat)
    set_material_on_labeled_actors(["floor_base"], floor_base_mat)
    set_material_on_labeled_actors(["roof_base", "roof_left", "roof_right", "roof_skylightstrip"], roof_mat)
    build_shell(wall_mat, trim_mat)
    build_stud_grid_and_infill(stud_mat, insulation_mat)
    build_battens(trim_mat)
    build_cladding(board_mat, trim_mat)
    build_opening_frames(trim_mat, glass_mat)
    build_terrace_structure(board_mat, trim_mat)
    build_roof_edge_and_entry_trim(trim_mat, roof_mat)
    build_entry_portal(wall_mat, trim_mat, roof_mat)
    unreal.EditorLevelLibrary.save_current_level()
    unreal.EditorLevelLibrary.editor_invalidate_viewports()
    unreal.log("[LT52A-GENERATED-EXTERIOR] shell and cladding rebuilt")


if __name__ == "__main__":
    main()
