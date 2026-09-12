export const thermalPrinterConfig = Object.freeze({
    model: 'PT210',
    systemModel: 'PT210_UB',
    family: 'MTP-II / PT-210 / PT-200',
    usb: {
        vendorId: 0x0fe6,
        productId: 0x811e,
        deviceName: 'YICHIP POS58 Printer',
        windowsPrinterName: 'PT210 USB',
        windowsPort: 'USB001'
    },
    bluetooth: {
        deviceName: 'PT210_5266',
        transport: 'classic-spp',
        baudRate: 9600,
        flowControl: 'XON/XOFF',
        webBluetoothSupported: false
    },
    print: {
        paperWidth: '58mm',
        printableWidthMm: 48,
        widthDots: 384,
        dpi: 203,
        columns: 32,
        commandSet: 'ESC/POS',
        autoCut: false
    }
});
