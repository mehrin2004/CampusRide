import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Mail, User, Phone, ShieldCheck, UserCheck, Wrench, Key, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { busAPI } from '../../services/api';
import Logo from '../../components/Logo';

const Register = () => {
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role') || 'student';

  const [role, setRole] = useState(initialRole);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [department, setDepartment] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [experienceYears, setExperienceYears] = useState(3);
  const [adminKey, setAdminKey] = useState('');
  const [busNumber, setBusNumber] = useState('32C');
  const [availableBuses, setAvailableBuses] = useState([]);

  const [formError, setFormError] = useState(null);
  const { register, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBuses = async () => {
      try {
        const res = await busAPI.getAll();
        const list = res.data.data || [];
        setAvailableBuses(list);
        if (list.length > 0) {
          const firstBusNum = list[0].busNumber;
          setBusNumber(firstBusNum);
        }
      } catch (err) {
        console.error('Error fetching buses:', err);
      }
    };
    fetchBuses();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    // Name validation
    if (!name || name.trim().length < 2) {
      setFormError('Please enter your full name (minimum 2 characters).');
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setFormError('Please enter a valid email address (e.g. name@domain.com).');
      return;
    }

    // Phone / Number validation (if provided)
    if (phone && phone.trim()) {
      const cleanPhone = phone.replace(/\D/g, '');
      if (cleanPhone.length !== 10) {
        setFormError('Phone number must be exactly 10 digits (e.g. 9842100000).');
        return;
      }
    }

    // Password validation (min 6 chars, letters & numbers)
    if (password.length < 6) {
      setFormError('Password must be at least 6 characters long.');
      return;
    }

    const hasLetter = /[a-zA-Z]/.test(password);
    const hasDigit = /\d/.test(password);
    if (!hasLetter || !hasDigit) {
      setFormError('Password must contain at least one letter and one number for security.');
      return;
    }

    try {
      const newUser = await register({
        name: name.trim(),
        email: email.trim(),
        password,
        role,
        phone: phone.trim(),
        rollNumber: rollNumber.trim(),
        department: department.trim(),
        licenseNumber: licenseNumber.trim(),
        experienceYears,
        adminKey: adminKey.trim(),
        busNumber
      });
      navigate(`/${newUser.role}`);
    } catch (err) {
      setFormError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-amber-50/60 text-slate-800 flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-lg space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-3">
          <Link to="/" className="inline-block hover:opacity-90 transition">
            <Logo size="lg" />
          </Link>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Create Account</h2>
          <p className="text-slate-600 text-xs font-semibold">Register for Rohini College CampusRide</p>
        </div>

        {/* Role Switcher */}
        <div className="grid grid-cols-3 gap-1.5 bg-white p-1.5 rounded-2xl border border-amber-200 shadow-sm">
          <button
            type="button"
            onClick={() => setRole('student')}
            className={`py-2 text-xs font-extrabold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              role === 'student' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            Student
          </button>
          <button
            type="button"
            onClick={() => setRole('driver')}
            className={`py-2 text-xs font-extrabold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              role === 'driver' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            Driver
          </button>
          <button
            type="button"
            onClick={() => setRole('admin')}
            className={`py-2 text-xs font-extrabold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              role === 'admin' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Admin
          </button>
        </div>

        {/* Register Card */}
        <div className="bg-white border border-amber-200/80 rounded-3xl p-6 shadow-xl space-y-4">
          
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold">
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. K. Anitha"
                  className="w-full pl-10 pr-4 py-2.5 bg-amber-50/40 border border-amber-200 rounded-xl text-slate-900 text-sm font-semibold focus:outline-none focus:border-amber-500 transition"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="anitha@campusride.edu"
                    className="w-full pl-10 pr-4 py-2.5 bg-amber-50/40 border border-amber-200 rounded-xl text-slate-900 text-sm font-semibold focus:outline-none focus:border-amber-500 transition"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Phone Number (10 Digits)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    maxLength={10}
                    placeholder="9842100000"
                    className="w-full pl-10 pr-4 py-2.5 bg-amber-50/40 border border-amber-200 rounded-xl text-slate-900 text-sm font-semibold focus:outline-none focus:border-amber-500 transition"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
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

            {/* Role Specific Fields */}
            {role === 'student' && (
              <div className="space-y-3 p-3 bg-amber-50/60 rounded-2xl border border-amber-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-emerald-800 mb-1">
                      Student Roll / ID <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={rollNumber}
                      onChange={(e) => setRollNumber(e.target.value)}
                      placeholder="e.g. RCET-2024-CSE-04"
                      className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl text-slate-900 text-xs font-semibold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-emerald-800 mb-1">
                      Department
                    </label>
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="e.g. Computer Science"
                      className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl text-slate-900 text-xs font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-emerald-800 mb-1">
                    Assigned Bus Number <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={busNumber}
                    onChange={(e) => setBusNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl text-slate-900 text-xs font-bold focus:outline-none focus:border-amber-500"
                    required
                  >
                    {availableBuses.length > 0 ? (
                      availableBuses.map((b) => (
                        <option key={b._id} value={b.busNumber}>
                          Bus {b.busNumber} ({b.routeName ? b.routeName.split('-')[0].trim() : 'Campus Route'})
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="32C">Bus 32C (Parappadi - Nanguneri - Vallioor - RCET)</option>
                        <option value="43C">Bus 43C (Town - Palayamkottai - Panagudi - RCET)</option>
                        <option value="14A">Bus 14A (Vadukatchimathil - Dohnavur - Eruvadi - RCET)</option>
                      </>
                    )}
                  </select>
                </div>
              </div>
            )}

            {role === 'driver' && (
              <div className="space-y-3 p-3 bg-amber-50/60 rounded-2xl border border-amber-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-amber-900 mb-1">
                      Driver License # <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={licenseNumber}
                      onChange={(e) => setLicenseNumber(e.target.value)}
                      placeholder="e.g. TN-74-2018-009"
                      className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl text-slate-900 text-xs font-semibold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-amber-900 mb-1">
                      Driving Experience (Yrs)
                    </label>
                    <input
                      type="number"
                      value={experienceYears}
                      onChange={(e) => setExperienceYears(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl text-slate-900 text-xs font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-amber-900 mb-1">
                    Assigned Bus Number <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={busNumber}
                    onChange={(e) => setBusNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl text-slate-900 text-xs font-bold focus:outline-none focus:border-amber-500"
                    required
                  >
                    {availableBuses.length > 0 ? (
                      availableBuses.map((b) => (
                        <option key={b._id} value={b.busNumber}>
                          Bus {b.busNumber} ({b.routeName ? b.routeName.split('-')[0].trim() : 'Campus Route'})
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="32C">Bus 32C (Parappadi - Nanguneri - Vallioor - RCET)</option>
                        <option value="43C">Bus 43C (Town - Palayamkottai - Panagudi - RCET)</option>
                        <option value="14A">Bus 14A (Vadukatchimathil - Dohnavur - Eruvadi - RCET)</option>
                      </>
                    )}
                  </select>
                </div>
              </div>
            )}

            {role === 'admin' && (
              <div className="p-3 bg-purple-50 rounded-2xl border border-purple-200">
                <label className="block text-xs font-bold uppercase tracking-wider text-purple-800 mb-1 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5" />
                  Admin Passkey (Required: ADMIN2026)
                </label>
                <input
                  type="password"
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                  placeholder="Enter ADMIN2026"
                  className="w-full px-3 py-2 bg-white border border-purple-200 rounded-xl text-slate-900 text-xs font-semibold"
                  required
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm shadow-md shadow-amber-500/20 transition cursor-pointer mt-2"
            >
              {loading ? 'Creating Account...' : `Register as ${role.toUpperCase()}`}
            </button>
          </form>
        </div>

        <p className="text-center text-xs font-bold text-slate-600">
          Already registered?{' '}
          <Link to={`/login?role=${role}`} className="text-amber-700 font-extrabold hover:underline">
            Sign In here
          </Link>
        </p>

      </div>
    </div>
  );
};

export default Register;
