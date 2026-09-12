import { useEffect, useRef, useState } from 'react';
import { Menu, Print, Ticket, Trash } from 'reicon-react';
import { staffAPI } from '../../services/api-client';
import { browserPrintAdapter } from '../../services/printing/browser-print-adapter';
import { webUsbPrintAdapter } from '../../services/printing/web-usb-print-adapter';
import { loadPrinterPreferences, savePrinterPreferences } from '../../services/printing/printer-service';
import { sanitizeInput, sanitizePhone } from '../../utils/sanitize';
import { notify } from '../../utils/toast';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import ThermalReceipt from '../../components/printing/ThermalReceipt';

const localDate = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};
const makeIdempotencyKey = () => crypto.randomUUID?.().replaceAll('-', '') || `${Date.now()}_${Math.random().toString(36).slice(2)}`;
const money = cents => `PHP ${(Number(cents || 0) / 100).toFixed(2)}`;
const fieldClass = 'mt-1.5 w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-green-500';

const StaffWalkIn = () => {
    const [config, setConfig] = useState(null);
    const [quantities, setQuantities] = useState({});
    const [form, setForm] = useState({ visitorName: '', visitorPhone: '', visitDate: localDate(), paymentMethod: 'cash', amountReceived: '', providerReference: '' });
    const [receipt, setReceipt] = useState(null);
    const [sale, setSale] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [showVoid, setShowVoid] = useState(false);
    const [voidReason, setVoidReason] = useState('');
    const [isReprint, setIsReprint] = useState(false);
    const [printerMenuOpen, setPrinterMenuOpen] = useState(false);
    const [printerPreferences, setPrinterPreferences] = useState(loadPrinterPreferences);
    const [windowsPrinters, setWindowsPrinters] = useState([]);
    const [usbState, setUsbState] = useState(webUsbPrintAdapter.getState);
    const [printerBusy, setPrinterBusy] = useState(false);
    const requestKey = useRef(makeIdempotencyKey());
    const submitLock = useRef(false);
    const printerMenuRef = useRef(null);

    useEffect(() => {
        staffAPI.getWalkInConfig().then(data => {
            setConfig(data.config);
            setQuantities(Object.fromEntries(data.config.categories.map(category => [category.code, 0])));
        }).catch(error => notify.error(error.message)).finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (!config || form.visitDate === config.availability?.date) return;
        const timeout = setTimeout(() => staffAPI.getWalkInConfig(form.visitDate).then(data => setConfig(data.config)).catch(error => notify.error(error.message)), 250);
        return () => clearTimeout(timeout);
    }, [config, form.visitDate]);

    useEffect(() => webUsbPrintAdapter.subscribe(setUsbState), []);

    useEffect(() => {
        if (!printerMenuOpen) return;
        staffAPI.getWindowsPrinters().then(data => setWindowsPrinters(data.printers || [])).catch(() => setWindowsPrinters([]));
        const close = event => {
            if (!printerMenuRef.current?.contains(event.target)) setPrinterMenuOpen(false);
        };
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, [printerMenuOpen]);

    const lines = config?.categories.map(category => {
        const quantity = quantities[category.code] || 0;
        return { ...category, quantity, subtotalCents: category.unitPriceCents * quantity, discountTotalCents: category.discountCents * quantity, totalCents: (category.unitPriceCents - category.discountCents) * quantity };
    }) || [];
    const visitorCount = lines.reduce((sum, line) => sum + line.quantity, 0);
    const subtotalCents = lines.reduce((sum, line) => sum + line.subtotalCents, 0);
    const discountCents = lines.reduce((sum, line) => sum + line.discountTotalCents, 0);
    const totalCents = subtotalCents - discountCents;
    const receivedCents = Math.round((Number(form.amountReceived) || 0) * 100);
    const selectedMethod = config?.paymentMethods.find(method => method.code === form.paymentMethod);
    const printerStatus = printerPreferences.mode === 'windows'
        ? printerPreferences.windowsPrinterName || 'Select queue'
        : printerPreferences.mode === 'usb'
            ? usbState.status
            : 'System dialog';

    const savePrinter = changes => {
        const next = savePrinterPreferences({ ...printerPreferences, ...changes });
        setPrinterPreferences(next);
    };

    const updateQuantity = (categoryCode, change) => {
        setQuantities(current => {
            const next = { ...current, [categoryCode]: Math.max(0, (current[categoryCode] || 0) + change) };
            const exactTotalCents = config.categories.reduce((sum, category) =>
                sum + ((category.unitPriceCents - category.discountCents) * (next[category.code] || 0)), 0);
            setForm(currentForm => ({
                ...currentForm,
                paymentMethod: 'cash',
                amountReceived: (exactTotalCents / 100).toFixed(2),
                providerReference: ''
            }));
            return next;
        });
    };

    const connectUsb = async () => {
        setPrinterBusy(true);
        try {
            const state = await webUsbPrintAdapter.selectPrinter();
            savePrinter({ mode: 'usb', usbDevice: state.device });
            notify.success('PT210 connected.');
        } catch (error) {
            if (error.message !== 'No printer was selected.') notify.error(error.message);
        } finally {
            setPrinterBusy(false);
        }
    };

    const resetDraft = () => {
        setQuantities(Object.fromEntries((config?.categories || []).map(category => [category.code, 0])));
        setForm({ visitorName: '', visitorPhone: '', visitDate: localDate(), paymentMethod: 'cash', amountReceived: '', providerReference: '' });
        setReceipt(null);
        setSale(null);
        setIsReprint(false);
        requestKey.current = makeIdempotencyKey();
    };

    const validate = () => {
        if (!visitorCount) return 'Select at least one ticket.';
        if (visitorCount > config.maxVisitorsPerSale) return `Maximum ${config.maxVisitorsPerSale} visitors per sale.`;
        if (visitorCount > config.availability.remaining) return `Only ${config.availability.remaining} admission slots remain.`;
        if (form.paymentMethod === 'cash' && receivedCents < totalCents) return 'Cash received must cover the total.';
        if (selectedMethod?.requiresReference && !form.providerReference.trim()) return 'Enter the GCash reference.';
        return '';
    };

    const requestConfirmation = event => {
        event.preventDefault();
        const error = validate();
        if (error) return notify.error(error);
        setShowConfirm(true);
    };

    const completeSale = async () => {
        if (submitLock.current) return;
        submitLock.current = true;
        setSubmitting(true);
        try {
            const result = await staffAPI.createWalkIn({
                visitorName: sanitizeInput(form.visitorName, true),
                visitorPhone: sanitizePhone(form.visitorPhone, true),
                visitDate: form.visitDate,
                items: lines.filter(line => line.quantity > 0).map(line => ({ categoryCode: line.code, quantity: line.quantity })),
                payment: {
                    method: form.paymentMethod,
                    ...(form.paymentMethod === 'cash' && { amountReceivedCents: receivedCents }),
                    ...(form.providerReference.trim() && { providerReference: sanitizeInput(form.providerReference, true) })
                }
            }, requestKey.current);
            setReceipt(result.receipt);
            setSale(result.sale);
            setShowConfirm(false);
            notify.success(result.replayed ? 'Existing sale recovered.' : 'Sale completed.');
        } catch (error) {
            notify.error(error.message);
        } finally {
            setSubmitting(false);
            submitLock.current = false;
        }
    };

    const printReceipt = async reprint => {
        setIsReprint(reprint);
        try {
            await staffAPI.logWalkInReceiptEvent(sale.saleNumber, reprint ? 'reprint_requested' : 'print_requested');
            if (printerPreferences.mode === 'windows') {
                if (!printerPreferences.windowsPrinterName) throw new Error('Select a Windows printer queue first.');
                await staffAPI.printWindowsReceipt({ printerName: printerPreferences.windowsPrinterName, saleNumber: sale.saleNumber, reprint });
                notify.success('Receipt queued.');
            } else if (printerPreferences.mode === 'usb') {
                if (webUsbPrintAdapter.getState().status !== 'Connected') await webUsbPrintAdapter.reconnect(printerPreferences.usbDevice);
                await webUsbPrintAdapter.printReceipt(receipt, { reprint });
                notify.success('Receipt sent to PT210.');
            } else {
                await browserPrintAdapter.print();
            }
        } catch (error) {
            notify.error(error.message);
            staffAPI.logWalkInReceiptEvent(sale.saleNumber, 'print_failed').catch(() => {});
        }
    };

    const voidSale = async () => {
        if (submitLock.current) return;
        submitLock.current = true;
        setSubmitting(true);
        try {
            const result = await staffAPI.voidWalkIn(sale.saleNumber, voidReason);
            setSale(result.sale);
            setShowVoid(false);
            setVoidReason('');
            notify.success('Sale voided.');
        } catch (error) {
            notify.error(error.message);
        } finally {
            setSubmitting(false);
            submitLock.current = false;
        }
    };

    if (loading) return <div className="flex min-h-64 items-center justify-center text-sm font-bold text-gray-400">Loading cashier...</div>;
    if (!config) return <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">Cashier configuration is unavailable.</div>;

    return <div className="walk-in-page mx-auto max-w-[1800px]">
        <header className="mb-5 flex items-start justify-between gap-4">
            <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-green-700">Admissions</p><h1 className="mt-1 text-2xl font-black text-gray-950">Walk-In</h1><p className="mt-1 text-sm text-gray-400">{config.availability.remaining} slots available</p></div>
            <div className="relative" ref={printerMenuRef}>
                <button type="button" onClick={() => setPrinterMenuOpen(open => !open)} className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-bold text-gray-700 shadow-sm" aria-expanded={printerMenuOpen}><span className={`h-2 w-2 rounded-full ${printerPreferences.mode === 'usb' && usbState.status !== 'Connected' ? 'bg-amber-400' : 'bg-green-500'}`} /><span className="hidden sm:inline">{printerStatus}</span><Menu size={18} /></button>
                {printerMenuOpen && <div className="absolute right-0 z-30 mt-2 w-72 rounded-xl border border-gray-200 bg-white p-2 shadow-2xl"><p className="px-2 py-2 text-[10px] font-black uppercase tracking-[0.15em] text-gray-400">Print using</p><button type="button" onClick={() => savePrinter({ mode: 'system' })} className={`w-full rounded-lg px-3 py-2.5 text-left text-sm ${printerPreferences.mode === 'system' ? 'bg-green-50 font-black text-green-800' : 'hover:bg-gray-50'}`}>System print dialog</button>{windowsPrinters.map(printer => <button type="button" key={printer.name} onClick={() => savePrinter({ mode: 'windows', windowsPrinterName: printer.name })} className={`mt-1 w-full rounded-lg px-3 py-2.5 text-left text-sm ${printerPreferences.mode === 'windows' && printerPreferences.windowsPrinterName === printer.name ? 'bg-green-50 font-black text-green-800' : 'hover:bg-gray-50'}`}><span className="block font-bold">{printer.name}</span><span className="text-xs text-gray-400">Windows / {printer.portName}</span></button>)}<button type="button" disabled={printerBusy} onClick={connectUsb} className={`mt-1 w-full rounded-lg px-3 py-2.5 text-left text-sm ${printerPreferences.mode === 'usb' ? 'bg-green-50 text-green-800' : 'hover:bg-gray-50'}`}><span className="block font-bold">PT210 WebUSB</span><span className="text-xs text-gray-400">{printerBusy ? 'Connecting...' : usbState.status}</span></button></div>}
            </div>
        </header>

        <div className="grid gap-5 lg:grid-cols-[1fr_310px]">
            <form onSubmit={requestConfirmation} className="space-y-4">
                <section className="rounded-xl border border-gray-200 bg-white p-4">
                    <div className="mb-3 flex items-center gap-2"><Ticket size={18} /><h2 className="font-black text-gray-900">Tickets</h2></div>
                    <div className="divide-y divide-gray-100">{lines.map(category => <div key={category.code} className="flex items-center justify-between gap-3 py-3"><div><p className="text-sm font-bold text-gray-900">{category.label}</p><p className="text-xs text-gray-400">{money(category.unitPriceCents - category.discountCents)}</p></div><div className="flex items-center gap-2"><button type="button" onClick={() => updateQuantity(category.code, -1)} className="h-8 w-8 rounded-md border border-gray-200 text-lg">-</button><output className="w-6 text-center text-sm font-black">{category.quantity}</output><button type="button" onClick={() => updateQuantity(category.code, 1)} className="h-8 w-8 rounded-md bg-gray-900 text-lg text-white">+</button></div></div>)}</div>
                </section>
                <section className="grid gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 sm:grid-cols-2">
                    <label className="text-xs font-bold text-gray-600">Visitor name <span className="font-normal text-gray-400">optional</span><input value={form.visitorName} maxLength={100} onChange={event => setForm(current => ({ ...current, visitorName: sanitizeInput(event.target.value) }))} className={fieldClass} /></label>
                    <label className="text-xs font-bold text-gray-600">Contact <span className="font-normal text-gray-400">optional</span><input value={form.visitorPhone} maxLength={20} onChange={event => setForm(current => ({ ...current, visitorPhone: sanitizePhone(event.target.value) }))} className={fieldClass} /></label>
                    <label className="text-xs font-bold text-gray-600">Visit date<input type="date" min={localDate()} value={form.visitDate} onChange={event => setForm(current => ({ ...current, visitDate: event.target.value }))} required className={fieldClass} /></label>
                    <label className="text-xs font-bold text-gray-600">Payment<select value={form.paymentMethod} onChange={event => setForm(current => ({ ...current, paymentMethod: event.target.value }))} className={fieldClass}>{config.paymentMethods.map(method => <option value={method.code} key={method.code}>{method.label}</option>)}</select></label>
                    {form.paymentMethod === 'cash' && <label className="text-xs font-bold text-gray-600">Cash received<input type="number" min="0" step="0.01" value={form.amountReceived} onChange={event => setForm(current => ({ ...current, amountReceived: event.target.value }))} required className={fieldClass} /></label>}
                    {selectedMethod?.requiresReference && <label className="text-xs font-bold text-gray-600">Payment reference<input value={form.providerReference} maxLength={100} onChange={event => setForm(current => ({ ...current, providerReference: sanitizeInput(event.target.value) }))} required className={fieldClass} /></label>}
                </section>
            </form>

            <aside className="space-y-4">
                {!receipt ? <section className="rounded-xl border border-gray-200 bg-white p-4 lg:sticky lg:top-0"><h2 className="text-sm font-black text-gray-900">Summary</h2><div className="mt-4 space-y-2 text-sm">{lines.filter(line => line.quantity).map(line => <p key={line.code} className="flex justify-between text-gray-500"><span>{line.quantity} x {line.label}</span><strong className="text-gray-900">{money(line.totalCents)}</strong></p>)}{!visitorCount && <p className="text-gray-400">No tickets selected</p>}</div><div className="mt-4 space-y-2 border-t border-gray-100 pt-4 text-sm"><p className="flex justify-between text-gray-500"><span>Discount</span><strong>-{money(discountCents)}</strong></p><p className="flex justify-between text-xl font-black"><span>Total</span><strong>{money(totalCents)}</strong></p>{form.paymentMethod === 'cash' && <p className="flex justify-between text-gray-500"><span>Change</span><strong>{money(Math.max(receivedCents - totalCents, 0))}</strong></p>}</div><button type="button" onClick={requestConfirmation} disabled={submitting} className="mt-5 w-full rounded-lg bg-green-500 px-4 py-3 text-sm font-black text-gray-950 disabled:opacity-40">Complete sale</button></section> : <section className="receipt-preview rounded-xl border border-gray-200 bg-gray-100 p-3"><div className="mb-2 flex items-center justify-between"><div><p className="text-sm font-black">Receipt</p><p className="text-[10px] text-gray-400">{printerStatus}</p></div>{sale?.status === 'voided' && <span className="rounded bg-red-100 px-2 py-1 text-[10px] font-black text-red-700">VOIDED</span>}</div><div className="max-h-[55vh] overflow-auto"><ThermalReceipt receipt={receipt} paperWidth="58mm" isReprint={isReprint} /></div><div className="mt-3 grid grid-cols-2 gap-2"><button onClick={() => printReceipt(false)} className="flex items-center justify-center gap-1 rounded-lg bg-green-500 px-2 py-2.5 text-xs font-black"><Print size={16} />Print</button><button onClick={() => printReceipt(true)} className="rounded-lg border border-gray-300 bg-white px-2 py-2.5 text-xs font-black">Reprint</button><button onClick={resetDraft} className="rounded-lg border border-gray-300 bg-white px-2 py-2.5 text-xs font-black">New sale</button><button onClick={() => setShowVoid(true)} disabled={sale?.status === 'voided'} className="flex items-center justify-center gap-1 rounded-lg border border-red-200 bg-white px-2 py-2.5 text-xs font-black text-red-600 disabled:opacity-40"><Trash size={15} />Void</button></div></section>}
            </aside>
        </div>
        <ConfirmationModal isOpen={showConfirm} title="Complete sale?" message={`${visitorCount} visitor(s) / ${money(totalCents)} / ${selectedMethod?.label}`} confirmLabel="Complete" loading={submitting} onConfirm={completeSale} onClose={() => setShowConfirm(false)} />
        <ConfirmationModal isOpen={showVoid} title="Void sale?" message="The transaction remains in the audit trail." danger requireInput inputLabel="Reason" inputValue={voidReason} onInputChange={setVoidReason} confirmDisabled={voidReason.trim().length < 3} loading={submitting} onConfirm={voidSale} onClose={() => setShowVoid(false)} />
    </div>;
};

export default StaffWalkIn;
