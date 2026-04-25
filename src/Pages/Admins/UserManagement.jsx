import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { LuUsers, LuSearch, LuChevronDown, LuChevronUp, LuCoins } from "react-icons/lu";
import { FiMail, FiPhone, FiUser, FiShield, FiRefreshCw } from "react-icons/fi";
import { HiOutlineBan, HiOutlineCheckCircle } from "react-icons/hi";
import AdminSearchBar from "../../Components/SearchBar/AdminSearchBar";
import { StatCard, CustomDropdown, TableSkeleton } from "../../Components/Admin";
import { AnimatePresence, motion } from "framer-motion";
import { fetchUsers, blockUnblockUser } from "../../Services/apiServices";
import { toast } from "react-toastify";

const UserManagement = () => {
  const queryClient = useQueryClient();
  const [expandedUserId, setExpandedUserId] = useState(null);
  
  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  // React Query - fetch users with caching
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['adminUsers', search, statusFilter, currentPage, itemsPerPage, sortBy, sortOrder],
    queryFn: async () => {
      const { data } = await fetchUsers({
        search,
        status: statusFilter,
        page: currentPage,
        limit: itemsPerPage,
        sortBy,
        sortOrder
      });
      return data;
    },
    staleTime: 30000, // Cache for 30 seconds
    refetchOnWindowFocus: false,
    keepPreviousData: true,
  });

  const users = data?.users || data || [];
  const stats = data?.stats || {};
  const pagination = data?.pagination || { currentPage: 1, totalPages: 1, totalItems: users.length };

  // Mutation for block/unblock
  const blockMutation = useMutation({
    mutationFn: async ({ userId, newStatus }) => {
      await blockUnblockUser(userId, { status: newStatus });
      return { userId, newStatus };
    },
    onSuccess: ({ userId, newStatus }) => {
      // Update cache optimistically
      queryClient.setQueryData(
        ['adminUsers', search, statusFilter, currentPage, itemsPerPage, sortBy, sortOrder],
        (old) => {
          if (!old) return old;
          const updatedUsers = old.users?.map(u => 
            u._id === userId ? { ...u, status: newStatus } : u
          ) || old.map(u => u._id === userId ? { ...u, status: newStatus } : u);
          return old.users ? { ...old, users: updatedUsers } : updatedUsers;
        }
      );
    },
    onError: () => {
      toast.error("Failed to update user status");
    }
  });

  const handleBlockUnblock = (userId, currentStatus) => {
    const newStatus = currentStatus === "blocked" ? "active" : "blocked";
    blockMutation.mutate({ userId, newStatus });
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const SortIcon = ({ field }) => {
    if (sortBy !== field) return null;
    return sortOrder === "asc" ? <LuChevronUp className="w-4 h-4" /> : <LuChevronDown className="w-4 h-4" />;
  };

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active', icon: HiOutlineCheckCircle },
    { value: 'blocked', label: 'Blocked', icon: HiOutlineBan }
  ];

  const perPageOptions = [
    { value: 5, label: '5 per page' },
    { value: 10, label: '10 per page' },
    { value: 20, label: '20 per page' },
    { value: 50, label: '50 per page' }
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminSearchBar />
      
      <div className="px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
            <p className="text-slate-500 text-sm mt-1">Manage and monitor all registered users</p>
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard icon={LuUsers} label="Total Users" value={stats.totalUsers} color="text-blue-600" bgColor="bg-blue-100" />
          <StatCard icon={HiOutlineCheckCircle} label="Active" value={stats.activeUsers} color="text-emerald-600" bgColor="bg-emerald-100" />
          <StatCard icon={HiOutlineBan} label="Blocked" value={stats.blockedUsers} color="text-rose-600" bgColor="bg-rose-100" />
          <StatCard icon={LuCoins} label="Total Z-Coins" value={stats.totalZCoins} color="text-amber-600" bgColor="bg-amber-100" />
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-slate-200 mb-6">
          <div className="p-4 flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* Status Filter */}
            <CustomDropdown
              value={statusFilter}
              onChange={(val) => { setStatusFilter(val); setCurrentPage(1); }}
              options={statusOptions}
              label="Status"
            />

            {/* Per Page */}
            <CustomDropdown
              value={itemsPerPage}
              onChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}
              options={perPageOptions}
              label="Per page"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {isLoading ? (
            <TableSkeleton />
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <LuUsers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No users found</p>
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-3 bg-slate-50 text-xs font-medium text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <button onClick={() => handleSort("fullname")} className="col-span-3 flex items-center gap-1 text-left hover:text-slate-700">
                  Name <SortIcon field="fullname" />
                </button>
                <button onClick={() => handleSort("email")} className="col-span-3 flex items-center gap-1 text-left hover:text-slate-700">
                  Email <SortIcon field="email" />
                </button>
                <button onClick={() => handleSort("zCoins")} className="col-span-2 flex items-center gap-1 text-left hover:text-slate-700">
                  Z-Coins <SortIcon field="zCoins" />
                </button>
                <div className="col-span-2">Status</div>
                <div className="col-span-2 text-right">Actions</div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-slate-100">
                {users.map((user) => (
                  <div key={user._id}>
                    <div className="grid grid-cols-12 gap-4 px-4 py-3 items-center hover:bg-slate-50 transition-colors">
                      {/* Name */}
                      <div className="col-span-12 md:col-span-3 flex items-center gap-3">
                        {user.profilePicture ? (
                          <img src={user.profilePicture} alt="" className="w-9 h-9 rounded-full object-cover" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-blue-600 font-medium text-sm">{user.fullname?.charAt(0)?.toUpperCase()}</span>
                          </div>
                        )}
                        <span className="font-medium text-slate-900 truncate">{user.fullname}</span>
                      </div>

                      {/* Email */}
                      <div className="hidden md:block col-span-3 text-sm text-slate-600 truncate">{user.email}</div>

                      {/* Z-Coins */}
                      <div className="hidden md:block col-span-2 text-sm font-medium text-amber-600">{user.zCoins || 0}</div>

                      {/* Status */}
                      <div className="hidden md:block col-span-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          user.status === "blocked" ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"
                        }`}>
                          {user.status === "blocked" ? "Blocked" : "Active"}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="col-span-12 md:col-span-2 flex justify-end gap-2">
                        <button
                          onClick={() => setExpandedUserId(expandedUserId === user._id ? null : user._id)}
                          className="px-3 py-1.5 text-xs font-medium bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200"
                        >
                          {expandedUserId === user._id ? "Hide" : "View"}
                        </button>
                        <button
                          onClick={() => handleBlockUnblock(user._id, user.status)}
                          className={`px-3 py-1.5 text-xs font-medium rounded-lg ${
                            user.status === "blocked"
                              ? "bg-emerald-600 text-white hover:bg-emerald-700"
                              : "bg-rose-600 text-white hover:bg-rose-700"
                          }`}
                        >
                          {user.status === "blocked" ? "Unblock" : "Block"}
                        </button>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    <AnimatePresence>
                      {expandedUserId === user._id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden border-t border-slate-100"
                        >
                          <div className="p-4 bg-slate-50 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-white p-3 rounded-lg">
                              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                                <FiMail className="w-3 h-3" /> Email
                              </div>
                              <p className="text-sm text-slate-900">{user.email}</p>
                            </div>
                            <div className="bg-white p-3 rounded-lg">
                              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                                <FiPhone className="w-3 h-3" /> Phone
                              </div>
                              <p className="text-sm text-slate-900">{user.phoneNumber || "Not provided"}</p>
                            </div>
                            <div className="bg-white p-3 rounded-lg">
                              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                                <FiUser className="w-3 h-3" /> Age
                              </div>
                              <p className="text-sm text-slate-900">{user.age || "Not provided"}</p>
                            </div>
                            <div className="bg-white p-3 rounded-lg">
                              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                                <FiShield className="w-3 h-3" /> Account Status
                              </div>
                              <p className="text-sm text-slate-900 capitalize">{user.status || "Active"}</p>
                            </div>
                            <div className="bg-white p-3 rounded-lg">
                              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                                <LuCoins className="w-3 h-3" /> Z-Coins Balance
                              </div>
                              <p className="text-sm text-slate-900 font-medium">{user.zCoins || 0}</p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between">
              <p className="text-sm text-slate-500">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, pagination.totalItems)} of {pagination.totalItems}
              </p>
              <div className="flex gap-1">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-sm bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
                  const pageNum = i + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-1.5 text-sm rounded-lg ${
                        currentPage === pageNum ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
                  disabled={currentPage === pagination.totalPages}
                  className="px-3 py-1.5 text-sm bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserManagement;