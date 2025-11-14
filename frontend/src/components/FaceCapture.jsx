import { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';

const FaceCapture = ({ onCapture }) => {
  const [stream, setStream] = useState(null);
  const [captured, setCaptured] = useState(false);
  const [error, setError] = useState('');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 },
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setError('');
    } catch (err) {
      setError('Unable to access camera. Please check permissions.');
      console.error('Camera error:', err);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'captured-face.jpg', { type: 'image/jpeg' });
        setCaptured(true);
        stopCamera();
        onCapture(file);
      }
    }, 'image/jpeg');
  };

  const retake = () => {
    setCaptured(false);
    startCamera();
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-center">Capture Your Face</h3>
      <p className="text-medical-gray-600 text-center text-sm">
        Position your face in the center and click capture
      </p>

      <div className="relative bg-medical-gray-100 rounded-lg overflow-hidden aspect-video">
        {!captured ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {/* Face guide overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-64 h-80 border-4 border-medical-primary rounded-full opacity-50"></div>
            </div>
          </>
        ) : (
          <canvas ref={canvasRef} className="w-full h-full object-cover" />
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm text-center">{error}</p>
        </div>
      )}

      <div className="flex gap-3">
        {!captured ? (
          <button
            onClick={capturePhoto}
            disabled={!stream}
            className="flex-1 btn-medical-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Capture Photo
          </button>
        ) : (
          <button onClick={retake} className="flex-1 btn-medical-secondary">
            Retake Photo
          </button>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

FaceCapture.propTypes = {
  onCapture: PropTypes.func.isRequired,
};

export default FaceCapture;
