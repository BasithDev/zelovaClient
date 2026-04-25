import { FaShoppingBag, FaCheckCircle, FaTruck, FaSpinner } from "react-icons/fa";
import { HiTrendingUp, HiTrendingDown, HiClock, HiCurrencyRupee, HiShoppingCart, HiArchive } from "react-icons/hi";
import { FaMoneyBillWave } from "react-icons/fa";
import { getCurrentOrdersForVendor, updateOrderStatus } from "../../Services/apiServices";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getDashboardDataForVendor, getVendorReports, exportVendorReportToPDF, exportVendorReportToExcel } from '../../Services/apiServices';
import NumberFlow from '@number-flow/react';
import AnalyticsDashboard from '../../Components/AnalyticsDashboard/AnalyticsDashboard';

// Clean shadcn-style KPI Card Component
const KPICard = ({ icon: Icon, label, value, trend, iconBg, prefix = '' }) => {
  const isPositive = trend > 0;
  const isNeutral = trend === 0 || trend === undefined;
  
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <div className={`p-2 rounded-lg ${iconBg}`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
      </div>
      <div className="mt-2">
        <div className="text-2xl font-bold text-slate-900 flex items-baseline">
          {prefix && <span className="text-xl mr-0.5">{prefix}</span>}
          <NumberFlow 
            value={typeof value === 'number' ? value : 0} 
            format={{ notation: 'compact', maximumFractionDigits: 1 }}
          />
        </div>
        {!isNeutral && (
          <p className={`text-xs mt-1 flex items-center gap-1 ${isPositive ? 'text-emerald-600' : 'text-rose-500'}`}>
            {isPositive ? <HiTrendingUp className="w-3 h-3" /> : <HiTrendingDown className="w-3 h-3" />}
            <span>{Math.abs(trend)}% from yesterday</span>
          </p>
        )}
      </div>
    </div>
  );
};

// KPI Skeleton for loading state
const KPICardSkeleton = () => (
  <div className="bg-white rounded-lg border border-slate-200 p-4 animate-pulse">
    <div className="flex items-center justify-between">
      <div className="h-4 w-24 bg-slate-200 rounded" />
      <div className="h-8 w-8 bg-slate-200 rounded-lg" />
    </div>
    <div className="mt-2">
      <div className="h-8 w-20 bg-slate-200 rounded" />
      <div className="h-3 w-28 bg-slate-200 rounded mt-2" />
    </div>
  </div>
);

// Order Status Badge
const OrderStatusBadge = ({ status }) => {
  const statusConfig = {
    'PENDING': { bg: 'bg-amber-100', text: 'text-amber-700', icon: HiClock },
    'PAID': { bg: 'bg-purple-100', text: 'text-purple-700', icon: FaMoneyBillWave },
    'PREPARING': { bg: 'bg-blue-100', text: 'text-blue-700', icon: FaSpinner, spin: true },
    'ON THE WAY': { bg: 'bg-indigo-100', text: 'text-indigo-700', icon: FaTruck },
    'DELIVERED': { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: FaCheckCircle },
    'NOT RECEIVED BY CUSTOMER': { bg: 'bg-red-100', text: 'text-red-700', icon: FaCheckCircle }
  };
  const config = statusConfig[status?.toUpperCase()] || statusConfig['PENDING'];
  const IconComponent = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      <IconComponent className={`w-3 h-3 ${config.spin ? 'animate-spin' : ''}`} />
      {status}
    </span>
  );
};

// Live Order Card Component - Simple style with full items list
const LiveOrderCard = ({ order, onStatusChange }) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    className="bg-white rounded-lg p-4 border border-slate-200 hover:shadow-sm transition-all"
  >
    <div className="flex items-start justify-between gap-3 mb-3">
      <div>
        <p className="text-xs text-slate-500 mb-1">Order #{order.orderId?.slice(-8)}</p>
        <p className="font-semibold text-slate-900">{order.user?.name}</p>
      </div>
      <OrderStatusBadge status={order.status} />
    </div>

    <div className="bg-slate-50 rounded-lg p-3 mb-3">
      <div className="space-y-1 text-sm max-h-32 overflow-y-auto">
        {order.items?.map((item, idx) => (
          <div key={idx} className="flex justify-between text-slate-600">
            <span>{item.quantity}x {item.name}</span>
            <span className="font-medium">₹{(item.price * item.quantity).toFixed(0)}</span>
          </div>
        ))}
      </div>
      <div className="mt-2 pt-2 border-t border-slate-200 flex justify-between font-semibold text-slate-900">
        <span>Total</span>
        <span>₹{order.billDetails?.finalAmount?.toFixed(0)}</span>
      </div>
    </div>

    <select
      value={order.status}
      onChange={(e) => onStatusChange(order.orderId, e.target.value, order.user?.name)}
      className="w-full text-sm px-3 py-2 bg-slate-100 border-0 rounded-lg focus:ring-2 focus:ring-blue-500 cursor-pointer"
    >
      <option value="PENDING">Pending</option>
      <option value="PREPARING">Preparing</option>
      <option value="ON THE WAY">On The Way</option>
      <option value="DELIVERED">Delivered</option>
    </select>

    <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
      <HiClock className="w-3 h-3" />
      {new Date(order?.createdAt?.$date || order?.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
    </p>
  </motion.div>
);

const VendorHome = () => {
  const queryClient = useQueryClient();
  
  const { data: response = {}, isError } = useQuery({
    queryKey: ['vendorOrders'],
    queryFn: getCurrentOrdersForVendor,
    refetchInterval: 30000,
    staleTime: 5000,
  });

  useEffect(() => {
    let eventSource = null;
    let reconnectTimeout = null;
    const connectSSE = () => {
      eventSource = new EventSource('/api/vendor/orders/stream', { withCredentials: true });
      eventSource.addEventListener('connected', (event) => {
        console.log('[SSE] Connected to order stream');
      });
      eventSource.addEventListener('new-order', (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('[SSE] New order received:', data.order?.orderId);
          queryClient.setQueryData(['vendorOrders'], (old) => {
            const existingOrders = old?.data || [];
            if (existingOrders.some(o => o.orderId === data.order.orderId)) {
              return old;
            }
            return { ...old, data: [data.order, ...existingOrders] };
          });
        } catch (err) {
          console.error('[SSE] Error parsing new order:', err);
        }
      });
      eventSource.addEventListener('heartbeat', () => {});
      eventSource.onerror = (error) => {
        console.log('[SSE] Connection error, will reconnect...');
        eventSource.close();
        reconnectTimeout = setTimeout(connectSSE, 5000);
      };
    };
    connectSSE();
    return () => {
      if (eventSource) eventSource.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [queryClient]);

  const [dashboardData, setDashboardData] = useState(null);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await getDashboardDataForVendor();
        setDashboardData(response.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setDashboardData({
          todaysOrdersCount: 0,
          todaysOrdersPendingCount: 0,
          totalOrders: 0,
          totalSales: 0,
          totalProfit: 0
        });
      } finally {
        setIsLoadingDashboard(false);
      }
    };
    fetchDashboardData();
  }, []);

  const orders = response?.data || [];
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, orderId: null, newStatus: null, customerName: null });

  const handleStatusChange = async (orderId, newStatus, customerName) => {
    setConfirmDialog({ isOpen: true, orderId, newStatus, customerName });
  };

  const confirmStatusChange = async () => {
    try {
      await updateOrderStatus({
        orderId: confirmDialog.orderId,
        status: confirmDialog.newStatus
      });
      await queryClient.invalidateQueries(['vendorOrders']);
      setConfirmDialog({ isOpen: false, orderId: null, newStatus: null, customerName: null });
    } catch (error) {
      console.error('Failed to update order status:', error);
    }
  };

  return (
    <div className="h-[calc(100vh-64px)] lg:h-screen bg-slate-50 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 lg:px-6 py-3 flex-shrink-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-sm text-slate-500">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </p>
          </div>
          {orders.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              {orders.length} live order{orders.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 lg:px-6 py-4 overflow-hidden">
        <div className="flex flex-col lg:flex-row gap-4 h-full">
          
          {/* Left Column - KPIs + Analytics (65%) */}
          <div className="w-full lg:w-[65%] flex flex-col gap-4 overflow-y-auto">
            {/* Row 1: Order KPIs (3 cards) */}
            <AnimatePresence mode="wait">
              {isLoadingDashboard ? (
                <motion.div
                  key="kpi-skeleton-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="grid grid-cols-3 gap-3"
                >
                  <KPICardSkeleton />
                  <KPICardSkeleton />
                  <KPICardSkeleton />
                </motion.div>
              ) : (
                <motion.div
                  key="kpi-content-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-3 gap-3"
                >
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                    <KPICard 
                      icon={HiShoppingCart} 
                      label="Today's Orders" 
                      value={dashboardData?.todaysOrdersCount || 0} 
                      iconBg="bg-blue-500" 
                    />
                  </motion.div>
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <KPICard 
                      icon={HiClock} 
                      label="Pending" 
                      value={dashboardData?.todaysOrdersPendingCount || 0} 
                      iconBg="bg-amber-500" 
                    />
                  </motion.div>
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                    <KPICard 
                      icon={HiArchive} 
                      label="Total Orders" 
                      value={dashboardData?.totalOrders || 0} 
                      iconBg="bg-purple-500" 
                    />
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Row 2: Sales & Profit (2 cards) */}
            <AnimatePresence mode="wait">
              {isLoadingDashboard ? (
                <motion.div
                  key="kpi-skeleton-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="grid grid-cols-2 gap-3"
                >
                  <KPICardSkeleton />
                  <KPICardSkeleton />
                </motion.div>
              ) : (
                <motion.div
                  key="kpi-content-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  className="grid grid-cols-2 gap-3"
                >
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <KPICard 
                      icon={HiCurrencyRupee} 
                      label="Total Sales" 
                      value={dashboardData?.totalSales || 0} 
                      prefix="₹"
                      trend={12}
                      iconBg="bg-emerald-500"
                    />
                  </motion.div>
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                    <KPICard 
                      icon={HiTrendingUp} 
                      label="Total Profit" 
                      value={dashboardData?.totalProfit || 0} 
                      prefix="₹"
                      trend={8}
                      iconBg="bg-rose-500"
                    />
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Analytics Dashboard */}
            <div className="flex-1 min-h-0">
              <AnalyticsDashboard
                fetchReports={getVendorReports}
                exportReportToPDF={exportVendorReportToPDF}
                exportReportToExcel={exportVendorReportToExcel}
              />
            </div>
          </div>

          {/* Right Column - Live Orders (35%) */}
          <div className="w-full lg:w-[35%] flex flex-col min-h-0">
            <div className="bg-white rounded-lg border border-slate-200 flex flex-col h-full">
              {/* Live Orders Header */}
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold text-slate-900">Live Orders</h2>
                  {orders.length > 0 && (
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                      {orders.length}
                    </span>
                  )}
                </div>
              </div>

              {/* Orders List - Scrollable */}
              <div className="p-4 space-y-3 flex-1 overflow-y-auto">
                {isError ? (
                  <div className="text-center py-8">
                    <p className="text-rose-500 text-sm">Failed to load orders</p>
                  </div>
                ) : (
                  <AnimatePresence mode="popLayout">
                    {orders.length > 0 ? (
                      orders.map((order) => (
                        <LiveOrderCard
                          key={order.orderId}
                          order={order}
                          onStatusChange={handleStatusChange}
                        />
                      ))
                    ) : (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-12"
                      >
                        <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                          <FaShoppingBag className="w-8 h-8 text-slate-400" />
                        </div>
                        <p className="text-slate-500 font-medium">No live orders</p>
                        <p className="text-slate-400 text-sm mt-1">New orders will appear here</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Confirmation Dialog */}
      <AnimatePresence>
        {confirmDialog.isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            >
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                  <FaSpinner className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Update Order Status</h3>
                <p className="text-sm text-slate-600 mb-1">
                  Order: <span className="font-medium">#{confirmDialog.orderId?.slice(-8)}</span>
                </p>
                <p className="text-sm text-slate-600 mb-4">
                  Change status to <span className="font-semibold text-blue-600">{confirmDialog.newStatus}</span>?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setConfirmDialog({ isOpen: false, orderId: null, newStatus: null, customerName: null })}
                    className="flex-1 px-4 py-2.5 text-slate-700 bg-slate-100 rounded-xl font-medium hover:bg-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmStatusChange}
                    className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VendorHome;