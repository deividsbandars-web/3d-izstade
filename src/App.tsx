import { lazy, Suspense, type ComponentType, type LazyExoticComponent, type ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import { RouteErrorBoundary, RouteLoadingFallback } from './components/RouteErrorBoundary';
import { ENABLE_DEMO_ROUTES } from './config/featureFlags';

// Core un pamata lapas
import Home from './pages/Home';
import Login from './pages/Login';
import ResetPassword from './pages/ResetPassword';
const Privacy = lazy(() => import('./pages/Privacy'));

// ==========================================
// PHASE 15: AI Platform Pages
// ==========================================
const PlatformDashboard = lazy(() => import('./pages/DashboardPage'));
const PlatformLeads = lazy(() => import('./pages/LeadsPage'));
const PlatformMarketplace = lazy(() => import('./pages/MarketplacePage'));
const PlatformExpo = lazy(() => import('./pages/ExpoPage'));
const Onboarding = lazy(() => import('./pages/onboarding/OnboardingPage'));
const WorkflowBuilder = lazy(() => import('./app/workflows/WorkflowBuilder'));

// Moduļu ielāde
const Dashboard = lazy(() => import('./modules/dashboard/Dashboard'));
const ProjectBuilder = lazy(() => import('./modules/projects/ProjectBuilder'));
const CityMap = lazy(() => import('./modules/expo/CityMap'));
const AdminFinance = lazy(() => import('./modules/finance/AdminFinance'));
const StudioMaster = lazy(() => import('./modules/finance/StudioMaster'));
const YoutubeManager = lazy(() => import('./modules/finance/YoutubeManager'));
const Leaderboard = lazy(() => import('./modules/dashboard/Leaderboard'));

// Kalkulatori
const RoofCalculator = lazy(() => import('./modules/calculators/RoofCalc'));
const HeatingCalculator = lazy(() => import('./modules/calculators/HeatingCalc'));
const FoundationCalculator = lazy(() => import('./modules/calculators/FoundationCalc'));
const RenovationCalculator = lazy(() => import('./modules/calculators/InteriorCalc')); 
const TimberHouseCalculator = lazy(() => import('./modules/calculators/TimberHouseCalc'));
const WindowsCalculator = lazy(() => import('./modules/calculators/WindowsCalc'));
const VisualsCalculator = lazy(() => import('./modules/calculators/VisualsCalc'));
const FenceCalculator = lazy(() => import('./modules/calculators/FenceCalc'));
const PavingCalculator = lazy(() => import('./modules/calculators/PavingCalc'));
const FacadeCalculator = lazy(() => import('./modules/calculators/FacadeCalc'));
const FloorCalculator = lazy(() => import('./modules/calculators/FloorCalc'));
const PlumbingCalculator = lazy(() => import('./modules/calculators/PlumbingCalc'));
const CalculatorLeadInbox = lazy(() => import('./modules/calculators/CalculatorLeadInbox'));
const ModularHomeQuoteReview = lazy(() => import('./pages/modularHome/ModularHomeQuoteReview'));
const ModularHomeStudioPage = lazy(() => import('./pages/modularHome/ModularHomeStudioPage'));

// Expo
const Expo3D = lazy(() => import('./modules/expo/Expo3D'));
const DigitalGallery = lazy(() => import('./modules/expo/DigitalGallery'));
const ProjectorRoom = lazy(() => import('./modules/expo/ProjectorRoom'));
const BoothRoom = lazy(() => import('./pages/expo/BoothRoom'));
const BoothStreamRoom = lazy(() => import('./pages/expo/BoothStreamRoom'));
const CompanyAdmin = lazy(() => import('./pages/expo/CompanyAdmin'));
const SponsorPackages = lazy(() => import('./pages/expo/SponsorPackages'));
const SponsorLeadInbox = lazy(() => import('./pages/expo/SponsorLeadInbox'));
const Marketplace = lazy(() => import('./modules/expo/Marketplace'));
const UrgentServices = lazy(() => import('./modules/expo/UrgentServices'));
const EventsHub = lazy(() => import('./modules/expo/EventsHub'));
const AdsNetwork = lazy(() => import('./modules/expo/AdsNetwork'));
const FurnitureShowroom = lazy(() => import('./modules/expo/FurnitureShowroom'));
const SectorPage = lazy(() => import('./modules/expo/SectorPage'));

// Citi moduļi
const ClientsDashboard = lazy(() => import('./modules/clients/ClientsDashboard'));
const ClientPortal = lazy(() => import('./modules/clients/ClientPortal'));
const DocumentHub = lazy(() => import('./modules/documents/DocumentHub'));
const Settings = lazy(() => import('./modules/settings/Settings'));
const CalculatorsHub = lazy(() => import('./modules/calculators/CalculatorsHub'));
const InventoryManager = lazy(() => import('./modules/inventory/InventoryManager'));

const PlatformAgents = ENABLE_DEMO_ROUTES ? lazy(() => import('./pages/AgentsPage')) : null;
const AiPlatformPrototype = ENABLE_DEMO_ROUTES ? lazy(() => import('./pages/AiPlatformPrototype')) : null;
const AutonomousEngine = ENABLE_DEMO_ROUTES ? lazy(() => import('./pages/AutonomousEngine')) : null;
const BusinessEconomy = ENABLE_DEMO_ROUTES ? lazy(() => import('./pages/BusinessEconomy')) : null;
const AutonomousBusinessManager = ENABLE_DEMO_ROUTES ? lazy(() => import('./pages/AutonomousBusinessManager')) : null;
const EconomySimulatorPage = ENABLE_DEMO_ROUTES ? lazy(() => import('./pages/EconomySimulatorPage')) : null;
const AiGenerator = ENABLE_DEMO_ROUTES ? lazy(() => import('./modules/ai-tools/AiGenerator')) : null;
const BusinessAccelerator = ENABLE_DEMO_ROUTES ? lazy(() => import('./modules/ai-tools/BusinessAccelerator')) : null;
const AiAgentDashboard = ENABLE_DEMO_ROUTES ? lazy(() => import('./modules/ai-tools/AiAgentDashboard')) : null;
const AiMatchmaker = ENABLE_DEMO_ROUTES ? lazy(() => import('./modules/ai-tools/AiMatchmaker')) : null;
const ContentGenerator = ENABLE_DEMO_ROUTES ? lazy(() => import('./modules/ai-tools/ContentGenerator')) : null;

function web3dRoute(
  children: ReactNode,
  label: string,
  loadingLabel = `Loading ${label}`,
) {
  return (
    <RouteErrorBoundary
      ctaHref="/modular-homes/studio?homeStudio=1#fallback-quote"
      ctaLabel="Request modular home quote"
      label={label}
    >
      <Suspense fallback={<RouteLoadingFallback label={loadingLabel} />}>
        {children}
      </Suspense>
    </RouteErrorBoundary>
  );
}

type DemoRouteComponent = LazyExoticComponent<ComponentType> | null;

function demoRouteElement(Component: DemoRouteComponent) {
  if (!ENABLE_DEMO_ROUTES || !Component) {
    return <Navigate to="/" replace />;
  }

  return (
    <Suspense fallback={<div style={{ color: 'white', padding: '50px' }}>Loading...</div>}>
      <Component />
    </Suspense>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<RouteLoadingFallback label="Loading Warpala" />}>
        <RouteErrorBoundary
          ctaHref="/modular-homes/studio?homeStudio=1#fallback-quote"
          ctaLabel="Request modular home quote"
          label="Warpala"
        >
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="login" element={<Login />} />
            <Route path="reset-password" element={<ResetPassword />} />
            <Route path="privacy" element={<Suspense fallback={null}><Privacy /></Suspense>} />
            
            {/* Jaunie AI Platformas Maršruti (Phase 15) */}
            <Route path="economy-simulator" element={demoRouteElement(EconomySimulatorPage)} />
            <Route path="business-fleet" element={demoRouteElement(AutonomousBusinessManager)} />
            <Route path="business-economy" element={demoRouteElement(BusinessEconomy)} />
            <Route path="autonomous-engine" element={demoRouteElement(AutonomousEngine)} />
            <Route path="prototype" element={demoRouteElement(AiPlatformPrototype)} />
            <Route path="platform/dashboard" element={<Suspense fallback={<div style={{ color: 'white', padding: '50px' }}>Loading...</div>}><PlatformDashboard /></Suspense>} />
            <Route path="platform/agents" element={demoRouteElement(PlatformAgents)} />
            <Route path="platform/leads" element={<Suspense fallback={<div style={{ color: 'white', padding: '50px' }}>Loading...</div>}><PlatformLeads /></Suspense>} />
            <Route path="platform/marketplace" element={<Suspense fallback={<div style={{ color: 'white', padding: '50px' }}>Loading...</div>}><PlatformMarketplace /></Suspense>} />
            <Route path="platform/expo" element={<Suspense fallback={<div style={{ color: 'white', padding: '50px' }}>Loading...</div>}><PlatformExpo /></Suspense>} />
            <Route path="onboarding" element={<Suspense fallback={<div style={{ color: 'white', padding: '50px' }}>Loading...</div>}><Onboarding /></Suspense>} />
            <Route path="workflows" element={<Suspense fallback={<div style={{ color: 'white', padding: '50px' }}>Loading...</div>}><WorkflowBuilder /></Suspense>} />

            <Route path="dashboard" element={<Suspense fallback={null}><Dashboard /></Suspense>} />
            <Route path="city-map" element={<Suspense fallback={null}><CityMap /></Suspense>} />
            <Route path="projects" element={<Suspense fallback={null}><ProjectBuilder /></Suspense>} />
            <Route path="clients" element={<Suspense fallback={null}><ClientsDashboard /></Suspense>} />
            <Route path="inventory" element={<Suspense fallback={null}><InventoryManager /></Suspense>} />
            <Route path="calculators" element={<Suspense fallback={null}><CalculatorsHub /></Suspense>} />
            <Route path="calculators/leads" element={<Suspense fallback={null}><CalculatorLeadInbox /></Suspense>} />
            <Route path="modular-homes/quotes" element={<Suspense fallback={null}><ModularHomeQuoteReview /></Suspense>} />
            <Route path="marketplace" element={<Suspense fallback={null}><Marketplace /></Suspense>} />
            <Route path="urgent-services" element={<Suspense fallback={null}><UrgentServices /></Suspense>} />
            <Route path="events" element={<Suspense fallback={null}><EventsHub /></Suspense>} />
            <Route path="ads-network" element={<Suspense fallback={null}><AdsNetwork /></Suspense>} />
            <Route path="generator" element={demoRouteElement(AiGenerator)} />
            <Route path="content-generator" element={demoRouteElement(ContentGenerator)} />
            <Route path="akcelerators" element={demoRouteElement(BusinessAccelerator)} />
            <Route path="ai-agent" element={demoRouteElement(AiAgentDashboard)} />
            <Route path="finances" element={<Suspense fallback={null}><AdminFinance /></Suspense>} />
            <Route path="ai-matchmaker" element={demoRouteElement(AiMatchmaker)} />
            <Route path="leaderboard" element={<Suspense fallback={null}><Leaderboard /></Suspense>} />
            <Route path="my-portal" element={<Suspense fallback={null}><ClientPortal /></Suspense>} />
            <Route path="studio" element={<Suspense fallback={null}><StudioMaster /></Suspense>} />
            <Route path="youtube" element={<Suspense fallback={null}><YoutubeManager /></Suspense>} />
            <Route path="documents" element={<Suspense fallback={null}><DocumentHub /></Suspense>} />
            <Route path="settings" element={<Suspense fallback={null}><Settings /></Suspense>} />
            <Route path="sector/:id" element={<Suspense fallback={null}><SectorPage /></Suspense>} />
            
            {/* Kalkulatoru tiešie maršruti */}
            <Route path="roof-cost-calculator" element={<Suspense fallback={null}><RoofCalculator /></Suspense>} />
            <Route path="heating-cost-calculator" element={<Suspense fallback={null}><HeatingCalculator /></Suspense>} />
            <Route path="foundation-cost-calculator" element={<Suspense fallback={null}><FoundationCalculator /></Suspense>} />
            <Route path="renovation-cost-calculator" element={<Suspense fallback={null}><RenovationCalculator /></Suspense>} />
            <Route path="timber-house-calculator" element={<Suspense fallback={null}><TimberHouseCalculator /></Suspense>} />
            <Route path="windows-calculator" element={<Suspense fallback={null}><WindowsCalculator /></Suspense>} />
            <Route path="visuals-calculator" element={<Suspense fallback={null}><VisualsCalculator /></Suspense>} />
            <Route path="fence-calculator" element={<Suspense fallback={null}><FenceCalculator /></Suspense>} />
            <Route path="digital-art-calculator" element={<Navigate to="/fence-calculator" replace />} />
            <Route path="paving-calculator" element={<Suspense fallback={null}><PavingCalculator /></Suspense>} />
            <Route path="autoservice-calculator" element={<Navigate to="/paving-calculator" replace />} />
            <Route path="facade-calculator" element={<Suspense fallback={null}><FacadeCalculator /></Suspense>} />
            <Route path="cleaning-calculator" element={<Navigate to="/facade-calculator" replace />} />
            <Route path="floor-calculator" element={<Suspense fallback={null}><FloorCalculator /></Suspense>} />
            <Route path="quick-fix-calculator" element={<Navigate to="/floor-calculator" replace />} />
            <Route path="plumbing-calculator" element={<Suspense fallback={null}><PlumbingCalculator /></Suspense>} />
            
            <Route path="expo/admin" element={<Suspense fallback={null}><CompanyAdmin /></Suspense>} />
            <Route path="expo/sponsor-packages" element={<Suspense fallback={null}><SponsorPackages /></Suspense>} />
            <Route path="expo/sponsor-leads" element={<Suspense fallback={null}><SponsorLeadInbox /></Suspense>} />
            <Route path="expo" element={<Navigate to="/expo-3d" />} />
          </Route>
          
          <Route path="/expo-3d" element={web3dRoute(<Expo3D />, 'Web3D Expo')} />
          <Route path="/modular-homes/studio" element={web3dRoute(<ModularHomeStudioPage />, 'Modular Home Studio')} />
          <Route path="/expo3d" element={<Navigate to="/expo-3d" replace />} />
          <Route path="/expo/booth/:id" element={<Suspense fallback={null}><BoothRoom /></Suspense>} />
          <Route path="/expo/booth/:id/stream" element={<Suspense fallback={null}><BoothStreamRoom /></Suspense>} />
          <Route path="/expo/showroom/:id" element={<Suspense fallback={null}><FurnitureShowroom /></Suspense>} />
          <Route path="/galerija" element={<Suspense fallback={null}><DigitalGallery /></Suspense>} />
          <Route path="/projekcija" element={<Suspense fallback={null}><ProjectorRoom /></Suspense>} />
        </Routes>
        </RouteErrorBoundary>
      </Suspense>
    </BrowserRouter>
  );
}
