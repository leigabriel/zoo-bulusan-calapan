import { useState, useEffect } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { ReactLenis } from 'lenis/react';
import AIFloatingButton from '../../components/common/AIFloatingButton';
import { userAPI } from '../../services/api-client';

const Icons = {
    Location: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-2.5 h-2.5 md:w-3.5 md:h-3.5">
            <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
        </svg>
    ),
    Close: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
        </svg>
    ),
    Empty: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none" stroke="currentColor" strokeWidth="12" className="w-16 h-16">
            <path strokeLinecap="round" strokeLinejoin="round" d="M226.5 92.9c14.3 42.9-.3 86.2-32.6 96.8s-70.1-15.6-84.4-58.5s.3-86.2 32.6-96.8s70.1 15.6 84.4 58.5zM100.4 198.6c18.9 32.4 14.3 70.1-10.2 84.1s-59.7-.9-78.5-33.3S-2.7 179.3 21.8 165.3s59.7 .9 78.5 33.3zM69.2 401.2C121.6 259.9 214.7 224 256 224s134.4 35.9 186.8 177.2c3.6 9.7 5.2 20.1 5.2 30.5v1.6c0 25.8-20.9 46.7-46.7 46.7c-11.5 0-22.9-1.4-34-4.2l-88-22c-15.3-3.8-31.3-3.8-46.6 0l-88 22c-11.1 2.8-22.5 4.2-34 4.2C84.9 480 64 459.1 64 433.3v-1.6c0-10.4 1.6-20.8 5.2-30.5zM421.8 282.7c-24.5-14-29.1-51.7-10.2-84.1s54-47.3 78.5-33.3s29.1 51.7 10.2 84.1s-54 47.3-78.5 33.3zM310.1 189.7c-32.3-10.6-46.9-53.9-32.6-96.8s52.1-69.1 84.4-58.5s46.9 53.9 32.6 96.8s-52.1 69.1-84.4 58.5z" />
        </svg>
    )
};

const DEFAULT_ANIMAL_IMAGES = [
    'https://images.unsplash.com/photo-1474511320723-9a56873571b7?w=800',
    'https://images.unsplash.com/photo-1534567153574-2b12153a87f0?w=800',
    'https://images.unsplash.com/photo-1544985361-b420d7a77043?w=800',
    'https://images.unsplash.com/photo-1497752531616-c3afd9760a11?w=800',
    'https://images.unsplash.com/photo-1551085254-e96b210db58a?w=800',
];

const colorVariants = [
    'from-amber-400 to-amber-600',
    'from-blue-400 to-blue-600',
    'from-green-400 to-green-600',
    'from-red-400 to-red-600',
    'from-purple-400 to-purple-600',
    'from-teal-400 to-teal-600',
];

const Animals = () => {
    const [animals, setAnimals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedAnimal, setSelectedAnimal] = useState(null);
    const [filter, setFilter] = useState('All');

    useEffect(() => { fetchAnimals(); }, []);

    const fetchAnimals = async () => {
        try {
            setLoading(true);
            const response = await userAPI.getAnimals();
            if (response.success && response.animals) {
                const transformed = response.animals.map((animal, idx) => ({
                    id: animal.id,
                    name: animal.name,
                    species: animal.species || 'Unknown',
                    exhibit: animal.habitat || animal.exhibit || 'Zoo Bulusan',
                    description: animal.description || '',
                    status: animal.status || 'healthy',
                    imageUrl: animal.image_url || DEFAULT_ANIMAL_IMAGES[idx % DEFAULT_ANIMAL_IMAGES.length],
                    colorVariant: colorVariants[idx % colorVariants.length]
                }));
                setAnimals(transformed);
            } else { setAnimals([]); }
        } catch (err) {
            console.error(err);
            setError('Failed to load animals.');
            setAnimals([]);
        } finally { setLoading(false); }
    };

    const uniqueSpecies = ['All', ...new Set(animals.map(a => a.species).filter(Boolean))];
    const filteredAnimals = animals.filter(animal => filter === 'All' || animal.species === filter);

    const getStatusInfo = (status) => {
        switch (status?.toLowerCase()) {
            case 'healthy': return { label: 'Healthy', color: 'text-green-700' };
            case 'sick': return { label: 'Under Care', color: 'text-red-700' };
            case 'recovering': return { label: 'Recovering', color: 'text-yellow-700' };
            default: return { label: status || 'Active', color: 'text-green-700' };
        }
    };

    return (
        <ReactLenis root>
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex flex-col text-[#2A2A2A]">
            <Header />
            
            <section className="relative px-4 md:px-6 pt-24 pb-8 md:pt-40 md:pb-16 max-w-7xl mx-auto w-full">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                    <div className="max-w-2xl text-left">
                        <h1 className="text-3xl md:text-7xl lg:text-8xl font-bold uppercase leading-tight md:leading-[0.9] tracking-tighter mb-4 md:mb-8">
                            Meet Our<br />Animals
                        </h1>
                        <p className="text-sm md:text-xl font-medium opacity-80 max-w-md leading-snug">
                            Discover the incredible wildlife at Zoo Bulusan Calapan through our most beloved residents.
                        </p>
                    </div>
                </div>
            </section>

            <div className="container mx-auto px-4 md:px-6 py-4 md:py-12 flex-grow">
                <div className="flex flex-wrap gap-4 md:gap-8 mb-8 md:mb-16 border-b border-black/10 pb-4 overflow-x-auto no-scrollbar">
                    {uniqueSpecies.slice(0, 8).map(species => (
                        <button key={species} onClick={() => setFilter(species)}
                            className={`text-[10px] md:text-xs uppercase tracking-widest transition-all whitespace-nowrap ${filter === species ? 'font-black border-b-2 border-black' : 'opacity-50 hover:opacity-100 font-bold'}`}>
                            {species}
                        </button>
                    ))}
                </div>

                {loading && (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}

                {!loading && !error && (
                    <div className="grid grid-cols-3 gap-3 md:gap-x-12 md:gap-y-20">
                        {filteredAnimals.map((animal) => (
                            <div key={animal.id} className="group cursor-pointer" onClick={() => setSelectedAnimal(animal)}>
                                <div className="aspect-[3/4] md:aspect-[4/5] overflow-hidden mb-3 md:mb-6 bg-white shadow-sm">
                                    <img src={animal.imageUrl} alt={animal.name} className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700 ease-out" />
                                </div>
                                <div className="text-left">
                                    <h3 className="text-[10px] md:text-2xl font-bold mb-1 uppercase tracking-tight leading-tight line-clamp-1">{animal.name}</h3>
                                    <p className="hidden md:block text-sm font-medium opacity-70 leading-snug mb-4 line-clamp-2">
                                        {animal.description || `${animal.name} is one of our beloved residents.`}
                                    </p>
                                    <div className="flex flex-col md:flex-row items-start md:items-center gap-1 md:gap-4 text-[7px] md:text-[10px] uppercase tracking-widest font-black opacity-40">
                                        <span className="flex items-center gap-0.5"><Icons.Location /> <span className="line-clamp-1">{animal.exhibit}</span></span>
                                        <span className={getStatusInfo(animal.status).color}>{getStatusInfo(animal.status).label}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {selectedAnimal && (
                <div className="fixed inset-0 bg-black/40 md:bg-[#ebebeb]/95 z-[100] flex items-center justify-center p-0 md:p-6 backdrop-blur-sm overflow-y-auto">
                    {/* Fixed X Button for Mobile Accessibility */}
                    <button 
                        onClick={() => setSelectedAnimal(null)} 
                        className="fixed top-6 right-6 md:absolute md:-top-12 md:-right-12 p-3 bg-white md:bg-transparent rounded-full md:rounded-none shadow-lg md:shadow-none z-[110] text-black transition-transform active:scale-95"
                    >
                        <Icons.Close />
                    </button>

                    <div className="max-w-4xl w-full h-full md:h-auto bg-[#F9F9F9] md:bg-transparent grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-12 items-center overflow-y-auto md:overflow-visible">
                        <div className="aspect-[4/5] md:aspect-[4/5] bg-white shadow-2xl overflow-hidden w-full">
                            <img src={selectedAnimal.imageUrl} alt={selectedAnimal.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="p-8 md:p-0">
                            <h2 className="text-4xl md:text-6xl font-bold uppercase mb-2 leading-tight tracking-tighter">{selectedAnimal.name}</h2>
                            <p className="text-[10px] md:text-xs uppercase tracking-[0.2em] mb-6 md:mb-8 font-black opacity-40">{selectedAnimal.species}</p>
                            
                            <div className="space-y-6 md:space-y-8 mb-10 md:mb-12">
                                <div>
                                    <h4 className="text-[8px] md:text-[10px] uppercase tracking-widest font-black mb-1 md:mb-2 opacity-30">Habitat / Location</h4>
                                    <p className="text-sm md:text-lg font-bold leading-tight">{selectedAnimal.exhibit}</p>
                                </div>
                                <div>
                                    <h4 className="text-[8px] md:text-[10px] uppercase tracking-widest font-black mb-1 md:mb-2 opacity-30">About</h4>
                                    <p className="text-sm md:text-lg font-medium leading-snug opacity-80">{selectedAnimal.description || `A majestic resident of Zoo Bulusan Calapan.`}</p>
                                </div>
                                <div className={`inline-block border border-black/10 px-3 py-1.5 md:px-4 md:py-2 text-[8px] md:text-[10px] uppercase tracking-widest font-black ${getStatusInfo(selectedAnimal.status).color}`}>
                                    Status: {getStatusInfo(selectedAnimal.status).label}
                                </div>
                            </div>
                            
                            <button onClick={() => setSelectedAnimal(null)} className="w-full md:w-auto px-8 py-4 bg-[#2A2A2A] text-white text-[10px] md:text-xs uppercase tracking-[0.2em] font-bold hover:bg-black transition-all">
                                Return to Gallery
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <Footer />
            <AIFloatingButton />
        </div>
        </ReactLenis>
    );
};

export default Animals;