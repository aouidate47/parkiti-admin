import { Routes, Route } from 'react-router-dom';
import DashboardPage from './Dashboardpage';
import GuardDetailOverlay from './GuardDetailOverlay';
import DriverDetailOverlay from './DriverDetailOverlay';
import Logingate from './Logingate';
import { useOwnerAuth } from './useOwnerAuth';
import { theme } from './Theme';
import { LangProvider } from './i18n';

function AppContent() {
  const { status, user } = useOwnerAuth();

  if (status === 'checking') {
    return (
      <div
        style={{
          height: '100vh',
          width: '100vw',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: theme.colors.bg,
          color: theme.colors.textMuted,
          fontFamily: theme.fonts.body,
          ...theme.type.footnote,
        }}
      >
        Checking access…
      </div>
    );
  }

  if (status !== 'owner') {
    return <Logingate status={status} />;
  }

  return (
    <Routes>
      <Route path="/" element={<DashboardPage user={user} />}>
        <Route path="guard/:id" element={<GuardDetailOverlay />} />
        <Route path="driver/:id" element={<DriverDetailOverlay />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <LangProvider>
      <AppContent />
    </LangProvider>
  );
}