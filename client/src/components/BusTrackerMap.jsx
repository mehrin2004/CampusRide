import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Navigation, Compass, MapPin, Route, Clock, ShieldCheck, Activity } from 'lucide-react';
import { routeAPI } from '../services/api';
import { getSyncRoadGeometry, getRoadGeometry } from '../utils/routeGeometry';

// Fix default leaflet marker icons path issues in Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Calculate distance between two coordinates in KM
const getDistanceKm = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Custom Trackin Bus Icon
const createBusIcon = (status, busNumber, heading = 0) => {
  let color = '#059669'; // Green on-route
  if (status === 'delayed') color = '#d97706'; // Amber delayed
  if (status === 'breakdown') color = '#dc2626'; // Red breakdown

  const svgIcon = `
    <div style="transform: rotate(${heading}deg); transition: transform 0.6s ease-out;">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="46" height="46">
        <circle cx="24" cy="24" r="22" fill="${color}" fill-opacity="0.25" stroke="${color}" stroke-width="3"/>
        <rect x="14" y="12" width="20" height="24" rx="5" fill="${color}"/>
        <rect x="16" y="14" width="16" height="8" rx="2" fill="#ffffff"/>
        <circle cx="18" cy="28" r="2.5" fill="#ffffff"/>
        <circle cx="30" cy="28" r="2.5" fill="#ffffff"/>
        <polygon points="24,5 29,11 19,11" fill="${color}" />
        <text x="24" y="42" font-size="9" font-weight="900" fill="${color}" text-anchor="middle" font-family="sans-serif">${busNumber || 'BUS'}</text>
      </svg>
    </div>
  `;

  return L.divIcon({
    html: svgIcon,
    className: 'trackin-bus-marker',
    iconSize: [46, 46],
    iconAnchor: [23, 23],
  });
};

// Sleek stop dot marker - ABSOLUTELY NO 1, 2, 3 numbers
const createStopIcon = (isCollege = false, dotColor = '#d97706') => {
  const svgStop = isCollege ? `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="30" height="30">
      <circle cx="16" cy="16" r="14" fill="#2563eb" stroke="#ffffff" stroke-width="3"/>
      <circle cx="16" cy="16" r="6" fill="#ffffff"/>
    </svg>
  ` : `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18">
      <circle cx="12" cy="12" r="7" fill="${dotColor}" stroke="#ffffff" stroke-width="2.5"/>
    </svg>
  `;

  return L.divIcon({
    html: svgStop,
    className: 'trackin-clean-dot-marker',
    iconSize: isCollege ? [30, 30] : [18, 18],
    iconAnchor: isCollege ? [15, 15] : [9, 9],
  });
};

const RecenterMap = ({ center, zoom = 12, targetId }) => {
  const map = useMap();
  const lastTargetRef = React.useRef(null);
  
  useEffect(() => {
    if (center && center[0] && center[1]) {
      // Re-center if the target changed (e.g. switched from all to 14A, or 14A to 43C)
      if (lastTargetRef.current !== targetId) {
        lastTargetRef.current = targetId;
        map.flyTo(center, zoom, { duration: 1.0 });
      }
    }
  }, [center, zoom, targetId, map]);
  return null;
};

// Route Themes for distinct multi-corridor visualization on Admin Dashboard
const ROUTE_THEMES = {
  '14A': {
    name: 'Route 14A (Vadukatchimathil ➔ RCET)',
    glowColor: '#10b981', // Emerald Green
    coreColor: '#059669',
    stopDotColor: '#10b981',
    badgeText: 'text-emerald-400',
    badgeBorder: 'border-emerald-500/40',
    badgeBg: 'bg-emerald-500/20'
  },
  '32C': {
    name: 'Route 32C (Parappadi ➔ RCET)',
    glowColor: '#06b6d4', // Cyan / Teal
    coreColor: '#0891b2',
    stopDotColor: '#06b6d4',
    badgeText: 'text-cyan-400',
    badgeBorder: 'border-cyan-500/40',
    badgeBg: 'bg-cyan-500/20'
  },
  '43C': {
    name: 'Route 43C (Tirunelveli Town ➔ RCET)',
    glowColor: '#a855f7', // Purple / Violet
    coreColor: '#9333ea',
    stopDotColor: '#a855f7',
    badgeText: 'text-purple-400',
    badgeBorder: 'border-purple-500/40',
    badgeBg: 'bg-purple-500/20'
  },
  'DEFAULT': {
    name: 'Campus Transit Corridor',
    glowColor: '#f59e0b', // Amber
    coreColor: '#d97706',
    stopDotColor: '#f59e0b',
    badgeText: 'text-amber-400',
    badgeBorder: 'border-amber-500/40',
    badgeBg: 'bg-amber-500/20'
  }
};

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

const DEFAULT_GENERIC_STOPS = [
  { name: 'Vallioor Junction', lat: 8.3792, lng: 77.6144, estimatedMinutesFromStart: 0 },
  { name: 'Therku Vallioor', lat: 8.3510, lng: 77.6080, estimatedMinutesFromStart: 8 },
  { name: 'Panagudi', lat: 8.3228, lng: 77.5819, estimatedMinutesFromStart: 18 },
  { name: 'Kalanthapani', lat: 8.2840, lng: 77.5750, estimatedMinutesFromStart: 28 },
  { name: 'Rohini College Campus (RCET)', lat: 8.1685, lng: 77.5362, estimatedMinutesFromStart: 45, isCollege: true }
];

// Helper to resolve stops for any bus
const resolveStopsForBus = (bus, effectiveRoutes = []) => {
  const bNum = String(bus?.busNumber || '').toUpperCase().trim();
  const rName = String(bus?.routeName || '').toUpperCase().trim();

  // 1. Strict priority for known campus bus routes: 14A, 43C, 32C
  if (bNum.includes('14A') || rName.includes('14A') || rName.includes('VADUKATCHI')) {
    return DEFAULT_14A_STOPS;
  }
  if (bNum.includes('43C') || rName.includes('43C') || rName.includes('TOWN') || rName.includes('TIRUNELVELI')) {
    return DEFAULT_43C_STOPS;
  }
  if (bNum.includes('32C') || rName.includes('32C') || rName.includes('PARAPPADI')) {
    return DEFAULT_32C_STOPS;
  }

  // 2. For newly added buses or custom routes: Check populated route on bus
  let stops = [];
  if (bus?.route?.stops && Array.isArray(bus.route.stops) && bus.route.stops.length > 1) {
    stops = bus.route.stops;
  }
  // 3. Match with effectiveRoutes list by ID or name
  else if (effectiveRoutes && effectiveRoutes.length > 0) {
    const routeId = typeof bus?.route === 'object' ? bus.route?._id : bus?.route;
    const matchedRoute = effectiveRoutes.find(r => 
      (routeId && r._id === routeId) ||
      (bus?.routeName && (r.routeName === bus.routeName || r.routeCode === bus.routeName))
    );
    if (matchedRoute?.stops && matchedRoute.stops.length > 1) {
      stops = matchedRoute.stops;
    }
  }

  // 4. Default guaranteed valid route for ANY newly added bus
  if (!stops || stops.length < 2) {
    stops = DEFAULT_GENERIC_STOPS;
  }

  // Guarantee that Rohini College Campus (RCET) is the terminal stop
  const lastStop = stops[stops.length - 1];
  const lastStopName = (lastStop?.name || '').toLowerCase();
  if (!lastStopName.includes('college') && !lastStopName.includes('rcet') && !lastStopName.includes('rohini')) {
    stops = [...stops, { name: 'Rohini College Campus (RCET)', lat: 8.1685, lng: 77.5362, estimatedMinutesFromStart: 50, isCollege: true }];
  }

  return stops;
};

const BusTrackerMap = ({ 
  buses = [], 
  selectedBus = null, 
  showAllRoutes = false,
  onSelectBus = null,
  height = '540px', 
  direction = 'forward', 
  routes = [] 
}) => {
  const [internalRoutes, setInternalRoutes] = useState([]);
  const [roadGeometry, setRoadGeometry] = useState(null); // { key: string, coords: number[][] }
  const [isLoadingRoad, setIsLoadingRoad] = useState(false);

  // If routes are not passed by the parent component, load them automatically
  useEffect(() => {
    if (routes && routes.length > 0) return;
    routeAPI.getAll()
      .then(res => setInternalRoutes(res.data?.data || []))
      .catch(err => console.warn('Could not load routes in BusTrackerMap:', err));
  }, [routes]);

  const effectiveRoutes = (routes && routes.length > 0) ? routes : internalRoutes;

  // Active bus: if selectedBus is passed, focus on it; if showAllRoutes is true and no selectedBus, activeBus is null
  const activeBus = selectedBus || (!showAllRoutes && buses.length > 0 ? buses[0] : null);

  const isReturn = direction === 'return';

  // Compute multi-corridor route polylines for all buses
  const allRoutesData = React.useMemo(() => {
    const busList = (buses && buses.length > 0)
      ? buses
      : [{ busNumber: '14A' }, { busNumber: '32C' }, { busNumber: '43C' }];

    const seenKeys = new Set();
    const list = [];

    busList.forEach(bus => {
      const bNum = String(bus?.busNumber || '').toUpperCase().trim();
      const rKey = bNum.includes('14A') ? '14A' : (bNum.includes('32C') ? '32C' : (bNum.includes('43C') ? '43C' : bNum));
      
      if (seenKeys.has(rKey)) return;
      seenKeys.add(rKey);

      const rawStops = resolveStopsForBus(bus, effectiveRoutes);
      const stops = isReturn ? [...rawStops].reverse() : rawStops;
      const straightLines = stops.map(s => [Number(s.lat), Number(s.lng)]).filter(p => !isNaN(p[0]) && !isNaN(p[1]));
      const syncGeom = getSyncRoadGeometry(stops, bNum, direction);
      const polyline = (syncGeom && syncGeom.length > 1) ? syncGeom : straightLines;
      const theme = ROUTE_THEMES[rKey] || ROUTE_THEMES['DEFAULT'];

      list.push({
        key: rKey,
        bus,
        busNumber: bNum,
        stops,
        polyline,
        theme
      });
    });

    return list;
  }, [buses, effectiveRoutes, isReturn, direction]);

  // Stops to display: If single bus active, show that bus's stops; if showAllRoutes, show deduplicated stops across all corridors
  const displayStopsList = React.useMemo(() => {
    if (activeBus && !showAllRoutes) {
      const raw = resolveStopsForBus(activeBus, effectiveRoutes);
      return isReturn ? [...raw].reverse() : raw;
    }

    const stopsMap = new Map();
    allRoutesData.forEach(r => {
      r.stops.forEach(s => {
        const coordKey = `${Number(s.lat).toFixed(4)},${Number(s.lng).toFixed(4)}`;
        if (!stopsMap.has(coordKey)) {
          stopsMap.set(coordKey, {
            ...s,
            routeKey: r.key,
            themeColor: r.theme.stopDotColor
          });
        }
      });
    });

    return Array.from(stopsMap.values());
  }, [activeBus, showAllRoutes, allRoutesData, effectiveRoutes, isReturn]);

  // Fleet geometric midpoint for Master Overview (encompasses Tirunelveli, Nanguneri, Panagudi, RCET)
  const fleetCenter = [8.4500, 77.6200];
  
  const mapCenter = activeBus && activeBus.currentLocation && activeBus.currentLocation.lat
    ? [Number(activeBus.currentLocation.lat), Number(activeBus.currentLocation.lng)] 
    : (showAllRoutes ? fleetCenter : [Number(displayStopsList[0]?.lat) || 8.1685, Number(displayStopsList[0]?.lng) || 77.5362]);

  const mapZoom = activeBus ? 13 : (showAllRoutes ? 10 : 12);
  const targetId = activeBus ? (activeBus._id || activeBus.busNumber) : 'all';

  // For active single bus polyline caching & snapping
  const stopsKey = displayStopsList.map(s => `${Number(s.lat).toFixed(4)},${Number(s.lng).toFixed(4)}`).join(';');
  const busKey = activeBus?.busNumber || activeBus?.routeName || '';
  const currentGeomKey = `${busKey}_${stopsKey}_${direction}`;
  const syncRoadGeom = activeBus ? getSyncRoadGeometry(displayStopsList, busKey, direction) : null;

  const activePolyline = (syncRoadGeom && syncRoadGeom.length > 1)
    ? syncRoadGeom
    : (roadGeometry && roadGeometry.key === currentGeomKey && roadGeometry.coords?.length > 1
        ? roadGeometry.coords
        : displayStopsList.map(s => [Number(s.lat), Number(s.lng)]).filter(p => !isNaN(p[0]) && !isNaN(p[1])));

  useEffect(() => {
    if (!activeBus) return;
    let isCancelled = false;

    const immediate = getSyncRoadGeometry(displayStopsList, busKey, direction);
    if (immediate && immediate.length > 1) {
      setRoadGeometry({ key: currentGeomKey, coords: immediate });
      setIsLoadingRoad(false);
      return;
    }

    setIsLoadingRoad(true);
    getRoadGeometry(displayStopsList, busKey, direction)
      .then((coords) => {
        if (!isCancelled && coords && coords.length > 1) {
          setRoadGeometry({ key: currentGeomKey, coords });
        }
      })
      .catch((err) => {
        console.warn('Road geometry fetch error, keeping default route line:', err);
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoadingRoad(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [direction, busKey, stopsKey, currentGeomKey, activeBus]);

  // Real-time Dynamic Next Stop & Progress calculation for active single bus
  const activeStops = activeBus ? resolveStopsForBus(activeBus, effectiveRoutes) : (allRoutesData[0]?.stops || DEFAULT_14A_STOPS);
  const activeDisplayStops = isReturn ? [...activeStops].reverse() : activeStops;
  const busLat = activeBus?.currentLocation?.lat || activeDisplayStops[0]?.lat;
  const busLng = activeBus?.currentLocation?.lng || activeDisplayStops[0]?.lng;

  let closestStopIndex = 0;
  let minDistance = 99999;

  activeDisplayStops.forEach((stop, index) => {
    const dist = getDistanceKm(busLat, busLng, stop.lat, stop.lng);
    if (dist < minDistance) {
      minDistance = dist;
      closestStopIndex = index;
    }
  });

  const nextStopIndex = Math.min(activeDisplayStops.length - 1, closestStopIndex + (minDistance < 0.5 ? 1 : 0));
  const dynamicNextStop = activeDisplayStops[nextStopIndex]?.name || activeDisplayStops[activeDisplayStops.length - 1]?.name || 'Rohini College';
  const nextStopDistKm = getDistanceKm(busLat, busLng, activeDisplayStops[nextStopIndex]?.lat, activeDisplayStops[nextStopIndex]?.lng).toFixed(1);

  const totalRouteDistKm = getDistanceKm(activeDisplayStops[0]?.lat, activeDisplayStops[0]?.lng, activeDisplayStops[activeDisplayStops.length - 1]?.lat, activeDisplayStops[activeDisplayStops.length - 1]?.lng) || 35;
  const coveredDistKm = getDistanceKm(activeDisplayStops[0]?.lat, activeDisplayStops[0]?.lng, busLat, busLng);
  const routeProgressPct = Math.min(100, Math.max(5, Math.round((coveredDistKm / totalRouteDistKm) * 100)));

  const originStop = activeDisplayStops[0]?.name || 'Origin';
  const destinationStop = activeDisplayStops[activeDisplayStops.length - 1]?.name || 'Rohini College Campus (RCET)';

  const activeTheme = activeBus ? (ROUTE_THEMES[activeBus.busNumber] || ROUTE_THEMES['DEFAULT']) : ROUTE_THEMES['DEFAULT'];

  return (
    <div className="relative w-full rounded-3xl overflow-hidden border border-slate-200 shadow-xl bg-slate-900 flex flex-col" style={{ height }}>
      
      {/* Top Trackin GPS Live Header */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-700 shadow-lg text-xs font-bold text-white">
        <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
        <span className="text-emerald-400 font-extrabold uppercase tracking-wider flex items-center gap-1.5">
          <Activity className="w-4 h-4 text-emerald-400" /> TRACKIN GPS LIVE TRACKER
        </span>
        {activeBus ? (
          <span className="text-slate-300 border-l border-slate-700 pl-2">
            BUS <span className="text-amber-400 font-extrabold">{activeBus.busNumber}</span>
          </span>
        ) : (
          <span className="text-slate-300 border-l border-slate-700 pl-2">
            FLEET <span className="text-amber-400 font-extrabold">ALL ROUTES ({allRoutesData.length} CORRIDORS)</span>
          </span>
        )}
      </div>

      {/* Leaflet Map View */}
      <div className="flex-1 w-full h-full relative">
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; Trackin GPS | OpenStreetMap'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <RecenterMap center={mapCenter} zoom={mapZoom} targetId={targetId} />

          {/* Render Route Navigation Polylines */}
          {showAllRoutes ? (
            /* MULTI-ROUTE FLEET MODE: Renders all bus corridors simultaneously */
            allRoutesData.map((routeItem) => {
              const isFocused = !activeBus || (activeBus.busNumber && activeBus.busNumber.includes(routeItem.key));
              const glowWeight = isFocused ? 8 : 4;
              const coreWeight = isFocused ? 4 : 2;
              const glowOpacity = isFocused ? 0.4 : 0.15;
              const coreOpacity = isFocused ? 0.95 : 0.45;

              return (
                <React.Fragment key={`corridor-${routeItem.key}-${direction}`}>
                  {/* Outer soft corridor glow */}
                  <Polyline
                    positions={routeItem.polyline}
                    color={routeItem.theme.glowColor}
                    weight={glowWeight}
                    opacity={glowOpacity}
                    pathOptions={{
                      color: routeItem.theme.glowColor,
                      weight: glowWeight,
                      opacity: glowOpacity,
                      lineCap: 'round',
                      lineJoin: 'round'
                    }}
                  />
                  {/* Core solid road line */}
                  <Polyline
                    positions={routeItem.polyline}
                    color={routeItem.theme.coreColor}
                    weight={coreWeight}
                    opacity={coreOpacity}
                    pathOptions={{
                      color: routeItem.theme.coreColor,
                      weight: coreWeight,
                      opacity: coreOpacity,
                      lineCap: 'round',
                      lineJoin: 'round'
                    }}
                  />
                </React.Fragment>
              );
            })
          ) : (
            /* SINGLE-ROUTE MODE: Snapped road geometry for the selected bus */
            activePolyline && activePolyline.length > 1 && (
              <>
                <Polyline
                  key={`route-glow-${activeBus?.busNumber || 'bus'}-${direction}-${activePolyline.length}`}
                  positions={activePolyline}
                  color={activeTheme.glowColor}
                  weight={8}
                  opacity={0.35}
                  pathOptions={{
                    color: activeTheme.glowColor,
                    weight: 8,
                    opacity: 0.35,
                    lineCap: 'round',
                    lineJoin: 'round'
                  }}
                />
                <Polyline
                  key={`route-core-${activeBus?.busNumber || 'bus'}-${direction}-${activePolyline.length}`}
                  positions={activePolyline}
                  color={activeTheme.coreColor}
                  weight={4}
                  opacity={0.95}
                  pathOptions={{
                    color: activeTheme.coreColor,
                    weight: 4,
                    opacity: 0.95,
                    lineCap: 'round',
                    lineJoin: 'round'
                  }}
                />
              </>
            )
          )}

          {/* Render Route Clean Dot Markers (NO 1,2,3 numbers) */}
          {displayStopsList.map((stop, idx) => {
            const isCollege = stop.isCollege || stop.name?.toLowerCase().includes('rcet') || stop.name?.toLowerCase().includes('college');
            return (
              <Marker
                key={`stop-${stop.routeKey || 'r'}-${idx}`}
                position={[stop.lat, stop.lng]}
                icon={createStopIcon(isCollege, stop.themeColor || activeTheme.stopDotColor)}
              >
                <Popup>
                  <div className="p-1 text-slate-900">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 block">
                      {isCollege ? '🏫 ROHINI COLLEGE CAMPUS' : `BUS STOP ${stop.routeKey ? `• BUS ${stop.routeKey}` : ''}`}
                    </span>
                    <h4 className="font-extrabold text-sm text-slate-900">{stop.name}</h4>
                    <p className="text-xs text-slate-600 mt-0.5">Est: +{stop.estimatedMinutesFromStart || 0} mins</p>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Render Bus Markers for the fleet */}
          {buses.map((bus) => {
            if (!bus.currentLocation || !bus.currentLocation.lat) return null;
            const heading = bus.currentLocation.heading || 0;

            return (
              <Marker
                key={bus._id}
                position={[bus.currentLocation.lat, bus.currentLocation.lng]}
                icon={createBusIcon(bus.status, bus.busNumber, heading)}
              >
                <Popup>
                  <div className="p-1.5 text-slate-900 min-w-[160px]">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-extrabold text-sm text-emerald-700">BUS {bus.busNumber}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded font-extrabold uppercase bg-emerald-100 text-emerald-800">
                        {bus.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mb-1">Plate: <strong>{bus.plateNumber}</strong></p>
                    <p className="text-xs text-slate-600 mb-1">Driver: <strong>{bus.driverName || 'Bus Captain'}</strong></p>
                    <p className="text-xs text-emerald-800 font-extrabold mt-1">⚡ ETA: {bus.estimatedArrival || 'On Time'}</p>
                    {onSelectBus && (
                      <button
                        onClick={() => onSelectBus(bus)}
                        className="mt-2 w-full py-1.5 px-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-[10px] transition cursor-pointer flex items-center justify-center gap-1"
                      >
                        <span>Focus Bus {bus.busNumber} Navigation ➔</span>
                      </button>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* Dynamic Real-Time Bottom Bar */}
      {activeBus ? (
        /* SINGLE BUS VIEW: Detailed live telemetry & trip progress */
        <div className="z-20 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 p-4 text-white space-y-3">
          
          {/* Top Info Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl ${activeTheme.badgeBg} border ${activeTheme.badgeBorder} flex items-center justify-center font-black ${activeTheme.badgeText} text-base shadow-sm`}>
                {activeBus.busNumber}
              </div>
              <div>
                <h4 className="font-black text-sm text-white flex items-center gap-2">
                  <span>Bus {activeBus.busNumber}</span>
                  <span className={`text-[10px] ${activeTheme.badgeBg} ${activeTheme.badgeText} border ${activeTheme.badgeBorder} px-2 py-0.5 rounded-full font-bold uppercase`}>
                    {activeBus.status === 'on_route' ? 'MOVING ON ROUTE' : activeBus.status.toUpperCase()}
                  </span>
                </h4>
                <p className="text-[11px] text-slate-400 font-medium line-clamp-1">
                  {originStop} ➔ {destinationStop}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">LIVE SPEED</span>
                <span className="text-base font-black text-amber-400">{activeBus.currentLocation?.speed || 0} km/h</span>
              </div>
              {showAllRoutes && onSelectBus && (
                <button
                  onClick={() => onSelectBus(null)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold border border-slate-700 transition cursor-pointer"
                >
                  ✕ View All Routes
                </button>
              )}
            </div>
          </div>

          {/* Dynamic Route Progress Bar */}
          <div className="space-y-1.5 pt-1 border-t border-slate-800">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
              <span className="flex items-center gap-1 text-slate-400">
                <MapPin className="w-3.5 h-3.5 text-amber-400" /> Start: {originStop}
              </span>
              <span className="flex items-center gap-1 text-blue-400 font-extrabold">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" /> {destinationStop} ({routeProgressPct}% Completed)
              </span>
            </div>

            {/* Dynamic Progress Fill */}
            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-blue-500 rounded-full transition-all duration-700 animate-pulse"
                style={{ width: `${routeProgressPct}%` }}
              ></div>
            </div>
          </div>

          {/* Real-time Dynamic Next Stop & Destination ETA Row */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="bg-slate-800/80 p-2.5 rounded-2xl border border-slate-700/80 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div className="overflow-hidden">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">UPCOMING STOP</span>
                <span className="text-xs font-black text-white truncate block">{dynamicNextStop} ({nextStopDistKm} km)</span>
              </div>
            </div>

            <div className="bg-slate-800/80 p-2.5 rounded-2xl border border-slate-700/80 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                <Navigation className="w-4 h-4" />
              </div>
              <div className="overflow-hidden">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">DESTINATION ETA</span>
                <span className="text-xs font-black text-emerald-400 truncate block">{activeBus.estimatedArrival || 'On Schedule'}</span>
              </div>
            </div>
          </div>

        </div>
      ) : showAllRoutes ? (
        /* MULTI-ROUTE FLEET OVERVIEW BAR: Quick access to each corridor */
        <div className="z-20 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 p-4 text-white space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-xs font-black uppercase tracking-wider text-slate-200">
                ROHINI CAMPUS TRANSIT NETWORK • ALL CORRIDORS ACTIVE
              </span>
            </div>
            <span className="text-xs text-slate-400 font-bold">
              {allRoutesData.length} Routes • Click any corridor below to focus
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            {allRoutesData.map((r) => {
              const busMatch = buses.find(b => (b.busNumber || '').toUpperCase().includes(r.key));
              const speed = busMatch?.currentLocation?.speed || 0;
              const status = busMatch?.status || 'on_route';

              return (
                <button
                  key={r.key}
                  onClick={() => onSelectBus && onSelectBus(busMatch || r.bus)}
                  className={`p-2.5 rounded-2xl bg-slate-800/90 hover:bg-slate-800 border ${r.theme.badgeBorder} flex items-center justify-between gap-2 text-left transition cursor-pointer group shadow-sm`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-8 h-8 rounded-xl ${r.theme.badgeBg} border ${r.theme.badgeBorder} flex items-center justify-center font-black ${r.theme.badgeText} text-xs shrink-0 group-hover:scale-105 transition`}>
                      {r.key}
                    </div>
                    <div className="min-w-0">
                      <span className="font-extrabold text-xs text-white block truncate">{r.theme.name}</span>
                      <span className="text-[10px] text-slate-400 font-medium block truncate">
                        {status === 'on_route' ? '⚡ Active on Route' : status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-black text-amber-400">{speed} km/h</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default BusTrackerMap;
