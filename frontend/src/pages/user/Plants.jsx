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

const deduplicateById = (arr) => {
    const seen = new Set();
    return arr.filter((item) => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
    });
};

const PlantCard = ({ plant }) => {
    const imgRef = useRef(null);
    const zoom = (scale) => gsap.to(imgRef.current, { scale, duration: 0.45, ease: 'power3.out', overwrite: 'auto' });

    return (
        <Link to={`/plants/${plant.id}`} className="plant-card group flex cursor-pointer flex-col" onMouseEnter={() => zoom(1.05)} onMouseLeave={() => zoom(1)}>
            <div className="mb-4 aspect-square w-full overflow-hidden rounded-xl bg-gray-100">
                {plant.imageUrl ? <img ref={imgRef} src={plant.imageUrl} alt={plant.name} className="h-full w-full origin-center object-cover" /> : <div ref={imgRef} className="flex h-full w-full items-center justify-center bg-gray-100"><span className="text-5xl font-bold uppercase text-gray-300">{plant.name[0]}</span></div>}
            </div>
            <div className="mb-1 flex items-baseline justify-between gap-3">
                <span className="text-lg font-medium text-black">{plant.name}</span>
                <span className="text-sm font-medium text-black">Zoo Bulusan</span>
            </div>
            <div className="text-sm text-gray-500">{plant.category}</div>
        </Link>
    );
};

const Plants = () => {
    const [plants, setPlants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const gridRef = useRef(null);

    const fetchPlants = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            const response = await userAPI.getPlants();
            if (response.success && Array.isArray(response.plants)) {
                setPlants(deduplicateById(response.plants.map((p) => ({ id: p.id, name: p.name, category: p.category || 'Flora', description: p.description || '', imageUrl: p.image_url || null }))));
            } else setPlants([]);
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
                gsap.fromTo('.plant-card', { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: 'power3.out', scrollTrigger: { trigger: gridRef.current, start: 'top 85%' } });
            }, gridRef);
            return () => ctx.revert();
        }
    }, [loading, plants]);

    return (
        <ReactLenis root>
            <div className="relative min-h-screen bg-white text-black">
                <Header />
                <div className="flex min-h-[50vh] w-full flex-col items-center justify-center px-4 pt-20 md:min-h-[60vh]">
                    <h1 className="w-full max-w-full text-center text-[clamp(3rem,11vw,10rem)] font-bold leading-[1.05] tracking-tight">Discover Our Plants</h1>
                </div>
                <main ref={gridRef} className="relative z-10 mx-auto min-h-screen w-full max-w-[1800px] bg-white px-4 pb-32 md:px-8">
                    {loading && <div className="flex items-center justify-center py-40"><div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-black" /></div>}
                    {!loading && error && <div className="flex flex-col items-center gap-4 px-6 py-32"><p className="text-center text-sm font-bold uppercase tracking-widest text-gray-400">{error}</p><button onClick={fetchPlants} className="cursor-pointer border-2 border-black px-6 py-3 text-xs font-black uppercase tracking-widest transition-colors hover:bg-black hover:text-white">Retry</button></div>}
                    {!loading && !error && plants.length === 0 && <p className="py-40 text-center text-4xl text-gray-300 md:text-6xl">No plants available</p>}
                    {!loading && !error && plants.length > 0 && <div className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 md:gap-x-8 md:gap-y-16 lg:grid-cols-4">{plants.map((plant) => <PlantCard key={plant.id} plant={plant} />)}</div>}
                </main>
                <AIFloatingButton />
                <Footer />
            </div>
        </ReactLenis>
    );
};

export default Plants;