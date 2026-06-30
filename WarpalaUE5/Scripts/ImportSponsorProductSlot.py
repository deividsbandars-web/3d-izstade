import os
from pathlib import Path

import unreal


DEFAULT_MAP_PATH = "/Game/Warpala/Maps/Booth_Showroom_Main"
DEFAULT_SPONSOR_ID = "sponsor-concierge"
DEFAULT_DESTINATION_PATH = "/Game/Warpala/SponsorProducts/sponsor-concierge"
DEFAULT_LOCATION = unreal.Vector(18, 0, 132)
DEFAULT_ROTATION = unreal.Rotator(0, 180, 0)
DEFAULT_SCALE = unreal.Vector(0.65, 0.65, 0.65)


def env_value(name, default=""):
    return os.environ.get(name, default).strip()


def parse_vector(value, default):
    if not value:
        return default

    try:
        x, y, z = [float(part.strip()) for part in value.split(",")]
        return unreal.Vector(x, y, z)
    except Exception as exc:
        unreal.log_warning(f"[sponsor-product] Invalid vector '{value}', using default: {exc}")
        return default


def parse_rotator(value, default):
    if not value:
        return default

    try:
        pitch, yaw, roll = [float(part.strip()) for part in value.split(",")]
        return unreal.Rotator(pitch, yaw, roll)
    except Exception as exc:
        unreal.log_warning(f"[sponsor-product] Invalid rotator '{value}', using default: {exc}")
        return default


def parse_scale(value, default):
    if not value:
        return default

    try:
        if "," not in value:
            uniform = float(value)
            return unreal.Vector(uniform, uniform, uniform)
        return parse_vector(value, default)
    except Exception as exc:
        unreal.log_warning(f"[sponsor-product] Invalid scale '{value}', using default: {exc}")
        return default


def load_asset(asset_path):
    asset = unreal.EditorAssetLibrary.load_asset(asset_path)
    if not asset:
        unreal.log_warning(f"[sponsor-product] Missing Unreal asset: {asset_path}")
    return asset


def is_static_mesh(asset):
    try:
        return isinstance(asset, unreal.StaticMesh)
    except Exception:
        return asset and asset.get_class().get_name() == "StaticMesh"


def find_first_static_mesh(asset_paths):
    for asset_path in asset_paths:
        asset = load_asset(asset_path)
        if is_static_mesh(asset):
            return asset
    return None


def list_destination_assets(destination_path):
    if not unreal.EditorAssetLibrary.does_directory_exist(destination_path):
        return []
    return unreal.EditorAssetLibrary.list_assets(destination_path, recursive=True, include_folder=False)


def import_source_asset(source_asset_path, destination_path):
    source_path = Path(source_asset_path)
    if not source_path.exists():
        raise RuntimeError(f"Source asset does not exist: {source_asset_path}")

    unreal.EditorAssetLibrary.make_directory(destination_path)

    before_assets = set(list_destination_assets(destination_path))
    task = unreal.AssetImportTask()
    task.set_editor_property("filename", str(source_path))
    task.set_editor_property("destination_path", destination_path)
    task.set_editor_property("automated", True)
    task.set_editor_property("replace_existing", True)
    task.set_editor_property("save", True)

    unreal.AssetToolsHelpers.get_asset_tools().import_asset_tasks([task])

    imported_paths = list(task.get_editor_property("imported_object_paths") or [])
    mesh = find_first_static_mesh(imported_paths)
    if mesh:
        return mesh

    after_assets = set(list_destination_assets(destination_path))
    new_paths = sorted(after_assets.difference(before_assets))
    mesh = find_first_static_mesh(new_paths)
    if mesh:
        return mesh

    stem_matches = [
        asset_path for asset_path in sorted(after_assets)
        if source_path.stem.lower() in asset_path.lower()
    ]
    mesh = find_first_static_mesh(stem_matches)
    if mesh:
        return mesh

    raise RuntimeError(
        f"Imported {source_asset_path}, but no StaticMesh was found in {destination_path}."
    )


def clear_previous_product_actor(product_tag):
    removed = 0
    for actor in unreal.EditorLevelLibrary.get_all_level_actors():
        if actor.actor_has_tag(product_tag):
            unreal.EditorLevelLibrary.destroy_actor(actor)
            removed += 1
    unreal.log(f"[sponsor-product] Removed {removed} previous sponsor product actor(s).")


def spawn_product_mesh(mesh, sponsor_id, location, rotation, scale, product_tag):
    actor = unreal.EditorLevelLibrary.spawn_actor_from_class(unreal.StaticMeshActor, location, rotation)
    actor.set_actor_label(f"WARPALA_SponsorProduct_{sponsor_id}")
    actor.tags = ["WarpalaSponsorProductSlot", product_tag]
    actor.set_actor_scale3d(scale)

    component = actor.get_component_by_class(unreal.StaticMeshComponent)
    if not component:
        raise RuntimeError("Spawned StaticMeshActor has no StaticMeshComponent.")
    component.set_static_mesh(mesh)
    return actor


def apply_sponsor_product_slot():
    map_path = env_value("WARPALA_SPONSOR_PRODUCT_MAP", DEFAULT_MAP_PATH)
    sponsor_id = env_value("WARPALA_SPONSOR_PRODUCT_ID", DEFAULT_SPONSOR_ID)
    source_asset_path = env_value("WARPALA_SPONSOR_PRODUCT_SOURCE")
    existing_asset_path = env_value("WARPALA_SPONSOR_PRODUCT_EXISTING_ASSET")
    destination_path = env_value("WARPALA_SPONSOR_PRODUCT_DESTINATION", DEFAULT_DESTINATION_PATH)
    location = parse_vector(env_value("WARPALA_SPONSOR_PRODUCT_LOCATION"), DEFAULT_LOCATION)
    rotation = parse_rotator(env_value("WARPALA_SPONSOR_PRODUCT_ROTATION"), DEFAULT_ROTATION)
    scale = parse_scale(env_value("WARPALA_SPONSOR_PRODUCT_SCALE"), DEFAULT_SCALE)

    if not source_asset_path and not existing_asset_path:
        raise RuntimeError("Provide WARPALA_SPONSOR_PRODUCT_SOURCE or WARPALA_SPONSOR_PRODUCT_EXISTING_ASSET.")

    level_subsystem = unreal.get_editor_subsystem(unreal.LevelEditorSubsystem)
    level_subsystem.load_level(map_path)

    if existing_asset_path:
        mesh = load_asset(existing_asset_path)
        if not is_static_mesh(mesh):
            raise RuntimeError(f"Existing asset is not a StaticMesh: {existing_asset_path}")
    else:
        mesh = import_source_asset(source_asset_path, destination_path)

    product_tag = f"WarpalaSponsorProductSlot_{sponsor_id}"
    clear_previous_product_actor(product_tag)
    actor = spawn_product_mesh(mesh, sponsor_id, location, rotation, scale, product_tag)

    unreal.EditorLevelLibrary.save_current_level()
    unreal.log(f"[sponsor-product] Placed sponsor product actor: {actor.get_actor_label()}")
    unreal.log(f"[sponsor-product] StaticMesh: {mesh.get_path_name()}")
    unreal.log(f"[sponsor-product] Location: {location}, Rotation: {rotation}, Scale: {scale}")
    unreal.log("[sponsor-product] Sponsor product slot import complete and level saved.")

    if os.environ.get("WARPALA_SPONSOR_PRODUCT_QUIT") == "1":
        unreal.SystemLibrary.quit_editor()


if __name__ == "__main__":
    apply_sponsor_product_slot()
