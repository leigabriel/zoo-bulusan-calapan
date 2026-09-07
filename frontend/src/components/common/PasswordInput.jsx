import { useState } from 'react';
import { Eye, EyeSlash } from 'reicon-react';

const PasswordInput = ({ className = '', ...props }) => {
    const [visible, setVisible] = useState(false);

    return (
        <div className="relative">
            <input
                type={visible ? 'text' : 'password'}
                className={`w-full pr-11 ${className}`}
                {...props}
            />
            <button
                type="button"
                onClick={() => setVisible((v) => !v)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label={visible ? 'Hide password' : 'Show password'}
                tabIndex={-1}
            >
                {visible ? <EyeSlash size={18} /> : <Eye size={18} />}
            </button>
        </div>
    );
};

export default PasswordInput;
