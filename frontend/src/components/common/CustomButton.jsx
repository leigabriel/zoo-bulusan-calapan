const CustomButton = ({ 
    children, 
    variant = 'primary', 
    size = 'md', 
    className = '', 
    disabled = false,
    loading = false,
    onClick,
    type = 'button',
    ...props 
}) => {
    const baseStyles = 'font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-2';
    
    const variants = {
        primary: 'bg-gradient-to-r from-green-600 to-teal-600 text-white hover:opacity-90 shadow-md hover:shadow-lg',
        secondary: 'bg-white text-green-700 border border-green-300 hover:bg-green-50',
        danger: 'bg-red-500 text-white hover:bg-red-600',
        ghost: 'bg-transparent text-green-700 hover:bg-green-50'
    };

    const sizes = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-5 py-2.5 text-base',
        lg: 'px-6 py-3 text-lg'
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled || loading}
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className} ${
                (disabled || loading) ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            {...props}
        >
            {loading && (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
            )}
            {children}
        </button>
    );
};

export default CustomButton;
