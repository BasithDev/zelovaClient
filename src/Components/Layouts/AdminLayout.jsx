import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { LuUsers } from "react-icons/lu";
import { MdDashboard, MdShoppingBasket, MdLocalOffer, MdEmail, MdReportProblem, MdChevronLeft, MdChevronRight } from "react-icons/md";
import { FaStoreAlt } from 'react-icons/fa';
import { BiSolidMegaphone } from "react-icons/bi";
import { HiOutlineLogout } from 'react-icons/hi';
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../Services/apiServices";
import { logoutAdmin } from "../../Redux/slices/admin/authAdminSlice";
import { fetchAdminData } from "../../Redux/slices/admin/adminDataSlice";

const navItems = [
  { name: "Dashboard", icon: MdDashboard, path: "/admin" },
  { name: "Users", icon: LuUsers, path: "/admin/user-manage" },
  { name: "Vendors", icon: FaStoreAlt, path: "/admin/vendor-manage" },
  { name: "Categories", icon: MdShoppingBasket, path: "/admin/category-manage" },
  { name: "User Issues", icon: MdReportProblem, path: "/admin/user-issues" },
  { name: "Coupons", icon: MdLocalOffer, path: "/admin/coupon-manage" },
  { name: "Send Mail", icon: MdEmail, path: "/admin/send-mail" },
  { name: "Announcement", icon: BiSolidMegaphone, path: "/admin/announcement" },
];

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const adminStatus = useSelector((state) => state.adminData.status);

  useEffect(() => {
    // Fetch admin data on mount if not already loaded
    // By the time AdminLayout renders, auth is already complete (route protection waits)
    if (adminStatus === 'idle') {
      dispatch(fetchAdminData());
    }
  }, [dispatch, adminStatus]);

  const handleLogout = async () => {
    try {
      await logout("admin");
      dispatch(logoutAdmin());
      navigate("/admin/login");
    } catch (error) {
      console.log(error);
    }
  };

  const isActive = (path) => location.pathname === path;

  const sidebarWidth = isCollapsed ? 'w-[70px]' : 'w-[240px]';
  const mainMargin = isCollapsed ? 'ml-[70px]' : 'ml-[240px]';

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className={`${sidebarWidth} h-screen fixed top-0 left-0 bottom-0 flex flex-col bg-white border-r border-slate-200 transition-all duration-300 z-40`}>
        {/* Header */}
        <div className={`relative p-4 border-b border-slate-100 ${isCollapsed ? 'flex justify-center' : ''}`}>
          <div className={`${isCollapsed ? 'hidden' : 'block'}`}>
            <p className="text-2xl font-bold text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text">
              Zelova
            </p>
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Admin</span>
          </div>
          {isCollapsed && (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
              <span className="text-white font-bold text-lg">Z</span>
            </div>
          )}
          
          {/* Collapse Toggle Button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-sm hover:bg-slate-50 transition-colors"
          >
            {isCollapsed ? (
              <MdChevronRight className="w-4 h-4 text-slate-600" />
            ) : (
              <MdChevronLeft className="w-4 h-4 text-slate-600" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {navItems.map(({ name, icon: Icon, path }) => {
            const active = isActive(path);
            return (
              <motion.button
                key={name}
                onClick={() => navigate(path)}
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
                title={isCollapsed ? name : ''}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                  active 
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-200' 
                    : 'text-slate-600 hover:bg-slate-100'
                } ${isCollapsed ? 'justify-center px-2' : ''}`}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-white' : ''}`} />
                {!isCollapsed && (
                  <span className={`font-medium text-sm ${active ? 'text-white' : ''}`}>
                    {name}
                  </span>
                )}
              </motion.button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-2 border-t border-slate-100">
          <motion.button
            onClick={() => setShowLogoutConfirm(true)}
            whileHover={{ x: 2 }}
            whileTap={{ scale: 0.98 }}
            title={isCollapsed ? 'Logout' : ''}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-rose-600 hover:bg-rose-50 transition-all ${
              isCollapsed ? 'justify-center px-2' : ''
            }`}
          >
            <HiOutlineLogout className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span className="font-medium text-sm">Logout</span>}
          </motion.button>
        </div>
      </aside>

      {/* Main Content */}
      <motion.main
        initial={{ opacity: 0, filter: 'blur(8px)' }}
        animate={{ opacity: 1, filter: 'blur(0px)' }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className={`${mainMargin} flex-1 transition-all duration-300`}
      >
        <Outlet />
      </motion.main>

      {/* Logout Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowLogoutConfirm(false)}
          >
            <motion.div
              className="bg-white p-6 rounded-2xl shadow-2xl max-w-sm w-full"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-4 bg-rose-100 rounded-full flex items-center justify-center">
                  <HiOutlineLogout className="w-6 h-6 text-rose-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Confirm Logout</h3>
                <p className="text-slate-600 text-sm mb-6">Are you sure you want to log out of your account?</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowLogoutConfirm(false)}
                    className="flex-1 px-4 py-2.5 text-slate-700 bg-slate-100 rounded-xl font-medium hover:bg-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex-1 px-4 py-2.5 bg-rose-600 text-white rounded-xl font-medium hover:bg-rose-700 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminLayout;