from __future__ import annotations

import json
from pathlib import Path

import unreal


LEVEL_PATH = "/Game/ModularHome/LT52A/Maps/LT52A_Showroom"
REQUEST_PATH = OUT_DIR = None
OUT_DIR = Path(r"C:\3d\tmp\lt52a_scene_debug")
OUT_DIR.mkdir(parents=True, exist_ok=True)
REQUEST_PATH = OUT_DIR / "request.json"


def vector_to_list(v):
    return [round(float(v.x), 3), round(float(v.y), 3), round(float(v.z), 3)]


def rotator_to_list(r):
    return [round(float(r.pitch), 3), round(float(r.yaw), 3), round(float(r.roll), 3)]


def actor_payload(actor):
    origin, extent = actor.get_actor_bounds(False)
    return {
        "label": actor.get_actor_label(),
        "class": actor.get_class().get_name(),
        "location": vector_to_list(actor.get_actor_location()),
        "rotation": rotator_to_list(actor.get_actor_rotation()),
        "origin": vector_to_list(origin),
        "extent": vector_to_list(extent),
        "hiddenInGame": bool(getattr(actor, "hidden", False)),
    }


def main():
    level_path = LEVEL_PATH
    filter_bounds = None
    filter_tokens = []
    if REQUEST_PATH.exists():
        try:
            request = json.loads(REQUEST_PATH.read_text(encoding="utf-8-sig"))
            level_path = str(request.get("level", LEVEL_PATH))
            filter_bounds = request.get("filterBounds")
            filter_tokens = [str(token).lower() for token in request.get("filterTokens", [])]
        except Exception:
            level_path = LEVEL_PATH

    unreal.EditorLevelLibrary.load_level(level_path)
    actors = unreal.EditorLevelLibrary.get_all_level_actors()

    lt52a = []
    cameras = []
    showroom = []
    for actor in actors:
        label = actor.get_actor_label()
        lower = label.lower()
        if lower.startswith("lt52a_"):
            payload = actor_payload(actor)
            lt52a.append(payload)
            if "camera_" in lower:
                cameras.append(payload)
            if "showroom_" in lower:
                showroom.append(payload)

    static_meshes = [a for a in lt52a if a["class"] == "StaticMeshActor"]
    mins = []
    maxs = []
    for item in static_meshes:
        o = item["origin"]
        e = item["extent"]
        mins.append([o[0] - e[0], o[1] - e[1], o[2] - e[2]])
        maxs.append([o[0] + e[0], o[1] + e[1], o[2] + e[2]])

    if mins:
        scene_bounds = {
            "min": [
                round(min(v[0] for v in mins), 3),
                round(min(v[1] for v in mins), 3),
                round(min(v[2] for v in mins), 3),
            ],
            "max": [
                round(max(v[0] for v in maxs), 3),
                round(max(v[1] for v in maxs), 3),
                round(max(v[2] for v in maxs), 3),
            ],
        }
    else:
        scene_bounds = None

    filtered = static_meshes
    if filter_tokens:
        filtered = [item for item in filtered if any(token in item["label"].lower() for token in filter_tokens)]
    if filter_bounds:
        min_v = filter_bounds.get("min")
        max_v = filter_bounds.get("max")
        if min_v and max_v and len(min_v) == 3 and len(max_v) == 3:
            filtered = [
                item
                for item in filtered
                if min_v[0] <= item["origin"][0] <= max_v[0]
                and min_v[1] <= item["origin"][1] <= max_v[1]
                and min_v[2] <= item["origin"][2] <= max_v[2]
            ]

    payload = {
        "level": level_path,
        "lt52aActorCount": len(lt52a),
        "cameraCount": len(cameras),
        "showroomCount": len(showroom),
        "sceneBounds": scene_bounds,
        "cameras": cameras,
        "showroomActors": showroom,
        "sampleActors": sorted(static_meshes, key=lambda x: x["label"])[:80],
        "filteredActors": sorted(filtered, key=lambda x: x["label"]),
    }
    (OUT_DIR / "diagnostics.json").write_text(json.dumps(payload, indent=2), encoding="utf-8")
    (OUT_DIR / "status.json").write_text(json.dumps({"ok": True, "actorCount": len(lt52a)}, indent=2), encoding="utf-8")
    unreal.log(f"[LT52A-DIAG] wrote diagnostics to {OUT_DIR}")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        (OUT_DIR / "status.json").write_text(json.dumps({"ok": False, "error": str(exc)}, indent=2), encoding="utf-8")
        raise
