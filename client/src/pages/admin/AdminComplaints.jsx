import React, { useState, useEffect } from 'react';
import { Wrench, Search, ArrowUpRight, Receipt, Clock } from 'lucide-react';
import { complaintAPI } from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import ProgressUpdateModal from '../../components/ProgressUpdateModal';

import { useSocket } from '../../context/SocketContext';

const AdminComplaints = () => {
  const { socket } = useSocket();
  const [complaints, setComplaints] = useState([]);
  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchComplaints = async () => {
    try {
      const res = await complaintAPI.getAll();
      const all = res.data.data || [];
      setComplaints(all);
      setFilteredComplaints(all);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();

    if (socket) {
      socket.on('new_complaint_submitted', fetchComplaints);
      socket.on('complaint_progress_updated', fetchComplaints);
    }

    return () => {
      if (socket) {
        socket.off('new_complaint_submitted', fetchComplaints);
        socket.off('complaint_progress_updated', fetchComplaints);
      }
    };
  }, [socket]);

  useEffect(() => {
    let result = complaints;

    if (roleFilter !== 'all') {
      result = result.filter(c => c.reportedRole === roleFilter);
    }

    if (statusFilter !== 'all') {
      result = result.filter(c => c.status === statusFilter);
    }

    if (categoryFilter !== 'all') {
      result = result.filter(c => c.category === categoryFilter);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c => 
        c.title.toLowerCase().includes(q) || 
        c.description.toLowerCase().includes(q) ||
        (c.reportedBy?.name && c.reportedBy.name.toLowerCase().includes(q))
      );
    }

    setFilteredComplaints(result);
  }, [roleFilter, statusFilter, categoryFilter, searchQuery, complaints]);

  const openResolverModal = (c) => {
    setSelectedComplaint(c);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-amber-200/80 shadow-sm">
        <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
          <Wrench className="w-6 h-6 text-amber-600" />
          Complaint Solver & Garage Bill Desk
        </h1>
        <p className="text-xs text-slate-600 font-medium mt-1">
          Review, resolve, and publish progress updates for Driver complaints (Oil, Brake, Seat, Water Wash, Tyre, Window) and Student transport problems.
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-3xl border border-amber-200/80 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search title, details, user..."
              className="w-full pl-10 pr-3 py-2 bg-amber-50/40 border border-amber-200 rounded-xl text-slate-900 text-xs font-semibold focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Role Filter */}
          <div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3 py-2 bg-amber-50/40 border border-amber-200 rounded-xl text-slate-900 text-xs font-bold focus:outline-none"
            >
              <option value="all">All Reporter Roles (Drivers & Students)</option>
              <option value="driver">Driver Complaints Only</option>
              <option value="student">Student Issues Only</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-amber-50/40 border border-amber-200 rounded-xl text-slate-900 text-xs font-bold focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 bg-amber-50/40 border border-amber-200 rounded-xl text-slate-900 text-xs font-bold focus:outline-none"
            >
              <option value="all">All Categories</option>
              <option value="oil">Oil / Fuel</option>
              <option value="brake">Brake</option>
              <option value="seat">Seat</option>
              <option value="water_wash">Water Wash</option>
              <option value="tyre">Tyre</option>
              <option value="window">Window</option>
              <option value="delay">Bus Delay</option>
              <option value="other">Other</option>
            </select>
          </div>

        </div>
      </div>

      {/* Complaint List */}
      <div className="space-y-4">
        {filteredComplaints.length > 0 ? (
          filteredComplaints.map((c) => (
            <div key={c._id} className="bg-white p-5 rounded-3xl border border-amber-200/80 space-y-3 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold uppercase px-2.5 py-1 rounded bg-amber-100 text-amber-900 border border-amber-300">
                    {c.category}
                  </span>
                  <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                    c.reportedRole === 'driver' ? 'bg-amber-200 text-amber-950' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {c.reportedRole}
                  </span>
                  <StatusBadge status={c.status} type="complaint" />
                </div>

                <button
                  onClick={() => openResolverModal(c)}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-amber-500/20"
                >
                  <span>Resolve & Issue Bill Pass</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900">{c.title}</h3>
                <p className="text-xs text-slate-700 font-medium mt-1 leading-relaxed">{c.description}</p>
              </div>

              {/* Requisition Bill Pass info */}
              {(c.isRequisition || c.estimatedPrice > 0) && (
                <div className="bg-amber-50 p-3 rounded-2xl border border-amber-200 text-xs flex justify-between items-center">
                  <span className="font-extrabold text-amber-900 flex items-center gap-1">
                    <Receipt className="w-4 h-4 text-amber-700" />
                    Requisition Price: ${c.estimatedPrice || 0}
                  </span>
                  {c.billPassNote && <span className="text-slate-600 font-semibold">{c.billPassNote}</span>}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 font-bold pt-2 border-t border-amber-100">
                <span>Reported by: <strong className="text-slate-900">{c.reportedBy?.name || 'User'}</strong> ({c.reportedBy?.email})</span>
                <span>Target Progress Audience: <strong className="text-amber-800 uppercase">{c.targetAudience || 'all'}</strong></span>
              </div>

              {/* Progress History */}
              {c.progressUpdates && c.progressUpdates.length > 0 && (
                <div className="bg-amber-50/70 p-3 rounded-2xl border border-amber-200 space-y-2 text-xs">
                  <span className="text-[10px] font-extrabold uppercase text-amber-900">PUBLISHED PROGRESS UPDATES:</span>
                  {c.progressUpdates.map((upd, idx) => (
                    <div key={idx} className="bg-white p-2.5 rounded-xl border border-amber-200">
                      <div className="flex justify-between text-[10px] text-slate-500 font-bold">
                        <span className="text-amber-800">{upd.updatedByName || 'Admin'}</span>
                        <span>Target: <strong className="uppercase">{upd.targetAudience}</strong> • {new Date(upd.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-slate-800 text-xs font-medium mt-0.5">{upd.note}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="bg-white p-12 rounded-3xl border border-amber-200/80 text-center text-slate-500 text-sm font-semibold">
            No complaints found matching the criteria.
          </div>
        )}
      </div>

      {selectedComplaint && (
        <ProgressUpdateModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          complaint={selectedComplaint}
          onSuccess={fetchComplaints}
        />
      )}
    </div>
  );
};

export default AdminComplaints;
