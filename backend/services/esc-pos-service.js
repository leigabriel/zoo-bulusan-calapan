const cleanAscii = value => String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E\n]/g, '?');

const money = (cents, currency = 'PHP') => `${currency} ${(Number(cents || 0) / 100).toFixed(2)}`;
const fit = (left, right, width = 32) => {
    const safeLeft = cleanAscii(left);
    const safeRight = cleanAscii(right);
    const available = Math.max(width - safeRight.length - 1, 1);
    return `${safeLeft.slice(0, available).padEnd(available)} ${safeRight.slice(0, width)}`;
};
const center = (value, width = 32) => {
    const text = cleanAscii(value).slice(0, width);
    return text.padStart(text.length + Math.max(Math.floor((width - text.length) / 2), 0));
};

const encodeReceipt = (receipt, { reprint = false } = {}) => {
    const width = 32;
    const separator = '-'.repeat(width);
    const lines = [];
    if (reprint) lines.push(center('*** REPRINT ***'), '');
    lines.push(center(receipt.organizationName));
    if (receipt.address) lines.push(center(receipt.address));
    if (receipt.contact) lines.push(center(receipt.contact));
    lines.push(separator, fit('Receipt', receipt.receiptNumber));
    lines.push(fit('Date', new Date(receipt.createdAt).toLocaleString('en-PH')));
    lines.push(fit('Visit', receipt.visitDate), fit('Staff', receipt.staffName));
    if (receipt.visitorName) lines.push(fit('Visitor', receipt.visitorName));
    lines.push(separator);
    for (const item of receipt.items || []) {
        lines.push(`${item.quantity} x ${cleanAscii(item.categoryLabel)}`.slice(0, width));
        lines.push(fit(`  @ ${money(item.unitPriceCents, receipt.currency)}`, money(item.lineTotalCents, receipt.currency)));
        if (Number(item.discountCents) > 0) lines.push(fit('  Discount', `-${money(item.discountCents, receipt.currency)}`));
    }
    lines.push(separator, fit('Subtotal', money(receipt.subtotalCents, receipt.currency)));
    if (Number(receipt.discountCents) > 0) lines.push(fit('Discount', `-${money(receipt.discountCents, receipt.currency)}`));
    lines.push(fit('TOTAL', money(receipt.totalCents, receipt.currency)));
    lines.push(fit('Received', money(receipt.payment?.amountReceivedCents, receipt.currency)));
    lines.push(fit('Change', money(receipt.payment?.changeCents, receipt.currency)));
    lines.push(fit('Payment', `${receipt.payment?.methodLabel || receipt.payment?.method} / ${receipt.payment?.status}`));
    lines.push(separator);
    if (receipt.qrData) lines.push(center(receipt.qrData));
    if (receipt.policyNote) lines.push('', center(receipt.policyNote));
    lines.push('', '', '', '');
    return Buffer.concat([Buffer.from([0x1b, 0x40]), Buffer.from(`${lines.join('\n')}\n`, 'ascii')]);
};

module.exports = { encodeReceipt };
