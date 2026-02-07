import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ScanFace,
  AlertTriangle,
  Activity,
  ArrowLeft,
  CheckCircle2,
  FileText,
  Heart,
  Syringe,
} from 'lucide-react';

const DemoPage = () => {
  const [step, setStep] = useState('init'); // init, scanning, analyzing, success, details
  const [progress, setProgress] = useState(0);

  // Simulation Sequence
  useEffect(() => {
    const timers = [];

    // Step 1: Start Scanning after mount
    timers.push(
      setTimeout(() => {
        setStep('scanning');
      }, 1000)
    );

    // Step 2: Face Detected / Analyzing
    timers.push(
      setTimeout(() => {
        setStep('analyzing');
      }, 3500)
    );

    // Step 3: Match Found
    timers.push(
      setTimeout(() => {
        setStep('success');
      }, 6000)
    );

    // Step 4: Show Details
    timers.push(
      setTimeout(() => {
        setStep('details');
      }, 7000)
    );

    return () => timers.forEach(clearTimeout);
  }, []);

  // Progress Bar Animation during 'analyzing'
  useEffect(() => {
    if (step === 'analyzing') {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 2;
        });
      }, 40);
      return () => clearInterval(interval);
    }
  }, [step]);

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans overflow-hidden relative">
      {/* Background Effect */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black z-0"></div>
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 z-0"></div>

      {/* Header */}
      <header className="absolute top-0 w-full z-50 p-6 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md transition-all text-sm font-medium border border-white/10"
          >
            <ArrowLeft className="w-4 h-4" />
            Exit Demo
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-medical-primary flex items-center justify-center shadow-lg shadow-medical-primary/20">
              <ScanFace className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">
              MedLens{' '}
              <span className="text-medical-primary font-mono text-xs px-2 py-0.5 rounded bg-medical-primary/10 border border-medical-primary/20 ml-2">
                DEMO MODE
              </span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            SYSTEM ONLINE
          </div>
          <div className="hidden sm:block">v2.4.0-RC</div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 h-screen flex flex-col items-center justify-center p-6">
        {/* Viewfinder Container */}
        <div className="relative w-full max-w-4xl aspect-video bg-slate-900/50 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden backdrop-blur-sm">
          {/* Simulated Camera Feed (Using a gradient/pattern for abstract feel or placeholder) */}
          <div className="absolute inset-0 bg-slate-900 flex items-center justify-center overflow-hidden">
            {/* Abstract Face Placeholder */}
            <div
              className={`transition-all duration-1000 ${step === 'details' ? 'scale-75 translate-x-[-20%]' : 'scale-100'}`}
            >
              <div className="relative w-64 h-80 rounded-[4rem] border-2 border-slate-700/50 flex items-center justify-center bg-slate-800/20">
                <div className="w-40 h-1 bg-slate-700/30 absolute top-20 rounded-full"></div>
                <div className="w-40 h-1 bg-slate-700/30 absolute bottom-20 rounded-full"></div>
                <ScanFace
                  className={`w-32 h-32 text-slate-700/50 transition-all duration-500 ${step === 'scanning' || step === 'analyzing' ? 'text-medical-primary opacity-100 scale-110' : ''}`}
                />

                {/* Scanning Beam */}
                {(step === 'scanning' || step === 'analyzing') && (
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-medical-primary/20 to-transparent h-1/2 w-full animate-scan-y"></div>
                )}
              </div>
            </div>
          </div>

          {/* HUD Overlay */}
          <div className="absolute inset-0 pointer-events-none p-8 flex flex-col justify-between">
            {/* HUD Corners */}
            <div className="absolute top-8 left-8 w-16 h-16 border-t-2 border-l-2 border-medical-primary/50 rounded-tl-2xl"></div>
            <div className="absolute top-8 right-8 w-16 h-16 border-t-2 border-r-2 border-medical-primary/50 rounded-tr-2xl"></div>
            <div className="absolute bottom-8 left-8 w-16 h-16 border-b-2 border-l-2 border-medical-primary/50 rounded-bl-2xl"></div>
            <div className="absolute bottom-8 right-8 w-16 h-16 border-b-2 border-r-2 border-medical-primary/50 rounded-br-2xl"></div>

            {/* Status Text */}
            <div className="flex justify-center mt-4">
              <div className="px-6 py-2 rounded-full bg-slate-950/80 backdrop-blur border border-slate-800 text-sm font-mono flex items-center gap-3">
                {step === 'init' && <span className="text-slate-400">INITIALIZING CAMERA...</span>}
                {step === 'scanning' && (
                  <span className="text-blue-400 animate-pulse">SEARCHING FOR FACES...</span>
                )}
                {step === 'analyzing' && (
                  <span className="text-yellow-400">ANALYZING BIOMETRICS ({progress}%)...</span>
                )}
                {(step === 'success' || step === 'details') && (
                  <span className="text-green-400 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> IDENTITY VERIFIED
                  </span>
                )}
              </div>
            </div>

            {/* Analysis Grid (Only visible during analysis) */}
            {step === 'analyzing' && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-80 grid grid-cols-4 grid-rows-4 gap-1">
                {[...Array(16)].map((_, i) => (
                  <div
                    key={i}
                    className="border border-medical-primary/30 bg-medical-primary/5 animate-pulse"
                    style={{ animationDelay: `${i * 50}ms` }}
                  ></div>
                ))}
              </div>
            )}
          </div>

          {/* Patient Data Card (Slide in) */}
          <div
            className={`absolute top-0 right-0 h-full w-full md:w-[450px] bg-slate-900/95 backdrop-blur-xl border-l border-slate-700 shadow-2xl transition-transform duration-700 ease-out p-6 overflow-y-auto ${step === 'details' ? 'translate-x-0' : 'translate-x-full'}`}
          >
            <div className="flex items-start justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-white">Sarah Jenkins</h2>
                <p className="text-slate-400 text-sm mt-1">ID: #MED-892-221</p>
              </div>
              <div className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-bold border border-green-500/30">
                ACTIVE PATIENT
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
                  <Heart className="w-4 h-4 text-red-400" />
                  Blood Type
                </div>
                <div className="text-xl font-mono font-bold">O+</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
                  <Activity className="w-4 h-4 text-blue-400" />
                  Age / Gender
                </div>
                <div className="text-xl font-mono font-bold">34 / F</div>
              </div>
            </div>

            {/* Alerts Section */}
            <div className="mb-8">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                Critical Alerts
              </h3>
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-3">
                  <Syringe className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-bold text-red-200">Severe Penicillin Allergy</div>
                    <div className="text-xs text-red-300/70 mt-1">
                      Anaphylactic reaction recorded 2021
                    </div>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-start gap-3">
                  <Activity className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-bold text-orange-200">Diabetic (Type 1)</div>
                    <div className="text-xs text-orange-300/70 mt-1">Insulin dependent</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Medical History */}
            <div>
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-500" />
                Recent History
              </h3>
              <div className="relative border-l-2 border-slate-700 ml-2 space-y-6 pl-6 pb-2">
                <div className="relative">
                  <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-blue-500 border-4 border-slate-900"></div>
                  <div className="text-xs text-slate-500 mb-1">Oct 12, 2025</div>
                  <div className="font-medium text-slate-200">Emergency Room Visit</div>
                  <div className="text-sm text-slate-400 mt-1">
                    Admitted for hyperglycemia. Stabilized with insulin drip.
                  </div>
                </div>
                <div className="relative">
                  <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-slate-600 border-4 border-slate-900"></div>
                  <div className="text-xs text-slate-500 mb-1">Aug 05, 2025</div>
                  <div className="font-medium text-slate-200">Routine Checkup</div>
                  <div className="text-sm text-slate-400 mt-1">
                    General physical. BP 120/80. No concerns.
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col gap-3">
              <button className="w-full py-3 rounded-xl bg-medical-primary hover:bg-medical-dark text-white font-semibold transition-colors flex items-center justify-center gap-2">
                <FileText className="w-4 h-4" />
                View Full Record
              </button>
              <button
                onClick={() => {
                  setStep('scanning');
                  setTimeout(() => setStep('analyzing'), 2000);
                  setTimeout(() => setStep('success'), 4000);
                  setTimeout(() => setStep('details'), 4500);
                }}
                className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
              >
                Scan Next Patient
              </button>
            </div>
          </div>
        </div>

        <p className="mt-6 text-slate-500 text-sm font-mono">
          SIMULATION MODE • NO REAL DATA ACCESSED
        </p>
      </main>
    </div>
  );
};

export default DemoPage;
