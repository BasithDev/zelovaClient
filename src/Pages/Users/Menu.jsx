import { useState, useEffect, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { FaPlus, FaMinus, FaStar, FaHeart, FaRegHeart } from "react-icons/fa";
import { MdArrowBack, MdSearch, MdClose, MdKeyboardArrowDown, MdKeyboardArrowUp } from "react-icons/md";
import { HiOutlineAdjustmentsHorizontal } from "react-icons/hi2";
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { getMenuForUser, addFavorite, removeFavorite, getFavourites } from '../../Services/apiServices';
import { useSelector } from "react-redux";
import { calculateDistanceAndTime } from '../../utils/distanceUtils';
import { AnimatePresence, motion } from "framer-motion";
import { toast } from 'react-hot-toast';
import debounce from 'lodash/debounce';
import { useCart } from "../../Hooks/useCart";
import RestaurantCard from "../../Components/RestaurantCard/RestaurantCard";

const Menu = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const location = useLocation();
    
    // State
    const [menuSearchQuery, setMenuSearchQuery] = useState("");
    const [debouncedMenuSearch, setDebouncedMenuSearch] = useState("");
    const [favorites, setFavorites] = useState(new Set());
    const [expandedCategories, setExpandedCategories] = useState({});
    const [showFilters, setShowFilters] = useState(false);
    const [sortBy, setSortBy] = useState('default');
    const [vegOnly, setVegOnly] = useState(false);
    
    // Customization modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCustomizations, setSelectedCustomizations] = useState({});
    const [selectedItem, setSelectedItem] = useState(null);

    const { cart, updateCartMutation } = useCart();
    const userLocation = useSelector((state) => state.userLocation);
    const { lat, lng: lon } = userLocation?.coordinates || {};

    // Debounced search
    const debouncedSetMenuSearch = useMemo(
        () => debounce((value) => setDebouncedMenuSearch(value), 300),
        []
    );

    useEffect(() => {
        return () => debouncedSetMenuSearch.cancel();
    }, [debouncedSetMenuSearch]);

    const handleMenuSearchChange = (value) => {
        setMenuSearchQuery(value);
        debouncedSetMenuSearch(value);
    };

    // Cart operations
    const handleCartUpdation = (itemId, action, customizations = null) => {
        const payload = {
            itemId,
            action,
            selectedCustomizations: customizations
        };
        updateCartMutation.mutate(payload);
    };

    const getItemQuantity = useCallback((itemId) => {
        return cart?.data?.cart?.items?.find((cartItem) => cartItem?.item._id === itemId)?.quantity || 0;
    }, [cart?.data?.cart?.items]);

    const getItemCustomizations = useCallback((itemId) => {
        return cart?.data?.cart?.items?.find((cartItem) => cartItem?.item._id === itemId)?.selectedCustomizations;
    }, [cart?.data?.cart?.items]);

    // Customization Modal handlers
    const handleModalOpen = (item) => {
        setSelectedItem(item);
        const defaultSelections = {};
        item.customizations?.forEach(customization => {
            // Only set default selection for variants (required), not add-ons (optional)
            if (customization.type === 'version') {
                defaultSelections[customization.fieldName] = customization.options[0];
            }
        });
        setSelectedCustomizations(defaultSelections);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedItem(null);
        setSelectedCustomizations({});
    };

    const handleCustomizationChange = (fieldName, option) => {
        setSelectedCustomizations(prev => ({ ...prev, [fieldName]: option }));
    };

    const handleAddWithCustomizations = (e) => {
        e?.preventDefault();
        if (!selectedItem) return;
        
        // Filter out any undefined/null options (unselected add-ons)
        const formattedCustomizations = Object.entries(selectedCustomizations)
            .filter(([, option]) => option != null)
            .map(([fieldName, option]) => ({
                fieldName,
                options: option
            }));
        handleCartUpdation(selectedItem._id, 'add', formattedCustomizations);
        closeModal();
    };

    const handleCustomizableItemUpdate = (item, action) => {
        const existingCustomizations = getItemCustomizations(item._id);
        if (action === 'add') {
            if (!existingCustomizations) {
                handleModalOpen(item);
            } else {
                handleCartUpdation(item._id, 'add', existingCustomizations);
            }
        } else {
            handleCartUpdation(item._id, 'remove');
        }
    };

    // Favorites
    const toggleFavorite = async (itemId, e) => {
        e?.stopPropagation();
        try {
            if (favorites.has(itemId)) {
                await removeFavorite({ foodItemId: itemId });
                setFavorites(prev => { const n = new Set(prev); n.delete(itemId); return n; });
                toast.success("Removed from favorites");
            } else {
                await addFavorite({ foodItemId: itemId });
                setFavorites(prev => new Set(prev).add(itemId));
                toast.success("Added to favorites");
            }
        } catch (error) {
            toast.error("Failed to update favorites");
        }
    };

    // Category expand/collapse
    const toggleCategory = (category) => {
        setExpandedCategories(prev => ({ ...prev, [category]: !prev[category] }));
    };

    // Handle deep link from home page category click
    useEffect(() => {
        if (location.state?.foodCategory) {
            setTimeout(() => {
                const el = document.getElementById(location.state.foodCategory);
                el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 500);
        }
    }, [location.state]);

    // Fetch menu data with React Query (cached)
    const { data: menuData, isLoading: menuLoading } = useQuery({
        queryKey: ['menu', id, lat, lon],
        queryFn: () => getMenuForUser(id, lat, lon),
        enabled: !!(id && lat && lon),
        staleTime: 5 * 60 * 1000, // 5 minutes cache
        cacheTime: 10 * 60 * 1000, // 10 minutes
        onError: () => toast.error("Failed to load menu"),
    });

    // Fetch favorites with React Query (cached)
    const { data: favData } = useQuery({
        queryKey: ['favorites'],
        queryFn: () => getFavourites(),
        staleTime: 5 * 60 * 1000,
        cacheTime: 10 * 60 * 1000,
    });

    // Derived state from cached data
    const restaurant = menuData?.data?.restaurant || null;
    const menuItems = menuData?.data?.menu || [];
    const loading = menuLoading;

    // Initialize expanded categories when menu loads
    useEffect(() => {
        if (menuItems.length > 0 && Object.keys(expandedCategories).length === 0) {
            const cats = {};
            menuItems.forEach(item => {
                const catName = item.foodCategory?.name || 'Other';
                cats[catName] = true;
            });
            setExpandedCategories(cats);
        }
    }, [menuItems, expandedCategories]);

    // Set favorites when data loads
    useEffect(() => {
        if (favData?.data?.favorites) {
            const favoriteIds = favData.data.favorites.map(f => f.item._id);
            setFavorites(new Set(favoriteIds));
        }
    }, [favData]);

    // Computed data
    const { distanceInKm, timeInMinutes } = restaurant ? calculateDistanceAndTime(restaurant.distance) : { distanceInKm: 0, timeInMinutes: 0 };

    const menuByCategory = useMemo(() => {
        return menuItems.reduce((acc, item) => {
            const categoryName = item.foodCategory?.name || 'Other';
            if (!acc[categoryName]) acc[categoryName] = [];
            acc[categoryName].push(item);
            return acc;
        }, {});
    }, [menuItems]);

    const filteredMenu = useMemo(() => {
        const query = debouncedMenuSearch.toLowerCase().trim();
        
        return Object.entries(menuByCategory).reduce((acc, [category, items]) => {
            let filtered = items;

            // Search filter
            if (query) {
                filtered = filtered.filter(item =>
                    item.name.toLowerCase().includes(query) ||
                    item.description?.toLowerCase().includes(query)
                );
            }

            // Veg only filter
            if (vegOnly) {
                filtered = filtered.filter(item => item.isVeg);
            }

            // Sort
            if (sortBy === 'price-low') {
                filtered = [...filtered].sort((a, b) => a.price - b.price);
            } else if (sortBy === 'price-high') {
                filtered = [...filtered].sort((a, b) => b.price - a.price);
            } else if (sortBy === 'rating') {
                filtered = [...filtered].sort((a, b) => (b.rating || 0) - (a.rating || 0));
            }

            if (filtered.length > 0) acc[category] = filtered;
            return acc;
        }, {});
    }, [menuByCategory, debouncedMenuSearch, vegOnly, sortBy]);

    const totalItems = Object.values(filteredMenu).flat().length;
    const cartItemCount = cart?.data?.cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
    const cartTotal = cart?.data?.cart?.totalAmount || 0;

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 p-4">
                <div className="animate-pulse space-y-6">
                    <div className="h-64 bg-gray-200 rounded-lg" />
                    <div className="h-12 bg-gray-200 rounded-lg" />
                    {[1,2,3].map(i => (
                        <div key={i} className="bg-white rounded-2xl p-6 flex gap-6">
                            <div className="flex-1 space-y-3">
                                <div className="h-6 bg-gray-200 rounded w-3/4" />
                                <div className="h-4 bg-gray-200 rounded w-full" />
                                <div className="h-5 bg-gray-200 rounded w-1/4" />
                            </div>
                            <div className="w-36 h-36 bg-gray-200 rounded-xl" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-28">
            {/* Back Button */}
            <div className="sticky top-0 z-30 bg-white border-b border-gray-100 px-4 py-3">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-gray-700 hover:text-gray-900"
                >
                    <MdArrowBack className="w-5 h-5" />
                    <span className="font-medium">Back</span>
                </button>
            </div>

            {/* Restaurant Card with Outlet-Location Design */}
            {restaurant && (
                <div className="p-4">
                    <RestaurantCard
                        restaurant={restaurant}
                        distanceInKm={distanceInKm}
                        timeInMinutes={timeInMinutes}
                    />
                </div>
            )}

            {/* Search & Filter Bar */}
            <div className="sticky top-12 z-20 bg-white border-b border-gray-100 px-4 py-4">
                <div className="flex items-center gap-3">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            value={menuSearchQuery}
                            onChange={(e) => handleMenuSearchChange(e.target.value)}
                            placeholder="Search in menu"
                            className="w-full pl-12 pr-4 py-3 bg-gray-100 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:bg-white focus:border focus:border-orange-300"
                        />
                        {menuSearchQuery && (
                            <button
                                onClick={() => handleMenuSearchChange('')}
                                className="absolute right-4 top-1/2 -translate-y-1/2"
                            >
                                <MdClose className="w-5 h-5 text-gray-400" />
                            </button>
                        )}
                    </div>

                    {/* Filter Button */}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`p-3 rounded-xl border transition-colors ${
                            showFilters || vegOnly || sortBy !== 'default' 
                                ? 'border-orange-500 bg-orange-50 text-orange-600' 
                                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                        <HiOutlineAdjustmentsHorizontal className="w-5 h-5" />
                    </button>
                </div>

                {/* Filter Options */}
                <AnimatePresence>
                    {showFilters && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="flex flex-wrap gap-2 pt-4">
                                {/* Veg Only Toggle */}
                                <button
                                    onClick={() => setVegOnly(!vegOnly)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                                        vegOnly ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    <span className={`w-4 h-4 rounded border-2 flex items-center justify-center ${vegOnly ? 'border-white' : 'border-green-600'}`}>
                                        <span className={`w-2 h-2 rounded-full ${vegOnly ? 'bg-white' : 'bg-green-600'}`} />
                                    </span>
                                    Pure Veg
                                </button>

                                {/* Sort Options */}
                                {[
                                    { id: 'default', label: 'Relevance' },
                                    { id: 'price-low', label: 'Price ↑' },
                                    { id: 'price-high', label: 'Price ↓' },
                                    { id: 'rating', label: 'Rating' }
                                ].map(option => (
                                    <button
                                        key={option.id}
                                        onClick={() => setSortBy(option.id)}
                                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                                            sortBy === option.id 
                                                ? 'bg-orange-500 text-white' 
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Menu Items */}
            <div className="px-4 py-4">
                {/* Results count */}
                {debouncedMenuSearch && (
                    <p className="text-base text-gray-500 mb-4">
                        {totalItems} {totalItems === 1 ? 'item' : 'items'} found for "{debouncedMenuSearch}"
                    </p>
                )}

                {/* No results */}
                {totalItems === 0 && (
                    <div className="text-center py-16">
                        <p className="text-lg text-gray-600">No items found</p>
                        {(vegOnly || sortBy !== 'default' || debouncedMenuSearch) && (
                            <button
                                onClick={() => { setVegOnly(false); setSortBy('default'); handleMenuSearchChange(''); }}
                                className="mt-3 text-orange-500 font-medium hover:text-orange-600"
                            >
                                Clear all filters
                            </button>
                        )}
                    </div>
                )}

                {/* Categories */}
                {Object.entries(filteredMenu).map(([categoryName, items]) => (
                    <div key={categoryName} id={categoryName} className="mb-6">
                        {/* Category Header */}
                        <button
                            onClick={() => toggleCategory(categoryName)}
                            className="w-full flex items-center justify-between py-4 border-b-2 border-gray-200"
                        >
                            <h3 className="text-xl font-bold text-gray-900">
                                {categoryName} <span className="text-gray-500 font-normal">({items.length})</span>
                            </h3>
                            {expandedCategories[categoryName] ? (
                                <MdKeyboardArrowUp className="w-6 h-6 text-gray-500" />
                            ) : (
                                <MdKeyboardArrowDown className="w-6 h-6 text-gray-500" />
                            )}
                        </button>

                        {/* Category Items */}
                        <AnimatePresence>
                            {expandedCategories[categoryName] && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                >
                                    {items.map((item, idx) => (
                                        <div
                                            key={item._id}
                                            className={`bg-white rounded-2xl shadow-sm p-5 mt-4 flex gap-5 ${idx !== items.length - 1 ? '' : ''}`}
                                        >
                                            {/* Item Info */}
                                            <div className="flex-1">
                                                {/* Veg/Non-veg indicator + Customizable */}
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className={`w-5 h-5 border-2 ${item.isVeg ? 'border-green-600' : 'border-red-600'} rounded flex items-center justify-center`}>
                                                        <span className={`w-2.5 h-2.5 rounded-full ${item.isVeg ? 'bg-green-600' : 'bg-red-600'}`} />
                                                    </span>
                                                    {item.customizable && (
                                                        <span className="text-xs text-orange-600 font-semibold bg-orange-50 px-2 py-0.5 rounded">Customizable</span>
                                                    )}
                                                </div>

                                                <h4 className="text-xl font-bold text-gray-900">{item.name}</h4>
                                                <p className="text-lg font-bold text-gray-900 mt-1">₹{item.price}</p>
                                                
                                                {item.description && (
                                                    <p className="text-base text-gray-500 mt-2 line-clamp-2">{item.description}</p>
                                                )}
                                                
                                                {/* Offer */}
                                                {item.offers?.offerName && (
                                                    <p className="text-sm text-green-600 font-semibold mt-3 bg-green-50 px-3 py-1.5 rounded-lg inline-block">
                                                        {item.offers.offerName}
                                                    </p>
                                                )}

                                                {/* Favorite Button */}
                                                <button
                                                    onClick={(e) => toggleFavorite(item._id, e)}
                                                    className="mt-3 p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                                                >
                                                    {favorites.has(item._id) ? (
                                                        <FaHeart className="w-5 h-5 text-red-500" />
                                                    ) : (
                                                        <FaRegHeart className="w-5 h-5 text-gray-400" />
                                                    )}
                                                </button>
                                            </div>

                                            {/* Image & Add Button */}
                                            <div className="flex-shrink-0 flex flex-col items-center">
                                                {item.image ? (
                                                    <img
                                                        src={item.image}
                                                        alt={item.name}
                                                        className="w-40 h-36 object-cover rounded-2xl shadow-md"
                                                    />
                                                ) : (
                                                    <div className="w-40 h-36 bg-gray-100 rounded-2xl flex items-center justify-center">
                                                        <span className="text-gray-400 text-sm">No image</span>
                                                    </div>
                                                )}

                                                {/* Add/Quantity Button */}
                                                <div className="-mt-5">
                                                    {getItemQuantity(item._id) > 0 ? (
                                                        <div className="flex items-center bg-white border-2 border-green-600 rounded-xl shadow-lg overflow-hidden">
                                                            <button
                                                                onClick={() => item.customizable 
                                                                    ? handleCustomizableItemUpdate(item, 'remove')
                                                                    : handleCartUpdation(item._id, 'remove')
                                                                }
                                                                className="px-4 py-2.5 text-green-600 hover:bg-green-50 transition-colors"
                                                            >
                                                                <FaMinus className="w-4 h-4" />
                                                            </button>
                                                            <span className="px-4 text-green-600 font-bold text-lg">
                                                                {getItemQuantity(item._id)}
                                                            </span>
                                                            <button
                                                                onClick={() => item.customizable 
                                                                    ? handleCustomizableItemUpdate(item, 'add')
                                                                    : handleCartUpdation(item._id, 'add')
                                                                }
                                                                className="px-4 py-2.5 text-green-600 hover:bg-green-50 transition-colors"
                                                            >
                                                                <FaPlus className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => item.customizable 
                                                                ? handleModalOpen(item) 
                                                                : handleCartUpdation(item._id, 'add')
                                                            }
                                                            className="px-8 py-2.5 bg-white border-2 border-green-600 rounded-xl text-green-600 font-bold text-base shadow-lg hover:bg-green-50 transition-colors"
                                                        >
                                                            ADD
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ))}
            </div>

            {/* Customization Modal */}
            <AnimatePresence>
                {isModalOpen && selectedItem && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center"
                        onClick={closeModal}
                    >
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg max-h-[85vh] overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                                <h3 className="text-xl font-bold text-gray-900">{selectedItem.name}</h3>
                                <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-full">
                                    <MdClose className="w-6 h-6 text-gray-500" />
                                </button>
                            </div>

                            {/* Customization Options */}
                            <div className="p-6 overflow-y-auto max-h-[60vh]">
                                {selectedItem.customizations?.map((customization) => {
                                    const isVariant = customization.type === 'version';
                                    return (
                                        <div key={customization._id} className="mb-8">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="text-lg font-bold text-gray-900">{customization.fieldName}</h4>
                                                    <span className={`text-xs px-2 py-1 rounded ${
                                                        isVariant 
                                                            ? 'bg-blue-100 text-blue-700' 
                                                            : 'bg-green-100 text-green-700'
                                                    }`}>
                                                        {isVariant ? 'Variant' : 'Add-on'}
                                                    </span>
                                                </div>
                                                {customization.required && (
                                                    <span className="text-xs text-white bg-gray-500 px-2 py-1 rounded">Required</span>
                                                )}
                                            </div>
                                            <div className="space-y-3">
                                                {customization.options.map((option) => {
                                                    const isSelected = selectedCustomizations[customization.fieldName]?._id === option._id;
                                                    return (
                                                        <button
                                                            key={option._id}
                                                            type="button"
                                                            onClick={() => handleCustomizationChange(customization.fieldName, option)}
                                                            className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                                                                isSelected 
                                                                    ? isVariant ? 'border-blue-500 bg-blue-50' : 'border-green-500 bg-green-50'
                                                                    : 'border-gray-100 hover:border-gray-200'
                                                            }`}
                                                        >
                                                            <div className="flex items-center gap-4">
                                                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                                                                    isSelected 
                                                                        ? isVariant ? 'border-blue-500' : 'border-green-500'
                                                                        : 'border-gray-300'
                                                                }`}>
                                                                    {isSelected && (
                                                                        <div className={`w-3.5 h-3.5 rounded-full ${
                                                                            isVariant ? 'bg-blue-500' : 'bg-green-500'
                                                                        }`} />
                                                                    )}
                                                                </div>
                                                                <span className="text-lg font-medium text-gray-900">{option.name}</span>
                                                            </div>
                                                            <span className="text-lg font-bold text-gray-900">
                                                                {isVariant ? `₹ ${option.price}` : `+ ₹${option.price}`}
                                                            </span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Modal Footer */}
                            <div className="sticky bottom-0 bg-white border-t border-gray-100 p-6">
                                <button
                                    onClick={handleAddWithCustomizations}
                                    className="w-full py-4 bg-green-600 text-white font-bold text-lg rounded-2xl hover:bg-green-700 transition-colors"
                                >
                                    Add to Cart • ₹{
                                        (() => {
                                            // Find if there's a variant selected - if so, use that price instead of base
                                            const variantCustomization = selectedItem.customizations?.find(c => c.type === 'version');
                                            const selectedVariant = variantCustomization 
                                                ? selectedCustomizations[variantCustomization.fieldName] 
                                                : null;
                                            
                                            // Base price is variant price if selected, otherwise item price
                                            const basePrice = selectedVariant ? selectedVariant.price : selectedItem.price;
                                            
                                            // Add only add-on prices (not variant prices)
                                            const addOnTotal = Object.entries(selectedCustomizations).reduce((sum, [fieldName, opt]) => {
                                                const customization = selectedItem.customizations?.find(c => c.fieldName === fieldName);
                                                // Only add price if it's an add-on (not a variant)
                                                if (customization?.type !== 'version' && opt?.price) {
                                                    return sum + opt.price;
                                                }
                                                return sum;
                                            }, 0);
                                            
                                            return basePrice + addOnTotal;
                                        })()
                                    }
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Menu;