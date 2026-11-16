import React, { useState, useEffect } from 'react';
import { AlertTriangle, PlusCircle, Clock, CheckCircle } from 'lucide-react';
import { complaintAPI, busAPI } from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import ComplaintModal from '../../components/ComplaintModal';

import { useSocket } from '../../context/SocketContext';

const StudentComplaints = () => {
  const { socket } = useSocket();
  const [complaints, setComplaints] = useState([]);
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchComplaints = async () => {
    try {
      const [compRes, busRes] = await Promise.all([
        complaintAPI.getAll(),
        busAPI.getAll()
      ]);
      setComplaints(compRes.data.data || []);
      setBuses(busRes.data.data || []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching complaints:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();

    if (socket) {
      socket.on('complaint_progress_updated', fetchComplaints);
      socket.on('new_complaint_submitted', fetchComplaints);
    }

    return () => {
      if (socket) {
        socket.off('complaint_progress_updated', fetchComplaints);
        socket.off('new_complaint_submitted', fetchComplaints);
      }
    };
  }, [socket]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-6 rounded-3xl border border-amber-200/80 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-amber-600" />
            Student Transport Complaints & Progress
          </h1>
          <p className="text-xs text-slate-600 font-medium mt-1">
            View submitted transport issues and progress resolution updates published by Admin.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold shadow-md shadow-amber-500/20 transition flex items-center gap-2 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          Report Transport Problem
        </button>
      </div>

      <div className="space-y-4">
        {complaints.length > 0 ? (
          complaints.map((c) => (
            <div key={c._id} className="bg-white p-5 rounded-3xl border border-amber-200/80 space-y-3 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-100 pb-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-extrabold uppercase px-2.5 py-1 rounded bg-amber-100 text-amber-900 border border-amber-300">
                    {c.category}
                  </span>
                  <h3 className="text-base font-bold text-slate-900">{c.title}</h3>
                </div>
                <StatusBadge status={c.status} type="complaint" />
              </div>

              <p className="text-xs text-slate-700 leading-relaxed font-medium">{c.description}</p>

              {/* Admin Resolution & Action Proof Section */}
              {(c.proofNote || c.proofImage || c.status === 'in_progress' || c.status === 'resolved') && (
                <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200 space-y-2 mt-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      Resolution & Action Proof Verification
                    </h4>
                    <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase ${
                      c.status === 'resolved' ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-slate-950'
                    }`}>
                      {c.status === 'resolved' ? '✅ Problem Resolved' : '🟡 Action In Progress'}
                    </span>
                  </div>

                  {c.proofNote && (
                    <div className="bg-white p-3 rounded-xl border border-emerald-200 text-xs">
                      <span className="text-[10px] font-bold uppercase text-emerald-800 block mb-0.5">Admin Action Proof Note:</span>
                      <p className="text-slate-800 font-semibold">{c.proofNote}</p>
                    </div>
                  )}

                  {c.proofImage && (
                    <div className="pt-1">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Attached Resolution Proof Document / Photo:</span>
                      <a href={c.proofImage} target="_blank" rel="noopener noreferrer">
                        <img 
                          src={c.proofImage} 
                          alt="Resolution Proof" 
                          className="w-44 h-28 object-cover rounded-xl border border-emerald-300 shadow-sm hover:scale-105 transition-transform cursor-pointer"
                        />
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Progress Updates Timeline */}
              {c.progressUpdates && c.progressUpdates.length > 0 && (
                <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200 space-y-2 mt-3">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-700" />
                    Admin Action History & Timeline
                  </h4>
                  <div className="space-y-2">
                    {c.progressUpdates.map((upd, i) => (
                      <div key={i} className="bg-white p-3 rounded-xl border border-amber-200 text-xs">
                        <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1 font-bold">
                          <span className="text-amber-800">{upd.updatedByName || 'Admin'}</span>
                          <span>{new Date(upd.timestamp).toLocaleString()}</span>
                        </div>
                        <p className="text-slate-800 font-medium">{upd.note}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="bg-white p-12 rounded-3xl border border-amber-200/80 text-center text-slate-500 text-sm font-semibold">
            No complaints reported. Use the button above to report transport issues.
          </div>
        )}
      </div>

      <ComplaintModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userRole="student"
        buses={buses}
        onSuccess={fetchComplaints}
      />
    </div>
  );
};

export default StudentComplaints;
