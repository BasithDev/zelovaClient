import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { LuSearch, LuClipboardList, LuEye, LuX } from 'react-icons/lu';
import { FiRefreshCw, FiCheckCircle, FiXCircle, FiDollarSign, FiAlertCircle } from 'react-icons/fi';
import { HiOutlineExclamation } from 'react-icons/hi';
import AdminSearchBar from '../../Components/SearchBar/AdminSearchBar';
import { StatCard, CustomDropdown, TableSkeleton } from '../../Components/Admin';
import { toast } from 'react-hot-toast';
import { getUserIssues, resolveUserIssues, ignoreUserIssues, refundUserIssues, getOrderDetails } from '../../Services/apiServices';

// Issue Card
const IssueCard = ({ issue, onResolve, onIgnore, onRefund, onViewOrder, loadingStates }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow"
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
            <HiOutlineExclamation className="w-5 h-5 text-rose-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-900 truncate">{issue.userName}</h3>
              {issue.refundAmount > 0 && (
                <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">
                  ₹{issue.refundAmount} Refund
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 truncate">{issue.email}</p>
          </div>
          <span className="px-2 py-1 text-xs font-medium bg-slate-100 text-slate-600 rounded-lg shrink-0">
            {issue.problemType}
          </span>
        </div>

        {/* Description */}
        <p className="text-sm text-slate-600 mb-3 line-clamp-2">{issue.description}</p>

        {/* Order ID */}
        {issue.orderId && (
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
            <LuClipboardList className="w-3.5 h-3.5" />
            <span className="font-mono">Order: {issue.orderId.substring(0, 12)}...</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => onResolve(issue._id)}
            disabled={loadingStates[`resolve_${issue._id}`]}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
          >
            {loadingStates[`resolve_${issue._id}`] ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <FiCheckCircle className="w-3.5 h-3.5" />
                Resolve
              </>
            )}
          </button>
          
          {issue.refundAmount > 0 && (
            <button
              onClick={() => onRefund(issue)}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <FiDollarSign className="w-3.5 h-3.5" />
              Refund
            </button>
          )}
          
          <button
            onClick={() => onIgnore(issue._id)}
            disabled={loadingStates[`ignore_${issue._id}`]}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 disabled:opacity-50"
          >
            {loadingStates[`ignore_${issue._id}`] ? (
              <span className="w-4 h-4 border-2 border-slate-400/30 border-t-slate-400 rounded-full animate-spin" />
            ) : (
              <>
                <FiXCircle className="w-3.5 h-3.5" />
                Ignore
              </>
            )}
          </button>
          
          {issue.orderId && (
            <button
              onClick={() => onViewOrder(issue)}
              className="px-3 py-2 text-xs font-medium bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200"
            >
              <LuEye className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Order Details Modal
const OrderDetailsModal = ({ issue, orderDetails, loadingOrder, onClose }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
    onClick={onClose}
  >
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.95, opacity: 0 }}
      className="bg-white rounded-xl max-w-lg w-full max-h-[85vh] overflow-hidden"
      onClick={e => e.stopPropagation()}
    >
      <div className="flex items-center justify-between p-4 border-b border-slate-100">
        <h3 className="text-lg font-semibold text-slate-900">Order Details</h3>
        <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
          <LuX className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 overflow-y-auto max-h-[70vh]">
        {loadingOrder ? (
          <div className="flex items-center justify-center py-12">
            <span className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : orderDetails ? (
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-500 mb-1">Order ID</p>
              <p className="text-sm font-mono text-slate-900">{issue.orderId}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500 mb-1">Restaurant</p>
                <p className="text-sm font-medium text-slate-900">{orderDetails.restaurantName}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500 mb-1">Status</p>
                <p className="text-sm font-medium text-slate-900 capitalize">{orderDetails.status}</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-500 mb-1">Date</p>
              <p className="text-sm text-slate-900">{orderDetails.orderDate}</p>
            </div>

            {orderDetails.items && orderDetails.items.length > 0 && (
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500 mb-2">Items</p>
                <div className="space-y-2">
                  {orderDetails.items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-slate-700">{item.name} x{item.quantity}</span>
                      <span className="font-medium text-slate-900">₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-slate-200 flex justify-between">
                  <span className="font-medium text-slate-900">Total</span>
                  <span className="font-bold text-slate-900">₹{orderDetails.totalAmount?.toFixed(2)}</span>
                </div>
              </div>
            )}

            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-500 mb-1">Delivery Address</p>
              <p className="text-sm text-slate-900">{orderDetails.deliveryAddress}</p>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500">
            Failed to load order details
          </div>
        )}
      </div>
    </motion.div>
  </motion.div>
);

// Refund Modal
const RefundModal = ({ issue, refundAmount, setRefundAmount, onSubmit, onClose, isLoading }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
    onClick={onClose}
  >
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.95, opacity: 0 }}
      className="bg-white rounded-xl max-w-md w-full p-6"
      onClick={e => e.stopPropagation()}
    >
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Process Refund</h3>
      
      <div className="space-y-4 mb-6">
        <div className="p-3 bg-slate-50 rounded-lg">
          <p className="text-xs text-slate-500 mb-1">User</p>
          <p className="text-sm font-medium text-slate-900">{issue?.userName}</p>
          <p className="text-xs text-slate-500">{issue?.email}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Refund Amount (Z-Coins)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
            <input
              type="number"
              value={refundAmount}
              onChange={(e) => setRefundAmount(e.target.value)}
              className="w-full pl-8 pr-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              min="0"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 px-4 py-2.5 text-sm font-medium bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
        >
          Cancel
        </button>
        <button
          onClick={onSubmit}
          disabled={isLoading}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            'Add to Z-Coins'
          )}
        </button>
      </div>
    </motion.div>
  </motion.div>
);

const UserIssues = () => {
  const queryClient = useQueryClient();
  const [loadingStates, setLoadingStates] = useState({});
  const [search, setSearch] = useState('');
  const [problemFilter, setProblemFilter] = useState('all');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Modals
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [refundAmount, setRefundAmount] = useState('');
  const [orderDetails, setOrderDetails] = useState(null);
  const [loadingOrder, setLoadingOrder] = useState(false);

  // React Query - fetch issues with caching
  const { data: issues = [], isLoading, refetch } = useQuery({
    queryKey: ['adminIssues'],
    queryFn: async () => {
      const { data } = await getUserIssues();
      if (data.success) {
        return data.issues.map(issue => ({
          ...issue,
          userName: issue.username,
          email: issue.userEmail,
          problemType: issue.problemOn,
          refundAmount: issue.refund || 0
        }));
      }
      return [];
    },
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });

  // Stats computed from issues
  const stats = useMemo(() => ({
    total: issues.length,
    withRefund: issues.filter(i => i.refundAmount > 0).length,
    totalRefundAmount: issues.reduce((sum, i) => sum + (i.refundAmount || 0), 0)
  }), [issues]);

  // Filter issues with useMemo
  const filteredIssues = useMemo(() => {
    let filtered = [...issues];
    
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(issue => 
        issue.userName?.toLowerCase().includes(searchLower) ||
        issue.email?.toLowerCase().includes(searchLower) ||
        issue.orderId?.toLowerCase().includes(searchLower) ||
        issue.description?.toLowerCase().includes(searchLower)
      );
    }

    if (problemFilter !== 'all') {
      filtered = filtered.filter(issue => issue.problemType === problemFilter);
    }

    return filtered;
  }, [issues, search, problemFilter]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, problemFilter]);

  // Get unique problem types
  const problemTypes = [...new Set(issues.map(i => i.problemType).filter(Boolean))];
  const problemOptions = [
    { value: 'all', label: 'All Problems' },
    ...problemTypes.map(type => ({ value: type, label: type }))
  ];

  const perPageOptions = [
    { value: 5, label: '5 per page' },
    { value: 10, label: '10 per page' },
    { value: 20, label: '20 per page' }
  ];

  // Mutation for resolve
  const resolveMutation = useMutation({
    mutationFn: async (id) => {
      const response = await resolveUserIssues(id);
      if (response.data.success) return id;
      throw new Error('Failed');
    },
    onMutate: (id) => {
      setLoadingStates(prev => ({ ...prev, [`resolve_${id}`]: true }));
    },
    onSuccess: (id) => {
      queryClient.setQueryData(['adminIssues'], (old) => old?.filter(issue => issue._id !== id) || []);
    },
    onError: () => {
      toast.error('Failed to resolve issue');
    },
    onSettled: (id) => {
      setLoadingStates(prev => ({ ...prev, [`resolve_${id}`]: false }));
    }
  });

  // Mutation for ignore
  const ignoreMutation = useMutation({
    mutationFn: async (id) => {
      const response = await ignoreUserIssues(id);
      if (response.data.success) return id;
      throw new Error('Failed');
    },
    onMutate: (id) => {
      setLoadingStates(prev => ({ ...prev, [`ignore_${id}`]: true }));
    },
    onSuccess: (id) => {
      queryClient.setQueryData(['adminIssues'], (old) => old?.filter(issue => issue._id !== id) || []);
    },
    onError: () => {
      toast.error('Failed to ignore issue');
    },
    onSettled: (id) => {
      setLoadingStates(prev => ({ ...prev, [`ignore_${id}`]: false }));
    }
  });

  // Mutation for refund
  const refundMutation = useMutation({
    mutationFn: async ({ userId, refundAmt, issueId }) => {
      const response = await refundUserIssues({ userId, refundAmt, issueId });
      if (response.data.success) return issueId;
      throw new Error('Failed');
    },
    onSuccess: (issueId) => {
      setShowRefundModal(false);
      setSelectedIssue(null);
      setRefundAmount('');
      queryClient.setQueryData(['adminIssues'], (old) => old?.filter(issue => issue._id !== issueId) || []);
    },
    onError: () => {
      toast.error('Failed to process refund');
    }
  });

  const handleResolve = (id) => resolveMutation.mutate(id);
  const handleIgnore = (id) => ignoreMutation.mutate(id);

  const openRefundModal = (issue) => {
    setSelectedIssue(issue);
    setRefundAmount(issue.refundAmount.toString());
    setShowRefundModal(true);
  };

  const handleRefund = () => {
    refundMutation.mutate({
      userId: selectedIssue.userId,
      refundAmt: Number(refundAmount),
      issueId: selectedIssue._id
    });
  };

  const handleViewOrder = async (issue) => {
    setSelectedIssue(issue);
    setShowOrderModal(true);
    setLoadingOrder(true);
    try {
      const response = await getOrderDetails(issue.orderId);
      if (response.data.success) {
        setOrderDetails(response.data.orderDetails);
      }
    } catch (error) {
      toast.error('Failed to fetch order details');
    } finally {
      setLoadingOrder(false);
    }
  };

  const paginatedIssues = filteredIssues.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(filteredIssues.length / itemsPerPage);

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminSearchBar />

      <div className="px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">User Issues</h1>
            <p className="text-slate-500 text-sm mt-1">Manage and resolve user reported issues</p>
          </div>
          <button
            onClick={() => refetch()}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            <FiRefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <StatCard 
            icon={FiAlertCircle} 
            label="Total Issues" 
            value={stats.total} 
            color="text-rose-600" 
            bgColor="bg-rose-100" 
          />
          <StatCard 
            icon={FiDollarSign} 
            label="Refund Requests" 
            value={stats.withRefund} 
            color="text-amber-600" 
            bgColor="bg-amber-100" 
          />
          <StatCard 
            icon={FiDollarSign} 
            label="Total Refund Amt" 
            value={stats.totalRefundAmount} 
            color="text-blue-600" 
            bgColor="bg-blue-100" 
          />
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-slate-200 mb-6">
          <div className="p-4 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by user, email, order ID, or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <CustomDropdown
              value={problemFilter}
              onChange={setProblemFilter}
              options={problemOptions}
              label="Problem Type"
            />
            <CustomDropdown
              value={itemsPerPage}
              onChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}
              options={perPageOptions}
              label="Per page"
            />
          </div>
        </div>

        {/* Issues Grid */}
        {isLoading ? (
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <TableSkeleton />
          </div>
        ) : filteredIssues.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <FiAlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-slate-900 mb-1">No Issues Found</h3>
            <p className="text-slate-500 text-sm">
              {search || problemFilter !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'There are no pending issues from users'}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <AnimatePresence mode="popLayout">
                {paginatedIssues.map((issue) => (
                  <IssueCard
                    key={issue._id}
                    issue={issue}
                    onResolve={handleResolve}
                    onIgnore={handleIgnore}
                    onRefund={openRefundModal}
                    onViewOrder={handleViewOrder}
                    loadingStates={loadingStates}
                  />
                ))}
              </AnimatePresence>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-sm bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  const pageNum = i + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-1.5 text-sm rounded-lg ${
                        currentPage === pageNum 
                          ? "bg-blue-600 text-white" 
                          : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 text-sm bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showRefundModal && selectedIssue && (
          <RefundModal
            issue={selectedIssue}
            refundAmount={refundAmount}
            setRefundAmount={setRefundAmount}
            onSubmit={handleRefund}
            onClose={() => { setShowRefundModal(false); setSelectedIssue(null); }}
            isLoading={loadingStates.refund}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showOrderModal && selectedIssue && (
          <OrderDetailsModal
            issue={selectedIssue}
            orderDetails={orderDetails}
            loadingOrder={loadingOrder}
            onClose={() => { setShowOrderModal(false); setSelectedIssue(null); setOrderDetails(null); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserIssues;