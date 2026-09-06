import { Gift as ReiconGift, Phone as ReiconPhone, Save as ReiconSave } from 'reicon-react';
import { useEffect, useState } from 'react';
import { adminAPI } from '../../services/api-client';
import { notify } from '../../utils/toast';

const GiftIcon = ({ className = 'w-6 h-6' }) => (
    <ReiconGift strokeWidth="2" className={className} />
);

const PhoneIcon = () => (
    <ReiconPhone strokeWidth="2" className="w-5 h-5" />
);

const SaveIcon = () => (
    <ReiconSave strokeWidth="2" className="w-5 h-5" />
);

const StatusBadge = ({ enabled }) => (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${enabled ? 'bg-emerald-500' : 'bg-slate-400'}`} />
        {enabled ? 'Enabled' : 'Disabled'}
    </span>
);

const Toggle = ({ checked, onChange, label }) => (
    <label className="relative inline-flex flex-shrink-0 cursor-pointer items-center">
        <span className="sr-only">{label}</span>
        <input type="checkbox" checked={checked} onChange={onChange} className="peer sr-only" />
        <span className="h-7 w-12 rounded-full bg-slate-200 transition-colors after:absolute after:start-[2px] after:top-[2px] after:h-6 after:w-6 after:rounded-full after:border after:border-slate-200 after:bg-white after:shadow-sm after:transition-transform after:content-[''] peer-checked:bg-emerald-500 peer-checked:after:translate-x-5 peer-focus-visible:ring-4 peer-focus-visible:ring-emerald-200" />
    </label>
);

const AdminSettings = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [config, setConfig] = useState({
        enabled: true,
        gcashNumber: '',
        accountName: '',
        note: ''
    });
    const [eventPayment, setEventPayment] = useState({ enabled: false, amountPerParticipant: 0 });

    useEffect(() => {
        const loadConfig = async () => {
            try {
                const [res, paymentRes] = await Promise.all([
                    adminAPI.getDonationConfig(),
                    adminAPI.getEventPaymentConfig()
                ]);
                if (res.success && res.config) {
                    setConfig({
                        enabled: Boolean(res.config.enabled),
                        gcashNumber: res.config.gcashNumber || '',
                        accountName: res.config.accountName || '',
                        note: res.config.note || ''
                    });
                }
                if (paymentRes.success && paymentRes.config) {
                    setEventPayment({
                        enabled: Boolean(paymentRes.config.enabled),
                        amountPerParticipant: Number(paymentRes.config.amountPerParticipant) || 0
                    });
                }
            } catch {
                notify.error("Couldn't load settings.");
            } finally {
                setLoading(false);
            }
        };
        loadConfig();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            const [donationRes, eventPaymentRes] = await Promise.all([
                adminAPI.updateDonationConfig(config),
                adminAPI.updateEventPaymentConfig(eventPayment)
            ]);

            if (donationRes?.success && eventPaymentRes?.success) {
                notify.success('Settings saved.');
            } else {
                const failedResponse = !donationRes?.success ? donationRes : eventPaymentRes;
                notify.error(failedResponse?.message || "Couldn't save settings.");
            }
        } catch {
            notify.error("Couldn't save settings. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const inputClassName = 'w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100';

    return (
        <div className="animate-fade-in space-y-6 pb-8">
            <header className="relative overflow-hidden rounded-3xl border border-green-400 bg-gradient-to-br from-green-300 via-green-400 to-green-500 p-6 text-gray-900 shadow-sm md:p-8">
                <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full border-[40px] border-white/5" />
                <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-end">
                    <div>
                        <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-green-950">Administration</p>
                        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">System settings</h1>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-green-950/80 md:text-base">
                            Control visitor donations and event reservation payments from one place.
                        </p>
                    </div>
                    {!loading && (
                        <div className="flex w-fit items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm backdrop-blur-sm">
                            <span className="h-2 w-2 rounded-full bg-emerald-300" />
                            Configuration loaded
                        </div>
                    )}
                </div>
            </header>

            {loading ? (
                <div className="flex min-h-72 items-center justify-center rounded-3xl border border-slate-200 bg-white">
                    <div className="text-center">
                        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-500" />
                        <p className="mt-4 text-sm font-medium text-slate-500">Loading configuration...</p>
                    </div>
                </div>
            ) : (
                <div className="grid items-start gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
                    <aside className="space-y-4 lg:sticky lg:top-6">
                        <nav aria-label="Settings sections" className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
                            <p className="px-3 pb-2 pt-3 text-xs font-bold uppercase tracking-wider text-slate-400">Settings menu</p>
                            <a href="#overview" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-800">
                                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-xs text-emerald-700">01</span>
                                Overview
                            </a>
                            <a href="#donations" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-800">
                                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-xs text-emerald-700">02</span>
                                Donations
                            </a>
                            <a href="#events" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-800">
                                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-xs text-emerald-700">03</span>
                                Event payments
                            </a>
                        </nav>
                        <div className="hidden rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-800 lg:block">
                            Changes only take effect after you select <strong>Save settings</strong>.
                        </div>
                    </aside>

                    <main className="min-w-0 space-y-6">
                        <section id="overview" className="scroll-mt-6">
                            <div className="mb-3 flex items-end justify-between gap-4">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">At a glance</p>
                                    <h2 className="mt-1 text-xl font-bold text-slate-900">Service status</h2>
                                </div>
                                <span className="text-xs text-slate-400">2 configurable services</span>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700"><GiftIcon className="h-5 w-5" /></span>
                                        <div><p className="font-semibold text-slate-900">Online donations</p><p className="text-xs text-slate-500">Visitor-facing feature</p></div>
                                    </div>
                                    <StatusBadge enabled={config.enabled} />
                                </div>
                                <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 font-bold text-blue-700">₱</span>
                                        <div><p className="font-semibold text-slate-900">Event payments</p><p className="text-xs text-slate-500">PayMongo QR Ph</p></div>
                                    </div>
                                    <StatusBadge enabled={eventPayment.enabled} />
                                </div>
                            </div>
                        </section>

                        <section id="donations" className="scroll-mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between md:p-6">
                                <div className="flex items-start gap-4">
                                    <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700"><GiftIcon /></span>
                                    <div><h2 className="text-lg font-bold text-slate-900">Donation settings</h2><p className="mt-1 text-sm text-slate-500">Publish your GCash details on the visitor donation page.</p></div>
                                </div>
                                <div className="flex items-center justify-between gap-3 sm:justify-end"><StatusBadge enabled={config.enabled} /><Toggle label="Enable online donations" checked={config.enabled} onChange={(e) => setConfig((current) => ({ ...current, enabled: e.target.checked }))} /></div>
                            </div>
                            <div className="p-5 md:p-6">
                                <div className="mb-5 flex items-center gap-3">
                                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-600"><PhoneIcon /></span>
                                    <div><h3 className="font-semibold text-slate-900">GCash payment details</h3><p className="text-xs text-slate-500">Visible to visitors when donations are enabled.</p></div>
                                </div>
                                <div className="grid gap-5 md:grid-cols-2">
                                    <div><label htmlFor="gcash-number" className="mb-2 block text-sm font-semibold text-slate-700">GCash number</label><input id="gcash-number" type="text" value={config.gcashNumber} onChange={(e) => setConfig((current) => ({ ...current, gcashNumber: e.target.value.slice(0, 20) }))} placeholder="e.g. 09171234567" className={inputClassName} /></div>
                                    <div><label htmlFor="account-name" className="mb-2 block text-sm font-semibold text-slate-700">Account name</label><input id="account-name" type="text" value={config.accountName} onChange={(e) => setConfig((current) => ({ ...current, accountName: e.target.value.slice(0, 60) }))} placeholder="e.g. Bulusan Zoo & Wildlife Park" className={inputClassName} /></div>
                                </div>
                                <div className="mt-5">
                                    <div className="mb-2 flex items-center justify-between"><label htmlFor="donor-note" className="text-sm font-semibold text-slate-700">Message to donors <span className="font-normal text-slate-400">(optional)</span></label><span className="text-xs text-slate-400">{config.note.length}/300</span></div>
                                    <textarea id="donor-note" value={config.note} onChange={(e) => setConfig((current) => ({ ...current, note: e.target.value.slice(0, 300) }))} rows={4} placeholder="A short thank-you note or message shown on the donation page." className={`${inputClassName} resize-none`} />
                                </div>
                            </div>
                        </section>

                        <section id="events" className="scroll-mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between md:p-6">
                                <div className="flex items-start gap-4">
                                    <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-blue-100 text-lg font-bold text-blue-700">₱</span>
                                    <div><h2 className="text-lg font-bold text-slate-900">Event QR Ph payments</h2><p className="mt-1 text-sm text-slate-500">Accept PayMongo payments for event reservations only.</p></div>
                                </div>
                                <div className="flex items-center justify-between gap-3 sm:justify-end"><StatusBadge enabled={eventPayment.enabled} /><Toggle label="Enable event payments" checked={eventPayment.enabled} onChange={(e) => setEventPayment((current) => ({ ...current, enabled: e.target.checked }))} /></div>
                            </div>
                            <div className="p-5 md:p-6">
                                <div className="max-w-md"><label htmlFor="event-fee" className="mb-2 block text-sm font-semibold text-slate-700">Fixed reservation fee per participant</label><div className="relative"><span className="absolute inset-y-0 left-0 flex items-center border-r border-slate-200 px-4 font-semibold text-slate-500">PHP</span><input id="event-fee" type="number" min="0" step="0.01" value={eventPayment.amountPerParticipant} onChange={(e) => setEventPayment((current) => ({ ...current, amountPerParticipant: e.target.value }))} className={`${inputClassName} pl-20`} /></div></div>
                                <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-800">PayMongo credentials must be configured on the backend before enabling this option. Ticket reservations are not affected.</div>
                            </div>
                        </section>

                        <div className="sticky bottom-3 z-10 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between sm:px-4">
                            <p className="text-xs text-slate-500 sm:text-sm">Review both sections before applying your changes.</p>
                            <button type="button" onClick={handleSave} disabled={saving} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-200 disabled:cursor-not-allowed disabled:opacity-60">
                                {saving ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <SaveIcon />}
                                {saving ? 'Saving settings...' : 'Save settings'}
                            </button>
                        </div>
                    </main>
                </div>
            )}
        </div>
    );
};

export default AdminSettings;
