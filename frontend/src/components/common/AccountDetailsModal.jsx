import { useState } from 'react';
import { CloseCircle } from 'reicon-react';

const AccountDetailsModal = ({ isOpen, onClose, role, profile, previewImage, fileInputRef, imageUploading, onUploadImage, onSaveDetails, profileSaving, onPassword, onMasterKey, onToggleMasterKey, masterKeyLabel = 'Master Key', masterKeyConfigured = false, masterKeyEnabled = false }) => {
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState(profile);

    if (!isOpen) return null;

    const openEditor = () => {
        setForm(profile);
        setEditing(true);
    };

    const save = async () => {
        await onSaveDetails(form);
        setEditing(false);
    };

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4 backdrop-blur-sm">
                <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl">
                    <div className="flex items-center justify-between border-b border-gray-200 p-5"><div><p className="text-xs font-bold uppercase tracking-widest text-emerald-700">Account</p><h2 className="text-xl font-bold text-gray-900">{role} details</h2></div><button onClick={onClose} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"><CloseCircle size={20} /></button></div>
                    <div className="space-y-5 p-5">
                        <div className="flex items-center gap-4 rounded-2xl bg-gray-50 p-4">
                            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-green-300 to-green-500 text-2xl font-bold text-gray-900">{previewImage ? <img src={previewImage} alt="Profile" className="h-full w-full object-cover" /> : profile.firstName?.charAt(0) || role.charAt(0)}</div>
                            <div><p className="font-bold text-gray-900">{profile.firstName} {profile.lastName}</p><p className="text-sm text-gray-500">{profile.email}</p><span className="mt-1 inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold capitalize text-emerald-700">{role}</span></div>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2"><div className="rounded-xl border border-gray-200 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-gray-400">First name</p><p className="mt-1 font-semibold text-gray-900">{profile.firstName || 'Not provided'}</p></div><div className="rounded-xl border border-gray-200 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Last name</p><p className="mt-1 font-semibold text-gray-900">{profile.lastName || 'Not provided'}</p></div><div className="rounded-xl border border-gray-200 p-4 sm:col-span-2"><p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Email address</p><p className="mt-1 font-semibold text-gray-900">{profile.email || 'Not provided'}</p></div></div>
                        <div className="grid gap-3 sm:grid-cols-2"><button type="button" onClick={onPassword} className="rounded-xl border border-emerald-300 px-4 py-3 font-semibold text-emerald-700 hover:bg-emerald-50">Change password</button>{role === 'Admin' && <button type="button" onClick={onMasterKey} className="rounded-xl border border-emerald-300 px-4 py-3 font-semibold text-emerald-700 hover:bg-emerald-50">{masterKeyLabel}</button>}{role === 'Admin' && masterKeyConfigured && <button type="button" onClick={onToggleMasterKey} className="rounded-xl border border-amber-300 px-4 py-3 font-semibold text-amber-700 hover:bg-amber-50">{masterKeyEnabled ? 'Disable Master Key' : 'Enable Master Key'}</button>}<button type="button" onClick={openEditor} className="rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white hover:bg-emerald-700 sm:col-span-2">Change details</button></div>
                    </div>
                </div>
            </div>
            {editing && <div className="fixed inset-0 z-[70] flex items-center justify-center bg-gray-900/55 p-4 backdrop-blur-sm"><div className="w-full max-w-xl rounded-3xl bg-white shadow-2xl"><div className="flex items-center justify-between border-b border-gray-200 p-5"><h2 className="text-xl font-bold text-gray-900">Change details</h2><button onClick={() => setEditing(false)} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"><CloseCircle size={20} /></button></div><div className="space-y-4 p-5"><input value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} placeholder="First name" className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 outline-none focus:border-emerald-500" /><input value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} placeholder="Last name" className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 outline-none focus:border-emerald-500" /><div><input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onUploadImage} /><button type="button" disabled={imageUploading} onClick={() => fileInputRef.current?.click()} className="text-sm font-semibold text-emerald-700">{imageUploading ? 'Uploading...' : 'Change profile photo'}</button></div><div className="flex justify-end gap-3"><button onClick={() => setEditing(false)} className="rounded-xl px-4 py-3 text-gray-600 hover:bg-gray-100">Cancel</button><button onClick={save} disabled={profileSaving} className="rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white disabled:opacity-50">{profileSaving ? 'Saving...' : 'Save details'}</button></div></div></div></div>}
        </>
    );
};

export default AccountDetailsModal;
