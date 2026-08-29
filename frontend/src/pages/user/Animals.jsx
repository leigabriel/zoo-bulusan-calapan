import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
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

const AnimalCard = ({ animal }) => {
    const imgRef = useRef(null);
    const status = getStatus(animal.status);

    const handleMouseEnter = () => {
        gsap.to(imgRef.current, { scale: 1.05, duration: 0.6, ease: 'power3.out', overwrite: 'auto' });
    };

    const handleMouseLeave = () => {
        gsap.to(imgRef.current, { scale: 1, duration: 0.6, ease: 'power3.out', overwrite: 'auto' });
    };

    return (
        <Link to={`/animals/${animal.id}`} className="animal-card group flex cursor-pointer flex-col" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            <div className="mb-4 aspect-square w-full overflow-hidden rounded-xl bg-gray-100">
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
        </Link>
    );
};

const Animals = () => {
    const [animals, setAnimals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
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
                    <h1 className="w-full max-w-full text-center text-[clamp(3rem,12vw,11rem)] font-bold leading-[1.05] tracking-tight text-black">Meet Our Animals</h1>
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
                                />
                            ))}
                        </div>
                    )}
                </main>

                <AIFloatingButton />
                <Footer />
            </div>
        </ReactLenis>
    );
};

export default Animals;