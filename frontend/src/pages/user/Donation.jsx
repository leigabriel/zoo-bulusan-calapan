import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Copy, Gift, Home, Phone, Check, ChevronLeft, ShieldCheck } from 'reicon-react';
import { userAPI } from '../../services/api-client';
import { notify } from '../../utils/toast';

const Donation = () => {
    const navigate = useNavigate();
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        let mounted = true;
        userAPI.getDonationConfig()
            .then((response) => {
                if (mounted && response?.success) setConfig(response.config);
            })
            .catch(() => {
                if (mounted) notify.error("Couldn't load donation details.");
            })
            .finally(() => {
                if (mounted) setLoading(false);
            });
        return () => { mounted = false; };
    }, []);

    const copyNumber = async () => {
        if (!config?.gcashNumber) return;
        try {
            await navigator.clipboard.writeText(config.gcashNumber);
            setCopied(true);
            notify.success('GCash number copied.');
            window.setTimeout(() => setCopied(false), 2000);
        } catch {
            notify.error("Couldn't copy the GCash number.");
        }
    };

    const openGcash = () => {
        if (!config?.gcashNumber) {
            notify.error('GCash payment details are not available yet.');
            return;
        }

        // Fallback for phones with GCash installed. The donor enters the amount
        // in GCash; browsers without the scheme still have the visible number.
        window.location.assign(`gcash://sendmoney?mobile_number=${encodeURIComponent(config.gcashNumber)}`);
    };

    if (loading) {
        return <div className="flex min-h-screen items-center justify-center bg-[#f5fbf6]"><div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" /></div>;
    }

    if (!config?.enabled) {
        return <div className="flex min-h-screen items-center justify-center bg-[#f5fbf6] p-5"><div className="w-full max-w-md rounded-3xl border border-emerald-100 bg-white p-10 text-center shadow-xl"><Gift className="mx-auto h-12 w-12 text-emerald-500" /><h1 className="mt-5 text-2xl font-black text-gray-900">Donations are temporarily unavailable</h1><p className="mt-3 text-sm leading-6 text-gray-500">Please check back later. Thank you for supporting Bulusan Zoo.</p><Link to="/" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-3 text-sm font-bold text-white"> <Home className="h-4 w-4" /> Return home</Link></div></div>;
    }

    return (
        <div className="min-h-screen bg-[#f5fbf6] text-slate-900">
            <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
                <button type="button" onClick={() => navigate(-1)} className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white px-4 py-2.5 text-sm font-bold text-emerald-900 shadow-sm transition hover:border-emerald-300"><ChevronLeft className="h-4 w-4" /> Back</button>
                <Link to="/" className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white px-4 py-2.5 text-sm font-bold text-emerald-900 shadow-sm transition hover:border-emerald-300"><Home className="h-4 w-4" /> <span className="hidden sm:inline">Home</span></Link>
            </header>

            <main className="mx-auto max-w-6xl px-5 pb-14 pt-8 sm:px-8 sm:pt-14">
                <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-700 px-6 py-12 text-white shadow-2xl sm:px-12 sm:py-16">
                    <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-white/10 blur-2xl" />
                    <div className="relative max-w-2xl">
                        <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-emerald-50"><Gift className="h-4 w-4" /> Support Bulusan Zoo</span>
                        <h1 className="mt-6 text-4xl font-black tracking-tight sm:text-6xl">Every gift helps wildlife thrive.</h1>
                        <p className="mt-5 max-w-xl text-base leading-7 text-emerald-50 sm:text-lg">Donate any amount directly through GCash. You choose the amount in your GCash app, when you are ready.</p>
                    </div>
                </section>

                <section className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                    <div className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-lg sm:p-8">
                        <div className="flex items-start gap-4"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700"><Phone className="h-6 w-6" /></span><div><h2 className="text-xl font-black text-gray-900">Donate through GCash</h2><p className="mt-1 text-sm text-gray-500">One secure handoff. No amount selection on this page.</p></div></div>
                        <div className="mt-7 rounded-2xl bg-slate-950 p-5 text-white sm:p-6">
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">Send to GCash number</p>
                            <div className="mt-3 flex items-center justify-between gap-3"><p className="break-all text-2xl font-black tracking-tight sm:text-3xl">{config.gcashNumber || 'Not configured'}</p>{config.gcashNumber && <button type="button" onClick={copyNumber} className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs font-bold hover:bg-white/20">{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}{copied ? 'Copied' : 'Copy'}</button>}</div>
                            <p className="mt-3 text-sm text-slate-300">Account name: <span className="font-bold text-white">{config.accountName || 'Bulusan Zoo'}</span></p>
                        </div>
                        <button type="button" onClick={openGcash} disabled={!config.gcashNumber} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-4 text-base font-black text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50">Open GCash and choose amount</button>
                        <div className="mt-4 flex items-start gap-2 text-xs leading-5 text-slate-500"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />The GCash app opens without a preset amount. Review the recipient and enter your own donation amount before sending.</div>
                    </div>

                    <div className="rounded-3xl border border-emerald-100 bg-emerald-50/70 p-6 sm:p-8"><p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">Quick guide</p><h2 className="mt-3 text-2xl font-black text-emerald-950">You are in control.</h2><ol className="mt-6 space-y-5">{['Tap Open GCash above.', 'Check that the recipient matches the details shown.', 'Enter any amount you want to give.', 'Review the transfer and confirm in GCash.'].map((step, index) => <li key={step} className="flex gap-4"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-sm font-black text-emerald-700 shadow-sm">{index + 1}</span><p className="pt-1 text-sm leading-6 text-emerald-950/75">{step}</p></li>)}</ol>{config.note && <div className="mt-8 rounded-2xl border border-emerald-200 bg-white/70 p-4 text-sm leading-6 text-emerald-900">{config.note}</div>}</div>
                </section>
            </main>
        </div>
    );
};

export default Donation;
