import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import { Navigate } from 'react-router-dom';
import ProtectedRoute from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import ThankYou from '@/pages/ThankYou';
import Dashboard from '@/pages/Dashboard';
import NewAnalysis from '@/pages/NewAnalysis';
import ProjectDetail from '@/pages/ProjectDetail';
import IpFactory from '@/pages/IpFactory';
import PrecisionSimulator from '@/pages/PrecisionSimulator';
import StrategyVault from '@/pages/StrategyVault';
import AssetManagement from '@/pages/AssetManagement';
import SignalMonitoring from '@/pages/SignalMonitoring';
import AccountSettings from '@/pages/AccountSettings';
import SynthesisLogs from '@/pages/SynthesisLogs';
import MarketIntel from '@/pages/MarketIntel';
import ProspectusManager from '@/pages/ProspectusManager';
import ExecutionOrders from '@/pages/ExecutionOrders';
import PersonaManager from '@/pages/PersonaManager';
import InvestorMatchmaker from '@/pages/InvestorMatchmaker';
import SynthesisArchive from '@/pages/SynthesisArchive';
import StrategyBlueprint from '@/pages/StrategyBlueprint';
import ComplianceAudit from '@/pages/ComplianceAudit';
import EntityNexus from '@/pages/EntityNexus';
import DossierWorkshop from '@/pages/DossierWorkshop';
import SimulationArchive from '@/pages/SimulationArchive';
import IntellectualAssets from '@/pages/IntellectualAssets';
import InvestorPipeline from '@/pages/InvestorPipeline';
import SynthesisMetrics from '@/pages/SynthesisMetrics';
import CapitalReadiness from '@/pages/CapitalReadiness';
import MarketResonance from '@/pages/MarketResonance';
import DisruptionLog from '@/pages/DisruptionLog';
import ExecutionTimeline from '@/pages/ExecutionTimeline';
import CommandCenter from '@/pages/CommandCenter';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/ThankYou" element={<ThankYou />} />
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/new" element={<NewAnalysis />} />
          <Route path="/command-center" element={<CommandCenter />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          <Route path="/ip-factory" element={<IpFactory />} />
          <Route path="/simulator" element={<PrecisionSimulator />} />
          <Route path="/strategy-vault" element={<StrategyVault />} />
          <Route path="/asset-management" element={<AssetManagement />} />
          <Route path="/signal-monitoring" element={<SignalMonitoring />} />
          <Route path="/account-settings" element={<AccountSettings />} />
          <Route path="/synthesis-logs" element={<SynthesisLogs />} />
          <Route path="/market-intel" element={<MarketIntel />} />
          <Route path="/prospectus-manager" element={<ProspectusManager />} />
          <Route path="/execution-orders" element={<ExecutionOrders />} />
          <Route path="/persona-manager" element={<PersonaManager />} />
          <Route path="/investor-matchmaker" element={<InvestorMatchmaker />} />
          <Route path="/synthesis-archive" element={<SynthesisArchive />} />
          <Route path="/strategy-blueprint" element={<StrategyBlueprint />} />
          <Route path="/compliance-audit" element={<ComplianceAudit />} />
          <Route path="/entity-nexus" element={<EntityNexus />} />
          <Route path="/dossier-workshop" element={<DossierWorkshop />} />
          <Route path="/simulation-archive" element={<SimulationArchive />} />
          <Route path="/intellectual-assets" element={<IntellectualAssets />} />
          <Route path="/investor-pipeline" element={<InvestorPipeline />} />
          <Route path="/synthesis-metrics" element={<SynthesisMetrics />} />
          <Route path="/capital-readiness" element={<CapitalReadiness />} />
          <Route path="/market-resonance" element={<MarketResonance />} />
          <Route path="/disruption-log" element={<DisruptionLog />} />
          <Route path="/execution-timeline" element={<ExecutionTimeline />} />
        </Route>
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App