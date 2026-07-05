from __future__ import annotations

import math
import unreal


LEVEL_PATH = "/Game/ModularHome/LT52A/Maps/LT52A_Showroom"
CAMERA_LABEL = "LT52A_Camera_Exterior"


def make_look_at_rotation(location: unreal.Vector, target: unreal.Vector):
    dx = target.x - location.x
    dy = target.y - location.y
    dz = target.z - location.z
    yaw = math.degrees(math.atan2(dy, dx))
    horizontal = math.sqrt((dx * dx) + (dy * dy))
    pitch = math.degrees(math.atan2(dz, horizontal))
    return unreal.Rotator(pitch=pitch, yaw=yaw, roll=0.0)


def main():
    unreal.EditorLevelLibrary.load_level(LEVEL_PATH)

    actors = []
    for actor in unreal.EditorLevelLibrary.get_all_level_actors():
        label = actor.get_actor_label().lower()
        if not label.startswith("lt52a_gen_"):
            continue
        if actor.get_class().get_name() != "StaticMeshActor":
            continue
        actors.append(actor)

    if not actors:
        raise RuntimeError("No LT52A generated exterior actors found")

    mins = []
    maxs = []
    for actor in actors:
        origin, extent = actor.get_actor_bounds(False)
        mins.append(unreal.Vector(origin.x - extent.x, origin.y - extent.y, origin.z - extent.z))
        maxs.append(unreal.Vector(origin.x + extent.x, origin.y + extent.y, origin.z + extent.z))

    min_v = unreal.Vector(min(v.x for v in mins), min(v.y for v in mins), min(v.z for v in mins))
    max_v = unreal.Vector(max(v.x for v in maxs), max(v.y for v in maxs), max(v.z for v in maxs))
    center = unreal.Vector((min_v.x + max_v.x) * 0.5, (min_v.y + max_v.y) * 0.5, (min_v.z + max_v.z) * 0.5)
    extent = unreal.Vector((max_v.x - min_v.x) * 0.5, (max_v.y - min_v.y) * 0.5, (max_v.z - min_v.z) * 0.5)

    camera = None
    for actor in unreal.EditorLevelLibrary.get_all_level_actors():
        if actor.get_actor_label() == CAMERA_LABEL:
            camera = actor
            break
    if camera is None:
        camera = unreal.EditorLevelLibrary.spawn_actor_from_class(unreal.CameraActor, unreal.Vector(0, 0, 0), unreal.Rotator(0, 0, 0))
        camera.set_actor_label(CAMERA_LABEL)

    location = unreal.Vector(center.x - extent.x * 3.8, center.y - extent.y * 2.7, center.z + extent.z * 1.10)
    target = unreal.Vector(center.x + extent.x * 0.08, center.y - extent.y * 0.02, center.z + extent.z * 0.10)
    rotation = make_look_at_rotation(location, target)
    camera.set_actor_location(location, False, False)
    camera.set_actor_rotation(rotation, False)
    comp = camera.get_component_by_class(unreal.CameraComponent)
    if comp:
        try:
            comp.set_editor_property("field_of_view", 64.0)
        except Exception:
            pass
    unreal.EditorLevelLibrary.save_current_level()
    unreal.EditorLevelLibrary.editor_invalidate_viewports()
    unreal.log(f"[LT52A-REFRAME-EXTERIOR] location={location} target={target}")


if __name__ == "__main__":
    main()
