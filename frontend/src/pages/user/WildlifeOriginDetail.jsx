import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, MapPoint as MapPin, Globe, X } from 'reicon-react';
import animalHabitats from '../../data/animal-habitats';
import { fetchAnimalDescription } from '../../services/animal-description-service';

const regionColors = {
    'Africa': 'bg-amber-100 text-amber-800 border-amber-200',
    'Asia': 'bg-green-100 text-green-800 border-green-200',
    'Australia & Oceania': 'bg-teal-100 text-teal-800 border-teal-200',
    'The Americas': 'bg-blue-100 text-blue-800 border-blue-200',
    'Polar Regions': 'bg-cyan-100 text-cyan-800 border-cyan-200',
    'Europe': 'bg-orange-100 text-orange-800 border-orange-200',
};

const WildlifeOriginDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [animal, setAnimal] = useState(null);
    const [loading, setLoading] = useState(true);
    const [infoLoading, setInfoLoading] = useState(false);
    const [imageOpen, setImageOpen] = useState(false);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        const found = animalHabitats.find(a => String(a.id) === String(id));
        if (found) {
            setAnimal(found);
            setNotFound(false);
        } else {
            setNotFound(true);
        }
        setLoading(false);
    }, [id]);

    useEffect(() => {
        if (!animal) return undefined;
        let active = true;
        setInfoLoading(true);
        fetchAnimalDescription(animal.species || animal.name)
            .then(info => {
                if (!active || !info?.success) return;
                setAnimal(prev => prev?.id === animal.id ? {
                    ...prev,
                    description: info.description || prev.description,
                    image: info.thumbnail || prev.image,
                    scientificName: info.scientificName || prev.species,
                    sourceUrl: info.pageUrl
                } : prev);
            })
            .finally(() => { if (active) setInfoLoading(false); });
        return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [animal?.id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#eef3ed] flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-[#d5e1d5] border-t-[#1f3328] rounded-full animate-spin" />
            </div>
        );
    }

    if (notFound || !animal) {
        return (
            <div className="min-h-screen bg-[#eef3ed] flex flex-col items-center justify-center p-6 text-center">
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#6d8572]">Animal not found</p>
                <Link to="/map" replace className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[#1f3328] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#294536]">
                    <ChevronLeft className="h-4 w-4" /> Back to Wildlife Origins
                </Link>
            </div>
        );
    }

    const regionClass = regionColors[animal.region] || 'bg-gray-100 text-gray-800 border-gray-200';

    return (
        <div className="min-h-screen bg-[#eef3ed] text-[#1f3328] antialiased">
            {/* Top bar */}
            <header className="fixed inset-x-0 top-0 z-[200] flex items-center justify-between px-4 py-3 md:px-8 md:py-4">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 rounded-2xl bg-white/90 backdrop-blur-md px-4 py-2.5 text-sm font-bold shadow-sm border border-[#dce5dc] transition hover:bg-white" aria-label="Back to map">
                    <ChevronLeft className="h-5 w-5" /> <span className="hidden sm:inline">Back to Map</span>
                </button>
                <Link to="/map" replace className="flex items-center gap-2 rounded-2xl bg-[#1f3328] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#294536]">
                    <Globe className="h-4 w-4" /> Wildlife Origins
                </Link>
            </header>

            {/* Hero image */}
            <section className="relative w-full h-[50vh] md:h-[65vh] overflow-hidden">
                <img src={animal.image} alt={animal.name} className="h-full w-full object-cover" onClick={() => setImageOpen(true)} />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1f3328]/70 via-transparent to-[#1f3328]/30" />
                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12">
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest ${regionClass}`}>
                        <MapPin className="h-3 w-3" /> {animal.region}
                    </span>
                    <h1 className="mt-4 text-4xl sm:text-5xl md:text-7xl font-black leading-[0.92] tracking-[-0.05em] text-white drop-shadow-lg">{animal.name}</h1>
                    <p className="mt-2 text-lg md:text-xl italic text-white/80 font-medium">{animal.scientificName || animal.species}</p>
                </div>
            </section>

            {/* Content */}
            <main className="mx-auto max-w-5xl px-4 py-10 md:py-16 space-y-10 md:space-y-14">
                {/* Quick facts grid */}
                <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <FactCard label="Category" value={animal.category} />
                    <FactCard label="Native Zone" value={animal.habitat} />
                    <FactCard label="Region" value={animal.region} />
                    <FactCard label="GPS Coordinates" value={`${animal.coordinates[0]}°, ${animal.coordinates[1]}°`} mono />
                </section>

                {/* Description */}
                <section className="rounded-3xl bg-white border border-[#dce5dc] p-6 md:p-10">
                    <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[#315b37] mb-4">Ecological Note</h2>
                    {infoLoading ? (
                        <div className="space-y-3">
                            <div className="h-4 w-3/4 rounded-full bg-[#edf3eb] animate-pulse" />
                            <div className="h-4 w-full rounded-full bg-[#edf3eb] animate-pulse" />
                            <div className="h-4 w-2/3 rounded-full bg-[#edf3eb] animate-pulse" />
                        </div>
                    ) : (
                        <p className="text-[#52675a] leading-relaxed text-base md:text-lg font-medium">{animal.description}</p>
                    )}
                    {animal.sourceUrl && (
                        <a href={animal.sourceUrl} target="_blank" rel="noreferrer" className="mt-6 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[#52745a] underline underline-offset-4 hover:text-[#315b37] transition-colors">
                            Read source on Wikipedia
                        </a>
                    )}
                </section>

                {/* Map preview */}
                <section className="rounded-3xl bg-white border border-[#dce5dc] overflow-hidden">
                    <div className="p-6 md:p-8 border-b border-[#dce5dc]">
                        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[#315b37] mb-1">Habitat Location</h2>
                        <p className="text-sm text-[#6d8572] font-medium">{animal.habitat}</p>
                    </div>
                    <div className="relative h-64 md:h-80 bg-[#e8eee8]">
                        <iframe
                            title={`Map of ${animal.name}`}
                            width="100%"
                            height="100%"
                            style={{ border: 0 }}
                            loading="lazy"
                            src={`https://www.openstreetmap.org/export/embed.html?bbox=${animal.coordinates[1] - 5},${animal.coordinates[0] - 5},${animal.coordinates[1] + 5},${animal.coordinates[0] + 5}&layer=mapnik&marker=${animal.coordinates[0]},${animal.coordinates[1]}`}
                        />
                    </div>
                </section>

                {/* Back link */}
                <div className="flex justify-center pt-4 pb-8">
                    <Link to="/map" replace className="inline-flex items-center gap-2 rounded-2xl bg-[#1f3328] px-6 py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-[#294536] hover:shadow-lg active:scale-95">
                        <ChevronLeft className="h-4 w-4" /> Back to Wildlife Origins
                    </Link>
                </div>
            </main>

            {/* Full-screen image overlay */}
            {imageOpen && (
                <div className="fixed inset-0 z-[300] bg-[#1f3328]/95 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setImageOpen(false)}>
                    <button onClick={() => setImageOpen(false)} className="absolute top-4 right-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-white transition hover:bg-white/30" aria-label="Close image">
                        <X className="h-6 w-6" />
                    </button>
                    <img src={animal.image} alt={animal.name} className="max-h-[90vh] max-w-full rounded-2xl object-contain shadow-2xl" onClick={e => e.stopPropagation()} />
                </div>
            )}
        </div>
    );
};

const FactCard = ({ label, value, mono }) => (
    <div className="rounded-2xl bg-white border border-[#dce5dc] p-4 md:p-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#6d8572] mb-1">{label}</p>
        <p className={`font-bold text-[#1f3328] text-sm ${mono ? 'font-mono break-words' : ''}`}>{value || '—'}</p>
    </div>
);

export default WildlifeOriginDetail;
