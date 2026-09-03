import { Link } from 'react-router-dom';

const CollapsibleNavGroup = ({ label, items, open, onToggle, pathname, onNavigate }) => (
    <section className="mb-2">
        <button
            type="button"
            onClick={onToggle}
            className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
            aria-expanded={open}
        >
            <span>{label}</span>
            <svg className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="m6 9 6 6 6-6" />
            </svg>
        </button>
        <div className={`grid transition-[grid-template-rows,opacity] duration-200 ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-70'}`}>
            <div className="overflow-hidden">
                <div className="pt-1">
                    {items.map((item) => {
                        const active = pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={onNavigate}
                                className={`group mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 ${active
                                    ? 'border-l-2 border-green-500 bg-green-50 text-green-700'
                                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                    }`}
                                aria-current={active ? 'page' : undefined}
                            >
                                <span className={`transition-colors ${active ? 'text-green-600' : 'text-gray-400 group-hover:text-gray-900'}`}>
                                    <item.Icon />
                                </span>
                                <span className="font-medium">{item.label}</span>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    </section>
);

export default CollapsibleNavGroup;
