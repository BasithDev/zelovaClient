import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MdArrowBack, MdAdd, MdPhone, MdDescription, MdTitle, MdEdit, MdDelete, MdClose, MdAccessTime } from 'react-icons/md';
import { FiEdit2, FiTrash2, FiX } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { shareSupplies, viewSharedSupplies, updateSupplies, deleteSupplies } from '../../Services/apiServices';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

const ShareSupplies = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const userLocation = useSelector((state) => state?.userLocation?.coordinates);
  const [lat, lon] = userLocation ? Object.values(userLocation) : [0, 0];
  
  const [isSaving, setIsSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    heading: '',
    description: '',
    contactNumber: ''
  });

  // Fetch shared supplies with React Query (cached)
  const { data: suppliesResponse, isLoading: loading } = useQuery({
    queryKey: ['sharedSupplies'],
    queryFn: () => viewSharedSupplies(),
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    cacheTime: 10 * 60 * 1000,
  });

  const supplies = suppliesResponse?.data?.sharedSupplies || [];

  const resetForm = () => {
    setFormData({ heading: '', description: '', contactNumber: '' });
    setShowForm(false);
    setIsEditing(false);
    setEditingId(null);
  };

  const handleShare = async () => {
    if (!formData.heading || !formData.description || !formData.contactNumber) {
      toast.error('Please fill in all fields');
      return;
    }
    if (!/^[0-9]{10}$/.test(formData.contactNumber)) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }

    setIsSaving(true);
    try {
      await shareSupplies({ ...formData, lat, lon });
      queryClient.invalidateQueries(['sharedSupplies']);
      resetForm();
      toast.success('Supply shared successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error sharing supply');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!formData.heading || !formData.description || !formData.contactNumber) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsSaving(true);
    try {
      await updateSupplies({
        supplyId: editingId,
        ...formData
      });
      queryClient.invalidateQueries(['sharedSupplies']);
      resetForm();
      toast.success('Supply updated');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error updating supply');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteSupplies(id);
      queryClient.invalidateQueries(['sharedSupplies']);
      toast.success('Supply deleted');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error deleting supply');
    }
  };

  const handleEditClick = (supply) => {
    setFormData({
      heading: supply.heading,
      description: supply.description,
      contactNumber: supply.contactNumber
    });
    setEditingId(supply._id);
    setIsEditing(true);
    setShowForm(true);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

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
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Share Supplies</h1>
              <p className="text-sm text-gray-500">Help others in your community</p>
            </div>
          </div>
          {!showForm && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors shadow-sm"
            >
              <MdAdd className="w-5 h-5" />
              <span className="text-sm font-medium">New</span>
            </motion.button>
          )}
        </motion.div>

        {/* Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm mb-4 overflow-hidden"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900">
                  {isEditing ? 'Edit Supply' : 'Share New Supply'}
                </h2>
                <button onClick={resetForm} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                  <FiX className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
                  <div className="relative">
                    <MdTitle className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      value={formData.heading}
                      onChange={(e) => setFormData({ ...formData, heading: e.target.value })}
                      placeholder="What supplies are you sharing?"
                      className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Contact Number</label>
                  <div className="relative">
                    <MdPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="tel"
                      value={formData.contactNumber}
                      onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                      placeholder="10-digit phone number"
                      maxLength={10}
                      className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                  <div className="relative">
                    <MdDescription className="absolute left-4 top-4 text-gray-400 w-4 h-4" />
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Describe the supplies you're sharing..."
                      rows={3}
                      className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 resize-none transition-all"
                    />
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={isEditing ? handleUpdate : handleShare}
                  disabled={isSaving}
                  className="w-full py-3.5 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 disabled:opacity-50 transition-colors shadow-sm"
                >
                  {isSaving ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {isEditing ? 'Updating...' : 'Sharing...'}
                    </span>
                  ) : (
                    isEditing ? 'Update Supply' : 'Share Supply'
                  )}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Supplies List */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="font-semibold text-gray-900 mb-3">Your Shared Supplies</h2>
          
          {loading ? (
            <div className="space-y-3">
              {[1, 2].map(i => (
                <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 animate-pulse">
                  <div className="h-5 w-40 bg-gray-200 rounded mb-2" />
                  <div className="h-4 w-full bg-gray-200 rounded mb-2" />
                  <div className="h-4 w-24 bg-gray-200 rounded" />
                </div>
              ))}
            </div>
          ) : supplies.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 border border-gray-100 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MdDescription className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">No supplies shared yet</p>
              <p className="text-sm text-gray-400 mt-1">Start helping your community</p>
            </div>
          ) : (
            <div className="space-y-3">
              {supplies.map((supply, index) => (
                <motion.div
                  key={supply._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 mb-1">{supply.heading}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-2">{supply.description}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <MdPhone className="w-3.5 h-3.5" />
                          {supply.contactNumber}
                        </span>
                        <span className="flex items-center gap-1">
                          <MdAccessTime className="w-3.5 h-3.5" />
                          {formatDate(supply.createdAt)}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleEditClick(supply)}
                        className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <FiEdit2 className="w-4 h-4" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleDelete(supply._id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default ShareSupplies;