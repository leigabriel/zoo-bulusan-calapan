import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { ReactLenis } from 'lenis/react';
import AIFloatingButton from '../../components/common/AIFloatingButton';
import { userAPI } from '../../services/api-client';

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

const PlantImage = ({ plant, big = false, hovered = false }) => (
    <div className="relative w-full overflow-hidden" style={{ aspectRatio: '1 / 1' }}>
        {plant.imageUrl ? (
            <motion.img
                src={plant.imageUrl}
                alt={plant.name}
                className="absolute inset-0 w-full h-full object-cover block"
                animate={{ scale: hovered ? 1.04 : 1 }}
                transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            />
        ) : (
            <div className="absolute inset-0 bg-[#212631]/5 flex items-center justify-center">
                <span className={`font-black uppercase text-[#212631]/10 tracking-tighter ${big ? 'text-7xl' : 'text-4xl'}`}>
                    {plant.name[0]}
                </span>
            </div>
        )}
    </div>
);

const CellMeta = ({ plant, index, big = false }) => {
    const num = String(index + 1).padStart(3, '0');
    return (
        <div className={`flex items-center justify-between border-t border-[#212631]/10 ${big ? 'px-3.5 py-2.5' : 'px-2.5 py-1.5'}`}>
            <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden">
                <span className="text-[8px] tracking-[0.16em] uppercase font-bold text-[#212631]/30 shrink-0">{num}</span>
                <span className={`font-semibold text-[#212631] truncate ${big ? 'text-xs' : 'text-[10px]'}`}>
                    {plant.name}
                </span>
            </div>
            <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-emerald-400 ml-2 opacity-50" />
        </div>
    );
};

const BigCell = ({ plant, index, onClick }) => {
    const [hovered, setHovered] = useState(false);
    return (
        <div
            className="cursor-pointer bg-[#ebebeb] overflow-hidden flex flex-col border-r border-[#212631]/10"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onClick={() => onClick(plant)}
        >
            <PlantImage plant={plant} big hovered={hovered} />
            <CellMeta plant={plant} index={index} big />
        </div>
    );
};

const SmallCell = ({ plant, index, onClick, borderRight = false, borderBottom = false }) => {
    const [hovered, setHovered] = useState(false);
    return (
        <div
            className={`cursor-pointer bg-[#ebebeb] overflow-hidden flex flex-col ${borderRight ? 'border-r border-[#212631]/10' : ''} ${borderBottom ? 'border-b border-[#212631]/10' : ''}`}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onClick={() => onClick(plant)}
        >
            <PlantImage plant={plant} hovered={hovered} />
            <CellMeta plant={plant} index={index} />
        </div>
    );
};

const RowBlock = ({ group, startIndex, bigOnLeft, onClick }) => {
    const [bigPlant, ...rest] = group;
    const smalls = rest.slice(0, 4);

    const BigSide = (
        <BigCell plant={bigPlant} index={startIndex} onClick={onClick} />
    );

    const SmallSide = (
        <div className="grid grid-cols-2">
            {smalls.map((plant, i) => (
                <SmallCell
                    key={plant.id}
                    plant={plant}
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

const MobileCell = ({ plant, index, onClick }) => {
    const [hovered, setHovered] = useState(false);
    return (
        <div
            className="border-r border-b border-[#212631]/10 overflow-hidden bg-[#ebebeb] cursor-pointer flex flex-col"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onClick={() => onClick(plant)}
        >
            <PlantImage plant={plant} hovered={hovered} />
            <CellMeta plant={plant} index={index} />
        </div>
    );
};

const DetailModal = ({ plant, onClose }) => {
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

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
                        <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-emerald-400" />
                        <span className="text-[9px] tracking-[0.18em] uppercase font-bold text-[#212631]/40">
                            {plant.category} — Zoo Bulusan
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
                            {plant.imageUrl ? (
                                <img
                                    src={plant.imageUrl}
                                    alt={plant.name}
                                    className="w-full h-full object-cover block"
                                />
                            ) : (
                                <div className="w-full h-full bg-[#212631]/5 flex items-center justify-center">
                                    <span className="text-7xl font-black uppercase text-[#212631]/10 tracking-tighter">
                                        {plant.name[0]}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col p-5 md:overflow-y-auto">
                        <h2
                            className="font-black uppercase text-[#212631] leading-[0.88] tracking-tighter mb-5"
                            style={{ fontSize: 'clamp(24px, 3vw, 40px)' }}
                        >
                            {plant.name}
                        </h2>

                        {plant.category && (
                            <div className="pb-4 mb-4 border-b border-[#212631]/10">
                                <p className="text-[8px] tracking-[0.18em] uppercase font-black text-[#212631]/30 mb-1">Category</p>
                                <p className="text-sm font-semibold text-[#212631]">{plant.category}</p>
                            </div>
                        )}

                        {plant.description && (
                            <p className="text-sm leading-relaxed text-[#212631]/55 flex-1">
                                {plant.description}
                            </p>
                        )}

                        {!plant.description && (
                            <p className="text-sm leading-relaxed text-[#212631]/35 flex-1 italic">
                                A beautiful specimen in our botanical collection.
                            </p>
                        )}

                        <div className="flex items-center justify-between pt-4 mt-4 border-t border-[#212631]/10">
                            <span className="text-[9px] tracking-[0.16em] uppercase font-bold text-[#212631]/30">
                                Zoo Bulusan
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

const Plants = () => {
    const [plants, setPlants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedPlant, setSelectedPlant] = useState(null);

    const fetchPlants = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            const response = await userAPI.getPlants();
            if (response.success && Array.isArray(response.plants)) {
                const mapped = response.plants.map((p) => ({
                    id: p.id,
                    name: p.name,
                    category: p.category || 'Flora',
                    description: p.description || '',
                    imageUrl: p.image_url || null,
                }));
                setPlants(deduplicateById(mapped));
            } else {
                setPlants([]);
            }
        } catch {
            setError('Failed to load plants. Please try again.');
            setPlants([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchPlants(); }, [fetchPlants]);

    const scrollToGrid = () => {
        document.getElementById('plants-grid')?.scrollIntoView({ behavior: 'smooth' });
    };

    const rows = [];
    for (let i = 0; i < plants.length; i += 5) {
        rows.push({ group: plants.slice(i, i + 5), startIndex: i });
    }

    return (
        <ReactLenis root>
            <div className="bg-[#ffdd45] text-[#212631] relative min-h-screen">
                <Header />

                {/* Sticky Intro Section */}
                <div className="sticky top-0 w-full h-[80vh] flex flex-col items-center justify-center overflow-hidden z-0">
                    <div className="absolute inset-0 bg-[#ffdd45]" />

                    <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 w-full max-w-5xl h-full">
                        <span className="text-[10px] tracking-[0.3em] uppercase font-bold text-[#212631]/40 mb-6 md:mb-10">
                            Zoo Bulusan Botanical
                        </span>
                        <h1 className="font-normal uppercase text-[#212631] leading-[0.85] tracking-tighter"
                            style={{ fontSize: 'clamp(40px, 11vw, 120px)' }}>
                            Discover Our Plants
                        </h1>
                        <p className="mt-8 md:mt-10 text-xs md:text-sm tracking-[0.1em] text-[#212631]/60 max-w-2xl font-semibold uppercase leading-relaxed mb-10">
                            Explore the lush flora that makes up the Zoo Bulusan ecosystem. Learn about various plant categories and their unique beauty.
                            {!loading && plants.length > 0 && (
                                <span className="block mt-4 text-[#212631]/80 font-black">
                                    CURRENTLY TENDING TO {plants.length} PLANT SPECIES
                                </span>
                            )}
                        </p>

                        <button
                            onClick={scrollToGrid}
                            className="px-8 py-4 bg-[#212631] text-[#ebebeb] border border-[#212631] text-[10px] tracking-[0.2em] uppercase font-black hover:bg-transparent hover:text-[#212631] transition-colors duration-300"
                        >
                            Explore The Garden
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

                {/* Main Plant Grid Section */}
                <main id="plants-grid" className="relative z-10 w-full bg-[#ebebeb] border-t border-[#212631]/10 min-h-screen">
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
                                onClick={fetchPlants}
                                className="text-[9px] tracking-[0.18em] uppercase font-black text-[#212631] border border-[#212631]/20 px-4 py-2 hover:bg-[#212631] hover:text-[#ebebeb] transition-colors cursor-pointer"
                            >
                                Retry
                            </button>
                        </div>
                    )}

                    {!loading && !error && plants.length === 0 && (
                        <p
                            className="text-center py-40 font-black uppercase tracking-tighter text-[#212631]/10"
                            style={{ fontSize: 'clamp(32px, 5vw, 56px)' }}
                        >
                            No plants available
                        </p>
                    )}

                    {!loading && !error && plants.length > 0 && (
                        <>
                            <div className="hidden md:block">
                                {rows.map(({ group, startIndex }, rowIdx) => (
                                    <RowBlock
                                        key={`row-${startIndex}`}
                                        group={group}
                                        startIndex={startIndex}
                                        bigOnLeft={rowIdx % 2 === 0}
                                        onClick={setSelectedPlant}
                                    />
                                ))}
                            </div>

                            <div className="md:hidden grid grid-cols-2 border-l border-t border-[#212631]/10">
                                {plants.map((plant, idx) => (
                                    <MobileCell
                                        key={plant.id}
                                        plant={plant}
                                        index={idx}
                                        onClick={setSelectedPlant}
                                    />
                                ))}
                            </div>
                        </>
                    )}

                    {/* Bottom Padding/Footer Spacer */}
                    <div className="h-20 bg-[#ebebeb] border-t border-[#212631]/10"></div>
                </main>

                <AnimatePresence>
                    {selectedPlant && (
                        <DetailModal
                            key={selectedPlant.id}
                            plant={selectedPlant}
                            onClose={() => setSelectedPlant(null)}
                        />
                    )}
                </AnimatePresence>

                <AIFloatingButton />
            </div>
        </ReactLenis>
    );
};

export default Plants;