import React, { useState, useEffect, useRef } from 'react';
import { 
  Bus, 
  Wrench, 
  Play, 
  Pause, 
  Navigation, 
  RefreshCw,
  ArrowRight,
  QrCode,
  Gauge,
  Camera,
  Volume2,
  RotateCcw,
  ArrowLeftRight,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldAlert,
  X,
  Bell
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { authAPI, busAPI, complaintAPI, routeAPI } from '../../services/api';
import BusTrackerMap from '../../components/BusTrackerMap';
import StatusBadge from '../../components/StatusBadge';
import { OfficialBusQRDisplay } from '../../components/QRPassModal';
import SpeedViolationMonitor from '../../components/SpeedViolationMonitor';
import SmartStopDemandOverview from '../../components/SmartStopDemandOverview';
import { playEngineSound, playBusHorn } from '../../utils/audio';
import { getRoadGeometry, getSimulationPathFromRoad } from '../../utils/routeGeometry';

// Default Stop Configurations for Buses (matches BusTrackerMap & seeder exactly)
const DEFAULT_14A_STOPS = [
  { name: 'Vadukatchimathil', lat: 8.4850, lng: 77.5680, estimatedMinutesFromStart: 0 },
  { name: 'Dohnavur', lat: 8.4720, lng: 77.5640, estimatedMinutesFromStart: 10 },
  { name: 'Eruvadi', lat: 8.4411, lng: 77.5614, estimatedMinutesFromStart: 18 },
  { name: 'Vallioor Bypass', lat: 8.3850, lng: 77.6180, estimatedMinutesFromStart: 26 },
  { name: 'Panagudi', lat: 8.3228, lng: 77.5819, estimatedMinutesFromStart: 34 },
  { name: 'Rohini College Campus (RCET)', lat: 8.1685, lng: 77.5362, estimatedMinutesFromStart: 50, isCollege: true }
];

const DEFAULT_32C_STOPS = [
  { name: 'Parappadi', lat: 8.5375, lng: 77.6186, estimatedMinutesFromStart: 0 },
  { name: 'Nanguneri', lat: 8.4870, lng: 77.6580, estimatedMinutesFromStart: 10 },
  { name: 'Sirumalanji', lat: 8.4520, lng: 77.6400, estimatedMinutesFromStart: 18 },
  { name: 'Perumalanji', lat: 8.4230, lng: 77.6250, estimatedMinutesFromStart: 25 },
  { name: 'Vallioor', lat: 8.3792, lng: 77.6144, estimatedMinutesFromStart: 33 },
  { name: 'Therku Vallioor', lat: 8.3510, lng: 77.6080, estimatedMinutesFromStart: 38 },
  { name: 'Kalanthapani', lat: 8.2840, lng: 77.5750, estimatedMinutesFromStart: 48 },
  { name: 'Rohini College Campus (RCET)', lat: 8.1685, lng: 77.5362, estimatedMinutesFromStart: 60, isCollege: true }
];

const DEFAULT_43C_STOPS = [
  { name: 'Town (Tirunelveli)', lat: 8.7290, lng: 77.6850, estimatedMinutesFromStart: 0 },
  { name: 'Melapalayam', lat: 8.7050, lng: 77.7120, estimatedMinutesFromStart: 8 },
  { name: 'Palayamkottai', lat: 8.7150, lng: 77.7310, estimatedMinutesFromStart: 16 },
  { name: 'New Bus Stand', lat: 8.7180, lng: 77.7420, estimatedMinutesFromStart: 24 },
  { name: 'KTC Nagar', lat: 8.7120, lng: 77.7600, estimatedMinutesFromStart: 30 },
  { name: 'Nanguneri Toll Gate', lat: 8.4980, lng: 77.6650, estimatedMinutesFromStart: 45 },
  { name: 'Vallioor Bypass', lat: 8.3850, lng: 77.6180, estimatedMinutesFromStart: 55 },
  { name: 'Panagudi', lat: 8.3228, lng: 77.5819, estimatedMinutesFromStart: 65 },
  { name: 'Rohini College Campus (RCET)', lat: 8.1685, lng: 77.5362, estimatedMinutesFromStart: 75, isCollege: true }
];

// Fallback college corridor stops for newly added buses without assigned route
const DEFAULT_GENERIC_STOPS = [
  { name: 'Vallioor Junction', lat: 8.3792, lng: 77.6144, estimatedMinutesFromStart: 0 },
  { name: 'Therku Vallioor', lat: 8.3510, lng: 77.6080, estimatedMinutesFromStart: 8 },
  { name: 'Panagudi', lat: 8.3228, lng: 77.5819, estimatedMinutesFromStart: 18 },
  { name: 'Kalanthapani', lat: 8.2840, lng: 77.5750, estimatedMinutesFromStart: 28 },
  { name: 'Rohini College Campus (RCET)', lat: 8.1685, lng: 77.5362, estimatedMinutesFromStart: 45, isCollege: true }
];

// Generates road-snapped coordinates directly synchronized with the green map line
const generateRoadSnappedPath = async (waypoints, direction, busIdentifier = '') => {
  const roadCoords = await getRoadGeometry(waypoints, busIdentifier, direction);
  return getSimulationPathFromRoad(roadCoords, waypoints, direction);
};

const getWaypointsForCurrentBus = (bus, direction, routes = []) => {
  const bNum = String(bus?.busNumber || '').toUpperCase().trim();
  const rName = String(bus?.routeName || '').toUpperCase().trim();

  let stops = [];

  // 1. Strict priority for known campus bus routes: 14A, 43C, 32C
  if (bNum.includes('14A') || rName.includes('14A') || rName.includes('VADUKATCHI')) {
    stops = DEFAULT_14A_STOPS;
  } else if (bNum.includes('43C') || rName.includes('43C') || rName.includes('TOWN') || rName.includes('TIRUNELVELI')) {
    stops = DEFAULT_43C_STOPS;
  } else if (bNum.includes('32C') || rName.includes('32C') || rName.includes('PARAPPADI')) {
    stops = DEFAULT_32C_STOPS;
  } 
  // 2. Direct populated route on bus for custom / newly added buses
  else if (bus?.route?.stops && bus.route.stops.length > 1) {
    stops = bus.route.stops;
  } 
  // 3. Match with routes list by ID or name
  else if (routes && routes.length > 0) {
    const routeId = typeof bus?.route === 'object' ? bus.route?._id : bus?.route;
    const matchedRoute = routes.find(r => 
      (routeId && r._id === routeId) ||
      (bus?.routeName && (r.routeName === bus.routeName || r.routeCode === bus.routeName))
    );
    if (matchedRoute?.stops && matchedRoute.stops.length > 1) {
      stops = matchedRoute.stops;
    }
  }

  // 4. Default guaranteed valid route for ANY newly added bus without route
  if (!stops || stops.length < 2) {
    stops = DEFAULT_GENERIC_STOPS;
  }

  // Guarantee that Rohini College Campus (RCET) is the terminal stop
  const lastStop = stops[stops.length - 1];
  const lastStopName = (lastStop?.name || '').toLowerCase();
  if (!lastStopName.includes('college') && !lastStopName.includes('rcet') && !lastStopName.includes('rohini')) {
    stops = [...stops, { name: 'Rohini College Campus (RCET)', lat: 8.1685, lng: 77.5362, estimatedMinutesFromStart: 50, isCollege: true }];
  }

  const maxMinutes = Math.max(...stops.map(s => s.estimatedMinutesFromStart || 0), 45);

  if (direction === 'forward') {
    return stops.map(s => ({
      name: s.name,
      lat: s.lat,
      lng: s.lng,
      etaMins: Math.max(0, maxMinutes - (s.estimatedMinutesFromStart || 0))
    }));
  } else {
    const reversed = [...stops].reverse();
    const numStops = reversed.length;
    return reversed.map((s, idx) => ({
      name: s.name,
      lat: s.lat,
      lng: s.lng,
      etaMins: Math.max(0, Math.round(maxMinutes - (idx / (numStops - 1 || 1)) * maxMinutes))
    }));
  }
};

const DriverDashboard = () => {
  const { user, refreshUser } = useAuth();
  const { socket } = useSocket();
  
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [assignedBus, setAssignedBus] = useState(null);
  const [driverComplaints, setDriverComplaints] = useState([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simStep, setSimStep] = useState(0);
  const [journeyDirection, setJourneyDirection] = useState('forward'); // 'forward' | 'return'
  const [speed, setSpeed] = useState(45);
  const [statusMsg, setStatusMsg] = useState('');
  const [toast, setToast] = useState(null); // { type: 'success' | 'warning' | 'error' | 'info', title: '', message: '' }
  const [showOfficialQR, setShowOfficialQR] = useState(false);

  // Synchronous refs to prevent race conditions or ghost timers
  const simStepRef = useRef(0);
  const simIntervalRef = useRef(null);
  const isSimulatingRef = useRef(false);

  // Synchronously kill any active timer and flag simulation as stopped
  const stopSimulation = () => {
    if (simIntervalRef.current) {
      clearInterval(simIntervalRef.current);
      simIntervalRef.current = null;
    }
    isSimulatingRef.current = false;
    setIsSimulating(false);
  };

  const handleBusSelect = async (busId) => {
    // 1. Synchronously kill any active simulation timer
    stopSimulation();
    simStepRef.current = 0;
    setSimStep(0);

    const selected = buses.find(b => b._id === busId);
    if (!selected) return;
    setAssignedBus(selected);

    const waypoints = getWaypointsForCurrentBus(selected, journeyDirection, routes);
    const startPoint = waypoints[0];
    const endPoint = waypoints[waypoints.length - 1]?.name || 'Destination';

    setStatusMsg(`Switched control to Bus ${selected.busNumber} (${selected.routeName || 'Campus Route'}). Ready.`);
    setToast({
      type: 'info',
      title: `Bus ${selected.busNumber} Selected`,
      message: `Active bus switched to ${selected.busNumber}. Ready for Morning / Evening trip.`
    });

    try {
      await authAPI.updateAssignedBus({ busId: selected._id });
      if (refreshUser) refreshUser();
    } catch (err) {
      console.error('Error updating driver assigned bus:', err);
    }
  };

  const fetchDriverData = async () => {
    try {
      const [busRes, compRes, routeRes] = await Promise.all([
        busAPI.getAll(),
        complaintAPI.getAll(),
        routeAPI.getAll().catch(() => ({ data: { data: [] } }))
      ]);

      const allBuses = busRes.data.data || [];
      const allRoutes = routeRes.data.data || [];
      setBuses(allBuses);
      setRoutes(allRoutes);
      setDriverComplaints(compRes.data.data || []);

      // Accurate & Robust Driver Bus Assignment Matching
      const uId = user?._id ? user._id.toString() : '';
      const uAssignedBusId = user?.assignedBus ? (user.assignedBus._id || user.assignedBus).toString() : '';
      const uName = user?.name ? user.name.toLowerCase().trim() : '';
      const uEmail = user?.email ? user.email.toLowerCase().trim() : '';

      // Direct email/name matching guarantees exact assignment:
      // Thangaraj -> 43C (Tirunelveli Route)
      // Subramanian / Subu -> 14A (Vadukatchimathil Route)
      // Vanu -> 32C (Parappadi Route)
      let matchedBus = null;
      if (uEmail.includes('thangaraj') || uName.includes('thangaraj') || uName.includes('43c') || uEmail.includes('43c')) {
        matchedBus = allBuses.find(b => (b.busNumber || '').toUpperCase().includes('43C'));
      } else if (uEmail.includes('subu') || uName.includes('subu') || uName.includes('subramanian') || uName.includes('14a') || uEmail.includes('14a')) {
        matchedBus = allBuses.find(b => (b.busNumber || '').toUpperCase().includes('14A'));
      } else if (uEmail.includes('vanu') || uName.includes('vanu') || uName.includes('32c') || uEmail.includes('32c')) {
        matchedBus = allBuses.find(b => (b.busNumber || '').toUpperCase().includes('32C'));
      }

      // If not resolved by direct credential name, match by database IDs
      if (!matchedBus) {
        matchedBus = allBuses.find(b => {
          const bDriverId = b.driver ? (b.driver._id || b.driver).toString() : '';
          const bId = b._id ? b._id.toString() : '';
          const bDriverName = (b.driverName || b.driver?.name || '').toLowerCase().trim();
          const bDriverEmail = (b.driver?.email || '').toLowerCase().trim();

          return (
            (bDriverId && uId && bDriverId === uId) ||
            (uAssignedBusId && bId && uAssignedBusId === bId) ||
            (bDriverEmail && uEmail && bDriverEmail === uEmail) ||
            (bDriverName && uName && (bDriverName.includes(uName) || uName.includes(bDriverName)))
          );
        });
      }

      setAssignedBus(matchedBus || (allBuses.length > 0 ? allBuses[0] : null));
    } catch (err) {
      console.error('Error fetching driver dashboard:', err);
    }
  };

  useEffect(() => {
    fetchDriverData();

    if (socket) {
      socket.on('complaint_progress_updated', fetchDriverData);
      socket.on('new_complaint_submitted', fetchDriverData);
    }

    return () => {
      stopSimulation();
      if (socket) {
        socket.off('complaint_progress_updated', fetchDriverData);
        socket.off('new_complaint_submitted', fetchDriverData);
      }
    };
  }, [socket]);

  // Auto-dismiss toast notification after 4.5 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Road-snapped continuous GPS simulation directly on the green polyline
  const handleToggleSimulation = async () => {
    if (!assignedBus) return;

    if (isSimulatingRef.current) {
      stopSimulation();
      busAPI.stopSimulation(assignedBus._id).catch(() => {});
      setStatusMsg('GPS route simulation paused.');
      return;
    }

    // Always stop any lingering intervals first
    stopSimulation();
    isSimulatingRef.current = true;
    setIsSimulating(true);
    playEngineSound();

    const waypoints = getWaypointsForCurrentBus(assignedBus, journeyDirection, routes);
    const startStop = waypoints[0]?.name || 'Start';
    const endStop = waypoints[waypoints.length - 1]?.name || 'Destination';
    const directionLabel = journeyDirection === 'forward' ? `Morning (${startStop} ➔ ${endStop})` : `Evening (${startStop} ➔ ${endStop})`;
    setStatusMsg(`Snapping to road and simulating live GPS drive (${directionLabel}) for Bus ${assignedBus.busNumber}...`);

    const smoothPath = await generateRoadSnappedPath(waypoints, journeyDirection, assignedBus?.busNumber || assignedBus?.routeName);

    // CRITICAL GUARD: Check if the simulation was cancelled/reset while fetching path!
    if (!isSimulatingRef.current) {
      return;
    }

    // Launch server-side background simulation (keeps broadcasting live even if driver closes tab or logs out!)
    busAPI.startSimulation(assignedBus._id, { path: smoothPath, direction: journeyDirection }).catch(err => {
      console.warn('Server simulation launch note:', err.message);
    });

    // Ensure no multiple intervals run simultaneously
    if (simIntervalRef.current) {
      clearInterval(simIntervalRef.current);
      simIntervalRef.current = null;
    }

    const interval = setInterval(async () => {
      // If simulation was cancelled, bail out immediately
      if (!isSimulatingRef.current) {
        clearInterval(interval);
        return;
      }

      const currentStep = simStepRef.current;

      // When reaching the last point of the route, stay still and finish ride
      if (currentStep >= smoothPath.length - 1) {
        const finalPoint = smoothPath[smoothPath.length - 1];
        stopSimulation();
        setStatusMsg(`🏁 Arrived at final destination (${endStop}). Bus is now parked still until route reset.`);

        try {
          await busAPI.updateLocation(assignedBus._id, {
            lat: finalPoint.lat,
            lng: finalPoint.lng,
            speed: 0,
            heading: finalPoint.heading,
            estimatedArrival: `Arrived at ${endStop}`,
            status: 'on_route'
          });

          setAssignedBus(prev => prev ? {
            ...prev,
            status: 'on_route',
            estimatedArrival: `Arrived at ${endStop}`,
            currentLocation: { ...prev.currentLocation, lat: finalPoint.lat, lng: finalPoint.lng, speed: 0, heading: finalPoint.heading }
          } : prev);
        } catch (err) {
          console.error('Final destination arrival error:', err);
        }
        return;
      }

      const curr = smoothPath[currentStep];
      simStepRef.current = currentStep + 1;
      setSimStep(currentStep + 1);

      try {
        await busAPI.updateLocation(assignedBus._id, {
          lat: curr.lat,
          lng: curr.lng,
          speed: speed,
          heading: curr.heading,
          estimatedArrival: curr.etaText,
          status: 'on_route'
        });

        setAssignedBus(prev => prev ? {
          ...prev,
          status: 'on_route',
          estimatedArrival: curr.etaText,
          currentLocation: { ...prev.currentLocation, lat: curr.lat, lng: curr.lng, speed: speed, heading: curr.heading }
        } : prev);
      } catch (err) {
        console.error('Road-snapped GPS simulation error:', err);
      }
    }, 1200);

    simIntervalRef.current = interval;
  };

  const handleResetTrip = async () => {
    // 1. Immediately and completely kill any active simulation timer
    stopSimulation();
    simStepRef.current = 0;
    setSimStep(0);

    const waypoints = getWaypointsForCurrentBus(assignedBus, journeyDirection, routes);
    const startPoint = waypoints[0];
    const endPoint = waypoints[waypoints.length - 1]?.name || 'Destination';
    setStatusMsg(`Trip reset to starting point: ${startPoint?.name || 'Origin'}`);
    setToast({
      type: 'info',
      title: 'Trip Reset',
      message: `Bus ${assignedBus?.busNumber || ''} repositioned to ${startPoint?.name || 'start point'}. Parked still.`
    });

    if (assignedBus && startPoint) {
      try {
        busAPI.resetTrip(assignedBus._id, {
          startLat: startPoint.lat,
          startLng: startPoint.lng,
          heading: journeyDirection === 'return' ? 0 : 180,
          estimatedArrival: `${startPoint.etaMins || 45} mins to ${endPoint}`
        }).catch(() => {});

        await busAPI.updateLocation(assignedBus._id, {
          lat: startPoint.lat,
          lng: startPoint.lng,
          speed: 0,
          heading: journeyDirection === 'return' ? 0 : 180,
          estimatedArrival: `${startPoint.etaMins || 45} mins to ${endPoint}`,
          status: 'on_route'
        });

        setAssignedBus(prev => prev ? {
          ...prev,
          status: 'on_route',
          estimatedArrival: `${startPoint.etaMins || 45} mins to ${endPoint}`,
          currentLocation: { ...prev.currentLocation, lat: startPoint.lat, lng: startPoint.lng, speed: 0, heading: journeyDirection === 'return' ? 0 : 180 }
        } : prev);
      } catch (err) {
        console.error('Reset trip error:', err);
      }
    }
  };

  const handleToggleDirection = async () => {
    // 1. Immediately and completely kill any active simulation timer
    stopSimulation();
    simStepRef.current = 0;
    setSimStep(0);

    const nextDir = journeyDirection === 'forward' ? 'return' : 'forward';
    setJourneyDirection(nextDir);

    const waypoints = getWaypointsForCurrentBus(assignedBus, nextDir, routes);
    const startPoint = waypoints[0];
    const endPoint = waypoints[waypoints.length - 1]?.name || 'Destination';
    const directionLabel = nextDir === 'forward' 
      ? `Morning Forward (${startPoint?.name} ➔ ${endPoint})` 
      : `Evening Return (${startPoint?.name} ➔ ${endPoint})`;

    setStatusMsg(`Switched to ${directionLabel}. Bus moved to starting location (${startPoint?.name}).`);
    setToast({
      type: 'info',
      title: 'Route Direction Changed',
      message: `Switched to ${nextDir === 'forward' ? 'Morning Route' : 'Evening Return Route'}. Bus placed at ${startPoint?.name || 'start point'}.`
    });

    // Instantly place bus at the start of the new route (at College if evening route!)
    if (assignedBus && startPoint) {
      try {
        busAPI.resetTrip(assignedBus._id, {
          startLat: startPoint.lat,
          startLng: startPoint.lng,
          heading: journeyDirection === 'return' ? 0 : 180,
          estimatedArrival: `${startPoint.etaMins || 45} mins to ${endPoint}`
        }).catch(() => {});

        await busAPI.updateLocation(assignedBus._id, {
          lat: startPoint.lat,
          lng: startPoint.lng,
          speed: 0,
          heading: nextDir === 'return' ? 0 : 180,
          estimatedArrival: `${startPoint.etaMins || 45} mins to ${endPoint}`,
          status: 'on_route'
        });

        setAssignedBus(prev => prev ? {
          ...prev,
          status: 'on_route',
          estimatedArrival: `${startPoint.etaMins || 45} mins to ${endPoint}`,
          currentLocation: { ...prev.currentLocation, lat: startPoint.lat, lng: startPoint.lng, speed: 0, heading: nextDir === 'return' ? 0 : 180 }
        } : prev);
      } catch (err) {
        console.error('Error repositioning bus on direction change:', err);
      }
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    if (!assignedBus) {
      const msg = 'No bus assigned! Please select a bus from the dropdown above.';
      setStatusMsg(msg);
      setToast({ type: 'error', title: 'No Bus Selected', message: msg });
      return;
    }

    const readableStatus = newStatus.replace('_', ' ').toUpperCase();
    const statusText = `Bus status updated to ${readableStatus}`;

    // Optimistic immediate update so badge & buttons update without delay
    setAssignedBus(prev => prev ? { ...prev, status: newStatus } : prev);
    setStatusMsg(statusText);
    setToast({
      type: newStatus === 'delayed' ? 'warning' : newStatus === 'breakdown' ? 'error' : 'success',
      title: `Bus ${assignedBus.busNumber} • Status: ${readableStatus}`,
      message: newStatus === 'delayed' 
        ? 'Delay alert broadcasted to all students and dispatchers in real-time.' 
        : newStatus === 'breakdown'
        ? 'Emergency breakdown broadcasted! Students are being notified.'
        : 'Bus status is now set to On-Route.'
    });

    try {
      await busAPI.updateStatus(assignedBus._id, {
        status: newStatus,
        note: `Driver ${user?.name || 'Captain'} updated status to ${readableStatus}`
      });
      fetchDriverData();
    } catch (err) {
      console.error('Update status error:', err);
      const errMsg = err.response?.data?.message || err.message || 'Server error updating status';
      setStatusMsg(`Update failed: ${errMsg}`);
      setToast({ type: 'error', title: 'Update Failed', message: errMsg });
    }
  };

  return (
    <div className="space-y-6 relative">
      
      {/* Floating Global Toast Notification */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 max-w-sm w-full p-4 rounded-2xl shadow-2xl border flex items-start gap-3 transition-all duration-300 backdrop-blur-md animate-in fade-in slide-in-from-top-4 ${
          toast.type === 'warning' 
            ? 'bg-orange-50/95 border-orange-300 text-orange-950 shadow-orange-500/20' 
            : toast.type === 'error'
            ? 'bg-rose-50/95 border-rose-300 text-rose-950 shadow-rose-500/20'
            : toast.type === 'info'
            ? 'bg-amber-50/95 border-amber-300 text-amber-950 shadow-amber-500/20'
            : 'bg-emerald-50/95 border-emerald-300 text-emerald-950 shadow-emerald-500/20'
        }`}>
          {toast.type === 'warning' ? (
            <AlertTriangle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
          ) : toast.type === 'error' ? (
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          ) : toast.type === 'info' ? (
            <Navigation className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <h4 className="text-xs font-black uppercase tracking-wider">{toast.title}</h4>
            <p className="text-xs font-semibold mt-0.5 opacity-90">{toast.message}</p>
          </div>
          <button 
            onClick={() => setToast(null)}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-amber-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-800 px-2.5 py-0.5 rounded bg-amber-100 border border-amber-300">
              DRIVER CONTROL ROOM
            </span>
            <span className="text-xs text-slate-600 font-bold">License: {user?.licenseNumber || 'N/A'}</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">Welcome, Captain {user?.name} 🚌</h1>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <p className="text-xs text-slate-600 font-medium">
              Rohini College Campus Route Control
            </p>
            <span className="text-slate-300">•</span>
            <div className="flex items-center gap-1.5 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200">
              <Bus className="w-3.5 h-3.5 text-amber-700" />
              <span className="text-[11px] font-bold text-slate-700">Controlled Bus:</span>
              <select
                value={assignedBus?._id || ''}
                onChange={(e) => handleBusSelect(e.target.value)}
                className="bg-amber-500 text-slate-950 font-extrabold text-xs px-2 py-0.5 rounded-lg border border-amber-600 shadow-sm focus:outline-none cursor-pointer"
              >
                {buses.map((b) => (
                  <option key={b._id} value={b._id} className="bg-white text-slate-900 font-bold">
                    Bus {b.busNumber} ({b.routeName ? b.routeName.split('-')[0].trim() : 'Route'})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowOfficialQR(true)}
            className="px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold shadow-md shadow-amber-500/20 transition flex items-center gap-2 cursor-pointer"
          >
            <QrCode className="w-4 h-4" />
            <span>Display Official Bus QR Code</span>
          </button>
          <Link
            to="/driver/complaints"
            className="px-4 py-2.5 rounded-2xl bg-amber-100 hover:bg-amber-200 text-amber-950 text-xs font-extrabold border border-amber-300 transition flex items-center gap-2"
          >
            Vehicle Complaints <ArrowRight className="w-4 h-4" />
          </Link>
          <button
            onClick={fetchDriverData}
            className="p-2.5 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showOfficialQR && (
        <OfficialBusQRDisplay 
          busNumber={assignedBus?.busNumber || 'RCET-BUS-01'} 
          onClose={() => setShowOfficialQR(false)} 
        />
      )}

      {/* Smart Stop Demand Overview for Driver */}
      <SmartStopDemandOverview busNumber={assignedBus?.busNumber} />

      {/* Vehicle Issues & Admin Bill Pass Log Widget */}
      <div className="bg-white border border-amber-200/80 rounded-3xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-amber-100 pb-2">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800">VEHICLE LOG & GARAGE PASSES</span>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Wrench className="w-5 h-5 text-amber-600" />
              Reported Vehicle Problems & Admin Bill Passes
            </h3>
          </div>
          <Link to="/driver/complaints" className="text-xs font-extrabold text-amber-800 hover:text-amber-950 flex items-center gap-1">
            <span>Open Requisition Desk</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {driverComplaints.length > 0 ? (
            driverComplaints.slice(0, 2).map((c) => (
              <div key={c._id} className="bg-amber-50/50 p-4 rounded-2xl border border-amber-200 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-amber-200 text-amber-950">
                      {c.category}
                    </span>
                    <h4 className="font-extrabold text-slate-900 line-clamp-1">{c.title}</h4>
                  </div>
                  <StatusBadge status={c.status} type="complaint" />
                </div>

                <p className="text-slate-700 text-[11px] font-medium line-clamp-2">{c.description}</p>

                {(c.billPassNote || c.estimatedPrice > 0) && (
                  <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 text-[11px]">
                    <span className="font-extrabold text-emerald-900 block">
                      Garage Pass Approved: ${c.estimatedPrice || 0}
                    </span>
                    {c.billPassNote && <p className="text-slate-800 font-semibold">{c.billPassNote}</p>}
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className="text-xs font-semibold text-slate-500 col-span-2 text-center py-2">
              No active vehicle maintenance issues logged.
            </p>
          )}
        </div>
      </div>

      {/* Speed Violation Monitor & Telematics Alert */}
      <SpeedViolationMonitor 
        currentSpeed={speed} 
        maxLimit={60} 
        busNumber={assignedBus?.busNumber || 'Unassigned'} 
      />

      {/* Trip Controller & GPS Simulation - Strictly Single Bus View */}
      <div className="bg-white border border-amber-200/80 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-100 pb-4">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800">TRIP & GPS SIMULATION</span>
            <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <Bus className="w-5 h-5 text-amber-600" />
              {assignedBus ? `Assigned Bus: ${assignedBus.busNumber} (${assignedBus.plateNumber})` : 'No Bus Assigned'}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleDirection}
              className="px-3 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 text-xs font-extrabold border border-amber-300 transition flex items-center gap-1.5 cursor-pointer"
              title="Toggle Morning / Evening Route Direction"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>{journeyDirection === 'forward' ? 'Morning Route' : 'Evening Return Route'}</span>
            </button>
            {assignedBus && <StatusBadge status={assignedBus.status} type="bus" />}
          </div>
        </div>

        {/* Real-time Status Alert Banner (Directly Above Action Buttons) */}
        {statusMsg && (
          <div className="bg-amber-50/90 border border-amber-300 p-3.5 rounded-2xl text-xs font-bold text-amber-950 flex items-center justify-between gap-2 shadow-xs transition-all">
            <div className="flex items-center gap-2.5">
              <Navigation className="w-4 h-4 text-amber-700 animate-spin shrink-0" />
              <span>{statusMsg}</span>
            </div>
            <button 
              onClick={() => setStatusMsg('')}
              className="text-amber-800 hover:text-amber-950 font-black text-[10px] px-2.5 py-1 rounded-lg bg-amber-200/80 hover:bg-amber-300 transition cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Action Controls */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <button
            onClick={handleToggleSimulation}
            className={`py-3.5 px-4 rounded-2xl font-extrabold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer ${
              isSimulating 
                ? 'bg-amber-600 text-white animate-pulse'
                : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-600/20'
            }`}
          >
            {isSimulating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isSimulating ? 'Pause Ride' : 'Start/Resume Ride'}
          </button>

          <button
            onClick={handleResetTrip}
            className="py-3.5 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs border border-slate-300 transition flex items-center justify-center gap-1.5 cursor-pointer"
            title="Reset trip to Step 0"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Trip</span>
          </button>

          <button
            onClick={() => handleUpdateStatus('on_route')}
            className={`py-3.5 px-4 rounded-2xl font-extrabold text-xs border transition cursor-pointer flex items-center justify-center gap-1.5 ${
              assignedBus?.status === 'on_route'
                ? 'bg-emerald-600 text-white border-emerald-700 shadow-md ring-2 ring-emerald-300'
                : 'bg-amber-50 hover:bg-amber-100 text-slate-900 border-amber-200'
            }`}
          >
            {assignedBus?.status === 'on_route' && <CheckCircle2 className="w-3.5 h-3.5" />}
            <span>{assignedBus?.status === 'on_route' ? 'Active: On-Route' : 'Set On-Route'}</span>
          </button>

          <button
            onClick={() => handleUpdateStatus('delayed')}
            className={`py-3.5 px-4 rounded-2xl font-extrabold text-xs border transition cursor-pointer flex items-center justify-center gap-1.5 ${
              assignedBus?.status === 'delayed'
                ? 'bg-orange-600 text-white border-orange-700 shadow-md ring-2 ring-orange-300'
                : 'bg-orange-50 hover:bg-orange-100 text-orange-800 border-orange-200'
            }`}
          >
            {assignedBus?.status === 'delayed' ? (
              <AlertTriangle className="w-3.5 h-3.5 text-white" />
            ) : (
              <Clock className="w-3.5 h-3.5 text-orange-600" />
            )}
            <span>{assignedBus?.status === 'delayed' ? 'Active: DELAYED' : 'Mark Delay Alert'}</span>
          </button>

          <button
            onClick={() => handleUpdateStatus('breakdown')}
            className={`py-3.5 px-4 rounded-2xl font-extrabold text-xs border transition cursor-pointer flex items-center justify-center gap-1.5 ${
              assignedBus?.status === 'breakdown'
                ? 'bg-rose-600 text-white border-rose-700 shadow-md ring-2 ring-rose-300 animate-pulse'
                : 'bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-200'
            }`}
          >
            {assignedBus?.status === 'breakdown' && <ShieldAlert className="w-3.5 h-3.5 text-white" />}
            <span>{assignedBus?.status === 'breakdown' ? 'Active: Breakdown' : 'Broadcast Breakdown'}</span>
          </button>
        </div>

        {/* Pass ONLY the driver's assigned bus with current journey direction and routes */}
        <BusTrackerMap buses={assignedBus ? [assignedBus] : []} selectedBus={assignedBus} height="460px" direction={journeyDirection} routes={routes} />
      </div>

    </div>
  );
};

export default DriverDashboard;

