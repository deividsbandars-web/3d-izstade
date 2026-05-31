import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';

// Core un pamata lapas
import Home from './pages/Home';
import Login from './pages/Login';
const Privacy = lazy(() => import('./pages/Privacy'));

// ==========================================
// PHASE 15: AI Platform Pages
// ==========================================
const PlatformDashboard = lazy(() => import('./pages/DashboardPage'));
const PlatformAgents = lazy(() => import('./pages/AgentsPage'));
const PlatformLeads = lazy(() => import('./pages/LeadsPage'));
const PlatformMarketplace = lazy(() => import('./pages/MarketplacePage'));
const PlatformExpo = lazy(() => import('./pages/ExpoPage'));
const AiPlatformPrototype = lazy(() => import('./pages/AiPlatformPrototype'));
const AutonomousEngine = lazy(() => import('./pages/AutonomousEngine'));
const BusinessEconomy = lazy(() => import('./pages/BusinessEconomy'));
const AutonomousBusinessManager = lazy(() => import('./pages/AutonomousBusinessManager'));
const EconomySimulatorPage = lazy(() => import('./pages/EconomySimulatorPage'));
const Onboarding = lazy(() => import('./pages/onboarding/OnboardingPage'));
const WorkflowBuilder = lazy(() => import('./app/workflows/WorkflowBuilder'));

// Moduļu ielāde
const Dashboard = lazy(() => import('./modules/dashboard/Dashboard'));
const ProjectBuilder = lazy(() => import('./modules/projects/ProjectBuilder'));
const CityMap = lazy(() => import('./modules/expo/CityMap'));
const AiGenerator = lazy(() => import('./modules/ai-tools/AiGenerator'));
const BusinessAccelerator = lazy(() => import('./modules/ai-tools/BusinessAccelerator'));
const AiAgentDashboard = lazy(() => import('./modules/ai-tools/AiAgentDashboard'));
const AdminFinance = lazy(() => import('./modules/finance/AdminFinance'));
const StudioMaster = lazy(() => import('./modules/finance/StudioMaster'));
const YoutubeManager = lazy(() => import('./modules/finance/YoutubeManager'));
const AiMatchmaker = lazy(() => import('./modules/ai-tools/AiMatchmaker'));
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
const QuickFixCalculator = lazy(() => import('./modules/calculators/QuickFixCalc'));
const PlumbingCalculator = lazy(() => import('./modules/calculators/PlumbingCalc'));
const CalculatorLeadInbox = lazy(() => import('./modules/calculators/CalculatorLeadInbox'));

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
const ContentGenerator = lazy(() => import('./modules/ai-tools/ContentGenerator'));

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div style={{ color: 'white', padding: '100px' }}>Initializing Warpala OS...</div>}>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="login" element={<Login />} />
            <Route path="privacy" element={<Suspense fallback={null}><Privacy /></Suspense>} />
            
            {/* Jaunie AI Platformas Maršruti (Phase 15) */}
            <Route path="economy-simulator" element={<Suspense fallback={<div style={{ color: 'white', padding: '50px' }}>Loading...</div>}><EconomySimulatorPage /></Suspense>} />
            <Route path="business-fleet" element={<Suspense fallback={<div style={{ color: 'white', padding: '50px' }}>Loading...</div>}><AutonomousBusinessManager /></Suspense>} />
            <Route path="business-economy" element={<Suspense fallback={<div style={{ color: 'white', padding: '50px' }}>Loading...</div>}><BusinessEconomy /></Suspense>} />
            <Route path="autonomous-engine" element={<Suspense fallback={<div style={{ color: 'white', padding: '50px' }}>Loading...</div>}><AutonomousEngine /></Suspense>} />
            <Route path="prototype" element={<Suspense fallback={<div style={{ color: 'white', padding: '50px' }}>Loading...</div>}><AiPlatformPrototype /></Suspense>} />
            <Route path="platform/dashboard" element={<Suspense fallback={<div style={{ color: 'white', padding: '50px' }}>Loading...</div>}><PlatformDashboard /></Suspense>} />
            <Route path="platform/agents" element={<Suspense fallback={<div style={{ color: 'white', padding: '50px' }}>Loading...</div>}><PlatformAgents /></Suspense>} />
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
            <Route path="marketplace" element={<Suspense fallback={null}><Marketplace /></Suspense>} />
            <Route path="urgent-services" element={<Suspense fallback={null}><UrgentServices /></Suspense>} />
            <Route path="events" element={<Suspense fallback={null}><EventsHub /></Suspense>} />
            <Route path="ads-network" element={<Suspense fallback={null}><AdsNetwork /></Suspense>} />
            <Route path="generator" element={<Suspense fallback={null}><AiGenerator /></Suspense>} />
            <Route path="content-generator" element={<Suspense fallback={null}><ContentGenerator /></Suspense>} />
            <Route path="akcelerators" element={<Suspense fallback={null}><BusinessAccelerator /></Suspense>} />
            <Route path="ai-agent" element={<Suspense fallback={null}><AiAgentDashboard /></Suspense>} />
            <Route path="finances" element={<Suspense fallback={null}><AdminFinance /></Suspense>} />
            <Route path="ai-matchmaker" element={<Suspense fallback={null}><AiMatchmaker /></Suspense>} />
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
            <Route path="quick-fix-calculator" element={<Suspense fallback={null}><QuickFixCalculator /></Suspense>} />
            <Route path="plumbing-calculator" element={<Suspense fallback={null}><PlumbingCalculator /></Suspense>} />
            
            <Route path="expo/admin" element={<Suspense fallback={null}><CompanyAdmin /></Suspense>} />
            <Route path="expo/sponsor-packages" element={<Suspense fallback={null}><SponsorPackages /></Suspense>} />
            <Route path="expo/sponsor-leads" element={<Suspense fallback={null}><SponsorLeadInbox /></Suspense>} />
            <Route path="expo" element={<Navigate to="/expo-3d" />} />
          </Route>
          
          <Route path="/expo-3d" element={<Suspense fallback={null}><Expo3D /></Suspense>} />
          <Route path="/expo3d" element={<Navigate to="/expo-3d" replace />} />
          <Route path="/expo/booth/:id" element={<Suspense fallback={null}><BoothRoom /></Suspense>} />
          <Route path="/expo/booth/:id/stream" element={<Suspense fallback={null}><BoothStreamRoom /></Suspense>} />
          <Route path="/expo/showroom/:id" element={<Suspense fallback={null}><FurnitureShowroom /></Suspense>} />
          <Route path="/galerija" element={<Suspense fallback={null}><DigitalGallery /></Suspense>} />
          <Route path="/projekcija" element={<Suspense fallback={null}><ProjectorRoom /></Suspense>} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
