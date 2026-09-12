import { browserPrintAdapter } from './browser-print-adapter';
import { webUsbPrintAdapter } from './web-usb-print-adapter';
import { webBluetoothPrintAdapter } from './web-bluetooth-print-adapter';
import { thermalPrinterConfig } from '../../config/thermal-printer-config';

const PREFERENCES_KEY = 'staff_printer_preferences_v1';
const defaults = { mode: 'system', paperWidth: thermalPrinterConfig.print.paperWidth, autoCut: thermalPrinterConfig.print.autoCut, usbDevice: null, windowsPrinterName: '' };

export const loadPrinterPreferences = () => {
    try {
        const stored = JSON.parse(localStorage.getItem(PREFERENCES_KEY));
        return {
            mode: ['system', 'windows', 'usb', 'bluetooth'].includes(stored?.mode) ? stored.mode : defaults.mode,
            paperWidth: defaults.paperWidth,
            autoCut: defaults.autoCut,
            usbDevice: stored?.usbDevice && Number.isInteger(stored.usbDevice.vendorId) && Number.isInteger(stored.usbDevice.productId)
                ? { vendorId: stored.usbDevice.vendorId, productId: stored.usbDevice.productId, productName: String(stored.usbDevice.productName || '').slice(0, 100), manufacturerName: String(stored.usbDevice.manufacturerName || '').slice(0, 100) }
                : null,
            windowsPrinterName: typeof stored?.windowsPrinterName === 'string' ? stored.windowsPrinterName.slice(0, 200) : ''
        };
    } catch {
        return defaults;
    }
};

export const savePrinterPreferences = preferences => {
    const safe = {
        mode: ['system', 'windows', 'usb', 'bluetooth'].includes(preferences.mode) ? preferences.mode : defaults.mode,
        paperWidth: defaults.paperWidth,
        autoCut: defaults.autoCut,
        usbDevice: preferences.usbDevice && Number.isInteger(preferences.usbDevice.vendorId) && Number.isInteger(preferences.usbDevice.productId)
            ? { vendorId: preferences.usbDevice.vendorId, productId: preferences.usbDevice.productId, productName: String(preferences.usbDevice.productName || '').slice(0, 100), manufacturerName: String(preferences.usbDevice.manufacturerName || '').slice(0, 100) }
            : null,
        windowsPrinterName: typeof preferences.windowsPrinterName === 'string' ? preferences.windowsPrinterName.slice(0, 200) : ''
    };
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(safe));
    return safe;
};

export const detectPrinterCapabilities = () => ({
    system: browserPrintAdapter.isSupported(),
    usb: webUsbPrintAdapter.isSupported(),
    bluetooth: webBluetoothPrintAdapter.isSupported(),
    secureContext: window.isSecureContext,
    browser: navigator.userAgent,
    platform: navigator.userAgentData?.platform || navigator.platform || 'Unknown'
});

export const testReceipt = {
    organizationName: 'Bulusan Wildlife and Nature Park',
    address: 'Thermal printer test',
    contact: 'No transaction was created',
    receiptNumber: 'TEST-RECEIPT',
    saleNumber: 'TEST',
    createdAt: new Date().toISOString(),
    visitDate: new Date().toLocaleDateString('en-CA'),
    staffName: 'Printer setup',
    currency: 'PHP',
    items: [{ categoryCode: 'test', categoryLabel: 'Alignment test', quantity: 1, unitPriceCents: 0, discountCents: 0, lineTotalCents: 0 }],
    subtotalCents: 0,
    discountCents: 0,
    totalCents: 0,
    payment: { methodLabel: 'Test', status: 'test', amountReceivedCents: 0, changeCents: 0 },
    policyNote: 'If every line is readable, ESC/POS printing is ready.'
};
