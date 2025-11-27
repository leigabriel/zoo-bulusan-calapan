import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api-client';

const ChartIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
        <line x1="18" y1="20" x2="18" y2="10"/>
        <line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
);

const TicketIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
        <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/>
        <path d="M13 5v2"/>
        <path d="M13 17v2"/>
        <path d="M13 11v2"/>
    </svg>
);

const UsersIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
);

const Reports = () => {
    const [reportType, setReportType] = useState('sales');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);

    const generateReport = async () => {
        setLoading(true);
        try {
            const response = await adminAPI.getReports(reportType, dateRange);
            if (response.success) {
                setReportData(response.data);
            }
        } catch (error) {
            console.error('Error generating report:', error);
        } finally {
            setLoading(false);
        }
    };

    const exportReport = (format) => {
        alert(`Exporting report as ${format.toUpperCase()}`);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-800">Reports</h1>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Generate Report</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
                        <select
                            value={reportType}
                            onChange={(e) => setReportType(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none"
                        >
                            <option value="sales">Sales Report</option>
                            <option value="visitors">Visitor Report</option>
                            <option value="animals">Animal Report</option>
                            <option value="events">Event Report</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                        <input
                            type="date"
                            value={dateRange.start}
                            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                            className="w-full p-3 border border-gray-300 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                        <input
                            type="date"
                            value={dateRange.end}
                            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                            className="w-full p-3 border border-gray-300 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none"
                        />
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={generateReport}
                            disabled={loading}
                            className="w-full py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition disabled:opacity-50"
                        >
                            {loading ? 'Generating...' : 'Generate'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
                        <ChartIcon />
                    </div>
                    <h4 className="font-bold text-gray-800 mb-1">Total Revenue</h4>
                    <p className="text-3xl font-bold text-green-600">₱{reportData?.totalRevenue?.toLocaleString() || '0'}</p>
                    <p className="text-sm text-gray-500 mt-2">This period</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600">
                        <TicketIcon />
                    </div>
                    <h4 className="font-bold text-gray-800 mb-1">Tickets Sold</h4>
                    <p className="text-3xl font-bold text-blue-600">{reportData?.ticketsSold || '0'}</p>
                    <p className="text-sm text-gray-500 mt-2">This period</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm text-center">
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 text-purple-600">
                        <UsersIcon />
                    </div>
                    <h4 className="font-bold text-gray-800 mb-1">Visitors</h4>
                    <p className="text-3xl font-bold text-purple-600">{reportData?.visitors || '0'}</p>
                    <p className="text-sm text-gray-500 mt-2">This period</p>
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-800">Report Preview</h3>
                    <div className="flex gap-2">
                        <button
                            onClick={() => exportReport('pdf')}
                            className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
                        >
                            Export PDF
                        </button>
                        <button
                            onClick={() => exportReport('excel')}
                            className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition"
                        >
                            Export Excel
                        </button>
                    </div>
                </div>
                <div className="border border-gray-200 rounded-xl p-8 text-center text-gray-500">
                    {reportData ? (
                        <div className="text-left">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="p-3 text-left">Date</th>
                                        <th className="p-3 text-left">Type</th>
                                        <th className="p-3 text-left">Amount</th>
                                        <th className="p-3 text-left">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {reportData.items?.map((item, index) => (
                                        <tr key={index}>
                                            <td className="p-3">{item.date}</td>
                                            <td className="p-3">{item.type}</td>
                                            <td className="p-3">₱{item.amount}</td>
                                            <td className="p-3">
                                                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                                                    {item.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 text-gray-300 mb-4">
                                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                                <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
                            </svg>
                            <p>Select report type and date range, then click Generate to preview report</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Reports;
