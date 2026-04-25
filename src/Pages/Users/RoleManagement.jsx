import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { HiOutlineShoppingBag, HiOutlineUser } from 'react-icons/hi2';

const ROLE_STORAGE_KEY = 'zelova_preferred_role';

const RoleManagement = () => {
  const navigate = useNavigate();

  // Check for stored preference on mount
  useEffect(() => {
    const storedRole = localStorage.getItem(ROLE_STORAGE_KEY);
    if (storedRole === 'vendor') {
      navigate('/vendor', { replace: true });
    } else if (storedRole === 'user') {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  const handleRoleSelect = (roleId, path) => {
    // Store preference in localStorage
    localStorage.setItem(ROLE_STORAGE_KEY, roleId);
    navigate(path);
  };

  const roles = [
    {
      id: 'vendor',
      title: 'Vendor',
      description: 'Manage your store, products, and orders',
      icon: HiOutlineShoppingBag,
      gradient: 'from-orange-500 to-amber-500',
      hoverGradient: 'from-orange-600 to-amber-600',
      bgGlow: 'bg-orange-500/20',
      path: '/vendor'
    },
    {
      id: 'user',
      title: 'Customer',
      description: 'Browse stores, order food, and more',
      icon: HiOutlineUser,
      gradient: 'from-slate-600 to-slate-700',
      hoverGradient: 'from-slate-700 to-slate-800',
      bgGlow: 'bg-slate-500/20',
      path: '/'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/30 to-amber-50/50 flex items-center justify-center p-4 sm:p-6">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-4xl"
      >
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-3"
          >
            Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">Zelova</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-slate-500 text-base sm:text-lg"
          >
            How would you like to continue?
          </motion.p>
        </div>

        {/* Role Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          {roles.map((role, index) => (
            <motion.button
              key={role.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleRoleSelect(role.id, role.path)}
              className="group relative overflow-hidden rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-left transition-all duration-300"
            >
              {/* Card background with glassmorphism */}
              <div className="absolute inset-0 bg-white/80 backdrop-blur-xl border border-slate-200/50 shadow-lg rounded-2xl sm:rounded-3xl" />
              
              {/* Gradient overlay on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${role.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-2xl sm:rounded-3xl`} />
              
              {/* Glow effect */}
              <div className={`absolute -top-24 -right-24 w-48 h-48 ${role.bgGlow} rounded-full blur-3xl group-hover:scale-150 transition-transform duration-500`} />

              <div className="relative z-10">
                {/* Icon */}
                <div className={`inline-flex p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-br ${role.gradient} mb-4 sm:mb-6 shadow-lg`}>
                  <role.icon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>

                {/* Title */}
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-orange-500 group-hover:to-amber-500 transition-all">
                  {role.title}
                </h2>

                {/* Description */}
                <p className="text-slate-500 text-sm sm:text-base group-hover:text-slate-600 transition-colors">
                  {role.description}
                </p>

                {/* Arrow indicator */}
                <div className="mt-4 sm:mt-6 flex items-center text-slate-400 group-hover:text-orange-500 transition-colors">
                  <span className="text-sm font-medium">Continue</span>
                  <svg 
                    className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </div>
            </motion.button>
          ))}
        </div>

        {/* Footer hint */}
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center text-slate-400 text-xs sm:text-sm mt-8"
        >
          You can switch between roles anytime from your dashboard
        </motion.p>
      </motion.div>
    </div>
  );
};

export default RoleManagement;