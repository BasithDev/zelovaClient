import { FaStar } from "react-icons/fa";
import { MdLocationOn, MdKeyboardArrowDown, MdAccessTime, MdStorefront, MdLocalOffer, MdDeliveryDining, MdClose } from "react-icons/md";
import { HiOutlineAdjustmentsHorizontal } from "react-icons/hi2";
import { getRestaurantsForUser } from "../../Services/apiServices";
import { useSelector } from "react-redux";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Header from "../../Components/Common/Header";
import { calculateDistanceAndTime } from '../../utils/distanceUtils';

const Home = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState([]);
  const [sortBy, setSortBy] = useState('relevance');
  const [showSortMenu, setShowSortMenu] = useState(false);
  
  const userLocation = useSelector((state) => state?.userLocation);
  const { lat, lng: lon } = userLocation?.coordinates || {};
  const userAddress = userLocation?.address;

  const filters = [
    { id: 'fast-delivery', label: 'Fast Delivery', icon: MdDeliveryDining },
    { id: 'rating-4', label: 'Rating 4.0+', icon: FaStar },
    { id: 'offers', label: 'Offers', icon: MdLocalOffer },
    { id: 'nearby', label: 'Less than 3 km', icon: MdLocationOn },
  ];

  const sortOptions = [
    { id: 'relevance', label: 'Relevance (Default)' },
    { id: 'rating', label: 'Rating: High to Low' },
    { id: 'delivery-time', label: 'Delivery Time' },
    { id: 'distance', label: 'Distance' },
  ];

  // Fetch restaurants with React Query (cached)
  const { data: restaurantsResponse, isLoading: loading } = useQuery({
    queryKey: ['restaurants', lat, lon],
    queryFn: () => getRestaurantsForUser(lat, lon),
    enabled: !!(lat && lon),
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    cacheTime: 10 * 60 * 1000,
  });

  const originalData = restaurantsResponse?.data || [];
  const restaurantData = originalData;

  // Apply filters and sorting
  const filteredRestaurants = useMemo(() => {
    let result = [...originalData];

    // Apply filters
    activeFilters.forEach(filterId => {
      switch (filterId) {
        case 'fast-delivery':
          result = result.filter(r => r.distance < 5000); // Within 5km
          break;
        case 'rating-4':
          result = result.filter(r => r.avgRating >= 4.0);
          break;
        case 'offers':
          result = result.filter(r => r.offerName);
          break;
        case 'nearby':
          result = result.filter(r => r.distance < 3000); // Within 3km
          break;
      }
    });

    // Apply sorting
    switch (sortBy) {
      case 'rating':
        result.sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0));
        break;
      case 'delivery-time':
        result.sort((a, b) => a.distance - b.distance);
        break;
      case 'distance':
        result.sort((a, b) => a.distance - b.distance);
        break;
      default:
        // Relevance - mix of rating and distance
        result.sort((a, b) => {
          const scoreA = (a.avgRating || 0) * 1000 - a.distance;
          const scoreB = (b.avgRating || 0) * 1000 - b.distance;
          return scoreB - scoreA;
        });
    }

    return result;
  }, [originalData, activeFilters, sortBy]);

  const toggleFilter = (filterId) => {
    setActiveFilters(prev => 
      prev.includes(filterId) 
        ? prev.filter(f => f !== filterId)
        : [...prev, filterId]
    );
  };

  const clearFilters = () => {
    setActiveFilters([]);
    setSortBy('relevance');
  };

  // Loading state when location is not available
  if (!lat || !lon) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <MdLocationOn className="w-8 h-8 text-orange-500" />
          </motion.div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Finding your location</h2>
          <p className="text-sm text-gray-500">Please allow location access</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Search */}
      <Header 
        searchQuery={searchQuery}
        onSearchChange={(e) => setSearchQuery(e.target.value)}
        placeholderText="Search for restaurants and food"
      />

      {/* Location Bar */}
      <div className="bg-white border-b border-gray-100 px-6 py-3">
        <button className="flex items-center gap-2 hover:bg-gray-50 px-3 py-2 -mx-3 rounded-lg transition-colors">
          <MdLocationOn className="w-5 h-5 text-orange-500" />
          <div className="text-left">
            <p className="text-xs text-gray-500 font-medium">Deliver to</p>
            <p className="text-sm font-semibold text-gray-900 flex items-center gap-1">
              {userAddress ? (userAddress.length > 40 ? userAddress.substring(0, 40) + '...' : userAddress) : 'Current Location'}
              <MdKeyboardArrowDown className="w-5 h-5 text-gray-400" />
            </p>
          </div>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white border-b border-gray-100 px-6 py-3 sticky top-0 z-20">
        <div className="flex items-center gap-3 overflow-x-auto hide-scrollbar">
          {/* Sort Button */}
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setShowSortMenu(!showSortMenu)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                sortBy !== 'relevance' 
                  ? 'border-orange-500 bg-orange-50 text-orange-600' 
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
              }`}
            >
              <HiOutlineAdjustmentsHorizontal className="w-4 h-4" />
              Sort
              <MdKeyboardArrowDown className="w-4 h-4" />
            </button>
            <AnimatePresence>
              {showSortMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute left-0 top-full mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-30 min-w-[200px]"
                >
                  {sortOptions.map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => { setSortBy(opt.id); setShowSortMenu(false); }}
                      className={`w-full px-4 py-3 text-left text-sm transition-colors ${
                        sortBy === opt.id ? 'bg-orange-50 text-orange-600 font-medium' : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Divider */}
          <div className="w-px h-6 bg-gray-200 flex-shrink-0" />

          {/* Filter Pills */}
          {filters.map(filter => {
            const isActive = activeFilters.includes(filter.id);
            const Icon = filter.icon;
            return (
              <button
                key={filter.id}
                onClick={() => toggleFilter(filter.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                  isActive 
                    ? 'border-orange-500 bg-orange-50 text-orange-600' 
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {filter.label}
                {isActive && <MdClose className="w-4 h-4 ml-1" />}
              </button>
            );
          })}

          {/* Clear Filters */}
          {(activeFilters.length > 0 || sortBy !== 'relevance') && (
            <button
              onClick={clearFilters}
              className="text-orange-500 text-sm font-medium whitespace-nowrap hover:text-orange-600 transition-colors px-2 flex-shrink-0"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {/* Results Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            {filteredRestaurants.length} restaurants
            {activeFilters.length > 0 && <span className="text-gray-500 font-normal text-base ml-2">matching your filters</span>}
          </h2>
        </div>

        {/* Restaurant Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm animate-pulse">
                <div className="h-44 bg-gray-200" />
                <div className="p-4 space-y-3">
                  <div className="h-5 w-3/4 bg-gray-200 rounded" />
                  <div className="h-4 w-1/2 bg-gray-200 rounded" />
                  <div className="h-4 w-1/3 bg-gray-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredRestaurants.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MdStorefront className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              {activeFilters.length > 0 ? 'No restaurants match your filters' : 'No Restaurants Found'}
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              {activeFilters.length > 0 ? 'Try adjusting your filters' : "We're not available in your area yet"}
            </p>
            {activeFilters.length > 0 && (
              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {filteredRestaurants.map((restaurant, index) => {
              const { distanceInKm, timeInMinutes } = calculateDistanceAndTime(restaurant.distance);
              return (
                <motion.div
                  key={restaurant._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  onClick={() => navigate(`restaurant/${restaurant._id}/menu`)}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all cursor-pointer group"
                >
                  {/* Image */}
                  <div className="relative h-44 overflow-hidden">
                    {restaurant.image ? (
                      <img
                        src={restaurant.image}
                        alt={restaurant.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                        <MdStorefront className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                    {/* Offer Badge */}
                    {restaurant.offerName && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-8">
                        <span className="text-white font-bold text-sm uppercase tracking-wide">
                          {restaurant.offerName}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="text-lg font-bold text-gray-900 line-clamp-1">{restaurant.name}</h3>
                      <div className={`flex-shrink-0 flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-bold ${
                        restaurant.avgRating >= 4.0 ? 'bg-green-600' : restaurant.avgRating ? 'bg-green-500' : 'bg-gray-400'
                      } text-white`}>
                        {restaurant.avgRating ? restaurant.avgRating.toFixed(1) : 'New'}
                        <FaStar className="w-2.5 h-2.5" />
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-1 mb-2">{restaurant.address || 'Restaurant'}</p>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <span>{distanceInKm} km</span>
                      <span>•</span>
                      <span>{timeInMinutes} mins</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Home;