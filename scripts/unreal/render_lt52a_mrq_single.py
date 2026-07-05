from __future__ import annotations

from datetime import datetime
from pathlib import Path
import json
import math

import unreal


LEVEL_PATH = "/Game/ModularHome/LT52A/Maps/LT52A_Showroom"
SEQUENCE_PACKAGE_PATH = "/Game/ModularHome/LT52A/Sequences"
SEQUENCE_ASSET_NAME = "LT52A_Capture_Exterior"
CAMERA_LABEL = "LT52A_Camera_Exterior"
STATUS_PATH = Path(r"C:\3d\tmp\lt52a_mrq_single_status.json")
OUTPUT_DIR = r"C:\Users\esauk\OneDrive\Documents\Unreal Projects\LT52A_ModularHome_Unreal_POC\Saved\MRQCaptures\LT52A\single"
REQUEST_PATH = Path(r"C:\3d\tmp\lt52a_mrq_single_request.json")

SubsystemExecutor = None
RenderedFiles = []
RenderFinished = False
TickHandle = None


def load_request():
    global CAMERA_LABEL, STATUS_PATH, OUTPUT_DIR
    if not REQUEST_PATH.exists():
        return
    try:
        payload = json.loads(REQUEST_PATH.read_text(encoding="utf-8-sig"))
    except Exception:
        return
    CAMERA_LABEL = str(payload.get("cameraLabel", CAMERA_LABEL))
    output_dir = payload.get("outputDir")
    if output_dir:
        OUTPUT_DIR = str(output_dir)
    status_path = payload.get("statusPath")
    if status_path:
        STATUS_PATH = Path(status_path)


def write_status(payload: dict):
    STATUS_PATH.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def set_prop_safe(target, prop, value):
    try:
        target.set_editor_property(prop, value)
        return True
    except Exception as exc:
        unreal.log_warning(f"[LT52A-MRQ-RENDER] Could not set {prop}: {exc}")
        return False


def spawn_or_update_camera(label: str, location: unreal.Vector, rotation: unreal.Rotator, fov: float = 48.0):
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
        set_prop_safe(camera_component, "current_focal_length", 32.0)
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
        raise RuntimeError("No LT52A static mesh actors found.")

    min_v = unreal.Vector(min(v.x for v in mins), min(v.y for v in mins), min(v.z for v in mins))
    max_v = unreal.Vector(max(v.x for v in maxs), max(v.y for v in maxs), max(v.z for v in maxs))
    center = unreal.Vector((min_v.x + max_v.x) * 0.5, (min_v.y + max_v.y) * 0.5, (min_v.z + max_v.z) * 0.5)
    extent = unreal.Vector((max_v.x - min_v.x) * 0.5, (max_v.y - min_v.y) * 0.5, (max_v.z - min_v.z) * 0.5)
    return center, extent


def make_look_at_rotation(location: unreal.Vector, target: unreal.Vector):
    dx = target.x - location.x
    dy = target.y - location.y
    dz = target.z - location.z
    yaw = math.degrees(math.atan2(dy, dx))
    horizontal = math.sqrt((dx * dx) + (dy * dy))
    pitch = math.degrees(math.atan2(dz, horizontal))
    return unreal.Rotator(pitch=pitch, yaw=yaw, roll=0.0)


def ensure_exterior_camera():
    for actor in unreal.EditorLevelLibrary.get_all_level_actors():
        if actor.get_actor_label() == CAMERA_LABEL:
            return actor
    center, extent = collect_house_bounds()
    location = unreal.Vector(center.x - extent.x * 1.9, center.y - extent.y * 1.4, max(240.0, extent.z * 1.05))
    target = unreal.Vector(center.x, center.y, center.z + extent.z * 0.08)
    return spawn_or_update_camera(CAMERA_LABEL, location, make_look_at_rotation(location, target))


def create_sequence(camera_actor):
    asset_tools = unreal.AssetToolsHelpers.get_asset_tools()
    sequence_asset_path = f"{SEQUENCE_PACKAGE_PATH}/{SEQUENCE_ASSET_NAME}"
    if unreal.EditorAssetLibrary.does_asset_exist(sequence_asset_path):
        unreal.EditorAssetLibrary.delete_asset(sequence_asset_path)

    sequence = asset_tools.create_asset(
        SEQUENCE_ASSET_NAME,
        SEQUENCE_PACKAGE_PATH,
        unreal.LevelSequence,
        unreal.LevelSequenceFactoryNew(),
    )
    sequence.set_playback_end(1)

    binding = sequence.add_possessable(camera_actor)
    camera_cut_track = sequence.add_track(unreal.MovieSceneCameraCutTrack)
    camera_cut_section = camera_cut_track.add_section()
    camera_cut_section.set_start_frame(-1)
    camera_cut_section.set_end_frame(1)

    camera_binding_id = unreal.MovieSceneObjectBindingID()
    camera_binding_id.set_editor_property("Guid", binding.get_id())
    camera_cut_section.set_editor_property("CameraBindingID", camera_binding_id)

    if hasattr(camera_actor, "get_cine_camera_component"):
        camera_component = camera_actor.get_cine_camera_component()
        camera_component_binding = sequence.add_possessable(camera_component)
        camera_component_binding.set_parent(binding)
        focal_length_track = camera_component_binding.add_track(unreal.MovieSceneFloatTrack)
        focal_length_track.set_property_name_and_path("CurrentFocalLength", "CurrentFocalLength")
        focal_length_section = focal_length_track.add_section()
        focal_length_section.set_start_frame_bounded(0)
        focal_length_section.set_end_frame_bounded(0)

    unreal.EditorAssetLibrary.save_asset(sequence_asset_path)
    return sequence_asset_path


def on_queue_finished_callback(executor, success):
    global SubsystemExecutor, RenderFinished, TickHandle
    RenderFinished = True
    payload = {
        "generatedAt": datetime.now().isoformat(),
        "camera": CAMERA_LABEL,
        "outputDir": OUTPUT_DIR,
        "renderStarted": True,
        "renderFinished": bool(success),
        "files": RenderedFiles,
        "errors": [],
    }
    write_status(payload)
    unreal.log(f"[LT52A-MRQ-RENDER] finished success={success} files={len(RenderedFiles)}")
    if TickHandle is not None:
        unreal.unregister_slate_post_tick_callback(TickHandle)
        TickHandle = None
    if SubsystemExecutor is not None:
        del SubsystemExecutor


def on_individual_shot_finished_callback(params):
    global RenderedFiles
    for shot in params.shot_data:
        for pass_identifier in shot.render_pass_data:
            for file in shot.render_pass_data[pass_identifier].file_paths:
                RenderedFiles.append(file)
                unreal.log(f"[LT52A-MRQ-RENDER] file={file}")


def tick_keepalive(delta_seconds):
    if RenderFinished:
        return


def main():
    global SubsystemExecutor, TickHandle
    load_request()
    unreal.EditorLevelLibrary.load_level(LEVEL_PATH)
    camera_actor = ensure_exterior_camera()
    sequence_asset_path = create_sequence(camera_actor)

    write_status(
        {
            "generatedAt": datetime.now().isoformat(),
            "camera": CAMERA_LABEL,
            "sequence": sequence_asset_path,
            "outputDir": OUTPUT_DIR,
            "renderStarted": False,
            "renderFinished": False,
            "files": [],
            "errors": [],
        }
    )

    subsystem = unreal.get_editor_subsystem(unreal.MoviePipelineQueueSubsystem)
    queue = subsystem.get_queue()
    queue.delete_all_jobs()

    job = queue.allocate_new_job(unreal.MoviePipelineExecutorJob)
    job.job_name = "LT52A_Exterior_Test"
    job.map = unreal.SoftObjectPath(LEVEL_PATH)
    job.sequence = unreal.SoftObjectPath(sequence_asset_path)

    config = job.get_configuration()
    output_setting = config.find_or_add_setting_by_class(unreal.MoviePipelineOutputSetting)
    output_setting.output_resolution = unreal.IntPoint(1920, 1080)
    output_setting.output_directory = unreal.DirectoryPath(OUTPUT_DIR)
    output_setting.flush_disk_writes_per_shot = True
    output_setting.override_existing_output = True
    set_prop_safe(output_setting, "file_name_format", "LT52A_Exterior_Test.{frame_number}")

    render_pass = config.find_or_add_setting_by_class(unreal.MoviePipelineDeferredPassBase)
    set_prop_safe(render_pass, "disable_multisample_effects", True)
    config.find_or_add_setting_by_class(unreal.MoviePipelineImageSequenceOutput_PNG)

    TickHandle = unreal.register_slate_post_tick_callback(tick_keepalive)
    SubsystemExecutor = unreal.MoviePipelinePIEExecutor()
    SubsystemExecutor.on_executor_finished_delegate.add_callable_unique(on_queue_finished_callback)
    SubsystemExecutor.on_individual_shot_work_finished_delegate.add_callable_unique(on_individual_shot_finished_callback)
    subsystem.render_queue_with_executor_instance(SubsystemExecutor)

    write_status(
        {
            "generatedAt": datetime.now().isoformat(),
            "camera": CAMERA_LABEL,
            "sequence": sequence_asset_path,
            "outputDir": OUTPUT_DIR,
            "renderStarted": True,
            "renderFinished": False,
            "files": [],
            "errors": [],
        }
    )
    unreal.log("[LT52A-MRQ-RENDER] queued")


if __name__ == "__main__":
    main()
