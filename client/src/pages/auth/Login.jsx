import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Bus, Lock, Mail, ArrowRight, ShieldCheck, UserCheck, Wrench, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Logo from '../../components/Logo';

const Login = () => {
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role') || 'student';
  
  const [role, setRole] = useState(initialRole);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busNumber, setBusNumber] = useState('');
  const [formError, setFormError] = useState(null);

  const { login, user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate(`/${user.role}`);
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setFormError('Please enter a valid email address (e.g. name@domain.com).');
      return;
    }

    // Password validation
    if (password.length < 6) {
      setFormError('Password must be at least 6 characters long.');
      return;
    }

    try {
      const loggedUser = await login({ 
        email: email.trim(), 
        password, 
        role, 
        busNumber: (role === 'student' || role === 'driver') ? busNumber.trim() : undefined 
      });
      navigate(`/${loggedUser.role}`);
    } catch (err) {
      setFormError(err.message || 'Login failed. Please verify your credentials and database connection.');
    }
  };

  return (
    <div className="min-h-screen bg-amber-50/60 text-slate-800 flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        
        {/* Brand Header with Attractive Logo */}
        <div className="text-center space-y-3">
          <Link to="/" className="inline-block hover:opacity-90 transition">
            <Logo size="lg" />
          </Link>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Welcome Back</h2>
          <p className="text-slate-600 text-xs font-semibold">Sign in to your Rohini College CampusRide Portal</p>
        </div>

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-3 gap-1.5 bg-white p-1.5 rounded-2xl border border-amber-200 shadow-sm">
          <button
            type="button"
            onClick={() => {
              setRole('student');
              setFormError(null);
            }}
            className={`py-2 text-xs font-extrabold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              role === 'student'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            Student
          </button>
          <button
            type="button"
            onClick={() => {
              setRole('driver');
              setFormError(null);
            }}
            className={`py-2 text-xs font-extrabold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              role === 'driver'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            Driver
          </button>
          <button
            type="button"
            onClick={() => {
              setRole('admin');
              setFormError(null);
            }}
            className={`py-2 text-xs font-extrabold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              role === 'admin'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Admin
          </button>
        </div>

        {/* Login Form */}
        <div className="bg-white border border-amber-200/80 rounded-3xl p-6 shadow-xl space-y-4">
          
          {formError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-bold">
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-amber-50/40 border border-amber-200 rounded-xl text-slate-900 text-sm font-semibold focus:outline-none focus:border-amber-500 transition"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-amber-50/40 border border-amber-200 rounded-xl text-slate-900 text-sm font-semibold focus:outline-none focus:border-amber-500 transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Bus Number Input (For Student & Driver roles) */}
            {(role === 'student' || role === 'driver') && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1 flex items-center justify-between">
                  <span>Assigned Bus Number {role === 'student' && <span className="text-rose-600">*</span>}</span>
                  <span className="text-[10px] text-amber-700 font-extrabold">Strict Bus View</span>
                </label>
                <div className="relative">
                  <Bus className="w-4 h-4 text-amber-600 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={busNumber}
                    onChange={(e) => setBusNumber(e.target.value)}
                    placeholder="Type Bus Number"
                    className="w-full pl-10 pr-4 py-2.5 bg-amber-50/60 border border-amber-300 rounded-xl text-slate-900 text-sm font-bold focus:outline-none focus:border-amber-500 transition"
                    required={role === 'student'}
                  />
                </div>
                <p className="text-[11px] text-slate-500 font-medium mt-1">
                  {role === 'student' 
                    ? 'Type your bus number to view live tracking strictly for your bus.' 
                    : 'Type assigned bus number to scope control panel.'}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm shadow-md shadow-amber-500/20 transition flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {loading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <span>Sign In as {role.toUpperCase()}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Register Redirect */}
        <p className="text-center text-xs font-bold text-slate-600">
          Don't have an account?{' '}
          <Link to={`/register?role=${role}`} className="text-amber-700 font-extrabold hover:underline">
            Register new {role} account
          </Link>
        </p>

      </div>
    </div>
  );
};

export default Login;
