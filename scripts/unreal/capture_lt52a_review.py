from __future__ import annotations

from datetime import datetime
from pathlib import Path
import json
import time

import unreal


LEVEL_PATH = "/Game/ModularHome/LT52A/Maps/LT52A_Showroom"
PROJECT_ROOT = Path(r"C:\Users\esauk\OneDrive\Documents\Unreal Projects\LT52A_ModularHome_Unreal_POC")
CAPTURE_ROOT = PROJECT_ROOT / "Saved" / "ReviewCaptures" / "LT52A"
LATEST_DIR = CAPTURE_ROOT / "latest"
TIMESTAMP_DIR = CAPTURE_ROOT / datetime.now().strftime("%Y%m%d_%H%M%S")
MANIFEST_PATH = LATEST_DIR / "manifest.json"
STATUS_PATH = LATEST_DIR / "capture_status.json"
CAMERA_TAG = "LT52A_ReviewCamera_Auto"
DEFAULT_SCREENSHOT_DIR = PROJECT_ROOT / "Saved" / "Screenshots" / "WindowsEditor"
REQUEST_PATH = Path(r"C:\3d\tmp\lt52a_capture_request.json")


def set_prop_safe(target, prop, value):
    try:
        target.set_editor_property(prop, value)
        return True
    except Exception as exc:
        unreal.log_warning(f"[LT52A-Capture] Could not set {prop}: {exc}")
        return False


def clear_old_latest():
    LATEST_DIR.mkdir(parents=True, exist_ok=True)
    for item in LATEST_DIR.iterdir():
        if item.is_file():
            item.unlink()


def write_status(payload: dict):
    LATEST_DIR.mkdir(parents=True, exist_ok=True)
    STATUS_PATH.write_text(json.dumps(payload, indent=2), encoding="utf-8")


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
        raise RuntimeError("No LT52A static mesh actors found for capture bounds.")

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


def wait_for_task(task, timeout_seconds: float = 20.0):
    start = time.time()
    while time.time() - start < timeout_seconds:
        if task.is_task_done():
            return True
        time.sleep(0.25)
    return False


def capture_camera(camera_actor, filename: Path):
    filename.parent.mkdir(parents=True, exist_ok=True)
    basename = filename.name
    generated_path = DEFAULT_SCREENSHOT_DIR / basename
    if generated_path.exists():
        generated_path.unlink()

    unreal.AutomationLibrary.take_high_res_screenshot(
        1920,
        1080,
        basename,
        camera_actor,
        False,
        False,
        unreal.ComparisonTolerance.LOW,
        "",
        0.2,
        True,
    )

    deadline = time.time() + 25.0
    while time.time() < deadline:
        if generated_path.exists():
            filename.write_bytes(generated_path.read_bytes())
            return True
        time.sleep(0.5)

    return False


def main():
    status = {
        "generatedAt": datetime.now().isoformat(),
        "levelPath": LEVEL_PATH,
        "captures": [],
        "errors": [],
    }

    request = None
    if REQUEST_PATH.exists():
        request = json.loads(REQUEST_PATH.read_text(encoding="utf-8-sig"))
    if not request or request.get("clearLatest", False):
        clear_old_latest()
    TIMESTAMP_DIR.mkdir(parents=True, exist_ok=True)

    try:
        unreal.EditorLevelLibrary.load_level(LEVEL_PATH)
        level_subsystem = unreal.get_editor_subsystem(unreal.LevelEditorSubsystem)
        level_subsystem.set_exact_camera_view(True)

        cameras = ensure_review_cameras()
        capture_plan = [
            ("01-exterior.png", "LT52A_Camera_Exterior"),
            ("02-overview.png", "LT52A_Camera_Overview"),
            ("03-terrace.png", "LT52A_Camera_Terrace"),
            ("04-living.png", "LT52A_Camera_Living"),
            ("05-bedroom.png", "LT52A_Camera_Bedroom"),
            ("06-bathroom.png", "LT52A_Camera_Bathroom"),
        ]
        if request and request.get("fileName") and request.get("cameraLabel"):
            capture_plan = [(request["fileName"], request["cameraLabel"])]

        by_label = {camera.get_actor_label(): camera for camera in cameras}
        manifest = []
        for file_name, label in capture_plan:
            camera = by_label[label]
            level_subsystem.pilot_level_actor(camera)
            time.sleep(0.75)
            latest_path = LATEST_DIR / file_name
            timestamp_path = TIMESTAMP_DIR / file_name
            ok = capture_camera(camera, latest_path)
            if ok:
                timestamp_path.write_bytes(latest_path.read_bytes())
            manifest.append(
                {
                    "file": file_name,
                    "camera": label,
                    "path": str(latest_path),
                    "captured": ok,
                }
            )
            status["captures"].append({"camera": label, "captured": ok})

        MANIFEST_PATH.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
        write_status(status)
        unreal.log(f"[LT52A-Capture] Captured {sum(1 for item in manifest if item['captured'])}/{len(manifest)} review images.")
    except Exception as exc:
        status["errors"].append(str(exc))
        write_status(status)
        unreal.log_error(f"[LT52A-Capture] {exc}")
        raise


if __name__ == "__main__":
    main()
