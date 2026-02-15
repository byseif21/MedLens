import { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  User,
  Shield,
  ScanFace,
  Key,
  ArrowLeft,
  Camera,
  Upload,
  ChevronLeft,
  Eye,
  EyeOff,
  Check,
  FileText,
  Phone,
  Calendar,
  Flag,
  Trash2,
  AlertTriangle,
  WifiOff,
  Video,
  Lightbulb,
  Battery,
  Plug,
  Palette,
  Sun,
  Moon,
  Monitor,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import FaceUploader from '../components/FaceUploader';
import MultiFaceCapture from '../components/MultiFaceCapture';
import ProfileAvatar from '../components/ProfileAvatar';
import LoadingSpinner from '../components/LoadingSpinner';
import { useNotifications } from '../hooks/useNotifications';
import { useAuth } from '../hooks/useAuth';
import { useSmartGlass } from '../context/SmartGlassContext';
import {
  updateFaceEnrollment,
  updateProfilePicture,
  getProfile,
  updatePrivacySettings,
  changePassword,
  deleteAccount,
} from '../services/api';
import { defaultPrivacySettings } from '../utils/constants';
import { changePasswordSchema, validateWithSchema } from '../utils/validation';

const SettingsPage = () => {
  const [activeSection, setActiveSection] = useState('profile');
  const [privacySettings, setPrivacySettings] = useState(defaultPrivacySettings);
  const [faceMode, setFaceMode] = useState(null);
  const [facePassword, setFacePassword] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pendingFaceImages, setPendingFaceImages] = useState(null);
  const [isSubmittingFace, setIsSubmittingFace] = useState(false);
  const [isSubmittingAvatar, setIsSubmittingAvatar] = useState(false);
  const [selectedAvatarFile, setSelectedAvatarFile] = useState(null);
  const [faceLastUpdated, setFaceLastUpdated] = useState(null);
  const [uploaderKey, setUploaderKey] = useState(0);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isPasswordFormVisible, setIsPasswordFormVisible] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const navigate = useNavigate();
  const { notify } = useNotifications();
  const { user, updateUser, logout } = useAuth();
  const {
    glassIp,
    setGlassIp,
    isConnected,
    checkConnection,
    resetGlassWifi,
    disconnectGlass,
    getGlassStreamUrl,
    getGlassSnapshotUrl,
    updateDisplay,
    batteryLevel,
  } = useSmartGlass();

  const { theme, setTheme } = useTheme();
  const userId = user?.id;

  const settingsTabs = [
    { id: 'profile', label: 'Profile Picture', icon: User },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'privacy', label: 'Privacy Settings', icon: Shield },
    { id: 'device', label: 'Smart Glass Preferences', icon: ScanFace },
    { id: 'security', label: 'Security & Face ID', icon: Key },
  ];

  const handleTestDisplay = async () => {
    notify({
      type: 'info',
      title: 'Testing Display',
      message: 'Sending test alert to Smart Glass...',
    });

    // Sends "TEST ALERT" text and triggers the LED flash (alert=true)
    await updateDisplay('TEST', 'ALERT', true);
  };

  const handleResetWifi = async () => {
    const confirm = window.confirm(
      'Secure Disconnect?\n\nThis will reset Wi‑Fi settings and restart the device. It will create the "MedLens‑Glass‑Setup" hotspot to reconfigure, and prevents access from others on the current network.'
    );
    if (!confirm) return;
    try {
      notify({
        type: 'info',
        title: 'Resetting Wi‑Fi...',
        message: 'Sending reset command to your glass.',
      });
      disconnectGlass();
      await resetGlassWifi();
      notify({
        type: 'success',
        title: 'Glass Reset',
        message: 'Device is restarting. Connect to "MedLens‑Glass‑Setup" to reconfigure.',
      });
    } catch (err) {
      console.error('Wi‑Fi reset error:', err);
      notify({
        type: 'warning',
        title: 'Reset Attempted',
        message: 'If the device restarted, connect to "MedLens‑Glass‑Setup".',
      });
    }
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    if (!deletePassword) {
      notify({
        type: 'warning',
        title: 'Password Required',
        message: 'Please enter your password to confirm account deletion.',
      });
      return;
    }

    setIsDeleting(true);
    try {
      const result = await deleteAccount(deletePassword);
      if (result.success) {
        notify({
          type: 'success',
          title: 'Account Deleted',
          message: 'Your account has been permanently deleted.',
        });
        logout();
        navigate('/login', { replace: true });
      } else {
        notify({
          type: 'error',
          title: 'Deletion Failed',
          message: result.error,
        });
      }
    } catch (err) {
      console.error('Delete account error:', err);
      notify({
        type: 'error',
        title: 'Unexpected Error',
        message: 'An error occurred while deleting your account.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const fetchProfile = useCallback(async () => {
    if (!userId) return;

    setIsLoadingProfile(true);
    try {
      const result = await getProfile(userId);
      if (result.success) {
        if (result.data.face_updated_at) {
          setFaceLastUpdated(result.data.face_updated_at);
        }
        if (result.data.profile_picture_url !== user.profile_picture_url) {
          updateUser({ profile_picture_url: result.data.profile_picture_url });
        }

        const loadedSettings = Object.keys(defaultPrivacySettings).reduce((acc, key) => {
          acc[key] = result.data[key] ?? defaultPrivacySettings[key];
          return acc;
        }, {});
        setPrivacySettings(loadedSettings);
      }
    } catch (err) {
      console.error('Failed to fetch profile settings:', err);
    } finally {
      setIsLoadingProfile(false);
    }
  }, [userId, user.profile_picture_url, updateUser]);

  useEffect(() => {
    if (!userId) {
      navigate('/login', { replace: true });
      return;
    }

    fetchProfile();
  }, [userId, navigate, fetchProfile]);

  const handlePrivacyUpdate = async (key, value) => {
    // Optimistic update
    const prevSettings = { ...privacySettings };
    setPrivacySettings((prev) => ({ ...prev, [key]: value }));

    const result = await updatePrivacySettings(userId, { [key]: value });

    if (result.success) {
      notify({
        type: 'success',
        title: 'Privacy Updated',
        message: 'Your privacy settings have been saved.',
      });
    } else {
      // Revert on failure
      setPrivacySettings(prevSettings);
      notify({
        type: 'error',
        title: 'Update Failed',
        message: result.error || 'Could not update privacy settings.',
      });
    }
  };

  const handleFaceCaptureComplete = async (imageFiles) => {
    const hasFiles =
      imageFiles instanceof File ||
      (imageFiles && typeof imageFiles === 'object' && Object.keys(imageFiles).length > 0);

    if (!hasFiles) {
      notify({
        type: 'error',
        title: 'No images captured',
        message: 'Please capture or upload at least one face image.',
      });
      return;
    }

    setPendingFaceImages(imageFiles);
    setShowPasswordModal(true);
  };

  const handleConfirmFaceUpdate = async () => {
    if (!facePassword) {
      notify({
        type: 'warning',
        title: 'Password required',
        message: 'Please enter your account password before updating Face ID.',
      });
      return;
    }

    setIsSubmittingFace(true);

    try {
      const formData = new FormData();
      formData.append('password', facePassword);

      if (pendingFaceImages instanceof File) {
        formData.append('image', pendingFaceImages);
      } else {
        Object.entries(pendingFaceImages).forEach(([angle, file]) => {
          formData.append(`image_${angle}`, file);
        });
      }

      const result = await updateFaceEnrollment(userId, formData);

      if (result.success) {
        notify({
          type: 'success',
          title: 'Face ID updated',
          message: 'Your face template has been refreshed successfully.',
        });
        setFaceLastUpdated(new Date().toISOString());
        setFacePassword('');
        setFaceMode(null);
        setShowPasswordModal(false);
        setPendingFaceImages(null);
      } else {
        notify({
          type: 'error',
          title: 'Update failed',
          message: result.error || 'Could not update your Face ID. Please try again.',
        });
      }
    } catch (err) {
      console.error('Face enrollment update error:', err);
      notify({
        type: 'error',
        title: 'Unexpected error',
        message: 'An error occurred while updating your Face ID. Please try again.',
      });
    } finally {
      setIsSubmittingFace(false);
    }
  };

  const handleAvatarUpload = async (file) => {
    setSelectedAvatarFile(file);

    const formData = new FormData();
    formData.append('image', file);

    setIsSubmittingAvatar(true);

    try {
      const result = await updateProfilePicture(userId, formData);

      if (result.success) {
        notify({
          type: 'success',
          title: 'Profile picture updated',
          message: 'Your profile photo has been updated successfully.',
        });
        setSelectedAvatarFile(null);
        setUploaderKey((prev) => prev + 1);
        fetchProfile();
      } else {
        notify({
          type: 'error',
          title: 'Update failed',
          message: result.error || 'Could not update your profile picture.',
        });
      }
    } catch (err) {
      console.error('Profile picture update error:', err);
      notify({
        type: 'error',
        title: 'Unexpected error',
        message: 'An error occurred while updating your profile picture.',
      });
    } finally {
      setIsSubmittingAvatar(false);
    }
  };

  const handlePasswordChange = (e) => {
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });
  };

  const submitPasswordChange = async (e) => {
    e.preventDefault();

    const { isValid, errors } = validateWithSchema(changePasswordSchema, passwordForm);

    if (!isValid) {
      const firstError = Object.values(errors)[0];
      notify({
        type: 'error',
        title: 'Validation Error',
        message: firstError,
      });
      return;
    }

    setIsChangingPassword(true);

    try {
      const result = await changePassword(passwordForm.currentPassword, passwordForm.newPassword);

      if (result.success) {
        notify({
          type: 'success',
          title: 'Password Updated',
          message: 'Your password has been changed successfully.',
        });
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setIsPasswordFormVisible(false);
      } else {
        notify({
          type: 'error',
          title: 'Update Failed',
          message: result.error,
        });
      }
    } catch (err) {
      console.error('Password change error:', err);
      notify({
        type: 'error',
        title: 'Unexpected Error',
        message: 'An error occurred while changing your password.',
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const passwordRequirements = [
    { label: 'At least 8 characters', met: passwordForm.newPassword.length >= 8 },
    { label: 'At least one number', met: /\d/.test(passwordForm.newPassword) },
    { label: 'At least one letter', met: /[a-zA-Z]/.test(passwordForm.newPassword) },
  ];

  if (isLoadingProfile) {
    return (
      <div className="min-h-screen bg-medical-gradient flex items-center justify-center transition-colors duration-300">
        <LoadingSpinner size="lg" text="Loading settings..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-medical-gradient transition-colors duration-300">
      <header className="bg-white dark:bg-medical-gray-900 shadow-md shadow-medical-primary/10 dark:shadow-none border-b border-transparent dark:border-medical-gray-800 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ProfileAvatar imageUrl={user?.profile_picture_url} userName={user?.name} size="lg" />
              <div>
                <h1 className="text-xl font-bold text-medical-dark dark:text-white">
                  Account Settings
                </h1>
                <p className="text-sm text-medical-gray-600 dark:text-medical-gray-400">
                  Manage your Face ID, profile photo, and smart glass preferences.
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
              <Link
                to="/dashboard"
                className="btn-medical-secondary text-sm px-4 py-2 flex items-center gap-2 justify-center w-full sm:w-auto"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="inline max-[740px]:hidden">Back to Profile</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-[260px,1fr] gap-6">
          <aside className="space-y-3">
            {settingsTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveSection(tab.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium border flex items-center gap-3 transition-colors ${
                    activeSection === tab.id
                      ? 'bg-medical-primary text-white border-medical-primary shadow-md shadow-medical-primary/20'
                      : 'bg-white dark:bg-medical-gray-800 text-medical-gray-700 dark:text-medical-gray-300 border-medical-gray-200 dark:border-medical-gray-700 hover:bg-medical-gray-50 dark:hover:bg-medical-gray-700'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </aside>

          <section className="space-y-6">
            {activeSection === 'profile' && (
              <div className="medical-card">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-semibold dark:text-white mb-1">Profile Picture</h2>
                    <p className="text-sm text-medical-gray-600 dark:text-medical-gray-400">
                      Choose a new profile photo. This is used in the dashboard and recognition
                      results but does not change your medical information.
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div className="flex flex-col items-center space-y-4">
                    <ProfileAvatar
                      imageUrl={user?.profile_picture_url}
                      userName={user?.name}
                      size="xl"
                      clickable={false}
                      className="shadow-lg shadow-medical-primary/15 dark:ring-2 dark:ring-medical-primary/20"
                    />
                    <p className="text-sm text-medical-gray-600 dark:text-medical-gray-400 text-center">
                      Current profile picture as seen in your dashboard and recognition cards.
                    </p>
                  </div>

                  <div>
                    <FaceUploader
                      key={uploaderKey}
                      onUpload={handleAvatarUpload}
                      isLoading={isSubmittingAvatar}
                    />
                    {isSubmittingAvatar && (
                      <div className="mt-4">
                        <LoadingSpinner text="Saving new profile picture..." />
                      </div>
                    )}
                    {selectedAvatarFile && !isSubmittingAvatar && (
                      <p className="mt-3 text-sm text-medical-gray-600 dark:text-medical-gray-400">
                        Selected file: {selectedAvatarFile.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'appearance' && (
              <div className="medical-card">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-semibold dark:text-white mb-1">Appearance</h2>
                    <p className="text-sm text-medical-gray-600 dark:text-medical-gray-400">
                      Customize how MedLens looks for you. Choose between light, dark, or follow
                      your system preference.
                    </p>
                  </div>
                </div>

                <div className="p-6 bg-medical-gray-50 dark:bg-medical-gray-900/50 rounded-2xl border border-medical-gray-100 dark:border-medical-gray-700 transition-colors">
                  <h3 className="text-sm font-semibold text-medical-gray-900 dark:text-white mb-6 uppercase tracking-wider">
                    Theme Mode
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { id: 'light', label: 'Light', icon: Sun, desc: 'Classic bright view' },
                      { id: 'auto', label: 'Auto', icon: Monitor, desc: 'Follow system' },
                      { id: 'dark', label: 'Dark', icon: Moon, desc: 'Easier on the eyes' },
                    ].map((mode) => {
                      const Icon = mode.icon;
                      const isSelected = theme === mode.id;
                      return (
                        <button
                          key={mode.id}
                          onClick={() => setTheme(mode.id)}
                          className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all duration-300 ${
                            isSelected
                              ? 'bg-white dark:bg-medical-gray-800 border-medical-primary shadow-lg shadow-medical-primary/10 ring-4 ring-medical-primary/5'
                              : 'bg-medical-gray-50 dark:bg-medical-gray-900/40 border-transparent hover:border-medical-gray-200 dark:hover:border-medical-gray-700 hover:bg-white dark:hover:bg-medical-gray-800'
                          }`}
                        >
                          <div
                            className={`p-3 rounded-full mb-3 transition-colors ${
                              isSelected
                                ? 'bg-medical-primary text-white'
                                : 'bg-medical-gray-100 dark:bg-medical-gray-800 text-medical-gray-500 dark:text-medical-gray-400'
                            }`}
                          >
                            <Icon size={24} />
                          </div>
                          <span
                            className={`font-bold text-lg mb-1 ${
                              isSelected
                                ? 'text-medical-gray-900 dark:text-white'
                                : 'text-medical-gray-600 dark:text-medical-gray-400'
                            }`}
                          >
                            {mode.label}
                          </span>
                          <span className="text-xs text-medical-gray-500 dark:text-medical-gray-500 text-center">
                            {mode.desc}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <p className="mt-6 text-xs text-medical-gray-500 dark:text-medical-gray-400 italic">
                    * Auto mode will automatically switch between light and dark based on your
                    operating system settings.
                  </p>
                </div>
              </div>
            )}

            {activeSection === 'privacy' && (
              <div className="medical-card">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-semibold dark:text-white mb-1">
                      Privacy Settings
                    </h2>
                    <p className="text-sm text-medical-gray-600 dark:text-medical-gray-400">
                      Control what information is visible to other users when they recognize your
                      face. Doctors and admins will always have full access.
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Master Privacy Switch */}
                  <div
                    className={`flex items-center justify-between p-4 border border-medical-gray-200 dark:border-medical-gray-700 rounded-lg bg-white dark:bg-medical-gray-800/50 transition-colors ${isLoadingProfile ? 'opacity-60' : ''}`}
                  >
                    <div>
                      <h3 className="font-medium text-medical-dark dark:text-white flex items-center gap-2">
                        <Eye className="w-5 h-5 text-medical-primary" />
                        Public Profile Visibility
                      </h3>
                      <p className="text-sm text-medical-gray-600 dark:text-medical-gray-400">
                        {privacySettings.is_name_public
                          ? 'Your profile is visible to others. You can customize what details are shown below.'
                          : 'Private Mode enabled. Your name is hidden and all other details are automatically concealed from public users.'}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={privacySettings.is_name_public}
                        disabled={isLoadingProfile}
                        onChange={(e) => handlePrivacyUpdate('is_name_public', e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-gray-200 dark:bg-medical-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-300 dark:peer-focus:ring-cyan-900 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 dark:after:border-medical-gray-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-medical-primary"></div>
                    </label>
                  </div>

                  {/* Granular Settings - Disabled if Public Profile is OFF or Loading */}
                  <div
                    className={`space-y-4 transition-opacity duration-200 ${!privacySettings.is_name_public || isLoadingProfile ? 'opacity-50 pointer-events-none' : ''}`}
                  >
                    <h4 className="font-medium text-medical-dark dark:text-white pt-2">
                      Detailed Visibility Settings
                    </h4>

                    <div className="flex items-center justify-between p-4 border border-medical-gray-200 dark:border-medical-gray-700 rounded-lg bg-white dark:bg-medical-gray-800 transition-colors">
                      <div>
                        <h3 className="font-medium text-medical-dark dark:text-white flex items-center gap-2">
                          <FileText className="w-4 h-4 text-medical-primary" />
                          Show Government ID
                        </h3>
                        <p className="text-sm text-medical-gray-600 dark:text-medical-gray-400">
                          Allow others to see your ID number (Default: Hidden).
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={
                            privacySettings.is_name_public && privacySettings.is_id_number_public
                          }
                          disabled={!privacySettings.is_name_public}
                          onChange={(e) =>
                            handlePrivacyUpdate('is_id_number_public', e.target.checked)
                          }
                        />
                        <div className="w-11 h-6 bg-gray-200 dark:bg-medical-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-300 dark:peer-focus:ring-cyan-900 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 dark:after:border-medical-gray-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-medical-primary"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 border border-medical-gray-200 dark:border-medical-gray-700 rounded-lg bg-white dark:bg-medical-gray-800 transition-colors">
                      <div>
                        <h3 className="font-medium text-medical-dark dark:text-white flex items-center gap-2">
                          <Phone className="w-4 h-4 text-medical-primary" />
                          Show Phone Number
                        </h3>
                        <p className="text-sm text-medical-gray-600 dark:text-medical-gray-400">
                          Allow others to see your phone number.
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={
                            privacySettings.is_name_public && privacySettings.is_phone_public
                          }
                          disabled={!privacySettings.is_name_public}
                          onChange={(e) => handlePrivacyUpdate('is_phone_public', e.target.checked)}
                        />
                        <div className="w-11 h-6 bg-gray-200 dark:bg-medical-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-300 dark:peer-focus:ring-cyan-900 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 dark:after:border-medical-gray-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-medical-primary"></div>
                      </label>
                    </div>

                    {/*<div className="flex items-center justify-between p-4 border border-medical-gray-200 dark:border-medical-gray-700/50 rounded-lg bg-white dark:bg-medical-gray-800/50">
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">Show Email Address</h3>
                        <p className="text-sm text-medical-gray-600 dark:text-medical-gray-400">Allow others to see your email address.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer"
                          checked={privacySettings.is_name_public && privacySettings.is_email_public}
                          disabled={!privacySettings.is_name_public}
                          onChange={(e) => handlePrivacyUpdate('is_email_public', e.target.checked)}
                        />
                        <div className="w-11 h-6 bg-gray-200 dark:bg-medical-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-300 dark:peer-focus:ring-cyan-900 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 dark:after:border-medical-gray-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-medical-primary"></div>
                      </label>
                    </div>*/}

                    <div className="flex items-center justify-between p-4 border border-medical-gray-200 dark:border-medical-gray-700 rounded-lg bg-white dark:bg-medical-gray-800 transition-colors">
                      <div>
                        <h3 className="font-medium text-medical-dark dark:text-white flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-medical-primary" />
                          Show Age
                        </h3>
                        <p className="text-sm text-medical-gray-600 dark:text-medical-gray-400">
                          Allow others to see your age.
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={privacySettings.is_name_public && privacySettings.is_dob_public}
                          disabled={!privacySettings.is_name_public}
                          onChange={(e) => handlePrivacyUpdate('is_dob_public', e.target.checked)}
                        />
                        <div className="w-11 h-6 bg-gray-200 dark:bg-medical-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-300 dark:peer-focus:ring-cyan-900 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 dark:after:border-medical-gray-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-medical-primary"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 border border-medical-gray-200 dark:border-medical-gray-700 rounded-lg bg-white dark:bg-medical-gray-800 transition-colors">
                      <div>
                        <h3 className="font-medium text-medical-dark dark:text-white flex items-center gap-2">
                          <User className="w-4 h-4 text-medical-primary" />
                          Show Gender
                        </h3>
                        <p className="text-sm text-medical-gray-600 dark:text-medical-gray-400">
                          Allow others to see your gender.
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={
                            privacySettings.is_name_public && privacySettings.is_gender_public
                          }
                          disabled={!privacySettings.is_name_public}
                          onChange={(e) =>
                            handlePrivacyUpdate('is_gender_public', e.target.checked)
                          }
                        />
                        <div className="w-11 h-6 bg-gray-200 dark:bg-medical-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-300 dark:peer-focus:ring-cyan-900 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 dark:after:border-medical-gray-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-medical-primary"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 border border-medical-gray-200 dark:border-medical-gray-700 rounded-lg bg-white dark:bg-medical-gray-800 transition-colors">
                      <div>
                        <h3 className="font-medium text-medical-dark dark:text-white flex items-center gap-2">
                          <Flag className="w-4 h-4 text-medical-primary" />
                          Show Nationality
                        </h3>
                        <p className="text-sm text-medical-gray-600 dark:text-medical-gray-400">
                          Allow others to see your nationality.
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={
                            privacySettings.is_name_public && privacySettings.is_nationality_public
                          }
                          disabled={!privacySettings.is_name_public}
                          onChange={(e) =>
                            handlePrivacyUpdate('is_nationality_public', e.target.checked)
                          }
                        />
                        <div className="w-11 h-6 bg-gray-200 dark:bg-medical-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-300 dark:peer-focus:ring-cyan-900 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 dark:after:border-medical-gray-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-medical-primary"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'device' && (
              <div className="medical-card">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-semibold dark:text-white mb-1">
                      Smart Glass Configuration
                    </h2>
                    <p className="text-sm text-medical-gray-600 dark:text-medical-gray-400">
                      Manage connection to your smart glass.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center">
                    <div
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        isConnected
                          ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300'
                          : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300'
                      }`}
                    >
                      {isConnected ? 'Connected' : 'Disconnected'}
                    </div>
                    {isConnected && (
                      <div
                        className="sm:ml-1 ml-0 flex items-center gap-0.5 sm:mt-0 mt-1"
                        title={
                          batteryLevel === 100
                            ? 'Powered via USB'
                            : `Battery ${batteryLevel != null ? `${batteryLevel}%` : 'N/A'}`
                        }
                      >
                        {batteryLevel >= 90 ? (
                          <>
                            <Plug className="w-4 h-4 text-medical-gray-700 dark:text-medical-gray-300" />
                            <span className="text-xs text-medical-gray-700 dark:text-medical-gray-300">
                              USB
                            </span>
                          </>
                        ) : (
                          <>
                            <div className="relative w-4 h-4">
                              <Battery className="w-4 h-4 text-medical-gray-700 dark:text-medical-gray-300" />
                              <div className="absolute left-[3px] top-1/2 -translate-y-1/2 w-[10px] h-[4px]">
                                <div
                                  className={`h-full rounded-sm ${
                                    batteryLevel == null
                                      ? 'bg-gray-400 dark:bg-medical-gray-600'
                                      : batteryLevel > 60
                                        ? 'bg-green-600 dark:bg-green-500'
                                        : batteryLevel >= 30
                                          ? 'bg-yellow-600 dark:bg-yellow-500'
                                          : 'bg-red-600 dark:bg-red-500'
                                  }`}
                                  style={{
                                    width: `${Math.max(0, Math.min(100, batteryLevel ?? 0))}%`,
                                  }}
                                />
                              </div>
                            </div>
                            <span className="text-xs text-medical-gray-700 dark:text-medical-gray-300">
                              {batteryLevel != null ? `${batteryLevel}%` : 'N/A'}
                            </span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Connection Mode Selector */}
                  <div className="flex p-1 bg-gray-100 dark:bg-medical-gray-900 rounded-lg mb-4">
                    <button
                      className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                        !glassIp.includes('GLASS_') && !glassIp.includes('mock_')
                          ? 'bg-white dark:bg-medical-gray-700 shadow dark:shadow-medical-primary/10 text-medical-primary dark:text-medical-secondary'
                          : 'text-gray-500 dark:text-medical-gray-400 hover:text-gray-700 dark:hover:text-white'
                      }`}
                      onClick={() => setGlassIp('localhost:8001')}
                    >
                      Local Mode (Direct IP)
                    </button>
                    <button
                      className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                        glassIp.includes('GLASS_') || glassIp.includes('mock_')
                          ? 'bg-white dark:bg-medical-gray-700 shadow dark:shadow-medical-primary/10 text-medical-primary dark:text-medical-secondary'
                          : 'text-gray-500 dark:text-medical-gray-400 hover:text-gray-700 dark:hover:text-white'
                      }`}
                      onClick={() => setGlassIp('GLASS_001')}
                    >
                      Cloud Mode (Device ID)
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-medical-gray-300 mb-1">
                      {glassIp.includes('GLASS_') || glassIp.includes('mock_')
                        ? 'Device ID'
                        : 'Glass IP Address'}
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                      <input
                        type="text"
                        value={glassIp}
                        onChange={(e) => setGlassIp(e.target.value)}
                        className="flex-1 w-full sm:w-auto px-3 py-2 border border-gray-300 dark:border-medical-gray-600 rounded-md focus:ring-medical-primary focus:border-medical-primary bg-white dark:bg-medical-gray-800 text-medical-dark dark:text-white transition-colors"
                        placeholder={
                          glassIp.includes('GLASS_') || glassIp.includes('mock_')
                            ? 'e.g., GLASS_001'
                            : 'e.g., 192.168.4.1'
                        }
                      />
                      <button
                        type="button"
                        onClick={() => (isConnected ? disconnectGlass() : checkConnection())}
                        className="w-full sm:w-auto px-4 py-2 border border-gray-300 dark:border-medical-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-medical-gray-300 hover:bg-gray-50 dark:hover:bg-medical-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-medical-primary transition-colors"
                      >
                        {isConnected ? 'Disconnect' : 'Connect'}
                      </button>
                      {import.meta.env.DEV &&
                        (glassIp.includes('GLASS_') || glassIp.includes('mock_') ? (
                          <button
                            type="button"
                            onClick={() => setGlassIp('mock_glass_001')}
                            className="w-full sm:w-auto px-4 py-2 border border-blue-200 dark:border-blue-800/30 bg-blue-50 dark:bg-blue-900/20 rounded-md text-sm font-medium text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                            title="Use the cloud relay mock device (requires mock_device_client.py)"
                          >
                            Use Cloud Mock
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setGlassIp('localhost:8001')}
                            className="w-full sm:w-auto px-4 py-2 border border-blue-200 dark:border-blue-800/30 bg-blue-50 dark:bg-blue-900/20 rounded-md text-sm font-medium text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                            title="Use the local IP mock glass (requires mock_glass.py)"
                          >
                            Use Local Mock
                          </button>
                        ))}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-medical-gray-400 mt-1">
                      {glassIp.includes('GLASS_') || glassIp.includes('mock_')
                        ? 'Enter the unique ID printed on your device frame.'
                        : 'Enter the IP address shown on the device serial output. Default is usually 192.168.4.1.'}
                    </p>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800/30 transition-colors">
                    <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">
                      How to Connect
                    </h4>
                    {glassIp.includes('GLASS_') || glassIp.includes('mock_') ? (
                      <ol className="list-decimal list-inside text-sm text-blue-800 dark:text-blue-400/90 space-y-1">
                        <li>Turn on your glass (ensure it has Wi-Fi).</li>
                        <li>Enter your Device ID (e.g. GLASS_001).</li>
                        <li>Click &quot;Connect&quot;.</li>
                        <li>If it&apos;s your first time, you may need to Pair it.</li>
                      </ol>
                    ) : (
                      <ol className="list-decimal list-inside text-sm text-blue-800 dark:text-blue-400/90 space-y-1">
                        <li>Turn on your glass.</li>
                        <li>
                          Connect your phone/laptop to the &quot;MedLens-Glass-Setup&quot; Wi‑Fi
                          hotspot (if in AP mode).
                        </li>
                        <li>Enter the IP address above.</li>
                        <li>Click &quot;Connect&quot;.</li>
                      </ol>
                    )}
                  </div>

                  {/* Hardware Controls */}
                  {glassIp && (
                    <div className="bg-white dark:bg-medical-gray-900/50 p-4 rounded-lg border border-gray-200 dark:border-medical-gray-700 mt-6 shadow-sm transition-colors">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <ScanFace className="w-5 h-5 text-medical-primary" />
                        Hardware Controls
                      </h4>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <a
                          href={getGlassStreamUrl()}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-colors ${
                            isConnected
                              ? 'border-medical-primary/30 dark:border-medical-primary/20 bg-medical-light dark:bg-medical-primary/10 text-medical-primary dark:text-medical-secondary hover:bg-medical-primary/10 dark:hover:bg-medical-primary/20'
                              : 'border-gray-200 dark:border-medical-gray-800 bg-gray-50 dark:bg-medical-gray-800/50 text-gray-400 dark:text-medical-gray-600 cursor-not-allowed'
                          }`}
                          onClick={(e) => !isConnected && e.preventDefault()}
                        >
                          <Video className="w-5 h-5" />
                          <span className="font-medium">Open Camera Stream</span>
                        </a>

                        <button
                          type="button"
                          onClick={handleTestDisplay}
                          className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-colors ${
                            isConnected
                              ? 'border-yellow-200 dark:border-yellow-800/30 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/30'
                              : 'border-gray-200 dark:border-medical-gray-800 bg-gray-50 dark:bg-medical-gray-800/50 text-gray-400 dark:text-medical-gray-600 cursor-not-allowed'
                          }`}
                          disabled={!isConnected}
                        >
                          <Lightbulb className="w-5 h-5" />
                          <span className="font-medium">Test Flash & Display</span>
                        </button>

                        <a
                          href={getGlassSnapshotUrl()}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-colors ${
                            isConnected
                              ? 'border-indigo-200 dark:border-indigo-800/30 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/30'
                              : 'border-gray-200 dark:border-medical-gray-800 bg-gray-50 dark:bg-medical-gray-800/50 text-gray-400 dark:text-medical-gray-600 cursor-not-allowed'
                          }`}
                          onClick={(e) => !isConnected && e.preventDefault()}
                        >
                          <Camera className="w-5 h-5" />
                          <span className="font-medium">Take Test Snapshot</span>
                        </a>

                        <button
                          type="button"
                          className="flex items-center justify-center gap-2 p-3 rounded-lg border transition-colors border-gray-200 dark:border-medical-gray-800 bg-gray-50 dark:bg-medical-gray-800/50 text-gray-400 dark:text-medical-gray-600 cursor-not-allowed"
                          disabled
                          title="Coming soon"
                        >
                          <Plug className="w-5 h-5" />
                          <span className="font-medium">Disconnect App (coming soon)</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleResetWifi}
                          className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-colors ${
                            isConnected
                              ? 'border-orange-200 dark:border-orange-800/30 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/30'
                              : 'border-gray-200 dark:border-medical-gray-800 bg-gray-50 dark:bg-medical-gray-800/50 text-gray-400 dark:text-medical-gray-600 cursor-not-allowed'
                          }`}
                          disabled={!isConnected}
                        >
                          <WifiOff className="w-5 h-5" />
                          <span className="font-medium">Disconnect Glass (Reset Wi‑Fi)</span>
                        </button>
                      </div>
                      {!isConnected && (
                        <p className="text-xs text-gray-500 dark:text-medical-gray-500 mt-2 text-center">
                          Connect to the device to enable these controls.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Device Preferences Section */}
                  <div className="border-t border-medical-gray-200 dark:border-medical-gray-700 pt-6 mt-6">
                    <h3 className="text-lg font-medium text-medical-dark dark:text-white mb-4">
                      Device Preferences
                    </h3>
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-medical-dark dark:text-white">
                            Show basic profile on recognize
                          </p>
                          <p className="text-sm text-medical-gray-600 dark:text-medical-gray-400">
                            Display name and age only when someone is recognized.
                          </p>
                        </div>
                        <button
                          type="button"
                          className="relative inline-flex h-6 w-11 items-center rounded-full bg-medical-gray-300 dark:bg-medical-gray-700 cursor-not-allowed opacity-60"
                        >
                          <span className="inline-block h-5 w-5 transform rounded-full bg-white dark:bg-medical-gray-400 shadow translate-x-1" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-medical-dark dark:text-white">
                            Show medical alerts only
                          </p>
                          <p className="text-sm text-medical-gray-600 dark:text-medical-gray-400">
                            Limit glass alerts to critical medical warnings for safety.
                          </p>
                        </div>
                        <button
                          type="button"
                          className="relative inline-flex h-6 w-11 items-center rounded-full bg-medical-gray-300 dark:bg-medical-gray-700 cursor-not-allowed opacity-60"
                        >
                          <span className="inline-block h-5 w-5 transform rounded-full bg-white dark:bg-medical-gray-400 shadow translate-x-1" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-medical-dark dark:text-white">
                            Emergency contact shortcut
                          </p>
                          <p className="text-sm text-medical-gray-600 dark:text-medical-gray-400">
                            Enable a one-tap shortcut on the glasses to show emergency contacts for
                            the current patient.
                          </p>
                        </div>
                        <button
                          type="button"
                          className="relative inline-flex h-6 w-11 items-center rounded-full bg-medical-gray-300 dark:bg-medical-gray-700 cursor-not-allowed opacity-60"
                        >
                          <span className="inline-block h-5 w-5 transform rounded-full bg-white dark:bg-medical-gray-400 shadow translate-x-1" />
                        </button>
                      </div>

                      <div className="mt-4 bg-medical-light dark:bg-medical-primary/10 border border-medical-primary/20 dark:border-medical-primary/30 rounded-lg p-4 transition-colors">
                        <p className="text-medical-gray-700 dark:text-medical-gray-300 text-sm">
                          These smart glass settings will be wired to the hardware integration
                          later. For now, they are just preparing the UX and do not change any
                          stored profile data.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'security' && (
              <>
                <div className="medical-card">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-semibold dark:text-white mb-1">Face ID</h2>
                      <p className="text-sm text-medical-gray-600 dark:text-medical-gray-400">
                        Re-register your face to keep recognition accurate. For security, we require
                        your password before updating your face template.
                      </p>
                      <p className="text-xs text-medical-gray-500 dark:text-medical-gray-500 mt-2">
                        {faceLastUpdated ? (
                          <>
                            Last updated: {new Date(faceLastUpdated).toLocaleDateString()} at{' '}
                            {new Date(faceLastUpdated).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </>
                        ) : (
                          'Last updated: Not available'
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {!faceMode ? (
                      <div className="space-y-4">
                        <p className="text-medical-gray-600 dark:text-medical-gray-400 text-sm">
                          Choose how you want to update your Face ID.
                        </p>
                        <div className="grid sm:grid-cols-2 gap-4">
                          <button
                            type="button"
                            onClick={() => setFaceMode('capture')}
                            className="w-full btn-medical-primary flex items-center justify-center gap-3"
                          >
                            <Camera className="w-6 h-6" />
                            Capture Multi-Angle Face
                          </button>
                          <button
                            type="button"
                            onClick={() => setFaceMode('upload')}
                            className="w-full btn-medical-secondary flex items-center justify-center gap-3"
                          >
                            <Upload className="w-6 h-6" />
                            Upload New Face Photo
                          </button>
                        </div>
                      </div>
                    ) : faceMode === 'capture' ? (
                      <div>
                        <button
                          type="button"
                          onClick={() => setFaceMode(null)}
                          className="mb-4 text-medical-primary hover:text-cyan-700 flex items-center gap-2 text-sm"
                        >
                          <ChevronLeft className="w-5 h-5" />
                          Back
                        </button>
                        <MultiFaceCapture onComplete={handleFaceCaptureComplete} />
                      </div>
                    ) : (
                      <div>
                        <button
                          type="button"
                          onClick={() => setFaceMode(null)}
                          className="mb-4 text-medical-primary hover:text-cyan-700 flex items-center gap-2 text-sm"
                        >
                          <ChevronLeft className="w-5 h-5" />
                          Back
                        </button>
                        <FaceUploader onUpload={handleFaceCaptureComplete} />
                      </div>
                    )}

                    {isSubmittingFace && (
                      <div className="mt-4">
                        <LoadingSpinner text="Updating Face ID..." />
                      </div>
                    )}

                    <div className="mt-4 bg-medical-light dark:bg-medical-primary/10 border border-medical-primary/20 dark:border-medical-primary/30 rounded-lg p-4 transition-colors">
                      <p className="text-medical-gray-700 dark:text-medical-gray-300 text-sm">
                        Face ID settings are separate from your personal information. Updating your
                        face template does not change your name, medical data, or emergency
                        contacts.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="medical-card mt-6">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                    <div>
                      <h2 className="text-2xl font-semibold dark:text-white mb-1">Password</h2>
                      <p className="text-sm text-medical-gray-600 dark:text-medical-gray-400">
                        Update your account password to keep your account secure.
                      </p>
                    </div>

                    {!isPasswordFormVisible && (
                      <button
                        type="button"
                        onClick={() => setIsPasswordFormVisible(true)}
                        className="btn-medical-secondary px-4 py-2 rounded-lg font-medium shadow-sm flex items-center gap-2 justify-center w-full sm:w-[220px]"
                      >
                        <Key className="w-4 h-4" />
                        Change Password
                      </button>
                    )}
                  </div>

                  {isPasswordFormVisible && (
                    <div className="bg-medical-gray-50/50 dark:bg-medical-gray-900/50 rounded-xl p-6 border border-medical-gray-100 dark:border-medical-gray-700 transition-colors">
                      <form onSubmit={submitPasswordChange} className="space-y-4 max-w-md">
                        <div>
                          <label className="label-medical block text-sm font-medium text-medical-gray-700 dark:text-medical-gray-300 mb-1">
                            Current Password
                          </label>
                          <div className="relative">
                            <input
                              type={showCurrentPassword ? 'text' : 'password'}
                              name="currentPassword"
                              value={passwordForm.currentPassword}
                              onChange={handlePasswordChange}
                              className="input-medical w-full pr-10 bg-white dark:bg-medical-gray-800"
                              placeholder="Enter current password"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-medical-primary transition-colors"
                            >
                              {showCurrentPassword ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="label-medical block text-sm font-medium text-medical-gray-700 dark:text-medical-gray-300 mb-1">
                            New Password
                          </label>
                          <div className="relative">
                            <input
                              type={showNewPassword ? 'text' : 'password'}
                              name="newPassword"
                              value={passwordForm.newPassword}
                              onChange={handlePasswordChange}
                              className="input-medical w-full pr-10 bg-white dark:bg-medical-gray-800"
                              placeholder="Enter new password"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-medical-primary transition-colors"
                            >
                              {showNewPassword ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                          {/* Password Requirements Checklist */}
                          <div className="mt-3 space-y-2 bg-white dark:bg-medical-gray-800 p-3 rounded-lg border border-gray-100 dark:border-medical-gray-700 shadow-sm">
                            <p className="text-xs font-medium text-gray-500 dark:text-medical-gray-400 mb-2">
                              Password must contain:
                            </p>
                            {passwordRequirements.map((req, index) => (
                              <div
                                key={index}
                                className={`flex items-center gap-2 text-xs transition-colors duration-200 ${
                                  req.met
                                    ? 'text-green-600 dark:text-green-400 font-medium'
                                    : 'text-gray-500 dark:text-medical-gray-500'
                                }`}
                              >
                                <div
                                  className={`w-4 h-4 rounded-full flex items-center justify-center border transition-colors duration-200 ${
                                    req.met
                                      ? 'bg-green-100 dark:bg-green-900/20 border-green-500 dark:border-green-600'
                                      : 'bg-gray-50 dark:bg-medical-gray-900 border-gray-300 dark:border-medical-gray-700'
                                  }`}
                                >
                                  {req.met && <Check className="w-2.5 h-2.5" />}
                                </div>
                                <span>{req.label}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="label-medical block text-sm font-medium text-medical-gray-700 dark:text-medical-gray-300 mb-1">
                            Confirm New Password
                          </label>
                          <div className="relative">
                            <input
                              type={showConfirmPassword ? 'text' : 'password'}
                              name="confirmPassword"
                              value={passwordForm.confirmPassword}
                              onChange={handlePasswordChange}
                              className="input-medical w-full pr-10 bg-white dark:bg-medical-gray-800"
                              placeholder="Confirm new password"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-medical-primary transition-colors"
                            >
                              {showConfirmPassword ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                          <button
                            type="submit"
                            disabled={isChangingPassword}
                            className="btn-medical-primary flex-1 py-2.5"
                          >
                            {isChangingPassword ? <LoadingSpinner size="sm" /> : 'Update Password'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIsPasswordFormVisible(false);
                              setPasswordForm({
                                currentPassword: '',
                                newPassword: '',
                                confirmPassword: '',
                              });
                            }}
                            className="btn-medical-secondary flex-1 py-2.5"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>

                <div className="medical-card mt-6 border-red-100 dark:border-red-900/30 bg-red-50/30 dark:bg-red-900/10">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-semibold mb-1 text-red-600 dark:text-red-400 flex items-center gap-2">
                        <AlertTriangle className="w-6 h-6" />
                        Danger Zone
                      </h2>
                      <p className="text-sm text-red-600/80 dark:text-red-400/80">
                        Permanently delete your account and all associated data.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowDeleteModal(true)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors shadow-sm flex items-center gap-2 justify-center w-full sm:w-[220px]"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Account
                    </button>
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      </main>

      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-medical-gray-800 rounded-lg shadow-lg shadow-medical-primary/15 w-full max-w-md overflow-hidden animate-slide-up border border-transparent dark:border-medical-gray-700 transition-colors">
            <div className="p-6">
              <h3 className="text-xl font-bold text-medical-dark dark:text-white mb-2">
                Confirm Security Update
              </h3>
              <p className="text-medical-gray-600 dark:text-medical-gray-400 mb-6">
                Please enter your account password to confirm the update to your Face ID template.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="label-medical">Password</label>
                  <input
                    type="password"
                    value={facePassword}
                    onChange={(e) => setFacePassword(e.target.value)}
                    className="input-medical w-full"
                    placeholder="Enter your password"
                    autoFocus
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => {
                      setShowPasswordModal(false);
                      setFacePassword('');
                      setPendingFaceImages(null);
                    }}
                    className="btn-medical-secondary"
                    disabled={isSubmittingFace}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmFaceUpdate}
                    className="btn-medical-primary"
                    disabled={isSubmittingFace}
                  >
                    {isSubmittingFace ? 'Updating...' : 'Confirm & Update'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-medical-gray-800 rounded-lg shadow-lg shadow-medical-primary/15 w-full max-w-md overflow-hidden animate-slide-up border border-transparent dark:border-medical-gray-700 transition-colors">
            <div className="p-6 border-b border-medical-gray-100 dark:border-medical-gray-700">
              <h3 className="text-xl font-bold text-red-600 dark:text-red-400 mb-1">
                Delete Account
              </h3>
              <p className="text-sm text-medical-gray-500 dark:text-medical-gray-400">
                This action cannot be undone.
              </p>
            </div>

            <div className="p-6">
              <p className="text-gray-600 dark:text-medical-gray-400 mb-6">
                Are you sure you want to delete your account? All of your data, including medical
                info, connections, and face data will be permanently removed.
              </p>

              <form onSubmit={handleDeleteAccount} className="space-y-4">
                <div>
                  <label className="label-medical">Confirm with Password</label>
                  <input
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    className="input-medical w-full border-red-300 focus:border-red-500 focus:ring-red-200 dark:border-red-900/50"
                    placeholder="Enter your password"
                    required
                    autoFocus
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeleteModal(false);
                      setDeletePassword('');
                    }}
                    className="px-4 py-2 border border-gray-300 dark:border-medical-gray-700 rounded-lg text-gray-700 dark:text-medical-gray-300 hover:bg-gray-50 dark:hover:bg-medical-gray-700 font-medium transition-colors"
                    disabled={isDeleting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors shadow-sm flex items-center gap-2"
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <>
                        <LoadingSpinner size="sm" color="text-white" />
                        Deleting...
                      </>
                    ) : (
                      'Delete Permanently'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
