from __future__ import annotations

from pathlib import Path

import unreal


LEVEL_PATH = "/Game/ModularHome/LT52A/Maps/LT52A_Showroom"
STATUS_PATH = Path(r"C:\3d\tmp\lt52a_remove_entry_bench_status.txt")


def main():
    unreal.EditorLevelLibrary.load_level(LEVEL_PATH)
    removed = []
    for actor in list(unreal.EditorLevelLibrary.get_all_level_actors()):
        label = actor.get_actor_label()
        lower = label.lower()
        if lower in {
            "lt52a_sm_lt52a_entry_bench",
            "lt52a_sm_lt52a_technical_block",
            "lt52a_sm_lt52a_technical_cabinet",
        }:
            try:
                unreal.EditorLevelLibrary.destroy_actor(actor)
                removed.append(label)
            except Exception:
                try:
                    actor.set_is_temporarily_hidden_in_editor(True)
                    actor.set_actor_hidden_in_game(True)
                    removed.append(f"{label} (hidden)")
                except Exception:
                    removed.append(f"{label} (failed)")
    unreal.EditorLevelLibrary.save_current_level()
    STATUS_PATH.write_text("\n".join(["removed:"] + removed), encoding="utf-8")
    unreal.log(f"[LT52A-REMOVE-ENTRY-BENCH] {removed}")


if __name__ == "__main__":
    main()
