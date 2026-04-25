import { useState, useEffect } from 'react';
import { MdArrowBack, MdSearch, MdSend, MdPerson, MdSentimentDissatisfied } from 'react-icons/md';
import { RiCoinsFill } from 'react-icons/ri';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getZcoinsData, sendZcoins, searchUsers } from '../../Services/apiServices';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

const Coins = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [amount, setAmount] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSending, setIsSending] = useState(false);

  const debouncedSearchQuery = useDebounce(userSearchQuery, 500);

  // Fetch coins data with React Query (cached)
  const { data: coinsResponse, isLoading: loading } = useQuery({
    queryKey: ['zcoins'],
    queryFn: () => getZcoinsData(),
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    cacheTime: 10 * 60 * 1000,
  });

  const balance = coinsResponse?.data?.zcoins?.balance || 0;
  const recentUsers = coinsResponse?.data?.zcoins?.lastSentUserIds || [];

  useEffect(() => {
    const searchForUsers = async () => {
      if (debouncedSearchQuery.trim()) {
        try {
          const response = await searchUsers(debouncedSearchQuery);
          setSearchResults(response.data.users);
        } catch (error) {
          setSearchResults([]);
        }
      } else {
        setSearchResults([]);
      }
    };
    searchForUsers();
  }, [debouncedSearchQuery]);

  const handleShare = async () => {
    const amountNum = parseInt(amount);
    if (!selectedUser || !amountNum) return;
    if (amountNum > balance) {
      toast.error('Insufficient balance');
      return;
    }

    setIsSending(true);
    try {
      await sendZcoins({ receiverId: selectedUser._id, amountNum });
      toast.success(`${amountNum} coins sent to ${selectedUser.fullname}`);
      setAmount('');
      setSelectedUser(null);
      queryClient.invalidateQueries(['zcoins']);
    } catch (error) {
      toast.error('Failed to send coins');
    } finally {
      setIsSending(false);
    }
  };

  const displayUsers = searchResults.length > 0 ? searchResults : recentUsers;

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
            onClick={() => navigate('/')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <MdArrowBack className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-xl font-semibold text-gray-900">Z-Coins</h1>
        </motion.div>

        {/* Balance Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 mb-6 relative overflow-hidden"
        >
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full" />
          <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-white/10 rounded-full" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-white/20 rounded-xl">
                <RiCoinsFill className="w-6 h-6 text-yellow-300" />
              </div>
              <span className="text-white/90 font-medium">Available Balance</span>
            </div>
            {loading ? (
              <div className="h-12 w-24 bg-white/20 rounded-lg animate-pulse" />
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-white">{balance}</span>
                <span className="text-white/80">coins</span>
              </div>
            )}
            <p className="text-white/70 text-sm mt-2">Use coins on your next order</p>
          </div>
        </motion.div>

        {/* Send Coins Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm"
        >
          <h2 className="font-semibold text-gray-900 mb-4">Send Coins</h2>

          {/* Search */}
          <div className="relative mb-4">
            <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search users..."
              value={userSearchQuery}
              onChange={(e) => setUserSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
            />
          </div>

          {/* Users List */}
          <div className="max-h-60 overflow-y-auto mb-4 space-y-2">
            <AnimatePresence>
              {displayUsers.length > 0 ? (
                displayUsers.map((user, index) => (
                  <motion.button
                    key={user._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={() => setSelectedUser(user)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                      selectedUser?._id === user._id
                        ? 'bg-orange-50 border-2 border-orange-400'
                        : 'hover:bg-gray-50 border-2 border-transparent'
                    }`}
                  >
                    {user.profilePicture ? (
                      <img
                        referrerPolicy="no-referrer"
                        src={user.profilePicture}
                        alt={user.fullname}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <MdPerson className="w-5 h-5 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1 text-left">
                      <p className="font-medium text-gray-900">{user.fullname}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                    {selectedUser?._id === user._id && (
                      <div className="w-2 h-2 bg-orange-500 rounded-full" />
                    )}
                  </motion.button>
                ))
              ) : (
                <div className="py-8 text-center">
                  <MdSentimentDissatisfied className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">
                    {userSearchQuery ? 'No users found' : 'Search for a user or send to recent contacts'}
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Amount Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Amount</label>
            <div className="relative">
              <RiCoinsFill className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter coins"
                min="1"
                max={balance}
                className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
              />
            </div>
          </div>

          {/* Send Button */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={handleShare}
            disabled={!selectedUser || !amount || isSending}
            className="w-full py-3.5 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {isSending ? (
              <span className="flex items-center gap-2">
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Sending...
              </span>
            ) : (
              <>
                <MdSend className="w-5 h-5" />
                Send Coins
              </>
            )}
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
};

export default Coins;