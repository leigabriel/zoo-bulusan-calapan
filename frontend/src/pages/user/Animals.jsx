import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { ReactLenis } from 'lenis/react';
import AIFloatingButton from '../../components/common/AIFloatingButton';
import { userAPI } from '../../services/api-client';

const statusMap = {
    healthy: { label: 'Healthy', dot: 'bg-green-400' },
    sick: { label: 'Under Care', dot: 'bg-red-400' },
    recovering: { label: 'Recovering', dot: 'bg-amber-400' },
};
const getStatus = (s) => statusMap[s?.toLowerCase()] ?? { label: s || 'Active', dot: 'bg-green-400' };

const deduplicateById = (arr) => {
    const seen = new Set();
    return arr.filter(item => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
    });
};

const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
        <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
    </svg>
);

const AnimalImage = ({ animal, big = false, hovered = false }) => (
    <div className="relative w-full overflow-hidden" style={{ aspectRatio: '1 / 1' }}>
        {animal.imageUrl ? (
            <motion.img
                src={animal.imageUrl}
                alt={animal.name}
                className="absolute inset-0 w-full h-full object-cover block"
                animate={{ scale: hovered ? 1.04 : 1 }}
                transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            />
        ) : (
            <div className="absolute inset-0 bg-[#212631]/5 flex items-center justify-center">
                <span className={`font-black uppercase text-[#212631]/10 tracking-tighter ${big ? 'text-7xl' : 'text-4xl'}`}>
                    {animal.name[0]}
                </span>
            </div>
        )}
    </div>
);

const CellMeta = ({ animal, index, big = false }) => {
    const status = getStatus(animal.status);
    const num = String(index + 1).padStart(3, '0');
    return (
        <div className={`flex items-center justify-between border-t border-[#212631]/10 ${big ? 'px-3.5 py-2.5' : 'px-2.5 py-1.5'}`}>
            <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden">
                <span className="text-[8px] tracking-[0.16em] uppercase font-bold text-[#212631]/30 shrink-0">{num}</span>
                <span className={`font-semibold text-[#212631] truncate ${big ? 'text-xs' : 'text-[10px]'}`}>
                    {animal.name}
                </span>
            </div>
            <span className={`shrink-0 rounded-full ml-2 ${status.dot} ${big ? 'w-1.5 h-1.5' : 'w-1.5 h-1.5'} opacity-50`} />
        </div>
    );
};

const BigCell = ({ animal, index, onClick }) => {
    const [hovered, setHovered] = useState(false);
    return (
        <div
            className="cursor-pointer bg-[#ebebeb] overflow-hidden flex flex-col border-r border-[#212631]/10"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onClick={() => onClick(animal)}
        >
            <AnimalImage animal={animal} big hovered={hovered} />
            <CellMeta animal={animal} index={index} big />
        </div>
    );
};

const SmallCell = ({ animal, index, onClick, borderRight = false, borderBottom = false }) => {
    const [hovered, setHovered] = useState(false);
    return (
        <div
            className={`cursor-pointer bg-[#ebebeb] overflow-hidden flex flex-col ${borderRight ? 'border-r border-[#212631]/10' : ''} ${borderBottom ? 'border-b border-[#212631]/10' : ''}`}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onClick={() => onClick(animal)}
        >
            <AnimalImage animal={animal} hovered={hovered} />
            <CellMeta animal={animal} index={index} />
        </div>
    );
};

const RowBlock = ({ group, startIndex, bigOnLeft, onClick }) => {
    const [bigAnimal, ...rest] = group;
    const smalls = rest.slice(0, 4);

    const BigSide = (
        <BigCell
            animal={bigAnimal}
            index={startIndex}
            onClick={onClick}
        />
    );

    const SmallSide = (
        <div className="grid grid-cols-2">
            {smalls.map((animal, i) => (
                <SmallCell
                    key={animal.id}
                    animal={animal}
                    index={startIndex + 1 + i}
                    onClick={onClick}
                    borderRight={i % 2 === 0}
                    borderBottom={i < 2 && smalls.length > 2}
                />
            ))}
        </div>
    );

    return (
        <div className="grid grid-cols-2 border-t border-l border-[#212631]/10">
            {bigOnLeft ? (
                <>
                    {BigSide}
                    {SmallSide}
                </>
            ) : (
                <>
                    <div className="border-r border-[#212631]/10">{SmallSide}</div>
                    {BigSide}
                </>
            )}
        </div>
    );
};

const Stat = ({ label, value }) => (
    <div>
        <p className="text-[8px] tracking-[0.18em] uppercase font-black text-[#212631]/30 mb-1">{label}</p>
        <p className="text-sm font-semibold text-[#212631]">{value}</p>
    </div>
);

const DetailModal = ({ animal, onClose }) => {
    const status = getStatus(animal.status);

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    const hasStats = animal.lifespan || animal.weight || animal.length;
    const hasHabDiet = animal.habitat || animal.diet;
    const hasInfo = animal.animalInformation || animal.description;

    return (
        <motion.div
            className="fixed inset-0 z-[300] flex items-center justify-center p-0 md:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
        >
            <div
                className="absolute inset-0 bg-[#212631]/50 backdrop-blur-sm"
                onClick={onClose}
            />

            <motion.div
                className="relative z-10 flex flex-col bg-[#ebebeb] border border-[#212631]/10 w-full h-full md:h-auto md:max-w-[760px] md:max-h-[85vh] overflow-hidden"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            >
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#212631]/10 shrink-0">
                    <div className="flex items-center gap-2.5">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${status.dot}`} />
                        <span className="text-[9px] tracking-[0.18em] uppercase font-bold text-[#212631]/40">
                            {animal.species} — {status.label}
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-7 h-7 flex items-center justify-center text-[#212631] opacity-40 hover:opacity-100 transition-opacity cursor-pointer"
                        aria-label="Close"
                    >
                        <CloseIcon />
                    </button>
                </div>

                <div className="flex flex-col md:flex-row flex-1 overflow-y-auto md:overflow-hidden">
                    <div className="shrink-0 md:w-[320px] p-5 border-b md:border-b-0 md:border-r border-[#212631]/10 flex items-start justify-center">
                        <div className="w-full overflow-hidden" style={{ aspectRatio: '1 / 1' }}>
                            {animal.imageUrl ? (
                                <img
                                    src={animal.imageUrl}
                                    alt={animal.name}
                                    className="w-full h-full object-cover block"
                                />
                            ) : (
                                <div className="w-full h-full bg-[#212631]/5 flex items-center justify-center">
                                    <span className="text-7xl font-black uppercase text-[#212631]/10 tracking-tighter">
                                        {animal.name[0]}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col p-5 md:overflow-y-auto">
                        <h2 className="font-black uppercase text-[#212631] leading-[0.88] tracking-tighter mb-5"
                            style={{ fontSize: 'clamp(24px, 3vw, 40px)' }}>
                            {animal.name}
                        </h2>

                        {hasStats && (
                            <div className="grid grid-cols-3 gap-3 pb-4 mb-4 border-b border-[#212631]/10">
                                {animal.lifespan && <Stat label="Lifespan" value={animal.lifespan} />}
                                {animal.weight && <Stat label="Weight" value={animal.weight} />}
                                {animal.length && <Stat label="Length" value={animal.length} />}
                            </div>
                        )}

                        {hasHabDiet && (
                            <div className="grid grid-cols-2 gap-3 pb-4 mb-4 border-b border-[#212631]/10">
                                {animal.habitat && <Stat label="Habitat" value={animal.habitat} />}
                                {animal.diet && <Stat label="Diet" value={animal.diet} />}
                            </div>
                        )}

                        {hasInfo && (
                            <p className="text-sm leading-relaxed text-[#212631]/55 flex-1">
                                {animal.animalInformation || animal.description}
                            </p>
                        )}

                        <div className="flex items-center justify-between pt-4 mt-4 border-t border-[#212631]/10">
                            <span className="text-[9px] tracking-[0.16em] uppercase font-bold text-[#212631]/30">
                                {animal.exhibit}
                            </span>
                            <button
                                onClick={onClose}
                                className="text-[9px] tracking-[0.18em] uppercase font-black text-[#212631] border border-[#212631]/20 px-4 py-2 hover:bg-[#212631] hover:text-[#ebebeb] transition-colors duration-150 cursor-pointer"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

const MobileCell = ({ animal, index, onClick }) => {
    const [hovered, setHovered] = useState(false);
    return (
        <div
            className="border-r border-b border-[#212631]/10 overflow-hidden bg-[#ebebeb] cursor-pointer flex flex-col"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onClick={() => onClick(animal)}
        >
            <AnimalImage animal={animal} hovered={hovered} />
            <CellMeta animal={animal} index={index} />
        </div>
    );
};

const Animals = () => {
    const [animals, setAnimals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedAnimal, setSelectedAnimal] = useState(null);

    const fetchAnimals = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            const response = await userAPI.getAnimals();
            if (response.success && Array.isArray(response.animals)) {
                const mapped = response.animals.map((a) => ({
                    id: a.id,
                    name: a.name,
                    species: a.species || 'Unknown',
                    exhibit: a.habitat || a.exhibit || 'Zoo Bulusan',
                    description: a.description || '',
                    status: a.status || 'healthy',
                    imageUrl: a.image_url || null,
                    lifespan: a.lifespan || null,
                    weight: a.weight || null,
                    length: a.length || null,
                    habitat: a.habitat || null,
                    diet: a.diet || null,
                    animalInformation: a.animal_information || a.animalInformation || null,
                }));
                setAnimals(deduplicateById(mapped));
            } else {
                setAnimals([]);
            }
        } catch {
            setError('Failed to load animals. Please try again.');
            setAnimals([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchAnimals(); }, [fetchAnimals]);

    const scrollToGrid = () => {
        document.getElementById('animals-grid')?.scrollIntoView({ behavior: 'smooth' });
    };

    const rows = [];
    for (let i = 0; i < animals.length; i += 5) {
        rows.push({ group: animals.slice(i, i + 5), startIndex: i });
    }

    return (
        <ReactLenis root>
            <div className="bg-[#ebebeb] text-[#212631] relative min-h-screen">
                <Header />

                {/* Sticky Intro Section (Updated to 80vh and perfectly centered) */}
                <div className="sticky top-0 w-full h-[80vh] flex flex-col items-center justify-center overflow-hidden z-0">
                    <div className="absolute inset-0 bg-[#26bc61]" />

                    <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 w-full max-w-5xl h-full">
                        <span className="text-[10px] tracking-[0.3em] uppercase font-bold text-[#212631]/40 mb-6 md:mb-10">
                            Zoo Bulusan Wildlife
                        </span>
                        <h1 className="font-normal uppercase text-[#212631] leading-[0.85] tracking-tighter"
                            style={{ fontSize: 'clamp(40px, 11vw, 130px)' }}>
                            Meet Our Animals
                        </h1>
                        <p className="mt-8 md:mt-10 text-xs md:text-sm tracking-[0.1em] text-[#212631]/60 max-w-2xl font-semibold uppercase leading-relaxed mb-10">
                            Discover the diverse species that call Zoo Bulusan home. Learn about their habitats, diets, and unique characteristics.
                            {!loading && animals.length > 0 && (
                                <span className="block mt-4 text-[#212631]/80 font-black">
                                    CURRENTLY CARING FOR {animals.length} ANIMALS
                                </span>
                            )}
                        </p>

                        <button
                            onClick={scrollToGrid}
                            className="px-8 py-4 bg-[#212631] text-[#ebebeb] border border-[#212631] text-[10px] tracking-[0.2em] uppercase font-black hover:bg-transparent hover:text-[#212631] transition-colors duration-300"
                        >
                            Explore The Grid
                        </button>
                    </div>

                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 opacity-60 cursor-pointer hover:opacity-100 transition-opacity" onClick={scrollToGrid}>
                        <span className="text-[9px] tracking-[0.2em] uppercase font-bold text-[#212631]">Scroll</span>
                        <motion.div
                            animate={{ y: [0, 8, 0] }}
                            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                            className="w-[1px] h-12 bg-gradient-to-b from-[#212631] to-transparent"
                        />
                    </div>
                </div>

                {/* Main Animal Grid Section */}
                <main id="animals-grid" className="relative z-10 w-full bg-[#ebebeb] border-t border-[#212631]/10 min-h-screen">
                    {loading && (
                        <div className="flex items-center justify-center py-40">
                            <motion.div
                                className="w-5 h-5 rounded-full border-[1.5px] border-[#212631]/15 border-t-[#212631]"
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 0.85, ease: 'linear' }}
                            />
                        </div>
                    )}

                    {!loading && error && (
                        <div className="flex flex-col items-center gap-3 py-32 px-6">
                            <p className="text-[10px] tracking-widest uppercase font-bold text-[#212631]/35">{error}</p>
                            <button
                                onClick={fetchAnimals}
                                className="text-[9px] tracking-[0.18em] uppercase font-black text-[#212631] border border-[#212631]/20 px-4 py-2 hover:bg-[#212631] hover:text-[#ebebeb] transition-colors cursor-pointer"
                            >
                                Retry
                            </button>
                        </div>
                    )}

                    {!loading && !error && animals.length === 0 && (
                        <p className="text-center py-40 font-black uppercase tracking-tighter text-[#212631]/6"
                            style={{ fontSize: 'clamp(32px, 5vw, 56px)' }}>
                            No animals available
                        </p>
                    )}

                    {!loading && !error && animals.length > 0 && (
                        <>
                            <div className="hidden md:block">
                                {rows.map(({ group, startIndex }, rowIdx) => (
                                    <RowBlock
                                        key={`row-${startIndex}`}
                                        group={group}
                                        startIndex={startIndex}
                                        bigOnLeft={rowIdx % 2 === 0}
                                        onClick={setSelectedAnimal}
                                    />
                                ))}
                            </div>

                            <div className="md:hidden grid grid-cols-2">
                                {animals.map((animal, idx) => (
                                    <MobileCell
                                        key={animal.id}
                                        animal={animal}
                                        index={idx}
                                        onClick={setSelectedAnimal}
                                    />
                                ))}
                            </div>
                        </>
                    )}

                    {/* Added a bottom padding/footer spacer to match the clean design */}
                    <div className="h-20 bg-[#ebebeb] border-t border-[#212631]/10"></div>
                </main>

                <AnimatePresence>
                    {selectedAnimal && (
                        <DetailModal
                            key={selectedAnimal.id}
                            animal={selectedAnimal}
                            onClose={() => setSelectedAnimal(null)}
                        />
                    )}
                </AnimatePresence>

                <AIFloatingButton />
            </div>
        </ReactLenis>
    );
};

export default Animals;