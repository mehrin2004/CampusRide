import React, { useState, useEffect } from 'react';
import { Bus, Plus, Edit, X } from 'lucide-react';
import { busAPI, authAPI, routeAPI } from '../../services/api';
import StatusBadge from '../../components/StatusBadge';

const AdminBuses = () => {
  const [buses, setBuses] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBus, setEditingBus] = useState(null);

  const [busNumber, setBusNumber] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [capacity, setCapacity] = useState(50);
  const [selectedDriver, setSelectedDriver] = useState('');
  const [customDriverName, setCustomDriverName] = useState('');
  const [selectedRoute, setSelectedRoute] = useState('');
  const [customRouteName, setCustomRouteName] = useState('');
  const [fuelLevel, setFuelLevel] = useState(90);

  const fetchData = async () => {
    try {
      const [busRes, userRes, routeRes] = await Promise.all([
        busAPI.getAll(),
        authAPI.getUsers(),
        routeAPI.getAll()
      ]);

      setBuses(busRes.data.data || []);
      setDrivers((userRes.data.data || []).filter(u => u.role === 'driver'));
      setRoutes(routeRes.data.data || []);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAdd = () => {
    setEditingBus(null);
    setBusNumber('');
    setPlateNumber('');
    setCapacity(50);
    setSelectedDriver('');
    setCustomDriverName('');
    setSelectedRoute('');
    setCustomRouteName('');
    setFuelLevel(90);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (bus) => {
    setEditingBus(bus);
    setBusNumber(bus.busNumber);
    setPlateNumber(bus.plateNumber);
    setCapacity(bus.capacity);
    setSelectedDriver(bus.driver?._id || '');
    setCustomDriverName(bus.driverName || bus.driver?.name || '');
    setSelectedRoute(bus.route?._id || '');
    setCustomRouteName(bus.routeName || bus.route?.routeName || '');
    setFuelLevel(bus.fuelLevel || 90);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const selectedDriverObj = drivers.find(d => d._id === selectedDriver);
      const selectedRouteObj = routes.find(r => r._id === selectedRoute);

      const payload = {
        busNumber,
        plateNumber,
        capacity,
        driver: selectedDriver || null,
        driverName: customDriverName || (selectedDriverObj ? selectedDriverObj.name : ''),
        route: selectedRoute || null,
        routeName: customRouteName || (selectedRouteObj ? selectedRouteObj.routeName : ''),
        fuelLevel
      };

      if (editingBus) {
        await busAPI.update(editingBus._id, payload);
      } else {
        await busAPI.create(payload);
      }

      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving bus');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-6 rounded-3xl border border-amber-200/80 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Bus className="w-6 h-6 text-amber-600" />
            Manage Rohini Campus Buses
          </h1>
          <p className="text-xs text-slate-600 font-medium mt-1">
            Add buses, assign lead drivers, and link campus transit routes.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold shadow-md shadow-amber-500/20 transition flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add New Bus
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {buses.map((bus) => (
          <div key={bus._id} className="bg-white border border-amber-200/80 rounded-3xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-amber-100 pb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-slate-500">BUS NUMBER</span>
                <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <Bus className="w-4 h-4 text-amber-600" />
                  {bus.busNumber}
                </h3>
              </div>
              <StatusBadge status={bus.status} type="bus" />
            </div>

            <div className="space-y-2 text-xs font-medium">
              <div className="flex justify-between">
                <span className="text-slate-500">Plate Number:</span>
                <span className="font-mono font-extrabold text-slate-900">{bus.plateNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Seating Capacity:</span>
                <span className="font-bold text-slate-900">{bus.capacity} Seats</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Assigned Driver:</span>
                <span className="font-bold text-amber-800">{bus.driverName || bus.driver?.name || 'Unassigned'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Transit Route:</span>
                <span className="font-bold text-emerald-800">{bus.routeName || bus.route?.routeName || 'Unassigned'}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-amber-100 flex justify-end">
              <button
                onClick={() => handleOpenEdit(bus)}
                className="px-3.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-xs font-bold text-amber-900 border border-amber-200 transition flex items-center gap-1.5 cursor-pointer"
              >
                <Edit className="w-3.5 h-3.5" />
                Edit / Assign
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Bus Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md bg-white border border-amber-200 rounded-3xl p-6 shadow-2xl">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-2 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-extrabold text-slate-900 mb-4">
              {editingBus ? 'Edit Bus Assignment' : 'Add New Campus Bus'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Bus Number</label>
                <input
                  type="text"
                  value={busNumber}
                  onChange={(e) => setBusNumber(e.target.value)}
                  placeholder="e.g. RCET-BUS-10"
                  className="w-full px-3.5 py-2 bg-amber-50/40 border border-amber-200 rounded-xl text-slate-900 text-sm font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Plate Number</label>
                <input
                  type="text"
                  value={plateNumber}
                  onChange={(e) => setPlateNumber(e.target.value)}
                  placeholder="e.g. TN-74-N-2026"
                  className="w-full px-3.5 py-2 bg-amber-50/40 border border-amber-200 rounded-xl text-slate-900 text-sm font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Capacity</label>
                <input
                  type="number"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  className="w-full px-3.5 py-2 bg-amber-50/40 border border-amber-200 rounded-xl text-slate-900 text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Assigned Driver's Name (Fill Direct Name)
                </label>
                <input
                  type="text"
                  value={customDriverName}
                  onChange={(e) => setCustomDriverName(e.target.value)}
                  placeholder="e.g. Captain M. Murugan"
                  className="w-full px-3.5 py-2 mb-2 bg-amber-50/40 border border-amber-300 rounded-xl text-slate-900 text-sm font-bold"
                />
                <span className="text-[11px] text-slate-500 font-bold block mb-1">Or Select from Registered Driver Accounts:</span>
                <select
                  value={selectedDriver}
                  onChange={(e) => {
                    setSelectedDriver(e.target.value);
                    const selectedObj = drivers.find(d => d._id === e.target.value);
                    if (selectedObj) setCustomDriverName(selectedObj.name);
                  }}
                  className="w-full px-3.5 py-2 bg-amber-50/40 border border-amber-200 rounded-xl text-slate-900 text-xs font-semibold"
                >
                  <option value="">Unassigned</option>
                  {drivers.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name} ({d.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Assign Transit Route
                </label>
                <select
                  value={selectedRoute}
                  onChange={(e) => {
                    setSelectedRoute(e.target.value);
                    const rObj = routes.find(r => r._id === e.target.value);
                    if (rObj) setCustomRouteName(rObj.routeName);
                  }}
                  className="w-full px-3.5 py-2 mb-2 bg-amber-50/40 border border-amber-200 rounded-xl text-slate-900 text-xs font-semibold"
                >
                  <option value="">-- Select Registered Route --</option>
                  {routes.map((r) => (
                    <option key={r._id} value={r._id}>
                      {r.routeName} ({r.startPoint} ➔ {r.endPoint})
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-slate-500 font-bold block mb-1">Or Type Custom Route Name:</span>
                <input
                  type="text"
                  value={customRouteName}
                  onChange={(e) => setCustomRouteName(e.target.value)}
                  placeholder="e.g. Start-Destination"
                  className="w-full px-3.5 py-2 bg-amber-50/40 border border-amber-200 rounded-xl text-slate-900 text-sm font-semibold"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-amber-50 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold shadow-md shadow-amber-500/20 cursor-pointer"
                >
                  Save Bus
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBuses;
