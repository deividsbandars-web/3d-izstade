export const MODULES = ["renovation", "roadworks", "real_estate", "autoservice", "marketing"] as const;

export const CALCULATOR_DOMAIN_CONTRACT_VERSION = "calculator-domain-v1-canonical" as const;

export const CALCULATOR_DOMAIN_CATEGORIES = [
  "heating",
  "roof",
  "foundation",
  "renovation",
  "timber_house",
  "windows",
  "visuals",
  "digital_art",
  "autoservice",
  "cleaning",
  "quick_fix",
  "plumbing",
  "designer",
  "interior",
  "housing",
  "logistics"
] as const;

export type CalculatorCategoryId = (typeof CALCULATOR_DOMAIN_CATEGORIES)[number];

export interface CalculatorDomainContractShape {
  version: typeof CALCULATOR_DOMAIN_CONTRACT_VERSION;
  categories: readonly CalculatorCategoryId[];
  primaryCurrency: "EUR";
  supportedExecutionModes: readonly ["domain-engine", "legacy-adapter"];
}

export const CALCULATOR_DOMAIN_CONTRACT: CalculatorDomainContractShape = {
  version: CALCULATOR_DOMAIN_CONTRACT_VERSION,
  categories: CALCULATOR_DOMAIN_CATEGORIES,
  primaryCurrency: "EUR",
  supportedExecutionModes: ["domain-engine", "legacy-adapter"]
} as const;

export interface CalculatorCategoryDefinition {
  id: CalculatorCategoryId;
  label: string;
  executionMode: "domain-engine" | "legacy-adapter";
  ownerModule: string;
}

export const CALCULATOR_CATEGORY_DEFINITIONS: readonly CalculatorCategoryDefinition[] = [
  { id: "heating", label: "Heating Systems", executionMode: "domain-engine", ownerModule: "src/services/calculators/heating.ts" },
  { id: "roof", label: "Roof", executionMode: "legacy-adapter", ownerModule: "src/services/calculators/roof.ts" },
  { id: "foundation", label: "Foundation", executionMode: "legacy-adapter", ownerModule: "src/modules/calculators/FoundationCalc.tsx" },
  { id: "renovation", label: "Renovation", executionMode: "legacy-adapter", ownerModule: "src/services/calculators/renovation.ts" },
  { id: "timber_house", label: "Timber House", executionMode: "legacy-adapter", ownerModule: "src/modules/calculators/TimberHouseCalc.tsx" },
  { id: "windows", label: "Windows", executionMode: "legacy-adapter", ownerModule: "src/modules/calculators/WindowsCalc.tsx" },
  { id: "visuals", label: "Visuals", executionMode: "legacy-adapter", ownerModule: "src/modules/calculators/VisualsCalc.tsx" },
  { id: "digital_art", label: "Digital Art", executionMode: "legacy-adapter", ownerModule: "src/modules/calculators/DigitalArtCalc.tsx" },
  { id: "autoservice", label: "Autoservice", executionMode: "legacy-adapter", ownerModule: "src/services/calculators/autoservice.ts" },
  { id: "cleaning", label: "Cleaning", executionMode: "legacy-adapter", ownerModule: "src/services/calculators/cleaning.ts" },
  { id: "quick_fix", label: "Quick Fix", executionMode: "legacy-adapter", ownerModule: "src/modules/calculators/QuickFixCalc.tsx" },
  { id: "plumbing", label: "Plumbing", executionMode: "legacy-adapter", ownerModule: "src/services/calculators/plumbing.ts" },
  { id: "designer", label: "Designer", executionMode: "legacy-adapter", ownerModule: "src/modules/calculators/DesignerCalc.tsx" },
  { id: "interior", label: "Interior", executionMode: "legacy-adapter", ownerModule: "src/modules/calculators/InteriorCalc.tsx" },
  { id: "housing", label: "Housing", executionMode: "legacy-adapter", ownerModule: "src/modules/calculators/HousingCalc.tsx" },
  { id: "logistics", label: "Logistics", executionMode: "legacy-adapter", ownerModule: "src/modules/calculators/LogisticsCalc.tsx" }
] as const;

export const OBJECT_TYPES = [
  "maja", "dzivoklis", "garaza", "angars", "skunis", "komercelpas", "industrialie_objekti", 
  "koplietojamas_telpas", "valsts_objekts", "daudzstavu_maja", "ciematu_projekts", "pagrabs", 
  "lievenis", "kapnu_telpa", "piebraucamais_cels", "rotallaukums", "automasina", "cits"
] as const;

export const LOCATION_OPTIONS = ["riga_centrs", "riga_rajoni", "pieriga", "latvija_regioni", "cits"] as const;
export const ACCESS_LEVELS = ["erti", "ierobezota", "nav_piebrauksanas"] as const;
export const COMPLEXITY_LEVELS = ["standarta", "paaugstinats", "sarezgits"] as const;
export const DEADLINE_LEVELS = ["standarta", "paatrinats", "steidzami"] as const;
export const REPAIR_TYPES = ["kosmetisks", "eiro", "kapitalais"] as const;
export const QUALITY_LEVELS = ["ekonomiska", "standarta", "augsta", "premium"] as const;

export const WORK_UNITS = ["m", "km", "m2", "m3", "kg", "t", "gab", "h", "d", "st", "proc", "komplekts", "kw"] as const;
export type WorkUnit = (typeof WORK_UNITS)[number];

export const ESTIMATOR_SECTIONS = [
  { id: "object_location", title: "Objekts un lokācija", priority: 10 },
  { id: "prep_demolition", title: "Sagatavošana / demontāža", priority: 20 },
  { id: "structures", title: "Būvdarbi / konstrukcijas", priority: 30 },
  { id: "engineering", title: "Inženiertehniskie tīkli", priority: 40 },
  { id: "finishing", title: "Iekšējā apdare", priority: 50 },
  { id: "autoservice", title: "Auto serviss un apkope", priority: 60 },
  { id: "agent_services", title: "Aģenta un mārketinga pakalpojumi", priority: 70 },
] as const;

export interface CalculatorInput {
  mode: "client" | "agent";
  module: (typeof MODULES)[number];
  objectType: (typeof OBJECT_TYPES)[number];
  location: (typeof LOCATION_OPTIONS)[number];
  repairType: (typeof REPAIR_TYPES)[number];
  qualityLevel: (typeof QUALITY_LEVELS)[number];
  complexityLevel: (typeof COMPLEXITY_LEVELS)[number];
  accessLevel: (typeof ACCESS_LEVELS)[number];
  deadlineLevel: (typeof DEADLINE_LEVELS)[number];
  floorAreaM2: number;
  roomsCount: number;
  doorCount: number;
  windowCount: number;
  fullName: string;
  email: string;
  phone: string;
}

export interface EstimateLineItem {
  sectionId: (typeof ESTIMATOR_SECTIONS)[number]["id"];
  group: string;
  position: string;
  quantity: number;
  unit: WorkUnit;
  unitPrice: number;
  costPrice: number; // Aģenta pašizmaksa
  sum: number;
  profit: number; // Aģenta peļņa
  kind: "work" | "material" | "service";
}

export interface EstimateResult {
  totalEstimate: number;
  totalCost: number; // Kopējā pašizmaksa (tikai aģentam)
  totalProfit: number; // Kopējā peļņa (tikai aģentam)
  lineItems: EstimateLineItem[];
}

// Reālie koeficienti no PRO dzinēja
const objectMultiplier: Record<(typeof OBJECT_TYPES)[number], number> = {
  maja: 1.08, dzivoklis: 1, garaza: 0.72, angars: 0.88, skunis: 0.65, komercelpas: 1.22,
  industrialie_objekti: 1.35, koplietojamas_telpas: 1.24, valsts_objekts: 1.32,
  daudzstavu_maja: 1.28, ciematu_projekts: 1.16, pagrabs: 0.82, lievenis: 0.74,
  kapnu_telpa: 0.94, piebraucamais_cels: 0.96, rotallaukums: 0.9, automasina: 1, cits: 1
};

const repairLaborRate: Record<(typeof REPAIR_TYPES)[number], number> = {
  kosmetisks: 36, eiro: 58, kapitalais: 88
};

const qualityMultiplier: Record<(typeof QUALITY_LEVELS)[number], number> = {
  ekonomiska: 0.84, standarta: 1, augsta: 1.18, premium: 1.38
};

export function calculateEstimate(input: CalculatorInput): EstimateResult {
  const objMult = objectMultiplier[input.objectType] || 1;
  const qualMult = qualityMultiplier[input.qualityLevel] || 1;
  const siteMult = 1.1; // Vidējais lokācijas/piekļuves koeficients
  
  const baseRate = repairLaborRate[input.repairType] * objMult * qualMult * siteMult;
  const margin = 0.25; // Aģenta 25% uzcenojums

  const lineItems: EstimateLineItem[] = [];

  // 1. Būvdarbi (ja attiecas)
  if (["renovation", "real_estate"].includes(input.module)) {
    const price = baseRate;
    const cost = price * (1 - margin);
    lineItems.push({
      sectionId: "structures",
      group: "Būvdarbi",
      position: `Remonta bāzes darbi (${input.repairType})`,
      quantity: input.floorAreaM2,
      unit: "m2",
      unitPrice: price,
      costPrice: cost,
      sum: input.floorAreaM2 * price,
      profit: input.floorAreaM2 * (price - cost),
      kind: "work"
    });
  }

  // 2. Autoserviss (ja attiecas)
  if (input.module === "autoservice") {
    const hourlyRate = 45 * qualMult;
    const cost = hourlyRate * (1 - margin);
    lineItems.push({
      sectionId: "autoservice",
      group: "Serviss",
      position: "Auto diagnostika un remonts",
      quantity: 5, // Pieņemtas 5 stundas
      unit: "h",
      unitPrice: hourlyRate,
      costPrice: cost,
      sum: 5 * hourlyRate,
      profit: 5 * (hourlyRate - cost),
      kind: "work"
    });
  }

  // 3. Aģenta pakalpojumi (Mārketings no cenas_import.csv)
  if (input.module === "marketing") {
    const marketingServices = [
      { name: "Video montāža (Reel)", price: 25 },
      { name: "TikTok video edits", price: 30 },
      { name: "Pilna landing lapa", price: 350 }
    ];

    marketingServices.forEach(service => {
      const price = service.price;
      const cost = price * 0.6; // Aģenta pašizmaksa 60%
      lineItems.push({
        sectionId: "agent_services",
        group: "Mārketings",
        position: service.name,
        quantity: 1,
        unit: "gab",
        unitPrice: price,
        costPrice: cost,
        sum: price,
        profit: price - cost,
        kind: "service"
      });
    });
  }

  const totalEstimate = lineItems.reduce((sum, item) => sum + item.sum, 0);
  const totalCost = lineItems.reduce((sum, item) => sum + (item.costPrice * item.quantity), 0);
  const totalProfit = lineItems.reduce((sum, item) => sum + item.profit, 0);

  return {
    totalEstimate,
    totalCost,
    totalProfit,
    lineItems
  };
}
