import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { LuSearch, LuPlus, LuPercent, LuTag, LuX, LuCalendar } from "react-icons/lu";
import { FiEdit2, FiTrash2, FiRefreshCw, FiDollarSign } from "react-icons/fi";
import { HiOutlineTicket } from "react-icons/hi";
import AdminSearchBar from "../../Components/SearchBar/AdminSearchBar";
import { StatCard, CustomDropdown } from "../../Components/Admin";
import { addCoupon, getCoupons, updateCoupon, deleteCoupon } from "../../Services/apiServices";
import { toast } from "react-toastify";

// Skeleton
const CouponSkeleton = () => (
  <div className="animate-pulse grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {[...Array(6)].map((_, i) => (
      <div key={i} className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="h-5 w-32 bg-slate-200 rounded mb-2" />
        <div className="h-4 w-24 bg-slate-200 rounded mb-3" />
        <div className="space-y-2">
          <div className="h-3 w-full bg-slate-200 rounded" />
          <div className="h-3 w-2/3 bg-slate-200 rounded" />
        </div>
      </div>
    ))}
  </div>
);

// Coupon Card
const CouponCard = ({ coupon, onEdit, onDelete }) => {
  const isExpired = coupon.expiry && new Date(coupon.expiry) < new Date();
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={`bg-white rounded-xl border ${isExpired ? 'border-rose-200 bg-rose-50/30' : 'border-slate-200'} overflow-hidden hover:shadow-md transition-shadow group`}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold text-slate-900">{coupon.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-2 py-0.5 text-xs font-mono font-medium bg-blue-100 text-blue-700 rounded">
                {coupon.code}
              </span>
              {isExpired && (
                <span className="px-2 py-0.5 text-xs font-medium bg-rose-100 text-rose-600 rounded">
                  Expired
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEdit(coupon)}
              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
            >
              <FiEdit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(coupon._id)}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
            >
              <FiTrash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Description */}
        {coupon.description && (
          <p className="text-sm text-slate-500 mb-3 line-clamp-2">{coupon.description}</p>
        )}

        {/* Details */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-1.5 text-slate-600">
            {coupon.type === "percentage" ? <LuPercent className="w-3.5 h-3.5" /> : <FiDollarSign className="w-3.5 h-3.5" />}
            <span>
              {coupon.type === "percentage" ? `${coupon.discount}% off` : `₹${coupon.discount} off`}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-600">
            <LuTag className="w-3.5 h-3.5" />
            <span>Min ₹{coupon.minPrice}</span>
          </div>
          {coupon.expiry && (
            <div className="col-span-2 flex items-center gap-1.5 text-slate-500 text-xs">
              <LuCalendar className="w-3.5 h-3.5" />
              <span>{new Date(coupon.expiry).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Add/Edit Modal
const CouponModal = ({ isOpen, onClose, coupon, onSubmit }) => {
  const [form, setForm] = useState({
    name: "",
    code: "",
    description: "",
    type: "percentage",
    discount: "",
    minPrice: "",
    expiry: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (coupon) {
      setForm({
        name: coupon.name || "",
        code: coupon.code || "",
        description: coupon.description || "",
        type: coupon.type || "percentage",
        discount: coupon.discount || "",
        minPrice: coupon.minPrice || "",
        expiry: coupon.expiry ? new Date(coupon.expiry).toISOString().slice(0, 16) : "",
      });
    } else {
      setForm({
        name: "",
        code: "",
        description: "",
        type: "percentage",
        discount: "",
        minPrice: "",
        expiry: "",
      });
    }
  }, [coupon, isOpen]);

  const handleSubmit = async () => {
    if (!form.name || !form.code || !form.discount || !form.minPrice) {
      toast.error("Please fill all required fields");
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmit(form, coupon?._id);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
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
        className="bg-white rounded-xl max-w-md w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h3 className="text-lg font-semibold text-slate-900">
            {coupon ? "Edit Coupon" : "Add New Coupon"}
          </h3>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
            <LuX className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                placeholder="Summer Sale"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Code *</label>
              <input
                type="text"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                placeholder="SUMMER20"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
              placeholder="Get 20% off on your order"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="percentage">Percentage</option>
                <option value="amount">Fixed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Discount *</label>
              <input
                type="number"
                value={form.discount}
                onChange={(e) => setForm({ ...form, discount: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder={form.type === "percentage" ? "20" : "100"}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Min Order *</label>
              <input
                type="number"
                value={form.minPrice}
                onChange={(e) => setForm({ ...form, minPrice: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Expiry (Optional)</label>
            <input
              type="datetime-local"
              value={form.expiry}
              onChange={(e) => setForm({ ...form, expiry: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        <div className="flex gap-3 p-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm font-medium bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              coupon ? "Update" : "Add Coupon"
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const CouponMng = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);

  // React Query - fetch coupons with caching
  const { data: coupons = [], isLoading, refetch } = useQuery({
    queryKey: ['adminCoupons'],
    queryFn: async () => {
      const response = await getCoupons();
      return response.data || [];
    },
    staleTime: 30000, // Cache for 30 seconds
    refetchOnWindowFocus: false,
  });

  // Filter coupons using useMemo-like pattern
  const filteredCoupons = useMemo(() => {
    let filtered = [...coupons];
    
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter((c) =>
        c.name?.toLowerCase().includes(searchLower) ||
        c.code?.toLowerCase().includes(searchLower) ||
        c.description?.toLowerCase().includes(searchLower)
      );
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter((c) => c.type === typeFilter);
    }

    return filtered;
  }, [coupons, search, typeFilter]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, typeFilter]);

  // Mutation for add/update coupon
  const couponMutation = useMutation({
    mutationFn: async ({ form, couponId }) => {
      if (couponId) {
        await updateCoupon(couponId, form);
      } else {
        await addCoupon(form);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['adminCoupons']);
    },
    onError: (_, { couponId }) => {
      toast.error(couponId ? "Failed to update coupon" : "Failed to add coupon");
    }
  });

  // Mutation for delete coupon
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await deleteCoupon(id);
      return id;
    },
    onSuccess: (id) => {
      queryClient.setQueryData(['adminCoupons'], (old) =>
        old?.filter((c) => c._id !== id) || []
      );
    },
    onError: () => {
      toast.error("Failed to delete coupon");
    }
  });

  const handleSubmit = async (form, couponId) => {
    couponMutation.mutate({ form, couponId });
  };

  const handleDelete = (id) => {
    if (!confirm("Are you sure you want to delete this coupon?")) return;
    deleteMutation.mutate(id);
  };

  const openEditModal = (coupon) => {
    setEditingCoupon(coupon);
    setShowModal(true);
  };

  const openAddModal = () => {
    setEditingCoupon(null);
    setShowModal(true);
  };

  const typeOptions = [
    { value: "all", label: "All Types" },
    { value: "percentage", label: "Percentage" },
    { value: "amount", label: "Fixed Amount" },
  ];

  const perPageOptions = [
    { value: 5, label: "5 per page" },
    { value: 10, label: "10 per page" },
    { value: 20, label: "20 per page" },
  ];

  // Stats
  const stats = {
    total: coupons.length,
    percentage: coupons.filter((c) => c.type === "percentage").length,
    fixed: coupons.filter((c) => c.type === "amount").length,
    expired: coupons.filter((c) => c.expiry && new Date(c.expiry) < new Date()).length,
  };

  const paginatedCoupons = filteredCoupons.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(filteredCoupons.length / itemsPerPage);

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminSearchBar />

      <div className="px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Coupon Management</h1>
            <p className="text-slate-500 text-sm mt-1">Create and manage discount coupons</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => refetch()}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              <FiRefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button
              onClick={openAddModal}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              <LuPlus className="w-4 h-4" />
              Add Coupon
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard icon={HiOutlineTicket} label="Total Coupons" value={stats.total} color="text-blue-600" bgColor="bg-blue-100" />
          <StatCard icon={LuPercent} label="Percentage" value={stats.percentage} color="text-emerald-600" bgColor="bg-emerald-100" />
          <StatCard icon={FiDollarSign} label="Fixed Amount" value={stats.fixed} color="text-amber-600" bgColor="bg-amber-100" />
          <StatCard icon={LuCalendar} label="Expired" value={stats.expired} color="text-rose-600" bgColor="bg-rose-100" />
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-slate-200 mb-6">
          <div className="p-4 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by name, code, or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <CustomDropdown value={typeFilter} onChange={setTypeFilter} options={typeOptions} label="Type" />
            <CustomDropdown value={itemsPerPage} onChange={(v) => { setItemsPerPage(v); setCurrentPage(1); }} options={perPageOptions} label="Per page" />
          </div>
        </div>

        {/* Coupons Grid */}
        {isLoading ? (
          <CouponSkeleton />
        ) : filteredCoupons.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <HiOutlineTicket className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-slate-900 mb-1">No Coupons Found</h3>
            <p className="text-slate-500 text-sm mb-4">
              {search || typeFilter !== "all" ? "Try adjusting your search or filters" : "Create your first coupon to get started"}
            </p>
            {!search && typeFilter === "all" && (
              <button
                onClick={openAddModal}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                <LuPlus className="w-4 h-4" />
                Add Coupon
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <AnimatePresence mode="popLayout">
                {paginatedCoupons.map((coupon) => (
                  <CouponCard key={coupon._id} coupon={coupon} onEdit={openEditModal} onDelete={handleDelete} />
                ))}
              </AnimatePresence>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
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
                        currentPage === pageNum ? "bg-blue-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
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

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <CouponModal
            isOpen={showModal}
            onClose={() => setShowModal(false)}
            coupon={editingCoupon}
            onSubmit={handleSubmit}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default CouponMng;