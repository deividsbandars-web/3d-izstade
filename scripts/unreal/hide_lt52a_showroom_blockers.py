from __future__ import annotations

import unreal


LEVEL_PATH = "/Game/ModularHome/LT52A/Maps/LT52A_Showroom"
TOKENS = [
    "lt52a_showroom_backdrop",
    "lt52a_showroom_leftwing",
    "lt52a_showroom_rightwing",
    "lt52a_sm_lt52a_entry_bench",
    "lt52a_sm_lt52a_technical_",
]


def main():
    unreal.EditorLevelLibrary.load_level(LEVEL_PATH)
    hidden = 0
    for actor in unreal.EditorLevelLibrary.get_all_level_actors():
        label = actor.get_actor_label().lower()
        if any(token in label for token in TOKENS):
            try:
                actor.set_is_temporarily_hidden_in_editor(True)
            except Exception:
                pass
            try:
                actor.set_actor_hidden_in_game(True)
            except Exception:
                pass
            hidden += 1
    unreal.EditorLevelLibrary.editor_invalidate_viewports()
    unreal.log(f"[LT52A-HIDE-BLOCKERS] hidden={hidden}")


if __name__ == "__main__":
    main()
