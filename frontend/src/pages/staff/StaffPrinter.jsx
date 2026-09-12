import { useEffect, useState } from 'react';
import { Print, ShieldCheck } from 'reicon-react';
import ThermalReceipt from '../../components/printing/ThermalReceipt';
import { browserPrintAdapter } from '../../services/printing/browser-print-adapter';
import { webUsbPrintAdapter } from '../../services/printing/web-usb-print-adapter';
import { detectPrinterCapabilities, loadPrinterPreferences, savePrinterPreferences, testReceipt } from '../../services/printing/printer-service';
import { notify } from '../../utils/toast';
import { thermalPrinterConfig } from '../../config/thermal-printer-config';
import { staffAPI } from '../../services/api-client';

const StaffPrinter = () => {
    const [preferences, setPreferences] = useState(loadPrinterPreferences);
    const [showTest, setShowTest] = useState(false);
    const [lastTest, setLastTest] = useState(null);
    const [usbState, setUsbState] = useState(webUsbPrintAdapter.getState);
    const [usbBusy, setUsbBusy] = useState(false);
    const [windowsPrinters, setWindowsPrinters] = useState([]);
    const [windowsLoading, setWindowsLoading] = useState(true);
    const [windowsError, setWindowsError] = useState('');
    const capabilities = detectPrinterCapabilities();

    useEffect(() => webUsbPrintAdapter.subscribe(setUsbState), []);

    useEffect(() => {
        staffAPI.getWindowsPrinters().then(data => {
            setWindowsPrinters(data.printers || []);
            setWindowsError('');
        }).catch(error => setWindowsError(error.message)).finally(() => setWindowsLoading(false));
    }, []);

    const updatePreferences = next => {
        const saved = savePrinterPreferences({ ...preferences, ...next });
        setPreferences(saved);
        return saved;
    };

    const selectUsbPrinter = async () => {
        setUsbBusy(true);
        try {
            const state = await webUsbPrintAdapter.selectPrinter();
            updatePreferences({ mode: 'usb', usbDevice: state.device });
            notify.success(`${state.device.productName} connected.`);
        } catch (error) {
            if (error.message !== 'No printer was selected.') notify.error(error.message);
        } finally {
            setUsbBusy(false);
        }
    };

    const reconnectUsbPrinter = async () => {
        setUsbBusy(true);
        try {
            await webUsbPrintAdapter.reconnect(preferences.usbDevice);
            updatePreferences({ mode: 'usb' });
            notify.success('USB printer reconnected.');
        } catch (error) {
            notify.error(error.message);
        } finally {
            setUsbBusy(false);
        }
    };

    const disconnectUsbPrinter = async () => {
        setUsbBusy(true);
        try {
            await webUsbPrintAdapter.disconnect();
            updatePreferences({ mode: 'system' });
        } catch (error) {
            notify.error(error.message);
        } finally {
            setUsbBusy(false);
        }
    };

    const printTest = async mode => {
        setShowTest(true);
        try {
            if (mode === 'windows') {
                if (!preferences.windowsPrinterName) throw new Error('Select an installed Windows printer first.');
                await staffAPI.printWindowsReceipt({ printerName: preferences.windowsPrinterName, test: true });
            } else if (mode === 'usb') {
                if (webUsbPrintAdapter.getState().status !== 'Connected') await webUsbPrintAdapter.reconnect(preferences.usbDevice);
                await webUsbPrintAdapter.printReceipt(testReceipt, { paperWidth: preferences.paperWidth, cut: preferences.autoCut });
            } else {
                await browserPrintAdapter.print();
            }
            setLastTest(new Date().toLocaleString());
            notify.success(mode === 'windows' ? 'ESC/POS test queued in Windows.' : mode === 'usb' ? 'ESC/POS test sent to USB printer.' : 'System print dialog opened.');
        } catch (error) {
            notify.error(error.message);
        }
    };

    const usbStatusClass = usbState.status === 'Connected' ? 'bg-green-100 text-green-800' : usbState.status === 'Error' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800';

    return <div className="mx-auto max-w-6xl">
        <div className="mb-6"><p className="text-xs font-black uppercase tracking-[0.2em] text-green-700">Device setup</p><h1 className="text-3xl font-black text-gray-950">Printer Status</h1><p className="mt-2 max-w-3xl text-sm text-gray-500">Choose System Print for an installed printer, or authorize a compatible ESC/POS device with Chrome or Edge's USB chooser.</p></div>
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[['Selected mode', preferences.mode === 'windows' ? 'Windows USB queue' : preferences.mode === 'usb' ? 'WebUSB Direct' : 'System dialog'], ['Windows PT210', windowsPrinters.some(printer => printer.isConfiguredPt210) ? 'Detected' : windowsLoading ? 'Detecting...' : 'Not detected'], ['PT210 WebUSB', capabilities.usb ? usbState.status : 'Unsupported'], ['PT210 Bluetooth', 'Classic / SPP']].map(([label, value]) => <div key={label} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"><p className="text-xs font-bold uppercase tracking-wider text-gray-400">{label}</p><p className="mt-2 font-black text-gray-900">{value}</p></div>)}
        </section>
        <section className="mt-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"><h2 className="font-black text-gray-900">Environment</h2><dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2"><div><dt className="text-gray-400">Platform</dt><dd className="font-bold text-gray-800">{capabilities.platform}</dd></div><div><dt className="text-gray-400">Last successful test transfer</dt><dd className="font-bold text-gray-800">{lastTest || 'Never'}</dd></div><div className="sm:col-span-2"><dt className="text-gray-400">Browser</dt><dd className="break-words font-bold text-gray-800">{capabilities.browser}</dd></div></dl></section>
        <section className="mt-5 grid gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:grid-cols-2">
            <label className="text-sm font-bold text-gray-700">Printing mode<select value={['system', 'windows', 'usb'].includes(preferences.mode) ? preferences.mode : 'system'} onChange={event => updatePreferences({ mode: event.target.value })} className="mt-2 w-full rounded-xl border border-gray-300 bg-gray-50 px-3 py-3"><option value="system">System Print Dialog</option><option value="windows">Windows USB Queue</option>{capabilities.usb && <option value="usb">WebUSB Direct ESC/POS</option>}</select></label>
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700"><p className="font-bold">PT210 print profile</p><p className="mt-1 text-xs text-gray-500">58 mm paper / 48 mm content / 384 dots / 32 columns / 203 DPI / no cutter</p></div>
        </section>
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <section className={`${preferences.mode === 'windows' ? 'border-green-400 bg-green-50' : 'border-gray-200 bg-white'} rounded-2xl border-2 p-5`}><div className="flex items-center justify-between"><h2 className="font-black text-gray-950">Windows USB Queue</h2><span className="rounded-full bg-green-200 px-2 py-1 text-xs font-black text-green-900">Recommended locally</span></div><p className="mt-3 text-sm leading-6 text-gray-600">Uses the existing POS-80 driver and Windows spooler. The backend must be running on the computer connected to the PT210.</p><label className="mt-4 block text-sm font-bold text-gray-700">Installed printer<select value={preferences.windowsPrinterName} onChange={event => updatePreferences({ mode: 'windows', windowsPrinterName: event.target.value })} disabled={windowsLoading} className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-3 py-3"><option value="">{windowsLoading ? 'Detecting printers...' : 'Select a Windows printer'}</option>{windowsPrinters.map(printer => <option key={printer.name} value={printer.name}>{printer.name} ({printer.portName}){printer.isConfiguredPt210 ? ' - PT210' : ''}</option>)}</select></label>{windowsError && <p className="mt-3 rounded-xl bg-red-50 p-3 text-xs font-bold text-red-700">{windowsError}</p>}<button disabled={!preferences.windowsPrinterName || windowsLoading} onClick={() => printTest('windows')} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gray-950 px-4 py-3 text-sm font-black text-white disabled:opacity-40"><Print size={18} />Print through Windows</button></section>
            <section className={`${preferences.mode === 'system' ? 'border-green-400 bg-green-50' : 'border-gray-200 bg-white'} rounded-2xl border-2 p-5`}><div className="flex items-center justify-between"><h2 className="font-black text-gray-950">System Print</h2><span className="rounded-full bg-green-200 px-2 py-1 text-xs font-black text-green-900">Reliable</span></div><p className="mt-3 text-sm leading-6 text-gray-600">Install the USB printer in Windows or Android, then select it in the browser print dialog. Websites cannot enumerate installed system printers.</p><div className="mt-5 grid gap-2 sm:grid-cols-2"><button onClick={() => setShowTest(true)} className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-black">Open test receipt</button><button onClick={() => printTest('system')} className="flex items-center justify-center gap-2 rounded-xl bg-green-500 px-4 py-3 text-sm font-black"><Print size={18} />System test</button></div></section>
            {capabilities.usb && <section className={`${preferences.mode === 'usb' ? 'border-green-400 bg-green-50' : 'border-gray-200 bg-white'} rounded-2xl border-2 p-5`}><div className="flex items-center justify-between gap-3"><h2 className="font-black text-gray-950">PT210 USB Direct</h2><span className={`rounded-full px-2 py-1 text-xs font-black ${usbStatusClass}`}>{usbState.status}</span></div><p className="mt-3 text-sm leading-6 text-gray-600">The chooser is restricted to <strong>{thermalPrinterConfig.usb.deviceName}</strong> at VID 0FE6 / PID 811E. A writable endpoint is validated before printing.</p>{(usbState.device || preferences.usbDevice) && <div className="mt-3 rounded-xl bg-white/80 p-3 text-sm"><strong>{usbState.device?.productName || preferences.usbDevice?.productName || thermalPrinterConfig.usb.deviceName}</strong><p className="mt-1 text-xs text-gray-500">VID {`0x${(usbState.device?.vendorId ?? preferences.usbDevice.vendorId).toString(16).padStart(4, '0')}`} / PID {`0x${(usbState.device?.productId ?? preferences.usbDevice.productId).toString(16).padStart(4, '0')}`}</p></div>}{usbState.error && <p className="mt-3 rounded-xl bg-red-50 p-3 text-xs font-bold text-red-700">{usbState.error}</p>}<div className="mt-5 grid gap-2 sm:grid-cols-2">{usbState.status === 'Connected' ? <button disabled={usbBusy} onClick={disconnectUsbPrinter} className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-black">Disconnect</button> : <button disabled={usbBusy} onClick={preferences.usbDevice ? reconnectUsbPrinter : selectUsbPrinter} className="rounded-xl border border-green-500 bg-white px-4 py-3 text-sm font-black">{usbBusy ? 'Connecting...' : preferences.usbDevice ? 'Reconnect PT210' : 'Select PT210 USB'}</button>}<button disabled={usbBusy || usbState.status !== 'Connected'} onClick={() => printTest('usb')} className="flex items-center justify-center gap-2 rounded-xl bg-gray-950 px-4 py-3 text-sm font-black text-white disabled:opacity-40"><Print size={18} />Direct test</button></div>{preferences.usbDevice && usbState.status !== 'Connected' && <button disabled={usbBusy} onClick={selectUsbPrinter} className="mt-3 text-xs font-black text-green-800 underline">Authorize the PT210 again</button>}<p className="mt-4 text-xs leading-5 text-amber-800">Windows currently uses the POS-80 driver on USB001. If Chrome reports that the interface is busy, use System Print, or install a WinUSB driver for direct mode. Changing to WinUSB can stop the normal Windows printer queue from working.</p></section>}
        </div>
        <section className="mt-5 rounded-2xl border border-gray-200 bg-white p-5"><h2 className="font-black text-gray-900">PT210 Bluetooth <span className="text-xs text-amber-600">Browser direct unavailable</span></h2><p className="mt-2 text-sm leading-6 text-gray-500">The supplied PIN 0000, 9600 baud, and XON/XOFF details describe a serial Bluetooth Classic/SPP connection. Web Bluetooth only accesses BLE GATT services, so Chrome cannot send ESC/POS data to this PT210 Bluetooth serial port. Use USB Direct, System Print, or a native Android/iOS printing bridge.</p></section>
        {!capabilities.secureContext && <div className="mt-5 flex gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900"><ShieldCheck className="shrink-0" size={20} />WebUSB requires HTTPS or localhost. System printing can still work.</div>}
        {showTest && <section className="receipt-preview mt-6 rounded-2xl border border-gray-300 bg-gray-200 p-4"><div className="mb-3 flex justify-between"><h2 className="font-black">Test receipt preview</h2><button onClick={() => setShowTest(false)} className="text-sm font-bold text-gray-600">Close</button></div><div className="overflow-auto"><ThermalReceipt receipt={testReceipt} paperWidth={preferences.paperWidth} /></div></section>}
    </div>;
};

export default StaffPrinter;
