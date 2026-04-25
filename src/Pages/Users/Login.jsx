import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { toast } from 'react-hot-toast';
import { useDispatch } from 'react-redux';
import { setUserAuth } from '../../Redux/slices/user/authUserSlice';
import { loginUser } from '../../Services/apiServices';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    const handleLogin = async (e) => {
        e?.preventDefault();
        if (!email.trim()) {
            toast.error('Please enter your email');
            return;
        }
        if (!passwordRegex.test(password)) {
            toast.error('Password does not meet the required criteria.');
            return;
        }
        
        setIsLoading(true);
        try {
            const response = await loginUser({ email, password });
            const { userId, accessToken, isVendor, userStatus } = response.data;
            const status = userStatus || 'active';
            
            dispatch(setUserAuth({ 
                userId, 
                accessToken,
                isVendor, 
                status 
            }));
            
            // Always redirect to home page - user can switch to vendor via sidebar
            navigate('/', { replace: true });
        } catch (error) {
            console.error('[Login] Error:', error);
            toast.error(error.response?.data?.message || 'Login failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = () => {
        window.location.href = `${import.meta.env.VITE_API_BASE_URL}/auth/google`;
    };

    return (
        <div className="min-h-screen flex bg-white">
            {/* Left - Branding Section */}
            <div className="hidden lg:flex lg:w-2/5 relative bg-gradient-to-br from-orange-400 to-orange-500">
                {/* Content */}
                <div className="relative z-10 flex flex-col items-center justify-center w-full px-12 text-white">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="text-center"
                    >
                        <h1 className="text-6xl font-black mb-3">Zelova</h1>
                        <p className="text-lg opacity-90">
                            Delicious food, delivered fast
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* Right - Login Form */}
            <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4 }}
                    className="w-full max-w-md"
                >
                    {/* Mobile Logo */}
                    <div className="lg:hidden text-center mb-8">
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-yellow-500 bg-clip-text text-transparent">
                            Zelova
                        </h1>
                    </div>

                    {/* Header */}
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
                        <p className="text-gray-500 mt-1">Sign in to continue</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-5">
                        {/* Email Input */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Email
                            </label>
                            <div className="relative">
                                <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your email"
                                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                                />
                            </div>
                        </div>

                        {/* Password Input */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Password
                            </label>
                            <div className="relative">
                                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    className="w-full pl-12 pr-12 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Forgot Password */}
                        <div className="text-right">
                            <Link 
                                to="/forgot-password" 
                                replace
                                className="text-sm text-orange-500 hover:text-orange-600 font-medium"
                            >
                                Forgot password?
                            </Link>
                        </div>

                        {/* Login Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Signing in...
                                </>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="flex items-center gap-4 my-6">
                        <div className="flex-1 h-px bg-gray-200" />
                        <span className="text-sm text-gray-400">or</span>
                        <div className="flex-1 h-px bg-gray-200" />
                    </div>

                    {/* Google Login */}
                    <button
                        onClick={handleGoogleLogin}
                        className="w-full py-3 bg-white border border-gray-200 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-3"
                    >
                        <FcGoogle className="w-5 h-5" />
                        Continue with Google
                    </button>

                    {/* Sign Up Link */}
                    <p className="text-center mt-6 text-gray-500">
                        Don't have an account?{' '}
                        <Link to="/register" replace className="text-orange-500 hover:text-orange-600 font-medium">
                            Sign up
                        </Link>
                    </p>
                </motion.div>
            </div>
        </div>
    );
};

export default Login;