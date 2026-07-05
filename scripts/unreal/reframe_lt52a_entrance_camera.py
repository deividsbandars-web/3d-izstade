from __future__ import annotations

import math
import unreal


LEVEL_PATH = "/Game/ModularHome/LT52A/Maps/LT52A_Showroom"
CAMERA_LABEL = "LT52A_Camera_Entrance"


def make_look_at_rotation(location: unreal.Vector, target: unreal.Vector):
    dx = target.x - location.x
    dy = target.y - location.y
    dz = target.z - location.z
    yaw = math.degrees(math.atan2(dy, dx))
    horizontal = math.sqrt((dx * dx) + (dy * dy))
    pitch = math.degrees(math.atan2(dz, horizontal))
    return unreal.Rotator(pitch=pitch, yaw=yaw, roll=0.0)


def spawn_or_update_camera(label: str, location: unreal.Vector, rotation: unreal.Rotator, *, fov: float = 54.0, focal_length: float = 24.0):
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
    comp = actor.get_cine_camera_component() if hasattr(actor, "get_cine_camera_component") else actor.get_component_by_class(unreal.CameraComponent)
    if comp:
        try:
            comp.set_editor_property("field_of_view", fov)
            comp.set_editor_property("current_focal_length", focal_length)
        except Exception:
            pass
    return actor


def main():
    unreal.EditorLevelLibrary.load_level(LEVEL_PATH)
    location = unreal.Vector(-1180.0, 520.0, 205.0)
    target = unreal.Vector(-450.0, 35.0, 132.0)
    rotation = make_look_at_rotation(location, target)
    spawn_or_update_camera(CAMERA_LABEL, location, rotation, fov=58.0, focal_length=22.0)
    unreal.EditorLevelLibrary.save_current_level()
    unreal.EditorLevelLibrary.editor_invalidate_viewports()
    unreal.log(f"[LT52A-ENTRANCE-CAMERA] location={location} target={target}")


if __name__ == "__main__":
    main()
