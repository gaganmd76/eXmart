import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShoppingBag, Mail, Lock, User, Phone, MapPin, Eye, EyeOff } from 'lucide-react';

const Auth = () => {
  const { login, signup, user } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  React.useEffect(() => {
    if (user) {
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        if (!name || !phone || !address) {
          throw new Error('All fields are required for signup');
        }
        await signup(name, email, phone, password, address);
      }
      // Redirect handled by useEffect
    } catch (err) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-md w-full space-y-8 bg-white border border-slate-100 rounded-3xl p-6 sm:p-10 shadow-xl shadow-slate-100">
        
        {/* Logo/Branding header */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-green-500 rounded-2xl flex items-center justify-center text-white shadow-md shadow-green-100 mb-4">
            <ShoppingBag className="h-6 w-6" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="mt-2 text-sm text-slate-400 font-medium">
            {isLogin ? 'Login to buy groceries and track your orders' : 'Register to get super-fast grocery delivery'}
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-100 pb-1">
          <button
            onClick={() => { setIsLogin(true); setError(''); }}
            className={`flex-1 text-center pb-3 text-sm font-bold border-b-2 transition ${
              isLogin ? 'border-green-500 text-green-700' : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setIsLogin(false); setError(''); }}
            className={`flex-1 text-center pb-3 text-sm font-bold border-b-2 transition ${
              !isLogin ? 'border-green-500 text-green-700' : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            Register
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 text-sm font-semibold rounded-2xl p-4 text-center">
            {error}
          </div>
        )}

        <form className="space-y-5" onSubmit={handleSubmit}>
          
          {/* Registration fields */}
          {!isLogin && (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Full Name</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="John Doe"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  <User className="absolute left-4 top-3.5 h-4.5 w-4.5 text-slate-400" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Phone Number</label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    placeholder="9876543210"
                    pattern="[0-9]{10}"
                    title="Please enter a valid 10-digit phone number"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                  <Phone className="absolute left-4 top-3.5 h-4.5 w-4.5 text-slate-400" />
                </div>
              </div>
            </>
          )}

          {/* Email */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Email Address</label>
            <div className="relative">
              <input
                type="email"
                required
                placeholder="john@example.com"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Mail className="absolute left-4 top-3.5 h-4.5 w-4.5 text-slate-400" />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                minLength="6"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Lock className="absolute left-4 top-3.5 h-4.5 w-4.5 text-slate-400" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600 focus:outline-none"
              >
                {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
              </button>
            </div>
          </div>

          {/* Delivery Address (Sign up only) */}
          {!isLogin && (
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Delivery Address</label>
              <div className="relative">
                <textarea
                  required
                  rows="3"
                  placeholder="Flat No, Street Name, Locality, City, pincode"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition resize-none"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
                <MapPin className="absolute left-4 top-3.5 h-4.5 w-4.5 text-slate-400" />
              </div>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-green-100 hover:shadow-xl transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
          >
            {loading ? (
              <span>Connecting...</span>
            ) : (
              <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
            )}
          </button>
        </form>

        <div className="text-center mt-6">
          <button
            onClick={() => {
              navigate('/admin/login');
            }}
            className="text-xs text-slate-400 hover:text-green-600 font-bold transition uppercase tracking-wider"
          >
            Are you a Store Administrator? Login Here
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
