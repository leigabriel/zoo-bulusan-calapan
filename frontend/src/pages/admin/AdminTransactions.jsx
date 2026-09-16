import { useEffect, useState } from 'react';
import { CloseCircle, DollarCircle, Receipt, User } from 'reicon-react';
import { adminAPI } from '../../services/api-client';
import { formatSafeDate } from '../../utils/format-date';

const statusStyles = {
    paid: 'bg-green-50 text-green-800 border-green-300',
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    failed: 'bg-red-50 text-red-700 border-red-200',
    refunded: 'bg-slate-100 text-slate-700 border-slate-200'
};

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

    return (
        <div className="space-y-6">
            <div className="rounded-2xl border border-green-300 bg-white p-6 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-green-800">Finance</p>
                <div className="mt-1 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                    <div><h1 className="text-2xl font-bold text-gray-900">Transactions</h1><p className="mt-1 text-sm text-gray-500">PayMongo event payments and refund requests.</p></div>
                    <div className="rounded-xl bg-green-50 px-4 py-3"><p className="text-xs text-green-800">Paid total</p><p className="text-xl font-bold text-green-800">₱{paidTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p></div>
                </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-green-300 bg-white shadow-sm">
                {loading ? <div className="p-10 text-center text-sm text-gray-500">Loading transactions...</div> : error ? <div className="p-10 text-center text-sm text-red-600">{error}</div> : transactions.length === 0 ? <div className="p-10 text-center text-sm text-gray-500">No payment transactions yet.</div> : (
                    <div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="border-b border-green-300 bg-green-50/60 text-xs uppercase tracking-wider text-gray-500"><tr><th className="px-5 py-4">Reference</th><th className="px-5 py-4">Customer</th><th className="px-5 py-4">Event</th><th className="px-5 py-4">Amount</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">Paid on</th></tr></thead><tbody className="divide-y divide-green-100">{transactions.map(transaction => <tr key={transaction.id} role="button" tabIndex={0} onClick={() => setSelectedTransaction(transaction)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setSelectedTransaction(transaction); } }} className="cursor-pointer transition hover:bg-green-50 focus:bg-green-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-green-500"><td className="px-5 py-4"><p className="font-mono text-xs text-green-800">{transaction.reference}</p><p className="mt-1 max-w-40 truncate text-[10px] text-gray-400">{transaction.paymentReference || 'No payment reference'}</p></td><td className="px-5 py-4"><p className="font-medium text-gray-900">{transaction.customer}</p><p className="text-xs text-gray-500">{transaction.email}</p></td><td className="px-5 py-4 text-gray-700">{transaction.event}</td><td className="px-5 py-4 font-semibold text-gray-900">₱{Number(transaction.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td><td className="px-5 py-4"><span className={`rounded-full border px-2.5 py-1 text-xs font-semibold uppercase ${statusStyles[transaction.status] || statusStyles.pending}`}>{transaction.status}</span>{transaction.refundStatus && <p className="mt-1 text-[10px] font-semibold uppercase text-amber-700">Refund {transaction.refundStatus}</p>}</td><td className="px-5 py-4 text-gray-600">{formatSafeDate(transaction.paidAt, { dateStyle: 'medium', timeStyle: 'short' })}</td></tr>)}</tbody></table></div>
                )}
            </div>

            {selectedTransaction && <div className="fixed inset-0 z-[220] flex items-center justify-center bg-gray-950/55 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="transaction-detail-title"><button type="button" className="absolute inset-0" onClick={() => setSelectedTransaction(null)} aria-label="Close transaction details" /><article className="relative max-h-[92dvh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white shadow-2xl"><header className="flex items-start justify-between border-b border-green-100 bg-gradient-to-r from-green-300 via-green-400 to-green-500 p-6"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-green-950/70">Payment record</p><h2 id="transaction-detail-title" className="mt-1 text-2xl font-black text-gray-950">Transaction details</h2><p className="mt-2 font-mono text-sm text-green-950">{selectedTransaction.reference}</p></div><button type="button" onClick={() => setSelectedTransaction(null)} className="rounded-xl bg-white/40 p-2 text-gray-900 transition hover:bg-white/60" aria-label="Close"><CloseCircle className="h-5 w-5" /></button></header><div className="grid gap-6 p-6 lg:grid-cols-[1.2fr_0.8fr]"><div className="space-y-5"><section className="rounded-2xl border border-green-100 p-5"><div className="mb-4 flex items-center gap-3"><span className="rounded-xl bg-green-100 p-2 text-green-800"><User className="h-5 w-5" /></span><h3 className="font-bold text-gray-900">Customer</h3></div><div className="grid gap-4 sm:grid-cols-2"><div><p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Name</p><p className="mt-1 font-bold text-gray-900">{selectedTransaction.customer || 'Not provided'}</p></div><div><p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Email</p><p className="mt-1 break-all text-gray-700">{selectedTransaction.email || 'Not provided'}</p></div></div></section><section className="rounded-2xl border border-green-100 p-5"><div className="mb-4 flex items-center gap-3"><span className="rounded-xl bg-green-100 p-2 text-green-800"><Receipt className="h-5 w-5" /></span><h3 className="font-bold text-gray-900">Reservation and payment</h3></div><dl className="grid gap-4 sm:grid-cols-2"><div><dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">Event</dt><dd className="mt-1 font-semibold text-gray-900">{selectedTransaction.event || '-'}</dd></div><div><dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">Payment method</dt><dd className="mt-1 font-semibold capitalize text-gray-900">{selectedTransaction.method?.replaceAll('_', ' ') || '-'}</dd></div><div><dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">Payment reference</dt><dd className="mt-1 break-all font-mono text-xs text-gray-700">{selectedTransaction.paymentReference || '-'}</dd></div><div><dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">Paid on</dt><dd className="mt-1 text-gray-700">{formatSafeDate(selectedTransaction.paidAt, { dateStyle: 'full', timeStyle: 'short' })}</dd></div></dl></section></div><aside className="rounded-2xl bg-gray-950 p-6 text-white"><DollarCircle className="h-8 w-8 text-green-300" /><p className="mt-8 text-xs font-bold uppercase tracking-[0.16em] text-gray-400">Amount paid</p><p className="mt-2 text-4xl font-black text-green-300">₱{Number(selectedTransaction.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p><div className="mt-8 space-y-4 border-t border-white/10 pt-5"><div className="flex items-center justify-between gap-3"><span className="text-sm text-gray-400">Payment status</span><span className={`rounded-full border px-3 py-1 text-xs font-bold uppercase ${statusStyles[selectedTransaction.status] || statusStyles.pending}`}>{selectedTransaction.status}</span></div><div className="flex items-center justify-between gap-3"><span className="text-sm text-gray-400">Refund status</span><span className="text-sm font-bold capitalize">{selectedTransaction.refundStatus?.replaceAll('_', ' ') || 'None'}</span></div></div></aside></div></article></div>}
        </div>
    );
};

export default AdminTransactions;
