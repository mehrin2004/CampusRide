import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Info, 
  Check, 
  X,
  Wrench,
  Megaphone
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { notificationAPI } from '../services/api';
import { playAppChime } from '../utils/audio';

const NotificationBell = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [toastAlert, setToastAlert] = useState(null);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await notificationAPI.getAll();
      const list = res.data.data || [];
      setNotifications(list);
      setUnreadCount(res.data.unreadCount || list.filter(n => !n.isRead).length);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  useEffect(() => {
    if (!socket || !user) return;

    // Listener 1: Student or Driver reports a new issue -> Notify Admin
    const handleNewComplaint = (data) => {
      if (user.role === 'admin') {
        playAppChime();
        const notifItem = data.notification || {
          _id: Date.now().toString(),
          title: `New ${data.complaint?.reportedRole?.toUpperCase() || 'USER'} Issue: ${data.complaint?.title || 'Complaint Reported'}`,
          message: data.message || `Reported by ${data.complaint?.reportedBy?.name || 'User'}`,
          type: 'complaint_submitted',
          createdAt: new Date(),
          isRead: false
        };

        setNotifications(prev => [notifItem, ...prev]);
        setUnreadCount(prev => prev + 1);

        setToastAlert({
          title: notifItem.title,
          message: notifItem.message,
          type: 'complaint_submitted'
        });

        setTimeout(() => setToastAlert(null), 6000);
      }
    };

    // Listener 2: Admin updates or resolves an issue -> Notify Student / Driver
    const handleComplaintUpdated = (data) => {
      const isForUser = 
        (data.reportedBy && data.reportedBy.toString() === user._id.toString()) ||
        (!data.reportedBy && (data.targetAudience === 'all' || data.targetAudience === `${user.role}s`));

      if (user.role !== 'admin' && isForUser) {
        playAppChime();
        const isResolved = data.status === 'resolved';
        const notifItem = data.notification || {
          _id: Date.now().toString(),
          title: isResolved ? `✅ Issue Resolved: ${data.title}` : `🟡 Transit Update: ${data.title}`,
          message: data.message || `Status: ${data.status?.toUpperCase()}`,
          type: 'complaint_update',
          createdAt: new Date(),
          isRead: false
        };

        setNotifications(prev => [notifItem, ...prev]);
        setUnreadCount(prev => prev + 1);

        setToastAlert({
          title: notifItem.title,
          message: notifItem.message,
          type: isResolved ? 'resolved' : 'complaint_update'
        });

        setTimeout(() => setToastAlert(null), 6000);
      }
    };

    // Listener 3: Student registers stop attendance -> Notify Driver
    const handleDemandAlert = (data) => {
      if (user.role === 'driver') {
        playAppChime();
        const notifItem = {
          _id: Date.now().toString(),
          title: `🚏 Student Attendance: Bus ${data.busNumber}`,
          message: `Student ${data.studentName || 'Student'} (${data.rollNumber || ''}) marked '${data.status === 'coming' ? 'WILL BOARD' : 'NOT COMING'}' at ${data.stopName}`,
          type: 'demand_update',
          createdAt: new Date(),
          isRead: false
        };

        setNotifications(prev => [notifItem, ...prev]);
        setUnreadCount(prev => prev + 1);

        setToastAlert({
          title: notifItem.title,
          message: notifItem.message,
          type: 'demand_update'
        });

        setTimeout(() => setToastAlert(null), 6000);
      }
    };

    socket.on('new_complaint_submitted', handleNewComplaint);
    socket.on('complaint_progress_updated', handleComplaintUpdated);
    socket.on('demand_checkin_alert', handleDemandAlert);

    return () => {
      socket.off('new_complaint_submitted', handleNewComplaint);
      socket.off('complaint_progress_updated', handleComplaintUpdated);
      socket.off('demand_checkin_alert', handleDemandAlert);
    };
  }, [socket, user]);

  const handleMarkAsRead = async (id, e) => {
    e.stopPropagation();
    try {
      await notificationAPI.markAsRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Mark read error:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Mark all read error:', err);
    }
  };

  const handleNotificationClick = (n) => {
    if (!n.isRead) {
      notificationAPI.markAsRead(n._id).catch(console.error);
      setNotifications(prev => prev.map(item => item._id === n._id ? { ...item, isRead: true } : item));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }

    setIsOpen(false);
    if (user?.role) {
      navigate(`/${user.role}/complaints`);
    }
  };

  const getNotificationIcon = (type, title = '') => {
    if (type === 'complaint_submitted' || title.toLowerCase().includes('issue') || title.toLowerCase().includes('complaint')) {
      return <AlertTriangle className="w-4 h-4 text-amber-600" />;
    }
    if (type === 'complaint_update' && (title.includes('Resolved') || title.includes('✅'))) {
      return <CheckCircle className="w-4 h-4 text-emerald-600" />;
    }
    if (type === 'complaint_update') {
      return <Clock className="w-4 h-4 text-amber-700" />;
    }
    if (type === 'breakdown' || type === 'delay') {
      return <Wrench className="w-4 h-4 text-rose-600" />;
    }
    if (type === 'announcement') {
      return <Megaphone className="w-4 h-4 text-blue-600" />;
    }
    return <Info className="w-4 h-4 text-slate-500" />;
  };

  return (
    <div className="relative">
      
      {/* Toast Alert Banner */}
      {toastAlert && (
        <div className="fixed top-20 right-4 z-50 max-w-sm bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-amber-400 flex items-start gap-3 animate-bounce">
          <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl shrink-0">
            <Bell className="w-5 h-5 animate-pulse" />
          </div>
          <div className="flex-1 text-xs">
            <h4 className="font-extrabold text-amber-300">{toastAlert.title}</h4>
            <p className="text-slate-200 mt-0.5 line-clamp-2">{toastAlert.message}</p>
          </div>
          <button 
            onClick={() => setToastAlert(null)}
            className="text-slate-400 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-2xl bg-amber-50/80 border border-amber-200 hover:border-amber-300 text-slate-700 hover:text-slate-900 transition cursor-pointer"
        title="Notifications"
      >
        <Bell className="w-5 h-5 text-amber-800" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-600 text-white font-extrabold text-[10px] flex items-center justify-center animate-pulse border-2 border-white shadow-sm">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-amber-200 rounded-3xl shadow-2xl p-3 z-50 space-y-2">
          
          <div className="flex items-center justify-between px-2 pb-2 border-b border-amber-100">
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Notifications</span>
              {unreadCount > 0 && (
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                  {unreadCount} Unread
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[11px] font-extrabold text-amber-700 hover:text-amber-900 flex items-center gap-1 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto space-y-1.5 pr-1">
            {notifications.length > 0 ? (
              notifications.map((n) => (
                <div
                  key={n._id}
                  onClick={() => handleNotificationClick(n)}
                  className={`p-3 rounded-2xl border transition cursor-pointer flex items-start gap-3 ${
                    n.isRead 
                      ? 'bg-white border-slate-100 text-slate-600 opacity-80' 
                      : 'bg-amber-50/90 border-amber-200 text-slate-900 font-medium shadow-sm'
                  }`}
                >
                  <div className="p-2 rounded-xl bg-white border border-amber-200 shrink-0 mt-0.5">
                    {getNotificationIcon(n.type, n.title)}
                  </div>

                  <div className="flex-1 text-xs space-y-0.5">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="font-extrabold text-slate-900 line-clamp-1">{n.title}</h4>
                      <span className="text-[10px] text-slate-400 font-bold shrink-0">
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 line-clamp-2 leading-tight">{n.message}</p>
                  </div>

                  {!n.isRead && (
                    <button
                      onClick={(e) => handleMarkAsRead(n._id, e)}
                      className="p-1 text-amber-600 hover:text-amber-800 rounded-lg hover:bg-amber-100 transition"
                      title="Mark read"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-xs font-semibold text-slate-400">
                No notifications right now.
              </div>
            )}
          </div>

          {/* Footer link to Complaints */}
          <div className="pt-2 border-t border-amber-100 text-center">
            <button
              onClick={() => {
                setIsOpen(false);
                if (user?.role) navigate(`/${user.role}/complaints`);
              }}
              className="text-xs font-bold text-amber-800 hover:text-amber-950 transition cursor-pointer"
            >
              View Issue Log Desk ➔
            </button>
          </div>

        </div>
      )}

    </div>
  );
};

export default NotificationBell;
