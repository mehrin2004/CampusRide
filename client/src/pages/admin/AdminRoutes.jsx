import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Navigation, X, Edit3 } from 'lucide-react';
import { routeAPI } from '../../services/api';

// Verified Geographic Coordinate Dictionary for Campus Shuttle Stops
const KNOWN_STOPS_GEO = {
  // Rohini College & Terminus
  'rohini college campus (rcet)': { lat: 8.1685, lng: 77.5362 },
  'rohini college campus': { lat: 8.1685, lng: 77.5362 },
  'rohini college': { lat: 8.1685, lng: 77.5362 },
  'rcet': { lat: 8.1685, lng: 77.5362 },
  'anjugramam': { lat: 8.1685, lng: 77.5362 },

  // Nagercoil / Kanyakumari Corridor
  'nagercoil': { lat: 8.1833, lng: 77.4119 },
  'vadasery': { lat: 8.1880, lng: 77.4250 },
  'anna bus stand': { lat: 8.1810, lng: 77.4280 },
  'suchindram': { lat: 8.1550, lng: 77.4650 },
  'marungoor': { lat: 8.2100, lng: 77.5050 },
  'thovalai': { lat: 8.2250, lng: 77.5020 },
  'aralvaimozhi': { lat: 8.2450, lng: 77.5250 },
  'muppandal': { lat: 8.2650, lng: 77.5500 },
  'kanyakumari': { lat: 8.0883, lng: 77.5385 },
  'cape comorin': { lat: 8.0883, lng: 77.5385 },
  'agasteeswaram': { lat: 8.1250, lng: 77.5150 },
  'kavalkinaru': { lat: 8.2580, lng: 77.5850 },
  'vadakkankulam': { lat: 8.2520, lng: 77.5720 },

  // Vallioor & Panagudi Corridor
  'panagudi': { lat: 8.3228, lng: 77.5819 },
  'kalanthapani': { lat: 8.2840, lng: 77.5750 },
  'vallioor': { lat: 8.3792, lng: 77.6144 },
  'vallioor bypass': { lat: 8.3850, lng: 77.6180 },
  'therku vallioor': { lat: 8.3510, lng: 77.6080 },
  'perumalanji': { lat: 8.4230, lng: 77.6250 },
  'sirumalanji': { lat: 8.4520, lng: 77.6400 },

  // Nanguneri & Kalakkad Corridor
  'nanguneri': { lat: 8.4870, lng: 77.6580 },
  'nanguneri toll gate': { lat: 8.4980, lng: 77.6650 },
  'parappadi': { lat: 8.5375, lng: 77.6186 },
  'eruvadi': { lat: 8.4411, lng: 77.5614 },
  'dohnavur': { lat: 8.4720, lng: 77.5640 },
  'vadukatchimathil': { lat: 8.4850, lng: 77.5680 },
  'kalakkad': { lat: 8.5130, lng: 77.5530 },

  // Tirunelveli Corridor
  'tirunelveli': { lat: 8.7300, lng: 77.6950 },
  'town (tirunelveli)': { lat: 8.7290, lng: 77.6850 },
  'town tirunelveli': { lat: 8.7290, lng: 77.6850 },
  'melapalayam': { lat: 8.7050, lng: 77.7120 },
  'palayamkottai': { lat: 8.7150, lng: 77.7310 },
  'new bus stand': { lat: 8.7180, lng: 77.7420 },
  'ktc nagar': { lat: 8.7120, lng: 77.7600 },
  'reddiarpatti': { lat: 8.6750, lng: 77.7450 },
  'munneerpallam': { lat: 8.6500, lng: 77.7150 }
};

const findGeoForName = (name) => {
  if (!name) return null;
  const clean = name.toLowerCase().trim();
  if (KNOWN_STOPS_GEO[clean]) return KNOWN_STOPS_GEO[clean];
  for (const [k, v] of Object.entries(KNOWN_STOPS_GEO)) {
    if (clean.includes(k) || k.includes(clean)) return v;
  }
  return null;
};

const AdminRoutes = () => {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);

  const [routeName, setRouteName] = useState('');
  const [routeCode, setRouteCode] = useState('');
  const [startPoint, setStartPoint] = useState('');
  const [endPoint, setEndPoint] = useState('');
  const [totalDistance, setTotalDistance] = useState('35 km');
  const [estimatedDuration, setEstimatedDuration] = useState('45 mins');
  const [stopsInput, setStopsInput] = useState('');

  const fetchRoutes = async () => {
    try {
      const res = await routeAPI.getAll();
      setRoutes(res.data.data || []);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, []);

  const openCreateModal = () => {
    setEditingRoute(null);
    setRouteName('');
    setRouteCode('');
    setStartPoint('');
    setEndPoint('');
    setTotalDistance('35 km');
    setEstimatedDuration('45 mins');
    setStopsInput('');
    setIsModalOpen(true);
  };

  const handleEditClick = (r) => {
    setEditingRoute(r);
    setRouteName(r.routeName || '');
    setRouteCode(r.routeCode || '');
    setStartPoint(r.startPoint || '');
    setEndPoint(r.endPoint || '');
    setTotalDistance(r.totalDistance || '35 km');
    setEstimatedDuration(r.estimatedDuration || '45 mins');
    const existingStops = (r.stops || []).map(s => s.name).join(', ');
    setStopsInput(existingStops || `${r.startPoint || ''}, ${r.endPoint || ''}`);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let rawStops = stopsInput
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      if (rawStops.length === 0) {
        rawStops = [
          startPoint || 'Origin',
          'Vallioor Bypass',
          'Panagudi',
          endPoint || 'Rohini College Campus (RCET)'
        ];
      }

      // Ensure last stop is always Rohini College Campus (RCET) for campus shuttles
      const lastStopName = rawStops[rawStops.length - 1].toLowerCase();
      if (!lastStopName.includes('rohini') && !lastStopName.includes('rcet') && !lastStopName.includes('college')) {
        rawStops.push('Rohini College Campus (RCET)');
      }

      const collegeCoord = { lat: 8.1685, lng: 77.5362 };
      const firstGeo = findGeoForName(rawStops[0]) || { lat: 8.5375, lng: 77.6186 };

      const formattedStops = rawStops.map((stName, idx, arr) => {
        const directGeo = findGeoForName(stName);
        if (directGeo) {
          return {
            name: stName,
            lat: directGeo.lat,
            lng: directGeo.lng,
            estimatedMinutesFromStart: Math.round((idx / (arr.length - 1 || 1)) * 50)
          };
        }

        // Smooth spatial interpolation between start point and RCET
        const ratio = idx / (arr.length - 1 || 1);
        const lat = +(firstGeo.lat + (collegeCoord.lat - firstGeo.lat) * ratio).toFixed(4);
        const lng = +(firstGeo.lng + (collegeCoord.lng - firstGeo.lng) * ratio).toFixed(4);

        return {
          name: stName,
          lat,
          lng,
          estimatedMinutesFromStart: Math.round(ratio * 50)
        };
      });

      const payload = {
        routeName,
        routeCode,
        startPoint: rawStops[0],
        endPoint: rawStops[rawStops.length - 1],
        totalDistance,
        estimatedDuration,
        stops: formattedStops
      };

      if (editingRoute) {
        await routeAPI.update(editingRoute._id, payload);
      } else {
        await routeAPI.create(payload);
      }

      setIsModalOpen(false);
      setEditingRoute(null);
      fetchRoutes();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save route');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-amber-200/80 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <MapPin className="w-6 h-6 text-amber-600" />
            Manage Rohini Campus Routes & Stops
          </h1>
          <p className="text-xs text-slate-600 font-medium mt-1">
            Configure shuttle routes across Tirunelveli, Nagercoil, Vallioor, and Rohini College (RCET).
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold shadow-md shadow-amber-500/20 transition flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Define New Route
        </button>
      </div>

      <div className="space-y-4">
        {routes.map((r) => (
          <div key={r._id} className="bg-white border border-amber-200/80 rounded-3xl p-5 space-y-3 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-100 pb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-amber-800 font-mono">{r.routeCode}</span>
                <h3 className="text-lg font-extrabold text-slate-900">{r.routeName}</h3>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-3 text-xs text-slate-600 font-bold">
                  <span>Dist: <strong className="text-slate-900">{r.totalDistance}</strong></span>
                  <span>Est: <strong className="text-emerald-700">{r.estimatedDuration}</strong></span>
                </div>
                <button
                  onClick={() => handleEditClick(r)}
                  className="px-3 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Edit3 className="w-3.5 h-3.5 text-amber-800" />
                  <span>Edit Route</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-700 font-bold">
              <Navigation className="w-4 h-4 text-amber-600 shrink-0" />
              <span><strong>{r.startPoint}</strong> ➔ <strong>{r.endPoint}</strong></span>
            </div>

            {r.stops && r.stops.length > 0 && (
              <div className="pt-2 flex flex-wrap gap-2">
                {r.stops.map((st, i) => (
                  <span key={i} className="text-[11px] px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 font-bold">
                    📍 {st.name} (+{st.estimatedMinutesFromStart}m)
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-lg bg-white border border-amber-200 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-2 rounded-full cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-extrabold text-slate-900">
              {editingRoute ? `Edit Route: ${editingRoute.routeCode}` : 'Define New Transit Route'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Route Name</label>
                <input
                  type="text"
                  value={routeName}
                  onChange={(e) => setRouteName(e.target.value)}
                  placeholder="Start - RCET"
                  className="w-full px-3.5 py-2.5 bg-amber-50/40 border border-amber-200 rounded-xl text-slate-900 text-sm font-semibold focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Route Code</label>
                  <input
                    type="text"
                    value={routeCode}
                    onChange={(e) => setRouteCode(e.target.value)}
                    placeholder="e.g. R-01A-RCET"
                    className="w-full px-3.5 py-2.5 bg-amber-50/40 border border-amber-200 rounded-xl text-slate-900 text-sm font-semibold focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Est. Duration</label>
                  <input
                    type="text"
                    value={estimatedDuration}
                    onChange={(e) => setEstimatedDuration(e.target.value)}
                    placeholder="e.g. 50 mins"
                    className="w-full px-3.5 py-2.5 bg-amber-50/40 border border-amber-200 rounded-xl text-slate-900 text-sm font-semibold focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Start Terminal</label>
                  <input
                    type="text"
                    value={startPoint}
                    onChange={(e) => setStartPoint(e.target.value)}
                    placeholder="e.g. Start Place"
                    className="w-full px-3.5 py-2.5 bg-amber-50/40 border border-amber-200 rounded-xl text-slate-900 text-sm font-semibold focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">End Destination</label>
                  <input
                    type="text"
                    value={endPoint}
                    onChange={(e) => setEndPoint(e.target.value)}
                    placeholder="e.g. Rohini College Campus (RCET)"
                    className="w-full px-3.5 py-2.5 bg-amber-50/40 border border-amber-200 rounded-xl text-slate-900 text-sm font-semibold focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Stops (Comma Separated)
                </label>
                <textarea
                  value={stopsInput}
                  onChange={(e) => setStopsInput(e.target.value)}
                  placeholder="Place1, Place2,...., Rohini College Campus (RCET)"
                  rows={3}
                  className="w-full px-3.5 py-2.5 bg-amber-50/40 border border-amber-200 rounded-xl text-slate-900 text-sm font-semibold focus:outline-none focus:border-amber-500"
                />
                <p className="text-[10px] text-slate-500 font-medium mt-1">
                  Separate stop names with commas in sequential order from start to end.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-amber-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-amber-50 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold shadow-md shadow-amber-500/20 cursor-pointer"
                >
                  {editingRoute ? 'Save Changes' : 'Create Route'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRoutes;
