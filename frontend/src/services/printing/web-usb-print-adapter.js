import { encodeEscPosReceipt } from './esc-pos-encoder';
import { thermalPrinterConfig } from '../../config/thermal-printer-config';

let session = null;
let connectionState = 'Permission required';
let lastError = '';
const listeners = new Set();

const metadata = device => device ? {
    vendorId: device.vendorId,
    productId: device.productId,
    productName: device.productName || 'USB ESC/POS printer',
    manufacturerName: device.manufacturerName || ''
} : null;

const snapshot = () => ({
    status: connectionState,
    error: lastError,
    device: metadata(session?.device)
});

const publish = (status, error = '') => {
    connectionState = status;
    lastError = error;
    listeners.forEach(listener => listener(snapshot()));
};

const friendlyError = error => {
    if (error?.name === 'NotFoundError') return 'No printer was selected.';
    if (error?.name === 'SecurityError') return 'USB access requires HTTPS or localhost and a user selection.';
    if (error?.name === 'NetworkError') return 'The USB interface is busy or owned by the operating-system printer driver.';
    return error?.message || 'USB printer connection failed.';
};

const openDevice = async device => {
    publish('Connecting');
    try {
        if (device.vendorId !== thermalPrinterConfig.usb.vendorId || device.productId !== thermalPrinterConfig.usb.productId) {
            throw new Error('The selected device is not the configured PT210 printer.');
        }
        if (!device.opened) await device.open();
        if (!device.configuration) {
            const configurationValue = device.configurations[0]?.configurationValue || 1;
            await device.selectConfiguration(configurationValue);
        }
        const candidates = device.configuration.interfaces.flatMap(usbInterface =>
            usbInterface.alternates.map(alternate => ({ usbInterface, alternate }))
        );
        const selected = candidates.find(candidate => candidate.alternate.endpoints.some(endpoint => endpoint.direction === 'out' && endpoint.type === 'bulk'))
            || candidates.find(candidate => candidate.alternate.endpoints.some(endpoint => endpoint.direction === 'out'));
        if (!selected) throw new Error('The selected USB device has no writable endpoint.');

        const interfaceNumber = selected.usbInterface.interfaceNumber;
        await device.claimInterface(interfaceNumber);
        if (selected.usbInterface.alternate?.alternateSetting !== selected.alternate.alternateSetting) {
            await device.selectAlternateInterface(interfaceNumber, selected.alternate.alternateSetting);
        }
        const endpoint = selected.alternate.endpoints.find(item => item.direction === 'out' && item.type === 'bulk')
            || selected.alternate.endpoints.find(item => item.direction === 'out');
        session = { device, interfaceNumber, endpointNumber: endpoint.endpointNumber };
        publish('Connected');
        return snapshot();
    } catch (error) {
        session = null;
        try { if (device.opened) await device.close(); } catch { /* Device may already be gone. */ }
        const message = friendlyError(error);
        publish('Error', message);
        throw new Error(message);
    }
};

if (typeof navigator !== 'undefined' && 'usb' in navigator) {
    navigator.usb.addEventListener('disconnect', event => {
        if (session?.device === event.device) {
            session = null;
            publish('Disconnected', 'Reconnect the USB printer.');
        }
    });
    navigator.usb.addEventListener('connect', () => {
        if (!session) publish('Available');
    });
}

export const webUsbPrintAdapter = {
    isSupported: () => typeof navigator !== 'undefined' && 'usb' in navigator,
    getState: snapshot,
    subscribe: listener => {
        listeners.add(listener);
        listener(snapshot());
        return () => listeners.delete(listener);
    },
    selectPrinter: async () => {
        if (!webUsbPrintAdapter.isSupported()) throw new Error('WebUSB is unsupported in this browser. Use desktop Chrome or Edge.');
        const device = await navigator.usb.requestDevice({
            filters: [{
                vendorId: thermalPrinterConfig.usb.vendorId,
                productId: thermalPrinterConfig.usb.productId
            }]
        });
        return openDevice(device);
    },
    reconnect: async preferredDevice => {
        if (session?.device?.opened) return snapshot();
        if (!webUsbPrintAdapter.isSupported()) throw new Error('WebUSB is unsupported in this browser.');
        const devices = await navigator.usb.getDevices();
        const device = devices.find(item =>
            item.vendorId === thermalPrinterConfig.usb.vendorId
            && item.productId === thermalPrinterConfig.usb.productId
            && (!preferredDevice || (item.vendorId === preferredDevice.vendorId && item.productId === preferredDevice.productId))
        );
        if (!device) {
            publish('Permission required');
            throw new Error('Select the PT210 from the print menu on the Walk-In page first.');
        }
        return openDevice(device);
    },
    disconnect: async () => {
        const active = session;
        session = null;
        if (active?.device?.opened) await active.device.close();
        publish('Disconnected');
    },
    printReceipt: async (receipt, options) => {
        if (!session?.device?.opened) throw new Error('USB printer is not connected.');
        const bytes = encodeEscPosReceipt(receipt, options);
        publish('Connected');
        try {
            for (let offset = 0; offset < bytes.length; offset += 4096) {
                const result = await session.device.transferOut(session.endpointNumber, bytes.slice(offset, offset + 4096));
                if (result.status !== 'ok') throw new Error(`USB transfer ended with status: ${result.status}`);
            }
        } catch (error) {
            const message = friendlyError(error);
            publish('Error', message);
            throw new Error(message);
        }
    }
};
