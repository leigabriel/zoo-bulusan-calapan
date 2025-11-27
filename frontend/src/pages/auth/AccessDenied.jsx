import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const AccessDenied = () => {
    const { user, role } = useAuth();
    const navigate = useNavigate();

    const getDashboardPath = () => {
        if (role === 'admin') return '/admin/dashboard';
        if (role === 'staff') return '/staff/dashboard';
        return '/';
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-4">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden text-center">
                <div className="bg-gradient-to-r from-red-500 to-orange-500 p-8 text-white">
                    <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12">
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold mb-2">Access Denied</h1>
                    <p className="opacity-90">You don't have permission to view this page</p>
                </div>

                <div className="p-8">
                    <p className="text-gray-600 mb-6">
                        {user ? (
                            <>
                                Your current role <span className="font-semibold text-gray-800">({role})</span> does not have access to this resource.
                            </>
                        ) : (
                            'Please log in to access this page.'
                        )}
                    </p>

                    <div className="space-y-3">
                        <button
                            onClick={() => navigate(-1)}
                            className="w-full py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition"
                        >
                            ← Go Back
                        </button>

                        {user ? (
                            <Link
                                to={getDashboardPath()}
                                className="block w-full py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition"
                            >
                                Go to Dashboard
                            </Link>
                        ) : (
                            <Link
                                to="/login"
                                className="block w-full py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition"
                            >
                                Log In
                            </Link>
                        )}

                        <Link
                            to="/"
                            className="block w-full py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition"
                        >
                            Go to Home
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AccessDenied;
