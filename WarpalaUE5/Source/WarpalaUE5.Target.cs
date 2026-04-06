using UnrealBuildTool;
using System.Collections.Generic;

public class WarpalaUE5Target : TargetRules
{
    public WarpalaUE5Target(TargetInfo Target) : base(Target)
    {
        Type = TargetType.Game;
        DefaultBuildSettings = BuildSettingsVersion.Latest;
        ExtraModuleNames.AddRange(new string[] { "WarpalaUE5", "WarpalaExpo", "WarpalaCity", "WarpalaNetworking", "WarpalaAI", "WarpalaTraffic", "WarpalaSimulation" });
    }
}
