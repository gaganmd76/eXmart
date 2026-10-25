import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { MapPin, CreditCard, CheckCircle, ArrowLeft, Loader2 } from 'lucide-react';

const Checkout = () => {
  const { cartItems, cartTotal, clearCart } = useCart();
  const { user, token, apiUrl } = useAuth();
  const navigate = useNavigate();

  const [address, setAddress] = useState('');
  const [paymentMode, setPaymentMode] = useState('COD'); // COD or ONLINE
  const [paidConfirmed, setPaidConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successOrder, setSuccessOrder] = useState(null);

  useEffect(() => {
    if (user) {
      setAddress(user.address || '');
    }
  }, [user]);

  // Redirect if cart is empty (only if we didn't just place an order successfully)
  useEffect(() => {
    if (cartItems.length === 0 && !successOrder) {
      navigate('/cart');
    }
  }, [cartItems, successOrder, navigate]);

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!address.trim()) {
      setError('Please provide a delivery address');
      return;
    }

    if (paymentMode === 'ONLINE' && !paidConfirmed) {
      setError("Please click the 'I have completed my payment' button to proceed.");
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${apiUrl}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          payment_mode: paymentMode,
          delivery_address: address
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to place order');
      }

      // Successful order
      setSuccessOrder(data);
      await clearCart();
    } catch (err) {
      setError(err.message || 'An error occurred while placing the order.');
    } finally {
      setLoading(false);
    }
  };

  // Billing calculations
  const deliveryCharge = cartTotal > 499 ? 0 : 39;
  const handlingFee = 15;
  const grandTotal = cartTotal + deliveryCharge + handlingFee;

  if (successOrder) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center text-white mx-auto shadow-lg shadow-green-100 mb-6">
          <CheckCircle className="h-10 w-10" />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Order Placed!</h2>
        <p className="text-slate-500 text-sm mt-3 font-medium">
          Thank you for shopping at eXmart. Your order has been placed successfully and is being packed.
        </p>

        <div className="bg-slate-50 rounded-2xl border border-slate-100 p-5 mt-8 text-left space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400 font-semibold">Order ID:</span>
            <span className="font-bold text-slate-700">#{successOrder.orderId}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400 font-semibold">Amount Paid:</span>
            <span className="font-bold text-slate-700">₹{parseFloat(successOrder.totalAmount).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400 font-semibold">Payment Mode:</span>
            <span className="font-bold text-green-600">{paymentMode}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400 font-semibold">Status:</span>
            <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-bold uppercase">
              {successOrder.orderStatus}
            </span>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3">
          <button
            onClick={() => navigate('/orders')}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-3.5 px-6 rounded-xl shadow-md transition-all text-sm"
          >
            Track My Order
          </button>
          <button
            onClick={() => navigate('/')}
            className="text-green-600 hover:bg-green-50 border border-green-200 font-bold py-3.5 px-6 rounded-xl transition-all text-sm"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <button
        onClick={() => navigate('/cart')}
        className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 text-sm font-bold mb-6 transition"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Cart</span>
      </button>

      <h1 className="font-extrabold text-2xl sm:text-3xl text-slate-800 tracking-tight mb-8">Checkout</h1>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 text-sm font-semibold rounded-2xl p-4 text-center mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Section - Details */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Shipping Address */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
              <MapPin className="h-5 w-5 text-green-600" />
              <span>Delivery Address</span>
            </h3>
            <p className="text-slate-400 text-xs font-medium">
              Specify the location where you want your groceries delivered.
            </p>
            <textarea
              required
              rows="3"
              placeholder="Enter complete address..."
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition resize-none"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          {/* Payment Method */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-green-600" />
              <span>Select Payment Method</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* COD option */}
              <label
                className={`flex items-center justify-between p-4 border rounded-2xl cursor-pointer transition-all ${
                  paymentMode === 'COD'
                    ? 'border-green-500 bg-green-50/50'
                    : 'border-slate-150 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="paymentMode"
                    value="COD"
                    checked={paymentMode === 'COD'}
                    onChange={() => {
                      setPaymentMode('COD');
                      setError('');
                    }}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-slate-300"
                  />
                  <div>
                    <p className="text-sm font-bold text-slate-800">Cash on Delivery (COD)</p>
                    <p className="text-xs text-slate-400 font-medium">Pay when groceries arrive</p>
                  </div>
                </div>
                <span className="text-xl">💵</span>
              </label>

              {/* Online payment */}
              <label
                className={`flex items-center justify-between p-4 border rounded-2xl cursor-pointer transition-all ${
                  paymentMode === 'ONLINE'
                    ? 'border-green-500 bg-green-50/50'
                    : 'border-slate-150 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="paymentMode"
                    value="ONLINE"
                    checked={paymentMode === 'ONLINE'}
                    onChange={() => {
                      setPaymentMode('ONLINE');
                      setError('');
                    }}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-slate-300"
                  />
                  <div>
                    <p className="text-sm font-bold text-slate-800">Scan UPI QR Code</p>
                    <p className="text-xs text-slate-400 font-medium">Mock online payment</p>
                  </div>
                </div>
                <span className="text-xl">📱</span>
              </label>
            </div>

            {/* Online payment mockup details */}
            {paymentMode === 'ONLINE' && (
              <div className="border-t border-slate-100 pt-5 mt-4 flex flex-col sm:flex-row gap-6 items-center bg-slate-50 rounded-2xl p-5 border border-slate-100 animate-fadeIn">
                <div className="w-40 h-40 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex items-center justify-center p-1">
                  <img
                    src="/upi_qr_code.png"
                    alt="UPI Payment QR Code"
                    className="object-contain h-full w-full"
                  />
                </div>
                <div className="flex-1 space-y-3.5 text-center sm:text-left">
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">UPI Payment Scanner</p>
                  <p className="text-sm text-slate-600 font-medium leading-relaxed">
                    Scan this QR code using any UPI app (GPay/PhonePe/Paytm) to pay <strong>₹{grandTotal.toFixed(2)}</strong>.
                  </p>
                  
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPaidConfirmed(!paidConfirmed);
                        setError('');
                      }}
                      className={`inline-flex items-center gap-2 text-xs font-extrabold px-5 py-2.5 rounded-full transition-all border ${
                        paidConfirmed
                          ? 'bg-green-600 text-white border-green-600 shadow-md'
                          : 'bg-white text-green-600 border-green-200 hover:bg-green-50'
                      }`}
                    >
                      <CheckCircle className="h-4 w-4" />
                      <span>{paidConfirmed ? "✓ Completed!" : "I've Paid (Simulate)"}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Section - Bill Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-6">
            <h3 className="font-extrabold text-slate-800 text-lg border-b border-slate-50 pb-3">
              Order Summary
            </h3>

            {/* Itemized Mini List */}
            <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
              {cartItems.map((item) => (
                <div key={item.product_id || item.id} className="flex justify-between text-xs sm:text-sm text-slate-500 font-medium">
                  <span className="truncate pr-4 flex-1">
                    {item.name} <strong className="text-slate-400 font-normal">x{item.quantity}</strong>
                  </span>
                  <span className="font-bold text-slate-700">
                    ₹{(parseFloat(item.price) * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-100 pt-4 space-y-3">
              <div className="flex justify-between text-sm text-slate-500 font-medium">
                <span>Subtotal</span>
                <span className="font-bold text-slate-700">₹{cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-500 font-medium">
                <span>Delivery Charge</span>
                {deliveryCharge === 0 ? (
                  <span className="font-bold text-green-600">FREE</span>
                ) : (
                  <span className="font-bold text-slate-700">₹{deliveryCharge.toFixed(2)}</span>
                )}
              </div>
              <div className="flex justify-between text-sm text-slate-500 font-medium">
                <span>Handling Fee</span>
                <span className="font-bold text-slate-700">₹{handlingFee.toFixed(2)}</span>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 flex items-center justify-between font-extrabold text-slate-800 text-lg">
              <span>Grand Total</span>
              <span className="text-xl text-green-600">₹{grandTotal.toFixed(2)}</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-bold py-4 px-6 rounded-2xl shadow-lg shadow-green-100 hover:shadow-xl transition-all flex items-center justify-center gap-2 text-base disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Placing Order...</span>
                </>
              ) : (
                <span>Place Order</span>
              )}
            </button>
          </div>
        </div>

      </form>
    </div>
  );
};

export default Checkout;
