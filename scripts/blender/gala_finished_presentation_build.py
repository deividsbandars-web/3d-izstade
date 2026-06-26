from __future__ import annotations

import csv
import json
import math
import os
import re
from collections import Counter
from pathlib import Path

import bpy  # type: ignore
from mathutils import Vector  # type: ignore


ROOT = Path(os.environ.get("GALA_PROJECT_ROOT", r"C:\3d")).resolve()
CONFIG_PATH = ROOT / "config" / "house_config_GALA.yaml"
OPENINGS_PATH = ROOT / "data" / "openings_schedule.csv"
FACADE_SCHEDULE_PATH = ROOT / "exports" / "cutlists" / "facade_board_schedule.csv"
GABLE_SCHEDULE_PATH = ROOT / "exports" / "cutlists" / "gable_cladding_export.csv"
TERRACE_SCHEDULE_PATH = ROOT / "exports" / "cutlists" / "terrace_board_schedule.csv"

OUTPUT_DIR = ROOT / "exports" / "drawings" / "blender_screenshots"
BLEND_PATH = ROOT / "exports" / "drawings" / "GALA_finished_presentation.blend"
REPORT_PATH = ROOT / "exports" / "fbx" / "gala_blender_finished_presentation_report.json"

PRESENTATION_COLLECTION = "GALA_FINISHED_PRESENTATION"


def mm(value: float) -> float:
    return float(value) / 1000.0


def load_json_config(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8-sig"))


def load_csv(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle))


def ensure_dirs() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)


def clear_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for datablock in (
        bpy.data.meshes,
        bpy.data.materials,
        bpy.data.cameras,
        bpy.data.lights,
        bpy.data.curves,
        bpy.data.images,
    ):
        for item in list(datablock):
            if item.users == 0:
                datablock.remove(item)


def get_or_create_collection(name: str) -> bpy.types.Collection:
    collection = bpy.data.collections.get(name)
    if collection is None:
        collection = bpy.data.collections.new(name)
        bpy.context.scene.collection.children.link(collection)
    return collection


def link_object(collection: bpy.types.Collection, obj: bpy.types.Object) -> None:
    if obj.name not in collection.objects:
        collection.objects.link(obj)


def assign_metadata(obj: bpy.types.Object, **metadata: object) -> None:
    for key, value in metadata.items():
        obj[key] = value


def parse_range_notes(notes: str) -> tuple[float, float, float, float]:
    match = re.search(r"horizontal\s+([0-9.]+)\.\.([0-9.]+),\s*vertical\s+([0-9.]+)\.\.([0-9.]+)", notes)
    if not match:
        raise RuntimeError(f"Could not parse board extents from notes: {notes}")
    return tuple(float(group) for group in match.groups())  # type: ignore[return-value]


def board_seed(name: str) -> int:
    match = re.search(r"(\d{2,3})(?!.*\d)", name)
    return int(match.group(1)) if match else 0


def ensure_material(
    name: str,
    base_color: tuple[float, float, float, float],
    roughness: float,
    metallic: float = 0.0,
    transmission: float = 0.0,
    grain_scale: float = 0.0,
    grain_strength: float = 0.0,
    bump_strength: float = 0.0,
) -> bpy.types.Material:
    material = bpy.data.materials.get(name)
    if material is None:
        material = bpy.data.materials.new(name)
    material.use_nodes = True
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    nodes.clear()

    output = nodes.new("ShaderNodeOutputMaterial")
    output.location = (480, 0)
    shader = nodes.new("ShaderNodeBsdfPrincipled")
    shader.location = (180, 0)
    shader.inputs["Base Color"].default_value = base_color
    shader.inputs["Roughness"].default_value = roughness
    shader.inputs["Metallic"].default_value = metallic
    if "Transmission Weight" in shader.inputs:
        shader.inputs["Transmission Weight"].default_value = transmission
    elif "Transmission" in shader.inputs:
        shader.inputs["Transmission"].default_value = transmission
    if "IOR" in shader.inputs:
        shader.inputs["IOR"].default_value = 1.45 if transmission > 0.0 else 1.5

    if grain_strength > 0.0 or bump_strength > 0.0:
        tex_coord = nodes.new("ShaderNodeTexCoord")
        tex_coord.location = (-980, 0)
        mapping = nodes.new("ShaderNodeMapping")
        mapping.location = (-770, 0)
        mapping.inputs["Scale"].default_value[0] = grain_scale * 0.22
        mapping.inputs["Scale"].default_value[1] = grain_scale
        mapping.inputs["Scale"].default_value[2] = 1.0
        noise = nodes.new("ShaderNodeTexNoise")
        noise.location = (-540, 60)
        noise.inputs["Scale"].default_value = grain_scale
        noise.inputs["Detail"].default_value = 10.0
        noise.inputs["Roughness"].default_value = 0.56
        ramp = nodes.new("ShaderNodeValToRGB")
        ramp.location = (-310, 60)
        ramp.color_ramp.elements[0].position = 0.34
        ramp.color_ramp.elements[0].color = (0.82, 0.73, 0.62, 1.0)
        ramp.color_ramp.elements[1].position = 0.70
        ramp.color_ramp.elements[1].color = (1.0, 0.97, 0.92, 1.0)
        mix = nodes.new("ShaderNodeMixRGB")
        mix.location = (-40, 40)
        mix.blend_type = "MULTIPLY"
        mix.inputs["Fac"].default_value = grain_strength
        mix.inputs["Color1"].default_value = base_color
        bump = nodes.new("ShaderNodeBump")
        bump.location = (0, -170)
        bump.inputs["Strength"].default_value = bump_strength

        links.new(tex_coord.outputs["Object"], mapping.inputs["Vector"])
        links.new(mapping.outputs["Vector"], noise.inputs["Vector"])
        links.new(noise.outputs["Fac"], ramp.inputs["Fac"])
        links.new(ramp.outputs["Color"], mix.inputs["Color2"])
        links.new(mix.outputs["Color"], shader.inputs["Base Color"])
        links.new(noise.outputs["Fac"], bump.inputs["Height"])
        links.new(bump.outputs["Normal"], shader.inputs["Normal"])

    links.new(shader.outputs["BSDF"], output.inputs["Surface"])
    return material


def facade_material(index: int) -> bpy.types.Material:
    palette = [
        (0.83, 0.73, 0.60, 1.0),
        (0.78, 0.67, 0.54, 1.0),
        (0.72, 0.61, 0.48, 1.0),
        (0.88, 0.79, 0.66, 1.0),
    ]
    return ensure_material(
        f"GALA_Presentation_Timber_{index % len(palette)}",
        palette[index % len(palette)],
        roughness=0.72,
        grain_scale=13.0,
        grain_strength=0.28,
        bump_strength=0.045,
    )


def black_material() -> bpy.types.Material:
    return ensure_material("GALA_Presentation_Black", (0.06, 0.06, 0.07, 1.0), 0.36, metallic=0.03, bump_strength=0.015, grain_scale=7.0, grain_strength=0.08)


def roof_material() -> bpy.types.Material:
    return ensure_material("GALA_Presentation_Roof", (0.16, 0.17, 0.18, 1.0), 0.24, metallic=0.38, bump_strength=0.012, grain_scale=24.0, grain_strength=0.04)


def glass_material() -> bpy.types.Material:
    material = ensure_material("GALA_Presentation_Glass", (0.76, 0.86, 0.93, 1.0), 0.04, transmission=1.0)
    material.blend_method = "BLEND"
    return material


def door_material() -> bpy.types.Material:
    return ensure_material("GALA_Presentation_Door", (0.73, 0.73, 0.74, 1.0), 0.42, grain_scale=9.0, grain_strength=0.06, bump_strength=0.008)


def terrace_material(index: int) -> bpy.types.Material:
    palette = [
        (0.55, 0.42, 0.26, 1.0),
        (0.49, 0.36, 0.22, 1.0),
        (0.61, 0.47, 0.30, 1.0),
    ]
    return ensure_material(
        f"GALA_Presentation_Terrace_{index % len(palette)}",
        palette[index % len(palette)],
        0.63,
        grain_scale=10.0,
        grain_strength=0.22,
        bump_strength=0.035,
    )


def terrace_frame_material() -> bpy.types.Material:
    return ensure_material("GALA_Presentation_Terrace_Frame", (0.36, 0.27, 0.18, 1.0), 0.78, grain_scale=8.0, grain_strength=0.15, bump_strength=0.02)


def backdrop_material() -> bpy.types.Material:
    return ensure_material("GALA_Presentation_Backdrop_Mat", (0.92, 0.93, 0.95, 1.0), 0.94)


def ground_material() -> bpy.types.Material:
    return ensure_material("GALA_Presentation_Ground_Mat", (0.88, 0.89, 0.90, 1.0), 0.95)


def plinth_material() -> bpy.types.Material:
    return ensure_material("GALA_Presentation_Plinth", (0.66, 0.67, 0.70, 1.0), 0.86, grain_scale=5.0, grain_strength=0.02, bump_strength=0.008)


def new_mesh_object(name: str, vertices: list[tuple[float, float, float]], faces: list[tuple[int, ...]], material: bpy.types.Material, collection: bpy.types.Collection) -> bpy.types.Object:
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    link_object(collection, obj)
    mesh.materials.append(material)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.shade_smooth()
    bpy.ops.object.select_all(action="DESELECT")
    return obj


def create_box(
    name: str,
    size_x: float,
    size_y: float,
    size_z: float,
    center: tuple[float, float, float],
    material: bpy.types.Material,
    collection: bpy.types.Collection,
    rotation: tuple[float, float, float] = (0.0, 0.0, 0.0),
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_cube_add(location=center, rotation=rotation)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = (size_x * 0.5, size_y * 0.5, size_z * 0.5)
    obj.data.materials.clear()
    obj.data.materials.append(material)
    if obj.users_collection:
        for source in list(obj.users_collection):
            source.objects.unlink(obj)
    link_object(collection, obj)
    return obj


def create_vertical_wedge(
    name: str,
    x_face: float,
    y0: float,
    y1: float,
    z0: float,
    z_y0: float,
    z_y1: float,
    thickness: float,
    outward_positive_x: bool,
    material: bpy.types.Material,
    collection: bpy.types.Collection,
) -> bpy.types.Object:
    x_outer = x_face
    x_inner = x_face - thickness if outward_positive_x else x_face + thickness
    front = [
        (x_outer, y0, z0),
        (x_outer, y1, z0),
        (x_outer, y1, z_y1),
        (x_outer, y0, z_y0),
    ]
    back = [(x_inner, y, z) for (x_outer_unused, y, z) in front]
    vertices = front + back
    faces = [
        (0, 1, 2, 3),
        (4, 7, 6, 5),
        (0, 4, 5, 1),
        (1, 5, 6, 2),
        (2, 6, 7, 3),
        (3, 7, 4, 0),
    ]
    return new_mesh_object(name, vertices, faces, material, collection)


def create_opening_frame(
    collection: bpy.types.Collection,
    opening: dict[str, str],
    wall_face: str,
    face_offset: float,
    config: dict,
) -> list[bpy.types.Object]:
    objects: list[bpy.types.Object] = []
    frame_depth = mm(70)
    frame_width = mm(36)
    glass_depth = mm(14)
    reveal_depth = mm(85)

    wall = opening["wall"]
    opening_id = opening["opening_id"]
    pw = mm(float(opening["product_width_mm"]))
    ph = mm(float(opening["product_height_mm"]))
    sill = mm(float(opening["sill_from_finished_floor_mm"]))
    start = mm(float(opening["start_mm"]))

    if wall in {"S", "N"}:
        x0 = start
        x1 = start + pw
        y_outer = face_offset
        y_inner = face_offset + reveal_depth if wall == "S" else face_offset - reveal_depth
        y_center = (y_outer + y_inner) * 0.5
        frame_y = abs(y_outer - y_inner)
        left = create_box(
            f"PRES_{opening_id}_frame_left",
            frame_width,
            frame_y,
            ph + frame_width * 2,
            (x0 + frame_width * 0.5, y_center, sill + ph * 0.5),
            black_material(),
            collection,
        )
        right = create_box(
            f"PRES_{opening_id}_frame_right",
            frame_width,
            frame_y,
            ph + frame_width * 2,
            (x1 - frame_width * 0.5, y_center, sill + ph * 0.5),
            black_material(),
            collection,
        )
        head = create_box(
            f"PRES_{opening_id}_frame_head",
            max(pw - frame_width * 2, mm(10)),
            frame_y,
            frame_width,
            ((x0 + x1) * 0.5, y_center, sill + ph + frame_width * 0.5),
            black_material(),
            collection,
        )
        sill_obj = create_box(
            f"PRES_{opening_id}_frame_sill",
            max(pw - frame_width * 2, mm(10)),
            frame_y,
            frame_width,
            ((x0 + x1) * 0.5, y_center, sill - frame_width * 0.5),
            black_material(),
            collection,
        )
        objects.extend([left, right, head, sill_obj])
        if opening["type"] == "window":
            glass = create_box(
                f"PRES_{opening_id}_glass",
                max(pw - frame_width * 3, mm(10)),
                glass_depth,
                max(ph - frame_width * 3, mm(10)),
                ((x0 + x1) * 0.5, y_outer + mm(12) if wall == "S" else y_outer - mm(12), sill + ph * 0.5),
                glass_material(),
                collection,
            )
            objects.append(glass)
        else:
            leaf_thickness = mm(46)
            leaf = create_box(
                f"PRES_{opening_id}_leaf",
                max(pw - frame_width * 2, mm(10)),
                leaf_thickness,
                max(ph - frame_width * 2, mm(10)),
                ((x0 + x1) * 0.5, y_outer + leaf_thickness * 0.5 if wall == "S" else y_outer - leaf_thickness * 0.5, sill + ph * 0.5),
                door_material(),
                collection,
            )
            threshold = create_box(
                f"PRES_{opening_id}_threshold",
                pw + mm(24),
                mm(120),
                mm(18),
                ((x0 + x1) * 0.5, y_outer + mm(38) if wall == "S" else y_outer - mm(38), mm(9)),
                black_material(),
                collection,
            )
            objects.extend([leaf, threshold])
    else:
        local_y0 = start + (0.0 if wall.endswith("A") else mm(2500))
        local_y1 = local_y0 + pw
        x_outer = face_offset
        x_inner = face_offset + reveal_depth if wall.startswith("W") else face_offset - reveal_depth
        x_center = (x_outer + x_inner) * 0.5
        frame_x = abs(x_outer - x_inner)
        left = create_box(
            f"PRES_{opening_id}_frame_left",
            frame_x,
            frame_width,
            ph + frame_width * 2,
            (x_center, local_y0 + frame_width * 0.5, sill + ph * 0.5),
            black_material(),
            collection,
        )
        right = create_box(
            f"PRES_{opening_id}_frame_right",
            frame_x,
            frame_width,
            ph + frame_width * 2,
            (x_center, local_y1 - frame_width * 0.5, sill + ph * 0.5),
            black_material(),
            collection,
        )
        head = create_box(
            f"PRES_{opening_id}_frame_head",
            frame_x,
            max(pw - frame_width * 2, mm(10)),
            frame_width,
            (x_center, (local_y0 + local_y1) * 0.5, sill + ph + frame_width * 0.5),
            black_material(),
            collection,
        )
        sill_obj = create_box(
            f"PRES_{opening_id}_frame_sill",
            frame_x,
            max(pw - frame_width * 2, mm(10)),
            frame_width,
            (x_center, (local_y0 + local_y1) * 0.5, sill - frame_width * 0.5),
            black_material(),
            collection,
        )
        glass = create_box(
            f"PRES_{opening_id}_glass",
            glass_depth,
            max(pw - frame_width * 3, mm(10)),
            max(ph - frame_width * 3, mm(10)),
            (x_outer + mm(12) if wall.startswith("W") else x_outer - mm(12), (local_y0 + local_y1) * 0.5, sill + ph * 0.5),
            glass_material(),
            collection,
        )
        objects.extend([left, right, head, sill_obj, glass])

    for obj in objects:
        if "glass" in obj.name.lower():
            assign_metadata(
                obj,
                category="openings",
                element_type="window_glass_pane",
                detail_status="requires_engineer_or_manufacturer_data",
            )
        elif "leaf" in obj.name.lower():
            assign_metadata(
                obj,
                category="openings",
                element_type="door_leaf",
                detail_status="requires_engineer_or_manufacturer_data",
            )
        elif "threshold" in obj.name.lower():
            assign_metadata(
                obj,
                category="openings",
                element_type="door_threshold",
                detail_status="requires_engineer_or_manufacturer_data",
            )
        else:
            element_type = "door_frame_unit" if opening["type"] == "door" else "window_frame_unit"
            assign_metadata(
                obj,
                category="openings",
                element_type=element_type,
                detail_status="requires_engineer_or_manufacturer_data",
            )
    return objects


def create_opening_trim(
    collection: bpy.types.Collection,
    opening: dict[str, str],
    face_offset: float,
) -> list[bpy.types.Object]:
    objects: list[bpy.types.Object] = []
    trim_thickness = mm(28)
    trim_face = mm(95)
    reveal_gap = mm(20)

    wall = opening["wall"]
    opening_id = opening["opening_id"]
    pw = mm(float(opening["product_width_mm"]))
    ph = mm(float(opening["product_height_mm"]))
    sill = mm(float(opening["sill_from_finished_floor_mm"]))
    start = mm(float(opening["start_mm"]))

    if wall in {"S", "N"}:
        y_center = face_offset + trim_thickness * 0.5 if wall == "S" else face_offset - trim_thickness * 0.5
        x0 = start - reveal_gap
        x1 = start + pw + reveal_gap
        left = create_box(
            f"PRES_{opening_id}_trim_left",
            trim_face,
            trim_thickness,
            ph + trim_face * 0.7,
            (x0 - trim_face * 0.5, y_center, sill + ph * 0.5),
            black_material(),
            collection,
        )
        right = create_box(
            f"PRES_{opening_id}_trim_right",
            trim_face,
            trim_thickness,
            ph + trim_face * 0.7,
            (x1 + trim_face * 0.5, y_center, sill + ph * 0.5),
            black_material(),
            collection,
        )
        head = create_box(
            f"PRES_{opening_id}_trim_head",
            (x1 - x0) + trim_face * 2.0,
            trim_thickness,
            trim_face,
            ((x0 + x1) * 0.5, y_center, sill + ph + trim_face * 0.5),
            black_material(),
            collection,
        )
        sill_trim = create_box(
            f"PRES_{opening_id}_trim_sill",
            (x1 - x0) + trim_face * 1.4,
            trim_thickness,
            trim_face * 0.6,
            ((x0 + x1) * 0.5, y_center, max(mm(28), sill - trim_face * 0.3)),
            black_material(),
            collection,
        )
        objects.extend([left, right, head, sill_trim])
    else:
        x_center = face_offset - trim_thickness * 0.5 if wall.startswith("W") else face_offset + trim_thickness * 0.5
        y0 = start + (0.0 if wall.endswith("A") else mm(2500)) - reveal_gap
        y1 = y0 + pw + reveal_gap * 2.0
        left = create_box(
            f"PRES_{opening_id}_trim_left",
            trim_thickness,
            trim_face,
            ph + trim_face * 0.7,
            (x_center, y0 - trim_face * 0.5, sill + ph * 0.5),
            black_material(),
            collection,
        )
        right = create_box(
            f"PRES_{opening_id}_trim_right",
            trim_thickness,
            trim_face,
            ph + trim_face * 0.7,
            (x_center, y1 + trim_face * 0.5, sill + ph * 0.5),
            black_material(),
            collection,
        )
        head = create_box(
            f"PRES_{opening_id}_trim_head",
            trim_thickness,
            (y1 - y0) + trim_face * 2.0,
            trim_face,
            (x_center, (y0 + y1) * 0.5, sill + ph + trim_face * 0.5),
            black_material(),
            collection,
        )
        sill_trim = create_box(
            f"PRES_{opening_id}_trim_sill",
            trim_thickness,
            (y1 - y0) + trim_face * 1.4,
            trim_face * 0.6,
            (x_center, (y0 + y1) * 0.5, max(mm(28), sill - trim_face * 0.3)),
            black_material(),
            collection,
        )
        objects.extend([left, right, head, sill_trim])

    for obj in objects:
        assign_metadata(obj, category="facade", element_type="black_window_door_trim")
    return objects


def build_house() -> tuple[Counter, Counter]:
    config = load_json_config(CONFIG_PATH)
    openings = load_csv(OPENINGS_PATH)
    facade_rows = load_csv(FACADE_SCHEDULE_PATH)
    gable_rows = load_csv(GABLE_SCHEDULE_PATH)
    terrace_rows = load_csv(TERRACE_SCHEDULE_PATH)

    collection = get_or_create_collection(PRESENTATION_COLLECTION)
    for obj in list(collection.objects):
        bpy.data.objects.remove(obj, do_unlink=True)

    counts: Counter = Counter()
    material_counts: Counter = Counter()

    house_length = mm(config["project"]["house_wall_envelope"][0])
    house_width = mm(config["project"]["house_wall_envelope"][1])
    finished_width = mm(config["project"]["finished_facade_width"])
    wall_height = mm(config["modules"]["wall_frame_height"])
    roof_length = mm(config["project"]["roof_projection"][0])
    roof_width = mm(config["project"]["roof_projection"][1])
    pitch = math.radians(float(config["roof"]["pitch_degrees"]))
    ridge_rise = mm(float(config["roof"]["trusses"]["ridge_rise"]))

    south_face_y = (house_width - finished_width) * 0.5
    north_face_y = south_face_y + finished_width
    west_face_x = mm(40)
    east_face_x = house_length - mm(40)
    roof_west_x = -mm(config["roof"]["gable_overhang"])
    roof_east_x = roof_west_x + roof_length
    roof_south_y = -mm(config["roof"]["eave_overhang"])
    roof_north_y = roof_south_y + roof_width
    ridge_y = house_width * 0.5
    roof_eave_z = wall_height - mm(36)
    ridge_z = roof_eave_z + ridge_rise
    roof_half_run = ridge_y - roof_south_y
    slope_length = roof_half_run / math.cos(pitch)
    roof_panel_width = house_length + mm(500)
    plinth_height = mm(420)
    plinth_reveal = mm(55)

    def roof_z(y_value: float) -> float:
        if y_value <= ridge_y:
            return roof_eave_z + (y_value - roof_south_y) * math.tan(pitch)
        return roof_eave_z + (roof_north_y - y_value) * math.tan(pitch)

    # Backing masses and presentation stage
    ground = create_box(
        "GALA_Presentation_Ground",
        size_x=mm(17000),
        size_y=mm(16000),
        size_z=mm(80),
        center=(house_length * 0.5, house_width * 0.5 + mm(650), -plinth_height - mm(40)),
        material=ground_material(),
        collection=collection,
    )
    assign_metadata(ground, category="presentation", element_type="ground_plane")

    plinth = create_box(
        "GALA_Presentation_Plinth",
        size_x=house_length + plinth_reveal * 2.0,
        size_y=house_width + plinth_reveal * 2.0,
        size_z=plinth_height,
        center=(house_length * 0.5, house_width * 0.5, -plinth_height * 0.5),
        material=plinth_material(),
        collection=collection,
    )
    assign_metadata(plinth, category="presentation", element_type="plinth_base", detail_status="requires_engineer_or_manufacturer_data")

    backdrop = create_box(
        "GALA_Presentation_Backdrop",
        size_x=mm(22000),
        size_y=mm(120),
        size_z=mm(9000),
        center=(house_length * 0.5, house_width + mm(7500), mm(4200)),
        material=backdrop_material(),
        collection=collection,
    )
    assign_metadata(backdrop, category="presentation", element_type="backdrop_plane")

    # Shadow backing inside shell to avoid empty look through openings.
    shell = create_box(
        "GALA_Presentation_Shell",
        size_x=house_length - mm(220),
        size_y=house_width - mm(220),
        size_z=wall_height,
        center=(house_length * 0.5, house_width * 0.5, wall_height * 0.5),
        material=ensure_material("GALA_Presentation_InteriorShadow", (0.78, 0.78, 0.79, 1.0), 0.92),
        collection=collection,
    )
    assign_metadata(shell, category="presentation", element_type="interior_shadow_shell", detail_status="not_modelled_no_fastener_schedule")

    # Facade boards
    for row in facade_rows:
        index = board_seed(row["part_id"])
        material = facade_material(index)
        h0_mm, h1_mm, v0_mm, v1_mm = parse_range_notes(row["notes"])
        x0 = x1 = y0 = y1 = 0.0
        z0 = mm(v0_mm)
        z1 = mm(v1_mm)
        thickness = mm(float(row["width_mm"]))
        board_face_width = mm(float(row["rip_width_mm"]))

        wall_id = row["wall_id"]
        if wall_id == "S":
            x0, x1 = mm(h0_mm), mm(h0_mm) + board_face_width
            center = ((x0 + x1) * 0.5, south_face_y + thickness * 0.5, (z0 + z1) * 0.5)
            obj = create_box(row["part_id"], x1 - x0, thickness, z1 - z0, center, material, collection)
        elif wall_id == "N":
            x0, x1 = mm(h0_mm), mm(h0_mm) + board_face_width
            center = ((x0 + x1) * 0.5, north_face_y - thickness * 0.5, (z0 + z1) * 0.5)
            obj = create_box(row["part_id"], x1 - x0, thickness, z1 - z0, center, material, collection)
        elif wall_id in {"W-A", "W-B"}:
            local_base = 0.0 if wall_id.endswith("A") else mm(2500)
            y0 = local_base + mm(h0_mm)
            y1 = y0 + board_face_width
            center = (west_face_x - thickness * 0.5, (y0 + y1) * 0.5, (z0 + z1) * 0.5)
            obj = create_box(row["part_id"], thickness, y1 - y0, z1 - z0, center, material, collection)
        elif wall_id in {"E-A", "E-B"}:
            local_base = 0.0 if wall_id.endswith("A") else mm(2500)
            y0 = local_base + mm(h0_mm)
            y1 = y0 + board_face_width
            center = (east_face_x + thickness * 0.5, (y0 + y1) * 0.5, (z0 + z1) * 0.5)
            obj = create_box(row["part_id"], thickness, y1 - y0, z1 - z0, center, material, collection)
        else:
            continue
        assign_metadata(
            obj,
            category="facade",
            element_type="calculated_individual_facade_board_segment",
            part_id=row["part_id"],
            wall_id=wall_id,
        )
        counts["facade_boards"] += 1
        material_counts[material.name] += 1

    # Gable cladding boards
    gable_by_id: dict[str, list[dict[str, str]]] = {"GABLE-WEST": [], "GABLE-EAST": []}
    for row in gable_rows:
        gable_by_id[row["wall_id"]].append(row)

    gable_thickness = mm(21)
    for gable_id, rows in gable_by_id.items():
        face_x = west_face_x if gable_id.endswith("WEST") else east_face_x
        outward_positive_x = gable_id.endswith("EAST")
        for idx, row in enumerate(rows):
            board_width = mm(float(row["rip_width_mm"]))
            visible = mm(float(row["visible_cover_mm"]))
            y0 = idx * visible
            y1 = y0 + board_width

            def gable_top(y_value: float) -> float:
                if y_value <= ridge_y:
                    return wall_height + (y_value / ridge_y) * ridge_rise
                return wall_height + ((house_width - y_value) / ridge_y) * ridge_rise

            z_y0 = gable_top(y0)
            z_y1 = gable_top(y1)
            obj = create_vertical_wedge(
                row["part_id"],
                x_face=face_x if gable_id.endswith("WEST") else face_x,
                y0=y0,
                y1=y1,
                z0=wall_height,
                z_y0=z_y0,
                z_y1=z_y1,
                thickness=gable_thickness,
                outward_positive_x=outward_positive_x,
                material=facade_material(idx + 200),
                collection=collection,
            )
            assign_metadata(
                obj,
                category="roof",
                element_type="gable_individual_vertical_cladding_board",
                part_id=row["part_id"],
                wall_id=gable_id,
            )
            counts["gable_boards"] += 1
            material_counts[obj.data.materials[0].name] += 1

    # Roof planes
    roof_depth = mm(26)
    for side in ("south", "north"):
        panel_center_y = (roof_south_y + ridge_y) * 0.5 if side == "south" else (ridge_y + roof_north_y) * 0.5
        panel_center_z = (roof_eave_z + ridge_z) * 0.5
        pitch_angle = pitch if side == "south" else -pitch
        panel = create_box(
            f"PRES_roof_panel_{side}",
            roof_panel_width,
            slope_length,
            roof_depth,
            (house_length * 0.5, panel_center_y, panel_center_z),
            roof_material(),
            collection,
            rotation=(pitch_angle, 0.0, 0.0),
        )
        assign_metadata(panel, category="roof", element_type="supplier_scheduled_black_standing_seam_roof")
        counts["roof_finish"] += 1
        material_counts[panel.data.materials[0].name] += 1

        for i in range(24):
            x_pos = roof_west_x + mm(220) + i * ((roof_length - mm(440)) / 23.0)
            y_pos = panel_center_y
            z_pos = panel_center_z + mm(14)
            seam = create_box(
                f"PRES_roof_seam_{side}_{i+1:02d}",
                mm(18),
                slope_length,
                mm(26),
                (x_pos, y_pos, z_pos),
                black_material(),
                collection,
                rotation=(pitch_angle, 0.0, 0.0),
            )
            assign_metadata(seam, category="roof", element_type="roof_standing_seam_rib", detail_status="requires_engineer_or_manufacturer_data")
            counts["roof_seams"] += 1
            material_counts[seam.data.materials[0].name] += 1

        gutter_y = roof_south_y + mm(70) if side == "south" else roof_north_y - mm(70)
        gutter_z = roof_eave_z - mm(70)
        gutter = create_box(
            f"PRES_gutter_{side}",
            roof_length,
            mm(110),
            mm(90),
            (house_length * 0.5, gutter_y, gutter_z),
            black_material(),
            collection,
        )
        assign_metadata(gutter, category="roof", element_type="ventilated_eave_intake_with_gutter", detail_status="requires_engineer_or_manufacturer_data")
        counts["gutters"] += 1
        material_counts[gutter.data.materials[0].name] += 1

    ridge = create_box(
        "PRES_ridge_cap",
        roof_length,
        mm(120),
        mm(55),
        (house_length * 0.5, ridge_y, ridge_z + mm(18)),
        black_material(),
        collection,
    )
    assign_metadata(ridge, category="roof", element_type="ventilated_ridge_outlet_with_insect_mesh", detail_status="requires_engineer_or_manufacturer_data")
    counts["ridge"] += 1
    material_counts[ridge.data.materials[0].name] += 1

    # Raking trims
    trim_width = mm(28)
    trim_depth = mm(120)
    for side_name, x_face, outward in (
        ("west_south", west_face_x - trim_width * 0.5, False),
        ("west_north", west_face_x - trim_width * 0.5, False),
        ("east_south", east_face_x + trim_width * 0.5, True),
        ("east_north", east_face_x + trim_width * 0.5, True),
    ):
        north_half = side_name.endswith("north")
        y_a = 0.0 if not north_half else ridge_y
        y_b = ridge_y if not north_half else house_width
        z_a = wall_height
        z_b = ridge_z
        obj = create_vertical_wedge(
            f"PRES_raking_trim_{side_name}",
            x_face=x_face,
            y0=y_a,
            y1=y_b,
            z0=max(wall_height - trim_depth * 0.5, 0.0),
            z_y0=z_a + trim_depth * 0.35,
            z_y1=z_b + trim_depth * 0.35 if north_half else z_b + trim_depth * 0.35,
            thickness=trim_width,
            outward_positive_x=outward,
            material=black_material(),
            collection=collection,
        )
        assign_metadata(obj, category="roof", element_type="black_raking_trim", detail_status="requires_engineer_or_manufacturer_data")
        counts["raking_trims"] += 1
        material_counts[obj.data.materials[0].name] += 1

    # Corner trims and module seam covers
    for x_pos in (west_face_x - mm(35), east_face_x + mm(35)):
        for y_pos in (south_face_y + mm(35), north_face_y - mm(35)):
            obj = create_box(
                f"PRES_corner_trim_{int(x_pos*1000)}_{int(y_pos*1000)}",
                mm(70),
                mm(70),
                wall_height,
                (x_pos, y_pos, wall_height * 0.5),
                black_material(),
                collection,
            )
            assign_metadata(obj, category="facade", element_type="black_corner_profile_with_two_23x25_rebates")
            counts["corner_trims"] += 1
            material_counts[obj.data.materials[0].name] += 1

    for x_pos in (west_face_x - mm(10), east_face_x + mm(10)):
        seam = create_box(
            f"PRES_module_seam_cover_{int(x_pos*1000)}",
            mm(45),
            mm(120),
            wall_height,
            (x_pos, house_width * 0.5, wall_height * 0.5),
            black_material(),
            collection,
        )
        assign_metadata(seam, category="facade", element_type="black_sliding_end_wall_module_seam_cover_with_epdm", detail_status="requires_engineer_or_manufacturer_data")
        counts["module_seam_covers"] += 1
        material_counts[seam.data.materials[0].name] += 1

    # Downpipes and snow guards
    downpipe_xs = (mm(260), house_length - mm(260))
    for x_val in downpipe_xs:
        for side in ("south", "north"):
            y_val = roof_south_y + mm(120) if side == "south" else roof_north_y - mm(120)
            pipe = create_box(
                f"PRES_downpipe_{side}_{int(x_val*1000)}",
                mm(80),
                mm(80),
                roof_eave_z - mm(120),
                (x_val, y_val, (roof_eave_z - mm(120)) * 0.5),
                black_material(),
                collection,
            )
            assign_metadata(pipe, category="roof", element_type="provisional_downpipe", detail_status="requires_engineer_or_manufacturer_data")
            counts["downpipes"] += 1
            material_counts[pipe.data.materials[0].name] += 1

    for guard_name, x_pos, y_pos in (
        ("entry", mm(4635), south_face_y + mm(130),),
        ("terrace", mm(4385), north_face_y - mm(130),),
    ):
        z_pos = roof_z(y_pos if guard_name == "entry" else y_pos) + mm(120)
        pitch_angle = pitch if guard_name == "entry" else -pitch
        guard = create_box(
            f"PRES_snow_guard_{guard_name}",
            mm(1800),
            mm(45),
            mm(45),
            (x_pos, y_pos, z_pos),
            black_material(),
            collection,
            rotation=(pitch_angle, 0.0, 0.0),
        )
        assign_metadata(guard, category="roof", element_type="provisional_snow_guard", detail_status="requires_engineer_or_manufacturer_data")
        counts["snow_guards"] += 1
        material_counts[guard.data.materials[0].name] += 1

    # Windows and doors + trims
    for opening in openings:
        face_offset = south_face_y if opening["wall"] == "S" else north_face_y if opening["wall"] == "N" else west_face_x if opening["wall"].startswith("W") else east_face_x
        create_opening_frame(collection, opening, opening["wall"], face_offset, config)
        create_opening_trim(collection, opening, face_offset)
        if opening["type"] == "window":
            counts["window_sets"] += 1
        else:
            counts["door_sets"] += 1

    # Terrace frame and boards
    terrace_x0 = mm(3200)
    terrace_x1 = mm(5600)
    terrace_y0 = north_face_y
    terrace_y1 = terrace_y0 + mm(2100)
    frame_top_z = -mm(28)
    joist_depth = mm(145)
    frame_material = terrace_frame_material()

    frame_members = [
        ("terrace_beam_south", house_length * 0.0 + (terrace_x0 + terrace_x1) * 0.5, terrace_y0 + mm(72.5), terrace_x1 - terrace_x0, mm(145)),
        ("terrace_beam_north", house_length * 0.0 + (terrace_x0 + terrace_x1) * 0.5, terrace_y1 - mm(72.5), terrace_x1 - terrace_x0, mm(145)),
    ]
    for name, x_center, y_center, x_len, y_len in frame_members:
        obj = create_box(name, x_len, y_len, joist_depth, (x_center, y_center, frame_top_z - joist_depth * 0.5), frame_material, collection)
        assign_metadata(obj, category="terrace", element_type="terrace_perimeter_long_beam", detail_status="not_modelled_no_fastener_schedule")
        counts["terrace_structure"] += 1
        material_counts[obj.data.materials[0].name] += 1

    for x_center in (terrace_x0 + mm(72.5), terrace_x1 - mm(72.5)):
        obj = create_box(
            f"terrace_end_beam_{int(x_center*1000)}",
            mm(145),
            terrace_y1 - terrace_y0 - mm(290),
            joist_depth,
            (x_center, (terrace_y0 + terrace_y1) * 0.5, frame_top_z - joist_depth * 0.5),
            frame_material,
            collection,
        )
        assign_metadata(obj, category="terrace", element_type="terrace_end_beam", detail_status="not_modelled_no_fastener_schedule")
        counts["terrace_structure"] += 1
        material_counts[obj.data.materials[0].name] += 1

    joist_xs = [terrace_x0 + mm(145 + 400 * i) for i in range(5)]
    for idx, x_center in enumerate(joist_xs, start=1):
        obj = create_box(
            f"terrace_joist_{idx:02d}",
            mm(45),
            terrace_y1 - terrace_y0 - mm(290),
            joist_depth,
            (x_center, (terrace_y0 + terrace_y1) * 0.5, frame_top_z - joist_depth * 0.5),
            frame_material,
            collection,
        )
        assign_metadata(obj, category="terrace", element_type="terrace_internal_joist", detail_status="not_modelled_no_fastener_schedule")
        counts["terrace_structure"] += 1
        material_counts[obj.data.materials[0].name] += 1

    for row in terrace_rows:
        width = mm(float(row["height_mm"]))
        thickness = mm(float(row["width_mm"]))
        y_start_match = re.search(r"y_start=([0-9.]+)\s*mm", row["notes"])
        if not y_start_match:
            raise RuntimeError(f"Could not parse terrace board offset from notes: {row['notes']}")
        y_start = terrace_y0 + mm(float(y_start_match.group(1)))
        y_center = y_start + width * 0.5
        board = create_box(
            row["part_id"],
            terrace_x1 - terrace_x0,
            width,
            thickness,
            ((terrace_x0 + terrace_x1) * 0.5, y_center, frame_top_z + thickness * 0.5),
            terrace_material(board_seed(row["part_id"])),
            collection,
        )
        assign_metadata(board, category="terrace", element_type=row["element_type"], part_id=row["part_id"], detail_status="not_modelled_no_fastener_schedule")
        counts["terrace_boards"] += 1
        material_counts[board.data.materials[0].name] += 1

    terrace_skirt_south = create_box(
        "terrace_skirt_south",
        terrace_x1 - terrace_x0,
        mm(28),
        mm(180),
        ((terrace_x0 + terrace_x1) * 0.5, terrace_y0 + mm(14), -mm(90)),
        terrace_frame_material(),
        collection,
    )
    assign_metadata(terrace_skirt_south, category="terrace", element_type="terrace_visible_skirt", detail_status="not_modelled_no_fastener_schedule")
    counts["terrace_structure"] += 1
    material_counts[terrace_skirt_south.data.materials[0].name] += 1

    terrace_skirt_east = create_box(
        "terrace_skirt_east",
        mm(28),
        terrace_y1 - terrace_y0,
        mm(180),
        (terrace_x1 - mm(14), (terrace_y0 + terrace_y1) * 0.5, -mm(90)),
        terrace_frame_material(),
        collection,
    )
    assign_metadata(terrace_skirt_east, category="terrace", element_type="terrace_visible_skirt", detail_status="not_modelled_no_fastener_schedule")
    counts["terrace_structure"] += 1
    material_counts[terrace_skirt_east.data.materials[0].name] += 1

    return counts, material_counts


def configure_render(scene: bpy.types.Scene) -> None:
    scene.render.engine = "CYCLES"
    scene.cycles.samples = 48
    scene.cycles.use_adaptive_sampling = True
    scene.cycles.max_bounces = 6
    scene.cycles.use_denoising = True
    scene.render.resolution_x = 1920
    scene.render.resolution_y = 1080
    scene.render.film_transparent = False
    scene.world.use_nodes = True
    nodes = scene.world.node_tree.nodes
    bg = nodes.get("Background")
    if bg:
        bg.inputs[0].default_value = (0.96, 0.97, 0.99, 1.0)
        bg.inputs[1].default_value = 0.72


def add_lighting(collection: bpy.types.Collection, house_length: float, house_width: float, wall_height: float, ridge_z: float) -> None:
    bpy.ops.object.light_add(type="SUN", location=(house_length * 0.35, -house_width * 1.6, ridge_z * 1.6))
    sun = bpy.context.active_object
    sun.name = "GALA_Presentation_Sun"
    sun.rotation_euler = (math.radians(52), 0.0, math.radians(28))
    sun.data.energy = 1.55
    if sun.users_collection:
        for source in list(sun.users_collection):
            source.objects.unlink(sun)
    link_object(collection, sun)

    area_specs = [
        ("GALA_Presentation_Fill", (house_length * 0.25, house_width * 1.65, ridge_z * 0.95), (math.radians(82), 0.0, math.radians(180)), 1800.0, 9.0, 6.0),
        ("GALA_Presentation_Rim", (-house_length * 0.32, -house_width * 0.8, ridge_z * 1.05), (math.radians(74), 0.0, math.radians(-34)), 1200.0, 7.0, 5.0),
        ("GALA_Presentation_TerraceFill", (house_length * 0.44, house_width * 1.2, wall_height * 0.7), (math.radians(88), 0.0, math.radians(180)), 700.0, 5.0, 4.0),
    ]
    for name, location, rotation, energy, size_x, size_y in area_specs:
        bpy.ops.object.light_add(type="AREA", location=location, rotation=rotation)
        light = bpy.context.active_object
        light.name = name
        light.data.energy = energy
        light.data.shape = "RECTANGLE"
        light.data.size = size_x
        light.data.size_y = size_y
        if light.users_collection:
            for source in list(light.users_collection):
                source.objects.unlink(light)
        link_object(collection, light)


def object_bounds(objects: list[bpy.types.Object]) -> tuple[Vector, Vector]:
    mins = Vector((float("inf"), float("inf"), float("inf")))
    maxs = Vector((float("-inf"), float("-inf"), float("-inf")))
    for obj in objects:
        for corner in obj.bound_box:
            world = obj.matrix_world @ Vector(corner)
            mins.x = min(mins.x, world.x)
            mins.y = min(mins.y, world.y)
            mins.z = min(mins.z, world.z)
            maxs.x = max(maxs.x, world.x)
            maxs.y = max(maxs.y, world.y)
            maxs.z = max(maxs.z, world.z)
    return mins, maxs


def create_camera(name: str, location: Vector, target: Vector, lens_mm: float, collection: bpy.types.Collection) -> bpy.types.Object:
    camera_data = bpy.data.cameras.new(name)
    camera_data.lens = lens_mm
    camera = bpy.data.objects.new(name, camera_data)
    camera.location = location
    direction = target - location
    camera.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    link_object(collection, camera)
    return camera


def render_views(collection: bpy.types.Collection) -> list[dict[str, object]]:
    scene = bpy.context.scene
    mesh_objects = [
        obj
        for obj in collection.objects
        if obj.type == "MESH" and str(obj.get("category", "")) in {"facade", "roof", "openings", "terrace"}
    ]
    mins, maxs = object_bounds(mesh_objects)
    size = maxs - mins
    terrace_objects = [obj for obj in mesh_objects if str(obj.get("category", "")) == "terrace"]
    terrace_mins, terrace_maxs = object_bounds(terrace_objects)
    terrace_center = (terrace_mins + terrace_maxs) * 0.5

    views = [
        (
            "front",
            Vector((((mins.x + maxs.x) * 0.5), mins.y - size.y * 1.72, mins.z + size.z * 0.54)),
            Vector((((mins.x + maxs.x) * 0.5), mins.y + size.y * 0.20, mins.z + size.z * 0.38)),
            42.0,
        ),
        (
            "three_quarter",
            Vector((mins.x - size.x * 0.28, mins.y - size.y * 0.86, mins.z + size.z * 0.76)),
            Vector((mins.x + size.x * 0.34, mins.y + size.y * 0.32, mins.z + size.z * 0.50)),
            46.0,
        ),
        (
            "terrace_closeup",
            Vector((terrace_center.x + size.x * 0.10, terrace_maxs.y + size.y * 0.12, mins.z + size.z * 0.24)),
            Vector((terrace_center.x + size.x * 0.02, terrace_center.y - size.y * 0.04, mins.z + size.z * 0.18)),
            40.0,
        ),
    ]

    results: list[dict[str, object]] = []
    for view_name, location, target, lens in views:
        camera = create_camera(f"GALA_{view_name}_Camera", location, target, lens, collection)
        scene.camera = camera
        output_path = OUTPUT_DIR / f"GALA_blender_{view_name}.png"
        scene.render.filepath = str(output_path)
        bpy.ops.render.render(write_still=True)
        results.append(
            {
                "view": view_name,
                "path": str(output_path),
                "size_bytes": output_path.stat().st_size,
                "camera_location_m": [round(float(value), 6) for value in camera.location],
                "camera_rotation_deg": [round(math.degrees(float(value)), 6) for value in camera.rotation_euler],
                "camera_target_m": [round(float(value), 6) for value in target],
                "camera_lens_mm": lens,
            }
        )
    return results


def write_report(counts: Counter, material_counts: Counter, renders: list[dict[str, object]]) -> None:
    payload = {
        "status": "passed",
        "blend_file": str(BLEND_PATH),
        "presentation_collection": PRESENTATION_COLLECTION,
        "visible_object_count": int(sum(counts.values())),
        "visible_element_type_counts": dict(counts),
        "material_assignment_counts": dict(material_counts),
        "renders": renders,
        "out_of_scope": {
            "fasteners": "not_modelled_no_fastener_schedule",
            "truss_gusset_screw_patterns": "requires_engineer_or_manufacturer_data",
            "manufacturer_window_door_fixings": "requires_engineer_or_manufacturer_data",
            "roof_panel_fastener_schedule": "requires_engineer_or_manufacturer_data",
            "truss_node_structural_approval": "requires_engineer_or_manufacturer_data",
        },
    }
    REPORT_PATH.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print(json.dumps(payload, indent=2))


def main() -> None:
    ensure_dirs()
    clear_scene()
    collection = get_or_create_collection(PRESENTATION_COLLECTION)
    counts, material_counts = build_house()

    config = load_json_config(CONFIG_PATH)
    wall_height = mm(config["modules"]["wall_frame_height"])
    ridge_z = wall_height + mm(float(config["roof"]["trusses"]["ridge_rise"])) - mm(36)
    configure_render(bpy.context.scene)
    add_lighting(collection, mm(config["project"]["house_wall_envelope"][0]), mm(config["project"]["house_wall_envelope"][1]), wall_height, ridge_z)

    renders = render_views(collection)
    bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_PATH))
    write_report(counts, material_counts, renders)


if __name__ == "__main__":
    main()
