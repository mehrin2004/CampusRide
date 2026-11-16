import React, { useState } from 'react';
import { X, CheckCircle, Clock, Users, Receipt, Upload } from 'lucide-react';
import { complaintAPI } from '../services/api';
import StatusBadge from './StatusBadge';

const ProgressUpdateModal = ({ isOpen, onClose, complaint, onSuccess }) => {
  const [status, setStatus] = useState(complaint?.status || 'in_progress');
  const [targetAudience, setTargetAudience] = useState(complaint?.targetAudience || 'all');
  const [note, setNote] = useState('');
  const [resolutionNote, setResolutionNote] = useState(complaint?.resolutionNote || '');
  const [proofNote, setProofNote] = useState(complaint?.proofNote || '');
  const [proofImage, setProofImage] = useState(complaint?.proofImage || '');
  const [estimatedPrice, setEstimatedPrice] = useState(complaint?.estimatedPrice || 0);
  const [billPassNote, setBillPassNote] = useState(complaint?.billPassNote || '');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleProofImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image file size must be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isOpen || !complaint) return null;

  const handleUpdate = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError(null);

    try {
      await complaintAPI.updateProgress(complaint._id, {
        status,
        note,
        targetAudience,
        resolutionNote: status === 'resolved' ? (resolutionNote || note) : resolutionNote,
        proofNote: proofNote || note,
        proofImage,
        estimatedPrice,
        billPassNote
      });

      setLoading(false);
      setNote('');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update progress');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white border border-amber-200 rounded-3xl p-6 shadow-2xl">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-2 rounded-full hover:bg-amber-50 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-6 border-b border-amber-100 pb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-amber-800 px-2.5 py-0.5 rounded bg-amber-100 border border-amber-300">
              ADMIN RESOLUTION & BILL DESK
            </span>
            <StatusBadge status={complaint.status} type="complaint" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">{complaint.title}</h2>
          <p className="text-slate-600 text-xs mt-1">
            Reported by <strong className="text-slate-800">{complaint.reportedBy?.name || 'User'}</strong> ({complaint.reportedRole?.toUpperCase()})
            {complaint.bus && ` • Bus ${complaint.bus?.busNumber}`}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleUpdate} className="space-y-5">
          
          {/* Status & Target Audience */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Update Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-4 py-2.5 bg-amber-50/40 border border-amber-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-amber-500 font-semibold"
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved (Complete)</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-amber-700" />
                Target Audience
              </label>
              <select
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                className="w-full px-4 py-2.5 bg-amber-50/40 border border-amber-200 rounded-xl text-slate-900 text-sm font-semibold text-amber-800"
              >
                <option value="students">Students Only (Show on Student Dashboard)</option>
                <option value="drivers">Drivers Only (Show on Driver Dashboard)</option>
                <option value="all">Both Students & Drivers (Public)</option>
              </select>
            </div>
          </div>

          {/* Conditional Section: Garage Bill Generator for Driver Requisitions vs Action & Proof Verification for Students */}
          {complaint.reportedRole === 'driver' || complaint.isRequisition ? (
            <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200 space-y-3">
              <h4 className="text-xs font-extrabold uppercase text-amber-900 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-amber-700" />
                Garage Purchase Bill Pass Generator (Driver Requisitions)
              </h4>

              {complaint.billReceiptImage && (
                <div className="p-3 bg-white rounded-xl border border-amber-300">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Driver Uploaded Bill / Receipt Image:</span>
                  <a href={complaint.billReceiptImage} target="_blank" rel="noopener noreferrer">
                    <img 
                      src={complaint.billReceiptImage} 
                      alt="Driver Uploaded Bill Receipt" 
                      className="w-36 h-24 object-cover rounded-lg border border-amber-200 shadow-sm hover:scale-105 transition-transform cursor-pointer"
                    />
                  </a>
                </div>
              )}
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Approved Bill Amount / Price ($)
                  </label>
                  <input
                    type="number"
                    value={estimatedPrice}
                    onChange={(e) => setEstimatedPrice(Number(e.target.value))}
                    placeholder="e.g. 180"
                    className="w-full px-3.5 py-2 bg-white border border-amber-300 rounded-xl text-slate-900 text-sm font-bold text-emerald-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Bill Pass Authorization Note
                  </label>
                  <input
                    type="text"
                    value={billPassNote}
                    onChange={(e) => setBillPassNote(e.target.value)}
                    placeholder="e.g. Approved for Depot Purchase Pass #P-882"
                    className="w-full px-3.5 py-2 bg-white border border-amber-300 rounded-xl text-slate-900 text-sm"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold uppercase text-emerald-900 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  Student Problem Resolution & Proof Verification
                </h4>
                <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase ${
                  status === 'resolved' ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-slate-950'
                }`}>
                  {status === 'resolved' ? '✅ Completed Proof' : '🟡 In Progress Proof'}
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Resolution Proof Details / Action Verification Note
                  </label>
                  <input
                    type="text"
                    value={proofNote}
                    onChange={(e) => setProofNote(e.target.value)}
                    placeholder="e.g. Dispatch Team deployed additional bus #RCET-05 to clear overcrowding at stop."
                    className="w-full px-3.5 py-2 bg-white border border-emerald-300 rounded-xl text-slate-900 text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                    <Upload className="w-4 h-4 text-emerald-700" />
                    Upload Action / Resolution Proof Photo
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProofImageUpload}
                    className="block w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-extrabold file:bg-emerald-600 file:text-white hover:file:bg-emerald-500 cursor-pointer"
                  />
                  
                  {proofImage && (
                    <div className="mt-3 relative inline-block group">
                      <img 
                        src={proofImage} 
                        alt="Uploaded Action Proof" 
                        className="w-36 h-24 object-cover rounded-xl border border-emerald-300 shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setProofImage('')}
                        className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 shadow-md hover:bg-rose-600 transition"
                        title="Remove proof image"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-[10px] text-emerald-800 font-bold block mt-1">Proof Photo Uploaded ✅</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Progress Note */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Add Action Taken / Progress Note
            </label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Mechanics dispatched to Depot. Replacement parts ordered."
              className="w-full px-4 py-2.5 bg-amber-50/30 border border-amber-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-amber-500 font-medium"
            ></textarea>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-amber-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-amber-50 text-sm font-bold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-extrabold shadow-md shadow-amber-500/20 transition flex items-center gap-2 cursor-pointer"
            >
              {loading ? (
                <span>Publishing...</span>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Publish Progress & Bill Pass
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProgressUpdateModal;
