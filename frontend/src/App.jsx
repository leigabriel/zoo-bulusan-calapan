import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Home from './pages/user/Home';
import Animals from './pages/user/Animals';
import Events from './pages/user/Events';
import Tickets from './pages/user/Tickets';
import AboutUs from './pages/user/AboutUs';
import AnimalDex from './pages/user/AnimalDex';
import TicketHistory from './pages/user/TicketHistory';
import ArchivedTickets from './pages/user/ArchivedTickets';
import UserProfile from './pages/user/UserProfile';
import Settings from './pages/user/Settings';
import Help from './pages/user/Help';
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
import AdminProfile from './pages/admin/AdminProfile';
import AdminHelpCenter from './pages/admin/AdminHelpCenter';
import AdminTickets from './pages/admin/AdminTickets';
import AdminMessages from './pages/admin/AdminMessages';
import StaffDashboard from './pages/staff/StaffDashboard';
import StaffEvents from './pages/staff/StaffEvents';
import StaffTickets from './pages/staff/StaffTickets';
import StaffAnimals from './pages/staff/StaffAnimals';
import StaffUsers from './pages/staff/StaffUsers';
import StaffHelpCenter from './pages/staff/StaffHelpCenter';
import StaffMessages from './pages/staff/StaffMessages';
import TicketScanner from './pages/staff/TicketScanner';
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
        if (['staff', 'vet'].includes(user.role)) return <Navigate to="/staff/dashboard" replace />;
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
            <Route path="/events" element={<Events />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/animaldex" element={<AnimalDex />} />
            <Route path="/map" element={<MapPage />} />

            {/* Auth Routes */}
            <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/signup" element={<PublicRoute><RegisterPage /></PublicRoute>} />
            <Route path="/auth/google/success" element={<GoogleAuthSuccess />} />
            <Route path="/admin" element={<Navigate to="/login" replace />} />
            <Route path="/admin/login" element={<Navigate to="/login" replace />} />
            <Route path="/access-denied" element={<AccessDenied />} />

            {/* Protected User Routes - requires login */}
            <Route path="/tickets" element={
                <ProtectedRoute allowedRoles={['user', 'staff', 'vet']}>
                    <Tickets />
                </ProtectedRoute>
            } />
            <Route path="/classifier" element={
                <ProtectedRoute allowedRoles={['user', 'staff', 'vet']}>
                    <AnimalClassifier />
                </ProtectedRoute>
            } />
            <Route path="/my-tickets" element={
                <ProtectedRoute allowedRoles={['user']}>
                    <TicketHistory />
                </ProtectedRoute>
            } />
            <Route path="/archived-tickets" element={
                <ProtectedRoute allowedRoles={['user']}>
                    <ArchivedTickets />
                </ProtectedRoute>
            } />
            <Route path="/profile" element={
                <ProtectedRoute allowedRoles={['user', 'staff', 'vet']}>
                    <UserProfile />
                </ProtectedRoute>
            } />
            <Route path="/settings" element={
                <ProtectedRoute allowedRoles={['user', 'staff', 'vet']}>
                    <Settings />
                </ProtectedRoute>
            } />
            <Route path="/help" element={<Help />} />

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
                <ProtectedRoute allowedRoles={['admin', 'staff', 'vet']}>
                    <StaffLayout>
                        <StaffDashboard />
                    </StaffLayout>
                </ProtectedRoute>
            } />
            <Route path="/staff/events" element={
                <ProtectedRoute allowedRoles={['admin', 'staff', 'vet']}>
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
                <ProtectedRoute allowedRoles={['admin', 'staff', 'vet']}>
                    <StaffLayout>
                        <StaffAnimals />
                    </StaffLayout>
                </ProtectedRoute>
            } />
            <Route path="/staff/users" element={
                <ProtectedRoute allowedRoles={['admin', 'staff']}>
                    <StaffLayout>
                        <StaffUsers />
                    </StaffLayout>
                </ProtectedRoute>
            } />
            <Route path="/staff/scanner" element={
                <ProtectedRoute allowedRoles={['admin', 'staff']}>
                    <StaffLayout>
                        <TicketScanner />
                    </StaffLayout>
                </ProtectedRoute>
            } />
            <Route path="/staff/help" element={
                <ProtectedRoute allowedRoles={['admin', 'staff', 'vet']}>
                    <StaffLayout>
                        <StaffHelpCenter />
                    </StaffLayout>
                </ProtectedRoute>
            } />
            <Route path="/staff/messages" element={
                <ProtectedRoute allowedRoles={['admin', 'staff', 'vet']}>
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
            </Router>
        </AuthProvider>
    );
}

export default App;
