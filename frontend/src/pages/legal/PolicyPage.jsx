import { useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import usePolicies from '../../hooks/use-policies';

const POLICY_LINKS = [
    { path: '/privacy', slug: 'privacy', label: 'Privacy Policy' },
    { path: '/terms', slug: 'terms', label: 'Terms of Service' },
    { path: '/cookies', slug: 'cookies', label: 'Cookie Policy' },
    { path: '/refund-policy', slug: 'refund', label: 'Refund Policy' },
];

const formatContent = (content) => {
    const lines = content.trim().split('\n');
    const blocks = [];
    let current = null;

    const pushCurrent = () => {
        if (current) {
            blocks.push(current);
            current = null;
        }
    };

    for (const line of lines) {
        const trimmed = line.trim();

        if (!trimmed) {
            pushCurrent();
            continue;
        }

        const headingMatch = trimmed.match(/^#{1,6}\s+(.+)$/);

        if (headingMatch) {
            pushCurrent();

            blocks.push({
                type: 'heading',
                text: headingMatch[1],
            });

            continue;
        }

        const numberedHeadingMatch = trimmed.match(/^\d+\.\s+(.+)$/);

        if (numberedHeadingMatch) {
            pushCurrent();

            blocks.push({
                type: 'heading',
                text: numberedHeadingMatch[0],
            });

            continue;
        }

        const listMatch = trimmed.match(/^[-*]\s+(.+)$/);

        if (listMatch) {
            if (!current || current.type !== 'list') {
                pushCurrent();

                current = {
                    type: 'list',
                    items: [],
                };
            }

            current.items.push(listMatch[1]);
            continue;
        }

        if (/^(Last Updated|Email:|Address:|Phone:)/i.test(trimmed)) {
            pushCurrent();

            blocks.push({
                type: 'meta',
                text: trimmed,
            });

            continue;
        }

        if (!current || current.type !== 'paragraph') {
            pushCurrent();

            current = {
                type: 'paragraph',
                text: trimmed,
            };
        } else {
            current.text += ' ' + trimmed;
        }
    }

    pushCurrent();

    return blocks;
};

const PolicyPage = ({ slug }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { policies, loading, error, retry } = usePolicies();

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'instant' });
    }, [slug]);

    const policy = policies?.[slug];
    // The label from the link list keeps the heading stable while the stored
    // title is still loading instead of flashing an empty page.
    const fallbackTitle = POLICY_LINKS.find((link) => link.slug === slug)?.label || 'Policy';
    const title = policy?.title || fallbackTitle;
    const lastUpdated = policy?.lastUpdated
        ? (/^last updated/i.test(policy.lastUpdated) ? policy.lastUpdated : `Last Updated: ${policy.lastUpdated}`)
        : '';
    const blocks = policy ? formatContent(policy.content) : [];

    const handleBack = () => {
        if (location.key === 'default') {
            navigate('/');
        } else {
            navigate(-1);
        }
    };

    return (
        <div className="min-h-screen bg-white">
            <div className="border-b border-gray-100">
                <div className="max-w-3xl mx-auto px-6 md:px-8 py-5">
                    <button
                        onClick={handleBack}
                        className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M15 19l-7-7 7-7"
                            />
                        </svg>
                        Back
                    </button>
                </div>
            </div>

            <main className="max-w-3xl mx-auto px-6 md:px-8 py-14 md:py-20">
                <p className="text-xs uppercase tracking-[0.2em] font-medium text-gray-400 mb-4">
                    Bulusan Zoo &amp; Wildlife Park
                </p>

                <h1 className="text-3xl md:text-4xl font-semibold text-gray-900 tracking-tight mb-3">
                    {title}
                </h1>

                {lastUpdated && (
                    <p className="text-sm text-gray-500 mb-6">
                        {lastUpdated}
                    </p>
                )}

                <nav
                    aria-label="Other policies"
                    className="flex flex-wrap mb-12 pb-8 border-b border-gray-100"
                >
                    {POLICY_LINKS.map((link, idx) => {
                        const isActive = location.pathname === link.path;

                        return (
                            <Link
                                key={link.path}
                                to={link.path}
                                aria-current={isActive ? 'page' : undefined}
                                className={`text-sm px-4 py-1 first:pl-0 ${idx !== 0
                                        ? 'border-l border-gray-200'
                                        : ''
                                    } ${isActive
                                        ? 'text-gray-900 font-medium'
                                        : 'text-gray-500 hover:text-gray-900 transition-colors'
                                    }`}
                            >
                                {link.label}
                            </Link>
                        );
                    })}
                </nav>

                {loading ? (
                    <div className="space-y-4" aria-live="polite" aria-busy="true">
                        <span className="sr-only">Loading policy content...</span>
                        <div className="h-4 w-3/4 rounded bg-gray-100 animate-pulse" />
                        <div className="h-4 w-full rounded bg-gray-100 animate-pulse" />
                        <div className="h-4 w-5/6 rounded bg-gray-100 animate-pulse" />
                        <div className="h-4 w-2/3 rounded bg-gray-100 animate-pulse" />
                        <div className="h-4 w-full rounded bg-gray-100 animate-pulse" />
                        <div className="h-4 w-4/5 rounded bg-gray-100 animate-pulse" />
                    </div>
                ) : error ? (
                    <div role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                        <p className="font-semibold text-amber-900">Policy content could not be loaded.</p>
                        <p className="mt-1 text-sm leading-6 text-amber-800">
                            Check your connection and try again. The rest of the website is still available.
                        </p>
                        <button
                            type="button"
                            onClick={retry}
                            className="mt-4 rounded-xl bg-amber-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-950"
                        >
                            Try again
                        </button>
                    </div>
                ) : !policy ? (
                    <p className="text-[15px] text-gray-700">
                        This policy is not published yet. Please check back later.
                    </p>
                ) : (
                    <div className="max-w-none">
                        {blocks.map((block, idx) => {
                            if (block.type === 'heading') {
                                return (
                                    <h2
                                        key={idx}
                                        className="mt-10 first:mt-0 text-lg md:text-xl font-semibold text-gray-900 tracking-tight leading-snug"
                                    >
                                        {block.text}
                                    </h2>
                                );
                            }

                            if (block.type === 'list') {
                                return (
                                    <ul
                                        key={idx}
                                        className="mt-4 mb-6 ml-1 pl-6 list-disc marker:text-gray-400 space-y-2 text-[15px] text-gray-700 leading-7"
                                    >
                                        {block.items.map((item, i) => (
                                            <li key={i} className="pl-1">
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                );
                            }

                            if (block.type === 'meta') {
                                return (
                                    <p
                                        key={idx}
                                        className="mt-4 text-[15px] text-gray-800 font-medium"
                                    >
                                        {block.text}
                                    </p>
                                );
                            }

                            return (
                                <p
                                    key={idx}
                                    className="mt-4 text-[15px] text-gray-700 leading-[1.75]"
                                >
                                    {block.text}
                                </p>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
};

export default PolicyPage;