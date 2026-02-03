import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api-client';

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

const Reports = () => {
    const [reportType, setReportType] = useState('sales');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [quickStats, setQuickStats] = useState({
        totalRevenue: 328500,
        ticketsSold: 2766,
        visitors: 4521,
    });

    const reportTypes = [
        { value: 'sales', label: 'Sales Report', icon: ChartIcon },
        { value: 'visitors', label: 'Visitor Report', icon: UsersIcon },
        { value: 'events', label: 'Event Report', icon: CalendarIcon },
        { value: 'tickets', label: 'Ticket Report', icon: TicketIcon },
    ];

    const generateReport = async () => {
        setLoading(true);
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Mock data for demonstration
            setReportData({
                totalRevenue: 125600,
                ticketsSold: 892,
                visitors: 1243,
                items: [
                    { date: '2024-01-15', type: 'Adult Ticket', amount: 250, quantity: 5, status: 'Completed' },
                    { date: '2024-01-15', type: 'Child Ticket', amount: 150, quantity: 3, status: 'Completed' },
                    { date: '2024-01-14', type: 'Event Pass', amount: 500, quantity: 2, status: 'Completed' },
                    { date: '2024-01-14', type: 'Adult Ticket', amount: 200, quantity: 4, status: 'Completed' },
                    { date: '2024-01-13', type: 'Senior Ticket', amount: 175, quantity: 5, status: 'Completed' },
                    { date: '2024-01-13', type: 'Child Ticket', amount: 100, quantity: 2, status: 'Refunded' },
                ],
            });
        } catch (error) {
            console.error('Error generating report:', error);
        } finally {
            setLoading(false);
        }
    };

    const exportReport = (format) => {
        alert(`Exporting report as ${format.toUpperCase()}`);
    };

    const getStatusBadge = (status) => {
        switch (status.toLowerCase()) {
            case 'completed':
                return 'bg-[#8cff65]/20 text-[#8cff65] border-[#8cff65]/30';
            case 'pending':
                return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
            case 'refunded':
                return 'bg-red-500/20 text-red-400 border-red-500/30';
            default:
                return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
        }
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
                    <p className="text-gray-500 text-sm mt-1">Generate and export detailed reports</p>
                </div>
            </div>

            {/* Report Generator Card */}
            <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <RefreshIcon />
                    Generate Report
                </h3>
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
                            className="w-full py-3 bg-gradient-to-r from-[#8cff65] to-[#4ade80] text-[#0a0a0a] font-semibold rounded-xl hover:from-[#9dff7a] hover:to-[#5ceb91] transition-all disabled:opacity-50 shadow-lg shadow-[#8cff65]/20"
                        >
                            {loading ? 'Generating...' : 'Generate'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6 text-center">
                    <div className="w-16 h-16 bg-[#8cff65]/10 rounded-full flex items-center justify-center mx-auto mb-4 text-[#8cff65]">
                        <ChartIcon />
                    </div>
                    <h4 className="font-bold text-gray-400 mb-1">Total Revenue</h4>
                    <p className="text-3xl font-bold text-[#8cff65]">₱{(reportData?.totalRevenue || quickStats.totalRevenue).toLocaleString()}</p>
                    <p className="text-sm text-gray-500 mt-2">{dateRange.start && dateRange.end ? 'Selected period' : 'This month'}</p>
                </div>
                <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6 text-center">
                    <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-400">
                        <TicketIcon />
                    </div>
                    <h4 className="font-bold text-gray-400 mb-1">Tickets Sold</h4>
                    <p className="text-3xl font-bold text-blue-400">{reportData?.ticketsSold || quickStats.ticketsSold}</p>
                    <p className="text-sm text-gray-500 mt-2">{dateRange.start && dateRange.end ? 'Selected period' : 'This month'}</p>
                </div>
                <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6 text-center">
                    <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-purple-400">
                        <UsersIcon />
                    </div>
                    <h4 className="font-bold text-gray-400 mb-1">Total Visitors</h4>
                    <p className="text-3xl font-bold text-purple-400">{reportData?.visitors || quickStats.visitors}</p>
                    <p className="text-sm text-gray-500 mt-2">{dateRange.start && dateRange.end ? 'Selected period' : 'This month'}</p>
                </div>
            </div>

            {/* Report Preview */}
            <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-[#2a2a2a] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <h3 className="text-lg font-bold text-white">Report Preview</h3>
                    <div className="flex gap-2">
                        <button
                            onClick={() => exportReport('pdf')}
                            disabled={!reportData}
                            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl hover:bg-red-500/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <DownloadIcon />
                            Export PDF
                        </button>
                        <button
                            onClick={() => exportReport('excel')}
                            disabled={!reportData}
                            className="flex items-center gap-2 px-4 py-2 bg-[#8cff65]/10 border border-[#8cff65]/30 text-[#8cff65] rounded-xl hover:bg-[#8cff65]/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <DownloadIcon />
                            Export Excel
                        </button>
                    </div>
                </div>

                <div className="p-6">
                    {reportData ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-[#1e1e1e]">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider rounded-l-lg">Date</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Type</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Qty</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Amount</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider rounded-r-lg">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#2a2a2a]">
                                    {reportData.items?.map((item, index) => (
                                        <tr key={index} className="hover:bg-[#1e1e1e]/50 transition-colors">
                                            <td className="px-4 py-4 text-gray-300">{item.date}</td>
                                            <td className="px-4 py-4 text-white font-medium">{item.type}</td>
                                            <td className="px-4 py-4 text-gray-300">{item.quantity}</td>
                                            <td className="px-4 py-4 text-[#8cff65] font-medium">₱{item.amount.toLocaleString()}</td>
                                            <td className="px-4 py-4">
                                                <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full border ${getStatusBadge(item.status)}`}>
                                                    {item.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center py-12 text-gray-500">
                            <ClipboardIcon />
                            <p className="mt-4">Select report type and date range, then click Generate to preview report</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Reports;