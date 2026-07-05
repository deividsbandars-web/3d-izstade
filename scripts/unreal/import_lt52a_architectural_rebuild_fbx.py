from datetime import datetime
from pathlib import Path
import math

import unreal


PROJECT_TAG = "LT52A_ArchitecturalRebuild"
ROOT = Path(r"C:\Unreal\LT52A_ModularHome_Unreal_POC_Recovery")
SOURCE_FBX = Path(r"C:\Users\esauk\OneDrive\Documents\Blender\LT52A\exports\LT52A_Architectural_Rebuild.fbx")
LEVEL_PATH = "/Game/ModularHome/LT52A/Maps/LT52A_Showroom"
MESH_DEST = "/Game/ModularHome/LT52A/Meshes/ArchitecturalRebuild"
MAT_DEST = "/Game/ModularHome/LT52A/Materials"
DOCS_DISK = ROOT / "Content" / "ModularHome" / "LT52A" / "Documentation"
STATUS_DISK = DOCS_DISK / "IMPORT_STATUS_ARCH_REBUILD.md"

RESULT = {
    "fbx_found": SOURCE_FBX.exists(),
    "model_imported": False,
    "level_updated": False,
    "mesh_count": 0,
    "errors": [],
}


def log_error(message: str) -> None:
    RESULT["errors"].append(message)
    unreal.log_error(f"[LT52A-Arch] {message}")


def set_prop_safe(target, prop, value):
    try:
        target.set_editor_property(prop, value)
        return True
    except Exception as exc:
        unreal.log_warning(f"[LT52A-Arch] Could not set {prop}: {exc}")
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
        "plinth": ensure_material_instance("M_LT52A_Plinth_Dark", unreal.LinearColor(0.12, 0.12, 0.12, 1.0)),
        "membrane": ensure_material_instance("M_LT52A_Membrane_Dark", unreal.LinearColor(0.17, 0.17, 0.16, 1.0)),
        "primary": ensure_material_instance("M_LT52A_Primary_Timber", unreal.LinearColor(0.43, 0.31, 0.19, 1.0)),
        "stud": ensure_material_instance("M_LT52A_Stud_Timber", unreal.LinearColor(0.55, 0.41, 0.24, 1.0)),
        "insulation": ensure_material_instance("M_LT52A_Insulation_Yellow", unreal.LinearColor(0.88, 0.76, 0.22, 1.0)),
        "batten": ensure_material_instance("M_LT52A_Batten_Dark", unreal.LinearColor(0.24, 0.19, 0.12, 1.0)),
        "cladding": ensure_material_instance("M_LT52A_Cladding_Wood", unreal.LinearColor(0.30, 0.22, 0.14, 1.0)),
        "roof": ensure_material_instance("M_LT52A_Roof_Dark", unreal.LinearColor(0.10, 0.10, 0.11, 1.0)),
        "glass": ensure_material_instance("M_LT52A_Glass", unreal.LinearColor(0.62, 0.78, 0.86, 1.0)),
    }


def guess_material(mesh_name: str, materials):
    name = mesh_name.lower()
    if "plinth" in name:
        return materials["plinth"]
    if "insulation" in name:
        return materials["insulation"]
    if "corner_post" in name or "_post_" in name or "header" in name:
        return materials["primary"]
    if "stud" in name:
        return materials["stud"]
    if "batten" in name:
        return materials["batten"]
    if "cladding" in name:
        return materials["cladding"]
    if "roof" in name:
        return materials["roof"]
    if "glass" in name or "slider" in name or "window" in name:
        return materials["glass"]
    return materials["membrane"]


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

    candidates = sorted(set(task.get_editor_property("imported_object_paths") or []) | set(list_assets(MESH_DEST)))
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


def make_look_at_rotation(location, target):
    dx = target.x - location.x
    dy = target.y - location.y
    dz = target.z - location.z
    yaw = math.degrees(math.atan2(dy, dx))
    horizontal = math.sqrt((dx * dx) + (dy * dy))
    pitch = math.degrees(math.atan2(dz, horizontal))
    return unreal.Rotator(pitch=pitch, yaw=yaw, roll=0.0)


def clear_previous_generated_actors():
    removed = 0
    for actor in unreal.EditorLevelLibrary.get_all_level_actors():
        tags = [str(tag) for tag in getattr(actor, "tags", [])]
        label = actor.get_actor_label().lower()
        if PROJECT_TAG in tags or label.startswith("lt52a_"):
            unreal.EditorLevelLibrary.destroy_actor(actor)
            removed += 1
    unreal.log(f"[LT52A-Arch] Removed {removed} prior LT52A actors.")


def load_asset(path):
    return unreal.EditorAssetLibrary.load_asset(path)


def add_light_rig(origin, extent):
    directional = spawn_actor(
        unreal.DirectionalLight,
        "LT52A_DirectionalLight",
        unreal.Vector(origin.x - 1600, origin.y - 1200, extent.z + 2200),
        rotation=unreal.Rotator(pitch=-34.0, yaw=34.0, roll=0.0),
    )
    dcomp = directional.get_component_by_class(unreal.DirectionalLightComponent)
    set_prop_safe(dcomp, "intensity", 12.0)
    set_prop_safe(dcomp, "light_color", unreal.Color(255, 246, 234, 255))

    skylight = spawn_actor(unreal.SkyLight, "LT52A_SkyLight", unreal.Vector(origin.x, origin.y, extent.z + 800))
    scomp = skylight.get_component_by_class(unreal.SkyLightComponent)
    set_prop_safe(scomp, "intensity", 1.7)
    set_prop_safe(scomp, "real_time_capture", True)

    if hasattr(unreal, "SkyAtmosphere"):
        spawn_actor(unreal.SkyAtmosphere, "LT52A_SkyAtmosphere", unreal.Vector(0, 0, 0))

    if hasattr(unreal, "ExponentialHeightFog"):
        fog = spawn_actor(unreal.ExponentialHeightFog, "LT52A_Fog", unreal.Vector(0, 0, 0))
        fcomp = fog.get_component_by_class(unreal.ExponentialHeightFogComponent)
        set_prop_safe(fcomp, "fog_density", 0.00055)
        set_prop_safe(fcomp, "fog_height_falloff", 0.18)


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
            settings.auto_exposure_bias = 0.35
            settings.motion_blur_amount = 0.0
            settings.bloom_intensity = 0.15
        except Exception:
            pass
        try:
            comp.set_editor_property("settings", settings)
        except Exception:
            pass


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

    for mesh_path in mesh_paths:
        mesh = unreal.EditorAssetLibrary.load_asset(mesh_path)
        if not mesh:
            continue
        actor = spawn_actor(unreal.StaticMeshActor, f"LT52A_{mesh.get_name()}", unreal.Vector(0, 0, 0))
        comp = actor.get_component_by_class(unreal.StaticMeshComponent)
        comp.set_static_mesh(mesh)
        apply_mesh_material(actor, guess_material(mesh.get_name(), materials))
        model_actors.append(actor)

    if not model_actors:
        raise RuntimeError("No imported LT52A actors were spawned into the level.")

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

    add_light_rig(origin, extent)
    add_post_process(origin)

    exterior_target = unreal.Vector(origin.x, origin.y, 150.0)
    overview_target = unreal.Vector(origin.x, origin.y, 140.0)
    terrace_target = unreal.Vector(origin.x + 200.0, origin.y - 120.0, 130.0)
    roof_target = unreal.Vector(origin.x, origin.y, extent.z + 40.0)

    ext_loc = unreal.Vector(origin.x - 1450.0, origin.y - 980.0, 280.0)
    overview_loc = unreal.Vector(origin.x - 980.0, origin.y - 780.0, 680.0)
    terrace_loc = unreal.Vector(origin.x + 420.0, origin.y - 1280.0, 220.0)
    roof_loc = unreal.Vector(origin.x - 180.0, origin.y - 220.0, extent.z + 980.0)

    cameras = [
        ("LT52A_Camera_Exterior", ext_loc, exterior_target, 46.0),
        ("LT52A_Camera_Overview", overview_loc, overview_target, 44.0),
        ("LT52A_Camera_Terrace", terrace_loc, terrace_target, 52.0),
        ("LT52A_Camera_Roof", roof_loc, roof_target, 38.0),
    ]
    for label, location, target, fov in cameras:
        cam = spawn_actor(unreal.CameraActor, label, location, rotation=make_look_at_rotation(location, target))
        ccomp = cam.get_component_by_class(unreal.CameraComponent)
        set_prop_safe(ccomp, "field_of_view", fov)

    if hasattr(unreal, "PlayerStart"):
        spawn_actor(
            unreal.PlayerStart,
            "LT52A_PlayerStart",
            unreal.Vector(origin.x - extent.x - 320.0, origin.y + 40.0, 120.0),
            rotation=unreal.Rotator(pitch=0.0, yaw=8.0, roll=0.0),
        )

    unreal.EditorLevelLibrary.save_current_level()
    RESULT["level_updated"] = True


def write_status():
    DOCS_DISK.mkdir(parents=True, exist_ok=True)
    status = [
        "# LT52A Architectural Rebuild Import Status",
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
