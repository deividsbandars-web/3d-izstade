from __future__ import annotations

import unreal


LEVEL_PATH = "/Game/ModularHome/LT52A/Maps/LT52A_Showroom"


def ensure_material_instance(name: str, color: unreal.LinearColor, parent_path: str = "/Engine/BasicShapes/BasicShapeMaterial.BasicShapeMaterial"):
    dest = "/Game/ModularHome/LT52A/Materials"
    unreal.EditorAssetLibrary.make_directory(dest)
    asset_path = f"{dest}/{name}"
    material = unreal.EditorAssetLibrary.load_asset(asset_path)
    parent = unreal.EditorAssetLibrary.load_asset(parent_path)
    if not material:
        factory = unreal.MaterialInstanceConstantFactoryNew()
        material = unreal.AssetToolsHelpers.get_asset_tools().create_asset(
            name,
            dest,
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


def set_static_mesh_material(actor, material):
    comp = actor.get_component_by_class(unreal.StaticMeshComponent)
    if not comp or not material:
        return
    try:
        mesh = comp.get_editor_property("static_mesh")
        slots = max(1, len(mesh.get_static_materials())) if mesh else 1
    except Exception:
        slots = 1
    for index in range(slots):
        try:
            comp.set_material(index, material)
        except Exception:
            pass


def main():
    unreal.EditorLevelLibrary.load_level(LEVEL_PATH)
    wall_mat = ensure_material_instance("M_Wood_Exterior", unreal.LinearColor(0.72, 0.67, 0.56, 1.0))
    board_mat = ensure_material_instance("M_Wood_Cladding", unreal.LinearColor(0.24, 0.17, 0.11, 1.0))
    trim_mat = ensure_material_instance("M_Trim_Wood", unreal.LinearColor(0.18, 0.12, 0.08, 1.0))

    removed = []
    polished = 0
    for actor in list(unreal.EditorLevelLibrary.get_all_level_actors()):
        label = actor.get_actor_label()
        lower = label.lower()
        if lower in {
            "lt52a_sm_lt52a_entry_bench",
            "lt52a_sm_lt52a_technical_block",
            "lt52a_sm_lt52a_technical_cabinet",
        }:
            unreal.EditorLevelLibrary.destroy_actor(actor)
            removed.append(label)
            continue

        if "lt52a_sm_lt52a_facadeboard_" in lower:
            loc = actor.get_actor_location()
            scale = actor.get_actor_scale3d()
            if "_north_" in lower:
                actor.set_actor_scale3d(unreal.Vector(scale.x * 1.02, scale.y * 4.2, scale.z * 5.8))
                actor.set_actor_location(unreal.Vector(loc.x, loc.y + 5.0, loc.z), False, False)
            elif "_south_" in lower:
                actor.set_actor_scale3d(unreal.Vector(scale.x * 1.02, scale.y * 4.2, scale.z * 5.8))
                actor.set_actor_location(unreal.Vector(loc.x, loc.y - 5.0, loc.z), False, False)
            elif "_east_" in lower:
                actor.set_actor_scale3d(unreal.Vector(scale.x * 4.2, scale.y * 1.02, scale.z * 5.8))
                actor.set_actor_location(unreal.Vector(loc.x + 5.0, loc.y, loc.z), False, False)
            elif "_west_" in lower:
                actor.set_actor_scale3d(unreal.Vector(scale.x * 4.2, scale.y * 1.02, scale.z * 5.8))
                actor.set_actor_location(unreal.Vector(loc.x - 5.0, loc.y, loc.z), False, False)
            set_static_mesh_material(actor, board_mat)
            polished += 1
            continue

        if "lt52a_sm_lt52a_facadecornertrim_" in lower:
            scale = actor.get_actor_scale3d()
            actor.set_actor_scale3d(unreal.Vector(scale.x * 1.8, scale.y * 1.8, scale.z * 1.02))
            set_static_mesh_material(actor, trim_mat)
            polished += 1
            continue

        if any(token in lower for token in [
            "lt52a_sm_lt52a_exteriorwalls",
            "lt52a_sm_lt52a_northwall_",
            "lt52a_sm_lt52a_southwall_",
            "lt52a_sm_lt52a_eastwall_",
            "lt52a_sm_lt52a_westwall_",
        ]):
            set_static_mesh_material(actor, wall_mat)

    unreal.EditorLevelLibrary.save_current_level()
    unreal.EditorLevelLibrary.editor_invalidate_viewports()
    unreal.log(f"[LT52A-EXTERIOR-POLISH] removed={removed} polished={polished}")


if __name__ == "__main__":
    main()
