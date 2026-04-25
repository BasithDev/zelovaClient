import { useEffect, useState, useCallback, useMemo } from "react";
import ProductCard from "./ProductCard";
import ItemDetailModal from "./ItemDetailModal";
import { FiSearch, FiPlus, FiFilter, FiGrid, FiList } from "react-icons/fi";
import { HiOutlineArchiveBox } from "react-icons/hi2";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  getProducts, 
  getOffers, 
  listOrUnlistProduct,
  deleteProduct, 
  updateProduct, 
  updateProductOffer 
} from "../../Services/apiServices";
import { toast } from "react-hot-toast";
import Swal from "sweetalert2";
import { uploadImageToCloud } from '../../Helpers/uploadImageToCloud';

// Skeleton
const ProductSkeleton = () => (
  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden animate-pulse">
    <div className="flex">
      <div className="w-28 h-28 sm:w-32 sm:h-32 bg-slate-200" />
      <div className="flex-1 p-3 space-y-2">
        <div className="h-4 w-3/4 bg-slate-200 rounded" />
        <div className="h-5 w-1/3 bg-slate-200 rounded" />
        <div className="h-3 w-full bg-slate-200 rounded" />
      </div>
    </div>
  </div>
);

// Empty State
const EmptyState = ({ onAddClick, hasSearch, onClearSearch }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
    className="text-center py-16"
  >
    <motion.div
      initial={{ scale: 0.8 }}
      animate={{ scale: 1 }}
      transition={{ delay: 0.1 }}
      className="w-20 h-20 mx-auto mb-6 bg-slate-100 rounded-full flex items-center justify-center"
    >
      <HiOutlineArchiveBox className="w-10 h-10 text-slate-400" />
    </motion.div>
    {hasSearch ? (
      <>
        <h2 className="text-lg font-semibold text-slate-900 mb-2">No items match your search</h2>
        <button onClick={onClearSearch} className="text-orange-500 hover:text-orange-600 text-sm font-medium">
          Clear search
        </button>
      </>
    ) : (
      <>
        <h2 className="text-lg font-semibold text-slate-900 mb-2">No menu items yet</h2>
        <p className="text-slate-500 mb-6 text-sm">Start building your menu</p>
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          onClick={onAddClick}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600"
        >
          <FiPlus className="w-4 h-4" />
          Add First Item
        </motion.button>
      </>
    )}
  </motion.div>
);

// Error State
const ErrorState = ({ onRetry }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
    className="text-center py-16"
  >
    <div className="w-20 h-20 mx-auto mb-6 bg-rose-50 rounded-full flex items-center justify-center">
      <span className="text-3xl">⚠️</span>
    </div>
    <h2 className="text-lg font-semibold text-slate-900 mb-2">Unable to load menu</h2>
    <p className="text-slate-500 mb-4 text-sm">Something went wrong</p>
    <button onClick={onRetry} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm hover:bg-slate-800">
      Try Again
    </button>
  </motion.div>
);

const Menu = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [offers, setOffers] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState("grid");
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  
  // Detail Modal
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const fetchOffers = useCallback(async () => {
    try {
      const response = await getOffers();
      setOffers(response.data.offers || []);
    } catch (err) {
      console.error("Error fetching offers:", err);
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setHasError(false);
      const response = await getProducts();
      setProducts(response.data.data || []);
      setTimeout(() => setLoading(false), 300);
    } catch (err) {
      if (err.response?.status >= 500) {
        setHasError(true);
      } else {
        setProducts([]);
      }
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOffers();
    fetchProducts();
  }, [fetchOffers, fetchProducts]);

  const filteredProducts = useMemo(() => {
    let result = products.filter((product) => 
      product.name.toLowerCase().includes(search.toLowerCase())
    );
    
    if (filter === "listed") result = result.filter(p => p.isActive);
    if (filter === "unlisted") result = result.filter(p => !p.isActive);
    
    if (sortBy === "newest") result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (sortBy === "oldest") result.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    if (sortBy === "price-low") result.sort((a, b) => a.price - b.price);
    if (sortBy === "price-high") result.sort((a, b) => b.price - a.price);
    if (sortBy === "name") result.sort((a, b) => a.name.localeCompare(b.name));
    
    return result;
  }, [products, search, filter, sortBy]);

  const stats = useMemo(() => ({
    total: products.length,
    listed: products.filter(p => p.isActive).length,
    unlisted: products.filter(p => !p.isActive).length,
  }), [products]);

  const handleListToggle = async (productId, newStatus) => {
    try {
      await listOrUnlistProduct(productId, newStatus);
      setProducts(prev => prev.map(p => p._id === productId ? { ...p, isActive: newStatus } : p));
      // Update selected product if modal is open
      if (selectedProduct?._id === productId) {
        setSelectedProduct(prev => ({ ...prev, isActive: newStatus }));
      }
      toast.success(`Product ${newStatus ? "listed" : "unlisted"}!`);
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async (productId, productName) => {
    const result = await Swal.fire({
      title: `Delete "${productName}"?`,
      text: "This cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Delete",
    });
    if (result.isConfirmed) {
      try {
        await deleteProduct(productId);
        setProducts(prev => prev.filter(p => p._id !== productId));
        setIsDetailModalOpen(false);
        setSelectedProduct(null);
        toast.success("Deleted!");
      } catch (error) {
        toast.error("Failed to delete");
      }
    }
  };

  const handleProductUpdate = async (updatedProduct) => {
    try {
      // Handle image upload if image was changed (base64)
      let imageUrl = updatedProduct.image;
      if (updatedProduct.image?.startsWith('data:')) {
        const uploaded = await uploadImageToCloud(updatedProduct.image);
        imageUrl = uploaded.secure_url;
      }

      const response = await updateProduct({
        id: updatedProduct._id,
        name: updatedProduct.name,
        price: updatedProduct.price,
        description: updatedProduct.description,
        image: imageUrl,
        customizable: updatedProduct.customizable,
        customizations: updatedProduct.customizations
      });
      
      const updated = { ...updatedProduct, image: imageUrl, ...response.data.updatedProduct };
      setProducts(prev => prev.map(p => p._id === updatedProduct._id ? updated : p));
      setSelectedProduct(updated);
      toast.success("Updated!");
    } catch (error) {
      toast.error("Failed to update");
      throw error;
    }
  };

  const openDetailModal = (product) => {
    setSelectedProduct(product);
    setIsDetailModalOpen(true);
  };

  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedProduct(null);
  };

  const filterOptions = [
    { value: 'all', label: 'All Items', count: stats.total },
    { value: 'listed', label: 'Listed', count: stats.listed },
    { value: 'unlisted', label: 'Unlisted', count: stats.unlisted },
  ];

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'name', label: 'Name A-Z' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="px-4 lg:px-6 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-xl font-bold text-slate-900">Menu</h1>
              <div className="flex gap-3 mt-1">
                <span className="text-sm text-slate-500">{stats.total} items</span>
                <span className="text-sm text-emerald-600">{stats.listed} listed</span>
                <span className="text-sm text-slate-400">{stats.unlisted} unlisted</span>
              </div>
            </div>
            <button
              onClick={() => navigate("/vendor/add-items")}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm font-medium"
            >
              <FiPlus className="w-4 h-4" />
              Add Item
            </button>
          </div>
        </div>
        
        {/* Filters Bar */}
        {!loading && products.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="px-4 lg:px-6 pb-4 flex flex-wrap gap-3 items-center"
          >
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search items..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            
            {/* Filter & Sort */}
            <div className="relative">
              <button
                onClick={() => setShowFilterMenu(!showFilterMenu)}
                className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm hover:bg-slate-50"
              >
                <FiFilter className="w-4 h-4 text-slate-500" />
                <span>{filterOptions.find(f => f.value === filter)?.label}</span>
              </button>
              
              <AnimatePresence>
                {showFilterMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowFilterMenu(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="absolute left-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-20 py-2 w-56"
                    >
                      <div className="px-3 py-1 text-xs font-medium text-slate-400 uppercase">Filter</div>
                      {filterOptions.map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => { setFilter(opt.value); setShowFilterMenu(false); }}
                          className={`w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-slate-50 ${filter === opt.value ? 'text-orange-600 bg-orange-50' : 'text-slate-700'}`}
                        >
                          <span>{opt.label}</span>
                          <span className="text-xs text-slate-400">{opt.count}</span>
                        </button>
                      ))}
                      <div className="border-t border-slate-100 my-2" />
                      <div className="px-3 py-1 text-xs font-medium text-slate-400 uppercase">Sort</div>
                      {sortOptions.map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => { setSortBy(opt.value); setShowFilterMenu(false); }}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 ${sortBy === opt.value ? 'text-orange-600 bg-orange-50' : 'text-slate-700'}`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
            
            {/* View Toggle */}
            <div className="flex bg-white border border-slate-200 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-slate-100' : ''}`}
              >
                <FiGrid className={`w-4 h-4 ${viewMode === 'grid' ? 'text-slate-900' : 'text-slate-400'}`} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-slate-100' : ''}`}
              >
                <FiList className={`w-4 h-4 ${viewMode === 'list' ? 'text-slate-900' : 'text-slate-400'}`} />
              </button>
            </div>
          </motion.div>
        )}
      </div>

      <div className="px-4 lg:px-6 py-6">
        <AnimatePresence mode="wait">
          {loading && (
            <motion.div
              key="skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}
            >
              {[...Array(6)].map((_, i) => <ProductSkeleton key={i} />)}
            </motion.div>
          )}

          {!loading && hasError && (
            <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ErrorState onRetry={fetchProducts} />
            </motion.div>
          )}

          {!loading && !hasError && products.length === 0 && (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <EmptyState onAddClick={() => navigate("/vendor/add-items")} hasSearch={false} />
            </motion.div>
          )}

          {!loading && !hasError && products.length > 0 && filteredProducts.length === 0 && (
            <motion.div key="no-results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <EmptyState hasSearch={true} onClearSearch={() => setSearch("")} />
            </motion.div>
          )}

          {!loading && !hasError && filteredProducts.length > 0 && (
            <motion.div
              key="products"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1 max-w-3xl'}`}
            >
              {filteredProducts.map((product, index) => (
                <motion.div 
                  key={product._id} 
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <ProductCard
                    product={product}
                    onClick={() => openDetailModal(product)}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Item Detail Modal */}
      <ItemDetailModal
        isOpen={isDetailModalOpen}
        onClose={closeDetailModal}
        product={selectedProduct}
        onSave={handleProductUpdate}
        onDelete={handleDelete}
        onToggleList={handleListToggle}
        offers={offers}
      />
    </div>
  );
};

export default Menu;