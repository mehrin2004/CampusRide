import React, { useState, useEffect } from 'react';
import { 
  Bus, 
  Users, 
  AlertTriangle, 
  ShieldCheck, 
  MapPin, 
  RefreshCw,
  ArrowRight,
  Gauge,
  Leaf
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { analyticsAPI, busAPI, complaintAPI, routeAPI } from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import BusTrackerMap from '../../components/BusTrackerMap';
import GreenCampusMetric from '../../components/GreenCampusMetric';

const AdminDashboard = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [stats, setStats] = useState(null);
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [selectedBusId, setSelectedBusId] = useState('all'); // 'all' or specific bus._id
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, busRes, compRes, routeRes] = await Promise.all([
        analyticsAPI.getStats(),
        busAPI.getAll(),
        complaintAPI.getAll(),
        routeAPI.getAll().catch(() => ({ data: { data: [] } }))
      ]);

      setStats(statsRes.data?.data);
      setBuses(busRes.data?.data || []);
      setRecentComplaints(compRes.data?.data || []);
      setRoutes(routeRes.data?.data || []);
      setLoading(false);
    } catch (err) {
      console.error('Error loading admin analytics:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Fallback real-time polling: Keeps all bus locations updating every 2.5s
    const pollInterval = setInterval(() => {
      busAPI.getAll().then(res => {
        const freshBuses = res.data?.data || [];
        setBuses(freshBuses);
      }).catch(() => {});
    }, 2500);

    if (socket) {
      socket.on('bus_location_update', (data) => {
        setBuses(prev => prev.map(b => (b._id === data.busId || b.busNumber === data.busNumber) ? {
          ...b,
          currentLocation: data.location,
          status: data.status,
          estimatedArrival: data.estimatedArrival,
          isLiveTrip: data.isLiveTrip !== undefined ? data.isLiveTrip : b.isLiveTrip
        } : b));
      });

      socket.on('new_complaint_submitted', fetchDashboardData);
      socket.on('complaint_progress_updated', fetchDashboardData);
    }

    return () => {
      clearInterval(pollInterval);
      if (socket) {
        socket.off('bus_location_update');
        socket.off('new_complaint_submitted', fetchDashboardData);
        socket.off('complaint_progress_updated', fetchDashboardData);
      }
    };
  }, [socket]);

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-amber-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-900 px-2.5 py-0.5 rounded bg-amber-100 border border-amber-300">
              ROHINI COLLEGE OPERATIONS
            </span>
            <span className="text-xs text-slate-600 font-bold">Master Fleet Center</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">Rohini College Transit Command Center</h1>
          <p className="text-xs text-slate-600 font-medium mt-0.5">
            Real-time fleet monitoring across Kanniyakumari, Nagercoil, and Tirunelveli routes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/admin/complaints"
            className="px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold shadow-md shadow-amber-500/20 transition flex items-center gap-2"
          >
            Complaint Solver Desk <ArrowRight className="w-4 h-4" />
          </Link>
          <button
            onClick={fetchDashboardData}
            className="p-2.5 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Analytics Statistics Cards Row */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="bg-white border border-amber-200/80 rounded-3xl p-5 space-y-2 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-600 uppercase tracking-wider">Active Fleet</span>
              <div className="w-9 h-9 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-700 flex items-center justify-center font-bold">
                <Bus className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">{stats.fleet?.activeBuses || 0}</span>
              <span className="text-xs text-slate-500 font-bold">/ {stats.fleet?.totalBuses || 0} Total Buses</span>
            </div>
            <p className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              {stats.fleet?.idleBuses || 0} Idle • {stats.fleet?.maintenanceBuses || 0} Maintenance
            </p>
          </div>

          <div className="bg-white border border-amber-200/80 rounded-3xl p-5 space-y-2 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-600 uppercase tracking-wider">Pending Issues</span>
              <div className="w-9 h-9 rounded-2xl bg-amber-100 border border-amber-300 text-amber-800 flex items-center justify-center font-bold">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-amber-700">{stats.complaints?.pending || 0}</span>
              <span className="text-xs text-slate-500 font-bold">Needs Attention</span>
            </div>
            <p className="text-[11px] text-slate-600 font-semibold">
              {stats.complaints?.inProgress || 0} In Progress • {stats.complaints?.resolved || 0} Resolved
            </p>
          </div>

          <div className="bg-white border border-amber-200/80 rounded-3xl p-5 space-y-2 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-600 uppercase tracking-wider">Student Commuters</span>
              <div className="w-9 h-9 rounded-2xl bg-blue-100 border border-blue-300 text-blue-700 flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">{stats.users?.students || 0}</span>
              <span className="text-xs text-slate-500 font-bold">Enrolled</span>
            </div>
            <p className="text-[11px] text-blue-700 font-bold">Rohini College student passes</p>
          </div>

          <div className="bg-white border border-amber-200/80 rounded-3xl p-5 space-y-2 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-600 uppercase tracking-wider">Active Drivers</span>
              <div className="w-9 h-9 rounded-2xl bg-purple-100 border border-purple-300 text-purple-700 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">{stats.users?.drivers || 0}</span>
              <span className="text-xs text-slate-500 font-bold">Drivers</span>
            </div>
            <p className="text-[11px] text-purple-700 font-bold">{stats.users?.routes || 0} Campus Routes</p>
          </div>

        </div>
      )}

      {/* Live Reported Student & Driver Issues Panel */}
      <div className="bg-white border border-amber-200/80 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-amber-100 pb-3">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800">REALTIME ISSUES DESK</span>
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              Live Student & Driver Reported Issues
            </h2>
          </div>
          <Link
            to="/admin/complaints"
            className="text-xs font-extrabold text-amber-800 hover:text-amber-950 flex items-center gap-1"
          >
            <span>Solve All Complaints</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="space-y-3">
          {recentComplaints.length > 0 ? (
            recentComplaints.slice(0, 4).map((c) => (
              <div key={c._id} className="bg-amber-50/50 p-4 rounded-2xl border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-amber-200 text-amber-950">
                      {c.category}
                    </span>
                    <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                      c.reportedRole === 'driver' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {c.reportedRole}
                    </span>
                    <h3 className="font-extrabold text-slate-900">{c.title}</h3>
                  </div>
                  <p className="text-slate-600 font-medium line-clamp-1">{c.description}</p>
                  <span className="text-[10px] text-slate-500 font-bold block">
                    Reported by: {c.reportedBy?.name || 'User'} • {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <StatusBadge status={c.status} type="complaint" />
                  <Link
                    to="/admin/complaints"
                    className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold shadow-sm transition"
                  >
                    Resolve
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs font-semibold text-slate-500 text-center py-4">No pending reported issues.</p>
          )}
        </div>
      </div>

      {/* Green Campus & Carbon Footprint Plan */}
      <GreenCampusMetric variant="banner" />

      {/* Master Fleet Interactive Map with Multi-Route Navigation */}
      <div className="bg-white border border-amber-200/80 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-amber-100 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-800 px-2.5 py-0.5 rounded bg-emerald-100 border border-emerald-300">
                LIVE GPS MULTI-ROUTE NETWORK
              </span>
              <span className="text-xs text-slate-500 font-bold">Kanniyakumari & Tirunelveli Corridors</span>
            </div>
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-amber-600" />
              Master Rohini College Campus Fleet Tracking Map
            </h2>
            <p className="text-xs text-slate-600 font-medium">
              Real-time road navigation showing all bus routes (14A, 32C, 43C, and all transit corridors).
            </p>
          </div>

          {/* Route Navigation Selector Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedBusId('all')}
              className={`px-3.5 py-2 rounded-2xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                selectedBusId === 'all'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-amber-50 hover:bg-amber-100 text-slate-700 border border-amber-200'
              }`}
            >
              <span>🌐 All Bus Routes ({buses.length > 0 ? buses.length : 3} Corridors)</span>
            </button>

            {buses.map((b) => {
              const isSelected = selectedBusId === b._id;
              const isLive = b.isLiveTrip || (b.status === 'on_route' && (b.currentLocation?.speed > 0 || b.isLiveTrip));

              let colorBadge = 'border-emerald-300 text-emerald-800 bg-emerald-50';
              if ((b.busNumber || '').includes('32C')) colorBadge = 'border-cyan-300 text-cyan-800 bg-cyan-50';
              if ((b.busNumber || '').includes('43C')) colorBadge = 'border-purple-300 text-purple-800 bg-purple-50';

              return (
                <button
                  key={b._id}
                  type="button"
                  onClick={() => setSelectedBusId(b._id)}
                  className={`px-3.5 py-2 rounded-2xl text-xs font-black transition cursor-pointer flex items-center gap-2 ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-400'
                      : `bg-white hover:bg-slate-50 text-slate-800 border ${colorBadge}`
                  }`}
                >
                  <Bus className="w-3.5 h-3.5" />
                  <span>Bus {b.busNumber}</span>
                  {isLive && (
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Multi-Route Map View */}
        <BusTrackerMap 
          buses={buses} 
          selectedBus={selectedBusId === 'all' ? null : buses.find(b => b._id === selectedBusId)}
          showAllRoutes={selectedBusId === 'all'}
          onSelectBus={(bus) => setSelectedBusId(bus ? bus._id : 'all')}
          routes={routes}
          height="540px" 
        />
      </div>

    </div>
  );
};

export default AdminDashboard;
