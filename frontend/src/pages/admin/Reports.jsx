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

const PrintIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <path d="M6 9V2h12v7" />
        <path d="M6 18h12v4H6z" />
        <path d="M6 14h12" />
        <path d="M4 9h16a2 2 0 0 1 2 2v3H2v-3a2 2 0 0 1 2-2z" />
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
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 text-gray-500">
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
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    const normalizeReportDate = (value) => {
        if (!value) return '';

        if (typeof value === 'string') {
            const trimmed = value.trim();
            const isoDateMatch = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
            if (isoDateMatch) return isoDateMatch[1];

            const parsed = new Date(trimmed);
            if (!Number.isNaN(parsed.getTime())) {
                return formatDate(parsed);
            }

            return trimmed;
        }

        if (value instanceof Date && !Number.isNaN(value.getTime())) {
            return formatDate(value);
        }

        return String(value);
    };

    const toExportNumber = (value) => {
        const num = Number(value);
        return Number.isFinite(num) ? num : 0;
    };

    const normalizeStatus = (value) => {
        const status = String(value || '').toLowerCase();
        if (status === 'completed' || status === 'confirmed') return 'Completed';
        if (status === 'cancelled' || status === 'canceled') return 'Cancelled';
        if (status === 'pending') return 'Pending';
        if (!status) return 'N/A';
        return status.charAt(0).toUpperCase() + status.slice(1);
    };

    const escapeHtml = (value) => String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

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
        // { value: 'visitors', label: 'Visitor Report', icon: UsersIcon, description: 'Attendance and visitor data' },
        { value: 'events', label: 'Event Report', icon: CalendarIcon, description: 'Event attendance and bookings' },
        { value: 'tickets', label: 'Ticket Report', icon: TicketIcon, description: 'Ticket sales and validations' },
    ];

    const generateReport = async () => {
        const effectiveEnd = dateRange.end || formatDate(new Date());
        const effectiveStart = dateRange.start || formatDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));

        if (!dateRange.start || !dateRange.end) {
            setDateRange({
                start: effectiveStart,
                end: effectiveEnd
            });
        }
        
        setLoading(true);
        try {
            const response = await adminAPI.getReportData(effectiveStart, effectiveEnd, reportType);
            
            if (response.success && response.data) {
                setReportData({
                    totalRevenue: response.data.totalRevenue || 0,
                    ticketsSold: response.data.ticketsSold || 0,
                    visitors: response.data.visitors || 0,
                    items: response.data.items || [],
                    generatedAt: new Date().toLocaleString(),
                    dateRange: { start: effectiveStart, end: effectiveEnd },
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
                    dateRange: { start: effectiveStart, end: effectiveEnd },
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
                dateRange: { start: effectiveStart, end: effectiveEnd },
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
                normalizeReportDate(item.date).toLowerCase().includes(term) ||
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

            if (sortConfig.key === 'date') {
                aVal = normalizeReportDate(aVal);
                bVal = normalizeReportDate(bVal);
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

    const reportRows = useMemo(() => processedItems.map(item => ({
        date: normalizeReportDate(item.date),
        reference: item.reference || 'N/A',
        type: item.type || 'N/A',
        quantity: toExportNumber(item.quantity),
        amount: toExportNumber(item.amount),
        status: normalizeStatus(item.status)
    })), [processedItems]);

    const reportTotals = useMemo(() => processedItems.reduce((acc, item) => ({
        totalQuantity: acc.totalQuantity + toExportNumber(item.quantity),
        totalAmount: acc.totalAmount + toExportNumber(item.amount)
    }), { totalQuantity: 0, totalAmount: 0 }), [processedItems]);

    const getReportMeta = () => {
        const start = reportData?.dateRange?.start
            || dateRange.start
            || formatDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
        const end = reportData?.dateRange?.end || dateRange.end || formatDate(new Date());
        const title = reportData?.reportType
            || reportTypes.find(t => t.value === reportType)?.label
            || 'Report';
        const generatedAt = reportData?.generatedAt || new Date().toLocaleString();
        return { start, end, title, generatedAt };
    };

    const exportReport = () => {
        if (!reportData || reportRows.length === 0) {
            notify.info('Generate a report first before exporting.');
            return;
        }

        const { start, end, title, generatedAt } = getReportMeta();
        const headers = ['Date', 'Reference', 'Type', 'Quantity', 'Amount (PHP)', 'Status'];
        const rows = reportRows.map(row => [
            row.date,
            row.reference,
            row.type,
            row.quantity,
            row.amount,
            row.status
        ]);

        const sheetRows = [
            ['Zoo Bulusan Calapan'],
            [title],
            ['Date Range', `${start} to ${end}`],
            ['Generated At', generatedAt],
            [],
            headers,
            ...rows,
            ['', '', 'Summary', reportTotals.totalQuantity, reportTotals.totalAmount, '']
        ];

        const ws = XLSX.utils.aoa_to_sheet(sheetRows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, title);

        ws['!merges'] = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } },
            { s: { r: 1, c: 0 }, e: { r: 1, c: headers.length - 1 } }
        ];

        ws['!cols'] = headers.map((_, colIndex) => {
            let maxLength = 10;
            sheetRows.forEach(row => {
                const cell = row[colIndex];
                if (cell === null || cell === undefined) return;
                const length = String(cell).length + 2;
                if (length > maxLength) maxLength = length;
            });
            return { wch: Math.min(maxLength, 34) };
        });

        const dateStr = start && end ? `${start}_to_${end}` : formatDate(new Date());
        const filename = `Zoo_${reportType}_Report_${dateStr}.xlsx`;

        XLSX.writeFile(wb, filename);
    };

    const handlePrint = () => {
        if (!reportData || reportRows.length === 0) {
            notify.info('Generate a report first before printing.');
            return;
        }

        const { start, end, title, generatedAt } = getReportMeta();
        const totalAmount = reportTotals.totalAmount.toLocaleString();
        const totalQuantity = reportTotals.totalQuantity.toLocaleString();

        const rowsHtml = reportRows.map((row) => (
            `<tr>
                <td>${escapeHtml(row.date)}</td>
                <td>${escapeHtml(row.reference)}</td>
                <td>${escapeHtml(row.type)}</td>
                <td class="num">${escapeHtml(row.quantity.toLocaleString())}</td>
                <td class="num">₱${escapeHtml(row.amount.toLocaleString())}</td>
                <td>${escapeHtml(row.status)}</td>
            </tr>`
        )).join('');

        const html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <title>${escapeHtml(title)} - Print</title>
    <style>
        * { box-sizing: border-box; }
        body { font-family: Arial, sans-serif; color: #111; margin: 24px; }
        h1 { font-size: 20px; margin: 0 0 6px; }
        h2 { font-size: 16px; margin: 0 0 16px; font-weight: 600; }
        .meta { font-size: 12px; margin-bottom: 16px; color: #444; }
        .meta span { display: inline-block; margin-right: 18px; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; }
        th, td { border: 1px solid #ddd; padding: 10px 12px; font-size: 12px; text-align: left; }
        th { background: #f3f3f3; text-transform: uppercase; letter-spacing: 0.04em; font-size: 11px; }
        td.num { text-align: right; }
        tfoot td { font-weight: 700; background: #fafafa; }
        .summary { margin-top: 12px; font-size: 12px; color: #333; }
        @page { size: landscape; margin: 12mm; }
    </style>
</head>
<body>
    <h1>Zoo Bulusan Calapan</h1>
    <h2>${escapeHtml(title)} Report</h2>
    <div class="meta">
        <span>Date Range: ${escapeHtml(start)} to ${escapeHtml(end)}</span>
        <span>Generated: ${escapeHtml(generatedAt)}</span>
        <span>Records: ${reportRows.length}</span>
    </div>
    <table>
        <thead>
            <tr>
                <th>Date</th>
                <th>Reference</th>
                <th>Type</th>
                <th>Quantity</th>
                <th>Amount</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
            ${rowsHtml}
        </tbody>
        <tfoot>
            <tr>
                <td colspan="3">Summary</td>
                <td class="num">${escapeHtml(totalQuantity)}</td>
                <td class="num">₱${escapeHtml(totalAmount)}</td>
                <td></td>
            </tr>
        </tfoot>
    </table>
    <div class="summary">Prepared by the Admin Reports module.</div>
</body>
</html>`;

        const printWindow = window.open('', '_blank', 'width=1200,height=800');
        if (!printWindow) {
            notify.error('Please allow pop-ups to print this report.');
            return;
        }

        printWindow.document.open();
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        printWindow.onload = () => {
            printWindow.print();
        };
    };

    const getStatusBadge = (status) => {
        const statusLower = (status || '').toLowerCase();
        switch (statusLower) {
            case 'completed':
            case 'confirmed':
                return 'bg-green-500/20 text-green-600 border-green-500/30';
            case 'pending':
                return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
            case 'cancelled':
            case 'refunded':
                return 'bg-red-500/20 text-red-400 border-red-500/30';
            default:
                return 'bg-gray-500/20 text-gray-500 border-gray-500/30';
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
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <FileTextIcon />
                        Reports
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Generate and export detailed reports from database</p>
                </div>
                {reportData && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        Last generated: {reportData.generatedAt}
                    </div>
                )}
            </div>

            {/* Report Generator Card */}
            <div className="bg-white border border-green-200 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <RefreshIcon />
                    Generate Report
                </h3>
                
                {/* Quick Date Presets */}
                <div className="flex flex-wrap gap-2 mb-4">
                    {datePresets.map((preset, idx) => (
                        <button
                            key={idx}
                            onClick={() => applyPreset(preset)}
                            className="px-3 py-1.5 text-xs font-medium bg-green-50 border border-green-200 text-gray-500 rounded-lg hover:border-green-500/50 hover:text-gray-900 transition-all"
                        >
                            {preset.label}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Report Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-500 mb-2">Report Type</label>
                        <select
                            value={reportType}
                            onChange={(e) => setReportType(e.target.value)}
                            className="w-full bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-200 transition-all cursor-pointer"
                        >
                            {reportTypes.map((type) => (
                                <option key={type.value} value={type.value}>{type.label}</option>
                            ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">{reportTypes.find(t => t.value === reportType)?.description}</p>
                    </div>

                    {/* Start Date */}
                    <div>
                        <label className="block text-sm font-medium text-gray-500 mb-2">Start Date</label>
                        <input
                            type="date"
                            value={dateRange.start}
                            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                            className="w-full bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-200 transition-all"
                        />
                    </div>

                    {/* End Date */}
                    <div>
                        <label className="block text-sm font-medium text-gray-500 mb-2">End Date</label>
                        <input
                            type="date"
                            value={dateRange.end}
                            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                            className="w-full bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-200 transition-all"
                        />
                    </div>

                    {/* Generate Button */}
                    <div className="flex items-end">
                        <button
                            onClick={generateReport}
                            disabled={loading}
                            className="w-full py-3 bg-gradient-to-r from-green-500 to-green-400 text-white font-semibold rounded-xl hover:from-green-400 hover:to-green-500 transition-all disabled:opacity-50 shadow-lg shadow-green-300/50 flex items-center justify-center gap-2"
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
                <div className="bg-white border border-green-200 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center text-green-600">
                            <ChartIcon />
                        </div>
                        <TrendIcon className="text-green-600" />
                    </div>
                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Revenue</h4>
                    <p className="text-2xl font-bold text-green-600 mt-1">₱{(reportData?.totalRevenue || quickStats.totalRevenue).toLocaleString()}</p>
                    <p className="text-xs text-gray-500 mt-1">{dateRange.start && dateRange.end ? `${dateRange.start} - ${dateRange.end}` : 'All time'}</p>
                </div>
                <div className="bg-white border border-green-200 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400">
                            <TicketIcon />
                        </div>
                    </div>
                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Tickets Sold</h4>
                    <p className="text-2xl font-bold text-blue-400 mt-1">{(reportData?.ticketsSold || quickStats.ticketsSold).toLocaleString()}</p>
                    <p className="text-xs text-gray-500 mt-1">{reportData?.items?.length || 0} transactions</p>
                </div>
                <div className="bg-white border border-green-200 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-400">
                            <UsersIcon />
                        </div>
                    </div>
                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Visitors</h4>
                    <p className="text-2xl font-bold text-purple-400 mt-1">{(reportData?.visitors || quickStats.visitors).toLocaleString()}</p>
                    <p className="text-xs text-gray-500 mt-1">Unique visitors</p>
                </div>
                <div className="bg-white border border-green-200 rounded-2xl p-5">
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
            <div className="bg-white border border-green-200 rounded-2xl overflow-hidden">
                <div className="p-4 md:p-6 border-b border-green-200 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
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
                                className="w-full lg:w-56 pl-10 pr-4 py-2 bg-green-50 border border-green-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:border-green-500/50"
                            />
                        </div>
                        {/* Export + Print */}
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={exportReport}
                                disabled={reportRows.length === 0}
                                className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 text-green-600 rounded-xl hover:bg-green-500/20 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                            >
                                <DownloadIcon />
                                Export
                            </button>
                            <button
                                onClick={handlePrint}
                                disabled={reportRows.length === 0}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-500/10 border border-gray-500/30 text-gray-700 rounded-xl hover:bg-gray-500/20 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                            >
                                <PrintIcon />
                                Print
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-4 md:p-6">
                    {reportData ? (
                        processedItems.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-green-50">
                                        <tr>
                                            <th 
                                                onClick={() => handleSort('date')}
                                                className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider rounded-l-lg cursor-pointer hover:text-gray-900 transition"
                                            >
                                                Date
                                                <SortIcon direction={sortConfig.key === 'date' ? sortConfig.direction : null} />
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Ref</th>
                                            <th 
                                                onClick={() => handleSort('type')}
                                                className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-900 transition"
                                            >
                                                Type
                                                <SortIcon direction={sortConfig.key === 'type' ? sortConfig.direction : null} />
                                            </th>
                                            <th 
                                                onClick={() => handleSort('quantity')}
                                                className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-900 transition"
                                            >
                                                Qty
                                                <SortIcon direction={sortConfig.key === 'quantity' ? sortConfig.direction : null} />
                                            </th>
                                            <th 
                                                onClick={() => handleSort('amount')}
                                                className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-900 transition"
                                            >
                                                Amount
                                                <SortIcon direction={sortConfig.key === 'amount' ? sortConfig.direction : null} />
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider rounded-r-lg">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-green-200">
                                        {processedItems.map((item, index) => (
                                            <tr key={index} className="hover:bg-green-50/50 transition-colors">
                                                <td className="px-4 py-4 text-gray-700 whitespace-nowrap">{normalizeReportDate(item.date)}</td>
                                                <td className="px-4 py-4 text-gray-500 text-xs font-mono hidden md:table-cell">{item.reference?.substring(0, 12) || '-'}</td>
                                                <td className="px-4 py-4 text-gray-900 font-medium">{item.type}</td>
                                                <td className="px-4 py-4 text-gray-700">{item.quantity}</td>
                                                <td className="px-4 py-4 text-green-600 font-medium">₱{(item.amount || 0).toLocaleString()}</td>
                                                <td className="px-4 py-4">
                                                    <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full border ${getStatusBadge(item.status)}`}>
                                                        {item.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-green-50 border-t border-green-200">
                                        <tr>
                                            <td colSpan="3" className="px-4 py-3 text-sm font-bold text-gray-900">Summary</td>
                                            <td className="px-4 py-3 text-sm font-bold text-gray-900">
                                                {processedItems.reduce((sum, item) => sum + (item.quantity || 0), 0)}
                                            </td>
                                            <td className="px-4 py-3 text-sm font-bold text-green-600">
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
                            <p className="text-xs text-gray-500 mt-2">Use quick date presets above for faster selection</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Reports;
