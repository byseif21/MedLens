/* eslint-disable no-console */
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from 'react';
import axios from 'axios';
import apiClient from '../services/axios';
import { recognizeFace } from '../services/api';
import { useNotifications } from '../hooks/useNotifications';
import { useNavigate, useLocation } from 'react-router-dom';

const SmartGlassContext = createContext(null);

export const SmartGlassProvider = ({ children }) => {
  const [glassIp, setGlassIp] = useState(
    localStorage.getItem('medlens_glass_ip') || 'localhost:8001'
  );
  const initialConnected = (() => {
    const last = parseInt(localStorage.getItem('medlens_glass_last_ok') || '0', 10);
    return last && Date.now() - last < 45000;
  })();
  const [isConnected, setIsConnected] = useState(initialConnected);
  const [_connectionFailures, setConnectionFailures] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [lastDetection, setLastDetection] = useState(null);
  const [batteryLevel, setBatteryLevel] = useState(null);

  const scanIntervalRef = useRef(null);
  const statusPollRef = useRef(null);
  const isScanningRef = useRef(false);
  const { notify } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();

  // Create a dedicated axios instance for Glass communication
  // This avoids interference from global interceptors (like Auth tokens) that might cause CORS issues
  const glassClient = useRef(axios.create());

  // Save IP when changed
  useEffect(() => {
    localStorage.setItem('medlens_glass_ip', glassIp);
  }, [glassIp]);

  const isCloud = useMemo(
    () => !glassIp.includes('.') && !glassIp.includes('localhost') && glassIp.length > 0,
    [glassIp]
  );

  // Base URL helper
  const getGlassUrl = useCallback(
    (endpoint) => {
      const protocol = glassIp.startsWith('http') ? '' : 'http://';
      return `${protocol}${glassIp}/${endpoint}`;
    },
    [glassIp]
  );

  const forceDisconnect = useCallback(() => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    setIsScanning(false);
    setIsConnected(false);
    setBatteryLevel(null);
  }, []);

  // Check Connection
  const checkConnection = useCallback(async () => {
    try {
      // CLOUD RELAY MODE (Device ID)
      // If it looks like a Device ID (no dots, not localhost), route to Backend
      if (isCloud) {
        const response = await apiClient.get(`/api/glass/status/${glassIp}`);
        if (response.data.connected) {
          if (!isConnected) console.log('[SmartGlass] ✅ Cloud Relay Connected');
          setIsConnected(true);
          setConnectionFailures(0);
          setBatteryLevel(response.data.battery);
          if (!statusPollRef.current) {
            statusPollRef.current = setInterval(checkConnection, 10000);
          }
          try {
            await apiClient.post(`/api/devices/pair`, {
              device_id: glassIp,
            });
          } catch (err) {
            console.warn('[SmartGlass] Pairing device failed:', err?.message || err);
          }
          return true;
        } else {
          if (isConnected)
            console.log('[SmartGlass] 🔌 Cloud Relay reports offline, marking disconnected');
          forceDisconnect();
          setConnectionFailures(0);
          return false;
        }
      }

      // LOCAL MODE (Direct IP)
      const url = getGlassUrl('status');
      const response = await glassClient.current.get(url, { timeout: 8000 });
      if (response.data.status === 'ok') {
        if (!isConnected) {
          console.log('[SmartGlass] ✅ Connected successfully');
        }
        setIsConnected(true);
        setConnectionFailures(0);
        setBatteryLevel(response.data.battery);
        localStorage.setItem('medlens_glass_last_ok', String(Date.now()));
        if (!statusPollRef.current) {
          statusPollRef.current = setInterval(checkConnection, 10000);
        }
        return true;
      }
    } catch (error) {
      console.warn(`[SmartGlass] ❌ Connection check failed (${glassIp}):`, error.message);

      const isMixedContent =
        window.location.protocol === 'https:' &&
        !glassIp.includes('https') &&
        !glassIp.includes('localhost') &&
        !glassIp.includes('127.0.0.1');

      if (error.code === 'ERR_NETWORK') {
        if (isMixedContent) {
          console.error(
            '[SmartGlass] 🔒 Mixed Content Error: Cannot connect to insecure Smart Glass (HTTP) from secure site (HTTPS).'
          );
          console.warn(
            '[SmartGlass] Fix: Serve the app over HTTP, or configure the browser to allow mixed content for this site.'
          );
          notify({
            type: 'error',
            title: 'Security Error',
            message: 'Browser blocked connection to insecure Glass IP from HTTPS site.',
          });
        } else {
          console.warn(
            '[SmartGlass] Tip: Check if Glass/Mock is running and CORS is enabled. If using Mock, ensure IP is localhost:8001'
          );
        }
      }

      setConnectionFailures((prev) => {
        const newCount = prev + 1;
        // mark as disconnected after 3 consecutive failures (≈30s)
        if (newCount >= 3) {
          if (isConnected) console.log('[SmartGlass] 🔌 Marking as disconnected after 3 failures');
          forceDisconnect();
        }
        return newCount;
      });
      return false;
    }
    return false;
  }, [glassIp, isConnected, getGlassUrl, notify, isCloud, forceDisconnect]);

  // Update Glass Display
  const updateDisplay = async (line1, line2, alert = false) => {
    if (!isConnected) return;
    try {
      if (isCloud) {
        await apiClient.post(`/api/glass/command/${glassIp}`, {
          type: 'DISPLAY_TEXT',
          line1,
          line2,
          alert,
        });
      } else {
        await glassClient.current.post(getGlassUrl('display'), {
          line1,
          line2,
          alert,
        });
      }
    } catch (err) {
      console.error('Failed to update glass display:', err);
    }
  };

  // Reset Glass WiFi
  const resetGlassWifi = async () => {
    if (!glassIp) return false;
    try {
      if (isCloud) {
        await apiClient.post(`/api/glass/command/${glassIp}`, {
          type: 'RESET_WIFI',
        });
      } else {
        await glassClient.current.get(getGlassUrl('reset_wifi'), { timeout: 2000 });
      }
      setIsConnected(false);
      return true;
    } catch (err) {
      console.error('Failed to reset glass wifi:', err);
      // Even if it errors (e.g. timeout from restart), it likely worked
      return false;
    }
  };

  // Disconnect Glass (client-side)
  const disconnectGlass = async () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (statusPollRef.current) {
      clearInterval(statusPollRef.current);
      statusPollRef.current = null;
    }
    if (isCloud && isConnected) {
      try {
        await apiClient.post(`/api/devices/unpair`, {
          device_id: glassIp,
        });
      } catch (err) {
        console.warn('[SmartGlass] Unpairing device failed:', err?.message || err);
      }
    }
    setIsScanning(false);
    setIsConnected(false);
  };

  // Get Stream URL
  const getGlassStreamUrl = () => getGlassUrl('stream');

  // Get Snapshot URL
  const getGlassSnapshotUrl = () => {
    if (isCloud) {
      return `${import.meta.env.VITE_API_URL}/api/glass/frame/${glassIp}`;
    }
    return getGlassUrl('capture');
  };

  // Perform Recognition
  const performScan = async () => {
    // Avoid overlapping scans
    if (isScanningRef.current) {
      console.log('[SmartGlass] Previous scan still in progress, skipping...');
      return;
    }

    isScanningRef.current = true;
    console.log('[SmartGlass] Starting scan cycle...');

    try {
      // 1. Get Image from Glass
      console.log('[SmartGlass] Requesting capture from Glass...');
      const response = isCloud
        ? await apiClient.get(`/api/glass/frame/${glassIp}`, {
            responseType: 'blob',
            timeout: 8000,
          })
        : await glassClient.current.get(getGlassUrl('capture'), {
            responseType: 'blob',
            timeout: 8000,
          });
      console.log('[SmartGlass] ✅ Capture received, size:', response.data.size);
      setConnectionFailures(0);
      setIsConnected(true);

      // 2. Send to Backend
      console.log('[SmartGlass] Sending image to recognition API...');
      const formData = new FormData();
      formData.append('image', response.data, 'glass_capture.jpg');

      const result = await recognizeFace(formData);
      console.log('[SmartGlass] Recognition result:', result);

      // 3. Handle Result
      if (result.success && result.data.match) {
        const person = result.data;
        console.log(`[SmartGlass] 🎯 MATCH FOUND: ${person.name}`);

        // Prevent spamming the same detection
        if (lastDetection?.id !== person.id) {
          setLastDetection(person);

          // Notify Glass
          await updateDisplay('MATCH FOUND', person.name, person.is_critical);

          // Notify App
          notify({
            type: 'success',
            title: 'Glass Detection',
            message: `Identified: ${person.name}`,
          });

          // Navigate (if app is active)
          const currentPath = location.pathname.replace(/\/$/, '');
          const targetPath = `/profile/${person.id}`;

          if (currentPath !== targetPath) {
            console.log(`[SmartGlass] ➡️ Navigating to ${targetPath}`);
            navigate(targetPath);
          } else {
            console.log('[SmartGlass] ℹ️ Already on patient profile');
          }
        }
      } else {
        console.log('[SmartGlass] ❌ No match found');
      }
    } catch (err) {
      console.error('[SmartGlass] 💥 Scan failed:', err.message);
      if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
        console.warn('[SmartGlass] ⚠️ Network timeout - check Glass connection');
      }
    } finally {
      isScanningRef.current = false;
      console.log('[SmartGlass] Scan cycle complete');
    }
  };

  // Toggle Scanning
  const toggleScanning = () => {
    if (isScanning) {
      setIsScanning(false);
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    } else {
      setIsScanning(true);
      // Scan every 3 seconds
      scanIntervalRef.current = setInterval(performScan, 3000);
      performScan(); // Immediate scan
    }
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    };
  }, []);

  return (
    <SmartGlassContext.Provider
      value={{
        glassIp,
        setGlassIp,
        isConnected,
        isScanning,
        toggleScanning,
        batteryLevel,
        lastDetection,
        checkConnection,
        resetGlassWifi,
        disconnectGlass,
        getGlassStreamUrl,
        getGlassSnapshotUrl,
        updateDisplay,
      }}
    >
      {children}
    </SmartGlassContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useSmartGlass = () => {
  const context = useContext(SmartGlassContext);
  if (!context) {
    throw new Error('useSmartGlass must be used within a SmartGlassProvider');
  }
  return context;
};
