import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Trash2, ShoppingBag, Plus, Minus, ArrowRight, ShieldCheck } from 'lucide-react';

const Cart = () => {
  const { cartItems, cartTotal, addToCart, removeFromCart, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleQtyChange = async (item, change) => {
    const newQty = item.quantity + change;
    if (newQty <= 0) {
      await removeFromCart(item.product_id || item.id);
    } else {
      if (item.stock_quantity < newQty) {
        alert(`Cannot increase quantity. Only ${item.stock_quantity} item(s) are available in stock.`);
        return;
      }
      await addToCart(item, newQty);
    }
  };

  const handleCheckoutRedirect = () => {
    if (user) {
      navigate('/checkout');
    } else {
      navigate('/auth', { state: { from: { pathname: '/checkout' } } });
    }
  };

  // Pricing calculations
  const deliveryCharge = cartTotal > 499 ? 0 : 39;
  const handlingFee = 15;
  const grandTotal = cartTotal + deliveryCharge + handlingFee;

  if (cartItems.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="text-7xl mb-6">🛒</div>
        <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Your Cart is Empty</h2>
        <p className="text-slate-400 text-sm mt-3 max-w-sm mx-auto">
          Looks like you haven't added any groceries yet. Start filling your basket with daily essentials!
        </p>
        <Link
          to="/"
          className="mt-8 inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold px-8 py-3.5 rounded-full shadow-lg shadow-green-100 hover:shadow-xl transition-all"
        >
          <ShoppingBag className="h-4.5 w-4.5" />
          <span>Browse Groceries</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-extrabold text-2xl sm:text-3xl text-slate-800 tracking-tight">Shopping Cart</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Review your items and proceed to checkout for fast delivery
          </p>
        </div>
        <button
          onClick={clearCart}
          className="text-xs text-red-500 hover:text-red-700 font-bold border border-red-100 hover:bg-red-50 px-3.5 py-2 rounded-full transition"
        >
          Clear Cart
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Cart Item List */}
        <div className="lg:col-span-2 space-y-4">
          {cartItems.map((item) => {
            const pId = item.product_id || item.id;
            return (
              <div
                key={pId}
                className="bg-white border border-slate-100 rounded-2xl p-4 sm:p-5 flex items-center justify-between shadow-sm"
              >
                {/* Image & details */}
                <div className="flex items-center space-x-4 flex-1">
                  <div className="h-16 w-16 sm:h-20 sm:w-20 bg-slate-50 border border-slate-100 rounded-xl overflow-hidden flex items-center justify-center p-2 flex-shrink-0">
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="object-contain max-h-full max-w-full"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400';
                      }}
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0 pr-4">
                    <span className="bg-slate-50 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                      {item.category}
                    </span>
                    <h3 className="font-bold text-slate-800 text-sm sm:text-base mt-1 truncate">
                      {item.name}
                    </h3>
                    <p className="text-xs text-slate-400 font-medium">{item.unit}</p>
                    <p className="text-sm font-extrabold text-slate-800 mt-1.5 sm:hidden">
                      ₹{parseFloat(item.price).toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Adjust Quantity & Delete */}
                <div className="flex items-center space-x-4 sm:space-x-8">
                  {/* Price (Desktop only) */}
                  <div className="hidden sm:block text-right">
                    <p className="text-base font-extrabold text-slate-800">
                      ₹{parseFloat(item.price).toFixed(2)}
                    </p>
                    <p className="text-xs text-slate-400 font-medium">per unit</p>
                  </div>

                  {/* Quantity controls */}
                  <div className="flex items-center border border-slate-200 rounded-full p-1 bg-slate-50">
                    <button
                      onClick={() => handleQtyChange(item, -1)}
                      className="text-slate-500 hover:bg-slate-200 hover:text-slate-800 p-1.5 rounded-full transition"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="px-3 text-sm font-bold text-slate-800 w-8 text-center select-none">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => handleQtyChange(item, 1)}
                      className="text-slate-500 hover:bg-slate-200 hover:text-slate-800 p-1.5 rounded-full transition"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Delete Item */}
                  <button
                    onClick={() => removeFromCart(pId)}
                    className="text-slate-400 hover:text-red-500 p-2 rounded-full hover:bg-slate-50 transition"
                  >
                    <Trash2 className="h-4.5 w-4.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pricing Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm sticky top-28 space-y-6">
            
            <h3 className="font-extrabold text-slate-800 text-lg border-b border-slate-50 pb-3">
              Bill Details
            </h3>

            <div className="space-y-3.5">
              <div className="flex justify-between text-sm text-slate-500 font-medium">
                <span>Item Total</span>
                <span className="font-bold text-slate-800">₹{cartTotal.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between text-sm text-slate-500 font-medium">
                <span>Delivery Charge</span>
                {deliveryCharge === 0 ? (
                  <span className="font-bold text-green-600">FREE</span>
                ) : (
                  <span className="font-bold text-slate-800">₹{deliveryCharge.toFixed(2)}</span>
                )}
              </div>

              <div className="flex justify-between text-sm text-slate-500 font-medium">
                <span>Handling Fee</span>
                <span className="font-bold text-slate-800">₹{handlingFee.toFixed(2)}</span>
              </div>

              {deliveryCharge > 0 && (
                <div className="bg-green-50 text-green-700 text-xs font-semibold rounded-xl p-3.5 text-center mt-2">
                  🎉 Add <strong>₹{(500 - cartTotal).toFixed(2)}</strong> more items to get <strong>FREE</strong> delivery!
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 pt-4 flex items-center justify-between font-extrabold text-slate-800 text-lg">
              <span>Grand Total</span>
              <span className="text-xl text-green-600">₹{grandTotal.toFixed(2)}</span>
            </div>

            {/* Checkout Button */}
            <button
              onClick={handleCheckoutRedirect}
              className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-bold py-4 px-6 rounded-2xl shadow-lg shadow-green-100 hover:shadow-xl transition-all flex items-center justify-center gap-2 group text-base"
            >
              <span>{user ? 'Proceed to Checkout' : 'Login to Checkout'}</span>
              <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
            </button>

            <div className="flex items-center gap-2 text-slate-400 text-xs justify-center font-medium mt-4">
              <ShieldCheck className="h-4 w-4 text-slate-400" />
              <span>Secure Transactions</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Cart;
