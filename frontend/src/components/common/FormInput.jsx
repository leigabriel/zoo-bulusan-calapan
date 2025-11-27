const FormInput = ({
    label,
    type = 'text',
    name,
    value,
    onChange,
    placeholder,
    error,
    required = false,
    disabled = false,
    className = '',
    ...props
}) => {
    return (
        <div className={`mb-4 ${className}`}>
            {label && (
                <label 
                    htmlFor={name} 
                    className="block text-gray-700 font-medium mb-2"
                >
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            <input
                type={type}
                id={name}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                required={required}
                disabled={disabled}
                className={`w-full p-3 border rounded-xl outline-none transition
                    ${error 
                        ? 'border-red-500 focus:ring-2 focus:ring-red-200' 
                        : 'border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200'
                    }
                    ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
                `}
                {...props}
            />
            {error && (
                <p className="text-red-500 text-sm mt-1">{error}</p>
            )}
        </div>
    );
};

export default FormInput;
