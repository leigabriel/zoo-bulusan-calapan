import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { userAPI } from '../../services/api-client';

const PawIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
        <circle cx="11" cy="4" r="2"/>
        <circle cx="18" cy="8" r="2"/>
        <circle cx="20" cy="16" r="2"/>
        <path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z"/>
    </svg>
);

const AnimalDex = () => {
    const [animals, setAnimals] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedAnimal, setSelectedAnimal] = useState(null);
    const [loading, setLoading] = useState(true);

    const categories = ['All', 'Mammals', 'Birds', 'Reptiles', 'Amphibians', 'Fish'];

    useEffect(() => {
        fetchAnimals();
    }, []);

    const fetchAnimals = async () => {
        try {
            const response = await userAPI.getAnimals();
            if (response.success) {
                setAnimals(response.data);
            }
        } catch (error) {
            console.error('Error fetching animals:', error);
            setAnimals([
                { id: 1, name: 'African Lion', species: 'Panthera leo', category: 'Mammals', status: 'healthy', image: null, description: 'The lion is a large cat of the genus Panthera native to Africa and India.' },
                { id: 2, name: 'Asian Elephant', species: 'Elephas maximus', category: 'Mammals', status: 'healthy', image: null, description: 'The Asian elephant is the largest living land animal in Asia.' },
                { id: 3, name: 'Bengal Tiger', species: 'Panthera tigris tigris', category: 'Mammals', status: 'healthy', image: null, description: 'The Bengal tiger is a population of the Panthera tigris tigris subspecies.' },
                { id: 4, name: 'Giant Panda', species: 'Ailuropoda melanoleuca', category: 'Mammals', status: 'healthy', image: null, description: 'The giant panda is a bear species endemic to China.' },
                { id: 5, name: 'Giraffe', species: 'Giraffa', category: 'Mammals', status: 'healthy', image: null, description: 'The giraffe is the tallest living terrestrial animal.' },
                { id: 6, name: 'Zebra', species: 'Equus quagga', category: 'Mammals', status: 'healthy', image: null, description: 'Zebras are African equines with distinctive black-and-white striped coats.' },
                { id: 7, name: 'Peacock', species: 'Pavo cristatus', category: 'Birds', status: 'healthy', image: null, description: 'The Indian peafowl is known for its colorful plumage.' },
                { id: 8, name: 'Flamingo', species: 'Phoenicopterus', category: 'Birds', status: 'healthy', image: null, description: 'Flamingos are known for standing on one leg.' }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const filteredAnimals = animals.filter(animal => {
        const matchesSearch = animal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            animal.species.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || animal.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />
            <section className="bg-gradient-to-r from-green-600 to-teal-500 text-white py-16 px-4">
                <div className="max-w-6xl mx-auto text-center">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">AnimalDex</h1>
                    <p className="text-xl opacity-90 mb-8">Discover our amazing collection of wildlife</p>
                    <div className="max-w-xl mx-auto">
                        <input
                            type="text"
                            placeholder="Search animals..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-6 py-4 rounded-full text-gray-800 focus:outline-none focus:ring-4 focus:ring-white/30"
                        />
                    </div>
                </div>
            </section>

            <div className="max-w-6xl mx-auto px-4 py-8">
                <div className="flex flex-wrap gap-2 mb-8 justify-center">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-4 py-2 rounded-full font-medium transition ${
                                selectedCategory === cat
                                    ? 'bg-green-600 text-white'
                                    : 'bg-white text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredAnimals.map(animal => (
                        <div
                            key={animal.id}
                            onClick={() => setSelectedAnimal(animal)}
                            className="bg-white rounded-2xl shadow-sm overflow-hidden cursor-pointer hover:shadow-lg transition transform hover:-translate-y-1"
                        >
                            <div className="h-40 bg-gradient-to-br from-green-100 to-teal-100 flex items-center justify-center">
                                {animal.image ? (
                                    <img src={animal.image} alt={animal.name} className="w-full h-full object-cover" />
                                ) : (
                                    <PawIcon className="w-16 h-16 text-green-400" />
                                )}
                            </div>
                            <div className="p-4">
                                <h3 className="font-bold text-gray-800">{animal.name}</h3>
                                <p className="text-sm text-gray-500 italic">{animal.species}</p>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                                        {animal.category}
                                    </span>
                                    <span className={`px-2 py-1 rounded-full text-xs ${
                                        animal.status === 'healthy' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
                                    }`}>
                                        {animal.status}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredAnimals.length === 0 && (
                    <div className="text-center py-12">
                        <div className="flex justify-center mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-16 h-16 text-gray-300">
                                <circle cx="11" cy="11" r="8"/>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                            </svg>
                        </div>
                        <p className="text-gray-500">No animals found matching your search</p>
                    </div>
                )}
            </div>

            {selectedAnimal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedAnimal(null)}>
                    <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="h-48 bg-gradient-to-br from-green-400 to-teal-400 flex items-center justify-center">
                            {selectedAnimal.image ? (
                                <img src={selectedAnimal.image} alt={selectedAnimal.name} className="w-full h-full object-cover" />
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" className="w-24 h-24 opacity-70">
                                    <circle cx="11" cy="4" r="2"/>
                                    <circle cx="18" cy="8" r="2"/>
                                    <circle cx="20" cy="16" r="2"/>
                                    <path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z"/>
                                </svg>
                            )}
                        </div>
                        <div className="p-6">
                            <h2 className="text-2xl font-bold text-gray-800 mb-1">{selectedAnimal.name}</h2>
                            <p className="text-gray-500 italic mb-4">{selectedAnimal.species}</p>
                            <p className="text-gray-600 mb-4">{selectedAnimal.description}</p>
                            <div className="flex gap-2 mb-6">
                                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                                    {selectedAnimal.category}
                                </span>
                                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm capitalize">
                                    {selectedAnimal.status}
                                </span>
                            </div>
                            <button
                                onClick={() => setSelectedAnimal(null)}
                                className="w-full py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <Footer />
        </div>
    );
};

export default AnimalDex;
