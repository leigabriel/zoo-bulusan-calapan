const { execFile } = require('child_process');
const { promisify } = require('util');
const { encodeReceipt } = require('./esc-pos-service');

const execFileAsync = promisify(execFile);
const POWERSHELL = process.env.WINDIR ? `${process.env.WINDIR}\\System32\\WindowsPowerShell\\v1.0\\powershell.exe` : 'powershell.exe';

const ensureWindows = () => {
    if (process.platform !== 'win32') {
        const error = new Error('Windows printer discovery is available only when the backend runs on Windows.');
        error.status = 501;
        throw error;
    }
};

const runPowerShell = async (command, environment = {}) => {
    ensureWindows();
    try {
        return await execFileAsync(POWERSHELL, ['-NoProfile', '-NonInteractive', '-Command', command], {
            windowsHide: true,
            timeout: 15000,
            maxBuffer: 1024 * 1024,
            env: { ...process.env, ...environment }
        });
    } catch (error) {
        const printerError = new Error((error.stderr || error.message || 'Windows printer operation failed.').trim());
        printerError.status = 503;
        throw printerError;
    }
};

const listPrinters = async () => {
    const command = "Get-Printer | Select-Object Name,DriverName,PortName,PrinterStatus,Type,Shared | ConvertTo-Json -Compress";
    const { stdout } = await runPowerShell(command);
    if (!stdout.trim()) return [];
    const parsed = JSON.parse(stdout);
    return (Array.isArray(parsed) ? parsed : [parsed]).map(printer => ({
        name: printer.Name,
        driverName: printer.DriverName,
        portName: printer.PortName,
        status: String(printer.PrinterStatus || 'Unknown'),
        type: printer.Type,
        shared: Boolean(printer.Shared),
        isConfiguredPt210: printer.Name === 'PT210 USB' || printer.PortName === 'USB001'
    }));
};

const rawPrintCommand = String.raw`
$source = @'
using System;
using System.ComponentModel;
using System.Runtime.InteropServices;
public static class RawPrinter {
    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Ansi)]
    public class DOCINFOA { [MarshalAs(UnmanagedType.LPStr)] public string pDocName; [MarshalAs(UnmanagedType.LPStr)] public string pOutputFile; [MarshalAs(UnmanagedType.LPStr)] public string pDataType; }
    [DllImport("winspool.drv", SetLastError=true, CharSet=CharSet.Unicode)] static extern bool OpenPrinter(string name, out IntPtr handle, IntPtr defaults);
    [DllImport("winspool.drv", SetLastError=true)] static extern bool ClosePrinter(IntPtr handle);
    [DllImport("winspool.drv", SetLastError=true, CharSet=CharSet.Ansi)] static extern bool StartDocPrinter(IntPtr handle, int level, [In] DOCINFOA docInfo);
    [DllImport("winspool.drv", SetLastError=true)] static extern bool EndDocPrinter(IntPtr handle);
    [DllImport("winspool.drv", SetLastError=true)] static extern bool StartPagePrinter(IntPtr handle);
    [DllImport("winspool.drv", SetLastError=true)] static extern bool EndPagePrinter(IntPtr handle);
    [DllImport("winspool.drv", SetLastError=true)] static extern bool WritePrinter(IntPtr handle, IntPtr bytes, int count, out int written);
    public static void Send(string printerName, byte[] data) {
        IntPtr printer;
        if (!OpenPrinter(printerName, out printer, IntPtr.Zero)) throw new Win32Exception(Marshal.GetLastWin32Error());
        IntPtr memory = IntPtr.Zero;
        try {
            var doc = new DOCINFOA { pDocName = "Bulusan Zoo ESC/POS Receipt", pDataType = "RAW" };
            if (!StartDocPrinter(printer, 1, doc)) throw new Win32Exception(Marshal.GetLastWin32Error());
            try {
                if (!StartPagePrinter(printer)) throw new Win32Exception(Marshal.GetLastWin32Error());
                memory = Marshal.AllocCoTaskMem(data.Length);
                Marshal.Copy(data, 0, memory, data.Length);
                int written;
                if (!WritePrinter(printer, memory, data.Length, out written) || written != data.Length) throw new Win32Exception(Marshal.GetLastWin32Error());
                EndPagePrinter(printer);
            } finally { EndDocPrinter(printer); }
        } finally {
            if (memory != IntPtr.Zero) Marshal.FreeCoTaskMem(memory);
            ClosePrinter(printer);
        }
    }
}
'@
Add-Type -TypeDefinition $source
[RawPrinter]::Send($env:BZ_PRINTER_NAME, [Convert]::FromBase64String($env:BZ_PRINT_DATA))
`;

const printReceipt = async (printerName, receipt, options = {}) => {
    if (typeof printerName !== 'string' || !printerName.trim() || printerName.length > 200) throw new Error('Select a valid Windows printer.');
    const printers = await listPrinters();
    const selected = printers.find(printer => printer.name === printerName);
    if (!selected) {
        const error = new Error('The selected Windows printer is no longer installed.');
        error.status = 404;
        throw error;
    }
    const data = encodeReceipt(receipt, options);
    await runPowerShell(rawPrintCommand, {
        BZ_PRINTER_NAME: selected.name,
        BZ_PRINT_DATA: data.toString('base64')
    });
    return selected;
};

module.exports = { listPrinters, printReceipt };
