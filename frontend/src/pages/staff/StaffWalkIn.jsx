import { useEffect, useRef, useState } from 'react';
import { Print, Ticket, Trash } from 'reicon-react';
import { staffAPI } from '../../services/api-client';
import { browserPrintAdapter } from '../../services/printing/browser-print-adapter';
import { webUsbPrintAdapter } from '../../services/printing/web-usb-print-adapter';
import { loadPrinterPreferences } from '../../services/printing/printer-service';
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
    const requestKey = useRef(makeIdempotencyKey());
    const submitLock = useRef(false);
    const printerPreferences = loadPrinterPreferences();
    const paperWidth = printerPreferences.paperWidth;

    useEffect(() => {
        staffAPI.getWalkInConfig().then(data => {
            setConfig(data.config);
            setQuantities(Object.fromEntries(data.config.categories.map(category => [category.code, 0])));
        }).catch(error => notify.error(error.message)).finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (!config || form.visitDate === config.availability?.date) return;
        const timeout = setTimeout(() => {
            staffAPI.getWalkInConfig(form.visitDate).then(data => setConfig(data.config)).catch(error => notify.error(error.message));
        }, 250);
        return () => clearTimeout(timeout);
    }, [config, form.visitDate]);

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
        if (visitorCount > config.availability.remaining) return `Only ${config.availability.remaining} admission slots remain for this date.`;
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
            const payload = {
                visitorName: sanitizeInput(form.visitorName, true),
                visitorPhone: sanitizePhone(form.visitorPhone, true),
                visitDate: form.visitDate,
                items: lines.filter(line => line.quantity > 0).map(line => ({ categoryCode: line.code, quantity: line.quantity })),
                payment: {
                    method: form.paymentMethod,
                    ...(form.paymentMethod === 'cash' && { amountReceivedCents: receivedCents }),
                    ...(form.providerReference.trim() && { providerReference: sanitizeInput(form.providerReference, true) })
                }
            };
            const result = await staffAPI.createWalkIn(payload, requestKey.current);
            setReceipt(result.receipt);
            setSale(result.sale);
            setShowConfirm(false);
            notify.success(result.replayed ? 'Existing sale recovered.' : 'Walk-in sale completed.');
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
                if (!printerPreferences.windowsPrinterName) throw new Error('Select a Windows printer on the Printer Status page first.');
                await staffAPI.printWindowsReceipt({
                    printerName: printerPreferences.windowsPrinterName,
                    saleNumber: sale.saleNumber,
                    reprint
                });
                notify.success('Receipt queued on the Windows printer.');
            } else if (printerPreferences.mode === 'usb') {
                if (webUsbPrintAdapter.getState().status !== 'Connected') {
                    await webUsbPrintAdapter.reconnect(printerPreferences.usbDevice);
                }
                await webUsbPrintAdapter.printReceipt(receipt, {
                    paperWidth: printerPreferences.paperWidth,
                    reprint,
                    cut: printerPreferences.autoCut
                });
                notify.success('Receipt sent directly to the USB printer.');
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
            notify.success('Sale voided and retained in the audit trail.');
        } catch (error) {
            notify.error(error.message);
        } finally {
            setSubmitting(false);
            submitLock.current = false;
        }
    };

    if (loading) return <div className="flex min-h-64 items-center justify-center text-sm font-bold text-gray-500">Loading cashier configuration...</div>;
    if (!config) return <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">Cashier configuration is unavailable.</div>;

    return (
        <div className="walk-in-page mx-auto max-w-7xl">
            <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div><p className="text-xs font-black uppercase tracking-[0.2em] text-green-700">On-site admission</p><h1 className="text-3xl font-black text-gray-950">Walk-In Cashier</h1></div>
                <p className="text-sm text-gray-500">Server-priced / {config.availability.remaining} of {config.dailyCapacity} slots available</p>
            </div>
            <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
                <form onSubmit={requestConfirmation} className="space-y-5">
                    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                        <h2 className="mb-4 flex items-center gap-2 font-black text-gray-900"><Ticket size={20} /> Admission tickets</h2>
                        <div className="grid gap-3 sm:grid-cols-2">
                            {lines.map(category => <div key={category.code} className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 p-4"><div><p className="font-bold text-gray-900">{category.label}</p><p className="text-xs text-gray-500">{money(category.unitPriceCents - category.discountCents)} each{category.requiresProof ? ' / proof required' : ''}</p></div><div className="flex items-center gap-2"><button type="button" onClick={() => setQuantities(current => ({ ...current, [category.code]: Math.max(0, category.quantity - 1) }))} className="h-10 w-10 rounded-lg border border-gray-300 bg-white font-black">-</button><output className="w-8 text-center font-black">{category.quantity}</output><button type="button" onClick={() => setQuantities(current => ({ ...current, [category.code]: category.quantity + 1 }))} className="h-10 w-10 rounded-lg bg-green-400 font-black">+</button></div></div>)}
                        </div>
                    </section>
                    <section className="grid gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:grid-cols-2">
                        <label className="text-sm font-bold text-gray-700">Visitor name <span className="font-normal text-gray-400">optional</span><input value={form.visitorName} maxLength={100} onChange={event => setForm(current => ({ ...current, visitorName: sanitizeInput(event.target.value) }))} className="mt-2 w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 outline-none focus:border-green-500" /></label>
                        <label className="text-sm font-bold text-gray-700">Contact number <span className="font-normal text-gray-400">optional</span><input value={form.visitorPhone} maxLength={20} onChange={event => setForm(current => ({ ...current, visitorPhone: sanitizePhone(event.target.value) }))} className="mt-2 w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 outline-none focus:border-green-500" /></label>
                        <label className="text-sm font-bold text-gray-700">Visit date<input type="date" min={localDate()} value={form.visitDate} onChange={event => setForm(current => ({ ...current, visitDate: event.target.value }))} required className="mt-2 w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 outline-none focus:border-green-500" /></label>
                        <label className="text-sm font-bold text-gray-700">Payment method<select value={form.paymentMethod} onChange={event => setForm(current => ({ ...current, paymentMethod: event.target.value }))} className="mt-2 w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 outline-none focus:border-green-500">{config.paymentMethods.map(method => <option value={method.code} key={method.code}>{method.label}</option>)}</select></label>
                        {form.paymentMethod === 'cash' && <label className="text-sm font-bold text-gray-700">Amount received (PHP)<input type="number" min="0" step="0.01" value={form.amountReceived} onChange={event => setForm(current => ({ ...current, amountReceived: event.target.value }))} required className="mt-2 w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 outline-none focus:border-green-500" /></label>}
                        {selectedMethod?.requiresReference && <label className="text-sm font-bold text-gray-700">Payment reference<input value={form.providerReference} maxLength={100} onChange={event => setForm(current => ({ ...current, providerReference: sanitizeInput(event.target.value) }))} required className="mt-2 w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 outline-none focus:border-green-500" /></label>}
                    </section>
                    <button disabled={submitting || !!receipt} className="w-full rounded-2xl bg-gray-950 px-5 py-4 font-black text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-40">Review and complete sale</button>
                </form>
                <aside className="space-y-4">
                    <div className="rounded-2xl bg-green-950 p-5 text-white shadow-xl xl:sticky xl:top-0"><p className="text-xs font-black uppercase tracking-[0.2em] text-green-300">Sale summary</p><div className="mt-5 space-y-2 text-sm">{lines.filter(line => line.quantity).map(line => <p key={line.code} className="flex justify-between"><span>{line.quantity} x {line.label}</span><strong>{money(line.totalCents)}</strong></p>)}{!visitorCount && <p className="text-green-200/60">No tickets selected</p>}</div><div className="mt-5 border-t border-white/20 pt-4"><p className="flex justify-between text-sm"><span>Subtotal</span><strong>{money(subtotalCents)}</strong></p><p className="mt-2 flex justify-between text-sm"><span>Discount</span><strong>-{money(discountCents)}</strong></p><p className="mt-4 flex justify-between text-2xl font-black"><span>Total</span><strong>{money(totalCents)}</strong></p>{form.paymentMethod === 'cash' && <p className="mt-2 flex justify-between text-sm text-green-200"><span>Change</span><strong>{money(Math.max(receivedCents - totalCents, 0))}</strong></p>}</div></div>
                    {receipt && <div className="receipt-preview rounded-2xl border border-gray-300 bg-gray-200 p-3"><div className="mb-3 flex items-center justify-between"><div><strong className="text-sm">Receipt preview</strong><p className="text-[11px] text-gray-500">{printerPreferences.mode === 'windows' ? `Windows: ${printerPreferences.windowsPrinterName}` : printerPreferences.mode === 'usb' ? 'WebUSB Direct ESC/POS' : 'System Print Dialog'} / {paperWidth}</p></div>{sale?.status === 'voided' && <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-black text-red-700">VOIDED</span>}</div><div className="max-h-[60vh] overflow-auto"><ThermalReceipt receipt={receipt} paperWidth={paperWidth} isReprint={isReprint} /></div><div className="mt-3 grid grid-cols-2 gap-2"><button onClick={() => printReceipt(false)} className="flex items-center justify-center gap-2 rounded-xl bg-green-500 px-3 py-3 text-sm font-black text-gray-950"><Print size={18} />Print receipt</button><button onClick={() => printReceipt(true)} className="rounded-xl border border-gray-400 bg-white px-3 py-3 text-sm font-black">Print again</button><button onClick={resetDraft} className="rounded-xl border border-gray-400 bg-white px-3 py-3 text-sm font-black">New walk-in</button><button onClick={() => setShowVoid(true)} disabled={sale?.status === 'voided'} className="flex items-center justify-center gap-2 rounded-xl border border-red-300 bg-red-50 px-3 py-3 text-sm font-black text-red-700 disabled:opacity-40"><Trash size={17} />Void</button></div></div>}
                </aside>
            </div>
            <ConfirmationModal isOpen={showConfirm} title="Complete walk-in sale?" message={`Record ${visitorCount} visitor(s) and collect ${money(totalCents)} through ${selectedMethod?.label}?`} confirmLabel="Complete sale" loading={submitting} onConfirm={completeSale} onClose={() => setShowConfirm(false)} />
            <ConfirmationModal isOpen={showVoid} title="Void this sale?" message="The sale will remain recorded, its payment will be marked void, and capacity will be released." danger requireInput inputLabel="Void reason" inputValue={voidReason} onInputChange={setVoidReason} confirmDisabled={voidReason.trim().length < 3} loading={submitting} onConfirm={voidSale} onClose={() => setShowVoid(false)} />
        </div>
    );
};

export default StaffWalkIn;
