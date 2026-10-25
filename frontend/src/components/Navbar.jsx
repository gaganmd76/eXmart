import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { ShoppingCart, User, LogOut, ClipboardList, Shield, Search, Menu, X, ShoppingBag } from 'lucide-react';

const Navbar = ({ searchVal, setSearchVal }) => {
  const { user, logout } = useAuth();
  const { cartCount, cartTotal } = useCart();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    navigate('/');
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (location.pathname !== '/') {
      navigate('/');
    }
  };

  const categories = [
    'Grains & Staples',
    'Packaged Foods',
    'Beverages',
    'Personal Care',
    'Household Essentials',
    'Dairy & Bakery'
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-slate-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 flex-shrink-0">
            <div className="bg-green-500 p-2 rounded-xl text-white shadow-md shadow-green-200">
              <ShoppingBag className="h-6 w-6" />
            </div>
            <span className="font-extrabold text-xl sm:text-2xl tracking-tight bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent">
              eXmart
            </span>
          </Link>

          {/* Search bar - Desktop */}
          {location.pathname === '/' && (
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <form onSubmit={handleSearchSubmit} className="relative w-full">
                <input
                  type="text"
                  placeholder="Search groceries (e.g. Rice, Atta, Soap...)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-full py-2.5 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all placeholder:text-slate-400"
                  value={searchVal}
                  onChange={(e) => setSearchVal(e.target.value)}
                />
                <Search className="absolute left-4 top-3 h-4 w-4 text-slate-400" />
              </form>
            </div>
          )}

          {/* Actions - Desktop */}
          <div className="hidden md:flex items-center space-x-6">
            
            {/* Admin panel quick link if admin */}
            {user && user.role === 'admin' && (
              <Link
                to="/admin/dashboard"
                className="flex items-center space-x-1.5 text-slate-700 hover:text-green-600 font-medium text-sm transition"
              >
                <Shield className="h-4 w-4 text-green-600" />
                <span>Admin Dashboard</span>
              </Link>
            )}

            {/* User Dropdown */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center space-x-2 text-slate-700 hover:text-green-600 font-medium text-sm focus:outline-none py-2"
                >
                  <div className="bg-slate-100 p-1.5 rounded-full">
                    <User className="h-4 w-4 text-slate-600" />
                  </div>
                  <span className="max-w-[120px] truncate">{user.name}</span>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-2xl shadow-xl py-2 z-50">
                    <div className="px-4 py-2 border-b border-slate-50">
                      <p className="text-xs text-slate-400">Signed in as</p>
                      <p className="text-sm font-semibold text-slate-800 truncate">{user.email}</p>
                    </div>
                    
                    <Link
                      to="/orders"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center space-x-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-green-600 transition"
                    >
                      <ClipboardList className="h-4 w-4" />
                      <span>My Orders</span>
                    </Link>

                    {user.role === 'admin' && (
                      <Link
                        to="/admin/dashboard"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center space-x-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-green-600 transition"
                      >
                        <Shield className="h-4 w-4" />
                        <span>Manage Store</span>
                      </Link>
                    )}

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition text-left border-t border-slate-50"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/auth"
                className="flex items-center space-x-1.5 text-slate-700 hover:text-green-600 font-semibold text-sm transition"
              >
                <User className="h-4 w-4" />
                <span>Sign In / Register</span>
              </Link>
            )}

            {/* Cart Icon */}
            <Link
              to="/cart"
              className="relative flex items-center space-x-2 bg-green-50 hover:bg-green-100 text-green-700 px-4 py-2 rounded-full font-bold text-sm transition-all"
            >
              <ShoppingCart className="h-4 w-4" />
              <span>Cart</span>
              {cartCount > 0 && (
                <span className="bg-orange-500 text-white rounded-full text-xs w-5 h-5 flex items-center justify-center font-semibold animate-pulse">
                  {cartCount}
                </span>
              )}
              {cartTotal > 0 && (
                <span className="border-l border-green-200 pl-2 text-xs font-semibold text-green-600">
                  ₹{cartTotal.toFixed(2)}
                </span>
              )}
            </Link>
          </div>

          {/* Mobile hamburger menu */}
          <div className="flex items-center space-x-4 md:hidden">
            <Link
              to="/cart"
              className="relative bg-green-50 text-green-700 p-2.5 rounded-full"
            >
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-orange-500 text-white rounded-full text-[10px] w-4.5 h-4.5 flex items-center justify-center font-bold">
                  {cartCount}
                </span>
              )}
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-slate-700 hover:text-green-600 focus:outline-none"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 pt-2 pb-4 space-y-3 shadow-inner">
          {/* Mobile Search */}
          {location.pathname === '/' && (
            <div className="relative py-1">
              <input
                type="text"
                placeholder="Search groceries..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-sm"
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
              />
              <Search className="absolute left-3 top-4.5 h-4 w-4 text-slate-400" />
            </div>
          )}

          {/* Mobile Navigation Links */}
          {user ? (
            <div className="space-y-1">
              <div className="px-3 py-2 border-b border-slate-50 mb-2">
                <p className="text-xs text-slate-400">Signed in as</p>
                <p className="font-semibold text-slate-800 truncate">{user.name}</p>
              </div>
              <Link
                to="/orders"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center space-x-2 px-3 py-2.5 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-green-600 transition"
              >
                <ClipboardList className="h-5 w-5 text-slate-400" />
                <span>My Orders</span>
              </Link>
              {user.role === 'admin' && (
                <Link
                  to="/admin/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center space-x-2 px-3 py-2.5 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-green-600 transition"
                >
                  <Shield className="h-5 w-5 text-green-600" />
                  <span>Admin Dashboard</span>
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-2 px-3 py-2.5 rounded-xl text-red-600 hover:bg-red-50 transition text-left"
              >
                <LogOut className="h-5 w-5" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <Link
              to="/auth"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center space-x-2 px-3 py-2.5 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-green-600 font-semibold"
            >
              <User className="h-5 w-5 text-slate-400" />
              <span>Sign In / Register</span>
            </Link>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
