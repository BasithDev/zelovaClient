import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import NumberFlow from '@number-flow/react';

/**
 * Reusable stat card for admin dashboards
 * @param {Object} props
 * @param {React.ElementType} props.icon - Icon component (from react-icons)
 * @param {string} props.label - Label text
 * @param {number} props.value - Numeric value to display
 * @param {string} props.color - Text color class for icon (e.g., "text-blue-600")
 * @param {string} props.bgColor - Background color class for icon container
 * @param {string} [props.prefix] - Optional prefix (e.g., "₹" for currency)
 * @param {string} [props.suffix] - Optional suffix (e.g., "%" for percentages)
 */
const StatCard = ({ icon: Icon, label, value, color, bgColor, prefix = '', suffix = '' }) => (
  <motion.div
    whileHover={{ y: -2 }}
    className="bg-white p-5 rounded-xl border border-slate-200 hover:shadow-md transition-all"
  >
    <div className="flex items-center gap-4">
      <div className={`p-3 rounded-xl ${bgColor}`}>
        <Icon className={`text-2xl ${color}`} />
      </div>
      <div>
        <p className="text-slate-500 text-sm">{label}</p>
        <p className="text-2xl font-bold text-slate-900">
          {prefix}<NumberFlow value={value || 0} />{suffix}
        </p>
      </div>
    </div>
  </motion.div>
);

StatCard.propTypes = {
  icon: PropTypes.elementType.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.number,
  color: PropTypes.string.isRequired,
  bgColor: PropTypes.string.isRequired,
  prefix: PropTypes.string,
  suffix: PropTypes.string,
};

StatCard.defaultProps = {
  value: 0,
  prefix: '',
  suffix: '',
};

export default StatCard;
