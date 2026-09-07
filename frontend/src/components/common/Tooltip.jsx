const Tooltip = ({ label, children }) => (
    <span className="relative inline-flex group">
        {children}
        <span className="pointer-events-none absolute top-full left-1/2 -translate-x-1/2 z-[70] mt-2 whitespace-nowrap rounded-lg bg-gray-900 text-white text-xs font-medium px-2.5 py-1.5 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150">
            {label}
        </span>
    </span>
);

export default Tooltip;