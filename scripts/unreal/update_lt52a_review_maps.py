from __future__ import annotations

import math
from pathlib import Path

import unreal


LEVEL_PATH = "/Game/ModularHome/LT52A/Maps/LT52A_Showroom"
INTERIOR_LEVEL_PATH = "/Game/ModularHome/LT52A/Maps/LT52A_InteriorCutaway"
STATUS_PATH = Path(r"C:\3d\tmp\lt52a_review_maps_status.txt")


def set_prop_safe(target, prop, value):
    try:
        target.set_editor_property(prop, value)
        return True
    except Exception:
        return False


def spawn_or_update_camera(label: str, location: unreal.Vector, rotation: unreal.Rotator, *, fov: float = 48.0, focal_length: float = 32.0):
    actor = None
    for existing in unreal.EditorLevelLibrary.get_all_level_actors():
        if existing.get_actor_label() == label:
            actor = existing
            break
    if actor is None:
        actor = unreal.EditorLevelLibrary.spawn_actor_from_class(unreal.CineCameraActor, location, rotation)
        actor.set_actor_label(label)
    actor.set_actor_location(location, False, False)
    actor.set_actor_rotation(rotation, False)
    camera_component = actor.get_cine_camera_component() if hasattr(actor, "get_cine_camera_component") else actor.get_component_by_class(unreal.CameraComponent)
    if camera_component:
        set_prop_safe(camera_component, "field_of_view", fov)
        set_prop_safe(camera_component, "current_focal_length", focal_length)
    return actor


def make_look_at_rotation(location: unreal.Vector, target: unreal.Vector):
    dx = target.x - location.x
    dy = target.y - location.y
    dz = target.z - location.z
    yaw = math.degrees(math.atan2(dy, dx))
    horizontal = math.sqrt((dx * dx) + (dy * dy))
    pitch = math.degrees(math.atan2(dz, horizontal))
    return unreal.Rotator(pitch=pitch, yaw=yaw, roll=0.0)


def collect_house_bounds():
    static_actors = []
    for actor in unreal.EditorLevelLibrary.get_all_level_actors():
        label = actor.get_actor_label().lower()
        if not label.startswith("lt52a_"):
            continue
        if "camera_" in label:
            continue
        if actor.get_class().get_name() != "StaticMeshActor":
            continue
        static_actors.append(actor)

    mins = []
    maxs = []
    for actor in static_actors:
        origin, extent = actor.get_actor_bounds(False)
        mins.append(unreal.Vector(origin.x - extent.x, origin.y - extent.y, origin.z - extent.z))
        maxs.append(unreal.Vector(origin.x + extent.x, origin.y + extent.y, origin.z + extent.z))

    min_v = unreal.Vector(min(v.x for v in mins), min(v.y for v in mins), min(v.z for v in mins))
    max_v = unreal.Vector(max(v.x for v in maxs), max(v.y for v in maxs), max(v.z for v in maxs))
    center = unreal.Vector((min_v.x + max_v.x) * 0.5, (min_v.y + max_v.y) * 0.5, (min_v.z + max_v.z) * 0.5)
    extent = unreal.Vector((max_v.x - min_v.x) * 0.5, (max_v.y - min_v.y) * 0.5, (max_v.z - min_v.z) * 0.5)
    return center, extent


def find_average_origin_contains(tokens):
    matches = []
    lowered = [token.lower() for token in tokens]
    for actor in unreal.EditorLevelLibrary.get_all_level_actors():
        label = actor.get_actor_label().lower()
        if not label.startswith("lt52a_"):
            continue
        if not any(token in label for token in lowered):
            continue
        origin, _extent = actor.get_actor_bounds(False)
        matches.append(origin)
    if not matches:
        return None
    return unreal.Vector(
        sum(v.x for v in matches) / len(matches),
        sum(v.y for v in matches) / len(matches),
        sum(v.z for v in matches) / len(matches),
    )


def destroy_if_contains(tokens):
    lowered = [token.lower() for token in tokens]
    removed = 0
    for actor in list(unreal.EditorLevelLibrary.get_all_level_actors()):
        label = actor.get_actor_label().lower()
        if not label.startswith("lt52a_"):
            continue
        if any(token in label for token in lowered):
            unreal.EditorLevelLibrary.destroy_actor(actor)
            removed += 1
    return removed


def relocate_if_contains(tokens, location: unreal.Vector):
    lowered = [token.lower() for token in tokens]
    moved = 0
    for actor in unreal.EditorLevelLibrary.get_all_level_actors():
        label = actor.get_actor_label().lower()
        if not label.startswith("lt52a_"):
            continue
        if any(token in label for token in lowered):
            actor.set_actor_location(location, False, False)
            try:
                actor.set_actor_hidden_in_game(True)
            except Exception:
                pass
            moved += 1
    return moved


def tune_light(label: str, intensity: float | None = None):
    for actor in unreal.EditorLevelLibrary.get_all_level_actors():
        if actor.get_actor_label() != label:
            continue
        for comp_name in [
            "DirectionalLightComponent",
            "RectLightComponent",
            "PointLightComponent",
            "SkyLightComponent",
        ]:
            comp = actor.get_component_by_class(getattr(unreal, comp_name, object))
            if comp and intensity is not None:
                set_prop_safe(comp, "intensity", intensity)
        return


def tune_post_process(exposure_bias: float):
    for actor in unreal.EditorLevelLibrary.get_all_level_actors():
        if actor.get_actor_label() != "LT52A_PostProcess":
            continue
        comp = actor.get_component_by_class(unreal.PostProcessComponent)
        if not comp:
            return
        settings = comp.get_editor_property("settings")
        try:
            settings.auto_exposure_bias = exposure_bias
            settings.bloom_intensity = 0.08
            settings.motion_blur_amount = 0.0
            comp.set_editor_property("settings", settings)
        except Exception:
            pass
        return


def update_showroom_map():
    unreal.EditorLevelLibrary.load_level(LEVEL_PATH)
    destroy_if_contains(
        [
            "showroom_backdrop",
            "showroom_leftwing",
            "showroom_rightwing",
            "roomvolume_",
            "roommarker_",
            "zone_",
            "opening_",
            "sm_lt52a_entry_bench",
            "sm_lt52a_technical_",
        ]
    )
    relocate_if_contains(
        [
            "showroom_backdrop",
            "showroom_leftwing",
            "showroom_rightwing",
            "sm_lt52a_entry_bench",
            "sm_lt52a_technical_",
        ],
        unreal.Vector(0.0, 100000.0, -50000.0),
    )
    center, extent = collect_house_bounds()
    terrace_target = find_average_origin_contains(["terracedeckboard_", "terrace_base"]) or unreal.Vector(center.x + 20.0, center.y + 220.0, 110.0)
    living_target = find_average_origin_contains(["sofa_", "dining_"]) or unreal.Vector(center.x - 140.0, center.y + 20.0, 135.0)
    tune_light("LT52A_DirectionalLight", 2.2)
    tune_light("LT52A_SkyLight", 0.55)
    tune_light("LT52A_RectLight_A", 1800.0)
    tune_light("LT52A_RectLight_B", 1800.0)
    tune_light("LT52A_InteriorFill", 900.0)
    tune_post_process(-1.15)

    exterior_location = unreal.Vector(center.x - 1650.0, center.y - 1080.0, 340.0)
    overview_location = unreal.Vector(center.x - 1280.0, center.y - 980.0, 760.0)
    terrace_location = unreal.Vector(terrace_target.x, terrace_target.y + 780.0, 240.0)
    interior_location = unreal.Vector(living_target.x - 60.0, living_target.y + 680.0, 260.0)

    exterior_target = unreal.Vector(center.x + 120.0, center.y + 120.0, center.z + extent.z * 0.30)
    overview_target = unreal.Vector(center.x + 140.0, center.y + 80.0, center.z + extent.z * 0.20)
    terrace_target = unreal.Vector(terrace_target.x, terrace_target.y, 110.0)
    interior_target = unreal.Vector(living_target.x, living_target.y, 130.0)

    spawn_or_update_camera("LT52A_Camera_Exterior", exterior_location, make_look_at_rotation(exterior_location, exterior_target), focal_length=34.0, fov=54.0)
    spawn_or_update_camera("LT52A_Camera_Overview", overview_location, make_look_at_rotation(overview_location, overview_target), focal_length=26.0, fov=60.0)
    spawn_or_update_camera("LT52A_Camera_Terrace", terrace_location, make_look_at_rotation(terrace_location, terrace_target), focal_length=18.0, fov=76.0)
    spawn_or_update_camera("LT52A_Camera_Interior", interior_location, make_look_at_rotation(interior_location, interior_target), focal_length=18.0, fov=70.0)
    unreal.EditorLevelLibrary.save_current_level()


def update_interior_cutaway_map():
    unreal.EditorLevelLibrary.load_level(INTERIOR_LEVEL_PATH)
    removed = destroy_if_contains(
        [
            "showroom_",
            "exteriorwalls",
            "northwall_",
            "southwall_",
            "eastwall_",
            "westwall_",
            "facadeboard_",
            "facadecornertrim_",
            "frame_",
            "glasspane_",
            "roof_",
            "roofedge_",
            "skylightstrip",
            "opening_",
            "roomvolume_",
            "roommarker_",
            "zone_",
            "ceilingraft_",
            "facadecornertrim_",
        ]
    )
    tune_light("LT52A_DirectionalLight", 2.2)
    tune_light("LT52A_SkyLight", 0.5)
    tune_light("LT52A_RectLight_A", 2200.0)
    tune_light("LT52A_RectLight_B", 2200.0)
    tune_light("LT52A_InteriorFill", 900.0)
    tune_post_process(-1.4)

    center, _extent = collect_house_bounds()
    living_target = find_average_origin_contains(["sofa_", "dining_"]) or unreal.Vector(center.x - 140.0, center.y + 20.0, 135.0)
    kitchen_target = find_average_origin_contains(["kitchen_"]) or unreal.Vector(center.x + 60.0, center.y + 50.0, 125.0)
    bedroom_target = find_average_origin_contains(["bed_"]) or unreal.Vector(center.x + 290.0, center.y + 90.0, 125.0)
    bathroom_target = find_average_origin_contains(["shower_", "vanity_"]) or unreal.Vector(center.x + 330.0, center.y - 150.0, 120.0)
    technical_target = find_average_origin_contains(["technical_"]) or unreal.Vector(center.x + 430.0, center.y - 210.0, 120.0)

    living_location = unreal.Vector(living_target.x - 40.0, living_target.y + 660.0, 300.0)
    kitchen_location = unreal.Vector(kitchen_target.x + 120.0, kitchen_target.y + 460.0, 235.0)
    bedroom_location = unreal.Vector(bedroom_target.x + 140.0, bedroom_target.y + 360.0, 220.0)
    bathroom_location = unreal.Vector(bathroom_target.x + 120.0, bathroom_target.y + 620.0, 320.0)
    technical_location = unreal.Vector(technical_target.x + 140.0, technical_target.y + 260.0, 210.0)

    interior_target = unreal.Vector(
        (living_target.x + kitchen_target.x) * 0.5,
        (living_target.y + kitchen_target.y) * 0.5,
        135.0,
    )
    interior_location = unreal.Vector(interior_target.x - 120.0, interior_target.y + 760.0, 300.0)

    spawn_or_update_camera("LT52A_Camera_Interior", interior_location, make_look_at_rotation(interior_location, interior_target), focal_length=20.0, fov=60.0)
    spawn_or_update_camera("LT52A_Camera_Living", living_location, make_look_at_rotation(living_location, living_target), focal_length=22.0, fov=58.0)
    spawn_or_update_camera("LT52A_Camera_Kitchen", kitchen_location, make_look_at_rotation(kitchen_location, kitchen_target), focal_length=20.0, fov=62.0)
    spawn_or_update_camera("LT52A_Camera_Bedroom", bedroom_location, make_look_at_rotation(bedroom_location, bedroom_target), focal_length=20.0, fov=62.0)
    spawn_or_update_camera("LT52A_Camera_Bathroom", bathroom_location, make_look_at_rotation(bathroom_location, bathroom_target), focal_length=16.0, fov=72.0)
    spawn_or_update_camera("LT52A_Camera_Technical", technical_location, make_look_at_rotation(technical_location, technical_target), focal_length=20.0, fov=62.0)
    unreal.EditorLevelLibrary.save_current_level()
    return removed


def main():
    update_showroom_map()
    removed = update_interior_cutaway_map()
    STATUS_PATH.write_text(f"ok\nremoved={removed}\n", encoding="utf-8")
    unreal.log(f"[LT52A-REVIEW-MAPS] updated, removed={removed}")


if __name__ == "__main__":
    main()
