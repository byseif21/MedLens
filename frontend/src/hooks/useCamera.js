import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Custom hook to handle camera operations
 * @returns {Object} Camera controls and state
 */
export const useCamera = () => {
  const [stream, setStream] = useState(null);
  const [error, setError] = useState('');
  const videoRef = useRef(null);

  const startCamera = useCallback(async () => {
    try {
      // Stop existing stream if any
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

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
  }, [stream]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  }, [stream]);

  const captureImage = useCallback((fileName = 'captured-face.jpg') => {
    return new Promise((resolve, reject) => {
      if (!videoRef.current) {
        reject(new Error('Video ref is not attached or camera not started'));
        return;
      }

      const video = videoRef.current;

      // Check if video is actually playing and has dimensions
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        reject(new Error('Video stream not ready'));
        return;
      }

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');

      // Standard getUserMedia capture is not mirrored by default.
      // We capture the raw frame exactly as the camera sees it.
      context.drawImage(video, 0, 0);

      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], fileName, { type: 'image/jpeg' });
          resolve(file);
        } else {
          reject(new Error('Failed to create image blob'));
        }
      }, 'image/jpeg');
    });
  }, []);

  // Cleanup on unmount (only needed once)
  // Note: The second useEffect below handles stream cleanup when 'stream' changes.
  // This empty-dependency effect is kept if we add other mount/unmount logic later.
  useEffect(() => {
    return () => {
      // Cleanup logic is handled by the effect below
    };
  }, []);

  // Better cleanup:
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  return {
    videoRef,
    stream,
    error,
    startCamera,
    stopCamera,
    captureImage,
  };
};
