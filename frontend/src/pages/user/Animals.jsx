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

const statusMap = {
    healthy: { label: 'Healthy', dot: 'bg-green-500' },
    sick: { label: 'Under Care', dot: 'bg-red-500' },
    recovering: { label: 'Recovering', dot: 'bg-amber-500' },
};
const getStatus = (s) => statusMap[s?.toLowerCase()] ?? { label: s || 'Active', dot: 'bg-green-500' };

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

const AnimalCard = ({ animal, onClick }) => {
    const imgRef = useRef(null);
    const status = getStatus(animal.status);

    const handleMouseEnter = () => {
        gsap.to(imgRef.current, { scale: 1.05, duration: 0.6, ease: 'power3.out', overwrite: 'auto' });
    };

    const handleMouseLeave = () => {
        gsap.to(imgRef.current, { scale: 1, duration: 0.6, ease: 'power3.out', overwrite: 'auto' });
    };

    return (
        <div
            className="animal-card flex flex-col cursor-pointer group"
            onClick={() => onClick(animal)}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <div className="w-full aspect-square overflow-hidden bg-gray-100 mb-4">
                {animal.imageUrl ? (
                    <img
                        ref={imgRef}
                        src={animal.imageUrl}
                        alt={animal.name}
                        className="w-full h-full object-cover origin-center"
                    />
                ) : (
                    <div ref={imgRef} className="w-full h-full flex items-center justify-center bg-gray-100">
                        <span className="font-bold text-5xl text-gray-300 uppercase">{animal.name[0]}</span>
                    </div>
                )}
            </div>

            <div className="flex justify-between items-baseline mb-1">
                <span className="font-medium text-black text-lg">{animal.name}</span>
                <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                    <span className="text-sm font-medium text-black">{status.label}</span>
                </div>
            </div>
            <div className="text-sm text-gray-500">{animal.species}</div>
        </div>
    );
};

const Stat = ({ label, value }) => (
    <div className="mb-4">
        <p className="text-xs tracking-widest uppercase font-bold text-gray-400 mb-1">{label}</p>
        <p className="text-base font-medium text-black">{value}</p>
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
                    {animal.imageUrl ? (
                        <img
                            src={animal.imageUrl}
                            alt={animal.name}
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                            <span className="text-9xl font-bold uppercase text-gray-200">
                                {animal.name[0]}
                            </span>
                        </div>
                    )}
                </div>

                {/* Right Side: Content */}
                <div className="w-full md:w-1/2 flex flex-col p-6 md:p-12 overflow-y-auto">
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <span className={`w-2 h-2 rounded-full ${status.dot}`} />
                                <span className="text-xs tracking-widest uppercase font-bold text-gray-500">
                                    {animal.species} — {status.label}
                                </span>
                            </div>
                            <h2 className="text-5xl md:text-6xl text-black tracking-tight leading-none">
                                {animal.name}
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
                        {hasStats && (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-8">
                                {animal.lifespan && <Stat label="Lifespan" value={animal.lifespan} />}
                                {animal.weight && <Stat label="Weight" value={animal.weight} />}
                                {animal.length && <Stat label="Length" value={animal.length} />}
                            </div>
                        )}

                        {hasHabDiet && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                {animal.habitat && <Stat label="Habitat" value={animal.habitat} />}
                                {animal.diet && <Stat label="Diet" value={animal.diet} />}
                            </div>
                        )}

                        {hasInfo && (
                            <div className="mb-8">
                                <p className="text-xs tracking-widest uppercase font-bold text-gray-400 mb-3">About</p>
                                <p className="text-lg leading-relaxed text-gray-700">
                                    {animal.animalInformation || animal.description}
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="pt-8 mt-4 border-t border-gray-200 flex justify-between items-center">
                        <span className="text-xs tracking-widest uppercase font-bold text-gray-400">
                            Exhibit: {animal.exhibit}
                        </span>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

const Animals = () => {
    const [animals, setAnimals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedAnimal, setSelectedAnimal] = useState(null);
    const gridRef = useRef(null);

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

    useEffect(() => {
        if (!loading && animals.length > 0) {
            const ctx = gsap.context(() => {
                // Scroll animation for grid items
                gsap.fromTo('.animal-card',
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
    }, [loading, animals]);

    return (
        <ReactLenis root>
            <div className="bg-white text-black relative min-h-screen">
                <Header />

                {/* Hero Section - Clean Style */}
                <div className="w-full min-h-[50vh] md:min-h-[60vh] flex flex-col items-center justify-center px-4 pt-20">
                    <h1 className="text-[4rem] sm:text-[6rem] md:text-[9rem] lg:text-[11rem] leading-none tracking-tight text-black text-center">
                        Meet Our Animals
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
                                onClick={fetchAnimals}
                                className="text-xs tracking-widest uppercase font-black text-black border-2 border-black px-6 py-3 hover:bg-black hover:text-white transition-colors cursor-pointer"
                            >
                                Retry
                            </button>
                        </div>
                    )}

                    {!loading && !error && animals.length === 0 && (
                        <p className="text-center py-40 text-4xl md:text-6xl text-gray-300">
                            No animals available
                        </p>
                    )}

                    {!loading && !error && animals.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 md:gap-x-8 gap-y-12 md:gap-y-16">
                            {animals.map((animal) => (
                                <AnimalCard
                                    key={animal.id}
                                    animal={animal}
                                    onClick={setSelectedAnimal}
                                />
                            ))}
                        </div>
                    )}
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
                <Footer />
            </div>
        </ReactLenis>
    );
};

export default Animals;