import React from 'react';
import { Leaf, Trees, Fuel, Award, Sparkles } from 'lucide-react';

const GreenCampusMetric = ({ variant = 'card', className = '' }) => {
  if (variant === 'banner') {
    return (
      <div className={`bg-gradient-to-r from-emerald-900 via-teal-950 to-slate-900 border border-emerald-500/40 p-5 rounded-3xl text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-4 ${className}`}>
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400 text-emerald-400 flex items-center justify-center shrink-0">
            <Leaf className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-950 px-2.5 py-0.5 rounded border border-emerald-500/40">
                NAAC GREEN CAMPUS INITIATIVE
              </span>
              <span className="text-xs text-slate-300 font-bold">Rohini Eco-Transit</span>
            </div>
            <h3 className="text-lg font-extrabold text-white mt-0.5">Green Campus Carbon Footprint Savings</h3>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 w-full md:w-auto text-center">
          <div className="bg-slate-900/80 px-3 py-2 rounded-2xl border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">CO₂ Saved</span>
            <span className="text-sm font-black text-emerald-400">14,250 kg</span>
          </div>
          <div className="bg-slate-900/80 px-3 py-2 rounded-2xl border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Fuel Saved</span>
            <span className="text-sm font-black text-amber-400">5,800 Liters</span>
          </div>
          <div className="bg-slate-900/80 px-3 py-2 rounded-2xl border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Eco Rating</span>
            <span className="text-sm font-black text-teal-300">A+ Grade</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-emerald-200/90 rounded-3xl p-5 shadow-sm space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <Leaf className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 block">
              ECO TRANSIT METRIC
            </span>
            <h4 className="text-xs font-extrabold text-slate-900">Green Campus Savings</h4>
          </div>
        </div>
        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
          NAAC A+ Rating
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-center pt-1">
        <div className="bg-emerald-50/80 p-2.5 rounded-2xl border border-emerald-200/60">
          <span className="text-[10px] text-slate-600 font-bold uppercase block">CO₂ Offset</span>
          <span className="text-sm font-black text-emerald-800">14,250 kg</span>
        </div>
        <div className="bg-emerald-50/80 p-2.5 rounded-2xl border border-emerald-200/60">
          <span className="text-[10px] text-slate-600 font-bold uppercase block">Tree Equivalent</span>
          <span className="text-sm font-black text-emerald-800">712 Trees 🌲</span>
        </div>
      </div>
    </div>
  );
};

export default GreenCampusMetric;
