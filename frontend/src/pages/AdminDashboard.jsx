import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  TrendingUp, Package, ShoppingCart, Users, AlertTriangle, 
  Plus, Edit, Trash2, Check, RefreshCw, Printer, X, Eye, DollarSign
} from 'lucide-react';

const AdminDashboard = () => {
  const { token, apiUrl, user } = useAuth();
  const navigate = useNavigate();

  // Navigation tabs
  const [activeTab, setActiveTab] = useState('overview'); // overview, inventory, orders, sales

  // Data states
  const [summary, setSummary] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // Modals & Forms
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null); // For order detail / receipt modal

  // Product Form State
  const [prodName, setProdName] = useState('');
  const [prodCategory, setProdCategory] = useState('Grains & Staples');
  const [prodPrice, setProdPrice] = useState('');
  const [prodStock, setProdStock] = useState('');
  const [prodUnit, setProdUnit] = useState('');
  const [prodImage, setProdImage] = useState('');
  const [prodAvailable, setProdAvailable] = useState(true);

  // Categories
  const categories = [
    'Grains & Staples',
    'Packaged Foods',
    'Beverages',
    'Personal Care',
    'Household Essentials',
    'Dairy & Bakery'
  ];

  useEffect(() => {
    if (!token) {
      navigate('/admin/login');
      return;
    }
    if (user && user.role !== 'admin') {
      navigate('/');
      return;
    }

    fetchSummary();
    fetchProducts();
    fetchOrders();
  }, [token, user, navigate]);

  // Data fetching functions
  const fetchSummary = async () => {
    setLoadingSummary(true);
    try {
      const res = await fetch(`${apiUrl}/admin/dashboard/sales-summary`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSummary(false);
    }
  };

  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const res = await fetch(`${apiUrl}/products/admin-all`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingProducts(false);
    }
  };

  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await fetch(`${apiUrl}/orders/admin`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingOrders(false);
    }
  };

  // Product operations
  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${apiUrl}/products/admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: prodName,
          category: prodCategory,
          price: parseFloat(prodPrice),
          stock_quantity: parseInt(prodStock, 10),
          unit: prodUnit,
          image_url: prodImage,
          is_available: prodAvailable
        })
      });
      if (res.ok) {
        setShowAddModal(false);
        resetProductForm();
        fetchProducts();
        fetchSummary();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to add product');
      }
    } catch (e) {
      alert('Error: ' + e.message);
    }
  };

  const handleEditProduct = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${apiUrl}/products/admin/${selectedProduct.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: prodName,
          category: prodCategory,
          price: parseFloat(prodPrice),
          stock_quantity: parseInt(prodStock, 10),
          unit: prodUnit,
          image_url: prodImage,
          is_available: prodAvailable
        })
      });
      if (res.ok) {
        setShowEditModal(false);
        resetProductForm();
        fetchProducts();
        fetchSummary();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update product');
      }
    } catch (e) {
      alert('Error: ' + e.message);
    }
  };

  const handleDeleteProduct = async (prodId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      const res = await fetch(`${apiUrl}/products/admin/${prodId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchProducts();
        fetchSummary();
      }
    } catch (e) {
      alert('Error: ' + e.message);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const res = await fetch(`${apiUrl}/orders/admin/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ order_status: newStatus })
      });
      if (res.ok) {
        fetchOrders();
        fetchSummary();
        // If order detail modal is open, update its state
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder(prev => ({ ...prev, order_status: newStatus }));
        }
      }
    } catch (e) {
      alert('Failed to update status');
    }
  };

  const handlePaymentChange = async (orderId, newPayStatus) => {
    try {
      const res = await fetch(`${apiUrl}/orders/admin/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ payment_status: newPayStatus })
      });
      if (res.ok) {
        fetchOrders();
        fetchSummary();
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder(prev => ({ ...prev, payment_status: newPayStatus }));
        }
      }
    } catch (e) {
      alert('Failed to update payment status');
    }
  };

  const openEditModal = (prod) => {
    setSelectedProduct(prod);
    setProdName(prod.name);
    setProdCategory(prod.category);
    setProdPrice(prod.price);
    setProdStock(prod.stock_quantity);
    setProdUnit(prod.unit);
    setProdImage(prod.image_url || '');
    setProdAvailable(prod.is_available === 1 || prod.is_available === true);
    setShowEditModal(true);
  };

  const openAddModal = () => {
    resetProductForm();
    setShowAddModal(true);
  };

  const resetProductForm = () => {
    setSelectedProduct(null);
    setProdName('');
    setProdCategory('Grains & Staples');
    setProdPrice('');
    setProdStock('');
    setProdUnit('');
    setProdImage('');
    setProdAvailable(true);
  };

  const printReceipt = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      
      {/* Sidebar Panel */}
      <div className="w-full md:w-64 bg-slate-900 text-white flex-shrink-0 flex flex-col border-r border-slate-800">
        <div className="p-6 border-b border-slate-800 flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-green-500" />
          <span className="font-extrabold text-lg tracking-tight text-white">eXmart Admin</span>
        </div>

        <nav className="flex-1 p-4 space-y-1.5">
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left text-sm font-bold transition-all ${
              activeTab === 'overview'
                ? 'bg-green-600 text-white shadow-md shadow-green-950'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <TrendingUp className="h-4.5 w-4.5" />
            <span>Dashboard Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('inventory')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left text-sm font-bold transition-all ${
              activeTab === 'inventory'
                ? 'bg-green-600 text-white shadow-md shadow-green-950'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Package className="h-4.5 w-4.5" />
            <span>Inventory Management</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left text-sm font-bold transition-all ${
              activeTab === 'orders'
                ? 'bg-green-600 text-white shadow-md shadow-green-950'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <ShoppingCart className="h-4.5 w-4.5" />
            <span>Order Logs</span>
          </button>

          <button
            onClick={() => setActiveTab('sales')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left text-sm font-bold transition-all ${
              activeTab === 'sales'
                ? 'bg-green-600 text-white shadow-md shadow-green-950'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <DollarSign className="h-4.5 w-4.5" />
            <span>Sales & Receipts</span>
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800 text-xs text-slate-500 font-medium">
          Logged in as Admin
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-6 sm:p-10 overflow-y-auto print:bg-white print:p-0">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8 print:hidden">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight capitalize">
              {activeTab} Management
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Store status, stock levels, and customer order management
            </p>
          </div>
          
          <button
            onClick={() => {
              fetchSummary();
              fetchProducts();
              fetchOrders();
            }}
            className="flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 px-4 py-2 rounded-full font-bold text-xs shadow-sm transition"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Reload Logs</span>
          </button>
        </div>

        {/* ================================================== */}
        {/* TAB 1: OVERVIEW */}
        {/* ================================================== */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Stats grid */}
            {loadingSummary ? (
              <p className="text-slate-400 text-sm font-medium">Calculating summaries...</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                
                <div className="bg-white p-6 border border-slate-100 rounded-3xl shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Today's Sales</span>
                    <h3 className="text-2xl font-extrabold text-slate-800 mt-1">₹{(summary?.today?.revenue || 0).toFixed(2)}</h3>
                  </div>
                  <div className="bg-green-50 p-3 rounded-2xl text-green-600">
                    <DollarSign className="h-6 w-6" />
                  </div>
                </div>

                <div className="bg-white p-6 border border-slate-100 rounded-3xl shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Today's Orders</span>
                    <h3 className="text-2xl font-extrabold text-slate-800 mt-1">{summary?.today?.orders || 0}</h3>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-2xl text-blue-600">
                    <ShoppingCart className="h-6 w-6" />
                  </div>
                </div>

                <div className="bg-white p-6 border border-slate-100 rounded-3xl shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">All-Time Revenue</span>
                    <h3 className="text-2xl font-extrabold text-slate-800 mt-1">₹{(summary?.overall?.revenue || 0).toFixed(2)}</h3>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-2xl text-purple-600">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                </div>

                <div className={`p-6 border rounded-3xl shadow-sm flex items-center justify-between transition-all ${
                  (summary?.lowStockCount || 0) > 0 
                    ? 'bg-orange-50 border-orange-100 text-orange-800 animate-pulse'
                    : 'bg-white border-slate-100'
                }`}>
                  <div>
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Low Stock Products</span>
                    <h3 className="text-2xl font-extrabold text-slate-850 mt-1">{summary?.lowStockCount || 0}</h3>
                  </div>
                  <div className={`p-3 rounded-2xl ${
                    (summary?.lowStockCount || 0) > 0 ? 'bg-orange-100 text-orange-600' : 'bg-slate-50 text-slate-400'
                  }`}>
                    <AlertTriangle className="h-6 w-6" />
                  </div>
                </div>

              </div>
            )}

            {/* Best Sellers */}
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
              <h3 className="font-extrabold text-slate-800 text-lg mb-4">Top 5 Best-Selling Products</h3>
              {loadingSummary ? (
                <p className="text-slate-400 text-sm">Computing statistics...</p>
              ) : summary?.bestSellers && summary.bestSellers.length === 0 ? (
                <p className="text-slate-400 text-sm py-4 text-center">No transactions recorded yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                        <th className="pb-3">Product Name</th>
                        <th className="pb-3">Category</th>
                        <th className="pb-3 text-right">Units Sold</th>
                        <th className="pb-3 text-right">Price</th>
                        <th className="pb-3 text-right">Total Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-slate-700">
                      {summary?.bestSellers && summary.bestSellers.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="py-3.5 font-bold text-slate-800">{item.name}</td>
                          <td className="py-3.5 text-xs text-slate-500 font-semibold">{item.category}</td>
                          <td className="py-3.5 text-right font-extrabold text-slate-800">{item.total_qty_sold}</td>
                          <td className="py-3.5 text-right font-semibold">₹{parseFloat(item.price).toFixed(2)}</td>
                          <td className="py-3.5 text-right font-bold text-green-600">₹{parseFloat(item.total_sales).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================================================== */}
        {/* TAB 2: INVENTORY */}
        {/* ================================================== */}
        {activeTab === 'inventory' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex justify-between items-center">
              <h3 className="font-extrabold text-slate-800 text-lg">Product Catalogue</h3>
              <button
                onClick={openAddModal}
                className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-full font-bold text-xs shadow-sm transition"
              >
                <Plus className="h-4 w-4" />
                <span>Add Product</span>
              </button>
            </div>

            {loadingProducts ? (
              <div className="text-center py-10 text-slate-400">Loading products list...</div>
            ) : (
              <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 font-bold uppercase text-[10px] tracking-wider px-6 py-3">
                        <th className="p-4 pl-6">Name</th>
                        <th className="p-4">Category</th>
                        <th className="p-4 text-right">Price</th>
                        <th className="p-4 text-center">Unit</th>
                        <th className="p-4 text-right">Stock</th>
                        <th className="p-4 text-center">Available</th>
                        <th className="p-4 pr-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-slate-700">
                      {products.map((prod) => {
                        const isLowStock = prod.stock_quantity < 10;
                        const isAvailable = prod.is_available === 1 || prod.is_available === true;

                        return (
                          <tr 
                            key={prod.id} 
                            className={`hover:bg-slate-50/50 transition ${isLowStock ? 'bg-orange-50/30' : ''}`}
                          >
                            <td className="p-4 pl-6 font-bold text-slate-800">
                              <div className="flex items-center gap-3">
                                {prod.image_url ? (
                                  <img src={prod.image_url} alt="" className="w-10 h-10 object-contain bg-slate-50 rounded-lg p-1 border" />
                                ) : (
                                  <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-sm">🍎</div>
                                )}
                                <div>
                                  <span className="block truncate max-w-xs">{prod.name}</span>
                                  {isLowStock && (
                                    <span className="inline-block text-[9px] font-extrabold uppercase bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full mt-0.5 low-stock-pulse">
                                      Low Stock
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="p-4 text-xs text-slate-500 font-semibold">{prod.category}</td>
                            <td className="p-4 text-right font-extrabold">₹{parseFloat(prod.price).toFixed(2)}</td>
                            <td className="p-4 text-center font-medium text-slate-500">{prod.unit}</td>
                            <td className={`p-4 text-right font-extrabold ${isLowStock ? 'text-orange-600' : 'text-slate-800'}`}>
                              {prod.stock_quantity}
                            </td>
                            <td className="p-4 text-center">
                              <span className={`inline-flex items-center justify-center h-6 px-2.5 rounded-full text-[10px] font-bold ${
                                isAvailable 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-red-100 text-red-700'
                              }`}>
                                {isAvailable ? 'Yes' : 'No'}
                              </span>
                            </td>
                            <td className="p-4 pr-6 text-right space-x-1.5">
                              <button
                                onClick={() => openEditModal(prod)}
                                className="inline-flex items-center justify-center p-2 rounded-full border border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition"
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(prod.id)}
                                className="inline-flex items-center justify-center p-2 rounded-full border border-red-100 hover:bg-red-50 text-red-400 hover:text-red-600 transition"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================================================== */}
        {/* TAB 3: ORDER LOGS */}
        {/* ================================================== */}
        {activeTab === 'orders' && (
          <div className="space-y-6 animate-fadeIn">
            {loadingOrders ? (
              <div className="text-center py-10 text-slate-400">Loading incoming orders...</div>
            ) : orders.length === 0 ? (
              <p className="text-slate-400 text-sm py-4 text-center">No orders received yet.</p>
            ) : (
              <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 font-bold uppercase text-[10px] tracking-wider p-4">
                        <th className="p-4 pl-6">Order ID</th>
                        <th className="p-4">Customer</th>
                        <th className="p-4 text-right">Total Amount</th>
                        <th className="p-4 text-center">Payment Mode</th>
                        <th className="p-4 text-center">Payment Status</th>
                        <th className="p-4 text-center">Order Status</th>
                        <th className="p-4 pr-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-slate-700">
                      {orders.map((ord) => {
                        const statusColors = {
                          'PLACED': 'bg-blue-100 text-blue-800',
                          'PACKED': 'bg-yellow-100 text-yellow-800',
                          'OUT_FOR_DELIVERY': 'bg-orange-100 text-orange-800',
                          'DELIVERED': 'bg-green-100 text-green-800'
                        };

                        return (
                          <tr key={ord.id} className="hover:bg-slate-50/50">
                            <td className="p-4 pl-6 font-bold text-slate-800">#{ord.id}</td>
                            <td className="p-4">
                              <span className="block font-semibold text-slate-800">{ord.customer_name}</span>
                              <span className="block text-xs text-slate-400">{ord.customer_phone}</span>
                            </td>
                            <td className="p-4 text-right font-extrabold text-green-600">₹{parseFloat(ord.total_amount).toFixed(2)}</td>
                            <td className="p-4 text-center font-bold text-xs text-slate-500">{ord.payment_mode}</td>
                            <td className="p-4 text-center">
                              <select
                                value={ord.payment_status}
                                onChange={(e) => handlePaymentChange(ord.id, e.target.value)}
                                className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border border-transparent focus:outline-none focus:ring-1 focus:ring-slate-350 cursor-pointer ${
                                  ord.payment_status === 'PAID' ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'
                                }`}
                              >
                                <option value="PENDING">PENDING</option>
                                <option value="PAID">PAID</option>
                                <option value="FAILED">FAILED</option>
                              </select>
                            </td>
                            <td className="p-4 text-center">
                              <select
                                value={ord.order_status}
                                onChange={(e) => handleStatusChange(ord.id, e.target.value)}
                                className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border border-transparent focus:outline-none focus:ring-1 focus:ring-slate-350 cursor-pointer ${
                                  statusColors[ord.order_status]
                                }`}
                              >
                                <option value="PLACED">Placed</option>
                                <option value="PACKED">Packed</option>
                                <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                                <option value="DELIVERED">Delivered</option>
                              </select>
                            </td>
                            <td className="p-4 pr-6 text-right">
                              <button
                                onClick={() => setSelectedOrder(ord)}
                                className="inline-flex items-center gap-1 text-xs font-bold text-green-600 border border-green-100 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-full transition"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                <span>Details</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================================================== */}
        {/* TAB 4: SALES & RECEIPTS */}
        {/* ================================================== */}
        {activeTab === 'sales' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h3 className="font-extrabold text-slate-800 text-lg mb-2">Itemized Billing System</h3>
              <p className="text-slate-400 text-sm">Select any delivered or completed orders below to view and generate billing receipts.</p>
            </div>

            {loadingOrders ? (
              <div className="text-center py-10 text-slate-400">Loading order log files...</div>
            ) : orders.filter(ord => ord.order_status === 'DELIVERED').length === 0 ? (
              <p className="text-slate-400 text-sm py-4 text-center">No delivered/completed orders found in the database yet.</p>
            ) : (
              <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 font-bold uppercase text-[10px] tracking-wider p-4">
                        <th className="p-4 pl-6">Receipt ID</th>
                        <th className="p-4">Customer Name</th>
                        <th className="p-4">Total Items</th>
                        <th className="p-4 text-right">Invoice Amount</th>
                        <th className="p-4 text-center">Payment mode</th>
                        <th className="p-4 pr-6 text-right">Generate Bill</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-slate-700">
                      {orders.filter(ord => ord.order_status === 'DELIVERED').map((ord) => (
                        <tr key={ord.id} className="hover:bg-slate-50/50">
                          <td className="p-4 pl-6 font-bold text-slate-800">#REC-{ord.id}</td>
                          <td className="p-4 font-semibold text-slate-800">{ord.customer_name}</td>
                          <td className="p-4 font-medium text-slate-500">{ord.items ? ord.items.reduce((s, i) => s + i.quantity, 0) : 0} items</td>
                          <td className="p-4 text-right font-extrabold text-slate-800">₹{parseFloat(ord.total_amount).toFixed(2)}</td>
                          <td className="p-4 text-center font-bold text-xs text-slate-500">{ord.payment_mode}</td>
                          <td className="p-4 pr-6 text-right">
                            <button
                              onClick={() => setSelectedOrder(ord)}
                              className="inline-flex items-center gap-1 bg-slate-800 hover:bg-slate-900 text-white px-3 py-1.5 rounded-full font-bold text-xs shadow-sm transition"
                            >
                              <Printer className="h-3.5 w-3.5" />
                              <span>View Receipt</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* ================================================== */}
      {/* MODALS */}
      {/* ================================================== */}

      {/* 1. Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-100 max-w-md w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowAddModal(false)} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600">
              <X className="h-5 w-5" />
            </button>
            <h3 className="font-extrabold text-slate-800 text-lg border-b pb-3 mb-4">Add New Product</h3>
            
            <form onSubmit={handleAddProduct} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Product Name</label>
                <input type="text" required placeholder="Tata Salt Lite" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none" value={prodName} onChange={(e) => setProdName(e.target.value)} />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Category</label>
                  <select className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none" value={prodCategory} onChange={(e) => setProdCategory(e.target.value)}>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Unit / Size</label>
                  <input type="text" required placeholder="1kg or 500ml" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none" value={prodUnit} onChange={(e) => setProdUnit(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Price (₹)</label>
                  <input type="number" step="0.01" min="0" required placeholder="48.00" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none" value={prodPrice} onChange={(e) => setProdPrice(e.target.value)} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Stock Quantity</label>
                  <input type="number" min="0" required placeholder="80" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none" value={prodStock} onChange={(e) => setProdStock(e.target.value)} />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Image URL</label>
                <input type="url" placeholder="https://unsplash..." className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none" value={prodImage} onChange={(e) => setProdImage(e.target.value)} />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input type="checkbox" id="addAvailable" checked={prodAvailable} onChange={(e) => setProdAvailable(e.target.checked)} className="h-4 w-4 text-green-600 rounded" />
                <label htmlFor="addAvailable" className="text-sm font-bold text-slate-700">Make Available immediately</label>
              </div>

              <button type="submit" className="w-full bg-green-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-green-100 hover:bg-green-700 transition mt-4 text-sm">
                Create Product
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 2. Edit Product Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-100 max-w-md w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowEditModal(false)} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600">
              <X className="h-5 w-5" />
            </button>
            <h3 className="font-extrabold text-slate-800 text-lg border-b pb-3 mb-4">Edit Product Detail</h3>
            
            <form onSubmit={handleEditProduct} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Product Name</label>
                <input type="text" required placeholder="Tata Salt Lite" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none" value={prodName} onChange={(e) => setProdName(e.target.value)} />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Category</label>
                  <select className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none" value={prodCategory} onChange={(e) => setProdCategory(e.target.value)}>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Unit / Size</label>
                  <input type="text" required placeholder="1kg or 500ml" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none" value={prodUnit} onChange={(e) => setProdUnit(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Price (₹)</label>
                  <input type="number" step="0.01" min="0" required placeholder="48.00" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none" value={prodPrice} onChange={(e) => setProdPrice(e.target.value)} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Stock Quantity</label>
                  <input type="number" min="0" required placeholder="80" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none" value={prodStock} onChange={(e) => setProdStock(e.target.value)} />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Image URL</label>
                <input type="url" placeholder="https://unsplash..." className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none" value={prodImage} onChange={(e) => setProdImage(e.target.value)} />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input type="checkbox" id="editAvailable" checked={prodAvailable} onChange={(e) => setProdAvailable(e.target.checked)} className="h-4 w-4 text-green-600 rounded" />
                <label htmlFor="editAvailable" className="text-sm font-bold text-slate-700">Make Available in store</label>
              </div>

              <button type="submit" className="w-full bg-green-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-green-100 hover:bg-green-700 transition mt-4 text-sm">
                Save Changes
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 3. Order Details & Printable Billing Receipt Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4 print:relative print:bg-white print:p-0 animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-100 max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto print:max-h-none print:w-full print:border-none print:shadow-none">
            
            {/* Close / Action controls - Hidden in Print */}
            <div className="absolute right-4 top-4 flex gap-2 print:hidden">
              <button onClick={printReceipt} className="inline-flex p-2 rounded-full border border-slate-200 hover:bg-slate-100 text-slate-600 transition" title="Print Invoice">
                <Printer className="h-4 w-4" />
              </button>
              <button onClick={() => setSelectedOrder(null)} className="inline-flex p-2 rounded-full border border-slate-200 hover:bg-slate-100 text-slate-600 transition">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Receipt Form Design */}
            <div className="mt-2 space-y-6">
              
              {/* Receipt Header */}
              <div className="text-center pb-4 border-b border-dashed border-slate-200">
                <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">VIVIRA SUPERMARKET</h2>
                <p className="text-xs text-slate-400 font-semibold mt-1">123 Green Lane, Indiranagar, Bangalore - 560038</p>
                <p className="text-xs text-slate-400 font-medium mt-0.5">Phone: +91 98765 43210 | Support: help@exmart.com</p>
                
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-700 bg-slate-50 py-1.5 rounded-full mt-4 max-w-[200px] mx-auto">
                  Retail Invoice
                </h3>
              </div>

              {/* Transaction Metadata */}
              <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-600">
                <div>
                  <p><span className="text-slate-400">Invoice No:</span> #REC-{selectedOrder.id}</p>
                  <p className="mt-1"><span className="text-slate-400">Date:</span> {new Date(selectedOrder.created_at).toLocaleDateString('en-IN')}</p>
                  <p className="mt-1"><span className="text-slate-400">Payment:</span> {selectedOrder.payment_mode} ({selectedOrder.payment_status})</p>
                </div>
                <div className="text-right">
                  <p className="font-extrabold text-slate-800">{selectedOrder.customer_name}</p>
                  <p className="mt-1">{selectedOrder.customer_phone}</p>
                  <p className="mt-1 text-slate-400 truncate max-w-[180px] ml-auto" title={selectedOrder.delivery_address}>{selectedOrder.delivery_address}</p>
                </div>
              </div>

              {/* Invoice Itemized table */}
              <div>
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-y border-dashed border-slate-200 text-slate-500 font-bold uppercase text-[9px] tracking-wider">
                      <th className="py-2.5">Item Description</th>
                      <th className="py-2.5 text-center">Unit</th>
                      <th className="py-2.5 text-right">Price</th>
                      <th className="py-2.5 text-center">Qty</th>
                      <th className="py-2.5 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dashed divide-slate-100 text-slate-700">
                    {selectedOrder.items && selectedOrder.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-3 font-bold text-slate-850">{item.name}</td>
                        <td className="py-3 text-center text-slate-400 font-semibold">{item.unit}</td>
                        <td className="py-3 text-right font-medium">₹{parseFloat(item.price_at_order).toFixed(2)}</td>
                        <td className="py-3 text-center font-extrabold text-slate-800">{item.quantity}</td>
                        <td className="py-3 text-right font-bold text-slate-800">₹{(parseFloat(item.price_at_order) * item.quantity).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Total calculations */}
              <div className="border-t border-dashed border-slate-200 pt-4 flex flex-col items-end text-xs font-semibold text-slate-600 gap-1.5">
                <div className="flex justify-between w-48">
                  <span>Item Subtotal:</span>
                  <span className="text-slate-800 font-bold">
                    ₹{(parseFloat(selectedOrder.total_amount) - (parseFloat(selectedOrder.total_amount) > 499 ? 0 : 39) - 15).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between w-48">
                  <span>Delivery Charge:</span>
                  <span className="text-slate-800 font-bold">
                    ₹{(parseFloat(selectedOrder.total_amount) > 499 ? 0 : 39).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between w-48">
                  <span>Handling Fee:</span>
                  <span className="text-slate-800 font-bold">₹15.00</span>
                </div>
                <div className="flex justify-between w-48 border-t border-dashed border-slate-200 pt-2 font-black text-sm text-green-700">
                  <span>Invoice Total:</span>
                  <span>₹{parseFloat(selectedOrder.total_amount).toFixed(2)}</span>
                </div>
              </div>

              {/* Receipt Footer */}
              <div className="text-center border-t border-dashed border-slate-200 pt-4 pb-2">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Thank you for your purchase!</p>
                <p className="text-[9px] text-slate-400 font-medium mt-1">This is an computer generated receipt, no signature required.</p>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
