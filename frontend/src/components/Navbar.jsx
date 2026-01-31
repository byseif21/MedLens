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
    <>
      <nav className="sticky top-0 z-50 mx-4 mt-4 mb-6 rounded-2xl bg-white/90 backdrop-blur-md border border-white/20 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo/Brand */}
            <div className="flex-shrink-0">
              <Link to="/" className="flex items-center space-x-2">
                <span className="text-2xl font-bold neon-gradient-text">Smart Glass AI</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="max-md:hidden">
              <div className="ml-10 flex items-center space-x-4">
                <Link
                  to="/"
                  title="Home"
                  className={`px-4 py-2 rounded-lg transition-all duration-300 flex items-center gap-2 font-medium ${
                    isActive('/')
                      ? 'bg-medical-primary/10 text-medical-primary'
                      : 'text-gray-600 hover:text-medical-primary hover:bg-gray-50'
                  }`}
                >
                  <Home className="w-5 h-5" />
                </Link>

                {isAdmin && (
                  <Link
                    to="/admin"
                    title="Admin"
                    className={`px-4 py-2 rounded-lg transition-all duration-300 flex items-center gap-2 font-medium ${
                      isActive('/admin')
                        ? 'bg-medical-primary/10 text-medical-primary'
                        : 'text-gray-600 hover:text-medical-primary hover:bg-gray-50'
                    }`}
                  >
                    <Shield className="w-5 h-5" />
                  </Link>
                )}

                <Link
                  to="/recognize"
                  title="Recognize"
                  className={`px-4 py-2 rounded-lg transition-all duration-300 flex items-center gap-2 font-medium ${
                    isActive('/recognize')
                      ? 'bg-medical-primary/10 text-medical-primary'
                      : 'text-gray-600 hover:text-medical-primary hover:bg-gray-50'
                  }`}
                >
                  <ScanFace className="w-5 h-5" />
                </Link>

                {user && (
                  <Link
                    to="/settings"
                    title="Settings"
                    className={`px-4 py-2 rounded-lg transition-all duration-300 flex items-center gap-2 font-medium ${
                      isActive('/settings')
                        ? 'bg-medical-primary/10 text-medical-primary'
                        : 'text-gray-600 hover:text-medical-primary hover:bg-gray-50'
                    }`}
                  >
                    <Settings className="w-5 h-5" />
                  </Link>
                )}

                {/* Auth Buttons */}
                <div className="ml-4 flex items-center space-x-2">
                  {user ? (
                    <>
                      <Link to="/dashboard" className="flex items-center group" title="Dashboard">
                        <ProfileAvatar
                          imageUrl={profileData?.profile_picture_url}
                          userName={user.email}
                          size="sm"
                          className="mr-2 ring-2 ring-transparent group-hover:ring-medical-primary/50 transition-all"
                        />
                      </Link>
                      <button
                        onClick={handleSignOut}
                        title="Sign Out"
                        className="text-sm flex items-center gap-2 px-4 py-2 rounded-lg text-gray-600 hover:text-red-600 hover:bg-red-50 transition-all font-medium"
                      >
                        <LogOut className="w-5 h-5" />
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        to="/register"
                        title="Register"
                        className="text-gray-600 hover:text-medical-primary px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-gray-50 transition-all"
                      >
                        <UserPlus className="w-5 h-5" />
                      </Link>
                      <button
                        onClick={handleSignIn}
                        title="Sign In"
                        className="neon-button text-sm flex items-center gap-2"
                      >
                        <LogIn className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(true)}
                className="p-2 rounded-lg text-gray-600 hover:text-medical-primary hover:bg-gray-50 transition-colors"
                aria-label="Open menu"
              >
                <Menu className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Drawer */}
      <div
        className={`fixed inset-0 z-[100] md:hidden transition-all duration-300 ${
          isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/20 backdrop-blur-sm"
          onClick={() => setIsMenuOpen(false)}
        />

        {/* Drawer Panel */}
        <div
          className={`fixed inset-y-0 right-0 w-[280px] bg-white/95 backdrop-blur-xl shadow-2xl transform transition-transform duration-300 ease-in-out ${
            isMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <span className="text-xl font-bold neon-gradient-text">Menu</span>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-red-500 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
              <Link
                to="/"
                onClick={() => setIsMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
                  isActive('/')
                    ? 'bg-medical-primary/10 text-medical-primary'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-medical-primary'
                }`}
              >
                <Home className="w-5 h-5" />
                Home
              </Link>

              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
                    isActive('/admin')
                      ? 'bg-medical-primary/10 text-medical-primary'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-medical-primary'
                  }`}
                >
                  <Shield className="w-5 h-5" />
                  Admin
                </Link>
              )}

              <Link
                to="/recognize"
                onClick={() => setIsMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
                  isActive('/recognize')
                    ? 'bg-medical-primary/10 text-medical-primary'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-medical-primary'
                }`}
              >
                <ScanFace className="w-5 h-5" />
                Recognize
              </Link>

              {user && (
                <Link
                  to="/settings"
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
                    isActive('/settings')
                      ? 'bg-medical-primary/10 text-medical-primary'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-medical-primary'
                  }`}
                >
                  <Settings className="w-5 h-5" />
                  Settings
                </Link>
              )}
            </div>

            {/* Footer (Auth) */}
            <div className="p-5 border-t border-gray-100 bg-gray-50/50">
              {user ? (
                <div className="space-y-4">
                  <Link
                    to="/dashboard"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-3 p-3 rounded-xl bg-white shadow-sm border border-gray-100"
                  >
                    <ProfileAvatar
                      imageUrl={profileData?.profile_picture_url}
                      userName={user.email}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{user.email}</p>
                      <p className="text-xs text-gray-500">View Profile</p>
                    </div>
                  </Link>
                  <button
                    onClick={() => {
                      handleSignOut();
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all"
                  >
                    <LogOut className="w-5 h-5" />
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <Link
                    to="/register"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-all"
                  >
                    <UserPlus className="w-5 h-5" />
                    Register
                  </Link>
                  <button
                    onClick={() => {
                      handleSignIn();
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-medical-primary text-white font-medium shadow-lg shadow-medical-primary/30 hover:shadow-xl hover:-translate-y-0.5 transition-all"
                  >
                    <LogIn className="w-5 h-5" />
                    Sign In
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;
