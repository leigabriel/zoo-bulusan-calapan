import { CloseCircle } from 'reicon-react';
import PasswordInput from './PasswordInput';

const MasterKeyToggleModal = ({ isOpen, onClose, enabled, form, setForm, saving, onSubmit }) => {
    if (!isOpen) return null;
    const nextState = !enabled;
    const update = (field, value) => setForm({ ...form, [field]: value });

    return (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-200 p-6"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Admin security</p><h2 className="mt-1 text-2xl font-bold text-slate-900">{nextState ? 'Enable' : 'Disable'} Master Key</h2></div><button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"><CloseCircle size={21} /></button></div>
                <div className="space-y-5 p-6"><div className={`rounded-2xl p-4 text-sm ${nextState ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'}`}>This will <strong>{nextState ? 'require' : 'stop requiring'}</strong> the Master Key during admin login. Your saved key will not be changed.</div><PasswordInput autoComplete="current-password" value={form.currentPassword} onChange={e => update('currentPassword', e.target.value)} placeholder="Current account password" className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 focus:border-emerald-500 focus:outline-none" /><p className="text-xs leading-5 text-slate-500">Your current account password is required to confirm this change.</p><div className="flex justify-end gap-3"><button type="button" onClick={onClose} className="rounded-xl px-5 py-3 font-semibold text-slate-600 hover:bg-slate-100">Cancel</button><button type="button" disabled={saving} onClick={() => onSubmit(nextState)} className={`rounded-xl px-5 py-3 font-semibold text-white disabled:opacity-50 ${nextState ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-600 hover:bg-amber-700'}`}>{saving ? 'Saving...' : `Confirm ${nextState ? 'enable' : 'disable'}`}</button></div></div>
            </div>
        </div>
    );
};

export default MasterKeyToggleModal;
