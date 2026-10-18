import { CloseCircle } from 'reicon-react';
import PasswordInput from './PasswordInput';

/**
 * Deleting the Master Key removes admin login's second factor permanently. The
 * account password confirms it; the confirm button stays disabled until one is
 * typed so it cannot be triggered by a stray click.
 */
const MasterKeyDeleteModal = ({ isOpen, onClose, form, setForm, saving, onSubmit }) => {
    if (!isOpen) return null;
    const update = (field, value) => setForm({ ...form, [field]: value });
    const canSubmit = Boolean(form.currentPassword) && !saving;

    return (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl">
                <div className="flex items-start justify-between border-b border-slate-200 p-6">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-red-600">Admin security</p>
                        <h2 className="mt-1 text-2xl font-bold text-slate-900">Delete Master Key</h2>
                    </div>
                    <button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100" aria-label="Close">
                        <CloseCircle size={21} />
                    </button>
                </div>

                <div className="space-y-5 p-6">
                    <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-800">
                        This <strong>permanently deletes</strong> your saved Master Key. Admin login will no longer ask
                        for a second factor, and the old key cannot be restored &mdash; you would have to create a new one.
                    </div>

                    <PasswordInput
                        autoComplete="current-password"
                        value={form.currentPassword || ''}
                        onChange={e => update('currentPassword', e.target.value)}
                        placeholder="Current account password"
                        className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 focus:border-red-500 focus:outline-none"
                    />

                    <p className="text-xs leading-5 text-slate-500">
                        Your current account password is required to confirm this. This is recorded in the activity log.
                    </p>

                    <div className="flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="rounded-xl px-5 py-3 font-semibold text-slate-600 hover:bg-slate-100">
                            Cancel
                        </button>
                        <button
                            type="button"
                            disabled={!canSubmit}
                            onClick={onSubmit}
                            className="rounded-xl bg-red-600 px-5 py-3 font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {saving ? 'Deleting...' : 'Delete Master Key'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MasterKeyDeleteModal;
