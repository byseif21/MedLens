import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FaceCapture from '../components/FaceCapture';
import FaceUploader from '../components/FaceUploader';
import LoadingSpinner from '../components/LoadingSpinner';
import { loginWithFace } from '../services/api';

const LoginPage = () => {
  const [mode, setMode] = useState(null); // 'capture' or 'upload'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleFaceSubmit = async (imageFile) => {
    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('image', imageFile);

      const result = await loginWithFace(formData);

      if (result.success) {
        // Store user data
        localStorage.setItem('user_id', result.data.user_id);
        localStorage.setItem('auth_token', result.data.token || 'temp-token');

        // Redirect to dashboard
        navigate('/dashboard');
      } else {
        setError(result.error || 'Face authentication failed. Please try again.');
      }
    } catch (err) {
      setError('An error occurred during authentication. Please try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setMode(null);
    setError('');
  };

  return (
    <div className="min-h-screen bg-medical-gradient flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-medical-primary rounded-full mb-4 shadow-medical-lg">
            <svg
              className="w-10 h-10 text-white"
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
          <h1 className="text-3xl font-bold text-medical-dark mb-2">Smart Glass AI</h1>
          <p className="text-medical-gray-600">Medical Edition</p>
        </div>

        {/* Main Card */}
        <div className="medical-card animate-slide-up">
          {loading ? (
            <div className="py-12">
              <LoadingSpinner />
              <p className="text-center text-medical-gray-600 mt-4">Authenticating...</p>
            </div>
          ) : mode === null ? (
            <>
              <h2 className="text-2xl font-semibold text-center mb-2">Face Authentication</h2>
              <p className="text-medical-gray-600 text-center mb-8">
                Choose how you want to authenticate
              </p>

              <div className="space-y-4">
                <button
                  onClick={() => setMode('capture')}
                  className="w-full btn-medical-primary flex items-center justify-center gap-3"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  Capture Face with Camera
                </button>

                <button
                  onClick={() => setMode('upload')}
                  className="w-full btn-medical-secondary flex items-center justify-center gap-3"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  Upload Face Photo
                </button>
              </div>

              {error && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm text-center">{error}</p>
                </div>
              )}
            </>
          ) : mode === 'capture' ? (
            <div>
              <button
                onClick={handleBack}
                className="mb-4 text-medical-primary hover:text-cyan-700 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Back
              </button>
              <FaceCapture onCapture={handleFaceSubmit} />
              {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm text-center">{error}</p>
                </div>
              )}
            </div>
          ) : (
            <div>
              <button
                onClick={handleBack}
                className="mb-4 text-medical-primary hover:text-cyan-700 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Back
              </button>
              <FaceUploader onUpload={handleFaceSubmit} />
              {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm text-center">{error}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-medical-gray-500 text-sm mt-6">
          Secure medical authentication system
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
