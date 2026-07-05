from __future__ import annotations

import unreal


LEVEL_PATH = "/Game/ModularHome/LT52A/Maps/LT52A_Showroom"
MAT_DEST = "/Game/ModularHome/LT52A/Materials"
CLADDING_TAG = "LT52A_CladdingPass"


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


def destroy_generated():
    for actor in list(unreal.EditorLevelLibrary.get_all_level_actors()):
        label = actor.get_actor_label().lower()
        tags = [str(tag) for tag in getattr(actor, "tags", [])]
        if CLADDING_TAG in tags or label.startswith("lt52a_cladding_") or label.startswith("lt52a_cornertrim_"):
            unreal.EditorLevelLibrary.destroy_actor(actor)


def spawn_block(label: str, location: unreal.Vector, scale: unreal.Vector, material):
    actor = unreal.EditorLevelLibrary.spawn_actor_from_class(unreal.StaticMeshActor, location, unreal.Rotator(0, 0, 0))
    actor.set_actor_label(label)
    actor.tags = [CLADDING_TAG]
    actor.set_actor_scale3d(scale)
    comp = actor.get_component_by_class(unreal.StaticMeshComponent)
    cube = load_cube()
    if cube:
        comp.set_static_mesh(cube)
    if material:
        comp.set_material(0, material)
    return actor


def find_actor(label: str):
    for actor in unreal.EditorLevelLibrary.get_all_level_actors():
        if actor.get_actor_label() == label:
            return actor
    return None


def main():
    unreal.EditorLevelLibrary.load_level(LEVEL_PATH)

    exterior = find_actor("LT52A_SM_LT52A_ExteriorWalls")
    if not exterior:
        raise RuntimeError("LT52A_SM_LT52A_ExteriorWalls not found")

    destroy_generated()

    origin, extent = exterior.get_actor_bounds(False)
    min_x = origin.x - extent.x
    max_x = origin.x + extent.x
    min_y = origin.y - extent.y
    max_y = origin.y + extent.y
    min_z = origin.z - extent.z
    max_z = origin.z + extent.z

    wall_mat = ensure_material_instance("M_Wood_Exterior", unreal.LinearColor(0.73, 0.68, 0.58, 1.0))
    cladding_mat = ensure_material_instance("M_Wood_Cladding", unreal.LinearColor(0.23, 0.16, 0.10, 1.0))
    trim_mat = ensure_material_instance("M_Trim_Wood", unreal.LinearColor(0.16, 0.11, 0.07, 1.0))

    # Re-tint the main exterior shell so the new cladding reads clearly.
    comp = exterior.get_component_by_class(unreal.StaticMeshComponent)
    if comp and wall_mat:
        try:
            comp.set_material(0, wall_mat)
        except Exception:
            pass

    board_height = 0.12
    board_depth = 0.06
    board_gap = 0.035
    board_step = board_height + board_gap
    board_z = min_z + 0.18 + board_height / 2.0
    board_index = 0
    board_scale_z = board_height / 100.0
    board_scale_depth = board_depth / 100.0
    north_south_scale_x = max(0.1, ((max_x - min_x) - 0.12) / 100.0)
    east_west_scale_y = max(0.1, ((max_y - min_y) - 0.12) / 100.0)

    while board_z < max_z - 0.12:
        spawn_block(
            f"LT52A_Cladding_North_{board_index:02d}",
            unreal.Vector(origin.x, min_y - board_depth / 2.0, board_z),
            unreal.Vector(north_south_scale_x, board_scale_depth, board_scale_z),
            cladding_mat,
        )
        spawn_block(
            f"LT52A_Cladding_South_{board_index:02d}",
            unreal.Vector(origin.x, max_y + board_depth / 2.0, board_z),
            unreal.Vector(north_south_scale_x, board_scale_depth, board_scale_z),
            cladding_mat,
        )
        spawn_block(
            f"LT52A_Cladding_East_{board_index:02d}",
            unreal.Vector(max_x + board_depth / 2.0, origin.y, board_z),
            unreal.Vector(board_scale_depth, east_west_scale_y, board_scale_z),
            cladding_mat,
        )
        spawn_block(
            f"LT52A_Cladding_West_{board_index:02d}",
            unreal.Vector(min_x - board_depth / 2.0, origin.y, board_z),
            unreal.Vector(board_scale_depth, east_west_scale_y, board_scale_z),
            cladding_mat,
        )
        board_z += board_step
        board_index += 1

    trim_depth = 0.08
    trim_width = 0.14
    trim_scale_x = trim_width / 100.0
    trim_scale_y = trim_depth / 100.0
    trim_scale_z = ((max_z - min_z) + 0.06) / 100.0
    trim_z = origin.z
    placements = [
        ("NW", unreal.Vector(min_x - trim_width / 2.0, min_y - trim_depth / 2.0, trim_z)),
        ("NE", unreal.Vector(max_x + trim_width / 2.0, min_y - trim_depth / 2.0, trim_z)),
        ("SW", unreal.Vector(min_x - trim_width / 2.0, max_y + trim_depth / 2.0, trim_z)),
        ("SE", unreal.Vector(max_x + trim_width / 2.0, max_y + trim_depth / 2.0, trim_z)),
    ]
    for suffix, location in placements:
        spawn_block(
            f"LT52A_CornerTrim_{suffix}",
            location,
            unreal.Vector(trim_scale_x, trim_scale_y, trim_scale_z),
            trim_mat,
        )

    # Remove dead imported placeholder slats so only the new visible cladding remains.
    removed = 0
    for actor in list(unreal.EditorLevelLibrary.get_all_level_actors()):
        label = actor.get_actor_label().lower()
        if "lt52a_sm_lt52a_facadeboard_" in label or "lt52a_sm_lt52a_facadecornertrim_" in label:
            unreal.EditorLevelLibrary.destroy_actor(actor)
            removed += 1

    unreal.EditorLevelLibrary.save_current_level()
    unreal.EditorLevelLibrary.editor_invalidate_viewports()
    unreal.log(f"[LT52A-BUILD-CLADDING] boards={board_index * 4} removed_dead={removed}")


if __name__ == "__main__":
    main()
