import type { CalculatorCategoryId } from "../../core/calculator";
import { HEATING_DOMAIN_DEFINITION } from "./heating";

export interface CalculatorDomainEngineRegistration {
  category: CalculatorCategoryId;
  executionMode: "domain-engine" | "legacy-adapter";
  owner: string;
}

export const CALCULATOR_DOMAIN_ENGINE_REGISTRY: readonly CalculatorDomainEngineRegistration[] = [
  {
    category: HEATING_DOMAIN_DEFINITION.category,
    executionMode: "domain-engine",
    owner: "src/services/calculators/heating.ts"
  },
  { category: "roof", executionMode: "legacy-adapter", owner: "src/services/calculators/roof.ts" },
  { category: "renovation", executionMode: "legacy-adapter", owner: "src/services/calculators/renovation.ts" },
  { category: "autoservice", executionMode: "legacy-adapter", owner: "src/services/calculators/autoservice.ts" },
  { category: "cleaning", executionMode: "legacy-adapter", owner: "src/services/calculators/cleaning.ts" },
  { category: "plumbing", executionMode: "legacy-adapter", owner: "src/services/calculators/plumbing.ts" }
] as const;

export { HEATING_DOMAIN_DEFINITION, calculateHeatingEstimate } from "./heating";
