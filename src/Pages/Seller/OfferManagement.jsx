import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiTrash2, FiPercent, FiGift, FiDollarSign } from 'react-icons/fi';
import { getOffers, addOffer, deleteOffer } from '../../Services/apiServices';
import { toast } from 'react-hot-toast';
import Swal from 'sweetalert2';

// Skeleton Component
const OfferSkeleton = () => (
  <div className="bg-white rounded-lg border border-slate-200 p-5 animate-pulse">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-slate-200 rounded-lg" />
      <div className="flex-1">
        <div className="h-5 w-3/4 bg-slate-200 rounded mb-2" />
        <div className="h-4 w-1/2 bg-slate-200 rounded" />
      </div>
    </div>
  </div>
);

const OfferManagement = () => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newOffer, setNewOffer] = useState({
    offerName: '',
    discountAmount: '',
    discountType: 'percentage',
    requiredQuantity: ''
  });

  const fetchOffers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getOffers();
      setOffers(response.data.offers || []);
      // Smooth transition delay
      setTimeout(() => {
        setLoading(false);
      }, 300);
    } catch (error) {
      if (error.response?.status >= 500) {
        toast.error('Failed to load offers');
      }
      console.error('Error fetching offers:', error);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  const handleAddOffer = async (e) => {
    e.preventDefault();
    if (!newOffer.offerName.trim() || !newOffer.discountAmount || !newOffer.requiredQuantity) {
      toast.error('Please fill all fields');
      return;
    }

    try {
      setIsAdding(true);
      await addOffer({
        offerName: newOffer.offerName,
        discountAmount: newOffer.discountAmount,
        requiredQuantity: newOffer.requiredQuantity
      });
      toast.success('Offer added!');
      setShowAddModal(false);
      setNewOffer({ offerName: '', discountAmount: '', discountType: 'percentage', requiredQuantity: '' });
      fetchOffers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add offer');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteOffer = async (offerId, offerName) => {
    const result = await Swal.fire({
      title: `Delete "${offerName}"?`,
      text: 'This will remove the offer from all products using it.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Delete',
    });

    if (result.isConfirmed) {
      try {
        await deleteOffer(offerId);
        setOffers((prev) => prev.filter((o) => o._id !== offerId));
        toast.success('Offer deleted!');
      } catch (error) {
        toast.error('Failed to delete offer');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="px-4 lg:px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Offers</h1>
            <p className="text-sm text-slate-500">
              {offers.length} {offers.length === 1 ? 'offer' : 'offers'}
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium"
          >
            <FiPlus className="w-4 h-4" />
            Add Offer
          </button>
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
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {[...Array(3)].map((_, i) => <OfferSkeleton key={i} />)}
            </motion.div>
          )}

          {/* Empty State */}
          {!loading && offers.length === 0 && (
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
                <FiGift className="w-10 h-10 text-slate-400" />
              </motion.div>
              <h2 className="text-xl font-semibold text-slate-900 mb-2">No offers yet</h2>
              <p className="text-slate-500 mb-6 max-w-sm mx-auto">
                Create offers to attract customers with discounts
              </p>
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 transition-colors"
              >
                <FiPlus className="w-5 h-5" />
                Create First Offer
              </motion.button>
            </motion.div>
          )}

          {/* Offers Grid */}
          {!loading && offers.length > 0 && (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {offers.map((offer, index) => (
                <motion.div
                  key={offer._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-lg border border-slate-200 p-5 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                        <FiPercent className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">{offer.offerName}</h3>
                        <p className="text-sm text-slate-500">
                          {offer.discountAmount}% off on {offer.requiredQuantity}+ items
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteOffer(offer._id, offer.offerName)}
                      className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Add Offer Modal */}
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
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Add New Offer</h3>
              <form onSubmit={handleAddOffer} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Offer Name
                  </label>
                  <input
                    type="text"
                    value={newOffer.offerName}
                    onChange={(e) => setNewOffer({ ...newOffer, offerName: e.target.value })}
                    placeholder="e.g. Buy 2 Get Discount"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                {/* Discount Type Toggle */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Discount Type
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setNewOffer({ ...newOffer, discountType: 'percentage' })}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border transition-colors ${
                        newOffer.discountType === 'percentage'
                          ? 'bg-orange-50 border-orange-500 text-orange-700'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <FiPercent className="w-4 h-4" />
                      Percentage
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewOffer({ ...newOffer, discountType: 'amount' })}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border transition-colors ${
                        newOffer.discountType === 'amount'
                          ? 'bg-orange-50 border-orange-500 text-orange-700'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <FiDollarSign className="w-4 h-4" />
                      Fixed ₹
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      {newOffer.discountType === 'percentage' ? 'Discount (%)' : 'Discount (₹)'}
                    </label>
                    <input
                      type="number"
                      value={newOffer.discountAmount}
                      onChange={(e) => setNewOffer({ ...newOffer, discountAmount: e.target.value })}
                      placeholder={newOffer.discountType === 'percentage' ? '10' : '50'}
                      min="1"
                      max={newOffer.discountType === 'percentage' ? '100' : undefined}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Min. Quantity
                    </label>
                    <input
                      type="number"
                      value={newOffer.requiredQuantity}
                      onChange={(e) => setNewOffer({ ...newOffer, requiredQuantity: e.target.value })}
                      placeholder="2"
                      min="1"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
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
                      'Add Offer'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OfferManagement;
