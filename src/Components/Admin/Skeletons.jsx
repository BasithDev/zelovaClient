import PropTypes from 'prop-types';

/**
 * Skeleton loader for admin tables
 * @param {Object} props
 * @param {number} [props.rows] - Number of skeleton rows to display
 * @param {number} [props.columns] - Number of columns per row
 */
const TableSkeleton = ({ rows = 5, columns = 4 }) => (
  <div className="animate-pulse space-y-3">
    {[...Array(rows)].map((_, i) => (
      <div key={i} className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-100">
        <div className="w-10 h-10 rounded-full bg-slate-200" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-32 bg-slate-200 rounded" />
          <div className="h-3 w-48 bg-slate-200 rounded" />
        </div>
        {[...Array(columns - 2)].map((_, j) => (
          <div key={j} className="h-4 w-20 bg-slate-200 rounded" />
        ))}
      </div>
    ))}
  </div>
);

TableSkeleton.propTypes = {
  rows: PropTypes.number,
  columns: PropTypes.number,
};

TableSkeleton.defaultProps = {
  rows: 5,
  columns: 4,
};

/**
 * Skeleton loader for list items (categories, etc.)
 * @param {Object} props
 * @param {number} [props.rows] - Number of skeleton rows to display
 */
const ListSkeleton = ({ rows = 5 }) => (
  <div className="animate-pulse space-y-3">
    {[...Array(rows)].map((_, i) => (
      <div key={i} className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-100">
        <div className="flex-1 space-y-2">
          <div className="h-4 w-32 bg-slate-200 rounded" />
          <div className="h-3 w-20 bg-slate-200 rounded" />
        </div>
        <div className="h-8 w-20 bg-slate-200 rounded" />
      </div>
    ))}
  </div>
);

ListSkeleton.propTypes = {
  rows: PropTypes.number,
};

ListSkeleton.defaultProps = {
  rows: 5,
};

/**
 * Skeleton loader for coupon/card grids
 * @param {Object} props
 * @param {number} [props.count] - Number of skeleton cards to display
 */
const CardSkeleton = ({ count = 6 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
    {[...Array(count)].map((_, i) => (
      <div key={i} className="p-4 bg-white rounded-xl border border-slate-100 space-y-3">
        <div className="flex justify-between">
          <div className="h-5 w-24 bg-slate-200 rounded" />
          <div className="h-5 w-16 bg-slate-200 rounded" />
        </div>
        <div className="h-4 w-full bg-slate-200 rounded" />
        <div className="h-4 w-2/3 bg-slate-200 rounded" />
      </div>
    ))}
  </div>
);

CardSkeleton.propTypes = {
  count: PropTypes.number,
};

CardSkeleton.defaultProps = {
  count: 6,
};

export { TableSkeleton, ListSkeleton, CardSkeleton };
