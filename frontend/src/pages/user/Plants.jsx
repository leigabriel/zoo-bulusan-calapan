import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { ReactLenis } from 'lenis/react';
import AIFloatingButton from '../../components/common/AIFloatingButton';
import { userAPI } from '../../services/api-client';

gsap.registerPlugin(ScrollTrigger);

const deduplicateById = (arr) => {
    const seen = new Set();
    return arr.filter(item => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
    });
};

const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
    </svg>
);

const PlantCard = ({ plant, onClick }) => {
    const imgRef = useRef(null);

    const handleMouseEnter = () => {
        gsap.to(imgRef.current, { scale: 1.05, duration: 0.6, ease: 'power3.out', overwrite: 'auto' });
    };

    const handleMouseLeave = () => {
        gsap.to(imgRef.current, { scale: 1, duration: 0.6, ease: 'power3.out', overwrite: 'auto' });
    };

    return (
        <div
            className="plant-card flex flex-col cursor-pointer group"
            onClick={() => onClick(plant)}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <div className="w-full aspect-square overflow-hidden bg-gray-100 mb-4">
                {plant.imageUrl ? (
                    <img
                        ref={imgRef}
                        src={plant.imageUrl}
                        alt={plant.name}
                        className="w-full h-full object-cover origin-center"
                    />
                ) : (
                    <div ref={imgRef} className="w-full h-full flex items-center justify-center bg-gray-100">
                        <span className="font-bold text-5xl text-gray-300 uppercase">{plant.name[0]}</span>
                    </div>
                )}
            </div>

            <div className="flex justify-between items-baseline mb-1">
                <span className="font-medium text-black text-lg">{plant.name}</span>
                <span className="text-sm font-medium text-black">Zoo Bulusan</span>
            </div>
            <div className="text-sm text-gray-500">{plant.category}</div>
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
            className="fixed inset-0 z-[300] flex items-center justify-center p-4 md:p-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
        >
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            <motion.div
                className="relative z-10 flex flex-col md:flex-row bg-white w-full h-full md:h-auto md:max-w-6xl md:max-h-[85vh] overflow-hidden rounded-none md:rounded-xl shadow-2xl"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
            >
                {/* Left Side: Image */}
                <div className="w-full md:w-1/2 h-64 md:h-auto bg-gray-100 relative shrink-0">
                    {plant.imageUrl ? (
                        <img
                            src={plant.imageUrl}
                            alt={plant.name}
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                            <span className="text-9xl font-bold uppercase text-gray-200">
                                {plant.name[0]}
                            </span>
                        </div>
                    )}
                </div>

                {/* Right Side: Content */}
                <div className="w-full md:w-1/2 flex flex-col p-6 md:p-12 overflow-y-auto">
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                <span className="text-xs tracking-widest uppercase font-bold text-gray-500">
                                    Botanical Collection
                                </span>
                            </div>
                            <h2 className="text-5xl md:text-6xl text-black tracking-tight leading-none">
                                {plant.name}
                            </h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-3 bg-gray-100 hover:bg-gray-200 text-black rounded-full transition-colors cursor-pointer shrink-0"
                            aria-label="Close"
                        >
                            <CloseIcon />
                        </button>
                    </div>

                    <div className="flex-1">
                        {plant.category && (
                            <div className="mb-8">
                                <p className="text-xs tracking-widest uppercase font-bold text-gray-400 mb-1">Category</p>
                                <p className="text-lg font-medium text-black">{plant.category}</p>
                            </div>
                        )}

                        <div className="mb-8">
                            <p className="text-xs tracking-widest uppercase font-bold text-gray-400 mb-3">Description</p>
                            <p className="text-lg leading-relaxed text-gray-700">
                                {plant.description || "A beautiful specimen in our botanical collection."}
                            </p>
                        </div>
                    </div>

                    <div className="pt-8 mt-4 border-t border-gray-200 flex justify-between items-center">
                        <span className="text-xs tracking-widest uppercase font-bold text-gray-400">
                            Location: Zoo Bulusan
                        </span>
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
    const gridRef = useRef(null);

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

    useEffect(() => {
        if (!loading && plants.length > 0) {
            const ctx = gsap.context(() => {
                // Scroll animation for grid items
                gsap.fromTo('.plant-card',
                    { y: 60, opacity: 0 },
                    {
                        y: 0,
                        opacity: 1,
                        duration: 0.8,
                        stagger: 0.1,
                        ease: 'power3.out',
                        scrollTrigger: {
                            trigger: gridRef.current,
                            start: 'top 85%',
                        }
                    }
                );
            }, gridRef);
            return () => ctx.revert();
        }
    }, [loading, plants]);

    return (
        <ReactLenis root>
            <div className="bg-white text-black relative min-h-screen">
                <Header />

                {/* Hero Section - Clean Style */}
                <div className="w-full min-h-[50vh] md:min-h-[60vh] flex flex-col items-center justify-center px-4 pt-20">
                    <h1 className="text-[4rem] sm:text-[6rem] md:text-[8rem] lg:text-[10rem] leading-none tracking-tight text-black text-center">
                        Discover Our Plants
                    </h1>
                </div>

                {/* Grid Section */}
                <main ref={gridRef} className="relative z-10 w-full bg-white min-h-screen px-4 md:px-8 pb-32 max-w-[1800px] mx-auto">
                    {loading && (
                        <div className="flex items-center justify-center py-40">
                            <div className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-black animate-spin" />
                        </div>
                    )}

                    {!loading && error && (
                        <div className="flex flex-col items-center gap-4 py-32 px-6">
                            <p className="text-sm tracking-widest uppercase font-bold text-gray-400">{error}</p>
                            <button
                                onClick={fetchPlants}
                                className="text-xs tracking-widest uppercase font-black text-black border-2 border-black px-6 py-3 hover:bg-black hover:text-white transition-colors cursor-pointer"
                            >
                                Retry
                            </button>
                        </div>
                    )}

                    {!loading && !error && plants.length === 0 && (
                        <p className="text-center py-40 text-4xl md:text-6xl text-gray-300">
                            No plants available
                        </p>
                    )}

                    {!loading && !error && plants.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 md:gap-x-8 gap-y-12 md:gap-y-16">
                            {plants.map((plant) => (
                                <PlantCard
                                    key={plant.id}
                                    plant={plant}
                                    onClick={setSelectedPlant}
                                />
                            ))}
                        </div>
                    )}
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
                <Footer />
            </div>
        </ReactLenis>
    );
};

export default Plants;