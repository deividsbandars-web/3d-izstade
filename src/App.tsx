import { lazy, Suspense, type ComponentType, type LazyExoticComponent, type ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import { RouteErrorBoundary, RouteLoadingFallback } from './components/RouteErrorBoundary';
import { ENABLE_DEMO_ROUTES } from './config/featureFlags';
import {
  RELEASE_OPERATOR_FALLBACK_PATH,
  canOpenReleaseRoute,
} from './config/releaseRouteOwnership';

import Home from './pages/Home';
import Login from './pages/Login';
import ResetPassword from './pages/ResetPassword';
const Privacy = lazy(() => import('./pages/Privacy'));

const PlatformDashboard = lazy(() => import('./pages/DashboardPage'));
const PlatformLeads = lazy(() => import('./pages/LeadsPage'));
const PlatformMarketplace = lazy(() => import('./pages/MarketplacePage'));
const PlatformExpo = lazy(() => import('./pages/ExpoPage'));
const Onboarding = lazy(() => import('./pages/onboarding/OnboardingPage'));
const WorkflowBuilder = lazy(() => import('./app/workflows/WorkflowBuilder'));

const Dashboard = lazy(() => import('./modules/dashboard/Dashboard'));
const ProjectBuilder = lazy(() => import('./modules/projects/ProjectBuilder'));
const CityMap = lazy(() => import('./modules/expo/CityMap'));
const AdminFinance = lazy(() => import('./modules/finance/AdminFinance'));
const StudioMaster = lazy(() => import('./modules/finance/StudioMaster'));
const YoutubeManager = lazy(() => import('./modules/finance/YoutubeManager'));
const Leaderboard = lazy(() => import('./modules/dashboard/Leaderboard'));

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

const Expo3D = lazy(() => import('./modules/expo/Expo3D'));
const DigitalGallery = lazy(() => import('./modules/expo/DigitalGallery'));
const ProjectorRoom = lazy(() => import('./modules/expo/ProjectorRoom'));
const BoothRoom = lazy(() => import('./pages/expo/BoothRoom'));
const BoothStreamRoom = lazy(() => import('./pages/expo/BoothStreamRoom'));
const CompanyAdmin = lazy(() => import('./pages/expo/CompanyAdmin'));
const BoothMarketplace = lazy(() => import('./pages/expo/BoothMarketplace'));
const CityScreenMarketplace = lazy(() => import('./pages/expo/CityScreenMarketplace'));
const SponsorPackages = lazy(() => import('./pages/expo/SponsorPackages'));
const SponsorLeadInbox = lazy(() => import('./pages/expo/SponsorLeadInbox'));
const Marketplace = lazy(() => import('./modules/expo/Marketplace'));
const UrgentServices = lazy(() => import('./modules/expo/UrgentServices'));
const EventsHub = lazy(() => import('./modules/expo/EventsHub'));
const AdsNetwork = lazy(() => import('./modules/expo/AdsNetwork'));
const FurnitureShowroom = lazy(() => import('./modules/expo/FurnitureShowroom'));
const SectorPage = lazy(() => import('./modules/expo/SectorPage'));

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

type DemoRouteComponent = LazyExoticComponent<ComponentType> | null;

function lazyRoute(children: ReactNode, label: string) {
  return (
    <Suspense fallback={<RouteLoadingFallback label={label} />}>
      {children}
    </Suspense>
  );
}

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
      {lazyRoute(children, loadingLabel)}
    </RouteErrorBoundary>
  );
}

function ReleaseRouteGate({
  children,
  routePath,
}: {
  children: ReactNode;
  routePath: string;
}) {
  const location = useLocation();
  const canOpen = canOpenReleaseRoute(routePath, location.search, {
    demoRoutesEnabled: ENABLE_DEMO_ROUTES,
  });

  if (!canOpen) {
    return <Navigate to={RELEASE_OPERATOR_FALLBACK_PATH} replace />;
  }

  return <>{children}</>;
}

function guardedRoute(routePath: string, children: ReactNode, label: string) {
  return (
    <ReleaseRouteGate routePath={routePath}>
      {lazyRoute(children, label)}
    </ReleaseRouteGate>
  );
}

function demoRouteElement(Component: DemoRouteComponent, label: string, routePath: string) {
  if (!ENABLE_DEMO_ROUTES || !Component) {
    return <Navigate to="/" replace />;
  }

  return guardedRoute(routePath, <Component />, label);
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
              <Route path="privacy" element={lazyRoute(<Privacy />, 'Loading privacy')} />

              <Route path="economy-simulator" element={demoRouteElement(EconomySimulatorPage, 'Loading economy simulator', '/economy-simulator')} />
              <Route path="business-fleet" element={demoRouteElement(AutonomousBusinessManager, 'Loading business fleet', '/business-fleet')} />
              <Route path="business-economy" element={demoRouteElement(BusinessEconomy, 'Loading business economy', '/business-economy')} />
              <Route path="autonomous-engine" element={demoRouteElement(AutonomousEngine, 'Loading autonomous engine', '/autonomous-engine')} />
              <Route path="prototype" element={demoRouteElement(AiPlatformPrototype, 'Loading prototype', '/prototype')} />
              <Route path="platform/dashboard" element={guardedRoute('/platform/dashboard', <PlatformDashboard />, 'Loading platform dashboard')} />
              <Route path="platform/agents" element={demoRouteElement(PlatformAgents, 'Loading platform agents', '/platform/agents')} />
              <Route path="platform/leads" element={guardedRoute('/platform/leads', <PlatformLeads />, 'Loading platform leads')} />
              <Route path="platform/marketplace" element={guardedRoute('/platform/marketplace', <PlatformMarketplace />, 'Loading platform marketplace')} />
              <Route path="platform/expo" element={guardedRoute('/platform/expo', <PlatformExpo />, 'Loading platform expo')} />
              <Route path="onboarding" element={guardedRoute('/onboarding', <Onboarding />, 'Loading onboarding')} />
              <Route path="workflows" element={guardedRoute('/workflows', <WorkflowBuilder />, 'Loading workflows')} />

              <Route path="dashboard" element={guardedRoute('/dashboard', <Dashboard />, 'Loading dashboard')} />
              <Route path="city-map" element={guardedRoute('/city-map', <CityMap />, 'Loading city map')} />
              <Route path="projects" element={guardedRoute('/projects', <ProjectBuilder />, 'Loading projects')} />
              <Route path="clients" element={guardedRoute('/clients', <ClientsDashboard />, 'Loading clients')} />
              <Route path="inventory" element={guardedRoute('/inventory', <InventoryManager />, 'Loading inventory')} />
              <Route path="calculators" element={lazyRoute(<CalculatorsHub />, 'Loading calculators')} />
              <Route path="calculators/leads" element={guardedRoute('/calculators/leads', <CalculatorLeadInbox />, 'Loading calculator leads')} />
              <Route path="modular-homes/quotes" element={lazyRoute(<ModularHomeQuoteReview />, 'Loading modular home quotes')} />
              <Route path="marketplace" element={guardedRoute('/marketplace', <Marketplace />, 'Loading marketplace')} />
              <Route path="urgent-services" element={guardedRoute('/urgent-services', <UrgentServices />, 'Loading urgent services')} />
              <Route path="events" element={guardedRoute('/events', <EventsHub />, 'Loading events')} />
              <Route path="ads-network" element={guardedRoute('/ads-network', <AdsNetwork />, 'Loading ads network')} />
              <Route path="generator" element={demoRouteElement(AiGenerator, 'Loading AI generator', '/generator')} />
              <Route path="content-generator" element={demoRouteElement(ContentGenerator, 'Loading content generator', '/content-generator')} />
              <Route path="akcelerators" element={demoRouteElement(BusinessAccelerator, 'Loading business accelerator', '/akcelerators')} />
              <Route path="ai-agent" element={demoRouteElement(AiAgentDashboard, 'Loading AI agent', '/ai-agent')} />
              <Route path="finances" element={guardedRoute('/finances', <AdminFinance />, 'Loading finances')} />
              <Route path="ai-matchmaker" element={demoRouteElement(AiMatchmaker, 'Loading AI matchmaker', '/ai-matchmaker')} />
              <Route path="leaderboard" element={guardedRoute('/leaderboard', <Leaderboard />, 'Loading leaderboard')} />
              <Route path="my-portal" element={guardedRoute('/my-portal', <ClientPortal />, 'Loading client portal')} />
              <Route path="studio" element={guardedRoute('/studio', <StudioMaster />, 'Loading studio')} />
              <Route path="youtube" element={guardedRoute('/youtube', <YoutubeManager />, 'Loading YouTube manager')} />
              <Route path="documents" element={guardedRoute('/documents', <DocumentHub />, 'Loading documents')} />
              <Route path="settings" element={guardedRoute('/settings', <Settings />, 'Loading settings')} />
              <Route path="sector/:id" element={guardedRoute('/sector', <SectorPage />, 'Loading sector')} />

              <Route path="roof-cost-calculator" element={lazyRoute(<RoofCalculator />, 'Loading roof calculator')} />
              <Route path="heating-cost-calculator" element={lazyRoute(<HeatingCalculator />, 'Loading heating calculator')} />
              <Route path="foundation-cost-calculator" element={lazyRoute(<FoundationCalculator />, 'Loading foundation calculator')} />
              <Route path="renovation-cost-calculator" element={lazyRoute(<RenovationCalculator />, 'Loading renovation calculator')} />
              <Route path="timber-house-calculator" element={lazyRoute(<TimberHouseCalculator />, 'Loading timber house calculator')} />
              <Route path="windows-calculator" element={lazyRoute(<WindowsCalculator />, 'Loading windows calculator')} />
              <Route path="visuals-calculator" element={lazyRoute(<VisualsCalculator />, 'Loading visuals calculator')} />
              <Route path="fence-calculator" element={lazyRoute(<FenceCalculator />, 'Loading fence calculator')} />
              <Route path="digital-art-calculator" element={<Navigate to="/fence-calculator" replace />} />
              <Route path="paving-calculator" element={lazyRoute(<PavingCalculator />, 'Loading paving calculator')} />
              <Route path="autoservice-calculator" element={<Navigate to="/paving-calculator" replace />} />
              <Route path="facade-calculator" element={lazyRoute(<FacadeCalculator />, 'Loading facade calculator')} />
              <Route path="cleaning-calculator" element={<Navigate to="/facade-calculator" replace />} />
              <Route path="floor-calculator" element={lazyRoute(<FloorCalculator />, 'Loading floor calculator')} />
              <Route path="quick-fix-calculator" element={<Navigate to="/floor-calculator" replace />} />
              <Route path="plumbing-calculator" element={lazyRoute(<PlumbingCalculator />, 'Loading plumbing calculator')} />

              <Route path="expo/admin" element={lazyRoute(<CompanyAdmin />, 'Loading sponsor admin')} />
              <Route path="expo/booth-marketplace" element={lazyRoute(<BoothMarketplace />, 'Loading booth marketplace')} />
              <Route path="expo/city-screens" element={lazyRoute(<CityScreenMarketplace />, 'Loading city advertising screens')} />
              <Route path="expo/slots" element={<Navigate to="/expo/city-screens" replace />} />
              <Route path="expo/screens" element={<Navigate to="/expo/city-screens" replace />} />
              <Route path="expo/sponsor-packages" element={lazyRoute(<SponsorPackages />, 'Loading sponsor packages')} />
              <Route path="expo/sponsor-leads" element={lazyRoute(<SponsorLeadInbox />, 'Loading sponsor leads')} />
              <Route path="expo" element={<Navigate to="/expo-3d" />} />
            </Route>

            <Route path="/expo-3d" element={web3dRoute(<Expo3D />, 'Web3D Expo')} />
            <Route path="/modular-homes/studio" element={web3dRoute(<ModularHomeStudioPage />, 'Modular Home Studio')} />
            <Route path="/expo3d" element={<Navigate to="/expo-3d" replace />} />
            <Route path="/expo/booth/:id" element={lazyRoute(<BoothRoom />, 'Loading booth')} />
            <Route path="/expo/booth/:id/stream" element={lazyRoute(<BoothStreamRoom />, 'Loading booth stream')} />
            <Route path="/expo/showroom/:id" element={lazyRoute(<FurnitureShowroom />, 'Loading showroom')} />
            <Route path="/galerija" element={lazyRoute(<DigitalGallery />, 'Loading gallery')} />
            <Route path="/projekcija" element={lazyRoute(<ProjectorRoom />, 'Loading projector')} />
          </Routes>
        </RouteErrorBoundary>
      </Suspense>
    </BrowserRouter>
  );
}
