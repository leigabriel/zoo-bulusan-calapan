import { useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';

const POLICY_LINKS = [
    { path: '/privacy', label: 'Privacy Policy' },
    { path: '/terms', label: 'Terms of Service' },
    { path: '/cookies', label: 'Cookie Policy' },
    { path: '/refund-policy', label: 'Refund Policy' },
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

const PolicyPage = ({ title, lastUpdated, content, children }) => {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'instant' });
    }, []);

    const blocks = children ? null : formatContent(content);

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

                {children ? (
                    children
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