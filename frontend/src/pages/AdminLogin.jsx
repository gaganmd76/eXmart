import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';

const AdminLogin = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in as admin
  React.useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        setError('Your account does not have administrator privileges.');
      }
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const loggedUser = await login(email, password);
      if (loggedUser.role !== 'admin') {
        throw new Error('Access denied. Administrator privileges required.');
      }
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid administrator credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-slate-900">
      
      <button
        onClick={() => navigate('/auth')}
        className="flex items-center gap-1.5 text-slate-400 hover:text-white text-xs font-bold uppercase tracking-wider mb-6 transition"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Customer Sign In</span>
      </button>

      <div className="max-w-md w-full space-y-8 bg-slate-800 border border-slate-700/60 rounded-3xl p-6 sm:p-10 shadow-2xl shadow-slate-950">
        
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-orange-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-950 mb-4">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            Store Console
          </h2>
          <p className="mt-2 text-sm text-slate-400 font-medium">
            Administrator & Staff Portal Sign In
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-semibold rounded-2xl p-4 text-center">
            {error}
          </div>
        )}

        <form className="space-y-5" onSubmit={handleSubmit}>
          {/* Email */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Staff Email</label>
            <div className="relative">
              <input
                type="email"
                required
                placeholder="admin@exmart.com"
                className="w-full bg-slate-950 border border-slate-700/60 text-white rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition placeholder:text-slate-600"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Mail className="absolute left-4 top-3.5 h-4.5 w-4.5 text-slate-500" />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Security Key</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-700/60 text-white rounded-xl py-3 pl-11 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition placeholder:text-slate-600"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Lock className="absolute left-4 top-3.5 h-4.5 w-4.5 text-slate-500" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-3.5 text-slate-500 hover:text-slate-300 focus:outline-none"
              >
                {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-orange-950 hover:shadow-xl transition-all flex items-center justify-center gap-2 mt-6 disabled:opacity-50"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <span>Launch Console</span>
            )}
          </button>
        </form>

        <div className="text-center mt-6 text-xs text-slate-500">
          <p>Protected connection. Unauthorized access is monitored.</p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
