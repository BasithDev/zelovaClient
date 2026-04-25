import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { LuUsers } from "react-icons/lu";
import { TfiPackage } from "react-icons/tfi";
import { GiProfit } from "react-icons/gi";
import { FaStoreAlt } from 'react-icons/fa';
import { AiOutlineStock } from 'react-icons/ai';
import AdminSearchBar from "../../Components/SearchBar/AdminSearchBar";
import AnalyticsDashboard from '../../Components/AnalyticsDashboard/AnalyticsDashboard';
import { getReports, getRestaurants, exportReportToPDF, exportReportToExcel, blockUnblockRestaurant, getDashboardData } from "../../Services/apiServices";
import { motion, AnimatePresence } from "framer-motion";
import NumberFlow from '@number-flow/react';

// Skeleton for stats
const StatSkeleton = () => (
    <div className="bg-white p-5 rounded-xl border border-slate-200 animate-pulse">
        <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-200" />
            <div className="flex-1 space-y-2">
                <div className="h-3 w-20 bg-slate-200 rounded" />
                <div className="h-6 w-16 bg-slate-200 rounded" />
            </div>
        </div>
    </div>
);

// Stat Card with NumberFlow
const StatCard = ({ icon: Icon, label, value, subLabel, color, bgColor }) => (
    <motion.div
        whileHover={{ y: -2 }}
        className="bg-white p-5 rounded-xl border border-slate-200 hover:shadow-md transition-all"
    >
        <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${bgColor}`}>
                <Icon className={`text-2xl ${color}`} />
            </div>
            <div>
                <p className="text-slate-500 text-sm">{label}</p>
                <p className="text-2xl font-bold text-slate-900">
                    <NumberFlow value={value || 0} />
                </p>
                {subLabel && <p className="text-xs text-slate-400">{subLabel}</p>}
            </div>
        </div>
    </motion.div>
);

// Revenue Stat with currency
const RevenueStat = ({ icon: Icon, label, value, subLabel, color, bgColor }) => (
    <motion.div
        whileHover={{ y: -2 }}
        className="bg-white p-5 rounded-xl border border-slate-200 hover:shadow-md transition-all"
    >
        <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${bgColor}`}>
                <Icon className={`text-2xl ${color}`} />
            </div>
            <div>
                <p className="text-slate-500 text-sm">{label}</p>
                <p className="text-2xl font-bold text-slate-900">
                    ₹<NumberFlow value={value || 0} />
                </p>
                {subLabel && <p className="text-xs text-slate-400">{subLabel}</p>}
            </div>
        </div>
    </motion.div>
);

const Dashboard = () => {
    const queryClient = useQueryClient();
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const itemsPerPage = 5;

    // React Query - fetch dashboard data with caching
    const { data: dashboardData, isLoading } = useQuery({
        queryKey: ['adminDashboard'],
        queryFn: async () => {
            const response = await getDashboardData();
            return response.data;
        },
        staleTime: 60000, // Cache for 60 seconds (dashboard data changes less frequently)
        refetchOnWindowFocus: false,
    });

    // React Query - fetch restaurants with caching
    const { data: restaurants = [] } = useQuery({
        queryKey: ['adminRestaurants'],
        queryFn: async () => {
            const response = await getRestaurants();
            return response.data;
        },
        staleTime: 30000,
        refetchOnWindowFocus: false,
    });

    // Mutation for block/unblock restaurant
    const blockMutation = useMutation({
        mutationFn: async (id) => {
            await blockUnblockRestaurant(id);
            return id;
        },
        onSuccess: (id) => {
            queryClient.setQueryData(['adminRestaurants'], (old) =>
                old?.map(restaurant =>
                    restaurant._id === id
                        ? { ...restaurant, isActive: !restaurant.isActive }
                        : restaurant
                ) || []
            );
        },
        onError: (error) => {
            console.error('Error toggling restaurant status:', error);
        }
    });

    const handleBlockUnblock = (id) => blockMutation.mutate(id);

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;

    const filteredRestaurants = restaurants.filter(restaurant =>
        restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        restaurant.vendorId?.fullname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        restaurant.address.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const currentRestaurants = filteredRestaurants.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredRestaurants.length / itemsPerPage);

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <AdminSearchBar />
            
            <div className="px-6 py-6">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-slate-900">Dashboard Overview</h1>
                    <p className="text-slate-500 text-sm mt-1">Welcome back! Here's what's happening today.</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                    <AnimatePresence mode="wait">
                        {isLoading ? (
                            <>
                                <StatSkeleton />
                                <StatSkeleton />
                                <StatSkeleton />
                                <StatSkeleton />
                                <StatSkeleton />
                            </>
                        ) : (
                            <>
                                <StatCard
                                    icon={LuUsers}
                                    label="Total Users"
                                    value={dashboardData?.totalUsers}
                                    subLabel="Active Accounts"
                                    color="text-purple-600"
                                    bgColor="bg-purple-100"
                                />
                                <StatCard
                                    icon={FaStoreAlt}
                                    label="Restaurants"
                                    value={dashboardData?.totalRestaurants}
                                    subLabel="Active Partners"
                                    color="text-orange-600"
                                    bgColor="bg-orange-100"
                                />
                                <StatCard
                                    icon={TfiPackage}
                                    label="Total Orders"
                                    value={dashboardData?.totalOrders}
                                    subLabel="Completed Orders"
                                    color="text-amber-600"
                                    bgColor="bg-amber-100"
                                />
                                <RevenueStat
                                    icon={AiOutlineStock}
                                    label="Total Sales"
                                    value={dashboardData?.totalSales}
                                    subLabel="Revenue Generated"
                                    color="text-emerald-600"
                                    bgColor="bg-emerald-100"
                                />
                                <RevenueStat
                                    icon={GiProfit}
                                    label="Total Profit"
                                    value={dashboardData?.totalProfit}
                                    subLabel="Net Earnings"
                                    color="text-blue-600"
                                    bgColor="bg-blue-100"
                                />
                            </>
                        )}
                    </AnimatePresence>
                </div>

                {/* Analytics */}
                <AnalyticsDashboard
                    fetchReports={getReports}
                    exportReportToPDF={exportReportToPDF}
                    exportReportToExcel={exportReportToExcel}
                />

                {/* Restaurants Table */}
                <div className="bg-white rounded-xl border border-slate-200 mt-6">
                    <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <h2 className="text-lg font-semibold text-slate-900">Available Restaurants</h2>
                        <input
                            type="text"
                            placeholder="Search restaurants..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-full sm:w-64"
                        />
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-50 text-left">
                                    <th className="py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Restaurant</th>
                                    <th className="py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Owner</th>
                                    <th className="py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Contact</th>
                                    <th className="py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Hours</th>
                                    <th className="py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Rating</th>
                                    <th className="py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {currentRestaurants.length > 0 ? (
                                    currentRestaurants.map((restaurant) => (
                                        <tr key={restaurant._id} className="hover:bg-slate-50 transition-colors">
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-3">
                                                    <img
                                                        src={restaurant.image || 'https://placehold.co/40x40/e2e8f0/94a3b8?text=No+Img'}
                                                        alt={restaurant.name}
                                                        className="w-10 h-10 rounded-lg object-cover bg-slate-100"
                                                        onError={(e) => {
                                                            e.target.onerror = null;
                                                            e.target.src = 'https://placehold.co/40x40/e2e8f0/94a3b8?text=No+Img';
                                                        }}
                                                    />
                                                    <div>
                                                        <p className="font-medium text-slate-900 text-sm">{restaurant.name}</p>
                                                        <p className="text-xs text-slate-500 truncate max-w-[200px]">{restaurant.address}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <p className="text-sm font-medium text-slate-900">{restaurant.vendorId?.fullname}</p>
                                                <p className="text-xs text-slate-500">{restaurant.vendorId?.email}</p>
                                            </td>
                                            <td className="py-3 px-4">
                                                <p className="text-sm text-slate-700">{restaurant.phone}</p>
                                                <p className="text-xs text-slate-500">{restaurant.vendorId?.phoneNumber}</p>
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className="text-sm text-slate-700">
                                                    {restaurant.openingTime} - {restaurant.closingTime}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-1">
                                                    <span className="text-amber-500">★</span>
                                                    <span className="text-sm font-medium">{restaurant.avgRating?.toFixed(1) || '0.0'}</span>
                                                    <span className="text-xs text-slate-400">({restaurant.totalRatingCount || 0})</span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <button
                                                    className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                                                        restaurant.isActive
                                                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                                            : 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                                                    }`}
                                                    onClick={() => handleBlockUnblock(restaurant._id)}
                                                >
                                                    {restaurant.isActive ? 'Active' : 'Inactive'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="text-center py-8 text-slate-500">
                                            No restaurants found matching your search.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="p-4 border-t border-slate-100 flex justify-center gap-1">
                            {Array.from({ length: totalPages }, (_, index) => (
                                <button
                                    key={index}
                                    onClick={() => handlePageChange(index + 1)}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                        currentPage === index + 1
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                >
                                    {index + 1}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;