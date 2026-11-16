import React, { useState, useEffect } from 'react';
import { 
  Bus, 
  Phone, 
  MapPin, 
  Clock, 
  Star, 
  RefreshCw, 
  ShieldAlert, 
  Megaphone,
  ArrowRight,
  QrCode,
  PackageSearch,
  Camera,
  PlusCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { authAPI, busAPI, announcementAPI, complaintAPI, routeAPI } from '../../services/api';
import BusTrackerMap from '../../components/BusTrackerMap';
import StatusBadge from '../../components/StatusBadge';
import { StudentBoardingScannerModal } from '../../components/QRPassModal';
import GreenCampusMetric from '../../components/GreenCampusMetric';
import SmartDemandWidget from '../../components/SmartDemandWidget';
import { AlertTriangle, CheckCircle } from 'lucide-react';

const StudentDashboard = () => {
  const { user, refreshUser } = useAuth();
  const { socket } = useSocket();
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [assignedBus, setAssignedBus] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [myComplaints, setMyComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [breakdownAlert, setBreakdownAlert] = useState(null);
  const [showScannerModal, setShowScannerModal] = useState(false);

  const handleBusSelect = async (busId) => {
    const selected = buses.find(b => b._id === busId);
    if (!selected) return;
    setAssignedBus(selected);
    try {
      await authAPI.updateAssignedBus({ busId: selected._id });
      if (refreshUser) refreshUser();
    } catch (err) {
      console.error('Error updating assigned bus:', err);
    }
  };

  const fetchData = async () => {
    try {
      const [busRes, annRes, compRes, routeRes] = await Promise.all([
        busAPI.getAll(),
        announcementAPI.getAll(),
        complaintAPI.getAll(),
        routeAPI.getAll().catch(() => ({ data: { data: [] } }))
      ]);

      const allBuses = busRes.data?.data || [];
      const allRoutes = routeRes.data?.data || [];
      setBuses(allBuses);
      setRoutes(allRoutes);

      // Accurate & Strict Student Bus Assignment Isolation
      const uAssignedBusId = user?.assignedBus ? (user.assignedBus._id || user.assignedBus).toString() : '';
      const uAssignedBusNum = typeof user?.assignedBus === 'string' ? user.assignedBus.toLowerCase().trim() : (user?.assignedBus?.busNumber || '').toLowerCase().trim();

      const matchedBus = allBuses.find(b => {
        const bId = b._id ? b._id.toString() : '';
        const bNum = (b.busNumber || '').toLowerCase().trim();

        return (
          (uAssignedBusId && bId && uAssignedBusId === bId) ||
          (uAssignedBusNum && bNum && (bNum.includes(uAssignedBusNum) || uAssignedBusNum.includes(bNum)))
        );
      });

      // If assigned bus is not set, look for any bus actively on route or live trip
      const liveBus = allBuses.find(b => b.isLiveTrip || (b.status === 'on_route' && b.currentLocation?.speed > 0));
      const fallback32C = allBuses.find(b => (b.busNumber || '').toUpperCase().includes('32C'));
      const myBus = matchedBus || liveBus || fallback32C || (allBuses.length > 0 ? allBuses[0] : null);

      setAssignedBus(myBus);
      setAnnouncements(annRes.data?.data || []);
      setMyComplaints(compRes.data?.data || []);

      if (myBus && ['breakdown', 'delayed'].includes(myBus.status)) {
        setBreakdownAlert({
          status: myBus.status,
          busNumber: myBus.busNumber,
          message: `Bus ${myBus.busNumber} is marked as ${myBus.status.toUpperCase()}. Operations staff attending.`
        });
      }

      setLoading(false);
    } catch (err) {
      console.error('Error fetching student dashboard data:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Fallback real-time polling: Syncs bus positions every 2.5s even if driver tab is closed
    const pollInterval = setInterval(() => {
      busAPI.getAll().then(res => {
        const freshBuses = res.data?.data || [];
        setBuses(freshBuses);
        setAssignedBus(prev => {
          if (!prev) return prev;
          const fresh = freshBuses.find(b => b._id === prev._id || b.busNumber === prev.busNumber);
          return fresh ? { ...prev, ...fresh } : prev;
        });
      }).catch(() => {});
    }, 2500);

    if (socket) {
      socket.on('bus_location_update', (data) => {
        setBuses(prevBuses => 
          prevBuses.map(b => b._id === data.busId || b.busNumber === data.busNumber ? { 
            ...b, 
            currentLocation: data.location, 
            status: data.status, 
            estimatedArrival: data.estimatedArrival,
            isLiveTrip: data.isLiveTrip !== undefined ? data.isLiveTrip : b.isLiveTrip 
          } : b)
        );
        setAssignedBus(prev => {
          if (prev && (prev._id === data.busId || prev.busNumber === data.busNumber)) {
            return {
              ...prev,
              currentLocation: data.location,
              status: data.status,
              estimatedArrival: data.estimatedArrival,
              isLiveTrip: data.isLiveTrip !== undefined ? data.isLiveTrip : prev.isLiveTrip
            };
          }
          return prev;
        });
      });

      socket.on('bus_status_alert', (data) => {
        setBreakdownAlert({
          status: data.status,
          busNumber: data.busNumber,
          message: data.message
        });
        fetchData();
      });

      socket.on('complaint_progress_updated', fetchData);
      socket.on('new_complaint_submitted', fetchData);
      socket.on('new_announcement', fetchData);
      socket.on('announcement_updated', fetchData);
      socket.on('announcement_deleted', fetchData);
    }

    return () => {
      clearInterval(pollInterval);
      if (socket) {
        socket.off('bus_location_update');
        socket.off('bus_status_alert');
        socket.off('complaint_progress_updated', fetchData);
        socket.off('new_complaint_submitted', fetchData);
        socket.off('new_announcement', fetchData);
        socket.off('announcement_updated', fetchData);
        socket.off('announcement_deleted', fetchData);
      }
    };
  }, [socket]);

  // Active Live Trip on the fleet
  const activeTripBus = buses.find(b => b.isLiveTrip || (b.status === 'on_route' && (b.currentLocation?.speed > 0 || b.isLiveTrip)));

  return (
    <div className="space-y-6">
      
      {/* Top Light Yellow Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-amber-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-800 px-2.5 py-0.5 rounded bg-amber-100 border border-amber-300">
              ROHINI COLLEGE OF ENG & TECH
            </span>
            <span className="text-xs text-slate-600 font-bold">Roll: {user?.rollNumber || 'N/A'}</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">Welcome, {user?.name} 👋</h1>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <p className="text-xs text-slate-600 font-medium">
              Rohini College Campus Transit
            </p>
            <span className="text-slate-300">•</span>
            <div className="flex items-center gap-1.5 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200">
              <Bus className="w-3.5 h-3.5 text-amber-700" />
              <span className="text-[11px] font-bold text-slate-700">Assigned Bus:</span>
              <select
                value={assignedBus?._id || ''}
                onChange={(e) => handleBusSelect(e.target.value)}
                className="bg-amber-500 text-slate-950 font-extrabold text-xs px-2.5 py-1 rounded-lg border border-amber-600 shadow-sm focus:outline-none cursor-pointer"
              >
                {buses.map((b) => {
                  const isLive = b.isLiveTrip || (b.status === 'on_route' && (b.currentLocation?.speed > 0 || b.isLiveTrip));
                  return (
                    <option key={b._id} value={b._id} className="bg-white text-slate-900 font-bold">
                      Bus {b.busNumber} {isLive ? '• 🟢 LIVE' : ''} ({b.routeName ? b.routeName.split('-')[0].trim() : 'Route'})
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowScannerModal(true)}
            className="px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold shadow-md shadow-amber-500/20 transition flex items-center gap-2 cursor-pointer"
          >
            <Camera className="w-4 h-4" />
            <span>Scan Bus Entry QR Code</span>
          </button>
          <Link
            to="/student/complaints"
            className="px-3.5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-extrabold transition flex items-center gap-1.5"
          >
            Issues <ArrowRight className="w-4 h-4" />
          </Link>
          <button
            onClick={fetchData}
            className="p-2.5 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition cursor-pointer"
            title="Refresh fleet data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Prominent Active Live Driving Banner (1-Click Switch to Active Bus) */}
      {activeTripBus && assignedBus?._id !== activeTripBus._id && (
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-4 rounded-3xl shadow-lg border border-emerald-400 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3.5 w-3.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-white"></span>
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-wider bg-emerald-800/80 px-2 py-0.5 rounded text-emerald-200">
                  REAL-TIME GPS ACTIVE
                </span>
                <span className="text-xs font-bold text-white">
                  Bus {activeTripBus.busNumber} is driving on its route right now!
                </span>
              </div>
              <p className="text-[11px] text-emerald-100 font-medium mt-0.5">
                {activeTripBus.routeName || 'Rohini College Campus Corridor'}
              </p>
            </div>
          </div>
          <button
            onClick={() => handleBusSelect(activeTripBus._id)}
            className="px-4 py-2 bg-white hover:bg-emerald-50 text-emerald-900 rounded-xl text-xs font-extrabold shadow transition cursor-pointer shrink-0 flex items-center gap-1.5"
          >
            <span>Track Bus {activeTripBus.busNumber} Live</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {showScannerModal && <StudentBoardingScannerModal user={user} onClose={() => setShowScannerModal(false)} />}

      {/* Smart Stop Demand Morning Check-In Widget */}
      <SmartDemandWidget user={user} assignedBus={assignedBus} assignedBusNumber={assignedBus?.busNumber} />

      {/* Status Alert (Breakdown / Delayed) */}
      {breakdownAlert && (
        <div className={`p-4 rounded-2xl flex items-center justify-between gap-3 border shadow-sm transition-all ${
          breakdownAlert.status === 'delayed'
            ? 'bg-orange-50 border-orange-200 text-orange-950'
            : 'bg-rose-50 border-rose-200 text-rose-900 animate-pulse'
        }`}>
          <div className="flex items-center gap-3">
            <ShieldAlert className={`w-6 h-6 shrink-0 ${breakdownAlert.status === 'delayed' ? 'text-orange-600' : 'text-rose-600'}`} />
            <div className="text-xs">
              <h4 className="font-extrabold uppercase tracking-wide">
                BUS STATUS ALERT: BUS {breakdownAlert.busNumber} ({breakdownAlert.status.toUpperCase()})
              </h4>
              <p className="mt-0.5 font-medium">{breakdownAlert.message}</p>
            </div>
          </div>
          <button
            onClick={() => setBreakdownAlert(null)}
            className="text-slate-400 hover:text-slate-700 text-xs font-bold px-2 py-1 rounded-lg transition cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main 2-Column Dashboard - Strictly Single Assigned Bus */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Live Map (2 Cols) - Strict Single-Bus Scoping */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-amber-600" />
              Live Assigned Bus Location Tracker
            </h2>
            {assignedBus && <StatusBadge status={assignedBus.status} type="bus" />}
          </div>

          {/* Pass student's assigned bus and loaded routes for zero-latency highway snapping */}
          <BusTrackerMap buses={assignedBus ? [assignedBus] : []} selectedBus={assignedBus} routes={routes} height="520px" />
        </div>

        {/* Assigned Bus & Driver Card (1 Col) */}
        <div className="space-y-5">
          
          <div className="bg-white border border-amber-200/80 rounded-3xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-amber-100 pb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 block">MY ASSIGNED BUS</span>
                <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                  <Bus className="w-5 h-5 text-amber-600" />
                  {assignedBus ? assignedBus.busNumber : 'Unassigned'}
                </h3>
              </div>
              {assignedBus && (
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 font-bold block">PLATE</span>
                  <span className="text-xs font-mono font-extrabold text-amber-700">{assignedBus.plateNumber}</span>
                </div>
              )}
            </div>

            {assignedBus && (
              <div className="space-y-3 text-xs">
                <div className="bg-amber-50/60 p-3 rounded-2xl border border-amber-200 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-700 font-semibold">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    <span>Estimated ETA:</span>
                  </div>
                  <span className="font-extrabold text-sm text-emerald-700">{assignedBus.estimatedArrival || 'On Schedule'}</span>
                </div>

                <div className="bg-amber-50/60 p-3 rounded-2xl border border-amber-200 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-amber-800">ASSIGNED ROUTE</span>
                  <p className="font-extrabold text-slate-900">{assignedBus.routeName || assignedBus.route?.routeName || 'Start ➔ Destination'}</p>
                  <p className="text-[11px] text-slate-600 font-medium">
                    {assignedBus.route?.startPoint || 'Start'} ➔ {assignedBus.route?.endPoint || 'Destination'}
                  </p>
                </div>
              </div>
            )}

            {/* Driver Profile & Direct Call Option */}
            {assignedBus && (assignedBus.driver || assignedBus.driverName) && (
              <div className="pt-3 border-t border-amber-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 block">ASSIGNED CAPTAIN / DRIVER</span>
                  {assignedBus.driver?.isLeadDriver && (
                    <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-amber-500 text-slate-950 flex items-center gap-1 shadow-sm">
                      <Star className="w-3 h-3 fill-slate-950" />
                      LEAD DRIVER
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 bg-amber-50/80 p-3.5 rounded-2xl border border-amber-200 shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-extrabold text-base shrink-0 shadow-sm">
                    {(assignedBus.driverName || assignedBus.driver?.name || 'D').charAt(0)}
                  </div>

                  <div className="flex-1">
                    <h4 className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                      <span>{assignedBus.driverName || assignedBus.driver?.name || 'Bus Captain'}</span>
                    </h4>
                    <p className="text-[11px] text-slate-600 font-medium">Lic: {assignedBus.driver?.licenseNumber || 'TN-74-CERTIFIED'}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Star className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                      <span className="text-[10px] font-extrabold text-amber-800">
                        {assignedBus.driver?.rating ? `${assignedBus.driver.rating} ★ Rating` : '4.9 ★ Rating'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* My Reported Issues & Admin Resolution Updates */}
          <div className="bg-white border border-amber-200/80 rounded-3xl p-5 space-y-3 shadow-sm">
            <div className="flex items-center justify-between border-b border-amber-100 pb-2">
              <h3 className="text-xs font-extrabold text-slate-900 flex items-center gap-2 uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                My Transport Issues & Status
              </h3>
              <Link to="/student/complaints" className="text-[11px] font-extrabold text-amber-800 hover:text-amber-950">
                View All
              </Link>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {myComplaints.length > 0 ? (
                myComplaints.slice(0, 3).map((c) => (
                  <div key={c._id} className="bg-amber-50/60 p-3 rounded-2xl border border-amber-200 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-900 line-clamp-1">{c.title}</span>
                      <StatusBadge status={c.status} type="complaint" />
                    </div>
                    {c.progressUpdates && c.progressUpdates.length > 0 && (
                      <p className="text-[11px] text-emerald-800 font-semibold bg-white p-1.5 rounded-xl border border-amber-200">
                        Latest: {c.progressUpdates[c.progressUpdates.length - 1].note}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500">No issues reported yet.</p>
              )}
            </div>
          </div>

          {/* Announcements Banner */}
          <div className="bg-white border border-amber-200/80 rounded-3xl p-5 space-y-3 shadow-sm">
            <div className="flex items-center justify-between border-b border-amber-100 pb-2">
              <h3 className="text-xs font-extrabold text-slate-900 flex items-center gap-2 uppercase tracking-wider">
                <Megaphone className="w-4 h-4 text-amber-600" />
                Transit Announcements
              </h3>
            </div>

            <div className="space-y-2 max-h-40 overflow-y-auto">
              {announcements.length > 0 ? (
                announcements.slice(0, 2).map((ann) => (
                  <div key={ann._id} className="bg-amber-50/50 p-3 rounded-2xl border border-amber-200 text-xs">
                    <h4 className="font-extrabold text-slate-900">{ann.title}</h4>
                    <p className="text-slate-600 text-[11px] font-medium mt-0.5">{ann.message}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500">No active announcements.</p>
              )}
            </div>
          </div>

          {/* Green Campus Metric */}
          <GreenCampusMetric />

        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
