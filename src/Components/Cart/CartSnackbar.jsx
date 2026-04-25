import { useNavigate, useLocation } from 'react-router-dom';
import { FaShoppingCart } from 'react-icons/fa';
import { IoMdClose } from 'react-icons/io';
import { useCart } from "../../Hooks/useCart";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from 'react';

const CartSnackbar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { totalItems, totalPrice } = useCart();
    
    const totalItemsCount = totalItems?.data?.totalItems || 0;
    const totalPriceCount = totalPrice?.data?.totalPrice || 0;

    // null = not dismissed, number = dismissed when this many items were in cart
    const [dismissedAtCount, setDismissedAtCount] = useState(null);
    const prevItemCount = useRef(totalItemsCount);

    // Re-show snackbar when a NEW item is added (count increases)
    useEffect(() => {
        if (totalItemsCount > prevItemCount.current) {
            setDismissedAtCount(null); // Reset dismissed state
        }
        prevItemCount.current = totalItemsCount;
    }, [totalItemsCount]);

    // Hide on cart-related pages
    const excludedPaths = ['/cart', '/order-success', '/checkout'];
    const isExcludedPath = excludedPaths.some(path => location.pathname.startsWith(path));

    // Mark as dismissed when user visits cart page
    useEffect(() => {
        if (isExcludedPath) {
            setDismissedAtCount(totalItemsCount);
        }
    }, [isExcludedPath, totalItemsCount]);

    const isDismissed = dismissedAtCount !== null;
    const shouldShowSnackbar = totalItemsCount > 0 && !isExcludedPath && !isDismissed;

    const handleClose = () => {
        setDismissedAtCount(totalItemsCount);
    };

    return (
        <AnimatePresence>
            {shouldShowSnackbar && (
                <motion.div 
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ 
                        type: "spring",
                        stiffness: 260,
                        damping: 20
                    }}
                    className="fixed bottom-20 lg:bottom-4 left-0 right-0 mx-auto w-[90%] max-w-[400px] bg-green-500 text-white rounded-lg shadow-lg z-50"
                >
                    <motion.button
                        className="absolute -top-2 -right-2 bg-white text-gray-400 rounded-full w-6 h-6 flex items-center justify-center shadow-md hover:bg-gray-100"
                        onClick={handleClose}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                    >
                        <IoMdClose className="text-lg" />
                    </motion.button>
                    <div className="flex items-center justify-between p-4">
                        <motion.div 
                            className="flex items-center gap-3"
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                        >
                            <div className="relative">
                                <FaShoppingCart className="text-2xl" />
                                <motion.span 
                                    key={totalItemsCount}
                                    initial={{ scale: 0.5 }}
                                    animate={{ scale: 1 }}
                                    className="absolute -top-2 -right-2 bg-green-600 text-xs font-semibold text-white rounded-full w-5 h-5 flex items-center justify-center"
                                >
                                    {totalItemsCount}
                                </motion.span>
                            </div>
                            <motion.div
                                key={totalPriceCount}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                            >
                                <span className="font-bold text-base">₹{totalPriceCount.toFixed(2)}</span>
                            </motion.div>
                        </motion.div>
                        <motion.button 
                            onClick={() => navigate('/cart')}
                            className="bg-white text-green-600 px-4 py-2 rounded-lg text-base font-semibold hover:bg-green-50 transition-colors duration-200"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                        >
                            View Cart
                        </motion.button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default CartSnackbar;