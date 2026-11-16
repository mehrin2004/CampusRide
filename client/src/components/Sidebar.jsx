import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Bus, 
  MapPin, 
  AlertTriangle, 
  Megaphone, 
  Users, 
  Wrench,
  PackageSearch,
  Camera
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { playAppChime } from '../utils/audio';

import Logo from './Logo';

const Sidebar = () => {
  const { user } = useAuth();
  if (!user) return null;

  const role = user.role;

  const studentLinks = [
    { to: '/student', label: 'Student Dashboard', icon: LayoutDashboard },
    { to: '/student/complaints', label: 'Transport Complaints', icon: AlertTriangle },
    { to: '/student/announcements', label: 'Announcements', icon: Megaphone }
  ];

  const driverLinks = [
    { to: '/driver', label: 'Driver Control Room', icon: LayoutDashboard },
    { to: '/driver/complaints', label: 'Report Vehicle Problem', icon: Wrench },
  ];

  const adminLinks = [
    { to: '/admin', label: 'Fleet Overview', icon: LayoutDashboard },
    { to: '/admin/complaints', label: 'Complaint Solver Desk', icon: AlertTriangle },
    { to: '/admin/buses', label: 'Manage Buses', icon: Bus },
    { to: '/admin/routes', label: 'Manage Routes', icon: MapPin },
    { to: '/admin/announcements', label: 'Broadcast Center', icon: Megaphone },
    { to: '/admin/users', label: 'User Directory', icon: Users }
  ];

  const links = role === 'admin' ? adminLinks : role === 'driver' ? driverLinks : studentLinks;

  return (
    <aside className="w-full md:w-64 bg-white/90 border-b md:border-b-0 md:border-r border-amber-200/80 p-4 shrink-0 shadow-sm">
      
      {/* Sidebar Top Brand Header */}
      <div className="mb-5 px-2 pb-4 border-b border-amber-100 hidden md:block">
        <Logo size="sm" subtext="Fleet Module" />
        <div className="mt-3 p-2.5 bg-amber-50/80 rounded-2xl border border-amber-200/60">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-800 block">
            {role.toUpperCase()} PORTAL
          </span>
          <h3 className="text-xs font-extrabold text-slate-900 truncate mt-0.5">{user.name}</h3>
        </div>
      </div>

      <nav className="flex md:flex-col gap-1.5 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === `/${role}`}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-extrabold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-amber-50'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              <span>{link.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
