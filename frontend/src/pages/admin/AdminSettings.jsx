import { Gift as ReiconGift, Phone as ReiconPhone, Save as ReiconSave } from 'reicon-react';
import { useEffect, useState } from 'react';
import { adminAPI } from '../../services/api-client';
import { notify } from '../../utils/toast';

const GiftIcon = () => (
    <ReiconGift strokeWidth="2" className="w-6 h-6" />
);

const PhoneIcon = () => (
    <ReiconPhone strokeWidth="2" className="w-5 h-5" />
);

const SaveIcon = () => (
    <ReiconSave strokeWidth="2" className="w-5 h-5" />
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
                // keep defaults on error
            } finally {
                setLoading(false);
            }
        };
        loadConfig();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            const [res] = await Promise.all([
                adminAPI.updateDonationConfig(config),
                adminAPI.updateEventPaymentConfig(eventPayment)
            ]);
            if (res && res.success) {
                notify.success('Settings saved.');
            } else {
                notify.error(res?.message || "Couldn't save settings.");
            }
        } catch {
            notify.error("Couldn't save settings. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="bg-[#f6fdf8] border border-green-200 rounded-3xl p-6 md:p-8">
                <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center text-green-700 mb-5">
                    <GiftIcon />
                </div>
                <h1 className="text-3xl font-bold text-green-900 mb-2">Settings</h1>
                <p className="text-green-900/70 max-w-3xl">
                    Manage zoo-wide configuration, including the online donation feature shown to visitors.
                </p>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="w-10 h-10 border-4 border-green-300 border-t-green-400 rounded-full animate-spin" />
                </div>
            ) : (
                <>
                    <div className="bg-white border border-green-200 rounded-2xl p-5 md:p-6">
                        <div className="flex items-start sm:items-center justify-between gap-4">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-green-100 text-green-700 rounded-2xl flex items-center justify-center flex-shrink-0">
                                    <GiftIcon />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-green-900">Donations</h2>
                                    <p className="text-sm text-green-900/60 mt-0.5">
                                        When enabled, the Donate option is shown to users in their side panel.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${config.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                    {config.enabled ? 'Enabled' : 'Disabled'}
                                </span>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={config.enabled}
                                        onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                                        className="sr-only peer"
                                    />
                                    <div className="w-12 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-green-400 after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all"></div>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border border-green-200 rounded-2xl p-5 md:p-6">
                        <div className="flex items-start sm:items-center justify-between gap-4 mb-5">
                            <div>
                                <h2 className="text-lg font-bold text-green-900">Event QR Ph Payments</h2>
                                <p className="text-sm text-green-900/60 mt-0.5">
                                Enable PayMongo QR Ph payments for event reservations only. Ticket reservations are not affected.
                                </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                                <input
                                    type="checkbox"
                                    checked={eventPayment.enabled}
                                    onChange={(e) => setEventPayment({ ...eventPayment, enabled: e.target.checked })}
                                    className="sr-only peer"
                                />
                                <div className="w-12 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-green-400 after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all"></div>
                            </label>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${eventPayment.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                {eventPayment.enabled ? 'Enabled' : 'Disabled'}
                            </span>
                            <div className="w-full max-w-xs">
                                 <label className="block text-sm font-medium text-green-900 mb-2">Fixed event reservation fee (PHP)</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={eventPayment.amountPerParticipant}
                                    onChange={(e) => setEventPayment({ ...eventPayment, amountPerParticipant: e.target.value })}
                                    className="w-full bg-[#f6fdf8] border border-green-200 rounded-xl px-4 py-3 text-green-900 focus:outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400/20 transition-all"
                                />
                            </div>
                        </div>
                        <p className="text-xs text-green-900/50 mt-4">PayMongo credentials must be configured on the backend before enabling this option.</p>
                    </div>

                    <div className="bg-white border border-green-200 rounded-2xl p-5 md:p-6">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                                <PhoneIcon />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-green-900">GCash Payment Details</h2>
                                <p className="text-sm text-green-900/60">
                                    These details are shown on the Donation page so visitors can send their donations.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-medium text-green-900 mb-2">GCash Number</label>
                                <input
                                    type="text"
                                    value={config.gcashNumber}
                                    onChange={(e) => setConfig({ ...config, gcashNumber: e.target.value.slice(0, 20) })}
                                    placeholder="e.g. 09171234567"
                                    className="w-full bg-[#f6fdf8] border border-green-200 rounded-xl px-4 py-3 text-green-900 placeholder-green-700/40 focus:outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400/20 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-green-900 mb-2">Account Name</label>
                                <input
                                    type="text"
                                    value={config.accountName}
                                    onChange={(e) => setConfig({ ...config, accountName: e.target.value.slice(0, 60) })}
                                    placeholder="e.g. Bulusan Zoo & Wildlife Park"
                                    className="w-full bg-[#f6fdf8] border border-green-200 rounded-xl px-4 py-3 text-green-900 placeholder-green-700/40 focus:outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400/20 transition-all"
                                />
                            </div>
                        </div>

                        <div className="mt-5">
                            <label className="block text-sm font-medium text-green-900 mb-2">Message to Donors (optional)</label>
                            <textarea
                                value={config.note}
                                onChange={(e) => setConfig({ ...config, note: e.target.value.slice(0, 300) })}
                                rows={3}
                                placeholder="A short thank-you note or message shown on the donation page."
                                className="w-full bg-[#f6fdf8] border border-green-200 rounded-xl px-4 py-3 text-green-900 placeholder-green-700/40 focus:outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400/20 transition-all resize-none"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-green-400 hover:bg-green-400 text-gray-900 rounded-xl font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <SaveIcon />
                            )}
                            {saving ? 'Saving...' : 'Save Settings'}
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default AdminSettings;