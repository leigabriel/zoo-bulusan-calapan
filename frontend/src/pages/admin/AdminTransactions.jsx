import { useEffect, useState } from 'react';
import { adminAPI } from '../../services/api-client';
import { formatSafeDate } from '../../utils/format-date';

const statusStyles = {
    paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    failed: 'bg-red-50 text-red-700 border-red-200',
    refunded: 'bg-slate-100 text-slate-700 border-slate-200'
};

const AdminTransactions = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        adminAPI.getTransactions()
            .then(response => {
                if (!response.success) throw new Error(response.message || 'Unable to load transactions.');
                setTransactions(response.transactions || []);
            })
            .catch(err => setError(err.message || 'Unable to load transactions.'))
            .finally(() => setLoading(false));
    }, []);

    const paidTotal = transactions.filter(transaction => transaction.status === 'paid')
        .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);

    return (
        <div className="space-y-6">
            <div className="rounded-2xl border border-green-200 bg-white p-6 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-green-600">Finance</p>
                <div className="mt-1 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                    <div><h1 className="text-2xl font-bold text-gray-900">Transactions</h1><p className="mt-1 text-sm text-gray-500">PayMongo event payments and refund requests.</p></div>
                    <div className="rounded-xl bg-emerald-50 px-4 py-3"><p className="text-xs text-emerald-700">Paid total</p><p className="text-xl font-bold text-emerald-800">₱{paidTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p></div>
                </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-green-200 bg-white shadow-sm">
                {loading ? <div className="p-10 text-center text-sm text-gray-500">Loading transactions...</div> : error ? <div className="p-10 text-center text-sm text-red-600">{error}</div> : transactions.length === 0 ? <div className="p-10 text-center text-sm text-gray-500">No payment transactions yet.</div> : (
                    <div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="border-b border-green-200 bg-green-50/60 text-xs uppercase tracking-wider text-gray-500"><tr><th className="px-5 py-4">Reference</th><th className="px-5 py-4">Customer</th><th className="px-5 py-4">Event</th><th className="px-5 py-4">Amount</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">Paid on</th></tr></thead><tbody className="divide-y divide-green-100">{transactions.map(transaction => <tr key={transaction.id} className="hover:bg-green-50/40"><td className="px-5 py-4"><p className="font-mono text-xs text-green-700">{transaction.reference}</p><p className="mt-1 max-w-40 truncate text-[10px] text-gray-400">{transaction.paymentReference || 'No payment reference'}</p></td><td className="px-5 py-4"><p className="font-medium text-gray-900">{transaction.customer}</p><p className="text-xs text-gray-500">{transaction.email}</p></td><td className="px-5 py-4 text-gray-700">{transaction.event}</td><td className="px-5 py-4 font-semibold text-gray-900">₱{Number(transaction.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td><td className="px-5 py-4"><span className={`rounded-full border px-2.5 py-1 text-xs font-semibold uppercase ${statusStyles[transaction.status] || statusStyles.pending}`}>{transaction.status}</span>{transaction.refundStatus && <p className="mt-1 text-[10px] font-semibold uppercase text-amber-700">Refund {transaction.refundStatus}</p>}</td><td className="px-5 py-4 text-gray-600">{formatSafeDate(transaction.paidAt, { dateStyle: 'medium', timeStyle: 'short' })}</td></tr>)}</tbody></table></div>
                )}
            </div>
        </div>
    );
};

export default AdminTransactions;