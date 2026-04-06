using UnrealBuildTool;

public class WarpalaUE5 : ModuleRules
{
    public WarpalaUE5(ReadOnlyTargetRules Target) : base(Target)
    {
        PCHUsage = PCHUsageMode.UseExplicitOrSharedPCHs;
        IncludeOrderVersion = EngineIncludeOrderVersion.Latest;

        PublicDependencyModuleNames.AddRange(new string[]
        {
            "Core",
            "CoreUObject",
            "Engine",
            "InputCore",
            "WarpalaExpo",
            "WarpalaCity",
            "WarpalaNetworking",
            "WarpalaAI",
            "WarpalaTraffic",
            "WarpalaSimulation"
        });
    }
}
