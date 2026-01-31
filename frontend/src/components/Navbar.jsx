import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Menu,
  Shield,
  LogOut,
  User,
  Settings,
  ScanFace,
  LayoutDashboard,
  LogIn,
  UserPlus,
  Home
} from 'lucide-react';
import { getCurrentUser, clearSession as logout, getUserRole } from '../services/auth';
import MobileMenuDrawer from './MobileMenuDrawer';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    
    // Check user status
    const currentUser = getCurrentUser();
    setUser(currentUser);
    if (currentUser) {
      setUserRole(getUserRole());
    }

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    setUser(null);
    setUserRole(null);
    navigate('/login');
    setIsMenuOpen(false);
  };

  const isActive = (path) => location.pathname === path;
  const isAdmin = (userRole || '').toLowerCase() === 'admin';

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-white/80 backdrop-blur-lg shadow-sm' : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 md:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-medical-primary to-medical-secondary flex items-center justify-center text-white shadow-lg shadow-medical-primary/20 group-hover:scale-105 transition-transform duration-300">
                <ScanFace className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <span className="text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-medical-primary to-medical-secondary">
                MedGlass
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <div className="flex items-center gap-6">
                <Link
                  to="/"
                  className={`text-sm font-medium transition-colors hover:text-medical-primary ${
                    isActive('/') ? 'text-medical-primary' : 'text-gray-600'
                  }`}
                >
                  Home
                </Link>
                {user && (
                  <>
                    <Link
                      to="/recognize"
                      className={`text-sm font-medium transition-colors hover:text-medical-primary ${
                        isActive('/recognize') ? 'text-medical-primary' : 'text-gray-600'
                      }`}
                    >
                      Recognize
                    </Link>
                    <Link
                      to="/dashboard"
                      className={`text-sm font-medium transition-colors hover:text-medical-primary ${
                        isActive('/dashboard') ? 'text-medical-primary' : 'text-gray-600'
                      }`}
                    >
                      Dashboard
                    </Link>
                  </>
                )}
              </div>

              <div className="flex items-center gap-3 pl-6 border-l border-gray-200">
                {user ? (
                  <div className="flex items-center gap-3">
                    {isAdmin && (
                      <Link
                        to="/admin"
                        className="p-2 rounded-full hover:bg-red-50 text-red-600 hover:text-red-700 transition-colors"
                        title="Admin Dashboard"
                      >
                        <Shield className="w-5 h-5" />
                      </Link>
                    )}
                    <div className="flex items-center gap-3 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-100">
                      <div className="w-8 h-8 rounded-full bg-medical-primary/10 flex items-center justify-center text-medical-primary">
                        <User className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">{user.name}</span>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="p-2 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                      title="Logout"
                    >
                      <LogOut className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-medical-primary hover:bg-gray-50 transition-all"
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      className="px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-medical-primary to-medical-secondary text-white shadow-lg shadow-medical-primary/25 hover:shadow-xl hover:shadow-medical-primary/30 hover:-translate-y-0.5 transition-all"
                    >
                      Register
                    </Link>
                  </>
                )}
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
      <MobileMenuDrawer
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        footer={
          user && (
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-red-100 text-red-600 font-medium hover:bg-red-50 transition-all"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          )
        }
      >
        <Link
          to="/"
          onClick={() => setIsMenuOpen(false)}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
            isActive('/')
              ? 'bg-medical-primary/5 text-medical-primary'
              : 'text-gray-600 hover:bg-gray-50 hover:text-medical-primary'
          }`}
        >
          <Home className="w-5 h-5" />
          Home
        </Link>

        {user ? (
          <>
            <Link
              to="/dashboard"
              onClick={() => setIsMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
                isActive('/dashboard')
                  ? 'bg-medical-primary/5 text-medical-primary'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-medical-primary'
              }`}
            >
              <LayoutDashboard className="w-5 h-5" />
              Dashboard
            </Link>
            
            <Link
              to="/recognize"
              onClick={() => setIsMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
                isActive('/recognize')
                  ? 'bg-medical-primary/5 text-medical-primary'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-medical-primary'
              }`}
            >
              <ScanFace className="w-5 h-5" />
              Recognize
            </Link>

            <Link
              to="/settings"
              onClick={() => setIsMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
                isActive('/settings')
                  ? 'bg-medical-primary/5 text-medical-primary'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-medical-primary'
              }`}
            >
              <Settings className="w-5 h-5" />
              Settings
            </Link>

            {isAdmin && (
              <Link
                to="/admin"
                onClick={() => setIsMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
                  isActive('/admin')
                    ? 'bg-red-100 text-red-700 border border-red-200'
                    : 'text-red-600 bg-red-50 border border-red-100 hover:bg-red-100 hover:text-red-700 hover:border-red-200'
                }`}
              >
                <Shield className="w-5 h-5" />
                Admin
              </Link>
            )}
          </>
        ) : (
          <>
            <Link
              to="/login"
              onClick={() => setIsMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
                isActive('/login')
                  ? 'bg-medical-primary/5 text-medical-primary'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-medical-primary'
              }`}
            >
              <LogIn className="w-5 h-5" />
              Login
            </Link>
            <Link
              to="/register"
              onClick={() => setIsMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
                isActive('/register')
                  ? 'bg-medical-primary/5 text-medical-primary'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-medical-primary'
              }`}
            >
              <UserPlus className="w-5 h-5" />
              Register
            </Link>
          </>
        )}
      </MobileMenuDrawer>
    </>
  );
};

export default Navbar;
