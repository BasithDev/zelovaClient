import { useState } from 'react';
import { MdArrowBack } from 'react-icons/md';
import { FiEye, FiEyeOff, FiLock } from 'react-icons/fi';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { fetchUserData } from '../../Redux/slices/user/userDataSlice';

const ResetPassword = () => {
  const userData = useSelector(state => state.userData.data);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleResetPassword = async () => {
    if (!oldPassword || !newPassword || !confirmNewPassword) {
      toast.error("Please fill in all fields");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      toast.error("Passwords don't match");
      return;
    }

    setIsChangingPassword(true);
    try {
      const response = await axios.patch('https://zelova.zapto.org/api/user/reset-password', {
        userId: userData._id,
        oldPassword,
        newPassword,
      });

      if (response.data.status === 'Success') {
        toast.success('Password changed successfully');
        dispatch(fetchUserData(userData._id));
        navigate('/profile');
      } else {
        toast.error(response.data.message || "Failed to reset password");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Error resetting password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const PasswordField = ({ label, value, onChange, show, setShow, placeholder, delay = 0 }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <div className="relative">
        <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-11 pr-12 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          {show ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
        </button>
      </div>
    </motion.div>
  );

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
          <h1 className="text-xl font-semibold text-gray-900">Reset Password</h1>
        </motion.div>

        {/* Form */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-orange-50 rounded-xl">
              <FiLock className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Change Password</h2>
              <p className="text-sm text-gray-500">Keep your account secure</p>
            </div>
          </div>

          <div className="space-y-4">
            <PasswordField
              label="Current Password"
              value={oldPassword}
              onChange={setOldPassword}
              show={showOld}
              setShow={setShowOld}
              placeholder="Enter current password"
              delay={0.15}
            />
            <PasswordField
              label="New Password"
              value={newPassword}
              onChange={setNewPassword}
              show={showNew}
              setShow={setShowNew}
              placeholder="Enter new password"
              delay={0.2}
            />
            <PasswordField
              label="Confirm New Password"
              value={confirmNewPassword}
              onChange={setConfirmNewPassword}
              show={showConfirm}
              setShow={setShowConfirm}
              placeholder="Confirm new password"
              delay={0.25}
            />
            
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={handleResetPassword}
              disabled={isChangingPassword}
              className="w-full py-3.5 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm mt-2"
            >
              {isChangingPassword ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Updating...
                </span>
              ) : (
                'Update Password'
              )}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ResetPassword;