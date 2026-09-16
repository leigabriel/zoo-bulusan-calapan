import { useDeferredValue, useEffect, useState } from 'react';
import { Print, Search, Trash as TrashIcon } from 'reicon-react';
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
    const [selectedRows, setSelectedRows] = useState(new Set());
    const [trashTarget, setTrashTarget] = useState(null);
    const [trashLoading, setTrashLoading] = useState(false);
    const deferredSearch = useDeferredValue(filters.search);
    const isTrashedView = filters.status === 'trashed';

    useEffect(() => {
        let active = true;
        setLoading(true);
        setSelectedRows(new Set());
        const fetchFn = isTrashedView
            ? staffAPI.getTrashWalkIns({ page, limit: 15, search: deferredSearch })
            : staffAPI.getWalkInRecords({ page, limit: 15, search: deferredSearch, status: filters.status, visitDate: filters.visitDate });
        fetchFn
            .then(data => {
                if (!active) return;
                setRecords(data.records || []);
                setPagination(data.pagination || { page: 1, pages: 1, total: 0 });
            })
            .catch(error => notify.error(error.message))
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [deferredSearch, filters.status, filters.visitDate, page, isTrashedView]);

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

    const toggleRowSelect = (saleNumber) => {
        setSelectedRows(prev => {
            const next = new Set(prev);
            if (next.has(saleNumber)) next.delete(saleNumber);
            else next.add(saleNumber);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selectedRows.size === records.length) {
            setSelectedRows(new Set());
        } else {
            setSelectedRows(new Set(records.map(r => r.saleNumber)));
        }
    };

    const trashRecord = async (saleNumber) => {
        setTrashLoading(true);
        try {
            await staffAPI.trashWalkIn(saleNumber);
            setRecords(prev => prev.filter(r => r.saleNumber !== saleNumber));
            setSelectedRows(prev => { const next = new Set(prev); next.delete(saleNumber); return next; });
            setPagination(prev => ({ ...prev, total: prev.total - 1 }));
            notify.success('Record moved to trash.');
        } catch (error) {
            notify.error(error.message);
        } finally {
            setTrashLoading(false);
            setTrashTarget(null);
        }
    };

    const trashSelected = async () => {
        const targets = [...selectedRows];
        if (targets.length === 0) return;
        setTrashLoading(true);
        let successCount = 0;
        for (const saleNumber of targets) {
            try {
                await staffAPI.trashWalkIn(saleNumber);
                successCount++;
            } catch (error) {
                notify.error(`Failed to trash ${saleNumber}: ${error.message}`);
            }
        }
        if (successCount > 0) {
            setRecords(prev => prev.filter(r => !selectedRows.has(r.saleNumber)));
            setSelectedRows(new Set());
            setPagination(prev => ({ ...prev, total: prev.total - successCount }));
            notify.success(`${successCount} record(s) moved to trash.`);
        }
        setTrashLoading(false);
    };

    const restoreRecord = async (saleNumber) => {
        try {
            await staffAPI.restoreWalkIn(saleNumber);
            setRecords(prev => prev.filter(r => r.saleNumber !== saleNumber));
            setPagination(prev => ({ ...prev, total: prev.total - 1 }));
            notify.success('Record restored.');
        } catch (error) {
            notify.error(error.message);
        }
    };

    const restoreSelected = async () => {
        const targets = [...selectedRows];
        if (targets.length === 0) return;
        let successCount = 0;
        for (const saleNumber of targets) {
            try {
                await staffAPI.restoreWalkIn(saleNumber);
                successCount++;
            } catch (error) {
                notify.error(`Failed to restore ${saleNumber}: ${error.message}`);
            }
        }
        if (successCount > 0) {
            setRecords(prev => prev.filter(r => !selectedRows.has(r.saleNumber)));
            setSelectedRows(new Set());
            setPagination(prev => ({ ...prev, total: prev.total - successCount }));
            notify.success(`${successCount} record(s) restored.`);
        }
    };

    return <div className="mx-auto max-w-[1800px] space-y-5">
        <header><p className="text-xs font-bold uppercase tracking-[0.16em] text-green-700">Admissions</p><h1 className="mt-1 text-2xl font-black text-gray-950">Walk-In Records</h1><p className="mt-1 text-sm text-gray-400">{pagination.total} recorded sales</p></header>
        <section className="grid gap-3 rounded-xl border border-gray-200 bg-white p-3 sm:grid-cols-[1fr_170px_170px]">
            <label className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" /><input value={filters.search} onChange={event => updateFilter('search', event.target.value)} placeholder="Search receipt, visitor, or phone" className="w-full rounded-lg border border-gray-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-green-500" /></label>
            <select value={filters.status} onChange={event => updateFilter('status', event.target.value)} className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-green-500"><option value="">All statuses</option><option value="completed">Completed</option><option value="voided">Voided</option><option value="trashed">Trashed</option></select>
            <input type="date" value={filters.visitDate} onChange={event => updateFilter('visitDate', event.target.value)} className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-green-500" />
        </section>

        {selectedRows.size > 0 && (
            <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-3">
                <span className="text-sm font-medium text-green-800">{selectedRows.size} selected</span>
                {isTrashedView ? (
                    <button onClick={restoreSelected} className="rounded-lg bg-green-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-green-600">Restore Selected</button>
                ) : (
                    <button onClick={trashSelected} disabled={trashLoading} className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-600 disabled:opacity-50">Trash Selected</button>
                )}
                <button onClick={() => setSelectedRows(new Set())} className="text-xs font-bold text-gray-500 hover:text-gray-700">Cancel</button>
            </div>
        )}

        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            {loading ? <div className="p-10 text-center text-sm text-gray-400">Loading records...</div> : records.length === 0 ? <div className="p-10 text-center text-sm text-gray-400">{isTrashedView ? 'No trashed records.' : 'No walk-in records found.'}</div> : <div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="border-b border-gray-200 bg-gray-50 text-[10px] uppercase tracking-wider text-gray-400"><tr>
                <th className="px-4 py-3 w-10"><input type="checkbox" checked={selectedRows.size === records.length && records.length > 0} onChange={toggleSelectAll} className="rounded border-gray-300 accent-green-500" /></th>
                <th className="px-4 py-3">Receipt</th><th className="px-4 py-3">Visitor</th><th className="px-4 py-3">Visit</th><th className="px-4 py-3">Tickets</th><th className="px-4 py-3">Total</th><th className="px-4 py-3">Payment</th><th className="px-4 py-3">Status</th><th className="px-4 py-3"></th>
            </tr></thead><tbody className="divide-y divide-gray-100">{records.map(record => <tr key={record.saleNumber} className="transition hover:bg-green-50">
                <td className="px-4 py-3"><input type="checkbox" checked={selectedRows.has(record.saleNumber)} onChange={() => toggleRowSelect(record.saleNumber)} onClick={e => e.stopPropagation()} className="rounded border-gray-300 accent-green-500" /></td>
                <td className="px-4 py-3 cursor-pointer" onClick={() => openRecord(record.saleNumber)}><p className="font-mono text-xs font-bold text-gray-900">{record.receiptNumber}</p><p className="mt-1 text-[10px] text-gray-400">{dateTime(record.createdAt)}</p></td>
                <td className="px-4 py-3 cursor-pointer" onClick={() => openRecord(record.saleNumber)}><p className="font-bold text-gray-900">{record.visitorName || 'Walk-in visitor'}</p><p className="text-xs text-gray-400">{record.visitorPhone || '-'}</p></td>
                <td className="px-4 py-3 text-gray-600 cursor-pointer" onClick={() => openRecord(record.saleNumber)}>{record.visitDate}</td>
                <td className="px-4 py-3 font-bold cursor-pointer" onClick={() => openRecord(record.saleNumber)}>{record.totalVisitors}</td>
                <td className="px-4 py-3 font-black cursor-pointer" onClick={() => openRecord(record.saleNumber)}>{money(record.totalCents, record.currency)}</td>
                <td className="px-4 py-3 cursor-pointer" onClick={() => openRecord(record.saleNumber)}><p className="font-bold uppercase">{record.paymentMethod}</p><p className="text-[10px] uppercase text-gray-400">{record.paymentStatus}</p></td>
                <td className="px-4 py-3 cursor-pointer" onClick={() => openRecord(record.saleNumber)}><span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${record.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{record.status}</span></td>
                <td className="px-4 py-3">
                    {isTrashedView ? (
                        <button onClick={(e) => { e.stopPropagation(); restoreRecord(record.saleNumber); }} className="rounded-lg border border-green-200 bg-green-50 p-2 text-green-700 hover:bg-green-100" title="Restore">Restore</button>
                    ) : (
                        <button onClick={(e) => { e.stopPropagation(); setTrashTarget(record); }} className="rounded-lg border border-gray-200 bg-gray-50 p-2 text-gray-500 hover:border-red-300 hover:bg-red-50 hover:text-red-600" title="Move to trash"><TrashIcon className="h-4 w-4" /></button>
                    )}
                </td>
            </tr>)}</tbody></table></div>}
            <footer className="flex items-center justify-between border-t border-gray-100 px-4 py-3 text-xs text-gray-500"><span>Page {pagination.page} of {pagination.pages}</span><div className="flex gap-2"><button disabled={page <= 1 || loading} onClick={() => setPage(current => current - 1)} className="rounded-lg border border-gray-200 px-3 py-2 font-bold disabled:opacity-40">Previous</button><button disabled={page >= pagination.pages || loading} onClick={() => setPage(current => current + 1)} className="rounded-lg border border-gray-200 px-3 py-2 font-bold disabled:opacity-40">Next</button></div></footer>
        </section>

        {(selected || detailLoading) && <div className="fixed inset-0 z-[220] flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4" role="dialog" aria-modal="true"><button className="absolute inset-0" onClick={closeRecord} aria-label="Close details" />{detailLoading ? <div className="relative rounded-xl bg-white p-8 text-sm font-bold">Loading details...</div> : <div className="relative max-h-[92dvh] w-full max-w-6xl overflow-y-auto rounded-t-2xl bg-white p-5 shadow-2xl sm:rounded-2xl"><div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-green-700">{selected.receiptNumber}</p><h2 className="mt-1 text-2xl font-black">Walk-in details</h2><p className="mt-1 text-sm text-gray-500">Sale {selected.saleNumber}</p></div><button onClick={closeRecord} className="h-9 w-9 rounded-lg border border-gray-200 text-xl">&times;</button></div><div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]"><div className="space-y-4"><div className="grid grid-cols-2 gap-4 rounded-xl bg-gray-50 p-5 text-sm sm:grid-cols-4"><div><p className="text-xs text-gray-400">Customer name</p><strong>{selected.visitorName || 'Walk-in visitor'}</strong></div><div><p className="text-xs text-gray-400">Contact</p><strong>{selected.visitorPhone || '-'}</strong></div><div><p className="text-xs text-gray-400">Visit date</p><strong>{selected.visitDate}</strong></div><div><p className="text-xs text-gray-400">Cashier</p><strong>{selected.staffName || '-'}</strong></div></div><div className="divide-y divide-gray-100 rounded-xl border border-gray-200">{selected.items.map(item => <div key={item.categoryCode} className="flex justify-between gap-4 p-4 text-sm"><span><strong>{item.quantity} x {item.categoryLabel}</strong><small className="ml-2 text-gray-400">{money(item.unitPriceCents, selected.currency)} each</small></span><strong>{money(item.lineTotalCents, selected.currency)}</strong></div>)}</div><div className="grid grid-cols-2 gap-4 rounded-xl bg-gray-50 p-5 text-sm sm:grid-cols-4"><div><p className="text-xs text-gray-400">Subtotal</p><strong>{money(selected.subtotalCents, selected.currency)}</strong></div><div><p className="text-xs text-gray-400">Discount</p><strong>{money(selected.discountCents, selected.currency)}</strong></div><div><p className="text-xs text-gray-400">Total</p><strong className="text-green-700">{money(selected.totalCents, selected.currency)}</strong></div><div><p className="text-xs text-gray-400">Payment</p><strong className="uppercase">{selected.payment?.method}</strong><p className="text-[10px] uppercase text-gray-400">{selected.payment?.status}</p></div></div>{selected.status === 'voided' && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm"><p className="font-bold text-red-700">Voided{selected.voidedByName ? ` by ${selected.voidedByName}` : ''}{selected.voidedAt ? ` on ${dateTime(selected.voidedAt)}` : ''}</p><p className="mt-1 text-red-600">{selected.voidReason}</p></div>}</div><div className="space-y-4"><div className="rounded-xl border border-gray-200 p-4 text-center"><p className="text-xs text-gray-400">Receipt</p><div className="mt-3 flex flex-col gap-2"><button disabled={printing} onClick={reprint} className="w-full rounded-lg bg-green-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-green-600 disabled:opacity-50">{printing ? 'Printing...' : 'Reprint Receipt'}</button></div></div></div></div></div>}</div>}
    </div>;
};

export default WalkInRecords;
