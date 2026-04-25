import { useState } from "react";
import { FiPlus, FiTrash2, FiEdit2, FiX } from "react-icons/fi";
import { MdArrowBack, MdLocationOn, MdPhone, MdLabel } from "react-icons/md";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { addAddress, getAddresses, deleteAddress, updateAddress } from "../../Services/apiServices";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const AddressMng = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [newAddress, setNewAddress] = useState({
    label: "",
    address: "",
    phone: "",
  });

  // Fetch addresses with React Query (cached)
  const { data: addressesResponse, isLoading } = useQuery({
    queryKey: ['addresses'],
    queryFn: () => getAddresses(),
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    cacheTime: 10 * 60 * 1000,
  });

  const addresses = addressesResponse?.data?.addresses || [];

  const handleAddAddress = async () => {
    if (!newAddress.label || !newAddress.address || !newAddress.phone) {
      toast.error('Please fill in all fields');
      return;
    }
    setIsSaving(true);
    try {
      await addAddress(newAddress);
      queryClient.invalidateQueries(['addresses']);
      resetForm();
      toast.success('Address added');
    } catch (error) {
      toast.error('Failed to add address');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateAddress = async () => {
    if (!newAddress.label || !newAddress.address || !newAddress.phone) {
      toast.error('Please fill in all fields');
      return;
    }
    setIsSaving(true);
    try {
      await updateAddress(editingId, newAddress);
      queryClient.invalidateQueries(['addresses']);
      resetForm();
      toast.success('Address updated');
    } catch (error) {
      toast.error('Failed to update address');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAddress = async (id) => {
    try {
      await deleteAddress(id);
      queryClient.invalidateQueries(['addresses']);
      toast.success('Address deleted');
    } catch (error) {
      toast.error('Failed to delete address');
    }
  };

  const handleEditClick = (address) => {
    setNewAddress({
      label: address.label,
      address: address.address,
      phone: address.phone,
    });
    setEditingId(address._id);
    setIsEditing(true);
    setShowForm(true);
  };

  const resetForm = () => {
    setNewAddress({ label: "", address: "", phone: "" });
    setShowForm(false);
    setIsEditing(false);
    setEditingId(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-xl mx-auto px-4 py-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/profile')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <MdArrowBack className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-xl font-semibold text-gray-900">Saved Addresses</h1>
          </div>
          {!showForm && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors shadow-sm"
            >
              <FiPlus className="w-4 h-4" />
              <span className="text-sm font-medium">Add New</span>
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
                  {isEditing ? 'Edit Address' : 'New Address'}
                </h2>
                <button onClick={resetForm} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                  <FiX className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Label</label>
                  <div className="relative">
                    <MdLabel className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      value={newAddress.label}
                      onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                      placeholder="e.g., Home, Office"
                      className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Address</label>
                  <div className="relative">
                    <MdLocationOn className="absolute left-4 top-4 text-gray-400 w-4 h-4" />
                    <textarea
                      value={newAddress.address}
                      onChange={(e) => setNewAddress({ ...newAddress, address: e.target.value })}
                      placeholder="Enter full address"
                      rows={3}
                      className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 resize-none transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
                  <div className="relative">
                    <MdPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="tel"
                      value={newAddress.phone}
                      onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                      placeholder="Phone number"
                      className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                    />
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={isEditing ? handleUpdateAddress : handleAddAddress}
                  disabled={isSaving}
                  className="w-full py-3.5 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 disabled:opacity-50 transition-colors shadow-sm"
                >
                  {isSaving ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving...
                    </span>
                  ) : (
                    isEditing ? 'Update Address' : 'Add Address'
                  )}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Address List */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
        >
          {isLoading ? (
            <div className="p-8 space-y-4">
              {[1, 2].map(i => (
                <div key={i} className="animate-pulse flex gap-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-20 bg-gray-200 rounded" />
                    <div className="h-3 w-full bg-gray-200 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : addresses.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MdLocationOn className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">No addresses saved</p>
              <p className="text-sm text-gray-400 mt-1">Add your first delivery address</p>
            </div>
          ) : (
            <div>
              {addresses.map((address, index) => (
                <motion.div 
                  key={address._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-4 ${index !== addresses.length - 1 ? 'border-b border-gray-50' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 bg-orange-50 rounded-xl">
                      <MdLocationOn className="w-5 h-5 text-orange-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="inline-block px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded mb-1.5">
                        {address.label}
                      </span>
                      <p className="text-sm text-gray-900 mb-1">{address.address}</p>
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <MdPhone className="w-3.5 h-3.5" />
                        {address.phone}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleEditClick(address)}
                        className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <FiEdit2 className="w-4 h-4" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleDeleteAddress(address._id)}
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

export default AddressMng;