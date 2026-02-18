import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ScanFace,
  Shield,
  LayoutDashboard,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  Activity,
  Pill,
  Camera,
  Upload,
  ChevronLeft,
  RefreshCw,
} from 'lucide-react';
import FaceCapture from '../components/FaceCapture';
import FaceUploader from '../components/FaceUploader';
import LoadingSpinner from '../components/LoadingSpinner';
import ProfileAvatar from '../components/ProfileAvatar';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../hooks/useNotifications';
import { setViewingUser } from '../services/auth';
import { recognizeFace } from '../services/api';
import { computeAge } from '../utils/dateUtils';
import { useSmartGlass } from '../context/SmartGlassContext';

const RecognitionPage = () => {
  const [mode, setMode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [recognizedPerson, setRecognizedPerson] = useState(null);
  const [showViewProfile, setShowViewProfile] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { notify } = useNotifications();
  const {
    isConnected: isGlassConnected,
    updateDisplay,
    mirrorRecognitionToGlass,
  } = useSmartGlass();
  const userRole = user?.role;
  const isAdmin = (userRole || '').toLowerCase() === 'admin';
  const canViewFullProfile = userRole === 'doctor' || isAdmin;
  const canViewMedicalInfo = canViewFullProfile;

  const handleFaceSubmit = async (imageFile) => {
    setLoading(true);
    setError('');
    setRecognizedPerson(null);
    setShowViewProfile(false);

    try {
      const formData = new FormData();
      formData.append('image', imageFile);

      const result = await recognizeFace(formData);

      if (result.success) {
        if (result.data.match) {
          const person = result.data;
          setRecognizedPerson(person);
          setShowViewProfile(canViewFullProfile);
          notify({
            type: 'success',
            title: 'Match Found',
            message: `Successfully recognized ${person.name}`,
          });

          if (isGlassConnected && mirrorRecognitionToGlass) {
            const alert = Boolean(person.is_critical);
            let info = '';
            const medicalInfo = person.medical_info;
            if (medicalInfo) {
              const takeFirst = (value) => {
                if (!value || typeof value !== 'string') return '';
                const pieces = value
                  .split(/[\n,]/)
                  .map((p) => p.trim())
                  .filter(Boolean);
                return pieces[0] || '';
              };

              const parts = [];
              const chronic = takeFirst(medicalInfo.chronic_conditions);
              if (chronic) parts.push(chronic);

              const allergy = takeFirst(medicalInfo.allergies);
              if (allergy) parts.push(`Allergy: ${allergy}`);

              if (!parts.length) {
                const note = takeFirst(
                  medicalInfo.emergency_notes || medicalInfo.current_medications
                );
                if (note) parts.push(note);
              }

              if (!parts.length && person.is_critical) {
                parts.push('CRITICAL PATIENT');
              }

              const summary = parts.join(' | ');
              info = summary;
            } else if (person.is_critical) {
              info = 'CRITICAL PATIENT';
            }

            updateDisplay('MATCH FOUND', person.name || 'Unknown', alert, info);
          }
        } else {
          // no match
          setError('Face not recognized. Person may not be registered in the system.');
          notify({
            type: 'warning',
            title: 'No Match Found',
            message: result.data.message || 'Face not recognized.',
          });
        }
      } else {
        // validation error (blur, size, etc.) or API error
        setError('Recognition failed. Please try again.');
        notify({
          type: 'error',
          title: 'Recognition Failed',
          message: result.error || 'An error occurred during recognition.',
        });
      }
    } catch (err) {
      setError('An error occurred during recognition. Please try again.');
      notify({
        type: 'error',
        title: 'System Error',
        message: 'An unexpected error occurred.',
      });
      console.error('Recognition error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewProfile = (person) => {
    // Store recognized person's ID and navigate to their dashboard
    const targetId = person.id || person.user_id;

    if (targetId) {
      setViewingUser(targetId, person.name);
      navigate(`/profile/${targetId}`);
    } else {
      notify({
        type: 'error',
        title: 'Unable to View Profile',
        message: 'Cannot open profile because no identifier is available for this person.',
      });
      console.warn('handleViewProfile: missing id/user_id for person', person);
    }
  };

  const handleReset = () => {
    setMode(null);
    setError('');
    setRecognizedPerson(null);
  };

  return (
    <div className="min-h-screen bg-medical-gradient">
      {/* Header */}
      <header className="bg-white dark:bg-medical-gray-900 shadow-md shadow-medical-primary/10 dark:shadow-none border-b border-transparent dark:border-medical-gray-800 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-medical-primary rounded-full flex items-center justify-center">
                <ScanFace className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-medical-dark dark:text-white transition-colors duration-300">
                  Face Recognition
                </h1>
                <p className="text-sm text-medical-gray-600 dark:text-medical-gray-400 transition-colors duration-300">
                  Smart Glass Recognition System
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              {isAdmin && (
                <Link
                  to="/admin"
                  className="btn-medical-secondary bg-pink-50 dark:bg-pink-900/10 text-pink-600 dark:text-pink-400 border-pink-200 dark:border-pink-900/30 hover:bg-pink-100 dark:hover:bg-pink-900/20 flex flex-col sm:flex-row items-center justify-center p-1 sm:px-4 sm:py-2 gap-0.5 sm:gap-2 min-w-[50px] sm:min-w-0 transition-colors"
                >
                  <Shield className="w-4 h-4 sm:w-4 sm:h-4" />
                  <span className="text-[9px] sm:text-sm leading-none sm:leading-normal text-center">
                    Admin Panel
                  </span>
                </Link>
              )}
              <Link
                to="/dashboard"
                className="btn-medical-secondary flex flex-col sm:flex-row items-center justify-center p-1 sm:px-4 sm:py-2 gap-0.5 sm:gap-2 min-w-[50px] sm:min-w-0"
              >
                <LayoutDashboard className="w-4 h-4 sm:w-4 sm:h-4" />
                <span className="text-[9px] sm:text-sm leading-none sm:leading-normal text-center">
                  My Dashboard
                </span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {recognizedPerson ? (
          <div className="animate-fade-in">
            {/* Recognition Result */}
            <div
              className={`medical-card mb-6 ${
                recognizedPerson.is_critical && (isAdmin || userRole === 'doctor')
                  ? 'border-red-300 dark:border-red-700 bg-red-50/40 dark:bg-red-950/10 shadow-[0_0_0_1px_rgba(248,113,113,0.35)]'
                  : ''
              }`}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4 sm:gap-0">
                <h2 className="text-xl sm:text-2xl font-semibold text-green-600 dark:text-green-500 flex items-center gap-2 transition-colors">
                  <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                  Person Recognized
                </h2>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  {showViewProfile && canViewFullProfile && (
                    <button
                      onClick={() => handleViewProfile(recognizedPerson)}
                      className="btn-medical-primary text-sm px-4 py-2 flex items-center justify-center gap-2"
                    >
                      View Full Profile
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={handleReset}
                    className="btn-medical-secondary text-sm px-4 py-2 flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Recognize Another
                  </button>
                </div>
              </div>

              <div className="bg-medical-light dark:bg-medical-gray-800/50 p-6 rounded-lg transition-colors duration-300">
                <div className="flex items-center gap-4 mb-6">
                  <ProfileAvatar
                    imageUrl={recognizedPerson.profile_picture_url}
                    userName={recognizedPerson.name}
                    size="xl"
                    clickable={true}
                    className="border-2 border-medical-primary"
                  />
                  <div>
                    <h3 className="text-2xl font-bold text-medical-dark dark:text-white transition-colors duration-300">
                      {recognizedPerson.name}
                    </h3>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-1">
                      <p className="text-medical-gray-600 dark:text-medical-gray-400 transition-colors duration-300">
                        Confidence: {(recognizedPerson.confidence * 100).toFixed(1)}%
                      </p>
                      {recognizedPerson.is_critical && (isAdmin || userRole === 'doctor') && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
                          Critical patient
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Personal Info */}
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-sm text-medical-gray-600 dark:text-medical-gray-400 transition-colors duration-300">
                      Age
                    </p>
                    <p className="font-medium text-medical-dark dark:text-white transition-colors duration-300">
                      {computeAge(recognizedPerson.date_of_birth) || recognizedPerson.age || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-medical-gray-600 dark:text-medical-gray-400 transition-colors duration-300">
                      Gender
                    </p>
                    <p className="font-medium text-medical-dark dark:text-white capitalize transition-colors duration-300">
                      {recognizedPerson.gender || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-medical-gray-600 dark:text-medical-gray-400 transition-colors duration-300">
                      Nationality
                    </p>
                    <p className="font-medium text-medical-dark dark:text-white transition-colors duration-300">
                      {recognizedPerson.nationality || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-medical-gray-600 dark:text-medical-gray-400 transition-colors duration-300">
                      ID Number
                    </p>
                    <p className="font-medium text-medical-dark dark:text-white transition-colors duration-300">
                      {recognizedPerson.id_number || 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Medical Info */}
                {canViewMedicalInfo && recognizedPerson.medical_info && (
                  <div className="border-t border-medical-gray-200 dark:border-medical-gray-700 pt-4 transition-colors duration-300">
                    <h4 className="font-semibold text-medical-dark dark:text-white mb-3 transition-colors duration-300">
                      Medical Information
                    </h4>
                    <div className="space-y-3">
                      {recognizedPerson.medical_info.allergies && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-lg transition-colors duration-300">
                          <p className="text-sm font-medium text-red-800 dark:text-red-400 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            Allergies
                          </p>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {recognizedPerson.medical_info.allergies
                              .split(/[\n,]/)
                              .map((item) => item.trim())
                              .filter(Boolean)
                              .map((tag) => (
                                <span
                                  key={tag}
                                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-100 border border-red-200/80 dark:border-red-500/60"
                                >
                                  {tag}
                                </span>
                              ))}
                          </div>
                        </div>
                      )}
                      {recognizedPerson.medical_info.chronic_conditions && (
                        <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900/30 rounded-lg transition-colors duration-300">
                          <p className="text-sm font-medium text-yellow-800 dark:text-yellow-400 flex items-center gap-2">
                            <Activity className="w-4 h-4" />
                            Chronic Conditions
                          </p>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {recognizedPerson.medical_info.chronic_conditions
                              .split(/[\n,]/)
                              .map((item) => item.trim())
                              .filter(Boolean)
                              .map((tag) => (
                                <span
                                  key={tag}
                                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-100 border border-yellow-200/80 dark:border-yellow-500/60"
                                >
                                  {tag}
                                </span>
                              ))}
                          </div>
                        </div>
                      )}
                      {recognizedPerson.medical_info.current_medications && (
                        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/30 rounded-lg transition-colors duration-300">
                          <p className="text-sm font-medium text-blue-800 dark:text-blue-400 flex items-center gap-2">
                            <Pill className="w-4 h-4" />
                            Current Medications
                          </p>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {recognizedPerson.medical_info.current_medications
                              .split(/[\n,]/)
                              .map((item) => item.trim())
                              .filter(Boolean)
                              .map((tag) => (
                                <span
                                  key={tag}
                                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-100 border border-blue-200/80 dark:border-blue-500/60"
                                >
                                  {tag}
                                </span>
                              ))}
                          </div>
                        </div>
                      )}
                      {recognizedPerson.medical_info.emergency_notes && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-lg transition-colors duration-300">
                          <p className="text-sm font-medium text-red-800 dark:text-red-400 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            Emergency Notes
                          </p>
                          <p className="text-sm text-red-600 dark:text-red-300/80 mt-1">
                            {recognizedPerson.medical_info.emergency_notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Emergency Contacts */}
                {canViewMedicalInfo &&
                  recognizedPerson.emergency_contacts &&
                  recognizedPerson.emergency_contacts.length > 0 && (
                    <div className="border-t border-medical-gray-200 dark:border-medical-gray-700 pt-4 mt-4 transition-colors duration-300">
                      <h4 className="font-semibold text-medical-dark dark:text-white mb-3 transition-colors duration-300">
                        Emergency Contacts
                      </h4>
                      <div className="space-y-2">
                        {recognizedPerson.emergency_contacts.map((relative, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-white dark:bg-medical-gray-800 rounded-lg border border-medical-gray-200 dark:border-medical-gray-700 transition-colors duration-300"
                          >
                            <div>
                              <p className="font-medium text-medical-dark dark:text-white transition-colors duration-300">
                                {relative.name}
                              </p>
                              <p className="text-xs text-medical-primary dark:text-medical-secondary font-medium transition-colors duration-300">
                                {relative.relation}
                              </p>
                            </div>
                            <a
                              href={`tel:${relative.phone}`}
                              className="text-medical-primary dark:text-medical-secondary font-medium text-sm transition-colors duration-300"
                            >
                              {relative.phone}
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            </div>
          </div>
        ) : (
          <div className="medical-card">
            {loading ? (
              <div className="py-12">
                <LoadingSpinner />
                <p className="text-center text-medical-gray-600 dark:text-medical-gray-400 mt-4 transition-colors">
                  Recognizing face...
                </p>
              </div>
            ) : mode === null ? (
              <>
                <h2 className="text-2xl font-semibold text-center mb-2 text-medical-dark dark:text-white transition-colors">
                  Recognize a Person
                </h2>
                <p className="text-medical-gray-600 dark:text-medical-gray-400 text-center mb-8 transition-colors">
                  Use your smart glass camera or upload a photo to identify someone
                </p>

                <div className="space-y-4">
                  <button
                    onClick={() => setMode('capture')}
                    className="w-full btn-medical-primary flex items-center justify-center gap-2 sm:gap-3 py-3 sm:py-2 text-sm sm:text-base"
                  >
                    <Camera className="w-5 h-5 sm:w-6 sm:h-6" />
                    Capture with Smart Glass Camera
                  </button>

                  <button
                    onClick={() => setMode('upload')}
                    className="w-full btn-medical-secondary flex items-center justify-center gap-2 sm:gap-3 py-3 sm:py-2 text-sm sm:text-base"
                  >
                    <Upload className="w-5 h-5 sm:w-6 sm:h-6" />
                    Upload Photo
                  </button>
                </div>

                {error && (
                  <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-lg transition-colors">
                    <p className="text-red-600 dark:text-red-400 text-sm text-center">{error}</p>
                  </div>
                )}
              </>
            ) : mode === 'capture' ? (
              <div>
                <button
                  onClick={() => setMode(null)}
                  className="mb-4 text-medical-primary dark:text-medical-secondary hover:text-cyan-700 dark:hover:text-medical-primary flex items-center gap-2 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                  Back
                </button>
                <FaceCapture onCapture={handleFaceSubmit} showSwitch={true} />
                {error && (
                  <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-lg transition-colors">
                    <p className="text-red-600 dark:text-red-400 text-sm text-center">{error}</p>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <button
                  onClick={() => setMode(null)}
                  className="mb-4 text-medical-primary dark:text-medical-secondary hover:text-cyan-700 dark:hover:text-medical-primary flex items-center gap-2 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                  Back
                </button>
                <FaceUploader onUpload={handleFaceSubmit} />
                {error && (
                  <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-lg transition-colors">
                    <p className="text-red-600 dark:text-red-400 text-sm text-center">{error}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default RecognitionPage;
