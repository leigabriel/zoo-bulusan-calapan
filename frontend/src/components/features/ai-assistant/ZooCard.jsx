import { useState } from 'react';
import { AI_ASSISTANT_THEME } from '../../../config/ai-assistant-theme';

const DEFAULT_THEME = AI_ASSISTANT_THEME;

const STATUS_STYLES = {
    healthy: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    recovering: 'bg-amber-50 text-amber-700 border-amber-200',
    sick: 'bg-rose-50 text-rose-700 border-rose-200',
    upcoming: 'bg-sky-50 text-sky-700 border-sky-200',
    ongoing: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    past: 'bg-slate-100 text-slate-600 border-slate-300'
};

const KIND_META = {
    animal: { color: '#16a34a', label: 'Animal', icon: 'paw' },
    plant: { color: '#0d9488', label: 'Plant', icon: 'leaf' },
    'zoo-event': { color: '#6366f1', label: 'Event', icon: 'calendar' }
};

const PawIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M9.75 8.25a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5zm4.5 0a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5zM2.25 9.5a2.75 2.75 0 100-5.5 2.75 2.75 0 000 5.5zm19.5 0a2.75 2.75 0 100-5.5 2.75 2.75 0 000 5.5zM12 11.5c-3.313 0-6.3 1.743-8.15 4.356A6.931 6.931 0 0012 23a6.931 6.931 0 008.15-7.144C18.3 13.243 15.313 11.5 12 11.5z" />
    </svg>
);

const LeafIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M20.904 2.204a.75.75 0 00-.808-.098C14.1 4.62 8.3 7.1 5.4 10.85c-2.9 3.75-2.7 7.9-.6 10.55a.75.75 0 001.2.1c2.1-2.5 5.5-4.85 8.4-6.2.95-.44 1.75-1 2.5-1.6 4.9-3.75 5.9-9.85 4-11.5zM9.2 18.25c1.2-2.3 3-4.15 5.1-5.5-1.5 2.05-3 3.7-5.1 5.5z" />
    </svg>
);

const CalendarIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path fillRule="evenodd" d="M6.75 2.25A.75.75 0 017.5 3v1.5h9V3A.75.75 0 0118 3v1.5h.75a3 3 0 013 3v11.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V7.5a3 3 0 013-3H6V3a.75.75 0 01.75-.75zm13.5 9a1.5 1.5 0 00-1.5-1.5H5.25a1.5 1.5 0 00-1.5 1.5v7.5a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5v-7.5z" clipRule="evenodd" />
    </svg>
);

const ChevronIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
        <path d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
);

const Row = ({ label, value, strong = false }) => (
    <div className="flex items-center justify-between gap-3 py-2">
        <span className="text-xs shrink-0 capitalize" style={{ color: DEFAULT_THEME.textMuted }}>{label}</span>
        <span className={`min-w-0 text-right text-sm capitalize break-words ${strong ? 'font-bold' : 'font-semibold'}`} style={{ color: DEFAULT_THEME.text }}>{value}</span>
    </div>
);

const ZooCard = ({ data, theme = DEFAULT_THEME }) => {
    const [expanded, setExpanded] = useState(false);
    if (!data) return null;

    const THEME = theme;

    const kind = KIND_META[data.kind] ? data.kind : 'animal';
    const meta = KIND_META[kind];
    const isAnimal = kind === 'animal';
    const isPlant = kind === 'plant';
    const isEvent = kind === 'zoo-event';

    const title = data.title || data.name || '—';
    const subtitle = isAnimal ? data.species : isPlant ? data.category : 'Upcoming Event';
    const status = isAnimal ? (data.status || 'healthy') : isEvent ? (data.status || 'upcoming') : data.category;
    const statusClass = isPlant
        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
        : STATUS_STYLES[status] || STATUS_STYLES.healthy;
    const Icon = isAnimal ? PawIcon : isPlant ? LeafIcon : CalendarIcon;

    const hasDescription = Boolean(data.description);

    return (
        <div
            className="w-full overflow-hidden rounded-2xl transition-transform active:scale-[0.99]"
            style={{
                background: THEME.surface,
                border: `1px solid ${THEME.border}`,
                boxShadow: '0 1px 3px rgba(15,23,42,0.06)'
            }}
        >
            {data.imageUrl && (
                <div className="relative h-32 w-full overflow-hidden" style={{ borderBottom: `1px dashed ${THEME.border}` }}>
                    <img src={data.imageUrl} alt={title} className="w-full h-full object-cover" loading="lazy" />
                    <span
                        className="absolute top-2 left-2 text-[10px] uppercase font-bold px-2.5 py-1 rounded-full border"
                        style={{ background: 'rgba(255,255,255,0.92)', color: meta.color, borderColor: THEME.border }}
                    >
                        {meta.label}
                    </span>
                </div>
            )}

            <div
                className="flex items-center justify-between gap-3 px-4 py-3"
                style={{ background: '#f8fafc', borderBottom: `1px dashed ${THEME.border}` }}
            >
                <div className="flex items-center gap-2.5 min-w-0">
                    <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: THEME.accentSoft, color: meta.color }}
                    >
                        <Icon />
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-bold truncate leading-tight" style={{ color: THEME.text }}>{title}</p>
                        <p className="text-[11px] leading-tight mt-0.5 capitalize truncate" style={{ color: THEME.textMuted }}>
                            {subtitle || meta.label}
                        </p>
                    </div>
                </div>
                {!isPlant && (
                    <span className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded-full border shrink-0 ${statusClass}`}>
                        {status}
                    </span>
                )}
            </div>

            <div className="px-4 py-3">
                {isAnimal && data.exhibit && <Row label="Exhibit" value={data.exhibit} />}
                {isAnimal && data.diet && <Row label="Diet" value={data.diet} />}
                {isPlant && data.scientificName && <Row label="Scientific Name" value={data.scientificName} strong />}
                {isEvent && data.date && <Row label="Date" value={data.date} strong />}
                {isEvent && data.time && <Row label="Time" value={data.time} />}
                {isEvent && data.location && <Row label="Location" value={data.location} />}

                {expanded && hasDescription && (
                    <div className="pt-3 mt-2" style={{ borderTop: `1px solid ${THEME.border}` }}>
                        <p className="text-xs leading-relaxed" style={{ color: THEME.textMuted }}>{data.description}</p>
                    </div>
                )}

                {hasDescription && (
                    <button
                        type="button"
                        onClick={() => setExpanded(v => !v)}
                        className={`w-full flex items-center justify-center gap-1.5 py-2.5 mt-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${expanded ? 'opacity-80' : ''}`}
                        style={{ background: THEME.accentSoft, color: THEME.text }}
                    >
                        {expanded ? 'Show Less' : 'Show More'}
                        <ChevronIcon />
                    </button>
                )}
            </div>
        </div>
    );
};

export default ZooCard;