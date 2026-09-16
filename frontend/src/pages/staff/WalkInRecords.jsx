import { useDeferredValue, useEffect, useState } from 'react';
import { Print, Search } from 'reicon-react';
import { staffAPI } from '../../services/api-client';
import { browserPrintAdapter } from '../../services/printing/browser-print-adapter';
import { webUsbPrintAdapter } from '../../services/printing/web-usb-print-adapter';
import { loadPrinterPreferences } from '../../services/printing/printer-service';
import { notify } from '../../utils/toast';
import ThermalReceipt from '../../components/printing/ThermalReceipt';

const money = (cents, currency = 'PHP') => `${currency} ${(Number(cents || 0) / 100).toFixed(2)}`;
const dateTime = value => value ? new Date(value).toLocaleString('en-PH', { timeZone: 'Asia/Manila' }) : '-';

const WalkInRecords = () => {
    const [records, setRecords] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
    const [filters, setFilters] = useState({ search: '', status: '', visitDate: '' });
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [printing, setPrinting] = useState(false);
    const deferredSearch = useDeferredValue(filters.search);

    useEffect(() => {
        let active = true;
        setLoading(true);
        staffAPI.getWalkInRecords({ page, limit: 15, search: deferredSearch, status: filters.status, visitDate: filters.visitDate })
            .then(data => {
                if (!active) return;
                setRecords(data.records || []);
                setPagination(data.pagination || { page: 1, pages: 1, total: 0 });
            })
            .catch(error => notify.error(error.message))
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [deferredSearch, filters.status, filters.visitDate, page]);

    useEffect(() => {
        if (!selected && !detailLoading) return undefined;
        const closeOnEscape = event => {
            if (event.key === 'Escape') {
                setSelected(null);
                setDetailLoading(false);
            }
        };
        window.addEventListener('keydown', closeOnEscape);
        return () => window.removeEventListener('keydown', closeOnEscape);
    }, [selected, detailLoading]);

    const updateFilter = (key, value) => {
        setPage(1);
        setFilters(current => ({ ...current, [key]: value }));
    };

    const openRecord = async saleNumber => {
        setDetailLoading(true);
        try {
            const data = await staffAPI.getWalkIn(saleNumber);
            setSelected(data.sale);
        } catch (error) {
            notify.error(error.message);
        } finally {
            setDetailLoading(false);
        }
    };

    const closeRecord = () => {
        setSelected(null);
        setDetailLoading(false);
    };

    const reprint = async () => {
        const preferences = loadPrinterPreferences();
        setPrinting(true);
        try {
            await staffAPI.logWalkInReceiptEvent(selected.saleNumber, 'reprint_requested');
            if (preferences.mode === 'windows') {
                if (!preferences.windowsPrinterName) throw new Error('Select a Windows printer from the Walk-In print menu first.');
                await staffAPI.printWindowsReceipt({ printerName: preferences.windowsPrinterName, saleNumber: selected.saleNumber, reprint: true });
                notify.success('Reprint queued.');
            } else if (preferences.mode === 'usb') {
                if (webUsbPrintAdapter.getState().status !== 'Connected') await webUsbPrintAdapter.reconnect(preferences.usbDevice);
                await webUsbPrintAdapter.printReceipt(selected.receipt, { reprint: true });
                notify.success('Reprint sent to PT210.');
            } else {
                await browserPrintAdapter.print();
            }
        } catch (error) {
            notify.error(error.message);
        } finally {
            setPrinting(false);
        }
    };

    return <div className="mx-auto max-w-[1800px] space-y-5">
        <header><p className="text-xs font-bold uppercase tracking-[0.16em] text-green-700">Admissions</p><h1 className="mt-1 text-2xl font-black text-gray-950">Walk-In Records</h1><p className="mt-1 text-sm text-gray-400">{pagination.total} recorded sales</p></header>
        <section className="grid gap-3 rounded-xl border border-gray-200 bg-white p-3 sm:grid-cols-[1fr_170px_170px]">
            <label className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" /><input value={filters.search} onChange={event => updateFilter('search', event.target.value)} placeholder="Search receipt, visitor, or phone" className="w-full rounded-lg border border-gray-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-green-500" /></label>
            <select value={filters.status} onChange={event => updateFilter('status', event.target.value)} className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-green-500"><option value="">All statuses</option><option value="completed">Completed</option><option value="voided">Voided</option></select>
            <input type="date" value={filters.visitDate} onChange={event => updateFilter('visitDate', event.target.value)} className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-green-500" />
        </section>
        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            {loading ? <div className="p-10 text-center text-sm text-gray-400">Loading records...</div> : records.length === 0 ? <div className="p-10 text-center text-sm text-gray-400">No walk-in records found.</div> : <div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="border-b border-gray-200 bg-gray-50 text-[10px] uppercase tracking-wider text-gray-400"><tr><th className="px-4 py-3">Receipt</th><th className="px-4 py-3">Visitor</th><th className="px-4 py-3">Visit</th><th className="px-4 py-3">Tickets</th><th className="px-4 py-3">Total</th><th className="px-4 py-3">Payment</th><th className="px-4 py-3">Status</th><th className="px-4 py-3"></th></tr></thead><tbody className="divide-y divide-gray-100">{records.map(record => <tr key={record.saleNumber} role="button" tabIndex={0} onClick={() => openRecord(record.saleNumber)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openRecord(record.saleNumber); } }} className="cursor-pointer transition hover:bg-green-50 focus:bg-green-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-green-500"><td className="px-4 py-3"><p className="font-mono text-xs font-bold text-gray-900">{record.receiptNumber}</p><p className="mt-1 text-[10px] text-gray-400">{dateTime(record.createdAt)}</p></td><td className="px-4 py-3"><p className="font-bold text-gray-900">{record.visitorName || 'Walk-in visitor'}</p><p className="text-xs text-gray-400">{record.visitorPhone || '-'}</p></td><td className="px-4 py-3 text-gray-600">{record.visitDate}</td><td className="px-4 py-3 font-bold">{record.totalVisitors}</td><td className="px-4 py-3 font-black">{money(record.totalCents, record.currency)}</td><td className="px-4 py-3"><p className="font-bold uppercase">{record.paymentMethod}</p><p className="text-[10px] uppercase text-gray-400">{record.paymentStatus}</p></td><td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-[10px] font-black uppercase ${record.status === 'voided' ? 'bg-red-50 text-red-700' : record.checkedInAt ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'}`}>{record.status === 'voided' ? 'Voided' : record.checkedInAt ? 'Checked in' : 'Completed'}</span></td><td className="px-4 py-3 text-right"><button onClick={event => { event.stopPropagation(); openRecord(record.saleNumber); }} className="font-bold text-green-700 hover:underline">Details</button></td></tr>)}</tbody></table></div>}
            <footer className="flex items-center justify-between border-t border-gray-100 px-4 py-3 text-xs text-gray-500"><span>Page {pagination.page} of {pagination.pages}</span><div className="flex gap-2"><button disabled={page <= 1 || loading} onClick={() => setPage(current => current - 1)} className="rounded-lg border border-gray-200 px-3 py-2 font-bold disabled:opacity-40">Previous</button><button disabled={page >= pagination.pages || loading} onClick={() => setPage(current => current + 1)} className="rounded-lg border border-gray-200 px-3 py-2 font-bold disabled:opacity-40">Next</button></div></footer>
        </section>
        {(selected || detailLoading) && <div className="fixed inset-0 z-[220] flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4" role="dialog" aria-modal="true"><button className="absolute inset-0" onClick={closeRecord} aria-label="Close details" />{detailLoading ? <div className="relative rounded-xl bg-white p-8 text-sm font-bold">Loading details...</div> : <div className="relative max-h-[92dvh] w-full max-w-6xl overflow-y-auto rounded-t-2xl bg-white p-5 shadow-2xl sm:rounded-2xl"><div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-green-700">{selected.receiptNumber}</p><h2 className="mt-1 text-2xl font-black">Walk-in details</h2><p className="mt-1 text-sm text-gray-500">Sale {selected.saleNumber}</p></div><button onClick={closeRecord} className="h-9 w-9 rounded-lg border border-gray-200 text-xl">&times;</button></div><div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]"><div className="space-y-4"><div className="grid grid-cols-2 gap-4 rounded-xl bg-gray-50 p-5 text-sm sm:grid-cols-4"><div><p className="text-xs text-gray-400">Customer name</p><strong>{selected.visitorName || 'Walk-in visitor'}</strong></div><div><p className="text-xs text-gray-400">Contact</p><strong>{selected.visitorPhone || '-'}</strong></div><div><p className="text-xs text-gray-400">Visit date</p><strong>{selected.visitDate}</strong></div><div><p className="text-xs text-gray-400">Cashier</p><strong>{selected.staffName || '-'}</strong></div></div><div className="divide-y divide-gray-100 rounded-xl border border-gray-200">{selected.items.map(item => <div key={item.categoryCode} className="flex justify-between gap-4 p-4 text-sm"><span><strong>{item.quantity} x {item.categoryLabel}</strong><small className="ml-2 text-gray-400">{money(item.unitPriceCents, selected.currency)} each</small></span><strong>{money(item.lineTotalCents, selected.currency)}</strong></div>)}</div><div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4"><div className="rounded-xl bg-gray-50 p-3"><p className="text-xs text-gray-400">Subtotal</p><strong>{money(selected.subtotalCents, selected.currency)}</strong></div><div className="rounded-xl bg-gray-50 p-3"><p className="text-xs text-gray-400">Discount</p><strong>{money(selected.discountCents, selected.currency)}</strong></div><div className="rounded-xl bg-green-50 p-3"><p className="text-xs text-green-700">Total</p><strong>{money(selected.totalCents, selected.currency)}</strong></div><div className="rounded-xl bg-gray-50 p-3"><p className="text-xs text-gray-400">Payment</p><strong className="capitalize">{selected.payment?.method || '-'}</strong></div></div><div className="grid gap-3 rounded-xl border border-gray-200 p-4 text-sm sm:grid-cols-3"><div><p className="text-xs text-gray-400">Amount received</p><strong>{money(selected.payment?.amountReceivedCents, selected.currency)}</strong></div><div><p className="text-xs text-gray-400">Change</p><strong>{money(selected.payment?.changeCents, selected.currency)}</strong></div><div><p className="text-xs text-gray-400">Provider reference</p><strong className="break-all">{selected.payment?.providerReference || '-'}</strong></div></div>{selected.status === 'voided' && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"><strong>Voided by {selected.voidedByName || 'Unknown'}</strong><p>{selected.voidReason || 'No reason provided'} · {dateTime(selected.voidedAt)}</p></div>}<div className="flex flex-wrap gap-3 text-xs text-gray-500"><span>Created: {dateTime(selected.createdAt)}</span><span>Checked in: {dateTime(selected.checkedInAt)}</span></div></div><aside className="receipt-preview rounded-xl border border-gray-200 bg-gray-100 p-3"><div className="mb-3 flex items-center justify-between"><div><p className="text-sm font-black">Receipt preview</p><p className="text-[10px] text-gray-400">{selected.receiptNumber}</p></div>{selected.status === 'voided' && <span className="rounded bg-red-100 px-2 py-1 text-[10px] font-black text-red-700">VOIDED</span>}</div><div className="max-h-[58vh] overflow-auto"><ThermalReceipt receipt={selected.receipt} paperWidth="58mm" isReprint /></div><button onClick={reprint} disabled={printing || selected.status === 'voided'} className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-green-500 px-3 py-2.5 text-xs font-black text-gray-950 disabled:opacity-40"><Print size={16} />{printing ? 'Printing...' : 'Reprint receipt'}</button></aside></div></div>}</div>}
    </div>;
};

export default WalkInRecords;
