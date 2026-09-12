export const webBluetoothPrintAdapter = {
    isSupported: () => typeof navigator !== 'undefined' && 'bluetooth' in navigator,
    status: () => webBluetoothPrintAdapter.isSupported() ? 'Available' : 'Unsupported',
    connect: async () => {
        throw new Error('BLE service and characteristic UUIDs are required before direct connection can be enabled.');
    },
    print: async () => {
        throw new Error('Direct Bluetooth LE printing is not configured for this printer.');
    }
};
