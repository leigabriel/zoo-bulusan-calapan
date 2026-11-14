import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect, lazy, Suspense } from 'react';
import { GooeyToaster } from 'goey-toast';
import 'goey-toast/styles.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import PostUploadProvider from './context/PostUploadContext';
import Home from './pages/user/Home';
import CookieConsentBanner from './components/CookieConsentBanner';
import SessionExpiryListener from './components/auth/SessionExpiryListener';
import './App.css';
import { trackVisit } from './services/visitor-tracking';

// Every page is loaded on demand so visitors only download the code for the route they open.
// Admin, staff and the TensorFlow-based scanner no longer ship with the public pages.
const Animals = lazy(() => import('./pages/user/Animals'));
const Plants = lazy(() => import('./pages/user/Plants'));
const AnimalDetail = lazy(() => import('./pages/user/CollectionDetail').then((m) => ({ default: m.AnimalDetail })));
const PlantDetail = lazy(() => import('./pages/user/CollectionDetail').then((m) => ({ default: m.PlantDetail })));
const WildlifeOriginDetail = lazy(() => import('./pages/user/WildlifeOriginDetail'));
const Events = lazy(() => import('./pages/user/Events'));
const Reservations = lazy(() => import('./pages/user/Reservations'));
const AboutUs = lazy(() => import('./pages/user/AboutUs'));
const ArchivedReservations = lazy(() => import('./pages/user/ArchivedReservations'));
const UserProfile = lazy(() => import('./pages/user/UserProfile'));
const Settings = lazy(() => import('./pages/user/Settings'));
const Help = lazy(() => import('./pages/user/Help'));
const UserMessages = lazy(() => import('./pages/user/UserMessages'));
const CommunityPage = lazy(() => import('./pages/user/CommunityPage'));
const PublicUserProfile = lazy(() => import('./pages/user/PublicUserProfile'));
const MyEvents = lazy(() => import('./pages/user/MyEvents'));
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const GoogleAuthSuccess = lazy(() => import('./pages/auth/GoogleAuthSuccess'));
const AccessDenied = lazy(() => import('./pages/auth/AccessDenied'));
const PrivacyPolicy = lazy(() => import('./pages/legal/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./pages/legal/TermsOfService'));
const CookiePolicy = lazy(() => import('./pages/legal/CookiePolicy'));
const RefundPolicy = lazy(() => import('./pages/legal/RefundPolicy'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminEvents = lazy(() => import('./pages/admin/AdminEvents'));
const Analytics = lazy(() => import('./pages/admin/Analytics'));
const Reports = lazy(() => import('./pages/admin/Reports'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminAnimals = lazy(() => import('./pages/admin/AdminAnimals'));
const AdminPlants = lazy(() => import('./pages/admin/AdminPlants'));
const AdminReservations = lazy(() => import('./pages/admin/AdminReservations'));
const AdminTransactions = lazy(() => import('./pages/admin/AdminTransactions'));
const AdminProfile = lazy(() => import('./pages/admin/AdminProfile'));
const AdminHelpCenter = lazy(() => import('./pages/admin/AdminHelpCenter'));
const AdminTickets = lazy(() => import('./pages/admin/AdminTickets'));
const AdminMessages = lazy(() => import('./pages/admin/AdminMessages'));
const AdminLogs = lazy(() => import('./pages/admin/AdminLogs'));
const AdminCommunityModeration = lazy(() => import('./pages/admin/AdminCommunityModeration'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'));
const AdminTrash = lazy(() => import('./pages/admin/AdminTrash'));
const StaffDashboard = lazy(() => import('./pages/staff/StaffDashboard'));
const QRScanner = lazy(() => import('./pages/staff/QRScanner'));
const StaffEvents = lazy(() => import('./pages/staff/StaffEvents'));
const StaffTickets = lazy(() => import('./pages/staff/StaffTickets'));
const StaffReservations = lazy(() => import('./pages/staff/StaffReservations'));
const StaffAnimals = lazy(() => import('./pages/staff/StaffAnimals'));
const StaffPlants = lazy(() => import('./pages/staff/StaffPlants'));
const StaffHelpCenter = lazy(() => import('./pages/staff/StaffHelpCenter'));
const StaffMessages = lazy(() => import('./pages/staff/StaffMessages'));
const StaffCommunityModeration = lazy(() => import('./pages/staff/StaffCommunityModeration'));
const StaffTrash = lazy(() => import('./pages/staff/StaffTrash'));
const StaffWalkIn = lazy(() => import('./pages/staff/StaffWalkIn'));
const WalkInRecords = lazy(() => import('./pages/staff/WalkInRecords'));
const AdminLayout = lazy(() => import('./components/layout/AdminLayout'));
const StaffLayout = lazy(() => import('./components/layout/StaffLayout'));
const AnimalClassifier = lazy(() => import('./components/features/ai-scanner/AnimalClassifier'));
const AIAssist = lazy(() => import('./pages/AIAssist'));

const RouteFallback = () => (
    <div className="flex min-h-dvh items-center justify-center bg-white" role="status" aria-label="Loading page">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-black" />
    </div>
);

const MapPage = lazy(() => import('./pages/user/Map'));
const MapPageFallback = () => (
    <div className="flex items-center justify-center h-screen bg-[#eef3ed]">
        <div className="flex flex-col items-center gap-6">
            <div className="w-12 h-12 border-4 border-[#d5e1d5] border-t-[#1f3328] rounded-full animate-spin" />
            <p className="text-[#1f3328] font-bold text-[10px] uppercase tracking-[0.3em] animate-pulse">Synchronizing Globe...</p>
        </div>
    </div>
);

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
        return <Navigate to="/login" state={{ message: 'Please sign in to continue.', tone: 'info' }} replace />;
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

const VisitTracker = () => {
    const location = useLocation();

    useEffect(() => {
        if (location.pathname.startsWith('/admin') || location.pathname.startsWith('/staff') || location.pathname.startsWith('/auth/')) return;
        trackVisit(location.pathname);
    }, [location.pathname]);

    return null;
};

function AppRoutes() {
    return (
        <Suspense fallback={<RouteFallback />}>
        <Routes>
            {/* Public Routes - accessible to everyone */}
            <Route path="/" element={<Home />} />
            <Route path="/animals" element={<Animals />} />
            <Route path="/animals/:id" element={<AnimalDetail />} />
            <Route path="/plants" element={<Plants />} />
            <Route path="/plants/:id" element={<PlantDetail />} />
            <Route path="/events" element={<Events />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/animaldex" element={<AnimalClassifier />} />
            <Route path="/map" element={<Suspense fallback={<MapPageFallback />}><MapPage /></Suspense>} />
            <Route path="/map/animals/:id" element={<WildlifeOriginDetail />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/cookies" element={<CookiePolicy />} />
            <Route path="/refund-policy" element={<RefundPolicy />} />

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
            <Route path="/my-events" element={
                <ProtectedRoute allowedRoles={['user']}>
                    <MyEvents />
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
            <Route path="/community" element={<CommunityPage />} />
            <Route path="/community/users/:userId" element={
                <ProtectedRoute allowedRoles={['user', 'staff', 'admin']}>
                    <PublicUserProfile />
                </ProtectedRoute>
            } />
            <Route path="/mini-zoo-game" element={<Navigate to="/" replace />} />

            {/* Admin Routes */}
            <Route path="/admin/dashboard" element={
                <ProtectedRoute allowedRoles={['admin']}>
                    <AdminLayout>
                        <AdminDashboard />
                    </AdminLayout>
                </ProtectedRoute>
            } />
            <Route path="/admin/ai-assist" element={
                <ProtectedRoute allowedRoles={['admin']}>
                    <AdminLayout>
                        <AIAssist role="admin" />
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

            <Route path="/admin/reports" element={
                <ProtectedRoute allowedRoles={['admin']}>
                    <AdminLayout>
                        <Reports />
                    </AdminLayout>
                </ProtectedRoute>
            } />
            <Route path="/admin/logs" element={
                <ProtectedRoute allowedRoles={['admin']}>
                    <AdminLayout>
                        <AdminLogs />
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
            <Route path="/admin/transactions" element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout><AdminTransactions /></AdminLayout></ProtectedRoute>} />
            <Route path="/admin/walk-in-records" element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout><WalkInRecords /></AdminLayout></ProtectedRoute>} />

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
            <Route path="/admin/community-moderation" element={
                <ProtectedRoute allowedRoles={['admin']}>
                    <AdminLayout>
                        <AdminCommunityModeration />
                    </AdminLayout>
                </ProtectedRoute>
            } />
            <Route path="/admin/settings" element={
                <ProtectedRoute allowedRoles={['admin']}>
                    <AdminLayout>
                        <AdminSettings />
                    </AdminLayout>
                </ProtectedRoute>
            } />
            <Route path="/admin/trash" element={
                <ProtectedRoute allowedRoles={['admin']}>
                    <AdminLayout>
                        <AdminTrash />
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
            <Route path="/staff/walk-in" element={
                <ProtectedRoute allowedRoles={['admin', 'staff']}>
                    <StaffLayout><StaffWalkIn /></StaffLayout>
                </ProtectedRoute>
            } />
            <Route path="/staff/walk-in-records" element={
                <ProtectedRoute allowedRoles={['admin', 'staff']}>
                    <StaffLayout><WalkInRecords /></StaffLayout>
                </ProtectedRoute>
            } />
            <Route path="/staff/ai-assist" element={
                <ProtectedRoute allowedRoles={['admin', 'staff']}>
                    <StaffLayout>
                        <AIAssist role="staff" />
                    </StaffLayout>
                </ProtectedRoute>
            } />
            <Route path="/staff/qr-scanner" element={
                <ProtectedRoute allowedRoles={['admin', 'staff']}>
                    <StaffLayout>
                        <QRScanner />
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
            <Route path="/staff/community-moderation" element={
                <ProtectedRoute allowedRoles={['admin', 'staff']}>
                    <StaffLayout>
                        <StaffCommunityModeration />
                    </StaffLayout>
                </ProtectedRoute>
            } />
            <Route path="/staff/trash" element={
                <ProtectedRoute allowedRoles={['admin', 'staff']}>
                    <StaffLayout>
                        <StaffTrash />
                    </StaffLayout>
                </ProtectedRoute>
            } />

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
    );
}

function App() {
    return (
        <AuthProvider>
            {/* Sits outside the Router so an in-flight community post survives navigation:
                unmounting a page must not abort an upload the visitor already started. */}
            <PostUploadProvider>
                <Router>
                    <VisitTracker />
                <SessionExpiryListener />
                    <AppRoutes />
                    <CookieConsentBanner />
                    <GooeyToaster
                        position="top-right"
                        duration={3000}
                        closeButton="top-right"
                        showTimestamp={false}
                        visibleToasts={3}
                        maxQueue={8}
                        theme="dark"
                    />
                </Router>
            </PostUploadProvider>
        </AuthProvider>
    );
}

export default App;
