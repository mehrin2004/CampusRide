import React, { useState } from 'react';
import { 
  X, 
  AlertTriangle, 
  CheckCircle, 
  Armchair, 
  Fuel, 
  Droplet, 
  Disc, 
  Clock, 
  Users, 
  Sparkles, 
  MapPin, 
  ShieldAlert, 
  Maximize2, 
  Receipt,
  Upload,
  Image as ImageIcon
} from 'lucide-react';
import { complaintAPI } from '../services/api';
import VoiceInputButton from './VoiceInputButton';

const DIAGRAM_DRIVER_CATEGORIES = [
  { id: 'oil', label: '1. Oil / Fuel', icon: Fuel, desc: 'Engine oil, fuel level, leaks' },
  { id: 'brake', label: '2. Brake', icon: ShieldAlert, desc: 'Brake pads, noise, fluid leak' },
  { id: 'seat', label: '3. Seat', icon: Armchair, desc: 'Torn seats, cushions, frames' },
  { id: 'water_wash', label: '4. Water Wash', icon: Droplet, desc: 'Exterior mud wash, deep interior wash' },
  { id: 'tyre', label: '5. Tyre', icon: Disc, desc: 'Tire pressure, puncture, alignment' },
  { id: 'window', label: '6. Window', icon: Maximize2, desc: 'Window glass, latches, wiper' },
  { id: 'other_problem', label: '7. Other Problem', icon: AlertTriangle, desc: 'Miscellaneous vehicle fault' }
];

const STUDENT_PROBLEM_CATEGORIES = [
  { id: 'request_new_stop', label: 'Request New Stop Point', icon: MapPin, desc: 'Bus does not come to your area - request a stopping point' },
  { id: 'delay', label: 'Bus Delay', icon: Clock, desc: 'Bus arrived significantly late' },
  { id: 'overcrowding', label: 'Overcrowding', icon: Users, desc: 'Bus exceeds capacity limit' },
  { id: 'sanitation', label: 'Bus Hygiene', icon: Sparkles, desc: 'Unclean interior or seats' },
  { id: 'other', label: 'Missed Stop / Behavior', icon: MapPin, desc: 'Stop skipped or staff complaint' }
];

const ComplaintModal = ({ isOpen, onClose, userRole, buses = [], onSuccess, defaultCategory = null }) => {
  const [category, setCategory] = useState(defaultCategory || (userRole === 'driver' ? 'tyre' : 'delay'));
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [selectedBus, setSelectedBus] = useState('');
  const [targetAudience, setTargetAudience] = useState(userRole === 'driver' ? 'drivers' : 'students');
  const [isRequisition, setIsRequisition] = useState(false);
  const [estimatedPrice, setEstimatedPrice] = useState(0);
  const [billReceiptImage, setBillReceiptImage] = useState('');
  const [isVoiceUsed, setIsVoiceUsed] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const categories = userRole === 'driver' ? DIAGRAM_DRIVER_CATEGORIES : STUDENT_PROBLEM_CATEGORIES;

  const handleVoiceTranscript = (speechText) => {
    setIsVoiceUsed(true);
    if (!title) {
      setTitle(speechText.length > 35 ? speechText.substring(0, 35) + '...' : speechText);
    }
    setDescription(prev => prev ? `${prev} ${speechText}` : speechText);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image file size must be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setBillReceiptImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !description || !category) {
      setError('Please fill in title and description');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await complaintAPI.create({
        title,
        category,
        description,
        priority,
        busId: selectedBus || undefined,
        targetAudience,
        isVoiceSubmitted: isVoiceUsed,
        isRequisition,
        estimatedPrice,
        billReceiptImage
      });

      setLoading(false);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit report');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white border border-amber-200 rounded-3xl p-6 sm:p-8 shadow-2xl">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-2 rounded-full hover:bg-amber-50 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-6 border-b border-amber-100 pb-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-900 border border-amber-300 mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-700" />
            {userRole === 'driver' ? 'DRIVER VEHICLE LOG & GARAGE REQUISITION' : 'STUDENT TRANSPORT ISSUE'}
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">
            {userRole === 'driver' ? 'Log Vehicle Issue / Request Garage Parts' : 'Report Transport Issue'}
          </h2>
          <p className="text-slate-600 text-xs sm:text-sm mt-1">
            Select a problem category or use the voice assistant below to speak your report.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold">
            {error}
          </div>
        )}

        {/* Voice Assistant */}
        <div className="mb-6 p-4 bg-amber-50/80 rounded-2xl border border-amber-200 text-center space-y-2">
          <span className="text-xs font-extrabold text-amber-800 uppercase tracking-wider block">
            🎙️ HANDS-FREE VOICE ASSISTANT
          </span>
          <VoiceInputButton onTranscript={handleVoiceTranscript} />
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Category Selector */}
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-2">
              Select Category <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {categories.map((cat) => {
                const IconComponent = cat.icon;
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`flex flex-col items-center text-center p-3.5 rounded-2xl border-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500 border-amber-600 text-slate-950 font-extrabold shadow-md shadow-amber-500/20'
                        : 'bg-amber-50/40 border-amber-200 text-slate-600 hover:border-amber-300 hover:text-slate-900'
                    }`}
                  >
                    <IconComponent className={`w-6 h-6 mb-2 ${isSelected ? 'text-slate-950' : 'text-amber-600'}`} />
                    <span className="font-extrabold text-xs">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1">
              Issue Title / Summary <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={userRole === 'driver' ? 'e.g. Engine Oil Inspection & Front Tyre Pressure' : 'e.g. Bus RCET-01 15 Mins Late at Vallioor Stop'}
              className="w-full px-4 py-2.5 bg-amber-50/30 border border-amber-200 rounded-xl text-slate-900 text-sm font-semibold focus:outline-none focus:border-amber-500 transition"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1">
              Detailed Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Spoken words or typed text will appear here..."
              className="w-full px-4 py-2.5 bg-amber-50/30 border border-amber-200 rounded-xl text-slate-900 text-sm font-semibold focus:outline-none focus:border-amber-500 transition"
              required
            ></textarea>
          </div>

          {/* Garage Requisition Checkbox & Spare Parts Bill Upload */}
          {userRole === 'driver' && (
            <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200 space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isRequisition}
                  onChange={(e) => setIsRequisition(e.target.checked)}
                  className="w-5 h-5 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                />
                <div>
                  <span className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                    <Receipt className="w-4 h-4 text-emerald-600" />
                    Request Spare Parts Purchase / Garage Bill Pass
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    Check if garage requires purchasing oil, tyres, brake pads, seat cushions, or window glass.
                  </span>
                </div>
              </label>

              {isRequisition && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Estimated Amount / Price ($)
                  </label>
                  <input
                    type="number"
                    value={estimatedPrice}
                    onChange={(e) => setEstimatedPrice(Number(e.target.value))}
                    placeholder="e.g. 150"
                    className="w-full px-4 py-2 bg-white border border-amber-300 rounded-xl text-slate-900 font-bold text-sm"
                  />
                </div>
              )}

              {/* Spare Parts Bill Receipt Image Uploader */}
              <div className="border-t border-amber-200/80 pt-3">
                <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-amber-700" />
                  Upload Spare Parts Bill / Receipt Photo
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="block w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-extrabold file:bg-amber-500 file:text-slate-950 hover:file:bg-amber-400 cursor-pointer"
                />
                
                {billReceiptImage && (
                  <div className="mt-3 relative inline-block group">
                    <img 
                      src={billReceiptImage} 
                      alt="Uploaded Bill Receipt" 
                      className="w-32 h-24 object-cover rounded-xl border border-amber-300 shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setBillReceiptImage('')}
                      className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 shadow-md hover:bg-rose-600 transition"
                      title="Remove bill image"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[10px] text-emerald-800 font-bold block mt-1">Receipt Uploaded ✅</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-amber-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-2xl text-slate-600 hover:bg-amber-50 text-xs font-bold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold shadow-md shadow-amber-500/20 transition flex items-center gap-2 cursor-pointer"
            >
              {loading ? (
                <span>Submitting...</span>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Submit Report
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

export default ComplaintModal;
