import React, { useState, useEffect } from 'react';
import { Users, Mail, Phone, Star } from 'lucide-react';
import { authAPI } from '../../services/api';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [filterRole, setFilterRole] = useState('all');

  const fetchUsers = async () => {
    try {
      const res = await authAPI.getUsers();
      setUsers(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleLeadDriver = async (userId) => {
    try {
      await authAPI.toggleLeadDriver(userId);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating Lead Driver status');
    }
  };

  const staffUsers = users.filter(u => u.role !== 'student');

  const filteredUsers = filterRole === 'all' 
    ? staffUsers 
    : staffUsers.filter(u => u.role === filterRole);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-6 rounded-3xl border border-amber-200/80 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-amber-600" />
            Driver & Staff User Directory
          </h1>
          <p className="text-xs text-slate-600 font-medium mt-1">
            Registered Drivers and Transport Staff roster for Rohini College. Assign Lead Drivers from here.
          </p>
        </div>

        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="px-3.5 py-2 bg-amber-50/40 border border-amber-200 rounded-xl text-slate-900 text-xs font-bold"
        >
          <option value="all">All Drivers & Staff</option>
          <option value="driver">Drivers</option>
          <option value="admin">Admins</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUsers.map((u) => (
          <div key={u._id} className="bg-white border border-amber-200/80 rounded-3xl p-5 space-y-3 shadow-sm flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 font-extrabold flex items-center justify-center shadow-sm">
                    {u.name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">{u.name}</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`text-[10px] font-extrabold uppercase px-2 py-0.2 rounded border ${
                        u.role === 'admin' ? 'bg-purple-100 text-purple-800 border-purple-300' :
                        u.role === 'driver' ? 'bg-amber-100 text-amber-900 border-amber-300' :
                        'bg-emerald-100 text-emerald-800 border-emerald-300'
                      }`}>
                        {u.role}
                      </span>
                      {u.isLeadDriver && (
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.2 rounded bg-amber-500 text-slate-950 flex items-center gap-1 shadow-sm">
                          <Star className="w-3 h-3 fill-slate-950" />
                          LEAD DRIVER
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-1 text-xs text-slate-600 font-medium">
                <p className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {u.email}
                </p>
                {u.phone && (
                  <p className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {u.phone}
                  </p>
                )}
                {u.rollNumber && <p className="text-emerald-800 font-bold">Roll: {u.rollNumber}</p>}
                {u.licenseNumber && <p className="text-amber-800 font-bold">License: {u.licenseNumber}</p>}
                {u.assignedBus && <p className="text-amber-700 font-bold">Bus: {u.assignedBus.busNumber || 'Assigned'}</p>}
              </div>
            </div>

            {u.role === 'driver' && (
              <div className="pt-2 border-t border-amber-100">
                <button
                  onClick={() => handleToggleLeadDriver(u._id)}
                  className={`w-full py-1.5 px-3 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    u.isLeadDriver 
                      ? 'bg-amber-100 text-amber-950 hover:bg-amber-200 border border-amber-300' 
                      : 'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-sm'
                  }`}
                >
                  <Star className="w-3.5 h-3.5 fill-current" />
                  {u.isLeadDriver ? 'Demote from Lead Driver' : 'Assign as Lead Driver'}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminUsers;
