export interface Product {
  id: string;
  name: string;
  price: number;
  quality: number;
  margin: number;
}

export interface CityEconomy {
  id: string;
  name: string;
  nicheDemand: Record<string, number>;
  stability: number;
  taxRate: number;
}

export interface CityPresence {
  cityId: string;
  localMarketingPower: number; // 0 to 1
  isSalesActive: boolean;
}

export interface AICompany {
  id: string;
  name: string;
  niche: string;
  products: Product[];
  revenue: number;
  totalProfit: number;
  cash: number;
  stage: 'idea' | 'production' | 'marketing' | 'sales';
  activeOffer: string | null;
  hqCityId: string;
  branches: CityPresence[]; // Detailed city presence
}

export interface GlobalMarketState {
  cycle: number;
  cities: CityEconomy[];
  companies: AICompany[];
  logs: string[];
  globalTrends: Record<string, number>;
}

export const economySimulator = {
  /**
   * Initializes a global market with multiple cities.
   */
  initializeGlobalMarket(): GlobalMarketState {
    const cities: CityEconomy[] = [
      { 
        id: 'city-riga', 
        name: 'Riga Expo City', 
        nicheDemand: { "AI Automation": 50000, "Green Tech": 30000, "Biohacking": 20000 },
        stability: 1.1,
        taxRate: 0.2
      },
      { 
        id: 'city-london', 
        name: 'London Neo-District', 
        nicheDemand: { "AI Automation": 150000, "Green Tech": 100000, "Biohacking": 90000 },
        stability: 0.95,
        taxRate: 0.25
      },
      { 
        id: 'city-tokyo', 
        name: 'Tokyo Cyber-Halla', 
        nicheDemand: { "AI Automation": 200000, "Green Tech": 120000, "Biohacking": 150000 },
        stability: 1.05,
        taxRate: 0.15
      },
      { 
        id: 'city-nyc', 
        name: 'New York Warp-Core', 
        nicheDemand: { "AI Automation": 300000, "Green Tech": 200000, "Biohacking": 180000 },
        stability: 0.9,
        taxRate: 0.3
      }
    ];

    return {
      cycle: 0,
      cities,
      companies: [],
      globalTrends: { "AI Automation": 1.0, "Green Tech": 1.0, "Biohacking": 1.0 },
      logs: ["[SYSTEM] Global Economy Engine v3 Online. Monitoring market demand..."]
    };
  },

  /**
   * Processes one global economic cycle.
   */
  processCycle(state: GlobalMarketState): GlobalMarketState {
    const nextState = { ...state };
    nextState.cycle += 1;
    nextState.logs = [...state.logs.slice(-25)];

    // 1. Update Global/Local Demand
    Object.keys(nextState.globalTrends).forEach(niche => {
      nextState.globalTrends[niche] *= (0.97 + Math.random() * 0.07);
    });

    nextState.cities.forEach(city => {
      Object.keys(city.nicheDemand).forEach(niche => {
        city.nicheDemand[niche] *= (0.96 + Math.random() * 0.09) * city.stability * nextState.globalTrends[niche];
      });
    });

    // 2. Company Lifecycle & Expansion
    nextState.companies = nextState.companies.map(company => {
      let cycleProfit = 0;
      let cycleRevenue = 0;

      // Stage Progression (Main HQ)
      if (company.stage === 'idea' && company.cash > 2000) {
        company.cash -= 2000;
        company.stage = 'production';
        nextState.logs.push(`[${company.name}] HQ in ${this.getCityName(nextState, company.hqCityId)} started production.`);
      } else if (company.stage === 'production' && company.products.length === 0) {
        company.products = [{
          id: `p-${Date.now()}`,
          name: `${company.niche} Engine`,
          price: 1200 + Math.random() * 800,
          quality: 0.7 + Math.random() * 0.25,
          margin: 0.75
        }];
        company.cash -= 4000;
        company.stage = 'marketing';
      }

      // Branch Operations (Marketing & Sales)
      company.branches.forEach(branch => {
        const city = nextState.cities.find(c => c.id === branch.cityId);
        if (!city) return;

        // Launch Marketing if not yet at sales stage
        if (!branch.isSalesActive) {
          branch.localMarketingPower = Math.min(1, branch.localMarketingPower + 0.2);
          company.cash -= 1000; // Marketing spend
          if (branch.localMarketingPower >= 0.6) {
            branch.isSalesActive = true;
            nextState.logs.push(`🚀 [SALES LIVE] ${company.name} launched in ${city.name}.`);
          }
        } else {
          // Process Sales
          const demand = city.nicheDemand[company.niche] || 0;
          const attractiveness = company.products[0].quality / (company.products[0].price / 2500);
          const competitors = nextState.companies.filter(c => 
            c.niche === company.niche && 
            c.branches.some(b => b.cityId === branch.cityId && b.isSalesActive)
          ).length;
          
          const share = (attractiveness * branch.localMarketingPower / (competitors || 1)) * 0.06;
          const cityRevenue = demand * Math.min(share, 0.35);
          const cityProfit = cityRevenue * company.products[0].margin * (1 - city.taxRate);

          cycleRevenue += cityRevenue;
          cycleProfit += cityProfit;
        }
      });

      company.revenue += cycleRevenue;
      company.totalProfit += cycleProfit;
      company.cash += cycleProfit;

      // 3. Autonomous Demand Detection & Strategic Expansion
      if (company.cash > 25000 && company.stage !== 'idea') {
        this.detectDemandAndExpand(company, nextState);
      }

      return company;
    });

    return nextState;
  },

  /**
   * AI detects highest demand in unentered cities and opens a branch.
   */
  detectDemandAndExpand(company: AICompany, state: GlobalMarketState) {
    const enteredCityIds = company.branches.map(b => b.cityId);
    const availableCities = state.cities
      .filter(city => !enteredCityIds.includes(city.id))
      .sort((a, b) => (b.nicheDemand[company.niche] || 0) - (a.nicheDemand[company.niche] || 0));

    if (availableCities.length > 0) {
      const target = availableCities[0]; // Strategic choice: City with highest demand
      const expansionCost = 10000;
      
      company.cash -= expansionCost;
      company.branches.push({
        cityId: target.id,
        localMarketingPower: 0,
        isSalesActive: false
      });
      
      state.logs.push(`🔍 [STRATEGY] ${company.name} detected high demand in ${target.name}. Branch opening initiated.`);
    }
  },

  getCityName(state: GlobalMarketState, cityId: string): string {
    return state.cities.find(c => c.id === cityId)?.name || 'Unknown';
  },

  async aiCreateCompany(niche: string, name: string, hqCityId: string): Promise<AICompany> {
    return {
      id: `comp-${Date.now()}`,
      name,
      niche,
      products: [],
      revenue: 0,
      totalProfit: 0,
      cash: 15000,
      stage: 'idea',
      activeOffer: null,
      hqCityId,
      branches: [{
        cityId: hqCityId,
        localMarketingPower: 0,
        isSalesActive: false
      }]
    };
  }
};
