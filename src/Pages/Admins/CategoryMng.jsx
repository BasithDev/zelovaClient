import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import { LuSearch, LuTrash2, LuFolder, LuLayers } from "react-icons/lu";
import { FiRefreshCw, FiGrid, FiTag } from "react-icons/fi";
import AdminSearchBar from "../../Components/SearchBar/AdminSearchBar";
import { StatCard, CustomDropdown, ListSkeleton } from "../../Components/Admin";
import {
    deleteCategory,
    deleteSubCategory,
    getCategoriesToMng,
    getSubCategoriesToMng,
} from "../../Services/apiServices";


const CategoryMng = () => {
    const queryClient = useQueryClient();
    
    // Filters
    const [categorySearch, setCategorySearch] = useState("");
    const [subCategorySearch, setSubCategorySearch] = useState("");
    const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("");
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // React Query - fetch categories
    const { data: categoriesData, isLoading: catLoading, refetch: refetchCategories } = useQuery({
        queryKey: ['adminCategories', categorySearch, itemsPerPage],
        queryFn: async () => {
            const response = await getCategoriesToMng({ 
                search: categorySearch, 
                limit: itemsPerPage 
            });
            return response.data;
        },
        staleTime: 30000,
        refetchOnWindowFocus: false,
    });

    // React Query - fetch subcategories
    const { data: subCategoriesData, isLoading: subCatLoading, refetch: refetchSubCategories } = useQuery({
        queryKey: ['adminSubCategories', subCategorySearch, selectedCategoryFilter, itemsPerPage],
        queryFn: async () => {
            const response = await getSubCategoriesToMng({ 
                search: subCategorySearch, 
                categoryName: selectedCategoryFilter,
                limit: itemsPerPage 
            });
            return response.data;
        },
        staleTime: 30000,
        refetchOnWindowFocus: false,
    });

    const categories = categoriesData?.data || [];
    const subCategories = subCategoriesData?.data || [];
    const stats = {
        totalCategories: categoriesData?.stats?.totalCategories || categories.length,
        totalSubCategories: categoriesData?.stats?.totalSubCategories || subCategories.length
    };
    const isLoading = catLoading || subCatLoading;

    const refetch = () => {
        refetchCategories();
        refetchSubCategories();
    };

    // Mutation for delete category
    const deleteCatMutation = useMutation({
        mutationFn: async (id) => {
            await deleteCategory(id);
            return id;
        },
        onSuccess: (id) => {
            queryClient.setQueryData(['adminCategories', categorySearch, itemsPerPage], (old) => ({
                ...old,
                data: old?.data?.filter(c => c._id !== id) || []
            }));
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || "Failed to delete category");
        }
    });

    // Mutation for delete subcategory
    const deleteSubCatMutation = useMutation({
        mutationFn: async (id) => {
            await deleteSubCategory(id);
            return id;
        },
        onSuccess: (id) => {
            queryClient.setQueryData(['adminSubCategories', subCategorySearch, selectedCategoryFilter, itemsPerPage], (old) => ({
                ...old,
                data: old?.data?.filter(sc => sc._id !== id) || []
            }));
        },
        onError: () => {
            toast.error("Failed to delete subcategory");
        }
    });

    const handleDeleteCategory = (id, name) => {
        if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
        deleteCatMutation.mutate(id);
    };

    const handleDeleteSubCategory = (id, name) => {
        if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
        deleteSubCatMutation.mutate(id);
    };

    const perPageOptions = [
        { value: 5, label: '5 per page' },
        { value: 10, label: '10 per page' },
        { value: 20, label: '20 per page' },
        { value: 50, label: '50 per page' }
    ];

    const categoryFilterOptions = [
        { value: '', label: 'All Categories' },
        ...categories.map(cat => ({ value: cat.name, label: cat.name }))
    ];

    return (
        <div className="min-h-screen bg-slate-50">
            <AdminSearchBar />
            
            <div className="px-6 py-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Category Management</h1>
                        <p className="text-slate-500 text-sm mt-1">Manage food categories and subcategories</p>
                    </div>
                    <button
                        onClick={refetch}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                    >
                        <FiRefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <StatCard icon={FiGrid} label="Categories" value={stats.totalCategories} color="text-purple-600" bgColor="bg-purple-100" />
                    <StatCard icon={FiTag} label="Subcategories" value={stats.totalSubCategories} color="text-blue-600" bgColor="bg-blue-100" />
                </div>

                {/* Items Per Page */}
                <div className="mb-4">
                    <CustomDropdown
                        value={itemsPerPage}
                        onChange={(val) => setItemsPerPage(val)}
                        options={perPageOptions}
                        label="Per page"
                    />
                </div>

                {/* Two Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Categories Column */}
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <div className="p-4 border-b border-slate-100">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <LuFolder className="w-5 h-5 text-purple-600" />
                                    <h2 className="text-lg font-semibold text-slate-900">Categories</h2>
                                </div>
                                <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                                    {categories.length} items
                                </span>
                            </div>
                            <div className="relative">
                                <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Search categories..."
                                    value={categorySearch}
                                    onChange={(e) => setCategorySearch(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
                            </div>
                        </div>

                        <div className="p-4">
                            {isLoading ? (
                                <ListSkeleton />
                            ) : categories.length === 0 ? (
                                <div className="text-center py-8">
                                    <LuFolder className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                                    <p className="text-slate-500 text-sm">No categories found</p>
                                </div>
                            ) : (
                                <AnimatePresence mode="popLayout">
                                    <div className="space-y-2">
                                        {categories.map((category) => (
                                            <motion.div
                                                key={category._id}
                                                layout
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors group"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                                                        <span className="text-purple-600 font-medium text-sm">{category.name?.charAt(0)}</span>
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-slate-900">{category.name}</p>
                                                        {category.subCategoryCount !== undefined && (
                                                            <p className="text-xs text-slate-500">{category.subCategoryCount} subcategories</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteCategory(category._id, category.name)}
                                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                                    title="Delete"
                                                >
                                                    <LuTrash2 className="w-4 h-4" />
                                                </button>
                                            </motion.div>
                                        ))}
                                    </div>
                                </AnimatePresence>
                            )}
                        </div>
                    </div>

                    {/* Subcategories Column */}
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <div className="p-4 border-b border-slate-100">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <LuLayers className="w-5 h-5 text-blue-600" />
                                    <h2 className="text-lg font-semibold text-slate-900">Subcategories</h2>
                                </div>
                                <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                                    {subCategories.length} items
                                </span>
                            </div>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                    <input
                                        type="text"
                                        placeholder="Search subcategories..."
                                        value={subCategorySearch}
                                        onChange={(e) => setSubCategorySearch(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    />
                                </div>
                                <CustomDropdown
                                    value={selectedCategoryFilter}
                                    onChange={setSelectedCategoryFilter}
                                    options={categoryFilterOptions}
                                    label="Filter"
                                />
                            </div>
                        </div>

                        <div className="p-4">
                            {isLoading ? (
                                <ListSkeleton />
                            ) : subCategories.length === 0 ? (
                                <div className="text-center py-8">
                                    <LuLayers className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                                    <p className="text-slate-500 text-sm">No subcategories found</p>
                                </div>
                            ) : (
                                <AnimatePresence mode="popLayout">
                                    <div className="space-y-2">
                                        {subCategories.map((subCategory) => (
                                            <motion.div
                                                key={subCategory._id}
                                                layout
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors group"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                                                        <span className="text-blue-600 font-medium text-sm">{subCategory.name?.charAt(0)}</span>
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-slate-900">{subCategory.name}</p>
                                                        <p className="text-xs text-slate-500">{subCategory.categoryName || "Unknown category"}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteSubCategory(subCategory._id, subCategory.name)}
                                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                                    title="Delete"
                                                >
                                                    <LuTrash2 className="w-4 h-4" />
                                                </button>
                                            </motion.div>
                                        ))}
                                    </div>
                                </AnimatePresence>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CategoryMng;