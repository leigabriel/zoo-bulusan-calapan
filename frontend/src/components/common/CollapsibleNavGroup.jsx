import { Link } from 'react-router-dom';
import { ChevronDown } from 'reicon-react';
import Tooltip from './Tooltip';

const CollapsibleNavGroup = ({ label, items, open, onToggle, pathname, onNavigate, Icon, collapsed }) => (
    <section className="mb-2">
        <button
            type="button"
            onClick={onToggle}
            className={`flex w-full items-center rounded-lg py-2 text-xs font-semibold uppercase tracking-wider text-gray-900 transition hover:bg-gray-100 hover:text-gray-800 ${collapsed ? 'justify-center px-2' : 'justify-between px-3'}`}
            aria-expanded={open}
            title={collapsed ? label : undefined}
        >
            <span className="flex items-center gap-2">
                {Icon && <Icon size={14} />}
                {!collapsed && label}
            </span>
            {!collapsed && (
                <ChevronDown size={16} className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
            )}
        </button>
        <div className={`grid transition-[grid-template-rows,opacity] duration-200 ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-70'}`}>
            <div className="overflow-hidden">
                <div className="pt-1">
                    {items.map((item) => {
                        const active = pathname === item.path;
                        const badge = item.badge || 0;
                        const linkContent = (
                            <span
                                className={`group mb-1 flex items-center rounded-xl transition-all duration-200 ${collapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2.5'} ${active
                                    ? 'border-l-2 border-green-400 bg-green-50 text-green-700'
                                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                    }`}
                            >
                                <span className={`transition-colors shrink-0 ${active ? 'text-green-600' : 'text-gray-400 group-hover:text-gray-900'}`}>
                                    <item.Icon />
                                </span>
                                {!collapsed && (
                                    <>
                                        <span className="font-medium flex-1">{item.label}</span>
                                        {badge > 0 && (
                                            <span className="min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                                {badge > 99 ? '99+' : badge}
                                            </span>
                                        )}
                                    </>
                                )}
                                {collapsed && badge > 0 && (
                                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
                                )}
                            </span>
                        );

                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => onNavigate(item.path)}
                                className="relative block"
                                aria-current={active ? 'page' : undefined}
                            >
                                {collapsed ? (
                                    <Tooltip label={item.label}>
                                        {linkContent}
                                    </Tooltip>
                                ) : linkContent}
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    </section>
);

export default CollapsibleNavGroup;
