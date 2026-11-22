import { Link } from 'react-router-dom';
import ErrorPage from './ErrorPage';
import { useAuth } from '../../context/AuthContext';
import usePageMetadata from '../../hooks/use-page-metadata';

const Forbidden = () => {
    const { user, role } = useAuth();

    usePageMetadata(
        'Access Denied | Bulusan Zoo',
        'You do not have permission to view this page.',
        'https://bulusanzoo.com/403'
    );

    const dashboardPath = role === 'admin'
        ? '/admin/dashboard'
        : role === 'staff'
            ? '/staff/dashboard'
            : '/';

    return (
        <ErrorPage
            code="403"
            title="Access denied"
            description={user
                ? "This page isn't available for your account. Use the button below to continue."
                : 'You need to sign in with an account that has permission to view this page.'}
        >
            <Link
                to={user ? dashboardPath : '/login'}
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-black px-7 py-3 text-[11px] font-bold uppercase tracking-widest text-white transition-colors hover:bg-gray-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black"
            >
                {user ? 'Go to dashboard' : 'Log in'}
            </Link>
            <Link
                to="/"
                className="inline-flex min-h-12 items-center justify-center rounded-full border-2 border-black px-7 py-3 text-[11px] font-bold uppercase tracking-widest text-black transition-colors hover:bg-black hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black"
            >
                Back to home
            </Link>
        </ErrorPage>
    );
};

export default Forbidden;
