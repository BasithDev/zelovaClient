import React from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  // eslint-disable-next-line no-unused-vars
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-md w-full"
          >
            {/* Illustration */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="w-32 h-32 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center"
                >
                  <svg className="w-16 h-16 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </motion.div>
                {/* Decorative dots */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="absolute -top-2 -right-2 w-4 h-4 bg-orange-300 rounded-full"
                />
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="absolute -bottom-1 -left-3 w-3 h-3 bg-orange-200 rounded-full"
                />
              </div>
            </div>

            {/* Content */}
            <div className="text-center">
              <motion.h1
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-2xl font-bold text-slate-900 mb-2"
              >
                Oops! Something went wrong
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-slate-500 mb-8"
              >
                We encountered an unexpected error. Don't worry, our team has been notified.
              </motion.p>

              {/* Actions */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex flex-col sm:flex-row gap-3 justify-center"
              >
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-3 bg-orange-500 text-white font-medium rounded-xl hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/30"
                >
                  Refresh Page
                </button>
                <button
                  onClick={() => window.history.back()}
                  className="px-6 py-3 bg-white text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-all border border-slate-200"
                >
                  Go Back
                </button>
              </motion.div>

              {/* Help text */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-8 text-sm text-slate-400"
              >
                If this keeps happening, please contact support
              </motion.p>
            </div>
          </motion.div>
        </div>
      );
    }
    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired
};

export default ErrorBoundary;
