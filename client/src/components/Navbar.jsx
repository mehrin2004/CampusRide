import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Bus, 
  LogOut, 
  ShieldCheck, 
  Wifi, 
  WifiOff, 
  User as UserIcon,
  ChevronDown,
  Download,
  Volume2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { playBusHorn, playAppChime } from '../utils/audio';

import Logo from './Logo';

import NotificationBell from './NotificationBell';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { connected } = useSocket();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallApp = async () => {
    if (!deferredPrompt) {
      alert("CampusRide App is ready! To install as a desktop/mobile app: Click your browser's menu (⋮ or ⊕) and select 'Install CampusRide' or 'Add to Home Screen'.");
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'driver':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'student':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-amber-200/80 bg-white/90 backdrop-blur-md shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link to={user ? `/${user.role}` : '/'} className="flex items-center">
          <Logo size="md" />
        </Link>

        {/* Right Navigation */}
        <div className="flex items-center gap-2 sm:gap-3">

          {/* Socket Connection Status */}
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-xs font-semibold text-slate-700">
            {connected ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-bold">Realtime GPS Active</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-500">Connecting...</span>
              </>
            )}
          </div>

          {/* User Profile or Login/Register Links */}
          {user ? (
            <div className="flex items-center gap-2">
              <NotificationBell />
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2.5 p-1.5 pl-3 rounded-2xl bg-amber-50/80 border border-amber-200 hover:border-amber-300 transition cursor-pointer"
                >
                <div className="text-right hidden sm:block">
                  <span className="block text-xs font-extrabold text-slate-900">{user.name}</span>
                  <span className={`inline-block px-2 py-0.2 rounded text-[10px] font-extrabold uppercase border ${getRoleBadgeStyle(user.role)}`}>
                    {user.role}
                  </span>
                </div>
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-extrabold text-sm shadow-sm">
                  {user.name?.charAt(0) || 'U'}
                </div>
                <ChevronDown className="w-4 h-4 text-slate-500 hidden sm:block" />
              </button>

              {/* User Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-60 bg-white border border-amber-200 rounded-3xl shadow-xl p-2 z-50">
                  <div className="p-3 border-b border-amber-100 mb-1">
                    <p className="text-xs font-extrabold text-slate-900">{user.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                    {user.rollNumber && <p className="text-[11px] text-emerald-700 font-bold mt-1">Roll: {user.rollNumber}</p>}
                    {user.licenseNumber && <p className="text-[11px] text-amber-700 font-bold mt-1">License: {user.licenseNumber}</p>}
                  </div>

                  <Link
                    to={`/${user.role}`}
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-amber-50 rounded-xl transition"
                  >
                    <ShieldCheck className="w-4 h-4 text-amber-600" />
                    Dashboard Home
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition mt-1"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-4 py-2 rounded-2xl text-xs font-bold text-slate-700 hover:bg-amber-50 transition"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold shadow-md shadow-amber-500/20 transition"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
