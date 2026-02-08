import { useState, useEffect } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import AIFloatingButton from '../../components/common/AIFloatingButton';
import { userAPI } from '../../services/api-client';

// Icons
const Icons = {
    Location: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-green-600">
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
    ),
    Search: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
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

    const filteredAnimals = animals.filter(animal => {
        return filter === 'All' || animal.species === filter;
    });

    const getStatusInfo = (status) => {
        switch (status?.toLowerCase()) {
            case 'healthy': return { label: 'Healthy', color: 'bg-green-100 text-green-700' };
            case 'sick': return { label: 'Under Care', color: 'bg-red-100 text-red-700' };
            case 'recovering': return { label: 'Recovering', color: 'bg-yellow-100 text-yellow-700' };
            default: return { label: status || 'Active', color: 'bg-green-100 text-green-700' };
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Header />
            <section className="relative text-white py-28 sm:py-32 md:py-40 text-center bg-cover bg-center px-4" style={{ backgroundImage: 'linear-gradient(rgba(45,90,39,0.85), rgba(58,140,125,0.85)), url(https://images.unsplash.com/photo-1548013146-72479768bada)' }}>
                <div className="relative z-10 animate-fade-in-up mt-22">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 tracking-tight">Meet Our Animals</h1>
                    <p className="text-base sm:text-lg md:text-xl max-w-2xl mx-auto opacity-90 font-light">Discover the incredible wildlife at Zoo Bulusan Calapan.</p>
                </div>
            </section>

            <div className="container mx-auto px-4 py-8 sm:py-12 md:py-16 flex-grow">
                <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-8 sm:mb-12">
                    {uniqueSpecies.slice(0, 5).map(species => (
                        <button key={species} onClick={() => setFilter(species)}
                            className={`px-5 sm:px-8 py-2 sm:py-3 rounded-full font-semibold text-sm sm:text-base transition-all transform hover:-translate-y-1 shadow-sm ${filter === species ? 'bg-gradient-to-r from-green-600 to-teal-600 text-white shadow-lg' : 'bg-white text-green-800 hover:bg-green-50 border border-green-100'}`}>
                            {species}
                        </button>
                    ))}
                </div>

                {loading && (
                    <div className="flex items-center justify-center py-16">
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-gray-500">Loading animals...</span>
                        </div>
                    </div>
                )}

                {error && !loading && (<div className="text-center py-16 text-red-500">{error}</div>)}

                {!loading && !error && filteredAnimals.length === 0 && (
                    <div className="text-center py-16">
                        <div className="text-gray-400 mb-4 flex justify-center"><Icons.Empty /></div>
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">No Animals Found</h3>
                        <p className="text-gray-500">{filter !== 'All' ? 'Try selecting a different filter.' : 'Animals will appear here once added.'}</p>
                    </div>
                )}

                {!loading && !error && filteredAnimals.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
                        {filteredAnimals.map((animal) => {
                            const statusInfo = getStatusInfo(animal.status);
                            return (
                                <div key={animal.id} className="group bg-white rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:-translate-y-2 cursor-pointer"
                                    onClick={() => setSelectedAnimal(animal)}>
                                    <div className={`h-48 sm:h-56 bg-gradient-to-br ${animal.colorVariant} flex items-center justify-center relative overflow-hidden`}>
                                        {animal.imageUrl ? (
                                            <img src={animal.imageUrl} alt={animal.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                        ) : (
                                            <div className="text-white text-6xl font-bold opacity-50">{animal.name?.charAt(0)}</div>
                                        )}
                                    </div>
                                    <div className="p-5 sm:p-6">
                                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-4">
                                            <div>
                                                <h3 className="font-bold text-gray-800 text-xl mb-1">{animal.name}</h3>
                                                <p className="text-sm text-gray-500 italic">{animal.species}</p>
                                            </div>
                                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 w-fit ${statusInfo.color}`}>
                                                <span className="w-2 h-2 rounded-full bg-current opacity-70"></span>
                                                {statusInfo.label}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-500 text-sm mb-4">
                                            <Icons.Location /><span>{animal.exhibit}</span>
                                        </div>
                                        {animal.description && <p className="text-gray-600 text-sm line-clamp-2 mb-4">{animal.description}</p>}
                                        <button className="w-full py-3 rounded-xl bg-gray-50 text-green-800 font-bold text-sm hover:bg-green-600 hover:text-white transition-colors duration-300 flex items-center justify-center gap-2">
                                            View Details
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                                                <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {selectedAnimal && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
                        <div className={`h-48 sm:h-64 relative bg-gradient-to-br ${selectedAnimal.colorVariant}`}>
                            {selectedAnimal.imageUrl && <img src={selectedAnimal.imageUrl} alt={selectedAnimal.name} className="w-full h-full object-cover" />}
                            <button onClick={() => setSelectedAnimal(null)} className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white transition"><Icons.Close /></button>
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
                                <h2 className="text-2xl sm:text-3xl font-bold text-white">{selectedAnimal.name}</h2>
                                <p className="text-white/80 italic">{selectedAnimal.species}</p>
                            </div>
                        </div>
                        <div className="p-6 sm:p-8 overflow-y-auto max-h-[calc(90vh-16rem)]">
                            <div className="flex flex-wrap gap-4 mb-6">
                                <div className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-full"><Icons.Location /><span className="text-gray-700 font-medium">{selectedAnimal.exhibit}</span></div>
                                <span className={`px-4 py-2 rounded-full text-sm font-bold ${getStatusInfo(selectedAnimal.status).color}`}>{getStatusInfo(selectedAnimal.status).label}</span>
                            </div>
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-2">About</h3>
                                <p className="text-gray-600 leading-relaxed">{selectedAnimal.description || `${selectedAnimal.name} is one of our beloved residents at Zoo Bulusan Calapan.`}</p>
                            </div>
                            <button onClick={() => setSelectedAnimal(null)} className="w-full py-4 bg-gradient-to-r from-green-600 to-teal-600 text-white font-bold rounded-xl hover:from-green-700 hover:to-teal-700 transition shadow-lg">Close</button>
                        </div>
                    </div>
                </div>
            )}
            <Footer />
            <AIFloatingButton />
        </div>
    );
};

export default Animals;