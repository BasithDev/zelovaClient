import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiTag } from 'react-icons/fi';

const ProductCard = ({ product, onClick }) => {
  const [isImageLoading, setIsImageLoading] = useState(true);

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className="bg-white rounded-xl border border-slate-200 overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
    >
      <div className="flex">
        {/* Image */}
        <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex-shrink-0">
          {isImageLoading && (
            <div className="absolute inset-0 bg-slate-200 animate-pulse" />
          )}
          <img
            src={product.image || "https://via.placeholder.com/150"}
            alt={product.name}
            className={`w-full h-full object-cover transition-opacity ${isImageLoading ? 'opacity-0' : 'opacity-100'}`}
            onLoad={() => setIsImageLoading(false)}
          />
          
          {/* Status Badge */}
          <div className={`absolute top-2 left-2 px-2 py-0.5 rounded text-xs font-medium ${
            product.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
          }`}>
            {product.isActive ? 'Listed' : 'Unlisted'}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-3 flex flex-col min-w-0">
          <h3 className="font-semibold text-slate-900 truncate">{product.name}</h3>
          <p className="text-lg font-bold text-orange-500">₹{product.price}</p>
          
          {product.description && (
            <p className="text-xs text-slate-500 line-clamp-1 mt-1">{product.description}</p>
          )}
          
          {/* Bottom Row */}
          <div className="mt-auto pt-2 flex items-center gap-2 flex-wrap">
            {product.offers && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 text-xs rounded-md">
                <FiTag className="w-3 h-3" />
                {product.offers.discountAmount}% off
              </span>
            )}
            
            {product.customizable && product.customizations?.length > 0 && (
              <span className="text-xs text-slate-400">
                {product.customizations.length} customization{product.customizations.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;