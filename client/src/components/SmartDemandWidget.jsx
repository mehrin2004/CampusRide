import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  MapPin, 
  Bus, 
  Calendar, 
  Sparkles, 
  Check, 
  X,
  AlertCircle
} from 'lucide-react';
import { demandAPI } from '../services/api';
import { playAppChime } from '../utils/audio';

const SmartDemandWidget = ({ user, assignedBusNumber, assignedBus }) => {
  const targetBus = assignedBus || user?.assignedBus;
  
  const getDynamicStops = () => {
    if (targetBus && targetBus.route && Array.isArray(targetBus.route.stops) && targetBus.route.stops.length > 0) {
      return targetBus.route.stops.map(s => (typeof s === 'string' ? s : s.name));
    }
    const bNum = String(assignedBusNumber || targetBus?.busNumber || user?.assignedBus || '').toUpperCase();
    if (bNum.includes('14A')) {
      return [
        'Vadukatchimathil',
        'Dohnavur',
        'Eruvadi',
        'Panagudi',
        'Rohini College Campus (RCET)'
      ];
    }
    if (bNum.includes('43C')) {
      return [
        'Town (Tirunelveli)',
        'Melapalayam',
        'New Bus Stand',
        'Palayamkottai',
        'KTC Nagar',
        'Nanguneri Toll Gate',
        'Vallioor Bypass',
        'Panagudi',
        'Rohini College Campus (RCET)'
      ];
    }
    // Default to 32C stops
    return [
      'Parappadi',
      'Nanguneri',
      'Sirumalanji',
      'Perumalanji',
      'Vallioor',
      'Therku Vallioor',
      'Kalanthapani',
      'Rohini College Campus (RCET)'
    ];
  };

  const routeStops = getDynamicStops();
  const [selectedStop, setSelectedStop] = useState(routeStops[0]);
  const [currentStatus, setCurrentStatus] = useState(null); // 'coming' | 'not_coming' | null
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const busNum = assignedBusNumber || targetBus?.busNumber || '32C';

  const fetchMyStatus = async () => {
    try {
      const res = await demandAPI.getMyStatus();
      if (res.data.data) {
        setCurrentStatus(res.data.data.status);
        if (res.data.data.stopName) {
          setSelectedStop(res.data.data.stopName);
        }
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching demand status:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyStatus();
  }, []);

  useEffect(() => {
    if (routeStops.length > 0 && !routeStops.includes(selectedStop)) {
      setSelectedStop(routeStops[0]);
    }
  }, [routeStops.join(',')]);

  const handleRespond = async (status) => {
    try {
      setSubmitting(true);
      setMessage('');
      playAppChime();

      const res = await demandAPI.submitResponse({
        busNumber: busNum,
        stopName: selectedStop,
        status
      });

      setCurrentStatus(status);
      setMessage(res.data.message || 'Attendance status saved!');
      setSubmitting(false);
    } catch (err) {
      console.error(err);
      setMessage('Error updating bus attendance response.');
      setSubmitting(false);
    }
  };

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });

  return (
    <div className="bg-gradient-to-br from-amber-500 via-amber-400 to-yellow-500 rounded-3xl p-5 sm:p-6 text-slate-950 shadow-xl border border-amber-300 relative overflow-hidden">
      
      {/* Decorative Background Graphic */}
      <div className="absolute -right-8 -bottom-8 opacity-15 pointer-events-none">
        <Bus className="w-48 h-48 text-slate-950" />
      </div>

      <div className="relative z-10 space-y-4">
        
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-950/15 pb-3">
          <div>
            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded bg-slate-950 text-amber-400 shadow-sm">
              <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" />
              SMART BUS DEMAND SYSTEM
            </span>
            <h2 className="text-xl font-black tracking-tight text-slate-950 mt-1">
              Are you riding the campus bus today?
            </h2>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-black bg-slate-950/10 px-3 py-1.5 rounded-2xl border border-slate-950/15 self-start sm:self-auto">
            <Calendar className="w-3.5 h-3.5 text-slate-900" />
            <span>Today ({todayFormatted})</span>
          </div>
        </div>

        {/* Stop Selection Dropdown */}
        <div className="space-y-1.5">
          <label className="block text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-amber-900" />
            Select Your Bus Stop
          </label>
          <select
            value={selectedStop}
            onChange={(e) => setSelectedStop(e.target.value)}
            className="w-full px-4 py-2.5 bg-white border-2 border-slate-950/20 rounded-2xl text-slate-900 text-xs sm:text-sm font-extrabold focus:outline-none focus:border-slate-950 shadow-sm"
          >
            {routeStops.map((stop) => (
              <option key={stop} value={stop}>
                {stop}
              </option>
            ))}
          </select>
        </div>

        {/* Action Buttons: Coming / Not Coming */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          
          {/* ✅ Coming / Will Board */}
          <button
            type="button"
            onClick={() => handleRespond('coming')}
            disabled={submitting}
            className={`py-3.5 px-4 rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md ${
              currentStatus === 'coming'
                ? 'bg-emerald-950 text-emerald-300 ring-4 ring-emerald-600/40 scale-[1.02]'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white hover:scale-105 active:scale-95'
            }`}
          >
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{currentStatus === 'coming' ? '✅ Confirmed: Will Board' : '✅ Coming / Will Board'}</span>
          </button>

          {/* ❌ Not Coming / Will Not Board */}
          <button
            type="button"
            onClick={() => handleRespond('not_coming')}
            disabled={submitting}
            className={`py-3.5 px-4 rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md ${
              currentStatus === 'not_coming'
                ? 'bg-rose-950 text-rose-300 ring-4 ring-rose-600/40 scale-[1.02]'
                : 'bg-rose-600 hover:bg-rose-500 text-white hover:scale-105 active:scale-95'
            }`}
          >
            <XCircle className="w-5 h-5 shrink-0" />
            <span>{currentStatus === 'not_coming' ? '❌ Marked: Not Coming' : '❌ Not Coming / Will Not Board'}</span>
          </button>
        </div>

        {/* Live Feedback Status Message */}
        {message && (
          <div className="p-3 bg-slate-950/90 text-amber-300 rounded-2xl text-xs font-black flex items-center gap-2 border border-slate-900 shadow-md">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {/* Current Selection Pill */}
        {currentStatus && (
          <div className="p-3 bg-slate-950/10 rounded-2xl border border-slate-950/20 text-xs font-extrabold flex items-center justify-between text-slate-900">
            <span>Your Response for Today:</span>
            <span className={`px-3 py-1 rounded-xl text-xs font-black uppercase ${
              currentStatus === 'coming' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
            }`}>
              {currentStatus === 'coming' ? `Riding from ${selectedStop}` : 'Not Boarding Bus Today'}
            </span>
          </div>
        )}

      </div>
    </div>
  );
};

export default SmartDemandWidget;
