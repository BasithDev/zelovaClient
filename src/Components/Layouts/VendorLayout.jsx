import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { logout } from "../../Services/apiServices";
import { motion, AnimatePresence } from "framer-motion";
import { useDispatch } from 'react-redux';
import { logoutUser } from "../../Redux/slices/user/authUserSlice";
import { fetchRestaurantData } from "../../Redux/slices/seller/restaurantDataSlice";

import { MdHome, MdPerson, MdRestaurant, MdReceiptLong, MdChevronLeft, MdChevronRight } from "react-icons/md";
import { IoMdLogOut } from "react-icons/io";
import { IoFastFoodOutline } from "react-icons/io5";
import { BiFoodMenu, BiCategoryAlt } from "react-icons/bi";
import { BsThreeDots } from "react-icons/bs";
import { HiOutlineTag } from "react-icons/hi";

const VendorLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [showMoreMenu, setShowMoreMenu] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);

    useEffect(() => {
        dispatch(fetchRestaurantData());
    }, [dispatch]);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            const role = 'user';
            await logout(role);
            dispatch(logoutUser());
            navigate("/login");
        } catch (error) {
            console.log(error);
        } finally {
            setIsLoggingOut(false);
        }
    };

    const navItems = [
        { path: '/vendor', label: 'Home', icon: MdHome },
        { path: '/vendor/orders', label: 'Orders', icon: MdReceiptLong },
        { path: '/vendor/manage-restaurant', label: 'Restaurant', icon: MdRestaurant },
        { path: '/vendor/menu', label: 'Menu', icon: BiFoodMenu },
        { path: '/vendor/add-items', label: 'Add Item', icon: IoFastFoodOutline },
        { path: '/vendor/categories', label: 'Categories', icon: BiCategoryAlt },
        { path: '/vendor/offers', label: 'Offers', icon: HiOutlineTag },
    ];

    const sidebarWidth = isCollapsed ? 'w-[70px]' : 'w-[240px]';
    const mainMargin = isCollapsed ? 'lg:ml-[70px]' : 'lg:ml-[240px]';

    return (
        <div className="flex flex-col lg:flex-row min-h-screen relative bg-slate-50">
            {/* Desktop Sidebar */}
            <aside className={`hidden lg:flex ${sidebarWidth} h-screen fixed top-0 left-0 bottom-0 flex-col bg-white border-r border-slate-200 transition-all duration-300 z-40`}>
                {/* Header */}
                <div className={`relative p-4 border-b border-slate-100 ${isCollapsed ? 'flex justify-center' : ''}`}>
                    <div className={`${isCollapsed ? 'hidden' : 'block'}`}>
                        <p className="text-2xl font-bold text-transparent bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text">
                            Zelova
                        </p>
                        <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">Kitchen</span>
                    </div>
                    {isCollapsed && (
                        <p className="text-2xl font-bold text-transparent bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text">
                            Z
                        </p>
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
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <motion.button
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                whileHover={{ x: 2 }}
                                whileTap={{ scale: 0.98 }}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                                    isActive 
                                        ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-200' 
                                        : 'text-slate-600 hover:bg-slate-100'
                                } ${isCollapsed ? 'justify-center px-2' : ''}`}
                                title={isCollapsed ? item.label : ''}
                            >
                                <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : ''}`} />
                                {!isCollapsed && (
                                    <span className={`font-medium ${isActive ? 'text-white' : ''}`}>
                                        {item.label}
                                    </span>
                                )}
                            </motion.button>
                        );
                    })}

                    {/* Switch to User */}
                    <motion.button
                        onClick={() => navigate('/')}
                        whileHover={{ x: 2 }}
                        whileTap={{ scale: 0.98 }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-blue-600 bg-blue-50 hover:bg-blue-100 transition-all mt-4 ${
                            isCollapsed ? 'justify-center px-2' : ''
                        }`}
                        title={isCollapsed ? 'Switch to User' : ''}
                    >
                        <MdPerson className="w-5 h-5 flex-shrink-0" />
                        {!isCollapsed && <span className="font-medium">Switch to User</span>}
                    </motion.button>
                </nav>

                {/* Footer */}
                <div className="p-2 border-t border-slate-100">
                    <motion.button
                        onClick={() => setShowLogoutConfirm(true)}
                        whileHover={{ x: 2 }}
                        whileTap={{ scale: 0.98 }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-rose-600 hover:bg-rose-50 transition-all ${
                            isCollapsed ? 'justify-center px-2' : ''
                        }`}
                        title={isCollapsed ? 'Logout' : ''}
                    >
                        <IoMdLogOut className="w-5 h-5 flex-shrink-0" />
                        {!isCollapsed && <span className="font-medium">Logout</span>}
                    </motion.button>
                </div>
            </aside>

            {/* Mobile Header */}
            <div className="lg:hidden fixed top-0 w-full bg-white border-b border-slate-200 z-50 px-4 py-3">
                <p className="text-xl font-bold text-transparent bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text">
                    Zelova <span className="text-sm font-semibold text-emerald-600">Kitchen</span>
                </p>
            </div>

            {/* Main Content */}
            <main className={`${mainMargin} flex-1 mt-14 lg:mt-0 mb-16 lg:mb-0 transition-all duration-300`}>
                <Outlet />
            </main>

            {/* Mobile Bottom Navigation */}
            <div className="lg:hidden fixed bottom-0 w-full bg-white border-t border-slate-200 z-50">
                <div className="flex justify-around items-center py-2">
                    {navItems.slice(0, 3).map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <button
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                className={`flex flex-col items-center p-2 ${
                                    isActive ? 'text-orange-500' : 'text-slate-500'
                                }`}
                            >
                                <item.icon className="text-xl" />
                                <span className="text-xs mt-0.5">{item.label}</span>
                            </button>
                        );
                    })}
                    <div className="relative">
                        <button
                            onClick={() => setShowMoreMenu(!showMoreMenu)}
                            className={`flex flex-col items-center p-2 ${
                                showMoreMenu || 
                                location.pathname === '/vendor/add-items' || 
                                location.pathname === '/vendor/manage-restaurant'
                                    ? 'text-orange-500' 
                                    : 'text-slate-500'
                            }`}
                        >
                            <BsThreeDots className="text-xl" />
                            <span className="text-xs mt-0.5">More</span>
                        </button>
                        
                        {/* More Menu Dropdown */}
                        <AnimatePresence>
                            {showMoreMenu && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="absolute bottom-full right-0 mb-2 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden min-w-[180px]"
                                >
                                    <div className="p-1">
                                        <button
                                            onClick={() => {
                                                navigate('/vendor/manage-restaurant');
                                                setShowMoreMenu(false);
                                            }}
                                            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                                                location.pathname === '/vendor/manage-restaurant'
                                                    ? 'bg-orange-50 text-orange-600'
                                                    : 'hover:bg-slate-50'
                                            }`}
                                        >
                                            <MdRestaurant className="text-lg" />
                                            Restaurant
                                        </button>
                                        <button
                                            onClick={() => {
                                                navigate('/vendor/add-items');
                                                setShowMoreMenu(false);
                                            }}
                                            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                                                location.pathname === '/vendor/add-items'
                                                    ? 'bg-orange-50 text-orange-600'
                                                    : 'hover:bg-slate-50'
                                            }`}
                                        >
                                            <IoFastFoodOutline className="text-lg" />
                                            Add Items
                                        </button>
                                        <hr className="my-1" />
                                        <button
                                            onClick={() => {
                                                navigate('/');
                                                setShowMoreMenu(false);
                                            }}
                                            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-blue-600 hover:bg-blue-50"
                                        >
                                            <MdPerson className="text-lg" />
                                            Switch to User
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowLogoutConfirm(true);
                                                setShowMoreMenu(false);
                                            }}
                                            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-rose-600 hover:bg-rose-50"
                                        >
                                            <IoMdLogOut className="text-lg" />
                                            Logout
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Logout Confirmation Modal */}
            <AnimatePresence>
                {showLogoutConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white p-6 rounded-2xl shadow-2xl max-w-sm w-full"
                        >
                            <div className="text-center">
                                <div className="w-12 h-12 mx-auto mb-4 bg-rose-100 rounded-full flex items-center justify-center">
                                    <IoMdLogOut className="w-6 h-6 text-rose-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-900 mb-2">Confirm Logout</h3>
                                <p className="text-slate-600 text-sm mb-6">Are you sure you want to log out of your account?</p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowLogoutConfirm(false)}
                                        className="flex-1 px-4 py-2.5 text-slate-700 bg-slate-100 rounded-xl font-medium hover:bg-slate-200 transition-colors"
                                        disabled={isLoggingOut}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleLogout}
                                        className="flex-1 px-4 py-2.5 bg-rose-600 text-white rounded-xl font-medium hover:bg-rose-700 transition-colors"
                                        disabled={isLoggingOut}
                                    >
                                        {isLoggingOut ? 'Logging out...' : 'Logout'}
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

export default VendorLayout;