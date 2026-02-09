import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfileDashboard from './pages/ProfileDashboard';
import RecognitionPage from './pages/RecognitionPage';
import AdminDashboard from './pages/AdminDashboard';
import SettingsPage from './pages/SettingsPage';
import HomePage from './pages/HomePage';
import DemoPage from './pages/DemoPage';
import { ProtectedRoute, PublicRoute, AdminRoute } from './router/routeGuards';
import { AuthProvider } from './context/AuthProvider';
import { SmartGlassProvider } from './context/SmartGlassContext';

function App() {
  return (
    <AuthProvider>
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <SmartGlassProvider>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/demo" element={<DemoPage />} />
            <Route element={<PublicRoute />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Route>

            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<AdminDashboard />} />
            </Route>

            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<ProfileDashboard />} />
              <Route path="/profile/:userId" element={<ProfileDashboard />} />
              <Route path="/recognize" element={<RecognitionPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Routes>
        </SmartGlassProvider>
      </Router>
    </AuthProvider>
  );
}

export default App;
