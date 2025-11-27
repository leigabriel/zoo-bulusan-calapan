import { useState, useEffect } from 'react';
import { STORAGE_KEYS, predictionAPI } from '../../services/api-client';

const Icons = {
    Chart: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
    ),
    Paw: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
            <path d="M19 5c-1.1 0-2 .9-2 2v.5c-.85-.18-1.78-.17-2.5 0V7c0-1.1-.9-2-2-2s-2 .9-2 2v1.07c-1.07.6-2.06 1.34-3 2.18V9c0-1.1-.9-2-2-2s-2 .9-2 2v5.18c0 3.2 3.52 5.82 8.5 5.82s8.5-2.62 8.5-5.82V7c0-1.1-.9-2-2-2zm-6.5 2c.28 0 .5.22.5.5v1.23c-.32.06-.65.14-.97.24V7.5c0-.28.22-.5.5-.5zM5.5 9c.28 0 .5.22.5.5v3.13c-1.18.96-1.5 2.15-1.5 3.19 0 1.07 1.43 2.18 4.5 2.18s4.5-1.11 4.5-2.18c0-1.04-.32-2.23-1.5-3.19V9.5c0-.28.22-.5.5-.5s.5.22.5.5v5.03c.87.5 1.74.83 2.5 1.02V9.5c0-.28.22-.5.5-.5s.5.22.5.5v6.5c0 1.93-3.13 3.5-7 3.5s-7-1.57-7-3.5v-6c0-.28.22-.5.5-.5z" />
        </svg>
    ),
    Trash: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
    ),
    Warning: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
    ),
    Refresh: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <path d="M23 4v6h-6" />
            <path d="M1 20v-6h6" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
        </svg>
    ),
    Filter: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
        </svg>
    )
};

const AnimalAnalytics = () => {
    const [records, setRecords] = useState([]);
    const [stats, setStats] = useState({ Bear: 0, Bird: 0, Cat: 0, Cow: 0, Deer: 0, Dog: 0, Dolphin: 0, Elephant: 0, Giraffe: 0, Horse: 0, Kangaroo: 0, Lion: 0, Panda: 0, Tiger: 0, Zebra: 0 });
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [selectedIds, setSelectedIds] = useState([]);
    const [selectAll, setSelectAll] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const maxStatValue = Math.max(...Object.values(stats), 1);

    useEffect(() => {
        fetchPredictions();
    }, [page]);

    const fetchPredictions = async () => {
        try {
            setLoading(true);
            setError(null);

            const data = await predictionAPI.getAll(page, 15);

            if (data && data.success) {
                setRecords(Array.isArray(data.predictions) ? data.predictions : []);
                setTotalRecords(data.total || 0);
                setTotalPages(data.totalPages || 1);
                setStats(data.stats || stats);
            } else {
                throw new Error((data && data.message) || 'Failed to fetch predictions');
            }
        } catch (error) {
            console.error('Error fetching predictions:', error);
            setError(error.message || 'Failed to load data');
            setRecords([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (selectedIds.length === 0) {
            alert('Please select at least one record to delete');
            return;
        }

        if (!confirm(`Are you sure you want to delete ${selectedIds.length} record(s)?`)) return;

        try {
            const data = await predictionAPI.delete(selectedIds);
            if (data && data.success) {
                alert('Records deleted successfully');
                setSelectedIds([]);
                setSelectAll(false);
                fetchPredictions();
            } else {
                throw new Error((data && data.message) || 'Failed to delete records');
            }
        } catch (error) {
            console.error('Error deleting records:', error);
            alert('Failed to delete records: ' + error.message);
        }
    };

    const handleClearAll = async () => {
        if (!confirm('WARNING: This will permanently delete ALL records from the database. This action cannot be undone. Are you sure?')) return;
        if (!confirm('FINAL WARNING: All prediction history will be lost forever. Continue?')) return;

        try {
            const data = await predictionAPI.clearAll();
            if (data && data.success) {
                alert('All records cleared successfully');
                setSelectedIds([]);
                setSelectAll(false);
                fetchPredictions();
            } else {
                throw new Error((data && data.message) || 'Failed to clear records');
            }
        } catch (error) {
            console.error('Error clearing records:', error);
            alert('Failed to clear records: ' + error.message);
        }
    };

    const toggleSelectAll = () => {
        if (!records || records.length === 0) return;

        if (selectAll) {
            setSelectedIds([]);
        } else {
            setSelectedIds(records.map(r => r.id));
        }
        setSelectAll(!selectAll);
    };

    const toggleSelect = (id) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(i => i !== id));
            setSelectAll(false);
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const getConfidenceColor = (confidence) => {
        if (confidence > 90) return 'text-green-600 bg-green-100';
        if (confidence > 75) return 'text-blue-600 bg-blue-100';
        return 'text-amber-600 bg-amber-100';
    };

    if (loading && records.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                    <p className="text-gray-500 font-medium">Loading analytics...</p>
                </div>
            </div>
        );
    }

    if (error && records.length === 0) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center max-w-lg mx-auto mt-10">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                    <Icons.Warning />
                </div>
                <h3 className="text-xl font-bold text-red-700 mb-2">Error Loading Data</h3>
                <p className="text-red-600 mb-6">{error}</p>
                <button
                    onClick={fetchPredictions}
                    className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium flex items-center gap-2 mx-auto">
                    <Icons.Refresh />
                    Retry Connection
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-8 p-2">

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white border border-gray-100 rounded-3xl p-8 shadow-lg hover:shadow-xl transition duration-300">
                    <h3 className="text-xl font-bold text-green-800 mb-8 flex items-center gap-2">
                        <Icons.Chart />
                        Classification Distribution
                    </h3>
                    <div className="h-64 flex items-end justify-between gap-1 pb-2 border-b border-gray-100 relative">
                        {/* Background Grid Lines */}
                        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-50">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="w-full h-px bg-gray-50"></div>
                            ))}
                        </div>

                        {Object.entries(stats).map(([animal, count]) => {
                            const height = (count / maxStatValue) * 100;
                            return (
                                <div key={animal} className="flex-1 flex flex-col items-center gap-2 group z-10">
                                    <div className="relative w-full flex justify-center h-full items-end">
                                        <div
                                            className="w-full max-w-[24px] bg-gradient-to-t from-green-600 to-teal-400 rounded-t-md transition-all duration-700 group-hover:from-green-500 group-hover:to-teal-300 relative"
                                            style={{ height: `${height}%`, minHeight: count > 0 ? '6px' : '2px', opacity: count > 0 ? 1 : 0.3 }}
                                        >
                                            {count > 0 && (
                                                <span className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-bold text-green-700 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {count}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <span className="text-[10px] text-gray-500 font-medium truncate w-full text-center transform -rotate-45 origin-center mt-2 group-hover:text-green-700 transition-colors">
                                        {animal}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="bg-gradient-to-br from-green-600 to-teal-600 rounded-3xl p-8 shadow-xl text-white flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-1/4 -translate-y-1/4">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-64 h-64">
                            <path d="M19 5c-1.1 0-2 .9-2 2v.5c-.85-.18-1.78-.17-2.5 0V7c0-1.1-.9-2-2-2s-2 .9-2 2v1.07c-1.07.6-2.06 1.34-3 2.18V9c0-1.1-.9-2-2-2s-2 .9-2 2v5.18c0 3.2 3.52 5.82 8.5 5.82s8.5-2.62 8.5-5.82V7c0-1.1-.9-2-2-2z" />
                        </svg>
                    </div>

                    <div className="relative z-10">
                        <div className="bg-white/20 w-fit p-3 rounded-2xl mb-6 backdrop-blur-sm">
                            <Icons.Paw />
                        </div>
                        <h3 className="text-lg font-medium text-green-50 mb-1">Total Classifications</h3>
                        <div className="text-6xl font-bold mb-2 tracking-tight">{totalRecords}</div>
                        <p className="text-sm text-green-100 opacity-80">All time records processed</p>
                    </div>

                    <div className="relative z-10 mt-8 pt-6 border-t border-white/20">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-green-50">Most Identified:</span>
                            <span className="font-bold bg-white text-green-800 px-3 py-1 rounded-full">
                                {Object.entries(stats).sort((a, b) => b[1] - a[1])[0][0]}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-3xl shadow-lg overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50/50">
                    <div className="flex items-center gap-3">
                        <h3 className="text-xl font-bold text-gray-800">Prediction History</h3>
                        <span className="text-xs font-bold bg-green-100 text-green-700 px-3 py-1 rounded-full border border-green-200">
                            Page {page} of {Math.max(1, totalPages)}
                        </span>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <button
                            onClick={handleDelete}
                            disabled={selectedIds.length === 0}
                            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 bg-white text-red-500 border border-red-200 hover:bg-red-50 hover:border-red-300 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">
                            <Icons.Trash />
                            Delete Selected
                        </button>

                        <button
                            onClick={handleClearAll}
                            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 bg-gray-100 text-gray-600 hover:bg-red-600 hover:text-white transition shadow-sm group">
                            <Icons.Warning />
                            Clear Database
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50 text-gray-500 uppercase text-xs tracking-wider border-b border-gray-100">
                                <th className="p-5 w-16 text-center">
                                    <input
                                        type="checkbox"
                                        checked={selectAll}
                                        onChange={toggleSelectAll}
                                        className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"
                                    />
                                </th>
                                <th className="p-5 text-left font-semibold">ID</th>
                                <th className="p-5 text-left font-semibold">File Name</th>
                                <th className="p-5 text-left font-semibold">Prediction</th>
                                <th className="p-5 text-left font-semibold">Confidence</th>
                                <th className="p-5 text-left font-semibold">Date & Time</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {records.length > 0 ? (
                                records.map((record) => (
                                    <tr key={record.id} className="hover:bg-green-50/30 transition group">
                                        <td className="p-5 text-center">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(record.id)}
                                                onChange={() => toggleSelect(record.id)}
                                                className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"
                                            />
                                        </td>
                                        <td className="p-5 text-gray-400 font-mono text-xs">#{record.id}</td>
                                        <td className="p-5">
                                            <span className="text-gray-700 font-medium block max-w-[200px] truncate" title={record.filename}>
                                                {record.filename}
                                            </span>
                                        </td>
                                        <td className="p-5">
                                            <span className="font-bold text-gray-800 bg-gray-100 px-3 py-1 rounded-lg">
                                                {record.prediction}
                                            </span>
                                        </td>
                                        <td className="p-5">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getConfidenceColor(Number(record.confidence))}`}>
                                                {Number(record.confidence).toFixed(1)}%
                                            </span>
                                        </td>
                                        <td className="p-5 text-gray-500 text-sm">
                                            {record.createdAt ? new Date(record.createdAt).toLocaleString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            }) : '—'}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="p-16 text-center">
                                        <div className="flex flex-col items-center justify-center text-gray-400 gap-3">
                                            <Icons.Filter />
                                            <p className="text-lg font-medium">No records found</p>
                                            <p className="text-sm">Start classifying images to see data here.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="p-6 border-t border-gray-100 bg-gray-50 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="text-sm text-gray-500 font-medium">
                        Showing <span className="text-gray-900 font-bold">{records.length}</span> of <span className="text-gray-900 font-bold">{totalRecords}</span> results
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-5 py-2.5 rounded-xl text-sm font-bold bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:text-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">
                            Previous
                        </button>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page >= totalPages}
                            className="px-5 py-2.5 rounded-xl text-sm font-bold bg-green-600 text-white hover:bg-green-700 shadow-md hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none">
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnimalAnalytics;