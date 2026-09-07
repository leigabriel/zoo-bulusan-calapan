const positionClasses = {
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
};

const Tooltip = ({ label, children, position = 'bottom' }) => (
    <span className="relative inline-flex group">
        {children}
        <span className={`pointer-events-none absolute z-[70] whitespace-nowrap rounded-lg bg-gray-900 text-white text-xs font-medium px-2.5 py-1.5 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150 ${positionClasses[position] || positionClasses.bottom}`}>
            {label}
        </span>
    </span>
);

export default Tooltip;
