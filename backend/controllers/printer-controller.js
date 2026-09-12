const printerService = require('../services/windows-printer-service');
const walkInService = require('../services/walk-in-service');

const testReceipt = {
    organizationName: 'Bulusan Wildlife and Nature Park',
    address: 'PT210 Windows spooler test',
    contact: 'No transaction was created',
    receiptNumber: 'TEST-PT210',
    createdAt: new Date().toISOString(),
    visitDate: new Date().toISOString().slice(0, 10),
    staffName: 'Printer setup',
    currency: 'PHP',
    items: [{ categoryLabel: 'Alignment test', quantity: 1, unitPriceCents: 0, discountCents: 0, lineTotalCents: 0 }],
    subtotalCents: 0,
    discountCents: 0,
    totalCents: 0,
    payment: { methodLabel: 'Test', status: 'test', amountReceivedCents: 0, changeCents: 0 },
    policyNote: 'Windows RAW ESC/POS is ready.'
};

exports.list = async (req, res, next) => {
    try {
        const [printers, usbDevices] = await Promise.all([
            printerService.listPrinters(),
            printerService.listUsbDevices()
        ]);
        res.json({ success: true, printers, usbDevices });
    } catch (error) {
        next(error);
    }
};

exports.print = async (req, res, next) => {
    try {
        const { printerName, saleNumber, reprint = false, test = false } = req.body;
        let receipt = testReceipt;
        if (!test) {
            if (typeof saleNumber !== 'string') return res.status(400).json({ success: false, message: 'A sale number is required.' });
            const sale = await walkInService.getSale(saleNumber);
            if (!sale) return res.status(404).json({ success: false, message: 'Walk-in sale not found.' });
            receipt = sale.receipt;
        }
        const printer = await printerService.printReceipt(printerName, receipt, { reprint: Boolean(reprint) });
        res.json({ success: true, printer, queuedAt: new Date().toISOString() });
    } catch (error) {
        next(error);
    }
};
