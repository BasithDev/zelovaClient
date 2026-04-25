import { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { LuChevronDown, LuCheck } from 'react-icons/lu';
import { AnimatePresence, motion } from 'framer-motion';

/**
 * Reusable dropdown component for admin pages
 * @param {Object} props
 * @param {string} props.value - Current selected value
 * @param {function} props.onChange - Callback when value changes
 * @param {Array<{value: string, label: string}>} props.options - Array of options
 * @param {string} props.label - Label for the dropdown
 */
const CustomDropdown = ({ value, onChange, options, label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 hover:border-slate-300 transition-colors min-w-[120px]"
      >
        <span className="text-slate-500 text-xs">{label}:</span>
        <span className="font-medium">{selectedOption?.label || value}</span>
        <LuChevronDown className={`ml-auto transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg z-20 overflow-hidden"
          >
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-slate-50 transition-colors ${
                  value === option.value ? 'bg-blue-50 text-blue-600' : 'text-slate-700'
                }`}
              >
                {option.label}
                {value === option.value && <LuCheck className="ml-auto text-blue-600" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

CustomDropdown.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    })
  ).isRequired,
  label: PropTypes.string.isRequired,
};

export default CustomDropdown;
