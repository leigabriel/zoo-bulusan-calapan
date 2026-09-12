const ESC = 0x1b;
const GS = 0x1d;

const ascii = value => String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E\n]/g, '?');

const money = (cents, currency = 'PHP') => `${currency} ${(Number(cents || 0) / 100).toFixed(2)}`;
const fit = (left, right, width) => {
    const safeLeft = ascii(left);
    const safeRight = ascii(right);
    const available = Math.max(width - safeRight.length - 1, 1);
    return `${safeLeft.slice(0, available).padEnd(available)} ${safeRight.slice(0, width)}`;
};
const center = (value, width) => {
    const text = ascii(value).slice(0, width);
    return text.padStart(text.length + Math.max(Math.floor((width - text.length) / 2), 0));
};

export const encodeEscPosReceipt = (receipt, { paperWidth = '58mm', reprint = false, cut = true } = {}) => {
    if (!receipt) throw new Error('Receipt data is required.');
    const columns = paperWidth === '80mm' ? 48 : 32;
    const separator = '-'.repeat(columns);
    const lines = [];
    if (reprint) lines.push(center('*** REPRINT ***', columns), '');
    lines.push(center(receipt.organizationName, columns));
    if (receipt.address) lines.push(center(receipt.address, columns));
    if (receipt.contact) lines.push(center(receipt.contact, columns));
    lines.push(separator);
    lines.push(fit('Receipt', receipt.receiptNumber, columns));
    lines.push(fit('Date', new Date(receipt.createdAt).toLocaleString(), columns));
    lines.push(fit('Visit', receipt.visitDate, columns));
    lines.push(fit('Staff', receipt.staffName, columns));
    if (receipt.visitorName) lines.push(fit('Visitor', receipt.visitorName, columns));
    lines.push(separator);
    for (const item of receipt.items || []) {
        lines.push(`${item.quantity} x ${ascii(item.categoryLabel)}`.slice(0, columns));
        lines.push(fit(`  @ ${money(item.unitPriceCents, receipt.currency)}`, money(item.lineTotalCents, receipt.currency), columns));
        if (Number(item.discountCents) > 0) lines.push(fit('  Discount', `-${money(item.discountCents, receipt.currency)}`, columns));
    }
    lines.push(separator);
    lines.push(fit('Subtotal', money(receipt.subtotalCents, receipt.currency), columns));
    if (Number(receipt.discountCents) > 0) lines.push(fit('Discount', `-${money(receipt.discountCents, receipt.currency)}`, columns));
    lines.push(fit('TOTAL', money(receipt.totalCents, receipt.currency), columns));
    lines.push(fit('Received', money(receipt.payment?.amountReceivedCents, receipt.currency), columns));
    lines.push(fit('Change', money(receipt.payment?.changeCents, receipt.currency), columns));
    lines.push(fit('Payment', `${receipt.payment?.methodLabel || receipt.payment?.method} / ${receipt.payment?.status}`, columns));
    lines.push(separator);
    if (receipt.qrData) lines.push(center(receipt.qrData, columns));
    if (receipt.policyNote) lines.push('', center(receipt.policyNote, columns));
    lines.push('', '', '');

    const text = new TextEncoder().encode(`${lines.join('\n')}\n`);
    const prefix = new Uint8Array([ESC, 0x40]);
    const suffix = cut ? new Uint8Array([GS, 0x56, 0x41, 0x03]) : new Uint8Array();
    const output = new Uint8Array(prefix.length + text.length + suffix.length);
    output.set(prefix);
    output.set(text, prefix.length);
    output.set(suffix, prefix.length + text.length);
    return output;
};
