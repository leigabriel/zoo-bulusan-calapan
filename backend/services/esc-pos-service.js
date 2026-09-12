const cleanAscii = value => String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E\n]/g, '?');

const qrCommands = value => {
    const data = Buffer.from(cleanAscii(value), 'ascii');
    const length = data.length + 3;
    return [
        Buffer.from([0x1d, 0x28, 0x6b, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00]),
        Buffer.from([0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x43, 0x06]),
        Buffer.from([0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x45, 0x31]),
        Buffer.from([0x1d, 0x28, 0x6b, length & 0xff, (length >> 8) & 0xff, 0x31, 0x50, 0x30]),
        data,
        Buffer.from([0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x51, 0x30])
    ];
};

const encodeReceipt = (receipt, { reprint = false } = {}) => {
    const createdAt = new Date(receipt.createdAt);
    const validDate = !Number.isNaN(createdAt.getTime());
    const date = validDate ? createdAt.toLocaleDateString('en-PH', { timeZone: 'Asia/Manila', year: 'numeric', month: 'short', day: '2-digit' }) : receipt.createdAt;
    const time = validDate ? createdAt.toLocaleTimeString('en-PH', { timeZone: 'Asia/Manila', hour: '2-digit', minute: '2-digit' }) : '-';
    const details = [
        `Ref.    ${cleanAscii(receipt.receiptNumber)}`,
        `Date    ${cleanAscii(date)}, ${cleanAscii(time)}`,
        ...(receipt.items || []).map(item => `Ticket  ${item.quantity} x ${cleanAscii(item.categoryLabel)}`),
        ''
    ];
    return Buffer.concat([
        Buffer.from([0x1b, 0x40, 0x1b, 0x61, 0x01, 0x1b, 0x45, 0x01, 0x1d, 0x21, 0x11]),
        Buffer.from('BULUSAN ZOO\n', 'ascii'),
        Buffer.from([0x1d, 0x21, 0x00, 0x1b, 0x45, 0x00]),
        Buffer.from(`${reprint ? '\n*** REPRINT ***\n' : ''}\n`, 'ascii'),
        Buffer.from([0x1b, 0x61, 0x00]),
        Buffer.from(`${details.join('\n')}\n`, 'ascii'),
        Buffer.from([0x1b, 0x61, 0x01]),
        ...qrCommands(receipt.qrData || receipt.receiptNumber),
        Buffer.from([0x1b, 0x61, 0x00]),
        Buffer.from('\n\n\n\n', 'ascii')
    ]);
};

module.exports = { encodeReceipt };
