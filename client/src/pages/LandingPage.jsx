import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo';
import { playBusHorn, startRepeatingBusHorn, stopRepeatingBusHorn } from '../utils/audio';
import { 
  Bus, 
  ShieldCheck, 
  MapPin, 
  Wrench, 
  Megaphone, 
  Clock, 
  ArrowRight, 
  Users, 
  Navigation, 
  Activity,
  Sparkles
} from 'lucide-react';

const LandingPage = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [splashFading, setSplashFading] = useState(false);
  const [splashProgress, setSplashProgress] = useState(0);

  // Play bus horn automatically & repeat every 6 seconds
  useEffect(() => {
    // Start repeating horn playback
    startRepeatingBusHorn(6000);

    // Fallback trigger on first user click/tap if browser blocked silent autoplay
    const handleFirstInteraction = () => {
      startRepeatingBusHorn(6000);
      window.removeEventListener('pointerdown', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };

    window.addEventListener('pointerdown', handleFirstInteraction);
    window.addEventListener('keydown', handleFirstInteraction);

    // Animate splash progress bar
    const interval = setInterval(() => {
      setSplashProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 5;
      });
    }, 60);

    // Fade out splash overlay after ~2.2s
    const fadeTimer = setTimeout(() => {
      setSplashFading(true);
    }, 2000);

    // Unmount splash overlay after fade completes
    const hideTimer = setTimeout(() => {
      setShowSplash(false);
    }, 2700);

    return () => {
      clearInterval(interval);
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
      stopRepeatingBusHorn();
      window.removeEventListener('pointerdown', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };
  }, []);

  return (
    <div className="min-h-screen bg-amber-50/60 text-slate-800 flex flex-col justify-between overflow-x-hidden selection:bg-amber-400 selection:text-slate-950 relative">
      
      {/* Hotstar-Style App Opening Splash Screen Overlay */}
      {showSplash && (
        <div 
          className={`fixed inset-0 z-50 bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950 flex flex-col items-center justify-center p-6 text-center transition-all duration-700 ${
            splashFading ? 'opacity-0 pointer-events-none scale-105' : 'opacity-100 scale-100'
          }`}
        >
          {/* Ambient Lighting Orbs */}
          <div className="absolute w-96 h-96 bg-amber-500/20 rounded-full blur-3xl animate-pulse-slow"></div>
          
          <div className="relative z-10 flex flex-col items-center space-y-6 max-w-sm w-full">
            
            {/* Animated Pulsing Logo Badge */}
            <div className="relative group">
              <div className="absolute -inset-4 bg-gradient-to-r from-amber-500 to-yellow-400 rounded-3xl blur-2xl opacity-75 animate-ping"></div>
              <div className="relative transform transition-all duration-700 animate-float">
                <Logo size="xxl" variant="graphic" className="shadow-2xl ring-4 ring-amber-400/40" />
              </div>
            </div>

            {/* App Name Reveal Animation */}
            <div className="space-y-2 pt-2">
              <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white flex items-center justify-center gap-1">
                Campus<span className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 bg-clip-text text-transparent drop-shadow-md">Ride</span>
              </h1>
              <p className="text-xs font-extrabold uppercase tracking-widest text-amber-400">
                Rohini College Transit System
              </p>
            </div>

            {/* Sleek App Loading Progress Bar */}
            <div className="w-48 space-y-1.5 pt-4">
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
                <div 
                  className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-100 ease-out"
                  style={{ width: `${splashProgress}%` }}
                ></div>
              </div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                Launching Campus Fleet App...
              </span>
            </div>

          </div>
        </div>
      )}

      {/* Subtle Warm Decorative Orbs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-amber-200/40 via-yellow-100/30 to-transparent blur-3xl pointer-events-none"></div>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16 flex-1 flex flex-col justify-center relative z-10 w-full">
        
        {/* Brand Showcase Badge with Zoomed Bus Engine Motion */}
        <div className="flex flex-col items-center justify-center mb-6">
          <div className="relative group">
            <div className="absolute -inset-3 bg-amber-400/40 rounded-3xl blur-xl opacity-75 animate-pulse"></div>
            <Logo size="xl" variant="graphic" animated={true} />
          </div>
        </div>

        {/* Top Tagline Pill */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-amber-200 shadow-sm text-xs font-bold text-slate-700">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span>
            <span className="text-amber-700 font-extrabold">Rohini College Transit System</span> 
          </div>
        </div>

        {/* Hero Title & Description */}
        <div className="text-center max-w-4xl mx-auto space-y-4">
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Smart Campus Transit, <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-600 bg-clip-text text-transparent">
              Live Fleet Control & Maintenance
            </span>
          </h1>
          <p className="text-slate-600 text-base sm:text-lg max-w-2xl mx-auto font-medium">
            Empowering Rohini College Students with live GPS bus tracking and instant delay alerts, Drivers with streamlined vehicle complaint reporting, and Admins with total fleet control.
          </p>
        </div>

        {/* Role Portal Cards Grid */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto w-full">
          
          {/* Student Portal Card */}
          <div className="group relative rounded-3xl bg-white border border-amber-200/80 p-6 hover:border-emerald-500 hover:shadow-xl hover:shadow-emerald-100 transition-all duration-300 flex flex-col justify-between shadow-sm">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Navigation className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-700">ROLE PORTAL</span>
                <h3 className="text-xl font-extrabold text-slate-900 mt-1">Student Portal</h3>
                <p className="text-slate-600 text-xs mt-2 leading-relaxed">
                  Track assigned bus in real-time on Rohini College campus map (Tirunelveli & Nagercoil routes), check driver details, view ETA countdown, and receive delay alerts.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-amber-100 flex items-center justify-between">
              <Link
                to="/login?role=student"
                className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold transition text-center flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20"
              >
                Student Sign In <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Driver Portal Card */}
          <div className="group relative rounded-3xl bg-white border border-amber-200/80 p-6 hover:border-amber-400 hover:shadow-xl hover:shadow-amber-100 transition-all duration-300 flex flex-col justify-between shadow-sm">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-300 text-amber-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Wrench className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-800">ROLE PORTAL</span>
                <h3 className="text-xl font-extrabold text-slate-900 mt-1">Driver Portal</h3>
                <p className="text-slate-600 text-xs mt-2 leading-relaxed">
                  Control trip routes, trigger real-time GPS simulation, and report vehicle maintenance issues (Oil, Brake, Seat, Water Wash, Tyre, Window, Other).
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-amber-100 flex items-center justify-between">
              <Link
                to="/login?role=driver"
                className="w-full py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold transition text-center flex items-center justify-center gap-2 shadow-md shadow-amber-500/20"
              >
                Driver Sign In <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Admin Portal Card */}
          <div className="group relative rounded-3xl bg-white border border-amber-200/80 p-6 hover:border-purple-400 hover:shadow-xl hover:shadow-purple-100 transition-all duration-300 flex flex-col justify-between shadow-sm">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 border border-purple-300 text-purple-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-purple-700">ROLE PORTAL</span>
                <h3 className="text-xl font-extrabold text-slate-900 mt-1">Admin Operations</h3>
                <p className="text-slate-600 text-xs mt-2 leading-relaxed">
                  Full control center: solve driver & student complaints, publish targeted progress updates & garage purchase bill passes, manage routes/buses, and broadcast announcements.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-amber-100 flex items-center justify-between">
              <Link
                to="/login?role=admin"
                className="w-full py-3 px-4 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-extrabold transition text-center flex items-center justify-center gap-2 shadow-md shadow-purple-600/20"
              >
                Admin Sign In <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

        </div>

        {/* Feature Highlights Banner */}
        <div className="mt-16 bg-white border border-amber-200/80 rounded-3xl p-6 sm:p-8 max-w-5xl mx-auto w-full grid grid-cols-2 md:grid-cols-4 gap-6 text-center shadow-sm">
          <div>
            <Clock className="w-6 h-6 text-amber-600 mx-auto mb-2" />
            <h4 className="font-extrabold text-slate-900 text-sm">Real-Time ETA</h4>
            <p className="text-slate-500 text-xs mt-1">Live recalculation</p>
          </div>
          <div>
            <Wrench className="w-6 h-6 text-amber-600 mx-auto mb-2" />
            <h4 className="font-extrabold text-slate-900 text-sm">Problem Categories</h4>
            <p className="text-slate-500 text-xs mt-1">Oil, Brake, Seat, Tyre, Wash</p>
          </div>
          <div>
            <Users className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
            <h4 className="font-extrabold text-slate-900 text-sm">Targeted Resolution</h4>
            <p className="text-slate-500 text-xs mt-1">Driver vs Student updates</p>
          </div>
          <div>
            <Activity className="w-6 h-6 text-purple-600 mx-auto mb-2" />
            <h4 className="font-extrabold text-slate-900 text-sm">GPS Simulation</h4>
            <p className="text-slate-500 text-xs mt-1">Live trajectory replay</p>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-amber-200/80 py-6 text-center text-xs font-bold text-slate-500 bg-white relative z-10">
        <p>© Rohini College of Engineering & Technology - CampusRide System.</p>
      </footer>
    </div>
  );
};

export default LandingPage;