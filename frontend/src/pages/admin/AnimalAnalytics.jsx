import { Check as ReiconCheck, Filter as ReiconFilter, Folder as ReiconFolder, Layers as ReiconLayers, Paw as ReiconPaw, Refresh as ReiconRefresh, Settings as ReiconSettings, Trash as ReiconTrash, Upload as ReiconUpload, Warning as ReiconWarning, X as ReiconX } from 'reicon-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { STORAGE_KEYS, predictionAPI } from '../../services/api-client';
import Chart from 'react-apexcharts';
import { notify } from '../../utils/toast';
import { ANIMAL_CLASSES } from '../../config/ai-service-config';

const EMPTY_MODEL_STATS = Object.fromEntries(ANIMAL_CLASSES.map(animal => [animal, 0]));

const AnimalAnalytics = () => {
    const [records, setRecords] = useState([]);
    const [stats, setStats] = useState(EMPTY_MODEL_STATS);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [selectedIds, setSelectedIds] = useState([]);
    const [selectAll, setSelectAll] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Model Management State
    const [showModelManager, setShowModelManager] = useState(false);
    const [modelFiles, setModelFiles] = useState([]);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState(null);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const modelInputRef = useRef(null);
    const weightsInputRef = useRef(null);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const fetchPredictions = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const data = await predictionAPI.getAll(page, 15);

            if (data && data.success) {
                setRecords(Array.isArray(data.predictions) ? data.predictions : []);
                setTotalRecords(data.total || 0);
                setTotalPages(data.totalPages || 1);
                setStats(data.stats || EMPTY_MODEL_STATS);
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
    }, [page]);

    useEffect(() => {
        fetchPredictions();
    }, [fetchPredictions]);

    const handleDelete = async () => {
        if (selectedIds.length === 0) {
            notify.warning('Select records first.');
            return;
        }

        if (!confirm(`Are you sure you want to delete ${selectedIds.length} record(s)?`)) return;

        try {
            const data = await predictionAPI.delete(selectedIds);
            if (data && data.success) {
                notify.success('Records removed.');
                setSelectedIds([]);
                setSelectAll(false);
                fetchPredictions();
            } else {
                throw new Error((data && data.message) || 'Failed to delete records');
            }
        } catch (error) {
            console.error('Error deleting records:', error);
            notify.error("Couldn't remove records.");
        }
    };

    const handleClearAll = async () => {
        if (!confirm('WARNING: This will permanently delete ALL records from the database. This action cannot be undone. Are you sure?')) return;
        if (!confirm('FINAL WARNING: All prediction history will be lost forever. Continue?')) return;

        try {
            const data = await predictionAPI.clearAll();
            if (data && data.success) {
                notify.success('Database cleared.');
                setSelectedIds([]);
                setSelectAll(false);
                fetchPredictions();
            } else {
                throw new Error((data && data.message) || 'Failed to clear records');
            }
        } catch (error) {
            console.error('Error clearing records:', error);
            notify.error("Couldn't clear database.");
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
        if (confidence > 90) return 'text-green-800 bg-green-100';
        if (confidence > 75) return 'text-blue-600 bg-blue-100';
        return 'text-amber-600 bg-amber-100';
    };

    // Model Management Functions
    const handleModelFileSelect = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            // Validate model.json file
            const modelJson = files.find(f => f.name === 'model.json');
            if (!modelJson) {
                setUploadError('Please select a valid model.json file');
                return;
            }
            setModelFiles(prevFiles => {
                // Replace existing model.json if present
                const filtered = prevFiles.filter(f => f.name !== 'model.json');
                return [...filtered, modelJson];
            });
            setUploadError(null);
        }
    };

    const handleWeightsFileSelect = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            // Validate weight/shard files (.bin files)
            const validFiles = files.filter(f => f.name.endsWith('.bin'));
            if (validFiles.length === 0) {
                setUploadError('Please select valid weight files (.bin)');
                return;
            }
            setModelFiles(prevFiles => {
                // Remove existing .bin files and add new ones
                const filtered = prevFiles.filter(f => !f.name.endsWith('.bin'));
                return [...filtered, ...validFiles];
            });
            setUploadError(null);
        }
    };

    const removeModelFile = (fileName) => {
        setModelFiles(prevFiles => prevFiles.filter(f => f.name !== fileName));
    };

    const handleModelUpload = async () => {
        // Validate files
        const modelJson = modelFiles.find(f => f.name === 'model.json');
        const weightFiles = modelFiles.filter(f => f.name.endsWith('.bin'));

        if (!modelJson) {
            setUploadError('model.json file is required');
            return;
        }

        if (weightFiles.length === 0) {
            setUploadError('At least one weight file (.bin) is required');
            return;
        }

        setIsUploading(true);
        setUploadError(null);
        setUploadProgress(0);
        setUploadSuccess(false);

        try {
            const formData = new FormData();
            formData.append('modelJson', modelJson);
            weightFiles.forEach(file => {
                formData.append('weights', file);
            });

            const response = await fetch(`${API_URL}/admin/upload-model`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: formData
            });

            // Simulate progress for better UX
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => Math.min(prev + 10, 90));
            }, 200);

            const result = await response.json();
            clearInterval(progressInterval);

            if (result.success) {
                setUploadProgress(100);
                setUploadSuccess(true);
                setModelFiles([]);
                setTimeout(() => {
                    setUploadSuccess(false);
                    setShowModelManager(false);
                }, 2000);
            } else {
                throw new Error(result.message || 'Upload failed');
            }
        } catch (error) {
            console.error('Model upload error:', error);
            setUploadError(error.message || 'Failed to upload model');
        } finally {
            setIsUploading(false);
        }
    };

    const resetModelUpload = () => {
        setModelFiles([]);
        setUploadError(null);
        setUploadProgress(0);
        setUploadSuccess(false);
    };

    if (loading && records.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mx-auto mb-4"></div>
                    <p className="text-gray-500 font-medium">Loading analytics...</p>
                </div>
            </div>
        );
    }

    if (error && records.length === 0) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center max-w-lg mx-auto mt-10">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                    <ReiconWarning strokeWidth="2" className="w-4 h-4" />
                </div>
                <h3 className="text-xl font-bold text-red-700 mb-2">Error Loading Data</h3>
                <p className="text-red-600 mb-6">{error}</p>
                <button
                    onClick={fetchPredictions}
                    className="px-6 py-2.5 bg-red-600 text-gray-900 rounded-lg hover:bg-red-700 transition font-medium flex items-center gap-2 mx-auto">
                    <ReiconRefresh strokeWidth="2" className="w-4 h-4" />
                    Retry Connection
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-8 p-2">

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Line Chart with ApexCharts */}
                <div className="lg:col-span-2 relative flex flex-col rounded-xl bg-white bg-clip-border text-gray-700 shadow-md">
                    <div className="relative mx-4 mt-4 flex flex-col gap-4 overflow-hidden rounded-none bg-transparent bg-clip-border text-gray-700 shadow-none md:flex-row md:items-center">
                        <div className="w-max rounded-lg bg-gradient-to-br from-green-300 via-green-400 to-green-500 p-5 text-gray-900">
                            <ReiconLayers strokeWidth="1.5" className="h-6 w-6" />
                        </div>
                        <div>
                            <h6 className="block font-sans text-base font-semibold leading-relaxed tracking-normal text-gray-900 antialiased">
                                Classification Distribution
                            </h6>
                            <p className="block max-w-sm font-sans text-sm font-normal leading-normal text-gray-700 antialiased">
                                Animal detection statistics across all classifications
                            </p>
                        </div>
                    </div>
                    <div className="pt-6 px-2 pb-0">
                        <Chart
                            options={{
                                chart: {
                                    type: 'line',
                                    height: 280,
                                    toolbar: {
                                        show: false,
                                    },
                                    zoom: {
                                        enabled: false
                                    }
                                },
                                dataLabels: {
                                    enabled: false,
                                },
                                colors: ['#4ade80'],
                                stroke: {
                                    lineCap: 'round',
                                    curve: 'smooth',
                                    width: 3,
                                },
                                markers: {
                                    size: 4,
                                    colors: ['#4ade80'],
                                    strokeColors: '#fff',
                                    strokeWidth: 2,
                                    hover: {
                                        size: 6,
                                    }
                                },
                                xaxis: {
                                    axisTicks: {
                                        show: false,
                                    },
                                    axisBorder: {
                                        show: false,
                                    },
                                    labels: {
                                        style: {
                                            colors: '#616161',
                                            fontSize: '11px',
                                            fontFamily: 'inherit',
                                            fontWeight: 500,
                                        },
                                        rotate: -45,
                                        rotateAlways: true,
                                    },
                                    categories: Object.keys(stats),
                                },
                                yaxis: {
                                    labels: {
                                        style: {
                                            colors: '#616161',
                                            fontSize: '12px',
                                            fontFamily: 'inherit',
                                            fontWeight: 400,
                                        },
                                        formatter: (val) => Math.round(val)
                                    },
                                },
                                grid: {
                                    show: true,
                                    borderColor: '#e5e7eb',
                                    strokeDashArray: 5,
                                    xaxis: {
                                        lines: {
                                            show: true,
                                        },
                                    },
                                    padding: {
                                        top: 5,
                                        right: 20,
                                    },
                                },
                                fill: {
                                    type: 'gradient',
                                    gradient: {
                                        shade: 'light',
                                        type: 'vertical',
                                        shadeIntensity: 0.5,
                                        opacityFrom: 0.7,
                                        opacityTo: 0.2,
                                    }
                                },
                                tooltip: {
                                    theme: 'light',
                                    y: {
                                        formatter: (val) => `${val} detections`
                                    }
                                },
                            }}
                            series={[
                                {
                                    name: 'Detections',
                                    data: Object.values(stats),
                                },
                            ]}
                            type="area"
                            height={280}
                        />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-green-300 via-green-400 to-green-500 rounded-3xl p-8 shadow-xl text-gray-900 flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-1/4 -translate-y-1/4">
                        <ReiconPaw className="w-64 h-64" weight="Filled" />
                    </div>

                    <div className="relative z-10">
                        <div className="bg-white/40 w-fit p-3 rounded-2xl mb-6 backdrop-blur-sm">
                            <ReiconPaw className="w-8 h-8" weight="Filled" />
                        </div>
                        <h3 className="text-lg font-medium text-green-50 mb-1">Total Classifications</h3>
                        <div className="text-6xl font-bold mb-2 tracking-tight">{totalRecords}</div>
                        <p className="text-sm text-green-800 opacity-80">All time records processed</p>
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
                            <ReiconTrash strokeWidth="2" className="w-4 h-4" />
                            Delete Selected
                        </button>

                        <button
                            onClick={handleClearAll}
                            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 bg-gray-100 text-gray-500 hover:bg-red-600 hover:text-gray-900 transition shadow-sm group">
                            <ReiconWarning strokeWidth="2" className="w-4 h-4" />
                            Clear Database
                        </button>

                        <button
                            onClick={() => setShowModelManager(true)}
                            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 bg-gradient-to-r from-green-300 via-green-400 to-green-500 text-gray-900 transition shadow-sm">
                            <ReiconSettings strokeWidth="2" className="w-5 h-5" />
                            AI Model
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
                                        className="w-4 h-4 rounded border-gray-300 text-green-800 focus:ring-green-400 cursor-pointer"
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
                                                className="w-4 h-4 rounded border-gray-300 text-green-800 focus:ring-green-400 cursor-pointer"
                                            />
                                        </td>
                                        <td className="p-5 text-gray-500 font-mono text-xs">#{record.id}</td>
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
                                        <div className="flex flex-col items-center justify-center text-gray-500 gap-3">
                                            <ReiconFilter strokeWidth="2" className="w-4 h-4" />
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
                            className="px-5 py-2.5 rounded-xl text-sm font-bold bg-green-400 text-gray-900 hover:bg-green-400 shadow-md hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none">
                            Next
                        </button>
                    </div>
                </div>
            </div>

            {/* Model Manager Modal */}
            {showModelManager && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-green-300 via-green-400 to-green-500 p-6 text-gray-900">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="bg-white/40 p-2 rounded-xl">
                                        <ReiconSettings strokeWidth="2" className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold">AI Model Manager</h2>
                                        <p className="text-purple-100 text-sm">Upload and manage classification models</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowModelManager(false);
                                        resetModelUpload();
                                    }}
                                    className="p-2 hover:bg-white/40 rounded-xl transition"
                                >
                                    <ReiconX className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 overflow-y-auto max-h-[60vh]">
                            {/* Current Model Info */}
                            <div className="bg-gray-50 rounded-2xl p-4 mb-6 border border-gray-100">
                                <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                    <ReiconFolder strokeWidth="2" className="w-5 h-5" />
                                    Current Model
                                </h3>
                                <div className="flex items-center gap-3">
                                    <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                                        Active
                                    </div>
                                    <span className="text-gray-500 text-sm">/model/bulusanzoo_machine_learning/model.json</span>
                                </div>
                                <p className="text-xs text-gray-500 mt-2">11 classes • 3 weight shards</p>
                            </div>

                            {/* Upload Success State */}
                            {uploadSuccess && (
                                <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center mb-6">
                                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <ReiconCheck className="w-8 h-8 text-green-800" />
                                    </div>
                                    <h3 className="text-lg font-bold text-green-700 mb-1">Model Uploaded Successfully!</h3>
                                    <p className="text-green-800 text-sm">The new model is now active</p>
                                </div>
                            )}

                            {/* Upload Area */}
                            {!uploadSuccess && (
                                <>
                                    <h3 className="font-semibold text-gray-700 mb-4">Upload New Model</h3>

                                    {/* Model.json Upload */}
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-500 mb-2">
                                            Model Architecture (model.json)
                                        </label>
                                        <input
                                            ref={modelInputRef}
                                            type="file"
                                            accept=".json"
                                            onChange={handleModelFileSelect}
                                            className="hidden"
                                        />
                                        <button
                                            onClick={() => modelInputRef.current?.click()}
                                            disabled={isUploading}
                                            className="w-full border-2 border-dashed border-gray-200 rounded-xl p-4 hover:border-purple-400 hover:bg-purple-50/50 transition flex items-center justify-center gap-2 text-gray-500 hover:text-purple-600 disabled:opacity-50"
                                        >
                                            <ReiconUpload strokeWidth="2" className="w-5 h-5" />
                                            {modelFiles.find(f => f.name === 'model.json')
                                                ? modelFiles.find(f => f.name === 'model.json').name
                                                : 'Click to select model.json'}
                                        </button>
                                    </div>

                                    {/* Weights Upload */}
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-500 mb-2">
                                            Weight Files (.bin shards)
                                        </label>
                                        <input
                                            ref={weightsInputRef}
                                            type="file"
                                            accept=".bin"
                                            multiple
                                            onChange={handleWeightsFileSelect}
                                            className="hidden"
                                        />
                                        <button
                                            onClick={() => weightsInputRef.current?.click()}
                                            disabled={isUploading}
                                            className="w-full border-2 border-dashed border-gray-200 rounded-xl p-4 hover:border-purple-400 hover:bg-purple-50/50 transition flex items-center justify-center gap-2 text-gray-500 hover:text-purple-600 disabled:opacity-50"
                                        >
                                            <ReiconUpload strokeWidth="2" className="w-5 h-5" />
                                            Click to select weight files
                                        </button>
                                    </div>

                                    {/* Selected Files List */}
                                    {modelFiles.length > 0 && (
                                        <div className="bg-gray-50 rounded-xl p-4 mb-4">
                                            <h4 className="text-sm font-medium text-gray-500 mb-2">Selected Files ({modelFiles.length})</h4>
                                            <div className="max-h-32 overflow-y-auto space-y-1">
                                                {modelFiles.map(file => (
                                                    <div key={file.name} className="flex items-center justify-between bg-white px-3 py-2 rounded-lg text-sm">
                                                        <span className="truncate text-gray-500">{file.name}</span>
                                                        <button
                                                            onClick={() => removeModelFile(file.name)}
                                                            disabled={isUploading}
                                                            className="text-red-700 hover:text-red-600 disabled:opacity-50"
                                                        >
                                                            <ReiconTrash strokeWidth="2" className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Progress Bar */}
                                    {isUploading && (
                                        <div className="mb-4">
                                            <div className="flex justify-between text-sm text-gray-500 mb-1">
                                                <span>Uploading...</span>
                                                <span>{uploadProgress}%</span>
                                            </div>
                                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-green-300 via-green-400 to-green-500 transition-all duration-300"
                                                    style={{ width: `${uploadProgress}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Error Message */}
                                    {uploadError && (
                                        <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 flex items-center gap-2 text-red-600 text-sm">
                                            <ReiconWarning strokeWidth="2" className="w-4 h-4" />
                                            {uploadError}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="border-t border-gray-100 p-4 bg-gray-50 flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setShowModelManager(false);
                                    resetModelUpload();
                                }}
                                className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-200 transition"
                            >
                                Cancel
                            </button>
                            {!uploadSuccess && (
                                <button
                                    onClick={handleModelUpload}
                                    disabled={modelFiles.length === 0 || isUploading}
                                    className="px-5 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-green-300 via-green-400 to-green-500 text-gray-900 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isUploading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Uploading...
                                        </>
                                    ) : (
                                        <>
                                            <ReiconUpload strokeWidth="2" className="w-5 h-5" />
                                            Upload Model
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AnimalAnalytics;
