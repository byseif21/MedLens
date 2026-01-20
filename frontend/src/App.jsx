import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfileDashboard from './pages/ProfileDashboard';
import RecognitionPage from './pages/RecognitionPage';
import AdminDashboard from './pages/AdminDashboard';
import { ProtectedRoute, PublicRoute, RootRedirect, AdminRoute } from './router/routeGuards';

function App() {
  return (
    <Router>
      <Routes>
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
        </Route>

        <Route path="/" element={<RootRedirect />} />
      </Routes>
    </Router>
  );
}

export default App;
