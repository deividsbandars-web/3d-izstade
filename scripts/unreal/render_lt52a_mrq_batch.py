from __future__ import annotations

from datetime import datetime
from pathlib import Path
import json
import math

import unreal

LEVEL_PATH = "/Game/ModularHome/LT52A/Maps/LT52A_Showroom"
INTERIOR_LEVEL_PATH = "/Game/ModularHome/LT52A/Maps/LT52A_InteriorCutaway"
SEQUENCE_PACKAGE_PATH = "/Game/ModularHome/LT52A/Sequences/Review"
STATUS_PATH = Path(r"C:\3d\tmp\lt52a_mrq_batch_status.json")
REQUEST_PATH = Path(r"C:\3d\tmp\lt52a_mrq_batch_request.json")
DEFAULT_OUTPUT_DIR_ROOT = r"C:\Users\esauk\OneDrive\Documents\Unreal Projects\LT52A_ModularHome_Unreal_POC\Saved\MRQCaptures\LT52A\review_batch\default"
OUTPUT_DIR_ROOT = DEFAULT_OUTPUT_DIR_ROOT
OUTPUT_RESOLUTION = unreal.IntPoint(1920, 1080)
PRESET_NAME = "default"

SubsystemExecutor = None
RenderedFiles = []
RenderFinished = False
TickHandle = None
ExpectedJobs = []


def write_status(payload: dict):
    STATUS_PATH.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def write_progress(phase: str, **extra):
    payload = {
        "generatedAt": datetime.now().isoformat(),
        "preset": PRESET_NAME,
        "outputDirRoot": OUTPUT_DIR_ROOT,
        "resolution": {"width": OUTPUT_RESOLUTION.x, "height": OUTPUT_RESOLUTION.y},
        "phase": phase,
        "renderStarted": False,
        "renderFinished": False,
        "expectedJobs": ExpectedJobs,
        "files": RenderedFiles,
        "fileCount": len(RenderedFiles),
        "errors": [],
    }
    payload.update(extra)
    write_status(payload)


def load_request():
    global OUTPUT_DIR_ROOT, OUTPUT_RESOLUTION, PRESET_NAME
    if not REQUEST_PATH.exists():
        return
    request = json.loads(REQUEST_PATH.read_text(encoding="utf-8-sig"))
    OUTPUT_DIR_ROOT = request.get("outputDirRoot", DEFAULT_OUTPUT_DIR_ROOT)
    width = int(request.get("width", 1920))
    height = int(request.get("height", 1080))
    OUTPUT_RESOLUTION = unreal.IntPoint(width, height)
    PRESET_NAME = str(request.get("preset", "default"))


def set_prop_safe(target, prop, value):
    try:
        target.set_editor_property(prop, value)
        return True
    except Exception as exc:
        unreal.log_warning(f"[LT52A-MRQ-BATCH] Could not set {prop}: {exc}")
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


def find_target_center(*keywords: str):
    matches = []
    lowered = [keyword.lower() for keyword in keywords]
    for actor in unreal.EditorLevelLibrary.get_all_level_actors():
        label = actor.get_actor_label().lower()
        if not label.startswith("lt52a_"):
            continue
        if not all(keyword in label for keyword in lowered):
            continue
        origin, extent = actor.get_actor_bounds(False)
        matches.append(origin)
    if not matches:
        return None
    return unreal.Vector(
        sum(v.x for v in matches) / len(matches),
        sum(v.y for v in matches) / len(matches),
        sum(v.z for v in matches) / len(matches),
    )


def make_look_at_rotation(location: unreal.Vector, target: unreal.Vector):
    dx = target.x - location.x
    dy = target.y - location.y
    dz = target.z - location.z
    yaw = math.degrees(math.atan2(dy, dx))
    horizontal = math.sqrt((dx * dx) + (dy * dy))
    pitch = math.degrees(math.atan2(dz, horizontal))
    return unreal.Rotator(pitch=pitch, yaw=yaw, roll=0.0)


def set_actor_hidden_by_label_prefixes(prefixes, hidden: bool):
    lowered = [prefix.lower() for prefix in prefixes]
    for actor in unreal.EditorLevelLibrary.get_all_level_actors():
        label = actor.get_actor_label().lower()
        if any(label.startswith(prefix) for prefix in lowered):
            try:
                actor.set_is_temporarily_hidden_in_editor(hidden)
            except Exception:
                pass
            try:
                actor.set_actor_hidden_in_game(hidden)
            except Exception:
                pass


def set_actor_hidden_by_label_contains(tokens, hidden: bool):
    lowered = [token.lower() for token in tokens]
    for actor in unreal.EditorLevelLibrary.get_all_level_actors():
        label = actor.get_actor_label().lower()
        if any(token in label for token in lowered):
            try:
                actor.set_is_temporarily_hidden_in_editor(hidden)
            except Exception:
                pass
            try:
                actor.set_actor_hidden_in_game(hidden)
            except Exception:
                pass


def apply_review_visibility_overrides():
    # Hide stage walls and interior helper masses that make review unreadable.
    set_actor_hidden_by_label_prefixes(
        [
            "lt52a_showroom_backdrop",
            "lt52a_showroom_leftwing",
            "lt52a_showroom_rightwing",
            "lt52a_roomvolume_",
            "lt52a_roommarker_",
            "lt52a_ceilingraft_",
            "lt52a_opening_",
        ],
        True,
    )


def apply_interior_cutaway_visibility_overrides():
    apply_review_visibility_overrides()
    set_actor_hidden_by_label_contains(
        [
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
        ],
        True,
    )


def get_existing_camera(label: str):
    for actor in unreal.EditorLevelLibrary.get_all_level_actors():
        if actor.get_actor_label() == label:
            return actor
    return None


def build_review_specs():
    return [
        {"label": "LT52A_Camera_Exterior", "sequence": "LT52A_Review_Exterior", "map": LEVEL_PATH, "output_subdir": "01-exterior"},
        {"label": "LT52A_Camera_Overview", "sequence": "LT52A_Review_Overview", "map": LEVEL_PATH, "output_subdir": "02-overview"},
        {"label": "LT52A_Camera_Terrace", "sequence": "LT52A_Review_Terrace", "map": LEVEL_PATH, "output_subdir": "03-terrace"},
        {"label": "LT52A_Camera_Living", "sequence": "LT52A_Review_Living", "map": INTERIOR_LEVEL_PATH, "output_subdir": "04-living"},
        {"label": "LT52A_Camera_Kitchen", "sequence": "LT52A_Review_Kitchen", "map": INTERIOR_LEVEL_PATH, "output_subdir": "05-kitchen"},
        {"label": "LT52A_Camera_Bedroom", "sequence": "LT52A_Review_Bedroom", "map": INTERIOR_LEVEL_PATH, "output_subdir": "06-bedroom"},
        {"label": "LT52A_Camera_Bathroom", "sequence": "LT52A_Review_Bathroom", "map": INTERIOR_LEVEL_PATH, "output_subdir": "07-bathroom"},
        {"label": "LT52A_Camera_Technical", "sequence": "LT52A_Review_Technical", "map": INTERIOR_LEVEL_PATH, "output_subdir": "08-technical"},
    ]


def create_sequence(sequence_name: str, camera_actor):
    asset_tools = unreal.AssetToolsHelpers.get_asset_tools()
    sequence_asset_path = f"{SEQUENCE_PACKAGE_PATH}/{sequence_name}"
    if unreal.EditorAssetLibrary.does_asset_exist(sequence_asset_path):
        unreal.EditorAssetLibrary.delete_asset(sequence_asset_path)

    sequence = asset_tools.create_asset(
        sequence_name,
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


def build_status(success: bool | None):
    return {
        "generatedAt": datetime.now().isoformat(),
        "preset": PRESET_NAME,
        "outputDirRoot": OUTPUT_DIR_ROOT,
        "resolution": {"width": OUTPUT_RESOLUTION.x, "height": OUTPUT_RESOLUTION.y},
        "renderStarted": True,
        "renderFinished": bool(success) if success is not None else False,
        "expectedJobs": ExpectedJobs,
        "files": RenderedFiles,
        "fileCount": len(RenderedFiles),
        "errors": [],
    }


def on_queue_finished_callback(executor, success):
    global SubsystemExecutor, RenderFinished, TickHandle
    RenderFinished = True
    write_status(build_status(bool(success)))
    unreal.log(f"[LT52A-MRQ-BATCH] finished success={success} files={len(RenderedFiles)}")
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
                unreal.log(f"[LT52A-MRQ-BATCH] file={file}")


def tick_keepalive(delta_seconds):
    if RenderFinished:
        return


def configure_job(job, map_path: str, sequence_asset_path: str, job_name: str, output_subdir: str):
    job.job_name = job_name
    job.map = unreal.SoftObjectPath(map_path)
    job.sequence = unreal.SoftObjectPath(sequence_asset_path)

    config = job.get_configuration()
    output_setting = config.find_or_add_setting_by_class(unreal.MoviePipelineOutputSetting)
    output_setting.output_resolution = OUTPUT_RESOLUTION
    output_setting.output_directory = unreal.DirectoryPath(str(Path(OUTPUT_DIR_ROOT) / output_subdir))
    output_setting.flush_disk_writes_per_shot = True
    output_setting.override_existing_output = True
    set_prop_safe(output_setting, "file_name_format", "frame_{frame_number}")

    render_pass = config.find_or_add_setting_by_class(unreal.MoviePipelineDeferredPassBase)
    set_prop_safe(render_pass, "disable_multisample_effects", True)
    config.find_or_add_setting_by_class(unreal.MoviePipelineImageSequenceOutput_PNG)


def main():
    global SubsystemExecutor, TickHandle, ExpectedJobs, RenderedFiles, RenderFinished
    RenderedFiles = []
    RenderFinished = False
    load_request()
    write_progress("startup")

    review_specs = []
    write_progress("load_showroom_start", map=LEVEL_PATH)
    unreal.EditorLevelLibrary.load_level(LEVEL_PATH)
    apply_review_visibility_overrides()
    review_specs.extend(build_review_specs()[:3])
    write_progress("load_showroom_done", map=LEVEL_PATH, specCount=len(review_specs))
    write_progress("load_interior_start", map=INTERIOR_LEVEL_PATH)
    unreal.EditorLevelLibrary.load_level(INTERIOR_LEVEL_PATH)
    apply_interior_cutaway_visibility_overrides()
    review_specs.extend(build_review_specs()[3:])
    ExpectedJobs = [spec["sequence"] for spec in review_specs]
    write_progress("load_interior_done", map=INTERIOR_LEVEL_PATH, specCount=len(review_specs))

    write_status(
        {
            "generatedAt": datetime.now().isoformat(),
            "preset": PRESET_NAME,
            "outputDirRoot": OUTPUT_DIR_ROOT,
            "resolution": {"width": OUTPUT_RESOLUTION.x, "height": OUTPUT_RESOLUTION.y},
            "renderStarted": False,
            "renderFinished": False,
            "expectedJobs": ExpectedJobs,
            "files": [],
            "fileCount": 0,
            "errors": [],
        }
    )

    subsystem = unreal.get_editor_subsystem(unreal.MoviePipelineQueueSubsystem)
    queue = subsystem.get_queue()
    queue.delete_all_jobs()
    write_progress("queue_initialized")

    for spec in review_specs:
        write_progress("job_prepare_start", job=spec["sequence"], map=spec["map"])
        unreal.EditorLevelLibrary.load_level(spec["map"])
        if spec["map"] == INTERIOR_LEVEL_PATH:
            apply_interior_cutaway_visibility_overrides()
        else:
            apply_review_visibility_overrides()
        camera_actor = get_existing_camera(spec["label"])
        if camera_actor is None:
            raise RuntimeError(f"Missing review camera in map {spec['map']}: {spec['label']}")
        sequence_asset_path = create_sequence(spec["sequence"], camera_actor)
        job = queue.allocate_new_job(unreal.MoviePipelineExecutorJob)
        configure_job(job, spec["map"], sequence_asset_path, spec["sequence"], spec["output_subdir"])
        write_progress("job_prepare_done", job=spec["sequence"], map=spec["map"])

    TickHandle = unreal.register_slate_post_tick_callback(tick_keepalive)
    SubsystemExecutor = unreal.MoviePipelinePIEExecutor()
    SubsystemExecutor.on_executor_finished_delegate.add_callable_unique(on_queue_finished_callback)
    SubsystemExecutor.on_individual_shot_work_finished_delegate.add_callable_unique(on_individual_shot_finished_callback)
    subsystem.render_queue_with_executor_instance(SubsystemExecutor)

    write_status(build_status(None))
    unreal.log(f"[LT52A-MRQ-BATCH] queued jobs={len(ExpectedJobs)}")


if __name__ == "__main__":
    main()
