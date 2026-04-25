import { useState, useEffect, useRef, useCallback } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import html2canvas from 'html2canvas';
import { FaFilePdf, FaFileExcel, FaChartLine } from "react-icons/fa";
import { HiOutlineChartBar } from "react-icons/hi";
import PropTypes from 'prop-types';

// Empty State Component
const EmptyChartState = ({ reportType }) => (
  <div className="h-full flex flex-col items-center justify-center text-center p-8">
    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
      <HiOutlineChartBar className="w-8 h-8 text-slate-400" />
    </div>
    <h3 className="text-lg font-semibold text-slate-700 mb-2">No Data Available</h3>
    <p className="text-sm text-slate-500 max-w-xs">
      {reportType === 'order' 
        ? "No orders have been placed in the selected time period." 
        : reportType === 'sales'
        ? "No sales data available for the selected time period."
        : "No profit data available for the selected time period."}
    </p>
    <p className="text-xs text-slate-400 mt-2">Try selecting a different date range</p>
  </div>
);

const AnalyticsDashboard = ({ fetchReports, exportReportToPDF, exportReportToExcel, initialReportType = 'profit' }) => {
  const [reports, setReports] = useState([]);
  const [reportType, setReportType] = useState(initialReportType);
  const [timeRange, setTimeRange] = useState('month');
  const today = new Date();
  const defaultStartDate = new Date(today.setMonth(today.getMonth() - 1)).toISOString().split('T')[0];
  const defaultEndDate = new Date().toISOString().split('T')[0];
  const [dateRange, setDateRange] = useState({ startDate: defaultStartDate, endDate: defaultEndDate });
  const [isExporting, setIsExporting] = useState(false);
  const [chartType, setChartType] = useState('line');
  const chartRef = useRef(null);

  const fetchReportData = useCallback(async () => {
    try {
      const response = await fetchReports(reportType, timeRange, dateRange.startDate, dateRange.endDate);
      setReports(response.data || []);
    } catch (error) {
      console.error(error);
      setReports([]);
    }
  }, [fetchReports, reportType, timeRange, dateRange.startDate, dateRange.endDate]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  const handleExport = async (type) => {
    if (reports.length === 0) {
      toast.warning('No data to export');
      return;
    }
    try {
      setIsExporting(true);
      const chartElement = chartRef.current;
      const canvas = await html2canvas(chartElement);
      const chartImage = canvas.toDataURL('image/png');

      const exportData = {
        reportData: reports,
        chartImage,
        reportType,
        timeRange,
        dateRange
      };
      const response = type === 'pdf'
        ? await exportReportToPDF(exportData)
        : await exportReportToExcel(exportData);

      const blob = new Blob([response.data], {
        type: type === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = window.URL.createObjectURL(blob);
      const timestamp = Date.now();
      const link = document.createElement('a');
      link.href = url;
      link.download = `Report_${reportType}_${new Date().toISOString().split('T')[0]}_${timestamp}.${type === 'pdf' ? 'pdf' : 'xlsx'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error(`Error exporting ${type.toUpperCase()}:`, error);
      toast.error(`Failed to export ${type.toUpperCase()}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDateRangeChange = (type) => {
    const today = new Date();
    const endDate = today.toISOString().split('T')[0];
    let startDate = '';

    if (type === 'custom') {
      setTimeRange('custom');
      return;
    }

    switch (type) {
      case 'week': {
        const lastWeek = new Date(today.setDate(today.getDate() - 7));
        startDate = lastWeek.toISOString().split('T')[0];
        break;
      }
      case 'month': {
        const lastMonth = new Date(today.setMonth(today.getMonth() - 1));
        startDate = lastMonth.toISOString().split('T')[0];
        break;
      }
      case 'year': {
        const lastYear = new Date(today.setFullYear(today.getFullYear() - 1));
        startDate = lastYear.toISOString().split('T')[0];
        break;
      }
      default:
        startDate = endDate;
    }

    setTimeRange(type);
    setDateRange({ startDate, endDate });
  };

  const getChartDataKey = () => {
    switch (reportType) {
      case 'order': return 'count';
      case 'sales': return 'sales';
      case 'profit': return 'profit';
      default: return 'count';
    }
  };

  const getChartLabel = () => {
    switch (reportType) {
      case 'order': return 'Orders';
      case 'sales': return 'Sales (₹)';
      case 'profit': return 'Profit (₹)';
      default: return '';
    }
  };

  const hasData = reports && reports.length > 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-100">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
          <div className="flex items-center gap-2">
            <FaChartLine className="text-blue-500" />
            <h2 className="text-lg font-semibold text-slate-900">Analytics</h2>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            {/* Chart Type Toggle */}
            <button
              onClick={() => setChartType(prev => prev === 'line' ? 'bar' : 'line')}
              className="px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              {chartType === 'line' ? '📈 Line' : '📊 Bar'}
            </button>
            
            {/* Report Type */}
            <select
              className="text-sm bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
            >
              <option value="profit">Profit</option>
              <option value="sales">Sales</option>
              <option value="order">Orders</option>
            </select>
            
            {/* Time Range */}
            <select
              className="text-sm bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={timeRange}
              onChange={(e) => handleDateRangeChange(e.target.value)}
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
              <option value="custom">Custom</option>
            </select>

            {/* Export Buttons */}
            <div className="flex gap-1">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleExport('pdf')}
                disabled={isExporting || !hasData}
                className={`flex items-center gap-1 px-2 py-1.5 text-xs text-white rounded-lg ${
                  isExporting || !hasData ? 'bg-red-300 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600'
                }`}
              >
                <FaFilePdf />
                <span className="hidden sm:inline">PDF</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleExport('excel')}
                disabled={isExporting || !hasData}
                className={`flex items-center gap-1 px-2 py-1.5 text-xs text-white rounded-lg ${
                  isExporting || !hasData ? 'bg-green-300 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600'
                }`}
              >
                <FaFileExcel />
                <span className="hidden sm:inline">Excel</span>
              </motion.button>
            </div>
          </div>
        </div>

        {/* Custom Date Range */}
        {timeRange === 'custom' && (
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              className="text-sm bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              className="text-sm bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}
      </div>

      {/* Chart Area */}
      <div ref={chartRef} className="flex-1 p-4 min-h-[250px]">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'line' ? (
              <LineChart
                data={reports}
                margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" tickFormatter={(v) => reportType !== 'order' ? `₹${v}` : v} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }}
                  formatter={(value) => [
                    reportType !== 'order' ? `₹${Number(value).toFixed(2)}` : value,
                    getChartLabel()
                  ]}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey={getChartDataKey()}
                  name={getChartLabel()}
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            ) : (
              <BarChart
                data={reports}
                margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" tickFormatter={(v) => reportType !== 'order' ? `₹${v}` : v} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }}
                  formatter={(value) => [
                    reportType !== 'order' ? `₹${Number(value).toFixed(2)}` : value,
                    getChartLabel()
                  ]}
                />
                <Legend />
                <Bar
                  dataKey={getChartDataKey()}
                  name={getChartLabel()}
                  fill="#6366f1"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        ) : (
          <EmptyChartState reportType={reportType} />
        )}
      </div>
    </div>
  );
};

AnalyticsDashboard.propTypes = {
  fetchReports: PropTypes.func.isRequired,
  exportReportToPDF: PropTypes.func.isRequired,
  exportReportToExcel: PropTypes.func.isRequired,
  initialReportType: PropTypes.string,
};

export default AnalyticsDashboard;