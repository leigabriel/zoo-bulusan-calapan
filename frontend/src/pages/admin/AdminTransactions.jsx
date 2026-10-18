import { useEffect, useState } from 'react';
import { CloseCircle, DollarCircle, Download, Receipt, User } from 'reicon-react';
import * as XLSX from 'xlsx';
import { adminAPI } from '../../services/api-client';
import { formatSafeDate } from '../../utils/format-date';
import { paymentMethodLabel } from '../../utils/payment-status';
import { notify } from '../../utils/toast';

const statusStyles = {
    paid: 'bg-green-50 text-green-800 border-green-300',
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    failed: 'bg-red-50 text-red-700 border-red-200',
    refunded: 'bg-slate-100 text-slate-700 border-slate-200'
};

const typeLabels = {
    ticket: 'Ticket reservation',
    event: 'Event reservation'
};

const EXPORT_HEADERS = [
    'Type',
    'Reference',
    'Payment reference',
    'Customer',
    'Email',
    'Phone',
    'Booking',
    'Schedule date',
    'Schedule time',
    'Participants',
    'Adult',
    'Child',
    'Bulusan resident',
    'Payment method',
    'Amount (PHP)',
    'Payment status',
    'Reservation status',
    'Verification status',
    'Refund status',
    'Paid on',
    'Booked on',
    'Notes'
];

// formatSafeDate answers '-' for anything missing; an export cell should just be blank.
const exportDate = (value, options) => {
    const formatted = formatSafeDate(value, options);
    return formatted === '-' ? '' : formatted;
};

const participantCount = transaction => Number(transaction?.participants) || 0;

/**
 * One row per transaction, in exactly EXPORT_HEADERS order, so no column can
 * drift out of alignment with its heading.
 */
const exportRow = transaction => [
    typeLabels[transaction.type] || transaction.type || '',
    transaction.reference || '',
    transaction.paymentReference || '',
    transaction.customer || '',
    transaction.email || '',
    transaction.phone || '',
    transaction.event || '',
    exportDate(transaction.scheduleDate, { dateStyle: 'medium' }),
    transaction.scheduleTime || '',
    participantCount(transaction),
    Number(transaction.adultQuantity) || 0,
    Number(transaction.childQuantity) || 0,
    Number(transaction.residentQuantity) || 0,
    transaction.method ? paymentMethodLabel(transaction.method) : '',
    Number(transaction.amount) || 0,
    transaction.status || '',
    transaction.reservationStatus || '',
    transaction.verificationStatus || '',
    transaction.refundStatus ? transaction.refundStatus.replace(/_/g, ' ') : '',
    exportDate(transaction.paidAt, { dateStyle: 'medium', timeStyle: 'short' }),
    exportDate(transaction.createdAt, { dateStyle: 'medium', timeStyle: 'short' }),
    transaction.notes || ''
];

// Width per column taken from its widest cell, so headings never clip.
const fitColumns = (rows, columnCount) => Array.from({ length: columnCount }, (_, index) => ({
    wch: Math.min(rows.reduce((widest, row) => {
        const cell = row[index];
        if (cell === null || cell === undefined) return widest;
        return Math.max(widest, String(cell).length + 2);
    }, 12), 36)
}));

const formatAmount = amount => Number(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 });

const AdminTransactions = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedTransaction, setSelectedTransaction] = useState(null);

    useEffect(() => {
        adminAPI.getTransactions()
            .then(response => {
                if (!response.success) throw new Error(response.message || 'Unable to load transactions.');
                setTransactions(response.transactions || []);
            })
            .catch(err => setError(err.message || 'Unable to load transactions.'))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (!selectedTransaction) return undefined;
        const closeOnEscape = event => {
            if (event.key === 'Escape') setSelectedTransaction(null);
        };
        window.addEventListener('keydown', closeOnEscape);
        return () => window.removeEventListener('keydown', closeOnEscape);
    }, [selectedTransaction]);

    const paidTotal = transactions.filter(transaction => transaction.status === 'paid')
        .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);

    const exportToExcel = () => {
        if (transactions.length === 0) {
            notify.info('There are no transactions to export.');
            return;
        }

        try {
            const sumAmount = list => list.reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);
            const withType = type => transactions.filter(transaction => transaction.type === type);
            const paidTransactions = transactions.filter(transaction => transaction.status === 'paid');

            const summaryRows = [
                ['Metric', 'Value'],
                ['Generated at', new Date().toLocaleString('en-US')],
                ['Transactions exported', transactions.length],
                ['Ticket reservations', withType('ticket').length],
                ['Event reservations', withType('event').length],
                ['Paid total (PHP)', sumAmount(paidTransactions)],
                ['Pending total (PHP)', sumAmount(transactions.filter(transaction => transaction.status === 'pending'))],
                ['Refunded total (PHP)', sumAmount(transactions.filter(transaction => transaction.status === 'refunded'))],
                ['Failed or expired total (PHP)', sumAmount(transactions.filter(transaction => transaction.status === 'failed' || transaction.status === 'expired'))],
                ['All transactions total (PHP)', sumAmount(transactions)],
                ['Adult tickets', transactions.reduce((sum, transaction) => sum + (Number(transaction.adultQuantity) || 0), 0)],
                ['Child tickets', transactions.reduce((sum, transaction) => sum + (Number(transaction.childQuantity) || 0), 0)],
                ['Bulusan resident tickets', transactions.reduce((sum, transaction) => sum + (Number(transaction.residentQuantity) || 0), 0)],
                ['Visitors booked', withType('ticket').reduce((sum, transaction) => sum + participantCount(transaction), 0)],
                ['Participants booked', withType('event').reduce((sum, transaction) => sum + participantCount(transaction), 0)],
                ['Refunds requested', transactions.filter(transaction => transaction.refundStatus).length]
            ];

            const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows);
            summarySheet['!cols'] = fitColumns(summaryRows, 2);
            summaryRows.forEach((row, index) => {
                if (typeof row[1] === 'number' && String(row[0]).includes('PHP')) {
                    summarySheet[XLSX.utils.encode_cell({ r: index, c: 1 })].z = '#,##0.00';
                }
            });

            const rows = transactions.map(exportRow);
            const detailSheet = XLSX.utils.aoa_to_sheet([EXPORT_HEADERS, ...rows]);
            detailSheet['!cols'] = fitColumns([EXPORT_HEADERS, ...rows], EXPORT_HEADERS.length);
            detailSheet['!autofilter'] = { ref: detailSheet['!ref'] };
            const amountColumn = EXPORT_HEADERS.indexOf('Amount (PHP)');
            rows.forEach((_, index) => {
                const cell = detailSheet[XLSX.utils.encode_cell({ r: index + 1, c: amountColumn })];
                if (cell && cell.t === 'n') cell.z = '#,##0.00';
            });

            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, detailSheet, 'Transactions');
            XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
            XLSX.writeFile(workbook, `Zoo_Transactions_${new Date().toISOString().slice(0, 10)}.xlsx`);
            notify.success(`Exported ${transactions.length} transaction${transactions.length === 1 ? '' : 's'}.`);
        } catch (err) {
            console.error('Error exporting transactions:', err);
            notify.error("Couldn't export transactions.");
        }
    };

    return (
        <div className="space-y-6">
            <div className="rounded-2xl border border-green-300 bg-white p-6 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-green-800">Finance</p>
                <div className="mt-1 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                    <div><h1 className="text-2xl font-bold text-gray-900">Transactions</h1><p className="mt-1 text-sm text-gray-500">Ticket and event payments, with refund requests.</p></div>
                    <div className="flex flex-col items-stretch gap-3 sm:items-end">
                        <div className="rounded-xl bg-green-50 px-4 py-3 text-left sm:text-right"><p className="text-xs text-green-800">Paid total</p><p className="text-xl font-bold text-green-800">₱{formatAmount(paidTotal)}</p></div>
                        <button type="button" onClick={exportToExcel} disabled={loading || transactions.length === 0} className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-800 bg-emerald-900 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"><Download className="h-4 w-4" />Export Excel</button>
                    </div>
                </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-green-300 bg-white shadow-sm">
                {loading ? <div className="p-10 text-center text-sm text-gray-500">Loading transactions...</div> : error ? <div className="p-10 text-center text-sm text-red-600">{error}</div> : transactions.length === 0 ? <div className="p-10 text-center text-sm text-gray-500">No payment transactions yet.</div> : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-sm">
                            <thead className="border-b border-green-300 bg-green-50/60 text-xs uppercase tracking-wider text-gray-500">
                                <tr>
                                    <th className="px-5 py-4">Type</th>
                                    <th className="px-5 py-4">Reference</th>
                                    <th className="px-5 py-4">Customer</th>
                                    <th className="px-5 py-4">Booking</th>
                                    <th className="px-5 py-4">Amount</th>
                                    <th className="px-5 py-4">Status</th>
                                    <th className="px-5 py-4">Paid on</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-green-100">
                                {transactions.map(transaction => (
                                    <tr key={`${transaction.type}-${transaction.id}`} role="button" tabIndex={0} onClick={() => setSelectedTransaction(transaction)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setSelectedTransaction(transaction); } }} className="cursor-pointer transition hover:bg-green-50 focus:bg-green-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-green-500">
                                        <td className="px-5 py-4"><span className="whitespace-nowrap rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-800">{typeLabels[transaction.type] || transaction.type}</span></td>
                                        <td className="px-5 py-4"><p className="font-mono text-xs text-green-800">{transaction.reference}</p><p className="mt-1 max-w-40 truncate text-[10px] text-gray-400">{transaction.paymentReference || 'No payment reference'}</p></td>
                                        <td className="px-5 py-4"><p className="font-medium text-gray-900">{transaction.customer}</p><p className="text-xs text-gray-500">{transaction.email}</p></td>
                                        <td className="px-5 py-4"><p className="text-gray-700">{transaction.event}</p><p className="mt-1 text-xs text-gray-500">{formatSafeDate(transaction.scheduleDate, { dateStyle: 'medium' })}{transaction.scheduleTime ? ` · ${transaction.scheduleTime}` : ''}</p></td>
                                        <td className="px-5 py-4 font-semibold text-gray-900">₱{formatAmount(transaction.amount)}</td>
                                        <td className="px-5 py-4"><span className={`rounded-full border px-2.5 py-1 text-xs font-semibold uppercase ${statusStyles[transaction.status] || statusStyles.pending}`}>{transaction.status}</span>{transaction.refundStatus && <p className="mt-1 text-[10px] font-semibold uppercase text-amber-700">Refund {transaction.refundStatus.replace(/_/g, ' ')}</p>}</td>
                                        <td className="px-5 py-4 whitespace-nowrap text-gray-600">{formatSafeDate(transaction.paidAt, { dateStyle: 'medium', timeStyle: 'short' })}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {selectedTransaction && <div className="fixed inset-0 z-[220] flex items-center justify-center bg-gray-950/55 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="transaction-detail-title"><button type="button" className="absolute inset-0" onClick={() => setSelectedTransaction(null)} aria-label="Close transaction details" /><article className="relative max-h-[92dvh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white shadow-2xl"><header className="flex items-start justify-between border-b border-green-100 bg-gradient-to-r from-green-300 via-green-400 to-green-500 p-6"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-green-950/70">Payment record</p><h2 id="transaction-detail-title" className="mt-1 text-2xl font-black text-gray-950">Transaction details</h2><p className="mt-2 font-mono text-sm text-green-950">{selectedTransaction.reference}</p></div><button type="button" onClick={() => setSelectedTransaction(null)} className="rounded-xl bg-white/40 p-2 text-gray-900 transition hover:bg-white/60" aria-label="Close"><CloseCircle className="h-5 w-5" /></button></header><div className="grid gap-6 p-6 lg:grid-cols-[1.2fr_0.8fr]"><div className="space-y-5"><section className="rounded-2xl border border-green-100 p-5"><div className="mb-4 flex items-center gap-3"><span className="rounded-xl bg-green-100 p-2 text-green-800"><User className="h-5 w-5" /></span><h3 className="font-bold text-gray-900">Customer</h3></div><div className="grid gap-4 sm:grid-cols-2"><div><p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Name</p><p className="mt-1 font-bold text-gray-900">{selectedTransaction.customer || 'Not provided'}</p></div><div><p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Email</p><p className="mt-1 break-all text-gray-700">{selectedTransaction.email || 'Not provided'}</p></div><div><p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Phone</p><p className="mt-1 text-gray-700">{selectedTransaction.phone || 'Not provided'}</p></div><div><p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{selectedTransaction.type === 'ticket' ? 'Visitors' : 'Participants'}</p><p className="mt-1 font-bold text-gray-900">{participantCount(selectedTransaction)}</p></div>{selectedTransaction.type === 'ticket' && <div className="sm:col-span-2"><p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Party</p><p className="mt-1 text-gray-700">{selectedTransaction.adultQuantity} adult · {selectedTransaction.childQuantity} child · {selectedTransaction.residentQuantity} Bulusan resident</p></div>}</div></section><section className="rounded-2xl border border-green-100 p-5"><div className="mb-4 flex items-center gap-3"><span className="rounded-xl bg-green-100 p-2 text-green-800"><Receipt className="h-5 w-5" /></span><h3 className="font-bold text-gray-900">Reservation and payment</h3></div><dl className="grid gap-4 sm:grid-cols-2"><div><dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">Type</dt><dd className="mt-1 font-semibold text-gray-900">{typeLabels[selectedTransaction.type] || selectedTransaction.type}</dd></div><div><dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">Booking</dt><dd className="mt-1 font-semibold text-gray-900">{selectedTransaction.event || '-'}</dd></div><div><dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">Schedule</dt><dd className="mt-1 font-semibold text-gray-900">{formatSafeDate(selectedTransaction.scheduleDate, { dateStyle: 'medium' })}{selectedTransaction.scheduleTime ? ` · ${selectedTransaction.scheduleTime}` : ''}</dd></div><div><dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">Reservation status</dt><dd className="mt-1 font-semibold capitalize text-gray-900">{(selectedTransaction.reservationStatus || '-').replace(/_/g, ' ')}</dd></div>{selectedTransaction.type === 'ticket' && <div><dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">Verification</dt><dd className="mt-1 font-semibold capitalize text-gray-900">{(selectedTransaction.verificationStatus || '-').replace(/_/g, ' ')}</dd></div>}<div><dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">Payment method</dt><dd className="mt-1 font-semibold text-gray-900">{selectedTransaction.method ? paymentMethodLabel(selectedTransaction.method) : '-'}</dd></div><div><dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">Payment reference</dt><dd className="mt-1 break-all font-mono text-xs text-gray-700">{selectedTransaction.paymentReference || '-'}</dd></div><div><dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">Paid on</dt><dd className="mt-1 text-gray-700">{formatSafeDate(selectedTransaction.paidAt, { dateStyle: 'full', timeStyle: 'short' })}</dd></div><div><dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">Booked on</dt><dd className="mt-1 text-gray-700">{formatSafeDate(selectedTransaction.createdAt, { dateStyle: 'full', timeStyle: 'short' })}</dd></div></dl></section></div><aside className="rounded-2xl bg-gray-950 p-6 text-white"><DollarCircle className="h-8 w-8 text-green-300" /><p className="mt-8 text-xs font-bold uppercase tracking-[0.16em] text-gray-400">Amount paid</p><p className="mt-2 text-4xl font-black text-green-300">₱{formatAmount(selectedTransaction.amount)}</p><div className="mt-8 space-y-4 border-t border-white/10 pt-5"><div className="flex items-center justify-between gap-3"><span className="text-sm text-gray-400">Payment status</span><span className={`rounded-full border px-3 py-1 text-xs font-bold uppercase ${statusStyles[selectedTransaction.status] || statusStyles.pending}`}>{selectedTransaction.status}</span></div><div className="flex items-center justify-between gap-3"><span className="text-sm text-gray-400">Refund status</span><span className="text-sm font-bold capitalize">{selectedTransaction.refundStatus?.replace(/_/g, ' ') || 'None'}</span></div></div></aside></div></article></div>}
        </div>
    );
};

export default AdminTransactions;