from __future__ import annotations

import unreal


LEVEL_PATH = "/Game/ModularHome/LT52A/Maps/LT52A_Showroom"


def main():
    unreal.EditorLevelLibrary.load_level(LEVEL_PATH)

    removed = 0
    for actor in list(unreal.EditorLevelLibrary.get_all_level_actors()):
        label = actor.get_actor_label().lower()
        tags = [str(tag) for tag in getattr(actor, "tags", [])]
        if (
            label.startswith("lt52a_cladding_")
            or label.startswith("lt52a_cornertrim_")
            or "LT52A_CladdingPass" in tags
        ):
            unreal.EditorLevelLibrary.destroy_actor(actor)
            removed += 1

    # Restore a calmer exterior material balance.
    mat_dest = "/Game/ModularHome/LT52A/Materials"
    wall_mat = unreal.EditorAssetLibrary.load_asset(f"{mat_dest}/M_Wood_Exterior")
    trim_mat = unreal.EditorAssetLibrary.load_asset(f"{mat_dest}/M_Trim_Wood")
    roof_mat = unreal.EditorAssetLibrary.load_asset(f"{mat_dest}/M_Roof_Dark")
    glass_mat = unreal.EditorAssetLibrary.load_asset(f"{mat_dest}/M_Glass")

    for actor in unreal.EditorLevelLibrary.get_all_level_actors():
        label = actor.get_actor_label().lower()
        comp = actor.get_component_by_class(unreal.StaticMeshComponent)
        if not comp:
            continue
        try:
            if (
                "lt52a_sm_lt52a_exteriorwalls" in label
                or "lt52a_sm_lt52a_northwall_" in label
                or "lt52a_sm_lt52a_southwall_" in label
                or "lt52a_sm_lt52a_eastwall_" in label
                or "lt52a_sm_lt52a_westwall_" in label
            ):
                if wall_mat:
                    comp.set_material(0, wall_mat)
            elif "lt52a_sm_lt52a_roof" in label:
                if roof_mat:
                    comp.set_material(0, roof_mat)
            elif "lt52a_sm_lt52a_frame_" in label:
                if trim_mat:
                    comp.set_material(0, trim_mat)
            elif "lt52a_sm_lt52a_glasspane_" in label:
                if glass_mat:
                    comp.set_material(0, glass_mat)
        except Exception:
            pass

    unreal.EditorLevelLibrary.save_current_level()
    unreal.EditorLevelLibrary.editor_invalidate_viewports()
    unreal.log(f"[LT52A-REVERT-EXTERIOR] removed={removed}")


if __name__ == "__main__":
    main()
