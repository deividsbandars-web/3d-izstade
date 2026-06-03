import os

import unreal


MAP_PATH = "/Game/Warpala/Maps/Booth_Showroom_Main"
TAG = "WarpalaCommercialShowroomPolish"
MATERIALS_PATH = "/Game/Warpala/Materials"


def load_asset(path):
    asset = unreal.EditorAssetLibrary.load_asset(path)
    if not asset:
        unreal.log_warning(f"[showroom-polish] Missing asset: {path}")
    return asset


def set_actor_tags(actor):
    actor.tags = [TAG]


def set_editor_property_safe(target, property_name, value):
    try:
        target.set_editor_property(property_name, value)
        return True
    except Exception as exc:
        unreal.log_warning(f"[showroom-polish] Could not set {property_name}: {exc}")
        return False


def set_vector_parameter_safe(material, parameter_name, color):
    try:
        unreal.MaterialEditingLibrary.set_material_instance_vector_parameter_value(
            material,
            parameter_name,
            color,
        )
        return True
    except Exception as exc:
        unreal.log_warning(f"[showroom-polish] Could not set material parameter {parameter_name}: {exc}")
        return False


def ensure_material(name, color):
    unreal.EditorAssetLibrary.make_directory(MATERIALS_PATH)
    material_path = f"{MATERIALS_PATH}/{name}"
    material = unreal.EditorAssetLibrary.load_asset(material_path)
    parent = load_asset("/Engine/BasicShapes/BasicShapeMaterial.BasicShapeMaterial")

    if not material:
        factory = unreal.MaterialInstanceConstantFactoryNew()
        asset_tools = unreal.AssetToolsHelpers.get_asset_tools()
        material = asset_tools.create_asset(name, MATERIALS_PATH, unreal.MaterialInstanceConstant, factory)

    if material and parent:
        set_editor_property_safe(material, "parent", parent)
        set_vector_parameter_safe(material, "Color", color)
        set_vector_parameter_safe(material, "BaseColor", color)
        unreal.EditorAssetLibrary.save_loaded_asset(material)

    return material


def spawn_actor(actor_class, label, location, rotation=None, scale=None):
    rotation = rotation or unreal.Rotator(0, 0, 0)
    actor = unreal.EditorLevelLibrary.spawn_actor_from_class(actor_class, location, rotation)
    actor.set_actor_label(label)
    if scale:
        actor.set_actor_scale3d(scale)
    set_actor_tags(actor)
    return actor


def spawn_mesh(label, mesh, location, scale, rotation=None, material=None):
    actor = spawn_actor(unreal.StaticMeshActor, label, location, rotation, scale)
    component = actor.get_component_by_class(unreal.StaticMeshComponent)
    if mesh and component:
        component.set_static_mesh(mesh)
        if material:
            component.set_material(0, material)
    return actor


def spawn_light(actor_class, label, location, rotation, intensity, color, attenuation=None):
    actor = spawn_actor(actor_class, label, location, rotation)
    component = actor.get_component_by_class(unreal.LightComponent)
    if component:
        set_editor_property_safe(component, "intensity", intensity)
        set_editor_property_safe(component, "light_color", color)
        if attenuation:
            set_editor_property_safe(component, "attenuation_radius", attenuation)
    return actor


def spawn_text(label, text, location, rotation, size=42):
    actor = spawn_actor(unreal.TextRenderActor, label, location, rotation)
    component = actor.get_component_by_class(unreal.TextRenderComponent)
    if component:
        component.set_text(text)
        set_editor_property_safe(component, "world_size", size)
        set_editor_property_safe(component, "text_render_color", unreal.Color(112, 234, 255, 255))
    return actor


def clear_previous_polish():
    removed = 0
    for actor in unreal.EditorLevelLibrary.get_all_level_actors():
        if actor.actor_has_tag(TAG):
            unreal.EditorLevelLibrary.destroy_actor(actor)
            removed += 1
    unreal.log(f"[showroom-polish] Removed {removed} previous polish actors.")


def apply_showroom_polish():
    level_subsystem = unreal.get_editor_subsystem(unreal.LevelEditorSubsystem)
    level_subsystem.load_level(MAP_PATH)

    cube = load_asset("/Engine/BasicShapes/Cube.Cube")
    cylinder = load_asset("/Engine/BasicShapes/Cylinder.Cylinder")
    sphere = load_asset("/Engine/BasicShapes/Sphere.Sphere")

    mat_graphite = ensure_material("MI_Showroom_Graphite", unreal.LinearColor(0.035, 0.048, 0.075, 1.0))
    mat_deep_blue = ensure_material("MI_Showroom_Deep_Blue", unreal.LinearColor(0.02, 0.105, 0.18, 1.0))
    mat_cyan = ensure_material("MI_Showroom_Cyan_Accent", unreal.LinearColor(0.0, 0.76, 1.0, 1.0))
    mat_gold = ensure_material("MI_Showroom_Gold_Accent", unreal.LinearColor(1.0, 0.62, 0.18, 1.0))
    mat_glass = ensure_material("MI_Showroom_Soft_Glass", unreal.LinearColor(0.34, 0.72, 1.0, 1.0))

    clear_previous_polish()

    # Compact commercial set dressing: high-value product pedestal, light rails and sponsor signage.
    spawn_mesh(
        "WARPALA_Showroom_Back_Wall",
        cube,
        unreal.Vector(-304, 0, 178),
        unreal.Vector(0.18, 5.8, 1.95),
        None,
        mat_deep_blue,
    )
    spawn_mesh(
        "WARPALA_Showroom_Floor_Catwalk",
        cube,
        unreal.Vector(95, 0, 6),
        unreal.Vector(5.6, 0.72, 0.035),
        None,
        mat_graphite,
    )
    spawn_mesh(
        "WARPALA_Showroom_Floor_Centerline",
        cube,
        unreal.Vector(95, 0, 13),
        unreal.Vector(5.65, 0.035, 0.035),
        None,
        mat_cyan,
    )
    spawn_mesh(
        "WARPALA_Showroom_Left_Showcase_Column",
        cube,
        unreal.Vector(-110, -318, 136),
        unreal.Vector(0.22, 0.18, 1.35),
        None,
        mat_cyan,
    )
    spawn_mesh(
        "WARPALA_Showroom_Right_Showcase_Column",
        cube,
        unreal.Vector(-110, 318, 136),
        unreal.Vector(0.22, 0.18, 1.35),
        None,
        mat_gold,
    )
    spawn_mesh(
        "WARPALA_Showroom_Product_Pedestal",
        cylinder,
        unreal.Vector(0, 0, 42),
        unreal.Vector(2.2, 2.2, 0.28),
        None,
        mat_graphite,
    )
    spawn_mesh(
        "WARPALA_Showroom_Product_Core",
        sphere,
        unreal.Vector(0, 0, 118),
        unreal.Vector(0.72, 0.72, 0.72),
        None,
        mat_glass,
    )
    spawn_mesh(
        "WARPALA_Showroom_Product_Halo",
        cylinder,
        unreal.Vector(0, 0, 152),
        unreal.Vector(1.32, 1.32, 0.025),
        None,
        mat_cyan,
    )
    spawn_mesh(
        "WARPALA_Showroom_Back_Sponsor_Rail",
        cube,
        unreal.Vector(-280, 0, 180),
        unreal.Vector(0.12, 5.2, 0.14),
        None,
        mat_gold,
    )
    spawn_mesh(
        "WARPALA_Showroom_Left_Light_Rail",
        cube,
        unreal.Vector(-20, -260, 220),
        unreal.Vector(4.8, 0.08, 0.08),
        None,
        mat_cyan,
    )
    spawn_mesh(
        "WARPALA_Showroom_Right_Light_Rail",
        cube,
        unreal.Vector(-20, 260, 220),
        unreal.Vector(4.8, 0.08, 0.08),
        None,
        mat_cyan,
    )
    spawn_mesh(
        "WARPALA_Showroom_CTA_Panel",
        cube,
        unreal.Vector(96, 250, 104),
        unreal.Vector(1.9, 0.08, 0.68),
        None,
        mat_deep_blue,
    )
    spawn_mesh(
        "WARPALA_Showroom_CTA_Panel_Rail",
        cube,
        unreal.Vector(96, 244, 166),
        unreal.Vector(1.9, 0.055, 0.055),
        None,
        mat_gold,
    )

    spawn_light(
        unreal.RectLight,
        "WARPALA_Showroom_Hero_RectLight",
        unreal.Vector(180, 0, 260),
        unreal.Rotator(-25, 180, 0),
        1400,
        unreal.Color(112, 230, 255, 255),
        560,
    )
    spawn_light(
        unreal.SpotLight,
        "WARPALA_Showroom_Product_Spotlight",
        unreal.Vector(260, -190, 320),
        unreal.Rotator(-45, 145, 0),
        2200,
        unreal.Color(255, 198, 122, 255),
        700,
    )
    spawn_light(
        unreal.PointLight,
        "WARPALA_Showroom_Fill_Light",
        unreal.Vector(-220, 220, 180),
        unreal.Rotator(0, 0, 0),
        420,
        unreal.Color(82, 132, 255, 255),
        650,
    )

    spawn_text(
        "WARPALA_Showroom_Title",
        "SPONSOR CONCIERGE",
        unreal.Vector(-286, 0, 232),
        unreal.Rotator(0, 90, 0),
        34,
    )
    spawn_text(
        "WARPALA_Showroom_Subtitle",
        "Premium booth stream",
        unreal.Vector(-286, 0, 192),
        unreal.Rotator(0, 90, 0),
        22,
    )
    spawn_text(
        "WARPALA_Showroom_CTA_Header",
        "MEETINGS + LEAD REPORT",
        unreal.Vector(96, 240, 138),
        unreal.Rotator(0, 180, 0),
        18,
    )
    spawn_text(
        "WARPALA_Showroom_CTA_Copy",
        "Product demo  |  Sponsor walk-through",
        unreal.Vector(96, 240, 102),
        unreal.Rotator(0, 180, 0),
        13,
    )

    camera = spawn_actor(
        unreal.CineCameraActor,
        "WARPALA_Showroom_Commercial_Camera",
        unreal.Vector(500, -410, 215),
        unreal.Rotator(-10, 136, 0),
    )
    camera_component = camera.get_component_by_class(unreal.CineCameraComponent)
    if camera_component:
        set_editor_property_safe(camera_component, "current_focal_length", 28.0)
        set_editor_property_safe(camera_component, "current_aperture", 3.5)

    unreal.EditorLevelLibrary.save_current_level()
    unreal.log("[showroom-polish] Sponsor Concierge showroom polish applied and level saved.")

    if os.environ.get("WARPALA_SHOWROOM_POLISH_QUIT") == "1":
        unreal.SystemLibrary.quit_editor()


if __name__ == "__main__":
    apply_showroom_polish()
