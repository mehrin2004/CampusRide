import React, { useState, useEffect } from 'react';
import { Megaphone, Calendar } from 'lucide-react';
import { announcementAPI } from '../../services/api';
import { useSocket } from '../../context/SocketContext';

const StudentAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();

  const fetchAnnouncements = async () => {
    try {
      const res = await announcementAPI.getAll();
      setAnnouncements(res.data.data || []);
      setLoading(false);
    } catch (err) {
      console.error('Fetch announcements error:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();

    if (socket) {
      socket.on('new_announcement', fetchAnnouncements);
      socket.on('announcement_updated', fetchAnnouncements);
      socket.on('announcement_deleted', fetchAnnouncements);
    }

    return () => {
      if (socket) {
        socket.off('new_announcement', fetchAnnouncements);
        socket.off('announcement_updated', fetchAnnouncements);
        socket.off('announcement_deleted', fetchAnnouncements);
      }
    };
  }, [socket]);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl border border-amber-200/80 shadow-sm">
        <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
          <Megaphone className="w-6 h-6 text-amber-600" />
          Campus Transit Announcements
        </h1>
        <p className="text-xs text-slate-600 font-medium mt-1">
          Official transport updates, route adjustments, and schedule changes broadcasted by Rohini College Administration.
        </p>
      </div>

      <div className="space-y-4">
        {announcements.length > 0 ? (
          announcements.map((ann) => (
            <div key={ann._id} className="bg-white p-5 rounded-3xl border border-amber-200/80 space-y-2 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-amber-900 px-2.5 py-0.5 rounded bg-amber-100 border border-amber-300">
                  {ann.priority || 'NORMAL'}
                </span>
                <span className="text-[11px] text-slate-500 font-bold flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(ann.createdAt).toLocaleDateString()}
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900">{ann.title}</h3>
              <p className="text-xs text-slate-700 leading-relaxed font-medium">{ann.message}</p>
              <div className="pt-2 border-t border-amber-100 text-[11px] text-slate-500 font-semibold">
                Posted by: <strong className="text-slate-800">{ann.authorName || 'Rohini College Admin'}</strong>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white p-12 rounded-3xl border border-amber-200/80 text-center text-slate-500 text-sm font-semibold">
            No announcements available.
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentAnnouncements;
