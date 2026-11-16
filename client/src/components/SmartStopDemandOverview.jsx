import React, { useState, useEffect } from 'react';
import { 
  Users, 
  MapPin, 
  CheckCircle, 
  XCircle, 
  Fuel, 
  Clock, 
  RefreshCw, 
  ChevronRight,
  Info,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { demandAPI } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { playAppChime } from '../utils/audio';

const SmartStopDemandOverview = ({ busNumber }) => {
  const { socket } = useSocket();
  const [demandData, setDemandData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedStopDetails, setSelectedStopDetails] = useState(null);

  const targetBus = busNumber || 'RCET-BUS-01';

  const fetchDemand = async () => {
    try {
      const res = await demandAPI.getBusSummary(targetBus);
      setDemandData(res.data || null);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching stop demand overview:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDemand();

    if (socket) {
      socket.on('demand_updated', (data) => {
        if (data.busNumber === targetBus) {
          fetchDemand();
          playAppChime();
        }
      });
    }

    return () => {
      if (socket) {
        socket.off('demand_updated');
      }
    };
  }, [targetBus, socket]);

  if (loading) {
    return (
      <div className="bg-white border border-amber-200 rounded-3xl p-6 shadow-sm text-center text-xs font-bold text-slate-500">
        Loading smart stop demand data...
      </div>
    );
  }

  const stops = demandData?.stops || [];
  const totalRiders = demandData?.totalExpectedRiders || 0;
  const zeroStopsCount = demandData?.zeroStudentStopsCount || 0;

  return (
    <div className="bg-white border border-amber-200 rounded-3xl p-6 shadow-sm space-y-5">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest bg-amber-500 text-slate-950 px-2.5 py-0.5 rounded shadow-sm">
              SMART ROUTE OPTIMIZATION
            </span>
            <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Live Morning Check-In
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-900 mt-1 flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-600" />
            Stop-by-Stop Student Demand Summary
          </h2>
          <p className="text-xs text-slate-600 font-medium mt-0.5">
            Real-time student headcount per bus stop for <strong className="text-slate-900">{targetBus}</strong> today.
          </p>
        </div>

        <button
          onClick={() => {
            fetchDemand();
            playAppChime();
          }}
          className="p-2.5 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 transition flex items-center gap-1.5 text-xs font-extrabold cursor-pointer self-start sm:self-auto"
          title="Refresh Student Counts"
        >
          <RefreshCw className="w-4 h-4 text-amber-700" />
          <span>Refresh Counts</span>
        </button>
      </div>

      {/* Metric Cards Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        
        <div className="bg-amber-50/80 p-4 rounded-2xl border border-amber-200 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-extrabold text-lg shrink-0 shadow-sm">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-amber-800">EXPECTED RIDERS TODAY</span>
            <h3 className="text-lg font-black text-slate-900">{totalRiders} Students</h3>
          </div>
        </div>

        <div className="bg-emerald-50/80 p-4 rounded-2xl border border-emerald-200 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-extrabold text-lg shrink-0 shadow-sm">
            <Fuel className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-emerald-800">SKIPPABLE 0-STUDENT STOPS</span>
            <h3 className="text-lg font-black text-emerald-950">{zeroStopsCount} Stops</h3>
          </div>
        </div>

        <div className="bg-slate-900 p-4 rounded-2xl text-white flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-extrabold text-lg shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-amber-400">ESTIMATED RESOURCE SAVED</span>
            <h3 className="text-sm font-extrabold text-slate-100">{zeroStopsCount * 6} mins & Fuel Saved</h3>
          </div>
        </div>

      </div>

      {/* Stop-by-Stop List View */}
      <div className="space-y-3">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
          Route Stop Demand Breakdowns:
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {stops.map((stopItem) => {
            const hasStudents = stopItem.comingCount > 0;

            return (
              <div
                key={stopItem.stopName}
                onClick={() => setSelectedStopDetails(stopItem)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 shadow-xs hover:scale-[1.01] ${
                  hasStudents
                    ? 'bg-amber-50/60 border-amber-300 hover:border-amber-400'
                    : 'bg-slate-50 border-slate-200 opacity-80 hover:opacity-100'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-extrabold text-base ${
                    hasStudents ? 'bg-amber-500 text-slate-950 shadow-sm' : 'bg-slate-200 text-slate-500'
                  }`}>
                    {hasStudents ? '🧑🤝🧑' : '⚪'}
                  </div>

                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 truncate flex items-center gap-1.5">
                      <span>{stopItem.stopName}</span>
                    </h4>
                    
                    {hasStudents ? (
                      <span className="text-[11px] font-extrabold text-amber-900 flex items-center gap-1 mt-0.5">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        {stopItem.comingCount} {stopItem.comingCount === 1 ? 'Student' : 'Students'} Expected
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1 mt-0.5">
                        <XCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        ⚪ No students expected (Safe to Skip)
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className={`px-2.5 py-1 rounded-xl text-xs font-black ${
                    hasStudents ? 'bg-amber-100 text-amber-950 border border-amber-300' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {stopItem.comingCount}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Student List Detail Modal */}
      {selectedStopDetails && (
        <div 
          onClick={() => setSelectedStopDetails(null)}
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white border border-amber-300 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-amber-100 pb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-amber-800">STOP DEMAND DETAILS</span>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-amber-600" />
                  {selectedStopDetails.stopName}
                </h3>
              </div>
              <span className="text-xs font-black px-3 py-1 bg-amber-100 text-amber-950 rounded-xl border border-amber-300">
                {selectedStopDetails.comingCount} Riders
              </span>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase text-slate-600">Expected Students List:</h4>
              
              {selectedStopDetails.studentsComing.length === 0 ? (
                <p className="text-xs text-slate-500 font-medium italic bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  ⚪ No students have marked 'Coming' for this stop today.
                </p>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {selectedStopDetails.studentsComing.map((st, idx) => (
                    <div key={idx} className="p-3 bg-amber-50/70 border border-amber-200 rounded-2xl flex items-center justify-between text-xs">
                      <span className="font-extrabold text-slate-900">{st.name}</span>
                      <span className="font-mono font-bold text-amber-800 text-[11px]">{st.rollNumber}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedStopDetails(null)}
              className="w-full py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs cursor-pointer shadow-md"
            >
              Close Summary
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default SmartStopDemandOverview;
