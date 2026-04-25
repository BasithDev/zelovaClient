import { useState, useMemo } from "react";
import { MdArrowBack, MdSearch, MdFavorite, MdSentimentDissatisfied, MdFilterList, MdStorefront } from "react-icons/md";
import { AiFillHeart } from 'react-icons/ai';
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import debounce from 'lodash/debounce';
import { getFavourites, removeFavorite } from "../../Services/apiServices";
import { useNavigate } from 'react-router-dom';

const Favourites = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [menuSearchQuery, setMenuSearchQuery] = useState("");
  const [debouncedMenuSearch, setDebouncedMenuSearch] = useState("");
  const [sortOrder, setSortOrder] = useState('none');
  const [showSort, setShowSort] = useState(false);

  // Fetch favourites with React Query (cached)
  const { data: favResponse, isLoading: loading } = useQuery({
    queryKey: ['favorites'],
    queryFn: () => getFavourites(),
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    cacheTime: 10 * 60 * 1000,
  });

  const favourites = favResponse?.data?.favorites || [];

  const debouncedSetMenuSearch = useMemo(
    () => debounce((value) => setDebouncedMenuSearch(value), 300),
    []
  );

  const handleMenuSearchChange = (e) => {
    const value = e.target.value;
    setMenuSearchQuery(value);
    debouncedSetMenuSearch(value);
  };

  const filteredFavorites = useMemo(() => {
    const query = debouncedMenuSearch.toLowerCase().trim();
    if (!query) return favourites;
    return favourites.filter(fav =>
      fav.item?.name?.toLowerCase().includes(query) ||
      fav.item?.description?.toLowerCase().includes(query) ||
      fav.item?.restaurantId?.name?.toLowerCase().includes(query)
    );
  }, [debouncedMenuSearch, favourites]);

  const sortedFavorites = useMemo(() => {
    if (sortOrder === 'none') return filteredFavorites;
    return [...filteredFavorites].sort((a, b) => {
      if (sortOrder === 'lowToHigh') return a.item.price - b.item.price;
      if (sortOrder === 'highToLow') return b.item.price - a.item.price;
      return 0;
    });
  }, [filteredFavorites, sortOrder]);

  const handleRemoveFavorite = async (e, foodItemId) => {
    e.stopPropagation();
    try {
      await removeFavorite({ foodItemId });
      queryClient.invalidateQueries(['favorites']);
    } catch (error) {
      console.error("Error removing favorite:", error);
    }
  };

  const sortOptions = [
    { value: 'none', label: 'Default' },
    { value: 'lowToHigh', label: 'Price: Low to High' },
    { value: 'highToLow', label: 'Price: High to Low' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <MdArrowBack className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-xl font-semibold text-gray-900">Favourites</h1>
          </div>
          <div className="relative">
            <button
              onClick={() => setShowSort(!showSort)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <MdFilterList className="w-5 h-5 text-gray-600" />
            </button>
            <AnimatePresence>
              {showSort && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-10 min-w-[160px]"
                >
                  {sortOptions.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => { setSortOrder(opt.value); setShowSort(false); }}
                      className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
                        sortOrder === opt.value ? 'bg-orange-50 text-orange-600 font-medium' : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative mb-6"
        >
          <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={menuSearchQuery}
            onChange={handleMenuSearchChange}
            placeholder="Search favourites..."
            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white transition-all"
          />
        </motion.div>

        {/* Content */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100 animate-pulse">
                <div className="h-40 bg-gray-200" />
                <div className="p-4 space-y-2">
                  <div className="h-5 w-32 bg-gray-200 rounded" />
                  <div className="h-4 w-48 bg-gray-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : sortedFavorites.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              {debouncedMenuSearch ? (
                <MdSentimentDissatisfied className="w-10 h-10 text-gray-400" />
              ) : (
                <MdFavorite className="w-10 h-10 text-gray-400" />
              )}
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              {debouncedMenuSearch ? 'No results found' : 'No favourites yet'}
            </h2>
            <p className="text-sm text-gray-500">
              {debouncedMenuSearch 
                ? `Try a different search term`
                : 'Start adding items to your favourites'}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {sortedFavorites.map((item, index) => (
                <motion.div
                  key={item._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ delay: index * 0.03 }}
                  onClick={() => navigate(`/menu/${item.item?.restaurantId?._id}`)}
                  className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex">
                    {/* Image */}
                    <div className="relative w-32 h-32 flex-shrink-0">
                      {item.item?.image ? (
                        <img
                          src={item.item.image}
                          alt={item.item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <MdStorefront className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                      {item.item?.offers && (
                        <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-green-500 text-white text-xs font-medium rounded">
                          {item.item.offers.offerName}
                        </div>
                      )}
                    </div>
                    {/* Content */}
                    <div className="flex-1 p-4 flex flex-col justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{item.item?.name}</h3>
                        <p className="text-sm text-gray-500 line-clamp-1">{item.item?.description}</p>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div>
                          <span className="text-lg font-bold text-green-600">₹{item.item?.price}</span>
                          <p className="text-xs text-gray-500">{item.item?.restaurantId?.name}</p>
                        </div>
                        <button
                          onClick={(e) => handleRemoveFavorite(e, item.item._id)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <AiFillHeart className="w-6 h-6 text-red-500" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default Favourites;