import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ScanFace,
  ShieldCheck,
  Zap,
  Database,
  ArrowRight,
  CheckCircle2,
  Lock,
  Activity,
  Globe,
  Cpu,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';

const HomePage = () => {
  const [scrolled, setScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-medical-gray-950 font-sans selection:bg-medical-primary/20 transition-colors duration-300">
      {/* Navigation */}
      <nav
        className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 dark:bg-medical-gray-950/90 backdrop-blur-md shadow-sm py-4' : 'bg-transparent py-6'}`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 -mt-24 -mb-28">
              <img
                src="/MedLens.png"
                alt="MedLens"
                className="h-40 md:h-56 w-auto object-contain dark:drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]"
              />
            </div>
            <div className="h-6 w-px bg-slate-200 dark:bg-medical-gray-800 ml-2 max-md:hidden"></div>
            <ThemeToggle className="hover:scale-110 max-md:hidden" />
          </div>

          <div className="max-md:hidden flex items-center gap-6">
            <a
              href="#features"
              className="text-sm font-medium text-slate-600 dark:text-medical-gray-300 hover:text-medical-primary dark:hover:text-medical-secondary transition-colors"
            >
              Features
            </a>
            <a
              href="#security"
              className="text-sm font-medium text-slate-600 dark:text-medical-gray-300 hover:text-medical-primary dark:hover:text-medical-secondary transition-colors"
            >
              Security
            </a>
            <a
              href="#api"
              className="text-sm font-medium text-slate-600 dark:text-medical-gray-300 hover:text-medical-primary dark:hover:text-medical-secondary transition-colors"
            >
              API
            </a>
            <div className="h-4 w-px bg-slate-200 dark:bg-medical-gray-700"></div>
            <Link
              to="/login"
              className="text-sm font-medium text-slate-600 dark:text-medical-gray-300 hover:text-medical-primary dark:hover:text-medical-secondary transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="group flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-900 dark:bg-medical-primary text-white text-sm font-medium hover:bg-slate-800 dark:hover:bg-medical-secondary transition-all hover:shadow-lg hover:shadow-medical-primary/25 active:scale-95"
            >
              Get Started
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle className="hover:scale-110" />
            <button
              className="p-2 text-slate-600 dark:text-medical-gray-300 hover:text-slate-900 dark:hover:text-white"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav Overlay */}
        {isMenuOpen && (
          <div className="absolute top-full left-0 w-full bg-white dark:bg-medical-gray-950 border-b border-slate-100 dark:border-medical-gray-800 shadow-xl p-6 md:hidden flex flex-col gap-4 animate-fade-in">
            <a
              href="#features"
              className="text-lg font-medium text-slate-600 dark:text-medical-gray-300"
              onClick={() => setIsMenuOpen(false)}
            >
              Features
            </a>
            <a
              href="#security"
              className="text-lg font-medium text-slate-600 dark:text-medical-gray-300"
              onClick={() => setIsMenuOpen(false)}
            >
              Security
            </a>
            <a
              href="#api"
              className="text-lg font-medium text-slate-600 dark:text-medical-gray-300"
              onClick={() => setIsMenuOpen(false)}
            >
              API
            </a>
            <hr className="border-slate-100 dark:border-medical-gray-800" />
            <Link
              to="/login"
              className="text-lg font-medium text-slate-600 dark:text-medical-gray-300"
              onClick={() => setIsMenuOpen(false)}
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-900 dark:bg-medical-primary text-white font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              Get Started
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-44 pb-16 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
          {/* Background blobs */}
          <div className="absolute top-20 right-0 w-[600px] h-[600px] bg-medical-primary/10 rounded-full blur-[100px] mix-blend-multiply animate-[pulse_1s_cubic-bezier(0.4,0,0.6,1)_infinite]" />
          <div className="absolute top-40 -left-20 w-[500px] h-[500px] bg-medical-secondary/10 rounded-full blur-[100px] mix-blend-multiply animate-[pulse_1s_cubic-bezier(0.4,0,0.6,1)_infinite] delay-700" />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-[10px] md:text-xs font-semibold text-slate-600 mb-6 lg:mb-8 animate-fade-in">
                <span className="w-2 h-2 rounded-full bg-medical-accent animate-pulse"></span>
                v2.0 is now live
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight text-slate-900 dark:text-white leading-[1.1] mb-6">
                Medical Identity <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-medical-primary to-medical-secondary">
                  Reimagined.
                </span>
              </h1>
              <p className="text-base md:text-lg text-slate-600 dark:text-white/60 mb-8 lg:mb-10 leading-relaxed max-w-lg">
                Assistive smart glass technology for healthcare professionals. Instantly identify
                patients, access medical history, and view emergency contacts securely in real-time.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                <Link
                  to="/login"
                  className="group inline-flex justify-center items-center gap-2 px-6 py-3 md:px-8 md:py-4 rounded-full bg-medical-primary text-white font-semibold hover:bg-white dark:hover:bg-medical-gray-800 transition-all duration-500 hover:shadow-xl hover:shadow-medical-primary/20 active:scale-95"
                >
                  <span className="group-hover:text-slate-600 dark:group-hover:text-white transition-colors duration-500 text-sm md:text-base">
                    Try{' '}
                    <span className="font-bold group-hover:text-slate-900 dark:group-hover:text-white transition-colors duration-500">
                      Med
                    </span>
                    <span className="font-bold group-hover:text-medical-primary transition-colors duration-500">
                      Lens
                    </span>{' '}
                    Now
                  </span>
                  <ChevronRight className="w-4 h-4 md:w-5 md:h-5 group-hover:text-medical-primary transition-colors duration-500" />
                </Link>
                <Link
                  to="/demo"
                  className="inline-flex justify-center items-center gap-2 px-6 py-3 md:px-8 md:py-4 rounded-full bg-white dark:bg-medical-gray-800 border border-slate-200 dark:border-medical-gray-700 text-slate-700 dark:text-medical-gray-300 font-semibold hover:bg-slate-50 dark:hover:bg-medical-gray-700 hover:border-slate-300 dark:hover:border-medical-gray-600 transition-all active:scale-95 text-sm md:text-base"
                >
                  View Demo
                </Link>
              </div>

              <div className="mt-10 lg:mt-12 flex flex-wrap items-center gap-4 md:gap-8 text-[11px] md:text-sm text-slate-500 dark:text-white/50 font-medium">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-medical-accent" />
                  <span>HIPAA Compliant</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-medical-accent" />
                  <span>Secure Patient Data</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-medical-accent" />
                  <span>Instant Retrieval</span>
                </div>
              </div>
            </div>

            {/* Mock UI */}
            <div className="relative lg:h-[600px] flex items-center justify-center mt-12 lg:mt-0">
              <div className="relative w-full max-w-md aspect-[4/5] bg-slate-900 dark:bg-black rounded-3xl shadow-2xl dark:shadow-medical-primary/10 overflow-hidden border border-slate-800 dark:border-medical-gray-800">
                {/* Screen Header */}
                <div className="absolute top-0 w-full p-6 flex justify-between items-center z-20">
                  <div className="flex gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500/80"></div>
                    <div className="w-2 h-2 rounded-full bg-yellow-500/80"></div>
                    <div className="w-2 h-2 rounded-full bg-green-500/80"></div>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-white/10 backdrop-blur text-[10px] text-white/70 font-mono border border-white/5">
                    SECURE_CONNECTION
                  </div>
                </div>

                {/* Main Visual */}
                <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
                  <div className="w-full aspect-square relative mb-8">
                    {/* Scanning Animation */}
                    <div className="absolute inset-0 rounded-2xl border border-medical-primary/30 overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-1 bg-medical-primary shadow-[0_0_20px_rgba(8,145,178,0.8)] animate-[scan_4s_cubic-bezier(0.4,0,0.2,1)_infinite]" />
                    </div>

                    {/* Face Grid */}
                    <div className="absolute inset-4 grid grid-cols-4 grid-rows-4 gap-4 opacity-20">
                      {[...Array(16)].map((_, i) => (
                        <div
                          key={i}
                          className="border-[0.5px] border-medical-primary/50 rounded-sm"
                        ></div>
                      ))}
                    </div>

                    <div className="absolute inset-0 flex items-center justify-center">
                      <ScanFace className="w-24 h-24 text-medical-primary animate-pulse" />
                    </div>
                  </div>

                  <div className="space-y-4 w-full">
                    <div className="h-2 w-2/3 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-medical-primary animate-progress-load"></div>
                    </div>
                    <div className="flex justify-between text-xs font-mono text-slate-400">
                      <span>VERIFYING IDENTITY...</span>
                      <span className="text-medical-primary">PROCESSING</span>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm mt-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-white">Patient Identified</div>
                          <div className="text-xs text-slate-400">Record #8829-XJ-92</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Decorative Elements */}
                <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-medical-primary/10 to-transparent pointer-events-none" />
              </div>

              {/* Floating Cards */}
              <div className="absolute top-20 -right-8 p-4 rounded-2xl bg-white dark:bg-medical-gray-800 shadow-xl shadow-medical-primary/10 border border-slate-100 dark:border-medical-gray-700 animate-floating-card md:block z-10">
                <Activity className="w-6 h-6 text-orange-500 mb-2" />
                <div className="text-xs font-semibold text-slate-900 dark:text-white">
                  Medical Alerts
                </div>
                <div className="text-[10px] text-slate-500 dark:text-medical-gray-400">
                  Critical Info
                </div>
              </div>

              <div className="absolute bottom-40 -left-12 p-4 rounded-2xl bg-white dark:bg-medical-gray-800 shadow-xl shadow-medical-primary/10 border border-slate-100 dark:border-medical-gray-700 animate-floating-card-delayed md:block z-10">
                <ShieldCheck className="w-6 h-6 text-medical-primary mb-2" />
                <div className="text-xs font-semibold text-slate-900 dark:text-white">
                  Secure Records
                </div>
                <div className="text-[10px] text-slate-500 dark:text-medical-gray-400">
                  Doctor Access Only
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-8 md:py-12 border-y border-slate-100 dark:border-medical-gray-800 bg-slate-50/50 dark:bg-medical-gray-900/50">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-[10px] md:text-sm font-semibold text-slate-500 dark:text-medical-gray-400 mb-6 md:mb-8 uppercase tracking-wider">
            Partnered with leading healthcare institutions
          </p>
          <div className="flex flex-wrap justify-center items-center gap-6 md:gap-12 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
            {/* Simple Text Logos for demo */}
            {['City Hospital', 'MedCare Systems', 'HealthFirst', 'EmergencyResp', 'BioSecure'].map(
              (name) => (
                <span
                  key={name}
                  className="text-base md:text-xl font-bold text-slate-400 dark:text-medical-gray-500 hover:text-slate-800 dark:hover:text-medical-gray-200 cursor-default transition-colors"
                >
                  {name}
                </span>
              )
            )}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-16 md:py-24 bg-white dark:bg-medical-gray-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-12 md:mb-20">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-4">
              Advanced Tools for Medical Professionals
            </h2>
            <p className="text-sm md:text-base text-slate-600 dark:text-white/60">
              Powerful tools designed for healthcare providers, ensuring speed and security.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {[
              {
                icon: <Zap className="w-5 h-5 md:w-6 md:h-6 text-yellow-500" />,
                title: 'Lightning Fast',
                desc: 'Sub-100ms response times globally. Optimized for high-throughput applications.',
              },
              {
                icon: <Lock className="w-5 h-5 md:w-6 md:h-6 text-medical-primary" />,
                title: 'Privacy First',
                desc: 'Encrypted Biometric Storage. Templates are securely stored with role-based access control.',
              },
              {
                icon: <Database className="w-5 h-5 md:w-6 md:h-6 text-purple-500" />,
                title: 'Easy Integration',
                desc: 'Restful API and SDKs for React, Python, and Node.js. Get up and running in minutes.',
              },
              {
                icon: <Globe className="w-5 h-5 md:w-6 md:h-6 text-blue-500" />,
                title: 'Global Compliance',
                desc: 'GDPR, CCPA, and SOC2 compliant. Built to meet international regulatory standards.',
              },
              {
                icon: <Cpu className="w-5 h-5 md:w-6 md:h-6 text-red-500" />,
                title: 'AI Powered',
                desc: 'Next-gen neural networks that adapt to lighting, aging, and accessories.',
              },
              {
                icon: <ShieldCheck className="w-5 h-5 md:w-6 md:h-6 text-green-500" />,
                title: 'Fraud Prevention',
                desc: 'Intelligent Quality Assurance checks image integrity to prevent basic spoofing attempts.',
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="p-6 md:p-8 rounded-2xl bg-slate-50 dark:bg-medical-gray-800 border border-slate-100 dark:border-medical-gray-700 hover:shadow-xl hover:shadow-medical-primary/20 dark:hover:shadow-lg dark:hover:shadow-medical-primary/10 transition-all duration-500 ease-in-out hover:-translate-y-1 group"
              >
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-white dark:bg-medical-gray-700 border border-slate-100 dark:border-medical-gray-600 flex items-center justify-center shadow-sm mb-4 md:mb-6 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white mb-2 md:mb-3">
                  {feature.title}
                </h3>
                <p className="text-xs md:text-sm lg:text-base text-slate-500 dark:text-white/60 leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dark Section (Developer Focused) */}
      <section
        id="api"
        className="py-24 bg-slate-900 dark:bg-black text-white overflow-hidden relative"
      >
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Built for Developers</h2>
              <p className="text-slate-400 dark:text-medical-gray-400 mb-8 text-lg">
                Simple, intuitive APIs that stay out of your way. Integration takes minutes, not
                weeks.
              </p>

              <div className="space-y-6">
                {[
                  'RESTful API endpoints',
                  'Webhooks for real-time events',
                  'Comprehensive documentation',
                  '99.99% Uptime SLA',
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-medical-primary/20 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-medical-primary" />
                    </div>
                    <span className="font-medium text-slate-200 dark:text-medical-gray-200">
                      {item}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-10">
                <Link
                  to="/demo"
                  className="text-medical-primary hover:text-medical-secondary font-semibold flex items-center gap-2"
                >
                  Explore Demo <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="rounded-xl bg-slate-950 dark:bg-medical-gray-900 border border-slate-800 dark:border-medical-gray-700 p-6 font-mono text-sm shadow-2xl">
              <div className="flex gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
              </div>
              <div className="space-y-2 text-slate-300">
                <p>
                  <span className="text-purple-400">const</span>{' '}
                  <span className="text-blue-400">verifyUser</span>{' '}
                  <span className="text-purple-400">=</span>{' '}
                  <span className="text-purple-400">async</span> (image){' '}
                  <span className="text-purple-400">=&gt;</span> {'{'}
                </p>
                <p className="pl-4">
                  <span className="text-purple-400">const</span> response{' '}
                  <span className="text-purple-400">=</span>{' '}
                  <span className="text-purple-400">await</span> api.
                  <span className="text-blue-400">post</span>(
                  <span className="text-green-400">&apos;/verify&apos;</span>, {'{'}
                </p>
                <p className="pl-8">image: image,</p>
                <p className="pl-8">
                  threshold: <span className="text-orange-400">0.95</span>
                </p>
                <p className="pl-4">{'}'});</p>
                <p className="pl-4"></p>
                <p className="pl-4">
                  <span className="text-purple-400">return</span> response.data;
                </p>
                <p>{'}'}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-white dark:bg-medical-gray-900">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-6">
            Ready to get started?
          </h2>
          <p className="text-xl text-slate-600 dark:text-medical-gray-400 mb-10 max-w-2xl mx-auto">
            Join thousands of developers building the future of secure identity verification.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/register"
              className="px-8 py-4 rounded-full bg-slate-900 dark:bg-medical-primary text-white font-semibold hover:bg-slate-800 dark:hover:bg-medical-secondary transition-all shadow-lg shadow-medical-primary/25"
            >
              Create Free Account
            </Link>
            <Link
              to="/demo"
              className="px-8 py-4 rounded-full bg-white dark:bg-medical-gray-800 border border-slate-200 dark:border-medical-gray-700 text-slate-700 dark:text-medical-gray-300 font-semibold hover:bg-slate-50 dark:hover:bg-medical-gray-700 transition-all"
            >
              View Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-50 dark:bg-medical-gray-950 border-t border-slate-200 dark:border-medical-gray-800 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-medical-primary flex items-center justify-center text-white">
                  <ScanFace className="w-5 h-5" />
                </div>
                <span className="text-lg font-bold text-slate-900 dark:text-white">MedLens</span>
              </div>
              <p className="text-slate-500 dark:text-medical-gray-400 text-sm">
                Next-generation medical assistance for the modern world.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 dark:text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-slate-500 dark:text-medical-gray-400">
                <li>
                  <a href="#" className="hover:text-medical-primary transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-medical-primary transition-colors">
                    Security
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-medical-primary transition-colors">
                    Pricing
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 dark:text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-slate-500 dark:text-medical-gray-400">
                <li>
                  <a href="#" className="hover:text-medical-primary transition-colors">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-medical-primary transition-colors">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-medical-primary transition-colors">
                    Contact
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 dark:text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-slate-500 dark:text-medical-gray-400">
                <li>
                  <a href="#" className="hover:text-medical-primary transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-medical-primary transition-colors">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-medical-primary transition-colors">
                    Cookie Policy
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-200 dark:border-medical-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-500 dark:text-medical-gray-500 text-sm">
              © {new Date().getFullYear()} MedLens Inc. All rights reserved.
            </p>
            <div className="flex gap-6">
              <a href="#" className="text-slate-400 hover:text-medical-primary transition-colors">
                <Globe className="w-5 h-5" />
              </a>
              <a href="#" className="text-slate-400 hover:text-medical-primary transition-colors">
                <ShieldCheck className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
