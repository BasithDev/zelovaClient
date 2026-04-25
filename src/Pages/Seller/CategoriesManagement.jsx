import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiTag, FiFolder } from 'react-icons/fi';
import { HiOutlineCollection } from 'react-icons/hi';
import { getSubCategories, addSubCategory, getCategories, addCategory } from '../../Services/apiServices';
import { toast } from 'react-hot-toast';

// Skeleton Component
const CategorySkeleton = () => (
  <div className="bg-white rounded-lg border border-slate-200 p-5 animate-pulse">
    <div className="h-5 w-1/4 bg-slate-200 rounded mb-4" />
    <div className="flex gap-2">
      {[...Array(3)].map((_, j) => (
        <div key={j} className="h-8 w-24 bg-slate-200 rounded-full" />
      ))}
    </div>
  </div>
);

const CategoriesManagement = () => {
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [contentReady, setContentReady] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddMainModal, setShowAddMainModal] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [newSubCategoryName, setNewSubCategoryName] = useState('');
  const [newMainCategoryName, setNewMainCategoryName] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setContentReady(false);
      const [catResponse, subCatResponse] = await Promise.all([
        getCategories(),
        getSubCategories()
      ]);
      setCategories(catResponse.data.categories || []);
      setSubCategories(subCatResponse.data.subCategories || []);
      // Smooth transition delay
      setTimeout(() => {
        setLoading(false);
        setContentReady(true);
      }, 300);
    } catch (error) {
      if (error.response?.status >= 500) {
        toast.error('Failed to load categories');
      }
      console.error('Error fetching data:', error);
      setLoading(false);
      setContentReady(true);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddMainCategory = async (e) => {
    e.preventDefault();
    if (!newMainCategoryName.trim()) {
      toast.error('Please enter a category name');
      return;
    }

    try {
      setIsAdding(true);
      await addCategory({ name: newMainCategoryName });
      toast.success('Main category added!');
      setShowAddMainModal(false);
      setNewMainCategoryName('');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add category');
    } finally {
      setIsAdding(false);
    }
  };

  const handleAddSubCategory = async (e) => {
    e.preventDefault();
    if (!selectedCategory || !newSubCategoryName.trim()) {
      toast.error('Please fill all fields');
      return;
    }

    try {
      setIsAdding(true);
      await addSubCategory({ 
        name: newSubCategoryName, 
        categoryName: selectedCategory
      });
      toast.success('Category added!');
      setShowAddModal(false);
      setNewSubCategoryName('');
      setSelectedCategory('');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add category');
    } finally {
      setIsAdding(false);
    }
  };

  const groupedSubCategories = subCategories.reduce((acc, subCat) => {
    const catName = subCat.categoryName || 'Uncategorized';
    if (!acc[catName]) acc[catName] = [];
    acc[catName].push(subCat);
    return acc;
  }, {});

  const isEmpty = categories.length === 0 && subCategories.length === 0;
  const hasContent = !isEmpty && (categories.length > 0 || subCategories.length > 0);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="px-4 lg:px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-slate-900">Categories</h1>
              <p className="text-sm text-slate-500">
                {categories.length} main, {subCategories.length} sub-categories
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowAddMainModal(true)}
                className="flex items-center gap-2 px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium"
              >
                <FiFolder className="w-4 h-4" />
                Add Main
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium"
              >
                <FiPlus className="w-4 h-4" />
                Add Sub
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 lg:px-6 py-6">
        <AnimatePresence mode="wait">
          {/* Loading Skeleton */}
          {loading && (
            <motion.div
              key="skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {[...Array(3)].map((_, i) => <CategorySkeleton key={i} />)}
            </motion.div>
          )}

          {/* Empty State */}
          {!loading && isEmpty && (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="text-center py-16"
            >
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1 }}
                className="w-20 h-20 mx-auto mb-6 bg-slate-100 rounded-full flex items-center justify-center"
              >
                <HiOutlineCollection className="w-10 h-10 text-slate-400" />
              </motion.div>
              <h2 className="text-xl font-semibold text-slate-900 mb-2">No categories yet</h2>
              <p className="text-slate-500 mb-6 max-w-sm mx-auto">
                Start by adding a main category, then create sub-categories under it
              </p>
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                onClick={() => setShowAddMainModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 transition-colors"
              >
                <FiFolder className="w-5 h-5" />
                Create First Category
              </motion.button>
            </motion.div>
          )}

          {/* Content */}
          {!loading && hasContent && (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {/* Main Categories without sub-categories */}
              {categories
                .filter(cat => !groupedSubCategories[cat.name])
                .map((cat, index) => (
                  <motion.div
                    key={cat._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white rounded-lg border border-slate-200 p-5"
                  >
                    <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                      <FiFolder className="w-4 h-4 text-orange-500" />
                      {cat.name}
                    </h3>
                    <p className="text-sm text-slate-400 mt-1">No sub-categories yet</p>
                  </motion.div>
                ))}
              
              {/* Grouped sub-categories */}
              {Object.entries(groupedSubCategories).map(([catName, items], index) => (
                <motion.div
                  key={catName}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-lg border border-slate-200 p-5"
                >
                  <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <FiFolder className="w-4 h-4 text-orange-500" />
                    {catName}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {items.map((subCat) => (
                      <span
                        key={subCat._id}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-full text-sm"
                      >
                        <FiTag className="w-3 h-3" />
                        {subCat.name}
                      </span>
                    ))}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Add Main Category Modal */}
      <AnimatePresence>
        {showAddMainModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl p-6 max-w-md w-full"
            >
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Add Main Category</h3>
              <form onSubmit={handleAddMainCategory} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Category Name
                  </label>
                  <input
                    type="text"
                    value={newMainCategoryName}
                    onChange={(e) => setNewMainCategoryName(e.target.value)}
                    placeholder="e.g. Indian, Chinese, Italian"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddMainModal(false)}
                    className="flex-1 px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isAdding}
                    className="flex-1 px-4 py-2.5 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isAdding ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Adding...
                      </>
                    ) : (
                      'Add Category'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Sub Category Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl p-6 max-w-md w-full"
            >
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Add Sub-Category</h3>
              {categories.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-slate-500 mb-4">Add a main category first</p>
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      setShowAddMainModal(true);
                    }}
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600"
                  >
                    Add Main Category
                  </button>
                </div>
              ) : (
                <form onSubmit={handleAddSubCategory} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Parent Category
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                    >
                      <option value="">Select parent category</option>
                      {categories.map((cat) => (
                        <option key={cat._id} value={cat.name}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Sub-Category Name
                    </label>
                    <input
                      type="text"
                      value={newSubCategoryName}
                      onChange={(e) => setNewSubCategoryName(e.target.value)}
                      placeholder="e.g. Starters, Main Course, Desserts"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="flex-1 px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isAdding}
                      className="flex-1 px-4 py-2.5 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isAdding ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Adding...
                        </>
                      ) : (
                        'Add Sub-Category'
                      )}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CategoriesManagement;
