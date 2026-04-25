import { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import 'react-toastify/dist/ReactToastify.css';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { loginUser } from '../../Services/apiServices';
import { useDispatch } from 'react-redux';
import { setAdminAuth } from '../../Redux/slices/admin/authAdminSlice';
import { useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';

const validationSchema = Yup.object().shape({
    email: Yup.string()
        .email('Invalid email format')
        .required('Email is required'),
    password: Yup.string()
        .required('Password is required'),
});

const Login = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (values, { setSubmitting }) => {
        try {
            const response = await loginUser(values);
            if (response.status === 200) {
                const { userId, accessToken, isAdmin } = response.data;
                
                if (isAdmin) {
                    dispatch(setAdminAuth({ 
                        adminId: userId, 
                        accessToken
                    }));
                    navigate('/admin');
                } else {
                    toast.error("You're not authorized to access this page.");
                }
            }
        } catch (error) {
            console.error('Login error:', error);
            toast.error(error.response?.data?.message || 'Login failed');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/40 flex items-center justify-center p-4">
            {/* Subtle background accents */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-200/50 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-200/50 rounded-full blur-3xl" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="relative z-10 w-full max-w-md"
            >
                {/* Logo and Branding */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md mb-4">
                        <span className="text-white font-bold text-xl">Z</span>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        <span className="text-blue-600">Zelova</span>
                        <span className="text-slate-400 text-base font-normal ml-2">Admin</span>
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Sign in to your admin account
                    </p>
                </div>

                {/* Login Card */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
                    <Formik
                        initialValues={{ email: '', password: '' }}
                        validationSchema={validationSchema}
                        onSubmit={handleSubmit}
                    >
                        {({ isSubmitting, errors, touched }) => (
                            <Form className="space-y-5">
                                {/* Email Field */}
                                <div>
                                    <label className="block text-slate-700 text-sm font-medium mb-1.5" htmlFor="email">
                                        Email Address
                                    </label>
                                    <div className="relative">
                                        <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                        <Field
                                            type="email"
                                            id="email"
                                            name="email"
                                            placeholder="admin@zelova.com"
                                            className={`w-full pl-11 pr-4 py-2.5 bg-slate-50 border ${
                                                errors.email && touched.email ? 'border-rose-400' : 'border-slate-200'
                                            } rounded-lg text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm`}
                                        />
                                    </div>
                                    <ErrorMessage name="email" component="p" className="text-rose-500 text-xs mt-1" />
                                </div>

                                {/* Password Field */}
                                <div>
                                    <label className="block text-slate-700 text-sm font-medium mb-1.5" htmlFor="password">
                                        Password
                                    </label>
                                    <div className="relative">
                                        <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                        <Field
                                            type={showPassword ? 'text' : 'password'}
                                            id="password"
                                            name="password"
                                            placeholder="Enter your password"
                                            className={`w-full pl-11 pr-11 py-2.5 bg-slate-50 border ${
                                                errors.password && touched.password ? 'border-rose-400' : 'border-slate-200'
                                            } rounded-lg text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                                        >
                                            {showPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    <ErrorMessage name="password" component="p" className="text-rose-500 text-xs mt-1" />
                                </div>

                                {/* Forgot Password */}
                                <div className="flex justify-end">
                                    <a 
                                        href="/forgot-password" 
                                        className="text-sm text-slate-500 hover:text-blue-600 transition-colors"
                                    >
                                        Forgot password?
                                    </a>
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className={`w-full py-2.5 rounded-lg font-medium text-white transition-colors ${
                                        isSubmitting 
                                            ? 'bg-blue-300 cursor-not-allowed' 
                                            : 'bg-blue-600 hover:bg-blue-700'
                                    }`}
                                >
                                    {isSubmitting ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                            Signing in...
                                        </span>
                                    ) : (
                                        'Sign In'
                                    )}
                                </button>
                            </Form>
                        )}
                    </Formik>
                </div>

                {/* Footer */}
                <p className="text-center text-slate-400 text-xs mt-6">
                    © {new Date().getFullYear()} Zelova. All rights reserved.
                </p>
            </motion.div>
        </div>
    );
}

export default Login;