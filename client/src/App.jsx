import React, { Component } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ThemeProvider } from './context/ThemeContext';

import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';

import LandingPage from './pages/LandingPage';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

import StudentDashboard from './pages/student/StudentDashboard';
import StudentComplaints from './pages/student/StudentComplaints';
import StudentAnnouncements from './pages/student/StudentAnnouncements';

import DriverDashboard from './pages/driver/DriverDashboard';
import DriverComplaints from './pages/driver/DriverComplaints';

import AdminDashboard from './pages/admin/AdminDashboard';
import AdminComplaints from './pages/admin/AdminComplaints';
import AdminBuses from './pages/admin/AdminBuses';
import AdminRoutes from './pages/admin/AdminRoutes';
import AdminAnnouncements from './pages/admin/AdminAnnouncements';
import AdminUsers from './pages/admin/AdminUsers';

// Catch unexpected runtime UI errors gracefully
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("CampusRide UI Error Boundary Caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-amber-50 flex items-center justify-center p-6 text-center">
          <div className="max-w-md bg-white p-8 rounded-3xl border border-amber-200 shadow-xl space-y-4">
            <h2 className="text-xl font-extrabold text-slate-900">CampusRide UI Exception</h2>
            <p className="text-xs text-rose-600 font-semibold bg-rose-50 p-3 rounded-xl border border-rose-200">
              {this.state.error?.toString() || 'An unexpected error occurred while rendering.'}
            </p>
            <button
              onClick={() => {
                localStorage.removeItem('campusride_token');
                window.location.href = '/login';
              }}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs transition shadow-md"
            >
              Reset Session & Reload Login
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Protected Layout wrapper with Light Yellow & White theme
const ProtectedLayout = ({ allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-amber-50/60 flex items-center justify-center text-slate-800 text-sm font-bold">
        <div className="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full mb-2"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={`/${user.role}`} replace />;
  }

  return (
    <div className="min-h-screen bg-amber-50/60 text-slate-800 flex flex-col relative pb-16 md:pb-0">
      <Navbar />
      <div className="flex-1 max-w-7xl w-full mx-auto flex flex-col md:flex-row">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto bg-amber-50/40">
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  );
};

const App = () => {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <SocketProvider>
            <Router>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Student Routes */}
                <Route element={<ProtectedLayout allowedRoles={['student', 'admin']} />}>
                  <Route path="/student" element={<StudentDashboard />} />
                  <Route path="/student/complaints" element={<StudentComplaints />} />
                  <Route path="/student/announcements" element={<StudentAnnouncements />} />
                </Route>

                {/* Driver Routes */}
                <Route element={<ProtectedLayout allowedRoles={['driver', 'admin']} />}>
                  <Route path="/driver" element={<DriverDashboard />} />
                  <Route path="/driver/complaints" element={<DriverComplaints />} />
                </Route>

                {/* Admin Routes */}
                <Route element={<ProtectedLayout allowedRoles={['admin']} />}>
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/admin/complaints" element={<AdminComplaints />} />
                  <Route path="/admin/buses" element={<AdminBuses />} />
                  <Route path="/admin/routes" element={<AdminRoutes />} />
                  <Route path="/admin/announcements" element={<AdminAnnouncements />} />
                  <Route path="/admin/users" element={<AdminUsers />} />
                </Route>

                {/* Fallback Catch-all */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Router>
          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
