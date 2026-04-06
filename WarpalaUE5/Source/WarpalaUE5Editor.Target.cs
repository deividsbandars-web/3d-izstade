using UnrealBuildTool;
using System.Collections.Generic;

public class WarpalaUE5EditorTarget : TargetRules
{
    public WarpalaUE5EditorTarget(TargetInfo Target) : base(Target)
    {
        Type = TargetType.Editor;
        DefaultBuildSettings = BuildSettingsVersion.Latest;
        ExtraModuleNames.AddRange(new string[] { "WarpalaUE5", "WarpalaExpo", "WarpalaCity", "WarpalaNetworking", "WarpalaAI", "WarpalaTraffic", "WarpalaSimulation" });
    }
}
