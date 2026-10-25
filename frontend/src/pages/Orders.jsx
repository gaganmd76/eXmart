import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ClipboardList, ArrowLeft, Loader2, Calendar, MapPin, CreditCard, ChevronDown, ChevronUp } from 'lucide-react';

const Orders = () => {
  const { token, apiUrl, user } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedOrder, setExpandedOrder] = useState({});

  useEffect(() => {
    if (!token) {
      navigate('/auth');
      return;
    }

    const fetchOrders = async () => {
      try {
        const res = await fetch(`${apiUrl}/orders/my`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!res.ok) throw new Error('Failed to load orders');
        const data = await res.json();
        setOrders(data);
      } catch (err) {
        console.error(err);
        setError('Failed to fetch your order history.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [token, apiUrl, navigate]);

  const toggleExpand = (orderId) => {
    setExpandedOrder(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PLACED': return 'bg-blue-100 text-blue-800';
      case 'PACKED': return 'bg-yellow-100 text-yellow-800';
      case 'OUT_FOR_DELIVERY': return 'bg-orange-100 text-orange-800';
      case 'DELIVERED': return 'bg-green-100 text-green-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const steps = ['PLACED', 'PACKED', 'OUT_FOR_DELIVERY', 'DELIVERED'];
  const stepLabels = ['Placed', 'Packed', 'Out for Delivery', 'Delivered'];

  const getStepIndex = (status) => {
    return steps.indexOf(status.toUpperCase());
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="h-10 w-10 text-green-500 animate-spin" />
        <p className="text-slate-400 text-sm mt-3 font-medium">Fetching order records...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="bg-red-50 text-red-600 rounded-2xl p-6 border border-red-100">
          <p className="font-semibold">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 text-sm font-bold mb-6 transition"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Continue Shopping</span>
      </button>

      <div className="flex items-center gap-3 mb-8">
        <div className="bg-green-100 p-2.5 rounded-2xl text-green-700">
          <ClipboardList className="h-6 w-6" />
        </div>
        <div>
          <h1 className="font-extrabold text-2xl sm:text-3xl text-slate-800 tracking-tight">My Orders</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Check status, details, and receipt copies of your groceries
          </p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-3xl p-12 text-center shadow-sm">
          <div className="text-5xl mb-4">📦</div>
          <h3 className="font-bold text-slate-800 text-lg">No orders yet</h3>
          <p className="text-slate-400 text-sm mt-2 max-w-sm mx-auto">
            You haven't placed any orders yet. Head to the homepage to order groceries!
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            const currentStepIdx = getStepIndex(order.order_status);
            const isExpanded = expandedOrder[order.id];

            return (
              <div
                key={order.id}
                className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden"
              >
                
                {/* Order Summary Header */}
                <div
                  onClick={() => toggleExpand(order.id)}
                  className="p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50 transition-all border-b border-slate-50"
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Order ID</span>
                      <h3 className="font-extrabold text-slate-800 text-base sm:text-lg">#{order.id}</h3>
                    </div>
                    <div className="h-8 w-px bg-slate-100"></div>
                    <div>
                      <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Placed On</span>
                      <p className="text-sm font-semibold text-slate-700 flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <span>{formatDate(order.created_at)}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total</span>
                      <p className="text-base font-extrabold text-green-600">₹{parseFloat(order.total_amount).toFixed(2)}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusColor(order.order_status)}`}>
                      {order.order_status.replace(/_/g, ' ')}
                    </span>
                    <button className="text-slate-400 hover:text-slate-700 p-1 rounded-full">
                      {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {/* Tracking Progress Bar */}
                <div className="px-6 py-8 border-b border-slate-50 bg-slate-50/30">
                  <div className="relative flex justify-between max-w-xl mx-auto">
                    
                    {/* Background line */}
                    <div className="absolute top-4 left-0 right-0 h-1 bg-slate-200 -z-10 rounded-full"></div>
                    
                    {/* Active line */}
                    <div
                      className="absolute top-4 left-0 h-1 bg-green-500 -z-10 rounded-full transition-all duration-500"
                      style={{ width: `${(currentStepIdx / (steps.length - 1)) * 100}%` }}
                    ></div>

                    {steps.map((step, idx) => {
                      const isActive = idx <= currentStepIdx;
                      const isCurrent = idx === currentStepIdx;

                      return (
                        <div key={step} className="flex flex-col items-center">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shadow-sm border transition-all ${
                              isCurrent
                                ? 'bg-green-500 text-white border-green-500 ring-4 ring-green-100 scale-110'
                                : isActive
                                ? 'bg-green-100 text-green-700 border-green-200'
                                : 'bg-white text-slate-400 border-slate-200'
                            }`}
                          >
                            {isActive ? '✓' : idx + 1}
                          </div>
                          <span
                            className={`text-[10px] sm:text-xs mt-2.5 font-bold uppercase tracking-wider text-center ${
                              isActive ? 'text-green-700' : 'text-slate-400'
                            }`}
                          >
                            {stepLabels[idx]}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Itemized List & Address (Expanded View) */}
                {isExpanded && (
                  <div className="p-6 bg-white space-y-6 animate-fadeIn">
                    <div>
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Itemized Bill</h4>
                      <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
                        {order.items && order.items.map((item) => (
                          <div key={item.id} className="p-4 flex items-center justify-between hover:bg-slate-50/30">
                            <div className="flex items-center space-x-3.5">
                              <div className="h-12 w-12 bg-slate-50 rounded-xl overflow-hidden flex items-center justify-center p-1.5 border border-slate-50">
                                <img
                                  src={item.image_url}
                                  alt={item.name}
                                  className="object-contain"
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400';
                                  }}
                                />
                              </div>
                              <div>
                                <h5 className="font-bold text-slate-800 text-sm">{item.name}</h5>
                                <p className="text-xs text-slate-400 font-medium">{item.unit}</p>
                              </div>
                            </div>

                            <div className="text-right">
                              <p className="text-sm font-bold text-slate-800">₹{(parseFloat(item.price_at_order) * item.quantity).toFixed(2)}</p>
                              <p className="text-xs text-slate-400 font-medium">₹{parseFloat(item.price_at_order).toFixed(2)} x {item.quantity}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-100 pt-6">
                      {/* Delivery Address */}
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-slate-400" />
                          <span>Delivery Location</span>
                        </h4>
                        <p className="text-sm font-semibold text-slate-700 pl-5 leading-relaxed">
                          {order.delivery_address}
                        </p>
                      </div>

                      {/* Payment summary */}
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                          <CreditCard className="h-3.5 w-3.5 text-slate-400" />
                          <span>Payment Method</span>
                        </h4>
                        <div className="pl-5">
                          <p className="text-sm font-semibold text-slate-700">
                            {order.payment_mode === 'ONLINE' ? 'UPI Scanner Payment' : 'Cash on Delivery (COD)'}
                          </p>
                          <p className="text-xs font-bold uppercase mt-1">
                            Status: <span className={order.payment_status === 'PAID' ? 'text-green-600' : 'text-orange-500'}>
                              {order.payment_status}
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Orders;
