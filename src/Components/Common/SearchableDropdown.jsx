import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiChevronDown, FiCheck, FiX } from 'react-icons/fi';

/**
 * SearchableDropdown - A modern, searchable dropdown component
 * 
 * @param {Object} props
 * @param {string} props.label - Label for the dropdown
 * @param {string} props.placeholder - Placeholder text
 * @param {Array} props.options - Array of { value, label, subtitle? } objects
 * @param {string} props.value - Selected value
 * @param {Function} props.onChange - Callback when value changes
 * @param {boolean} props.required - Show required indicator
 * @param {boolean} props.disabled - Disable the dropdown
 * @param {string} props.emptyMessage - Message when no options available
 */
const SearchableDropdown = ({
  label,
  placeholder = 'Select an option',
  options = [],
  value,
  onChange,
  required = false,
  disabled = false,
  emptyMessage = 'No options available'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Find selected option
  const selectedOption = options.find(opt => opt.value === value);

  // Filter options based on search
  const filteredOptions = options.filter(opt =>
    opt.label.toLowerCase().includes(search.toLowerCase()) ||
    (opt.subtitle && opt.subtitle.toLowerCase().includes(search.toLowerCase()))
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset highlight when filtered options change
  useEffect(() => {
    setHighlightedIndex(0);
  }, [search]);

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0);
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredOptions[highlightedIndex]) {
          handleSelect(filteredOptions[highlightedIndex].value);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSearch('');
        break;
    }
  };

  const handleSelect = (val) => {
    onChange(val);
    setIsOpen(false);
    setSearch('');
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
  };

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={`w-full flex items-center justify-between px-4 py-2.5 bg-white border rounded-lg transition-colors text-left ${
          disabled
            ? 'border-slate-200 bg-slate-50 cursor-not-allowed'
            : isOpen
            ? 'border-orange-500 ring-2 ring-orange-500/20'
            : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        <span className={selectedOption ? 'text-slate-900' : 'text-slate-400'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <div className="flex items-center gap-1">
          {selectedOption && !required && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:bg-slate-100 rounded"
            >
              <FiX className="w-3 h-3 text-slate-400" />
            </button>
          )}
          <FiChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden"
          >
            {/* Search Input */}
            {options.length > 5 && (
              <div className="p-2 border-b border-slate-100">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Search..."
                    autoFocus
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}

            {/* Options List */}
            <div className="max-h-60 overflow-y-auto">
              {filteredOptions.length === 0 ? (
                <div className="px-4 py-8 text-center text-slate-400 text-sm">
                  {search ? 'No matches found' : emptyMessage}
                </div>
              ) : (
                filteredOptions.map((option, index) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={`w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors ${
                      index === highlightedIndex
                        ? 'bg-orange-50'
                        : 'hover:bg-slate-50'
                    } ${option.value === value ? 'bg-orange-50' : ''}`}
                  >
                    <div>
                      <div className="text-sm font-medium text-slate-900">
                        {option.label}
                      </div>
                      {option.subtitle && (
                        <div className="text-xs text-slate-500">{option.subtitle}</div>
                      )}
                    </div>
                    {option.value === value && (
                      <FiCheck className="w-4 h-4 text-orange-500" />
                    )}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchableDropdown;
