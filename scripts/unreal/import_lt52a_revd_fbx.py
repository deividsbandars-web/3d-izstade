from datetime import datetime
from pathlib import Path
import math

import unreal


PROJECT_TAG = "LT52A_RevD_Auto"
ROOT = Path(r"C:\Users\esauk\OneDrive\Documents\Unreal Projects\LT52A_ModularHome_Unreal_POC")
SOURCE_FBX = Path(r"C:\Users\esauk\OneDrive\Documents\Blender\LT52A\exports\LT52A_VariantA_RevD_BaseShell.fbx")
LEVEL_PATH = "/Game/ModularHome/LT52A/Maps/LT52A_Showroom"
INTERIOR_LEVEL_PATH = "/Game/ModularHome/LT52A/Maps/LT52A_InteriorCutaway"
MESH_DEST = "/Game/ModularHome/LT52A/Meshes/RevD"
MAT_DEST = "/Game/ModularHome/LT52A/Materials"
DOCS_DISK = ROOT / "Content" / "ModularHome" / "LT52A" / "Documentation"
STATUS_DISK = DOCS_DISK / "IMPORT_STATUS_REVD.md"

RESULT = {
    "fbx_found": SOURCE_FBX.exists(),
    "model_imported": False,
    "level_updated": False,
    "mesh_count": 0,
    "errors": [],
}


def log_error(message: str) -> None:
    RESULT["errors"].append(message)
    unreal.log_error(f"[LT52A-RevD] {message}")


def set_prop_safe(target, prop, value):
    try:
        target.set_editor_property(prop, value)
        return True
    except Exception as exc:
        unreal.log_warning(f"[LT52A-RevD] Could not set {prop}: {exc}")
        return False


def ensure_asset_dir(path: str) -> None:
    unreal.EditorAssetLibrary.make_directory(path)


def list_assets(path: str) -> list[str]:
    if not unreal.EditorAssetLibrary.does_directory_exist(path):
        return []
    return unreal.EditorAssetLibrary.list_assets(path, recursive=True, include_folder=False)


def ensure_material_instance(name, color):
    ensure_asset_dir(MAT_DEST)
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
        set_prop_safe(material, "parent", parent)
        for param in ["Color", "BaseColor"]:
            try:
                unreal.MaterialEditingLibrary.set_material_instance_vector_parameter_value(material, param, color)
            except Exception:
                pass
        unreal.EditorAssetLibrary.save_loaded_asset(material)
    return material


def build_materials():
    return {
        "M_Wood_Exterior": ensure_material_instance("M_Wood_Exterior", unreal.LinearColor(0.56, 0.42, 0.28, 1.0)),
        "M_Wood_Cladding": ensure_material_instance("M_Wood_Cladding", unreal.LinearColor(0.39, 0.28, 0.18, 1.0)),
        "M_Wood_Interior": ensure_material_instance("M_Wood_Interior", unreal.LinearColor(0.78, 0.69, 0.56, 1.0)),
        "M_Glass": ensure_material_instance("M_Glass", unreal.LinearColor(0.60, 0.80, 0.90, 1.0)),
        "M_Roof_Dark": ensure_material_instance("M_Roof_Dark", unreal.LinearColor(0.12, 0.12, 0.13, 1.0)),
        "M_Floor_Wood": ensure_material_instance("M_Floor_Wood", unreal.LinearColor(0.46, 0.33, 0.22, 1.0)),
        "M_Terrace_Wood": ensure_material_instance("M_Terrace_Wood", unreal.LinearColor(0.45, 0.31, 0.20, 1.0)),
        "M_Metal_Dark": ensure_material_instance("M_Metal_Dark", unreal.LinearColor(0.18, 0.18, 0.18, 1.0)),
        "M_Trim_Wood": ensure_material_instance("M_Trim_Wood", unreal.LinearColor(0.22, 0.18, 0.14, 1.0)),
        "M_Zone_Living": ensure_material_instance("M_Zone_Living", unreal.LinearColor(0.63, 0.49, 0.31, 1.0)),
        "M_Zone_Bedroom": ensure_material_instance("M_Zone_Bedroom", unreal.LinearColor(0.55, 0.44, 0.36, 1.0)),
        "M_Zone_Bathroom": ensure_material_instance("M_Zone_Bathroom", unreal.LinearColor(0.36, 0.49, 0.56, 1.0)),
        "M_Zone_Technical": ensure_material_instance("M_Zone_Technical", unreal.LinearColor(0.42, 0.42, 0.38, 1.0)),
        "M_Kitchen_Surface": ensure_material_instance("M_Kitchen_Surface", unreal.LinearColor(0.52, 0.50, 0.46, 1.0)),
        "M_Showroom_Wall": ensure_material_instance("M_Showroom_Wall", unreal.LinearColor(0.90, 0.88, 0.84, 1.0)),
        "M_Showroom_Platform": ensure_material_instance("M_Showroom_Platform", unreal.LinearColor(0.22, 0.21, 0.20, 1.0)),
        "M_Showroom_Accent": ensure_material_instance("M_Showroom_Accent", unreal.LinearColor(0.92, 0.74, 0.44, 1.0)),
    }


def guess_material(mesh_name: str, materials):
    name = mesh_name.lower()
    if "zone_living" in name or "roommarker_living" in name or "roommarker_living_kitchen" in name:
        return materials["M_Zone_Living"]
    if "zone_bedroom" in name or "roommarker_bedroom" in name:
        return materials["M_Zone_Bedroom"]
    if "zone_bath" in name or "roommarker_bath" in name:
        return materials["M_Zone_Bathroom"]
    if "zone_technical" in name or "roommarker_technical" in name or "roommarker_storage" in name:
        return materials["M_Zone_Technical"]
    if "roomvolume_living" in name or "roomvolume_living_kitchen" in name:
        return materials["M_Zone_Living"]
    if "roomvolume_bedroom" in name:
        return materials["M_Zone_Bedroom"]
    if "roomvolume_bath" in name:
        return materials["M_Zone_Bathroom"]
    if "roomvolume_technical" in name:
        return materials["M_Zone_Technical"]
    if "skylightstrip" in name:
        return materials["M_Glass"]
    if "glasspane" in name or "shower_glass" in name or "mirror" in name:
        return materials["M_Glass"]
    if "facadeboard" in name:
        return materials["M_Wood_Cladding"]
    if "trim_" in name or "cornertrim" in name:
        return materials["M_Trim_Wood"]
    if "kitchen_" in name or "tallunit" in name or "island" in name:
        return materials["M_Kitchen_Surface"]
    if "frame" in name:
        return materials["M_Metal_Dark"]
    if "seam" in name:
        return materials["M_Wood_Interior"]
    if "roof" in name:
        return materials["M_Roof_Dark"]
    if "terrace" in name:
        return materials["M_Terrace_Wood"]
    if "opening" in name:
        return materials["M_Glass"]
    if "kitchen" in name or "sofa" in name or "bed" in name or "dining" in name or "wardrobe" in name or "tv" in name:
        return materials["M_Wood_Interior"]
    if "vanity" in name:
        return materials["M_Wood_Interior"]
    if "floor" in name:
        return materials["M_Floor_Wood"]
    if "room" in name or "interior" in name:
        return materials["M_Wood_Interior"]
    if "wall" in name:
        return materials["M_Wood_Exterior"]
    return materials["M_Wood_Exterior"]


def apply_mesh_material(actor, material):
    if not material:
        return
    comp = actor.get_component_by_class(unreal.StaticMeshComponent)
    if not comp:
        return
    slots = 1
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


def import_fbx():
    if not SOURCE_FBX.exists():
        raise RuntimeError(f"FBX file not found: {SOURCE_FBX}")

    ensure_asset_dir(MESH_DEST)
    existing_assets = list_assets(MESH_DEST)
    if existing_assets:
        for asset_path in existing_assets:
            unreal.EditorAssetLibrary.delete_asset(asset_path)

    task = unreal.AssetImportTask()
    task.set_editor_property("filename", str(SOURCE_FBX))
    task.set_editor_property("destination_path", MESH_DEST)
    task.set_editor_property("automated", True)
    task.set_editor_property("replace_existing", True)
    task.set_editor_property("save", True)

    options = unreal.FbxImportUI()
    options.set_editor_property("import_mesh", True)
    options.set_editor_property("import_textures", False)
    options.set_editor_property("import_materials", False)
    options.set_editor_property("import_as_skeletal", False)
    options.set_editor_property("mesh_type_to_import", unreal.FBXImportType.FBXIT_STATIC_MESH)
    static_data = options.static_mesh_import_data
    static_data.set_editor_property("combine_meshes", False)
    static_data.set_editor_property("generate_lightmap_u_vs", True)
    static_data.set_editor_property("auto_generate_collision", True)
    task.set_editor_property("options", options)

    unreal.AssetToolsHelpers.get_asset_tools().import_asset_tasks([task])

    after = set(list_assets(MESH_DEST))
    candidates = sorted(set(task.get_editor_property("imported_object_paths") or []) | set(after))
    mesh_paths = []
    for asset_path in candidates:
        asset = unreal.EditorAssetLibrary.load_asset(asset_path)
        if isinstance(asset, unreal.StaticMesh) or (asset and asset.get_class().get_name() == "StaticMesh"):
            mesh_paths.append(asset_path)
    mesh_paths = sorted(set(mesh_paths))
    if not mesh_paths:
        raise RuntimeError("FBX import completed, but no StaticMesh assets were found.")

    RESULT["model_imported"] = True
    RESULT["mesh_count"] = len(mesh_paths)
    return mesh_paths


def clear_previous_generated_actors():
    removed = 0
    for actor in unreal.EditorLevelLibrary.get_all_level_actors():
        tags = [str(tag) for tag in getattr(actor, "tags", [])]
        label = actor.get_actor_label().lower()
        if PROJECT_TAG in tags or "lt52a_" in label:
            unreal.EditorLevelLibrary.destroy_actor(actor)
            removed += 1
    unreal.log(f"[LT52A-RevD] Removed {removed} previous LT52A showroom actors.")


def tag_actor(actor):
    actor.tags = [PROJECT_TAG]


def spawn_actor(actor_class, label, location, rotation=None, scale=None):
    rotation = rotation or unreal.Rotator(0, 0, 0)
    actor = unreal.EditorLevelLibrary.spawn_actor_from_class(actor_class, location, rotation)
    actor.set_actor_label(label)
    tag_actor(actor)
    if scale:
        actor.set_actor_scale3d(scale)
    return actor


def load_asset(path):
    return unreal.EditorAssetLibrary.load_asset(path)


def add_showroom_architecture(origin, extent, materials):
    cube = load_asset("/Engine/BasicShapes/Cube.Cube")
    if not cube:
        return

    def stage_block(label, location, scale, material, rotation=None):
        actor = spawn_actor(unreal.StaticMeshActor, label, location, rotation=rotation, scale=scale)
        comp = actor.get_component_by_class(unreal.StaticMeshComponent)
        comp.set_static_mesh(cube)
        comp.set_material(0, material)
        return actor

    stage_block(
        "LT52A_Showroom_Platform",
        unreal.Vector(origin.x, origin.y, -6),
        unreal.Vector(max(18.0, (extent.x * 2 + 2200) / 100.0), max(16.0, (extent.y * 2 + 1800) / 100.0), 0.14),
        materials["M_Showroom_Platform"],
    )
    stage_block(
        "LT52A_Showroom_Backdrop",
        unreal.Vector(origin.x + extent.x + 1100, origin.y, extent.z * 0.58),
        unreal.Vector(0.10, max(14.0, (extent.y * 2 + 1200) / 100.0), max(4.8, (extent.z * 2 + 120) / 100.0)),
        materials["M_Showroom_Wall"],
    )
    stage_block(
        "LT52A_Showroom_LeftWing",
        unreal.Vector(origin.x + extent.x * 0.25, origin.y - extent.y - 1450, extent.z * 0.24),
        unreal.Vector(max(9.0, (extent.x * 2 + 600) / 100.0), 0.08, max(1.8, (extent.z * 2 - 120) / 100.0)),
        materials["M_Showroom_Accent"],
    )
    stage_block(
        "LT52A_Showroom_RightWing",
        unreal.Vector(origin.x + extent.x * 0.25, origin.y + extent.y + 1450, extent.z * 0.24),
        unreal.Vector(max(9.0, (extent.x * 2 + 600) / 100.0), 0.08, max(1.8, (extent.z * 2 - 120) / 100.0)),
        materials["M_Showroom_Accent"],
    )


def add_light_rig(origin, extent):
    directional = spawn_actor(
        unreal.DirectionalLight,
        "LT52A_DirectionalLight",
        unreal.Vector(origin.x - 1600, origin.y - 1200, extent.z + 2200),
        rotation=unreal.Rotator(pitch=-33.0, yaw=28.0, roll=0.0),
    )
    dcomp = directional.get_component_by_class(unreal.DirectionalLightComponent)
    set_prop_safe(dcomp, "intensity", 22.0)
    set_prop_safe(dcomp, "light_color", unreal.Color(255, 244, 229, 255))

    skylight = spawn_actor(unreal.SkyLight, "LT52A_SkyLight", unreal.Vector(origin.x, origin.y, extent.z + 800))
    scomp = skylight.get_component_by_class(unreal.SkyLightComponent)
    set_prop_safe(scomp, "intensity", 4.5)
    set_prop_safe(scomp, "real_time_capture", True)

    if hasattr(unreal, "SkyAtmosphere"):
        spawn_actor(unreal.SkyAtmosphere, "LT52A_SkyAtmosphere", unreal.Vector(0, 0, 0))
    if hasattr(unreal, "ExponentialHeightFog"):
        fog = spawn_actor(unreal.ExponentialHeightFog, "LT52A_Fog", unreal.Vector(0, 0, 0))
        fcomp = fog.get_component_by_class(unreal.ExponentialHeightFogComponent)
        set_prop_safe(fcomp, "fog_density", 0.0008)
        set_prop_safe(fcomp, "fog_height_falloff", 0.22)

    for suffix, offset_y in [("A", -extent.y * 0.7), ("B", extent.y * 0.7)]:
        rect = spawn_actor(
            unreal.RectLight,
            f"LT52A_RectLight_{suffix}",
            unreal.Vector(origin.x - extent.x * 0.15, origin.y + offset_y, extent.z + 720),
            rotation=unreal.Rotator(pitch=-55.0, yaw=0.0, roll=0.0),
        )
        rcomp = rect.get_component_by_class(unreal.RectLightComponent)
        set_prop_safe(rcomp, "intensity", 40000.0)
        set_prop_safe(rcomp, "source_width", 2600.0)
        set_prop_safe(rcomp, "source_height", 720.0)
        set_prop_safe(rcomp, "light_color", unreal.Color(255, 247, 238, 255))

    point = spawn_actor(
        unreal.PointLight,
        "LT52A_InteriorFill",
        unreal.Vector(origin.x + extent.x * 0.06, origin.y, max(240.0, extent.z * 0.64)),
    )
    pcomp = point.get_component_by_class(unreal.PointLightComponent)
    set_prop_safe(pcomp, "intensity", 18000.0)
    set_prop_safe(pcomp, "attenuation_radius", 3200.0)
    set_prop_safe(pcomp, "light_color", unreal.Color(255, 242, 226, 255))


def add_post_process(origin):
    actor = spawn_actor(unreal.PostProcessVolume, "LT52A_PostProcess", origin)
    set_prop_safe(actor, "b_unbound", True)
    comp = actor.get_component_by_class(unreal.PostProcessComponent)
    if comp:
        settings = comp.get_editor_property("settings")
        try:
            settings.auto_exposure_method = unreal.AutoExposureMethod.AEM_HISTOGRAM
        except Exception:
            pass
        try:
            settings.auto_exposure_bias = 2.5
            settings.camera_iso = 200.0
            settings.camera_shutter_speed = 30.0
            settings.depth_of_field_fstop = 8.0
            settings.motion_blur_amount = 0.0
            settings.bloom_intensity = 0.2
        except Exception:
            pass
        try:
            comp.set_editor_property("settings", settings)
        except Exception:
            pass


def find_target_center(*keywords):
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


def make_look_at_rotation(location, target):
    dx = target.x - location.x
    dy = target.y - location.y
    dz = target.z - location.z
    yaw = math.degrees(math.atan2(dy, dx))
    horizontal = math.sqrt((dx * dx) + (dy * dy))
    pitch = math.degrees(math.atan2(dz, horizontal))
    return unreal.Rotator(pitch=pitch, yaw=yaw, roll=0.0)


def setup_level(mesh_paths):
    ensure_asset_dir("/Game/ModularHome/LT52A/Maps")
    if unreal.EditorAssetLibrary.does_asset_exist(LEVEL_PATH):
        unreal.EditorLevelLibrary.load_level(LEVEL_PATH)
    else:
        unreal.EditorLevelLibrary.new_level(LEVEL_PATH)
        unreal.EditorLevelLibrary.load_level(LEVEL_PATH)

    clear_previous_generated_actors()
    materials = build_materials()
    model_actors = []
    min_v = unreal.Vector(-600, -300, 0)
    max_v = unreal.Vector(600, 300, 400)

    for mesh_path in mesh_paths:
        mesh = unreal.EditorAssetLibrary.load_asset(mesh_path)
        if not mesh:
            continue
        actor = spawn_actor(unreal.StaticMeshActor, f"LT52A_{mesh.get_name()}", unreal.Vector(0, 0, 0))
        comp = actor.get_component_by_class(unreal.StaticMeshComponent)
        comp.set_static_mesh(mesh)
        apply_mesh_material(actor, guess_material(mesh.get_name(), materials))
        model_actors.append(actor)

    if model_actors:
        mins = []
        maxs = []
        for actor in model_actors:
            origin, extent = actor.get_actor_bounds(False)
            mins.append(unreal.Vector(origin.x - extent.x, origin.y - extent.y, origin.z - extent.z))
            maxs.append(unreal.Vector(origin.x + extent.x, origin.y + extent.y, origin.z + extent.z))
        min_v = unreal.Vector(min(v.x for v in mins), min(v.y for v in mins), min(v.z for v in mins))
        max_v = unreal.Vector(max(v.x for v in maxs), max(v.y for v in maxs), max(v.z for v in maxs))
        center = unreal.Vector((min_v.x + max_v.x) * 0.5, (min_v.y + max_v.y) * 0.5, (min_v.z + max_v.z) * 0.5)
        delta = unreal.Vector(-center.x, -center.y, -min_v.z)
        for actor in model_actors:
            actor.set_actor_location(actor.get_actor_location() + delta, False, False)
        min_v = unreal.Vector(min_v.x + delta.x, min_v.y + delta.y, min_v.z + delta.z)
        max_v = unreal.Vector(max_v.x + delta.x, max_v.y + delta.y, max_v.z + delta.z)

    origin = unreal.Vector((min_v.x + max_v.x) * 0.5, (min_v.y + max_v.y) * 0.5, (min_v.z + max_v.z) * 0.5)
    extent = unreal.Vector(max((max_v.x - min_v.x) * 0.5, 600), max((max_v.y - min_v.y) * 0.5, 300), max((max_v.z - min_v.z) * 0.5, 200))

    add_showroom_architecture(origin, extent, materials)
    add_light_rig(origin, extent)
    add_post_process(origin)

    living_target = unreal.Vector(origin.x - 90.0, origin.y - 20.0, 125.0)
    exterior_target = unreal.Vector(origin.x, origin.y, 120.0)
    overview_target = unreal.Vector(origin.x, origin.y, 120.0)
    exterior_location = unreal.Vector(origin.x - 1450.0, origin.y - 920.0, 280.0)
    interior_location = unreal.Vector(origin.x - 420.0, origin.y - 120.0, 165.0)
    overview_location = unreal.Vector(origin.x - 900.0, origin.y - 760.0, 680.0)

    ext_cam = spawn_actor(
        unreal.CameraActor,
        "LT52A_Camera_Exterior",
        exterior_location,
        rotation=make_look_at_rotation(exterior_location, exterior_target),
    )
    int_cam = spawn_actor(
        unreal.CameraActor,
        "LT52A_Camera_Interior",
        interior_location,
        rotation=make_look_at_rotation(interior_location, living_target),
    )
    top_cam = spawn_actor(
        unreal.CameraActor,
        "LT52A_Camera_Overview",
        overview_location,
        rotation=make_look_at_rotation(overview_location, overview_target),
    )
    for cam in [ext_cam, int_cam, top_cam]:
        ccomp = cam.get_component_by_class(unreal.CameraComponent)
        set_prop_safe(ccomp, "field_of_view", 48.0)

    if hasattr(unreal, "PlayerStart"):
        spawn_actor(
            unreal.PlayerStart,
            "LT52A_PlayerStart",
            unreal.Vector(origin.x - extent.x - 320, origin.y + 80, 130),
            rotation=unreal.Rotator(pitch=0.0, yaw=8.0, roll=0.0),
        )

    unreal.EditorLevelLibrary.save_current_level()
    RESULT["level_updated"] = True

    # Build a separate interior cutaway map for readable room review.
    if unreal.EditorAssetLibrary.does_asset_exist(INTERIOR_LEVEL_PATH):
        unreal.EditorAssetLibrary.delete_asset(INTERIOR_LEVEL_PATH)
    unreal.EditorLevelLibrary.load_level(LEVEL_PATH)
    world = unreal.EditorLevelLibrary.get_editor_world()
    unreal.EditorLoadingAndSavingUtils.save_map(world, INTERIOR_LEVEL_PATH)
    unreal.EditorLevelLibrary.load_level(INTERIOR_LEVEL_PATH)
    cutaway_tokens = [
        "roof_",
        "roofedge_",
        "skylightstrip",
        "exteriorwalls",
        "northwall_",
        "southwall_",
        "eastwall_",
        "westwall_",
        "facadeboard_",
        "facadecornertrim_",
        "frame_",
        "glasspane_",
        "opening_",
        "showroom_",
    ]
    for actor in unreal.EditorLevelLibrary.get_all_level_actors():
        label = actor.get_actor_label().lower()
        if not label.startswith("lt52a_"):
            continue
        if any(token in label for token in cutaway_tokens):
            unreal.EditorLevelLibrary.destroy_actor(actor)
    unreal.EditorLevelLibrary.save_current_level()
    unreal.EditorLevelLibrary.load_level(LEVEL_PATH)


def write_status():
    DOCS_DISK.mkdir(parents=True, exist_ok=True)
    status = [
        "# LT52A Rev D FBX Import Status",
        f"- generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
        f"- FBX found: {'YES' if RESULT['fbx_found'] else 'NO'}",
        f"- model imported: {'YES' if RESULT['model_imported'] else 'NO'}",
        f"- mesh count: {RESULT['mesh_count']}",
        f"- level updated: {'YES' if RESULT['level_updated'] else 'NO'}",
    ]
    if RESULT["errors"]:
        status.append("- errors:")
        status.extend([f"  - {item}" for item in RESULT["errors"]])
    else:
        status.append("- errors: none")
    STATUS_DISK.write_text("\n".join(status), encoding="utf-8")


def main():
    try:
        mesh_paths = import_fbx()
        setup_level(mesh_paths)
    except Exception as exc:
        log_error(str(exc))
        raise
    finally:
        write_status()


if __name__ == "__main__":
    main()
