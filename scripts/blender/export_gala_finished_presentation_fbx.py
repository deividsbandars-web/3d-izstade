from __future__ import annotations

import json
import os
from pathlib import Path

import bpy  # type: ignore


ROOT = Path(os.environ.get("GALA_PROJECT_ROOT", r"C:\3d")).resolve()
FBX_DIR = ROOT / "exports" / "fbx"
FBX_PATH = FBX_DIR / "GALA_finished_presentation.fbx"
MANIFEST_PATH = FBX_DIR / "GALA_finished_presentation_manifest.json"
BLENDER_REPORT_PATH = FBX_DIR / "gala_blender_finished_presentation_report.json"
PRESENTATION_COLLECTION = "GALA_FINISHED_PRESENTATION"


def load_blender_report() -> dict:
    if not BLENDER_REPORT_PATH.exists():
        raise RuntimeError(f"Missing Blender presentation report: {BLENDER_REPORT_PATH}")
    return json.loads(BLENDER_REPORT_PATH.read_text(encoding="utf-8"))


def presentation_objects() -> list[bpy.types.Object]:
    collection = bpy.data.collections.get(PRESENTATION_COLLECTION)
    if collection is None:
        raise RuntimeError(f"Missing Blender collection: {PRESENTATION_COLLECTION}")
    objects = [obj for obj in collection.objects if obj.type == "MESH"]
    if not objects:
        raise RuntimeError(f"No mesh objects found in {PRESENTATION_COLLECTION}")
    return objects


def export_selected_fbx(objects: list[bpy.types.Object]) -> None:
    FBX_DIR.mkdir(parents=True, exist_ok=True)
    temp_collection = bpy.data.collections.new("GALA_PRESENTATION_EXPORT_TMP")
    bpy.context.scene.collection.children.link(temp_collection)
    clones: list[bpy.types.Object] = []
    try:
        for obj in objects:
            clone = obj.copy()
            if getattr(obj, "data", None) is not None:
                clone.data = obj.data.copy()
            temp_collection.objects.link(clone)
            clones.append(clone)

        bpy.ops.object.select_all(action="DESELECT")
        for clone in clones:
            clone.select_set(True)
        bpy.context.view_layer.objects.active = clones[0]
        bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
        bpy.ops.export_scene.fbx(
            filepath=str(FBX_PATH),
            use_selection=True,
            apply_unit_scale=True,
            bake_space_transform=False,
            object_types={"MESH"},
            path_mode="AUTO",
            axis_forward="-Y",
            axis_up="Z",
            use_mesh_modifiers=True,
            use_custom_props=True,
            add_leaf_bones=False,
        )
    finally:
        bpy.ops.object.select_all(action="DESELECT")
        for clone in clones:
            clone_data = getattr(clone, "data", None)
            if clone.name in bpy.data.objects:
                bpy.data.objects.remove(clone, do_unlink=True)
            if clone_data is not None and getattr(clone_data, "users", 1) == 0:
                bpy.data.meshes.remove(clone_data)
        if temp_collection.name in bpy.data.collections:
            bpy.data.collections.remove(temp_collection)


def write_manifest(report: dict, object_count: int) -> None:
    payload = {
        "status": "passed",
        "source_blend": bpy.data.filepath,
        "source_collection": PRESENTATION_COLLECTION,
        "fbx_file": str(FBX_PATH),
        "content_path": "/Game/WoodHouse_GALA/Presentation/FrozenFromBlender",
        "object_count": object_count,
        "camera_views": report.get("renders", []),
        "blender_report": str(BLENDER_REPORT_PATH),
    }
    MANIFEST_PATH.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print(json.dumps(payload, indent=2))


def main() -> None:
    report = load_blender_report()
    objects = presentation_objects()
    export_selected_fbx(objects)
    write_manifest(report, len(objects))


if __name__ == "__main__":
    main()
