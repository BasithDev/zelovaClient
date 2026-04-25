import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiSearch, FiFilter, FiCalendar, FiChevronDown, FiChevronUp, 
  FiPhone, FiMapPin, FiClock, FiPackage, FiDollarSign, FiCreditCard,
  FiDownload, FiRefreshCw
} from 'react-icons/fi';
import { HiOutlineArchiveBox, HiOutlineCurrencyRupee } from 'react-icons/hi2';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { getCurrentOrdersForVendor, getPreviousOrdersOnDateForVendor } from "../../Services/apiServices";

// Skeleton Loader
const OrderSkeleton = () => (
  <div className="bg-white rounded-xl border border-slate-200 p-4 animate-pulse">
    <div className="flex justify-between items-start mb-4">
      <div className="space-y-2">
        <div className="h-4 w-32 bg-slate-200 rounded" />
        <div className="h-3 w-24 bg-slate-200 rounded" />
      </div>
      <div className="h-6 w-20 bg-slate-200 rounded-full" />
    </div>
    <div className="h-px bg-slate-100 my-3" />
    <div className="space-y-2">
      <div className="h-3 w-full bg-slate-200 rounded" />
      <div className="h-3 w-3/4 bg-slate-200 rounded" />
    </div>
  </div>
);

// Empty State
const EmptyState = ({ hasFilters, onClearFilters }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="text-center py-16"
  >
    <div className="w-20 h-20 mx-auto mb-6 bg-slate-100 rounded-full flex items-center justify-center">
      <HiOutlineArchiveBox className="w-10 h-10 text-slate-400" />
    </div>
    <h2 className="text-lg font-semibold text-slate-900 mb-2">
      {hasFilters ? 'No orders match your filters' : 'No orders found'}
    </h2>
    <p className="text-slate-500 text-sm mb-4">
      {hasFilters ? 'Try adjusting your search criteria' : 'Orders will appear here once customers place them'}
    </p>
    {hasFilters && (
      <button
        onClick={onClearFilters}
        className="text-orange-500 hover:text-orange-600 text-sm font-medium"
      >
        Clear all filters
      </button>
    )}
  </motion.div>
);

// Stats Card
const StatCard = ({ icon: Icon, label, value, subValue, color }) => (
  <div className="bg-white rounded-xl border border-slate-200 p-4">
    <div className="flex items-center justify-between">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <div className={`p-2 rounded-lg ${color}`}>
        <Icon className="w-4 h-4 text-white" />
      </div>
    </div>
    <p className="text-2xl font-bold text-slate-900 mt-2">{value}</p>
    {subValue && <p className="text-xs text-slate-400 mt-1">{subValue}</p>}
  </div>
);

// Order Card Component
const OrderCard = ({ order, isExpanded, onToggle }) => {
  const statusColors = {
    'ORDER ACCEPTED': 'bg-emerald-100 text-emerald-700',
    'DELIVERED': 'bg-emerald-100 text-emerald-700',
    'PENDING': 'bg-amber-100 text-amber-700',
    'PREPARING': 'bg-blue-100 text-blue-700',
    'ON THE WAY': 'bg-indigo-100 text-indigo-700',
    'CANCELLED': 'bg-rose-100 text-rose-700',
  };

  const paymentBadge = {
    'UPI': 'bg-purple-100 text-purple-700',
    'CARD': 'bg-blue-100 text-blue-700',
    'COD': 'bg-amber-100 text-amber-700',
    'ZCOINS': 'bg-orange-100 text-orange-700',
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow"
    >
      {/* Header - Always visible */}
      <div 
        className="p-4 cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-slate-900">#{order.orderId}</span>
              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[order.status] || 'bg-slate-100 text-slate-600'}`}>
                {order.status}
              </span>
              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${paymentBadge[order.paymentMethod] || 'bg-slate-100 text-slate-600'}`}>
                {order.paymentMethod}
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1 truncate">{order.user?.name}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="font-bold text-slate-900">₹{order.billDetails?.finalAmount?.toFixed(0)}</p>
            <p className="text-xs text-slate-400">
              {new Date(order.createdAt).toLocaleDateString('en-IN', { 
                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' 
              })}
            </p>
          </div>
        </div>

        {/* Preview items */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
          <p className="text-sm text-slate-600">
            {order.items?.slice(0, 2).map(i => `${i.quantity}x ${i.name}`).join(', ')}
            {order.items?.length > 2 && ` +${order.items.length - 2} more`}
          </p>
          <button className="text-slate-400 hover:text-slate-600 p-1">
            {isExpanded ? <FiChevronUp className="w-5 h-5" /> : <FiChevronDown className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Expanded Details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-slate-100 overflow-hidden"
          >
            <div className="p-4 bg-slate-50 space-y-4">
              {/* Customer Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-start gap-2">
                  <FiPhone className="w-4 h-4 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-400">Phone</p>
                    <p className="text-sm font-medium text-slate-700">{order.user?.phone || 'Not provided'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <FiMapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-400">Delivery Address</p>
                    <p className="text-sm text-slate-700">{order.user?.address || 'Not provided'}</p>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase mb-2">Items Ordered</p>
                <div className="bg-white rounded-lg p-3 space-y-2">
                  {order.items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-slate-700">
                        <span className="font-medium">{item.quantity}x</span> {item.name}
                        {item.customizations?.length > 0 && (
                          <span className="text-xs text-slate-400 ml-1">
                            ({item.customizations.map(c => c.selectedOption?.name).join(', ')})
                          </span>
                        )}
                      </span>
                      <span className="font-medium text-slate-900">₹{item.totalPrice?.toFixed(0) || (item.price * item.quantity).toFixed(0)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bill Details */}
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase mb-2">Bill Summary</p>
                <div className="bg-white rounded-lg p-3 space-y-1.5 text-sm">
                  <div className="flex justify-between text-slate-600">
                    <span>Item Total</span>
                    <span>₹{order.billDetails?.itemTotal?.toFixed(0) || '-'}</span>
                  </div>
                  {order.billDetails?.deliveryFee > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Delivery Fee</span>
                      <span>₹{order.billDetails.deliveryFee.toFixed(0)}</span>
                    </div>
                  )}
                  {order.billDetails?.platformFee > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Platform Fee</span>
                      <span>₹{order.billDetails.platformFee.toFixed(0)}</span>
                    </div>
                  )}
                  {order.billDetails?.tax > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Tax</span>
                      <span>₹{order.billDetails.tax.toFixed(0)}</span>
                    </div>
                  )}
                  {order.billDetails?.totalSavings > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Discount</span>
                      <span>-₹{order.billDetails.totalSavings.toFixed(0)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-slate-900 pt-2 border-t border-slate-100">
                    <span>Total</span>
                    <span>₹{order.billDetails?.finalAmount?.toFixed(0)}</span>
                  </div>
                </div>
              </div>

              {/* Timestamps */}
              <div className="flex items-center gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <FiClock className="w-3 h-3" />
                  Ordered: {new Date(order.createdAt).toLocaleString('en-IN')}
                </span>
                {order.updatedAt && (
                  <span>Updated: {new Date(order.updatedAt).toLocaleString('en-IN')}</span>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);
  
  // Filters
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState({ start: null, end: null });
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      // Fetch both current (live) orders and completed orders
      const [currentResponse, previousResponse] = await Promise.all([
        getCurrentOrdersForVendor(),
        getPreviousOrdersOnDateForVendor(new Date().toISOString().split('T')[0])
      ]);
      
      const currentOrders = currentResponse.data || [];
      const previousOrders = previousResponse.data.orders || [];
      
      // Combine and remove duplicates
      const allOrders = [...currentOrders, ...previousOrders];
      const uniqueOrders = allOrders.filter((order, index, self) => 
        index === self.findIndex((o) => o.orderId === order.orderId)
      );
      
      // Sort by createdAt (newest first)
      uniqueOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      setOrders(uniqueOrders);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Filter orders
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // Search filter
      if (search) {
        const searchLower = search.toLowerCase();
        const matchesSearch = 
          order.orderId?.toLowerCase().includes(searchLower) ||
          order.user?.name?.toLowerCase().includes(searchLower) ||
          order.user?.phone?.includes(search);
        if (!matchesSearch) return false;
      }

      // Status filter
      if (statusFilter !== 'all' && order.status !== statusFilter) return false;

      // Payment filter
      if (paymentFilter !== 'all' && order.paymentMethod !== paymentFilter) return false;

      // Date range filter
      if (dateRange.start && new Date(order.createdAt) < dateRange.start) return false;
      if (dateRange.end) {
        const endOfDay = new Date(dateRange.end);
        endOfDay.setHours(23, 59, 59, 999);
        if (new Date(order.createdAt) > endOfDay) return false;
      }

      return true;
    });
  }, [orders, search, statusFilter, paymentFilter, dateRange]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = filteredOrders.length;
    const revenue = filteredOrders.reduce((sum, o) => sum + (o.billDetails?.finalAmount || 0), 0);
    const avgOrder = total > 0 ? revenue / total : 0;
    return { total, revenue, avgOrder };
  }, [filteredOrders]);

  const hasActiveFilters = search || statusFilter !== 'all' || paymentFilter !== 'all' || dateRange.start || dateRange.end;

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setPaymentFilter('all');
    setDateRange({ start: null, end: null });
  };

  const statusOptions = ['all', 'PENDING', 'PAID', 'PREPARING', 'ON THE WAY', 'DELIVERED', 'ORDER ACCEPTED', 'CANCELLED', 'NOT RECEIVED BY CUSTOMER'];
  const paymentOptions = ['all', 'UPI', 'CARD', 'COD', 'ZCOINS'];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="px-4 lg:px-6 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-xl font-bold text-slate-900">Order History</h1>
              <p className="text-sm text-slate-500 mt-0.5">
                {stats.total} order{stats.total !== 1 ? 's' : ''} • ₹{stats.revenue.toLocaleString()} revenue
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchOrders}
                className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
                title="Refresh"
              >
                <FiRefreshCw className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  showFilters || hasActiveFilters
                    ? 'bg-orange-100 text-orange-700'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <FiFilter className="w-4 h-4" />
                Filters
                {hasActiveFilters && (
                  <span className="w-2 h-2 bg-orange-500 rounded-full" />
                )}
              </button>
            </div>
          </div>

          {/* Search and Quick Filters */}
          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-md">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by order ID, customer name, or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Expanded Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* Date Range */}
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">From Date</label>
                    <DatePicker
                      selected={dateRange.start}
                      onChange={(date) => setDateRange(prev => ({ ...prev, start: date }))}
                      maxDate={new Date()}
                      dateFormat="dd/MM/yyyy"
                      placeholderText="Start date"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">To Date</label>
                    <DatePicker
                      selected={dateRange.end}
                      onChange={(date) => setDateRange(prev => ({ ...prev, end: date }))}
                      maxDate={new Date()}
                      minDate={dateRange.start}
                      dateFormat="dd/MM/yyyy"
                      placeholderText="End date"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  
                  {/* Status */}
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white"
                    >
                      {statusOptions.map(status => (
                        <option key={status} value={status}>
                          {status === 'all' ? 'All Statuses' : status}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Payment Method */}
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Payment</label>
                    <select
                      value={paymentFilter}
                      onChange={(e) => setPaymentFilter(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white"
                    >
                      {paymentOptions.map(method => (
                        <option key={method} value={method}>
                          {method === 'all' ? 'All Methods' : method}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                {hasActiveFilters && (
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={clearFilters}
                      className="text-sm text-orange-500 hover:text-orange-600 font-medium"
                    >
                      Clear all filters
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-4 lg:px-6 py-4">
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            icon={FiPackage}
            label="Total Orders"
            value={stats.total}
            color="bg-blue-500"
          />
          <StatCard
            icon={HiOutlineCurrencyRupee}
            label="Total Revenue"
            value={`₹${stats.revenue.toLocaleString()}`}
            color="bg-emerald-500"
          />
          <StatCard
            icon={FiDollarSign}
            label="Avg Order Value"
            value={`₹${stats.avgOrder.toFixed(0)}`}
            color="bg-purple-500"
          />
        </div>
      </div>

      {/* Orders List */}
      <div className="px-4 lg:px-6 pb-6">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              {[...Array(4)].map((_, i) => <OrderSkeleton key={i} />)}
            </motion.div>
          ) : filteredOrders.length === 0 ? (
            <EmptyState hasFilters={hasActiveFilters} onClearFilters={clearFilters} />
          ) : (
            <motion.div
              key="orders"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              {filteredOrders.map((order, index) => (
                <motion.div
                  key={order._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <OrderCard
                    order={order}
                    isExpanded={expandedOrder === order._id}
                    onToggle={() => setExpandedOrder(expandedOrder === order._id ? null : order._id)}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Orders;