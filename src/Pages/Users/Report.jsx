import { useState } from 'react';
import { MdArrowBack, MdCheckCircle, MdWarning, MdDescription, MdReceipt } from 'react-icons/md';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { raiseIssue } from '../../Services/apiServices';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

const Report = () => {
  const navigate = useNavigate();
  const userData = useSelector((state) => state.userData.data);
  const [issueType, setIssueType] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [orderId, setOrderId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const issueOptions = [
    { value: 'delivery', label: 'Delivery Issue', icon: '🚚' },
    { value: 'food', label: 'Food Quality', icon: '🍔' },
    { value: 'restaurant', label: 'Restaurant Issue', icon: '🏪' },
    { value: 'application', label: 'App Problem', icon: '📱' },
    { value: 'others', label: 'Other', icon: '❓' },
  ];

  const showOrderFields = ['food', 'delivery', 'restaurant'].includes(issueType);

  const handleSubmit = async () => {
    if (!issueType) {
      toast.error('Please select a problem type');
      return;
    }
    if (!issueDescription.trim()) {
      toast.error('Please describe your issue');
      return;
    }
    if (showOrderFields && !orderId.trim()) {
      toast.error('Please enter the Order ID');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await raiseIssue({
        userId: userData._id,
        username: userData.fullname,
        userEmail: userData.email,
        problemOn: issueType,
        description: issueDescription,
        refund: refundAmount ? Number(refundAmount) : 0,
        orderId: orderId || undefined,
      });
      
      if (response.data.success) {
        setShowSuccess(true);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit report');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm max-w-sm w-full text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
          >
            <MdCheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
          </motion.div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Report Submitted</h2>
          <p className="text-gray-500 mb-6">
            We'll review your issue and respond via email as soon as possible.
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/profile')}
            className="w-full py-3.5 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition-colors shadow-sm"
          >
            Back to Profile
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-xl mx-auto px-4 py-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-6"
        >
          <button 
            onClick={() => navigate('/profile')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <MdArrowBack className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-xl font-semibold text-gray-900">Report a Problem</h1>
        </motion.div>

        {/* Form */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-red-50 rounded-xl">
              <MdWarning className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Report an Issue</h2>
              <p className="text-sm text-gray-500">We're here to help</p>
            </div>
          </div>

          <div className="space-y-5">
            {/* Problem Type */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <label className="block text-sm font-medium text-gray-700 mb-2">Problem Type</label>
              <div className="grid grid-cols-2 gap-2">
                {issueOptions.map((opt) => (
                  <motion.button
                    key={opt.value}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIssueType(opt.value)}
                    disabled={isSubmitting}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      issueType === opt.value
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <span className="text-lg">{opt.icon}</span>
                    <p className={`text-sm font-medium mt-1 ${
                      issueType === opt.value ? 'text-orange-600' : 'text-gray-700'
                    }`}>{opt.label}</p>
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* Order ID (conditional) */}
            <AnimatePresence>
              {showOrderFields && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Order ID</label>
                  <div className="relative">
                    <MdReceipt className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      value={orderId}
                      onChange={(e) => setOrderId(e.target.value)}
                      placeholder="Enter your Order ID"
                      disabled={isSubmitting}
                      className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Find this in your order history</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Description */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
              <div className="relative">
                <MdDescription className="absolute left-4 top-4 text-gray-400 w-4 h-4" />
                <textarea
                  value={issueDescription}
                  onChange={(e) => setIssueDescription(e.target.value)}
                  placeholder="Describe your issue in detail..."
                  rows={4}
                  disabled={isSubmitting}
                  className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 resize-none transition-all"
                />
              </div>
            </motion.div>

            {/* Refund Amount (conditional) */}
            <AnimatePresence>
              {showOrderFields && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Refund Amount (optional)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">₹</span>
                    <input
                      type="number"
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(e.target.value)}
                      placeholder="0"
                      min="0"
                      disabled={isSubmitting}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Button */}
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full py-3.5 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Submitting...
                </span>
              ) : (
                'Submit Report'
              )}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Report;