import { useState } from 'react';
import { CloseCircle, Gift, Calendar } from 'reicon-react';
import AdminSettings from '../../pages/admin/AdminSettings';

const categories = [
    { id: 'donations', title: 'Donation settings', description: 'Manage GCash details and online donations.', Icon: Gift },
    { id: 'events', title: 'Event payments', description: 'Manage reservation fees and PayMongo payments.', Icon: Calendar }
];

const AdminSettingsLauncher = ({ isOpen, onClose }) => {
    const [selected, setSelected] = useState(null);
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[75] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
            {!selected ? <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl sm:p-8"><div className="mb-6 flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Administration</p><h2 className="mt-2 text-2xl font-bold text-slate-900">What would you like to change?</h2><p className="mt-2 text-sm text-slate-500">Choose a settings category to open its controls.</p></div><button onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"><CloseCircle size={21} /></button></div><div className="flex flex-col gap-3">{categories.map(({ id, title, description, Icon }) => <button key={id} type="button" onClick={() => setSelected(id)} className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:translate-x-1 hover:border-emerald-300 hover:bg-emerald-50"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-700 shadow-sm"><Icon size={21} /></span><span><p className="font-bold text-slate-900">{title}</p><p className="mt-1 text-xs leading-5 text-slate-500">{description}</p></span></button>)}</div></div> : <div className="relative max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-3xl bg-white shadow-2xl"><button onClick={() => setSelected(null)} className="absolute right-5 top-5 z-10 rounded-xl bg-white/80 p-2 text-slate-400 hover:bg-slate-100"><CloseCircle size={21} /></button><AdminSettings modalSection={selected} onClose={() => { setSelected(null); onClose(); }} /></div>}
        </div>
    );
};

export default AdminSettingsLauncher;
