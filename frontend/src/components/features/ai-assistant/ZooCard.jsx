import { useState } from 'react';
import { Pet, Leaf, Calendar, ChevronDown } from 'reicon-react';
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
    const Icon = isAnimal ? Pet : isPlant ? Leaf : Calendar;

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
                        <Icon size={16} className="w-4 h-4" aria-hidden="true" />
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
                        <ChevronDown size={14} className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                )}
            </div>
        </div>
    );
};

export default ZooCard;
