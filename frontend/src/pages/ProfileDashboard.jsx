import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainInfo from '../components/MainInfo';
import MedicalInfo from '../components/MedicalInfo';
import Connections from '../components/Connections';
import LoadingSpinner from '../components/LoadingSpinner';
import { getProfile } from '../services/api';

const ProfileDashboard = () => {
  const [activeTab, setActiveTab] = useState('main');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadProfile = async () => {
    const userId = localStorage.getItem('user_id');
    if (!userId) {
      navigate('/login');
      return;
    }

    setLoading(true);
    const result = await getProfile(userId);

    if (result.success) {
      setProfile(result.data);
    } else {
      console.error('Failed to load profile:', result.error);
    }
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('user_id');
    localStorage.removeItem('auth_token');
    navigate('/login');
  };

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tabs = [
    { id: 'main', label: 'Main Info', icon: 'user' },
    { id: 'medical', label: 'Medical Info', icon: 'heart' },
    { id: 'connections', label: 'Connections', icon: 'users' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-medical-gradient flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading profile..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-medical-gradient">
      {/* Header */}
      <header className="bg-white shadow-medical">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-medical-primary rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-medical-dark">
                  {profile?.name || 'User Profile'}
                </h1>
                <p className="text-sm text-medical-gray-600">Medical Profile Dashboard</p>
              </div>
            </div>
            <button onClick={handleLogout} className="btn-medical-secondary text-sm px-4 py-2">
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-medical-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-medical-primary text-medical-primary'
                    : 'border-transparent text-medical-gray-500 hover:text-medical-gray-700 hover:border-medical-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-fade-in">
          {activeTab === 'main' && <MainInfo profile={profile} onUpdate={loadProfile} />}
          {activeTab === 'medical' && <MedicalInfo profile={profile} onUpdate={loadProfile} />}
          {activeTab === 'connections' && <Connections profile={profile} onUpdate={loadProfile} />}
        </div>
      </main>
    </div>
  );
};

export default ProfileDashboard;
