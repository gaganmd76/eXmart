import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { Search, ShoppingCart, Tag, Filter, Check, ShoppingBag, Loader2 } from 'lucide-react';

const CustomerHome = ({ searchVal }) => {
  const { apiUrl } = useAuth();
  const { addToCart, cartItems } = useCart();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([
    'All Categories',
    'Grains & Staples',
    'Packaged Foods',
    'Beverages',
    'Personal Care',
    'Household Essentials',
    'Dairy & Bakery'
  ]);
  const [activeCategory, setActiveCategory] = useState('All Categories');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addedItemMap, setAddedItemMap] = useState({});

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        let url = `${apiUrl}/products`;
        const params = [];
        if (activeCategory !== 'All Categories') {
          params.push(`category=${encodeURIComponent(activeCategory)}`);
        }
        if (searchVal) {
          params.push(`search=${encodeURIComponent(searchVal)}`);
        }
        if (params.length > 0) {
          url += `?${params.join('&')}`;
        }

        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to load products');
        const data = await res.json();
        setProducts(data);
      } catch (err) {
        console.error(err);
        setError('Failed to fetch groceries. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [activeCategory, searchVal, apiUrl]);

  const handleAddToCart = async (product) => {
    try {
      // Find current quantity in cart if exists
      const cartItem = cartItems.find(item => item.product_id === product.id || item.id === product.id);
      const currentQty = cartItem ? cartItem.quantity : 0;
      
      if (product.stock_quantity <= currentQty) {
        alert(`Cannot add more. Only ${product.stock_quantity} item(s) are available in stock.`);
        return;
      }

      await addToCart(product, currentQty + 1);
      
      // Temporarily mark as added
      setAddedItemMap(prev => ({ ...prev, [product.id]: true }));
      setTimeout(() => {
        setAddedItemMap(prev => ({ ...prev, [product.id]: false }));
      }, 1500);
    } catch (err) {
      alert(err.message || 'Failed to add item to cart');
    }
  };

  const getProductCartQuantity = (prodId) => {
    const item = cartItems.find(item => item.product_id === prodId || item.id === prodId);
    return item ? item.quantity : 0;
  };

  const categoryIcons = {
    'All Categories': '🛒',
    'Grains & Staples': '🌾',
    'Packaged Foods': '🍪',
    'Beverages': '🥤',
    'Personal Care': '🧼',
    'Household Essentials': '🧹',
    'Dairy & Bakery': '🥛'
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      
      {/* Banner */}
      <div className="relative rounded-3xl overflow-hidden mb-8 sm:mb-12 bg-gradient-to-r from-green-600 via-green-500 to-emerald-500 text-white shadow-xl shadow-green-100 py-12 px-6 sm:px-12 flex flex-col md:flex-row items-center justify-between">
        <div className="max-w-md text-center md:text-left z-10">
          <span className="bg-green-700/40 text-green-100 text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full">
            ⚡ eXmart Super-Fast Delivery
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mt-4 leading-tight">
            Daily Groceries <br className="hidden sm:inline" />
            Delivered in Minutes
          </h1>
          <p className="mt-3 text-green-100 text-sm sm:text-base font-medium">
            Get grains, staples, personal care, and dairy items delivered instantly. No fresh produce, only fresh standards.
          </p>
        </div>
        <div className="hidden md:block w-72 h-48 opacity-90 text-[180px] select-none text-right filter drop-shadow-2xl">
          🛒
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Category Sidebar - Desktop */}
        <div className="hidden lg:block lg:col-span-1">
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm sticky top-28">
            <h3 className="font-bold text-slate-800 text-base mb-4 flex items-center gap-2">
              <Filter className="h-4 w-4 text-green-600" />
              <span>Categories</span>
            </h3>
            <div className="space-y-1.5">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-left text-sm font-semibold transition-all ${
                    activeCategory === cat
                      ? 'bg-green-50 text-green-700 border-l-4 border-green-500'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-green-600'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <span className="text-base">{categoryIcons[cat]}</span>
                    <span>{cat}</span>
                  </span>
                  {activeCategory === cat && <Check className="h-4 w-4 text-green-700" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Categories Carousel - Mobile */}
        <div className="lg:hidden col-span-1 overflow-x-auto no-scrollbar py-2 -mx-4 px-4 flex space-x-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-bold transition-all border ${
                activeCategory === cat
                  ? 'bg-green-500 text-white border-green-500 shadow-md shadow-green-100'
                  : 'bg-white text-slate-600 border-slate-100 hover:bg-slate-50'
              }`}
            >
              <span>{categoryIcons[cat]}</span>
              <span>{cat}</span>
            </button>
          ))}
        </div>

        {/* Product Grid & Search */}
        <div className="col-span-1 lg:col-span-3">
          
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-extrabold text-2xl text-slate-800 tracking-tight">
                {activeCategory === 'All Categories' ? 'All Groceries' : activeCategory}
              </h2>
              <p className="text-slate-400 text-xs mt-1">
                Showing {products.length} products
              </p>
            </div>
          </div>

          {/* Loading state */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-10 w-10 text-green-500 animate-spin" />
              <p className="text-slate-400 text-sm mt-3 font-medium">Stocking the shelves...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 text-red-600 rounded-2xl p-6 text-center border border-red-100">
              <p className="font-semibold">{error}</p>
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white border border-slate-100 rounded-3xl p-12 text-center shadow-sm">
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="font-bold text-slate-800 text-lg">No products found</h3>
              <p className="text-slate-400 text-sm mt-2 max-w-sm mx-auto">
                We couldn't find any products matching "{searchVal}" in this category. Try a different search!
              </p>
              <button
                onClick={() => {
                  setActiveCategory('All Categories');
                }}
                className="mt-6 bg-green-500 text-white text-xs font-bold px-6 py-2.5 rounded-full hover:bg-green-600 transition"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {products.map((prod) => {
                const cartQty = getProductCartQuantity(prod.id);
                const isAdded = addedItemMap[prod.id];
                const isLowStock = prod.stock_quantity < 10;
                const isOutOfStock = prod.stock_quantity <= 0;

                return (
                  <div
                    key={prod.id}
                    className="premium-card bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between"
                  >
                    {/* Image Box */}
                    <div className="relative aspect-square w-full bg-slate-50 border-b border-slate-50 flex items-center justify-center p-4">
                      {prod.image_url ? (
                        <img
                          src={prod.image_url}
                          alt={prod.name}
                          className="object-contain h-full w-full max-h-40 rounded-xl transition duration-500 group-hover:scale-105"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400';
                          }}
                        />
                      ) : (
                        <div className="text-4xl text-slate-300">🍎</div>
                      )}
                      
                      {/* Tags (Low stock/Out of stock) */}
                      {isOutOfStock ? (
                        <div className="absolute top-3 left-3 bg-red-500 text-white text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full shadow-sm">
                          Sold Out
                        </div>
                      ) : isLowStock ? (
                        <div className="absolute top-3 left-3 bg-orange-500 text-white text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full shadow-sm low-stock-pulse">
                          Only {prod.stock_quantity} left
                        </div>
                      ) : null}

                      {/* Category Badge */}
                      <span className="absolute top-3 right-3 bg-slate-100/90 text-slate-600 text-[10px] font-bold px-2.5 py-1 rounded-full backdrop-blur-sm">
                        {prod.category}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <p className="text-xs text-slate-400 font-semibold">{prod.unit}</p>
                        <h4 className="font-bold text-slate-800 text-sm sm:text-base mt-1 line-clamp-2 h-10 sm:h-12">
                          {prod.name}
                        </h4>
                      </div>

                      <div className="flex items-center justify-between mt-4">
                        <div className="flex flex-col">
                          <span className="font-extrabold text-lg text-slate-900">₹{parseFloat(prod.price).toFixed(2)}</span>
                        </div>

                        {/* Add to Cart button */}
                        {isOutOfStock ? (
                          <button
                            disabled
                            className="bg-slate-100 text-slate-400 text-xs font-bold px-4 py-2.5 rounded-full cursor-not-allowed"
                          >
                            Out of Stock
                          </button>
                        ) : (
                          <button
                            onClick={() => handleAddToCart(prod)}
                            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-bold shadow-sm transition-all ${
                              isAdded
                                ? 'bg-green-600 text-white'
                                : 'bg-green-500 text-white hover:bg-green-600 hover:shadow-md'
                            }`}
                          >
                            {isAdded ? (
                              <>
                                <Check className="h-3.5 w-3.5" />
                                <span>Added</span>
                              </>
                            ) : (
                              <>
                                <ShoppingCart className="h-3.5 w-3.5" />
                                <span>Add{cartQty > 0 ? ` (${cartQty})` : ''}</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>

      </div>

    </div>
  );
};

export default CustomerHome;
