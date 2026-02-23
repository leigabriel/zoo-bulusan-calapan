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
    Leaf: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-16 h-16">
            <path fillRule="evenodd" d="M12.963 2.286a.75.75 0 00-1.071-.136 9.742 9.742 0 00-3.539 6.177A7.547 7.547 0 016.648 6.61a.75.75 0 00-1.152-.082A9 9 0 1015.68 4.534a7.46 7.46 0 01-2.717-2.248zM15.75 14.25a3.75 3.75 0 11-7.313-1.172c.628.465 1.35.81 2.133 1a5.99 5.99 0 011.925-3.546 3.75 3.75 0 013.255 3.718z" clipRule="evenodd" />
        </svg>
    )
};

const DEFAULT_PLANT_IMAGES = [
    'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=800',
    'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=800',
    'https://images.unsplash.com/photo-1466781783364-36c955e42a7f?w=800',
    'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=800',
    'https://images.unsplash.com/photo-1502331538926-57d1c95a4e7c?w=800',
];

const colorVariants = [
    'from-green-400 to-green-600',
    'from-emerald-400 to-emerald-600',
    'from-teal-400 to-teal-600',
    'from-lime-400 to-lime-600',
    'from-cyan-400 to-cyan-600',
    'from-amber-400 to-amber-600',
];

const Plants = () => {
    const [plants, setPlants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedPlant, setSelectedPlant] = useState(null);
    const [filter, setFilter] = useState('All');

    useEffect(() => { fetchPlants(); }, []);

    const fetchPlants = async () => {
        try {
            setLoading(true);
            const response = await userAPI.getPlants();
            if (response.success && response.plants) {
                const transformed = response.plants.map((plant, idx) => ({
                    id: plant.id,
                    name: plant.name,
                    scientificName: plant.scientific_name || '',
                    category: plant.category || 'Flora',
                    location: plant.location || 'Zoo Bulusan',
                    description: plant.description || '',
                    status: plant.status || 'healthy',
                    careInstructions: plant.care_instructions || '',
                    isEndangered: plant.is_endangered || false,
                    imageUrl: plant.image_url || DEFAULT_PLANT_IMAGES[idx % DEFAULT_PLANT_IMAGES.length],
                    colorVariant: colorVariants[idx % colorVariants.length]
                }));
                setPlants(transformed);
            } else { setPlants([]); }
        } catch (err) {
            console.error(err);
            setError('Failed to load plants.');
            setPlants([]);
        } finally { setLoading(false); }
    };

    const uniqueCategories = ['All', ...new Set(plants.map(p => p.category).filter(Boolean))];
    const filteredPlants = plants.filter(plant => filter === 'All' || plant.category === filter);

    const getStatusInfo = (status) => {
        switch (status?.toLowerCase()) {
            case 'healthy': return { label: 'Healthy', color: 'text-green-700' };
            case 'needs_attention': return { label: 'Needs Attention', color: 'text-yellow-700' };
            case 'critical': return { label: 'Critical', color: 'text-red-700' };
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
                            Discover Our<br />Plants
                        </h1>
                        <p className="text-sm md:text-xl font-medium opacity-80 max-w-md leading-snug">
                            Explore the beautiful botanical collection at Zoo Bulusan Calapan and learn about our diverse plant species.
                        </p>
                    </div>
                </div>
            </section>

            <div className="container mx-auto px-4 md:px-6 py-4 md:py-12 flex-grow">
                <div className="flex flex-wrap gap-4 md:gap-8 mb-8 md:mb-16 border-b border-black/10 pb-4 overflow-x-auto no-scrollbar">
                    {uniqueCategories.slice(0, 8).map(category => (
                        <button key={category} onClick={() => setFilter(category)}
                            className={`text-[10px] md:text-xs uppercase tracking-widest transition-all whitespace-nowrap ${filter === category ? 'font-black border-b-2 border-black' : 'opacity-50 hover:opacity-100 font-bold'}`}>
                            {category}
                        </button>
                    ))}
                </div>

                {loading && (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}

                {!loading && !error && filteredPlants.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-16 h-16 mb-4 text-gray-300">
                            <Icons.Leaf />
                        </div>
                        <p className="text-lg font-medium text-gray-500">No plants available at the moment.</p>
                        <p className="text-sm text-gray-400 mt-1">Please check back later.</p>
                    </div>
                )}

                {!loading && !error && filteredPlants.length > 0 && (
                    <div className="grid grid-cols-3 gap-3 md:gap-x-12 md:gap-y-20">
                        {filteredPlants.map((plant) => (
                            <div key={plant.id} className="group cursor-pointer" onClick={() => setSelectedPlant(plant)}>
                                <div className="aspect-[3/4] md:aspect-[4/5] overflow-hidden mb-3 md:mb-6 bg-white shadow-sm relative">
                                    <img src={plant.imageUrl} alt={plant.name} className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700 ease-out" />
                                    {plant.isEndangered && (
                                        <span className="absolute top-2 right-2 bg-red-500 text-white text-[6px] md:text-[8px] uppercase tracking-wider font-bold px-2 py-1 rounded">
                                            Endangered
                                        </span>
                                    )}
                                </div>
                                <div className="text-left">
                                    <h3 className="text-[10px] md:text-2xl font-bold mb-1 uppercase tracking-tight leading-tight line-clamp-1">{plant.name}</h3>
                                    <p className="hidden md:block text-sm font-medium opacity-70 leading-snug mb-4 line-clamp-2">
                                        {plant.description || `${plant.name} is part of our botanical collection.`}
                                    </p>
                                    <div className="flex flex-col md:flex-row items-start md:items-center gap-1 md:gap-4 text-[7px] md:text-[10px] uppercase tracking-widest font-black opacity-40">
                                        <span className="flex items-center gap-0.5"><Icons.Location /> <span className="line-clamp-1">{plant.location}</span></span>
                                        <span className={getStatusInfo(plant.status).color}>{getStatusInfo(plant.status).label}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {selectedPlant && (
                <div className="fixed inset-0 bg-black/40 md:bg-[#ebebeb]/95 z-[100] flex items-center justify-center p-0 md:p-6 backdrop-blur-sm overflow-y-auto">
                    <button 
                        onClick={() => setSelectedPlant(null)} 
                        className="fixed top-6 right-6 md:absolute md:-top-12 md:-right-12 p-3 bg-white md:bg-transparent rounded-full md:rounded-none shadow-lg md:shadow-none z-[110] text-black transition-transform active:scale-95"
                    >
                        <Icons.Close />
                    </button>

                    <div className="max-w-4xl w-full h-full md:h-auto bg-[#F9F9F9] md:bg-transparent grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-12 items-center overflow-y-auto md:overflow-visible">
                        <div className="aspect-[4/5] md:aspect-[4/5] bg-white shadow-2xl overflow-hidden w-full relative">
                            <img src={selectedPlant.imageUrl} alt={selectedPlant.name} className="w-full h-full object-cover" />
                            {selectedPlant.isEndangered && (
                                <span className="absolute top-4 right-4 bg-red-500 text-white text-[10px] uppercase tracking-wider font-bold px-3 py-1.5 rounded">
                                    Endangered Species
                                </span>
                            )}
                        </div>
                        <div className="p-8 md:p-0">
                            <h2 className="text-4xl md:text-6xl font-bold uppercase mb-2 leading-tight tracking-tighter">{selectedPlant.name}</h2>
                            {selectedPlant.scientificName && (
                                <p className="text-sm md:text-base italic opacity-60 mb-2">{selectedPlant.scientificName}</p>
                            )}
                            <p className="text-[10px] md:text-xs uppercase tracking-[0.2em] mb-6 md:mb-8 font-black opacity-40">{selectedPlant.category}</p>
                            
                            <div className="space-y-6 md:space-y-8 mb-10 md:mb-12">
                                <div>
                                    <h4 className="text-[8px] md:text-[10px] uppercase tracking-widest font-black mb-1 md:mb-2 opacity-30">Location</h4>
                                    <p className="text-sm md:text-lg font-bold leading-tight">{selectedPlant.location}</p>
                                </div>
                                <div>
                                    <h4 className="text-[8px] md:text-[10px] uppercase tracking-widest font-black mb-1 md:mb-2 opacity-30">About</h4>
                                    <p className="text-sm md:text-lg font-medium leading-snug opacity-80">{selectedPlant.description || `A beautiful specimen in our botanical garden.`}</p>
                                </div>
                                {selectedPlant.careInstructions && (
                                    <div>
                                        <h4 className="text-[8px] md:text-[10px] uppercase tracking-widest font-black mb-1 md:mb-2 opacity-30">Care Information</h4>
                                        <p className="text-sm md:text-lg font-medium leading-snug opacity-80">{selectedPlant.careInstructions}</p>
                                    </div>
                                )}
                                <div className={`inline-block border border-black/10 px-3 py-1.5 md:px-4 md:py-2 text-[8px] md:text-[10px] uppercase tracking-widest font-black ${getStatusInfo(selectedPlant.status).color}`}>
                                    Status: {getStatusInfo(selectedPlant.status).label}
                                </div>
                            </div>
                            
                            <button onClick={() => setSelectedPlant(null)} className="w-full md:w-auto px-8 py-4 bg-[#2A2A2A] text-white text-[10px] md:text-xs uppercase tracking-[0.2em] font-bold hover:bg-black transition-all">
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

export default Plants;
