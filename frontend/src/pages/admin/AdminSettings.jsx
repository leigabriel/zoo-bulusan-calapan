import { Save as ReiconSave, ToggleOn, DocumentText } from 'reicon-react';
import { useEffect, useState } from 'react';
import { invalidatePolicies } from '../../hooks/use-policies';
import { adminAPI } from '../../services/api-client';
import { notify } from '../../utils/toast';

const SaveIcon = () => (
    <ReiconSave strokeWidth="2" className="w-5 h-5" />
);

const POLICY_TABS = [
    { id: 'privacy', label: 'Privacy' },
    { id: 'terms', label: 'Terms' },
    { id: 'cookies', label: 'Cookies' },
    { id: 'refund', label: 'Refund' }
];

// The public legal pages are plain text with a light markdown subset. The
// editor deliberately stays a textarea: the same body is rendered by the
// policy pages and by the login/sign-up modals, so no HTML is introduced.
const PolicyEditor = ({ policies, active, onActiveChange, onChange }) => {
    const policy = policies?.[active];

    if (!policy) {
        return (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
                Policy content could not be loaded. Reload the page and try again.
            </div>
        );
    }

    const update = (field, value) => onChange(active, { ...policy, [field]: value });

    return (
        <div>
            <div role="group" aria-label="Policy pages" className="flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1">
                {POLICY_TABS.map((tab) => {
                    const selected = active === tab.id;
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            aria-pressed={selected}
                            onClick={() => onActiveChange(tab.id)}
                            className={`rounded-lg px-3.5 py-2 text-sm font-semibold transition ${selected ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                        >
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
                <div>
                    <label htmlFor={`policy-title-${active}`} className="mb-2 block text-sm font-semibold text-slate-700">Page title</label>
                    <input
                        id={`policy-title-${active}`}
                        type="text"
                        maxLength={200}
                        value={policy.title}
                        onChange={(e) => update('title', e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                    />
                </div>
                <div>
                    <p className="mb-2 text-sm font-semibold text-slate-700">Last updated</p>
                    <div className="flex min-h-[50px] items-center rounded-xl border border-slate-200 bg-slate-100/70 px-4 py-3 text-slate-700">
                        {policy.lastUpdated}
                    </div>
                    <p className="mt-2 text-xs leading-5 text-slate-500">Filled in automatically when you save a change, and shown on the public page.</p>
                </div>
            </div>

            <div className="mt-5">
                <div className="mb-2 flex items-end justify-between gap-4">
                    <label htmlFor={`policy-content-${active}`} className="block text-sm font-semibold text-slate-700">Content</label>
                    <span className="text-xs text-slate-400">{policy.content.length.toLocaleString()} characters</span>
                </div>
                <textarea
                    id={`policy-content-${active}`}
                    rows={18}
                    value={policy.content}
                    onChange={(e) => update('content', e.target.value)}
                    className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 font-mono text-sm leading-6 text-slate-900 outline-none transition hover:border-slate-300 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                />
                <p className="mt-2 text-xs leading-5 text-slate-500">
                    Lines that start with <code className="rounded bg-slate-100 px-1">##</code> appear as section headings, and lines that start with <code className="rounded bg-slate-100 px-1">*</code> appear as bullet points. Everything else appears as normal paragraphs.
                </p>
            </div>
        </div>
    );
};

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

const AdminSettings = ({ modalSection = null }) => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [eventPayment, setEventPayment] = useState({ qrphEnabled: false, amountPerParticipant: 0 });
    // Ticket payment is configured and stored entirely separately from event
    // payment, so an admin can enable one without disturbing the other.
    const [ticketPayment, setTicketPayment] = useState({ qrphEnabled: false, adultPrice: 40, childPrice: 20, residentPrice: 0 });
    // Availability is independent of payments: the page, ticket bookings and
    // event bookings can each be closed without touching any price.
    const [reservationAccess, setReservationAccess] = useState({ pageEnabled: true, ticketEnabled: true, eventEnabled: true });
    // Legal policies are edited here and published on the public policy pages.
    const [legalPolicies, setLegalPolicies] = useState(null);
    const [activePolicy, setActivePolicy] = useState('privacy');
    const [savingPolicies, setSavingPolicies] = useState(false);

    useEffect(() => {
        const loadConfig = async () => {
            try {
                const [paymentRes, ticketRes, reservationRes, policyRes] = await Promise.all([
                    adminAPI.getEventPaymentConfig(),
                    adminAPI.getTicketPaymentConfig(),
                    adminAPI.getReservationConfig(),
                    // A failure here only disables the policy editor; it must not
                    // take the payment and availability settings down with it.
                    adminAPI.getLegalPolicyConfig().catch(() => null)
                ]);
                if (paymentRes.success && paymentRes.config) {
                    setEventPayment({
                        qrphEnabled: Boolean(paymentRes.config.qrphEnabled ?? paymentRes.config.enabled),
                        amountPerParticipant: Number(paymentRes.config.amountPerParticipant) || 0
                    });
                }
                if (ticketRes.success && ticketRes.config) {
                    setTicketPayment({
                        qrphEnabled: Boolean(ticketRes.config.qrphEnabled ?? ticketRes.config.enabled),
                        adultPrice: Number(ticketRes.config.adultPrice) || 0,
                        childPrice: Number(ticketRes.config.childPrice) || 0,
                        residentPrice: Number(ticketRes.config.residentPrice) || 0
                    });
                }
                if (reservationRes.success && reservationRes.config) {
                    setReservationAccess({
                        pageEnabled: reservationRes.config.pageEnabled !== false,
                        ticketEnabled: reservationRes.config.ticketEnabled !== false,
                        eventEnabled: reservationRes.config.eventEnabled !== false
                    });
                }
                if (policyRes?.success && policyRes.policies) {
                    setLegalPolicies(policyRes.policies);
                }
            } catch {
                notify.error("Couldn't load settings.");
            } finally {
                setLoading(false);
            }
        };
        loadConfig();
    }, []);

    const handleSavePolicies = async () => {
        const incomplete = POLICY_TABS.find(({ id }) => {
            const policy = legalPolicies?.[id];
            return !policy?.title?.trim() || !policy?.content?.trim();
        });

        if (incomplete) {
            notify.error(`Add a title and some text to the ${incomplete.label} policy before saving.`);
            return;
        }

        setSavingPolicies(true);
        try {
            const response = await adminAPI.updateLegalPolicyConfig(legalPolicies);
            if (!response?.success) {
                notify.error(response?.message || "Couldn't save policy content.");
                return;
            }
            if (response.policies) setLegalPolicies(response.policies);
            // Drop the visitor-facing cache so this session sees the new text.
            invalidatePolicies();
            const updatedOn = response.policies?.[activePolicy]?.lastUpdated;
            notify.success('Policy saved.', {
                description: updatedOn
                    ? `Visitors now see the new text, dated ${updatedOn}.`
                    : 'Visitors now see the new text.'
            });
        } catch (error) {
            notify.error(error.message || "Couldn't save policy content.");
        } finally {
            setSavingPolicies(false);
        }
    };

    const updatePolicy = (slug, policy) => {
        setLegalPolicies((current) => ({ ...current, [slug]: policy }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const [eventPaymentRes, ticketPaymentRes, reservationAccessRes] = await Promise.all([
                adminAPI.updateEventPaymentConfig(eventPayment),
                adminAPI.updateTicketPaymentConfig(ticketPayment),
                adminAPI.updateReservationConfig(reservationAccess)
            ]);

            if (eventPaymentRes?.success && ticketPaymentRes?.success && reservationAccessRes?.success) {
                notify.success('Settings saved.');
            } else {
                const failed = [eventPaymentRes, ticketPaymentRes, reservationAccessRes].find((result) => !result?.success);
                notify.error(failed?.message || "Couldn't save settings.");
            }
        } catch {
            notify.error("Couldn't save settings. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const inputClassName = 'w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100';

    return (
        <div className={`animate-fade-in space-y-6 ${modalSection ? 'p-5 pb-7 sm:p-8' : 'pb-8'}`}>
            <header className="relative overflow-hidden rounded-3xl border border-green-400 bg-gradient-to-br from-green-300 via-green-400 to-green-500 p-6 text-gray-900 shadow-sm md:p-8">
                <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full border-[40px] border-white/5" />
                <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-end">
                    <div>
                        <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-green-950">Administration</p>
                        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{modalSection === 'tickets' ? 'Ticket payment settings' : modalSection === 'events' ? 'Event payment settings' : modalSection === 'reservations' ? 'Reservation access settings' : modalSection === 'policies' ? 'Legal policy settings' : 'System settings'}</h1>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-green-950/80 md:text-base">
                            Control zoo admission, event reservation payments, booking availability, and the content of the public legal pages.
                        </p>
                    </div>
                    {!loading && !modalSection && (
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
                <div className={modalSection ? '' : 'grid items-start gap-6 lg:grid-cols-[240px_minmax(0,1fr)]'}>
                    {!modalSection && <aside className="space-y-4 lg:sticky lg:top-6">
                        <nav aria-label="Settings sections" className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
                            <p className="px-3 pb-2 pt-3 text-xs font-bold uppercase tracking-wider text-slate-400">Settings menu</p>
                            <a href="#overview" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-800">
                                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-xs text-emerald-700">01</span>
                                Overview
                            </a>
                            <a href="#tickets" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-800">
                                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-xs text-emerald-700">02</span>
                                Ticket payments
                            </a>
                            <a href="#events" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-800">
                                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-xs text-emerald-700">03</span>
                                Event payments
                            </a>
                            <a href="#reservations" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-800">
                                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-xs text-emerald-700">04</span>
                                Reservation access
                            </a>
                            <a href="#policies" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-800">
                                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-xs text-emerald-700">05</span>
                                Legal policies
                            </a>
                        </nav>
                        <div className="hidden rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-800 lg:block">
                            Payment and availability changes apply after you select <strong>Save settings</strong>. Policy text is saved from its own section.
                        </div>
                    </aside>}

                    <main className="min-w-0 space-y-6">
                        {!modalSection && <section id="overview" className="scroll-mt-6">
                            <div className="mb-3 flex items-end justify-between gap-4">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">At a glance</p>
                                    <h2 className="mt-1 text-xl font-bold text-slate-900">Service status</h2>
                                </div>
                                <span className="text-xs text-slate-400">4 configurable services</span>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 font-bold text-emerald-700">₱</span>
                                        <div><p className="font-semibold text-slate-900">Ticket payments</p><p className="text-xs text-slate-500">PayMongo QR Ph</p></div>
                                    </div>
                                     <StatusBadge enabled={ticketPayment.qrphEnabled} />
                                </div>
                                <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 font-bold text-blue-700">₱</span>
                                        <div><p className="font-semibold text-slate-900">Event payments</p><p className="text-xs text-slate-500">PayMongo QR Ph</p></div>
                                    </div>
                                     <StatusBadge enabled={eventPayment.qrphEnabled} />
                                </div>
                                <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-xs font-bold text-amber-700">01</span>
                                        <div><p className="font-semibold text-slate-900">Reservation page</p><p className="text-xs text-slate-500">Booking availability</p></div>
                                    </div>
                                     <StatusBadge enabled={reservationAccess.pageEnabled} />
                                </div>
                                <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700"><DocumentText className="h-5 w-5" /></span>
                                        <div><p className="font-semibold text-slate-900">Legal policies</p><p className="text-xs text-slate-500">Public policy pages</p></div>
                                    </div>
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                        {legalPolicies ? `${POLICY_TABS.length} pages` : 'Unavailable'}
                                    </span>
                                </div>
                            </div>
                        </section>}

                        
                                                {(!modalSection || modalSection === 'tickets') && <section id="tickets" className="scroll-mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between md:p-6">
                                <div className="flex items-start gap-4">
                                    <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-lg font-bold text-emerald-700">&#8369;</span>
                                    <div>
                                        <h2 className="text-lg font-bold text-slate-900">Ticket payments</h2>
                                        <p className="mt-1 text-sm text-slate-500">Accept PayMongo QR Ph payments for zoo admission tickets.</p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between gap-3 sm:justify-end">
                                    <StatusBadge enabled={ticketPayment.qrphEnabled} />
                                    <Toggle
                                        label="Enable ticket payments"
                                        checked={ticketPayment.qrphEnabled}
                                        onChange={(e) => setTicketPayment((current) => ({ ...current, qrphEnabled: e.target.checked }))}
                                    />
                                </div>
                            </div>
                            <div className="p-5 md:p-6">
                                <div className="mb-5">
                                    <p className="font-semibold text-slate-900">Admission prices</p>
                                    <p className="text-xs text-slate-500">These rates drive the checkout total, the admin dashboard and every revenue report.</p>
                                </div>
                                <div className="grid gap-5 md:grid-cols-3">
                                    <div>
                                        <label htmlFor="adult-price" className="mb-2 block text-sm font-semibold text-slate-700">Adult (18+)</label>
                                        <div className="relative">
                                            <span className="absolute inset-y-0 left-0 flex items-center border-r border-slate-200 px-4 font-semibold text-slate-500">PHP</span>
                                            <input
                                                id="adult-price"
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={ticketPayment.adultPrice}
                                                onChange={(e) => setTicketPayment((current) => ({ ...current, adultPrice: e.target.value }))}
                                                className={`${inputClassName} pl-20`}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label htmlFor="child-price" className="mb-2 block text-sm font-semibold text-slate-700">Child (4-17)</label>
                                        <div className="relative">
                                            <span className="absolute inset-y-0 left-0 flex items-center border-r border-slate-200 px-4 font-semibold text-slate-500">PHP</span>
                                            <input
                                                id="child-price"
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={ticketPayment.childPrice}
                                                onChange={(e) => setTicketPayment((current) => ({ ...current, childPrice: e.target.value }))}
                                                className={`${inputClassName} pl-20`}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label htmlFor="resident-price" className="mb-2 block text-sm font-semibold text-slate-700">Bulusan resident</label>
                                        <div className="relative">
                                            <span className="absolute inset-y-0 left-0 flex items-center border-r border-slate-200 px-4 font-semibold text-slate-500">PHP</span>
                                            <input
                                                id="resident-price"
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={ticketPayment.residentPrice}
                                                onChange={(e) => setTicketPayment((current) => ({ ...current, residentPrice: e.target.value }))}
                                                className={`${inputClassName} pl-20`}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <p className="mt-3 text-xs text-slate-500">Residents verify on-site with a valid ID. Set their price to 0 for free entry; a booking made up entirely of free tickets has nothing to pay online.</p>
                                <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-800">
                                    Online payments aren&apos;t set up yet. Ask your website administrator to finish the PayMongo setup before enabling this option. Event reservation payments are configured separately below.
                                </div>
                            </div>
                        </section>}
{(!modalSection || modalSection === 'events') && <section id="events" className="scroll-mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between md:p-6">
                                <div className="flex items-start gap-4">
                                    <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-blue-100 text-lg font-bold text-blue-700">₱</span>
                                    <div><h2 className="text-lg font-bold text-slate-900">Event QR Ph payments</h2><p className="mt-1 text-sm text-slate-500">Accept PayMongo payments for event reservations only.</p></div>
                                </div>
                                 <div className="flex items-center justify-between gap-3 sm:justify-end"><StatusBadge enabled={eventPayment.qrphEnabled} /><Toggle label="Enable QR Ph payments" checked={eventPayment.qrphEnabled} onChange={(e) => setEventPayment((current) => ({ ...current, qrphEnabled: e.target.checked }))} /></div>
                            </div>
                            <div className="p-5 md:p-6">
                                <div className="max-w-md"><label htmlFor="event-fee" className="mb-2 block text-sm font-semibold text-slate-700">Fixed reservation fee per participant</label><div className="relative"><span className="absolute inset-y-0 left-0 flex items-center border-r border-slate-200 px-4 font-semibold text-slate-500">PHP</span><input id="event-fee" type="number" min="0" step="0.01" value={eventPayment.amountPerParticipant} onChange={(e) => setEventPayment((current) => ({ ...current, amountPerParticipant: e.target.value }))} className={`${inputClassName} pl-20`} /></div></div>
                                <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-800">Online payments aren&apos;t set up yet. Ask your website administrator to finish the PayMongo setup before enabling this option. Ticket reservations are not affected.</div>
                            </div>
                        </section>}

                        {(!modalSection || modalSection === 'reservations') && <section id="reservations" className="scroll-mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <div className="flex items-start gap-4 border-b border-slate-100 p-5 md:p-6">
                                <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700"><ToggleOn className="h-5 w-5" /></span>
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900">Reservation access</h2>
                                    <p className="mt-1 text-sm text-slate-500">Control whether visitors can open the reservation page and which booking types are available.</p>
                                </div>
                            </div>
                            <div className="divide-y divide-slate-100">
                                <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between md:px-6">
                                    <div className="min-w-0">
                                        <p className="font-semibold text-slate-900">Reservation page</p>
                                        <p className="mt-1 text-xs leading-5 text-slate-500">When disabled, visitors see "Reservation Page is not currently available" instead of the booking options.</p>
                                    </div>
                                    <div className="flex items-center justify-between gap-3 sm:justify-end">
                                        <StatusBadge enabled={reservationAccess.pageEnabled} />
                                        <Toggle
                                            label="Enable the reservation page"
                                            checked={reservationAccess.pageEnabled}
                                            onChange={(e) => setReservationAccess((current) => ({ ...current, pageEnabled: e.target.checked }))}
                                        />
                                    </div>
                                </div>
                                <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between md:px-6">
                                    <div className="min-w-0">
                                        <p className="font-semibold text-slate-900">Zoo ticket reservations</p>
                                        <p className="mt-1 text-xs leading-5 text-slate-500">Hide and block the daily admission ticket booking while leaving events open.</p>
                                    </div>
                                    <div className="flex items-center justify-between gap-3 sm:justify-end">
                                        <StatusBadge enabled={reservationAccess.ticketEnabled} />
                                        <Toggle
                                            label="Enable zoo ticket reservations"
                                            checked={reservationAccess.ticketEnabled}
                                            onChange={(e) => setReservationAccess((current) => ({ ...current, ticketEnabled: e.target.checked }))}
                                        />
                                    </div>
                                </div>
                                <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between md:px-6">
                                    <div className="min-w-0">
                                        <p className="font-semibold text-slate-900">Event reservations</p>
                                        <p className="mt-1 text-xs leading-5 text-slate-500">Hide and block the event venue booking while leaving zoo tickets open.</p>
                                    </div>
                                    <div className="flex items-center justify-between gap-3 sm:justify-end">
                                        <StatusBadge enabled={reservationAccess.eventEnabled} />
                                        <Toggle
                                            label="Enable event reservations"
                                            checked={reservationAccess.eventEnabled}
                                            onChange={(e) => setReservationAccess((current) => ({ ...current, eventEnabled: e.target.checked }))}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="border-t border-slate-100 p-5 md:px-6">
                                <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-800">
                                    Ticket and event bookings are only offered while the reservation page is enabled. Existing reservations and tickets are not affected.
                                </div>
                            </div>
                        </section>}

                        {(!modalSection || modalSection === 'policies') && <section id="policies" className="scroll-mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <div className="flex items-start gap-4 border-b border-slate-100 p-5 md:p-6">
                                <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700"><DocumentText className="h-5 w-5" /></span>
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900">Legal policies</h2>
                                    <p className="mt-1 text-sm text-slate-500">Edit the text published on the public Privacy, Terms, Cookie, and Refund pages. Changes are visible immediately after saving.</p>
                                </div>
                            </div>
                            <div className="p-5 md:p-6">
                                <PolicyEditor
                                    policies={legalPolicies}
                                    active={activePolicy}
                                    onActiveChange={setActivePolicy}
                                    onChange={updatePolicy}
                                />
                            </div>
                            <div className="flex flex-col gap-3 border-t border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between md:px-6">
                                <p className="text-xs leading-5 text-slate-500">Policy changes are saved separately from the payment and availability settings above.</p>
                                <button
                                    type="button"
                                    onClick={handleSavePolicies}
                                    disabled={savingPolicies || !legalPolicies}
                                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {savingPolicies ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <SaveIcon />}
                                    {savingPolicies ? 'Saving policies...' : 'Save policies'}
                                </button>
                            </div>
                        </section>}

                        {modalSection !== 'policies' && (
                            <div className="sticky bottom-3 z-10 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between sm:px-4">
                                <p className="text-xs text-slate-500 sm:text-sm">Review the settings before applying your changes.</p>
                                <button type="button" onClick={handleSave} disabled={saving} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-200 disabled:cursor-not-allowed disabled:opacity-60">
                                    {saving ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <SaveIcon />}
                                    {saving ? 'Saving settings...' : 'Save settings'}
                                </button>
                            </div>
                        )}
                    </main>
                </div>
            )}
        </div>
    );
};

export default AdminSettings;
