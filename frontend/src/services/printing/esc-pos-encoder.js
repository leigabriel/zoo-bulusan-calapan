const ESC = 0x1b;
const GS = 0x1d;

const ascii = value => String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E\n]/g, '?');

const command = values => new Uint8Array(values);
const combine = parts => {
    const output = new Uint8Array(parts.reduce((size, part) => size + part.length, 0));
    let offset = 0;
    for (const part of parts) {
        output.set(part, offset);
        offset += part.length;
    }
    return output;
};

const qrCommands = value => {
    const data = new TextEncoder().encode(ascii(value));
    const length = data.length + 3;
    return [
        command([GS, 0x28, 0x6b, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00]),
        command([GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x43, 0x06]),
        command([GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x45, 0x31]),
        command([GS, 0x28, 0x6b, length & 0xff, (length >> 8) & 0xff, 0x31, 0x50, 0x30]),
        data,
        command([GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x51, 0x30])
    ];
};

export const encodeEscPosReceipt = (receipt, { reprint = false } = {}) => {
    if (!receipt) throw new Error('Receipt data is required.');
    const createdAt = new Date(receipt.createdAt);
    const validDate = !Number.isNaN(createdAt.getTime());
    const date = validDate ? createdAt.toLocaleDateString('en-PH', { timeZone: 'Asia/Manila', year: 'numeric', month: 'short', day: '2-digit' }) : receipt.createdAt;
    const time = validDate ? createdAt.toLocaleTimeString('en-PH', { timeZone: 'Asia/Manila', hour: '2-digit', minute: '2-digit' }) : '-';
    const details = [
        `Ref.    ${ascii(receipt.receiptNumber)}`,
        `Date    ${ascii(date)}, ${ascii(time)}`,
        ...(receipt.items || []).map(item => `Ticket  ${item.quantity} x ${ascii(item.categoryLabel)}`),
        ''
    ].join('\n');
    return combine([
        command([ESC, 0x40, ESC, 0x61, 0x01, ESC, 0x45, 0x01, GS, 0x21, 0x11]),
        new TextEncoder().encode('BULUSAN ZOO\n'),
        command([GS, 0x21, 0x00, ESC, 0x45, 0x00]),
        new TextEncoder().encode(`${reprint ? '\n*** REPRINT ***\n' : ''}\n`),
        command([ESC, 0x61, 0x00]),
        new TextEncoder().encode(`${details}\n`),
        command([ESC, 0x61, 0x01]),
        ...qrCommands(receipt.qrData || receipt.receiptNumber),
        command([ESC, 0x61, 0x00]),
        new TextEncoder().encode('\n\n\n\n')
    ]);
};
