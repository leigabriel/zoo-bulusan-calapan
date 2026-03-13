import { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { adminAPI } from '../../services/api-client';
import { notify } from '../../utils/toast';

// Icons
const ChartIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
);

const TicketIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
        <path d="M13 5v2" />
        <path d="M13 17v2" />
        <path d="M13 11v2" />
    </svg>
);

const UsersIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
);

const DownloadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
);

const RefreshIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <path d="M23 4v6h-6" />
        <path d="M1 20v-6h6" />
        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
);

const CalendarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
);

const FileTextIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
    </svg>
);

const ClipboardIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 text-gray-600">
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    </svg>
);

const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
);

const SortIcon = ({ direction }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 inline ml-1">
        {direction === 'asc' ? (
            <polyline points="18 15 12 9 6 15" />
        ) : direction === 'desc' ? (
            <polyline points="6 9 12 15 18 9" />
        ) : (
            <>
                <polyline points="6 9 12 5 18 9" />
                <polyline points="6 15 12 19 18 15" />
            </>
        )}
    </svg>
);

const TrendIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
    </svg>
);

const Reports = () => {
    const [reportType, setReportType] = useState('sales');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [statsLoading, setStatsLoading] = useState(true);
    const [quickStats, setQuickStats] = useState({
        totalRevenue: 0,
        ticketsSold: 0,
        visitors: 0,
        avgPerDay: 0,
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });

    // Date preset options
    const datePresets = [
        { label: 'Today', getValue: () => { const d = new Date(); return { start: formatDate(d), end: formatDate(d) }; } },
        { label: 'This Week', getValue: () => { const d = new Date(); const w = new Date(d.setDate(d.getDate() - d.getDay())); return { start: formatDate(w), end: formatDate(new Date()) }; } },
        { label: 'This Month', getValue: () => { const d = new Date(); return { start: formatDate(new Date(d.getFullYear(), d.getMonth(), 1)), end: formatDate(d) }; } },
        { label: 'This Year', getValue: () => { const d = new Date(); return { start: formatDate(new Date(d.getFullYear(), 0, 1)), end: formatDate(d) }; } },
        { label: 'Last 30 Days', getValue: () => { const d = new Date(); return { start: formatDate(new Date(d - 30 * 24 * 60 * 60 * 1000)), end: formatDate(d) }; } },
    ];

    function formatDate(date) {
        return date.toISOString().split('T')[0];
    }

    // Fetch quick stats on mount
    useEffect(() => {
        const fetchQuickStats = async () => {
            try {
                setStatsLoading(true);
                const response = await adminAPI.getQuickStats();
                if (response.success && response.data) {
                    setQuickStats({
                        totalRevenue: response.data.totalRevenue || 0,
                        ticketsSold: response.data.ticketsSold || 0,
                        visitors: response.data.visitors || 0,
                        avgPerDay: response.data.avgPerDay || Math.round((response.data.visitors || 0) / 30),
                    });
                }
            } catch (error) {
                console.error('Error fetching quick stats:', error);
            } finally {
                setStatsLoading(false);
            }
        };
        fetchQuickStats();
    }, []);

    const reportTypes = [
        { value: 'sales', label: 'Sales Report', icon: ChartIcon, description: 'Revenue and earnings breakdown' },
        { value: 'visitors', label: 'Visitor Report', icon: UsersIcon, description: 'Attendance and visitor data' },
        { value: 'events', label: 'Event Report', icon: CalendarIcon, description: 'Event attendance and bookings' },
        { value: 'tickets', label: 'Ticket Report', icon: TicketIcon, description: 'Ticket sales and validations' },
    ];

    const generateReport = async () => {
        if (!dateRange.start || !dateRange.end) {
            // Default to last 30 days
            const endDate = new Date();
            const startDate = new Date(endDate - 30 * 24 * 60 * 60 * 1000);
            setDateRange({
                start: formatDate(startDate),
                end: formatDate(endDate)
            });
        }
        
        setLoading(true);
        try {
            const response = await adminAPI.getReportData(
                dateRange.start || formatDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
                dateRange.end || formatDate(new Date()),
                reportType
            );
            
            if (response.success && response.data) {
                setReportData({
                    totalRevenue: response.data.totalRevenue || 0,
                    ticketsSold: response.data.ticketsSold || 0,
                    visitors: response.data.visitors || 0,
                    items: response.data.items || [],
                    generatedAt: new Date().toLocaleString(),
                    dateRange: { start: dateRange.start, end: dateRange.end },
                    reportType: reportTypes.find(t => t.value === reportType)?.label || 'Report',
                });
            } else {
                console.error('Failed to generate report:', response.message);
                setReportData({
                    totalRevenue: 0,
                    ticketsSold: 0,
                    visitors: 0,
                    items: [],
                    generatedAt: new Date().toLocaleString(),
                    dateRange: { start: dateRange.start, end: dateRange.end },
                    reportType: reportTypes.find(t => t.value === reportType)?.label || 'Report',
                });
            }
        } catch (error) {
            console.error('Error generating report:', error);
            setReportData({
                totalRevenue: 0,
                ticketsSold: 0,
                visitors: 0,
                items: [],
                generatedAt: new Date().toLocaleString(),
                dateRange: { start: dateRange.start, end: dateRange.end },
                reportType: reportTypes.find(t => t.value === reportType)?.label || 'Report',
            });
        } finally {
            setLoading(false);
        }
    };

    // Filtered and sorted data
    const processedItems = useMemo(() => {
        if (!reportData?.items) return [];
        
        let items = [...reportData.items];
        
        // Apply search filter
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            items = items.filter(item => 
                item.date?.toLowerCase().includes(term) ||
                item.type?.toLowerCase().includes(term) ||
                item.status?.toLowerCase().includes(term) ||
                item.reference?.toLowerCase().includes(term)
            );
        }
        
        // Apply sorting
        items.sort((a, b) => {
            let aVal = a[sortConfig.key];
            let bVal = b[sortConfig.key];
            
            if (sortConfig.key === 'amount' || sortConfig.key === 'quantity') {
                aVal = Number(aVal) || 0;
                bVal = Number(bVal) || 0;
            }
            
            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
        
        return items;
    }, [reportData?.items, searchTerm, sortConfig]);

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const exportReport = (format) => {
        if (!reportData || !reportData.items?.length) {
            notify.info('Generate a report first before exporting.');
            return;
        }

        if (format === 'excel') {
            // Prepare data for Excel with more details
            const excelData = processedItems.map(item => ({
                'Date': item.date,
                'Reference': item.reference || 'N/A',
                'Type': item.type,
                'Quantity': item.quantity,
                'Amount (₱)': item.amount,
                'Status': item.status
            }));

            // Add summary rows
            excelData.push({});
            excelData.push({
                'Date': 'REPORT SUMMARY',
                'Reference': '',
                'Type': '',
                'Quantity': '',
                'Amount (₱)': '',
                'Status': ''
            });
            excelData.push({
                'Date': 'Total Quantity',
                'Reference': '',
                'Type': '',
                'Quantity': processedItems.reduce((sum, item) => sum + (item.quantity || 0), 0),
                'Amount (₱)': '',
                'Status': ''
            });
            excelData.push({
                'Date': 'Total Revenue',
                'Reference': '',
                'Type': '',
                'Quantity': '',
                'Amount (₱)': reportData.totalRevenue,
                'Status': ''
            });
            excelData.push({
                'Date': 'Generated At',
                'Reference': reportData.generatedAt,
                'Type': '',
                'Quantity': '',
                'Amount (₱)': '',
                'Status': ''
            });

            // Create workbook and worksheet
            const ws = XLSX.utils.json_to_sheet(excelData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, reportData.reportType || 'Report');

            // Auto-size columns
            const maxWidths = {};
            excelData.forEach(row => {
                Object.keys(row).forEach(key => {
                    const value = String(row[key] || '');
                    maxWidths[key] = Math.max(maxWidths[key] || 10, value.length + 2);
                });
            });
            ws['!cols'] = Object.values(maxWidths).map(w => ({ wch: Math.min(w, 30) }));

            // Generate filename with date
            const dateStr = dateRange.start && dateRange.end 
                ? `${dateRange.start}_to_${dateRange.end}` 
                : new Date().toISOString().split('T')[0];
            const filename = `Zoo_${reportType}_Report_${dateStr}.xlsx`;

            // Download file
            XLSX.writeFile(wb, filename);
        } else if (format === 'csv') {
            // CSV export
            const headers = ['Date', 'Reference', 'Type', 'Quantity', 'Amount', 'Status'];
            const csvContent = [
                headers.join(','),
                ...processedItems.map(item => 
                    [item.date, item.reference || 'N/A', item.type, item.quantity, item.amount, item.status].join(',')
                )
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `Zoo_${reportType}_Report_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
        }
    };

    const getStatusBadge = (status) => {
        const statusLower = (status || '').toLowerCase();
        switch (statusLower) {
            case 'completed':
            case 'confirmed':
                return 'bg-[#8cff65]/20 text-[#8cff65] border-[#8cff65]/30';
            case 'pending':
                return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
            case 'cancelled':
            case 'refunded':
                return 'bg-red-500/20 text-red-400 border-red-500/30';
            default:
                return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
        }
    };

    const applyPreset = (preset) => {
        const values = preset.getValue();
        setDateRange(values);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <FileTextIcon />
                        Reports
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Generate and export detailed reports from database</p>
                </div>
                {reportData && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className="w-2 h-2 bg-[#8cff65] rounded-full animate-pulse"></span>
                        Last generated: {reportData.generatedAt}
                    </div>
                )}
            </div>

            {/* Report Generator Card */}
            <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <RefreshIcon />
                    Generate Report
                </h3>
                
                {/* Quick Date Presets */}
                <div className="flex flex-wrap gap-2 mb-4">
                    {datePresets.map((preset, idx) => (
                        <button
                            key={idx}
                            onClick={() => applyPreset(preset)}
                            className="px-3 py-1.5 text-xs font-medium bg-[#1e1e1e] border border-[#2a2a2a] text-gray-400 rounded-lg hover:border-[#8cff65]/50 hover:text-white transition-all"
                        >
                            {preset.label}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Report Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Report Type</label>
                        <select
                            value={reportType}
                            onChange={(e) => setReportType(e.target.value)}
                            className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#8cff65] focus:ring-1 focus:ring-[#8cff65]/20 transition-all cursor-pointer"
                        >
                            {reportTypes.map((type) => (
                                <option key={type.value} value={type.value}>{type.label}</option>
                            ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">{reportTypes.find(t => t.value === reportType)?.description}</p>
                    </div>

                    {/* Start Date */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Start Date</label>
                        <input
                            type="date"
                            value={dateRange.start}
                            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                            className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#8cff65] focus:ring-1 focus:ring-[#8cff65]/20 transition-all"
                        />
                    </div>

                    {/* End Date */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">End Date</label>
                        <input
                            type="date"
                            value={dateRange.end}
                            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                            className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#8cff65] focus:ring-1 focus:ring-[#8cff65]/20 transition-all"
                        />
                    </div>

                    {/* Generate Button */}
                    <div className="flex items-end">
                        <button
                            onClick={generateReport}
                            disabled={loading}
                            className="w-full py-3 bg-gradient-to-r from-[#8cff65] to-[#4ade80] text-[#0a0a0a] font-semibold rounded-xl hover:from-[#9dff7a] hover:to-[#5ceb91] transition-all disabled:opacity-50 shadow-lg shadow-[#8cff65]/20 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-[#0a0a0a] border-t-transparent rounded-full animate-spin"></div>
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <RefreshIcon />
                                    Generate Report
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Quick Stats - Now with 4 columns */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 bg-[#8cff65]/10 rounded-xl flex items-center justify-center text-[#8cff65]">
                            <ChartIcon />
                        </div>
                        <TrendIcon className="text-[#8cff65]" />
                    </div>
                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Revenue</h4>
                    <p className="text-2xl font-bold text-[#8cff65] mt-1">₱{(reportData?.totalRevenue || quickStats.totalRevenue).toLocaleString()}</p>
                    <p className="text-xs text-gray-500 mt-1">{dateRange.start && dateRange.end ? `${dateRange.start} - ${dateRange.end}` : 'All time'}</p>
                </div>
                <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400">
                            <TicketIcon />
                        </div>
                    </div>
                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Tickets Sold</h4>
                    <p className="text-2xl font-bold text-blue-400 mt-1">{(reportData?.ticketsSold || quickStats.ticketsSold).toLocaleString()}</p>
                    <p className="text-xs text-gray-500 mt-1">{reportData?.items?.length || 0} transactions</p>
                </div>
                <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-400">
                            <UsersIcon />
                        </div>
                    </div>
                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Visitors</h4>
                    <p className="text-2xl font-bold text-purple-400 mt-1">{(reportData?.visitors || quickStats.visitors).toLocaleString()}</p>
                    <p className="text-xs text-gray-500 mt-1">Unique visitors</p>
                </div>
                <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-400">
                            <CalendarIcon />
                        </div>
                    </div>
                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Revenue/Day</h4>
                    <p className="text-2xl font-bold text-amber-400 mt-1">
                        ₱{reportData?.items?.length > 0 
                            ? Math.round(reportData.totalRevenue / Math.max(1, new Set(reportData.items.map(i => i.date)).size)).toLocaleString()
                            : quickStats.avgPerDay?.toLocaleString() || '0'
                        }
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Daily average</p>
                </div>
            </div>

            {/* Report Preview */}
            <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl overflow-hidden">
                <div className="p-4 md:p-6 border-b border-[#2a2a2a] flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            {reportData?.reportType || 'Report'} Preview
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                            {processedItems.length} records {searchTerm && `matching "${searchTerm}"`}
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row w-full lg:w-auto gap-3">
                        {/* Search */}
                        <div className="relative flex-1 lg:flex-none">
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                            <input
                                type="text"
                                placeholder="Search records..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full lg:w-56 pl-10 pr-4 py-2 bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl text-white text-sm focus:outline-none focus:border-[#8cff65]/50"
                            />
                        </div>
                        {/* Export buttons */}
                        <div className="flex gap-2">
                            <button
                                onClick={() => exportReport('csv')}
                                disabled={!reportData?.items?.length}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-xl hover:bg-blue-500/20 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                            >
                                <DownloadIcon />
                                CSV
                            </button>
                            <button
                                onClick={() => exportReport('excel')}
                                disabled={!reportData?.items?.length}
                                className="flex items-center gap-2 px-4 py-2 bg-[#8cff65]/10 border border-[#8cff65]/30 text-[#8cff65] rounded-xl hover:bg-[#8cff65]/20 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                            >
                                <DownloadIcon />
                                Excel
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-4 md:p-6">
                    {reportData ? (
                        processedItems.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-[#1e1e1e]">
                                        <tr>
                                            <th 
                                                onClick={() => handleSort('date')}
                                                className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider rounded-l-lg cursor-pointer hover:text-white transition"
                                            >
                                                Date
                                                <SortIcon direction={sortConfig.key === 'date' ? sortConfig.direction : null} />
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">Ref</th>
                                            <th 
                                                onClick={() => handleSort('type')}
                                                className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition"
                                            >
                                                Type
                                                <SortIcon direction={sortConfig.key === 'type' ? sortConfig.direction : null} />
                                            </th>
                                            <th 
                                                onClick={() => handleSort('quantity')}
                                                className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition"
                                            >
                                                Qty
                                                <SortIcon direction={sortConfig.key === 'quantity' ? sortConfig.direction : null} />
                                            </th>
                                            <th 
                                                onClick={() => handleSort('amount')}
                                                className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition"
                                            >
                                                Amount
                                                <SortIcon direction={sortConfig.key === 'amount' ? sortConfig.direction : null} />
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider rounded-r-lg">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#2a2a2a]">
                                        {processedItems.map((item, index) => (
                                            <tr key={index} className="hover:bg-[#1e1e1e]/50 transition-colors">
                                                <td className="px-4 py-4 text-gray-300 whitespace-nowrap">{item.date}</td>
                                                <td className="px-4 py-4 text-gray-500 text-xs font-mono hidden md:table-cell">{item.reference?.substring(0, 12) || '-'}</td>
                                                <td className="px-4 py-4 text-white font-medium">{item.type}</td>
                                                <td className="px-4 py-4 text-gray-300">{item.quantity}</td>
                                                <td className="px-4 py-4 text-[#8cff65] font-medium">₱{(item.amount || 0).toLocaleString()}</td>
                                                <td className="px-4 py-4">
                                                    <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full border ${getStatusBadge(item.status)}`}>
                                                        {item.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-[#1a1a1a] border-t border-[#2a2a2a]">
                                        <tr>
                                            <td colSpan="3" className="px-4 py-3 text-sm font-bold text-white">Summary</td>
                                            <td className="px-4 py-3 text-sm font-bold text-white">
                                                {processedItems.reduce((sum, item) => sum + (item.quantity || 0), 0)}
                                            </td>
                                            <td className="px-4 py-3 text-sm font-bold text-[#8cff65]">
                                                ₱{processedItems.reduce((sum, item) => sum + (item.amount || 0), 0).toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3"></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center py-12 text-gray-500">
                                <ClipboardIcon />
                                <p className="mt-4">No records found for the selected criteria</p>
                            </div>
                        )
                    ) : (
                        <div className="flex flex-col items-center py-12 text-gray-500">
                            <ClipboardIcon />
                            <p className="mt-4 text-center">Select report type and date range, then click Generate to preview report</p>
                            <p className="text-xs text-gray-600 mt-2">Use quick date presets above for faster selection</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Reports;
