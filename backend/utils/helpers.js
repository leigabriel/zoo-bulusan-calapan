exports.generateTicketCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 12; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
};

// format date to yyyy-mm-dd
exports.formatDate = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

exports.formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP'
    }).format(amount);
};

exports.paginate = (page = 1, limit = 10) => {
    const offset = (page - 1) * limit;
    return { limit, offset };
};

exports.successResponse = (res, data, message = 'Success', statusCode = 200) => {
    return res.status(statusCode).json({
        success: true,
        message,
        ...data
    });
};

exports.errorResponse = (res, message = 'Error', statusCode = 500) => {
    return res.status(statusCode).json({
        success: false,
        message
    });
};

// strips markdown decoration so AI replies render as clean plain text
exports.sanitizePlainText = (text) => {
    if (!text) return '';

    return String(text)
        .replace(/```[\s\S]*?```/g, '')
        .replace(/(?<![\w*])\*\*([^*\n]+)\*\*(?![\w*])/g, '$1')
        .replace(/\*\*/g, '')
        .replace(/(?<![\w*])\*([^*\n]+)\*(?![\w*])/g, '$1')
        .replace(/(?<![\w_])__([^_\n]+)__(?![\w_])/g, '$1')
        .replace(/(?<![\w_])_([^_\n]+)_(?![\w_])/g, '$1')
        .replace(/~~([^~\n]+)~~/g, '$1')
        .replace(/`([^`\n]+)`/g, '$1')
        .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
        .replace(/^#{1,6}[ \t]+/gm, '')
        .replace(/^[ \t]*>[ \t]?/gm, '')
        .replace(/^[ \t]*[*•●○][ \t]+/gm, '- ')
        .replace(/\p{Extended_Pictographic}/gu, '')
        .replace(/\r\n/g, '\n')
        .replace(/[ \t]+\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
};