import { useState } from 'react';
import { MdArrowBack, MdLocationOn, MdPhone, MdAccessTime, MdSearchOff } from 'react-icons/md';
import { FiPhone } from 'react-icons/fi';
import { useQuery } from '@tanstack/react-query';
import { getSupplies } from '../../Services/apiServices';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const GetSupplies = () => {
  const navigate = useNavigate();
  const userLocation = useSelector(state => state?.userLocation?.coordinates);
  const [lat, lon] = userLocation ? Object.values(userLocation) : [0, 0];

  // Fetch supplies with React Query (cached)
  const { data: suppliesResponse, isLoading: loading } = useQuery({
    queryKey: ['supplies', lat, lon],
    queryFn: () => getSupplies(lat, lon),
    enabled: !!(lat && lon),
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    cacheTime: 10 * 60 * 1000,
  });

  const supplies = suppliesResponse?.data?.supplies || [];

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-6"
        >
          <button 
            onClick={() => navigate('/')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <MdArrowBack className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Get Supplies</h1>
            <p className="text-sm text-gray-500">Find essential supplies near you</p>
          </div>
        </motion.div>

        {/* Location Info */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-orange-50 rounded-xl p-4 mb-6 flex items-center gap-3"
        >
          <div className="p-2 bg-orange-100 rounded-lg">
            <MdLocationOn className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">Showing supplies near you</p>
            <p className="text-xs text-gray-500">Based on your current location</p>
          </div>
        </motion.div>

        {/* Content */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 animate-pulse">
                <div className="flex justify-between mb-3">
                  <div className="h-5 w-32 bg-gray-200 rounded" />
                  <div className="h-5 w-16 bg-gray-200 rounded-full" />
                </div>
                <div className="h-4 w-full bg-gray-200 rounded mb-2" />
                <div className="h-4 w-3/4 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        ) : supplies.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MdSearchOff className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">No Supplies Found</h2>
            <p className="text-sm text-gray-500 mb-6">There are no supplies shared in your area yet</p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/share-supplies')}
              className="px-6 py-3 bg-orange-500 text-white font-medium rounded-xl hover:bg-orange-600 transition-colors"
            >
              Share Your Supplies
            </motion.button>
          </motion.div>
        ) : (
          <AnimatePresence>
            <div className="space-y-4">
              {supplies.map((supply, index) => (
                <motion.div
                  key={supply._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h3 className="font-semibold text-gray-900">{supply.heading}</h3>
                    <span className="flex-shrink-0 px-2.5 py-1 bg-orange-100 text-orange-600 text-xs font-medium rounded-full">
                      {supply.distance.toFixed(1)} km
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{supply.description}</p>

                  {/* Footer */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <MdPhone className="w-3.5 h-3.5" />
                        {supply.contactNumber}
                      </span>
                      <span className="flex items-center gap-1">
                        <MdAccessTime className="w-3.5 h-3.5" />
                        {formatDate(supply.createdAt)}
                      </span>
                    </div>
                    <motion.a
                      href={`tel:${supply.contactNumber}`}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-2.5 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
                    >
                      <FiPhone className="w-4 h-4" />
                    </motion.a>
                  </div>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default GetSupplies;