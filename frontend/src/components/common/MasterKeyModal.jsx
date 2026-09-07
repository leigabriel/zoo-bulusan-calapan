import { CloseCircle } from 'reicon-react';
import PasswordInput from './PasswordInput';

const MasterKeyModal = ({ isOpen, onClose, status, form, setForm, saving, onSubmit }) => {
    if (!isOpen) return null;
    const configured = Boolean(status?.configured);
    const update = (field, value) => setForm({ ...form, [field]: value });

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-200 p-5"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Admin security</p><h2 className="mt-1 text-xl font-bold text-slate-900">{configured ? 'Change Master Key' : 'Add Master Key'}</h2></div><button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"><CloseCircle size={21} /></button></div>
                <div className="space-y-4 p-5">
                    <div className="flex items-center justify-between rounded-2xl border border-emerald-100 bg-emerald-50 p-4"><div><p className="text-sm font-semibold text-slate-900">Verification status</p><p className="text-xs text-slate-500">{configured ? 'A Master Key is configured.' : 'Admin login is not protected yet.'}</p></div><span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-emerald-700">{configured ? (status.enabled ? 'Enabled' : 'Disabled') : 'Not set'}</span></div>
                    <PasswordInput autoComplete="current-password" value={form.currentPassword} onChange={e => update('currentPassword', e.target.value)} placeholder="Current account password" className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 focus:border-emerald-500 focus:outline-none" />
                    {configured && <PasswordInput autoComplete="off" value={form.currentMasterKey} onChange={e => update('currentMasterKey', e.target.value)} placeholder="Current Master Key" className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 focus:border-emerald-500 focus:outline-none" />}
                    <PasswordInput autoComplete="new-password" value={form.newMasterKey} onChange={e => update('newMasterKey', e.target.value)} placeholder={configured ? 'New Master Key' : 'Create Master Key'} className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 focus:border-emerald-500 focus:outline-none" />
                    <p className="text-xs leading-5 text-slate-500">Master Keys are stored as secure hashes. The eye button only reveals what you are currently typing.</p>
                    <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={onClose} className="rounded-xl px-4 py-3 font-semibold text-slate-600 hover:bg-slate-100">Close</button><button type="button" disabled={saving} onClick={() => onSubmit(configured ? 'change' : 'create')} className="rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">{saving ? 'Saving...' : configured ? 'Change Master Key' : 'Add Master Key'}</button></div>
                </div>
            </div>
        </div>
    );
};

export default MasterKeyModal;
