import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Shield, ScanFace, Settings, LogOut, LogIn, UserPlus, Menu, X } from 'lucide-react';
import { getCurrentUser, clearSession, isAuthenticated } from '../services/auth';
import { getProfile } from '../services/api';
import ProfileAvatar from './ProfileAvatar';
import '../styles/glassmorphism.css';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const fetchProfileData = async (userId) => {
    try {
      const result = await getProfile(userId);
      if (result.success) {
        setProfileData(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch profile data:', error);
    }
  };

  useEffect(() => {
    const checkAuth = () => {
      const user = getCurrentUser();

      if (isAuthenticated() && user) {
        setUser({ id: user.id, email: user.name }); // Minimal user object
        setIsAdmin(user.role === 'admin');
        fetchProfileData(user.id);
      } else {
        setUser(null);
        setIsAdmin(false);
        setProfileData(null);
      }
    };

    checkAuth();

    // Listen for storage changes (in case of login/logout in another tab/component)
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, [location.pathname]); // Re-check on route change

  const handleSignOut = () => {
    clearSession();
    setUser(null);
    setProfileData(null);
    setIsAdmin(false);
    navigate('/login');
  };

  const handleSignIn = () => {
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="glass-card sticky top-0 z-50 mx-4 mt-4 mb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <div className="flex-shrink-0">
            <Link to="/" className="flex items-center space-x-2">
              <span className="text-2xl font-bold neon-gradient-text">Smart Glass AI</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-4">
              <Link
                to="/"
                className={`px-4 py-2 rounded-lg transition-all duration-300 flex items-center gap-2 ${
                  isActive('/')
                    ? 'glow-border-pink text-white'
                    : 'text-gray-300 hover:text-white hover:glow-border-blue'
                }`}
              >
                <Home className="w-4 h-4" />
                Home
              </Link>

              {isAdmin && (
                <Link
                  to="/admin"
                  className={`px-4 py-2 rounded-lg transition-all duration-300 flex items-center gap-2 ${
                    isActive('/admin')
                      ? 'glow-border-pink text-white'
                      : 'text-gray-300 hover:text-white hover:glow-border-blue'
                  }`}
                >
                  <Shield className="w-4 h-4" />
                  Admin
                </Link>
              )}

              <Link
                to="/recognize"
                className={`px-4 py-2 rounded-lg transition-all duration-300 flex items-center gap-2 ${
                  isActive('/recognize')
                    ? 'glow-border-pink text-white'
                    : 'text-gray-300 hover:text-white hover:glow-border-blue'
                }`}
              >
                <ScanFace className="w-4 h-4" />
                Recognize
              </Link>

              {user && (
                <Link
                  to="/settings"
                  className={`px-4 py-2 rounded-lg transition-all duration-300 flex items-center gap-2 ${
                    isActive('/settings')
                      ? 'glow-border-pink text-white'
                      : 'text-gray-300 hover:text-white hover:glow-border-blue'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </Link>
              )}

              {/* Auth Buttons */}
              <div className="ml-4 flex items-center space-x-2">
                {user ? (
                  <>
                    <Link to="/dashboard" className="flex items-center">
                      <ProfileAvatar
                        imageUrl={profileData?.profile_picture_url}
                        userName={user.email}
                        size="sm"
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-400 px-3 hover:text-white transition-colors">
                        {user.email}
                      </span>
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="glass-button text-sm flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/register"
                      className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2"
                    >
                      <UserPlus className="w-4 h-4" />
                      Register
                    </Link>
                    <button
                      onClick={handleSignIn}
                      className="neon-button text-sm flex items-center gap-2"
                    >
                      <LogIn className="w-4 h-4" />
                      Sign In
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="glass-button p-2"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-white/10 bg-black/40 backdrop-blur-md animate-fade-in">
          <div className="p-2 grid grid-cols-3 gap-2">
            <Link
              to="/"
              onClick={() => setIsMenuOpen(false)}
              className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg text-xs transition-all duration-300 ${
                isActive('/')
                  ? 'bg-white/10 text-white shadow-lg border border-white/10'
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Home className="w-5 h-5" />
              <span>Home</span>
            </Link>

            {isAdmin && (
              <Link
                to="/admin"
                onClick={() => setIsMenuOpen(false)}
                className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg text-xs transition-all duration-300 ${
                  isActive('/admin')
                    ? 'bg-white/10 text-white shadow-lg border border-white/10'
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Shield className="w-5 h-5" />
                <span>Admin</span>
              </Link>
            )}

            <Link
              to="/recognize"
              onClick={() => setIsMenuOpen(false)}
              className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg text-xs transition-all duration-300 ${
                isActive('/recognize')
                  ? 'bg-white/10 text-white shadow-lg border border-white/10'
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <ScanFace className="w-5 h-5" />
              <span>Recognize</span>
            </Link>

            {user && (
              <Link
                to="/settings"
                onClick={() => setIsMenuOpen(false)}
                className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg text-xs transition-all duration-300 ${
                  isActive('/settings')
                    ? 'bg-white/10 text-white shadow-lg border border-white/10'
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Settings className="w-5 h-5" />
                <span>Settings</span>
              </Link>
            )}
          </div>

          {/* Mobile Auth Section */}
          <div className="p-2 border-t border-white/10 bg-white/5">
            {user ? (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/dashboard"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex flex-col items-center justify-center gap-1 p-2 rounded-lg text-xs hover:bg-white/5 transition-colors text-center"
                >
                  <ProfileAvatar
                    imageUrl={profileData?.profile_picture_url}
                    userName={user.email}
                    size="xs"
                  />
                  <span className="text-gray-200 truncate w-full">{user.email}</span>
                </Link>
                <button
                  onClick={() => {
                    handleSignOut();
                    setIsMenuOpen(false);
                  }}
                  className="flex flex-col items-center justify-center gap-1 p-2 rounded-lg text-xs text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/register"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex flex-col items-center justify-center gap-1 p-2 rounded-lg text-xs bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 border border-white/10 transition-all"
                >
                  <UserPlus className="w-5 h-5" />
                  <span>Register</span>
                </Link>
                <button
                  onClick={() => {
                    handleSignIn();
                    setIsMenuOpen(false);
                  }}
                  className="flex flex-col items-center justify-center gap-1 p-2 rounded-lg text-xs neon-button"
                >
                  <LogIn className="w-5 h-5" />
                  <span>Sign In</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
