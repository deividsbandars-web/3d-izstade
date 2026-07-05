from __future__ import annotations

from datetime import datetime
from pathlib import Path
import json
import time

import unreal


LEVEL_PATH = "/Game/ModularHome/LT52A/Maps/LT52A_Showroom"
REQUEST_PATH = Path(r"C:\3d\tmp\lt52a_preview_request.json")
STATUS_PATH = Path(r"C:\3d\tmp\lt52a_preview_status.json")
CAMERA_TAG = "LT52A_ReviewCamera_Auto"


def set_prop_safe(target, prop, value):
    try:
        target.set_editor_property(prop, value)
        return True
    except Exception as exc:
        unreal.log_warning(f"[LT52A-Preview] Could not set {prop}: {exc}")
        return False


def spawn_or_update_camera(label: str, location: unreal.Vector, rotation: unreal.Rotator, fov: float = 48.0):
    actor = None
    for existing in unreal.EditorLevelLibrary.get_all_level_actors():
        if existing.get_actor_label() == label:
            actor = existing
            break
    if actor is None:
        actor = unreal.EditorLevelLibrary.spawn_actor_from_class(unreal.CameraActor, location, rotation)
        actor.set_actor_label(label)
        actor.tags = [CAMERA_TAG]
    actor.set_actor_location(location, False, False)
    actor.set_actor_rotation(rotation, False)
    camera_component = actor.get_component_by_class(unreal.CameraComponent)
    set_prop_safe(camera_component, "field_of_view", fov)
    return actor


def collect_house_bounds():
    static_actors = []
    for actor in unreal.EditorLevelLibrary.get_all_level_actors():
        label = actor.get_actor_label()
        if not label.startswith("LT52A_"):
            continue
        if any(excluded in label for excluded in ["Camera_", "DirectionalLight", "SkyLight", "PostProcess", "PlayerStart", "Showroom_"]):
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

    if not mins:
        raise RuntimeError("No LT52A static mesh actors found for preview bounds.")

    min_v = unreal.Vector(min(v.x for v in mins), min(v.y for v in mins), min(v.z for v in mins))
    max_v = unreal.Vector(max(v.x for v in maxs), max(v.y for v in maxs), max(v.z for v in maxs))
    center = unreal.Vector((min_v.x + max_v.x) * 0.5, (min_v.y + max_v.y) * 0.5, (min_v.z + max_v.z) * 0.5)
    extent = unreal.Vector((max_v.x - min_v.x) * 0.5, (max_v.y - min_v.y) * 0.5, (max_v.z - min_v.z) * 0.5)
    return center, extent, min_v, max_v


def ensure_review_cameras():
    center, extent, min_v, max_v = collect_house_bounds()
    cameras = [
        ("LT52A_Camera_Exterior", unreal.Vector(center.x - extent.x * 1.8, center.y - extent.y * 1.3, max(220.0, extent.z * 1.15)), unreal.Rotator(-8, 34, 0)),
        ("LT52A_Camera_Overview", unreal.Vector(center.x - extent.x * 1.45, center.y - extent.y * 1.22, extent.z * 2.20), unreal.Rotator(-30, 36, 0)),
        ("LT52A_Camera_Terrace", unreal.Vector(center.x + extent.x * 0.10, min_v.y - extent.y * 0.95, max(160.0, extent.z * 0.70)), unreal.Rotator(-4, 92, 0)),
        ("LT52A_Camera_Living", unreal.Vector(center.x - extent.x * 0.18, center.y + 20, max(170.0, extent.z * 0.58)), unreal.Rotator(-1, 18, 0)),
        ("LT52A_Camera_Bedroom", unreal.Vector(center.x + extent.x * 0.45, center.y - extent.y * 0.18, max(150.0, extent.z * 0.52)), unreal.Rotator(-1, -96, 0)),
        ("LT52A_Camera_Bathroom", unreal.Vector(center.x + extent.x * 0.58, center.y + extent.y * 0.22, max(150.0, extent.z * 0.50)), unreal.Rotator(-1, -130, 0)),
    ]
    result = []
    for label, location, rotation in cameras:
        result.append(spawn_or_update_camera(label, location, rotation))
    return result


def write_status(payload: dict):
    STATUS_PATH.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def main():
    request = {
        "cameraLabel": "LT52A_Camera_Exterior",
        "levelPath": LEVEL_PATH,
        "holdSeconds": 10,
    }
    if REQUEST_PATH.exists():
        request.update(json.loads(REQUEST_PATH.read_text(encoding="utf-8-sig")))

    level_path = str(request["levelPath"])
    unreal.EditorLevelLibrary.load_level(level_path)

    cameras = {actor.get_actor_label(): actor for actor in unreal.EditorLevelLibrary.get_all_level_actors() if "Camera_" in actor.get_actor_label()}
    if not cameras and level_path == LEVEL_PATH:
        created = ensure_review_cameras()
        cameras = {camera.get_actor_label(): camera for camera in created}

    camera = cameras.get(request["cameraLabel"])
    if camera is None:
        raise RuntimeError(f"Camera not found in {level_path}: {request['cameraLabel']}")

    level_subsystem = unreal.get_editor_subsystem(unreal.LevelEditorSubsystem)
    level_subsystem.set_exact_camera_view(True)
    level_subsystem.pilot_level_actor(camera)
    time.sleep(1.5)

    write_status(
        {
            "generatedAt": datetime.now().isoformat(),
            "ready": True,
            "cameraLabel": request["cameraLabel"],
            "levelPath": level_path,
            "holdSeconds": request["holdSeconds"],
        }
    )
    unreal.log(f"[LT52A-Preview] Ready on camera {request['cameraLabel']}")
    time.sleep(float(request["holdSeconds"]))


if __name__ == "__main__":
    main()
