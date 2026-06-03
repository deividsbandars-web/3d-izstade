import os

import unreal


MAP_PATH = "/Game/Warpala/Maps/Booth_Showroom_Main"
TAG = "WarpalaCommercialShowroomPolish"


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


def spawn_actor(actor_class, label, location, rotation=None, scale=None):
    rotation = rotation or unreal.Rotator(0, 0, 0)
    actor = unreal.EditorLevelLibrary.spawn_actor_from_class(actor_class, location, rotation)
    actor.set_actor_label(label)
    if scale:
        actor.set_actor_scale3d(scale)
    set_actor_tags(actor)
    return actor


def spawn_mesh(label, mesh, location, scale, rotation=None):
    actor = spawn_actor(unreal.StaticMeshActor, label, location, rotation, scale)
    component = actor.get_component_by_class(unreal.StaticMeshComponent)
    if mesh and component:
        component.set_static_mesh(mesh)
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
        try:
            set_editor_property_safe(component, "horizontal_alignment", unreal.HorizontalTextAligment.EHTA_CENTER)
            set_editor_property_safe(component, "vertical_alignment", unreal.VerticalTextAligment.EVRTA_TEXT_CENTER)
        except Exception as exc:
            unreal.log_warning(f"[showroom-polish] Text alignment skipped: {exc}")
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

    clear_previous_polish()

    # Compact commercial set dressing: high-value product pedestal, light rails and sponsor signage.
    spawn_mesh(
        "WARPALA_Showroom_Product_Pedestal",
        cylinder,
        unreal.Vector(0, 0, 42),
        unreal.Vector(2.2, 2.2, 0.28),
    )
    spawn_mesh(
        "WARPALA_Showroom_Product_Core",
        sphere,
        unreal.Vector(0, 0, 118),
        unreal.Vector(0.72, 0.72, 0.72),
    )
    spawn_mesh(
        "WARPALA_Showroom_Back_Sponsor_Rail",
        cube,
        unreal.Vector(-280, 0, 180),
        unreal.Vector(0.12, 5.2, 0.14),
    )
    spawn_mesh(
        "WARPALA_Showroom_Left_Light_Rail",
        cube,
        unreal.Vector(-20, -260, 220),
        unreal.Vector(4.8, 0.08, 0.08),
    )
    spawn_mesh(
        "WARPALA_Showroom_Right_Light_Rail",
        cube,
        unreal.Vector(-20, 260, 220),
        unreal.Vector(4.8, 0.08, 0.08),
    )

    spawn_light(
        unreal.RectLight,
        "WARPALA_Showroom_Hero_RectLight",
        unreal.Vector(180, 0, 260),
        unreal.Rotator(-25, 180, 0),
        1400,
        unreal.LinearColor(0.45, 0.9, 1.0, 1.0),
        560,
    )
    spawn_light(
        unreal.SpotLight,
        "WARPALA_Showroom_Product_Spotlight",
        unreal.Vector(260, -190, 320),
        unreal.Rotator(-45, 145, 0),
        2200,
        unreal.LinearColor(1.0, 0.78, 0.48, 1.0),
        700,
    )
    spawn_light(
        unreal.PointLight,
        "WARPALA_Showroom_Fill_Light",
        unreal.Vector(-220, 220, 180),
        unreal.Rotator(0, 0, 0),
        420,
        unreal.LinearColor(0.32, 0.52, 1.0, 1.0),
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

    camera = spawn_actor(
        unreal.CineCameraActor,
        "WARPALA_Showroom_Commercial_Camera",
        unreal.Vector(430, -360, 205),
        unreal.Rotator(-12, 138, 0),
    )
    camera_component = camera.get_component_by_class(unreal.CineCameraComponent)
    if camera_component:
        set_editor_property_safe(camera_component, "current_focal_length", 24.0)
        set_editor_property_safe(camera_component, "current_aperture", 4.0)

    unreal.EditorLevelLibrary.save_current_level()
    unreal.log("[showroom-polish] Sponsor Concierge showroom polish applied and level saved.")

    if os.environ.get("WARPALA_SHOWROOM_POLISH_QUIT") == "1":
        unreal.SystemLibrary.quit_editor()


if __name__ == "__main__":
    apply_showroom_polish()
