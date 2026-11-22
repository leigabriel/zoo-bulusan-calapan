import { Link } from 'react-router-dom';
import ErrorPage from './ErrorPage';
import usePageMetadata from '../../hooks/use-page-metadata';

const NotFound = () => {
    usePageMetadata(
        'Page Not Found | Bulusan Zoo',
        'The page you are looking for does not exist. Browse the animals, plants and events at Bulusan Zoo in Calapan City.',
        'https://bulusanzoo.com/404'
    );

    return (
        <ErrorPage
            code="404"
            title="Page not found"
            description="The page you are looking for doesn't exist or may have been moved."
        >
            <Link
                to="/"
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-black px-7 py-3 text-[11px] font-bold uppercase tracking-widest text-white transition-colors hover:bg-gray-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black"
            >
                Back to home
            </Link>
            <Link
                to="/events"
                className="inline-flex min-h-12 items-center justify-center rounded-full border-2 border-black px-7 py-3 text-[11px] font-bold uppercase tracking-widest text-black transition-colors hover:bg-black hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black"
            >
                Browse events
            </Link>
        </ErrorPage>
    );
};

export default NotFound;
