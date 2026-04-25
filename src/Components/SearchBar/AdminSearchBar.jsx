import { FaClipboardList, FaSearch, FaStoreAlt, FaExclamationCircle } from "react-icons/fa";
import { MdDashboard, MdShoppingBasket, MdLocalOffer, MdEmail } from 'react-icons/md';
import { LuUsers } from 'react-icons/lu';
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { useState, useEffect, useMemo } from "react";
import { getVendorPendingRequestsCount } from "../../Services/apiServices";
import { motion, AnimatePresence } from 'framer-motion';

const AdminSearchBar = () => {
  const adminData = useSelector((state) => state.adminData.data);
  const location = useLocation();
  const navigate = useNavigate();
  const [pendingRequests, setPendingRequests] = useState(0);
  const availablePages = useMemo(() => [
    'dashboard',
    'requests',
    'user-manage',
    'vendor-manage',
    'user-issues',
    'category-manage',
    'coupon-manage',
    'send-mail'
  ], []);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredPages, setFilteredPages] = useState([]);

  useEffect(() => {
    const fetchPendingCount = async () => {
      try {
        const response = await getVendorPendingRequestsCount();
        setPendingRequests(response.data.count);
      } catch (error) {
        console.error('Error fetching pending requests:', error);
      }
    };

    fetchPendingCount();
    const interval = setInterval(fetchPendingCount, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (searchQuery) {
      setFilteredPages(availablePages.filter(page => page.toLowerCase().includes(searchQuery.toLowerCase())));
    } else {
      setFilteredPages([]);
    }
  }, [availablePages, searchQuery]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handlePageClick = (page) => {
    const route = page === 'dashboard' ? '/admin' : `/admin/${page}`;
    navigate(route);
    setSearchQuery('');
  };

  // Display name - show email if fullname not available, or "Admin" if loading
  const displayName = adminData?.fullname || adminData?.email || "Admin";
  const displayInitial = displayName.charAt(0).toUpperCase();

  return (
    <div className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Search */}
      <div className="relative w-96">
        <div className="relative">
          <input
            type="text"
            placeholder="Search pages..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 text-sm" />
        </div>
        
        <AnimatePresence>
          {filteredPages.length > 0 && (
            <motion.ul 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute bg-white border border-slate-200 w-full mt-2 z-50 rounded-lg shadow-lg overflow-hidden"
            >
              {filteredPages.map((page, index) => (
                <li 
                  key={index} 
                  onClick={() => handlePageClick(page)} 
                  className="cursor-pointer hover:bg-slate-50 px-3 py-2.5 flex items-center text-sm transition-colors"
                >
                  {page === 'dashboard' && <MdDashboard className="mr-2 text-blue-500" />}
                  {page.includes('user') && !page.includes('issue') && <LuUsers className="mr-2 text-emerald-500" />}
                  {page.includes('issue') && <FaExclamationCircle className="mr-2 text-rose-500" />}
                  {page.includes('vendor') && <FaStoreAlt className="mr-2 text-orange-500" />}
                  {page.includes('category') && <MdShoppingBasket className="mr-2 text-purple-500" />}
                  {page.includes('coupon') && <MdLocalOffer className="mr-2 text-amber-500" />}
                  {page.includes('mail') && <MdEmail className="mr-2 text-teal-500" />}
                  {page.includes('requests') && <FaClipboardList className="mr-2 text-pink-500" />}
                  <span className="text-slate-700">{page.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                </li>
              ))}
            </motion.ul>
          )}
          
          {searchQuery && filteredPages.length === 0 && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute bg-white border border-slate-200 w-full mt-2 z-50 rounded-lg shadow-lg p-3 text-center text-sm cursor-pointer hover:bg-slate-50" 
              onClick={() => handlePageClick('dashboard')}
            >
              <span className="text-slate-500">No match found. Go to </span>
              <span className="text-blue-600 font-medium">Dashboard</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        {/* Vendor Requests Button - Using Clipboard Icon */}
        <button
          onClick={() => navigate('/admin/requests')}
          className={`relative p-2 rounded-lg transition-colors ${
            location.pathname === '/admin/requests' 
              ? 'bg-blue-100 text-blue-600' 
              : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
          }`}
          title="Vendor Requests"
        >
          <FaClipboardList className="text-xl" />
          {pendingRequests > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-rose-500 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center">
              {pendingRequests > 9 ? '9+' : pendingRequests}
            </span>
          )}
        </button>

        {/* Admin Profile */}
        <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <span className="text-white font-medium text-sm">{displayInitial}</span>
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-slate-900 truncate max-w-[150px]">
              {displayName}
            </p>
            <p className="text-xs text-slate-400">Administrator</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSearchBar;