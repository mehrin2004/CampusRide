import React from 'react';
import { AlertOctagon, ShieldAlert, CheckCircle2, Gauge, Activity } from 'lucide-react';

const SpeedViolationMonitor = ({ currentSpeed = 48, maxLimit = 60, busNumber = 'RCET-BUS-01' }) => {
  const isSpeeding = currentSpeed > maxLimit;

  return (
    <div className={`p-4 rounded-3xl border transition-all duration-300 ${
      isSpeeding 
        ? 'bg-rose-50 border-rose-300 text-rose-900 shadow-lg shadow-rose-500/10 animate-pulse-slow' 
        : 'bg-amber-50/60 border-amber-200/80 text-slate-800'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold ${
            isSpeeding ? 'bg-rose-600 text-white' : 'bg-amber-500 text-slate-950'
          }`}>
            {isSpeeding ? <ShieldAlert className="w-5 h-5 animate-bounce" /> : <Gauge className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${
                isSpeeding 
                  ? 'bg-rose-200 text-rose-900 border-rose-400' 
                  : 'bg-amber-100 text-amber-900 border-amber-300'
              }`}>
                TELEMATICS SPEED MONITOR
              </span>
              <span className="text-xs font-extrabold text-slate-700">{busNumber}</span>
            </div>
            <h4 className="text-sm font-extrabold mt-0.5">
              {isSpeeding ? '⚠️ SPEED VIOLATION WARNING DETECTED' : 'Highway Speed Compliance Normal'}
            </h4>
          </div>
        </div>

        <div className="text-right">
          <span className={`text-xl font-black block leading-none ${isSpeeding ? 'text-rose-600' : 'text-slate-900'}`}>
            {currentSpeed} <span className="text-xs font-bold text-slate-500">km/h</span>
          </span>
          <span className="text-[10px] text-slate-500 font-extrabold uppercase">Limit: {maxLimit} km/h</span>
        </div>
      </div>

      {isSpeeding && (
        <div className="mt-3 p-2.5 bg-rose-100/90 rounded-2xl border border-rose-300 text-xs font-extrabold text-rose-900 flex items-center gap-2">
          <AlertOctagon className="w-4 h-4 text-rose-700 shrink-0" />
          <span>Vehicle speed exceeds safety threshold ({currentSpeed} km/h vs 60 km/h). Incident logged to Transport Admin.</span>
        </div>
      )}
    </div>
  );
};

export default SpeedViolationMonitor;
