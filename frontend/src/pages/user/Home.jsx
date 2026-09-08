import React, { useRef, useLayoutEffect } from 'react';
import { ReactLenis } from 'lenis/react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import AIFloatingButton from '../../components/common/AIFloatingButton';
import { userAPI, communityAPI } from '../../services/api-client';
import { useAuth } from '../../context/AuthContext';
import '../../App.css';

gsap.registerPlugin(ScrollTrigger);

const ticketMaskStyle = {
    WebkitMaskImage: 'radial-gradient(circle at 0px 50%, transparent 5px, black 6px), radial-gradient(circle at 100% 50%, transparent 5px, black 6px)',
    WebkitMaskSize: '51% 16px',
    WebkitMaskRepeat: 'repeat-y',
    WebkitMaskPosition: 'left, right',
    maskImage: 'radial-gradient(circle at 0px 50%, transparent 5px, black 6px), radial-gradient(circle at 100% 50%, transparent 5px, black 6px)',
    maskSize: '51% 16px',
    maskRepeat: 'repeat-y',
    maskPosition: 'left, right',
};

const HeroSection = () => {
    const navigate = useNavigate();
    const containerRef = useRef(null);

    useLayoutEffect(() => {
        document.body.style.overflow = 'auto';

        const headerEl = document.querySelector('header');
        if (headerEl) {
            gsap.set(headerEl, { opacity: 1, pointerEvents: 'auto' });
        }

        const ctx = gsap.context(() => {
            const tl = gsap.timeline();

            tl.fromTo('.hero-deer',
                { opacity: 0, scale: 0.5, y: 50 },
                { opacity: 1, scale: 1, y: 0, duration: 1, ease: 'back.out(1.5)' }, 0
            )
                .fromTo('.hero-title',
                    { opacity: 0, y: 50, skewY: 5 },
                    { opacity: 1, y: 0, skewY: 0, duration: 1, ease: 'expo.out' }, 0.15
                )
                .fromTo('.hero-line',
                    { clipPath: 'inset(100% 0% 0% 0%)', y: 50 },
                    { clipPath: 'inset(0% 0% 0% 0%)', y: 0, duration: 1.25, ease: 'expo.out', stagger: 0.12 }, 0.25
                )
                .fromTo('.hero-btn',
                    { opacity: 0, scale: 0.9, y: 30 },
                    { opacity: 1, scale: 1, y: 0, duration: 1, ease: 'elastic.out(1, 0.5)' }, 0.6
                );

            gsap.to('.hero-bg-parallax', {
                yPercent: 40,
                scale: 1.1,
                ease: 'none',
                scrollTrigger: {
                    trigger: containerRef.current,
                    start: 'top top',
                    end: 'bottom top',
                    scrub: true,
                }
            });

            gsap.to('.hero-content, .hero-images', {
                yPercent: 40,
                opacity: 0,
                ease: 'none',
                scrollTrigger: {
                    trigger: containerRef.current,
                    start: 'top top',
                    end: 'bottom top',
                    scrub: true,
                }
            });

        }, containerRef);

        return () => ctx.revert();
    }, []);

    return (
        <div ref={containerRef} className="relative w-full min-h-[100dvh] overflow-hidden bg-white">
            <section className="relative mx-auto max-w-[2000px] w-full min-h-[100dvh] flex flex-col items-center justify-center overflow-hidden">
                <div className="hero-bg-parallax absolute inset-0 bg-white -z-10 origin-bottom" />

                <div className="hero-images absolute inset-0 z-0 overflow-hidden pointer-events-none">
                    <img
                        src="/deer.png"
                        alt=""
                        aria-hidden="true"
                        className="hero-deer absolute bottom-0 left-[-3rem] w-[78vw] max-w-[40rem] origin-bottom-left object-contain object-bottom opacity-0 sm:left-[-2rem] sm:w-[48vw] md:left-0 md:w-[43vw]"
                    />
                </div>

                <div className="hero-content text-center flex flex-col items-center z-10 px-4 sm:px-5 pointer-events-none">
                    <h2 className="hero-title opacity-0 font-['Mistral',_cursive] text-[clamp(2rem,5vw,5rem)] text-black -mb-1 sm:-mb-2">
                        Welcome to
                    </h2>
                    <div className="mb-[20px] sm:mb-[30px]">
                        <div className="text-[clamp(2.5rem,8vw,6rem)] font-semibold text-black leading-none tracking-tight overflow-hidden py-2 sm:py-4">
                            <span className="block overflow-hidden">
                                <span
                                    className="hero-line block"
                                    style={{ clipPath: 'inset(100% 0% 0% 0%)' }}
                                >
                                    BULUSAN ZOO
                                </span>
                            </span>
                        </div>

                        <div className="overflow-hidden mt-2">
                            <p
                                className="hero-line text-md sm:text-xl md:text-2xl font-semibold text-black/70 tracking-wide"
                                style={{ clipPath: 'inset(100% 0% 0% 0%)' }}
                            >
                                Explore Nature, Learn, and Connect
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate('/reservations')}
                        className="hero-btn group pointer-events-auto bg-green-400 text-black p-1 sm:p-1.5 rounded-xl cursor-pointer transition-all duration-300 ease-out hover:scale-110 hover:drop-shadow-xl active:scale-95 focus:outline-none drop-shadow-md transform-gpu"
                        style={ticketMaskStyle}
                    >
                        <div className="w-full h-full rounded-lg flex items-center justify-center py-1.5 sm:py-0.5 px-7 sm:px-9">
                            <span className="font-['Mistral',_cursive] text-[1.5rem] sm:text-[2rem] tracking-[1px] block mt-1 transition-transform duration-300 ease-out group-hover:scale-105">
                                Plan a Visit
                            </span>
                        </div>
                    </button>
                </div>
            </section>
        </div>
    );
};

const AboutSection = () => {
    return (
        <section className="relative w-full min-h-[100svh] p-4 sm:p-8 flex items-center justify-center bg-green-400">
            <div className="w-full mx-auto max-w-[1800px] h-full min-h-[80vh] flex justify-center items-center text-center rounded-[1.5rem] sm:rounded-[2rem] bg-green-400 p-6 sm:p-12">
                <h1 className="w-full max-w-[1800px] text-black text-4xl sm:text-5xl md:text-6xl font-black leading-snug sm:leading-tight">
                    Bulusan Zoo Nature Park is more than a destination, it is a place where nature, wildlife, and serenity meet, inviting every visitor to slow down, appreciate, and reconnect with the beauty of the natural world.
                </h1>
            </div>
        </section>
    );
};

const TICKET_TYPES = [
    { key: 'adult', name: 'Adult Ticket', detail: 'Ages 18 and above', price: 40 },
    { key: 'child', name: 'Child Ticket', detail: 'Ages 4-17', price: 20 },
    { key: 'bulusan_resident', name: 'Bulusan Resident', detail: 'Free with valid ID', price: 0 },
];

const SCANNER_CLASSES = ['Monkey', 'Tiger', 'Parrot', 'Deer', 'Dove', 'Rabbit', 'Horse', 'Ostrich', 'Owl', 'Eagle', 'Human'];

const FAQ_ITEMS = [
    {
        question: 'How do I reserve a zoo visit?',
        answer: 'Open Reservations, choose your ticket quantities, select an available visit date and arrival time, enter the required visitor details, and submit the reservation.'
    },
    {
        question: 'How do event reservations work?',
        answer: 'Open Events, choose an available activity, complete the event reservation details, and keep the reservation reference shown after submission.'
    },
    {
        question: 'What can the AI Animal Scanner identify?',
        answer: `The current local classifier is trained for ${SCANNER_CLASSES.join(', ')}. Clear, centered photos with good lighting give the model the best input.`
    },
    {
        question: 'What can Jiji help me with?',
        answer: 'Jiji can assist with zoo information, animals, ticketing, events, navigation, and other visitor questions supported by the current assistant implementation.'
    },
    {
        question: 'Where can I get support?',
        answer: 'Open the Help Center for visitor guidance. Signed-in users can also use My Messages to contact support and review replies or case status.'
    },
];

const VISITOR_RULES = [
    'Maximum 20 visitors per ticket booking.',
    'Choose an available arrival slot before submitting a ticket reservation.',
    'Last entry is 4:00 PM.',
    'Holiday schedules may vary.'
];

const clampText = (value, max = 170) => {
    const text = String(value || '').trim();
    if (!text) return '';
    return text.length > max ? `${text.slice(0, max).trim()}…` : text;
};

const formatPrice = (price) => price === 0 ? 'Free' : `₱${price}`;

const formatDate = (value) => {
    if (!value) return '';
    const raw = typeof value === 'string' ? value.split('T')[0] : value;
    const date = new Date(typeof raw === 'string' ? `${raw}T00:00:00` : raw);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatTime = (value) => {
    if (!value) return '';
    const parts = String(value).split(':');
    if (parts.length < 2) return String(value);
    const hour = Number(parts[0]);
    if (Number.isNaN(hour)) return String(value);
    return `${hour % 12 || 12}:${parts[1]} ${hour >= 12 ? 'PM' : 'AM'}`;
};

const normalizeAnimal = (animal) => ({
    id: animal.id,
    name: animal.name || 'Animal',
    species: animal.species || '',
    description: animal.description || animal.animal_information || animal.animalInformation || '',
    imageUrl: animal.image_url || animal.imageUrl || null,
    habitat: animal.habitat || animal.exhibit || '',
    diet: animal.diet || '',
    status: animal.status || ''
});

const normalizePlant = (plant) => ({
    id: plant.id,
    name: plant.name || 'Plant',
    scientificName: plant.scientific_name || plant.scientificName || '',
    category: plant.category || 'Flora',
    description: plant.description || '',
    imageUrl: plant.image_url || plant.imageUrl || null
});

const normalizeEvent = (event) => {
    const eventDate = event.event_date || event.date || '';
    const capacity = event.remaining_capacity ?? event.available_slots ?? event.remaining_slots ?? null;
    return {
        id: event.id,
        title: event.title || event.name || 'Zoo Event',
        description: event.description || '',
        date: eventDate,
        startTime: event.start_time || event.time || '',
        endTime: event.end_time || '',
        location: event.location || '',
        status: event.status || '',
        imageUrl: event.image_url || event.imageUrl || null,
        availability: capacity
    };
};

const Arrow = () => <span aria-hidden="true">↗</span>;

const PrimaryAction = ({ children, onClick, href, disabled = false, light = false, className = '' }) => {
    const classes = `inline-flex min-h-12 items-center justify-center gap-3 rounded-full px-6 py-3 text-sm font-black transition-transform focus-visible:outline-2 focus-visible:outline-offset-4 disabled:cursor-not-allowed disabled:opacity-45 ${light ? 'bg-white text-black focus-visible:outline-white' : 'bg-black text-white focus-visible:outline-black'} ${disabled ? '' : 'hover:scale-[1.03] active:scale-[0.98]'} ${className}`;

    if (href) {
        return <a href={href} target="_blank" rel="noreferrer" className={classes}>{children}</a>;
    }

    return <button type="button" disabled={disabled} onClick={onClick} className={classes}>{children}</button>;
};

const MediaFallback = ({ label }) => (
    <div className="flex h-full w-full items-center justify-center bg-black/5 px-6 text-center">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-black/40">{label}</p>
    </div>
);

const SafeImage = ({ src, alt, className, loading = 'lazy', fallbackLabel = 'Media unavailable', decorative = false }) => {
    const [failed, setFailed] = React.useState(false);

    if (!src || failed) return <MediaFallback label={fallbackLabel} />;

    return (
        <img
            src={src}
            alt={decorative ? '' : alt}
            aria-hidden={decorative ? 'true' : undefined}
            loading={loading}
            decoding="async"
            onError={() => setFailed(true)}
            className={className}
        />
    );
};

const AnimalHighlightsSection = ({ animals, loading, navigate }) => {
    const highlights = animals.slice(0, 4);
    const lead = highlights[0];

    return (
        <section data-cinema-section className="relative min-h-[100svh] overflow-hidden bg-[#101712] text-white">
            <div className="mx-auto grid min-h-[100svh] w-full max-w-[1800px] lg:grid-cols-[1.05fr_0.95fr]">
                <div className="relative flex min-h-[62svh] flex-col justify-between px-5 py-16 sm:px-8 sm:py-20 lg:min-h-[100svh] lg:px-12 lg:py-24 xl:px-16">
                    <div className="relative z-10">
                        <p data-scene-kicker className="text-[10px] font-black uppercase tracking-[0.28em] text-green-300">03 Animal Highlights</p>
                        <h2 data-scene-title className="mt-5 max-w-5xl text-[clamp(3rem,8vw,8rem)] font-black leading-[0.88] tracking-[-0.06em]">
                            Wildlife, framed up close.
                        </h2>
                    </div>

                    <div className="relative z-10 mt-16 max-w-xl lg:mt-20">
                        {loading ? (
                            <p className="text-base leading-7 text-white/60">Loading current animal records.</p>
                        ) : lead ? (
                            <div>
                                <div className="flex flex-wrap items-end justify-between gap-5 border-b border-white/20 pb-5">
                                    <div>
                                        <p className="text-3xl font-black sm:text-5xl">{lead.name}</p>
                                        {lead.species && <p className="mt-2 text-sm italic text-green-200">{lead.species}</p>}
                                    </div>
                                    {lead.status && <span className="rounded-full border border-white/20 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em]">{lead.status}</span>}
                                </div>
                                {lead.description && <p className="mt-5 text-sm leading-7 text-white/65 sm:text-base">{clampText(lead.description, 230)}</p>}
                                <div className="mt-5 flex flex-wrap gap-x-8 gap-y-3 text-xs text-white/55">
                                    {lead.habitat && <span>Habitat: {lead.habitat}</span>}
                                    {lead.diet && <span>Diet: {lead.diet}</span>}
                                </div>
                            </div>
                        ) : (
                            <p className="text-base leading-7 text-white/60">Current animal highlights are unavailable. The full animal collection remains accessible from the Animals page.</p>
                        )}
                        <PrimaryAction onClick={() => navigate('/animals')} light className="mt-8">Explore all animals <Arrow /></PrimaryAction>
                    </div>
                </div>

                <div className="relative min-h-[65svh] overflow-hidden lg:min-h-[100svh]">
                    <div data-scene-frame className="absolute inset-0 overflow-hidden bg-[#263228] origin-center">
                        {lead?.imageUrl ? (
                            <div data-scene-media className="h-full w-full"><SafeImage src={lead.imageUrl} alt={lead.name} className="h-full w-full object-cover" fallbackLabel="Animal image unavailable" /></div>
                        ) : (
                            <MediaFallback label={loading ? 'Loading wildlife media' : 'No animal image available'} />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-black/15" />
                        <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-6 sm:bottom-8 sm:left-8 sm:right-8">
                            <p className="max-w-sm text-xs font-bold uppercase leading-5 tracking-[0.18em] text-white/75">Live content from the zoo animal collection</p>
                            <span className="text-5xl font-black text-green-300 sm:text-7xl">03</span>
                        </div>
                    </div>
                </div>
            </div>

            {highlights.length > 1 && (
                <div data-animal-strip className="relative z-10 mx-auto grid max-w-[1800px] gap-px bg-white/10 sm:grid-cols-3">
                    {highlights.slice(1).map((animal, index) => (
                        <button key={animal.id ?? `${animal.name}-${index}`} type="button" onClick={() => navigate(`/animals/${animal.id}`)} className="group grid min-h-48 grid-cols-[7rem_1fr] overflow-hidden bg-[#101712] text-left sm:min-h-56 sm:grid-cols-1 lg:grid-cols-[9rem_1fr]">
                            <div className="overflow-hidden bg-white/5 sm:h-32 lg:h-auto">
                                {animal.imageUrl ? <SafeImage src={animal.imageUrl} alt={animal.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" fallbackLabel="Animal image unavailable" /> : <MediaFallback label="No image" />}
                            </div>
                            <div className="flex flex-col justify-between p-5">
                                <div>
                                    <p className="text-lg font-black">{animal.name}</p>
                                    {animal.species && <p className="mt-1 text-xs italic text-green-200/80">{animal.species}</p>}
                                </div>
                                <span className="mt-5 text-xs font-black uppercase tracking-[0.2em] text-white/45">View species <Arrow /></span>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </section>
    );
};

const FloraHighlightsSection = ({ plants, loading, navigate }) => {
    const highlights = plants.slice(0, 5);
    const lead = highlights[0];

    return (
        <section data-cinema-section className="relative overflow-hidden bg-[#c6fe69] text-[#102016]">
            <div className="mx-auto max-w-[1800px] px-4 py-16 sm:px-8 sm:py-24 lg:py-32">
                <div className="grid items-start gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:gap-16">
                    <div className="lg:sticky lg:top-8">
                        <p data-scene-kicker className="text-[10px] font-black uppercase tracking-[0.28em] text-black/55">04 Plant and Flora Highlights</p>
                        <h2 data-scene-title className="mt-5 text-[clamp(3.25rem,7vw,7.5rem)] font-black leading-[0.9] tracking-[-0.06em]">A quieter kind of wild.</h2>
                        <p className="mt-6 max-w-md text-sm leading-7 text-black/65 sm:text-base">Botanical records come directly from the project’s current plant collection, including available scientific names, categories, and descriptions.</p>
                        <PrimaryAction onClick={() => navigate('/plants')} className="mt-8">Discover all plants <Arrow /></PrimaryAction>
                    </div>

                    <div className="relative min-h-[70svh]">
                        <div data-scene-frame className="relative min-h-[65svh] overflow-hidden rounded-[2rem] bg-[#17351f] text-white sm:min-h-[78svh]">
                            {lead?.imageUrl ? <div data-scene-media className="absolute inset-0"><SafeImage src={lead.imageUrl} alt={lead.name} className="h-full w-full object-cover" fallbackLabel="Plant image unavailable" /></div> : <MediaFallback label={loading ? 'Loading flora media' : 'No plant image available'} />}
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0c1b10]/95 via-[#0c1b10]/20 to-transparent" />
                            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-10 lg:p-12">
                                {lead ? (
                                    <>
                                        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-green-200">{lead.category}</p>
                                        <h3 className="mt-3 text-4xl font-black sm:text-6xl">{lead.name}</h3>
                                        {lead.scientificName && <p className="mt-2 text-sm italic text-green-100/85 sm:text-base">{lead.scientificName}</p>}
                                        {lead.description && <p className="mt-5 max-w-2xl text-sm leading-7 text-white/70">{clampText(lead.description, 220)}</p>}
                                    </>
                                ) : (
                                    <p className="max-w-xl text-sm leading-7 text-white/70">{loading ? 'Loading current plant records.' : 'Current flora highlights are unavailable.'}</p>
                                )}
                            </div>
                        </div>

                        {highlights.length > 1 && (
                            <div className="relative -mt-8 ml-auto grid w-[92%] gap-3 sm:grid-cols-2 lg:w-[86%]">
                                {highlights.slice(1).map((plant, index) => (
                                    <button key={plant.id ?? `${plant.name}-${index}`} type="button" onClick={() => navigate(`/plants/${plant.id}`)} className="group relative min-h-52 overflow-hidden rounded-[1.5rem] border border-black/10 bg-[#f4ffe0] text-left shadow-[0_20px_60px_rgba(16,32,22,0.12)]">
                                        {plant.imageUrl && <div className="absolute inset-0"><SafeImage src={plant.imageUrl} alt={plant.name} decorative className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" fallbackLabel="Plant image unavailable" /></div>}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                                        <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                                            <p className="text-xl font-black">{plant.name}</p>
                                            <p className="mt-1 text-xs text-white/70">{plant.scientificName || plant.category}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
};

const TicketPricingSection = ({ navigate }) => (
    <section data-cinema-section className="relative overflow-hidden bg-[#f4f1e8] text-[#171a17]">
        <div className="mx-auto max-w-[1800px] px-4 py-16 sm:px-8 sm:py-24 lg:py-32">
            <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
                <div>
                    <p data-scene-kicker className="text-[10px] font-black uppercase tracking-[0.28em] text-[#315b37]">05 Ticket Pricing</p>
                    <h2 data-scene-title className="mt-5 max-w-4xl text-[clamp(3.25rem,7vw,7rem)] font-black leading-[0.9] tracking-[-0.06em]">Your visit starts with one ticket.</h2>
                </div>
                <p className="max-w-lg text-sm leading-7 text-black/60 sm:text-base">These categories and prices match the current reservation flow. Booking remains handled by the existing Reservations page.</p>
            </div>

            <div data-scene-frame className="mt-12 overflow-hidden rounded-[2rem] border border-black/10 bg-white lg:mt-16">
                {TICKET_TYPES.map((ticket, index) => (
                    <div key={ticket.key} className="grid min-h-36 items-center gap-5 border-b border-dashed border-black/15 px-5 py-7 last:border-b-0 sm:grid-cols-[5rem_1fr_auto] sm:px-8 lg:min-h-40 lg:grid-cols-[8rem_1fr_auto] lg:px-12">
                        <span className="text-5xl font-black text-black/10 sm:text-6xl">0{index + 1}</span>
                        <div>
                            <h3 className="text-2xl font-black sm:text-3xl">{ticket.name}</h3>
                            <p className="mt-1 text-sm text-black/50">{ticket.detail}</p>
                        </div>
                        <p className="text-4xl font-black tracking-tight sm:text-5xl">{formatPrice(ticket.price)}</p>
                    </div>
                ))}
            </div>

            <div className="mt-8 flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
                <p className="max-w-xl text-sm leading-6 text-black/55">Availability, visit dates, arrival slots, reservation status, and payment actions remain controlled by the existing reservation system.</p>
                <PrimaryAction onClick={() => navigate('/reservations')}>Reserve a visit <Arrow /></PrimaryAction>
            </div>
        </div>
    </section>
);

const MapTeaserSection = ({ navigate }) => (
    <section data-cinema-section className="relative min-h-[100svh] overflow-hidden bg-[#071510] text-white">
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 70% 50%, rgba(198,254,105,0.14), transparent 34%), linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: 'auto, 64px 64px, 64px 64px' }} />
        <div className="relative mx-auto grid min-h-[100svh] max-w-[1800px] items-center gap-8 px-4 py-16 sm:px-8 lg:grid-cols-[0.78fr_1.22fr] lg:py-24">
            <div className="relative z-10">
                <p data-scene-kicker className="text-[10px] font-black uppercase tracking-[0.28em] text-green-300">06 Interactive Map Teaser</p>
                <h2 data-scene-title className="mt-5 max-w-3xl text-[clamp(3.25rem,7vw,7rem)] font-black leading-[0.9] tracking-[-0.06em]">Trace wildlife back to its origins.</h2>
                <p className="mt-6 max-w-lg text-sm leading-7 text-white/60 sm:text-base">Wildlife Origins uses the project’s existing Google Maps 3D implementation to explore animal habitats around the world. The full map remains on its dedicated route so the homepage stays lightweight.</p>
                <PrimaryAction onClick={() => navigate('/map')} light className="mt-8">Open Wildlife Origins <Arrow /></PrimaryAction>
            </div>

            <div data-map-globe className="relative mx-auto aspect-square w-full max-w-[46rem]">
                <div className="absolute inset-[7%] rounded-full border border-green-200/20" />
                <div className="absolute inset-[16%] rounded-full border border-green-200/15" />
                <div data-scene-frame className="absolute inset-[12%] overflow-hidden rounded-full border border-green-200/35 bg-[#133524] shadow-[0_0_100px_rgba(198,254,105,0.12)]" style={{ backgroundImage: 'radial-gradient(circle at 35% 30%, rgba(198,254,105,0.45), transparent 15%), radial-gradient(circle at 62% 58%, rgba(198,254,105,0.24), transparent 19%), linear-gradient(135deg, #193c2b, #071510 70%)' }}>
                    <div className="absolute inset-x-0 top-1/2 h-px bg-green-200/20" />
                    <div className="absolute inset-y-0 left-1/2 w-px bg-green-200/20" />
                    <div className="absolute left-[26%] top-[28%] h-3 w-3 rounded-full bg-green-300 shadow-[0_0_24px_rgba(198,254,105,0.8)]" />
                    <div className="absolute right-[25%] top-[42%] h-2.5 w-2.5 rounded-full bg-white/80" />
                    <div className="absolute bottom-[27%] left-[45%] h-2.5 w-2.5 rounded-full bg-green-200" />
                </div>
                <div className="absolute bottom-[5%] left-1/2 w-[80%] -translate-x-1/2 rounded-full border border-white/10 bg-black/35 px-5 py-4 text-center backdrop-blur-sm">
                    <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-green-200">Google Maps 3D</p>
                    <p className="mt-1 text-sm font-black">Wildlife Origins field guide</p>
                </div>
            </div>
        </div>
    </section>
);

const UpcomingEventsSection = ({ events, loading, navigate }) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const upcoming = events
        .filter((event) => {
            if (!event.date) return event.status !== 'past';
            const raw = String(event.date).split('T')[0];
            const date = new Date(`${raw}T00:00:00`);
            return !Number.isNaN(date.getTime()) && date >= today;
        })
        .sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0))
        .slice(0, 4);

    return (
        <section data-cinema-section className="relative overflow-hidden bg-[#f4d94f] text-[#151515]">
            <div className="mx-auto max-w-[1800px] px-4 py-16 sm:px-8 sm:py-24 lg:py-32">
                <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
                    <div>
                        <p data-scene-kicker className="text-[10px] font-black uppercase tracking-[0.28em] text-black/55">07 Upcoming Events</p>
                        <h2 data-scene-title className="mt-5 max-w-5xl text-[clamp(3.25rem,7vw,7rem)] font-black leading-[0.9] tracking-[-0.06em]">What is happening next.</h2>
                    </div>
                    <PrimaryAction onClick={() => navigate('/events')}>View event calendar <Arrow /></PrimaryAction>
                </div>

                <div data-event-reel className="mt-12 grid gap-4 lg:mt-16 lg:grid-cols-12">
                    {loading && <div className="col-span-full min-h-64 rounded-[2rem] border border-black/10 bg-white/35 p-8"><p className="text-sm font-bold text-black/55">Loading current event data.</p></div>}
                    {!loading && upcoming.length === 0 && <div className="col-span-full min-h-64 rounded-[2rem] border border-black/10 bg-white/35 p-8 sm:p-12"><p className="text-3xl font-black sm:text-5xl">No upcoming events are currently published.</p><p className="mt-4 max-w-xl text-sm leading-7 text-black/60">The homepage will display events here automatically when the existing events API returns upcoming records.</p></div>}
                    {upcoming.map((event, index) => (
                        <article key={event.id ?? `${event.title}-${index}`} data-scene-frame className={`${index === 0 ? 'lg:col-span-7 lg:row-span-2' : 'lg:col-span-5'} group relative min-h-[25rem] overflow-hidden rounded-[2rem] bg-black text-white ${index > 1 ? 'lg:min-h-[20rem]' : ''}`}>
                            <div className="absolute inset-0"><SafeImage src={event.imageUrl || '/images/event-img-placeholder.jpg'} alt={event.title} decorative={!event.imageUrl} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" fallbackLabel="Event image unavailable" /></div>
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-black/10" />
                            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
                                <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/70">
                                    {event.date && <span>{formatDate(event.date)}</span>}
                                    {event.startTime && <span>{formatTime(event.startTime)}{event.endTime ? ` to ${formatTime(event.endTime)}` : ''}</span>}
                                    {event.status && <span>{event.status}</span>}
                                    {event.availability !== null && <span>{event.availability} available</span>}
                                </div>
                                <h3 className="mt-3 text-3xl font-black sm:text-5xl">{event.title}</h3>
                                {event.location && <p className="mt-2 text-xs font-bold uppercase tracking-[0.16em] text-green-200">{event.location}</p>}
                                {event.description && <p className="mt-4 max-w-xl text-sm leading-6 text-white/70">{clampText(event.description, index === 0 ? 180 : 110)}</p>}
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
};

const ZootopiaSection = () => (
    <section data-cinema-section className="relative min-h-[100svh] overflow-hidden bg-[#101910] text-white">
        <div data-zootopia-frame className="absolute inset-0 overflow-hidden">
            <img data-scene-media src="/bulusan-og.png" alt="Bulusan Zoo" loading="lazy" decoding="async" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-[#0d180e]/75" />
            <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(115deg, rgba(198,254,105,0.18), transparent 38%), radial-gradient(circle at 78% 22%, rgba(244,217,79,0.2), transparent 24%)' }} />
        </div>
        <div className="relative mx-auto flex min-h-[100svh] max-w-[1800px] flex-col justify-between px-4 py-16 sm:px-8 sm:py-24 lg:px-12">
            <div className="flex items-center justify-between gap-4">
                <p data-scene-kicker className="text-[10px] font-black uppercase tracking-[0.28em] text-green-300">08 Bulusan Zootopia</p>
                <span className="rounded-full border border-white/20 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em]">External game experience</span>
            </div>
            <div className="max-w-6xl py-20">
                <h2 data-scene-title className="text-[clamp(4rem,12vw,12rem)] font-black leading-[0.78] tracking-[-0.075em]">Enter the wild.</h2>
                <div className="mt-8 grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
                    <p className="max-w-2xl text-base leading-7 text-white/65 sm:text-lg">Bulusan Zootopia extends the zoo into a separate interactive game experience. It opens in a new tab, preserving the current homepage route and existing game destination.</p>
                    <PrimaryAction href="https://bulusanzootopia.vercel.app" light>Enter Zootopia <Arrow /></PrimaryAction>
                </div>
            </div>
            <div className="grid grid-cols-3 gap-px overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/10 text-center">
                {['Play', 'Explore', 'Learn'].map((word) => <div key={word} className="bg-black/40 px-3 py-6 text-sm font-black uppercase tracking-[0.18em] backdrop-blur-sm sm:py-8">{word}</div>)}
            </div>
        </div>
    </section>
);

const ScannerTeaserSection = ({ navigate }) => (
    <section data-cinema-section className="relative overflow-hidden bg-[#eef4ea] text-[#111b14]">
        <div className="mx-auto grid min-h-[100svh] max-w-[1800px] items-center gap-12 px-4 py-16 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:py-24">
            <div className="order-2 lg:order-1">
                <div data-scanner-device data-scene-frame className="relative mx-auto aspect-[4/5] w-full max-w-xl overflow-hidden rounded-[2.5rem] border-[10px] border-black bg-[#132118] shadow-[0_35px_100px_rgba(17,27,20,0.22)] sm:border-[14px]">
                    <div className="absolute inset-0 flex items-center justify-center bg-[#c6fe69]">
                        <img src="/animal-scan.svg" alt="AI Animal Scanner" className="h-[38%] w-[38%] object-contain" loading="lazy" decoding="async" />
                    </div>
                    <div className="absolute inset-[8%] rounded-[1.75rem] border border-black/30" />
                    <div data-scanner-line className="absolute left-[8%] right-[8%] top-[18%] h-0.5 bg-black shadow-[0_0_18px_rgba(0,0,0,0.35)]" />
                    <div className="absolute inset-x-[8%] bottom-[8%] rounded-2xl bg-black px-5 py-4 text-white">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-green-300">Local model</p>
                        <p className="mt-1 text-sm font-black">11 trained classes</p>
                    </div>
                </div>
            </div>
            <div className="order-1 lg:order-2">
                <p data-scene-kicker className="text-[10px] font-black uppercase tracking-[0.28em] text-[#315b37]">09 AI Animal Scanner Teaser</p>
                <h2 data-scene-title className="mt-5 max-w-4xl text-[clamp(3.25rem,7vw,7.5rem)] font-black leading-[0.9] tracking-[-0.06em]">Point. Scan. Identify.</h2>
                <p className="mt-6 max-w-xl text-sm leading-7 text-black/60 sm:text-base">The current scanner uses the project’s local model and does not claim recognition beyond its trained classes.</p>
                <div className="mt-7 flex flex-wrap gap-2">
                    {SCANNER_CLASSES.map((item) => <span key={item} className="rounded-full border border-black/15 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em]">{item}</span>)}
                </div>
                <PrimaryAction onClick={() => navigate('/animaldex')} className="mt-8">Open Animal Scanner <Arrow /></PrimaryAction>
            </div>
        </div>
    </section>
);

const JijiTeaserSection = ({ openAssistant }) => (
    <section data-cinema-section className="relative overflow-hidden bg-[#212631] text-white">
        <div className="mx-auto grid min-h-[100svh] max-w-[1800px] items-center gap-12 px-4 py-16 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:py-24">
            <div>
                <p data-scene-kicker className="text-[10px] font-black uppercase tracking-[0.28em] text-[#c6fe69]">10 Jiji AI Chat Assistant Teaser</p>
                <h2 data-scene-title className="mt-5 max-w-4xl text-[clamp(3.25rem,7vw,7.5rem)] font-black leading-[0.9] tracking-[-0.06em]">Ask Jiji without leaving the page.</h2>
                <p className="mt-6 max-w-xl text-sm leading-7 text-white/60 sm:text-base">The teaser opens the same Jiji assistant already mounted on the homepage, preserving its current API behavior, conversation interface, and supported visitor guidance.</p>
                <PrimaryAction onClick={openAssistant} light className="mt-8">Open Jiji <Arrow /></PrimaryAction>
            </div>

            <div data-chat-stage className="relative mx-auto w-full max-w-3xl rounded-[2.5rem] bg-white p-4 text-[#212631] shadow-[0_40px_120px_rgba(0,0,0,0.3)] sm:p-6 lg:p-8">
                <div className="flex items-center gap-4 border-b border-black/10 pb-5">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#c6fe69]"><img src="/zusan-ai.svg" alt="Jiji AI assistant" className="h-12 w-12 object-contain" /></div>
                    <div><p className="font-black">Jiji AI Assistant</p><p className="text-xs text-black/45">Bulusan Zoo visitor assistant</p></div>
                </div>
                <div className="mt-8 space-y-5">
                    <div data-chat-bubble className="max-w-[88%] rounded-[1.5rem] bg-[#eef4ea] px-5 py-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-black/40">Ask Jiji about</p>
                        <p className="mt-2 text-sm font-bold leading-6">Animals, zoo information, tickets, events, navigation, and supported visitor guidance.</p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                        {['What animals can I explore?', 'How do I reserve a visit?', 'What events are available?', 'Help me navigate the zoo experience'].map((prompt) => <div key={prompt} data-chat-bubble className="rounded-2xl border border-black/10 px-4 py-4 text-sm font-semibold">{prompt}</div>)}
                    </div>
                </div>
            </div>
        </div>
    </section>
);

const CommunityPreviewSection = ({ posts, loading, isAuthenticated, navigate }) => {
    const visiblePosts = posts.slice(0, 3);

    return (
        <section data-cinema-section className="relative overflow-hidden bg-[#f6f7f4] text-[#212631]">
            <div className="mx-auto max-w-[1800px] px-4 py-16 sm:px-8 sm:py-24 lg:py-32">
                <div className="grid gap-10 lg:grid-cols-[0.65fr_1.35fr]">
                    <div className="lg:sticky lg:top-10 lg:self-start">
                        <p data-scene-kicker className="text-[10px] font-black uppercase tracking-[0.28em] text-[#5c7d16]">11 Community Feed Preview</p>
                        <h2 data-scene-title className="mt-5 text-[clamp(3.25rem,7vw,7rem)] font-black leading-[0.9] tracking-[-0.06em]">The zoo, seen by its community.</h2>
                        <p className="mt-6 max-w-md text-sm leading-7 text-black/55">Community content is loaded from the existing community service only when the current user is authenticated.</p>
                        <PrimaryAction onClick={() => navigate('/community')} className="mt-8">Open Community <Arrow /></PrimaryAction>
                    </div>

                    <div className="space-y-4">
                        {loading && isAuthenticated && <div className="min-h-56 rounded-[2rem] border border-black/10 bg-white p-8"><p className="text-sm font-bold text-black/45">Loading community posts.</p></div>}
                        {!isAuthenticated && <div data-scene-frame className="min-h-[28rem] rounded-[2rem] bg-[#c6fe69] p-7 sm:p-10 lg:p-12"><p className="text-[10px] font-black uppercase tracking-[0.2em] text-black/50">Sign-in protected</p><h3 className="mt-5 max-w-xl text-4xl font-black leading-tight sm:text-6xl">Community posts stay behind the existing account access rules.</h3><p className="mt-5 max-w-xl text-sm leading-7 text-black/60">Open Community to sign in and view current posts, media, comments, and activity without exposing protected data on the public homepage.</p></div>}
                        {isAuthenticated && !loading && visiblePosts.length === 0 && <div className="min-h-64 rounded-[2rem] border border-black/10 bg-white p-8 sm:p-10"><h3 className="text-3xl font-black">No community posts are currently available.</h3></div>}
                        {visiblePosts.map((post, index) => {
                            const author = post.author ? `${post.author.firstName || ''} ${post.author.lastName || ''}`.trim() : '';
                            return (
                                <article key={post.id ?? index} data-scene-frame className={`grid overflow-hidden rounded-[2rem] border border-black/10 bg-white ${post.imageUrl ? 'md:grid-cols-[0.9fr_1.1fr]' : ''}`}>
                                    {post.imageUrl && <div className="min-h-64 overflow-hidden bg-black/5"><SafeImage src={post.imageUrl} alt="Community post" className="h-full w-full object-cover" fallbackLabel="Community image unavailable" /></div>}
                                    <div className="flex min-h-64 flex-col justify-between p-6 sm:p-8">
                                        <div>
                                            <div className="flex flex-wrap items-center justify-between gap-3 text-[10px] font-bold uppercase tracking-[0.17em] text-black/40">
                                                <span>{author || 'Community post'}</span>
                                                {post.createdAt && <span>{formatDate(post.createdAt)}</span>}
                                            </div>
                                            {post.content && <p className="mt-6 text-2xl font-semibold leading-snug sm:text-3xl">{clampText(post.content, 240)}</p>}
                                        </div>
                                        <p className="mt-8 text-xs font-black uppercase tracking-[0.18em] text-[#5c7d16]">View discussion <Arrow /></p>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
};

const DonationSection = ({ config, loading, navigate }) => {
    const enabled = Boolean(config?.enabled);

    return (
        <section data-cinema-section className="relative overflow-hidden bg-[#15351f] text-white">
            <div data-donation-wipe className="absolute inset-y-0 right-0 w-1/2 bg-[#c6fe69]" />
            <div className="relative mx-auto grid min-h-[82svh] max-w-[1800px] items-center gap-10 px-4 py-16 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
                <div className="relative z-10 max-w-5xl">
                    <p data-scene-kicker className="text-[10px] font-black uppercase tracking-[0.28em] text-green-200">12 Donation CTA</p>
                    <h2 data-scene-title className="mt-5 text-[clamp(3.5rem,8vw,8rem)] font-black leading-[0.86] tracking-[-0.065em]">Support wildlife on your terms.</h2>
                    <p className="mt-6 max-w-2xl text-sm leading-7 text-white/65 sm:text-base">The existing donation flow uses the administrator-controlled donation configuration and GCash details. The donor chooses the amount in GCash.</p>
                    <div className="mt-8 flex flex-wrap items-center gap-4">
                        <PrimaryAction onClick={() => enabled && navigate('/donation')} light disabled={loading || !enabled}>{loading ? 'Checking donation status' : enabled ? 'Open Donation' : 'Donations unavailable'} {enabled && <Arrow />}</PrimaryAction>
                        {!loading && <span className="text-xs font-bold uppercase tracking-[0.18em] text-white/45">{enabled ? 'Currently enabled by the zoo' : 'Currently disabled by the zoo'}</span>}
                    </div>
                </div>
                <div data-scene-frame className="relative z-10 ml-auto aspect-square w-full max-w-xl overflow-hidden rounded-full border border-white/20 bg-black/20 p-[12%] shadow-[0_30px_100px_rgba(0,0,0,0.25)]">
                    <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-[#c6fe69] px-8 text-center text-black">
                        <p className="text-[10px] font-black uppercase tracking-[0.22em]">Donation channel</p>
                        <p className="mt-3 text-5xl font-black sm:text-7xl">GCash</p>
                        <p className="mt-3 text-xs font-semibold text-black/60">Recipient details remain on the protected Donation page.</p>
                    </div>
                </div>
            </div>
        </section>
    );
};

const BookingProcessSection = ({ navigate }) => {
    const steps = [
        ['01', 'Choose', 'Select a ticket visit or an event reservation.'],
        ['02', 'Schedule', 'Pick an available date and the required arrival or event time.'],
        ['03', 'Submit', 'Complete the required visitor or participant details and submit the reservation.'],
        ['04', 'Keep', 'Save the reservation reference and QR confirmation, then use reservation history for status and available payment actions.']
    ];

    return (
        <section data-cinema-section className="relative overflow-hidden bg-[#ece9df] text-[#171a17]">
            <div className="mx-auto max-w-[1800px] px-4 py-16 sm:px-8 sm:py-24 lg:py-32">
                <div className="max-w-5xl">
                    <p data-scene-kicker className="text-[10px] font-black uppercase tracking-[0.28em] text-[#315b37]">13 Booking and Reservation</p>
                    <h2 data-scene-title className="mt-5 text-[clamp(3.25rem,7vw,7rem)] font-black leading-[0.9] tracking-[-0.06em]">From plan to confirmation.</h2>
                </div>
                <div className="mt-12 border-y border-black/15 lg:mt-16">
                    {steps.map(([number, title, text]) => (
                        <div key={number} data-booking-step className="grid gap-5 border-b border-black/15 py-7 last:border-b-0 sm:grid-cols-[6rem_0.6fr_1.4fr] sm:items-center lg:py-10">
                            <span className="text-5xl font-black text-black/15 sm:text-6xl">{number}</span>
                            <h3 className="text-3xl font-black sm:text-4xl">{title}</h3>
                            <p className="max-w-xl text-sm leading-7 text-black/55 sm:text-base">{text}</p>
                        </div>
                    ))}
                </div>
                <PrimaryAction onClick={() => navigate('/reservations')} className="mt-8">Start a reservation <Arrow /></PrimaryAction>
            </div>
        </section>
    );
};

const FAQSection = () => {
    const [openIndex, setOpenIndex] = React.useState(0);

    return (
        <section data-cinema-section className="relative overflow-hidden bg-white text-black">
            <div className="mx-auto grid max-w-[1800px] gap-12 px-4 py-16 sm:px-8 sm:py-24 lg:grid-cols-[0.7fr_1.3fr] lg:py-32">
                <div>
                    <p data-scene-kicker className="text-[10px] font-black uppercase tracking-[0.28em] text-[#315b37]">14 FAQ</p>
                    <h2 data-scene-title className="mt-5 text-[clamp(3.25rem,7vw,7rem)] font-black leading-[0.9] tracking-[-0.06em]">Before you ask, start here.</h2>
                </div>
                <div className="border-t border-black/15">
                    {FAQ_ITEMS.map((item, index) => {
                        const isOpen = openIndex === index;
                        const panelId = `home-faq-panel-${index}`;
                        const buttonId = `home-faq-button-${index}`;
                        return (
                            <div key={item.question} className="border-b border-black/15">
                                <button id={buttonId} type="button" aria-expanded={isOpen} aria-controls={panelId} onClick={() => setOpenIndex(isOpen ? -1 : index)} className="flex w-full items-center justify-between gap-6 py-6 text-left text-lg font-black focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black sm:py-8 sm:text-2xl">
                                    <span>{item.question}</span>
                                    <span aria-hidden="true" className={`shrink-0 text-3xl font-normal transition-transform ${isOpen ? 'rotate-45' : ''}`}>+</span>
                                </button>
                                <div id={panelId} role="region" aria-labelledby={buttonId} hidden={!isOpen} className="pb-7 pr-10 sm:pb-9">
                                    <p className="max-w-2xl text-sm leading-7 text-black/60 sm:text-base">{item.answer}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

const ContactSupportSection = ({ navigate }) => (
    <section data-cinema-section className="relative overflow-hidden bg-[#c6fe69] text-black">
        <div className="mx-auto grid min-h-[76svh] max-w-[1800px] items-center gap-10 px-4 py-16 sm:px-8 lg:grid-cols-[1fr_1fr] lg:py-24">
            <div>
                <p data-scene-kicker className="text-[10px] font-black uppercase tracking-[0.28em] text-black/55">15 Contact and Support</p>
                <h2 data-scene-title className="mt-5 text-[clamp(3.5rem,8vw,8rem)] font-black leading-[0.86] tracking-[-0.065em]">Need a human route through the system?</h2>
            </div>
            <div data-scene-frame className="rounded-[2rem] bg-black p-6 text-white sm:p-10 lg:p-12">
                <p className="max-w-xl text-base leading-7 text-white/65">Direct public phone and email details are not currently published in the website’s user-facing data. Use the existing Help Center, or sign in and open My Messages for support cases and replies.</p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    <PrimaryAction onClick={() => navigate('/help')} light>Open Help Center <Arrow /></PrimaryAction>
                    <PrimaryAction onClick={() => navigate('/my-messages')} className="border border-white/20">My Messages <Arrow /></PrimaryAction>
                </div>
            </div>
        </div>
    </section>
);

const VisitorInfoSection = () => (
    <section data-cinema-section className="relative overflow-hidden bg-[#f3f0e8] text-[#191919]">
        <div className="mx-auto max-w-[1800px] px-4 py-16 sm:px-8 sm:py-24 lg:py-32">
            <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr]">
                <div>
                    <p data-scene-kicker className="text-[10px] font-black uppercase tracking-[0.28em] text-[#315b37]">16 Visitor Info</p>
                    <h2 data-scene-title className="mt-5 text-[clamp(3.25rem,7vw,7rem)] font-black leading-[0.9] tracking-[-0.06em]">Know the day before you arrive.</h2>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                    <article data-scene-frame className="rounded-[2rem] bg-[#315b37] p-6 text-white sm:p-8">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-green-200">Hours</p>
                        <p className="mt-6 text-3xl font-black">Tuesday to Sunday</p>
                        <p className="mt-2 text-xl font-bold text-white/75">8:00 AM to 5:00 PM</p>
                        <div className="mt-8 border-t border-white/15 pt-5 text-sm leading-7 text-white/60"><p>Monday: Closed</p><p>Last entry: 4:00 PM</p><p>Holiday schedules may vary</p></div>
                    </article>
                    <article data-scene-frame className="rounded-[2rem] bg-white p-6 sm:p-8">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-black/40">Address</p>
                        <p className="mt-6 text-3xl font-black">Bulusan Wildlife Park</p>
                        <p className="mt-3 text-base leading-7 text-black/55">Calapan City, Oriental Mindoro<br />MIMAROPA Region, Philippines</p>
                    </article>
                    <article data-scene-frame className="rounded-[2rem] bg-[#f4d94f] p-6 sm:col-span-2 sm:p-8">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-black/45">Visit rules and booking reminders</p>
                        <div className="mt-6 grid gap-px overflow-hidden rounded-2xl border border-black/10 bg-black/10 sm:grid-cols-2">
                            {VISITOR_RULES.map((rule, index) => <div key={rule} className="flex gap-4 bg-[#f4d94f] p-5"><span className="text-sm font-black">0{index + 1}</span><p className="text-sm font-semibold leading-6">{rule}</p></div>)}
                        </div>
                    </article>
                </div>
            </div>
        </div>
    </section>
);

const ReviewsSection = () => (
    <section data-cinema-section className="relative overflow-hidden bg-[#111] text-white">
        <div className="mx-auto flex min-h-[72svh] max-w-[1800px] flex-col justify-between px-4 py-16 sm:px-8 sm:py-24 lg:py-32">
            <div className="flex flex-wrap items-start justify-between gap-8">
                <p data-scene-kicker className="text-[10px] font-black uppercase tracking-[0.28em] text-green-300">17 Testimonials and Reviews</p>
                <span className="rounded-full border border-white/15 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/45">Verified source required</span>
            </div>
            <div data-scene-frame className="my-16 max-w-6xl">
                <h2 data-scene-title className="text-[clamp(3.5rem,8vw,8rem)] font-black leading-[0.88] tracking-[-0.065em]">No invented praise.</h2>
                <p className="mt-7 max-w-2xl text-base leading-7 text-white/55">The current project does not expose a verified public review or testimonial source. This section intentionally stays source-aware instead of creating visitor names, ratings, statistics, or quotes that do not exist.</p>
            </div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/30">Ready for real review data when a verified source is connected</p>
        </div>
    </section>
);

const GallerySection = ({ animals, plants, events, posts }) => {
    const dynamicImages = [
        ...animals.filter((item) => item.imageUrl).map((item) => ({ src: item.imageUrl, alt: item.name, label: 'Animal' })),
        ...plants.filter((item) => item.imageUrl).map((item) => ({ src: item.imageUrl, alt: item.name, label: 'Flora' })),
        ...events.filter((item) => item.imageUrl).map((item) => ({ src: item.imageUrl, alt: item.title, label: 'Event' })),
        ...posts.filter((item) => item.imageUrl).map((item) => ({ src: item.imageUrl, alt: 'Community post', label: 'Community' }))
    ];
    const unique = [];
    const seen = new Set();
    dynamicImages.forEach((image) => {
        if (!seen.has(image.src)) {
            seen.add(image.src);
            unique.push(image);
        }
    });
    const gallery = unique.slice(0, 8);
    const fallback = [
        { src: '/bulusan-og.png', alt: 'Bulusan Zoo', label: 'Bulusan Zoo' },
        { src: '/deer.png', alt: 'Bulusan Zoo deer artwork', label: 'Project asset' }
    ];
    const visible = gallery.length ? gallery : fallback;

    return (
        <section data-cinema-section className="relative overflow-hidden bg-white text-black">
            <div className="mx-auto max-w-[1800px] px-4 py-16 sm:px-8 sm:py-24 lg:py-32">
                <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
                    <div>
                        <p data-scene-kicker className="text-[10px] font-black uppercase tracking-[0.28em] text-[#315b37]">18 Photo Gallery</p>
                        <h2 data-scene-title className="mt-5 max-w-5xl text-[clamp(3.25rem,7vw,7rem)] font-black leading-[0.9] tracking-[-0.06em]">Frames from the living collection.</h2>
                    </div>
                    <p className="max-w-md text-sm leading-7 text-black/55">Gallery media is assembled from currently available animal, plant, event, community, and existing project assets. Noncritical images are lazy-loaded.</p>
                </div>

                <div data-gallery-grid className="mt-12 grid auto-rows-[12rem] grid-cols-2 gap-2 sm:auto-rows-[16rem] md:grid-cols-4 lg:mt-16 lg:auto-rows-[18rem]">
                    {visible.map((image, index) => (
                        <figure key={`${image.src}-${index}`} data-gallery-item className={`group relative overflow-hidden rounded-[1.5rem] bg-black/5 ${index % 5 === 0 ? 'col-span-2 row-span-2' : ''} ${index % 5 === 3 ? 'md:col-span-2' : ''}`}>
                            <SafeImage src={image.src} alt={image.alt} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" fallbackLabel="Gallery image unavailable" />
                            <figcaption className="absolute bottom-3 left-3 rounded-full bg-black/65 px-3 py-2 text-[9px] font-black uppercase tracking-[0.16em] text-white backdrop-blur-sm">{image.label}</figcaption>
                        </figure>
                    ))}
                </div>
            </div>
        </section>
    );
};

const StaffSpotlightSection = () => (
    <section data-cinema-section className="relative overflow-hidden bg-[#315b37] text-white">
        <div className="mx-auto grid min-h-[70svh] max-w-[1800px] items-center gap-10 px-4 py-16 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:py-24">
            <div>
                <p data-scene-kicker className="text-[10px] font-black uppercase tracking-[0.28em] text-green-200">19 Staff and Keeper Spotlight</p>
                <h2 data-scene-title className="mt-5 text-[clamp(3.25rem,7vw,7rem)] font-black leading-[0.9] tracking-[-0.06em]">People deserve accurate credits too.</h2>
            </div>
            <div data-scene-frame className="rounded-[2rem] border border-white/15 bg-white/5 p-7 sm:p-10 lg:p-12">
                <p className="text-3xl font-black sm:text-5xl">Public keeper profiles are not currently available in the project data.</p>
                <p className="mt-5 max-w-2xl text-sm leading-7 text-white/60 sm:text-base">No employee names, roles, biographies, or personal photographs are fabricated here. The section is ready to display real profiles only when a verified public source is added to the system.</p>
            </div>
        </div>
    </section>
);

const NewsletterSection = () => {
    const [email, setEmail] = React.useState('');
    const [notice, setNotice] = React.useState('');

    const handleSubmit = (event) => {
        event.preventDefault();
        setNotice('Newsletter subscription is not connected to a backend yet. No subscription request was sent.');
    };

    return (
        <section data-cinema-section className="relative overflow-hidden bg-[#c6fe69] text-black">
            <div className="mx-auto flex min-h-[82svh] max-w-[1800px] flex-col justify-between px-4 py-16 sm:px-8 sm:py-24 lg:py-32">
                <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
                    <div>
                        <p data-scene-kicker className="text-[10px] font-black uppercase tracking-[0.28em] text-black/55">20 Newsletter Signup</p>
                        <h2 data-scene-title className="mt-5 max-w-6xl text-[clamp(3.5rem,9vw,9rem)] font-black leading-[0.84] tracking-[-0.07em]">Stay close to the wild.</h2>
                    </div>
                    <p className="max-w-md text-sm leading-7 text-black/60">No newsletter API or subscription service currently exists in the project, so this interface does not simulate a successful subscription.</p>
                </div>

                <form onSubmit={handleSubmit} className="mt-14 border-y border-black/20 py-6 sm:py-8">
                    <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
                        <label htmlFor="home-newsletter-email" className="sr-only">Email address</label>
                        <input id="home-newsletter-email" type="email" required value={email} onChange={(event) => { setEmail(event.target.value); setNotice(''); }} placeholder="Email address" autoComplete="email" className="min-h-16 w-full bg-transparent px-1 text-2xl font-black outline-none placeholder:text-black/30 focus-visible:ring-2 focus-visible:ring-black sm:text-4xl" />
                        <button type="submit" className="min-h-14 rounded-full bg-black px-7 py-4 text-sm font-black text-white transition-transform hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black">Check signup</button>
                    </div>
                    {notice && <p role="status" className="mt-4 max-w-2xl text-sm font-semibold leading-6 text-black/60">{notice}</p>}
                </form>

                <div className="mt-10 flex items-end justify-between gap-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-black/45">Bulusan Zoo homepage</p>
                    <span className="text-6xl font-black sm:text-8xl">20</span>
                </div>
            </div>
        </section>
    );
};

const CinematicSections = () => {
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();
    const rootRef = useRef(null);
    const [animals, setAnimals] = React.useState([]);
    const [plants, setPlants] = React.useState([]);
    const [events, setEvents] = React.useState([]);
    const [posts, setPosts] = React.useState([]);
    const [donationConfig, setDonationConfig] = React.useState(null);
    const [loading, setLoading] = React.useState({ animals: true, plants: true, events: true, community: false, donation: true });

    React.useEffect(() => {
        let active = true;

        const load = async () => {
            const [animalResult, plantResult, eventResult, donationResult] = await Promise.allSettled([
                userAPI.getAnimals(),
                userAPI.getPlants(),
                userAPI.getEvents(true),
                userAPI.getDonationConfig()
            ]);

            if (!active) return;

            if (animalResult.status === 'fulfilled' && animalResult.value?.success && Array.isArray(animalResult.value.animals)) {
                const seen = new Set();
                setAnimals(animalResult.value.animals.map(normalizeAnimal).filter((item) => {
                    if (seen.has(item.id)) return false;
                    seen.add(item.id);
                    return true;
                }));
            }

            if (plantResult.status === 'fulfilled' && plantResult.value?.success && Array.isArray(plantResult.value.plants)) {
                const seen = new Set();
                setPlants(plantResult.value.plants.map(normalizePlant).filter((item) => {
                    if (seen.has(item.id)) return false;
                    seen.add(item.id);
                    return true;
                }));
            }

            if (eventResult.status === 'fulfilled' && eventResult.value?.success && Array.isArray(eventResult.value.events)) {
                setEvents(eventResult.value.events.map(normalizeEvent));
            }

            if (donationResult.status === 'fulfilled' && donationResult.value?.success) {
                setDonationConfig(donationResult.value.config || null);
            }

            setLoading((current) => ({ ...current, animals: false, plants: false, events: false, donation: false }));
        };

        load();
        return () => { active = false; };
    }, []);

    React.useEffect(() => {
        let active = true;
        if (!isAuthenticated || !user) {
            setPosts([]);
            setLoading((current) => ({ ...current, community: false }));
            return () => { active = false; };
        }

        setLoading((current) => ({ ...current, community: true }));
        communityAPI.getPosts(user.role || 'user')
            .then((response) => {
                if (active) setPosts(Array.isArray(response?.posts) ? response.posts : []);
            })
            .catch(() => {
                if (active) setPosts([]);
            })
            .finally(() => {
                if (active) setLoading((current) => ({ ...current, community: false }));
            });

        return () => { active = false; };
    }, [isAuthenticated, user]);

    useLayoutEffect(() => {
        const mm = gsap.matchMedia();
        const ctx = gsap.context(() => {
            mm.add('(min-width: 900px) and (prefers-reduced-motion: no-preference)', () => {
                gsap.utils.toArray('[data-cinema-section]').forEach((section) => {
                    const frame = section.querySelector('[data-scene-frame]');
                    const title = section.querySelector('[data-scene-title]');
                    const kicker = section.querySelector('[data-scene-kicker]');
                    const media = section.querySelector('[data-scene-media]');

                    if (frame) {
                        gsap.fromTo(frame,
                            { clipPath: 'inset(8% 6% 8% 6% round 2.5rem)', scale: 0.96 },
                            { clipPath: 'inset(0% 0% 0% 0% round 0rem)', scale: 1, ease: 'none', scrollTrigger: { trigger: section, start: 'top 82%', end: 'top 28%', scrub: 0.8 } }
                        );
                    }

                    if (title) {
                        gsap.fromTo(title,
                            { xPercent: -7, skewX: -2 },
                            { xPercent: 0, skewX: 0, ease: 'none', scrollTrigger: { trigger: section, start: 'top 88%', end: 'top 35%', scrub: 0.7 } }
                        );
                    }

                    if (kicker) {
                        gsap.fromTo(kicker,
                            { xPercent: 18 },
                            { xPercent: 0, ease: 'none', scrollTrigger: { trigger: section, start: 'top 92%', end: 'top 55%', scrub: 0.6 } }
                        );
                    }

                    if (media) {
                        gsap.fromTo(media,
                            { scale: 1.14, yPercent: 5 },
                            { scale: 1, yPercent: -4, ease: 'none', scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: 0.8 } }
                        );
                    }
                });

                const animalStrip = rootRef.current?.querySelector('[data-animal-strip]');
                const mapGlobe = rootRef.current?.querySelector('[data-map-globe]');
                const zootopiaFrame = rootRef.current?.querySelector('[data-zootopia-frame]');
                const chatStage = rootRef.current?.querySelector('[data-chat-stage]');
                const chatBubbles = rootRef.current?.querySelectorAll('[data-chat-bubble]');
                const donationWipe = rootRef.current?.querySelector('[data-donation-wipe]');
                const bookingSteps = rootRef.current?.querySelectorAll('[data-booking-step]');

                if (animalStrip) gsap.fromTo(animalStrip, { xPercent: 8 }, { xPercent: -3, ease: 'none', scrollTrigger: { trigger: animalStrip, start: 'top bottom', end: 'bottom top', scrub: 0.8 } });
                if (mapGlobe) gsap.fromTo(mapGlobe, { rotate: 7, scale: 0.9 }, { rotate: -5, scale: 1.03, ease: 'none', scrollTrigger: { trigger: mapGlobe, start: 'top 85%', end: 'bottom 20%', scrub: 1 } });
                if (zootopiaFrame) gsap.fromTo(zootopiaFrame, { scale: 1.16, clipPath: 'inset(10% 6% round 3rem)' }, { scale: 1, clipPath: 'inset(0% 0% round 0rem)', ease: 'none', scrollTrigger: { trigger: zootopiaFrame, start: 'top 90%', end: 'bottom 40%', scrub: 0.9 } });
                if (chatStage && chatBubbles?.length) gsap.fromTo(chatBubbles, { xPercent: (index) => index % 2 ? -14 : 14, clipPath: 'inset(0 35% 0 0 round 1.5rem)' }, { xPercent: 0, clipPath: 'inset(0 0% 0 0 round 1.5rem)', stagger: 0.08, ease: 'power3.out', scrollTrigger: { trigger: chatStage, start: 'top 72%', toggleActions: 'play none none reverse' } });
                if (donationWipe) gsap.fromTo(donationWipe, { xPercent: 100 }, { xPercent: 0, ease: 'none', scrollTrigger: { trigger: donationWipe, start: 'top bottom', end: 'top 25%', scrub: 0.8 } });
                if (bookingSteps?.length) gsap.fromTo(bookingSteps, { xPercent: (index) => index % 2 ? 8 : -8 }, { xPercent: 0, stagger: 0.05, ease: 'none', scrollTrigger: { trigger: bookingSteps[0], start: 'top 88%', end: 'bottom 55%', scrub: 0.6 } });
                gsap.utils.toArray('[data-gallery-item]').forEach((item, index) => {
                    gsap.fromTo(item, { yPercent: index % 2 ? 10 : -6, scale: 0.96 }, { yPercent: 0, scale: 1, ease: 'none', scrollTrigger: { trigger: item, start: 'top 92%', end: 'top 45%', scrub: 0.6 } });
                });

                const scannerLine = rootRef.current?.querySelector('[data-scanner-line]');
                const scannerDevice = rootRef.current?.querySelector('[data-scanner-device]');
                if (scannerLine && scannerDevice) {
                    const scannerTween = gsap.fromTo(scannerLine, { yPercent: 0 }, { y: () => Math.max(120, scannerDevice.clientHeight * 0.58), duration: 1.8, repeat: -1, yoyo: true, ease: 'sine.inOut', paused: true });
                    ScrollTrigger.create({
                        trigger: scannerDevice,
                        start: 'top 85%',
                        end: 'bottom 15%',
                        onEnter: () => scannerTween.play(),
                        onEnterBack: () => scannerTween.play(),
                        onLeave: () => scannerTween.pause(),
                        onLeaveBack: () => scannerTween.pause()
                    });
                }
            });

            mm.add('(max-width: 899px) and (prefers-reduced-motion: no-preference)', () => {
                gsap.utils.toArray('[data-cinema-section]').forEach((section) => {
                    const frame = section.querySelector('[data-scene-frame]');
                    const title = section.querySelector('[data-scene-title]');
                    if (frame) {
                        gsap.fromTo(frame, { clipPath: 'inset(3% 2% round 1.5rem)', scale: 0.985 }, { clipPath: 'inset(0% 0% round 0rem)', scale: 1, ease: 'none', scrollTrigger: { trigger: section, start: 'top 88%', end: 'top 48%', scrub: 0.5 } });
                    }
                    if (title) {
                        gsap.fromTo(title, { xPercent: -3 }, { xPercent: 0, ease: 'none', scrollTrigger: { trigger: section, start: 'top 92%', end: 'top 58%', scrub: 0.5 } });
                    }
                });
            });
        }, rootRef);

        const refreshFrame = requestAnimationFrame(() => ScrollTrigger.refresh());
        return () => {
            cancelAnimationFrame(refreshFrame);
            mm.revert();
            ctx.revert();
        };
    }, []);

    React.useEffect(() => {
        const refreshFrame = requestAnimationFrame(() => ScrollTrigger.refresh());
        return () => cancelAnimationFrame(refreshFrame);
    }, [animals.length, plants.length, events.length, posts.length]);

    const openAssistant = () => {
        const trigger = document.querySelector('[aria-label="Open Jiji AI assistant"]');
        if (trigger instanceof HTMLElement) trigger.click();
    };

    return (
        <div ref={rootRef} className="relative w-full overflow-x-clip">
            <AnimalHighlightsSection animals={animals} loading={loading.animals} navigate={navigate} />
            <FloraHighlightsSection plants={plants} loading={loading.plants} navigate={navigate} />
            <TicketPricingSection navigate={navigate} />
            <MapTeaserSection navigate={navigate} />
            <UpcomingEventsSection events={events} loading={loading.events} navigate={navigate} />
            <ZootopiaSection />
            <ScannerTeaserSection navigate={navigate} />
            <JijiTeaserSection openAssistant={openAssistant} />
            <CommunityPreviewSection posts={posts} loading={loading.community} isAuthenticated={isAuthenticated} navigate={navigate} />
            <DonationSection config={donationConfig} loading={loading.donation} navigate={navigate} />
            <BookingProcessSection navigate={navigate} />
            <FAQSection />
            <ContactSupportSection navigate={navigate} />
            <VisitorInfoSection />
            <ReviewsSection />
            <GallerySection animals={animals} plants={plants} events={events} posts={posts} />
            <StaffSpotlightSection />
            <NewsletterSection />
        </div>
    );
};

const Home = () => {
    const [reduceMotion, setReduceMotion] = React.useState(false);

    React.useEffect(() => {
        const media = window.matchMedia('(prefers-reduced-motion: reduce)');
        const update = () => setReduceMotion(media.matches);
        update();
        media.addEventListener('change', update);
        return () => media.removeEventListener('change', update);
    }, []);

    return (
        <ReactLenis
            root
            options={{
                lerp: reduceMotion ? 1 : 0.05,
                duration: reduceMotion ? 0 : 1.5,
                easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
                smoothWheel: !reduceMotion,
                smoothTouch: false,
                wheelMultiplier: 1.05,
                touchMultiplier: 2,
                infinite: false
            }}
        >
            <div className="relative min-h-[100dvh] bg-white">
                <Header />
                <AIFloatingButton />

                <main className="relative w-full overflow-x-clip">
                    <div className="relative z-0">
                        <HeroSection />
                    </div>

                    <div className="relative z-10">
                        <AboutSection />
                        <CinematicSections />
                    </div>
                </main>

                <div className="relative z-50 w-full">
                    <Footer />
                </div>
            </div>
        </ReactLenis>
    );
};

export default Home;
