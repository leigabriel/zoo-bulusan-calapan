import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import Home from './pages/user/Home';
import Animals from './pages/user/Animals';
import Plants from './pages/user/Plants';
import Events from './pages/user/Events';
import Reservations from './pages/user/Reservations';
import AboutUs from './pages/user/AboutUs';
import ArchivedReservations from './pages/user/ArchivedReservations';
import UserProfile from './pages/user/UserProfile';
import Settings from './pages/user/Settings';
import Help from './pages/user/Help';
import UserMessages from './pages/user/UserMessages';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import GoogleAuthSuccess from './pages/auth/GoogleAuthSuccess';
import AccessDenied from './pages/auth/AccessDenied';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminEvents from './pages/admin/AdminEvents';
import AnimalAnalytics from './pages/admin/AnimalAnalytics';
import Analytics from './pages/admin/Analytics';
import Reports from './pages/admin/Reports';
import AdminUsers from './pages/admin/AdminUsers';
import AdminAnimals from './pages/admin/AdminAnimals';
import AdminPlants from './pages/admin/AdminPlants';
import AdminReservations from './pages/admin/AdminReservations';
import AdminProfile from './pages/admin/AdminProfile';
import AdminHelpCenter from './pages/admin/AdminHelpCenter';
import AdminTickets from './pages/admin/AdminTickets';
import AdminMessages from './pages/admin/AdminMessages';
import AdminStaffMonitoring from './pages/admin/AdminStaffMonitoring';
import StaffDashboard from './pages/staff/StaffDashboard';
import StaffEvents from './pages/staff/StaffEvents';
import StaffTickets from './pages/staff/StaffTickets';
import StaffReservations from './pages/staff/StaffReservations';
import StaffAnimals from './pages/staff/StaffAnimals';
import StaffPlants from './pages/staff/StaffPlants';
import StaffHelpCenter from './pages/staff/StaffHelpCenter';
import StaffMessages from './pages/staff/StaffMessages';
import AdminLayout from './components/layout/AdminLayout';
import StaffLayout from './components/layout/StaffLayout';
import AnimalClassifier from './components/features/ai-scanner/AnimalClassifier';
import MapPage from './pages/user/Map';
import './App.css';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { isAuthenticated, user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ message: 'Please login to access this feature' }} replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user?.role)) {
        return <Navigate to="/access-denied" replace />;
    }

    return children;
};

const PublicRoute = ({ children }) => {
    const { isAuthenticated, user } = useAuth();

    if (isAuthenticated && user) {
        if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
        if (user.role === 'staff') return <Navigate to="/staff/dashboard" replace />;
        return <Navigate to="/" replace />;
    }

    return children;
};

function AppRoutes() {
    return (
        <Routes>
            {/* Public Routes - accessible to everyone */}
            <Route path="/" element={<Home />} />
            <Route path="/animals" element={<Animals />} />
            <Route path="/plants" element={<Plants />} />
            <Route path="/events" element={<Events />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/animaldex" element={<AnimalClassifier />} />
            <Route path="/map" element={<MapPage />} />

            {/* Auth Routes */}
            <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/signup" element={<PublicRoute><RegisterPage /></PublicRoute>} />
            <Route path="/auth/google/success" element={<GoogleAuthSuccess />} />
            <Route path="/admin" element={<Navigate to="/login" replace />} />
            <Route path="/admin/login" element={<Navigate to="/login" replace />} />
            <Route path="/access-denied" element={<AccessDenied />} />

            {/* Protected User Routes - requires login */}
            <Route path="/classifier" element={
                <ProtectedRoute allowedRoles={['user', 'staff']}>
                    <AnimalClassifier />
                </ProtectedRoute>
            } />
            <Route path="/reservations" element={
                <ProtectedRoute allowedRoles={['user']}>
                    <Reservations />
                </ProtectedRoute>
            } />
            <Route path="/archived-reservations" element={
                <ProtectedRoute allowedRoles={['user']}>
                    <ArchivedReservations />
                </ProtectedRoute>
            } />
            <Route path="/profile" element={
                <ProtectedRoute allowedRoles={['user', 'staff']}>
                    <UserProfile />
                </ProtectedRoute>
            } />
            <Route path="/settings" element={
                <ProtectedRoute allowedRoles={['user', 'staff']}>
                    <Settings />
                </ProtectedRoute>
            } />
            <Route path="/my-messages" element={
                <ProtectedRoute allowedRoles={['user']}>
                    <UserMessages />
                </ProtectedRoute>
            } />
            <Route path="/help" element={<Help />} />
            <Route path="/mini-zoo-game" element={<Navigate to="/" replace />} />

            {/* Admin Routes */}
            <Route path="/admin/dashboard" element={
                <ProtectedRoute allowedRoles={['admin']}>
                    <AdminLayout>
                        <AdminDashboard />
                    </AdminLayout>
                </ProtectedRoute>
            } />
            <Route path="/admin/events" element={
                <ProtectedRoute allowedRoles={['admin']}>
                    <AdminLayout>
                        <AdminEvents />
                    </AdminLayout>
                </ProtectedRoute>
            } />
            <Route path="/admin/analytics" element={
                <ProtectedRoute allowedRoles={['admin']}>
                    <AdminLayout>
                        <Analytics />
                    </AdminLayout>
                </ProtectedRoute>
            } />
            <Route path="/admin/animal-analytics" element={
                <ProtectedRoute allowedRoles={['admin']}>
                    <AdminLayout>
                        <AnimalAnalytics />
                    </AdminLayout>
                </ProtectedRoute>
            } />
            <Route path="/admin/reports" element={
                <ProtectedRoute allowedRoles={['admin']}>
                    <AdminLayout>
                        <Reports />
                    </AdminLayout>
                </ProtectedRoute>
            } />
            <Route path="/admin/staff-monitoring" element={
                <ProtectedRoute allowedRoles={['admin']}>
                    <AdminLayout>
                        <AdminStaffMonitoring />
                    </AdminLayout>
                </ProtectedRoute>
            } />
            <Route path="/admin/users" element={
                <ProtectedRoute allowedRoles={['admin']}>
                    <AdminLayout>
                        <AdminUsers />
                    </AdminLayout>
                </ProtectedRoute>
            } />
            <Route path="/admin/animals" element={
                <ProtectedRoute allowedRoles={['admin']}>
                    <AdminLayout>
                        <AdminAnimals />
                    </AdminLayout>
                </ProtectedRoute>
            } />
            <Route path="/admin/plants" element={
                <ProtectedRoute allowedRoles={['admin']}>
                    <AdminLayout>
                        <AdminPlants />
                    </AdminLayout>
                </ProtectedRoute>
            } />
            <Route path="/admin/reservations" element={
                <ProtectedRoute allowedRoles={['admin']}>
                    <AdminLayout>
                        <AdminReservations />
                    </AdminLayout>
                </ProtectedRoute>
            } />

            <Route path="/admin/profile" element={
                <ProtectedRoute allowedRoles={['admin']}>
                    <AdminLayout>
                        <AdminProfile />
                    </AdminLayout>
                </ProtectedRoute>
            } />
            <Route path="/admin/tickets" element={
                <ProtectedRoute allowedRoles={['admin']}>
                    <AdminLayout>
                        <AdminTickets />
                    </AdminLayout>
                </ProtectedRoute>
            } />
            <Route path="/admin/help" element={
                <ProtectedRoute allowedRoles={['admin']}>
                    <AdminLayout>
                        <AdminHelpCenter />
                    </AdminLayout>
                </ProtectedRoute>
            } />
            <Route path="/admin/messages" element={
                <ProtectedRoute allowedRoles={['admin']}>
                    <AdminLayout>
                        <AdminMessages />
                    </AdminLayout>
                </ProtectedRoute>
            } />

            {/* Staff Routes */}
            <Route path="/staff/dashboard" element={
                <ProtectedRoute allowedRoles={['admin', 'staff']}>
                    <StaffLayout>
                        <StaffDashboard />
                    </StaffLayout>
                </ProtectedRoute>
            } />
            <Route path="/staff/events" element={
                <ProtectedRoute allowedRoles={['admin', 'staff']}>
                    <StaffLayout>
                        <StaffEvents />
                    </StaffLayout>
                </ProtectedRoute>
            } />
            <Route path="/staff/tickets" element={
                <ProtectedRoute allowedRoles={['admin', 'staff']}>
                    <StaffLayout>
                        <StaffTickets />
                    </StaffLayout>
                </ProtectedRoute>
            } />
            <Route path="/staff/animals" element={
                <ProtectedRoute allowedRoles={['admin', 'staff']}>
                    <StaffLayout>
                        <StaffAnimals />
                    </StaffLayout>
                </ProtectedRoute>
            } />
            <Route path="/staff/plants" element={
                <ProtectedRoute allowedRoles={['admin', 'staff']}>
                    <StaffLayout>
                        <StaffPlants />
                    </StaffLayout>
                </ProtectedRoute>
            } />
            <Route path="/staff/reservations" element={
                <ProtectedRoute allowedRoles={['admin', 'staff']}>
                    <StaffLayout>
                        <StaffReservations />
                    </StaffLayout>
                </ProtectedRoute>
            } />
            <Route path="/staff/help" element={
                <ProtectedRoute allowedRoles={['admin', 'staff']}>
                    <StaffLayout>
                        <StaffHelpCenter />
                    </StaffLayout>
                </ProtectedRoute>
            } />
            <Route path="/staff/messages" element={
                <ProtectedRoute allowedRoles={['admin', 'staff']}>
                    <StaffLayout>
                        <StaffMessages />
                    </StaffLayout>
                </ProtectedRoute>
            } />

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

function App() {
    return (
        <AuthProvider>
            <Router>
                <AppRoutes />
                <ToastContainer
                    position="top-right"
                    autoClose={3000}
                    hideProgressBar={false}
                    newestOnTop
                    closeOnClick
                    pauseOnHover
                    draggable
                    theme="colored"
                />
            </Router>
        </AuthProvider>
    );
}

export default App;
