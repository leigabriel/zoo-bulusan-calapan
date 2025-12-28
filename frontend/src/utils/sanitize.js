/**
 * Input sanitization utilities to prevent XSS and injection attacks
 * 
 * IMPORTANT: These functions are designed for two use cases:
 * 1. LIVE TYPING: Use without trim (default) - allows spaces during typing
 * 2. SUBMISSION/BLUR: Use with trim=true - cleans up whitespace
 */

/**
 * Sanitizes a string by removing potentially dangerous characters and scripts
 * @param {string} input - The input string to sanitize
 * @param {boolean} trimWhitespace - Whether to trim whitespace (use false during typing, true on submit)
 * @returns {string} - The sanitized string
 */
export const sanitizeInput = (input, trimWhitespace = false) => {
    if (typeof input !== 'string') return input;
    
    let sanitized = input
        .replace(/[<>]/g, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .replace(/data:/gi, '');
    
    return trimWhitespace ? sanitized.trim() : sanitized;
};

/**
 * Sanitizes HTML content by escaping special characters
 * @param {string} html - The HTML string to escape
 * @returns {string} - The escaped string
 */
export const escapeHtml = (html) => {
    if (typeof html !== 'string') return html;
    
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    
    return html.replace(/[&<>"']/g, (m) => map[m]);
};

/**
 * Validates and sanitizes email input
 * @param {string} email - The email to validate
 * @param {boolean} trimWhitespace - Whether to trim whitespace (use false during typing, true on submit)
 * @returns {string} - The sanitized email
 */
export const sanitizeEmail = (email, trimWhitespace = false) => {
    if (typeof email !== 'string') return '';
    let sanitized = email.toLowerCase().replace(/[<>]/g, '');
    return trimWhitespace ? sanitized.trim() : sanitized;
};

/**
 * Validates and sanitizes phone number input
 * @param {string} phone - The phone number to sanitize
 * @param {boolean} trimWhitespace - Whether to trim whitespace (use false during typing, true on submit)
 * @returns {string} - The sanitized phone number
 */
export const sanitizePhone = (phone, trimWhitespace = false) => {
    if (typeof phone !== 'string') return '';
    let sanitized = phone.replace(/[^0-9+\-\s()]/g, '');
    return trimWhitespace ? sanitized.trim() : sanitized;
};

/**
 * Sanitizes all inputs before submission (with trimming)
 * Use this on form submit to clean up all values
 * @param {object} formData - Object with form field values
 * @returns {object} - Object with sanitized and trimmed values
 */
export const sanitizeFormData = (formData) => {
    const sanitized = {};
    for (const [key, value] of Object.entries(formData)) {
        if (typeof value === 'string') {
            sanitized[key] = sanitizeInput(value, true);
        } else {
            sanitized[key] = value;
        }
    }
    return sanitized;
};

/**
 * Creates a safe onChange handler that sanitizes input (without trimming for live typing)
 * @param {function} setter - The state setter function
 * @param {string} sanitizer - The sanitizer type: 'text', 'email', 'phone'
 * @returns {function} - The wrapped onChange handler
 */
export const createSafeHandler = (setter, sanitizer = 'text') => {
    return (e) => {
        let value = e.target.value;
        
        switch (sanitizer) {
            case 'email':
                value = sanitizeEmail(value, false);
                break;
            case 'phone':
                value = sanitizePhone(value, false);
                break;
            default:
                value = sanitizeInput(value, false);
        }
        
        setter(value);
    };
};

export default { sanitizeInput, escapeHtml, sanitizeEmail, sanitizePhone, sanitizeFormData, createSafeHandler };
