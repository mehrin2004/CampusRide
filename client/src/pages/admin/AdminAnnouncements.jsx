import React, { useState, useEffect } from 'react';
import { Megaphone, Plus, Send, X, Edit2, Trash2, Calendar } from 'lucide-react';
import { announcementAPI } from '../../services/api';

const AdminAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetAudience, setTargetAudience] = useState('all');
  const [priority, setPriority] = useState('normal');

  const fetchAnnouncements = async () => {
    try {
      const res = await announcementAPI.getAll();
      setAnnouncements(res.data.data || []);
    } catch (err) {
      console.error('Fetch announcements error:', err);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingId(null);
    setTitle('');
    setMessage('');
    setTargetAudience('all');
    setPriority('normal');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (ann) => {
    setEditingId(ann._id);
    setTitle(ann.title);
    setMessage(ann.message);
    setTargetAudience(ann.targetAudience || 'all');
    setPriority(ann.priority || 'normal');
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this broadcast announcement?')) return;
    try {
      await announcementAPI.delete(id);
      fetchAnnouncements();
    } catch (err) {
      console.error('Delete announcement error:', err);
      alert(err.response?.data?.message || err.message || 'Error deleting announcement');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await announcementAPI.update(editingId, { title, message, targetAudience, priority });
      } else {
        await announcementAPI.create({ title, message, targetAudience, priority });
      }
      setIsModalOpen(false);
      setEditingId(null);
      setTitle('');
      setMessage('');
      fetchAnnouncements();
    } catch (err) {
      console.error('Save announcement error:', err);
      alert(err.response?.data?.message || err.message || 'Error saving announcement');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-6 rounded-3xl border border-amber-200/80 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-amber-600" />
            Rohini Campus Broadcast Center
          </h1>
          <p className="text-xs text-slate-600 font-medium mt-1">
            Publish, edit, and manage system-wide announcements to Students, Drivers, or All users.
          </p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold shadow-md shadow-amber-500/20 transition flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Broadcast Announcement
        </button>
      </div>

      <div className="space-y-4">
        {announcements.length > 0 ? (
          announcements.map((ann) => (
            <div key={ann._id} className="bg-white border border-amber-200/80 rounded-3xl p-5 space-y-3 shadow-sm hover:border-amber-300 transition">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className={`font-extrabold uppercase px-2.5 py-0.5 rounded border ${
                    ann.priority === 'emergency' ? 'bg-rose-100 text-rose-800 border-rose-300' :
                    ann.priority === 'important' ? 'bg-amber-100 text-amber-900 border-amber-300' :
                    'bg-slate-100 text-slate-800 border-slate-300'
                  }`}>
                    {ann.priority || 'NORMAL'}
                  </span>
                  <span className="font-bold text-slate-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    Target: {ann.targetAudience}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-slate-500 font-bold flex items-center gap-1 text-[11px]">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(ann.createdAt).toLocaleDateString()}
                  </span>
                  <div className="flex items-center gap-1.5 border-l border-amber-200 pl-3">
                    <button
                      onClick={() => handleOpenEditModal(ann)}
                      className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 transition cursor-pointer flex items-center gap-1 text-xs font-bold"
                      title="Edit Announcement"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(ann._id)}
                      className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition cursor-pointer flex items-center gap-1 text-xs font-bold"
                      title="Delete Announcement"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
              
              <h3 className="text-base font-extrabold text-slate-900">{ann.title}</h3>
              <p className="text-xs text-slate-700 font-medium leading-relaxed">{ann.message}</p>
              
              <div className="pt-2 border-t border-amber-100 text-[11px] text-slate-500 font-semibold">
                Posted by: <strong className="text-slate-800">{ann.authorName || 'Rohini College Transport Department'}</strong>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white border border-amber-200/80 rounded-3xl p-12 text-center space-y-3 shadow-sm">
            <Megaphone className="w-12 h-12 text-amber-500 mx-auto opacity-40" />
            <h3 className="text-base font-extrabold text-slate-900">No Announcements Active</h3>
            <p className="text-xs text-slate-600 font-medium max-w-sm mx-auto">
              There are currently no broadcast announcements. Click the button below to create and publish your first announcement.
            </p>
            <button
              onClick={handleOpenCreateModal}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold shadow-md shadow-amber-500/20 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Broadcast First Announcement
            </button>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md bg-white border border-amber-200 rounded-3xl p-6 shadow-2xl">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-2 rounded-full cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-extrabold text-slate-900 mb-4">
              {editingId ? 'Edit Broadcast Announcement' : 'New Broadcast Announcement'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Rohini College Campus Transit Schedule..."
                  className="w-full px-3.5 py-2.5 bg-amber-50/40 border border-amber-200 rounded-xl text-slate-900 text-xs sm:text-sm font-semibold focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Target Audience</label>
                  <select
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    className="w-full px-3 py-2 bg-amber-50/40 border border-amber-200 rounded-xl text-slate-900 text-xs font-bold focus:outline-none focus:border-amber-500"
                  >
                    <option value="all">All Users</option>
                    <option value="students">Students Only</option>
                    <option value="drivers">Drivers Only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Priority Tag</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-3 py-2 bg-amber-50/40 border border-amber-200 rounded-xl text-slate-900 text-xs font-bold focus:outline-none focus:border-amber-500"
                  >
                    <option value="normal">NORMAL</option>
                    <option value="important">IMPORTANT</option>
                    <option value="emergency">EMERGENCY</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Announcement Message</label>
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Enter broadcast message details..."
                  className="w-full px-3.5 py-2.5 bg-amber-50/40 border border-amber-200 rounded-xl text-slate-900 text-xs sm:text-sm font-semibold focus:outline-none focus:border-amber-500"
                  required
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-amber-50 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold shadow-md shadow-amber-500/20 flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  {editingId ? 'Save Changes' : 'Broadcast Now'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAnnouncements;
