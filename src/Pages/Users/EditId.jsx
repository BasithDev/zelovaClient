import { useState } from 'react';
import { MdArrowBack, MdSend, MdEmail, MdVpnKey } from 'react-icons/md';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchUserData } from '../../Redux/slices/user/userDataSlice';
import { sendEmailOtp, updateUserEmail } from '../../Services/apiServices';

const EditId = () => {
  const userData = useSelector(state => state.userData.data);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [newEmail, setNewEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isChangingEmail, setIsChangingEmail] = useState(false);

  const handleSendOtp = async () => {
    if (!newEmail) {
      toast.error("Please enter a new email");
      return;
    }
    if (newEmail === userData.email) {
      toast.error("New email must be different");
      return;
    }
    setIsSendingOtp(true);
    try {
      const response = await sendEmailOtp({ email: newEmail });
      if (response.data.status === 'Success') {
        setIsOtpSent(true);
        toast.success("OTP sent to your new email");
      } else {
        toast.error("Failed to send OTP");
      }
    } catch (error) {
      toast.error("Error sending OTP");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleChangeId = async () => {
    if (!otp) {
      toast.error("Please enter the OTP");
      return;
    }
    setIsChangingEmail(true);
    try {
      const response = await updateUserEmail({
        userId: userData._id,
        email: newEmail,
        otp,
      });
      if (response.data.status === 'Success') {
        toast.success("Email updated successfully");
        dispatch(fetchUserData(userData._id));
        navigate('/profile');
      } else {
        toast.error(response.data.message || "Failed to update email");
      }
    } catch (error) {
      toast.error("Error updating email");
    } finally {
      setIsChangingEmail(false);
    }
  };

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
          <h1 className="text-xl font-semibold text-gray-900">Change Email</h1>
        </motion.div>

        {/* Form */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-blue-50 rounded-xl">
              <MdEmail className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Update Email Address</h2>
              <p className="text-sm text-gray-500">Verify with OTP to change</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Current Email */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Current Email</label>
              <div className="relative">
                <MdEmail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="email"
                  value={userData.email}
                  readOnly
                  className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500"
                />
              </div>
            </motion.div>

            {/* New Email */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <label className="block text-sm font-medium text-gray-700 mb-1.5">New Email</label>
              <div className="relative">
                <MdEmail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="Enter new email"
                  disabled={isOtpSent}
                  className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 disabled:bg-gray-50 transition-all"
                />
              </div>
            </motion.div>

            {/* Send OTP Button or OTP Input */}
            <AnimatePresence mode="wait">
              {!isOtpSent ? (
                <motion.button
                  key="send-otp"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: 0.25 }}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={handleSendOtp}
                  disabled={isSendingOtp}
                  className="w-full py-3.5 bg-blue-500 text-white font-semibold rounded-xl hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors shadow-sm"
                >
                  {isSendingOtp ? (
                    <span className="flex items-center gap-2">
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending...
                    </span>
                  ) : (
                    <>
                      <MdSend className="w-5 h-5" />
                      Send OTP
                    </>
                  )}
                </motion.button>
              ) : (
                <motion.div
                  key="otp-input"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Enter OTP</label>
                    <div className="relative">
                      <MdVpnKey className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        placeholder="Enter 6-digit OTP"
                        className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                        maxLength={6}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1.5">Check your new email for the OTP</p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={handleChangeId}
                    disabled={isChangingEmail || !otp}
                    className="w-full py-3.5 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                  >
                    {isChangingEmail ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Updating...
                      </span>
                    ) : (
                      'Update Email'
                    )}
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default EditId;