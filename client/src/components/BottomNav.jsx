import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Bus, 
  ShieldAlert, 
  Megaphone, 
  PackageSearch, 
  Camera, 
  Users, 
  Route as RouteIcon,
  LayoutDashboard
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { playAppChime } from '../utils/audio';

/**
 * App Mobile Bottom Navigation Bar
 * Gives CampusRide a modern mobile native app navigation experience.
 */
const BottomNav = () => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const handleNavClick = () => {
    playAppChime();
  };

  const studentNavItems = [
    { label: 'Tracker', path: '/student', icon: Bus },
    { label: 'Issues', path: '/student/complaints', icon: ShieldAlert },
    { label: 'Notices', path: '/student/announcements', icon: Megaphone }
  ];

  const driverNavItems = [
    { label: 'Drive Desk', path: '/driver', icon: Bus },
    { label: 'Issues', path: '/driver/complaints', icon: ShieldAlert }
  ];

  const adminNavItems = [
    { label: 'Stats', path: '/admin', icon: LayoutDashboard },
    { label: 'Buses', path: '/admin/buses', icon: Bus },
    { label: 'Complaints', path: '/admin/complaints', icon: ShieldAlert },
    { label: 'Users', path: '/admin/users', icon: Users }
  ];

  let items = studentNavItems;
  if (user.role === 'driver') items = driverNavItems;
  if (user.role === 'admin') items = adminNavItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-amber-500/30 px-3 py-2 md:hidden shadow-2xl">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={handleNavClick}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center px-3 py-1.5 rounded-2xl transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 scale-105 font-extrabold shadow-md shadow-amber-500/30'
                    : 'text-slate-400 hover:text-amber-300 font-semibold'
                }`
              }
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
              <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
