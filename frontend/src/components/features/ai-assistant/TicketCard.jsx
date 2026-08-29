import { AI_ASSISTANT_THEME } from '../../../config/ai-assistant-theme';

const THEME = AI_ASSISTANT_THEME;

const STATUS_STYLES = {
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    completed: 'bg-sky-50 text-sky-700 border-sky-200',
    cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
    no_show: 'bg-slate-100 text-slate-600 border-slate-300'
};

const TicketIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path fillRule="evenodd" d="M1.5 6.375c0-1.036.84-1.875 1.875-1.875h17.25c1.035 0 1.875.84 1.875 1.875v3.026a.75.75 0 01-.375.65 2.249 2.249 0 000 3.898.75.75 0 01.375.65v3.026c0 1.035-.84 1.875-1.875 1.875H3.375A1.875 1.875 0 011.5 17.625v-3.026a.75.75 0 01.374-.65 2.249 2.249 0 000-3.898.75.75 0 01-.374-.65V6.375zm15-1.125a.75.75 0 01.75.75v.75a.75.75 0 01-1.5 0V6a.75.75 0 01.75-.75zm.75 4.5a.75.75 0 00-1.5 0v.75a.75.75 0 001.5 0v-.75zm-.75 3a.75.75 0 01.75.75v.75a.75.75 0 01-1.5 0v-.75a.75.75 0 01.75-.75zm.75 4.5a.75.75 0 00-1.5 0V18a.75.75 0 001.5 0v-.75zM6 12a.75.75 0 01.75-.75H12a.75.75 0 010 1.5H6.75A.75.75 0 016 12zm.75 2.25a.75.75 0 000 1.5h3a.75.75 0 000-1.5h-3z" clipRule="evenodd" />
    </svg>
);

const CalendarIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path fillRule="evenodd" d="M6.75 2.25A.75.75 0 017.5 3v1.5h9V3A.75.75 0 0118 3v1.5h.75a3 3 0 013 3v11.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V7.5a3 3 0 013-3H6V3a.75.75 0 01.75-.75zm13.5 9a1.5 1.5 0 00-1.5-1.5H5.25a1.5 1.5 0 00-1.5 1.5v7.5a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5v-7.5z" clipRule="evenodd" />
    </svg>
);

const Row = ({ label, value, strong = false }) => (
    <div className="flex items-center justify-between gap-3 py-2">
        <span className="text-xs shrink-0" style={{ color: THEME.textMuted }}>{label}</span>
        <span className={`min-w-0 text-right text-sm break-words ${strong ? 'font-bold' : 'font-semibold'}`} style={{ color: THEME.text }}>{value}</span>
    </div>
);

const TicketCard = ({ data }) => {
    if (!data) return null;

    const isEvent = data.kind === 'event';
    const statusClass = STATUS_STYLES[data.status] || STATUS_STYLES.pending;

    return (
        <div
            className="w-full overflow-hidden rounded-2xl"
            style={{
                background: THEME.surface,
                border: `1px solid ${THEME.border}`,
                boxShadow: '0 1px 3px rgba(15,23,42,0.06)'
            }}
        >
            <div
                className="flex items-center justify-between gap-3 px-4 py-3"
                style={{ background: '#f8fafc', borderBottom: `1px dashed ${THEME.border}` }}
            >
                <div className="flex items-center gap-2.5 min-w-0">
                    <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: THEME.accentSoft, color: isEvent ? '#0d9488' : '#6366f1' }}
                    >
                        {isEvent ? <CalendarIcon /> : <TicketIcon />}
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-bold truncate leading-tight" style={{ color: THEME.text }}>{data.title}</p>
                        <p className="text-[11px] leading-tight mt-0.5" style={{ color: THEME.textMuted }}>
                            {isEvent ? 'Event Reservation' : 'Ticket Reservation'}
                        </p>
                    </div>
                </div>
                <span className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded-full border shrink-0 ${statusClass}`}>
                    {data.status || 'pending'}
                </span>
            </div>

            <div className="px-4 py-3">
                <div className="text-center pb-2 mb-1">
                    <p className="text-[10px] uppercase tracking-widest" style={{ color: THEME.textMuted }}>Reference No.</p>
                    <p className="font-mono text-sm font-bold mt-0.5 break-all" style={{ color: THEME.text }}>{data.reference || '—'}</p>
                </div>

                {data.name && <Row label="Buyer" value={data.name} />}
                <Row label="Date" value={data.date || '—'} />
                {data.time && <Row label="Time" value={data.time} />}

                {isEvent ? (
                    <Row label="Participants" value={String(data.participants ?? '—')} />
                ) : (
                    <>
                        {data.adults > 0 && <Row label="Adults" value={`${data.adults} × P40`} />}
                        {data.children > 0 && <Row label="Children" value={`${data.children} × P20`} />}
                        {data.residents > 0 && <Row label="Residents" value={`${data.residents} (FREE)`} />}
                        {data.visitors > 0 && <Row label="Visitors" value={String(data.visitors)} />}
                    </>
                )}

                {!isEvent && (
                    <div
                        className="flex items-center justify-between pt-3 mt-2"
                        style={{ borderTop: `1px solid ${THEME.border}` }}
                    >
                        <span className="text-xs font-bold uppercase tracking-wide" style={{ color: THEME.text }}>Total</span>
                        <span className="font-bold text-base" style={{ color: THEME.text }}>
                            {data.total === 0 ? 'FREE' : `P${data.total}`}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TicketCard;